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
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react-native';
import {
  apiRequest,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  getOrCreateDeviceId,
  getDeviceLabel,
} from '../config/api';

export const AUTH_USER_KEY = '@futurex_auth_user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  college?: string;
  currentStage?: string;
}
const STAGE_OPTIONS = [
  'College Student',
  'Graduate / Fresher',
  'Working Pro',
  'Career Switcher',
];

interface AuthScreenProps {
  onAuthSuccess: (user: {
    id: string;
    name: string;
    email: string;
    college?: string;
    currentStage?: string;
  }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [currentStage, setCurrentStage] = useState('College Student');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeviceLockError, setIsDeviceLockError] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg('');
    setIsDeviceLockError(false);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (mode === 'register' && name.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const deviceName = getDeviceLabel();

      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'register'
          ? {
              name: name.trim(),
              email: cleanEmail,
              password,
              college: college.trim(),
              currentStage,
              deviceId,
              deviceName,
            }
          : {
              email: cleanEmail,
              password,
              deviceId,
              deviceName,
            };

      const data = await apiRequest<{
        success: boolean;
        user: { id: string; name: string; email: string; college?: string; currentStage?: string };
        accessToken: string;
        refreshToken: string;
      }>(endpoint, {
        method: 'POST',
        body: payload,
      });

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

      onAuthSuccess(data.user);
    } catch (err: any) {
      const msg = err?.message || 'Unable to connect to FutureX server.';
      if (msg.toLowerCase().includes('already logged in')) {
        setIsDeviceLockError(true);
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoRing}>
              <Sparkles size={28} color="#c084fc" />
            </View>
            <Text style={styles.brandTitle}>FutureX</Text>
            <Text style={styles.brandSub}>
              Zero-AI Verified Career Intelligence & ProofPass
            </Text>
          </View>

          {/* Mode Toggle Tabs */}
          <View style={styles.modeSwitch}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
              onPress={() => {
                setMode('login');
                setErrorMsg('');
                setIsDeviceLockError(false);
              }}
            >
              <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
              onPress={() => {
                setMode('register');
                setErrorMsg('');
                setIsDeviceLockError(false);
              }}
            >
              <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputBox}>
                  <User size={16} color="#94a3b8" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Arjav Jain"
                    placeholderTextColor="#64748b"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputBox}>
                <Mail size={16} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputBox}>
                <Lock size={16} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                  {showPassword ? (
                    <EyeOff size={17} color="#94a3b8" />
                  ) : (
                    <Eye size={17} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {mode === 'register' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>College / Institute (Optional)</Text>
                  <View style={styles.inputBox}>
                    <GraduationCap size={16} color="#94a3b8" />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. KCC Institute / AKTU"
                      placeholderTextColor="#64748b"
                      value={college}
                      onChangeText={setCollege}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Stage</Text>
                  <View style={styles.stageWrap}>
                    {STAGE_OPTIONS.map((stage) => {
                      const active = currentStage === stage;
                      return (
                        <TouchableOpacity
                          key={stage}
                          style={[styles.stageChip, active && styles.stageChipActive]}
                          onPress={() => setCurrentStage(stage)}
                        >
                          <Text
                            style={[
                              styles.stageChipText,
                              active && styles.stageChipTextActive,
                            ]}
                          >
                            {stage}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            {errorMsg ? (
              <View
                style={[
                  styles.errorBox,
                  isDeviceLockError && styles.deviceLockBox,
                ]}
              >
                <AlertCircle
                  size={16}
                  color={isDeviceLockError ? '#fbbf24' : '#fda4af'}
                />
                <Text
                  style={[
                    styles.errorText,
                    isDeviceLockError && { color: '#fde68a' },
                  ]}
                >
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              disabled={loading}
              activeOpacity={0.85}
              onPress={handleSubmit}
            >
              <LinearGradient
                colors={['#6366f1', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === 'register' ? 'Create My FutureX Account' : 'Sign In Securely'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.securityNote}>
              <ShieldCheck size={14} color="#34d399" />
              <Text style={styles.securityNoteText}>
                Single-Device Protection: Active accounts stay locked to your phone until you tap Log Out.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  brandHeader: { alignItems: 'center', marginBottom: 24 },
  logoRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
    borderWidth: 1.5,
    borderColor: '#c084fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: { color: '#ffffff', fontSize: 28, fontWeight: '900', letterSpacing: 0.5 },
  brandSub: { color: '#94a3b8', fontSize: 12, marginTop: 4, textAlign: 'center' },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#110b20',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  modeBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  modeBtnActive: { backgroundColor: 'rgba(168, 85, 247, 0.28)' },
  modeText: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  modeTextActive: { color: '#ffffff' },
  card: {
    backgroundColor: '#110b20',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.22)',
  },
  inputGroup: { marginBottom: 14 },
  label: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  inputBox: {
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
  stageWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stageChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  stageChipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.26)',
    borderColor: '#c084fc',
  },
  stageChipText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  stageChipTextActive: { color: '#ffffff', fontWeight: '800' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  deviceLockBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.45)',
  },
  errorText: { color: '#fda4af', fontSize: 12, flex: 1, lineHeight: 17 },
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  submitGrad: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  securityNoteText: { color: '#94a3b8', fontSize: 11, flex: 1, lineHeight: 16 },
});

export default AuthScreen;