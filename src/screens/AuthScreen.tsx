import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { apiRequest, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../config/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  ageGroup?: 'under_18' | '18_plus';
}

export const AUTH_USER_KEY = '@futurex_auth_user';

interface AuthScreenProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (mode === 'register') {
      if (name.trim().length < 2) {
        setErrorMsg('Please enter your name (at least 2 characters).');
        return;
      }
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'register'
          ? { name: name.trim(), email: cleanEmail, password }
          : { email: cleanEmail, password };

      const data = await apiRequest<{
        success: boolean;
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      }>(endpoint, { method: 'POST', body: payload });

      await AsyncStorage.multiSet([
        [AUTH_TOKEN_KEY, data.accessToken],
        [REFRESH_TOKEN_KEY, data.refreshToken],
        [AUTH_USER_KEY, JSON.stringify(data.user)],
      ]);

      onAuthSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to connect to FutureX server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.brandBlock}>
            <View style={styles.logoRing}>
              <ShieldCheck size={30} color="#c084fc" />
            </View>
            <Text style={styles.brandTitle}>FUTUREX</Text>
            <Text style={styles.brandTagline}>YOUR FUTURE. ENGINEERED TODAY.</Text>
          </View>

          {/* Mode Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleActive]}
              onPress={() => {
                setMode('login');
                setErrorMsg('');
              }}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'register' && styles.toggleActive]}
              onPress={() => {
                setMode('register');
                setErrorMsg('');
              }}
            >
              <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Auth Card */}
          <View style={styles.card}>
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputRow}>
                  <User size={16} color="#94a3b8" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="#64748b"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Mail size={16} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="student@college.edu"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Lock size={16} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'register' ? 'Minimum 8 characters' : 'Enter password'}
                  placeholderTextColor="#64748b"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? (
                    <EyeOff size={16} color="#94a3b8" />
                  ) : (
                    <Eye size={16} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>


            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#9333ea', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitText}>
                      {mode === 'register' ? 'Launch My FutureX Account' : 'Enter Dashboard'}
                    </Text>
                    <ArrowRight size={17} color="#ffffff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.privacyNote}>
            Minimal data collected. Your credentials and ProofPass stay private unless you choose to share them.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  ambientTop: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#7e22ce',
    opacity: 0.22,
    top: -60,
    left: -60,
  },
  ambientBottom: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#be185d',
    opacity: 0.16,
    bottom: -40,
    right: -80,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  brandBlock: { alignItems: 'center', marginBottom: 26 },
  logoRing: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(192, 132, 252, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3,
  },
  brandTagline: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: 'rgba(147, 51, 234, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.4)',
  },
  toggleText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#ffffff', fontWeight: '700' },
  card: {
    backgroundColor: 'rgba(17, 11, 32, 0.85)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputGroup: { marginBottom: 14 },
  label: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  input: { flex: 1, color: '#ffffff', fontSize: 14 },
  ageRow: { flexDirection: 'row', gap: 10 },
  agePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  agePillActive: {
    borderColor: '#ec4899',
    backgroundColor: 'rgba(236, 72, 153, 0.18)',
  },
  ageText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  ageTextActive: { color: '#ffffff', fontWeight: '700' },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: '#fda4af', fontSize: 12, fontWeight: '600' },
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 6 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  submitText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  privacyNote: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 16,
  },
});

export default AuthScreen;