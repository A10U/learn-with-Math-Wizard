// Deterministic learning rules. Potions use integer quarter-litres throughout.
const text = (th, en) => ({ th, en });
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const emptyStock = () => ({ single: 0, bundle: 0, half: 0, quarter: 0 });

export const MAGIC_SHOP_CHAPTERS = freeze([
  { id: 'marbles', symbol: '●', title: text('ลูกแก้ววิเศษ', 'Magic marbles'), description: text('นับ รวมกลุ่ม และแบ่งลูกแก้วเพื่อช่วยเพื่อนในหมู่บ้าน', 'Count, group and share marbles to help your village friends.') },
  { id: 'potions', symbol: '½', title: text('ร้านยาวิเศษ', 'Potion workshop'), description: text('ตวง แบ่ง และผสมน้ำยา โดยปริมาณรวมยังเท่าเดิม', 'Measure, split and mix potions without changing the total amount.') },
  { id: 'spells', symbol: '✧', title: text('คาถาตัวเลข', 'Number spells'), description: text('เลือกอักษรรูน ลากรูปทรง และค้นหาค่าของตัวแปรเพื่อร่ายเวท', 'Choose runes, trace shapes and discover unknown values to cast spells.') },
]);

export const MAGIC_SHOP_LEVELS = freeze([
  { id: 'marbles-1', chapter: 'marbles', kind: 'marbles', targets: [5], stock: { single: 8 }, bundleSize: 5,
    title: text('แสงแรกของลูกแก้ว', 'The first glow'), story: text('นกฮูกผู้ดูแลประภาคารต้องการลูกแก้ว 5 ลูก เพื่อจุดแสงนำทาง', 'The lighthouse owl needs 5 marbles to light the way.'), goal: text('ใส่ลูกแก้วให้นกฮูก 5 ลูก', 'Give the owl exactly 5 marbles.'), hint: text('แตะลูกแก้วทีละลูก แล้วนับ 1, 2, 3, 4, 5', 'Add one marble at a time and count 1, 2, 3, 4, 5.'), success: text('ลูกแก้ว 5 ลูก ส่องแสงให้ประภาคารแล้ว!', 'Five marbles have lit the lighthouse!') },
  { id: 'marbles-2', chapter: 'marbles', kind: 'marbles', targets: [8], stock: { single: 12 }, bundleSize: 5,
    title: text('โคมไฟหิ่งห้อย', 'Firefly lantern'), story: text('นกฮูกกำลังสร้างโคมไฟ และขอลูกแก้ว 8 ลูกจากร้านของเรา', 'The owl is building a lantern and asks your shop for 8 marbles.'), goal: text('จัดลูกแก้วให้ครบ 8 ลูก', 'Prepare exactly 8 marbles.'), hint: text('นับทีละลูก เมื่อถึง 5 แล้วนับต่ออีก 3 ลูก', 'Count one at a time: after 5, count 3 more.'), success: text('8 ลูกพอดี โคมไฟพร้อมออกเดินทาง!', 'Exactly 8! The lantern is ready for its journey.') },
  { id: 'marbles-3', chapter: 'marbles', kind: 'marbles', targets: [3, 4], stock: { single: 10 }, bundleSize: 5,
    title: text('ออร์เดอร์สองสหาย', 'Two friends, two orders'), story: text('นกฮูกขอ 3 ลูก ส่วนจิ้งจอกขอ 4 ลูก ลองเตรียมให้ครบทั้งคู่', 'The owl needs 3 and the fox needs 4. Prepare both orders.'), goal: text('จัดให้เพื่อนคนแรก 3 ลูก และคนที่สอง 4 ลูก', 'Give the first friend 3 marbles and the second friend 4.'), hint: text('เลือกเพื่อนก่อนหยิบลูกแก้ว: 3 + 4 ใช้ทั้งหมด 7 ลูก', 'Choose a friend before adding marbles: 3 + 4 uses 7 altogether.'), success: text('สองออร์เดอร์ครบแล้ว 3 + 4 = 7!', 'Both orders are ready: 3 + 4 = 7!') },
  { id: 'marbles-4', chapter: 'marbles', kind: 'marbles', targets: [12], stock: { single: 4, bundle: 2 }, bundleSize: 5,
    title: text('ถุงละห้าลูก', 'Bags of five'), story: text('นกฮูกต้องการ 12 ลูก เรามีถุงละ 5 ลูก และลูกแก้วแยกอีก 4 ลูก', 'The owl needs 12 marbles. You have two bags of 5 and 4 loose marbles.'), goal: text('ใช้ลูกแก้วจากถุงและลูกแยก รวมให้ได้ 12 ลูก', 'Use bags and loose marbles to make exactly 12.'), hint: text('5 + 5 + 2 = 12 จะเปิดถุงเพื่อดูทั้ง 5 ลูกก็ได้', '5 + 5 + 2 = 12. You can also open a bag to see its 5 marbles.'), success: text('จัดกลุ่มครบ 12 ลูก พร้อมส่งให้นกฮูก!', 'Twelve marbles are packed and ready for the owl!') },
  { id: 'marbles-5', chapter: 'marbles', kind: 'marbles', targets: [4, 4, 4], stock: { single: 12 }, bundleSize: 5,
    title: text('แบ่งแสงให้เท่ากัน', 'Share the glow equally'), story: text('เพื่อน 3 คนช่วยกันซ่อมหมู่บ้าน แบ่งลูกแก้ว 12 ลูกให้คนละเท่ากัน', 'Three friends are repairing the village. Share 12 marbles equally.'), goal: text('แบ่งให้เพื่อน 3 คน คนละ 4 ลูก', 'Give each of the 3 friends exactly 4 marbles.'), hint: text('เลือกเพื่อนทีละคน แล้วแบ่งให้คนละ 4 ลูก: 12 ÷ 3 = 4', 'Give each friend 4 marbles: 12 ÷ 3 = 4.'), success: text('ทุกคนได้คนละ 4 ลูก หมู่บ้านกลับมาสว่างแล้ว!', 'Everyone has 4 marbles. The village glows again!') },
  { id: 'potion-1', chapter: 'potions', kind: 'potion', targets: [4], capacity: 4, stock: { half: 1, quarter: 2 },
    title: text('น้ำยาแสงดาว', 'Starlight potion'), story: text('นกฮูกขอน้ำยา 1 ลิตร เพื่อนำแสงกลับสู่สวน', 'The owl needs 1 litre of potion to bring light back to the garden.'), goal: text('ผสมน้ำยาให้ครบ 1 ลิตร', 'Mix exactly 1 litre.'), hint: text('ครึ่งลิตร + หนึ่งในสี่ลิตร + หนึ่งในสี่ลิตร = 1 ลิตร', '½ litre + ¼ litre + ¼ litre = 1 litre.'), success: text('1 ลิตรพอดี สวนเริ่มเปล่งแสงแล้ว!', 'Exactly 1 litre! The garden is glowing again.') },
  { id: 'potion-2', chapter: 'potions', kind: 'potion', targets: [3], capacity: 4, stock: { half: 2, quarter: 2 },
    title: text('น้ำยาปีกเบา', 'Light-wing potion'), story: text('นกฮูกต้องการน้ำยา ¾ ลิตร เพื่อช่วยฝูงนกบินกลับบ้าน', 'The owl needs ¾ litre to help the birds fly home.'), goal: text('ตวงน้ำยา ¾ ลิตร', 'Measure exactly ¾ litre.'), hint: text('½ ลิตรเท่ากับ 2 ใน 4 ลิตร เติมอีก ¼ ลิตรจะครบ ¾', '½ is 2 quarters. Add ¼ to make ¾ litre.'), success: text('½ + ¼ = ¾ ฝูงนกพร้อมกลับบ้าน!', '½ + ¼ = ¾. The birds are ready to fly home!') },
  { id: 'potion-3', chapter: 'potions', kind: 'potion', targets: [3, 3], capacity: 4, stock: { half: 3 },
    title: text('แบ่งให้สองสหาย', 'A potion for two'), story: text('สองสหายต้องการคนละ ¾ ลิตร เรามีแต่น้ำยาถ้วยละครึ่งลิตร', 'Two friends each need ¾ litre. All your cups contain ½ litre.'), goal: text('แบ่งให้เพื่อนสองคน คนละ ¾ ลิตร', 'Give each friend exactly ¾ litre.'), hint: text('แยกถ้วย ½ ลิตรเป็น ¼ ลิตรสองถ้วย ปริมาณรวมยังเท่าเดิม', 'Split a ½-litre cup into two ¼-litre cups. The total stays the same.'), success: text('ทั้งสองคนได้ ¾ ลิตร รวมกัน 1½ ลิตร!', 'Both friends have ¾ litre, making 1½ litres altogether!') },
  { id: 'potion-4', chapter: 'potions', kind: 'potion', targets: [1, 3], capacity: 4, stock: { half: 2 },
    title: text('ขวดเล็กขวดใหญ่', 'Small bottle, big bottle'), story: text('นกฮูกขอ ¼ ลิตร และจิ้งจอกขอ ¾ ลิตร ช่วยเตรียมให้พอดี', 'The owl needs ¼ litre and the fox needs ¾ litre. Prepare both bottles.'), goal: text('แบ่งน้ำยาเป็น ¼ ลิตร และ ¾ ลิตร', 'Prepare ¼ litre and ¾ litre.'), hint: text('แยก ½ ลิตรหนึ่งถ้วย แล้วแบ่ง ¼ ให้ขวดเล็ก อีก ¼ รวมกับ ½ ให้ขวดใหญ่', 'Split one half. Give a quarter to the small bottle, then add the other quarter to a half.'), success: text('¼ + ¾ = 1 ลิตร แบ่งได้พอดีทั้งสองขวด!', '¼ + ¾ = 1 litre. Both bottles are filled perfectly!') },
  { id: 'potion-5', chapter: 'potions', kind: 'potion', targets: [3, 3, 2], capacity: 4, stock: { half: 4 },
    title: text('น้ำยาเพื่อทั้งหมู่บ้าน', 'Potion for the village'), story: text('น้ำยา 2 ลิตรต้องแบ่งให้สามสหาย: ¾ ลิตร, ¾ ลิตร และ ½ ลิตร', 'Share 2 litres among three friends: ¾ litre, ¾ litre and ½ litre.'), goal: text('เตรียมออร์เดอร์ ¾, ¾ และ ½ ลิตรให้ครบ', 'Complete the ¾, ¾ and ½-litre orders.'), hint: text('ใช้ถ้วย ½ ลิตรสามถ้วย แล้วแยกถ้วยสุดท้ายเป็น ¼ สองถ้วย', 'Use three half-litre cups and split the last half into two quarters.'), success: text('¾ + ¾ + ½ = 2 ลิตร ส่งความช่วยเหลือครบทั้งหมู่บ้าน!', '¾ + ¾ + ½ = 2 litres. The whole village has been helped!') },
  { id: 'spells-1', chapter: 'spells', kind: 'rune-sum', runes: [2, 3, 4, 6], target: 7, maxRunes: 2,
    title: text('รูนเปิดประตู', 'Gate-opening runes'), story: text('ประตูสวนเวทมนตร์เปิดเมื่อรูนสองชิ้นมีพลังรวม 7', 'The enchanted garden gate opens when two runes have a total power of 7.'), goal: text('เลือกรูนต่างกัน 2 ชิ้น ให้รวมได้ 7', 'Choose 2 different runes that add up to 7.'), hint: text('ลองเริ่มจาก 3 แล้วหาอีกจำนวนที่ทำให้ครบ 7', 'Start with 3 and find the number that completes 7.'), success: text('3 + 4 = 7 ประตูเวทมนตร์เปิดแล้ว!', '3 + 4 = 7. The magic gate is open!') },
  { id: 'spells-2', chapter: 'spells', kind: 'shape', symbol: 'triangle', points: [{ x: 50, y: 12, label: 'A' }, { x: 88, y: 85, label: 'B' }, { x: 12, y: 85, label: 'C' }], edges: [[0, 1], [1, 2], [2, 0]],
    title: text('คาถาสามเหลี่ยม', 'Triangle spell'), story: text('เชื่อมดวงดาวทั้งสามให้เป็นสามเหลี่ยม เพื่อกางเกราะป้องกันสวน', 'Connect the three stars into a triangle to shield the garden.'), goal: text('เชื่อมครบ 3 ด้าน แล้วกลับมาปิดรูปที่จุดเริ่มต้น', 'Connect all 3 sides and close the shape at the starting point.'), hint: text('เริ่มที่ A แล้วแตะ B, C และ A อีกครั้ง จะเดินย้อนทิศก็ได้', 'Start at A, then tap B, C and A again. Either direction works.'), success: text('สามเหลี่ยมมี 3 ด้าน เกราะเวทมนตร์พร้อมแล้ว!', 'A triangle has 3 sides. The magic shield is ready!') },
  { id: 'spells-3', chapter: 'spells', kind: 'shape', symbol: 'square', points: [{ x: 18, y: 18, label: 'A' }, { x: 82, y: 18, label: 'B' }, { x: 82, y: 82, label: 'C' }, { x: 18, y: 82, label: 'D' }], edges: [[0, 1], [1, 2], [2, 3], [3, 0]],
    title: text('คาถาสี่เหลี่ยมจัตุรัส', 'Square spell'), story: text('เชื่อมดาวรอบขอบสี่เหลี่ยมจัตุรัส เพื่อสร้างสะพานให้เพื่อนข้ามลำธาร', 'Connect the stars around the square to build a bridge over the stream.'), goal: text('เชื่อมรอบขอบครบ 4 ด้าน แล้วปิดรูป โดยไม่ตัดผ่านกลาง', 'Trace all 4 outer sides and close the shape without crossing the middle.'), hint: text('ลอง A → B → C → D → A เส้นทแยงมุมไม่ใช่ด้านของรูป', 'Try A → B → C → D → A. Diagonals are not sides of this square.'), success: text('ครบ 4 ด้านเท่ากัน สะพานสี่เหลี่ยมจัตุรัสปรากฏแล้ว!', 'Four equal sides! The square bridge has appeared!') },
  { id: 'spells-4', chapter: 'spells', kind: 'variable', symbol: 'x', coefficient: 1, constant: 3, answer: 4, choices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    title: text('พลังที่ซ่อนอยู่', 'The hidden power'), story: text('เครื่องรางมีพลังอยู่ x หน่วย เมื่อเติมอีก 3 หน่วย จะมีพลังรวม 7', 'A charm holds x units of power. Adding 3 gives it a total power of 7.'), goal: text('หาค่าของ x ใน x + 3 = 7', 'Find x in x + 3 = 7.'), hint: text('ตัวแปรแทนจำนวนที่ยังไม่รู้ ลองคิดว่า 7 เอาออก 3 เหลือเท่าไร', 'A variable stands for an unknown number. What is left when you take 3 away from 7?'), success: text('x = 4 เพราะ 4 + 3 = 7 เครื่องรางตื่นขึ้นแล้ว!', 'x = 4 because 4 + 3 = 7. The charm is awake!') },
  { id: 'spells-5', chapter: 'spells', kind: 'variable', symbol: 'y', coefficient: 2, constant: 0, answer: 5, choices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    title: text('คาถาคู่พิทักษ์', 'Twin-guardian spell'), story: text('เครื่องรางสองชิ้นมีพลังเท่ากัน รวมกันได้ 10 หน่วย แต่ละชิ้นมีพลังเท่าไร', 'Two charms hold equal power. Their total is 10. How much power is in each charm?'), goal: text('หาค่าของ y ใน 2 × y = 10', 'Find y in 2 × y = 10.'), hint: text('2 × y คือ y + y แบ่งพลัง 10 หน่วยให้สองส่วนเท่ากัน', '2 × y means y + y. Share 10 power units into two equal parts.'), success: text('y = 5 เพราะ 2 × 5 = 10 คู่พิทักษ์พร้อมดูแลหมู่บ้าน!', 'y = 5 because 2 × 5 = 10. The twin guardians are ready!') },
]);

