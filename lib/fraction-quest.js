// Exact, untimed fraction manipulatives. A whole always occupies 24 ticks;
// completing an activity records participation, not a claim of mastery.
const text = (th, en) => ({ th, en });
const clone = value => JSON.parse(JSON.stringify(value));
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const local = (value, language) => value[language === 'en' ? 'en' : 'th'];
export const FRACTION_TICKS_PER_WHOLE = 24;
export const FRACTION_DENOMINATORS = freeze([2, 3, 4, 6, 8, 12]);
const gcd = (a, b) => b ? gcd(b, a % b) : a;
export function fractionLabel(ticks) {
  if (!Number.isInteger(ticks) || ticks < 0) return '?';
  const divisor = gcd(ticks, 24);
  return ticks % 24 === 0 ? String(ticks / 24) : `${ticks / divisor}/${24 / divisor}`;
}

export const FRACTION_CHAPTERS = freeze([
  { id: 'fraction-bridge', ideaId: 51, title: text('สะพานเศษส่วน', 'Fraction bridges'), story: text('เลือกแผ่นที่วัดจากหนึ่งเต็มเดียวกัน ต่อสะพานให้ถึงฝั่งพอดี', 'Choose planks measured against the same whole and build exactly to the shore.') },
  { id: 'equivalent-room', ideaId: 52, title: text('ห้องแปลงส่วน', 'Equivalent fraction room'), story: text('แบ่งหรือรวมทุกส่วนเท่า ๆ กัน พื้นที่ระบายยังเท่าเดิม', 'Split or merge all equal parts while keeping the shaded quantity unchanged.') },
  { id: 'potion-lab', ideaId: 54, title: text('โรงผสมน้ำผลไม้วิเศษ', 'Magic juice laboratory'), story: text('ตวงส่วนผสมทั้งสองตามสูตร ขวดหนึ่งเต็มจุ 1 ลิตร', 'Measure both ingredients to match the recipe. One full beaker holds 1 litre.') },
]);
const piece = (id, numerator, denominator, ingredient) => ({ id, numerator, denominator, ticks: numerator * (24 / denominator), ...(ingredient ? { ingredient } : {}) });
const explanationReasoning = (prompt, correct, distractor, explanation) => ({
  prompt, options: [{ id: 'same-whole', label: correct }, { id: 'different-whole', label: distractor }], correctId: 'same-whole', explanation,
});

function bridgeLevel(id, fractions, targetTicks, requiredPlanks, example) {
  const target = fractionLabel(targetTicks);
  const countTh = requiredPlanks ? ` ใช้แผ่น ${requiredPlanks} แผ่นพอดี` : '';
  const countEn = requiredPlanks ? ` Use exactly ${requiredPlanks} planks.` : '';
  return {
    id: `bridge-${id}`, chapterId: 'fraction-bridge', ideaId: 51, kind: 'bridge', grades: [3, 4, 5, 6], capacityTicks: 24,
    title: text(`สะพานที่ ${id}: ไปให้ถึง ${target}`, `Bridge ${id}: reach ${target}`),
    prompt: text(`หนึ่งเต็มยาวเท่ากับแถบ 0–1 เลือกแผ่นต่อให้ถึงฝั่งที่ ${target} แต่ละแผ่นใช้ได้ครั้งเดียว${countTh} ย้อนกลับเพื่อนำแผ่นคืนได้`, `One whole is the full 0–1 strip. Reach the shore at ${target}. Use each plank at most once.${countEn} Undo to return a plank.`),
    initial: { ticks: 0, used: [] }, goal: { targetTicks, requiredPlanks },
    planks: fractions.map(([n, d], index) => piece(`plank-${index + 1}`, n, d)),
    hints: [text('เทียบแผ่นทุกแผ่นกับหนึ่งเต็มเดียวกัน ตัวส่วนบอกว่าแบ่งหนึ่งเต็มเป็นกี่ส่วนเท่า ๆ กัน', 'Compare every plank against the same whole. The denominator counts its equal parts.'), text(`หาว่ายังขาดอีกเท่าไรจึงถึง ${target} แล้วลองใช้แผ่นที่เหลือเติมช่องว่าง`, `Find the gap to ${target}, then look for remaining planks that fill it.`), text(`วิธีหนึ่งคือ ${example} = ${target}${countTh}`, `One route is ${example} = ${target}.${countEn}`)],
    reasoning: explanationReasoning(text('ทำไม 1/2 กับ 2/4 จึงยาวเท่ากัน?', 'Why are 1/2 and 2/4 equally long?'), text('แบ่งหนึ่งเต็มเดียวกันเป็น 4 ส่วน สองส่วนรวมเป็นครึ่งหนึ่ง', 'Two of four equal parts of the same whole make one half.'), text('ตัวส่วนมากขึ้นทำให้ความยาวเพิ่มเสมอ', 'A larger denominator always makes a longer plank.'), text('หนึ่งเต็มต้องยาวเท่ากัน: 1/2 = 2/4 = 12/24 ตำแหน่งปลายจึงตรงกัน', 'Use the same whole: 1/2 = 2/4 = 12/24, so their endpoints coincide.')),
  };
}

