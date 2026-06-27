// Main script for The Button

  window.addEventListener("error", e => {
  console.error("SCRIPT ERROR:", e.error);
});
(function(){
  // --- Utilities ---

  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const rand = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
  const RICKROLL_CHANCE = 0.00001; // 0.0010% per press
  const PRESENT_SKIN_CHANCE = 1 / 200;

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
  const dailyStreakEl = qs('#daily-streak');
  const dailyPressesEl = qs('#daily-presses');
  const dailyGoalLabel = qs('#daily-goal-label');
  const dailyGoalBar = qs('#daily-goal-bar');
  const dailyGoalCopy = qs('#daily-goal-copy');
  const prevSkinButton = qs('#prev-skin');
  const nextSkinButton = qs('#next-skin');
  const equipSkinButton = qs('#equip-skin');
  const skinNameEl = qs('#skin-name');
  // --- State ---
  const STORAGE_KEY = 'thebutton:v1';
  let state = {
    presses:0,
    achievements:[],
    eventAchievements:[],
    loreSeen:[],
    gamerTag:'Traveler',
    humor:false,
    lastClicks:[],
    pranks:0,
    timeSpentSeconds: 0,
    daily:{
      date:'',
      presses:0,
      streak:0,
      bestStreak:0,
      lastPressDate:''
    },
    divideTeam:null,
    skins:{
      owned:['classic'],
      equipped:'classic'
    }
  };
  let skinPreviewIndex = 0;
  let dailyGoal = {date:'', presses:0, target:1000};
  let nightFallsActive = false;
  let nightFallsAudio = null;
  let meteorUnlocked = false;
  let divideState = {active:false, teams:{red:{presses:0}, blue:{presses:0}}, leader:'tie', player:{team:null, presses:0}};
  let divideChoiceModal = null;
  
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
      'A once-famous poet wrote an ode to the Button in invisible ink.',
      'The Button is not responsible for any broken screens.',
      'The Button has a secret life as a DJ.',
      'The Button once won a dance-off against a washing machine.',
      'The Button is banned from all dance floors.',
      'The Button has a collection of 90s memes.',
      'The Button is secretly a cat person.',
      'The Button once tried to start a band called "The Button Mashers".',
      'The Button is a master of disguise.',
      'The Button is secretly a superhero.',
      'The Button is also a time traveler.',
      'The Button has a pet goldfish named "Bubbles".',
      'The button likes artists like GRAHAM and Noah Kahan.'
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

  const skinDefs = [
    {id:'classic', name:'Classic', unlock:'Starter skin', requirement:()=>true},
    {id:'moon', name:'Moon', unlock:'Drops during The Night Falls', requirement:()=>state.skins.owned.includes('moon')},
    {id:'meteor', name:'Meteor', unlock:'Drops during Meteor Impact', requirement:()=>state.skins.owned.includes('meteor')},
    {id:'red-champion', name:'Red Champion', unlock:'Win a Great Divide season with Team Red', requirement:()=>state.skins.owned.includes('red-champion')},
    {id:'blue-champion', name:'Blue Champion', unlock:'Win a Great Divide season with Team Blue', requirement:()=>state.skins.owned.includes('blue-champion')},
    {id:'present', name:'Special Present', unlock:'Extremely rare Secret Reward drop', requirement:()=>state.skins.owned.includes('present')},
    {id:'sunrise', name:'Sunrise', unlock:'Press 25 times', requirement:()=>state.presses >= 25},
    {id:'matrix', name:'Matrix', unlock:'Press 100 times', requirement:()=>state.presses >= 100},
    {id:'royal', name:'Royal', unlock:'Reach a 3 day streak', requirement:()=>getDaily().streak >= 3},
    {id:'candy', name:'Candy Pop', unlock:'Press 50 times in one day', requirement:()=>getDaily().presses >= 50},
    {id:'gold', name:'Gold', unlock:'Press 1,000 times', requirement:()=>state.presses >= 1000}
  ];

  // --- Persistence ---
  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) state = Object.assign(state, JSON.parse(raw));
      migrateState();
    }catch(e){console.warn('load err',e)}
  }
  function save(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){console.warn('save err',e)}
  }
  function migrateState(){
    state.achievements = Array.isArray(state.achievements) ? state.achievements : [];
    state.eventAchievements = Array.isArray(state.eventAchievements) ? state.eventAchievements : [];
    state.loreSeen = Array.isArray(state.loreSeen) ? state.loreSeen : [];
    state.lastClicks = Array.isArray(state.lastClicks) ? state.lastClicks : [];
    state.daily = Object.assign({
      date:'',
      presses:0,
      streak:0,
      bestStreak:0,
      lastPressDate:''
    }, state.daily || {});
    if(state.divideTeam !== 'red' && state.divideTeam !== 'blue') state.divideTeam = null;
    state.skins = Object.assign({
      owned:['classic'],
      equipped:'classic'
    }, state.skins || {});
    if(!Array.isArray(state.skins.owned)) state.skins.owned = ['classic'];
    if(!state.skins.owned.includes('classic')) state.skins.owned.unshift('classic');
    if(!state.skins.equipped) state.skins.equipped = 'classic';
    ensureDaily();
    unlockSkins(false);
    const equippedIndex = skinDefs.findIndex(s=>s.id === state.skins.equipped);
    skinPreviewIndex = equippedIndex >= 0 ? equippedIndex : 0;
  }

  function localDateKey(date=new Date()){
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,'0');
    const d = String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }

  function daysBetween(a,b){
    if(!a || !b) return null;
    const start = new Date(a + 'T00:00:00');
    const end = new Date(b + 'T00:00:00');
    return Math.round((end - start) / 86400000);
  }

  function ensureDaily(){
    const today = localDateKey();
    const daily = state.daily || {};
    if(daily.date !== today){
      const gap = daysBetween(daily.lastPressDate || daily.date, today);
      if(gap !== 1){
        daily.streak = 0;
      }
      daily.date = today;
      daily.presses = 0;
    }
    state.daily = daily;
    return daily;
  }

  function getDaily(){
    return ensureDaily();
  }
  function applySavedUser() {
    if(gamerTagDisplay) gamerTagDisplay.textContent = state.gamerTag || "Welcome";
    if(visitorGreeting) visitorGreeting.textContent = "Hello, " + (state.gamerTag || "Traveler");
  }

  function skinById(id){
    return skinDefs.find(s=>s.id === id) || skinDefs[0];
  }

  function unlockSkins(showToasts=true){
    for(const skin of skinDefs){
      if(skin.requirement() && !state.skins.owned.includes(skin.id)){
        state.skins.owned.push(skin.id);
        if(showToasts) toast(`Button skin unlocked: ${skin.name}`);
      }
    }
  }

  function applyEventRewards(rewards){
    if(!rewards) return;
    state.eventAchievements = Array.isArray(state.eventAchievements) ? state.eventAchievements : [];
    state.skins = state.skins || {owned:['classic'], equipped:'classic'};
    state.skins.owned = Array.isArray(state.skins.owned) ? state.skins.owned : ['classic'];

    for(const achievement of rewards.event_achievements || []){
      if(!state.eventAchievements.includes(achievement)){
        state.eventAchievements.push(achievement);
        if(achievement === 'first-era'){
          toast('Event badge unlocked: First Era', {time:6000});
          showAchievementPopup('First Era Badge');
        }else if(achievement === 'meteor'){
          toast('Event badge unlocked: Meteor', {time:6000});
          showAchievementPopup('Meteor Badge');
        }
      }
    }

    for(const skin of rewards.skins || []){
      if(!state.skins.owned.includes(skin)){
        state.skins.owned.push(skin);
        const skinNames = {
          moon:'Moon Button',
          meteor:'Meteor Button',
          'red-champion':'Red Champion Button',
          'blue-champion':'Blue Champion Button',
          present:'Special Present Button'
        };
        const skinName = skinNames[skin] || skin;
        toast(`Rare skin dropped: ${skinName}`, {time:7000});
        showSkinDropPopup(skin, skinName);
      }
    }
  }

  function recordDailyPress(){
    const today = localDateKey();
    const daily = getDaily();
    if(daily.presses === 0){
      const gap = daysBetween(daily.lastPressDate, today);
      daily.streak = gap === 1 ? (daily.streak || 0) + 1 : 1;
      daily.bestStreak = Math.max(daily.bestStreak || 0, daily.streak);
      daily.lastPressDate = today;
      if(daily.streak > 1) toast(`Daily streak: ${daily.streak} days`);
    }
    daily.presses++;
    daily.date = today;
  }

  function applyButtonSkin(){
    if(!btn) return;
    for(const skin of skinDefs){
      btn.classList.remove('skin-' + skin.id);
    }
    btn.classList.add('skin-' + (state.skins.equipped || 'classic'));
  }

  function ensureNightFallsSky(){
    let sky = qs('#nightfall-sky');
    if(sky) return sky;
    sky = document.createElement('div');
    sky.id = 'nightfall-sky';
    sky.setAttribute('aria-hidden', 'true');
    for(let i=0;i<72;i++){
      const star = document.createElement('span');
      star.style.left = rand(2,98) + '%';
      star.style.top = rand(4,96) + '%';
      star.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
      star.style.opacity = (Math.random() * 0.65 + 0.25).toFixed(2);
      sky.appendChild(star);
    }
    document.body.appendChild(sky);
    return sky;
  }

  function startNightFallsMusic(){
    if(!nightFallsActive || nightFallsAudio) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if(!AudioContext) return;
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.025;
    gain.connect(ctx.destination);

    const low = ctx.createOscillator();
    low.type = 'sine';
    low.frequency.value = 110;
    low.connect(gain);

    const high = ctx.createOscillator();
    high.type = 'triangle';
    high.frequency.value = 220;
    const highGain = ctx.createGain();
    highGain.gain.value = 0.012;
    high.connect(highGain);
    highGain.connect(ctx.destination);

    low.start();
    high.start();
    nightFallsAudio = {ctx, gain, low, high};
  }

  function applyNightFallsEvent(active, animate=false){
    nightFallsActive = Boolean(active);
    document.body.classList.toggle('nightfall-active', nightFallsActive);
    if(!nightFallsActive) return;

    ensureNightFallsSky();
    const subtext = qs('#subtext');
    if(subtext) subtext.textContent = 'The First Era has ended...';
    if(msgBox) msgBox.textContent = 'Night Falls is active. Press now for the First Era badge and a chance at the Moon Button skin.';

    if(animate && !sessionStorage.getItem('thebutton:nightfall-intro-seen')){
      sessionStorage.setItem('thebutton:nightfall-intro-seen', '1');
      document.body.classList.add('nightfall-intro');
      setTimeout(()=>document.body.classList.remove('nightfall-intro'), 2600);
    }
  }

  function milestoneIsActive(milestone){
    return milestone && milestone.status === 'active';
  }

  function ensureMeteorLayer(){
    let layer = qs('#meteor-impact-layer');
    if(layer) return layer;
    layer = document.createElement('div');
    layer.id = 'meteor-impact-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<span class="meteor-rock"></span><span class="meteor-dust dust-a"></span><span class="meteor-dust dust-b"></span><span class="meteor-dust dust-c"></span>';
    document.body.appendChild(layer);
    return layer;
  }

  function triggerMeteorImpactIntro(){
    ensureMeteorLayer();
    document.body.classList.add('meteor-impact-intro');
    setTimeout(()=>document.body.classList.remove('meteor-impact-intro'), 3600);
  }

  function applyMeteorEvent(milestone, totalPresses=0, animate=false){
    const active = milestone && milestone.status === 'active';
    meteorUnlocked = Boolean(active);
    document.body.classList.toggle('meteor-active', meteorUnlocked);

    if(!milestone || milestone.status !== 'locked'){
      if(milestone && milestone.status === 'active' && msgBox){
        msgBox.textContent = 'Meteor Impact is active. Press now for the Meteor Badge and a chance at the Meteor Button skin.';
      }
      if(animate) triggerMeteorImpactIntro();
      return;
    }

    const remaining = milestone.threshold - Number(totalPresses || 0);
    if(remaining > 0 && remaining <= 4){
      document.body.classList.add('meteor-countdown');
      if(msgBox) msgBox.textContent = `${Number(totalPresses || 0).toLocaleString()}... impact in ${remaining}`;
    }else{
      document.body.classList.remove('meteor-countdown');
    }
  }

  function divideTeamName(team){
    return team === 'red' ? 'Red' : (team === 'blue' ? 'Blue' : 'Unchosen');
  }

  function normalizeDivideState(data){
    data = data || {};
    const teams = data.teams || {};
    return Object.assign({
      active:false,
      season:1,
      teams:{
        red:Object.assign({id:'red', name:'Red', presses:0}, teams.red || {}),
        blue:Object.assign({id:'blue', name:'Blue', presses:0}, teams.blue || {})
      },
      leader:'tie',
      mvps:{red:null, blue:null},
      player:{team:null, presses:0}
    }, data, {
      teams:{
        red:Object.assign({id:'red', name:'Red', presses:0}, teams.red || {}),
        blue:Object.assign({id:'blue', name:'Blue', presses:0}, teams.blue || {})
      },
      player:Object.assign({team:null, presses:0}, data.player || {})
    });
  }

  function ensureDivideLayer(){
    let layer = qs('#great-divide-layer');
    if(!layer){
      layer = document.createElement('div');
      layer.id = 'great-divide-layer';
      layer.setAttribute('aria-hidden', 'true');
      layer.innerHTML = '<span class="divide-side divide-side-red"></span><span class="divide-side divide-side-blue"></span><span class="divide-rift"></span>';
      document.body.appendChild(layer);
    }

    let board = qs('#great-divide-scoreboard');
    if(!board){
      board = document.createElement('aside');
      board.id = 'great-divide-scoreboard';
      board.className = 'glass divide-scoreboard';
      board.innerHTML = `
        <div class="divide-score-head">
          <span>The Great Divide</span>
          <strong id="divide-player-team">Choose a side</strong>
        </div>
        <div class="divide-score-row red">
          <span>Red</span>
          <strong id="divide-red-score">0</strong>
        </div>
        <div class="divide-score-row blue">
          <span>Blue</span>
          <strong id="divide-blue-score">0</strong>
        </div>
        <div class="divide-score-track"><span id="divide-balance-bar"></span></div>
        <p id="divide-leader-copy" class="muted">Waiting for the first team press.</p>
      `;
      document.body.appendChild(board);
    }
    return {layer, board};
  }

  function updateDivideScoreboard(){
    ensureDivideLayer();
    const red = Number(divideState.teams?.red?.presses || 0);
    const blue = Number(divideState.teams?.blue?.presses || 0);
    const total = red + blue;
    const redPct = total ? Math.round(red / total * 100) : 50;
    const team = divideState.player?.team || state.divideTeam;
    const redScore = qs('#divide-red-score');
    const blueScore = qs('#divide-blue-score');
    const bar = qs('#divide-balance-bar');
    const teamEl = qs('#divide-player-team');
    const leaderCopy = qs('#divide-leader-copy');

    if(redScore) redScore.textContent = red.toLocaleString();
    if(blueScore) blueScore.textContent = blue.toLocaleString();
    if(bar) bar.style.width = redPct + '%';
    if(teamEl) teamEl.textContent = team ? `You are Team ${divideTeamName(team)}` : 'Choose a side';
    if(leaderCopy){
      const leader = divideState.leader || 'tie';
      if(leader === 'tie'){
        leaderCopy.textContent = total ? 'The season is tied.' : 'Every team press moves the season.';
      }else{
        leaderCopy.textContent = `Team ${divideTeamName(leader)} is leading by ${Math.abs(red - blue).toLocaleString()} presses.`;
      }
    }
  }

  function showGreatDivideChoice(){
    if(divideChoiceModal || !divideState.active) return;
    if(onboard && onboard.style.display !== 'none') return;
    divideChoiceModal = document.createElement('div');
    divideChoiceModal.className = 'modal divide-choice-modal';
    const card = document.createElement('div');
    card.className = 'modal-card glass divide-choice-card';
    card.innerHTML = `
      <p class="eyebrow">50,000 presses reached</p>
      <h2>The Great Divide</h2>
      <p class="muted">Choose Red or Blue. This choice is locked for this player name for the season.</p>
      <div class="divide-choice-grid">
        <button class="divide-choice red" type="button" data-team="red">
          <span>Red</span>
          <strong>Power, heat, momentum.</strong>
        </button>
        <button class="divide-choice blue" type="button" data-team="blue">
          <span>Blue</span>
          <strong>Focus, signal, control.</strong>
        </button>
      </div>
    `;
    divideChoiceModal.appendChild(card);
    document.body.appendChild(divideChoiceModal);
    for(const option of card.querySelectorAll('[data-team]')){
      option.addEventListener('click', () => chooseDivideTeam(option.dataset.team));
    }
  }

  function closeDivideChoice(){
    if(divideChoiceModal){
      divideChoiceModal.remove();
      divideChoiceModal = null;
    }
  }

  async function chooseDivideTeam(team){
    try{
      const res = await apiFetch('/api/divide/choose', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({name:state.gamerTag || 'Traveler', team})
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'team choice failed');
      divideState = normalizeDivideState(data);
      state.divideTeam = divideState.player.team;
      if(data.reward_skin) applyEventRewards({skins:[data.reward_skin]});
      save();
      applyGreatDivideEvent({status:'active'}, divideState, false);
      toast(`Team ${divideTeamName(state.divideTeam)} locked in. Every press now counts for your side.`, {time:6000});
      closeDivideChoice();
    }catch(error){
      toast(error.message || 'Could not choose a team yet.', {time:5000});
    }
  }

  function applyGreatDivideEvent(milestone, data, animate=false){
    divideState = normalizeDivideState(data || divideState);
    const active = Boolean(divideState.active || milestoneIsActive(milestone));
    divideState.active = active;
    document.body.classList.toggle('great-divide-active', active);
    document.body.classList.toggle('divide-red', active && (divideState.player?.team || state.divideTeam) === 'red');
    document.body.classList.toggle('divide-blue', active && (divideState.player?.team || state.divideTeam) === 'blue');

    if(!active){
      const board = qs('#great-divide-scoreboard');
      if(board) board.remove();
      closeDivideChoice();
      return;
    }

    ensureDivideLayer();
    updateDivideScoreboard();

    const team = divideState.player?.team || state.divideTeam;
    if(team){
      state.divideTeam = team;
      if(msgBox) msgBox.textContent = `The Great Divide is active. Your presses now help Team ${divideTeamName(team)}.`;
    }else{
      if(msgBox) msgBox.textContent = 'The Great Divide is active. Choose Red or Blue before your presses help a team.';
      showGreatDivideChoice();
    }
    const subtext = qs('#subtext');
    if(subtext) subtext.textContent = 'Red versus Blue. Every press matters now.';

    if(animate && !sessionStorage.getItem('thebutton:divide-intro-seen')){
      sessionStorage.setItem('thebutton:divide-intro-seen', '1');
      document.body.classList.add('great-divide-intro');
      setTimeout(()=>document.body.classList.remove('great-divide-intro'), 3200);
    }
  }

  function renderSkinPreview(){
    const skin = skinDefs[skinPreviewIndex] || skinDefs[0];
    const owned = state.skins.owned.includes(skin.id);
    if(skinNameEl) skinNameEl.textContent = `${skin.name}${owned ? '' : ' (locked)'}`;
    if(equipSkinButton){
      equipSkinButton.disabled = !owned;
      equipSkinButton.textContent = state.skins.equipped === skin.id ? 'Equipped' : 'Equip';
    }
  }

  function renderDailyGoal(){
    const target = dailyGoal.target || 1000;
    const presses = dailyGoal.presses || 0;
    const pct = Math.min(100, Math.round((presses / target) * 100));
    if(dailyGoalLabel) dailyGoalLabel.textContent = `${presses.toLocaleString()} / ${target.toLocaleString()}`;
    if(dailyGoalBar) dailyGoalBar.style.width = pct + '%';
    if(dailyGoalCopy){
      const remaining = Math.max(0, target - presses);
      dailyGoalCopy.textContent = remaining === 0
        ? "Today's community goal is complete. Keep piling on."
        : `${remaining.toLocaleString()} presses left in today's community goal.`;
    }
  }

  function saveDailyGoalFallback(goal){
    try{
      localStorage.setItem('thebutton:daily-goal', JSON.stringify(goal));
    }catch(error){}
  }

  function bumpDailyGoalFallback(delta=1){
    const today = localDateKey();
    if(dailyGoal.date !== today){
      dailyGoal = {date:today, presses:0, target:dailyGoal.target || 1000};
    }
    dailyGoal.presses = (Number(dailyGoal.presses) || 0) + delta;
    saveDailyGoalFallback(dailyGoal);
  }

  // --- UI ---
  function render(){
    ensureDaily();
    unlockSkins(false);
    applyButtonSkin();
    if(skinNameEl || equipSkinButton) renderSkinPreview();
    if(dailyGoalLabel || dailyGoalBar || dailyGoalCopy) renderDailyGoal();
    if(countEl){
      countEl.textContent = state.presses;
    }
    const statPresses = qs('#stat-presses');
    if(statPresses){
    statPresses.textContent = state.presses;
    }
    const daily = getDaily();
    if(dailyStreakEl) dailyStreakEl.textContent = daily.streak + (daily.streak === 1 ? ' day' : ' days');
    if(dailyPressesEl) dailyPressesEl.textContent = daily.presses + (daily.presses === 1 ? ' press' : ' presses');
    const statDailyPresses = qs('#stat-daily-presses');
    if(statDailyPresses) statDailyPresses.textContent = daily.presses;
    const statDailyStreak = qs('#stat-daily-streak');
    if(statDailyStreak) statDailyStreak.textContent = daily.streak + (daily.streak === 1 ? ' day' : ' days');
    const equippedSkin = qs('#stat-equipped-skin');
    if(equippedSkin) equippedSkin.textContent = skinById(state.skins.equipped).name;
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
    const statLore = qs('#stat-lore');
    if(statLore) statLore.textContent = state.loreSeen.length;

    if(loreList){
      loreList.innerHTML = '';
      state.loreSeen.forEach(i=>{
        const d = document.createElement('div'); d.textContent = lore[i]; loreList.appendChild(d);
      });
    }
  }

  //Toaster ---
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
  postEvent('achievement_unlocks', 1);
      }
    }
  }

  function showAchievementPopup(title){
    const el = document.createElement('div'); el.className='toast'; el.textContent = `🏆 ${title}`; toastArea.appendChild(el);
    setTimeout(()=>el.remove(), 2500);
  }

  function showSkinDropPopup(skinId, skinName){
    const modal = document.createElement('div');
    modal.className = 'modal skin-drop-modal';
    const card = document.createElement('div');
    card.className = 'modal-card glass skin-drop-card';
    card.innerHTML = `
      <p class="eyebrow">Rare skin unlocked</p>
      <div class="skin-drop-preview giant skin-${skinId}">THE BUTTON</div>
      <h3>${skinName}</h3>
      <p class="muted">It has been added to your skin inventory.</p>
      <button class="pill primary" type="button">Nice</button>
    `;
    modal.appendChild(card);
    document.body.appendChild(modal);
    const close = () => modal.remove();
    card.querySelector('button').addEventListener('click', close);
    setTimeout(close, 9000);
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
  const pranks = [
    'fakeUpdate','goose','fakeCall','alien','potato','teleport',
    'dvd','secretReward','stanwe','brokenScreen'
  ];
  function triggerPrank(forcedChoice=null){
    state.pranks++;
    save();
    let choice = forcedChoice || pranks[rand(0,pranks.length-1)];
    runPrank(choice);
    const prankStat = qs('#stat-pranks');
    if(prankStat) prankStat.textContent = state.pranks;
    postEvent('pranks_triggered', 1);
    const mapping = {
      goose:'gooses_released',
      potato:'potatoes_detected',
      rickroll:'rickroll_victims',
      alien:'alien_contacts'
    };
    if(mapping[choice]) postEvent(mapping[choice], 1);
  }

  // update global presses stored in localStorage
  function updateGlobalPresses(delta=1){
    // attempt to post to server; fallback to localStorage
    postPress(delta).then(data=>{
      if(data.daily_goal){
        dailyGoal = data.daily_goal;
        saveDailyGoalFallback(dailyGoal);
      } else {
        bumpDailyGoalFallback(delta);
      }
      renderDailyGoal();
      for(const award of data.new_world_firsts || []){
        const title = `World First: ${Number(award.milestone).toLocaleString()} presses`;
        toast(`Exclusive achievement unlocked: ${title}`, {time:6000});
        showAchievementPopup(title);
      }
      for(const milestone of data.new_global_milestones || []){
        toast(`Global milestone unlocked: ${milestone.title}`, {time:7000});
        showAchievementPopup(`${Number(milestone.threshold).toLocaleString()} - ${milestone.title}`);
        if(milestone.id === 'first-era'){
          applyNightFallsEvent(true, true);
        }else if(milestone.id === 'meteor'){
          applyMeteorEvent(milestone, 20000, true);
        }else if(milestone.id === 'divide'){
          applyGreatDivideEvent(milestone, data.divide, true);
        }
      }
      applyEventRewards(data.event_rewards);
      if(data.divide) applyGreatDivideEvent({status:data.divide.active ? 'active' : 'locked'}, data.divide, false);
      save();
    }).catch(()=>{
      const k='thebutton:global';
      try{
        const g = JSON.parse(localStorage.getItem(k)) || {visitors:1,presses:0,goose:0,potato:0,pranks:0};
        g.presses = (g.presses||0) + delta;
        localStorage.setItem(k,JSON.stringify(g));
        const el = qs('#stat-world-presses'); if(el) el.textContent = g.presses;
      }catch(e){console.warn('global update err',e)}
      bumpDailyGoalFallback(delta);
      renderDailyGoal();
    });
  }
  if ('ongesturestart' in window) {
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('gesturechange', e => e.preventDefault());
  document.addEventListener('gestureend', e => e.preventDefault());
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
      case 'stanwe': prankStanwe(); break;
      case 'rickroll': prankRickroll(); break;
      case 'brokenScreen': prankBrokenScreen(); break;
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
    const g = document.createElement('div'); g.style.position='fixed'; g.style.zIndex=1000; g.style.width='160px'; g.style.height='100px'; g.style.right='-200px'; g.style.bottom='120px'; g.style.background="url('images/goose.png') center/contain no-repeat"; g.style.transition='right 900ms ease, transform 900ms'; document.body.appendChild(g);
    // steal button
    btn.disabled=true; btn.style.filter='grayscale(60%)';
    setTimeout(()=>{g.style.right='20px'; g.style.transform='rotate(-5deg)';},120);
    setTimeout(()=>{ msgBox.textContent='HONK. The button has been confiscated.'; },900);
    setTimeout(()=>{ g.style.right='-300px'; btn.disabled=false; btn.style.filter='none'; msgBox.textContent='The goose returned the button, grudgingly.'; g.remove(); },10000);
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
    card.querySelector('#claim').onclick = ()=>{
      const message = card.querySelector('p');
      const claim = card.querySelector('#claim');
      message.textContent='Processing...';
      setTimeout(()=>{
        if(Math.random() < PRESENT_SKIN_CHANCE && !state.skins.owned.includes('present')){
          state.skins.owned.push('present');
          save();
          render();
          message.textContent='Wait. You actually won the Special Present skin.';
          claim.remove();
          toast('Rare skin dropped: Special Present Button', {time:7000});
          setTimeout(()=>showSkinDropPopup('present', 'Special Present Button'), 500);
          setTimeout(()=>modal.remove(),3200);
          return;
        }
        message.textContent='Congratulations. You won absolutely nothing.';
        claim.remove();
        setTimeout(()=>modal.remove(),2200);
      },1600);
    };
  }

  function prankStanwe(){
    const modal = document.createElement('div');
    modal.className = 'modal';
    const card = document.createElement('div');
    card.className = 'modal-card glass';
    card.innerHTML = `
      <h3>Important Question</h3>
      <p class="muted">do ya whant a swip of me Stanwe</p>
      <div style="display:flex;justify-content:flex-end">
        <button class="pill primary" type="button">ok</button>
      </div>
    `;
    modal.appendChild(card);
    document.body.appendChild(modal);
    card.querySelector('button').addEventListener('click', () => modal.remove());
  }

 function prankRickroll() {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const card = document.createElement('div');
  card.className = 'modal-card glass';

  card.innerHTML = `
    <h3>Secret Content</h3>
    <iframe
      width="560"
      height="315"
      src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
      title="YouTube video"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen
      style="width:100%;height:240px;border-radius:8px">
    </iframe>
  `;

  modal.appendChild(card);
  document.body.appendChild(modal);

  // Remove after 6 seconds
  setTimeout(() => {
    modal.remove();
  }, 6000);
}

  function prankBrokenScreen() {
  // Prevent multiple overlays
  if (document.getElementById('broken-screen-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'broken-screen-overlay';

  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.zIndex = '999999';
  overlay.style.pointerEvents = 'none';
  overlay.style.background ="url('images/broken.png') center/cover no-repeat";
  overlay.style.opacity = '0';

  document.body.appendChild(overlay);

  // Little flash for extra panic 😈
  document.body.style.transition = 'filter 100ms';
  document.body.style.filter = 'brightness(1.3)';

  setTimeout(() => {
    document.body.style.filter = '';
    overlay.style.transition = 'opacity 150ms';
    overlay.style.opacity = '1';
  }, 100);

  // Remove after 6 seconds
  setTimeout(() => {
    overlay.style.opacity = '0';

    setTimeout(() => {
      overlay.remove();
    }, 200);
  }, 6000);
}

  // --- Button press handler ---
  let lastPointerPress = 0;
  function handleButtonPress(event){
    if(event && event.type === 'click' && Date.now() - lastPointerPress < 450){
      return;
    }
    if(event && event.type === 'pointerdown'){
      lastPointerPress = Date.now();
      event.preventDefault();
    }
    recordClickTime();
    startNightFallsMusic();
    state.presses++;
    recordDailyPress();
    updateGlobalPresses(1);
    // animations
    btn.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:260});
    // color pulse
    btn.style.boxShadow = '0 30px 90px rgba(124,118,255,0.18)'; setTimeout(()=>btn.style.boxShadow='',350);
    // messages
    msgBox.textContent = messages[rand(0,messages.length-1)];
    unlockLore(); checkAchievements(); unlockSkins(true); save(); render();
    // minor chance for secret reward
    if(Math.random()<0.005) triggerPrank();
    if(Math.random()<RICKROLL_CHANCE) triggerPrank('rickroll');
  }

  btn.addEventListener('pointerdown', handleButtonPress);
  btn.addEventListener('click', handleButtonPress);

  const openStats = qs('#open-stats');
  const openMenu = qs('#open-menu');
  const openAchievements = qs('#open-achievements');
  const openLore = qs('#open-lore');
  const openLeaderboard = qs('#open-leaderboard');
  const achievementsToggle = qs('#achievements-toggle');
  const loreToggle = qs('#lore-toggle');
  const resetButton = qs('#reset');
  const achievementsPanel = qs('#achievements-panel');
  const lorePanel = qs('#lore-panel');

  if(openMenu) openMenu.addEventListener('click', ()=>{ window.location.href = 'menu.html'; });
  if(openStats) openStats.addEventListener('click', ()=>{ window.location.href = 'stats.html'; });
  if(openAchievements) openAchievements.addEventListener('click', ()=>{ window.location.href = 'achievements.html'; });
  if(openLore) openLore.addEventListener('click', ()=>{ window.location.href = 'lore.html'; });
  if(openLeaderboard) openLeaderboard.addEventListener('click', ()=>{ window.location.href = 'leaderboard.html'; });
  if(prevSkinButton) prevSkinButton.addEventListener('click', ()=>{
    skinPreviewIndex = (skinPreviewIndex - 1 + skinDefs.length) % skinDefs.length;
    renderSkinPreview();
  });
  if(nextSkinButton) nextSkinButton.addEventListener('click', ()=>{
    skinPreviewIndex = (skinPreviewIndex + 1) % skinDefs.length;
    renderSkinPreview();
  });
  if(equipSkinButton) equipSkinButton.addEventListener('click', ()=>{
    const skin = skinDefs[skinPreviewIndex] || skinDefs[0];
    if(!state.skins.owned.includes(skin.id)){
      toast(`${skin.name} is locked. ${skin.unlock}.`);
      return;
    }
    state.skins.equipped = skin.id;
    save();
    render();
    toast(`${skin.name} equipped.`);
  });

  function showCollectionPanel(panelName){
    if(!achievementsPanel || !lorePanel) return;
    const showLore = panelName === 'lore';
    achievementsPanel.classList.toggle('hidden', showLore);
    lorePanel.classList.toggle('hidden', !showLore);
    if(achievementsToggle){
      achievementsToggle.classList.toggle('active', !showLore);
      achievementsToggle.setAttribute('aria-selected', String(!showLore));
    }
    if(loreToggle){
      loreToggle.classList.toggle('active', showLore);
      loreToggle.setAttribute('aria-selected', String(showLore));
    }
  }

  if(achievementsToggle && loreToggle){
    achievementsToggle.addEventListener('click', ()=>{
      history.replaceState(null, '', '#achievements');
      showCollectionPanel('achievements');
    });
    loreToggle.addEventListener('click', ()=>{
      history.replaceState(null, '', '#lore');
      showCollectionPanel('lore');
    });
    showCollectionPanel(window.location.hash === '#lore' ? 'lore' : 'achievements');
    window.addEventListener('hashchange', ()=>{
      showCollectionPanel(window.location.hash === '#lore' ? 'lore' : 'achievements');
    });
  }
  if(resetButton){
    resetButton.addEventListener('click', ()=>{
      const gamerTag = state.gamerTag;
      const humor = state.humor;
      state = {
        presses:0,
        achievements:[],
        eventAchievements:[],
        loreSeen:[],
        gamerTag,
        humor,
        lastClicks:[],
        pranks:0,
        timeSpentSeconds:0,
        daily:{
          date:localDateKey(),
          presses:0,
          streak:0,
          bestStreak:0,
          lastPressDate:''
        },
        skins:{
          owned:['classic'],
          equipped:'classic'
        }
      };
      save();
      render();
      renderTime();
      toast('Your local progress was reset.');
    });
  }

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
    fetchGlobalMilestones();
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
if(countEl){
  countEl.textContent = state.presses;
}
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

  if(window.setupVersionEgg){
    window.setupVersionEgg({toast});
  }

  // --- Global stats (Flask API) integration ---
  const API_BASE = '';// relative path assumes same host (serve Flask alongside static files)
  function apiBases(){
    const bases = [API_BASE];
    if(location.hostname && location.port !== '5000' && location.protocol === 'http:'){
      bases.push(`${location.protocol}//${location.hostname}:5000`);
    }
    return [...new Set(bases)];
  }

  async function apiFetch(path, options){
    let lastError = null;
    for(const base of apiBases()){
      try{
        const res = await fetch(base + path, Object.assign({cache:'no-store'}, options || {}));
        const contentType = res.headers.get('content-type') || '';
        if(res.ok && (!path.startsWith('/api/') || contentType.includes('application/json'))){
          return res;
        }
        if(res.ok){
          lastError = new Error(`${path} returned non-JSON response`);
          continue;
        }
        if(![404, 502, 503, 504].includes(res.status)){
          return res;
        }
        lastError = new Error(`${path} returned ${res.status}`);
      }catch(error){
        lastError = error;
      }
    }
    throw lastError || new Error(`${path} unavailable`);
  }

  async function postVisit(){
    try{ await apiFetch('/api/visit', {method:'POST'}); }catch(e){/*silent fallback*/}
  }

  async function postPress(delta=1){
  const res = await apiFetch(
    '/api/press',
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
  return res.json();
}

  async function fetchDailyGoal(){
    try{
      const res = await apiFetch('/api/daily-goal');
      if(!res.ok) throw new Error('daily goal unavailable');
      dailyGoal = await res.json();
      saveDailyGoalFallback(dailyGoal);
    }catch(e){
      const today = localDateKey();
      try{
        const raw = localStorage.getItem('thebutton:daily-goal');
        const saved = raw ? JSON.parse(raw) : {};
        dailyGoal = saved.date === today ? saved : {date:today, presses:getDaily().presses, target:1000};
      }catch(err){
        dailyGoal = {date:today, presses:getDaily().presses, target:1000};
      }
    }
    renderDailyGoal();
  }

  async function postDailyPress(delta=1){
    try{
      const res = await apiFetch('/api/daily-press', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({delta})
      });
      if(!res.ok) throw new Error('daily press failed');
      dailyGoal = await res.json();
    }catch(e){
      const today = localDateKey();
      dailyGoal = {
        date:today,
        presses:(dailyGoal.date === today ? dailyGoal.presses || 0 : 0) + delta,
        target:dailyGoal.target || 1000
      };
      try{ localStorage.setItem('thebutton:daily-goal', JSON.stringify(dailyGoal)); }catch(err){}
    }
    renderDailyGoal();
  }

  async function postEvent(type, delta=1){
    try{ await apiFetch('/api/event', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,delta})}); }catch(e){/*silent*/}
  }

  // Count one visit per browser tab.
  if(!sessionStorage.getItem('thebutton:visit-counted')){
    sessionStorage.setItem('thebutton:visit-counted', '1');
    postVisit();
  }

  // auto-refresh global stats and animate numbers
  let globalRefreshTimer = null;
  async function fetchGlobalStats(){
    try{
      const res = await apiFetch('/api/stats');
      if(!res.ok) throw new Error('noapi');
      const data = await res.json();
      // map keys
      const map = {
        total_visitors: 'g_total_visitors',
        total_presses: 'g_total_presses',
        gooses_released: 'g_total_goose',
        potatoes_detected: 'g_total_potato',
        pranks_triggered: 'g_total_pranks',
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

  async function fetchGlobalMilestones(){
    try{
      const res = await apiFetch('/api/global-milestones');
      if(!res.ok) throw new Error('milestone API unavailable');
      const data = await res.json();
      const firstEra = (data.milestones || []).find(milestone => milestone.id === 'first-era');
      const meteor = (data.milestones || []).find(milestone => milestone.id === 'meteor');
      const divide = (data.milestones || []).find(milestone => milestone.id === 'divide');
      let divideData = data.divide;
      if(milestoneIsActive(divide)){
        try{
          const divideRes = await apiFetch(`/api/divide?name=${encodeURIComponent(state.gamerTag || 'Traveler')}`);
          if(divideRes.ok) divideData = await divideRes.json();
        }catch(error){}
      }
      applyNightFallsEvent(milestoneIsActive(firstEra), false);
      applyMeteorEvent(meteor, data.total_presses || 0, false);
      applyGreatDivideEvent(divide, divideData, false);
    }catch(e){ /* keep the normal button page if the API is unavailable */ }
  }

  function animateNumber(el, to){
    const from = Number(el.textContent.replace(/[^0-9]/g,'')) || 0;
    if(from === to) return; const start = performance.now(); const dur = 600; function step(now){ const t = Math.min(1, (now-start)/dur); const v = Math.round(from + (to-from)*t); el.textContent = v; el.classList.add('num-animate'); if(t<1) requestAnimationFrame(step); else { setTimeout(()=>el.classList.remove('num-animate'), 420); } } requestAnimationFrame(step);
  }

  // start periodic refresh
  fetchGlobalStats(); globalRefreshTimer = setInterval(fetchGlobalStats, 30000);
  fetchGlobalMilestones(); setInterval(fetchGlobalMilestones, 60000);
  fetchDailyGoal(); setInterval(fetchDailyGoal, 30000);

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
