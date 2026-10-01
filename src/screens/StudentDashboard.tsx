import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GraduationCap,
  Code2,
  Rocket,
  TrendingUp,
  Shield,
  Bot,
  CheckSquare,
  Bell,
  Sparkles,
  ArrowRight,
  Clock,
  Pencil,
  Award,
  X,
  Check,
  Star,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';

import { BottomNav } from '../components/common/BottomNav';
import { StudentProfile } from '../types/student';
import {
  getRoleDefinition,
  generateDomainSkills,
  generateRoleRoadmap,
  fetchSynthesizedCareer,
  inspectCareerSkills,
  generateTailoredRoadmap,
  discoverLiveOpportunities,
} from '../services/careerEngine';
import { calculateOpportunityMatches } from '../services/opportunityMatcher';
import { TOP_100_CAREERS } from '../constants/careerTaxonomy';

// Dedicated Module Screens
import { RoadmapScreen } from './student/RoadmapScreen';
import { ProjectsScreen } from './student/ProjectsScreen';
import { OpportunitiesScreen } from './student/OpportunitiesScreen';
import { ProgressScreen } from './student/ProgressScreen';
import { ProofPassScreen } from './student/ProofPassScreen';
import { AIMentorScreen } from './student/AIMentorScreen';
import { SkillCheckScreen } from './student/SkillCheckScreen';
import { FutureAlertsScreen } from './student/FutureAlertsScreen';

// Clash of Clans Animated Corner Companion
import { PantherDialoguePopup } from '../components/panther/PantherDialoguePopup';

const PROFILE_STORAGE_KEY = '@futurex_student_profile_v2';

interface DiscoveredSkill {
  id: string;
  name: string;
  category: string;
  description?: string;
  rating: number; // 1 to 5
}

