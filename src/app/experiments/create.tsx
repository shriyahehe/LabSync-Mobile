
import { router } from 'expo-router'
import { ArrowLeft, Beaker, Check, ChevronDown } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

import {
    createExperiment,
    getLaboratories,
} from '@/services/api'

import type {
    CreateExperimentInput,
    Laboratory,
} from '@/services/types'

const COLORS = {
  background: '#F5F3EC',
  paper: '#FCFBF7',
  ink: '#172A36',
  muted: '#65747C',
  green: '#176B63',
  softGreen: '#DCE9E3',
  border: '#D8DDD8',
  white: '#FFFFFF',
  red: '#B84545',
}

export default function CreateExperimentScreen() {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [selectedLab, setSelectedLab] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [researcher, setResearcher] = useState('')
  const [description, setDescription] = useState('')

  const [loadingLabs, setLoadingLabs] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showLabs, setShowLabs] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLaboratories()
  }, [])

  async function loadLaboratories() {
    try {
      setError('')
      const data = await getLaboratories()
      setLaboratories(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load laboratories.'
      )
    } finally {
      setLoadingLabs(false)
    }
  }

  const selectedLaboratory = laboratories.find(
    (lab) => lab.id === selectedLab
  )

  async function handleCreateExperiment() {
    if (!name.trim()) {
      Alert.alert('Missing information', 'Please enter an experiment name.')
      return
    }

    if (!selectedLab) {
      Alert.alert('Missing information', 'Please select a laboratory.')
      return
    }

    if (!researcher.trim()) {
      Alert.alert('Missing information', 'Please enter the researcher name.')
      return
    }

    const input: CreateExperimentInput = {
      laboratory_id: selectedLab,
      name: name.trim(),
      description: description.trim(),
      started_by: researcher.trim(),
      status: 'PLANNED',
    }

    try {
      setSaving(true)

      const createdExperiment = await createExperiment(input)

      Alert.alert(
        'Experiment created',
        `${createdExperiment.name} has been successfully added.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      )
    } catch (err) {
      Alert.alert(
        'Creation failed',
        err instanceof Error
          ? err.message
          : 'Unable to create experiment. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {/* Header */}
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
              <Text style={styles.title}>New Experiment</Text>
            </View>

            <View style={styles.headerIcon}>
              <Beaker size={21} color={COLORS.green} />
            </View>
          </View>

          <View style={styles.rule} />

          {/* Introduction */}
          <View style={styles.intro}>
            <Text style={styles.sectionTitle}>
              Experiment Details
            </Text>
            <Text style={styles.subtitle}>
              Enter the information below to register a new laboratory experiment.
            </Text>
          </View>

          {/* Experiment Name */}
          <View style={styles.field}>
            <Text style={styles.label}>EXPERIMENT NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Protein Purification"
              placeholderTextColor={COLORS.muted}
              value={name}
              onChangeText={setName}
              maxLength={150}
            />
          </View>

          {/* Laboratory Selection */}
          <View style={styles.field}>
            <Text style={styles.label}>LABORATORY *</Text>

            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowLabs(!showLabs)}
              disabled={loadingLabs || laboratories.length === 0}
            >
              <Text
                style={[
                  styles.selectText,
                  !selectedLaboratory && styles.placeholder,
                ]}
              >
                {loadingLabs
                  ? 'Loading laboratories...'
                  : selectedLaboratory?.name || 'Select a laboratory'}
              </Text>

              {loadingLabs ? (
                <ActivityIndicator color={COLORS.green} size="small" />
              ) : (
                <ChevronDown size={19} color={COLORS.green} />
              )}
            </TouchableOpacity>

            {showLabs && (
              <View style={styles.labList}>
                {laboratories.map((lab) => (
                  <TouchableOpacity
                    key={lab.id}
                    style={styles.labOption}
                    onPress={() => {
                      setSelectedLab(lab.id)
                      setShowLabs(false)
                    }}
                  >
                    <View style={styles.labOptionText}>
                      <Text style={styles.labName}>{lab.name}</Text>
                      <Text style={styles.labDepartment}>
                        {lab.department} · {lab.location}
                      </Text>
                    </View>

                    {selectedLab === lab.id && (
                      <Check size={18} color={COLORS.green} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!!error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={loadLaboratories}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loadingLabs && !error && laboratories.length === 0 && (
              <Text style={styles.helperText}>
                No laboratories found. Please add a laboratory first.
              </Text>
            )}
          </View>

          {/* Researcher */}
          <View style={styles.field}>
            <Text style={styles.label}>RESEARCHER / STARTED BY *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter researcher name"
              placeholderTextColor={COLORS.muted}
              value={researcher}
              onChangeText={setResearcher}
              maxLength={100}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the purpose of this experiment..."
              placeholderTextColor={COLORS.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
          </View>

          {/* Status */}
          <View style={styles.statusCard}>
            <View>
              <Text style={styles.label}>INITIAL STATUS</Text>
              <Text style={styles.statusDescription}>
                New experiments are created as planned.
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>PLANNED</Text>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.createButton,
              (saving || loadingLabs || laboratories.length === 0) &&
                styles.disabledButton,
            ]}
            onPress={handleCreateExperiment}
            disabled={saving || loadingLabs || laboratories.length === 0}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.createButtonText}>
                Create Experiment
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            * Required fields
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.green,
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: 3,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rule: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 22,
    marginBottom: 25,
  },
  intro: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.ink,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 6,
  },
  field: {
    marginBottom: 21,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: COLORS.muted,
    marginBottom: 9,
  },
  input: {
    minHeight: 51,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.paper,
    paddingHorizontal: 15,
    fontSize: 14,
    color: COLORS.ink,
  },
  textArea: {
    minHeight: 115,
    paddingTop: 14,
  },
  selectButton: {
    minHeight: 51,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.paper,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 14,
    color: COLORS.ink,
    flex: 1,
  },
  placeholder: {
    color: COLORS.muted,
  },
  labList: {
    marginTop: 8,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  labOption: {
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  labOptionText: {
    flex: 1,
  },
  labName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
  },
  labDepartment: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
  errorContainer: {
    marginTop: 9,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: COLORS.softGreen,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statusDescription: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
  },
  statusBadge: {
    backgroundColor: COLORS.paper,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.green,
    letterSpacing: 0.5,
  },
  createButton: {
    minHeight: 53,
    borderRadius: 13,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.55,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  footerNote: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 14,
  },
})
