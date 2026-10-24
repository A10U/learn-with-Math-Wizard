// Selected upper-primary practice. These recipes are not a complete curriculum.
export const UPPER_PRIMARY_PROFILES = [
  { grade: 5, title: 'ป.5', description: 'ฝึกบางหัวข้อ: เศษส่วนและจำนวนคละ ทศนิยม ร้อยละ การวัด พื้นที่ ปริมาตร และกราฟเส้น', topics: ['เศษส่วนและจำนวนคละ', 'ทศนิยม', 'ร้อยละ', 'การวัดและเรขาคณิต', 'การอ่านข้อมูล'], topicIds: ['fractions', 'decimals', 'percentages', 'measurement-geometry', 'data'] },
  { grade: 6, title: 'ป.6', description: 'ฝึกบางหัวข้อ: ห.ร.ม.–ค.ร.น. เศษส่วน ทศนิยม อัตราส่วน มาตราส่วน ร้อยละ เรขาคณิต และแผนภูมิวงกลม', topics: ['ห.ร.ม. และ ค.ร.น.', 'เศษส่วนและทศนิยม', 'อัตราส่วนและร้อยละ', 'เรขาคณิตและปริมาตร', 'แผนภูมิรูปวงกลม'], topicIds: ['factors-multiples', 'fractions-decimals', 'ratios-percentages', 'geometry-volume', 'pie-charts'] },
];

const random = rng => { const n = Number(rng()); return Number.isFinite(n) ? Math.max(0, Math.min(1 - Number.EPSILON, n)) : 0; };
const integer = (rng, low, high) => low + Math.floor(random(rng) * (high - low + 1));
const pick = (rng, values) => values[integer(rng, 0, values.length - 1)];
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const lcm = (a, b) => a * b / gcd(a, b);
const reduced = (n, d) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
const decimal = (n, places = 3) => Number((n / 10 ** places).toFixed(places)).toString();
const finite = n => Number(n.toFixed(6)).toString();
function question(grade, kind, parts, prompt, answer, hint, topic, integerOnly = false, visual) {
  const signature = ['upper', grade, kind, ...parts].join(':');
  const q = { id: signature, signature, prompt, answer, hint, integerOnly, topic, ...(visual ? { visual } : {}) };
  return { ...q, translations: { th: { prompt, hint, ...(visual ? { visual } : {}) }, en: upperPrimaryEnglish(q) } };
}

