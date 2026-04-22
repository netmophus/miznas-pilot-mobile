import { API_URL } from './config';
import { getToken } from './token';

// Log l'URL au démarrage pour vérifier la config
console.log('[API] API_URL =', API_URL);

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${API_URL}${endpoint}`;
  console.log('[API] →', options.method || 'GET', fullUrl);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log('[API] ←', response.status, fullUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: response.statusText,
      }));
      const msg = typeof errorData.detail === 'string'
        ? errorData.detail
        : JSON.stringify(errorData.detail);
      console.warn('[API] Erreur', response.status, msg);
      const httpError = new Error(msg) as Error & { status?: number; isHttpError?: boolean };
      httpError.status = response.status;
      httpError.isHttpError = true;
      throw httpError;
    }

    if (response.status === 204) return {} as T;
    return response.json();

  } catch (err: any) {
    if (err?.isHttpError) {
      // Déjà loggé via console.warn plus haut, on relance sans bruit.
      throw err;
    }
    if (err?.message === 'Network request failed') {
      console.warn('[API] Réseau indisponible — URL tentée:', fullUrl);
    } else {
      console.warn('[API] Erreur inattendue:', err?.message);
    }
    throw err;
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
};
