// A second, more demanding help-free campaign. Keep question-bank solutions
// outside the playable payload, and use language-independent seeds throughout.
import { createQuestionRound, GRADE_PROFILES, localizeQuestion } from './questions.js';

export const STAR_EXPANSE_STAGE_COUNT = 1000;
export const STAR_EXPANSE_STAGES_PER_STAR = 40;
export const STAR_EXPANSE_STARS = Object.freeze(Array.from({ length: 25 }, (_, index) => Object.freeze({
  id: index + 1,
  title: Object.freeze({ th: `ดวงที่ ${index + 1}`, en: `Star ${index + 1}` }),
})));

const rounded = value => Math.round(value * 1000000) / 1000000;
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const integer = (rng, low, high) => low + Math.floor(rng() * (high - low + 1));

function stageRandom(key) {
  let state = 2166136261;
  for (const character of key) state = Math.imul(state ^ character.charCodeAt(0), 16777619) >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

function shuffled(values, rng) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = integer(rng, 0, index);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function answerParts(answer) {
  const text = String(answer).trim(), fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction && Number(fraction[2]) > 0) return { numerator: Number(fraction[1]), denominator: Number(fraction[2]), fraction: true };
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new RangeError('Star expanse questions require nonnegative numeric answers');
  const denominator = 10 ** (text.split('.')[1] ?? '').length;
  return { numerator: Math.round(Number(text) * denominator), denominator, fraction: false };
}

function answerLabel(numerator, denominator, asFraction = false) {
  if (!asFraction) return String(rounded(numerator / denominator));
  const common = gcd(numerator, denominator);
  return denominator / common === 1 ? String(numerator / common) : `${numerator / common}/${denominator / common}`;
}

// Some geometry topics have a small finite pool. Once a topic cannot provide
// five unused bank questions, continue to the next topic instead of repeating
// a problem or changing its ID. Large procedural pools fill the remaining slots.
function freshBankQuestion(base, ordinal, usedQuestionIds, usedPrompts, exhaustedTopics) {
  const topics = GRADE_PROFILES[base.sourceGrade - 1].topics;
  for (let offset = 0; offset < topics.length; offset++) {
    const topic = topics[(ordinal + offset) % topics.length];
    if (exhaustedTopics.has(topic)) continue;
    for (let attempt = 0; attempt < 32; attempt++) {
      const sourceSeed = `${base.id}:source-g${base.sourceGrade}:${topic}:try${attempt}`;
      let q;
      try {
        q = createQuestionRound(base.sourceGrade, { rng: stageRandom(sourceSeed), topic, excludeIds: [...usedQuestionIds] }).questions[0];
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        exhaustedTopics.add(topic);
        break;
      }
      if (usedPrompts.has(q.prompt)) continue;
      usedQuestionIds.add(q.id);
      usedPrompts.add(q.prompt);
      return { q, sourceSeed, topic };
    }
  }
  throw new RangeError('Star expanse requires 800 distinct curriculum questions');
}

