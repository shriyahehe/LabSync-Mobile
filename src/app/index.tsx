
import { router } from 'expo-router';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  ChevronRight,
  Clock3,
  FlaskConical,
  Home,
  Microscope,
  MoreHorizontal,
  Package,
  RefreshCw,
  Settings2,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  LabSyncColors as C,
  LabSyncRadius as R,
  LabSyncShadows as S,
} from '@/constants/labsync-theme';

import {
  getEquipment,
  getExperiments,
  getMaterials,
  getSamples,
} from '@/services/api';

import type {
  Equipment,
  Experiment,
  Material,
  Sample,
} from '@/services/types';

type DashboardAlert = {
  id: string;
  title: string;
  detail: string;
  type: 'material' | 'equipment';
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning.';
  if (hour < 17) return 'Good afternoon.';
  return 'Good evening.';
}

function formatDate(dateValue?: string | null) {
  if (!dateValue) return 'Date unavailable';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateValue?: string | null) {
  if (!dateValue) return 'Time unavailable';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return 'Time unavailable';

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getExperimentStatus(status: string) {
  switch (status?.toUpperCase()) {
    case 'IN_PROGRESS':
      return {
        label: 'IN PROGRESS',
        color: C.primary,
        background: C.primaryLight,
      };

    case 'COMPLETED':
      return {
        label: 'COMPLETED',
        color: C.secondary,
        background: C.secondaryLight,
      };

    case 'CANCELLED':
      return {
        label: 'CANCELLED',
        color: C.danger,
        background: C.dangerLight,
      };

    case 'PLANNED':
      return {
        label: 'PLANNED',
        color: C.accent,
        background: C.accentLight,
      };

    default:
      return {
        label: status || 'UNKNOWN',
        color: C.muted,
        background: C.surfaceSecondary,
      };
  }
}

function SectionHeading({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {action ? (
        <TouchableOpacity onPress={onPress} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
          <ChevronRight size={15} color={C.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ExperimentCard({ item }: { item: Experiment }) {
  const status = getExperimentStatus(item.status);

  const dateValue = item.start_time || item.created_at;

  const researcher =
    item.started_by?.trim() || 'Researcher not assigned';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.experimentCard}
      onPress={() => router.push(`/experiments/${item.id}` as any)}
    >
      <View style={styles.experimentTop}>
        <View style={styles.experimentTime}>
          <Clock3 size={13} color={C.muted} />
          <Text style={styles.timeText}>
            {formatDate(dateValue)}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: status.background },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: status.color },
            ]}
          />
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <Text style={styles.experimentTitle}>{item.name}</Text>

      <View style={styles.experimentBottom}>
        <View style={styles.researcherAvatar}>
          <Text style={styles.researcherInitial}>
            {researcher.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.researcherName}>{researcher}</Text>
        <Text style={styles.experimentId}>#{item.id}</Text>
        <ArrowRight size={16} color={C.muted} />
      </View>
    </TouchableOpacity>
  );
}

function AlertRow({
  item,
  last,
}: {
  item: DashboardAlert;
  last: boolean;
}) {
  const isMaterial = item.type === 'material';

  return (
    <View style={[styles.alertRow, !last && styles.alertBorder]}>
      <View
        style={[
          styles.alertIcon,
          {
            backgroundColor: isMaterial
              ? C.dangerLight
              : C.accentLight,
          },
        ]}
      >
        {isMaterial ? (
          <Package size={18} color={C.danger} />
        ) : (
          <Settings2 size={18} color={C.accent} />
        )}
      </View>

      <View style={styles.alertInfo}>
        <Text style={styles.alertTitle}>{item.title}</Text>
        <Text style={styles.alertDetail}>{item.detail}</Text>
      </View>

      <AlertTriangle
        size={16}
        color={isMaterial ? C.danger : C.accent}
      />
    </View>
  );
}

