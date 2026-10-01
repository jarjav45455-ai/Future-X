import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { PantherMode, PANTHER_PROFILES } from './pantherConfig';
import { FutureXPanther } from './FutureXPanther';

interface PantherDialoguePopupProps {
  visible: boolean;
  message: string;
  mode?: PantherMode;
  tagline?: string;
  onDismiss: () => void;
  autoHideDuration?: number; // 0 = sirf screen touch par hatega
}

export const PantherDialoguePopup: React.FC<PantherDialoguePopupProps> = ({
  visible,
  message,
  mode = 'scout',
  tagline,
  onDismiss,
  autoHideDuration = 0, // default: touch-to-dismiss
}) => {
  const profile = PANTHER_PROFILES[mode] || PANTHER_PROFILES.scout;

  const slideYAnim = useRef(new Animated.Value(260)).current;
  const bubbleScaleAnim = useRef(new Animated.Value(0)).current;
  const bubbleOpacityAnim = useRef(new Animated.Value(0)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;

    if (visible) {
      // 1. Spring slide-up from bottom corner
      Animated.spring(slideYAnim, {
        toValue: 0,
        friction: 6.5,
        tension: 45,
        useNativeDriver: true,
      }).start();

      // 2. Bubble pop-in
      Animated.sequence([
        Animated.delay(140),
        Animated.parallel([
          Animated.spring(bubbleScaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleOpacityAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // 3. Subtle breathing loop
      const breathLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1.03,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(breathAnim, {
            toValue: 1.0,
            duration: 2000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      breathLoop.start();

      if (autoHideDuration > 0) {
        hideTimer = setTimeout(() => {
          handleDismiss();
        }, autoHideDuration);
      }

      return () => {
        breathLoop.stop();
        if (hideTimer) clearTimeout(hideTimer);
      };
    } else {
      Animated.timing(slideYAnim, {
        toValue: 260,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(bubbleScaleAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideYAnim, {
        toValue: 260,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Screen-wide transparent backdrop: anywhere user touches, it dismisses */}
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      {/* Floating Bottom Corner Element */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.popupContainer,
          {
            transform: [{ translateY: slideYAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleDismiss}
          style={styles.touchableArea}
        >
          {/* Left: Animated Panther */}
          <Animated.View
            style={[
              styles.pantherWrapper,
              {
                transform: [{ scale: breathAnim }],
              },
            ]}
          >
            <FutureXPanther mode={mode} height={115} />
          </Animated.View>

          {/* Right: Dialogue Bubble */}
          <Animated.View
            style={[
              styles.bubbleContainer,
              {
                borderColor: profile.glowColor,
                opacity: bubbleOpacityAnim,
                transform: [{ scale: bubbleScaleAnim }],
              },
            ]}
          >
            <BlurView intensity={35} tint="dark" style={styles.bubbleGlass}>
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.bubbleTagline, { color: profile.glowColor }]}>
                {tagline || profile.tagline.toUpperCase()}
              </Text>

              <Text style={styles.bubbleMessageText}>{message}</Text>
              <Text style={styles.dismissHint}>tap anywhere to dismiss</Text>
            </BlurView>

            <View
              style={[
                styles.pointerTail,
                { borderRightColor: profile.glowColor },
              ]}
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  popupContainer: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    zIndex: 99999,
    elevation: 30,
  },
  touchableArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  pantherWrapper: {
    width: 105,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: -10,
    marginBottom: -6,
  },
  bubbleContainer: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: '#0c071a',
    marginBottom: 8,
  },
  bubbleGlass: {
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleTagline: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  bubbleMessageText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  dismissHint: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 5,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  pointerTail: {
    position: 'absolute',
    left: -10,
    bottom: 22,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});

export default PantherDialoguePopup;