/* Native, screen-reader-labelled number models. No assets or animation loop. */
const SVG_NS = 'http://www.w3.org/2000/svg';
const sceneCache = new WeakMap();

const el = (tag, className = '', text = '') => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== '') node.textContent = String(text);
  return node;
};
const svgEl = (tag, attributes = {}) => {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  return node;
};
const t = (language, thai, english) => language === 'en' ? english : thai;
const count = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const limit = (value, min, max) => Math.min(max, Math.max(min, count(value)));

function action(text, className, label, handler) {
  const node = el('button', className, text);
  node.type = 'button';
  node.setAttribute('aria-label', label);
  node.addEventListener('click', handler);
  return node;
}

function metric(value, label, tone = '') {
  const node = el('div', `sim-visual-metric ${tone}`);
  node.append(el('strong', '', value), el('span', '', label));
  return node;
}

function note(text) { return el('p', 'sim-visual-note', text); }

function lightCell(index, filled, tone, label, handler) {
  const cell = handler
    ? action('', 'sim-light-cell', label, handler)
    : el('span', 'sim-light-cell');
  cell.setAttribute('data-filled', String(filled));
  cell.setAttribute('data-tone', tone);
  if (!handler) cell.setAttribute('aria-hidden', 'true');
  const orb = el('span', 'sim-light-orb');
  orb.append(el('span', 'sim-light-spark', filled ? String(index + 1) : ''));
  cell.append(orb);
  return cell;
}

function frame(title, amount, options = {}) {
  const { language, original = 0, interactive = false, onTap, capacity = 10 } = options;
  const box = el('div', 'sim-ten-frame-wrap');
  const heading = el('div', 'sim-model-label');
  heading.append(el('span', '', title), el('strong', '', amount));
  const grid = el('div', 'sim-ten-frame');
  grid.setAttribute('aria-label', `${title} ${amount}`);
  for (let index = 0; index < capacity; index++) {
    const filled = index < amount;
    const tone = index < original ? 'gold' : 'violet';
    const handler = interactive && index >= original
      ? () => onTap(filled ? 'decrement' : 'increment', 'b') : null;
    const label = t(language, filled ? 'นำดวงไฟที่เพิ่มออก 1 ดวง' : 'เพิ่มดวงไฟ 1 ดวง', filled ? 'Remove one added light' : 'Add one light');
    grid.append(lightCell(index, filled, tone, label, handler));
  }
  box.append(heading, grid);
  return box;
}

function addition(scene, state, language, onTap) {
  const a = limit(state.a, 1, 10), b = limit(state.b, 0, 10), sum = a + b;
  const joined = Boolean(state.phase);
  const bench = el('div', 'sim-addition-bench');
  if (!joined) {
    bench.append(
      frame(t(language, 'มีอยู่เดิม', 'Start with'), a, { language, original: a }),
      el('span', 'sim-model-operator', '+'),
      frame(t(language, 'เพิ่มเข้ามา', 'Add more'), b, { language, interactive: true, onTap }),
    );
  } else {
    const first = Math.min(sum, 10), second = Math.max(0, sum - 10);
    bench.append(
      frame(sum >= 10 ? t(language, 'จัดให้เต็มสิบ', 'Make a ten') : t(language, 'รวมในกรอบแรก', 'Combined first frame'), first, { language, original: a, interactive: true, onTap }),
      el('span', 'sim-model-operator', '+'),
      frame(t(language, 'ดวงไฟที่เหลือ', 'Lights left over'), second, { language, original: 0, interactive: true, onTap }),
    );
  }
  scene.append(bench);
  const result = el('div', 'sim-visual-summary');
  result.append(metric(sum, t(language, 'ดวงไฟทั้งหมด', 'lights altogether')));
  if (joined) result.append(note(t(language, `${a} + ${b} = ${Math.min(10, sum)} + ${Math.max(0, sum - 10)}`, `${a} + ${b} = ${Math.min(10, sum)} + ${Math.max(0, sum - 10)}`)));
  else result.append(note(t(language, 'แตะช่องว่างเพื่อเพิ่มดวงไฟ หรือแตะดวงไฟสีม่วงเพื่อลด', 'Tap an empty cell to add a light. Tap a violet light to take one away.')));
  scene.append(result);
}

