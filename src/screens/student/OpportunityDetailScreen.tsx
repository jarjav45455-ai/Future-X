import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Briefcase,
  Clock,
  ShieldCheck,
  Sparkles,
  BookOpen,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react-native';

export interface OpportunityItem {
  id: string;
  title: string;
  company: string;
  opportunityType: 'INTERNSHIP' | 'JOB' | 'HACKATHON';
  description: string;
  location: string;
  workMode: string;
  officialUrl: string;
  applicationUrl: string;
  sourceName: string;
  publicationDate?: string | null;
  deadline?: string | null;
  lastVerifiedAt?: string;
  status: string;
  educationRequirement?: string;
  experienceRequirement?: string;
  minRoadmapPhase: number;
  maxRoadmapPhase: number;
  stipendOrPrize?: string;
  isDirectCareerMatch: boolean;
  matchScore: number;
  matchLabel: string;
  isLocked: boolean;
  whyMatched: string;
  mandatorySkills: string[];
  preferredSkills: string[];
  completedSkills: { id: string; name: string; status: string }[];
  missingMandatorySkills: {
    id: string;
    name: string;
    currentLevel: number;
    requiredLevel: number;
    roadmapPhase: number;
  }[];
  missingPreferredSkills: { id: string; name: string }[];
}

interface OpportunityDetailScreenProps {
  opportunity: OpportunityItem;
  currentPhase: number;
  onBack: () => void;
  onNavigateToRoadmap: () => void;
}

