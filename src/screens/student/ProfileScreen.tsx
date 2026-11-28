import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Mail,
  Target,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Clock,
  Award,
} from 'lucide-react-native';
import { FutureXHeader } from '../../components/common/FutureXHeader';
import { StudentProfile } from '../../types/student';

interface ProfileScreenProps {
  profile: StudentProfile;
  userEmail?: string;
  onBack: () => void;
  onOpenProofPass: () => void;
  onOpenAimSelector: () => void;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  userEmail,
  onBack,
  onOpenProofPass,
  onOpenAimSelector,
  onLogout,
}) => {
  const verifiedSkillsCount = (profile.skills || []).filter(
    (s) => s.status === 'Verified' || s.status === 'Proof-Verified' || s.status === 'Assessed'
  ).length;

  const confirmLogout = () => {
    if (!onLogout) return;
    Alert.alert(
      'Log out of FutureX?',
      'Your account stays safely saved in the FutureX database. You can sign back in anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FutureXHeader
        title="Student Profile"
        subtitle="Account, trajectory & session settings"
        onBack={onBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity Hero Card */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(168, 85, 247, 0.2)', 'rgba(236, 72, 153, 0.08)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.avatarRing}>
            <User size={30} color="#c084fc" />
          </View>
          <Text style={styles.userName}>{profile.name || 'FutureX Student'}</Text>
          {userEmail ? (
            <View style={styles.emailRow}>
              <Mail size={13} color="#94a3b8" />
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.readinessPercentage || 0}%</Text>
              <Text style={styles.statLabel}>Readiness</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {verifiedSkillsCount}/{(profile.skills || []).length}
              </Text>
              <Text style={styles.statLabel}>Skills Audited</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.weeklyCommitmentHours || 10}h</Text>
              <Text style={styles.statLabel}>Weekly Pace</Text>
            </View>
          </View>
        </View>

        {/* Career Track Section */}
        <Text style={styles.sectionTitle}>CAREER CONFIGURATION</Text>

        <TouchableOpacity
          style={styles.menuCard}
          activeOpacity={0.8}
          onPress={onOpenAimSelector}
        >
          <View style={[styles.menuIconBox, { backgroundColor: 'rgba(192, 132, 252, 0.14)' }]}>
            <Target size={18} color="#c084fc" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Target Career Role</Text>
            <Text style={styles.menuSub}>{profile.targetRole?.roleTitle || 'Not selected'}</Text>
          </View>
          <ChevronRight size={18} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          activeOpacity={0.8}
          onPress={onOpenProofPass}
        >
          <View style={[styles.menuIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.14)' }]}>
            <ShieldCheck size={18} color="#34d399" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>ProofPass Credentials</Text>
            <Text style={styles.menuSub}>View & share verified skill evidence</Text>
          </View>
          <ChevronRight size={18} color="#64748b" />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Award size={15} color="#38bdf8" />
            <Text style={styles.infoText}>
              Track Level: {profile.targetRole?.seniority || 'Entry / Junior'}
            </Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 8 }]}>
            <Clock size={15} color="#fbbf24" />
            <Text style={styles.infoText}>
              Account ID: {profile.id}
            </Text>
          </View>
        </View>

        {/* Logout Action */}
        {onLogout && (
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.85}
            onPress={confirmLogout}
          >
            <LogOut size={18} color="#fda4af" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  heroCard: {
    borderRadius: 22,
    overflow: 'hidden',
    padding: 22,
    alignItems: 'center',
    backgroundColor: '#110b20',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
    marginBottom: 22,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderWidth: 2,
    borderColor: '#c084fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  userEmail: { color: '#94a3b8', fontSize: 12 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  statLabel: { color: '#94a3b8', fontSize: 10, marginTop: 3 },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#110b20',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  menuSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    marginBottom: 22,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: '#cbd5e1', fontSize: 12 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutText: { color: '#fda4af', fontSize: 14, fontWeight: '700' },
});

export default ProfileScreen;