// Main script for The Button
(function(){
  // --- Utilities ---
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const rand = (min,max) => Math.floor(Math.random()*(max-min+1))+min;

  // --- DOM ---
  const btn = qs('#the-button');
  const countEl = qs('#count');
  const msgBox = qs('#message-box');
  const achievementsList = qs('#achievements-list');
  const loreList = qs('#lore-list');
  const toastArea = qs('#toast-area');
  const onboard = qs('#onboard');
  const gamerTagInput = qs('#gamer-tag');
  const humorToggle = qs('#humor-toggle');
  const acceptOnboard = qs('#accept-onboard');
  const gamerTagDisplay = qs('#gamer-tag-display');
  const visitorGreeting = qs('#visitor-greeting');
  const sidePanel = qs('#side-panel');

  // --- State ---
  const STORAGE_KEY = 'thebutton:v1';
  let state = {
    presses:0,
    achievements:[],
    loreSeen:[],
    gamerTag:'Traveler',
    humor:false,
    lastClicks:[],
    pranks:0,
  };

  // --- Data ---
  const messages = [
    'Interesting choice.','You could be doing homework.','The button appreciates your loyalty.','Your click has been recorded for scientific purposes.','Productivity levels unchanged.','The Department of Button Affairs has been notified.','Your FBI agent is taking notes.','That felt nice, didn\'t it?','A brief moment of joy was added to the universe.','You are now 0.001% closer to a secret.'
  ];

  // generate 100+ lore entries
  const lore = (function(){
    const base = [
      'The Button was discovered after the Great Cheese Incident of 1987.',
      'The Button predates civilization by at least three Tuesdays.',
      'The Button briefly served as mayor.',
      'It once convinced a lighthouse to change careers.',
      'Do not let the Button near a blender.',
      'The Button hums softly at 3:14am.',
      'A once-famous poet wrote an ode to the Button in invisible ink.'
    ];
    const out = [];
    for(let i=0;i<120;i++){
      out.push(base[i%base.length] + ' (Lore entry #' + (i+1) + ')');
    }
    return out;
  })();

  const achievementDefs = [
    {id:'a10',n:10,title:'No Self Control'},
    {id:'a25',n:25,title:'Button Apprentice'},
    {id:'a50',n:50,title:'Professional Button Enjoyer'},
    {id:'a100',n:100,title:'One With The Button'},
    {id:'a500',n:500,title:'Concerning Dedication'},
    {id:'a1000',n:1000,title:'Please Go Outside'},
  ];

  // --- Persistence ---
  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) state = Object.assign(state, JSON.parse(raw));
    }catch(e){console.warn('load err',e)}
  }
  function save(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){console.warn('save err',e)}
  }

  // --- UI ---
  function render(){
    countEl.textContent = state.presses;
    gamerTagDisplay.textContent = state.gamerTag || 'Welcome';
    visitorGreeting.textContent = 'Hello, ' + (state.gamerTag || 'Traveler');
    // achievements
    achievementsList.innerHTML = '';
    for(const a of achievementDefs){
      const li = document.createElement('li');
      li.textContent = `${a.title} — ${a.n} clicks`;
      if(state.achievements.includes(a.id)) li.style.opacity = '1'; else li.style.opacity='0.5';
      achievementsList.appendChild(li);
    }
    // lore
    loreList.innerHTML = '';
    state.loreSeen.forEach(i=>{
      const d = document.createElement('div'); d.textContent = lore[i]; loreList.appendChild(d);
    });
  }

  // --- Toaster ---
  function toast(text, opts={time:3500}){
    const t = document.createElement('div'); t.className='toast'; t.textContent = text;
    toastArea.appendChild(t);
    setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(8px)';}, opts.time-400);
    setTimeout(()=>t.remove(), opts.time);
  }

  // --- Achievements check ---
  function checkAchievements(){
    for(const a of achievementDefs){
      if(state.presses>=a.n && !state.achievements.includes(a.id)){
        state.achievements.push(a.id);
        toast(`Achievement unlocked: ${a.title}`);
        showAchievementPopup(a.title);
      }
    }
  }

  function showAchievementPopup(title){
    const el = document.createElement('div'); el.className='toast'; el.textContent = `🏆 ${title}`; toastArea.appendChild(el);
    setTimeout(()=>el.remove(), 2500);
  }

  // --- Lore unlocking ---
  function unlockLore(){
    if(state.presses>0 && state.presses%25===0){
      const idx = Math.floor(state.presses/25)-1;
      if(!state.loreSeen.includes(idx) && lore[idx]){
        state.loreSeen.push(idx);
        toast('Lore unlocked');
        save(); render();
      }
    }
  }

  // --- Spam detection and prank trigger ---
  function recordClickTime(){
    const now = Date.now();
    state.lastClicks.push(now);
    // keep last 20
    state.lastClicks = state.lastClicks.slice(-20);
    // check 10 clicks within 6 seconds
    const recent = state.lastClicks.filter(t=>now-t<=6000);
    if(recent.length>=10){
      state.lastClicks = [];
      triggerPrank();
    }
  }

  // --- Pranks ---
  const pranks = ['fakeUpdate','goose','fakeCall','alien','potato','teleport','dvd','secretReward','rickroll','bossFight'];
  function triggerPrank(){
    state.pranks++;
    save();
    const choice = pranks[rand(0,pranks.length-1)];
    // Some pranks have conditions or probabilities
    if(choice==='rickroll' && Math.random()>0.01) return; // very rare
    if(choice==='bossFight' && state.presses<50) return; // unlock later
    runPrank(choice);
    qs('#stat-pranks').textContent = state.pranks;
  }

  function runPrank(name){
    switch(name){
      case 'fakeUpdate': prankFakeUpdate(); break;
      case 'goose': prankGoose(); break;
      case 'fakeCall': prankFakeCall(); break;
      case 'alien': prankAlien(); break;
      case 'potato': prankPotato(); break;
      case 'teleport': prankTeleport(); break;
      case 'dvd': prankDVD(); break;
      case 'secretReward': prankSecretReward(); break;
      case 'rickroll': prankRickroll(); break;
      case 'bossFight': prankBossFight(); break;
      default: toast('Something strange happened.');
    }
  }

  // --- Individual pranks (polished but simple implementations) ---
  function prankFakeUpdate(){
    const modal = document.createElement('div'); modal.className='modal';
    const card = document.createElement('div'); card.className='modal-card glass';
    card.innerHTML = `<h3>System Update</h3><p class='muted'>Installing world-class improvements...</p>
      <div style='background:#021018;border-radius:10px;padding:10px;margin-top:8px'><div id='fu-bar' style='height:14px;background:linear-gradient(90deg,var(--accent),var(--accent-2));width:0;border-radius:8px;transition:width 400ms linear'></div></div>
      <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:12px'><button id='fu-close' class='pill'>Close</button></div>`;
    modal.appendChild(card); document.body.appendChild(modal);
    let p=0;
    const iv=setInterval(()=>{
      p += rand(4,9);
      if(p>99)p=99;
      card.querySelector('#fu-bar').style.width = p + '%';
      if(p>=99){ clearInterval(iv); setTimeout(()=>{card.querySelector('#fu-bar').style.width='0%'; card.querySelector('#fu-close').textContent='Dismiss'; card.querySelector('p').textContent='Update failed successfully.'},800); }
    },500);
    card.querySelector('#fu-close').onclick=()=>{modal.remove();}
  }

  function prankGoose(){
    // create goose img (simple animated div)
    const g = document.createElement('div'); g.style.position='fixed'; g.style.zIndex=1000; g.style.width='160px'; g.style.height='100px'; g.style.right='-200px'; g.style.bottom='120px'; g.style.background='url(https://i.imgur.com/6bKQZKp.png) center/contain no-repeat'; g.style.transition='right 900ms ease, transform 900ms'; document.body.appendChild(g);
    // steal button
    btn.disabled=true; btn.style.filter='grayscale(60%)';
    setTimeout(()=>{g.style.right='20px'; g.style.transform='rotate(-5deg)';},120);
    setTimeout(()=>{ msgBox.textContent='HONK. The button has been confiscated.'; },900);
    setTimeout(()=>{ g.style.right='-300px'; btn.disabled=false; btn.style.filter='none'; msgBox.textContent='The goose returned the button, grudgingly.'; g.remove(); qs('#stat-goose').textContent = Number(qs('#stat-goose').textContent||0) + 1; },10000);
  }

  function prankFakeCall(){
    const modal = document.createElement('div'); modal.className='modal';
    const card = document.createElement('div'); card.className='modal-card glass';
    card.innerHTML = `<h3>Incoming Call — Mom</h3><p class='muted'>Caller ID: Mom</p>
      <div style='display:flex;gap:8px;justify-content:center;margin-top:10px'><button id='call-answer' class='pill primary'>Answer</button><button id='call-decline' class='pill'>Decline</button></div>`;
    modal.appendChild(card); document.body.appendChild(modal);
    function finish(){ modal.remove(); toast('Voicemail: Stop pressing that button.'); }
    card.querySelector('#call-answer').onclick = finish; card.querySelector('#call-decline').onclick = finish;
  }

  function prankAlien(){
    const modal = document.createElement('div'); modal.className='modal';
    const card = document.createElement('div'); card.className='modal-card glass';
    card.innerHTML = `<h3>— SIGNAL —</h3><pre style='font-family:monospace;white-space:pre-wrap'>${Array.from({length:8}).map(()=> '>' + Math.random().toString(36).slice(2,12)).join('\n')}</pre><p class='muted'>Signal lost. Aliens pressed the button too.</p>`;
    modal.appendChild(card); document.body.appendChild(modal);
    setTimeout(()=>modal.remove(),4200);
  }

  function prankPotato(){
    const modal = document.createElement('div'); modal.className='modal';
    const card = document.createElement('div'); card.className='modal-card glass';
    card.innerHTML = `<h3>Potential Potato CAPTCHA</h3><p class='muted'>Please confirm you are not a potato.</p>
      <div style='display:flex;gap:8px;justify-content:center;margin-top:10px'><button class='pill'>I am human</button><button class='pill'>I am a goat</button></div>
      <p class='muted' style='text-align:center;margin-top:12px'>Potential potato detected.</p>`;
    modal.appendChild(card); document.body.appendChild(modal);
    setTimeout(()=>{qs('#stat-potato').textContent = Number(qs('#stat-potato').textContent||0) + 1;},400);
    setTimeout(()=>modal.remove(),2600);
  }

  function prankTeleport(){
    const original = btn.getBoundingClientRect();
    let moves = 0; const max=18;
    function moveRandom(){
      const w = window.innerWidth, h = window.innerHeight;
      const nx = rand(80,w-220); const ny= rand(120,h-220);
      btn.style.position='fixed'; btn.style.left=nx+'px'; btn.style.top=ny+'px'; btn.style.transition='left 300ms ease, top 300ms ease';
      moves++; if(moves<max) setTimeout(moveRandom, 350);
      else setTimeout(()=>{ btn.style.position=''; btn.style.left=''; btn.style.top=''; toast('Absolutely Bamboozled'); },1200);
    }
    moveRandom();
  }

  function prankDVD(){
    // Simple DVD bouncing logo for 10s
    const logo = document.createElement('div'); logo.className='dvd-logo'; logo.textContent='DVD'; document.body.appendChild(logo);
    let dx=4,dy=3; let x=50,y=50; const w=logo.offsetWidth,h=logo.offsetHeight; const iv = setInterval(()=>{
      x+=dx; y+=dy; if(x+ w >= window.innerWidth-8 || x<=8) dx*=-1; if(y+h>=window.innerHeight-8 || y<=8) dy*=-1; logo.style.left=x+'px'; logo.style.top=y+'px';
    },16);
    setTimeout(()=>{clearInterval(iv); logo.remove();},10000);
  }

  function prankSecretReward(){
    const modal = document.createElement('div'); modal.className='modal';
    const card = document.createElement('div'); card.className='modal-card glass';
    card.innerHTML=`<h3>🎁 Secret Reward Unlocked</h3><p class='muted'>Click to claim.</p><div style='display:flex;justify-content:center'><button id='claim' class='pill primary'>Claim Reward</button></div>`;
    modal.appendChild(card); document.body.appendChild(modal);
    card.querySelector('#claim').onclick = ()=>{ card.querySelector('p').textContent='Processing...'; setTimeout(()=>{card.querySelector('p').textContent='Congratulations. You won absolutely nothing.'; card.querySelector('#claim').remove(); setTimeout(()=>modal.remove(),2200);},1600); };
  }

  function prankRickroll(){
    const modal = document.createElement('div'); modal.className='modal';
    const card = document.createElement('div'); card.className='modal-card glass';
    card.innerHTML=`<h3>Secret Content</h3><iframe width='560' height='315' src='https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1' title='YouTube video' frameborder='0' allow='autoplay; encrypted-media' allowfullscreen style='width:100%;height:240px;border-radius:8px'></iframe>`;
    modal.appendChild(card); document.body.appendChild(modal);
  }

  function prankBossFight(){
    // Simple boss fight overlay
    const modal = document.createElement('div'); modal.className='modal'; const card=document.createElement('div'); card.className='modal-card glass';
    let hp = 80; card.innerHTML=`<h3>Button Prime</h3><div id='boss-hp' style='height:16px;background:#022;color:var(--neon);border-radius:8px'></div><p class='muted'>Click the button to damage the boss.</p>`;
    modal.appendChild(card); document.body.appendChild(modal);
    const hpBar = card.querySelector('#boss-hp');
    function damage(){ hp -= rand(6,14); if(hp<0) hp=0; hpBar.style.width = (hp) + '%'; if(hp<=0){ toast('Slight Sense of Accomplishment'); modal.remove(); } }
    // hook button temporarily
    const old = btn.onclick; btn.onclick = ()=>{ state.presses++; save(); render(); damage(); checkAchievements(); };
    setTimeout(()=>{ btn.onclick = old; modal.remove(); },12000);
  }

  // --- Button click handler ---
  btn.addEventListener('click', ()=>{
    recordClickTime();
    state.presses++;
    // animations
    btn.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:260});
    // color pulse
    btn.style.boxShadow = '0 30px 90px rgba(124,118,255,0.18)'; setTimeout(()=>btn.style.boxShadow='',350);
    // messages
    msgBox.textContent = messages[rand(0,messages.length-1)];
    unlockLore(); checkAchievements(); save(); render();
    // minor chance for secret reward
    if(Math.random()<0.005) triggerPrank();
  });

  // --- Onboarding ---
  acceptOnboard.onclick = ()=>{
    const tag = gamerTagInput.value.trim() || 'Traveler';
    state.gamerTag = tag; state.humor = humorToggle.checked; onboard.style.display='none'; save(); render();
    if(state.humor && Notification && Notification.permission!=='granted'){
      Notification.requestPermission().then(p=>{ if(p==='granted') toast('Notifications enabled — occasional surprises may follow.'); });
    }
  };

  // quick reset
  qs('#reset').onclick = ()=>{ if(confirm('Reset local progress?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } };

  qs('#achievements-toggle').onclick = ()=>{ qs('#achievements-panel').classList.toggle('hidden'); };
  qs('#lore-toggle').onclick = ()=>{ qs('#lore-panel').classList.toggle('hidden'); };

  // --- Fake global stats (stored in localStorage too) ---
  function initGlobalStats(){
    const k='thebutton:global';
    let g;
    try{ g = JSON.parse(localStorage.getItem(k)) || {visitors:1,presses:0,goose:0,potato:0,pranks:0}; }catch(e){ g={visitors:1,presses:0,goose:0,potato:0,pranks:0}; }
    g.visitors += 1; g.presses += state.presses; localStorage.setItem(k,JSON.stringify(g));
    qs('#stat-visitors').textContent = g.visitors; qs('#stat-presses').textContent = g.presses; qs('#stat-goose').textContent=g.goose; qs('#stat-potato').textContent=g.potato; qs('#stat-pranks').textContent=g.pranks;
  }

  // --- Particles background (simple) ---
  function initParticles(){
    const canvas = document.getElementById('particles'); const ctx = canvas.getContext('2d'); function resize(){canvas.width=innerWidth;canvas.height=innerHeight;} window.addEventListener('resize',resize); resize();
    const parts = Array.from({length:60}).map(()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.6+0.6,dx:(Math.random()-0.5)*0.3,dy:(Math.random()-0.5)*0.3}));
    function frame(){ ctx.clearRect(0,0,canvas.width,canvas.height); for(const p of parts){ p.x+=p.dx; p.y+=p.dy; if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0; if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0; ctx.beginPath(); ctx.fillStyle='rgba(124,118,255,0.06)'; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); } requestAnimationFrame(frame);} frame();
  }

  // --- Init ---
  load(); initGlobalStats(); render(); initParticles();

  // show onboard if first time
  if(!localStorage.getItem(STORAGE_KEY)){
    onboard.style.display='flex';
  } else {
    onboard.style.display='none';
  }

})();
const STORAGE_KEY = 'the-button-presses-v1';
const MESSAGES = [
  'Nice. You are still here.',
  'The Button says hello.',
  'Press more. The Button lives for this.',
  'Please stop doing this, but keep pressing.',
  'Every click is one more pixel of meaning.',
  'Achievement unlocked: Mild Curiosity.',
  'No refunds. This is fine.',
  'You have already met the Button. Again.',
  'The internet is watching your finger.',
  'This is not a drill. This is a button.'
];

