import { router } from 'expo-router'
import {
    ArrowLeft,
    BarChart3,
    CalendarDays,
    ChevronRight,
    Download,
    FileSpreadsheet,
    FileText,
    Package,
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

const reportStats = [
  {
    value: '12',
    label: 'EXPERIMENTS',
    icon: BarChart3,
  },
  {
    value: '28',
    label: 'SAMPLES',
    icon: FileText,
  },
  {
    value: '31',
    label: 'MATERIALS',
    icon: Package,
  },
  {
    value: '06',
    label: 'EQUIPMENT',
    icon: Wrench,
  },
]

export default function ReportsScreen() {
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
            <Text style={styles.eyebrow}>
              ARCHIVAL RECORDS
            </Text>

            <Text style={styles.title}>Monthly Report</Text>
          </View>

          <View style={styles.headerIcon}>
            <FileSpreadsheet
              size={19}
              color={COLORS.green}
              strokeWidth={1.6}
            />
          </View>
        </View>

        <View style={styles.rule} />

        {/* REPORT PERIOD */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>01</Text>

          <Text style={styles.sectionTitle}>
            REPORT PERIOD
          </Text>
        </View>

        <View style={styles.periodCard}>
          <View style={styles.calendarIcon}>
            <CalendarDays
              size={21}
              color={COLORS.green}
              strokeWidth={1.6}
            />
          </View>

          <View style={styles.periodInfo}>
            <Text style={styles.periodLabel}>
              CURRENT REPORT
            </Text>

            <Text style={styles.periodTitle}>
              September 2026
            </Text>

            <Text style={styles.periodText}>
              01 SEP — 30 SEP 2026
            </Text>
          </View>

          <ChevronRight
            size={18}
            color={COLORS.muted}
            strokeWidth={1.6}
          />
        </View>

        {/* SUMMARY */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>02</Text>

          <Text style={styles.sectionTitle}>
            MONTHLY SUMMARY
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {reportStats.map((stat) => {
            const Icon = stat.icon

            return (
              <View key={stat.label} style={styles.statCard}>
                <Icon
                  size={18}
                  color={COLORS.green}
                  strokeWidth={1.6}
                />

                <Text style={styles.statValue}>
                  {stat.value}
                </Text>

                <Text style={styles.statLabel}>
                  {stat.label}
                </Text>
              </View>
            )
          })}
        </View>

        {/* REPORT SECTIONS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>03</Text>

          <Text style={styles.sectionTitle}>
            REPORT CONTENT
          </Text>
        </View>

        <View style={styles.contentCard}>
          <ReportRow
            number="01"
            title="Experiment Activity"
            description="Experiments conducted and completed during the month."
          />

          <View style={styles.rowDivider} />

          <ReportRow
            number="02"
            title="Sample Register"
            description="Samples added, processed and archived."
          />

          <View style={styles.rowDivider} />

          <ReportRow
            number="03"
            title="Material Inventory"
            description="Material usage, stock levels and procurement."
          />

          <View style={styles.rowDivider} />

          <ReportRow
            number="04"
            title="Equipment Activity"
            description="Equipment usage and maintenance records."
          />
        </View>

        {/* DOWNLOAD */}

        <View style={styles.downloadCard}>
          <View style={styles.downloadIcon}>
            <FileSpreadsheet
              size={22}
              color={COLORS.green}
              strokeWidth={1.6}
            />
          </View>

          <View style={styles.downloadInfo}>
            <Text style={styles.downloadTitle}>
              MONTHLY INVENTORY REPORT
            </Text>

            <Text style={styles.downloadText}>
              Download the complete laboratory record as an
              Excel-compatible spreadsheet.
            </Text>
          </View>

          <TouchableOpacity style={styles.downloadButton}>
            <Download
              size={17}
              color={COLORS.white}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          LABSYNC · LABORATORY FIELD REGISTER · SEP 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function ReportRow({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <View style={styles.reportRow}>
      <Text style={styles.rowNumber}>{number}</Text>

      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>

        <Text style={styles.rowDescription}>
          {description}
        </Text>
      </View>

      <ChevronRight
        size={17}
        color={COLORS.muted}
        strokeWidth={1.6}
      />
    </View>
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
    letterSpacing: 1.3,
  },

  title: {
    color: COLORS.ink,
    fontSize: 27,
    fontWeight: '700',
    marginTop: 2,
  },

  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rule: {
    height: 1,
    backgroundColor: COLORS.ink,
    opacity: 0.15,
    marginVertical: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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

  periodCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  calendarIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: COLORS.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  periodInfo: {
    flex: 1,
    marginLeft: 12,
  },

  periodLabel: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },

  periodTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 3,
  },

  periodText: {
    color: COLORS.blue,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 3,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  statCard: {
    width: '48%',
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 14,
  },

  statValue: {
    color: COLORS.ink,
    fontSize: 25,
    fontWeight: '700',
    marginTop: 10,
  },

  statLabel: {
    color: COLORS.green,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },

  contentCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 14,
  },

  reportRow: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowNumber: {
    color: COLORS.ochre,
    fontSize: 9,
    fontWeight: '800',
    width: 28,
  },

  rowInfo: {
    flex: 1,
    paddingRight: 10,
  },

  rowTitle: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '700',
  },

  rowDescription: {
    color: COLORS.muted,
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },

  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  downloadCard: {
    marginTop: 24,
    backgroundColor: COLORS.softGreen,
    borderRadius: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  downloadIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },

  downloadInfo: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  downloadTitle: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  downloadText: {
    color: COLORS.muted,
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },

  downloadButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerNote: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginTop: 28,
  },
})