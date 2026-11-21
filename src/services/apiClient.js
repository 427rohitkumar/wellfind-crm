/**
 * Wellfind Academic — Central API Client & Authentication Management
 */

const configuredBaseUrl = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || ''
).replace(/\/+$/, '');

// In development (DEV mode + no non-localhost VITE_API_BASE_URL), route /api requests
// through Vite's proxy so the browser does not get blocked by CORS.
// In production build, VITE_API_BASE_URL must be set to the full backend URL
// (e.g. https://api.wellfindacademic.com).
export const API_BASE_URL = (
  typeof window !== 'undefined' &&
  import.meta.env?.DEV &&
  (!configuredBaseUrl || configuredBaseUrl.includes('localhost') || configuredBaseUrl.includes('127.0.0.1'))
)
  ? ''
  : (configuredBaseUrl || '');

const TOKEN_KEY = 'wellfind_admin_token';
const USER_KEY = 'wellfind_admin_user';

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function getAuthUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(token, user) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // ignore local storage errors
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

/**
 * Universal authenticated fetch with JSON parsing and standardized errors.
 */
export async function apiRequest(endpoint, options = {}) {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${normalizedEndpoint}`;
  const token = getAuthToken();

  const headers = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    const targetDesc = API_BASE_URL || 'the backend proxy (http://localhost:3005)';
    const error = new Error(
      `Cannot connect to backend server at ${targetDesc}. Ensure Payload CMS is running.`
    );
    error.isNetworkError = true;
    error.originalError = networkError;
    throw error;
  }

  // Handle errors
  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // response might be non-JSON
    }

    const message =
      errorData?.error ||
      errorData?.message ||
      (Array.isArray(errorData?.errors) && errorData.errors[0]?.message) ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = errorData;

    // Handle token expiry / invalidation
    if (response.status === 401) {
      error.isUnauthorized = true;
      clearAuthSession();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    } else if (response.status === 403) {
      error.isForbidden = true;
    }

    throw error;
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch a private document blob securely using the admin JWT.
 */
export async function fetchPrivateDocumentBlob(pathOrUrl) {
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE_URL}${normalizedPath}`;
  const token = getAuthToken();

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    let errorMsg = `Failed to load document (${response.status} ${response.statusText})`;
    if (response.status === 401 || response.status === 403) {
      errorMsg = 'Super admin access required to view this private KYC document.';
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  return response.blob();
}

/**
 * Admin Login Helper
 */
export async function loginAdmin(email, password) {
  const res = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (res?.token) {
    setAuthSession(res.token, res.user);
  }

  return res;
}

/**
 * Admin Logout Helper
 */
export async function logoutAdmin() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  } finally {
    clearAuthSession();
  }
}

/**
 * Get current authenticated user profile
 */
export async function getCurrentUser() {
  return await apiRequest('/api/auth/me', { method: 'GET' });
}

