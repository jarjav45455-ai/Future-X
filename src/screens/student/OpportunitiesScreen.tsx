import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExternalLink,
  CheckCircle,
  Clock,
  Sparkles,
  DollarSign,
  AlertTriangle,
  Building,
  MapPin,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';

import { FutureXHeader } from '../../components/common/FutureXHeader';
import { StudentProfile } from '../../types/student';
import { fetchLiveRadarOpportunities } from '../../services/careerEngine';
import { PantherDialoguePopup } from '../../components/panther/PantherDialoguePopup';

export interface DynamicOpportunity {
  id: string;
  title: string;
  organization: string;
  type?: string;
  location: string;
  deadline?: string;
  applyUrl?: string;
  applicationUrl?: string;
  requiredSkills: string[];
  missingSkills?: string[];
  matchScore: number;
  stipendOrPrize?: string;
  summary?: string;
  eligibility?: string;
  requiredPhase?: number;
  eligiblePhases?: number[];
}

interface OpportunitiesScreenProps {
  profile: StudentProfile;
  onBack: () => void;
  onNavigateToRoadmap?: () => void;
}

export const OpportunitiesScreen: React.FC<OpportunitiesScreenProps> = ({
  profile,
  onBack,
  onNavigateToRoadmap,
}) => {
  const cacheKey = `@futurex_opps_${profile.id || 'usr'}_${profile.targetRole.roleId}`;
  const [opportunities, setOpportunities] = useState<DynamicOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'HACKATHON' | 'INTERNSHIP' | 'JOB'>('ALL');
  const [showPantherPopup, setShowPantherPopup] = useState(true);

  // Active current user roadmap phase step (e.g., Phase 1, Phase 2)
  const currentPhase = useMemo(() => {
    const active = profile.roadmap?.find((m) => m.status === 'current');
    return active ? active.stepNumber : 1;
  }, [profile.roadmap]);

  useEffect(() => {
    loadCachedAndFetchRadar();
  }, [profile.targetRole.roleId]);

  const loadCachedAndFetchRadar = async () => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setOpportunities(JSON.parse(cached));
        setLoading(false);
      }
    } catch {
      // Ignore
    }

    syncRadar();
  };

  const syncRadar = async () => {
    setRefreshing(true);
    try {
      const res = await fetchLiveRadarOpportunities({
        targetRole: profile.targetRole,
        userSkills: profile.skills,
      });

      if (res && res.opportunities && res.opportunities.length > 0) {
        setOpportunities(res.opportunities);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(res.opportunities));
      }
    } catch (e) {
      console.warn('Sync radar error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredOpportunities = useMemo(() => {
    if (selectedFilter === 'ALL') return opportunities;
    return opportunities.filter((o) => (o.type || '').toUpperCase().includes(selectedFilter));
  }, [opportunities, selectedFilter]);

  const topOpportunity = opportunities[0];

  const handleOpenLink = async (targetUrl: string, queryFallback?: string) => {
    try {
      let finalUrl = targetUrl;
      if (!finalUrl || !finalUrl.startsWith('http')) {
        const q = encodeURIComponent(queryFallback || targetUrl || 'hackathons');
        finalUrl = `https://www.google.com/search?q=${q}`;
      }

      const supported = await Linking.canOpenURL(finalUrl);
      if (supported) {
        await Linking.openURL(finalUrl);
      } else {
        await Linking.openURL(
          `https://www.google.com/search?q=${encodeURIComponent(queryFallback || 'tech opportunities')}`
        );
      }
    } catch (error) {
      console.warn('Could not open link:', error);
    }
  };

  // Helper: Checks if opportunity is eligible for current phase
  const checkPhaseEligibility = (item: DynamicOpportunity) => {
    if (item.eligiblePhases && Array.isArray(item.eligiblePhases)) {
      return item.eligiblePhases.includes(currentPhase);
    }
    const targetRequired = item.requiredPhase || 1;
    return currentPhase >= targetRequired;
  };

  return (
    <SafeAreaView style={styles.container}>
      <FutureXHeader
        title="Opportunities Radar"
        subtitle={`Stage-Gated Matches • Current: Phase ${currentPhase}`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Match Spotlight Card */}
        {topOpportunity && (
          <View style={styles.topCard}>
            <View style={styles.topHeaderRow}>
              <View style={styles.badgeRow}>
                {checkPhaseEligibility(topOpportunity) ? (
                  <View style={styles.topBadgeEligible}>
                    <ShieldCheck size={12} color="#34d399" />
                    <Text style={styles.topBadgeEligibleText}>COMPLETELY ELIGIBLE</Text>
                  </View>
                ) : (
                  <View style={styles.topBadgeLocked}>
                    <Lock size={12} color="#f59e0b" />
                    <Text style={styles.topBadgeLockedText}>
                      UNLOCKS IN PHASE {topOpportunity.requiredPhase || 2}
                    </Text>
                  </View>
                )}
                {topOpportunity.type ? (
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{topOpportunity.type.toUpperCase()}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.scoreDial}>
                <Text style={styles.scoreDialValue}>{topOpportunity.matchScore}%</Text>
                <Text style={styles.scoreDialLabel}>MATCH</Text>
              </View>
            </View>

            <Text style={styles.oppTitle}>{topOpportunity.title}</Text>

            <View style={styles.metaLocationRow}>
              <View style={styles.rowInline}>
                <Building size={13} color="#94a3b8" />
                <Text style={styles.orgName}>{topOpportunity.organization}</Text>
              </View>
              <Text style={styles.dotSeparator}>•</Text>
              <View style={styles.rowInline}>
                <MapPin size={13} color="#94a3b8" />
                <Text style={styles.locationText}>{topOpportunity.location}</Text>
              </View>
            </View>

            {topOpportunity.stipendOrPrize ? (
              <View style={styles.prizeBanner}>
                <DollarSign size={14} color="#10b981" />
                <Text style={styles.prizeBannerText}>{topOpportunity.stipendOrPrize}</Text>
              </View>
            ) : null}

            <View style={styles.reasonBlock}>
              <View style={styles.reasonRow}>
                <CheckCircle size={14} color="#34d399" />
                <Text style={styles.reasonText}>{topOpportunity.summary}</Text>
              </View>
            </View>

            <View style={styles.skillsSection}>
              <Text style={styles.skillsHeading}>Required Competencies:</Text>
              <View style={styles.skillsTagRow}>
                {topOpportunity.requiredSkills?.map((sk, idx) => (
                  <View key={`req-${idx}`} style={styles.skillPill}>
                    <Text style={styles.skillPillText}>{sk}</Text>
                  </View>
                ))}
              </View>

              {topOpportunity.missingSkills && topOpportunity.missingSkills.length > 0 ? (
                <View style={styles.missingBox}>
                  <AlertTriangle size={13} color="#f59e0b" />
                  <Text style={styles.missingText}>
                    Missing Gaps: {topOpportunity.missingSkills.join(', ')}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.metaFooter}>
              <View style={styles.deadlineBadge}>
                <Clock size={12} color="#94a3b8" />
                <Text style={styles.deadlineText}>Deadline: {topOpportunity.deadline || 'Active 2026'}</Text>
              </View>
            </View>

            {checkPhaseEligibility(topOpportunity) ? (
              <TouchableOpacity
                style={styles.applyBtn}
                activeOpacity={0.85}
                onPress={() =>
                  handleOpenLink(
                    (topOpportunity.applyUrl || topOpportunity.applicationUrl) as string,
                    `${topOpportunity.title} ${topOpportunity.organization} apply`
                  )
                }
              >
                <Text style={styles.applyBtnText}>Apply to Official Portal</Text>
                <ExternalLink size={16} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.lockedBtn}
                activeOpacity={0.85}
                onPress={() => {
                  if (onNavigateToRoadmap) onNavigateToRoadmap();
                  else onBack();
                }}
              >
                <Text style={styles.lockedBtnText}>
                  Complete Phase {topOpportunity.requiredPhase || 2} on Roadmap to Unlock
                </Text>
                <ArrowRight size={15} color="#f59e0b" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['ALL', 'HACKATHON', 'INTERNSHIP', 'JOB'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selectedFilter === filter && styles.activeFilterChip]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
          {refreshing && <ActivityIndicator size="small" color="#38bdf8" style={{ marginLeft: 6 }} />}
        </View>

        <Text style={styles.sectionTitle}>
          Ground-Verified Radar Alerts ({filteredOpportunities.length})
        </Text>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#34d399" />
            <Text style={styles.loadingText}>Syncing roadmap stage telemetry...</Text>
          </View>
        ) : (
          filteredOpportunities.slice(1).map((item) => {
            const isEligible = checkPhaseEligibility(item);

            return (
              <View
                key={item.id}
                style={[
                  styles.regularCard,
                  !isEligible && { borderColor: 'rgba(245, 158, 11, 0.25)' },
                ]}
              >
                <View style={styles.regularHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={styles.badgeRowSmall}>
                      <Text style={styles.regularTypeBadge}>{item.type || 'ACTIVE OPENING'}</Text>
                      {item.stipendOrPrize ? (
                        <Text style={styles.regularPrizeBadge}>{item.stipendOrPrize}</Text>
                      ) : null}
                      {isEligible ? (
                        <View style={styles.miniEligibleBadge}>
                          <Text style={styles.miniEligibleText}>ELIGIBLE</Text>
                        </View>
                      ) : (
                        <View style={styles.miniLockedBadge}>
                          <Text style={styles.miniLockedText}>
                            PHASE {item.requiredPhase || 2} REQ
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.regularTitle}>{item.title}</Text>
                    <Text style={styles.regularOrg}>
                      {item.organization} • {item.location}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.smallScoreDial,
                      !isEligible && { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' },
                    ]}
                  >
                    <Text style={[styles.smallScoreVal, !isEligible && { color: '#f59e0b' }]}>
                      {item.matchScore}%
                    </Text>
                  </View>
                </View>

                <View style={styles.skillsTagRow}>
                  {item.requiredSkills?.slice(0, 4).map((sk, idx) => (
                    <View key={idx} style={styles.skillPill}>
                      <Text style={styles.skillPillText}>{sk}</Text>
                    </View>
                  ))}
                </View>

                {item.missingSkills && item.missingSkills.length > 0 ? (
                  <View style={styles.missingPillRow}>
                    <AlertTriangle size={11} color="#f59e0b" />
                    <Text style={styles.missingPillText}>
                      Missing: {item.missingSkills.join(', ')}
                    </Text>
                  </View>
                ) : null}

                {isEligible ? (
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    activeOpacity={0.8}
                    onPress={() =>
                      handleOpenLink(
                        (item.applyUrl || item.applicationUrl) as string,
                        `${item.title} ${item.organization} apply`
                      )
                    }
                  >
                    <Text style={styles.detailsBtnText}>Verify Listing & Apply</Text>
                    <ExternalLink size={13} color="#cbd5e1" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.lockedDetailsBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (onNavigateToRoadmap) onNavigateToRoadmap();
                      else onBack();
                    }}
                  >
                    <Text style={styles.lockedDetailsBtnText}>
                      Learn in Phase {item.requiredPhase || 2} on Roadmap
                    </Text>
                    <ArrowRight size={13} color="#f59e0b" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {topOpportunity ? (
        <PantherDialoguePopup
          visible={showPantherPopup}
          mode="scout"
          tagline="ROADMAP-GATED RADAR"
          message={`Arjav, you are in Phase ${currentPhase}. Openings requiring Phase ${currentPhase + 1} skills are locked until you master the upcoming milestones.`}
          onDismiss={() => setShowPantherPopup(false)}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 60 },
  topCard: {
    backgroundColor: 'rgba(18, 13, 31, 0.85)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#34d399',
  },
  topHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  topBadgeEligible: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topBadgeEligibleText: { color: '#34d399', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  topBadgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topBadgeLockedText: { color: '#f59e0b', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  typeBadge: { backgroundColor: 'rgba(56, 189, 248, 0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { color: '#38bdf8', fontSize: 10, fontWeight: '700' },
  scoreDial: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDialValue: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  scoreDialLabel: { color: '#34d399', fontSize: 8, fontWeight: '800' },
  oppTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 10 },
  metaLocationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  rowInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orgName: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  locationText: { color: '#94a3b8', fontSize: 12 },
  dotSeparator: { color: '#64748b' },
  prizeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  prizeBannerText: { color: '#10b981', fontSize: 12, fontWeight: '700' },
  reasonBlock: { marginVertical: 10 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  reasonText: { color: '#cbd5e1', fontSize: 12, flex: 1, lineHeight: 17 },
  skillsSection: { marginTop: 6 },
  skillsHeading: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  skillsTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  skillPillText: { color: '#cbd5e1', fontSize: 11 },
  missingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  missingText: { color: '#f59e0b', fontSize: 11, fontWeight: '600', flex: 1 },
  metaFooter: { marginTop: 12 },
  deadlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deadlineText: { color: '#94a3b8', fontSize: 11 },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  lockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  lockedBtnText: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeFilterChip: { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8' },
  filterText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  activeFilterText: { color: '#38bdf8', fontWeight: '700' },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 10 },
  centerLoading: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { color: '#94a3b8', fontSize: 12 },
  regularCard: {
    backgroundColor: 'rgba(12, 8, 23, 0.85)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  regularHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badgeRowSmall: { flexDirection: 'row', gap: 6, marginBottom: 4, alignItems: 'center' },
  regularTypeBadge: { color: '#38bdf8', fontSize: 9, fontWeight: '800' },
  regularPrizeBadge: { color: '#34d399', fontSize: 9, fontWeight: '700' },
  miniEligibleBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniEligibleText: { color: '#34d399', fontSize: 8, fontWeight: '800' },
  miniLockedBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniLockedText: { color: '#f59e0b', fontSize: 8, fontWeight: '800' },
  regularTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  regularOrg: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  smallScoreDial: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallScoreVal: { color: '#38bdf8', fontSize: 12, fontWeight: '800' },
  missingPillRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  missingPillText: { color: '#f59e0b', fontSize: 11 },
  detailsBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  detailsBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  lockedDetailsBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  lockedDetailsBtnText: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
});

export default OpportunitiesScreen;