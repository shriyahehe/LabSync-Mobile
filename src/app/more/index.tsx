
import { router } from 'expo-router'
import {
  BarChart3,
  Beaker,
  ChevronRight,
  ClipboardList,
  Clock,
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

import {
  LabSyncColors as C,
  LabSyncShadows,
  LabSyncRadius as R,
  LabSyncSpacing as S,
  LabSyncTypography as T,
} from '@/constants/labsync-theme'

const menu = [
  {
    title: 'Materials',
    description: 'Chemicals, reagents and stock levels',
    icon: FlaskConical,
    route: '/materials',
    color: C.primary,
    background: C.primaryLight,
  },
  {
    title: 'Lab Entry Records',
    description: 'Researcher check-in, check-out and attendance',
    icon: Clock,
    route: '/lab-entry',
    color: C.secondary,
    background: C.secondaryLight,
  },
  {
    title: 'Procurement',
    description: 'Orders, suppliers and incoming materials',
    icon: Package,
    route: '/procurement',
    color: C.accent,
    background: C.accentLight,
  },
  {
    title: 'Equipment',
    description: 'Instruments, usage and maintenance',
    icon: Wrench,
    route: '/equipment',
    color: C.primary,
    background: C.primaryLight,
  },
  {
    title: 'Monthly Reports',
    description: 'Laboratory activity and inventory reports',
    icon: FileSpreadsheet,
    route: '/reports',
    color: C.secondary,
    background: C.secondaryLight,
  },
]

const management = [
  {
    title: 'Team',
    description: 'Researchers and members',
    icon: Users,
    color: C.secondary,
    background: C.secondaryLight,
  },
  {
    title: 'Protocols',
    description: 'Laboratory procedures',
    icon: ShieldCheck,
    color: C.primary,
    background: C.primaryLight,
  },
  {
    title: 'Activity',
    description: 'Recent record changes',
    icon: ClipboardList,
    color: C.accent,
    background: C.accentLight,
  },
  {
    title: 'Analytics',
    description: 'Laboratory overview',
    icon: BarChart3,
    color: C.secondary,
    background: C.secondaryLight,
  },
]

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>LABSYNC WORKSPACE</Text>
            <Text style={styles.title}>More</Text>
            <Text style={styles.subtitle}>
              Everything your laboratory needs
            </Text>
          </View>

          <View style={styles.logoMark}>
            <Beaker size={23} color={C.primary} strokeWidth={1.8} />
          </View>
        </View>

        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <FlaskConical size={20} color={C.primary} />
          </View>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Your laboratory hub</Text>
            <Text style={styles.introDescription}>
              Manage records, resources and laboratory operations from one place.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumber}>
            <Text style={styles.sectionNumberText}>01</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>LABORATORY RECORDS</Text>
            <Text style={styles.sectionSubtitle}>
              Your daily laboratory workspace
            </Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          {menu.map((item, index) => {
            const Icon = item.icon

            return (
              <View key={item.title}>
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.75}
                  onPress={() => router.push(item.route as any)}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: item.background },
                    ]}
                  >
                    <Icon
                      size={20}
                      color={item.color}
                      strokeWidth={1.8}
                    />
                  </View>

                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDescription}>
                      {item.description}
                    </Text>
                  </View>

                  <ChevronRight
                    size={19}
                    color={C.subtle}
                    strokeWidth={1.8}
                  />
                </TouchableOpacity>

                {index < menu.length - 1 && (
                  <View style={styles.menuDivider} />
                )}
              </View>
            )
          })}
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumber}>
            <Text style={styles.sectionNumberText}>02</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>LAB MANAGEMENT</Text>
            <Text style={styles.sectionSubtitle}>
              Tools for your research team
            </Text>
          </View>
        </View>

        <View style={styles.managementGrid}>
          {management.map((item) => {
            const Icon = item.icon

            return (
              <TouchableOpacity
  key={item.title}
  style={styles.managementCard}
  activeOpacity={0.75}
  onPress={() => {
    if (item.title === 'Team') {
      router.push('/researchers')
    }
  }}
>
                <View
                  style={[
                    styles.managementIcon,
                    { backgroundColor: item.background },
                  ]}
                >
                  <Icon size={20} color={item.color} strokeWidth={1.8} />
                </View>

                <Text style={styles.managementTitle}>{item.title}</Text>
                <Text style={styles.managementText}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity
          style={styles.settingsCard}
          activeOpacity={0.75}
        >
          <View style={styles.settingsIcon}>
            <Settings size={20} color={C.ink} strokeWidth={1.8} />
          </View>

          <View style={styles.settingsText}>
            <Text style={styles.settingsTitle}>Settings</Text>
            <Text style={styles.settingsDescription}>
              Laboratory preferences and account settings
            </Text>
          </View>

          <ChevronRight size={19} color={C.subtle} />
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Beaker size={17} color={C.primary} />
            <Text style={styles.footerBrand}>LABSYNC</Text>
          </View>

          <Text style={styles.footerText}>
            Laboratory Field Register
          </Text>

          <Text style={styles.version}>UI PROTOTYPE · v0.1</Text>
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
    paddingHorizontal: S.lg,
    paddingTop: S.md,
    paddingBottom: S.xxxl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S.lg,
  },

  eyebrow: {
    color: C.accent,
    fontSize: T.eyebrow,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  title: {
    color: C.ink,
    fontSize: T.display,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: -0.8,
  },

  subtitle: {
    color: C.muted,
    fontSize: T.body,
    marginTop: 3,
  },

  logoMark: {
    width: 48,
    height: 48,
    borderRadius: R.lg,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryLight,
    borderRadius: R.xl,
    padding: S.md,
    marginBottom: S.xl,
  },

  introIcon: {
    width: 42,
    height: 42,
    borderRadius: R.md,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  introText: {
    flex: 1,
    marginLeft: S.md,
  },

  introTitle: {
    color: C.primaryDark,
    fontSize: T.body,
    fontWeight: '800',
  },

  introDescription: {
    color: C.text,
    fontSize: T.bodySmall,
    lineHeight: 17,
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: S.md,
    marginTop: S.xs,
    gap: S.sm,
  },

  sectionNumber: {
    width: 29,
    height: 29,
    borderRadius: R.sm,
    backgroundColor: C.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionNumberText: {
    color: C.accent,
    fontSize: T.bodySmall,
    fontWeight: '800',
  },

  sectionTitle: {
    color: C.ink,
    fontSize: T.bodySmall,
    fontWeight: '800',
    letterSpacing: 1,
  },

  sectionSubtitle: {
    color: C.muted,
    fontSize: T.caption,
    marginTop: 2,
  },

  menuCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    paddingHorizontal: S.md,
    marginBottom: S.xl,
    ...LabSyncShadows.card,
  },

  menuItem: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBox: {
    width: 43,
    height: 43,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuText: {
    flex: 1,
    marginLeft: S.md,
    paddingRight: S.sm,
  },

  menuTitle: {
    color: C.ink,
    fontSize: T.body,
    fontWeight: '700',
  },

  menuDescription: {
    color: C.muted,
    fontSize: T.bodySmall,
    marginTop: 4,
    lineHeight: 16,
  },

  menuDivider: {
    height: 1,
    backgroundColor: C.divider,
    marginLeft: 55,
  },

  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: S.sm,
    marginBottom: S.lg,
  },

  managementCard: {
    width: '48%',
    minHeight: 132,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.lg,
    padding: S.md,
    ...LabSyncShadows.card,
  },

  managementIcon: {
    width: 38,
    height: 38,
    borderRadius: R.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  managementTitle: {
    color: C.ink,
    fontSize: T.body,
    fontWeight: '700',
    marginTop: S.sm,
  },

  managementText: {
    color: C.muted,
    fontSize: T.bodySmall,
    lineHeight: 16,
    marginTop: 4,
  },

  settingsCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: S.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...LabSyncShadows.card,
  },

  settingsIcon: {
    width: 43,
    height: 43,
    borderRadius: R.md,
    backgroundColor: C.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsText: {
    flex: 1,
    marginLeft: S.md,
    paddingRight: S.sm,
  },

  settingsTitle: {
    color: C.ink,
    fontSize: T.body,
    fontWeight: '700',
  },

  settingsDescription: {
    color: C.muted,
    fontSize: T.bodySmall,
    marginTop: 4,
    lineHeight: 16,
  },

  footer: {
    alignItems: 'center',
    marginTop: S.xxl,
  },

  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
  },

  footerBrand: {
    color: C.primary,
    fontSize: T.body,
    fontWeight: '900',
    letterSpacing: 2.5,
  },

  footerText: {
    color: C.muted,
    fontSize: T.bodySmall,
    marginTop: 5,
  },

  version: {
    color: C.subtle,
    fontSize: T.caption,
    letterSpacing: 0.8,
    marginTop: S.sm,
  },
})
