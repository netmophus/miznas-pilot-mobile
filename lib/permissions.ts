import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

const TABS_KEY = 'miznas_allowed_tabs';

export async function fetchAndStoreAllowedTabs(): Promise<string[]> {
  const data = await apiClient.get<{ allowed_tabs: string[] }>(
    '/tab-permissions/user/allowed-tabs'
  );
  const tabs = data.allowed_tabs ?? [];
  await AsyncStorage.setItem(TABS_KEY, JSON.stringify(tabs));
  return tabs;
}

export async function getStoredAllowedTabs(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(TABS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearAllowedTabs(): Promise<void> {
  await AsyncStorage.removeItem(TABS_KEY);
}
