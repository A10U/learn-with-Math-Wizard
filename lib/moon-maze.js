// A self-contained challenge campaign. The shared bank supplies the next
// grade's curriculum; only the minimum fields needed to play enter a stage.
import { createQuestionRound, GRADE_PROFILES } from './questions.js';

export const MOON_MAZE_STAGE_COUNT = 300;
export const MOON_MAZE_CHAPTERS = Object.freeze([
  ['ประตูจันทร์ดับ', 'The Moonless Gate'], ['ระเบียงเงาเงิน', 'Silver Shadow Hall'],
  ['สวนดอกไม้ไร้เสียง', 'The Silent Bloom Garden'], ['สะพานแสงเสี้ยว', 'Crescent Light Bridge'],
  ['บ่อน้ำเงาสะท้อน', 'The Reflection Well'], ['ห้องนาฬิกาหยุดนิ่ง', 'The Still Clock Room'],
  ['ทางแยกดาวพราว', 'The Starlit Crossroads'], ['หอสมุดเงาจันทร์', 'Moonshadow Library'],
  ['อุโมงค์หินคราม', 'The Indigo Stone Tunnel'], ['ประตูผู้เฝ้าราตรี', 'The Night Watch Gate'],
  ['ลานวงแหวนจันทรา', 'The Lunar Ring Court'], ['บันไดดาวตก', 'The Falling Star Stair'],
  ['ห้องกระจกหมอก', 'The Mist Mirror Room'], ['สวนผลึกเย็น', 'The Frost Crystal Garden'],
  ['ทางเดินสุริยุปราคา', 'The Eclipse Passage'], ['สะพานลมหยุด', 'The Still Wind Bridge'],
  ['นครใต้เงาจันทร์', 'The Moonshadow City'], ['ห้องเก็บแสงดาว', 'The Starlight Vault'],
  ['อุโมงค์ราตรีลึก', 'The Deep Night Tunnel'], ['ปราการจันทร์เสี้ยว', 'The Crescent Citadel'],
  ['ลานกลุ่มดาว', 'The Constellation Court'], ['สวนราตรีนิรันดร์', 'The Evernight Garden'],
  ['สะพานหยาดจันทร์', 'The Moonbeam Bridge'], ['หอระฆังไร้เสียง', 'The Silent Bell Tower'],
  ['ห้องดาราจักร', 'The Galaxy Chamber'], ['ทางแยกเงาซ้อน', 'The Layered Shadow Crossroads'],
  ['ประตูจันทราคู่', 'The Twin Moon Gate'], ['บัลลังก์แห่งความเงียบ', 'The Throne of Silence'],
  ['ใจกลางเขาวงกต', 'The Labyrinth Heart'], ['รุ่งอรุณหลังราตรี', 'Dawn Beyond the Night'],
].map(([th, en], index) => Object.freeze({ id: index + 1, title: Object.freeze({ th, en }) })));

const rounded = value => Math.round(value * 1000000) / 1000000;
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const integer = (rng, low, high) => low + Math.floor(rng() * (high - low + 1));

// Seed excludes language so a language switch never changes a room's answer.
function stageRandom(key) {
  let state = 2166136261;
  for (const character of key) state = Math.imul(state ^ character.charCodeAt(0), 16777619) >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

function answerParts(answer) {
  const text = String(answer).trim(), fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction && Number(fraction[2]) > 0) return { numerator: Number(fraction[1]), denominator: Number(fraction[2]), fraction: true };
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new RangeError('Moon maze questions require nonnegative numeric answers');
  const denominator = 10 ** (text.split('.')[1] ?? '').length;
  return { numerator: Math.round(Number(text) * denominator), denominator, fraction: false };
}

function answerLabel(numerator, denominator, asFraction = false) {
  if (!asFraction) return String(rounded(numerator / denominator));
  const common = gcd(numerator, denominator);
  return denominator / common === 1 ? String(numerator / common) : `${numerator / common}/${denominator / common}`;
}

