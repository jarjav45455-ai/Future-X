import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  BookOpen,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Target,
  ShieldAlert,
} from 'lucide-react-native';
import { apiRequest } from '../../config/api';
import { FutureXHeader } from '../../components/common/FutureXHeader';
import { StudentProfile } from '../../types/student';

interface OccupationSummary {
  id: string;
  title: string;
  category: string;
  domain: string;
  seniority: string;
  description: string;
  skillCount: number;
  sourceFramework?: string;
}

interface OccupationSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  whyItMatters: string;
  requiredProficiency: number;
  difficultyLevel: string;
  isRequired: boolean;
  prerequisites: { id: string; name: string }[];
  currentSelfRating: number | null;
  verifiedScore: number | null;
  verificationStatus: string;
}

interface OccupationDetail {
  id: string;
  title: string;
  category: string;
  domain: string;
  seniority: string;
  description: string;
  educationRequirements: string;
  responsibilities: string[];
  careerGrowth: string;
  sourceAttribution?: string;
}

interface RelatedOccupation {
  id: string;
  title: string;
  category: string;
  seniority: string;
}

interface CareerExplorerScreenProps {
  currentProfile: StudentProfile;
  onBack: () => void;
  onAssessmentComplete: (payload: {
    updatedProfile: StudentProfile;
    summary: {
      baselineReadiness: number;
      missingCount: number;
      weakCount: number;
      strongSelfAssessedCount: number;
    };
  }) => void;
}

const RATING_SCALE = [
  { value: 0, short: '0', label: 'Zero / Never Tried', color: '#f43f5e' },
  { value: 1, short: '1', label: 'Novice (Heard of it)', color: '#fb7185' },
  { value: 2, short: '2', label: 'Basic (Learning)', color: '#fb923c' },
  { value: 3, short: '3', label: 'Intermediate', color: '#facc15' },
  { value: 4, short: '4', label: 'Strong (Can Build)', color: '#38bdf8' },
  { value: 5, short: '5', label: 'Expert / Mastery', color: '#34d399' },
];

