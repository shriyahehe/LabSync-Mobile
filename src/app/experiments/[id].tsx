import { router, useLocalSearchParams } from 'expo-router'
import {
    ArrowLeft,
    Beaker,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    FlaskConical,
    User,
    Wrench,
} from 'lucide-react-native'
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

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

const experimentData: Record<
  string,
  {
    title: string
    lab: string
    researcher: string
    date: string
    time: string
    status: string
    objective: string
    sample: string
    equipment: string
  }
> = {
  'EXP-027': {
    title: 'PCR Amplification',
    lab: 'BIOTECHNOLOGY',
    researcher: 'K. Singh',
    date: '02 OCT 2026',
    time: '14:00',
    status: 'SCHEDULED',
    objective:
      'Amplification of the selected DNA target using polymerase chain reaction.',
    sample: 'SMP-118 — Genomic DNA',
    equipment: 'Thermal Cycler — EQ-014',
  },

  'EXP-024': {
    title: 'Protein Purification',
    lab: 'BIOCHEMISTRY',
    researcher: 'A. Sharma',
    date: '02 OCT 2026',
    time: '09:00',
    status: 'IN PROGRESS',
    objective:
      'Purification and preparation of the target protein fraction for downstream analysis.',
    sample: 'SMP-114 — Protein Extract',
    equipment: 'Centrifuge — EQ-006',
  },

  'EXP-021': {
    title: 'Protein Assay',
    lab: 'BIOCHEMISTRY',
    researcher: 'N. Verma',
    date: '01 OCT 2026',
    time: '15:30',
    status: 'COMPLETED',
    objective:
      'Quantification of protein concentration using the selected assay protocol.',
    sample: 'SMP-109 — Protein Fraction',
    equipment: 'Spectrophotometer — EQ-018',
  },

  'EXP-018': {
    title: 'Spectrometer Calibration',
    lab: 'PHYSICS',
    researcher: 'R. Mehta',
    date: '30 SEP 2026',
    time: '11:30',
    status: 'COMPLETED',
    objective:
      'Calibration of the spectrometer against the laboratory reference standard.',
    sample: 'REF-042 — Calibration Standard',
    equipment: 'Spectrometer — EQ-018',
  },

  'EXP-014': {
    title: 'Polymer Characterisation',
    lab: 'MATERIALS',
    researcher: 'S. Rao',
    date: '29 SEP 2026',
    time: '10:00',
    status: 'COMPLETED',
    objective:
      'Characterisation of the prepared polymer sample using laboratory instrumentation.',
    sample: 'SMP-097 — Polymer Batch',
    equipment: 'Materials Analyser — EQ-011',
  },
}

