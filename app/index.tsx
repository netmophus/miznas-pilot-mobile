import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Logo from '@/components/Logo';
import FormationsSheet from '@/components/FormationsSheet';

const { width, height } = Dimensions.get('window');

/* ─── Marquee ──────────────────────────────────────────────── */
const TICKER_ITEMS = [
  'Droit bancaire UEMOA',
  'OHADA / Droit des affaires',
  'PCB-UEMOA / Comptabilité bancaire',
  'Dispositif prudentiel de Bâle adapté à l\'UEMOA',
  'Réglementation BCEAO',
  'Circulaires et instructions de la Commission Bancaire',
  'Gouvernance bancaire',
  'Contrôle interne',
  'Audit et commissariat aux comptes bancaire',
  'Gestion des risques bancaires',
  'Risque de crédit',
  'Risque de marché',
  'Risque de liquidité',
  'Risque opérationnel',
  'LBC/FT et conformité',
  'Protection de la clientèle bancaire',
  'Analyse financière des entreprises',
  'Analyse financière bancaire',
  'Comptabilisation des crédits, des titres et des opérations en devises',
  'Gestion actif-passif (ALM)',
  'Normes de fonds propres et solvabilité',
  'Liquidité réglementaire',
  'Reporting prudentiel',
  'États financiers et consolidation',
  'Agrément, passeport unique et réglementation des établissements',
  'Systèmes de paiement UEMOA',
  'Monétique, mobile money et monnaie électronique',
  'Marché monétaire et interbancaire',
  'Relations financières extérieures et changes',
  'Financement du commerce international',
  'Microfinance / SFD',
  'Fiscalité bancaire et notions fiscales de base',
  'Droit des sûretés et recouvrement',
  'Droit commercial et procédures collectives',
  'Technologie bancaire et transformation digitale',
  'Cybersécurité bancaire',
  'Intelligence économique et veille réglementaire',
  'Éthique, déontologie et secret bancaire',
  'Gestion de crise et résolution bancaire',
];

function Ticker() {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cycle = () => {
      // Slide out vers le haut
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
        Animated.timing(translateY, { toValue: -12, duration: 300, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
      ]).start(() => {
        setIndex((prev) => (prev + 1) % TICKER_ITEMS.length);
        translateY.setValue(14);
        // Slide in depuis le bas
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        ]).start();
      });
    };
    const timer = setInterval(cycle, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={tk.banner}>
      {/* Barre top accent */}
      <View style={tk.accentBar} />

      <View style={tk.row}>
        <Animated.Text
          style={[tk.itemText, { opacity, transform: [{ translateY }] }]}
          numberOfLines={1}
        >
          {TICKER_ITEMS[index]}
        </Animated.Text>
      </View>
    </View>
  );
}

