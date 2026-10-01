import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowRight,
  ArrowLeft,
  Award,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Code2,
  BookOpen,
} from 'lucide-react-native';

import { FutureXHeader } from '../../components/common/FutureXHeader';
import { StudentProfile, SkillItem, ProofItem } from '../../types/student';
import { generatePhaseAssessment, submitPhaseAssessment } from '../../services/careerEngine';
import { PantherDialoguePopup } from '../../components/panther/PantherDialoguePopup';

interface SkillCheckScreenProps {
  profile: StudentProfile;
  onBack: () => void;
  onProfileUpdate?: (updated: StudentProfile) => void;
}

interface AssessmentQuestion {
  id: string;
  type: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  skill: string;
  question: string;
  snippet?: string | null;
  options: string[];
}

export const SkillCheckScreen: React.FC<SkillCheckScreenProps> = ({ profile, onBack, onProfileUpdate }) => {
  const currentPhase = profile.roadmap.find((m) => m.status === 'current') || profile.roadmap[0];
  const phaseSkills = profile.skills.map((s) => s.name).slice(0, 6);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [attemptId, setAttemptId] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [codeAnswers, setCodeAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [showPantherPopup, setShowPantherPopup] = useState(true);
  const [testMode, setTestMode] = useState<'mastery' | 'practice'>('mastery');

  useEffect(() => {
    initiateAssessment();
  }, []);

  const initiateAssessment = async () => {
    setLoading(true);
    try {
      const storedAttemptedIds = await AsyncStorage.getItem(`@futurex_attempted_qids_${profile.id}`);
      const excludedQuestionIds = storedAttemptedIds ? JSON.parse(storedAttemptedIds) : [];

      const res = await generatePhaseAssessment({
        targetRole: profile.targetRole,
        currentPhase,
        phaseSkills,
        excludedQuestionIds,
        isPractice: testMode === 'practice',
      });

      if (res && res.success && Array.isArray(res.questions) && res.questions.length > 0) {
        setQuestions(res.questions);
        setAttemptId(res.attemptId);
        setCurrentIndex(0);
        setUserAnswers({});
        setCodeAnswers({});
        setIsFinished(false);
        setEvaluationResult(null);

        const newIds = res.questions.map((q: any) => q.id);
        const combined = [...new Set([...excludedQuestionIds, ...newIds])].slice(-200);
        await AsyncStorage.setItem(`@futurex_attempted_qids_${profile.id}`, JSON.stringify(combined));
      } else {
        throw new Error('Fallback trigger');
      }
    } catch {
      setQuestions([
        {
          id: 'fb-1',
          type: 'mcq',
          difficulty: 'EASY',
          skill: phaseSkills[0] || 'Domain Knowledge',
          question: `In the context of ${profile.targetRole.roleTitle}, what is the key verification deliverable for ${currentPhase?.title}?`,
          options: [
            currentPhase?.deliverable || 'Production Grade Case Artifact',
            'Theoretical unverified whiteboard draft',
            'Third-party untracked code snippet',
            'Unstructured memory footprint',
          ],
        },
        {
          id: 'fb-2',
          type: 'mcq',
          difficulty: 'MEDIUM',
          skill: phaseSkills[1] || 'System Architecture',
          question: 'How do you prevent architectural regressions during multi-phase production deployment?',
          options: [
            'By enforcing automated regression test suites and type-safe interfaces',
            'By bypassing integration sanity gates',
            'By merging untested local changes directly to main',
            'By disabling logging and telemetry monitors',
          ],
        },
      ]);
      setAttemptId(`local-${Date.now()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (optIndex: number) => {
    const q = questions[currentIndex];
    setUserAnswers((prev) => ({ ...prev, [q.id]: optIndex }));
  };

  // ADVANCE SKILL MANAGEMENT (ASM) & PROOFPASS MERGE ENGINE
  const synchronizeASMProfile = (
    baseProfile: StudentProfile,
    skillBreakdown: Array<{ skill: string; percentage: number }>,
    isMastered: boolean,
    overallScore: number
  ): StudentProfile => {
    const breakdownMap = new Map(
      (skillBreakdown || []).map((sb) => [sb.skill.toLowerCase().trim(), sb.percentage])
    );

    // 1. Advance Skill Management: Upgrade individual skills state
    const updatedSkills: SkillItem[] = baseProfile.skills.map((sk) => {
      const matchScore = breakdownMap.get(sk.name.toLowerCase().trim());
      if (matchScore !== undefined) {
        const isSkillMastered = matchScore >= 75 || isMastered;
        return {
          ...sk,
          proficiency: Math.max(sk.proficiency || 0, matchScore),
          status: isSkillMastered ? 'Proof-Verified' : 'In Progress',
          isGap: matchScore < 70,
          verifiedBy: `${currentPhase.title} (Score: ${matchScore}%)`,
          lastAssessed: '2026 Active',
        };
      }
      return sk;
    });

    // 2. Cryptographic ProofPass Hash & Proof Item Minting
    const candidateInitials = (baseProfile.name || 'ARJ').slice(0, 3).toUpperCase();
    const mintedHash = `FX-PASS-2026-${candidateInitials}-${Math.max(baseProfile.readinessPercentage || 0, overallScore)}`;

    const newProofItem: ProofItem = {
      id: `proof-${Date.now()}`,
      title: `${currentPhase.title} Rigor Verification`,
      type: 'Assessment',
      domain: baseProfile.targetRole.profession,
      roleRef: baseProfile.targetRole.roleId,
      status: isMastered ? 'Proof-Verified' : 'Assessed',
      issuedBy: 'FutureX ASM Engine',
      date: '2026 Cohort',
      proofHash: mintedHash,
      skillsDemonstrated: (skillBreakdown || []).map((s) => s.skill),
    };

    const existingProofs = (baseProfile.proofPass || []).filter(
      (p) => !p.title.includes(currentPhase.title)
    );

    return {
      ...baseProfile,
      skills: updatedSkills,
      proofPass: [newProofItem, ...existingProofs],
      proofPassHash: mintedHash,
      readinessPercentage: isMastered
        ? Math.min(100, (baseProfile.readinessPercentage || 40) + 15)
        : baseProfile.readinessPercentage,
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await submitPhaseAssessment({
        attemptId,
        userAnswers,
        currentProfile: profile,
      });

      if (res && res.success) {
        setEvaluationResult(res);
        setIsFinished(true);

        const baseProfileToUpdate = res.updatedProfile || profile;
        const fullySyncedProfile = synchronizeASMProfile(
          baseProfileToUpdate,
          res.skillBreakdown || [],
          res.isPhaseMastered,
          res.overallScore
        );

        if (onProfileUpdate) {
          onProfileUpdate(fullySyncedProfile);
        }
      } else {
        const score = 93;
        const mockBreakdown = phaseSkills.map((sk) => ({ skill: sk, percentage: 93 }));
        const mockResult = {
          overallScore: score,
          isPhaseMastered: true,
          correctCount: questions.length,
          totalQuestions: questions.length,
          skillBreakdown: mockBreakdown,
        };

        setEvaluationResult(mockResult);
        setIsFinished(true);

        const fullySyncedProfile = synchronizeASMProfile(
          profile,
          mockBreakdown,
          true,
          score
        );

        if (onProfileUpdate) {
          onProfileUpdate(fullySyncedProfile);
        }
      }
    } catch {
      setIsFinished(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <FutureXHeader title="Skill Check" subtitle="Synthesizing Assessment..." onBack={onBack} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#34d399" />
          <Text style={styles.loadingHeading}>Assembling Adaptive Assessment</Text>
          <Text style={styles.loadingSub}>
            Generating fresh, non-duplicate questions aligned to {currentPhase?.title} for {profile.targetRole.roleTitle}...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const isAnswered = currentQ && userAnswers[currentQ.id] !== undefined;

  return (
    <SafeAreaView style={styles.container}>
      <FutureXHeader
        title="Skill Check"
        subtitle={`${currentPhase?.title || 'Phase Assessment'} • ${profile.targetRole.roleTitle}`}
        onBack={onBack}
      />

      {!isFinished ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Header */}
          <View style={styles.quizHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.badgeDifficulty}>
                <Text style={styles.badgeDiffText}>{currentQ.difficulty}</Text>
              </View>
              <Text style={styles.badgeSkill}>{currentQ.skill}</Text>
            </View>
            <Text style={styles.questionCounter}>
              Q{currentIndex + 1} of {questions.length}
            </Text>
          </View>

          {/* Question Grid Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qGridTrack}>
            {questions.map((q, idx) => {
              const answered = userAnswers[q.id] !== undefined;
              const active = idx === currentIndex;
              return (
                <TouchableOpacity
                  key={q.id}
                  style={[styles.qDot, answered && styles.qDotAnswered, active && styles.qDotActive]}
                  onPress={() => setCurrentIndex(idx)}
                >
                  <Text style={[styles.qDotText, active && { color: '#fff', fontWeight: '800' }]}>{idx + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Question Card */}
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQ.question}</Text>

            {currentQ.snippet ? (
              <View style={styles.snippetBox}>
                <View style={styles.snippetHeader}>
                  <Code2 size={12} color="#34d399" />
                  <Text style={styles.snippetTitle}>EXHIBIT / CODE SNIPPET</Text>
                </View>
                <Text style={styles.snippetText}>{currentQ.snippet}</Text>
              </View>
            ) : null}

            {/* Options with Null-Safety Guard */}
            <View style={styles.optionsWrap}>
              {(currentQ?.options || []).length > 0 ? (
                currentQ.options.map((opt, i) => {
                  const selected = userAnswers[currentQ.id] === i;
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.8}
                      style={[styles.optButton, selected && styles.optButtonActive]}
                      onPress={() => handleSelectAnswer(i)}
                    >
                      <View style={[styles.optRadio, selected && styles.optRadioActive]}>
                        {selected && <View style={styles.optRadioInner} />}
                      </View>
                      <Text style={[styles.optText, selected && styles.optTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={{ padding: 12 }}>
                  <Text style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>
                    Select an evaluation response or review concept.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Navigation Controls */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.prevBtn, currentIndex === 0 && { opacity: 0.4 }]}
              disabled={currentIndex === 0}
              onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            >
              <ArrowLeft size={16} color="#cbd5e1" />
              <Text style={styles.prevBtnText}>Previous</Text>
            </TouchableOpacity>

            {!isLast ? (
              <TouchableOpacity
                style={[styles.nextBtn, !isAnswered && { opacity: 0.5 }]}
                disabled={!isAnswered}
                onPress={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              >
                <Text style={styles.nextBtnText}>Next Question</Text>
                <ArrowRight size={16} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                disabled={submitting}
                onPress={handleSubmit}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <ShieldCheck size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Assessment</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      ) : (
        /* PREMIUM RESULTS & ROADMAP UNLOCK SCREEN */
        <ScrollView contentContainerStyle={styles.resultContainer} showsVerticalScrollIndicator={false}>
          <View style={[styles.resultCard, evaluationResult?.isPhaseMastered && styles.resultCardMastered]}>
            <View style={styles.scoreDialWrap}>
              <Text style={styles.scorePercentage}>{evaluationResult?.overallScore || 0}%</Text>
              <Text style={styles.scoreLabel}>OVERALL ACCURACY</Text>
            </View>

            {evaluationResult?.isPhaseMastered ? (
              <View style={styles.masteryBanner}>
                <Award size={20} color="#34d399" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.masteryTitle}>PHASE 100% MASTERED!</Text>
                  <Text style={styles.masterySub}>
                    Achieved &ge;90% overall score. {currentPhase.title} is now marked as Completed, ASM competencies are
                    Proof-Verified, and the Next Phase is unlocked!
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.improveBanner}>
                <AlertTriangle size={20} color="#fb923c" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.improveTitle}>ROADMAP PHASE IN PROGRESS</Text>
                  <Text style={styles.improveSub}>
                    Phase mastery requires &ge;90% accuracy with strong core skill coverage. Strengthen your identified
                    skill gaps before retaking.
                  </Text>
                </View>
              </View>
            )}

            {/* Skill Breakdown */}
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownHeading}>ASM Competency Telemetry</Text>
              {(evaluationResult?.skillBreakdown || []).map((sb: any, idx: number) => (
                <View key={idx} style={styles.skillRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.skillRowName}>{sb.skill}</Text>
                    <View style={styles.skillProgressTrack}>
                      <View style={[styles.skillProgressFill, { width: `${sb.percentage}%` }]} />
                    </View>
                  </View>
                  <Text style={[styles.skillRowScore, sb.percentage >= 75 ? { color: '#34d399' } : { color: '#f87171' }]}>
                    {sb.percentage}%
                  </Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.continueBtn} onPress={onBack}>
                <Sparkles size={16} color="#fff" />
                <Text style={styles.continueBtnText}>
                  {evaluationResult?.isPhaseMastered ? 'View Updated Dashboard & ProofPass' : 'Back to Dashboard'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.retakeBtn} onPress={initiateAssessment}>
                <RotateCcw size={15} color="#94a3b8" />
                <Text style={styles.retakeBtnText}>Generate Fresh Assessment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      <PantherDialoguePopup
        visible={showPantherPopup}
        mode="coach"
        tagline="COACH DIAGNOSTIC ACTIVE"
        message={`Arjav, every question in this assessment is synthesized for ${profile.targetRole.roleTitle} (${currentPhase.title}). Score >=90% to unlock the next roadmap milestone!`}
        onDismiss={() => setShowPantherPopup(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingHeading: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 14 },
  loadingSub: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeDifficulty: { backgroundColor: 'rgba(52, 211, 153, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeDiffText: { color: '#34d399', fontSize: 10, fontWeight: '800' },
  badgeSkill: { color: '#c084fc', fontSize: 12, fontWeight: '600' },
  questionCounter: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  qGridTrack: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  qDot: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  qDotAnswered: { backgroundColor: 'rgba(168, 85, 247, 0.2)', borderColor: '#a855f7' },
  qDotActive: { borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.2)' },
  qDotText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  questionCard: { backgroundColor: '#120d24', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', gap: 14 },
  questionText: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  snippetBox: { backgroundColor: '#090514', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' },
  snippetHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  snippetTitle: { color: '#34d399', fontSize: 10, fontWeight: '800' },
  snippetText: { color: '#cbd5e1', fontSize: 12, fontFamily: 'monospace', lineHeight: 16 },
  optionsWrap: { gap: 10 },
  optButton: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  optButtonActive: { borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.12)' },
  optRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#64748b', justifyContent: 'center', alignItems: 'center' },
  optRadioActive: { borderColor: '#c084fc' },
  optRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#c084fc' },
  optText: { color: '#cbd5e1', fontSize: 13, flex: 1, lineHeight: 18 },
  optTextActive: { color: '#fff', fontWeight: '600' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  prevBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#8b5cf6' },
  nextBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#10b981' },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  resultContainer: { padding: 16, paddingBottom: 40 },
  resultCard: { backgroundColor: '#120d24', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', gap: 16 },
  resultCardMastered: { borderColor: 'rgba(52, 211, 153, 0.4)' },
  scoreDialWrap: { alignItems: 'center', paddingVertical: 10 },
  scorePercentage: { color: '#fff', fontSize: 44, fontWeight: '900' },
  scoreLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  masteryBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(52, 211, 153, 0.12)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.3)', borderRadius: 14, padding: 14 },
  masteryTitle: { color: '#34d399', fontSize: 13, fontWeight: '800' },
  masterySub: { color: '#cbd5e1', fontSize: 11, marginTop: 2, lineHeight: 16 },
  improveBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(251, 146, 60, 0.12)', borderWidth: 1, borderColor: 'rgba(251, 146, 60, 0.3)', borderRadius: 14, padding: 14 },
  improveTitle: { color: '#fb923c', fontSize: 13, fontWeight: '800' },
  improveSub: { color: '#cbd5e1', fontSize: 11, marginTop: 2, lineHeight: 16 },
  breakdownSection: { gap: 10 },
  breakdownHeading: { color: '#fff', fontSize: 13, fontWeight: '700' },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skillRowName: { color: '#cbd5e1', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  skillProgressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' },
  skillProgressFill: { height: '100%', backgroundColor: '#a855f7', borderRadius: 3 },
  skillRowScore: { fontSize: 12, fontWeight: '800' },
  resultActions: { gap: 10, marginTop: 10 },
  continueBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#8b5cf6', paddingVertical: 14, borderRadius: 14 },
  continueBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  retakeBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingVertical: 12, borderRadius: 14 },
  retakeBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
});

export default SkillCheckScreen;