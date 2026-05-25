import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const FALLBACK_SECRET = 'local-development-secret-change-in-production';

export function jwtSecret() {
  return process.env.JWT_SECRET || FALLBACK_SECRET;
}

export function hashPassword(password) {
  return bcrypt.hashSync(String(password), 10);
}

export function comparePassword(password, hash) {
  if (!hash) return false;
  if (/^[a-f0-9]{64}$/i.test(hash)) {
    // Legacy local SHA-256 hashes from early development are not accepted for production login.
    return false;
  }
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
