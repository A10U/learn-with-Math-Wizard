// Original bilingual recipes that extend each grade across the main math strands.
// Every answer fits the existing numeric keypad; language changes preserve IDs.
const topic = (id, name, en) => ({ id, topic: name, en });
export const EXTRA_GRADE_TOPICS = {
  1: [
    topic('number-place', 'จำนวนนับและค่าประจำหลัก', 'Numbers and place value'),
    topic('compare-order', 'เปรียบเทียบและเรียงจำนวน', 'Comparing and ordering numbers'),
    topic('number-patterns', 'แบบรูปของจำนวน', 'Number patterns'),
    topic('length', 'ความยาว', 'Length'), topic('mass', 'น้ำหนัก', 'Mass'),
    topic('plane-shapes', 'รูปเรขาคณิตสองมิติ', '2D shapes'),
    topic('solid-shapes', 'รูปเรขาคณิตสามมิติ', '3D shapes'),
    topic('pictographs', 'แผนภูมิรูปภาพ', 'Pictographs'),
  ],
  2: [
    topic('number-place', 'จำนวนนับและค่าประจำหลัก', 'Numbers and place value'),
    topic('length', 'ความยาว', 'Length'), topic('mass', 'น้ำหนัก', 'Mass'),
    topic('capacity', 'ปริมาตรและความจุ', 'Volume and capacity'),
    topic('money', 'เงิน', 'Money'), topic('time', 'เวลา', 'Time'),
    topic('number-patterns', 'แบบรูปของจำนวน', 'Number patterns'),
    topic('shape-patterns', 'แบบรูปของรูปเรขาคณิต', 'Repeating shape patterns'),
    topic('plane-shapes', 'รูปเรขาคณิตสองมิติ', '2D shapes'),
    topic('pictographs', 'แผนภูมิรูปภาพ', 'Pictographs'),
  ],
  3: [
    topic('number-place', 'จำนวนนับและค่าประจำหลัก', 'Numbers and place value'),
    topic('compare-fractions', 'เปรียบเทียบเศษส่วน', 'Comparing fractions'),
    topic('metric', 'การวัดและการเปลี่ยนหน่วย', 'Measurement and unit conversion'),
    topic('money', 'เงินและเงินทอน', 'Money and change'),
    topic('time', 'เวลาและระยะเวลา', 'Time and duration'),
    topic('number-patterns', 'แบบรูปของจำนวน', 'Number patterns'),
    topic('symmetry', 'แกนสมมาตร', 'Lines of symmetry'),
    topic('pictographs', 'แผนภูมิรูปภาพ', 'Pictographs'),
    topic('division-remainders', 'การหารมีเศษ', 'Division with remainders'),
    topic('one-way-data', 'ตารางทางเดียว', 'One-way tables'),
  ],
  4: [
    topic('number-place', 'จำนวนนับและค่าประจำหลัก', 'Numbers and place value'),
    topic('decimal-basics', 'ทศนิยมไม่เกินสามตำแหน่ง', 'Decimals up to three places'),
    topic('fraction-order', 'จำนวนคละและการเรียงเศษส่วน', 'Mixed numbers and ordering fractions'),
    topic('time', 'เวลาและระยะเวลา', 'Time and duration'),
    topic('angles', 'มุมและการวัดมุม', 'Angles and angle measurement'),
    topic('rectangle-area', 'พื้นที่รูปสี่เหลี่ยมมุมฉาก', 'Area of rectangles'),
    topic('perimeter', 'ความยาวรอบรูป', 'Perimeter'),
    topic('bar-data', 'แผนภูมิแท่ง', 'Bar charts'),
    topic('two-way-data', 'ตารางสองทาง', 'Two-way tables'),
  ],
  5: [
    topic('parallel-angles', 'เส้นขนานและมุม', 'Parallel lines and angles'),
    topic('quadrilateral-angles', 'รูปสี่เหลี่ยมและมุม', 'Quadrilaterals and angles'),
    topic('unitary', 'บัญญัติไตรยางศ์', 'Unitary method'),
  ],
  6: [
    topic('number-patterns', 'แบบรูปของจำนวน', 'Number patterns'),
    topic('three-factors', 'ห.ร.ม. และ ค.ร.น. ของสามจำนวน', 'GCF and LCM of three numbers'),
    topic('polygon-angles', 'มุมของรูปสามเหลี่ยมและรูปสี่เหลี่ยม', 'Triangle and quadrilateral angles'),
    topic('solid-nets', 'รูปคลี่และลักษณะของรูปเรขาคณิตสามมิติ', 'Nets and properties of 3D shapes'),
  ],
};
const unitRandom = rng => { const n = Number(rng()); return Number.isFinite(n) ? Math.max(0, Math.min(1 - Number.EPSILON, n)) : 0; };
const integer = (rng, min, max) => min + Math.floor(unitRandom(rng) * (max - min + 1));
const pick = (rng, values) => values[integer(rng, 0, values.length - 1)];
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const reduced = (n, d) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
const decimal = (n, places) => Number((n / 10 ** places).toFixed(places)).toString();
const clock = minutes => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
function make(grade, entry, parts, thPrompt, enPrompt, answer, thHint, enHint, integerOnly = true, thVisual, enVisual) {
  const signature = ['grade', grade, entry.id, ...parts].join(':');
  return { id: signature, signature, prompt: thPrompt, answer, hint: thHint, integerOnly, topic: entry.topic, ...(thVisual ? { visual: thVisual } : {}),
    translations: { th: { prompt: thPrompt, hint: thHint, ...(thVisual ? { visual: thVisual } : {}) }, en: { prompt: enPrompt, hint: enHint, ...(enVisual ? { visual: enVisual } : {}) } } };
}
function numberPlace(grade, entry, rng) {
  const limits = { 1: [10, 100, 1], 2: [100, 1000, 2], 3: [1000, 100000, 4], 4: [100001, 9999999, 6] };
  const [low, high, maxPower] = limits[grade], n = integer(rng, low, high), mode = integer(rng, 0, 1);
  const power = integer(rng, 0, Math.min(maxPower, Math.floor(Math.log10(n)))), place = 10 ** power;
  const thPlaces = ['หน่วย', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'], enPlaces = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions'];
  const digit = Math.floor(n / place) % 10, value = digit * place;
  if (grade === 2 && integer(rng, 0, 2) === 2) return make(grade, entry, ['parity', n], `จำนวน ${n} เป็นจำนวนคู่หรือจำนวนคี่? (ตอบ 0 ถ้าเป็นจำนวนคู่ และ 1 ถ้าเป็นจำนวนคี่)`, `Is ${n} even or odd? (Enter 0 for even or 1 for odd.)`, n % 2, `ดูหลักหน่วย ${n % 10}: เลขลงท้าย 0, 2, 4, 6, 8 เป็นจำนวนคู่ ที่เหลือเป็นจำนวนคี่ จึงตอบ ${n % 2}`, `Look at the ones digit ${n % 10}. Numbers ending in 0, 2, 4, 6 or 8 are even; the others are odd. Enter ${n % 2}.`);
  if (mode === 0) return make(grade, entry, [mode, n, place], `ในจำนวน ${n} เลขโดดในหลัก${thPlaces[power]}คือเลขใด?`, `What digit is in the ${enPlaces[power]} place of ${n}?`, digit,
    `แยกหลักของ ${n}: หลัก${thPlaces[power]}นับเป็นกลุ่มละ ${place} เลขโดดที่หลักนี้คือ ${digit}`, `Separate the place values of ${n}. The ${enPlaces[power]} digit counts groups of ${place}; that digit is ${digit}.`);
  return make(grade, entry, [mode, n, place], `ในจำนวน ${n} เลขโดด ${digit} ในหลัก${thPlaces[power]}มีค่าเท่าไร?`, `In ${n}, what is the value of the digit ${digit} in the ${enPlaces[power]} place?`, value,
    grade === 1 ? `หลัก${thPlaces[power]}นับทีละ ${place} จำนวน ${digit} ครั้ง ได้ ${value}` : `ค่าของเลขโดด = เลขโดด × ค่าประจำหลัก: ${digit} × ${place} = ${value}`, grade === 1 ? `Count by ${place}, ${digit} times, to get the digit value ${value}.` : `Digit value = digit × place value: ${digit} × ${place} = ${value}.`);
}
function compareOrder(grade, entry, rng) {
  const a = integer(rng, 0, 75), b = a + integer(rng, 1, 12), c = b + integer(rng, 1, 13), mode = integer(rng, 0, 2);
  const displayed = pick(rng, [[b, a, c], [c, b, a], [a, c, b]]), answer = [a, b, c][mode];
  return make(grade, entry, [mode, ...displayed], `จำนวน ${displayed.join(', ')} เมื่อเรียงจากน้อยไปมาก จำนวน${['แรก', 'ตรงกลาง', 'สุดท้าย'][mode]}คือเท่าไร?`, `Order ${displayed.join(', ')} from smallest to largest. What is the ${['first', 'middle', 'last'][mode]} number?`, answer,
    `เปรียบเทียบหลักสิบก่อน แล้วหลักหน่วย เรียงได้ ${a}, ${b}, ${c} ดังนั้นตอบ ${answer}`, `Compare tens first, then ones. The order is ${a}, ${b}, ${c}, so the answer is ${answer}.`);
}
function numberPatterns(grade, entry, rng) {
  if (grade === 6) {
    const mode = integer(rng, 0, 2), start = integer(rng, 1, 25), step = integer(rng, 2, 12);
    const values = mode === 0 ? [start, start + step, start + 2 * step, start + 3 * step]
      : mode === 1 ? [start, start * 2, start * 4, start * 8]
        : [start, start + step, start + step * 2 + 1, start + step * 3 + 3];
    const answer = mode === 0 ? start + 4 * step : mode === 1 ? start * 16 : start + step * 4 + 6;
    const thRule = mode === 0 ? `บวก ${step} เท่ากันทุกครั้ง` : mode === 1 ? 'คูณ 2 ทุกครั้ง' : `ผลต่างเป็น ${step}, ${step + 1}, ${step + 2}, ${step + 3}`;
    const enRule = mode === 0 ? `add ${step} each time` : mode === 1 ? 'multiply by 2 each time' : `the differences are ${step}, ${step + 1}, ${step + 2}, ${step + 3}`;
    return make(grade, entry, [mode, start, step], `แบบรูป ${values.join(', ')}, □ จำนวนถัดไปคือเท่าไร?`, `What comes next in the pattern ${values.join(', ')}, □?`, answer,
      `กฎคือ${thRule} จึงได้จำนวนถัดไป ${answer}`, `Pattern rule: ${enRule}. The next number is ${answer}.`);
  }
  const step = pick(rng, grade === 1 ? [1, 10] : grade === 2 ? [2, 5, 10, 100] : [3, 4, 25, 50, 100, 1000]), cap = grade === 1 ? 100 : grade === 2 ? 1000 : 100000;
  const down = integer(rng, 0, 1), first = integer(rng, 0, cap - 4 * step), start = down ? first + 4 * step : first;
  const signed = down ? -step : step, values = Array.from({ length: 4 }, (_, i) => start + i * signed), answer = start + 4 * signed;
  return make(grade, entry, [start, signed], `แบบรูป ${values.join(', ')}, □ จำนวนถัดไปคือเท่าไร?`, `What comes next in ${values.join(', ')}, □?`, answer,
    `จำนวน${down ? 'ลดลง' : 'เพิ่มขึ้น'}ครั้งละ ${step}: ${values[3]} ${down ? '−' : '+'} ${step} = ${answer}`, `The numbers ${down ? 'decrease' : 'increase'} by ${step}: ${values[3]} ${down ? '−' : '+'} ${step} = ${answer}.`);
}
function length(grade, entry, rng) {
  if (grade === 1) {
    const a = integer(rng, 2, 14), b = integer(rng, 1, 20 - a), mode = integer(rng, 0, 1), total = a + b, metre = integer(rng, 0, 1), unitTH = metre ? 'เมตร' : 'เซนติเมตร', unitEN = metre ? 'metres' : 'centimetres';
    return mode === 0
      ? make(grade, entry, [mode, a, b, metre], `ริบบิ้นยาว ${a} ${unitTH} ต่อเพิ่ม ${b} ${unitTH} ยาวรวมกี่${unitTH}?`, `A ribbon is ${a} ${unitEN} long. Another ${b} ${unitEN} is joined to it. What is the total length in ${unitEN}?`, total, `${a} + ${b} = ${total} ${unitTH}`, `Add the lengths: ${a} + ${b} = ${total} ${unitEN}.`)
      : make(grade, entry, [mode, a, b, metre], `เชือกเส้นแรกยาว ${total} ${unitTH} เส้นที่สองยาว ${a} ${unitTH} เส้นแรกยาวกว่ากี่${unitTH}?`, `One rope is ${total} ${unitEN} long and another is ${a} ${unitEN} long. How many ${unitEN} longer is the first rope?`, b, `ความยาวที่ต่างกัน ${total} − ${a} = ${b} ${unitTH}`, `Subtract the shorter length: ${total} − ${a} = ${b} ${unitEN}.`);
  }
  const metres = integer(rng, 1, 9), cm = integer(rng, 1, 99), answer = metres * 100 + cm;
  return make(grade, entry, [metres, cm], `เชือกยาว ${metres} เมตร ${cm} เซนติเมตร คิดเป็นกี่เซนติเมตร?`, `A rope is ${metres} metres ${cm} centimetres long. How many centimetres is that?`, answer,
    `1 เมตร = 100 เซนติเมตร จึงได้ (${metres} × 100) + ${cm} = ${answer} เซนติเมตร`, `1 metre = 100 cm, so (${metres} × 100) + ${cm} = ${answer} cm.`);
}
function mass(grade, entry, rng) {
  if (grade === 1) {
    const a = integer(rng, 1, 12), b = integer(rng, 1, 8), answer = a + b, kheed = integer(rng, 0, 1), unitTH = kheed ? 'ขีด' : 'กิโลกรัม', unitEN = kheed ? 'kheed' : 'kilograms';
    return make(grade, entry, [a, b, kheed], `ฟักทองหนัก ${a} ${unitTH} แตงโมหนัก ${b} ${unitTH} ทั้งสองหนักรวมกี่${unitTH}?`, `A pumpkin weighs ${a} ${unitEN} and a watermelon weighs ${b} ${unitEN}. What is their combined mass in ${unitEN}?`, answer, `รวมน้ำหนักที่ใช้หน่วยเดียวกัน: ${a} + ${b} = ${answer} ${unitTH}`, `Add masses in the same unit: ${a} + ${b} = ${answer} ${unitEN}.`);
  }
  const kg = integer(rng, 1, 9), grams = integer(rng, 1, 9) * 100, answer = kg * 1000 + grams;
  return make(grade, entry, [kg, grams], `ข้าวสารหนัก ${kg} กิโลกรัม ${grams} กรัม คิดเป็นกี่กรัม?`, `Rice has a mass of ${kg} kilograms ${grams} grams. How many grams is that?`, answer, `1 กิโลกรัม = 1000 กรัม: (${kg} × 1000) + ${grams} = ${answer} กรัม`, `1 kg = 1000 g: (${kg} × 1000) + ${grams} = ${answer} g.`);
}
function capacity(grade, entry, rng) {
  const each = integer(rng, 1, 9), containers = integer(rng, 2, 8), total = each * containers, used = integer(rng, 1, total), mode = integer(rng, 0, 1);
  return mode === 0
    ? make(grade, entry, [mode, each, containers], `มีเหยือก ${containers} ใบ แต่ละใบมีน้ำ ${each} ลิตร มีน้ำรวมกี่ลิตร?`, `There are ${containers} jugs, each holding ${each} litres of water. How many litres are there altogether?`, total, `${containers} กลุ่ม กลุ่มละ ${each} ลิตร: ${containers} × ${each} = ${total} ลิตร`, `${containers} equal groups of ${each} litres: ${containers} × ${each} = ${total} litres.`)
    : make(grade, entry, [mode, total, used], `ถังมีน้ำ ${total} ลิตร ใช้ไป ${used} ลิตร เหลือน้ำกี่ลิตร?`, `A tank holds ${total} litres of water. ${used} litres are used. How many litres remain?`, total - used, `${total} − ${used} = ${total - used} ลิตร`, `Subtract the water used: ${total} − ${used} = ${total - used} litres.`);
}
function money(grade, entry, rng) {
  if (grade === 2) {
    const denomination = pick(rng, [1, 2, 5, 10]), count = integer(rng, 2, 9), extra = integer(rng, 1, 19), answer = denomination * count + extra;
    return make(grade, entry, [denomination, count, extra], `มีเหรียญ ${denomination} บาท ${count} เหรียญ และเงินอีก ${extra} บาท มีเงินรวมกี่บาท?`, `You have ${count} coins worth ${denomination} baht each, plus ${extra} baht. How many baht do you have altogether?`, answer,
      `มูลค่าเหรียญ ${denomination} × ${count} = ${denomination * count} บาท รวม ${denomination * count} + ${extra} = ${answer} บาท`, `Coin value: ${denomination} × ${count} = ${denomination * count} baht. Total: ${denomination * count} + ${extra} = ${answer} baht.`);
  }
  const priceSatang = integer(rng, 1, 79) * 100 + pick(rng, [0, 25, 50, 75]), paid = pick(rng, [100, 200, 500]), price = decimal(priceSatang, 2), answer = decimal(paid * 100 - priceSatang, 2);
  return make(grade, entry, [priceSatang, paid], `สมุดราคา ${price} บาท จ่าย ${paid} บาท ได้เงินทอนกี่บาท? (ตอบทศนิยมได้)`, `A notebook costs ${price} baht. You pay ${paid} baht. How many baht in change do you receive? (A decimal is allowed.)`, answer,
    `1 บาท = 100 สตางค์ เงินทอน ${paid * 100} − ${priceSatang} = ${paid * 100 - priceSatang} สตางค์ หรือ ${answer} บาท`, `1 baht = 100 satang. Change: ${paid * 100} − ${priceSatang} = ${paid * 100 - priceSatang} satang, or ${answer} baht.`, false);
}
function time(grade, entry, rng) {
  if (grade === 2) {
    const mode = integer(rng, 0, 2);
    if (mode === 0) {
      const hours = integer(rng, 1, 12), minutes = integer(rng, 0, 11) * 5;
      return make(grade, entry, ['clock', hours, minutes], `นาฬิกาแสดงเวลา ${hours}:${String(minutes).padStart(2, '0')} น. เวลานี้เป็น ${hours} นาฬิกากี่นาที?`, `A clock shows ${hours}:${String(minutes).padStart(2, '0')}. This means ${hours} o'clock and how many minutes?`, minutes, `อ่านเลขหลังเครื่องหมาย : เป็นจำนวนนาที ได้ ${minutes} นาที`, `Read the number after the colon for the minutes: ${minutes} minutes.`);
    }
    if (mode === 1) {
      const startHour = integer(rng, 6, 15), endHour = startHour + integer(rng, 1, 6);
      return make(grade, entry, ['hours', startHour, endHour], `เริ่มกิจกรรมเวลา ${startHour}:00 น. เสร็จเวลา ${endHour}:00 น. ในวันเดียวกัน ใช้เวลากี่ชั่วโมง?`, `An activity starts at ${startHour}:00 and ends at ${endHour}:00 on the same day (24-hour clock). How many hours does it last?`, endHour - startHour, `หาจำนวนชั่วโมงที่ผ่านไป: ${endHour} − ${startHour} = ${endHour - startHour} ชั่วโมง`, `Find the elapsed hours: ${endHour} − ${startHour} = ${endHour - startHour} hours.`);
    }
    const month = pick(rng, [[4, 'เมษายน', 'April'], [6, 'มิถุนายน', 'June'], [9, 'กันยายน', 'September'], [11, 'พฤศจิกายน', 'November']]), startDate = integer(rng, 1, 15), endDate = startDate + integer(rng, 1, 15);
    return make(grade, entry, ['calendar', month[0], startDate, endDate], `ปฏิทินเดือน${month[1]} เริ่มปลูกถั่ววันที่ ${startDate} และต้นถั่วงอกวันที่ ${endDate} ผ่านไปกี่วัน? (ไม่นับวันเริ่มต้น)`, `On a ${month[2]} calendar, beans are planted on day ${startDate} and sprout on day ${endDate}. How many days have passed? (Do not count the starting day.)`, endDate - startDate, `นับวันหลังวันที่ ${startDate} จนถึงวันที่ ${endDate}: ${endDate} − ${startDate} = ${endDate - startDate} วัน`, `Count days after day ${startDate} through day ${endDate}: ${endDate} − ${startDate} = ${endDate - startDate} days.`);
  }
  const start = integer(rng, 6 * 12, 16 * 12) * 5, duration = integer(rng, 3, grade === 3 ? 30 : 60) * 5, end = start + duration;
  return make(grade, entry, [start, end], `เริ่มอ่านหนังสือเวลา ${clock(start)} น. และเสร็จเวลา ${clock(end)} น. ในวันเดียวกัน ใช้เวลากี่นาที?`, `Reading starts at ${clock(start)} and ends at ${clock(end)} on the same day (24-hour clock). How many minutes does it last?`, duration,
    `เปลี่ยนเวลาเป็นนาทีหลังเที่ยงคืน: ${Math.floor(end / 60)} × 60 + ${end % 60} = ${end}; ${Math.floor(start / 60)} × 60 + ${start % 60} = ${start}; ต่างกัน ${end} − ${start} = ${duration} นาที`, `Convert to minutes after midnight: ${Math.floor(end / 60)} × 60 + ${end % 60} = ${end}; ${Math.floor(start / 60)} × 60 + ${start % 60} = ${start}. Duration: ${end} − ${start} = ${duration} minutes.`);
}
const planeShapes = [
  { id: 'triangle', th: 'รูปสามเหลี่ยม', en: 'triangle', sides: 3 },
  { id: 'square', th: 'รูปสี่เหลี่ยมจัตุรัส', en: 'square', sides: 4 },
  { id: 'rectangle', th: 'รูปสี่เหลี่ยมผืนผ้า', en: 'rectangle', sides: 4 },
  { id: 'circle', th: 'รูปวงกลม', en: 'circle', sides: 0 },
  { id: 'oval', th: 'รูปวงรี', en: 'oval', sides: 0 },
  { id: 'pentagon', th: 'รูปห้าเหลี่ยม', en: 'pentagon', sides: 5 },
  { id: 'hexagon', th: 'รูปหกเหลี่ยม', en: 'hexagon', sides: 6 },
  { id: 'octagon', th: 'รูปแปดเหลี่ยม', en: 'octagon', sides: 8 },
];
function plane(grade, entry, rng) {
  const shape = pick(rng, grade === 1 ? planeShapes.slice(0, 5) : planeShapes), count = integer(rng, 1, grade === 1 ? 9 : 12), corners = integer(rng, 0, 1), answer = shape.sides * count;
  return make(grade, entry, [shape.id, count, corners], `${shape.th} ${count} รูป มี${corners ? 'มุม' : 'ด้านตรง'}รวมกี่${corners ? 'มุม' : 'ด้าน'}?`, `How many ${corners ? 'corners' : 'straight sides'} do ${count} ${shape.en}${count === 1 ? '' : 's'} have altogether?`, answer,
    grade === 1 ? `${shape.th}แต่ละรูปมี${corners ? 'มุม' : 'ด้านตรง'} ${shape.sides} ${corners ? 'มุม' : 'ด้าน'} นับรวม ${count} รูป: ${Array(count).fill(shape.sides).join(' + ')} = ${answer}` : `${shape.th}แต่ละรูปมี${corners ? 'มุม' : 'ด้านตรง'} ${shape.sides} ${corners ? 'มุม' : 'ด้าน'} จึงได้ ${count} × ${shape.sides} = ${answer}`, grade === 1 ? `Each ${shape.en} has ${shape.sides} ${corners ? 'corners' : 'straight sides'}. Count all ${count} shapes: ${Array(count).fill(shape.sides).join(' + ')} = ${answer}.` : `Each ${shape.en} has ${shape.sides} ${corners ? 'corners' : 'straight sides'}. So ${count} × ${shape.sides} = ${answer}.`);
}
function solids(grade, entry, rng) {
  const shape = pick(rng, [
    { id: 'cube', th: 'ลูกบาศก์', en: 'cube', faces: 6, vertices: 8 },
    { id: 'cuboid', th: 'ทรงสี่เหลี่ยมมุมฉาก', en: 'rectangular prism', faces: 6, vertices: 8 },
    { id: 'cylinder', th: 'ทรงกระบอก', en: 'cylinder', faces: 2, vertices: 0 },
    { id: 'cone', th: 'กรวย', en: 'cone', faces: 1, vertices: 1 },
    { id: 'sphere', th: 'ทรงกลม', en: 'sphere', faces: 0, vertices: 0 },
  ]), count = integer(rng, 1, 12), mode = grade === 1 ? 0 : integer(rng, 0, 1), each = mode ? shape.vertices : shape.faces;
  return make(grade, entry, [shape.id, count, mode], `${shape.th} ${count} ชิ้น มี${mode ? 'จุดยอด' : 'หน้าราบ'}รวมกี่${mode ? 'จุด' : 'หน้า'}? (นับเฉพาะ${mode ? 'จุดยอด' : 'หน้าที่แบนราบ'})`, `How many ${mode ? 'vertices' : 'flat faces'} do ${count} ${shape.en}${count === 1 ? '' : 's'} have altogether? (Count only ${mode ? 'vertices' : 'flat faces'}.)`, each * count,
    grade === 1 ? `${shape.th} 1 ชิ้นมีหน้าราบ ${each} หน้า นับรวม ${count} ชิ้น: ${Array(count).fill(each).join(' + ')} = ${each * count} หน้า` : `${shape.th} 1 ชิ้นมี${mode ? 'จุดยอด' : 'หน้าราบ'} ${each} ${mode ? 'จุด' : 'หน้า'} จึงได้ ${count} × ${each} = ${each * count}`, grade === 1 ? `One ${shape.en} has ${each} flat faces. Count all ${count} shapes: ${Array(count).fill(each).join(' + ')} = ${each * count} faces.` : `One ${shape.en} has ${each} ${mode ? 'vertices' : 'flat faces'}. Multiply: ${count} × ${each} = ${each * count}.`);
}
function shapePatterns(grade, entry, rng) {
  const pattern = pick(rng, [[0, 1], [0, 0, 1], [1, 0, 1], [3, 1, 0]]), position = integer(rng, 4, 30), next = planeShapes[pattern[(position - 1) % pattern.length]], answer = next.sides;
  const th = pattern.map(i => planeShapes[i].th).join(' → '), en = pattern.map(i => planeShapes[i].en).join(' → ');
  return make(grade, entry, [...pattern, position], `แบบรูปซ้ำ ${th} แล้วเริ่มชุดเดิมซ้ำ รูปที่ ${position} มีด้านตรงกี่ด้าน?`, `The repeating pattern is ${en}, then the same group repeats. How many straight sides does shape ${position} have?`, answer,
    `ชุดซ้ำมี ${pattern.length} รูป นับตำแหน่งในชุดจะได้${next.th} ซึ่งมีด้านตรง ${answer} ด้าน`, `The repeating group has ${pattern.length} shapes. Position ${position} is a ${next.en}, which has ${answer} straight sides.`);
}
function pictographs(grade, entry, rng) {
  const scale = grade === 1 ? 1 : pick(rng, grade === 2 ? [2, 5, 10] : [2, 5, 10, 20]), a = integer(rng, 1, 7), b = integer(rng, 1, 7), mode = integer(rng, 0, 2), answer = (mode === 0 ? a : mode === 1 ? a + b : Math.abs(a - b)) * scale;
  const dataTH = `ห้อง ก: ${'●'.repeat(a)}; ห้อง ข: ${'●'.repeat(b)} (● 1 รูปแทนหนังสือ ${scale} เล่ม)`, dataEN = `Class A: ${'●'.repeat(a)}; Class B: ${'●'.repeat(b)} (each ● represents ${scale} books)`;
  const thAsk = ['ห้อง ก มีหนังสือกี่เล่ม?', 'สองห้องมีหนังสือรวมกี่เล่ม?', 'สองห้องมีจำนวนหนังสือต่างกันกี่เล่ม?'][mode], enAsk = ['How many books does Class A have?', 'How many books do both classes have altogether?', 'What is the difference between the two classes in books?'][mode];
  const calculation = grade === 1 ? mode === 0 ? `${a}` : mode === 1 ? `${a} + ${b}` : `${Math.max(a, b)} − ${Math.min(a, b)}` : mode === 0 ? `${a} × ${scale}` : mode === 1 ? `(${a} + ${b}) × ${scale}` : `(${Math.max(a, b)} − ${Math.min(a, b)}) × ${scale}`;
  return make(grade, entry, [scale, a, b, mode], `แผนภูมิรูปภาพ ${dataTH} ${thAsk}`, `Pictograph: ${dataEN}. ${enAsk}`, answer,
    `นับรูปแล้วใช้ค่าของรูป: ${calculation} = ${answer} เล่ม`, `Count the symbols, then apply the key: ${calculation} = ${answer} books.`, true,
    { type: 'pictograph', labels: ['ห้อง ก', 'ห้อง ข'], values: [a * scale, b * scale], unit: 'เล่ม', scale, symbol: '●' },
    { type: 'pictograph', labels: ['Class A', 'Class B'], values: [a * scale, b * scale], unit: 'books', scale, symbol: '●' });
}
function fractionComparison(grade, entry, rng) {
  const mode = integer(rng, 0, 1), sameNumerator = integer(rng, 0, 1), d = integer(rng, 3, 12), a = integer(rng, 1, d - 2), b = integer(rng, a + 1, d - 1);
  const left = sameNumerator ? [a, a + 1] : [a, d], right = sameNumerator ? [a, a + 2 + integer(rng, 0, 7)] : [b, d];
  const leftGreater = left[0] * right[1] > right[0] * left[1], chosen = (mode === 0 ? leftGreater : !leftGreater) ? left : right, answer = reduced(...chosen);
  return make(grade, entry, [mode, ...left, ...right], `เศษส่วน ${left[0]}/${left[1]} และ ${right[0]}/${right[1]} จำนวนใด${mode === 0 ? 'มากกว่า' : 'น้อยกว่า'}? (ตอบเป็นเศษส่วน a/b)`, `Which fraction is ${mode === 0 ? 'greater' : 'smaller'}: ${left[0]}/${left[1]} or ${right[0]}/${right[1]}? (Answer as a/b.)`, answer,
    sameNumerator ? `ตัวเศษเท่ากัน ตัวส่วนยิ่งมากชิ้นยิ่งเล็ก จึงเลือก ${chosen[0]}/${chosen[1]} = ${answer}` : `ตัวส่วนเท่ากัน เปรียบเทียบตัวเศษ ${a} กับ ${b} จึงเลือก ${chosen[0]}/${chosen[1]} = ${answer}`,
    sameNumerator ? `Equal numerators: a larger denominator means smaller pieces. Choose ${chosen[0]}/${chosen[1]} = ${answer}.` : `Equal denominators: compare numerators ${a} and ${b}. Choose ${chosen[0]}/${chosen[1]} = ${answer}.`, false);
}
function metric(grade, entry, rng) {
  const unit = pick(rng, [
    { id: 'millimetre', bigTH: 'เซนติเมตร', smallTH: 'มิลลิเมตร', bigEN: 'centimetres', smallEN: 'millimetres', factor: 10 },
    { id: 'tonne', bigTH: 'เมตริกตัน', smallTH: 'กิโลกรัม', bigEN: 'tonnes', smallEN: 'kilograms', factor: 1000 },
    { id: 'length', bigTH: 'เมตร', smallTH: 'เซนติเมตร', bigEN: 'metres', smallEN: 'centimetres', factor: 100 },
    { id: 'mass', bigTH: 'กิโลกรัม', smallTH: 'กรัม', bigEN: 'kilograms', smallEN: 'grams', factor: 1000 },
    { id: 'capacity', bigTH: 'ลิตร', smallTH: 'มิลลิลิตร', bigEN: 'litres', smallEN: 'millilitres', factor: 1000 },
    { id: 'distance', bigTH: 'กิโลเมตร', smallTH: 'เมตร', bigEN: 'kilometres', smallEN: 'metres', factor: 1000 },
  ]), big = integer(rng, 1, 9), small = integer(rng, 1, unit.factor - 1), answer = big * unit.factor + small;
  return make(grade, entry, [unit.id, big, small], `${big} ${unit.bigTH} ${small} ${unit.smallTH} คิดเป็นกี่${unit.smallTH}?`, `Convert ${big} ${unit.bigEN} ${small} ${unit.smallEN} to ${unit.smallEN}.`, answer,
    `1 ${unit.bigTH} = ${unit.factor} ${unit.smallTH}: (${big} × ${unit.factor}) + ${small} = ${answer} ${unit.smallTH}`, `1 ${unit.bigEN.replace(/s$/, '')} = ${unit.factor} ${unit.smallEN}: (${big} × ${unit.factor}) + ${small} = ${answer} ${unit.smallEN}.`);
}
function rectangle(grade, entry, rng) {
  const a = integer(rng, 3, grade === 3 ? 20 : 60), b = integer(rng, 2, grade === 3 ? 15 : 40), area = entry.id === 'rectangle-area', answer = area ? a * b : 2 * (a + b);
  return make(grade, entry, [a, b], `รูปสี่เหลี่ยมผืนผ้ายาว ${a} เซนติเมตร กว้าง ${b} เซนติเมตร มี${area ? 'พื้นที่กี่ตารางเซนติเมตร' : 'ความยาวรอบรูปกี่เซนติเมตร'}?`, `A rectangle is ${a} cm long and ${b} cm wide. What is its ${area ? 'area in square centimetres' : 'perimeter in centimetres'}?`, answer,
    area ? `พื้นที่ = ยาว × กว้าง = ${a} × ${b} = ${answer} ตารางเซนติเมตร` : `รวมด้านทั้งสี่: ${a} + ${b} + ${a} + ${b} = 2 × (${a} + ${b}) = ${answer} เซนติเมตร`,
    area ? `Area = length × width = ${a} × ${b} = ${answer} square centimetres.` : `Add all four sides: ${a} + ${b} + ${a} + ${b} = 2 × (${a} + ${b}) = ${answer} cm.`);
}
function symmetry(grade, entry, rng) {
  const shape = pick(rng, [
    { id: 'square', th: 'รูปสี่เหลี่ยมจัตุรัส', en: 'square', axes: 4 },
    { id: 'rectangle', th: 'รูปสี่เหลี่ยมผืนผ้าที่ไม่ใช่จัตุรัส', en: 'non-square rectangle', axes: 2 },
    { id: 'equilateral', th: 'รูปสามเหลี่ยมด้านเท่า', en: 'equilateral triangle', axes: 3 },
    { id: 'isosceles', th: 'รูปสามเหลี่ยมหน้าจั่วที่ไม่ใช่ด้านเท่า', en: 'non-equilateral isosceles triangle', axes: 1 },
    { id: 'scalene', th: 'รูปสามเหลี่ยมด้านไม่เท่า', en: 'scalene triangle', axes: 0 },
  ]), count = integer(rng, 1, 15), answer = shape.axes * count;
  return make(grade, entry, [shape.id, count], `วาดแกนสมมาตรครบทุกแกนใน${shape.th} ${count} รูปที่แยกจากกัน ต้องวาดเส้นรวมกี่เส้น?`, `Draw every line of symmetry in each of ${count} separate ${shape.en}${count === 1 ? '' : 's'}. How many lines will you draw altogether?`, answer,
    `${shape.th}แต่ละรูปมีแกนสมมาตร ${shape.axes} แกน รวม ${count} × ${shape.axes} = ${answer} เส้น`, `Each ${shape.en} has ${shape.axes} lines of symmetry. Total: ${count} × ${shape.axes} = ${answer} lines.`);
}
function decimalBasics(grade, entry, rng) {
  const places = integer(rng, 1, 3), scale = 10 ** places, mode = integer(rng, 0, 3);
  let a = integer(rng, 1, 99 * scale), b = integer(rng, 1, 99 * scale);
  if (mode === 1 && a < b) [a, b] = [b, a];
  const answerUnits = mode === 0 ? a + b : mode === 1 ? a - b : mode === 2 ? Math.max(a, b) : Math.min(a, b), answer = decimal(answerUnits, places), left = decimal(a, places), right = decimal(b, places);
  const thPrompt = mode <= 1 ? `${left} ${mode === 0 ? '+' : '−'} ${right} = ?` : `จำนวน ${left} และ ${right} จำนวนใด${mode === 2 ? 'มากกว่า' : 'น้อยกว่า'}? (ตอบจำนวน)`;
  const enPrompt = mode <= 1 ? thPrompt : `Which number is ${mode === 2 ? 'greater' : 'smaller'}: ${left} or ${right}? (Enter the number.)`;
  return make(grade, entry, [mode, places, a, b], thPrompt, enPrompt, answer,
    mode <= 1 ? `ตั้งจุดทศนิยมให้ตรงกัน: ${a} ${mode === 0 ? '+' : '−'} ${b} = ${answerUnits} หน่วยของ 1/${scale} จึงได้ ${answer}` : `เติมศูนย์ให้มีทศนิยม ${places} ตำแหน่ง เปรียบเทียบ ${a} กับ ${b} หน่วยของ 1/${scale} จึงเลือก ${answer}`,
    mode <= 1 ? `Align decimal points: ${a} ${mode === 0 ? '+' : '−'} ${b} = ${answerUnits} units of 1/${scale}, giving ${answer}.` : `Add trailing zeros to make ${places} decimal places. Compare ${a} with ${b} units of 1/${scale}; choose ${answer}.`, false);
}
function angles(grade, entry, rng) {
  const mode = integer(rng, 0, 2), whole = [90, 180, 360][mode], known = integer(rng, 1, whole / 5 - 1) * 5, answer = whole - known;
  return make(grade, entry, [mode, known], `${['มุมฉาก', 'มุมตรง', 'มุมรอบจุดหนึ่งรอบ'][mode]}ถูกแบ่งเป็น 2 มุม มุมหนึ่งมีขนาด ${known} องศา อีกมุมมีขนาดกี่องศา?`, `A ${['right angle', 'straight angle', 'full turn around a point'][mode]} is split into two angles. One is ${known}°. How many degrees is the other?`, answer,
    `${['มุมฉาก', 'มุมตรง', 'มุมรอบจุด'][mode]}มี ${whole} องศา ดังนั้น ${whole} − ${known} = ${answer} องศา`, `A ${['right angle', 'straight angle', 'full turn'][mode]} is ${whole}°. Subtract: ${whole} − ${known} = ${answer}°.`);
}
function barData(grade, entry, rng) {
  const a = integer(rng, 2, 40), b = integer(rng, 2, 40), c = integer(rng, 2, 40), mode = integer(rng, 0, 2), values = [a, b, c], answer = mode === 0 ? a + b + c : mode === 1 ? Math.max(...values) - Math.min(...values) : a + c;
  const askTH = ['ทั้งสามวันขายรวมกี่เล่ม?', 'วันที่ขายมากที่สุดกับน้อยที่สุดต่างกันกี่เล่ม?', 'จันทร์กับพุธขายรวมกี่เล่ม?'][mode], askEN = ['How many books were sold across all three days?', 'What is the difference between the highest and lowest daily sales?', 'How many books were sold on Monday and Wednesday altogether?'][mode];
  const calculation = mode === 0 ? `${a} + ${b} + ${c}` : mode === 1 ? `${Math.max(...values)} − ${Math.min(...values)}` : `${a} + ${c}`;
  return make(grade, entry, [mode, a, b, c], `ข้อมูลแผนภูมิแท่งยอดขายหนังสือ: จันทร์ ${a} เล่ม, อังคาร ${b} เล่ม, พุธ ${c} เล่ม ${askTH}`, `Bar-chart data for book sales: Monday ${a}, Tuesday ${b}, Wednesday ${c} books. ${askEN}`, answer,
    `อ่านค่าจากแท่งที่ต้องการ แล้วคำนวณ ${calculation} = ${answer} เล่ม`, `Read the required bar values, then calculate ${calculation} = ${answer} books.`, true,
    { type: 'bar', labels: ['จันทร์', 'อังคาร', 'พุธ'], values, unit: 'เล่ม' },
    { type: 'bar', labels: ['Monday', 'Tuesday', 'Wednesday'], values, unit: 'books' });
}
function twoWayData(grade, entry, rng) {
  const a = integer(rng, 1, 24), b = integer(rng, 1, 24), c = integer(rng, 1, 24), d = integer(rng, 1, 24), mode = integer(rng, 0, 3);
  const values = [[a, b], [a, c], [a, b, c, d], [b, d]][mode], answer = values.reduce((sum, value) => sum + value, 0);
  const askTH = ['ห้อง ก มีนักเรียนรวมกี่คน?', 'สองห้องมีนักเรียนชายรวมกี่คน?', 'ทั้งสองห้องมีนักเรียนรวมกี่คน?', 'สองห้องมีนักเรียนหญิงรวมกี่คน?'][mode];
  const askEN = ['How many students are in Class A?', 'How many boys are there in both classes?', 'How many students are there in both classes altogether?', 'How many girls are there in both classes?'][mode];
  return make(grade, entry, [mode, a, b, c, d], `ตารางสองทาง (แถว: ห้อง; คอลัมน์: ชาย, หญิง): ห้อง ก = ${a}, ${b}; ห้อง ข = ${c}, ${d} (คน) ${askTH}`, `Two-way table (rows: classes; columns: boys, girls): Class A = ${a}, ${b}; Class B = ${c}, ${d} students. ${askEN}`, answer,
    `รวมช่องที่ตรงกับคำถาม: ${values.join(' + ')} = ${answer} คน`, `Add the cells matching the question: ${values.join(' + ')} = ${answer} students.`, true,
    { type: 'table', labels: ['ห้อง ก', 'ห้อง ข'], values: [a, b, c, d], unit: 'คน', columns: ['ชาย', 'หญิง'], rows: [[a, b], [c, d]] },
    { type: 'table', labels: ['Class A', 'Class B'], values: [a, b, c, d], unit: 'students', columns: ['Boys', 'Girls'], rows: [[a, b], [c, d]] });
}
function parallelAngles(grade, entry, rng) {
  const mode = integer(rng, 0, 2), known = integer(rng, 2, 32) * 5, answer = mode === 2 ? 180 - known : known;
  const thType = ['มุมสมนัย (มุมภายในกับมุมภายนอกในตำแหน่งเดียวกันของเส้นตัด)', 'มุมแย้งภายใน', 'มุมภายในที่อยู่ข้างเดียวกันของเส้นตัด'][mode], enType = ['corresponding', 'alternate interior', 'co-interior (same-side interior)'][mode];
  return make(grade, entry, [mode, known], `เส้นตรงคู่ขนาน 2 เส้นถูกตัดด้วยเส้นตัด มุม${thType.replace(/^มุม/, '')}คู่หนึ่งมีมุมหนึ่ง ${known} องศา อีกมุมในคู่นี้กี่องศา?`, `Two parallel lines are crossed by a transversal. One of a pair of ${enType} angles is ${known}°. How many degrees is the other angle in this pair?`, answer,
    mode === 2 ? `เมื่อเส้นขนาน มุมภายในข้างเดียวกันรวม 180 องศา: 180 − ${known} = ${answer}` : `เมื่อเส้นขนาน ${thType}มีขนาดเท่ากัน จึงได้ ${answer} องศา`,
    mode === 2 ? `Co-interior angles on parallel lines sum to 180°: 180 − ${known} = ${answer}°.` : `${enType[0].toUpperCase() + enType.slice(1)} angles on parallel lines are equal, so the other angle is ${answer}°.`);
}
function polygonAngles(grade, entry, rng) {
  const triangle = grade === 6 && integer(rng, 0, 1) === 0;
  if (triangle) {
    const a = integer(rng, 3, 20) * 5, b = integer(rng, 2, Math.floor((175 - a) / 5)) * 5, answer = 180 - a - b;
    return make(grade, entry, ['triangle', a, b], `รูปสามเหลี่ยมมีมุมภายในสองมุมเป็น ${a} และ ${b} องศา มุมที่สามกี่องศา?`, `Two interior angles of a triangle are ${a}° and ${b}°. How many degrees is the third angle?`, answer,
      `มุมภายในสามเหลี่ยมรวม 180 องศา: 180 − ${a} − ${b} = ${answer} องศา`, `Interior angles of a triangle sum to 180°: 180 − ${a} − ${b} = ${answer}°.`);
  }
  const mode = integer(rng, 0, 1), a = integer(rng, 4, 30) * 5;
  if (mode === 0) return make(grade, entry, ['parallelogram', a], `รูปสี่เหลี่ยมด้านขนานมีมุมภายในมุมหนึ่ง ${a} องศา มุมภายในที่อยู่ติดกันกี่องศา?`, `One interior angle of a parallelogram is ${a}°. How many degrees is an adjacent interior angle?`, 180 - a,
    `มุมที่อยู่ติดกันของสี่เหลี่ยมด้านขนานรวม 180 องศา: 180 − ${a} = ${180 - a}`, `Adjacent angles of a parallelogram sum to 180°: 180 − ${a} = ${180 - a}°.`);
  const b = 180 - a, c = integer(rng, 6, 30) * 5, answer = 180 - c;
  return make(grade, entry, ['quadrilateral', a, b, c], `รูปสี่เหลี่ยมมีมุมภายในสามมุมเป็น ${a}, ${b}, ${c} องศา มุมที่เหลือกี่องศา?`, `Three interior angles of a quadrilateral are ${a}°, ${b}°, ${c}°. How many degrees is the remaining angle?`, answer,
    `มุมภายในสี่เหลี่ยมรวม 360 องศา: 360 − ${a} − ${b} − ${c} = ${answer} องศา`, `Interior angles of a quadrilateral sum to 360°: 360 − ${a} − ${b} − ${c} = ${answer}°.`);
}
function unitary(grade, entry, rng) {
  const count = integer(rng, 2, 12), each = integer(rng, 3, 35), wanted = integer(rng, 2, 20), answer = each * wanted;
  return make(grade, entry, [count, each, wanted], `สมุด ${count} เล่มราคา ${count * each} บาท ถ้าราคาเล่มละเท่ากัน สมุด ${wanted} เล่มราคากี่บาท?`, `${count} notebooks cost ${count * each} baht. At the same price per notebook, how many baht do ${wanted} notebooks cost?`, answer,
    `หา 1 เล่มก่อน: ${count * each} ÷ ${count} = ${each} บาท แล้ว ${wanted} เล่ม = ${each} × ${wanted} = ${answer} บาท`, `Find the unit price: ${count * each} ÷ ${count} = ${each} baht. Then ${wanted} notebooks cost ${each} × ${wanted} = ${answer} baht.`);
}
function solidNets(grade, entry, rng) {
  const mode = integer(rng, 0, 3), count = integer(rng, 1, 15);
  if (mode <= 1) {
    const cube = mode === 0, a = cube ? 0 : integer(rng, 3, 8), each = cube ? 6 : a + 2, answer = each * count;
    return make(grade, entry, [mode, count, a], `ทำรูปคลี่สำหรับ${cube ? 'ลูกบาศก์' : `ปริซึมฐานรูป ${a} เหลี่ยม`} ${count} ชิ้น โดยแต่ละรูปคลี่มีหนึ่งแผ่นต่อหนึ่งหน้า ต้องใช้แผ่นรูปเรขาคณิตรวมกี่แผ่น?`, `Make nets for ${count} ${cube ? 'cubes' : `prisms with ${a}-sided bases`}, using one polygon per face. How many polygons are needed altogether?`, answer,
      cube ? `ลูกบาศก์มีหน้าเป็นสี่เหลี่ยมจัตุรัส 6 หน้า รูปคลี่ ${count} ชิ้นจึงใช้ ${count} × 6 = ${answer} แผ่น` : `ปริซึมมีฐาน 2 หน้า และหน้าข้าง ${a} หน้า รวม ${a} + 2 = ${each} หน้า จึงใช้ ${count} × ${each} = ${answer} แผ่น`,
      cube ? `A cube has 6 square faces. ${count} nets need ${count} × 6 = ${answer} squares.` : `Each prism has 2 bases and ${a} side faces: ${a} + 2 = ${each} faces. Total: ${count} × ${each} = ${answer} polygons.`);
  }
  const sides = integer(rng, 3, 8), edges = mode === 2, each = sides * (edges ? 3 : 2), answer = each * count;
  return make(grade, entry, [mode, count, sides], `ปริซึมฐานรูป ${sides} เหลี่ยม ${count} ชิ้นที่แยกจากกัน มี${edges ? 'สัน' : 'จุดยอด'}รวมกี่${edges ? 'สัน' : 'จุด'}?`, `How many ${edges ? 'edges' : 'vertices'} do ${count} separate prisms with ${sides}-sided bases have altogether?`, answer,
    edges ? `แต่ละชิ้นมีสันฐานบน ${sides} สัน ฐานล่าง ${sides} สัน และสันตั้ง ${sides} สัน รวม ${each} สัน ทั้งหมด ${count} × ${each} = ${answer}` : `แต่ละชิ้นมีจุดยอดฐานบน ${sides} จุด ฐานล่าง ${sides} จุด รวม ${each} จุด ทั้งหมด ${count} × ${each} = ${answer}`,
    edges ? `Each prism has ${sides} top edges, ${sides} bottom edges and ${sides} joining edges, making ${each}. Total: ${count} × ${each} = ${answer}.` : `Each prism has ${sides} top and ${sides} bottom vertices, making ${each}. Total: ${count} × ${each} = ${answer}.`);
}
function divisionRemainders(grade, entry, rng) {
  const divisor = integer(rng, 2, 9), quotient = integer(rng, Math.ceil(1000 / divisor), Math.floor((9999 - (divisor - 1)) / divisor)), remainder = integer(rng, 1, divisor - 1), dividend = divisor * quotient + remainder, mode = integer(rng, 0, 1), answer = mode === 0 ? remainder : quotient;
  return make(grade, entry, [mode, dividend, divisor], `${dividend} ÷ ${divisor} ได้${mode === 0 ? 'เศษเท่าไร' : 'ผลหารจำนวนเต็มเท่าไร (ตอบเฉพาะผลหาร ไม่รวมเศษ)'}?`, `What is the ${mode === 0 ? 'remainder' : 'whole-number quotient (do not include the remainder)'} when ${dividend} is divided by ${divisor}?`, answer, `${divisor} × ${quotient} = ${divisor * quotient} และ ${dividend} − ${divisor * quotient} = ${remainder} จึงได้ผลหาร ${quotient} เศษ ${remainder} โดยเศษน้อยกว่าตัวหาร ${divisor}`, `${divisor} × ${quotient} = ${divisor * quotient}, and ${dividend} − ${divisor * quotient} = ${remainder}. The quotient is ${quotient}, remainder ${remainder}; the remainder is smaller than the divisor ${divisor}.`);
}
function oneWayData(grade, entry, rng) {
  const a = integer(rng, 1, 35), b = integer(rng, 1, 35), c = integer(rng, 1, 35), mode = integer(rng, 0, 2), values = mode === 0 ? [a, b, c] : mode === 1 ? [a, c] : [b, c], answer = values.reduce((x, y) => x + y, 0);
  const askTH = ['ผลไม้รวมกี่ผล?', 'แอปเปิลกับส้มรวมกี่ผล?', 'กล้วยกับส้มรวมกี่ผล?'][mode], askEN = ['How many fruits are there altogether?', 'How many apples and oranges are there altogether?', 'How many bananas and oranges are there altogether?'][mode];
  return make(grade, entry, [mode, a, b, c], `ตารางทางเดียวแสดงจำนวนผลไม้: แอปเปิล ${a} ผล; กล้วย ${b} ผล; ส้ม ${c} ผล ${askTH}`, `One-way table of fruit counts: apples ${a}; bananas ${b}; oranges ${c}. ${askEN}`, answer, `รวมจำนวนในแถวที่ต้องการ: ${values.join(' + ')} = ${answer} ผล`, `Add the required table rows: ${values.join(' + ')} = ${answer} fruits.`, true,
    { type: 'table', labels: ['แอปเปิล', 'กล้วย', 'ส้ม'], values: [a, b, c], unit: 'ผล', columns: ['จำนวน'], rows: [[a], [b], [c]] },
    { type: 'table', labels: ['Apples', 'Bananas', 'Oranges'], values: [a, b, c], unit: 'fruits', columns: ['Count'], rows: [[a], [b], [c]] });
}
function fractionOrder(grade, entry, rng) {
  const d = integer(rng, 2, 12), whole = integer(rng, 1, 8), remainder = integer(rng, 1, d - 1), n = whole * d + remainder, mode = integer(rng, 0, 2);
  if (mode === 0) return make(grade, entry, [mode, n, d], `จำนวนคละ ${whole} ${remainder}/${d} เขียนเป็นเศษเกินได้เท่าไร? (ตอบ a/b)`, `Write the mixed number ${whole} ${remainder}/${d} as an improper fraction (a/b).`, reduced(n, d), `คูณจำนวนเต็มด้วยตัวส่วนแล้วบวกตัวเศษ: (${whole} × ${d}) + ${remainder} = ${n} จึงได้ ${n}/${d}`, `Multiply the whole number by the denominator, then add the numerator: (${whole} × ${d}) + ${remainder} = ${n}, giving ${n}/${d}.`, false);
  if (mode === 1) return make(grade, entry, [mode, n, d], `เขียน ${n}/${d} เป็นจำนวนคละ ส่วนที่เป็นจำนวนเต็มมีค่าเท่าไร?`, `When ${n}/${d} is written as a mixed number, what is its whole-number part?`, whole, `${n} ÷ ${d} ได้ ${whole} เศษ ${remainder} จึงเป็น ${whole} ${remainder}/${d} ส่วนจำนวนเต็มคือ ${whole}`, `${n} ÷ ${d} is ${whole} remainder ${remainder}, so the mixed number is ${whole} ${remainder}/${d}; its whole-number part is ${whole}.`);
  const other = n + integer(rng, 1, d), third = other + integer(rng, 1, d), answer = reduced(other, d);
  return make(grade, entry, [mode, n, d, other, third], `เรียง ${third}/${d}, ${n}/${d}, ${other}/${d} จากน้อยไปมาก เศษส่วนตรงกลางคือเท่าไร? (ตอบ a/b)`, `Order ${third}/${d}, ${n}/${d}, ${other}/${d} from smallest to largest. What is the middle fraction? (Answer a/b.)`, answer, `ตัวส่วนเท่ากัน เรียงตามตัวเศษ ${n} < ${other} < ${third} เศษส่วนตรงกลางคือ ${other}/${d} = ${answer}`, `The denominators are equal. Order the numerators: ${n} < ${other} < ${third}. The middle fraction is ${other}/${d} = ${answer}.`, false);
}
function threeFactors(grade, entry, rng) {
  const factor = integer(rng, 2, 12), a = factor * integer(rng, 2, 8), b = factor * integer(rng, 2, 8), c = factor * integer(rng, 2, 8), mode = integer(rng, 0, 1), common = gcd(gcd(a, b), c), ab = a * b / gcd(a, b), multiple = ab * c / gcd(ab, c), answer = mode === 0 ? common : multiple;
  return make(grade, entry, [mode, a, b, c], `${mode === 0 ? 'ห.ร.ม.' : 'ค.ร.น.'} ของ ${a}, ${b}, ${c} เท่ากับเท่าไร?`, `What is the ${mode === 0 ? 'greatest common factor (GCF)' : 'least common multiple (LCM)'} of ${a}, ${b} and ${c}?`, answer, mode === 0 ? `หา ห.ร.ม. ทีละคู่: ห.ร.ม. ของ ${a}, ${b} คือ ${gcd(a, b)} แล้วหา ห.ร.ม. กับ ${c} ได้ ${answer}` : `หา ค.ร.น. ทีละคู่: ค.ร.น. ของ ${a}, ${b} คือ ${ab} แล้ว ค.ร.น. ของ ${ab}, ${c} = (${ab} × ${c}) ÷ ${gcd(ab, c)} = ${answer}`, mode === 0 ? `Work in pairs: GCF(${a}, ${b}) = ${gcd(a, b)}. Then GCF(${gcd(a, b)}, ${c}) = ${answer}.` : `Work in pairs: LCM(${a}, ${b}) = ${ab}. Then LCM(${ab}, ${c}) = (${ab} × ${c}) ÷ ${gcd(ab, c)} = ${answer}.`);
}
const RECIPES = {
  'number-place': numberPlace, 'compare-order': compareOrder, 'number-patterns': numberPatterns,
  length, mass, capacity, money, time, 'plane-shapes': plane, 'solid-shapes': solids,
  'shape-patterns': shapePatterns, pictographs, 'compare-fractions': fractionComparison,
  metric, perimeter: rectangle, symmetry, 'decimal-basics': decimalBasics, angles,
  'rectangle-area': rectangle, 'bar-data': barData, 'two-way-data': twoWayData,
  'parallel-angles': parallelAngles, 'quadrilateral-angles': polygonAngles,
  'polygon-angles': polygonAngles, unitary, 'solid-nets': solidNets,
  'one-way-data': oneWayData, 'fraction-order': fractionOrder, 'three-factors': threeFactors,
  'division-remainders': divisionRemainders,
};
/** Generate an extra grade topic by its stable ID or Thai saved-progress key. */
export function createGradeTopicQuestion(grade, selectedTopic, rng = Math.random) {
  if (!Number.isInteger(grade) || !EXTRA_GRADE_TOPICS[grade]) throw new RangeError('เลือกชั้น ป.1–6');
  if (typeof rng !== 'function') throw new TypeError('rng must be a function');
  const entry = EXTRA_GRADE_TOPICS[grade].find(item => item.id === selectedTopic || item.topic === selectedTopic);
  if (!entry) throw new RangeError('เลือกหัวข้อที่มีในระดับชั้นนี้');
  return RECIPES[entry.id](grade, entry, rng);
}
