// Untimed shop arithmetic. Money is always an integer Gem unit.
// One round awards 100 service points + its net sales + satisfaction (40–100)
// + accuracy (100 minus 20 per unsuccessful check, bounded at zero).
const text = (th, en) => ({ th, en });
const freeze = object => {
  if (object && typeof object === 'object') {
    Object.values(object).forEach(freeze);
    Object.freeze(object);
  }
  return object;
};
export const GEM_DENOMINATIONS = freeze([
  { id: 'azure', value: 1, color: '#69c9ef', name: text('อความารีน', 'Aquamarine') },
  { id: 'emerald', value: 5, color: '#54d6a0', name: text('มรกต', 'Emerald') },
  { id: 'ruby', value: 10, color: '#ee7d8f', name: text('ทับทิม', 'Ruby') },
  { id: 'amethyst', value: 50, color: '#b29af5', name: text('อเมทิสต์', 'Amethyst') },
]);
export const GEM_CATALOG = freeze([
  { id: 'potion', name: text('น้ำยาละอองดาว', 'Stardust potion'), icon: '⚗', price: 3 },
  { id: 'ink', name: text('หมึกจันทรา', 'Moon ink'), icon: '✒', price: 4 },
  { id: 'crystal', name: text('ลูกแก้วพยากรณ์', 'Crystal orb'), icon: '🔮', price: 6 },
  { id: 'wand', name: text('ไม้กายสิทธิ์', 'Magic wand'), icon: '🪄', price: 7 },
  { id: 'book', name: text('ตำราเวทมนตร์', 'Spellbook'), icon: '📖', price: 9 },
  { id: 'hat', name: text('หมวกแม่มด', 'Witch hat'), icon: '🎩', price: 12 },
  { id: 'broom', name: text('ไม้กวาดเหาะ', 'Flying broom'), icon: '🧹', price: 18 },
  { id: 'cloak', name: text('ผ้าคลุมจันทรา', 'Moon cloak'), icon: '🧥', price: 25 },
  { id: 'cauldron', name: text('หม้อปรุงยา', 'Potion cauldron'), icon: '♨', price: 45 },
]);
export const GEM_DIFFICULTIES = freeze([
  { id: 'beginner', name: text('ร้านเล็กเริ่มฝึก', 'Little shop'), maxTotal: 20, maxLines: 1, maxQuantity: 1 },
  { id: 'apprentice', name: text('ผู้ช่วยพ่อมด', 'Wizard apprentice'), maxTotal: 100, maxLines: 2, maxQuantity: 2 },
  { id: 'master', name: text('เจ้าของร้านเวทมนตร์', 'Master merchant'), maxTotal: 300, maxLines: 3, maxQuantity: 3 },
]);
const CUSTOMERS = freeze([
  { name: text('แม่มดลูน่า', 'Witch Luna'), role: 'witch', portrait: '🧙‍♀️' },
  { name: text('พ่อมดโอลิเวอร์', 'Wizard Oliver'), role: 'wizard', portrait: '🧙‍♂️' },
  { name: text('แม่มดไอริส', 'Witch Iris'), role: 'witch', portrait: '🧝‍♀️' },
  { name: text('พ่อมดเมอร์ลิน', 'Wizard Merlin'), role: 'wizard', portrait: '🧙' },
  { name: text('แม่มดเฮเซล', 'Witch Hazel'), role: 'witch', portrait: '🧚‍♀️' },
  { name: text('พ่อมดโนวา', 'Wizard Nova'), role: 'wizard', portrait: '🧝‍♂️' },
]);
const configOf = difficulty => GEM_DIFFICULTIES.find(entry => entry.id === difficulty) || GEM_DIFFICULTIES[0];
const emptyGems = () => Object.fromEntries(GEM_DENOMINATIONS.map(gem => [gem.id, 0]));
const attemptsEmpty = () => ({ cart: 0, total: 0, change: 0 });
const local = (value, language) => value[language === 'en' ? 'en' : 'th'];
const outcome = (state, code, tone, message) => ({ ...state, feedback: { code, tone, message, text: local(message, state.language) } });
const totalOrder = (order, prices) => order.reduce((sum, line) => sum + prices[line.itemId] * line.quantity, 0);
const int = value => Number.isSafeInteger(value) && value >= 0;
const countErrors = attempts => attempts.cart + attempts.total + attempts.change;

