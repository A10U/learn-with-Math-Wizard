// Original vector guides and pointer tools. Ink is never handwriting recognition.
const point = (x, y) => ({ x, y });
const line = (...coordinates) => coordinates.map(([x, y]) => point(x, y));
const ellipse = (cx, cy, rx, ry, start = -Math.PI / 2, end = Math.PI * 1.5) => Array.from({ length: 25 }, (_, i) => {
  const angle = start + (end - start) * i / 24;
  return point(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry);
});
const DIGITS = {
  '0': [ellipse(.5, .5, .29, .38)],
  '1': [line([.28,.3], [.5,.12], [.5,.88])],
  '2': [line([.2,.3], [.24,.2], [.38,.12], [.61,.12], [.76,.22], [.78,.36], [.67,.49], [.2,.87], [.8,.87])],
  '3': [line([.22,.2], [.4,.12], [.65,.14], [.78,.26], [.7,.42], [.5,.49], [.7,.53], [.8,.68], [.74,.82], [.55,.89], [.3,.85], [.2,.76])],
  '4': [line([.65,.12], [.2,.62], [.83,.62]), line([.65,.12], [.65,.89])],
  '5': [line([.78,.13], [.25,.13], [.22,.47], [.5,.43], [.71,.5], [.8,.66], [.74,.82], [.55,.89], [.32,.86], [.2,.78])],
  '6': [line([.73,.17], [.56,.12], [.36,.24], [.23,.48], [.21,.72], [.32,.86], [.54,.89], [.74,.8], [.78,.63], [.66,.5], [.45,.48], [.24,.6])],
  '7': [line([.18,.13], [.82,.13], [.37,.89])],
  '8': [line([.5,.48], [.27,.34], [.27,.2], [.43,.12], [.62,.14], [.75,.26], [.68,.4], [.5,.48], [.28,.61], [.2,.74], [.31,.86], [.51,.9], [.73,.82], [.79,.68], [.68,.57], [.5,.48])],
  '9': [line([.76,.43], [.64,.52], [.41,.52], [.23,.4], [.24,.22], [.39,.12], [.61,.12], [.76,.25], [.77,.48], [.65,.73], [.45,.89])],
  '/': [line([.77,.12], [.23,.88])],
};
const validPoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
const finishedStrokes = new WeakSet();
const draggedLinks = new WeakSet();
const traceLayouts = new WeakMap();
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inkLength = strokes => strokes.reduce((sum, stroke) => sum + stroke.reduce((length, p, i) => length + (i ? distance(stroke[i - 1], p) : 0), 0), 0);
function segmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, squared = dx * dx + dy * dy;
  const t = squared === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / squared));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
function samples(points) {
  const result = [];
  points.forEach((p, i) => {
    if (i === 0) { result.push(p); return; }
    const before = points[i - 1], count = Math.max(1, Math.ceil(distance(before, p) / .018));
    for (let step = 1; step <= count; step++) result.push(point(before.x + (p.x - before.x) * step / count, before.y + (p.y - before.y) * step / count));
  });
  return result;
}

/** Normalized independent polylines, with enough room for up to six symbols. */
function traceSymbols(target, { aspectRatio = 2.5 } = {}) {
  const symbols = String(target ?? '').slice(0, 6).split('');
  if (!symbols.length || symbols.some(symbol => !DIGITS[symbol])) return [];
  const width = Math.min(.32, .84 / symbols.length), start = (1 - width * symbols.length) / 2;
  const ratio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 2.5;
  const heightScale = Math.min(1, width * Math.max(.1, ratio) * 1.7);
  return symbols.map((symbol, index) => ({ symbol, paths: DIGITS[symbol].map(stroke => stroke.map(p => point(start + (index + p.x) * width, .5 + (p.y - .5) * heightScale))) }));
}
export function tracePaths(target, options) { return traceSymbols(target, options).flatMap(symbol => symbol.paths); }

export function connectionAnchors(activity) {
  const pairs = Array.isArray(activity?.pairs) ? activity.pairs.slice(0, 6) : [];
  const order = activity?.rightOrder;
  const validOrder = Array.isArray(order) && order.length === pairs.length && new Set(order).size === pairs.length && order.every(index => Number.isInteger(index) && index >= 0 && index < pairs.length);
  const right = validOrder ? order.map(index => pairs[index]) : [...pairs].reverse();
  const anchors = (rows, x, label) => rows.map((pair, index) => ({ id: pair.id, x, y: .2 + (index + .5) * .6 / rows.length, label: pair[label] }));
  return { left: anchors(pairs, .16, 'leftLabel'), right: anchors(right, .84, 'rightLabel') };
}

