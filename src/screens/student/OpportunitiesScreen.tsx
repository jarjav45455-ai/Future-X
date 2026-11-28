import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Lock,
  Sparkles,
  MapPin,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react-native';
import { FutureXHeader } from '../../components/common/FutureXHeader';
import { apiRequest } from '../../config/api';
import { StudentProfile } from '../../types/student';
import {
  OpportunityDetailScreen,
  OpportunityItem,
} from './OpportunityDetailScreen';

interface OpportunitiesScreenProps {
  profile: StudentProfile;
  onBack: () => void;
  onNavigateToRoadmap?: () => void;
}

type CategoryTab = 'INTERNSHIP' | 'JOB' | 'HACKATHON';

const TABS: { key: CategoryTab; label: string }[] = [
  { key: 'INTERNSHIP', label: 'Internships' },
  { key: 'JOB', label: 'Jobs' },
  { key: 'HACKATHON', label: 'Hackathons' },
];

export const OpportunitiesScreen: React.FC<OpportunitiesScreenProps> = ({
  profile,
  onBack,
  onNavigateToRoadmap,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('JOB');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedOpp, setSelectedOpp] = useState<OpportunityItem | null>(null);

  const [studentCtx, setStudentCtx] = useState({
    targetRoleTitle: profile.targetRole?.roleTitle || 'Target Role',
    currentPhase: 1,
    totalActive: 0,
    unlockedCount: 0,
    lockedCount: 0,
    closingSoonCount: 0,
  });

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);

  const loadFeed = useCallback(
    async (category: CategoryTab, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorMsg('');

      try {
        const data = await apiRequest<{
          success: boolean;
          studentContext: typeof studentCtx;
          opportunities: OpportunityItem[];
        }>(`/api/opportunities/feed?category=${category}`);

        if (data.studentContext) setStudentCtx(data.studentContext);
        setOpportunities(data.opportunities || []);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Unable to reach Opportunity Intelligence Engine.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadFeed(activeTab);
  }, [activeTab, loadFeed]);

  if (selectedOpp) {
    return (
      <OpportunityDetailScreen
        opportunity={selectedOpp}
        currentPhase={studentCtx.currentPhase}
        onBack={() => setSelectedOpp(null)}
        onNavigateToRoadmap={() => {
          setSelectedOpp(null);
          if (onNavigateToRoadmap) onNavigateToRoadmap();
          else onBack();
        }}
      />
    );
  }

  const unlockedOpps = opportunities.filter((o) => !o.isLocked);
  const lockedOpps = opportunities.filter((o) => o.isLocked);

  const renderCard = (opp: OpportunityItem) => (
    <TouchableOpacity
      key={opp.id}
      style={[styles.card, opp.isLocked && styles.cardLocked]}
      activeOpacity={0.82}
      onPress={() => setSelectedOpp(opp)}
    >
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <Text style={styles.phasePill}>Phase {opp.minRoadmapPhase}</Text>
          <Text
            style={[
              styles.matchPill,
              opp.isLocked && {
                color: '#fda4af',
                backgroundColor: 'rgba(244, 63, 94, 0.16)',
              },
            ]}
          >
            {opp.matchLabel}
          </Text>
        </View>
        {opp.isLocked ? (
          <Lock size={15} color="#f43f5e" />
        ) : (
          <CheckCircle2 size={15} color="#34d399" />
        )}
      </View>

      <Text style={styles.cardTitle}>{opp.title}</Text>
      <Text style={styles.cardCompany}>{opp.company}</Text>

      <View style={[styles.row, { marginTop: 6, gap: 6 }]}>
        <MapPin size={12} color="#94a3b8" />
        <Text style={styles.cardMeta} numberOfLines={1}>
          {opp.location} • {opp.workMode}
        </Text>
      </View>

      {opp.isLocked ? (
        <View style={styles.lockedFooter}>
          <Text style={styles.lockedMissing} numberOfLines={2}>
            Missing: {opp.missingMandatorySkills.map((m) => m.name).join(', ')}
          </Text>
          <TouchableOpacity
            style={styles.learnBtn}
            onPress={() => {
              if (onNavigateToRoadmap) onNavigateToRoadmap();
              else setSelectedOpp(opp);
            }}
          >
            <GraduationCap size={12} color="#ffffff" />
            <Text style={styles.learnBtnText}>Learn Skills</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardFooter}>
          <Text style={styles.whyText} numberOfLines={1}>
            {opp.whyMatched}
          </Text>
          <ChevronRight size={16} color="#c084fc" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FutureXHeader
        title="Opportunity Intelligence"
        subtitle="Opportunities built around your future"
        onBack={onBack}
      />

      {/* Personalized Context Banner */}
      <View style={styles.contextCard}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.2)', 'rgba(56, 189, 248, 0.06)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctxEyebrow}>ACTIVE CAREER TRACK</Text>
            <Text style={styles.ctxTitle}>{studentCtx.targetRoleTitle}</Text>
          </View>
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseBadgeText}>Phase {studentCtx.currentPhase}</Text>
          </View>
        </View>
        <View style={styles.ctxStats}>
          <Text style={styles.ctxStatText}>
            Unlocked: <Text style={{ color: '#34d399', fontWeight: '800' }}>{studentCtx.unlockedCount}</Text>
          </Text>
          <Text style={styles.ctxStatText}>
            Locked: <Text style={{ color: '#fda4af', fontWeight: '800' }}>{studentCtx.lockedCount}</Text>
          </Text>
          <Text style={styles.ctxStatText}>
            Live Verified: <Text style={{ color: '#38bdf8', fontWeight: '800' }}>{studentCtx.totalActive}</Text>
          </Text>
        </View>
      </View>

      {/* 3 Primary Category Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text style={styles.loadingText}>Evaluating live verified opportunities...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centerBox}>
          <AlertCircle size={28} color="#f43f5e" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadFeed(activeTab)}>
            <RefreshCw size={14} color="#ffffff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFeed(activeTab, true)}
              tintColor="#c084fc"
            />
          }
        >
          {unlockedOpps.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={styles.sectionHeader}>
                <Sparkles size={14} color="#34d399" />
                <Text style={styles.sectionHeaderText}>
                  RECOMMENDED FOR YOUR PHASE ({unlockedOpps.length})
                </Text>
              </View>
              {unlockedOpps.map(renderCard)}
            </View>
          )}

          {lockedOpps.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <View style={styles.sectionHeader}>
                <Lock size={14} color="#f43f5e" />
                <Text style={[styles.sectionHeaderText, { color: '#fda4af' }]}>
                  UNLOCK YOUR NEXT PHASE ({lockedOpps.length})
                </Text>
              </View>
              {lockedOpps.map(renderCard)}
            </View>
          )}

          {opportunities.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No active {activeTab.toLowerCase()}s right now</Text>
              <Text style={styles.emptySub}>
                Live feeds refresh automatically. Pull down to check again or switch tabs.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contextCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    padding: 15,
    backgroundColor: '#110b20',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
  },
  ctxEyebrow: { color: '#c084fc', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  ctxTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800', marginTop: 2 },
  phaseBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.22)',
    borderWidth: 1,
    borderColor: '#c084fc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  phaseBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  ctxStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  ctxStatText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.28)',
    borderColor: '#c084fc',
  },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#ffffff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginLeft: 2,
  },
  sectionHeaderText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: '#110b20',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    marginBottom: 10,
  },
  cardLocked: {
    borderColor: 'rgba(244, 63, 94, 0.35)',
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
  },
  phasePill: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  matchPill: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginTop: 8 },
  cardCompany: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginTop: 2 },
  cardMeta: { color: '#94a3b8', fontSize: 11, flex: 1 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  whyText: { color: '#94a3b8', fontSize: 11, flex: 1, paddingRight: 8 },
  lockedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(244, 63, 94, 0.2)',
  },
  lockedMissing: { color: '#fb923c', fontSize: 11, flex: 1, fontWeight: '600' },
  learnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#9333ea',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  learnBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 10 },
  loadingText: { color: '#94a3b8', fontSize: 12 },
  errorText: { color: '#fda4af', fontSize: 13, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#9333ea',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 6,
  },
  retryText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  emptySub: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 6 },
});

export default OpportunitiesScreen;