export function gemShopCatalog(difficulty = 'beginner', customer = null) {
  const catalog = configOf(difficulty).id === 'beginner' ? GEM_CATALOG.slice(0, 7) : GEM_CATALOG.slice();
  return catalog.map(item => ({
    ...item, basePrice: item.price,
    previousPrice: customer?.previousPrices?.[item.id] ?? item.price,
    price: customer?.prices?.[item.id] ?? item.price,
  }));
}

// A small supply/demand model: one stated factor changes while other factors
// stay equal. Events happen between customers, never while a bill is active.
function marketEvent(index, deliveryItem) {
  return [
    {
      kind: 'baseline', itemId: null, direction: 0,
      headline: text('เช้าเปิดร้าน · ราคาตั้งต้น', 'Opening time · Starting prices'),
      detail: text('วันนี้เริ่มขายตามราคาป้าย แล้วดูว่าเหตุการณ์ในหมู่บ้านทำให้ความต้องการซื้อหรือปริมาณสินค้าเปลี่ยนอย่างไร ราคาจะปรับก่อนรับลูกค้าคนถัดไป', 'Start with the shelf prices. Village events will change demand or supply, with prices updated before the next customer arrives.'),
      question: text('ดูราคาปัจจุบันบนชั้น แล้วคิดราคารวมของรายการที่ลูกค้าซื้อ', 'Use the current shelf prices to calculate this customer’s total.'),
    },
    {
      kind: 'demand-up', itemId: 'broom', direction: 1,
      headline: text('เทศกาลแข่งไม้กวาด · คนอยากซื้อเพิ่ม', 'Broom race festival · Demand rises'),
      detail: text('พ่อมดแม่มดอยากได้ไม้กวาดไปแข่งมากขึ้น แต่ร้านมีไม้กวาดเท่าเดิม ความต้องการซื้อเพิ่มขณะที่สินค้ามีเท่าเดิม ร้านจึงปรับราคาไม้กวาดขึ้น', 'More witches and wizards want racing brooms, while the number of brooms available stays the same. Demand rises with supply unchanged, so the shop raises the broom price.'),
      question: text('ราคาไม้กวาดเปลี่ยนไปแล้ว ลูกค้ารายนี้ต้องจ่ายรวมเท่าไร?', 'The broom price has changed. How much does this customer need to pay in total?'),
    },
    {
      kind: 'supply-up', itemId: 'potion', direction: -1,
      headline: text('เก็บสมุนไพรได้มาก · น้ำยาเพิ่มบนชั้น', 'A plentiful herb harvest · Supply rises'),
      detail: text('สมุนไพรเก็บเกี่ยวได้มาก จึงปรุงน้ำยามาขายได้มากขึ้น แต่จำนวนคนอยากซื้อยังเท่าเดิม เมื่อสินค้ามีเพิ่ม ร้านจึงปรับราคาน้ำยาลง', 'A plentiful herb harvest lets suppliers make more potions, while the number of buyers stays the same. With more potions available, the shop lowers the potion price.'),
      question: text('น้ำยาลดราคาแล้ว ลองใช้ราคาปัจจุบันคิดยอดซื้อของลูกค้า', 'Potions now cost less. Use the new price to calculate this customer’s bill.'),
    },
    {
      kind: 'supply-down', itemId: deliveryItem, direction: 1,
      headline: text('สะพานขนส่งปิด · สินค้าเข้าร้านน้อยลง', 'The delivery bridge closes · Supply falls'),
      detail: deliveryItem === 'crystal'
        ? text('สะพานปิดทำให้ส่งลูกแก้วมาขายได้น้อยลง แต่คนยังอยากซื้อเท่าเดิม เมื่อสินค้ามีน้อยลง ร้านจึงปรับราคาลูกแก้วขึ้น', 'A closed bridge means fewer crystal orbs can reach the shop, while demand stays the same. With fewer orbs available, the shop raises their price.')
        : text('สะพานปิดทำให้ส่งตำราเวทมนตร์มาขายได้น้อยลง แต่คนยังอยากซื้อเท่าเดิม เมื่อสินค้ามีน้อยลง ร้านจึงปรับราคาตำราขึ้น', 'A closed bridge means fewer spellbooks can reach the shop, while demand stays the same. With fewer spellbooks available, the shop raises their price.'),
      question: text('สินค้าส่งมาน้อยลงและราคาเปลี่ยนแล้ว ลูกค้าต้องจ่ายเท่าไร?', 'Supply has fallen and the price has changed. How much must the customer pay?'),
    },
    {
      kind: 'demand-down', itemId: 'hat', direction: -1,
      headline: text('งานเต้นรำจบแล้ว · คนซื้อหมวกลดลง', 'The dance is over · Demand falls'),
      detail: text('หลังจบงานเต้นรำ มีคนอยากซื้อหมวกน้อยลง แต่จำนวนหมวกที่ขายยังเท่าเดิม เมื่อความต้องการซื้อลดลง ร้านจึงปรับราคาหมวกลง', 'After the dance, fewer people want to buy hats, while the number of hats for sale stays the same. With lower demand, the shop lowers the hat price.'),
      question: text('หมวกปรับราคาลงแล้ว รวมราคาสินค้าตามรายการให้ลูกค้าหน่อย', 'Hats now cost less. Calculate the total for the customer’s list.'),
    },
  ][index];
}

