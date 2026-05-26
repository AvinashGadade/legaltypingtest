import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export function jwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  return process.env.JWT_SECRET;
}

export function hashPassword(password) {
  return bcrypt.hashSync(String(password), 10);
}

export function comparePassword(password, hash) {
  if (!hash) return false;
  if (/^[a-f0-9]{64}$/i.test(hash)) return false;
  return bcrypt.compareSync(String(password), hash);
}

export function signToken(payload) {
  return jwt.sign(payload, jwtSecret(), { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret());
  } catch {
    return null;
  }
}

export function tokenFromRequest(req) {
  return req.headers.authorization?.replace('Bearer ', '') || '';
}