// generate more messages programmatically to reach hundreds
for(let i=0;i<200;i++){
  MESSAGES.push(`Random observation #${i+1}: The Button hums.`);
}

const ACHIEVEMENTS = [
  {count:10, label:'No Self Control'},
  {count:50, label:'Professional Button Enjoyer'},
  {count:100, label:'One With The Button'},
  {count:500, label:'Concerning Levels of Dedication'}
];

const LORE = [
  'The Button was discovered after the Great Cheese Incident of 1987.',
  'The Button predates civilization by at least three Tuesdays.',
  'A secret society of librarians once tried to publish it.',
  'It hums softly when you are not looking.',
  'A failed toaster and a comet had a baby; the Button is that baby.',
  'It was rented, not owned.'
];

// generate 100 more absurd lore entries
for(let i=0;i<120;i++){
  LORE.push(`Lore Entry ${i+1}: According to unverified sources, the Button once declined to be pressed on Thursdays.`);
}

const elements = {
  count: document.getElementById('count'),
  achievements: document.getElementById('achievements'),
  bigButton: document.getElementById('big-button'),
  messages: document.getElementById('messages'),
  lore: document.getElementById('lore'),
  overlay: document.getElementById('overlay'),
  modal: document.getElementById('modal'),
  buttonOverlay: document.getElementById('button-overlay'),
  buttonWrap: document.querySelector('.button-wrap'),
  dvdCanvas: document.getElementById('dvd-canvas'),
  confetti: document.getElementById('confetti')
};

