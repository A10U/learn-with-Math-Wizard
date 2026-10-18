// Template translations for the generated games. Numbers, mathematical symbols,
// baht amounts and answer IDs stay identical in both languages.
const fixed = new Map([
  ['ถูก', 'True'], ['ผิด', 'False'],
  ['เรียงจำนวนจากน้อยไปมาก', 'Arrange the numbers from smallest to largest'],
  ['จับคู่โจทย์ทางซ้ายกับคำตอบที่มีค่าเท่ากันทางขวา', 'Match each calculation on the left to its equal value on the right'],
  ['รูปใดไม่มีมุม?', 'Which shape has no corners?'],
  ['รูปวงกลมเป็นเส้นโค้งต่อกัน ไม่มีมุม', 'A circle is a continuous curved line with no corners.'],
  ['รูปวงกลม', 'Circle'], ['รูปสามเหลี่ยม', 'Triangle'], ['รูปสี่เหลี่ยมจัตุรัส', 'Square'],
  ['ภาพนี้มีวงกลมที่ระบายสีกี่วง?', 'How many circles are colored?'],
  ['ส่วนที่ระบายสีเป็นเศษส่วนเท่าไรของวงกลมทั้งหมด?', 'What fraction of all the circles is colored?'],
  ['ส่วนที่ระบายสีคิดเป็นกี่เปอร์เซ็นต์ของวงกลมทั้งหมด?', 'What percentage of all the circles is colored?'],
  ['ส่วนที่ระบายสีคิดเป็นทศนิยมเท่าไรของวงกลมทั้งหมด?', 'What decimal represents the colored part of all the circles?'],
  ['กลับไปเลือกเกม', 'Back to games'],
  ['เล่นครบแล้ว เก็บดาวได้เต็มเลย!', 'Round complete! You earned every star!'],
  ['ดาวมาจากการคิดสำเร็จ ลองใหม่และขอความช่วยเหลือได้', 'Earn stars by solving each task. You can retry and ask for help.'],
  ['สุ่มเล่นเกมนี้อีก', 'Play a new round'], ['เลือกเกมอื่น', 'Choose another game'],
  ['แตะจำนวนจากน้อยไปมาก แล้วกดตรวจลำดับ', 'Tap the numbers from smallest to largest, then check your order.'],
  ['ลำดับที่เลือก', 'Your selected order'], ['ย้อนตัวล่าสุด', 'Undo last number'], ['ตรวจลำดับ', 'Check order'],
  ['เลือกโจทย์ฝั่งซ้าย แล้วเลือกคำตอบฝั่งขวา', 'Choose a calculation on the left, then its answer on the right.'],
  ['เปิดวิธีคิดแล้ว', 'Hint shown'], ['ดูวิธีคิด', 'Show hint'],
  ['รับตราจบรอบ →', 'Finish round →'], ['ด่านต่อไป →', 'Next task →'],
  ['ยังไม่ตรง ลองคิดอีกครั้ง หรือเปิดวิธีคิดได้', 'Try again, or open the hint for help.'],
  ['ลองตรวจจากน้อยไปมาก กดย้อนตัวล่าสุดเพื่อจัดใหม่ได้', 'Check from smallest to largest. Use Undo last number to change the order.'],
  ['เลือกคำตอบฝั่งขวาที่เข้าคู่กัน', 'Choose the matching answer on the right.'],
  ['จับคู่ได้แล้ว! ลองคู่ถัดไป', 'A match! Try the next pair.'],
  ['คู่นี้ยังไม่ตรง ลองเลือกใหม่ได้', 'These do not match yet. Try another pair.'],
]);

const unitNames = { เซนติเมตร: 'cm', เมตร: 'm', กิโลเมตร: 'km', กรัม: 'g', กิโลกรัม: 'kg', ลิตร: 'L', มิลลิลิตร: 'mL' };
const shapeNames = { รูปสามเหลี่ยม: 'triangle', รูปสี่เหลี่ยม: 'quadrilateral', รูปห้าเหลี่ยม: 'pentagon', รูปหกเหลี่ยม: 'hexagon', รูปสี่เหลี่ยมจัตุรัส: 'square' };