export const StudentDashboard: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'home' | 'proof'>('home');
  const [currentModuleScreen, setCurrentModuleScreen] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Initializing default profile dynamically using Career Engine
  const defaultRole = getRoleDefinition('backend-engineer');
  const initialSkills = generateDomainSkills(defaultRole.id);
  const initialRoadmap = generateRoleRoadmap(defaultRole.id);

  const [pantherPopup, setPantherPopup] = useState<{
    visible: boolean;
    message: string;
    mode: 'scout' | 'guide' | 'coach' | 'guardian';
  }>({
    visible: true,
    message: "Arjav, your trajectory is active. Ready to conquer today's next move?",
    mode: 'scout',
  });

  const [profile, setProfile] = useState<StudentProfile>({
    id: 'usr-001',
    name: 'Arjav',
    targetRole: {
      roleId: defaultRole.id,
      roleTitle: defaultRole.title,
      profession: defaultRole.profession,
      domainId: defaultRole.domainId as any,
      seniority: defaultRole.seniority as any,
      requiredSkills: defaultRole.coreCompetencies,
      keyTools: defaultRole.toolsAndFrameworks,
      marketDemand: 'Very High' as any,
    },
    readinessPercentage: 42,
    skills: initialSkills,
    roadmap: initialRoadmap,
    proofPass: [],
    opportunities: [],
    weeklyCommitmentHours: 15,
  });

  const [quickAimModal, setQuickAimModal] = useState(false);
  const [tempAim, setTempAim] = useState(defaultRole.title);

  // Live Auto-Complete filter based on input
  const matchedRoleSuggestions = useMemo(() => {
    if (!tempAim || !tempAim.trim() || tempAim.trim().length < 2) return [];
    return (TOP_100_CAREERS || []).filter((career) =>
      career.toLowerCase().includes(tempAim.toLowerCase())
    ).slice(0, 4);
  }, [tempAim]);

  // 2-Step Assessment State
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [discoveredSkills, setDiscoveredSkills] = useState<DiscoveredSkill[]>([]);
  const [isInspectingSkills, setIsInspectingSkills] = useState(false);
  const [selectedTargetRole, setSelectedTargetRole] = useState('');

  useEffect(() => {
    loadSavedProfile();
  }, []);

  const loadSavedProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch {
      // Fallback to active state
    }
  };

  // 1. Aim change hote hi direct AI ko trigger karo
  const handleInitiateAimChange = async (targetRoleQuery: string) => {
    if (!targetRoleQuery || targetRoleQuery.trim() === '') return;

    setQuickAimModal(false);
    setSelectedTargetRole(targetRoleQuery);
    setIsInspectingSkills(true);

    setPantherPopup({
      visible: true,
      mode: 'scout',
      message: `AI Engine analyzing A-to-Z competencies for "${targetRoleQuery}"...`,
    });

    try {
      const skills = await inspectCareerSkills(targetRoleQuery);

      if (Array.isArray(skills) && skills.length > 0) {
        const mappedSkills: DiscoveredSkill[] = skills.map((s: any, idx: number) => ({
          id: s.id || `sk-${idx + 1}`,
          name: s.name,
          category: s.category || 'Core Knowledge',
          description: s.description || '',
          rating: 3,
        }));

        setDiscoveredSkills(mappedSkills);
        setIsInspectingSkills(false);
        setRatingModalVisible(true);
        return;
      }
    } catch (err) {
      console.warn('Inspect skills error:', err);
    }

    setIsInspectingSkills(false);
    handleDirectSynthesis(targetRoleQuery);
  };

  const handleUpdateRating = (skillId: string, ratingValue: number) => {
    setDiscoveredSkills((prev) =>
      prev.map((item) => (item.id === skillId ? { ...item, rating: ratingValue } : item))
    );
  };

  // 2. User submits ratings -> Roadmap + Radar generated
  const handleSubmitSkillRatings = async () => {
    setRatingModalVisible(false);
    setIsSynthesizing(true);

    setPantherPopup({
      visible: true,
      mode: 'scout',
      message: `Synthesizing custom trajectory & scanning live 2026 radar for "${selectedTargetRole}"!`,
    });

    const totalScore = discoveredSkills.reduce((sum, s) => sum + s.rating, 0);
    const maxScore = discoveredSkills.length * 5;
    const computedReadiness = Math.round((totalScore / maxScore) * 100);

    const formattedSkills = discoveredSkills.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      proficiency: s.rating * 20,
      targetBenchmark: 85,
      status: s.rating >= 4 ? 'Verified' : s.rating >= 2 ? 'In Progress' : 'Self Reported',
      isGap: s.rating < 3,
      verifiedBy: s.rating >= 4 ? 'Diagnostic Benchmark' : undefined,
    }));

    try {
      const data = await generateTailoredRoadmap(selectedTargetRole, discoveredSkills);

      const updatedProfile: StudentProfile = {
        ...profile,
        targetRole: {
          roleId: selectedTargetRole.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          roleTitle: selectedTargetRole,
          profession: data.profession || 'Professional Field',
          domainId: profile.targetRole.domainId,
          seniority: data.seniority || 'Junior to Benchmark Level',
          requiredSkills: discoveredSkills.map((d) => d.name),
          keyTools: discoveredSkills.filter((d) => d.category.toLowerCase().includes('tool')).map((d) => d.name),
          marketDemand: (data.marketDemand as any) || 'High',
        },
        skills: formattedSkills as any,
        roadmap: (data.roadmap || []).map((m: any, idx: number) => ({
          id: `milestone-${idx + 1}`,
          stepNumber: m.stepNumber || idx + 1,
          title: m.title,
          subtitle: m.subtitle,
          category: m.category || 'Execution',
          duration: m.duration || '3-4 Weeks',
          prerequisites: idx === 0 ? ['Baseline Skills'] : ['Previous Milestone Artifact'],
          deliverable: m.deliverable || 'Verified Portfolio Deliverable',
          status: idx === 0 ? 'current' : 'upcoming',
          assessmentUnlocked: idx === 0,
        })),
        readinessPercentage: computedReadiness,
        proofPassHash: `FX-PASS-2026-${(profile.name || 'ARJ').slice(0, 3).toUpperCase()}-${computedReadiness}`,
      };

      setProfile(updatedProfile);
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      setIsSynthesizing(false);

      discoverLiveOpportunities(selectedTargetRole, discoveredSkills).then(async (result: any) => {
        const liveOpps = result?.opportunities || (Array.isArray(result) ? result : []);
        const liveAlerts = result?.futureAlerts || [];

        if (liveOpps.length > 0 || liveAlerts.length > 0) {
          const profileWithRadar = {
            ...updatedProfile,
            opportunities: liveOpps,
            futureAlerts: liveAlerts,
          };
          setProfile(profileWithRadar as any);
          await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileWithRadar));

          setPantherPopup({
            visible: true,
            mode: 'guardian',
            message: `Radar synced: ${liveOpps.length} live opportunities & ${liveAlerts.length} future alerts found for ${selectedTargetRole}!`,
          });
        }
      });
    } catch (error) {
      console.warn('Roadmap synthesis error:', error);
      setIsSynthesizing(false);
      handleDirectSynthesis(selectedTargetRole, computedReadiness, formattedSkills);
    }
  };

  const handleDirectSynthesis = async (
    roleTitle: string,
    presetReadiness?: number,
    presetSkills?: any[]
  ) => {
    setIsSynthesizing(true);
    try {
      const dynamicRole = await fetchSynthesizedCareer(roleTitle);
      if (dynamicRole) {
        const updatedProfile: StudentProfile = {
          ...profile,
          targetRole: {
            roleId: dynamicRole.roleId || 'custom-role',
            roleTitle: dynamicRole.roleTitle,
            profession: dynamicRole.profession,
            domainId: (dynamicRole.domainId as any) || 'tech',
            seniority: (dynamicRole.seniority as any) || 'Junior to Mid-Level',
            requiredSkills: dynamicRole.coreCompetencies || [],
            keyTools: dynamicRole.toolsAndFrameworks || [],
            marketDemand: (dynamicRole.marketDemand as any) || 'Very High',
          },
          skills: (presetSkills || dynamicRole.skills) as any,
          roadmap: dynamicRole.roadmap as any,
          readinessPercentage: presetReadiness || 35,
          proofPassHash: `FX-PASS-2026-${(profile.name || 'ARJ').slice(0, 3).toUpperCase()}-${presetReadiness || 35}`,
        };

        setProfile(updatedProfile);
        await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
        setIsSynthesizing(false);

        discoverLiveOpportunities(roleTitle, presetSkills || dynamicRole.skills).then(async (result: any) => {
          const liveOpps = result?.opportunities || (Array.isArray(result) ? result : []);
          const liveAlerts = result?.futureAlerts || [];

          if (liveOpps.length > 0 || liveAlerts.length > 0) {
            const updated = {
              ...updatedProfile,
              opportunities: liveOpps,
              futureAlerts: liveAlerts,
            };
            setProfile(updated);
            await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));

            setPantherPopup({
              visible: true,
              mode: 'guardian',
              message: `Radar detected ${liveOpps.length} live opportunities & alerts for ${roleTitle}! Check Future Alerts.`,
            });
          }
        });

        return;
      }
    } catch (err) {
      console.warn('Fallback error:', err);
    }

    const roleDef = getRoleDefinition(roleTitle);
    const updatedProfile: StudentProfile = {
      ...profile,
      targetRole: {
        roleId: roleDef.id,
        roleTitle: roleTitle,
        profession: roleDef.profession,
        domainId: roleDef.domainId as any,
        seniority: roleDef.seniority as any,
        requiredSkills: roleDef.coreCompetencies,
        keyTools: roleDef.toolsAndFrameworks,
        marketDemand: 'Very High' as any,
      },
      skills: (presetSkills || generateDomainSkills(roleDef.id)) as any,
      roadmap: generateRoleRoadmap(roleDef.id),
      readinessPercentage: presetReadiness || 35,
      proofPassHash: `FX-PASS-2026-${(profile.name || 'ARJ').slice(0, 3).toUpperCase()}-${presetReadiness || 35}`,
    };

    setProfile(updatedProfile);
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
    setIsSynthesizing(false);
  };

  // Module Router Switch
  if (currentModuleScreen === 'Roadmap') {
    return (
      <RoadmapScreen
        profile={profile}
        onBack={() => setCurrentModuleScreen(null)}
        onNavigateToSkillCheck={() => setCurrentModuleScreen('Skill Check')}
      />
    );
  }
  if (currentModuleScreen === 'Projects') {
    return <ProjectsScreen profile={profile} onBack={() => setCurrentModuleScreen(null)} />;
  }
  if (currentModuleScreen === 'Opportunities') {
    return <OpportunitiesScreen profile={profile} onBack={() => setCurrentModuleScreen(null)} />;
  }
  if (currentModuleScreen === 'Progress') {
    return <ProgressScreen profile={profile} onBack={() => setCurrentModuleScreen(null)} />;
  }
  if (currentModuleScreen === 'Proof Pass') {
    return <ProofPassScreen profile={profile} onBack={() => setCurrentModuleScreen(null)} />;
  }
  if (currentModuleScreen === 'AI Mentor') {
    return <AIMentorScreen profile={profile} onBack={() => setCurrentModuleScreen(null)} />;
  }
  if (currentModuleScreen === 'Skill Check') {
    return (
      <SkillCheckScreen
        profile={profile}
        onBack={() => setCurrentModuleScreen(null)}
        onProfileUpdate={async (updatedProfile) => {
          setProfile(updatedProfile);
          await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
          setPantherPopup({
            visible: true,
            mode: 'coach',
            message: `Milestone Achieved! Phase 1 Mastered (>=90%) and Next Phase Unlocked on your Roadmap!`,
          });
        }}
      />
    );
  }
  if (currentModuleScreen === 'Future Alerts') {
    return (
      <FutureAlertsScreen
        profile={profile}
        onBack={() => setCurrentModuleScreen(null)}
        onNavigateToOpportunities={() => setCurrentModuleScreen('Opportunities')}
        onNavigateToRoadmap={() => setCurrentModuleScreen('Roadmap')}
      />
    );
  }

  const matchedOpportunities = calculateOpportunityMatches(profile);
  const topOpportunity = (profile.opportunities && profile.opportunities[0]) || matchedOpportunities[0] || null;

  const activeGap = profile.skills.find((s) => s.isGap);
  const nextMove = {
    title: activeGap ? `Master: ${activeGap.name}` : `Milestone: ${profile.roadmap[0]?.title || 'Role Synthesis'}`,
    duration: '45 min',
    reason: activeGap
      ? `Highest priority skill gap identified for ${profile.targetRole.roleTitle}`
      : `Advance current phase deliverable on your official roadmap`,
    targetModule: activeGap ? 'Skill Check' : 'Roadmap',
  };

  const verifiedSkillsCount = profile.skills.filter(
    (s) => s.status === 'Verified' || s.status === 'Proof-Verified' || s.status === 'Assessed'
  ).length;

  const proofHash =
    profile.proofPassHash ||
    `FX-PASS-2026-${(profile.name || 'ARJ').slice(0, 3).toUpperCase()}-${profile.readinessPercentage || 42}`;

  const modules = [
    { id: '1', title: 'Roadmap', sub: 'What to learn', icon: GraduationCap, color: '#38bdf8' },
    { id: '2', title: 'Projects', sub: 'What to build', icon: Code2, color: '#60a5fa' },
    { id: '3', title: 'Opportunities', sub: 'Find & apply', icon: Rocket, color: '#f43f5e' },
    { id: '4', title: 'Progress', sub: 'Track monthly', icon: TrendingUp, color: '#ec4899' },
    { id: '5', title: 'Proof Pass', sub: 'Your achievements', icon: Shield, color: '#c084fc' },
    { id: '6', title: 'AI Mentor', sub: 'Your guide', icon: Bot, color: '#818cf8' },
    { id: '7', title: 'Skill Check', sub: 'Know your level', icon: CheckSquare, color: '#34d399' },
    { id: '8', title: 'Future Alerts', sub: 'Never miss out', icon: Bell, color: '#fb923c' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Ambient Orbs */}
      <View style={styles.ambientTopLeft} />
      <View style={styles.ambientBottomRight} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top > 0 ? 8 : 16 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.row}>
              <Text style={styles.greeting}>Good Morning, {profile.name}</Text>
              <Text style={styles.greetingHand}> 👋</Text>
            </View>
            <Text style={styles.subtitle}>
              Global Career Intelligence & Trajectory Platform.
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.badgePro}>
              <Text style={styles.badgeProText}>FutureX Pro</Text>
            </View>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => setCurrentModuleScreen('Future Alerts')}
            >
              <Bell size={18} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroGrid}>
          {/* 1. Target Role Aim Card (Readiness Score removed as requested) */}
          <View style={styles.cardWrapper}>
            <BlurView intensity={25} tint="dark" style={styles.glassInner}>
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.15)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.aimContent}>
                <View style={styles.targetIconRing}>
                  <Rocket size={24} color="#c084fc" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.cardLabel}>Target Role</Text>
                  <Text style={styles.cardValueTitle}>{profile.targetRole.roleTitle}</Text>
                  <TouchableOpacity
                    style={styles.changeAimBtn}
                    disabled={isSynthesizing || isInspectingSkills}
                    onPress={() => {
                      setTempAim(profile.targetRole.roleTitle);
                      setQuickAimModal(true);
                    }}
                  >
                    {isSynthesizing || isInspectingSkills ? (
                      <ActivityIndicator size="small" color="#c084fc" />
                    ) : (
                      <>
                        <Pencil size={12} color="#cbd5e1" />
                        <Text style={styles.changeAimText}>Change Target Aim</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>

          {/* 2. DYNAMIC SKILL GAP BENCHMARK & PROJECT BRIDGE (Shifted right below Target Aim) */}
          <View style={[styles.cardWrapper, { marginTop: 14 }]}>
            <BlurView intensity={25} tint="dark" style={styles.glassInner}>
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <TrendingUp size={16} color="#f43f5e" />
                  <Text style={[styles.cardLabel, { marginLeft: 8, color: '#f43f5e', fontWeight: '800' }]}>
                    Skill Gap Radar & Benchmark
                  </Text>
                </View>
                <View style={styles.benchmarkPill}>
                  <Text style={styles.benchmarkPillText}>Target: 100% Mastery</Text>
                </View>
              </View>

              <Text style={styles.asmSectionSubtitle}>
                Live delta between industry target benchmark and your current telemetry.
              </Text>

              {/* Benchmark vs Current Comparison Bars */}
              <View style={styles.gapComparativeCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.gapLabel}>Current Role Readiness</Text>
                  <Text style={styles.gapValCurrent}>{profile.readinessPercentage}%</Text>
                </View>
                <View style={styles.gapTrack}>
                  <View style={[styles.gapFillCurrent, { width: `${profile.readinessPercentage}%` }]} />
                </View>

                <View style={[styles.rowBetween, { marginTop: 8 }]}>
                  <Text style={styles.gapLabel}>Industry Target Benchmark (O*NET 2026)</Text>
                  <Text style={styles.gapValTarget}>100%</Text>
                </View>
                <View style={styles.gapTrack}>
                  <View style={[styles.gapFillTarget, { width: '100%' }]} />
                </View>
              </View>

              {/* Identified Critical Skill Gaps with Direct Project CTA */}
              <Text style={styles.criticalGapsHeading}>Identified Critical Gaps to Close:</Text>

              {profile.skills.filter((s) => s.isGap || s.proficiency < 60).slice(0, 2).map((gapSkill, idx) => (
                <View key={gapSkill.id || idx} style={styles.gapActionRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.gapSkillTitle}>{gapSkill.name}</Text>
                    <Text style={styles.gapSkillDelta}>
                      Current: {gapSkill.proficiency || 30}% • Deficit: {100 - (gapSkill.proficiency || 30)}%
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.solveProjectBtn}
                    activeOpacity={0.8}
                    onPress={() => setCurrentModuleScreen('Projects')}
                  >
                    <Code2 size={12} color="#fff" />
                    <Text style={styles.solveProjectBtnText}>Solve Mini-Project</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {profile.skills.filter((s) => s.isGap || s.proficiency < 60).length === 0 && (
                <View style={styles.noGapsNotice}>
                  <Check size={14} color="#34d399" />
                  <Text style={styles.noGapsNoticeText}>
                    All core phase skills meet baseline benchmark! Ready for advanced capstone.
                  </Text>
                </View>
              )}
            </BlurView>
          </View>

          {/* 3. DYNAMIC PROOFPASS CREDENTIAL SNAPSHOT CARD */}
          <TouchableOpacity
            style={[styles.cardWrapper, { marginTop: 14 }]}
            activeOpacity={0.88}
            onPress={() => setCurrentModuleScreen('Proof Pass')}
          >
            <BlurView intensity={25} tint="dark" style={styles.glassInner}>
              <LinearGradient
                colors={['rgba(192, 132, 252, 0.16)', 'rgba(56, 189, 248, 0.05)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <ShieldCheck size={16} color="#34d399" />
                  <Text style={[styles.cardLabel, { marginLeft: 6, color: '#34d399', fontWeight: '800' }]}>
                    LIVE PROOFPASS CREDENTIAL
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.hashPillText}>{proofHash}</Text>
                  <ChevronRight size={14} color="#c084fc" style={{ marginLeft: 2 }} />
                </View>
              </View>

              <View style={[styles.rowBetween, { marginTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.proofCardTitle}>Cryptographic Evidence Layer</Text>
                  <Text style={styles.proofCardSub}>
                    {verifiedSkillsCount} of {profile.skills.length} competencies audit-verified
                  </Text>
                </View>
                <View style={styles.proofDialMini}>
                  <Text style={styles.proofDialText}>{profile.readinessPercentage}%</Text>
                  <Text style={styles.proofDialLabel}>AUDITED</Text>
                </View>
              </View>
            </BlurView>
          </TouchableOpacity>

          {/* 4. Today's Next Move Card */}
          <View style={[styles.cardWrapper, { marginTop: 14 }]}>
            <BlurView intensity={25} tint="dark" style={styles.glassInner}>
              <LinearGradient
                colors={['rgba(236, 72, 153, 0.12)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <Sparkles size={16} color="#e879f9" />
                  <Text style={[styles.cardLabel, { marginLeft: 6 }]}>Today's Next Move</Text>
                </View>
                <View style={styles.row}>
                  <Clock size={12} color="#34d399" />
                  <Text style={styles.durationText}>{nextMove.duration}</Text>
                </View>
              </View>

              <Text style={styles.taskTitle}>{nextMove.title}</Text>

              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.85}
                onPress={() => setCurrentModuleScreen(nextMove.targetModule)}
              >
                <LinearGradient
                  colors={['#6366f1', '#a855f7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  <Text style={styles.actionBtnText}>Start Now</Text>
                  <ArrowRight size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.whyText}>Why this matters? {nextMove.reason}</Text>
            </BlurView>
          </View>
        </View>

        {/* 8 Core Modules Grid */}
        <View style={styles.moduleGrid}>
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.moduleCard}
                activeOpacity={0.7}
                onPress={() => setCurrentModuleScreen(m.title)}
              >
                <BlurView intensity={25} tint="dark" style={styles.moduleInner}>
                  <View style={[styles.iconBox, { borderColor: m.color + '40' }]}>
                    <Icon size={20} color={m.color} />
                  </View>
                  <Text style={styles.moduleTitle}>{m.title}</Text>
                  <Text style={styles.moduleSub}>{m.sub}</Text>
                  <View style={styles.circleArrow}>
                    <ArrowRight size={12} color="#94a3b8" />
                  </View>
                </BlurView>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Top Opportunity Card */}
        <View style={[styles.cardWrapper, { marginTop: 16 }]}>
          <BlurView intensity={25} tint="dark" style={styles.glassInner}>
            <View style={styles.row}>
              <Award size={16} color="#fbbf24" />
              <Text style={[styles.cardLabel, { marginLeft: 8 }]}>Top Opportunity for You</Text>
            </View>

            {topOpportunity ? (
              <View style={[styles.rowBetween, { marginTop: 12 }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={styles.row}>
                    <Text style={styles.oppTitle}>{topOpportunity.title}</Text>
                  </View>
                  <Text style={styles.oppOrgSubtitle}>
                    {topOpportunity.organization} • {topOpportunity.location}
                  </Text>
                  <Text style={styles.oppMissing}>
                    {topOpportunity.missingSkills && topOpportunity.missingSkills.length > 0
                      ? `Missing: ${topOpportunity.missingSkills.join(', ')}`
                      : 'All required competencies currently met'}
                  </Text>
                  <View style={[styles.row, { marginTop: 8 }]}>
                    <Clock size={12} color="#94a3b8" />
                    <Text style={styles.estText}>
                      Deadline: {topOpportunity.deadline || 'Active'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.scoreDial}
                  onPress={() => setCurrentModuleScreen('Opportunities')}
                >
                  <Text style={styles.scoreNumber}>{topOpportunity.matchScore}%</Text>
                  <Text style={styles.scoreLabel}>Match Score</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ paddingVertical: 14 }}>
                <Text style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600' }}>
                  No verified opportunities indexed for this exact filter.
                </Text>
              </View>
            )}
          </BlurView>
        </View>
      </ScrollView>

      {/* MODAL 1: Role Search / Selection */}
      <Modal visible={quickAimModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Select Target Profession</Text>
              <TouchableOpacity onPress={() => setQuickAimModal(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Enter ANY occupation or position worldwide (e.g. Cybersecurity Specialist, Pilot, Surgeon):
            </Text>

            <TextInput
              style={styles.input}
              value={tempAim}
              onChangeText={setTempAim}
              placeholder="e.g. Cybersecurity Specialist, Corporate Lawyer"
              placeholderTextColor="#64748b"
            />

            {/* Auto-Complete Suggestions Dropdown */}
            {matchedRoleSuggestions.length > 0 && (
              <View style={styles.suggestionsDropdown}>
                {matchedRoleSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.suggestionRow}
                    onPress={() => {
                      setTempAim(item);
                      handleInitiateAimChange(item);
                    }}
                  >
                    <Sparkles size={13} color="#c084fc" />
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.presetTags}>
              {[
                { label: 'Cybersecurity Analyst', id: 'Cybersecurity Analyst' },
                { label: 'Backend Engineer', id: 'Backend Engineer' },
                { label: 'Commercial Pilot', id: 'Commercial Pilot' },
                { label: 'Cardiac Surgeon', id: 'Cardiac Surgeon' },
              ].map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.tag,
                    tempAim.toLowerCase() === role.label.toLowerCase() && styles.activeTag,
                  ]}
                  onPress={() => {
                    setTempAim(role.label);
                    handleInitiateAimChange(role.id);
                  }}
                >
                  <Text
                    style={[
                      styles.tagText,
                      tempAim.toLowerCase() === role.label.toLowerCase() && { color: '#fff' },
                    ]}
                  >
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => handleInitiateAimChange(tempAim)}
            >
              <Check size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Inspect Competencies</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Interactive 1-to-5 Skill Rating Sheet */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: '85%' }]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.modalTitle}>Rate Your Current Command</Text>
                <Text style={styles.modalSubHead}>Role: {selectedTargetRole}</Text>
              </View>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Rate your proficiency (1 = Novice to 5 = Expert). Your genuine readiness and multi-phase roadmap will be customized directly from this benchmark.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {discoveredSkills.map((sk) => (
                <View key={sk.id} style={styles.ratingRowCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ratingSkillName}>{sk.name}</Text>
                    <Text style={styles.ratingSkillCategory}>{sk.category}</Text>
                  </View>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <TouchableOpacity
                        key={starVal}
                        onPress={() => handleUpdateRating(sk.id, starVal)}
                        style={styles.starTouch}
                      >
                        <Star
                          size={18}
                          color={starVal <= sk.rating ? '#facc15' : '#475569'}
                          fill={starVal <= sk.rating ? '#facc15' : 'transparent'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSubmitSkillRatings}
            >
              <Sparkles size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Synthesize Custom Deep Trajectory</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Corner Glide Dialogue Companion */}
      <PantherDialoguePopup
        visible={pantherPopup.visible}
        message={pantherPopup.message}
        mode={pantherPopup.mode}
        onDismiss={() => setPantherPopup((prev) => ({ ...prev, visible: false }))}
      />

      {/* Persistent Bottom Navigation */}
      <BottomNav
        currentTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'proof') {
            setCurrentModuleScreen('Proof Pass');
          }
        }}
        accentColor="#c084fc"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  ambientTopLeft: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#581c87',
    opacity: 0.25,
    top: -50,
    left: -50,
  },
  ambientBottomRight: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#1e1b4b',
    opacity: 0.35,
    bottom: 50,
    right: -80,
  },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 110 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  greetingHand: { fontSize: 18 },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgePro: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeProText: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGrid: { width: '100%' },
  cardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(18, 12, 33, 0.65)',
  },
  glassInner: { padding: 16 },
  aimContent: { flexDirection: 'row', alignItems: 'center' },
  targetIconRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1.5,
    borderColor: '#c084fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6 },
  cardValueTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginTop: 2 },
  changeAimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  changeAimText: { color: '#cbd5e1', fontSize: 11 },
  durationText: { fontSize: 11, color: '#34d399', marginLeft: 4 },
  taskTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginTop: 8 },
  actionBtn: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  whyText: { fontSize: 11, color: '#94a3b8', marginTop: 8 },
  hashPillText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proofCardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginTop: 2 },
  proofCardSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  proofDialMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofDialText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  proofDialLabel: { color: '#34d399', fontSize: 7, fontWeight: '800' },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: '23.2%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(20, 14, 38, 0.65)',
  },
  moduleInner: { paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center' },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleTitle: { fontSize: 11, fontWeight: '600', color: '#fff', marginTop: 6, textAlign: 'center' },
  moduleSub: { fontSize: 9, color: '#64748b', marginTop: 2, textAlign: 'center' },
  circleArrow: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  benchmarkPill: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  benchmarkPillText: { color: '#f43f5e', fontSize: 9, fontWeight: '800' },
  gapComparativeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  gapLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  gapValCurrent: { color: '#38bdf8', fontSize: 11, fontWeight: '800' },
  gapValTarget: { color: '#34d399', fontSize: 11, fontWeight: '800' },
  gapTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  gapFillCurrent: { height: '100%', backgroundColor: '#38bdf8', borderRadius: 3 },
  gapFillTarget: { height: '100%', backgroundColor: 'rgba(52, 211, 153, 0.8)', borderRadius: 3 },
  criticalGapsHeading: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  gapActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(244, 63, 94, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  gapSkillTitle: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  gapSkillDelta: { color: '#f87171', fontSize: 10, marginTop: 2 },
  solveProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e11d48',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  solveProjectBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  noGapsNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: 10,
    padding: 10,
  },
  noGapsNoticeText: { color: '#34d399', fontSize: 11, fontWeight: '600' },
  asmSectionSubtitle: { color: '#94a3b8', fontSize: 11, marginTop: 4, marginBottom: 12 },
  oppTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  oppOrgSubtitle: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  oppMissing: { fontSize: 11, color: '#f59e0b', marginTop: 4 },
  estText: { fontSize: 10, color: '#94a3b8', marginLeft: 4 },
  scoreDial: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 3,
    borderColor: '#c084fc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
  },
  scoreNumber: { fontSize: 15, fontWeight: '800', color: '#fff' },
  scoreLabel: { fontSize: 8, color: '#94a3b8' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#0f0a1c',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalSubHead: { fontSize: 13, color: '#c084fc', marginTop: 2, fontWeight: '600' },
  modalDesc: { fontSize: 12, color: '#94a3b8', marginTop: 8, marginBottom: 14 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  suggestionsDropdown: {
    backgroundColor: '#18112e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginTop: 6,
    marginBottom: 6,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  presetTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTag: { backgroundColor: '#a855f7', borderColor: '#c084fc' },
  tagText: { fontSize: 12, color: '#94a3b8' },
  ratingRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  ratingSkillName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  ratingSkillCategory: { color: '#64748b', fontSize: 11, marginTop: 2 },
  starsContainer: { flexDirection: 'row', gap: 4 },
  starTouch: { padding: 4 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9333ea',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default StudentDashboard;