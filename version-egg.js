(function(){
  const TAP_LIMIT = 20;
  const WINDOW_MS = 7000;

  window.setupVersionEgg = function setupVersionEgg(options){
    const toast = options && options.toast;
    const el = document.getElementById('version-display');
    if(!el || el.dataset.eggReady === '1') return;
    el.dataset.eggReady = '1';

    let taps = [];
    let versionInfo = null;

    fetch('version.json?T=' + Date.now())
      .then(response => response.json())
      .then(version => {
        versionInfo = version;
        const buildNumber = String(version.build || 'unknown').split('-').pop();
        el.textContent = `v${version.version || '0.0.0'} b${buildNumber}`;
        el.title = 'Tap the build number.';
      })
      .catch(() => {});

    el.addEventListener('click', () => {
      const now = Date.now();
      taps = taps.filter(time => now - time <= WINDOW_MS);
      taps.push(now);

      if(taps.length >= TAP_LIMIT){
        window.location.href = 'easter-egg.html';
        return;
      }

      if(toast && versionInfo && taps.length === 1){
        toast(`Version ${versionInfo.version || '0.0.0'} - build ${versionInfo.build || 'unknown'}`);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.setupVersionEgg();
  });
})();
