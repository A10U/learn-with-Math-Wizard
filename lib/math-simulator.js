// Small, deterministic learning models. Grade suggestions are starting points;
// every room remains available to every learner.
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const SIMULATOR_ROOMS = freeze([
  { id: 'addition', symbol: '+', grade: 1, color: '#f59e0b', label: { th: 'สะพานสิบ', en: 'Bridge to ten' }, description: { th: 'ย้ายลูกแก้วให้เห็นว่าการบวกทำงานอย่างไร', en: 'Move counters and discover how addition works.' } },
  { id: 'subtraction', symbol: '−', grade: 1, color: '#f97373', label: { th: 'หายไปเท่าไร', en: 'Take-away garden' }, description: { th: 'หยิบออกแล้วมองเห็นจำนวนที่เหลือ', en: 'Take objects away and see what remains.' } },
  { id: 'multiplication', symbol: '×', grade: 2, color: '#8b5cf6', label: { th: 'สวนคูณมหัศจรรย์', en: 'Multiplication garden' }, description: { th: 'จัดของเป็นแถว แล้วสลับแถวกับหลัก', en: 'Build an array, then swap its rows and columns.' } },
  { id: 'division', symbol: '÷', grade: 3, color: '#38bdf8', label: { th: 'แบ่งขนมให้เพื่อน', en: 'Share the treats' }, description: { th: 'แบ่งทีละชิ้นให้เท่ากัน และสำรวจเศษที่เหลือ', en: 'Share one treat at a time and explore remainders.' } },
  { id: 'fractions', symbol: '½', grade: 4, color: '#ec4899', label: { th: 'พิซซ่าเศษส่วน', en: 'Fraction kitchen' }, description: { th: 'แบ่งชิ้นให้เล็กลง แต่ปริมาณยังเท่าเดิม', en: 'Make smaller equal pieces without changing the amount.' } },
  { id: 'percent', symbol: '%', grade: 5, color: '#10b981', label: { th: 'ร้านค้าร้อยละ', en: 'Percent shop' }, description: { th: 'ลองลดราคาแล้วดูว่าเราประหยัดเท่าไร', en: 'Try a discount and discover how much you save.' } },
  { id: 'scale', symbol: '↔', grade: 6, color: '#6366f1', label: { th: 'แผนที่นักสำรวจ', en: 'Explorer map' }, description: { th: 'เชื่อมระยะบนแผนที่กับระยะทางจริง', en: 'Connect map measurements to real distances.' } },
]);

export const SIMULATOR_GRADE_PRESETS = freeze([
  { grade: 1, room: 'addition' }, { grade: 2, room: 'multiplication' },
  { grade: 3, room: 'division' }, { grade: 4, room: 'fractions' },
  { grade: 5, room: 'percent' }, { grade: 6, room: 'scale' },
]);

const defaults = freeze({
  addition: { a: 8, b: 6, c: 0, phase: 0 },
  subtraction: { a: 12, b: 5, c: 0, phase: 0 },
  multiplication: { a: 3, b: 4, c: 0, phase: 0 },
  division: { a: 17, b: 5, c: 0, phase: 0 },
  fractions: { a: 3, b: 4, c: 1, phase: 0 },
  percent: { a: 200, b: 25, c: 0, phase: 0 },
  scale: { a: 3, b: 100000, c: 0, phase: 0 },
});

const ranges = {
  addition: [[5, 9, 1], [1, 9, 1]],
  subtraction: [[5, 20, 1], [0, 20, 1]],
  multiplication: [[1, 6, 1], [1, 8, 1]],
  division: [[1, 24, 1], [2, 6, 1]],
  fractions: [[0, 12, 1], [2, 12, 1]],
  percent: [[100, 1000, 50], [0, 100, 5]],
  scale: [[1, 5, 1], [10000, 100000, 10000]],
};

function metadata(room) {
  const item = SIMULATOR_ROOMS.find(candidate => candidate.id === room);
  if (!item) throw new RangeError('Choose a supported math simulator room');
  return item;
}

function bounded(value, min, max, step = 1, fallback = min) {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, min + Math.round((number - min) / step) * step));
}

