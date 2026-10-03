import express from 'express';
import multer from 'multer';
import { detectImageMime, extForMime, sanitizeDisplayName } from '../lib/storage.js';

export const IMAGE_SUBDIR = 'images';
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const STORED_NAME_PATTERN = /^[A-Za-z0-9_-]{8,80}\.[A-Za-z0-9]{1,10}$/;

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 8, fieldSize: 16 * 1024 },
});

export function publicUrlFor(storedName) {
  return `/uploads/${IMAGE_SUBDIR}/${storedName}`;
}

export function createImageRouter({ storage, requireAuth }) {
  const router = express.Router();

  const receive = (req, res, next) =>
    imageUpload.single('image')(req, res, (error) => {
      if (!error) return next();
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'That image is larger than 12 MB.' });
      }
      if (String(error.code || '').startsWith('LIMIT_')) {
        return res.status(400).json({ error: 'That upload was rejected.' });
      }
      return next(error);
    });

  router.post('/', requireAuth, receive, (req, res) => {
    const file = req.file;
    if (!file?.buffer?.length) {
      return res.status(400).json({ error: 'No image was received.' });
    }

    // Magic bytes, not the client supplied mime or filename.
    const mime = detectImageMime(file.buffer);
    if (!mime) {
      return res.status(415).json({ error: 'Only PNG, JPEG or WebP images are supported.' });
    }

    let saved;
    try {
      saved = storage.save(file.buffer, {
        subdir: IMAGE_SUBDIR,
        ext: extForMime(mime),
        prefix: 'img',
      });
    } catch {
      return res.status(500).json({ error: 'Could not save that image.' });
    }

    return res.json({
      ok: true,
      url: publicUrlFor(saved.storedName),
      storedName: saved.storedName,
      size: saved.size,
      mime,
      originalName: sanitizeDisplayName(file.originalname, 'image'),
    });
  });

  router.delete('/:storedName', requireAuth, (req, res) => {
    const storedName = String(req.params.storedName || '');
    if (!STORED_NAME_PATTERN.test(storedName)) {
      return res.status(400).json({ error: 'Invalid file name.' });
    }
    storage.remove(IMAGE_SUBDIR, storedName);
    return res.json({ ok: true });
  });

  return router;
}