const templates = [
  [/^ป\.(\d+) · เกมคณิตศาสตร์$/, (_, grade) => `Grade ${grade} · Math games`],
  [/^✦ ดาวที่คิดสำเร็จ (\d+) \/ (\d+) · ไม่จับเวลา$/, (_, stars, total) => `✦ Stars earned ${stars} / ${total} · No timer`],
  [/^ฝึกสำเร็จ (\d+) กิจกรรม · เปิดวิธีคิด (\d+) กิจกรรม$/, (_, done, hints) => `${done} tasks completed · Hints used on ${hints} tasks`],
  [/^ด่าน (\d+) \/ (\d+)$/, (_, index, total) => `Task ${index} / ${total}`],
  [/^แบ่งเป็น (\d+) ส่วนเท่ากัน ระบายสี (\d+) ส่วน$/, (_, total, filled) => `${total} equal parts; ${filled} colored parts`],
  [/^สำเร็จแล้ว! ✦ (.+)$/, (_, hint) => `Solved! ✦ ${englishArcadeText(hint)}`],
  [/^(.+) ถูกหรือผิด\?$/, (_, equation) => `${englishArcadeText(equation)} — true or false?`],
  [/^(.+) □ (.+) เลือกเครื่องหมายให้ถูกต้อง$/, (_, left, right) => `${left} □ ${right} — choose the correct sign`],
  [/^ตัวส่วนเท่ากัน เปรียบเทียบตัวเศษ (.+) กับ (.+) ดังนั้น (.+)$/, (_, a, b, relation) => `The denominators are equal. Compare the numerators ${a} and ${b}: ${relation}`],
  [/^จากน้อยไปมาก: (.+)$/, (_, order) => `Smallest to largest: ${order}`],
  [/^ซื้อดินสอราคา ([\d.]+) บาท จ่าย ([\d.]+) บาท ได้เงินทอนกี่บาท\?$/, (_, cost, paid) => `A pencil costs ${cost} baht. You pay ${paid} baht. How much change do you get?`],
  [/^ซื้อสมุด (\d+) เล่ม เล่มละ ([\d.]+) บาท(?: ลด (\d+)% ของราคารวม)? จ่าย ([\d.]+) บาท ได้เงินทอนกี่บาท\?$/, (_, count, price, rate, paid) => `You buy ${count} notebooks at ${price} baht each.${rate ? ` The total price is discounted by ${rate}%.` : ''} You pay ${paid} baht. How much change do you get?`],
  [/^ริบบิ้นยาว (\d+) เซนติเมตร ต่ออีก (\d+) เซนติเมตร รวมยาวกี่เซนติเมตร\?$/, (_, a, b) => `A ribbon is ${a} cm long. Add another ${b} cm. What is its total length in cm?`],
  [/^([\d.]+) (\S+) เท่ากับกี่([^?]+)\?$/, (_, amount, from, to) => `How many ${unitNames[to]} are equal to ${amount} ${unitNames[from]}?`],
  [/^(\d+) (\S+) (\d+) (\S+) รวมเป็นกี่([^?]+)\?$/, (_, whole, from, small, to, target) => `Convert ${whole} ${unitNames[from]} and ${small} ${unitNames[to]} to ${unitNames[target]}.`],
  [/^(.+), \? แบบรูปนี้คูณด้วย (.+) จำนวนถัดไปคืออะไร\?$/, (_, shown, factor) => `${shown}, ? Multiply by ${factor} each time. What is the next number?`],
  [/^(.+), \? แบบรูปนี้เพิ่มทีละ (.+) จำนวนถัดไปคืออะไร\?$/, (_, shown, step) => `${shown}, ? Add ${step} each time. What is the next number?`],
  [/^(รูป[^ ]+)มีด้านตรงกี่ด้าน\?$/, (_, shape) => `How many straight sides does a ${shapeNames[shape]} have?`],
  [/^(รูป[^ ]+)มีด้านตรง (\d+) ด้าน นับขอบรูปทีละด้าน$/, (_, shape, sides) => `A ${shapeNames[shape]} has ${sides} straight sides. Count each edge.`],
  [/^รูปใดมีด้านตรง (\d+) ด้าน และมี (\d+) มุม\?$/, (_, sides, corners) => `Which shape has ${sides} straight sides and ${corners} corners?`],
  [/^(รูป[^ ]+)มีด้านตรง (\d+) ด้าน และมี (\d+) มุม$/, (_, shape, sides, corners) => `A ${shapeNames[shape]} has ${sides} straight sides and ${corners} corners.`],
  [/^เดินตามเส้นทาง 4 ช่วง ยาว (\d+), (\d+), (\d+), (\d+) ซม\. ตามลำดับ รวมเดินกี่ซม\.\?$/, (_, a, b, c, d) => `A route has 4 sections measuring ${a}, ${b}, ${c} and ${d} cm. What is the total distance in cm?`],
  [/^รูปสี่เหลี่ยมผืนผ้ากว้าง (\d+) ซม\. ยาว (\d+) ซม\. มีพื้นที่กี่ตารางซม\.\?$/, (_, width, length) => `A rectangle is ${width} cm wide and ${length} cm long. What is its area in square cm?`],
  [/^รูปสี่เหลี่ยมด้านขนานฐาน (\d+) ซม\. สูงตั้งฉากกับฐาน (\d+) ซม\. มีพื้นที่กี่ตารางซม\.\?$/, (_, base, height) => `A parallelogram has a base of ${base} cm and a perpendicular height of ${height} cm. What is its area in square cm?`],
  [/^รูปสามเหลี่ยมฐาน (\d+) ซม\. สูงตั้งฉากกับฐาน (\d+) ซม\. มีพื้นที่กี่ตารางซม\.\?$/, (_, base, height) => `A triangle has a base of ${base} cm and a perpendicular height of ${height} cm. What is its area in square cm?`],
  [/^กล่องทรงสี่เหลี่ยมมุมฉากกว้าง (\d+) ซม\. ยาว (\d+) ซม\. สูง (\d+) ซม\. มีปริมาตรกี่ลูกบาศก์ซม\.\?$/, (_, width, length, height) => `A rectangular box is ${width} cm wide, ${length} cm long and ${height} cm high. What is its volume in cubic cm?`],
  [/^วงกลมรัศมี (\d+) ซม\. มีความยาวรอบวงกี่ซม\.\? กำหนด π = 3\.14$/, (_, radius) => `A circle has a radius of ${radius} cm. What is its circumference in cm? Use π = 3.14.`],
  [/^นับเฉพาะวงที่ระบายสี ได้ (\d+) วง จากทั้งหมด (\d+) วง$/, (_, filled, total) => `Count only the colored circles: ${filled} out of ${total} circles.`],
  [/^ระบายสี (\d+) ส่วน จากทั้งหมด (\d+) ส่วนเท่า ๆ กัน จึงเป็น (.+)$/, (_, filled, total, fraction) => `${filled} of ${total} equal parts are colored: ${fraction}`],
];

