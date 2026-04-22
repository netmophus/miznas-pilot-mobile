# Miznas Pilot — Mobile

Application mobile Expo / React Native pour l'assistant bancaire **Miznas Pilot** : formations bancaires, base de connaissance IA (réglementation PCB UEMOA / BCEAO), analyse de crédit et outils pour professionnels bancaires de la zone UMOA.

## Stack

- **Expo SDK 54** — runtime managé, build via EAS
- **React Native 0.81** avec nouvelle architecture activée
- **React 19**
- **TypeScript 5.9**
- **expo-router v6** — routing basé fichiers
- **AsyncStorage** — persistance locale du token d'authentification

## Prérequis

- Node.js ≥ 20 (recommandé : 24.x)
- npm ≥ 10
- Un compte Expo pour builder (`eas login`)
- **Android** : Android Studio (pour l'émulateur) ou un téléphone avec Expo Go
- **iOS** : Xcode + simulateur, ou un iPhone avec Expo Go

## Installation

```bash
npm install
```

## Scripts disponibles

```bash
npm start          # Démarre le dev server Expo (Metro)
npm run android    # Ouvre sur un émulateur/device Android
npm run ios        # Ouvre sur un simulateur/device iOS
npm run web        # Ouvre la version web
npm run lint       # Vérifie le code avec ESLint
```

En alternative : `npx expo start --clear` pour vider le cache Metro.

## Build APK (Android)

Via **EAS Build** (cloud, pas besoin d'Android Studio en local) :

```bash
eas login
eas build -p android --profile preview     # APK installable direct
eas build -p android --profile production  # AAB pour Play Store
```

Les profils sont définis dans `eas.json`.

## Structure du projet

```
assistant-bank-mob/
├── app/                    # Routes expo-router (file-based)
│   ├── _layout.tsx         # Layout racine (MobileFrame + Stack)
│   ├── index.tsx           # Écran d'accueil public (login/register)
│   ├── (auth)/             # Login, register, mot de passe oublié
│   └── (tabs)/             # Écrans post-login (dashboard, formations,
│                           #   questions, profile)
├── components/             # Composants UI partagés
│   ├── MobileFrame.tsx     # Cadre mobile centré sur web desktop
│   ├── FormattedText.tsx   # Renderer Markdown natif RN
│   ├── FormationsSheet.tsx # Bottom sheet des formations
│   └── InputField.tsx      # Champ de saisie stylé
├── lib/                    # Clients API, auth, token storage
├── hooks/                  # Hooks React custom
├── constants/              # Constantes partagées
├── assets/                 # Images, icônes, splash
├── app.json                # Configuration Expo
├── eas.json                # Profils de build EAS
└── tsconfig.json           # Config TypeScript (alias @/*)
```

## Backend

L'application consomme l'API **Miznas Pilot Banking** :

- **URL de production** : https://api.miznas.co
- Authentification : JWT (Bearer token stocké dans AsyncStorage sous la clé `miznas_token`)
- Endpoints principaux : `/auth`, `/questions`, `/formations/user/my-formations`, `/qcm-responses`

L'URL est configurée dans `lib/config.ts`.

## Cadre mobile en version web

Le composant `MobileFrame` (dans `components/`) encadre l'app dans un format téléphone centré (largeur max 480px) quand elle est ouverte sur un navigateur desktop (≥ 768px). Sur mobile (iOS / Android / petit écran web), le composant est transparent.

## Licence

Propriétaire — © Miznas Pilot. Tous droits réservés.