const levelsById = new Map(MAGIC_SHOP_LEVELS.map(level => [level.id, level]));
export const getMagicShopLevel = id => levelsById.get(id) || null;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const whole = value => Number.isInteger(value) && value >= 0;
const amount = (level, stock) => level.kind === 'marbles' ? stock.single + stock.bundle * level.bundleSize : stock.half * 2 + stock.quarter;
const equal = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);

export function createMagicShopState(levelId = MAGIC_SHOP_LEVELS[0].id) {
  const level = getMagicShopLevel(levelId);
  if (!level) throw new RangeError('Choose a supported magic shop level');
  return { levelId, selected: 0, filled: level.targets ? level.targets.map(() => 0) : [], stock: { ...emptyStock(), ...level.stock }, runes: [], path: [], value: null };
}

/** Validate resumable data, including conservation and inactive fields. */
export function isMagicShopStateValid(state) {
  if (!isObject(state)) return false;
  const level = getMagicShopLevel(state.levelId);
  if (!level || !whole(state.selected) || !Array.isArray(state.filled) || !Array.isArray(state.runes) || !Array.isArray(state.path) || !isObject(state.stock)) return false;
  if (Object.keys(state.stock).length !== 4 || !Object.keys(emptyStock()).every(key => whole(state.stock[key]) && state.stock[key] <= 64)) return false;
  if (level.targets) {
    if (state.selected >= level.targets.length || state.filled.length !== level.targets.length || !state.filled.every(value => whole(value) && value <= (level.capacity || 64))) return false;
    if (state.runes.length || state.path.length || state.value !== null) return false;
    const initial = { ...emptyStock(), ...level.stock };
    if (level.kind === 'marbles') {
      if (state.stock.half || state.stock.quarter || state.stock.bundle > Math.floor(amount(level, initial) / level.bundleSize) || state.stock.single > amount(level, initial)) return false;
    } else if (state.stock.single || state.stock.bundle || state.stock.half > initial.half || state.stock.quarter > initial.quarter + initial.half * 2) return false;
    return amount(level, state.stock) + state.filled.reduce((sum, value) => sum + value, 0) === amount(level, initial);
  }
  if (state.selected !== 0 || state.filled.length || Object.values(state.stock).some(value => value !== 0)) return false;
  if (level.kind === 'rune-sum') return state.path.length === 0 && state.value === null && state.runes.length <= level.maxRunes && new Set(state.runes).size === state.runes.length && state.runes.every(index => whole(index) && index < level.runes.length);
  if (level.kind === 'shape') return state.runes.length === 0 && state.value === null && state.path.length <= level.points.length + 1 && state.path.every(index => whole(index) && index < level.points.length);
  return state.runes.length === 0 && state.path.length === 0 && (state.value === null || level.choices.includes(state.value));
}

