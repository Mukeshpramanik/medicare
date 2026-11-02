import { localStorageAdapter } from '@/lib/storage/local-storage.adapter';
import { STORAGE_KEYS } from '@/lib/storage/storage.keys';
import { User, UserRole, PatientProfile } from '@/types';
import { generateId } from '@/lib/utils';
import { addActivityLog } from '@/features/admin/admin.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export class AuthService {
  static getUsers(): User[] {
    return localStorageAdapter.getItem<User[]>(STORAGE_KEYS.USERS, []);
  }

  static findUserByEmail(email: string): User | undefined {
    const users = this.getUsers();
    return users.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  }

  static findUserById(id: string): User | undefined {
    const users = this.getUsers();
    return users.find((u) => u.id === id);
  }

  static getCurrentSession(): AuthSession | null {
    return localStorageAdapter.getItem<AuthSession | null>(STORAGE_KEYS.SESSION, null);
  }

  static getCurrentUser(): User | null {
    const session = this.getCurrentSession();
    if (!session) return null;
    // Reload user from storage to pick up updated profile
    const freshUser = this.findUserById(session.user.id);
    return freshUser || session.user;
  }

  static login(credentials: LoginCredentials): { success: boolean; user?: User; error?: string } {
    const cleanEmail = credentials.email.trim().toLowerCase();
    const user = this.findUserByEmail(cleanEmail);

    if (!user) {
      return { success: false, error: 'No account found with this email address.' };
    }

    // Demo password verification (Explicitly marked as demo comparison)
    if (user.demoPasswordHash && user.demoPasswordHash !== credentials.password) {
      return { success: false, error: 'Invalid password. Check demo credentials.' };
    }

    const session: AuthSession = {
      user,
      token: `demo_jwt_${generateId()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    localStorageAdapter.setItem(STORAGE_KEYS.SESSION, session);

    addActivityLog({
      userId: user.id,
      userName: user.name,
      action: 'USER_LOGIN',
      details: `User logged in with role: ${user.role}`,
      entityType: 'USER',
      entityId: user.id,
    });

    return { success: true, user };
  }

  static register(data: RegisterData): { success: boolean; user?: User; error?: string } {
    const cleanEmail = data.email.trim().toLowerCase();

    if (!data.name || !data.email || !data.password) {
      return { success: false, error: 'Name, email, and password are required.' };
    }

    if (data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const existing = this.findUserByEmail(cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const role: UserRole = data.role || 'PATIENT';
    const newPatientProfile: PatientProfile | undefined =
      role === 'PATIENT'
        ? {
            addresses: [
              {
                id: generateId('addr'),
                fullName: data.name,
                phone: data.phone || '+91 98000 00000',
                addressLine1: 'Main Residency',
                city: 'Bengaluru',
                state: 'Karnataka',
                postalCode: '560001',
                isDefault: true,
              },
            ],
          }
        : undefined;

    const newUser: User = {
      id: generateId('usr'),
      email: cleanEmail,
      name: data.name.trim(),
      role,
      phone: data.phone?.trim(),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString(),
      demoPasswordHash: data.password,
      patientProfile: newPatientProfile,
    };

    const users = this.getUsers();
    users.push(newUser);
    localStorageAdapter.setItem(STORAGE_KEYS.USERS, users);

    // Auto login
    const session: AuthSession = {
      user: newUser,
      token: `demo_jwt_${generateId()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    localStorageAdapter.setItem(STORAGE_KEYS.SESSION, session);

    addActivityLog({
      userId: newUser.id,
      userName: newUser.name,
      action: 'USER_REGISTERED',
      details: `New account registered as ${role}`,
      entityType: 'USER',
      entityId: newUser.id,
    });

    return { success: true, user: newUser };
  }

  static logout(): void {
    const user = this.getCurrentUser();
    if (user) {
      addActivityLog({
        userId: user.id,
        userName: user.name,
        action: 'USER_LOGOUT',
        details: 'User logged out',
        entityType: 'USER',
        entityId: user.id,
      });
    }
    localStorageAdapter.removeItem(STORAGE_KEYS.SESSION);
  }

  static updateUserProfile(userId: string, updates: Partial<User>): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      return { success: false, error: 'User not found' };
    }

    const updated = { ...users[index], ...updates };
    users[index] = updated;
    localStorageAdapter.setItem(STORAGE_KEYS.USERS, users);

    // Update active session if it matches
    const session = this.getCurrentSession();
    if (session && session.user.id === userId) {
      session.user = updated;
      localStorageAdapter.setItem(STORAGE_KEYS.SESSION, session);
    }

    return { success: true, user: updated };
  }
}