export const CareerExplorerScreen: React.FC<CareerExplorerScreenProps> = ({
  currentProfile,
  onBack,
  onAssessmentComplete,
}) => {
  const [step, setStep] = useState<'browse' | 'detail' | 'assess'>('browse');

  // Browse State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [occupations, setOccupations] = useState<OccupationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Detail & Assessment State
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedOcc, setSelectedOcc] = useState<OccupationDetail | null>(null);
  const [occSkills, setOccSkills] = useState<OccupationSkill[]>([]);
  const [relatedOccs, setRelatedOccs] = useState<RelatedOccupation[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load 101 careers from SQLite DB
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOccupations();
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const fetchOccupations = async () => {
    setLoadingList(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }

      const data = await apiRequest<{
        success: boolean;
        categories: string[];
        occupations: OccupationSummary[];
      }>(`/api/occupations?${params.toString()}`);

      setOccupations(data.occupations || []);
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load 101-career database.');
    } finally {
      setLoadingList(false);
    }
  };

  const openOccupationDetail = async (occupationId: string) => {
    setLoadingDetail(true);
    setErrorMsg('');
    try {
      const data = await apiRequest<{
        success: boolean;
        occupation: OccupationDetail;
        skills: OccupationSkill[];
        relatedOccupations: RelatedOccupation[];
      }>(`/api/occupations/${encodeURIComponent(occupationId)}`);

      setSelectedOcc(data.occupation);
      setOccSkills(data.skills || []);
      setRelatedOccs(data.relatedOccupations || []);

      // Pre-fill existing self-ratings or honestly default to 0 (Zero Knowledge)
      const initialRatings: Record<string, number> = {};
      for (const sk of data.skills || []) {
        initialRatings[sk.id] =
          sk.currentSelfRating !== null && sk.currentSelfRating !== undefined
            ? sk.currentSelfRating
            : 0;
      }
      setRatingsMap(initialRatings);
      setStep('detail');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load career details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Group skills by category for structured multi-category display
  const groupedSkills = useMemo(() => {
    const map: Record<string, OccupationSkill[]> = {};
    for (const sk of occSkills) {
      const cat = sk.category || 'Core Skills';
      if (!map[cat]) map[cat] = [];
      map[cat].push(sk);
    }
    return Object.entries(map);
  }, [occSkills]);

  // Live readiness preview as student taps 0-5
  const livePreview = useMemo(() => {
    if (occSkills.length === 0) {
      return { readiness: 0, zeroCount: 0, gapCount: 0 };
    }
    let achieved = 0;
    let maxPts = 0;
    let zeroCount = 0;
    let gapCount = 0;

    for (const sk of occSkills) {
      const r = ratingsMap[sk.id] ?? 0;
      const req = sk.requiredProficiency || 4;
      const w = sk.isRequired ? 2 : 1;
      achieved += Math.min(r, req) * w;
      maxPts += req * w;
      if (r === 0) zeroCount++;
      if (r < req) gapCount++;
    }

    return {
      readiness: maxPts > 0 ? Math.round((achieved / maxPts) * 100) : 0,
      zeroCount,
      gapCount,
    };
  }, [occSkills, ratingsMap]);

  const handleSubmitAssessment = async () => {
    if (!selectedOcc) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const ratingsPayload = occSkills.map((sk) => ({
        skillId: sk.id,
        rating: ratingsMap[sk.id] ?? 0,
      }));

      // 1. Save 0-5 assessment to SQLite backend
      const saved = await apiRequest<{
        success: boolean;
        occupation: {
          id: string;
          title: string;
          category: string;
          domain: string;
          seniority: string;
        };
        summary: {
          baselineReadiness: number;
          missingCount: number;
          weakCount: number;
          strongSelfAssessedCount: number;
        };
        skills: Array<{
          id: string;
          name: string;
          category: string;
          selfRating: number;
          requiredProficiency: number;
          proficiencyPercentage: number;
          targetBenchmarkPercentage: number;
          gapStatus: string;
          isGap: boolean;
          verificationStatus: string;
        }>;
      }>('/api/assessments/self', {
        method: 'POST',
        body: {
          occupationId: selectedOcc.id,
          ratings: ratingsPayload,
        },
      });

      // 2. Fetch deterministic roadmap tailored to 0-5 ratings (Zero AI)
      const roadmapRes = await apiRequest<{
        success: boolean;
        roadmap: any[];
        marketDemand?: string;
      }>('/api/careers/generate-tailored-roadmap', {
        method: 'POST',
        body: {
          roleQuery: selectedOcc.title,
          skillRatings: occSkills.map((sk) => ({
            id: sk.id,
            name: sk.name,
            rating: ratingsMap[sk.id] ?? 0,
          })),
        },
      });

      const formattedSkills = (saved.skills || []).map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category as any,
        proficiency: s.proficiencyPercentage,
        targetBenchmark: s.targetBenchmarkPercentage,
        // Honest status: Self-assessment is NEVER marked Verified
        status: (s.selfRating === 0 ? 'Self Reported' : 'Self Reported') as any,
        isGap: s.isGap,
      }));

      const formattedRoadmap = (roadmapRes.roadmap || []).map((m: any, idx: number) => ({
        id: m.id || `milestone-${idx + 1}`,
        stepNumber: m.stepNumber || idx + 1,
        title: m.title,
        subtitle: m.subtitle,
        category: m.category || 'Execution',
        duration: m.duration || '2-3 Weeks',
        prerequisites:
          Array.isArray(m.prerequisites) && m.prerequisites.length > 0
            ? m.prerequisites
            : idx === 0
              ? ['0–5 Baseline Assessment']
              : [`Phase ${idx} Mastery`],
        deliverable: m.deliverable || 'Portfolio Deliverable',
        status: (idx === 0 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming',
        assessmentUnlocked: idx === 0,
        skills: Array.isArray(m.skills) ? m.skills : [],
      }));

      const updatedProfile: StudentProfile = {
        ...currentProfile,
        targetRole: {
          roleId: selectedOcc.id,
          roleTitle: selectedOcc.title,
          profession: selectedOcc.category,
          domainId: (selectedOcc.domain as any) || 'engineering_tech',
          seniority: (selectedOcc.seniority as any) || 'Entry / Junior',
          requiredSkills: occSkills.map((s) => s.name),
          keyTools: occSkills
            .filter((s) => s.category.toLowerCase().includes('tool'))
            .map((s) => s.name),
          marketDemand: (roadmapRes.marketDemand as any) || 'High',
        },
        skills: formattedSkills,
        roadmap: formattedRoadmap,
        readinessPercentage: saved.summary.baselineReadiness,
      };

      onAssessmentComplete({
        updatedProfile,
        summary: saved.summary,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save assessment. Check server connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // VIEW 3: 0-TO-5 MULTI-CATEGORY SKILL ASSESSMENT
  // ==========================================
  if (step === 'assess' && selectedOcc) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('detail')}>
            <ArrowLeft size={18} color="#e2e8f0" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topBarTitle}>0–5 Skill Assessment</Text>
            <Text style={styles.topBarSub} numberOfLines={1}>
              {selectedOcc.title} • {occSkills.length} Deep Skills
            </Text>
          </View>
          <View style={styles.liveScorePill}>
            <Text style={styles.liveScoreText}>{livePreview.readiness}%</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Scale Legend Card */}
          <View style={styles.legendCard}>
            <View style={styles.row}>
              <ShieldAlert size={15} color="#c084fc" />
              <Text style={styles.legendTitle}>Honest Self-Rating Scale (0 = Zero Knowledge)</Text>
            </View>
            <Text style={styles.legendDesc}>
              Select <Text style={{ color: '#f43f5e', fontWeight: '800' }}>0</Text> if you have never learned a skill yet. Self-ratings create your baseline gap map — complete Skill Checks & Projects later to earn Verified status.
            </Text>
            <View style={styles.legendGrid}>
              {RATING_SCALE.map((r) => (
                <View key={r.value} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: r.color }]} />
                  <Text style={styles.legendItemText}>
                    {r.short}: {r.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Categorized Skill Cards */}
          {groupedSkills.map(([category, skills]) => (
            <View key={category} style={styles.categoryGroup}>
              <Text style={styles.categoryHeader}>{category.toUpperCase()}</Text>

              {skills.map((sk) => {
                const currentVal = ratingsMap[sk.id] ?? 0;
                const activeMeta = RATING_SCALE[currentVal] || RATING_SCALE[0];
                const isGap = currentVal < (sk.requiredProficiency || 4);

                return (
                  <View key={sk.id} style={styles.assessCard}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.assessSkillName}>{sk.name}</Text>
                      <View style={styles.targetChip}>
                        <Text style={styles.targetChipText}>
                          Target: {sk.requiredProficiency}/5
                        </Text>
                      </View>
                    </View>

                    {sk.description ? (
                      <Text style={styles.assessDesc}>{sk.description}</Text>
                    ) : null}

                    {/* 0 to 5 Tap Buttons */}
                    <View style={styles.scaleRow}>
                      {RATING_SCALE.map((opt) => {
                        const selected = currentVal === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            activeOpacity={0.75}
                            onPress={() =>
                              setRatingsMap((prev) => ({ ...prev, [sk.id]: opt.value }))
                            }
                            style={[
                              styles.scaleBtn,
                              selected && {
                                backgroundColor: opt.color + '28',
                                borderColor: opt.color,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.scaleBtnText,
                                selected && { color: opt.color, fontWeight: '900' },
                              ]}
                            >
                              {opt.short}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={[styles.rowBetween, { marginTop: 8 }]}>
                      <Text style={[styles.selectedLabelText, { color: activeMeta.color }]}>
                        {activeMeta.short}/5 • {activeMeta.label}
                      </Text>
                      <Text
                        style={[
                          styles.gapTagText,
                          { color: isGap ? '#fb923c' : '#34d399' },
                        ]}
                      >
                        {currentVal === 0
                          ? 'Starting from Scratch'
                          : isGap
                            ? 'Gap to Close'
                            : 'Meets Baseline'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          {errorMsg ? (
            <View style={styles.errorBox}>
              <AlertCircle size={15} color="#fda4af" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Sticky Submit Footer */}
        <View style={styles.stickyFooter}>
          <View style={styles.footerStats}>
            <Text style={styles.footerStatText}>
              Baseline: <Text style={{ color: '#38bdf8', fontWeight: '800' }}>{livePreview.readiness}%</Text>
            </Text>
            <Text style={styles.footerStatText}>
              Zero Skills: <Text style={{ color: '#f43f5e', fontWeight: '800' }}>{livePreview.zeroCount}</Text>
            </Text>
            <Text style={styles.footerStatText}>
              Gaps: <Text style={{ color: '#fb923c', fontWeight: '800' }}>{livePreview.gapCount}</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
            disabled={submitting}
            onPress={handleSubmitAssessment}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#9333ea', '#ec4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGrad}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Sparkles size={17} color="#ffffff" />
                  <Text style={styles.primaryBtnText}>Save 0–5 Baseline & Build Roadmap</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // VIEW 2: CAREER DETAIL VIEW
  // ==========================================
  if (step === 'detail' && selectedOcc) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('browse')}>
            <ArrowLeft size={18} color="#e2e8f0" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {selectedOcc.title}
            </Text>
            <Text style={styles.topBarSub}>
              {selectedOcc.category} • {selectedOcc.seniority}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Overview Card */}
          <View style={styles.detailHero}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.2)', 'rgba(56, 189, 248, 0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.verifiedBadge}>
              <CheckCircle2 size={12} color="#34d399" />
              <Text style={styles.verifiedBadgeText}>Zero-AI Verified Career Ontology</Text>
            </View>
            <Text style={styles.detailTitle}>{selectedOcc.title}</Text>
            <Text style={styles.detailDesc}>{selectedOcc.description}</Text>

            {selectedOcc.careerGrowth ? (
              <View style={styles.metaBlock}>
                <View style={styles.row}>
                  <TrendingUp size={13} color="#38bdf8" />
                  <Text style={styles.metaLabel}>CAREER GROWTH PATH</Text>
                </View>
                <Text style={styles.metaValue}>{selectedOcc.careerGrowth}</Text>
              </View>
            ) : null}

            {selectedOcc.educationRequirements ? (
              <View style={styles.metaBlock}>
                <View style={styles.row}>
                  <BookOpen size={13} color="#c084fc" />
                  <Text style={styles.metaLabel}>EDUCATION & ENTRY</Text>
                </View>
                <Text style={styles.metaValue}>{selectedOcc.educationRequirements}</Text>
              </View>
            ) : null}
          </View>

          {/* Responsibilities */}
          {selectedOcc.responsibilities && selectedOcc.responsibilities.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>KEY RESPONSIBILITIES</Text>
              {selectedOcc.responsibilities.map((resp, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{resp}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Deep Skills Preview */}
          <View style={styles.sectionCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>REQUIRED SKILL ONTOLOGY ({occSkills.length})</Text>
              <Layers size={14} color="#c084fc" />
            </View>

            {groupedSkills.map(([cat, list]) => (
              <View key={cat} style={{ marginTop: 10 }}>
                <Text style={styles.miniCatTitle}>{cat}</Text>
                {list.map((sk) => (
                  <View key={sk.id} style={styles.skillPreviewItem}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.skillPreviewName}>{sk.name}</Text>
                      <Text style={styles.diffPill}>{sk.difficultyLevel}</Text>
                    </View>
                    {sk.whyItMatters ? (
                      <Text style={styles.skillWhy}>Why it matters: {sk.whyItMatters}</Text>
                    ) : null}
                    {sk.prerequisites.length > 0 && (
                      <Text style={styles.prereqText}>
                        Prerequisites: {sk.prerequisites.map((p) => p.name).join(', ')}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Related Careers */}
          {relatedOccs.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>RELATED CAREERS</Text>
              <View style={styles.relatedWrap}>
                {relatedOccs.map((rel) => (
                  <TouchableOpacity
                    key={rel.id}
                    style={styles.relatedChip}
                    onPress={() => openOccupationDetail(rel.id)}
                  >
                    <Text style={styles.relatedChipText}>{rel.title}</Text>
                    <ChevronRight size={13} color="#c084fc" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.stickyFooter}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setStep('assess')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#6366f1', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGrad}
            >
              <Target size={18} color="#ffffff" />
              <Text style={styles.primaryBtnText}>
                Start 0–5 Skill Assessment for This Role
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // VIEW 1: 101-CAREER SEARCHABLE EXPLORER
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FutureXHeader
        title="101 Career Explorer"
        subtitle="Zero-AI verified pathways & deep skill ontologies"
        onBack={onBack}
      />

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Search size={17} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search 101 careers or skills (e.g. AI, Pilot, Law, D2C)..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {errorMsg ? (
        <View style={[styles.errorBox, { marginHorizontal: 16 }]}>
          <AlertCircle size={15} color="#fda4af" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {loadingList || loadingDetail ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text style={styles.loadingText}>
            {loadingDetail ? 'Loading deep skill ontology...' : 'Loading verified careers...'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.countText}>
            Showing {occupations.length} verified career pathways
          </Text>

          {occupations.map((occ) => {
            const isCurrent = currentProfile.targetRole?.roleId === occ.id;
            return (
              <TouchableOpacity
                key={occ.id}
                style={[styles.occCard, isCurrent && styles.occCardCurrent]}
                activeOpacity={0.8}
                onPress={() => openOccupationDetail(occ.id)}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <View style={styles.row}>
                    <Text style={styles.occCategory}>{occ.category}</Text>
                    {isCurrent && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE AIM</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.occTitle}>{occ.title}</Text>
                  <Text style={styles.occDesc} numberOfLines={2}>
                    {occ.description}
                  </Text>
                  <View style={[styles.row, { marginTop: 8, gap: 10 }]}>
                    <Text style={styles.occMetaPill}>{occ.skillCount} Deep Skills</Text>
                    <Text style={styles.occMetaSub}>{occ.seniority}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#c084fc" />
              </TouchableOpacity>
            );
          })}

          {occupations.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No matching career found</Text>
              <Text style={styles.emptySub}>
                Try searching a broader keyword like "Engineer", "Finance", "Design", or "Medical".
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  topBarSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  liveScorePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveScoreText: { color: '#38bdf8', fontSize: 12, fontWeight: '800' },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#110b20',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.28)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 13 },
  catScroll: { paddingTop: 10, paddingBottom: 4, gap: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  catChipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.28)',
    borderColor: '#c084fc',
  },
  catChipText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  catChipTextActive: { color: '#ffffff', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  countText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  occCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#110b20',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
  },
  occCardCurrent: {
    borderColor: 'rgba(192, 132, 252, 0.6)',
    backgroundColor: 'rgba(88, 28, 135, 0.16)',
  },
  occCategory: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  activeBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: { color: '#34d399', fontSize: 9, fontWeight: '800' },
  occTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginTop: 4 },
  occDesc: { color: '#94a3b8', fontSize: 12, marginTop: 4, lineHeight: 17 },
  occMetaPill: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  occMetaSub: { color: '#64748b', fontSize: 10, fontWeight: '600' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { color: '#94a3b8', fontSize: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  emptySub: { color: '#94a3b8', fontSize: 12, marginTop: 6, textAlign: 'center' },
  scrollContent: { padding: 16, paddingBottom: 130 },
  detailHero: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
    backgroundColor: '#110b20',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
    marginBottom: 14,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  verifiedBadgeText: { color: '#34d399', fontSize: 10, fontWeight: '700' },
  detailTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  detailDesc: { color: '#cbd5e1', fontSize: 13, lineHeight: 19, marginTop: 8 },
  metaBlock: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  metaLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.7,
  },
  metaValue: { color: '#e2e8f0', fontSize: 12, marginTop: 4, lineHeight: 17 },
  sectionCard: {
    backgroundColor: '#110b20',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c084fc',
    marginTop: 6,
  },
  bulletText: { flex: 1, color: '#e2e8f0', fontSize: 12, lineHeight: 18 },
  miniCatTitle: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  skillPreviewItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  skillPreviewName: { color: '#ffffff', fontSize: 13, fontWeight: '700', flex: 1 },
  diffPill: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  skillWhy: { color: '#94a3b8', fontSize: 11, marginTop: 4, lineHeight: 16 },
  prereqText: { color: '#fbbf24', fontSize: 10, marginTop: 4, fontWeight: '600' },
  relatedWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  relatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(192, 132, 252, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  relatedChipText: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  legendCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  legendTitle: { color: '#ffffff', fontSize: 13, fontWeight: '800', marginLeft: 7 },
  legendDesc: { color: '#cbd5e1', fontSize: 11, marginTop: 6, lineHeight: 16 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, width: '47%' },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendItemText: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  categoryGroup: { marginBottom: 16 },
  categoryHeader: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 8,
    marginLeft: 4,
  },
  assessCard: {
    backgroundColor: '#110b20',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  assessSkillName: { color: '#ffffff', fontSize: 14, fontWeight: '700', flex: 1, paddingRight: 8 },
  targetChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  targetChipText: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  assessDesc: { color: '#94a3b8', fontSize: 11, marginTop: 4, lineHeight: 16 },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 12,
  },
  scaleBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleBtnText: { color: '#cbd5e1', fontSize: 14, fontWeight: '700' },
  selectedLabelText: { fontSize: 11, fontWeight: '700' },
  gapTagText: { fontSize: 10, fontWeight: '700' },
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
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 3, 10, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
  },
  footerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  footerStatText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  primaryBtn: { borderRadius: 14, overflow: 'hidden' },
  primaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});

export default CareerExplorerScreen;