'use strict';
(() => {
  const canvas = document.querySelector('#world');
  const ctx = canvas.getContext('2d');
  const W = 1440, H = 720, GROUND = 625, LENGTH = 7200;
  const base = 'assets/sprites/';
  const files = {
    hunter:'05-hunter.png', skeleton:'06-skeleton-warrior.png', nun:'07-lantern-nun.png', ghost:'08-ghost.png', zombie:'09-zombie.png',
    grave:'10-headstone.png', tree:'11-dead-tree.png', candle:'12-candelabrum.png', drape:'13-drapes.png', ground:'14-ground-tiles.png',
    wall:'15-stone-wall.png', door:'16-arched-door.png', fence:'17-iron-fence.png', pillar:'18-stone-pillar.png', goblin:'19-fire-goblin.png',
    shaman:'20-fire-goblin-shaman.png', spirit:'21-water-spirit.png', wisp:'22-water-wisp.png', tower:'23-castle-tower.png', battlement:'24-castle-battlements.png',
    arch:'25-gothic-arch.png', chandelier:'26-chandelier.png', throne:'27-throne.png', barrel:'28-crate-barrel.png', banner:'29-banner.png'
  };
  const scenes = {
    graveyard:{title:'The Graveyard',kicker:'THE OUTER GROUNDS',roman:'I',num:'01',bg:'01-graveyard',description:'Beyond the iron gates, the dead keep watch beneath a blood-red moon.',back:[['tree',240,310],['tower',1600,350],['tree',3300,350],['tower',5000,390],['tree',6800,330]],middle:[['fence',160,95],['grave',720,125],['fence',1100,100],['grave',1750,135],['tree',2350,370],['fence',3100,95],['grave',3800,120],['tree',4500,345],['fence',5100,95],['grave',6000,145],['arch',6700,310]],front:[['nun',420,165],['candle',1050,175],['skeleton',1500,180],['grave',2100,130],['zombie',2700,180],['candle',3400,175],['skeleton',4000,175],['goblin',4650,175],['grave',5350,145],['shaman',5950,200],['candle',6450,175]]},
    chapel:{title:'The Hollow Chapel',kicker:'THE HOLLOW SANCTUARY',roman:'II',num:'02',bg:'02-chapel',description:'Candles still burn in a sanctuary where the faithful have long since fallen silent.',back:[['wall',100,410],['wall',1200,410],['wall',2700,410],['wall',4300,410],['wall',6100,410]],middle:[['pillar',250,400],['drape',800,250],['arch',1300,385],['pillar',2050,400],['drape',2750,250],['pillar',3400,400],['arch',4200,385],['drape',5100,250],['pillar',5800,400],['door',6650,340]],front:[['candle',460,190],['nun',850,180],['chandelier',1400,170,-335],['ghost',1900,220,-130],['candle',2450,190],['skeleton',3100,175],['throne',3900,270],['candle',4400,190],['ghost',5000,230,-140],['chandelier',5600,175,-335],['shaman',6300,190]]},
    crypt:{title:'The Lower Crypt',kicker:'THE LOWER VAULTS',roman:'III',num:'03',bg:'03-crypt',description:'Beneath the chapel, old stone corridors wind toward things better left buried.',back:[['wall',0,420],['wall',1600,420],['wall',3200,420],['wall',4900,420],['wall',6500,420]],middle:[['arch',200,390],['pillar',900,390],['arch',1600,390],['pillar',2450,390],['door',3200,340],['pillar',4000,390],['arch',4700,390],['pillar',5500,390],['door',6300,340]],front:[['barrel',500,115],['zombie',1050,185],['candle',1500,170],['skeleton',2150,180],['barrel',2700,115],['ghost',3400,190,-100],['zombie',4000,190],['candle',4650,180],['goblin',5300,180],['barrel',5750,120],['shaman',6500,195]]},
    garden:{title:'The Forgotten Garden',kicker:'THE FORGOTTEN COURT',roman:'IV',num:'04',bg:'04-castle-garden',description:'A moonlit court where broken arches and restless spirits guard the castle approach.',back:[['tower',180,390],['tree',1550,350],['tower',3400,390],['tree',5150,380],['tower',6650,390]],middle:[['arch',350,330],['fence',950,95],['tree',1600,350],['arch',2400,330],['fence',3100,95],['tree',3900,370],['arch',4600,330],['fence',5300,95],['arch',6250,330]],front:[['grave',500,130],['spirit',1000,235,-90],['candle',1550,170],['skeleton',2100,180],['wisp',2700,150,-100],['grave',3300,130],['spirit',4000,230,-80],['barrel',4650,110],['goblin',5200,185],['wisp',5800,145,-100],['candle',6400,170]]}
  };
  const images = {}; let scene = 'graveyard', player = 320, camera = 0, time = 0, last = 0, direction = 1;
  const keys = new Set(), held = new Set();
  const loadImage = src => new Promise((resolve,reject) => {const img = new Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(new Error('Could not load '+src)); img.src=src;});
  const allImages = [...Object.entries(files).map(async ([id,file]) => {images[id]=await loadImage(base+file);}), ...Object.entries(scenes).map(async ([id,s]) => {images['bg_'+id]=await loadImage('assets/backgrounds/'+s.bg+'.jpg');})];
  function background(img, offset) {
    const scale = H / img.height, width = img.width * scale;
    // Mirrored repeats make the reconstruction's unavoidable boundary less abrupt.
    const start = Math.floor(offset / width) - 1;
    for (let i=start;i<start+5;i++) {const x=i*width-offset;ctx.save();if(Math.abs(i)%2===1){ctx.translate(x+width,0);ctx.scale(-1,1);ctx.drawImage(img,0,0,width,H);}else ctx.drawImage(img,x,0,width,H);ctx.restore();}
    ctx.fillStyle='rgba(15, 8, 24, .13)';ctx.fillRect(0,0,W,H);
  }
  function sprite(id, x, height, baseline=GROUND, opacity=1, flip=false) {
    const image=images[id]; if (!image) return;
    const width=height*image.width/image.height;
    if(x+width < -150 || x-width > W+150) return;
    ctx.save();ctx.globalAlpha=opacity;
    if(flip){ctx.translate(x+width/2,0);ctx.scale(-1,1);ctx.drawImage(image,-width/2,baseline-height,width,height);} else ctx.drawImage(image,x-width/2,baseline-height,width,height);
    ctx.restore();
  }
  function layer(items, factor, opacity) {for(const [id,x,height,yOffset=0] of items) {let bob=(id==='ghost'||id==='spirit'||id==='wisp')?Math.sin(time/700+x)*7:0;sprite(id,x-camera*factor,height,GROUND+yOffset+bob,opacity);}}
  function ground() {ctx.fillStyle='#201522';ctx.fillRect(0,GROUND,W,H-GROUND);const img=images.ground;const h=96,w=h*img.width/img.height;const offset=((camera%w)+w)%w;for(let x=-offset;x<W;x+=w)ctx.drawImage(img,x,GROUND-4,w,h);ctx.fillStyle='rgba(13,8,18,.24)';ctx.fillRect(0,GROUND+75,W,25);}
  function render(timestamp) {
    const dt=Math.min((timestamp-last)/1000 || 0, .05);last=timestamp;time=timestamp;
    const move=(keys.has('ArrowRight')||keys.has('KeyD')||held.has('right')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')||held.has('left')?1:0);
    if(move){player=Math.max(190,Math.min(LENGTH-180,player+move*370*dt));direction=move;}
    const target=Math.max(0,Math.min(LENGTH-W,player-W*.34));camera+=(target-camera)*Math.min(1,dt*7);
    ctx.clearRect(0,0,W,H);background(images['bg_'+scene],camera*.14);
    layer(scenes[scene].back,.32,1);layer(scenes[scene].middle,.65,1);layer(scenes[scene].front,1,1);ground();
    const bounce=move?Math.sin(time/105)*3:Math.sin(time/800)*1.5;
    sprite('hunter',player-camera,230,GROUND+4+bounce,1,direction<0);
    const pct=Math.round(Math.max(0,Math.min(1,(player-190)/(LENGTH-370)))*100);
    document.querySelector('#progress').style.width=pct+'%';document.querySelector('#distance').textContent=String(pct).padStart(2,'0')+'%';
    requestAnimationFrame(render);
  }
  function selectScene(id){if(!scenes[id])return;scene=id;player=320;camera=0;keys.clear();held.clear();const s=scenes[id];document.querySelectorAll('.tab').forEach(b=>{const active=b.dataset.scene===id;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});document.querySelector('#scene-title').textContent=s.title;document.querySelector('#scene-description').textContent=s.description;document.querySelector('#scene-kicker').textContent=s.kicker;document.querySelector('#scene-number').textContent=s.num+' / 04';document.querySelector('#scene-index').textContent=s.roman;}
  window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}else if(e.code==='KeyA'||e.code==='KeyD')keys.add(e.code);});
  window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();held.clear();});
  document.querySelectorAll('.tab').forEach(button=>button.addEventListener('click',()=>selectScene(button.dataset.scene)));
  for(const id of ['left','right']){const button=document.getElementById(id);button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);held.add(id);});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>held.delete(id));}
  Promise.all(allImages).then(()=>{document.querySelector('#loading').classList.add('hidden');requestAnimationFrame(render);}).catch(err=>{document.querySelector('#loading').textContent='Unable to load the artwork. Please serve this folder from the project root.';console.error(err);});
})();
