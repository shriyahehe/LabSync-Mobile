import { router } from 'expo-router'
import {
    BarChart3,
    Beaker,
    ChevronRight,
    ClipboardList,
    FileSpreadsheet,
    FlaskConical,
    Package,
    Settings,
    ShieldCheck,
    Users,
    Wrench,
} from 'lucide-react-native'
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
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
  border: '#D8DDD8',
}

const menu = [
  {
    title: 'Materials',
    description: 'Chemicals, reagents and stock levels',
    icon: FlaskConical,
    route: '/materials',
  },
  {
    title: 'Procurement',
    description: 'Orders, suppliers and incoming materials',
    icon: Package,
    route: '/procurement',
  },
  {
    title: 'Equipment',
    description: 'Instruments, usage and maintenance',
    icon: Wrench,
    route: '/equipment',
  },
  {
    title: 'Monthly Reports',
    description: 'Laboratory activity and inventory reports',
    icon: FileSpreadsheet,
    route: '/reports',
  },
]

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              LABORATORY FIELD REGISTER
            </Text>

            <Text style={styles.title}>More</Text>
          </View>

          <View style={styles.logoMark}>
            <Beaker
              size={20}
              color={COLORS.green}
              strokeWidth={1.6}
            />
          </View>
        </View>

        <View style={styles.rule} />

        {/* RECORDS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>01</Text>

          <Text style={styles.sectionTitle}>
            LABORATORY RECORDS
          </Text>
        </View>

        <View style={styles.menuCard}>
          {menu.map((item, index) => {
            const Icon = item.icon

            return (
              <View key={item.title}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={styles.iconBox}>
                    <Icon
                      size={19}
                      color={COLORS.green}
                      strokeWidth={1.6}
                    />
                  </View>

                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.menuDescription}>
                      {item.description}
                    </Text>
                  </View>

                  <ChevronRight
                    size={18}
                    color={COLORS.muted}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>

                {index < menu.length - 1 && (
                  <View style={styles.menuDivider} />
                )}
              </View>
            )
          })}
        </View>

        {/* MANAGEMENT */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionNumber}>02</Text>

          <Text style={styles.sectionTitle}>
            LAB MANAGEMENT
          </Text>
        </View>

        <View style={styles.managementGrid}>
          <TouchableOpacity style={styles.managementCard}>
            <Users
              size={20}
              color={COLORS.blue}
              strokeWidth={1.6}
            />

            <Text style={styles.managementTitle}>
              Team
            </Text>

            <Text style={styles.managementText}>
              Researchers & members
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.managementCard}>
            <ShieldCheck
              size={20}
              color={COLORS.green}
              strokeWidth={1.6}
            />

            <Text style={styles.managementTitle}>
              Protocols
            </Text>

            <Text style={styles.managementText}>
              Laboratory procedures
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.managementCard}>
            <ClipboardList
              size={20}
              color={COLORS.ochre}
              strokeWidth={1.6}
            />

            <Text style={styles.managementTitle}>
              Activity
            </Text>

            <Text style={styles.managementText}>
              Recent record changes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.managementCard}>
            <BarChart3
              size={20}
              color={COLORS.blue}
              strokeWidth={1.6}
            />

            <Text style={styles.managementTitle}>
              Analytics
            </Text>

            <Text style={styles.managementText}>
              Laboratory overview
            </Text>
          </TouchableOpacity>
        </View>

        {/* SETTINGS */}

        <TouchableOpacity style={styles.settingsCard}>
          <View style={styles.settingsIcon}>
            <Settings
              size={19}
              color={COLORS.ink}
              strokeWidth={1.6}
            />
          </View>

          <View style={styles.settingsText}>
            <Text style={styles.settingsTitle}>
              Settings
            </Text>

            <Text style={styles.settingsDescription}>
              Laboratory preferences and account settings
            </Text>
          </View>

          <ChevronRight
            size={18}
            color={COLORS.muted}
            strokeWidth={1.5}
          />
        </TouchableOpacity>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>LABSYNC</Text>

          <Text style={styles.footerText}>
            Laboratory Field Register
          </Text>

          <Text style={styles.version}>
            UI PROTOTYPE · v0.1
          </Text>
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
    paddingTop: 16,
    paddingBottom: 45,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eyebrow: {
    color: COLORS.ochre,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  title: {
    color: COLORS.ink,
    fontSize: 30,
    fontWeight: '700',
    marginTop: 3,
  },

  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rule: {
    height: 1,
    backgroundColor: COLORS.ink,
    opacity: 0.15,
    marginVertical: 18,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
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

  menuCard: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 14,
  },

  menuItem: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBox: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: COLORS.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuText: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 10,
  },

  menuTitle: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '700',
  },

  menuDescription: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 3,
  },

  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  managementCard: {
    width: '48%',
    minHeight: 112,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 14,
  },

  managementTitle: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 11,
  },

  managementText: {
    color: COLORS.muted,
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },

  settingsCard: {
    marginTop: 24,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  settingsIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#ECEDEA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsText: {
    flex: 1,
    marginLeft: 12,
  },

  settingsTitle: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '700',
  },

  settingsDescription: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 3,
  },

  footer: {
    alignItems: 'center',
    marginTop: 34,
  },

  footerBrand: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 4,
  },

  version: {
    color: COLORS.muted,
    fontSize: 7,
    letterSpacing: 0.8,
    marginTop: 8,
  },
})