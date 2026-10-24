import { FRACTION_CHAPTERS, FRACTION_LEVELS, createFractionQuest, currentFractionLevel, actFractionQuest, undoFractionQuest, resetFractionQuest, hintFractionQuest, checkFractionQuest, answerFractionReasoning, equationFractionQuest } from './fraction-quest.js';
import { trackGameStart, trackGameComplete } from './analytics.js';

const STORAGE_KEY = 'mw-fraction-quest-v1';
const el = (tag, className = '', text = '') => {
  const node = document.createElement(tag); node.className = className;
  if (text !== '') node.textContent = text;
  return node;
};
const svg = (tag, attrs = {}) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
};
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const fraction = (numerator, denominator) => {
  const divisor = gcd(Math.abs(numerator), denominator) || 1;
  return numerator === 0 ? '0' : numerator === denominator ? '1' : `${numerator / divisor}/${denominator / divisor}`;
};

/** Untimed fraction workshops. Completion is a local collection, not a mastery score. */
export function createFractionQuestController(panel, { onHome = () => {}, playEffect = () => {}, celebrate = () => {} } = {}) {
  let active = false, language = 'th', screen = 'map', game = null, confirmRestart = false;
  let progress = { completedIds: [], hintedIds: [] }, storageAvailable = true, loaded = false, runCompleted = false, reasoningCelebrated = false;
  let feedbackNode = null, worldHost = null, world = null, worldToken = 0, worldLoading = false;
  const tr = (th, en) => language === 'en' ? en : th;
  const local = value => typeof value === 'string' ? value : value?.[language] || value?.th || '';
  const sound = name => { try { playEffect(name); } catch {} };
  const indexOf = id => FRACTION_LEVELS.findIndex(level => level.id === id);
  const chapterLevels = id => FRACTION_LEVELS.filter(level => level.chapterId === id);
  const isUnlocked = id => {
    const level = FRACTION_LEVELS.find(item => item.id === id);
    if (!level) return false;
    const levels = chapterLevels(level.chapterId), index = levels.findIndex(item => item.id === id);
    return index === 0 || levels.slice(0, index).every(item => progress.completedIds.includes(item.id));
  };
  const button = (label, action, className = 'fq-button', id) => {
    const node = el('button', className, label); node.type = 'button';
    if (id) node.id = id;
    node.addEventListener('click', action); return node;
  };
  function loadProgress() {
    if (loaded) return;
    loaded = true;
    try {
      if (!globalThis.localStorage) throw new Error('unavailable');
      const raw = globalThis.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.version !== 1 || !Array.isArray(data.completedIds) || !Array.isArray(data.hintedIds)) throw new Error('invalid progress');
      // Each workshop has its own path, so all three games can be explored first.
      for (const chapter of FRACTION_CHAPTERS) {
        for (const level of chapterLevels(chapter.id)) {
          if (!data.completedIds.includes(level.id)) break;
          progress.completedIds.push(level.id);
        }
      }
      progress.hintedIds = progress.completedIds.filter(id => data.hintedIds.includes(id));
    } catch { storageAvailable = false; }
  }
  function saveProgress() {
    try {
      if (!globalThis.localStorage) throw new Error('unavailable');
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...progress }));
      storageAvailable = true;
    } catch { storageAvailable = false; }
  }
  function rememberCompletion() {
    if (!game?.solved) return;
    if (!progress.completedIds.includes(game.levelId)) {
      progress.completedIds.push(game.levelId);
      if (game.hintCount > 0) progress.hintedIds.push(game.levelId);
      saveProgress();
    }
    if (!runCompleted) { runCompleted = true; trackGameComplete('fraction-quest'); }
  }
  function openLevel(id) {
    if (!active || !isUnlocked(id)) return false;
    game = createFractionQuest({ levelId: id, language, completedIds: progress.completedIds });
    screen = 'play'; confirmRestart = false; runCompleted = false; reasoningCelebrated = false;
    trackGameStart('fraction-quest'); render(true); return true;
  }
  function openChapter(id) {
    const levels = chapterLevels(id);
    if (!active || !levels.length) return false;
    return openLevel((levels.find(level => !progress.completedIds.includes(level.id)) || levels[0]).id);
  }
  function apply(action) {
    if (!active || screen !== 'play' || !game || game.solved) return false;
    const next = actFractionQuest(game, action);
    if (next === game) return false;
    game = next; sound('tap'); render(); return true;
  }
  function undo() {
    if (!active || screen !== 'play' || !game || game.solved || !game.history.length) return false;
    game = undoFractionQuest(game); sound('tap'); render(); return true;
  }
  function reset() {
    if (!active || screen !== 'play' || !game || game.solved) return false;
    game = resetFractionQuest(game); sound('tap'); render(); return true;
  }
  function hint() {
    if (!active || screen !== 'play' || !game || game.solved || game.hintCount >= currentFractionLevel(game).hints.length) return false;
    const next = hintFractionQuest(game);
    if (next === game) return false;
    game = next; render(); return true;
  }
  function check() {
    if (!active || screen !== 'play' || !game || game.solved) return false;
    game = checkFractionQuest(game); sound(game.solved ? 'success' : 'retry');
    rememberCompletion(); render(); return game.solved;
  }
  function reason(id) {
    if (!active || screen !== 'play' || !game?.solved) return false;
    game = answerFractionReasoning(game, id);
    if (game.reasoning?.correct && !reasoningCelebrated) { reasoningCelebrated = true; try { celebrate('success'); } catch {} }
    render(); return game.reasoning?.correct || false;
  }
  function next() {
    if (!active || screen !== 'play' || !game?.solved) return false;
    rememberCompletion();
    const level = currentFractionLevel(game), levels = chapterLevels(level.chapterId);
    const following = levels[levels.findIndex(item => item.id === game.levelId) + 1];
    if (following) return openLevel(following.id);
    if (progress.completedIds.length === FRACTION_LEVELS.length) { screen = 'summary'; sound('complete'); }
    else screen = 'map';
    render(true); return true;
  }
  function map() {
    if (!active) return false;
    rememberCompletion(); screen = 'map'; confirmRestart = false; render(true); return true;
  }
  function restart() {
    if (!active || !confirmRestart) return false;
    progress = { completedIds: [], hintedIds: [] }; game = null; saveProgress();
    screen = 'map'; confirmRestart = false; render(true); return true;
  }
  function storageNote() {
    return el('p', 'fq-storage', storageAvailable
      ? tr('บันทึกความคืบหน้าไว้ในเบราว์เซอร์นี้แล้ว · กลับมาเล่นซ้ำได้', 'Progress is saved in this browser · Replay completed stops anytime')
      : tr('บันทึกความคืบหน้าไม่ได้ · ถ้าปิดหน้านี้จะต้องเริ่มใหม่', 'Saving is unavailable · Progress lasts for this open session'));
  }
  function hero(shell) {
    const header = el('header', 'fq-top'), copy = el('div');
    copy.append(el('span', 'fq-eyebrow', tr('MATH WIZARD · สมาคมนักปรุงแสง', 'MATH WIZARD · THE LIGHTMAKERS GUILD')));
    const title = el('h1', '', tr('หมู่เกาะนักปรุงเศษส่วน', 'The Fraction Alchemists')); title.id = 'fq-heading'; title.tabIndex = -1;
    copy.append(title, el('p', 'fq-subtitle', tr('สร้างสะพาน แบ่งคริสตัล แล้วปรุงแสงให้โลก', 'Build bridges, split crystals, and brew a little light.')));
    header.append(copy, button(tr('กลับไปเลือกเกม', 'Back to games'), () => { deactivate(); onHome(); }, 'fq-button fq-quiet', 'fq-home'));
    shell.append(header);
  }
  function islandArt() {
    const art = el('div', 'fq-island-art');
    art.setAttribute('role', 'img');
    art.setAttribute('aria-label', tr(`หมู่เกาะลอยฟ้า เติมแสงแล้ว ${progress.completedIds.length} จาก 12 จุด`, `Floating workshops: ${progress.completedIds.length} of 12 lights restored`));
    const image = svg('svg', { viewBox: '0 0 900 290', 'aria-hidden': 'true', focusable: 'false' });
    image.append(svg('path', { d: 'M20 228 Q130 175 290 218 Q417 262 573 211 Q733 174 887 225', fill: 'none', stroke: '#d7eeec', 'stroke-width': 28, 'stroke-linecap': 'round' }));
    const colors = ['#72b5a1', '#b6a0d6', '#ecb16a'];
    for (let n = 0; n < 3; n++) {
      const x = 160 + n * 290;
      image.append(svg('path', { d: `M${x - 109} 170 L${x} 116 L${x + 110} 170 L${x + 61} 212 L${x - 50} 225 Z`, fill: colors[n] }));
      image.append(svg('path', { d: `M${x - 109} 170 L${x} 116 L${x + 110} 170 L${x} 192 Z`, fill: ['#c4e5c3', '#e8d8f2', '#f8dfb2'][n] }));
      image.append(svg('path', { d: `M${x - 29} 154 L${x - 22} 92 L${x + 23} 92 L${x + 30} 154 Z`, fill: '#fff9e4', stroke: '#6e807c', 'stroke-width': 3 }));
      image.append(svg('path', { d: `M${x - 34} 95 L${x} 60 L${x + 35} 95 Z`, fill: colors[n] }));
      image.append(svg('rect', { x: x - 9, y: 113, width: 18, height: 27, rx: 8, fill: colors[n] }));
      for (let i = 0; i < 4; i++) image.append(svg('path', { d: `M${x - 60 + i * 39} 163 l7 10 -7 10 -7 -10 Z`, fill: progress.completedIds.includes(chapterLevels(FRACTION_CHAPTERS[n].id)[i].id) ? '#fff4a2' : '#88a9a8', stroke: '#fff8e9', 'stroke-width': 2 }));
      if (n < 2) image.append(svg('path', { d: `M${x + 94} 174 Q${x + 147} 137 ${x + 197} 174`, fill: 'none', stroke: '#c89965', 'stroke-width': 8, 'stroke-dasharray': '14 6' }));
    }
    image.append(svg('circle', { cx: 820, cy: 48, r: 16, fill: '#ffdf98' }));
    art.append(image); return art;
  }
  function guide(text) {
    const box = el('div', 'fq-guide'), avatar = el('span', 'fq-guide-avatar', '✧'); avatar.setAttribute('aria-hidden', 'true');
    const copy = el('div'); copy.append(el('strong', '', tr('ลูมิ · นักปรุงแสงฝึกหัด', 'Lumi · Apprentice lightmaker')), el('p', '', text));
    box.append(avatar, copy); return box;
  }
  function renderMap(shell) {
    shell.append(guide(progress.completedIds.length === FRACTION_LEVELS.length
      ? tr('ทุกเกาะสว่างแล้ว! เลือกเกมที่ชอบมาเล่นอีกครั้งได้เลย', 'Every island glows! Choose a favourite workshop and experiment again.')
      : tr('ช่วยลูมิต่อสะพาน แบ่งคริสตัลเป็นชิ้นเล็ก ๆ และผสมน้ำผลไม้ตามสูตร ลองขยับชิ้นส่วนในทั้ง 3 เกม แล้วมาดูกันว่าเศษส่วนทำงานอย่างไร', 'Help Lumi cross the sky, split crystals without changing their value, and mix a precise recipe. Three games make fractions visible.')));
    const intro = el('div', 'fq-map-intro');
    intro.append(el('h2', '', tr('3 เกม · 12 ภารกิจ', '3 workshops · 12 missions')), el('p', '', tr(`เติมแสง ${progress.completedIds.length}/12 · พื้นฐานเศษส่วน ป.3 ขึ้นไป · ไม่จับเวลา`, `${progress.completedIds.length}/12 lights · Fraction foundations, Grade 3+ · No timer`)));
    shell.append(intro);
    const chapters = el('div', 'fq-chapters');
    FRACTION_CHAPTERS.forEach((chapter, n) => {
      const card = el('section', `fq-chapter fq-theme-${n}`);
      card.append(el('span', 'fq-chapter-icon', ['⌁', '◈', '⚗'][n]), el('span', 'fq-chapter-tag', tr(`เกมที่ ${n + 1}`, `WORKSHOP ${n + 1}`)), el('h3', '', local(chapter.title)), el('p', '', local(chapter.story)));
      const stops = el('div', 'fq-stops');
      const levels = FRACTION_LEVELS.filter(level => level.chapterId === chapter.id);
      levels.forEach(level => {
        const index = indexOf(level.id), done = progress.completedIds.includes(level.id), locked = !isUnlocked(level.id);
        const label = done ? tr('เล่นซ้ำ', 'Replay') : locked ? tr('ผ่านภารกิจก่อนหน้าเพื่อปลดล็อก', 'Complete the previous stop') : tr('เริ่มภารกิจ', 'Start mission');
        const stop = button('', () => openLevel(level.id), 'fq-stop' + (done ? ' done' : locked ? ' locked' : ' ready'), 'fq-stop-' + level.id);
        stop.append(el('span', 'fq-stop-number', done ? '✓' : String(index + 1)), el('span', 'fq-stop-title', local(level.title)), el('span', 'fq-stop-label', label));
        stop.disabled = locked; stop.setAttribute('aria-label', `${index + 1}. ${local(level.title)} · ${label}`); stops.append(stop);
      });
      const completed = levels.filter(level => progress.completedIds.includes(level.id)).length;
      card.append(stops, el('p', 'fq-chapter-count', tr(`แสง ${completed}/4 ดวง`, `${completed}/4 lights restored`))); chapters.append(card);
    });
    shell.append(chapters, el('p', 'fq-fine', tr('เกมนี้ช่วยฝึกพื้นฐานเศษส่วน เมื่อเล่นจบแล้ว ลองอธิบายวิธีคิดและฝึกโจทย์อื่นต่อได้', 'A foundation practice collection, not a mastery assessment or a complete grade curriculum.')), storageNote());
    if (progress.completedIds.length) {
      if (confirmRestart) {
        const confirm = el('div', 'fq-confirm');
        confirm.append(el('p', '', tr('เริ่มเกมนี้ใหม่ไหม? แสงที่สะสมไว้จะถูกล้าง แล้วเริ่มเก็บใหม่จาก 0 ดวง', 'Start these islands again? Your collection of 12 lights in this game will return to 0.')),
          button(tr('เก็บแสงเดิมไว้', 'Keep my lights'), () => { confirmRestart = false; render(); }, 'fq-button', 'fq-cancel-restart'),
          button(tr('ยืนยันเริ่มใหม่', 'Yes, start again'), restart, 'fq-button fq-quiet', 'fq-confirm-restart')); shell.append(confirm);
      } else shell.append(button(tr('ล้างความคืบหน้าแล้วเริ่มใหม่', 'Start new islands'), () => { confirmRestart = true; render(); }, 'fq-button fq-link', 'fq-restart'));
    }
  }
  function fractionLabel(numerator, denominator, unit = '') {
    const value = el('span', 'fq-fraction', `${numerator}/${denominator}${unit}`);
    value.setAttribute('aria-label', tr(`${numerator} ส่วน ${denominator}${unit}`, `${numerator} over ${denominator}${unit}`)); return value;
  }
  function fractionBar(numerator, denominator, label, color = '', blueNumerator = 0) {
    const group = el('div', 'fq-model-group');
    const caption = el('div', 'fq-model-label'); caption.append(el('span', '', label), fractionLabel(numerator, denominator));
    const bar = el('div', 'fq-fraction-bar ' + color); bar.style.setProperty('--fq-parts', denominator);
    bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', `${label}: ${numerator}/${denominator}`);
    for (let i = 0; i < denominator; i++) {
      const cell = el('span', 'fq-part' + (i < numerator ? ' filled' : i < numerator + blueNumerator ? ' blue' : ''));
      cell.setAttribute('aria-hidden', 'true'); bar.append(cell);
    }
    group.append(caption, bar); return group;
  }
  function bridgeBoard(level) {
    const board = el('div', 'fq-board');
    board.append(fractionBar(game.model.ticks, 24, tr('สะพานที่สร้างแล้ว', 'Bridge built'), 'fq-mint'));
    board.append(el('p', 'fq-board-caption', tr(`สะพานยาว ${fraction(game.model.ticks, 24)} หน่วยแล้ว · แต่ละช่องยาวเท่ากัน ช่องละ 1/24 หน่วย`, `Current length: ${fraction(game.model.ticks, 24)} of 1 whole · Equal small spaces are 1/24 each`)));
    const target = level.goal.targetTicks ?? 24;
    board.append(el('p', 'fq-goal', tr(`เป้าหมาย ${fraction(target, 24)} หน่วย${level.goal.requiredPlanks ? ` โดยใช้ ${level.goal.requiredPlanks} แผ่น` : ''}`, `Goal: ${fraction(target, 24)} whole${level.goal.requiredPlanks ? ` using ${level.goal.requiredPlanks} planks` : ''}`)));
    const tiles = el('div', 'fq-inventory');
    level.planks.forEach((plank, n) => {
      const used = game.model.used.includes(plank.id);
      const tile = button('', () => apply({ type: 'plank', plankId: plank.id }), 'fq-button fq-item' + (used ? ' used' : ''), 'fq-plank-' + plank.id);
      tile.append(el('span', 'fq-item-name', tr(`แผ่น ${n + 1}`, `Plank ${n + 1}`)), fractionLabel(plank.numerator, plank.denominator), el('span', 'fq-item-status', used ? tr('✓ ใช้แล้ว', '✓ Used') : tr('ต่อสะพาน', 'Add to bridge')));
      tile.disabled = game.solved || used || game.model.ticks + plank.ticks > target || Boolean(level.goal.requiredPlanks && game.model.used.length >= level.goal.requiredPlanks); tiles.append(tile);
    });
    board.append(tiles, el('p', 'fq-board-caption', tr('แต่ละแผ่นใช้ได้ครั้งเดียว · ใช้แถบ 0–1 เทียบความยาวของทุกแผ่น · กดย้อนกลับเพื่อเปลี่ยนแผ่นได้', 'Use each plank once · Every plank refers to the same whole · Undo to try another plan'))); return board;
  }
  function equivalentBoard(level) {
    const board = el('div', 'fq-board');
    const initial = level.initial;
    const models = el('div', 'fq-comparison');
    models.append(fractionBar(initial.numerator, initial.denominator, tr('คริสตัลต้นแบบ', 'Original crystal'), 'fq-lilac'), fractionBar(game.model.numerator, game.model.denominator, tr('คริสตัลของเรา', 'Your crystal'), 'fq-lilac'));
    board.append(models, el('p', 'fq-board-caption', tr('แถบทั้งสองยาวเท่ากัน · ลองเปลี่ยนจำนวนชิ้น โดยให้พื้นที่ระบายสีเท่าเดิม', 'Both bars are the same-sized whole · Change the number of pieces, keep the shaded amount')),
      el('p', 'fq-goal', tr(`แบ่งให้ได้ทั้งหมด ${level.goal.denominator} ช่องเท่า ๆ กัน โดยให้พื้นที่ระบายสีเท่าเดิม`, `Make an equivalent fraction with denominator ${level.goal.denominator}`)));
    const tools = el('div', 'fq-transform-tools');
    [2, 3].forEach(factor => {
      const split = button(tr(`แบ่งแต่ละชิ้นเป็น ${factor} ชิ้นเท่า ๆ กัน`, `Split every piece into ${factor}`), () => apply({ type: 'split', factor }), 'fq-button', 'fq-split-' + factor);
      split.disabled = game.solved || !level.allowedDenominators.includes(game.model.denominator * factor);
      const merge = button(tr(`รวมทุก ${factor} ชิ้นเป็นชิ้นเดียว`, `Merge every ${factor} pieces into 1`), () => apply({ type: 'merge', factor }), 'fq-button fq-quiet', 'fq-merge-' + factor);
      merge.disabled = game.solved || game.model.numerator % factor !== 0 || !level.allowedDenominators.includes(game.model.denominator / factor);
      tools.append(split, merge);
    });
    board.append(tools); return board;
  }
  function potionBoard(level) {
    const board = el('div', 'fq-board'), model = game.model;
    const recipe = el('div', 'fq-recipe'); recipe.append(el('h3', '', tr('สูตรแสงประจำเกาะ', 'The island’s light recipe')));
    const ingredients = el('div', 'fq-recipe-values');
    [[tr('น้ำผลไม้สีแดง', 'Red juice'), level.goal.redTicks, 'fq-amber-text'], [tr('น้ำผลไม้สีน้ำเงิน', 'Blue juice'), level.goal.blueTicks, 'fq-blue-text']].forEach(([name, ticks, color]) => {
      const item = el('p', color); item.append(el('strong', '', name), el('span', 'fq-fraction', `${fraction(ticks, 24)} L`)); ingredients.append(item);
    });
    recipe.append(ingredients); board.append(recipe);
    const mix = fractionBar(model.redTicks, 24, tr('ขวดของเรา · จุได้ 1 ลิตร', 'Your bottle · 1 bottle = 1 L'), 'fq-amber', model.blueTicks);
    // This is a combined one-litre model; each ingredient is also named and measured below.
    mix.setAttribute('aria-label', tr(`ในขวดมีน้ำผลไม้สีแดง ${fraction(model.redTicks, 24)} ลิตร และน้ำผลไม้สีน้ำเงิน ${fraction(model.blueTicks, 24)} ลิตร`, `Bottle contains red ${fraction(model.redTicks, 24)} litres and blue ${fraction(model.blueTicks, 24)} litres`));
    const barImage = mix.querySelector('.fq-fraction-bar');
    barImage?.setAttribute('aria-label', mix.getAttribute('aria-label'));
    const mixLabel = mix.querySelector('.fq-fraction');
    if (mixLabel) {
      const total = fraction(model.redTicks + model.blueTicks, 24);
      mixLabel.textContent = `${total} L`;
      mixLabel.setAttribute('aria-label', tr(`รวม ${total} ลิตร`, `Total ${total} litres`));
    }
    board.append(mix, el('p', 'fq-mixture-label', tr(`แดง ${fraction(model.redTicks, 24)} L + น้ำเงิน ${fraction(model.blueTicks, 24)} L · ความจุ 1 L`, `Red ${fraction(model.redTicks, 24)} L + Blue ${fraction(model.blueTicks, 24)} L · Capacity 1 L`)));
    const inventory = el('div', 'fq-inventory');
    level.doses.forEach((dose, n) => {
      const used = model.used.includes(dose.id), amber = dose.ingredient === 'red';
      const tile = button('', () => apply({ type: 'pour', doseId: dose.id }), 'fq-button fq-item ' + (amber ? 'fq-amber-item' : 'fq-blue-item') + (used ? ' used' : ''), 'fq-dose-' + dose.id);
      tile.append(el('span', 'fq-item-name', tr(`${amber ? 'แดง' : 'น้ำเงิน'} ${n + 1}`, `${amber ? 'Red' : 'Blue'} ${n + 1}`)), fractionLabel(dose.numerator, dose.denominator, ' L'), el('span', 'fq-item-status', used ? tr('✓ เทแล้ว', '✓ Poured') : tr('เทลงขวด', 'Pour into bottle')));
      tile.disabled = game.solved || used || model.redTicks + model.blueTicks + dose.ticks > (level.capacityTicks ?? 24); inventory.append(tile);
    });
    board.append(inventory, el('p', 'fq-board-caption', tr('ถ้วยแต่ละใบเทได้ครั้งเดียว · ตวงทั้งสีแดงและสีน้ำเงินให้ตรงตามสูตร', 'Every measure uses the same litre · Pour each vial once · Match both ingredients'))); return board;
  }
  function renderPlay(shell) {
    const level = currentFractionLevel(game), index = indexOf(game.levelId);
    const nav = el('div', 'fq-play-nav'); nav.append(button(tr('← แผนที่หมู่เกาะ', '← Island map'), map, 'fq-button fq-quiet', 'fq-map'), el('span', 'fq-progress-label', tr(`ภารกิจ ${index + 1}/12 · ${level.chapterTitle}`, `Mission ${index + 1}/12 · ${level.chapterTitle}`))); shell.append(nav);
    const card = el('section', 'fq-play-card fq-kind-' + level.kind);
    const title = el('h2', '', level.title); title.id = 'fq-level-heading'; title.tabIndex = -1;
    card.append(title, guide(level.prompt));
    const equation = el('div', 'fq-equation-scroll'); equation.tabIndex = 0; equation.setAttribute('role', 'region'); equation.setAttribute('aria-label', tr('สมการเศษส่วน เลื่อนได้เมื่อข้อความยาว', 'Fraction equation. Scroll if needed.'));
    equation.append(el('div', 'fq-equation', equationFractionQuest(game))); card.append(equation);
    card.append(level.kind === 'bridge' ? bridgeBoard(level) : level.kind === 'equivalent' ? equivalentBoard(level) : potionBoard(level));
    const tools = el('div', 'fq-tools');
    const back = button(tr('↶ ย้อนกลับ 1 ครั้ง', '↶ Undo'), undo, 'fq-button fq-quiet', 'fq-undo'); back.disabled = game.solved || !game.history.length;
    const clear = button(tr('เริ่มภารกิจนี้ใหม่', 'Reset this mission'), reset, 'fq-button fq-quiet', 'fq-reset'); clear.disabled = game.solved || !game.history.length;
    const help = button(tr('✧ ขอคำใบ้', '✧ A little help'), hint, 'fq-button fq-quiet', 'fq-hint'); help.disabled = game.solved || game.hintCount >= level.hints.length;
    const submit = button(tr('ตรวจคำตอบ', 'Check the fraction magic'), check, 'fq-button fq-primary', 'fq-check'); submit.disabled = game.solved;
    tools.append(back, clear, help, submit); card.append(tools);
    if (game.hintCount) {
      const hints = el('aside', 'fq-hints'); hints.append(el('strong', '', tr('ลูมิช่วยคิด…', 'Lumi’s thinking tips…')));
      level.hints.slice(0, game.hintCount).forEach(text => hints.append(el('p', '', text))); card.append(hints);
    }
    if (!feedbackNode) feedbackNode = el('div', 'fq-feedback');
    feedbackNode.id = 'fq-feedback'; feedbackNode.className = 'fq-feedback' + (game.feedback ? ' ' + game.feedback.tone : '');
    feedbackNode.setAttribute('role', 'status'); feedbackNode.setAttribute('aria-live', 'polite'); feedbackNode.setAttribute('aria-atomic', 'true'); card.append(feedbackNode);
    if (game.solved) {
      const success = el('div', 'fq-success');
      success.append(el('span', 'fq-success-light', '✦'), el('h3', '', tr('แสงดวงใหม่พร้อมแล้ว!', 'A new light is ready!')), el('p', '', game.hintCount
        ? tr('สำเร็จแล้ว! คำใบ้ช่วยให้เราเรียนรู้ได้ ลองเล่าวิธีคิดของเราได้เลย', 'Completed with a hint · Asking for help is part of learning')
        : tr('สำเร็จโดยไม่ใช้คำใบ้! ลองเล่าวิธีคิดของเราได้เลย', 'Completed without opening a hint · Try sharing your thinking')));
      if (level.reasoning) {
        const reflection = el('div', 'fq-reasoning'); reflection.append(el('p', 'fq-optional', tr('ชวนคิดต่อ · ข้ามได้', 'A thinking moment · Optional')), el('h3', '', level.reasoning.prompt));
        const choices = el('div', 'fq-reason-options');
        level.reasoning.options.forEach(option => {
          const choice = button(option.label, () => reason(option.id), 'fq-button fq-reason' + (game.reasoning?.selectedId === option.id ? ' selected' : ''), 'fq-reason-' + option.id);
          choice.setAttribute('aria-pressed', String(game.reasoning?.selectedId === option.id)); choices.append(choice);
        });
        reflection.append(choices); success.append(reflection);
      }
      const atChapterEnd = chapterLevels(level.chapterId).at(-1).id === game.levelId;
      success.append(button(atChapterEnd ? progress.completedIds.length === FRACTION_LEVELS.length ? tr('ชมหมู่เกาะที่เราสร้าง →', 'See our glowing islands →') : tr('เลือกเกมต่อไป →', 'Choose another workshop →') : tr('ไปภารกิจถัดไป →', 'Next mission →'), next, 'fq-button fq-primary', 'fq-next')); card.append(success);
    }
    shell.append(card, storageNote());
  }
  function renderSummary(shell) {
    const card = el('section', 'fq-summary'), title = el('h2', '', tr('หมู่เกาะเปล่งแสงด้วยเศษส่วน!', 'The islands shine with fraction magic!'));
    title.id = 'fq-level-heading'; title.tabIndex = -1;
    card.append(el('span', 'fq-summary-medal', '✦'), title, el('p', '', tr(`เล่นครบ ${progress.completedIds.length}/12 ภารกิจ · 3 เกมแห่งการทดลอง`, `${progress.completedIds.length}/12 missions completed · Three games of discovery`)),
      el('p', '', tr(`ใช้คำใบ้ตอนผ่านครั้งแรก ${progress.hintedIds.length} ภารกิจ · ขอคำใบ้ช่วยได้เสมอ`, `Hints used on first completion: ${progress.hintedIds.length} stops · Help is always welcome`)),
      el('p', 'fq-summary-topics', tr('สะพานเศษส่วน · เศษส่วนที่เท่ากัน · การตวงและผสมตามสูตร', 'Fraction bridges · Equivalent fractions · Measuring and mixing recipes')),
      el('p', 'fq-fine', tr('ลองเล่าว่าแต่ละเกมใช้วิธีคิดอย่างไร แล้วหาโจทย์ใหม่มาฝึกต่อกันได้เลย', 'This records completion. Keep exploring by explaining your thinking and trying a new problem.')),
      button(tr('กลับไปเล่นภารกิจที่ชอบ', 'Replay a favourite mission'), map, 'fq-button fq-primary', 'fq-summary-map'));
    shell.append(card, storageNote());
  }
  function worldData() { return { state: screen === 'play' ? game : null, level: screen === 'play' && game ? currentFractionLevel(game) : null, completedIds: progress.completedIds, language }; }
  function render(focusHeading = false) {
    if (!active) return;
    const focusedId = document.activeElement?.id;
    const previousScroll = panel.querySelector('.fq-equation-scroll')?.scrollLeft || 0;
    const shell = el('div', 'fraction-quest-shell'); shell.setAttribute('lang', language); hero(shell);
    if (!worldHost) { worldHost = el('div', 'fq-world-host'); worldHost.dataset.world3d = 'loading'; }
    const worldWrap = el('div', 'fq-world-wrap'); worldWrap.append(worldHost, islandArt(), el('p', 'fq-world-caption', tr('สำรวจโลก 3D แล้วใช้ปุ่มด้านล่างลองเล่นกับเศษส่วน', 'A 3D world for your adventure · Use the controls below to explore fractions'))); shell.append(worldWrap);
    if (screen === 'play') renderPlay(shell); else if (screen === 'summary') renderSummary(shell); else renderMap(shell);
    const message = screen === 'play' ? game.reasoning?.message?.[language] || game.reasoning?.feedback || game.feedback?.message?.[language] || game.feedback?.text || '' : '';
    panel.replaceChildren(shell);
    if (screen === 'play' && feedbackNode) feedbackNode.textContent = message;
    const equationScroll = panel.querySelector('.fq-equation-scroll'); if (equationScroll && !focusHeading) equationScroll.scrollLeft = previousScroll;
    world?.update(worldData());
    if (focusHeading) (panel.querySelector('#fq-level-heading') || panel.querySelector('#fq-heading'))?.focus();
    else if (focusedId) {
      const target = panel.querySelector('#' + focusedId);
      if (target && !target.disabled) target.focus();
      else (panel.querySelector(game?.solved && screen === 'play' ? '#fq-next' : '#fq-check') || panel.querySelector('#fq-heading'))?.focus();
    }
  }
  async function loadWorld() {
    if (!active || world || worldLoading || typeof document.createElementNS !== 'function') return;
    const token = ++worldToken, host = worldHost; worldLoading = true;
    try {
      const { mountFractionWorld } = await import('./fraction-world-3d.js');
      if (!active || token !== worldToken) return;
      const mounted = await mountFractionWorld(host, { language, onAction: action => apply(action) });
      if (!active || token !== worldToken) { mounted?.dispose(); return; }
      world = mounted; world?.update(worldData());
    } catch { if (token === worldToken && host) host.dataset.world3d = 'fallback'; }
    finally { if (token === worldToken) worldLoading = false; }
  }
  function enter(options = {}) {
    language = options.language === 'en' ? 'en' : 'th'; active = true; loadProgress();
    if (game) game = { ...game, language };
    if (!options.chapter || !openChapter(options.chapter)) render(true);
    loadWorld(); return true;
  }
  function deactivate() {
    active = false; worldToken++; worldLoading = false; world?.dispose(); world = null;
    // A pending async scene owns its detached host. Re-entry gets a new host.
    worldHost = null;
  }
  function setLanguage(nextLanguage) {
    if (!['th', 'en'].includes(nextLanguage)) return false;
    language = nextLanguage; if (game) game = { ...game, language };
    if (active) render(); return true;
  }
  return { enter, deactivate, setLanguage,
    getState: () => ({ active, screen, language, game: game ? structuredClone(game) : null, progress: structuredClone(progress), storageAvailable }),
    actions: { openLevel, openChapter, apply, undo, reset, hint, check, reason, next, map, restart },
  };
}
