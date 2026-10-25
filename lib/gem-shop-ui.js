import { GEM_DENOMINATIONS, GEM_DIFFICULTIES, createGemShop, currentGemCustomer, gemShopCatalog, gemShopScore, actGemShop } from './gem-shop.js';
import { itemArt, customerArt, gemArt, shopArt } from './gem-shop-art.js';
import { trackGameStart, trackGameComplete } from './analytics.js';

const BEST_KEY = 'mw-gem-shop-best-v1';
const numberDraft = value => String(value).replace(/[๐-๙]/g, digit => String(digit.charCodeAt(0) - 0x0e50));
const validDraft = value => /^\d{0,4}$/.test(numberDraft(value)) ? numberDraft(value) : '';
const node = (tag, className = '', text = '') => {
  const element = document.createElement(tag); element.className = className;
  if (text !== '') element.textContent = text;
  return element;
};
// All SVG strings come from our own local illustrations, never from input.
const art = (className, markup) => { const element = node('div', className); element.setAttribute('aria-hidden', 'true'); element.innerHTML = markup; return element; };

export function createGemShopController(panel, { onHome = () => {}, playEffect = () => {} } = {}) {
  let active = false, game = null, language = 'th', dialog = null, best = {}, storageAvailable = true, recorded = false;
  const tr = (th, en) => language === 'en' ? en : th;
  const local = value => value?.[language] || value?.th || '';
  const button = (text, action, className = 'gs-secondary', id) => {
    const element = node('button', className, text); element.type = 'button';
    if (id) element.id = id;
    element.addEventListener('click', action); return element;
  };
  const focus = id => panel.querySelector?.('#' + id)?.focus();
  function readBest() {
    try {
      if (!globalThis.localStorage) throw new Error('storage unavailable');
      const raw = JSON.parse(globalThis.localStorage.getItem(BEST_KEY) || '{}');
      best = Object.fromEntries(GEM_DIFFICULTIES.map(mode => [mode.id, Math.max(best[mode.id] || 0, Number.isSafeInteger(raw?.[mode.id]) && raw[mode.id] >= 0 ? raw[mode.id] : 0)]));
      storageAvailable = true;
    } catch { storageAvailable = false; }
  }
  function recordDay() {
    if (recorded || game.phase !== 'finished') return;
    recorded = true;
    const score = gemShopScore(game);
    best[game.difficulty] = Math.max(best[game.difficulty] || 0, score.total);
    try {
      if (!globalThis.localStorage) throw new Error('storage unavailable');
      globalThis.localStorage.setItem(BEST_KEY, JSON.stringify(best));
    } catch { storageAvailable = false; }
    trackGameComplete('gem-shop');
    try { playEffect('complete', { celebrate: true }); } catch {}
  }
  function dispatch(action) {
    if (!active || !game || dialog) return false;
    const phase = game.phase;
    game = actGemShop(game, action);
    if (phase !== 'receipt' && game.phase === 'receipt') {
      try { playEffect('success'); } catch {}
    }
    recordDay(); render();
    if (phase !== game.phase) focus(game.phase === 'total' ? 'gs-total' : game.phase === 'change' ? 'gs-check-change' : game.phase === 'receipt' ? 'gs-next' : game.phase === 'finished' ? 'gs-replay' : 'gs-heading');
    else if (game.feedback) focus('gs-feedback');
    else if (action.type === 'cart') focus(`gs-${action.delta > 0 ? 'plus' : 'minus'}-${action.itemId}`);
    else if (action.type === 'gem') focus(`gs-gem-${action.delta > 0 ? 'plus' : 'minus'}-${action.gemId}`);
    return true;
  }
  function newDay(difficulty) {
    game = createGemShop({ difficulty, language }); recorded = false; dialog = null;
    trackGameStart('gem-shop'); render(); focus('gs-heading');
  }
  function requestDay(difficulty) {
    if (game.phase === 'finished' || (!game.ledger.length && !Object.values(game.cart).some(Boolean) && !Object.values(game.attempts).some(Boolean))) return newDay(difficulty);
    dialog = { type: 'restart', difficulty }; render(); focus('gs-dialog-cancel');
  }
  function header(app) {
    const top = node('div', 'gs-topline');
    top.append(button(tr('⌂ กลับหน้าหลัก', '⌂ Back to home'), onHome, 'gs-secondary gs-home-button', 'gs-home'), node('span', 'gs-status-pill', tr('● เปิดร้านแล้ว', '● Shop is open')));
    app.append(top);
    const head = node('header', 'gs-header'), copy = node('div');
    copy.append(node('p', 'gs-kicker', 'MATH WIZARD · GEMKEEPER'));
    const title = node('h1', 'gs-title', tr('ร้านเวทมนตร์จันทร์เจ้า', 'The Moonlight Magic Shop')); title.id = 'gs-heading'; title.tabIndex = -1;
    copy.append(title, node('p', 'gs-subtitle', tr('หยิบของ คิดราคา ทอน Gem · วันนี้คุณเป็นเจ้าของร้าน!', 'Pick the order, add the prices, give Gem change. Your shop awaits!')));
    const actions = node('div', 'gs-actions');
    actions.append(button(tr('? วิธีเล่น', '? How to play'), () => { dialog = { type: 'rules' }; render(); focus('gs-dialog-close'); }, 'gs-secondary', 'gs-rules'));
    head.append(copy, actions); app.append(head);
    const settings = node('div', 'gs-difficulty'); settings.setAttribute('role', 'group'); settings.setAttribute('aria-label', tr('ระดับความยาก', 'Difficulty'));
    GEM_DIFFICULTIES.forEach(mode => {
      const control = button(local(mode.name), () => requestDay(mode.id), 'gs-diff-button', `gs-difficulty-${mode.id}`);
      control.setAttribute('aria-pressed', String(mode.id === game.difficulty)); settings.append(control);
    });
    settings.append(node('span', 'gs-muted', tr('ไม่จับเวลา · รอบละ 5 คน', 'No timer · 5 customers a day'))); app.append(settings);
  }
  function stats(app) {
    const score = gemShopScore(game), row = node('div', 'gs-stats');
    const entries = [[tr('ลูกค้าที่บริการ', 'Customers served'), `${score.served} / 5`, '♙'], [tr('รายได้สุทธิ', 'Net sales'), `${score.earned}`, '◇'], [tr('ความพึงพอใจ', 'Satisfaction'), `${score.satisfaction}%`, '♡'], [tr('คะแนนร้าน', 'Shop score'), `${score.total}`, '✦']];
    entries.forEach(([label, value, icon]) => {
      const box = node('div', 'gs-stat'); box.append(node('span', 'gs-stat-icon', icon));
      const content = node('div'); content.append(node('small', '', label), node('strong', '', value)); box.append(content); row.append(box);
    }); app.append(row);
  }
  function gemLegend() {
    const legend = node('section', 'gs-gems');
    const heading = node('div', 'gs-legend-heading'); heading.append(node('h2', '', tr('อัตราแลก Gem', 'Gem exchange')), node('small', '', tr('มูลค่าเป็น “หน่วย”', 'Prices are in units'))); legend.append(heading);
    const list = node('div', 'gs-gem-legend');
    GEM_DENOMINATIONS.forEach(gem => {
      const entry = node('div', 'gs-gem'); entry.append(art('gs-gem-art', gemArt(gem.value)));
      const copy = node('div'); copy.append(node('span', '', local(gem.name)), node('strong', '', `1 = ${gem.value} ${tr('หน่วย', 'units')}`)); entry.append(copy); list.append(entry);
    }); legend.append(list); return legend;
  }
  function customerCard(customer) {
    const card = node('section', 'gs-customer'); card.append(art('gs-customer-art', customerArt(game.customerIndex)));
    const bubble = node('div', 'gs-bubble');
    bubble.append(node('span', 'gs-kicker', tr(`ลูกค้าคนที่ ${game.customerIndex + 1} / 5`, `Customer ${game.customerIndex + 1} of 5`)), node('h2', '', local(customer.name)), node('p', '', tr('วันนี้ขอซื้อของตามนี้นะคะ/ครับ', 'Here is my shopping list, please.')));
    const list = node('ul', 'gs-order');
    const catalog = gemShopCatalog(game.difficulty, customer);
    customer.order.forEach(line => {
      const item = catalog.find(product => product.id === line.itemId), entry = node('li');
      entry.append(node('span', '', local(item.name)), node('strong', '', `× ${line.quantity}`)); list.append(entry);
    }); bubble.append(list);
    const satisfaction = Math.max(40, 100 - 10 * Object.values(game.attempts).reduce((sum, value) => sum + value, 0));
    bubble.append(node('small', 'gs-muted', tr(`♡ ความพึงพอใจคนนี้ ${satisfaction}% · ค่อย ๆ คิดได้เลย`, `♡ Customer happiness ${satisfaction}% · Take your time`)));
    card.append(bubble); return card;
  }
  function marketCard(customer) {
    const market = customer.market;
    if (!market) return null;
    const card = node('aside', 'gs-market');
    card.append(node('span', 'gs-market-icon', market.direction === 1 ? '↗' : market.direction === -1 ? '↘' : '☀'));
    const copy = node('div', 'gs-market-copy');
    copy.append(node('span', 'gs-market-tag', tr('ข่าวตลาดเวทมนตร์', 'MAGIC MARKET NEWS')), node('strong', '', local(market.headline)), node('p', '', local(market.detail)));
    if (market.itemId) {
      const item = gemShopCatalog(game.difficulty, customer).find(product => product.id === market.itemId);
      copy.append(node('strong', 'gs-market-price', `${local(item.name)}: ${market.previousPrice} → ${market.price} ${tr('หน่วย / ชิ้น', 'units / item')}`));
    }
    if (market.question) copy.append(node('small', 'gs-market-question', local(market.question)));
    card.append(copy); return card;
  }
  function shelf(customer) {
    const section = node('section', 'gs-shop'), heading = node('div', 'gs-shelf-heading');
    heading.append(node('h2', '', tr('ชั้นวางอุปกรณ์เวทมนตร์', 'Magical supplies')), node('span', 'gs-muted', tr('ราคานี้ใช้ตลอดบิลนี้', 'Prices stay fixed for this order'))); section.append(heading);
    const grid = node('div', 'gs-shelf');
    gemShopCatalog(game.difficulty, customer).forEach(item => {
      const changed = item.basePrice !== undefined && item.basePrice !== item.price;
      const card = node('article', 'gs-item' + (changed ? ' changed' : ''));
      card.append(art('gs-item-art', itemArt(item.id)));
      const info = node('div', 'gs-item-info'); info.append(node('h3', '', local(item.name)));
      const price = node('div', 'gs-price');
      if (changed) { const before = node('s', 'gs-price-was', `${item.basePrice}`); before.setAttribute('aria-label', tr('ราคาเปิดร้าน ', 'Opening price ') + item.basePrice); price.append(before); }
      price.append(node('strong', '', `${item.price}`), node('span', '', tr('หน่วย / ชิ้น', 'units / item')));
      if (changed) price.append(node('span', `gs-price-trend ${item.price > item.basePrice ? 'up' : 'down'}`, item.price > item.basePrice ? '↑' : '↓'));
      info.append(price);
      const quantity = node('div', 'gs-quantity');
      const minus = button('−', () => dispatch({ type: 'cart', itemId: item.id, delta: -1 }), 'gs-minus', `gs-minus-${item.id}`);
      minus.disabled = game.phase !== 'stock' || !(game.cart[item.id] > 0); minus.setAttribute('aria-label', tr('นำออก ', 'Remove ') + local(item.name));
      const count = node('output', 'gs-count', String(game.cart[item.id] || 0)); count.setAttribute('aria-label', tr('จำนวน ', 'Quantity of ') + local(item.name));
      const plus = button('+', () => dispatch({ type: 'cart', itemId: item.id, delta: 1 }), 'gs-plus', `gs-plus-${item.id}`);
      plus.disabled = game.phase !== 'stock' || (game.cart[item.id] || 0) >= 9; plus.setAttribute('aria-label', tr('หยิบ ', 'Add ') + local(item.name));
      quantity.append(minus, count, plus); info.append(quantity); card.append(info); grid.append(card);
    }); section.append(grid); return section;
  }
  function register(customer) {
    const side = node('aside', 'gs-register'); side.append(node('span', 'gs-kicker', tr('เคาน์เตอร์ของคุณ', 'YOUR COUNTER')), node('h2', '', tr('คิดเงินให้ลูกค้า', 'Let’s check out')));
    const phases = ['stock', 'total', 'change'], current = phases.indexOf(game.phase);
    const steps = node('ol', 'gs-stepper');
    [tr('จัดของ', 'Pick items'), tr('รวมราคา', 'Add prices'), tr('ทอน Gem', 'Give change')].forEach((label, index) => {
      const step = node('li', index === current ? 'current' : current === -1 || index < current ? 'done' : '');
      step.append(node('span', '', current === -1 || index < current ? '✓' : String(index + 1)), node('small', '', label));
      if (index === current) step.setAttribute('aria-current', 'step'); steps.append(step);
    }); side.append(steps);
    if (game.phase === 'stock') {
      side.append(node('h3', '', tr('1. หยิบให้ครบรายการ', '1. Fill the order')), node('p', 'gs-muted', tr('แตะ + ที่สินค้า และเช็กจำนวนให้ตรงกับรายการของลูกค้า', 'Tap + on the shelf. Match each item and quantity to the shopping list.')));
      const list = node('div', 'gs-cart');
      const selected = gemShopCatalog(game.difficulty, customer).filter(item => game.cart[item.id] > 0);
      if (!selected.length) list.append(node('p', 'gs-cart-empty', tr('ถุงเวทมนตร์ยังว่างอยู่', 'Your magic bag is empty')));
      selected.forEach(item => { const line = node('div', 'gs-cart-line'); line.append(node('span', '', local(item.name)), node('strong', '', `× ${game.cart[item.id]}`)); list.append(line); });
      side.append(list, button(tr('จัดของครบแล้ว →', 'Order ready →'), () => dispatch({ type: 'check-cart' }), 'gs-primary', 'gs-check-cart'));
    } else if (game.phase === 'total') {
      const form = node('form', 'gs-total-form');
      const label = node('label', 'gs-field', tr('2. สินค้าทั้งหมดราคาเท่าไร?', '2. What is the total price?')); label.setAttribute('for', 'gs-total');
      const input = node('input', 'gs-total-input'); input.id = 'gs-total'; input.type = 'text'; input.inputMode = 'numeric'; input.autocomplete = 'off'; input.maxLength = 4; input.value = game.totalInput; input.setAttribute('aria-describedby', 'gs-total-help');
      input.addEventListener('input', () => { if (active && !dialog && game.phase === 'total') game = actGemShop(game, { type: 'total', value: validDraft(input.value) }); });
      const help = node('p', 'gs-muted', tr('รวมจากป้ายราคา แล้วใส่จำนวนหน่วยด้วยตัวเอง', 'Use the price tags, then enter the total in units.')); help.id = 'gs-total-help';
      const submit = button(tr('ตรวจราคารวม →', 'Check total →'), () => {}, 'gs-primary', 'gs-check-total'); submit.type = 'submit';
      form.addEventListener('submit', event => { event.preventDefault(); if (!active || dialog || game.phase !== 'total') return; game = actGemShop(game, { type: 'total', value: validDraft(input.value) }); dispatch({ type: 'check-total' }); });
      form.append(label, input, help, submit); side.append(form);
    } else if (game.phase === 'change') {
      side.append(node('h3', '', tr('3. เลือก Gem ที่ต้องทอน', '3. Choose the change')));
      const payment = node('div', 'gs-payment'); payment.append(node('strong', '', tr('ลูกค้าจ่ายด้วย', 'The customer pays')));
      const bundle = node('div', 'gs-payment-gems');
      GEM_DENOMINATIONS.filter(gem => customer.payment[gem.id] > 0).forEach(gem => {
        const entry = node('div'); entry.append(art('gs-gem-art', gemArt(gem.value)), node('strong', '', `× ${customer.payment[gem.id]}`)); entry.setAttribute('aria-label', `${local(gem.name)} ${customer.payment[gem.id]} ${tr('เม็ด มูลค่าเม็ดละ', 'gems, each worth')} ${gem.value}`); bundle.append(entry);
      }); payment.append(bundle, node('small', '', tr(`ราคาสินค้า ${customer.total} หน่วย`, `Purchase total: ${customer.total} units`))); side.append(payment);
      side.append(node('p', 'gs-muted', tr('คิดมูลค่า Gem ที่ได้รับ แล้วเลือก Gem เงินทอน ถ้าจ่ายพอดี กดส่งโดยไม่เติม Gem', 'Work out the payment, then select the change. For exact payment, send no Gems.')));
      const grid = node('div', 'gs-change-grid');
      GEM_DENOMINATIONS.forEach(gem => {
        const row = node('div', 'gs-change-row'); row.append(art('gs-gem-art', gemArt(gem.value)), node('strong', 'gs-gem-value', `${gem.value}`));
        const controls = node('div', 'gs-quantity');
        const minus = button('−', () => dispatch({ type: 'gem', gemId: gem.id, delta: -1 }), 'gs-minus', `gs-gem-minus-${gem.id}`); minus.disabled = !game.change[gem.id]; minus.setAttribute('aria-label', tr('ลดเงินทอน ', 'Remove change: ') + local(gem.name));
        const count = node('output', 'gs-count', String(game.change[gem.id] || 0));
        const plus = button('+', () => dispatch({ type: 'gem', gemId: gem.id, delta: 1 }), 'gs-plus', `gs-gem-plus-${gem.id}`); plus.disabled = game.change[gem.id] >= 99; plus.setAttribute('aria-label', tr('เพิ่มเงินทอน ', 'Add change: ') + local(gem.name));
        controls.append(minus, count, plus); row.append(controls); grid.append(row);
      }); side.append(grid, button(tr('ล้างถาดเงินทอน', 'Clear change tray'), () => dispatch({ type: 'clear-change' }), 'gs-clear', 'gs-clear-change'), button(tr('ส่งของและเงินทอน ✦', 'Deliver order & change ✦'), () => dispatch({ type: 'check-change' }), 'gs-primary', 'gs-check-change'));
    } else if (game.phase === 'receipt') {
      const receipt = game.ledger.at(-1), score = gemShopScore(game);
      const result = node('div', 'gs-receipt'); result.append(node('div', 'gs-receipt-star', '✦'), node('h3', '', tr('ขอบคุณนะ เจ้าของร้าน!', 'Thank you, shopkeeper!')), node('p', '', tr('จัดของและทอนเงินถูกต้องแล้ว', 'The order and change are correct.')));
      result.append(node('p', 'gs-receipt-equation', `${receipt.paid} − ${receipt.sale} = ${receipt.change}`), node('small', 'gs-muted', tr('เงินรับ − ราคาสินค้า = เงินทอน', 'Payment − price = change')));
      result.append(node('p', 'gs-receipt-points', `+ ${100 + receipt.sale + receipt.satisfaction + receipt.accuracyPoints} ${tr('คะแนน', 'points')} · ♡ ${receipt.satisfaction}%`));
      result.append(node('small', 'gs-muted', tr(`รายได้ร้านสะสม ${score.earned} หน่วย`, `Shop sales so far: ${score.earned} units`)));
      side.append(result, button(game.customerIndex === 4 ? tr('ปิดร้าน ดูสรุปวันนี้ →', 'Close shop & see results →') : tr('รับลูกค้าคนถัดไป →', 'Welcome next customer →'), () => dispatch({ type: 'next' }), 'gs-primary', 'gs-next'));
    }
    const status = node('p', 'gs-feedback' + (game.feedback ? ` ${game.feedback.tone}` : ''), game.feedback ? local(game.feedback.message) : '');
    status.id = 'gs-feedback'; status.tabIndex = -1; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); side.append(status);
    side.append(button(tr('⌂ กลับหน้าหลัก', '⌂ Back to home'), onHome, 'gs-secondary gs-home-button gs-counter-home', 'gs-counter-home'));
    return side;
  }
  function summary(app) {
    const score = gemShopScore(game), section = node('section', 'gs-summary');
    section.append(art('gs-summary-art', shopArt()), node('span', 'gs-kicker', tr('บันทึกของเจ้าของร้าน', 'SHOPKEEPER’S DAILY JOURNAL')), node('h2', '', tr('วันนี้ร้านของคุณเปล่งประกาย!', 'Your shop is shining!')), node('p', '', tr('บริการลูกค้าครบ 5 คนแล้ว เก่งมาก!', 'All 5 customers served. Nicely done!')), node('strong', 'gs-final-score', `${score.total} ${tr('คะแนน', 'points')}`));
    const breakdown = node('div', 'gs-score-breakdown');
    [[tr('บริการลูกค้า · 100 × 5', 'Service · 100 × 5'), score.servicePoints], [tr('รายได้จากราคาขายจริง', 'Actual sales revenue'), score.earningsPoints], [tr('ความพึงพอใจรวม', 'Customer happiness'), score.satisfactionPoints], [tr('ความแม่นยำในการคิด', 'Arithmetic accuracy'), score.accuracyPoints]].forEach(([label, value]) => { const line = node('div'); line.append(node('span', '', label), node('strong', '', `+ ${value}`)); breakdown.append(line); });
    section.append(breakdown, node('p', 'gs-best', tr(`สถิติสูงสุดระดับนี้: ${best[game.difficulty] || score.total} คะแนน`, `Best in this difficulty: ${best[game.difficulty] || score.total} points`)));
    const journal = node('div', 'gs-journal'); journal.append(node('h3', '', tr('สมุดบิลวันนี้', 'Today’s receipts')));
    game.ledger.forEach((receipt, index) => {
      const line = node('p'); line.append(node('span', '', local(game.customers[index].name)), node('strong', '', `${receipt.paid} − ${receipt.sale} = ${receipt.change}`)); journal.append(line);
    }); section.append(journal);
    section.append(node('p', 'gs-muted', tr('รายได้คิดเฉพาะราคาสินค้า เงินทอนไม่นับเป็นรายได้ · เปรียบเทียบคะแนนในระดับเดียวกัน', 'Revenue counts the sale price after change. Compare scores within the same difficulty.')));
    const actions = node('div', 'gs-actions'); actions.append(button(tr('เปิดร้านวันใหม่ ✦', 'Open a new day ✦'), () => newDay(game.difficulty), 'gs-primary', 'gs-replay'), button(tr('⌂ กลับหน้าหลัก', '⌂ Back to home'), onHome, 'gs-secondary gs-home-button', 'gs-summary-home')); section.append(actions); app.append(section);
  }
  function renderDialog(app) {
    if (!dialog) return;
    const overlay = node('div', 'gs-overlay'), modal = node('section', 'gs-modal'); modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'gs-dialog-title');
    const heading = node('h2', '', dialog.type === 'rules' ? tr('คู่มือเจ้าของร้านตัวน้อย', 'A little shopkeeper’s guide') : tr('เริ่มร้านวันใหม่ไหม?', 'Start a new shop day?')); heading.id = 'gs-dialog-title'; modal.append(heading);
    const close = () => { const target = dialog.type === 'rules' ? 'gs-rules' : `gs-difficulty-${game.difficulty}`; dialog = null; render(); focus(target); };
    if (dialog.type === 'rules') {
      const list = node('ol');
      [tr('อ่านข่าวตลาด ราคาขึ้นเมื่อคนต้องการมากหรือสินค้าขาด ราคาลงเมื่อสินค้ามากหรือคนต้องการน้อย', 'Read the market news. Higher demand or lower supply raises prices. More supply or lower demand lowers prices.'), tr('หยิบสินค้าให้ตรงรายการ แล้วรวมราคาจากป้ายของลูกค้ารอบนั้น', 'Match the shopping list, then add the current price tags.'), tr('ดูชนิดและจำนวน Gem ที่ลูกค้าจ่าย แล้วเลือก Gem เงินทอนด้วยตัวเอง', 'Work out the value of the customer’s Gems and choose the change yourself.'), tr('Gem หลายแบบรวมกันได้ ถ้ามูลค่าเงินทอนถูกต้อง ใช้แบบไหนก็ได้', 'Any Gem combination is accepted when the total change is correct.'), tr('ราคาคงที่ตลอดบิล ไม่มีจับเวลา ลองใหม่ได้ เช็กผิดหนึ่งครั้งลดความพึงพอใจ 10 และคะแนนความแม่นยำ 20 โดยไม่ต่ำกว่า 40% และ 0', 'Prices stay fixed during each bill. No timer. Retry freely; each incorrect check reduces happiness by 10 and accuracy by 20, down to 40% and 0.')].forEach(text => list.append(node('li', '', text))); modal.append(list);
      modal.append(node('p', 'gs-muted', tr('คะแนน = ลูกค้า × 100 + รายได้สุทธิ + ความพึงพอใจรวม + ความแม่นยำรวม · เป็นตลาดจำลองอย่างง่าย', 'Score = customers × 100 + net sales + happiness + accuracy. This is a simplified market simulation.')), button(tr('เข้าใจแล้ว ไปเปิดร้าน!', 'Got it. Let’s trade!'), close, 'gs-primary', 'gs-dialog-close'));
    } else {
      modal.append(node('p', '', tr('รอบปัจจุบันจะเริ่มใหม่ คะแนนวันนี้จะไม่ถูกบันทึก สถิติวันที่เล่นจบแล้วยังอยู่', 'The current day will restart without saving its score. Completed-day records are kept.')));
      const actions = node('div', 'gs-actions'); actions.append(button(tr('เล่นรอบนี้ต่อ', 'Keep playing'), close, 'gs-secondary', 'gs-dialog-cancel'), button(tr('เริ่มวันใหม่', 'Start a new day'), () => newDay(dialog.difficulty), 'gs-primary', 'gs-dialog-confirm')); modal.append(actions);
    }
    // Keep keyboard focus inside the modal, including Shift+Tab and Escape.
    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...(modal.querySelectorAll?.('button') || [])];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    // inert hides the underlying controls from both keyboard and screen readers.
    [...app.children].forEach(child => { child.inert = true; });
    overlay.append(modal); app.append(overlay);
  }
  function render() {
    if (!active || !game || !panel) return;
    const app = node('div', 'gs-app'); header(app); stats(app);
    if (game.phase === 'finished') summary(app);
    else {
      const customer = currentGemCustomer(game), layout = node('div', 'gs-layout'), main = node('div', 'gs-main');
      main.append(customerCard(customer)); const market = marketCard(customer); if (market) main.append(market);
      main.append(shelf(customer)); const side = node('div', 'gs-sidebar'); side.append(register(customer), gemLegend()); layout.append(main, side); app.append(layout);
    }
    const footer = node('footer', 'gs-footer'); footer.append(node('span', '', tr('✦ คิดด้วยตัวเอง เก่งขึ้นทีละบิล', '✦ A little more confident with every sale')), node('span', '', storageAvailable ? tr('สถิติสูงสุดบันทึกในเครื่องนี้', 'Best scores saved on this device') : tr('บันทึกในเครื่องไม่ได้ ยังเล่นต่อได้ตามปกติ', 'Storage unavailable. You can keep playing.'))); app.append(footer);
    renderDialog(app); panel.replaceChildren(app);
  }
  return {
    enter({ language: nextLanguage = 'th', grade = 1 } = {}) {
      language = nextLanguage === 'en' ? 'en' : 'th'; active = true; readBest();
      if (!game) newDay(grade <= 2 ? 'beginner' : grade <= 4 ? 'apprentice' : 'master');
      else { game = { ...game, language }; render(); focus('gs-heading'); }
    },
    deactivate() { active = false; dialog = null; },
    setLanguage(value) { if (!['th', 'en'].includes(value)) return false; language = value; if (game) game = { ...game, language }; if (active) render(); return true; },
    getState() { return JSON.parse(JSON.stringify({ active, language, game, best, storageAvailable, dialog })); },
    actions: { dispatch, newDay: difficulty => { if (active) requestDay(difficulty); }, closeDialog() { dialog = null; render(); }, render }
  };
}
