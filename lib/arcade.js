import { englishArcadeText } from './arcade-i18n.js';
import { createQuestionRound, localizeQuestion } from './questions.js';

// Short games follow the same grade topics as practice and challenge rounds.
export const ARCADE_MODES = Object.freeze([
  { id: 'choice', title: 'เลือกคำตอบ', description: 'ลองทำโจทย์ของชั้นที่เลือก แล้วเลือกคำตอบจาก 4 ตัวเลือก', icon: '🎯', en: { title: 'Pick the answer', description: 'Practice grade topics and choose from four answers' } },
  { id: 'truth', title: 'ถูกหรือผิด', description: 'ดูคำตอบที่ให้มา แล้วตัดสินว่าถูกหรือผิด', icon: '🔎', en: { title: 'True or false', description: 'Check answers across the selected grade topics' } },
  { id: 'compare', title: 'เปรียบเทียบจำนวน', description: 'เลือกเครื่องหมายมากกว่า น้อยกว่า หรือเท่ากับ', icon: '⚖️', en: { title: 'Compare numbers', description: 'Choose greater than, less than or equal to' } },
  { id: 'order', title: 'เรียงลำดับ', description: 'จัดจำนวน 4 จำนวนจากน้อยไปมาก', icon: '🪜', en: { title: 'Number order', description: 'Arrange four numbers from smallest to largest' } },
  { id: 'match', title: 'จับคู่คำนวณ', description: 'จับคู่โจทย์ 3 ข้อกับคำตอบที่ถูกต้อง', icon: '🧩', en: { title: 'Calculation match', description: 'Match three calculations to their equal values' } },
  { id: 'shop', title: 'ตลาดเงินทอน', description: 'ลองซื้อของ คิดราคารวม แล้วหาเงินทอน', icon: '🛍️', en: { title: 'Change shop', description: 'Go shopping and calculate totals and change' } },
  { id: 'measure', title: 'แปลงหน่วย', description: 'ฝึกความยาว มวล และความจุทีละขั้น', icon: '📏', en: { title: 'Unit converter', description: 'Practice length, mass and capacity step by step' } },
  { id: 'pattern', title: 'ไขแบบรูป', description: 'สังเกตกฎแล้วเติมจำนวนถัดไป', icon: '🔮', en: { title: 'Pattern puzzle', description: 'Find the rule and fill in the next number' } },
  { id: 'geometry', title: 'นักสืบรูปทรง', description: 'สำรวจด้าน มุม ความยาว พื้นที่ และปริมาตร', icon: '🔷', en: { title: 'Shape detective', description: 'Explore sides, corners, lengths, areas and volumes' } },
  { id: 'parts', title: 'แบ่งส่วนและนับภาพ', description: 'นับวงกลมที่ระบายสี แล้วเขียนเป็นจำนวนหรือเศษส่วน', icon: '🍕', en: { title: 'Count and share', description: 'Count colored circles and connect numbers to fractions' } },
]);