// The encoded operands also drive the English explanation. No random values or
// arithmetic identities change when an existing question changes language.
function upperPrimaryEnglish(q) {
  const [, , kind, ...parts] = q.signature.split(':'), [a, b, c, d, e, f] = parts.map(Number);
  const answer = q.answer;
  if (kind === 'fraction') {
    const [op, ...operands] = parts, [n, den, m, div, p, thirdDenominator] = operands.map(Number);
    let numerator, denominator, hint;
    if (['add', 'sub', 'addmul', 'subdiv'].includes(op)) {
      const common = lcm(den, div), left = n * common / den, right = m * common / div;
      const adding = op === 'add' || op === 'addmul';
      numerator = adding ? left + right : left - right; denominator = common;
      hint = `Convert mixed numbers to improper fractions and use denominator ${common}: ${left}/${common} ${adding ? '+' : '−'} ${right}/${common} = ${numerator}/${common}.`;
    } else if (op === 'mul') {
      numerator = n * m; denominator = den * div;
      hint = `Convert to improper fractions and multiply numerators and denominators: ${n}/${den} × ${m}/${div} = (${n} × ${m})/(${den} × ${div}) = ${numerator}/${denominator}.`;
    } else {
      numerator = n * div; denominator = den * m;
      hint = `Convert to improper fractions, then multiply by the reciprocal: ${n}/${den} × ${div}/${m} = ${numerator}/${denominator}.`;
    }
    if (op === 'addmul') hint += ` Then multiply by ${p}/${thirdDenominator}: (${numerator} × ${p})/(${denominator} × ${thirdDenominator}).`;
    if (op === 'subdiv') hint += ` Then multiply by the reciprocal ${thirdDenominator}/${p}: (${numerator} × ${thirdDenominator})/(${denominator} × ${p}).`;
    return { prompt: `${q.prompt.split(' = ?')[0]} = ? (You may answer as a number, a fraction a/b, or a decimal.)`, hint: `${hint} Simplify to ${answer}.` };
  }
  if (kind === 'decimal') {
    const [op, ...operands] = parts, [n, den, m, div] = operands.map(Number);
    const pa = Math.log10(den), pb = Math.log10(div);
    let hint;
    if (op === 'mul') hint = `Multiply as whole numbers: ${n} × ${m} = ${n * m}. Then place the decimal point ${pa + pb} places from the right to get ${answer}.`;
    else if (op === 'div') hint = pb === 0
      ? `Divide ${decimal(n, pa)} by ${m}: ${n} ÷ ${m} = ${n / m}. Put the decimal point 3 places from the right to get ${answer}. Check: ${answer} × ${m} = ${decimal(n, pa)}.`
      : `Move the decimal point ${pb} places right in both numbers: ${decimal(n, pa - pb)} ÷ ${m} = ${answer}. Check: ${answer} × ${decimal(m, pb)} = ${decimal(n, pa)}.`;
    else {
      const places = Math.max(pa, pb), left = n * 10 ** (places - pa), right = m * 10 ** (places - pb), units = op === 'add' ? left + right : left - right;
      hint = `Align the decimal points and add zeros to make ${places} decimal places: ${left} ${op === 'add' ? '+' : '−'} ${right} = ${units} units of 1/${10 ** places}, giving ${answer}.`;
    }
    return { prompt: q.prompt, hint };
  }
  if (kind === 'percent') {
    const [op, wholeText, rateText, secondText] = parts, whole = Number(wholeText), rate = Number(rateText), part = whole * rate / 100;
    if (op === 'part') return { prompt: `What is ${rate}% of ${whole}?`, hint: `${rate}% means ${rate}/100, so ${whole} × ${rate} ÷ 100 = ${answer}.` };
    if (op === 'discount') return { prompt: `A bag costs ${whole} baht and is discounted by ${rate}%. How many baht do you pay?`, hint: `The discount is ${whole} × ${rate} ÷ 100 = ${part} baht. The sale price is ${whole} − ${part} = ${answer} baht.` };
    if (op === 'reverse') return { prompt: `After a ${rate}% discount, a bag sells for ${whole - part} baht. What was its original price in baht?`, hint: `The sale price is ${100 - rate}% of the original: ${whole - part} ÷ ${100 - rate} × 100 = ${answer} baht.` };
    const secondRate = Number(secondText), afterFirst = whole - part;
    return { prompt: `Shoes cost ${whole} baht. The price is reduced by ${rate}%, then by another ${secondRate}% of the first sale price. How many baht do you pay?`, hint: `After the first discount: ${whole} × ${100 - rate}/100 = ${afterFirst} baht. After the second: ${afterFirst} × ${100 - secondRate}/100 = ${answer} baht.` };
  }
  if (kind === 'convert') {
    const [amountText, numeratorText, denominatorText, from, to] = parts, amount = Number(amountText), numerator = Number(numeratorText), denominator = Number(denominatorText);
    const units = { km: ['kilometre', 'kilometres'], m: ['metre', 'metres'], cm: ['centimetre', 'centimetres'], mm: ['millimetre', 'millimetres'], kg: ['kilogram', 'kilograms'], g: ['gram', 'grams'], l: ['litre', 'litres'], ml: ['millilitre', 'millilitres'] };
    const reverse = denominator > 1, factor = reverse ? denominator : numerator, large = units[reverse ? to : from], small = units[reverse ? from : to];
    return { prompt: `How many ${units[to][1]} are equivalent to ${amount} ${units[from][amount === 1 ? 0 : 1]}?`, hint: `1 ${large[0]} = ${factor} ${small[1]}. ${reverse ? 'Divide' : 'Multiply'} by ${factor}: ${amount} ${reverse ? '÷' : '×'} ${factor} = ${answer} ${units[to][Number(answer) === 1 ? 0 : 1]}.` };
  }
  if (kind === 'area4') return { prompt: `A ${parts[2] === 'rhombus' ? 'rhombus' : 'parallelogram'} has a base of ${a} cm and a perpendicular height of ${b} cm. What is its area in square centimetres?`, hint: `Area = base × perpendicular height = ${a} × ${b} = ${answer} square centimetres.` };
  if (kind === 'volume') return { prompt: `A rectangular box is ${a} cm long, ${b} cm wide, and ${c} cm high. What is its volume in cubic centimetres?`, hint: `The base area is ${a} × ${b} = ${a * b} square centimetres. Multiply by the height ${c} to get ${answer} cubic centimetres.` };
  if (kind === 'line') {
    const values = parts.slice(1).map(Number), labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const data = labels.map((day, index) => `${day} ${values[index]}`).join(', ');
    let prompt, hint;
    if (a === 0) { prompt = 'How many books were borrowed in total over all 5 days?'; hint = `Add the values for all five days: ${values.join(' + ')} = ${answer} books.`; }
    else if (a === 1) { const high = Math.max(...values), low = Math.min(...values); prompt = 'What is the difference in books between the highest and lowest daily totals?'; hint = `Subtract the lowest value ${low} from the highest value ${high}: ${high} − ${low} = ${answer} books.`; }
    else { prompt = 'How many books were borrowed on Thursday and Friday altogether?'; hint = `Read the values for those two days and add: ${values[3]} + ${values[4]} = ${answer} books.`; }
    return { prompt: `A library records books borrowed each day (books): ${data}. ${prompt}`, hint, visual: { ...q.visual, labels, unit: 'books' } };
  }
  if (kind === 'factor') {
    const [op, leftText, rightText] = parts, left = Number(leftText), right = Number(rightText), common = gcd(left, right);
    const divisors = n => Array.from({ length: n }, (_, index) => index + 1).filter(value => n % value === 0).join(', ');
    return op === 'gcd'
      ? { prompt: `What is the greatest common factor (GCF) of ${left} and ${right}?`, hint: `Factors of ${left}: ${divisors(left)}. Factors of ${right}: ${divisors(right)}. The greatest number that divides both exactly is ${answer}.` }
      : { prompt: `One bell rings every ${left} minutes and another every ${right} minutes. If they ring together now, in how many minutes will they next ring together?`, hint: `Find the least common multiple (LCM) of ${left} and ${right}. Their GCF is ${common}, so LCM = ${left} × ${right} ÷ ${common} = ${answer} minutes.` };
  }
  if (kind === 'ratio') return { prompt: `The ratio of red marbles to blue marbles is ${a} : ${b}. If there are ${a * c} red marbles, how many blue marbles are there?`, hint: `${a} parts of red marbles equals ${a * c}, so 1 part = ${a * c} ÷ ${a} = ${c} marbles. The ${b} blue parts contain ${b} × ${c} = ${answer} marbles.` };
  if (kind === 'scale') return { prompt: `A map has a scale of 1 : ${b}. A distance measures ${a} cm on the map. What is the actual distance in metres?`, hint: `The actual distance is ${a} × ${b} = ${a * b} cm. Divide by 100 to convert to metres: ${answer} metres.` };
  if (kind === 'triangle') return { prompt: `A triangle has a base of ${a} cm and a perpendicular height of ${b} cm. What is its area in square centimetres?`, hint: `Triangle area = ½ × base × height = ${a} × ${b} ÷ 2 = ${answer} square centimetres.` };
  if (kind === 'polygon') return { prompt: `A house-shaped pentagon is split into a rectangle ${a} cm wide and ${b} cm high, and a triangular roof with base ${a} cm and height ${c} cm. The shapes do not overlap. What is the total area in square centimetres?`, hint: `Rectangle area: ${a} × ${b} = ${a * b}. Roof area: ${a} × ${c} ÷ 2 = ${a * c / 2}. Total: ${a * b} + ${a * c / 2} = ${answer} square centimetres.` };
  if (kind === 'circle') {
    const [op, radiusText, numeratorText, denominatorText] = parts, radius = Number(radiusText), pi = Number(denominatorText) === 7 ? '22/7' : '3.14', area = op === 'area';
    return { prompt: `A circle has a radius of ${radius} cm. What is its ${area ? 'area in square centimetres' : 'circumference in centimetres'}? (Use π = ${pi}.)`, hint: `${area ? 'Area = π × radius × radius' : 'Circumference = 2 × π × radius'} = ${area ? `${pi} × ${radius} × ${radius}` : `2 × ${pi} × ${radius}`} = ${answer} ${area ? 'square centimetres' : 'centimetres'}.` };
  }
  if (kind === 'compoundvolume') return { prompt: `Two rectangular prisms measure ${a} × ${b} × ${c} cm and ${d} × ${e} × ${f} cm. They are joined without overlap. What is their total volume in cubic centimetres?`, hint: `First prism: ${a} × ${b} × ${c} = ${a * b * c}. Second prism: ${d} × ${e} × ${f} = ${d * e * f}. Total: ${a * b * c} + ${d * e * f} = ${answer} cubic centimetres.` };
  if (kind === 'pie') {
    const [mode, total, selected, ...values] = parts.map(Number), labels = ['Sports', 'Music', 'Art'], label = labels[selected], share = values[selected];
    const data = labels.map((name, index) => `${name} ${values[index]}%`).join(', ');
    const prompt = mode === 0 ? `There are ${total} students in all. How many prefer ${label.toLowerCase()}?` : `What is the central angle, in degrees, of the ${label.toLowerCase()} sector?`;
    const hint = mode === 0 ? `${label} accounts for ${share}%, so ${total} × ${share}/100 = ${answer} students.` : `A full circle has 360°. A ${share}% sector has an angle of 360 × ${share}/100 = ${answer}°.`;
    return { prompt: `A pie chart shows favourite activities (one choice per student): ${data}. ${prompt}`, hint, visual: { ...q.visual, labels } };
  }
  throw new RangeError(`Unsupported upper-primary question kind: ${kind}`);
}
const topicAt = (grade, slot) => UPPER_PRIMARY_PROFILES[grade - 5].topics[slot];
const mixed = (n, d) => n > d && n % d !== 0 ? `${Math.floor(n / d)} ${n % d}/${d}` : `${n}/${d}`;
const fractionAnswer = ' (ตอบเป็นจำนวน เศษส่วน a/b หรือทศนิยมได้)';
function fractionOperands(rng) {
  const d = integer(rng, 2, 12), whole = integer(rng, 0, 3);
  return [whole * d + integer(rng, 1, d - 1), d];
}

