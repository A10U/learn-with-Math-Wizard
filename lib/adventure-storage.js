import { ADVENTURE_VERSION, RULES_VERSION, LIMIT_MS, createForestStages, evaluateStage, adventureScore } from './adventure.js';

export const ADVENTURE_STORAGE_KEY = 'mathwizard.adventure.forest.v1';
const validGrade = grade => Number.isInteger(grade) && grade >= 1 && grade <= 6;
const clone = value => JSON.parse(JSON.stringify(value));
const compare = (a, b) => b.score - a.score || a.elapsedMs - b.elapsedMs || a.serial - b.serial;
const scoreFor = (correct, elapsedMs) => correct * 1000 + (correct > 0 ? Math.floor(99 * (LIMIT_MS - elapsedMs) / LIMIT_MS) : 0);
const validSerial = serial => Number.isInteger(serial) && serial > 0 && serial < 1e9;

function validEntry(entry) {
  return entry && typeof entry === 'object' && !Array.isArray(entry) && entry.campaign === 'forest' && validGrade(entry.grade) && entry.version === ADVENTURE_VERSION && entry.rulesVersion === RULES_VERSION && entry.limitMs === LIMIT_MS && validSerial(entry.serial) && Number.isInteger(entry.correct) && entry.correct >= 0 && entry.correct <= 5 && Number.isInteger(entry.elapsedMs) && entry.elapsedMs > 0 && entry.elapsedMs < LIMIT_MS && Number.isInteger(entry.score) && entry.score === scoreFor(entry.correct, entry.elapsedMs);
}
function cleanEntry(entry) {
  const { campaign, grade, version, rulesVersion, limitMs, serial, correct, elapsedMs, score } = entry;
  return { campaign, grade, version, rulesVersion, limitMs, serial, correct, elapsedMs, score };
}
function ranksFor(entries, grade) {
  let rank = 0;
  const rows = entries.filter(entry => entry.grade === grade).sort(compare);
  return rows.map((entry, index) => {
    if (index === 0 || entry.score !== rows[index - 1].score || entry.elapsedMs !== rows[index - 1].elapsedMs) rank = index + 1;
    return { ...entry, rank };
  });
}
function bounded(entries) {
  return Array.from({ length: 6 }, (_, index) => entries.filter(entry => entry.grade === index + 1).sort(compare).slice(0, 10)).flat();
}
function emptyState() {
  return { schema: 1, version: ADVENTURE_VERSION, rulesVersion: RULES_VERSION, limitMs: LIMIT_MS, nextSerial: 1, progress: Object.fromEntries(Array.from({ length: 6 }, (_, index) => [index + 1, 0])), ranks: [] };
}
function validateState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schema !== 1 || value.version !== ADVENTURE_VERSION || value.rulesVersion !== RULES_VERSION || value.limitMs !== LIMIT_MS || !validSerial(value.nextSerial) || !value.progress || typeof value.progress !== 'object' || Array.isArray(value.progress) || !Array.isArray(value.ranks) || value.ranks.length > 60 || !value.ranks.every(validEntry)) return null;
  const state = emptyState();
  for (let grade = 1; grade <= 6; grade++) {
    if (!Object.hasOwn(value.progress, grade) || !Number.isInteger(value.progress[grade]) || value.progress[grade] < 0 || value.progress[grade] > 5) return null;
    state.progress[grade] = value.progress[grade];
    if (value.ranks.filter(entry => entry.grade === grade).length > 10) return null;
  }
  const serials = new Set(value.ranks.map(entry => entry.serial));
  if (serials.size !== value.ranks.length || value.ranks.some(entry => entry.serial >= value.nextSerial)) return null;
  state.nextSerial = value.nextSerial;
  state.ranks = value.ranks.map(cleanEntry);
  return state;
}

/** Separate anonymous forest records; corrupt data stays untouched on disk. */
export function createAdventureStore(providedStorage) {
  let backend, state = emptyState(), storageStatus = 'saved';
  const recordedRuns = new WeakSet();
  try {
    backend = providedStorage === undefined ? globalThis.localStorage : providedStorage;
    if (!backend || typeof backend.getItem !== 'function' || typeof backend.setItem !== 'function') storageStatus = 'memory';
  } catch { storageStatus = 'memory'; }
  if (storageStatus === 'saved') {
    let raw;
    try { raw = backend.getItem(ADVENTURE_STORAGE_KEY); }
    catch { storageStatus = 'memory'; }
    if (storageStatus === 'saved' && raw !== null) {
      try {
        if (typeof raw !== 'string' || raw.length > 100000) throw new Error('invalid');
        const loaded = validateState(JSON.parse(raw));
        if (!loaded) throw new Error('invalid');
        state = loaded;
      } catch { storageStatus = 'corrupt'; }
    }
  }
  function persist() {
    if (storageStatus !== 'saved') return;
    try { backend.setItem(ADVENTURE_STORAGE_KEY, JSON.stringify(state)); }
    catch { storageStatus = 'memory'; }
  }
  function assertGrade(grade) { if (!validGrade(grade)) throw new RangeError('grade must be 1–6'); }
  return {
    status: () => storageStatus,
    readProgress(grade) { assertGrade(grade); return state.progress[grade]; },
    saveProgress(grade, cleared) {
      assertGrade(grade);
      if (!Number.isInteger(cleared) || cleared < 0 || cleared > 5) throw new RangeError('cleared must be 0–5');
      if (cleared > state.progress[grade]) { state.progress[grade] = cleared; persist(); }
      return state.progress[grade];
    },
    readRanks(grade) { assertGrade(grade); return clone(ranksFor(state.ranks, grade)); },
    addRank(run) {
      if (!run || typeof run !== 'object' || recordedRuns.has(run) || run.campaign !== 'forest' || run.version !== ADVENTURE_VERSION || run.rulesVersion !== RULES_VERSION || !validGrade(run.grade) || run.mode !== 'ranked' || run.finished !== true || run.expired !== false || run.index !== 4 || !Array.isArray(run.results) || run.results.length !== 5 || !Number.isInteger(run.elapsedMs) || run.elapsedMs <= 0 || run.elapsedMs >= LIMIT_MS || !Number.isFinite(run.startedAt) || run.startedAt < 0 || !Number.isFinite(run.lastNow) || run.lastNow < run.startedAt || run.deadline !== run.startedAt + LIMIT_MS || run.lastNow >= run.deadline || run.elapsedMs !== Math.max(1, Math.floor(run.lastNow - run.startedAt)) || state.nextSerial >= 999999999) return false;
      const stages = createForestStages(run.grade);
      if (!run.results.every((result, index) => result && result.submitted === true && typeof result.correct === 'boolean' && result.attempts === 1 && result.hinted === false && evaluateStage(stages[index], result.selection).valid && evaluateStage(stages[index], result.selection).correct === result.correct)) return false;
      const correct = run.results.filter(result => result.correct).length;
      const entry = { campaign: 'forest', grade: run.grade, version: ADVENTURE_VERSION, rulesVersion: RULES_VERSION, limitMs: LIMIT_MS, serial: state.nextSerial++, correct, elapsedMs: run.elapsedMs, score: adventureScore(run) };
      if (!validEntry(entry)) return false;
      const ranked = ranksFor([...state.ranks, entry], run.grade).find(item => item.serial === entry.serial);
      state.ranks = bounded([...state.ranks, entry]); recordedRuns.add(run); persist();
      return clone(ranked);
    },
  };
}
