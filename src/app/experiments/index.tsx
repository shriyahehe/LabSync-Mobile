
import { router, useFocusEffect } from 'expo-router'
import {
  Activity,
  ArrowLeft,
  Beaker,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FlaskConical,
  Plus,
  Search,
} from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
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
} from '@/constants/labsync-theme'

import {
  getExperiments,
  getLaboratories,
} from '@/services/api'

import type {
  Experiment,
  Laboratory,
} from '@/services/types'

type ExperimentCardData = {
  id: number
  displayId: string
  title: string
  lab: string
  researcher: string
  date: string
  status: 'IN PROGRESS' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
}

function formatDate(value: string | null): string {
  if (!value) return 'DATE NOT SET'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'DATE NOT SET'

  return date
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    })
    .toUpperCase()
}

function mapStatus(
  status: Experiment['status']
): ExperimentCardData['status'] {
  switch (status) {
    case 'IN_PROGRESS':
      return 'IN PROGRESS'
    case 'PLANNED':
      return 'SCHEDULED'
    case 'COMPLETED':
      return 'COMPLETED'
    case 'CANCELLED':
      return 'CANCELLED'
    default:
      return 'CANCELLED'
  }
}

function StatusBadge({
  status,
}: {
  status: ExperimentCardData['status']
}) {
  const config = {
    'IN PROGRESS': {
      background: C.primaryLight,
      foreground: C.primary,
      dot: C.success,
    },
    SCHEDULED: {
      background: C.warningLight,
      foreground: C.accent,
      dot: C.accent,
    },
    COMPLETED: {
      background: C.successLight,
      foreground: C.success,
      dot: C.success,
    },
    CANCELLED: {
      background: C.dangerLight,
      foreground: C.danger,
      dot: C.danger,
    },
  }[status]

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.background }]}>
      <View style={[styles.statusDot, { backgroundColor: config.dot }]} />
      <Text style={[styles.statusText, { color: config.foreground }]}>
        {status}
      </Text>
    </View>
  )
}

function SummaryCard({
  value,
  label,
  icon,
  tint,
}: {
  value: number
  label: string
  icon: React.ReactNode
  tint: string
}) {
  return (
    <View style={styles.summaryItem}>
      <View style={[styles.summaryIcon, { backgroundColor: tint }]}>
        {icon}
      </View>
      <Text style={styles.summaryValue}>{value.toString().padStart(2, '0')}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  )
}

