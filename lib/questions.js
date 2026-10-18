// Original question recipes for independent practice and challenge rounds.
// Grade labels describe selected game ranges, not full curriculum coverage.
import { UPPER_PRIMARY_PROFILES, upperPrimaryCandidate } from './upper-primary.js';

export const QUESTION_PROFILE_VERSION = 'random-v1';
// Handwriting time is ranked separately from keypad-only challenge history.
export const WRITING_PROFILE_VERSION = 'random-writing-v1';
export const GRADE_PROFILES = [
  { grade: 1, title: 'ป.1', description: 'ฝึกบางหัวข้อ: บวก–ลบไม่เกิน 20 และเรื่องสั้นหนึ่งขั้น', topics: ['บวก', 'ลบ', 'โจทย์หนึ่งขั้น', 'จำนวนที่หายไป'], topicIds: ['addition', 'subtraction', 'one-step', 'missing-number'] },
  { grade: 2, title: 'ป.2', description: 'ฝึกบางหัวข้อ: บวก–ลบถึง 1,000 กลุ่มเท่ากัน หารลงตัว และเรื่องสองขั้น', topics: ['บวก', 'ลบ', 'คูณ', 'หาร', 'โจทย์สองขั้น'], topicIds: ['addition', 'subtraction', 'multiplication', 'division', 'two-step'] },
  { grade: 3, title: 'ป.3', description: 'ฝึกบางหัวข้อ: จำนวนถึง 10,000 คูณ–หาร และเศษส่วนตัวส่วนเท่ากัน', topics: ['บวก–ลบ', 'คูณ', 'หาร', 'เศษส่วนตัวส่วนเท่ากัน', 'โจทย์สองขั้น'], topicIds: ['addition-subtraction', 'multiplication', 'division', 'same-denominator', 'two-step'] },
  { grade: 4, title: 'ป.4', description: 'ฝึกบางหัวข้อ: จำนวนมาก การประมาณค่า คูณ–หาร และเศษส่วนต่างตัวส่วนตามขอบเขต', topics: ['บวก–ลบ/ประมาณค่า', 'คูณ', 'หาร', 'เศษส่วนต่างตัวส่วน', 'โจทย์สองขั้น'], topicIds: ['large-numbers', 'multiplication', 'division', 'related-denominators', 'two-step'] },
  ...UPPER_PRIMARY_PROFILES,
];

const ENGLISH_TOPICS = {
  'บวก': 'Addition', 'ลบ': 'Subtraction', 'คูณ': 'Multiplication', 'หาร': 'Division',
  'โจทย์หนึ่งขั้น': 'One-step word problems', 'จำนวนที่หายไป': 'Missing numbers',
  'โจทย์สองขั้น': 'Two-step word problems', 'บวก–ลบ': 'Addition and subtraction',
  'เศษส่วนตัวส่วนเท่ากัน': 'Fractions with the same denominator',
  'บวก–ลบ/ประมาณค่า': 'Large numbers and estimation',
  'เศษส่วนต่างตัวส่วน': 'Fractions with different denominators',
  'เศษส่วนและจำนวนคละ': 'Fractions and mixed numbers', 'ทศนิยม': 'Decimals',
  'ร้อยละ': 'Percentages', 'การวัดและเรขาคณิต': 'Measurement and geometry',
  'การอ่านข้อมูล': 'Reading data', 'ห.ร.ม. และ ค.ร.น.': 'GCF and LCM',
  'เศษส่วนและทศนิยม': 'Fractions and decimals', 'อัตราส่วนและร้อยละ': 'Ratios and percentages',
  'เรขาคณิตและปริมาตร': 'Geometry and volume', 'แผนภูมิรูปวงกลม': 'Pie charts',
};
const ENGLISH_GRADE_DESCRIPTIONS = [
  'Selected practice: addition and subtraction within 20, and one-step word problems',
  'Selected practice: addition and subtraction within 1,000, equal groups, exact division, and two-step word problems',
  'Selected practice: numbers up to 10,000, multiplication, division, and fractions with the same denominator',
  'Selected practice: large numbers, estimation, multiplication, division, and fractions with related denominators',
  'Selected practice: fractions and mixed numbers, decimals, percentages, measurement, area, volume, and line graphs',
  'Selected practice: GCF and LCM, fractions, decimals, ratios, scale, percentages, geometry, and pie charts',
];

