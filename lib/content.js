// Original pilot content. This is one mission, not the planned 24-mission library.
export const MISSION_ID = 'G1-M03';
export const CONTENT_VERSION = 'g1-m03-v1';
export const MISSION = {
  id: MISSION_ID,
  version: CONTENT_VERSION,
  title: 'เติมแสงให้สวน',
  story: 'สวนมีแสง 8 ดวง พ่อมดนำมาเพิ่มอีก 6 ดวง ต้องใส่แสงทั้งหมดลงโคมใหญ่',
  question: 'ตอนนี้มีแสงทั้งหมดกี่ดวง?',
  storyChoices: [
    { id: 0, label: 'จำนวนแสงทั้งหมด' },
    { id: 1, label: 'จำนวนแสงที่นำมาเพิ่ม' },
    { id: 2, label: 'จำนวนสวน' },
  ],
  storyExpected: 0,
  model: { start: 8, added: 6, target: 10, maxMoved: 2 },
  equationChoices: [
    { id: 0, label: '8 + 6 = □' },
    { id: 1, label: '8 − 6 = □' },
    { id: 2, label: '6 − 8 = □' },
  ],
  equationExpected: 0,
  baseExpected: 14,
  explanationChoices: [
    { id: 0, label: 'แบ่ง 6 เป็น 2 กับ 4 ย้าย 2 ไปเติม 8 เป็น 10 แล้วเหลือ 4 รวมเป็น 14' },
    { id: 1, label: 'ย้ายแสงแล้วจำนวนรวมเพิ่มขึ้นอีก 2 ดวง' },
    { id: 2, label: 'ย้ายแสงแล้วแสงที่เหลือ 4 ดวงหายไป' },
  ],
  explanationExpected: 0,
  transfer: {
    story: 'มีลูกแก้ว 9 ลูก ได้เพิ่มอีก 6 ลูก',
    question: 'ตอนนี้มีลูกแก้วทั้งหมดกี่ลูก?',
    expected: 15,
  },
  hints: {
    base: [
      'เราต้องหาจำนวนแสงทั้งหมด ลองดูแสงเดิมกับแสงที่เพิ่มเป็นสองกอง',
      '8 ยังขาดอีก 2 จะครบ 10 ลองย้าย 2 ดวงจากกอง 6',
      'เมื่อย้าย 2 ไปเติม 8 จะได้ 10 และอีกกองเหลือ 4 ลองรวม 10 กับ 4',
    ],
    transfer: [
      'เรื่องนี้ถามจำนวนลูกแก้วทั้งหมด ลองรวม 9 กับ 6 ด้วยวิธีที่ถนัด',
      '9 ยังขาดอีก 1 จะครบ 10 ถ้าใช้ 1 จากกอง 6 กองนั้นจะเหลือเท่าไร?',
      'แบ่ง 6 เป็น 1 กับ 5 แล้วรวม 9 กับ 1 เป็น 10 ก่อนรวมกับอีก 5',
    ],
  },
  variants: [
    { id: 'G1-M03-V01', story: 'สวนมีแสง 8 ดวง เพิ่มอีก 6 ดวง รวมกี่ดวง?', equation: '8 + 6 = 14', answer: 14, optional: false },
    { id: 'G1-M03-V02', story: 'โคมมีแสง 7 ดวง พ่อมดเติมอีก 5 ดวง รวมกี่ดวง?', equation: '7 + 5 = 12', answer: 12, optional: true },
    { id: 'G1-M03-V03', story: 'มีแสง 6 ดวง เติมจนมี 13 ดวง ต้องเติมกี่ดวง?', equation: '6 + □ = 13', answer: 7, optional: true },
    { id: 'G1-M03-V04', story: 'เติมแสง 4 ดวง แล้วมีทั้งหมด 12 ดวง เดิมมีกี่ดวง?', equation: '□ + 4 = 12', answer: 8, optional: true },
    { id: 'G1-M03-V05', story: 'มีลูกแก้ว 9 ลูก เพิ่มอีก 6 ลูก รวมกี่ลูก?', equation: '9 + 6 = 15', answer: 15, optional: false },
  ],
};

// A separate, fixed-order challenge. Never mix its score with learning progress.
export const CHALLENGE_DECK = {
  id: 'g1-add-to20', version: '1', grade: 1,
  title: 'ท้าทายบวกไม่เกิน 20',
  questions: [
    { id: 'Q01', prompt: '8 + 6 = ?', answer: 14, hint: '8 + 2 + 4 = 14' },
    { id: 'Q02', prompt: '7 + 5 = ?', answer: 12, hint: '7 + 3 + 2 = 12' },
    { id: 'Q03', prompt: '6 + 7 = ?', answer: 13, hint: '6 + 4 + 3 = 13' },
    { id: 'Q04', prompt: '9 + 4 = ?', answer: 13, hint: '9 + 1 + 3 = 13' },
    { id: 'Q05', prompt: '9 + 6 = ?', answer: 15, hint: '9 + 1 + 5 = 15' },
  ],
};

// Brand contacts supplied in the approved concept; links open only on user action.
export const CONTACTS = [
  { label: 'เว็บไซต์ Math Wizard', url: 'https://www.mathwizardtutor.com/' },
  { label: 'Facebook: Math wizard by DR.Suwan', url: 'https://www.facebook.com/profile.php?id=61585477977024' },
  { label: 'YouTube: MathwizardByDR.Suwan', url: 'https://www.youtube.com/@MathwizardbydrSuwan' },
  { label: 'TikTok: @math.wizard.by.dr.suwan', url: 'https://www.tiktok.com/@math.wizard.by.dr.suwan' },
  { label: 'LINE: wizardmath', url: 'https://line.me/ti/p/~wizardmath' },
  { label: 'โทรศัพท์ +66 81 852 4904', url: 'tel:+66818524904' },
  { label: 'อีเมล wizardsuwan@gmail.com', url: 'mailto:wizardsuwan@gmail.com' },
  { label: 'แผนที่สถาบัน', url: 'https://maps.app.goo.gl/5kgQB1tS5SCjRWA16' },
];
