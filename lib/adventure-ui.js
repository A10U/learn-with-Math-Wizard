import { getLanguage } from './i18n.js';
import {
  ADVENTURE_CAMPAIGNS, LIMIT_MS, createForestStages, createAdventureRun,
  selectAdventure, undoAdventure, submitAdventure, hintAdventure,
  nextAdventure, checkAdventureDeadline, adventureScore, routeDistance,
} from './adventure.js';
import { createAdventureStore } from './adventure-storage.js';

const COPY = {
  th: {
    eyebrow: 'แผนที่ผจญภัย · บทที่ 1', title: 'ป่าเข็มทิศกระซิบ',
    intro: 'พาลูกนกแสงกลับรัง อ่านแบบรูปบนป้าย ต่อสะพานหิน เลือกทางตามเวลาและเสบียง แบ่งของให้เพื่อน และวางเส้นทางผ่านต้นไม้ผู้พิทักษ์',
    grade: 'ป.', home: 'กลับหน้าเริ่ม', hub: 'กลับแผนที่', forest: 'ป่าเข็มทิศกระซิบ',
    available: 'เล่นได้แล้ว · 5 ด่าน', planned: 'แนวคิดบทถัดไป · ยังไม่เปิดเล่น',
    routeTitle: 'เส้นทางการผจญภัยทั้ง 8 บท', routeInfo: 'ตอนนี้เล่นบทป่าได้ครบ 5 ด่าน บทอื่นเป็นแนวคิดที่วางไว้ให้ต่อยอด ไม่ต้องผ่านหอคอยครบ 100 ชั้นเพื่อไปต่อ',
    practiceTitle: 'ผจญภัย · ค่อย ๆ คิด', practiceInfo: 'ไม่จับเวลา ขอคำใบ้และลองใหม่ได้ บันทึกทุกด่านที่ผ่านบนเบราว์เซอร์นี้',
    practice: 'เริ่มเดินป่า →', resume: 'เดินทางต่อจากจุดพัก →', replay: 'กลับไปฝึกด่านสุดท้าย →', fresh: 'ฝึกตั้งแต่ด่านแรก',
    freshInfo: 'เริ่มฝึกใหม่ได้โดยเก็บความคืบหน้าที่เคยทำสำเร็จไว้',
    rankedTitle: 'ท้าทายจับเวลา · 3 นาที', rankedInfo: 'ชุดโจทย์คงที่ตามชั้นเรียน ตอบได้ครั้งเดียวต่อด่าน ไม่มีคำใบ้ เวลายังเดินเมื่อสลับหน้า ใช้ดูสถิติของตนเองบนเครื่องนี้',
    ranked: 'เริ่มรอบจับเวลา →', scoreRule: 'ถูกด่านละ 1,000 คะแนน + โบนัสเวลา = ปัดลง [99 × (เวลาเหลือ ÷ 3 นาที)] เมื่อถูกอย่างน้อย 1 ด่าน คะแนนเท่ากันใช้เวลาน้อยกว่าก่อน เท่ากันทั้งคู่ได้อันดับร่วม ต้องส่งครบ 5 ด่านและกดจบก่อนหมดเวลาจึงบันทึกอันดับ',
    local: 'อันดับเฉพาะเบราว์เซอร์นี้ · ยังไม่มีอันดับออนไลน์', noRanks: 'ยังไม่มีสถิติ เริ่มรอบจับเวลาครั้งแรกเพื่อบันทึกชื่อพ่อมดอัตโนมัติได้เลย',
    ranks: '10 สถิติสูงสุดของชั้นนี้', wizard: 'พ่อมด', points: 'คะแนน', correct: 'ถูก', elapsed: 'เวลาที่ใช้', rank: 'อันดับ',
    progress: 'ผ่านแล้ว', stage: 'ด่าน', of: '/', practiceMode: 'ผจญภัย · ไม่จับเวลา', rankedMode: 'ท้าทายจับเวลา',
    time: 'เหลือเวลา', timerNote: '3 นาทีต่อรอบ · เวลาต่อเนื่อง', cancel: 'พักแล้วกลับแผนที่', cancelRanked: 'ออกจากรอบ · ไม่บันทึกอันดับ',
    promptChoice: 'เลือกหนึ่งคำตอบ แล้วกดตรวจ', promptSum: 'เลือกหินคนละก้อนให้รวมได้ตามเป้าหมาย แตะซ้ำเพื่อนำออก',
    promptRoute: 'เลือกจุดแวะทั้งสามแห่งตามลำดับ แล้วเดินต่อถึงรัง ทุกเส้นทางมีระยะตามแผนที่',
    selection: 'สิ่งที่เลือก', emptySelection: 'ยังไม่ได้เลือก', sum: 'ความยาวรวม', target: 'เป้าหมาย', route: 'เส้นทางที่จัด', distance: 'ระยะรวม', budget: 'ระยะทางไม่เกิน',
    pathMap: 'ระยะทางระหว่างจุด', routeStart: 'จุดเริ่ม', routeEnd: 'รังลูกนก', finishPath: 'ถึงรัง', unit: 'หน่วย',
    undo: 'ย้อนสิ่งที่เลือก', submit: 'ตรวจแล้วเดินต่อ', next: 'ด่านต่อไป →', finish: 'รับตราผู้พิทักษ์ป่า →', finishRanked: 'จบรอบและบันทึกอันดับ →', hint: 'ดูวิธีคิด', hintShown: 'เปิดวิธีคิดแล้ว',
    feedbackCorrect: 'สำเร็จแล้ว! เส้นทางใหม่เปิดให้เดินต่อ ✦', feedbackRetry: 'ยังไม่พอดี ลองปรับสิ่งที่เลือก หรือเปิดวิธีคิดได้',
    feedbackRankedWrong: 'บันทึกคำตอบแล้ว ด่านนี้ยังไม่ถูก ไปด่านต่อไปได้เลย', feedbackIncomplete: 'เลือกข้อมูลให้ครบก่อนกดตรวจ ยังไม่เสียสิทธิ์การตอบ',
    saved: 'ความคืบหน้าและสถิติเก็บเฉพาะเบราว์เซอร์นี้', memory: 'บันทึกถาวรไม่ได้ ความคืบหน้าและอันดับใหม่อยู่เฉพาะระหว่างเปิดหน้านี้',
    corrupt: 'ข้อมูลเก่าอ่านไม่ได้ ข้อมูลเดิมจะเก็บไว้ ความคืบหน้าและอันดับใหม่อยู่เฉพาะระหว่างเปิดหน้านี้',
    complete: 'ลูกนกแสงกลับถึงรังแล้ว!', rankedComplete: 'จบรอบท้าทายแล้ว', timeout: 'ครบเวลา 3 นาทีแล้ว',
    practiceComplete: 'คิดสำเร็จทั้ง 5 ด่านแล้ว จะขอวิธีคิดหรือลองกี่ครั้งก็เดินเรื่องต่อได้',
    rankedCompleteInfo: 'คำตอบและเวลาของรอบนี้บันทึกแยกจากการฝึก ความคืบหน้าในเนื้อเรื่องไม่ขึ้นกับคะแนนหรืออันดับ',
    answered: 'ตอบแล้ว', hintCount: 'ด่านที่ใช้วิธีคิด', practiceNoRank: 'การฝึกไม่บันทึกอันดับ เล่นตามจังหวะของเราได้',
    rankedSaved: 'บันทึกสถิติบนเบราว์เซอร์นี้แล้ว', rankNotSaved: 'รอบนี้ไม่มีสถิติอันดับที่บันทึกได้', memoryRank: 'แสดงสถิติรอบนี้ได้ระหว่างเปิดหน้านี้ แต่ยังบันทึกถาวรไม่ได้',
    timeoutInfo: 'รอบนี้ครบเวลาก่อนจบทั้ง 5 ด่าน จึงไม่บันทึกอันดับ เริ่มรอบใหม่หรือฝึกแบบไม่จับเวลาได้เสมอ',
    again: 'เล่นโหมดนี้อีก →', backMap: 'กลับแผนที่ผจญภัย', noOnline: 'ไม่มีชื่อจริง ไม่มีข้อมูลติดต่อ และไม่มีการส่งคะแนนไปกระดานออนไลน์',
    friendly: 'ช่วยผู้พิทักษ์ป่าเปิดทาง พาลูกนกแสงกลับถึงรัง', mapLabel: 'แผนที่ป่า 5 ด่าน',
    mapNames: ['ทางเข้าป่า', 'สะพานหิน', 'ทางแยกเสบียง', 'ค่ายแบ่งปัน', 'ผู้พิทักษ์ป่า'],
    story: 'ตามรอยคัมภีร์แสง', savedProgress: 'ความคืบหน้าที่เคยผ่าน', routesLater: 'หอคอยบทแรกใช้ชั้น 1–10 ในเส้นเรื่องหลัก ส่วนชั้น 11–100 เป็นเส้นทางเสริมในแผนอนาคต',
  },
  en: {
    eyebrow: 'ADVENTURE ATLAS · CHAPTER 1', title: 'The Whispering Compass Forest',
    intro: 'Guide a lightbird home. Read number patterns, build a stone bridge, choose a path by time and supplies, share with friends, and plan a route past the guardian tree.',
    grade: 'Grade ', home: 'Back home', hub: 'Back to the atlas', forest: 'The Whispering Compass Forest',
    available: 'Ready to play · 5 stages', planned: 'Future chapter · not playable yet',
    routeTitle: 'Eight chapters of adventure', routeInfo: 'All five forest stages are playable now. Other chapters are future concepts. Finishing all 100 tower floors will not be required to continue the story.',
    practiceTitle: 'Adventure · Take your time', practiceInfo: 'Untimed, with hints and unlimited retries. Each cleared stage is saved in this browser.',
    practice: 'Explore the forest →', resume: 'Continue from your checkpoint →', replay: 'Practise the final stage again →', fresh: 'Practise from stage one',
    freshInfo: 'A fresh practice run keeps the progress you have already earned.',
    rankedTitle: 'Timed challenge · 3 minutes', rankedInfo: 'A fixed set for each grade. One submission per stage, without hints. The clock keeps running in other tabs. Follow your own records on this device.',
    ranked: 'Start a timed run →', scoreRule: '1,000 points per correct stage, plus a time bonus: floor[99 × (time left ÷ 3 minutes)] if at least one stage is correct. Equal scores use the shorter time; equal scores and times share a rank. Submit all five stages and finish the run before time expires to save a record.',
    local: 'This browser only · no online leaderboard yet', noRanks: 'No records yet. Finish a timed run to save an automatic wizard nickname.',
    ranks: 'Top 10 records for this grade', wizard: 'Wizard', points: 'points', correct: 'correct', elapsed: 'Time used', rank: 'Rank',
    progress: 'Cleared', stage: 'Stage', of: '/', practiceMode: 'Adventure · Untimed', rankedMode: 'Timed challenge',
    time: 'Time left', timerNote: '3 minutes per run · continuous clock', cancel: 'Rest and return to the atlas', cancelRanked: 'Leave run · no record saved',
    promptChoice: 'Choose one answer, then check it.', promptSum: 'Choose distinct stones to reach the target. Tap a selected stone again to remove it.',
    promptRoute: 'Visit all three stops in your chosen order, then continue to the nest. Use the distances on the map.',
    selection: 'Your selection', emptySelection: 'Nothing selected yet', sum: 'Total length', target: 'Target', route: 'Your route', distance: 'Total distance', budget: 'Distance at most',
    pathMap: 'Distances between locations', routeStart: 'Start', routeEnd: 'Lightbird nest', finishPath: 'Nest', unit: 'units',
    undo: 'Undo last selection', submit: 'Check my plan', next: 'Next stage →', finish: 'Collect the forest badge →', finishRanked: 'Finish and save record →', hint: 'Show a hint', hintShown: 'Hint opened',
    feedbackCorrect: 'You did it! A new path is open ✦', feedbackRetry: 'Not quite yet. Adjust your selection, or open a hint.',
    feedbackRankedWrong: 'Answer recorded. This stage was not correct. Continue to the next stage.', feedbackIncomplete: 'Complete your selection first. This does not use your submission.',
    saved: 'Progress and records are stored in this browser only.', memory: 'Permanent storage is unavailable. New progress and records last only while this page stays open.',
    corrupt: 'An old record could not be read and will be kept untouched. New progress and records last only while this page stays open.',
    complete: 'The lightbird is home!', rankedComplete: 'Timed challenge complete', timeout: 'The 3-minute limit is up',
    practiceComplete: 'All five stages cleared. Hints and retries are welcome on your journey.',
    rankedCompleteInfo: 'Answers and time are recorded separately from practice. Story progress never depends on a score or rank.',
    answered: 'Answered', hintCount: 'Stages with hints', practiceNoRank: 'Practice does not enter the leaderboard. Play at your own pace.',
    rankedSaved: 'Record saved in this browser.', rankNotSaved: 'No leaderboard record was saved for this run.', memoryRank: 'This record is available while this page stays open, but could not be saved permanently.',
    timeoutInfo: 'Time ran out before all five stages were completed, so no leaderboard record was saved. Start a new run or practise without a timer anytime.',
    again: 'Play this mode again →', backMap: 'Back to the adventure atlas', noOnline: 'No real names or contact details, and no scores are sent to an online leaderboard.',
    friendly: 'Help the forest guardian open a path and guide the lightbird home.', mapLabel: 'Five-stage forest map',
    mapNames: ['Forest entrance', 'Stone bridge', 'Supply crossroads', 'Sharing camp', 'Guardian tree'],
    story: 'Follow the scattered pages of light', savedProgress: 'Previously cleared', routesLater: 'The planned tower chapter uses floors 1–10 in the main story. Floors 11–100 are an optional future path.',
  },
};

