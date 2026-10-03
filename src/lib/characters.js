const SLUG_CLEAN = /[^a-z0-9]+/g;

/** Stable product id for a character, shared with the backend catalog. */
export function characterProductId(character) {
  const slug = String(character?.name ?? '')
    .toLowerCase()
    .replace(SLUG_CLEAN, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug ? `char-${slug}` : '';
}

/**
 * Turns a character into a checkout product. A character is buyable once it
 * has a price above zero — that is the only switch, no extra flag to forget.
 */
export function characterProduct(character) {
  const id = characterProductId(character);
  const priceCents = Math.max(0, Math.round(Number(character?.priceCents) || 0));
  if (!id || priceCents <= 0) return null;
  const role = String(character?.role ?? '').trim();
  return {
    id,
    title: String(character?.name ?? '').trim(),
    description: role ? `${role} — downloadable character pack` : 'Downloadable character pack',
    priceCents,
    image: character?.img ?? '',
    kind: 'character',
  };
}

export function purchasableCharacters(characters) {
  if (!Array.isArray(characters)) return [];
  return characters.map(characterProduct).filter(Boolean);
}

export function artworkProductId(artwork) {
  const slug = String(artwork?.title ?? '')
    .toLowerCase()
    .replace(SLUG_CLEAN, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug ? `art-${slug}` : '';
}

export function artworkProduct(artwork) {
  const id = artworkProductId(artwork);
  const priceCents = Math.max(0, Math.round(Number(artwork?.priceCents) || 0));
  if (!id || priceCents <= 0) return null;
  return {
    id,
    title: String(artwork?.title ?? '').trim(),
    description: String(artwork?.desc ?? '').trim() || 'Downloadable art piece',
    priceCents,
    image: artwork?.img ?? '',
    kind: 'art',
  };
}

export function purchasableArtworks(artworks) {
  if (!Array.isArray(artworks)) return [];
  return artworks.map(artworkProduct).filter(Boolean);
}

export function dollarsToCents(value) {
  const num = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.round(num * 100);
}

export function centsToDollars(cents) {
  return ((Number(cents) || 0) / 100).toFixed(2);
}
