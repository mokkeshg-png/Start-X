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
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

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

  /**
   * Map a Supabase Auth user + backend UserDto into the frontend User type.
   * Prioritises backend data (authoritative role) over JWT metadata.
   */
  private mapBackendUser(backendDto: Record<string, unknown>): User {
    const role = ((backendDto.role as string) || 'STUDENT').toUpperCase() as UserRole;
    return {
      id:             (backendDto.id as string)          || '',
      email:          (backendDto.email as string)        || '',
      name:           (backendDto.name as string)         || '',
      role,
      department:     (backendDto.department as string)   || '',
      year:           (backendDto.year as string)         || '',
      bio:            (backendDto.bio as string)          || '',
      avatar:         (backendDto.avatar as string)       || '',
      skills:         (backendDto.skills as string[])     || [],
      github:         (backendDto.github as string)       || undefined,
      linkedin:       (backendDto.linkedin as string)     || undefined,
      studentId:      (backendDto.studentId as string)    || undefined,
      profileComplete:(backendDto.profileComplete as boolean) || false,
      createdAt:      (backendDto.createdAt as string)    || new Date().toISOString()
    };
  }

  /**
   * Fallback: map a Supabase Auth user to a minimal frontend User.
   * Used only when the backend is unreachable.
   */
  private mapSupabaseUser(sbUser: Record<string, unknown>): User {
    const meta    = (sbUser.user_metadata as Record<string, unknown>) || {};
    const appMeta = (sbUser.app_metadata  as Record<string, unknown>) || {};
    return {
      id:         sbUser.id as string,
      email:      sbUser.email as string,
      name:       (meta.name as string) || (sbUser.email as string).split('@')[0],
      role:       ((appMeta.role || meta.role || 'STUDENT') as string).toUpperCase() as UserRole,
      department: (meta.department as string) || '',
      year:       (meta.year as string) || '',
      bio:        (meta.bio as string) || '',
      avatar:     (meta.avatar as string) || '',
      skills:     (meta.skills as string[]) || [],
      github:     (meta.github as string) || undefined,
      linkedin:   (meta.linkedin as string) || undefined,
      createdAt:  (sbUser.created_at as string) || new Date().toISOString()
    };
  }

  /**
   * Call the backend /api/v1/auth/me with the current Supabase JWT.
   *
   * Returns the backend-resolved UserDto on success.
   * Throws an error with a clear message on 403 (not authorized by admin).
   * Returns null if the backend is unreachable (graceful degradation).
   */
  private async callBackendMe(token: string): Promise<User | null> {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (resp.status === 401) {
        return null;
      }

      if (resp.status === 403) {
        const body = await resp.json().catch(() => ({}));
        const msg  = body?.message || 'Your email is not authorized by your college administrator.';
        throw new Error(msg);
      }

      if (!resp.ok) {
        console.warn(`Backend /me returned ${resp.status} — falling back to Supabase user`);
        return null;
      }

      const body = await resp.json();
      if (body?.success && body?.data) {
        return this.mapBackendUser(body.data as Record<string, unknown>);
      }
      return null;
    } catch (err) {
      // Re-throw authorization errors so the UI can show a clear message
      if (err instanceof Error && err.message.includes('authorized')) {
        throw err;
      }
      console.warn('Backend /api/v1/auth/me unreachable:', err);
      return null;
    }
  }

  /**
   * Sign in with Supabase, then verify + provision via backend /api/v1/auth/me.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const cleanEmail = credentials.email.trim().toLowerCase();
    const password   = credentials.password || '';

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error) throw new Error(error.message);
    if (!data.user || !data.session) {
      throw new Error('Malformed authentication response from server.');
    }

    const token = data.session.access_token;
    this.setToken(token);

    // Try backend first (authoritative role + provisioning)
    const backendUser = await this.callBackendMe(token);
    if (backendUser) {
      clientStorage.saveCurrentUser(backendUser);
      return { user: backendUser, token, message: 'Login successful' };
    }

    // Fallback: use Supabase user (e.g. backend offline during dev)
    const user = this.mapSupabaseUser(data.user as unknown as Record<string, unknown>);
    clientStorage.saveCurrentUser(user);
    return { user, token, message: 'Login successful' };
  }

  /**
   * Register via Supabase, then verify authorization via backend.
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const password   = payload.password || '';

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name:       payload.name,
          department: payload.department,
          year:       payload.year,
          bio:        payload.bio,
          skills:     payload.skills,
          github:     payload.github,
          linkedin:   payload.linkedin
          // Note: role is intentionally NOT set here.
          // The backend resolves role from authorized_emails after first login.
        }
      }
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed.');

    const token = data.session?.access_token;

    if (token) {
      this.setToken(token);
      // Backend resolves role + provisions user record
      const backendUser = await this.callBackendMe(token);
      if (backendUser) {
        clientStorage.saveCurrentUser(backendUser);
        return { user: backendUser, token, message: 'Registration successful' };
      }
    }

    // No session yet (email confirmation required) — return minimal Supabase user
    const user = this.mapSupabaseUser(data.user as unknown as Record<string, unknown>);
    if (token) clientStorage.saveCurrentUser(user);

    return {
      user,
      token,
      message: token
        ? 'Registration successful'
        : 'Please check your email to verify your account.'
    };
  }

  /**
   * Restore session on page load.
   * Calls /api/v1/auth/me to get the authoritative backend user (with role).
   */
  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      this.setToken(null);
      clientStorage.saveCurrentUser(null);
      return null;
    }

    const token = data.session.access_token;
    this.setToken(token);

    // Authoritative check via backend
    try {
      const backendUser = await this.callBackendMe(token);
      if (backendUser) {
        clientStorage.saveCurrentUser(backendUser);
        return backendUser;
      }
    } catch (err) {
      // 403 = not authorized → clear session
      if (err instanceof Error && err.message.includes('authorized')) {
        console.warn('User not authorized:', err.message);
        this.setToken(null);
        clientStorage.saveCurrentUser(null);
        return null;
      }
    }

    // Fallback: use Supabase session user
    const user = this.mapSupabaseUser(
      data.session.user as unknown as Record<string, unknown>
    );
    clientStorage.saveCurrentUser(user);
    return user;
  }

  /**
   * Sign out.
   */
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.setToken(null);
    clientStorage.saveCurrentUser(null);
  }
}

export const authService = new AuthService();
