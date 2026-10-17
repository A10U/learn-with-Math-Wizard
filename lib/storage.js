import { validateLearningState, validateScore, rankScores } from './engine.js';

export const STORAGE_KEYS = Object.freeze({ progress: 'mathwizard.app.progress.v1', scores: 'mathwizard.app.scores.v1', recent: 'mathwizard.app.recent.v1' });
const clone = value => value === null ? null : JSON.parse(JSON.stringify(value));
const MAX_BYTES = 200_000;
const validGrade = grade => Number.isInteger(grade) && grade >= 1 && grade <= 4;
const validSignature = value => typeof value === 'string' && value.length > 0 && value.length <= 160 && /^[a-z0-9:.-]+$/i.test(value);
const emptyRecent = () => ({ version: 1, selectedGrade: 1, grades: { 1: [], 2: [], 3: [], 4: [] } });
function validateRecent(value) {
  if (!value || value.version !== 1 || !validGrade(value.selectedGrade) || !value.grades || Array.isArray(value.grades)) return null;
  const clean = emptyRecent();
  clean.selectedGrade = value.selectedGrade;
  for (let grade = 1; grade <= 4; grade++) {
    const ids = value.grades[grade];
    if (!Array.isArray(ids) || ids.length > 40 || !ids.every(validSignature)) return null;
    clean.grades[grade] = [...new Set(ids)];
  }
  return clean;
}
function bestScores(rows) {
  const retained = [];
  const counts = new Map();
  for (const row of rankScores(rows)) {
    const key = `${row.deckId}:${row.deckVersion}:${row.grade}`;
    const count = counts.get(key) || 0;
    if (count < 20) { retained.push(validateScore(row)); counts.set(key, count + 1); }
  }
  return retained;
}

/** Anonymous, device-local records only. Never stores canvas images or child names. */
export function createStore(providedStorage) {
  let backend = null;
  let persistent = false;
  let progress = null;
  let scores = [];
  let message = 'เล่นได้ในครั้งนี้ แต่ปิดหน้าแล้วข้อมูลอาจหาย';
  try {
    backend = providedStorage === undefined ? globalThis.localStorage : providedStorage;
    persistent = Boolean(backend && typeof backend.getItem === 'function' && typeof backend.setItem === 'function' && typeof backend.removeItem === 'function');
    if (persistent) message = 'ข้อมูลการเรียนและอันดับเก็บเฉพาะเบราว์เซอร์นี้';
  } catch { persistent = false; }

  const result = (data, ok = true) => ({ data: clone(data), persistent, ok, message });
  const unavailable = () => {
    persistent = false;
    message = 'บันทึกถาวรไม่ได้ ข้อมูลใหม่อยู่เฉพาะระหว่างเปิดหน้านี้';
  };
  const read = (key, validate) => {
    if (!persistent) return null;
    try {
      const raw = backend.getItem(key);
      if (raw === null) return null;
      if (typeof raw !== 'string' || raw.length > MAX_BYTES) throw new Error('invalid');
      const data = validate(JSON.parse(raw));
      if (data === null) throw new Error('invalid');
      return data;
    } catch (error) {
      // Do not delete an old record silently. A new explicit save may replace it.
      message = 'ข้อมูลเดิมอ่านไม่ได้หรือเป็นคนละรุ่น เริ่มรอบใหม่ได้';
      return null;
    }
  };
  const write = (key, data) => {
    if (!persistent) return;
    try {
      backend.setItem(key, JSON.stringify(data));
      message = 'บันทึกบนเบราว์เซอร์นี้แล้ว';
    } catch { unavailable(); }
  };

  progress = read(STORAGE_KEYS.progress, validateLearningState);
  scores = read(STORAGE_KEYS.scores, value => {
    if (!Array.isArray(value) || value.length > 100) return null;
    const clean = value.map(validateScore);
    return clean.every(Boolean) ? bestScores(clean) : null;
  }) || [];
  const recent = read(STORAGE_KEYS.recent, validateRecent) || emptyRecent();

  return {
    readProgress: () => result(progress),
    writeProgress(raw) {
      const clean = validateLearningState(raw);
      if (!clean) return { ...result(null, false), message: 'ข้อมูลช่วงนี้ยังไม่ครบ จึงยังไม่บันทึกจุดเรียนต่อ' };
      progress = clean;
      write(STORAGE_KEYS.progress, progress);
      return result(progress);
    },
    clearProgress() {
      progress = null;
      if (persistent) {
        try { backend.removeItem(STORAGE_KEYS.progress); message = 'เริ่มประวัติการเรียนใหม่บนเครื่องนี้แล้ว'; }
        catch { unavailable(); message = 'ล้างได้เฉพาะครั้งนี้ เมื่อเปิดใหม่ข้อมูลเดิมอาจกลับมา'; }
      }
      return result(null);
    },
    readScores: () => result(scores),
    readGrade: () => result(recent.selectedGrade),
    writeGrade(grade) {
      if (!validGrade(grade)) return { ...result(recent.selectedGrade, false), message: 'เลือกชั้น ป.1–4' };
      recent.selectedGrade = grade;
      write(STORAGE_KEYS.recent, recent);
      return result(grade);
    },
    readRecent(grade) { return result(validGrade(grade) ? recent.grades[grade] : [], validGrade(grade)); },
    writeRecent(grade, signatures) {
      if (!validGrade(grade) || !Array.isArray(signatures) || signatures.length > 40 || !signatures.every(validSignature)) return result([], false);
      const added = [...new Set(signatures)];
      recent.grades[grade] = [...recent.grades[grade].filter(id => !added.includes(id)), ...added].slice(-40);
      write(STORAGE_KEYS.recent, recent);
      return result(recent.grades[grade]);
    },
    writeScore(raw) {
      const clean = validateScore(raw);
      if (!clean) return { ...result(scores, false), message: 'รอบท้าทายนี้ไม่อยู่ในเงื่อนไขการจัดอันดับ' };
      scores = bestScores([...scores, clean]);
      write(STORAGE_KEYS.scores, scores);
      return result(scores);
    },
  };
}
