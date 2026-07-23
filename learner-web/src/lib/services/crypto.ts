import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

const getMasterKey = (): Buffer => {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  if (!key || key.length !== 32) {
    throw new Error('ENCRYPTION_MASTER_KEY must be set and exactly 32 characters long.');
  }
  return Buffer.from(key, 'utf8');
};

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