let count = Number(localStorage.getItem(STORAGE_KEY) || 0);
let timestamps = [];
let secretCooldown = false;
let bossUnlocked = count >= 50;
let weirdTriggered = false;
let activeTimers = [];
let dvdState = null;
let user = { name: null, humor: false };

function init(){
  render();
  if(elements.bigButton) elements.bigButton.addEventListener('click', onPress);
  document.addEventListener('keydown', handleKeydown);
  if(elements.overlay) elements.overlay.addEventListener('click', hideOverlay);
  // If advanced toggle exists, sync its state; default off
  if(elements.advancedToggle){ elements.advancedToggle.checked = false; }
  window.addEventListener('resize', resizeCanvas);
  // onboarding check
  const storedName = localStorage.getItem('thebutton-name');
  const storedHumor = localStorage.getItem('thebutton-humor');
  if(storedName){ user.name = storedName; user.humor = storedHumor === 'true'; greetReturningUser(); }
  else { showOnboard(); }
}

function showOnboard(){
  const ob = document.getElementById('onboard'); if(!ob) return;
  ob.classList.remove('hidden'); elements.overlay.classList.remove('hidden');
  ob.innerHTML = `
    <h3>Welcome, Traveler.</h3>
    <div class="onboard-form">
      <label for="nick">Choose your Gamer Tag</label>
      <input id="nick" type="text" placeholder="Goose Wrangler" />
      <div class="switch"><label>Enable Enhanced Humor Mode™</label><input id="humorToggle" type="checkbox"></div>
      <button id="accept">Accept The Consequences</button>
    </div>`;
  document.getElementById('accept').addEventListener('click', ()=>{
    const nick = (document.getElementById('nick').value || 'Anonymous').trim();
    const humor = document.getElementById('humorToggle').checked;
    user.name = nick; user.humor = !!humor;
    localStorage.setItem('thebutton-name', user.name);
    localStorage.setItem('thebutton-humor', String(user.humor));
    ob.classList.add('hidden'); elements.overlay.classList.add('hidden');
    greetReturningUser();
    if(user.humor){ requestNotificationPermission(); }
  });
}