function equivalentLevel(id, numerator, denominator, goalDenominator, example) {
  return {
    id: `equivalent-${id}`, chapterId: 'equivalent-room', ideaId: 52, kind: 'equivalent', grades: [3, 4, 5],
    title: text(`ห้องที่ ${id}: แปลง ${numerator}/${denominator}`, `Room ${id}: transform ${numerator}/${denominator}`),
    prompt: text(`คงพื้นที่ระบาย ${numerator}/${denominator} ของแถบเต็มเดิม แล้วเปลี่ยนให้ตัวส่วนเป็น ${goalDenominator} แบ่งหรือรวมทุกส่วนพร้อมกันทีละ 2 หรือ 3 เท่า`, `Keep the shaded quantity ${numerator}/${denominator} of the same whole. Change its denominator to ${goalDenominator} by splitting or merging all parts by 2 or 3.`),
    initial: { numerator, denominator }, goal: { denominator: goalDenominator }, allowedDenominators: FRACTION_DENOMINATORS,
    hints: [text('แถบเต็มและพื้นที่ระบายต้องเท่าเดิม เปลี่ยนได้เฉพาะขนาดของส่วนย่อย', 'Keep the whole and shaded quantity unchanged. Only the partition size changes.'), text(goalDenominator > denominator ? 'เมื่อแบ่งทุกส่วน จำนวนส่วนทั้งหมดและจำนวนส่วนระบายจะเพิ่มด้วยตัวคูณเดียวกัน' : 'เมื่อรวมส่วนย่อย ต้องหารจำนวนส่วนระบายและส่วนทั้งหมดลงตัวด้วยตัวเดียวกัน', goalDenominator > denominator ? 'Splitting every part multiplies both the shaded count and total count by the same factor.' : 'Merging parts must divide both counts exactly by the same factor.'), text(example, example)],
    reasoning: explanationReasoning(text('เมื่อแบ่งทุกส่วนเป็น 2 ส่วน ทำไมต้องคูณทั้งเศษและส่วนด้วย 2?', 'Why multiply both numerator and denominator by 2 when splitting every part in two?'), text('จำนวนช่องระบายและช่องทั้งหมดเพิ่มเป็นสองเท่า แต่พื้นที่ระบายเท่าเดิม', 'Both shaded and total cell counts double, keeping the shaded area unchanged.'), text('คูณแค่ตัวส่วนก็ทำให้ปริมาณเท่าเดิม', 'Multiplying only the denominator keeps the quantity unchanged.'), text('แต่ละช่องถูกแบ่งเท่ากัน รวมถึงช่องที่ระบาย จึงคูณทั้งเศษและส่วน พื้นที่ไม่เพิ่มหรือลด', 'Every cell is divided equally, including shaded cells. Both counts change together while the area stays the same.')),
  };
}

