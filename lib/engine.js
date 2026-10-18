import { MISSION_ID, CONTENT_VERSION, MISSION, CHALLENGE_DECK } from './content.js';
import { QUESTION_PROFILE_VERSION, WRITING_PROFILE_VERSION } from './questions.js';

const MAX_NUMBER = 10_000_000;
const MAX_ATTEMPTS = 10_000;
const MAX_TIME = 31_536_000_000;
const STEPS = ['story', 'model', 'equation', 'answer', 'trace', 'write', 'explain', 'transfer', 'summary'];
const ANSWER_KEYS = ['story', 'equation', 'base', 'explanation', 'transfer'];
const EXPECTED = { story: MISSION.storyExpected, equation: MISSION.equationExpected, base: MISSION.baseExpected, explanation: MISSION.explanationExpected, transfer: MISSION.transfer.expected };
const ownObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const numeric = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_NUMBER;
const equal = (left, right) => Math.abs(left - right) <= 1e-10;

/** Positive/zero decimal or a/b only. Whitespace may surround a token or slash. */
export function parseNumber(raw, { integerOnly = false } = {}) {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const input = String(raw);
  if (input.length > 64) return null;
  const clean = input.trim().replace(/[๐-๙]/g, character => String(character.charCodeAt(0) - 0x0e50));
  const match = clean.match(/^(\d{1,8}(?:\.\d{1,8})?)(?:\s*\/\s*(\d{1,8}(?:\.\d{1,8})?))?$/);
  if (!match) return null;
  const numerator = Number(match[1]);
  const denominator = match[2] === undefined ? 1 : Number(match[2]);
  if (denominator <= 0 || numerator > MAX_NUMBER || denominator > MAX_NUMBER) return null;
  const value = numerator / denominator;
  if (!numeric(value) || (integerOnly && !Number.isInteger(value))) return null;
  return value;
}

export function newAttempt() {
  return { firstAnswer: null, firstCorrect: null, hintBeforeFirst: 0, answer: null, correct: false, validCount: 0, independent: false };
}

/** Invalid input never consumes an attempt. First valid response is immutable. */
export function recordAttempt(previous, raw, expected, { hintLevel = 0, integerOnly = true } = {}) {
  const answer = parseNumber(raw, { integerOnly });
  const target = parseNumber(expected, { integerOnly });
  const prior = sanitizeAttempt(previous, target) || newAttempt();
  if (answer === null || target === null || !integer(hintLevel, 0, 3) || prior.validCount >= MAX_ATTEMPTS) {
    return { valid: false, correct: false, attempt: { ...prior } };
  }
  const correct = equal(answer, target);
  const first = prior.validCount === 0;
  const attempt = {
    firstAnswer: first ? answer : prior.firstAnswer,
    firstCorrect: first ? correct : prior.firstCorrect,
    hintBeforeFirst: first ? hintLevel : prior.hintBeforeFirst,
    answer,
    correct,
    validCount: prior.validCount + 1,
    independent: first ? correct && hintLevel === 0 : prior.independent,
  };
  return { valid: true, correct, attempt };
}

function sanitizeAttempt(raw, expected) {
  if (!ownObject(raw) || !integer(raw.validCount, 0, MAX_ATTEMPTS) || !integer(raw.hintBeforeFirst, 0, 3)) return null;
  if (raw.validCount === 0) {
    if (raw.firstAnswer !== null || raw.firstCorrect !== null || raw.answer !== null || raw.correct !== false || raw.independent !== false || raw.hintBeforeFirst !== 0) return null;
    return newAttempt();
  }
  if (!numeric(raw.firstAnswer) || !numeric(raw.answer) || typeof raw.firstCorrect !== 'boolean' || typeof raw.correct !== 'boolean' || typeof raw.independent !== 'boolean') return null;
  if (expected === null || raw.firstCorrect !== equal(raw.firstAnswer, expected) || raw.correct !== equal(raw.answer, expected)) return null;
  const independent = raw.firstCorrect && raw.hintBeforeFirst === 0;
  if (raw.independent !== independent) return null;
  if (raw.validCount === 1 && (!equal(raw.firstAnswer, raw.answer) || raw.firstCorrect !== raw.correct)) return null;
  return { firstAnswer: raw.firstAnswer, firstCorrect: raw.firstCorrect, hintBeforeFirst: raw.hintBeforeFirst, answer: raw.answer, correct: raw.correct, validCount: raw.validCount, independent };
}

export function createLearningState() {
  return {
    missionId: MISSION_ID, version: CONTENT_VERSION, step: 'story', moved: 0,
    answers: Object.fromEntries(ANSWER_KEYS.map(key => [key, newAttempt()])),
    hints: { base: 0, transfer: 0 },
    writing: { attempted: false, skipped: false, confirmed: null, traceDone: false },
    completed: false, updatedAt: Date.now(),
  };
}

