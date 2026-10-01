import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  GraduationCap,
  Code2,
  Rocket,
  TrendingUp,
  Shield,
  Bot,
  CheckSquare,
  Bell,
  ArrowRight,
} from 'lucide-react-native';

export type ModuleKey =
  | 'roadmap'
  | 'projects'
  | 'opportunities'
  | 'progress'
  | 'proof_pass'
  | 'ai_mentor'
  | 'skill_check'
  | 'future_alerts';

interface ModuleItem {
  id: ModuleKey;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  iconBg: string;
}

const MODULES: ModuleItem[] = [
  {
    id: 'roadmap',
    title: 'Roadmap',
    subtitle: 'What to learn',
    icon: GraduationCap,
    color: '#38bdf8',
    iconBg: 'rgba(56, 189, 248, 0.12)',
  },
  {
    id: 'projects',
    title: 'Projects',
    subtitle: 'What to build',
    icon: Code2,
    color: '#818cf8',
    iconBg: 'rgba(129, 140, 248, 0.12)',
  },
  {
    id: 'opportunities',
    title: 'Opportunities',
    subtitle: 'Find & apply',
    icon: Rocket,
    color: '#f43f5e',
    iconBg: 'rgba(244, 63, 94, 0.12)',
  },
  {
    id: 'progress',
    title: 'Progress',
    subtitle: 'Track monthly',
    icon: TrendingUp,
    color: '#ec4899',
    iconBg: 'rgba(236, 72, 153, 0.12)',
  },
  {
    id: 'proof_pass',
    title: 'Proof Pass',
    subtitle: 'Your achievements',
    icon: Shield,
    color: '#a855f7',
    iconBg: 'rgba(168, 85, 247, 0.12)',
  },
  {
    id: 'ai_mentor',
    title: 'AI Mentor',
    subtitle: 'Your guide',
    icon: Bot,
    color: '#818cf8',
    iconBg: 'rgba(129, 140, 248, 0.12)',
  },
  {
    id: 'skill_check',
    title: 'Skill Check',
    subtitle: 'Know your level',
    icon: CheckSquare,
    color: '#10b981',
    iconBg: 'rgba(16, 185, 129, 0.12)',
  },
  {
    id: 'future_alerts',
    title: 'Future Alerts',
    subtitle: 'Never miss out',
    icon: Bell,
    color: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.12)',
  },
];

interface StudentModuleGridProps {
  onSelectModule: (moduleId: ModuleKey, title: string) => void;
}

export const StudentModuleGrid: React.FC<StudentModuleGridProps> = ({
  onSelectModule,
}) => {
  return (
    <View style={styles.gridContainer}>
      {MODULES.map((item) => {
        const IconComponent = item.icon;
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            style={styles.card}
            onPress={() => onSelectModule(item.id, item.title)}
          >
            <View style={[styles.iconWrapper, { backgroundColor: item.iconBg }]}>
              <IconComponent size={22} color={item.color} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
            <View style={styles.arrowContainer}>
              <ArrowRight size={13} color="#64748b" />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 40,
  },
  card: {
    width: '23%',
    minWidth: 80,
    flexGrow: 1,
    backgroundColor: '#120d1f',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  arrowContainer: {
    marginTop: 2,
  },
});

export default StudentModuleGrid;