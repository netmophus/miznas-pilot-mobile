import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { apiClient } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { getToken } from '@/lib/token';
import { FormattedText } from '@/components/FormattedText';

const { width, height } = Dimensions.get('window');

const C = {
  bg:      '#0A1434',
  surface: '#0F1E48',
  deep:    '#070E28',
  primary: '#1B3A8C',
  accent:  '#C9A84C',
  text:    '#FFFFFF',
  muted:   '#CBD5E1',
  error:   '#F87171',
  success: '#34D399',
};

/* ─── Thèmes bancaires ────────────────────────────────────── */
const THEMES = [
  {
    id: 'prudentiel',
    label: 'Normes Prudentielles',
    icon: 'business-outline' as const,
    color: '#3B82F6',
    bg: '#0f2744',
    questions: [
      'Quel est le ratio de solvabilité minimum exigé par la BCEAO pour les banques UMOA ?',
      'Comment calcule-t-on le ratio de levier d\'une banque selon les normes BCEAO ?',
      'Quelles sont les exigences en fonds propres de base (Tier 1) pour les banques UMOA ?',
      'Qu\'est-ce que le coussin de conservation de capital imposé par la BCEAO ?',
      'Comment fonctionne le dispositif de surveillance prudentielle de la Commission Bancaire ?',
      'Quel est le ratio de division des risques et quels sont ses seuils d\'alerte ?',
      'Comment est calculé le ratio de liquidité à court terme (LCR) selon la BCEAO ?',
      'Qu\'est-ce que le NSFR (Net Stable Funding Ratio) et comment s\'applique-t-il en UMOA ?',
      'Quelles sanctions s\'appliquent en cas de non-respect des normes prudentielles BCEAO ?',
      'Comment les actifs pondérés par les risques (RWA) sont-ils calculés selon Bâle III UMOA ?',
      'Quel est le capital minimum requis pour créer une banque dans la zone UMOA ?',
      'Quelle est la différence entre les ratios prudentiels Pilier 1 et Pilier 2 en UMOA ?',
      'Comment la BCEAO calcule-t-elle le coussin contracyclique de capital ?',
      'Quels sont les critères de classification des établissements systémiques (D-SIB) en UMOA ?',
      'Comment les risques opérationnels sont-ils pris en compte dans le calcul des fonds propres ?',
      'Quelle est la définition réglementaire des fonds propres selon la BCEAO ?',
      'Comment est déterminé le ratio de couverture des emplois à moyen et long terme ?',
      'Qu\'est-ce que le Pilier 3 de Bâle III et quelles sont les obligations de publication ?',
      'Comment calculer le ratio crédits/dépôts et quelles en sont les implications prudentielles ?',
      'Quelles sont les règles de déduction des fonds propres Tier 1 selon la BCEAO ?',
      'Comment la BCEAO applique-t-elle les exigences de stress test aux banques UMOA ?',
      'Quel est le traitement prudentiel des participations dans les fonds propres réglementaires ?',
      'Comment les instruments hybrides de capital sont-ils traités dans les fonds propres UMOA ?',
      'Quelles sont les obligations de reporting prudentiel trimestriel à la Commission Bancaire ?',
      'Comment calculer le ratio de concentration des risques par contrepartie en UMOA ?',
      'Quelle est la réglementation sur les grands risques dans le dispositif prudentiel BCEAO ?',
      'Comment la BCEAO traite-t-elle le risque de taux d\'intérêt dans le portefeuille bancaire ?',
      'Quelles sont les exigences relatives au coussin pour les établissements systémiques (D-SIB) ?',
      'Comment évaluer l\'adéquation du capital interne (ICAAP) selon la réglementation BCEAO ?',
      'Quelles sont les mesures correctives applicables en cas de dégradation du ratio de solvabilité ?',
    ],
  },
  {
    id: 'lcbft',
    label: 'LBC-FT & Conformité',
    icon: 'shield-checkmark-outline' as const,
    color: '#8B5CF6',
    bg: '#1a0f2e',
    questions: [
      'Quelles sont les obligations de vigilance client (KYC) selon la réglementation UMOA ?',
      'Comment déclarer une opération suspecte à la CENTIF dans la zone UMOA ?',
      'Quels sont les critères de classification des clients à risque élevé en LBC-FT ?',
      'Qu\'est-ce que la vigilance renforcée en LBC-FT et quand s\'applique-t-elle ?',
      'Comment identifier une Personne Politiquement Exposée (PPE) selon la réglementation UMOA ?',
      'Quelles sont les obligations de conservation des documents dans le cadre LBC-FT ?',
      'Comment mettre en place un programme de conformité LBC-FT dans une banque UMOA ?',
      'Quels sont les indicateurs d\'alerte typiques d\'une opération de blanchiment de capitaux ?',
      'Quelle est la procédure de gel des avoirs suspects dans la zone UMOA ?',
      'Quelles sont les sanctions prévues pour non-conformité LBC-FT en UMOA ?',
      'Comment fonctionne le filtrage des listes de sanctions internationales dans une banque ?',
      'Qu\'est-ce que l\'approche basée sur les risques (ABR) en matière de LBC-FT ?',
      'Quelles sont les obligations LBC-FT spécifiques aux virements électroniques transfrontaliers ?',
      'Comment réaliser une évaluation nationale des risques (ENR) dans le dispositif UMOA ?',
      'Quelles sont les exigences de formation du personnel en matière de LBC-FT ?',
      'Comment traiter un client refusé dans le cadre des diligences LBC-FT ?',
      'Qu\'est-ce que la GIABA et quel est son rôle dans la lutte contre le blanchiment en UMOA ?',
      'Quelles sont les obligations LBC-FT des établissements de microfinance en UMOA ?',
      'Comment mettre en place un système de surveillance des transactions suspectes (STR) ?',
      'Quelle est la procédure de levée du secret bancaire dans le cadre d\'une enquête LBC-FT ?',
      'Comment évaluer le risque LBC-FT d\'un nouveau produit bancaire avant son lancement ?',
      'Quels sont les délais légaux pour déclarer une opération suspecte à la CENTIF ?',
      'Comment gérer la vigilance LBC-FT pour les clients non-résidents en UMOA ?',
      'Quelles sont les obligations de due diligence lors d\'une relation de correspondance bancaire ?',
      'Comment identifier et gérer le financement du terrorisme dans une banque UMOA ?',
      'Quelles informations doivent figurer dans un rapport annuel de conformité LBC-FT ?',
      'Comment auditer le dispositif LBC-FT d\'un établissement de crédit en UMOA ?',
      'Quelles sont les obligations LBC-FT lors de l\'ouverture d\'un compte pour une ASBL ?',
      'Comment traiter les transactions en espèces dépassant les seuils réglementaires UMOA ?',
      'Quelle est la responsabilité personnelle du Responsable de la Conformité (RCLBC) en UMOA ?',
    ],
  },
  {
    id: 'credit',
    label: 'Crédit & Risques',
    icon: 'card-outline' as const,
    color: '#10B981',
    bg: '#0a2418',
    questions: [
      'Comment classifier les créances selon les normes prudentielles BCEAO ?',
      'Quels sont les différents types de garanties acceptables pour un crédit bancaire UMOA ?',
      'Comment calculer le taux de provisionnement des créances douteuses litigieuses ?',
      'Comment évaluer la solvabilité d\'une PME pour l\'octroi de crédit en zone UMOA ?',
      'Quelles sont les règles de constitution des provisions pour créances en souffrance ?',
      'Comment fonctionne la centrale des risques de la BCEAO ?',
      'Quels documents composent un dossier de crédit PME complet ?',
      'Comment calculer le ratio endettement/capacité de remboursement d\'un particulier ?',
      'Quelles sont les étapes de la procédure de recouvrement d\'une créance impayée ?',
      'Qu\'est-ce que le crédit documentaire et comment fonctionne-t-il dans l\'UMOA ?',
      'Comment gérer les risques de concentration de portefeuille crédit selon la BCEAO ?',
      'Quelles sont les règles d\'amortissement des créances irrécouvrables ?',
      'Comment évaluer la valeur de réalisation d\'une garantie hypothécaire en UMOA ?',
      'Quelles sont les étapes du scoring crédit pour les particuliers dans une banque UMOA ?',
      'Comment traiter un crédit restructuré selon les normes de la Commission Bancaire ?',
      'Quels sont les ratios de rentabilité à analyser dans une étude de crédit entreprise ?',
      'Comment calculer le coût du risque d\'un portefeuille de crédits en UMOA ?',
      'Quelles sont les obligations de provisionnement pour les créances en phase pré-contentieux ?',
      'Comment fonctionne la procédure d\'appel en garantie OHADA en cas de défaut ?',
      'Quels sont les délais légaux de prescription pour les créances bancaires en UMOA ?',
      'Comment évaluer le risque de liquidité dans une banque de la zone UMOA ?',
      'Quelles sont les conditions d\'éligibilité pour un refinancement auprès de la BCEAO ?',
      'Comment gérer le risque de change dans les crédits en devises en UMOA ?',
      'Qu\'est-ce que le crédit-bail (leasing) et quelle est sa réglementation en UMOA ?',
      'Comment calculer le taux effectif global (TEG) d\'un crédit selon la réglementation UMOA ?',
      'Quelles sont les obligations de déclaration des dépassements à la centrale des risques BCEAO ?',
      'Comment construire une matrice de migration des créances dans un portefeuille UMOA ?',
      'Quelles sont les règles de dépréciation des créances selon les normes IFRS 9 en UMOA ?',
      'Comment gérer les crédits syndiqués dans une banque chef de file en UMOA ?',
      'Quelles sont les obligations de suivi post-octroi d\'un crédit selon la Commission Bancaire ?',
    ],
  },
  {
    id: 'pcb',
    label: 'PCB Comptable',
    icon: 'bar-chart-outline' as const,
    color: '#C9A84C',
    bg: '#1e1608',
    questions: [
      'Quelles sont les classes du Plan Comptable Bancaire (PCB) révisé de l\'UMOA ?',
      'Comment comptabiliser un prêt en souffrance selon le PCB UMOA ?',
      'Quelle est la différence entre le PCB et les normes IFRS pour une banque UMOA ?',
      'Comment établir un bilan bancaire selon le PCB UMOA ?',
      'Quels sont les postes du compte de résultat d\'une banque selon le PCB ?',
      'Comment comptabiliser les opérations de hors-bilan selon le PCB UMOA ?',
      'Quelles sont les règles de comptabilisation des titres de placement selon le PCB ?',
      'Comment calculer le Produit Net Bancaire (PNB) d\'un établissement de crédit ?',
      'Quels sont les états financiers obligatoires à soumettre à la Commission Bancaire ?',
      'Comment comptabiliser une opération en devises étrangères selon le PCB UMOA ?',
      'Comment traiter comptablement les provisions pour risques et charges ?',
      'Quelles sont les règles de consolidation des comptes bancaires en UMOA ?',
      'Comment comptabiliser les intérêts courus non échus selon le PCB UMOA ?',
      'Quelle est la méthode de comptabilisation des opérations interbancaires selon le PCB ?',
      'Comment établir l\'annexe aux états financiers d\'une banque UMOA ?',
      'Quelles sont les règles de comptabilisation des opérations avec la BCEAO ?',
      'Comment comptabiliser les instruments financiers dérivés selon le PCB UMOA ?',
      'Quelles sont les modalités de clôture des comptes annuels d\'une banque UMOA ?',
      'Comment calculer et comptabiliser la réserve obligatoire de la BCEAO ?',
      'Quelles sont les règles PCB pour la comptabilisation des opérations de crédit-bail ?',
      'Comment comptabiliser les opérations sur titres d\'investissement selon le PCB ?',
      'Quelle est la méthode de comptabilisation des engagements de retraite selon le PCB ?',
      'Comment traiter les écarts de conversion des devises dans les comptes bancaires UMOA ?',
      'Quelles sont les règles d\'amortissement des immobilisations dans une banque UMOA ?',
      'Comment comptabiliser une opération de titrisation selon le PCB UMOA ?',
      'Quelles sont les obligations de certification des comptes par le commissaire aux comptes ?',
      'Comment établir le tableau des flux de trésorerie d\'une banque selon le PCB ?',
      'Quelles sont les différences de traitement comptable entre créances saines et douteuses ?',
      'Comment comptabiliser les opérations de pension livrée dans le PCB UMOA ?',
      'Quelles sont les règles de présentation des états financiers comparatifs en UMOA ?',
    ],
  },
  {
    id: 'gouvernance',
    label: 'Gouvernance Bancaire',
    icon: 'people-outline' as const,
    color: '#EF4444',
    bg: '#1f0a0a',
    questions: [
      'Quelles sont les exigences de gouvernance interne pour les banques UMOA ?',
      'Comment doit être composé le Conseil d\'Administration d\'une banque en UMOA ?',
      'Quelles sont les fonctions de contrôle obligatoires dans une banque (audit, conformité, risques) ?',
      'Quels sont les critères d\'honorabilité et de compétence pour les dirigeants de banque ?',
      'Comment fonctionne le processus d\'agrément pour un nouveau dirigeant bancaire UMOA ?',
      'Quelles informations doivent être déclarées périodiquement à la Commission Bancaire ?',
      'Quel est le rôle du comité des risques dans la gouvernance d\'une banque UMOA ?',
      'Comment la Commission Bancaire conduit-elle ses missions de contrôle sur place ?',
      'Quelles sont les obligations de transparence et de publication pour les banques UMOA ?',
      'Quel est le rôle du commissaire aux comptes dans la supervision bancaire UMOA ?',
      'Comment gérer un conflit d\'intérêts au sein d\'un conseil d\'administration bancaire ?',
      'Quelles sont les exigences en matière de rémunération des dirigeants de banque ?',
      'Comment mettre en place un comité d\'audit efficace dans une banque UMOA ?',
      'Quelles sont les obligations de formation continue pour les administrateurs de banque ?',
      'Comment la Commission Bancaire notifie-t-elle ses décisions disciplinaires aux banques ?',
      'Quelles sont les incompatibilités légales dans l\'exercice des fonctions de direction bancaire ?',
      'Comment fonctionne la procédure de mise sous administration provisoire d\'une banque ?',
      'Quelles sont les obligations de reporting interne au conseil d\'administration ?',
      'Comment documenter et archiver les décisions du conseil d\'administration d\'une banque ?',
      'Quelles sont les règles relatives aux transactions avec les parties liées en UMOA ?',
      'Comment évaluer l\'efficacité du dispositif de contrôle interne d\'une banque UMOA ?',
      'Quelles sont les obligations relatives à la politique de rémunération variable des dirigeants ?',
      'Comment mettre en place une fonction de gestion des risques indépendante en banque UMOA ?',
      'Quelles sont les responsabilités du Directeur Général face à la Commission Bancaire ?',
      'Comment traiter les recommandations d\'un contrôle sur place de la Commission Bancaire ?',
      'Quelles sont les obligations de gouvernance spécifiques aux filiales de groupes bancaires étrangers ?',
      'Comment composer et faire fonctionner un comité de crédit dans une banque UMOA ?',
      'Quelles sont les dispositions relatives à la succession des dirigeants d\'une banque UMOA ?',
      'Comment mettre en œuvre un plan de redressement (recovery plan) selon la BCEAO ?',
      'Quelles sont les obligations de gouvernance des établissements de microfinance en UMOA ?',
    ],
  },
  {
    id: 'paiement',
    label: 'Systèmes de Paiement',
    icon: 'phone-portrait-outline' as const,
    color: '#0EA5E9',
    bg: '#071829',
    questions: [
      'Quelles sont les règles encadrant la monnaie électronique en UMOA ?',
      'Comment obtenir un agrément d\'établissement de monnaie électronique en UMOA ?',
      'Quelles sont les obligations de supervision des systèmes de paiement par la BCEAO ?',
      'Comment fonctionnent les chambres de compensation interbancaire en UMOA ?',
      'Quelles sont les règles de protection des fonds de la clientèle pour les EME ?',
      'Comment traiter une réclamation liée à un virement bancaire en UMOA ?',
      'Quels sont les plafonds de transactions autorisés pour le mobile money en UMOA ?',
      'Qu\'est-ce que le STAR-UEMOA et comment fonctionne-t-il ?',
      'Quelles sont les exigences de sécurité informatique pour les systèmes de paiement ?',
      'Comment lutter contre la fraude dans les transactions électroniques en UMOA ?',
      'Quelles sont les obligations de reporting des incidents de paiement à la BCEAO ?',
      'Comment fonctionne l\'interopérabilité des systèmes de paiement en UMOA ?',
      'Quelles sont les exigences de fonds propres pour un établissement de paiement en UMOA ?',
      'Comment fonctionne le système SICA-UEMOA de compensation des chèques ?',
      'Quelles sont les règles d\'émission et de gestion des cartes bancaires en UMOA ?',
      'Comment la BCEAO encadre-t-elle les Fintechs dans l\'espace UMOA ?',
      'Quelles sont les obligations KYC pour les opérateurs de mobile money en UMOA ?',
      'Comment traiter un chèque impayé selon la réglementation UMOA ?',
      'Quelles sont les règles applicables aux virements SWIFT dans la zone UMOA ?',
      'Comment gérer les incidents techniques dans un système de paiement critique UMOA ?',
      'Quelles sont les obligations de continuité d\'activité pour les systèmes de paiement ?',
      'Comment la BCEAO assure-t-elle la surveillance macro-prudentielle des paiements ?',
      'Quelles sont les règles relatives aux paiements transfrontaliers en UMOA ?',
      'Comment obtenir le statut d\'établissement de paiement (EP) en UMOA ?',
      'Quelles sont les obligations de déclaration des transactions suspectes pour les EME ?',
      'Comment gérer les fonds de remboursement garantis pour les établissements de monnaie électronique ?',
      'Quelles sont les règles d\'utilisation du chèque de banque en UMOA ?',
      'Comment fonctionne la garantie des dépôts pour les fonds clients d\'un EME en UMOA ?',
      'Quelles sont les conditions d\'accès au système STAR-UEMOA pour une banque étrangère ?',
      'Comment la régulation des paiements numériques évolue-t-elle dans l\'espace UMOA ?',
    ],
  },
  {
    id: 'clientele',
    label: 'Protection Clientèle',
    icon: 'people-circle-outline' as const,
    color: '#F59E0B',
    bg: '#1a1200',
    questions: [
      'Quels sont les droits fondamentaux du client bancaire dans la zone UMOA ?',
      'Comment traiter une réclamation client selon la réglementation BCEAO ?',
      'Quelles informations précontractuelles une banque doit-elle fournir à un client en UMOA ?',
      'Comment fonctionne la médiation bancaire en UMOA ?',
      'Quelles sont les règles encadrant les conditions de banque et la tarification ?',
      'Quels sont les délais légaux de traitement des réclamations client en UMOA ?',
      'Comment gérer un compte bancaire inactif ou dormant selon la réglementation UMOA ?',
      'Quelles sont les obligations d\'information périodique envers les clients bancaires ?',
      'Comment protéger les données personnelles des clients bancaires en UMOA ?',
      'Quelles sont les conditions générales de vente (CGV) obligatoires en banque UMOA ?',
      'Comment la BCEAO contrôle-t-elle les pratiques commerciales des banques ?',
      'Quels sont les recours disponibles pour un client victime d\'une pratique abusive ?',
      'Quelles sont les obligations de conseil lors de la souscription d\'un produit d\'épargne en UMOA ?',
      'Comment mettre en place un service client conforme aux exigences BCEAO ?',
      'Quelles sont les règles de calcul et d\'affichage des taux d\'intérêt débiteurs en UMOA ?',
      'Comment gérer la clôture d\'un compte bancaire à la demande du client en UMOA ?',
      'Quelles sont les règles relatives au droit au compte en UMOA ?',
      'Comment informer les clients des modifications des conditions tarifaires en UMOA ?',
      'Quelles sont les règles de confidentialité et de secret bancaire en UMOA ?',
      'Comment traiter les successions et comptes d\'une personne décédée en UMOA ?',
      'Quelles sont les obligations de transparence sur les produits de placement en UMOA ?',
      'Comment gérer les litiges relatifs aux cartes bancaires et paiements électroniques ?',
      'Quelles sont les règles encadrant la vente liée de produits bancaires en UMOA ?',
      'Comment informer les clients sur les risques liés aux crédits à la consommation ?',
      'Quelles sont les règles relatives au démarchage bancaire et à la prospection commerciale ?',
      'Comment la BCEAO sanctionne-t-elle les pratiques commerciales déloyales en UMOA ?',
      'Quelles sont les obligations d\'accessibilité bancaire pour les populations rurales en UMOA ?',
      'Comment gérer les clients fragiles ou en situation de surendettement en UMOA ?',
      'Quelles sont les règles de nomination et de fonctionnement d\'un médiateur bancaire en UMOA ?',
      'Comment mettre en œuvre un dispositif de protection des données clients dans une banque UMOA ?',
    ],
  },
  {
    id: 'islamique',
    label: 'Finance Islamique',
    icon: 'star-outline' as const,
    color: '#34D399',
    bg: '#071a12',
    questions: [
      'Quels sont les produits financiers islamiques autorisés en UMOA ?',
      'Comment fonctionne le financement Mourabaha dans une banque islamique UMOA ?',
      'Qu\'est-ce que l\'Ijara et comment s\'applique-t-il au crédit-bail islamique ?',
      'Comment la BCEAO encadre-t-elle la finance islamique dans l\'espace UMOA ?',
      'Quelles sont les exigences du Comité Charia dans la gouvernance d\'une banque islamique ?',
      'Comment fonctionne le compte de partage des profits et pertes (Moudaraba) ?',
      'Quels sont les défis de comptabilisation des produits islamiques selon le PCB ?',
      'Qu\'est-ce que le Sukuk et comment est-il émis dans la zone UMOA ?',
      'Comment gérer la liquidité dans une banque islamique conforme à la Charia ?',
      'Quelles sont les perspectives de développement de la finance islamique en UMOA ?',
      'Quelle est la différence entre une banque islamique et une fenêtre islamique ?',
      'Comment fonctionne le produit Musharaka dans le financement d\'entreprises ?',
      'Quelles sont les obligations de conformité Charia pour les produits bancaires islamiques ?',
      'Comment calculer le taux de partage des bénéfices dans un compte d\'investissement islamique ?',
      'Qu\'est-ce que le Takaful et comment s\'articule-t-il avec l\'assurance conventionnelle en UMOA ?',
      'Comment traiter le risque de taux d\'intérêt dans une banque islamique sans recourir au Riba ?',
      'Quels sont les principes du contrat Istisna\'a dans le financement de projets immobiliers ?',
      'Comment la finance islamique gère-t-elle les opérations de change (Al-Sarf) ?',
      'Quelles sont les conditions de validité d\'un contrat Salam en financement agricole UMOA ?',
      'Comment évaluer la conformité Charia d\'un nouveau produit financier islamique ?',
      'Quels sont les défis de la supervision des banques islamiques par la Commission Bancaire UMOA ?',
      'Comment fonctionne le marché interbancaire islamique dans la zone UMOA ?',
      'Quelles sont les règles de gouvernance spécifiques aux institutions financières islamiques ?',
      'Comment les banques islamiques gèrent-elles le risque de crédit sans intérêt conventionnel ?',
      'Qu\'est-ce que le Waqf bancaire et quel est son rôle dans la finance sociale islamique ?',
      'Comment structurer une émission de Sukuk souverain dans un pays de la zone UMOA ?',
      'Quelles sont les différences entre les normes AAOIFI et les standards BCEAO pour la finance islamique ?',
      'Comment une banque conventionnelle peut-elle ouvrir une fenêtre islamique en UMOA ?',
      'Quels sont les critères de qualification d\'un actif conforme à la Charia en UMOA ?',
      'Comment la Zakat est-elle prise en compte dans la gestion des fonds d\'une banque islamique ?',
    ],
  },
  {
    id: 'agrement',
    label: 'Agrément & Licences',
    icon: 'ribbon-outline' as const,
    color: '#A78BFA',
    bg: '#130d24',
    questions: [
      'Quelles sont les conditions pour obtenir un agrément bancaire en UMOA ?',
      'Quels documents constituer pour un dossier d\'agrément auprès de la Commission Bancaire ?',
      'Comment se déroule la procédure d\'instruction d\'une demande d\'agrément bancaire ?',
      'Quelles sont les conditions d\'agrément pour un établissement de microfinance (SFD) ?',
      'Comment créer une filiale bancaire dans un pays de l\'UMOA différent du siège ?',
      'Quelles sont les conditions de retrait d\'agrément d\'un établissement de crédit ?',
      'Quels sont les délais légaux d\'instruction d\'une demande d\'agrément en UMOA ?',
      'Quelles sont les obligations déclaratives lors d\'un changement d\'actionnaire significatif ?',
      'Comment notifier la Commission Bancaire d\'une opération de fusion-acquisition bancaire ?',
      'Quels sont les critères d\'évaluation des actionnaires de référence d\'une banque UMOA ?',
      'Quelles sont les différentes catégories d\'établissements de crédit agréés en UMOA ?',
      'Comment renouveler ou modifier un agrément bancaire existant en UMOA ?',
      'Quelles sont les conditions d\'agrément pour un bureau de représentation d\'une banque étrangère ?',
      'Comment obtenir un agrément pour une société de gestion d\'actifs en UMOA ?',
      'Quelles sont les exigences d\'agrément pour les Fintechs réglementées par la BCEAO ?',
      'Comment la Commission Bancaire évalue-t-elle le plan d\'affaires d\'un projet bancaire ?',
      'Quels sont les critères de réputation exigés des fondateurs d\'une banque en UMOA ?',
      'Comment gérer un dossier d\'agrément refusé et quels sont les recours possibles ?',
      'Quelles sont les conditions spécifiques d\'agrément pour une banque de développement en UMOA ?',
      'Comment obtenir l\'autorisation d\'ouverture d\'une nouvelle agence bancaire en UMOA ?',
      'Quelles sont les obligations de capital minimum maintenu après l\'obtention de l\'agrément ?',
      'Comment la BCEAO traite-t-elle les demandes d\'agrément des groupes bancaires panafricains ?',
      'Quels sont les critères d\'agrément pour les établissements de crédit-bail en UMOA ?',
      'Comment obtenir un agrément pour les activités de conseil en investissement en UMOA ?',
      'Quelles sont les obligations de notification lors d\'une augmentation de capital d\'une banque UMOA ?',
      'Comment la Commission Bancaire traite-t-elle les demandes d\'extension d\'activités bancaires ?',
      'Quels sont les critères d\'agrément pour les sociétés de transfert d\'argent en UMOA ?',
      'Comment notifier un changement de dirigeant à la Commission Bancaire UMOA ?',
      'Quelles sont les conditions d\'agrément pour un établissement financier à caractère bancaire ?',
      'Comment se déroule la liquidation ordonnée d\'une banque après retrait d\'agrément en UMOA ?',
    ],
  },
  {
    id: 'marches',
    label: 'Marchés Financiers',
    icon: 'trending-up-outline' as const,
    color: '#F59E0B',
    bg: '#1a1000',
    questions: [
      'Comment fonctionne la Bourse Régionale des Valeurs Mobilières (BRVM) dans l\'UMOA ?',
      'Quelles sont les conditions d\'admission à la cote de la BRVM pour une entreprise ?',
      'Quel est le rôle du Conseil Régional de l\'Épargne Publique et des Marchés Financiers (CREPMF) ?',
      'Comment émettre des obligations sur le marché financier de l\'UMOA ?',
      'Quelles sont les obligations de transparence pour les sociétés cotées à la BRVM ?',
      'Comment fonctionne le marché des titres publics dans la zone UMOA ?',
      'Qu\'est-ce qu\'un Organisme de Placement Collectif en Valeurs Mobilières (OPCVM) en UMOA ?',
      'Quelles sont les règles de gestion d\'un fonds commun de placement (FCP) en UMOA ?',
      'Comment obtenir l\'agrément pour exercer comme société de gestion et d\'intermédiation (SGI) ?',
      'Quelles sont les obligations de reporting des émetteurs cotés à la BRVM ?',
      'Comment fonctionne le marché secondaire des titres publics dans la zone UMOA ?',
      'Quelles sont les règles relatives aux offres publiques d\'achat (OPA) à la BRVM ?',
      'Comment traiter les délits d\'initiés selon la réglementation du CREPMF ?',
      'Quelles sont les exigences de fonds propres pour une société de bourse en UMOA ?',
      'Comment calculer la valeur liquidative d\'un OPCVM dans la zone UMOA ?',
      'Quelles sont les règles de notation des émissions obligataires en UMOA ?',
      'Comment fonctionne la chambre de compensation des titres à la BRVM ?',
      'Quelles sont les sanctions pour manipulation de cours à la BRVM ?',
      'Comment obtenir l\'agrément de conseiller en investissements financiers en UMOA ?',
      'Quelles sont les règles de conservation des titres par les dépositaires en UMOA ?',
      'Comment gérer un portefeuille titres dans le respect des contraintes réglementaires UMOA ?',
      'Quelles sont les obligations de publicité financière pour une introduction en bourse à la BRVM ?',
      'Comment fonctionne le marché monétaire régional de la BCEAO ?',
      'Quelles sont les règles d\'investissement pour les compagnies d\'assurance en UMOA ?',
      'Comment évaluer le risque de marché dans le portefeuille de négociation d\'une banque UMOA ?',
      'Quelles sont les règles relatives aux émissions de titres hybrides sur le marché UMOA ?',
      'Comment structurer une émission obligataire avec garantie partielle en UMOA ?',
      'Quelles sont les obligations déclaratives des transactions sur titres à la BRVM ?',
      'Comment calculer la duration et la sensibilité d\'un portefeuille obligataire en UMOA ?',
      'Quelles sont les perspectives de développement du marché des capitaux dans la zone UMOA ?',
    ],
  },
  {
    id: 'microfinance',
    label: 'Microfinance & SFD',
    icon: 'people-outline' as const,
    color: '#06B6D4',
    bg: '#071520',
    questions: [
      'Quelles sont les différentes catégories de SFD reconnues par la réglementation UMOA ?',
      'Comment obtenir un agrément pour créer un Système Financier Décentralisé (SFD) en UMOA ?',
      'Quelles sont les exigences de fonds propres minimum pour les SFD de catégorie 1 en UMOA ?',
      'Comment calculer le taux de rendement du portefeuille de crédit d\'un SFD en UMOA ?',
      'Quelles sont les obligations prudentielles spécifiques aux SFD selon la réglementation BCEAO ?',
      'Comment évaluer la qualité du portefeuille de crédit d\'une institution de microfinance ?',
      'Quels sont les indicateurs de performance financière clés (KPI) d\'un SFD en UMOA ?',
      'Comment mettre en place un système de gestion des risques adapté à la microfinance ?',
      'Quelles sont les obligations LBC-FT spécifiques aux SFD dans la zone UMOA ?',
      'Comment financer la croissance d\'un SFD sans compromettre ses ratios prudentiels ?',
      'Quelles sont les règles d\'octroi de crédit d\'un SFD à ses membres et tiers ?',
      'Comment structurer les produits d\'épargne d\'un SFD conformément à la réglementation UMOA ?',
      'Quelles sont les obligations de reporting financier des SFD à la Commission Bancaire ?',
      'Comment calculer le taux d\'intérêt effectif appliqué par un SFD en UMOA ?',
      'Quelles sont les conditions de transformation d\'une coopérative d\'épargne en banque de microfinance ?',
      'Comment gérer les provisions pour créances en souffrance dans un SFD UMOA ?',
      'Quelles sont les règles de gouvernance des mutuelles d\'épargne et de crédit en UMOA ?',
      'Comment mettre en œuvre un audit externe pour un SFD selon les normes UMOA ?',
      'Quelles sont les obligations de protection des membres-clients dans les SFD en UMOA ?',
      'Comment gérer la liquidité d\'un SFD face aux fluctuations saisonnières des dépôts ?',
      'Quelles sont les règles de fusion et d\'absorption entre SFD dans la zone UMOA ?',
      'Comment développer des produits de microassurance conformes à la réglementation UMOA ?',
      'Quelles sont les obligations de formation des agents de crédit dans les SFD ?',
      'Comment mesurer et gérer le risque de surendettement des clients d\'un SFD ?',
      'Quelles sont les exigences de capitalisation des SFD de catégorie 3 en UMOA ?',
      'Comment structurer un programme de refinancement d\'un SFD auprès des banques commerciales ?',
      'Quelles sont les sanctions applicables aux dirigeants de SFD en infraction en UMOA ?',
      'Comment digitaliser les services d\'un SFD dans le respect des exigences réglementaires BCEAO ?',
      'Quelles sont les règles relatives aux opérations transfrontalières des SFD en UMOA ?',
      'Comment évaluer la performance sociale d\'un SFD au-delà des seuls indicateurs financiers ?',
    ],
  },
  {
    id: 'ohada',
    label: 'Droit OHADA & Sûretés',
    icon: 'scale-outline' as const,
    color: '#6366F1',
    bg: '#0f0f24',
    questions: [
      'Quels sont les actes uniformes OHADA applicables aux établissements bancaires en UMOA ?',
      'Comment fonctionne la sûreté réelle mobilière selon l\'Acte Uniforme OHADA révisé ?',
      'Quelles sont les règles de réalisation d\'une hypothèque bancaire sous le droit OHADA ?',
      'Comment mettre en place un nantissement de fonds de commerce selon l\'OHADA ?',
      'Quelles sont les procédures collectives applicables à une entreprise débitrice en UMOA ?',
      'Comment une banque peut-elle recouvrer sa créance dans le cadre d\'un redressement judiciaire OHADA ?',
      'Qu\'est-ce que la cession de créances professionnelles (bordereau Dailly) sous le droit OHADA ?',
      'Comment constituer un cautionnement bancaire valide selon le droit OHADA ?',
      'Quelles sont les règles de priorité entre créanciers dans une liquidation judiciaire OHADA ?',
      'Comment fonctionne le nantissement de comptes bancaires selon le droit OHADA ?',
      'Quelles sont les conditions de validité d\'une garantie autonome à première demande en OHADA ?',
      'Comment traiter la faillite personnelle d\'un dirigeant d\'entreprise sous le droit OHADA ?',
      'Quelles sont les règles de l\'Acte Uniforme sur les sociétés commerciales applicables aux banques ?',
      'Comment une banque doit-elle gérer les créances sur une entreprise en difficulté sous OHADA ?',
      'Quels sont les délais de prescription des actions en recouvrement selon le droit OHADA ?',
      'Comment procéder à une saisie-attribution de créances bancaires sous le droit OHADA ?',
      'Quelles sont les règles relatives aux sûretés sur stocks dans le financement bancaire OHADA ?',
      'Comment fonctionne la réserve de propriété dans un contrat de financement sous OHADA ?',
      'Quelles sont les obligations d\'un banquier vis-à-vis du liquidateur judiciaire OHADA ?',
      'Comment traiter les contrats en cours lors d\'une procédure de redressement judiciaire OHADA ?',
      'Quelles sont les conditions d\'opposabilité des sûretés mobilières dans les pays OHADA ?',
      'Comment un banquier doit-il gérer un compte courant en présence d\'une procédure collective ?',
      'Quelles sont les règles relatives au gage sans dépossession sous le droit OHADA ?',
      'Comment fonctionne la purge d\'hypothèque lors de la réalisation d\'un bien immobilier en OHADA ?',
      'Quelles sont les règles d\'inopposabilité de la période suspecte dans les procédures collectives OHADA ?',
      'Comment mettre en œuvre une procédure simplifiée de recouvrement de créances en OHADA ?',
      'Quelles sont les obligations de déclaration de créance dans une procédure collective OHADA ?',
      'Comment traiter les sûretés constituées avant l\'ouverture d\'une procédure collective OHADA ?',
      'Quelles sont les règles d\'arbitrage applicables aux litiges bancaires sous le droit OHADA ?',
      'Comment une banque doit-elle gérer un conflit entre son droit de rétention et la procédure collective ?',
    ],
  },
  {
    id: 'change',
    label: 'Change & International',
    icon: 'globe-outline' as const,
    color: '#14B8A6',
    bg: '#071614',
    questions: [
      'Quelles sont les règles de change applicables dans la zone UMOA ?',
      'Comment fonctionne le régime de parité fixe du Franc CFA avec l\'Euro en UMOA ?',
      'Quelles sont les obligations de rapatriement des recettes d\'exportation en UMOA ?',
      'Comment obtenir une autorisation de change auprès de la BCEAO pour un investissement étranger ?',
      'Quelles sont les règles applicables aux investissements directs étrangers (IDE) en UMOA ?',
      'Comment fonctionne le compte étranger en Francs (CEF) pour les non-résidents ?',
      'Quelles sont les obligations déclaratives pour les transferts de fonds vers l\'extérieur en UMOA ?',
      'Comment gérer le risque de change dans une banque opérant en zone UMOA ?',
      'Quelles sont les règles relatives aux opérations de commerce extérieur (import/export) en UMOA ?',
      'Comment fonctionne le crédit documentaire dans les opérations d\'import-export en UMOA ?',
      'Quelles sont les obligations de contrôle de change pour les banques intermédiaires agréées ?',
      'Comment traiter les avoirs en devises détenus à l\'étranger par les résidents UMOA ?',
      'Quelles sont les règles applicables aux emprunts extérieurs des entreprises résidentes en UMOA ?',
      'Comment fonctionne le système de paiement multilatéral entre pays UMOA ?',
      'Quelles sont les obligations des banques correspondantes en matière de change en UMOA ?',
      'Comment traiter les opérations de swap de change dans une banque UMOA ?',
      'Quelles sont les règles d\'établissement des positions de change en devises pour les banques UMOA ?',
      'Comment gérer une exposition en devises dans le respect des limites réglementaires BCEAO ?',
      'Quelles sont les conditions d\'ouverture d\'un compte en devises pour une entreprise en UMOA ?',
      'Comment fonctionne la convertibilité du Franc CFA pour les transactions courantes en UMOA ?',
      'Quelles sont les règles applicables aux transferts de bénéfices par les filiales étrangères en UMOA ?',
      'Comment une banque UMOA doit-elle gérer une opération de financement en USD ou EUR ?',
      'Quelles sont les exigences de couverture de change pour les emprunts extérieurs en UMOA ?',
      'Comment calculer et déclarer la position de change nette d\'une banque à la BCEAO ?',
      'Quelles sont les règles applicables aux garanties bancaires internationales (SBLC) en UMOA ?',
      'Comment gérer les lettres de crédit (LC) dans le financement du commerce international en UMOA ?',
      'Quelles sont les obligations de déclaration des avoirs extérieurs à la BCEAO ?',
      'Comment traiter les opérations de couverture de change par les entreprises résidentes en UMOA ?',
      'Quelles sont les règles d\'intervention de la BCEAO sur le marché des changes ?',
      'Comment une banque UMOA doit-elle gérer les risques liés à la variation du cours de l\'Euro ?',
    ],
  },
  {
    id: 'alm',
    label: 'Gestion Actif-Passif',
    icon: 'stats-chart-outline' as const,
    color: '#EC4899',
    bg: '#1a0715',
    questions: [
      'Qu\'est-ce que la gestion actif-passif (ALM) et pourquoi est-elle essentielle pour une banque UMOA ?',
      'Comment mesurer le risque de taux d\'intérêt dans le portefeuille bancaire selon les normes BCEAO ?',
      'Qu\'est-ce que la Value at Risk (VaR) et comment est-elle utilisée dans la gestion ALM ?',
      'Comment calculer l\'impasse de liquidité (gap de liquidité) d\'une banque en UMOA ?',
      'Quelles sont les méthodes de calcul de la marge nette d\'intérêt et son suivi en ALM ?',
      'Comment mettre en place un comité ALM dans une banque UMOA ?',
      'Quels sont les principaux risques gérés dans le cadre de l\'ALM bancaire en UMOA ?',
      'Comment fonctionne le système de prix de cession interne (transfer pricing) en ALM ?',
      'Quelles sont les obligations réglementaires BCEAO en matière de gestion de la liquidité ?',
      'Comment construire une courbe des taux pour la zone UMOA à des fins de gestion ALM ?',
      'Quelles sont les techniques de simulation de stress pour le risque de liquidité en banque UMOA ?',
      'Comment gérer le risque de remboursement anticipé dans un portefeuille de crédits UMOA ?',
      'Quels sont les instruments de couverture du risque de taux disponibles en UMOA ?',
      'Comment calculer la duration modifiée d\'un portefeuille obligataire en UMOA ?',
      'Quelles sont les exigences du LCR (Liquidity Coverage Ratio) pour les banques UMOA ?',
      'Comment gérer les dépôts à vue dans le modèle ALM d\'une banque UMOA ?',
      'Quelles sont les règles BCEAO sur les réserves obligatoires et leur impact sur l\'ALM ?',
      'Comment modéliser les comportements de remboursement anticipé dans une banque de détail UMOA ?',
      'Quelles sont les stratégies de financement à long terme disponibles pour une banque UMOA ?',
      'Comment évaluer la sensibilité de la valeur économique des fonds propres (EVE) en UMOA ?',
      'Quelles sont les pratiques de titrisation disponibles pour gérer le bilan d\'une banque UMOA ?',
      'Comment établir un plan de continuité de financement (contingency funding plan) en UMOA ?',
      'Quelles sont les règles de reporting ALM à la Commission Bancaire UMOA ?',
      'Comment gérer l\'adéquation structurelle du bilan d\'une banque selon le NSFR en UMOA ?',
      'Quelles sont les techniques de gestion du risque de change dans le cadre de l\'ALM ?',
      'Comment optimiser la structure du bilan bancaire pour maximiser le ROE en UMOA ?',
      'Quelles sont les meilleures pratiques en matière de gouvernance ALM pour les banques UMOA ?',
      'Comment gérer les effets de la politique monétaire de la BCEAO sur l\'ALM bancaire ?',
      'Quelles sont les exigences de stress test en matière de liquidité imposées par la Commission Bancaire ?',
      'Comment mettre en place des limites ALM pour le risque de taux et de liquidité en UMOA ?',
    ],
  },
  {
    id: 'fiscalite',
    label: 'Fiscalité Bancaire',
    icon: 'receipt-outline' as const,
    color: '#84CC16',
    bg: '#0d1600',
    questions: [
      'Quelles sont les principales taxes applicables aux établissements de crédit en UMOA ?',
      'Comment calculer la TVA sur les services financiers dans les pays de la zone UMOA ?',
      'Quelles sont les règles d\'exonération de TVA applicables aux opérations bancaires en UMOA ?',
      'Comment traiter fiscalement les provisions pour créances douteuses en UMOA ?',
      'Quelles sont les règles d\'imposition des plus-values sur cession de titres pour les banques ?',
      'Comment fonctionne l\'impôt sur les sociétés (IS) pour les établissements de crédit en UMOA ?',
      'Quelles sont les obligations fiscales liées aux intérêts versés sur les dépôts en UMOA ?',
      'Comment traiter fiscalement les dividendes reçus par une banque de ses participations en UMOA ?',
      'Quelles sont les règles de déductibilité fiscale des charges financières pour une banque UMOA ?',
      'Comment gérer la TVA sur les commissions bancaires dans les différents pays de l\'UMOA ?',
      'Quelles sont les règles fiscales applicables aux opérations de leasing en UMOA ?',
      'Comment calculer et déclarer la retenue à la source sur les intérêts en UMOA ?',
      'Quelles sont les conventions fiscales entre les pays de l\'UMOA et leurs partenaires extérieurs ?',
      'Comment traiter fiscalement une restructuration de créance (abandon de créance) en UMOA ?',
      'Quelles sont les règles de prix de transfert applicables aux groupes bancaires en UMOA ?',
      'Comment calculer la contribution des patentes et licences pour une banque en UMOA ?',
      'Quelles sont les obligations fiscales déclaratives mensuelles et annuelles d\'une banque UMOA ?',
      'Comment traiter fiscalement les opérations de couverture de risque de change en UMOA ?',
      'Quelles sont les règles d\'imposition des revenus de titres publics détenus par une banque UMOA ?',
      'Comment gérer la TVA sur les prestations de services bancaires transfrontaliers en UMOA ?',
      'Quelles sont les règles de déductibilité des dotations aux amortissements pour une banque UMOA ?',
      'Comment traiter fiscalement un apport partiel d\'actif entre deux établissements de crédit UMOA ?',
      'Quelles sont les obligations fiscales lors de la distribution de dividendes par une banque UMOA ?',
      'Comment gérer le contrôle fiscal d\'une banque et les obligations documentaires en UMOA ?',
      'Quelles sont les règles d\'exonération fiscale pour les émissions d\'obligations bancaires en UMOA ?',
      'Comment traiter fiscalement les indemnités de rupture de contrat de travail dans une banque UMOA ?',
      'Quelles sont les règles de déductibilité des charges de formation du personnel bancaire en UMOA ?',
      'Comment optimiser la structure fiscale d\'un groupe bancaire opérant dans plusieurs pays UMOA ?',
      'Quelles sont les règles fiscales spécifiques à la finance islamique dans les pays UMOA ?',
      'Comment gérer un litige fiscal avec l\'administration dans un pays de la zone UMOA ?',
    ],
  },
  {
    id: 'audit',
    label: 'Audit & Contrôle Interne',
    icon: 'checkmark-circle-outline' as const,
    color: '#F97316',
    bg: '#1a0800',
    questions: [
      'Quelles sont les exigences réglementaires en matière de contrôle interne pour les banques UMOA ?',
      'Comment organiser la fonction d\'audit interne dans une banque conformément aux normes BCEAO ?',
      'Quelles sont les obligations de certification des comptes par le commissaire aux comptes en UMOA ?',
      'Comment conduire un audit du dispositif de contrôle interne d\'une banque UMOA ?',
      'Quelles sont les normes professionnelles d\'audit interne applicables aux banques UMOA ?',
      'Comment évaluer l\'efficacité du système de contrôle permanent dans une banque UMOA ?',
      'Quelles sont les obligations de rapport de l\'auditeur interne à la direction et au conseil d\'administration ?',
      'Comment planifier et conduire un audit du risque de crédit dans une banque UMOA ?',
      'Quelles sont les missions obligatoires du comité d\'audit dans une banque UMOA ?',
      'Comment auditer le dispositif LBC-FT d\'un établissement de crédit en UMOA ?',
      'Quelles sont les règles de communication des rapports d\'audit à la Commission Bancaire ?',
      'Comment conduire un audit informatique (IT audit) dans le contexte bancaire UMOA ?',
      'Quelles sont les obligations d\'indépendance de l\'auditeur interne dans une banque UMOA ?',
      'Comment évaluer le dispositif de gestion des risques opérationnels par l\'audit interne ?',
      'Quelles sont les techniques de sondage statistique utilisées en audit bancaire UMOA ?',
      'Comment conduire un audit des procédures de clôture des comptes annuels d\'une banque ?',
      'Quelles sont les obligations de certification des états financiers consolidés en UMOA ?',
      'Comment auditer les systèmes de contrôle des positions de change dans une banque UMOA ?',
      'Quelles sont les règles relatives à la rotation des commissaires aux comptes en UMOA ?',
      'Comment mettre en place un système de contrôle de conformité (compliance) efficace en banque UMOA ?',
      'Quelles sont les normes ISRS (International Standards on Related Services) applicables en UMOA ?',
      'Comment l\'auditeur interne doit-il gérer les conflits d\'intérêts dans ses missions ?',
      'Quelles sont les obligations de déclaration de l\'auditeur en cas de détection d\'irrégularités en UMOA ?',
      'Comment auditer le processus de provisionnement des créances douteuses d\'une banque UMOA ?',
      'Quelles sont les exigences de la Commission Bancaire en matière de programme de travail d\'audit ?',
      'Comment évaluer l\'adéquation du dispositif de sécurité des systèmes d\'information bancaires ?',
      'Quelles sont les règles de communication entre l\'auditeur externe et la Commission Bancaire UMOA ?',
      'Comment conduire un audit de la fonction ALM (gestion actif-passif) dans une banque UMOA ?',
      'Quelles sont les obligations de documentation des travaux d\'audit interne en UMOA ?',
      'Comment mettre en œuvre un plan d\'amélioration suite aux recommandations d\'audit en banque UMOA ?',
    ],
  },
];