function fractions(rng, grade) {
  let [a, d] = fractionOperands(rng), [b, e] = fractionOperands(rng);
  const op = pick(rng, grade === 5 ? ['add', 'sub', 'mul', 'div'] : ['add', 'sub', 'mul', 'div', 'addmul', 'subdiv']);
  if ((op === 'sub' || op === 'subdiv') && a * e < b * d) [a, d, b, e] = [b, e, a, d];
  const common = lcm(d, e), left = a * common / d, right = b * common / e;
  let n, denominator, expression, hint;
  if (op === 'add' || op === 'sub' || op === 'addmul' || op === 'subdiv') {
    const adding = op === 'add' || op === 'addmul';
    n = adding ? left + right : left - right;
    denominator = common;
    expression = `${mixed(a, d)} ${adding ? '+' : '−'} ${mixed(b, e)}`;
    hint = `แปลงจำนวนคละเป็นเศษเกิน แล้วทำตัวส่วนให้เท่ากันเป็น ${common}: ${left}/${common} ${adding ? '+' : '−'} ${right}/${common} = ${n}/${common}`;
  } else if (op === 'mul') {
    n = a * b; denominator = d * e;
    expression = `${mixed(a, d)} × ${mixed(b, e)}`;
    hint = `แปลงเป็นเศษเกิน: ${a}/${d} × ${b}/${e} = (${a} × ${b})/(${d} × ${e}) = ${n}/${denominator}`;
  } else {
    n = a * e; denominator = d * b;
    expression = `${mixed(a, d)} ÷ ${mixed(b, e)}`;
    hint = `เขียนจำนวนคละเป็นเศษเกินก่อน จากนั้นเปลี่ยนการหารเป็นการคูณด้วยส่วนกลับของตัวหาร: ${a}/${d} × ${e}/${b} = ${n}/${denominator}`;
  }
  const parts = [op, a, d, b, e];
  if (op === 'addmul' || op === 'subdiv') {
    const c = integer(rng, 1, 8), f = integer(rng, 2, 10);
    expression = `(${expression}) ${op === 'addmul' ? '×' : '÷'} ${c}/${f}`;
    hint += op === 'addmul' ? ` แล้วคูณ ${c}/${f}: (${n} × ${c})/(${denominator} × ${f})` : ` แล้วคูณส่วนกลับ ${f}/${c}: (${n} × ${f})/(${denominator} × ${c})`;
    n *= op === 'addmul' ? c : f;
    denominator *= op === 'addmul' ? f : c;
    parts.push(c, f);
  }
  const answer = reduced(n, denominator);
  return question(grade, 'fraction', parts, `${expression} = ?${fractionAnswer}`, answer, `${hint} เขียนเป็นเศษส่วนอย่างต่ำได้ ${answer}`, topicAt(grade, grade === 5 ? 0 : 1));
}