function questionStage(base, grade, ordinal, language, usedQuestionIds, usedPrompts, exhaustedTopics) {
  const source = freshBankQuestion(base, ordinal, usedQuestionIds, usedPrompts, exhaustedTopics);
  const q = localizeQuestion(source.q, language);
  let { numerator, denominator, fraction } = answerParts(q.answer);
  const transforms = grade < 5 ? [] : grade === 5
    ? [{ operation: ordinal % 2 === 0 ? 'add' : 'multiply', operand: ordinal % 2 === 0 ? 2 + ordinal % 13 : 2 + ordinal % 7 }]
    : ordinal % 2 === 0
      ? [{ operation: 'add', operand: 2 + ordinal % 13 }, { operation: 'multiply', operand: 2 + ordinal % 7 }]
      : [{ operation: 'multiply', operand: 2 + ordinal % 7 }, { operation: 'add', operand: 2 + ordinal % 13 }];
  let expression = 'x';
  transforms.forEach((transform, index) => {
    numerator = transform.operation === 'add' ? numerator + transform.operand * denominator : numerator * transform.operand;
    expression = `${index > 0 ? `(${expression})` : expression} ${transform.operation === 'add' ? '+' : '×'} ${transform.operand}`;
  });
  const prompt = transforms.length === 0 ? q.prompt : language === 'en'
    ? `Let x be the numerical answer to this problem, without its unit: ${q.prompt}\nThe star gate code is ${expression}. Choose the star gate code.`
    : `กำหนดให้ x เป็นค่าตัวเลขของคำตอบโจทย์ต่อไปนี้ โดยไม่นำหน่วยมาใช้: ${q.prompt}\nรหัสประตูดาราคือ ${expression} จงเลือกรหัสประตู`;
  const rng = stageRandom(`${base.id}:choices`);
  const wrong = shuffled([-1, 1, -2, 2, -3, 3, -4, 4], rng).filter(difference => numerator + difference >= 0).slice(0, 3).map(difference => numerator + difference);
  const correctIndex = integer(rng, 0, 3);
  let wrongIndex = 0;
  const options = Array.from({ length: 4 }, (_, index) => {
    const top = index === correctIndex ? numerator : wrong[wrongIndex++];
    return { id: `${base.id}-o${index}`, label: answerLabel(top, denominator, fraction), value: top / denominator };
  });
  return { ...base, kind: 'choice', prompt, topic: source.topic, sourceTopic: source.topic,
    sourceQuestionId: q.id, questionId: q.id, sourceSeed: source.sourceSeed, transforms,
    ...(q.visual ? { visual: structuredClone(q.visual) } : {}), options, correctId: options[correctIndex].id };
}

function orderStage(base, grade, language) {
  const sequence = Math.floor((base.globalStage - 1) / 10) + 1;
  const rng = stageRandom(`${base.id}:order`);
  let values;
  if (grade <= 2) {
    const starting = grade === 1 ? 10000 + sequence * 317 : 1000000 + sequence * 7193;
    const intervals = grade === 1 ? [31, 405, 1234, 2999, 5003] : [111, 2709, 10997, 30103, 70001];
    values = shuffled(intervals, rng).map(interval => ({ label: String(starting + interval), value: starting + interval }));
  } else {
    const fractions = [[3, 7], [4, 9], [5, 11], [6, 13], [7, 15]];
    values = fractions.map(([top, bottom], index) => {
      const whole = sequence + (index % 2);
      if (grade === 3) return { label: answerLabel(whole * bottom + top, bottom, true), value: whole + top / bottom };
      const multiplier = 2 + index;
      if (grade === 4) return { label: `(${top}/${bottom} × ${multiplier}) + ${whole}`, value: top * multiplier / bottom + whole };
      const offset = 2 + sequence % 7;
      if (grade === 5) return { label: `(${top}/${bottom} + ${whole}) × ${multiplier}`, value: (top / bottom + whole) * multiplier };
      return { label: `((${top}/${bottom} + ${whole}) × ${multiplier}) + ${offset}`, value: (top / bottom + whole) * multiplier + offset };
    });
  }
  const descending = sequence % 2 === 0;
  const options = shuffled(values.map((value, index) => ({ id: `${base.id}-card${index}`, ...value })), rng);
  const direction = language === 'en' ? descending ? 'largest to smallest' : 'smallest to largest' : descending ? 'มากไปน้อย' : 'น้อยไปมาก';
  const labels = options.map(option => option.label).join('; ');
  const prompt = language === 'en'
    ? `Arrange all five star tablets from ${direction}: ${labels}.${grade >= 4 ? ' Evaluate each expression before comparing its value.' : ''}`
    : `เรียงแผ่นดาราทั้ง 5 แผ่นจาก${direction}: ${labels}${grade >= 4 ? ' คำนวณค่าของแต่ละนิพจน์ก่อนเปรียบเทียบ' : ''}`;
  return { ...base, kind: 'order', prompt, descending, options,
    correctOrder: [...options].sort((a, b) => descending ? b.value - a.value : a.value - b.value).map(option => option.id) };
}

function permutations(values) {
  return values.length ? values.flatMap((value, index) => permutations(values.filter((_, other) => index !== other)).map(tail => [value, ...tail])) : [[]];
}

