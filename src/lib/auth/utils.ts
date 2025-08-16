import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

export function generateLoginCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export function generateServiceQueueId(): string {
  const prefix = 'SQ';
  const timestamp = Date.now().toString().slice(-6);
  const random = randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, process.env.JWT_SECRET!);
}