function greetReturningUser(){
  if(!user.name) return;
  const greet = [`Welcome back, ${user.name}.`, `${user.name} has returned.`];
  showMessage(randomFrom(greet));
}

function requestNotificationPermission(){
  if(!('Notification' in window)) return;
  if(Notification.permission === 'default'){
    Notification.requestPermission().then(p => {
      if(p === 'granted'){
        showMessage('Notifications enabled. Expect the occasional goose.');
      }
    });
  }
}

function handleKeydown(event){
  if(document.activeElement === elements.bigButton && (event.code === 'Space' || event.code === 'Enter')){
    event.preventDefault();
    elements.bigButton.click();
  }
  if(event.key === 'Escape'){
    hideOverlay();
  }
}

function render(){
  updateCount();
  renderAchievements();
  renderLore();
  applyBackground();
  hideButtonOverlay();
  hideOverlay();
  hideConfetti();
  elements.dvdCanvas.classList.add('hidden');
}

function updateCount(){
  elements.count.textContent = count;
}

function save(){
  localStorage.setItem(STORAGE_KEY, count);
}

function onPress(){
  if(!elements.overlay.classList.contains('hidden')){
    return;
  }

  const now = Date.now();
  timestamps = timestamps.filter(ts => now - ts <= 6000);
  timestamps.push(now);

  if(timestamps.length >= 10){
    timestamps = [];
    triggerRandomReward();
    return;
  }

  count += 1;
  save();
  updateCount();
  showMessage(randomFrom(MESSAGES));
  applyBackground();
  checkMilestones();
}

