import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CheckSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';


import { FutureXHeader } from '../../components/common/FutureXHeader';
import { StudentProfile } from '../../types/student';
import { fetchRecommendedProjects, RecommendedProject } from '../../services/careerEngine';
import { PantherDialoguePopup } from '../../components/panther/PantherDialoguePopup';

interface ProjectsScreenProps {
  profile: StudentProfile;
  onBack: () => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ profile, onBack }) => {
  const cacheKey = `@futurex_projects_${profile.id || 'usr'}_${profile.targetRole.roleId}`;
  const currentPhase = profile.roadmap.find((m) => m.status === 'current') || profile.roadmap[0];
  const skillGaps = profile.skills.filter((s) => s.isGap).map((s) => s.name);

  const [projects, setProjects] = useState<RecommendedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGuidance, setExpandedGuidance] = useState<Record<string, boolean>>({});
  const [showPantherPopup, setShowPantherPopup] = useState(true);

  useEffect(() => {
    loadCachedAndFetchProjects();
  }, [profile.targetRole.roleId, currentPhase?.id]);

  const loadCachedAndFetchProjects = async () => {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setProjects(JSON.parse(cached));
        setLoading(false);
      }
    } catch {
      // Ignore cache error
    }

    // Refresh in background
    syncProjectsWithAI();
  };

  const syncProjectsWithAI = async () => {
    setRefreshing(true);
    try {
      const freshProjects = await fetchRecommendedProjects({
        targetRole: profile.targetRole,
        currentPhase,
        skillGaps,
      });

      if (freshProjects && freshProjects.length > 0) {
        setProjects(freshProjects);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(freshProjects));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleGuidance = (id: string) => {
    setExpandedGuidance((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const topProject = projects[0];

  return (
    <SafeAreaView style={styles.container}>
      <FutureXHeader
        title="Practical Proof Projects"
        subtitle={`Domain-Verified Deliverables for ${profile.targetRole.roleTitle}`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerHeader}>
            <Text style={styles.bannerTag}>PORTFOLIO INTELLIGENCE ENGINE</Text>
            {refreshing && <ActivityIndicator size="small" color="#38bdf8" />}
          </View>
          <Text style={styles.bannerHeading}>“Build actual proof, not just resume claims.”</Text>
          <Text style={styles.bannerSub}>
            Projects calibrated to close your skill gaps for {profile.targetRole.roleTitle} ({currentPhase?.title}).
          </Text>
        </View>

        {/* TOP PROJECT SPOTLIGHT */}
        {topProject && (
          <View style={styles.spotlightCard}>
            <View style={styles.spotlightHeader}>
              <View style={styles.spotlightBadge}>
                <Sparkles size={12} color="#34d399" />
                <Text style={styles.spotlightBadgeText}>TOP RECOMMENDATION</Text>
              </View>
              <Text style={styles.levelBadge}>{topProject.level}</Text>
            </View>

            <Text style={styles.spotlightTitle}>{topProject.title}</Text>
            <Text style={styles.spotlightProblem}>{topProject.problemStatement}</Text>

            <View style={styles.whyBox}>
              <ShieldCheck size={14} color="#34d399" />
              <Text style={styles.whyText}>{topProject.whyRecommended}</Text>
            </View>

            <View style={styles.skillsTagRow}>
              {topProject.skillsDeveloped.map((sk, idx) => (
                <View key={idx} style={styles.skillPill}>
                  <Text style={styles.skillPillText}>{sk}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Curated Tiered Projects ({projects.length})</Text>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#c084fc" />
            <Text style={styles.loadingText}>Synthesizing custom portfolio projects...</Text>
          </View>
        ) : (
          projects.map((proj) => {
            const isExpanded = expandedGuidance[proj.id];
            return (
              <View key={proj.id} style={styles.projectCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.levelTag}>
                    <Text style={styles.levelTagText}>{proj.level}</Text>
                  </View>
                  <View style={styles.timeTag}>
                    <Clock size={12} color="#94a3b8" />
                    <Text style={styles.timeText}>{proj.estimatedHours || 20} hrs</Text>
                  </View>
                </View>

                <Text style={styles.projTitle}>{proj.title}</Text>
                <Text style={styles.projStatement}>{proj.problemStatement}</Text>

                <View style={styles.whyBoxRegular}>
                  <Text style={styles.whyTextRegular}>{proj.whyRecommended}</Text>
                </View>

                {/* Skills */}
                <View style={styles.tagWrap}>
                  {proj.skillsDeveloped.map((sk, idx) => (
                    <View key={idx} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>{sk}</Text>
                    </View>
                  ))}
                </View>

                {/* Milestones */}
                <Text style={styles.subHeading}>Execution Milestones:</Text>
                <View style={styles.milestonesList}>
                  {proj.milestones?.map((m, idx) => (
                    <View key={idx} style={styles.milestoneRow}>
                      <CheckSquare size={13} color="#34d399" />
                      <Text style={styles.milestoneText}>{m}</Text>
                    </View>
                  ))}
                </View>

                {/* Portfolio Guidance Dropdown */}
                {proj.portfolioGuidance && (
                  <View style={styles.guidanceContainer}>
                    <TouchableOpacity
                      style={styles.guidanceToggleBtn}
                      activeOpacity={0.7}
                      onPress={() => toggleGuidance(proj.id)}
                    >
                      <Text style={styles.guidanceToggleText}>Recruiter & Portfolio Showcase Guide</Text>
                      {isExpanded ? <ChevronUp size={14} color="#c084fc" /> : <ChevronDown size={14} color="#c084fc" />}
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.guidanceContent}>
                        <View style={styles.guideItem}>
                          <View style={styles.guideHeader}>
                            
                            <Text style={styles.guideTitle}>GitHub README Spec</Text>
                          </View>
                          <Text style={styles.guideDesc}>{proj.portfolioGuidance.githubReadme}</Text>
                        </View>

                        <View style={styles.guideItem}>
                          <View style={styles.guideHeader}>
                            
                            <Text style={styles.guideTitle}>LinkedIn Launch Strategy</Text>
                          </View>
                          <Text style={styles.guideDesc}>{proj.portfolioGuidance.linkedinPost}</Text>
                        </View>

                        <View style={styles.guideItem}>
                          <View style={styles.guideHeader}>
                            <FileText size={13} color="#34d399" />
                            <Text style={styles.guideTitle}>Measurable Resume Bullet</Text>
                          </View>
                          <Text style={styles.guideDesc}>{proj.portfolioGuidance.resumeBullet}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <PantherDialoguePopup
        visible={showPantherPopup}
        mode="coach"
        tagline="BUILD FOR PROOF"
        message={`Arjav, resume claims don't get callbacks. Complete the intermediate project above to close your gaps in: ${skillGaps.slice(0, 2).join(', ') || 'production architecture'}.`}
        onDismiss={() => setShowPantherPopup(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 60 },
  bannerCard: {
    backgroundColor: '#120d1f',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTag: { color: '#38bdf8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  bannerHeading: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 4 },
  bannerSub: { color: '#94a3b8', fontSize: 11, marginTop: 4, lineHeight: 16 },
  spotlightCard: {
    backgroundColor: 'rgba(18, 13, 31, 0.85)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#34d399',
    gap: 10,
  },
  spotlightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  spotlightBadgeText: { color: '#34d399', fontSize: 10, fontWeight: '800' },
  levelBadge: { color: '#c084fc', fontSize: 10, fontWeight: '800' },
  spotlightTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  spotlightProblem: { color: '#cbd5e1', fontSize: 12, lineHeight: 18 },
  whyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    padding: 10,
    borderRadius: 8,
  },
  whyText: { color: '#34d399', fontSize: 11, fontWeight: '600', flex: 1 },
  skillsTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillPillText: { color: '#cbd5e1', fontSize: 11 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 8 },
  centerLoading: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { color: '#94a3b8', fontSize: 12 },
  projectCard: {
    backgroundColor: '#0c0817',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelTag: { backgroundColor: 'rgba(192, 132, 252, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  levelTagText: { color: '#c084fc', fontSize: 9, fontWeight: '800' },
  timeTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { color: '#94a3b8', fontSize: 11 },
  projTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  projStatement: { color: '#cbd5e1', fontSize: 12, lineHeight: 17 },
  whyBoxRegular: { backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 8, borderRadius: 6 },
  whyTextRegular: { color: '#94a3b8', fontSize: 11, fontStyle: 'italic' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillTag: { backgroundColor: 'rgba(255, 255, 255, 0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  skillTagText: { color: '#38bdf8', fontSize: 10, fontWeight: '700' },
  subHeading: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginTop: 4 },
  milestonesList: { gap: 6 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneText: { color: '#94a3b8', fontSize: 11 },
  guidanceContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  guidanceToggleBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  guidanceToggleText: { color: '#c084fc', fontSize: 11, fontWeight: '700' },
  guidanceContent: { gap: 8, marginTop: 6 },
  guideItem: { backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 8, borderRadius: 8, gap: 3 },
  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  guideTitle: { color: '#fff', fontSize: 11, fontWeight: '700' },
  guideDesc: { color: '#94a3b8', fontSize: 11, lineHeight: 15 },
});

export default ProjectsScreen;