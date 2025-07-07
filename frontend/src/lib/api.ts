import type { ProjectData, Update as ProjectUpdate } from '@/types';

// The API base is now the Next.js server itself, which will proxy to the backend.
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Token refresh promise to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<boolean> | null = null;

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: string;
  status: string;
  avatar?: string;
  createdAt: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  username?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface CreateProjectData {
  name: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  tags?: string[];
  allowIssues: boolean;
  allowFeedback: boolean;
}

class ApiService {
  // Automatic token refresh with debouncing
  private async attemptTokenRefresh(): Promise<boolean> {
    // If refresh is already in progress, wait for it
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = this.performTokenRefresh();
    const result = await refreshPromise;
    refreshPromise = null;
    return result;
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      console.log('🔄 Attempting automatic token refresh...');
      const response = await this.refreshToken();
      
      if (response.success && response.data) {
        this.saveTokens(response.data.tokens);
        console.log('✅ Token refreshed automatically');
        return true;
      }
      
      console.log('❌ Token refresh failed');
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth = false
  ): Promise<ApiResponse<T>> {
    // Always use the backend API URL - either from env var or default
    const apiBase = API_BASE || 'https://api.devlogr.eryxks.cloud';
    const url = `${apiBase}/api${endpoint}`;
    
    // Use the standard Headers object for type safety and correctness.
    const headers = new Headers(options.headers);

    // Set a default Content-Type if one isn't provided.
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Add the Authorization header to all authenticated requests.
    if (!skipAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers, // Use the safely constructed Headers object
      });

      const data = await response.json();
      
      // Handle token expiration for authenticated requests
      if (!skipAuth && response.status === 401 && (data.code === 'TOKEN_EXPIRED' || data.code === 'INVALID_ACCESS_TOKEN')) {
        console.log('🔄 Access token expired or invalid, attempting refresh...');
        const refreshSuccess = await this.attemptTokenRefresh();
        
        if (refreshSuccess) {
          // Retry original request with new token
          const newToken = this.getAccessToken();
          if (newToken) {
            const retryHeaders: Record<string, string> = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
            };
            
            const retryResponse = await fetch(url, {
              ...options,
              headers: retryHeaders,
            });
            
            return retryResponse.json();
          }
        }
        
        // Refresh failed, redirect to login will be handled by calling component
        this.clearTokens();
      }
      
      if (!response.ok) {
        console.error(`API Error ${response.status}:`, data);
        return {
          success: false,
          message: data.message || 'An error occurred',
          error: data.error,
          code: data.code,
        };
      }

      return data;
    } catch (error) {
      console.error('Network error:', error);
      return {
        success: false,
        message: 'Network error occurred',
        error: 'NETWORK_ERROR',
      };
    }
  }

  // Auth methods - Updated to use new consolidated backend structure
  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return this.makeRequest<{ user: User; tokens: AuthTokens }>('/auth?action=register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, true);
  }

  async login(credentials: LoginData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return this.makeRequest<{ user: User; tokens: AuthTokens }>('/auth?action=login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, true);
  }

  async logout(): Promise<ApiResponse> {
    return this.makeRequest('/auth?action=logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const token = this.getAccessToken();
    if (!token) {
      return {
        success: false,
        message: 'No access token found',
        error: 'NO_TOKEN',
      };
    }

    return this.makeRequest<User>('/auth?action=me');
  }

  async refreshToken(): Promise<ApiResponse<{ tokens: AuthTokens }>> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return {
        success: false,
        message: 'No refresh token found',
        error: 'NO_REFRESH_TOKEN',
      };
    }

    const response = await this.makeRequest<{ tokens: AuthTokens }>('/auth?action=refresh-token', {
      method: 'POST',
      body: JSON.stringify({ token: refreshToken }),
    }, true);

    // If refresh token is invalid, clear all tokens
    if (!response.success && response.code === 'INVALID_REFRESH_TOKEN') {
      this.clearTokens();
    }

    return response;
  }

  // Project methods - Updated to use new consolidated backend structure
  async getProjects(): Promise<ApiResponse<ProjectData[]>> {
    return this.makeRequest('/projects');
  }

  async createProject(projectData: CreateProjectData): Promise<ApiResponse<ProjectData>> {
    return this.makeRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
    });
  }

  async checkSlugAvailability(slug: string): Promise<ApiResponse<{ available: boolean }>> {
    return this.makeRequest(`/projects?action=check-slug&slug=${encodeURIComponent(slug)}`, {
        method: 'GET',
    }, true); // This is a public endpoint, so skip auth
  }

  // Update methods - Updated to use new consolidated backend structure
  async getRecentUpdates(limit: number): Promise<ApiResponse<ProjectUpdate[]>> {
    return this.makeRequest(`/updates?action=recent&limit=${limit}`);
  }

  // Token management
  saveTokens(tokens: AuthTokens): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('tokenExpiry', (Date.now() + tokens.expiresIn * 1000).toString());
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
  }

  isTokenExpired(): boolean {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return true;
    // Add 5-minute buffer to refresh tokens before they expire
    return Date.now() > (parseInt(expiry) - 5 * 60 * 1000);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !this.isTokenExpired();
  }

  // Get time until token expires in minutes
  getTokenTimeLeft(): number {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return 0;
    return Math.max(0, Math.floor((parseInt(expiry) - Date.now()) / (60 * 1000)));
  }

  // Get API key for authenticated requests (returns access token)
  async getApiKey(): Promise<string> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }
    
    // Check if token is expired and try to refresh
    if (this.isTokenExpired()) {
      const refreshSuccess = await this.attemptTokenRefresh();
      if (refreshSuccess) {
        const newToken = this.getAccessToken();
        if (!newToken) {
          throw new Error('Failed to refresh token');
        }
        return newToken;
      } else {
        throw new Error('Token expired and refresh failed');
      }
    }
    
    return token;
  }
}

export const api = new ApiService();
export type { User, AuthTokens, RegisterData, LoginData, ApiResponse, CreateProjectData }; 