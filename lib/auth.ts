import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import { getToken, setToken, removeToken } from './token';
import { fetchAndStoreAllowedTabs, clearAllowedTabs } from './permissions';

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

  return {
    access_token: tokenRes.access_token,
    token_type: tokenRes.token_type,
    user,
  };
}

export async function logout(): Promise<void> {
  await removeToken();
  await AsyncStorage.removeItem(USER_KEY);
  await clearAllowedTabs();
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
