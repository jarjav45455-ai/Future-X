import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Clock,
  Award,
  History,
} from 'lucide-react-native';
import { FutureXHeader } from '../../components/common/FutureXHeader';
import { apiRequest } from '../../config/api';
import { StudentProfile } from '../../types/student';

interface ExamQuestion {
  id: string;
  skillId: string;
  skillName: string;
  difficulty: string;
  type: string;
  text: string;
  options: string[];
}

interface AttemptHistoryItem {
  id: string;
  phaseId: number;
  score: number;
  passed: boolean;
  timestamp: string;
}

interface ExamResult {
  attemptId: string;
  careerId: string;
  phaseId: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  missingSkills: string[];
  skillBreakdown: { skill: string; correct: number; total: number; percentage: number }[];
  feedback: string;
  progress: { currentPhase: number; status: string };
}

interface SkillCheckScreenProps {
  profile: StudentProfile;
  onBack: () => void;
  onProfileUpdate?: (updatedProfile: StudentProfile) => void;
}

export const SkillCheckScreen: React.FC<SkillCheckScreenProps> = ({
  profile,
  onBack,
  onProfileUpdate,
}) => {
  const careerId = profile.targetRole?.roleId || 'ai-engineer';
  const careerTitle = profile.targetRole?.roleTitle || 'Target Role';
  const totalCareerPhases = Math.max(3, (profile.roadmap || []).length);

  const [view, setView] = useState<'lobby' | 'exam' | 'result'>('lobby');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // History & Progress
  const [highestPhase, setHighestPhase] = useState<number>(1);
  const [progressStatus, setProgressStatus] = useState<string>('in_progress');
  const [history, setHistory] = useState<AttemptHistoryItem[]>([]);

  // Active 30-Question Exam State
  const [activePhase, setActivePhase] = useState<number>(1);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await apiRequest<{
        success: boolean;
        currentPhase: number;
        status: string;
        attempts: AttemptHistoryItem[];
      }>(`/api/assess/history?careerId=${encodeURIComponent(careerId)}`);

      setHighestPhase(Number(data.currentPhase || 1));
      setProgressStatus(data.status || 'in_progress');
      setHistory(data.attempts || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load assessment history.');
    } finally {
      setLoading(false);
    }
  }, [careerId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const startPhaseExam = async (phaseToTake: number) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await apiRequest<{
        success: boolean;
        phaseId: number;
        totalQuestions: number;
        questions: ExamQuestion[];
      }>('/api/assess/generate', {
        method: 'POST',
        body: { careerId, phaseId: phaseToTake },
      });

      setActivePhase(phaseToTake);
      setQuestions(data.questions || []);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setExamResult(null);
      setView('exam');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate 30-question exam.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionText: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionText }));
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: selectedAnswers[q.id] || '',
      }));

      const res = await apiRequest<ExamResult & { success: boolean }>('/api/assess/submit', {
        method: 'POST',
        body: {
          careerId,
          phaseId: activePhase,
          answers: answersPayload,
          totalCareerPhases,
        },
      });

      setExamResult(res);
      setHighestPhase(res.progress.currentPhase);
      setProgressStatus(res.progress.status);
      setView('result');

      // Sync unlocked phase back to StudentDashboard & Roadmap
      if (res.passed && onProfileUpdate) {
        const updatedRoadmap = (profile.roadmap || []).map((m: any) => {
          const step = m.stepNumber || 1;
          if (step < res.progress.currentPhase || res.progress.status === 'complete') {
            return { ...m, status: 'completed', assessmentUnlocked: true };
          }
          if (step === res.progress.currentPhase) {
            return { ...m, status: 'current', assessmentUnlocked: true };
          }
          return m;
        });

        onProfileUpdate({
          ...profile,
          roadmap: updatedRoadmap,
          readinessPercentage: Math.min(100, (profile.readinessPercentage || 0) + 15),
        });
      }

      loadHistory();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit exam.');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // VIEW 3: RESULT & FEEDBACK SCREEN
  // ==========================================
  if (view === 'result' && examResult) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <FutureXHeader
          title={`Phase ${examResult.phaseId} Result`}
          subtitle={`${careerTitle} • 90% Mastery Gate`}
          onBack={() => setView('lobby')}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.resultHero,
              examResult.passed ? styles.resultPass : styles.resultFail,
            ]}
          >
            {examResult.passed ? (
              <CheckCircle2 size={44} color="#34d399" />
            ) : (
              <XCircle size={44} color="#f43f5e" />
            )}
            <Text style={styles.resultScore}>
              {examResult.score} / {examResult.totalQuestions}
            </Text>
            <Text style={styles.resultPct}>
              {examResult.percentage}% • {examResult.passed ? 'PHASE MASTERED' : 'MASTERY NOT REACHED'}
            </Text>
            <Text style={styles.resultFeedback}>{examResult.feedback}</Text>
          </View>

          {!examResult.passed && examResult.missingSkills.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>SKILLS TO REVIEW</Text>
              <View style={styles.chipWrap}>
                {examResult.missingSkills.map((sk, i) => (
                  <View key={i} style={styles.missingChip}>
                    <Text style={styles.missingChipText}>{sk}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {examResult.skillBreakdown.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>SKILL BREAKDOWN</Text>
              {examResult.skillBreakdown.map((item, idx) => (
                <View key={idx} style={styles.breakdownRow}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.breakdownName}>{item.skill}</Text>
                    <Text
                      style={[
                        styles.breakdownPct,
                        { color: item.percentage >= 80 ? '#34d399' : '#fb923c' },
                      ]}
                    >
                      {item.correct}/{item.total} ({item.percentage}%)
                    </Text>
                  </View>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        {
                          width: `${item.percentage}%`,
                          backgroundColor: item.percentage >= 80 ? '#34d399' : '#fb923c',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => startPhaseExam(examResult.phaseId)}
            >
              <RotateCcw size={16} color="#e2e8f0" />
              <Text style={styles.secondaryBtnText}>Retake (New 30 Qs)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtnFlex} onPress={onBack}>
              <LinearGradient
                colors={['#6366f1', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGrad}
              >
                <Text style={styles.primaryBtnText}>Back to Dashboard</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE 30-QUESTION EXAM
  // ==========================================
  if (view === 'exam' && questions.length > 0) {
    const q = questions[currentIndex];
    const answeredCount = Object.keys(selectedAnswers).length;
    const isLast = currentIndex === questions.length - 1;
    const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.examTopBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setView('lobby')}>
            <ChevronLeft size={18} color="#e2e8f0" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.examTopTitle}>
              Phase {activePhase} Exam • Q{currentIndex + 1}/{questions.length}
            </Text>
            <Text style={styles.examTopSub}>
              Answered: {answeredCount}/{questions.length} • Pass Gate: 27/30 (90%)
            </Text>
          </View>
        </View>

        <View style={styles.examProgressTrack}>
          <View style={[styles.examProgressFill, { width: `${progressPct}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.questionCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.qSkillPill}>{q.skillName}</Text>
              <Text style={styles.qDiffPill}>{q.difficulty}</Text>
            </View>
            <Text style={styles.qText}>{q.text}</Text>

            <View style={{ marginTop: 16, gap: 10 }}>
              {q.options.map((opt, idx) => {
                const selected = selectedAnswers[q.id] === opt;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    style={[styles.optionBtn, selected && styles.optionBtnSelected]}
                    onPress={() => handleSelectOption(q.id, opt)}
                  >
                    <View style={[styles.optIndex, selected && styles.optIndexSelected]}>
                      <Text style={[styles.optIndexText, selected && { color: '#ffffff' }]}>
                        {String.fromCharCode(65 + idx)}
                      </Text>
                    </View>
                    <Text style={[styles.optText, selected && { color: '#ffffff', fontWeight: '700' }]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <AlertCircle size={15} color="#fda4af" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.examFooter}>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === 0 && { opacity: 0.4 }]}
            disabled={currentIndex === 0}
            onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft size={16} color="#e2e8f0" />
            <Text style={styles.navBtnText}>Prev</Text>
          </TouchableOpacity>

          {isLast ? (
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              disabled={submitting}
              onPress={handleSubmitExam}
            >
              <LinearGradient
                colors={['#059669', '#10b981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGrad}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <ShieldCheck size={17} color="#ffffff" />
                    <Text style={styles.submitBtnText}>Submit 30-Q Exam</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            >
              <Text style={styles.nextBtnText}>Next</Text>
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // VIEW 1: LOBBY & ATTEMPT HISTORY
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FutureXHeader
        title="30-Question Skill Check"
        subtitle={`${careerTitle} • 90% Mastery Gate`}
        onBack={onBack}
      />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text style={styles.loadingText}>Preparing 30-question exam engine...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Gate Card */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.22)', 'rgba(56, 189, 248, 0.06)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroEyebrow}>PHASE MASTERY GATE</Text>
                <Text style={styles.heroTitle}>
                  {progressStatus === 'complete'
                    ? 'All Phases Complete'
                    : `Assess Phase ${highestPhase}`}
                </Text>
              </View>
              <Award size={28} color="#34d399" />
            </View>

            <Text style={styles.heroDesc}>
              30 randomized, unseen-first questions mapped to your {careerTitle} skills. Score at least 27/30 (90%) to unlock the next phase.
            </Text>

            <TouchableOpacity
              style={styles.startBtn}
              activeOpacity={0.85}
              onPress={() => startPhaseExam(highestPhase)}
            >
              <LinearGradient
                colors={['#6366f1', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGrad}
              >
                <Sparkles size={17} color="#ffffff" />
                <Text style={styles.primaryBtnText}>
                  {progressStatus === 'complete'
                    ? `Retake Phase ${highestPhase} (30 Qs)`
                    : `Start Phase ${highestPhase} Exam (30 Qs)`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <AlertCircle size={15} color="#fda4af" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Past Attempt History */}
          <View style={styles.sectionCard}>
            <View style={styles.row}>
              <History size={15} color="#c084fc" />
              <Text style={[styles.sectionTitle, { marginLeft: 7 }]}>
                PAST ATTEMPT HISTORY ({history.length})
              </Text>
            </View>

            {history.length === 0 ? (
              <Text style={styles.emptyHistText}>
                No attempts yet. Complete Phase 1 exam to record your verified score.
              </Text>
            ) : (
              history.map((att) => (
                <View key={att.id} style={styles.histRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.histTitle}>
                      Phase {att.phaseId} • {att.score}/30 ({Math.round((att.score / 30) * 100)}%)
                    </Text>
                    <View style={[styles.row, { marginTop: 3 }]}>
                      <Clock size={11} color="#94a3b8" />
                      <Text style={styles.histDate}>
                        {new Date(att.timestamp).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.histBadge,
                      att.passed ? styles.histBadgePass : styles.histBadgeFail,
                    ]}
                  >
                    <Text
                      style={[
                        styles.histBadgeText,
                        { color: att.passed ? '#34d399' : '#fda4af' },
                      ]}
                    >
                      {att.passed ? 'PASSED' : 'RETRY'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 110 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: '#94a3b8', fontSize: 12 },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
    backgroundColor: '#110b20',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    marginBottom: 16,
  },
  heroEyebrow: { color: '#c084fc', fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  heroTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800', marginTop: 4 },
  heroDesc: { color: '#cbd5e1', fontSize: 12, lineHeight: 18, marginTop: 10 },
  startBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 16 },
  primaryGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  sectionCard: {
    backgroundColor: '#110b20',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  sectionTitle: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  emptyHistText: { color: '#64748b', fontSize: 12, marginTop: 10 },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  histTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  histDate: { color: '#94a3b8', fontSize: 11, marginLeft: 5 },
  histBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  histBadgePass: { backgroundColor: 'rgba(52, 211, 153, 0.14)' },
  histBadgeFail: { backgroundColor: 'rgba(244, 63, 94, 0.14)' },
  histBadgeText: { fontSize: 10, fontWeight: '800' },
  examTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  examTopTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  examTopSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  examProgressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)' },
  examProgressFill: { height: '100%', backgroundColor: '#c084fc' },
  questionCard: {
    backgroundColor: '#110b20',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  qSkillPill: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qDiffPill: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  qText: { color: '#ffffff', fontSize: 15, fontWeight: '700', lineHeight: 22, marginTop: 12 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  optionBtnSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.22)',
    borderColor: '#c084fc',
  },
  optIndex: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optIndexSelected: { backgroundColor: '#9333ea' },
  optIndexText: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
  optText: { color: '#cbd5e1', fontSize: 13, flex: 1, lineHeight: 18 },
  examFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(5, 3, 10, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 38,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  navBtnText: { color: '#e2e8f0', fontSize: 13, fontWeight: '700' },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#9333ea',
  },
  nextBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  submitBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  submitBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  resultHero: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    marginBottom: 16,
  },
  resultPass: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  resultFail: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  resultScore: { color: '#ffffff', fontSize: 32, fontWeight: '900', marginTop: 10 },
  resultPct: { color: '#cbd5e1', fontSize: 12, fontWeight: '800', marginTop: 4 },
  resultFeedback: {
    color: '#e2e8f0',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 19,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  missingChip: {
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  missingChipText: { color: '#fda4af', fontSize: 11, fontWeight: '700' },
  breakdownRow: { marginTop: 10 },
  breakdownName: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  breakdownPct: { fontSize: 11, fontWeight: '800' },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  secondaryBtnText: { color: '#e2e8f0', fontSize: 12, fontWeight: '700' },
  primaryBtnFlex: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#fda4af', fontSize: 12, flex: 1 },
});

export default SkillCheckScreen;