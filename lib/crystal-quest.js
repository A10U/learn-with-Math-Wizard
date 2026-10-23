// A small, untimed foundation path. All transitions return new values; callers
// own persistence and presentation. Completion records activity, not mastery.
const text = (th, en) => ({ th, en });
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const clone = value => JSON.parse(JSON.stringify(value));
const local = (value, language) => value[language === 'en' ? 'en' : 'th'];

export const CRYSTAL_CHAPTERS = freeze([
  { id: 'garden', title: text('สวนคริสตัล: เติมให้ครบสิบ', 'Crystal garden: make ten'), story: text('ย้ายเมล็ดแสงให้แปลงแรกครบสิบ แล้วสวนจะกลับมาส่องแสง', 'Move light seeds to fill the first ten-frame and bring the garden back to life.') },
  { id: 'bridges', title: text('สะพานแสง: เดินบนเส้นจำนวน', 'Light bridges: number-line paths'), story: text('เลือกบัตรก้าวสามใบเพื่อพาแสงข้ามสะพานไปถึงท่าเรือ', 'Choose three step tiles to carry the light across the bridge to the dock.') },
  { id: 'lighthouse', title: text('ประภาคาร: แลกหน่วยเป็นสิบ', 'Lighthouse: exchange ones and tens'), story: text('จัดแท่งสิบและเมล็ดหน่วยตามแบบ เพื่อเปิดแสงประภาคาร', 'Arrange tens rods and ones as requested to light the lighthouse.') },
]);

function frameLevel(id, left, right) {
  const total = left + right, missing = 10 - left;
  return {
    id: `garden-${id}`, chapterId: 'garden', kind: 'frames',
    title: text(`แปลงแสง ${id}: ${left} + ${right}`, `Light bed ${id}: ${left} + ${right}`),
    prompt: text('ย้ายเมล็ดแสงทีละหนึ่งระหว่างสองแปลง ให้แปลงแรกครบ 10 เมล็ด โดยจำนวนรวมเท่าเดิม', 'Move one light seed at a time between the two frames. Fill the first frame to 10 while keeping the total unchanged.'),
    initial: { left, right }, goal: { left: 10, right: total - 10 },
    hints: [text(`แปลงแรกมี ${left} เมล็ด ลองดูช่องว่างที่ยังเหลือ`, `The first frame has ${left} seeds. Look at its empty spaces.`), text(`แปลงแรกต้องการอีก ${missing} เมล็ด โดยนำมาจากแปลงที่สอง`, `The first frame needs ${missing} more seeds from the second frame.`), text(`${left} + ${right} = 10 + ${total - 10} จำนวนรวมยังเป็น ${total}`, `${left} + ${right} = 10 + ${total - 10}. The total is still ${total}.`)],
    reasoning: {
      prompt: text('ทำไมย้ายเมล็ดแล้วจำนวนรวมจึงเท่าเดิม?', 'Why does moving seeds keep the total the same?'),
      options: [
        { id: 'conserve', label: text('เมล็ดที่แปลงหนึ่งเพิ่ม คือเมล็ดที่อีกแปลงลด', 'One frame gains exactly what the other frame loses.') },
        { id: 'grow', label: text('เมล็ดเพิ่มขึ้นเองเมื่อแปลงแรกครบสิบ', 'Extra seeds appear when the first frame reaches ten.') },
        { id: 'discard', label: text('เราเอาเมล็ดส่วนที่เหลือออกจากสวน', 'We remove the leftover seeds from the garden.') },
      ], correctId: 'conserve',
      explanation: text(`ย้าย ${missing} เมล็ด: แปลงแรกเพิ่ม ${missing} แปลงที่สองลด ${missing} จึงยังมีทั้งหมด ${total}`, `Move ${missing} seeds: one frame gains ${missing} and the other loses ${missing}, so the total stays ${total}.`),
    },
  };
}

