/**
 * FormationsSheet — Panneau plein écran listant toutes les formations.
 * S'ouvre par un slide depuis la gauche (animation native).
 */
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/* ─── Catégories ──────────────────────────────────────────── */
const CATEGORIES = [
  {
    label: 'PCB & Comptabilité Bancaire',
    color: '#3B82F6',
    formations: [
      'Maîtriser le cadre conceptuel du PCB révisé de l\'UMOA',
      'Plan de comptes normalisé — classes 1 à 5 (bilan)',
      'Plan de comptes normalisé — classes 6 à 9 (résultat et hors-bilan)',
      'Comptabilisation des engagements en souffrance',
      'Évaluation et comptabilisation des titres',
      'Comptabilisation des opérations en devises',
      'Comptabilisation des opérations de crédit-bail et location',
      'États financiers annuels — bilan et compte de résultat',
      'Les états financiers consolidés',
      'États périodiques et le reporting BCEAO',
      'Première application du PCB révisé',
      'Comptabilisation des cessions d\'éléments d\'actif',
      'Norme IFRS 9 et son impact sur le PCB révisé',
      'Analyse financière d\'un établissement de crédit',
      'Comptabilité des opérations de trésorerie et interbancaire',
    ],
  },
  {
    label: 'Dispositif Prudentiel UMOA',
    color: '#C9A84C',
    formations: [
      'Architecture du dispositif prudentiel UMOA',
      'Composition et calcul des fonds propres réglementaires',
      'Risque de crédit — approche standard',
      'Risque opérationnel',
      'Risque de marché',
      'Exigences de liquidité — LCR et NSFR',
      'Le FODEP — déclaration prudentielle pratique',
      'Accords de classement BCEAO',
      'Supervision sur base consolidée',
      'Bâle III et modélisation des risques',
      'Simulation de crise — stress tests pour les banques',
      'Pilier 3 — discipline de marché et publication d\'informations',
      'Le ratio de levier',
      'Le coussin de conservation et le coussin contracyclique',
      'Établissements d\'importance systémique dans l\'UMOA',
    ],
  },
  {
    label: 'Réglementation & Gouvernance',
    color: '#8B5CF6',
    formations: [
      'La loi portant réglementation bancaire dans l\'UMOA',
      'Agrément et passeport unique UMOA',
      'Gouvernance des établissements de crédit',
      'Contrôle interne des établissements de crédit',
      'Commissariat aux comptes bancaire',
      'Optimiser la gouvernance et l\'appétence aux risques',
      'Contrôles sur pièces et sur place de la Commission Bancaire',
      'Fonctions d\'administrateurs et dirigeants',
      'Éthique et déontologie bancaire',
      'Management stratégique bancaire',
      'Panorama des risques bancaires',
    ],
  },
  {
    label: 'Gestion des Risques & Conformité',
    color: '#EF4444',
    formations: [
      'Gestion du risque de crédit',
      'Classification et provisionnement des créances',
      'Lutte contre le blanchiment de capitaux — LBC/FT',
      'Division des risques et limites de concentration',
      'Gestion du risque de taux d\'intérêt',
      'Gestion actif-passif — ALM bancaire',
      'Gestion du risque opérationnel',
      'Protection de la clientèle bancaire',
      'Conformité réglementaire bancaire',
      'Risque de fraude bancaire',
      'Gestion des risques des institutions de microfinance',
    ],
  },
  {
    label: 'Opérations Bancaires & Marchés',
    color: '#10B981',
    formations: [
      'Opérations de crédit court, moyen et long terme',
      'Bons et obligations du Trésor UEMOA',
      'Systèmes de paiement de l\'UEMOA',
      'Relations financières extérieures et changes',
      'Opérations de pension livrée dans l\'UEMOA',
      'Financement du commerce international',
      'Monnaie électronique et mobile money',
      'Centralisation des incidents de paiement',
      'Mathématiques financières appliquées à la banque',
      'Analyse financière des entreprises pour le banquier',
    ],
  },
  {
    label: 'Résolution & Supervision',
    color: '#F97316',
    formations: [
      'Régime de résolution des crises bancaires',
      'Administration provisoire et liquidation',
      'Mesures administratives et sanctions disciplinaires',
      'Sanctions pécuniaires de la Commission Bancaire',
      'Surveillance macroprudentielle dans l\'UMOA',
      'Fonds de Garantie des Dépôts et de Résolution',
      'Gestion de crise bancaire — cas pratiques',
      'Coopération internationale en matière de supervision',
    ],
  },
  {
    label: 'Digital, FinTech & Innovation',
    color: '#06B6D4',
    formations: [
      'Introduction à la finance digitale',
      'Transformation digitale des banques',
      'Cybersécurité dans le secteur bancaire',
      'Intelligence artificielle dans la banque',
      'Open Banking et API dans l\'UEMOA',
      'Monnaies digitales de banques centrales — CBDC',
      'Blockchain et applications financières',
      'Data analytics et Big Data pour la banque',
      'Réglementation et supervision des FinTech',
      'Interopérabilité des services financiers dans l\'UEMOA',
    ],
  },
  {
    label: 'Finance Verte & ESG',
    color: '#22C55E',
    formations: [
      'Introduction à la finance verte et durable',
      'Risques climatiques pour les banques',
      'Finance climat dans l\'UEMOA',
      'ESG et investissement responsable',
      'Obligations vertes et financement de projets durables',
    ],
  },
  {
    label: 'Microfinance & SFD',
    color: '#A855F7',
    formations: [
      'Cadre réglementaire des SFD dans l\'UMOA',
      'Gouvernance des institutions de microfinance',
      'Analyse financière des institutions de microfinance',
      'Gestion du crédit en microfinance',
      'Transformation digitale des SFD',
      'Éducation financière et protection du consommateur',
      'Inclusion financière dans l\'UEMOA',
      'Accès des SFD aux systèmes de paiement',
    ],
  },
  {
    label: 'Politique Monétaire & Économie',
    color: '#F59E0B',
    formations: [
      'Politique monétaire de la BCEAO',
      'Marché monétaire et interbancaire de l\'UMOA',
      'Zone franc et intégration monétaire',
      'Intelligence économique et secteur bancaire',
      'Financement des infrastructures en Afrique',
      'Évaluation des politiques publiques',
      'Droit bancaire OHADA et recouvrement des créances',
    ],
  },
];

