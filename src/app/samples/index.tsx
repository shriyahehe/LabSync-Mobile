
import { router } from 'expo-router'
import {
  ArrowLeft,
  ChevronRight,
  FlaskConical,
  Plus,
  Search,
} from 'lucide-react-native'
import { useMemo, useState } from 'react'
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

type Sample = {
  id: string
  name: string
  lab: string
  experiment: string
  status: 'ACTIVE' | 'ARCHIVED'
}

type Filter = 'ALL' | 'ACTIVE' | 'ARCHIVED'

const samples: Sample[] = [
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
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')

  const filteredSamples = useMemo(() => {
    const query = search.trim().toLowerCase()

    return samples.filter((sample) => {
      const matchesFilter =
        filter === 'ALL' || sample.status === filter

      const matchesSearch =
        !query ||
        [
          sample.id,
          sample.name,
          sample.lab,
          sample.experiment,
          sample.status,
        ].some((value) => value.toLowerCase().includes(query))

      return matchesFilter && matchesSearch
    })
  }, [search, filter])

  const activeCount = samples.filter(
    (sample) => sample.status === 'ACTIVE',
  ).length

  const archivedCount = samples.filter(
    (sample) => sample.status === 'ARCHIVED',
  ).length

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.eyebrow}>LABORATORY INDEX</Text>
            <Text style={styles.title}>Samples</Text>
            <Text style={styles.subtitle}>
              Your research sample collection.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            accessibilityLabel="Add sample"
            activeOpacity={0.8}
          >
            <Plus size={21} color={C.white} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* OVERVIEW */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View>
              <Text style={styles.overviewEyebrow}>SAMPLE COLLECTION</Text>
              <Text style={styles.overviewTitle}>Indexed samples</Text>
            </View>

            <View style={styles.overviewIcon}>
              <FlaskConical size={21} color={C.primary} />
            </View>
          </View>

          <View style={styles.overviewMain}>
            <Text style={styles.overviewNumber}>28</Text>
            <View style={styles.overviewInfo}>
              <Text style={styles.overviewLabel}>TOTAL SAMPLES</Text>
              <Text style={styles.overviewDescription}>
                4 added recently
              </Text>
            </View>
          </View>

          <View style={styles.overviewFooter}>
            <View style={styles.miniStat}>
              <View style={[styles.miniDot, { backgroundColor: C.primary }]} />
              <Text style={styles.miniStatText}>
                {String(activeCount).padStart(2, '0')} Active
              </Text>
            </View>

            <View style={styles.miniStat}>
              <View style={[styles.miniDot, { backgroundColor: C.secondary }]} />
              <Text style={styles.miniStatText}>
                {String(archivedCount).padStart(2, '0')} Archived
              </Text>
            </View>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Search size={18} color={C.muted} strokeWidth={1.8} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search sample ID, name or lab..."
            placeholderTextColor={C.subtle}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {/* REGISTER HEADER */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>RESEARCH COLLECTION</Text>
            <Text style={styles.sectionTitle}>Sample register</Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {filteredSamples.length}
            </Text>
          </View>
        </View>

        {/* FILTERS */}
        <View style={styles.filterRow}>
          {([
            { label: 'All samples', value: 'ALL' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Archived', value: 'ARCHIVED' },
          ] as const).map((item) => {
            const selected = filter === item.value

            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setFilter(item.value)}
                style={[
                  styles.filterButton,
                  selected && styles.filterButtonActive,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* SAMPLE LIST */}
        <View style={styles.list}>
          {filteredSamples.map((sample) => {
            const isActive = sample.status === 'ACTIVE'

            return (
              <TouchableOpacity
                key={sample.id}
                style={styles.card}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={styles.sampleIdRow}>
                    <View style={styles.sampleIcon}>
                      <FlaskConical
                        size={18}
                        color={C.primary}
                        strokeWidth={1.8}
                      />
                    </View>

                    <Text style={styles.sampleId}>{sample.id}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isActive
                          ? C.successLight
                          : C.secondaryLight,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: isActive
                            ? C.success
                            : C.secondary,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: isActive
                            ? C.success
                            : C.secondary,
                        },
                      ]}
                    >
                      {sample.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sampleName}>{sample.name}</Text>

                <View style={styles.labRow}>
                  <View style={styles.labDot} />
                  <Text style={styles.labText}>{sample.lab}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.experimentLabel}>
                      LINKED EXPERIMENT
                    </Text>
                    <Text style={styles.experimentId}>
                      {sample.experiment}
                    </Text>
                  </View>

                  <View style={styles.detailsLink}>
                    <Text style={styles.detailsText}>Details</Text>
                    <ChevronRight size={16} color={C.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}

          {filteredSamples.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <FlaskConical size={24} color={C.muted} />
              </View>

              <Text style={styles.emptyTitle}>No samples found</Text>
              <Text style={styles.emptyDescription}>
                Try another search term or change the selected filter.
              </Text>

              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSearch('')
                  setFilter('ALL')
                }}
              >
                <Text style={styles.clearButtonText}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ARCHIVAL NOTE */}
        <View style={styles.archiveNote}>
          <View style={styles.archiveIcon}>
            <FlaskConical size={19} color={C.primary} />
          </View>

          <View style={styles.archiveContent}>
            <Text style={styles.archiveTitle}>SAMPLE TRACEABILITY</Text>
            <Text style={styles.archiveDescription}>
              Samples remain linked to their originating experiment and
              laboratory for research traceability.
            </Text>
          </View>
        </View>

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>
            LABSYNC · SAMPLE REGISTER
          </Text>
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
  addButton: {
    width: 42,
    height: 42,
    borderRadius: R.pill,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: SP.lg,
    marginBottom: SP.lg,
    ...S.card,
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewEyebrow: {
    color: C.muted,
    fontSize: T.eyebrow,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  overviewTitle: {
    color: C.ink,
    fontSize: T.heading3,
    fontWeight: '800',
    marginTop: 5,
  },
  overviewIcon: {
    width: 42,
    height: 42,
    borderRadius: R.md,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SP.lg,
  },
  overviewNumber: {
    color: C.ink,
    fontSize: 37,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  overviewInfo: {
    marginLeft: SP.md,
  },
  overviewLabel: {
    color: C.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  overviewDescription: {
    color: C.muted,
    fontSize: T.bodySmall,
    marginTop: 4,
  },
  overviewFooter: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    marginTop: SP.md,
    paddingTop: SP.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.xl,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  miniDot: {
    width: 7,
    height: 7,
    borderRadius: R.pill,
  },
  miniStatText: {
    color: C.muted,
    fontSize: T.bodySmall,
    fontWeight: '700',
  },
  searchBox: {
    height: 48,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.md,
    marginBottom: SP.xl,
  },
  searchInput: {
    flex: 1,
    marginLeft: SP.sm,
    color: C.ink,
    fontSize: T.bodySmall,
    paddingVertical: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  filterRow: {
    flexDirection: 'row',
    gap: SP.sm,
    marginBottom: SP.md,
  },
  filterButton: {
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  filterButtonActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  filterText: {
    color: C.muted,
    fontSize: T.bodySmall,
    fontWeight: '700',
  },
  filterTextActive: {
    color: C.white,
  },
  list: {
    gap: SP.md,
  },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: SP.lg,
    ...S.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sampleIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
  },
  sampleIcon: {
    width: 36,
    height: 36,
    borderRadius: R.md,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleId: {
    color: C.secondary,
    fontSize: T.bodySmall,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: R.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: R.pill,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sampleName: {
    color: C.ink,
    fontSize: T.heading3,
    fontWeight: '800',
    marginTop: SP.md,
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: SP.sm,
  },
  labDot: {
    width: 6,
    height: 6,
    borderRadius: R.pill,
    backgroundColor: C.primary,
  },
  labText: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    marginTop: SP.md,
    paddingTop: SP.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  experimentLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  experimentId: {
    color: C.ink,
    fontSize: T.bodySmall,
    fontWeight: '700',
    marginTop: 4,
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsText: {
    color: C.primary,
    fontSize: T.bodySmall,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: SP.xxl,
  },
  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: R.pill,
    backgroundColor: C.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: C.ink,
    fontSize: T.heading3,
    fontWeight: '800',
    marginTop: SP.md,
  },
  emptyDescription: {
    color: C.muted,
    fontSize: T.bodySmall,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: SP.xs,
  },
  clearButton: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: SP.lg,
    paddingVertical: SP.sm,
    borderRadius: R.pill,
    marginTop: SP.md,
  },
  clearButtonText: {
    color: C.primary,
    fontSize: T.bodySmall,
    fontWeight: '800',
  },
  archiveNote: {
    marginTop: SP.xl,
    padding: SP.md,
    backgroundColor: C.primaryLight,
    borderRadius: R.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.md,
  },
  archiveIcon: {
    width: 40,
    height: 40,
    borderRadius: R.md,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveContent: {
    flex: 1,
  },
  archiveTitle: {
    color: C.primaryDark,
    fontSize: T.bodySmall,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  archiveDescription: {
    color: C.text,
    fontSize: T.bodySmall,
    lineHeight: 18,
    marginTop: 3,
  },
  bottomNote: {
    alignItems: 'center',
    marginTop: SP.xxl,
  },
  bottomNoteText: {
    color: C.subtle,
    fontSize: T.eyebrow,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
})
