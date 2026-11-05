
import { router, useFocusEffect } from 'expo-router'

import {
  AlertTriangle,
  ArrowLeft,
  Beaker,
  ChevronRight,
  Filter,
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
  getLaboratories,
  getMaterials,
} from '@/services/api'

import type {
  Laboratory,
  Material,
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
    () =>
      new Map(
        laboratories.map((lab) => [lab.id, lab])
      ),
    [laboratories]
  )

  const lowStockCount = materials.filter(
    (material) =>
      material.quantity <= material.minimum_quantity
  ).length

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLowerCase()

    return materials.filter((material) => {
      const laboratory = laboratoryMap.get(
        material.laboratory_id
      )

      const matchesSearch = [
        material.name,
        material.category,
        material.unit,
        laboratory?.name ?? '',
        laboratory?.department ?? '',
      ].some((value) =>
        value.toLowerCase().includes(query)
      )

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

  const getMaterialStatus = (material: Material) =>
    material.quantity <= material.minimum_quantity
      ? 'LOW STOCK'
      : 'IN STOCK'

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.eyebrow}>
              LABORATORY INVENTORY
            </Text>

            <Text style={styles.title}>Materials</Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              Alert.alert(
                'Add Material',
                'Material registration will be implemented in the next stage.'
              )
            }
          >
            <Plus
              size={19}
              color={COLORS.white}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.rule} />

        {/* SEARCH AND FILTER */}

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search
              size={17}
              color={COLORS.muted}
              strokeWidth={1.7}
            />

            <TextInput
              placeholder="Search materials..."
              placeholderTextColor={COLORS.muted}
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
              color={
                lowStockOnly
                  ? COLORS.white
                  : COLORS.green
              }
              strokeWidth={1.7}
            />
          </TouchableOpacity>
        </View>

        {lowStockOnly && (
          <Text style={styles.filterHint}>
            Showing low-stock materials only. Tap the filter to show all.
          </Text>
        )}

        {/* INVENTORY SUMMARY */}

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryNumber}>
              {materials.length.toString().padStart(2, '0')}
            </Text>
            <Text style={styles.summaryLabel}>
              MATERIALS
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View>
            <Text style={styles.summaryNumber}>
              {lowStockCount.toString().padStart(2, '0')}
            </Text>
            <Text style={styles.summaryLabel}>
              LOW STOCK
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View>
            <Text style={styles.summaryNumber}>
              {laboratories.length.toString().padStart(2, '0')}
            </Text>
            <Text style={styles.summaryLabel}>
              LABORATORIES
            </Text>
          </View>
        </View>

        {/* MATERIAL REGISTER */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>01</Text>

          <Text style={styles.sectionTitle}>
            MATERIAL REGISTER
          </Text>
        </View>

        {/* LOADING */}

        {loading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator
              size="large"
              color={COLORS.green}
            />
            <Text style={styles.stateText}>
              Loading laboratory inventory...
            </Text>
          </View>
        )}

        {/* ERROR */}

        {!loading && !!error && (
          <View style={styles.stateContainer}>
            <AlertTriangle
              size={25}
              color={COLORS.brick}
            />

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true)
                loadData()
              }}
            >
              <Text style={styles.retryText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MATERIAL CARDS */}

        {!loading && !error && (
          <View style={styles.list}>
            {filteredMaterials.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Beaker
                  size={27}
                  color={COLORS.muted}
                />

                <Text style={styles.emptyTitle}>
                  No materials found
                </Text>

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

                const status = getMaterialStatus(material)
                const isLowStock = status === 'LOW STOCK'

                return (
                  <View
                    key={material.id}
                    style={styles.card}
                  >
                    <View style={styles.cardTop}>
                      <View style={styles.idRow}>
                        <Beaker
                          size={16}
                          color={COLORS.green}
                          strokeWidth={1.6}
                        />

                        <Text style={styles.materialId}>
                          ID {material.id}
                        </Text>
                      </View>

                      <ChevronRight
                        size={17}
                        color={COLORS.muted}
                        strokeWidth={1.6}
                      />
                    </View>

                    <Text style={styles.materialName}>
                      {material.name}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.category}>
                        {material.category.toUpperCase()}
                      </Text>

                      <Text style={styles.lab}>
                        {laboratory?.department ||
                          laboratory?.name ||
                          `LAB ${material.laboratory_id}`}
                      </Text>
                    </View>

                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.stockLabel}>
                          CURRENT STOCK
                        </Text>

                        <Text style={styles.stock}>
                          {formatQuantity(material.quantity)}{' '}
                          {material.unit}
                        </Text>

                        <Text style={styles.minimumStock}>
                          Minimum: {formatQuantity(material.minimum_quantity)}{' '}
                          {material.unit}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.status,
                          isLowStock
                            ? styles.lowStatus
                            : styles.stockStatus,
                        ]}
                      >
                        {isLowStock && (
                          <AlertTriangle
                            size={11}
                            color={COLORS.brick}
                            strokeWidth={2}
                          />
                        )}

                        <Text
                          style={[
                            styles.statusText,
                            isLowStock
                              ? styles.lowText
                              : styles.stockText,
                          ]}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        )}

        {/* INVENTORY ATTENTION */}

        {!loading && !error && lowStockCount > 0 && (
          <View style={styles.note}>
            <View style={styles.noteIcon}>
              <AlertTriangle
                size={17}
                color={COLORS.ochre}
                strokeWidth={1.7}
              />
            </View>

            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>
                INVENTORY ATTENTION
              </Text>

              <Text style={styles.noteText}>
                {lowStockCount} material
                {lowStockCount === 1 ? ' is' : 's are'} below
                or at the configured minimum stock level.
              </Text>
            </View>
          </View>
        )}
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
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.paper,
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

  title: {
    color: COLORS.ink,
    fontSize: 27,
    fontWeight: '700',
    marginTop: 2,
  },

  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rule: {
    height: 1,
    backgroundColor: COLORS.ink,
    opacity: 0.15,
    marginVertical: 16,
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },

  searchBox: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    color: COLORS.ink,
    fontSize: 12,
  },

  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterButtonActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },

  filterHint: {
    color: COLORS.green,
    fontSize: 10,
    marginTop: 7,
  },

  summary: {
    marginTop: 16,
    backgroundColor: COLORS.softGreen,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryNumber: {
    color: COLORS.ink,
    fontSize: 23,
    fontWeight: '700',
  },

  summaryLabel: {
    color: COLORS.green,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 3,
  },

  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#B9CCC4',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 27,
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

  list: {
    gap: 9,
  },

  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 14,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  materialId: {
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  materialName: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 9,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  category: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  lab: {
    color: COLORS.muted,
    fontSize: 9,
    marginLeft: 10,
  },

  cardFooter: {
    marginTop: 14,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  stockLabel: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  stock: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },

  minimumStock: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
  },

  status: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  stockStatus: {
    backgroundColor: COLORS.softGreen,
  },

  lowStatus: {
    backgroundColor: '#F2DFD9',
  },

  statusText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  stockText: {
    color: COLORS.green,
  },

  lowText: {
    color: COLORS.brick,
  },

  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
    gap: 12,
  },

  stateText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  errorText: {
    color: COLORS.brick,
    fontSize: 12,
    textAlign: 'center',
  },

  retryButton: {
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 5,
  },

  retryText: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: '700',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 35,
    paddingHorizontal: 20,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },

  emptyTitle: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 6,
  },

  note: {
    marginTop: 24,
    padding: 14,
    backgroundColor: '#F2E8D9',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  noteIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F7EFE4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noteContent: {
    flex: 1,
    marginLeft: 10,
  },

  noteTitle: {
    color: COLORS.ochre,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  noteText: {
    color: COLORS.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
})