/** Keep topic keys in Thai for saved progress; translate only their display text. */
export function translateTopic(topic, language = 'th') {
  return language === 'en' ? ENGLISH_TOPICS[topic] ?? topic : topic;
}

export function getGradeProfileText(grade, language = 'th') {
  const profile = resolveProfile(grade, null);
  return language === 'en'
    ? { title: `Grade ${grade}`, description: ENGLISH_GRADE_DESCRIPTIONS[grade - 1] }
    : { title: profile.title, description: profile.description };
}

/** Change display language without generating another question or changing IDs. */
export function localizeQuestion(q, language = 'th') {
  const translated = q.translations?.[language === 'en' ? 'en' : 'th'];
  if (!translated) return { ...q };
  return { ...q, ...translated, ...(translated.visual ? { visual: { ...translated.visual, labels: [...translated.visual.labels], values: [...translated.visual.values] } } : {}) };
}

const unitRandom = rng => {
  const n = Number(rng());
  return Number.isFinite(n) ? Math.min(1 - Number.EPSILON, Math.max(0, n)) : 0;
};
const integer = (rng, low, high) => low + Math.floor(unitRandom(rng) * (high - low + 1));
const pick = (rng, items) => items[integer(rng, 0, items.length - 1)];
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const fraction = (a, d) => { const g = gcd(a, d); return `${a / g}/${d / g}`; };
const sumKey = (a, b) => `add:${Math.min(a, b)}:${Math.max(a, b)}`;
function question(signature, prompt, answer, hint, topic, integerOnly = true) {
  const q = { id: signature, signature, prompt, answer, hint, integerOnly, topic };
  return { ...q, translations: { th: { prompt, hint }, en: lowerPrimaryEnglish(q) } };
}

