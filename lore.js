(function(){
  const STORAGE_KEY = 'thebutton:v1';
  const baseLore = [
    'The Button was discovered after the Great Cheese Incident of 1987.',
    'The Button predates civilization by at least three Tuesdays.',
    'The Button briefly served as mayor.',
    'It once convinced a lighthouse to change careers.',
    'Do not let the Button near a blender.',
    'The Button hums softly at 3:14am.',
    'A once-famous poet wrote an ode to the Button in invisible ink.',
    'The Button once hid inside a vending machine and refused to dispense anything but suspense.',
    'A forgotten kingdom measured time by how often The Button felt dramatic.',
    'The Button has a tiny legal team dedicated to arguing with elevators.',
    'The Button once replaced a weather report with the word maybe.',
    'The Button keeps a scrapbook of every almost-press.',
    'A moon crater is shaped suspiciously like The Button.',
    'The Button passed a background check performed by a lamp.',
    'The Button invented a holiday and forgot to tell anyone.',
    'Three philosophers tried to define The Button and immediately needed snacks.',
    'The Button owns a map with no countries, only vibes.',
    'A secret tunnel under The Button leads to another smaller button.',
    'The Button refuses to explain why it knows Morse code.',
    'The Button once made a microwave feel underqualified.',
    'The Button has been described as round by several reliable witnesses.',
    'The Button stores thunder in a very small envelope.',
    'The Button once challenged gravity and negotiated a draw.',
    'A museum tried to display The Button, but the display case got nervous.',
    'The Button has a favorite cloud and will not say which one.',
    'The Button can smell fresh patch notes from two rooms away.',
    'The Button once convinced a calendar to add Thursday 2.'
  ];
  const lore = Array.from({length:220}, (_, index) =>
    `${baseLore[index % baseLore.length]} (Lore entry #${index + 1})`
  );

  function getState(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }catch(error){
      return {};
    }
  }

  function saveState(state){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(error){}
  }

  function normalizeUnlockedLore(state){
    const presses = Number(state.presses || 0);
    const earnedCount = Math.min(lore.length, Math.floor(presses / 25));
    const unlocked = new Set(
      (Array.isArray(state.loreSeen) ? state.loreSeen : [])
        .map(index => Number(index))
        .filter(index => Number.isInteger(index) && index >= 0 && index < lore.length)
    );
    for(let index = 0; index < earnedCount; index++){
      unlocked.add(index);
    }
    state.loreSeen = Array.from(unlocked).sort((a,b) => a - b);
    saveState(state);
    return new Set(state.loreSeen);
  }

  function createEntry(text, index, unlocked){
    const entry = document.createElement('article');
    entry.className = `lore-entry ${unlocked ? 'unlocked' : 'locked'}`;
    const number = document.createElement('span');
    number.className = 'lore-number';
    number.textContent = String(index + 1).padStart(3, '0');
    const copy = document.createElement('p');
    copy.textContent = unlocked ? text : `Locked - unlocks at ${(index + 1) * 25} presses`;
    entry.append(number, copy);
    return entry;
  }

  function initParticles(){
    const canvas = document.getElementById('particles');
    const context = canvas.getContext('2d');
    function resize(){
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    const particles = Array.from({length:40}, () => ({
      x:Math.random() * canvas.width,
      y:Math.random() * canvas.height,
      r:Math.random() * 1.4 + 0.5,
      dx:(Math.random() - 0.5) * 0.2,
      dy:(Math.random() - 0.5) * 0.2
    }));
    function frame(){
      context.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(particle => {
        particle.x = (particle.x + particle.dx + canvas.width) % canvas.width;
        particle.y = (particle.y + particle.dy + canvas.height) % canvas.height;
        context.beginPath();
        context.fillStyle = 'rgba(124,242,255,0.05)';
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        context.fill();
      });
      requestAnimationFrame(frame);
    }
    frame();
  }

  const state = getState();
  const unlocked = normalizeUnlockedLore(state);
  document.getElementById('lore-count').textContent = `${unlocked.size} / ${lore.length}`;
  document.getElementById('lore-summary').textContent =
    `A new record is recovered every 25 presses. You have ${Number(state.presses || 0).toLocaleString()} presses.`;
  document.getElementById('lore-entries').replaceChildren(
    ...lore.map((entry, index) => createEntry(entry, index, unlocked.has(index)))
  );

  fetch(`version.json?t=${Date.now()}`)
    .then(response => response.json())
    .then(version => {
      const build = String(version.build || 'unknown').split('-').pop();
      document.getElementById('version-display').textContent = `v${version.version || '0.0.0'} b${build}`;
    })
    .catch(() => {});

  initParticles();
})();
