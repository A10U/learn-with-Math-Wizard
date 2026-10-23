const PALETTE = ['#ffd76a', '#ff8fb8', '#76e7ff', '#b9a1ff', '#9cf3b7'];
const DURATION = 1400;
const REDUCED_DURATION = 550;

/** A short, decorative reward. Repeated signals share one bounded animation. */
export function createCelebration({ document = globalThis.document, window = globalThis.window } = {}) {
  let overlay = null;
  let timer = null;
  let activeKind = null;
  let disposed = false;
  const schedule = window?.setTimeout?.bind(window) ?? globalThis.setTimeout;
  const cancel = window?.clearTimeout?.bind(window) ?? globalThis.clearTimeout;

  function clear() {
    if (timer !== null) cancel(timer);
    timer = null;
    if (overlay?.parentNode?.removeChild) overlay.parentNode.removeChild(overlay);
    else overlay?.remove?.();
    overlay = null;
    activeKind = null;
  }

  function reducedMotion() {
    try { return Boolean(window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches); }
    catch { return false; }
  }

  function burst({ kind = 'success' } = {}) {
    if (disposed || document?.hidden || typeof document?.createElement !== 'function' || !document?.body?.appendChild) return false;
    const nextKind = kind === 'complete' ? 'complete' : 'success';
    // Coalesce duplicate answer signals. A level win can immediately upgrade an answer reward.
    if (overlay && (activeKind === 'complete' || nextKind === 'success')) return false;
    clear();
    const layer = document.createElement('div');
    if (!layer?.appendChild || !layer?.setAttribute) return false;
    const reduced = reducedMotion();
    layer.className = `mw-celebration${reduced ? ' mw-celebration--reduced' : ''}`;
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('data-celebration-kind', nextKind);
    const origins = nextKind === 'complete' ? [[27, 36], [73, 30], [50, 22]] : [[38, 34], [65, 28]];
    for (const [index, [left, top]] of origins.entries()) {
      const firework = document.createElement('div');
      if (!firework?.appendChild) return false;
      firework.className = 'mw-firework-burst';
      firework.style?.setProperty?.('--firework-left', `${left}%`);
      firework.style?.setProperty?.('--firework-top', `${top}%`);
      const count = reduced ? 7 : nextKind === 'complete' ? 24 : 18;
      for (let particle = 0; particle < count; particle++) {
        const spark = document.createElement('span');
        if (!spark) return false;
        spark.className = 'mw-firework-spark';
        const angle = Math.PI * 2 * particle / count + index * 0.29;
        const radius = reduced ? 22 + (particle % 3) * 15 : 75 + (particle % 3) * 23;
        const set = (name, value) => spark.style?.setProperty?.(name, value);
        set('--spark-x', `${Math.cos(angle) * radius}px`);
        set('--spark-y', `${Math.sin(angle) * radius}px`);
        set('--spark-angle', `${angle}rad`);
        set('--spark-color', reduced ? '#ffd76a' : PALETTE[(particle + index) % PALETTE.length]);
        set('--spark-delay', `${index * 120 + (particle % 3) * 18}ms`);
        firework.appendChild(spark);
      }
      layer.appendChild(firework);
    }
    overlay = layer;
    activeKind = nextKind;
    document.body.appendChild(layer);
    timer = schedule(clear, reduced ? REDUCED_DURATION : DURATION);
    return true;
  }

  function onVisibilityChange() { if (document?.hidden) clear(); }
  document?.addEventListener?.('visibilitychange', onVisibilityChange);
  function dispose() {
    clear();
    disposed = true;
    document?.removeEventListener?.('visibilitychange', onVisibilityChange);
  }
  return { burst, clear, dispose };
}
