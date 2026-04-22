import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import { getToken, setToken, removeToken } from './token';
import { fetchAndStoreAllowedTabs, clearAllowedTabs } from './permissions';
import { setLoggedInCookie, clearLoggedInCookie } from './cookie';

const USER_KEY = 'miznas_user';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id?: string | null;
  organization_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ── Stockage de l'utilisateur ──────────────────────────────────────────────────

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function setUser(user: User): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── Actions auth ───────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  // 1. Obtenir le token
  const tokenRes = await apiClient.post<{ access_token: string; token_type: string }>(
    '/auth/login',
    { email, password }
  );

  // 2. Stocker le token
  await setToken(tokenRes.access_token);

  // 3. Récupérer le profil utilisateur
  const user = await apiClient.get<User>('/auth/me');

  // 4. Stocker l'utilisateur
  await setUser(user);

  // 5. Récupérer et stocker les tabs autorisés
  await fetchAndStoreAllowedTabs();

  // 6. Poser le cookie partagé .miznas.co pour la redirection intelligente
  //    depuis www.miznas.co (no-op sur natif).
  setLoggedInCookie();

  return {
    access_token: tokenRes.access_token,
    token_type: tokenRes.token_type,
    user,
  };
}

export interface RegisterDemoRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_country_code: string;
  phone_number: string;
}

/**
 * Inscription DEMO via app mobile. Rattache l'user a l'org et au dept DEMO,
 * retourne directement un JWT (pas besoin de second login). Equivalent de
 * `login()` mais via /auth/register-demo.
 */
export async function registerDemo(
  data: RegisterDemoRequest
): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/register-demo', data);

  await setToken(res.access_token);
  await setUser(res.user);
  await fetchAndStoreAllowedTabs();
  setLoggedInCookie();

  return res;
}

export async function logout(): Promise<void> {
  // Supprimer le cookie partage en premier pour eviter toute fenetre ou
  // www.miznas.co redirigerait apres deconnexion (no-op sur natif).
  clearLoggedInCookie();
  await removeToken();
  await AsyncStorage.removeItem(USER_KEY);
  await clearAllowedTabs();
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
