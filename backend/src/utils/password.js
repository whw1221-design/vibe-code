import { randomBytes, scryptSync } from 'node:crypto';

const KEY_LENGTH = 64;

/**
 * Hashes a password with a per-password random salt using scrypt.
 * The salt is stored alongside the hash: scrypt:<salt>:<hash>
 */
export function hashPassword(plainPassword) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plainPassword, salt, KEY_LENGTH).toString('hex');
  return `scrypt:${salt}:${hash}`;
}
