(function(){
  const STORAGE_KEY = 'thebutton:v1';
  const standardAchievements = [
    {id:'a10', presses:10, title:'No Self Control'},
    {id:'a25', presses:25, title:'Button Apprentice'},
    {id:'a50', presses:50, title:'Professional Button Enjoyer'},
    {id:'a100', presses:100, title:'One With The Button'},
    {id:'a500', presses:500, title:'Concerning Dedication'},
    {id:'a1000', presses:1000, title:'Please Go Outside'}
  ];

  function getLocalState(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }catch(error){
      return {};
    }
  }

  function createAchievementCard(title, description, unlocked, exclusive){
    const card = document.createElement('article');
    card.className = `achievement-card${unlocked ? ' unlocked' : ' locked'}${exclusive ? ' exclusive' : ''}`;

    const marker = document.createElement('span');
    marker.className = 'achievement-marker';
    marker.textContent = unlocked ? (exclusive ? '1ST' : 'OK') : '?';

    const copy = document.createElement('div');
    const heading = document.createElement('h3');
    const detail = document.createElement('p');
    heading.textContent = title;
    detail.textContent = description;
    copy.append(heading, detail);
    card.append(marker, copy);
    return card;
  }

  function renderStandard(state){
    const container = document.getElementById('standard-achievements');
    const unlockedIds = new Set(state.achievements || []);
    container.replaceChildren(...standardAchievements.map(achievement => {
      const unlocked = unlockedIds.has(achievement.id) || Number(state.presses || 0) >= achievement.presses;
      return createAchievementCard(
        achievement.title,
        `${achievement.presses.toLocaleString()} presses`,
        unlocked,
        false
      );
    }));
  }

  function renderWorldFirsts(data, gamerTag){
    const container = document.getElementById('world-first-achievements');
    const claims = Array.isArray(data.world_firsts) ? data.world_firsts : [];
    const nextMilestone = Number(data.next_world_first_milestone || 5000);
    const cards = claims.map(claim => {
      const owned = claim.name === gamerTag;
      return createAchievementCard(
        `World First: ${Number(claim.milestone).toLocaleString()}`,
        owned ? 'Claimed by you. This achievement is yours alone.' : `Claimed by ${claim.name}.`,
        owned,
        true
      );
    });

    cards.push(createAchievementCard(
      `World First: ${nextMilestone.toLocaleString()}`,
      `Be the first player to reach ${nextMilestone.toLocaleString()} server-recorded presses.`,
      false,
      true
    ));
    container.replaceChildren(...cards);

    const ownedCount = claims.filter(claim => claim.name === gamerTag).length;
    document.getElementById('world-first-status').textContent =
      ownedCount ? `You own ${ownedCount} exclusive achievement${ownedCount === 1 ? '' : 's'}.` : 'No exclusive wins yet.';
  }

  async function loadServerAchievements(gamerTag){
    const response = await fetch(`/api/achievements?name=${encodeURIComponent(gamerTag)}`);
    if(!response.ok) throw new Error('Achievements API unavailable');
    return response.json();
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

    const particles = Array.from({length:45}, () => ({
      x:Math.random() * canvas.width,
      y:Math.random() * canvas.height,
      radius:Math.random() * 1.4 + 0.5,
      dx:(Math.random() - 0.5) * 0.25,
      dy:(Math.random() - 0.5) * 0.25
    }));
    function frame(){
      context.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(particle => {
        particle.x = (particle.x + particle.dx + canvas.width) % canvas.width;
        particle.y = (particle.y + particle.dy + canvas.height) % canvas.height;
        context.beginPath();
        context.fillStyle = 'rgba(124,242,255,0.06)';
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
      requestAnimationFrame(frame);
    }
    frame();
  }

  const state = getLocalState();
  const gamerTag = state.gamerTag || 'Traveler';
  renderStandard(state);
  document.getElementById('achievement-summary').textContent =
    `${gamerTag}, you have ${Number(state.presses || 0).toLocaleString()} local presses.`;

  loadServerAchievements(gamerTag)
    .then(data => renderWorldFirsts(data, gamerTag))
    .catch(() => {
      document.getElementById('world-first-status').textContent = 'Start the Flask server to load world-first achievements.';
      renderWorldFirsts({world_firsts:[], next_world_first_milestone:5000}, gamerTag);
    });

  fetch(`version.json?t=${Date.now()}`)
    .then(response => response.json())
    .then(version => {
      const buildNumber = String(version.build || 'unknown').split('-').pop();
      document.getElementById('version-display').textContent = `v${version.version || '0.0.0'} b${buildNumber}`;
    })
    .catch(() => {});

  initParticles();
})();
