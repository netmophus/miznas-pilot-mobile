import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStoredUser, logout, User } from '@/lib/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { apiClient } from '@/lib/api';
import Logo from '@/components/Logo';

interface QuotaStats {
  questions_asked: number;
  quota_limit: number;
  remaining_quota: number;
  is_quota_exceeded: boolean;
}

const COLORS = {
  bg: '#0A1434',
  surface: '#0F1E48',
  primary: '#1B3A8C',
  accent: '#C9A84C',
  text: '#FFFFFF',
  muted: '#CBD5E1',
  error: '#F87171',
};

const TAB_LABELS: Record<string, string> = {
  formations: 'Formations assistées',
  questions: 'Base de connaissances',
  credit: 'Analyse de crédit',
  pcb: 'États PCB UEMOA & ratios',
  impayes: 'Gestion des impayés',
};

/* Modules toujours affichés dans le profil (ordre fixe) */
const ALL_MODULES = ['formations', 'questions', 'credit', 'pcb', 'impayes'];

/* Seuls ces deux modules sont actifs dans l'app mobile */
const MOBILE_ACTIVE = new Set(['formations', 'questions']);

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  formations: 'school-outline',
  questions: 'library-outline',
  credit: 'card-outline',
  pcb: 'bar-chart-outline',
  impayes: 'warning-outline',
};

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [quota, setQuota] = useState<QuotaStats | null>(null);
  const { allowedTabs } = usePermissions();

  useEffect(() => {
    getStoredUser().then(setUser);
    apiClient.get<QuotaStats>('/questions/quota')
      .then(setQuota)
      .catch(() => setQuota(null));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.dismissAll();
    router.replace('/');
  };

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Profil</Text>
            <Logo size={36} />
          </View>

          {/* Avatar card */}
          <View style={styles.avatarCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.avatarInfo}>
              <Text style={styles.userName}>{user?.full_name ?? '—'}</Text>
              <Text style={styles.userEmail}>{user?.email ?? '—'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role ?? 'user'}</Text>
              </View>
            </View>
          </View>

          {/* Organisation */}
          {user?.organization_name && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Organisation</Text>
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={16} color={COLORS.accent} />
                <Text style={styles.infoText}>{user.organization_name}</Text>
              </View>
            </View>
          )}

          {/* Quota mensuel */}
          {quota !== null && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Quota mensuel — Questions IA</Text>

              {/* Chiffres */}
              <View style={styles.quotaRow}>
                <View style={styles.quotaMain}>
                  <Text style={styles.quotaUsed}>{quota.questions_asked}</Text>
                  <Text style={styles.quotaSlash}> / </Text>
                  <Text style={styles.quotaTotal}>{quota.quota_limit}</Text>
                </View>
                <View style={[
                  styles.quotaBadge,
                  quota.is_quota_exceeded
                    ? styles.quotaBadgeOver
                    : quota.questions_asked >= quota.quota_limit * 0.8
                    ? styles.quotaBadgeWarn
                    : styles.quotaBadgeOk,
                ]}>
                  <Text style={[
                    styles.quotaBadgeText,
                    quota.is_quota_exceeded
                      ? { color: '#F87171' }
                      : quota.questions_asked >= quota.quota_limit * 0.8
                      ? { color: '#FBBF24' }
                      : { color: '#34D399' },
                  ]}>
                    {quota.is_quota_exceeded
                      ? 'Quota atteint'
                      : `${quota.remaining_quota} restante${quota.remaining_quota > 1 ? 's' : ''}`}
                  </Text>
                </View>
              </View>

              {/* Barre de progression */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, quota.quota_limit > 0
                        ? (quota.questions_asked / quota.quota_limit) * 100
                        : 0)}%` as any,
                      backgroundColor: quota.is_quota_exceeded
                        ? '#F87171'
                        : quota.questions_asked >= quota.quota_limit * 0.8
                        ? '#FBBF24'
                        : COLORS.accent,
                    },
                  ]}
                />
              </View>

              <Text style={styles.quotaHint}>
                Le quota se réinitialise au 1er de chaque mois.
              </Text>
            </View>
          )}

          {/* Modules */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Modules disponibles</Text>
            {ALL_MODULES.map((tabId, idx) => {
              const active = MOBILE_ACTIVE.has(tabId);
              return (
                <View
                  key={tabId}
                  style={[
                    styles.moduleRow,
                    idx === ALL_MODULES.length - 1 && { borderBottomWidth: 0 },
                    !active && styles.moduleRowDim,
                  ]}
                >
                  <View style={[
                    styles.moduleIconWrap,
                    !active && styles.moduleIconWrapDim,
                  ]}>
                    <Ionicons
                      name={TAB_ICONS[tabId] ?? 'apps-outline'}
                      size={16}
                      color={active ? COLORS.accent : 'rgba(203,213,225,0.25)'}
                    />
                  </View>
                  <Text style={[styles.moduleLabel, !active && styles.moduleLabelDim]}>
                    {TAB_LABELS[tabId] ?? tabId}
                  </Text>
                  {active ? (
                    <View style={styles.activeDot} />
                  ) : (
                    <Ionicons name="lock-closed-outline" size={13} color="rgba(203,213,225,0.2)" />
                  )}
                </View>
              );
            })}
          </View>

          {/* Déconnexion */}
          <Pressable
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && styles.logoutBtnPressed,
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </Pressable>

          <Text style={styles.footer}>
            Miznas Pilot © {new Date().getFullYear()} · Format PCB-UEMOA
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 24,
  },
  pageTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800' },

  /* Avatar */
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.5)',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  avatarInfo: { flex: 1 },
  userName: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  userEmail: { color: COLORS.muted, fontSize: 13, opacity: 0.8, marginBottom: 8 },
  roleBadge: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  roleText: { color: COLORS.accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  /* Section */
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.4)',
    marginBottom: 14,
  },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    opacity: 0.7,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { color: COLORS.text, fontSize: 14 },

  /* Modules */
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  moduleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleLabel: { flex: 1, color: COLORS.text, fontSize: 14 },
  moduleRowDim: { opacity: 0.4 },
  moduleIconWrapDim: { backgroundColor: 'rgba(255,255,255,0.04)' },
  moduleLabelDim: { color: COLORS.muted },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  noModules: { color: COLORS.muted, fontSize: 13, opacity: 0.6 },

  /* Quota */
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quotaMain: { flexDirection: 'row', alignItems: 'baseline' },
  quotaUsed: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  quotaSlash: { color: COLORS.muted, fontSize: 18, opacity: 0.4, fontWeight: '300' },
  quotaTotal: { color: COLORS.muted, fontSize: 18, fontWeight: '500', opacity: 0.6 },
  quotaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  quotaBadgeOk: {
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderColor: 'rgba(52,211,153,0.25)',
  },
  quotaBadgeWarn: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderColor: 'rgba(251,191,36,0.25)',
  },
  quotaBadgeOver: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderColor: 'rgba(248,113,113,0.25)',
  },
  quotaBadgeText: { fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  quotaHint: {
    color: COLORS.muted,
    fontSize: 11,
    opacity: 0.4,
    marginTop: 2,
  },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(248,113,113,0.35)',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 8,
    marginBottom: 28,
    backgroundColor: 'rgba(248,113,113,0.06)',
  },
  logoutBtnPressed: { opacity: 0.75 },
  logoutText: { color: COLORS.error, fontSize: 15, fontWeight: '700' },

  footer: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.35,
  },
});
