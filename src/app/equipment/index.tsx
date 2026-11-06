
import { router } from 'expo-router'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  Plus,
  Search,
  Wrench,
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

type EquipmentStatus = 'IN USE' | 'AVAILABLE' | 'MAINTENANCE'

type EquipmentItem = {
  id: string
  name: string
  lab: string
  status: EquipmentStatus
  nextService: string
}

const equipment: EquipmentItem[] = [
  {
    id: 'EQ-018',
    name: 'UV-Vis Spectrophotometer',
    lab: 'BIOCHEMISTRY',
    status: 'IN USE',
    nextService: '18 OCT 2026',
  },
  {
    id: 'EQ-014',
    name: 'Thermal Cycler',
    lab: 'BIOTECHNOLOGY',
    status: 'AVAILABLE',
    nextService: '24 OCT 2026',
  },
  {
    id: 'EQ-011',
    name: 'Materials Analyser',
    lab: 'MATERIALS',
    status: 'IN USE',
    nextService: '12 OCT 2026',
  },
  {
    id: 'EQ-006',
    name: 'Centrifuge',
    lab: 'BIOCHEMISTRY',
    status: 'MAINTENANCE',
    nextService: '03 OCT 2026',
  },
  {
    id: 'EQ-004',
    name: 'Digital Oscilloscope',
    lab: 'PHYSICS',
    status: 'AVAILABLE',
    nextService: '28 OCT 2026',
  },
]

const getStatusStyle = (status: EquipmentStatus) => {
  switch (status) {
    case 'IN USE':
      return {
        backgroundColor: C.primaryLight,
        color: C.primary,
      }
    case 'AVAILABLE':
      return {
        backgroundColor: C.secondaryLight,
        color: C.secondary,
      }
    case 'MAINTENANCE':
      return {
        backgroundColor: C.dangerLight,
        color: C.danger,
      }
  }
}

export default function EquipmentScreen() {
  const [search, setSearch] = useState('')

  const filteredEquipment = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return equipment

    return equipment.filter((item) =>
      [
        item.id,
        item.name,
        item.lab,
        item.status,
      ].some((value) => value.toLowerCase().includes(query)),
    )
  }, [search])

  const inUse = equipment.filter((item) => item.status === 'IN USE').length
  const available = equipment.filter((item) => item.status === 'AVAILABLE').length
  const maintenance = equipment.filter((item) => item.status === 'MAINTENANCE').length

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
            <Text style={styles.eyebrow}>LABORATORY MANAGEMENT</Text>
            <Text style={styles.title}>Equipment</Text>
            <Text style={styles.subtitle}>
              Your laboratory instruments at a glance.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            accessibilityLabel="Add equipment"
            activeOpacity={0.8}
          >
            <Plus size={21} color={C.white} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* OVERVIEW */}
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
              <View
                style={[
                  styles.progressSegment,
                  { flex: inUse, backgroundColor: C.primary },
                ]}
              />
              <View
                style={[
                  styles.progressSegment,
                  { flex: available, backgroundColor: C.secondary },
                ]}
              />
              <View
                style={[
                  styles.progressSegment,
                  { flex: maintenance, backgroundColor: C.danger },
                ]}
              />
            </View>
            <Text style={styles.totalLabel}>
              {equipment.length} registered instruments
            </Text>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Search size={18} color={C.muted} strokeWidth={1.8} />

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

        {/* REGISTER */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>INSTRUMENTATION</Text>
            <Text style={styles.sectionTitle}>Equipment register</Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {filteredEquipment.length}
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {filteredEquipment.map((item) => {
            const statusStyle = getStatusStyle(item.status)

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={styles.idContainer}>
                    <View style={styles.equipmentIcon}>
                      <Wrench size={17} color={C.primary} strokeWidth={1.8} />
                    </View>

                    <Text style={styles.equipmentId}>{item.id}</Text>
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
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.equipmentName}>{item.name}</Text>

                <View style={styles.labRow}>
                  <View style={styles.labDot} />
                  <Text style={styles.labText}>{item.lab}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.serviceRow}>
                    <CalendarClock size={14} color={C.muted} />

                    <View>
                      <Text style={styles.serviceLabel}>NEXT SERVICE</Text>
                      <Text style={styles.serviceDate}>{item.nextService}</Text>
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

          {filteredEquipment.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Search size={23} color={C.muted} />
              </View>

              <Text style={styles.emptyTitle}>No equipment found</Text>
              <Text style={styles.emptyText}>
                Try another instrument name, ID or laboratory.
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

        {/* MAINTENANCE NOTICE */}
        {maintenance > 0 && (
          <View style={styles.maintenanceCard}>
            <View style={styles.maintenanceIcon}>
              <AlertTriangle size={19} color={C.danger} />
            </View>

            <View style={styles.maintenanceContent}>
              <Text style={styles.maintenanceTitle}>
                Maintenance attention
              </Text>
              <Text style={styles.maintenanceText}>
                {maintenance} instrument{maintenance === 1 ? '' : 's'} currently
                require maintenance attention.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>
            LABSYNC · EQUIPMENT REGISTER
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
    marginBottom: SP.lg,
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
  overviewCard: {
    backgroundColor: C.surface,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: SP.lg,
    marginBottom: SP.lg,
    ...S.card,
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewEyebrow: {
    color: C.muted,
    fontSize: T.eyebrow,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  overviewTitle: {
    color: C.ink,
    fontSize: T.heading3,
    fontWeight: '800',
    marginTop: 5,
  },
  overviewIcon: {
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
    letterSpacing: 0.8,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: C.border,
    marginHorizontal: SP.sm,
  },
  overviewFooter: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingTop: SP.md,
  },
  progressTrack: {
    height: 7,
    borderRadius: R.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 3,
  },
  progressSegment: {
    borderRadius: R.pill,
  },
  totalLabel: {
    color: C.muted,
    fontSize: T.caption,
    marginTop: SP.sm,
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
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
  },
  equipmentIcon: {
    width: 34,
    height: 34,
    borderRadius: R.md,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentId: {
    color: C.secondary,
    fontSize: T.bodySmall,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: R.pill,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  equipmentName: {
    color: C.ink,
    fontSize: T.heading3,
    fontWeight: '800',
    marginTop: SP.md,
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: SP.sm,
  },
  labDot: {
    width: 6,
    height: 6,
    borderRadius: R.pill,
    backgroundColor: C.primary,
  },
  labText: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
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
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
  },
  serviceLabel: {
    color: C.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  serviceDate: {
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
  maintenanceCard: {
    marginTop: SP.xl,
    padding: SP.md,
    backgroundColor: C.dangerLight,
    borderRadius: R.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.md,
  },
  maintenanceIcon: {
    width: 38,
    height: 38,
    borderRadius: R.md,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maintenanceContent: {
    flex: 1,
  },
  maintenanceTitle: {
    color: C.danger,
    fontSize: T.bodySmall,
    fontWeight: '800',
  },
  maintenanceText: {
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
