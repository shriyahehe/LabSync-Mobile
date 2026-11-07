
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
import { useMemo, useState } from 'react'
import {
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
  LabSyncSpacing as SP,
  LabSyncTypography as T,
} from '@/constants/labsync-theme'

type OrderStatus = 'ORDERED' | 'IN TRANSIT' | 'PENDING' | 'RECEIVED'

type Order = {
  id: string
  item: string
  quantity: string
  supplier: string
  date: string
  status: OrderStatus
}

const orders: Order[] = [
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

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'ORDERED':
      return { backgroundColor: C.surfaceSecondary, color: C.muted }
    case 'IN TRANSIT':
      return { backgroundColor: C.secondaryLight, color: C.secondary }
    case 'PENDING':
      return { backgroundColor: C.warningLight, color: C.warning }
    case 'RECEIVED':
      return { backgroundColor: C.successLight, color: C.success }
  }
}

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'IN TRANSIT':
      return Truck
    case 'RECEIVED':
      return PackageCheck
    default:
      return Clock3
  }
}

export default function ProcurementScreen() {
  const [search, setSearch] = useState('')

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return orders

    return orders.filter((order) =>
      [
        order.id,
        order.item,
        order.quantity,
        order.supplier,
        order.status,
      ].some((value) => value.toLowerCase().includes(query)),
    )
  }, [search])

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={19} color={C.ink} strokeWidth={1.8} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>MATERIALS MANAGEMENT</Text>
            <Text style={styles.title}>Procurement</Text>
            <Text style={styles.subtitle}>
              Track orders and incoming materials.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            accessibilityLabel="Create purchase order"
            activeOpacity={0.8}
          >
            <Plus size={21} color={C.white} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryEyebrow}>PROCUREMENT OVERVIEW</Text>
              <Text style={styles.summaryTitle}>Order activity</Text>
            </View>

            <View style={styles.summaryIcon}>
              <PackageCheck size={19} color={C.primary} />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>03</Text>
              <Text style={styles.statLabel}>PENDING</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <Text style={styles.statNumber}>02</Text>
              <Text style={styles.statLabel}>IN TRANSIT</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <Text style={styles.statNumber}>11</Text>
              <Text style={styles.statLabel}>THIS MONTH</Text>
            </View>
          </View>

          <View style={styles.summaryFooter}>
            <View style={styles.summaryFooterIcon}>
              <Truck size={14} color={C.primary} />
            </View>
            <Text style={styles.summaryFooterText}>
              Keep track of materials arriving at your laboratory.
            </Text>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Search size={18} color={C.muted} strokeWidth={1.8} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search item, supplier or order ID..."
            placeholderTextColor={C.subtle}
            style={styles.searchInput}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        {/* ORDER REGISTER */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>PURCHASE MANAGEMENT</Text>
            <Text style={styles.sectionTitle}>Order register</Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredOrders.length}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {filteredOrders.map((order) => {
            const statusStyle = getStatusStyle(order.status)
            const StatusIcon = getStatusIcon(order.status)

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.card}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={styles.orderIdRow}>
                    <View style={styles.orderIcon}>
                      <StatusIcon
                        size={17}
                        color={statusStyle.color}
                        strokeWidth={1.8}
                      />
                    </View>

                    <Text style={styles.orderId}>{order.id}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusStyle.backgroundColor },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemName}>{order.item}</Text>

                <View style={styles.detailsRow}>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{order.quantity}</Text>
                  </View>

                  <View style={styles.supplierInfo}>
                    <Text style={styles.supplierLabel}>SUPPLIER</Text>
                    <Text style={styles.supplierName}>{order.supplier}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.dateRow}>
                    <Clock3 size={14} color={C.muted} />
                    <View>
                      <Text style={styles.dateLabel}>EXPECTED DELIVERY</Text>
                      <Text style={styles.dateValue}>{order.date}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsLink}>
                    <Text style={styles.detailsText}>Details</Text>
                    <ChevronRight size={15} color={C.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}

          {filteredOrders.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Search size={23} color={C.muted} />
              </View>

              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptyText}>
                Try searching with another order ID, material or supplier.
              </Text>

              <TouchableOpacity
                onPress={() => setSearch('')}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* INCOMING MATERIALS */}
        <View style={styles.incomingCard}>
          <View style={styles.incomingIcon}>
            <Truck size={19} color={C.primary} />
          </View>

          <View style={styles.incomingContent}>
            <Text style={styles.incomingTitle}>Incoming materials</Text>
            <Text style={styles.incomingText}>
              Orders marked in transit are awaiting delivery. Inventory should
              be updated after materials are received.
            </Text>
          </View>
        </View>

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>
            LABSYNC · PROCUREMENT REGISTER
          </Text>
        </View>
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
    paddingHorizontal: SP.lg,
    paddingTop: SP.sm,
    paddingBottom: SP.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SP.xl,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: SP.md,
  },
  eyebrow: {
    color: C.accent,
    fontSize: T.eyebrow,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: C.ink,
    fontSize: T.heading1,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    color: C.muted,
    fontSize: T.bodySmall,
    marginTop: 3,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: R.pill,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: SP.lg,
    marginBottom: SP.lg,
    ...S.card,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryEyebrow: {
    color: C.muted,
    fontSize: T.eyebrow,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  summaryTitle: {
    color: C.ink,
    fontSize: T.heading3,
    fontWeight: '800',
    marginTop: 5,
  },
  summaryIcon: {
    width: 39,
    height: 39,
    borderRadius: R.md,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SP.lg,
    marginBottom: SP.md,
  },
  stat: {
    flex: 1,
  },
  statNumber: {
    color: C.ink,
    fontSize: 25,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: C.border,
    marginHorizontal: SP.sm,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingTop: SP.md,
    gap: SP.sm,
  },
  summaryFooterIcon: {
    width: 26,
    height: 26,
    borderRadius: R.pill,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryFooterText: {
    color: C.muted,
    fontSize: T.caption,
    flex: 1,
  },
  searchBox: {
    height: 48,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.md,
    marginBottom: SP.xl,
  },
  searchInput: {
    flex: 1,
    marginLeft: SP.sm,
    color: C.ink,
    fontSize: T.bodySmall,
    paddingVertical: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SP.md,
  },
  sectionEyebrow: {
    color: C.accent,
    fontSize: T.eyebrow,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  sectionTitle: {
    color: C.ink,
    fontSize: T.heading2,
    fontWeight: '800',
    marginTop: 4,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 9,
    borderRadius: R.pill,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: C.primary,
    fontSize: T.bodySmall,
    fontWeight: '800',
  },
  list: {
    gap: SP.md,
  },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: SP.lg,
    ...S.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
  },
  orderIcon: {
    width: 34,
    height: 34,
    borderRadius: R.md,
    backgroundColor: C.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderId: {
    color: C.secondary,
    fontSize: T.bodySmall,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: R.pill,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  itemName: {
    color: C.ink,
    fontSize: T.heading3,
    fontWeight: '800',
    marginTop: SP.md,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.md,
    marginTop: SP.md,
  },
  quantityBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: R.md,
    backgroundColor: C.primaryLight,
  },
  quantityText: {
    color: C.primary,
    fontSize: T.bodySmall,
    fontWeight: '800',
  },
  supplierInfo: {
    flex: 1,
  },
  supplierLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  supplierName: {
    color: C.ink,
    fontSize: T.bodySmall,
    fontWeight: '700',
    marginTop: 3,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    marginTop: SP.md,
    paddingTop: SP.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
  },
  dateLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateValue: {
    color: C.ink,
    fontSize: T.bodySmall,
    fontWeight: '700',
    marginTop: 3,
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsText: {
    color: C.primary,
    fontSize: T.bodySmall,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: SP.xxl,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: R.pill,
    backgroundColor: C.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: C.ink,
    fontSize: T.heading3,
    fontWeight: '800',
    marginTop: SP.md,
  },
  emptyText: {
    color: C.muted,
    fontSize: T.bodySmall,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: SP.xs,
  },
  clearButton: {
    marginTop: SP.md,
    backgroundColor: C.primaryLight,
    borderRadius: R.pill,
    paddingHorizontal: SP.lg,
    paddingVertical: SP.sm,
  },
  clearButtonText: {
    color: C.primary,
    fontSize: T.bodySmall,
    fontWeight: '800',
  },
  incomingCard: {
    marginTop: SP.xl,
    padding: SP.md,
    backgroundColor: C.primaryLight,
    borderRadius: R.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.md,
  },
  incomingIcon: {
    width: 40,
    height: 40,
    borderRadius: R.md,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomingContent: {
    flex: 1,
  },
  incomingTitle: {
    color: C.primaryDark,
    fontSize: T.bodySmall,
    fontWeight: '800',
  },
  incomingText: {
    color: C.text,
    fontSize: T.bodySmall,
    lineHeight: 18,
    marginTop: 3,
  },
  bottomNote: {
    alignItems: 'center',
    marginTop: SP.xxl,
  },
  bottomNoteText: {
    color: C.subtle,
    fontSize: T.eyebrow,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
})
