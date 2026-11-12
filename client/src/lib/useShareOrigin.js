import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_SERVER_URL || '';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/**
 * Origen para compartir links de sala. Si el juego está abierto en "localhost",
 * ese link no sirve en otro dispositivo: lo reemplazamos por la IP de la PC en la red local.
 */
export function useShareOrigin() {
  const isLocal = LOCAL_HOSTS.has(location.hostname);
  const [origin, setOrigin] = useState(location.origin);

  useEffect(() => {
    if (!isLocal) return;
    const ctrl = new AbortController();
    fetch(`${BASE}/api/network`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then(({ addresses }) => {
        const ip = addresses?.[0];
        if (ip) setOrigin(`${location.protocol}//${ip}${location.port ? `:${location.port}` : ''}`);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [isLocal]);

  return { origin, rewritten: origin !== location.origin };
}