function potionLevel(id, fractions, redTicks, blueTicks, example) {
  return {
    id: `potion-${id}`, chapterId: 'potion-lab', ideaId: 54, kind: 'potion', grades: [4, 5, 6], capacityTicks: 24,
    title: text(`สูตรที่ ${id}: น้ำผลไม้วิเศษ`, `Recipe ${id}: magic juice`),
    prompt: text(`ตวงน้ำผลไม้แดง ${fractionLabel(redTicks)} ลิตร และน้ำผลไม้น้ำเงิน ${fractionLabel(blueTicks)} ลิตรตามสูตร ถ้วยแต่ละใบใช้ได้ครั้งเดียว ขวดเต็มจุ 1 ลิตร ย้อนกลับเพื่อนำถ้วยคืน`, `Measure ${fractionLabel(redTicks)} L of red juice and ${fractionLabel(blueTicks)} L of blue juice. Use each dose once. The beaker holds 1 L. Undo to return a dose.`),
    initial: { redTicks: 0, blueTicks: 0, used: [] }, goal: { redTicks, blueTicks },
    doses: fractions.map(([ingredient, n, d], index) => piece(`dose-${index + 1}`, n, d, ingredient)),
    hints: [text('ทุกถ้วยวัดจากหนึ่งลิตรเดียวกัน ลองเทียบส่วนผสมแต่ละชนิดแยกกัน', 'Every dose uses the same 1-litre whole. Compare each ingredient separately.'), text('ก่อนบวก ให้แบ่งหนึ่งลิตรเป็นส่วนเท่า ๆ กัน เช่น 1/2 = 2/4 จึงได้ 1/2 + 1/4 = 3/4', 'Before adding, use equal subdivisions: 1/2 = 2/4, so 1/2 + 1/4 = 3/4.'), text(`วิธีหนึ่ง: ${example.th} ตรวจให้ตรงทั้งสองชนิด`, `One recipe: ${example.en}. Check both ingredients.`)],
    reasoning: explanationReasoning(text('ทำไม 1/2 ลิตร + 1/4 ลิตร จึงเป็น 3/4 ลิตร?', 'Why does 1/2 L + 1/4 L equal 3/4 L?'), text('ครึ่งลิตรเท่ากับ 2/4 ลิตร จึงรวมเป็นสามส่วนจากสี่ส่วน', 'A half litre is 2/4 L, so the sum is three quarter-litres.'), text('บวกเศษและส่วนแยกกันได้ 2/6 ลิตร', 'Add numerators and denominators separately to get 2/6 L.'), text('ต้องใช้หน่วยตวงเท่ากัน: 1/2 + 1/4 = 2/4 + 1/4 = 3/4 ลิตร', 'Use the same measuring unit: 1/2 + 1/4 = 2/4 + 1/4 = 3/4 L.')),
  };
}

