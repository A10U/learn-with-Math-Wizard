// Authored encounters for the seven campaigns following the original forest.
// Every localized stage keeps the same IDs, constraints and mathematical answers.
import { createQuestionRound, GRADE_PROFILES } from './questions.js';
import { createMoonMazeStages } from './moon-maze.js';
import { createStarExpanseStages } from './star-expanse.js';

export const CAMPAIGN_DETAILS = Object.freeze([
  { id: 'forest', icon: '🌳', title: { th: 'เดินป่าแห่งตัวเลข', en: 'Number Forest' }, story: { th: 'วางแผนเส้นทาง สร้างสะพาน และแบ่งเสบียงเพื่อช่วยเพื่อนในป่า', en: 'Plan trails, build a bridge and share supplies to help your forest friends.' }, stageCount: 5, limitMs: 180000, version: 'forest-v1', rulesVersion: 'forest-rules-v1', requires: [] },
  { id: 'cave', icon: '💎', title: { th: 'สำรวจถ้ำคริสตัล', en: 'Crystal Cave' }, story: { th: 'เติมแสง ฟังเสียงสะท้อน และหาเส้นทางออกจากถ้ำคริสตัล', en: 'Manage light, read echoes and map your way out of the crystal cave.' }, stageCount: 5, limitMs: 180000, version: 'cave-v1', rulesVersion: 'cave-rules-v1', requires: [{ campaign: 'forest', cleared: 5 }] },
  { id: 'ruins', icon: '🏛️', title: { th: 'สำรวจซากโบราณ', en: 'Ancient Ruins' }, story: { th: 'ประกอบจารึก ตรวจหลักฐาน และคืนชิ้นส่วนให้นครโบราณ', en: 'Reconstruct inscriptions, test evidence and restore the ancient city.' }, stageCount: 5, limitMs: 180000, version: 'ruins-v1', rulesVersion: 'ruins-rules-v1', requires: [{ campaign: 'cave', cleared: 5 }] },
  { id: 'castle', icon: '🏰', title: { th: 'ตะลุยปราสาทปริศนา', en: 'Puzzle Castle' }, story: { th: 'เติมน้ำหนักให้เครื่องจักร เปิดสวิตช์ตามลำดับ และส่งพลังให้ประตูปราสาท', en: 'Balance machines, sequence switches and power the castle gates.' }, stageCount: 5, limitMs: 180000, version: 'castle-v1', rulesVersion: 'castle-rules-v1', requires: [{ campaign: 'ruins', cleared: 5 }] },
  { id: 'tower', icon: '🗼', title: { th: 'ตะลุยหอคอย 100 ชั้น', en: '100-Floor Tower' }, story: { th: 'สำรวจห้องปริศนา 100 ชั้น แบ่งเป็น 10 เขต พบผู้พิทักษ์ทุก 10 ชั้น และบันทึกความคืบหน้าทุกชั้นที่ผ่าน', en: 'Climb 100 puzzle rooms across 10 chapters, with a guardian every 10 floors and a checkpoint after each cleared floor.' }, stageCount: 100, chapterSize: 10, chapterCount: 10, limitMs: 600000, version: 'tower-v1', rulesVersion: 'tower-rules-v1', requires: [{ campaign: 'castle', cleared: 5 }] },
  { id: 'coven', icon: '🧙', title: { th: 'ชุมนุมพ่อมดแม่มด', en: 'Wizard Gathering' }, story: { th: 'แลกของ ปรุงยา เรียงคาถา และแบ่งของให้เพื่อนในงานเทศกาล', en: 'Trade, mix potions, arrange spells and supply a magical festival.' }, stageCount: 5, limitMs: 180000, version: 'coven-v1', rulesVersion: 'coven-rules-v1', requires: [{ campaign: 'castle', cleared: 5 }] },
  { id: 'rift', icon: '🌀', title: { th: 'ปราบฝูงปีศาจต่างมิติ', en: 'Defend the Rift' }, story: { th: 'แบ่งพลังให้แต่ละแนวป้องกัน ดูว่าปีศาจกลุ่มไหนมาก่อน แล้ววางแผนทีละตาเพื่อปิดรอยแยก', en: 'Allocate power, read approaching waves and close the rift through turn-based planning.' }, stageCount: 5, limitMs: 180000, version: 'rift-v1', rulesVersion: 'rift-rules-v1', requires: [{ campaign: 'tower', cleared: 10 }, { campaign: 'coven', cleared: 5 }] },
  { id: 'demonlord', icon: '👑', title: { th: 'ปราบจอมมาร', en: 'Seal the Demon Lord' }, story: { th: 'หาคาถาลวง จัดพลังให้ถูกต้อง และเลือกเส้นทางสุดท้ายเพื่อปิดผนึกจอมมาร', en: 'Expose false spells, repair the power plan and trace the final sealing route.' }, stageCount: 5, limitMs: 180000, version: 'demonlord-v1', rulesVersion: 'demonlord-rules-v1', requires: [{ campaign: 'rift', cleared: 5 }] },
  { id: 'moon-maze', icon: '☾', title: { th: 'เขาวงกตแห่งจันทราไร้เสียง', en: 'Labyrinth of the Silent Moon' }, story: { th: 'หลังปราบจอมมารแล้ว เขาวงกตใต้แสงจันทร์จะเปิดออก มี 30 ชั้น ชั้นละ 10 ด่าน แต่ละโจทย์ต้องคิดต่ออีก 1 ขั้น ลองหาคำตอบด้วยตัวเองโดยไม่มีคำใบ้', en: 'After sealing the Demon Lord, enter 30 moonlit floors with 10 stages each. Hints are sealed. Face puzzles with 1 extra thinking step, using your own reasoning and no hints.' }, stageCount: 300, chapterSize: 10, chapterCount: 30, hintsAllowed: false, magicAllowed: false, difficultyStep: 1, limitMs: 600000, version: 'moon-maze-v1', rulesVersion: 'moon-maze-rules-v2', requires: [{ campaign: 'demonlord', cleared: 5 }] },
  { id: 'star-expanse', icon: '✺', title: { th: 'หมู่มวลดาราเวิ้งว้าง', en: 'The Boundless Star Expanse' }, story: { th: 'เมื่อผ่านเขาวงกตแห่งจันทราไร้เสียงแล้ว ออกสำรวจดาว 25 ดวง ดวงละ 40 ด่าน รวม 1,000 ด่าน แต่ละโจทย์ต้องคิดต่ออีก 2 ขั้นจากระดับชั้นที่เลือก ลองหาคำตอบด้วยตัวเองโดยไม่มีคำใบ้ แล้วเดินทางไปให้ถึงดาวดวงสุดท้าย', en: 'Beyond the Silent Moon, explore 25 stars with 40 stages each: 1,000 challenges with 2 extra thinking steps for your selected grade. Hints remain sealed. Follow your own reasoning to the final star.' }, stageCount: 1000, chapterSize: 40, chapterCount: 25, hintsAllowed: false, magicAllowed: false, difficultyStep: 2, limitMs: 2400000, version: 'star-expanse-v1', rulesVersion: 'star-expanse-rules-v2', requires: [{ campaign: 'moon-maze', cleared: 300 }] },
]);

