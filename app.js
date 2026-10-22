import { MISSION, CONTACTS } from './lib/content.js';
import { parseNumber, newAttempt, recordAttempt, createLearningState, makeTenMove, rankScores } from './lib/engine.js';
import { createStore } from './lib/storage.js';
import { createAudio } from './lib/audio.js';
import { GRADE_PROFILES, QUESTION_PROFILE_VERSION, WRITING_PROFILE_VERSION, createQuestionRound, localizeQuestion, translateTopic, getGradeProfileText } from './lib/questions.js';
import { createHandwritingRound, localizeHandwritingRound } from './lib/handwriting-content.js';
import { geometryPaths, createGeometryRound, localizeGeometryRound, localizedShape } from './lib/geometry.js';
import { mountHandwritingCanvas } from './lib/handwriting.js';
import { PENCIL_COLORS } from './lib/drawing.js';
import { createArcadeController, renderArcadeMenu } from './lib/arcade-ui.js';
import { ARCADE_MODES } from './lib/arcade.js';
import { createAdventureController } from './lib/adventure-ui.js';
import { createWritingTableController } from './lib/writing-table-ui.js';
import { createMathSimulatorController } from './lib/math-simulator-ui.js';
import { createMagicShopController } from './lib/magic-shop-ui.js';
import { getCampaignInfo } from './lib/adventure.js';
import { initializeLanguage, getLanguage, setLanguage, t, translateStatic } from './lib/i18n.js';
import { trackGameStart, trackGameComplete } from './lib/analytics.js';
import { createFontSizeController } from './lib/font-size.js';

const $ = id => document.getElementById(id);
initializeLanguage();
const fontSize = createFontSizeController({ document });
const store = createStore();
const arcade = createArcadeController($('arcade-panel'), goHome);
const adventure = createAdventureController($('adventure-panel'), goHome);
const writingTables = createWritingTableController($('writing-tables-panel'), { onHome: goHome, getColor: () => pencilColor, isSmooth: () => smoothLines });
const mathSimulator = createMathSimulatorController($('math-simulator-panel'), { onHome: goHome });
const magicShop = createMagicShopController($('magic-shop-panel'), { onHome: goHome });
const audio = createAudio();
const initial = store.readProgress();
let progress = initial.data;
let view = 'home';
let selectedGrade = store.readGrade().data;
let selectedPracticeTopic = null;
let motorRequired = store.readMotorRequired().data;
let smoothLines = true;
let pencilColor = '#245f44';
const pencilButtons = [];
let parentUnlocked = false;
let activeAnswerMotor = null;
let activeTraceMotor = null;
const newAnswerInk = () => ({ strokes: [], writingReady: false, revision: 0, inkRevision: 0, confirmedRevision: -1, submittedInkRevision: 0, freshStrokes: [] });
let guidedInk = { base: newAnswerInk(), transfer: newAnswerInk(), trace: newAnswerInk(), write: newAnswerInk() };
let guidedChoices = {};
let challenge = null;
let handwriting = null;
let handwritingCanvas = null;
let timer = null;
let cleanupDrawing = null;
let lastStorageMessage = '';
const steps = ['story', 'model', 'equation', 'answer', 'trace', 'write', 'explain', 'transfer', 'summary'];
const fields = { story: 'story', equation: 'equation', answer: 'base', explain: 'explanation', transfer: 'transfer' };
const expected = { story: MISSION.storyExpected, equation: MISSION.equationExpected, base: MISSION.baseExpected, explanation: MISSION.explanationExpected, transfer: MISSION.transfer.expected };
const titles = { story: ['เรื่องนี้ถามอะไรนะ?', 'ฟังหรืออ่านข้อความ แล้วเลือกสิ่งที่เราต้องหา'], model: ['เติมให้ครบสิบกัน', 'แตะกองแสงหรือใช้ปุ่มย้ายทีละดวงให้เต็มกรอบแรก'], equation: ['ภาพนี้เขียนเป็นโจทย์แบบไหน?', 'เลือกสมการที่ตรงกับเรื่องในสวน'], answer: ['ตอนนี้มีแสงทั้งหมดเท่าไร?', 'เขียนคำตอบของเรา แล้วลองตรวจด้วยภาพที่จัดไว้'], trace: ['บันทึกเลขลงสมุดเวท', 'เริ่มจากเขียนตามรอย 14 ไม่ต้องรีบและไม่ต้องเป๊ะ'], write: ['คราวนี้ลองเขียนเอง', 'เขียนเลข 14 แล้วบอกว่าเราตั้งใจเขียนจำนวนใด'], explain: ['ย้ายแล้ว แสงทั้งหมดเปลี่ยนไหม?', 'ดูภาพก่อนย้ายและหลังย้าย แล้วเลือกคำตอบ'], transfer: ['ลองเรื่องใหม่ด้วยตัวเอง', 'ยังไม่เปิดภาพช่วย ลองใช้วิธีที่เราถนัดก่อน'], summary: ['สวนกลับมาสว่างแล้ว!', 'เราได้ลองคิด จัดภาพ และอธิบายวิธีของตัวเอง'] };

function node(tag, className = '', text = '') { const element = document.createElement(tag); if (className) element.className = className; if (text) element.textContent = t(text); return element; }
function button(text, className, action) { const element = node('button', className, text); element.type = 'button'; if (action) element.addEventListener('click', action); return element; }
function feedback() { const element = node('p', 'feedback'); element.setAttribute('role', 'status'); element.setAttribute('aria-live', 'polite'); return element; }
function focusHeading(id) { const heading = $(id); if (heading) heading.focus(); }
function notice(result) { if (result?.message) { lastStorageMessage = result.message; $('storage-status').textContent = t(result.message); } }
function saveProgress() { if (!progress) return; progress.updatedAt = Date.now(); const result = store.writeProgress(progress); notice(result); if (result.data) progress = result.data; }
function stopTimer() { if (timer !== null) { clearInterval(timer); timer = null; } }
function cancelChallenge() { stopTimer(); challenge = null; }
function showView(next) { if (next !== 'arcade') arcade.deactivate(); if (next !== 'adventure') adventure.deactivate(); if (next !== 'writing-tables') writingTables.deactivate(); if (next !== 'math-simulator') mathSimulator.deactivate(); if (next !== 'magic-shop') magicShop.deactivate(); if (cleanupDrawing) { cleanupDrawing(); cleanupDrawing = null; } audio.stop(); activeAnswerMotor = null; activeTraceMotor = null; if (next !== 'parents') parentUnlocked = false; view = next; ['home', 'learning', 'challenge', 'handwriting', 'arcade', 'adventure', 'writing-tables', 'math-simulator', 'magic-shop', 'parents'].forEach(name => { $('view-' + name).hidden = name !== next; }); if (next !== 'handwriting') { handwriting = null; handwritingCanvas = null; } }
function formatTime(ms) { const seconds = Math.floor(ms / 1000); return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); }
function audioControls(text) {
  const row = node('div', 'audio-row'); const status = node('span', 'audio-note', 'มีข้อความให้อ่านเสมอ เสียงภาษาไทยขึ้นกับเครื่องที่ใช้');
  row.append(button('▷ ฟัง / ฟังอีกครั้ง', '', () => { const played = audio.speak(t(text)); status.textContent = t(played ? 'กำลังอ่านเรื่อง กดหยุดหรือฟังซ้ำได้' : !audio.isEnabled() ? 'เสียงปิดอยู่ เปิดเสียงที่แถบด้านบนหรืออ่านข้อความต่อได้' : 'เครื่องนี้ยังไม่มีเสียงภาษาไทยที่พร้อมใช้ อ่านข้อความด้านบนต่อได้เลย'); }), button('หยุดเสียง', '', () => { audio.stop(); status.textContent = t('หยุดเสียงแล้ว อ่านข้อความต่อได้'); }), status); return row;
}
function renderHome() {
  $('resume-mission').hidden = !progress;
  $('resume-mission').textContent = t(progress?.completed ? 'ดูผลภารกิจทำสิบ ป.1' : 'เรียนต่อภารกิจทำสิบ ป.1');
  $('new-mission-confirm').hidden = true;
  const profile = GRADE_PROFILES.find(item => item.grade === selectedGrade), displayProfile = getGradeProfileText(selectedGrade, getLanguage());
  document.querySelectorAll('[data-grade]').forEach(item => item.setAttribute('aria-pressed', String(Number(item.dataset.grade) === selectedGrade)));
  $('grade-profile-description').textContent = t('โจทย์คิดเลข ป.' + selectedGrade + ' · ' + displayProfile.description);
  const topicPicker = $('practice-topic'); topicPicker.replaceChildren();
  const allTopics = node('option', '', 'รวมทุกหัวข้อ · คละ 5 ข้อ'); allTopics.value = ''; topicPicker.append(allTopics);
  profile.topics.forEach(topic => { const option = node('option', '', translateTopic(topic, getLanguage())); option.value = topic; topicPicker.append(option); });
  topicPicker.value = selectedPracticeTopic || '';
  $('home-math-heading').textContent = t('ฝึกคณิตศาสตร์ ป.' + selectedGrade);
  $('home-arcade-heading').textContent = t('10 เกมคณิตศาสตร์ · ป.' + selectedGrade);
  $('start-practice').textContent = t(selectedPracticeTopic ? 'เริ่มฝึกหัวข้อนี้ →' : 'เริ่มฝึกโจทย์คละ →');
  $('home-grade-tag').textContent = t('พร้อมฝึก ป.' + selectedGrade);
  $('geometry-count').textContent = t((selectedGrade <= 2 ? '6 รูป · สลับลากและวาด 12 กิจกรรม' : '8 รูป · สลับลากและวาด 16 กิจกรรม'));
  $('home-scene-title').textContent = t('ประตูเวทคณิต ป.' + selectedGrade);
  $('home-challenge-label').textContent = t('ท้าทาย' + (motorRequired ? 'เขียน' : 'พิมพ์') + ' 5 ข้อ · ป.' + selectedGrade);
  $('motor-mode-note').textContent = t(motorRequired ? 'เขียน/ลากเส้นเป็นขั้นหลัก · แป้นตัวเลขใช้ยืนยันเลขที่เขียน' : 'ผู้ปกครองเปิดวิธีช่วย: ใช้แป้นตัวเลข ข้าม หรือแตะจับคู่แทนได้');
  $('home-symbol').textContent = t(selectedGrade === 1 ? '+ −' : selectedGrade === 2 ? '× ÷' : selectedGrade >= 5 ? '% ½' : '½ ¼');
  const english = getLanguage() === 'en';
  $('home-adventure-heading').textContent = english ? 'Eight paths through the wizard world' : '8 เส้นทางผจญภัยโลกเวทมนตร์';
  $('home-adventure-description').textContent = english ? 'Clear stages to unlock new chapters, explore the 100-floor tower and face the final guardian.' : 'ผ่านด่านเพื่อปลดล็อกบทใหม่ สำรวจหอคอย 100 ชั้น และไปถึงบทปราบจอมมาร';
  $('home-adventure-scope').textContent = english ? `Grade ${selectedGrade} · 8 chapters · 135 stages · saved checkpoints · local TOP 10` : `ป.${selectedGrade} · 8 บท · 135 ด่าน · บันทึกจุดพัก · TOP 10 บนเครื่อง`;
  $('start-adventure').textContent = english ? 'Enter the adventure world →' : 'เข้าสู่โลกผจญภัย →';
}
function selectPracticeTopic(topic) {
  const value = topic === '' ? null : topic;
  if (value !== null && !GRADE_PROFILES.find(item => item.grade === selectedGrade).topics.includes(value)) return false;
  selectedPracticeTopic = value; renderHome(); return true;
}
function refreshLanguageControls() {
  translateStatic(document);
  $('language-th').setAttribute('aria-pressed', String(getLanguage() === 'th'));
  $('language-en').setAttribute('aria-pressed', String(getLanguage() === 'en'));
  $('audio-toggle').textContent = t(audio.isEnabled() ? 'เสียง: เปิด' : 'เสียง: ปิด');
  $('smooth-toggle').textContent = t('เส้นนุ่ม: ' + (smoothLines ? 'เปิด' : 'ปิด'));
  if (lastStorageMessage) $('storage-status').textContent = t(lastStorageMessage);
  renderPencilPalette(); renderArcadeMenu($('arcade-games'), startArcade);
}
function changeLanguage(language) {
  if (!['th', 'en'].includes(language)) return false;
  const drafts = ['learning-answer', 'writing-confirm', 'challenge-answer'].map(id => [id, $(id)?.value]);
  const previousFocus = document.activeElement?.id;
  const confirmationHidden = $('new-mission-confirm').hidden;
  if (challenge?.active && !challenge.locked && $('challenge-answer')) challenge.draft = $('challenge-answer').value;
  setLanguage(language); audio.stop(); writingTables.setLanguage(language); mathSimulator.setLanguage(language); magicShop.setLanguage(language); refreshLanguageControls(); renderHome();
  $('new-mission-confirm').hidden = confirmationHidden;
  if (challenge) {
    challenge.questions = challenge.questions.map(question => localizeQuestion(question, language));
    challenge.deck.questions = challenge.questions;
    const question = challenge.questions[challenge.index], attempt = challenge.attempts[challenge.index];
    if (attempt.correct) challenge.feedback = 'ถูกต้อง! ' + question.hint;
    else if (attempt.validCount && challenge.mode === 'challenge') challenge.feedback = 'คำตอบคือ ' + question.answer + ' — ' + question.hint;
  }
  if (handwriting) {
    const localized = handwriting.source === 'geometry' ? localizeGeometryRound(handwriting, language) : localizeHandwritingRound(handwriting, language);
    handwriting.activities = localized.activities;
  }
  if (view === 'learning') renderLearning();
  else if (view === 'challenge') { renderChallenge(); renderRanking(); }
  else if (view === 'handwriting') renderHandwriting();
  else if (view === 'arcade') arcade.setLanguage(language);
  else if (view === 'adventure') adventure.setLanguage(language);
  else if (view === 'parents') { if (parentUnlocked) renderParents(); else openParentGate(); }
  for (const [id, value] of drafts) if (value !== undefined && $(id)) $(id).value = value;
  if (previousFocus && $(previousFocus)) $(previousFocus).focus();
  return true;
}
function selectGrade(grade) {
  const number = Number(grade); if (!GRADE_PROFILES.some(item => item.grade === number)) return false;
  if (progress && view === 'learning') saveProgress();
  if (selectedGrade !== number) selectedPracticeTopic = null;
  selectedGrade = number; notice(store.writeGrade(number)); cancelChallenge(); showView('home'); renderHome(); return true;
}
function goHome() { if (progress && view === 'learning') saveProgress(); cancelChallenge(); showView('home'); renderHome(); focusHeading('home-heading'); }
function startArcade(mode, grade = selectedGrade) {
  if (!GRADE_PROFILES.some(profile => profile.grade === grade) || !ARCADE_MODES.some(game => game.id === mode)) return false;
  if (progress && view === 'learning') saveProgress();
  if (selectedGrade !== grade) selectedPracticeTopic = null;
  arcade.start(grade, mode); selectedGrade = grade; notice(store.writeGrade(grade)); cancelChallenge(); showView('arcade');
  const heading = $('arcade-panel').querySelector?.('h1'); if (heading) { heading.tabIndex = -1; heading.focus(); } return true;
}
function startAdventure(grade = selectedGrade, campaign = 'forest') {
  if (!GRADE_PROFILES.some(profile => profile.grade === grade) || !getCampaignInfo(campaign)) return false;
  if (!adventure.start(grade, campaign)) return false;
  if (progress && view === 'learning') saveProgress();
  if (selectedGrade !== grade) selectedPracticeTopic = null;
  selectedGrade = grade; notice(store.writeGrade(grade)); cancelChallenge(); showView('adventure');
  return true;
}
function startMathSimulator(grade = selectedGrade) {
  const number = Number(grade); if (!GRADE_PROFILES.some(profile => profile.grade === number)) return false;
  if (progress && view === 'learning') saveProgress();
  if (selectedGrade !== number) selectedPracticeTopic = null;
  selectedGrade = number; notice(store.writeGrade(number)); cancelChallenge(); showView('math-simulator');
  mathSimulator.start(number); trackGameStart('math-simulator'); return true;
}
function startMagicShop(grade = selectedGrade) {
  const number = Number(grade); if (!GRADE_PROFILES.some(profile => profile.grade === number)) return false;
  if (progress && view === 'learning') saveProgress();
  if (selectedGrade !== number) selectedPracticeTopic = null;
  selectedGrade = number; notice(store.writeGrade(number)); cancelChallenge(); showView('magic-shop');
  magicShop.start(number); return true;
}
function startWritingTables(grade = selectedGrade) {
  const number = Number(grade); if (!GRADE_PROFILES.some(profile => profile.grade === number)) return false;
  if (progress && view === 'learning') saveProgress();
  if (selectedGrade !== number) selectedPracticeTopic = null;
  selectedGrade = number; notice(store.writeGrade(number)); cancelChallenge(); showView('writing-tables');
  // Mount only after revealing the view so the writing board has its actual size.
  writingTables.start(number); trackGameStart('writing-tables'); return true;
}
function startNewMission() { cancelChallenge(); guidedChoices = {}; guidedInk = { base: newAnswerInk(), transfer: newAnswerInk(), trace: newAnswerInk(), write: newAnswerInk() }; progress = createLearningState(); saveProgress(); showView('learning'); renderLearning(); trackGameStart('mission-make-ten'); }
function resumeMission() { if (!progress) return; cancelChallenge(); repairMotorCheckpoint(); showView('learning'); renderLearning(); if (!progress.completed) trackGameStart('mission-make-ten'); }