/* ─── Types ───────────────────────────────────────────────── */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: Date;
  loading?: boolean;
}

interface ArchiveItem {
  id: string;
  question: string;
  answer: string | null;
  status: string;
  created_at: string;
}

interface MonthGroup {
  key: string;       // "2026-04"
  label: string;     // "Avril 2026"
  items: ArchiveItem[];
}

function uid() { return Math.random().toString(36).slice(2) + Date.now(); }
function hhmm(d: Date) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}
function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

type ViewMode = 'themes' | 'chat' | 'history';

/* ─── Screen ──────────────────────────────────────────────── */
export default function QuestionsScreen() {
  const [mode, setMode] = useState<ViewMode>('themes');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const isRecording = recorderState.isRecording;

  const flatRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => {
      try {
        await AudioModule.requestRecordingPermissionsAsync();
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      } catch {
        // Permission refusée — géré au moment du tap sur le micro.
      }
    })();
  }, []);

  const startRecording = async () => {
    setVoiceError(null);
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setVoiceError('Permission du microphone refusée. Activez-la dans les réglages.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (e: any) {
      setVoiceError('Impossible de démarrer l\'enregistrement.');
    }
  };

  const cancelRecording = async () => {
    try {
      await audioRecorder.stop();
    } catch {}
    setVoiceError(null);
  };

  const stopAndTranscribe = async () => {
    try {
      await audioRecorder.stop();
    } catch {}
    const uri = audioRecorder.uri;
    if (!uri) {
      setVoiceError('Enregistrement indisponible. Réessayez.');
      return;
    }
    setIsTranscribing(true);
    setVoiceError(null);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append('file', {
        uri,
        name: 'question.m4a',
        type: 'audio/m4a',
      } as any);
      const res = await fetch(`${API_URL}/voice/transcribe`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || 'Transcription impossible');
      }
      const data = await res.json();
      const text = (data?.text || '').trim();
      if (!text) {
        setVoiceError('Aucun texte détecté. Réessayez en parlant plus distinctement.');
        return;
      }
      setInput((prev) => (prev ? `${prev} ${text}` : text));
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e: any) {
      setVoiceError(e?.message || 'Erreur lors de la transcription.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const scrollBottom = () =>
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

  const send = async (q?: string) => {
    const question = (q ?? input).trim();
    if (!question || sending) return;
    setMode('chat');

    const userMsg: Message = { id: uid(), role: 'user', content: question, ts: new Date() };
    const loadingMsg: Message = { id: uid() + '-l', role: 'assistant', content: '', ts: new Date(), loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput('');
    setSending(true);
    scrollBottom();
    inputRef.current?.blur();

    try {
      const res = await apiClient.post<any>('/questions', { question });
      const answer = res?.answer || 'Aucune réponse reçue.';
      setMessages((prev) =>
        prev.map((m) => (m.loading ? { ...m, content: answer, loading: false } : m))
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? { ...m, content: `Erreur : ${err?.message || 'Une erreur est survenue.'}`, loading: false }
            : m
        )
      );
    } finally {
      setSending(false);
      scrollBottom();
    }
  };

  const goThemes = () => {
    setMode('themes');
    setMessages([]);
    setExpandedTheme(null);
  };

  const headerTitle =
    mode === 'chat' ? 'Assistant Miznas AI'
    : mode === 'history' ? 'Historique'
    : 'Base de connaissances';

  const headerSub =
    mode === 'chat' ? 'IA · Réglementation bancaire UMOA'
    : mode === 'history' ? 'Questions archivées par mois'
    : `${THEMES.length} thèmes · Réglementation BCEAO-UMOA`;

  return (
    <View style={s.root}>
      <View style={s.orb1} />
      <View style={s.orb2} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 + insets.bottom : 0}
        >
          {/* ── Header ──────────────────────────────────── */}
          <View style={s.header}>
            {mode !== 'themes' ? (
              <Pressable onPress={goThemes} style={s.backBtn} hitSlop={8}>
                <Ionicons name="arrow-back" size={18} color={C.muted} />
              </Pressable>
            ) : (
              <View style={s.headerIcon}>
                <Ionicons name="sparkles-outline" size={19} color={C.accent} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{headerTitle}</Text>
              <Text style={s.subtitle}>{headerSub}</Text>
            </View>
            {/* Bouton Historique (visible en mode thèmes et chat) */}
            {mode !== 'history' && (
              <Pressable
                onPress={() => setMode('history')}
                style={s.histBtn}
                hitSlop={6}
              >
                <Ionicons name="time-outline" size={16} color={C.muted} style={{ opacity: 0.7 }} />
                <Text style={s.histBtnText}>Historique</Text>
              </Pressable>
            )}
          </View>

          {/* ── Modes ───────────────────────────────────── */}
          {mode === 'themes' && (
            <ThemesView
              expandedTheme={expandedTheme}
              setExpandedTheme={setExpandedTheme}
              onSend={send}
            />
          )}

          {mode === 'chat' && (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={s.msgList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollBottom}
              renderItem={({ item: m }) => {
                if (m.role === 'user') {
                  return (
                    <View style={s.rowUser}>
                      <View style={s.bubbleUser}>
                        <Text style={s.bubbleUserText}>{m.content}</Text>
                        <Text style={s.msgTime}>{hhmm(m.ts)}</Text>
                      </View>
                    </View>
                  );
                }
                return (
                  <View style={s.rowAssistant}>
                    <View style={s.faAvatar}>
                      <Text style={s.faAvatarText}>FA</Text>
                    </View>
                    <View style={s.bubbleAssistant}>
                      {m.loading ? (
                        <View style={s.typingRow}>
                          <ActivityIndicator size="small" color={C.accent} />
                          <Text style={s.typingText}>Miznas AI réfléchit…</Text>
                        </View>
                      ) : (
                        <>
                          <FormattedText content={m.content} />
                          <Text style={s.msgTimeAssistant}>{hhmm(m.ts)}</Text>
                        </>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}

          {mode === 'history' && <HistoryView onReask={send} />}

          {/* ── Barre de saisie (thèmes + chat) ─────────── */}
          {mode !== 'history' && (
            <View style={{ paddingBottom: 5 }}>
              {voiceError && (
                <View style={s.voiceErrorBar}>
                  <Ionicons name="alert-circle" size={14} color={C.error} />
                  <Text style={s.voiceErrorText}>{voiceError}</Text>
                  <Pressable hitSlop={8} onPress={() => setVoiceError(null)}>
                    <Ionicons name="close" size={14} color={C.error} />
                  </Pressable>
                </View>
              )}
              {isRecording ? (
                <View style={s.inputBar}>
                  <Pressable
                    onPress={cancelRecording}
                    style={({ pressed }) => [s.recCancelBtn, pressed && { opacity: 0.8 }]}
                    hitSlop={6}
                  >
                    <Ionicons name="trash-outline" size={20} color={C.error} />
                  </Pressable>
                  <View style={s.recStatus}>
                    <View style={s.recDot} />
                    <Text style={s.recText}>Enregistrement en cours…</Text>
                  </View>
                  <Pressable
                    onPress={stopAndTranscribe}
                    style={({ pressed }) => [s.sendBtn, pressed && { opacity: 0.8 }]}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View style={s.inputBar}>
                  <TextInput
                    ref={inputRef}
                    style={s.input}
                    placeholder={
                      isTranscribing
                        ? 'Transcription en cours…'
                        : mode === 'chat'
                        ? 'Posez une autre question…'
                        : 'Posez votre question bancaire…'
                    }
                    placeholderTextColor="rgba(203,213,225,0.35)"
                    value={input}
                    onChangeText={setInput}
                    multiline
                    maxLength={800}
                    editable={!sending && !isTranscribing}
                  />
                  {input.trim().length > 0 || sending ? (
                    <Pressable
                      style={({ pressed }) => [
                        s.sendBtn,
                        (!input.trim() || sending) && s.sendBtnOff,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => send()}
                      disabled={!input.trim() || sending}
                    >
                      {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="arrow-up" size={18} color="#fff" />
                      )}
                    </Pressable>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [
                        s.micBtn,
                        isTranscribing && s.sendBtnOff,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={startRecording}
                      disabled={isTranscribing}
                    >
                      {isTranscribing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="mic" size={20} color="#fff" />
                      )}
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/* ─── ThemesView ──────────────────────────────────────────── */
function ThemesView({
  expandedTheme,
  setExpandedTheme,
  onSend,
}: {
  expandedTheme: string | null;
  setExpandedTheme: (id: string | null) => void;
  onSend: (q: string) => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={s.themesContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Intro Miznas AI */}
      <View style={s.introCard}>
        <View style={s.introAvatar}>
          <Text style={s.introAvatarText}>FA</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.introName}>Miznas AI</Text>
          <Text style={s.introMsg}>
            Choisissez un thème ou saisissez directement votre question sur la réglementation bancaire UMOA.
          </Text>
        </View>
      </View>

      {THEMES.map((theme) => {
        const open = expandedTheme === theme.id;
        return (
          <View
            key={theme.id}
            style={[
              s.themeCard,
              { borderColor: open ? theme.color + '60' : 'rgba(27,58,140,0.3)' },
              open && { backgroundColor: theme.bg },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                s.themeHeader,
                pressed && { opacity: 0.85 },
                open && { borderBottomWidth: 1, borderBottomColor: theme.color + '25' },
              ]}
              onPress={() => setExpandedTheme(open ? null : theme.id)}
            >
              <View style={[s.themeIconBox, { backgroundColor: theme.color + '18', borderColor: theme.color + '40' }]}>
                <Ionicons name={theme.icon} size={18} color={theme.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.themeLabel, open && { color: theme.color }]}>{theme.label}</Text>
                <Text style={s.themeCount}>{theme.questions.length} questions</Text>
              </View>
              <View style={[s.themeChevron, open && { backgroundColor: theme.color + '20', borderColor: theme.color + '40' }]}>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={15}
                  color={open ? theme.color : C.muted}
                  style={{ opacity: open ? 1 : 0.5 }}
                />
              </View>
            </Pressable>

            {open && (
              <View style={s.questionsList}>
                {theme.questions.map((q, i) => (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [
                      s.questionRow,
                      i < theme.questions.length - 1 && s.questionRowBorder,
                      pressed && { backgroundColor: theme.color + '12' },
                    ]}
                    onPress={() => onSend(q)}
                  >
                    <View style={[s.questionNum, { backgroundColor: theme.color + '18' }]}>
                      <Text style={[s.questionNumText, { color: theme.color }]}>{i + 1}</Text>
                    </View>
                    <Text style={s.questionText} numberOfLines={3}>{q}</Text>
                    <Ionicons
                      name="arrow-forward-circle-outline"
                      size={20}
                      color={theme.color}
                      style={{ opacity: 0.7, flexShrink: 0 }}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}
      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

/* ─── HistoryView ─────────────────────────────────────────── */
function HistoryView({ onReask }: { onReask: (q: string) => void }) {
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any>('/questions/my-questions?limit=500');
      const items: ArchiveItem[] = Array.isArray(data)
        ? data
        : data?.questions ?? data?.items ?? [];
      setArchives(items.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      // Ouvrir le mois le plus récent par défaut
      if (items.length > 0) {
        const d = new Date(items[0].created_at);
        setExpandedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    } catch {
      setArchives([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const groups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, MonthGroup>();
    for (const item of archives) {
      const d = new Date(item.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [archives]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={s.dimText}>Chargement de l'historique…</Text>
      </View>
    );
  }

  if (archives.length === 0) {
    return (
      <View style={s.center}>
        <Ionicons name="time-outline" size={44} color={C.muted} style={{ opacity: 0.2 }} />
        <Text style={s.dimTitle}>Aucune question posée</Text>
        <Text style={s.dimText}>Vos questions apparaîtront ici une fois posées.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={s.histContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Résumé */}
      <View style={s.histSummary}>
        <View style={s.histSummaryItem}>
          <Text style={s.histSummaryNum}>{archives.length}</Text>
          <Text style={s.histSummaryLabel}>questions</Text>
        </View>
        <View style={s.histSummaryDivider} />
        <View style={s.histSummaryItem}>
          <Text style={s.histSummaryNum}>{groups.length}</Text>
          <Text style={s.histSummaryLabel}>mois</Text>
        </View>
        <View style={s.histSummaryDivider} />
        <View style={s.histSummaryItem}>
          <Text style={s.histSummaryNum}>
            {archives.filter((a) => a.status === 'answered').length}
          </Text>
          <Text style={s.histSummaryLabel}>répondues</Text>
        </View>
        <Pressable onPress={fetch_} style={s.refreshBtn} hitSlop={8}>
          <Ionicons name="refresh-outline" size={16} color={C.muted} style={{ opacity: 0.6 }} />
        </Pressable>
      </View>

      {/* Groupes par mois */}
      {groups.map((group) => {
        const isOpen = expandedMonth === group.key;
        const answered = group.items.filter((i) => i.status === 'answered').length;
        return (
          <View key={group.key} style={s.monthCard}>
            {/* En-tête du mois */}
            <Pressable
              style={({ pressed }) => [s.monthHeader, pressed && { opacity: 0.85 }]}
              onPress={() => {
                setExpandedMonth(isOpen ? null : group.key);
                setExpandedItem(null);
              }}
            >
              <View style={s.monthIconWrap}>
                <Ionicons name="calendar-outline" size={16} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.monthLabel}>{group.label}</Text>
                <Text style={s.monthMeta}>
                  {group.items.length} question{group.items.length > 1 ? 's' : ''} · {answered} répondue{answered > 1 ? 's' : ''}
                </Text>
              </View>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={C.accent}
                style={{ opacity: 0.6 }}
              />
            </Pressable>

            {/* Questions du mois */}
            {isOpen && (
              <View style={s.monthItems}>
                {group.items.map((item, idx) => {
                  const isExpanded = expandedItem === item.id;
                  const hasAnswer = !!item.answer;
                  return (
                    <View
                      key={item.id}
                      style={[
                        s.archiveItem,
                        idx < group.items.length - 1 && s.archiveItemBorder,
                        isExpanded && s.archiveItemOpen,
                      ]}
                    >
                      {/* Question row */}
                      <Pressable
                        style={({ pressed }) => [
                          s.archiveItemHeader,
                          pressed && { opacity: 0.85 },
                        ]}
                        onPress={() => setExpandedItem(isExpanded ? null : item.id)}
                      >
                        <View style={[
                          s.archiveStatusDot,
                          { backgroundColor: hasAnswer ? C.success : 'rgba(203,213,225,0.2)' },
                        ]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.archiveQuestion} numberOfLines={isExpanded ? undefined : 2}>
                            {item.question}
                          </Text>
                          <Text style={s.archiveDate}>{formatDate(item.created_at)}</Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color={C.muted}
                          style={{ opacity: 0.4, flexShrink: 0, marginTop: 2 }}
                        />
                      </Pressable>

                      {/* Réponse + actions */}
                      {isExpanded && (
                        <View style={s.archiveAnswer}>
                          {hasAnswer ? (
                            <>
                              <View style={s.archiveAnswerHeader}>
                                <View style={s.faAvatarSm}>
                                  <Text style={s.faAvatarSmText}>FA</Text>
                                </View>
                                <Text style={s.archiveAnswerLabel}>Réponse de Miznas AI</Text>
                              </View>
                              <FormattedText content={item.answer} cardStyle={false} />
                            </>
                          ) : (
                            <Text style={s.archiveNoAnswer}>
                              {item.status === 'pending' ? 'Réponse en attente…' : 'Aucune réponse disponible.'}
                            </Text>
                          )}
                          {/* Reposer la question */}
                          <Pressable
                            style={({ pressed }) => [s.reaskBtn, pressed && { opacity: 0.75 }]}
                            onPress={() => onReask(item.question)}
                          >
                            <Ionicons name="refresh-outline" size={14} color={C.accent} />
                            <Text style={s.reaskText}>Reposer cette question</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}


/* ─── Styles ──────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  orb1: {
    position: 'absolute', borderRadius: 9999,
    width: width * 0.7, height: width * 0.7,
    top: -width * 0.2, right: -width * 0.15,
    backgroundColor: C.primary, opacity: 0.09,
  },
  orb2: {
    position: 'absolute', borderRadius: 9999,
    width: width * 0.5, height: width * 0.5,
    bottom: -width * 0.1, left: -width * 0.1,
    backgroundColor: C.accent, opacity: 0.04,
  },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.surface, borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: C.text, fontSize: 17, fontWeight: '800' },
  subtitle: { color: C.muted, fontSize: 11, opacity: 0.55, marginTop: 1 },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)',
  },
  newChatText: { color: C.accent, fontSize: 12, fontWeight: '700' },

  /* Themes page */
  themesContent: { paddingHorizontal: 14, paddingTop: 4, gap: 8 },

  introCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(27,58,140,0.4)',
    marginBottom: 4,
  },
  introAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.primary,
    borderWidth: 2, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  introAvatarText: { color: C.accent, fontSize: 10, fontWeight: '800' },
  introName: { color: C.accent, fontSize: 12, fontWeight: '800', marginBottom: 4 },
  introMsg: { color: C.muted, fontSize: 13, lineHeight: 19, opacity: 0.8 },

  themeCard: {
    borderRadius: 16, borderWidth: 1,
    backgroundColor: C.surface, overflow: 'hidden',
  },
  themeHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingHorizontal: 14, paddingVertical: 14,
  },
  themeIconBox: {
    width: 38, height: 38, borderRadius: 11, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  themeLabel: { color: C.text, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  themeCount: { color: C.muted, fontSize: 11, opacity: 0.5, marginTop: 1 },
  themeChevron: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(27,58,140,0.3)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  questionsList: { paddingBottom: 6 },
  questionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  questionRowBorder: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  questionNum: {
    width: 24, height: 24, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  questionNumText: { fontSize: 11, fontWeight: '800' },
  questionText: { flex: 1, color: C.muted, fontSize: 13, lineHeight: 19 },

  /* Chat */
  msgList: { paddingHorizontal: 8, paddingVertical: 14, gap: 14 },

  rowUser: { flexDirection: 'row', justifyContent: 'flex-end' },
  bubbleUser: {
    backgroundColor: C.primary, borderRadius: 18, borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10, maxWidth: width * 0.78,
    borderWidth: 1, borderColor: 'rgba(27,58,140,0.7)',
  },
  bubbleUserText: { color: C.text, fontSize: 14, lineHeight: 21 },

  rowAssistant: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  faAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primary, borderWidth: 1.5, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2,
  },
  faAvatarText: { color: C.accent, fontSize: 9, fontWeight: '800' },
  bubbleAssistant: {
    flex: 1, backgroundColor: C.surface, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(27,58,140,0.4)',
  },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  typingText: { color: C.muted, fontSize: 13, fontStyle: 'italic', opacity: 0.6 },

  msgTime: { color: 'rgba(203,213,225,0.3)', fontSize: 10, textAlign: 'right', marginTop: 4 },
  msgTimeAssistant: { color: 'rgba(203,213,225,0.25)', fontSize: 10, marginTop: 6 },

  /* Input */
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(27,58,140,0.3)',
    backgroundColor: C.bg,
  },
  input: {
    flex: 1, backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(27,58,140,0.5)',
    paddingHorizontal: 14, paddingTop: 11, paddingBottom: 11,
    color: C.text, fontSize: 14, maxHeight: 100, lineHeight: 20,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.accent + '50',
  },
  sendBtnOff: { opacity: 0.3 },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.accent + '80',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  recCancelBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(248,113,113,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)',
  },
  recStatus: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)',
    paddingHorizontal: 14, height: 44,
  },
  recDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.error,
  },
  recText: {
    color: C.muted, fontSize: 13, fontWeight: '600',
  },
  voiceErrorBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
    borderRadius: 10,
  },
  voiceErrorText: {
    flex: 1, color: C.error, fontSize: 12,
  },

  /* Historique button in header */
  histBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: 'rgba(27,58,140,0.4)',
  },
  histBtnText: { color: C.muted, fontSize: 12, fontWeight: '600', opacity: 0.7 },

  /* History page */
  histContent: { paddingHorizontal: 14, paddingTop: 10, gap: 10 },

  histSummary: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(27,58,140,0.35)', marginBottom: 2,
  },
  histSummaryItem: { flex: 1, alignItems: 'center' },
  histSummaryNum: { color: C.accent, fontSize: 22, fontWeight: '800' },
  histSummaryLabel: { color: C.muted, fontSize: 11, opacity: 0.55, marginTop: 1 },
  histSummaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(27,58,140,0.4)' },
  refreshBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(27,58,140,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10,
  },

  /* Month group */
  monthCard: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(27,58,140,0.3)',
    backgroundColor: C.surface,
  },
  monthHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  monthIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  monthLabel: {
    color: C.text, fontSize: 14, fontWeight: '700',
    textTransform: 'capitalize',
  },
  monthMeta: { color: C.muted, fontSize: 11, opacity: 0.5, marginTop: 1 },

  /* Archive items */
  monthItems: {
    borderTopWidth: 1, borderTopColor: 'rgba(27,58,140,0.2)',
  },
  archiveItem: { backgroundColor: C.deep },
  archiveItemBorder: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(27,58,140,0.15)',
  },
  archiveItemOpen: { backgroundColor: 'rgba(7,14,40,0.95)' },
  archiveItemHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  archiveStatusDot: {
    width: 8, height: 8, borderRadius: 4,
    marginTop: 5, flexShrink: 0,
  },
  archiveQuestion: {
    color: C.text, fontSize: 13, fontWeight: '600', lineHeight: 19,
  },
  archiveDate: { color: C.muted, fontSize: 10, opacity: 0.45, marginTop: 3 },

  archiveAnswer: {
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2,
  },
  archiveAnswerHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  faAvatarSm: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.primary, borderWidth: 1, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  faAvatarSmText: { color: C.accent, fontSize: 7, fontWeight: '800' },
  archiveAnswerLabel: { color: C.accent, fontSize: 11, fontWeight: '700' },
  archiveAnswerText: {
    color: 'rgba(203,213,225,0.8)', fontSize: 13, lineHeight: 20,
    backgroundColor: C.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(27,58,140,0.3)',
  },
  archiveNoAnswer: {
    color: C.muted, fontSize: 13, fontStyle: 'italic', opacity: 0.5,
    paddingVertical: 6,
  },

  reaskBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginTop: 10,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
  },
  reaskText: { color: C.accent, fontSize: 12, fontWeight: '600' },

  /* Utils */
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  dimTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  dimText: { color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 19, opacity: 0.6 },
});

