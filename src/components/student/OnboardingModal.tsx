import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, ArrowRight, CheckCircle2, Search } from 'lucide-react-native';
export interface CareerSkill {
  id: string;
  name: string;
  currentLevel: number;
  targetLevel: number;
  category?: string;
  proficiency?: number;
  status?: string;
}
import { FutureXPanther } from '../panther/FutureXPanther';

// Pre-indexed benchmark careers for instant auto-complete suggestions
const BENCHMARK_CAREERS = [
  'Full-Stack Web Developer',
  'Backend Systems Engineer',
  'Frontend Engineer',
  'Mobile App Engineer (React Native)',
  'AI / Machine Learning Engineer',
  'Data Scientist',
  'Data Analyst / BI Developer',
  'DevOps & Cloud Infrastructure Engineer',
  'Cybersecurity Analyst & Ethical Hacker',
  'Generative AI & Prompt Engineer',
  'Site Reliability Engineer (SRE)',
  'Embedded Systems & IoT Developer',
  'Blockchain & Smart Contract Developer',
  'Game Developer (Unity 3D)',
  'UI/UX Product Designer',
  'Technical Product Manager (TPM)',
  'Mechanical Design Engineer (CAD)',
  'Electrical Vehicle (EV) Systems Engineer',
  'VLSI & Chip Design Engineer',
  'Renewable Energy (Solar & Wind) Engineer',
  'Circular Economy & Waste Management Engineer',
  'Corporate M&A Legal Associate',
  'Cyber Law & Data Privacy Compliance Counsel',
  'Financial Risk & Fraud Analyst',
  'Quantitative Investment Analyst (Quant)',
  'Clinical Research Associate (CRA)',
  'Biomedical Equipment Engineer',
  'Sustainable Green Building Consultant'
];