/** Normalize user controls and action state without mutating the input. */
export function createSimulatorState(room = 'addition', overrides = {}) {
  metadata(room);
  const input = overrides && typeof overrides === 'object' ? overrides : {};
  const initial = defaults[room], [aRange, bRange] = ranges[room];
  let a = bounded(input.a, ...aRange, initial.a);
  const b = bounded(input.b, ...bRange, initial.b);
  if (room === 'fractions') a = Math.min(a, b);
  const state = { room, a, b: room === 'subtraction' ? Math.min(a, b) : b, c: 0, phase: 0 };
  if (room === 'addition' || room === 'multiplication') state.phase = bounded(input.phase, 0, 1, 1, 0);
  if (room === 'division') state.c = bounded(input.c, 0, a, 1, 0);
  if (room === 'fractions') state.c = bounded(input.c, 1, 2, 1, 1);
  return state;
}

/** Changing a quantity starts its visual experiment again. */
export function changeSimulatorValue(state, key, value) {
  const current = createSimulatorState(state.room, state);
  if (key !== 'a' && key !== 'b') return current;
  return createSimulatorState(current.room, { ...current, [key]: value, c: current.room === 'fractions' ? 1 : 0, phase: 0 });
}

/** One repeatable action: regroup, transpose, deal a token, or refine pieces. */
export function advanceSimulator(state) {
  const current = createSimulatorState(state.room, state);
  if (current.room === 'addition' || current.room === 'multiplication') return { ...current, phase: 1 - current.phase };
  if (current.room === 'division') return { ...current, c: current.c === current.a ? 0 : current.c + 1 };
  if (current.room === 'fractions') return { ...current, c: current.c === 1 ? 2 : 1 };
  return current;
}

const controlWords = {
  th: {
    addition: ['กลุ่มแรก', 'เพิ่มอีก'], subtraction: ['มีทั้งหมด', 'หยิบออก'],
    multiplication: ['จำนวนแถว', 'จำนวนในแต่ละแถว'], division: ['ขนมทั้งหมด', 'จำนวนเพื่อน'],
    fractions: ['ชิ้นที่ระบายสี', 'ชิ้นทั้งหมด'], percent: ['ราคาเต็ม (บาท)', 'ส่วนลด (%)'],
    scale: ['ระยะบนแผนที่ (ซม.)', 'มาตราส่วน 1 ต่อ'],
  },
  en: {
    addition: ['First group', 'Add more'], subtraction: ['Start with', 'Take away'],
    multiplication: ['Rows', 'Objects in each row'], division: ['Total treats', 'Friends'],
    fractions: ['Shaded pieces', 'Total equal pieces'], percent: ['Original price (baht)', 'Discount (%)'],
    scale: ['Map distance (cm)', 'Scale: 1 to'],
  },
};

const tidy = value => Number(value.toFixed(6));