function showMessage(text){
  const message = document.createElement('div');
  message.className = 'message';
  message.textContent = text;
  elements.messages.prepend(message);
  // keep message list short
  const msgs = elements.messages.querySelectorAll('.message');
  if(msgs.length > 6){ msgs[msgs.length-1].remove(); }
  activeTimers.push(setTimeout(()=>{ message.style.opacity='0'; message.style.transform='translateY(-12px)'; }, 2600));
  activeTimers.push(setTimeout(()=>{ message.remove(); }, 3400));
}

function applyBackground(){
  const hue = (count * 27) % 360;
  document.body.style.background = `radial-gradient(circle at top, hsl(${hue} 64% 42%), hsl(${(hue + 58) % 360} 62% 11%))`;
}

function renderAchievements(){
  elements.achievements.innerHTML = '';
  ACHIEVEMENTS.filter(a => count >= a.count).forEach(a => {
    const chip = document.createElement('span');
    chip.className = 'ach-chip';
    chip.textContent = a.label;
    elements.achievements.appendChild(chip);
  });
}

function renderLore(){
  const loreCount = Math.min(Math.floor(count / 25), LORE.length);
  if(loreCount === 0){
    elements.lore.textContent = 'Keep pressing to reveal the Button lore.';
    return;
  }
  elements.lore.innerHTML = LORE.slice(0, loreCount).map(line => `• ${line}`).join('<br>');
}

