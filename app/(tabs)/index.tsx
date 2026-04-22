import { useEffect, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStoredUser, User } from '@/lib/auth';
import { usePermissions } from '@/hooks/usePermissions';
import Logo from '@/components/Logo';

const { width } = Dimensions.get('window');

const C = {
  bg:      '#0A1434',
  surface: '#0F1E48',
  primary: '#1B3A8C',
  accent:  '#C9A84C',
  text:    '#FFFFFF',
  muted:   '#CBD5E1',
};

/* ─── Statistiques affichées en bandeau ──────────────────── */
const STATS = [
  { value: '50+',  label: 'Formations' },
  { value: '270+', label: 'Q/R expertes' },
  { value: '250+',   label: 'ONLINE' },
];

/* ─── Modules ─────────────────────────────────────────────── */
interface Module {
  tabId: string;
  title: string;
  lines: string[];
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  accentColor: string;
  bgColor: string;
}

const MODULES: Module[] = [
  {
    tabId: 'formations',
    title: 'Formations assistées',
    lines: [
      'Plus de 50 formations en banque et finance conformes à la réglementation PCB UEMOA, avec QCM intégrés.',
    ],
    icon: 'school-outline',
    route: '/(tabs)/formations',
    accentColor: '#60A5FA',
    bgColor: '#0a1f3d',
  },
  {
    tabId: 'questions',
    title: 'Base de connaissances',
    lines: [
      'Questions en banque et finance réglementaire PCB UEMOA ?',
      'Miznas AI vous répond de façon claire, précise et directement applicable !',
    ],
    icon: 'sparkles-outline',
    route: '/(tabs)/questions',
    accentColor: '#C9A84C',
    bgColor: '#1a1000',
  },
];