function decimals(rng, grade) {
  const op = pick(rng, ['add', 'sub', 'mul', 'div']);
  let pa = integer(rng, 1, 3), pb = integer(rng, 1, 3), a = integer(rng, 1, 50000), b = integer(rng, 1, 30000);
  let hint, answer;
  if (op === 'mul') {
    pa = integer(rng, 1, 2); pb = 1; a = integer(rng, 11, 999); b = integer(rng, 2, 99);
    answer = decimal(a * b, pa + pb);
    hint = `คูณแบบจำนวนเต็ม ${a} × ${b} = ${a * b} แล้วนับจากขวาไปซ้าย ${pa + pb} ตำแหน่งแล้วใส่จุดทศนิยม ได้ ${answer}`;
  } else if (op === 'div') {
    // Construct a finite quotient rather than rounding a recurring decimal.
    pb = grade === 5 ? 0 : integer(rng, 1, 2);
    pa = 3;
    b = integer(rng, 2, grade === 5 ? 12 : 99);
    const quotientPlaces = integer(rng, 1, 3 - pb), quotientUnits = integer(rng, 1, 250);
    a = b * quotientUnits * 10 ** (3 - pb - quotientPlaces);
    answer = decimal(quotientUnits, quotientPlaces);
    hint = pb === 0
      ? `หาร ${decimal(a, pa)} ด้วย ${b}: ${a} ÷ ${b} = ${a / b} แล้วใส่จุดทศนิยม 3 ตำแหน่ง ได้ ${answer}; ตรวจด้วย ${answer} × ${b} = ${decimal(a, pa)}`
      : `เลื่อนจุดทศนิยมของทั้งตัวตั้งและตัวหารไปทางขวา ${pb} ตำแหน่ง เพื่อให้ตัวหารเป็นจำนวนเต็ม: ${decimal(a, pa - pb)} ÷ ${b} = ${answer}; ตรวจด้วย ${answer} × ${decimal(b, pb)} = ${decimal(a, pa)}`;
  } else {
    if (op === 'sub' && a / 10 ** pa < b / 10 ** pb) [a, pa, b, pb] = [b, pb, a, pa];
    const places = Math.max(pa, pb), left = a * 10 ** (places - pa), right = b * 10 ** (places - pb);
    const units = op === 'add' ? left + right : left - right;
    answer = decimal(units, places);
    hint = `เติมศูนย์ท้ายทศนิยมให้ครบ ${places} ตำแหน่ง แล้วตั้งจุดทศนิยมให้ตรงกัน คิดจาก ${left} ${op === 'add' ? '+' : '−'} ${right} = ${units} แล้วใส่จุดทศนิยมกลับ ${places} ตำแหน่ง ได้ ${answer}`;
  }
  const symbol = { add: '+', sub: '−', mul: '×', div: '÷' }[op];
  return question(grade, 'decimal', [op, a, 10 ** pa, b, 10 ** pb], `${decimal(a, pa)} ${symbol} ${decimal(b, pb)} = ?`, answer, hint, topicAt(grade, 1));
}

