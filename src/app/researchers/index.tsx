import { router, useFocusEffect, type Href } from 'expo-router'
import {
    ArrowLeft,
    ChevronRight,
    Filter,
    FlaskConical,
    Plus,
    RefreshCw,
    Search,
    Users,
    X,
} from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import {
    ActivityIndicator,
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
    LabSyncSpacing as SP,
    LabSyncTypography as T,
} from '@/constants/labsync-theme'
import { getLaboratories, getResearchers } from '@/services/api'
import type { Laboratory, Researcher, ResearcherStatus, ResearcherType } from '@/services/types'

type TypeFilter = 'ALL' | ResearcherType
type StatusFilter = 'ALL' | ResearcherStatus

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')

const scholarLabel = (type: ResearcherType) =>
  type === 'PHD_SCHOLAR' ? 'PhD Scholar' : 'Research Scholar'

export default function ResearchersScreen() {
  const [researchers, setResearchers] = useState<Researcher[]>([])
  const [laboratories, setLaboratories] = useState<Laboratory[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [labFilter, setLabFilter] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      setError('')
      const [researcherRows, labRows] = await Promise.all([
        getResearchers(),
        getLaboratories(),
      ])
      setResearchers(researcherRows ?? [])
      setLaboratories(labRows ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load researchers.')
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

  const activeCount = researchers.filter((r) => r.status === 'ACTIVE').length
  const inactiveCount = researchers.length - activeCount
  const researchScholarCount = researchers.filter((r) => r.researcher_type === 'RESEARCH_SCHOLAR').length
  const phdCount = researchers.filter((r) => r.researcher_type === 'PHD_SCHOLAR').length

  const filteredResearchers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return researchers.filter((researcher) => {
      const matchesSearch = [
        researcher.full_name,
        researcher.researcher_code,
        researcher.email ?? '',
        researcher.department ?? '',
        researcher.primary_laboratory ?? '',
      ].some((value) => value.toLowerCase().includes(query))
      return matchesSearch &&
        (typeFilter === 'ALL' || researcher.researcher_type === typeFilter) &&
        (statusFilter === 'ALL' || researcher.status === statusFilter) &&
        (labFilter === null || researcher.primary_laboratory_id === labFilter)
    })
  }, [researchers, search, typeFilter, statusFilter, labFilter])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const clearFilters = () => {
    setTypeFilter('ALL')
    setStatusFilter('ALL')
    setLabFilter(null)
    setSearch('')
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.stateText}>Loading researchers...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
            <ArrowLeft size={19} color={C.ink} />
          </TouchableOpacity>
          <View style={styles.topBarText}>
            <Text style={styles.eyebrow}>LABSYNC DIRECTORY</Text>
            <Text style={styles.pageTitle}>Researchers</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} accessibilityLabel="Refresh researchers">
            <RefreshCw size={17} color={C.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.introRow}>
          <View style={styles.introIcon}>
            <Users size={20} color={C.primary} />
          </View>
          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>Research team</Text>
            <Text style={styles.introSubtitle}>Manage scholars and their laboratory profiles.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/researchers/create')}>
            <Plus size={17} color={C.white} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn't load researchers</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadData}><Text style={styles.retryText}>Try again</Text></TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Text style={[styles.statLabel, styles.statLabelLight]}>TOTAL</Text>
            <Text style={[styles.statValue, styles.statValueLight]}>{researchers.length}</Text>
            <Text style={[styles.statFoot, styles.statFootLight]}>Researchers</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHeading}><View style={styles.dotActive} /><Text style={styles.statLabel}>ACTIVE</Text></View>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statFoot}>Currently active</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHeading}><View style={styles.dotInactive} /><Text style={styles.statLabel}>INACTIVE</Text></View>
            <Text style={styles.statValue}>{inactiveCount}</Text>
            <Text style={styles.statFoot}>Not active</Text>
          </View>
        </View>

        <View style={styles.breakdownCard}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Scholar breakdown</Text>
            <Text style={styles.totalHint}>{researchers.length} total</Text>
          </View>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, { backgroundColor: C.secondaryLight }]}><FlaskConical size={16} color={C.secondary} /></View>
              <View style={styles.breakdownCopy}><Text style={styles.breakdownValue}>{researchScholarCount}</Text><Text style={styles.breakdownLabel}>Research Scholars</Text></View>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownIcon, { backgroundColor: C.accentLight }]}><FlaskConical size={16} color={C.accent} /></View>
              <View style={styles.breakdownCopy}><Text style={styles.breakdownValue}>{phdCount}</Text><Text style={styles.breakdownLabel}>PhD Scholars</Text></View>
            </View>
          </View>
        </View>

        <View style={styles.listHeading}>
          <View><Text style={styles.sectionTitle}>Research team</Text><Text style={styles.listSubheading}>{filteredResearchers.length} researchers shown</Text></View>
          <TouchableOpacity style={[styles.filterButton, showFilters && styles.filterButtonActive]} onPress={() => setShowFilters((v) => !v)}>
            <Filter size={15} color={showFilters ? C.white : C.primary} />
            <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>Filter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Search size={18} color={C.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, ID, email or lab..."
            placeholderTextColor={C.subtle}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 ? <TouchableOpacity onPress={() => setSearch('')}><X size={17} color={C.muted} /></TouchableOpacity> : null}
        </View>

        {showFilters ? (
          <View style={styles.filterPanel}>
            <Text style={styles.filterLabel}>SCHOLAR TYPE</Text>
            <View style={styles.chipRow}>
              {([{ value: 'ALL', label: 'All types' }, { value: 'RESEARCH_SCHOLAR', label: 'Research Scholar' }, { value: 'PHD_SCHOLAR', label: 'PhD Scholar' }] as const).map((item) => (
                <TouchableOpacity key={item.value} onPress={() => setTypeFilter(item.value)} style={[styles.chip, typeFilter === item.value && styles.chipSelected]}>
                  <Text style={[styles.chipText, typeFilter === item.value && styles.chipTextSelected]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterLabel}>STATUS</Text>
            <View style={styles.chipRow}>
              {([{ value: 'ALL', label: 'All' }, { value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }] as const).map((item) => (
                <TouchableOpacity key={item.value} onPress={() => setStatusFilter(item.value)} style={[styles.chip, statusFilter === item.value && styles.chipSelected]}>
                  <Text style={[styles.chipText, statusFilter === item.value && styles.chipTextSelected]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterLabel}>PRIMARY LABORATORY</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity onPress={() => setLabFilter(null)} style={[styles.chip, labFilter === null && styles.chipSelected]}>
                <Text style={[styles.chipText, labFilter === null && styles.chipTextSelected]}>All labs</Text>
              </TouchableOpacity>
              {laboratories.map((lab) => (
                <TouchableOpacity key={lab.id} onPress={() => setLabFilter(lab.id)} style={[styles.chip, labFilter === lab.id && styles.chipSelected]}>
                  <Text style={[styles.chipText, labFilter === lab.id && styles.chipTextSelected]}>{lab.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.clearFilters} onPress={clearFilters}><Text style={styles.clearFiltersText}>Clear all filters</Text></TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.researcherList}>
          {filteredResearchers.map((researcher) => (
            <TouchableOpacity
              key={researcher.id}
              style={styles.researcherCard}
              activeOpacity={0.78}
              onPress={() => router.push({
                pathname: '/researchers/[id]',
                params: { id: String(researcher.id) },
              } as Href)}
            >
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials(researcher.full_name)}</Text></View>
              <View style={styles.researcherInfo}>
                <Text style={styles.researcherName} numberOfLines={1}>{researcher.full_name}</Text>
                <Text style={styles.researcherMeta}>{researcher.researcher_code} · {scholarLabel(researcher.researcher_type)}</Text>
                <Text style={styles.researcherLab} numberOfLines={1}>{researcher.department || 'Department not specified'} · {researcher.primary_laboratory}</Text>
              </View>
              <View style={styles.cardTrailing}>
                <View style={[styles.statusPill, researcher.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
                  <Text style={[styles.statusText, researcher.status === 'ACTIVE' ? styles.statusTextActive : styles.statusTextInactive]}>{researcher.status}</Text>
                </View>
                <ChevronRight size={17} color={C.subtle} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {!error && filteredResearchers.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Users size={24} color={C.primary} /></View>
            <Text style={styles.emptyTitle}>{researchers.length === 0 ? 'No researchers yet' : 'No matching researchers'}</Text>
            <Text style={styles.emptyText}>{researchers.length === 0 ? 'Add your first researcher to begin building the laboratory team.' : 'Try changing your search or filters.'}</Text>
            {researchers.length === 0 ? <TouchableOpacity style={styles.emptyAddButton} onPress={() => router.push('/researchers/create')}><Plus size={16} color={C.white}/><Text style={styles.emptyAddText}>Add researcher</Text></TouchableOpacity> : <TouchableOpacity onPress={clearFilters}><Text style={styles.retryText}>Clear filters</Text></TouchableOpacity>}
          </View>
        ) : null}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  content: { padding: SP.lg, paddingBottom: SP.xxxl },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SP.md },
  stateText: { color: C.muted, fontSize: T.body },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: SP.xl, gap: SP.md },
  backButton: { width: 40, height: 40, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  topBarText: { flex: 1 },
  eyebrow: { color: C.muted, fontSize: T.eyebrow, fontWeight: '800', letterSpacing: 1.4 },
  pageTitle: { color: C.ink, fontSize: T.heading1, fontWeight: '900', marginTop: 2 },
  refreshButton: { width: 40, height: 40, borderRadius: R.md, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.lg },
  introIcon: { width: 42, height: 42, borderRadius: R.md, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  introCopy: { flex: 1 },
  introTitle: { color: C.ink, fontSize: T.heading3, fontWeight: '800' },
  introSubtitle: { color: C.muted, fontSize: T.caption, marginTop: 3 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, borderRadius: R.lg, paddingHorizontal: 14, paddingVertical: 11 },
  addButtonText: { color: C.white, fontSize: T.bodySmall, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', gap: SP.sm, marginBottom: SP.md },
  statCard: { flex: 1, minHeight: 112, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: SP.md, ...S.card },
  statCardPrimary: { backgroundColor: C.primary, borderColor: C.primary },
  statHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  statLabelLight: { color: 'rgba(255,255,255,0.75)' },
  statValue: { color: C.ink, fontSize: 27, fontWeight: '900', marginTop: 8 },
  statValueLight: { color: C.white },
  statFoot: { color: C.muted, fontSize: 9, marginTop: 1 },
  statFootLight: { color: 'rgba(255,255,255,0.78)' },
  dotActive: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
  dotInactive: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.subtle },
  breakdownCard: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: SP.md, marginBottom: SP.xl, ...S.card },
  sectionHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: C.ink, fontSize: T.heading3, fontWeight: '800' },
  totalHint: { color: C.muted, fontSize: T.caption },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginTop: SP.md },
  breakdownItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  breakdownIcon: { width: 34, height: 34, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  breakdownCopy: { flex: 1 },
  breakdownValue: { color: C.ink, fontSize: 18, fontWeight: '900' },
  breakdownLabel: { color: C.muted, fontSize: 9, marginTop: 1 },
  breakdownDivider: { width: 1, height: 34, backgroundColor: C.divider, marginHorizontal: SP.sm },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md },
  listSubheading: { color: C.muted, fontSize: T.caption, marginTop: 3 },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: R.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  filterButtonActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterButtonText: { color: C.primary, fontSize: T.bodySmall, fontWeight: '800' },
  filterButtonTextActive: { color: C.white },
  searchBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: SP.sm, paddingHorizontal: SP.md, borderRadius: R.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, marginBottom: SP.md },
  searchInput: { flex: 1, color: C.ink, fontSize: T.bodySmall, paddingVertical: 11 },
  filterPanel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: SP.md, marginBottom: SP.md },
  filterLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: SP.sm, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: R.pill, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: C.background },
  chipSelected: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: C.text, fontSize: 10, fontWeight: '700' },
  chipTextSelected: { color: C.white },
  clearFilters: { alignSelf: 'flex-end', marginTop: SP.md, padding: 5 },
  clearFiltersText: { color: C.primary, fontSize: T.caption, fontWeight: '800' },
  researcherList: { gap: SP.sm },
  researcherCard: { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, ...S.card },
  avatar: { width: 46, height: 46, borderRadius: R.md, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.primaryDark, fontSize: 14, fontWeight: '900' },
  researcherInfo: { flex: 1, minWidth: 0 },
  researcherName: { color: C.ink, fontSize: T.body, fontWeight: '800' },
  researcherMeta: { color: C.muted, fontSize: 10, marginTop: 4 },
  researcherLab: { color: C.subtle, fontSize: 9, marginTop: 4 },
  cardTrailing: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' },
  statusPill: { borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 5 },
  statusActive: { backgroundColor: C.successLight },
  statusInactive: { backgroundColor: C.surfaceSecondary },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  statusTextActive: { color: C.success },
  statusTextInactive: { color: C.muted },
  emptyCard: { alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: SP.xl, marginTop: SP.sm },
  emptyIcon: { width: 52, height: 52, borderRadius: R.xl, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SP.md },
  emptyTitle: { color: C.ink, fontSize: T.heading3, fontWeight: '800' },
  emptyText: { color: C.muted, fontSize: T.bodySmall, textAlign: 'center', lineHeight: 19, marginTop: 6, marginBottom: SP.md },
  emptyAddButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.primary, borderRadius: R.md, paddingHorizontal: 15, paddingVertical: 11 },
  emptyAddText: { color: C.white, fontSize: T.bodySmall, fontWeight: '800' },
  errorCard: { padding: SP.md, backgroundColor: C.dangerLight, borderRadius: R.md, marginBottom: SP.md },
  errorTitle: { color: C.danger, fontWeight: '800', fontSize: T.bodySmall },
  errorText: { color: C.text, fontSize: T.caption, marginTop: 4 },
  retryText: { color: C.primary, fontWeight: '800', fontSize: T.bodySmall, marginTop: 8 },
  bottomSpace: { height: SP.xl },
})
