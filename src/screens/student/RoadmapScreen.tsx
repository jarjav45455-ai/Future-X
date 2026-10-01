import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Lock, ArrowRight, BookOpen, Rocket, Award } from 'lucide-react-native';

import { FutureXHeader } from '../../components/common/FutureXHeader';
import { StudentProfile } from '../../types/student';
import { PantherDialoguePopup } from '../../components/panther/PantherDialoguePopup';

interface RoadmapScreenProps {
  profile: StudentProfile;
  onBack: () => void;
  onNavigateToSkillCheck?: () => void;
  onNavigateToOpportunities?: () => void;
}

export const RoadmapScreen: React.FC<RoadmapScreenProps> = ({
  profile,
  onBack,
  onNavigateToSkillCheck,
  onNavigateToOpportunities,
}) => {
  const [showPantherPopup, setShowPantherPopup] = useState(true);
  const activeStep = profile.roadmap.find((s) => s.status === 'current') || profile.roadmap[0];
  const currentPhaseNum = activeStep?.stepNumber || 1;

  return (
    <SafeAreaView style={styles.container}>
      <FutureXHeader
        title="Role Roadmap"
        subtitle={`Trajectory: ${profile.targetRole.roleTitle}`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner with Pathway Overview */}
        <View style={styles.roadmapHero}>
          <View style={styles.heroRowBetween}>
            <Text style={styles.heroTag}>INTELLIGENT PATHWAY</Text>
            <View style={styles.activePhasePill}>
              <Text style={styles.activePhasePillText}>PHASE {currentPhaseNum} ACTIVE</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Prerequisite-Gated Milestones</Text>
          <Text style={styles.heroDesc}>
            Passing verification at each phase directly unlocks corresponding Tier-1 hackathons, fellowships, and verified cohort applications.
          </Text>

          {onNavigateToOpportunities && (
            <TouchableOpacity
              style={styles.heroOppBtn}
              activeOpacity={0.85}
              onPress={onNavigateToOpportunities}
            >
              <Rocket size={13} color="#38bdf8" />
              <Text style={styles.heroOppBtnText}>View Unlocked Opportunities Radar</Text>
              <ArrowRight size={13} color="#38bdf8" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionHeader}>Sequential Competency Steps</Text>

        {profile.roadmap.map((step) => {
          const isCurrent = step.status === 'current';
          const isCompleted = step.status === 'completed';
          const isFutureLocked = !isCurrent && !isCompleted;

          return (
            <View
              key={step.id}
              style={[
                styles.stepCard,
                isCurrent && styles.stepCardCurrent,
                isCompleted && styles.stepCardCompleted,
              ]}
            >
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>PHASE {step.stepNumber}</Text>
                </View>
                <View style={styles.statusIndicator}>
                  {isCompleted ? (
                    <View style={styles.completedBadge}>
                      <CheckCircle2 size={13} color="#34d399" />
                      <Text style={styles.completedText}>VERIFIED MASTERED</Text>
                    </View>
                  ) : isCurrent ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activePill}>CURRENT STAGE</Text>
                    </View>
                  ) : (
                    <View style={styles.lockedBadge}>
                      <Lock size={12} color="#64748b" />
                      <Text style={styles.lockedText}>LOCKED</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepSubtitle}>{step.subtitle}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <BookOpen size={11} color="#94a3b8" />
                  <Text style={styles.metaText}>{step.category}</Text>
                </View>
                <Text style={styles.durationText}>{step.duration}</Text>
              </View>

              <View style={styles.deliverableContainer}>
                <Text style={styles.deliverableLabel}>Required Deliverable:</Text>
                <Text style={styles.deliverableValue}>{step.deliverable}</Text>
              </View>

              {/* Opportunity Unlock Tag */}
              <View style={styles.opportunityUnlockRow}>
                <Award size={12} color={isCompleted || isCurrent ? '#38bdf8' : '#64748b'} />
                <Text
                  style={[
                    styles.opportunityUnlockText,
                    (isCompleted || isCurrent) && { color: '#38bdf8' },
                  ]}
                >
                  {isCompleted
                    ? 'All Phase ' + step.stepNumber + ' Opportunities Unlocked'
                    : isCurrent
                    ? 'Active Phase: Unlocks Entry Fellowships & Hackathons'
                    : 'Unlocks Advanced Cohort Roles upon >=90% Score'}
                </Text>
              </View>

              {isCurrent && (
                <TouchableOpacity style={styles.actionBtn} onPress={onNavigateToSkillCheck}>
                  <Text style={styles.actionBtnText}>Take Milestone Assessment</Text>
                  <ArrowRight size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      <PantherDialoguePopup
        visible={showPantherPopup}
        mode="guide"
        tagline="PATHWAY NAVIGATION"
        message={`Arjav, you are in Phase ${currentPhaseNum}: ${activeStep?.title || 'Foundations'}. Clear the assessment to unlock Phase ${currentPhaseNum + 1} and higher-tier opportunities.`}
        onDismiss={() => setShowPantherPopup(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  roadmapHero: {
    backgroundColor: '#120d1f',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  heroRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTag: { color: '#38bdf8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  activePhasePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePhasePillText: { color: '#38bdf8', fontSize: 9, fontWeight: '800' },
  heroTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 6 },
  heroDesc: { color: '#94a3b8', fontSize: 11, marginTop: 4, lineHeight: 16 },
  heroOppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  heroOppBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },
  sectionHeader: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 8 },
  stepCard: {
    backgroundColor: '#0c0817',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  stepCardCurrent: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  stepCardCompleted: {
    borderColor: 'rgba(52, 211, 153, 0.3)',
    backgroundColor: 'rgba(52, 211, 153, 0.04)',
  },
  stepHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepNumberBadge: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stepNumberText: { color: '#c084fc', fontSize: 10, fontWeight: '800' },
  statusIndicator: { flexDirection: 'row', alignItems: 'center' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completedText: { color: '#34d399', fontSize: 10, fontWeight: '800' },
  activeBadge: { backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  activePill: { color: '#34d399', fontSize: 9, fontWeight: '800' },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedText: { color: '#64748b', fontSize: 9, fontWeight: '700' },
  stepTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  stepSubtitle: { color: '#94a3b8', fontSize: 12, lineHeight: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#94a3b8', fontSize: 11 },
  durationText: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },
  deliverableContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  deliverableLabel: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  deliverableValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginTop: 2 },
  opportunityUnlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  opportunityUnlockText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});

export default RoadmapScreen;