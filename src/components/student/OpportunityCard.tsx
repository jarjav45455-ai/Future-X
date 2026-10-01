import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Briefcase, ArrowUpRight } from 'lucide-react-native';

interface OpportunityProps {
  title: string;
  company: string;
  type: string;
  matchScore: number;
  onApply: () => void;
}

export const OpportunityCard: React.FC<OpportunityProps> = ({
  title,
  company,
  type,
  matchScore,
  onApply,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Briefcase size={18} color="#ec4899" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          {company} • <Text style={styles.typeBadge}>{type}</Text>
        </Text>
      </View>
      <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
        <Text style={styles.matchText}>{matchScore}%</Text>
        <ArrowUpRight size={14} color="#a855f7" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  typeBadge: {
    color: '#c084fc',
    fontWeight: '600',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  matchText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default OpportunityCard;