/** Apply one move without mutating any previous state. Invalid moves are no-ops. */
export function applyMagicShopAction(state, action) {
  if (!isMagicShopStateValid(state) || !isObject(action)) return state;
  const level = getMagicShopLevel(state.levelId);
  if (action.type === 'select' && level.targets && whole(action.index) && action.index < state.filled.length && action.index !== state.selected) return { ...state, selected: action.index };
  if (action.type === 'add' && level.targets) {
    const weights = level.kind === 'marbles' ? { single: 1, bundle: level.bundleSize } : { half: 2, quarter: 1 };
    if (!Object.hasOwn(weights, action.token) || state.stock[action.token] < 1) return state;
    const next = state.filled[state.selected] + weights[action.token];
    if (level.capacity && next > level.capacity) return state;
    return { ...state, stock: { ...state.stock, [action.token]: state.stock[action.token] - 1 }, filled: state.filled.map((value, index) => index === state.selected ? next : value) };
  }
  if (action.type === 'split') {
    if (level.kind === 'marbles' && action.token === 'bundle' && state.stock.bundle > 0) return { ...state, stock: { ...state.stock, bundle: state.stock.bundle - 1, single: state.stock.single + level.bundleSize } };
    if (level.kind === 'potion' && action.token === 'half' && state.stock.half > 0) return { ...state, stock: { ...state.stock, half: state.stock.half - 1, quarter: state.stock.quarter + 2 } };
  }
  if (action.type === 'pack' && level.kind === 'marbles' && action.token === 'bundle' && state.stock.single >= level.bundleSize) return { ...state, stock: { ...state.stock, single: state.stock.single - level.bundleSize, bundle: state.stock.bundle + 1 } };
  if (level.kind === 'rune-sum' && whole(action.index) && action.index < level.runes.length) {
    if (action.type === 'chooseRune' && !state.runes.includes(action.index) && state.runes.length < level.maxRunes) return { ...state, runes: [...state.runes, action.index] };
    if (action.type === 'removeRune' && state.runes.includes(action.index)) return { ...state, runes: state.runes.filter(index => index !== action.index) };
  }
  if (level.kind === 'shape') {
    if (action.type === 'vertex' && whole(action.index) && action.index < level.points.length && state.path.length < level.points.length + 1) return { ...state, path: [...state.path, action.index] };
    if (action.type === 'removeVertex' && state.path.length) return { ...state, path: state.path.slice(0, -1) };
    if (action.type === 'resetPath' && state.path.length) return { ...state, path: [] };
  }
  if (level.kind === 'variable' && action.type === 'setValue' && level.choices.includes(action.value) && action.value !== state.value) return { ...state, value: action.value };
  return state;
}

