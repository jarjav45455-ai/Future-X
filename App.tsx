import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IntroScreen } from './src/screens/IntroScreen';
import { StudentDashboard } from './src/screens/StudentDashboard';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {showIntro ? (
          <IntroScreen onFinish={() => setShowIntro(false)} />
        ) : (
          <StudentDashboard />
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
});