// Calculation hints are short formula phrases and can share these substitutions.
// Longer units come first so a unit such as กิโลเมตร cannot be partially replaced.
const formulaPhrases = [
  ['ตัวส่วนเท่ากัน ลบตัวเศษ: ', 'Equal denominators: subtract the numerators. '],
  ['ตัวส่วนเท่ากัน บวกตัวเศษ: ', 'Equal denominators: add the numerators. '],
  ['ทำส่วนให้เท่ากัน: ', 'Use a common denominator: '],
  ['คูณเศษกับเศษ ส่วนกับส่วน: ', 'Multiply the numerators and multiply the denominators: '],
  ['คูณด้วยส่วนกลับ: ', 'Multiply by the reciprocal: '],
  ['ตัวหารร่วม: ', 'Common factors: '], [' จึงมี ห.ร.ม. = ', '; the GCF is '],
  ['ใช้ ค.ร.น. ของตัวส่วน ', 'Use the LCM of the denominators, '],
  ['บวกความยาวทั้งสี่ช่วง: ', 'Add all four lengths: '],
  ['ฐาน × ความสูงตั้งฉาก', 'base × perpendicular height'],
  ['กว้าง × ยาว × สูง', 'width × length × height'], ['กว้าง × ยาว', 'width × length'],
  ['2 × π × รัศมี', '2 × π × radius'],
  ['ราคารวม ', 'Total price: '], [' เงินทอน ', '; change: '],
  [' ลด ', '; discount '], [' คือ ', ' = '], [' เหลือ ', '; remaining price: '],
  [' คูณ 100 ได้ ', ' × 100 = '], [' ดังนั้น ', '; therefore '],
  ['ห.ร.ม.', 'GCF'], ['ค.ร.น.', 'LCM'], [' ของ ', ' of '], [' และ ', ' and '],
  ['ลูกบาศก์ซม.', 'cubic cm'], ['ตารางซม.', 'square cm'], ['ซม.', 'cm'],
  ['กิโลเมตร', 'km'], ['เซนติเมตร', 'cm'], ['กิโลกรัม', 'kg'], ['มิลลิลิตร', 'mL'],
  ['เมตร', 'm'], ['กรัม', 'g'], ['ลิตร', 'L'], ['บาท', 'baht'],
];

export function englishArcadeText(value) {
  const text = String(value);
  if (fixed.has(text)) return fixed.get(text);
  for (const [pattern, replacement] of templates) {
    if (pattern.test(text)) return text.replace(pattern, replacement);
  }
  return formulaPhrases.reduce((result, [thai, english]) => result.replaceAll(thai, english), text);
}

export const arcadeText = (text, language) => language === 'en' ? englishArcadeText(text) : text;
