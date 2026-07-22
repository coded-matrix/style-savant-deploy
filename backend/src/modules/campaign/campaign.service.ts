import { getAI, TEXT_MODEL } from '../../utils/gemini';
import { editImage } from '../../utils/agnes';
import { TokenManager } from '../tokens/token-manager';
import { TOKEN_COSTS } from '../tokens/token.types';
import { config } from '../../config/env';

export const AUDIENCES: Record<string, string> = {
  domestic: 'Ghanaian local market buyers who value quality, affordability, and local fashion trends',
  diaspora: 'Ghanaian and African diaspora buyers seeking contemporary fashion with a strong connection to heritage',
  international: 'international diaspora and global buyers interested in African fashion and artisanship',
};

// Models often wrap JSON in ```json fences despite being told not to. Strip them before parsing.
function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

export async function generateCopy(
  vendorId: string,
  productBuffer: Buffer,
  productMime: string,
  prompt: string,
  audience: string
): Promise<{ caption: string; hashtags: string[]; ad_text: string }> {
  if (!AUDIENCES[audience]) {
    throw new Error(`Invalid audience. Must be one of: ${Object.keys(AUDIENCES).join(', ')}`);
  }

  // Fail fast before calling the model if the vendor cannot afford it
  if (!(await TokenManager.hasEnoughTokens(vendorId, TOKEN_COSTS.CAMPAIGN_COPY))) {
    throw new Error('Insufficient tokens or inactive subscription');
  }

  const ai = getAI();

  const fullPrompt =
    `You are a social media marketing expert for an African fashion brand. ` +
    `The target audience is: ${AUDIENCES[audience]}. ` +
    `The merchant's brief: "${prompt}". ` +
    `Based on the product image, generate marketing copy in this exact JSON format: ` +
    `{ "caption": "...", "hashtags": ["...", "..."], "ad_text": "..." }. ` +
    `Keep the caption under 150 characters. Include 5 to 8 hashtags. ` +
    `Ad text should be one punchy sentence under 80 characters. Return only the JSON, no markdown.`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: fullPrompt },
          { inlineData: { mimeType: productMime, data: productBuffer.toString('base64') } },
        ],
      },
    ],
  });

  const raw = stripJsonFences(response.text ?? '');

  let copy: { caption: string; hashtags: string[]; ad_text: string };
  try {
    copy = JSON.parse(raw);
  } catch {
    throw new Error('Gemini returned malformed copy. Try rephrasing your prompt.');
  }

  // Charge only after we have a valid result, so failed or malformed responses are free
  await TokenManager.chargeTokens(vendorId, TOKEN_COSTS.CAMPAIGN_COPY, 'Campaign copy generation', {
    feature: 'campaign_copy',
  });

  return copy;
}

export async function generateCampaignImage(
  vendorId: string,
  productBuffer: Buffer,
  productMime: string,
  prompt: string,
  audience: string,
  format = 'Instagram Post',
  headline = ''
): Promise<string> {
  if (!AUDIENCES[audience]) {
    throw new Error(`Invalid audience. Must be one of: ${Object.keys(AUDIENCES).join(', ')}`);
  }

  // Fail fast before calling the model if the vendor cannot afford it
  if (!(await TokenManager.hasEnoughTokens(vendorId, TOKEN_COSTS.CAMPAIGN_IMAGE))) {
    throw new Error('Insufficient tokens or inactive subscription');
  }

  const fullPrompt = [
    'TASK: Transform the supplied product photograph into a professional fashion campaign graphic.',
    '',
    'REFERENCE FIDELITY — HIGHEST PRIORITY:',
    'The supplied image is the single source of truth for the product.',
    'Keep the exact garment or accessory unchanged: identical silhouette, proportions, neckline, sleeves, hem, closures, seams, fabric pattern, weave, colours, texture, embellishments, labels and logos.',
    'Do not redesign, restyle, recolour, simplify, extend, replace or invent any part of the product.',
    'Do not add a second garment, jewellery, bag, hat, shoes or accessories that are not visible in the reference.',
    'If the reference contains no person, keep the result product-only. Never invent a model, face, body, hands or a complete outfit unless the creative brief explicitly requests a model.',
    'If a person is present, preserve their pose and identity while changing only the environment and campaign treatment.',
    '',
    'FASHION ART DIRECTION:',
    `Audience: ${AUDIENCES[audience]}.`,
    `Placement: ${format}.`,
    `Creative direction: ${prompt}.`,
    'Build an intentional fashion image with art-directed lighting, material-aware shadows, accurate fabric detail, strong hierarchy and purposeful negative space.',
    'The product remains the unmistakable hero and must read clearly at thumbnail size.',
    'Use one coherent set and one coherent lighting concept. Make the framing and spatial composition distinct from a generic ecommerce photo.',
    '',
    'GRAPHIC-DESIGN RULES:',
    headline
      ? `Reserve clean negative space appropriate for the headline "${headline}", but do not render any words into the image.`
      : 'Reserve useful negative space for optional campaign copy, but do not render words into the image.',
    'No fake logos, pseudo-text, watermarks, borders, stickers, sale badges, collages, duplicated products, surreal anatomy or unrelated props.',
    'Avoid the default beige luxury set unless the creative brief specifically asks for it.',
    'Output one polished, photoreal fashion campaign image; not a mood board and not a newly invented fashion look.',
  ].join('\n');

  const outputSize = format === 'Story' ? '576x1024' : '1024x1024';
  const image = await editImage(productBuffer, productMime, fullPrompt, outputSize, undefined, 0.35);

  // Charge only after the image is generated, so failed generations are free
  await TokenManager.chargeTokens(vendorId, TOKEN_COSTS.CAMPAIGN_IMAGE, 'Campaign image generation', {
    feature: 'campaign_image',
  });

  return image;
}