function routeLevel(id, start, target, values, max) {
  return {
    id: `bridges-${id}`, chapterId: 'bridges', kind: 'route',
    title: text(`สะพานที่ ${id}: จาก ${start} ไป ${target}`, `Bridge ${id}: from ${start} to ${target}`),
    prompt: text(`เริ่มที่ ${start} เลือกบัตรก้าว 3 ใบให้ถึง ${target} แต่ละใบใช้ได้ครั้งเดียว และต้องอยู่ระหว่าง 0–${max}`, `Start at ${start}. Use exactly 3 step tiles to reach ${target}. Use each tile at most once and stay between 0 and ${max}.`),
    initial: { position: start, used: [] }, goal: { target, requiredSteps: 3 },
    min: 0, max, requiredSteps: 3,
    steps: values.map((value, index) => ({ id: `step-${index + 1}`, value })),
    hints: [text('บัตรบวกพาไปทางขวา บัตรลบพาไปทางซ้าย', 'A positive tile moves right; a negative tile moves left.'), text(`จาก ${start} ถึง ${target} ต้องเปลี่ยนทั้งหมด ${target - start > 0 ? '+' : ''}${target - start} ลองรวมค่าบัตร 3 ใบ`, `From ${start} to ${target}, the total change must be ${target - start > 0 ? '+' : ''}${target - start}. Try adding three tile values.`), text(`ลองใช้บัตร ${values.slice(0, 3).map(value => value > 0 ? `+${value}` : String(value)).join(', ')} ตามลำดับ แล้วดูแต่ละจุดที่ผ่าน`, `Try ${values.slice(0, 3).map(value => value > 0 ? `+${value}` : String(value)).join(', ')} in that order and check every landing point.`)],
    reasoning: {
      prompt: text('บัตรก้าว −2 หมายถึงอะไรบนเส้นจำนวน?', 'What does a −2 step tile mean on the number line?'),
      options: [
        { id: 'left', label: text('เลื่อนไปทางซ้าย 2 ช่อง ค่าจึงลดลง 2', 'Move left 2 spaces, decreasing the value by 2.') },
        { id: 'right', label: text('เลื่อนไปทางขวา 2 ช่อง ค่าจึงเพิ่มขึ้น 2', 'Move right 2 spaces, increasing the value by 2.') },
        { id: 'zero', label: text('กลับไปที่ศูนย์ทุกครั้ง', 'Return to zero every time.') },
      ], correctId: 'left', explanation: text('ลบคือการลดค่า: เช่น จาก 6 ก้าว −2 จะถึง 4 เพราะ 6 − 2 = 4', 'Subtracting decreases the value: starting at 6, a −2 step reaches 4 because 6 − 2 = 4.'),
    },
  };
}

function bundleLevel(id, initial, goal) {
  return {
    id: `lighthouse-${id}`, chapterId: 'lighthouse', kind: 'bundle',
    title: text(`แสงประภาคาร ${id}: ${initial.tens * 10 + initial.ones}`, `Lighthouse beam ${id}: ${initial.tens * 10 + initial.ones}`),
    prompt: text(`จัดให้เป็น ${goal.tens} สิบ กับ ${goal.ones} หน่วย แลก 10 หน่วยเป็น 1 สิบ หรือแตก 1 สิบกลับเป็น 10 หน่วยได้ โดยค่ารวมคงเดิม`, `Make ${goal.tens} tens and ${goal.ones} ones. Exchange 10 ones for 1 ten, or split 1 ten into 10 ones, keeping the total unchanged.`),
    initial, goal,
    hints: [text('แท่งสิบหนึ่งแท่งมีค่าเท่ากับหน่วย 10 ก้อน', 'One tens rod has the same value as 10 ones.'), text(goal.tens > initial.tens ? 'นับหน่วยเป็นกลุ่มละ 10 แล้วแลกแต่ละกลุ่มเป็นแท่งสิบ' : 'แตกแท่งสิบหนึ่งแท่ง แล้วนับหน่วยที่เพิ่มมาอีก 10', goal.tens > initial.tens ? 'Group the ones into sets of 10 and exchange each group for a tens rod.' : 'Split a tens rod and count the 10 extra ones.'), text(`${goal.tens} × 10 + ${goal.ones} = ${initial.tens * 10 + initial.ones} ค่ารวมเท่าเดิม`, `${goal.tens} × 10 + ${goal.ones} = ${initial.tens * 10 + initial.ones}. The value is unchanged.`)],
    reasoning: {
      prompt: text('เมื่อแตกแท่งสิบ 1 แท่ง จะเกิดอะไรขึ้น?', 'What happens when you split 1 tens rod?'),
      options: [
        { id: 'equal', label: text('แท่งสิบลด 1 หน่วยเพิ่ม 10 ค่ารวมเท่าเดิม', 'Tens decrease by 1, ones increase by 10, and the value stays the same.') },
        { id: 'one', label: text('แท่งสิบลด 1 หน่วยเพิ่มเพียง 1', 'Tens decrease by 1 and ones increase by only 1.') },
        { id: 'lose', label: text('ค่ารวมลดลง 10', 'The total value decreases by 10.') },
      ], correctId: 'equal', explanation: text('1 สิบ = 10 หน่วย จึงเปลี่ยนแบบแทนจำนวนได้โดยไม่เพิ่มหรือลดค่า', '1 ten = 10 ones. We change the representation without changing the value.'),
    },
  };
}

