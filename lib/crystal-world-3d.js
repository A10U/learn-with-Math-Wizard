// Scene is a view of crystal-quest state. The accessible DOM controls own all actions.
// Three.js is loaded only when this mode mounts, never by the home page.
export async function mountCrystalWorld(host, { onAction = () => {}, language = 'th' } = {}) {
  if (!host || typeof window === 'undefined') return null;
  let THREE;
  try { THREE = await import('./vendor/three/three.module.min.js'); } catch { host.dataset.world3d = 'fallback'; return null; }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch { host.dataset.world3d = 'fallback'; return null; }
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.append(canvas);
  host.dataset.world3d = 'ready';
  host.classList.add('cq-world-ready');

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, .1, 100);
  camera.position.set(10, 10.5, 14);
  camera.lookAt(0, 1.1, 0);
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const material = (color, extra = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: .8, flatShading: true, ...extra }); materials.add(m); return m; };
  const palette = {
    grass: material(0x83b84e), edge: material(0x487f55), soil: material(0x5a496f), rock: material(0x837393),
    stone: material(0xe2d3b4), wood: material(0xa7754d), trunk: material(0x76513c), leaf: material(0x3e8a63),
    lightLeaf: material(0x85bb6a), roof: material(0xe07971), wall: material(0xffe8c4), purple: material(0x7754a9),
    gold: material(0xffce68), blue: material(0x68c7dc), pink: material(0xf1a3bc), cream: material(0xfff4d7),
    dormant: material(0xa5a8bc), crystal: material(0xa4ecda, { emissive: 0x2b9b8a, emissiveIntensity: .32, metalness: .25, roughness: .25 }),
  };
  const geometry = g => { geometries.add(g); return g; };
  const mesh = (g, m, parent, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(geometry(g), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
  };
  const box = (parent, x,y,z,w,h,d,m) => mesh(new THREE.BoxGeometry(w,h,d),m,parent,x,y,z);
  const cylinder = (parent,x,y,z,top,bottom,height,m,sides=8) => mesh(new THREE.CylinderGeometry(top,bottom,height,sides),m,parent,x,y,z);
  const cone = (parent,x,y,z,r,h,m,sides=6) => mesh(new THREE.ConeGeometry(r,h,sides),m,parent,x,y,z);
  const world = new THREE.Group(); scene.add(world);
  scene.add(new THREE.HemisphereLight(0xfff7df, 0x8c7cba, 2.7));
  const sun = new THREE.DirectionalLight(0xffebd1, 3.5); sun.position.set(-5,12,7); sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:35}); sun.shadow.bias=-.0005; scene.add(sun);
  const rim = new THREE.DirectionalLight(0x9ce9ff,1.4); rim.position.set(5,5,-8); scene.add(rim);

  // Faceted floating island with grassy terraces and suspended stepping islands.
  const island = (parent,x,y,z,r) => {
    cylinder(parent,x,y-.55,z,r*.89,r*.55,1.5,palette.soil,7);
    cone(parent,x,y-1.65,z,r*.56,1.5,palette.rock,7).rotation.z=Math.PI;
    cylinder(parent,x,y+.13,z,r,r*.95,.32,palette.edge,9);
    cylinder(parent,x,y+.35,z,r*.97,r,.18,palette.grass,9);
  };
  island(world,0,0,0,5.1);
  island(world,-5.6,-.15,-.8,1.5);
  island(world,5.25,.4,-1.8,1.45);
  const bridgePlanks=[];
  for (let i=0;i<8;i++) {
    bridgePlanks.push(box(world,-4.2-i*.2,.45,-.8, .25,.12,.9,palette.wood));
    bridgePlanks.push(box(world,3.7+i*.19,.65,-1.8,.24,.12,.75,palette.wood));
  }
  for (const [x,z] of [[-4.25,-1.28],[-5.25,-1.28],[3.8,-2.2],[4.95,-2.2]]) cylinder(world,x,.95,z,.04,.05,1,palette.wood,5);
  // Terraced village behind the mathematical workbench.
  box(world,-.2,.62,-1.6,5.6,.4,2.6,palette.edge);
  box(world,-.2,.87,-1.6,5.55,.14,2.55,palette.grass);
  const tree = (x,z,s=1) => {
    const g=new THREE.Group();g.position.set(x,.45,z);g.scale.setScalar(s);world.add(g);
    cylinder(g,0,.55,0,.11,.16,1.1,palette.trunk,6);
    cone(g,0,1.25,0,.65,1.1,palette.leaf);
    cone(g,0,1.85,0,.48,1.0,palette.lightLeaf);
  };
  [[-3.2,-1.8,1.1],[-2.8,-2.7,.8],[-1.8,-3.0,1.0],[2.9,-1.3,.8],[3.4,-.4,1],[-5.9,-1.1,.75]].forEach(a=>tree(...a));
  // Windmill, slowly turning sails.
  cylinder(world,-1.1,1.8,-1.8,.48,.64,1.75,palette.wall);
  cone(world,-1.1,2.9,-1.8,.72,.8,palette.roof);
  const sails=new THREE.Group();sails.position.set(-1.1,2.45,-1.21);world.add(sails);
  for(let i=0;i<4;i++){const sail=new THREE.Group();sail.rotation.z=i*Math.PI/2;box(sail,0,.63,0,.17,1.35,.08,palette.wood);box(sail,.17,.85,.01,.38,.75,.06,palette.cream);sails.add(sail);}
  cylinder(sails,0,0,.08,.12,.12,.2,palette.gold).rotation.x=Math.PI/2;
  box(world,-1.1,1.24,-1.24,.25,.48,.06,palette.wood);
  // Lighthouse and its glowing lantern.
  cylinder(world,5.3,1.8,-1.8,.36,.53,2.1,palette.wall);
  cylinder(world,5.3,2.4,-1.8,.4,.4,.26,palette.roof);
  const lantern=cylinder(world,5.3,2.95,-1.8,.37,.37,.53,palette.dormant);
  cone(world,5.3,3.35,-1.8,.62,.45,palette.purple);
  let lighthouseStrength=0;
  const beacon = new THREE.PointLight(0xffda83, 0, 4);beacon.position.set(5.3,2.95,-1.8);world.add(beacon);
  const blooms=[];
  for(let i=0;i<3;i++){
    const flower=new THREE.Group();flower.position.set(.2+i*.8,.95,-1.5);world.add(flower);
    cylinder(flower,0,.2,0,.035,.035,.4,palette.leaf,5);
    const bloom=mesh(new THREE.IcosahedronGeometry(.25,0),palette.dormant,flower,0,.5,0);blooms.push(bloom);
  }
  // Small wizard watches the player's workbench.
  const wizard=new THREE.Group();wizard.position.set(-2.75,.55,.65);world.add(wizard);
  cone(wizard,0,.45,0,.34,.8,palette.purple);
  mesh(new THREE.IcosahedronGeometry(.22,1),palette.cream,wizard,0,1,0);
  cylinder(wizard,0,1.18,0,.38,.38,.07,palette.purple);
  cone(wizard,.02,1.47,0,.3,.62,palette.purple).rotation.z=-.15;
  cylinder(wizard,.43,.65,.04,.035,.035,1.05,palette.wood);
  mesh(new THREE.OctahedronGeometry(.13),palette.gold,wizard,.43,1.23,.04);
  // Nine restoration crystals directly follow engine completion, never local clicks.
  const crystals=[];
  for(let i=0;i<9;i++) {
    const angle=-Math.PI*.15+i*Math.PI*1.3/8;
    const x=Math.cos(angle)*3.8,z=Math.sin(angle)*3.1;
    cylinder(world,x,.58,z,.32,.4,.27,palette.stone,6);
    const shard=mesh(new THREE.OctahedronGeometry(.3,0),palette.dormant,world,x,1.03,z);shard.scale.y=1.7;crystals.push(shard);
  }
  // Foreground platform gives the concrete math model a clear, quiet place.
  const workbench=new THREE.Group();workbench.position.set(.15,.57,1.3);world.add(workbench);
  cylinder(workbench,0,-.06,0,2.45,2.6,.2,palette.stone,10);
  let mathGroup=new THREE.Group();workbench.add(mathGroup);
  let hitTargets=[], walking=null, walkingTween=null, lastKey='', lastLevelId=null, liveState=null, liveLevel=null;
  const clearMath=()=>{
    mathGroup.traverse(o=>{if(o.geometry){o.geometry.dispose();geometries.delete(o.geometry);} if(o.material&&!Object.values(palette).includes(o.material)){if(o.material.map){o.material.map.dispose();textures.delete(o.material.map);}o.material.dispose();materials.delete(o.material);}});
    workbench.remove(mathGroup);mathGroup=new THREE.Group();workbench.add(mathGroup);hitTargets=[];walking=null;walkingTween=null;
  };
  const clickable=(object,action)=>{object.userData.action=action;hitTargets.push(object);return object;};
  const numberLabel=(value,parent,x,y,z,width=.4)=>{
    const surface=document.createElement('canvas');surface.width=128;surface.height=80;
    const context=surface.getContext('2d');if(!context)return;
    context.font='700 48px sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillStyle='#354358';context.fillText(String(value),64,40);
    const texture=new THREE.CanvasTexture(surface);texture.colorSpace=THREE.SRGBColorSpace;textures.add(texture);
    const mat=new THREE.SpriteMaterial({map:texture,depthWrite:false,transparent:true});materials.add(mat);
    const label=new THREE.Sprite(mat);label.position.set(x,y,z);label.scale.set(width,width*.625,1);parent.add(label);
  };
  const token=(parent,x,y,z,color,r=.105)=>cylinder(parent,x,y,z,r,r,.14,color,12);
  function drawMath(state,level) {
    const key=JSON.stringify([level?.id,state?.model]);if(key===lastKey)return;
    const oldPosition=lastLevelId===level?.id?walking?.position.x:null;lastKey=key;lastLevelId=level?.id;clearMath();
    if(!state?.model||!level)return;
    const m=state.model;
    if(level.kind==='frames') {
      for(const [side,cx,color]of[['left',-1.1,palette.blue],['right',1.1,palette.pink]]) {
        const tray=box(mathGroup,cx,.08,0,1.95,.13,1.02,palette.wood);
        clickable(tray,{type:'move',from:side});
        for(let i=0;i<10;i++) {
          const x=cx+(i%5-2)*.34,z=(Math.floor(i/5)-.5)*.4;
          cylinder(mathGroup,x,.17,z,.135,.135,.025,palette.cream,12);
          if(i<m[side]){const t=token(mathGroup,x,.27,z,color,.128);clickable(t,{type:'move',from:side});}
        }
      }
    } else if(level.kind==='route') {
      const min=level.min??0,max=level.max??12,n=max-min;
      for(let value=min;value<=max;value++) {
        const x=-2.05+(value-min)/n*4.1;
        const stone=box(mathGroup,x,.13,0,Math.min(.33,3.5/(n+1)),.23,.55,value===level.goal.target?palette.gold:palette.cream);
        numberLabel(value,mathGroup,x,.52,-.48,.34);
        if(value===level.goal.target)mesh(new THREE.OctahedronGeometry(.15),palette.crystal,mathGroup,x,.55,0);
      }
      walking=new THREE.Group();
      const targetX=-2.05+(m.position-min)/n*4.1;
      walking.position.set(!reduceMotion&&oldPosition!=null?oldPosition:targetX,.46,0);mathGroup.add(walking);
      if(!reduceMotion&&oldPosition!=null&&oldPosition!==targetX)walkingTween={from:oldPosition,to:targetX,start:performance.now()};
      cone(walking,0,.16,0,.13,.33,palette.purple);mesh(new THREE.IcosahedronGeometry(.1),palette.cream,walking,0,.39,0);cone(walking,0,.57,0,.16,.3,palette.purple);
      (level.steps||[]).forEach((step,i)=>{
        const used=m.used.includes(step.id),x=-1.32+i*.88;
        const tile=box(mathGroup,x,.12,.87,.6,.17,.37,used?palette.dormant:step.value>0?palette.blue:palette.pink);
        if(!used)clickable(tile,{type:'step',stepId:step.id});
        numberLabel(`${step.value>0?'+':''}${step.value}`,mathGroup,x,.58,.87,.47);
        for(let j=0;j<Math.min(Math.abs(step.value),6);j++)token(mathGroup,x-.2+j*.08,.24,.87,palette.cream,.028);
      });
    } else if(level.kind==='bundle') {
      const rods=new THREE.Group();rods.position.x=-1.12;mathGroup.add(rods);
      for(let i=0;i<m.tens;i++) {
        const rod=box(rods,(i%4)*.33-.5,.21,Math.floor(i/4)*.38-.2,.23,.22,1.18,palette.gold);
        clickable(rod,{type:'unbundle'});
        for(let j=0;j<9;j++)box(rods,(i%4)*.33-.5,.332,Math.floor(i/4)*.38-.7+j*.12,.235,.015,.013,palette.wood);
      }
      for(let i=0;i<m.ones;i++) {
        const x=.45+(i%5)*.27,z=-.5+Math.floor(i/5)*.28;
        const cube=box(mathGroup,x,.22,z,.21,.23,.21,palette.blue);clickable(cube,{type:'bundle'});
      }
      box(mathGroup,-1.05,.03,0,1.7,.07,1.65,palette.wood);box(mathGroup,1.02,.03,0,1.7,.07,1.65,palette.wood);
    }
  }

  let disposed=false, raf=0, hidden=document.hidden, lost=false;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reduceMotion=!!reduced?.matches;
  const render=()=>{if(!disposed&&!lost&&!hidden)renderer.render(scene,camera);};
  const resize=()=>{
    if(disposed)return;
    const width=Math.max(1,host.clientWidth||640),height=Math.max(1,host.clientHeight||400),aspect=width/height;
    const halfHeight=aspect<1.1?6.65:5.35;
    camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();
    // On portrait cards fit the complete island horizontally.
    if(aspect<1.1){camera.left=-7.8;camera.right=7.8;camera.top=7.8/aspect;camera.bottom=-7.8/aspect;camera.updateProjectionMatrix();}
    renderer.setSize(width,height,false);render();
  };
  const animate=now=>{
    raf=0;if(disposed||hidden||lost||reduceMotion)return;
    const t=now*.001;
    world.position.y=Math.sin(t*.7)*.08;
    sails.rotation.z=t*.22;
    crystals.forEach((c,i)=>{c.rotation.y=t*.35+i;c.position.y=1.03+Math.sin(t*1.2+i)*.055;});
    beacon.intensity=lighthouseStrength*(6+Math.sin(t*1.7)*1.1);
    if(walking&&walkingTween){const progress=Math.min(1,(now-walkingTween.start)/350),ease=1-(1-progress)**3;walking.position.x=walkingTween.from+(walkingTween.to-walkingTween.from)*ease;walking.position.y=.46+Math.sin(progress*Math.PI)*.2;if(progress===1)walkingTween=null;}
    render();raf=requestAnimationFrame(animate);
  };
  const start=()=>{if(!disposed&&!hidden&&!lost&&!reduceMotion&&!raf)raf=requestAnimationFrame(animate);else render();};
  const visibility=()=>{hidden=document.hidden;if(hidden&&raf){cancelAnimationFrame(raf);raf=0;}else start();};
  const motion=event=>{reduceMotion=event.matches;if(raf){cancelAnimationFrame(raf);raf=0;}if(reduceMotion){world.position.y=0;if(walkingTween&&walking){walking.position.set(walkingTween.to,.46,0);walkingTween=null;}render();}else start();};
  const contextLost=event=>{event.preventDefault();lost=true;if(raf)cancelAnimationFrame(raf);raf=0;canvas.style.display='none';host.dataset.world3d='fallback';host.classList.remove('cq-world-ready');};
  canvas.addEventListener('webglcontextlost',contextLost);
  document.addEventListener('visibilitychange',visibility);
  reduced?.addEventListener?.('change',motion);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
  observer?.observe(host);if(!observer)window.addEventListener('resize',resize);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart=null;
  const pointerDown=event=>{pointerStart={x:event.clientX,y:event.clientY};};
  const pointerUp=event=>{
    if(disposed||lost||liveState?.solved||!pointerStart)return;
    const startPoint=pointerStart;pointerStart=null;
    if(Math.hypot(event.clientX-startPoint.x,event.clientY-startPoint.y)>8)return;
    const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(hitTargets,false)[0];if(hit?.object.userData.action)onAction({...hit.object.userData.action});
  };
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);
  const api={
    update({state,level,completedIds=state?.completedIds||[],language:nextLanguage}={}){
      if(disposed)return;liveState=state;liveLevel=level;if(nextLanguage)language=nextLanguage;
      const ids=Array.isArray(completedIds)?completedIds:[];
      crystals.forEach((c,i)=>{const id=`${['garden','bridges','lighthouse'][Math.floor(i/3)]}-${i%3+1}`;c.material=ids.includes(id)?palette.crystal:palette.dormant;});
      blooms.forEach((b,i)=>{const restored=ids.includes(`garden-${i+1}`);b.material=restored?palette.pink:palette.dormant;b.scale.setScalar(restored?1:.45);});
      const bridgeCount=ids.filter(id=>id.startsWith('bridges-')).length;bridgePlanks.forEach((plank,i)=>{plank.material=i/bridgePlanks.length<bridgeCount/3?palette.blue:palette.wood;});
      lighthouseStrength=ids.filter(id=>id.startsWith('lighthouse-')).length/3;lantern.material=lighthouseStrength?palette.gold:palette.dormant;beacon.intensity=6*lighthouseStrength;
      drawMath(state,level);render();
    },
    setLanguage(nextLanguage){language=nextLanguage;},
    dispose(){
      if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);observer?.disconnect();
      document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',resize);reduced?.removeEventListener?.('change',motion);
      canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());sun.shadow.map?.dispose();renderer.renderLists.dispose();renderer.dispose();
      canvas.remove();host.classList.remove('cq-world-ready');delete host.dataset.world3d;hitTargets=[];liveState=null;liveLevel=null;
    },
  };
  resize();start();return api;
}
