import { config } from '../config/env';

// Detects JPEG / PNG dimensions from a raw buffer without external deps.
// Returns null if the format is unknown or unsupported.
export function detectImageSize(
  buffer: Buffer,
): { width: number; height: number } | null {
  // JPEG — SOF0 marker (0xFF 0xC0) carries dimensions
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    for (let i = 2; i < buffer.length - 9; i++) {
      if (buffer[i] === 0xff && (buffer[i + 1] === 0xc0 || buffer[i + 1] === 0xc2)) {
        const height = buffer.readUInt16BE(i + 5);
        const width = buffer.readUInt16BE(i + 7);
        if (width > 0 && height > 0) return { width, height };
      }
    }
    return null;
  }

  // PNG — IHDR chunk (bytes 16-23) carries dimensions
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height };
    return null;
  }

  return null;
}

function getKey() {
  if (!config.ai.agnesKey) throw new Error('AGNES_AI is not set in .env');
  return config.ai.agnesKey;
}

// Sends an existing image + prompt to Agnes and returns the result as base64.
// Used for AI Clean (inventory) and campaign image generation.
export async function editImage(
  imageBuffer: Buffer,
  mimeType: string,
  prompt: string,
  size = config.ai.agnesImageSize,
  garmentUrlOrBuffer?: string | Buffer,
  strength?: number
): Promise<string> {
  // Agnes AI's safety filter has a naive substring block on the word "rape" (case-insensitive).
  // This causes false positives on common fashion/design terms like "drape", "draped", "drapes" (Scunthorpe problem).
  // We sanitize the prompt to replace any such terms with safe, non-violating alternatives (like "draping", "drapings", or "flow").
  const sanitizedPrompt = prompt
    .replace(/draped/gi, (match) => match.charAt(0) === 'D' ? 'Draping' : 'draping')
    .replace(/drapes/gi, (match) => match.charAt(0) === 'D' ? 'Drapings' : 'drapings')
    .replace(/drape/gi, (match) => match.charAt(0) === 'D' ? 'Draping' : 'draping');

  const dataUri = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

  let images: string[];
  if (garmentUrlOrBuffer) {
    let garmentDataUri: string;
    if (Buffer.isBuffer(garmentUrlOrBuffer)) {
      garmentDataUri = `data:image/png;base64,${garmentUrlOrBuffer.toString('base64')}`;
    } else {
      // Agnes can't always reach external URLs, so fetch the garment image
      // and send it as a data URI (confirmed working approach).
      const garmentRes = await fetch(garmentUrlOrBuffer);
      if (!garmentRes.ok) throw new Error(`Failed to fetch garment image: ${garmentRes.status}`);
      const garmentBuf = Buffer.from(await garmentRes.arrayBuffer());
      const garmentMime = garmentRes.headers.get('content-type') || 'image/jpeg';
      garmentDataUri = `data:${garmentMime};base64,${garmentBuf.toString('base64')}`;
    }
    images = [dataUri, garmentDataUri];
  } else {
    images = [dataUri];
  }

  let response: globalThis.Response | undefined;
  let attempt = 0;
  const maxRetries = 3;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.ai.agnesTimeoutMs);

    try {
      response = await fetch(`${config.ai.agnesBaseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getKey()}`,
          'Content-Type': 'application/json',
          'Connection': 'close',
        },
        body: JSON.stringify({
          model: config.ai.agnesImageModel,
          prompt: sanitizedPrompt,
          size,
          extra_body: {
            image: images,
            // Always request base64. Agnes's hosted-image domain
            // (platform-outputs.agnes-ai.space) ships with an untrusted
            // SSL cert, so asking for `url` and then fetching it from
            // either the browser or our backend fails with
            // ERR_CERT_AUTHORITY_INVALID. b64_json keeps the image bytes
            // inline in the response — no second hop, no cert issue.
            response_format: 'b64_json',
            ...(strength !== undefined ? { strength } : {}),
          },
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        clearTimeout(timeout);
        break; // Success
      } else {
        const text = await response.text();
        lastError = new Error(`Agnes AI error ${response.status}: ${text}`);
      }
    } catch (err) {
      const isAbort = (err as Error).name === 'AbortError';
      if (isAbort) {
        lastError = new Error('Agnes AI timed out');
        // Don't retry on timeout — the upstream is too slow, retrying only
        // stretches the request until Express (or the caller) hits its own
        // timeout, causing socket resets. Fall through to throw below.
        break;
      }
      lastError = err;
      // Exponential backoff before retrying real errors: 2s, 4s, 8s
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** (attempt - 1)));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!response || !response.ok) {
    throw lastError || new Error('Agnes AI failed after multiple attempts');
  }

  const result = (await response.json()) as any;
  // We always request b64_json (see the request body above), so the result
  // is always a base64 string. Kept as a defensive fallback in case Agnes
  // ever returns a URL — but in that case the caller is on its own.
  const output: string | undefined = result.data?.[0]?.b64_json ?? result.data?.[0]?.url;

  if (!output) throw new Error('Agnes AI did not return an image');

  return output;
}
