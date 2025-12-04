import { auth } from '@/app/config/firebase';
import { RequestOptions, ApiResponse } from '@/interfaces';
import { REQUEST_TIMEOUT } from '@/constants';

class RequestService {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication token from Firebase
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Make an HTTP request
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      requiresAuth = false,
      timeout = REQUEST_TIMEOUT,
    } = options;

    try {
      // Build headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      // Add authentication token if required
      if (requiresAuth) {
        const token = await this.getAuthToken();
        if (!token) {
          return {
            success: false,
            error: 'Authentication required. Please sign in.',
          };
        }
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      // Build request configuration
      const config: RequestInit = {
        method,
        headers: requestHeaders,
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const url = this.baseUrl + endpoint;
        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.error || data.message || `HTTP error ${response.status}`,
          };
        }

        return {
          success: true,
          data: data.data || data,
          message: data.message,
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout. Please try again.',
          };
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const requestService = new RequestService();
export default requestService;
