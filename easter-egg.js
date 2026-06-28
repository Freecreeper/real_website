(function(){
  const STORAGE_KEY = 'thebutton:v1';
  const qs = selector => document.querySelector(selector);
  const terminal = qs('#secret-terminal');
  const activate = qs('#activate-secret');
  const core = qs('#secret-core');
  const badge = qs('#secret-badge');
  const CREDITS_TAP_TARGET = 20;
  const CREDITS_TAP_WINDOW_MS = 9000;
  let coreTaps = 0;
  let founderSignalTaps = [];
  let sequenceRunning = false;

  function loadState(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }catch(error){
      return {};
    }
  }

  function setText(id, value){
    const el = qs('#' + id);
    if(el) el.textContent = value;
  }

  function renderStats(){
    const state = loadState();
    const name = state.gamerTag || 'Traveler';
    const skins = state.skins && Array.isArray(state.skins.owned) ? state.skins.owned.length : 1;
    const lore = Array.isArray(state.loreSeen) ? state.loreSeen.length : 0;
    setText('secret-greeting', `${name}, you found the room behind the room.`);
    setText('secret-presses', Number(state.presses || 0).toLocaleString());
    setText('secret-skins', skins.toLocaleString());
    setText('secret-lore', lore.toLocaleString());
  }

  function addLine(text, delay=0){
    return new Promise(resolve => {
      setTimeout(() => {
        if(terminal){
          const line = document.createElement('div');
          line.textContent = '> ' + text;
          terminal.appendChild(line);
          terminal.scrollTop = terminal.scrollHeight;
        }
        resolve();
      }, delay);
    });
  }

  function burst(){
    for(let i=0;i<34;i++){
      const spark = document.createElement('span');
      spark.className = 'secret-spark';
      spark.style.left = (45 + Math.random() * 10) + '%';
      spark.style.top = (32 + Math.random() * 18) + '%';
      spark.style.setProperty('--tx', ((Math.random() - 0.5) * 90).toFixed(1) + 'vw');
      spark.style.setProperty('--ty', ((Math.random() - 0.5) * 70).toFixed(1) + 'vh');
      spark.style.animationDelay = (Math.random() * 180).toFixed(0) + 'ms';
      document.body.appendChild(spark);
      setTimeout(()=>spark.remove(), 1500);
    }
  }

  async function runSequence(){
    if(sequenceRunning) return;
    sequenceRunning = true;
    if(activate) activate.disabled = true;
    if(terminal) terminal.replaceChildren();
    await addLine('build-number tunnel opened');
    await addLine('checking button loyalty', 450);
    await addLine('press energy accepted', 600);
    await addLine('zane protocol online', 700);
    await addLine('message: thank you for playing', 650);
    if(badge){
      badge.textContent = 'Founder Signal unlocked';
      badge.classList.remove('locked');
    }
    document.body.classList.add('secret-awake');
    burst();
    try{ localStorage.setItem('thebutton:founder-signal', '1'); }catch(error){}
    if(activate) activate.textContent = 'Signal Active';
  }

  function handleCoreTap(){
    coreTaps++;
    if(core) core.textContent = coreTaps >= 7 ? 'OPEN' : `${7 - coreTaps}`;
    if(coreTaps >= 7) runSequence();
  }

  function handleFounderSignalTap(){
    if(!badge || badge.classList.contains('locked')) return;
    const now = Date.now();
    founderSignalTaps = founderSignalTaps
      .filter(tapTime => now - tapTime <= CREDITS_TAP_WINDOW_MS)
      .concat(now);

    const remaining = CREDITS_TAP_TARGET - founderSignalTaps.length;
    if(remaining > 0 && remaining <= 5){
      badge.textContent = `${remaining} taps until credits`;
      setTimeout(() => {
        if(badge && !badge.classList.contains('locked')) badge.textContent = 'Founder Signal unlocked';
      }, 800);
    }
    if(founderSignalTaps.length >= CREDITS_TAP_TARGET){
      window.location.href = 'credits.html';
    }
  }

  renderStats();
  if(window.setupVersionEgg) window.setupVersionEgg();
  if(activate) activate.addEventListener('click', runSequence);
  if(core) core.addEventListener('click', handleCoreTap);
  if(badge) badge.addEventListener('click', handleFounderSignalTap);
})();
