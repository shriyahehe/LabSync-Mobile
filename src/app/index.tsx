import { router } from 'expo-router'
import {
  Bell,
  ClipboardList,
  FlaskConical,
  Home,
  MoreHorizontal,
  Package
} from 'lucide-react-native'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'

const COLORS = {
  background: '#F5F3EC',
  paper: '#FCFBF7',
  ink: '#172A36',
  muted: '#65747C',
  green: '#176B63',
  softGreen: '#DCE9E3',
  blue: '#527A8A',
  ochre: '#B77932',
  brick: '#B84A42',
  border: '#D8DDD8',
  white: '#FFFFFF',
}

const experiments = [
  {
    id: 'EXP-024',
    time: '09:00',
    title: 'Protein Purification',
    lab: 'BIOCHEMISTRY',
    researcher: 'A. Sharma',
    status: 'IN PROGRESS',
  },
  {
    id: 'EXP-018',
    time: '11:30',
    title: 'Spectrometer Calibration',
    lab: 'PHYSICS',
    researcher: 'R. Mehta',
    status: 'SCHEDULED',
  },
  {
    id: 'EXP-027',
    time: '14:00',
    title: 'PCR Amplification',
    lab: 'BIOTECHNOLOGY',
    researcher: 'K. Singh',
    status: 'SCHEDULED',
  },
]

