
import {
  createExperimentRecord,
  getExperiment,
  getExperimentRecords,
  getLaboratories,
} from '@/services/api'
import { router, useLocalSearchParams } from 'expo-router'
import {
  AlertCircle,
  ArrowLeft,
  Beaker,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FlaskConical,
  Plus,
  RefreshCw,
  User,
  Wrench
} from 'lucide-react-native'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  ActivityIndicator,
  Alert,
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

import type {
  Experiment,
  ExperimentRecord,
  Laboratory,
} from '@/services/types'

function formatDate(value: string | null): string {
  if (!value) return 'NOT SET'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'NOT SET'

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()
}

function formatTime(value: string | null): string {
  if (!value) return 'NOT SET'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'NOT SET'

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function displayStatus(status: Experiment['status']): string {
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
      return status
  }
}

function getStatusColors(status: string) {
  switch (status) {
    case 'IN PROGRESS':
      return {
        background: C.primaryLight,
        foreground: C.primary,
        dot: C.success,
      }
    case 'COMPLETED':
      return {
        background: C.successLight,
        foreground: C.success,
        dot: C.success,
      }
    case 'CANCELLED':
      return {
        background: C.dangerLight,
        foreground: C.danger,
        dot: C.danger,
      }
    default:
      return {
        background: C.warningLight,
        foreground: C.accent,
        dot: C.accent,
      }
  }
}

function SectionHeading({
  number,
  title,
}: {
  number: string
  title: string
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionNumber}>{number}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  )
}

function MetadataItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <View style={styles.metadataItem}>
      <View style={styles.metadataIcon}>{icon}</View>
      <View style={styles.metadataText}>
        <Text style={styles.metadataLabel}>{label}</Text>
        <Text style={styles.metadataValue}>{value}</Text>
      </View>
    </View>
  )
}

