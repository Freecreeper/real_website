// Main script for The Button

  window.addEventListener("error", e => {
  console.error("SCRIPT ERROR:", e.error);
});
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
  timeSpentSeconds: 0,
  };

  // --- Data ---
  const messages = [
    'please dont.', 'Interesting choice.','You could be doing homework.','The button appreciates your loyalty.','Your click has been recorded for scientific purposes.','Productivity levels unchanged.','The Department of Button Affairs has been notified.','Your FBI agent is taking notes.','That felt nice, didn\'t it?','A brief moment of joy was added to the universe.','You are now 0.001% closer to a secret.'
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
  function applySavedUser() {
  gamerTagDisplay.textContent = state.gamerTag || "Welcome";
  visitorGreeting.textContent = "Hello, " + (state.gamerTag || "Traveler");
}

  // --- UI ---
  function render(){
    if(countEl){
      countEl.textContent = state.presses;
    }
    const statPresses = qs('#stat-presses');
    if(statPresses){
    statPresses.textContent = state.presses;
    }
    const achEl = qs('#stat-achievements');
    if(achEl){
    achEl.textContent = state.achievements.length;
    }
   
 if(gamerTagDisplay){
  gamerTagDisplay.textContent = state.gamerTag || 'Welcome';
}

if(visitorGreeting){
  visitorGreeting.textContent = 'Hello, ' + (state.gamerTag || 'Traveler');
}
    // achievements
   if(achievementsList){

  achievementsList.innerHTML = '';

  for(const a of achievementDefs){

    const li = document.createElement('li');

    li.textContent =
      `${a.title} — ${a.n} clicks`;

    if(state.achievements.includes(a.id))
      li.style.opacity = '1';
    else
      li.style.opacity = '0.5';

    achievementsList.appendChild(li);
  }
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
  // report achievement to global stats
  postEvent('achievement', 1);
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
  // post event to server where appropriate
  const mapping = { goose:'goose', potato:'potato', rickroll:'rickroll', alien:'alien', bossFight:'button_prime' };
  if(mapping[choice]) postEvent(mapping[choice], 1);
  }

  // update global presses stored in localStorage
  function updateGlobalPresses(delta=1){
    // attempt to post to server; fallback to localStorage
    postPress(delta).catch(()=>{
      const k='thebutton:global';
      try{
        const g = JSON.parse(localStorage.getItem(k)) || {visitors:1,presses:0,goose:0,potato:0,pranks:0};
        g.presses = (g.presses||0) + delta;
        localStorage.setItem(k,JSON.stringify(g));
        const el = qs('#stat-world-presses'); if(el) el.textContent = g.presses;
      }catch(e){console.warn('global update err',e)}
    });
  }

  function runPrank(name){
    switch(name){
      case 'fakeUpdate': prankFakeUpdate(); break;
      case 'goose': prankGoose(); break;
      case 'fakeCall': prankFakeCall(); break;
      case 'alien': alienContact(); break;
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
    card.innerHTML = `<h3>Incoming Call — friend</h3><p class='muted'>Caller ID: friend</p>
      <div style='display:flex;gap:8px;justify-content:center;margin-top:10px'><button id='call-answer' class='pill primary'>Answer</button><button id='call-decline' class='pill'>Decline</button></div>`;
    modal.appendChild(card); document.body.appendChild(modal);
    function finish(){ modal.remove(); toast('Voicemail: Stop pressing that button.'); }
    card.querySelector('#call-answer').onclick = finish; card.querySelector('#call-decline').onclick = finish;
  }

function alienContact() {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const card = document.createElement('div');
  card.className = 'modal-card glass';

  card.innerHTML = `
    <h3>📡 UNKNOWN TRANSMISSION</h3>
    <div style="font-family:monospace">
      01001000 01101001 00100000 01110100 01110010 01100001 01110110 01100101 01101100 01100101 01110010 00101100 00100000 01010111 01100101 00100000 01000001 01110010 01100101 00100000 01000001 01101100 01101001 01100101 01101110 00101110
    </div>
  `;

  modal.appendChild(card);
  document.body.appendChild(modal);

  setTimeout(() => {
    card.innerHTML += `<div style="margin-top:10px">Connection terminated.</div>`;
  }, 3000);

  setTimeout(() => {
    card.innerHTML += `<div>No further data available.</div>`;
  }, 5000);

  setTimeout(() => {
    modal.remove();
  }, 9000);
}
//potato captha
  function prankPotato(){
  const modal = document.createElement('div');
  modal.className = 'modal';

  const card = document.createElement('div');
  card.className = 'modal-card glass';

  card.innerHTML = `
    <h3>🥔 Potato Verification</h3>
    <p class="muted">Please confirm you are not a potato.</p>

    <div style="display:flex;gap:10px;justify-content:center;margin-top:12px">
      <button id="potato-human" class="pill">I am human</button>
      <button id="potato-goat" class="pill">I am a goat</button>
    </div>
  `;

  modal.appendChild(card);
  document.body.appendChild(modal);

  function finish(){
    // LOCAL update (safe)
    state.pranks = (state.pranks || 0) + 1;
    save();

    // UI update if exists
    const el = qs('#stat-potato');
    if (el) el.textContent = Number(el.textContent || 0) + 1;

    // SERVER update (important for real stats page)
    postEvent('potato', 1);

    modal.remove();
    toast("Potato detection processed 🥔");
  }

  card.querySelector('#potato-human').onclick = finish;
  card.querySelector('#potato-goat').onclick = finish;
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
  // report a rare rickroll victim
  postEvent('rickroll',1);
  }

  

  // --- Button click handler ---
  btn.addEventListener('click', ()=>{
    recordClickTime();
    state.presses++;
  updateGlobalPresses(1);
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

  // --- Time tracking (session + persisted) ---
  let sessionTimer = null; let sessionSecondsActive = 0; let lastTick = Date.now();
  function tickTime(){ const now = Date.now(); const delta = Math.floor((now - lastTick)/1000); if(delta>=1){ state.timeSpentSeconds = (state.timeSpentSeconds||0) + delta; lastTick = now; renderTime(); save(); } }
  function renderTime(){ const s = state.timeSpentSeconds || 0; const el = qs('#stat-time'); if(!el) return; el.textContent = formatTime(s); }
  function formatTime(sec){ if(sec<60) return sec+'s'; const m = Math.floor(sec/60); const s = sec%60; if(m<60) return `${m}m ${s}s`; const h = Math.floor(m/60); const mm = m%60; return `${h}h ${mm}m`; }
  function startTime(){ if(sessionTimer) return; lastTick = Date.now(); sessionTimer = setInterval(tickTime,1000); }
  function stopTime(){ if(sessionTimer){ clearInterval(sessionTimer); sessionTimer=null; tickTime(); save(); } }
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) stopTime(); else startTime(); });
  window.addEventListener('beforeunload', ()=>{ stopTime(); });


  // --- Onboarding ---
  acceptOnboard.onclick = ()=>{
    const tag = gamerTagInput.value.trim() || 'Traveler';
    state.gamerTag = tag; state.humor = humorToggle.checked; onboard.style.display='none'; save(); render();
    if(state.humor && 'Notification' in window){
      if(Notification.permission === 'default'){
        Notification.requestPermission().then(p=>{ if(p==='granted'){ toast('Notifications enabled — occasional surprises may follow.'); new Notification('Department of Button Affairs', {body:'Thank you. Occasional notices may appear.'}); scheduleSampleNotification(); } else { toast('Notifications denied. Humor mode continues silently.'); } });
      } else if(Notification.permission === 'granted'){
        toast('Notifications already enabled.'); new Notification('Department of Button Affairs', {body:'You will receive rare, funny notifications.'}); scheduleSampleNotification();
      } else {
        toast('Notifications denied previously. You can enable them in browser settings.');
      }
    }
  };

  function scheduleSampleNotification(){
    // schedule one rare in-page notification after a short delay to showcase capability
    setTimeout(()=>{
      if(Notification.permission==='granted') new Notification('🚨 Goose Alert', {body:'A goose may be nearby.'});
    }, 8000 + rand(0,8000));
  }
countEl.textContent = state.presses;
  // --- Particles background (simple) ---
  function initParticles(){
    const canvas = document.getElementById('particles'); const ctx = canvas.getContext('2d'); function resize(){canvas.width=innerWidth;canvas.height=innerHeight;} window.addEventListener('resize',resize); resize();
    const parts = Array.from({length:60}).map(()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.6+0.6,dx:(Math.random()-0.5)*0.3,dy:(Math.random()-0.5)*0.3}));
    function frame(){ ctx.clearRect(0,0,canvas.width,canvas.height); for(const p of parts){ p.x+=p.dx; p.y+=p.dy; if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0; if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0; ctx.beginPath(); ctx.fillStyle='rgba(124,118,255,0.06)'; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); } requestAnimationFrame(frame);} frame();
  }

  // --- Init ---
  load();
  applySavedUser();
  render();
  initParticles();

  // start time tracking and render initial time
  renderTime(); startTime();

  // fetch and display version
  fetch('version.json?T=' + Date.now()).then(r=>r.json()).then(v=>{
    const el = qs('#version-display'); if(!el) return; el.textContent = 'v' + (v.version || '0.0.0');
    el.addEventListener('click', ()=>{ toast(`Version ${v.version} — build ${v.build}`); });
  }).catch(err=>{
  console.error("Version fetch failed:", err);
  });

  // --- Global stats (Flask API) integration ---
  const API_BASE = '';// relative path assumes same host (serve Flask alongside static files)

  async function postVisit(){
    try{ await fetch(API_BASE + '/api/visit', {method:'POST'}); }catch(e){/*silent fallback*/}
  }

 async function postPress(delta=1){
  const res = await fetch(
    API_BASE + '/api/press',
    {
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        name: state.gamerTag,
        delta: delta
      })
    }
  );

  if(!res.ok){
    throw new Error("Press update failed");
  }
}

  async function postEvent(type, delta=1){
    try{ await fetch(API_BASE + '/api/event', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,delta})}); }catch(e){/*silent*/}
  }

  // call visit once on load
 

  // auto-refresh global stats and animate numbers
  let globalRefreshTimer = null;
  async function fetchGlobalStats(){
    try{
      const res = await fetch(API_BASE + '/api/stats');
      if(!res.ok) throw new Error('noapi');
      const data = await res.json();
      // map keys
      const map = {
        total_visitors: 'g_total_visitors',
        total_presses: 'g_total_presses',
        gooses_released: 'g_total_goose',
        potatoes_detected: 'g_total_potato',
        government_investigations: 'g_total_government_investigations',
        button_prime_defeats: 'g_total_button_prime_defeats',
        rickroll_victims: 'g_total_rickroll_victims',
        alien_contacts: 'g_total_alien_contacts',
        achievement_unlocks: 'g_total_achievement_unlocks'
      };
      for(const k in map){
        const el = qs('#' + map[k]); if(!el) continue;
        animateNumber(el, Number(data[k] || 0));
      }
      // show panel if hidden briefly to indicate live data available
      
    }catch(e){ /* ignore */ }
  }

  function animateNumber(el, to){
    const from = Number(el.textContent.replace(/[^0-9]/g,'')) || 0;
    if(from === to) return; const start = performance.now(); const dur = 600; function step(now){ const t = Math.min(1, (now-start)/dur); const v = Math.round(from + (to-from)*t); el.textContent = v; el.classList.add('num-animate'); if(t<1) requestAnimationFrame(step); else { setTimeout(()=>el.classList.remove('num-animate'), 420); } } requestAnimationFrame(step);
  }

  // start periodic refresh
  fetchGlobalStats(); globalRefreshTimer = setInterval(fetchGlobalStats, 30000);

  // manual refresh/close handlers
  
  // show onboard if first time
  if (!state.gamerTag || state.gamerTag === "Traveler") {
  onboard.style.display = 'flex';
} else {
  onboard.style.display = 'none';
}

})();
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

//zane was here