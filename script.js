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

function init(){
  render();
  elements.bigButton.addEventListener('click', onPress);
  document.addEventListener('keydown', handleKeydown);
  elements.overlay.addEventListener('click', hideOverlay);
  window.addEventListener('resize', resizeCanvas);
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
  elements.modal.innerHTML = `<h3>${title}</h3><div>${body}</div>`;
  elements.overlay.classList.remove('hidden');
  elements.modal.classList.remove('hidden');
  if(duration > 0){
    activeTimers.push(setTimeout(hideOverlay, duration));
  }
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
  activeTimers.forEach(id => { clearTimeout(id); clearInterval(id); });
  activeTimers = [];
}

function randomFrom(array){
  return array[Math.floor(Math.random() * array.length)];
}

function triggerRandomReward(){
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