function checkMilestones(){
  checkAchievement();
  checkLore();
  if(count >= 500 && !weirdTriggered){
    weirdTriggered = true;
    showMessage('Why are you like this?');
  }
  if(count >= 1000){
    triggerBlueScreen();
  }
  if(!bossUnlocked && count >= 50){
    bossUnlocked = true;
    startBossFight();
  }
}

function checkAchievement(){
  const unlocked = ACHIEVEMENTS.find(a => count === a.count);
  if(unlocked){
    renderAchievements();
    showModal(unlocked.label, `Unlocked at ${unlocked.count} clicks.` , 3600);
  }
}

function checkLore(){
  const nextIndex = Math.floor(count / 25);
  if(nextIndex > loreCount()){
    renderLore();
    const entry = LORE[(nextIndex - 1) % LORE.length];
    showModal('Lore Unlocked', entry, 3600);
  }
}

function loreCount(){
  return Math.min(Math.floor(count / 25), LORE.length);
}

function showModal(title, body, duration = 3600){
  clearTransient();
  if(!elements.modal || !elements.overlay) return;
  elements.modal.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><h3 style="margin:0">${title}</h3><button id=\"modal-close\" aria-label=\"Close\">✕</button></div><div>${body}</div>`;
  elements.overlay.classList.remove('hidden');
  elements.modal.classList.remove('hidden');
  const close = document.getElementById('modal-close'); if(close) close.addEventListener('click', hideOverlay);
  if(duration > 0){ activeTimers.push(setTimeout(hideOverlay, duration)); }
}

function hideOverlay(){
  elements.overlay.classList.add('hidden');
  elements.modal.classList.add('hidden');
  hideButtonOverlay();
  hideConfetti();
  hideDVD();
  clearTransient();
}

function showButtonOverlay(text){
  elements.buttonOverlay.textContent = text;
  elements.buttonOverlay.classList.remove('hidden');
}

function hideButtonOverlay(){
  elements.buttonOverlay.classList.add('hidden');
  elements.buttonOverlay.textContent = '';
}

function showConfetti(text){
  elements.confetti.textContent = text;
  elements.confetti.classList.remove('hidden');
  activeTimers.push(setTimeout(hideConfetti, 3500));
}

function hideConfetti(){
  elements.confetti.classList.add('hidden');
  elements.confetti.textContent = '';
}

function resizeCanvas(){
  if(elements.dvdCanvas.classList.contains('hidden')) return;
  elements.dvdCanvas.width = window.innerWidth;
  elements.dvdCanvas.height = window.innerHeight;
}

