/**
 * Cookie partage entre www.miznas.co (Next.js desktop) et app.miznas.co
 * (Expo Web). Utilise pour signaler a Next.js qu'un utilisateur est connecte
 * sur l'espace mobile — pas pour transporter le JWT (qui reste en
 * AsyncStorage / localStorage cote mobile).
 *
 * - Sur natif (iOS / Android) : les 2 fonctions sont des no-op.
 * - En prod (domaine *.miznas.co) : cookie pose sur `.miznas.co` (partage).
 * - En dev (localhost) : cookie pose sans `domain` (valide uniquement pour
 *   le host courant).
 */
import { Platform } from 'react-native';

const COOKIE_NAME = 'miznas_logged_in';
const COOKIE_DOMAIN = '.miznas.co';
const MAX_AGE_DAYS = 30;

export function setLoggedInCookie(): void {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;

  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  const isProd = window.location.hostname.endsWith('miznas.co');
  const domainPart = isProd ? `; domain=${COOKIE_DOMAIN}` : '';
  const securePart = isProd ? '; secure' : '';

  document.cookie = `${COOKIE_NAME}=true; path=/; max-age=${maxAge}${domainPart}${securePart}; samesite=lax`;
}

export function clearLoggedInCookie(): void {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;

  const isProd = window.location.hostname.endsWith('miznas.co');
  const domainPart = isProd ? `; domain=${COOKIE_DOMAIN}` : '';

  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0${domainPart}`;
}