export const TOWER_CHAPTERS = Object.freeze([
  { id: 1, title: { th: 'รากฐานแห่งจำนวน', en: 'Number Foundations' } },
  { id: 2, title: { th: 'สวนแบบรูป', en: 'Pattern Garden' } },
  { id: 3, title: { th: 'ตลาดเวทมนตร์', en: 'Magic Market' } },
  { id: 4, title: { th: 'ห้องทดลองการวัด', en: 'Measurement Laboratory' } },
  { id: 5, title: { th: 'สะพานแห่งการแบ่งปัน', en: 'Sharing Bridges' } },
  { id: 6, title: { th: 'เรขาคณิตเปลี่ยนรูป', en: 'Shape Workshop' } },
  { id: 7, title: { th: 'หอจดหมายเหตุข้อมูล', en: 'Data Archives' } },
  { id: 8, title: { th: 'โรงงานสมดุล', en: 'Balance Factory' } },
  { id: 9, title: { th: 'แผนที่ทางเลือก', en: 'Route Atlas' } },
  { id: 10, title: { th: 'คัมภีร์รวมพลัง', en: 'The Complete Spellbook' } },
]);

const round = value => Math.round(value * 1000000) / 1000000;
const pair = (th, en) => [th, en];

function stageRandom(key) {
  let state = 2166136261;
  for (const character of key) state = Math.imul(state ^ character.charCodeAt(0), 16777619) >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}

// Adventure answers are numeric, including the a/b answers used in fraction
// practice. Keep this conversion local: engine.js also imports adventure data.
function answerParts(answer) {
  const text = String(answer).trim(), fraction = text.match(/^(-?\d+)\/(\d+)$/);
  if (fraction) return { numerator: Number(fraction[1]), denominator: Number(fraction[2]), fraction: true };
  const value = Number(text), places = (text.split('.')[1] ?? '').length;
  const denominator = 10 ** places;
  if (!Number.isFinite(value)) throw new RangeError('Adventure questions need numeric answers');
  return { numerator: Math.round(value * denominator), denominator, fraction: false };
}

function answerLabel(numerator, denominator, asFraction) {
  if (!asFraction) return String(round(numerator / denominator));
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const common = gcd(Math.abs(numerator), denominator);
  return denominator / common === 1 ? String(numerator / common) : `${numerator / common}/${denominator / common}`;
}

/**
 * Keep the story and interaction IDs, but teach the selected grade's topics.
 * Choice ordinals, rather than floor numbers, cycle every profile topic even
 * when route, balance and other gameplay encounters appear between questions.
 * The same stage regenerates the same arithmetic when switching languages.
 */
export function applyGradeQuestions(stages, grade, language = 'th', offset = 0) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new RangeError('grade must be 1–6');
  if (!['th', 'en'].includes(language)) throw new RangeError('language must be th or en');
  if (!Array.isArray(stages) || !Number.isInteger(offset) || offset < 0) throw new RangeError('invalid adventure question sequence');
  const topics = GRADE_PROFILES[grade - 1].topics;
  let ordinal = offset;
  return stages.map(stage => {
    if (stage.kind !== 'choice') return stage;
    const topic = topics[ordinal++ % topics.length];
    const rng = stageRandom(`${stage.id}:g${grade}:${topic}`);
    const q = createQuestionRound(grade, { rng, topic, language }).questions[0];
    const { numerator, denominator, fraction } = answerParts(q.answer);
    const distractors = [];
    for (const difference of [-1, 1, -2, 2, 3]) {
      const value = numerator + difference;
      if (value >= 0 && value !== numerator && !distractors.includes(value)) distractors.push(value);
      if (distractors.length === stage.options.length - 1) break;
    }
    let wrong = 0;
    return {
      ...stage, prompt: q.prompt, hint: q.hint, topic, questionId: q.id, ...(q.visual ? { visual: q.visual } : {}),
      options: stage.options.map(option => {
        const top = option.id === stage.correctId ? numerator : distractors[wrong++];
        return { ...option, label: answerLabel(top, denominator, fraction), value: top / denominator };
      }),
    };
  });
}

