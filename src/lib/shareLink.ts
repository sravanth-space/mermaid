const HASH_PREFIX = "#code=";

/**
 * base64url, so the payload survives being pasted into chat apps and mail
 * clients that mangle "+", "/" and "=".
 */
const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (encoded: string) => {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

/** Absolute URL that reopens the app with this definition loaded. */
export const buildShareUrl = (code: string) => {
  const encoded = toBase64Url(new TextEncoder().encode(code));
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}${HASH_PREFIX}${encoded}`;
};

/**
 * Definition carried in the current URL hash, or null when absent or corrupt.
 * A malformed link should open an empty editor, not crash the app.
 */
export const readSharedCode = (): string | null => {
  const hash = window.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) return null;

  try {
    const decoded = new TextDecoder().decode(
      fromBase64Url(hash.slice(HASH_PREFIX.length))
    );
    return decoded || null;
  } catch {
    return null;
  }
};

/**
 * Drops the shared definition from the address bar once it has been loaded, so
 * later edits are not misrepresented by a stale link.
 */
export const clearSharedCode = () => {
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search
  );
};
