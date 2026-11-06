
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  createSample,
  createSampleTransaction,
  getSamples,
  getSampleTransactions,
} from '../../services/api';

import type {
  CreateSampleInput,
  CreateSampleTransactionInput,
  Sample,
  SampleTransaction,
  SampleTransactionType,
} from '../../services/types';

const C = {
  background: '#F7F6F0',
  card: '#FFFFFF',
  green: '#244D3B',
  greenLight: '#E7EFE8',
  sage: '#A8B9A5',
  text: '#25352C',
  muted: '#81877F',
  border: '#E7E7DF',
  orange: '#C58B48',
  orangeLight: '#F8EFE2',
};

type ModalMode = 'register' | 'transaction' | null;

export default function SamplesScreen() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [transactions, setTransactions] = useState<SampleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);

  // Registration fields
  const [laboratoryId, setLaboratoryId] = useState('');
  const [sampleName, setSampleName] = useState('');
  const [sampleType, setSampleType] = useState('');
  const [description, setDescription] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [storageLocation, setStorageLocation] = useState('');

  // Transaction fields
  const [transactionType, setTransactionType] =
    useState<SampleTransactionType>('USE');
  const [transactionQuantity, setTransactionQuantity] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [sampleData, transactionData] = await Promise.all([
        getSamples(),
        getSampleTransactions(),
      ]);

      setSamples(Array.isArray(sampleData) ? sampleData : []);
      setTransactions(
        Array.isArray(transactionData) ? transactionData : []
      );
    } catch (error) {
      console.error('Failed to load samples:', error);
      Alert.alert(
        'Unable to load samples',
        'Check your connection to the LabSync server and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const filteredSamples = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return samples;

    return samples.filter((sample) =>
      [
        sample.name,
        sample.sample_type,
        sample.storage_location,
        String(sample.id),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [samples, search]);

  const totalSamples = samples.length;

  const totalAvailable = samples.reduce(
    (total, sample) =>
      total + Number(sample.available_quantity || 0),
    0
  );

  const lowStockCount = samples.filter((sample) => {
    const initial = Number(sample.initial_quantity);
    const available = Number(sample.available_quantity);

    return initial > 0 && available / initial <= 0.2;
  }).length;

  // IMPORTANT: This is a local filter, not the API function.
  const getTransactionsForSample = (sampleId: number) =>
    transactions.filter(
      (transaction) => transaction.sample_id === sampleId
    );

  const closeModal = () => {
    setModalMode(null);
    setSelectedSample(null);
  };

  const resetRegistrationForm = () => {
    setLaboratoryId('');
    setSampleName('');
    setSampleType('');
    setDescription('');
    setInitialQuantity('');
    setUnit('');
    setStorageLocation('');
  };

  const openRegisterModal = () => {
    resetRegistrationForm();
    setModalMode('register');
  };

  const handleCreateSample = async () => {
    const labId = Number(laboratoryId);
    const quantity = Number(initialQuantity);

    if (
      !laboratoryId.trim() ||
      !Number.isInteger(labId) ||
      labId <= 0
    ) {
      Alert.alert('Invalid laboratory', 'Enter a valid laboratory ID.');
      return;
    }

    if (!sampleName.trim() || !unit.trim()) {
      Alert.alert(
        'Missing information',
        'Sample name and unit are required.'
      );
      return;
    }

    if (
      !initialQuantity.trim() ||
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {
      Alert.alert(
        'Invalid quantity',
        'Enter a valid non-negative quantity.'
      );
      return;
    }

    const input: CreateSampleInput = {
      laboratory_id: labId,
      name: sampleName.trim(),
      sample_type: sampleType.trim(),
      description: description.trim(),
      initial_quantity: quantity,
      unit: unit.trim(),
      storage_location: storageLocation.trim(),
    };

    try {
      setSubmitting(true);
      await createSample(input);

      closeModal();
      Alert.alert('Success', 'Sample registered successfully.');
      await loadData();
    } catch (error) {
      console.error('Sample registration failed:', error);
      Alert.alert(
        'Registration failed',
        'The sample could not be registered. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openTransactionModal = (
    sample: Sample,
    type: SampleTransactionType
  ) => {
    setSelectedSample(sample);
    setTransactionType(type);
    setTransactionQuantity('');
    setPerformedBy('');
    setNotes('');
    setModalMode('transaction');
  };

  const handleTransaction = async () => {
    if (!selectedSample) return;

    const quantity = Number(transactionQuantity);
    const available = Number(selectedSample.available_quantity);
    const initial = Number(selectedSample.initial_quantity);

    if (
      !transactionQuantity.trim() ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      Alert.alert(
        'Invalid quantity',
        'Enter a quantity greater than zero.'
      );
      return;
    }

    if (!performedBy.trim()) {
      Alert.alert(
        'Researcher required',
        'Enter the researcher name.'
      );
      return;
    }

    if (transactionType === 'USE' && quantity > available) {
      Alert.alert(
        'Insufficient quantity',
        `Only ${available} ${selectedSample.unit} is available.`
      );
      return;
    }

    if (
      transactionType === 'RESTOCK' &&
      available + quantity > initial
    ) {
      Alert.alert(
        'Restock limit reached',
        `Restocking cannot exceed the original quantity of ${initial} ${selectedSample.unit}.`
      );
      return;
    }

    const input: CreateSampleTransactionInput = {
      sample_id: selectedSample.id,
      transaction_type: transactionType,
      quantity,
      performed_by: performedBy.trim(),
      notes: notes.trim(),
    };

    try {
      setSubmitting(true);
      await createSampleTransaction(input);

      closeModal();

      Alert.alert(
        'Transaction successful',
        transactionType === 'USE'
          ? 'Sample usage has been recorded.'
          : 'Sample restocking has been recorded.'
      );

      await loadData();
    } catch (error) {
      console.error('Sample transaction failed:', error);
      Alert.alert(
        'Transaction failed',
        'Unable to record this transaction. Check the quantity and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderSample = ({ item }: { item: Sample }) => {
    const available = Number(item.available_quantity);
    const initial = Number(item.initial_quantity);

    const percentage =
      initial > 0
        ? Math.min((available / initial) * 100, 100)
        : 0;

    const isLow = initial > 0 && percentage <= 20;

    // Corrected function name: avoids shadowing the imported API function.
    const sampleHistory = getTransactionsForSample(item.id);

    return (
      <View style={styles.sampleCard}>
        <View style={styles.sampleTop}>
          <View style={styles.sampleIcon}>
            <Text style={styles.sampleIconText}>◈</Text>
          </View>

          <View style={styles.sampleTitleContainer}>
            <Text style={styles.sampleName}>{item.name}</Text>
            <Text style={styles.sampleType}>
              {item.sample_type || 'Uncategorized'} · #{item.id}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isLow ? styles.lowBadge : styles.availableBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isLow ? styles.lowText : styles.availableText,
              ]}
            >
              {isLow ? 'LOW STOCK' : 'AVAILABLE'}
            </Text>
          </View>
        </View>

        <View style={styles.quantitySection}>
          <View style={styles.quantityHeader}>
            <Text style={styles.quantityLabel}>
              AVAILABLE QUANTITY
            </Text>
            <Text style={styles.quantityValue}>
              {available} / {initial} {item.unit}
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: isLow ? C.orange : C.green,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.sampleDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>LOCATION</Text>
            <Text style={styles.detailValue}>
              {item.storage_location || 'Not specified'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>TRANSACTIONS</Text>
            <Text style={styles.detailValue}>
              {sampleHistory.length}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : null}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.useButton}
            onPress={() => openTransactionModal(item, 'USE')}
          >
            <Text style={styles.useButtonText}>− Record usage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restockButton}
            onPress={() => openTransactionModal(item, 'RESTOCK')}
          >
            <Text style={styles.restockButtonText}>+ Restock</Text>
          </TouchableOpacity>
        </View>

        {sampleHistory.length > 0 && (
          <View style={styles.historyPreview}>
            <Text style={styles.historyTitle}>RECENT ACTIVITY</Text>

            {sampleHistory.slice(0, 2).map((transaction) => (
              <View key={transaction.id} style={styles.historyRow}>
                <Text style={styles.historyText}>
                  {transaction.transaction_type === 'USE'
                    ? 'Used'
                    : 'Restocked'}{' '}
                  {transaction.quantity} {item.unit}
                </Text>

                <Text style={styles.historyDate}>
                  {new Date(
                    transaction.created_at
                  ).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={C.background}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>LAB MANAGEMENT</Text>
          <Text style={styles.heading}>Samples</Text>
          <Text style={styles.subtitle}>
            Track and manage your laboratory specimens.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={openRegisterModal}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalSamples}</Text>
          <Text style={styles.statLabel}>TOTAL SAMPLES</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalAvailable}</Text>
          <Text style={styles.statLabel}>TOTAL QUANTITY</Text>
        </View>

        <View style={styles.statCard}>
          <Text
            style={[
              styles.statNumber,
              lowStockCount > 0 && { color: C.orange },
            ]}
          >
            {lowStockCount}
          </Text>
          <Text style={styles.statLabel}>LOW STOCK</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>⌕</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search samples, type or ID..."
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
        />

        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Sample inventory</Text>
          <Text style={styles.sectionSubtitle}>
            {filteredSamples.length} records found
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={C.green} />
          <Text style={styles.loadingText}>
            Loading sample inventory...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSamples}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSample}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.green}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>◈</Text>

              <Text style={styles.emptyTitle}>
                {search ? 'No matching samples' : 'No samples yet'}
              </Text>

              <Text style={styles.emptySubtitle}>
                {search
                  ? 'Try another search term.'
                  : 'Register your first laboratory sample to get started.'}
              </Text>

              {!search && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={openRegisterModal}
                >
                  <Text style={styles.emptyButtonText}>
                    Register sample
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <Modal
        visible={modalMode !== null}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>
                  {modalMode === 'register'
                    ? 'NEW INVENTORY'
                    : 'SAMPLE ACTIVITY'}
                </Text>

                <Text style={styles.modalTitle}>
                  {modalMode === 'register'
                    ? 'Register sample'
                    : transactionType === 'USE'
                      ? 'Record usage'
                      : 'Restock sample'}
                </Text>
              </View>

              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {modalMode === 'register' ? (
                <>
                  <Text style={styles.inputLabel}>LABORATORY ID *</Text>
                  <TextInput
                    style={styles.input}
                    value={laboratoryId}
                    onChangeText={setLaboratoryId}
                    placeholder="Enter laboratory ID"
                    placeholderTextColor={C.muted}
                    keyboardType="numeric"
                  />

                  <Text style={styles.inputLabel}>SAMPLE NAME *</Text>
                  <TextInput
                    style={styles.input}
                    value={sampleName}
                    onChangeText={setSampleName}
                    placeholder="e.g. Genomic DNA"
                    placeholderTextColor={C.muted}
                  />

                  <Text style={styles.inputLabel}>SAMPLE TYPE</Text>
                  <TextInput
                    style={styles.input}
                    value={sampleType}
                    onChangeText={setSampleType}
                    placeholder="e.g. DNA, RNA, Protein"
                    placeholderTextColor={C.muted}
                  />

                  <Text style={styles.inputLabel}>DESCRIPTION</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add sample details..."
                    placeholderTextColor={C.muted}
                    multiline
                  />

                  <Text style={styles.inputLabel}>
                    INITIAL QUANTITY *
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={initialQuantity}
                    onChangeText={setInitialQuantity}
                    placeholder="Enter quantity"
                    placeholderTextColor={C.muted}
                    keyboardType="decimal-pad"
                  />

                  <Text style={styles.inputLabel}>UNIT *</Text>
                  <TextInput
                    style={styles.input}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="e.g. mL, mg, units"
                    placeholderTextColor={C.muted}
                  />

                  <Text style={styles.inputLabel}>
                    STORAGE LOCATION
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={storageLocation}
                    onChangeText={setStorageLocation}
                    placeholder="e.g. Freezer A / Shelf 2"
                    placeholderTextColor={C.muted}
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      submitting && styles.disabledButton,
                    ]}
                    onPress={handleCreateSample}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        Register sample
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {selectedSample && (
                    <View style={styles.selectedSampleCard}>
                      <Text style={styles.selectedSampleName}>
                        {selectedSample.name}
                      </Text>
                      <Text style={styles.selectedSampleInfo}>
                        Available: {selectedSample.available_quantity}{' '}
                        {selectedSample.unit}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.inputLabel}>
                    TRANSACTION TYPE
                  </Text>

                  <View style={styles.transactionTypeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.transactionTypeButton,
                        transactionType === 'USE' && styles.selectedUse,
                      ]}
                      onPress={() => setTransactionType('USE')}
                    >
                      <Text
                        style={[
                          styles.transactionTypeText,
                          transactionType === 'USE' &&
                            styles.selectedTypeText,
                        ]}
                      >
                        − Usage
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.transactionTypeButton,
                        transactionType === 'RESTOCK' &&
                          styles.selectedRestock,
                      ]}
                      onPress={() => setTransactionType('RESTOCK')}
                    >
                      <Text
                        style={[
                          styles.transactionTypeText,
                          transactionType === 'RESTOCK' &&
                            styles.selectedTypeText,
                        ]}
                      >
                        + Restock
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>QUANTITY *</Text>
                  <TextInput
                    style={styles.input}
                    value={transactionQuantity}
                    onChangeText={setTransactionQuantity}
                    placeholder="Enter quantity"
                    placeholderTextColor={C.muted}
                    keyboardType="decimal-pad"
                  />

                  <Text style={styles.inputLabel}>
                    RESEARCHER NAME *
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={performedBy}
                    onChangeText={setPerformedBy}
                    placeholder="Who performed this transaction?"
                    placeholderTextColor={C.muted}
                  />

                  <Text style={styles.inputLabel}>NOTES</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Optional notes..."
                    placeholderTextColor={C.muted}
                    multiline
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      submitting && styles.disabledButton,
                    ]}
                    onPress={handleTransaction}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        Confirm transaction
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    color: C.muted,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 7,
  },
  heading: {
    fontSize: 32,
    color: C.green,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
  },
  addButton: {
    backgroundColor: C.green,
    paddingHorizontal: 19,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 9,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    paddingVertical: 17,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  statNumber: {
    fontSize: 25,
    fontWeight: '700',
    color: C.green,
  },
  statLabel: {
    fontSize: 8,
    color: C.muted,
    letterSpacing: 0.8,
    fontWeight: '700',
    marginTop: 7,
  },
  searchContainer: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    color: C.green,
    fontSize: 25,
    marginRight: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.text,
  },
  clearSearch: {
    fontSize: 23,
    color: C.muted,
    paddingHorizontal: 5,
  },
  sectionHeader: {
    paddingHorizontal: 21,
    paddingTop: 24,
    paddingBottom: 13,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 35,
    flexGrow: 1,
  },
  sampleCard: {
    backgroundColor: C.card,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 13,
  },
  sampleTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sampleIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: C.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sampleIconText: {
    color: C.green,
    fontSize: 24,
  },
  sampleTitleContainer: {
    flex: 1,
    marginLeft: 11,
  },
  sampleName: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
  },
  sampleType: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 7,
  },
  availableBadge: {
    backgroundColor: C.greenLight,
  },
  lowBadge: {
    backgroundColor: C.orangeLight,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  availableText: {
    color: C.green,
  },
  lowText: {
    color: C.orange,
  },
  quantitySection: {
    marginTop: 22,
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  quantityLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  quantityValue: {
    color: C.text,
    fontSize: 11,
    fontWeight: '700',
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#ECEDE7',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 10,
  },
  sampleDetails: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 30,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    color: C.muted,
    fontSize: 8,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  detailValue: {
    color: C.text,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
  description: {
    color: C.muted,
    fontSize: 11,
    marginTop: 14,
    lineHeight: 17,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 18,
  },
  useButton: {
    flex: 1,
    backgroundColor: '#F3F2EC',
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
  },
  useButtonText: {
    color: C.text,
    fontSize: 11,
    fontWeight: '700',
  },
  restockButton: {
    flex: 1,
    backgroundColor: C.greenLight,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
  },
  restockButtonText: {
    color: C.green,
    fontSize: 11,
    fontWeight: '700',
  },
  historyPreview: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 17,
    paddingTop: 13,
  },
  historyTitle: {
    color: C.muted,
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '800',
    marginBottom: 9,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  historyText: {
    color: C.text,
    fontSize: 10,
  },
  historyDate: {
    color: C.muted,
    fontSize: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: C.muted,
    fontSize: 12,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 65,
  },
  emptyIcon: {
    color: C.sage,
    fontSize: 45,
    marginBottom: 14,
  },
  emptyTitle: {
    color: C.green,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: C.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: C.green,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,35,27,0.42)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: C.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  modalEyebrow: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  modalTitle: {
    color: C.green,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 5,
  },
  closeButton: {
    color: C.muted,
    fontSize: 32,
    paddingHorizontal: 5,
  },
  inputLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 13,
    color: C.text,
    fontSize: 13,
  },
  multilineInput: {
    minHeight: 75,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: C.green,
    paddingVertical: 16,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  selectedSampleCard: {
    backgroundColor: C.greenLight,
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
  },
  selectedSampleName: {
    color: C.green,
    fontSize: 15,
    fontWeight: '700',
  },
  selectedSampleInfo: {
    color: C.muted,
    fontSize: 11,
    marginTop: 5,
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  transactionTypeButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#ECEDE7',
    alignItems: 'center',
  },
  selectedUse: {
    backgroundColor: C.green,
  },
  selectedRestock: {
    backgroundColor: C.orange,
  },
  transactionTypeText: {
    color: C.text,
    fontSize: 12,
    fontWeight: '700',
  },
  selectedTypeText: {
    color: '#FFFFFF',
  },
});
