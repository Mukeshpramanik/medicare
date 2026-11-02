import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '@/features/auth/auth.service';
import { initializeSeedData, resetDemoData } from '@/data/seed';
import { DEMO_CREDENTIALS } from '@/data/seed/seed-data';

describe('AuthService & Role Restrictions', () => {
  beforeEach(() => {
    resetDemoData();
  });

  it('1. should login successfully with patient demo credentials', () => {
    const res = AuthService.login({
      email: DEMO_CREDENTIALS.patient.email,
      password: DEMO_CREDENTIALS.patient.password,
    });
    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('PATIENT');
    expect(res.user?.name).toBe('Ananya Verma');
  });

  it('1b. should login successfully with doctor demo credentials', () => {
    const res = AuthService.login({
      email: DEMO_CREDENTIALS.doctor.email,
      password: DEMO_CREDENTIALS.doctor.password,
    });
    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('DOCTOR');
    expect(res.user?.name).toBe('Dr. Rajesh Sharma');
  });

  it('1c. should login successfully with admin demo credentials', () => {
    const res = AuthService.login({
      email: DEMO_CREDENTIALS.admin.email,
      password: DEMO_CREDENTIALS.admin.password,
    });
    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('ADMIN');
  });

  it('2. should reject invalid credentials', () => {
    const res = AuthService.login({
      email: DEMO_CREDENTIALS.patient.email,
      password: 'WrongPassword123!',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid password');
  });

  it('2b. should reject registration with duplicate email', () => {
    const res = AuthService.register({
      name: 'Duplicate User',
      email: DEMO_CREDENTIALS.patient.email,
      password: 'SomePassword123!',
      role: 'PATIENT',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('already exists');
  });

  it('2c. should register a new patient successfully and persist session', () => {
    const res = AuthService.register({
      name: 'Rohan Deshmukh',
      email: 'rohan.new@example.com',
      password: 'Password123!',
      phone: '+91 99999 88888',
      role: 'PATIENT',
    });
    expect(res.success).toBe(true);
    expect(res.user?.email).toBe('rohan.new@example.com');
    expect(res.user?.role).toBe('PATIENT');

    // Check active session
    const currentUser = AuthService.getCurrentUser();
    expect(currentUser?.email).toBe('rohan.new@example.com');
  });
});
