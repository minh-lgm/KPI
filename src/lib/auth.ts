import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kpi-tracker-secret-key-2024'
);

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
}

export function canEditKPI(user: UserPayload, department?: string): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'manager' && department === user.department) return true;
  return false;
}

export function canViewAllKPI(user: UserPayload): boolean {
  return user.role === 'admin' || user.role === 'manager';
}
