import { MAGIC_SHOP_CHAPTERS, MAGIC_SHOP_LEVELS, getMagicShopLevel, isMagicShopStateValid, isMagicShopSolved } from './magic-shop.js';

export const MAGIC_SHOP_STORAGE_KEY = 'mathwizard.magic-shop.v1';
const clone = value => JSON.parse(JSON.stringify(value));
const chapterLevels = chapter => MAGIC_SHOP_LEVELS.filter(level => level.chapter === chapter);
function unlocked(levelId, completed) {
  const level = getMagicShopLevel(levelId);
  if (!level) return false;
  const levels = chapterLevels(level.chapter), index = levels.indexOf(level);
  return index === 0 || completed.includes(levels[index - 1].id);
}
function contiguous(ids) {
  const requested = new Set(ids), clean = [];
  for (const chapter of MAGIC_SHOP_CHAPTERS) {
    for (const level of chapterLevels(chapter.id)) {
      if (!requested.has(level.id)) break;
      clean.push(level.id);
    }
  }
  return clean;
}

/** Anonymous progress; unavailable/corrupt storage keeps this session playable. */
export function createMagicShopStore(providedStorage) {
  let backend, persistent = true, error = null;
  let state = { completed: [], current: null };
  const fallback = reason => { persistent = false; error = reason; };
  try {
    backend = providedStorage === undefined ? globalThis.localStorage : providedStorage;
    if (!backend || typeof backend.getItem !== 'function' || typeof backend.setItem !== 'function') fallback('unavailable');
  } catch { fallback('unavailable'); }
  if (persistent) {
    let raw;
    try { raw = backend.getItem(MAGIC_SHOP_STORAGE_KEY); } catch { fallback('read'); }
    if (persistent && raw !== null) {
      try {
        if (typeof raw !== 'string' || raw.length > 20000) throw new TypeError('Invalid progress bytes');
        const saved = JSON.parse(raw);
        if (!saved || saved.schema !== 1 || !Array.isArray(saved.completed) || saved.completed.length > MAGIC_SHOP_LEVELS.length || !saved.completed.every(id => typeof id === 'string' && getMagicShopLevel(id)) || new Set(saved.completed).size !== saved.completed.length) throw new TypeError('Invalid progress');
        state.completed = contiguous(saved.completed);
        if (state.completed.length !== saved.completed.length) fallback('corrupt');
        if (saved.current !== null) {
          if (isMagicShopStateValid(saved.current) && unlocked(saved.current.levelId, state.completed)) state.current = clone(saved.current);
          else fallback('corrupt');
        }
      } catch { state = { completed: [], current: null }; fallback('corrupt'); }
    }
  }
  function persist() {
    if (!persistent) return;
    try { backend.setItem(MAGIC_SHOP_STORAGE_KEY, JSON.stringify({ schema: 1, ...state })); }
    catch { fallback('write'); }
  }
  return {
    status: () => ({ persistent, error }),
    read: () => clone(state),
    isUnlocked: levelId => unlocked(levelId, state.completed),
    saveCurrent(current) {
      if (current !== null && (!isMagicShopStateValid(current) || !unlocked(current.levelId, state.completed))) return false;
      state.current = current === null ? null : clone(current); persist(); return true;
    },
    complete(solvedState) {
      if (!isMagicShopSolved(solvedState) || !unlocked(solvedState.levelId, state.completed)) return false;
      if (!state.completed.includes(solvedState.levelId)) state.completed = contiguous([...state.completed, solvedState.levelId]);
      if (state.current?.levelId === solvedState.levelId) state.current = null;
      persist(); return true;
    },
  };
}
