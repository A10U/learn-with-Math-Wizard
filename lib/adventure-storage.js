import { ADVENTURE_CAMPAIGNS, ADVENTURE_VERSION, RULES_VERSION, LIMIT_MS, getCampaignInfo, getCampaignChapterCount, getRankedStageCount, createCampaignStages, evaluateStage, adventureScore } from './adventure.js';

export const ADVENTURE_STORAGE_KEY = 'mathwizard.adventure.campaigns.v2';
export const LEGACY_ADVENTURE_STORAGE_KEY = 'mathwizard.adventure.forest.v1';
const MAX_ROWS = ADVENTURE_CAMPAIGNS.reduce((total, info) => total + getCampaignChapterCount(info.id) * 6 * 10 * new Set([info.rulesVersion, info.legacyRulesVersion].filter(Boolean)).size, 0);
const validGrade = grade => Number.isInteger(grade) && grade >= 1 && grade <= 6;
const clone = value => JSON.parse(JSON.stringify(value));
const compare = (a, b) => b.score - a.score || a.elapsedMs - b.elapsedMs || a.serial - b.serial;
const validSerial = serial => Number.isInteger(serial) && serial > 0 && serial < 1e9;
const keyFor = entry => `${entry.campaign}:${entry.grade}:${entry.chapter}:${entry.rulesVersion}`;
const scoreFor = (correct, elapsedMs, limitMs) => correct * 1000 + (correct > 0 ? Math.floor(99 * (limitMs - elapsedMs) / limitMs) : 0);
function validEntry(entry) {
  const info = entry && getCampaignInfo(entry.campaign);
  return !!info && validGrade(entry.grade) && entry.version === info.version && [info.rulesVersion, info.legacyRulesVersion].filter(Boolean).includes(entry.rulesVersion) && entry.limitMs === info.limitMs && Number.isInteger(entry.chapter) && entry.chapter >= 1 && entry.chapter <= getCampaignChapterCount(entry.campaign) && validSerial(entry.serial) && Number.isInteger(entry.correct) && entry.correct >= 0 && entry.correct <= getRankedStageCount(entry.campaign) && Number.isInteger(entry.elapsedMs) && entry.elapsedMs > 0 && entry.elapsedMs < entry.limitMs && Number.isInteger(entry.score) && entry.score === scoreFor(entry.correct, entry.elapsedMs, entry.limitMs);
}
function cleanEntry(entry) {
  const { campaign, grade, chapter, version, rulesVersion, limitMs, serial, correct, elapsedMs, score } = entry;
  return { campaign, grade, chapter, version, rulesVersion, limitMs, serial, correct, elapsedMs, score };
}
function ranksFor(entries, grade, campaign, chapter) {
  const rows = entries.filter(entry => entry.grade === grade && entry.campaign === campaign && entry.chapter === chapter && entry.rulesVersion === getCampaignInfo(campaign)?.rulesVersion).sort(compare);
  let rank = 0;
  return rows.map((entry, index) => {
    if (index === 0 || entry.score !== rows[index - 1].score || entry.elapsedMs !== rows[index - 1].elapsedMs) rank = index + 1;
    return { ...entry, rank };
  });
}
function bounded(entries) {
  const groups = new Map();
  for (const entry of entries) { const key = keyFor(entry); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(entry); }
  return [...groups.values()].flatMap(rows => rows.sort(compare).slice(0, 10));
}
function emptyState() {
  return { schema: 2, version: 'campaigns-v2', nextSerial: 1, progress: Object.fromEntries(ADVENTURE_CAMPAIGNS.map(campaign => [campaign.id, Object.fromEntries(Array.from({ length: 6 }, (_, index) => [index + 1, 0]))])), ranks: [] };
}
function validateState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schema !== 2 || value.version !== 'campaigns-v2' || !validSerial(value.nextSerial) || !value.progress || typeof value.progress !== 'object' || Array.isArray(value.progress) || !Array.isArray(value.ranks) || value.ranks.length > MAX_ROWS || !value.ranks.every(validEntry)) return null;
  const state = emptyState();
  for (const campaign of ADVENTURE_CAMPAIGNS) {
    // Older saves predate the optional moon and star journeys. Only absent
    // new buckets may default to zero; malformed saved data is rejected.
    if (['moon-maze', 'star-expanse'].includes(campaign.id) && !Object.hasOwn(value.progress, campaign.id)) continue;
    const progress = value.progress[campaign.id];
    if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return null;
    for (let grade = 1; grade <= 6; grade++) {
      if (!Object.hasOwn(progress, grade) || !Number.isInteger(progress[grade]) || progress[grade] < 0 || progress[grade] > campaign.stageCount) return null;
      state.progress[campaign.id][grade] = progress[grade];
    }
  }
  const serials = new Set(value.ranks.map(entry => entry.serial));
  if (serials.size !== value.ranks.length || value.ranks.some(entry => entry.serial >= value.nextSerial) || bounded(value.ranks).length !== value.ranks.length) return null;
  state.nextSerial = value.nextSerial; state.ranks = value.ranks.map(cleanEntry);
  return state;
}
function migrateLegacy(value) {
  if (!value || value.schema !== 1 || value.version !== ADVENTURE_VERSION || ![RULES_VERSION, 'forest-rules-v1'].includes(value.rulesVersion) || value.limitMs !== LIMIT_MS || !validSerial(value.nextSerial) || !value.progress || Array.isArray(value.progress) || !Array.isArray(value.ranks) || value.ranks.length > 60) return null;
  const state = emptyState();
  for (let grade = 1; grade <= 6; grade++) {
    if (!Object.hasOwn(value.progress, grade) || !Number.isInteger(value.progress[grade]) || value.progress[grade] < 0 || value.progress[grade] > 5) return null;
    state.progress.forest[grade] = value.progress[grade];
  }
  state.nextSerial = value.nextSerial;
  state.ranks = value.ranks.map(entry => ({ ...entry, chapter: 1 }));
  if (state.ranks.some(entry => entry.campaign !== 'forest')) return null;
  return validateState(state);
}

