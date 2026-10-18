// Original, fixed first forest campaign. Shared IDs keep language changes cosmetic.
export const ADVENTURE_VERSION = 'forest-v1';
export const RULES_VERSION = 'forest-rules-v1';
export const LIMIT_MS = 180000;
export const ADVENTURE_CAMPAIGNS = Object.freeze([
  { id: 'forest', icon: '🌳', title: { th: 'เดินป่าแห่งตัวเลข', en: 'Number Forest' }, available: true },
  { id: 'cave', icon: '💎', title: { th: 'สำรวจถ้ำคริสตัล', en: 'Crystal Cave' }, available: false },
  { id: 'ruins', icon: '🏛️', title: { th: 'สำรวจซากโบราณ', en: 'Ancient Ruins' }, available: false },
  { id: 'castle', icon: '🏰', title: { th: 'ตะลุยปราสาทปริศนา', en: 'Puzzle Castle' }, available: false },
  { id: 'tower', icon: '🗼', title: { th: 'ตะลุยหอคอย 100 ชั้น', en: '100-Floor Tower' }, available: false },
  { id: 'coven', icon: '🧙', title: { th: 'ชุมนุมพ่อมดแม่มด', en: 'Wizard Gathering' }, available: false },
  { id: 'rift', icon: '🌀', title: { th: 'ปราบฝูงปีศาจต่างมิติ', en: 'Defend the Rift' }, available: false },
  { id: 'demonlord', icon: '👑', title: { th: 'ปราบจอมมาร', en: 'Seal the Demon Lord' }, available: false },
]);

const validGrade = grade => Number.isInteger(grade) && grade >= 1 && grade <= 6;
const rounded = value => Math.round(value * 1000000) / 1000000;
const near = (a, b) => Math.abs(a - b) < 1e-8;
const clockNow = () => globalThis.performance?.now?.() ?? Date.now();

