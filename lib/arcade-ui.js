import { ARCADE_MODES, createArcadeRound, localizeArcadeRound } from './arcade.js';
import { arcadeText } from './arcade-i18n.js';
import { getLanguage } from './i18n.js';
import { trackGameStart, trackGameComplete } from './analytics.js';

const element = (tag, className = '', text = '') => { const item = document.createElement(tag); item.className = className; if (text) item.textContent = text; return item; };
const button = (text, action, className = 'arcade-option') => { const item = element('button', className, text); item.type = 'button'; item.addEventListener('click', action); return item; };

/** Untimed, device-local play. Success stars reward completion, with unlimited retries. */
export function createArcadeController(panel, onHome) {
  let round = null;
  let language = getLanguage();
  const el = (tag, className = '', text = '') => element(tag, className, arcadeText(text, language));
  const btn = (text, action, className) => button(arcadeText(text, language), action, className);
  let active = false;
  const current = () => round?.activities[round.index];
  const status = () => round?.results[round.index];
  const ready = () => active && round && !round.completed && !status().correct;
  function start(grade, mode) {
    const deck = createArcadeRound(grade, mode, { language: getLanguage() });
    active = true;
    round = { ...deck, index: 0, completed: false, results: deck.activities.map(() => ({ correct: false, attempts: 0, hinted: false, order: [], matched: [], left: null, message: '' })) };
    trackGameStart(`arcade-${round.mode}`);
    render(); return true;
  }
  function complete() { const result = status(); result.correct = true; result.message = 'สำเร็จแล้ว! ✦ ' + current().translations.th.hint; }
  function choose(id) {
    if (!ready() || current().kind !== 'choice' || !current().options.some(option => option.id === id)) return false;
    const result = status(); result.attempts++;
    if (id === current().correctId) complete(); else result.message = 'ยังไม่ตรง ลองคิดอีกครั้ง หรือเปิดวิธีคิดได้';
    render(); return result.correct;
  }
  function selectOrder(id) {
    if (!ready() || current().kind !== 'order' || status().order.includes(id) || !current().options.some(option => option.id === id)) return false;
    status().order.push(id); status().message = ''; render(); return true;
  }
  function undoOrder() { if (!ready() || current().kind !== 'order') return false; status().order.pop(); status().message = ''; render(); return true; }
  function checkOrder() {
    if (!ready() || current().kind !== 'order' || status().order.length !== current().correctOrder.length) return false;
    const result = status(); result.attempts++;
    if (result.order.every((id, index) => id === current().correctOrder[index])) complete(); else result.message = 'ลองตรวจจากน้อยไปมาก กดย้อนตัวล่าสุดเพื่อจัดใหม่ได้';
    render(); return result.correct;
  }
  function selectLeft(id) {
    if (!ready() || current().kind !== 'match' || status().matched.includes(id) || !current().pairs.some(pair => pair.id === id)) return false;
    status().left = id; status().message = 'เลือกคำตอบฝั่งขวาที่เข้าคู่กัน'; render(); return true;
  }
  function selectRight(id) {
    if (!ready() || current().kind !== 'match' || !status().left || status().matched.includes(id) || !current().pairs.some(pair => pair.id === id)) return false;
    const result = status(); result.attempts++;
    const correct = result.left === id;
    if (correct) { result.matched.push(id); result.message = 'จับคู่ได้แล้ว! ลองคู่ถัดไป'; if (result.matched.length === current().pairs.length) complete(); }
    else result.message = 'คู่นี้ยังไม่ตรง ลองเลือกใหม่ได้';
    result.left = null; render(); return correct;
  }
  function hint() { if (!active || !round || round.completed) return false; status().hinted = true; render(); return true; }
  function next() {
    if (!active || !round || round.completed || !status().correct) return false;
    if (round.index === round.activities.length - 1) { round.completed = true; trackGameComplete(`arcade-${round.mode}`); } else round.index++;
    render(); return true;
  }
  function render(nextLanguage = getLanguage()) {
    if (!['th', 'en'].includes(nextLanguage)) return false;
    language = nextLanguage;
    if (!active || !round) return;
    localizeArcadeRound(round, language);
    panel.replaceChildren();
    const top = el('div', 'view-top'), scope = el('div');
    scope.append(el('span', 'eyebrow', 'ป.' + round.grade + ' · เกมคณิตศาสตร์'), el('h1', '', round.title));
    top.append(scope, btn('กลับไปเลือกเกม', onHome, 'button outline compact')); panel.append(top);
    const stars = round.results.filter(result => result.correct).length;
    const track = el('p', 'arcade-progress', '✦ ดาวที่คิดสำเร็จ ' + stars + ' / ' + round.activities.length + ' · ไม่จับเวลา'); track.setAttribute('role', 'status'); panel.append(track);
    if (round.completed) {
      const done = el('section', 'arcade-card arcade-complete');
      done.append(el('span', 'arcade-medal', '✦'), el('h2', '', 'เล่นครบแล้ว เก็บดาวได้เต็มเลย!'), el('p', '', 'ฝึกสำเร็จ ' + stars + ' กิจกรรม · เปิดวิธีคิด ' + round.results.filter(result => result.hinted).length + ' กิจกรรม'), el('p', 'fine', 'ดาวมาจากการคิดสำเร็จ ลองใหม่และขอความช่วยเหลือได้'));
      const actions = el('div', 'lesson-actions'); actions.append(btn('สุ่มเล่นเกมนี้อีก', () => start(round.grade, round.mode), 'button primary'), btn('เลือกเกมอื่น', onHome, 'button outline')); done.append(actions); panel.append(done); const heading = done.querySelector?.('h2'); if (heading) { heading.tabIndex = -1; heading.focus(); } return;
    }
    const activity = current(), result = status(), card = el('section', 'arcade-card');
    card.append(el('span', 'tiny-label', 'ด่าน ' + (round.index + 1) + ' / ' + round.activities.length));
    const heading = el('h2', 'arcade-question', activity.prompt); heading.tabIndex = -1; card.append(heading);
    if (activity.visual?.type === 'parts') {
      const diagram = el('div', 'arcade-parts'); diagram.setAttribute('role', 'img'); diagram.setAttribute('aria-label', arcadeText('แบ่งเป็น ' + activity.visual.total + ' ส่วนเท่ากัน ระบายสี ' + activity.visual.filled + ' ส่วน', language));
      for (let index = 0; index < activity.visual.total; index++) { const part = el('span', 'arcade-part' + (index < activity.visual.filled ? ' filled' : ''), index < activity.visual.filled ? '●' : '○'); part.setAttribute('aria-hidden', 'true'); diagram.append(part); }
      card.append(diagram);
    }
    if (activity.kind === 'choice') {
      const choices = el('div', 'arcade-options');
      activity.options.forEach(option => { const choice = btn(option.label, () => choose(option.id)); choice.disabled = result.correct; if (result.correct && option.id === activity.correctId) choice.className += ' correct'; choices.append(choice); }); card.append(choices);
    } else if (activity.kind === 'order') {
      card.append(el('p', 'fine', 'แตะจำนวนจากน้อยไปมาก แล้วกดตรวจลำดับ'));
      const selection = el('ol', 'arcade-order-slots'); selection.setAttribute('aria-label', arcadeText('ลำดับที่เลือก', language));
      result.order.forEach(id => selection.append(el('li', '', activity.options.find(option => option.id === id).label))); card.append(selection);
      const choices = el('div', 'arcade-options');
      activity.options.forEach(option => { const choice = btn(option.label, () => selectOrder(option.id)); choice.disabled = result.correct || result.order.includes(option.id); choices.append(choice); }); card.append(choices);
      const tools = el('div', 'lesson-actions'), undo = btn('ย้อนตัวล่าสุด', undoOrder, 'button outline compact'), check = btn('ตรวจลำดับ', checkOrder, 'button primary compact'); undo.disabled = result.correct || !result.order.length; check.disabled = result.correct || result.order.length !== activity.options.length; tools.append(undo, check); card.append(tools);
    } else if (activity.kind === 'match') {
      card.append(el('p', 'fine', 'เลือกโจทย์ฝั่งซ้าย แล้วเลือกคำตอบฝั่งขวา'));
      const columns = el('div', 'arcade-matching'), left = el('div'), right = el('div');
      activity.pairs.forEach(pair => { const choice = btn(pair.left, () => selectLeft(pair.id)); choice.disabled = result.correct || result.matched.includes(pair.id); choice.setAttribute('aria-pressed', String(result.left === pair.id)); left.append(choice); });
      activity.rightOrder.forEach(id => { const pair = activity.pairs.find(item => item.id === id), choice = btn(pair.right, () => selectRight(id)); choice.disabled = result.correct || result.matched.includes(id); right.append(choice); }); columns.append(left, right); card.append(columns);
    }
    const message = el('p', 'feedback' + (result.correct ? ' success' : ''), result.message); message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite'); card.append(message);
    if (result.hinted && !result.correct) card.append(el('p', 'hint-box', activity.hint));
    const actions = el('div', 'lesson-actions'); let focusTarget = heading;
    if (!result.correct) { const help = btn(result.hinted ? 'เปิดวิธีคิดแล้ว' : 'ดูวิธีคิด', hint, 'button hint-button compact'); help.disabled = result.hinted; actions.append(help); }
    else { const advance = btn(round.index === round.activities.length - 1 ? 'รับตราจบรอบ →' : 'ด่านต่อไป →', next, 'button primary'); actions.append(advance); focusTarget = advance; }
    card.append(actions); panel.append(card); focusTarget.focus();
  }
  return { start, render, setLanguage: nextLanguage => { if (!['th', 'en'].includes(nextLanguage)) return false; render(nextLanguage); return true; }, deactivate: () => { active = false; }, getState: () => round ? JSON.parse(JSON.stringify(round)) : null, actions: { choose, selectOrder, undoOrder, checkOrder, selectLeft, selectRight, hint, next } };
}

export function renderArcadeMenu(container, onStart) {
  container.replaceChildren();
  ARCADE_MODES.forEach(mode => {
    const card = button('', () => onStart(mode.id), 'arcade-game-card'); card.dataset.arcadeMode = mode.id;
    const icon = element('span', 'arcade-game-icon', mode.icon); icon.setAttribute('aria-hidden', 'true');
    const copy = getLanguage() === 'en' ? mode.en : mode;
    card.append(icon, element('strong', '', copy.title), element('small', '', copy.description)); container.append(card);
  });
}