/** Validate checkpoints, never execute or trust unknown storage properties. */
export function validateLearningState(raw) {
  if (!ownObject(raw) || raw.missionId !== MISSION_ID || raw.version !== CONTENT_VERSION || !STEPS.includes(raw.step)) return null;
  if (!integer(raw.moved, 0, MISSION.model.maxMoved) || !ownObject(raw.answers) || !ownObject(raw.hints) || !ownObject(raw.writing)) return null;
  if (!integer(raw.updatedAt, 0, 8_640_000_000_000_000) || typeof raw.completed !== 'boolean') return null;
  const answers = {};
  for (const key of ANSWER_KEYS) {
    answers[key] = sanitizeAttempt(raw.answers[key], EXPECTED[key]);
    if (!answers[key]) return null;
    if (['story', 'equation', 'explanation'].includes(key) && answers[key].validCount > 0 && (!integer(answers[key].firstAnswer, 0, 2) || !integer(answers[key].answer, 0, 2))) return null;
    if (['base', 'transfer'].includes(key) && answers[key].validCount > 0 && (!Number.isInteger(answers[key].firstAnswer) || !Number.isInteger(answers[key].answer))) return null;
  }
  if (!integer(raw.hints.base, 0, 3) || !integer(raw.hints.transfer, 0, 3)) return null;
  if (answers.base.hintBeforeFirst > raw.hints.base || answers.transfer.hintBeforeFirst > raw.hints.transfer) return null;
  const w = raw.writing;
  if (typeof w.attempted !== 'boolean' || typeof w.skipped !== 'boolean' || typeof w.traceDone !== 'boolean' || (w.confirmed !== null && !integer(w.confirmed, 0, 99))) return null;
  if (w.confirmed !== null && !w.attempted) return null;
  // A checkpoint may go back to an earlier screen, but later evidence must
  // still have the required earlier evidence and a conserved model behind it.
  if (raw.moved > 0 && !answers.story.correct) return null;
  if (answers.equation.validCount > 0 && (!answers.story.correct || raw.moved !== MISSION.model.maxMoved)) return null;
  if (answers.base.validCount > 0 && !answers.equation.correct) return null;
  if (answers.explanation.validCount > 0 && !answers.base.correct) return null;
  if (answers.transfer.validCount > 0 && !answers.explanation.correct) return null;
  if ((w.attempted || w.skipped || w.traceDone || w.confirmed !== null) && !answers.base.correct) return null;
  if (raw.hints.base > 0 && !answers.equation.correct) return null;
  if (raw.hints.transfer > 0 && !answers.explanation.correct) return null;
  const position = STEPS.indexOf(raw.step);
  if (position >= 1 && !answers.story.correct) return null;
  if (position >= 2 && raw.moved !== MISSION.model.maxMoved) return null;
  if (position >= 3 && !answers.equation.correct) return null;
  if (position >= 4 && !answers.base.correct) return null;
  if (position >= 7 && !answers.explanation.correct) return null;
  if (raw.step === 'summary' && (!answers.transfer.correct || !raw.completed)) return null;
  if (raw.step !== 'summary' && raw.completed) return null;
  return {
    missionId: MISSION_ID, version: CONTENT_VERSION, step: raw.step, moved: raw.moved,
    answers, hints: { base: raw.hints.base, transfer: raw.hints.transfer },
    writing: { attempted: w.attempted, skipped: w.skipped, confirmed: w.confirmed, traceDone: w.traceDone },
    completed: raw.completed, updatedAt: raw.updatedAt,
  };
}

/** Clamp an integer move so two groups always contain the original 14 lights. */
export function makeTenMove(moved, delta) {
  const current = integer(moved, 0, MISSION.model.maxMoved) ? moved : 0;
  if (!Number.isSafeInteger(delta)) return current;
  return Math.min(MISSION.model.maxMoved, Math.max(0, current + delta));
}

export function validateScore(raw) {
  if (!ownObject(raw) || !integer(raw.grade, 1, 6) || raw.total !== 5) return null;
  const legacy = raw.grade === 1 && raw.deckId === CHALLENGE_DECK.id && raw.deckVersion === CHALLENGE_DECK.version;
  const random = raw.deckId === `g${raw.grade}-random` && [QUESTION_PROFILE_VERSION, WRITING_PROFILE_VERSION].includes(raw.deckVersion);
  if (!legacy && !random) return null;
  if (!integer(raw.correct, 0, 5) || !integer(raw.elapsedMs, 0, MAX_TIME) || !integer(raw.completedAt, 0, 8_640_000_000_000_000)) return null;
  return { deckId: raw.deckId, deckVersion: raw.deckVersion, grade: raw.grade, total: 5, correct: raw.correct, elapsedMs: raw.elapsedMs, completedAt: raw.completedAt };
}

/** Local ranking only; completedAt never breaks an exact accuracy/time tie. */
export function rankScores(scores, { grade, deckId, deckVersion } = {}) {
  if (!Array.isArray(scores)) return [];
  const valid = scores.slice(0, 1000).map(validateScore).filter(row => row &&
    (grade === undefined || row.grade === grade) &&
    (deckId === undefined || row.deckId === deckId) &&
    (deckVersion === undefined || row.deckVersion === deckVersion));
  valid.sort((left, right) => right.correct - left.correct || left.elapsedMs - right.elapsedMs);
  let rank = 0;
  return valid.map((row, index) => {
    if (index === 0 || row.correct !== valid[index - 1].correct || row.elapsedMs !== valid[index - 1].elapsedMs) rank = index + 1;
    return { ...row, rank };
  });
}
