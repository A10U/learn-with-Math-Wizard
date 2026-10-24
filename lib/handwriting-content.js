// Motor-practice activities: the visible target is a model to copy, not a quiz.
// These selected game ranges do not claim full grade-level curriculum coverage.
const randomUnit = rng => {
  const value = Number(rng());
  return Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : 0;
};
const between = (rng, min, max) => min + Math.floor(randomUnit(rng) * (max - min + 1));
function sampleRange(rng, low, high, count) {
  const swaps = new Map(), size = high - low + 1, result = [];
  for (let index = 0; index < count; index++) {
    const selected = between(rng, index, size - 1);
    result.push(low + (swaps.get(selected) ?? selected));
    swaps.set(selected, swaps.get(index) ?? index);
  }
  return result;
}
function shuffledRight(rng) {
  const order = [0, 1, 2];
  for (let index = 2; index > 0; index--) {
    const selected = between(rng, 0, index);
    [order[index], order[selected]] = [order[selected], order[index]];
  }
  return order.every((value, index) => value === index) ? [1, 2, 0] : order;
}
function placeLabel(number) {
  const units = ['หน่วย', 'สิบ', 'ร้อย', 'พัน'];
  return String(number).split('').map((digit, index, digits) => `${digit} ${units[digits.length - index - 1]}`).join(' กับ ');
}
function expandedLabel(number) {
  return String(number).split('').map((digit, index, digits) => Number(digit) * 10 ** (digits.length - index - 1)).filter(value => value > 0).join(' + ');
}
function connectActivity(grade, index, rng, excludeNumbers = []) {
  const id = `g${grade}-connect-${index + 1}`;
  let pairs;
  if (grade === 1) {
    const marks = ['●', '★', '▲', '♥'][index % 4];
    pairs = sampleRange(rng, 1, 5, 3).map((count, pair) => ({ id: `${id}-pair-${pair}`, leftLabel: Array(count).fill(marks).join(' '), rightLabel: String(count) }));
  } else {
    const minimum = grade === 2 ? 10 : grade === 3 ? 100 : 1000;
    const maximum = grade === 2 ? 99 : grade === 3 ? 999 : 9999;
    const used = new Set(excludeNumbers);
    const numbers = sampleRange(rng, minimum, maximum, 3).map(candidate => {
      let number = candidate;
      for (let attempt = 0; attempt <= used.size; attempt++) {
        if (!used.has(number)) break;
        number = number === maximum ? minimum : number + 1;
      }
      used.add(number);
      return number;
    });
    pairs = numbers.map((number, pair) => {
      let leftLabel = placeLabel(number);
      if (index === 1) {
        if (grade === 4) leftLabel = expandedLabel(number);
        else {
          const added = between(rng, 1, grade === 2 ? 9 : 99);
          leftLabel = `${number - added} + ${added}`;
        }
      } else if (index === 2) leftLabel = expandedLabel(number);
      else if (index === 3) {
        const removed = between(rng, 1, grade === 2 ? 9 : 99);
        leftLabel = `${number + removed} − ${removed}`;
      }
      return { id: `${id}-pair-${pair}`, leftLabel, rightLabel: String(number) };
    });
  }
  return {
    id, kind: 'connect', title: grade === 1 ? 'โยงภาพกับจำนวน' : index === 0 ? 'โยงค่าประจำหลักกับตัวเลข' : 'โยงจำนวนที่มีค่าเท่ากัน',
    instruction: grade === 1 ? index < 2 ? 'นับรูปทางซ้าย แล้วลากเส้นไปหาตัวเลขที่ตรงกันทางขวาให้ครบ 3 คู่' : 'นับรูปทางซ้าย แล้วลากเส้นไปหาตัวเลขที่ตรงกันทางขวาให้ครบ 3 คู่' : 'ดูจำนวนทางซ้าย แล้วลากเส้นไปหาตัวเลขที่มีค่าเท่ากันทางขวาให้ครบ 3 คู่',
    pairs, rightOrder: shuffledRight(rng),
  };
}
function curveGuide() {
  return Array.from({ length: 25 }, (_, index) => {
    const t = index / 24, u = 1 - t;
    return { x: u ** 3 * .1 + 3 * u ** 2 * t * .3 + 3 * u * t ** 2 * .7 + t ** 3 * .9, y: u ** 3 * .6 + 3 * u ** 2 * t * .2 + 3 * u * t ** 2 * .8 + t ** 3 * .4 };
  });
}

