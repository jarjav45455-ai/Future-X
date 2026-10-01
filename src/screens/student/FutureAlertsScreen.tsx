import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Sparkles,
  Calendar,
  ExternalLink,
  ChevronRight,
  Flame,
  Award,
  Briefcase,
  Layers,
} from 'lucide-react-native';

import { FutureXHeader } from '../../components/common/FutureXHeader';
import { StudentProfile } from '../../types/student';

export interface FutureAlertItem {
  id: string;
  title: string;
  source: string;
  category: 'HACKATHON' | 'INTERNSHIP' | 'HIRING' | string;
  date: string;
  actionText?: string;
  priority?: 'HIGH' | 'MEDIUM' | string;
  applyUrl?: string;
}

interface FutureAlertsScreenProps {
  profile: StudentProfile;
  onBack: () => void;
  onNavigateToOpportunities?: () => void;
  onNavigateToRoadmap?: () => void;
}

export const FutureAlertsScreen: React.FC<FutureAlertsScreenProps> = ({
  profile,
  onBack,
  onNavigateToOpportunities,
  onNavigateToRoadmap,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'HACKATHON' | 'INTERNSHIP' | 'HIRING'>('ALL');

  const defaultAlerts: FutureAlertItem[] = [
    {
      id: 'fa-1',
      title: `${profile.targetRole.roleTitle} Global Hackathon 2026`,
      source: 'Devpost & Unstop Live',
      category: 'HACKATHON',
      date: 'Registration Closing Soon',
      actionText: 'Register Now',
      priority: 'HIGH',
      applyUrl: '[https://unstop.com/hackathons](https://unstop.com/hackathons)',
    },
    {
      id: 'fa-2',
      title: `Early Careers Associate Track: ${profile.targetRole.roleTitle}`,
      source: 'Direct Portal Sync',
      category: 'INTERNSHIP',
      date: 'Active Registration',
      actionText: 'Inspect Eligibility',
      priority: 'HIGH',
      applyUrl: '[https://wellfound.com/jobs](https://wellfound.com/jobs)',
    },
  ];

  const rawAlerts: FutureAlertItem[] =
    (profile as any).futureAlerts && (profile as any).futureAlerts.length > 0
      ? (profile as any).futureAlerts
      : defaultAlerts;

  const filteredAlerts = rawAlerts.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    return item.category?.toUpperCase() === selectedFilter;
  });

  const handleAlertAction = (alert: FutureAlertItem) => {
    if (alert.applyUrl) {
      Linking.openURL(alert.applyUrl).catch(() => {});
    } else if (onNavigateToOpportunities) {
      onNavigateToOpportunities();
    } else {
      const query = `${alert.title} ${alert.source} apply 2026`;
      Linking.openURL(`[https://www.google.com/search?q=$](https://www.google.com/search?q=$){encodeURIComponent(query)}`).catch(() => {});
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case 'HACKATHON':
        return <Award size={14} color="#f43f5e" />;
      case 'INTERNSHIP':
        return <Briefcase size={14} color="#38bdf8" />;
      default:
        return <Layers size={14} color="#c084fc" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FutureXHeader
        title="Future Alerts"
        subtitle={`Real-Time Telemetry for ${profile.targetRole.roleTitle}`}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.radarBanner}>
          <View style={styles.radarIconBox}>
            <Bell size={20} color="#fb923c" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.radarTitle}>Active Opportunity Radar</Text>
            <Text style={styles.radarSub}>
              Indexing 2026 deadlines, hackathons & hiring tracks aligned with your role roadmap.
            </Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {(['ALL', 'HACKATHON', 'INTERNSHIP', 'HIRING'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selectedFilter === filter && styles.activeFilterChip]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.feedSection}>
          <Text style={styles.feedHeader}>Live Telemetry Feed ({filteredAlerts.length})</Text>

          {filteredAlerts.map((item, idx) => (
            <View key={item.id || `alert-${idx}`} style={styles.alertCard}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                  <View style={styles.catBadge}>
                    {getCategoryIcon(item.category)}
                    <Text style={styles.catBadgeText}>{item.category?.toUpperCase() || 'RADAR'}</Text>
                  </View>
                  {item.priority === 'HIGH' && (
                    <View style={styles.highPriorityBadge}>
                      <Flame size={11} color="#f97316" />
                      <Text style={styles.highPriorityText}>URGENT</Text>
                    </View>
                  )}
                </View>

                <View style={styles.sourceTag}>
                  <Text style={styles.sourceText}>{item.source}</Text>
                </View>
              </View>

              <Text style={styles.alertTitle}>{item.title}</Text>

              <View style={styles.dateRow}>
                <Calendar size={13} color="#94a3b8" />
                <Text style={styles.dateText}>Timeline: {item.date}</Text>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.8}
                  onPress={() => handleAlertAction(item)}
                >
                  <Text style={styles.actionBtnText}>{item.actionText || 'Open Details'}</Text>
                  <ExternalLink size={13} color="#fff" />
                </TouchableOpacity>

                {onNavigateToOpportunities && (
                  <TouchableOpacity style={styles.radarLinkBtn} onPress={onNavigateToOpportunities}>
                    <Text style={styles.radarLinkText}>View on Radar</Text>
                    <ChevronRight size={14} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {onNavigateToRoadmap && (
          <TouchableOpacity style={styles.roadmapBridgeCard} onPress={onNavigateToRoadmap}>
            <View style={{ flex: 1 }}>
              <View style={styles.bridgeTag}>
                <Sparkles size={12} color="#c084fc" />
                <Text style={styles.bridgeTagText}>PORTFOLIO GATEWAY</Text>
              </View>
              <Text style={styles.bridgeTitle}>Complete Phase Deliverables</Text>
              <Text style={styles.bridgeSub}>
                Verified project deliverables unlock higher callbacks on live radar jobs.
              </Text>
            </View>
            <ChevronRight size={18} color="#c084fc" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05030a' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 60 },
  radarBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.25)',
    borderRadius: 16,
    padding: 14,
  },
  radarIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarTitle: { color: '#fb923c', fontSize: 14, fontWeight: '700' },
  radarSub: { color: '#94a3b8', fontSize: 11, marginTop: 2, lineHeight: 16 },
  filterRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeFilterChip: {
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderColor: '#c084fc',
  },
  filterText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  activeFilterText: { color: '#c084fc', fontWeight: '700' },
  feedSection: { gap: 10, marginTop: 4 },
  feedHeader: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  alertCard: {
    backgroundColor: 'rgba(18, 12, 33, 0.75)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catBadgeText: { color: '#cbd5e1', fontSize: 10, fontWeight: '700' },
  highPriorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  highPriorityText: { color: '#f97316', fontSize: 9, fontWeight: '800' },
  sourceTag: { backgroundColor: 'rgba(255, 255, 255, 0.04)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sourceText: { color: '#64748b', fontSize: 10 },
  alertTitle: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 20 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { color: '#94a3b8', fontSize: 12 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#9333ea',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  radarLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  radarLinkText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  roadmapBridgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 132, 252, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.2)',
    padding: 16,
    marginTop: 6,
  },
  bridgeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  bridgeTagText: { color: '#c084fc', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  bridgeTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bridgeSub: { color: '#94a3b8', fontSize: 11, marginTop: 2, lineHeight: 16 },
});

export default FutureAlertsScreen;