import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'student' | 'business';
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, variant = 'student' }) => {
  const borderColor = variant === 'student' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(56, 189, 248, 0.25)';

  return (
    <View style={[styles.wrapper, { borderColor }, style]}>
      <BlurView intensity={25} tint="dark" style={styles.blur}>
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    backgroundColor: 'rgba(15, 10, 30, 0.55)',
  },
  blur: {
    padding: 18,
  }
});