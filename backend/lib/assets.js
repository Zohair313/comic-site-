import crypto from 'node:crypto';
import { readJson, writeJson } from './store.js';

const ID_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

const MIME_BY_EXT = {
  zip: 'application/zip',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  psd: 'image/vnd.adobe.photoshop',
  ai: 'application/postscript',
  kra: 'application/x-krita',
  clip: 'application/octet-stream',
  epub: 'application/epub+zip',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  blend: 'application/x-blender',
  fig: 'application/octet-stream',
};

const MAX_ASSETS = 500;

export const ASSET_EXTENSIONS = Object.keys(MIME_BY_EXT);

export function mimeForFilename(filename) {
  const ext = String(filename || '').toLowerCase().split('.').pop();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

export function isAllowedAssetExtension(filename) {
  const ext = String(filename || '').toLowerCase().split('.').pop();
  return Boolean(ext) && Object.hasOwn(MIME_BY_EXT, ext);
}

function clean(value, max) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function newAssetId() {
  let id = 'asset-';
  for (let i = 0; i < 8; i += 1) id += ID_ALPHABET[crypto.randomInt(ID_ALPHABET.length)];
  return id;
}

export function createAssetStore(assetsFile) {
  const load = () => {
    const assets = readJson(assetsFile, { assets: [] }).assets;
    return Array.isArray(assets) ? assets : [];
  };

  const save = (assets) => {
    writeJson(assetsFile, { assets: assets.slice(-MAX_ASSETS) });
    return assets;
  };

  return {
    load,
    save,

    find(assets, id) {
      return assets.find((asset) => asset.id === String(id || '')) || null;
    },

    create({ label, filename, storedName, size, mime, productIds = [], description = '' }) {
      const assets = load();
      let id = newAssetId();
      while (this.find(assets, id)) id = newAssetId();
      const now = new Date().toISOString();
      const asset = {
        id,
        label: clean(label, 120) || clean(filename, 120),
        description: clean(description, 300),
        filename: clean(filename, 120),
        storedName,
        mime: mime || mimeForFilename(filename),
        size: Number(size) || 0,
        productIds: [...new Set(productIds.map((value) => clean(value, 60)).filter(Boolean))].slice(0, 20),
        active: true,
        createdAt: now,
        updatedAt: now,
      };
      assets.push(asset);
      return { asset, assets: save(assets) };
    },

    update(assets, id, patch) {
      const asset = this.find(assets, id);
      if (!asset) return null;
      if ('label' in patch) asset.label = clean(patch.label, 120) || asset.label;
      if ('description' in patch) asset.description = clean(patch.description, 300);
      if ('active' in patch) asset.active = Boolean(patch.active);
      if ('productIds' in patch && Array.isArray(patch.productIds)) {
        asset.productIds = [...new Set(patch.productIds.map((value) => clean(value, 60)).filter(Boolean))].slice(0, 20);
      }
      asset.updatedAt = new Date().toISOString();
      save(assets);
      return asset;
    },

    remove(assets, id) {
      const index = assets.findIndex((asset) => asset.id === String(id || ''));
      if (index === -1) return null;
      const [removed] = assets.splice(index, 1);
      save(assets);
      return removed;
    },

    /**
     * Assets an order earns. An asset with no productIds is a universal bonus
     * and rides along with every order.
     */
    resolveForOrder(assets, items) {
      const wanted = new Set((items || []).map((item) => item.productId));
      return assets.filter((asset) => {
        if (!asset.active || !asset.storedName) return false;
        if (!asset.productIds.length) return true;
        return asset.productIds.some((productId) => wanted.has(productId));
      });
    },
  };
}