export function createForestStages(grade, language = 'th') {
  if (!validGrade(grade)) throw new RangeError('grade must be 1–6');
  if (!['th', 'en'].includes(language)) throw new RangeError('language must be th or en');
  const en = language === 'en', unit = [1, 2, 10, 25, 0.5, 1.25][grade - 1];
  const n = value => String(rounded(value * unit));
  const text = (th, english) => en ? english : th;
  const numericOptions = (values, prefix) => values.map((value, index) => ({ id: `${prefix}-${index}`, value: rounded(value * unit), label: n(value) }));
  return [
    {
      id: 'forest-pattern', kind: 'choice', title: text('1 · ทางเข้าป่า', '1 · Forest entrance'),
      prompt: text(`ป้ายทางเดินเรียง ${n(2)}, ${n(4)}, ${n(6)}, ? เลือกป้ายถัดไปเพื่อเปิดทาง`, `The trail signs read ${n(2)}, ${n(4)}, ${n(6)}, ? Choose the next sign to open the trail.`),
      hint: text(`เพิ่มทีละ ${n(2)}: ${n(6)} + ${n(2)} = ${n(8)}`, `Add ${n(2)} each time: ${n(6)} + ${n(2)} = ${n(8)}.`),
      options: numericOptions([7, 8, 9], 'pattern'), correctId: 'pattern-1',
    },
    {
      id: 'forest-bridge', kind: 'sum', title: text('2 · สะพานหิน', '2 · Stone bridge'),
      prompt: text(`แตะเลือกหินหลายก้อนให้ผลรวมเท่ากับ ${n(6)} เพื่อสร้างสะพาน แต่ละก้อนใช้ได้ครั้งเดียว แตะซ้ำเพื่อนำออกได้`, `Select stones totaling exactly ${n(6)} to build the bridge. Use each stone once; tap again to remove it.`),
      hint: text(`ลองจับคู่ ${n(1)} กับ ${n(5)} หรือรวม ${n(1)} + ${n(2)} + ${n(3)}`, `Try ${n(1)} with ${n(5)}, or ${n(1)} + ${n(2)} + ${n(3)}.`),
      options: numericOptions([1, 2, 3, 5], 'stone'), target: rounded(6 * unit),
    },
    {
      id: 'forest-path', kind: 'choice', title: text('3 · ทางแยกเสบียง', '3 · Supply crossroads'),
      prompt: text(`ต้องถึงค่ายภายใน ${n(8)} นาที และใช้เสบียงไม่เกิน ${n(7)} หน่วย เลือกทางที่ทำได้ครบทั้งสองเงื่อนไข`, `Reach camp within ${n(8)} minutes using at most ${n(7)} supply units. Choose the path meeting both conditions.`),
      hint: text(`ตรวจทั้งเวลาและเสบียง ทาง A ใช้ ${n(6)} นาทีและ ${n(6)} หน่วย จึงไม่เกินทั้งสองขีดจำกัด`, `Check time and supplies: path A uses ${n(6)} minutes and ${n(6)} units, within both limits.`),
      options: [[6, 6], [5, 8], [9, 4]].map(([time, supply], index) => ({ id: `path-${index}`, label: `${'ABC'[index]} · ${n(time)} ${text('นาที', 'min')} / ${n(supply)} ${text('เสบียง', 'supplies')}`, time: rounded(time * unit), supply: rounded(supply * unit) })),
      correctId: 'path-0', budget: rounded(7 * unit), timeBudget: rounded(8 * unit),
    },
    {
      id: 'forest-camp', kind: 'choice', title: text('4 · ค่ายแบ่งปัน', '4 · Sharing camp'),
      prompt: text(`มีเสบียง ${n(12)} หน่วย แบ่งให้เพื่อน 3 คนเท่า ๆ กัน แต่ละคนได้กี่หน่วย?`, `Share ${n(12)} supply units equally among 3 friends. How many units does each friend get?`),
      hint: text(`จัดเป็น 3 กลุ่มเท่ากัน: ${n(4)} + ${n(4)} + ${n(4)} = ${n(12)}`, `Make 3 equal groups: ${n(4)} + ${n(4)} + ${n(4)} = ${n(12)}.`),
      options: numericOptions([3, 5, 4], 'camp'), correctId: 'camp-2',
    },
    {
      id: 'forest-guardian', kind: 'route', title: text('5 · ผู้พิทักษ์เขาวงกต', '5 · Maze guardian'),
      prompt: text(`วางลำดับแวะ A, B, C ให้ครบจุดละหนึ่งครั้ง เริ่ม S และจบ E รวมระยะไม่เกิน ${n(9)} หน่วย ทุกเส้นเดินได้สองทาง แตะจุดตามลำดับ แล้วตรวจแผน`, `Visit A, B and C exactly once in your chosen order, starting at S and ending at E. Total distance must be at most ${n(9)} units. Every path works both ways. Tap the stops in order, then check your plan.`),
      hint: text(`ลอง S → A → B → C → E: ${n(2)} + ${n(1)} + ${n(2)} + ${n(2)} = ${n(7)} ยังมีแผนอื่นที่ผ่านได้`, `Try S → A → B → C → E: ${n(2)} + ${n(1)} + ${n(2)} + ${n(2)} = ${n(7)}. Other valid plans also exist.`),
      options: [{ id: 'A', label: text('A · ลำธาร', 'A · Stream') }, { id: 'B', label: text('B · ต้นไม้ใหญ่', 'B · Great tree') }, { id: 'C', label: text('C · ลานเห็ด', 'C · Mushroom clearing') }],
      edges: [['S', 'A', 2], ['S', 'B', 3], ['S', 'C', 4], ['A', 'B', 1], ['A', 'C', 3], ['B', 'C', 2], ['A', 'E', 4], ['B', 'E', 3], ['C', 'E', 2]].map(([from, to, cost]) => ({ from, to, cost: rounded(cost * unit) })),
      start: 'S', end: 'E', budget: rounded(9 * unit),
    },
  ];
}

function validSelection(stage, selection) {
  return stage && Array.isArray(stage.options) && Array.isArray(selection) && selection.length <= stage.options.length && new Set(selection).size === selection.length && selection.every(id => stage.options.some(option => option.id === id));
}

/** Complete waypoint permutations only; both directions of each edge are allowed. */
export function routeDistance(stage, selection) {
  if (stage?.kind !== 'route' || !validSelection(stage, selection) || selection.length !== stage.options.length || !Array.isArray(stage.edges)) return null;
  const route = [stage.start, ...selection, stage.end];
  let distance = 0;
  for (let index = 1; index < route.length; index++) {
    const edge = stage.edges.find(item => (item.from === route[index - 1] && item.to === route[index]) || (item.to === route[index - 1] && item.from === route[index]));
    if (!edge || !Number.isFinite(edge.cost) || edge.cost < 0) return null;
    distance += edge.cost;
  }
  return rounded(distance);
}

/** Invalid means incomplete/malformed and never consumes a ranked attempt. */
export function evaluateStage(stage, selection) {
  if (!validSelection(stage, selection)) return { valid: false, correct: false };
  if (stage.kind === 'choice') return { valid: selection.length === 1, correct: selection.length === 1 && selection[0] === stage.correctId };
  if (stage.kind === 'sum') return { valid: selection.length > 0, correct: selection.length > 0 && near(selection.reduce((sum, id) => sum + stage.options.find(option => option.id === id).value, 0), stage.target) };
  if (stage.kind === 'route') {
    const distance = routeDistance(stage, selection);
    return { valid: distance !== null, correct: distance !== null && distance <= stage.budget + 1e-8 };
  }
  return { valid: false, correct: false };
}

