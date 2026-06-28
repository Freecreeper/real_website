(function(){
  const fallbackMilestones = [
    {
      id:'first-era',
      threshold:10000,
      icon:'Moon',
      title:'The Night Falls',
      event:'The First Era has ended...',
      status:'locked',
      active_hours:24,
      effects:['Screen fades to black', 'Music changes', 'Stars appear', 'The button glows'],
      rewards:['First Era badge for everyone who presses during the event', 'Small chance for the Moon Button skin']
    },
    {
      id:'meteor',
      threshold:20000,
      icon:'Meteor',
      title:'Meteor Impact',
      event:'A meteor crashes into the button.',
      status:'locked',
      active_hours:48,
      effects:['Countdown near impact', 'Whole page shake', 'Dust everywhere', 'Meteor glow during the event'],
      rewards:['Meteor Badge for everyone online', 'Meteor Button skin drop chance for 48 hours']
    },
    {
      id:'divide',
      threshold:50000,
      icon:'Divide',
      title:'The Great Divide',
      event:'Choose Red or Blue for the season.',
      status:'locked',
      active_hours:336,
      effects:['The screen splits', 'Every press helps your team', '14-day team season', 'Live Red vs Blue scoreboard'],
      rewards:['Winning team gets an exclusive champion skin when the season closes', 'Top Red and Blue players become MVPs']
    },
    {
      id:'alien',
      threshold:100000,
      icon:'Alien',
      title:'Alien Contact',
      event:'Aliens hack the website.',
      status:'locked',
      active_hours:168,
      effects:['Page glitches', 'Random weird sounds', 'The button floats', 'UFOs fly across the page'],
      rewards:['Alien button skin available for a week']
    },
    {
      id:'surge',
      threshold:250000,
      icon:'Surge',
      title:'Power Surge',
      event:'Lightning hits. Everything glows.',
      status:'locked',
      active_hours:24,
      effects:['Every press counts as two for one day', 'Lightning effects', 'Fireworks for everyone'],
      rewards:['One-day double press event']
    },
    {
      id:'space',
      threshold:500000,
      icon:'Space',
      title:'Into Space',
      event:'The button leaves Earth.',
      status:'locked',
      active_hours:null,
      effects:['Space background', 'Moving stars', 'Rotating Earth', 'Floating button and gravity effects'],
      rewards:['Galaxy button becomes obtainable']
    },
    {
      id:'million',
      threshold:1000000,
      icon:'Crown',
      title:'One Million',
      event:'The Button reaches one million presses.',
      status:'locked',
      active_hours:null,
      effects:['Confetti', 'Fireworks', 'Golden button', 'Credits rolling'],
      rewards:['Million Club Badge for everyone online', 'Never obtainable again']
    }
  ];

  function qs(selector){ return document.querySelector(selector); }
  function setText(id, value){
    const el = qs('#' + id);
    if(el) el.textContent = value;
  }
  function formatNumber(value){
    return Number(value || 0).toLocaleString();
  }
  function statusLabel(milestone){
    if(milestone.status === 'active') return 'Active';
    if(milestone.status === 'unlocked') return 'Unlocked';
    return 'Locked';
  }
  function renderDividePanel(divide){
    if(!divide || !divide.teams) return '';
    const red = Number(divide.teams.red?.presses || 0);
    const blue = Number(divide.teams.blue?.presses || 0);
    const total = red + blue;
    const redPct = total ? Math.round(red / total * 100) : 50;
    const leader = divide.leader === 'tie' ? 'Tied' : `${divide.teams[divide.leader]?.name || divide.leader} leads`;
    const redMvp = divide.mvps?.red ? `${divide.mvps.red.name} (${formatNumber(divide.mvps.red.presses)})` : 'No Red MVP yet';
    const blueMvp = divide.mvps?.blue ? `${divide.mvps.blue.name} (${formatNumber(divide.mvps.blue.presses)})` : 'No Blue MVP yet';
    return `
      <div class="divide-milestone-panel">
        <div class="divide-score-head">
          <span>Live Season</span>
          <strong>${leader}</strong>
        </div>
        <div class="divide-score-row red"><span>Red</span><strong>${formatNumber(red)}</strong></div>
        <div class="divide-score-row blue"><span>Blue</span><strong>${formatNumber(blue)}</strong></div>
        <div class="divide-score-track"><span style="width:${redPct}%"></span></div>
        <div class="divide-mvp-grid">
          <p><span>Red MVP</span><strong>${redMvp}</strong></p>
          <p><span>Blue MVP</span><strong>${blueMvp}</strong></p>
        </div>
      </div>
    `;
  }
  function renderMilestone(milestone, totalPresses){
    const article = document.createElement('article');
    article.className = `milestone-card ${milestone.status || 'locked'}`;
    const remaining = Math.max(0, milestone.threshold - totalPresses);
    const pct = Math.min(100, totalPresses / milestone.threshold * 100);
    const windowText = milestone.active_until
      ? `Active until ${new Date(milestone.active_until).toLocaleString()}`
      : (milestone.active_hours ? `${milestone.active_hours} hour reward window` : 'Permanent world event');

    article.innerHTML = `
      <div class="milestone-topline">
        <span class="milestone-icon">${milestone.icon}</span>
        <span class="milestone-status">${statusLabel(milestone)}</span>
      </div>
      <h2>${formatNumber(milestone.threshold)} Presses - ${milestone.title}</h2>
      <p class="milestone-event">${milestone.event}</p>
      <div class="goal-track milestone-track"><span style="width:${pct}%"></span></div>
      <p class="muted">${remaining ? `${formatNumber(remaining)} presses left.` : windowText}</p>
      <div class="milestone-columns">
        <div>
          <h3>Event Effects</h3>
          <ul>${milestone.effects.map(effect => `<li>${effect}</li>`).join('')}</ul>
        </div>
        <div>
          <h3>Rewards</h3>
          <ul>${milestone.rewards.map(reward => `<li>${reward}</li>`).join('')}</ul>
        </div>
      </div>
      ${milestone.id === 'divide' ? renderDividePanel(milestone.divide) : ''}
    `;
    return article;
  }
  function render(data){
    const totalPresses = Number(data.total_presses || 0);
    const milestones = Array.isArray(data.milestones) ? data.milestones : fallbackMilestones;
    const list = qs('#milestone-list');
    const next = milestones.find(milestone => totalPresses < milestone.threshold);

    setText('global-press-count', formatNumber(totalPresses));
    setText('milestone-summary', next
      ? `${formatNumber(next.threshold - totalPresses)} presses until ${next.title}.`
      : 'Every listed global milestone has been reached.');

    if(next){
      const pct = Math.min(100, totalPresses / next.threshold * 100);
      setText('next-milestone-title', `${formatNumber(next.threshold)} - ${next.title}`);
      setText('next-milestone-count', `${formatNumber(totalPresses)} / ${formatNumber(next.threshold)}`);
      setText('next-milestone-copy', `${formatNumber(next.threshold - totalPresses)} presses left before ${next.event}`);
      const bar = qs('#next-milestone-bar');
      if(bar) bar.style.width = pct + '%';
    }else{
      setText('next-milestone-title', 'All milestones reached');
      setText('next-milestone-count', formatNumber(totalPresses));
      setText('next-milestone-copy', 'The button has entered legend mode.');
      const bar = qs('#next-milestone-bar');
      if(bar) bar.style.width = '100%';
    }

    if(list){
      list.replaceChildren(...milestones.map(milestone => renderMilestone(milestone, totalPresses)));
    }
  }
  async function loadMilestones(){
    try{
      const response = await window.buttonApiFetch('/api/global-milestones');
      if(!response.ok) throw new Error('milestones unavailable');
      render(await response.json());
    }catch(error){
      try{
        const statsResponse = await window.buttonApiFetch('/api/stats');
        const stats = statsResponse.ok ? await statsResponse.json() : {};
        render({total_presses:stats.total_presses || 0, milestones:fallbackMilestones});
      }catch(innerError){
        render({total_presses:0, milestones:fallbackMilestones});
        setText('milestone-summary', 'Global milestone API is unavailable right now.');
      }
    }
  }

  if(window.setupVersionEgg) window.setupVersionEgg();
  loadMilestones();
  setInterval(loadMilestones, 15000);
})();
