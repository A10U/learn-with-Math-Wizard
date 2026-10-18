// Rendering only: preserve the child's original points for tracing and undo.
export const PENCIL_COLORS = Object.freeze([
  { id: 'red', label: 'แดง', color: '#c23b4b' },
  { id: 'orange', label: 'ส้ม', color: '#bb5b17' },
  { id: 'yellow', label: 'เหลือง', color: '#997700' },
  { id: 'green', label: 'เขียว', color: '#245f44' },
  { id: 'sky', label: 'ฟ้า', color: '#167eaf' },
  { id: 'blue', label: 'น้ำเงิน', color: '#3f51a1' },
  { id: 'purple', label: 'ม่วง', color: '#88459c' },
].map(color => Object.freeze(color)));
const inkColors = new WeakMap();
export function captureInkColor(mark, color) {
  if (!inkColors.has(mark)) inkColors.set(mark, PENCIL_COLORS.some(pencil => pencil.color === color) ? color : '#245f44');
  return inkColors.get(mark);
}
export function inkColor(mark) { return inkColors.get(mark) || '#245f44'; }
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
function isCorner(points, index) {
  const center = points[index];
  let before = index - 1, after = index + 1;
  while (before > 0 && distance(points[before], center) < 10) before--;
  while (after < points.length - 1 && distance(points[after], center) < 10) after++;
  const a = points[before], b = points[after], first = distance(a, center), second = distance(center, b);
  if (first < 8 || second < 8) return false;
  const cosine = ((center.x - a.x) * (b.x - center.x) + (center.y - a.y) * (b.y - center.y)) / (first * second);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) >= Math.PI * .29;
}

/** Midpoint quadratics soften small jitter; deliberate corners stay pinned. */
export function strokeCommands(points, { width = 1, height = 1, smooth = true } = {}) {
  if (!Array.isArray(points)) return [];
  const scaled = [];
  for (const point of points) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    const next = { x: point.x * width, y: point.y * height };
    if (!scaled.length || distance(scaled[scaled.length - 1], next) > .01) scaled.push(next);
  }
  if (!scaled.length) return [];
  const commands = [{ type: 'moveTo', args: [scaled[0].x, scaled[0].y] }];
  const straight = point => commands.push({ type: 'lineTo', args: [point.x, point.y] });
  if (!smooth || scaled.length < 3) { scaled.slice(1).forEach(straight); return commands; }
  const boundaries = [0];
  for (let index = 1; index < scaled.length - 1; index++) if (isCorner(scaled, index)) boundaries.push(index);
  boundaries.push(scaled.length - 1);
  for (let segment = 1; segment < boundaries.length; segment++) {
    const start = boundaries[segment - 1], end = boundaries[segment];
    for (let index = start + 1; index < end; index++) {
      const control = scaled[index], target = midpoint(control, scaled[index + 1]);
      commands.push({ type: 'quadraticCurveTo', args: [control.x, control.y, target.x, target.y] });
    }
    straight(scaled[end]);
  }
  return commands;
}

export function paintStroke(context, points, width, height, { smooth = true, color = '#245f44', lineWidth = 5 } = {}) {
  const commands = strokeCommands(points, { width, height, smooth });
  if (!commands.length) return;
  context.strokeStyle = color; context.fillStyle = color; context.lineWidth = lineWidth;
  context.lineCap = 'round'; context.lineJoin = 'round'; context.setLineDash([]); context.beginPath();
  commands.forEach(command => context[command.type](...command.args));
  if (commands.length === 1) { context.arc(commands[0].args[0], commands[0].args[1], lineWidth / 2, 0, Math.PI * 2); context.fill(); }
  else context.stroke();
}
