
import { router } from 'expo-router'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  History,
  RefreshCw,
  Search,
  UserRound,
  Wrench,
  X,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  createEquipmentTransaction,
  getEquipment,
  getEquipmentTransactions,
  getResearchers,
} from '@/services/api'

import type {
  Equipment,
  EquipmentTransaction,
  Researcher,
} from '@/services/types'

import {
  LabSyncColors as C,
  LabSyncRadius as R,
  LabSyncShadows as S,
  LabSyncSpacing as SP,
  LabSyncTypography as T,
} from '@/constants/labsync-theme'

type EquipmentStatus = 'IN_USE' | 'AVAILABLE' | 'MAINTENANCE'
type ActionType = 'CHECKOUT' | 'RETURN'

const getStatusStyle = (status: EquipmentStatus) => {
  switch (status) {
    case 'IN_USE':
      return {
        label: 'IN USE',
        backgroundColor: C.primaryLight,
        color: C.primary,
      }
    case 'AVAILABLE':
      return {
        label: 'AVAILABLE',
        backgroundColor: C.secondaryLight,
        color: C.secondary,
      }
    case 'MAINTENANCE':
      return {
        label: 'MAINTENANCE',
        backgroundColor: C.dangerLight,
        color: C.danger,
      }
  }
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [transactions, setTransactions] = useState<EquipmentTransaction[]>([])
  const [researchers, setResearchers] = useState<Researcher[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [historyVisible, setHistoryVisible] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [actionType, setActionType] = useState<ActionType>('CHECKOUT')
  const [selectedResearcherId, setSelectedResearcherId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [legacyReturnName, setLegacyReturnName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    setError('')

    try {
      const [equipmentData, transactionData, researcherData] =
        await Promise.all([
          getEquipment(),
          getEquipmentTransactions(),
          getResearchers(),
        ])

      setEquipment(equipmentData)
      setTransactions(transactionData)
      setResearchers(researcherData)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load equipment data.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const activeResearchers = useMemo(
    () => researchers.filter((researcher) => researcher.status === 'ACTIVE'),
    [researchers]
  )

  const filteredEquipment = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return equipment

    return equipment.filter((item) =>
      [
        String(item.id),
        item.name,
        item.category,
        item.location,
        item.serial_number,
        item.status,
      ].some((value) => (value ?? '').toLowerCase().includes(query))
    )
  }, [equipment, search])

  const inUse = equipment.filter((item) => item.status === 'IN_USE').length
  const available = equipment.filter((item) => item.status === 'AVAILABLE').length
  const maintenance = equipment.filter((item) => item.status === 'MAINTENANCE').length

  const getActiveCheckout = (equipmentId: number) =>
    transactions.find(
      (transaction) =>
        transaction.equipment_id === equipmentId &&
        transaction.transaction_type === 'CHECKOUT' &&
        !transaction.return_time
    )

  const openAction = (item: Equipment, action: ActionType) => {
    const activeCheckout = getActiveCheckout(item.id)

    setSelectedEquipment(item)
    setActionType(action)
    setNotes('')
    setSelectedResearcherId(null)
    setLegacyReturnName('')

    if (action === 'RETURN' && activeCheckout) {
      if (activeCheckout.researcher_id) {
        setSelectedResearcherId(activeCheckout.researcher_id)
      } else {
        setLegacyReturnName(activeCheckout.performed_by)
      }
    }

    setModalVisible(true)
  }

  const submitTransaction = async () => {
    if (!selectedEquipment) return

    const activeCheckout = getActiveCheckout(selectedEquipment.id)
    let researcher: Researcher | undefined

    if (actionType === 'CHECKOUT') {
      if (!selectedResearcherId) {
        Alert.alert('Select researcher', 'Please select a researcher before checkout.')
        return
      }

      researcher = activeResearchers.find(
        (item) => item.id === selectedResearcherId
      )

      if (!researcher) {
        Alert.alert('Invalid researcher', 'Please select an active researcher.')
        return
      }
    }

    if (actionType === 'RETURN') {
      if (!activeCheckout) {
        Alert.alert('No active checkout', 'No active checkout record was found.')
        return
      }

      if (activeCheckout.researcher_id) {
        if (selectedResearcherId !== activeCheckout.researcher_id) {
          Alert.alert(
            'Return not allowed',
            'Only the researcher who checked out this equipment can return it.'
          )
          return
        }

        researcher = activeResearchers.find(
          (item) => item.id === selectedResearcherId
        )

        if (!researcher) {
          Alert.alert('Researcher unavailable', 'The original researcher is not active.')
          return
        }
      } else if (!legacyReturnName.trim()) {
        Alert.alert('Missing researcher', 'The original checkout name is required.')
        return
      }
    }

    setSubmitting(true)

    try {
      await createEquipmentTransaction({
        equipment_id: selectedEquipment.id,
        transaction_type: actionType,
        researcher_id: researcher?.id,
        performed_by: researcher?.full_name ?? legacyReturnName.trim(),
        notes: notes.trim(),
      })

      setModalVisible(false)

      Alert.alert(
        actionType === 'CHECKOUT' ? 'Equipment checked out' : 'Equipment returned',
        `${selectedEquipment.name} has been updated successfully.`
      )

      await loadData(true)
    } catch (err) {
      Alert.alert(
        'Transaction failed',
        err instanceof Error ? err.message : 'Unable to complete transaction.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const openHistory = (item: Equipment) => {
    setSelectedEquipment(item)
    setHistoryVisible(true)
  }

  const selectedHistory = useMemo(() => {
    if (!selectedEquipment) return []

    return transactions
      .filter((transaction) => transaction.equipment_id === selectedEquipment.id)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
  }, [selectedEquipment, transactions])

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={C.primary}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={19} color={C.ink} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>LABORATORY MANAGEMENT</Text>
            <Text style={styles.title}>Equipment</Text>
            <Text style={styles.subtitle}>
              Your laboratory instruments at a glance.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => loadData(true)}
            accessibilityLabel="Refresh equipment"
          >
            <RefreshCw size={19} color={C.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View>
              <Text style={styles.overviewEyebrow}>EQUIPMENT OVERVIEW</Text>
              <Text style={styles.overviewTitle}>Instrument status</Text>
            </View>
            <View style={styles.overviewIcon}>
              <Wrench size={19} color={C.primary} />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{String(inUse).padStart(2, '0')}</Text>
              <Text style={styles.statLabel}>IN USE</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{String(available).padStart(2, '0')}</Text>
              <Text style={styles.statLabel}>AVAILABLE</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: C.danger }]}>
                {String(maintenance).padStart(2, '0')}
              </Text>
              <Text style={styles.statLabel}>ATTENTION</Text>
            </View>
          </View>

          <View style={styles.overviewFooter}>
            <View style={styles.progressTrack}>
              {inUse + available + maintenance > 0 ? (
                <>
                  <View style={[styles.progressSegment, { flex: inUse, backgroundColor: C.primary }]} />
                  <View style={[styles.progressSegment, { flex: available, backgroundColor: C.secondary }]} />
                  <View style={[styles.progressSegment, { flex: maintenance, backgroundColor: C.danger }]} />
                </>
              ) : null}
            </View>
            <Text style={styles.totalLabel}>
              {equipment.length} registered instruments
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={18} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search equipment, ID or laboratory..."
            placeholderTextColor={C.subtle}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <AlertTriangle size={20} color={C.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadData()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>INSTRUMENTATION</Text>
            <Text style={styles.sectionTitle}>Equipment register</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredEquipment.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Loading equipment...</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredEquipment.map((item) => {
              const statusStyle = getStatusStyle(item.status)
              const activeCheckout = getActiveCheckout(item.id)

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.idContainer}>
                      <View style={styles.equipmentIcon}>
                        <Wrench size={17} color={C.primary} />
                      </View>
                      <Text style={styles.equipmentId}>
                        EQ-{String(item.id).padStart(3, '0')}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.backgroundColor },
                      ]}
                    >
                      {item.status === 'MAINTENANCE' && (
                        <AlertTriangle size={11} color={statusStyle.color} />
                      )}
                      <Text style={[styles.statusText, { color: statusStyle.color }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.equipmentName}>{item.name}</Text>

                  <View style={styles.labRow}>
                    <View style={styles.labDot} />
                    <Text style={styles.labText}>
                      {item.location || 'Laboratory not specified'}
                    </Text>
                  </View>

                  <Text style={styles.metadataText}>
                    {item.category || 'General equipment'}
                    {item.serial_number ? `  ·  ${item.serial_number}` : ''}
                  </Text>

                  {activeCheckout && (
                    <View style={styles.borrowerRow}>
                      <UserRound size={14} color={C.primary} />
                      <Text style={styles.borrowerText}>
                        With {activeCheckout.performed_by}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardActions}>
                    {item.status === 'AVAILABLE' && (
                      <TouchableOpacity
                        style={styles.checkoutButton}
                        onPress={() => openAction(item, 'CHECKOUT')}
                      >
                        <Text style={styles.checkoutButtonText}>Check out</Text>
                      </TouchableOpacity>
                    )}

                    {item.status === 'IN_USE' && (
                      <TouchableOpacity
                        style={styles.returnButton}
                        onPress={() => openAction(item, 'RETURN')}
                      >
                        <Text style={styles.returnButtonText}>Return</Text>
                      </TouchableOpacity>
                    )}

                    {item.status === 'MAINTENANCE' && (
                      <View style={styles.maintenanceLabel}>
                        <AlertTriangle size={13} color={C.danger} />
                        <Text style={styles.maintenanceLabelText}>Under maintenance</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.historyButton}
                      onPress={() => openHistory(item)}
                    >
                      <History size={15} color={C.primary} />
                      <Text style={styles.historyButtonText}>History</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}

            {filteredEquipment.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Search size={23} color={C.muted} />
                </View>
                <Text style={styles.emptyTitle}>
                  {equipment.length === 0 ? 'No equipment registered' : 'No equipment found'}
                </Text>
                <Text style={styles.emptyText}>
                  {equipment.length === 0
                    ? 'Equipment records will appear here once added to the database.'
                    : 'Try another instrument name, ID or laboratory.'}
                </Text>
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>Clear search</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {maintenance > 0 && (
          <View style={styles.maintenanceCard}>
            <View style={styles.maintenanceIcon}>
              <AlertTriangle size={19} color={C.danger} />
            </View>
            <View style={styles.maintenanceContent}>
              <Text style={styles.maintenanceTitle}>Maintenance attention</Text>
              <Text style={styles.maintenanceText}>
                {maintenance} instrument{maintenance === 1 ? '' : 's'} currently
                require maintenance attention.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>LABSYNC · EQUIPMENT REGISTER</Text>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !submitting && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>EQUIPMENT TRANSACTION</Text>
                <Text style={styles.modalTitle}>
                  {actionType === 'CHECKOUT' ? 'Check out equipment' : 'Return equipment'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                disabled={submitting}
                onPress={() => setModalVisible(false)}
              >
                <X size={20} color={C.ink} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalEquipmentName}>{selectedEquipment?.name}</Text>

            <Text style={styles.inputLabel}>
              {actionType === 'CHECKOUT' ? 'SELECT RESEARCHER' : 'RESEARCHER'}
            </Text>

            {actionType === 'RETURN' && selectedEquipment &&
            getActiveCheckout(selectedEquipment.id)?.researcher_id ? (
              <View style={styles.selectedResearcher}>
                <UserRound size={17} color={C.primary} />
                <Text style={styles.selectedResearcherText}>
                  {activeResearchers.find(
                    (item) => item.id === getActiveCheckout(selectedEquipment.id)?.researcher_id
                  )?.full_name ?? 'Original researcher'}
                </Text>
                <CheckCircle2 size={17} color={C.secondary} />
              </View>
            ) : actionType === 'RETURN' ? (
              <View style={styles.selectedResearcher}>
                <UserRound size={17} color={C.primary} />
                <Text style={styles.selectedResearcherText}>
                  {legacyReturnName || 'Original checkout researcher'}
                </Text>
                <CheckCircle2 size={17} color={C.secondary} />
              </View>
            ) : (
              <ScrollView style={styles.researcherList} nestedScrollEnabled>
                {activeResearchers.map((researcher) => (
                  <TouchableOpacity
                    key={researcher.id}
                    style={[
                      styles.researcherOption,
                      selectedResearcherId === researcher.id && styles.researcherOptionSelected,
                    ]}
                    onPress={() => setSelectedResearcherId(researcher.id)}
                  >
                    <View style={styles.researcherAvatar}>
                      <UserRound size={16} color={C.primary} />
                    </View>
                    <View style={styles.researcherInfo}>
                      <Text style={styles.researcherName}>{researcher.full_name}</Text>
                      <Text style={styles.researcherCode}>{researcher.researcher_code}</Text>
                    </View>
                    {selectedResearcherId === researcher.id && (
                      <CheckCircle2 size={19} color={C.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                {activeResearchers.length === 0 && (
                  <Text style={styles.noResearchers}>No active researchers found.</Text>
                )}
              </ScrollView>
            )}

            <Text style={styles.inputLabel}>NOTES (OPTIONAL)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Purpose of use or return notes..."
              placeholderTextColor={C.subtle}
              style={styles.notesInput}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              disabled={submitting}
              onPress={submitTransaction}
            >
              {submitting ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {actionType === 'CHECKOUT' ? 'Confirm checkout' : 'Confirm return'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={historyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>EQUIPMENT RECORDS</Text>
                <Text style={styles.modalTitle}>Transaction history</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setHistoryVisible(false)}>
                <X size={20} color={C.ink} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalEquipmentName}>{selectedEquipment?.name}</Text>

            <ScrollView style={styles.historyList}>
              {selectedHistory.map((transaction) => (
                <View key={transaction.id} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    <Clock3 size={17} color={C.primary} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyResearcher}>{transaction.performed_by}</Text>
                    <Text style={styles.historyDate}>
                      Checkout: {formatDate(transaction.checkout_time)}
                    </Text>
                    <Text style={styles.historyDate}>
                      Return: {formatDate(transaction.return_time)}
                    </Text>
                    {transaction.notes ? (
                      <Text style={styles.historyNotes}>{transaction.notes}</Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.historyStatus,
                      { backgroundColor: transaction.return_time ? C.secondaryLight : C.primaryLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.historyStatusText,
                        { color: transaction.return_time ? C.secondary : C.primary },
                      ]}
                    >
                      {transaction.return_time ? 'RETURNED' : 'ACTIVE'}
                    </Text>
                  </View>
                </View>
              ))}
              {selectedHistory.length === 0 && (
                <Text style={styles.noResearchers}>No transactions recorded for this equipment.</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.submitButton} onPress={() => setHistoryVisible(false)}>
              <Text style={styles.submitButtonText}>Close history</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: SP.lg, paddingTop: SP.sm, paddingBottom: SP.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SP.lg },
  backButton: { width: 42, height: 42, borderRadius: R.pill, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, marginLeft: SP.md },
  eyebrow: { color: C.accent, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: C.ink, fontSize: T.heading1, fontWeight: '800', marginTop: 2 },
  subtitle: { color: C.muted, fontSize: T.bodySmall, marginTop: 3 },
  addButton: { width: 42, height: 42, borderRadius: R.pill, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  overviewCard: { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: SP.lg, marginBottom: SP.lg, ...S.card },
  overviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overviewEyebrow: { color: C.muted, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 1.1 },
  overviewTitle: { color: C.ink, fontSize: T.heading3, fontWeight: '800', marginTop: 5 },
  overviewIcon: { width: 39, height: 39, borderRadius: R.md, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: SP.lg, marginBottom: SP.md },
  stat: { flex: 1 },
  statNumber: { color: C.ink, fontSize: 25, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 4 },
  statDivider: { width: 1, height: 35, backgroundColor: C.border, marginHorizontal: SP.sm },
  overviewFooter: { borderTopWidth: 1, borderTopColor: C.divider, paddingTop: SP.md },
  progressTrack: { height: 7, borderRadius: R.pill, overflow: 'hidden', flexDirection: 'row', gap: 3 },
  progressSegment: { borderRadius: R.pill },
  totalLabel: { color: C.muted, fontSize: T.caption, marginTop: SP.sm },
  searchBox: { height: 48, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.md, marginBottom: SP.xl },
  searchInput: { flex: 1, marginLeft: SP.sm, color: C.ink, fontSize: T.bodySmall, paddingVertical: 0 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md },
  sectionEyebrow: { color: C.accent, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 1.1 },
  sectionTitle: { color: C.ink, fontSize: T.heading2, fontWeight: '800', marginTop: 4 },
  countBadge: { minWidth: 32, height: 32, paddingHorizontal: 9, borderRadius: R.pill, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  countText: { color: C.primary, fontSize: T.bodySmall, fontWeight: '800' },
  list: { gap: SP.md },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.xl, padding: SP.lg, ...S.card },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  idContainer: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  equipmentIcon: { width: 34, height: 34, borderRadius: R.md, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  equipmentId: { color: C.secondary, fontSize: T.bodySmall, fontWeight: '800', letterSpacing: 0.6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.pill },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  equipmentName: { color: C.ink, fontSize: T.heading3, fontWeight: '800', marginTop: SP.md },
  labRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: SP.sm },
  labDot: { width: 6, height: 6, borderRadius: R.pill, backgroundColor: C.primary },
  labText: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  metadataText: { color: C.muted, fontSize: T.caption, marginTop: SP.sm },
  borrowerRow: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, marginTop: SP.md, backgroundColor: C.primaryLight, borderRadius: R.md, padding: SP.sm },
  borrowerText: { color: C.primary, fontSize: T.bodySmall, fontWeight: '700' },
  cardActions: { borderTopWidth: 1, borderTopColor: C.divider, marginTop: SP.md, paddingTop: SP.md, flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  checkoutButton: { backgroundColor: C.primary, borderRadius: R.pill, paddingHorizontal: SP.lg, paddingVertical: SP.sm },
  checkoutButtonText: { color: C.white, fontSize: T.bodySmall, fontWeight: '800' },
  returnButton: { backgroundColor: C.secondaryLight, borderRadius: R.pill, paddingHorizontal: SP.lg, paddingVertical: SP.sm },
  returnButtonText: { color: C.secondary, fontSize: T.bodySmall, fontWeight: '800' },
  historyButton: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SP.sm, paddingVertical: SP.sm },
  historyButtonText: { color: C.primary, fontSize: T.bodySmall, fontWeight: '700' },
  maintenanceLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  maintenanceLabelText: { color: C.danger, fontSize: T.bodySmall, fontWeight: '700' },
  loadingState: { alignItems: 'center', padding: SP.xxl },
  loadingText: { color: C.muted, fontSize: T.bodySmall, marginTop: SP.md },
  errorCard: { backgroundColor: C.dangerLight, borderRadius: R.lg, padding: SP.md, marginBottom: SP.lg, flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  errorText: { color: C.danger, fontSize: T.bodySmall, flex: 1 },
  retryText: { color: C.danger, fontSize: T.bodySmall, fontWeight: '800' },
  emptyState: { alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.xl, padding: SP.xxl },
  emptyIcon: { width: 48, height: 48, borderRadius: R.pill, backgroundColor: C.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: C.ink, fontSize: T.heading3, fontWeight: '800', marginTop: SP.md },
  emptyText: { color: C.muted, fontSize: T.bodySmall, textAlign: 'center', lineHeight: 19, marginTop: SP.xs },
  clearButton: { marginTop: SP.md, backgroundColor: C.primaryLight, borderRadius: R.pill, paddingHorizontal: SP.lg, paddingVertical: SP.sm },
  clearButtonText: { color: C.primary, fontSize: T.bodySmall, fontWeight: '800' },
  maintenanceCard: { marginTop: SP.xl, padding: SP.md, backgroundColor: C.dangerLight, borderRadius: R.lg, flexDirection: 'row', alignItems: 'center', gap: SP.md },
  maintenanceIcon: { width: 38, height: 38, borderRadius: R.md, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  maintenanceContent: { flex: 1 },
  maintenanceTitle: { color: C.danger, fontSize: T.bodySmall, fontWeight: '800' },
  maintenanceText: { color: C.text, fontSize: T.bodySmall, lineHeight: 18, marginTop: 3 },
  bottomNote: { alignItems: 'center', marginTop: SP.xxl },
  bottomNoteText: { color: C.subtle, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 1.1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.48)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: SP.lg, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalEyebrow: { color: C.accent, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 1 },
  modalTitle: { color: C.ink, fontSize: T.heading2, fontWeight: '800', marginTop: 4 },
  closeButton: { width: 36, height: 36, borderRadius: R.pill, backgroundColor: C.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  modalEquipmentName: { color: C.muted, fontSize: T.bodySmall, marginTop: SP.md, marginBottom: SP.lg },
  inputLabel: { color: C.muted, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 0.8, marginBottom: SP.sm },
  researcherList: { maxHeight: 190, marginBottom: SP.lg },
  researcherOption: { flexDirection: 'row', alignItems: 'center', padding: SP.sm, borderWidth: 1, borderColor: C.border, borderRadius: R.md, marginBottom: SP.xs, gap: SP.sm },
  researcherOptionSelected: { borderColor: C.primary, backgroundColor: C.primaryLight },
  researcherAvatar: { width: 34, height: 34, borderRadius: R.pill, backgroundColor: C.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  researcherInfo: { flex: 1 },
  researcherName: { color: C.ink, fontSize: T.bodySmall, fontWeight: '700' },
  researcherCode: { color: C.muted, fontSize: T.caption, marginTop: 2 },
  noResearchers: { color: C.muted, fontSize: T.bodySmall, padding: SP.md, textAlign: 'center' },
  selectedResearcher: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: C.primaryLight, padding: SP.md, borderRadius: R.md, marginBottom: SP.lg },
  selectedResearcherText: { flex: 1, color: C.primary, fontSize: T.bodySmall, fontWeight: '700' },
  notesInput: { minHeight: 78, borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: SP.md, color: C.ink, fontSize: T.bodySmall, marginBottom: SP.lg },
  submitButton: { backgroundColor: C.primary, borderRadius: R.pill, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: SP.md },
  submitButtonDisabled: { opacity: 0.65 },
  submitButtonText: { color: C.white, fontSize: T.bodySmall, fontWeight: '800' },
  historyList: { maxHeight: 350 },
  historyItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SP.md, borderBottomWidth: 1, borderBottomColor: C.divider, gap: SP.sm },
  historyIcon: { width: 34, height: 34, borderRadius: R.pill, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyResearcher: { color: C.ink, fontSize: T.bodySmall, fontWeight: '800' },
  historyDate: { color: C.muted, fontSize: T.caption, marginTop: 4 },
  historyNotes: { color: C.text, fontSize: T.caption, marginTop: SP.xs },
  historyStatus: { borderRadius: R.pill, paddingHorizontal: SP.sm, paddingVertical: 5 },
  historyStatusText: { fontSize: 8, fontWeight: '800' },
})