export default function ExperimentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const experimentId = Number(id)

  const [experiment, setExperiment] = useState<Experiment | null>(null)
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [records, setRecords] = useState<ExperimentRecord[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [recordType, setRecordType] = useState('OBSERVATION')
  const [recordNotes, setRecordNotes] = useState('')
  const [recordedBy, setRecordedBy] = useState('')
  const [savingRecord, setSavingRecord] = useState(false)

  const loadData = useCallback(async () => {
    if (!Number.isInteger(experimentId) || experimentId <= 0) {
      setError('Invalid experiment ID.')
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      setError('')

      const [
        experimentData,
        laboratoryData,
        recordData,
      ] = await Promise.all([
        getExperiment(experimentId),
        getLaboratories(),
        getExperimentRecords(experimentId),
      ])

      setExperiment(experimentData)
      setLaboratories(laboratoryData)
      setRecords(recordData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load experiment details.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [experimentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const laboratory = laboratories.find(
    (lab) => lab.id === experiment?.laboratory_id
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleAddRecord = async () => {
    if (!recordType.trim() || !recordNotes.trim() || !recordedBy.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter the record type, your name and observation notes.'
      )
      return
    }

    if (!experiment) return

    try {
      setSavingRecord(true)

      await createExperimentRecord(experiment.id, {
        recorded_by: recordedBy.trim(),
        record_type: recordType.trim().toUpperCase(),
        notes: recordNotes.trim(),
      })

      setRecordNotes('')
      setRecordType('OBSERVATION')

      const updatedRecords = await getExperimentRecords(experiment.id)
      setRecords(updatedRecords)

      Alert.alert('Success', 'Observation saved successfully.')
    } catch (err) {
      Alert.alert(
        'Unable to save',
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving the observation.'
      )
    } finally {
      setSavingRecord(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.stateText}>
            Loading experiment details...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !experiment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <View style={styles.errorIcon}>
            <AlertCircle size={25} color={C.danger} />
          </View>

          <Text style={styles.errorTitle}>Record unavailable</Text>
          <Text style={styles.errorText}>
            {error || 'Experiment not found.'}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true)
              loadData()
            }}
          >
            <RefreshCw size={15} color={C.white} />
            <Text style={styles.retryText}>TRY AGAIN</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const status = displayStatus(experiment.status)
  const statusColors = getStatusColors(status)

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
            <Text style={styles.eyebrow}>RESEARCH RECORD</Text>
            <Text style={styles.recordId}>
              EXPERIMENT #{experiment.id}
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Beaker size={20} color={C.primary} />
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <FlaskConical size={23} color={C.white} />
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors.background },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColors.dot },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: statusColors.foreground },
                ]}
              >
                {status}
              </Text>
            </View>
          </View>

          <Text style={styles.heroLab}>
            {laboratory?.department || `LAB ${experiment.laboratory_id}`}
          </Text>

          <Text style={styles.heroTitle}>{experiment.name}</Text>

          <View style={styles.heroFooter}>
            <View style={styles.heroFooterItem}>
              <CalendarDays size={14} color="#DCE9E3" />
              <Text style={styles.heroFooterText}>
                {formatDate(experiment.start_time)}
              </Text>
            </View>

            <View style={styles.heroFooterItem}>
              <Clock3 size={14} color="#DCE9E3" />
              <Text style={styles.heroFooterText}>
                {formatTime(experiment.start_time)}
              </Text>
            </View>
          </View>
        </View>

        <SectionHeading number="01" title="RECORD INFORMATION" />

        <View style={styles.metadataCard}>
          <MetadataItem
            icon={<User size={17} color={C.primary} />}
            label="RESEARCHER"
            value={experiment.started_by || 'Not specified'}
          />

          <View style={styles.metadataDivider} />

          <MetadataItem
            icon={<Beaker size={17} color={C.secondary} />}
            label="LABORATORY"
            value={
              laboratory?.name || `Laboratory ${experiment.laboratory_id}`
            }
          />

          <View style={styles.metadataDivider} />

          <MetadataItem
            icon={<CalendarDays size={17} color={C.accent} />}
            label="START DATE"
            value={formatDate(experiment.start_time)}
          />

          <View style={styles.metadataDivider} />

          <MetadataItem
            icon={<Clock3 size={17} color={C.secondary} />}
            label="START TIME"
            value={formatTime(experiment.start_time)}
          />
        </View>

        <SectionHeading number="02" title="EXPERIMENT OBJECTIVE" />

        <View style={styles.objectiveCard}>
          <View style={styles.objectiveHeader}>
            <View style={styles.objectiveIcon}>
              <FileText size={17} color={C.primary} />
            </View>
            <Text style={styles.objectiveLabel}>DESCRIPTION</Text>
          </View>

          <Text style={styles.objectiveText}>
            {experiment.description ||
              'No experiment description has been added.'}
          </Text>
        </View>

        <SectionHeading number="03" title="LINKED RECORDS" />

        <View style={styles.linkedCard}>
          <View style={styles.linkedRow}>
            <View style={styles.linkedIcon}>
              <FlaskConical size={18} color={C.primary} />
            </View>

            <View style={styles.linkedInfo}>
              <Text style={styles.linkedLabel}>SAMPLE</Text>
              <Text style={styles.linkedValue}>Not linked yet</Text>
            </View>

            <ChevronRight size={17} color={C.subtle} />
          </View>

          <View style={styles.linkedDivider} />

          <View style={styles.linkedRow}>
            <View style={[styles.linkedIcon, styles.equipmentIcon]}>
              <Wrench size={18} color={C.accent} />
            </View>

            <View style={styles.linkedInfo}>
              <Text style={styles.linkedLabel}>EQUIPMENT</Text>
              <Text style={styles.linkedValue}>Not linked yet</Text>
            </View>

            <ChevronRight size={17} color={C.subtle} />
          </View>
        </View>

        <View style={styles.observationHeading}>
          <View>
            <SectionHeading number="04" title="OBSERVATIONS" />
            <Text style={styles.observationSubtitle}>
              Recorded experimental notes
            </Text>
          </View>

          <View style={styles.observationCount}>
            <Text style={styles.observationCountText}>
              {records.length}
            </Text>
          </View>
        </View>

        {records.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <FileText size={21} color={C.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              No observations recorded
            </Text>
            <Text style={styles.emptyText}>
              Add your first observation below to build the experiment
              journal.
            </Text>
          </View>
        ) : (
          <View style={styles.recordsList}>
            {records.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordTypeBadge}>
                    <Text style={styles.recordType}>
                      {record.record_type}
                    </Text>
                  </View>
                  <Text style={styles.recordDate}>
                    {formatDate(record.created_at)}
                  </Text>
                </View>

                <Text style={styles.recordNotes}>{record.notes}</Text>

                <View style={styles.recordFooter}>
                  <View style={styles.recordAuthorIcon}>
                    <User size={12} color={C.primary} />
                  </View>
                  <Text style={styles.recordAuthor}>
                    Recorded by {record.recorded_by}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <SectionHeading number="05" title="ADD OBSERVATION" />

        <View style={styles.addRecordCard}>
          <View style={styles.formIntro}>
            <View style={styles.formIcon}>
              <Plus size={18} color={C.primary} />
            </View>
            <View style={styles.formIntroText}>
              <Text style={styles.formTitle}>New journal entry</Text>
              <Text style={styles.formSubtitle}>
                Document what happened during this experiment.
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>RECORD TYPE</Text>
          <TextInput
            style={styles.recordInput}
            value={recordType}
            onChangeText={setRecordType}
            placeholder="e.g. OBSERVATION"
            placeholderTextColor={C.subtle}
            autoCapitalize="characters"
          />

          <Text style={styles.inputLabel}>RECORDED BY</Text>
          <TextInput
            style={styles.recordInput}
            value={recordedBy}
            onChangeText={setRecordedBy}
            placeholder="Enter your name"
            placeholderTextColor={C.subtle}
          />

          <Text style={styles.inputLabel}>OBSERVATION NOTES</Text>
          <TextInput
            style={[styles.recordInput, styles.notesInput]}
            value={recordNotes}
            onChangeText={setRecordNotes}
            placeholder="Describe your findings, measurements or observations..."
            placeholderTextColor={C.subtle}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.saveButton,
              savingRecord && styles.saveButtonDisabled,
            ]}
            onPress={handleAddRecord}
            disabled={savingRecord}
          >
            {savingRecord ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <>
                <Plus size={17} color={C.white} />
                <Text style={styles.saveButtonText}>
                  SAVE OBSERVATION
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.archiveCard}>
          <CheckCircle2 size={19} color={C.success} />
          <View style={styles.archiveInfo}>
            <Text style={styles.archiveTitle}>RECORD INDEXED</Text>
            <Text style={styles.archiveText}>
              This experiment is stored in the laboratory database.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          LABSYNC · EXPERIMENT JOURNAL
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
    marginBottom: 20,
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
  recordId: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: R.md,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: C.primary,
    borderRadius: R.xl,
    padding: 19,
    ...S.card,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
    letterSpacing: 0.5,
  },
  heroLab: {
    color: '#C6DDD3',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 20,
  },
  heroTitle: {
    color: C.white,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 32,
    marginTop: 7,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 17,
    marginTop: 19,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  heroFooterText: {
    color: '#E1EEE8',
    fontSize: 9,
    fontWeight: '700',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 27,
    marginBottom: 12,
  },
  sectionNumber: {
    color: C.accent,
    fontSize: 10,
    fontWeight: '800',
    marginRight: 8,
  },
  sectionTitle: {
    color: C.ink,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  metadataCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 15,
    ...S.card,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  metadataIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: C.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metadataText: {
    marginLeft: 11,
    flex: 1,
  },
  metadataLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metadataValue: {
    color: C.ink,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  metadataDivider: {
    height: 1,
    backgroundColor: C.divider,
  },
  objectiveCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    ...S.card,
  },
  objectiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  objectiveIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectiveLabel: {
    color: C.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  objectiveText: {
    color: C.text,
    fontSize: 13,
    lineHeight: 21,
  },
  linkedCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 15,
    ...S.card,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  linkedIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentIcon: {
    backgroundColor: C.warningLight,
  },
  linkedInfo: {
    flex: 1,
    marginLeft: 11,
  },
  linkedLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  linkedValue: {
    color: C.ink,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  linkedDivider: {
    height: 1,
    backgroundColor: C.divider,
  },
  observationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  observationSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: -7,
    marginBottom: 12,
  },
  observationCount: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  observationCountText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    padding: 23,
  },
  emptyIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: C.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
  recordsList: {
    gap: 10,
  },
  recordCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
    ...S.card,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordTypeBadge: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: R.pill,
  },
  recordType: {
    color: C.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  recordDate: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '700',
  },
  recordNotes: {
    color: C.text,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 13,
  },
  recordFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 13,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  recordAuthorIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordAuthor: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '600',
  },
  addRecordCard: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
    ...S.card,
  },
  formIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 18,
  },
  formIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formIntroText: {
    flex: 1,
  },
  formTitle: {
    color: C.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  formSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  inputLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 7,
    marginTop: 12,
  },
  recordInput: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: C.ink,
    fontSize: 12,
  },
  notesInput: {
    minHeight: 110,
  },
  saveButton: {
    backgroundColor: C.primary,
    borderRadius: R.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: C.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  archiveCard: {
    marginTop: 23,
    padding: 14,
    backgroundColor: C.successLight,
    borderRadius: R.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  archiveInfo: {
    flex: 1,
  },
  archiveTitle: {
    color: C.success,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  archiveText: {
    color: C.text,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },
  footer: {
    color: C.subtle,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 25,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 13,
    backgroundColor: C.background,
  },
  stateText: {
    color: C.muted,
    fontSize: 12,
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: C.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  errorText: {
    color: C.danger,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: R.md,
    marginTop: 5,
  },
  retryText: {
    color: C.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  backText: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 5,
  },
})