function repairMotorCheckpoint() {
  if (!motorRequired || !progress || progress.completed || steps.indexOf(progress.step) < steps.indexOf('write')) return;
  const writing = progress.writing;
  if (!writing.traceDone) { progress.step = 'trace'; writing.skipped = false; saveProgress(); }
  else if (writing.skipped || writing.confirmed === null) { progress.step = 'write'; writing.skipped = false; writing.confirmed = null; saveProgress(); }
}
function inkCanConfirm(ink) { return ink.writingReady && ink.inkRevision > ink.submittedInkRevision && ink.freshStrokes.some(stroke => ink.strokes.includes(stroke)); }
function inkCanSubmit(scope, ink) { return !motorRequired || Boolean(activeAnswerMotor?.scope === scope && activeAnswerMotor.control?.isReady() && inkCanConfirm(ink) && ink.confirmedRevision === ink.revision); }
function consumeInk(ink) { ink.submittedInkRevision = ink.inkRevision; ink.confirmedRevision = -1; ink.freshStrokes = []; }
function confirmAnswerWriting(scope = activeAnswerMotor?.scope) {
  const active = activeAnswerMotor;
  if (!active || active.scope !== scope || !active.control?.isReady() || !inkCanConfirm(active.ink)) return false;
  active.ink.confirmedRevision = active.ink.revision; active.refresh(); return true;
}
function setMotorRequired(value) {
  if (view !== 'parents' || !parentUnlocked || typeof value !== 'boolean') return false;
  motorRequired = value; notice(store.writeMotorRequired(value)); renderParents(); return true;
}
function motorMessage(status) { return motorRequired && status?.available === false ? 'เครื่องนี้ยังเขียนไม่ได้ ให้ผู้ปกครองเปิดวิธีช่วยในหน้าสำหรับผู้ปกครอง' : status?.message || ''; }
function mountAnswerSurface(panel, ink, { scope, canvasId, confirmId, trace = false, target = '', onGate = () => {}, onInk = () => {} } = {}) {
  const surface = node('section', 'answer-writing-surface'); surface.setAttribute('aria-label', t(trace ? 'เขียนตามรอย' : 'เขียนคำตอบก่อนยืนยัน'));
  surface.append(node('h3', 'answer-writing-title', trace ? 'ลากตามรอยให้ครบ' : 'เขียนคำตอบของเราก่อน ✎'), node('p', 'fine', trace ? 'ค่อย ๆ ลากตามทุกตัว เริ่มจากจุดสีชมพู' : 'เขียนตัวเลข วาดรูป หรือเขียนวิธีคิดได้เลย แล้วค่อยยืนยันเลขที่ตั้งใจเขียน'));
  const canvas = node('canvas', 'writing-canvas answer-motor-canvas'); canvas.id = canvasId; canvas.tabIndex = 0; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', t(trace ? 'พื้นที่เขียนตามรอยเลข ' + target : 'พื้นที่เขียนคำตอบหรือวิธีคิด ไม่มีเฉลยให้ลอก'));
  const status = feedback(); const controls = node('div', 'writing-tools'); let control;
  const undo = button('ย้อนเส้น', '', () => control?.undo()); const clear = button('ล้างแล้วเขียนใหม่', '', () => control?.clear()); controls.append(undo, clear);
  const confirm = button(trace ? 'ลากครบแล้ว' : 'ยืนยันเลขที่เขียน →', 'button primary motor-confirm', () => confirmAnswerWriting(scope)); confirm.id = confirmId;
  surface.append(canvas, controls, status, confirm); panel.append(surface);
  function refresh() { const unlocked = inkCanSubmit(scope, ink); confirm.disabled = !inkCanConfirm(ink); confirm.hidden = !motorRequired || trace || unlocked; onGate(unlocked); }
  control = mountHandwritingCanvas(canvas, { activity: { kind: trace ? 'trace' : 'copy', target }, strokes: ink.strokes, connections: [], requireGesture: motorRequired, smooth: () => smoothLines, color: () => pencilColor, onChange: statusValue => {
    ink.writingReady = statusValue.ready;
    if (statusValue.change === 'stroke') { ink.inkRevision++; const stroke = ink.strokes[ink.strokes.length - 1]; if (stroke && !ink.freshStrokes.includes(stroke)) ink.freshStrokes.push(stroke); }
    ink.freshStrokes = ink.freshStrokes.filter(stroke => ink.strokes.includes(stroke));
    if (['draw', 'stroke', 'undo', 'clear'].includes(statusValue.change)) { ink.revision++; ink.confirmedRevision = -1; }
    if (!statusValue.ready) ink.confirmedRevision = -1;
    status.textContent = t(motorMessage(statusValue)); onInk(statusValue); refresh();
  } });
  activeAnswerMotor = { scope, ink, control, refresh };
  cleanupDrawing = () => { control.cleanup(); if (activeAnswerMotor?.control === control) activeAnswerMotor = null; };
  canvas.hasDrawing = () => control.hasDrawing(); canvas.undoDrawing = () => control.undo(); canvas.clearDrawing = () => control.clear(); canvas.redrawDrawing = () => control.redraw();
  ink.writingReady = control.isReady(); refresh(); return { control, refresh, canvas, surface };
}
function submitLearningAnswer(field, raw) {
  if (!progress || view !== 'learning' || fields[progress.step] !== field || progress.answers[field].correct) return { valid: false, correct: false };
  if (motorRequired && ['base', 'transfer'].includes(field) && !inkCanSubmit('guided-' + field, guidedInk[field])) return { valid: false, correct: false, reason: 'writing-required' };
  const result = recordAttempt(progress.answers[field], raw, expected[field], { hintLevel: progress.hints[field] || 0 });
  if (result.valid) { if (['base', 'transfer'].includes(field)) consumeInk(guidedInk[field]); progress.answers[field] = result.attempt; saveProgress(); }
  return result;
}
function requestHint(field) {
  if (!progress || fields[progress.step] !== field || !['base', 'transfer'].includes(field) || progress.answers[field].correct) return 0;
  progress.hints[field] = Math.min(3, progress.hints[field] + 1); saveProgress(); return progress.hints[field];
}
function moveLight(delta) { if (!progress || progress.step !== 'model') return null; progress.moved = makeTenMove(progress.moved, delta); saveProgress(); return progress.moved; }
function markWritingAttempt() { if (!progress || !['trace', 'write'].includes(progress.step)) return false; if (motorRequired && !(progress.step === 'trace' ? activeTraceMotor?.isReady() : activeAnswerMotor?.scope === 'guided-write' && activeAnswerMotor.control?.isReady())) return false; progress.writing.attempted = true; return true; }
function completeTrace() { if (!progress || view !== 'learning' || progress.step !== 'trace' || (motorRequired ? !activeTraceMotor?.isReady() : !progress.writing.attempted)) return false; progress.writing.attempted = true; progress.writing.traceDone = true; if (motorRequired) progress.writing.skipped = false; progress.step = 'write'; saveProgress(); renderLearning(); return true; }
function confirmWriting(raw) {
  if (!progress || view !== 'learning' || progress.step !== 'write' || (motorRequired && !inkCanSubmit('guided-write', guidedInk.write))) return false;
  const number = parseNumber(raw, { integerOnly: true });
  if (number === null || number > 99 || !progress.writing.attempted) return false;
  progress.writing.confirmed = number; if (motorRequired) progress.writing.skipped = false; progress.step = 'explain'; saveProgress(); renderLearning(); return true;
}
function skipWriting() {
  if (motorRequired || !progress || !['trace', 'write'].includes(progress.step)) return false;
  progress.writing.skipped = true; progress.step = progress.step === 'trace' ? 'write' : 'explain'; saveProgress(); renderLearning(); return true;
}
function advanceLearning() {
  if (!progress || view !== 'learning') return false;
  const previousStep = progress.step; repairMotorCheckpoint(); if (progress.step !== previousStep) { renderLearning(); return false; }
  const current = progress.step;
  if (current === 'story' && progress.answers.story.correct) progress.step = 'model';
  else if (current === 'model' && progress.moved === 2) progress.step = 'equation';
  else if (current === 'equation' && progress.answers.equation.correct) progress.step = 'answer';
  else if (current === 'answer' && progress.answers.base.correct) progress.step = 'trace';
  else if (current === 'explain' && progress.answers.explanation.correct) progress.step = 'transfer';
  else if (current === 'transfer' && progress.answers.transfer.correct) { progress.step = 'summary'; progress.completed = true; trackGameComplete('mission-make-ten'); }
  else return false;
  saveProgress(); renderLearning(); return true;
}
function learningHeader() {
  const index = steps.indexOf(progress.step); $('step-position').textContent = t('ช่วงที่ ' + (index + 1) + ' จาก 9 · โหมดฝึก ไม่มีเวลาบังคับ');
  $('step-title').textContent = t(titles[progress.step][0]); $('step-subtitle').textContent = t(titles[progress.step][1]);
  const track = $('mission-track'); track.replaceChildren(); steps.forEach((step, i) => { const dot = node('span', 'mission-dot' + (i < index ? ' done' : i === index ? ' current' : '')); dot.setAttribute('aria-hidden', 'true'); track.append(dot); });
}
function renderLearning() {
  if (!progress) return;
  if (cleanupDrawing) { cleanupDrawing(); cleanupDrawing = null; } activeTraceMotor = null; activeAnswerMotor = null; audio.stop(); learningHeader(); const panel = $('learning-panel'); panel.replaceChildren();
  if (progress.step === 'story') renderChoice(panel, 'story', MISSION.storyChoices, MISSION.story + ' ' + MISSION.question, 'เราต้องหาจำนวนอะไร?');
  else if (progress.step === 'model') renderModel(panel);
  else if (progress.step === 'equation') renderChoice(panel, 'equation', MISSION.equationChoices, 'มีแสงเดิม 8 ดวง และนำมาเพิ่มอีก 6 ดวง', 'สมการไหนเล่าเรื่องนี้?');
  else if (progress.step === 'answer') renderNumeric(panel, 'base', MISSION.question, 'ดวง');
  else if (progress.step === 'trace' || progress.step === 'write') renderWriting(panel);
  else if (progress.step === 'explain') renderExplanation(panel);
  else if (progress.step === 'transfer') { panel.append(node('p', 'story-text', MISSION.transfer.story)); renderNumeric(panel, 'transfer', MISSION.transfer.question, 'ลูก'); }
  else renderSummary(panel);
  focusHeading('step-title');
}
function renderExplanation(panel) {
  const comparison = node('div', 'explanation-comparison'); comparison.id = 'explanation-comparison';
  [['before', 'ก่อนย้าย', [8, 6]], ['after', 'หลังย้าย', [10, 4]]].forEach(([key, label, counts]) => {
    const card = node('figure', 'comparison-card'); card.id = 'comparison-' + key;
    card.setAttribute('role', 'img'); card.setAttribute('aria-label', t(label + ': กองแรก ' + counts[0] + ' ดวง กองที่สอง ' + counts[1] + ' ดวง รวม 14 ดวง'));
    card.append(node('figcaption', 'comparison-label', label));
    const groups = node('div', 'comparison-groups');
    counts.forEach((count, groupIndex) => {
      const group = node('div', 'comparison-group'); const grid = node('div', 'comparison-frame'); grid.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 10; i++) { const moved = key === 'before' ? groupIndex === 1 && i < 2 : groupIndex === 0 && i >= 8; const light = node('span', 'light-cell' + (i < count ? ' filled' : '') + (moved && i < count ? ' moved-light' : '')); grid.append(light); }
      group.append(node('strong', 'comparison-count', count + ' ดวง'), grid); groups.append(group);
    });
    const total = node('p', 'comparison-total', 'รวม 14 ดวง'); total.id = key + '-total'; card.append(groups, total); comparison.append(card);
  });
  panel.append(comparison, node('p', 'comparison-note', 'แสงขอบสีชมพู 2 ดวงคือแสงที่ย้ายไปอีกกอง'));
  renderChoice(panel, 'explanation', MISSION.explanationChoices, '', 'เราแค่ย้ายแสง 2 ดวงไปอีกกอง แสงรวมทั้งสองกองเป็นอย่างไร?');
}
function renderChoice(panel, field, choices, story, question) {
  if (story) panel.append(node('p', 'story-text', story));
  panel.append(node('p', 'question', question), audioControls((story ? story + ' ' : '') + question));
  const list = node('div', 'choices'); list.setAttribute('role', 'group'); list.setAttribute('aria-label', t(question));
  let selected = guidedChoices[field] ?? progress.answers[field].answer; const status = feedback(); const submit = button('ตรวจคำตอบ', 'button primary', submitChoice); const next = button('ไปต่อ →', 'button primary', advanceLearning);
  const choiceButtons = choices.map((choice, index) => { const item = button('', 'choice-button', () => { if (progress.answers[field].correct) return; selected = choice.id; guidedChoices[field] = selected; update(); }); item.append(node('span', 'choice-number', String(index + 1)), node('span', '', choice.label)); item.dataset.choice = String(choice.id); list.append(item); return item; });
  function update() { choiceButtons.forEach(item => { item.setAttribute('aria-pressed', String(Number(item.dataset.choice) === selected)); item.disabled = progress.answers[field].correct; }); submit.hidden = progress.answers[field].correct; next.hidden = !progress.answers[field].correct; }
  function submitChoice() {
    if (selected === null) { status.textContent = t('เลือกหนึ่งคำตอบก่อนนะ'); return; }
    const result = submitLearningAnswer(field, selected); if (!result.valid) return;
    status.className = 'feedback ' + (result.correct ? 'success' : 'error');
    status.textContent = t(result.correct ? (field === 'explanation' ? 'ใช่เลย! แสงทั้งหมดเท่าเดิม เราแค่ย้าย 2 ดวงไปอีกกอง' : 'ใช่เลย! ไปลองขั้นต่อไปกัน') : field === 'story' ? 'สิ่งที่เพิ่มมาคือข้อมูลที่รู้แล้ว ลองดูว่าเรื่องถามจำนวนอะไร' : field === 'equation' ? 'เรื่องนี้นำแสงมาเพิ่ม ลองเลือกสมการที่แสดงการรวม' : 'ลองนับทั้งสองกอง: ก่อนย้าย 14 ดวง หลังย้าย 14 ดวง มีแสงเพิ่มหรือหายไปไหม?');
    update(); if (result.correct) next.focus();
  }
  if (progress.answers[field].correct) status.textContent = t('บันทึกคำตอบช่วงนี้แล้ว ไปต่อได้เลย');
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
  function update() { const m = progress.moved; grid(leftGrid, 8 + m); grid(rightGrid, 6 - m); leftTitle.textContent = t('กรอบแรก: ' + (8 + m) + ' ดวง'); rightTitle.textContent = t('กองที่เพิ่ม: ' + (6 - m) + ' ดวง'); left.setAttribute('aria-label', t('กรอบแรกมี ' + (8 + m) + ' ดวง แตะย้ายคืนหนึ่งดวง')); right.setAttribute('aria-label', t('กองที่เพิ่มเหลือ ' + (6 - m) + ' ดวง แตะเติมหนึ่งดวง')); minus.disabled = left.disabled = m === 0; plus.disabled = right.disabled = m === 2; next.disabled = m !== 2; message.textContent = t(m === 2 ? 'ได้ 10 กับอีก 4! แสงทั้งหมดไม่ได้เปลี่ยน' : 'กรอบแรกขาดอีก ' + (2 - m) + ' ดวงจะครบสิบ'); }
  function change(delta) { moveLight(delta); update(); }
  panel.append(controls, message, audioControls('ย้ายแสงจากกองที่เพิ่มไปเติมกรอบแรกให้ครบสิบ แสงที่ย้ายไม่ได้หายไป'), next); update();
}
function keypad(input, { fractions = false } = {}) {
  const pad = node('div', 'keypad'); pad.setAttribute('role', 'group'); pad.setAttribute('aria-label', t('แป้นตัวเลข'));
  ['1','2','3','4','5','6','7','8','9', ...(fractions ? ['/', '0', '.'] : ['0']), 'ลบ','ล้าง'].forEach(value => pad.append(button(value, '', () => { if (input.disabled) return; input.value = value === 'ลบ' ? input.value.slice(0, -1) : value === 'ล้าง' ? '' : (input.value + value).slice(0, input.maxLength || 8); input.removeAttribute('aria-invalid'); input.focus(); }))); return pad;
}
function numberForm(label, unit, identity, { fractions = false } = {}) {
  const form = node('form', 'answer-form'); form.noValidate = true; const input = node('input', 'numeric-input'); input.id = identity; input.type = 'text'; input.inputMode = fractions ? 'text' : 'numeric'; input.autocomplete = 'off'; input.maxLength = fractions ? 24 : 8; input.setAttribute('aria-label', t(label));
  const caption = node('label', '', label); caption.htmlFor = identity; const row = node('div', 'input-row'); row.append(input, node('span', 'input-unit', unit)); const submit = button('ส่งคำตอบ', 'button primary'); submit.type = 'submit';
  form.append(caption, row, keypad(input, { fractions }), submit); return { form, input, submit };
}
function renderNumeric(panel, field, question, unit) {
  panel.append(node('p', 'question', question), audioControls((field === 'transfer' ? MISSION.transfer.story + ' ' : '') + question));
  const ink = guidedInk[field]; const { form, input, submit } = numberForm(motorRequired ? 'เลขที่ฉันตั้งใจเขียน' : 'คำตอบของเรา', unit, 'learning-answer');
  form.className += ' numeric-confirmation'; const status = feedback(); const next = button('ไปต่อ →', 'button primary', advanceLearning);
  const hint = button('ขอคำใบ้', 'button hint-button compact', () => { requestHint(field); updateHints(); }); const hints = node('div', 'hint-box');
  function updateGate(unlocked) { const correct = progress.answers[field].correct; form.hidden = motorRequired && !unlocked && !correct; input.disabled = submit.disabled = correct || (motorRequired && !unlocked); }
  if (!progress.answers[field].correct) mountAnswerSurface(panel, ink, { scope: 'guided-' + field, canvasId: 'guided-answer-canvas', confirmId: 'guided-writing-confirm', onGate: updateGate });
  function updateHints() { const level = progress.hints[field]; hints.hidden = level === 0; hints.replaceChildren(); const list = node('ol'); MISSION.hints[field].slice(0, level).forEach(text => list.append(node('li', '', text))); hints.append(node('strong', 'tiny-label', 'คำใบ้ที่เปิดแล้ว'), list); hint.textContent = t(level < 3 ? 'ขอคำใบ้ (' + level + '/3)' : 'เปิดคำใบ้ครบแล้ว'); hint.disabled = level === 3 || progress.answers[field].correct; }
  function update() { const correct = progress.answers[field].correct; next.hidden = !correct; hint.hidden = correct; if (correct) input.value = String(progress.answers[field].answer); updateGate(inkCanSubmit('guided-' + field, ink)); updateHints(); }
  form.addEventListener('submit', event => { event.preventDefault(); const result = submitLearningAnswer(field, input.value); if (!result.valid) { if (!progress.answers[field].correct) { status.textContent = t(result.reason === 'writing-required' ? 'เขียนคำตอบ แล้วกดยืนยันเลขที่เขียนก่อนนะ' : 'พิมพ์จำนวนเต็ม เช่น 12 หรือ ๑๒ ช่องว่างหรือข้อความยังไม่นับเป็นคำตอบ'); if (!result.reason) { input.setAttribute('aria-invalid', 'true'); input.focus(); } } return; } input.removeAttribute('aria-invalid'); if (motorRequired && !result.correct) input.value = ''; status.className = 'feedback ' + (result.correct ? 'success' : 'error'); status.textContent = t(result.correct ? (field === 'base' ? 'ถูกแล้ว 14 ดวง! เรามีสิบกับอีกสี่' : 'ใช่เลย 15 ลูก! เราใช้วิธีคิดกับเรื่องใหม่ได้') : motorRequired ? 'ยังไม่ตรง ลองแก้รอยเขียนหรือเขียนใหม่ แล้วค่อยยืนยันอีกครั้ง' : 'ยังไม่ตรง ลองตรวจปริมาณอีกครั้ง หรือเปิดคำใบ้ได้'); activeAnswerMotor?.refresh(); update(); if (result.correct) next.focus(); });
  if (progress.answers[field].correct) status.textContent = t('เก็บคำตอบของช่วงนี้แล้ว ไปต่อได้');
  const actions = node('div', 'lesson-actions'); actions.append(hint, next); panel.append(form, status, actions, hints, node('p', 'fine', motorRequired ? 'แป้นตัวเลขใช้ยืนยันเลขที่เขียน การเขียนเป็นขั้นหลักของข้อนี้' : 'พิมพ์เลขไทยหรืออารบิกได้ ใช้คำใบ้ช่วยคิดแล้วลองอีกครั้งได้เลย')); update();
}
function renderWriting(panel) {
  const trace = progress.step === 'trace', ink = trace ? guidedInk.trace : guidedInk.write;
  const status = feedback();
  if (trace) {
    const canvas = node('canvas', 'writing-canvas answer-motor-canvas'); canvas.id = 'writing-canvas'; canvas.tabIndex = 0; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', t('พื้นที่ลากตามรอยเลข 14'));
    const next = button('ลากครบแล้ว ไปต่อ →', 'button primary', completeTrace); const controls = node('div', 'writing-tools'); let control;
    controls.append(button('ย้อนเส้น', '', () => control?.undo()), button('ล้างแล้วเขียนใหม่', '', () => control?.clear())); panel.append(canvas, controls, status);
    const actions = node('div', 'lesson-actions'); actions.append(next); if (!motorRequired) actions.append(button('ข้ามตามรอย', 'button outline', skipWriting)); panel.append(actions);
    control = mountHandwritingCanvas(canvas, { activity: { kind: 'trace', target: '14' }, strokes: ink.strokes, requireGesture: motorRequired, smooth: () => smoothLines, color: () => pencilColor, onChange: value => { ink.writingReady = value.ready; if (value.hasDrawing) progress.writing.attempted = true; status.textContent = t(motorMessage(value)); next.disabled = !value.ready; } });
    activeTraceMotor = control; cleanupDrawing = () => { control.cleanup(); if (activeTraceMotor === control) activeTraceMotor = null; };
    canvas.hasDrawing = () => control.hasDrawing(); canvas.undoDrawing = () => control.undo(); canvas.clearDrawing = () => control.clear();
    next.disabled = !control.isReady();
  } else {
    const { form, input, submit } = numberForm('ฉันตั้งใจเขียนจำนวน', '', 'writing-confirm'); submit.textContent = t('บันทึกเลขที่เขียนและไปต่อ →'); form.className += ' numeric-confirmation';
    function gate(unlocked) { form.hidden = motorRequired && !unlocked; input.disabled = submit.disabled = motorRequired && !unlocked; }
    const surface = mountAnswerSurface(panel, ink, { scope: 'guided-write', canvasId: 'writing-canvas', confirmId: 'guided-freewrite-confirm', onGate: gate, onInk: value => { if (value.hasDrawing) progress.writing.attempted = true; } });
    form.addEventListener('submit', event => { event.preventDefault(); if (!confirmWriting(input.value)) { status.textContent = t(motorRequired && !inkCanSubmit('guided-write', ink) ? 'เขียนให้พร้อม แล้วกดยืนยันเลขที่เขียนก่อนนะ' : 'ระบุเลขที่ตั้งใจเขียนตั้งแต่ 0–99 เช่น 14'); input.setAttribute('aria-invalid', 'true'); } });
    panel.append(form, status); if (!motorRequired) panel.append(button('ข้ามการเขียนและไปต่อ', 'button outline', skipWriting)); gate(inkCanSubmit('guided-write', ink));
  }
  panel.append(node('p', 'fine', motorRequired ? 'เขียน/ลากเส้นก่อนแล้วจึงไปต่อ รอยเขียนไม่บันทึกถาวร' : 'ใช้วิธีช่วยหรือข้ามได้ รอยเขียนไม่บันทึกถาวร'));
}
function attemptLabel(attempt) { return attempt.validCount === 0 ? 'ยังไม่ได้ประเมิน' : attempt.independent ? 'ถูกครั้งแรก ไม่ใช้คำใบ้' : attempt.correct ? 'ทำได้หลังลอง / มีตัวช่วย' : 'แนะนำฝึกต่อ'; }
function summaryList() { const list = node('ul', 'summary-list'); [['เข้าใจสิ่งที่โจทย์ถาม', 'story'], ['เลือกสมการ', 'equation'], ['คำนวณจากเรื่องในสวน', 'base'], ['อธิบายภาพ', 'explanation'], ['ลองเรื่องลูกแก้ว', 'transfer']].forEach(([label, key]) => { const li = node('li'); li.append(node('span', '', label), node('strong', '', attemptLabel(progress.answers[key]))); list.append(li); }); return list; }
function renderSummary(panel) {
  const hero = node('div', 'summary-hero'); hero.append(node('span', 'summary-star', '✦'), node('h2', '', 'เราเติมแสงให้สวนแล้ว!'), node('p', '', 'จาก 8 + 6 เป็น 10 + 4 แล้วนำวิธีคิดไปลองกับ 9 + 6 ได้อีกเรื่อง')); panel.append(hero, summaryList());
  panel.append(node('p', 'fine', 'ลองอธิบายวิธีคิดให้ผู้ใหญ่ฟัง แล้วกลับมาทบทวนวันอื่นได้'));
  const actions = node('div', 'lesson-actions'); actions.append(button('พักที่หน้าเริ่ม', 'button primary', goHome), button('ให้ผู้ปกครองดูผล', 'button pale', openParentGate)); panel.append(actions);
}

