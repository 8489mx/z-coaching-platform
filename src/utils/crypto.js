import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Use a 32-byte secret key for AES-256 (from env, or fallback for dev)
const ENCRYPTION_KEY = process.env.MEDICAL_ENCRYPTION_KEY || 'super_secret_medical_key_32_bytes'; 
// Ensure it's exactly 32 bytes for aes-256-cbc
const normalizedKey = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypts a JSON object into an AES-256 encrypted string.
 * @param {Object} data - The medical/intake data to encrypt.
 * @returns {string} - The iv and encrypted payload concatenated (hex).
 */
export function encryptMedicalData(data) {
  if (!data) return null;
  try {
    const text = JSON.stringify(data);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, normalizedKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('فشل في تشفير البيانات الطبية.');
  }
}

/**
 * Decrypts an AES-256 encrypted string back to a JSON object.
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
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedData = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, normalizedKey, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('فشل في فك تشفير البيانات الطبية.');
  }
}