export const FRACTION_LEVELS = freeze([
  bridgeLevel(1, [[1, 2], [1, 4], [1, 4], [1, 3], [1, 6]], 24, null, '1/2 + 1/4 + 1/4'),
  bridgeLevel(2, [[1, 2], [1, 3], [1, 6], [1, 4], [1, 4]], 24, 3, '1/2 + 1/3 + 1/6'),
  bridgeLevel(3, [[1, 2], [1, 4], [1, 8], [1, 8], [1, 3], [1, 6]], 18, null, '1/2 + 1/4'),
  bridgeLevel(4, [[1, 3], [1, 4], [1, 4], [1, 6], [1, 12], [1, 2]], 24, 4, '1/3 + 1/4 + 1/4 + 1/6'),
  equivalentLevel(1, 1, 2, 4, '1/2 × 2/2 = 2/4'),
  equivalentLevel(2, 1, 3, 12, '1/3 × 2/2 = 2/6; 2/6 × 2/2 = 4/12'),
  equivalentLevel(3, 6, 12, 4, '(6 ÷ 3)/(12 ÷ 3) = 2/4'),
  equivalentLevel(4, 8, 12, 3, '(8 ÷ 2)/(12 ÷ 2) = 4/6; (4 ÷ 2)/(6 ÷ 2) = 2/3'),
  potionLevel(1, [['red', 1, 2], ['red', 1, 4], ['red', 1, 4], ['blue', 1, 4], ['blue', 1, 8], ['blue', 1, 8]], 12, 6, text('แดง 1/2 ลิตร; น้ำเงิน 1/4 ลิตร', 'red 1/2 L; blue 1/4 L')),
  potionLevel(2, [['red', 1, 3], ['red', 1, 6], ['red', 1, 6], ['blue', 1, 2], ['blue', 1, 4], ['blue', 1, 4]], 8, 12, text('แดง 1/3 ลิตร; น้ำเงิน 1/2 ลิตร', 'red 1/3 L; blue 1/2 L')),
  potionLevel(3, [['red', 1, 4], ['red', 1, 8], ['red', 1, 8], ['blue', 1, 2], ['blue', 1, 3], ['blue', 1, 6]], 6, 12, text('แดง 1/4 ลิตร; น้ำเงิน 1/3 + 1/6 ลิตร', 'red 1/4 L; blue 1/3 + 1/6 L')),
  potionLevel(4, [['red', 1, 3], ['red', 1, 12], ['red', 1, 4], ['red', 1, 6], ['blue', 1, 2], ['blue', 1, 12], ['blue', 1, 3], ['blue', 1, 4]], 10, 14, text('แดง 1/3 + 1/12 ลิตร; น้ำเงิน 1/2 + 1/12 ลิตร', 'red 1/3 + 1/12 L; blue 1/2 + 1/12 L')),
]);
const findLevel = id => FRACTION_LEVELS.find(level => level.id === id);
const canEdit = state => !state.solved && !state.finished;
const feedback = (state, tone, message) => ({ tone, text: local(message, state.language), message });

export function createFractionQuest({ levelId = FRACTION_LEVELS[0].id, language = 'th', completedIds = [] } = {}) {
  const level = findLevel(levelId) || FRACTION_LEVELS[0];
  return {
    levelId: level.id, language: language === 'en' ? 'en' : 'th', model: clone(level.initial),
    history: [], hintCount: 0, solved: false, feedback: null, reasoning: null, finished: false,
    completedIds: [...new Set(Array.isArray(completedIds) ? completedIds.filter(id => findLevel(id)) : [])],
  };
}

export function currentFractionLevel(state) {
  const level = findLevel(state.levelId) || FRACTION_LEVELS[0];
  return {
    ...clone(level), title: local(level.title, state.language), prompt: local(level.prompt, state.language),
    chapterTitle: local(FRACTION_CHAPTERS.find(chapter => chapter.id === level.chapterId).title, state.language),
    hints: level.hints.map(hint => local(hint, state.language)),
    reasoning: { prompt: local(level.reasoning.prompt, state.language), options: level.reasoning.options.map(option => ({ id: option.id, label: local(option.label, state.language) })) },
  };
}

// Reconstruct used inventory instead of trusting a separately saved total.
function validModel(level, model) {
  if (!model || typeof model !== 'object') return false;
  if (level.kind === 'equivalent') return Number.isInteger(model.numerator) && model.numerator >= 0
    && FRACTION_DENOMINATORS.includes(model.denominator) && model.numerator <= model.denominator
    && model.numerator * level.initial.denominator === level.initial.numerator * model.denominator;
  if (!Array.isArray(model.used) || new Set(model.used).size !== model.used.length) return false;
  const inventory = level.kind === 'bridge' ? level.planks : level.doses;
  let ticks = 0, redTicks = 0, blueTicks = 0;
  for (const id of model.used) {
    const item = inventory.find(entry => entry.id === id);
    if (!item) return false;
    ticks += item.ticks;
    if (item.ingredient === 'red') redTicks += item.ticks;
    if (item.ingredient === 'blue') blueTicks += item.ticks;
  }
  if (ticks > level.capacityTicks) return false;
  return level.kind === 'bridge'
    ? Number.isInteger(model.ticks) && model.ticks === ticks && (!level.goal.requiredPlanks || model.used.length <= level.goal.requiredPlanks)
    : Number.isInteger(model.redTicks) && Number.isInteger(model.blueTicks) && model.redTicks === redTicks && model.blueTicks === blueTicks;
}