// Partial bundles are valid; unknown Gem IDs, strings and negative/fractional
// counts are invalid. NaN prevents a malformed bundle matching a money amount.
export function gemBundleValue(bundle) {
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) return NaN;
  let total = 0;
  for (const [id, count] of Object.entries(bundle)) {
    const gem = GEM_DENOMINATIONS.find(entry => entry.id === id);
    if (!gem || !int(count) || count > 999) return NaN;
    total += gem.value * count;
  }
  return total;
}
function bundleFor(amount) {
  const bundle = emptyGems();
  for (const gem of [...GEM_DENOMINATIONS].reverse()) {
    bundle[gem.id] = Math.floor(amount / gem.value);
    amount %= gem.value;
  }
  return bundle;
}

export function createGemShop({ difficulty = 'beginner', language = 'th', random = Math.random } = {}) {
  const config = configOf(difficulty), catalog = gemShopCatalog(config.id);
  const roll = max => {
    const value = typeof random === 'function' ? random() : 0;
    return Math.floor((Number.isFinite(value) ? Math.min(0.999999999, Math.max(0, value)) : 0) * max);
  };
  const customerStart = roll(CUSTOMERS.length);
  const deliveryItem = roll(2) ? 'book' : 'crystal';
  let previousPrices = Object.fromEntries(catalog.map(item => [item.id, item.price]));
  const customers = Array.from({ length: 5 }, (_, index) => {
    const event = marketEvent(index, deliveryItem), prices = { ...previousPrices };
    const oldPrice = event.itemId ? previousPrices[event.itemId] : null;
    if (event.itemId) {
      const step = config.id === 'beginner' ? 1 : Math.max(1, Math.round(oldPrice * 0.2));
      prices[event.itemId] = Math.max(1, oldPrice + event.direction * step);
    }
    const market = {
      ...event, previousPrice: oldPrice,
      price: event.itemId ? prices[event.itemId] : null,
      delta: event.itemId ? prices[event.itemId] - oldPrice : 0,
    };
    const count = config.id === 'beginner' ? 1 : config.id === 'master' ? 2 + index % 2 : 1 + index % 2;
    const start = (roll(catalog.length) + index) % catalog.length;
    const target = event.itemId || catalog[start].id;
    const otherIds = catalog.slice(start).concat(catalog.slice(0, start)).map(item => item.id).filter(id => id !== target);
    const order = [target, ...otherIds.slice(0, count - 1)].map((itemId, line) => ({
      itemId,
      quantity: config.maxQuantity === 1 ? 1 : 1 + (roll(config.maxQuantity) + index + line) % config.maxQuantity,
    }));
    // Keep every generated bill inside the selected arithmetic range.
    while (totalOrder(order, prices) > config.maxTotal) {
      const line = order.find(entry => entry.quantity > 1);
      if (line) line.quantity--;
      else order.pop();
    }
    const total = totalOrder(order, prices);
    const unit = config.id === 'beginner' ? 5 : config.id === 'apprentice' ? 10 : 50;
    // Include an exact-payment customer to practise zero change as well.
    const paid = index === 3 ? total : Math.ceil((total + 1) / unit) * unit;
    const customer = freeze({
      ...CUSTOMERS[(customerStart + index) % CUSTOMERS.length], id: `customer-${index + 1}`,
      order, total, paid, payment: bundleFor(paid), market, prices, previousPrices: { ...previousPrices },
    });
    previousPrices = prices;
    return customer;
  });
  return {
    difficulty: config.id, language: language === 'en' ? 'en' : 'th', customers,
    customerIndex: 0, phase: 'stock', cart: {}, totalInput: '', change: emptyGems(),
    attempts: attemptsEmpty(), feedback: null, ledger: [],
  };
}

