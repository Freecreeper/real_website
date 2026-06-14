(function(){
  const STORAGE_KEY = 'thebutton:v1';
  const baseLore = [
    'The Button was discovered after the Great Cheese Incident of 1987.',
    'The Button predates civilization by at least three Tuesdays.',
    'The Button briefly served as mayor.',
    'It once convinced a lighthouse to change careers.',
    'Do not let the Button near a blender.',
    'The Button hums softly at 3:14am.',
    'A once-famous poet wrote an ode to the Button in invisible ink.'
  ];
  const lore = Array.from({length:120}, (_, index) =>
    `${baseLore[index % baseLore.length]} (Lore entry #${index + 1})`
  );

  function getState(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }catch(error){
      return {};
    }
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
  const unlocked = new Set(state.loreSeen || []);
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