export function actFractionQuest(state, action) {
  const level = findLevel(state.levelId), before = state.model;
  if (!canEdit(state) || !level || !validModel(level, before) || !action || typeof action !== 'object') return state;
  let model;
  if (level.kind === 'bridge' && action.type === 'plank') {
    const plank = level.planks.find(item => item.id === action.plankId);
    if (!plank || before.used.includes(plank.id) || before.ticks + plank.ticks > level.capacityTicks
      || (level.goal.requiredPlanks && before.used.length >= level.goal.requiredPlanks)) return state;
    model = { ticks: before.ticks + plank.ticks, used: [...before.used, plank.id] };
  } else if (level.kind === 'equivalent' && ['split', 'merge'].includes(action.type) && [2, 3].includes(action.factor)) {
    model = action.type === 'split'
      ? { numerator: before.numerator * action.factor, denominator: before.denominator * action.factor }
      : { numerator: before.numerator / action.factor, denominator: before.denominator / action.factor };
    if (!validModel(level, model)) return state;
  } else if (level.kind === 'potion' && action.type === 'pour') {
    const dose = level.doses.find(item => item.id === action.doseId);
    if (!dose || before.used.includes(dose.id) || before.redTicks + before.blueTicks + dose.ticks > level.capacityTicks) return state;
    const key = dose.ingredient === 'red' ? 'redTicks' : 'blueTicks';
    model = { ...before, [key]: before[key] + dose.ticks, used: [...before.used, dose.id] };
  } else return state;
  return { ...state, model, history: [...state.history, clone(before)], feedback: null, reasoning: null };
}

export function undoFractionQuest(state) {
  if (!canEdit(state) || !state.history.length) return state;
  const model = state.history[state.history.length - 1];
  const level = findLevel(state.levelId);
  if (!level || !validModel(level, model)) return state;
  return { ...state, model: clone(model), history: state.history.slice(0, -1), feedback: null, reasoning: null };
}

export function resetFractionQuest(state) {
  const level = findLevel(state.levelId);
  if (state.finished || !level) return state;
  return { ...state, model: clone(level.initial), history: [], solved: false, feedback: null, reasoning: null };
}

export function hintFractionQuest(state) {
  const level = findLevel(state.levelId);
  if (!canEdit(state) || !level) return state;
  const hintCount = Math.min(level.hints.length, state.hintCount + 1);
  return { ...state, hintCount, feedback: feedback(state, 'hint', level.hints[hintCount - 1]) };
}

export function fractionGoalReached(state) {
  const level = findLevel(state.levelId), model = state.model;
  if (!level || !validModel(level, model)) return false;
  if (level.kind === 'equivalent') return model.denominator === level.goal.denominator;
  if (level.kind === 'bridge') return model.ticks === level.goal.targetTicks && (!level.goal.requiredPlanks || model.used.length === level.goal.requiredPlanks);
  return model.redTicks === level.goal.redTicks && model.blueTicks === level.goal.blueTicks;
}

export function checkFractionQuest(state) {
  const level = findLevel(state.levelId);
  if (!canEdit(state) || !level) return state;
  const solved = fractionGoalReached(state);
  const retry = level.kind === 'bridge'
    ? text(`ฝั่งอยู่ที่ ${fractionLabel(level.goal.targetTicks)} ลองเทียบช่องว่างและจำนวนแผ่นตามโจทย์ ย้อนกลับเพื่อนำแผ่นคืนได้`, `The shore is at ${fractionLabel(level.goal.targetTicks)}. Check the gap and requested plank count. Undo to return planks.`)
    : level.kind === 'equivalent'
      ? text(`รักษาพื้นที่เดิมแล้วเปลี่ยนตัวส่วนให้เป็น ${level.goal.denominator} โดยคูณหรือหารทั้งเศษและส่วนด้วยตัวเดียวกัน`, `Keep the same area and reach denominator ${level.goal.denominator}. Multiply or divide both counts by the same factor.`)
      : text(`ตรวจส่วนผสมแยกกัน: แดง ${fractionLabel(level.goal.redTicks)} ลิตร และน้ำเงิน ${fractionLabel(level.goal.blueTicks)} ลิตร ปริมาณรวมเท่ากันอย่างเดียวยังไม่ตรงสูตร`, `Check each ingredient: red ${fractionLabel(level.goal.redTicks)} L and blue ${fractionLabel(level.goal.blueTicks)} L. Matching only the total does not match the recipe.`);
  return { ...state, solved, feedback: feedback(state, solved ? 'success' : 'retry', solved ? text('สำเร็จแล้ว! ลองอธิบายเหตุผล หรือเดินทางต่อได้เลย', 'You did it! Explain your thinking or continue your journey.') : retry) };
}