const unit = rng => {
  const value = Number(rng());
  return Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : 0;
};
const integer = (rng, min, max) => min + Math.floor(unit(rng) * (max - min + 1));
const pick = (rng, values) => values[integer(rng, 0, values.length - 1)];
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const decimal = value => String(Math.round(value * 1_000_000) / 1_000_000);
function label(numerator, denominator = 1, style = 'decimal') {
  if (style === 'raw-fraction') return `${numerator}/${denominator}`;
  if (style !== 'fraction' || denominator === 1) return decimal(numerator / denominator);
  const factor = gcd(numerator, denominator);
  return `${numerator / factor}/${denominator / factor}`;
}
function shuffle(values, rng, requireChange = false) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = integer(rng, 0, index);
    [result[index], result[other]] = [result[other], result[index]];
  }
  if (requireChange && result.every((value, index) => value === values[index])) result.push(result.shift());
  return result;
}
function selection(id, prompt, options, correctId, hint, rng, extra = {}) {
  return { id, kind: 'choice', prompt, hint, options: shuffle(options, rng), correctId, ...extra };
}
function numericChoice(id, prompt, numerator, denominator, hint, rng, { style = 'decimal', suffix = '', visual, max = Infinity } = {}) {
  const values = [numerator], labels = new Set([label(numerator, denominator, style)]);
  // Work in numerator units so fractions and decimals retain distinct values.
  // Prefer nearby values while keeping young learners inside their number range.
  for (const offset of [1, 2, -1, -2, 3, -3, 4, -4]) {
    const value = numerator + offset, display = label(value, denominator, style);
    if (value < 0 || value / denominator > max || labels.has(display)) continue;
    values.push(value); labels.add(display);
    if (values.length === 4) break;
  }
  if (values.length !== 4) throw new RangeError('Cannot make four distinct answer choices');
  const options = values.map((value, index) => ({ id: `${id}-answer-${index}`, label: `${label(value, denominator, style)}${suffix}` }));
  return selection(id, prompt, options, options[0].id, hint, rng, visual ? { visual } : {});
}
// Keep fractions exact when producing choices; Number('1/2') would lose a
// valid bank answer. Decimal bank answers become integer numerator units too.
function answerParts(answer) {
  const text = String(answer).trim();
  const fraction = text.match(/^(-?\d+)\/(\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]), denominator = Number(fraction[2]);
    if (denominator > 0 && Number.isFinite(numerator / denominator)) return { numerator, denominator, style: 'fraction' };
  } else {
    const value = Number(text);
    if (Number.isFinite(value)) {
      const [mantissa, exponent = '0'] = text.toLowerCase().split('e');
      const places = Math.max(0, (mantissa.split('.')[1] || '').length - Number(exponent));
      const denominator = 10 ** places;
      if (Number.isSafeInteger(Math.round(value * denominator))) return { numerator: Math.round(value * denominator), denominator, style: 'decimal' };
    }
  }
  throw new RangeError('Question bank answer must be a finite number or fraction');
}
const choicePrompt = prompt => prompt.replace(/\s*\((?:ตอบ(?:แบบ a\/b|เศษส่วน a\/b|เป็น(?:จำนวน เศษส่วน|เศษส่วน) a\/b)|You may answer|Answer as a\/b)[^)]*\)\s*$/, '');
function calculation(id, grade, index, rng, truth, question) {
  const q = answerParts(question.answer), metadata = { topic: question.topic, sourceQuestionId: question.id };
  const text = language => {
    const localized = localizeQuestion(question, language);
    return { prompt: choicePrompt(localized.prompt), hint: localized.hint, ...(localized.visual ? { visual: structuredClone(localized.visual) } : {}) };
  };
  const thai = text('th'), english = text('en');
  let activity;
  if (!truth) {
    activity = numericChoice(id, thai.prompt, q.numerator, q.denominator, thai.hint, rng, { style: q.style, max: grade === 1 ? 100 : Infinity });
    activity.translations = {
      th: { ...thai, options: activity.options.map(option => ({ ...option })) },
      en: { ...english, options: activity.options.map(option => ({ ...option })) },
    };
  } else {
    const correct = (index + integer(rng, 0, 1)) % 2 === 0;
    const difference = q.numerator >= (grade === 1 ? 98 * q.denominator : grade === 3 && q.style === 'fraction' ? q.denominator : Infinity) ? -1 : 1;
    const proposed = label(q.numerator + (correct ? 0 : difference), q.denominator, q.style);
    const options = [{ id: 'true', label: 'ถูก' }, { id: 'false', label: 'ผิด' }];
    activity = selection(id, `${thai.prompt} คำตอบที่เสนอ: ${proposed} ถูกหรือผิด?`, options, correct ? 'true' : 'false', thai.hint, rng);
    activity.proposedAnswer = proposed;
    activity.translations = {
      th: { ...thai, prompt: activity.prompt, options: activity.options.map(option => ({ ...option })) },
      en: { ...english, prompt: `${english.prompt} Proposed answer: ${proposed}. True or false?`, options: activity.options.map(option => ({ ...option, label: option.id === 'true' ? 'True' : 'False' })) },
    };
  }
  return { ...activity, ...metadata, ...(thai.visual ? { visual: thai.visual } : {}) };
}
function comparison(id, grade, index, rng) {
  const denominator = grade <= 2 ? 1 : grade === 3 ? integer(rng, 3, 10) : pick(rng, grade >= 5 ? [4, 8, 20, 100] : [2, 4, 5, 10]);
  const a = integer(rng, 2, grade === 1 ? 100 : grade === 2 ? 990 : grade === 3 ? denominator - 1 : denominator * 3);
  const shift = index % 3 === 2 ? 0 : integer(rng, 1, 3) * (index % 3 === 0 ? 1 : -1);
  const b = Math.max(1, Math.min(grade === 1 ? 100 : grade === 3 ? denominator : Infinity, a + shift)), left = label(a, denominator, grade === 3 ? 'raw-fraction' : grade >= 4 ? 'fraction' : 'decimal');
  const right = grade === 3 ? label(b, denominator, 'raw-fraction') : label(b, denominator);
  const relation = a < b ? '<' : a > b ? '>' : '=';
  const hint = grade === 3 ? `ตัวส่วนเท่ากัน เปรียบเทียบตัวเศษ ${a} กับ ${b} ดังนั้น ${left} ${relation} ${right}` : `${left} = ${label(a, denominator)} และ ${right} = ${label(b, denominator)} ดังนั้น ${left} ${relation} ${right}`;
  return selection(id, `${left} □ ${right} เลือกเครื่องหมายให้ถูกต้อง`, ['<', '>', '='].map(value => ({ id: value, label: value })), relation, hint, rng);
}
function ordering(id, grade, index, rng) {
  const denominator = grade <= 2 ? 1 : grade === 3 ? integer(rng, 4, 10) : pick(rng, grade >= 5 ? [20, 100, 1000] : [4, 5, 8, 10]);
  let numerator = grade === 3 ? integer(rng, 0, denominator - 4) : integer(rng, 1, grade === 1 ? 50 : grade === 2 ? 700 : denominator * 3);
  const options = Array.from({ length: 4 }, (_, option) => {
    numerator += grade === 3 ? 1 : integer(rng, 1, grade === 1 ? 10 : grade === 2 ? 40 : 9);
    return { id: `${id}-number-${option}`, label: label(numerator, denominator, grade === 3 ? 'raw-fraction' : grade >= 4 && (option + index) % 2 === 0 ? 'fraction' : 'decimal') };
  });
  return { id, kind: 'order', prompt: 'เรียงจำนวนจากน้อยไปมาก', hint: `จากน้อยไปมาก: ${options.map(option => option.label).join(' < ')}`, options: shuffle(options, rng, true), correctOrder: options.map(option => option.id) };
}
function matching(id, grade, index, rng) {
  const base = integer(rng, 3, grade === 1 ? 98 : grade === 2 ? 7 : grade === 3 ? 60 : 150), factor = integer(rng, 2, 9);
  const denominator = grade >= 4 ? pick(rng, [4, 5, 10, 20]) : 1;
  const pairs = Array.from({ length: 3 }, (_, offset) => {
    const target = base + offset;
    let left, right;
    if (grade === 1) { const removed = integer(rng, 1, target - 1); left = `${target - removed} + ${removed}`; right = String(target); }
    else if (grade <= 3) { left = `${target} × ${factor}`; right = String(target * factor); }
    else { const a = integer(rng, 1, target - 1); left = `${label(a, denominator, index % 2 ? 'fraction' : 'decimal')} + ${label(target - a, denominator, index % 2 ? 'fraction' : 'decimal')}`; right = label(target, denominator, index % 2 ? 'fraction' : 'decimal'); }
    return { id: `${id}-pair-${offset}`, left, right };
  });
  return { id, kind: 'match', prompt: 'จับคู่โจทย์ทางซ้ายกับคำตอบที่มีค่าเท่ากันทางขวา', hint: pairs.map(pair => `${pair.left} = ${pair.right}`).join(' ; '), pairs, rightOrder: shuffle(pairs.map(pair => pair.id), rng, true) };
}
function shopping(id, grade, index, rng) {
  let cost, paid, prompt, hint;
  if (grade === 1) { cost = integer(rng, 1, 15); paid = integer(rng, cost + 1, 20); prompt = `ซื้อดินสอราคา ${cost} บาท จ่าย ${paid} บาท ได้เงินทอนกี่บาท?`; hint = `${paid} − ${cost} = ${paid - cost} บาท`; return numericChoice(id, prompt, paid - cost, 1, hint, rng); }
  const count = integer(rng, 2, grade === 2 ? 5 : 6);
  if (grade <= 3) { const price = integer(rng, grade === 2 ? 2 : 12, grade === 2 ? 9 : 99); cost = price * count; paid = Math.ceil((cost + 1) / 100) * 100; prompt = `ซื้อสมุด ${count} เล่ม เล่มละ ${price} บาท จ่าย ${paid} บาท ได้เงินทอนกี่บาท?`; hint = `ราคารวม ${count} × ${price} = ${cost} บาท เงินทอน ${paid} − ${cost} = ${paid - cost} บาท`; return numericChoice(id, prompt, paid - cost, 1, hint, rng); }
  const price = grade === 5 ? integer(rng, 1, 40) * 2000 : integer(rng, 25, 900) * 4;
  const total = price * count, rate = grade === 4 ? 0 : grade === 5 ? pick(rng, [10, 20, 25, 50]) : 25;
  cost = total * (100 - rate) / 100;
  paid = Math.ceil((cost + 1) / 10000) * 10000;
  prompt = `ซื้อสมุด ${count} เล่ม เล่มละ ${label(price, 100)} บาท${rate ? ` ลด ${rate}% ของราคารวม` : ''} จ่าย ${label(paid, 100)} บาท ได้เงินทอนกี่บาท?`;
  hint = `ราคารวม ${count} × ${label(price, 100)} = ${label(total, 100)} บาท${rate ? ` ลด ${rate}% คือ ${label(total * rate, 10000)} บาท เหลือ ${label(cost, 100)} บาท` : ''} เงินทอน ${label(paid, 100)} − ${label(cost, 100)} = ${label(paid - cost, 100)} บาท`;
  return numericChoice(id, prompt, paid - cost, 100, hint, rng);
}
function measurement(id, grade, index, rng) {
  if (grade === 1) { const a = integer(rng, 1, 9), b = integer(rng, 1, 9); return numericChoice(id, `ริบบิ้นยาว ${a} เซนติเมตร ต่ออีก ${b} เซนติเมตร รวมยาวกี่เซนติเมตร?`, a + b, 1, `${a} + ${b} = ${a + b} เซนติเมตร`, rng); }
  const units = grade === 2 ? [{ from: 'เมตร', to: 'เซนติเมตร', scale: 100 }] : [{ from: 'กิโลเมตร', to: 'เมตร', scale: 1000 }, { from: 'กิโลกรัม', to: 'กรัม', scale: 1000 }, { from: 'ลิตร', to: 'มิลลิลิตร', scale: 1000 }, { from: 'เมตร', to: 'เซนติเมตร', scale: 100 }];
  const spec = units[(index + integer(rng, 0, units.length - 1)) % units.length];
  const whole = integer(rng, 1, 9);
  if (grade <= 3) return numericChoice(id, `${whole} ${spec.from} เท่ากับกี่${spec.to}?`, whole * spec.scale, 1, `1 ${spec.from} = ${spec.scale} ${spec.to} ดังนั้น ${whole} × ${spec.scale} = ${whole * spec.scale} ${spec.to}`, rng);
  const small = integer(rng, 1, spec.scale - 1);
  if (grade === 4) return numericChoice(id, `${whole} ${spec.from} ${small} ${spec.to} รวมเป็นกี่${spec.to}?`, whole * spec.scale + small, 1, `${whole} × ${spec.scale} + ${small} = ${whole * spec.scale + small} ${spec.to}`, rng);
  if (grade === 5) { const numerator = integer(rng, 1, 999); return numericChoice(id, `${label(numerator, 100)} ${spec.from} เท่ากับกี่${spec.to}?`, numerator * spec.scale, 100, `1 ${spec.from} = ${spec.scale} ${spec.to} ดังนั้น ${label(numerator, 100)} × ${spec.scale} = ${label(numerator * spec.scale, 100)} ${spec.to}`, rng); }
  const amount = whole * spec.scale + small;
  return numericChoice(id, `${amount} ${spec.to} เท่ากับกี่${spec.from}?`, amount, spec.scale, `${amount} ÷ ${spec.scale} = ${label(amount, spec.scale)} ${spec.from}`, rng);
}
function pattern(id, grade, index, rng) {
  let start, step, denominator = 1, multiply = false, decrease = false;
  if (grade <= 2) {
    step = pick(rng, grade === 1 ? [1, 10] : [2, 5, 10, 100]);
    decrease = index % 2 === 1;
    const base = integer(rng, 0, (grade === 1 ? 100 : 1000) - step * 4);
    start = decrease ? base + step * 4 : base;
  } else if (grade <= 4 && index % 2) { start = integer(rng, 1, 6); step = integer(rng, 2, 3); multiply = true; }
  else { denominator = grade >= 5 ? pick(rng, [4, 5, 10, 100]) : 1; start = integer(rng, 1, grade >= 5 ? denominator * 3 : 99); step = integer(rng, 1, grade >= 5 ? denominator - 1 : 12); }
  const style = grade === 6 && index % 2 === 0 ? 'fraction' : 'decimal';
  const values = Array.from({ length: 5 }, (_, i) => multiply ? start * step ** i : start + (decrease ? -step : step) * i), shown = values.slice(0, 4).map(value => label(value, denominator, style));
  const rule = multiply ? `คูณด้วย ${step}` : `${decrease ? 'ลด' : 'เพิ่ม'}ทีละ ${label(step, denominator, style)}`;
  return numericChoice(id, `${shown.join(', ')}, ? แบบรูปนี้${rule} จำนวนถัดไปคืออะไร?`, values[4], denominator, `${shown[3]} ${multiply ? '×' : decrease ? '−' : '+'} ${label(step, multiply ? 1 : denominator, style)} = ${label(values[4], denominator, style)}`, rng, { style, max: grade <= 2 ? grade === 1 ? 100 : 1000 : Infinity });
}
function geometry(id, grade, index, rng) {
  const n = integer(rng, 2, 9), m = integer(rng, 2, 9);
  if (grade <= 2) {
    const shapes = [{ name: 'รูปสามเหลี่ยม', sides: 3 }, { name: 'รูปสี่เหลี่ยม', sides: 4 }, { name: 'รูปห้าเหลี่ยม', sides: 5 }, { name: 'รูปหกเหลี่ยม', sides: 6 }];
    if (index % 2 === 0) { const shape = shapes[integer(rng, 0, grade === 1 ? 1 : 3)]; return numericChoice(id, `${shape.name}มีด้านตรงกี่ด้าน?`, shape.sides, 1, `${shape.name}มีด้านตรง ${shape.sides} ด้าน นับขอบรูปทีละด้าน`, rng); }
    if (index === 3) { const sides = integer(rng, 3, 4); return selection(id, `รูปใดมีด้านตรง ${sides} ด้าน และมี ${sides} มุม?`, [{ id: 'circle', label: 'รูปวงกลม' }, { id: 'triangle', label: 'รูปสามเหลี่ยม' }, { id: 'square', label: 'รูปสี่เหลี่ยมจัตุรัส' }], sides === 3 ? 'triangle' : 'square', `รูป${sides === 3 ? 'สามเหลี่ยม' : 'สี่เหลี่ยมจัตุรัส'}มีด้านตรง ${sides} ด้าน และมี ${sides} มุม`, rng); }
    return selection(id, 'รูปใดไม่มีมุม?', [{ id: 'circle', label: 'รูปวงกลม' }, { id: 'triangle', label: 'รูปสามเหลี่ยม' }, { id: 'square', label: 'รูปสี่เหลี่ยมจัตุรัส' }], 'circle', 'รูปวงกลมเป็นเส้นโค้งต่อกัน ไม่มีมุม', rng);
  }
  if (grade === 3) return numericChoice(id, `เดินตามเส้นทาง 4 ช่วง ยาว ${n}, ${m}, ${n}, ${m} ซม. ตามลำดับ รวมเดินกี่ซม.?`, 2 * (n + m), 1, `บวกความยาวทั้งสี่ช่วง: ${n} + ${m} + ${n} + ${m} = ${2 * (n + m)} ซม.`, rng);
  if (grade === 4) return numericChoice(id, `รูปสี่เหลี่ยมผืนผ้ากว้าง ${n} ซม. ยาว ${m} ซม. มีพื้นที่กี่ตารางซม.?`, n * m, 1, `กว้าง × ยาว = ${n} × ${m} = ${n * m} ตารางซม.`, rng);
  if (grade === 5 && index % 2 === 0) return numericChoice(id, `รูปสี่เหลี่ยมด้านขนานฐาน ${n} ซม. สูงตั้งฉากกับฐาน ${m} ซม. มีพื้นที่กี่ตารางซม.?`, n * m, 1, `ฐาน × ความสูงตั้งฉาก = ${n} × ${m} = ${n * m} ตารางซม.`, rng);
  if (grade === 6 && index % 3 === 0) return numericChoice(id, `รูปสามเหลี่ยมฐาน ${n * 2} ซม. สูงตั้งฉากกับฐาน ${m} ซม. มีพื้นที่กี่ตารางซม.?`, n * m, 1, `ฐาน × ความสูงตั้งฉาก ÷ 2 = ${n * 2} × ${m} ÷ 2 = ${n * m} ตารางซม.`, rng);
  if (grade === 5 || index % 3 === 1) { const h = integer(rng, 2, 9); return numericChoice(id, `กล่องทรงสี่เหลี่ยมมุมฉากกว้าง ${n} ซม. ยาว ${m} ซม. สูง ${h} ซม. มีปริมาตรกี่ลูกบาศก์ซม.?`, n * m * h, 1, `กว้าง × ยาว × สูง = ${n} × ${m} × ${h} = ${n * m * h} ลูกบาศก์ซม.`, rng); }
  return numericChoice(id, `วงกลมรัศมี ${n} ซม. มีความยาวรอบวงกี่ซม.? กำหนด π = 3.14`, 2 * 314 * n, 100, `2 × π × รัศมี = 2 × 3.14 × ${n} = ${label(2 * 314 * n, 100)} ซม.`, rng);
}
function parts(id, grade, index, rng) {
  const total = grade <= 3 ? integer(rng, 2, grade === 2 ? 12 : 10) : pick(rng, [2, 4, 5, 8, 10]);
  const filled = integer(rng, 0, total), visual = { type: 'parts', total, filled };
  if (grade <= 2) return numericChoice(id, 'ภาพนี้มีวงกลมที่ระบายสีกี่วง?', filled, 1, `นับเฉพาะวงที่ระบายสี ได้ ${filled} วง จากทั้งหมด ${total} วง`, rng, { visual });
  if (grade === 3 || (grade === 5 && index % 2 === 0)) return numericChoice(id, 'ส่วนที่ระบายสีเป็นเศษส่วนเท่าไรของวงกลมทั้งหมด?', filled, total, `ระบายสี ${filled} ส่วน จากทั้งหมด ${total} ส่วนเท่า ๆ กัน จึงเป็น ${filled}/${total} = ${label(filled, total, 'fraction')}`, rng, { style: 'fraction', visual });
  const percent = grade === 6;
  const denominator = 1000, numerator = filled * denominator * (percent ? 100 : 1) / total;
  return numericChoice(id, `ส่วนที่ระบายสีคิดเป็น${percent ? 'กี่เปอร์เซ็นต์' : 'ทศนิยมเท่าไร'}ของวงกลมทั้งหมด?`, numerator, denominator, `${filled}/${total} = ${label(filled, total)}${percent ? ` คูณ 100 ได้ ${label(filled * 100, total)}%` : ''}`, rng, { suffix: percent ? '%' : '', visual });
}

