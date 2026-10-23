// Decorative view of fraction-quest state. Native DOM controls remain authoritative.
// The vendored Three.js module is loaded only after this adventure opens.
export async function mountFractionWorld(host, { language = 'th', onAction = () => {} } = {}) {
  if (!host || typeof window === 'undefined') return null;
  let THREE;
  try { THREE = await import('./vendor/three/three.module.min.js'); }
  catch { host.dataset.world3d = 'fallback'; return null; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch { host.dataset.world3d = 'fallback'; return null; }
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.append(canvas);
  host.dataset.world3d = 'ready';
  host.classList.add('fq-world-ready');

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 80);
  camera.position.set(7.7, 10, 15);
  camera.lookAt(0, 1.1, .2);
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const ownedMaterial = new Set();
  const geometry = g => { geometries.add(g); return g; };
  const material = (color, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: .72, ...extra });
    materials.add(m); ownedMaterial.add(m); return m;
  };
  const p = {
    earth: material(0x6e668f), rock: material(0x9485ac), grass: material(0x9ec48b), grassEdge: material(0x527b78),
    tile: material(0xf4dfb0), cream: material(0xfff0d0), wood: material(0xac7858), darkWood: material(0x775663),
    leaf: material(0x588b86), mint: material(0x93d0b7), gold: material(0xfbc96a), roof: material(0x9277bb),
    wall: material(0xe9c9bd), red: material(0xf17f9c), blue: material(0x6dcbe4), ink: material(0x555477),
    crystal: material(0xa1f2da, { emissive: 0x3eaf98, emissiveIntensity: .3, roughness: .3, metalness: .16 }),
    dormant: material(0xaaa9b9), glass: material(0xd4f9ff, { transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide, roughness: .12 }),
    redLiquid: material(0xf06f94, { roughness: .23, metalness: .08 }), blueLiquid: material(0x6fc9e8, { roughness: .23, metalness: .08 }),
  };
  const mesh = (parent, g, m, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(geometry(g), m); o.position.set(x, y, z); parent.add(o); return o;
  };
  const box = (parent,x,y,z,w,h,d,m) => mesh(parent,new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const cylinder = (parent,x,y,z,rt,rb,h,m,sides=12) => mesh(parent,new THREE.CylinderGeometry(rt,rb,h,sides),m,x,y,z);
  const cone = (parent,x,y,z,r,h,m,sides=7) => mesh(parent,new THREE.ConeGeometry(r,h,sides),m,x,y,z);
  const ring = (parent,x,y,z,r,m,t=.035) => {
    const o=mesh(parent,new THREE.TorusGeometry(r,t,5,40),m,x,y,z); o.rotation.x=Math.PI/2; return o;
  };
  const label = (parent, text, x, y, z, width = 1.2, color = '#514c70') => {
    const labelHeight=Math.min(width/4,.42);
    const surface=document.createElement('canvas'); surface.width=1024; surface.height=Math.round(1024*labelHeight/width);
    const ctx=surface.getContext('2d'); if(!ctx)return;
    ctx.fillStyle='rgba(255,246,223,.94)'; ctx.beginPath(); ctx.roundRect(8,5,surface.width-16,surface.height-10,Math.min(24,surface.height/5)); ctx.fill();
    ctx.fillStyle=color; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font=`700 ${Math.round(surface.height*.46)}px system-ui, sans-serif`; ctx.fillText(String(text),surface.width/2,surface.height/2,surface.width-38);
    const texture=new THREE.CanvasTexture(surface); texture.colorSpace=THREE.SRGBColorSpace; textures.add(texture);
    const m=new THREE.SpriteMaterial({map:texture,depthWrite:false,depthTest:false,transparent:true});materials.add(m);
    const sprite=new THREE.Sprite(m); sprite.position.set(x,y,z); sprite.scale.set(width,labelHeight,1);sprite.renderOrder=10;parent.add(sprite);return sprite;
  };
  const world=new THREE.Group();scene.add(world);
  scene.add(new THREE.HemisphereLight(0xfff6e3,0x8c90bf,3));
  const sun=new THREE.DirectionalLight(0xffe4be,3.2);sun.position.set(-5,10,6);scene.add(sun);
  const rim=new THREE.DirectionalLight(0xaff8ff,1.5);rim.position.set(5,4,-5);scene.add(rim);
  const island=(parent,x,y,z,r)=>{
    cylinder(parent,x,y-.53,z,r*.94,r*.6,1.22,p.earth,9);
    cone(parent,x,y-1.45,z,r*.6,1.3,p.rock,9).rotation.z=Math.PI;
    cylinder(parent,x,y+.07,z,r,r*.97,.3,p.grassEdge,11);
    cylinder(parent,x,y+.28,z,r*.99,r,.16,p.grass,11);
  };
  island(world,0,0,0,5.25);island(world,-5.8,.32,-2.2,1.2);island(world,5.4,.2,-1.8,1.15);
  // Quiet surrounding clouds frame the miniature world without hiding its math.
  const cloudMat=material(0xf5eaff,{transparent:true,opacity:.5,depthWrite:false});
  for(const [x,y,z,s]of[[-5.2,-1,2.2,1],[4.4,-1,3.1,.8],[-3.8,-1.7,-4,.8]]){
    for(let j=0;j<3;j++){const o=mesh(world,new THREE.IcosahedronGeometry(.7,1),cloudMat,x+j*.55,y,z);o.scale.set(s*1.1,s*.4,s*.65);}
  }
  const tree=(x,z,s)=>{const g=new THREE.Group();g.position.set(x,.37,z);g.scale.setScalar(s);world.add(g);
    cylinder(g,0,.42,0,.1,.14,.9,p.darkWood,6);cone(g,0,1.02,0,.56,1,p.leaf);cone(g,0,1.58,0,.4,.9,p.mint);};
  [[-3.7,-1.6,1.15],[-3.9,-.4,.8],[3.8,-1.4,.9],[3.6,-2.7,.8],[-5.9,-2.2,.65]].forEach(a=>tree(...a));
  // Alchemist's observatory, roof, telescope and little garden.
  cylinder(world,-1.15,1.12,-2.25,.85,.95,1.55,p.wall,10);
  cylinder(world,-1.15,1.95,-2.25,.98,.98,.2,p.gold,10);
  cone(world,-1.15,2.7,-2.25,1.28,1.35,p.roof,10);
  mesh(world,new THREE.OctahedronGeometry(.2),p.crystal,-1.15,3.48,-2.25);
  box(world,-1.15,.99,-1.35,.4,.78,.1,p.darkWood);
  for(const x of[-1.7,-.6])box(world,x,1.52,-1.45,.29,.35,.08,p.gold);
  const telescope=new THREE.Group();telescope.position.set(1.15,.55,-2.5);world.add(telescope);
  cylinder(telescope,0,.45,0,.08,.15,.9,p.wood,6);
  const scope=cylinder(telescope,0,1.13,0,.18,.22,.9,p.gold,10);scope.rotation.z=-.8;
  const lens=cylinder(telescope,-.35,1.47,0,.2,.2,.07,p.blue,10);lens.rotation.z=-.8;
  ring(world,0,.39,-.15,3.1,p.tile,.05);
  const crystals=[];
  for(let i=0;i<12;i++){
    const angle=Math.PI*.02+i*Math.PI*1.04/11;
    const x=Math.cos(angle)*3.65,z=-.2-Math.sin(angle)*3.3;
    cylinder(world,x,.49,z,.2,.27,.24,p.tile,6);
    const shard=mesh(world,new THREE.OctahedronGeometry(.18),p.dormant,x,.86,z);shard.scale.y=1.7;shard.rotation.y=i*.4;crystals.push(shard);
  }
  // Foreground stage is deliberately large; its geometry is a faithful scale model.
  const bench=new THREE.Group();bench.position.set(.1,.56,1.55);world.add(bench);
  cylinder(bench,0,-.06,0,2.85,2.95,.22,p.tile,12);
  cylinder(bench,0,-.22,0,2.66,2.75,.16,p.darkWood,12);
  let math=new THREE.Group();bench.add(math);
  let disposed=false,lost=false,hidden=document.hidden,raf=0,lastKey='',live=null,pourTween=null,dropTween=null;
  let potionLayers=null,stream=null,hitTargets=[],canInteract=false;
  const clickable=(object,action)=>{object.userData.action=action;hitTargets.push(object);return object;};
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');let reduceMotion=!!reduced?.matches;
  const clearMath=()=>{
    math.traverse(o=>{
      if(o.geometry){o.geometry.dispose();geometries.delete(o.geometry);}
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(m=>{if(m&&!ownedMaterial.has(m)){if(m.map){m.map.dispose();textures.delete(m.map);}m.dispose();materials.delete(m);}});
    });
    bench.remove(math);math=new THREE.Group();bench.add(math);potionLayers=null;stream=null;pourTween=null;dropTween=null;hitTargets=[];
  };
  const fraction=(ticks)=>{if(!ticks)return '0';const gcd=(a,b)=>b?gcd(b,a%b):a;const d=gcd(ticks,24);return ticks===24?'1':`${ticks/d}/${24/d}`;};
  const text=(th,en)=>language==='en'?en:th;
  function drawBridge(model,level,previous){
    const length=4.8,start=-2.4,depth=.95;
    // 24 equal ticks form one fixed whole, including on a 3/4 target level.
    box(math,0,.04,0,length,.07,depth,p.ink);
    for(let i=0;i<24;i++)box(math,start+(i+.5)*length/24,.085,0,.182,.02,depth*.92,p.cream);
    for(const x of[start,start+length]){
      cylinder(math,x,.36,-.64,.075,.1,.7,p.wood,7);cylinder(math,x,.36,.64,.075,.1,.7,p.wood,7);
      mesh(math,new THREE.OctahedronGeometry(.12),p.gold,x,.78,-.64);
    }
    let offset=0;
    for(const id of model.used||[]){
      const plank=level.planks.find(item=>item.id===id);if(!plank)continue;
      const w=length*plank.ticks/24;
      const laid=box(math,start+offset+w/2,.17,0,w-.035,.16,depth,(model.used.indexOf(id)%2)?p.blue:p.mint);
      if(!reduceMotion&&previous?.levelId===level.id&&!previous.model.used?.includes(id)){laid.position.y=.82;dropTween={object:laid,start:performance.now()};}
      label(math,`${plank.numerator}/${plank.denominator}`,start+offset+w/2,.59,0,Math.min(.9,w*.95));offset+=w;
    }
    const goalX=start+length*(level.goal.targetTicks/24);
    box(math,goalX,.28,0,.035,.42,1.25,p.gold);
    label(math,`${fraction(model.ticks)} / 1`,0,1.18,-.12,2.3);
    label(math,`${text('เป้าหมาย','Goal')} ${fraction(level.goal.targetTicks)}`,goalX,.86,-.85,1.8);
    label(math,text('1 ทั้งหมด = 24 ช่องเท่ากัน','1 whole = 24 equal ticks'),0,.2,2.44,3.15);
    const available=level.planks.filter(plank=>!model.used.includes(plank.id));
    available.forEach((plank,i)=>{
      const x=(i-(available.length-1)/2)*.68;
      const stock=new THREE.Group();stock.position.set(x,0,1.65);math.add(stock);
      box(stock,0,.19,0,.6,.24,.49,p.wood);
      label(stock,`${plank.numerator}/${plank.denominator}`,0,.56,0,.6);
      clickable(stock,{type:'plank',plankId:plank.id});
    });
  }
  function drawEquivalent(model,level){
    const rows=[{value:level.initial,z:-.65,color:p.mint},{value:model,z:.65,color:p.blue}];
    for(const {value,z,color}of rows){
      const w=4.4,d=value.denominator;
      box(math,0,.08,z,w+.1,.12,.7,p.darkWood);
      for(let i=0;i<d;i++)box(math,-w/2+(i+.5)*w/d,.21,z,w/d,.19,.64,i<value.numerator?color:p.cream);
      for(let i=1;i<d;i++)box(math,-w/2+i*w/d,.311,z,.012,.012,.64,p.darkWood);
      label(math,`${value.numerator}/${d}`,0,.75,z,1.3);
    }
    label(math,text('ปริมาณเท่าเดิม · หนึ่งหน่วยเท่าเดิม','Same amount · same whole'),0,1.45,-.1,3.9);
    label(math,`${text('แบ่งเป็น','Partition into')} ${level.goal.denominator} ${text('ส่วนเท่ากัน','equal parts')}`,0,.38,1.55,3.5);
  }
  function setPotionAmounts(redTicks,blueTicks){
    if(!potionLayers)return;
    const scale=2.1/24;
    potionLayers.red.visible=redTicks>.001;potionLayers.blue.visible=blueTicks>.001;
    potionLayers.red.scale.y=Math.max(.0001,redTicks*scale);potionLayers.red.position.y=.17+redTicks*scale/2;
    potionLayers.blue.scale.y=Math.max(.0001,blueTicks*scale);potionLayers.blue.position.y=.17+redTicks*scale+blueTicks*scale/2;
  }
  function drawPotion(model,level,previous){
    // Each height corresponds to 1/24 L. Red and blue remain individually visible.
    cylinder(math,0,.115,0,.93,.93,.13,p.gold,32);
    const red=cylinder(math,0,.17,0,.805,.805,1,p.redLiquid,32);
    const blue=cylinder(math,0,.17,0,.805,.805,1,p.blueLiquid,32);potionLayers={red,blue};
    const vessel=mesh(math,new THREE.CylinderGeometry(.87,.87,2.2,32,1,true),p.glass,0,1.26,0);vessel.renderOrder=2;
    ring(math,0,2.36,0,.89,p.cream,.045);ring(math,0,.18,0,.89,p.cream,.035);
    for(let q=0;q<=4;q++){
      const y=.17+q/4*2.1;
      box(math,.83,y,.52,.18,.024,.04,p.cream);
      label(math,`${q===0?'0':q===4?'1':q===2?'1/2':`${q}/4`} L`,1.2,y+.08,.68,.72);
    }
    const target=(level.goal.redTicks+level.goal.blueTicks)/24*2.1+.17;
    ring(math,0,target,0,.92,p.gold,.025);
    label(math,`${fraction(model.redTicks+model.blueTicks)} L / 1 L`,0,2.95,0,2.6);
    label(math,`${text('แดง','Red')} ${fraction(model.redTicks)} L`, -1.43,.5,1.1,1.62,'#a64469');
    label(math,`${text('ฟ้า','Blue')} ${fraction(model.blueTicks)} L`,1.43,.5,1.1,1.62,'#26788f');
    for(const [ingredient,side,color]of[['red',-1,p.redLiquid],['blue',1,p.blueLiquid]]){
      const available=level.doses.filter(d=>d.ingredient===ingredient&&!model.used.includes(d.id));
      const all=level.doses.filter(d=>d.ingredient===ingredient);
      label(math,`${text(ingredient==='red'?'แดง':'ฟ้า',ingredient==='red'?'Red':'Blue')} × ${available.length}`,side*1.85,1.95,-.25,1.4);
      for(let i=0;i<available.length;i++){
        const dose=available[i],x=side*(1.65+(i%2)*.55),z=-.3+Math.floor(i/2)*.6;
        // A vial's liquid fill reflects its own volume, with a shared 1/2 L vial capacity.
        const bottle=new THREE.Group();bottle.position.set(x,0,z);math.add(bottle);
        mesh(bottle,new THREE.CylinderGeometry(.2,.2,.56,12,1,true),p.glass,0,.43,0);
        cylinder(bottle,0,.18+Math.min(dose.ticks/12,1)*.26,0,.17,.17,Math.max(.03,Math.min(dose.ticks/12,1)*.52),color,12);
        cylinder(bottle,0,.76,0,.08,.08,.16,p.gold,8);
        ring(bottle,0,.71,0,.2,p.cream,.025);
        label(bottle,`${dose.numerator}/${dose.denominator}`,0,1.04,0,.56);
        clickable(bottle,{type:'pour',doseId:dose.id});
      }
      if(!all.length)label(math,'0',side*1.8,.9,0,.7);
    }
    const previousModel=previous?.levelId===level.id?previous.model:null;
    const nextUsed=(model.used||[]).filter(id=>!previousModel?.used?.includes(id));
    if(previousModel&&!reduceMotion&&nextUsed.length===1&&(model.redTicks>previousModel.redTicks||model.blueTicks>previousModel.blueTicks)){
      const dose=level.doses.find(d=>d.id===nextUsed[0]);
      if(dose){
        stream=cylinder(math,dose.ingredient==='red'?-.3:.3,2.65,0,.025,.045,.65,dose.ingredient==='red'?p.redLiquid:p.blueLiquid,7);
        pourTween={from:{redTicks:previousModel.redTicks,blueTicks:previousModel.blueTicks},to:model,start:performance.now()};
        setPotionAmounts(previousModel.redTicks,previousModel.blueTicks);
      }
    }else setPotionAmounts(model.redTicks,model.blueTicks);
  }
  const render=()=>{if(!disposed&&!lost&&!hidden)renderer.render(scene,camera);};
  const resize=()=>{
    if(disposed)return;
    const width=Math.max(1,host.clientWidth||640),height=Math.max(1,host.clientHeight||420),aspect=width/height;
    const halfHeight=4.8;
    camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;
    if(aspect<1.35){camera.left=-6.8;camera.right=6.8;camera.top=6.8/aspect;camera.bottom=-6.8/aspect;}
    camera.updateProjectionMatrix();renderer.setSize(width,height,false);render();
  };
  const animate=now=>{
    raf=0;if(disposed||lost||hidden||reduceMotion)return;
    if(pourTween){
      const t=Math.min(1,(now-pourTween.start)/440),ease=t*t*(3-2*t);
      setPotionAmounts(pourTween.from.redTicks+(pourTween.to.redTicks-pourTween.from.redTicks)*ease,pourTween.from.blueTicks+(pourTween.to.blueTicks-pourTween.from.blueTicks)*ease);
      if(stream){stream.scale.x=.9+Math.sin(t*24)*.1;stream.visible=t<1;}
      if(t===1)pourTween=null;
    }
    if(dropTween){const t=Math.min(1,(now-dropTween.start)/380);dropTween.object.position.y=.17+.65*(1-t)**3;if(t===1)dropTween=null;}
    render();if(pourTween||dropTween)raf=requestAnimationFrame(animate);
  };
  const start=()=>{if((pourTween||dropTween)&&!disposed&&!lost&&!hidden&&!reduceMotion&&!raf)raf=requestAnimationFrame(animate);else render();};
  const settle=()=>{if(dropTween){dropTween.object.position.y=.17;dropTween=null;}if(pourTween){setPotionAmounts(pourTween.to.redTicks,pourTween.to.blueTicks);pourTween=null;}if(stream)stream.visible=false;};
  const visibility=()=>{hidden=document.hidden;if(hidden){if(raf)cancelAnimationFrame(raf);raf=0;settle();}else start();};
  const motion=event=>{reduceMotion=event.matches;if(raf)cancelAnimationFrame(raf);raf=0;if(reduceMotion)settle();start();};
  const contextLost=event=>{event.preventDefault();lost=true;if(raf)cancelAnimationFrame(raf);raf=0;canvas.style.display='none';host.dataset.world3d='fallback';host.classList.remove('fq-world-ready');};
  const contextRestored=()=>{if(disposed)return;lost=false;canvas.style.display='block';host.dataset.world3d='ready';host.classList.add('fq-world-ready');resize();start();};
  canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);
  document.addEventListener('visibilitychange',visibility);reduced?.addEventListener?.('change',motion);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
  observer?.observe(host);if(!observer)window.addEventListener('resize',resize);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart=null;
  const pointerDown=event=>{if(event.isPrimary!==false)pointerStart={x:event.clientX,y:event.clientY};};
  const pointerCancel=()=>{pointerStart=null;};
  const pointerUp=event=>{
    const initial=pointerStart;pointerStart=null;
    if(!initial||disposed||lost||hidden||!canInteract||Math.hypot(event.clientX-initial.x,event.clientY-initial.y)>8)return;
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    let object=raycaster.intersectObjects(hitTargets,true)[0]?.object;
    while(object&&!object.userData.action)object=object.parent;
    if(object?.userData.action)onAction({...object.userData.action});
  };
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerCancel);
  const api={
    update({state,level,completedIds=state?.completedIds||[],language:nextLanguage}={}){
      if(disposed)return;if(nextLanguage)language=nextLanguage;
      canInteract=!!state&&!state.solved&&!state.finished;canvas.style.cursor=canInteract?'pointer':'default';
      const ids=Array.isArray(completedIds)?completedIds:[];
      crystals.forEach((c,i)=>{c.material=ids.includes(`${['bridge','equivalent','potion'][Math.floor(i/4)]}-${i%4+1}`)?p.crystal:p.dormant;});
      const key=JSON.stringify([level?.id,state?.model,language]);
      if(key!==lastKey){
        lastKey=key;const previous=live;clearMath();
        if(state?.model&&level){
          if(level.kind==='bridge')drawBridge(state.model,level,previous);
          else if(level.kind==='equivalent')drawEquivalent(state.model,level);
          else if(level.kind==='potion')drawPotion(state.model,level,previous);
        }
        live=state?.model?{levelId:level?.id,model:JSON.parse(JSON.stringify(state.model))}:null;
      }
      start();
    },
    setLanguage(nextLanguage){language=nextLanguage;lastKey='';},
    dispose(){
      if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);observer?.disconnect();
      document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',resize);reduced?.removeEventListener?.('change',motion);
      canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);
      canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerCancel);
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
      renderer.renderLists.dispose();renderer.dispose();canvas.remove();host.classList.remove('fq-world-ready');delete host.dataset.world3d;
      live=null;pourTween=null;dropTween=null;hitTargets=[];canInteract=false;
    },
  };
  resize();return api;
}