const TOTAL = CATEGORIES.reduce((s, c) => s + c.formations.length, 0);

/* ─── Composant ───────────────────────────────────────────── */
export default function FormationsSheet({ onClose }: { onClose: () => void }) {
  const slideAnim = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 250,
      useNativeDriver: true,
    }).start(onClose);
  };

  return (
    <Modal transparent animationType="none" onRequestClose={handleClose}>
      {/* Overlay */}
      <Pressable style={s.overlay} onPress={handleClose} />

      {/* Panel */}
      <Animated.View style={[s.panel, { transform: [{ translateX: slideAnim }] }]}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Formations en ligne</Text>
            <Text style={s.headerSub}>{TOTAL} formations · Banque & Finance · UEMOA</Text>
          </View>
          <Pressable onPress={handleClose} style={s.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        {/* Liste */}
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {CATEGORIES.map((cat) => (
            <View
              key={cat.label}
              style={[s.cat, { borderColor: cat.color + '30', backgroundColor: cat.color + '0A' }]}
            >
              {/* Titre catégorie */}
              <View style={[s.catHeader, { backgroundColor: cat.color + '18', borderBottomColor: cat.color + '20' }]}>
                <View style={[s.catDot, { backgroundColor: cat.color }]} />
                <Text style={[s.catLabel, { color: cat.color }]}>{cat.label}</Text>
                <View style={[s.catBadge, { backgroundColor: cat.color + '25' }]}>
                  <Text style={[s.catBadgeText, { color: cat.color }]}>{cat.formations.length}</Text>
                </View>
              </View>

              {/* Formations */}
              {cat.formations.map((f, i) => (
                <View
                  key={i}
                  style={[s.row, i < cat.formations.length - 1 && { borderBottomColor: cat.color + '12', borderBottomWidth: 1 }]}
                >
                  <View style={[s.num, { backgroundColor: cat.color + '18' }]}>
                    <Text style={[s.numText, { color: cat.color }]}>{i + 1}</Text>
                  </View>
                  <Text style={s.rowText}>{f}</Text>
                </View>
              ))}
            </View>
          ))}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Accédez aux formations via votre espace</Text>
          <Pressable onPress={handleClose} style={s.footerBtn}>
            <Text style={s.footerBtnText}>Fermer</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */
const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#070E28',
    borderRightWidth: 1,
    borderRightColor: 'rgba(27,58,140,0.4)',
    flexDirection: 'column',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(27,58,140,0.3)',
    backgroundColor: '#0A1434',
    gap: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: '#C9A84C',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: 12,
    paddingTop: 14,
    gap: 10,
  },

  cat: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  catDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  catLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  catBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  num: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  numText: {
    fontSize: 10,
    fontWeight: '800',
  },
  rowText: {
    flex: 1,
    color: 'rgba(203,213,225,0.8)',
    fontSize: 13,
    lineHeight: 19,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(27,58,140,0.3)',
    backgroundColor: '#0A1434',
    gap: 12,
  },
  footerText: {
    flex: 1,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
  },
  footerBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#C9A84C',
  },
  footerBtnText: {
    color: '#0A1434',
    fontSize: 13,
    fontWeight: '700',
  },
});
