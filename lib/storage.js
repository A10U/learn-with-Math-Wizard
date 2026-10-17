import { validateLearningState, validateScore, rankScores } from './engine.js';

export const STORAGE_KEYS = Object.freeze({ progress: 'mathwizard.app.progress.v1', scores: 'mathwizard.app.scores.v1' });
const clone = value => value === null ? null : JSON.parse(JSON.stringify(value));
const MAX_BYTES = 200_000;

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
    if (!Array.isArray(value) || value.length > 20) return null;
    const clean = value.map(validateScore);
    return clean.every(Boolean) ? clean : null;
  }) || [];

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
    writeScore(raw) {
      const clean = validateScore(raw);
      if (!clean) return { ...result(scores, false), message: 'รอบท้าทายนี้ไม่อยู่ในเงื่อนไขการจัดอันดับ' };
      scores = rankScores([...scores, clean]).slice(0, 20).map(validateScore);
      write(STORAGE_KEYS.scores, scores);
      return result(scores);
    },
  };
}