function percentages(rng, grade) {
  const rate = pick(rng, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75]), whole = integer(rng, 2, 60) * 20;
  const part = whole * rate / 100;
  if (grade === 5) {
    if (integer(rng, 0, 1) === 0) return question(grade, 'percent', ['part', whole, rate], `ร้อยละ ${rate} ของ ${whole} เท่ากับเท่าไร?`, part, `ร้อยละ ${rate} คือ ${rate}/100 จึงได้ ${whole} × ${rate} ÷ 100 = ${part}`, topicAt(grade, 2));
    return question(grade, 'percent', ['discount', whole, rate], `กระเป๋าราคา ${whole} บาท ลดราคา ${rate}% ต้องจ่ายกี่บาท?`, whole - part, `ส่วนลด ${whole} × ${rate} ÷ 100 = ${part} บาท ราคาหลังลด ${whole} − ${part} = ${whole - part} บาท`, topicAt(grade, 2));
  }
  if (integer(rng, 0, 1) === 0) return question(grade, 'percent', ['reverse', whole, rate], `กระเป๋าลดราคา ${rate}% แล้วเหลือ ${whole - part} บาท ก่อนลดราคากี่บาท?`, whole, `ราคาหลังลดคิดเป็น ${100 - rate}% ของราคาเดิม: ${whole - part} ÷ ${100 - rate} × 100 = ${whole} บาท`, topicAt(grade, 2));
  const secondRate = pick(rng, [5, 10, 15, 20, 25]), afterFirst = whole - part, afterSecond = finite(afterFirst * (100 - secondRate) / 100);
  return question(grade, 'percent', ['successive', whole, rate, secondRate], `รองเท้าราคา ${whole} บาท ลด ${rate}% แล้วลดเพิ่มอีก ${secondRate}% ของราคาหลังลดครั้งแรก ต้องจ่ายกี่บาท?`, afterSecond, `ครั้งแรกเหลือ ${whole} × ${100 - rate}/100 = ${afterFirst} บาท ครั้งที่สองเหลือ ${afterFirst} × ${100 - secondRate}/100 = ${afterSecond} บาท`, topicAt(grade, 2));
}

