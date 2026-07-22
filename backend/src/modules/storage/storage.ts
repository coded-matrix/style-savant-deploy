import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../../config/env';

/**
 * Provider-agnostic object storage. `save()` persists raw bytes and returns a
 * browser-reachable URL. Swap the driver via STORAGE_DRIVER without touching
 * call sites.
 */
export interface StorageAdapter {
  save(buffer: Buffer, mimeType: string): Promise<string>;
}

function extForMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  return map[mimeType] ?? 'bin';
}

/** Random, collision-resistant object key. */
function makeKey(mimeType: string): string {
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extForMime(mimeType)}`;
}

/* ------------------------------------------------------------------ */
/*  Local disk driver — default. Writes under STORAGE_LOCAL_DIR and    */
/*  is served by express.static at /uploads (see app.ts).              */
/* ------------------------------------------------------------------ */

class LocalDiskStorage implements StorageAdapter {
  private dir = path.resolve(process.cwd(), config.storage.localDir);

  async save(buffer: Buffer, mimeType: string): Promise<string> {
    await fs.mkdir(this.dir, { recursive: true });
    const key = makeKey(mimeType);
    await fs.writeFile(path.join(this.dir, key), buffer);
    return `${config.storage.publicBaseUrl.replace(/\/$/, '')}/uploads/${key}`;
  }
}

/* ------------------------------------------------------------------ */
/*  S3 driver — requires `npm i @aws-sdk/client-s3` and S3_* env.      */
/*  Imported dynamically so the dep is only needed when selected.      */
/* ------------------------------------------------------------------ */

class S3Storage implements StorageAdapter {
  private client: unknown;

  // Optional dep: `npm i @aws-sdk/client-s3` at deploy. Indirect specifier so
  // TypeScript doesn't require the module to be installed to compile.
  private async loadSdk(): Promise<any> {
    const spec = '@aws-sdk/client-s3';
    return import(spec);
  }

  private async getClient(sdk: any) {
    const { bucket, region, accessKeyId, secretAccessKey } = config.storage.s3;
    if (!bucket || !accessKeyId || !secretAccessKey) {
      throw new Error('S3 storage selected but S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY are not set');
    }
    if (!this.client) {
      this.client = new sdk.S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    }
    return this.client;
  }

  async save(buffer: Buffer, mimeType: string): Promise<string> {
    const { bucket, region, publicUrl } = config.storage.s3;
    const sdk = await this.loadSdk();
    const client = await this.getClient(sdk);
    const key = `products/${makeKey(mimeType)}`;
    await (client as { send: (c: unknown) => Promise<unknown> }).send(
      new sdk.PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: mimeType }),
    );
    const base = publicUrl || `https://${bucket}.s3.${region}.amazonaws.com`;
    return `${base.replace(/\/$/, '')}/${key}`;
  }
}

/* ------------------------------------------------------------------ */
/*  Cloudinary driver — requires `npm i cloudinary` and CLOUDINARY_URL.*/
/* ------------------------------------------------------------------ */

class CloudinaryStorage implements StorageAdapter {
  async save(buffer: Buffer, mimeType: string): Promise<string> {
    if (!config.storage.cloudinary.url) {
      throw new Error('Cloudinary storage selected but CLOUDINARY_URL is not set');
    }
    // Optional dep: `npm i cloudinary` at deploy. Indirect specifier keeps the
    // module out of the compile-time dependency graph.
    const spec = 'cloudinary';
    const { v2: cloudinary } = await import(spec);
    // CLOUDINARY_URL is read automatically from the environment by the SDK.
    const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: config.storage.cloudinary.folder,
      resource_type: mimeType.startsWith('video/') ? 'video' : 'image',
    });
    return result.secure_url;
  }
}

/* ------------------------------------------------------------------ */

let cached: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (cached) return cached;
  switch (config.storage.driver) {
    case 's3':
      cached = new S3Storage();
      break;
    case 'cloudinary':
      cached = new CloudinaryStorage();
      break;
    case 'local':
    default:
      cached = new LocalDiskStorage();
      break;
  }
  return cached;
}
