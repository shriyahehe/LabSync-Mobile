
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FlaskConical,
  LogIn,
  LogOut,
  RefreshCw,
  Users,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  checkInResearcher,
  checkOutResearcher,
  getActiveLabEntries,
  getLabEntries,
  getLaboratories,
} from '../../services/api'

import type {
  LabEntry,
  Laboratory,
} from '../../services/types'

const COLORS = {
  background: '#F5F3EC',
  card: '#FCFBF7',
  ink: '#172A36',
  muted: '#65747C',
  green: '#176B63',
  softGreen: '#DCE9E3',
  border: '#D8DDD8',
  orange: '#B77932',
  softOrange: '#F4E9D8',
  red: '#B34C43',
  softRed: '#F5E5E2',
  white: '#FFFFFF',
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Time unavailable'
  }

  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getDuration(start: string, end?: string | null) {
  const startTime = new Date(start).getTime()
  const endTime = end ? new Date(end).getTime() : Date.now()

  if (
    Number.isNaN(startTime) ||
    Number.isNaN(endTime) ||
    endTime < startTime
  ) {
    return '—'
  }

  const totalMinutes = Math.floor((endTime - startTime) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  return `${hours} hr ${minutes} min`
}

export default function LabEntryScreen() {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [selectedLabId, setSelectedLabId] = useState<number | null>(null)

  const [activeEntries, setActiveEntries] = useState<LabEntry[]>([])
  const [history, setHistory] = useState<LabEntry[]>([])

  const [researcherName, setResearcherName] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [checkingOutId, setCheckingOutId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const selectedLab = useMemo(
    () => laboratories.find((lab) => lab.id === selectedLabId) ?? null,
    [laboratories, selectedLabId]
  )

  const activeForSelectedLab = useMemo(
    () =>
      activeEntries.filter(
        (entry) => entry.laboratory_id === selectedLabId
      ),
    [activeEntries, selectedLabId]
  )

  const loadLaboratories = useCallback(async () => {
    const data = await getLaboratories()
    setLaboratories(data)

    setSelectedLabId((currentId) => {
      if (currentId && data.some((lab) => lab.id === currentId)) {
        return currentId
      }

      return data[0]?.id ?? null
    })
  }, [])

  const loadEntries = useCallback(async (labId: number) => {
    const [active, records] = await Promise.all([
      getActiveLabEntries(),
      getLabEntries(labId),
    ])

    setActiveEntries(active)
    setHistory(records)
  }, [])

  const loadScreen = useCallback(async () => {
    setError('')

    try {
      await loadLaboratories()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load laboratories.'
      )
    }
  }, [loadLaboratories])

  useEffect(() => {
    let mounted = true

    async function initialize() {
      try {
        setLoading(true)
        setError('')

        const data = await getLaboratories()

        if (!mounted) return

        setLaboratories(data)
        setSelectedLabId((currentId) => {
          if (currentId && data.some((lab) => lab.id === currentId)) {
            return currentId
          }

          return data[0]?.id ?? null
        })
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load laboratories.'
          )
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (selectedLabId === null) {
      setActiveEntries([])
      setHistory([])
      return
    }

    let mounted = true

    async function fetchEntries() {
      try {
        setError('')
        const [active, records] = await Promise.all([
          getActiveLabEntries(),
          getLabEntries(selectedLabId!),
        ])

        if (mounted) {
          setActiveEntries(active)
          setHistory(records)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load lab entry records.'
          )
        }
      }
    }

    fetchEntries()

    return () => {
      mounted = false
    }
  }, [selectedLabId])

  const refresh = async () => {
    setRefreshing(true)

    try {
      await loadLaboratories()

      if (selectedLabId !== null) {
        await loadEntries(selectedLabId)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to refresh records.'
      )
    } finally {
      setRefreshing(false)
    }
  }

  const handleCheckIn = async () => {
    const cleanName = researcherName.trim()

    if (!selectedLabId) {
      Alert.alert('Select a laboratory', 'Choose a laboratory first.')
      return
    }

    if (!cleanName) {
      Alert.alert('Name required', 'Enter the researcher name.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await checkInResearcher({
        laboratory_id: selectedLabId,
        researcher_name: cleanName,
        notes: notes.trim(),
      })

      setResearcherName('')
      setNotes('')

      await loadEntries(selectedLabId)

      Alert.alert(
        'Check-in successful',
        `${cleanName} has been checked into ${selectedLab?.name ?? 'the laboratory'}.`
      )
    } catch (err) {
      Alert.alert(
        'Check-in failed',
        err instanceof Error
          ? err.message
          : 'Unable to check in researcher.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const performCheckOut = async (entry: LabEntry) => {
    setCheckingOutId(entry.id)
    setError('')

    try {
      await checkOutResearcher(entry.id)

      if (selectedLabId !== null) {
        await loadEntries(selectedLabId)
      }

      Alert.alert(
        'Check-out successful',
        `${entry.researcher_name} has been checked out.`
      )
    } catch (err) {
      Alert.alert(
        'Check-out failed',
        err instanceof Error
          ? err.message
          : 'Unable to check out researcher.'
      )
    } finally {
      setCheckingOutId(null)
    }
  }

  const confirmCheckOut = (entry: LabEntry) => {
    Alert.alert(
      'Confirm check-out',
      `Check out ${entry.researcher_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Check out',
          onPress: () => performCheckOut(entry),
        },
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.loadingText}>
            Loading laboratory records...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={COLORS.green}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              LABORATORY FIELD REGISTER
            </Text>
            <Text style={styles.title}>Lab Entry</Text>
            <Text style={styles.subtitle}>
              Researcher attendance and access records
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Clock size={24} color={COLORS.green} />
          </View>
        </View>

        <View style={styles.headerRule} />

        {/* ERROR */}

        {!!error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color={COLORS.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* LABORATORY SELECTOR */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>01</Text>
          <Text style={styles.sectionTitle}>SELECT LABORATORY</Text>
        </View>

        {laboratories.length === 0 ? (
          <View style={styles.emptyCard}>
            <FlaskConical size={25} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>
              No laboratories found
            </Text>
            <Text style={styles.emptyText}>
              Add a laboratory before recording researcher attendance.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.labSelector}
          >
            {laboratories.map((lab) => {
              const selected = selectedLabId === lab.id

              return (
                <TouchableOpacity
                  key={lab.id}
                  style={[
                    styles.labChip,
                    selected && styles.labChipSelected,
                  ]}
                  onPress={() => setSelectedLabId(lab.id)}
                  activeOpacity={0.75}
                >
                  <FlaskConical
                    size={16}
                    color={selected ? COLORS.white : COLORS.green}
                  />
                  <View>
                    <Text
                      style={[
                        styles.labChipTitle,
                        selected && styles.labChipTextSelected,
                      ]}
                    >
                      {lab.name}
                    </Text>
                    <Text
                      style={[
                        styles.labChipSubtext,
                        selected && styles.labChipTextSelected,
                      ]}
                    >
                      {lab.department}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}

        {/* CHECK-IN FORM */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>02</Text>
          <Text style={styles.sectionTitle}>RESEARCHER CHECK-IN</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeading}>
            <View style={styles.formIcon}>
              <LogIn size={20} color={COLORS.green} />
            </View>
            <View style={styles.formHeadingText}>
              <Text style={styles.cardTitle}>Register entry</Text>
              <Text style={styles.cardSubtitle}>
                Record a researcher entering the laboratory
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>RESEARCHER NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            placeholderTextColor="#9AA5A5"
            value={researcherName}
            onChangeText={setResearcherName}
            autoCapitalize="words"
            editable={!submitting && !!selectedLabId}
            returnKeyType="next"
          />

          <Text style={styles.inputLabel}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Purpose of visit or additional notes"
            placeholderTextColor="#9AA5A5"
            value={notes}
            onChangeText={setNotes}
            multiline
            editable={!submitting && !!selectedLabId}
          />

          <TouchableOpacity
            style={[
              styles.checkInButton,
              (submitting || !selectedLabId) && styles.disabledButton,
            ]}
            onPress={handleCheckIn}
            disabled={submitting || !selectedLabId}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <LogIn size={18} color={COLORS.white} />
                <Text style={styles.checkInButtonText}>
                  Check In Researcher
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ACTIVE RESEARCHERS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>03</Text>
          <Text style={styles.sectionTitle}>CURRENTLY IN LAB</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsIcon}>
            <Users size={23} color={COLORS.green} />
          </View>

          <View style={styles.statsText}>
            <Text style={styles.statsNumber}>
              {activeForSelectedLab.length}
            </Text>
            <Text style={styles.statsLabel}>
              Active researchers
            </Text>
          </View>

          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>ACTIVE</Text>
          </View>
        </View>

        {activeForSelectedLab.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={24} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>
              No active researchers
            </Text>
            <Text style={styles.emptyText}>
              Researchers checked into this laboratory will appear here.
            </Text>
          </View>
        ) : (
          activeForSelectedLab.map((entry) => (
            <View key={entry.id} style={styles.activeCard}>
              <View style={styles.researcherAvatar}>
                <Text style={styles.avatarLetter}>
                  {entry.researcher_name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.researcherInfo}>
                <Text style={styles.researcherName}>
                  {entry.researcher_name}
                </Text>
                <Text style={styles.researcherMeta}>
                  Checked in: {formatDateTime(entry.check_in)}
                </Text>
                <Text style={styles.durationText}>
                  Duration: {getDuration(entry.check_in)}
                </Text>
                {!!entry.notes && (
                  <Text style={styles.entryNotes}>
                    {entry.notes}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.checkOutButton,
                  checkingOutId === entry.id && styles.disabledButton,
                ]}
                onPress={() => confirmCheckOut(entry)}
                disabled={checkingOutId !== null}
                activeOpacity={0.75}
              >
                {checkingOutId === entry.id ? (
                  <ActivityIndicator size="small" color={COLORS.red} />
                ) : (
                  <>
                    <LogOut size={15} color={COLORS.red} />
                    <Text style={styles.checkOutText}>Out</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* ATTENDANCE HISTORY */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>04</Text>
          <Text style={styles.sectionTitle}>ATTENDANCE HISTORY</Text>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <CalendarDays size={24} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>
              No attendance records yet
            </Text>
            <Text style={styles.emptyText}>
              Completed and active visits will appear here.
            </Text>
          </View>
        ) : (
          history.map((entry) => {
            const isActive = entry.check_out === null

            return (
              <View key={entry.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <View style={styles.historyPerson}>
                    <Text style={styles.historyName}>
                      {entry.researcher_name}
                    </Text>
                    <Text style={styles.historyDate}>
                      {formatDateTime(entry.check_in)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isActive
                        ? styles.statusActive
                        : styles.statusComplete,
                    ]}
                  >
                    {isActive ? (
                      <ActivityIndicator
                        size="small"
                        color={COLORS.green}
                      />
                    ) : (
                      <CheckCircle2
                        size={12}
                        color={COLORS.green}
                      />
                    )}
                    <Text style={styles.statusText}>
                      {isActive ? 'Active' : 'Completed'}
                    </Text>
                  </View>
                </View>

                <View style={styles.historyDivider} />

                <View style={styles.historyDetails}>
                  <View style={styles.historyDetail}>
                    <Text style={styles.detailLabel}>CHECK-IN</Text>
                    <Text style={styles.detailValue}>
                      {new Date(entry.check_in).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <View style={styles.historyDetail}>
                    <Text style={styles.detailLabel}>CHECK-OUT</Text>
                    <Text style={styles.detailValue}>
                      {entry.check_out
                        ? new Date(entry.check_out).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </Text>
                  </View>

                  <View style={styles.historyDetail}>
                    <Text style={styles.detailLabel}>DURATION</Text>
                    <Text style={styles.detailValue}>
                      {getDuration(entry.check_in, entry.check_out)}
                    </Text>
                  </View>
                </View>

                {!!entry.notes && (
                  <Text style={styles.historyNotes}>
                    Note: {entry.notes}
                  </Text>
                )}
              </View>
            )
          })
        )}

        {/* FOOTER */}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={COLORS.green} />
          ) : (
            <RefreshCw size={15} color={COLORS.green} />
          )}
          <Text style={styles.refreshText}>
            Refresh attendance records
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>LABSYNC</Text>
          <Text style={styles.footerText}>
            Laboratory Field Register
          </Text>
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
    paddingTop: 18,
    paddingBottom: 45,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 13,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    color: COLORS.orange,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  title: {
    color: COLORS.ink,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  headerRule: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },

  errorBanner: {
    backgroundColor: COLORS.softRed,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 9,
  },

  errorText: {
    flex: 1,
    color: COLORS.red,
    fontSize: 11,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    marginBottom: 12,
  },

  sectionNumber: {
    color: COLORS.orange,
    fontSize: 10,
    fontWeight: '900',
    marginRight: 9,
  },

  sectionTitle: {
    color: COLORS.ink,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  labSelector: {
    gap: 9,
    paddingBottom: 5,
  },

  labChip: {
    minWidth: 160,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  labChipSelected: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  labChipTitle: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '700',
  },

  labChipSubtext: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 3,
  },

  labChipTextSelected: {
    color: COLORS.white,
  },

  formCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 16,
  },

  formHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  formIcon: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.softGreen,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  formHeadingText: {
    marginLeft: 11,
    flex: 1,
  },

  cardTitle: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: '800',
  },

  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },

  inputLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    paddingHorizontal: 12,
    color: COLORS.ink,
    fontSize: 13,
  },

  notesInput: {
    minHeight: 75,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  checkInButton: {
    backgroundColor: COLORS.green,
    minHeight: 48,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 18,
  },

  checkInButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.55,
  },

  statsCard: {
    backgroundColor: COLORS.softGreen,
    borderRadius: 9,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  statsIcon: {
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsText: {
    marginLeft: 12,
    flex: 1,
  },

  statsNumber: {
    color: COLORS.ink,
    fontSize: 24,
    fontWeight: '800',
  },

  statsLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 1,
  },

  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },

  liveText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 23,
    alignItems: 'center',
  },

  emptyTitle: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 5,
  },

  activeCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  researcherAvatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: COLORS.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarLetter: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: '800',
  },

  researcherInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 7,
  },

  researcherName: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '800',
  },

  researcherMeta: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
  },

  durationText: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },

  entryNotes: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
  },

  checkOutButton: {
    backgroundColor: COLORS.softRed,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  checkOutText: {
    color: COLORS.red,
    fontSize: 10,
    fontWeight: '800',
  },

  historyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    padding: 14,
    marginBottom: 9,
  },

  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  historyPerson: {
    flex: 1,
    paddingRight: 8,
  },

  historyName: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '800',
  },

  historyDate: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
  },

  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statusActive: {
    backgroundColor: COLORS.softGreen,
  },

  statusComplete: {
    backgroundColor: '#E8EEE8',
  },

  statusText: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: '800',
  },

  historyDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },

  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  historyDetail: {
    flex: 1,
  },

  detailLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  detailValue: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },

  historyNotes: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 12,
  },

  refreshButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginTop: 14,
  },

  refreshText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '700',
  },

  footer: {
    alignItems: 'center',
    marginTop: 20,
  },

  footerBrand: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 4,
  },
})
