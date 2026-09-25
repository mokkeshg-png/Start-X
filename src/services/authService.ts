import { User, UserRole } from '../types';
import { clientStorage } from '../storage/clientStorage';
import { supabase } from '../lib/supabase';

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

  private mapSupabaseUser(sbUser: any): User {
    const meta = sbUser.user_metadata || {};
    const appMeta = sbUser.app_metadata || {};
    return {
      id: sbUser.id,
      email: sbUser.email,
      name: meta.name || sbUser.email.split('@')[0],
      role: (appMeta.role || meta.role || 'STUDENT').toUpperCase() as UserRole,
      department: meta.department || '',
      year: meta.year || '',
      bio: meta.bio || '',
      avatar: meta.avatar || '',
      skills: meta.skills || [],
      github: meta.github,
      linkedin: meta.linkedin,
      createdAt: sbUser.created_at || new Date().toISOString()
    };
  }

  /**
   * Supabase user authentication
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const cleanEmail = credentials.email.trim().toLowerCase();
    const password = credentials.password || '';

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Malformed authentication response from server.');
    }

    const token = data.session.access_token;
    const user = this.mapSupabaseUser(data.user);

    this.setToken(token);
    clientStorage.saveCurrentUser(user);

    return {
      user,
      token,
      message: 'Login successful'
    };
  }

  /**
   * Supabase user registration
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const password = payload.password || '';

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: payload.name,
          department: payload.department,
          year: payload.year,
          bio: payload.bio,
          skills: payload.skills,
          github: payload.github,
          linkedin: payload.linkedin,
          role: 'STUDENT'
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed.');
    }

    // Supabase returns session as null if email confirmation is required
    const token = data.session?.access_token || undefined;
    const user = this.mapSupabaseUser(data.user);

    if (token) {
      this.setToken(token);
      clientStorage.saveCurrentUser(user);
    }

    return {
      user,
      token,
      message: token ? 'Registration successful' : 'Please check your email to verify your account.'
    };
  }

  /**
   * Session verification & current user profile retrieval
   */
  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      this.setToken(null);
      clientStorage.saveCurrentUser(null);
      return null;
    }

    const token = data.session.access_token;
    const user = this.mapSupabaseUser(data.session.user);

    this.setToken(token);
    clientStorage.saveCurrentUser(user);

    return user;
  }

  /**
   * Supabase user logout
   */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.setToken(null);
    clientStorage.saveCurrentUser(null);
  }
}

export const authService = new AuthService();
