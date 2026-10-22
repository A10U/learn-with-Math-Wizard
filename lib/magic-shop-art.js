/** Original, code-native scenery for the Math Wizard village. */
let illustrationId = 0;
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const safeLanguage = language => language === 'en' ? 'en' : 'th';
const text = (language, th, en) => safeLanguage(language) === 'en' ? en : th;
const star = (x, y, size = 8, color = '#f1cc65') => `<path d="M${x} ${y-size}l${size*.28} ${size*.72} ${size*.72} ${size*.28}-${size*.72} ${size*.28}-${size*.28} ${size*.72}-${size*.28}-${size*.72}-${size*.72}-${size*.28} ${size*.72}-${size*.28}Z" fill="${color}"/>`;
const shrub = (x,y,scale=1,color='#517b55') => `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}"><path d="M-27 6C-46-5-34-29-16-25c-6-29 34-37 40-11 24-5 37 28 15 41Z"/><path d="M0 4v-31" fill="none" stroke="#294f3c" stroke-width="3"/></g>`;
const lantern = (x,y,lit) => `<g transform="translate(${x} ${y})" stroke="#294f3c" stroke-width="3" stroke-linejoin="round"><path d="M0 51V-5q0-9 9-9h8" fill="none"/><path d="M19-13v6"/><path d="M9-5h20l-2 26H11Z" fill="${lit?'#f2cf68':'#c0c8af'}"/><path d="M8-5h22M10 22h19M19-4v25" fill="none"/>${lit?'<ellipse cx="19" cy="8" rx="3" ry="7" fill="#fff7d4" stroke="none"/>':''}</g>`;

