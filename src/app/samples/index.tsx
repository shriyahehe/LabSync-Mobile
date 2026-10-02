import { router } from 'expo-router'
import {
    ArrowLeft,
    ChevronRight,
    FlaskConical,
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

const samples = [
  {
    id: 'SMP-118',
    name: 'Genomic DNA',
    lab: 'BIOTECHNOLOGY',
    experiment: 'EXP-027',
    status: 'ACTIVE',
  },
  {
    id: 'SMP-114',
    name: 'Protein Extract',
    lab: 'BIOCHEMISTRY',
    experiment: 'EXP-024',
    status: 'ACTIVE',
  },
  {
    id: 'SMP-109',
    name: 'Protein Fraction',
    lab: 'BIOCHEMISTRY',
    experiment: 'EXP-021',
    status: 'ARCHIVED',
  },
  {
    id: 'SMP-097',
    name: 'Polymer Batch',
    lab: 'MATERIALS',
    experiment: 'EXP-014',
    status: 'ARCHIVED',
  },
]

export default function SamplesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.eyebrow}>LABORATORY INDEX</Text>

            <Text style={styles.title}>Samples</Text>
          </View>

          <TouchableOpacity style={styles.addButton}>
            <Plus
              size={19}
              color="#FFFFFF"
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRule} />

        {/* SEARCH */}

        <View style={styles.searchBox}>
          <Search
            size={17}
            color={COLORS.muted}
            strokeWidth={1.7}
          />

          <TextInput
            placeholder="Search sample ID or name..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
          />
        </View>

        {/* SUMMARY */}

        <View style={styles.summary}>
          <Text style={styles.summaryNumber}>28</Text>

          <View>
            <Text style={styles.summaryTitle}>
              INDEXED SAMPLES
            </Text>

            <Text style={styles.summaryText}>
              4 added recently
            </Text>
          </View>
        </View>

        {/* REGISTER */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>01</Text>

          <Text style={styles.sectionTitle}>
            SAMPLE REGISTER
          </Text>
        </View>

        <View style={styles.list}>
          {samples.map((sample) => (
            <TouchableOpacity
              key={sample.id}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <View style={styles.idRow}>
                  <FlaskConical
                    size={16}
                    color={COLORS.green}
                    strokeWidth={1.6}
                  />

                  <Text style={styles.sampleId}>
                    {sample.id}
                  </Text>
                </View>

                <ChevronRight
                  size={17}
                  color={COLORS.muted}
                  strokeWidth={1.6}
                />
              </View>

              <Text style={styles.sampleName}>
                {sample.name}
              </Text>

              <Text style={styles.lab}>
                {sample.lab}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.experiment}>
                  {sample.experiment}
                </Text>

                <View
                  style={[
                    styles.status,
                    sample.status === 'ACTIVE'
                      ? styles.activeStatus
                      : styles.archivedStatus,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      sample.status === 'ACTIVE'
                        ? styles.activeText
                        : styles.archivedText,
                    ]}
                  >
                    {sample.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ARCHIVAL NOTE */}

        <View style={styles.archiveNote}>
          <FlaskConical
            size={19}
            color={COLORS.green}
            strokeWidth={1.6}
          />

          <View style={styles.archiveText}>
            <Text style={styles.archiveTitle}>
              SAMPLE INDEX
            </Text>

            <Text style={styles.archiveDescription}>
              Samples remain linked to their originating
              experiment and laboratory.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.paper,
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

  title: {
    color: COLORS.ink,
    fontSize: 27,
    fontWeight: '700',
    marginTop: 2,
  },

  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerRule: {
    height: 1,
    backgroundColor: COLORS.ink,
    opacity: 0.15,
    marginVertical: 16,
  },

  searchBox: {
    height: 44,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: COLORS.ink,
    fontSize: 12,
  },

  summary: {
    marginTop: 16,
    backgroundColor: COLORS.softGreen,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
  },

  summaryNumber: {
    color: COLORS.ink,
    fontSize: 30,
    fontWeight: '700',
    marginRight: 13,
  },

  summaryTitle: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  summaryText: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
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

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  sampleId: {
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  sampleName: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 9,
  },

  lab: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 6,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 13,
  },

  experiment: {
    color: COLORS.muted,
    fontSize: 9,
  },

  status: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 3,
  },

  activeStatus: {
    backgroundColor: COLORS.softGreen,
  },

  archivedStatus: {
    backgroundColor: '#E7ECEC',
  },

  statusText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  activeText: {
    color: COLORS.green,
  },

  archivedText: {
    color: COLORS.blue,
  },

  archiveNote: {
    marginTop: 24,
    padding: 14,
    backgroundColor: COLORS.softGreen,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
  },

  archiveText: {
    flex: 1,
    marginLeft: 10,
  },

  archiveTitle: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  archiveDescription: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
})