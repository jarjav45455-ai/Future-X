import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Clock, ArrowRight } from 'lucide-react-native';

interface NextMoveCardProps {
  taskTitle: string;
  duration: string;
  reason: string;
  onStartNow: () => void;
}

export const NextMoveCard: React.FC<NextMoveCardProps> = ({
  taskTitle,
  duration,
  reason,
  onStartNow,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.badgeLabel}>
          <Sparkles size={14} color="#ec4899" />
          <Text style={styles.badgeText}>TODAY'S NEXT MOVE</Text>
        </View>
        <View style={styles.durationBadge}>
          <Clock size={12} color="#34d399" />
          <Text style={styles.durationText}>{duration}</Text>
        </View>
      </View>

      <Text style={styles.taskHeadline}>{taskTitle}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onStartNow}
        style={styles.actionBtnContainer}
      >
        <LinearGradient
          colors={['#8b5cf6', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.btnTitle}>Start Now</Text>
          <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.reasonNote}>
        <Text style={styles.boldReason}>Why this matters? </Text>
        {reason}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#120d1f',
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.15)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f472b6',
    letterSpacing: 1.1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  taskHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  actionBtnContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  btnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reasonNote: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  boldReason: {
    fontWeight: '600',
    color: '#cbd5e1',
  },
});

export default NextMoveCard;