function shuffled(values, rng) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = integer(rng, 0, index);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function permutations(values) {
  return values.length ? values.flatMap((value, index) => permutations(values.filter((_, other) => index !== other)).map(tail => [value, ...tail])) : [[]];
}

function questionStage(base, grade, ordinal, language, usedQuestionIds) {
  const sourceGrade = base.sourceGrade, topics = GRADE_PROFILES[sourceGrade - 1].topics;
  const topic = topics[ordinal % topics.length];
  const rng = stageRandom(`${base.id}:source-g${sourceGrade}:${topic}`);
  const q = createQuestionRound(sourceGrade, { rng, topic, language, excludeIds: [...usedQuestionIds] }).questions[0];
  usedQuestionIds.add(q.id);
  let { numerator, denominator, fraction } = answerParts(q.answer);
  let prompt = q.prompt, transform;
  if (grade === 6) {
    transform = ordinal % 2 === 0
      ? { operation: 'add', operand: 1 + ordinal % 5 }
      : { operation: 'multiply', operand: 2 + ordinal % 3 };
    numerator = transform.operation === 'add' ? numerator + transform.operand * denominator : numerator * transform.operand;
    const equation = `x ${transform.operation === 'add' ? '+' : '×'} ${transform.operand}`;
    prompt = language === 'en'
      ? `Let x be the numerical answer to this problem, without its unit: ${q.prompt}\nThe lunar door code is ${equation}. Choose the door code.`
      : `กำหนดให้ x เป็นค่าตัวเลขของคำตอบโจทย์ต่อไปนี้ โดยไม่นำหน่วยมาใช้: ${q.prompt}\nรหัสประตูจันทราคือ ${equation} จงเลือกรหัสประตู`;
  }
  const wrong = [];
  for (const difference of shuffled([-1, 1, -2, 2, -3, 3, -4, 4], rng)) {
    if (numerator + difference >= 0) wrong.push(numerator + difference);
    if (wrong.length === 3) break;
  }
  const correctIndex = integer(rng, 0, 3);
  let wrongIndex = 0;
  const options = Array.from({ length: 4 }, (_, index) => {
    const top = index === correctIndex ? numerator : wrong[wrongIndex++];
    return { id: `${base.id}-o${index}`, label: answerLabel(top, denominator, fraction), value: top / denominator };
  });
  return {
    ...base, kind: 'choice', prompt, topic, sourceQuestionId: q.id, questionId: q.id,
    ...(q.visual ? { visual: structuredClone(q.visual) } : {}), ...(transform ? { transform } : {}),
    options, correctId: options[correctIndex].id,
  };
}

function orderStage(base, grade, language) {
  const chapter = base.zone;
  let values;
  if (grade <= 3) {
    const starting = [100 + chapter * 9, 10000 + chapter * 211, 100000 + chapter * 1103][grade - 1];
    const intervals = [[7, 35, 113, 207], [31, 405, 1234, 2999], [111, 2709, 10997, 30103]][grade - 1];
    values = intervals.map(value => ({ label: String(starting + value), value: starting + value }));
  } else {
    const fractions = grade === 4 ? [[1, 4], [2, 5], [5, 8], [9, 10]] : [[3, 7], [4, 9], [5, 11], [6, 13]];
    values = fractions.map(([numerator, denominator], index) => grade < 6
      ? { label: answerLabel(chapter * denominator + numerator, denominator, true), value: chapter + numerator / denominator }
      : { label: `(${numerator}/${denominator} × ${index + 2}) + ${chapter}`, value: chapter + numerator * (index + 2) / denominator });
  }
  const descending = chapter % 2 === 0;
  const options = shuffled(values.map((value, index) => ({ id: `${base.id}-card${index}`, ...value })), stageRandom(`${base.id}:order`));
  const direction = language === 'en' ? descending ? 'largest to smallest' : 'smallest to largest' : descending ? 'มากไปน้อย' : 'น้อยไปมาก';
  const prompt = language === 'en'
    ? `Place all four lunar tablets from ${direction} to cross the shadow corridor.${grade === 6 ? ' Evaluate each expression before comparing its value.' : ''}`
    : `เรียงแผ่นจันทราทั้ง 4 แผ่นจาก${direction}เพื่อข้ามระเบียงเงา${grade === 6 ? ' คำนวณค่าของแต่ละนิพจน์ก่อนเปรียบเทียบ' : ''}`;
  return { ...base, kind: 'order', prompt, descending, options, correctOrder: [...options].sort((a, b) => descending ? b.value - a.value : a.value - b.value).map(option => option.id) };
}

