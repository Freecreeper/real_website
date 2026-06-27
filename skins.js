(function(){
  const STORAGE_KEY = 'thebutton:v1';
  const skinDefs = [
    {id:'classic', name:'Classic', unlock:'Starter skin', requirement:state => true},
    {id:'moon', name:'Moon', unlock:'Drops during The Night Falls event', requirement:state => (state.skins?.owned || []).includes('moon')},
    {id:'meteor', name:'Meteor', unlock:'Drops during Meteor Impact', requirement:state => (state.skins?.owned || []).includes('meteor')},
    {id:'red-champion', name:'Red Champion', unlock:'Win a Great Divide season with Team Red', requirement:state => (state.skins?.owned || []).includes('red-champion')},
    {id:'blue-champion', name:'Blue Champion', unlock:'Win a Great Divide season with Team Blue', requirement:state => (state.skins?.owned || []).includes('blue-champion')},
    {id:'present', name:'Special Present', unlock:'Extremely rare Secret Reward drop', requirement:state => (state.skins?.owned || []).includes('present')},
    {id:'sunrise', name:'Sunrise', unlock:'Press 25 times', requirement:state => Number(state.presses || 0) >= 25},
    {id:'matrix', name:'Matrix', unlock:'Press 100 times', requirement:state => Number(state.presses || 0) >= 100},
    {id:'royal', name:'Royal', unlock:'Reach a 3 day streak', requirement:state => Number((state.daily || {}).streak || 0) >= 3},
    {id:'candy', name:'Candy Pop', unlock:'Press 50 times in one day', requirement:state => Number((state.daily || {}).presses || 0) >= 50},
    {id:'gold', name:'Gold', unlock:'Press 1,000 times', requirement:state => Number(state.presses || 0) >= 1000}
  ];

  let state = null;
  let selectedSkin = 'classic';

  function qs(selector){ return document.querySelector(selector); }
  function loadState(){
    const base = {
      presses:0,
      daily:{presses:0, streak:0},
      skins:{owned:['classic'], equipped:'classic'}
    };
    try{
      Object.assign(base, JSON.parse(localStorage.getItem(STORAGE_KEY)) || {});
    }catch(error){}
    base.daily = Object.assign({presses:0, streak:0}, base.daily || {});
    base.skins = Object.assign({owned:['classic'], equipped:'classic'}, base.skins || {});
    if(!Array.isArray(base.skins.owned)) base.skins.owned = ['classic'];
    if(!base.skins.owned.includes('classic')) base.skins.owned.unshift('classic');

    for(const skin of skinDefs){
      if(skin.requirement(base) && !base.skins.owned.includes(skin.id)){
        base.skins.owned.push(skin.id);
      }
    }
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(base)); }catch(error){}
    return base;
  }
  function skinById(id){
    return skinDefs.find(skin => skin.id === id) || skinDefs[0];
  }
  function applyPreview(){
    const preview = qs('#skin-preview-button');
    const summary = qs('#skin-summary');
    const equip = qs('#equip-selected-skin');
    const skin = skinById(selectedSkin);
    const owned = state.skins.owned.includes(skin.id);

    if(preview){
      for(const def of skinDefs) preview.classList.remove('skin-' + def.id);
      preview.classList.add('skin-' + skin.id);
    }
    if(summary){
      summary.textContent = owned
        ? `${skin.name} is ${state.skins.equipped === skin.id ? 'equipped' : 'owned'}.`
        : `${skin.name} is locked. ${skin.unlock}.`;
    }
    if(equip){
      equip.disabled = !owned;
      equip.textContent = state.skins.equipped === skin.id ? 'Equipped' : 'Equip';
    }
  }
  function renderGrid(){
    const grid = qs('#skin-grid');
    if(!grid) return;
    grid.innerHTML = '';
    for(const skin of skinDefs){
      const owned = state.skins.owned.includes(skin.id);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `skin-card${owned ? '' : ' locked'}${selectedSkin === skin.id ? ' selected' : ''}`;
      card.innerHTML = `<div class="skin-swatch giant skin-${skin.id}"></div><strong>${skin.name}</strong><span>${owned ? (state.skins.equipped === skin.id ? 'Equipped' : 'Owned') : skin.unlock}</span>`;
      card.addEventListener('click', () => {
        selectedSkin = skin.id;
        renderGrid();
        applyPreview();
      });
      grid.appendChild(card);
    }
  }
  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(error){}
  }
  async function syncServerSkins(){
    if(!window.buttonApiFetch) return;
    const gamerTag = state.gamerTag || 'Traveler';
    try{
      const response = await window.buttonApiFetch(`/api/achievements?name=${encodeURIComponent(gamerTag)}`);
      if(!response.ok) return;
      const data = await response.json();
      for(const skin of data.skins || []){
        if(!state.skins.owned.includes(skin)) state.skins.owned.push(skin);
      }
      save();
      renderGrid();
      applyPreview();
    }catch(error){}
  }

  state = loadState();
  selectedSkin = state.skins.equipped || 'classic';
  renderGrid();
  applyPreview();
  syncServerSkins();

  const equip = qs('#equip-selected-skin');
  if(equip){
    equip.addEventListener('click', () => {
      if(!state.skins.owned.includes(selectedSkin)) return;
      state.skins.equipped = selectedSkin;
      save();
      renderGrid();
      applyPreview();
    });
  }

  if(window.setupVersionEgg) window.setupVersionEgg();
})();