/** Complete localized presentation plus machine-readable, language-free math. */
export function getSimulatorModel(input, language = 'th') {
  const state = createSimulatorState(input.room, input);
  const { room, a, b, c, phase } = state;
  const locale = language === 'en' ? 'en' : 'th', en = locale === 'en', roomData = metadata(room);
  const controls = ['a', 'b'].map((key, index) => {
    const [min, max, step] = ranges[room][index];
    return { key, label: controlWords[locale][room][index], min, max: room === 'subtraction' && key === 'b' ? a : room === 'fractions' && key === 'a' ? b : max, step, value: state[key] };
  });
  const model = {
    ...state, language: locale, title: roomData.label[locale], description: roomData.description[locale],
    controls, actionLabel: '', actionDisabled: false,
  };
  if (room === 'addition') {
    const result = a + b, moved = phase ? Math.min(10 - a, b) : 0;
    const left = a + moved, right = b - moved;
    Object.assign(model, {
      result, answer: result, total: result, moved, left, right,
      formula: phase ? `${a} + ${b} = ${left} + ${right} = ${result}` : `${a} + ${b} = ${result}`,
      explanation: en
        ? phase
          ? `Move ${moved} counters to the first group. It now has ${left}; ${right} remain in the second group. The total stays ${result}.${result < 10 ? ` You still need ${10 - result} more counters to make ten.` : ''}`
          : `There are ${a} counters and ${b} more. Together they make ${result}. ${result < 10 ? `This is ${10 - result} short of ten. Try combining them in the first frame.` : 'Try moving counters to fill ten.'}`
        : phase
          ? `ย้าย ${moved} ลูกไปกลุ่มแรก จึงมี ${left} ลูก และกลุ่มที่สองเหลือ ${right} ลูก รวมยังเท่ากับ ${result} ลูก${result < 10 ? ` ยังขาดอีก ${10 - result} ลูกจึงจะครบสิบ` : ''}`
          : `มี ${a} ลูก เพิ่มอีก ${b} ลูก รวมเป็น ${result} ลูก ${result < 10 ? `ยังขาดอีก ${10 - result} ลูกจึงจะครบสิบ ลองรวมไว้ในกรอบแรก` : 'ลองย้ายลูกแก้วมาเติมให้ครบสิบ'}`,
      actionLabel: en ? phase ? 'Undo regrouping' : result < 10 ? 'Combine in the first frame' : 'Fill the ten frame' : phase ? 'กลับไปสองกลุ่ม' : result < 10 ? 'รวมในกรอบแรก' : 'ย้ายมาเติมสิบ',
      visual: { type: 'ten-frame', left, right, moved, regrouped: phase === 1, total: result },
    });
  } else if (room === 'subtraction') {
    const result = a - b;
    Object.assign(model, {
      result, answer: result, total: a, removed: b, remaining: result,
      formula: `${a} − ${b} = ${result}`,
      explanation: en ? `Start with ${a} objects. Take away ${b}; ${result} are left.` : `เริ่มจาก ${a} ชิ้น หยิบออก ${b} ชิ้น จึงเหลือ ${result} ชิ้น`,
      actionDisabled: true, visual: { type: 'take-away', total: a, removed: b, remaining: result },
    });
  } else if (room === 'multiplication') {
    const rows = phase ? b : a, columns = phase ? a : b, result = a * b;
    Object.assign(model, {
      result, answer: result, total: result, rows, columns, groups: rows, perGroup: columns,
      formula: `${rows} × ${columns} = ${result}`,
      explanation: en ? `${rows} rows with ${columns} objects in each row make ${result}. Swapping rows and columns keeps the total the same.` : `${rows} แถว แถวละ ${columns} ชิ้น รวม ${result} ชิ้น เมื่อสลับแถวกับหลัก จำนวนรวมยังเท่าเดิม`,
      actionLabel: en ? 'Swap rows and columns' : 'สลับแถวกับหลัก',
      visual: { type: 'array', rows, columns, total: result },
    });
  } else if (room === 'division') {
    const quotient = Math.floor(a / b), remainder = a % b;
    const distributed = Math.min(c, quotient * b), undealt = a - c, remainderCount = Math.max(0, c - quotient * b);
    const piles = Array.from({ length: b }, (_, index) => Math.floor(distributed / b) + (index < distributed % b ? 1 : 0));
    const final = c === a;
    Object.assign(model, {
      result: quotient, answer: quotient, quotient, remainder, distributed, undealt, remainderCount, piles, final,
      formula: en ? `${a} ÷ ${b} = ${quotient} remainder ${remainder}` : `${a} ÷ ${b} = ${quotient} เศษ ${remainder}`,
      explanation: en
        ? final ? `Each of the ${b} friends gets ${quotient} treats. ${remainder} treats remain because there are not enough for another equal round.` : `Share the ${a} treats among ${b} friends, one at a time. ${undealt} treats are still waiting; keep any extra treats in the remainder tray.`
        : final ? `เพื่อน ${b} คน ได้คนละ ${quotient} ชิ้น เหลือเศษ ${remainder} ชิ้น เพราะไม่พอแบ่งเพิ่มให้ครบทุกคน` : `แบ่งขนม ${a} ชิ้นให้เพื่อน ${b} คนทีละชิ้น ยังมีขนมรอแบ่ง ${undealt} ชิ้น ถ้าไม่พอแบ่งให้ครบทุกคน ให้วางไว้ในถาดเศษ`,
      actionLabel: en ? final ? 'Start sharing again' : c >= quotient * b ? 'Put one in the remainder tray' : 'Share one treat' : final ? 'เริ่มแบ่งใหม่' : c >= quotient * b ? 'วางในถาดเศษ 1 ชิ้น' : 'แบ่งขนม 1 ชิ้น',
      visual: { type: 'sharing', groups: b, piles, total: a, processed: c, distributed, undealt, remainder: remainderCount, quotient, final },
    });
  } else if (room === 'fractions') {
    const numerator = a * c, denominator = b * c, result = a / b;
    Object.assign(model, {
      result, answer: result, numerator, denominator, originalNumerator: a, originalDenominator: b, factor: c,
      formula: c === 2 ? `${a}/${b} = ${numerator}/${denominator}` : `${a}/${b}`,
      explanation: en
        ? c === 2 ? `Split every original piece into 2 equal pieces. ${numerator} of ${denominator} pieces are shaded. The shaded amount is still ${a}/${b} of the same whole.` : `Shade ${a} of ${b} equal pieces of one whole. Split every piece in two to discover an equivalent fraction.`
        : c === 2 ? `แบ่งทุกชิ้นเป็น 2 ส่วนเท่า ๆ กัน ได้ส่วนที่ระบายสี ${numerator} จาก ${denominator} ส่วน ปริมาณยังเท่ากับ ${a}/${b} ของหนึ่งเต็มเดิม` : `ระบายสี ${a} จาก ${b} ส่วนเท่า ๆ กันของหนึ่งเต็ม ลองแบ่งทุกชิ้นเป็นสองส่วนเพื่อหาเศษส่วนที่เท่ากัน`,
      actionLabel: en ? c === 2 ? 'Return to the original pieces' : 'Split every piece in two' : c === 2 ? 'กลับไปชิ้นเดิม' : 'แบ่งทุกชิ้นเป็น 2',
      visual: { type: 'fraction-bar', numerator, denominator, originalNumerator: a, originalDenominator: b, factor: c },
    });
  } else if (room === 'percent') {
    const discount = tidy(a * b / 100), pay = tidy(a - discount);
    Object.assign(model, {
      result: pay, answer: pay, price: a, percent: b, discount, pay,
      formula: `${a} − (${a} × ${b}/100) = ${pay}`,
      explanation: en ? `${b}% means ${b} out of 100. Save ${discount} baht from ${a} baht, then pay ${pay} baht.` : `${b}% หมายถึง ${b} จาก 100 ส่วน ลดจากราคา ${a} บาท เป็นเงิน ${discount} บาท จึงจ่าย ${pay} บาท`,
      actionDisabled: true, visual: { type: 'percent-grid', percent: b, price: a, discount, pay },
    });
  } else if (room === 'scale') {
    const meters = a * b / 100, kilometers = a * b / 100000;
    Object.assign(model, {
      result: kilometers, answer: kilometers, centimeters: a, ratio: b, meters, kilometers,
      formula: `${a} × ${b} = ${a * b} ${en ? 'cm' : 'ซม.'} = ${kilometers} ${en ? 'km' : 'กม.'}`,
      explanation: en ? `At scale 1:${b}, 1 cm on the map represents ${b} cm in real life. ${a} cm represents ${meters} meters, or ${kilometers} kilometers.` : `มาตราส่วน 1:${b} หมายถึง 1 ซม. บนแผนที่แทน ${b} ซม. จริง ระยะ ${a} ซม. จึงแทน ${meters} เมตร หรือ ${kilometers} กิโลเมตร`,
      actionDisabled: true, visual: { type: 'map-scale', centimeters: a, ratio: b, meters, kilometers },
    });
  }
  model.summary = `${model.title}: ${model.explanation}`;
  model.accessibleSummary = model.summary;
  return model;
}

