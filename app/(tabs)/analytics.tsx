import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Flame, TrendingUp, TrendingDown } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface EnergyCardProps {
  title: string;
  value: string;
  unit: string;
  period: string;
  trend: 'up' | 'down';
  color: string[];
  icon: React.ReactNode;
}

function EnergyCard({ title, value, unit, period, trend, color, icon }: EnergyCardProps) {
  return (
    <LinearGradient
      colors={color}
      style={styles.energyCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.energyHeader}>
        <View style={styles.energyIcon}>
          {icon}
        </View>
        <View style={styles.trendContainer}>
          {trend === 'up' ? (
            <TrendingUp size={16} color="white" />
          ) : (
            <TrendingDown size={16} color="white" />
          )}
        </View>
      </View>
      <Text style={styles.energyValue}>{value}</Text>
      <Text style={styles.energyUnit}>{unit}</Text>
      <Text style={styles.energyPeriod}>{period}</Text>
      <Text style={styles.energyTitle}>{title}</Text>
    </LinearGradient>
  );
}

interface UsageBarProps {
  device: string;
  percentage: number;
  usage: string;
  color: string;
}

function UsageBar({ device, percentage, usage, color }: UsageBarProps) {
  return (
    <View style={styles.usageItem}>
      <View style={styles.usageHeader}>
        <Text style={styles.usageDevice}>{device}</Text>
        <Text style={styles.usageValue}>{usage}</Text>
      </View>
      <View style={styles.usageBarContainer}>
        <View 
          style={[
            styles.usageBarFill, 
            { width: `${percentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const deviceUsage = [
    { device: 'Smart Lights', percentage: 85, usage: '45 kWh', color: '#2563eb' },
    { device: 'Air Conditioning', percentage: 70, usage: '38 kWh', color: '#0ea5e9' },
    { device: 'Smart TV', percentage: 45, usage: '24 kWh', color: '#06b6d4' },
    { device: 'Air Purifier', percentage: 30, usage: '16 kWh', color: '#0891b2' },
    { device: 'Other Devices', percentage: 20, usage: '11 kWh', color: '#0e7490' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Energy Analytics</Text>
          <Text style={styles.subtitle}>Monitor your smart home consumption</Text>
        </View>

        {/* Energy Cards */}
        <View style={styles.energyGrid}>
          <EnergyCard
            title="Today's Usage"
            value="5"
            unit="kWh"
            period="Today"
            trend="down"
            color={['#2563eb', '#1d4ed8']}
            icon={<Zap size={24} color="white" />}
          />
          <EnergyCard
            title="Monthly Usage"
            value="120"
            unit="kWh"
            period="This month"
            trend="up"
            color={['#0ea5e9', '#0284c7']}
            icon={<Flame size={24} color="white" />}
          />
        </View>

        {/* Usage Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Usage Breakdown</Text>
          <View style={styles.usageContainer}>
            {deviceUsage.map((item, index) => (
              <UsageBar
                key={index}
                device={item.device}
                percentage={item.percentage}
                usage={item.usage}
                color={item.color}
              />
            ))}
          </View>
        </View>

        {/* Cost Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Summary</Text>
          <View style={styles.costContainer}>
            <View style={styles.costCard}>
              <Text style={styles.costLabel}>Today</Text>
              <Text style={styles.costValue}>$2.45</Text>
              <Text style={styles.costChange}>-12% from yesterday</Text>
            </View>
            <View style={styles.costCard}>
              <Text style={styles.costLabel}>This Month</Text>
              <Text style={styles.costValue}>$58.20</Text>
              <Text style={styles.costChange}>+8% from last month</Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Energy Saving Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>💡 Turn off lights when not in use to save up to 15% on electricity</Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>❄️ Set AC temperature to 24°C for optimal energy efficiency</Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>📺 Use sleep mode on TV to reduce standby power consumption</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 4,
  },
  energyGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  energyCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    padding: 20,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  energyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  energyValue: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  energyUnit: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
    opacity: 0.8,
    marginTop: -4,
  },
  energyPeriod: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'white',
    opacity: 0.7,
    marginTop: 8,
  },
  energyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  usageContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
  },
  usageItem: {
    marginBottom: 20,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageDevice: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  usageValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#94a3b8',
  },
  usageBarContainer: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  costContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    width: (width - 52) / 2,
  },
  costLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginBottom: 8,
  },
  costValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  costChange: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#06b6d4',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#cbd5e1',
    lineHeight: 20,
  },
});