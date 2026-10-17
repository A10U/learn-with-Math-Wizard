import { MISSION, CHALLENGE_DECK, CONTACTS } from './lib/content.js';
import { parseNumber, newAttempt, recordAttempt, createLearningState, makeTenMove, rankScores } from './lib/engine.js';
import { createStore } from './lib/storage.js';
import { createAudio } from './lib/audio.js';

const $ = id => document.getElementById(id);
const store = createStore();
const audio = createAudio();
const initial = store.readProgress();
let progress = initial.data;
let view = 'home';
let challenge = null;
let timer = null;
let cleanupDrawing = null;
const steps = ['story', 'model', 'equation', 'answer', 'trace', 'write', 'explain', 'transfer', 'summary'];
const fields = { story: 'story', equation: 'equation', answer: 'base', explain: 'explanation', transfer: 'transfer' };
const expected = { story: MISSION.storyExpected, equation: MISSION.equationExpected, base: MISSION.baseExpected, explanation: MISSION.explanationExpected, transfer: MISSION.transfer.expected };
const titles = { story: ['เรื่องนี้ถามอะไรนะ?', 'ฟังหรืออ่านข้อความ แล้วเลือกสิ่งที่เราต้องหา'], model: ['เติมให้ครบสิบกัน', 'แตะกองแสงหรือใช้ปุ่มย้ายทีละดวงให้เต็มกรอบแรก'], equation: ['ภาพนี้เขียนเป็นโจทย์แบบไหน?', 'เลือกสมการที่ตรงกับเรื่องในสวน'], answer: ['ตอนนี้มีแสงทั้งหมดเท่าไร?', 'พิมพ์คำตอบของเรา แล้วลองตรวจด้วยภาพที่จัดไว้'], trace: ['บันทึกเลขลงสมุดเวท', 'เริ่มจากเขียนตามรอย 14 ไม่ต้องรีบและไม่ต้องเป๊ะ'], write: ['คราวนี้ลองเขียนเอง', 'เขียนเลข 14 แล้วบอกว่าเราตั้งใจเขียนจำนวนใด'], explain: ['แสงย้ายที่…จำนวนเปลี่ยนไหม?', 'เลือกคำอธิบายที่ตรงกับสิ่งที่เราทำ'], transfer: ['ลองเรื่องใหม่ด้วยตัวเอง', 'ยังไม่เปิดภาพช่วย ลองใช้วิธีที่เราถนัดก่อน'], summary: ['สวนกลับมาสว่างแล้ว!', 'เราได้ลองคิด จัดภาพ และอธิบายวิธีของตัวเอง'] };

function node(tag, className = '', text = '') { const element = document.createElement(tag); if (className) element.className = className; if (text) element.textContent = text; return element; }
function button(text, className, action) { const element = node('button', className, text); element.type = 'button'; if (action) element.addEventListener('click', action); return element; }
function feedback() { const element = node('p', 'feedback'); element.setAttribute('role', 'status'); element.setAttribute('aria-live', 'polite'); return element; }
function focusHeading(id) { const heading = $(id); if (heading) heading.focus(); }
function notice(result) { if (result?.message) $('storage-status').textContent = result.message; }
function saveProgress() { if (!progress) return; progress.updatedAt = Date.now(); const result = store.writeProgress(progress); notice(result); if (result.data) progress = result.data; }
function stopTimer() { if (timer !== null) { clearInterval(timer); timer = null; } }
function cancelChallenge() { stopTimer(); challenge = null; }
function showView(next) { if (cleanupDrawing) { cleanupDrawing(); cleanupDrawing = null; } audio.stop(); view = next; ['home', 'learning', 'challenge', 'parents'].forEach(name => { $('view-' + name).hidden = name !== next; }); }
function formatTime(ms) { const seconds = Math.floor(ms / 1000); return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); }
function audioControls(text) {
  const row = node('div', 'audio-row'); const status = node('span', 'audio-note', 'มีข้อความให้อ่านเสมอ เสียงภาษาไทยขึ้นกับเครื่องที่ใช้');
  row.append(button('▷ ฟัง / ฟังอีกครั้ง', '', () => { const played = audio.speak(text); status.textContent = played ? 'กำลังอ่านเรื่อง กดหยุดหรือฟังซ้ำได้' : !audio.isEnabled() ? 'เสียงปิดอยู่ เปิดเสียงที่แถบด้านบนหรืออ่านข้อความต่อได้' : 'เครื่องนี้ยังไม่มีเสียงภาษาไทยที่พร้อมใช้ อ่านข้อความด้านบนต่อได้เลย'; }), button('หยุดเสียง', '', () => { audio.stop(); status.textContent = 'หยุดเสียงแล้ว อ่านข้อความต่อได้'; }), status); return row;
}
function renderHome() {
  $('resume-mission').hidden = !progress;
  $('resume-mission').textContent = progress?.completed ? 'ดูผลภารกิจล่าสุด' : 'เรียนต่อ';
  $('new-mission-confirm').hidden = true;
}
function goHome() { if (progress && view === 'learning') saveProgress(); cancelChallenge(); showView('home'); renderHome(); focusHeading('home-heading'); }
function startNewMission() { cancelChallenge(); progress = createLearningState(); saveProgress(); showView('learning'); renderLearning(); }
function resumeMission() { if (!progress) return; cancelChallenge(); showView('learning'); renderLearning(); }

