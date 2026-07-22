import { Response } from 'express';
import { AuthRequest, getVendorId } from '../../middleware/auth';
import { statusForError } from '../../utils/http-error';
import * as service from './campaign.service';

function fail(res: Response, err: unknown) {
  const message = (err as Error).message;
  // Bad audience / malformed model output are client-fixable, everything else uses the shared map
  const status =
    message.startsWith('Invalid audience') || message.includes('malformed')
      ? 400
      : statusForError(message);
  res.status(status).json({ error: message });
}

export function getAudiences(_req: AuthRequest, res: Response) {
  res.json(service.AUDIENCES);
}

export async function generateCopy(req: AuthRequest, res: Response) {
  try {
    const vendorId = getVendorId(req);

    if (!req.file) {
      res.status(400).json({ error: 'Product image is required' });
      return;
    }

    const { prompt, audience } = req.body;
    if (!prompt || !audience) {
      res.status(400).json({ error: 'prompt and audience are required' });
      return;
    }

    const copy = await service.generateCopy(vendorId, req.file.buffer, req.file.mimetype, prompt, audience);
    res.json(copy);
  } catch (err) {
    fail(res, err);
  }
}

export async function generateCampaignImage(req: AuthRequest, res: Response) {
  try {
    const vendorId = getVendorId(req);

    if (!req.file) {
      res.status(400).json({ error: 'Product image is required' });
      return;
    }

    const { prompt, audience, format, headline } = req.body;
    if (!prompt || !audience) {
      res.status(400).json({ error: 'prompt and audience are required' });
      return;
    }

    const image = await service.generateCampaignImage(
      vendorId,
      req.file.buffer,
      req.file.mimetype,
      prompt,
      audience,
      typeof format === 'string' ? format : 'Instagram Post',
      typeof headline === 'string' ? headline : ''
    );
    res.json({ image });
  } catch (err) {
    fail(res, err);
  }
}

export async function publishCampaign(req: AuthRequest, res: Response) {
  try {
    getVendorId(req);
    const { title, copyText, imageBase64, featuredItems } = req.body;
    if (typeof title !== 'string' || !title.trim() || typeof imageBase64 !== 'string' || !imageBase64) {
      res.status(400).json({ error: 'title and generated image are required' });
      return;
    }
    const published = await service.publishCampaign({
      title,
      copyText: typeof copyText === 'string' ? copyText : '',
      imageBase64,
      featuredItems: Array.isArray(featuredItems) ? featuredItems : [],
    });
    res.status(201).json(published);
  } catch (err) {
    fail(res, err);
  }
}
