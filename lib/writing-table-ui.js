import { WRITING_OPERATIONS, WRITING_GRADE_PRESETS, createWritingTable } from './writing-tables.js';
import { mountHandwritingCanvas } from './handwriting.js';
import { getLanguage } from './i18n.js';
import { trackGameComplete } from './analytics.js';

const element = (tag, className = '', text = '') => {
  const item = document.createElement(tag); item.className = className;
  if (text) item.textContent = text;
  return item;
};

/** Each table keeps its ink during this session. Completion means tracing, not a maths assessment. */
export function createWritingTableController(panel, { onHome, getColor = () => '#245f44', isSmooth = () => true, playEffect = () => {} } = {}) {
  const sound = (name, options) => { try { playEffect(name, options); } catch {} };
  let active = false, grade = 1, language = getLanguage(), operation = 'addition', base = 2;
  let control = null, table = null, book = null, refs = {}, lastStatus = null;
  const books = new Map(), gradeChoices = new Map();
  const tr = (th, en) => language === 'en' ? en : th;
  const button = (text, action, className = 'button outline compact') => {
    const item = element('button', className, text); item.type = 'button';
    item.addEventListener('click', action); return item;
  };
  const dispose = () => { control?.cleanup(); control = null; lastStatus = null; };
  function chooseBook() {
    table = createWritingTable({ operation, base, language });
    const key = `${grade}:${operation}:${base}`;
    if (!books.has(key)) books.set(key, {
      index: 0, announced: false,
      rows: table.rows.map(() => ({ strokes: [], completed: false })),
    });
    book = books.get(key); gradeChoices.set(grade, { operation, base });
  }
  function completedCount() { return book?.rows.filter(row => row.completed).length || 0; }
  function updateProgress() {
    if (!active || !book) return;
    const count = completedCount(), total = book.rows.length;
    refs.progress.textContent = tr(`ฝึกครบ ${count} / ${total} บรรทัด`, `${count} / ${total} rows traced`);
    refs.track.setAttribute('aria-valuenow', String(count));
    refs.fill.style.width = `${count / total * 100}%`;
    refs.rows.forEach((item, index) => {
      const done = book.rows[index].completed;
      item.className = 'writing-tables-row' + (done ? ' completed' : '');
      item.setAttribute('aria-current', index === book.index ? 'step' : 'false');
      item.setAttribute('aria-label', `${tr('บรรทัด', 'Row')} ${index + 1}: ${table.rows[index].label}${done ? tr(' · ฝึกครบแล้ว', ' · traced') : ''}`);
      refs.rowMarks[index].textContent = done ? '✓' : String(index + 1);
    });
  }
  function updateStatus(status) {
    if (!active || !book) return;
    lastStatus = status;
    if (['draw', 'stroke', 'clear', 'undo'].includes(status.change)) book.rows[book.index].completed = false;
    const done = book.rows[book.index].completed;
    refs.confirm.disabled = !status.ready || done;
    refs.undo.disabled = !status.hasDrawing;
    refs.clear.disabled = !status.hasDrawing;
    refs.status.textContent = done
      ? tr('บรรทัดนี้ฝึกครบแล้ว เลือกบรรทัดอื่นมาลองต่อได้', 'This row is complete. Choose another row to practise.')
      : status.available === false
        ? tr('เปิดพื้นที่เขียนไม่ได้ ลองเปิดหน้านี้ในเบราว์เซอร์ที่รองรับการวาด', 'The writing area is unavailable. Try a browser that supports drawing.')
        : status.ready
          ? tr('ลากครบทุกตัวแล้ว! กดยืนยันบรรทัดนี้ได้เลย', 'Every symbol is traced! Confirm this row when you are ready.')
          : tr('เริ่มที่จุดสีชมพู ลากทั้งตัวเลขและเครื่องหมายให้ครบ แล้วค่อยยกนิ้ว', 'Start at the pink dots. Trace every number and sign, then lift your finger.');
    // Only announce finished gestures, never every pointer movement.
    if (status.change !== 'draw') refs.live.textContent = refs.status.textContent;
    const progress = status.traceProgress || [];
    refs.symbols.forEach((symbol, index) => symbol.className = 'writing-tables-symbol' + (progress[index] >= .8 ? ' traced' : ''));
    updateProgress();
  }
  function selectRow(index) {
    if (!active || !book || !Number.isInteger(index) || index < 0 || index >= book.rows.length) return false;
    book.index = index; render(); refs.heading?.focus(); return true;
  }
  function confirm() {
    if (!active || !book || book.rows[book.index].completed || !control?.isReady()) return false;
    book.rows[book.index].completed = true;
    if (completedCount() === book.rows.length) {
      if (!book.announced) { trackGameComplete('writing-tables'); book.announced = true; sound('complete', { celebrate: true }); }
      else sound('success');
      render(); refs.heading?.focus();
    } else {
      sound('success');
      const next = book.rows.findIndex((row, index) => index > book.index && !row.completed);
      book.index = next === -1 ? book.rows.findIndex(row => !row.completed) : next;
      render(); refs.heading?.focus();
    }
    return true;
  }
  function changeOperation(next) {
    const metadata = WRITING_OPERATIONS.find(item => item.id === next);
    if (!active || !metadata) return false;
    operation = next; base = Math.max(metadata.minBase, Math.min(metadata.maxBase, base));
    render(); return true;
  }
  function changeBase(next) {
    const number = Number(next), metadata = WRITING_OPERATIONS.find(item => item.id === operation);
    if (!active || !Number.isInteger(number) || number < metadata.minBase || number > metadata.maxBase) return false;
    base = number; render(); return true;
  }
  function restart() {
    if (!active || !book) return false;
    books.delete(`${grade}:${operation}:${base}`); render(); refs.heading?.focus(); return true;
  }
  function render() {
    if (!active) return;
    dispose(); chooseBook(); refs = { rows: [], rowMarks: [], symbols: [] };
    panel.replaceChildren();
    const top = element('div', 'view-top'), title = element('div');
    title.append(element('span', 'eyebrow', tr(`ป.${grade} · เขียนตามเส้นประ`, `Grade ${grade} · Dotted-line tracing`)));
    const heading = element('h1', '', tr('สมุดเขียนตารางคณิต', 'Math tracing notebook'));
    heading.id = 'writing-tables-heading'; heading.tabIndex = -1;
    title.append(heading); top.append(title, button(tr('กลับไปเลือกเกม', 'Back to games'), onHome)); panel.append(top);
    panel.append(element('p', 'writing-tables-intro', tr('เลือกตาราง อ่านไปด้วย แล้วค่อย ๆ เขียนตามรอยทีละบรรทัด', 'Choose a table, read it aloud, and trace one row at a time.')));
    const modes = element('div', 'writing-tables-modes'); modes.setAttribute('role', 'group');
    modes.setAttribute('aria-label', tr('เลือกโหมดเขียน', 'Choose a tracing mode'));
    WRITING_OPERATIONS.forEach(item => {
      const option = button('', () => changeOperation(item.id), 'writing-tables-mode');
      option.dataset.writingOperation = item.id; option.setAttribute('aria-pressed', String(operation === item.id));
      const sign = element('span', 'writing-tables-mode-symbol', item.symbol); sign.setAttribute('aria-hidden', 'true');
      option.append(sign, element('span', '', item.label[language])); modes.append(option);
    }); panel.append(modes);
    const settings = element('div', 'writing-tables-settings'), label = element('label', 'writing-tables-base');
    const baseName = operation === 'fractions' ? tr('ตัวส่วน', 'Denominator') : operation === 'multiplication' ? tr('แม่สูตรคูณ', 'Times table') : operation === 'division' ? tr('หารด้วย', 'Divide by') : operation === 'subtraction' ? tr('จำนวนที่ลบ', 'Subtract') : tr('จำนวนตั้งต้น', 'Starting number');
    label.textContent = baseName; label.setAttribute('for', 'writing-tables-base');
    const select = element('select'); select.id = 'writing-tables-base';
    const metadata = WRITING_OPERATIONS.find(item => item.id === operation);
    for (let value = metadata.minBase; value <= metadata.maxBase; value++) {
      const option = element('option', '', String(value)); option.value = String(value); select.append(option);
    }
    select.value = String(base); select.addEventListener('change', event => changeBase(event.currentTarget.value));
    label.append(select); refs.progress = element('span', 'writing-tables-count');
    settings.append(label, refs.progress); panel.append(settings);
    refs.track = element('div', 'workshop-progress-track'); refs.track.setAttribute('role', 'progressbar');
    refs.track.setAttribute('aria-label', tr('จำนวนบรรทัดที่ลากครบ', 'Rows fully traced'));
    refs.track.setAttribute('aria-valuemin', '0'); refs.track.setAttribute('aria-valuemax', String(book.rows.length));
    refs.fill = element('span'); refs.track.append(refs.fill); panel.append(refs.track);
    if (completedCount() === book.rows.length) {
      const done = element('section', 'writing-tables-done');
      done.append(element('h2', '', tr('เขียนครบตารางแล้ว!', 'You traced the whole table!')),
        element('p', '', tr('ลองอ่านแต่ละบรรทัด แล้วเล่าให้ฟังว่าเห็นแบบรูปอะไรบ้าง', 'Read the rows aloud. What patterns can you explain?')),
        button(tr('ฝึกตารางนี้อีกรอบ', 'Practise this table again'), restart, 'button primary compact'));
      panel.append(done);
    }
    const layout = element('div', 'writing-tables-layout'), sheet = element('section', 'writing-tables-sheet');
    const row = table.rows[book.index];
    sheet.append(element('p', 'tiny-label', `${table.title} · ${tr('บรรทัด', 'Row')} ${book.index + 1} / ${table.rows.length}`));
    refs.heading = element('h2', 'writing-tables-equation'); refs.heading.id = 'writing-table-row-heading'; refs.heading.tabIndex = -1;
    for (const symbol of row.target.replace(/\s/g, '')) {
      const span = element('span', 'writing-tables-symbol', symbol); span.setAttribute('aria-hidden', 'true');
      refs.symbols.push(span); refs.heading.append(span);
    }
    refs.heading.setAttribute('aria-label', row.label); sheet.append(refs.heading);
    const explanation = element('p', 'writing-tables-meaning', row.label); sheet.append(explanation);
    if (row.visual?.kind === 'fraction-bar') {
      const picture = element('div', 'writing-tables-fraction'); picture.style.gridTemplateColumns = `repeat(${row.visual.parts}, minmax(0, 1fr))`;
      picture.setAttribute('role', 'img'); picture.setAttribute('aria-label', row.label);
      for (let part = 0; part < row.visual.parts; part++) {
        const cell = element('span', part < row.visual.filled ? 'filled' : ''); cell.setAttribute('aria-hidden', 'true'); picture.append(cell);
      }
      sheet.append(picture);
    }
    const canvas = element('canvas', 'handwriting-game-canvas writing-tables-canvas'); canvas.id = 'writing-table-canvas';
    canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', tr('พื้นที่เขียนตามรอย ', 'Trace ') + row.label);
    canvas.tabIndex = 0; sheet.append(canvas);
    const tools = element('div', 'writing-tools');
    refs.undo = button(tr('ย้อนเส้น', 'Undo stroke'), () => control?.undo(), ''); refs.undo.id = 'writing-table-undo';
    refs.clear = button(tr('ล้างบรรทัดนี้', 'Clear this row'), () => control?.clear(), ''); refs.clear.id = 'writing-table-clear';
    tools.append(refs.undo, refs.clear); sheet.append(tools);
    refs.status = element('p', 'feedback writing-tables-status'); refs.status.id = 'writing-table-status'; sheet.append(refs.status);
    refs.live = element('p', 'writing-tables-live'); refs.live.setAttribute('role', 'status'); refs.live.setAttribute('aria-live', 'polite'); refs.live.setAttribute('aria-atomic', 'true'); sheet.append(refs.live);
    refs.confirm = button(tr('ลากครบแล้ว ไปบรรทัดถัดไป →', 'Confirm tracing and continue →'), confirm, 'button primary');
    refs.confirm.id = 'writing-table-confirm'; refs.confirm.disabled = true; sheet.append(refs.confirm);
    sheet.append(element('p', 'fine writing-tables-note', tr('นับความคืบหน้าจากการลากครบเส้นประ ไม่จับเวลา และกลับมาฝึกบรรทัดเดิมได้', 'Progress records complete tracing. There is no timer, and you can revisit any row.')));
    layout.append(sheet);
    const map = element('aside', 'writing-tables-map'); map.setAttribute('aria-label', tr('ตารางทั้งหมด', 'All table rows'));
    map.append(element('h2', '', tr('เลือกบรรทัดฝึก', 'Choose a row')));
    const rows = element('div', 'writing-tables-rows');
    table.rows.forEach((entry, index) => {
      const item = button('', () => selectRow(index), 'writing-tables-row'); item.dataset.writingRow = String(index);
      const number = element('span', 'writing-tables-row-number', String(index + 1)); number.setAttribute('aria-hidden', 'true');
      item.append(number, element('span', 'writing-tables-row-target', entry.target)); refs.rows.push(item); refs.rowMarks.push(number); rows.append(item);
    }); map.append(rows); layout.append(map); panel.append(layout);
    control = mountHandwritingCanvas(canvas, {
      activity: { kind: 'trace', target: row.target, traceEquation: true },
      strokes: book.rows[book.index].strokes, requireGesture: true,
      smooth: isSmooth, color: getColor, onChange: updateStatus,
    });
    updateStatus(control.status());
  }
  function start(nextGrade = 1) {
    const preset = WRITING_GRADE_PRESETS.find(item => item.grade === nextGrade);
    if (!preset) return false;
    grade = nextGrade; language = getLanguage();
    const selection = gradeChoices.get(grade) || preset; operation = selection.operation; base = selection.base;
    active = true; render(); panel.querySelector?.('h1')?.focus(); return true;
  }
  return {
    start,
    deactivate() { active = false; dispose(); },
    setLanguage(next) { if (!['th', 'en'].includes(next)) return false; language = next; if (active) render(); return true; },
    refreshTools() { if (active) control?.redraw(); },
    state: () => book ? {
      active, grade, operation, base, rowIndex: book.index, completedCount: completedCount(), ready: Boolean(lastStatus?.ready),
      rows: table.rows.map((row, index) => ({ target: row.target, completed: book.rows[index].completed, strokeCount: book.rows[index].strokes.length })),
    } : null,
    actions: { changeOperation, changeBase, selectRow, confirm, restart },
  };
}