function elapsed() { return challenge?.active ? Math.max(0, Date.now() - challenge.startedAt) : challenge?.elapsedMs || 0; }
function updateChallengeStats() {
  if (!challenge) return;
  $('challenge-accuracy').textContent = t(challenge.answered ? challenge.correct + '/' + challenge.answered + ' (' + Math.round(100 * challenge.correct / challenge.answered) + '%)' : '—');
  $('challenge-progress').textContent = t(challenge.answered + '/5');
  $('challenge-time').textContent = t(challenge.mode === 'challenge' ? formatTime(elapsed()) : 'ไม่จับเวลา');
}
function startRound(mode, grade = selectedGrade, topic = null) {
  const number = Number.isInteger(grade) ? grade : selectedGrade;
  const profile = GRADE_PROFILES.find(item => item.grade === number);
  if (!profile || !['practice', 'challenge'].includes(mode) || (topic !== null && !profile.topics.includes(topic))) return false;
  if (mode === 'challenge') topic = null;
  if (number !== selectedGrade) selectedPracticeTopic = null;
  if (progress && view === 'learning') saveProgress(); cancelChallenge(); selectedGrade = number; notice(store.writeGrade(number));
  const recent = store.readRecent(number);
  const deck = createQuestionRound(number, { excludeIds: recent.data, topic, language: getLanguage() });
  if (mode === 'challenge' && motorRequired) deck.deckVersion = WRITING_PROFILE_VERSION;
  const history = store.writeRecent(number, deck.questions.map(question => question.signature)); notice(history);
  challenge = { mode, motorRequired, grade: number, deck, questions: deck.questions, active: true, index: 0, answered: 0, correct: 0, locked: false, startedAt: Date.now(), elapsedMs: 0, feedback: '', saved: false, attempts: deck.questions.map(() => newAttempt()), hintLevels: [0,0,0,0,0], draft: '', scratchStrokes: deck.questions.map(() => []), scratchOpen: [true,true,true,true,true], justEarned: false, encouragement: 'ค่อย ๆ คิดทีละก้าว เราไปด้วยกัน!' };
  challenge.answerInk = deck.questions.map(() => newAnswerInk()); challenge.scratchStrokes = challenge.answerInk.map(ink => ink.strokes);
  showView('challenge'); renderChallenge(); renderRanking();
  if (mode === 'challenge') timer = setInterval(updateChallengeStats, 250);
  focusHeading('challenge-heading'); trackGameStart(mode); return true;
}
function startChallenge(grade = selectedGrade) { return startRound('challenge', grade); }
function startPractice(grade = selectedGrade, topic = grade === selectedGrade ? selectedPracticeTopic : null) { return startRound('practice', grade, topic); }
function requestPracticeHint(draft) {
  if (!challenge?.active || challenge.mode !== 'practice' || challenge.locked) return false;
  if (typeof draft === 'string') challenge.draft = draft;
  challenge.hintLevels[challenge.index] = 1; renderChallenge(); return true;
}
function finishRound() {
  if (!challenge?.active || challenge.answered !== 5) return false;
  challenge.elapsedMs = challenge.mode === 'challenge' ? elapsed() : 0; challenge.active = false; stopTimer();
  if (challenge.mode === 'challenge') {
    const deck = challenge.deck;
    const score = { deckId: deck.deckId, deckVersion: deck.deckVersion, grade: challenge.grade, total: 5, correct: challenge.correct, elapsedMs: challenge.elapsedMs, completedAt: Date.now() };
    const saved = store.writeScore(score); challenge.saved = true; $('score-storage-status').textContent = t(saved.message); renderRanking(saved.data);
  }
  renderChallenge(); trackGameComplete(challenge.mode); return true;
}
function roundStars() { return challenge ? challenge.attempts.filter(attempt => challenge.mode === 'practice' ? attempt.correct : attempt.firstCorrect === true).length : 0; }
function renderAdventure() {
  if (!challenge) return;
  $('round-stars-count').textContent = t(roundStars() + ' / 5');
  $('round-stars-label').textContent = t(challenge.mode === 'practice' ? 'ดาวที่คิดสำเร็จ' : 'ดาวคำตอบแรก');
  $('round-reward-rule').textContent = t(challenge.mode === 'practice' ? 'คิดสำเร็จได้ดาว ลองใหม่หรือใช้คำใบ้ก็ได้ · เดินครบ 5 จุดรับตราจบรอบ' : 'ได้ดาวเมื่อตอบถูกครั้งแรก · เดินครบ 5 จุดรับตราจบรอบ');
  $('round-encouragement').textContent = t(challenge.active ? challenge.encouragement : 'เดินทางครบห้าจุดแล้ว! เก่งมากที่ไม่หยุดลอง');
  const path = $('round-path'); path.replaceChildren();
  challenge.questions.forEach((question, index) => {
    const attempt = challenge.attempts[index], correct = challenge.mode === 'practice' ? attempt.correct : attempt.firstCorrect === true;
    const item = node('li', 'path-stop' + (correct ? ' correct' : attempt.validCount ? ' tried' : '') + (challenge.active && index === challenge.index ? ' current' : '') + (challenge.justEarned && index === challenge.index ? ' earned' : ''));
    if (challenge.active && index === challenge.index) item.setAttribute('aria-current', 'step');
    const symbol = node('span', 'path-symbol', correct ? '✦' : attempt.validCount ? '✓' : String(index + 1));
    const text = node('small', '', correct ? 'ได้ดาว' : attempt.validCount ? 'ลองแล้ว' : 'จุดที่ ' + (index + 1));
    symbol.setAttribute('aria-hidden', 'true'); item.setAttribute('aria-label', t('ข้อ ' + (index + 1) + ': ' + (correct ? (challenge.mode === 'practice' ? 'คิดสำเร็จ ได้ดาว' : 'ตอบถูกครั้งแรก ได้ดาว') : attempt.validCount ? 'ได้ลองตอบแล้ว' : 'ยังไม่ได้ตอบ'))); item.append(symbol, text); path.append(item);
  });
}
function completionBadge() {
  const badge = node('div', 'completion-badge'); badge.append(node('span', 'completion-spark spark-a', '✦'), node('span', 'completion-spark spark-b', '✧'), node('span', 'completion-spark spark-c', '✦'), node('span', 'medal', '✓'), node('strong', '', 'นักผจญภัยครบ 5 จุด'), node('small', '', (challenge.mode === 'practice' ? 'ดาวที่คิดสำเร็จ ' : 'ดาวคำตอบแรก ') + roundStars() + '/5'));
  return badge;
}
function submitChallengeAnswer(raw) {
  if (!challenge?.active || view !== 'challenge' || challenge.locked) return { valid: false, correct: false };
  if (motorRequired && !inkCanSubmit('practice-' + challenge.index, challenge.answerInk[challenge.index])) return { valid: false, correct: false, reason: 'writing-required' };
  const index = challenge.index, question = challenge.questions[index], previous = challenge.attempts[index];
  const result = recordAttempt(previous, raw, question.answer, { hintLevel: challenge.hintLevels[index], integerOnly: question.integerOnly });
  if (!result.valid) return result;
  consumeInk(challenge.answerInk[index]);
  challenge.attempts[index] = result.attempt; challenge.draft = motorRequired && !result.correct ? '' : String(raw); challenge.justEarned = challenge.mode === 'practice' ? result.correct && !previous.correct : previous.validCount === 0 && result.correct;
  challenge.encouragement = result.correct ? (challenge.justEarned ? 'เยี่ยมเลย! ได้ดาวอีกดวง ✦' : 'เจอแล้ว! การลองใหม่ช่วยให้เราเข้าใจ') : challenge.mode === 'practice' ? 'ไม่เป็นไรนะ ลองคิดใหม่หรือให้พ่อมดช่วยใบ้ได้' : 'ขอบคุณที่ลอง! ดูวิธีคิด แล้วไปจุดถัดไปกัน';
  if (result.correct && audio.isEnabled() && audio.isAvailable()) audio.speak(t(challenge.justEarned ? 'เยี่ยมเลย ได้ดาวอีกดวง' : 'ทำได้แล้ว เก่งมาก'));
  if (previous.validCount === 0) { challenge.answered++; if (result.correct) challenge.correct++; }
  challenge.locked = challenge.mode === 'challenge' || result.correct;
  challenge.feedback = result.correct ? 'ถูกต้อง! ' + question.hint : challenge.mode === 'challenge' ? 'คำตอบคือ ' + question.answer + ' — ' + question.hint : (motorRequired ? 'ยังไม่ตรง ลองแก้รอยเขียนหรือเขียนใหม่ แล้วค่อยยืนยันอีกครั้ง' : 'ยังไม่ตรง ลองตรวจอีกครั้ง ขอคำใบ้ หรือไปข้อถัดไปได้');
  if (challenge.mode === 'challenge' && challenge.answered === 5) finishRound(); else renderChallenge();
  return result;
}
function nextChallengeQuestion() {
  if (!challenge?.active || (!challenge.locked && !(challenge.mode === 'practice' && challenge.attempts[challenge.index].validCount > 0))) return false;
  if (challenge.index === 4) return finishRound();
  challenge.index++; challenge.locked = false; challenge.feedback = ''; challenge.draft = ''; challenge.justEarned = false; challenge.encouragement = 'จุดต่อไปพร้อมแล้ว ค่อย ๆ คิดตามจังหวะของเรา'; renderChallenge(); return true;
}
function renderScratchpad(panel, onGate = () => {}) {
  const round = challenge, index = round.index, ink = round.answerInk[index];
  if (motorRequired) { mountAnswerSurface(panel, ink, { scope: 'practice-' + index, canvasId: 'practice-answer-canvas', confirmId: 'practice-writing-confirm', onGate }); return; }
  const details = node('details', 'scratchpad'); details.id = 'practice-scratchpad'; details.open = round.scratchOpen[index];
  const summary = node('summary', '', '✎ สมุดคิดของฉัน'); const content = node('div', 'scratchpad-body'); details.append(summary, content); panel.append(details);
  const surface = mountAnswerSurface(content, ink, { scope: 'practice-' + index, canvasId: 'practice-scratchpad-canvas', confirmId: 'practice-writing-confirm', onGate });
  details.addEventListener('toggle', () => { if (challenge !== round) return; round.scratchOpen[index] = details.open; if (details.open) surface.control.redraw(); });
}
function renderQuestionChart(panel, visual) {
  const figure = node('figure', 'question-chart');
  figure.append(node('figcaption', '', visual.type === 'pie' ? 'แผนภูมิรูปวงกลม' : 'กราฟเส้น'));
  const svgNode = (tag, attributes = {}, text = '') => { const element = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value); if (text) element.textContent = t(text); return element; };
  const svg = svgNode('svg', { viewBox: '0 0 540 300', role: 'img', 'aria-label': visual.labels.map((label, index) => label + ' ' + visual.values[index] + ' ' + visual.unit).join(', ') });
  const colors = ['#245f44', '#a63d70', '#a06a12', '#347ba4', '#7256a3'];
  if (visual.type === 'pie') {
    let start = -Math.PI / 2;
    visual.values.forEach((value, index) => {
      const end = start + value / 100 * Math.PI * 2;
      const x = angle => 270 + Math.cos(angle) * 116, y = angle => 145 + Math.sin(angle) * 116;
      svg.append(svgNode('path', { d: `M 270 145 L ${x(start)} ${y(start)} A 116 116 0 ${value > 50 ? 1 : 0} 1 ${x(end)} ${y(end)} Z`, fill: colors[index % colors.length], stroke: '#fffdf6', 'stroke-width': 3 }));
      const middle = (start + end) / 2;
      svg.append(svgNode('text', { x: 270 + Math.cos(middle) * 77, y: 151 + Math.sin(middle) * 77, fill: 'white', 'text-anchor': 'middle', 'font-size': 20 }, value + '%'));
      start = end;
    });
  } else {
    const maximum = Math.max(...visual.values, 1), top = Math.ceil(maximum / 10) * 10;
    const x = index => 65 + index * 430 / Math.max(1, visual.values.length - 1), y = value => 240 - value / top * 190;
    for (let tick = 0; tick <= 4; tick++) {
      const value = top * tick / 4;
      svg.append(svgNode('line', { x1: 65, y1: y(value), x2: 495, y2: y(value), stroke: '#d7e2ca' }), svgNode('text', { x: 53, y: y(value) + 5, 'text-anchor': 'end', fill: '#435340', 'font-size': 14 }, String(value)));
    }
    svg.append(svgNode('text', { x: 65, y: 26, fill: '#435340', 'font-size': 14 }, visual.unit), svgNode('polyline', { points: visual.values.map((value, index) => x(index) + ',' + y(value)).join(' '), fill: 'none', stroke: colors[0], 'stroke-width': 3 }));
    visual.values.forEach((value, index) => svg.append(svgNode('circle', { cx: x(index), cy: y(value), r: 5, fill: colors[0] }), svgNode('text', { x: x(index), y: y(value) - 12, 'text-anchor': 'middle', fill: colors[0], 'font-size': 16 }, String(value)), svgNode('text', { x: x(index), y: 269, 'text-anchor': 'middle', fill: '#435340', 'font-size': 13 }, visual.labels[index])));
  }
  const legend = node('ul', 'chart-legend');
  if (visual.type === 'pie') visual.labels.forEach((label, index) => { const item = node('li'); const swatch = node('span', 'chart-swatch'); swatch.style.backgroundColor = colors[index % colors.length]; swatch.setAttribute('aria-hidden', 'true'); item.append(swatch, node('span', '', label + ' ' + visual.values[index] + '%')); legend.append(item); });
  figure.append(svg, legend); panel.append(figure);
}
function renderChallenge() {
  if (!challenge) return;
  if (cleanupDrawing) { cleanupDrawing(); cleanupDrawing = null; }
  const practice = challenge.mode === 'practice';
  $('round-scope').textContent = t('ป.' + challenge.grade + ' · ' + (challenge.deck.topic ? translateTopic(challenge.deck.topic, getLanguage()) : 'โจทย์คละทุกหัวข้อ'));
  $('challenge-heading').textContent = t(practice ? (motorRequired ? 'เขียนก่อน แล้วค่อยยืนยันคำตอบ' : 'ลองคิดตามจังหวะของเรา') : motorRequired ? 'ท้าทายเขียนคำตอบ' : 'ท้าทายพิมพ์คำตอบ');
  $('round-rules').textContent = t(practice ? (motorRequired ? 'เขียนคำตอบก่อน · ไม่จับเวลา · ขอคำใบ้และลองใหม่ได้' : 'โหมดช่วย · เขียนหรือใช้แป้นตัวเลขได้ · ไม่จับเวลา') : motorRequired ? 'เวลาเดินขึ้นรวมการเขียน · เขียนก่อนยืนยัน · รับคำตอบครั้งเดียวต่อข้อ' : 'โหมดช่วยพิมพ์คำตอบ · เวลาเดินขึ้น ไม่มีหมดเวลา · รับคำตอบครั้งเดียวต่อข้อ');
  $('round-time-stat').hidden = practice; $('round-ranking').hidden = practice;
  $('round-layout').className = 'challenge-layout' + (practice ? ' practice-layout' : '');
  $('round-accuracy-label').textContent = t('ถูกครั้งแรก'); updateChallengeStats(); renderAdventure();
  const panel = $('challenge-panel'); panel.replaceChildren();
  if (!challenge.active) {
    const heading = node('h2', 'challenge-question', practice ? 'ฝึกครบ 5 ข้อแล้ว!' : 'จบรอบท้าทาย!'); heading.tabIndex = -1;
    const independent = challenge.attempts.filter(attempt => attempt.independent).length; panel.append(completionBadge());
    panel.append(node('span', 'tiny-label', 'ป.' + challenge.grade + ' · ' + (practice ? 'สรุปการฝึก' : 'สรุปท้าทาย')), heading, node('p', '', 'ถูกครั้งแรก ' + challenge.correct + '/5 · ' + (challenge.correct * 20) + '%'));
    if (practice) panel.append(node('p', '', 'ทำเองถูกครั้งแรกโดยไม่ใบ้ ' + independent + '/5'), node('p', 'fine', 'คำตอบครั้งแรกเก็บแยกจากการแก้ได้หลังลองใหม่ โหมดฝึกไม่บันทึกอันดับ'));
    else panel.append(node('p', '', 'เวลารวม ' + formatTime(challenge.elapsedMs)));
    panel.append(node('p', 'feedback', challenge.feedback));
    const actions = node('div', 'lesson-actions'); actions.append(button('สุ่มชุดใหม่ ป.' + challenge.grade, 'button primary', () => startRound(challenge.mode, challenge.grade, challenge.deck.topic || null)), button('กลับไปเลือกชั้น', 'button outline', goHome));
    panel.append(actions, node('p', 'fine', 'ขอบคุณที่ลองคิดจนครบ! ชุดใหม่มีตัวเลขและสถานการณ์เปลี่ยนไป พักก่อนก็ได้')); heading.focus(); return;
  }
  const question = challenge.questions[challenge.index], heading = node('h2', 'challenge-question', question.prompt); heading.tabIndex = -1;
  panel.append(node('span', 'tiny-label', 'ข้อ ' + (challenge.index + 1) + ' / 5 · ' + translateTopic(question.topic, getLanguage())), heading, audioControls(question.prompt));
  if (question.visual) renderQuestionChart(panel, question.visual);
  const { form, input, submit } = numberForm(motorRequired ? 'เลขที่ฉันตั้งใจเขียน' : 'คำตอบ', '', 'challenge-answer', { fractions: !question.integerOnly });
  form.className += motorRequired || practice ? ' numeric-confirmation' : '';
  const gate = unlocked => { form.hidden = motorRequired && !unlocked && !challenge.locked; input.disabled = submit.disabled = challenge.locked || (motorRequired && !unlocked); };
  if (practice || motorRequired) renderScratchpad(panel, gate); const status = feedback(); status.textContent = t(challenge.feedback); if (challenge.locked && challenge.attempts[challenge.index].correct) status.className = 'feedback success success-bloom';
  input.value = challenge.draft; gate(inkCanSubmit('practice-' + challenge.index, challenge.answerInk[challenge.index]));
  form.addEventListener('submit', event => { event.preventDefault(); const result = submitChallengeAnswer(input.value); if (!result.valid && challenge?.active && !challenge.locked) { status.textContent = t(result.reason === 'writing-required' ? 'เขียนคำตอบ แล้วกดยืนยันเลขที่เขียนก่อนนะ' : question.integerOnly ? 'พิมพ์จำนวนเต็มก่อน ยังไม่นับเป็นคำตอบ' : 'พิมพ์จำนวนหรือเศษส่วน เช่น 3/4 ตัวส่วนต้องไม่เป็นศูนย์ ยังไม่นับเป็นคำตอบ'); if (!result.reason) { input.setAttribute('aria-invalid', 'true'); input.focus(); } } });
  panel.append(form, status);
  if (!question.integerOnly) panel.append(node('p', 'fine', 'ตอบทศนิยมด้วยจุด เช่น 0.75 หรือเศษส่วนด้วย / เช่น 3/4 · จำนวนคละให้เปลี่ยนเป็นเศษเกิน เช่น 1 กับ 1/2 ตอบ 3/2'));
  if (practice) {
    const hint = button(challenge.hintLevels[challenge.index] ? 'เปิดคำใบ้แล้ว' : 'ขอคำใบ้', 'button hint-button compact', () => requestPracticeHint(input.value)); hint.disabled = challenge.locked || challenge.hintLevels[challenge.index] > 0; panel.append(hint);
    if (challenge.hintLevels[challenge.index]) panel.append(node('p', 'hint-box', question.hint));
  }
  if (challenge.locked || (practice && challenge.attempts[challenge.index].validCount > 0)) { const next = button(challenge.index === 4 ? 'ดูผลรอบนี้ →' : 'ข้อต่อไป →', 'button primary', nextChallengeQuestion); const actions = node('div', 'lesson-actions'); actions.append(next); panel.append(actions); if (challenge.locked) next.focus(); else input.focus(); } else heading.focus();
}
function renderRanking(rows) {
  const result = rows ? { data: rows } : store.readScores(); if (result.message) $('score-storage-status').textContent = t(result.message);
  const grade = challenge?.grade || selectedGrade, deckId = challenge?.deck.deckId || 'g' + grade + '-random', deckVersion = challenge?.deck.deckVersion || QUESTION_PROFILE_VERSION;
  $('ranking-scope').textContent = t('ป.' + grade + ' · ท้าทาย' + (deckVersion === WRITING_PROFILE_VERSION ? 'เขียนคำตอบ' : 'พิมพ์คำตอบ') + 'ของชั้นนี้');
  const ranking = rankScores(result.data, { grade, deckId, deckVersion }).slice(0, 10); const list = $('ranking-list'); list.replaceChildren();
  if (!ranking.length) list.append(node('li', '', 'ยังไม่มีรอบท้าทายที่ทำครบของชั้นนี้'));
  ranking.forEach(row => { const li = node('li'); li.append(node('strong', '', 'อันดับ ' + row.rank + ' · พ่อมดฝึกหัด'), node('div', '', row.correct + '/5 · ' + (row.correct * 20) + '% · ' + (row.elapsedMs / 1000).toFixed(3) + ' วินาที')); list.append(li); });
}
const writingModes = { mixed: 'สวนสนุกฝึกมือ', mixedLong: 'ชุดใหญ่ฝึกมือ', trace: 'เขียนตามรอย', copy: 'เขียนเลขเอง', path: 'ลากเส้นตามทาง', connect: 'ลากเส้นจับคู่', coins: 'เติมเหรียญให้ครบ' };
function startHandwriting(mode = 'mixed', grade = selectedGrade) {
  const number = Number(grade); if (!Object.hasOwn(writingModes, mode) || !GRADE_PROFILES.some(profile => profile.grade === number)) return false;
  if (progress && view === 'learning') saveProgress(); cancelChallenge(); selectedGrade = number; notice(store.writeGrade(number));
  const generated = createHandwritingRound(number, { extended: mode !== 'mixed', language: getLanguage() }); let activities;
  if (mode === 'mixed' || mode === 'mixedLong') {
    const queues = Object.fromEntries(['trace', 'copy', 'path', 'connect', 'coins'].map(kind => [kind, generated.activities.filter(activity => activity.kind === kind)]));
    activities = []; const cycle = ['trace', 'copy', 'path', 'connect', 'coins'];
    while (cycle.some(kind => queues[kind].length > 0)) cycle.forEach(kind => { const activity = queues[kind].shift(); if (activity) activities.push(activity); });
  } else activities = generated.activities.filter(activity => activity.kind === mode);
  handwriting = { source: 'numbers', mode, grade: number, title: writingModes[mode], activities, index: 0, completed: false, completions: activities.map(() => false), skips: activities.map(() => false), strokes: activities.map(() => []), connections: activities.map(() => []), coinCounts: activities.map(activity => activity.kind === 'coins' ? activity.startCount : 0), selectedLeft: null, feedback: '' };
  showView('handwriting'); renderHandwriting(); trackGameStart('workshop-' + mode); return true;
}
const geometryModes = { geometryMixed: 'สนุกกับรูปเรขาคณิต', geometryTrace: 'ลากตามรอยรูป', geometryCopy: 'ดูรูปแล้ววาดเอง', geometryCreative: 'วาดภาพสร้างสรรค์' };
function startGeometry(mode = 'geometryMixed', grade = selectedGrade) {
  const number = Number(grade); if (!Object.hasOwn(geometryModes, mode) || !GRADE_PROFILES.some(profile => profile.grade === number)) return false;
  if (progress && view === 'learning') saveProgress(); cancelChallenge(); selectedGrade = number; notice(store.writeGrade(number));
  const contentMode = { geometryMixed: 'mixed', geometryTrace: 'trace', geometryCopy: 'copy', geometryCreative: 'creative' }[mode];
  const { activities } = createGeometryRound(number, { mode: contentMode, language: getLanguage() });
  handwriting = { source: 'geometry', mode, grade: number, title: geometryModes[mode], activities, index: 0, completed: false, completions: activities.map(() => false), skips: activities.map(() => false), strokes: activities.map(() => []), connections: activities.map(() => []), coinCounts: activities.map(() => 0), selectedLeft: null, feedback: '' };
  showView('handwriting'); renderHandwriting(); trackGameStart('workshop-' + mode); return true;
}
function renderPencilPalette() {
  const palette = $('pencil-colors'); palette.replaceChildren(); pencilButtons.length = 0;
  PENCIL_COLORS.forEach(item => {
    const choice = button('', 'pencil-color', () => setPencilColor(item.color)); choice.dataset.pencilColor = item.color; choice.setAttribute('aria-label', t('ดินสอสี' + item.label)); choice.setAttribute('aria-pressed', String(item.color === pencilColor));
    const swatch = node('span', 'pencil-swatch'); swatch.style.backgroundColor = item.color; swatch.setAttribute('aria-hidden', 'true'); choice.append(swatch, node('span', '', item.label)); palette.append(choice); pencilButtons.push(choice);
  });
  $('pencil-selected').textContent = t('กำลังใช้สี' + (PENCIL_COLORS.find(item => item.color === pencilColor)?.label || 'เขียว'));
}
function setPencilColor(value) {
  const selected = PENCIL_COLORS.find(item => item.color === value); if (!selected) return false;
  pencilColor = selected.color; pencilButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice.dataset.pencilColor === pencilColor))); $('pencil-selected').textContent = t('กำลังใช้สี' + selected.label); writingTables.refreshTools(); return true;
}
function setSmoothLines(value) {
  if (typeof value !== 'boolean') return false;
  smoothLines = value; const toggle = $('smooth-toggle'); toggle.textContent = t('เส้นนุ่ม: ' + (value ? 'เปิด' : 'ปิด')); toggle.setAttribute('aria-pressed', String(value));
  new Set([activeAnswerMotor?.control, activeTraceMotor, handwritingCanvas]).forEach(control => control?.redraw()); writingTables.refreshTools(); return true;
}
function renderGeometryExample(panel, activity) {
  const figure = node('figure', 'geometry-example'); const canvas = node('canvas'); canvas.id = 'geometry-example'; canvas.width = 400; canvas.height = 400; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', t('ตัวอย่าง' + activity.shapeName + ' สำหรับดูแล้ววาดเอง'));
  const shape = localizedShape(activity.shapeId, getLanguage());
  figure.append(canvas, node('figcaption', '', activity.shapeName), node('p', 'fine', shape?.description || '')); panel.append(figure);
  let context; try { context = canvas.getContext('2d'); } catch {} if (!context) return;
  context.strokeStyle = '#245f44'; context.lineWidth = 9; context.lineJoin = 'round'; context.lineCap = 'round';
  geometryPaths(activity.shapeId, { aspectRatio: 1 }).forEach(path => { context.beginPath(); path.forEach((point, index) => { if (index === 0) context.moveTo(point.x * 400, point.y * 400); else context.lineTo(point.x * 400, point.y * 400); }); context.stroke(); });
}
function handwritingReady() {
  if (!handwriting || handwriting.completed) return false;
  const activity = handwriting.activities[handwriting.index];
  return activity.kind === 'coins' ? handwriting.coinCounts[handwriting.index] === activity.targetCount : Boolean(handwritingCanvas?.isReady());
}
function updateHandwritingStatus(status) {
  if (!handwriting || handwriting.completed) return;
  const next = $('handwriting-next'); if (next) next.disabled = !handwritingReady();
  const message = $('handwriting-status'); if (message && status?.message) message.textContent = t(motorMessage(status));
  if (handwriting.activities[handwriting.index].kind === 'connect') updateTapConnections();
}
function advanceHandwriting(skip = false) {
  if (!handwriting || handwriting.completed || (skip && motorRequired) || (!skip && !handwritingReady())) return false;
  const index = handwriting.index; handwriting.skips[index] = skip; handwriting.completions[index] = !skip;
  if (index === handwriting.activities.length - 1) { handwriting.completed = true; trackGameComplete('workshop-' + handwriting.mode); } else handwriting.index++;
  handwriting.selectedLeft = null; handwriting.feedback = ''; renderHandwriting();
  if (!skip && audio.isEnabled() && audio.isAvailable()) audio.speak(t('เยี่ยมเลย ได้ฝึกมืออีกหนึ่งกิจกรรม'));
  return true;
}
function nextHandwritingActivity() { return advanceHandwriting(false); }
function skipHandwritingActivity() { return advanceHandwriting(true); }
function undoHandwriting() { if (!handwriting || handwriting.completed) return; const activity = handwriting.activities[handwriting.index]; if (activity.kind === 'coins') moveHandwritingCoins(-1); else { handwritingCanvas?.undo(); updateHandwritingStatus(handwritingCanvas?.status()); } }
function clearHandwriting() { if (!handwriting || handwriting.completed) return; const activity = handwriting.activities[handwriting.index]; if (activity.kind === 'coins') { handwriting.coinCounts[handwriting.index] = activity.startCount; renderCoins($('coin-game'), activity); } else { handwritingCanvas?.clear(); handwriting.selectedLeft = null; updateHandwritingStatus(handwritingCanvas?.status()); } }
function selectHandwritingLeft(id) { if (motorRequired || !handwriting || handwriting.completed) return false; const activity = handwriting.activities[handwriting.index]; if (activity.kind !== 'connect' || !activity.pairs.some(pair => pair.id === id)) return false; handwriting.selectedLeft = id; updateTapConnections(); return true; }
function connectHandwriting(leftId, rightId) {
  if (motorRequired || !handwriting || handwriting.completed || handwriting.activities[handwriting.index].kind !== 'connect') return { valid: false, correct: false };
  const result = handwritingCanvas?.connect(leftId, rightId) || { valid: false, correct: false };
  handwriting.feedback = result.correct ? 'จับคู่ได้แล้ว! ลองคู่อื่นต่อได้เลย' : 'ยังไม่ใช่คู่นี้ ลองเลือกใหม่ได้';
  if (result.correct) handwriting.selectedLeft = null; updateTapConnections();
  const status = $('handwriting-status'); if (status) status.textContent = t(handwriting.feedback); updateHandwritingStatus(); return result;
}
function updateTapConnections() {
  if (!handwriting || handwriting.completed) return; const activity = handwriting.activities[handwriting.index]; if (activity.kind !== 'connect') return;
  const links = handwriting.connections[handwriting.index];
  document.querySelectorAll('[data-match-left]').forEach(item => { item.disabled = links.some(link => link.leftId === item.dataset.matchLeft); item.setAttribute('aria-pressed', String(handwriting.selectedLeft === item.dataset.matchLeft)); });
  document.querySelectorAll('[data-match-right]').forEach(item => { item.disabled = links.some(link => link.rightId === item.dataset.matchRight); });
  const caption = $('tap-match-help'); if (caption) caption.textContent = t(handwriting.selectedLeft ? 'เลือกแล้ว! แตะตัวเลือกฝั่งขวาที่เข้าคู่กัน' : 'หรือลองแบบแตะ: เลือกฝั่งซ้าย แล้วเลือกฝั่งขวา');
}
function renderTapConnections(panel, activity) {
  const help = node('p', 'fine'); help.id = 'tap-match-help'; const columns = node('div', 'tap-matching'); const left = node('div', 'tap-match-column'); const right = node('div', 'tap-match-column');
  left.append(node('strong', 'tiny-label', 'ฝั่งซ้าย')); right.append(node('strong', 'tiny-label', 'ฝั่งขวา'));
  activity.pairs.forEach(pair => { const item = button(pair.leftLabel, 'tap-match-button', () => selectHandwritingLeft(pair.id)); item.dataset.matchLeft = pair.id; item.setAttribute('aria-pressed', 'false'); item.setAttribute('aria-label', t('เลือกฝั่งซ้าย ' + pair.leftLabel)); left.append(item); });
  activity.rightOrder.forEach(index => { const pair = activity.pairs[index]; const item = button(pair.rightLabel, 'tap-match-button', () => { if (!handwriting.selectedLeft) { $('handwriting-status').textContent = t('เลือกฝั่งซ้ายก่อนนะ'); return; } connectHandwriting(handwriting.selectedLeft, pair.id); }); item.dataset.matchRight = pair.id; item.setAttribute('aria-label', t('จับคู่กับฝั่งขวา ' + pair.rightLabel)); right.append(item); });
  columns.append(left, right); panel.append(help, columns);
}
function moveHandwritingCoins(delta) {
  if (!handwriting || handwriting.completed || !Number.isInteger(delta)) return null; const activity = handwriting.activities[handwriting.index]; if (activity.kind !== 'coins') return null;
  const index = handwriting.index; handwriting.coinCounts[index] = Math.max(activity.startCount, Math.min(activity.targetCount, handwriting.coinCounts[index] + delta));
  const game = $('coin-game'); if (game) renderCoins(game, activity); updateHandwritingStatus(); return handwriting.coinCounts[index];
}
function renderCoins(panel, activity) {
  if (!panel || !handwriting) return; if (cleanupDrawing) { cleanupDrawing(); cleanupDrawing = null; } panel.replaceChildren();
  const count = handwriting.coinCounts[handwriting.index]; const tray = node('div', 'coin-tray'); tray.id = 'coin-tray'; tray.setAttribute('aria-label', t('ถาดเหรียญ มี ' + count + ' จาก ' + activity.targetCount + ' เหรียญ'));
  for (let index = 0; index < activity.targetCount; index++) { const slot = button(index < count ? String(activity.coinValue) : '＋', 'coin-slot' + (index < count ? ' filled' : '') + (index < activity.startCount ? ' original' : ''), () => { if (index >= activity.startCount && index < handwriting.coinCounts[handwriting.index]) moveHandwritingCoins(-1); else if (index >= handwriting.coinCounts[handwriting.index]) moveHandwritingCoins(1); }); slot.disabled = index < activity.startCount; slot.setAttribute('aria-label', t(index < activity.startCount ? 'เหรียญเดิม ' + activity.coinValue + ' บาท' : index < count ? 'นำเหรียญที่เติมออกหนึ่งเหรียญ' : 'เติมเหรียญหนึ่งเหรียญ')); tray.append(slot); }
  const reserve = button('', 'coin-reserve'); reserve.id = 'coin-reserve'; reserve.append(node('span', 'reserve-coin', String(activity.coinValue)), node('span', '', 'แตะหรือลากเหรียญลงถาด')); reserve.disabled = count === activity.targetCount;
  const ghost = node('span', 'coin-drag-ghost', String(activity.coinValue)); ghost.hidden = true; ghost.setAttribute('aria-hidden', 'true');
  let active = null, origin = null, dragging = false, suppressClick = false;
  reserve.addEventListener('click', () => { if (suppressClick) { suppressClick = false; return; } moveHandwritingCoins(1); });
  reserve.addEventListener('pointerdown', event => { if (active !== null || (event.button !== undefined && event.button !== 0)) return; suppressClick = false; active = event.pointerId; origin = { x: event.clientX, y: event.clientY }; dragging = false; try { reserve.setPointerCapture(event.pointerId); } catch {} });
  reserve.addEventListener('pointermove', event => { if (active !== event.pointerId) return; if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) dragging = true; if (dragging) { event.preventDefault(); ghost.hidden = false; ghost.style.left = event.clientX + 'px'; ghost.style.top = event.clientY + 'px'; } });
  reserve.addEventListener('pointerup', event => { if (active !== event.pointerId) return; dragging = dragging || Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8; active = null; ghost.hidden = true; if (!dragging) return; suppressClick = true; const rect = tray.getBoundingClientRect(); const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom; if (inside) moveHandwritingCoins(1); else $('handwriting-status').textContent = t('ลองลากเหรียญมาปล่อยในถาด หรือแตะปุ่มเติมได้'); });
  const cancel = event => { if (active !== event.pointerId) return; active = null; ghost.hidden = true; dragging = false; suppressClick = true; }; reserve.addEventListener('pointercancel', cancel); reserve.addEventListener('lostpointercapture', cancel);
  const controls = node('div', 'coin-controls'); const minus = button('− นำออก 1 เหรียญ', 'button outline compact', () => moveHandwritingCoins(-1)); const plus = button('+ เติม 1 เหรียญ', 'button pale compact', () => moveHandwritingCoins(1)); minus.id = 'coin-remove'; plus.id = 'coin-add'; minus.disabled = count <= activity.startCount; plus.disabled = count >= activity.targetCount; const reset = button('เริ่มเติมใหม่', 'button outline compact', clearHandwriting); reset.id = 'coin-reset'; controls.append(minus, plus, reset);
  const amount = node('p', 'coin-amount', count + ' / ' + activity.targetCount + ' เหรียญ · ' + (count * activity.coinValue) + ' / ' + activity.targetMoney + ' บาท'); amount.id = 'coin-count'; amount.setAttribute('role', 'status');
  panel.append(node('p', 'coin-goal', 'เติมให้ครบ ' + activity.targetMoney + ' บาท'), tray, reserve, controls, amount, ghost, node('p', 'fine', 'แตะเหรียญที่เติมเพื่อนำออก เหรียญเดิมคงไว้'));
  cleanupDrawing = () => { active = null; ghost.hidden = true; };
  const status = $('handwriting-status'); if (status) status.textContent = t(count === activity.targetCount ? 'ครบแล้ว! เราเติมเหรียญจนถึงเป้าหมาย' : 'ยังเติมได้อีก ' + (activity.targetCount - count) + ' เหรียญ');
  updateHandwritingStatus();
}
function renderHandwriting() {
  if (!handwriting) return; if (cleanupDrawing) { cleanupDrawing(); cleanupDrawing = null; } handwritingCanvas = null; audio.stop();
  const panel = $('handwriting-panel'); panel.replaceChildren(); const total = handwriting.activities.length, done = handwriting.completions.filter(Boolean).length;
  $('handwriting-scope').textContent = t('ป.' + handwriting.grade + ' · ' + handwriting.title);
  $('handwriting-stars').textContent = t(done + ' / ' + total);
  $('handwriting-progress').textContent = t(handwriting.completed ? 'เล่นครบ ' + total + ' กิจกรรมแล้ว' : 'กิจกรรม ' + (handwriting.index + 1) + ' จาก ' + total);
  $('handwriting-progress-fill').style.width = ((handwriting.completed ? total : handwriting.index) / total * 100) + '%';
  if (handwriting.completed) {
    $('handwriting-heading').textContent = t('ได้ฝึกมือกันเต็มที่แล้ว!'); const badge = node('div', 'handwriting-complete'); badge.append(node('span', 'medal', '✎'), node('h2', '', 'ขอบคุณที่ลองเล่นจนจบ'), node('p', '', 'ลงมือทำ ' + done + ' กิจกรรม · เลือกข้าม ' + handwriting.skips.filter(Boolean).length + ' กิจกรรม'), node('p', 'fine', 'ดาวสำหรับความตั้งใจและกิจกรรมที่เราได้ลงมือฝึก')); const actions = node('div', 'lesson-actions'); actions.append(button('สุ่มเล่นชุดใหม่', 'button primary', () => handwriting.source === 'geometry' ? startGeometry(handwriting.mode, handwriting.grade) : startHandwriting(handwriting.mode, handwriting.grade)), button('กลับไปเลือกเกม', 'button outline', goHome)); panel.append(badge, actions); focusHeading('handwriting-heading'); return;
  }
  const activity = handwriting.activities[handwriting.index]; $('handwriting-heading').textContent = t(activity.title);
  panel.append(node('p', 'workshop-instruction', activity.instruction), audioControls(activity.instruction));
  if (activity.kind === 'copy') panel.append(node('div', 'number-copy-target', activity.target));
  if (activity.kind === 'shape-copy') renderGeometryExample(panel, activity);
  if (activity.kind === 'creative') panel.append(node('p', 'creative-note', 'วาดได้ตามจินตนาการของเรา ไม่มีคำตอบเดียว ✨'));
  const status = feedback(); status.id = 'handwriting-status';
  const next = button(activity.kind === 'trace' || activity.kind === 'copy' ? 'เขียนแล้ว ไปต่อ →' : ['shape-trace', 'shape-copy', 'creative'].includes(activity.kind) ? 'วาดแล้ว ไปต่อ →' : 'ทำได้แล้ว ไปต่อ →', 'button primary', nextHandwritingActivity); next.id = 'handwriting-next'; next.disabled = true;
  const actions = node('div', 'lesson-actions'); actions.append(next); if (!motorRequired) actions.append(button('ข้ามกิจกรรมนี้', 'button outline', skipHandwritingActivity));
  if (activity.kind === 'coins') { const game = node('div', 'coin-game'); game.id = 'coin-game'; panel.append(game, status, actions); renderCoins(game, activity); }
  else {
    const canvas = node('canvas', 'handwriting-game-canvas'); canvas.id = 'handwriting-canvas'; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', t(activity.kind === 'trace' ? 'เขียนตามรอยเลข ' + activity.target : activity.kind === 'copy' ? 'พื้นที่เขียนเลขด้วยตัวเอง' : activity.kind === 'path' ? 'ลากเส้นตามทางจากจุดเริ่มถึงจุดจบ' : activity.kind === 'shape-trace' ? 'ลากตามรอย' + activity.shapeName + ' ให้ครบและกลับจุดเริ่ม' : activity.kind === 'shape-copy' ? 'พื้นที่ว่างสำหรับวาด' + activity.shapeName + ' จากตัวอย่าง' : activity.kind === 'creative' ? 'พื้นที่วาดภาพสร้างสรรค์ตามจินตนาการ' : 'ลากเส้นจับคู่ฝั่งซ้ายและฝั่งขวา')); canvas.tabIndex = 0;
    const tools = node('div', 'writing-tools'); const undo = button('ย้อนเส้น', '', undoHandwriting); undo.id = 'handwriting-undo'; const clear = button('ล้างแล้วลองใหม่', '', clearHandwriting); clear.id = 'handwriting-clear'; tools.append(undo, clear);
    panel.append(canvas, tools); if (activity.kind === 'connect' && !motorRequired) renderTapConnections(panel, activity);
    panel.append(status, actions, node('p', 'fine', motorRequired ? 'ค่อย ๆ เขียนหรือลากเส้นให้พร้อมก่อนยืนยัน รอยเขียนอยู่เฉพาะรอบนี้' : 'โหมดช่วย: ข้ามหรือใช้ปุ่มทางเลือกได้ รอยเขียนอยู่เฉพาะรอบนี้'));
    const control = mountHandwritingCanvas(canvas, { activity, strokes: handwriting.strokes[handwriting.index], connections: handwriting.connections[handwriting.index], requireGesture: motorRequired, smooth: () => smoothLines, color: () => pencilColor, onChange: updateHandwritingStatus });
    handwritingCanvas = control; cleanupDrawing = () => { control.cleanup(); if (handwritingCanvas === control) handwritingCanvas = null; }; updateHandwritingStatus(control.status());
  }
  focusHeading('handwriting-heading');
}
function openParentGate() {
  parentUnlocked = false;
  if (progress && view === 'learning') saveProgress(); cancelChallenge(); showView('parents'); const panel = $('parent-panel'); panel.replaceChildren(); const gate = node('div', 'parent-gate');
  gate.append(node('h2', '', 'ส่งต่อให้ผู้ปกครองสักครู่'), node('p', '', 'พื้นที่นี้สำหรับผู้ปกครองดูผลการฝึก คำแนะนำช่วยลูก และช่องทางติดต่อสถาบัน'), button('ฉันเป็นผู้ปกครอง ดูผลและข้อมูล', 'button primary', renderParents)); panel.append(gate); focusHeading('parent-heading');
}
function renderParents() {
  if (view !== 'parents') return; parentUnlocked = true;
  const panel = $('parent-panel'); panel.replaceChildren(); const columns = node('div', 'parent-columns'); const learning = node('section', 'parent-box'); learning.append(node('h2', '', 'ผลการฝึกบนเครื่องนี้'));
  if (progress) { learning.append(node('p', '', (progress.completed ? 'จบช่วงหลักแล้ว' : 'ยังเล่นไม่จบ') + ' · G1-M03 เติมแสงให้สวน'), summaryList()); const w = progress.writing; learning.append(node('p', '', 'การเขียน: ' + (w.attempted ? 'ได้ลองเขียน' : 'ยังไม่ได้ลองเขียน') + (w.skipped ? ' · มีขั้นที่เลือกข้าม' : '') + (w.confirmed !== null ? ' · ยืนยันเองว่าตั้งใจเขียน ' + w.confirmed : '')), node('p', 'fine', 'ไม่มีการประเมินอ่านลายมืออัตโนมัติ การยืนยันเลขไม่ใช่คะแนนคณิตศาสตร์')); learning.append(node('p', '', 'ใบ้คำนวณในสวน: ' + progress.hints.base + '/3 · ใบ้เรื่องใหม่: ' + progress.hints.transfer + '/3')); }
  else learning.append(node('p', '', 'ยังไม่มีผลการฝึก เริ่มภารกิจแล้วกลับมาดูได้'));
  learning.append(node('p', '', 'ลองช่วยต่อ: จัดของ 9 ชิ้นกับ 6 ชิ้น ชวนเด็กเติมให้ครบสิบ แล้วถามว่าส่วนที่เหลือมาจากไหน'), node('p', 'fine', 'ผลนี้แยกการทำเองจากการใช้ตัวช่วย การจบเรื่องเดียวไม่ใช่หลักฐาน mastery และไม่อ้างว่าพัฒนาการเกิดจากเกมแล้ว'));
  const contacts = node('section', 'parent-box'); contacts.append(node('h2', '', 'Math wizard by DR.Suwan'), node('p', '', 'เห็นวิธีคิดของลูก แล้วต่อยอดให้ตรงจุด'), node('p', 'fine', 'ลิงก์ต่อไปนี้ออกจากเกมเมื่อกด ไม่มีการส่งคำตอบหรือข้อมูลเด็กไปช่องทางเหล่านี้อัตโนมัติ'));
  const list = node('ul', 'contact-list'); CONTACTS.forEach(contact => { if (!/^(https?:|tel:|mailto:)/.test(contact.url)) return; const li = node('li'); const a = node('a', '', contact.label + ' ↗'); a.href = contact.url; if (contact.url.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } li.append(a); list.append(li); }); contacts.append(list); columns.append(learning, contacts); panel.append(columns);
  panel.append(node('p', 'fine', 'รุ่นนี้มีเกมวาดรูปเรขาคณิตแบบตามรอย ดูแล้ววาด และวาดสร้างสรรค์ การวาดเองเป็นการฝึกมือ ไม่ใช่การตรวจว่ารูปถูกต้องอัตโนมัติ และมีเกมฝึกมือชุดสั้น 14 และชุดใหญ่ 32 กิจกรรม เลือกฝึกเขียนตามรอยหรือเขียนเองอย่างละ 10 แบบ และเกมย่อยชนิดละ 4 แบบ โจทย์สุ่มฝึกและท้าทาย ป.1–6 เลือกฝึกเฉพาะหัวข้อได้ ป.5 เพิ่มเศษส่วน ทศนิยม ร้อยละ การวัดและอ่านข้อมูล ป.6 เพิ่ม ห.ร.ม./ค.ร.น. อัตราส่วน เรขาคณิตและแผนภูมิรูปวงกลม เป็นชุดฝึกที่คัดสรร ยังไม่ครอบคลุมทุกตัวชี้วัดของหลักสูตร และภารกิจทำสิบพร้อมภาพ/เขียนสำหรับ ป.1 หนึ่งเรื่อง ดาวฝึกมือให้จากการลงมือทำ ไม่อ่านลายมืออัตโนมัติหรือให้คะแนนความสวย รอยเขียนในเกมฝึกมือไม่เก็บถาวร ส่วนข้อมูลการเรียนและอันดับเก็บบนเบราว์เซอร์เมื่อรองรับ ไม่ซิงก์ข้ามเครื่อง และไม่ขอชื่อจริงเด็ก'));
  const modeBox = node('section', 'parent-box motor-settings'); modeBox.append(node('h2', '', 'วิธีตอบในโหมดฝึก'));
  const toggle = button('ให้เขียน/ลากเส้นก่อนตอบ: ' + (motorRequired ? 'เปิด' : 'ปิด — ใช้วิธีช่วย'), 'button ' + (motorRequired ? 'primary' : 'outline'), () => setMotorRequired(!motorRequired)); toggle.id = 'motor-required-toggle'; toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-checked', String(motorRequired));
  modeBox.append(toggle, node('p', '', 'ค่าเริ่มต้นให้เด็กเขียนและลากเส้นก่อน แป้นตัวเลขใช้ยืนยันเลขที่เขียน โหมดท้าทายนับเวลารวมการเขียนและยืนยันเลข โดยแยกอันดับจากวิธีช่วยพิมพ์คำตอบ'));
  modeBox.append(node('p', 'fine', 'หากอุปกรณ์หรือการควบคุมมือยังไม่พร้อม ผู้ปกครองปิดตัวเลือกนี้เพื่อใช้แป้นตัวเลข ข้ามการเขียน หรือแตะจับคู่แทนได้ ไม่มีการอ่านลายมืออัตโนมัติ'));
  panel.append(modeBox);
  const clear = node('div', 'inline-confirm'); clear.hidden = true; clear.append(node('p', '', 'ลบความคืบหน้าฝึกบนเครื่องนี้? คะแนนท้าทายจะไม่ถูกลบ'), button('ยืนยันลบความคืบหน้า', 'button outline compact', () => { const result = store.clearProgress(); progress = null; notice(result); renderParents(); }), button('เก็บข้อมูลเดิม', 'button pale compact', () => { clear.hidden = true; })); panel.append(button('ลบความคืบหน้าฝึกบนเครื่องนี้', 'button outline compact', () => { clear.hidden = false; }), clear);
}

