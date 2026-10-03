import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const STORED_NAME_PATTERN = /^[A-Za-z0-9_-]{8,80}\.[A-Za-z0-9]{1,10}$/;
const UNSAFE_NAME_CHARS = /[^A-Za-z0-9._ -]/g;

const EXT_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export function detectImageMime(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length > 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export function extForMime(mime) {
  return EXT_BY_MIME[String(mime || '').toLowerCase()] || 'bin';
}

/**
 * Turns a user supplied filename into something safe to echo back in a
 * Content-Disposition header or the admin UI. Never used to build a path.
 */
export function sanitizeDisplayName(name, fallback = 'download') {
  const base = String(name ?? '')
    .split(/[\\/]/)
    .pop()
    .replace(UNSAFE_NAME_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return base || fallback;
}

export function createStorage(rootDir) {
  const base = path.resolve(rootDir);

  const resolvePath = (subdir, storedName) => {
    const name = String(storedName || '');
    if (!STORED_NAME_PATTERN.test(name)) throw new Error('Invalid stored file name.');
    const target = path.resolve(base, subdir, name);
    if (target !== base && !target.startsWith(base + path.sep)) {
      throw new Error('Invalid storage path.');
    }
    return target;
  };

  return {
    rootDir: base,

    save(buffer, { subdir = 'uploads', ext = 'bin', prefix = '' } = {}) {
      if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('Nothing to save.');
      const safeExt = String(ext || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin';
      const safePrefix = String(prefix || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 16);
      const name = `${safePrefix ? `${safePrefix}-` : ''}${crypto.randomBytes(16).toString('hex')}.${safeExt}`;
      const target = resolvePath(subdir, name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const tmp = `${target}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, buffer);
      fs.renameSync(tmp, target);
      return { storedName: name, size: buffer.length };
    },

    read(subdir, storedName) {
      return fs.readFileSync(resolvePath(subdir, storedName));
    },

    createReadStream(subdir, storedName) {
      return fs.createReadStream(resolvePath(subdir, storedName));
    },

    stat(subdir, storedName) {
      try {
        return fs.statSync(resolvePath(subdir, storedName));
      } catch {
        return null;
      }
    },

    exists(subdir, storedName) {
      try {
        return fs.statSync(resolvePath(subdir, storedName)).isFile();
      } catch {
        return false;
      }
    },

    remove(subdir, storedName) {
      try {
        fs.rmSync(resolvePath(subdir, storedName), { force: true });
        return true;
      } catch {
        return false;
      }
    },
  };
}