interface ExternalItem {
  id: string;
  name: string;
}

interface PublishCampaignInput {
  title: string;
  copyText: string;
  imageBase64: string;
  featuredItems?: Array<{ id: string; name: string }>;
}

interface ExternalCampaignCreate {
  id: string;
  share_url?: string;
}

function absoluteCampaignUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${config.campaignApi.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function campaignApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.campaignApi.timeoutMs);
  const url = absoluteCampaignUrl(path);
  try {
    let response = await fetch(url, { ...init, signal: controller.signal });
    if (response.status === 429 || response.status >= 500) {
      const retryAfter = Number(response.headers.get('retry-after') ?? '0');
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 400));
      response = await fetch(url, { ...init, signal: controller.signal });
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function campaignApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await campaignApiFetch(path, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      payload && typeof payload === 'object'
        ? JSON.stringify(payload)
        : `HTTP ${response.status}`;
    throw new Error(`Campaign publishing API error: ${detail}`);
  }
  return payload as T;
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export async function publishCampaign(input: PublishCampaignInput) {
  const title = input.title.trim();
  const copyText = input.copyText.trim();
  if (!title) throw new Error('Campaign title is required');
  if (!input.imageBase64) throw new Error('Generated campaign image is required');

  const dataMatch = input.imageBase64.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/s);
  const mime = dataMatch?.[1] ?? 'image/png';
  const encoded = dataMatch?.[2] ?? input.imageBase64;
  const image = Buffer.from(encoded, 'base64');
  if (!image.length) throw new Error('Generated campaign image is invalid');
  if (image.length > 10 * 1024 * 1024) throw new Error('Generated campaign image exceeds 10MB');

  const extension = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
  const upload = new FormData();
  upload.append('file', new Blob([new Uint8Array(image)], { type: mime }), `campaign.${extension}`);
  const uploaded = await campaignApiJson<{ url: string }>('/uploads', {
    method: 'POST',
    body: upload,
  });

  let featuredItemIds: string[] = [];
  if (input.featuredItems?.length) {
    const catalog = await campaignApiJson<ExternalItem[]>(
      `/merchants/${encodeURIComponent(config.campaignApi.merchantId)}/items`
    );
    const validIds = new Set(catalog.map((item) => item.id));
    const idsByName = new Map(catalog.map((item) => [normalizeName(item.name), item.id]));
    featuredItemIds = input.featuredItems
      .map((item) => validIds.has(item.id) ? item.id : idsByName.get(normalizeName(item.name)))
      .filter((id): id is string => Boolean(id));
  }

  const created = await campaignApiJson<ExternalCampaignCreate>('/campaigns', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      merchant_id: config.campaignApi.merchantId,
      title,
      copy_text: copyText || undefined,
      image_urls: [uploaded.url],
      featured_item_ids: featuredItemIds,
      team_slug: config.campaignApi.teamSlug,
    }),
  });

  const campaign = await campaignApiJson<Record<string, unknown>>(
    `/campaigns/${encodeURIComponent(created.id)}`
  );
  return {
    id: created.id,
    shareUrl: created.share_url ?? absoluteCampaignUrl(`/campaigns/${created.id}`),
    imageUrl: absoluteCampaignUrl(uploaded.url),
    campaign,
  };
}
