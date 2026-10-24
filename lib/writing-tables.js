// Copying models for arithmetic handwriting practice. These starting points
// are optional practice suggestions, not a statement of curriculum coverage.
export const WRITING_OPERATIONS = Object.freeze([
  { id: 'addition', symbol: '+', label: { th: 'บวก', en: 'Addition' }, minBase: 1, maxBase: 12 },
  { id: 'subtraction', symbol: '−', label: { th: 'ลบ', en: 'Subtraction' }, minBase: 1, maxBase: 12 },
  { id: 'multiplication', symbol: '×', label: { th: 'คูณ', en: 'Multiplication' }, minBase: 1, maxBase: 12 },
  { id: 'division', symbol: '÷', label: { th: 'หาร', en: 'Division' }, minBase: 1, maxBase: 12 },
  { id: 'fractions', symbol: '/', label: { th: 'เศษส่วน', en: 'Fractions' }, minBase: 2, maxBase: 12 },
].map(operation => Object.freeze({ ...operation, label: Object.freeze(operation.label) })));

export const WRITING_GRADE_PRESETS = Object.freeze([
  { grade: 1, operation: 'addition', base: 2 },
  { grade: 2, operation: 'multiplication', base: 2 },
  { grade: 3, operation: 'division', base: 3 },
  { grade: 4, operation: 'fractions', base: 4 },
  { grade: 5, operation: 'fractions', base: 6 },
  { grade: 6, operation: 'fractions', base: 12 },
].map(preset => Object.freeze({ ...preset, label: Object.freeze({ th: `ป.${preset.grade}`, en: `Grade ${preset.grade}` }) })));

const words = {
  th: {
    addition: base => `ตารางบวก ${base}`,
    subtraction: base => `ตารางลบ ${base}`,
    multiplication: base => `แม่สูตรคูณ ${base}`,
    division: base => `ตารางหารด้วย ${base}`,
    fractions: base => `เศษส่วนที่มีตัวส่วน ${base}`,
    description: 'เขียนตามเส้นประให้ครบทั้งตัวเลข เครื่องหมาย และคำตอบ ค่อย ๆ อ่านโจทย์ไปด้วย',
    fractionDescription: base => `แถบนี้แบ่งเป็น ${base} ส่วนเท่า ๆ กัน ดูว่าระบายสีไว้กี่ส่วน แล้วเขียนเศษส่วนตามรอย ตัวเศษบอกจำนวนส่วนที่ระบายสี ตัวส่วน ${base} บอกจำนวนส่วนทั้งหมด`,
    additionLabel: (a, b, answer) => `${a} บวก ${b} เท่ากับ ${answer}`,
    subtractionLabel: (a, b, answer) => `${a} ลบ ${b} เท่ากับ ${answer}`,
    multiplicationLabel: (a, b, answer) => `${a} คูณ ${b} เท่ากับ ${answer}`,
    divisionLabel: (a, b, answer) => `${a} หารด้วย ${b} เท่ากับ ${answer}`,
    fractionLabel: (numerator, denominator) => `${numerator}/${denominator} — แถบนี้แบ่งเป็น ${denominator} ส่วนเท่า ๆ กัน ระบายสี ${numerator} ส่วน จึงเขียนตัวเศษเป็น ${numerator} และตัวส่วนเป็น ${denominator}${numerator === denominator ? ' ระบายสีครบทั้งแถบ จึงมีค่าเท่ากับ 1' : ''}`,
  },
  en: {
    addition: base => `Addition table for ${base}`,
    subtraction: base => `Subtracting ${base}`,
    multiplication: base => `${base} times table`,
    division: base => `Dividing by ${base}`,
    fractions: base => `Fractions with denominator ${base}`,
    description: 'Trace every number, sign, and answer along the dotted lines. Read each equation slowly as you write.',
    fractionDescription: base => `One whole is split into ${base} equal parts. Look at the shaded parts, then trace the numerator, / sign, and denominator. Keep denominator ${base} to compare the pictures.`,
    additionLabel: (a, b, answer) => `${a} plus ${b} equals ${answer}`,
    subtractionLabel: (a, b, answer) => `${a} minus ${b} equals ${answer}`,
    multiplicationLabel: (a, b, answer) => `${a} times ${b} equals ${answer}`,
    divisionLabel: (a, b, answer) => `${a} divided by ${b} equals ${answer}`,
    fractionLabel: (numerator, denominator) => `${numerator}/${denominator} — numerator ${numerator}, denominator ${denominator}: ${numerator} of ${denominator} equal parts of one whole are shaded${numerator === denominator ? ', equal to 1 whole' : ''}`,
  },
};

/**
 * Produce complete, deterministic tracing models without changing app language.
 * Arithmetic rows cover 1–12; fractions cover 1/base through base/base without
 * reducing, so the denominator still matches the equal parts in the picture.
 */
export function createWritingTable({ operation = 'multiplication', base = 2, language = 'th' } = {}) {
  const metadata = WRITING_OPERATIONS.find(item => item.id === operation);
  if (!metadata) throw new RangeError('Choose a supported writing-table operation');
  if (!Number.isInteger(base) || base < metadata.minBase || base > metadata.maxBase) {
    throw new RangeError(`Base must be an integer from ${metadata.minBase} to ${metadata.maxBase}`);
  }
  const locale = language === 'en' ? 'en' : 'th', text = words[locale];
  const rows = Array.from({ length: operation === 'fractions' ? base : 12 }, (_, index) => {
    const value = index + 1, id = `writing-${operation}-${base}-${value}`;
    if (operation === 'fractions') return {
      id, index: value, target: `${value}/${base}`, label: text.fractionLabel(value, base),
      answer: `${value}/${base}`, numerator: value, denominator: base,
      visual: { kind: 'fraction-bar', parts: base, filled: value },
    };
    const [left, right, answer] = operation === 'addition' ? [base, value, base + value]
      : operation === 'subtraction' ? [base + value, base, value]
        : operation === 'multiplication' ? [base, value, base * value]
          : [base * value, base, value];
    return {
      id, index: value, target: `${left} ${metadata.symbol} ${right} = ${answer}`,
      label: text[`${operation}Label`](left, right, answer), operands: [left, right], answer,
    };
  });
  return {
    operation, base, language: locale, title: text[operation](base),
    description: operation === 'fractions' ? text.fractionDescription(base) : text.description,
    rows,
  };
}
