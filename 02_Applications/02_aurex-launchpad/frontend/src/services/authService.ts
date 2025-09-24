import { apiClient } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  organization: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    organization?: string;
    role?: string;
    is_active: boolean;
    created_at: string;
  };
}

export interface User {
  id: number;
  email: string;
  organization?: string;
  role?: string;
  is_active: boolean;
  created_at: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await fetch(`${apiClient.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', userData);
  }

  async validateToken(): Promise<User> {
    return apiClient.get<User>('/auth/validate');
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return apiClient.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken });
  }

  async logout(): Promise<void> {
    return apiClient.post<void>('/auth/logout');
  }

  async resetPassword(email: string): Promise<void> {
    return apiClient.post<void>('/auth/reset-password', { email });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return apiClient.post<void>('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  // Token management
  storeTokens(authResponse: AuthResponse): void {
    localStorage.setItem('token', authResponse.access_token);
    localStorage.setItem('tokenType', authResponse.token_type);
  }

  clearTokens(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('refreshToken');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
export default authService;