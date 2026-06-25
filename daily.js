(function(){
  const STORAGE_KEY = 'thebutton:v1';

  function qs(selector){ return document.querySelector(selector); }
  function todayKey(){
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function daysBetween(a,b){
    if(!a || !b) return null;
    return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  }
  function loadState(){
    const state = {
      presses:0,
      daily:{date:'', presses:0, streak:0, bestStreak:0, lastPressDate:''}
    };
    try{
      Object.assign(state, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {});
    }catch(error){}

    state.daily = Object.assign({date:'', presses:0, streak:0, bestStreak:0, lastPressDate:''}, state.daily || {});
    const today = todayKey();
    if(state.daily.date !== today){
      const gap = daysBetween(state.daily.lastPressDate || state.daily.date, today);
      if(gap !== 1) state.daily.streak = 0;
      state.daily.date = today;
      state.daily.presses = 0;
      try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(error){}
    }
    return state;
  }
  function setText(id, value){
    const el = qs('#' + id);
    if(el) el.textContent = value;
  }
  function renderState(){
    const state = loadState();
    setText('daily-streak', `${state.daily.streak || 0}d`);
    setText('daily-best-streak', `${state.daily.bestStreak || 0}d`);
    setText('daily-presses', Number(state.daily.presses || 0).toLocaleString());
    setText('daily-total-presses', Number(state.presses || 0).toLocaleString());
  }
  async function renderGoal(){
    let goal = {date:todayKey(), presses:0, target:1000};
    try{
      const response = await fetch('/api/daily-goal');
      if(response.ok) goal = await response.json();
    }catch(error){
      try{
        const saved = JSON.parse(localStorage.getItem('thebutton:daily-goal') || '{}');
        if(saved.date === goal.date) goal = saved;
      }catch(innerError){}
    }

    const presses = Number(goal.presses || 0);
    const target = Number(goal.target || 1000);
    const pct = target ? Math.min(100, Math.round(presses / target * 100)) : 0;
    const bar = qs('#daily-goal-bar');
    if(bar) bar.style.width = pct + '%';
    setText('daily-goal-label', `${presses.toLocaleString()} / ${target.toLocaleString()}`);
    setText('daily-goal-status', `${pct}%`);
    const copy = qs('#daily-goal-copy');
    if(copy){
      const remaining = Math.max(0, target - presses);
      copy.textContent = remaining === 0
        ? "Today's community goal is complete."
        : `${remaining.toLocaleString()} presses left in today's community goal.`;
    }
  }

  if(window.setupVersionEgg) window.setupVersionEgg();
  renderState();
  renderGoal();
  setInterval(() => {
    renderState();
    renderGoal();
  }, 5000);
})();
