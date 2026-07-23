import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// The master key should be exactly 32 bytes (256 bits) for aes-256-gcm
// In a real app, this MUST come from environment variables.
const getMasterKey = (): Buffer => {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_MASTER_KEY must be set and exactly 32 characters long.');
  }
  return Buffer.from(key, 'utf8');
};

/**
 * Encrypts a plain text string using AES-256-GCM.
 * @param text The plain text to encrypt.
 * @returns The encrypted text in the format: iv:authTag:encryptedData (hex encoded)
 */
export const encryptKey = (text: string): string => {
  if (!text) return text;
  
  const key = getMasterKey();
  const iv = crypto.randomBytes(12); // 96-bit IV is recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts an AES-256-GCM encrypted string.
 * @param encryptedText The encrypted text in the format: iv:authTag:encryptedData (hex encoded)
 * @returns The decrypted plain text string.
 */
export const decryptKey = (encryptedText: string): string => {
  if (!encryptedText) return encryptedText;
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format.');
  }
  
  const [ivHex, authTagHex, encryptedDataHex] = parts;
  const key = getMasterKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
