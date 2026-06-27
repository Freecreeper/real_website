(function(){
  const STORAGE_KEY = 'thebutton:v1';
  const qs = selector => document.querySelector(selector);

  function loadState(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch(error){ return {}; }
  }

  function saveState(state){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(error){}
  }

  function setText(id, value){
    const el = qs('#' + id);
    if(el) el.textContent = value;
  }

  function isIosDevice(){
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isStandaloneApp(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function pushSupported(){
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  function urlBase64ToUint8Array(base64String){
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for(let i=0;i<rawData.length;i++) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  function setPushStatus(label, tone='neutral', summary=''){
    const pill = qs('#push-status-pill');
    if(pill){
      pill.textContent = label;
      pill.className = `settings-pill ${tone}`;
    }
    if(summary) setText('push-summary', summary);
  }

  async function currentSubscription(){
    if(!pushSupported()) return null;
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
      || await navigator.serviceWorker.getRegistration('/');
    if(!registration) return null;
    return registration.pushManager.getSubscription();
  }

  async function refreshPushStatus(){
    const iosNote = qs('#ios-push-note');
    if(iosNote) iosNote.classList.toggle('hidden', !(isIosDevice() && !isStandaloneApp()));

    if(!pushSupported()){
      setPushStatus('Unsupported', 'bad', 'This browser does not support Web Push notifications.');
      return;
    }
    if(isIosDevice() && !isStandaloneApp()){
      setPushStatus('Home Screen Needed', 'warn', 'Add the site to your Home Screen, then open it from that icon.');
      return;
    }
    if(!window.isSecureContext){
      setPushStatus('HTTPS Needed', 'bad', 'Notifications require https://pressthebutton.click.');
      return;
    }
    try{
      const configRes = await window.buttonApiFetch('/api/push/config');
      if(configRes.status === 404){
        setPushStatus('Update Needed', 'bad', 'The server does not have push routes yet. Deploy this code and restart Flask.');
        return;
      }
      const config = configRes.ok ? await configRes.json() : {};
      if(!config.enabled){
        setPushStatus('Server Off', 'warn', 'Push routes exist, but VAPID keys are not configured on the server yet.');
        return;
      }
    }catch(error){
      setPushStatus('API Offline', 'bad', 'Could not reach the Flask API.');
      return;
    }
    if(Notification.permission === 'denied'){
      setPushStatus('Blocked', 'bad', 'Notifications are blocked in browser settings.');
      return;
    }

    const subscription = await currentSubscription();
    if(subscription){
      setPushStatus('Enabled', 'good', 'Chaos Mode notifications are enabled on this device.');
    }else if(Notification.permission === 'granted'){
      setPushStatus('Allowed', 'warn', 'Permission is allowed, but this device is not subscribed yet.');
    }else{
      setPushStatus('Off', 'neutral', 'Enable notifications to receive rare Button alerts when the site is closed.');
    }
  }

  async function enablePush(){
    setPushStatus('Working', 'warn', 'Setting up notifications...');
    if(!pushSupported()){
      setPushStatus('Unsupported', 'bad', 'This browser does not support Web Push notifications.');
      return null;
    }
    if(isIosDevice() && !isStandaloneApp()){
      setPushStatus('Home Screen Needed', 'warn', 'On iPhone, add this site to your Home Screen first.');
      return null;
    }
    if(!window.isSecureContext){
      setPushStatus('HTTPS Needed', 'bad', 'Notifications require HTTPS.');
      return null;
    }

    const configRes = await window.buttonApiFetch('/api/push/config');
    if(configRes.status === 404){
      setPushStatus('Update Needed', 'bad', 'The server does not have push routes yet. Deploy this code and restart Flask.');
      return null;
    }
    const config = configRes.ok ? await configRes.json() : {};
    if(!config.enabled || !config.public_key){
      setPushStatus('Server Off', 'bad', 'Push is not configured on the server yet.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if(permission !== 'granted'){
      setPushStatus('Not Allowed', 'bad', 'Notifications were not allowed.');
      return null;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    const existing = await registration.pushManager.getSubscription();
    if(existing) await existing.unsubscribe();
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly:true,
      applicationServerKey:urlBase64ToUint8Array(config.public_key)
    });

    const state = loadState();
    const saveRes = await window.buttonApiFetch('/api/push/subscribe', {
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        name:state.gamerTag || 'Traveler',
        chaos_enabled:true,
        subscription:subscription.toJSON()
      })
    });
    if(!saveRes.ok){
      setPushStatus('Save Failed', 'bad', 'The browser subscribed, but the server did not save it.');
      return null;
    }

    state.humor = true;
    saveState(state);
    setPushStatus('Enabled', 'good', 'Chaos Mode notifications are enabled on this device.');
    return subscription;
  }

  async function testPush(){
    let subscription = await currentSubscription();
    if(!subscription) subscription = await enablePush();
    if(!subscription) return;

    const res = await window.buttonApiFetch('/api/push/test', {
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({subscription:subscription.toJSON()})
    });
    setPushStatus(
      res.ok ? 'Test Sent' : 'Test Failed',
      res.ok ? 'good' : 'bad',
      res.ok ? 'A test notification was sent.' : 'The server could not send a test notification.'
    );
  }

  async function disablePush(){
    const subscription = await currentSubscription();
    if(subscription){
      await window.buttonApiFetch('/api/push/unsubscribe', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({endpoint:subscription.endpoint})
      }).catch(()=>{});
      await subscription.unsubscribe();
    }
    const state = loadState();
    state.humor = false;
    saveState(state);
    setPushStatus('Off', 'neutral', 'Notifications are disabled on this device.');
  }

  function renderLocalSettings(){
    const state = loadState();
    setText('settings-name', state.gamerTag || 'Traveler');
    setText('settings-presses', Number(state.presses || 0).toLocaleString());
    setText('settings-skin', (state.skins && state.skins.equipped) ? state.skins.equipped : 'classic');
    const reduce = qs('#reduce-effects');
    const hide = qs('#hide-chaos-prompts');
    if(reduce) reduce.checked = localStorage.getItem('thebutton:reduce-effects') === '1';
    if(hide) hide.checked = localStorage.getItem('thebutton:chaos-prompt-seen') === '1';
  }

  qs('#enable-push')?.addEventListener('click', () => enablePush().catch(error => setPushStatus('Error', 'bad', error.message)));
  qs('#test-push')?.addEventListener('click', () => testPush().catch(error => setPushStatus('Error', 'bad', error.message)));
  qs('#disable-push')?.addEventListener('click', () => disablePush().catch(error => setPushStatus('Error', 'bad', error.message)));
  qs('#show-chaos-prompt')?.addEventListener('click', () => {
    localStorage.removeItem('thebutton:chaos-prompt-seen');
    setText('push-summary', 'The Chaos Mode prompt will show after onboarding next time.');
  });
  qs('#reset-onboarding')?.addEventListener('click', () => {
    const state = loadState();
    state.gamerTag = 'Traveler';
    saveState(state);
    localStorage.removeItem('thebutton:chaos-prompt-seen');
    renderLocalSettings();
    setText('push-summary', 'This device will ask New or Returning next time you open the button.');
  });
  qs('#reduce-effects')?.addEventListener('change', event => {
    localStorage.setItem('thebutton:reduce-effects', event.target.checked ? '1' : '0');
  });
  qs('#hide-chaos-prompts')?.addEventListener('change', event => {
    if(event.target.checked) localStorage.setItem('thebutton:chaos-prompt-seen', '1');
    else localStorage.removeItem('thebutton:chaos-prompt-seen');
  });

  renderLocalSettings();
  refreshPushStatus().catch(() => setPushStatus('Unknown', 'warn', 'Could not check notification state.'));
  if(window.setupVersionEgg) window.setupVersionEgg();
})();
