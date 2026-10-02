import { router } from 'expo-router'
import {
    ArrowLeft,
    ChevronRight,
    Clock3,
    PackageCheck,
    Plus,
    Search,
    Truck,
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

const orders = [
  {
    id: 'PO-018',
    item: 'Agarose',
    quantity: '500 g',
    supplier: 'Bio-Rad',
    date: '04 OCT',
    status: 'ORDERED',
  },
  {
    id: 'PO-017',
    item: 'Tris-HCl',
    quantity: '2 L',
    supplier: 'Merck',
    date: '03 OCT',
    status: 'IN TRANSIT',
  },
  {
    id: 'PO-016',
    item: 'Copper Sulphate',
    quantity: '500 g',
    supplier: 'SRL',
    date: '05 OCT',
    status: 'PENDING',
  },
  {
    id: 'PO-015',
    item: 'Ethanol 99.9%',
    quantity: '5 L',
    supplier: 'Fisher Scientific',
    date: '01 OCT',
    status: 'RECEIVED',
  },
]

export default function ProcurementScreen() {
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
            <Text style={styles.eyebrow}>
              MATERIALS & PROCUREMENT
            </Text>

            <Text style={styles.title}>Procurement</Text>
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

        <View style={styles.searchBox}>
          <Search
            size={17}
            color={COLORS.muted}
            strokeWidth={1.7}
          />

          <TextInput
            placeholder="Search orders..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
          />
        </View>

        {/* SUMMARY */}

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>03</Text>
            <Text style={styles.summaryLabel}>PENDING</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>02</Text>
            <Text style={styles.summaryLabel}>IN TRANSIT</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>11</Text>
            <Text style={styles.summaryLabel}>THIS MONTH</Text>
          </View>
        </View>

        {/* REGISTER */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>01</Text>

          <Text style={styles.sectionTitle}>
            PROCUREMENT REGISTER
          </Text>
        </View>

        <View style={styles.list}>
          {orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <View style={styles.idRow}>
                  {order.status === 'IN TRANSIT' ? (
                    <Truck
                      size={16}
                      color={COLORS.blue}
                      strokeWidth={1.7}
                    />
                  ) : order.status === 'RECEIVED' ? (
                    <PackageCheck
                      size={16}
                      color={COLORS.green}
                      strokeWidth={1.7}
                    />
                  ) : (
                    <Clock3
                      size={16}
                      color={COLORS.ochre}
                      strokeWidth={1.7}
                    />
                  )}

                  <Text style={styles.orderId}>
                    {order.id}
                  </Text>
                </View>

                <ChevronRight
                  size={17}
                  color={COLORS.muted}
                  strokeWidth={1.6}
                />
              </View>

              <Text style={styles.itemName}>
                {order.item}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.quantity}>
                  {order.quantity}
                </Text>

                <Text style={styles.supplier}>
                  {order.supplier}
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.expected}>
                  EXPECTED {order.date}
                </Text>

                <View
                  style={[
                    styles.status,
                    order.status === 'ORDERED' &&
                      styles.orderedStatus,
                    order.status === 'IN TRANSIT' &&
                      styles.transitStatus,
                    order.status === 'PENDING' &&
                      styles.pendingStatus,
                    order.status === 'RECEIVED' &&
                      styles.receivedStatus,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      order.status === 'ORDERED' &&
                        styles.orderedText,
                      order.status === 'IN TRANSIT' &&
                        styles.transitText,
                      order.status === 'PENDING' &&
                        styles.pendingText,
                      order.status === 'RECEIVED' &&
                        styles.receivedText,
                    ]}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* NOTE */}

        <View style={styles.note}>
          <Truck
            size={18}
            color={COLORS.green}
            strokeWidth={1.6}
          />

          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>
              INCOMING MATERIALS
            </Text>

            <Text style={styles.noteText}>
              2 orders are currently in transit and will update
              inventory when received.
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
    letterSpacing: 1.2,
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

  searchBox: {
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

  summary: {
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: COLORS.softGreen,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryItem: {
    alignItems: 'center',
    flex: 1,
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

  divider: {
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

  orderId: {
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  itemName: {
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

  quantity: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: '800',
  },

  supplier: {
    color: COLORS.muted,
    fontSize: 9,
    marginLeft: 10,
  },

  footer: {
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  expected: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  status: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 3,
  },

  orderedStatus: {
    backgroundColor: '#EEEDE7',
  },

  transitStatus: {
    backgroundColor: '#E2E9EC',
  },

  pendingStatus: {
    backgroundColor: '#F2E8D9',
  },

  receivedStatus: {
    backgroundColor: COLORS.softGreen,
  },

  statusText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  orderedText: {
    color: COLORS.muted,
  },

  transitText: {
    color: COLORS.blue,
  },

  pendingText: {
    color: COLORS.ochre,
  },

  receivedText: {
    color: COLORS.green,
  },

  note: {
    marginTop: 24,
    padding: 14,
    backgroundColor: COLORS.softGreen,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  noteContent: {
    flex: 1,
    marginLeft: 10,
  },

  noteTitle: {
    color: COLORS.green,
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