// The Button - interactive single page app
(function(){
  // --- Config / Content ---
  const MESSAGES = [
    "Nice. You're still here.",
    "Did you think that would stop me?",
    "This button owes you nothing.",
    "Please consider your life choices.",
    "That felt important for a moment.",
    "Achievement unlocked: Mild Curiosity",
    "No refunds.",
    "Server: 'Do not press'. You pressed.",
    "We are legally obligated to say: keep pressing.",
    "You've almost filled the void."
  ];

  const ACHIEVEMENTS = [
    {count:10, title:"No Self Control"},
    {count:50, title:"Professional Button Enjoyer"},
    {count:100, title:"One With The Button"},
    {count:500, title:"Concerning Levels of Dedication"}
  ];

  const LORE = [
    "The Button was discovered after the Great Cheese Incident of 1987.",
    "The Button predates civilization by at least three Tuesdays.",
    "A secret society of librarians once tried to publish it.",
    "It hums softly when you are not looking.",
    "A failed toaster and a comet had a baby; the Button is that baby.",
    "It was rented, not owned."
  ];

  // --- State ---
  const STORAGE_KEY = 'the-button-presses-v1';
  let count = Number(localStorage.getItem(STORAGE_KEY) || 0);
  let clickTimestamps = [];
  let secretCooldown = false; // prevent back-to-back secret rewards
  let loreIndex = Math.floor(count / 25);
  let bossUnlocked = count >= 50;
  let _transientTimers = [];

  // --- Elements ---
  const el = id => document.getElementById(id);
  const countEl = el('count');
  const btn = el('big-button');
  const messagesEl = el('messages');
  const loreEl = el('lore');
  const achievementsEl = el('achievements');
  const overlay = el('overlay');
  const modal = el('modal');
  const dvdCanvas = el('dvd-canvas');
  const confetti = el('confetti');

  // --- Init ---
  function init(){
    updateCountUI();
    renderAchievements();
    renderLore();
    applyBackground(count);
    btn.addEventListener('click', onPress);
    // teleporting behavior: sometimes evade pointer
    btn.addEventListener('mouseenter', maybeTeleport);
    // keyboard accessibility: space/enter to press when focused
    document.addEventListener('keydown', (ev)=>{
      if (document.activeElement === btn && (ev.code === 'Space' || ev.code === 'Enter')){
        ev.preventDefault(); btn.click();
      }
    });
  }

  function updateCountUI(){
    countEl.textContent = count;
  }

  function save(){
    localStorage.setItem(STORAGE_KEY, String(count));
  }

  function onPress(e){
    // track spam click timestamps
    const now = Date.now();
    clickTimestamps.push(now);
    // keep only recent timestamps within the last 6s and limit array size
    clickTimestamps = clickTimestamps.filter(t=> now - t <= 6000).slice(-64);

    if (clickTimestamps.length >= 10){
      // trigger secret reward
      triggerRandomReward();
      clickTimestamps = [];
      return;
    }

    // normal increment
    count++;
    save();
    updateCountUI();
    showRandomMessage();
    applyBackground(count);
    maybeRevealAchievement();
    maybeRevealLore();
    maybeIncreaseWeirdness();
    // check boss unlock
    if (!bossUnlocked && count >= 50){
      bossUnlocked = true; startBossFight();
    }
  }

  function showRandomMessage(){
    const idx = Math.floor(Math.random()*MESSAGES.length);
    const text = MESSAGES[idx];
    const d = document.createElement('div');
    d.className = 'message';
    d.textContent = text;
    messagesEl.prepend(d);
    setTimeout(()=>{ d.style.opacity=0; d.style.transform='translateY(-6px)'; }, 2500);
    setTimeout(()=>d.remove(), 3200);
  }

  function applyBackground(n){
    // smoothly change background by hue
    const hue = (n*37) % 360; // arbitrary step
    document.body.style.background = `linear-gradient(135deg,hsl(${hue} 50% 8%), hsl(${(hue+60)%360} 48% 12%))`;
  }

  function renderAchievements(){
    achievementsEl.innerHTML = '';
    const unlocked = ACHIEVEMENTS.filter(a=> count >= a.count);
    unlocked.forEach(a=>{
      const c = document.createElement('span');
      c.className = 'ach-chip';
      c.textContent = `${a.title}`;
      achievementsEl.appendChild(c);
    });
  }

  function maybeRevealAchievement(){
    const newly = ACHIEVEMENTS.find(a=> count === a.count);
    if (newly){
      renderAchievements();
      showModal(`${newly.title}`, `Unlocked at ${newly.count} clicks.`);
    }
  }

  function renderLore(){
    // show lore entries up to loreIndex
    const pieces = [];
    for (let i=0;i<Math.min(Math.floor(count/25), LORE.length); i++){
      pieces.push(`• ${LORE[i]}`);
    }
    loreEl.innerHTML = pieces.join('<br>');
  }

  function maybeRevealLore(){
    const newIdx = Math.floor(count/25);
    if (newIdx > loreIndex){
      loreIndex = newIdx;
      const entry = LORE[(loreIndex-1) % LORE.length] || 'It is indescribable.';
      renderLore();
      showRandomMessage();
      showModal('Lore Unlocked', entry);
    }
  }

  function maybeIncreaseWeirdness(){
    if (count >= 500){
      showRandomMessage();
      // slightly more aggressive messaging
      MESSAGES.push("Why are you like this?");
    }
    if (count >= 1000){
      triggerBlueScreen();
    }
  }

  // --- Modal / Overlays ---
  function showModal(title, body, timeout=4000){
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    modal.innerHTML = `<h3 style="margin:0 0 8px 0">${title}</h3><div>${body}</div>`;
    setTimeout(()=>{
      modal.classList.add('hidden'); overlay.classList.add('hidden');
    }, timeout);
  }

  // --- Secret rewards ---
  function triggerRandomReward(){
  if (secretCooldown) return; // avoid immediate retrigger
  secretCooldown = true;
  setTimeout(()=>{ secretCooldown=false; }, 8000);
  const REWARDS = [dvdLogoMode, fakeWindowsUpdate, gooseMode, potatoCaptcha, teleportingButton, fakeCall, alienContact, jackpotEvent];
  // rare jackpot (1%)
  if (Math.random() < 0.01) return jackpotEvent();
  const r = REWARDS[Math.floor(Math.random()*REWARDS.length)];
  r();
  }

  // DVD Logo Mode
  function dvdLogoMode(){
    const canvas = dvdCanvas; canvas.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    canvas.width = innerWidth; canvas.height = innerHeight;
    let x = 50, y = 50, vx = 4, vy = 3; const w=160, h=90;
    let logoColor = '#00c1ff';
    const loop = ()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = logoColor; ctx.fillRect(x,y,w,h);
      ctx.fillStyle = '#021028'; ctx.font='26px sans-serif'; ctx.fillText('DVD', x+20, y+56);
      x+=vx; y+=vy;
      if (x+w >= canvas.width || x<=0) vx*=-1, logoColor = randomColor();
      if (y+h >= canvas.height || y<=0) vy*=-1, logoColor = randomColor();
      if (!canvas._running) return;
      requestAnimationFrame(loop);
    };
    canvas._running = true; loop();
    setTimeout(()=>{ canvas._running=false; canvas.classList.add('hidden'); }, 10000);
  }

  // fake windows update
  function fakeWindowsUpdate(){
    overlay.classList.remove('hidden'); modal.classList.remove('hidden');
    modal.innerHTML = `<div style="font-family:Consolas,monospace;font-size:18px">Installing updates...<div id='fake-progress' style='margin-top:12px;background:#001423;border-radius:6px;overflow:hidden'><div style='width:2%;height:18px;background:#00c1ff' id='pbar'></div></div><div id='pct' style='margin-top:8px'>2%</div></div>`;
    let pct=2; const id = setInterval(()=>{
      pct += Math.random()*4; if (pct>=99){ clearInterval(id); setTimeout(()=>{ modal.innerHTML = `<h3>Update failed successfully.</h3><div>Try again later.</div>`; setTimeout(()=>{ modal.classList.add('hidden'); overlay.classList.add('hidden'); },3000); },800); return; }
      el('pbar').style.width = pct+'%'; el('pct').textContent = Math.floor(pct)+'%';
    }, 300);
  _transientTimers.push(id);
  }

  // goose mode
  function gooseMode(){
    // Keep button present; overlay the goose and message briefly
    overlay.classList.remove('hidden'); modal.classList.remove('hidden');
    modal.innerHTML = `<div style='text-align:center'><div style='font-size:64px'>🪿</div><h3>HONK. The Button has been temporarily detained.</h3></div>`;
    const bo = document.getElementById('button-overlay');
    if (bo){ bo.classList.remove('hidden'); bo.textContent = 'HONK'; }
    setTimeout(()=>{ if (bo){ bo.classList.add('hidden'); bo.textContent=''; } modal.classList.add('hidden'); overlay.classList.add('hidden'); },5000);
  }

  // potato captcha
  function potatoCaptcha(){
    overlay.classList.remove('hidden'); modal.classList.remove('hidden');
    modal.innerHTML = `<h3>Are you a potato?</h3><div style='margin-top:8px'>Select all images containing potatoes.</div><div style='margin-top:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px'>${Array.from({length:6}).map((_,i)=>`<div style='background:#0b2136;padding:18px;border-radius:8px;text-align:center'>Image ${i+1}</div>`).join('')}</div><div style='margin-top:12px'>Verification failed. Potential potato detected.</div>`;
    setTimeout(()=>{ modal.classList.add('hidden'); overlay.classList.add('hidden'); },4200);
  }

  // teleporting button (reworked)
  const t = setTimeout(()=>{ canvas._running=false; canvas.classList.add('hidden'); }, 10000);
  _transientTimers.push(t);
  let evadeAttempts = 0;
  function maybeTeleport(){
    if (Math.random() < 0.18 + evadeAttempts*0.02){
      evadeButton(); evadeAttempts++;
    }
  }
  function evadeButton(){
    const wrap = btn.closest('.button-wrap');
    if (!wrap) return;
    wrap.classList.add('shake');
    const bo = document.getElementById('button-overlay');
    if (bo){ bo.classList.remove('hidden'); bo.textContent = 'NOPE'; }
    setTimeout(()=>{ if (bo){ bo.classList.add('hidden'); bo.textContent=''; } wrap.classList.remove('shake'); }, 700);
    if (evadeAttempts > 6){ showModal('Achievement Unlocked', 'Absolutely Bamboozled'); }
  }

  function teleportingButton(){
    // temporarily increase chances and show playful dodge for a short period
    const prev = evadeAttempts; evadeAttempts = Math.max(evadeAttempts, 3);
    setTimeout(()=>{ evadeAttempts = prev; }, 7000);
  }

  // fake incoming call
  function fakeCall(){
    overlay.classList.remove('hidden'); modal.classList.remove('hidden');
    modal.innerHTML = `<h3>Incoming call: Mom</h3><div style='display:flex;gap:12px;margin-top:12px'><button id='ans'>Answer</button><button id='dec'>Decline</button></div>`;
    el('ans').addEventListener('click', ()=>{ modal.innerHTML = '<div>Voicemail: Stop pressing that button.</div>'; setTimeout(hideModal,2400); });
    el('dec').addEventListener('click', ()=>{ modal.innerHTML = '<div>Voicemail: Stop pressing that button.</div>'; setTimeout(hideModal,2400); });
  }
  function hideModal(){ 
    modal.classList.add('hidden'); overlay.classList.add('hidden');
    // clear transient timers and stop dvd canvas
    _transientTimers.forEach(id=>{ try{ clearTimeout(id); clearInterval(id); }catch(e){} });
    _transientTimers = [];
    if (dvdCanvas && dvdCanvas._running){ dvdCanvas._running = false; dvdCanvas.classList.add('hidden'); }
    // ensure confetti hides
    if (confetti){ confetti.classList.add('hidden'); confetti.textContent=''; }
  }

  // alien contact
  function alienContact(){
    overlay.classList.remove('hidden'); modal.classList.remove('hidden');
    modal.innerHTML = `<h3>UFO: ... -- ...</h3><div>${['We come in peace','The button tastes funny','Beep-boop'][Math.floor(Math.random()*3)]}</div>`;
    setTimeout(()=>{ modal.innerHTML += '<div>Signal lost. Aliens pressed the button too.</div>'; setTimeout(hideModal,1800); },2000);
  }

  // jackpot
  function jackpotEvent(){
  confetti.classList.remove('hidden'); confetti.textContent = '';
  // create a lightweight confetti burst using emojis
  const emojis = ['🎉','✨','🎊','🎈'];
  confetti.textContent = emojis[Math.floor(Math.random()*emojis.length)] + ' Congratulations! You won absolutely nothing.';
  setTimeout(()=>{ confetti.classList.add('hidden'); confetti.textContent=''; },5000);
  }

  // boss fight
  function startBossFight(){
    overlay.classList.remove('hidden'); modal.classList.remove('hidden');
    let hp = 300 + Math.floor(Math.random()*200);
    modal.innerHTML = `<h3>Button Prime</h3><div id='hpbar' style='background:#001824;border-radius:6px;overflow:hidden;margin-top:8px'><div style='width:100%;height:18px;background:#ff6b6b' id='hp'></div></div><div id='hptext' style='margin-top:8px'>${hp} HP</div><div style='margin-top:12px'><button id='atk'>Attack</button></div>`;
    el('atk').addEventListener('click', ()=>{
      const dmg = 5 + Math.floor(Math.random()*30);
      hp = Math.max(0, hp-dmg);
      const pct = Math.floor((hp/(300+200))*100);
      el('hp').style.width = pct + '%'; el('hptext').textContent = `${hp} HP`;
      if (hp<=0){ showModal('Defeated', 'Slight Sense of Accomplishment'); overlay.classList.add('hidden'); }
    });
  }

  // blue screen
  function triggerBlueScreen(){
    overlay.classList.remove('hidden'); modal.classList.remove('hidden');
    modal.innerHTML = `<div style='font-family:monospace;color:#0a0a0a;background:#061b2b;padding:20px;border-radius:8px'><h2 style='color:#74c3ff'>:(</h2><div>Critical Error: User would not stop pressing button.</div></div>`;
  }

  // --- Utilities ---
  function randomColor(){ return `hsl(${Math.floor(Math.random()*360)} 70% 55%)`; }

  // expose minimal API for testing
  window._TheButton = { getCount: ()=>count, reset: ()=>{ count=0; save(); updateCountUI(); renderAchievements(); renderLore(); } };

  // boot
  document.addEventListener('DOMContentLoaded', init);
})();