export const CRYSTAL_LEVELS = freeze([
  frameLevel(1, 8, 6), frameLevel(2, 7, 5), frameLevel(3, 6, 7),
  routeLevel(1, 2, 8, [4, -1, 3, -2], 10),
  routeLevel(2, 8, 3, [-4, 2, -3, 1], 10),
  routeLevel(3, 4, 9, [4, -2, 3, -1], 12),
  bundleLevel(1, { tens: 0, ones: 23 }, { tens: 2, ones: 3 }),
  bundleLevel(2, { tens: 3, ones: 4 }, { tens: 2, ones: 14 }),
  bundleLevel(3, { tens: 1, ones: 25 }, { tens: 3, ones: 5 }),
]);
const findLevel = id => CRYSTAL_LEVELS.find(level => level.id === id);

export function createCrystalQuest({ levelId = CRYSTAL_LEVELS[0].id, language = 'th', completedIds = [] } = {}) {
  const level = findLevel(levelId) || CRYSTAL_LEVELS[0];
  return {
    levelId: level.id, language: language === 'en' ? 'en' : 'th',
    model: clone(level.initial), history: [], hintCount: 0, solved: false,
    feedback: null, reasoning: null, finished: false,
    completedIds: [...new Set(Array.isArray(completedIds) ? completedIds.filter(id => findLevel(id)) : [])],
  };
}

export function currentCrystalLevel(state) {
  const level = findLevel(state.levelId) || CRYSTAL_LEVELS[0];
  const language = state.language;
  return {
    ...clone(level), title: local(level.title, language), prompt: local(level.prompt, language),
    chapterTitle: local(CRYSTAL_CHAPTERS.find(chapter => chapter.id === level.chapterId).title, language),
    hints: level.hints.map(hint => local(hint, language)),
    reasoning: { prompt: local(level.reasoning.prompt, language), options: level.reasoning.options.map(option => ({ id: option.id, label: local(option.label, language) })) },
  };
}

const feedback = (state, tone, message) => ({ tone, text: local(message, state.language), message });
const canEdit = state => !state.solved && !state.finished;

export function actCrystalQuest(state, action) {
  if (!canEdit(state) || !action || typeof action !== 'object') return state;
  const level = findLevel(state.levelId), before = state.model;
  if (!level) return state;
  let model;
  if (level.kind === 'frames' && action.type === 'move' && ['left', 'right'].includes(action.from)) {
    const to = action.from === 'left' ? 'right' : 'left';
    if (before[action.from] < 1 || before[to] >= 10) return state;
    model = { ...before, [action.from]: before[action.from] - 1, [to]: before[to] + 1 };
  } else if (level.kind === 'route' && action.type === 'step') {
    const step = level.steps.find(item => item.id === action.stepId);
    if (!step || before.used.includes(step.id) || before.used.length >= level.requiredSteps) return state;
    const position = before.position + step.value;
    if (position < level.min || position > level.max) return state;
    model = { position, used: [...before.used, step.id] };
  } else if (level.kind === 'bundle' && action.type === 'bundle' && before.ones >= 10 && before.tens < 9) {
    model = { tens: before.tens + 1, ones: before.ones - 10 };
  } else if (level.kind === 'bundle' && action.type === 'unbundle' && before.tens >= 1 && before.ones <= 89) {
    model = { tens: before.tens - 1, ones: before.ones + 10 };
  } else return state;
  return { ...state, model, history: [...state.history, clone(before)], feedback: null, reasoning: null };
}

export function undoCrystalQuest(state) {
  if (!canEdit(state) || !state.history.length) return state;
  return { ...state, model: clone(state.history[state.history.length - 1]), history: state.history.slice(0, -1), feedback: null, reasoning: null };
}

export function resetCrystalQuest(state) {
  if (state.finished) return state;
  return { ...state, model: clone(findLevel(state.levelId).initial), history: [], solved: false, feedback: null, reasoning: null };
}

export function hintCrystalQuest(state) {
  if (state.finished || state.solved) return state;
  const level = findLevel(state.levelId);
  const hintCount = Math.min(level.hints.length, state.hintCount + 1);
  return { ...state, hintCount, feedback: feedback(state, 'hint', level.hints[hintCount - 1]) };
}

