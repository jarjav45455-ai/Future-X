import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Send,
  Bot,
  Trash2,
  Sparkles,
  User,
  Target,
  BookOpen,
  Briefcase,
  Lightbulb,
} from 'lucide-react-native';

import { FutureXHeader } from '../../components/common/FutureXHeader';
import { StudentProfile } from '../../types/student';
import { API_BASE_URL } from '../../config/api';

interface AIMentorScreenProps {
  profile: StudentProfile;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'student' | 'mentor';
  text: string;
  timestamp: number;
}

// Verified Physical Device IP
const BACKEND_URL = API_BASE_URL;
const REQUEST_TIMEOUT = 20000;
const MAX_MESSAGE_LENGTH = 1500;

export const AIMentorScreen: React.FC<AIMentorScreenProps> = ({
  profile,
  onBack,
}) => {
  // Using `any` ref to avoid React 19 / RN 0.88 TypeScript ref mismatch on scrollToEnd
  const scrollViewRef = useRef<any>(null);
  const inputRef = useRef<any>(null);

  const historyStorageKey = `@futurex_mentor_history_${profile.id || 'usr-001'}_${profile.targetRole.roleId}`;
  const role = profile.targetRole.roleTitle;
  const profession = profile.targetRole.profession;

  const initialGreeting: ChatMessage = useMemo(
    () => ({
      id: 'm-init',
      sender: 'mentor',
      text:
        `Hi ${profile.name || 'there'}! Welcome to your FutureX AI Mentor.\n\n` +
        `I am here to help you move toward your goal of becoming a ${role}.\n\n` +
        `Your current career readiness is ${profile.readinessPercentage}%.\n\n` +
        `I can help you understand your skill gaps, follow your roadmap, ` +
        `build projects and prepare for relevant opportunities.\n\n` +
        `What would you like to work on today?`,
      timestamp: Date.now(),
    }),
    [profile.name, profile.readinessPercentage, role]
  );

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (scrollViewRef.current && typeof scrollViewRef.current.scrollToEnd === 'function') {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 120);
    return () => clearTimeout(timer);
  }, [messages, loading, scrollToBottom]);

  // Load role-specific conversation history
  useEffect(() => {
    let active = true;

    const loadChatHistory = async () => {
      setHistoryLoaded(false);

      try {
        const saved = await AsyncStorage.getItem(historyStorageKey);
        if (!active) return;

        if (saved) {
          const parsed: unknown = JSON.parse(saved);

          if (
            Array.isArray(parsed) &&
            parsed.every(
              (item) =>
                item &&
                typeof item.id === 'string' &&
                (item.sender === 'student' || item.sender === 'mentor') &&
                typeof item.text === 'string' &&
                typeof item.timestamp === 'number'
            )
          ) {
            setMessages(parsed.length > 0 ? parsed : [initialGreeting]);
          } else {
            setMessages([initialGreeting]);
          }
        } else {
          setMessages([initialGreeting]);
        }
      } catch (error) {
        console.warn('Mentor history loading failed:', error);
        if (active) {
          setMessages([initialGreeting]);
        }
      } finally {
        if (active) {
          setHistoryLoaded(true);
        }
      }
    };

    loadChatHistory();

    return () => {
      active = false;
    };
  }, [historyStorageKey, initialGreeting]);

  const saveChatHistory = async (history: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(historyStorageKey, JSON.stringify(history));
    } catch (error) {
      console.warn('Mentor history saving failed:', error);
    }
  };

  // Student-specific quick prompts
  const quickPrompts = [
    {
      title: 'Analyze my skill gaps',
      subtitle: 'Understand what I need to improve',
      icon: Target,
      prompt: `Analyze my current skill gaps for ${role}. Prioritize the most important improvements.`,
    },
    {
      title: 'Guide my roadmap',
      subtitle: 'Tell me what to learn next',
      icon: BookOpen,
      prompt: `Based on my current roadmap for ${role}, what should I learn next and why?`,
    },
    {
      title: 'Suggest a project',
      subtitle: 'Build practical experience',
      icon: Lightbulb,
      prompt: `Suggest a practical portfolio project for ${role} based on my current skills and gaps.`,
    },
    {
      title: 'Explore opportunities',
      subtitle: 'Check my career readiness',
      icon: Briefcase,
      prompt: `Help me understand what skills and preparation I need before applying for opportunities related to ${role}.`,
    },
  ];

  const getGroundedFallback = (query: string): string => {
    const gaps = (profile.skills || [])
      .filter((skill) => skill.isGap)
      .map((skill) => skill.name)
      .slice(0, 4);

    const currentMilestone = (profile.roadmap || []).find(
      (item) => item.status === 'current'
    )?.title;

    const lower = query.toLowerCase();

    if (
      lower.includes('next') ||
      lower.includes('roadmap') ||
      lower.includes('learn')
    ) {
      return (
        `Based on your saved FutureX profile, your current roadmap milestone is ` +
        `"${currentMilestone || 'your current learning phase'}".\n\n` +
        `Skills to review: ${gaps.length ? gaps.join(', ') : 'No recorded skill gaps'}.\n\n` +
        `Start by reviewing the learning objectives of your current milestone. ` +
        `Your full AI guidance will be available when the backend connection is restored.`
      );
    }

    if (lower.includes('project') || lower.includes('build')) {
      return (
        `For your ${role} goal, choose a project that demonstrates the skills ` +
        `you are currently learning.\n\n` +
        `Your recorded skill gaps are: ${gaps.length ? gaps.join(', ') : 'not currently recorded'}.\n\n` +
        `Try selecting a project that lets you practice one or two of these skills. ` +
        `This is offline guidance based on your saved profile, not an AI-generated project evaluation.`
      );
    }

    if (lower.includes('gap') || lower.includes('skill')) {
      return (
        `Your current target is ${role}.\n\n` +
        `Recorded skill gaps: ${gaps.length ? gaps.join(', ') : 'No gaps currently recorded'}.\n\n` +
        `Focus on improving one important skill at a time and validate your learning through practical work.`
      );
    }

    return (
      `I am currently unable to reach the FutureX AI service.\n\n` +
      `I can still use your saved career information to guide you.\n\n` +
      `Your selected goal is ${role}, in ${profession}.\n` +
      `Your recorded readiness is ${profile.readinessPercentage}%.\n\n` +
      `Please try again when the backend connection is available.`
    );
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText ?? inputText).trim();

    if (!textToSend || loading || !historyLoaded) return;

    if (textToSend.length > MAX_MESSAGE_LENGTH) {
      Alert.alert(
        'Message too long',
        `Please keep your message under ${MAX_MESSAGE_LENGTH} characters.`
      );
      return;
    }

    Keyboard.dismiss();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'student',
      text: textToSend,
      timestamp: Date.now(),
    };

    const updatedHistory = [...messages, userMessage];

    setMessages(updatedHistory);
    setInputText('');
    setLoading(true);

    await saveChatHistory(updatedHistory);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${BACKEND_URL}/api/mentor/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          studentProfile: profile,
          history: updatedHistory.slice(-10),
          question: textToSend,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (!data || typeof data.answer !== 'string' || !data.answer.trim()) {
        throw new Error('Invalid mentor response');
      }

      const mentorMessage: ChatMessage = {
        id: `mentor-${Date.now()}`,
        sender: 'mentor',
        text: data.answer.trim(),
        timestamp: Date.now(),
      };

      const finalHistory = [...updatedHistory, mentorMessage];
      setMessages(finalHistory);
      await saveChatHistory(finalHistory);
    } catch (error) {
      console.warn('FutureX Mentor API error:', error);

      const fallbackMessage: ChatMessage = {
        id: `fallback-${Date.now()}`,
        sender: 'mentor',
        text: getGroundedFallback(textToSend),
        timestamp: Date.now(),
      };

      const finalHistory = [...updatedHistory, fallbackMessage];
      setMessages(finalHistory);
      await saveChatHistory(finalHistory);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setTimeout(scrollToBottom, 150);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear conversation?',
      'Your saved AI Mentor conversation for this career will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(historyStorageKey);
              setMessages([initialGreeting]);
            } catch {
              Alert.alert('Unable to clear', 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FutureXHeader
        title="AI Career Mentor"
        subtitle={`Your guide to becoming a ${role}`}
        onBack={onBack}
      />

      {/* Mentor status */}
      <View style={styles.statusBarRow}>
        <View style={styles.statusLeft}>
          <View style={styles.botIconRing}>
            <Bot size={16} color="#c084fc" />
          </View>
          <View>
            <Text style={styles.statusTitle}>FUTUREX AI MENTOR</Text>
            <Text style={styles.statusSub}>Personalized career guidance</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClearHistory}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Trash2 size={14} color="#94a3b8" />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Student context card */}
      <View style={styles.contextCard}>
        <View style={styles.contextIcon}>
          <Target size={17} color="#c084fc" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.contextLabel}>YOUR CURRENT CAREER GOAL</Text>
          <Text style={styles.contextRole}>{role}</Text>
        </View>

        <View style={styles.readinessBadge}>
          <Text style={styles.readinessValue}>
            {profile.readinessPercentage}%
          </Text>
          <Text style={styles.readinessLabel}>Readiness</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!historyLoaded ? (
            <ActivityIndicator
              size="small"
              color="#c084fc"
              style={{ marginTop: 30 }}
            />
          ) : (
            <>
              {messages.length === 1 && (
                <View style={styles.welcomeSection}>
                  <View style={styles.welcomeIcon}>
                    <Sparkles size={25} color="#c084fc" />
                  </View>
                  <Text style={styles.welcomeTitle}>
                    Your future starts here.
                  </Text>
                  <Text style={styles.welcomeDescription}>
                    Ask questions, understand your skill gaps and take your next
                    step with FutureX.
                  </Text>
                </View>
              )}

              {messages.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.bubbleWrap,
                    item.sender === 'student'
                      ? styles.studentBubbleWrap
                      : styles.mentorBubbleWrap,
                  ]}
                >
                  {item.sender === 'mentor' && (
                    <View style={styles.avatarMentor}>
                      <Bot size={15} color="#c084fc" />
                    </View>
                  )}

                  <View
                    style={[
                      styles.bubble,
                      item.sender === 'student'
                        ? styles.studentBubble
                        : styles.mentorBubble,
                    ]}
                  >
                    <Text style={styles.bubbleText}>{item.text}</Text>
                    <Text style={styles.messageTime}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>

                  {item.sender === 'student' && (
                    <View style={styles.avatarStudent}>
                      <User size={14} color="#fff" />
                    </View>
                  )}
                </View>
              ))}

              {loading && (
                <View style={styles.thinkingContainer}>
                  <View style={styles.avatarMentor}>
                    <Bot size={15} color="#c084fc" />
                  </View>
                  <View style={styles.thinkingBubble}>
                    <ActivityIndicator size="small" color="#c084fc" />
                    <Text style={styles.thinkingText}>
                      Understanding your career context...
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Suggested prompts */}
        {historyLoaded && (
          <View style={styles.quickPromptContainer}>
            <View style={styles.sectionHeading}>
              <Sparkles size={13} color="#c084fc" />
              <Text style={styles.sectionHeadingText}>SUGGESTED FOR YOU</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPromptScroll}
            >
              {quickPrompts.map((item, index) => {
                const Icon = item.icon;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickCard}
                    disabled={loading}
                    onPress={() => handleSend(item.prompt)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.quickCardIcon}>
                      <Icon size={16} color="#c084fc" />
                    </View>
                    <Text style={styles.quickChipText}>{item.title}</Text>
                    <Text style={styles.quickSubtitle}>{item.subtitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Message input */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Ask in English, Hindi or Hinglish..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
            editable={!loading && historyLoaded}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || loading || !historyLoaded) &&
                styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading || !historyLoaded}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Send size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          FutureX AI can make mistakes. Verify important career information.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05030a',
  },
  statusBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#090613',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIconRing: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(192,132,252,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  statusSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 3,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  clearBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 12,
    marginBottom: 5,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#110b20',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.17)',
    gap: 10,
  },
  contextIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(192,132,252,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  contextRole: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  readinessBadge: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(192,132,252,0.1)',
    borderRadius: 9,
  },
  readinessValue: {
    color: '#c084fc',
    fontSize: 16,
    fontWeight: '800',
  },
  readinessLabel: {
    color: '#94a3b8',
    fontSize: 9,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 15,
    paddingBottom: 25,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  welcomeIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(192,132,252,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
  },
  welcomeDescription: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 280,
  },
  bubbleWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  studentBubbleWrap: {
    justifyContent: 'flex-end',
  },
  mentorBubbleWrap: {
    justifyContent: 'flex-start',
  },
  avatarMentor: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(192,132,252,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarStudent: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '82%',
    padding: 13,
    borderRadius: 16,
  },
  studentBubble: {
    backgroundColor: '#6d28d9',
    borderBottomRightRadius: 4,
  },
  mentorBubble: {
    backgroundColor: '#120d24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 21,
  },
  messageTime: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    textAlign: 'right',
    marginTop: 7,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#120d24',
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.15)',
  },
  thinkingText: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  quickPromptContainer: {
    paddingVertical: 10,
    backgroundColor: '#080511',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    marginBottom: 9,
  },
  sectionHeadingText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  quickPromptScroll: {
    paddingHorizontal: 15,
    gap: 9,
  },
  quickCard: {
    width: 165,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#130d22',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.19)',
  },
  quickCardIcon: {
    width: 27,
    height: 27,
    borderRadius: 8,
    backgroundColor: 'rgba(192,132,252,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickChipText: {
    color: '#f1eaff',
    fontSize: 11,
    fontWeight: '700',
  },
  quickSubtitle: {
    color: '#94a3b8',
    fontSize: 9,
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0c0817',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 9,
  },
  textInput: {
    flex: 1,
    minHeight: 43,
    maxHeight: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 13,
  },
  sendBtn: {
    backgroundColor: '#8b5cf6',
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  footerText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 9,
    paddingBottom: 5,
  },
});

export default AIMentorScreen;