// Story signatures intentionally identify the arithmetic rather than a context.
// Read operand order and context from the original Thai recipe so switching
// languages never draws new random values or changes the story being solved.
function lowerPrimaryEnglish(q) {
  const [kind, ...parts] = q.signature.split(':');
  const [a, b, c] = parts.map(Number), numbers = q.prompt.match(/\d+/g).map(Number);
  const [left, right] = numbers;
  if (q.topic === 'จำนวนที่หายไป') {
    return kind === 'add'
      ? { prompt: `There are ${left} lights. How many more are needed to make ${right} lights? (${left} + □ = ${right})`, hint: `Find how many to add: ${right} − ${left} = ${q.answer}. Adding ${q.answer} to ${left} makes ${right}.` }
      : { prompt: `You have ${left} marbles. After giving some to a friend, ${right} remain. How many did you give away? (${left} − □ = ${right})`, hint: `Subtract the remaining marbles from the starting total: ${left} − ${right} = ${q.answer} marbles given away.` };
  }
  if (q.topic === 'โจทย์หนึ่งขั้น') {
    const context = q.prompt.startsWith('โคม')
      ? { start: 'A lantern holds', item: 'lights', add: 'The wizard adds', take: 'The wizard moves', end: 'to the tower' }
      : q.prompt.startsWith('ตะกร้า')
        ? { start: 'A basket holds', item: 'marbles', add: 'You get', take: 'You give', end: 'to a friend' }
        : { start: 'A shelf holds', item: 'books', add: 'You add', take: 'You take', end: 'to read' };
    const adding = kind === 'add';
    return { prompt: `${context.start} ${left} ${context.item}. ${adding ? context.add : context.take} ${right} ${adding ? 'more ' : ''}${context.item}${adding ? '.' : ` ${context.end}.`} How many ${context.item} ${adding ? 'are there in all' : 'remain'}?`, hint: `${adding ? 'Add the new items' : 'Subtract the items taken away'}: ${left} ${adding ? '+' : '−'} ${right} = ${q.answer} ${context.item}.` };
  }
  if (kind === 'mulsub') {
    const context = q.prompt.includes('ดาวกระดาษ')
      ? { holder: 'boxes', item: 'paper stars', action: 'used for decorations' }
      : q.prompt.includes('ลูกแก้ว')
        ? { holder: 'baskets', item: 'marbles', action: 'given to friends' }
        : { holder: 'crates', item: 'bottles of water', action: 'sent to the cafeteria' };
    return { prompt: `There are ${a} ${context.holder} with ${b} ${context.item} in each. ${c} ${context.item} are ${context.action}. How many ${context.item} remain?`, hint: `First find the total: ${a} × ${b} = ${a * b}. Then subtract: ${a * b} − ${c} = ${q.answer} ${context.item}.` };
  }
  if (kind === 'fracadd' || kind === 'fracsub') {
    const [n, d, m, e] = numbers, adding = kind === 'fracadd', common = Math.max(d, e), top = adding ? n * common / d + m * common / e : n * common / d - m * common / e;
    const potion = q.topic === 'เศษส่วนต่างตัวส่วน';
    return {
      prompt: potion
        ? `There is ${n}/${d} litre of potion. ${adding ? 'Add' : 'Use'} ${m}/${e} litre. How many litres ${adding ? 'are there in all' : 'remain'}? (You may answer as a/b, including an improper fraction.)`
        : `There is ${n}/${d} of a tray of treats. ${adding ? 'Add' : 'Use'} ${m}/${e} of a tray. How much ${adding ? 'is there in all' : 'remains'}? (You may answer as a/b.)`,
      hint: potion
        ? `Use a common denominator: ${n * common / d}/${common} ${adding ? '+' : '−'} ${m * common / e}/${common} = ${top}/${common} litres.`
        : `The pieces have the same size, so ${adding ? 'add' : 'subtract'} only the numerators: (${n} ${adding ? '+' : '−'} ${m})/${d} = ${top}/${d} of a tray.`,
    };
  }
  if (kind === 'estimate') {
    const roundedLeft = Math.round(left / c) * c, roundedRight = Math.round(right / c) * c;
    return { prompt: `Estimate ${left} + ${right} by rounding each number to the nearest ten thousand before adding. What is the estimated sum?`, hint: `Round to ten thousands: ${left} ≈ ${roundedLeft} and ${right} ≈ ${roundedRight}. The estimated sum is ${roundedLeft} + ${roundedRight} = ${q.answer}.` };
  }
  const hints = {
    add: `Combine ${left} and ${right}: ${left} + ${right} = ${q.answer}.`,
    sub: `Check by adding: ${right} + ${q.answer} = ${left}.`,
    mul: `${left} groups of ${right} make ${left} × ${right} = ${q.answer}.`,
    div: `Check by multiplying: ${right} × ${q.answer} = ${left}.`,
  };
  return { prompt: q.prompt, hint: hints[kind] };
}
const sum = (a, b, topic = 'บวก') => question(sumKey(a, b), `${a} + ${b} = ?`, a + b, `รวม ${a} กับ ${b} ได้ ${a + b}`, topic);
const difference = (a, b, topic = 'ลบ') => question(`sub:${a}:${b}`, `${a} − ${b} = ?`, a - b, `ตรวจด้วย ${b} + ${a - b} = ${a}`, topic);
const product = (a, b) => question(`mul:${Math.min(a, b)}:${Math.max(a, b)}`, `${a} × ${b} = ?`, a * b, `${a} กลุ่ม กลุ่มละ ${b} รวม ${a * b}`, 'คูณ');
const quotient = (n, d) => question(`div:${n}:${d}`, `${n} ÷ ${d} = ?`, n / d, `ตรวจด้วย ${d} × ${n / d} = ${n}`, 'หาร');

