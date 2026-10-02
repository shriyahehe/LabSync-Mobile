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

const equipment = [
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

export default function EquipmentScreen() {
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
              LABORATORY INSTRUMENTATION
            </Text>

            <Text style={styles.title}>Equipment</Text>
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
            placeholder="Search equipment..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
          />
        </View>

        {/* SUMMARY */}

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>06</Text>
            <Text style={styles.summaryLabel}>IN USE</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>04</Text>
            <Text style={styles.summaryLabel}>AVAILABLE</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>02</Text>
            <Text style={styles.summaryLabel}>ATTENTION</Text>
          </View>
        </View>

        {/* REGISTER */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>01</Text>

          <Text style={styles.sectionTitle}>
            EQUIPMENT REGISTER
          </Text>
        </View>

        <View style={styles.list}>
          {equipment.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <View style={styles.idRow}>
                  <Wrench
                    size={16}
                    color={COLORS.green}
                    strokeWidth={1.6}
                  />

                  <Text style={styles.equipmentId}>
                    {item.id}
                  </Text>
                </View>

                <ChevronRight
                  size={17}
                  color={COLORS.muted}
                  strokeWidth={1.6}
                />
              </View>

              <Text style={styles.equipmentName}>
                {item.name}
              </Text>

              <Text style={styles.lab}>{item.lab}</Text>

              <View style={styles.footer}>
                <View style={styles.serviceRow}>
                  <CalendarClock
                    size={13}
                    color={COLORS.muted}
                    strokeWidth={1.6}
                  />

                  <Text style={styles.serviceText}>
                    SERVICE {item.nextService}
                  </Text>
                </View>

                <View
                  style={[
                    styles.status,
                    item.status === 'IN USE' &&
                      styles.inUseStatus,
                    item.status === 'AVAILABLE' &&
                      styles.availableStatus,
                    item.status === 'MAINTENANCE' &&
                      styles.maintenanceStatus,
                  ]}
                >
                  {item.status === 'MAINTENANCE' && (
                    <AlertTriangle
                      size={10}
                      color={COLORS.brick}
                      strokeWidth={2}
                    />
                  )}

                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'IN USE' &&
                        styles.inUseText,
                      item.status === 'AVAILABLE' &&
                        styles.availableText,
                      item.status === 'MAINTENANCE' &&
                        styles.maintenanceText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* MAINTENANCE NOTE */}

        <View style={styles.note}>
          <AlertTriangle
            size={18}
            color={COLORS.brick}
            strokeWidth={1.7}
          />

          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>
              MAINTENANCE ATTENTION
            </Text>

            <Text style={styles.noteText}>
              2 instruments currently require maintenance
              attention before their next scheduled use.
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
    letterSpacing: 1.1,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryItem: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  equipmentId: {
    color: COLORS.blue,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  equipmentName: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 9,
  },

  lab: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 6,
  },

  footer: {
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  serviceText: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  status: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  inUseStatus: {
    backgroundColor: COLORS.softGreen,
  },

  availableStatus: {
    backgroundColor: '#E7ECEC',
  },

  maintenanceStatus: {
    backgroundColor: '#F2DFD9',
  },

  statusText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  inUseText: {
    color: COLORS.green,
  },

  availableText: {
    color: COLORS.blue,
  },

  maintenanceText: {
    color: COLORS.brick,
  },

  note: {
    marginTop: 24,
    padding: 14,
    backgroundColor: '#F2DFD9',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  noteContent: {
    flex: 1,
    marginLeft: 10,
  },

  noteTitle: {
    color: COLORS.brick,
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