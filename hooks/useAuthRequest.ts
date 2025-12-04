import { useState, useCallback } from 'react';
import { requestService } from '@/services/RequestService';
import { RequestOptions, ApiResponse } from '@/interfaces';

/**
 * Base hook for authenticated requests
 * Provides loading state, error handling, and request execution
 */
export function useAuthRequest<T = unknown, V = unknown>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (
      endpoint: string,
      options: RequestOptions & { body?: V } = {}
    ): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);

      try {
        const response = await requestService.request<T>(endpoint, {
          ...options,
          requiresAuth: true,
        });

        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError(response.error || 'Request failed');
        }

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset,
  };
}

/**
 * Hook for unauthenticated requests
 */
export function useRequest<T = unknown, V = unknown>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (
      endpoint: string,
      options: RequestOptions & { body?: V } = {}
    ): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);

      try {
        const response = await requestService.request<T>(endpoint, {
          ...options,
          requiresAuth: false,
        });

        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError(response.error || 'Request failed');
        }

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset,
  };
}