function subtraction(scene, state, language, onTap) {
  const a = limit(state.a, 1, 20), b = limit(state.b, 0, a), remaining = a - b;
  const top = el('div', 'sim-visual-summary sim-subtraction-counts');
  top.append(metric(remaining, t(language, 'ยังอยู่', 'remaining')), metric(b, t(language, 'นำออกแล้ว', 'taken away'), 'is-muted'));
  const tray = el('div', 'sim-subtraction-tray');
  tray.setAttribute('aria-label', t(language, `ดวงไฟ ${a} ดวง นำออก ${b} ดวง เหลือ ${remaining} ดวง`, `${a} lights, ${b} taken away, ${remaining} remaining`));
  for (let i = 0; i < a; i++) {
    const removed = i >= remaining;
    const label = removed
      ? t(language, 'คืนดวงไฟ 1 ดวง', 'Bring back one light')
      : t(language, 'นำดวงไฟออก 1 ดวง', 'Take away one light');
    const token = action('', `sim-subtract-token${removed ? ' is-removed' : ''}`, label, () => onTap(removed ? 'decrement' : 'increment', 'b'));
    token.setAttribute('aria-pressed', String(removed));
    token.append(el('span', 'sim-light-orb', i + 1), el('span', 'sim-token-cross', '×'));
    tray.append(token);
  }
  scene.append(top, tray, note(t(language, 'แตะดวงไฟเพื่อนำออก · แตะช่องที่ขีดทับเพื่อคืนกลับ', 'Tap a light to take it away. Tap a crossed-out light to bring it back.')));
}

function multiplication(scene, state, language) {
  const a = limit(state.a, 1, 6), b = limit(state.b, 1, 8);
  const flipped = Boolean(state.phase), rows = flipped ? b : a, columns = flipped ? a : b;
  const header = el('div', 'sim-array-readout');
  const rowReadout = el('strong', '', t(language, `${rows} กลุ่ม`, `${rows} groups`));
  const columnReadout = el('strong', '', t(language, `กลุ่มละ ${columns}`, `${columns} in each`));
  header.append(rowReadout, el('span', '', '×'), columnReadout);
  const wrapper = el('div', 'sim-array-stage');
  const grid = el('div', 'sim-dot-array');
  grid.setAttribute('style', `--sim-cols:${columns};--sim-rows:${rows}`);
  grid.setAttribute('role', 'img');
  grid.setAttribute('aria-label', t(language, `${rows} แถว แถวละ ${columns} ดวง รวม ${a * b} ดวง`, `${rows} rows of ${columns} lights, ${a * b} lights in total`));
  const tokens = [];
  for (let index = 0; index < a * b; index++) {
    const originalRow = Math.floor(index / b), originalColumn = index % b;
    const row = flipped ? originalColumn : originalRow;
    const col = flipped ? originalRow : originalColumn;
    const token = el('span', 'sim-array-token');
    token.setAttribute('style', `--sim-x:${col};--sim-y:${row};--sim-token-hue:${originalRow % 3}`);
    token.setAttribute('aria-hidden', 'true');
    token.append(el('span', '', ''));
    grid.append(token);
    tokens.push(token);
  }
  const side = el('div', 'sim-array-row-labels');
  for (let i = 0; i < rows; i++) side.append(el('span', '', `${i + 1}`));
  side.setAttribute('aria-hidden', 'true');
  wrapper.append(side, grid);
  scene.append(header, wrapper, metric(a * b, t(language, 'ดวงไฟทั้งหมด', 'lights altogether')), note(t(language, 'สลับแถวกับหลัก แล้วสังเกตว่าจำนวนทั้งหมดยังเท่าเดิม', 'Swap rows and columns and notice that the total stays the same.')));
  // Keep each light in the DOM when transposing so its movement has meaning.
  return nextState => {
    const transpose = Boolean(nextState.phase), nextRows = transpose ? b : a, nextColumns = transpose ? a : b;
    rowReadout.textContent = t(language, `${nextRows} กลุ่ม`, `${nextRows} groups`);
    columnReadout.textContent = t(language, `กลุ่มละ ${nextColumns}`, `${nextColumns} in each`);
    grid.setAttribute('style', `--sim-cols:${nextColumns};--sim-rows:${nextRows}`);
    grid.setAttribute('aria-label', t(language, `${nextRows} แถว แถวละ ${nextColumns} ดวง รวม ${a * b} ดวง`, `${nextRows} rows of ${nextColumns} lights, ${a * b} lights in total`));
    tokens.forEach((token, index) => {
      const row = Math.floor(index / b), column = index % b;
      token.setAttribute('style', `--sim-x:${transpose ? row : column};--sim-y:${transpose ? column : row};--sim-token-hue:${row % 3}`);
    });
    side.replaceChildren();
    for (let i = 0; i < nextRows; i++) side.append(el('span', '', `${i + 1}`));
  };
}

