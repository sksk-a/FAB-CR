const CACHE_NAME = 'notes-cache-v17';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v17';

const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/manifest.json',
    '/icons/favicon-32x32.png',
    '/icons/favicon-512x512.png',
    'https://unpkg.com/chota@latest'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
                .map(key => caches.delete(key))
        ))
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/content/')) {
        event.respondWith(
            fetch(event.request)
                .then(res => {
                    return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                        cache.put(event.request, res.clone());
                        return res;
                    });
                })
                .catch(() => caches.match(event.request) || caches.match('/content/home.html'))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then(res => res || fetch(event.request))
        );
    }
});

self.addEventListener('push', (event) => {
    let data = { title: 'Напоминание', body: '', reminderId: null };
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/icons/favicon-32x32.png',
        badge: '/icons/favicon-32x32.png',
        data: { reminderId: data.reminderId },
        vibrate: [200, 100, 200],
        actions: []
    };

    if (data.reminderId) {
        options.actions.push({
            action: 'snooze',
            title: '⏰ Отложить на 5 минут'
        });
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;

    if (action === 'snooze') {
        const reminderId = notification.data.reminderId;
        event.waitUntil(
            fetch(`/snooze?reminderId=${reminderId}`, { method: 'POST' })
                .then(() => notification.close())
        );
    } else {
        notification.close();
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(windowClients => {
                for (let client of windowClients) {
                    if (client.url === '/' && 'focus' in client) return client.focus();
                }
                if (clients.openWindow) return clients.openWindow('/');
            })
        );
    }
});