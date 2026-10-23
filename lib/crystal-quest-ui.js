import { CRYSTAL_CHAPTERS, CRYSTAL_LEVELS, createCrystalQuest, currentCrystalLevel, actCrystalQuest, undoCrystalQuest, resetCrystalQuest, hintCrystalQuest, checkCrystalQuest, answerCrystalReasoning, nextCrystalQuest, equationCrystalQuest } from './crystal-quest.js';
import { trackGameStart, trackGameComplete } from './analytics.js';

const STORAGE_KEY = 'mw-crystal-quest-v1';
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

/** A small, untimed early-primary quest. Its local collection never affects assessment ranks. */
export function createCrystalQuestController(panel, { onHome = () => {}, playEffect = () => {}, celebrate = () => {} } = {}) {
  let active = false, language = 'th', screen = 'map', game = null, confirmRestart = false;
  let progress = { completedIds: [], hintedIds: [] }, storageAvailable = true, loaded = false, runCompleted = false, reasoningCelebrated = false;
  let refs = {}, liveRegion = null, worldHost = null, world = null, worldToken = 0, worldLoading = false, lineObserver = null;
  const tr = (th, en) => language === 'en' ? en : th;
  const local = value => typeof value === 'string' ? value : value?.[language] || value?.th || '';
  const sound = name => { try { playEffect(name); } catch {} };
  const button = (label, action, className = 'cq-button', id) => {
    const node = el('button', className, label); node.type = 'button';
    if (id) node.id = id;
    node.addEventListener('click', action); return node;
  };
  const levelIndex = id => CRYSTAL_LEVELS.findIndex(level => level.id === id);
  function loadProgress() {
    if (loaded) return;
    loaded = true;
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (!globalThis.localStorage) { storageAvailable = false; return; }
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.version !== 1 || !Array.isArray(data.completedIds) || !Array.isArray(data.hintedIds)) return;
      // Only a contiguous completed path can unlock new stops.
      for (const level of CRYSTAL_LEVELS) {
        if (!data.completedIds.includes(level.id)) break;
        progress.completedIds.push(level.id);
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
    if (!runCompleted) { runCompleted = true; trackGameComplete('crystal-quest'); }
  }
  function openLevel(id) {
    if (!active || levelIndex(id) < 0 || levelIndex(id) > progress.completedIds.length) return false;
    game = createCrystalQuest({ levelId: id, language, completedIds: progress.completedIds });
    screen = 'play'; confirmRestart = false; runCompleted = false; reasoningCelebrated = false;
    trackGameStart('crystal-quest'); render(true); return true;
  }
  function apply(action) {
    if (!active || screen !== 'play' || !game || game.solved) return false;
    const next = actCrystalQuest(game, action);
    if (next === game) return false;
    game = next; sound('tap'); render(); return true;
  }
  function undo() {
    if (!active || screen !== 'play' || !game || game.solved) return false;
    game = undoCrystalQuest(game); sound('tap'); render(); return true;
  }
  function reset() {
    if (!active || screen !== 'play' || !game || game.solved) return false;
    game = resetCrystalQuest(game); sound('tap'); render(); return true;
  }
  function hint() {
    if (!active || screen !== 'play' || !game || game.solved) return false;
    game = hintCrystalQuest(game); render(); return true;
  }
  function check() {
    if (!active || screen !== 'play' || !game || game.solved) return false;
    game = checkCrystalQuest(game); sound(game.solved ? 'success' : 'retry');
    rememberCompletion(); render(); return game.solved;
  }
  function reason(id) {
    if (!active || screen !== 'play' || !game?.solved) return false;
    game = answerCrystalReasoning(game, id);
    if (game.reasoning?.correct && !reasoningCelebrated) { reasoningCelebrated = true; try { celebrate('success'); } catch {} }
    render(); return game.reasoning?.correct || false;
  }
  function next() {
    if (!active || screen !== 'play' || !game?.solved) return false;
    rememberCompletion(); game = nextCrystalQuest(game);
    if (game.finished) { screen = 'summary'; sound('complete'); }
    else { runCompleted = false; reasoningCelebrated = false; trackGameStart('crystal-quest'); }
    render(true); return true;
  }
  function map() {
    if (!active) return false;
    rememberCompletion(); screen = 'map'; confirmRestart = false; render(true); return true;
  }
  function restart() {
    if (!active || !confirmRestart) return false;
    progress = { completedIds: [], hintedIds: [] }; game = null; saveProgress();
    confirmRestart = false; screen = 'map'; render(true); return true;
  }
  function storageNote() {
    return el('p', 'cq-storage', storageAvailable
      ? tr('ความคืบหน้าเก็บไว้ในเบราว์เซอร์นี้ · กลับมาเล่นซ้ำได้', 'Progress is saved in this browser · Completed stops can be replayed')
      : tr('ครั้งนี้เก็บความคืบหน้าได้ระหว่างเปิดเกมเท่านั้น', 'Progress lasts for this open session because saving is unavailable'));
  }
  function hero(shell) {
    const top = el('header', 'cq-top'), copy = el('div');
    copy.append(el('span', 'cq-eyebrow', tr('MATH WIZARD · ภารกิจสร้างโลก', 'MATH WIZARD · WORLD QUEST')));
    const heading = el('h1', '', tr('เกาะคริสตัลที่หายไป', 'The lost crystal island')); heading.id = 'cq-heading'; heading.tabIndex = -1;
    copy.append(heading, el('p', 'cq-subtitle', tr('ขยับให้เห็น คิดให้เชื่อม แล้วเติมแสงให้เกาะ', 'Move, connect, and bring the island back to life.')));
    top.append(copy, button(tr('กลับไปเลือกเกม', 'Back to games'), () => { deactivate(); onHome(); }, 'cq-button cq-quiet', 'cq-home'));
    shell.append(top);
  }
  function island() {
    const completed = progress.completedIds.length;
    const scene = el('div', 'cq-island');
    scene.setAttribute('role', 'img');
    scene.setAttribute('aria-label', tr(`เกาะคริสตัล ฟื้นฟูแล้ว ${completed} จาก 9 จุด`, `Crystal island: ${completed} of 9 places restored`));
    const art = svg('svg', { viewBox: '0 0 760 290', 'aria-hidden': 'true', focusable: 'false' });
    art.append(svg('ellipse', { cx: 380, cy: 255, rx: 330, ry: 20, fill: '#c9e9e8' }));
    art.append(svg('path', { d: 'M63 184 Q74 105 208 115 Q303 57 408 97 Q542 47 669 142 L709 192 L653 239 L201 250 Z', fill: '#d5e8c1' }));
    art.append(svg('path', { d: 'M63 184 Q295 205 709 192 L653 239 L201 250 Z', fill: '#82b8a5' }));
    art.append(svg('path', { d: 'M100 182 Q190 210 273 166 Q356 121 421 155 Q475 187 553 139 Q618 111 657 151', fill: 'none', stroke: '#f9e4a5', 'stroke-width': 17, 'stroke-linecap': 'round' }));
    // Each restored stop adds one piece to a permanent, visible landscape.
    for (let i = 0; i < 3; i++) {
      const x = 145 + i * 43, lit = completed > i;
      const plant = svg('g', { class: lit ? 'cq-restored' : 'cq-dormant' });
      plant.append(svg('path', { d: `M${x} 170 v-37`, stroke: lit ? '#387b45' : '#829b8d', 'stroke-width': 5 }));
      plant.append(svg('ellipse', { cx: x - 8, cy: 147, rx: 12, ry: 7, fill: lit ? '#68ab51' : '#b9cbbd', transform: `rotate(25 ${x - 8} 147)` }));
      plant.append(svg('path', { d: `M${x} 104 l13 19 -13 19 -13 -19 Z`, fill: lit ? ['#f1bd62', '#ed9979', '#a48ada'][i] : '#b7c9c4', stroke: '#fff7df', 'stroke-width': 3 })); art.append(plant);
    }
    art.append(svg('path', { d: 'M324 180 Q355 115 393 170', fill: 'none', stroke: '#8cbec6', 'stroke-width': 29 }));
    for (let i = 0; i < 3; i++) art.append(svg('path', { d: `M${321 + i * 24} ${156 - (i === 1 ? 9 : 0)} l17 -4 4 10 -17 4 Z`, fill: completed > 3 + i ? '#bb8054' : '#c0caca', stroke: '#fff5dc', 'stroke-width': 2 }));
    art.append(svg('path', { d: 'M560 149 L572 79 L603 79 L615 149 Z', fill: completed > 6 ? '#fff2cc' : '#c2cdc2', stroke: '#689388', 'stroke-width': 3 }));
    art.append(svg('path', { d: 'M566 78 L588 53 L609 78 Z', fill: completed > 7 ? '#ef9a79' : '#99b3a7' }));
    art.append(svg('rect', { x: 576, y: 84, width: 23, height: 22, rx: 5, fill: completed > 8 ? '#ffe57c' : '#829c97' }));
    if (completed === 9) {
      art.append(svg('path', { d: 'M587 95 L485 54 L485 125 Z M598 95 L689 49 L689 123 Z', fill: '#ffeaaa', opacity: '.65' }));
      art.append(svg('path', { d: 'M382 29 l5 12 13 3 -13 5 -5 13 -4 -13 -13 -5 13 -3 Z', fill: '#daa846' }));
    }
    scene.append(art); return scene;
  }
  function npc(text, tone = '') {
    const box = el('div', 'cq-npc ' + tone), owl = el('span', 'cq-owl', '✦'); owl.setAttribute('aria-hidden', 'true');
    const words = el('div'); words.append(el('strong', '', tr('มิว · ผู้ดูแลเกาะ', 'Mew · Island keeper')), el('p', '', text));
    box.append(owl, words); return box;
  }
  function renderMap(shell) {
    shell.append(npc(progress.completedIds.length === 9
      ? tr('เกาะสว่างแล้ว! เลือกจุดเดิมเพื่อเล่นอีกครั้ง หรือชวนเพื่อนเล่าวิธีคิดให้ฟัง', 'The island is glowing! Replay a stop or share how you solved it with a friend.')
      : tr('แสงคริสตัลกระจายไป 3 แห่ง ช่วยฉันจัดจำนวน สร้างสะพาน และจุดประภาคารกัน!', 'Crystal light is scattered across three places. Help me grow the garden, build bridges, and light the lighthouse!')));
    const intro = el('div', 'cq-map-intro');
    intro.append(el('h2', '', tr('เส้นทางแห่งแสง', 'A trail of light')), el('p', '', tr(`ฟื้นฟู ${progress.completedIds.length} / 9 จุด · พื้นฐาน ป.1–2 · ไม่จับเวลา`, `${progress.completedIds.length} / 9 places restored · Grade 1–2 foundations · No timer`)));
    shell.append(intro);
    const chapters = el('div', 'cq-chapters');
    CRYSTAL_CHAPTERS.forEach((chapter, chapterIndex) => {
      const card = el('section', 'cq-chapter cq-chapter-' + chapter.id);
      const count = CRYSTAL_LEVELS.filter(level => level.chapterId === chapter.id && progress.completedIds.includes(level.id)).length;
      card.append(el('span', 'cq-chapter-icon', ['✿', '⌁', '✧'][chapterIndex]), el('h3', '', local(chapter.title)), el('p', '', local(chapter.story)));
      const stops = el('div', 'cq-stops');
      CRYSTAL_LEVELS.filter(level => level.chapterId === chapter.id).forEach(level => {
        const index = levelIndex(level.id), done = progress.completedIds.includes(level.id), locked = index > progress.completedIds.length;
        const stop = button('', () => openLevel(level.id), 'cq-stop' + (done ? ' done' : locked ? ' locked' : ' ready'), 'cq-stop-' + level.id);
        const label = done ? tr('เล่นซ้ำ', 'Replay') : locked ? tr('ยังไม่เปิด', 'Locked') : tr('ไปกันเลย', 'Let’s go');
        stop.append(el('span', 'cq-stop-number', done ? '✓' : String(index + 1)), el('span', 'cq-stop-title', local(level.title)), el('span', 'cq-stop-label', label));
        stop.disabled = locked; stop.setAttribute('aria-label', tr(`จุด ${index + 1} ${local(level.title)} ${label}`, `Stop ${index + 1}: ${local(level.title)}. ${label}`)); stops.append(stop);
      });
      card.append(stops, el('span', 'cq-chapter-count', tr(`${count} / 3 จุดได้รับแสงแล้ว`, `${count} / 3 places glowing`))); chapters.append(card);
    });
    shell.append(chapters, storageNote());
    if (progress.completedIds.length) {
      if (confirmRestart) {
        const confirm = el('div', 'cq-confirm');
        confirm.append(el('p', '', tr('เริ่มเกาะใหม่หรือไม่? แสงที่สะสมในเกมเกาะคริสตัลนี้จะเริ่มที่ 0', 'Start a new island? Your crystal island collection will return to 0.')),
          button(tr('เก็บเกาะเดิมไว้', 'Keep my island'), () => { confirmRestart = false; render(); }, 'cq-button', 'cq-cancel-restart'),
          button(tr('ยืนยันเริ่มเกาะใหม่', 'Yes, start a new island'), restart, 'cq-button cq-quiet', 'cq-confirm-restart')); shell.append(confirm);
      } else shell.append(button(tr('เริ่มเกาะใหม่', 'Start a new island'), () => { confirmRestart = true; render(); }, 'cq-button cq-link', 'cq-restart'));
    }
  }
  function frameBoard(level) {
    const board = el('div', 'cq-frame-board');
    [['left', tr('แปลงซ้าย', 'Left plot')], ['right', tr('แปลงขวา', 'Right plot')]].forEach(([key, label]) => {
      const plot = el('section', 'cq-plot'); plot.append(el('h3', '', `${label} · ${game.model[key]}`));
      const frame = el('div', 'cq-ten-frame'); frame.setAttribute('role', 'img');
      frame.setAttribute('aria-label', tr(`${label} มี ${game.model[key]} จาก 10 ช่อง`, `${label}: ${game.model[key]} of 10 spaces filled`));
      for (let i = 0; i < 10; i++) { const seed = el('span', 'cq-frame-cell' + (i < game.model[key] ? ' filled' : ''), i < game.model[key] ? '✦' : ''); seed.setAttribute('aria-hidden', 'true'); frame.append(seed); }
      const move = button(key === 'right' ? tr('ย้าย 1 ไปซ้าย ←', 'Move 1 left ←') : tr('ย้าย 1 ไปขวา →', 'Move 1 right →'), () => apply({ type: 'move', from: key }), 'cq-button cq-move', 'cq-move-' + key);
      move.disabled = game.solved || game.model[key] === 0 || game.model[key === 'left' ? 'right' : 'left'] >= 10;
      plot.append(frame, move); board.append(plot);
    });
    board.append(el('p', 'cq-board-caption', tr('แต่ละคริสตัลแทน 1 · 1 แปลงเต็มมี 10', 'Each crystal is 1 · A full plot holds 10'))); return board;
  }
  function routeBoard(level) {
    const board = el('div', 'cq-route-board'), line = el('div', 'cq-number-line');
    const viewport = el('div', 'cq-number-line-scroll'); viewport.tabIndex = 0; viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', tr('เส้นจำนวน เลื่อนซ้ายหรือขวาเพื่อดูจุดอื่น', 'Number line. Scroll left or right to see more positions.'));
    refs.numberLineScroll = viewport;
    refs.numberLineHint = el('p', 'cq-line-scroll-hint', tr('↔ เลื่อนซ้าย–ขวาเพื่อดูเส้นจำนวนให้ครบ', '↔ Scroll left and right to see the whole number line'));
    refs.numberLineHint.hidden = true;
    line.style.setProperty('--cq-stops', level.max - level.min + 1);
    line.setAttribute('role', 'img'); line.setAttribute('aria-label', tr(`มิวอยู่ที่ ${game.model.position} เป้าหมาย ${level.goal.target}`, `Mew is at ${game.model.position}. Goal: ${level.goal.target}.`));
    for (let n = level.min; n <= level.max; n++) {
      const stop = el('div', 'cq-number-stop' + (n === game.model.position ? ' current' : '') + (n === level.goal.target ? ' target' : ''));
      const marker = el('span', 'cq-route-marker', n === game.model.position ? '✦' : n === level.goal.target ? '⚑' : '·'); marker.setAttribute('aria-hidden', 'true'); stop.append(marker, el('span', '', String(n))); line.append(stop);
    }
    viewport.append(line);
    board.append(viewport, refs.numberLineHint, el('p', 'cq-board-caption', tr(`เลือกสะพาน ${level.requiredSteps} แผ่นโดยไม่ใช้ซ้ำ · ใช้แล้ว ${game.model.used.length} / ${level.requiredSteps}`, `Choose ${level.requiredSteps} different bridge tiles · Used ${game.model.used.length} / ${level.requiredSteps}`)));
    const tiles = el('div', 'cq-bridge-tiles');
    level.steps.forEach(step => {
      const value = `${step.value > 0 ? '+' : '−'}${Math.abs(step.value)}`, used = game.model.used.includes(step.id);
      const tile = button('', () => apply({ type: 'step', stepId: step.id }), 'cq-bridge-tile' + (used ? ' used' : ''), 'cq-step-' + step.id);
      tile.append(el('strong', '', value), el('span', '', used ? tr('ใช้แล้ว', 'Used') : tr(step.value > 0 ? 'เดินหน้า' : 'ถอยหลัง', step.value > 0 ? 'Forward' : 'Back')));
      tile.disabled = game.solved || used || game.model.used.length >= level.requiredSteps || game.model.position + step.value < level.min || game.model.position + step.value > level.max;
      tiles.append(tile);
    });
    board.append(tiles); return board;
  }
  function bundleBoard() {
    const board = el('div', 'cq-bundle-board');
    [['tens', tr('มัดสิบ', 'Tens bundles')], ['ones', tr('หน่วย', 'Ones')]].forEach(([key, label]) => {
      const group = el('section', 'cq-place-group'); group.append(el('h3', '', `${label} · ${game.model[key]}`));
      const collection = el('div', 'cq-place-collection ' + key); collection.setAttribute('role', 'img'); collection.setAttribute('aria-label', `${label}: ${game.model[key]}`);
      for (let n = 0; n < game.model[key]; n++) {
        const crystal = el('span', key === 'tens' ? 'cq-ten-rod' : 'cq-one-crystal'); crystal.setAttribute('aria-hidden', 'true');
        if (key === 'tens') for (let j = 0; j < 10; j++) crystal.append(el('span'));
        collection.append(crystal);
      }
      if (!game.model[key]) collection.append(el('span', 'cq-zero', '0'));
      group.append(collection); board.append(group);
    });
    const tools = el('div', 'cq-bundle-actions');
    const pack = button(tr('รวม 10 หน่วย → 1 มัดสิบ', 'Bundle 10 ones → 1 ten'), () => apply({ type: 'bundle' }), 'cq-button', 'cq-bundle'); pack.disabled = game.solved || game.model.ones < 10;
    const unpack = button(tr('แกะ 1 มัดสิบ → 10 หน่วย', 'Unbundle 1 ten → 10 ones'), () => apply({ type: 'unbundle' }), 'cq-button cq-quiet', 'cq-unbundle'); unpack.disabled = game.solved || game.model.tens < 1;
    tools.append(pack, unpack); board.append(tools, el('p', 'cq-board-caption', tr('1 มัดสิบ = 10 หน่วย · จำนวนรวมยังเท่าเดิม', '1 ten = 10 ones · The total stays the same'))); return board;
  }
  function renderPlay(shell) {
    const level = currentCrystalLevel(game), index = levelIndex(game.levelId);
    const navigation = el('div', 'cq-play-nav'); navigation.append(button(tr('← แผนที่เกาะ', '← Island map'), map, 'cq-button cq-quiet', 'cq-map'), el('span', 'cq-progress-label', tr(`จุด ${index + 1} / 9 · ${level.chapterTitle}`, `Stop ${index + 1} / 9 · ${level.chapterTitle}`))); shell.append(navigation);
    const card = el('section', 'cq-play-card');
    const title = el('h2', '', level.title); title.id = 'cq-level-heading'; title.tabIndex = -1;
    card.append(title, npc(level.prompt));
    const equation = el('div', 'cq-equation'); equation.setAttribute('aria-label', tr('ภาพเขียนเป็นจำนวน', 'Your model in numbers')); equation.append(el('span', '', equationCrystalQuest(game))); card.append(equation);
    card.append(level.kind === 'frames' ? frameBoard(level) : level.kind === 'route' ? routeBoard(level) : bundleBoard(level));
    const tools = el('div', 'cq-tools');
    const undoButton = button(tr('↶ ย้อน 1 ครั้ง', '↶ Undo'), undo, 'cq-button cq-quiet', 'cq-undo'); undoButton.disabled = game.solved || !game.history.length;
    const resetButton = button(tr('เริ่มจุดนี้ใหม่', 'Reset this stop'), reset, 'cq-button cq-quiet', 'cq-reset'); resetButton.disabled = game.solved || !game.history.length;
    const hintButton = button(tr('✧ ขอคำใบ้', '✧ A little help'), hint, 'cq-button cq-quiet', 'cq-hint'); hintButton.disabled = game.solved || game.hintCount >= level.hints.length;
    const checkButton = button(tr('ตรวจแสงคริสตัล', 'Check the crystal light'), check, 'cq-button cq-primary', 'cq-check'); checkButton.disabled = game.solved;
    tools.append(undoButton, resetButton, hintButton, checkButton); card.append(tools);
    if (game.hintCount > 0) {
      const hints = el('aside', 'cq-hints'); hints.append(el('strong', '', tr('มิวกระซิบว่า…', 'Mew whispers…')));
      level.hints.slice(0, game.hintCount).forEach(text => hints.append(el('p', '', text))); card.append(hints);
    }
    if (!liveRegion) liveRegion = el('div', 'cq-feedback');
    refs.feedback = liveRegion; refs.feedback.className = 'cq-feedback' + (game.feedback ? ' ' + game.feedback.tone : ''); refs.feedback.id = 'cq-feedback';
    refs.feedback.setAttribute('role', 'status'); refs.feedback.setAttribute('aria-live', 'polite'); refs.feedback.setAttribute('aria-atomic', 'true');
    // A persistent live region is appended by render(); only its text changes after actions.
    card.append(refs.feedback);
    if (game.solved) {
      const success = el('div', 'cq-success');
      success.append(el('span', 'cq-success-star', '✦'), el('h3', '', tr('แสงกลับมาแล้ว!', 'The light is back!')),
        el('p', '', game.hintCount ? tr('ทำสำเร็จพร้อมคำใบ้ · ทุกก้าวของการคิดมีค่า', 'Completed with a hint · Every thinking step counts') : tr('ทำสำเร็จโดยไม่เปิดคำใบ้', 'Completed without opening a hint')));
      if (level.reasoning) {
        const reasoning = el('div', 'cq-reasoning'); reasoning.append(el('p', 'cq-optional', tr('ชวนคิดต่อ · จะข้ามก็ได้', 'A thinking moment · You can skip this')), el('h3', '', level.reasoning.prompt));
        const options = el('div', 'cq-reason-options');
        level.reasoning.options.forEach(option => { const choice = button(option.label, () => reason(option.id), 'cq-button cq-reason' + (game.reasoning?.selectedId === option.id ? ' selected' : ''), 'cq-reason-' + option.id); choice.setAttribute('aria-pressed', String(game.reasoning?.selectedId === option.id)); options.append(choice); });
        reasoning.append(options);
        if (game.reasoning?.feedback) reasoning.append(el('p', 'cq-reason-feedback', game.reasoning.message?.[language] || game.reasoning.feedback));
        success.append(reasoning);
      }
      success.append(button(index === CRYSTAL_LEVELS.length - 1 ? tr('ชมเกาะที่สร้างด้วยกัน →', 'See our restored island →') : tr('ไปจุดถัดไป →', 'Next stop →'), next, 'cq-button cq-primary', 'cq-next'));
      card.append(success);
    }
    shell.append(card, storageNote());
  }
  function renderSummary(shell) {
    const card = el('section', 'cq-summary');
    const title = el('h2', '', tr('เกาะกลับมาส่องแสงแล้ว!', 'Our island shines again!')); title.id = 'cq-level-heading'; title.tabIndex = -1;
    card.append(el('span', 'cq-summary-medal', '✦'), title, el('p', '', tr(`เล่นครบ ${progress.completedIds.length} / 9 จุด · สร้างโลกด้วยการคิดทีละก้าว`, `${progress.completedIds.length} / 9 stops completed · A world built one thinking step at a time`)),
      el('p', '', tr(`เปิดคำใบ้ในการเล่นสำเร็จครั้งแรก ${progress.hintedIds.length} จุด · ใช้ความช่วยเหลือได้เสมอ`, `Hints used on first completion: ${progress.hintedIds.length} stops · Help is always welcome`)),
      el('p', 'cq-board-caption', tr('ดอกคริสตัล: ทำสิบ · สะพาน: เส้นจำนวน · ประภาคาร: มัดสิบและหน่วย', 'Crystal garden: making ten · Bridges: number lines · Lighthouse: tens and ones')),
      el('p', 'cq-fine', tr('นี่คือบันทึกการเล่นครบ ลองเล่าวิธีคิดหรือแก้โจทย์ใหม่ด้วยกันต่อได้', 'This records completion. Keep exploring: explain your thinking or try a new problem together.')),
      button(tr('กลับไปเล่นจุดที่ชอบ', 'Replay a favourite stop'), map, 'cq-button cq-primary', 'cq-summary-map'));
    shell.append(card, storageNote());
  }
  function render(focusHeading = false) {
    if (!active) return;
    lineObserver?.disconnect(); lineObserver = null;
    const focusedId = document.activeElement?.id;
    const previousLineScroll = focusHeading ? 0 : refs.numberLineScroll?.scrollLeft || 0;
    const shell = el('div', 'crystal-quest-shell'); refs = {};
    hero(shell);
    if (!worldHost) { worldHost = el('div', 'cq-world-host'); worldHost.dataset.world3d = 'loading'; }
    const worldWrap = el('div', 'cq-world-wrap'); worldWrap.append(worldHost, island());
    if (screen === 'play') worldWrap.append(el('p', 'cq-world-caption', tr('แตะคริสตัลในโลก 3D หรือใช้ปุ่มด้านล่างเพื่อขยับจำนวน', 'Tap crystals in the 3D world or use the buttons below to move numbers.')));
    shell.append(worldWrap);
    if (screen === 'play') renderPlay(shell);
    else if (screen === 'summary') renderSummary(shell);
    else renderMap(shell);
    let nextFeedback;
    if (refs.feedback) {
      nextFeedback = game.reasoning?.feedback ? game.reasoning.message?.[language] || game.reasoning.feedback : game.feedback ? game.feedback.message?.[language] || game.feedback.text : '';
    }
    panel.replaceChildren(shell);
    if (refs.numberLineScroll) {
      const viewport = refs.numberLineScroll; viewport.scrollLeft = previousLineScroll;
      const hint = refs.numberLineHint;
      const syncLine = () => {
        if (!active || refs.numberLineScroll !== viewport) return;
        hint.hidden = !(viewport.scrollWidth > viewport.clientWidth);
        const current = viewport.querySelector('.current');
        // Keep the character in view while scrolling only this line, never the page.
        if (current?.getBoundingClientRect && viewport.getBoundingClientRect) {
          const marker = current.getBoundingClientRect(), bounds = viewport.getBoundingClientRect();
          if (marker.left < bounds.left + 10) viewport.scrollLeft -= bounds.left + 10 - marker.left;
          else if (marker.right > bounds.right - 10) viewport.scrollLeft += marker.right - bounds.right + 10;
        }
      };
      syncLine();
      // Text scale changes can resize the line while its viewport stays the same width.
      if (typeof ResizeObserver === 'function') {
        lineObserver = new ResizeObserver(syncLine);
        lineObserver.observe(viewport);
        lineObserver.observe(viewport.querySelector('.cq-number-line'));
      }
    }
    if (refs.feedback) refs.feedback.textContent = nextFeedback || '';
    world?.update({ state: screen === 'play' ? game : null, level: screen === 'play' && game ? currentCrystalLevel(game) : null, completedIds: progress.completedIds, language });
    if (focusHeading) (panel.querySelector('#cq-level-heading') || panel.querySelector('#cq-heading'))?.focus();
    else if (focusedId) {
      const target = panel.querySelector('#' + focusedId);
      if (target && !target.disabled) target.focus();
      else if (screen === 'play' && game.solved) panel.querySelector('#cq-next')?.focus();
      else if (screen === 'play') panel.querySelector('#cq-check')?.focus();
    }
  }
  function enter(options = {}) {
    language = options.language === 'en' ? 'en' : 'th'; active = true; loadProgress();
    if (game) game = { ...game, language };
    render(true); loadWorld(); return true;
  }
  async function loadWorld() {
    if (world || worldLoading || !active || typeof document.createElementNS !== 'function') return;
    const token = ++worldToken; worldLoading = true;
    try {
      const { mountCrystalWorld } = await import('./crystal-world-3d.js');
      if (!active || token !== worldToken) return;
      const mounted = await mountCrystalWorld(worldHost, { language, onAction: action => apply(action) });
      if (!active || token !== worldToken) { mounted?.dispose(); return; }
      world = mounted;
      world?.update({ state: screen === 'play' ? game : null, level: screen === 'play' && game ? currentCrystalLevel(game) : null, completedIds: progress.completedIds, language });
    } catch { if (worldHost) worldHost.dataset.world3d = 'fallback'; }
    finally { if (token === worldToken) worldLoading = false; }
  }
  function deactivate() {
    active = false; worldToken++; worldLoading = false; world?.dispose(); world = null;
    lineObserver?.disconnect(); lineObserver = null;
    // Give any in-flight scene its own detached host; a rapid re-entry gets a fresh one.
    worldHost = null;
  }
  function setLanguage(nextLanguage) {
    if (!['th', 'en'].includes(nextLanguage)) return false;
    language = nextLanguage; if (game) game = { ...game, language };
    if (active) render(); return true;
  }
  return { enter, deactivate, setLanguage,
    getState: () => ({ active, screen, language, game: game ? structuredClone(game) : null, progress: structuredClone(progress), storageAvailable }),
    actions: { openLevel, apply, undo, reset, hint, check, reason, next, map, restart },
  };
}