interface OnboardingModalProps {
  studentName: string;
  onComplete: (aim: string, skills: CareerSkill[], progress: number) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  studentName,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAim, setSelectedAim] = useState('');
  const [skills, setSkills] = useState<CareerSkill[]>([]);
  const [loadingText, setLoadingText] = useState('');

  // Live Auto-Complete filter
  const filteredSuggestions = useMemo(() => {
    if (!selectedAim.trim() || selectedAim.length < 2) return [];
    return BENCHMARK_CAREERS.filter((role) =>
      role.toLowerCase().includes(selectedAim.toLowerCase())
    ).slice(0, 5);
  }, [selectedAim]);

  const sampleAims = [
    'AI / Machine Learning Engineer',
    'Full-Stack Web Developer',
    'UI/UX Product Designer',
    'Data Analyst / BI Developer',
    'Cybersecurity Analyst & Ethical Hacker',
  ];

  const handleAimProceed = (aim: string) => {
    if (!aim.trim()) return;
    const generated: CareerSkill[] = [
      { id: 'sk-1', name: `${aim} Core Principles`, currentLevel: 1, targetLevel: 5 },
      { id: 'sk-2', name: 'Standard Industry Toolchain', currentLevel: 1, targetLevel: 5 },
      { id: 'sk-3', name: 'Operational Execution', currentLevel: 0, targetLevel: 4 },
      { id: 'sk-4', name: 'System Architecture & Design', currentLevel: 0, targetLevel: 4 },
    ];
    setSkills(generated);
    setSelectedAim(aim);
    setStep(2);
  };

  const updateProficiency = (skillId: string, level: number) => {
    setSkills((prev) =>
      prev.map((item) =>
        item.id === skillId
          ? { ...item, currentLevel: item.currentLevel === level ? 0 : level }
          : item
      )
    );
  };

  const handleBuildMyPath = () => {
    setStep(3);
    const messages = [
      'The Panther is querying deterministic career taxonomy...',
      'Calculating verified skill gaps against industry benchmarks...',
      'Sequencing your personalized milestone roadmap...',
      'Configuring dynamic Today’s Next Move...',
    ];

    let i = 0;
    setLoadingText(messages[0]);
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) {
        setLoadingText(messages[i]);
      } else {
        clearInterval(interval);
        const progress = Math.round(
          (skills.reduce((acc, curr) => acc + (curr.currentLevel || 0), 0) / (skills.length * 5)) * 100
        );
        onComplete(selectedAim, skills, progress);
      }
    }, 800);
  };

  return (
    <View style={styles.container}>
      {step === 1 && (
        <View style={styles.stepContent}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.sparkleBadge}>
                <Sparkles size={14} color="#c084fc" />
                <Text style={styles.badgeText}>HYBRID CAREER ENGINE</Text>
              </View>
              <Text style={styles.heading}>What's your aim, {studentName}?</Text>
              <Text style={styles.subHeading}>
                Pick from our verified 100-role taxonomy or type any custom specialty.
              </Text>
            </View>
            <View style={styles.pantherHolder}>
              <FutureXPanther mode="guide" height={105} />
            </View>
          </View>

          <View style={styles.searchBox}>
            <Search size={18} color="#94a3b8" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search (e.g. AI, Full-Stack, Legal, CAD...)"
              placeholderTextColor="#64748b"
              value={selectedAim}
              onChangeText={setSelectedAim}
            />
          </View>

          {/* Auto-Complete Dropdown */}
          {filteredSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {filteredSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionItem}
                  onPress={() => setSelectedAim(suggestion)}
                >
                  <Sparkles size={13} color="#a855f7" />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.quickLabel}>Popular High-Demand Tracks:</Text>
          <View style={styles.chipsRow}>
            {sampleAims.map((aim) => (
              <TouchableOpacity
                key={aim}
                style={[styles.chip, selectedAim === aim && styles.chipActive]}
                onPress={() => setSelectedAim(aim)}
              >
                <Text style={[styles.chipText, selectedAim === aim && styles.chipTextActive]}>
                  {aim}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            disabled={!selectedAim.trim()}
            style={[styles.primaryBtn, !selectedAim.trim() && { opacity: 0.5 }]}
            onPress={() => handleAimProceed(selectedAim)}
          >
            <Text style={styles.primaryBtnText}>Load Trajectory & Skills</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContent}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.heading}>What do you already know?</Text>
              <Text style={styles.subHeading}>
                Target: <Text style={{ color: '#c084fc', fontWeight: '700' }}>{selectedAim}</Text>. Select your claimed proficiency (1-5).
              </Text>
            </View>
            <View style={styles.pantherHolder}>
              <FutureXPanther mode="coach" height={95} />
            </View>
          </View>

          <ScrollView style={styles.skillsList} showsVerticalScrollIndicator={false}>
            {skills.map((skill) => (
              <View key={skill.id} style={styles.skillCard}>
                <View style={styles.skillHeader}>
                  <Text style={styles.skillTitle}>{skill.name}</Text>
                  <Text style={styles.targetBadge}>Target: {skill.targetLevel}/5</Text>
                </View>

                <View style={styles.levelsRow}>
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.lvlButton,
                        skill.currentLevel >= lvl && styles.lvlActive,
                      ]}
                      onPress={() => updateProficiency(skill.id, lvl)}
                    >
                      <Text
                        style={[
                          styles.lvlText,
                          skill.currentLevel >= lvl && styles.lvlTextActive,
                        ]}
                      >
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleBuildMyPath}>
            <Text style={styles.primaryBtnText}>Submit & Build My Path</Text>
            <CheckCircle2 size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <View style={styles.loadingContainer}>
          <View style={styles.pantherScanBox}>
            <FutureXPanther mode="scout" height={150} scanning={true} />
          </View>
          <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 14 }} />
          <Text style={styles.loadingStatusText}>{loadingText}</Text>
          <Text style={styles.loadingSub}>Synthesizing verified roadmap...</Text>
          <Text style={styles.pantherPhilosophy}>
            “The Panther doesn't teach you your future. It helps you find it.”
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0614',
    padding: 22,
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pantherHolder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161026',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 14,
  },
  suggestionsContainer: {
    backgroundColor: '#1a1330',
    borderRadius: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  suggestionText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  quickLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    backgroundColor: '#171129',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#8b5cf6',
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  skillsList: {
    maxHeight: '62%',
    marginBottom: 14,
  },
  skillCard: {
    backgroundColor: '#151024',
    padding: 13,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  targetBadge: {
    color: '#ec4899',
    fontSize: 11,
    fontWeight: '700',
  },
  levelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  lvlButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  lvlActive: {
    backgroundColor: '#a855f7',
  },
  lvlText: {
    color: '#64748b',
    fontWeight: '700',
  },
  lvlTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pantherScanBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  loadingStatusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  pantherPhilosophy: {
    color: '#c084fc',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 18,
    textAlign: 'center',
    opacity: 0.85,
    letterSpacing: 0.2,
  },
});

export default OnboardingModal;