function routeStage(base, grade, language) {
  const waypoints = grade === 6 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C'];
  const connections = [
    ...waypoints.map(to => ['S', to]),
    ...waypoints.flatMap((from, index) => waypoints.slice(index + 1).map(to => [from, to])),
    ...waypoints.map(from => [from, 'E']),
  ];
  const rng = stageRandom(`${base.id}:route`), allOrders = permutations(waypoints);
  const scales = [1, 10, 100, 0.1, 0.01, 0.001];
  let edges, minimum, unique = false;
  // Optimize integer costs before scaling so decimal roundoff cannot create a
  // false tie. A fresh deterministic graph is tried if shortest routes tie.
  for (let attempt = 0; attempt < 256 && !unique; attempt++) {
    edges = connections.map(([from, to]) => ({ from, to, cost: integer(rng, 11, 99) }));
    const totals = allOrders.map(order => {
      const path = ['S', ...order, 'E'];
      return path.slice(1).reduce((total, to, index) => total + edges.find(edge => (edge.from === path[index] && edge.to === to) || (edge.to === path[index] && edge.from === to)).cost, 0);
    });
    minimum = Math.min(...totals);
    unique = totals.filter(total => total === minimum).length === 1;
  }
  if (!unique) throw new Error('Moon maze route requires a unique shortest path');
  const scale = scales[grade - 1], budget = rounded(minimum * scale);
  const labels = waypoints.join(', ');
  const prompt = language === 'en'
    ? `Find the shortest way out of the silent maze. Start at S, visit ${labels} exactly once each, then end at E. Paths work in both directions. The total must be at most ${budget} units; only the shown paths exist.`
    : `หาเส้นทางสั้นที่สุดออกจากเขาวงกตไร้เสียง เริ่ม S แวะ ${labels} จุดละหนึ่งครั้ง แล้วจบ E เดินได้สองทิศทาง ระยะรวมต้องไม่เกิน ${budget} หน่วย และเดินได้เฉพาะเส้นทางที่แสดง`;
  return { ...base, kind: 'route', prompt, start: 'S', end: 'E', budget,
    options: shuffled(waypoints.map(id => ({ id, label: id })), rng),
    edges: shuffled(edges.map(edge => ({ ...edge, cost: rounded(edge.cost * scale) })), rng),
  };
}

/** 30 chapters × 10 rooms: eight curriculum problems and two maze decisions. */
export function createMoonMazeStages(grade, language = 'th') {
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new RangeError('grade must be 1–6');
  if (!['th', 'en'].includes(language)) throw new RangeError('language must be th or en');
  const usedQuestionIds = new Set();
  let ordinal = 0;
  return Array.from({ length: MOON_MAZE_STAGE_COUNT }, (_, index) => {
    const room = index + 1, zone = Math.floor(index / 10) + 1, slot = index % 10;
    const chapterTitle = MOON_MAZE_CHAPTERS[zone - 1].title[language];
    const base = { id: `moon-maze-g${grade}-${String(room).padStart(3, '0')}`, title: language === 'en' ? `Floor ${zone} · Stage ${slot + 1}` : `ชั้นที่ ${zone} · ด่านที่ ${slot + 1}`,
      hint: '', hintsAllowed: false, magicAllowed: false, floor: zone, room, globalStage: room, stageInFloor: slot + 1, zone, chapterTitle, boss: slot === 9,
      sourceGrade: Math.min(6, grade + 1), difficultyStep: 1 };
    return slot < 8 ? questionStage(base, grade, ordinal++, language, usedQuestionIds)
      : slot === 8 ? orderStage(base, grade, language) : routeStage(base, grade, language);
  });
}