function hideDVD(){
  if(dvdState){ dvdState.running = false; dvdState = null; }
  elements.dvdCanvas.classList.add('hidden');
}

function clearTransient(){
  activeTimers.forEach(id => { try{ if(typeof id === 'number') { clearTimeout(id); clearInterval(id); } }catch(e){} });
  activeTimers = [];
}

function randomFrom(array){
  return array[Math.floor(Math.random() * array.length)];
}

function triggerRandomReward(){
  // gate secret events behind user's humor preference
  if(!user.humor) return;
  if(secretCooldown) return;
  secretCooldown = true;
  activeTimers.push(setTimeout(() => { secretCooldown = false; }, 7000));
  if(Math.random() < 0.01){
    jackpotEvent();
    return;
  }
  const rewards = [dvdLogoMode, fakeWindowsUpdate, gooseMode, potatoCaptcha, teleportingButton, fakeCall, alienContact];
  const chosen = randomFrom(rewards);
  chosen();
}

function dvdLogoMode(){
  hideOverlay();
  hideConfetti();
  clearTransient();
  elements.dvdCanvas.classList.remove('hidden');
  resizeCanvas();
  const ctx = elements.dvdCanvas.getContext('2d');
  let x = 60, y = 60;
  let vx = 5 + Math.random() * 2;
  let vy = 4 + Math.random() * 2;
  const w = 160;
  const h = 90;
  dvdState = { running: true };

  function loop(){
    if(!dvdState || !dvdState.running) return;
    if(elements.dvdCanvas.width !== window.innerWidth || elements.dvdCanvas.height !== window.innerHeight){
      resizeCanvas();
    }
    ctx.clearRect(0,0,elements.dvdCanvas.width,elements.dvdCanvas.height);
    ctx.fillStyle = '#09d7ff';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#02142c';
    ctx.font = '28px sans-serif';
    ctx.fillText('DVD', x + 26, y + 56);
    x += vx; y += vy;
    if(x + w >= elements.dvdCanvas.width || x <= 0){ vx *= -1; }
    if(y + h >= elements.dvdCanvas.height || y <= 0){ vy *= -1; }
    requestAnimationFrame(loop);
  }

  loop();
  activeTimers.push(setTimeout(hideDVD, 9000));
}

function fakeWindowsUpdate(){
  hideOverlay();
  const content = `
    <div style="font-family:Consolas,monospace;font-size:18px;line-height:1.6;">
      Installing updates...<div id="fake-progress" style="margin-top:16px;background:#031f32;border-radius:8px;overflow:hidden;height:20px;">
        <div id="pbar" style="width:2%;height:20px;background:#4ad7ff;"></div>
      </div>
      <div id="pct" style="margin-top:10px;color:#b8e6ff;">2%</div>
    </div>`;
  showModal('Windows Update', content, 0);
  const progress = document.getElementById('pbar');
  const pct = document.getElementById('pct');
  let value = 2;
  const id = setInterval(() => {
    value = Math.min(99, value + Math.random() * 6);
    if(progress){ progress.style.width = `${value}%`; }
    if(pct){ pct.textContent = `${Math.floor(value)}%`; }
    if(value >= 99){
      clearInterval(id);
      activeTimers = activeTimers.filter(item => item !== id);
      setTimeout(() => {
        elements.modal.innerHTML = '<h3>Update failed successfully.</h3><div style="margin-top:12px;color:#dcdcdc;">Try again later.</div>';
        activeTimers.push(setTimeout(hideOverlay, 3200));
      }, 900);
    }
  }, 300);
  activeTimers.push(id);
}

function gooseMode(){
  hideOverlay();
  showButtonOverlay('HONK');
  showModal('A goose appears', '<div style="text-align:center;font-size:1.1rem;">HONK. The Button has been confiscated.</div>', 4200);
}

function potatoCaptcha(){
  hideOverlay();
  const content = `
    <div style="font-size:0.98rem;line-height:1.6;">
      <div>Are you a potato?</div>
      <div style="margin-top:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${Array.from({length:6}).map((_,i) => `<div style="background:#05273a;padding:14px;border-radius:10px;text-align:center;">Image ${i+1}</div>`).join('')}
      </div>
      <div style="margin-top:14px;color:#d7d7ff;">Verification failed. Potential potato detected.</div>
    </div>`;
  showModal('Potato CAPTCHA', content, 4400);
}