export function answerFractionReasoning(state, optionId) {
  const reasoning = findLevel(state.levelId)?.reasoning;
  if (!state.solved || state.finished || !reasoning || !reasoning.options.some(option => option.id === optionId)) return state;
  const correct = optionId === reasoning.correctId;
  const message = correct ? reasoning.explanation : text(`ลองคิดอีกครั้ง: ${reasoning.explanation.th}`, `Think again: ${reasoning.explanation.en}`);
  return { ...state, reasoning: { selectedId: optionId, correct, feedback: local(message, state.language), message } };
}

export function nextFractionQuest(state) {
  if (!state.solved || state.finished || !fractionGoalReached(state)) return state;
  const completedIds = [...new Set([...state.completedIds, state.levelId])];
  const index = FRACTION_LEVELS.findIndex(level => level.id === state.levelId);
  if (index === FRACTION_LEVELS.length - 1) return { ...state, completedIds, finished: true };
  return createFractionQuest({ levelId: FRACTION_LEVELS[index + 1].id, language: state.language, completedIds });
}

// Display the common measuring unit of the fractions on the board. Internal
// 24-tick coordinates are an implementation detail, not a required unit.
function sumEquation(items, unit = '') {
  if (!items.length) return `0${unit}`;
  const label = (numerator, denominator) => `${denominator === 1 ? numerator : `${numerator}/${denominator}`}${unit}`;
  const denominator = items.reduce((common, item) => common / gcd(common, item.denominator) * item.denominator, 1);
  const numerators = items.map(item => item.numerator * (denominator / item.denominator));
  const total = numerators.reduce((sum, numerator) => sum + numerator, 0);
  const divisor = gcd(total, denominator);
  const original = items.map(item => label(item.numerator, item.denominator)).join(' + ');
  const common = numerators.map(numerator => label(numerator, denominator)).join(' + ');
  const result = label(total / divisor, denominator / divisor);
  const stages = [original];
  if (items.length > 1 && common !== original) stages.push(common);
  if (stages[stages.length - 1] !== result) stages.push(result);
  return stages.join(' = ');
}

export function equationFractionQuest(state) {
  const level = findLevel(state.levelId), model = state.model;
  if (!level || !validModel(level, model)) return '?';
  if (level.kind === 'equivalent') return `${level.initial.numerator}/${level.initial.denominator} = ${model.numerator}/${model.denominator}`;
  const inventory = level.kind === 'bridge' ? level.planks : level.doses;
  const used = model.used.map(id => inventory.find(item => item.id === id));
  if (level.kind === 'bridge') return sumEquation(used);
  const red = state.language === 'en' ? 'Red' : 'แดง';
  const blue = state.language === 'en' ? 'Blue' : 'น้ำเงิน';
  if (!used.length) return `${red} 0 L + ${blue} 0 L = 0 L`;
  const total = state.language === 'en' ? 'Total' : 'รวม';
  const ingredientAmounts = [model.redTicks, model.blueTicks].filter(ticks => ticks > 0).map(ticks => {
    const divisor = gcd(ticks, 24);
    return { numerator: ticks / divisor, denominator: 24 / divisor };
  });
  return `${red}: ${sumEquation(used.filter(item => item.ingredient === 'red'), ' L')}; ${blue}: ${sumEquation(used.filter(item => item.ingredient === 'blue'), ' L')}; ${total}: ${sumEquation(ingredientAmounts, ' L')}`;
}
