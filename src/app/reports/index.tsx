
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

import {
  LabSyncColors as C,
  LabSyncRadius as R,
  LabSyncShadows as S,
  LabSyncSpacing as SP,
  LabSyncTypography as T,
} from '@/constants/labsync-theme'

const reportStats = [
  {
    value: '12',
    label: 'EXPERIMENTS',
    icon: BarChart3,
    color: C.primary,
    background: C.primaryLight,
  },
  {
    value: '28',
    label: 'SAMPLES',
    icon: FileText,
    color: C.secondary,
    background: C.secondaryLight,
  },
  {
    value: '31',
    label: 'MATERIALS',
    icon: Package,
    color: C.accent,
    background: C.accentLight,
  },
  {
    value: '06',
    label: 'EQUIPMENT',
    icon: Wrench,
    color: C.primary,
    background: C.primaryLight,
  },
]

const reportSections = [
  {
    number: '01',
    title: 'Experiment Activity',
    description: 'Experiments conducted and completed during the month.',
    icon: BarChart3,
  },
  {
    number: '02',
    title: 'Sample Register',
    description: 'Samples added, processed and archived.',
    icon: FileText,
  },
  {
    number: '03',
    title: 'Material Inventory',
    description: 'Material usage, stock levels and procurement.',
    icon: Package,
  },
  {
    number: '04',
    title: 'Equipment Activity',
    description: 'Equipment usage and maintenance records.',
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
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={19} color={C.ink} strokeWidth={1.8} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>LABORATORY INSIGHTS</Text>
            <Text style={styles.title}>Reports</Text>
            <Text style={styles.subtitle}>
              Your monthly laboratory overview.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <FileSpreadsheet size={20} color={C.primary} />
          </View>
        </View>

        {/* REPORT PERIOD */}
        <View style={styles.periodCard}>
          <View style={styles.periodTop}>
            <Text style={styles.periodEyebrow}>CURRENT REPORT</Text>
            <View style={styles.currentBadge}>
              <View style={styles.currentDot} />
              <Text style={styles.currentText}>MONTHLY</Text>
            </View>
          </View>

          <View style={styles.periodMain}>
            <View style={styles.calendarIcon}>
              <CalendarDays size={23} color={C.primary} strokeWidth={1.8} />
            </View>

            <View style={styles.periodInfo}>
              <Text style={styles.periodTitle}>September 2026</Text>
              <Text style={styles.periodDate}>01 SEP — 30 SEP 2026</Text>
            </View>

            <ChevronRight size={19} color={C.muted} />
          </View>

          <View style={styles.periodFooter}>
            <Text style={styles.periodFooterText}>
              LABORATORY REPORTING PERIOD
            </Text>
            <Text style={styles.periodFooterText}>30 DAYS</Text>
          </View>
        </View>

        {/* SUMMARY */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>AT A GLANCE</Text>
            <Text style={styles.sectionTitle}>Monthly summary</Text>
          </View>
          <View style={styles.sectionIcon}>
            <BarChart3 size={18} color={C.primary} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          {reportStats.map((stat) => {
            const Icon = stat.icon

            return (
              <View key={stat.label} style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: stat.background },
                  ]}
                >
                  <Icon size={18} color={stat.color} strokeWidth={1.8} />
                </View>

                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            )
          })}
        </View>

        {/* REPORT CONTENT */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>REPORT BREAKDOWN</Text>
            <Text style={styles.sectionTitle}>What's included</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>04</Text>
          </View>
        </View>

        <View style={styles.contentCard}>
          {reportSections.map((section, index) => {
            const Icon = section.icon

            return (
              <View key={section.number}>
                <View style={styles.reportRow}>
                  <View style={styles.rowNumberContainer}>
                    <Text style={styles.rowNumber}>{section.number}</Text>
                  </View>

                  <View style={styles.rowIcon}>
                    <Icon size={17} color={C.primary} strokeWidth={1.7} />
                  </View>

                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>{section.title}</Text>
                    <Text style={styles.rowDescription}>
                      {section.description}
                    </Text>
                  </View>

                  <ChevronRight size={17} color={C.subtle} />
                </View>

                {index !== reportSections.length - 1 && (
                  <View style={styles.rowDivider} />
                )}
              </View>
            )
          })}
        </View>

        {/* EXPORT */}
        <View style={styles.exportCard}>
          <View style={styles.exportTop}>
            <View style={styles.exportIcon}>
              <FileSpreadsheet size={22} color={C.primary} />
            </View>

            <View style={styles.exportBadge}>
              <Text style={styles.exportBadgeText}>XLS FORMAT</Text>
            </View>
          </View>

          <Text style={styles.exportTitle}>Monthly inventory report</Text>

          <Text style={styles.exportDescription}>
            Complete laboratory records in an Excel-compatible spreadsheet.
          </Text>

          <TouchableOpacity
            style={styles.downloadButton}
            activeOpacity={0.8}
            accessibilityLabel="Download monthly inventory report"
          >
            <Download size={17} color={C.white} strokeWidth={2} />
            <Text style={styles.downloadButtonText}>Download report</Text>
          </TouchableOpacity>

          <Text style={styles.exportFootnote}>
            Export functionality will be connected separately.
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>
            LABSYNC · LABORATORY FIELD REGISTER · SEP 2026
          </Text>
          <View style={styles.footerLine} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    paddingHorizontal: SP.lg,
    paddingTop: SP.sm,
    paddingBottom: SP.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SP.xl,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: SP.md,
  },
  eyebrow: {
    color: C.accent,
    fontSize: T.eyebrow,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: C.ink,
    fontSize: T.heading1,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    color: C.muted,
    fontSize: T.bodySmall,
    marginTop: 3,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: SP.lg,
    ...S.card,
  },
  periodTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodEyebrow: {
    color: C.muted,
    fontSize: T.eyebrow,
    fontWeight: '800',
    letterSpacing: 1,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: R.pill,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: R.pill,
    backgroundColor: C.success,
  },
  currentText: {
    color: C.success,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  periodMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SP.lg,
  },
  calendarIcon: {
    width: 48,
    height: 48,
    borderRadius: R.lg,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodInfo: {
    flex: 1,
    marginLeft: SP.md,
  },
  periodTitle: {
    color: C.ink,
    fontSize: T.heading2,
    fontWeight: '800',
  },
  periodDate: {
    color: C.secondary,
    fontSize: T.caption,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 5,
  },
  periodFooter: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    marginTop: SP.lg,
    paddingTop: SP.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodFooterText: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SP.xl,
    marginBottom: SP.md,
  },
  sectionEyebrow: {
    color: C.accent,
    fontSize: T.eyebrow,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  sectionTitle: {
    color: C.ink,
    fontSize: T.heading2,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: R.md,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SP.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: SP.md,
    ...S.card,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: C.ink,
    fontSize: 27,
    fontWeight: '800',
    marginTop: SP.md,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 3,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 9,
    borderRadius: R.pill,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: C.primary,
    fontSize: T.bodySmall,
    fontWeight: '800',
  },
  contentCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    paddingHorizontal: SP.md,
    ...S.card,
  },
  reportRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SP.sm,
  },
  rowNumberContainer: {
    width: 27,
  },
  rowNumber: {
    color: C.accent,
    fontSize: T.bodySmall,
    fontWeight: '800',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: R.md,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SP.sm,
  },
  rowInfo: {
    flex: 1,
    paddingRight: SP.sm,
  },
  rowTitle: {
    color: C.ink,
    fontSize: T.body,
    fontWeight: '800',
  },
  rowDescription: {
    color: C.muted,
    fontSize: T.caption,
    lineHeight: 17,
    marginTop: 4,
  },
  rowDivider: {
    height: 1,
    backgroundColor: C.divider,
  },
  exportCard: {
    marginTop: SP.xl,
    backgroundColor: C.primaryLight,
    borderRadius: R.xl,
    padding: SP.lg,
  },
  exportTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exportIcon: {
    width: 46,
    height: 46,
    borderRadius: R.lg,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBadge: {
    backgroundColor: C.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: R.pill,
  },
  exportBadgeText: {
    color: C.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  exportTitle: {
    color: C.ink,
    fontSize: T.heading3,
    fontWeight: '800',
    marginTop: SP.md,
  },
  exportDescription: {
    color: C.text,
    fontSize: T.bodySmall,
    lineHeight: 19,
    marginTop: SP.xs,
  },
  downloadButton: {
    height: 46,
    borderRadius: R.lg,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SP.sm,
    marginTop: SP.lg,
  },
  downloadButtonText: {
    color: C.white,
    fontSize: T.bodySmall,
    fontWeight: '800',
  },
  exportFootnote: {
    color: C.muted,
    fontSize: T.caption,
    textAlign: 'center',
    marginTop: SP.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
    marginTop: SP.xxl,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  footerText: {
    color: C.subtle,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
})