function builders(campaign, grade, language) {
  const english = language === 'en', scale = [1, 2, 10, 25, 0.5, 1.25][grade - 1];
  const t = value => Array.isArray(value) ? value[english ? 1 : 0] : value;
  const v = value => round(value * scale), n = value => String(v(value));
  let count = 0;
  const base = (kind, title, prompt, hint, fields = {}) => ({ id: `${campaign}-g${grade}-${String(++count).padStart(3, '0')}`, kind, title: t(title), prompt: t(prompt), hint: t(hint), ...fields });
  function choice(title, prompt, correct, wrong, hint) {
    const stage = base('choice', title, prompt, hint);
    stage.options = [wrong[0], correct, wrong[1]].map((value, index) => ({ id: `${stage.id}-o${index}`, label: n(value), value: v(value) }));
    stage.correctId = stage.options[1].id; return stage;
  }
  function textChoice(title, prompt, labels, correctIndex, hint) {
    const stage = base('choice', title, prompt, hint);
    stage.options = labels.map((label, index) => ({ id: `${stage.id}-o${index}`, label: t(label) }));
    stage.correctId = stage.options[correctIndex].id; return stage;
  }
  function subset(values, target) {
    for (let mask = 1; mask < 2 ** values.length; mask++) {
      const selected = values.filter((_, index) => mask & (1 << index));
      if (Math.abs(selected.reduce((sum, value) => sum + value, 0) - target) < 1e-8) return selected;
    }
    throw new Error('Encounter has no subset solution');
  }
  function sum(title, context, target, values) {
    const solution = subset(values, target);
    const stage = base('sum', title,
      pair(`${t(context)} เลือกชิ้นส่วนให้บวกกันได้เท่ากับ ${n(target)} หน่วย แต่ละชิ้นใช้ได้ครั้งเดียว แตะชิ้นที่เลือกอีกครั้งเพื่อนำออก`, `${t(context)} Select pieces totaling exactly ${n(target)} units. Use each piece once; tap again to remove it.`),
      pair(`ลอง ${solution.map(n).join(' + ')} = ${n(target)}`, `Try ${solution.map(n).join(' + ')} = ${n(target)}.`), { target: v(target) });
    stage.options = values.map((value, index) => ({ id: `${stage.id}-piece${index}`, label: n(value), value: v(value) })); return stage;
  }
  function order(title, context, values, descending = false) {
    const direction = descending ? pair('มากไปน้อย', 'largest to smallest') : pair('น้อยไปมาก', 'smallest to largest');
    const sorted = [...values].sort((a, b) => descending ? b - a : a - b);
    const stage = base('order', title, pair(`${t(context)} แตะบัตรให้ครบทุกใบ โดยเรียงจาก${t(direction)}`, `${t(context)} Tap all values from ${t(direction)}.`), pair(`เริ่มจากค่าที่${descending ? 'มาก' : 'น้อย'}ที่สุด แล้วเรียงต่อไป จะได้ ${sorted.map(n).join(' → ')}`, `The order is ${sorted.map(n).join(' → ')}.`));
    const options = values.map((value, index) => ({ id: `${stage.id}-card${index}`, label: n(value), value: v(value) }));
    stage.options = [options[2], options[0], options[3], options[1]];
    stage.correctOrder = sorted.map(value => options.find(option => option.value === v(value)).id); return stage;
  }
  function sequence(title, context, steps) {
    const labels = steps.map(t);
    const stage = base('order', title,
      pair(`${t(context)} เงื่อนไข: ${labels.slice(0, -1).map((label, index) => `${label} ก่อน ${labels[index + 1]}`).join(' / ')} แตะงานทั้ง 4 ขั้นตามลำดับ`, `${t(context)} Rules: ${labels.slice(0, -1).map((label, index) => `${label} before ${labels[index + 1]}`).join(' / ')}. Tap all four tasks in order.`),
      pair(`ทำตามลำดับนี้: ${labels.join(' → ')}`, `Follow the dependency chain: ${labels.join(' → ')}.`));
    const options = labels.map((label, index) => ({ id: `${stage.id}-step${index}`, label }));
    stage.options = [options[2], options[0], options[3], options[1]]; stage.correctOrder = options.map(option => option.id); return stage;
  }
  function balance(title, left, right, difference = 0) {
    const needed = right - left + difference;
    const goal = difference === 0 ? pair('ทำให้สองฝั่งเท่ากัน', 'Make both sides equal') : pair(`ทำให้ซ้ายมากกว่าขวา ${n(difference)} หน่วย`, `Make the left side exceed the right by ${n(difference)} units`);
    const stage = base('balance', title,
      pair(`ตอนเริ่มต้น ฝั่งซ้ายหนัก ${n(left)} หน่วย ฝั่งขวาหนัก ${n(right)} หน่วย ${t(goal)} เลือกตุ้มน้ำหนักอย่างน้อย 1 ชิ้นเพื่อเติมฝั่งที่เขียนไว้บนป้าย`, `Start with ${n(left)} units on the left and ${n(right)} on the right. ${t(goal)}. Select weights to add to their labeled side; select at least one.`),
      pair(`ดูน้ำหนักทั้งสองฝั่งก่อน ลองเติมฝั่งซ้ายอีก ${n(needed)} หน่วย: ${n(left)} + ${n(needed)} − ${n(right)} = ${n(difference)}`, `Add ${n(needed)} on the left: ${n(left)} + ${n(needed)} − ${n(right)} = ${n(difference)}.`),
      { initialLeft: v(left), initialRight: v(right), targetDifference: v(difference), minimumSelection: 1 });
    stage.options = [[1, 'left'], [needed - 1, 'left'], [needed, 'left'], [2, 'right'], [4, 'right']].map(([value, side], index) => ({ id: `${stage.id}-weight${index}`, label: `${t(side === 'left' ? pair('ซ้าย', 'Left') : pair('ขวา', 'Right'))} +${n(value)}`, value: v(value), side })); return stage;
  }
  function allocation(title, context, amounts, names = [pair('กลุ่ม A', 'Group A'), pair('กลุ่ม B', 'Group B'), pair('กลุ่ม C', 'Group C')]) {
    const groups = amounts.map((target, index) => ({ id: 'abc'[index], label: t(names[index]), target: v(target) }));
    const stage = base('allocation', title,
      pair(`${t(context)} เลือกชิ้นส่วนตามป้ายกลุ่ม ให้แต่ละกลุ่มรวมได้พอดีตามนี้: ${groups.map(group => `${group.label} = ${group.target}`).join(' / ')} หน่วย ใช้แต่ละชิ้นได้ครั้งเดียว ไม่ต้องเลือกทุกชิ้น`, `${t(context)} Select labeled pieces so each group receives exactly: ${groups.map(group => `${group.label} = ${group.target}`).join(' / ')} units. Use each piece once; some pieces should remain unused.`),
      pair(`ดูเป้าหมายของแต่ละกลุ่ม แล้วลองเลือกกลุ่มละ 2 ชิ้นตามนี้: ${amounts.map((amount, index) => `${groups[index].label}: ${n(Math.floor(amount / 2))} + ${n(amount - Math.floor(amount / 2))} = ${n(amount)}`).join(' / ')}`, `Choose two pieces per group: ${amounts.map((amount, index) => `${groups[index].label}: ${n(Math.floor(amount / 2))} + ${n(amount - Math.floor(amount / 2))} = ${n(amount)}`).join(' / ')}.`), { targets: groups });
    stage.options = amounts.flatMap((amount, index) => [Math.floor(amount / 2), amount - Math.floor(amount / 2), amount + 1].map((value, piece) => ({ id: `${stage.id}-${groups[index].id}${piece}`, label: `${groups[index].label} · ${n(value)}`, value: v(value), group: groups[index].id }))); return stage;
  }
  function route(title, budget = 9, closed = null) {
    const stage = base('route', title,
      pair(`เริ่มที่ S แวะ A, B, C ให้ครบจุดละ 1 ครั้ง แล้วไปจบที่ E แตะจุดแวะตามลำดับ โดยให้ระยะทางรวมไม่เกิน ${n(budget)} หน่วย เดินได้เฉพาะเส้นที่แสดงและเดินได้สองทาง`, `Start at S, visit A, B and C exactly once, then end at E. Tap a visiting order totaling at most ${n(budget)} units. Only the shown paths exist, and each works both ways.`),
      pair(`S → A → B → C → E ใช้ ${n(2)} + ${n(1)} + ${n(2)} + ${n(2)} = ${n(7)} หน่วย ลองแผนอื่นได้ด้วย`, `S → A → B → C → E costs ${n(2)} + ${n(1)} + ${n(2)} + ${n(2)} = ${n(7)} units. You can also test other plans.`), { start: 'S', end: 'E', budget: v(budget) });
    stage.options = ['A', 'B', 'C'].map(id => ({ id, label: id }));
    stage.edges = [['S', 'A', 2], ['S', 'B', 3], ['S', 'C', 4], ['A', 'B', 1], ['A', 'C', 3], ['B', 'C', 2], ['A', 'E', 4], ['B', 'E', 3], ['C', 'E', 2]].filter(([from, to]) => !closed || `${from}-${to}` !== closed).map(([from, to, cost]) => ({ from, to, cost: v(cost) })); return stage;
  }
  function pattern(title, values, next) {
    return choice(title, pair(`จารึกเรียง ${values.map(n).join(', ')}, ? เลือกจำนวนถัดไป`, `The inscription reads ${values.map(n).join(', ')}, ? Choose the next number.`), next, [next - 1, next + 1], pair(`ลองหาว่าจำนวนแต่ละคู่เพิ่มหรือลดเท่าไร แล้วใช้กฎเดิมกับจำนวนสุดท้าย จะได้ ${n(next)}`, `Check the change between every pair. The next value is ${n(next)}.`));
  }
  function constrained(title) {
    return choice(title, pair(`ตัวเลขบนผนึกมากกว่า ${n(4)} น้อยกว่า ${n(8)} และเท่ากับ ${n(3)} + ${n(3)} เลือกตัวเลขที่ตรงกับทุกเงื่อนไข`, `The seal is greater than ${n(4)}, less than ${n(8)}, and equal to ${n(3)} + ${n(3)}. Meet all three conditions.`), 6, [5, 7], pair(`${n(3)} + ${n(3)} = ${n(6)} ซึ่งอยู่ระหว่าง ${n(4)} กับ ${n(8)}`, `${n(3)} + ${n(3)} = ${n(6)}, between ${n(4)} and ${n(8)}.`));
  }
  function mirror(title) {
    const shapes = grade <= 2 ? ['▲', '●', '■'] : grade <= 4 ? ['▲', '●', '■', '◆'] : ['▲', '●', '■', '◆', '★'];
    const reverse = [...shapes].reverse().join(' ');
    return textChoice(title, pair(`มองลำดับ ${shapes.join(' ')} ในกระจกแนวตั้ง ลำดับจากซ้ายไปขวาจะเป็นแบบใด?`, `A vertical mirror reverses the sequence ${shapes.join(' ')}. Which sequence reads from left to right in the mirror?`), [pair(shapes.join(' '), shapes.join(' ')), pair(reverse, reverse), pair([...shapes.slice(1), shapes[0]].join(' '), [...shapes.slice(1), shapes[0]].join(' '))], 1, pair(`อ่านจากขวากลับไปซ้าย: ${reverse}`, `Read the original from right to left: ${reverse}.`));
  }
  return { n, choice, textChoice, sum, order, sequence, balance, allocation, route, pattern, constrained, mirror };
}

