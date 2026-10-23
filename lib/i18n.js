import { UI_TRANSLATIONS } from './ui-translations.js';
import { updateSeo } from './seo.js';

export const LANGUAGE_KEY = 'mathwizard.app.language.v1';
let language = 'th';
const validLanguage = value => value === 'th' || value === 'en';
export const getLanguage = () => language;
export function initializeLanguage(environment = globalThis) {
  let selected = 'th';
  try { const saved = environment.localStorage?.getItem(LANGUAGE_KEY); if (validLanguage(saved)) selected = saved; } catch { /* Memory-only choice still works. */ }
  try { const requested = new URLSearchParams(environment.location?.search || '').get('lang'); if (validLanguage(requested)) selected = requested; } catch { /* Ignore malformed location. */ }
  language = selected; return language;
}
export function setLanguage(value, environment = globalThis) {
  if (!validLanguage(value)) return false;
  language = value;
  try { environment.localStorage?.setItem(LANGUAGE_KEY, value); } catch { /* Keep the selected language for this session. */ }
  return true;
}
const common = {
  'เกาะคริสตัล': 'Crystal Island',
  'ใหม่ · ผจญภัย 3D ไม่จับเวลา': 'NEW · A 3D adventure at your pace',
  'เกาะคริสตัล · ผจญภัยคณิต 3D': 'Crystal Island · A 3D maths adventure',
  'ย้ายผลึก สร้างสะพาน แลกหลักสิบ · 9 ด่านพื้นฐาน ป.1–2': 'Move crystals, build bridges and trade tens · 9 foundation levels for Grades 1–2',

  'ข้ามไปเนื้อหา': 'Skip to content',
  'Math Wizard กลับหน้าเริ่ม': 'Math Wizard home',
  'เครื่องมือ': 'Tools',
  'สำหรับผู้ปกครอง ↗': 'For parents ↗',
  'สำหรับผู้ปกครอง': 'For parents',
  'รู้จักสถาบัน · สำหรับผู้ปกครอง': 'MEET THE ACADEMY · FOR PARENTS',
  'ต่อยอดความสนุกกับตัวเลข สู่การเรียนรู้ที่เข้าใจ': 'Turn the joy of numbers into understanding',
  'รู้จักสถาบันสอนคณิตศาสตร์ Math Wizard และพูดคุยเรื่องแนวทางเรียนของลูกผ่านช่องทางติดต่อของสถาบัน': 'Meet Math Wizard and contact the academy to discuss your child’s learning path.',
  'ติดต่อสถาบัน ↗': 'Contact the academy ↗',
  'โทร. 081 852 4904': 'Call 081 852 4904',
  'ภาพประชาสัมพันธ์สถาบันสอนคณิตศาสตร์ Math Wizard พร้อมภาพผู้สอนและนักเรียน': 'Math Wizard mathematics academy banner featuring a teacher and students',
  'ภาพจาก Math Wizard': 'Moments at Math Wizard',
  'ภาพผู้สอนกับนักเรียนสามคน ถือช่อดอกไม้และของที่ระลึก': 'A teacher with three students holding bouquets and gifts',
  'ภาพผู้สอนกับนักเรียนสองคน สวมเหรียญและถือช่อดอกไม้': 'A teacher with two students wearing medals and holding bouquets',
  'ภาพผู้สอนและบรรยากาศห้องเรียน Math Wizard': 'A teacher and classroom at Math Wizard',
  'ภาพนักเรียนสวมเหรียญและถือช่อดอกไม้จากสื่อประชาสัมพันธ์ Math Wizard': 'Students wearing medals and holding bouquets in Math Wizard promotional material',
  'ภาพผู้สอนกับนักเรียน พร้อมข้อความเหรียญทอง TMO ในภาพ': 'A teacher and student in a photo labelled TMO gold medal',
  'ภาพผู้สอนกับนักเรียน พร้อมข้อความเหรียญทองแดง TMO ในภาพ': 'A teacher and student in a photo labelled TMO bronze medal',
  'ภาพประชาสัมพันธ์ Math Wizard Academy ธีมพ่อมดคณิตศาสตร์': 'Math Wizard Academy promotional poster with a mathematics wizard theme',
  'ติดต่อและติดตาม Math Wizard': 'Contact and follow Math Wizard',
  'สอบถามรายละเอียดการเรียน แนวทางเรียนของลูก และการเดินทาง เลือกช่องทางที่สะดวกได้เลย': 'Ask about learning options, your child’s learning path, or directions. Choose the contact method that suits you.',
  'สอบถามรายละเอียดการเรียนผ่านแชต': 'Ask about learning options by chat',
  'แชตทาง LINE ↗': 'Chat on LINE ↗',
  'โทรพูดคุยกับสถาบัน · +66 81 852 4904': 'Speak with the academy · +66 81 852 4904',
  'โทรหาสถาบัน ↗': 'Call the academy ↗',
  'ส่งคำถามและรายละเอียดที่ต้องการสอบถาม': 'Send your questions and enquiry details',
  'ส่งอีเมล ↗': 'Send an email ↗',
  'เว็บไซต์สถาบัน': 'Academy website',
  'รู้จักสถาบันและดูข้อมูลการเรียนเพิ่มเติม': 'Learn about the academy and explore learning information',
  'เปิดเว็บไซต์ ↗': 'Visit the website ↗',
  'ที่ตั้งและการเดินทาง': 'Location and directions',
  'สถาบัน Math Wizard · พระรามที่ 4': 'Math Wizard Academy · Rama IV Road',
  '1109 ถนนพระรามที่ 4 แขวงวังใหม่ เขตปทุมวัน กรุงเทพมหานคร 10330': '1109 Rama IV Road, Wang Mai, Pathum Wan, Bangkok 10330',
  'เปิด Google Maps ↗': 'Open Google Maps ↗',
  'ติดตามข่าวสารและวิดีโอจากสถาบัน': 'Follow academy news and videos',
  'ข่าวสารและกิจกรรมของสถาบัน': 'Academy news and activities',
  'เปิด Facebook ↗': 'Open Facebook ↗',
  'เปิด YouTube ↗': 'Open YouTube ↗',
  'ติดตามคลิปสั้นจาก Math Wizard': 'Watch short videos from Math Wizard',
  'เปิด TikTok ↗': 'Open TikTok ↗',
  'ก่อนติดต่อ เตรียมระดับชั้นของลูกและหัวข้อที่อยากสอบถาม เพื่อให้พูดคุยรายละเอียดได้สะดวกขึ้น': 'Have your child’s grade and enquiry topics ready to help the conversation.',
  'ดินสอ 7 สี ✎': '7 pencil colors ✎',
  'เลือกสีดินสอ': 'Choose a pencil color',
  'MATH WIZARD ACADEMY · ฝึกคิดในโลกตัวเลข': 'MATH WIZARD ACADEMY · Explore the world of numbers',
  'เวทมนตร์เริ่มที่': 'The magic starts with',
  'วิธีคิดของเรา': 'how we think',
  'เลือกชั้นของเรา แล้วเขียน วาด ลากเส้น': 'Choose your grade. Write, draw, and trace.',
  'เล่นได้หลายแบบ ตามจังหวะของเรา': 'Play your way, at your own pace.',
  'เลือกระดับชั้น': 'Choose a grade',
  'คิดเลข เข้าใจโจทย์': 'Calculate and understand',
  'เลือกหัวข้อที่อยากฝึก': 'Choose a topic to practise',
  'รอบละ 5 ข้อ · ไม่จับเวลา · ดูวิธีคิดและลองใหม่ได้': '5 questions per round · Untimed · Hints and retries welcome',
  'ชุดฝึกหัวข้อที่คัดสรรตามชั้น ป.1–ป.6': 'Selected practice topics for Grades 1–6',
  'เลือกเกมที่อยากเล่น': 'Choose a game to play',
  'เลือกระดับชั้นด้านบน · เล่นรอบละ 5 ด่าน · แตะ เลือก เรียง และจับคู่ · ลองใหม่ได้': 'Choose a grade above · 5 stages per round · Tap, sort, and match · Try again anytime',
  'วาดรูป สนุกกับเส้น': 'Draw and explore lines',
  'โลกของรูปเรขาคณิต ◯ △ □': 'The world of shapes ◯ △ □',
  'ลากเส้น แล้วลองวาดรูป': 'Trace a shape, then draw it',
  'เลือกเกมวาดรูป': 'Choose a drawing game',
  'ตามเส้น กลับจุดเริ่ม': 'Follow the outline back to the start',
  'ดูตัวอย่าง วาดในช่องว่าง': 'Look at the example and draw',
  'บ้าน จรวด หุ่นยนต์ และสวน': 'Houses, rockets, robots, and gardens',
  'ฝึกเขียนเลข และเล่นกับเส้น ✎': 'Write numbers and explore lines ✎',
  'สลับเขียน ลากเส้น จับคู่ เติมเหรียญ · 14 กิจกรรม': 'Write, trace, match, and add coins · 14 activities',
  'ชุดใหญ่ 32 กิจกรรม': 'Extended set · 32 activities',
  'เขียนเพิ่ม เล่นหลายแบบ · ค่อย ๆ ทำตามจังหวะ': 'More writing and games · Go at your own pace',
  'เลือกเกมฝึกมือ': 'Choose a writing activity',
  '10 แบบ · ลากตามเลข': '10 activities · Trace the numbers',
  '10 แบบ · ดูแล้วลองเขียน': '10 activities · Look, then write',
  '4 ทาง · ฝึกมือเบา ๆ': '4 paths · Gentle motor practice',
  '4 เกม · ลากหรือแตะได้': '4 games · Trace or tap',
  '4 เกม · แตะหรือลากเหรียญ': '4 games · Tap or drag coins',
  'สวนเวทมนตร์กับโคมแสง': 'A magical garden with a lantern',
  'ชุดใหม่เมื่อเริ่มรอบ · 5 ข้อ': 'A new set each round · 5 questions',
  'ภารกิจพร้อมภาพและฝึกเขียน · เฉพาะ ป.1': 'An illustrated writing mission · Grade 1',
  'ฟังเรื่อง จัดแสง และเรียนวิธีทำสิบ': 'Listen, move lights, and learn to make ten.',
  'ภารกิจทำสิบ ป.1 →': 'Grade 1 make-ten mission →',
  'เรียนต่อภารกิจ ป.1': 'Continue Grade 1 mission',
  'เริ่มภารกิจทำสิบใหม่จะเปลี่ยนความคืบหน้าเดิมบนเครื่องนี้ ต้องการเริ่มใหม่ไหม?': 'Starting a new make-ten mission replaces your saved mission progress on this device. Start again?',
  'เริ่มภารกิจใหม่': 'Start a new mission',
  'เก็บภารกิจเดิม': 'Keep current mission',
  'เวลาเดินขึ้น · แยกอันดับตามวิธีตอบและชั้น': 'Timer counts up · Leaderboards by grade and answer method',
  'สวนรวมพลัง · เติมแสงให้สวน': 'The garden mission · Light up the garden',
  'พักก่อน': 'Take a break',
  'ลำดับภารกิจ': 'Mission steps',
  'กลับหน้าเริ่ม': 'Back home',
  'ไม่มีหมดเวลา · ไม่มีคำใบ้ก่อนตอบ · คำตอบแรกครั้งเดียวต่อข้อ': 'No time limit · No hints before answering · One first answer per question',
  'เส้นทางโจทย์ห้าจุด': 'Five-question adventure path',
  'ตอบแล้ว': 'Answered',
  'เวลาที่ใช้': 'Elapsed time',
  'อันดับบนเครื่องนี้': 'Leaderboard on this device',
  'โจทย์แต่ละรอบอาจยากต่างกัน ใช้ดูสถิติการเล่นของตัวเอง': 'Rounds can vary in difficulty. Use these records to follow your own play.',
  'ถูกมากก่อน แล้วเวลาน้อยก่อน': 'More correct answers first, then less time.',
  'คะแนนและเวลาเท่ากันได้อันดับร่วม': 'Equal scores and times share the same rank.',
  'ชื่อสมมติอัตโนมัติ · เฉพาะเบราว์เซอร์นี้': 'Automatic nicknames · This browser only',
  'ไม่รวมคะแนนจากเครื่องอื่น': 'Scores from other devices are not included.',
  'มาเล่นเขียนกัน': "Let's practise writing",
  'ดาวการลงมือทำ': 'Activity stars',
  'เกมคณิตศาสตร์': 'Math games',
  'MATH WIZARD · สำหรับผู้ปกครอง': 'MATH WIZARD · For parents',
  'มองเห็นวิธีคิด แล้วช่วยให้ตรงจุด': 'Understand their thinking and help with the next step',
  'เล่นให้เข้าใจ คิดได้หลายทาง เล่าเหตุผลได้': 'Play to understand. Explore methods. Explain your thinking.',
  'ฝึกเขียน เล่นเส้น ฝึกคิด ป.1–6': 'Write, draw, and think · Grades 1–6',
  'เกมนี้ใช้ JavaScript เพื่อรับคำตอบและแสดงภารกิจ กรุณาเปิด JavaScript แล้วโหลดหน้าใหม่': 'This game needs JavaScript. Enable JavaScript and reload the page.',
  'Math Wizard Quest — ผจญภัยคณิตศาสตร์ ป.1–6': 'Math Wizard Quest — Math adventures for Grades 1–6',
  'โจทย์สุ่ม': 'Random questions', 'ลองคิดด้วยตัวเอง': 'Think it through',
  'Math Wizard Quest เกมเขียนเลข ลากเส้น จับคู่ เติมเหรียญ และโจทย์สุ่ม ป.1–6 พร้อมภารกิจทำสิบสำหรับ ป.1': 'Math Wizard Quest: bilingual Thai–English math games, writing and drawing for Grades 1–6, with a Grade 1 make-ten mission.',
  'สวนมีแสง 8 ดวง พ่อมดนำมาเพิ่มอีก 6 ดวง ต้องใส่แสงทั้งหมดลงโคมใหญ่': 'The garden has 8 lights. The wizard brings 6 more. All the lights will go in the big lantern.',
  'ตอนนี้มีแสงทั้งหมดกี่ดวง?': 'How many lights are there altogether now?',
  'จำนวนแสงทั้งหมด': 'The total number of lights',
  'จำนวนแสงที่นำมาเพิ่ม': 'The number of added lights',
  'จำนวนสวน': 'The number of gardens',
  'เท่าเดิม เพราะแค่ย้ายแสงไปอีกกอง': 'The same, because the lights only moved between groups',
  'มากขึ้น เพราะมีแสงเพิ่มเข้ามา': 'More, because new lights were added',
  'น้อยลง เพราะมีแสงหายไป': 'Fewer, because some lights disappeared',
  'มีลูกแก้ว 9 ลูก ได้เพิ่มอีก 6 ลูก': 'There are 9 marbles. Another 6 marbles are added.',
  'ตอนนี้มีลูกแก้วทั้งหมดกี่ลูก?': 'How many marbles are there altogether now?',
  'เราต้องหาจำนวนแสงทั้งหมด ลองดูแสงเดิมกับแสงที่เพิ่มเป็นสองกอง': 'We need the total number of lights. Look at the original lights and the added lights as two groups.',
  '8 ยังขาดอีก 2 จะครบ 10 ลองย้าย 2 ดวงจากกอง 6': '8 needs 2 more to make 10. Try moving 2 lights from the group of 6.',
  'เมื่อย้าย 2 ไปเติม 8 จะได้ 10 และอีกกองเหลือ 4 ลองรวม 10 กับ 4': 'Moving 2 to join 8 makes 10 and leaves 4 in the other group. Try adding 10 and 4.',
  'เรื่องนี้ถามจำนวนลูกแก้วทั้งหมด ลองรวม 9 กับ 6 ด้วยวิธีที่ถนัด': 'This story asks for all the marbles. Combine 9 and 6 using your own method.',
  '9 ยังขาดอีก 1 จะครบ 10 ถ้าใช้ 1 จากกอง 6 กองนั้นจะเหลือเท่าไร?': '9 needs 1 more to make 10. If you take 1 from the group of 6, how many are left?',
  'แบ่ง 6 เป็น 1 กับ 5 แล้วรวม 9 กับ 1 เป็น 10 ก่อนรวมกับอีก 5': 'Split 6 into 1 and 5. Add 9 and 1 to make 10, then add the remaining 5.',
  'เว็บไซต์ Math Wizard': 'Math Wizard website',
  'โทรศัพท์': 'Phone',
  'อีเมล': 'Email',
  'แผนที่สถาบัน': 'Academy map',
  'เล่นได้ในครั้งนี้ แต่ปิดหน้าแล้วข้อมูลอาจหาย': 'You can play now, but progress may be lost when you close the page.',
  'ข้อมูลการเรียนและอันดับเก็บเฉพาะเบราว์เซอร์นี้': 'Learning progress and leaderboards are stored in this browser only.',
  'บันทึกถาวรไม่ได้ ข้อมูลใหม่อยู่เฉพาะระหว่างเปิดหน้านี้': 'Permanent storage is unavailable. New records last only while this page stays open.',
  'ข้อมูลเดิมอ่านไม่ได้หรือเป็นคนละรุ่น เริ่มรอบใหม่ได้': 'The old record is unreadable or from another version. You can start a new round.',
  'บันทึกบนเบราว์เซอร์นี้แล้ว': 'Saved in this browser.',
  'ข้อมูลช่วงนี้ยังไม่ครบ จึงยังไม่บันทึกจุดเรียนต่อ': 'This step is not complete, so no checkpoint was saved yet.',
  'เริ่มประวัติการเรียนใหม่บนเครื่องนี้แล้ว': 'Learning progress on this device has been reset.',
  'ล้างได้เฉพาะครั้งนี้ เมื่อเปิดใหม่ข้อมูลเดิมอาจกลับมา': 'Progress was cleared for this session only. Old records may return when you reopen the page.',
  'รอบท้าทายนี้ไม่อยู่ในเงื่อนไขการจัดอันดับ': 'This round does not meet the leaderboard requirements.',
  'แดง': 'red', 'ส้ม': 'orange', 'เหลือง': 'yellow', 'เขียว': 'green', 'ฟ้า': 'sky blue', 'น้ำเงิน': 'blue', 'ม่วง': 'purple',
  'โจทย์คิดเลข': 'Math practice', 'ท้าทายเขียน 5 ข้อ': 'Writing challenge · 5 questions', 'ท้าทายพิมพ์ 5 ข้อ': 'Keypad challenge · 5 questions',
  'ท้าทายเขียนคำตอบของชั้นนี้': 'Writing challenge for this grade', 'ท้าทายพิมพ์คำตอบของชั้นนี้': 'Keypad challenge for this grade',
};
const translations = { ...UI_TRANSLATIONS, ...common };
const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = new RegExp(Object.keys(translations).sort((a, b) => b.length - a.length).map(escaped).join('|'), 'g');
/** Interface text boundary. Stable IDs and mathematical data are never translated. */
export function t(value) {
  if (typeof value !== 'string' || language === 'th') return value;
  if (Object.hasOwn(translations, value)) return translations[value];
  return value.replace(pattern, match => translations[match]);
}
export function translateStatic(document) {
  for (const item of document.querySelectorAll('[data-i18n-text]')) item.textContent = t(item.getAttribute('data-i18n-text'));
  for (const item of document.querySelectorAll('[data-i18n-aria-label]')) item.setAttribute('aria-label', t(item.getAttribute('data-i18n-aria-label')));
  if (document.documentElement) document.documentElement.lang = language;
  updateSeo(document, language);
}