function coinActivities(grade, rng, count = 2) {
  const denominations = grade === 1 ? [1, 1] : grade === 2 ? [2, 5] : [5, 10];
  const values = Array.from({ length: count }, (_, index) => denominations[index % 2]);
  if (between(rng, 0, 1) === 1) values.reverse();
  return sampleRange(rng, 6, 10, count).map((targetCount, index) => {
    const coinValue = values[index], startCount = between(rng, 1, targetCount - 1);
    const targetMoney = coinValue * targetCount;
    return {
      id: `g${grade}-coins-${index + 1}`, kind: 'coins', coinValue, targetCount, startCount, targetMoney,
      title: `เติมเหรียญให้ครบ ${targetMoney} บาท`,
      instruction: `เหรียญละ ${coinValue} บาท ต้องการ ${targetCount} เหรียญ รวม ${targetMoney} บาท ตอนนี้มี ${startCount} เหรียญ ลองเติมให้ครบ`,
    };
  });
}

/** Default 14 activities; extended:true offers 20 writing plus 12 other activities. */
export function createHandwritingRound(grade, { rng = Math.random, extended = false, language = 'th' } = {}) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new RangeError('เลือกชั้น ป.1–6');
  if (typeof rng !== 'function') throw new TypeError('rng must be a function');
  const expanded = extended === true, traceCount = expanded ? 10 : 4;
  let targets;
  if (grade === 1) targets = expanded ? [...sampleRange(rng, 0, 9, 10), ...sampleRange(rng, 10, 20, 10)] : [...sampleRange(rng, 0, 9, 6), ...sampleRange(rng, 10, 20, 2)];
  else if (grade === 2) targets = [...sampleRange(rng, 10, 99, traceCount), ...sampleRange(rng, 100, 999, traceCount)];
  else if (grade === 3) targets = [...sampleRange(rng, 100, 999, traceCount), ...sampleRange(rng, 1000, 9999, traceCount)];
  // Older grades share whole-number warmups: these are motor activities,
  // separate from the decimal/fraction questions in their math practice.
  else targets = sampleRange(rng, 1000, 9999, traceCount * 2);
  const activities = targets.map((number, index) => {
    const kind = index < traceCount ? 'trace' : 'copy', target = String(number);
    return {
      id: `g${grade}-${kind}-${target}`, kind,
      title: kind === 'trace' ? `ลากตามรอยเลข ${target}` : `ดูแล้วเขียนเลข ${target}`,
      instruction: kind === 'trace' ? `ลากนิ้วหรือปากกาตามรอยเลข ${target} ให้ครบทุกตัว ไม่ต้องรีบ` : `ดูตัวอย่าง ${target} แล้วเขียนลงในช่องว่าง ให้ครบทุกตัว ไม่ต้องรีบ`,
      target,
    };
  });
  activities.push({
    id: `g${grade}-path-1`, kind: 'path', title: 'ลากเส้นซิกแซกเบา ๆ',
    instruction: 'วางนิ้วที่จุดเริ่ม แล้วค่อย ๆ ลากตามเส้นซิกแซกไปจนถึงจุดจบ',
    guide: [{ x: .1, y: .5 }, { x: .25, y: .35 }, { x: .4, y: .65 }, { x: .55, y: .35 }, { x: .7, y: .65 }, { x: .9, y: .5 }],
  }, {
    id: `g${grade}-path-2`, kind: 'path', title: 'ลากเส้นโค้งต่อกัน',
    instruction: 'วางนิ้วที่จุดเริ่ม แล้วค่อย ๆ ลากตามเส้นโค้งไปจนถึงจุดจบ',
    guide: curveGuide(),
  });
  if (expanded) activities.push({
    id: `g${grade}-path-3`, kind: 'path', title: 'ลากคลื่นขึ้นแล้วลง',
    instruction: 'วางนิ้วที่จุดเริ่ม แล้วค่อย ๆ ลากตามเส้นคลื่นขึ้นลงไปจนถึงจุดจบ',
    guide: Array.from({ length: 33 }, (_, index) => ({ x: .1 + .8 * index / 32, y: .5 + .16 * Math.sin(index / 32 * Math.PI * 2) })),
  }, {
    id: `g${grade}-path-4`, kind: 'path', title: 'ลากทางขั้นบันได',
    instruction: 'เริ่มที่จุดเริ่ม ลากตามทางตรงแล้วเลี้ยวไปทีละขั้นจนถึงจุดจบ',
    guide: [{ x: .1, y: .65 }, { x: .3, y: .65 }, { x: .3, y: .5 }, { x: .5, y: .5 }, { x: .5, y: .35 }, { x: .7, y: .35 }, { x: .7, y: .5 }, { x: .9, y: .5 }],
  });
  const usedPairNumbers = [];
  for (let index = 0; index < (expanded ? 4 : 2); index++) {
    const activity = connectActivity(grade, index, rng, expanded ? usedPairNumbers : []);
    activities.push(activity);
    usedPairNumbers.push(...activity.pairs.map(pair => Number(pair.rightLabel)));
  }
  activities.push(...coinActivities(grade, rng, expanded ? 4 : 2));
  const title = `ป.${grade} — สนุกกับการเขียนและลากเส้น`;
  const round = { grade, title, activities: activities.map(withHandwritingTranslations), translations: { th: { title }, en: { title: `Grade ${grade} — Writing and tracing fun` } } };
  return localizeHandwritingRound(round, language);
}