function shortCampaign(campaign, b) {
  const { n, choice, sum, order, sequence, balance, allocation, route, pattern, constrained, mirror } = b;
  const P = pair;
  const load = P('เติมพลังจากชิ้นที่มีให้', 'Build the required energy from the available pieces.');
  const stages = {
    cave: () => [
      sum(P('ตะเกียงปากถ้ำ', 'Entrance lantern'), P('ต้องเติมแสงให้ตะเกียงก่อนสำรวจ', 'Refill the lantern before exploring.'), 6, [1, 2, 3, 5]),
      order(P('อุโมงค์เสียงสะท้อน', 'Echo tunnel'), P('จัดเวลาที่เสียงสะท้อนกลับจากเร็วไปช้า', 'Arrange the echo return times from earliest to latest.'), [2, 5, 8, 11]),
      mirror(P('ห้องเงาผลึก', 'Crystal reflections')),
      sum(P('สะพานผลึก', 'Crystal bridge'), P('ใช้ค่าของผลึกซ่อมสะพานแสง', 'Use crystal values to repair the light bridge.'), 10, [2, 3, 5, 7]),
      route(P('บอส · มังกรผลึกสะท้อน', 'Boss · Crystal reflection dragon'), 9),
    ],
    ruins: () => [
      order(P('ประกอบบันไดจารึก', 'Rebuild the inscription stair'), P('เรียงชิ้นส่วนตามค่าจากน้อยไปมากเพื่อซ่อมบันได', 'Restore the fragments in increasing value.'), [3, 6, 9, 12]),
      constrained(P('หลักฐานสามชิ้น', 'Three pieces of evidence')),
      balance(P('ตราชั่งโบราณ', 'Ancient scales'), 2, 6),
      sum(P('ชิ้นส่วนตราประตู', 'Gate seal fragments'), P('รวมพลังจากชิ้นส่วนเพื่อซ่อมตราประตู', 'Combine fragment values to complete the gate seal.'), 9, [1, 2, 4, 5]),
      allocation(P('บอส · สฟิงซ์แห่งหลักฐาน', 'Boss · Sphinx of evidence'), P('คืนพลังให้ห้องบันทึกและห้องดารา', 'Restore the archive and observatory.'), [4, 6], [P('ห้องบันทึก', 'Archive'), P('ห้องดารา', 'Observatory')]),
    ],
    castle: () => [
      balance(P('เครื่องถ่วงสะพานชัก', 'Drawbridge counterweight'), 2, 7),
      sequence(P('เปิดสวิตช์ตามลำดับ', 'Dependent switches'), P('สะพานต้องพร้อมก่อนเปิดประตู', 'The bridge must be ready before the gate opens.'), [P('เติมถัง', 'Fill tank'), P('เดินปั๊ม', 'Start pump'), P('ลดสะพาน', 'Lower bridge'), P('เปิดประตู', 'Open gate')]),
      allocation(P('ครัวปราสาท', 'Castle kitchen'), P('แบ่งวัตถุดิบให้หม้อทั้งสองใบตามสูตร', 'Allocate ingredients to the two recipe orders.'), [5, 3], [P('หม้อ A', 'Pot A'), P('หม้อ B', 'Pot B')]),
      pattern(P('เฟืองส่งพลัง', 'Power gears'), [2, 4, 6], 8),
      sequence(P('บอส · อัศวินนาฬิกา', 'Boss · Clockwork knight'), P('เปิดเครื่องจักรตามลำดับเพื่อให้ประตูทำงานอีกครั้ง', 'Restore the complete gate mechanism.'), [P('ถ่วงน้ำหนัก', 'Balance weights'), P('ปลดสลัก', 'Release latch'), P('หมุนเฟือง', 'Turn gears'), P('ยกประตู', 'Raise gate')]),
    ],
    coven: () => [
      choice(P('ตลาดแลกวัตถุดิบ', 'Ingredient market'), P(`จ่าย ${n(4)} กับ ${n(3)} จากเงิน ${n(10)} หน่วยเงิน เหลือเท่าไร?`, `Spend ${n(4)} and ${n(3)} from ${n(10)} money units. How much remains?`), 3, [2, 4], P(`${n(10)} − ${n(4)} − ${n(3)} = ${n(3)}`, `${n(10)} − ${n(4)} − ${n(3)} = ${n(3)}.`)),
      allocation(P('โรงปรุงยา', 'Potion workshop'), P('เลือกส่วนผสมให้ครบสูตรทั้งสองขวด', 'Meet both potion recipes using the labeled ingredients.'), [6, 4], [P('ยาสีฟ้า', 'Blue potion'), P('ยาสีทอง', 'Gold potion')]),
      order(P('เวทีต่อคาถา', 'Spell sequence stage'), P('เรียงค่าพลังแสงจากน้อยไปมาก', 'Arrange the growing light values from smallest to largest.'), [4, 8, 12, 16]),
      balance(P('แบ่งพลังให้เพื่อน', 'Share power with friends'), 3, 7),
      allocation(P('บอส · การทดสอบแห่งสภา', 'Boss · Council examination'), P('จัดพลังให้เวทีหลักกับซุ้มกิจกรรมตามแผน', 'Supply the main stage and activity booth according to the festival plan.'), [8, 5], [P('เวทีหลัก', 'Main stage'), P('ซุ้มกิจกรรม', 'Activity booth')]),
    ],
    rift: () => [
      allocation(P('ตั้งแนวป้องกัน', 'Set the defense lines'), P('แบ่งพลังให้แนวป้องกันทั้งสอง โดยดูจากป้ายกลุ่ม', 'Allocate labeled power pieces to the two defense lines.'), [5, 7], [P('แนวเหนือ', 'North line'), P('แนวใต้', 'South line')]),
      order(P('อ่านลำดับคลื่น', 'Read the incoming waves'), P('จัดการปีศาจกลุ่มที่มาถึงก่อน โดยเรียงตามเวลาที่มาถึง', 'Handle the earliest arrivals first. Order the arrival times.'), [3, 6, 9, 12]),
      sum(P('โล่รวมพลัง', 'Combined shield'), load, 12, [2, 4, 5, 7]),
      constrained(P('เลือกผนึกรอยแยก', 'Choose the rift seal')),
      allocation(P('บอส · ราชินีรอยแยก', 'Boss · Rift queen'), P('ปิดประตูสองบานด้วยพลังที่ตรงกับแต่ละเสา', 'Close both gates with the exact power required by each pillar.'), [9, 8], [P('เสาตะวัน', 'Sun pillar'), P('เสาจันทรา', 'Moon pillar')]),
    ],
    demonlord: () => [
      order(P('ระยะ 1 · อักขระเงาลวง', 'Phase 1 · Shadow glyphs'), P('ล้างคาถาจากพลังมากไปน้อย', 'Clear spells from highest to lowest power.'), [3, 6, 9, 12], true),
      balance(P('ระยะ 2 · เกราะสมดุล', 'Phase 2 · Balance armor'), 2, 7, 1),
      constrained(P('ระยะ 3 · ตรวจคาถาบิดเบือน', 'Phase 3 · Expose the false spell')),
      allocation(P('ระยะ 4 · ซ่อมแผนคืนพลัง', 'Phase 4 · Repair the power plan'), P('เลือกชิ้นส่วนพลังให้ถูกต้อง หลังจากจอมมารแอบสลับไว้', 'Replace the swapped power pieces with a plan meeting both targets.'), [7, 6], [P('โล่เพื่อน', 'Ally shield'), P('ตราผนึก', 'Sealing rune')]),
      route(P('บอส · เส้นทางผนึกจอมมาร', 'Boss · Final sealing route'), 9),
    ],
  };
  return stages[campaign]();
}