function division(scene, state, language, onTap) {
  const a = limit(state.a, 1, 24), b = limit(state.b, 2, 6), dealt = limit(state.c, 0, a);
  const quotient = Math.floor(a / b), shared = Math.min(dealt, quotient * b);
  const remainder = Math.max(0, dealt - quotient * b), pending = a - dealt;
  const depot = el('div', 'sim-division-depot');
  const dispenser = action('', 'sim-dispenser', t(language, 'แจกดวงไฟถัดไป 1 ดวง', 'Deal the next light'), () => onTap('advance'));
  dispenser.disabled = pending === 0;
  const emblem = el('span', 'sim-dispenser-emblem', '÷');
  emblem.setAttribute('aria-hidden', 'true');
  dispenser.append(emblem, el('span', 'sim-dispenser-count', String(pending)), el('span', 'sim-dispenser-label', t(language, pending ? 'แตะเพื่อแจก 1 ดวง' : 'แจกครบแล้ว', pending ? 'Tap to deal one light' : 'All lights dealt')));
  const remainderBox = el('div', 'sim-remainder');
  remainderBox.append(el('span', 'sim-model-label', t(language, 'ถาดเศษ', 'Remainder tray')), el('strong', '', remainder));
  const remainderDots = el('span', 'sim-mini-lights');
  for (let i = 0; i < remainder; i++) remainderDots.append(el('span', 'sim-mini-light'));
  remainderDots.setAttribute('aria-hidden', 'true');
  remainderBox.append(remainderDots);
  depot.append(dispenser, remainderBox);
  const bowls = el('div', 'sim-sharing-bowls');
  for (let i = 0; i < b; i++) {
    const amount = Math.floor(shared / b) + (i < shared % b ? 1 : 0);
    const bowl = el('div', 'sim-sharing-bowl');
    const lights = el('div', 'sim-bowl-lights');
    lights.setAttribute('aria-hidden', 'true');
    for (let j = 0; j < amount; j++) lights.append(el('span', 'sim-mini-light'));
    bowl.append(el('span', 'sim-bowl-number', t(language, `กลุ่ม ${i + 1}`, `Group ${i + 1}`)), lights, el('strong', '', amount));
    bowls.append(bowl);
  }
  scene.append(depot, bowls, note(t(language, `แจกให้ ${b} กลุ่มเท่า ๆ กัน เมื่อครบทุกกลุ่มแล้ว ดวงไฟที่แบ่งต่อไม่ได้จะอยู่ในถาดเศษ`, `Share equally among ${b} groups. After complete equal rounds, leftover lights go in the remainder tray.`)));
}

