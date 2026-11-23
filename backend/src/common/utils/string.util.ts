/** Normalize Vietnamese text: lowercase, strip diacritics, collapse spaces. */
export function normalizeVietnamese(text = ''): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Generate a URL-safe slug from Vietnamese or ASCII text. */
export function slugify(text = ''): string {
  return normalizeVietnamese(text).replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
}

/** Escape regex metacharacters in user-supplied search queries. */
export function escapeRegex(text = ''): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Escape HTML special characters before interpolating untrusted strings into templates. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
