import type { ProjectData, Update as ProjectUpdate } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

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
  customDomain?: string;
}

class ApiService {
  private async attemptTokenRefresh(): Promise<boolean> {
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

      const response = await this.refreshToken();
      
      if (response.success && response.data) {
        this.saveTokens(response.data.tokens);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth = false
  ): Promise<ApiResponse<T>> {
    const apiBase = API_BASE || 'https://api.devlogr.space';
    const url = `${apiBase}/api${endpoint}`;
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }  
    if (!skipAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      if (!skipAuth && response.status === 401 && (data.code === 'TOKEN_EXPIRED' || data.code === 'INVALID_ACCESS_TOKEN')) {
        const refreshSuccess = await this.attemptTokenRefresh();
        
        if (refreshSuccess) {
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

    if (!response.success && response.code === 'INVALID_REFRESH_TOKEN') {
      this.clearTokens();
    }

    return response;
  }

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
    }, true);
  }

  async getDomainVerificationStatus(projectId: string): Promise<ApiResponse<{ 
    customDomain: string | null; 
    domainVerified: boolean; 
    sslEnabled: boolean; 
    hasCustomDomain: boolean;
    verificationDetails: {
      dnsResolved: boolean;
      pointsToProxy: boolean;
      hasCloudflare: boolean;
      sslAvailable: boolean;
      lastChecked: string;
    } | null;
    instructions: Array<{
      type: 'CNAME' | 'A_RECORD';
      name: string;
      value: string;
      ttl: number;
      description: string;
    }> | null;
    publicUrl: string;
  }>> {
    return this.makeRequest(`/projects/${projectId}?action=domain-status`);
  }

  async verifyProjectDomain(projectId: string): Promise<ApiResponse<{
    verified: boolean;
    message: string;
    status: 'verified' | 'pending' | 'failed' | 'invalid';
    details: {
      dnsResolved: boolean;
      pointsToProxy: boolean;
      hasCloudflare: boolean;
      sslAvailable: boolean;
      lastChecked: string;
    };
    instructions?: Array<{
      type: 'CNAME' | 'A_RECORD';
      name: string;
      value: string;
      ttl: number;
      description: string;
    }>;
  }>> {
    return this.makeRequest(`/projects/${projectId}?action=verify-domain`, {
      method: 'POST',
    });
  }

  async checkDomainAvailability(domain: string): Promise<ApiResponse<{
    available: boolean;
    domain?: string;
    reason?: string;
    suggestions?: string[];
    currentStatus?: 'verified' | 'pending' | 'failed' | 'invalid';
    message?: string;
    requiresSetup?: boolean;
    instructions?: Array<{
      type: 'CNAME' | 'A_RECORD';
      name: string;
      value: string;
      ttl: number;
      description: string;
    }>;
  }>> {
    return this.makeRequest(`/projects?action=check-domain&domain=${encodeURIComponent(domain)}`, {
      method: 'GET',
    }, true);
  }

  async getPublicProject(identifier: string, type: 'slug' | 'domain'): Promise<ApiResponse<{
    id: string;
    title: string;
    description: string | null;
    slug: string;
    progress: number;
    banner: string | null;
    status: string;
    allowIssues: boolean;
    allowFeedback: boolean;
    customDomain: string | null;
    domainVerified: boolean;
    startDate: string;
    endDate: string | null;
    user: {
      name: string;
      username: string | null;
      avatar: string | null;
    };
    tags: Array<{ tag: { name: string } }>;
    updates: Array<{
      id: string;
      title: string;
      content: string;
      type: string;
      images: string[];
      createdAt: string;
    }>;
    milestones: Array<{
      id: string;
      title: string;
      description: string | null;
      dueDate: string | null;
      completedAt: string | null;
      progress: number;
    }>;
    feedback: Array<{
      id: string;
      message: string;
      rating: number | null;
      category: string;
      submitterName: string | null;
      createdAt: string;
    }>;
  }>> {
    const param = type === 'slug' ? `slug=${encodeURIComponent(identifier)}` : `domain=${encodeURIComponent(identifier)}`;
    return this.makeRequest(`/public?action=project&${param}`, {
      method: 'GET',
    }, true);
  }

  async getRecentUpdates(limit: number): Promise<ApiResponse<ProjectUpdate[]>> {
    return this.makeRequest(`/updates?action=recent&limit=${limit}`);
  }

  async updateProfile(profileData: {
    name: string;
    username: string;
    email: string;
    bio: string;
    location: string;
    website: string;
  }): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/users?action=update-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async deleteAccount(): Promise<ApiResponse> {
    return this.makeRequest('/users?action=delete-account', {
      method: 'DELETE',
    });
  }

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
    return Date.now() > (parseInt(expiry) - 5 * 60 * 1000);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !this.isTokenExpired();
  }

  getTokenTimeLeft(): number {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return 0;
    return Math.max(0, Math.floor((parseInt(expiry) - Date.now()) / (60 * 1000)));
  }
  async getApiKey(): Promise<string> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }
    
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

export const domainUtils = {
  getDomainInfo(): { 
    type: 'main' | 'subdomain' | 'custom';
    slug?: string;
    customDomain?: string;
  } {
    if (typeof window === 'undefined') {
      return { type: 'main' };
    }

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.0.0.1') || hostname.endsWith('.localhost');
    
    if (isLocalhost) {
      if (hostname.includes('.localhost')) {
        const slug = hostname.split('.localhost')[0];
        return { type: 'subdomain', slug };
      }
      return { type: 'main' };
    }

    if (hostname === 'devlogr.space' || hostname === 'www.devlogr.space') {
      return { type: 'main' };
    }

    if (hostname.endsWith('.devlogr.space')) {
      const slug = hostname.replace('.devlogr.space', '');
      if (slug === 'api' || slug === 'proxy' || slug === 'www') {
        return { type: 'main' };
      }
      return { type: 'subdomain', slug };
    }

    return { type: 'custom', customDomain: hostname };
  },

  shouldShowPublicProject(): boolean {
    const { type } = this.getDomainInfo();
    return type === 'subdomain' || type === 'custom';
  },

  getProjectIdentifier(): string | null {
    const { type, slug, customDomain } = this.getDomainInfo();
    if (type === 'subdomain') return slug || null;
    if (type === 'custom') return customDomain || null;
    return null;
  }
}; 