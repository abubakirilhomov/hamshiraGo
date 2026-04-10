import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly enabled: boolean;

  constructor(private config: ConfigService) {
    this.endpoint = this.config.get<string>('S3_ENDPOINT') ?? '';
    const accessKey = this.config.get<string>('S3_ACCESS_KEY');
    const secretKey = this.config.get<string>('S3_SECRET_KEY');
    this.bucket = this.config.get<string>('S3_BUCKET') ?? 'hamshirago';
    this.enabled = !!(this.endpoint && accessKey && secretKey);

    if (this.enabled) {
      this.client = new S3Client({
        endpoint: this.endpoint,
        region: 'auto',
        credentials: {
          accessKeyId: accessKey!,
          secretAccessKey: secretKey!,
        },
        forcePathStyle: true, // needed for MinIO / Backblaze B2
      });
      this.logger.log('S3-compatible storage configured');
    } else {
      this.client = null;
      this.logger.warn('S3 not configured — using Cloudinary only');
    }
  }

  get isConfigured(): boolean {
    return this.enabled;
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.client) throw new Error('S3 not configured');

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;

    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
      .catch((err) => {
        this.logger.warn(`S3 delete failed for key=${key}: ${err}`);
      });
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.client) throw new Error('S3 not configured');

    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }
}
