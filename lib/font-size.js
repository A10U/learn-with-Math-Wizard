export const FONT_SIZE_KEY = 'mathwizard.app.font-size.v1';
export const FONT_SIZE_OPTIONS = Object.freeze([100, 110, 125, 150, 175, 200]);

function supportedPercent(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const number = Number(value);
  if (typeof value === 'string' && value !== String(number)) return null;
  return FONT_SIZE_OPTIONS.includes(number) ? number : null;
}

/** A text-size preference independent of learning progress and language. */
export function createFontSizeController({ document = globalThis.document, storage } = {}) {
  let percent = 100, initialized = false, storageResolved = false, backend;
  const getStorage = () => {
    if (!storageResolved) {
      storageResolved = true;
      try { backend = storage === undefined ? globalThis.localStorage : storage; } catch { backend = null; }
    }
    return backend;
  };
  const find = id => document?.getElementById?.(id);
  const render = () => {
    const root = document?.documentElement;
    root?.style?.setProperty?.('--mw-font-scale', String(percent / 100));
    root?.setAttribute?.('data-font-scale', String(percent));
    const select = find('font-size-percent');
    if (select) select.value = String(percent);
  };
  const notifyResize = () => {
    // Existing handwriting boards redraw from normalized strokes on resize.
    const view = document?.defaultView || globalThis.window;
    const ResizeEvent = view?.Event || globalThis.Event;
    if (typeof view?.dispatchEvent !== 'function' || typeof ResizeEvent !== 'function') return;
    try { view.dispatchEvent(new ResizeEvent('resize')); } catch { /* A partial DOM needs no canvas refresh. */ }
  };
  function initialize() {
    if (initialized) return percent;
    initialized = true;
    try { percent = supportedPercent(getStorage()?.getItem?.(FONT_SIZE_KEY)) ?? 100; } catch { percent = 100; }
    render();
    find('font-size-percent')?.addEventListener?.('change', event => {
      if (!setPercent(event?.target?.value ?? find('font-size-percent')?.value)) render();
    });
    find('font-size-reset')?.addEventListener?.('click', reset);
    if (percent !== 100) notifyResize();
    return percent;
  }
  function setPercent(value) {
    const next = supportedPercent(value);
    if (next === null) return false;
    if (!initialized) initialize();
    const changed = next !== percent;
    percent = next;
    render();
    try { getStorage()?.setItem?.(FONT_SIZE_KEY, String(percent)); } catch { /* The preference still works for this visit. */ }
    if (changed) notifyResize();
    return true;
  }
  function reset() { return setPercent(100); }
  return { initialize, setPercent, reset, getPercent: () => percent };
}
