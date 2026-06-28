(function(){
  /*
    EDIT UPDATES HERE.
    Put the newest update first. Keep tldr short so it stays glanceable.
  */
  const UPDATES = [
    {
      version:'2.17.2',
      date:'June 28, 2026',
      tldr:'Added this update page so players can quickly see what changed.',
      changes:[
        'New Updates page with a TL;DR at the top.',
        'Update history is easy to edit in updates.js.',
        'Added Updates to the main menu.'
      ]
    },
    {
      version:'2.17.1',
      date:'June 28, 2026',
      tldr:'Founder Signal secret tap feels more like a real hidden button.',
      changes:[
        'Founder Signal text can no longer be selected by accident.',
        'Added button-style tap and keyboard behavior.'
      ]
    },
    {
      version:'2.17.0',
      date:'June 28, 2026',
      tldr:'Added a secret credits page behind the Easter egg.',
      changes:[
        'Tap Founder Signal unlocked 20 times to open credits.',
        'Credits list is easy to edit in credits.js.'
      ]
    },
    {
      version:'2.16.9',
      date:'June 28, 2026',
      tldr:'Added push notifications before major global events go live.',
      changes:[
        'Alerts send at 5,000, 1,000, 500, and 100 presses before each event.',
        'Each countdown alert only sends once per event.'
      ]
    }
  ];

  const qs = selector => document.querySelector(selector);

  function setText(selector, value){
    const el = qs(selector);
    if(el) el.textContent = value;
  }

  function render(){
    const latest = UPDATES[0];
    if(latest){
      setText('#current-update-version', `v${latest.version}`);
      setText('#current-update-tldr', latest.tldr);
    }

    const list = qs('#updates-list');
    if(!list) return;
    list.replaceChildren(...UPDATES.map(update => {
      const article = document.createElement('article');
      article.className = 'glass update-card';
      article.innerHTML = `
        <div class="update-card-head">
          <div>
            <p class="eyebrow">${update.date}</p>
            <h2>v${update.version}</h2>
          </div>
          <strong>TL;DR</strong>
        </div>
        <p class="update-card-tldr">${update.tldr}</p>
        <ul>${update.changes.map(change => `<li>${change}</li>`).join('')}</ul>
      `;
      return article;
    }));
  }

  if(window.setupVersionEgg) window.setupVersionEgg();
  render();
})();