function towerContent(b, language) {
  const { n, choice, textChoice, sum, order, sequence, balance, allocation, route, pattern, constrained, mirror } = b;
  const P = pair, context = P('รวมค่าจากชิ้นส่วนที่มีให้', 'Combine values from the available pieces.');
  const ascending = P('จัดหลักฐานตามค่า', 'Arrange the evidence by value.');
  const zones = [
    () => [
      pattern(P('บันไดจำนวน', 'Number stairs'), [2, 4, 6], 8),
      sum(P(`สะพานรวม ${n(6)} หน่วย`, `${n(6)}-unit bridge`), context, 6, [1, 2, 3, 5]),
      order(P('ป้ายทางเรียงค่า', 'Trail value signs'), ascending, [1, 2, 3, 4]),
      balance(P('ประตูสองฝั่ง', 'Two-sided gate'), 2, 5),
      constrained(P('ห้องเงื่อนไขจำนวน', 'Number conditions room')),
      allocation(P('จัดแสงสองห้อง', 'Light two rooms'), context, [4, 6]),
      order(P('ลดระดับลิฟต์', 'Lower the lift'), P('เรียงป้ายลงจากค่ามากไปน้อย', 'Arrange the descending lift signs.'), [4, 8, 12, 16], true),
      sum(P(`กล่องรวม ${n(9)} หน่วย`, `${n(9)}-unit chest`), context, 9, [1, 2, 4, 5]),
      choice(P('ซ่อมจำนวนที่หาย', 'Repair the missing number'), P(`${n(3)} + ? = ${n(9)} เลือกค่าที่หาย`, `${n(3)} + ? = ${n(9)}. Choose the missing value.`), 6, [5, 7], P(`${n(9)} − ${n(3)} = ${n(6)}`, `${n(9)} − ${n(3)} = ${n(6)}.`)),
      allocation(P('ผู้พิทักษ์ · คลังจำนวน', 'Guardian · Number vault'), P('จ่ายพลังให้คลังสองฝั่งพร้อมกัน', 'Power both vaults at once.'), [8, 7]),
    ],
    () => [
      order(P('แปลงดอกแบบรูป', 'Pattern flowerbeds'), ascending, [3, 6, 9, 12]),
      pattern(P('แบบรูปก้าวสลับ', 'Alternating-step pattern'), [1, 2, 4, 5, 7], 8),
      sum(P('เติมช่องว่างในแถว', 'Fill the row gaps'), context, 7, [1, 3, 4, 6]),
      order(P('แบบรูปลดแสง', 'Fading-light pattern'), ascending, [2, 5, 8, 11], true),
      pattern(P('ผลึกเพิ่มเป็นเท่า', 'Doubling crystals'), [1, 2, 4, 8], 16),
      balance(P('สมดุลสองแถว', 'Balance two rows'), 3, 7),
      allocation(P('ปลูกแบบรูปสองสี', 'Plant two-color patterns'), P('เติมสองแถวให้พอดีตามป้าย', 'Complete both labeled rows.'), [6, 5]),
      sequence(P('วงจรปลูกใหม่', 'Replanting cycle'), P('เรียงงานในสวนให้ถูกลำดับ', 'Arrange the garden tasks by dependency.'), [P('นับช่อง', 'Count spaces'), P('วางเมล็ด', 'Place seeds'), P('เติมน้ำ', 'Add water'), P('ตรวจแบบรูป', 'Check pattern')]),
      sum(P('แสงระหว่างทาง', 'Trail lights'), context, 10, [2, 3, 5, 7]),
      route(P('ผู้พิทักษ์ · ทางเดินสวนแบบรูป', 'Guardian · Pattern garden trail'), 8),
    ],
    () => [
      choice(P('ร้านเงินทอน', 'Change counter'), P(`มี ${n(10)} หน่วยเงิน ซื้อของ ${n(3)} และ ${n(4)} เหลือเท่าไร?`, `Have ${n(10)} money units and buy items for ${n(3)} and ${n(4)}. What remains?`), 3, [2, 4], P(`${n(10)} − ${n(3)} − ${n(4)} = ${n(3)}`, `${n(10)} − ${n(3)} − ${n(4)} = ${n(3)}.`)),
      sum(P('จ่ายเงินให้พอดี', 'Exact payment'), P('เลือกเงินชำระให้ครบราคา', 'Select money values to pay the exact price.'), 8, [1, 3, 5, 7]),
      order(P('ชั้นวางป้ายราคา', 'Price-tag shelf'), P('เรียงราคาสินค้าจากถูกไปแพง', 'Sort the prices from cheapest to most expensive.'), [2, 5, 7, 9]),
      allocation(P('งบสองร้าน', 'Two-shop budgets'), P('จ่ายให้ร้านตามยอดในใบสั่ง', 'Pay each shop its exact order total.'), [6, 4], [P('ร้านผลไม้', 'Fruit shop'), P('ร้านสมุด', 'Notebook shop')]),
      balance(P('ยอดขายเท่ากัน', 'Equal sales'), 2, 5),
      choice(P('ตรวจใบเสร็จ', 'Check the receipt'), P(`ซื้อ ${n(2)} กับ ${n(5)} รวมต้องจ่ายเท่าไร?`, `Buy items costing ${n(2)} and ${n(5)}. What is the total?`), 7, [6, 8], P(`${n(2)} + ${n(5)} = ${n(7)}`, `${n(2)} + ${n(5)} = ${n(7)}.`)),
      sum(P(`ถุงเงิน ${n(10)} หน่วย`, `${n(10)}-unit money bag`), context, 10, [1, 2, 4, 6]),
      order(P('กล่องเงินทอน', 'Change boxes'), P('เรียงเงินทอนจากน้อยไปมาก', 'Order the change amounts from smallest to largest.'), [1, 4, 6, 8]),
      choice(P('งบที่ยังเหลือ', 'Remaining budget'), P(`งบ ${n(12)} ใช้ไป ${n(5)} ยังใช้ได้อีกเท่าไร?`, `A budget of ${n(12)} has spent ${n(5)}. How much remains?`), 7, [6, 8], P(`${n(12)} − ${n(5)} = ${n(7)}`, `${n(12)} − ${n(5)} = ${n(7)}.`)),
      allocation(P('ผู้พิทักษ์ · เหรัญญิกตลาด', 'Guardian · Market treasurer'), P('ปิดบัญชีสองร้านให้ตรงยอดโดยไม่จ่ายเกิน', 'Settle both shops without overpaying.'), [9, 7]),
    ],
    () => [
      choice(P('ต่อเชือกวัดระยะ', 'Join measuring ropes'), P(`เชือก ${n(3)} กับ ${n(5)} หน่วย ต่อกันยาวเท่าไร?`, `Join ropes of ${n(3)} and ${n(5)} units. What is the length?`), 8, [7, 9], P(`${n(3)} + ${n(5)} = ${n(8)}`, `${n(3)} + ${n(5)} = ${n(8)}.`)),
      sum(P(`รางวัด ${n(10)} หน่วย`, `${n(10)}-unit measuring rail`), P('ต่อชิ้นรางโดยไม่เหลือช่องว่าง', 'Join rail pieces without leaving a gap.'), 10, [1, 2, 4, 6]),
      order(P('ชั้นเก็บไม้บรรทัด', 'Ruler shelf'), P('เรียงความยาว', 'Arrange the lengths.'), [2, 5, 7, 9]),
      balance(P('โต๊ะชั่งมวล', 'Mass comparison bench'), 2, 6),
      allocation(P('เติมถังทดลอง', 'Fill experiment tanks'), P('เติมน้ำแต่ละถังตรงขีดกำหนด', 'Fill each tank to its marked target.'), [6, 5], [P('ถัง A', 'Tank A'), P('ถัง B', 'Tank B')]),
      choice(P('เดินรอบแปลงทดลอง', 'Walk around the test plot'), P(`แปลงมีสี่ด้านยาว ${n(2)}, ${n(3)}, ${n(2)}, ${n(3)} รวมรอบแปลงเท่าไร?`, `A plot has sides ${n(2)}, ${n(3)}, ${n(2)}, ${n(3)}. What is its perimeter?`), 10, [9, 11], P(`${n(2)} + ${n(3)} + ${n(2)} + ${n(3)} = ${n(10)}`, `${n(2)} + ${n(3)} + ${n(2)} + ${n(3)} = ${n(10)}.`)),
      order(P('ระดับน้ำเพิ่มขึ้น', 'Rising water levels'), P('จัดระดับน้ำจากต่ำไปสูง', 'Arrange water levels from lowest to highest.'), [2, 4, 6, 8]),
      sum(P(`เหยือก ${n(9)} หน่วย`, `${n(9)}-unit jug`), P('เลือกปริมาตรที่จะเทรวม', 'Choose volumes to pour together.'), 9, [1, 3, 4, 6]),
      choice(P('ตัดเชือกแล้วเหลือ', 'Rope after cutting'), P(`เชือกยาว ${n(12)} ตัดออก ${n(5)} เหลือเท่าไร?`, `A rope is ${n(12)} units long. Cut off ${n(5)}. What remains?`), 7, [6, 8], P(`${n(12)} − ${n(5)} = ${n(7)}`, `${n(12)} − ${n(5)} = ${n(7)}.`)),
      route(P('ผู้พิทักษ์ · นักสำรวจระยะ', 'Guardian · Distance surveyor'), 9),
    ],
    () => [
      choice(P('แบ่งเสบียงสามคน', 'Share among three friends'), P(`แบ่ง ${n(12)} หน่วยให้ 3 คนเท่า ๆ กัน คนละเท่าไร?`, `Share ${n(12)} units equally among 3 friends. How much each?`), 4, [3, 5], P(`${n(4)} + ${n(4)} + ${n(4)} = ${n(12)}`, `${n(4)} + ${n(4)} + ${n(4)} = ${n(12)}.`)),
      sum(P('ต่อชิ้นส่วนให้ครบ', 'Build the whole'), context, 8, [1, 2, 3, 5]),
      allocation(P('สองกลุ่มได้เท่ากัน', 'Equal groups'), P('ให้ทั้งสองกลุ่มได้ตามเป้าเดียวกัน', 'Give both groups the same required amount.'), [6, 6]),
      order(P('ส่วนแบ่งตามขนาด', 'Shares by size'), P('เรียงส่วนแบ่งจากเล็กไปใหญ่', 'Arrange the shares from smallest to largest.'), [1, 2, 3, 4]),
      balance(P('มื้อเท่าเทียม', 'Fair meal'), 2, 6),
      choice(P('รวมสามกลุ่ม', 'Combine three groups'), P(`มี 3 กลุ่ม กลุ่มละ ${n(4)} หน่วย รวมเท่าไร?`, `There are 3 groups of ${n(4)} units. What is the total?`), 12, [11, 13], P(`${n(4)} + ${n(4)} + ${n(4)} = ${n(12)}`, `${n(4)} + ${n(4)} + ${n(4)} = ${n(12)}.`)),
      sum(P(`เติมเต็ม ${n(10)} หน่วย`, `Complete ${n(10)} units`), context, 10, [1, 2, 4, 6]),
      sequence(P('ขั้นตอนแบ่งปัน', 'Sharing procedure'), P('จัดแผนแบ่งของก่อนส่งมอบ', 'Plan the sharing process before delivery.'), [P('นับของ', 'Count supplies'), P('แบ่งกลุ่ม', 'Make groups'), P('ตรวจเท่ากัน', 'Check equal shares'), P('ส่งมอบ', 'Deliver')]),
      choice(P('เหลือหลังแบ่งสองกลุ่ม', 'Left after two shares'), P(`มี ${n(14)} แบ่งให้สองกลุ่ม กลุ่มละ ${n(6)} เหลือเท่าไร?`, `Have ${n(14)} units and give ${n(6)} to each of two groups. What remains?`), 2, [1, 3], P(`${n(14)} − ${n(6)} − ${n(6)} = ${n(2)}`, `${n(14)} − ${n(6)} − ${n(6)} = ${n(2)}.`)),
      allocation(P('ผู้พิทักษ์ · สะพานส่วนเต็ม', 'Guardian · Bridge of shares'), P('ส่งส่วนประกอบให้สะพานสองช่วงพอดี', 'Supply both bridge sections exactly.'), [9, 6]),
    ],
    () => [
      textChoice(P('ตรวจด้านของรูป', 'Inspect shape sides'), P('รูปใดมีด้านตรง 3 ด้านและมุม 3 มุม?', 'Which shape has 3 straight sides and 3 corners?'), [P('วงกลม', 'Circle'), P('สามเหลี่ยม', 'Triangle'), P('สี่เหลี่ยมจัตุรัส', 'Square')], 1, P('สามเหลี่ยมมีด้านตรง 3 ด้าน', 'A triangle has 3 straight sides.')),
      order(P('เรียงแท่งขอบรูป', 'Order frame edges'), ascending, [2, 3, 4, 5]),
      sum(P(`ขอบรูป ${n(12)} หน่วย`, `${n(12)}-unit frame`), P('รวมความยาวขอบที่เลือกให้ครบ', 'Combine the selected edge lengths.'), 12, [2, 4, 5, 7]),
      balance(P('แผ่นรูปสองฝั่ง', 'Shape plates'), 2, 7),
      allocation(P('กรอบสองขนาด', 'Two frame sizes'), P('เลือกชิ้นขอบให้ครบความยาวแต่ละกรอบ', 'Choose enough edge length for each frame.'), [9, 8]),
      mirror(P('ประตูกระจก', 'Mirror gate')),
      sequence(P('ประกอบโมเสก', 'Build the mosaic'), P('ทำตามเงื่อนไขการประกอบรูป', 'Follow the mosaic assembly dependencies.'), [P('วางมุม', 'Place corners'), P('ต่อขอบ', 'Join edges'), P('เติมกลาง', 'Fill center'), P('ตรวจรูป', 'Check shape')]),
      sum(P(`ขอบลาน ${n(10)} หน่วย`, `${n(10)}-unit courtyard edge`), context, 10, [1, 3, 4, 6]),
      route(P('เส้นรอบสวนรูปทรง', 'Shape-garden path'), 9),
      balance(P('ผู้พิทักษ์ · ผู้สร้างสมมาตร', 'Guardian · Symmetry builder'), 4, 8),
    ],
    () => [
      choice(P('อ่านแท่งข้อมูล', 'Read the data bars'), P(`ค่าที่บันทึกคือ ${n(3)}, ${n(7)}, ${n(5)} ค่ามากที่สุดคือเท่าไร?`, `The recorded values are ${n(3)}, ${n(7)}, ${n(5)}. What is the greatest?`), 7, [3, 5], P(`${n(7)} มากกว่าทั้ง ${n(3)} และ ${n(5)}`, `${n(7)} is greater than both ${n(3)} and ${n(5)}.`)),
      order(P('จัดอันดับสิ่งที่พบ', 'Order the observations'), ascending, [2, 4, 6, 8]),
      sum(P(`รวมข้อมูล ${n(11)} หน่วย`, `${n(11)}-unit record`), context, 11, [2, 3, 5, 8]),
      allocation(P('แฟ้มข้อมูลสองหมวด', 'Two data categories'), P('เติมค่ารวมของข้อมูลแต่ละหมวดให้พอดี', 'Fill both categories with the required totals.'), [6, 7]),
      balance(P('เปรียบเทียบแผนภูมิ', 'Compare the charts'), 3, 6),
      choice(P('ผลต่างของข้อมูล', 'Difference in the data'), P(`มากที่สุด ${n(9)} น้อยที่สุด ${n(2)} ต่างกันเท่าไร?`, `The greatest value is ${n(9)} and the smallest is ${n(2)}. What is the difference?`), 7, [6, 8], P(`${n(9)} − ${n(2)} = ${n(7)}`, `${n(9)} − ${n(2)} = ${n(7)}.`)),
      order(P('สมุดบันทึกเวลา', 'Observation timeline'), P('เรียงเวลาบันทึกจากก่อนถึงหลัง', 'Arrange the observation times from earliest to latest.'), [2, 5, 8, 11]),
      sum(P('เติมแท่งข้อมูลที่ขาด', 'Fill missing data bars'), context, 9, [1, 3, 4, 6]),
      choice(P('กระจายข้อมูลให้เท่ากัน', 'Redistribute equally'), P(`มีค่ารวม ${n(12)} แบ่งเป็น 3 ช่องเท่ากัน แต่ละช่องได้เท่าไร?`, `Distribute a total of ${n(12)} equally into 3 slots. How much per slot?`), 4, [3, 5], P(`${n(4)} + ${n(4)} + ${n(4)} = ${n(12)}`, `${n(4)} + ${n(4)} + ${n(4)} = ${n(12)}.`)),
      allocation(P('ผู้พิทักษ์ · บรรณารักษ์ข้อมูล', 'Guardian · Data archivist'), P('ปิดยอดข้อมูลสองหมวดตามหลักฐาน', 'Complete both category totals according to the evidence.'), [8, 9]),
    ],
    () => [
      balance(P('เปิดโรงงานสมดุล', 'Open the balance factory'), 1, 5),
      choice(P('สมการช่องว่าง', 'Missing equation value'), P(`${n(3)} + ? = ${n(9)} ค่าที่หายคือเท่าไร?`, `${n(3)} + ? = ${n(9)}. What is missing?`), 6, [5, 7], P(`${n(9)} − ${n(3)} = ${n(6)}`, `${n(9)} − ${n(3)} = ${n(6)}.`)),
      sum(P(`เครื่องจ่ายพลัง ${n(10)} หน่วย`, `${n(10)}-unit power feeder`), context, 10, [2, 3, 5, 7]),
      order(P('น้ำหนักบนสายพาน', 'Conveyor weights'), ascending, [2, 5, 8, 11]),
      balance(P('ซ่อมเครื่องยก', 'Repair the lift'), 4, 9),
      allocation(P('จ่ายพลังสองเครื่อง', 'Power two machines'), context, [7, 5]),
      textChoice(P('เลือกสมการสมมูล', 'Choose equal expressions'), P('ข้อใดมีค่าซ้ายเท่ากับขวา?', 'Which equation has equal values on both sides?'), [P(`${n(2)} + ${n(4)} = ${n(3)} + ${n(2)}`, `${n(2)} + ${n(4)} = ${n(3)} + ${n(2)}`), P(`${n(2)} + ${n(4)} = ${n(3)} + ${n(3)}`, `${n(2)} + ${n(4)} = ${n(3)} + ${n(3)}`), P(`${n(2)} + ${n(4)} = ${n(4)} + ${n(4)}`, `${n(2)} + ${n(4)} = ${n(4)} + ${n(4)}`)], 1, P(`ทั้งสองฝั่งของข้อที่ถูกเท่ากับ ${n(6)}`, `Both sides of the correct equation equal ${n(6)}.`)),
      balance(P('สร้างผลต่างตามสั่ง', 'Build the required difference'), 3, 7, 2),
      sum(P(`สำรองพลัง ${n(9)} หน่วย`, `${n(9)}-unit reserve`), context, 9, [1, 2, 4, 5]),
      balance(P('ผู้พิทักษ์ · หุ่นถ่วงสมดุล', 'Guardian · Balance automaton'), 2, 7, 1),
    ],
    () => [
      route(P(`เส้นทางพอดี ${n(7)} หน่วย`, `Exact ${n(7)}-unit trail`), 7),
      choice(P('อ่านค่าจากแผนที่', 'Read the map cost'), P(`เส้นทางสามช่วงยาว ${n(2)}, ${n(1)}, ${n(3)} รวมเท่าไร?`, `A route has sections of ${n(2)}, ${n(1)}, ${n(3)}. What is the total?`), 6, [5, 7], P(`${n(2)} + ${n(1)} + ${n(3)} = ${n(6)}`, `${n(2)} + ${n(1)} + ${n(3)} = ${n(6)}.`)),
      order(P('ลำดับถึงจุดพัก', 'Checkpoint arrival order'), P('เรียงเวลาที่ถึงจุดพัก', 'Order the checkpoint arrival times.'), [1, 4, 7, 9]),
      sum(P('เสบียงก่อนออกเดิน', 'Trail supplies'), context, 8, [1, 3, 5, 7]),
      route(P('เลือกได้มากกว่าหนึ่งแผน', 'More than one valid plan'), 9),
      allocation(P('จัดของให้สองขบวน', 'Equip two expeditions'), context, [6, 8]),
      constrained(P('ประตูเงื่อนไขแผนที่', 'Map condition gate')),
      route(P('ทางปิดระหว่าง A กับ C', 'Closed A–C path'), 10, 'A-C'),
      sum(P(`เติมเสบียง ${n(10)} หน่วย`, `${n(10)}-unit expedition refill`), context, 10, [1, 2, 4, 6]),
      route(P('ผู้พิทักษ์ · นายแผนที่', 'Guardian · Master cartographer'), 8, 'S-B'),
    ],
    () => [
      constrained(P('รวมหลักฐานสามข้อ', 'Combine three clues')),
      sum(P(`คัดชิ้นพลัง ${n(11)} หน่วย`, `${n(11)}-unit power selection`), context, 11, [2, 3, 5, 8]),
      order(P('จัดลำดับคัมภีร์', 'Order spellbook pages'), ascending, [3, 6, 9, 12]),
      balance(P(`ผนึกผลต่าง ${n(1)} หน่วย`, `${n(1)}-unit difference seal`), 2, 6, 1),
      allocation(P('ส่งพลังให้สองทีม', 'Power both teams'), context, [7, 8]),
      route(P('เส้นทางรวมทักษะ', 'Combined-skills route'), 10),
      sequence(P('แผนคืนแสง', 'Plan to restore the light'), P('จัดขั้นตอนก่อนเปิดคัมภีร์', 'Order the steps before opening the spellbook.'), [P('ตรวจข้อมูล', 'Check evidence'), P('สร้างแผน', 'Build a plan'), P('แบ่งพลัง', 'Share power'), P('เปิดคัมภีร์', 'Open spellbook')]),
      choice(P('แก้คาถาที่คิดผิด', 'Repair the incorrect spell'), P(`คาถาบอกว่า ${n(12)} − ${n(5)} = ${n(8)} เลือกคำตอบที่แก้ถูก`, `A spell claims ${n(12)} − ${n(5)} = ${n(8)}. Choose the corrected answer.`), 7, [6, 8], P(`${n(12)} − ${n(5)} = ${n(7)}`, `${n(12)} − ${n(5)} = ${n(7)}.`)),
      sum(P('เตรียมแสงสุดท้าย', 'Prepare the final light'), context, 12, [2, 4, 5, 7]),
      allocation(P('ผู้พิทักษ์ · คัมภีร์สมบูรณ์', 'Guardian · The complete spellbook'), P('จ่ายพลังให้คัมภีร์สามเล่มตรงเป้าพร้อมกัน', 'Power all three spellbooks to their exact targets.'), [9, 8, 7], [P('คัมภีร์จำนวน', 'Number book'), P('คัมภีร์สมดุล', 'Balance book'), P('คัมภีร์เส้นทาง', 'Route book')]),
    ],
  ];
  return zones.flatMap((build, zoneIndex) => build().map((stage, localIndex) => ({ ...stage, floor: zoneIndex * 10 + localIndex + 1, zone: zoneIndex + 1, boss: localIndex === 9, chapterTitle: TOWER_CHAPTERS[zoneIndex].title[language], title: `${zoneIndex * 10 + localIndex + 1} · ${stage.title}` })));
}

/** Forest remains authored in adventure.js; extended journeys are supplied here. */
export function createCampaignContent(campaign, grade, language = 'th') {
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new RangeError('grade must be 1–6');
  if (!['th', 'en'].includes(language)) throw new RangeError('language must be th or en');
  if (campaign === 'forest' || !CAMPAIGN_DETAILS.some(detail => detail.id === campaign)) throw new RangeError('createCampaignContent supports the campaigns after forest');
  if (campaign === 'moon-maze') return createMoonMazeStages(grade, language);
  if (campaign === 'star-expanse') return createStarExpanseStages(grade, language);
  const b = builders(campaign, grade, language);
  const stages = campaign === 'tower' ? towerContent(b, language) : shortCampaign(campaign, b);
  const campaignOffset = CAMPAIGN_DETAILS.findIndex(detail => detail.id === campaign) * 3;
  return applyGradeQuestions(stages, grade, language, campaign === 'tower' ? 0 : campaignOffset);
}
