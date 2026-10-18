// Original two-dimensional shape guides. Copying/tracing is motor practice,
// not automatic recognition or a judgement of mathematical understanding.
export const GEOMETRY_SHAPES = [
  { id: 'circle', name: 'รูปวงกลม', description: 'เส้นโค้งกลมต่อกัน ไม่มีมุม', closed: true },
  { id: 'oval', name: 'รูปวงรี', description: 'เส้นโค้งต่อกัน รูปตัวอย่างกว้างกว่าสูง', closed: true },
  { id: 'triangle', name: 'รูปสามเหลี่ยม', description: 'มี 3 ด้าน และ 3 มุม', closed: true, edges: 3 },
  { id: 'square', name: 'รูปสี่เหลี่ยมจัตุรัส', description: 'มี 4 ด้านยาวเท่ากัน และมีมุมฉาก 4 มุม', closed: true, edges: 4 },
  { id: 'rectangle', name: 'รูปสี่เหลี่ยมผืนผ้า', description: 'ด้านตรงข้ามยาวเท่ากัน และมีมุมฉาก 4 มุม', closed: true, edges: 4 },
  { id: 'diamond', name: 'รูปสี่เหลี่ยมขนมเปียกปูน', description: 'มี 4 ด้านยาวเท่ากัน', closed: true, edges: 4 },
  { id: 'pentagon', name: 'รูปห้าเหลี่ยม', description: 'มี 5 ด้าน และ 5 มุม', closed: true, edges: 5 },
  { id: 'hexagon', name: 'รูปหกเหลี่ยม', description: 'มี 6 ด้าน และ 6 มุม', closed: true, edges: 6 },
];

function close(points) { return [...points, { ...points[0] }]; }
function ellipse(rx, ry) {
  return close(Array.from({ length: 64 }, (_, index) => {
    const angle = -Math.PI / 2 + index / 64 * Math.PI * 2;
    return { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry };
  }));
}
function regularPolygon(sides) {
  return close(Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + index / sides * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }));
}
function rawPath(shapeId) {
  if (shapeId === 'circle') return ellipse(1, 1);
  if (shapeId === 'oval') return ellipse(1.3, .8);
  if (shapeId === 'triangle') return regularPolygon(3);
  if (shapeId === 'square') return close([{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }]);
  if (shapeId === 'rectangle') return close([{ x: -1.4, y: -.8 }, { x: 1.4, y: -.8 }, { x: 1.4, y: .8 }, { x: -1.4, y: .8 }]);
  if (shapeId === 'diamond') return close([{ x: 0, y: -1.1 }, { x: .75, y: 0 }, { x: 0, y: 1.1 }, { x: -.75, y: 0 }]);
  if (shapeId === 'pentagon') return regularPolygon(5);
  if (shapeId === 'hexagon') return regularPolygon(6);
  return [];
}

/** Normalize after physical-ratio fitting; normalized x/y sizes need not match. */
export function geometryPaths(shapeId, { aspectRatio = 2 } = {}) {
  const points = rawPath(shapeId);
  if (points.length === 0) return [];
  const ratio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 2;
  const xs = points.map(point => point.x), ys = points.map(point => point.y);
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
  const centerX = (left + right) / 2, centerY = (top + bottom) / 2;
  // Use canvas-height units, leaving at least 14% margin at each edge.
  const scale = Math.min(.72 * ratio / (right - left), .72 / (bottom - top));
  return [points.map(point => ({ x: .5 + (point.x - centerX) * scale / ratio, y: .5 + (point.y - centerY) * scale }))];
}

function unitRandom(rng) {
  const value = Number(rng());
  return Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : 0;
}

/** Basic six shapes for grades 1–2; eight for grades 3–4, in selected game scope. */
export function createGeometryRound(grade, { rng = Math.random, mode = 'mixed' } = {}) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 4) throw new RangeError('เลือกชั้น ป.1–4');
  if (typeof rng !== 'function') throw new TypeError('rng must be a function');
  if (!['mixed', 'trace', 'copy', 'creative'].includes(mode)) throw new RangeError('เลือก mixed, trace, copy หรือ creative');
  if (mode === 'creative') {
    const prompts = [
      { id: 'house', title: 'บ้านจากรูปต่าง ๆ', instruction: 'ลองวาดบ้านจากรูปสี่เหลี่ยม ทำหลังคารูปสามเหลี่ยม แล้วเติมประตูและหน้าต่างตามใจเรา' },
      { id: 'rocket', title: 'จรวดรูปเรขาคณิต', instruction: 'ลองวาดจรวดจากรูปสี่เหลี่ยมผืนผ้า เติมหัวจรวดรูปสามเหลี่ยมและหน้าต่างรูปวงกลม แล้วตกแต่งตามใจเรา' },
      { id: 'robot', title: 'หุ่นยนต์ของฉัน', instruction: 'ลองวาดหุ่นยนต์จากรูปสี่เหลี่ยม เติมดวงตารูปวงกลม แขน ขา และรายละเอียดที่เราชอบ' },
      { id: 'garden', title: 'สวนรูปเรขาคณิต', instruction: 'ลองวาดสวน ใช้รูปวงกลมทำดอกไม้ รูปสี่เหลี่ยมทำรั้ว และรูปสามเหลี่ยมทำธง แล้วเติมสิ่งที่เราชอบ' },
    ];
    return { grade, title: `ป.${grade} — วาดภาพจากรูปเรขาคณิต`, activities: prompts.map(prompt => ({ ...prompt, id: `g${grade}-creative-${prompt.id}`, kind: 'creative' })) };
  }
  const shapes = GEOMETRY_SHAPES.slice(0, grade <= 2 ? 6 : 8);
  for (let index = shapes.length - 1; index > 0; index--) {
    const selected = Math.floor(unitRandom(rng) * (index + 1));
    [shapes[index], shapes[selected]] = [shapes[selected], shapes[index]];
  }
  const kinds = mode === 'mixed' ? ['shape-trace', 'shape-copy'] : [mode === 'trace' ? 'shape-trace' : 'shape-copy'];
  const activities = shapes.flatMap(shape => kinds.map(kind => ({
    id: `g${grade}-${kind}-${shape.id}`, kind, shapeId: shape.id, shapeName: shape.name,
    title: `${kind === 'shape-trace' ? 'ลากตามรอย' : 'ดูแล้ววาด'}${shape.name}`,
    instruction: kind === 'shape-trace'
      ? `เริ่มที่จุดเริ่ม ลากตามเส้นของ${shape.name}ให้ครบ แล้วกลับมาที่จุดเริ่ม ค่อย ๆ ลากได้`
      : `ดู${shape.name}ในตัวอย่าง แล้วลองวาดลงในช่องว่าง ไม่ต้องรีบและไม่ต้องเหมือนเป๊ะ`,
  })));
  return { grade, title: `ป.${grade} — สนุกกับรูปเรขาคณิต`, activities };
}