const edgeKey = (a, b) => [a, b].sort((x, y) => x - y).join(':');
export function isMagicShopSolved(state) {
  if (!isMagicShopStateValid(state)) return false;
  const level = getMagicShopLevel(state.levelId);
  if (level.targets) return equal(state.filled, level.targets);
  if (level.kind === 'rune-sum') return state.runes.length === level.maxRunes && state.runes.reduce((sum, index) => sum + level.runes[index], 0) === level.target;
  if (level.kind === 'variable') return state.value !== null && level.coefficient * state.value + level.constant === level.coefficient * level.answer + level.constant;
  if (state.path.length !== level.points.length + 1 || state.path[0] !== state.path.at(-1) || new Set(state.path.slice(0, -1)).size !== level.points.length) return false;
  const edges = state.path.slice(1).map((point, index) => edgeKey(state.path[index], point));
  const wanted = new Set(level.edges.map(([a, b]) => edgeKey(a, b)));
  return edges.length === wanted.size && new Set(edges).size === wanted.size && edges.every(edge => wanted.has(edge));
}

export function getMagicShopMath(state, language = 'th') {
  if (!isMagicShopStateValid(state)) return '';
  const level = getMagicShopLevel(state.levelId), en = language === 'en';
  if (level.kind === 'marbles') return `${state.filled.join(' + ')} = ${state.filled.reduce((sum, value) => sum + value, 0)} ${en ? 'marbles' : 'ลูก'}`;
  const fraction = units => ['0', '¼', '½', '¾', '1'][units];
  if (level.kind === 'potion') return state.filled.map((units, index) => `${en ? 'Bottle' : 'ขวด'} ${index + 1}: ${fraction(units)} / ${fraction(level.targets[index])} ${en ? 'L' : 'ลิตร'}`).join(' · ');
  if (level.kind === 'rune-sum') return `${state.runes.length ? `${state.runes.map(index => level.runes[index]).join(' + ')} = ${state.runes.reduce((sum, index) => sum + level.runes[index], 0)}` : '? + ?'} (${en ? 'target' : 'เป้าหมาย'} ${level.target})`;
  if (level.kind === 'shape') return `${state.path.length ? state.path.map(index => level.points[index].label).join(' → ') : (en ? 'Choose a starting star' : 'เลือกดาวเริ่มต้น')} · ${Math.max(0, state.path.length - 1)}/${level.edges.length} ${en ? 'segments' : 'เส้น'}`;
  const variable = state.value === null ? level.symbol : state.value;
  const left = `${level.coefficient === 1 ? '' : `${level.coefficient} × `}${variable}${level.constant ? ` + ${level.constant}` : ''}`;
  const target = level.coefficient * level.answer + level.constant;
  return `${left} ${state.value === null || level.coefficient * state.value + level.constant === target ? '=' : '≠'} ${target}${state.value === null ? '' : ` · ${level.symbol} = ${state.value}`}`;
}
