import sharp from 'sharp';

/**
 * Adds a thick white border outline around the non-transparent/foreground part of a clothing image.
 * The output is returned as a solid white background JPEG buffer (no transparency) to ensure
 * maximum compatibility with Agnes AI and prevent alpha-to-black conversion bugs.
 */
export async function addWhiteBorderToGarment(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 576;
  const height = metadata.height || 768;

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const hasAlpha = info.channels === 4;

  const threshold = 240; // threshold for white/light background pixels
  const alphaData = Buffer.alloc(width * height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * info.channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = hasAlpha ? data[idx + 3] : 255;

    // If pixel is close to white or already transparent, make it transparent in our mask
    if (r > threshold && g > threshold && b > threshold) {
      alphaData[i] = 0;
    } else {
      alphaData[i] = a;
    }
  }

  // Create transparent garment
  const transparentGarment = await sharp(data, {
    raw: { width, height, channels: info.channels }
  })
  .ensureAlpha()
  .joinChannel(alphaData, { raw: { width, height, channels: 1 } })
  .png()
  .toBuffer();

  // Create dilated outline mask
  const dilatedAlpha = await sharp(alphaData, { raw: { width, height, channels: 1 } })
    .blur(10) // size of the border outline
    .linear(15, -2) // thresholding to make the blurred mask solid
    .toBuffer();

  const solidWhite = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .png()
  .toBuffer();

  const whiteOutline = await sharp(solidWhite)
    .joinChannel(dilatedAlpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();

  // Composite original transparent garment over the white outline
  const finalGarmentWithBorder = await sharp(whiteOutline)
    .composite([{ input: transparentGarment, blend: 'over' }])
    .png()
    .toBuffer();

  // Create a solid white background canvas (no transparency) to avoid black-background issues in AI loading
  const solidWhiteBackground = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
  .jpeg()
  .toBuffer();

  const finalGarmentOnWhite = await sharp(solidWhiteBackground)
    .composite([{ input: finalGarmentWithBorder, blend: 'over' }])
    .jpeg()
    .toBuffer();

  return finalGarmentOnWhite;
}