$('start-mission').addEventListener('click', () => { if (progress) { $('new-mission-confirm').hidden = false; $('confirm-new').focus(); } else startNewMission(); });
$('confirm-new').addEventListener('click', startNewMission); $('cancel-new').addEventListener('click', () => { $('new-mission-confirm').hidden = true; });
$('handwriting-home').addEventListener('click', goHome);
$('start-adventure').addEventListener('click', () => startAdventure());
$('start-writing-tables').addEventListener('click', () => startWritingTables());
$('start-math-simulator').addEventListener('click', () => startMathSimulator());
$('start-magic-shop').addEventListener('click', () => startMagicShop());
document.querySelectorAll('[data-geometry-mode]').forEach(item => item.addEventListener('click', () => startGeometry(item.dataset.geometryMode)));
$('smooth-toggle').addEventListener('click', () => setSmoothLines(!smoothLines));
document.querySelectorAll('[data-workshop-mode]').forEach(item => item.addEventListener('click', () => startHandwriting(item.dataset.workshopMode)));
$('resume-mission').addEventListener('click', resumeMission); $('start-practice').addEventListener('click', () => startPractice()); $('start-challenge').addEventListener('click', () => startChallenge());
$('practice-topic').addEventListener('change', event => selectPracticeTopic(event.target.value));
$('language-th').addEventListener('click', () => changeLanguage('th'));
$('language-en').addEventListener('click', () => changeLanguage('en'));
document.querySelectorAll('[data-grade]').forEach(item => item.addEventListener('click', () => selectGrade(Number(item.dataset.grade))));
$('pause-mission').addEventListener('click', goHome); $('brand-home').addEventListener('click', goHome); $('leave-challenge').addEventListener('click', goHome); $('parents-home').addEventListener('click', goHome); $('open-parents').addEventListener('click', openParentGate);
$('audio-toggle').addEventListener('click', () => { audio.setEnabled(!audio.isEnabled()); const enabled = audio.isEnabled(); $('audio-toggle').textContent = t(enabled ? 'เสียง: เปิด' : 'เสียง: ปิด'); $('audio-toggle').setAttribute('aria-pressed', String(enabled)); });
window.addEventListener('beforeunload', () => { if (progress && view === 'learning') saveProgress(); adventure.deactivate(); writingTables.deactivate(); mathSimulator.deactivate(); magicShop.deactivate(); audio.stop(); stopTimer(); });
fontSize.initialize();
refreshLanguageControls(); notice(initial); showView('home'); renderHome();
const requestedFeature = new URLSearchParams(window.location?.search || '').get('feature');
if (requestedFeature === 'simulator') startMathSimulator();
else if (requestedFeature === 'writing-tables') startWritingTables();
else if (requestedFeature === 'magic-shop') startMagicShop();
export function getAppState() { return JSON.parse(JSON.stringify({ language: getLanguage(), fontSizePercent: fontSize.getPercent(), view, selectedGrade, selectedPracticeTopic, motorRequired, smoothLines, pencilColor, guidedInk, progress, challenge, round: challenge, handwriting, workshop: handwriting, arcade: arcade.getState(), adventure: adventure.getState(), writingTables: writingTables.state(), mathSimulator: mathSimulator.getState(), magicShop: magicShop.getState() })); }
export const appActions = { setLanguage: changeLanguage, setFontSize: fontSize.setPercent, startMagicShop, magicShop: magicShop.actions, startMathSimulator, mathSimulator: mathSimulator.actions, startWritingTables, startAdventure, adventure: adventure.actions, startArcade, arcade: arcade.actions, selectPracticeTopic, startGeometry, setSmoothLines, setPencilColor, setMotorRequired, confirmAnswerWriting, confirmPracticeWriting: () => confirmAnswerWriting('practice-' + challenge?.index), confirmGuidedWriting: () => confirmAnswerWriting('guided-' + (progress?.step === 'write' ? 'write' : fields[progress?.step])), startHandwriting, nextHandwritingActivity, skipHandwritingActivity, undoHandwriting, clearHandwriting, selectHandwritingLeft, connectHandwriting, moveHandwritingCoins, startNewMission, resumeMission, goHome, selectGrade, startPractice, startChallenge, requestPracticeHint, submitLearningAnswer, requestHint, moveLight, advanceLearning, markWritingAttempt, completeTrace, confirmWriting, skipWriting, submitChallengeAnswer, nextChallengeQuestion, openParentGate, renderParents };

// Readable state/actions for local browser smoke checks.
window.__mathWizard = { getAppState, appActions, state: getAppState, actions: appActions };
