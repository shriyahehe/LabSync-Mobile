
import {
  createExperimentRecord,
  getExperiment,
  getExperimentRecords,
  getLaboratories,
} from '@/services/api'
import { router, useLocalSearchParams } from 'expo-router'
import {
  ArrowLeft,
  Beaker,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FlaskConical,
  Plus,
  RefreshCw,
  User,
  Wrench,
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

import type {
  Experiment,
  ExperimentRecord,
  Laboratory,
} from '@/services/types'

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
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.messageText}>
            Loading experiment details...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !experiment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.messageContainer}>
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
            <RefreshCw size={15} color={COLORS.white} />
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.green}
              colors={[COLORS.green]}
            />
          }
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
              <Text style={styles.recordId}>DB ID {experiment.id}</Text>
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
            <Text style={styles.lab}>
              {laboratory?.department || `LAB ${experiment.laboratory_id}`}
            </Text>

            <Text style={styles.title}>{experiment.name}</Text>

            <View
              style={[
                styles.status,
                status === 'IN PROGRESS'
                  ? styles.statusProgress
                  : status === 'COMPLETED'
                    ? styles.statusCompleted
                    : styles.statusScheduled,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  status === 'IN PROGRESS'
                    ? styles.progressText
                    : status === 'COMPLETED'
                      ? styles.completedText
                      : styles.scheduledText,
                ]}
              >
                {status}
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
                <Text style={styles.metaLabel}>START DATE</Text>
                <Text style={styles.metaValue}>
                  {formatDate(experiment.start_time)}
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
                <Text style={styles.metaLabel}>START TIME</Text>
                <Text style={styles.metaValue}>
                  {formatTime(experiment.start_time)}
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
                  {experiment.started_by || 'Not specified'}
                </Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Beaker
                size={17}
                color={COLORS.green}
                strokeWidth={1.7}
              />

              <View style={styles.metaText}>
                <Text style={styles.metaLabel}>LABORATORY</Text>
                <Text style={styles.metaValue}>
                  {laboratory?.name || `Laboratory ${experiment.laboratory_id}`}
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
              {experiment.description || 'No experiment description has been added.'}
            </Text>
          </View>

          {/* LINKED RECORDS */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>03</Text>
            <Text style={styles.sectionTitle}>LINKED RECORDS</Text>
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
                  Not linked yet
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
                  Not linked yet
                </Text>
              </View>
            </View>
          </View>

          {/* OBSERVATIONS */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>04</Text>
            <Text style={styles.sectionTitle}>OBSERVATIONS</Text>
          </View>

          {records.length === 0 ? (
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
          ) : (
            <View style={styles.recordsList}>
              {records.map((record) => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordType}>
                      {record.record_type}
                    </Text>

                    <Text style={styles.recordDate}>
                      {formatDate(record.created_at)}
                    </Text>
                  </View>

                  <Text style={styles.recordNotes}>
                    {record.notes}
                  </Text>

                  <Text style={styles.recordAuthor}>
                    Recorded by {record.recorded_by}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ADD OBSERVATION */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>05</Text>
            <Text style={styles.sectionTitle}>ADD OBSERVATION</Text>
          </View>

          <View style={styles.addRecordCard}>
            <Text style={styles.inputLabel}>RECORD TYPE</Text>

            <TextInput
              style={styles.recordInput}
              value={recordType}
              onChangeText={setRecordType}
              placeholder="e.g. OBSERVATION"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>RECORDED BY</Text>

            <TextInput
              style={styles.recordInput}
              value={recordedBy}
              onChangeText={setRecordedBy}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputLabel}>NOTES</Text>

            <TextInput
              style={[styles.recordInput, styles.notesInput]}
              value={recordNotes}
              onChangeText={setRecordNotes}
              placeholder="Enter experiment observations..."
              placeholderTextColor={COLORS.muted}
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
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Plus size={16} color={COLORS.white} />
                  <Text style={styles.saveButtonText}>
                    SAVE OBSERVATION
                  </Text>
                </>
              )}
            </TouchableOpacity>
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
                This experiment is stored in the laboratory database.
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

  recordsList: {
    gap: 9,
  },

  recordCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 14,
  },

  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  recordType: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  recordDate: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '700',
  },

  recordNotes: {
    color: COLORS.ink,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
  },

  recordAuthor: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 10,
  },

  addRecordCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 14,
    gap: 9,
  },

  inputLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 5,
  },

  recordInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: COLORS.ink,
    fontSize: 12,
  },

  notesInput: {
    minHeight: 100,
  },

  saveButton: {
    backgroundColor: COLORS.green,
    borderRadius: 4,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
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

  messageContainer: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: COLORS.background,
  },

  messageText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
  },

  errorText: {
    color: COLORS.brick,
    fontSize: 13,
    textAlign: 'center',
  },

  retryButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  retryText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  backText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 5,
  },
})
