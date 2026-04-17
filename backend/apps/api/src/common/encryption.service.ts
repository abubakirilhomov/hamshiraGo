import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    const encKey = this.configService.get<string>('ENCRYPTION_KEY');
    this.enabled = !!encKey && encKey.length >= 32;
    this.key = this.enabled
      ? Buffer.from(encKey!.slice(0, 32), 'utf-8')
      : Buffer.alloc(32);
  }

  encrypt(plaintext: string): string {
    if (!this.enabled) return plaintext;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    // Format: enc:base64(iv):base64(tag):base64(encrypted)
    return `enc:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(ciphertext: string): string {
    if (!this.enabled || !ciphertext.startsWith('enc:')) return ciphertext;
    const parts = ciphertext.slice(4).split(':');
    if (parts.length !== 3) return ciphertext;
    const [ivB64, tagB64, encB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const encrypted = Buffer.from(encB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
      'utf8',
    );
  }
}
