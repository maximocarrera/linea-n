// localStorage/sessionStorage pueden tirar error (modo privado de Safari, etc.)
function safe(store) {
  return {
    get(key, fallback = null) {
      try {
        const raw = store().getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        store().setItem(key, JSON.stringify(value));
      } catch {
        /* sin storage: seguimos igual */
      }
    },
    remove(key) {
      try {
        store().removeItem(key);
      } catch {
        /* noop */
      }
    },
  };
}

export const local = safe(() => window.localStorage);
export const session = safe(() => window.sessionStorage);

// crypto.randomUUID solo existe en contextos seguros (https / localhost);
// por LAN (http://192.168...) el celular no lo tiene, así que hay fallback.
function randomId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}

let cachedId = null;
export function getPlayerId() {
  if (cachedId) return cachedId;
  cachedId = local.get('linean:pid') || randomId();
  local.set('linean:pid', cachedId);
  return cachedId;
}
