import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot, Edit3, Settings } from 'lucide-react-native';

interface AimCardProps {
  aimTitle: string;
  progress: number;
  onChangeAim: () => void;
  onSettingsPress: () => void;
}

export const AimCard: React.FC<AimCardProps> = ({
  aimTitle,
  progress,
  onChangeAim,
  onSettingsPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <View style={styles.leftSection}>
          <LinearGradient
            colors={['#8b5cf6', '#6d28d9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBadge}
          >
            <Bot size={22} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={styles.subLabel}>YOUR AIM</Text>
            <Text style={styles.mainTitle}>{aimTitle}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.changeAimBtn}
              onPress={onChangeAim}
            >
              <Edit3 size={12} color="#a78bfa" />
              <Text style={styles.changeAimText}>Change Aim</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingsBtn}
          onPress={onSettingsPress}
        >
          <Settings size={20} color="#a1a1aa" />
        </TouchableOpacity>
      </View>

      {/* Progress Track */}
      <View style={styles.progressSection}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>FUTUREX PROGRESS</Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>
        <View style={styles.trackBackground}>
          <LinearGradient
            colors={['#a855f7', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.trackActive, { width: `${progress}%` }]}
          />
        </View>
        <Text style={styles.statusFooter}>
          Path aligned to {aimTitle} 🔥
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#120d1f',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  subLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: 2,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  changeAimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  changeAimText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#c4b5fd',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    marginTop: 4,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 10,
    letterSpacing: 1.1,
    color: '#94a3b8',
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trackBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackActive: {
    height: '100%',
    borderRadius: 3,
  },
  statusFooter: {
    marginTop: 8,
    fontSize: 11,
    color: '#c084fc',
    fontWeight: '500',
  },
});

export default AimCard;