const tk = StyleSheet.create({
  banner: {
    width: '100%',
    marginTop: 2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(201,168,76,0.45)',
    backgroundColor: 'rgba(10,20,52,0.8)',
    overflow: 'hidden',
  },
  accentBar: {
    height: 0,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  itemText: {
    color: 'rgba(226,232,240,0.85)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});

const COLORS = {
  bg: '#0A1434',
  surface: '#0F1E48',
  primary: '#1B3A8C',
  accent: '#C9A84C',
  text: '#FFFFFF',
  muted: '#CBD5E1',
};

export default function LandingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const [showFormations, setShowFormations] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background orbs */}
      <View style={[styles.orb, styles.orbTopLeft]} />
      <View style={[styles.orb, styles.orbBottomRight]} />
      <View style={[styles.orb, styles.orbCenter]} />

      {/* Grid overlay */}
      <View style={styles.gridOverlay} />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoGlow} />
            <View style={styles.logoShadow}>
              <Logo size={96} />
            </View>
          </View>

          {/* App name */}
          <Text style={styles.appName}>MIZNAS PILOT</Text>

          {/* Gold separator */}
          <View style={styles.separator} />

          {/* Tagline */}
          <Text style={styles.tagline}>
            L'IA au service de la décision bancaire
          </Text>
          <Ticker />

          <View style={{ height: 20 }} />

          {/* Feature cards */}
          <View style={styles.features}>
            <View style={[styles.featureCard, { borderLeftWidth: 3, borderLeftColor: '#60A5FA' }]}>
              <Text style={[styles.featureTitle, { color: '#60A5FA' }]}>Formations assistées</Text>
              <View style={styles.featureRow}>
                <Text style={styles.featureDesc}>+50 formations banques et finances avec QCM</Text>
                <Pressable
                  onPress={() => setShowFormations(true)}
                  style={({ pressed }) => [styles.voirBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.voirBtnText}>Voir liste</Text>
                </Pressable>
              </View>
            </View>
            <View style={[styles.featureCard, { borderLeftWidth: 3, borderLeftColor: COLORS.accent }]}>
              <Text style={[styles.featureTitle, { color: COLORS.accent }]}>Base de connaissances</Text>
              <Text style={[styles.featureDesc, { flex: 0 }]}>
                Miznas AI répond à vos questions de réglementation bancaire, avec références à l&apos;appui.
              </Text>
            </View>
          </View>

          {showFormations && <FormationsSheet onClose={() => setShowFormations(false)} />}
          </Animated.View>

          {/* Bottom CTA */}
          <Animated.View style={[styles.cta, { opacity: fadeAnim }]}>
            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && styles.btnPressed,
              ]}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.btnPrimaryText}>Se connecter</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.btnOutline,
                pressed && styles.btnOutlinePressed,
              ]}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.btnOutlineText}>Créer un compte</Text>
            </Pressable>

            <Text style={styles.footerText}>
              Miznas Pilot © {new Date().getFullYear()}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.websiteLink, pressed && styles.websiteLinkPressed]}
              onPress={() => Linking.openURL('https://www.miznas.co')}
              hitSlop={8}
            >
              <Ionicons name="globe-outline" size={14} color={COLORS.accent} />
              <Text style={styles.websiteLinkText}>www.miznas.co</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    // Clipe les orbes decoratifs sur web : pas de scrollbar horizontale
    // meme quand on est en dessous du breakpoint MobileFrame (768px).
    ...(Platform.OS === 'web' ? { overflow: 'hidden' as const } : {}),
  },

  /* Background decoration */
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbTopLeft: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.3,
    left: -width * 0.3,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  orbBottomRight: {
    width: width * 0.7,
    height: width * 0.7,
    bottom: -width * 0.2,
    right: -width * 0.2,
    backgroundColor: COLORS.primary,
    opacity: 0.12,
  },
  orbCenter: {
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.35,
    left: width * 0.25,
    backgroundColor: COLORS.accent,
    opacity: 0.04,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.06,
  },

  safe: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: 20,
    gap: 24,
  },

  content: {
    alignItems: 'center',
  },

  /* Logo */
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
    opacity: 0.25,
  },
  logoShadow: {
    shadowColor: '#1B3A8C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderRadius: 22,
  },

  /* Text */
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
    textAlign: 'center',
  },
  separator: {
    width: 56,
    height: 3,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    marginVertical: 16,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },

  /* Badges */
  features: {
    width: '100%',
    gap: 10,
  },
  featureCard: {
    backgroundColor: '#0F1E48',
    borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.5)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureBody: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 5,
  },
  featureDesc: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.75,
    fontWeight: '400',
    flex: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  voirBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(96,165,250,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
    flexShrink: 0,
  },
  voirBtnText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Site web */
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    backgroundColor: 'rgba(201,168,76,0.06)',
    marginTop: 10,
  },
  websiteLinkPressed: {
    backgroundColor: 'rgba(201,168,76,0.14)',
    borderColor: 'rgba(201,168,76,0.45)',
  },
  websiteLinkText: {
    color: COLORS.accent,
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  /* CTA */
  cta: {
    gap: 12,
    alignItems: 'center',
  },
  btnPrimary: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  btnPrimaryText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnOutline: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.text + '40',
    alignItems: 'center',
  },
  btnOutlinePressed: {
    backgroundColor: COLORS.text + '08',
  },
  btnOutlineText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 8,
    opacity: 0.6,
  },
});