function BottomNavigation() {
  const items = [
    { label: 'Home', icon: Home, route: '/' },
    {
      label: 'Experiments',
      icon: FlaskConical,
      route: '/experiments',
    },
    { label: 'Samples', icon: Package, route: '/samples' },
    { label: 'More', icon: MoreHorizontal, route: '/more' },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = item.label === 'Home';
        const Icon = item.icon;

        return (
          <TouchableOpacity
            key={item.label}
            style={styles.navItem}
            onPress={() => router.push(item.route as any)}
          >
            <View
              style={[
                styles.navIconWrap,
                active && styles.navIconActive,
              ]}
            >
              <Icon
                size={20}
                color={active ? C.primary : C.muted}
                strokeWidth={active ? 2.5 : 1.8}
              />
            </View>

            <Text
              style={[
                styles.navLabel,
                active && styles.navLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setError('');

      const [
        experimentData,
        sampleData,
        equipmentData,
        materialData,
      ] = await Promise.all([
        getExperiments(),
        getSamples(),
        getEquipment(),
        getMaterials(),
      ]);

      setExperiments(
        Array.isArray(experimentData)
          ? experimentData
          : (experimentData as any)?.experiments ?? []
      );

      setSamples(
        Array.isArray(sampleData) ? sampleData : []
      );

      setEquipment(
        Array.isArray(equipmentData) ? equipmentData : []
      );

      setMaterials(
        Array.isArray(materialData) ? materialData : []
      );
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError(
        'Unable to load live laboratory data. Check your backend connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  const activeExperiments = experiments.filter(
    (experiment) =>
      experiment.status?.toUpperCase() === 'IN_PROGRESS'
  ).length;

  const equipmentInUse = equipment.filter(
    (item) => item.status?.toUpperCase() === 'IN_USE'
  ).length;

  const lowStockMaterials = materials.filter(
    (item) =>
      Number(item.quantity) <= Number(item.minimum_quantity)
  );

  const maintenanceEquipment = equipment.filter(
    (item) => item.status?.toUpperCase() === 'MAINTENANCE'
  );

  const alerts = useMemo<DashboardAlert[]>(() => {
    const materialAlerts: DashboardAlert[] = lowStockMaterials.map(
      (item) => ({
        id: `material-${item.id}`,
        title: item.name,
        detail: `Low stock: ${item.quantity} ${item.unit} remaining`,
        type: 'material',
      })
    );

    const equipmentAlerts: DashboardAlert[] =
      maintenanceEquipment.map((item) => ({
        id: `equipment-${item.id}`,
        title: item.name,
        detail: 'Equipment requires maintenance',
        type: 'equipment',
      }));

    return [...materialAlerts, ...equipmentAlerts];
  }, [lowStockMaterials, maintenanceEquipment]);

  const recentExperiments = useMemo(() => {
    return [...experiments]
      .sort((a, b) => {
        const dateA = new Date(
          a.created_at || a.start_time || 0
        ).getTime();

        const dateB = new Date(
          b.created_at || b.start_time || 0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 3);
  }, [experiments]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>
            Loading your laboratory...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.primary}
            />
          }
        >
          <View style={styles.header}>
            <View style={styles.brandArea}>
              <View style={styles.brandIcon}>
                <Microscope size={21} color={C.white} />
              </View>

              <View>
                <Text style={styles.brandName}>LABSYNC</Text>
                <Text style={styles.brandSubtitle}>
                  LABORATORY FIELD REGISTER
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/more' as any)}
            >
              <Bell size={20} color={C.ink} />
            </TouchableOpacity>
          </View>

          <View style={styles.greeting}>
            <Text style={styles.greetingEyebrow}>
              YOUR LAB OVERVIEW
            </Text>

            <Text style={styles.greetingTitle}>
              {getGreeting()}
            </Text>

            <Text style={styles.greetingSubtitle}>
              Here's what's happening in your laboratory today.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.backendButton}
            onPress={() => router.push('/api-test' as any)}
          >
            <Activity size={15} color={C.primary} />
            <Text style={styles.backendButtonText}>
              TEST BACKEND CONNECTION
            </Text>
            <ArrowRight size={15} color={C.primary} />
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorCard}>
              <AlertTriangle size={19} color={C.danger} />
              <View style={styles.errorContent}>
                <Text style={styles.errorTitle}>
                  Dashboard connection issue
                </Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  onPress={loadDashboard}
                  style={styles.retryButton}
                >
                  <RefreshCw size={13} color={C.primary} />
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <SectionHeading title="Laboratory at a glance" />

          <View style={styles.statsGrid}>
            <StatCard
              label="Active experiments"
              value={activeExperiments}
              icon={
                <FlaskConical size={19} color={C.primary} />
              }
              tint={C.primaryLight}
            />

            <StatCard
              label="Indexed samples"
              value={samples.length}
              icon={<Package size={19} color={C.secondary} />}
              tint={C.secondaryLight}
            />

            <StatCard
              label="Equipment in use"
              value={equipmentInUse}
              icon={<Settings2 size={19} color={C.accent} />}
              tint={C.accentLight}
            />

            <StatCard
              label="Action items"
              value={alerts.length}
              icon={
                <AlertTriangle size={19} color={C.danger} />
              }
              tint={C.dangerLight}
            />
          </View>

          <View style={styles.sectionGap}>
            <SectionHeading
              title="Recent experiments"
              action="View all"
              onPress={() => router.push('/experiments' as any)}
            />
          </View>

          {recentExperiments.length > 0 ? (
            <View style={styles.experimentList}>
              {recentExperiments.map((item) => (
                <ExperimentCard key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <FlaskConical size={25} color={C.muted} />
              <Text style={styles.emptyTitle}>
                No experiments recorded
              </Text>
              <Text style={styles.emptyText}>
                Your recent experiments will appear here when they are
                added to the database.
              </Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => router.push('/experiments' as any)}
              >
                <Text style={styles.emptyActionText}>
                  Go to experiments
                </Text>
                <ArrowRight size={14} color={C.primary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.sectionGap}>
            <SectionHeading title="Needs attention" />
          </View>

          {alerts.length > 0 ? (
            <View style={styles.alertCard}>
              {alerts.slice(0, 5).map((item, index) => (
                <AlertRow
                  key={item.id}
                  item={item}
                  last={index === Math.min(alerts.length, 5) - 1}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Activity size={24} color={C.primary} />
              <Text style={styles.emptyTitle}>
                All clear
              </Text>
              <Text style={styles.emptyText}>
                No low-stock materials or equipment maintenance alerts
                were found.
              </Text>
            </View>
          )}

          <View style={styles.sectionGap}>
            <SectionHeading title="Quick access" />
          </View>

          <View style={styles.quickAccessGrid}>
            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/samples' as any)}
            >
              <Package size={20} color={C.secondary} />
              <Text style={styles.quickAccessTitle}>Samples</Text>
              <Text style={styles.quickAccessDetail}>
                Manage inventory
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/experiments' as any)}
            >
              <FlaskConical size={20} color={C.primary} />
              <Text style={styles.quickAccessTitle}>Experiments</Text>
              <Text style={styles.quickAccessDetail}>
                View lab records
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/equipment' as any)}
            >
              <Settings2 size={20} color={C.accent} />
              <Text style={styles.quickAccessTitle}>Equipment</Text>
              <Text style={styles.quickAccessDetail}>
                Track equipment
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push('/materials' as any)}
            >
              <Package size={20} color={C.danger} />
              <Text style={styles.quickAccessTitle}>Materials</Text>
              <Text style={styles.quickAccessDetail}>
                Monitor stock
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>JUIT LabSync</Text>
            <Text style={styles.footerSubtitle}>
              Laboratory management system
            </Text>
            <Text style={styles.footerUpdated}>
              Pull down to refresh live data
            </Text>
          </View>
        </ScrollView>

        <BottomNavigation />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },

  screen: {
    flex: 1,
    backgroundColor: C.background,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  brandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandName: {
    color: C.ink,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2.2,
  },

  brandSubtitle: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.15,
    marginTop: 3,
  },

  notificationButton: {
    height: 42,
    width: 42,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  greeting: {
    marginBottom: 20,
  },

  greetingEyebrow: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  greetingTitle: {
    color: C.ink,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.8,
  },

  greetingSubtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  backendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: C.primaryLight,
    borderRadius: R.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 27,
  },

  backendButtonText: {
    flex: 1,
    color: C.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    color: C.ink,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  sectionActionText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },

  statCard: {
    width: '48%',
    flexGrow: 1,
    minHeight: 128,
    padding: 15,
    borderRadius: R.lg,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    ...S.card,
  },

  statIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  statValue: {
    color: C.ink,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
  },

  statLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  sectionGap: {
    marginTop: 30,
  },

  experimentList: {
    gap: 11,
  },

  experimentCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
    ...S.card,
  },

  experimentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  experimentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  timeText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '600',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: R.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusDot: {
    height: 6,
    width: 6,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  experimentTitle: {
    color: C.ink,
    fontSize: 16,
    fontWeight: '800',
  },

  experimentBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    gap: 8,
  },

  researcherAvatar: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: C.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  researcherInitial: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '800',
  },

  researcherName: {
    color: C.text,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },

  experimentId: {
    color: C.subtle,
    fontSize: 10,
    fontWeight: '700',
    marginRight: 3,
  },

  alertCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 15,
    ...S.card,
  },

  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 11,
  },

  alertBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },

  alertIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  alertInfo: {
    flex: 1,
  },

  alertTitle: {
    color: C.ink,
    fontSize: 12,
    fontWeight: '700',
  },

  alertDetail: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },

  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 22,
    alignItems: 'center',
    ...S.card,
  },

  emptyTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },

  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
  },

  emptyActionText: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },

  quickAccessCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
    ...S.card,
  },

  quickAccessTitle: {
    color: C.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
  },

  quickAccessDetail: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 15,
    borderRadius: R.lg,
    backgroundColor: C.dangerLight,
    marginBottom: 22,
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    color: C.ink,
    fontSize: 12,
    fontWeight: '800',
  },

  errorText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },

  retryText: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  footer: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 12,
  },

  footerBrand: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  footerSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 5,
  },

  footerUpdated: {
    color: C.subtle,
    fontSize: 9,
    marginTop: 5,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: C.muted,
    fontSize: 12,
    marginTop: 12,
  },

  bottomNav: {
    height: 70,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  navIconWrap: {
    width: 38,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.pill,
  },

  navIconActive: {
    backgroundColor: C.primaryLight,
  },

  navLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '600',
  },

  navLabelActive: {
    color: C.primary,
    fontWeight: '800',
  },
});