/** Touch/pen/mouse canvas. The owner retains normalized ink across redraws. */
export function mountHandwritingCanvas(canvas, { activity, strokes = [], connections = [], requireGesture = false, onChange = () => {} } = {}) {
  let context = null, active = null, from = null, preview = null, disposed = false, lastMessage = '';
  let revision = 0;
  let coverageCache = null;
  try { context = canvas.getContext('2d'); } catch { /* Explicit skip and tap matching remain available. */ }
  const available = Boolean(context), kind = activity?.kind, anchors = connectionAnchors(activity);
  const guide = kind === 'path' && Array.isArray(activity.guide) ? activity.guide.filter(validPoint).slice(0, 200) : [];
  const guideSamples = samples(guide);
  const listeners = [];
  const parentWindow = globalThis.window || globalThis;
  const pairs = new Set(anchors.left.map(p => p.id));
  const cleanConnections = () => {
    const seen = new Set();
    return connections.filter(pair => pair && pair.leftId === pair.rightId && pairs.has(pair.leftId) && !seen.has(pair.leftId) && seen.add(pair.leftId));
  };
  const eligibleStrokes = () => requireGesture ? strokes.filter(stroke => finishedStrokes.has(stroke)) : strokes;
  function symbols() {
    const box = rect();
    if (!traceLayouts.has(strokes) || traceLayouts.get(strokes).target !== activity?.target) traceLayouts.set(strokes, { target: activity?.target, aspectRatio: Math.max(1, box.width) / Math.max(1, box.height) });
    return traceSymbols(activity?.target, traceLayouts.get(strokes));
  }
  function coverageDetails() {
    // Required exercises evaluate finished gestures; pending ink cannot change
    // their result. Reuse the result while the next stroke is being drawn.
    if (requireGesture && coverageCache?.revision === revision) return coverageCache;
    const eligible = eligibleStrokes();
    const covered = p => eligible.some(stroke => stroke.some((end, i) => i > 0 && segmentDistance(p, stroke[i - 1], end) <= .045));
    const tracing = kind === 'trace' && requireGesture ? symbols().map(symbol => symbol.paths.map(path => samples(path))) : [];
    const traceProgress = tracing.map(paths => { const all = paths.flat(); return all.length ? all.filter(covered).length / all.length : 0; });
    const traceReady = tracing.length > 0 && tracing.every((paths, index) => traceProgress[index] >= .8 && paths.every(path => path.filter(covered).length / path.length >= .7));
    const coverage = kind === 'trace' && requireGesture ? traceProgress.reduce((sum, value) => sum + value, 0) / Math.max(1, traceProgress.length) : guideSamples.length ? guideSamples.filter(covered).length / guideSamples.length : 0;
    const pathReady = coverage >= .8 && guide.length > 1 && covered(guide[0]) && covered(guide[guide.length - 1]);
    const result = { revision, traceProgress, traceReady, coverage, pathReady };
    if (requireGesture) coverageCache = result;
    return result;
  }
  function status() {
    const hasDrawing = inkLength(strokes) >= .03;
    const completedStrokes = strokes.filter(stroke => finishedStrokes.has(stroke)).length;
    const connected = cleanConnections().filter(link => !requireGesture || draggedLinks.has(link)).length;
    const { traceProgress, traceReady, coverage, pathReady } = coverageDetails();
    const inkReady = hasDrawing && (!requireGesture || completedStrokes > 0);
    const ready = kind === 'connect' ? pairs.size > 0 && connected === pairs.size : available && inkReady && (kind === 'trace' && requireGesture ? traceReady : kind !== 'path' || pathReady);
    const message = lastMessage || (!available ? requireGesture ? 'เปิดพื้นที่เขียนไม่ได้ ให้ผู้ปกครองช่วยเลือกวิธีฝึกที่เหมาะกับเครื่องนี้' : 'เครื่องนี้ยังเปิดพื้นที่เขียนไม่ได้ เลือกข้ามได้ หรือใช้ปุ่มจับคู่ด้านล่าง' : kind === 'connect' ? `ลากเส้นจับคู่แล้ว ${connected}/${pairs.size} คู่` : kind === 'path' ? ready ? 'ลากถึงปลายทางแล้ว ไปต่อได้เลย' : 'ค่อย ๆ ลากตามเส้นจากจุดเริ่มไปจุดจบ' : kind === 'trace' && requireGesture ? ready ? 'ลากตามรอยครบแล้ว ไปต่อได้เลย' : 'เริ่มที่จุดชมพู ลากตามรอยให้ครบทุกตัว แล้วค่อยยกนิ้ว' : inkReady ? 'ลองเขียนแล้ว กดยืนยันเมื่อเขียนครบได้เลย' : 'เริ่มเขียนด้วยนิ้ว ปากกา หรือเมาส์ แล้วค่อยยกนิ้ว');
    return { available, hasDrawing, ready, coverage, connected, completedStrokes, traceProgress, revision, change: 'none', message };
  }
  function notify(change = 'none') { if (!disposed) onChange({ ...status(), change }); }
  function rect() { return canvas.getBoundingClientRect(); }
  function eventPoint(event, clamp = true) {
    const box = rect(), x = (event.clientX - box.left) / Math.max(1, box.width), y = (event.clientY - box.top) / Math.max(1, box.height);
    return point(clamp ? Math.max(0, Math.min(1, x)) : x, clamp ? Math.max(0, Math.min(1, y)) : y);
  }
  function drawLine(points, width, height, color, thickness, dashed = false) {
    if (!points.length) return;
    context.strokeStyle = color; context.fillStyle = color; context.lineWidth = thickness; context.setLineDash(dashed ? [4, 8] : []);
    context.beginPath(); context.moveTo(points[0].x * width, points[0].y * height);
    points.slice(1).forEach(p => context.lineTo(p.x * width, p.y * height));
    if (points.length === 1) { context.arc(points[0].x * width, points[0].y * height, thickness / 2, 0, Math.PI * 2); context.fill(); }
    else context.stroke();
  }
  function dot(p, width, height, color, radius = 6) { context.beginPath(); context.fillStyle = color; context.arc(p.x * width, p.y * height, radius, 0, Math.PI * 2); context.fill(); }
  function wrapLabel(text, x, y, width) {
    const characters = [...String(text)], rows = []; let row = '';
    characters.forEach(character => { if (row && context.measureText(row + character).width > width) { rows.push(row); row = character; } else row += character; });
    if (row) rows.push(row);
    rows.slice(0, 4).forEach((value, index, all) => context.fillText(value, x, y + (index - (all.length - 1) / 2) * 15));
  }
  function redraw() {
    if (!available || disposed) return;
    const box = rect(), width = Math.max(1, box.width), height = Math.max(1, box.height), ratio = Math.max(1, Math.min(parentWindow.devicePixelRatio || 1, 3));
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height); context.lineCap = 'round'; context.lineJoin = 'round';
    if (kind === 'connect') {
      cleanConnections().forEach(pair => {
        const left = anchors.left.find(p => p.id === pair.leftId), right = anchors.right.find(p => p.id === pair.rightId);
        drawLine([left, right], width, height, '#245f44', 4);
      });
      if (from && preview) drawLine([from, preview], width, height, '#a83779', 3, true);
      context.textAlign = 'center'; context.textBaseline = 'middle'; context.font = `bold ${width < 400 ? 12 : 14}px sans-serif`;
      [...anchors.left, ...anchors.right].forEach(p => {
        const matched = cleanConnections().some(pair => pair.leftId === p.id), bw = width * .29, bh = height * .16;
        context.fillStyle = matched ? '#e7f0dc' : '#fcfbef'; context.strokeStyle = from?.id === p.id ? '#a83779' : '#acbf99'; context.lineWidth = 2; context.setLineDash([]);
        context.fillRect(p.x * width - bw / 2, p.y * height - bh / 2, bw, bh);
        context.strokeRect(p.x * width - bw / 2, p.y * height - bh / 2, bw, bh);
        context.fillStyle = '#254e36'; wrapLabel(p.label, p.x * width, p.y * height, bw - 10);
      });
      return;
    }
    if (kind === 'trace') {
      symbols().flatMap(symbol => symbol.paths).forEach(path => {
        drawLine(path, width, height, '#abc1a0', 4, true);
        dot(path[0], width, height, '#a83779', 4);
        if (path.length > 1) {
          const start = path[0], next = path[1], angle = Math.atan2((next.y - start.y) * height, (next.x - start.x) * width);
          const x = start.x * width + Math.cos(angle) * 15, y = start.y * height + Math.sin(angle) * 15;
          context.strokeStyle = '#a83779'; context.lineWidth = 2; context.setLineDash([]); context.beginPath(); context.moveTo(x - 7 * Math.cos(angle - .5), y - 7 * Math.sin(angle - .5)); context.lineTo(x, y); context.lineTo(x - 7 * Math.cos(angle + .5), y - 7 * Math.sin(angle + .5)); context.stroke();
        }
      });
    } else if (kind === 'path' && guide.length) {
      drawLine(guide, width, height, '#b9cda8', 18); drawLine(guide, width, height, '#faf8e8', 3, true);
      dot(guide[0], width, height, '#a83779', 8); dot(guide[guide.length - 1], width, height, '#245f44', 8);
      context.font = 'bold 13px sans-serif'; context.textAlign = 'center'; context.fillStyle = '#245f44';
      context.fillText('เริ่ม', guide[0].x * width, guide[0].y * height - 22); context.fillText('จบ', guide[guide.length - 1].x * width, guide[guide.length - 1].y * height - 22);
    } else {
      drawLine([point(.06,.9), point(.94,.9)], width, height, '#d9e1d0', 1, true);
    }
    strokes.forEach(stroke => drawLine(stroke, width, height, '#245f44', 5));
  }
  function connect(leftId, rightId, fromGesture = false) {
    if (disposed || kind !== 'connect' || !pairs.has(leftId) || !pairs.has(rightId)) return { valid: false, correct: false, duplicate: false, complete: status().ready };
    const correct = leftId === rightId, duplicate = correct && cleanConnections().some(pair => pair.leftId === leftId);
    if (requireGesture && !fromGesture) { lastMessage = 'ลากเส้นจากฝั่งซ้ายไปหาคู่ทางขวาก่อนนะ'; notify(); return { valid: false, correct: false, duplicate: false, complete: status().ready }; }
    if (correct && !duplicate) { const link = { leftId, rightId }; connections.push(link); if (fromGesture) draggedLinks.add(link); }
    else if (correct && fromGesture) { const link = cleanConnections().find(pair => pair.leftId === leftId); if (link) draggedLinks.add(link); }
    if (correct && fromGesture) revision++;
    lastMessage = correct ? duplicate ? 'คู่นี้โยงแล้ว ลองคู่อื่นต่อได้' : 'ใช่เลย! ได้อีกหนึ่งคู่' : 'คู่นี้ยังไม่ตรง ลองนับหรือดูจำนวนอีกครั้งได้';
    redraw(); notify('connect'); return { valid: true, correct, duplicate, complete: status().ready };
  }
  function hit(p, side) {
    if (!validPoint(p)) return null;
    return anchors[side].find(anchor => Math.abs(anchor.x - p.x) <= .15 && Math.abs(anchor.y - p.y) <= .085) || null;
  }
  function down(event) {
    if (!available || disposed || active !== null || (event.button !== undefined && event.button !== 0)) return;
    const p = eventPoint(event, false); if (!validPoint(p)) return;
    if (kind === 'connect') { from = hit(p, 'left'); if (!from) return; preview = p; }
    else { if (strokes.length >= 200) return; strokes.push([p]); }
    active = event.pointerId; lastMessage = ''; event.preventDefault();
    try { canvas.setPointerCapture(event.pointerId); } catch { /* Capture is optional on older devices. */ }
    redraw(); notify('draw');
  }
  function move(event) {
    if (disposed || active === null || active !== event.pointerId) return;
    event.preventDefault(); const p = eventPoint(event);
    if (kind === 'connect') preview = p;
    else { const stroke = strokes[strokes.length - 1]; if (stroke.length < 2000 && distance(stroke[stroke.length - 1], p) > .001) stroke.push(p); }
    redraw(); notify('draw');
  }
  function release(event, cancelled = false) {
    if (active === null || active !== event.pointerId) return;
    const left = from, right = kind === 'connect' && !cancelled ? hit(eventPoint(event, false), 'right') : null;
    if (kind !== 'connect' && !cancelled && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
      const p = eventPoint(event), stroke = strokes[strokes.length - 1];
      if (stroke && stroke.length < 2000 && distance(stroke[stroke.length - 1], p) > .001) stroke.push(p);
    }
    const stroke = kind !== 'connect' ? strokes[strokes.length - 1] : null;
    const completed = !cancelled && stroke && inkLength([stroke]) >= .03;
    if (completed) { finishedStrokes.add(stroke); revision++; }
    active = null; from = null; preview = null;
    try { canvas.releasePointerCapture?.(event.pointerId); } catch { /* A cancelled pointer may already be released. */ }
    if (left && right) connect(left.id, right.id, true); else { redraw(); notify(completed ? 'stroke' : 'pointerend'); }
  }
  function listen(target, type, handler) { target.addEventListener(type, handler); listeners.push(() => target.removeEventListener(type, handler)); }
  listen(canvas, 'pointerdown', down); listen(canvas, 'pointermove', move); listen(canvas, 'pointerup', event => release(event)); listen(canvas, 'pointercancel', event => release(event, true)); listen(canvas, 'lostpointercapture', event => release(event, true));
  if (typeof parentWindow.addEventListener === 'function') listen(parentWindow, 'resize', redraw);
  const api = {
    cleanup() { disposed = true; active = null; from = null; preview = null; listeners.forEach(remove => remove()); },
    undo() { if (disposed) return; active = null; from = null; preview = null; if (kind === 'connect') connections.pop(); else strokes.pop(); lastMessage = ''; revision++; redraw(); notify('undo'); },
    clear() { if (disposed) return; active = null; from = null; preview = null; if (kind === 'connect') connections.length = 0; else strokes.length = 0; lastMessage = ''; revision++; redraw(); notify('clear'); },
    hasDrawing: () => status().hasDrawing, isReady: () => status().ready, status, connect: (leftId, rightId) => connect(leftId, rightId), redraw,
  };
  redraw(); notify('initial'); return api;
}
