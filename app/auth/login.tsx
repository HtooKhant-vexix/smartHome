import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff, Home, UserPlus } from 'lucide-react-native';
import { useAuth } from '../../_context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        // Small delay to ensure any pending operations complete
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        Alert.alert('Login Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('demo@smarthome.com');
    setPassword('demo123');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Home size={48} color="#2563eb" />
        <Text style={styles.title}>Smart Home</Text>
        <Text style={styles.subtitle}>Welcome back to your smart home</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#94a3b8" />
              ) : (
                <Eye size={20} color="#94a3b8" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.buttonText}>Sign In</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleDemoLogin}
          disabled={isLoading}
        >
          <Text style={styles.demoButtonText}>Use Demo Account</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/auth/register" style={styles.link}>
            <Text style={styles.linkText}>Sign Up</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#334155',
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  eyeButton: {
    padding: 16,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  demoButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  demoButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  link: {
    marginLeft: 4,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563eb',
  },
});
