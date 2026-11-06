import { router, useFocusEffect } from 'expo-router'
import {
  Activity,
  ArrowLeft,
  Beaker,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FlaskConical,
  History,
  Plus,
  Search,
  SquarePen,
  X,
} from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  createExperiment,
  createExperimentRecord,
  getExperimentRecords,
  getExperiments,
  getLaboratories,
  updateExperiment,
} from '@/services/api'

import type {
  CreateExperimentInput,
  CreateExperimentRecordInput,
  Experiment,
  ExperimentRecord,
  ExperimentStatus,
  Laboratory,
} from '@/services/types'

type DisplayStatus =
  | 'IN PROGRESS'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'

type ExperimentForm = {
  laboratory_id: number
  name: string
  description: string
  started_by: string
  status: ExperimentStatus
}

const EMPTY_FORM: ExperimentForm = {
  laboratory_id: 0,
  name: '',
  description: '',
  started_by: '',
  status: 'PLANNED',
}

const STATUSES: ExperimentStatus[] = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]

function formatDate(value: string | null | undefined): string {
  if (!value) return 'DATE NOT SET'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'DATE NOT SET'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()
}

function mapStatus(status: ExperimentStatus): DisplayStatus {
  switch (status) {
    case 'IN_PROGRESS':
      return 'IN PROGRESS'
    case 'PLANNED':
      return 'SCHEDULED'
    case 'COMPLETED':
      return 'COMPLETED'
    case 'CANCELLED':
      return 'CANCELLED'
  }
}

function statusLabel(status: ExperimentStatus): string {
  return mapStatus(status)
}

