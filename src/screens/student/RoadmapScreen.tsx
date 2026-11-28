import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle2,
  Lock,
  Sparkles,
  Clock,
  Target,
  Layers,
  GitBranch,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Award,
} from 'lucide-react-native';
import { FutureXHeader } from '../../components/common/FutureXHeader';
import { apiRequest } from '../../config/api';
import { StudentProfile } from '../../types/student';

interface AttemptRecord {
  id: string;
  phaseId: number;
  score: number;
  passed: boolean;
  timestamp: string;
}

interface RoadmapScreenProps {
  profile: StudentProfile;
  onBack: () => void;
  onNavigateToSkillCheck?: () => void;
}

export const RoadmapScreen: React.FC<RoadmapScreenProps> = ({
  profile,
  onBack,
  onNavigateToSkillCheck,
}) => {
  const roadmap: any[] = Array.isArray(profile.roadmap) ? profile.roadmap : [];
  const careerId = profile.targetRole?.roleId || 'ai-engineer';

  const [expandedPhase, setExpandedPhase] = useState<number>(1);
  const [highestPhase, setHighestPhase] = useState<number>(1);
  const [progressStatus, setProgressStatus] = useState<'in_progress' | 'complete'>('in_progress');
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);

  // Live sync with SQLite student_phase_progress & attempt history
  useEffect(() => {
    let active = true;
    apiRequest<{
      success: boolean;
      currentPhase: number;
      status: 'in_progress' | 'complete';
      attempts: AttemptRecord[];
    }>(`/api/assess/history?careerId=${encodeURIComponent(careerId)}`)
      .then((data) => {
        if (!active || !data?.success) return;
        const unlocked = Number(data.currentPhase || 1);
        setHighestPhase(unlocked);
        setProgressStatus(data.status === 'complete' ? 'complete' : 'in_progress');
        setAttempts(Array.isArray(data.attempts) ? data.attempts : []);
        setExpandedPhase(unlocked);
      })
      .catch(() => {
        // Offline fallback: derive current phase from local roadmap
        const localCurrent = roadmap.find((p) => p.status === 'current');
        if (localCurrent?.stepNumber) {
          setHighestPhase(Number(localCurrent.stepNumber));
          setExpandedPhase(Number(localCurrent.stepNumber));
        }
      });

    return () => {
      active = false;
    };
  }, [careerId]);

  const totalPhases = roadmap.length;
  const completedCount =
    progressStatus === 'complete'
      ? totalPhases
      : roadmap.filter((p, idx) => (p.stepNumber || idx + 1) < highestPhase || p.status === 'completed').length;
  const progressPct = totalPhases > 0 ? Math.round((completedCount / totalPhases) * 100) : 0;

  const fastTrackedSkills = (profile.skills || []).filter(
    (s) => !s.isGap && (s.proficiency || 0) >= (s.targetBenchmark || 80)
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FutureXHeader
        title="Adaptive Career Roadmap"
        subtitle={`${profile.targetRole?.roleTitle || 'Target Track'} • DAG Prerequisite Sequenced`}
        onBack={onBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* All Phases Complete Banner */}
        {progressStatus === 'complete' && totalPhases > 0 && (
          <View style={styles.allDoneBanner}>
            <Award size={20} color="#34d399" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.allDoneTitle}>All Phases Complete</Text>
              <Text style={styles.allDoneSub}>
                Every phase mastery gate (90%+) for {profile.targetRole?.roleTitle} is verified.
              </Text>
            </View>
          </View>
        )}

        {/* Summary Hero Banner */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.22)', 'rgba(168, 85, 247, 0.08)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>DYNAMIC SKILL-MAPPED TRAJECTORY</Text>
              <Text style={styles.heroTitle}>{profile.targetRole?.roleTitle}</Text>
            </View>
            <View style={styles.phaseCountBadge}>
              <Text style={styles.phaseCountNum}>{totalPhases}</Text>
              <Text style={styles.phaseCountLabel}>PHASES</Text>
            </View>
          </View>

          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <Layers size={13} color="#38bdf8" />
              <Text style={styles.statText}>
                {(profile.skills || []).length} Skills Covered
              </Text>
            </View>
            <View style={styles.statItem}>
              <Target size={13} color="#c084fc" />
              <Text style={styles.statText}>
                Readiness: {profile.readinessPercentage || 0}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Award size={13} color="#34d399" />
              <Text style={styles.statText}>
                {completedCount}/{totalPhases} Done
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(progressPct, totalPhases > 0 ? 8 : 0)}%` },
              ]}
            />
          </View>
        </View>

        {/* Fast-Tracked Skills Strip */}
        {fastTrackedSkills.length > 0 && (
          <View style={styles.fastTrackCard}>
            <View style={styles.row}>
              <CheckCircle2 size={14} color="#34d399" />
              <Text style={styles.fastTrackTitle}>
                Fast-Tracked Baseline ({fastTrackedSkills.length} Skills Already Strong)
              </Text>
            </View>
            <View style={styles.fastTrackWrap}>
              {fastTrackedSkills.map((sk) => (
                <View key={sk.id} style={styles.fastTrackPill}>
                  <Text style={styles.fastTrackPillText}>{sk.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Phase Timeline Cards */}
        {roadmap.map((phase, idx) => {
          const stepNum = Number(phase.stepNumber || idx + 1);
          const isCompleted =
            progressStatus === 'complete' ||
            stepNum < highestPhase ||
            phase.status === 'completed';
          const isCurrent = !isCompleted && stepNum === highestPhase;
          const isLocked = !isCompleted && !isCurrent;
          const isExpanded = expandedPhase === stepNum || isCurrent;
          const phaseSkills: any[] = Array.isArray(phase.skills) ? phase.skills : [];
          const phaseAttempts = attempts.filter((a) => Number(a.phaseId) === stepNum);
          const latestAttempt = phaseAttempts[0] || null;

          return (
            <View key={phase.id || stepNum} style={styles.phaseWrapper}>
              {idx < roadmap.length - 1 && <View style={styles.connectorLine} />}

              <View
                style={[
                  styles.phaseCard,
                  isCurrent && styles.phaseCardCurrent,
                  isCompleted && styles.phaseCardCompleted,
                  isLocked && styles.phaseCardLocked,
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setExpandedPhase((prev) => (prev === stepNum ? -1 : stepNum))
                  }
                >
                  <View style={styles.rowBetween}>
                    <View style={styles.row}>
                      <View
                        style={[
                          styles.stepCircle,
                          isCurrent && styles.stepCircleCurrent,
                          isCompleted && styles.stepCircleCompleted,
                        ]}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={15} color="#34d399" />
                        ) : isLocked ? (
                          <Lock size={13} color="#64748b" />
                        ) : (
                          <Text style={styles.stepCircleText}>{stepNum}</Text>
                        )}
                      </View>

                      <View style={{ marginLeft: 10 }}>
                        <View style={styles.row}>
                          <Text
                            style={[
                              styles.statusPill,
                              isCurrent && styles.statusCurrent,
                              isCompleted && styles.statusCompleted,
                            ]}
                          >
                            {isCompleted
                              ? `PHASE ${stepNum} COMPLETED`
                              : isCurrent
                                ? 'CURRENT PHASE'
                                : 'LOCKED'}
                          </Text>
                          <View style={[styles.row, { marginLeft: 8 }]}>
                            <Clock size={11} color="#94a3b8" />
                            <Text style={styles.durationText}>{phase.duration || '2-3 Weeks'}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {isExpanded ? (
                      <ChevronUp size={18} color="#94a3b8" />
                    ) : (
                      <ChevronDown size={18} color="#94a3b8" />
                    )}
                  </View>

                  <Text style={styles.phaseTitle}>{phase.title}</Text>
                  <Text style={styles.phaseSubtitle}>{phase.subtitle}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedBody}>
                    {Array.isArray(phase.prerequisites) && phase.prerequisites.length > 0 && (
                      <View style={styles.prereqBox}>
                        <GitBranch size={13} color="#fbbf24" />
                        <Text style={styles.prereqText}>
                          Prerequisites: {phase.prerequisites.join(' • ')}
                        </Text>
                      </View>
                    )}

                    {phaseSkills.length > 0 && (
                      <View style={{ marginTop: 10 }}>
                        <Text style={styles.miniHeading}>
                          SKILLS MASTERED IN THIS PHASE ({phaseSkills.length})
                        </Text>

                        {phaseSkills.map((sk: any) => {
                          const isZero = (sk.selfRating ?? 0) === 0;
                          return (
                            <View key={sk.id || sk.name} style={styles.skillItem}>
                              <View style={styles.rowBetween}>
                                <Text style={styles.skillName}>{sk.name}</Text>
                                <View
                                  style={[
                                    styles.ratingBadge,
                                    isZero && {
                                      backgroundColor: 'rgba(244, 63, 94, 0.16)',
                                      borderColor: 'rgba(244, 63, 94, 0.45)',
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.ratingBadgeText,
                                      isZero && { color: '#fda4af' },
                                    ]}
                                  >
                                    {sk.selfRating ?? 0}/5 → {sk.requiredProficiency ?? 4}/5
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.skillMeta}>
                                {sk.category} • {sk.difficultyLevel || 'Core'}
                                {isZero ? ' • Starting from Scratch' : ''}
                              </Text>
                              {sk.whyItMatters ? (
                                <Text style={styles.skillWhy}>{sk.whyItMatters}</Text>
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                    )}

                    <View style={styles.deliverableBox}>
                      <Sparkles size={14} color="#c084fc" />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.deliverableLabel}>PHASE DELIVERABLE</Text>
                        <Text style={styles.deliverableText}>{phase.deliverable}</Text>
                      </View>
                    </View>

                    {/* Latest Attempt Info for This Phase */}
                    {latestAttempt && (
                      <View style={styles.attemptNote}>
                        <Text style={styles.attemptNoteText}>
                          Last Attempt: {latestAttempt.score}/30 (
                          {Math.round((latestAttempt.score / 30) * 100)}%) •{' '}
                          {new Date(latestAttempt.timestamp).toLocaleDateString('en-IN')}
                        </Text>
                      </View>
                    )}

                    {/* Phase Action State: Current vs Completed vs Locked */}
                    {isCurrent && onNavigateToSkillCheck && (
                      <TouchableOpacity
                        style={styles.ctaBtn}
                        activeOpacity={0.85}
                        onPress={onNavigateToSkillCheck}
                      >
                        <LinearGradient
                          colors={['#6366f1', '#a855f7']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.ctaGrad}
                        >
                          <Text style={styles.ctaText}>
                            Assess Phase {stepNum} (30 Qs • 90% Gate)
                          </Text>
                          <ArrowRight size={16} color="#ffffff" />
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    {isCompleted && (
                      <View style={styles.completedBar}>
                        <CheckCircle2 size={15} color="#34d399" />
                        <Text style={styles.completedBarText}>
                          Phase {stepNum} Completed
                        </Text>
                      </View>
                    )}

                    {isLocked && (
                      <View style={styles.lockedBar}>
                        <Lock size={14} color="#64748b" />
                        <Text style={styles.lockedBarText}>
                          Locked — Pass Phase {stepNum - 1} (27/30) to unlock
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {roadmap.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Roadmap Generated Yet</Text>
            <Text style={styles.emptySub}>
              Pick a career from 101 Career Explorer and complete the 0–5 Skill Assessment to generate your personalized DAG roadmap.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  scrollContent: { padding: 16, paddingBottom: 50 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  allDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.45)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  allDoneTitle: { color: '#34d399', fontSize: 14, fontWeight: '800' },
  allDoneSub: { color: '#a7f3d0', fontSize: 11, marginTop: 2 },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
    backgroundColor: '#110b20',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.28)',
    marginBottom: 14,
  },
  heroEyebrow: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  heroTitle: { color: '#ffffff', fontSize: 19, fontWeight: '800', marginTop: 4 },
  phaseCountBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: '#c084fc',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  phaseCountNum: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  phaseCountLabel: { color: '#c084fc', fontSize: 8, fontWeight: '800' },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#34d399', borderRadius: 3 },
  fastTrackCard: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.28)',
    borderRadius: 16,
    padding: 13,
    marginBottom: 16,
  },
  fastTrackTitle: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  fastTrackWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  fastTrackPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fastTrackPillText: { color: '#a7f3d0', fontSize: 11, fontWeight: '700' },
  phaseWrapper: { position: 'relative', marginBottom: 14 },
  connectorLine: {
    position: 'absolute',
    left: 27,
    top: 44,
    bottom: -16,
    width: 2,
    backgroundColor: 'rgba(192, 132, 252, 0.22)',
  },
  phaseCard: {
    backgroundColor: '#110b20',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  phaseCardCurrent: {
    borderColor: 'rgba(192, 132, 252, 0.65)',
    backgroundColor: 'rgba(88, 28, 135, 0.16)',
  },
  phaseCardCompleted: {
    borderColor: 'rgba(52, 211, 153, 0.45)',
  },
  phaseCardLocked: {
    opacity: 0.78,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleCurrent: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    borderColor: '#c084fc',
  },
  stepCircleCompleted: {
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
    borderColor: '#34d399',
  },
  stepCircleText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  statusPill: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusCurrent: {
    color: '#c084fc',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  statusCompleted: {
    color: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
  },
  durationText: { color: '#94a3b8', fontSize: 11, marginLeft: 4, fontWeight: '600' },
  phaseTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginTop: 10 },
  phaseSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 3, lineHeight: 17 },
  expandedBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  prereqBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.28)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  prereqText: { color: '#fde68a', fontSize: 11, fontWeight: '600', flex: 1 },
  miniHeading: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  skillItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
  },
  skillName: { color: '#ffffff', fontSize: 13, fontWeight: '700', flex: 1, paddingRight: 8 },
  ratingBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingBadgeText: { color: '#38bdf8', fontSize: 10, fontWeight: '800' },
  skillMeta: { color: '#94a3b8', fontSize: 10, marginTop: 3, fontWeight: '600' },
  skillWhy: { color: '#cbd5e1', fontSize: 11, marginTop: 4, lineHeight: 16 },
  deliverableBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.28)',
    borderRadius: 12,
    padding: 11,
    marginTop: 6,
  },
  deliverableLabel: { color: '#c084fc', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  deliverableText: { color: '#e2e8f0', fontSize: 12, marginTop: 2, lineHeight: 17 },
  attemptNote: {
    marginTop: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  attemptNoteText: { color: '#7dd3fc', fontSize: 11, fontWeight: '600' },
  ctaBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 12 },
  ctaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  ctaText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  completedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  completedBarText: { color: '#34d399', fontSize: 12, fontWeight: '800' },
  lockedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  lockedBarText: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 },
  emptyTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});

export default RoadmapScreen;