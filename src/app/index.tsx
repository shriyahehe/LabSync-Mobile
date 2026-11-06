
import { router } from 'expo-router'
import {
  Activity,
  ArrowRight,
  Bell,
  ChevronRight,
  ClipboardList,
  Clock3,
  FlaskConical,
  Home,
  Microscope,
  MoreHorizontal,
  Package,
  Settings2,
} from 'lucide-react-native'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  LabSyncColors as C,
  LabSyncRadius as R,
  LabSyncShadows as S,
} from '@/constants/labsync-theme'

const experiments = [
  {
    id: 'EXP-024',
    time: '09:00 AM',
    title: 'Protein Purification',
    category: 'BIOCHEMISTRY',
    researcher: 'A. Sharma',
    status: 'IN PROGRESS',
    color: C.primary,
    background: C.primaryLight,
  },
  {
    id: 'EXP-018',
    time: '11:30 AM',
    title: 'Spectrometer Calibration',
    category: 'PHYSICS',
    researcher: 'R. Mehta',
    status: 'SCHEDULED',
    color: C.secondary,
    background: C.secondaryLight,
  },
  {
    id: 'EXP-027',
    time: '02:00 PM',
    title: 'PCR Amplification',
    category: 'BIOTECHNOLOGY',
    researcher: 'K. Singh',
    status: 'SCHEDULED',
    color: C.accent,
    background: C.accentLight,
  },
]

const deadlines = [
  {
    day: '22',
    month: 'SEP',
    title: 'Protein Assay Report',
    type: 'REPORT',
    reference: 'EXP-021',
    color: C.danger,
  },
  {
    day: '23',
    month: 'SEP',
    title: 'PCR Sample Analysis',
    type: 'ANALYSIS',
    reference: 'EXP-027',
    color: C.accent,
  },
  {
    day: '25',
    month: 'SEP',
    title: 'Spectrometer Maintenance',
    type: 'MAINTENANCE',
    reference: 'EQ-018',
    color: C.secondary,
  },
]

function SectionHeading({
  title,
  action,
  onPress,
}: {
  title: string
  action?: string
  onPress?: () => void
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
  )
}

function StatCard({
  label,
  value,
  icon,
  tint,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tint: string
  iconColor: string
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function ExperimentCard({
  item,
}: {
  item: (typeof experiments)[number]
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.experimentCard}
      onPress={() => router.push(`/experiments/${item.id}` as any)}
    >
      <View style={styles.experimentTop}>
        <View style={styles.experimentTime}>
          <Clock3 size={13} color={C.muted} />
          <Text style={styles.timeText}>{item.time}</Text>
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: item.background },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: item.color }]}
          />
          <Text style={[styles.statusText, { color: item.color }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.experimentTitle}>{item.title}</Text>
      <Text style={styles.experimentCategory}>{item.category}</Text>

      <View style={styles.experimentBottom}>
        <View style={styles.researcherAvatar}>
          <Text style={styles.researcherInitial}>
            {item.researcher.charAt(0)}
          </Text>
        </View>

        <Text style={styles.researcherName}>{item.researcher}</Text>
        <Text style={styles.experimentId}>{item.id}</Text>
        <ArrowRight size={16} color={C.muted} />
      </View>
    </TouchableOpacity>
  )
}

function DeadlineRow({
  item,
  last,
}: {
  item: (typeof deadlines)[number]
  last: boolean
}) {
  return (
    <View style={[styles.deadlineRow, !last && styles.deadlineBorder]}>
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{item.day}</Text>
        <Text style={styles.dateMonth}>{item.month}</Text>
      </View>

      <View style={styles.deadlineInfo}>
        <Text style={styles.deadlineTitle}>{item.title}</Text>
        <Text style={styles.deadlineReference}>
          {item.type} · {item.reference}
        </Text>
      </View>

      <View
        style={[styles.deadlineIndicator, { backgroundColor: item.color }]}
      />
    </View>
  )
}

function BottomNavigation() {
  const items = [
    { label: 'Home', icon: Home, route: '/' },
    { label: 'Experiments', icon: FlaskConical, route: '/experiments' },
    { label: 'Samples', icon: Package, route: '/samples' },
    { label: 'More', icon: MoreHorizontal, route: '/more' },
  ]

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = item.label === 'Home'
        const Icon = item.icon

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
        )
      })}
    </View>
  )
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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

            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={20} color={C.ink} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.greeting}>
            <Text style={styles.greetingEyebrow}>
              YOUR LAB OVERVIEW
            </Text>
            <Text style={styles.greetingTitle}>
              Good evening, Shriya.
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

          <SectionHeading title="Laboratory at a glance" />

          <View style={styles.statsGrid}>
            <StatCard
              label="Active experiments"
              value="12"
              icon={<FlaskConical size={19} color={C.primary} />}
              tint={C.primaryLight}
              iconColor={C.primary}
            />

            <StatCard
              label="Indexed samples"
              value="28"
              icon={<Package size={19} color={C.secondary} />}
              tint={C.secondaryLight}
              iconColor={C.secondary}
            />

            <StatCard
              label="Equipment in use"
              value="06"
              icon={<Settings2 size={19} color={C.accent} />}
              tint={C.accentLight}
              iconColor={C.accent}
            />

            <StatCard
              label="Action items"
              value="04"
              icon={<ClipboardList size={19} color={C.danger} />}
              tint={C.dangerLight}
              iconColor={C.danger}
            />
          </View>

          <View style={styles.sectionGap}>
            <SectionHeading
              title="Today's record"
              action="View all"
              onPress={() => router.push('/experiments' as any)}
            />
          </View>

          <View style={styles.experimentList}>
            {experiments.map((item) => (
              <ExperimentCard key={item.id} item={item} />
            ))}
          </View>

          <View style={styles.sectionGap}>
            <SectionHeading
              title="Upcoming deadlines"
              action="View all"
              onPress={() => router.push('/more' as any)}
            />
          </View>

          <View style={styles.deadlineCard}>
            {deadlines.map((item, index) => (
              <DeadlineRow
                key={item.reference}
                item={item}
                last={index === deadlines.length - 1}
              />
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>JUIT LabSync</Text>
            <Text style={styles.footerNames}>
              Shriya Sharma · Amit Yadav
            </Text>
          </View>
        </ScrollView>

        <BottomNavigation />
      </View>
    </SafeAreaView>
  )
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

  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: C.danger,
    borderWidth: 1,
    borderColor: C.surface,
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

  experimentCategory: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 5,
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

  deadlineCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 15,
    ...S.card,
  },

  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 13,
  },

  deadlineBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },

  dateBlock: {
    width: 43,
    height: 46,
    borderRadius: 11,
    backgroundColor: C.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateDay: {
    color: C.ink,
    fontSize: 17,
    fontWeight: '800',
  },

  dateMonth: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  deadlineInfo: {
    flex: 1,
  },

  deadlineTitle: {
    color: C.ink,
    fontSize: 12,
    fontWeight: '700',
  },

  deadlineReference: {
    color: C.muted,
    fontSize: 10,
    marginTop: 5,
    fontWeight: '600',
  },

  deadlineIndicator: {
    width: 7,
    height: 7,
    borderRadius: 5,
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

  footerNames: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 6,
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
})