function measurementGeometry(rng) {
  const kind = integer(rng, 0, 2), grade = 5, topic = topicAt(grade, 3);
  if (kind === 0) {
    const [large, small, factor, largeCode, smallCode] = pick(rng, [['กิโลเมตร', 'เมตร', 1000, 'km', 'm'], ['เมตร', 'เซนติเมตร', 100, 'm', 'cm'], ['เซนติเมตร', 'มิลลิเมตร', 10, 'cm', 'mm'], ['กิโลกรัม', 'กรัม', 1000, 'kg', 'g'], ['ลิตร', 'มิลลิลิตร', 1000, 'l', 'ml']]);
    const reverse = integer(rng, 0, 1) === 1, amount = integer(rng, 1, 9000), from = reverse ? small : large, to = reverse ? large : small;
    const answer = finite(reverse ? amount / factor : amount * factor);
    return question(grade, 'convert', [amount, reverse ? 1 : factor, reverse ? factor : 1, reverse ? smallCode : largeCode, reverse ? largeCode : smallCode], `${amount} ${from} เท่ากับกี่${to}?`, answer, `1 ${large} = ${factor} ${small} จึง${reverse ? 'หาร' : 'คูณ'} ${factor}: ${amount} ${reverse ? '÷' : '×'} ${factor} = ${answer} ${to}`, topic);
  }
  if (kind === 1) {
    const base = integer(rng, 3, 35), height = integer(rng, 2, 25), [shape, shapeCode] = pick(rng, [['รูปสี่เหลี่ยมด้านขนาน', 'parallelogram'], ['รูปสี่เหลี่ยมขนมเปียกปูน', 'rhombus']]);
    return question(grade, 'area4', [base, height, shapeCode], `${shape}มีฐาน ${base} ซม. และความสูงตั้งฉากกับฐาน ${height} ซม. พื้นที่กี่ตารางเซนติเมตร?`, base * height, `พื้นที่ = ความยาวฐาน × ความสูงตั้งฉาก = ${base} × ${height} = ${base * height} ตารางเซนติเมตร`, topic);
  }
  const length = integer(rng, 3, 20), width = integer(rng, 2, 15), height = integer(rng, 2, 12);
  return question(grade, 'volume', [length, width, height], `กล่องทรงสี่เหลี่ยมมุมฉากยาว ${length} ซม. กว้าง ${width} ซม. สูง ${height} ซม. มีปริมาตรกี่ลูกบาศก์เซนติเมตร?`, length * width * height, `พื้นที่ฐาน ${length} × ${width} = ${length * width} ตารางเซนติเมตร แล้วคูณความสูง ${height} ได้ ${length * width * height} ลูกบาศก์เซนติเมตร`, topic);
}

function lineData(rng) {
  const labels = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'], values = labels.map(() => integer(rng, 2, 24) * 5), visual = { type: 'line', labels, values, unit: 'เล่ม' };
  const data = labels.map((day, index) => `${day} ${values[index]}`).join(', '), mode = integer(rng, 0, 2);
  let prompt, answer, hint;
  if (mode === 0) {
    answer = values.reduce((a, b) => a + b, 0);
    prompt = 'ทั้ง 5 วันยืมรวมกี่เล่ม?'; hint = `รวมข้อมูลทั้งห้าวัน: ${values.join(' + ')} = ${answer} เล่ม`;
  } else if (mode === 1) {
    const high = Math.max(...values), low = Math.min(...values); answer = high - low;
    prompt = 'วันที่ยืมมากที่สุดกับน้อยที่สุดต่างกันกี่เล่ม?'; hint = `ค่ามากที่สุด ${high} ลบค่าน้อยที่สุด ${low}: ${high} − ${low} = ${answer} เล่ม`;
  } else {
    answer = values[3] + values[4]; prompt = 'พฤหัสบดีกับศุกร์ยืมรวมกี่เล่ม?'; hint = `อ่านสองวันนั้นแล้วบวก: ${values[3]} + ${values[4]} = ${answer} เล่ม`;
  }
  return question(5, 'line', [mode, ...values], `ห้องสมุดบันทึกจำนวนหนังสือที่ยืม (เล่ม): ${data} ${prompt}`, answer, hint, topicAt(5, 4), true, visual);
}

