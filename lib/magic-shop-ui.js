import { MAGIC_SHOP_CHAPTERS, MAGIC_SHOP_LEVELS, getMagicShopLevel, createMagicShopState, applyMagicShopAction, isMagicShopSolved, getMagicShopMath } from './magic-shop.js';
import { createMagicShopStore } from './magic-shop-storage.js';
import { renderMagicShopVillage, renderMagicShopCustomer } from './magic-shop-art.js';
import { getLanguage } from './i18n.js';
import { trackGameStart, trackGameComplete } from './analytics.js';

/** The game uses conserved objects and drawings; awards follow a completed delivery. */
export function createMagicShopController(panel, { onHome } = {}) {
  const document = panel.ownerDocument || globalThis.document;
  const store = createMagicShopStore();
  const saved = store.read();
  let active = false, grade = 1, language = getLanguage(), chapter = saved.current ? getMagicShopLevel(saved.current.levelId)?.chapter : null;
  let current = saved.current, completed = [...saved.completed], mode = current ? 'level' : 'map', feedback = '', hinted = false, history = [];
  let firstStart = true, awarded = false;
  const tr = (th, en) => language === 'en' ? en : th;
  const local = value => typeof value === 'string' ? value : value?.[language] || value?.th || '';
  const el = (tag, className = '', text = '') => {
    const node = document.createElement(tag); node.className = className;
    if (text !== '' && text != null) node.textContent = String(text);
    return node;
  };
  const button = (text, action, key, className = 'magic-shop-button secondary') => {
    const node = el('button', className, text); node.type = 'button';
    if (key) { node.dataset.magicAction = key; node.dataset.focusKey = key; }
    node.addEventListener('click', action); return node;
  };
  const level = () => current ? getMagicShopLevel(current.levelId) : null;
  const chapterLevels = id => MAGIC_SHOP_LEVELS.filter(item => item.chapter === id);
  const isUnlocked = id => {
    const item = getMagicShopLevel(id); if (!item) return false;
    const list = chapterLevels(item.chapter), index = list.findIndex(entry => entry.id === id);
    return index === 0 || completed.includes(list[index - 1]?.id);
  };
  const person = index => {
    const people = [
      { type: 'owl', name: tr('นกฮูกลูนา', 'Luna the owl') },
      { type: 'fox', name: tr('จิ้งจอกฟินน์', 'Finn the fox') },
      { type: 'dragon', name: tr('มังกรพิป', 'Pip the dragon') },
    ];
    return people[index % people.length];
  };
  const fraction = value => ({ 0: '0', 1: '¼', 2: '½', 3: '¾', 4: '1' }[value] ?? `${value}/4`);
  const persist = () => { if (current) store.saveCurrent(current); };
  function focusHeading() { (panel.querySelector('#magic-shop-success-heading') || panel.querySelector('#magic-shop-level-heading') || panel.querySelector('#magic-shop-heading'))?.focus?.(); }
  function render(preserveFocus = true) {
    if (!active) return;
    const focused = preserveFocus && panel.contains(document.activeElement) ? document.activeElement?.dataset?.focusKey : null;
    panel.replaceChildren();
    const shell = el('div', 'magic-shop-shell');
    const hero = el('header', 'magic-shop-hero'), copy = el('div', 'magic-shop-hero-copy');
    copy.append(el('span', 'eyebrow', 'MATH WIZARD · MAGIC VILLAGE'));
    const heading = el('h1', '', tr('หมู่บ้านเวทคณิต', 'The village of math magic')); heading.id = 'magic-shop-heading'; heading.tabIndex = -1;
    copy.append(heading, el('p', '', tr('นับลูกแก้ว ผสมน้ำยา ร่ายเวท แล้วช่วยหมู่บ้านเติบโต', 'Count marbles, mix potions, cast spells, and help a village grow.')));
    const back = button(tr('กลับไปเลือกเกม', 'Back to games'), () => { persist(); onHome?.(); }, 'home');
    hero.append(copy, back); shell.append(hero);
    const progress = el('div', 'magic-shop-progress');
    progress.append(el('strong', '', tr(`ช่วยสำเร็จ ${completed.length} / 15 ภารกิจ`, `${completed.length} / 15 missions completed`)), el('span', '', milestone()));
    const meter = el('progress'); meter.max = 15; meter.value = completed.length; meter.setAttribute('aria-label', tr('ความคืบหน้าหมู่บ้าน', 'Village progress')); progress.append(meter); shell.append(progress);
    if (!store.status().persistent) shell.append(el('p', 'magic-shop-storage-note', tr('เล่นต่อได้ตามปกติ แต่เครื่องนี้ยังบันทึกความคืบหน้าหลังปิดหน้าเว็บไม่ได้', 'You can keep playing. This browser cannot save progress after you close the page.')));
    if (mode === 'map' || !current) renderMap(shell); else renderLevel(shell);
    panel.append(shell);
    if (focused) {
      const controls = [...panel.querySelectorAll('[data-focus-key]')];
      const target = controls.find(node => node.dataset.focusKey === focused && !node.disabled)
        || controls.find(node => node.dataset.focusKey === `customer-${current?.selected}` && !node.disabled)
        || controls.find(node => node.dataset.focusKey === 'deliver' && !node.disabled);
      target?.focus({ preventScroll: true });
    }
  }
  function milestone() {
    if (completed.length >= 15) return tr('ประตูดาวเปิดแล้ว หมู่บ้านกลับมาส่องสว่าง!', 'The star portal is open. The village shines again!');
    if (completed.length >= 10) return tr('เรือนกระจกเติบโตแล้ว อีกนิดก็เปิดประตูดาวได้', 'The greenhouse is blooming. The star portal is next.');
    if (completed.length >= 5) return tr('โคมไฟสว่างแล้ว มาช่วยเรือนกระจกกันต่อ', 'The lanterns are lit. Let’s grow the greenhouse.');
    return tr('ช่วยเพื่อนครบ 5 ภารกิจเพื่อจุดโคมไฟหมู่บ้าน', 'Complete 5 missions to light the village lanterns.');
  }
  function renderMap(shell) {
    const layout = el('div', 'magic-shop-layout magic-shop-map');
    const village = el('section', 'magic-shop-village');
    renderMagicShopVillage(village, { completedCount: completed.length, chapter, language });
    village.append(el('p', 'magic-shop-village-caption', milestone())); layout.append(village);
    const chapters = el('div', 'magic-shop-chapters');
    MAGIC_SHOP_CHAPTERS.forEach(item => {
      const card = el('section', `magic-shop-chapter-card${chapter === item.id ? ' selected' : ''}`);
      card.dataset.magicChapter = item.id;
      const count = chapterLevels(item.id).filter(entry => completed.includes(entry.id)).length;
      card.append(el('span', 'magic-shop-chapter-symbol', item.id === 'marbles' ? '●' : item.id === 'potions' ? '◒' : '✦'), el('h2', '', local(item.title)), el('p', '', local(item.description)));
      const choose = button(tr('เปิดเส้นทาง', 'Open this path'), () => selectChapter(item.id), `chapter-${item.id}`);
      choose.setAttribute('aria-pressed', String(chapter === item.id)); card.append(choose, el('small', '', `${count} / 5`)); chapters.append(card);
    }); layout.append(chapters); shell.append(layout);
    const path = el('section', 'magic-shop-path');
    const metadata = MAGIC_SHOP_CHAPTERS.find(item => item.id === chapter);
    path.append(el('h2', '', local(metadata?.title)), el('p', '', tr('เริ่มด่านแรกของแต่ละเส้นทางได้เลย แล้วค่อย ๆ เปิดด่านถัดไป', 'Start the first mission on any path. Each delivery opens the next mission.')));
    const levels = el('div', 'magic-shop-levels');
    chapterLevels(chapter).forEach((item, index) => {
      const unlocked = isUnlocked(item.id), done = completed.includes(item.id), resumable = current?.levelId === item.id && !isMagicShopSolved(current);
      const choice = button('', () => openLevel(item.id), `level-${item.id}`, `magic-shop-level-button${done ? ' completed' : ''}${resumable ? ' current' : ''}`);
      choice.dataset.magicLevel = item.id; choice.disabled = !unlocked;
      choice.append(el('span', 'magic-shop-level-number', done ? '✓' : String(index + 1)), el('strong', '', local(item.title)), el('small', '', !unlocked ? tr('ผ่านด่านก่อนหน้าเพื่อเปิด', 'Complete the previous mission') : resumable ? tr('เล่นต่อ', 'Continue') : done ? tr('สำเร็จแล้ว · เล่นอีกครั้ง', 'Completed · Play again') : tr('รับภารกิจ', 'Start mission')));
      levels.append(choice);
    }); path.append(levels);
    if (current && current.levelId && getMagicShopLevel(current.levelId)?.chapter !== chapter && !isMagicShopSolved(current)) path.append(button(tr('กลับไปภารกิจที่กำลังเล่น', 'Resume your current mission'), () => { chapter = level().chapter; mode = 'level'; render(false); focusHeading(); }, 'resume'));
    shell.append(path);
  }
  function renderLevel(shell) {
    const item = level();
    const nav = el('div', 'magic-shop-level-nav');
    nav.append(button(tr('← แผนที่หมู่บ้าน', '← Village map'), showMap, 'map', 'magic-shop-button quiet'), el('span', '', tr(`ภารกิจ ${chapterLevels(chapter).findIndex(entry => entry.id === item.id) + 1} / 5`, `Mission ${chapterLevels(chapter).findIndex(entry => entry.id === item.id) + 1} / 5`))); shell.append(nav);
    const layout = el('div', 'magic-shop-level-layout');
    const order = el('section', 'magic-shop-order');
    const portrait = el('div', 'magic-shop-npc');
    renderMagicShopCustomer(portrait, { ...person(0), language, mood: mode === 'success' ? 'happy' : 'curious' });
    const words = el('div', 'magic-shop-order-copy');
    words.append(el('span', 'eyebrow', tr('มีเพื่อนอยากขอให้ช่วย!', 'A friend needs your magic!')));
    const title = el('h2', '', local(item.title)); title.id = 'magic-shop-level-heading'; title.tabIndex = -1;
    words.append(title, el('p', 'magic-shop-story', local(item.story)), el('p', 'magic-shop-goal', local(item.goal)));
    order.append(portrait, words); layout.append(order);
    const play = el('section', `magic-shop-play-area magic-shop-kind-${item.kind}`); play.setAttribute('aria-label', tr('พื้นที่เล่นเวทคณิต', 'Math magic play area'));
    play.dataset.magicKind = item.kind;
    if (item.kind === 'marbles' || item.kind === 'potion') renderObjects(play, item);
    else if (item.kind === 'rune-sum') renderRunes(play, item);
    else if (item.kind === 'shape') renderShape(play, item);
    else if (item.kind === 'variable') renderVariable(play, item);
    const math = el('p', 'magic-shop-math-summary', getMagicShopMath(current, language)); math.id = 'magic-shop-math'; play.append(math);
    layout.append(play); shell.append(layout);
    if (mode === 'success') { renderSuccess(shell, item); return; }
    const actions = el('div', 'magic-shop-actions');
    const deliverLabel = item.chapter === 'spells' ? tr('ร่ายเวท ✦', 'Cast the spell ✦') : tr('ส่งให้เพื่อน ✓', 'Deliver to friends ✓');
    const deliverButton = button(deliverLabel, deliver, 'deliver', 'magic-shop-button primary'); deliverButton.id = 'magic-shop-deliver';
    const undoButton = button(tr('ย้อนหนึ่งครั้ง', 'Undo'), undo, 'undo'); undoButton.disabled = !history.length;
    actions.append(deliverButton, undoButton, button(tr('เริ่มด่านนี้ใหม่', 'Reset mission'), reset, 'reset', 'magic-shop-button quiet'), button(tr('ขอคำใบ้', 'Show a hint'), showHint, 'hint', 'magic-shop-button quiet')); shell.append(actions);
    if (hinted) { const hint = el('p', 'magic-shop-hint', local(item.hint)); hint.id = 'magic-shop-hint'; shell.append(hint); }
    const status = el('p', `magic-shop-feedback${feedback ? ' retry' : ''}`, feedback); status.id = 'magic-shop-feedback'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); shell.append(status);
  }
  function renderObjects(play, item) {
    const isPotion = item.kind === 'potion';
    play.append(el('h3', '', tr('1. เลือกเพื่อนที่จะให้', '1. Choose a friend')));
    const recipients = el('div', 'magic-shop-customers');
    item.targets.forEach((target, index) => {
      const selected = current.selected === index, npc = person(index);
      const card = button('', () => selectCustomer(index), `customer-${index}`, `magic-shop-customer${selected ? ' selected' : ''}`);
      card.setAttribute('aria-pressed', String(selected)); card.dataset.magicCustomer = String(index);
      const portrait = el('span', 'magic-shop-customer-art'); renderMagicShopCustomer(portrait, { ...npc, language });
      card.append(portrait, el('strong', '', npc.name), el('span', 'magic-shop-order-amount', isPotion ? tr(`ต้องการ ${fraction(target)} ลิตร`, `Order: ${fraction(target)} litre`) : tr(`ต้องการ ${target} ลูก`, `Order: ${target} marbles`)));
      if (isPotion) {
        const vessel = el('span', 'magic-shop-vessel');
        vessel.setAttribute('aria-hidden', 'true');
        const liquid = el('span', 'magic-shop-liquid'); liquid.style.height = `${current.filled[index] / (item.capacity || 4) * 100}%`; vessel.append(liquid);
        for (let tick = 1; tick <= 4; tick++) { const mark = el('span', 'magic-shop-tick', fraction(tick)); mark.style.bottom = `${tick / 4 * 100}%`; vessel.append(mark); }
        card.append(vessel, el('span', 'magic-shop-current-amount', tr(`ตอนนี้ ${fraction(current.filled[index])} ลิตร`, `Now: ${fraction(current.filled[index])} litre`)));
      } else {
        const marbles = el('span', 'magic-shop-token-grid'); marbles.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < current.filled[index]; i++) marbles.append(el('span', 'magic-shop-marble', ''));
        card.append(marbles, el('span', 'magic-shop-current-amount', tr(`ตอนนี้ ${current.filled[index]} ลูก`, `Now: ${current.filled[index]} marbles`)));
      }
      recipients.append(card);
    }); play.append(recipients);
    const stock = el('div', 'magic-shop-stock'); stock.append(el('h3', '', tr('2. แตะวัตถุดิบเพื่อส่งให้เพื่อนที่เลือก', '2. Tap a supply to give it to your selected friend')));
    const tokens = el('div', 'magic-shop-stock-tokens');
    const tokenTypes = isPotion ? ['half', 'quarter'] : ['single', 'bundle'];
    tokenTypes.forEach(token => {
      const count = current.stock[token] || 0;
      const name = token === 'single' ? tr('ลูกแก้ว 1 ลูก', '1 marble') : token === 'bundle' ? tr('ถุงละ 5 ลูก', 'Bag of 5 marbles') : token === 'half' ? tr('น้ำยา ½ ลิตร', '½ litre potion') : tr('น้ำยา ¼ ลิตร', '¼ litre potion');
      const supply = button('', () => addToken(token), `add-${token}`, `magic-shop-stock-button magic-shop-token-${token}`);
      supply.dataset.magicToken = token;
      supply.append(el('span', 'magic-shop-stock-icon', token === 'single' ? '●' : token === 'bundle' ? '●●●●●' : token === 'half' ? '½' : '¼'), el('strong', '', name), el('span', '', tr(`เหลือ ${count}`, `${count} left`)));
      const tooFull = isPotion && current.filled[current.selected] + (token === 'half' ? 2 : 1) > (item.capacity || 4);
      supply.disabled = count < 1 || tooFull || mode === 'success'; tokens.append(supply);
    }); stock.append(tokens);
    const tools = el('div', 'magic-shop-stock-tools');
    const splitButton = button(isPotion ? tr('แบ่ง ½ เป็น ¼ สองถ้วย', 'Split ½ into two ¼ cups') : tr('แกะถุง 5 ลูก', 'Unpack a bag of 5'), () => split(isPotion ? 'half' : 'bundle'), 'split');
    splitButton.disabled = (current.stock[isPotion ? 'half' : 'bundle'] || 0) < 1 || mode === 'success'; tools.append(splitButton);
    if (!isPotion) { const packButton = button(tr('จัด 5 ลูกเป็น 1 ถุง', 'Pack 5 marbles into a bag'), pack, 'pack'); packButton.disabled = current.stock.single < 5 || mode === 'success'; tools.append(packButton); }
    stock.append(tools); play.append(stock);
  }
  function renderRunes(play, item) {
    play.append(el('h3', '', tr(`เลือกอักษรเวทให้รวมได้ ${item.target}`, `Choose runes that total ${item.target}`)), el('p', '', tr(`ใช้ได้ไม่เกิน ${item.maxRunes} อักษร แตะอักษรที่เลือกเพื่อคืน`, `Use up to ${item.maxRunes} runes. Tap a selected rune to return it.`)));
    const result = el('div', 'magic-shop-spell-equation');
    result.append(el('span', '', current.runes.length ? current.runes.map(index => item.runes[index]).join(' + ') : '…'), el('span', '', `= ${current.runes.reduce((sum, index) => sum + item.runes[index], 0)}`)); play.append(result);
    const runes = el('div', 'magic-shop-runes');
    item.runes.forEach((value, index) => {
      const chosen = current.runes.includes(index);
      const rune = button(String(value), () => chosen ? removeRune(index) : chooseRune(index), `rune-${index}`, `magic-shop-rune${chosen ? ' selected' : ''}`);
      rune.dataset.magicRune = String(index); rune.setAttribute('aria-pressed', String(chosen)); rune.setAttribute('aria-label', tr(`${chosen ? 'คืน' : 'เลือก'}อักษรเวท ${value}`, `${chosen ? 'Return' : 'Choose'} rune ${value}`));
      rune.disabled = mode === 'success' || (!chosen && current.runes.length >= item.maxRunes); runes.append(rune);
    }); play.append(runes);
  }
  function renderShape(play, item) {
    play.append(el('h3', '', tr('เชื่อมจุดเพื่อวาดวงเวท', 'Connect the vertices to draw a spell')), el('p', '', tr('แตะจุดตามขอบรูป แล้วกลับมาจุดเริ่มต้นเพื่อปิดวงเวท', 'Tap vertices around the edge, then return to your starting vertex to close the spell.')));
    const stage = el('div', 'magic-shop-shape'); stage.setAttribute('role', 'group'); stage.setAttribute('aria-label', tr('จุดสำหรับเชื่อมวงเวท', 'Spell drawing vertices'));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('aria-hidden', 'true'); svg.classList.add('magic-shop-shape-lines');
    const line = (from, to, className) => { const node = document.createElementNS('http://www.w3.org/2000/svg', 'line'); node.setAttribute('x1', from.x); node.setAttribute('y1', from.y); node.setAttribute('x2', to.x); node.setAttribute('y2', to.y); node.setAttribute('class', className); node.setAttribute('vector-effect', 'non-scaling-stroke'); svg.append(node); };
    item.edges.forEach(([from, to]) => line(item.points[from], item.points[to], 'magic-shop-shape-guide'));
    current.path.slice(1).forEach((value, index) => line(item.points[current.path[index]], item.points[value], 'magic-shop-shape-drawn'));
    stage.append(svg);
    item.points.forEach((point, index) => {
      const selected = current.path.includes(index), node = button(local(point.label) || String(index + 1), () => vertex(index), `vertex-${index}`, `magic-shop-vertex${selected ? ' selected' : ''}`);
      node.dataset.magicVertex = String(index); node.style.left = `${point.x}%`; node.style.top = `${point.y}%`; node.setAttribute('aria-label', tr(`จุด ${local(point.label) || index + 1}`, `Vertex ${local(point.label) || index + 1}`)); node.disabled = mode === 'success'; stage.append(node);
    }); play.append(stage);
    play.append(el('p', 'magic-shop-path-description', tr(`ลำดับจุด: ${current.path.map(index => local(item.points[index].label) || index + 1).join(' → ') || 'ยังไม่ได้เริ่ม'}`, `Vertex path: ${current.path.map(index => local(item.points[index].label) || index + 1).join(' → ') || 'Not started'}`)));
    const clear = button(tr('ล้างเส้นวงเวท', 'Clear the spell lines'), () => mutate({ type: 'resetPath' }), 'clear-path'); clear.disabled = !current.path.length || mode === 'success'; play.append(clear);
  }
  function renderVariable(play, item) {
    const expression = `${item.coefficient === 1 ? '' : item.coefficient}${item.symbol}${item.constant ? ` + ${item.constant}` : ''}`;
    const target = item.coefficient * item.answer + item.constant;
    play.append(el('h3', '', tr('ทำให้พลังทั้งสองข้างสมดุล', 'Balance the magic on both sides')), el('p', '', tr(`${item.symbol} คือค่าที่เราปรับได้ ดูพลังเปลี่ยนไปเมื่อเพิ่มหรือลด`, `${item.symbol} is a value you can change. Watch the energy as you increase or decrease it.`)));
    const balance = el('div', 'magic-shop-balance');
    const left = el('div', 'magic-shop-balance-side'); left.append(el('strong', '', expression), el('span', 'magic-shop-energy-value', current.value == null ? '?' : String(item.coefficient * current.value + item.constant)));
    const right = el('div', 'magic-shop-balance-side'); right.append(el('strong', '', tr('เป้าหมาย', 'Target')), el('span', 'magic-shop-energy-value', target));
    balance.append(left, el('span', 'magic-shop-balance-sign', current.value != null && item.coefficient * current.value + item.constant === target ? '=' : '⇄'), right); play.append(balance);
    const stepper = el('div', 'magic-shop-stepper');
    const values = item.choices || Array.from({ length: 11 }, (_, index) => index), min = Math.min(...values), max = Math.max(...values);
    const minus = button('−', () => setValue(Math.max(min, (current.value ?? min) - 1)), 'value-minus'); minus.setAttribute('aria-label', tr(`ลดค่า ${item.symbol}`, `Decrease ${item.symbol}`)); minus.disabled = mode === 'success' || current.value === min;
    const output = el('output', '', `${item.symbol} = ${current.value ?? '?'}`); output.id = 'magic-shop-variable-value';
    const plus = button('+', () => setValue(Math.min(max, current.value == null ? min : current.value + 1)), 'value-plus'); plus.setAttribute('aria-label', tr(`เพิ่มค่า ${item.symbol}`, `Increase ${item.symbol}`)); plus.disabled = mode === 'success' || current.value === max;
    stepper.append(minus, output, plus); play.append(stepper);
    const choices = el('div', 'magic-shop-runes');
    values.forEach(value => { const choice = button(String(value), () => setValue(value), `value-${value}`, `magic-shop-rune${current.value === value ? ' selected' : ''}`); choice.dataset.magicValue = String(value); choice.setAttribute('aria-pressed', String(current.value === value)); choice.disabled = mode === 'success'; choices.append(choice); }); play.append(choices);
  }
  function renderSuccess(shell, item) {
    const success = el('section', 'magic-shop-success'); success.id = 'magic-shop-success'; success.setAttribute('role', 'status'); success.setAttribute('aria-live', 'polite');
    const heading = el('h2', '', tr('เวทมนตร์สำเร็จแล้ว!', 'Your magic worked!')); heading.id = 'magic-shop-success-heading'; heading.tabIndex = -1;
    success.append(el('span', 'magic-shop-success-symbol', '✦'), heading, el('p', '', local(item.success) || tr('เพื่อนได้รับสิ่งที่ต้องการแล้ว ขอบคุณนักเวทคณิต!', 'Your friends got just what they needed. Thank you, math wizard!')), el('p', 'magic-shop-math-summary', getMagicShopMath(current, language)), el('p', '', awarded ? milestone() : tr('เล่นซ้ำเพื่อค้นพบวิธีใหม่ได้เสมอ', 'Play again whenever you want to try another way.')));
    const actions = el('div', 'magic-shop-actions');
    const list = chapterLevels(chapter), index = list.findIndex(entry => entry.id === item.id);
    if (index < list.length - 1) actions.append(button(tr('ภารกิจต่อไป →', 'Next mission →'), nextLevel, 'next', 'magic-shop-button primary'));
    actions.append(button(tr('ดูหมู่บ้านที่เติบโต', 'See your growing village'), showMap, 'success-map'), button(tr('ลองด่านนี้อีกครั้ง', 'Play this mission again'), () => openLevel(item.id), 'replay', 'magic-shop-button quiet')); success.append(actions); shell.append(success);
  }
  function mutate(action) {
    if (!active || !current || mode !== 'level') return false;
    const next = applyMagicShopAction(current, action);
    if (next === current) return false;
    history.push(current); if (history.length > 80) history.shift(); current = next; feedback = ''; persist(); render(); return true;
  }
  function selectChapter(id) { if (!active || !MAGIC_SHOP_CHAPTERS.some(item => item.id === id)) return false; chapter = id; mode = 'map'; render(); return true; }
  function openLevel(id) {
    if (!active || !isUnlocked(id)) return false;
    const entry = getMagicShopLevel(id);
    if (!current || current.levelId !== id || isMagicShopSolved(current)) { current = createMagicShopState(id); history = []; hinted = false; }
    chapter = entry.chapter; mode = 'level'; feedback = ''; awarded = false; persist(); trackGameStart(`magic-shop-${chapter}`); render(false); focusHeading(); return true;
  }
  function selectCustomer(index) { return mutate({ type: 'select', index: Number(index) }); }
  function addToken(token) { return mutate({ type: 'add', token }); }
  function split(token = level()?.kind === 'potion' ? 'half' : 'bundle') { return mutate({ type: 'split', token }); }
  function pack() { return mutate({ type: 'pack', token: 'bundle' }); }
  function chooseRune(index) { return mutate({ type: 'chooseRune', index: Number(index) }); }
  function removeRune(index) { return mutate({ type: 'removeRune', index: Number(index) }); }
  function vertex(index) { return mutate({ type: 'vertex', index: Number(index) }); }
  function setValue(value) { return mutate({ type: 'setValue', value: Number(value) }); }
  function undo() { if (!active || mode !== 'level' || !history.length) return false; current = history.pop(); feedback = ''; persist(); render(); return true; }
  function reset() { if (!active || !current || mode !== 'level') return false; history.push(current); current = createMagicShopState(current.levelId); feedback = ''; hinted = false; persist(); render(); return true; }
  function showHint() { if (!active || !current || mode !== 'level') return false; hinted = true; render(); return true; }
  function retryMessage() {
    const item = level();
    if (item.kind === 'marbles' || item.kind === 'potion') {
      const index = item.targets.findIndex((target, i) => current.filled[i] !== target);
      const amount = item.kind === 'potion' ? fraction : value => String(value);
      return tr(`${person(index).name} ต้องการ ${amount(item.targets[index])}${item.kind === 'potion' ? ' ลิตร' : ' ลูก'} ตอนนี้มี ${amount(current.filled[index])} ลองเลือกเพื่อนแล้วเติมให้ตรงออร์เดอร์ หรือย้อนหนึ่งครั้งได้`, `${person(index).name} needs ${amount(item.targets[index])}${item.kind === 'potion' ? ' litre' : ' marbles'} and has ${amount(current.filled[index])}. Select that friend and adjust the order, or use Undo.`);
    }
    if (item.kind === 'shape') return tr('วงเวทยังไม่ครบขอบรูป ลองเชื่อมจุดรอบนอก แล้วกลับไปจุดเริ่มต้น', 'The spell needs every outside edge. Follow the vertices around the shape, then return to the start.');
    if (item.kind === 'variable') return tr('พลังสองข้างยังไม่เท่ากัน ลองเปลี่ยนค่าตัวแปรแล้วสังเกตฝั่งซ้าย', 'The two sides have different energy. Change the variable and watch the left side.');
    return tr(`พลังยังไม่รวมเป็น ${item.target} ลองคืนอักษรเวทแล้วเลือกชุดใหม่`, `The runes do not total ${item.target} yet. Return a rune and try another combination.`);
  }
  function deliver() {
    if (!active || !current || mode !== 'level') return false;
    if (!isMagicShopSolved(current)) { feedback = retryMessage(); render(); return false; }
    const firstAward = !completed.includes(current.levelId);
    if (!store.complete(current)) return false;
    if (firstAward) { completed.push(current.levelId); trackGameComplete(`magic-shop-${chapter}`); }
    awarded = firstAward; mode = 'success'; feedback = ''; persist(); render(false);
    panel.querySelector('#magic-shop-success-heading')?.focus?.({ preventScroll: true });
    const reducedMotion = document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    panel.querySelector('#magic-shop-success')?.scrollIntoView?.({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' }); return true;
  }
  function nextLevel() {
    if (!active || !current || mode !== 'success') return false;
    const list = chapterLevels(chapter), index = list.findIndex(item => item.id === current.levelId);
    if (!list[index + 1]) return showMap();
    return openLevel(list[index + 1].id);
  }
  function showMap() { if (!active) return false; persist(); mode = 'map'; render(false); panel.querySelector('#magic-shop-heading')?.focus(); return true; }
  function start(nextGrade = 1) {
    if (!Number.isInteger(nextGrade) || nextGrade < 1 || nextGrade > 6) return false;
    const wasActive = active;
    grade = nextGrade; language = getLanguage(); active = true;
    if (!chapter) chapter = grade <= 2 ? 'marbles' : 'potions';
    if (firstStart && current && isMagicShopSolved(current) && completed.includes(current.levelId)) mode = 'success';
    firstStart = false;
    if (!wasActive && current && mode === 'level') trackGameStart(`magic-shop-${chapter}`);
    render(false); focusHeading(); return true;
  }
  function getState() {
    return { active, grade, language, chapter, mode, levelId: current?.levelId || null, level: current ? { id: level().id, kind: level().kind, title: local(level().title), goal: local(level().goal) } : null, current: current ? JSON.parse(JSON.stringify(current)) : null, completed: [...completed], feedback, hinted, canUndo: history.length > 0, solved: Boolean(current && isMagicShopSolved(current)), storage: store.status() };
  }
  return { start, getState, deactivate() { persist(); active = false; }, setLanguage(next) { if (!['th', 'en'].includes(next)) return false; language = next; if (feedback && current) feedback = retryMessage(); if (active) render(); return true; }, actions: { selectChapter, openLevel, selectCustomer, addToken, split, pack, chooseRune, removeRune, vertex, setValue, undo, reset, showHint, deliver, nextLevel, showMap } };
}