function routeStage(base, grade, language) {
  const waypoints = grade === 6 ? ['A', 'B', 'C', 'D', 'F'] : ['A', 'B', 'C', 'D'];
  const connections = [...waypoints.map(to => ['S', to]),
    ...waypoints.flatMap((from, index) => waypoints.slice(index + 1).map(to => [from, to])),
    ...waypoints.map(from => [from, 'E'])];
  const rng = stageRandom(`${base.id}:route`), allOrders = permutations(waypoints);
  let edges, minimum, unique = false;
  // Solve in integers first: decimal scaling must never introduce false ties.
  for (let attempt = 0; attempt < 256 && !unique; attempt++) {
    edges = connections.map(([from, to]) => ({ from, to, cost: integer(rng, 21, 199) }));
    const costs = new Map(edges.flatMap(edge => [[`${edge.from}:${edge.to}`, edge.cost], [`${edge.to}:${edge.from}`, edge.cost]]));
    const totals = allOrders.map(order => {
      const path = ['S', ...order, 'E'];
      return path.slice(1).reduce((total, to, index) => total + costs.get(`${path[index]}:${to}`), 0);
    });
    minimum = Math.min(...totals);
    unique = totals.filter(total => total === minimum).length === 1;
  }
  if (!unique) throw new Error('Star expanse route requires a unique shortest path');
  const scale = [10, 100, 0.1, 0.01, 0.001, 0.001][grade - 1];
  const budget = rounded(minimum * scale), labels = waypoints.join(', ');
  const prompt = language === 'en'
    ? `Find the shortest star route. Start at S, visit ${labels} exactly once each, then end at E. Paths work in both directions. The total must be at most ${budget} units; only the shown paths exist.`
    : `หาเส้นทางดาราที่สั้นที่สุด เริ่ม S แวะ ${labels} จุดละหนึ่งครั้ง แล้วจบ E เดินได้สองทิศทาง ระยะรวมต้องไม่เกิน ${budget} หน่วย และเดินได้เฉพาะเส้นทางที่แสดง`;
  return { ...base, kind: 'route', prompt, start: 'S', end: 'E', budget,
    options: shuffled(waypoints.map(id => ({ id, label: id })), rng),
    edges: shuffled(edges.map(edge => ({ ...edge, cost: rounded(edge.cost * scale) })), rng) };
}

/** 25 stars × 40 stages: 800 curriculum problems and 200 star decisions. */
export function createStarExpanseStages(grade, language = 'th') {
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new RangeError('grade must be 1–6');
  if (!['th', 'en'].includes(language)) throw new RangeError('language must be th or en');
  const usedQuestionIds = new Set(), usedPrompts = new Set(), exhaustedTopics = new Set();
  let ordinal = 0;
  return Array.from({ length: STAR_EXPANSE_STAGE_COUNT }, (_, index) => {
    const room = index + 1, star = Math.floor(index / STAR_EXPANSE_STAGES_PER_STAR) + 1;
    const stageInStar = index % STAR_EXPANSE_STAGES_PER_STAR + 1, slot = index % 10;
    const base = { id: `star-expanse-g${grade}-${String(room).padStart(3, '0')}`,
      title: language === 'en' ? `Star ${star} · Stage ${stageInStar}` : `ดวงที่ ${star} · ด่านที่ ${stageInStar}`,
      hint: '', hintsAllowed: false, magicAllowed: false, star, planet: star, room, globalStage: room,
      stageInStar, stageInPlanet: stageInStar, zone: star, chapterTitle: STAR_EXPANSE_STARS[star - 1].title[language],
      boss: stageInStar === STAR_EXPANSE_STAGES_PER_STAR, selectedGrade: grade,
      sourceGrade: Math.min(6, grade + 2), difficultyStep: 2 };
    return slot < 8 ? questionStage(base, grade, ordinal++, language, usedQuestionIds, usedPrompts, exhaustedTopics)
      : slot === 8 ? orderStage(base, grade, language) : routeStage(base, grade, language);
  });
}
