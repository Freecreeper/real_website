(function(){
  /*
    EDIT CREDITS HERE.
    Add, remove, or rename people in this list. Example:
    {name:'Ezra', role:'First 10,000 world first', note:'Pressed when it counted.'}
  */
  const CREDITS = [
    {name:'Zane', role:'Creator and designer', note:'Built the button, the chaos, and the secret rooms.'},
    {name:'Ezra', role:'special thanks', note:'For all the support and encouragement, and for believing in this silly button project.'},
    {name:'The Button People', role:'Players', note:'Every press helped shape this world.'},
    {name: 'Ashley and posie', role: 'supporters and ideas', note: 'for their creative input and enthusiasm.'},
    {name: 'Nolan', role: 'Beta tester', note: 'for breaking things so i can fix them.'},
    {name: 'mum and dad', role: 'Moral Support', note: 'for listening to every idea, update, and crazy plan behind this project.'}
  ];

  const list = document.querySelector('#credits-list');

  function renderCredits(){
    if(!list) return;
    list.replaceChildren(...CREDITS.map(person => {
      const card = document.createElement('article');
      card.className = 'glass credits-card';
      card.innerHTML = `
        <p class="eyebrow">${person.role}</p>
        <h2>${person.name}</h2>
        <p class="muted">${person.note}</p>
      `;
      return card;
    }));
  }

  if(window.setupVersionEgg) window.setupVersionEgg();
  renderCredits();
})();