function factors(rng) {
  const common = integer(rng, 2, 12), a = common * integer(rng, 2, 10), b = common * integer(rng, 2, 10), hcf = gcd(a, b), multiple = lcm(a, b), findGcd = integer(rng, 0, 1) === 0;
  const divisors = n => Array.from({ length: n }, (_, index) => index + 1).filter(d => n % d === 0).join(', ');
  return findGcd
    ? question(6, 'factor', ['gcd', a, b], `ห.ร.ม. ของ ${a} และ ${b} เท่ากับเท่าไร?`, hcf, `ตัวประกอบของ ${a}: ${divisors(a)}; ของ ${b}: ${divisors(b)} ตัวที่หารทั้งสองลงตัวและมากที่สุดคือ ${hcf}`, topicAt(6, 0), true)
    : question(6, 'factor', ['lcm', a, b], `ระฆังใบหนึ่งดังทุก ${a} นาที อีกใบดังทุก ${b} นาที ถ้าดังพร้อมกันตอนนี้ อีกกี่นาทีจะดังพร้อมกันครั้งถัดไป?`, multiple, `หา ค.ร.น. ของ ${a} และ ${b}: ห.ร.ม. = ${hcf} จึงได้ ค.ร.น. = ${a} × ${b} ÷ ${hcf} = ${multiple} นาที`, topicAt(6, 0), true);
}

function ratios(rng) {
  const mode = integer(rng, 0, 3), topic = topicAt(6, 2);
  if (mode >= 2) return percentages(rng, 6);
  if (mode === 0) {
    const a = integer(rng, 1, 9), b = integer(rng, 2, 9), groups = integer(rng, 2, 20);
    return question(6, 'ratio', [a, b, groups], `ลูกแก้วสีแดง : สีน้ำเงิน = ${a} : ${b} ถ้ามีสีแดง ${a * groups} ลูก มีสีน้ำเงินกี่ลูก?`, b * groups, `สีแดง ${a} ส่วนเป็น ${a * groups} ลูก ดังนั้น 1 ส่วน = ${a * groups} ÷ ${a} = ${groups} ลูก สีน้ำเงิน ${b} ส่วน = ${b} × ${groups} = ${b * groups} ลูก`, topic, true);
  }
  const scale = pick(rng, [100, 200, 500, 1000, 2000, 5000, 10000]), cm = integer(rng, 1, 30), metres = cm * scale / 100;
  return question(6, 'scale', [cm, scale], `แผนที่มาตราส่วน 1 : ${scale} วัดระยะได้ ${cm} ซม. ระยะจริงกี่เมตร?`, metres, `ระยะจริง ${cm} × ${scale} = ${cm * scale} ซม. แล้วหาร 100 เพื่อเปลี่ยนเป็นเมตร ได้ ${metres} เมตร`, topic);
}