// Check the model's mathematical meaning as well as its requested arrangement.
// The conservation checks also prevent equal-looking but invalid save data from
// being accepted by a controller that restores an externally supplied board.
export function crystalGoalReached(state) {
  const level = findLevel(state.levelId), model = state.model;
  if (!level || !model) return false;
  if (level.kind === 'frames') return [model.left, model.right].every(n => Number.isInteger(n) && n >= 0 && n <= 10)
    && model.left === level.goal.left && model.right === level.goal.right
    && model.left + model.right === level.initial.left + level.initial.right;
  if (level.kind === 'bundle') return [model.tens, model.ones].every(n => Number.isInteger(n) && n >= 0)
    && model.tens === level.goal.tens && model.ones === level.goal.ones
    && model.tens * 10 + model.ones === level.initial.tens * 10 + level.initial.ones;
  if (!Array.isArray(model.used) || model.used.length !== level.requiredSteps || new Set(model.used).size !== model.used.length) return false;
  let position = level.initial.position;
  for (const id of model.used) {
    const step = level.steps.find(item => item.id === id);
    if (!step) return false;
    position += step.value;
    if (position < level.min || position > level.max) return false;
  }
  return position === level.goal.target && model.position === position;
}

export function checkCrystalQuest(state) {
  if (!canEdit(state)) return state;
  const solved = crystalGoalReached(state);
  const level = findLevel(state.levelId);
  const retry = level.kind === 'frames'
    ? text('จำนวนรวมยังต้องเท่าเดิม และแปลงแรกต้องครบ 10 ลองดูช่องว่างแล้วขยับเมล็ดอีกครั้ง', 'Keep the total unchanged and fill the first frame to 10. Look at the empty spaces and try moving seeds again.')
    : level.kind === 'route'
      ? text(`ตอนนี้อยู่ที่ ${state.model.position} ใช้บัตรแล้ว ${state.model.used.length} ใบ เป้าหมายคือ ${level.goal.target} ด้วยบัตร 3 ใบ ลองย้อนก้าวหรือเริ่มใหม่ได้`, `You are at ${state.model.position} after ${state.model.used.length} tiles. Reach ${level.goal.target} using 3 tiles. You can undo a step or reset.`)
      : text(`ค่ารวมเท่าเดิมแล้ว ลองจัดให้เป็น ${level.goal.tens} สิบ กับ ${level.goal.ones} หน่วยตามแบบ`, `The value is unchanged. Try arranging ${level.goal.tens} tens and ${level.goal.ones} ones as requested.`);
  return { ...state, solved, feedback: feedback(state, solved ? 'success' : 'retry', solved ? text('ช่วยโลกคริสตัลสำเร็จ! ลองเล่าเหตุผล หรือเดินทางต่อได้เลย', 'The crystal world is restored! Explain your thinking or continue your journey.') : retry) };
}

export function answerCrystalReasoning(state, optionId) {
  if (!state.solved || state.finished) return state;
  const reasoning = findLevel(state.levelId).reasoning;
  if (!reasoning.options.some(option => option.id === optionId)) return state;
  const correct = optionId === reasoning.correctId;
  const message = correct ? reasoning.explanation : text(`ลองคิดอีกครั้ง: ${reasoning.explanation.th}`, `Think again: ${reasoning.explanation.en}`);
  return { ...state, reasoning: { selectedId: optionId, correct, feedback: local(message, state.language), message } };
}

export function nextCrystalQuest(state) {
  if (!state.solved || state.finished) return state;
  const completedIds = [...new Set([...state.completedIds, state.levelId])];
  const index = CRYSTAL_LEVELS.findIndex(level => level.id === state.levelId);
  if (index === CRYSTAL_LEVELS.length - 1) return { ...state, completedIds, finished: true };
  return createCrystalQuest({ levelId: CRYSTAL_LEVELS[index + 1].id, language: state.language, completedIds });
}

export function equationCrystalQuest(state) {
  const level = findLevel(state.levelId), model = state.model;
  if (level.kind === 'frames') return `${level.initial.left} + ${level.initial.right} = ${model.left} + ${model.right} = ${model.left + model.right}`;
  if (level.kind === 'bundle') return `${model.tens} × 10 + ${model.ones} = ${model.tens * 10 + model.ones}`;
  return `${level.initial.position}${model.used.map(id => { const value = level.steps.find(step => step.id === id).value; return value >= 0 ? ` + ${value}` : ` − ${Math.abs(value)}`; }).join('')} = ${model.position}`;
}