function StatusBadge({ status }: { status: DisplayStatus }) {
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

  const [formVisible, setFormVisible] = useState(false)
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null)
  const [form, setForm] = useState<ExperimentForm>(EMPTY_FORM)
  const [showLabPicker, setShowLabPicker] = useState(false)
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [records, setRecords] = useState<ExperimentRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordType, setRecordType] = useState('OBSERVATION')
  const [recordedBy, setRecordedBy] = useState('')
  const [recordNotes, setRecordNotes] = useState('')
  const [savingRecord, setSavingRecord] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setError('')
      const [experimentData, laboratoryData] = await Promise.all([
        getExperiments(),
        getLaboratories(),
      ])
      setExperiments(experimentData ?? [])
      setLaboratories(laboratoryData ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load experiments.')
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

  const filteredExperiments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return experiments.filter((experiment) => {
      if (!query) return true
      const lab = laboratoryMap.get(experiment.laboratory_id)
      return [
        experiment.name,
        `DB ID ${experiment.id}`,
        experiment.description ?? '',
        experiment.started_by ?? '',
        lab?.name ?? '',
        lab?.department ?? '',
        statusLabel(experiment.status),
      ].some((value) => value.toLowerCase().includes(query))
    })
  }, [experiments, laboratoryMap, search])

  const activeCount = experiments.filter((item) => item.status === 'IN_PROGRESS').length
  const plannedCount = experiments.filter((item) => item.status === 'PLANNED').length
  const completedCount = experiments.filter((item) => item.status === 'COMPLETED').length

  const openCreateForm = () => {
    setEditingExperiment(null)
    setForm({
      ...EMPTY_FORM,
      laboratory_id: laboratories[0]?.id ?? 0,
    })
    setShowLabPicker(false)
    setShowStatusPicker(false)
    setFormVisible(true)
  }

  const openEditForm = (experiment: Experiment) => {
    setEditingExperiment(experiment)
    setForm({
      laboratory_id: experiment.laboratory_id,
      name: experiment.name,
      description: experiment.description ?? '',
      started_by: experiment.started_by ?? '',
      status: experiment.status,
    })
    setShowLabPicker(false)
    setShowStatusPicker(false)
    setFormVisible(true)
  }

  const updateForm = <K extends keyof ExperimentForm>(
    key: K,
    value: ExperimentForm[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submitExperiment = async () => {
    if (!form.laboratory_id) {
      Alert.alert('Laboratory required', 'Select the laboratory for this experiment.')
      return
    }
    if (!form.name.trim()) {
      Alert.alert('Experiment name required', 'Enter a name for this experiment.')
      return
    }

    const payload: CreateExperimentInput = {
      laboratory_id: form.laboratory_id,
      name: form.name.trim(),
      description: form.description.trim(),
      started_by: form.started_by.trim(),
      status: form.status,
    }

    setSaving(true)
    try {
      if (editingExperiment) {
        await updateExperiment(editingExperiment.id, payload)
      } else {
        await createExperiment(payload)
      }
      setFormVisible(false)
      await loadData()
      Alert.alert(
        editingExperiment ? 'Experiment updated' : 'Experiment created',
        editingExperiment
          ? 'Your experiment details have been saved.'
          : 'Your new experiment has been added to the register.'
      )
    } catch (err) {
      Alert.alert(
        'Could not save experiment',
        err instanceof Error ? err.message : 'Please check the details and try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const openDetails = async (experiment: Experiment) => {
    setSelectedExperiment(experiment)
    setRecords([])
    setRecordType('OBSERVATION')
    setRecordedBy('')
    setRecordNotes('')
    setDetailVisible(true)
    setRecordsLoading(true)
    try {
      const data = await getExperimentRecords(experiment.id)
      setRecords(data ?? [])
    } catch (err) {
      Alert.alert(
        'Could not load observations',
        err instanceof Error ? err.message : 'Please try again.'
      )
    } finally {
      setRecordsLoading(false)
    }
  }

  const submitRecord = async () => {
    if (!selectedExperiment) return
    if (!recordNotes.trim()) {
      Alert.alert('Observation required', 'Enter the observation or experiment note.')
      return
    }

    const input: CreateExperimentRecordInput = {
      recorded_by: recordedBy.trim(),
      record_type: recordType.trim() || 'OBSERVATION',
      notes: recordNotes.trim(),
    }

    setSavingRecord(true)
    try {
      const created = await createExperimentRecord(selectedExperiment.id, input)
      setRecords((current) => [...current, created])
      setRecordNotes('')
      Alert.alert('Observation saved', 'The experiment record has been added.')
    } catch (err) {
      Alert.alert(
        'Could not save observation',
        err instanceof Error ? err.message : 'Please try again.'
      )
    } finally {
      setSavingRecord(false)
    }
  }

  const changeStatus = async (status: ExperimentStatus) => {
    if (!selectedExperiment) return
    const payload: CreateExperimentInput = {
      laboratory_id: selectedExperiment.laboratory_id,
      name: selectedExperiment.name,
      description: selectedExperiment.description ?? '',
      started_by: selectedExperiment.started_by ?? '',
      status,
    }

    setSaving(true)
    try {
      const updated = await updateExperiment(selectedExperiment.id, payload)
      setSelectedExperiment(updated)
      setExperiments((current) =>
        current.map((item) => item.id === updated.id ? updated : item)
      )
    } catch (err) {
      Alert.alert(
        'Status update failed',
        err instanceof Error ? err.message : 'Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={19} color={C.ink} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>RESEARCH MANAGEMENT</Text>
            <Text style={styles.title}>Experiments</Text>
            <Text style={styles.subtitle}>Your laboratory work, organised.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openCreateForm}>
            <Plus size={21} color={C.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}><FlaskConical size={21} color={C.white} /></View>
            <Text style={styles.heroEyebrow}>EXPERIMENT ARCHIVE</Text>
          </View>
          <Text style={styles.heroTitle}>Every discovery starts here.</Text>
          <Text style={styles.heroDescription}>
            Keep track of ongoing research, planned work and completed experiments in one place.
          </Text>
          <View style={styles.heroFooter}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{experiments.length}</Text>
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
          <SummaryCard value={activeCount} label="ACTIVE" icon={<Activity size={17} color={C.primary} />} tint={C.primaryLight} />
          <SummaryCard value={plannedCount} label="PLANNED" icon={<CalendarDays size={17} color={C.accent} />} tint={C.warningLight} />
          <SummaryCard value={completedCount} label="COMPLETED" icon={<CheckCircle2 size={17} color={C.success} />} tint={C.successLight} />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Experiment register</Text>
            <Text style={styles.sectionSubtitle}>Browse your research records</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredExperiments.length}</Text>
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
            <TouchableOpacity style={styles.retryButton} onPress={() => {
              setLoading(true)
              loadData()
            }}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredExperiments.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}><Beaker size={26} color={C.primary} /></View>
            <Text style={styles.emptyTitle}>{search ? 'No matching experiments' : 'No experiments yet'}</Text>
            <Text style={styles.emptyText}>
              {search
                ? 'Try a different search term.'
                : 'Create your first experiment to start building your research archive.'}
            </Text>
            {!search && (
              <TouchableOpacity style={styles.emptyAction} onPress={openCreateForm}>
                <Plus size={15} color={C.white} />
                <Text style={styles.emptyActionText}>New experiment</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {filteredExperiments.map((experiment) => {
              const laboratory = laboratoryMap.get(experiment.laboratory_id)
              return (
                <TouchableOpacity
                  key={experiment.id}
                  activeOpacity={0.8}
                  style={styles.experimentCard}
                  onPress={() => openDetails(experiment)}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardIcon}><Beaker size={19} color={C.primary} /></View>
                    <View style={styles.cardHeading}>
                      <Text style={styles.experimentTitle}>{experiment.name}</Text>
                      <Text style={styles.experimentId}>DB ID {experiment.id}</Text>
                    </View>
                    <ChevronRight size={19} color={C.subtle} />
                  </View>
                  <View style={styles.cardMetadata}>
                    <View style={styles.metadataItem}>
                      <CalendarDays size={12} color={C.muted} />
                      <Text style={styles.metadataText}>{formatDate(experiment.start_time)}</Text>
                    </View>
                    <View style={styles.metadataItem}>
                      <Clock3 size={12} color={C.muted} />
                      <Text style={styles.metadataText}>
                        {laboratory?.department || laboratory?.name || `LAB ${experiment.laboratory_id}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.researcherText}>Researcher: {experiment.started_by || 'Not specified'}</Text>
                    <StatusBadge status={mapStatus(experiment.status)} />
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        <View style={styles.footerNote}>
          <Beaker size={16} color={C.primary} />
          <Text style={styles.footerNoteText}>Your research records stay organised in LabSync.</Text>
        </View>
        <Text style={styles.footer}>LABSYNC · EXPERIMENT REGISTER</Text>
      </ScrollView>

      {/* Create and edit experiment */}
      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>RESEARCH MANAGEMENT</Text>
                <Text style={styles.modalTitle}>{editingExperiment ? 'Edit experiment' : 'New experiment'}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setFormVisible(false)}>
                <X size={19} color={C.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>LABORATORY *</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowLabPicker((v) => !v)}>
                <Text style={[styles.pickerText, !form.laboratory_id && styles.placeholderText]}>
                  {laboratoryMap.get(form.laboratory_id)?.name || 'Select laboratory'}
                </Text>
                <ChevronDown size={17} color={C.muted} />
              </TouchableOpacity>
              {showLabPicker && (
                <View style={styles.pickerOptions}>
                  {laboratories.map((lab) => (
                    <TouchableOpacity key={lab.id} style={styles.pickerOption} onPress={() => {
                      updateForm('laboratory_id', lab.id)
                      setShowLabPicker(false)
                    }}>
                      <Text style={styles.pickerOptionText}>{lab.name}</Text>
                      {!!lab.department && <Text style={styles.pickerOptionMeta}>{lab.department}</Text>}
                    </TouchableOpacity>
                  ))}
                  {laboratories.length === 0 && <Text style={styles.emptyText}>Create a laboratory before adding an experiment.</Text>}
                </View>
              )}

              <Text style={styles.fieldLabel}>EXPERIMENT NAME *</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.name}
                onChangeText={(v) => updateForm('name', v)}
                placeholder="e.g. PCR Amplification"
                placeholderTextColor={C.subtle}
              />

              <Text style={styles.fieldLabel}>DESCRIPTION</Text>
              <TextInput
                style={[styles.fieldInput, styles.multilineInput]}
                value={form.description}
                onChangeText={(v) => updateForm('description', v)}
                placeholder="Purpose, hypothesis, or procedure summary"
                placeholderTextColor={C.subtle}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>RESEARCHER / STARTED BY</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.started_by}
                onChangeText={(v) => updateForm('started_by', v)}
                placeholder="Researcher name"
                placeholderTextColor={C.subtle}
              />

              <Text style={styles.fieldLabel}>STATUS</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStatusPicker((v) => !v)}>
                <Text style={styles.pickerText}>{statusLabel(form.status)}</Text>
                <ChevronDown size={17} color={C.muted} />
              </TouchableOpacity>
              {showStatusPicker && (
                <View style={styles.pickerOptions}>
                  {STATUSES.map((status) => (
                    <TouchableOpacity key={status} style={styles.pickerOption} onPress={() => {
                      updateForm('status', status)
                      setShowStatusPicker(false)
                    }}>
                      <Text style={styles.pickerOptionText}>{statusLabel(status)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={[styles.submitButton, saving && styles.disabledButton]} onPress={submitExperiment} disabled={saving}>
                {saving ? <ActivityIndicator color={C.white} /> : <Plus size={17} color={C.white} />}
                <Text style={styles.submitButtonText}>{saving ? 'Saving...' : editingExperiment ? 'Save changes' : 'Create experiment'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Experiment details and observation timeline */}
      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={() => setDetailVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalCard, styles.detailModalCard]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalEyebrow}>EXPERIMENT RECORD · {selectedExperiment?.id ?? ''}</Text>
                <Text style={styles.modalTitle} numberOfLines={2}>{selectedExperiment?.name ?? 'Experiment details'}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setDetailVisible(false)}>
                <X size={19} color={C.ink} />
              </TouchableOpacity>
            </View>

            {selectedExperiment && (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.detailSummary}>
                  <StatusBadge status={mapStatus(selectedExperiment.status)} />
                  <Text style={styles.detailDescription}>
                    {selectedExperiment.description || 'No description has been added.'}
                  </Text>
                  <Text style={styles.detailMeta}>
                    Laboratory: {laboratoryMap.get(selectedExperiment.laboratory_id)?.name || `Lab ${selectedExperiment.laboratory_id}`}
                  </Text>
                  <Text style={styles.detailMeta}>Researcher: {selectedExperiment.started_by || 'Not specified'}</Text>
                  <Text style={styles.detailMeta}>Start date: {formatDate(selectedExperiment.start_time)}</Text>
                  {!!selectedExperiment.end_time && (
                    <Text style={styles.detailMeta}>End date: {formatDate(selectedExperiment.end_time)}</Text>
                  )}
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity style={styles.editButton} onPress={() => openEditForm(selectedExperiment)}>
                    <SquarePen size={15} color={C.primary} />
                    <Text style={styles.editButtonText}>Edit details</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>UPDATE STATUS</Text>
                <View style={styles.statusChoices}>
                  {STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.statusChoice, selectedExperiment.status === status && styles.statusChoiceActive]}
                      onPress={() => changeStatus(status)}
                      disabled={saving || selectedExperiment.status === status}
                    >
                      <Text style={[styles.statusChoiceText, selectedExperiment.status === status && styles.statusChoiceTextActive]}>
                        {statusLabel(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.timelineHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Observations</Text>
                    <Text style={styles.sectionSubtitle}>Experiment notes and activity log</Text>
                  </View>
                  <History size={18} color={C.primary} />
                </View>

                {recordsLoading ? (
                  <View style={styles.messageContainer}>
                    <ActivityIndicator color={C.primary} />
                    <Text style={styles.messageText}>Loading observations...</Text>
                  </View>
                ) : records.length === 0 ? (
                  <View style={styles.historyEmpty}>
                    <History size={25} color={C.subtle} />
                    <Text style={styles.emptyTitle}>No observations yet</Text>
                    <Text style={styles.emptyText}>Add the first note to this experiment.</Text>
                  </View>
                ) : records.map((record) => (
                  <View key={record.id} style={styles.recordRow}>
                    <View style={styles.recordDot} />
                    <View style={styles.recordContent}>
                      <View style={styles.recordTop}>
                        <Text style={styles.recordType}>{record.record_type || 'OBSERVATION'}</Text>
                        <Text style={styles.recordDate}>{formatDate(record.created_at)}</Text>
                      </View>
                      <Text style={styles.recordNotes}>{record.notes}</Text>
                      {!!record.recorded_by && <Text style={styles.recordAuthor}>Recorded by {record.recorded_by}</Text>}
                    </View>
                  </View>
                ))}

                <View style={styles.addRecordPanel}>
                  <Text style={styles.addRecordTitle}>Add an observation</Text>
                  <Text style={styles.fieldLabel}>RECORD TYPE</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={recordType}
                    onChangeText={setRecordType}
                    placeholder="OBSERVATION"
                    placeholderTextColor={C.subtle}
                    autoCapitalize="characters"
                  />
                  <Text style={styles.fieldLabel}>RECORDED BY</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={recordedBy}
                    onChangeText={setRecordedBy}
                    placeholder="Researcher name (optional)"
                    placeholderTextColor={C.subtle}
                  />
                  <Text style={styles.fieldLabel}>NOTES *</Text>
                  <TextInput
                    style={[styles.fieldInput, styles.multilineInput]}
                    value={recordNotes}
                    onChangeText={setRecordNotes}
                    placeholder="Record results, observations, or progress..."
                    placeholderTextColor={C.subtle}
                    multiline
                    textAlignVertical="top"
                  />
                  <TouchableOpacity style={[styles.submitButton, savingRecord && styles.disabledButton]} onPress={submitRecord} disabled={savingRecord}>
                    {savingRecord ? <ActivityIndicator color={C.white} /> : <Plus size={16} color={C.white} />}
                    <Text style={styles.submitButtonText}>{savingRecord ? 'Saving...' : 'Save observation'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  backButton: {
    width: 40, height: 40, borderRadius: R.md, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1, marginLeft: 12 },
  eyebrow: { color: C.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: C.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.7, marginTop: 2 },
  subtitle: { color: C.muted, fontSize: 11, marginTop: 3 },
  addButton: {
    width: 42, height: 42, borderRadius: R.md, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', ...S.floating,
  },
  heroCard: { backgroundColor: C.primary, borderRadius: R.xl, padding: 19, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroEyebrow: { color: '#DCE9E3', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: C.white, fontSize: 21, fontWeight: '800', letterSpacing: -0.5, marginTop: 17 },
  heroDescription: { color: '#DCE9E3', fontSize: 11, lineHeight: 18, marginTop: 7, maxWidth: 270 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  heroMetric: { flex: 1 },
  heroMetricValue: { color: C.white, fontSize: 22, fontWeight: '800' },
  heroMetricLabel: { color: '#DCE9E3', fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginTop: 3 },
  heroMetricDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 15 },
  summaryGrid: { flexDirection: 'row', gap: 9, marginTop: 13 },
  summaryItem: { flex: 1, padding: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, ...S.card },
  summaryIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryValue: { color: C.ink, fontSize: 21, fontWeight: '800', marginTop: 10 },
  summaryLabel: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.6, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 29, marginBottom: 14 },
  sectionTitle: { color: C.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  sectionSubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  countBadge: { minWidth: 32, height: 32, borderRadius: R.md, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText: { color: C.primary, fontSize: 12, fontWeight: '800' },
  searchBox: { height: 47, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 13 },
  searchInput: { flex: 1, marginLeft: 9, color: C.ink, fontSize: 12 },
  list: { gap: 11 },
  experimentCard: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: 15, ...S.card },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardHeading: { flex: 1, marginLeft: 11 },
  experimentTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  experimentId: { color: C.subtle, fontSize: 9, fontWeight: '700', marginTop: 4 },
  cardMetadata: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 14 },
  metadataItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metadataText: { color: C.muted, fontSize: 10, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.divider, gap: 8 },
  researcherText: { color: C.muted, fontSize: 9, flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: R.pill },
  statusDot: { width: 6, height: 6, borderRadius: 4 },
  statusText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  messageContainer: { alignItems: 'center', paddingVertical: 35, gap: 12 },
  messageText: { color: C.muted, fontSize: 12 },
  stateCard: { alignItems: 'center', padding: 25, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border },
  errorTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  errorText: { color: C.danger, fontSize: 11, textAlign: 'center', marginTop: 7 },
  retryButton: { marginTop: 15, backgroundColor: C.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: R.md },
  retryText: { color: C.white, fontSize: 11, fontWeight: '800' },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: C.ink, fontSize: 14, fontWeight: '800', marginTop: 12 },
  emptyText: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 6 },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.primary, paddingHorizontal: 15, paddingVertical: 10, borderRadius: R.md, marginTop: 16 },
  emptyActionText: { color: C.white, fontSize: 11, fontWeight: '800' },
  footerNote: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: R.md, backgroundColor: C.primaryLight, marginTop: 23 },
  footerNoteText: { color: C.primaryDark, fontSize: 10, fontWeight: '600' },
  footer: { color: C.subtle, fontSize: 8, fontWeight: '800', letterSpacing: 1.2, textAlign: 'center', marginTop: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(20, 35, 29, 0.48)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '92%', backgroundColor: C.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 21, paddingBottom: 28 },
  detailModalCard: { maxHeight: '94%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 19 },
  modalEyebrow: { color: C.primary, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  modalTitle: { color: C.ink, fontSize: 21, fontWeight: '800', marginTop: 3 },
  closeButton: { width: 35, height: 35, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 13, marginBottom: 7 },
  fieldInput: { minHeight: 45, borderWidth: 1, borderColor: C.border, borderRadius: R.md, backgroundColor: C.surface, paddingHorizontal: 13, color: C.ink, fontSize: 12 },
  multilineInput: { minHeight: 82, paddingTop: 11 },
  pickerButton: { minHeight: 45, borderWidth: 1, borderColor: C.border, borderRadius: R.md, backgroundColor: C.surface, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerText: { color: C.ink, fontSize: 12 },
  placeholderText: { color: C.subtle },
  pickerOptions: { marginTop: 5, borderWidth: 1, borderColor: C.border, borderRadius: R.md, backgroundColor: C.surface, overflow: 'hidden' },
  pickerOption: { paddingHorizontal: 13, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.divider },
  pickerOptionText: { color: C.ink, fontSize: 12, fontWeight: '700' },
  pickerOptionMeta: { color: C.muted, fontSize: 9, marginTop: 3 },
  submitButton: { minHeight: 47, marginTop: 21, borderRadius: R.md, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  disabledButton: { opacity: 0.65 },
  submitButtonText: { color: C.white, fontSize: 12, fontWeight: '800' },
  detailSummary: { padding: 14, borderRadius: R.lg, backgroundColor: C.primaryLight, gap: 8 },
  detailDescription: { color: C.primaryDark, fontSize: 11, lineHeight: 17, marginTop: 3 },
  detailMeta: { color: C.primary, fontSize: 10, fontWeight: '600' },
  detailActions: { flexDirection: 'row', marginTop: 12 },
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 13, paddingVertical: 10, borderRadius: R.md },
  editButtonText: { color: C.primary, fontSize: 10, fontWeight: '800' },
  statusChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  statusChoice: { borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 10, paddingVertical: 8, borderRadius: R.pill },
  statusChoiceActive: { backgroundColor: C.primary, borderColor: C.primary },
  statusChoiceText: { color: C.muted, fontSize: 8, fontWeight: '800' },
  statusChoiceTextActive: { color: C.white },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 10 },
  historyEmpty: { alignItems: 'center', paddingVertical: 25, backgroundColor: C.surface, borderRadius: R.md },
  recordRow: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.divider },
  recordDot: { width: 8, height: 8, borderRadius: 5, backgroundColor: C.primary, marginTop: 5 },
  recordContent: { flex: 1 },
  recordTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  recordType: { color: C.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  recordDate: { color: C.subtle, fontSize: 8, fontWeight: '700' },
  recordNotes: { color: C.ink, fontSize: 11, lineHeight: 17, marginTop: 5 },
  recordAuthor: { color: C.muted, fontSize: 9, marginTop: 5 },
  addRecordPanel: { marginTop: 20, padding: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg },
  addRecordTitle: { color: C.ink, fontSize: 13, fontWeight: '800' },
})