/** Anonymous local campaign records. Old forest bytes are retained during migration. */
export function createAdventureStore(providedStorage) {
  let backend, state = emptyState(), storageStatus = 'saved';
  const recordedRuns = new WeakSet();
  try {
    backend = providedStorage === undefined ? globalThis.localStorage : providedStorage;
    if (!backend || typeof backend.getItem !== 'function' || typeof backend.setItem !== 'function') storageStatus = 'memory';
  } catch { storageStatus = 'memory'; }
  if (storageStatus === 'saved') {
    try {
      const current = backend.getItem(ADVENTURE_STORAGE_KEY);
      const raw = current === null ? backend.getItem(LEGACY_ADVENTURE_STORAGE_KEY) : current;
      if (raw !== null) {
        if (typeof raw !== 'string' || raw.length > 2000000) storageStatus = 'corrupt';
        else {
          try {
            const loaded = current === null ? migrateLegacy(JSON.parse(raw)) : validateState(JSON.parse(raw));
            if (!loaded) storageStatus = 'corrupt'; else state = loaded;
          } catch { storageStatus = 'corrupt'; }
        }
      }
    } catch { storageStatus = 'memory'; }
  }
  function persist() {
    if (storageStatus !== 'saved') return;
    try { backend.setItem(ADVENTURE_STORAGE_KEY, JSON.stringify(state)); } catch { storageStatus = 'memory'; }
  }
  function scope(grade, campaign, chapter = 1) {
    const info = getCampaignInfo(campaign);
    if (!validGrade(grade) || !info || !Number.isInteger(chapter) || chapter < 1 || chapter > getCampaignChapterCount(campaign)) throw new RangeError('invalid campaign, grade or chapter');
    return info;
  }
  return {
    status: () => storageStatus,
    readProgress(grade, campaign = 'forest') { scope(grade, campaign); return state.progress[campaign][grade]; },
    readAllProgress(grade) { scope(grade, 'forest'); return Object.fromEntries(ADVENTURE_CAMPAIGNS.map(campaign => [campaign.id, state.progress[campaign.id][grade]])); },
    saveProgress(grade, cleared, campaign = 'forest') {
      const info = scope(grade, campaign);
      if (!Number.isInteger(cleared) || cleared < 0 || cleared > info.stageCount) throw new RangeError('invalid checkpoint');
      if (cleared > state.progress[campaign][grade]) { state.progress[campaign][grade] = cleared; persist(); }
      return state.progress[campaign][grade];
    },
    readRanks(grade, campaign = 'forest', chapter = 1) { scope(grade, campaign, chapter); return clone(ranksFor(state.ranks, grade, campaign, chapter)); },
    addRank(run) {
      const info = run && getCampaignInfo(run.campaign);
      const count = info ? getRankedStageCount(run.campaign) : 0;
      const offset = info && getCampaignChapterCount(run.campaign) > 1 ? (run.chapter - 1) * count : 0;
      if (!info || recordedRuns.has(run) || run.version !== info.version || run.rulesVersion !== info.rulesVersion || !validGrade(run.grade) || run.mode !== 'ranked' || run.finished !== true || run.expired !== false || !Number.isInteger(run.chapter) || run.chapter < 1 || run.chapter > getCampaignChapterCount(run.campaign) || run.stageOffset !== offset || run.totalStages !== info.stageCount || run.limitMs !== info.limitMs || run.index !== count - 1 || !Array.isArray(run.results) || run.results.length !== count || !Array.isArray(run.stages) || run.stages.length !== count || !Number.isInteger(run.elapsedMs) || run.elapsedMs <= 0 || run.elapsedMs >= info.limitMs || !Number.isFinite(run.startedAt) || run.startedAt < 0 || !Number.isFinite(run.lastNow) || run.lastNow < run.startedAt || run.deadline !== run.startedAt + info.limitMs || run.lastNow >= run.deadline || run.elapsedMs !== Math.max(1, Math.floor(run.lastNow - run.startedAt)) || state.nextSerial >= 999999999) return false;
      const stages = createCampaignStages(run.campaign, run.grade).slice(offset, offset + count);
      if (!run.results.every((result, index) => result && result.submitted === true && typeof result.correct === 'boolean' && result.attempts === 1 && result.hinted === false && evaluateStage(stages[index], result.selection).valid && evaluateStage(stages[index], result.selection).correct === result.correct)) return false;
      const correct = run.results.filter(result => result.correct).length;
      const entry = { campaign: run.campaign, grade: run.grade, chapter: run.chapter, version: info.version, rulesVersion: info.rulesVersion, limitMs: info.limitMs, serial: state.nextSerial++, correct, elapsedMs: run.elapsedMs, score: adventureScore(run) };
      if (!validEntry(entry)) return false;
      const ranked = ranksFor([...state.ranks, entry], run.grade, run.campaign, run.chapter).find(item => item.serial === entry.serial);
      state.ranks = bounded([...state.ranks, entry]); recordedRuns.add(run); persist();
      return clone(ranked);
    },
  };
}
