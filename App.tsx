import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IntroScreen } from './src/screens/IntroScreen';
import { StudentDashboard } from './src/screens/StudentDashboard';
import { AuthScreen, AuthUser, AUTH_USER_KEY } from './src/screens/AuthScreen';
import { apiRequest, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from './src/config/api';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [token, userJson] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);
        if (token && userJson) {
          setAuthUser(JSON.parse(userJson));
        }
      } catch {
        // Ignore storage read error
      } finally {
        setCheckingAuth(false);
      }
    };
    restoreSession();
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      }).catch(() => null);
    } finally {
      await AsyncStorage.multiRemove([
        AUTH_TOKEN_KEY,
        REFRESH_TOKEN_KEY,
        '@futurex_auth_user',
        '@futurex_student_profile_v2',
      ]);
      setAuthUser(null);
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {showIntro ? (
          <IntroScreen onFinish={() => setShowIntro(false)} />
        ) : checkingAuth ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#c084fc" />
          </View>
        ) : !authUser ? (
          <AuthScreen onAuthSuccess={(user) => setAuthUser(user)} />
        ) : (
          <StudentDashboard authUser={authUser} onLogout={handleLogout} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05030a',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});