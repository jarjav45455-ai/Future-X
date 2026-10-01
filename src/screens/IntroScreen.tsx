import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface IntroScreenProps {
  onFinish: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onFinish }) => {
  // Direct assets folder se teri original intro.mp4 video
  const videoSource = require('../../assets/new_intro.mp4');

  const player = useVideoPlayer(videoSource, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.play();
  });

  useEffect(() => {
    const subscription = player.addListener('playToEnd', () => {
      onFinish();
    });

    return () => {
      subscription.remove();
    };
  }, [player, onFinish]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      <TouchableOpacity style={styles.skipBtn} onPress={onFinish} activeOpacity={0.8}>
        <Text style={styles.skipText}>Skip ➔</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05030a',
  },
  skipBtn: {
    position: 'absolute',
    bottom: 36,
    right: 24,
    backgroundColor: 'rgba(15, 10, 30, 0.75)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});