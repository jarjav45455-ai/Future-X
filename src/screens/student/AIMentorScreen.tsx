import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Send, Bot, Trash2, Sparkles, User } from 'lucide-react-native';

import { FutureXHeader } from '../../components/common/FutureXHeader';
import { StudentProfile } from '../../types/student';

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
const BACKEND_URL = 'http://10.90.137.102:5000';

export const AIMentorScreen: React.FC<AIMentorScreenProps> = ({ profile, onBack }) => {
  const historyStorageKey = `@futurex_mentor_history_${profile.id || 'usr-001'}_${profile.targetRole.roleId}`;
  const scrollViewRef = useRef<ScrollView>(null);

  const initialGreeting: ChatMessage = {
    id: 'm-init',
    sender: 'mentor',
    text: `Greetings, ${profile.name}. I am tracking your trajectory toward ${profile.targetRole.roleTitle} in ${profile.targetRole.profession}. Current Readiness: ${profile.readinessPercentage}%. What domain milestone or skill gap shall we evaluate today?`,
    timestamp: Date.now(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic quick action prompts based on target role
  const quickPrompts = [
    `Analyze my skill gaps for ${profile.targetRole.roleTitle}`,
    'What should I learn next on my roadmap?',
    'Suggest a high-impact portfolio deliverable',
    'Am I ready for active opportunities?',
  ];

  useEffect(() => {
    loadChatHistory();
  }, [profile.targetRole.roleId]);

  const loadChatHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(historyStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Fallback to active state
    }
  };

  const saveChatHistory = async (newMessages: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(historyStorageKey, JSON.stringify(newMessages));
    } catch {
      // Non-critical local persistence failure
    }
  };

  const handleClearHistory = async () => {
    try {
      await AsyncStorage.removeItem(historyStorageKey);
      setMessages([initialGreeting]);
    } catch {
      // ignore
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'student',
      text: textToSend,
      timestamp: Date.now(),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText('');
    setLoading(true);

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await fetch(`${BACKEND_URL}/api/mentor/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfile: profile,
          history: updatedHistory.slice(-8), // Send last 8 continuous turns
          question: textToSend,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.answer) {
          const mentorMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'mentor',
            text: data.answer,
            timestamp: Date.now(),
          };
          const finalMessages = [...updatedHistory, mentorMsg];
          setMessages(finalMessages);
          saveChatHistory(finalMessages);
          return;
        }
      }
      throw new Error('Fallback trigger');
    } catch {
      // Contextual offline fallback
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'mentor',
        text: getGroundedFallback(textToSend),
        timestamp: Date.now(),
      };
      const finalMessages = [...updatedHistory, fallbackMsg];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const getGroundedFallback = (query: string): string => {
    const role = profile.targetRole.roleTitle;
    const gaps = profile.skills.filter((s) => s.isGap).map((s) => s.name).slice(0, 3).join(', ');
    const currentMilestone = profile.roadmap.find((m) => m.status === 'current')?.title || 'Phase Foundations';

    const lower = query.toLowerCase();
    if (lower.includes('next') || lower.includes('roadmap') || lower.includes('learn')) {
      return `For ${role}, your current priority milestone is "${currentMilestone}". Focus on closing: ${gaps || 'core domain competencies'}.`;
    }
    if (lower.includes('project') || lower.includes('build')) {
      return `To validate your readiness for ${role}, prioritize building the deliverable for "${currentMilestone}". This yields verified evidence for your Proof Pass.`;
    }
    return `As your FutureX Mentor for ${role}, industry benchmarks indicate prioritizing: ${gaps || 'advanced domain methodology'}. Advance your active roadmap phase to gain practical readiness.`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <FutureXHeader
        title="AI Career Mentor"
        subtitle={`Domain Focus: ${profile.targetRole.roleTitle}`}
        onBack={onBack}
      />

      {/* Mentor Identity Status & Clear Action */}
      <View style={styles.statusBarRow}>
        <View style={styles.statusLeft}>
          <View style={styles.botIconRing}>
            <Bot size={14} color="#c084fc" />
          </View>
          <View>
            <Text style={styles.statusTitle}>FUTUREX INTELLIGENCE ACTIVE</Text>
            <Text style={styles.statusSub}>Context-linked to {profile.targetRole.roleTitle} roadmap</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory} activeOpacity={0.7}>
          <Trash2 size={13} color="#94a3b8" />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((item) => (
            <View
              key={item.id}
              style={[
                styles.bubbleWrap,
                item.sender === 'student' ? styles.studentBubbleWrap : styles.mentorBubbleWrap,
              ]}
            >
              {item.sender === 'mentor' && (
                <View style={styles.avatarMentor}>
                  <Bot size={14} color="#c084fc" />
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  item.sender === 'student' ? styles.studentBubble : styles.mentorBubble,
                ]}
              >
                <Text style={styles.bubbleText}>{item.text}</Text>
              </View>

              {item.sender === 'student' && (
                <View style={styles.avatarStudent}>
                  <User size={13} color="#fff" />
                </View>
              )}
            </View>
          ))}

          {loading && (
            <View style={styles.thinkingContainer}>
              <View style={styles.avatarMentor}>
                <Bot size={14} color="#c084fc" />
              </View>
              <View style={styles.thinkingBubble}>
                <ActivityIndicator size="small" color="#c084fc" />
                <Text style={styles.thinkingText}>Analyzing trajectory context...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Context Prompts */}
        <View style={styles.quickPromptContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptScroll}>
            {quickPrompts.map((prompt, idx) => (
              <TouchableOpacity
                key={`qp-${idx}`}
                style={styles.quickChip}
                disabled={loading}
                onPress={() => handleSend(prompt)}
              >
                <Sparkles size={11} color="#c084fc" />
                <Text style={styles.quickChipText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder={`Ask in English, Hindi ya Hinglish...`}
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  statusBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botIconRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: { color: '#c084fc', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  statusSub: { color: '#94a3b8', fontSize: 11, marginTop: 1 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  clearBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  chatScroll: { flex: 1 },
  chatContent: { padding: 16, gap: 14, paddingBottom: 20 },
  bubbleWrap: { width: '100%', flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  studentBubbleWrap: { justifyContent: 'flex-end' },
  mentorBubbleWrap: { justifyContent: 'flex-start' },
  avatarMentor: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarStudent: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: { maxWidth: '80%', padding: 13, borderRadius: 16 },
  studentBubble: {
    backgroundColor: '#7c3aed',
    borderBottomRightRadius: 4,
  },
  mentorBubble: {
    backgroundColor: '#120d24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: '#FFFFFF', fontSize: 13.5, lineHeight: 20 },
  thinkingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(18, 13, 36, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  thinkingText: { color: '#94a3b8', fontSize: 11, fontStyle: 'italic' },
  quickPromptContainer: {
    paddingVertical: 6,
    backgroundColor: 'rgba(5, 3, 10, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  quickPromptScroll: { paddingHorizontal: 16, gap: 8 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  quickChipText: { color: '#e2e8f0', fontSize: 11, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0c0817',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
  },
  sendBtn: {
    backgroundColor: '#8b5cf6',
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AIMentorScreen;