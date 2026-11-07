import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Beaker,
    CalendarDays,
    Clock3,
    FlaskConical,
    GraduationCap,
    Mail,
    MapPin,
    Microscope,
    Package,
    Pencil,
    Phone,
    Power,
    UserRound,
    Wrench,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { LabSyncColors as C, LabSyncShadows, LabSyncRadius as R, LabSyncSpacing as SP, LabSyncTypography as T } from '../../constants/labsync-theme';
import { getResearcher, getResearcherActivity, updateResearcher } from '../../services/api';
import type {
    Researcher,
    ResearcherActivity,
    ResearcherActivityType,
} from '../../services/types';

const formatDate = (value?: string | null) => {
  if (!value) return 'Not provided';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const scholarLabel = (type: string) =>
  type === 'PHD_SCHOLAR' ? 'PhD Scholar' : 'Research Scholar';

const activityMeta: Record<ResearcherActivityType, { label: string; icon: typeof FlaskConical }> = {
  LAB_ENTRY: { label: 'Laboratory entry', icon: MapPin },
  EQUIPMENT: { label: 'Equipment', icon: Wrench },
  SAMPLE: { label: 'Sample transaction', icon: Beaker },
  MATERIAL: { label: 'Material consumption', icon: Package },
  EXPERIMENT: { label: 'Experiment', icon: Microscope },
};

export default function ResearcherProfileScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const researcherId = Number(params.id);

  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [activities, setActivities] = useState<ResearcherActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (!Number.isInteger(researcherId) || researcherId <= 0) {
      setError('Invalid researcher ID.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [profileResult, activityResult] = await Promise.all([
        getResearcher(researcherId),
        getResearcherActivity(researcherId),
      ]);
      setResearcher(profileResult);
      setActivities(Array.isArray(activityResult.activities) ? activityResult.activities : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load researcher profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setActivityLoading(false);
    }
  }, [researcherId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const initials = useMemo(() => {
    if (!researcher?.full_name) return 'R';
    return researcher.full_name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }, [researcher?.full_name]);

  const changeStatus = () => {
    if (!researcher) return;
    const nextStatus = researcher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    Alert.alert(
      `${nextStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} researcher?`,
      `${researcher.full_name} will be marked ${nextStatus.toLowerCase()}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextStatus === 'ACTIVE' ? 'Activate' : 'Deactivate',
          style: nextStatus === 'INACTIVE' ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const updated = await updateResearcher(researcher.id, {
                researcher_code: researcher.researcher_code,
                full_name: researcher.full_name,
                email: researcher.email,
                phone: researcher.phone,
                researcher_type: researcher.researcher_type,
                department: researcher.department,
                research_area: researcher.research_area,
                primary_laboratory_id: researcher.primary_laboratory_id,
                supervisor_name: researcher.supervisor_name,
                joining_date: researcher.joining_date,
                status: nextStatus,
              });
              setResearcher(updated);
            } catch (err) {
              Alert.alert('Could not update status', err instanceof Error ? err.message : 'Please try again.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: typeof UserRound;
    label: string;
    value?: string | null;
  }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Icon size={17} color={C.primary} /></View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value?.trim() || 'Not provided'}</Text>
      </View>
    </View>
  );

  const renderActivity = (item: ResearcherActivity, index: number) => {
    const meta = activityMeta[item.activity_type] ?? activityMeta.EXPERIMENT;
    const Icon = meta.icon;
    return (
      <View key={`${item.activity_type}-${item.reference_id}-${index}`} style={styles.activityRow}>
        <View style={styles.timelineRail}>
          <View style={styles.activityIcon}><Icon size={17} color={C.primary} /></View>
          {index < activities.length - 1 && <View style={styles.timelineLine} />}
        </View>
        <View style={styles.activityBody}>
          <View style={styles.activityTopline}>
            <Text style={styles.activityTitle}>{item.title || meta.label}</Text>
            <Text style={styles.activityType}>{meta.label}</Text>
          </View>
          {!!item.details && <Text style={styles.activityDetails}>{item.details}</Text>}
          <View style={styles.activityTime}>
            <Clock3 size={12} color={C.subtle} />
            <Text style={styles.activityTimeText}>{formatDateTime(item.occurred_at)}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <Stack.Screen options={{ title: 'Researcher Profile' }} />
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.stateText}>Loading researcher profile…</Text>
      </View>
    );
  }

  if (error && !researcher) {
    return (
      <View style={styles.page}>
        <Stack.Screen options={{ title: 'Researcher Profile' }} />
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={19} color={C.ink} /><Text style={styles.backText}>Researchers</Text>
        </Pressable>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Couldn't load this profile</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => loadProfile()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!researcher) return null;

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: 'Researcher Profile' }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} tintColor={C.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navbar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={19} color={C.ink} />
            <Text style={styles.backText}>Researchers</Text>
          </Pressable>
          <Text style={styles.eyebrow}>RESEARCHER RECORD</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileTopline}>
            <Text style={styles.sectionEyebrow}>PROFILE</Text>
            <View style={[styles.statusPill, researcher.status === 'ACTIVE' ? styles.activePill : styles.inactivePill]}>
              <View style={[styles.statusDot, researcher.status === 'ACTIVE' ? styles.activeDot : styles.inactiveDot]} />
              <Text style={[styles.statusText, researcher.status === 'ACTIVE' ? styles.activeText : styles.inactiveText]}>
                {researcher.status}
              </Text>
            </View>
          </View>

          <View style={styles.identity}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <Text style={styles.name}>{researcher.full_name}</Text>
            <Text style={styles.code}>{researcher.researcher_code} · {scholarLabel(researcher.researcher_type)}</Text>
            <View style={styles.labLine}>
              <MapPin size={14} color={C.secondary} />
              <Text style={styles.labText}>{researcher.primary_laboratory || 'Laboratory not assigned'}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push({
                pathname: '/researchers/edit/[id]',
                params: { id: String(researcher.id) },
              } as any)}
            >
              <Pencil size={15} color={C.white} />
              <Text style={styles.primaryButtonText}>Edit profile</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, researcher.status === 'ACTIVE' && styles.deactivateButton]}
              onPress={changeStatus}
              disabled={actionLoading}
            >
              {actionLoading ? <ActivityIndicator size="small" color={C.primary} /> : <Power size={15} color={researcher.status === 'ACTIVE' ? C.danger : C.primary} />}
              <Text style={[styles.secondaryButtonText, researcher.status === 'ACTIVE' && styles.deactivateText]}>
                {researcher.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>RESEARCHER INFORMATION</Text>
            <Text style={styles.sectionTitle}>Personal & academic details</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <InfoRow icon={Mail} label="EMAIL ADDRESS" value={researcher.email} />
          <View style={styles.divider} />
          <InfoRow icon={Phone} label="PHONE NUMBER" value={researcher.phone} />
          <View style={styles.divider} />
          <InfoRow icon={GraduationCap} label="DEPARTMENT" value={researcher.department} />
          <View style={styles.divider} />
          <InfoRow icon={FlaskConical} label="RESEARCH AREA" value={researcher.research_area} />
          <View style={styles.divider} />
          <InfoRow icon={MapPin} label="PRIMARY LABORATORY" value={researcher.primary_laboratory} />
          <View style={styles.divider} />
          <InfoRow icon={UserRound} label="SUPERVISOR" value={researcher.supervisor_name} />
          <View style={styles.divider} />
          <InfoRow icon={CalendarDays} label="JOINING DATE" value={formatDate(researcher.joining_date)} />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>RESEARCHER ACTIVITY</Text>
            <Text style={styles.sectionTitle}>Activity history</Text>
          </View>
          <View style={styles.countPill}><Text style={styles.countText}>{activities.length}</Text></View>
        </View>

        <View style={styles.activityCard}>
          {activityLoading ? (
            <View style={styles.inlineLoading}><ActivityIndicator color={C.primary} /><Text style={styles.stateText}>Loading activity…</Text></View>
          ) : activities.length ? (
            activities.map(renderActivity)
          ) : (
            <View style={styles.emptyActivity}>
              <View style={styles.emptyIcon}><Clock3 size={22} color={C.secondary} /></View>
              <Text style={styles.emptyTitle}>No activity recorded yet</Text>
              <Text style={styles.emptyText}>Lab entries, equipment transactions, sample usage, material consumption and experiments linked to this researcher will appear here.</Text>
            </View>
          )}
        </View>

        <Text style={styles.footerNote}>LABSYNC · RESEARCHER MANAGEMENT</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  scrollContent: { padding: SP.lg, paddingBottom: SP.xxxl },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.lg },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7 },
  backText: { color: C.ink, fontSize: T.body, fontWeight: '700' },
  eyebrow: { color: C.subtle, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 1.2 },
  profileCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.xl, padding: SP.lg, ...LabSyncShadows.card },
  profileTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionEyebrow: { color: C.muted, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 1.1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: R.pill, paddingHorizontal: 11, paddingVertical: 7 },
  activePill: { backgroundColor: C.successLight },
  inactivePill: { backgroundColor: C.surfaceSecondary },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  activeDot: { backgroundColor: C.success },
  inactiveDot: { backgroundColor: C.muted },
  statusText: { fontSize: T.caption, fontWeight: '800', letterSpacing: 0.5 },
  activeText: { color: C.success },
  inactiveText: { color: C.muted },
  identity: { alignItems: 'center', paddingTop: SP.xl, paddingBottom: SP.lg },
  avatar: { width: 76, height: 76, borderRadius: R.xl, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SP.md },
  avatarText: { color: C.primaryDark, fontSize: 25, fontWeight: '800' },
  name: { color: C.ink, fontSize: T.heading1, fontWeight: '800', textAlign: 'center' },
  code: { color: C.muted, fontSize: T.body, marginTop: 5, textAlign: 'center' },
  labLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  labText: { color: C.secondary, fontSize: T.bodySmall, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: SP.sm },
  primaryButton: { flex: 1, minHeight: 46, backgroundColor: C.primary, borderRadius: R.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: SP.md },
  primaryButtonText: { color: C.white, fontSize: T.bodySmall, fontWeight: '800' },
  secondaryButton: { flex: 1, minHeight: 46, backgroundColor: C.primaryLight, borderRadius: R.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: SP.md },
  deactivateButton: { backgroundColor: C.dangerLight },
  secondaryButtonText: { color: C.primaryDark, fontSize: T.bodySmall, fontWeight: '800' },
  deactivateText: { color: C.danger },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: SP.xxl, marginBottom: SP.md },
  sectionTitle: { color: C.ink, fontSize: T.heading3, fontWeight: '800', marginTop: 5 },
  detailsCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, paddingHorizontal: SP.md, ...LabSyncShadows.card },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingVertical: SP.md },
  infoIcon: { width: 36, height: 36, borderRadius: R.md, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  infoTextWrap: { flex: 1 },
  infoLabel: { color: C.subtle, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 0.8 },
  infoValue: { color: C.ink, fontSize: T.body, fontWeight: '600', marginTop: 4 },
  divider: { height: 1, backgroundColor: C.divider },
  countPill: { minWidth: 34, height: 30, borderRadius: R.pill, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  countText: { color: C.primaryDark, fontSize: T.bodySmall, fontWeight: '800' },
  activityCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: SP.md, ...LabSyncShadows.card },
  activityRow: { flexDirection: 'row', minHeight: 94 },
  timelineRail: { width: 38, alignItems: 'center' },
  activityIcon: { width: 32, height: 32, borderRadius: R.md, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineLine: { position: 'absolute', top: 32, bottom: 0, width: 1, backgroundColor: C.border },
  activityBody: { flex: 1, paddingBottom: SP.lg, paddingLeft: SP.sm },
  activityTopline: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP.sm },
  activityTitle: { flex: 1, color: C.ink, fontSize: T.body, fontWeight: '800' },
  activityType: { color: C.secondary, fontSize: T.caption, fontWeight: '800', textAlign: 'right' },
  activityDetails: { color: C.text, fontSize: T.bodySmall, lineHeight: 19, marginTop: 5 },
  activityTime: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  activityTimeText: { color: C.subtle, fontSize: T.caption },
  inlineLoading: { minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: SP.sm },
  emptyActivity: { alignItems: 'center', paddingVertical: SP.xl, paddingHorizontal: SP.md },
  emptyIcon: { width: 48, height: 48, borderRadius: R.lg, backgroundColor: C.secondaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SP.md },
  emptyTitle: { color: C.ink, fontSize: T.body, fontWeight: '800' },
  emptyText: { color: C.muted, fontSize: T.bodySmall, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  centerState: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center', gap: SP.md },
  stateText: { color: C.muted, fontSize: T.bodySmall },
  errorCard: { backgroundColor: C.dangerLight, borderRadius: R.lg, padding: SP.lg, marginTop: SP.xl },
  errorTitle: { color: C.danger, fontSize: T.heading3, fontWeight: '800' },
  errorText: { color: C.text, fontSize: T.bodySmall, marginTop: 7, lineHeight: 19 },
  footerNote: { color: C.subtle, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 1.1, textAlign: 'center', marginTop: SP.xxl },
});