/** Five fresh tasks; all randomness is bounded and injectable for reproducible rounds. */
export function createArcadeRound(grade, mode, { rng = Math.random, language = 'th' } = {}) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new RangeError('เลือกชั้น ป.1–6');
  const selected = ARCADE_MODES.find(item => item.id === mode);
  if (!selected) throw new RangeError('ไม่พบเกมที่เลือก');
  if (typeof rng !== 'function') throw new TypeError('rng must be a function');
  const generators = { compare: comparison, order: ordering, match: matching, shop: shopping, measure: measurement, pattern, geometry, parts };
  const questions = mode === 'choice' || mode === 'truth' ? createQuestionRound(grade, { rng }).questions : null;
  const activities = Array.from({ length: 5 }, (_, index) => {
    const id = `g${grade}-arcade-${mode}-${index + 1}`;
    return mode === 'choice' || mode === 'truth' ? calculation(id, grade, index, rng, mode === 'truth', questions[index]) : generators[mode](id, grade, index, rng);
  });
  for (const activity of activities) {
    if (activity.translations) continue;
    const text = {
      prompt: activity.prompt, hint: activity.hint,
      ...(activity.options ? { options: activity.options.map(({ id, label }) => ({ id, label })) } : {}),
      ...(activity.pairs ? { pairs: activity.pairs.map(({ id, left, right }) => ({ id, left, right })) } : {}),
    };
    activity.translations = {
      th: text,
      en: {
        prompt: englishArcadeText(text.prompt), hint: englishArcadeText(text.hint),
        ...(text.options ? { options: text.options.map(({ id, label }) => ({ id, label: englishArcadeText(label) })) } : {}),
        ...(text.pairs ? { pairs: text.pairs.map(({ id, left, right }) => ({ id, left: englishArcadeText(left), right: englishArcadeText(right) })) } : {}),
      },
    };
  }
  return localizeArcadeRound({ grade, mode, title: `ป.${grade} — ${selected.title}`, activities }, language);
}

/** Change only visible copy. Answer IDs, shuffled positions and play progress survive. */
export function localizeArcadeRound(round, language = 'th') {
  if (!['th', 'en'].includes(language)) throw new RangeError('Unsupported language');
  const mode = ARCADE_MODES.find(item => item.id === round.mode);
  round.language = language;
  round.title = language === 'en' ? `Grade ${round.grade} — ${mode.en.title}` : `ป.${round.grade} — ${mode.title}`;
  for (const activity of round.activities) {
    const text = activity.translations[language];
    activity.prompt = text.prompt; activity.hint = text.hint;
    if (text.visual) activity.visual = structuredClone(text.visual);
    for (const option of activity.options || []) option.label = text.options.find(item => item.id === option.id).label;
    for (const pair of activity.pairs || []) Object.assign(pair, text.pairs.find(item => item.id === pair.id));
  }
  return round;
}
