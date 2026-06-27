self.addEventListener('push', event => {
  let payload = {
    title: 'The Button',
    body: 'Something happened.',
    url: '/',
    tag: 'the-button-chaos'
  };

  if(event.data){
    try{
      payload = Object.assign(payload, event.data.json());
    }catch(error){
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'The Button', {
      body: payload.body || 'Something happened.',
      tag: payload.tag || 'the-button-chaos',
      icon: payload.icon || '/icon-192.svg',
      badge: payload.badge || '/icon-192.svg',
      data: {url: payload.url || '/'},
      requireInteraction: Boolean(payload.requireInteraction)
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(clientList => {
      for(const client of clientList){
        if('focus' in client) return client.focus();
      }
      if(clients.openWindow) return clients.openWindow(url);
      return null;
    })
  );
});