function simpleStory(rng) {
  const adding = integer(rng, 0, 1) === 0;
  const a = integer(rng, 3, 15);
  const b = adding ? integer(rng, 1, 20 - a) : integer(rng, 1, a);
  const context = pick(rng, [
    { start: 'โคมมีแสง', add: 'พ่อมดเติมอีก', take: 'ย้ายไปหอคอย', unit: 'ดวง' },
    { start: 'ตะกร้ามีลูกแก้ว', add: 'ได้เพิ่มอีก', take: 'แบ่งให้เพื่อน', unit: 'ลูก' },
    { start: 'ชั้นวางมีหนังสือ', add: 'นำมาวางเพิ่ม', take: 'หยิบไปอ่าน', unit: 'เล่ม' },
  ]);
  const answer = adding ? a + b : a - b;
  const prompt = `${context.start} ${a} ${context.unit} ${adding ? context.add : context.take} ${b} ${context.unit} ${adding ? 'รวม' : 'เหลือ'}กี่${context.unit}?`;
  return question(adding ? sumKey(a, b) : `sub:${a}:${b}`, prompt, answer, `${adding ? `${a} + ${b}` : `${a} − ${b}`} = ${answer} ${context.unit}`, 'โจทย์หนึ่งขั้น');
}
function twoStep(rng, grade) {
  const groups = integer(rng, grade === 4 ? 12 : 2, grade === 4 ? 39 : 9);
  const perGroup = integer(rng, grade === 2 ? 2 : 12, grade === 2 ? 9 : grade === 3 ? 25 : 49);
  const total = groups * perGroup;
  const taken = integer(rng, 1, Math.max(1, Math.floor(total / 2)));
  const c = pick(rng, [
    { holder: 'กล่อง', thing: 'ดาวกระดาษ', unit: 'ดวง', action: 'นำไปตกแต่ง' },
    { holder: 'ตะกร้า', thing: 'ลูกแก้ว', unit: 'ลูก', action: 'แจกให้เพื่อน' },
    { holder: 'ลัง', thing: 'ขวดน้ำ', unit: 'ขวด', action: 'ส่งไปโรงอาหาร' },
  ]);
  return question(`mulsub:${groups}:${perGroup}:${taken}`, `มี${c.thing} ${groups} ${c.holder} ${c.holder}ละ ${perGroup} ${c.unit} ${c.action} ${taken} ${c.unit} เหลือกี่${c.unit}?`, total - taken, `รวมก่อน: ${groups} × ${perGroup} = ${total} แล้ว ${total} − ${taken} = ${total - taken} ${c.unit}`, 'โจทย์สองขั้น');
}
function sameDenominator(rng) {
  const d = integer(rng, 2, 10), adding = integer(rng, 0, 1) === 0;
  const a = integer(rng, 1, adding ? d - 1 : d);
  const b = integer(rng, adding ? 1 : 0, adding ? d - a : a);
  const n = adding ? a + b : a - b;
  const keyA = adding ? Math.min(a, b) : a, keyB = adding ? Math.max(a, b) : b;
  return question(`frac${adding ? 'add' : 'sub'}:${keyA}:${d}:${keyB}:${d}`, `ขนม ${a}/${d} ถาด ${adding ? 'เพิ่ม' : 'ใช้ไป'} ${b}/${d} ถาด ${adding ? 'รวม' : 'เหลือ'}กี่ถาด? (ตอบแบบ a/b ได้)`, fraction(n, d), `ชิ้นขนาดเดียวกัน ${adding ? 'รวม' : 'เอาออก'}เฉพาะจำนวนชิ้น ได้ ${n}/${d} ถาด`, 'เศษส่วนตัวส่วนเท่ากัน', false);
}
function relatedDenominators(rng) {
  const base = integer(rng, 2, 6), multiple = integer(rng, 2, Math.floor(12 / base));
  let d = base, e = base * multiple, a = integer(rng, 1, d - 1), b = integer(rng, 1, e - 1);
  const adding = integer(rng, 0, 1) === 0;
  if ((!adding && a * e < b * d) || (adding && (a * e > b * d || (a * e === b * d && d > e)))) [a, d, b, e] = [b, e, a, d];
  const common = Math.max(d, e), left = a * (common / d), right = b * (common / e), n = adding ? left + right : left - right;
  return question(`frac${adding ? 'add' : 'sub'}:${a}:${d}:${b}:${e}`, `น้ำยา ${a}/${d} ลิตร ${adding ? 'เติมอีก' : 'ใช้ไป'} ${b}/${e} ลิตร ${adding ? 'รวม' : 'เหลือ'}กี่ลิตร? (ตอบเศษส่วน a/b ได้ แม้เกินหนึ่ง)`, fraction(n, common), `ทำส่วนให้เท่ากัน: ${left}/${common} ${adding ? '+' : '−'} ${right}/${common} = ${n}/${common} ลิตร`, 'เศษส่วนต่างตัวส่วน', false);
}
function largerNumbers(rng) {
  const kind = integer(rng, 0, 2);
  if (kind === 1) {
    const a = integer(rng, 100001, 999999), b = integer(rng, 10000, a);
    return difference(a, b, 'บวก–ลบ/ประมาณค่า');
  }
  const a = integer(rng, 100000, 699999), b = integer(rng, 10000, 999999 - a);
  if (kind === 0) return sum(a, b, 'บวก–ลบ/ประมาณค่า');
  const pa = Math.round(a / 10000) * 10000, pb = Math.round(b / 10000) * 10000;
  return question(`estimate:${Math.min(a, b)}:${Math.max(a, b)}:10000`, `ประมาณผลบวก ${a} + ${b} โดยปัดแต่ละจำนวนเป็นจำนวนเต็มหมื่นก่อนบวก ได้เท่าไร?`, pa + pb, `ปัดเป็นหมื่น: ${a} ≈ ${pa} และ ${b} ≈ ${pb} รวมประมาณ ${pa + pb}`, 'บวก–ลบ/ประมาณค่า');
}
function candidate(grade, slot, rng) {
  if (grade >= 5) return upperPrimaryCandidate(grade, slot, rng);
  if (grade === 1) {
    if (slot === 0) { const a = integer(rng, 2, 15); return sum(a, integer(rng, 1, 20 - a)); }
    if (slot === 1) { const a = integer(rng, 3, 20); return difference(a, integer(rng, 1, a)); }
    if (slot === 2) return simpleStory(rng);
    if (slot === 3) {
      const a = integer(rng, 2, 12), b = integer(rng, 1, 20 - a);
      return question(sumKey(a, b), `มีแสง ${a} ดวง เติมจนมี ${a + b} ดวง ต้องเติมกี่ดวง? (${a} + □ = ${a + b})`, b, `จาก ${a} เติม ${b} จะถึง ${a + b}`, 'จำนวนที่หายไป');
    }
    const a = integer(rng, 4, 20), b = integer(rng, 1, a);
    return question(`sub:${a}:${b}`, `มีลูกแก้ว ${a} ลูก แบ่งให้เพื่อนแล้วเหลือ ${a - b} ลูก แบ่งให้กี่ลูก? (${a} − □ = ${a - b})`, b, `นำที่เหลือ ${a - b} ออกจากทั้งหมด ${a} จะรู้ว่าแบ่งให้ ${b} ลูก`, 'จำนวนที่หายไป');
  }
  if (grade === 2) {
    if (slot === 0) { const a = integer(rng, 10, 800); return sum(a, integer(rng, 1, 1000 - a)); }
    if (slot === 1) { const a = integer(rng, 20, 1000); return difference(a, integer(rng, 1, a)); }
    if (slot === 2) { const a = integer(rng, 2, 9); return product(a, integer(rng, 2, Math.min(12, Math.floor(99 / a)))); }
    if (slot === 3) { const d = integer(rng, 2, 9), q = integer(rng, 2, 9); return quotient(d * q, d); }
    return twoStep(rng, grade);
  }
  if (grade === 3) {
    if (slot === 0) {
      const a = integer(rng, 100, 6000);
      return integer(rng, 0, 1) === 0 ? sum(a, integer(rng, 1, 10000 - a), 'บวก–ลบ') : difference(a, integer(rng, 0, a), 'บวก–ลบ');
    }
    if (slot === 1) return product(integer(rng, 11, 99), integer(rng, 2, 9));
    if (slot === 2) { const d = integer(rng, 2, 9), q = integer(rng, Math.ceil(100 / d), Math.floor(999 / d)); return quotient(d * q, d); }
    if (slot === 3) return sameDenominator(rng);
    return twoStep(rng, grade);
  }
  if (slot === 0) return largerNumbers(rng);
  if (slot === 1) return product(integer(rng, 12, 99), integer(rng, 12, 99));
  if (slot === 2) { const d = integer(rng, 12, 39), q = integer(rng, 10, 199); return quotient(d * q, d); }
  if (slot === 3) return relatedDenominators(rng);
  return twoStep(rng, grade);
}
function fallbackRandom(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
}

