/**
 * Compartir/copiar que funciona también por http en la LAN.
 * En iPhone por http://192.168.x.x NO existen navigator.share ni navigator.clipboard
 * (requieren https), así que caemos a un <textarea> + execCommand('copy').
 */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* seguimos con el fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    Object.assign(ta.style, { position: 'fixed', top: '0', left: '0', opacity: '0', fontSize: '16px' });
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length); // iOS
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** 'shared' | 'copied' | 'cancelled' | 'failed' */
export async function shareOrCopy({ title, text, url }) {
  if (navigator.share && window.isSecureContext) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  return (await copyText(url)) ? 'copied' : 'failed';
}