const missionTargets = freeze({
  addition: [14, 16, 12], subtraction: [7, 9, 4], multiplication: [12, 20, 24],
  division: [{ quotient: 2, remainder: 1 }, { quotient: 3, remainder: 2 }, { quotient: 4, remainder: 0 }],
  fractions: [{ numerator: 1, denominator: 2 }, { numerator: 3, denominator: 4 }, { numerator: 2, denominator: 3 }],
  percent: [150, 300, 450], scale: [2, 3, 4],
});

export function createSimulatorMission(room, index = 0) {
  metadata(room);
  const position = typeof index === 'number' && Number.isFinite(index) ? ((Math.trunc(index) % 3) + 3) % 3 : 0;
  const original = missionTargets[room][position];
  const target = original && typeof original === 'object' ? { ...original } : original;
  let startState, prompt, hint;
  if (room === 'addition') {
    startState = createSimulatorState(room, { a: 8, b: 3 });
    prompt = { th: `จัดลูกแก้วให้รวมได้ ${target} ลูก แล้วกดย้ายมาเติมสิบ`, en: `Make a total of ${target} counters, then fill the ten frame.` };
    hint = { th: `ลองเริ่มที่ 8 ลูก แล้วปรับจำนวนที่เพิ่มให้รวมได้ ${target}`, en: `Try starting with 8 counters and adjust how many you add to reach ${target}.` };
  } else if (room === 'subtraction') {
    startState = createSimulatorState(room, { a: 12, b: 2 });
    prompt = { th: `จัดของแล้วหยิบออก ให้เหลือ ${target} ชิ้น`, en: `Choose a starting amount and take away objects until ${target} remain.` };
    hint = { th: `ถ้าเริ่มที่ 12 ชิ้น ต้องหยิบออก ${12 - target} ชิ้น`, en: `Starting with 12 objects, take away ${12 - target}.` };
  } else if (room === 'multiplication') {
    startState = createSimulatorState(room, { a: 3, b: 3 });
    prompt = { th: `จัดสวนให้มี ${target} ชิ้น แล้วกดสลับแถวกับหลัก`, en: `Build an array of ${target} objects, then swap rows and columns.` };
    hint = { th: `ลองใช้ ${target === 20 ? 4 : target === 24 ? 4 : 3} แถว แล้วปรับจำนวนในแต่ละแถว`, en: `Try ${target === 20 ? 4 : target === 24 ? 4 : 3} rows, then adjust the number in each row.` };
  } else if (room === 'division') {
    startState = createSimulatorState(room, { a: 10, b: 4 });
    prompt = { th: `ปรับขนมและเพื่อน แล้วแบ่งให้ครบ ให้ได้คนละ ${target.quotient} ชิ้น และเหลือเศษ ${target.remainder} ชิ้น`, en: `Choose treats and friends, then finish sharing: ${target.quotient} each with ${target.remainder} left over.` };
    const friends = target.remainder === 2 ? 3 : 2;
    hint = { th: `ลองใช้เพื่อน ${friends} คน กับขนม ${friends * target.quotient + target.remainder} ชิ้น แล้วแบ่งทีละชิ้นจนหมด`, en: `Try ${friends} friends and ${friends * target.quotient + target.remainder} treats, then process every treat.` };
  } else if (room === 'fractions') {
    startState = createSimulatorState(room, { a: 1, b: 5 });
    prompt = { th: `ระบายสีให้เท่ากับ ${target.numerator}/${target.denominator} แล้วแบ่งทุกชิ้นเป็น 2 ส่วน`, en: `Shade an amount equal to ${target.numerator}/${target.denominator}, then split every piece in two.` };
    hint = { th: `ตั้งตัวเศษ ${target.numerator} และตัวส่วน ${target.denominator} ก่อนกดแบ่งชิ้น ปริมาณที่ระบายสีต้องเท่าเดิม`, en: `Set numerator ${target.numerator} and denominator ${target.denominator}, then split the pieces. Keep the shaded amount the same.` };
  } else if (room === 'percent') {
    startState = createSimulatorState(room, { a: target / 0.75, b: 10 });
    prompt = { th: `จัดส่วนลดให้ลูกค้าจ่าย ${target} บาท โดยมีส่วนลดมากกว่า 0% และน้อยกว่า 100%`, en: `Choose a price and discount so the customer pays ${target} baht. Use a discount above 0% and below 100%.` };
    hint = { th: `ลองราคาเต็ม ${target / 0.75} บาท และส่วนลด 25%`, en: `Try an original price of ${target / 0.75} baht and a 25% discount.` };
  } else {
    startState = createSimulatorState(room, { a: 1, b: 100000 });
    prompt = { th: `ปรับแผนที่ให้ระยะทางจริงเท่ากับ ${target} กิโลเมตร`, en: `Adjust the map so the real distance is ${target} kilometers.` };
    hint = { th: `ที่มาตราส่วน 1:100000 ระยะ 1 ซม. แทน 1 กม. ลองปรับระยะบนแผนที่`, en: `At scale 1:100000, 1 cm represents 1 km. Try changing the map distance.` };
  }
  return { id: `simulator-${room}-${position}`, room, index: position, target, startState, prompt, hint };
}

/** Missions measure a visible arrangement or action, never a text-box answer. */
export function evaluateSimulatorMission(mission, input) {
  if (!mission || !input || mission.room !== input.room || !SIMULATOR_ROOMS.some(item => item.id === mission.room)) return false;
  const state = createSimulatorState(input.room, input);
  const { room, a, b, c, phase } = state;
  const target = mission.target;
  if (room === 'addition') return a + b === target && phase === 1;
  if (room === 'subtraction') return a - b === target;
  if (room === 'multiplication') return a * b === target && phase === 1;
  if (room === 'division') return c === a && Math.floor(a / b) === target?.quotient && a % b === target?.remainder;
  if (room === 'fractions') return c === 2 && a * target?.denominator === b * target?.numerator;
  if (room === 'percent') return b > 0 && b < 100 && tidy(a * (100 - b) / 100) === target;
  return a * b / 100000 === target;
}