function fractionPie(a, b, refined, language) {
  const svg = svgEl('svg', { viewBox: '0 0 240 240', class: 'sim-fraction-pie', role: 'img', 'aria-label': t(language, `ระบาย ${a} ส่วน จาก ${b} ส่วนเท่ากัน${refined ? ` แบ่งครึ่งแต่ละส่วนเป็น ${a * 2} จาก ${b * 2} ส่วน` : ''}`, `${a} of ${b} equal parts filled${refined ? `, split into ${a * 2} of ${b * 2} equal parts` : ''}`) });
  const cx = 120, cy = 120, radius = 108;
  const point = index => {
    const angle = -Math.PI / 2 + index / b * Math.PI * 2;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  };
  for (let i = 0; i < b; i++) {
    const [x1, y1] = point(i), [x2, y2] = point(i + 1);
    svg.append(svgEl('path', { d: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`, fill: i < a ? '#edbd55' : '#f4ecd4', stroke: '#fffdf7', 'stroke-width': 3 }));
    if (refined) {
      const [mx, my] = point(i + 0.5);
      svg.append(svgEl('line', { x1: cx, y1: cy, x2: mx, y2: my, stroke: '#8e6b2c', 'stroke-width': 1.4, 'stroke-dasharray': '4 4' }));
    }
  }
  svg.append(svgEl('circle', { cx, cy, r: radius + 1, fill: 'none', stroke: '#bd9b55', 'stroke-width': 1.5 }));
  return svg;
}

function fractions(scene, state, language, onTap) {
  const b = limit(state.b, 2, 12), a = limit(state.a, 0, b), refined = Number(state.c) === 2;
  const graphic = el('div', 'sim-fraction-graphic');
  graphic.append(fractionPie(a, b, refined, language));
  const value = el('div', 'sim-fraction-readout');
  value.append(el('span', 'sim-fraction-number', `${a}/${b}`));
  if (refined) value.append(el('span', 'sim-fraction-equals', '='), el('span', 'sim-fraction-number is-violet', `${a * 2}/${b * 2}`));
  graphic.append(value);
  const slices = el('div', 'sim-fraction-slices');
  slices.setAttribute('aria-label', t(language, 'เลือกจำนวนส่วนที่ระบาย', 'Choose how many equal parts to fill'));
  for (let i = 0; i < b; i++) {
    const slice = action('', 'sim-fraction-slice', t(language, `เลือก ${i + 1} จาก ${b} ส่วนเท่ากัน`, `Fill ${i + 1} of ${b} equal parts`), () => onTap('set', 'a', i + 1));
    slice.setAttribute('aria-pressed', String(i < a));
    const parts = el('span', 'sim-slice-parts');
    parts.setAttribute('aria-hidden', 'true');
    for (let subpart = 0; subpart < (refined ? 2 : 1); subpart++) parts.append(el('span'));
    slice.append(el('span', 'sim-slice-mark', i + 1), parts, el('small', '', refined ? `2/${b * 2}` : `1/${b}`));
    slices.append(slice);
  }
  scene.append(graphic, note(t(language, `หนึ่งชิ้นคือ 1/${b} ของทั้งหมด · แตะชิ้นที่ต้องการ`, `Each piece is 1/${b} of the whole. Tap a piece to choose an amount.`)), slices);
}

function percent(scene, state, language, onTap) {
  const price = limit(state.a, 0, 1000), percentage = limit(state.b, 0, 100);
  const discount = price * percentage / 100, total = price - discount;
  const layout = el('div', 'sim-percent-layout');
  const receipt = el('div', 'sim-receipt');
  receipt.append(el('span', 'sim-receipt-eyebrow', t(language, 'ร้านค้าของพ่อมด', 'THE WIZARD SHOP')), el('span', 'sim-discount-ticket', `−${percentage}%`));
  const line = (label, amount, className = '') => {
    const row = el('div', `sim-receipt-line ${className}`);
    row.append(el('span', '', label), el('strong', '', Number(amount.toFixed(2)).toLocaleString(language === 'en' ? 'en-US' : 'th-TH')));
    return row;
  };
  receipt.append(line(t(language, 'ราคาเดิม', 'Original price'), price), line(t(language, 'ลดราคา', 'Discount'), discount), line(t(language, 'จ่ายจริง (บาท)', 'Pay (baht)'), total, 'sim-receipt-total'));
  const hundred = el('div', 'sim-hundred-wrap');
  hundred.append(el('p', 'sim-model-label', t(language, '100 ช่อง = 100% · 1 ช่อง = 1%', '100 cells = 100% · 1 cell = 1%')));
  const grid = el('div', 'sim-hundred-grid');
  for (let group = 0; group < 20; group++) {
    const target = (group + 1) * 5;
    const block = action('', 'sim-percent-block', t(language, `ตั้งส่วนลดเป็น ${target} เปอร์เซ็นต์`, `Set discount to ${target} percent`), () => onTap('set', 'b', target));
    block.setAttribute('aria-pressed', String(target <= percentage));
    for (let i = 0; i < 5; i++) {
      const cell = el('span', `sim-percent-cell${group * 5 + i < percentage ? ' is-filled' : ''}`);
      cell.setAttribute('aria-hidden', 'true');
      block.append(cell);
    }
    grid.append(block);
  }
  hundred.append(grid, note(t(language, 'แตะตารางเพื่อเปลี่ยนส่วนลดครั้งละ 5%', 'Tap the grid to change the discount in steps of 5%.')));
  layout.append(receipt, hundred);
  scene.append(layout);
}

function scale(scene, state, language) {
  const a = limit(state.a, 1, 5), denominator = limit(state.b, 10000, 100000);
  const kilometres = a * denominator / 100000;
  const stage = el('div', 'sim-map-stage');
  const svg = svgEl('svg', { viewBox: '0 0 500 240', class: 'sim-scale-map', role: 'img', 'aria-label': t(language, `แผนที่สมมติ จากจุด A ไปจุด B ระยะบนแผนภาพ ${a} เซนติเมตร`, `A schematic map from A to B, with a model map distance of ${a} centimetres`) });
  svg.append(svgEl('rect', { x: 0, y: 0, width: 500, height: 240, rx: 20, fill: '#e8efdf' }));
  svg.append(svgEl('path', { d: 'M0 30 Q100 110 180 35 T390 45 T510 15 L510 0 H0Z', fill: '#d6e4c5' }));
  svg.append(svgEl('path', { d: 'M0 208 Q75 100 180 190 T380 177 T510 210 V250 H0Z', fill: '#cbdcb8' }));
  svg.append(svgEl('path', { d: 'M300 -20 C245 55 410 95 340 160 S310 215 350 265', fill: 'none', stroke: '#b6d7d0', 'stroke-width': 25 }));
  svg.append(svgEl('path', { d: 'M-10 90 Q125 170 230 95 T510 85', fill: 'none', stroke: '#fffdf7', 'stroke-width': 11 }));
  svg.append(svgEl('path', { d: 'M55 0 Q100 78 60 145 T100 250', fill: 'none', stroke: '#fffdf7', 'stroke-width': 9 }));
  const start = 50, end = start + a * 80;
  svg.append(svgEl('line', { x1: start, y1: 132, x2: 450, y2: 132, stroke: '#7e9977', 'stroke-width': 2, 'stroke-dasharray': '5 6' }));
  svg.append(svgEl('line', { x1: start, y1: 132, x2: end, y2: 132, stroke: '#71568d', 'stroke-width': 7, 'stroke-linecap': 'round' }));
  for (const [x, label, color] of [[start, 'A', '#245f44'], [end, 'B', '#71568d']]) {
    svg.append(svgEl('circle', { cx: x, cy: 132, r: 13, fill: color, stroke: '#fffdf7', 'stroke-width': 4 }));
    const text = svgEl('text', { x, y: 103, 'text-anchor': 'middle', fill: color, 'font-size': 25, 'font-family': 'Georgia,serif', 'font-weight': 'bold' });
    text.textContent = label;
    svg.append(text);
  }
  stage.append(el('span', 'sim-map-caption', t(language, 'แผนที่สมมติ', 'SCHEMATIC MAP')), svg);
  const ruler = el('div', 'sim-map-ruler');
  for (let i = 0; i <= 5; i++) {
    const tick = el('span', i <= a ? 'is-measured' : '', String(i));
    ruler.append(tick);
  }
  ruler.setAttribute('aria-label', t(language, 'เส้นอ้างอิง 0 ถึง 5 เซนติเมตร', 'Reference ruler, zero to five centimetres'));
  stage.append(ruler, note(t(language, 'เซนติเมตรบนแผนภาพจำลอง', 'centimetres on the model map')));
  const stats = el('div', 'sim-map-stats');
  stats.append(metric(`${a} ${t(language, 'ซม.', 'cm')}`, t(language, 'ระยะบนแผนที่', 'map distance')), el('span', 'sim-map-arrow', '→'), metric(`${Number(kilometres.toFixed(3))} ${t(language, 'กม.', 'km')}`, t(language, 'ระยะจริงตามมาตราส่วน', 'distance at this scale'), 'is-violet'));
  scene.append(stage, stats, note(t(language, `มาตราส่วน 1 : ${denominator.toLocaleString('en-US')} หมายถึง 1 ซม. บนแผนที่ แทน ${denominator / 100} เมตรจริง`, `At 1 : ${denominator.toLocaleString('en-US')}, 1 cm on the map represents ${denominator / 100} real metres.`)));
}

/**
 * Render one mathematical model. Buttons use the same actions as the controls.
 * The returned disposer is safe to call when the controller changes rooms.
 */
export function renderSimulatorScene(container, state, { language = 'th', onTap = () => {} } = {}) {
  if (!container || !state) return () => {};
  const previous = sceneCache.get(container);
  const reuseKey = `${state.room}:${state.a}:${state.b}:${language}`;
  if (state.room === 'multiplication' && previous?.reuseKey === reuseKey && previous.update) {
    previous.update(state);
    return () => {};
  }
  const scene = el('div', `sim-scene sim-scene-${state.room}`);
  const renderers = { addition, subtraction, multiplication, division, fractions, percent, scale };
  const renderer = renderers[state.room] || addition;
  const update = renderer(scene, state, language, onTap);
  const changed = previous && previous.room === state.room && previous.signature !== JSON.stringify([state.a, state.b, state.c, state.phase]);
  if (changed) scene.setAttribute('data-changed', 'true');
  container.replaceChildren(scene);
  sceneCache.set(container, { room: state.room, signature: JSON.stringify([state.a, state.b, state.c, state.phase]), reuseKey, update });
  return () => {};
}
