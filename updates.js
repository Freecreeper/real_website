(function(){
  /*
    EDIT UPDATES HERE.
    Put the newest update first. Keep tldr short so it stays glanceable.
    "details" is what players see after they click into an update.
  */
  const UPDATES = [
    {
      version:'2.17.3',
      date:'June 28, 2026',
      tldr:'Updates are easier to read now, with click-to-open full rundowns.',
      highlights:[
        'Cleaner player-facing update notes.',
        'Tap any update to read the full details.'
      ],
      details:[
        'The Updates page now starts with a quick summary for people who just want the important stuff.',
        'Each update can be opened to show a bigger rundown of what changed and why it matters.',
        'Update notes are written for players instead of talking about code files or behind-the-scenes work.'
      ]
    },
    {
      version:'2.17.2',
      date:'June 28, 2026',
      tldr:'Added a new Updates page so you can quickly see what changed.',
      highlights:[
        'New Updates button in the menu.',
        'Latest version summary at the top.',
        'Older updates listed underneath.'
      ],
      details:[
        'There is now a dedicated Updates page for quick patch notes.',
        'The top card shows the newest version and a short TL;DR so you can understand the update at a glance.',
        'The update history underneath keeps recent changes in one place instead of making people guess what is new.'
      ]
    },
    {
      version:'2.17.1',
      date:'June 28, 2026',
      tldr:'Founder Signal secret tap feels more like a real hidden button.',
      highlights:[
        'Founder Signal no longer highlights like normal text.',
        'The secret credits path is smoother to tap.'
      ],
      details:[
        'The Founder Signal badge on the Easter egg page now behaves more like a real hidden button.',
        'Clicking or tapping it should count toward the secret credits unlock instead of selecting the words on the page.',
        'Keyboard users can also trigger it with Enter or Space.'
      ]
    },
    {
      version:'2.17.0',
      date:'June 28, 2026',
      tldr:'Added a secret credits page behind the Easter egg.',
      highlights:[
        'New hidden credits page.',
        'Founder Signal unlock now has a second secret.'
      ],
      details:[
        'After unlocking the Founder Signal on the Easter egg page, tapping it 20 times opens a secret credits page.',
        'The page is meant to be a thank-you wall for people who helped shape The Button.',
        'It is intentionally hidden so finding it feels like another little secret inside the game.'
      ]
    },
    {
      version:'2.16.9',
      date:'June 28, 2026',
      tldr:'Added push notifications before major global events go live.',
      highlights:[
        'Countdown alerts before big global events.',
        'Notifications at 5,000, 1,000, 500, and 100 presses away.'
      ],
      details:[
        'When the community gets close to a major global milestone, subscribed players can get a countdown notification.',
        'The alerts fire at 5,000, 1,000, 500, and 100 presses before the event starts.',
        'This makes it easier to show up for moments like Meteor Impact, The Great Divide, Alien Contact, and the huge future milestones.'
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
    list.replaceChildren(...UPDATES.map((update, index) => {
      const article = document.createElement('article');
      article.className = 'glass update-card';
      const detailsId = `update-details-${index}`;
      article.innerHTML = `
        <button class="update-card-button" type="button" aria-expanded="false" aria-controls="${detailsId}">
          <span>
            <span class="eyebrow">${update.date}</span>
            <strong>v${update.version}</strong>
            <span class="update-card-tldr">${update.tldr}</span>
          </span>
          <span class="update-open-label">Open</span>
        </button>
        <div id="${detailsId}" class="update-details" hidden>
          <div class="update-detail-grid">
            <div>
              <h3>Highlights</h3>
              <ul>${update.highlights.map(change => `<li>${change}</li>`).join('')}</ul>
            </div>
            <div>
              <h3>Full Rundown</h3>
              <ul>${update.details.map(detail => `<li>${detail}</li>`).join('')}</ul>
            </div>
          </div>
        </div>
      `;
      const button = article.querySelector('.update-card-button');
      const details = article.querySelector('.update-details');
      const label = article.querySelector('.update-open-label');
      button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!open));
        details.hidden = open;
        label.textContent = open ? 'Open' : 'Close';
        article.classList.toggle('open', !open);
      });
      return article;
    }));
  }

  if(window.setupVersionEgg) window.setupVersionEgg();
  render();
})();
