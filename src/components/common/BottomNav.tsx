import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, User } from 'lucide-react-native';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: any) => void;
  accentColor?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  accentColor = '#c084fc',
}) => {
  const insets = useSafeAreaInsets();

  const isHome = currentTab === 'home';
  const isProfile = currentTab === 'profile';

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            isHome && {
              backgroundColor: 'rgba(192, 132, 252, 0.16)',
              borderColor: accentColor + '55',
            },
          ]}
          activeOpacity={0.8}
          onPress={() => onSelectTab('home')}
        >
          <Home size={18} color={isHome ? accentColor : '#94a3b8'} />
          <Text style={[styles.tabLabel, isHome && { color: '#ffffff' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            isProfile && {
              backgroundColor: 'rgba(192, 132, 252, 0.16)',
              borderColor: accentColor + '55',
            },
          ]}
          activeOpacity={0.8}
          onPress={() => onSelectTab('profile')}
        >
          <User size={18} color={isProfile ? accentColor : '#94a3b8'} />
          <Text style={[styles.tabLabel, isProfile && { color: '#ffffff' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 3, 10, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
    paddingHorizontal: 18,
  },
  bar: {
    flexDirection: 'row',
    gap: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default BottomNav;