/* ─── Screen ──────────────────────────────────────────────── */
export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const { can } = usePermissions();

  useEffect(() => {
    getStoredUser().then(setUser);
  }, []);

  const firstName = user?.full_name?.split(' ')[0] ?? 'Utilisateur';
  const availableModules = MODULES.filter((m) => can(m.tabId));

  return (
    <View style={s.root}>
      {/* Orbes de fond */}
      <View style={s.orb1} />
      <View style={s.orb2} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* ── Header ──────────────────────────────────── */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>Bonjour, {firstName}</Text>
              <Text style={s.tagline}>L'IA au service de la décision bancaire</Text>
            </View>
            <Logo size={44} />
          </View>

          {/* ── Hero card ───────────────────────────────── */}
          <View style={s.heroCard}>
            <View style={s.heroBg} />
            <View style={s.heroContent}>
              <View style={s.heroIconWrap}>
                <Ionicons name="sparkles" size={22} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.heroTitle}>Miznas AI</Text>
                <Text style={s.heroSub}>
                  Expert en réglementation bancaire UEMOA · PCB conforme
                </Text>
              </View>
            </View>
            {/* Badge org */}
            {user?.organization_name && (
              <View style={s.orgBadge}>
                <Ionicons name="business-outline" size={12} color={C.accent} />
                <Text style={s.orgText}>{user.organization_name}</Text>
              </View>
            )}
            {/* Ligne dorée bas */}
            <View style={s.heroLine} />
          </View>

          {/* ── Bandeau stats ───────────────────────────── */}
          <View style={s.statsRow}>
            {STATS.map((stat, i) => (
              <View key={i} style={[s.statItem, i < STATS.length - 1 && s.statBorder]}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Modules ─────────────────────────────────── */}
          {availableModules.length > 0 ? (
            <View style={s.modules}>
              <Text style={s.sectionTitle}>Vos modules</Text>
              {availableModules.map((mod) => (
                <Pressable
                  key={mod.tabId}
                  style={({ pressed }) => [s.card, pressed && s.cardPressed]}
                  onPress={() => router.push(mod.route as any)}
                >
                  {/* Fond */}
                  <View style={[s.cardBg, { backgroundColor: mod.bgColor }]} />

                  {/* En-tête */}
                  <View style={s.cardHead}>
                    <View style={[s.cardIconWrap, { borderColor: mod.accentColor + '40', backgroundColor: mod.accentColor + '15' }]}>
                      <Ionicons name={mod.icon} size={22} color={mod.accentColor} />
                    </View>
                    <View style={[s.cardArrow, { backgroundColor: mod.accentColor + '15' }]}>
                      <Ionicons name="arrow-forward" size={15} color={mod.accentColor} />
                    </View>
                  </View>

                  {/* Titre */}
                  <Text style={[s.cardTitle, { color: mod.accentColor }]}>
                    {mod.title}
                  </Text>

                  {/* Lignes de description */}
                  {mod.lines.map((line, i) => (
                    <Text key={i} style={[
                      s.cardLine,
                      i === 0 && mod.lines.length > 1 && s.cardLineQuestion,
                    ]}>
                      {line}
                    </Text>
                  ))}

                  {/* Barre de couleur en bas */}
                  <View style={[s.cardBar, { backgroundColor: mod.accentColor }]} />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={s.empty}>
              <Ionicons name="lock-closed-outline" size={44} color={C.muted} style={{ opacity: 0.25 }} />
              <Text style={s.emptyTitle}>Aucun module activé</Text>
              <Text style={s.emptyText}>
                Contactez votre administrateur pour activer vos accès.
              </Text>
            </View>
          )}

          {/* ── Pied de page ────────────────────────────── */}
          <View style={s.footer}>
            <View style={s.footerDivider} />
            <Text style={s.footerText}>
              Miznas Pilot · Réglementation PCB-UEMOA · BCEAO
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  orb1: {
    position: 'absolute',
    width: width * 0.9, height: width * 0.9,
    top: -width * 0.35, right: -width * 0.25,
    borderRadius: 9999,
    backgroundColor: C.primary,
    opacity: 0.1,
  },
  orb2: {
    position: 'absolute',
    width: width * 0.6, height: width * 0.6,
    bottom: -width * 0.1, left: -width * 0.15,
    borderRadius: 9999,
    backgroundColor: C.accent,
    opacity: 0.04,
  },

  scroll: { paddingHorizontal: 18, paddingBottom: 36 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 20,
    gap: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    marginBottom: 3,
  },
  tagline: {
    fontSize: 12,
    color: C.muted,
    opacity: 0.65,
  },

  /* Hero card */
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    marginBottom: 14,
    padding: 18,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d1b3e',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    color: C.accent,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroSub: {
    color: C.muted,
    fontSize: 11,
    opacity: 0.7,
    lineHeight: 16,
  },
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  orgText: { color: C.accent, fontSize: 11, fontWeight: '600' },
  heroLine: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 2,
    backgroundColor: C.accent,
    opacity: 0.5,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.5)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  statValue: {
    color: C.accent,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
  },

  /* Modules */
  modules: { gap: 14, marginBottom: 24 },
  sectionTitle: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.55,
    marginBottom: 4,
  },

  card: {
    position: 'relative',
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.4)',
    minHeight: 150,
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 46, height: 46, borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  cardArrow: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  cardLine: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: 4,
  },
  cardLineQuestion: {
    color: '#f1f5f9',
    fontWeight: '600',
    opacity: 0.95,
    marginBottom: 6,
  },
  cardBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    opacity: 0.55,
  },

  /* Empty */
  empty: {
    alignItems: 'center',
    paddingVertical: 56,
    gap: 14,
  },
  emptyTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  emptyText: {
    color: C.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.6,
    paddingHorizontal: 24,
  },

  /* Footer */
  footer: { alignItems: 'center', gap: 10 },
  footerDivider: {
    height: 1,
    width: 40,
    backgroundColor: C.accent,
    opacity: 0.2,
  },
  footerText: {
    color: C.muted,
    fontSize: 11,
    opacity: 0.3,
    textAlign: 'center',
  },
});