const deadlines = [
  {
    date: '22 SEP',
    title: 'Protein Assay Report',
    type: 'REPORT',
    code: 'EXP-021',
  },
  {
    date: '23 SEP',
    title: 'PCR Sample Analysis',
    type: 'ANALYSIS',
    code: 'EXP-027',
  },
  {
    date: '25 SEP',
    title: 'Spectrometer Maintenance',
    type: 'MAINTENANCE',
    code: 'EQ-018',
  },
]

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>LABSYNC</Text>
            <Text style={styles.headerSubtitle}>
              Laboratory Field Register
            </Text>
          </View>

          <TouchableOpacity style={styles.iconButton}>
            <Bell size={19} color={COLORS.ink} strokeWidth={1.8} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* GREETING */}
          <View style={styles.greetingSection}>
            <Text style={styles.eyebrow}>LABORATORY OVERVIEW</Text>

            <Text style={styles.greeting}>
              Good evening, Shriya.
            </Text>

            <Text style={styles.greetingNote}>
              Here is the current state of your laboratory records.
            </Text>
          </View>

          {/* SUMMARY */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>ACTIVE EXPERIMENTS</Text>
              <Text style={styles.statNote}>3 due today</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>28</Text>
              <Text style={styles.statLabel}>INDEXED SAMPLES</Text>
              <Text style={styles.statNote}>4 recently added</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>06</Text>
              <Text style={styles.statLabel}>EQUIPMENT IN USE</Text>
              <Text style={styles.statNote}>2 need attention</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>04</Text>
              <Text style={styles.statLabel}>ACTION ITEMS</Text>
              <Text style={styles.statNote}>Before end of day</Text>
            </View>
          </View>

          {/* TODAY'S RECORD */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>01 / DAILY LOG</Text>
              <Text style={styles.sectionTitle}>Today's Record</Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/experiments')}
            >
              <Text style={styles.viewAll}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeline}>
            {experiments.map((experiment, index) => (
              <TouchableOpacity
                key={experiment.id}
                style={styles.timelineRow}
                activeOpacity={0.75}
                onPress={() =>
                  router.push(`/experiments/${experiment.id}` as any)
                }
              >
                <View style={styles.timeColumn}>
                  <Text style={styles.time}>{experiment.time}</Text>

                  {index !== experiments.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                <View style={styles.experimentCard}>
                  <View style={styles.cardTop}>
                    <Text style={styles.experimentId}>
                      {experiment.id}
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        experiment.status === 'IN PROGRESS'
                          ? styles.activeBadge
                          : styles.scheduledBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          experiment.status === 'IN PROGRESS'
                            ? styles.activeStatusText
                            : styles.scheduledStatusText,
                        ]}
                      >
                        {experiment.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.experimentTitle}>
                    {experiment.title}
                  </Text>

                  <View style={styles.metadataRow}>
                    <Text style={styles.metadata}>
                      {experiment.lab}
                    </Text>

                    <View style={styles.metadataDot} />

                    <Text style={styles.metadata}>
                      {experiment.researcher}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* DEADLINES */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>02 / UPCOMING</Text>
              <Text style={styles.sectionTitle}>Deadlines</Text>
            </View>
          </View>

          <View style={styles.deadlineCard}>
            {deadlines.map((deadline, index) => (
              <View
                key={deadline.code}
                style={[
                  styles.deadlineRow,
                  index !== deadlines.length - 1 &&
                    styles.deadlineBorder,
                ]}
              >
                <View style={styles.dateBlock}>
                  <Text style={styles.dateText}>
                    {deadline.date.split(' ')[0]}
                  </Text>

                  <Text style={styles.monthText}>
                    {deadline.date.split(' ')[1]}
                  </Text>
                </View>

                <View style={styles.deadlineInfo}>
                  <Text style={styles.deadlineTitle}>
                    {deadline.title}
                  </Text>

                  <Text style={styles.deadlineMeta}>
                    {deadline.type} · {deadline.code}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ARCHIVAL NOTE */}
          <View style={styles.archiveNote}>
            <View style={styles.archiveIcon}>
              <ClipboardList
                size={18}
                color={COLORS.green}
                strokeWidth={1.7}
              />
            </View>

            <View style={styles.archiveContent}>
              <Text style={styles.archiveTitle}>
                Laboratory archive
              </Text>

              <Text style={styles.archiveText}>
                Records are indexed chronologically for traceability,
                reporting, and future reference.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>
          <NavItem
            icon={Home}
            label="Home"
            active
            onPress={() => router.replace('/')}
          />

          <NavItem
            icon={FlaskConical}
            label="Experiments"
            onPress={() => router.push('/experiments')}
          />

          <NavItem
            icon={Package}
            label="Samples"
            onPress={() => router.push('/samples')}
          />

          <NavItem
            icon={MoreHorizontal}
            label="More"
            onPress={() => router.push('/more')}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

function NavItem({
  icon: Icon,
  label,
  active = false,
  onPress,
}: {
  icon: any
  label: string
  active?: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.navIconContainer,
          active && styles.navIconActive,
        ]}
      >
        <Icon
          size={19}
          color={active ? COLORS.green : COLORS.muted}
          strokeWidth={active ? 2.2 : 1.7}
        />
      </View>

      <Text
        style={[
          styles.navLabel,
          active && styles.navLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    height: 72,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brand: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3.5,
    color: COLORS.ink,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 9,
    letterSpacing: 1.5,
    color: COLORS.green,
    fontWeight: '600',
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.brick,
    top: 8,
    right: 8,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 26,
  },

  greetingSection: {
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.8,
    color: COLORS.ochre,
    fontWeight: '700',
    marginBottom: 8,
  },

  greeting: {
    fontSize: 25,
    fontWeight: '600',
    color: COLORS.ink,
    letterSpacing: -0.4,
  },

  greetingNote: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },

  statCard: {
    width: '48.3%',
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    minHeight: 112,
  },

  statNumber: {
    fontSize: 25,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 7,
  },

  statLabel: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '700',
    color: COLORS.muted,
  },

  statNote: {
    marginTop: 7,
    fontSize: 9,
    color: COLORS.green,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sectionKicker: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: COLORS.ochre,
    fontWeight: '700',
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.ink,
  },

  viewAll: {
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: COLORS.green,
    paddingBottom: 3,
  },

  timeline: {
    marginBottom: 32,
  },

  timelineRow: {
    flexDirection: 'row',
    minHeight: 104,
  },

  timeColumn: {
    width: 52,
    alignItems: 'flex-start',
  },

  time: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: COLORS.muted,
    marginTop: 5,
  },

  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: COLORS.border,
    marginLeft: 16,
    marginTop: 8,
    marginBottom: -2,
  },

  experimentCard: {
    flex: 1,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  experimentId: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: COLORS.blue,
    letterSpacing: 0.5,
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  activeBadge: {
    backgroundColor: COLORS.softGreen,
  },

  scheduledBadge: {
    backgroundColor: '#EEECE5',
  },

  statusText: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.7,
  },

  activeStatusText: {
    color: COLORS.green,
  },

  scheduledStatusText: {
    color: COLORS.muted,
  },

  experimentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink,
    marginTop: 10,
  },

  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  metadata: {
    fontSize: 8,
    letterSpacing: 0.8,
    color: COLORS.muted,
  },

  metadataDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 7,
  },

  deadlineCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 28,
  },

  deadlineRow: {
    flexDirection: 'row',
    padding: 14,
    minHeight: 70,
  },

  deadlineBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  dateBlock: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    marginRight: 14,
  },

  dateText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
  },

  monthText: {
    fontSize: 7,
    letterSpacing: 1.2,
    color: COLORS.ochre,
    fontWeight: '700',
    marginTop: 2,
  },

  deadlineInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  deadlineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },

  deadlineMeta: {
    fontSize: 8,
    color: COLORS.muted,
    letterSpacing: 0.5,
    marginTop: 5,
  },

  archiveNote: {
    flexDirection: 'row',
    backgroundColor: COLORS.softGreen,
    borderWidth: 1,
    borderColor: '#C9DDD5',
    padding: 14,
    marginBottom: 10,
  },

  archiveIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  archiveContent: {
    flex: 1,
  },

  archiveTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
  },

  archiveText: {
    fontSize: 9,
    lineHeight: 14,
    color: COLORS.muted,
  },

  bottomSpace: {
    height: 20,
  },

  bottomNav: {
    height: 76,
    backgroundColor: COLORS.paper,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navIconContainer: {
    width: 40,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },

  navIconActive: {
    backgroundColor: COLORS.softGreen,
  },

  navLabel: {
    fontSize: 8,
    color: COLORS.muted,
    marginTop: 3,
    letterSpacing: 0.3,
  },

  navLabelActive: {
    color: COLORS.green,
    fontWeight: '700',
  },
})