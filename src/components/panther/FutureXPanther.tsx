import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet, Animated, Easing } from 'react-native';
import { PantherMode, PANTHER_PROFILES } from './pantherConfig';

interface FutureXPantherProps {
  mode?: PantherMode;
  height?: number;
  aspectRatio?: number;
  scanning?: boolean;
}

export const FutureXPanther: React.FC<FutureXPantherProps> = ({
  mode = 'default',
  height = 180,
  scanning = false,
}) => {
  const profile = PANTHER_PROFILES[mode] || PANTHER_PROFILES.default;

  const breathAnim = useRef(new Animated.Value(1)).current;
  const eyePulseAnim = useRef(new Animated.Value(profile.eyeIntensity)).current;
  const scanLaserAnim = useRef(new Animated.Value(-height * 0.4)).current;
  const tailSwayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Physically authentic Panther respiration cycle (2.8s)
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.025,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1.0,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    breathLoop.start();

    // 2. Controlled luminous eye & aura bloom
    const eyeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(eyePulseAnim, {
          toValue: 1.0,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(eyePulseAnim, {
          toValue: Math.max(0.45, profile.eyeIntensity - 0.25),
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    eyeLoop.start();

    // 3. Subtle stance shift
    const tailLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tailSwayAnim, {
          toValue: 2,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(tailSwayAnim, {
          toValue: -2,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    tailLoop.start();

    // 4. Scanner beam sweep
    if (scanning || profile.showScanner) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLaserAnim, {
            toValue: height * 0.45,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLaserAnim, {
            toValue: -height * 0.45,
            duration: 1600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => {
      breathLoop.stop();
      eyeLoop.stop();
      tailLoop.stop();
    };
  }, [mode, scanning, height, profile.eyeIntensity, profile.showScanner]);

  // Image aspect ratio dynamic based on mode
  const width = profile.pose === 'stalking_scout' ? height * 1.85 : height * 1.75;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width,
          height,
          transform: [{ scale: breathAnim }],
        },
      ]}
    >
      {/* Cinematic Deep Atmosphere / Rim Bloom */}
      <Animated.View
        style={[
          styles.cinematicAura,
          {
            width: width * 0.85,
            height: height * 0.85,
            borderRadius: (height * 0.85) / 2,
            backgroundColor: profile.glowColor,
            shadowColor: profile.glowColor,
            shadowRadius: profile.bloomRadius,
            opacity: eyePulseAnim.interpolate({
              inputRange: [0.45, 1],
              outputRange: [0.12, 0.3],
            }),
          },
        ]}
      />

      {/* Photorealistic Black Panther Render dynamically mapped to mode */}
      <Image
        source={profile.imageSource}
        style={[styles.pantherImage, { width, height }]}
        resizeMode="contain"
      />

      {/* Futuristic Blue Laser Scanner line for Scout & Skill Analysis */}
      {(scanning || profile.showScanner) && (
        <Animated.View
          style={[
            styles.scannerLine,
            {
              width: width * 0.75,
              borderColor: profile.glowColor,
              transform: [{ translateY: scanLaserAnim }],
            },
          ]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cinematicAura: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    elevation: 12,
  },
  pantherImage: {
    zIndex: 2,
  },
  scannerLine: {
    position: 'absolute',
    height: 1.8,
    borderBottomWidth: 1.8,
    zIndex: 3,
    opacity: 0.85,
  },
});

export default FutureXPanther;