export function currentGemCustomer(state) {
  return state.phase === 'finished' ? null : state.customers[state.customerIndex] || null;
}

export function gemShopScore(state) {
  const served = state.ledger.length;
  const earned = state.ledger.reduce((sum, receipt) => sum + receipt.sale, 0);
  const satisfactionPoints = state.ledger.reduce((sum, receipt) => sum + receipt.satisfaction, 0);
  const accuracyPoints = state.ledger.reduce((sum, receipt) => sum + receipt.accuracyPoints, 0);
  const servicePoints = served * 100, earningsPoints = earned;
  return {
    served, earned, satisfaction: served ? Math.round(satisfactionPoints / served) : 100,
    accuracyPoints, servicePoints, earningsPoints, satisfactionPoints,
    total: servicePoints + earningsPoints + satisfactionPoints + accuracyPoints,
  };
}
function retry(state, category, code, message) {
  return outcome({ ...state, attempts: { ...state.attempts, [category]: state.attempts[category] + 1 } }, code, 'retry', message);
}
function validCart(cart, catalog) {
  return cart && typeof cart === 'object' && !Array.isArray(cart) && Object.entries(cart).every(([id, quantity]) => catalog.some(item => item.id === id) && int(quantity) && quantity <= 9);
}
function matchingCart(cart, order) {
  return Object.keys(cart).filter(id => cart[id] > 0).length === order.length && order.every(line => cart[line.itemId] === line.quantity);
}

