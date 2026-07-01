(function(){
  /*
    EDIT UPDATES HERE.
    Put the newest update first. Keep tldr short so it stays glanceable.
    "details" is what players see after they click into an update.
  */
  const UPDATES = [
    {
      version:'2.17.10',
      date:'July 1, 2026',
      tldr:'The 67 prank now fires once per 67 streak instead of every press.',
      highlights:[
        '6700 triggers the 67 prank once, but 6701 through 6799 no longer spam it.',
        'The popup now includes the hands emoji.'
      ],
      details:[
        'The 67 prank now compares the previous press count to the new press count.',
        'If the new number contains 67 and the previous number did not, the prank fires.',
        'This keeps numbers like 67, 167, 1670, and 6700 special without creating 100 repeated popups in the 6700 range.'
      ]
    },
    {
      version:'2.17.9',
      date:'June 30, 2026',
      tldr:'A new 67 prank triggers when your press count contains 67.',
      highlights:[
        'Counts like 67, 167, 1670, and 6700 now trigger a special prank.',
        'The prank is deterministic, not random.'
      ],
      details:[
        'Whenever your press count includes the digits 67, the site activates Protocol 67.',
        'This runs from the actual button press count, so it can happen at numbers like 67, 167, 267, 1670, 6700, and any other count containing 67.',
        'The prank is separate from the normal random prank pool so the number itself is what triggers it.'
      ]
    },
    {
      version:'2.17.8',
      date:'June 29, 2026',
      tldr:'Alien Contact now fully activates at 100,000 global presses.',
      highlights:[
        'Alien Contact runs for one week after 100,000 presses.',
        'The page glitches, UFOs fly across, and the button floats.',
        'Players can earn the Alien Contact Badge and Alien Button skin.'
      ],
      details:[
        'When the community reaches 100,000 global presses, Alien Contact becomes an active global event for 7 days.',
        'During the event the page gets hacked-style visuals, scan effects, UFO flybys, floating button motion, strange messages, and short alien chirps after pressing.',
        'Anyone who presses during the event gets the Alien Contact Badge.',
        'Every press during the event also has a chance to unlock the Alien Button skin.'
      ]
    },
    {
      version:'2.17.7',
      date:'June 28, 2026',
      tldr:'Friend Button got a much better look.',
      highlights:[
        'Friend Button now has a real friendship design.',
        'The skin has connected friends, invite dots, and a brighter glow.'
      ],
      details:[
        'The referral reward skin was redesigned so it feels special instead of looking like a basic gradient.',
        'The new Friend Button has three friend shapes connected together, with small invite lights around the edge.',
        'This makes the 3-referral reward feel more like something players would actually want to use.'
      ]
    },
    {
      version:'2.17.6',
      date:'June 28, 2026',
      tldr:'Referral links now reward players for inviting friends.',
      highlights:[
        'Every player gets an invite link on their Profile page.',
        'A referral counts after the invited friend reaches 25 presses.',
        'New referral achievements and the Friend Button skin are available.'
      ],
      details:[
        'Players can share their personal invite link from the Profile page.',
        'To keep it fair, an invite only counts when the new player reaches 25 presses.',
        'Referral rewards are Button Recruiter at 1 real referral, Friend Button at 3 real referrals, and Button Ambassador at 5 real referrals.',
        'Referral progress is tracked on the server so rewards cannot be unlocked just by editing browser storage.'
      ]
    },
    {
      version:'2.17.5',
      date:'June 28, 2026',
      tldr:'The Great Divide is now a real 14-day season.',
      highlights:[
        'Great Divide runs for 14 days after it starts.',
        'Team rewards now happen when the season ends.',
        'MVP titles are awarded to the top Red and Blue players.'
      ],
      details:[
        'The Great Divide no longer lasts forever. Once the community reaches 50,000 global presses, the season runs for 14 days.',
        'Presses only count toward Red or Blue while the season is active.',
        'When the season ends, the winning team receives its champion skin. If the season ends in a tie, no champion skin is awarded.',
        'The top Red player and top Blue player receive their MVP titles when the season closes.'
      ]
    },
    {
      version:'2.17.4',
      date:'June 28, 2026',
      tldr:'Fixed the secret Founder Signal credits tap.',
      highlights:[
        'Founder Signal taps now register more reliably.',
        'The secret stays unlocked after you come back to the page.'
      ],
      details:[
        'The Founder Signal credits shortcut no longer depends on tapping 20 times inside a tiny hidden time window.',
        'Mobile taps now use a more reliable tap handler, so tapping the badge should count instead of doing nothing.',
        'If you already unlocked the Founder Signal before, the Easter egg page remembers it and keeps the secret badge active.'
      ]
    },
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