function submitLearningAnswer(field, raw) {
  if (!progress || fields[progress.step] !== field || progress.answers[field].correct) return { valid: false, correct: false };
  const result = recordAttempt(progress.answers[field], raw, expected[field], { hintLevel: progress.hints[field] || 0 });
  if (result.valid) { progress.answers[field] = result.attempt; saveProgress(); }
  return result;
}
function requestHint(field) {
  if (!progress || fields[progress.step] !== field || !['base', 'transfer'].includes(field) || progress.answers[field].correct) return 0;
  progress.hints[field] = Math.min(3, progress.hints[field] + 1); saveProgress(); return progress.hints[field];
}
function moveLight(delta) { if (!progress || progress.step !== 'model') return null; progress.moved = makeTenMove(progress.moved, delta); saveProgress(); return progress.moved; }
function markWritingAttempt() { if (!progress || !['trace', 'write'].includes(progress.step)) return; progress.writing.attempted = true; }
function completeTrace() { if (!progress || progress.step !== 'trace' || !progress.writing.attempted) return false; progress.writing.traceDone = true; progress.step = 'write'; saveProgress(); renderLearning(); return true; }
function confirmWriting(raw) {
  if (!progress || progress.step !== 'write') return false;
  const number = parseNumber(raw, { integerOnly: true });
  if (number === null || number > 99 || !progress.writing.attempted) return false;
  progress.writing.confirmed = number; progress.step = 'explain'; saveProgress(); renderLearning(); return true;
}
function skipWriting() {
  if (!progress || !['trace', 'write'].includes(progress.step)) return false;
  progress.writing.skipped = true; progress.step = progress.step === 'trace' ? 'write' : 'explain'; saveProgress(); renderLearning(); return true;
}
function advanceLearning() {
  if (!progress) return false;
  const current = progress.step;
  if (current === 'story' && progress.answers.story.correct) progress.step = 'model';
  else if (current === 'model' && progress.moved === 2) progress.step = 'equation';
  else if (current === 'equation' && progress.answers.equation.correct) progress.step = 'answer';
  else if (current === 'answer' && progress.answers.base.correct) progress.step = 'trace';
  else if (current === 'explain' && progress.answers.explanation.correct) progress.step = 'transfer';
  else if (current === 'transfer' && progress.answers.transfer.correct) { progress.step = 'summary'; progress.completed = true; }
  else return false;
  saveProgress(); renderLearning(); return true;
}
function learningHeader() {
  const index = steps.indexOf(progress.step); $('step-position').textContent = 'ช่วงที่ ' + (index + 1) + ' จาก 9 · โหมดฝึก ไม่มีเวลาบังคับ';
  $('step-title').textContent = titles[progress.step][0]; $('step-subtitle').textContent = titles[progress.step][1];
  const track = $('mission-track'); track.replaceChildren(); steps.forEach((step, i) => { const dot = node('span', 'mission-dot' + (i < index ? ' done' : i === index ? ' current' : '')); dot.setAttribute('aria-hidden', 'true'); track.append(dot); });
}
function renderLearning() {
  if (!progress) return;
  if (cleanupDrawing) { cleanupDrawing(); cleanupDrawing = null; } audio.stop(); learningHeader(); const panel = $('learning-panel'); panel.replaceChildren();
  if (progress.step === 'story') renderChoice(panel, 'story', MISSION.storyChoices, MISSION.story + ' ' + MISSION.question, 'เราต้องหาจำนวนอะไร?');
  else if (progress.step === 'model') renderModel(panel);
  else if (progress.step === 'equation') renderChoice(panel, 'equation', MISSION.equationChoices, 'มีแสงเดิม 8 ดวง และนำมาเพิ่มอีก 6 ดวง', 'สมการไหนเล่าเรื่องนี้?');
  else if (progress.step === 'answer') renderNumeric(panel, 'base', MISSION.question, 'ดวง');
  else if (progress.step === 'trace' || progress.step === 'write') renderWriting(panel);
  else if (progress.step === 'explain') renderChoice(panel, 'explanation', MISSION.explanationChoices, 'เราแบ่งแสง 6 ดวงเป็น 2 กับ 4 แล้วย้าย 2 ไปเติมกรอบแรก', 'ทำไมแสงทั้งหมดจึงยังเท่าเดิม?');
  else if (progress.step === 'transfer') { panel.append(node('p', 'story-text', MISSION.transfer.story)); renderNumeric(panel, 'transfer', MISSION.transfer.question, 'ลูก'); }
  else renderSummary(panel);
  focusHeading('step-title');
}
function renderChoice(panel, field, choices, story, question) {
  panel.append(node('p', 'story-text', story), node('p', 'question', question), audioControls(story + ' ' + question));
  const list = node('div', 'choices'); list.setAttribute('role', 'group'); list.setAttribute('aria-label', question);
  let selected = progress.answers[field].answer; const status = feedback(); const submit = button('ตรวจคำตอบ', 'button primary', submitChoice); const next = button('ไปต่อ →', 'button primary', advanceLearning);
  const choiceButtons = choices.map((choice, index) => { const item = button('', 'choice-button', () => { if (progress.answers[field].correct) return; selected = choice.id; update(); }); item.append(node('span', 'choice-number', String(index + 1)), node('span', '', choice.label)); item.dataset.choice = String(choice.id); list.append(item); return item; });
  function update() { choiceButtons.forEach(item => { item.setAttribute('aria-pressed', String(Number(item.dataset.choice) === selected)); item.disabled = progress.answers[field].correct; }); submit.hidden = progress.answers[field].correct; next.hidden = !progress.answers[field].correct; }
  function submitChoice() {
    if (selected === null) { status.textContent = 'เลือกหนึ่งคำตอบก่อนนะ'; return; }
    const result = submitLearningAnswer(field, selected); if (!result.valid) return;
    status.className = 'feedback ' + (result.correct ? 'success' : 'error');
    status.textContent = result.correct ? 'ใช่เลย! ไปลองขั้นต่อไปกัน' : field === 'story' ? 'สิ่งที่เพิ่มมาคือข้อมูลที่รู้แล้ว ลองดูว่าเรื่องถามจำนวนอะไร' : field === 'equation' ? 'เรื่องนี้นำแสงมาเพิ่ม ลองเลือกสมการที่แสดงการรวม' : 'แสงแค่ย้ายที่ ไม่ได้เพิ่มหรือหายไป ลองดูคำอธิบายอีกครั้ง';
    update(); if (result.correct) next.focus();
  }
  if (progress.answers[field].correct) status.textContent = 'บันทึกคำตอบช่วงนี้แล้ว ไปต่อได้เลย';
  const actions = node('div', 'lesson-actions'); actions.append(submit, next); panel.append(list, status, actions); update();
}
function renderModel(panel) {
  const layout = node('div', 'model-layout'); const left = button('', 'light-group', () => change(-1)); const right = button('', 'light-group', () => change(1));
  left.id = 'light-left'; right.id = 'light-right'; const leftGrid = node('span', 'ten-frame'); const rightGrid = node('span', 'ten-frame');
  const leftTitle = node('strong'); const rightTitle = node('strong'); left.append(leftTitle, leftGrid, node('p', '', 'แตะเพื่อย้ายคืน')); right.append(rightTitle, rightGrid, node('p', '', 'แตะเพื่อเติมกรอบแรก'));
  layout.append(left, node('span', 'model-arrow', '←'), right); panel.append(layout);
  const minus = button('− ย้ายคืน 1 ดวง', 'button outline compact', () => change(-1)); const plus = button('+ เติม 1 ดวง', 'button pale compact', () => change(1));
  const controls = node('div', 'model-controls'); controls.append(minus, plus); const message = node('p', 'model-message'); message.setAttribute('role', 'status'); const next = button('จัดครบแล้ว ไปต่อ →', 'button primary', advanceLearning);
  function grid(element, count) { element.replaceChildren(); for (let i = 0; i < 10; i++) { const cell = node('span', 'light-cell' + (i < count ? ' filled' : '')); cell.setAttribute('aria-hidden', 'true'); element.append(cell); } }
  function update() { const m = progress.moved; grid(leftGrid, 8 + m); grid(rightGrid, 6 - m); leftTitle.textContent = 'กรอบแรก: ' + (8 + m) + ' ดวง'; rightTitle.textContent = 'กองที่เพิ่ม: ' + (6 - m) + ' ดวง'; left.setAttribute('aria-label', 'กรอบแรกมี ' + (8 + m) + ' ดวง แตะย้ายคืนหนึ่งดวง'); right.setAttribute('aria-label', 'กองที่เพิ่มเหลือ ' + (6 - m) + ' ดวง แตะเติมหนึ่งดวง'); minus.disabled = left.disabled = m === 0; plus.disabled = right.disabled = m === 2; next.disabled = m !== 2; message.textContent = m === 2 ? 'ได้ 10 กับอีก 4! แสงทั้งหมดไม่ได้เปลี่ยน' : 'กรอบแรกขาดอีก ' + (2 - m) + ' ดวงจะครบสิบ'; }
  function change(delta) { moveLight(delta); update(); }
  panel.append(controls, message, audioControls('ย้ายแสงจากกองที่เพิ่มไปเติมกรอบแรกให้ครบสิบ แสงที่ย้ายไม่ได้หายไป'), next); update();
}
function keypad(input) {
  const pad = node('div', 'keypad'); pad.setAttribute('role', 'group'); pad.setAttribute('aria-label', 'แป้นตัวเลข');
  ['1','2','3','4','5','6','7','8','9','0','ลบ','ล้าง'].forEach(value => pad.append(button(value, '', () => { if (input.disabled) return; input.value = value === 'ลบ' ? input.value.slice(0, -1) : value === 'ล้าง' ? '' : (input.value + value).slice(0, 8); input.removeAttribute('aria-invalid'); input.focus(); }))); return pad;
}
function numberForm(label, unit, identity) {
  const form = node('form', 'answer-form'); form.noValidate = true; const input = node('input', 'numeric-input'); input.id = identity; input.type = 'text'; input.inputMode = 'numeric'; input.autocomplete = 'off'; input.maxLength = 8; input.setAttribute('aria-label', label);
  const caption = node('label', '', label); caption.htmlFor = identity; const row = node('div', 'input-row'); row.append(input, node('span', 'input-unit', unit)); const submit = button('ส่งคำตอบ', 'button primary'); submit.type = 'submit';
  form.append(caption, row, keypad(input), submit); return { form, input, submit };
}
function renderNumeric(panel, field, question, unit) {
  panel.append(node('p', 'question', question), audioControls((field === 'transfer' ? MISSION.transfer.story + ' ' : '') + question));
  const { form, input, submit } = numberForm('คำตอบของเรา', unit, 'learning-answer'); const status = feedback(); const next = button('ไปต่อ →', 'button primary', advanceLearning);
  const hint = button('ขอคำใบ้', 'button hint-button compact', () => { requestHint(field); updateHints(); }); const hints = node('div', 'hint-box');
  function updateHints() { const level = progress.hints[field]; hints.hidden = level === 0; hints.replaceChildren(); const list = node('ol'); MISSION.hints[field].slice(0, level).forEach(text => list.append(node('li', '', text))); hints.append(node('strong', 'tiny-label', 'คำใบ้ที่เปิดแล้ว'), list); hint.textContent = level < 3 ? 'ขอคำใบ้ (' + level + '/3)' : 'เปิดคำใบ้ครบแล้ว'; hint.disabled = level === 3 || progress.answers[field].correct; }
  function update() { const correct = progress.answers[field].correct; input.disabled = submit.disabled = correct; next.hidden = !correct; hint.hidden = correct; if (correct) input.value = String(progress.answers[field].answer); updateHints(); }
  form.addEventListener('submit', event => { event.preventDefault(); const result = submitLearningAnswer(field, input.value); if (!result.valid) { if (!progress.answers[field].correct) { input.setAttribute('aria-invalid', 'true'); status.textContent = 'พิมพ์จำนวนเต็ม เช่น 12 หรือ ๑๒ ช่องว่างหรือข้อความยังไม่นับเป็นคำตอบ'; input.focus(); } return; } input.removeAttribute('aria-invalid'); status.className = 'feedback ' + (result.correct ? 'success' : 'error'); status.textContent = result.correct ? (field === 'base' ? 'ถูกแล้ว 14 ดวง! เรามีสิบกับอีกสี่' : 'ใช่เลย 15 ลูก! เราใช้วิธีคิดกับเรื่องใหม่ได้') : 'ยังไม่ตรง ลองตรวจปริมาณอีกครั้ง หรือเปิดคำใบ้ได้'; update(); if (result.correct) next.focus(); });
  if (progress.answers[field].correct) status.textContent = 'เก็บคำตอบของช่วงนี้แล้ว ไปต่อได้';
  const actions = node('div', 'lesson-actions'); actions.append(hint, next); panel.append(form, status, actions, hints, node('p', 'fine', 'พิมพ์เลขไทยหรืออารบิกได้ ใช้คำใบ้ช่วยคิดแล้วลองอีกครั้งได้เลย')); update();
}
function installDrawing(canvas, trace, status) {
  let ctx; try { ctx = canvas.getContext('2d'); } catch { ctx = null; }
  const strokes = []; let active = null;
  if (!ctx) { status.textContent = 'อุปกรณ์นี้ยังเปิดพื้นที่เขียนไม่ได้ ใช้ปุ่มข้ามได้เลย'; return () => {}; }
  function redraw() { const rect = canvas.getBoundingClientRect(); const width = Math.max(1, rect.width); const height = Math.max(1, rect.height); const dpr = Math.min(window.devicePixelRatio || 1, 3); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height); if (trace) { ctx.save(); ctx.font = 'bold ' + Math.min(height * .76, width * .46) + 'px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeStyle = '#bdcdb1'; ctx.lineWidth = 2; ctx.setLineDash([3, 6]); ctx.strokeText('14', width / 2, height / 2 + 8); ctx.restore(); } ctx.strokeStyle = '#245f44'; ctx.fillStyle = '#245f44'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; strokes.forEach(stroke => { if (!stroke.length) return; ctx.beginPath(); ctx.moveTo(stroke[0].x * width, stroke[0].y * height); stroke.slice(1).forEach(point => ctx.lineTo(point.x * width, point.y * height)); if (stroke.length === 1) { ctx.arc(stroke[0].x * width, stroke[0].y * height, 2.5, 0, Math.PI * 2); ctx.fill(); } else ctx.stroke(); }); }
  function point(event) { const rect = canvas.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width))), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height))) }; }
  canvas.addEventListener('pointerdown', event => { if (active !== null || (event.button !== undefined && event.button !== 0)) return; event.preventDefault(); active = event.pointerId; try { canvas.setPointerCapture(event.pointerId); } catch {} strokes.push([point(event)]); markWritingAttempt(); redraw(); status.textContent = 'ค่อย ๆ เขียนได้เลย ล้างหรือย้อนเส้นได้'; });
  canvas.addEventListener('pointermove', event => { if (active !== event.pointerId) return; event.preventDefault(); strokes[strokes.length - 1].push(point(event)); redraw(); });
  const finish = event => { if (active === event.pointerId) active = null; }; canvas.addEventListener('pointerup', finish); canvas.addEventListener('pointercancel', finish); canvas.addEventListener('lostpointercapture', finish);
  const resize = () => redraw(); window.addEventListener('resize', resize); redraw();
  canvas.clearDrawing = () => { strokes.length = 0; active = null; redraw(); }; canvas.undoDrawing = () => { strokes.pop(); active = null; redraw(); }; canvas.hasDrawing = () => strokes.length > 0;
  return () => window.removeEventListener('resize', resize);
}
function renderWriting(panel) {
  const trace = progress.step === 'trace'; const wrap = node('div', 'drawing-wrap'); const canvas = node('canvas', 'writing-canvas'); canvas.id = 'writing-canvas'; canvas.setAttribute('aria-label', trace ? 'พื้นที่เขียนตามรอยเลข 14' : 'พื้นที่เขียนเลขด้วยตัวเอง'); canvas.setAttribute('role', 'img'); canvas.tabIndex = 0;
  const status = feedback(); const tools = node('div', 'writing-tools'); tools.append(button('ย้อนเส้น', '', () => canvas.undoDrawing?.()), button('ล้างพื้นที่', '', () => canvas.clearDrawing?.()));
  wrap.append(node('p', 'fine', 'ใช้นิ้ว ปากกา หรือเมาส์ได้ ข้ามขั้นเขียนได้เสมอ ถ้าพักหรือเปลี่ยนหน้า รอยเขียนจะเริ่มใหม่'), canvas, tools, status); panel.append(wrap);
  cleanupDrawing = installDrawing(canvas, trace, status);
  if (trace) { const actions = node('div', 'lesson-actions'); actions.append(button('ลองเขียนแล้ว ไปต่อ →', 'button primary', () => { if (!canvas.hasDrawing?.()) { status.textContent = 'ลองขีดเขียนก่อน หรือกดข้ามขั้นนี้ได้'; return; } completeTrace(); }), button('ข้ามตามรอย', 'button outline', skipWriting)); panel.append(actions); }
  else { const { form, input, submit } = numberForm('ฉันตั้งใจเขียนจำนวน', '', 'writing-confirm'); submit.textContent = 'ยืนยันเลขและไปต่อ →'; form.addEventListener('submit', event => { event.preventDefault(); if (!canvas.hasDrawing?.()) { status.textContent = 'ลองเขียนเองก่อน หรือใช้ปุ่มข้ามการเขียนด้านล่าง'; return; } if (!confirmWriting(input.value)) { status.textContent = 'ระบุเลขที่ตั้งใจเขียนตั้งแต่ 0–99 เช่น 14 หรือกดข้ามได้'; input.setAttribute('aria-invalid', 'true'); } }); panel.append(form, node('p', 'fine', 'เลือกเลขที่เราตั้งใจเขียน แล้วกดยืนยัน หรือเขียนใหม่ได้'), button('ข้ามการเขียนและไปต่อ', 'button outline', skipWriting)); }
}
function attemptLabel(attempt) { return attempt.validCount === 0 ? 'ยังไม่ได้ประเมิน' : attempt.independent ? 'ถูกครั้งแรก ไม่ใช้คำใบ้' : attempt.correct ? 'ทำได้หลังลอง / มีตัวช่วย' : 'แนะนำฝึกต่อ'; }
function summaryList() { const list = node('ul', 'summary-list'); [['เข้าใจสิ่งที่โจทย์ถาม', 'story'], ['เลือกสมการ', 'equation'], ['คำนวณจากเรื่องในสวน', 'base'], ['อธิบายภาพ', 'explanation'], ['ลองเรื่องลูกแก้ว', 'transfer']].forEach(([label, key]) => { const li = node('li'); li.append(node('span', '', label), node('strong', '', attemptLabel(progress.answers[key]))); list.append(li); }); return list; }
function renderSummary(panel) {
  const hero = node('div', 'summary-hero'); hero.append(node('span', 'summary-star', '✦'), node('h2', '', 'เราเติมแสงให้สวนแล้ว!'), node('p', '', 'จาก 8 + 6 เป็น 10 + 4 แล้วนำวิธีคิดไปลองกับ 9 + 6 ได้อีกเรื่อง')); panel.append(hero, summaryList());
  panel.append(node('p', 'fine', 'ลองอธิบายวิธีคิดให้ผู้ใหญ่ฟัง แล้วกลับมาทบทวนวันอื่นได้'));
  const actions = node('div', 'lesson-actions'); actions.append(button('พักที่หน้าเริ่ม', 'button primary', goHome), button('ให้ผู้ปกครองดูผล', 'button pale', openParentGate)); panel.append(actions);
}

