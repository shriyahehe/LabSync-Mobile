import { router } from 'expo-router'
import {
    ArrowLeft,
    Beaker,
    ChevronRight,
    Filter,
    Plus,
    Search,
} from 'lucide-react-native'
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
  border: '#D8DDD8',
}

const experiments = [
  {
    id: 'EXP-027',
    title: 'PCR Amplification',
    lab: 'BIOTECHNOLOGY',
    researcher: 'K. Singh',
    date: '02 OCT',
    status: 'SCHEDULED',
  },
  {
    id: 'EXP-024',
    title: 'Protein Purification',
    lab: 'BIOCHEMISTRY',
    researcher: 'A. Sharma',
    date: '02 OCT',
    status: 'IN PROGRESS',
  },
  {
    id: 'EXP-021',
    title: 'Protein Assay',
    lab: 'BIOCHEMISTRY',
    researcher: 'N. Verma',
    date: '01 OCT',
    status: 'COMPLETED',
  },
  {
    id: 'EXP-018',
    title: 'Spectrometer Calibration',
    lab: 'PHYSICS',
    researcher: 'R. Mehta',
    date: '30 SEP',
    status: 'COMPLETED',
  },
  {
    id: 'EXP-014',
    title: 'Polymer Characterisation',
    lab: 'MATERIALS',
    researcher: 'S. Rao',
    date: '29 SEP',
    status: 'COMPLETED',
  },
]

export default function ExperimentsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
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
              <Text style={styles.eyebrow}>LABORATORY RECORD</Text>
              <Text style={styles.title}>Experiments</Text>
            </View>

            <TouchableOpacity style={styles.addButton}>
              <Plus
                size={20}
                color="#FFFFFF"
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rule} />

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Search
                size={17}
                color={COLORS.muted}
                strokeWidth={1.7}
              />

              <TextInput
                placeholder="Search experiments..."
                placeholderTextColor={COLORS.muted}
                style={styles.searchInput}
              />
            </View>

            <TouchableOpacity style={styles.filterButton}>
              <Filter
                size={18}
                color={COLORS.green}
                strokeWidth={1.7}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.summary}>
            <View>
              <Text style={styles.summaryNumber}>12</Text>
              <Text style={styles.summaryLabel}>ACTIVE RECORDS</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View>
              <Text style={styles.summaryNumber}>03</Text>
              <Text style={styles.summaryLabel}>DUE TODAY</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View>
              <Text style={styles.summaryNumber}>47</Text>
              <Text style={styles.summaryLabel}>TOTAL THIS MONTH</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>01</Text>
            <Text style={styles.sectionTitle}>EXPERIMENT REGISTER</Text>
          </View>

          <View style={styles.list}>
            {experiments.map((experiment) => (
              <TouchableOpacity
                key={experiment.id}
                style={styles.card}
                onPress={() =>
                  router.push(
                    `/experiments/${experiment.id}` as any
                  )
                }
              >
                <View style={styles.cardHeader}>
                  <View style={styles.idRow}>
                    <Beaker
                      size={15}
                      color={COLORS.green}
                      strokeWidth={1.7}
                    />

                    <Text style={styles.experimentId}>
                      {experiment.id}
                    </Text>
                  </View>

                  <Text style={styles.date}>
                    {experiment.date}
                  </Text>
                </View>

                <Text style={styles.experimentTitle}>
                  {experiment.title}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.lab}>
                    {experiment.lab}
                  </Text>

                  <Text style={styles.researcher}>
                    {experiment.researcher}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.status,
                      experiment.status === 'IN PROGRESS' &&
                        styles.statusProgress,
                      experiment.status === 'SCHEDULED' &&
                        styles.statusScheduled,
                      experiment.status === 'COMPLETED' &&
                        styles.statusCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        experiment.status === 'IN PROGRESS' &&
                          styles.progressText,
                        experiment.status === 'SCHEDULED' &&
                          styles.scheduledText,
                        experiment.status === 'COMPLETED' &&
                          styles.completedText,
                      ]}
                    >
                      {experiment.status}
                    </Text>
                  </View>

                  <ChevronRight
                    size={17}
                    color={COLORS.muted}
                    strokeWidth={1.6}
                  />
                </View>
              </TouchableOpacity>
            ))}
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
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
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

  title: {
    color: COLORS.ink,
    fontSize: 27,
    fontWeight: '700',
    marginTop: 2,
  },

  addButton: {
    width: 38,
    height: 38,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },

  rule: {
    height: 1,
    backgroundColor: COLORS.ink,
    opacity: 0.15,
    marginTop: 15,
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },

  searchBox: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: COLORS.ink,
    fontSize: 12,
  },

  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.softGreen,
    marginTop: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 4,
  },

  summaryNumber: {
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: '700',
  },

  summaryLabel: {
    color: COLORS.green,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 3,
  },

  summaryDivider: {
    height: 30,
    width: 1,
    backgroundColor: '#B9CCC4',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 27,
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

  list: {
    gap: 9,
  },

  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 14,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  experimentId: {
    color: COLORS.blue,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  date: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '700',
  },

  experimentTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 9,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  lab: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  researcher: {
    color: COLORS.muted,
    fontSize: 9,
    marginLeft: 10,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 13,
  },

  status: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 3,
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
    letterSpacing: 0.6,
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
})
