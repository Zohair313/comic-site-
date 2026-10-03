const MAX_DIMENSION = 1400;
const TARGET_BYTES = 380 * 1024;
const HARD_CAP_BYTES = 2 * 1024 * 1024;
const QUALITY_FLOOR = 0.45;
const ATTEMPTS = 7;

function bytesFromDataUrl(dataUrl) {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return dataUrl.length;
  return Math.round(((dataUrl.length - comma - 1) * 3) / 4);
}

function loadImage(objectUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That image could not be read — PNG, JPEG or WebP only.'));
    img.src = objectUrl;
  });
}

/**
 * Local-only fallback for image uploads: no API configured, so the file is
 * downscaled in the browser and kept inline as a data URL in localStorage.
 *
 * localStorage only holds ~5MB for the whole site, so this walks quality and
 * dimensions down until the result fits the per-image budget instead of
 * handing back something that silently fails to persist later.
 */
export async function shrinkImageFile(file, { maxDimension = MAX_DIMENSION, targetBytes = TARGET_BYTES } = {}) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('That file is not an image — use a PNG, JPEG or WebP.');
  }

  const objectUrl = URL.createObjectURL(file);
  let img;
  try {
    img = await loadImage(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const keepAlpha = file.type === 'image/png' || file.type === 'image/webp';
  const mime = keepAlpha ? 'image/png' : 'image/jpeg';
  const sourceWidth = img.naturalWidth || img.width || 1;
  const sourceHeight = img.naturalHeight || img.height || 1;

  let scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  let quality = 0.82;
  let best = null;

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!keepAlpha) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL(mime, quality);
    const bytes = bytesFromDataUrl(dataUrl);
    if (!best || bytes < best.bytes) best = { dataUrl, width, height, bytes };

    if (bytes <= targetBytes) return best;

    // Quality first for flat formats, dimensions for everything.
    if (!keepAlpha && quality > QUALITY_FLOOR) {
      quality = Math.max(QUALITY_FLOOR, quality - 0.12);
    } else {
      scale *= 0.8;
      if (!keepAlpha) quality = Math.max(QUALITY_FLOOR, quality - 0.06);
    }
  }

  if (best.bytes > HARD_CAP_BYTES) {
    throw new Error(
      'That image is still too large to store in this browser. Connect the API (VITE_API_URL) for real file uploads, or pick a smaller image.'
    );
  }
  return best;
}