export default function ExperimentsScreen() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      setError('')

      const [experimentData, laboratoryData] = await Promise.all([
        getExperiments(),
        getLaboratories(),
      ])

      setExperiments(experimentData)
      setLaboratories(laboratoryData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load experiments.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData])
  )

  const laboratoryMap = useMemo(
    () => new Map(laboratories.map((lab) => [lab.id, lab])),
    [laboratories]
  )

  const experimentCards: ExperimentCardData[] = useMemo(
    () =>
      experiments.map((experiment) => {
        const laboratory = laboratoryMap.get(experiment.laboratory_id)

        return {
          id: experiment.id,
          displayId: `DB ID ${experiment.id}`,
          title: experiment.name,
          lab: laboratory?.department || `LAB ${experiment.laboratory_id}`,
          researcher: experiment.started_by || 'Not specified',
          date: formatDate(experiment.start_time),
          status: mapStatus(experiment.status),
        }
      }),
    [experiments, laboratoryMap]
  )

  const filteredExperiments = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return experimentCards

    return experimentCards.filter((experiment) =>
      [
        experiment.title,
        experiment.displayId,
        experiment.lab,
        experiment.researcher,
        experiment.status,
      ].some((value) => value.toLowerCase().includes(query))
    )
  }, [experimentCards, search])

  const activeCount = experiments.filter(
    (experiment) => experiment.status === 'IN_PROGRESS'
  ).length

  const plannedCount = experiments.filter(
    (experiment) => experiment.status === 'PLANNED'
  ).length

  const completedCount = experiments.filter(
    (experiment) => experiment.status === 'COMPLETED'
  ).length

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={19} color={C.ink} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>RESEARCH MANAGEMENT</Text>
            <Text style={styles.title}>Experiments</Text>
            <Text style={styles.subtitle}>
              Your laboratory work, organised.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/experiments/create')}
          >
            <Plus size={21} color={C.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <FlaskConical size={21} color={C.white} />
            </View>
            <Text style={styles.heroEyebrow}>EXPERIMENT ARCHIVE</Text>
          </View>

          <Text style={styles.heroTitle}>Every discovery starts here.</Text>
          <Text style={styles.heroDescription}>
            Keep track of ongoing research, planned work and completed
            experiments in one place.
          </Text>

          <View style={styles.heroFooter}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>
                {experiments.length}
              </Text>
              <Text style={styles.heroMetricLabel}>TOTAL RECORDS</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{activeCount}</Text>
              <Text style={styles.heroMetricLabel}>ACTIVE NOW</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard
            value={activeCount}
            label="ACTIVE"
            icon={<Activity size={17} color={C.primary} />}
            tint={C.primaryLight}
          />
          <SummaryCard
            value={plannedCount}
            label="PLANNED"
            icon={<CalendarDays size={17} color={C.accent} />}
            tint={C.warningLight}
          />
          <SummaryCard
            value={completedCount}
            label="COMPLETED"
            icon={<CheckCircle2 size={17} color={C.success} />}
            tint={C.successLight}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Experiment register</Text>
            <Text style={styles.sectionSubtitle}>
              Browse your research records
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {filteredExperiments.length}
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={17} color={C.muted} />
          <TextInput
            placeholder="Search by name, lab, researcher..."
            placeholderTextColor={C.subtle}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.messageContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.messageText}>Loading experiments...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorTitle}>Unable to load experiments</Text>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true)
                loadData()
              }}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredExperiments.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Beaker size={26} color={C.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {search ? 'No matching experiments' : 'No experiments yet'}
            </Text>
            <Text style={styles.emptyText}>
              {search
                ? 'Try a different search term.'
                : 'Create your first experiment to start building your research archive.'}
            </Text>

            {!search && (
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => router.push('/experiments/create')}
              >
                <Plus size={15} color={C.white} />
                <Text style={styles.emptyActionText}>New experiment</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {filteredExperiments.map((experiment) => (
              <TouchableOpacity
                key={experiment.id}
                activeOpacity={0.8}
                style={styles.experimentCard}
                onPress={() =>
                  router.push(`/experiments/${experiment.id}` as any)
                }
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardIcon}>
                    <Beaker size={19} color={C.primary} />
                  </View>

                  <View style={styles.cardHeading}>
                    <Text style={styles.experimentTitle}>
                      {experiment.title}
                    </Text>
                    <Text style={styles.experimentId}>
                      {experiment.displayId}
                    </Text>
                  </View>

                  <ChevronRight size={19} color={C.subtle} />
                </View>

                <View style={styles.cardMetadata}>
                  <View style={styles.metadataItem}>
                    <CalendarDays size={12} color={C.muted} />
                    <Text style={styles.metadataText}>
                      {experiment.date}
                    </Text>
                  </View>

                  <View style={styles.metadataItem}>
                    <Clock3 size={12} color={C.muted} />
                    <Text style={styles.metadataText}>
                      {experiment.lab}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.researcherText}>
                    Researcher: {experiment.researcher}
                  </Text>
                  <StatusBadge status={experiment.status} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.footerNote}>
          <Beaker size={16} color={C.primary} />
          <Text style={styles.footerNoteText}>
            Your research records stay organised in LabSync.
          </Text>
        </View>

        <Text style={styles.footer}>
          LABSYNC · EXPERIMENT REGISTER
        </Text>
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
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: R.md,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  eyebrow: {
    color: C.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: C.ink,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 2,
  },
  subtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 3,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: R.md,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...S.floating,
  },
  heroCard: {
    backgroundColor: C.primary,
    borderRadius: R.xl,
    padding: 19,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: '#DCE9E3',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: C.white,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 17,
  },
  heroDescription: {
    color: '#DCE9E3',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 270,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroMetric: {
    flex: 1,
  },
  heroMetricValue: {
    color: C.white,
    fontSize: 22,
    fontWeight: '800',
  },
  heroMetricLabel: {
    color: '#DCE9E3',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 3,
  },
  heroMetricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 13,
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.lg,
    ...S.card,
  },
  summaryIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    color: C.ink,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 10,
  },
  summaryLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 29,
    marginBottom: 14,
  },
  sectionTitle: {
    color: C.ink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: R.md,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  searchBox: {
    height: 47,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 13,
  },
  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: C.ink,
    fontSize: 12,
  },
  list: {
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeading: {
    flex: 1,
    marginLeft: 11,
  },
  experimentTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  experimentId: {
    color: C.subtle,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  cardMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 14,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metadataText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    gap: 8,
  },
  researcherText: {
    color: C.muted,
    fontSize: 9,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: R.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  messageContainer: {
    alignItems: 'center',
    paddingVertical: 35,
    gap: 12,
  },
  messageText: {
    color: C.muted,
    fontSize: 12,
  },
  stateCard: {
    alignItems: 'center',
    padding: 25,
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
  },
  errorTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    color: C.danger,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 7,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: R.md,
  },
  retryText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: R.md,
    marginTop: 16,
  },
  emptyActionText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '800',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 13,
    borderRadius: R.md,
    backgroundColor: C.primaryLight,
    marginTop: 23,
  },
  footerNoteText: {
    color: C.primaryDark,
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    color: C.subtle,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 24,
  },
})