function elapsed() { return challenge?.active ? Math.max(0, Date.now() - challenge.startedAt) : challenge?.elapsedMs || 0; }
function updateChallengeStats() { if (!challenge) return; $('challenge-accuracy').textContent = challenge.answered ? challenge.correct + '/' + challenge.answered + ' (' + Math.round(100 * challenge.correct / challenge.answered) + '%)' : '—'; $('challenge-progress').textContent = challenge.answered + '/5'; $('challenge-time').textContent = formatTime(elapsed()); }
function startChallenge() {
  if (progress && view === 'learning') saveProgress(); cancelChallenge();
  challenge = { active: true, index: 0, answered: 0, correct: 0, locked: false, startedAt: Date.now(), elapsedMs: 0, feedback: '', saved: false };
  showView('challenge'); renderChallenge(); renderRanking(); timer = setInterval(updateChallengeStats, 250); focusHeading('challenge-heading');
}
function submitChallengeAnswer(raw) {
  if (!challenge?.active || challenge.locked) return { valid: false, correct: false };
  const question = CHALLENGE_DECK.questions[challenge.index]; const result = recordAttempt(newAttempt(), raw, question.answer);
  if (!result.valid) return result;
  challenge.locked = true; challenge.answered++; if (result.correct) challenge.correct++;
  challenge.feedback = (result.correct ? 'ถูกต้อง! ' : 'คำตอบคือ ' + question.answer + ' — ') + question.hint;
  if (challenge.answered === 5) {
    challenge.elapsedMs = elapsed(); challenge.active = false; stopTimer();
    const score = { deckId: CHALLENGE_DECK.id, deckVersion: CHALLENGE_DECK.version, grade: 1, total: 5, correct: challenge.correct, elapsedMs: challenge.elapsedMs, completedAt: Date.now() };
    const saved = store.writeScore(score); challenge.saved = true; $('score-storage-status').textContent = saved.message; renderRanking(saved.data);
  }
  renderChallenge(); return result;
}
function nextChallengeQuestion() { if (!challenge?.active || !challenge.locked) return false; challenge.index++; challenge.locked = false; challenge.feedback = ''; renderChallenge(); return true; }
function renderChallenge() {
  if (!challenge) return; updateChallengeStats(); const panel = $('challenge-panel'); panel.replaceChildren();
  if (!challenge.active) { const finalHeading = node('h2', 'challenge-question', 'ถูก ' + challenge.correct + ' จาก 5 ข้อ'); finalHeading.tabIndex = -1; panel.append(node('span', 'tiny-label', 'จบรอบท้าทาย'), finalHeading, node('p', '', 'เวลารวม ' + formatTime(challenge.elapsedMs) + ' · ' + (challenge.correct * 20) + '%'), node('p', 'feedback', challenge.feedback)); const actions = node('div', 'lesson-actions'); actions.append(button('ลองรอบใหม่', 'button primary', startChallenge), button('กลับหน้าเริ่ม', 'button outline', goHome)); panel.append(actions, node('p', 'fine', 'เก่งมากที่ลองคิดจนครบ! ลองรอบใหม่หรือพักก่อนก็ได้ ไม่ต้องรีบ')); finalHeading.focus(); return; }
  const question = CHALLENGE_DECK.questions[challenge.index]; const heading = node('h2', 'challenge-question', question.prompt); heading.tabIndex = -1; panel.append(node('span', 'tiny-label', 'ข้อ ' + (challenge.index + 1) + ' / 5'), heading);
  const { form, input, submit } = numberForm('คำตอบ', '', 'challenge-answer'); const status = feedback(); status.textContent = challenge.feedback; input.disabled = submit.disabled = challenge.locked;
  form.addEventListener('submit', event => { event.preventDefault(); const result = submitChallengeAnswer(input.value); if (!result.valid && challenge?.active && !challenge.locked) { status.textContent = 'พิมพ์เลขจำนวนเต็มก่อน ยังไม่นับเป็นคำตอบ'; input.setAttribute('aria-invalid', 'true'); input.focus(); } }); panel.append(form, status);
  if (challenge.locked) { const next = button('ข้อต่อไป →', 'button primary', nextChallengeQuestion); panel.append(next); next.focus(); } else heading.focus();
}
function renderRanking(rows) {
  const result = rows ? { data: rows } : store.readScores(); if (result.message) $('score-storage-status').textContent = result.message;
  const ranking = rankScores(result.data).slice(0, 10); const list = $('ranking-list'); list.replaceChildren();
  if (!ranking.length) list.append(node('li', '', 'ยังไม่มีรอบที่ทำครบ ลองเล่นตามจังหวะของเราได้เลย'));
  ranking.forEach(row => { const li = node('li'); li.append(node('strong', '', 'อันดับ ' + row.rank + ' · พ่อมดฝึกหัด'), node('div', '', row.correct + '/5 · ' + (row.correct * 20) + '% · ' + (row.elapsedMs / 1000).toFixed(3) + ' วินาที')); list.append(li); });
}
function openParentGate() {
  if (progress && view === 'learning') saveProgress(); cancelChallenge(); showView('parents'); const panel = $('parent-panel'); panel.replaceChildren(); const gate = node('div', 'parent-gate');
  gate.append(node('h2', '', 'ส่งต่อให้ผู้ปกครองสักครู่'), node('p', '', 'พื้นที่นี้สำหรับผู้ปกครองดูผลการฝึก คำแนะนำช่วยลูก และช่องทางติดต่อสถาบัน'), button('ฉันเป็นผู้ปกครอง ดูผลและข้อมูล', 'button primary', renderParents)); panel.append(gate); focusHeading('parent-heading');
}
function renderParents() {
  const panel = $('parent-panel'); panel.replaceChildren(); const columns = node('div', 'parent-columns'); const learning = node('section', 'parent-box'); learning.append(node('h2', '', 'ผลการฝึกบนเครื่องนี้'));
  if (progress) { learning.append(node('p', '', (progress.completed ? 'จบช่วงหลักแล้ว' : 'ยังเล่นไม่จบ') + ' · G1-M03 เติมแสงให้สวน'), summaryList()); const w = progress.writing; learning.append(node('p', '', 'การเขียน: ' + (w.attempted ? 'ได้ลองเขียน' : 'ยังไม่ได้ลองเขียน') + (w.skipped ? ' · มีขั้นที่เลือกข้าม' : '') + (w.confirmed !== null ? ' · ยืนยันเองว่าตั้งใจเขียน ' + w.confirmed : '')), node('p', 'fine', 'ไม่มีการประเมินอ่านลายมืออัตโนมัติ การยืนยันเลขไม่ใช่คะแนนคณิตศาสตร์')); learning.append(node('p', '', 'ใบ้คำนวณในสวน: ' + progress.hints.base + '/3 · ใบ้เรื่องใหม่: ' + progress.hints.transfer + '/3')); }
  else learning.append(node('p', '', 'ยังไม่มีผลการฝึก เริ่มภารกิจแล้วกลับมาดูได้'));
  learning.append(node('p', '', 'ลองช่วยต่อ: จัดของ 9 ชิ้นกับ 6 ชิ้น ชวนเด็กเติมให้ครบสิบ แล้วถามว่าส่วนที่เหลือมาจากไหน'), node('p', 'fine', 'ผลนี้แยกการทำเองจากการใช้ตัวช่วย การจบเรื่องเดียวไม่ใช่หลักฐาน mastery และไม่อ้างว่าพัฒนาการเกิดจากเกมแล้ว'));
  const contacts = node('section', 'parent-box'); contacts.append(node('h2', '', 'Math wizard by DR.Suwan'), node('p', '', 'เห็นวิธีคิดของลูก แล้วต่อยอดให้ตรงจุด'), node('p', 'fine', 'ลิงก์ต่อไปนี้ออกจากเกมเมื่อกด ไม่มีการส่งคำตอบหรือข้อมูลเด็กไปช่องทางเหล่านี้อัตโนมัติ'));
  const list = node('ul', 'contact-list'); CONTACTS.forEach(contact => { if (!/^(https?:|tel:|mailto:)/.test(contact.url)) return; const li = node('li'); const a = node('a', '', contact.label + ' ↗'); a.href = contact.url; if (contact.url.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } li.append(a); list.append(li); }); contacts.append(list); columns.append(learning, contacts); panel.append(columns);
  panel.append(node('p', 'fine', 'รุ่นนี้มีภารกิจแรกหนึ่งเรื่องและชุดท้าทายแยกกัน เก็บข้อมูลบนเบราว์เซอร์ที่เล่นเมื่อรองรับ ไม่ซิงก์ข้ามเครื่อง ไม่ขอชื่อจริงเด็ก'));
  const clear = node('div', 'inline-confirm'); clear.hidden = true; clear.append(node('p', '', 'ลบความคืบหน้าฝึกบนเครื่องนี้? คะแนนท้าทายจะไม่ถูกลบ'), button('ยืนยันลบความคืบหน้า', 'button outline compact', () => { const result = store.clearProgress(); progress = null; notice(result); renderParents(); }), button('เก็บข้อมูลเดิม', 'button pale compact', () => { clear.hidden = true; })); panel.append(button('ลบความคืบหน้าฝึกบนเครื่องนี้', 'button outline compact', () => { clear.hidden = false; }), clear);
}

