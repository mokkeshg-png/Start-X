import { User, UserRole } from '../types';
import { clientStorage } from '../storage/clientStorage';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  department: string;
  password?: string;
  year?: string;
  bio?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

const TOKEN_KEY = 'startx_auth_token';

class AuthService {
  private getBaseUrl(): string {
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, '');
    }
    // Default fallback to standard API path
    return '/api';
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Error saving auth token:', e);
    }
  }

  getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Real backend user authentication
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const baseUrl = this.getBaseUrl();
    const cleanEmail = credentials.email.trim().toLowerCase();
    const password = credentials.password || '';

    try {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: cleanEmail,
          password
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg =
          data?.message ||
          data?.error ||
          (response.status === 401
            ? 'Invalid credentials. Please check your email and password.'
            : response.status === 403
            ? 'Your account is unauthorized. Please contact your college administrator.'
            : response.status === 404
            ? 'Account not found. Please register or verify with college admin.'
            : `Authentication failed (${response.status})`);
        throw new Error(errorMsg);
      }

      // Format response according to backend contract
      const user: User = data?.user || data?.data?.user || data?.data || data;
      const token: string | undefined = data?.token || data?.data?.token || data?.accessToken;

      if (!user || !user.id || !user.role) {
        throw new Error('Malformed authentication response from server.');
      }

      if (token) {
        this.setToken(token);
      }
      clientStorage.saveCurrentUser(user);

      return {
        user,
        token,
        message: data?.message
      };
    } catch (err: any) {
      // If network failure / connection refused
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Unable to connect to the authentication server. Please ensure the backend is running.');
      }
      throw err;
    }
  }

  /**
   * Real backend user registration
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const baseUrl = this.getBaseUrl();
    const cleanEmail = payload.email.trim().toLowerCase();

    try {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          email: cleanEmail
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg =
          data?.message ||
          data?.error ||
          (response.status === 409
            ? 'An account with this email address already exists.'
            : response.status === 403
            ? 'This email is not approved by an administrator. Please contact your college admin.'
            : `Registration failed (${response.status})`);
        throw new Error(errorMsg);
      }

      const user: User = data?.user || data?.data?.user || data?.data || data;
      const token: string | undefined = data?.token || data?.data?.token || data?.accessToken;

      if (!user || !user.id || !user.role) {
        throw new Error('Malformed registration response from server.');
      }

      if (token) {
        this.setToken(token);
      }
      clientStorage.saveCurrentUser(user);

      return {
        user,
        token,
        message: data?.message
      };
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Unable to connect to the authentication server. Please ensure the backend is running.');
      }
      throw err;
    }
  }

  /**
   * Session verification & current user profile retrieval
   */
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    const savedUser = clientStorage.getCurrentUser();

    if (!token && !savedUser) {
      return null;
    }

    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (response.status === 401 || response.status === 403) {
        // Session expired or invalid
        this.setToken(null);
        clientStorage.saveCurrentUser(null);
        return null;
      }

      if (response.ok) {
        const data = await response.json().catch(() => null);
        const user: User = data?.user || data?.data?.user || data?.data || data;
        if (user && user.id && user.role) {
          clientStorage.saveCurrentUser(user);
          return user;
        }
      }

      // If /auth/me isn't returning 200 or isn't reached, retain valid saved session if present
      return savedUser || null;
    } catch {
      // Network hiccup — retain local cached profile if user is already logged in
      return savedUser || null;
    }
  }

  /**
   * Real backend user logout
   */
  async logout(): Promise<void> {
    const baseUrl = this.getBaseUrl();
    const token = this.getToken();

    if (token) {
      try {
        await fetch(`${baseUrl}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders()
        }).catch(() => {
          // Ignore network errors during logout
        });
      } catch {
        // Ignore network errors
      }
    }

    this.setToken(null);
    clientStorage.saveCurrentUser(null);
  }
}

export const authService = new AuthService();
