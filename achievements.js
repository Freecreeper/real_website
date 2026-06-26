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
  const eventAchievements = [
    {
      id:'first-era',
      title:'First Era Badge',
      description:'Press during The Night Falls global event.'
    },
    {
      id:'meteor',
      title:'Meteor Badge',
      description:'Press during the Meteor Impact global event.'
    }
  ];

  function getLocalState(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }catch(error){
      return {};
    }
  }

  function createAchievementRow(title, description, unlocked, exclusive, progress){
    const row = document.createElement('article');
    row.className = `achievement-row${unlocked ? ' unlocked' : ' locked'}${exclusive ? ' exclusive' : ''}`;

    const marker = document.createElement('span');
    marker.className = 'achievement-marker';
    marker.textContent = unlocked ? (exclusive ? '1st' : 'Done') : 'Locked';

    const copy = document.createElement('div');
    copy.className = 'achievement-copy';
    const heading = document.createElement('h3');
    const detail = document.createElement('p');
    heading.textContent = title;
    detail.textContent = description;
    copy.append(heading, detail);

    if(typeof progress === 'number'){
      const track = document.createElement('div');
      const fill = document.createElement('span');
      track.className = 'achievement-progress';
      fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      track.appendChild(fill);
      copy.appendChild(track);
    }

    row.append(copy, marker);
    return row;
  }

  function renderStandard(state){
    const container = document.getElementById('standard-achievements');
    const unlockedIds = new Set(state.achievements || []);
    const presses = Number(state.presses || 0);
    let unlockedCount = 0;
    container.replaceChildren(...standardAchievements.map(achievement => {
      const unlocked = unlockedIds.has(achievement.id) || presses >= achievement.presses;
      if(unlocked) unlockedCount++;
      return createAchievementRow(
        achievement.title,
        unlocked ? `${achievement.presses.toLocaleString()} presses reached` : `${presses.toLocaleString()} / ${achievement.presses.toLocaleString()} presses`,
        unlocked,
        false,
        presses / achievement.presses * 100
      );
    }));
    document.getElementById('achievement-count').textContent =
      `${unlockedCount} / ${standardAchievements.length}`;
  }

  function renderWorldFirsts(data, gamerTag, serverAvailable = true){
    const container = document.getElementById('world-first-achievements');
    const claims = Array.isArray(data.world_firsts) ? data.world_firsts : [];
    const nextMilestone = Number(data.next_world_first_milestone || 5000);
    const cards = claims.map(claim => {
      const owned = claim.name === gamerTag;
      return createAchievementRow(
        `World First: ${Number(claim.milestone).toLocaleString()}`,
        owned ? 'You are the only owner of this achievement.' : `Owned by ${claim.name}.`,
        owned,
        true
      );
    });

    cards.push(createAchievementRow(
      `Next: ${nextMilestone.toLocaleString()} presses`,
      'Unclaimed. First player to reach it on the server wins it permanently.',
      false,
      true
    ));
    container.replaceChildren(...cards);

    const ownedCount = claims.filter(claim => claim.name === gamerTag).length;
    document.getElementById('world-first-status').textContent = serverAvailable
      ? (ownedCount ? `You own ${ownedCount} exclusive achievement${ownedCount === 1 ? '' : 's'}.` : 'No exclusive wins yet.')
      : 'Server offline - world-first claims are unavailable.';
  }

  function renderEventAchievements(state){
    const container = document.getElementById('event-achievements');
    if(!container) return;
    const unlockedIds = new Set(state.eventAchievements || []);
    container.replaceChildren(...eventAchievements.map(achievement => createAchievementRow(
      achievement.title,
      unlockedIds.has(achievement.id) ? 'Unlocked during a global event.' : achievement.description,
      unlockedIds.has(achievement.id),
      true
    )));
  }

  function mergeServerRewards(state, data){
    state.eventAchievements = Array.isArray(state.eventAchievements) ? state.eventAchievements : [];
    state.skins = Object.assign({owned:['classic'], equipped:'classic'}, state.skins || {});
    state.skins.owned = Array.isArray(state.skins.owned) ? state.skins.owned : ['classic'];

    for(const achievement of data.event_achievements || []){
      if(!state.eventAchievements.includes(achievement)) state.eventAchievements.push(achievement);
    }
    for(const skin of data.skins || []){
      if(!state.skins.owned.includes(skin)) state.skins.owned.push(skin);
    }
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(error){}
  }

  async function loadServerAchievements(gamerTag){
    const response = await window.buttonApiFetch(`/api/achievements?name=${encodeURIComponent(gamerTag)}`);
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
  renderEventAchievements(state);
  document.getElementById('achievement-summary').textContent =
    `${gamerTag}, you have ${Number(state.presses || 0).toLocaleString()} local presses.`;

  loadServerAchievements(gamerTag)
    .then(data => {
      mergeServerRewards(state, data);
      renderEventAchievements(state);
      renderWorldFirsts(data, gamerTag);
    })
    .catch(() => {
      renderWorldFirsts({world_firsts:[], next_world_first_milestone:5000}, gamerTag, false);
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
