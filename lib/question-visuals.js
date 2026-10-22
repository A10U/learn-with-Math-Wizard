const SVG_NS = 'http://www.w3.org/2000/svg';
const copy = language => language === 'en'
  ? { bar: 'Bar chart', table: 'Data table', pictograph: 'Pictograph', item: 'Item', value: 'Value', count: 'Number of symbols', data: 'Chart data', alternative: 'View data as a table', key: (symbol, scale, unit) => `Key: ${symbol} = ${scale} ${unit}` }
  : { bar: 'แผนภูมิแท่ง', table: 'ตารางข้อมูล', pictograph: 'แผนภูมิรูปภาพ', item: 'รายการ', value: 'จำนวน', count: 'จำนวนรูปภาพ', data: 'ข้อมูลในแผนภูมิ', alternative: 'ดูข้อมูลในตาราง', key: (symbol, scale, unit) => `กำหนดให้ ${symbol} 1 รูป แทน ${scale} ${unit}` };
const element = (tag, className = '', text = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== '') node.textContent = String(text);
  return node;
};
const svgElement = (tag, attributes = {}, text = '') => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  if (text !== '') node.textContent = String(text);
  return node;
};
const formatted = value => String(Number(value.toFixed(6)));
function dataTable(labels, rows, columns, unit, text) {
  const wrapper = element('div', 'question-data-table-scroll');
  const table = element('table', 'question-data-table');
  table.append(element('caption', '', `${text.data}${unit ? ` (${unit})` : ''}`));
  const head = element('thead'), header = element('tr');
  for (const label of [text.item, ...columns]) {
    const cell = element('th', '', label); cell.setAttribute('scope', 'col'); header.append(cell);
  }
  head.append(header); table.append(head);
  const body = element('tbody');
  labels.forEach((label, index) => {
    const row = element('tr'), name = element('th', '', label); name.setAttribute('scope', 'row'); row.append(name);
    for (const value of rows[index]) row.append(element('td', '', formatted(value)));
    body.append(row);
  });
  table.append(body); wrapper.append(table);
  return wrapper;
}
function axisScale(maximum) {
  if (maximum === 0) return { top: 5, step: 1 };
  const magnitude = 10 ** Math.floor(Math.log10(maximum / 5));
  const step = [1, 2, 5, 10].find(value => value * magnitude >= maximum / 5) * magnitude;
  return { top: Math.ceil(maximum / step) * step, step };
}
function barChart(visual, figure, text) {
  const { labels, values, unit } = visual, { top, step } = axisScale(Math.max(...values));
  const left = 108, width = 246, rowHeight = 54, bottom = 42 + labels.length * rowHeight;
  const summary = labels.map((label, index) => `${label}: ${formatted(values[index])} ${unit}`).join('; ');
  const svg = svgElement('svg', { viewBox: `0 0 420 ${bottom + 38}`, role: 'img', 'aria-label': summary, class: 'question-data-bar' });
  svg.append(svgElement('title', {}, `${text.bar}: ${summary}`));
  for (let index = 0; index <= Math.round(top / step); index++) {
    const value = index * step, x = left + value / top * width;
    svg.append(svgElement('line', { x1: x, y1: 36, x2: x, y2: bottom, class: 'question-data-grid' }));
    svg.append(svgElement('text', { x, y: bottom + 23, 'text-anchor': 'middle', class: 'question-data-axis' }, formatted(value)));
  }
  svg.append(svgElement('text', { x: left, y: 21, class: 'question-data-axis' }, unit));
  labels.forEach((label, index) => {
    const y = 47 + index * rowHeight, barWidth = values[index] / top * width;
    svg.append(svgElement('text', { x: left - 12, y: y + 22, 'text-anchor': 'end', class: 'question-data-label' }, label));
    svg.append(svgElement('rect', { x: left, y, width: barWidth, height: 32, rx: 4, class: 'question-data-bar-fill' }));
    svg.append(svgElement('text', { x: left + barWidth + 8, y: y + 22, class: 'question-data-value' }, formatted(values[index])));
  });
  const scroll = element('div', 'question-data-chart-scroll'); scroll.append(svg); figure.append(scroll);
  const details = element('details', 'question-data-alternative');
  details.append(element('summary', '', text.alternative), dataTable(labels, values.map(value => [value]), [text.value], unit, text));
  figure.append(details);
}
function pictograph(visual, figure, text) {
  const { labels, values, unit } = visual, scale = visual.scale ?? 1, symbol = visual.symbol || '●';
  figure.append(element('p', 'question-data-key', text.key(symbol, formatted(scale), unit)));
  const wrapper = element('div', 'question-data-table-scroll'), table = element('table', 'question-data-table question-data-pictograph');
  const head = element('thead'), header = element('tr');
  for (const label of [text.item, text.count]) { const cell = element('th', '', label); cell.setAttribute('scope', 'col'); header.append(cell); }
  head.append(header); table.append(head);
  const body = element('tbody');
  labels.forEach((label, index) => {
    const row = element('tr'), name = element('th', '', label); name.setAttribute('scope', 'row'); row.append(name);
    const cell = element('td'), symbols = element('span', 'question-data-symbols');
    symbols.setAttribute('role', 'img'); symbols.setAttribute('aria-label', `${label}: ${formatted(values[index])} ${unit}`);
    for (let count = 0; count < values[index] / scale; count++) {
      const icon = element('span', 'question-data-symbol', symbol); icon.setAttribute('aria-hidden', 'true'); symbols.append(icon);
    }
    if (values[index] === 0) { const zero = element('span', 'question-data-zero', '0'); zero.setAttribute('aria-hidden', 'true'); symbols.append(zero); }
    cell.append(symbols); row.append(cell); body.append(row);
  });
  table.append(body); wrapper.append(table); figure.append(wrapper);
}

/** Render the supplied data without changing a question's answers or language. */
export function renderQuestionVisual(visual, { language = 'th' } = {}) {
  if (!visual || !['bar', 'table', 'pictograph'].includes(visual.type)) return null;
  const { labels, values, type } = visual;
  if (!Array.isArray(labels) || !labels.length || !labels.every(label => typeof label === 'string') || !Array.isArray(values) || !values.every(value => Number.isFinite(value) && value >= 0)) return null;
  const rows = type === 'table' ? visual.rows ?? values.map(value => [value]) : null;
  const columns = type === 'table' ? visual.columns ?? [copy(language).value] : null;
  if (type === 'table') {
    if (!Array.isArray(columns) || !columns.length || !columns.every(column => typeof column === 'string') || !Array.isArray(rows) || rows.length !== labels.length || !rows.every(row => Array.isArray(row) && row.length === columns.length && row.every(Number.isFinite))) return null;
  } else if (values.length !== labels.length) return null;
  if (type === 'pictograph') {
    const scale = visual.scale ?? 1;
    if (!Number.isFinite(scale) || scale <= 0 || !values.every(value => Number.isInteger(value / scale) && value / scale <= 200)) return null;
  }
  const text = copy(language), unit = typeof visual.unit === 'string' ? visual.unit : '';
  const figure = element('figure', `question-data-visual question-data-visual--${type}`);
  figure.append(element('figcaption', '', `${text[type]}${unit ? ` (${unit})` : ''}`));
  const data = { ...visual, unit };
  if (type === 'bar') barChart(data, figure, text);
  else if (type === 'pictograph') pictograph(data, figure, text);
  else figure.append(dataTable(labels, rows, columns, unit, text));
  return figure;
}
