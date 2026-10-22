import { SIMULATOR_ROOMS, SIMULATOR_GRADE_PRESETS, createSimulatorState, changeSimulatorValue, advanceSimulator, getSimulatorModel, createSimulatorMission, evaluateSimulatorMission } from './math-simulator.js';
import { renderSimulatorScene } from './math-simulator-visuals.js';
import { getLanguage } from './i18n.js';
import { trackGameComplete } from './analytics.js';

const el = (tag, className = '', text = '') => {
  const item = document.createElement(tag); item.className = className;
  if (text) item.textContent = text;
  return item;
};

/** The laboratory remembers discoveries for this session without changing assessment scores. */
export function createMathSimulatorController(panel, { onHome, playEffect = () => {} } = {}) {
  const sound = name => { try { playEffect(name); } catch {} };
  let active = false, grade = 1, room = 'addition', language = getLanguage(), refs = {}, disposeScene = null;
  const records = new Map();
  const tr = (thai, english) => language === 'en' ? english : thai;
  const local = value => typeof value === 'string' ? value : value?.[language] || value?.th || '';
  const button = (text, action, className = 'sim-button secondary') => {
    const item = el('button', className, text); item.type = 'button';
    item.addEventListener('click', action); return item;
  };
  const cleanupScene = () => { disposeScene?.(); disposeScene = null; };
  const record = () => {
    if (!records.has(room)) records.set(room, { explore: createSimulatorState(room), mode: 'explore', missionIndex: 0, mission: null, missionState: null, feedback: '', hinted: false, solved: [] });
    return records.get(room);
  };
  const current = () => { const item = record(); return item.mode === 'mission' ? item.missionState : item.explore; };
  const put = next => { const item = record(); if (item.mode === 'mission') item.missionState = next; else item.explore = next; };
  const solvedIds = () => [...records.values()].flatMap(item => item.solved);
  function selectRoom(next) {
    if (!active || !SIMULATOR_ROOMS.some(item => item.id === next)) return false;
    room = next; render(); return true;
  }
  function setValue(key, value, audible = true) {
    if (!active || !['a', 'b'].includes(key)) return false;
    const before = current(), next = changeSimulatorValue(before, key, Number(value));
    put(next); record().feedback = '';
    if (audible && ['a', 'b', 'c', 'phase'].some(field => before[field] !== next[field])) sound('tap');
    refresh(); return true;
  }
  function advance() {
    if (!active) return false;
    const before = current(), next = advanceSimulator(before);
    put(next); record().feedback = '';
    if (['a', 'b', 'c', 'phase'].some(field => before[field] !== next[field])) sound('tap');
    refresh(); return true;
  }
  function startMission() {
    if (!active) return false;
    const item = record();
    if (!item.mission) {
      item.mission = createSimulatorMission(room, item.missionIndex);
      item.missionState = createSimulatorState(room, item.mission.startState);
    }
    item.mode = 'mission'; render(); return true;
  }
  function explore() { if (!active) return false; record().mode = 'explore'; render(); return true; }
  function nextMission() {
    if (!active) return false;
    const item = record(); item.missionIndex = (item.missionIndex + 1) % 3;
    item.mission = createSimulatorMission(room, item.missionIndex);
    item.missionState = createSimulatorState(room, item.mission.startState);
    item.mode = 'mission'; item.feedback = ''; item.hinted = false; render(); return true;
  }
  function checkMission() {
    if (!active || record().mode !== 'mission') return false;
    const item = record(), correct = evaluateSimulatorMission(item.mission, current()), previousFeedback = item.feedback;
    item.feedback = correct ? 'success' : 'retry';
    if (correct && !item.solved.includes(item.mission.id)) {
      item.solved.push(item.mission.id); trackGameComplete('math-simulator-' + room);
    }
    if (!correct || previousFeedback !== 'success') sound(correct ? 'success' : 'retry');
    refresh(); return correct;
  }
  function showHint() { if (!active || record().mode !== 'mission') return false; record().hinted = true; refresh(); return true; }
  function reset() {
    if (!active) return false;
    const item = record();
    put(createSimulatorState(room, item.mode === 'mission' ? item.mission.startState : {}));
    item.feedback = ''; item.hinted = false; sound('tap'); refresh(); return true;
  }
  function sceneTap(action, key, value) {
    if (!active) return;
    if (action === 'advance') advance();
    else if (action === 'set') setValue(key, value);
    else if (action === 'increment' || action === 'decrement') {
      const control = getSimulatorModel(current(), language).controls.find(item => item.key === key);
      if (control) setValue(key, current()[key] + (action === 'increment' ? 1 : -1) * control.step);
    }
  }
  function refresh() {
    if (!active) return;
    const item = record(), state = current(), model = getSimulatorModel(state, language);
    refs.roomTitle.textContent = local(model.title);
    refs.description.textContent = local(model.description);
    refs.formula.textContent = model.formula;
    refs.explanation.textContent = model.explanation;
    refs.scene.setAttribute('aria-label', model.summary);
    refs.controls.forEach((control, index) => {
      const spec = model.controls[index];
      control.input.min = String(spec.min); control.input.max = String(spec.max); control.input.step = String(spec.step); control.input.value = String(spec.value);
      control.output.textContent = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'th-TH').format(spec.value);
      control.minus.disabled = spec.value <= spec.min; control.plus.disabled = spec.value >= spec.max;
    });
    refs.action.hidden = !model.actionLabel;
    refs.action.textContent = model.actionLabel || '';
    refs.action.disabled = Boolean(model.actionDisabled);
    refs.mission.hidden = item.mode !== 'mission';
    refs.explore.setAttribute('aria-pressed', String(item.mode === 'explore'));
    refs.missionToggle.setAttribute('aria-pressed', String(item.mode === 'mission'));
    refs.total.textContent = tr(`ค้นพบแล้ว ${solvedIds().length} / 21 ภารกิจ`, `${solvedIds().length} / 21 discoveries`);
    refs.roomProgress.textContent = tr(`${item.solved.length} / 3 ภารกิจของห้องนี้`, `${item.solved.length} / 3 room discoveries`);
    refs.roomButtons.forEach(({ id, badge }) => {
      const count = records.get(id)?.solved.length || 0;
      badge.textContent = count ? `${count}/3` : '';
    });
    if (item.mode === 'mission') {
      refs.missionNumber.textContent = tr(`ภารกิจ ${item.missionIndex + 1} / 3`, `Mission ${item.missionIndex + 1} / 3`);
      refs.prompt.textContent = local(item.mission.prompt);
      refs.hint.hidden = !item.hinted; refs.hint.textContent = local(item.mission.hint);
      refs.hintButton.textContent = item.hinted ? tr('เปิดคำใบ้แล้ว', 'Hint shown') : tr('ขอคำใบ้', 'Show a hint');
      refs.hintButton.disabled = item.hinted;
      refs.feedback.className = 'sim-mission-feedback' + (item.feedback ? ' ' + item.feedback : '');
      refs.feedback.textContent = item.feedback === 'success'
        ? tr('ค้นพบแล้ว! ภาพของเราตรงกับเป้าหมาย ลองเล่าเหตุผลให้ฟังได้เลย', 'Discovery made! Your model meets the goal. Explain what you noticed.')
        : item.feedback === 'retry'
          ? tr('ยังไม่ตรงเป้าหมาย ลองปรับภาพอีกนิด หรือเปิดคำใบ้ช่วยได้', 'Not there yet. Adjust the model or try a hint.') : '';
      refs.next.hidden = item.feedback !== 'success';
      refs.check.disabled = item.feedback === 'success';
    }
    cleanupScene();
    disposeScene = renderSimulatorScene(refs.scene, state, { language, onTap: sceneTap });
  }
  function render() {
    if (!active) return;
    cleanupScene();
    const item = record(), model = getSimulatorModel(current(), language);
    panel.replaceChildren(); refs = { controls: [], roomButtons: [] };
    const shell = el('div', 'math-simulator-shell');
    const hero = el('header', 'sim-hero'), copy = el('div');
    copy.append(el('span', 'eyebrow', 'MATH WIZARD · DISCOVERY LAB'));
    const heading = el('h1', '', tr('ห้องทดลองเวทคณิต', 'The math discovery lab')); heading.id = 'math-simulator-heading'; heading.tabIndex = -1;
    copy.append(heading, el('p', '', tr('ขยับตัวเลข จัดภาพ แล้วค้นพบด้วยตัวเอง', 'Move numbers, build models, and make discoveries.')));
    hero.append(copy, button(tr('กลับไปเลือกเกม', 'Back to games'), onHome, 'sim-button secondary sim-back')); shell.append(hero);
    const toolbar = el('div', 'sim-toolbar'), modes = el('div', 'sim-mode-switch');
    modes.setAttribute('role', 'group'); modes.setAttribute('aria-label', tr('วิธีทดลอง', 'Lab mode'));
    refs.explore = button(tr('ทดลองอิสระ', 'Free exploration'), explore); refs.explore.id = 'sim-explore';
    refs.missionToggle = button(tr('รับภารกิจ', 'Try a mission'), startMission); refs.missionToggle.id = 'sim-start-mission';
    modes.append(refs.explore, refs.missionToggle); refs.total = el('span', 'sim-progress');
    toolbar.append(modes, refs.total); shell.append(toolbar);
    const layout = el('div', 'sim-main-layout'), nav = el('nav', 'sim-room-nav');
    nav.setAttribute('aria-label', tr('เลือกห้องทดลอง', 'Choose a discovery room'));
    nav.append(el('p', 'sim-nav-label', tr('เลือกพลังคณิต', 'CHOOSE A MATH POWER')));
    const shortNames = {
      addition: tr('บวก', 'Add'), subtraction: tr('ลบ', 'Subtract'), multiplication: tr('คูณ', 'Multiply'),
      division: tr('หาร', 'Divide'), fractions: tr('เศษส่วน', 'Fractions'), percent: tr('ร้อยละ', 'Percent'), scale: tr('มาตราส่วน', 'Scale'),
    };
    SIMULATOR_ROOMS.forEach(metadata => {
      const choice = button('', () => selectRoom(metadata.id), 'sim-room-button'); choice.dataset.simRoom = metadata.id;
      choice.setAttribute('aria-pressed', String(metadata.id === room));
      const symbol = el('span', 'sim-room-symbol', metadata.symbol); symbol.setAttribute('aria-hidden', 'true');
      const words = el('span', 'sim-room-copy'); words.append(el('strong', 'sim-room-full', local(metadata.label)), el('strong', 'sim-room-short', shortNames[metadata.id]), el('small', '', local(metadata.description)));
      const badge = el('span', 'sim-room-count'); choice.append(symbol, words, badge); nav.append(choice); refs.roomButtons.push({ id: metadata.id, badge });
    });
    nav.append(el('p', 'sim-grade-note', tr(`เริ่มตามความพร้อม ป.${grade} · เลือกลองได้ทุกห้อง`, `Grade ${grade} starting point · Explore any room`)));
    layout.append(nav);
    const workspace = el('section', 'sim-workspace');
    const sceneHeading = el('div', 'sim-scene-heading'), titles = el('div');
    refs.roomTitle = el('h2'); refs.description = el('p'); titles.append(refs.roomTitle, refs.description);
    refs.roomProgress = el('span', 'sim-badge'); sceneHeading.append(titles, refs.roomProgress); workspace.append(sceneHeading);
    refs.mission = el('section', 'sim-mission'); refs.mission.setAttribute('aria-label', tr('ภารกิจทดลอง', 'Discovery mission'));
    refs.missionNumber = el('span', 'eyebrow'); refs.prompt = el('h3'); refs.prompt.id = 'sim-mission-prompt';
    refs.mission.append(refs.missionNumber, refs.prompt);
    refs.hint = el('p', 'sim-hint'); refs.hint.hidden = true;
    const missionActions = el('div', 'sim-mission-actions');
    refs.check = button(tr('ตรวจภารกิจ', 'Check my model'), checkMission, 'sim-button primary'); refs.check.id = 'sim-check-mission';
    refs.hintButton = button(tr('ขอคำใบ้', 'Show a hint'), showHint, 'sim-button quiet'); refs.hintButton.id = 'sim-show-hint';
    refs.next = button(tr('ภารกิจต่อไป →', 'Next mission →'), nextMission, 'sim-button secondary'); refs.next.id = 'sim-next-mission'; refs.next.hidden = true;
    missionActions.append(refs.check, refs.hintButton, refs.next); refs.feedback = el('p', 'sim-mission-feedback'); refs.feedback.id = 'sim-mission-feedback';
    refs.feedback.setAttribute('role', 'status'); refs.feedback.setAttribute('aria-live', 'polite');
    refs.mission.append(refs.hint, missionActions, refs.feedback); workspace.append(refs.mission);
    refs.scene = el('div', 'sim-scene'); refs.scene.id = 'sim-scene'; refs.scene.setAttribute('role', 'group'); workspace.append(refs.scene);
    const math = el('div', 'sim-math'); refs.formula = el('div', 'sim-equation'); refs.formula.id = 'sim-equation';
    refs.explanation = el('p', 'sim-explanation'); refs.explanation.id = 'sim-explanation'; math.append(refs.formula, refs.explanation); workspace.append(math);
    const controls = el('div', 'sim-controls');
    model.controls.forEach(spec => {
      const field = el('div', 'sim-control'), label = el('label', '', spec.label); label.setAttribute('for', 'sim-control-' + spec.key);
      const stepper = el('div', 'sim-stepper');
      const minus = button('−', () => setValue(spec.key, current()[spec.key] - spec.step), 'sim-step-button'); minus.setAttribute('aria-label', tr('ลด ', 'Decrease ') + spec.label);
      const output = el('output'); output.setAttribute('for', 'sim-control-' + spec.key);
      const plus = button('+', () => setValue(spec.key, current()[spec.key] + spec.step), 'sim-step-button'); plus.setAttribute('aria-label', tr('เพิ่ม ', 'Increase ') + spec.label);
      stepper.append(minus, output, plus);
      const input = el('input'); input.type = 'range'; input.id = 'sim-control-' + spec.key;
      input.addEventListener('input', event => setValue(spec.key, event.currentTarget.value, false));
      input.addEventListener('change', () => sound('tap')); field.append(label, stepper, input); controls.append(field);
      refs.controls.push({ input, output, minus, plus });
    }); workspace.append(controls);
    const actions = el('div', 'sim-actions'); refs.action = button('', advance, 'sim-button primary'); refs.action.id = 'sim-advance';
    const restore = button(tr('เริ่มภาพนี้ใหม่', 'Reset this model'), reset, 'sim-button quiet'); restore.id = 'sim-reset';
    actions.append(refs.action, restore); workspace.append(actions); layout.append(workspace); shell.append(layout); panel.append(shell); refresh();
  }
  function start(nextGrade = 1) {
    const preset = SIMULATOR_GRADE_PRESETS.find(item => item.grade === nextGrade);
    if (!preset) return false;
    grade = nextGrade; room = preset.room; language = getLanguage(); active = true; render();
    panel.querySelector?.('h1')?.focus(); return true;
  }
  function getState() {
    if (!records.size) return null;
    const item = record(), state = current();
    return {
      active, grade, room, language, mode: item.mode, state: { ...state }, formula: getSimulatorModel(state, language).formula,
      solvedMissionIds: [...solvedIds()],
      mission: item.mission ? { id: item.mission.id, index: item.missionIndex, prompt: local(item.mission.prompt), hinted: item.hinted, feedback: item.feedback, solved: item.solved.includes(item.mission.id) } : null,
    };
  }
  return {
    start, getState,
    deactivate() { active = false; cleanupScene(); },
    setLanguage(next) { if (!['th', 'en'].includes(next)) return false; language = next; if (active) render(); return true; },
    actions: { selectRoom, setValue, advance, startMission, checkMission, nextMission, showHint, reset, explore },
  };
}
