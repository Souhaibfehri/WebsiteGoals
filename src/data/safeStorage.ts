/**
 * localStorage is not always reachable: private windows, blocked site data, and
 * sandboxed/preview contexts make even *accessing* `window.localStorage` throw a
 * SecurityError. Because the repository loads at module-import time, an unguarded
 * access takes the whole bundle down before React mounts — a blank page.
 * Every access goes through here, and falls back to an in-memory map.
 */

const memory = new Map<string, string>();

function backing(): Storage | null {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    // Some browsers only throw on first use rather than on property access.
    const probe = '__lifeos_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

export function readItem(key: string): string | null {
  const ls = backing();
  if (!ls) return memory.get(key) ?? null;
  try {
    return ls.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

export function writeItem(key: string, value: string): void {
  memory.set(key, value);
  const ls = backing();
  if (!ls) return;
  try {
    ls.setItem(key, value);
  } catch {
    // Quota exceeded or storage revoked mid-session — memory copy still holds.
  }
}
