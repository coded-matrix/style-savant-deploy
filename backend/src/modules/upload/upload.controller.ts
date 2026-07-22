import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { config } from '../../config/env';
import { getStorage } from '../storage/storage';

const ALLOWED_IMAGES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const ALLOWED_VIDEOS = new Set(['video/mp4', 'video/webm']);

/**
 * POST /api/uploads — accepts one or more image or video files (field name
 * "files"), persists them to the configured object storage, and returns their
 * public URLs in the same order. Vendor-authenticated (see upload.routes).
 * Images are capped at STORAGE_MAX_UPLOAD_BYTES, videos at the larger
 * STORAGE_MAX_VIDEO_UPLOAD_BYTES.
 */
export async function uploadFiles(req: AuthRequest, res: Response) {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) {
      res.status(400).json({ error: 'No files provided (expected multipart field "files")' });
      return;
    }

    const invalid = files.find((f) => !ALLOWED_IMAGES.has(f.mimetype) && !ALLOWED_VIDEOS.has(f.mimetype));
    if (invalid) {
      res.status(400).json({ error: `Unsupported file type: ${invalid.mimetype}` });
      return;
    }

    const oversized = files.find((f) => {
      const cap = ALLOWED_VIDEOS.has(f.mimetype)
        ? config.storage.maxVideoUploadBytes
        : config.storage.maxUploadBytes;
      return f.size > cap;
    });
    if (oversized) {
      res.status(400).json({ error: `File too large: ${oversized.originalname} (${oversized.mimetype})` });
      return;
    }

    const storage = getStorage();
    const urls = await Promise.all(files.map((f) => storage.save(f.buffer, f.mimetype)));

    res.status(201).json({ urls });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: (err as Error).message || 'Upload failed' });
  }
}
