import { HttpError } from './http.js';

export function hasField(body, field) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

export function parseId(value, name = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, `${name} must be a positive integer.`, { field: name });
  }
  return id;
}

export function ensureString(value, field, { min = 1, max = 255 } = {}) {
  if (value === undefined || value === null) {
    throw new HttpError(400, `${field} is required.`, { field });
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} must be a string.`, { field });
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new HttpError(400, `${field} must be at least ${min} character(s).`, { field });
  }
  if (trimmed.length > max) {
    throw new HttpError(400, `${field} must be at most ${max} characters.`, { field });
  }
  return trimmed;
}

export function ensureNumber(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === null || value === '') {
    throw new HttpError(400, `${field} is required.`, { field });
  }
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new HttpError(400, `${field} must be a valid number.`, { field });
  }
  if (number < min || number > max) {
    throw new HttpError(400, `${field} must be between ${min} and ${max}.`, { field });
  }
  return number;
}

export function ensureInteger(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = ensureNumber(value, field, { min, max });
  if (!Number.isInteger(number)) {
    throw new HttpError(400, `${field} must be a whole number.`, { field });
  }
  return number;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ensureEmail(value, field = 'email') {
  const email = ensureString(value, field, { max: 254 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new HttpError(400, `${field} must be a valid email address.`, { field });
  }
  return email;
}

export function ensureDate(value, field = 'order_date') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${field} must be a valid date.`, { field });
  }
  return date.toISOString();
}

/**
 * Throws when a PATCH/PUT body contains no supported fields.
 */
export function ensureAtLeastOneField(body, fields) {
  if (!fields.some((field) => hasField(body, field))) {
    throw new HttpError(400, `Provide at least one of: ${fields.join(', ')}.`);
  }
}