export default function ExperimentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const experiment = experimentData[id ?? 'EXP-027'] ?? {
    title: 'Experiment Record',
    lab: 'LABORATORY',
    researcher: 'Unknown',
    date: '--',
    time: '--',
    status: 'RECORD',
    objective: 'No experiment information has been entered yet.',
    sample: 'Not assigned',
    equipment: 'Not assigned',
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft
                size={19}
                color={COLORS.ink}
                strokeWidth={1.8}
              />
            </TouchableOpacity>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>EXPERIMENT RECORD</Text>

              <Text style={styles.recordId}>{id}</Text>
            </View>

            <View style={styles.beakerIcon}>
              <Beaker
                size={20}
                color={COLORS.green}
                strokeWidth={1.6}
              />
            </View>
          </View>

          <View style={styles.rule} />

          {/* TITLE */}

          <View style={styles.titleBlock}>
            <Text style={styles.lab}>{experiment.lab}</Text>

            <Text style={styles.title}>{experiment.title}</Text>

            <View
              style={[
                styles.status,
                experiment.status === 'IN PROGRESS'
                  ? styles.statusProgress
                  : experiment.status === 'COMPLETED'
                    ? styles.statusCompleted
                    : styles.statusScheduled,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  experiment.status === 'IN PROGRESS'
                    ? styles.progressText
                    : experiment.status === 'COMPLETED'
                      ? styles.completedText
                      : styles.scheduledText,
                ]}
              >
                {experiment.status}
              </Text>
            </View>
          </View>

          {/* RECORD METADATA */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>01</Text>

            <Text style={styles.sectionTitle}>
              RECORD INFORMATION
            </Text>
          </View>

          <View style={styles.metadataCard}>
            <View style={styles.metaItem}>
              <CalendarDays
                size={17}
                color={COLORS.green}
                strokeWidth={1.7}
              />

              <View style={styles.metaText}>
                <Text style={styles.metaLabel}>DATE</Text>
                <Text style={styles.metaValue}>
                  {experiment.date}
                </Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Clock3
                size={17}
                color={COLORS.ochre}
                strokeWidth={1.7}
              />

              <View style={styles.metaText}>
                <Text style={styles.metaLabel}>SCHEDULED TIME</Text>
                <Text style={styles.metaValue}>
                  {experiment.time}
                </Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <User
                size={17}
                color={COLORS.blue}
                strokeWidth={1.7}
              />

              <View style={styles.metaText}>
                <Text style={styles.metaLabel}>RESEARCHER</Text>
                <Text style={styles.metaValue}>
                  {experiment.researcher}
                </Text>
              </View>
            </View>
          </View>

          {/* OBJECTIVE */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>02</Text>

            <Text style={styles.sectionTitle}>OBJECTIVE</Text>
          </View>

          <View style={styles.objectiveCard}>
            <Text style={styles.objectiveText}>
              {experiment.objective}
            </Text>
          </View>

          {/* SAMPLE + EQUIPMENT */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>03</Text>

            <Text style={styles.sectionTitle}>
              LINKED RECORDS
            </Text>
          </View>

          <View style={styles.linkedCard}>
            <View style={styles.linkedRow}>
              <View style={styles.linkedIcon}>
                <FlaskConical
                  size={18}
                  color={COLORS.green}
                  strokeWidth={1.6}
                />
              </View>

              <View style={styles.linkedInfo}>
                <Text style={styles.linkedLabel}>SAMPLE</Text>

                <Text style={styles.linkedValue}>
                  {experiment.sample}
                </Text>
              </View>
            </View>

            <View style={styles.linkedDivider} />

            <View style={styles.linkedRow}>
              <View style={styles.linkedIcon}>
                <Wrench
                  size={18}
                  color={COLORS.ochre}
                  strokeWidth={1.6}
                />
              </View>

              <View style={styles.linkedInfo}>
                <Text style={styles.linkedLabel}>EQUIPMENT</Text>

                <Text style={styles.linkedValue}>
                  {experiment.equipment}
                </Text>
              </View>
            </View>
          </View>

          {/* OBSERVATIONS */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>04</Text>

            <Text style={styles.sectionTitle}>OBSERVATIONS</Text>
          </View>

          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <FileText
                size={20}
                color={COLORS.muted}
                strokeWidth={1.5}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No observations recorded
            </Text>

            <Text style={styles.emptyText}>
              Experimental notes and observations will appear here
              once entered.
            </Text>
          </View>

          {/* ARCHIVAL STATUS */}

          <View style={styles.archiveCard}>
            <CheckCircle2
              size={19}
              color={COLORS.green}
              strokeWidth={1.7}
            />

            <View style={styles.archiveInfo}>
              <Text style={styles.archiveTitle}>
                RECORD INDEXED
              </Text>

              <Text style={styles.archiveText}>
                This experiment is linked to its sample,
                equipment and laboratory.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.paper,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  eyebrow: {
    color: COLORS.ochre,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  recordId: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 3,
  },

  beakerIcon: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.paper,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rule: {
    height: 1,
    backgroundColor: COLORS.ink,
    opacity: 0.15,
    marginTop: 15,
  },

  titleBlock: {
    paddingTop: 25,
    paddingBottom: 25,
  },

  lab: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  title: {
    color: COLORS.ink,
    fontSize: 29,
    fontWeight: '700',
    lineHeight: 35,
    marginTop: 7,
  },

  status: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 3,
    marginTop: 12,
  },

  statusProgress: {
    backgroundColor: COLORS.softGreen,
  },

  statusScheduled: {
    backgroundColor: '#EEEDE7',
  },

  statusCompleted: {
    backgroundColor: '#E7ECEC',
  },

  statusText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  progressText: {
    color: COLORS.green,
  },

  scheduledText: {
    color: COLORS.ochre,
  },

  completedText: {
    color: COLORS.blue,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },

  sectionNumber: {
    color: COLORS.ochre,
    fontSize: 10,
    fontWeight: '800',
    marginRight: 8,
  },

  sectionTitle: {
    color: COLORS.ink,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  metadataCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 14,
    gap: 17,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaText: {
    marginLeft: 12,
  },

  metaLabel: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },

  metaValue: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },

  objectiveCard: {
    backgroundColor: COLORS.paper,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.green,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },

  objectiveText: {
    color: COLORS.ink,
    fontSize: 14,
    lineHeight: 22,
  },

  linkedCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 14,
  },

  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  linkedIcon: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.softGreen,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  linkedInfo: {
    flex: 1,
    marginLeft: 12,
  },

  linkedLabel: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },

  linkedValue: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  linkedDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  emptyCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 20,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECEDEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 15,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 5,
  },

  archiveCard: {
    marginTop: 24,
    padding: 14,
    backgroundColor: COLORS.softGreen,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
  },

  archiveInfo: {
    flex: 1,
    marginLeft: 10,
  },

  archiveTitle: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  archiveText: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
})