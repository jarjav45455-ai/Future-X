import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Cpu,
  Layers,
  ChevronRight,
  X,
  Code2,
  CheckSquare,
  ShieldCheck,
} from 'lucide-react-native';

import { FutureXHeader } from '../../components/common/FutureXHeader';
import { StudentProfile, SkillItem } from '../../types/student';
import { PantherDialoguePopup } from '../../components/panther/PantherDialoguePopup';

interface ProgressScreenProps {
  profile: StudentProfile;
  onBack: () => void;
  onNavigateToSkillCheck?: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  profile,
  onBack,
  onNavigateToSkillCheck,
}) => {
  const [showPantherPopup, setShowPantherPopup] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [auditModalVisible, setAuditModalVisible] = useState(false);

  const verifiedCount = profile.skills.filter(
    (s) => s.status === 'Assessed' || s.status === 'Verified' || s.status === 'Proof-Verified'
  ).length;
  const gapCount = profile.skills.filter((s) => s.isGap).length;

  const handleOpenSkillAudit = (skill: SkillItem) => {
    setSelectedSkill(skill);
    setAuditModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FutureXHeader
        title="Career Velocity"
        subtitle={`Readiness Index: ${profile.targetRole.roleTitle}`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Readiness Card */}
        <View style={styles.readinessCard}>
          <Text style={styles.statTag}>TARGET ROLE READINESS</Text>
          <Text style={styles.statPercentage}>{profile.readinessPercentage}%</Text>
          <Text style={styles.statRole}>{profile.targetRole.roleTitle}</Text>

          {/* Real Visual Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${profile.readinessPercentage}%` }]} />
          </View>
          <Text style={styles.benchText}>Benchmark: 75% required for Tier-1 Opportunity Recommendation</Text>
        </View>

        {/* 3 Metric Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <CheckCircle2 size={20} color="#34d399" />
            <Text style={styles.metricBig}>{verifiedCount}</Text>
            <Text style={styles.metricDesc}>Skills Verified</Text>
          </View>

          <View style={styles.metricBox}>
            <AlertCircle size={20} color="#f59e0b" />
            <Text style={styles.metricBig}>{gapCount}</Text>
            <Text style={styles.metricDesc}>Priority Gaps</Text>
          </View>

          <View style={styles.metricBox}>
            <TrendingUp size={20} color="#38bdf8" />
            <Text style={styles.metricBig}>{profile.weeklyCommitmentHours}h</Text>
            <Text style={styles.metricDesc}>Weekly Pace</Text>
          </View>
        </View>

        {/* ASM (ADVANCE SKILL MANAGEMENT) VERIFICATION GRID */}
        <View style={styles.asmCard}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <Cpu size={18} color="#38bdf8" />
              <Text style={styles.asmCardLabel}>ASM Verification Grid</Text>
            </View>
            <View style={styles.tapPill}>
              <Text style={styles.tapPillText}>Tap skill to verify</Text>
            </View>
          </View>

          <Text style={styles.asmSectionSubtitle}>
            Granular competencies verified via deterministic testing and repository proofs.
          </Text>

          <View style={styles.asmGridContainer}>
            {profile.skills.map((skill, index) => {
              const isVerified =
                skill.status === 'Verified' ||
                skill.status === 'Proof-Verified' ||
                skill.status === 'Assessed';
              const proficiencyScore = skill.proficiency || (isVerified ? 85 : 40);

              return (
                <TouchableOpacity
                  key={skill.id || index}
                  style={styles.asmSkillCard}
                  activeOpacity={0.75}
                  onPress={() => handleOpenSkillAudit(skill)}
                >
                  <View style={styles.rowBetween}>
                    <Text style={styles.asmSkillName} numberOfLines={1}>
                      {skill.name}
                    </Text>
                    <View
                      style={[
                        styles.asmBadge,
                        isVerified ? styles.asmBadgeVerified : styles.asmBadgePending,
                      ]}
                    >
                      {isVerified ? (
                        <CheckCircle2 size={10} color="#34d399" />
                      ) : (
                        <Layers size={10} color="#f59e0b" />
                      )}
                      <Text
                        style={[
                          styles.asmBadgeText,
                          isVerified ? { color: '#34d399' } : { color: '#f59e0b' },
                        ]}
                      >
                        {isVerified ? 'VERIFIED' : 'ACTIVE'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.asmBarTrack}>
                    <View
                      style={[
                        styles.asmBarFill,
                        {
                          width: `${Math.min(100, proficiencyScore)}%`,
                          backgroundColor: isVerified ? '#34d399' : '#38bdf8',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.rowBetween}>
                    <Text style={styles.asmCategoryText}>{skill.category}</Text>
                    <View style={styles.row}>
                      <Text style={styles.asmScoreText}>{proficiencyScore}%</Text>
                      <ChevronRight size={12} color="#64748b" style={{ marginLeft: 2 }} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* INTERACTIVE SKILL AUDIT BOTTOM SHEET MODAL */}
      <Modal visible={auditModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTag}>COMPETENCY AUDIT</Text>
                <Text style={styles.modalSkillTitle}>{selectedSkill?.name}</Text>
                <Text style={styles.modalSkillCategory}>{selectedSkill?.category}</Text>
              </View>
              <TouchableOpacity onPress={() => setAuditModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.statusBox}>
              <View style={styles.rowBetween}>
                <Text style={styles.statusBoxLabel}>Current Mastery Score</Text>
                <Text style={styles.statusBoxVal}>{selectedSkill?.proficiency || 30}%</Text>
              </View>
              <View style={styles.sheetBarTrack}>
                <View
                  style={[
                    styles.sheetBarFill,
                    { width: `${Math.min(100, selectedSkill?.proficiency || 30)}%` },
                  ]}
                />
              </View>
              <Text style={styles.statusDesc}>
                Verification requires deterministic validation: Pass targeted evaluation or attach audited repository code.
              </Text>
            </View>

            {/* Action 1: Skill Check */}
            <TouchableOpacity
              style={styles.actionRowBtn}
              activeOpacity={0.85}
              onPress={() => {
                setAuditModalVisible(false);
                if (onNavigateToSkillCheck) {
                  onNavigateToSkillCheck();
                } else {
                  onBack();
                }
              }}
            >
              <View style={[styles.actionIconRing, { borderColor: '#34d399' }]}>
                <CheckSquare size={18} color="#34d399" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionBtnTitle}>Take Targeted Skill Check</Text>
                <Text style={styles.actionBtnDesc}>Solve 10 role-specific practical questions</Text>
              </View>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Action 2: Link GitHub Proof */}
            <TouchableOpacity
              style={[styles.actionRowBtn, { marginTop: 10 }]}
              activeOpacity={0.85}
              onPress={() => {
                setAuditModalVisible(false);
                onBack();
              }}
            >
              <View style={[styles.actionIconRing, { borderColor: '#c084fc' }]}>
                <Code2 size={18} color="#c084fc" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionBtnTitle}>Link GitHub / Project Evidence</Text>
                <Text style={styles.actionBtnDesc}>Submit PR or repository link to ProofPass</Text>
              </View>
              <ShieldCheck size={16} color="#c084fc" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PantherDialoguePopup
        visible={showPantherPopup}
        mode="guardian"
        tagline="VELOCITY TELEMETRY"
        message={`Arjav, you are at ${profile.readinessPercentage}% readiness with ${gapCount} blocker gaps. Pushing pace to 75% unlocks top tier matching.`}
        onDismiss={() => setShowPantherPopup(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readinessCard: {
    backgroundColor: '#120d1f',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
  },
  statTag: { color: '#c084fc', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statPercentage: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginTop: 4 },
  statRole: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  benchText: { color: '#64748b', fontSize: 11, marginTop: 8 },
  metricsGrid: { flexDirection: 'row', gap: 10 },
  metricBox: {
    flex: 1,
    backgroundColor: '#0c0817',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    gap: 4,
  },
  metricBig: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  metricDesc: { color: '#94a3b8', fontSize: 10, textAlign: 'center' },

  // ASM Grid Styles
  asmCard: {
    backgroundColor: 'rgba(18, 12, 33, 0.65)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 6,
  },
  asmCardLabel: {
    marginLeft: 8,
    color: '#38bdf8',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  tapPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tapPillText: { color: '#38bdf8', fontSize: 9, fontWeight: '700' },
  asmSectionSubtitle: { color: '#94a3b8', fontSize: 11, marginTop: 6, marginBottom: 12 },
  asmGridContainer: { gap: 10 },
  asmSkillCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  asmSkillName: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', flex: 1, paddingRight: 6 },
  asmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  asmBadgeVerified: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  asmBadgePending: { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
  asmBadgeText: { fontSize: 8, fontWeight: '800' },
  asmBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 8,
    overflow: 'hidden',
  },
  asmBarFill: { height: '100%', borderRadius: 2 },
  asmCategoryText: { color: '#64748b', fontSize: 10 },
  asmScoreText: { color: '#cbd5e1', fontSize: 10, fontWeight: '700' },

  // Bottom Sheet Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#0f0a1c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    padding: 20,
    paddingBottom: 36,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTag: { color: '#38bdf8', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  modalSkillTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 2 },
  modalSkillCategory: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  statusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 14,
  },
  statusBoxLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  statusBoxVal: { color: '#38bdf8', fontSize: 14, fontWeight: '800' },
  sheetBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sheetBarFill: { height: '100%', borderRadius: 3, backgroundColor: '#38bdf8' },
  statusDesc: { color: '#94a3b8', fontSize: 11, lineHeight: 16 },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 14,
  },
  actionIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  actionBtnTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  actionBtnDesc: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
});

export default ProgressScreen;