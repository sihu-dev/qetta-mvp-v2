'use client';

/**
 * API Client
 * Authenticated fetch wrapper for API calls
 */

import { supabase } from '@/lib/supabase/client';

export interface APIError {
  message: string;
  code?: string;
  status?: number;
}

export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  success: boolean;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '';

/**
 * Build URL with query parameters
 */
function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, API_BASE_URL || window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Get authentication headers
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Continue without auth header
  }

  return headers;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<APIResponse<T>> {
  const { body, params, headers: customHeaders, ...fetchOptions } = options;

  try {
    const authHeaders = await getAuthHeaders();
    const url = buildUrl(path, params);

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...authHeaders,
        ...customHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get('content-type');
    let data: T | undefined;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: (data as { error?: string })?.error || response.statusText,
          status: response.status,
        },
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'POST', body }),

  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body }),

  delete: <T>(path: string) =>
    apiRequest<T>(path, { method: 'DELETE' }),
};

export default api;