function resolveProfile(grade, topic) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new RangeError('เลือกชั้น ป.1–6');
  const profile = GRADE_PROFILES[grade - 1];
  if (topic !== null && !profile.topics.includes(topic)) throw new RangeError('เลือกหัวข้อที่มีในระดับชั้นนี้');
  return profile;
}

export function getQuestionDeckId(grade, topic = null) {
  const profile = resolveProfile(grade, topic);
  return topic === null ? `g${grade}-random` : `g${grade}-topic-${profile.topicIds[profile.topics.indexOf(topic)]}`;
}

/** Five balanced slots, or five questions from one exact profile topic, shuffled. */
export function createQuestionRound(grade, { rng = Math.random, excludeIds = [], topic = null, language = 'th' } = {}) {
  const profile = resolveProfile(grade, topic);
  if (typeof rng !== 'function') throw new TypeError('rng must be a function');
  const excluded = new Set(Array.isArray(excludeIds) ? excludeIds.filter(id => typeof id === 'string').slice(0, 1000) : []);
  const used = new Set(), questions = [];
  for (let slot = 0; slot < 5; slot++) {
    let accepted = null;
    for (let attempt = 0; attempt < 272; attempt++) {
      const source = attempt < 16 ? rng : fallbackRandom((grade * 1000003 + slot * 7919 + attempt * 104729) >>> 0);
      const selectedSlot = topic === null ? slot : grade === 1 && topic === 'จำนวนที่หายไป' ? integer(source, 3, 4) : profile.topics.indexOf(topic);
      const q = candidate(grade, selectedSlot, source);
      if (!excluded.has(q.id) && !used.has(q.signature)) { accepted = q; break; }
    }
    if (!accepted) throw new RangeError('ไม่พบโจทย์ใหม่ในขอบเขตที่กำหนด ลองล้างรายการยกเว้น');
    questions.push(accepted); used.add(accepted.signature);
  }
  for (let index = questions.length - 1; index > 0; index--) {
    const other = integer(rng, 0, index);
    [questions[index], questions[other]] = [questions[other], questions[index]];
  }
  const title = `${getGradeProfileText(grade, language).title} — ${topic === null ? language === 'en' ? 'Random practice' : 'ฝึกโจทย์สุ่ม' : translateTopic(topic, language)}`;
  return { deckId: getQuestionDeckId(grade, topic), deckVersion: QUESTION_PROFILE_VERSION, grade, topic, title, questions: questions.map(q => localizeQuestion(q, language)) };
}