export const OpportunityDetailScreen: React.FC<OpportunityDetailScreenProps> = ({
  opportunity,
  currentPhase,
  onBack,
  onNavigateToRoadmap,
}) => {
  const handleApply = async () => {
    const url = opportunity.applicationUrl || opportunity.officialUrl;
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Invalid Link', 'Unable to open the official application URL.');
      }
    } catch {
      Alert.alert('Error', 'Could not open browser for application.');
    }
  };

  const verifiedDate = opportunity.lastVerifiedAt
    ? new Date(opportunity.lastVerifiedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently verified';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={18} color="#e2e8f0" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {opportunity.company}
          </Text>
          <Text style={styles.topBarSub}>
            {opportunity.opportunityType} • Phase {opportunity.minRoadmapPhase}
            {opportunity.maxRoadmapPhase > opportunity.minRoadmapPhase
              ? `–${opportunity.maxRoadmapPhase}`
              : ''}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            opportunity.isLocked ? styles.statusLocked : styles.statusOpen,
          ]}
        >
          {opportunity.isLocked ? (
            <Lock size={12} color="#fda4af" />
          ) : (
            <CheckCircle2 size={12} color="#34d399" />
          )}
          <Text
            style={[
              styles.statusBadgeText,
              { color: opportunity.isLocked ? '#fda4af' : '#34d399' },
            ]}
          >
            {opportunity.isLocked ? 'Locked' : opportunity.status}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={
              opportunity.isLocked
                ? ['rgba(244, 63, 94, 0.16)', 'rgba(17, 11, 32, 0.9)']
                : ['rgba(168, 85, 247, 0.2)', 'rgba(56, 189, 248, 0.06)']
            }
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.matchPill}>{opportunity.matchLabel}</Text>
          <Text style={styles.title}>{opportunity.title}</Text>
          <Text style={styles.company}>{opportunity.company}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <MapPin size={13} color="#94a3b8" />
              <Text style={styles.metaText}>
                {opportunity.location} ({opportunity.workMode})
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Briefcase size={13} color="#94a3b8" />
              <Text style={styles.metaText}>{opportunity.experienceRequirement}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={13} color="#34d399" />
              <Text style={styles.metaText}>
                Verified: {verifiedDate} • Source: {opportunity.sourceName}
              </Text>
            </View>
          </View>
        </View>

        {/* Locked Banner & Missing Skills */}
        {opportunity.isLocked && (
          <View style={styles.lockedCard}>
            <View style={styles.row}>
              <Lock size={16} color="#f43f5e" />
              <Text style={styles.lockedTitle}>Opportunity Locked — Skills Required</Text>
            </View>
            <Text style={styles.lockedDesc}>
              You are currently in Phase {currentPhase}. Complete the missing mandatory skills below to automatically unlock this opportunity.
            </Text>

            {opportunity.missingMandatorySkills.map((sk) => (
              <View key={sk.id} style={styles.missingRow}>
                <AlertTriangle size={14} color="#fb923c" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.missingName}>{sk.name}</Text>
                  <Text style={styles.missingSub}>
                    Current: {sk.currentLevel}/5 • Required: {sk.requiredLevel}/5 (Phase {sk.roadmapPhase})
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Why Matched */}
        <View style={styles.sectionCard}>
          <View style={styles.row}>
            <Sparkles size={15} color="#c084fc" />
            <Text style={styles.sectionTitle}>WHY THIS OPPORTUNITY MATCHES YOU</Text>
          </View>
          <Text style={styles.bodyText}>{opportunity.whyMatched}</Text>
        </View>

        {/* Skills Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>MANDATORY & PREFERRED SKILLS</Text>

          {opportunity.completedSkills.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.subHeading}>Skills You Meet</Text>
              <View style={styles.chipWrap}>
                {opportunity.completedSkills.map((sk) => (
                  <View key={sk.id} style={styles.chipMet}>
                    <CheckCircle2 size={11} color="#34d399" />
                    <Text style={styles.chipMetText}>{sk.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {opportunity.mandatorySkills.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.subHeading}>Mandatory Skills</Text>
              <View style={styles.chipWrap}>
                {opportunity.mandatorySkills.map((name, i) => (
                  <View key={i} style={styles.chipMandatory}>
                    <Text style={styles.chipMandatoryText}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {opportunity.preferredSkills.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.subHeading}>Preferred (Good to Have)</Text>
              <View style={styles.chipWrap}>
                {opportunity.preferredSkills.map((name, i) => (
                  <View key={i} style={styles.chipPreferred}>
                    <Text style={styles.chipPreferredText}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Eligibility & Description */}
        <View style={styles.sectionCard}>
          <View style={styles.row}>
            <BookOpen size={15} color="#38bdf8" />
            <Text style={styles.sectionTitle}>DESCRIPTION & ELIGIBILITY</Text>
          </View>
          <Text style={styles.bodyText}>{opportunity.description}</Text>
          {opportunity.educationRequirement ? (
            <View style={styles.eligRow}>
              <ShieldCheck size={14} color="#34d399" />
              <Text style={styles.eligText}>
                Eligibility: {opportunity.educationRequirement}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky Action Footer */}
      <View style={styles.stickyFooter}>
        {opportunity.isLocked ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={onNavigateToRoadmap}
          >
            <LinearGradient
              colors={['#6366f1', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGrad}
            >
              <GraduationCap size={18} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Learn Missing Skills on Roadmap</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={handleApply}
          >
            <LinearGradient
              colors={['#059669', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGrad}
            >
              <ExternalLink size={17} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Apply on Official Portal</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  row: { flexDirection: 'row', alignItems: 'center' },
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
  topBarTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  topBarSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusOpen: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  statusLocked: {
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderColor: 'rgba(244, 63, 94, 0.45)',
  },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  scrollContent: { padding: 16, paddingBottom: 120 },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
    backgroundColor: '#110b20',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
    marginBottom: 14,
  },
  matchPill: {
    alignSelf: 'flex-start',
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  title: { color: '#ffffff', fontSize: 19, fontWeight: '800' },
  company: { color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginTop: 4 },
  metaGrid: { marginTop: 12, gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { color: '#94a3b8', fontSize: 12, flex: 1 },
  lockedCard: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },
  lockedTitle: { color: '#fda4af', fontSize: 14, fontWeight: '800', marginLeft: 7 },
  lockedDesc: { color: '#cbd5e1', fontSize: 12, marginTop: 6, lineHeight: 17 },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  missingName: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  missingSub: { color: '#fb923c', fontSize: 11, marginTop: 2 },
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
    marginLeft: 6,
  },
  bodyText: { color: '#e2e8f0', fontSize: 13, lineHeight: 20, marginTop: 8 },
  subHeading: { color: '#cbd5e1', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chipMet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipMetText: { color: '#a7f3d0', fontSize: 11, fontWeight: '700' },
  chipMandatory: {
    backgroundColor: 'rgba(192, 132, 252, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipMandatoryText: { color: '#e9d5ff', fontSize: 11, fontWeight: '700' },
  chipPreferred: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipPreferredText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  eligRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  eligText: { color: '#cbd5e1', fontSize: 12, flex: 1 },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 3, 10, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 38,
  },
  primaryBtn: { borderRadius: 14, overflow: 'hidden' },
  primaryGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});

export default OpportunityDetailScreen;