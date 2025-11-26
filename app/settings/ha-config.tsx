import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useSmartHomeStore } from '@/store/useSmartHomeStore';
import { CustomAlert } from '../../components/CustomAlert';

export default function HAConfigScreen() {
  const router = useRouter();
  const { haConfig, updateHaConfig, isConnected } = useSmartHomeStore();
  
  const [url, setUrl] = useState(haConfig?.url || '');
  const [token, setToken] = useState(haConfig?.token || '');
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    if (haConfig) {
      setUrl(haConfig.url);
      setToken(haConfig.token);
    }
  }, [haConfig]);

  const handleSave = async () => {
    if (!url.trim()) {
      showAlert('Error', 'Please enter a valid Home Assistant URL', 'error');
      return;
    }
    if (!token.trim()) {
      showAlert('Error', 'Please enter a Long-Lived Access Token', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Basic URL validation
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `http://${formattedUrl}`;
      }
      // Remove trailing slash
      if (formattedUrl.endsWith('/')) {
        formattedUrl = formattedUrl.slice(0, -1);
      }

      await updateHaConfig({ url: formattedUrl, token: token.trim() });
      
      showAlert('Success', 'Configuration saved and connection tested!', 'success');
    } catch (error) {
      console.error('Failed to save config:', error);
      showAlert('Error', 'Failed to connect to Home Assistant. Please check your URL and Token.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info'
  ) => {
    setAlert({ visible: true, title, message, type });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>HA Configuration</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              Connect to your Home Assistant instance to control your devices.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Home Assistant URL</Text>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="http://192.168.1.100:8123"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={styles.helperText}>
                The address of your Home Assistant server.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Long-Lived Access Token</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={token}
                onChangeText={setToken}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={4}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.helperText}>
                Create this in your Home Assistant Profile → Security → Long-Lived Access Tokens.
              </Text>
            </View>

            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Connection Status:</Text>
              <View style={styles.statusBadge}>
                {isConnected ? (
                  <>
                    <CheckCircle size={16} color="#22c55e" />
                    <Text style={[styles.statusText, { color: '#22c55e' }]}>Connected</Text>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} color="#ef4444" />
                    <Text style={[styles.statusText, { color: '#ef4444' }]}>Disconnected</Text>
                  </>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Save size={20} color="white" />
                  <Text style={styles.saveButtonText}>Save & Connect</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    padding: 20,
  },
  description: {
    color: '#94a3b8',
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