$('start-mission').addEventListener('click', () => { if (progress) { $('new-mission-confirm').hidden = false; $('confirm-new').focus(); } else startNewMission(); });
$('confirm-new').addEventListener('click', startNewMission); $('cancel-new').addEventListener('click', () => { $('new-mission-confirm').hidden = true; });
$('resume-mission').addEventListener('click', resumeMission); $('start-challenge').addEventListener('click', startChallenge);
$('pause-mission').addEventListener('click', goHome); $('brand-home').addEventListener('click', goHome); $('leave-challenge').addEventListener('click', goHome); $('parents-home').addEventListener('click', goHome); $('open-parents').addEventListener('click', openParentGate);
$('audio-toggle').addEventListener('click', () => { audio.setEnabled(!audio.isEnabled()); const enabled = audio.isEnabled(); $('audio-toggle').textContent = enabled ? 'เสียง: เปิด' : 'เสียง: ปิด'; $('audio-toggle').setAttribute('aria-pressed', String(enabled)); });
window.addEventListener('beforeunload', () => { if (progress && view === 'learning') saveProgress(); audio.stop(); stopTimer(); });
notice(initial); showView('home'); renderHome();
export function getAppState() { return JSON.parse(JSON.stringify({ view, progress, challenge })); }
export const appActions = { startNewMission, resumeMission, goHome, startChallenge, submitLearningAnswer, requestHint, moveLight, advanceLearning, markWritingAttempt, completeTrace, confirmWriting, skipWriting, submitChallengeAnswer, nextChallengeQuestion, openParentGate, renderParents };