export function actGemShop(state, action) {
  if (!state || state.phase === 'finished' || !action || typeof action !== 'object') return state;
  const customer = currentGemCustomer(state);
  if (!customer) return state;
  if (action.type === 'cart' && state.phase === 'stock') {
    if (!gemShopCatalog(state.difficulty).some(item => item.id === action.itemId) || ![-1, 1].includes(action.delta)) return state;
    const count = (state.cart[action.itemId] || 0) + action.delta;
    if (!int(count) || count > 9) return state;
    const cart = { ...state.cart, [action.itemId]: count };
    if (!count) delete cart[action.itemId];
    return { ...state, cart, feedback: null };
  }
  if (action.type === 'check-cart' && state.phase === 'stock') {
    if (!validCart(state.cart, gemShopCatalog(state.difficulty))) return state;
    if (!matchingCart(state.cart, customer.order)) return retry(state, 'cart', 'cart-mismatch', text('ลองดูรายการที่ลูกค้าขออีกครั้ง ชนิดและจำนวนต้องตรงกัน', 'Check the customer’s list again. Match both the items and their quantities.'));
    return outcome({ ...state, phase: 'total' }, 'cart-correct', 'success', text('จัดของครบแล้ว ลองคิดราคารวมด้วยตัวเอง', 'The order is ready. Work out the total price.'));
  }
  if (action.type === 'total' && state.phase === 'total') {
    if (typeof action.value !== 'string' && typeof action.value !== 'number') return state;
    const value = String(action.value);
    if (!/^\d{0,4}$/.test(value)) return state;
    return { ...state, totalInput: value, feedback: null };
  }
  if (action.type === 'check-total' && state.phase === 'total') {
    if (!/^\d{1,4}$/.test(state.totalInput)) return outcome(state, 'total-empty', 'retry', text('ใส่ราคารวมเป็นจำนวนเต็มก่อนนะ', 'Enter the total as a whole number first.'));
    const value = Number(state.totalInput);
    if (value !== customer.total) return retry(state, 'total', value < customer.total ? 'total-low' : 'total-high', value < customer.total
      ? text('ราคารวมยังน้อยไป ลองรวมราคาของทุกชิ้นอีกครั้ง', 'That total is too low. Add the price of every item again.')
      : text('ราคารวมยังมากไป ลองตรวจราคาและจำนวนของแต่ละชิ้น', 'That total is too high. Check each item’s price and quantity.'));
    return outcome({ ...state, phase: 'change' }, 'total-correct', 'success', text('คิดราคารวมถูกแล้ว! ลูกค้าชำระด้วย Gem ลองทอนให้พอดี', 'Correct total! The customer has paid in Gems. Choose the exact change.'));
  }
  if (action.type === 'gem' && state.phase === 'change') {
    if (!GEM_DENOMINATIONS.some(gem => gem.id === action.gemId) || ![-1, 1].includes(action.delta)) return state;
    const count = (state.change[action.gemId] || 0) + action.delta;
    if (!int(count) || count > 300) return state;
    return { ...state, change: { ...state.change, [action.gemId]: count }, feedback: null };
  }
  if (action.type === 'clear-change' && state.phase === 'change') return { ...state, change: emptyGems(), feedback: null };
  if (action.type === 'check-change' && state.phase === 'change') {
    const change = gemBundleValue(state.change), needed = customer.paid - customer.total;
    if (!Number.isFinite(change)) return state;
    if (change !== needed) return retry(state, 'change', change < needed ? 'change-low' : 'change-high', change < needed
      ? text('เงินทอนยังน้อยไป ลองคิดจากเงินที่รับ ลบด้วยราคารวม', 'The change is too low. Think: amount paid minus the total price.')
      : text('เงินทอนยังมากไป ลองตรวจมูลค่า Gem ที่เลือกอีกครั้ง', 'The change is too high. Check the value of the Gems you selected.'));
    const errors = countErrors(state.attempts);
    const receipt = {
      customerId: customer.id, sale: customer.total, paid: customer.paid, change,
      satisfaction: Math.max(40, 100 - errors * 10), accuracyPoints: Math.max(0, 100 - errors * 20),
      attempts: { ...state.attempts }, gems: { ...state.change },
    };
    return outcome({ ...state, phase: 'receipt', ledger: [...state.ledger, receipt] }, 'sale-complete', 'success', text('ทอนถูกต้อง ขอบคุณสำหรับการดูแลลูกค้า!', 'Exact change. Thank you for looking after your customer!'));
  }
  if (action.type === 'next' && state.phase === 'receipt') {
    if (state.customerIndex + 1 >= state.customers.length) return { ...state, phase: 'finished', feedback: null };
    return { ...state, customerIndex: state.customerIndex + 1, phase: 'stock', cart: {}, totalInput: '', change: emptyGems(), attempts: attemptsEmpty(), feedback: null };
  }
  return state;
}