/** An SVG string is useful when building the surrounding native HTML controls. */
export function magicShopCharacterSvg(type = 'owl', {label = '', mood = 'happy'} = {}) {
  const kind = ['owl','fox','dragon'].includes(type) ? type : 'owl';
  const id = `magic-shop-character-${++illustrationId}`;
  const face = mood === 'thinking' ? '<path d="M49 73q6-4 12 0"/>' : '<path d="M49 70q6 8 12 0"/>';
  let character;
  if (kind === 'fox') {
    character = `<path d="M82 86q30-13 23-36-14-1-23 16" fill="#c86d43"/><path d="M101 51q7 14-4 24l-9-10Z" fill="#fff4db"/><path d="M36 51q-12 20-6 43h53q7-24-8-43" fill="#c86d43"/><path d="m27 36-3-27 25 16m25 0L99 9l-5 31" fill="#c86d43"/><path d="m30 29-1-12 11 11m43 0 10-11-1 13" fill="#6d493e"/><path d="M26 32q28-25 61-1l9 22-38 30-37-29Z" fill="#db8450"/><path d="m23 49 27 11h16l29-11-12 24-26 13-24-14Z" fill="#fff4db"/><path d="m51 58 13 0-6 8Z" fill="#294f3c"/><path d="M40 45v5m35-5v5"/><path d="m44 78 13 6 14-6-3 17H47Z" fill="#6e639c"/>${face}`;
  } else if (kind === 'dragon') {
    character = `<path d="M82 80q31-6 22-29l-8 8q7 10-14 11" fill="#6e8b67"/><path d="m30 59-17-21-3 25 21 15m50-17 16-21 2 23-17 15" fill="#a0b88b"/><path d="M28 56q-12 21 1 40h55q11-21-3-40" fill="#7e9a74"/><path d="m32 25-5-15 17 12m29 0 15-13-3 18" fill="#e6bc5d"/><path d="M28 25q29-18 58 0l5 31q-2 25-33 28-31-1-34-27Z" fill="#91ab7f"/><path d="M43 67q15-11 31 0v28H43Z" fill="#e8e6bf"/><path d="M38 43v5m38-5v5"/><ellipse cx="48" cy="59" rx="2" ry="3" fill="#294f3c" stroke="none"/><ellipse cx="66" cy="59" rx="2" ry="3" fill="#294f3c" stroke="none"/>${face}<path d="m45 22 12-13 12 13" fill="#6e639c"/>`;
  } else {
    character = `<path d="M25 48q-18 28 4 43l12-26m41-17q18 28-4 43L66 65" fill="#82669b"/><path d="M29 39q-14 16-3 43 11 21 33 21 26-3 31-25 6-24-9-39" fill="#9479a7"/><path d="m27 36 2-23 22 14m15 0 22-14-1 26" fill="#9479a7"/><path d="M31 42q-1-20 20-18 10 0 9 19 2-20 20-18 21 6 11 27-7 14-23 8l-8-9-9 9Q28 65 27 48" fill="#fff4db"/><circle cx="44" cy="43" r="5" fill="#294f3c"/><circle cx="76" cy="43" r="5" fill="#294f3c"/><path d="m54 51 12 0-6 10Z" fill="#e3ac50"/><path d="M40 75q18 14 38-1M44 86q13 9 28 0" fill="none" stroke="#d3bdd9"/><path d="m35 95-5 8m16-5-2 7m26-7 3 7m9-11 5 7"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" class="magic-shop-character-svg" role="img" aria-labelledby="${id}"><title id="${id}">${escapeText(label || kind)}</title><ellipse cx="60" cy="108" rx="38" ry="6" fill="#294f3c" opacity=".1"/><g stroke="#294f3c" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${character}</g>${star(99,24,6)}</svg>`;
}

export function renderMagicShopCustomer(container, {type = 'owl', language = 'th', name, mood = 'happy'} = {}) {
  if (!container) return null;
  const labels = {owl:text(language,'คุณนกฮูก ลูกค้าของร้าน','Owl, a customer of the shop'),fox:text(language,'คุณจิ้งจอก ลูกค้าของร้าน','Fox, a customer of the shop'),dragon:text(language,'มังกรน้อย ลูกค้าของร้าน','Little dragon, a customer of the shop')};
  container.innerHTML = magicShopCharacterSvg(type, {label:name || labels[type] || labels.owl,mood});
  return container.querySelector('svg');
}

/** Restoration is deliberately visible at the four story milestones: 0, 5, 10, 15. */
export function renderMagicShopVillage(container, {completedCount = 0, chapter = 'marbles', language = 'th'} = {}) {
  if (!container) return null;
  const count = Math.max(0, Math.min(15, Math.floor(Number(completedCount) || 0)));
  const stage = count >= 15 ? 3 : count >= 10 ? 2 : count >= 5 ? 1 : 0;
  const selected = ['marbles','potions','spells'].includes(chapter) ? chapter : 'marbles';
  const id = `magic-shop-village-${++illustrationId}`;
  const title = text(language,'หมู่บ้านเวทมนตร์ที่เติบโตไปกับการเรียนรู้','A magical village that grows as you learn');
  const descriptions = [
    text(language,'ร้านลูกแก้ว เรือนปรุงยา และหอคอยเวทมนตร์รอความช่วยเหลือจากคุณ','The marble shop, potion greenhouse and spell tower are waiting for your help.'),
    text(language,'ลูกแก้วจุดโคมไฟให้หมู่บ้านแล้ว ต่อไปช่วยเรือนปรุงยา','The magic marbles have lit the village lanterns. The potion greenhouse is next.'),
    text(language,'โคมไฟสว่างและสวนสมุนไพรเติบโตแล้ว ต่อไปฟื้นพลังหอคอย','The lanterns are lit and the herb garden has grown. Restore the tower next.'),
    text(language,'ภารกิจครบทั้ง 15 ด่าน หมู่บ้านสว่างไสว สวนงอกงาม และหอคอยกลับมามีพลัง','All 15 missions are complete: the village is bright, the garden is growing and the tower has its magic back.')
  ];
  const activeRing = (key,cx,cy,rx,ry) => selected === key ? `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#a77ab6" stroke-width="3" stroke-dasharray="5 7" opacity=".8"/>` : '';
  const glass = stage >= 2 ? '#d9e9cf' : '#e0e4d1';
  const windows = stage >= 1 ? '#f6d875' : '#b7c4ae';
  const restoredFlowers = Array.from({length:8},(_,i) => {
    const x=674+i*24, y=326+(i%2)*9;
    return `<path d="M${x} ${y+11}v-19m0 11q-11-15-14-6m14 8q12-15 15-6" fill="none" stroke="#557d4f" stroke-width="3"/><circle cx="${x}" cy="${y-10}" r="7" fill="${i%2?'#d599a5':'#f0cd6c'}"/><circle cx="${x}" cy="${y-10}" r="2" fill="#fff5d4"/>`;
  }).join('');
  container.dataset.restorationStage = String(stage);
  container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 410" class="magic-shop-village-svg" role="img" aria-labelledby="${id}-title ${id}-description"><title id="${id}-title">${title}</title><desc id="${id}-description">${escapeText(descriptions[stage])}</desc>
    <rect width="1000" height="410" rx="24" fill="#e7edda"/>
    <circle cx="809" cy="81" r="45" fill="#f2d77c"/><path d="M822 37a45 45 0 0 0 0 88 45 45 0 0 1 0-88" fill="#fae8a3"/>
    <g fill="#bdcda9"><path d="M0 239Q130 94 298 216T650 199Q847 116 1000 209V410H0Z"/><path d="M0 198q77-34 137 27L0 306Z" fill="#ced9b7"/></g>
    <path d="M0 297Q215 219 440 298T1000 272v138H0Z" fill="#a8be91"/>
    <g fill="#66875f" opacity=".7"><path d="m47 241 31-81 32 81Zm30 1 29-62 30 62Zm813 14 37-104 37 104Zm47 8 29-84 31 84Z"/></g>
    <path d="M493 290q-42 30-97 36T235 410H672q-8-59-107-84T534 290" fill="#e8d7ac"/>
    <path d="M535 344q105-51 220-24" fill="none" stroke="#e8d7ac" stroke-width="28" stroke-linecap="round"/>
    <g fill="#d5bf8f" opacity=".75"><ellipse cx="477" cy="354" rx="22" ry="5" transform="rotate(-8 477 354)"/><ellipse cx="421" cy="381" rx="25" ry="6" transform="rotate(-16 421 381)"/><ellipse cx="574" cy="382" rx="23" ry="5" transform="rotate(16 574 382)"/></g>
    ${activeRing('spells',193,300,103,31)}${activeRing('marbles',488,306,153,35)}${activeRing('potions',769,303,127,30)}
    <g stroke="#31563d" stroke-width="3" stroke-linejoin="round">
      <g class="magic-shop-art-tower"><path d="M142 144h103l8 147H133Z" fill="${stage===3?'#d5c4df':'#d7d6c5'}"/><path d="m128 147 65-105 67 105Z" fill="${stage===3?'#76628d':'#718465'}"/><path d="m147 117 47-73 47 73" fill="none" stroke="${stage===3?'#c5acd3':'#9bb086'}" stroke-width="5"/><path d="M129 147h130v12H129Z" fill="#2f5740"/><path d="M142 193h103M138 247h112" fill="none" stroke="#aeb59d"/><path d="M177 292v-41q16-23 33 0v41" fill="#385b40"/><path d="M178 193v-16a15 15 0 0 1 30 0v16Z" fill="${stage===3?'#f8df88':'#adbda5'}"/><path d="m160 211 11 19-22 0Z" fill="${stage===3?'#f1cf66':'#c0c6b0'}"/><path d="M218 213h15v15h-15Z" fill="${stage===3?'#f1cf66':'#c0c6b0'}"/><path d="M190 66V26l25 9-25 11" fill="${stage===3?'#c49ac6':'#cbd1b7'}"/></g>
      <g class="magic-shop-art-shop"><path d="M370 184h235v114H370Z" fill="#f9edce"/><path d="m348 190 140-100 140 100Z" fill="#346448"/><path d="m371 174 117-78 117 78" fill="none" stroke="#7b9b6c" stroke-width="8"/><path d="M469 92v-9h38v24" fill="#f3d58d"/><path d="M384 197h207v35H384Z" fill="#a77387"/><path d="M384 196h34v36h-34Zm68 0h34v36h-34Zm68 0h34v36h-34Zm68 0h3v36h-3Z" fill="#f3d6a8" stroke="none"/><path d="M382 234h211"/><path d="M474 298v-58q16-13 33 0v58" fill="#3e6a4a"/><circle cx="499" cy="270" r="2.5" fill="#eace6c" stroke="none"/><path d="M394 248h53v32h-53Zm138 0h43v32h-43Z" fill="${windows}"/><path d="M419 249v29m135-29v29"/><path d="M459 300h65v9h-65Z" fill="#bd9d6d"/><path d="M562 156V67h27v107" fill="#cdac7d"/><path d="M558 65h35v10h-35Z" fill="#6c7759"/><path d="M448 153q41-45 82 0v22h-82Z" fill="#f5dc92"/>
      <circle cx="470" cy="154" r="7" fill="#8270a0"/><circle cx="487" cy="146" r="7" fill="#a8bf91"/><circle cx="506" cy="154" r="7" fill="#d69b7b"/>
      </g>
      <g class="magic-shop-art-greenhouse"><path d="M672 218 767 143l96 75v83H672Z" fill="${glass}"/><path d="M670 218h196m-145-36v117m46-151v151m47-116v116m-141-44h190" fill="none" stroke="#6a8662"/><path d="M653 305h226v12H653Z" fill="#bfaa78"/><path d="M750 301v-56a17 17 0 0 1 34 0v56Z" fill="#a8bf91"/><path d="M662 218 767 134l105 84" fill="none" stroke-width="7"/><path d="M701 281h29v19h-29Zm105 0h27v19h-27Z" fill="#c99a74"/>${stage>=2?'<path d="M715 280v-44q-25-5-16-19 22-3 16 19 25-8 25-24 18 4 8 20-13 13-33 14m104 34v-36q-23-5-18-21 19-7 18 13 23-5 22-23" fill="#72945d" stroke="#497043"/>':'<path d="M716 281v-23m104 23v-19" stroke="#8f9f7a"/>'}</g>
    </g>
    <g stroke="#31563d" stroke-width="3" stroke-linecap="round">${lantern(306,264,stage>=1)}${lantern(618,278,stage>=1)}${lantern(880,268,stage>=1)}</g>
    ${shrub(78,332,1.3)}${shrub(304,318,.8,'#83a16f')}${shrub(919,341,1.3)}${shrub(917,306,.7,'#83a16f')}
    <g>${stage>=2?restoredFlowers:'<path d="M673 339q78-13 178 0" fill="none" stroke="#8ba475" stroke-width="6" stroke-linecap="round"/>'}</g>
    <g stroke="#31563d" stroke-width="2.5" stroke-linejoin="round"><path d="M563 277h28l-3 24h-21Z" fill="#d2b276"/><path d="M577 276v-14q-24-8-14-19 17-3 14 17 23-13 25-2-3 15-25 10" fill="#7e9c63"/><path d="m334 310 5-31h26l4 31Z" fill="#c7a77c"/><circle cx="345" cy="291" r="5" fill="#8f77ae"/><circle cx="359" cy="292" r="5" fill="#edce6e"/></g>
    ${stage===3?`<g class="magic-shop-art-restored">${star(115,72,10)}${star(266,101,8)}${star(230,36,7)}${star(291,54,5)}<path d="M193 17v-8m-11 11-6-6m28 6 6-6" fill="none" stroke="#b4903e" stroke-width="3" stroke-linecap="round"/>${star(685,84,6)}${star(609,64,9)}</g>`:`${star(127,70,6,'#96a680')}${star(289,88,5,'#96a680')}`}
    <g class="magic-shop-art-owl" transform="translate(418 277) scale(.55)"><path d="M0 24q0-30 29-27 31-3 30 27v25H0Z" fill="#967eaa" stroke="#31563d" stroke-width="4"/><path d="M1 2V-12L19-1m25 0 14-11V6" fill="#967eaa" stroke="#31563d" stroke-width="4"/><circle cx="17" cy="17" r="13" fill="#fff3d4"/><circle cx="43" cy="17" r="13" fill="#fff3d4"/><circle cx="17" cy="17" r="4" fill="#31563d"/><circle cx="43" cy="17" r="4" fill="#31563d"/><path d="m24 24 12 0-6 10Z" fill="#edbe5f"/></g>
  </svg>`;
  return container.querySelector('svg');
}
