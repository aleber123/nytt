/**
 * Authenticated Admin Fetch Helper
 * 
 * Wraps fetch() to automatically include the Firebase ID token
 * in the Authorization header for admin API requests.
 */

import { getFirebaseAuth } from '@/firebase/config';

/**
 * Get the current user's Firebase ID token.
 * Returns null if no user is signed in.
 */
async function getIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return null;
  
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Fetch wrapper that adds the Firebase ID token to the Authorization header.
 * Use this for all admin API calls.
 */
export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getIdToken();
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Default to JSON content type for POST requests
  if (options.method === 'POST' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
