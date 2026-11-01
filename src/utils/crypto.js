import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Use a 32-byte secret key for AES-256 (from env, strictly enforced in production)
let rawKey = process.env.MEDICAL_ENCRYPTION_KEY;
if (!rawKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("FATAL: MEDICAL_ENCRYPTION_KEY environment variable is not defined in production");
  }
  // In development/test: generate an ephemeral secure key per process if not supplied
  rawKey = crypto.randomBytes(32).toString('hex');
}
const ENCRYPTION_KEY = rawKey;
// Ensure it's exactly 32 bytes for AES-256
const normalizedKey = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
const GCM_ALGORITHM = 'aes-256-gcm';
const CBC_ALGORITHM = 'aes-256-cbc';
const GCM_IV_LENGTH = 12;

/**
 * Encrypts a JSON object into an authenticated AES-256-GCM encrypted string (S4-9).
 * Format: iv_hex:auth_tag_hex:ciphertext_hex
 * @param {Object} data - The medical/intake data to encrypt.
 * @returns {string} - The colon-separated iv, auth tag, and encrypted payload (hex).
 */
export function encryptMedicalData(data) {
  if (!data) return null;
  try {
    const text = JSON.stringify(data);
    const iv = crypto.randomBytes(GCM_IV_LENGTH);
    const cipher = crypto.createCipheriv(GCM_ALGORITHM, normalizedKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('فشل في تشفير البيانات الطبية.');
  }
}

/**
 * Decrypts an AES-256 encrypted string back to a JSON object.
 * Supports modern authenticated AES-256-GCM (3 parts) and legacy AES-256-CBC (2 parts).
 * @param {string} encryptedText - The string containing iv and payload.
 * @returns {Object} - The decrypted original data.
 */
export function decryptMedicalData(encryptedText) {
  if (!encryptedText) return null;
  // If the text doesn't look like our encrypted format, it might be legacy unencrypted data.
  if (typeof encryptedText === 'object') return encryptedText; 
  if (!encryptedText.includes(':')) {
    try {
      return JSON.parse(encryptedText); // Fallback for legacy plain JSON
    } catch {
      return encryptedText; 
    }
  }

  try {
    const textParts = encryptedText.split(':');
    if (textParts.length === 3) {
      // Modern Authenticated AES-256-GCM: iv:tag:ciphertext
      const iv = Buffer.from(textParts[0], 'hex');
      const tag = Buffer.from(textParts[1], 'hex');
      const encryptedData = Buffer.from(textParts[2], 'hex');
      const decipher = crypto.createDecipheriv(GCM_ALGORITHM, normalizedKey, iv);
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(encryptedData, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } else if (textParts.length === 2) {
      // Legacy AES-256-CBC backwards compatibility: iv:ciphertext
      const iv = Buffer.from(textParts[0], 'hex');
      const encryptedData = Buffer.from(textParts[1], 'hex');
      const decipher = crypto.createDecipheriv(CBC_ALGORITHM, normalizedKey, iv);
      let decrypted = decipher.update(encryptedData, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } else {
      throw new Error('Invalid encrypted payload structure');
    }
  } catch (err) {
    console.error('Decryption failed:', err.message);
    throw new Error('فشل في فك تشفير البيانات الطبية: ' + err.message);
  }
}