export function createAdventureRun(grade, mode, { now = clockNow(), cleared = 0 } = {}) {
  if (!validGrade(grade)) throw new RangeError('grade must be 1–6');
  if (!['practice', 'ranked'].includes(mode)) throw new RangeError('mode must be practice or ranked');
  if (!Number.isFinite(now) || now < 0) throw new RangeError('now must be a nonnegative timestamp');
  if (!Number.isInteger(cleared) || cleared < 0 || cleared > 5) throw new RangeError('cleared must be 0–5');
  const index = mode === 'practice' ? Math.min(cleared, 4) : 0;
  return {
    campaign: 'forest', version: ADVENTURE_VERSION, rulesVersion: RULES_VERSION, grade, mode,
    stages: createForestStages(grade), index, cleared: mode === 'practice' ? cleared : 0,
    results: Array.from({ length: 5 }, (_, stageIndex) => ({ submitted: stageIndex < index, correct: stageIndex < index, attempts: 0, hinted: false, selection: [] })),
    startedAt: now, lastNow: now, deadline: mode === 'ranked' ? now + LIMIT_MS : null,
    elapsedMs: null, finished: false, expired: false,
  };
}

/** Returns true while active. Expiry freezes elapsedMs and prevents every action. */
export function checkAdventureDeadline(run, now = clockNow()) {
  if (!run || run.finished || !Number.isFinite(now)) return false;
  run.lastNow = Math.max(run.lastNow, now);
  if (run.mode === 'ranked' && run.lastNow >= run.deadline) {
    run.finished = true; run.expired = true; run.elapsedMs = LIMIT_MS;
    return false;
  }
  return true;
}

/** Mutators return true only when they change state; selections use option IDs. */
export function selectAdventure(run, id, now = clockNow()) {
  if (!checkAdventureDeadline(run, now)) return false;
  const stage = run.stages[run.index], result = run.results[run.index];
  if (result.submitted || !stage.options.some(option => option.id === id)) return false;
  if (stage.kind === 'choice') { if (result.selection[0] === id) return false; result.selection = [id]; }
  else if (stage.kind === 'sum') { const index = result.selection.indexOf(id); if (index < 0) result.selection.push(id); else result.selection.splice(index, 1); }
  else { if (result.selection.includes(id)) return false; result.selection.push(id); }
  return true;
}

export function undoAdventure(run, now = clockNow()) {
  if (!checkAdventureDeadline(run, now)) return false;
  const result = run.results[run.index];
  if (result.submitted || !result.selection.length) return false;
  result.selection.pop(); return true;
}

export function submitAdventure(run, now = clockNow()) {
  if (!checkAdventureDeadline(run, now)) return { valid: false, correct: false };
  const result = run.results[run.index];
  if (result.submitted) return { valid: false, correct: result.correct };
  const evaluated = evaluateStage(run.stages[run.index], result.selection);
  if (!evaluated.valid) return evaluated;
  result.attempts++; result.correct = evaluated.correct;
  result.submitted = run.mode === 'ranked' || evaluated.correct;
  if (evaluated.correct) run.cleared = Math.max(run.cleared, run.index + 1);
  return evaluated;
}

export function hintAdventure(run, now = clockNow()) {
  if (!checkAdventureDeadline(run, now) || run.mode !== 'practice') return false;
  const result = run.results[run.index];
  if (result.submitted || result.hinted) return false;
  result.hinted = true; return true;
}

export function nextAdventure(run, now = clockNow()) {
  if (!checkAdventureDeadline(run, now) || !run.results[run.index].submitted) return false;
  if (run.index < 4) run.index++;
  else { run.finished = true; run.elapsedMs = Math.max(1, Math.floor(run.lastNow - run.startedAt)); }
  return true;
}

export function adventureScore(run) {
  if (!run || !Array.isArray(run.results)) return 0;
  const correct = run.results.filter(result => result.submitted && result.correct).length;
  const bonus = correct > 0 && run.mode === 'ranked' && run.finished && !run.expired && run.results.every(result => result.submitted) && Number.isInteger(run.elapsedMs) && run.elapsedMs > 0 && run.elapsedMs < LIMIT_MS ? Math.floor(99 * (LIMIT_MS - run.elapsedMs) / LIMIT_MS) : 0;
  return correct * 1000 + bonus;
}
