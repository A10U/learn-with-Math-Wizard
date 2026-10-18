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

/** Basic six shapes for grades 1–2; eight for grades 3–6, as drawing practice. */
export function createGeometryRound(grade, { rng = Math.random, mode = 'mixed', language = 'th' } = {}) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new RangeError('เลือกชั้น ป.1–6');
  if (typeof rng !== 'function') throw new TypeError('rng must be a function');
  if (!['mixed', 'trace', 'copy', 'creative'].includes(mode)) throw new RangeError('เลือก mixed, trace, copy หรือ creative');
  if (mode === 'creative') {
    const prompts = [
      { id: 'house', title: 'บ้านจากรูปต่าง ๆ', instruction: 'ลองวาดบ้านจากรูปสี่เหลี่ยม ทำหลังคารูปสามเหลี่ยม แล้วเติมประตูและหน้าต่างตามใจเรา' },
      { id: 'rocket', title: 'จรวดรูปเรขาคณิต', instruction: 'ลองวาดจรวดจากรูปสี่เหลี่ยมผืนผ้า เติมหัวจรวดรูปสามเหลี่ยมและหน้าต่างรูปวงกลม แล้วตกแต่งตามใจเรา' },
      { id: 'robot', title: 'หุ่นยนต์ของฉัน', instruction: 'ลองวาดหุ่นยนต์จากรูปสี่เหลี่ยม เติมดวงตารูปวงกลม แขน ขา และรายละเอียดที่เราชอบ' },
      { id: 'garden', title: 'สวนรูปเรขาคณิต', instruction: 'ลองวาดสวน ใช้รูปวงกลมทำดอกไม้ รูปสี่เหลี่ยมทำรั้ว และรูปสามเหลี่ยมทำธง แล้วเติมสิ่งที่เราชอบ' },
    ];
    return localizeGeometryRound(withGeometryTranslations({ grade, title: `ป.${grade} — วาดภาพจากรูปเรขาคณิต`, activities: prompts.map(prompt => ({ ...prompt, id: `g${grade}-creative-${prompt.id}`, kind: 'creative' })) }), language);
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
  return localizeGeometryRound(withGeometryTranslations({ grade, title: `ป.${grade} — สนุกกับรูปเรขาคณิต`, activities }), language);
}


const ENGLISH_SHAPES = {
  circle: { name: 'Circle', description: 'A round, continuous curve with no corners.' },
  oval: { name: 'Oval', description: 'A continuous curve. This example is wider than it is tall.' },
  triangle: { name: 'Triangle', description: 'Has 3 sides and 3 corners.' },
  square: { name: 'Square', description: 'Has 4 equal sides and 4 right angles.' },
  rectangle: { name: 'Rectangle', description: 'Opposite sides are equal, with 4 right angles.' },
  diamond: { name: 'Rhombus', description: 'Has 4 equal sides.' },
  pentagon: { name: 'Pentagon', description: 'Has 5 sides and 5 corners.' },
  hexagon: { name: 'Hexagon', description: 'Has 6 sides and 6 corners.' },
};
for (const shape of GEOMETRY_SHAPES) shape.translations = {
  th: { name: shape.name, description: shape.description }, en: ENGLISH_SHAPES[shape.id],
};

/** Localized display metadata; the shape ID and mathematical properties stay fixed. */
export function localizedShape(shapeOrId, language = 'th') {
  const shape = typeof shapeOrId === 'string' ? GEOMETRY_SHAPES.find(item => item.id === shapeOrId) : shapeOrId;
  return shape ? { ...shape, ...shape.translations?.[language === 'en' ? 'en' : 'th'] } : null;
}

const CREATIVE_ENGLISH = {
  house: { title: 'A house made of shapes', instruction: 'Try drawing a house with squares and rectangles. Add a triangle roof, then doors and windows however you like.' },
  rocket: { title: 'A geometry rocket', instruction: 'Try drawing a rocket with a rectangle body, a triangle nose and circle windows. Decorate it however you like.' },
  robot: { title: 'My robot', instruction: 'Try drawing a robot with squares and rectangles. Add circle eyes, arms, legs and your favorite details.' },
  garden: { title: 'A garden of shapes', instruction: 'Try drawing a garden. Use circles for flowers, rectangles for a fence and triangles for flags. Add anything you like.' },
};
function withGeometryTranslations(round) {
  const creative = round.activities[0]?.kind === 'creative';
  return {
    ...round,
    translations: { th: { title: round.title }, en: { title: `Grade ${round.grade} — ${creative ? 'Make pictures with shapes' : 'Fun with geometry'}` } },
    activities: round.activities.map(activity => {
      const th = { title: activity.title, instruction: activity.instruction };
      let en;
      if (activity.kind === 'creative') en = CREATIVE_ENGLISH[activity.id.split('-').at(-1)];
      else {
        th.shapeName = activity.shapeName;
        const shapeName = localizedShape(activity.shapeId, 'en').name, name = shapeName.toLowerCase();
        en = {
          shapeName,
          title: activity.kind === 'shape-trace' ? `Trace the ${name}` : `Look and draw ${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name}`,
          instruction: activity.kind === 'shape-trace'
            ? `Start at the start dot. Follow every part of the ${name}, then return to the start. Take your time.`
            : `Look at the example ${name}, then draw it in the empty space. Take your time; it does not need to look exactly the same.`,
        };
      }
      return { ...activity, translations: { th, en } };
    }),
  };
}

/** Translate an existing round without shuffling its shapes or changing its IDs. */
export function localizeGeometryRound(round, language = 'th') {
  const locale = language === 'en' ? 'en' : 'th';
  return { ...round, ...round.translations?.[locale], activities: round.activities.map(activity => ({ ...activity, ...activity.translations?.[locale] })) };
}