let evadeAttempts = 0;
function maybeTeleport(){
  if(Math.random() < 0.14 + evadeAttempts * 0.02){
    evadeAttempts += 1;
    elements.buttonWrap.classList.add('shake');
    showButtonOverlay('NOPE');
    activeTimers.push(setTimeout(() => {
      elements.buttonWrap.classList.remove('shake');
      hideButtonOverlay();
    }, 700));
    if(evadeAttempts > 6){
      showModal('Achievement Unlocked', 'Absolutely Bamboozled', 2800);
    }
  }
}

function teleportingButton(){
  hideOverlay();
  evadeAttempts = Math.max(evadeAttempts, 3);
  showModal('Button is telepathic', 'The Button refuses to cooperate for a moment.', 3800);
}

function fakeCall(){
  hideOverlay();
  showModal('Incoming call: Mom', `
    <div style="display:flex;gap:12px;margin-top:16px;justify-content:center;">
      <button id="ans">Answer</button>
      <button id="dec">Decline</button>
    </div>`, 0);
  const answerButton = document.getElementById('ans');
  const declineButton = document.getElementById('dec');
  if(answerButton){
    answerButton.addEventListener('click', () => {
      elements.modal.innerHTML = '<div>Voicemail: Stop pressing that button.</div>';
      activeTimers.push(setTimeout(hideOverlay, 2400));
    });
  }
  if(declineButton){
    declineButton.addEventListener('click', () => {
      elements.modal.innerHTML = '<div>Voicemail: Stop pressing that button.</div>';
      activeTimers.push(setTimeout(hideOverlay, 2400));
    });
  }
}

function alienContact(){
  hideOverlay();
  const message = randomFrom(['We come in peace', 'The button tastes funny', 'Beep-boop']);
  showModal('UFO contact', `<div>${message}</div>`, 2200);
  activeTimers.push(setTimeout(() => {
    elements.modal.innerHTML += '<div style="margin-top:14px;">Signal lost. Aliens pressed the button too.</div>';
    activeTimers.push(setTimeout(hideOverlay, 1800));
  }, 2200));
}

function jackpotEvent(){
  hideOverlay();
  const emoji = randomFrom(['🎉', '✨', '🎊', '🎈']);
  showConfetti(`${emoji} Congratulations! You won absolutely nothing.`);
  showModal('Jackpot Event', '<div style="font-size:1rem;line-height:1.5;">This is the rarest reward and it means exactly nothing.</div>', 3800);
}

function startBossFight(){
  hideOverlay();
  let hp = 280 + Math.floor(Math.random() * 140);
  showModal('Button Prime', `
    <div id="hpbar" style="background:#031c32;border-radius:10px;overflow:hidden;margin-top:12px;">
      <div id="hp" style="width:100%;height:18px;background:#ff7ab2;"></div>
    </div>
    <div id="hptext" style="margin-top:10px;">${hp} HP</div>
    <div style="margin-top:16px;"><button id="atk">Attack</button></div>
  `, 0);
  const atkButton = document.getElementById('atk');
  if(atkButton){
    atkButton.addEventListener('click', () => {
      const dmg = 8 + Math.floor(Math.random() * 24);
      hp = Math.max(0, hp - dmg);
      const pct = Math.floor((hp / 420) * 100);
      const hpBar = document.getElementById('hp');
      const hpText = document.getElementById('hptext');
      if(hpBar){ hpBar.style.width = `${pct}%`; }
      if(hpText){ hpText.textContent = `${hp} HP`; }
      if(hp <= 0){
        showModal('Defeated', '<div>You defeated Button Prime. Slight sense of accomplishment unlocked.</div>', 4200);
      }
    });
  }
}

function triggerBlueScreen(){
  hideOverlay();
  showModal(':(', '<div style="font-family:monospace;color:#d8eaff;background:#041d36;padding:18px;border-radius:14px;">Critical Error: User would not stop pressing button.</div>', 4200);
}

// Initialize on DOM ready with error reporting and a minimal fallback
document.addEventListener('DOMContentLoaded', ()=>{
  try{
    init();
  }catch(err){
    console.error('The Button initialization failed:', err);
    const fallbackBtn = document.getElementById('big-button');
    const el = document.getElementById('count');
    if(fallbackBtn && el){
      fallbackBtn.addEventListener('click', ()=>{
        let c = Number(localStorage.getItem(STORAGE_KEY) || 0) + 1;
        localStorage.setItem(STORAGE_KEY, c);
        el.textContent = c;
      });
    }
  }
});
