import { router, useFocusEffect } from 'expo-router'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Beaker,
  ChevronDown,
  ClipboardList,
  Filter,
  FlaskConical,
  History,
  Package,
  Plus,
  RefreshCw,
  Search,
  X
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
  createInventoryTransaction,
  createMaterial,
  getInventoryTransactions,
  getLaboratories,
  getMaterials,
} from '@/services/api'

import type {
  InventoryTransaction,
  Laboratory,
  Material,
} from '@/services/types'

type TransactionMode = 'USE' | 'RESTOCK'

type MaterialForm = {
  laboratory_id: number
  name: string
  category: string
  quantity: string
  unit: string
  minimum_quantity: string
  expiry_date: string
}

const EMPTY_MATERIAL_FORM: MaterialForm = {
  laboratory_id: 0,
  name: '',
  category: '',
  quantity: '0',
  unit: '',
  minimum_quantity: '0',
  expiry_date: '',
}

const formatQuantity = (quantity: number) =>
  Number(quantity).toLocaleString('en-IN', {
    maximumFractionDigits: 3,
  })

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function MaterialsScreen() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const [materialModalVisible, setMaterialModalVisible] = useState(false)
  const [transactionModalVisible, setTransactionModalVisible] = useState(false)
  const [historyModalVisible, setHistoryModalVisible] = useState(false)
  const [materialForm, setMaterialForm] =
    useState<MaterialForm>(EMPTY_MATERIAL_FORM)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [transactionMode, setTransactionMode] = useState<TransactionMode>('USE')
  const [transactionQuantity, setTransactionQuantity] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [transactionNotes, setTransactionNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showLabPicker, setShowLabPicker] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setError('')
      const [materialData, laboratoryData, transactionData] = await Promise.all([
        getMaterials(),
        getLaboratories(),
        getInventoryTransactions(),
      ])
      setMaterials(materialData ?? [])
      setLaboratories(laboratoryData ?? [])
      setTransactions(transactionData ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load inventory.')
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

  const lowStockCount = materials.filter(
    (material) => material.quantity <= material.minimum_quantity
  ).length

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLowerCase()
    return materials.filter((material) => {
      const laboratory = laboratoryMap.get(material.laboratory_id)
      const matchesSearch = [
        material.name,
        material.category,
        material.unit,
        laboratory?.name ?? '',
        laboratory?.department ?? '',
      ].some((value) => value.toLowerCase().includes(query))
      const matchesStock =
        !lowStockOnly || material.quantity <= material.minimum_quantity
      return matchesSearch && matchesStock
    })
  }, [materials, laboratoryMap, search, lowStockOnly])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const updateMaterialForm = (key: keyof MaterialForm, value: string | number) => {
    setMaterialForm((current) => ({ ...current, [key]: value }))
  }

  const openAddMaterial = () => {
    setMaterialForm({
      ...EMPTY_MATERIAL_FORM,
      laboratory_id: laboratories[0]?.id ?? 0,
    })
    setMaterialModalVisible(true)
  }

  const submitNewMaterial = async () => {
    const quantity = Number(materialForm.quantity)
    const minimumQuantity = Number(materialForm.minimum_quantity)

    if (!materialForm.laboratory_id) {
      Alert.alert('Select a laboratory', 'Choose the laboratory that owns this material.')
      return
    }
    if (!materialForm.name.trim() || !materialForm.unit.trim()) {
      Alert.alert('Missing details', 'Material name and unit are required.')
      return
    }
    if (!Number.isFinite(quantity) || quantity < 0 ||
        !Number.isFinite(minimumQuantity) || minimumQuantity < 0) {
      Alert.alert('Invalid quantity', 'Enter valid non-negative stock quantities.')
      return
    }

    const expiryDate = materialForm.expiry_date.trim()
    if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      Alert.alert('Invalid expiry date', 'Use YYYY-MM-DD format, or leave it blank.')
      return
    }

    setSaving(true)
    try {
      await createMaterial({
        laboratory_id: materialForm.laboratory_id,
        name: materialForm.name.trim(),
        category: materialForm.category.trim(),
        quantity,
        unit: materialForm.unit.trim(),
        minimum_quantity: minimumQuantity,
        ...(expiryDate ? { expiry_date: expiryDate } : {}),
      })
      setMaterialModalVisible(false)
      setMaterialForm(EMPTY_MATERIAL_FORM)
      await loadData()
      Alert.alert('Material added', 'The material has been registered successfully.')
    } catch (err) {
      Alert.alert(
        'Could not add material',
        err instanceof Error ? err.message : 'Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const openTransaction = (material: Material, mode: TransactionMode) => {
    setSelectedMaterial(material)
    setTransactionMode(mode)
    setTransactionQuantity('')
    setPerformedBy('')
    setTransactionNotes('')
    setTransactionModalVisible(true)
  }

  const submitTransaction = async () => {
    if (!selectedMaterial) return

    const quantity = Number(transactionQuantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      Alert.alert('Invalid quantity', 'Enter a quantity greater than zero.')
      return
    }
    if (transactionMode === 'USE' && quantity > selectedMaterial.quantity) {
      Alert.alert(
        'Insufficient stock',
        `Only ${formatQuantity(selectedMaterial.quantity)} ${selectedMaterial.unit} is available.`
      )
      return
    }
    if (!performedBy.trim()) {
      Alert.alert('Researcher required', 'Enter the name of the person performing this transaction.')
      return
    }

    setSaving(true)
    try {
      await createInventoryTransaction({
        material_id: selectedMaterial.id,
        transaction_type: transactionMode,
        quantity,
        performed_by: performedBy.trim(),
        notes: transactionNotes.trim(),
      })
      setTransactionModalVisible(false)
      await loadData()
      Alert.alert(
        transactionMode === 'USE' ? 'Stock usage recorded' : 'Stock replenished',
        'The inventory and transaction history have been updated.'
      )
    } catch (err) {
      Alert.alert(
        'Transaction failed',
        err instanceof Error ? err.message : 'Please check the details and try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const openHistory = (material: Material) => {
    setSelectedMaterial(material)
    setHistoryModalVisible(true)
  }

  const selectedMaterialTransactions = useMemo(() => {
    if (!selectedMaterial) return []
    return transactions.filter(
      (transaction) => transaction.material_id === selectedMaterial.id
    )
  }, [transactions, selectedMaterial])

  const renderMaterialCard = (material: Material) => {
    const laboratory = laboratoryMap.get(material.laboratory_id)
    const isLowStock = material.quantity <= material.minimum_quantity

    return (
      <View key={material.id} style={styles.materialCard}>
        <View style={styles.materialCardTop}>
          <View style={styles.materialIcon}>
            <Beaker size={19} color={C.primary} />
          </View>
          <View style={styles.materialHeading}>
            <Text style={styles.materialName}>{material.name}</Text>
            <Text style={styles.materialId}>MATERIAL ID · {material.id}</Text>
          </View>
          <TouchableOpacity
            style={styles.historyIconButton}
            onPress={() => openHistory(material)}
            accessibilityLabel={`View ${material.name} transaction history`}
          >
            <History size={17} color={C.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.metadataRow}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>
              {(material.category || 'GENERAL').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.labText}>
            {laboratory?.department || laboratory?.name || `Lab ${material.laboratory_id}`}
          </Text>
        </View>

        <View style={styles.stockPanel}>
          <View>
            <Text style={styles.stockLabel}>CURRENT STOCK</Text>
            <View style={styles.quantityRow}>
              <Text style={styles.stockValue}>{formatQuantity(material.quantity)}</Text>
              <Text style={styles.stockUnit}>{material.unit}</Text>
            </View>
            <Text style={styles.minimumText}>
              Minimum: {formatQuantity(material.minimum_quantity)} {material.unit}
            </Text>
          </View>
          <View style={[
            styles.statusPill,
            isLowStock ? styles.lowStatus : styles.availableStatus,
          ]}>
            {isLowStock
              ? <AlertTriangle size={12} color={C.danger} />
              : <View style={styles.availableDot} />}
            <Text style={[
              styles.statusText,
              isLowStock ? styles.lowStatusText : styles.availableStatusText,
            ]}>
              {isLowStock ? 'LOW STOCK' : 'IN STOCK'}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.useButton]}
            onPress={() => openTransaction(material, 'USE')}
          >
            <ArrowUpFromLine size={15} color={C.white} />
            <Text style={styles.primaryActionText}>Record usage</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.restockButton]}
            onPress={() => openTransaction(material, 'RESTOCK')}
          >
            <ArrowDownToLine size={15} color={C.primary} />
            <Text style={styles.secondaryActionText}>Restock</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
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
            <Text style={styles.eyebrow}>LABORATORY INVENTORY</Text>
            <Text style={styles.title}>Materials</Text>
            <Text style={styles.subtitle}>Track and manage your laboratory supplies.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAddMaterial}>
            <Plus size={20} color={C.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={17} color={C.muted} />
            <TextInput
              placeholder="Search materials..."
              placeholderTextColor={C.subtle}
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, lowStockOnly && styles.filterButtonActive]}
            onPress={() => setLowStockOnly((current) => !current)}
          >
            <Filter size={18} color={lowStockOnly ? C.white : C.primary} />
          </TouchableOpacity>
        </View>

        {lowStockOnly && (
          <TouchableOpacity style={styles.filterHint} onPress={() => setLowStockOnly(false)}>
            <Text style={styles.filterHintText}>Showing low-stock materials · Clear filter</Text>
          </TouchableOpacity>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeading}>
            <View style={styles.summaryIcon}><Package size={17} color={C.primary} /></View>
            <Text style={styles.summaryTitle}>Inventory overview</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{materials.length.toString().padStart(2, '0')}</Text>
              <Text style={styles.summaryLabel}>MATERIALS</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, lowStockCount > 0 && styles.warningValue]}>
                {lowStockCount.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.summaryLabel}>LOW STOCK</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{laboratories.length.toString().padStart(2, '0')}</Text>
              <Text style={styles.summaryLabel}>LABS</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Material register</Text>
            <Text style={styles.sectionSubtitle}>{filteredMaterials.length} materials displayed</Text>
          </View>
          <View style={styles.sectionIcon}><FlaskConical size={17} color={C.primary} /></View>
        </View>

        {loading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.stateText}>Loading laboratory inventory...</Text>
          </View>
        )}

        {!loading && !!error && (
          <View style={styles.stateCard}>
            <AlertTriangle size={27} color={C.danger} />
            <Text style={styles.errorTitle}>Unable to load materials</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => {
              setLoading(true)
              loadData()
            }}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <View style={styles.list}>
            {filteredMaterials.length === 0 ? (
              <View style={styles.stateCard}>
                <View style={styles.emptyIcon}><Beaker size={27} color={C.primary} /></View>
                <Text style={styles.emptyTitle}>No materials found</Text>
                <Text style={styles.emptyText}>
                  {materials.length === 0
                    ? 'No materials have been registered in the inventory yet.'
                    : 'Try changing your search or stock filter.'}
                </Text>
                {materials.length === 0 && (
                  <TouchableOpacity style={styles.emptyAddButton} onPress={openAddMaterial}>
                    <Plus size={15} color={C.white} />
                    <Text style={styles.primaryActionText}>Add first material</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : filteredMaterials.map(renderMaterialCard)}
          </View>
        )}

        {!loading && !error && lowStockCount > 0 && (
          <View style={styles.attentionCard}>
            <View style={styles.attentionIcon}><AlertTriangle size={18} color={C.accent} /></View>
            <View style={styles.attentionContent}>
              <Text style={styles.attentionTitle}>Inventory attention</Text>
              <Text style={styles.attentionText}>
                {lowStockCount} material{lowStockCount === 1 ? ' is' : 's are'} below or at the configured minimum stock level.
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>LABSYNC · MATERIALS REGISTER</Text>
      </ScrollView>

      {/* Add material modal */}
      <Modal
        visible={materialModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMaterialModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>INVENTORY REGISTER</Text>
                <Text style={styles.modalTitle}>Add material</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setMaterialModalVisible(false)}>
                <X size={19} color={C.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>LABORATORY *</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowLabPicker((v) => !v)}>
                <Text style={[styles.pickerText, !materialForm.laboratory_id && styles.placeholderText]}>
                  {laboratoryMap.get(materialForm.laboratory_id)?.name || 'Select laboratory'}
                </Text>
                <ChevronDown size={17} color={C.muted} />
              </TouchableOpacity>
              {showLabPicker && (
                <View style={styles.pickerOptions}>
                  {laboratories.map((lab) => (
                    <TouchableOpacity
                      key={lab.id}
                      style={styles.pickerOption}
                      onPress={() => {
                        updateMaterialForm('laboratory_id', lab.id)
                        setShowLabPicker(false)
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{lab.name}</Text>
                      {lab.department ? <Text style={styles.pickerOptionMeta}>{lab.department}</Text> : null}
                    </TouchableOpacity>
                  ))}
                  {laboratories.length === 0 && <Text style={styles.emptyText}>No laboratories available. Create a laboratory first.</Text>}
                </View>
              )}

              <Text style={styles.fieldLabel}>MATERIAL NAME *</Text>
              <TextInput
                style={styles.fieldInput}
                value={materialForm.name}
                onChangeText={(v) => updateMaterialForm('name', v)}
                placeholder="e.g. Sodium chloride"
                placeholderTextColor={C.subtle}
              />

              <Text style={styles.fieldLabel}>CATEGORY</Text>
              <TextInput
                style={styles.fieldInput}
                value={materialForm.category}
                onChangeText={(v) => updateMaterialForm('category', v)}
                placeholder="e.g. Chemicals, Glassware"
                placeholderTextColor={C.subtle}
              />

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>OPENING STOCK</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={materialForm.quantity}
                    onChangeText={(v) => updateMaterialForm('quantity', v)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={C.subtle}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>UNIT *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={materialForm.unit}
                    onChangeText={(v) => updateMaterialForm('unit', v)}
                    placeholder="g, ml, pcs"
                    placeholderTextColor={C.subtle}
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>MINIMUM STOCK</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={materialForm.minimum_quantity}
                    onChangeText={(v) => updateMaterialForm('minimum_quantity', v)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={C.subtle}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>EXPIRY DATE</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={materialForm.expiry_date}
                    onChangeText={(v) => updateMaterialForm('expiry_date', v)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={C.subtle}
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <Text style={styles.helperText}>Expiry date is optional. Enter it in YYYY-MM-DD format.</Text>

              <TouchableOpacity
                style={[styles.submitButton, saving && styles.disabledButton]}
                onPress={submitNewMaterial}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color={C.white} /> : <Plus size={17} color={C.white} />}
                <Text style={styles.submitButtonText}>{saving ? 'Saving...' : 'Register material'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Stock transaction modal */}
      <Modal
        visible={transactionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTransactionModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>INVENTORY TRANSACTION</Text>
                <Text style={styles.modalTitle}>
                  {transactionMode === 'USE' ? 'Record usage' : 'Restock material'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setTransactionModalVisible(false)}>
                <X size={19} color={C.ink} />
              </TouchableOpacity>
            </View>

            {selectedMaterial && (
              <View style={styles.selectedMaterialCard}>
                <Text style={styles.selectedMaterialName}>{selectedMaterial.name}</Text>
                <Text style={styles.selectedMaterialStock}>
                  Available: {formatQuantity(selectedMaterial.quantity)} {selectedMaterial.unit}
                </Text>
              </View>
            )}

            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeButton, transactionMode === 'USE' && styles.modeButtonActive]}
                onPress={() => setTransactionMode('USE')}
              >
                <ArrowUpFromLine size={15} color={transactionMode === 'USE' ? C.white : C.primary} />
                <Text style={[styles.modeText, transactionMode === 'USE' && styles.modeTextActive]}>Use stock</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, transactionMode === 'RESTOCK' && styles.modeButtonActive]}
                onPress={() => setTransactionMode('RESTOCK')}
              >
                <ArrowDownToLine size={15} color={transactionMode === 'RESTOCK' ? C.white : C.primary} />
                <Text style={[styles.modeText, transactionMode === 'RESTOCK' && styles.modeTextActive]}>Restock</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>QUANTITY *</Text>
            <TextInput
              style={styles.fieldInput}
              value={transactionQuantity}
              onChangeText={setTransactionQuantity}
              keyboardType="decimal-pad"
              placeholder={`Quantity in ${selectedMaterial?.unit ?? 'units'}`}
              placeholderTextColor={C.subtle}
            />

            <Text style={styles.fieldLabel}>PERFORMED BY *</Text>
            <TextInput
              style={styles.fieldInput}
              value={performedBy}
              onChangeText={setPerformedBy}
              placeholder="Researcher / staff name"
              placeholderTextColor={C.subtle}
            />

            <Text style={styles.fieldLabel}>NOTES</Text>
            <TextInput
              style={[styles.fieldInput, styles.notesInput]}
              value={transactionNotes}
              onChangeText={setTransactionNotes}
              placeholder="Purpose, experiment, or additional details"
              placeholderTextColor={C.subtle}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, saving && styles.disabledButton]}
              onPress={submitTransaction}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color={C.white} /> : <ClipboardList size={17} color={C.white} />}
              <Text style={styles.submitButtonText}>
                {saving ? 'Saving...' : transactionMode === 'USE' ? 'Confirm usage' : 'Confirm restock'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Transaction history modal */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.historyModalCard]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalEyebrow}>AUDIT TRAIL</Text>
                <Text style={styles.modalTitle}>Transaction history</Text>
                <Text style={styles.historySubtitle}>{selectedMaterial?.name ?? ''}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setHistoryModalVisible(false)}>
                <X size={19} color={C.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedMaterialTransactions.length === 0 ? (
                <View style={styles.historyEmpty}>
                  <History size={27} color={C.subtle} />
                  <Text style={styles.emptyTitle}>No transactions yet</Text>
                  <Text style={styles.emptyText}>Usage and restock activity will appear here.</Text>
                </View>
              ) : selectedMaterialTransactions.map((transaction) => {
                const isRestock = transaction.transaction_type === 'RESTOCK'
                return (
                  <View key={transaction.id} style={styles.transactionRow}>
                    <View style={[
                      styles.transactionIcon,
                      isRestock ? styles.restockIcon : styles.useIcon,
                    ]}>
                      {isRestock
                        ? <ArrowDownToLine size={16} color={C.primary} />
                        : <ArrowUpFromLine size={16} color={C.danger} />}
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionTitle}>{isRestock ? 'Stock restocked' : 'Material used'}</Text>
                      <Text style={styles.transactionMeta}>{transaction.performed_by || 'Unknown'} · {formatDate(transaction.created_at)}</Text>
                      {transaction.notes ? <Text style={styles.transactionNotes}>{transaction.notes}</Text> : null}
                    </View>
                    <Text style={[
                      styles.transactionQuantity,
                      isRestock ? styles.restockQuantity : styles.useQuantity,
                    ]}>
                      {isRestock ? '+' : '−'}{formatQuantity(transaction.quantity)}
                    </Text>
                  </View>
                )
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.historyRefreshButton}
              onPress={async () => {
                try {
                  const data = await getInventoryTransactions()
                  setTransactions(data ?? [])
                } catch (err) {
                  Alert.alert('Could not refresh history', err instanceof Error ? err.message : 'Please try again.')
                }
              }}
            >
              <RefreshCw size={14} color={C.primary} />
              <Text style={styles.historyRefreshText}>Refresh history</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 23 },
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
  searchRow: { flexDirection: 'row', gap: 9 },
  searchBox: {
    flex: 1, height: 47, backgroundColor: C.surface, borderWidth: 1,
    borderColor: C.border, borderRadius: R.md, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 14,
  },
  searchInput: { flex: 1, marginLeft: 9, color: C.ink, fontSize: 12 },
  filterButton: {
    width: 47, height: 47, backgroundColor: C.surface, borderWidth: 1,
    borderColor: C.border, borderRadius: R.md, alignItems: 'center', justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterHint: { marginTop: 9, alignSelf: 'flex-start' },
  filterHintText: { color: C.primary, fontSize: 10, fontWeight: '700' },
  summaryCard: { marginTop: 18, padding: 16, borderRadius: R.lg, backgroundColor: C.primaryLight },
  summaryHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 16 },
  summaryIcon: {
    width: 31, height: 31, borderRadius: 10, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryTitle: { color: C.primaryDark, fontSize: 12, fontWeight: '800' },
  summaryStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryItem: { flex: 1 },
  summaryValue: { color: C.ink, fontSize: 24, fontWeight: '800' },
  warningValue: { color: C.danger },
  summaryLabel: { color: C.primary, fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginTop: 3 },
  summaryDivider: { height: 34, width: 1, backgroundColor: '#B9CCC4', marginHorizontal: 9 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 29, marginBottom: 14,
  },
  sectionTitle: { color: C.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  sectionSubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  sectionIcon: {
    width: 35, height: 35, borderRadius: 11, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  list: { gap: 11 },
  materialCard: {
    padding: 15, backgroundColor: C.surface, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.border, ...S.card,
  },
  materialCardTop: { flexDirection: 'row', alignItems: 'center' },
  materialIcon: {
    width: 39, height: 39, borderRadius: 12, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  materialHeading: { flex: 1, marginLeft: 11 },
  materialName: { color: C.ink, fontSize: 15, fontWeight: '800' },
  materialId: { color: C.subtle, fontSize: 8, fontWeight: '700', letterSpacing: 0.7, marginTop: 4 },
  historyIconButton: {
    width: 34, height: 34, borderRadius: 11, backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  metadataRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 13 },
  categoryTag: { backgroundColor: C.secondaryLight, borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 5 },
  categoryText: { color: C.secondary, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  labText: { color: C.muted, fontSize: 10, fontWeight: '600', flex: 1 },
  stockPanel: {
    marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: C.divider,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  stockLabel: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  quantityRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 3 },
  stockValue: { color: C.ink, fontSize: 21, fontWeight: '800' },
  stockUnit: { color: C.muted, fontSize: 11, fontWeight: '600' },
  minimumText: { color: C.muted, fontSize: 9, marginTop: 3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: R.pill },
  lowStatus: { backgroundColor: C.dangerLight },
  availableStatus: { backgroundColor: C.successLight },
  availableDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: C.success },
  statusText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  lowStatusText: { color: C.danger },
  availableStatusText: { color: C.success },
  cardActions: { flexDirection: 'row', gap: 9, marginTop: 15 },
  actionButton: {
    flex: 1, minHeight: 39, borderRadius: R.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  useButton: { backgroundColor: C.primary },
  restockButton: { backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.border },
  primaryActionText: { color: C.white, fontSize: 10, fontWeight: '800' },
  secondaryActionText: { color: C.primary, fontSize: 10, fontWeight: '800' },
  stateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 35, gap: 12 },
  stateText: { color: C.muted, fontSize: 12 },
  stateCard: {
    alignItems: 'center', justifyContent: 'center', padding: 25,
    backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border,
  },
  errorTitle: { color: C.ink, fontSize: 14, fontWeight: '800', marginTop: 8 },
  errorText: { color: C.danger, fontSize: 11, textAlign: 'center', marginTop: 6 },
  retryButton: { backgroundColor: C.primaryLight, paddingHorizontal: 19, paddingVertical: 10, borderRadius: R.md, marginTop: 14 },
  retryText: { color: C.primary, fontSize: 12, fontWeight: '800' },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: C.ink, fontSize: 14, fontWeight: '800', marginTop: 12 },
  emptyText: { color: C.muted, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 6 },
  emptyAddButton: { flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: R.md, marginTop: 14 },
  attentionCard: { marginTop: 22, padding: 14, borderRadius: R.lg, backgroundColor: C.warningLight, flexDirection: 'row', alignItems: 'center', gap: 11 },
  attentionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  attentionContent: { flex: 1 },
  attentionTitle: { color: C.accent, fontSize: 11, fontWeight: '800' },
  attentionText: { color: C.text, fontSize: 10, lineHeight: 15, marginTop: 3 },
  footer: { color: C.subtle, fontSize: 8, fontWeight: '800', letterSpacing: 1.2, textAlign: 'center', marginTop: 28 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(20, 35, 29, 0.48)', justifyContent: 'flex-end' },
  modalCard: {
    maxHeight: '92%', backgroundColor: C.background, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 21, paddingBottom: 28,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 19 },
  modalEyebrow: { color: C.primary, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  modalTitle: { color: C.ink, fontSize: 21, fontWeight: '800', marginTop: 3 },
  closeButton: { width: 35, height: 35, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 13, marginBottom: 7 },
  fieldInput: {
    minHeight: 45, borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    backgroundColor: C.surface, paddingHorizontal: 13, color: C.ink, fontSize: 12,
  },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1 },
  helperText: { color: C.muted, fontSize: 9, marginTop: 7 },
  pickerButton: {
    minHeight: 45, borderWidth: 1, borderColor: C.border, borderRadius: R.md,
    backgroundColor: C.surface, paddingHorizontal: 13, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  pickerText: { color: C.ink, fontSize: 12 },
  placeholderText: { color: C.subtle },
  pickerOptions: { marginTop: 5, borderWidth: 1, borderColor: C.border, borderRadius: R.md, backgroundColor: C.surface, overflow: 'hidden' },
  pickerOption: { paddingHorizontal: 13, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.divider },
  pickerOptionText: { color: C.ink, fontSize: 12, fontWeight: '700' },
  pickerOptionMeta: { color: C.muted, fontSize: 9, marginTop: 3 },
  submitButton: {
    minHeight: 47, marginTop: 21, borderRadius: R.md, backgroundColor: C.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
  },
  disabledButton: { opacity: 0.65 },
  submitButtonText: { color: C.white, fontSize: 12, fontWeight: '800' },
  selectedMaterialCard: { backgroundColor: C.primaryLight, borderRadius: R.md, padding: 13, marginBottom: 13 },
  selectedMaterialName: { color: C.primaryDark, fontSize: 13, fontWeight: '800' },
  selectedMaterialStock: { color: C.primary, fontSize: 10, marginTop: 4 },
  modeRow: { flexDirection: 'row', gap: 9, marginBottom: 4 },
  modeButton: { flex: 1, minHeight: 40, borderRadius: R.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  modeButtonActive: { backgroundColor: C.primary, borderColor: C.primary },
  modeText: { color: C.primary, fontSize: 10, fontWeight: '800' },
  modeTextActive: { color: C.white },
  notesInput: { minHeight: 76, paddingTop: 11 },
  historyModalCard: { maxHeight: '85%' },
  historySubtitle: { color: C.muted, fontSize: 10, marginTop: 4 },
  historyEmpty: { alignItems: 'center', paddingVertical: 35 },
  transactionRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.divider, gap: 10 },
  transactionIcon: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  restockIcon: { backgroundColor: C.primaryLight },
  useIcon: { backgroundColor: C.dangerLight },
  transactionDetails: { flex: 1 },
  transactionTitle: { color: C.ink, fontSize: 11, fontWeight: '800' },
  transactionMeta: { color: C.muted, fontSize: 9, marginTop: 4 },
  transactionNotes: { color: C.text, fontSize: 9, marginTop: 5, lineHeight: 14 },
  transactionQuantity: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  restockQuantity: { color: C.success },
  useQuantity: { color: C.danger },
  historyRefreshButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, marginTop: 8 },
  historyRefreshText: { color: C.primary, fontSize: 10, fontWeight: '800' },
})