function geometry(rng) {
  const mode = integer(rng, 0, 4), topic = topicAt(6, 3);
  if (mode === 0) {
    const base = integer(rng, 3, 35), height = integer(rng, 3, 25);
    return question(6, 'triangle', [base, height], `รูปสามเหลี่ยมมีฐาน ${base} ซม. และความสูงตั้งฉากกับฐาน ${height} ซม. พื้นที่กี่ตารางเซนติเมตร?`, base * height / 2, `พื้นที่สามเหลี่ยม = ½ × ฐาน × สูง = ${base} × ${height} ÷ 2 = ${base * height / 2} ตารางเซนติเมตร`, topic);
  }
  if (mode === 1) {
    const width = integer(rng, 4, 20), height = integer(rng, 3, 15), roof = integer(rng, 2, 12), answer = width * height + width * roof / 2;
    return question(6, 'polygon', [width, height, roof], `รูปห้าเหลี่ยมที่มีรูปร่างคล้ายบ้านแบ่งได้เป็นสี่เหลี่ยมผืนผ้ากว้าง ${width} ซม. สูง ${height} ซม. กับสามเหลี่ยมหลังคาฐาน ${width} ซม. สูง ${roof} ซม. โดยทั้งสองส่วนไม่ทับกัน มีพื้นที่รวมกี่ตารางเซนติเมตร?`, answer, `พื้นที่สี่เหลี่ยม ${width} × ${height} = ${width * height}; พื้นที่หลังคา ${width} × ${roof} ÷ 2 = ${width * roof / 2}; รวม ${answer} ตารางเซนติเมตร`, topic);
  }
  if (mode === 2 || mode === 3) {
    const use22 = integer(rng, 0, 1) === 0, radius = use22 ? integer(rng, 1, 6) * 7 : integer(rng, 2, 20), numerator = use22 ? 22 : 314, denominator = use22 ? 7 : 100;
    const area = mode === 3, answer = finite((area ? radius * radius : 2 * radius) * numerator / denominator), pi = use22 ? '22/7' : '3.14';
    return question(6, 'circle', [area ? 'area' : 'circumference', radius, numerator, denominator], `วงกลมรัศมี ${radius} ซม. มี${area ? 'พื้นที่กี่ตารางเซนติเมตร' : 'ความยาวรอบรูปกี่เซนติเมตร'}? (กำหนด π = ${pi})`, answer, `${area ? 'พื้นที่ = π × รัศมี × รัศมี' : 'ความยาวรอบรูป = 2 × π × รัศมี'} = ${area ? `${pi} × ${radius} × ${radius}` : `2 × ${pi} × ${radius}`} = ${answer} ${area ? 'ตารางเซนติเมตร' : 'เซนติเมตร'}`, topic);
  }
  const a = integer(rng, 3, 15), b = integer(rng, 2, 12), c = integer(rng, 2, 10), d = integer(rng, 2, 8), e = integer(rng, 2, 9), f = integer(rng, 2, 7), first = a * b * c, second = d * e * f;
  return question(6, 'compoundvolume', [a, b, c, d, e, f], `แท่งทรงสี่เหลี่ยมมุมฉาก 2 แท่ง ขนาด ${a} × ${b} × ${c} ซม. และ ${d} × ${e} × ${f} ซม. นำมาต่อชิดกันโดยไม่ทับกัน มีปริมาตรรวมกี่ลูกบาศก์เซนติเมตร?`, first + second, `แท่งแรก ${a} × ${b} × ${c} = ${first}; แท่งที่สอง ${d} × ${e} × ${f} = ${second}; รวม ${first} + ${second} = ${first + second} ลูกบาศก์เซนติเมตร`, topic);
}

function pieData(rng) {
  const first = pick(rng, [10, 20, 25, 30, 40, 50]), second = pick(rng, [10, 15, 20, 25]), values = [first, second, 100 - first - second], labels = ['กีฬา', 'ดนตรี', 'ศิลปะ'];
  const total = integer(rng, 2, 30) * 20, selected = integer(rng, 0, 2), mode = integer(rng, 0, 1), share = values[selected], visual = { type: 'pie', labels, values, unit: '%' };
  const data = labels.map((label, index) => `${label} ${values[index]}%`).join(', ');
  const answer = mode === 0 ? total * share / 100 : finite(360 * share / 100);
  const prompt = mode === 0 ? `ถ้ามีนักเรียนทั้งหมด ${total} คน มีคนชอบ${labels[selected]}กี่คน?` : `ส่วนของ${labels[selected]}มีมุมที่จุดศูนย์กลางกี่องศา?`;
  const hint = mode === 0 ? `${labels[selected]}คิดเป็น ${share}% จึงได้ ${total} × ${share}/100 = ${answer} คน` : `มุมรอบจุดศูนย์กลางรวมกันเป็น 360° ส่วนที่คิดเป็น ${share}% จึงมีมุม 360 × ${share}/100 = ${answer}°`;
  // A total is relevant only when asking for a count. Do not give identical
  // angle questions different IDs just because an unused random total changed.
  return question(6, 'pie', [mode, mode === 0 ? total : 0, selected, ...values], `แผนภูมิรูปวงกลมแสดงกิจกรรมที่ชอบ (เลือกคนละ 1 อย่าง): ${data} ${prompt}`, answer, hint, topicAt(6, 4), false, visual);
}

export function upperPrimaryCandidate(grade, slot, rng) {
  if (grade === 5) return [() => fractions(rng, grade), () => decimals(rng, grade), () => percentages(rng, grade), () => measurementGeometry(rng), () => lineData(rng)][slot]();
  return [() => factors(rng), () => integer(rng, 0, 2) === 0 ? decimals(rng, grade) : fractions(rng, grade), () => ratios(rng), () => geometry(rng), () => pieData(rng)][slot]();
}
