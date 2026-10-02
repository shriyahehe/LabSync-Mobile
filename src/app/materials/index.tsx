import { router } from 'expo-router'
import {
    AlertTriangle,
    ArrowLeft,
    Beaker,
    ChevronRight,
    Filter,
    Plus,
    Search,
} from 'lucide-react-native'
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

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

const materials = [
  {
    id: 'MAT-041',
    name: 'Tris-HCl Buffer',
    category: 'BUFFER',
    lab: 'BIOCHEMISTRY',
    stock: '850 mL',
    status: 'IN STOCK',
  },
  {
    id: 'MAT-038',
    name: 'Agarose',
    category: 'REAGENT',
    lab: 'BIOTECHNOLOGY',
    stock: '420 g',
    status: 'IN STOCK',
  },
  {
    id: 'MAT-027',
    name: 'Ethanol 99.9%',
    category: 'SOLVENT',
    lab: 'COMMON STORE',
    stock: '2.4 L',
    status: 'IN STOCK',
  },
  {
    id: 'MAT-019',
    name: 'Copper Sulphate',
    category: 'CHEMICAL',
    lab: 'MATERIALS',
    stock: '180 g',
    status: 'LOW STOCK',
  },
  {
    id: 'MAT-012',
    name: 'Sodium Chloride',
    category: 'CHEMICAL',
    lab: 'BIOCHEMISTRY',
    stock: '1.8 kg',
    status: 'IN STOCK',
  },
]

export default function MaterialsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
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
            <Text style={styles.eyebrow}>LABORATORY INVENTORY</Text>

            <Text style={styles.title}>Materials</Text>
          </View>

          <TouchableOpacity style={styles.addButton}>
            <Plus
              size={19}
              color={COLORS.white}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.rule} />

        {/* SEARCH */}

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
            />
          </View>

          <TouchableOpacity style={styles.filterButton}>
            <Filter
              size={18}
              color={COLORS.green}
              strokeWidth={1.7}
            />
          </TouchableOpacity>
        </View>

        {/* INVENTORY SUMMARY */}

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryNumber}>31</Text>
            <Text style={styles.summaryLabel}>MATERIALS</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View>
            <Text style={styles.summaryNumber}>05</Text>
            <Text style={styles.summaryLabel}>LOW STOCK</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View>
            <Text style={styles.summaryNumber}>03</Text>
            <Text style={styles.summaryLabel}>ORDERS</Text>
          </View>
        </View>

        {/* REGISTER */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>01</Text>

          <Text style={styles.sectionTitle}>
            MATERIAL REGISTER
          </Text>
        </View>

        <View style={styles.list}>
          {materials.map((material) => (
            <TouchableOpacity
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
                    {material.id}
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
                  {material.category}
                </Text>

                <Text style={styles.lab}>
                  {material.lab}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.stockLabel}>CURRENT STOCK</Text>

                  <Text style={styles.stock}>
                    {material.stock}
                  </Text>
                </View>

                <View
                  style={[
                    styles.status,
                    material.status === 'LOW STOCK'
                      ? styles.lowStatus
                      : styles.stockStatus,
                  ]}
                >
                  {material.status === 'LOW STOCK' && (
                    <AlertTriangle
                      size={11}
                      color={COLORS.brick}
                      strokeWidth={2}
                    />
                  )}

                  <Text
                    style={[
                      styles.statusText,
                      material.status === 'LOW STOCK'
                        ? styles.lowText
                        : styles.stockText,
                    ]}
                  >
                    {material.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* PROCUREMENT NOTE */}

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
              5 materials are below their configured reorder
              threshold.
            </Text>
          </View>
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