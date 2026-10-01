import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, ShieldCheck } from 'lucide-react-native';

interface BottomNavProps {
  currentTab: 'home' | 'proof';
  onSelectTab: (tab: 'home' | 'proof') => void;
  accentColor?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  accentColor = '#c084fc',
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, currentTab === 'home' && styles.activeTab]}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.7}
      >
        <Home size={20} color={currentTab === 'home' ? accentColor : '#94a3b8'} />
        <Text style={[styles.text, { color: currentTab === 'home' ? '#fff' : '#94a3b8' }]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, currentTab === 'proof' && styles.activeTab]}
        onPress={() => onSelectTab('proof')}
        activeOpacity={0.7}
      >
        <ShieldCheck size={20} color={currentTab === 'proof' ? accentColor : '#94a3b8'} />
        <Text style={[styles.text, { color: currentTab === 'proof' ? '#fff' : '#94a3b8' }]}>
          Proof Pass
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    height: 60,
    backgroundColor: 'rgba(15, 10, 28, 0.92)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default BottomNav;