function englishPlaceLabel(label) {
  const units = { หน่วย: ['one', 'ones'], สิบ: ['ten', 'tens'], ร้อย: ['hundred', 'hundreds'], พัน: ['thousand', 'thousands'] };
  return label.replace(/(\d) (หน่วย|สิบ|ร้อย|พัน)/g, (_, digit, unit) => `${digit} ${units[unit][digit === '1' ? 0 : 1]}`).replaceAll(' กับ ', ' + ');
}

function withHandwritingTranslations(activity) {
  const th = { title: activity.title, instruction: activity.instruction };
  let title, instruction;
  if (activity.kind === 'trace') {
    title = `Trace the number ${activity.target}`;
    instruction = `Follow every digit of ${activity.target} with your finger or pen. Take your time.`;
  } else if (activity.kind === 'copy') {
    title = `Look and write ${activity.target}`;
    instruction = `Look at ${activity.target}, then write every digit in the empty space. Take your time.`;
  } else if (activity.kind === 'path') {
    const paths = {
      '1': ['Trace a gentle zigzag', 'Start at the start dot and follow the zigzag to the finish. Take your time.'],
      '2': ['Trace a curved path', 'Start at the start dot and follow the curve to the finish. Take your time.'],
      '3': ['Trace a wave up and down', 'Start at the start dot and follow the wave up and down to the finish. Take your time.'],
      '4': ['Trace a staircase path', 'Start at the start dot. Follow the straight lines and turn at each step until you reach the finish.'],
    };
    [title, instruction] = paths[activity.id.split('-').at(-1)];
  } else if (activity.kind === 'connect') {
    const pictures = activity.id.startsWith('g1-');
    title = pictures ? 'Match pictures to numbers' : activity.id.endsWith('-1') ? 'Match place values to numbers' : 'Match equal values';
    instruction = pictures ? 'Count the shapes on the left, then connect each group to its number on the right. There are 3 pairs.' : 'Look at the values on the left, then connect each one to the equal number on the right. There are 3 pairs.';
    th.pairs = activity.pairs;
  } else if (activity.kind === 'coins') {
    title = `Add coins to make ${activity.targetMoney} baht`;
    instruction = `Each coin is worth ${activity.coinValue} baht. You need ${activity.targetCount} coins to make ${activity.targetMoney} baht. You have ${activity.startCount} coins. Add the rest.`;
  }
  const en = { title, instruction };
  if (activity.pairs) en.pairs = activity.pairs.map(pair => ({ ...pair, leftLabel: englishPlaceLabel(pair.leftLabel) }));
  return { ...activity, translations: { th, en } };
}

/** Change the words of a round without generating new numbers, paths or pairs. */
export function localizeHandwritingRound(round, language = 'th') {
  const locale = language === 'en' ? 'en' : 'th';
  return {
    ...round, ...round.translations?.[locale],
    activities: round.activities.map(activity => ({ ...activity, ...activity.translations?.[locale] })),
  };
}