const make = (tag, className = '', text) => {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = String(text);
  return item;
};
const clockNow = () => globalThis.performance?.now?.() ?? Date.now();
const formatTime = milliseconds => {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** A self-contained forest campaign. Timed runs use an absolute monotonic deadline. */
export function createAdventureController(panel, onHome) {
  const store = createAdventureStore();
  let active = false, grade = 1, language = getLanguage(), view = 'hub', run = null;
  let interval = null, feedback = '', rankEntry = null, settled = false;
  const copy = () => COPY[language];
  const text = key => copy()[key];
  const currentResult = () => run?.results[run.index];
  const currentStage = () => run ? createForestStages(grade, language)[run.index] : null;
  const button = (label, action, className = 'adv-button', id) => {
    const item = make('button', className, label); item.type = 'button';
    if (id) item.id = id;
    item.addEventListener('click', action); return item;
  };
  const stopClock = () => { if (interval !== null) globalThis.clearInterval(interval); interval = null; };
  const storageNote = () => {
    const status = store.status();
    return status === 'memory' ? text('memory') : status === 'corrupt' ? text('corrupt') : text('saved');
  };
  function preserveFocus(focusId, heading = false) {
    const target = focusId ? panel.querySelector?.(`[id="${focusId}"]`) ?? document.getElementById?.(focusId) : null;
    if (target && !target.disabled) { target.focus?.(); return; }
    if (focusId) { const fallback = panel.querySelector?.('#adv-submit') ?? document.getElementById?.('adv-submit'); if (fallback) { fallback.focus?.(); return; } }
    if (heading) { const title = panel.querySelector?.('.adv-focus-title'); title?.focus?.(); }
  }
  function savePractice() {
    if (!run || run.mode !== 'practice') return;
    let cleared = 0;
    for (const result of run.results) { if (!result.correct) break; cleared++; }
    if (cleared) store.saveProgress(grade, cleared);
  }
  function completeRun() {
    if (!run || !run.finished) return;
    stopClock(); savePractice();
    if (!settled) { settled = true; if (run.mode === 'ranked') rankEntry = store.addRank(run); }
    view = 'complete'; render({ heading: true });
  }
  function checkTime(now = clockNow()) {
    if (!active || !run || view !== 'run') return false;
    if (run.finished) { completeRun(); return false; }
    const eligible = checkAdventureDeadline(run, now);
    if (!eligible && run.finished) { completeRun(); return false; }
    return true;
  }
  function updateTimer(now = clockNow()) {
    if (!active || !run || run.mode !== 'ranked' || view !== 'run') return;
    if (!checkTime(now)) return;
    const timer = panel.querySelector?.('#adv-timer');
    if (timer) {
      const remaining = Math.max(0, run.deadline - now);
      timer.textContent = formatTime(remaining);
      timer.classList?.toggle('adv-timer-low', remaining <= 30000);
    }
  }
  function begin(mode, fresh = false) {
    if (!active) return false;
    stopClock(); feedback = ''; rankEntry = null; settled = false;
    run = createAdventureRun(grade, mode, { now: clockNow(), cleared: mode === 'practice' && !fresh ? store.readProgress(grade) : 0 });
    view = 'run'; render({ heading: true });
    if (mode === 'ranked') interval = globalThis.setInterval(updateTimer, 200);
    return true;
  }
  function select(id) {
    const now = clockNow(); if (!checkTime(now)) return false;
    const success = selectAdventure(run, id, now);
    if (success) { feedback = ''; render({ focusId: `adv-option-${id}` }); }
    return success;
  }
  function undo() {
    const now = clockNow(); if (!checkTime(now)) return false;
    const success = undoAdventure(run, now);
    if (success) { feedback = ''; render({ focusId: 'adv-undo' }); }
    return success;
  }
  function submit() {
    const now = clockNow(); if (!checkTime(now)) return false;
    const result = submitAdventure(run, now);
    feedback = !result.valid ? 'feedbackIncomplete' : result.correct ? 'feedbackCorrect' : run.mode === 'ranked' ? 'feedbackRankedWrong' : 'feedbackRetry';
    if (result.correct) savePractice();
    render({ focusId: result.valid && (result.correct || run.mode === 'ranked') ? 'adv-next' : 'adv-submit' });
    return result;
  }
  function hint() {
    const now = clockNow(); if (!checkTime(now)) return false;
    const success = hintAdventure(run, now);
    if (success) render({ focusId: 'adv-hint' });
    return success;
  }
  function next() {
    const now = clockNow(); if (!checkTime(now)) return false;
    const success = nextAdventure(run, now);
    if (!success) return false;
    feedback = '';
    if (run.finished) completeRun(); else render({ heading: true });
    return true;
  }
  function cancel() {
    if (!active) return false;
    stopClock(); savePractice(); run = null; view = 'hub'; feedback = ''; rankEntry = null; settled = false;
    render({ heading: true }); return true;
  }
  function home() { deactivate(); onHome?.(); }
  function start(nextGrade = 1) {
    const value = Number(nextGrade);
    if (!Number.isInteger(value) || value < 1 || value > 6) return false;
    stopClock(); active = true; grade = value; language = getLanguage(); run = null; view = 'hub'; feedback = ''; settled = false; rankEntry = null;
    render({ heading: true }); return true;
  }
  function deactivate() { stopClock(); savePractice(); active = false; run = null; view = 'hub'; feedback = ''; rankEntry = null; settled = false; }
  function stageMap(container, selectedIndex = -1, completed = 0, results = []) {
    const map = make('ol', 'adv-forest-map'); map.setAttribute('aria-label', text('mapLabel'));
    copy().mapNames.forEach((name, index) => {
      const cleared = Array.isArray(completed) ? completed[index] : index < completed;
      const incorrect = results[index]?.submitted && !results[index]?.correct;
      const item = make('li', 'adv-map-stop' + (cleared ? ' adv-map-cleared' : '') + (incorrect ? ' adv-map-incorrect' : '') + (index === selectedIndex ? ' adv-map-current' : ''));
      if (index === selectedIndex) item.setAttribute('aria-current', 'step');
      const symbol = make('span', 'adv-map-number', cleared ? '✓' : incorrect ? '×' : index + 1); symbol.setAttribute('aria-hidden', 'true');
      item.append(symbol, make('span', 'adv-map-name', name)); map.append(item);
    }); container.append(map);
  }
  function top(container) {
    const row = make('div', 'adv-top'), scope = make('div');
    scope.append(make('span', 'adv-eyebrow', `${text('grade')}${grade} · ${text('eyebrow')}`));
    const title = make(view === 'hub' ? 'h1' : 'p', 'adv-top-title', text('title'));
    if (view === 'hub') { title.className += ' adv-focus-title'; title.tabIndex = -1; }
    scope.append(title); row.append(scope, button(text('home'), home, 'adv-button adv-button-quiet', 'adv-home')); container.append(row);
  }
  function renderRanks(container) {
    const section = make('section', 'adv-ranks'), ranks = store.readRanks(grade);
    section.append(make('span', 'adv-eyebrow', text('local')), make('h2', '', `${text('ranks')} · ${text('grade')}${grade}`));
    if (!ranks.length) section.append(make('p', 'adv-muted', text('noRanks')));
    else {
      const list = make('ol', 'adv-rank-list');
      ranks.forEach((record, index) => {
        const item = make('li', 'adv-rank-row');
        const ordinal = record.rank ?? index + 1;
        item.append(make('span', 'adv-rank-number', `#${ordinal}`));
        const name = make('div', 'adv-rank-name'); name.append(make('strong', '', `${text('wizard')} ${String(record.serial ?? record.id ?? index + 1).padStart(3, '0')}`), make('small', '', `${record.correct ?? Math.floor((record.score || 0) / 1000)} / 5 ${text('correct')}`));
        const value = make('div', 'adv-rank-value'); value.append(make('strong', '', `${record.score ?? 0}`), make('small', '', `${text('points')} · ${formatTime(record.elapsedMs ?? 0)}`));
        item.append(name, value); list.append(item);
      }); section.append(list);
    }
    section.append(make('p', 'adv-small', text('scoreRule'))); container.append(section);
  }
  function renderHub(container) {
    const earned = store.readProgress(grade), hero = make('section', 'adv-hero'), narrative = make('div', 'adv-hero-copy');
    narrative.append(make('span', 'adv-eyebrow', text('story')), make('h2', '', text('forest')), make('p', '', text('intro')), make('p', 'adv-small', text('friendly')));
    const scene = make('div', 'adv-forest-scene'); scene.setAttribute('aria-hidden', 'true');
    scene.append(make('span', 'adv-scene-moon', '✦'), make('span', 'adv-scene-tree adv-scene-tree-a', '♧'), make('span', 'adv-scene-tree adv-scene-tree-b', '♧'), make('span', 'adv-scene-tree adv-scene-tree-c', '♧'), make('span', 'adv-scene-bird', '✧'), make('span', 'adv-scene-trail'), make('span', 'adv-scene-wizard', '♙'), make('span', 'adv-scene-label', '01 / 08'));
    hero.append(narrative, scene); container.append(hero);
    stageMap(container, -1, earned);
    const modes = make('div', 'adv-mode-grid'), practice = make('section', 'adv-mode-card'), ranked = make('section', 'adv-mode-card adv-ranked-card');
    practice.append(make('span', 'adv-mode-symbol', '⌂'), make('h2', '', text('practiceTitle')), make('p', '', text('practiceInfo')), make('p', 'adv-checkpoint', `${text('savedProgress')} ${earned} / 5`));
    practice.append(button(text(earned === 5 ? 'replay' : earned > 0 ? 'resume' : 'practice'), () => begin('practice'), 'adv-button adv-button-primary', 'adv-practice'));
    if (earned > 0) practice.append(button(text('fresh'), () => begin('practice', true), 'adv-button adv-button-quiet', 'adv-new-practice'));
    practice.append(make('p', 'adv-small', text('freshInfo')));
    ranked.append(make('span', 'adv-mode-symbol', '◷'), make('h2', '', text('rankedTitle')), make('p', '', text('rankedInfo')), make('p', 'adv-small', text('scoreRule')), button(text('ranked'), () => begin('ranked'), 'adv-button adv-button-gold', 'adv-ranked'));
    modes.append(practice, ranked); container.append(modes, make('p', 'adv-storage-note', storageNote()));
    const chapters = make('section', 'adv-chapters'); chapters.append(make('h2', '', text('routeTitle')), make('p', 'adv-muted', text('routeInfo')));
    const cards = make('div', 'adv-chapter-grid');
    ADVENTURE_CAMPAIGNS.forEach((campaign, index) => {
      const item = make('article', 'adv-chapter' + (campaign.id === 'forest' ? ' adv-chapter-ready' : ''));
      const title = typeof campaign.title === 'object' ? campaign.title[language] : campaign.title;
      const icon = make('span', 'adv-chapter-icon', campaign.icon); icon.setAttribute('aria-hidden', 'true');
      item.append(icon, make('small', '', `${String(index + 1).padStart(2, '0')} / 08`), make('h3', '', title), make('p', '', text(campaign.id === 'forest' ? 'available' : 'planned'))); cards.append(item);
    }); chapters.append(cards, make('p', 'adv-small', text('routesLater'))); container.append(chapters); renderRanks(container);
  }
  function optionLabel(stage, id) { return stage.options.find(option => option.id === id)?.label ?? id; }
  function renderRoute(card, stage, result) {
    const distances = make('section', 'adv-route-map'); distances.append(make('h3', '', text('pathMap')));
    const edges = Array.isArray(stage.edges) ? stage.edges : Object.entries(stage.edges || {}).map(([key, value]) => ({ key, value }));
    const list = make('ul', 'adv-edge-list');
    edges.forEach(edge => {
      const from = edge.from ?? edge.a, to = edge.to ?? edge.b, value = edge.distance ?? edge.cost ?? edge.weight ?? edge.value;
      const label = id => id === stage.start ? text('routeStart') : id === stage.end ? text('routeEnd') : optionLabel(stage, id);
      list.append(make('li', '', edge.key ? `${edge.key}: ${value}` : `${label(from)} ↔ ${label(to)} · ${value}`));
    }); distances.append(list); card.append(distances);
    const trail = make('ol', 'adv-route-sequence'); trail.setAttribute('aria-label', text('route'));
    trail.append(make('li', 'adv-route-endpoint', text('routeStart')));
    for (let index = 0; index < stage.options.length; index++) trail.append(make('li', result.selection[index] ? 'adv-route-filled' : 'adv-route-empty', result.selection[index] ? optionLabel(stage, result.selection[index]) : `${index + 1} · ?`));
    trail.append(make('li', 'adv-route-endpoint', text('finishPath'))); card.append(trail);
    const distance = routeDistance(stage, result.selection);
    const budget = stage.budget ?? stage.target;
    card.append(make('p', 'adv-route-total', `${text('distance')}: ${Number.isFinite(distance) ? distance : '—'} ${text('unit')} · ${text('budget')}: ${budget} ${text('unit')}`));
  }
  function renderRun(container) {
    const stage = currentStage(), result = currentResult(), submitted = result.submitted && (result.correct || run.mode === 'ranked');
    const statusbar = make('div', 'adv-run-status');
    statusbar.append(make('span', 'adv-mode-pill', text(run.mode === 'ranked' ? 'rankedMode' : 'practiceMode')), make('span', 'adv-stage-count', `${text('stage')} ${run.index + 1} / 5`));
    if (run.mode === 'ranked') {
      const clock = make('div', 'adv-clock'); clock.append(make('span', '', text('time')));
      const timer = make('strong', '', formatTime(Math.min(LIMIT_MS, run.deadline - clockNow()))); timer.id = 'adv-timer'; timer.setAttribute('role', 'timer'); timer.setAttribute('aria-live', 'off'); clock.append(timer); statusbar.append(clock);
    }
    container.append(statusbar); stageMap(container, run.index, run.results.map(result => result.correct), run.results);
    const card = make('section', 'adv-stage-card' + (run.index === 4 ? ' adv-boss-card' : ''));
    card.append(make('span', 'adv-eyebrow', `${text('stage')} ${run.index + 1} / 5 · ${copy().mapNames[run.index]}`));
    const heading = make('h2', 'adv-focus-title', stage.title); heading.tabIndex = -1; card.append(heading, make('p', 'adv-stage-prompt', stage.prompt));
    card.append(make('p', 'adv-instruction', text(stage.kind === 'sum' ? 'promptSum' : stage.kind === 'route' ? 'promptRoute' : 'promptChoice')));
    if (stage.kind === 'route') renderRoute(card, stage, result);
    const options = make('div', 'adv-options' + (stage.kind === 'sum' ? ' adv-stone-options' : stage.kind === 'route' ? ' adv-waypoint-options' : ''));
    stage.options.forEach(option => {
      const selected = result.selection.includes(option.id), item = button(option.label, () => select(option.id), 'adv-option' + (selected ? ' adv-option-selected' : ''), `adv-option-${option.id}`);
      item.dataset.advOption = option.id; item.setAttribute('aria-pressed', String(selected)); item.disabled = submitted;
      if (stage.kind === 'route' && selected) item.setAttribute('aria-disabled', 'true');
      if (stage.kind === 'route' && selected) item.append(make('span', 'adv-order-tag', result.selection.indexOf(option.id) + 1));
      options.append(item);
    }); card.append(options);
    if (stage.kind === 'sum') {
      const sum = result.selection.reduce((total, id) => total + Number(stage.options.find(option => option.id === id)?.value ?? 0), 0);
      const bridge = make('div', 'adv-bridge'); bridge.setAttribute('aria-hidden', 'true');
      result.selection.forEach(id => bridge.append(make('span', 'adv-bridge-stone', optionLabel(stage, id))));
      if (!result.selection.length) bridge.append(make('span', 'adv-bridge-gap', '· · ·'));
      card.append(bridge, make('p', 'adv-selection-total', `${text('sum')}: ${sum} · ${text('target')}: ${stage.target}`));
    } else if (stage.kind === 'choice') card.append(make('p', 'adv-selection-summary', `${text('selection')}: ${result.selection.length ? optionLabel(stage, result.selection[0]) : text('emptySelection')}`));
    const message = make('p', 'adv-feedback' + (result.correct ? ' adv-feedback-success' : ''), feedback ? text(feedback) : ''); message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite'); card.append(message);
    if (result.hinted) { const hintBox = make('p', 'adv-hint-box', stage.hint); hintBox.id = 'adv-hint-content'; card.append(hintBox); }
    const actions = make('div', 'adv-stage-actions');
    if (submitted) actions.append(button(text(run.index === 4 ? run.mode === 'ranked' ? 'finishRanked' : 'finish' : 'next'), next, 'adv-button adv-button-primary', 'adv-next'));
    else {
      const check = button(text('submit'), submit, 'adv-button adv-button-primary', 'adv-submit'); actions.append(check);
      if (stage.kind !== 'choice') { const undoButton = button(text('undo'), undo, 'adv-button adv-button-quiet', 'adv-undo'); undoButton.disabled = !result.selection.length; actions.append(undoButton); }
      if (run.mode === 'practice') { const help = button(text(result.hinted ? 'hintShown' : 'hint'), hint, 'adv-button adv-button-quiet', 'adv-hint'); help.setAttribute('aria-expanded', String(result.hinted)); help.setAttribute('aria-controls', 'adv-hint-content'); actions.append(help); }
    }
    card.append(actions); container.append(card);
    if (run.mode === 'practice') container.append(make('p', 'adv-storage-note', storageNote()));
    container.append(button(text(run.mode === 'ranked' ? 'cancelRanked' : 'cancel'), cancel, 'adv-button adv-button-quiet adv-cancel', 'adv-cancel'));
  }
  function renderComplete(container) {
    const result = adventureScore(run), correct = run.results.filter(item => item.correct).length;
    const card = make('section', 'adv-complete'); card.append(make('span', 'adv-complete-badge', run.mode === 'practice' ? '♧' : '✦'));
    const heading = make('h2', 'adv-focus-title', text(run.expired ? 'timeout' : run.mode === 'practice' ? 'complete' : 'rankedComplete')); heading.tabIndex = -1;
    card.append(heading, make('p', '', text(run.expired ? 'timeoutInfo' : run.mode === 'practice' ? 'practiceComplete' : 'rankedCompleteInfo')));
    const stats = make('div', 'adv-result-stats');
    const metric = (value, label) => { const box = make('div'); box.append(make('strong', '', value), make('span', '', label)); return box; };
    stats.append(metric(`${correct} / 5`, text('correct')));
    if (run.mode === 'ranked') {
      stats.append(metric(typeof result === 'number' ? result : result.score ?? correct * 1000, text('points')), metric(formatTime(run.elapsedMs ?? 0), text('elapsed')));
      card.append(stats, make('p', 'adv-save-result', text(rankEntry ? store.status() === 'saved' ? 'rankedSaved' : 'memoryRank' : 'rankNotSaved')), make('p', 'adv-small', text('local')));
    } else {
      stats.append(metric(run.results.filter(item => item.hinted).length, text('hintCount'))); card.append(stats, make('p', 'adv-save-result', text('practiceNoRank')));
    }
    card.append(make('p', 'adv-storage-note', storageNote()));
    const actions = make('div', 'adv-stage-actions'); actions.append(button(text('again'), () => begin(run.mode, true), 'adv-button adv-button-primary', 'adv-again'), button(text('backMap'), cancel, 'adv-button adv-button-quiet', 'adv-back-map')); card.append(actions); container.append(card);
    if (run.mode === 'ranked') renderRanks(container);
  }
  function render({ focusId, heading = false } = {}) {
    if (!active) return false;
    const container = make('div', 'adventure-app'); container.setAttribute('lang', language); top(container);
    if (view === 'hub') renderHub(container); else if (view === 'complete') renderComplete(container); else renderRun(container);
    panel.replaceChildren(container); preserveFocus(focusId, heading); return true;
  }
  function setLanguage(nextLanguage) {
    if (!['th', 'en'].includes(nextLanguage)) return false;
    language = nextLanguage;
    if (active && run && view === 'run' && !checkTime()) return true;
    if (active) render(); return true;
  }
  document.addEventListener?.('visibilitychange', () => { if (active && run?.mode === 'ranked' && view === 'run') updateTimer(); });
  return {
    start, setLanguage, deactivate,
    getState: () => ({ active, view, grade, language, run: run ? JSON.parse(JSON.stringify(run)) : null, progress: store.readProgress(grade), ranks: store.readRanks(grade) }),
    actions: { practice: () => begin('practice'), resume: () => begin('practice'), startFresh: () => begin('practice', true), ranked: () => begin('ranked'), select, undo, submit, hint, next, cancel, home, tick: updateTimer },
  };
}
