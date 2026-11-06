
import { router, useFocusEffect } from 'expo-router'
import {
  AlertTriangle,
  ArrowLeft,
  Beaker,
  ChevronRight,
  Filter,
  FlaskConical,
  Package,
  Plus,
  Search,
} from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
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

import {
  getLaboratories,
  getMaterials,
} from '@/services/api'

import type {
  Laboratory,
  Material,
} from '@/services/types'

export default function MaterialsScreen() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setError('')

      const [materialData, laboratoryData] = await Promise.all([
        getMaterials(),
        getLaboratories(),
      ])

      setMaterials(materialData)
      setLaboratories(laboratoryData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load inventory.'
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
        !lowStockOnly ||
        material.quantity <= material.minimum_quantity

      return matchesSearch && matchesStock
    })
  }, [materials, laboratoryMap, search, lowStockOnly])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const formatQuantity = (quantity: number) =>
    Number(quantity).toLocaleString('en-IN')

  const openAddMaterial = () => {
    Alert.alert(
      'Add Material',
      'Material registration will be implemented in the next stage.'
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={19} color={C.ink} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>LABORATORY INVENTORY</Text>
            <Text style={styles.title}>Materials</Text>
            <Text style={styles.subtitle}>
              Track and manage your laboratory supplies.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddMaterial}
          >
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
            style={[
              styles.filterButton,
              lowStockOnly && styles.filterButtonActive,
            ]}
            onPress={() => setLowStockOnly((current) => !current)}
          >
            <Filter
              size={18}
              color={lowStockOnly ? C.white : C.primary}
            />
          </TouchableOpacity>
        </View>

        {lowStockOnly && (
          <TouchableOpacity
            style={styles.filterHint}
            onPress={() => setLowStockOnly(false)}
          >
            <Text style={styles.filterHintText}>
              Showing low-stock materials · Clear filter
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeading}>
            <View style={styles.summaryIcon}>
              <Package size={17} color={C.primary} />
            </View>
            <Text style={styles.summaryTitle}>Inventory overview</Text>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {materials.length.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.summaryLabel}>MATERIALS</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryValue,
                  lowStockCount > 0 && styles.warningValue,
                ]}
              >
                {lowStockCount.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.summaryLabel}>LOW STOCK</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {laboratories.length.toString().padStart(2, '0')}
              </Text>
              <Text style={styles.summaryLabel}>LABS</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Material register</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredMaterials.length} materials displayed
            </Text>
          </View>
          <View style={styles.sectionIcon}>
            <FlaskConical size={17} color={C.primary} />
          </View>
        </View>

        {loading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.stateText}>
              Loading laboratory inventory...
            </Text>
          </View>
        )}

        {!loading && !!error && (
          <View style={styles.stateCard}>
            <AlertTriangle size={27} color={C.danger} />
            <Text style={styles.errorTitle}>Unable to load materials</Text>
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
        )}

        {!loading && !error && (
          <View style={styles.list}>
            {filteredMaterials.length === 0 ? (
              <View style={styles.stateCard}>
                <View style={styles.emptyIcon}>
                  <Beaker size={27} color={C.primary} />
                </View>
                <Text style={styles.emptyTitle}>No materials found</Text>
                <Text style={styles.emptyText}>
                  {materials.length === 0
                    ? 'No materials have been registered in the inventory yet.'
                    : 'Try changing your search or stock filter.'}
                </Text>
              </View>
            ) : (
              filteredMaterials.map((material) => {
                const laboratory = laboratoryMap.get(
                  material.laboratory_id
                )

                const isLowStock =
                  material.quantity <= material.minimum_quantity

                return (
                  <View key={material.id} style={styles.materialCard}>
                    <View style={styles.materialCardTop}>
                      <View style={styles.materialIcon}>
                        <Beaker size={19} color={C.primary} />
                      </View>

                      <View style={styles.materialHeading}>
                        <Text style={styles.materialName}>
                          {material.name}
                        </Text>
                        <Text style={styles.materialId}>
                          MATERIAL ID · {material.id}
                        </Text>
                      </View>

                      <ChevronRight size={18} color={C.subtle} />
                    </View>

                    <View style={styles.metadataRow}>
                      <View style={styles.categoryTag}>
                        <Text style={styles.categoryText}>
                          {material.category.toUpperCase()}
                        </Text>
                      </View>

                      <Text style={styles.labText}>
                        {laboratory?.department ||
                          laboratory?.name ||
                          `Lab ${material.laboratory_id}`}
                      </Text>
                    </View>

                    <View style={styles.stockPanel}>
                      <View>
                        <Text style={styles.stockLabel}>CURRENT STOCK</Text>
                        <View style={styles.quantityRow}>
                          <Text style={styles.stockValue}>
                            {formatQuantity(material.quantity)}
                          </Text>
                          <Text style={styles.stockUnit}>
                            {material.unit}
                          </Text>
                        </View>
                        <Text style={styles.minimumText}>
                          Minimum: {formatQuantity(material.minimum_quantity)}{' '}
                          {material.unit}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusPill,
                          isLowStock
                            ? styles.lowStatus
                            : styles.availableStatus,
                        ]}
                      >
                        {isLowStock ? (
                          <AlertTriangle size={12} color={C.danger} />
                        ) : (
                          <View style={styles.availableDot} />
                        )}
                        <Text
                          style={[
                            styles.statusText,
                            isLowStock
                              ? styles.lowStatusText
                              : styles.availableStatusText,
                          ]}
                        >
                          {isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        )}

        {!loading && !error && lowStockCount > 0 && (
          <View style={styles.attentionCard}>
            <View style={styles.attentionIcon}>
              <AlertTriangle size={18} color={C.accent} />
            </View>
            <View style={styles.attentionContent}>
              <Text style={styles.attentionTitle}>
                Inventory attention
              </Text>
              <Text style={styles.attentionText}>
                {lowStockCount} material
                {lowStockCount === 1 ? ' is' : 's are'} below or at the
                configured minimum stock level.
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          LABSYNC · MATERIALS REGISTER
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
    marginBottom: 23,
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
  searchRow: {
    flexDirection: 'row',
    gap: 9,
  },
  searchBox: {
    flex: 1,
    height: 47,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: C.ink,
    fontSize: 12,
  },
  filterButton: {
    width: 47,
    height: 47,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  filterHint: {
    marginTop: 9,
    alignSelf: 'flex-start',
  },
  filterHintText: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  summaryCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: R.lg,
    backgroundColor: C.primaryLight,
  },
  summaryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 16,
  },
  summaryIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    color: C.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryValue: {
    color: C.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  warningValue: {
    color: C.danger,
  },
  summaryLabel: {
    color: C.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 3,
  },
  summaryDivider: {
    height: 34,
    width: 1,
    backgroundColor: '#B9CCC4',
    marginHorizontal: 9,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  sectionIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 11,
  },
  materialCard: {
    padding: 15,
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    ...S.card,
  },
  materialCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialHeading: {
    flex: 1,
    marginLeft: 11,
  },
  materialName: {
    color: C.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  materialId: {
    color: C.subtle,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginTop: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 13,
  },
  categoryTag: {
    backgroundColor: C.secondaryLight,
    borderRadius: R.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  categoryText: {
    color: C.secondary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  labText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  stockPanel: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 3,
  },
  stockValue: {
    color: C.ink,
    fontSize: 21,
    fontWeight: '800',
  },
  stockUnit: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  minimumText: {
    color: C.muted,
    fontSize: 9,
    marginTop: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: R.pill,
  },
  lowStatus: {
    backgroundColor: C.dangerLight,
  },
  availableStatus: {
    backgroundColor: C.successLight,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: C.success,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  lowStatusText: {
    color: C.danger,
  },
  availableStatusText: {
    color: C.success,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
    gap: 12,
  },
  stateText: {
    color: C.muted,
    fontSize: 12,
  },
  stateCard: {
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 8,
  },
  errorText: {
    color: C.danger,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  retryButton: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 19,
    paddingVertical: 10,
    borderRadius: R.md,
    marginTop: 14,
  },
  retryText: {
    color: C.primary,
    fontSize: 12,
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
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 6,
  },
  attentionCard: {
    marginTop: 22,
    padding: 14,
    borderRadius: R.lg,
    backgroundColor: C.warningLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  attentionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionContent: {
    flex: 1,
  },
  attentionTitle: {
    color: C.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  attentionText: {
    color: C.text,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  footer: {
    color: C.subtle,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 28,
  },
})
