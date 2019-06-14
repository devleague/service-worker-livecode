const CACHE_NAME = 'service-worker-demo-cache-v1';
const cacheWhitelist = [CACHE_NAME];
const urlsToCache = [
  '/',
  '/runtime-caching.html',
  '/background-sync.html',
  '/messaging.html',
  '/push-notification.html',
  '/js/index.js',
  '/js/runtime-caching.js',
  '/js/background-sync.js',
  '/js/messaging.js',
  '/js/push-notification.js',
  '/css/styles.css',
];

// https://developers.google.com/web/fundamentals/primers/service-workers/
// Fetches made from the service worker do not go into the cache

// Perform Service Worker installation
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');

  // caches is a global object within service worker files that stores all your cached files
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Opened Cache');
      // Pre-cache all files from the array above
      return cache.addAll(urlsToCache);
    }),
  );
});

// Cache Management on SW update.
// In this particular example we want to wipe out any caches
// we aren't using anymore and only use the caches in our cacheWhitelist above
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] V1 now ready to handle fetches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

// Runtime Cache Management
self.addEventListener('fetch', (event) => {
  const { url } = event.request;

  // Network First Strategy (for api data)
  if (url.includes('/api/')) {
    return event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Don't cache errors from the server
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.
          var responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((err) => {
          const cacheKey = event.request;
          return caches.match(cacheKey).then((response) => {
            // Cache hit - return response
            if (response) {
              return response;
            }

            return Promise.reject(err);
          });
        }),
    );
  }

  // Cache First Strategy (for static files)
  return event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        var responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }),
  );

  // Cache Only
  // Cache First strategy for flat files
  // Network First stratery for api endpoints
  // -- Show offline cache usage with network first
  // Network Only
});

// Background Sync
// Needed to unregister existing service worker to get this to work
// https://developers.google.com/web/updates/2015/12/background-sync
// https://davidwalsh.name/background-sync
self.addEventListener('sync', (event) => {
  if (event.tag == 'syncData') {
    event.waitUntil(syncData());
  }
});

function syncData() {
  let db;

  return (
    new Promise((resolve) => {
      const dbRequest = indexedDB.open('bgSync', 1);

      // on db upgrade (needed to structure the idb "table")
      dbRequest.onupgradeneeded = (event) => {
        // the idb Database
        const idb = event.target.result;

        // create a new objectStore called bgSyncStore (like a table)
        if (!idb.objectStoreNames.contains('bgSyncStore')) {
          idb.createObjectStore('bgSyncStore');
        }
      };

      // on successfully opening a db connection
      // this will fire after onupgradeneeded
      dbRequest.onsuccess = (event) => {
        return resolve(event.target.result);
      };

      dbRequest.onerror = (event) => {
        return reject(event.target.errorCode);
      };
    })
      // store idb in the outer context
      .then((idb) => {
        db = idb;
      })
      // get all waiting background sync requests
      .then(() => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction('bgSyncStore', 'readonly');
          const store = tx.objectStore('bgSyncStore');
          const request = store.getAll();

          request.onsuccess = (event) => {
            return resolve(event.target.result);
          };

          request.onerror = (event) => {
            return reject(event.target.errorCode);
          };
        });
      })
      // fire off all the requests
      .then((httpRequests) => {
        console.log('[Service Worker] Retrieved Data from IDB: ', httpRequests);
        console.log('[Service Worker] Sending POST Request to server');

        return Promise.all(
          httpRequests.map((request) => {
            return fetch(request.url, {
              method: request.method,
              headers: request.headers,
              body: request.body,
            }).then((response) => {
              if (response.status !== 200) {
                // WARNING: Inform user that this request did not go through.
                // handle this appropriate based on your application and the data
                // you were trying to send. This will require a lot of careful consideration
              }
            });
          }),
        ).then(() => {
          return httpRequests;
        });
      })
      // delete the requests
      .then((requests) => {
        return Promise.all(
          requests.map((request) => {
            return new Promise((resolve, reject) => {
              const tx = db.transaction('bgSyncStore', 'readwrite');
              const store = tx.objectStore('bgSyncStore');
              const deleteRequest = store.delete(request.key);

              deleteRequest.onsuccess = (event) => {
                return resolve(event.target.result);
              };

              deleteRequest.onerror = (event) => {
                return reject(event.target.errorCode);
              };
            });
          }),
        );
      })
      .then(() => {
        console.log('[Service Worker] Background Sync Successful');
      })
  );
}

// Push Notification
// https://developers.google.com/web/fundamentals/codelabs/push-notifications/
// https://developers.google.com/web/ilt/pwa/introduction-to-push-notifications

// handle incoming push messages from a push server
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = 'Push Codelab';
  const options = { body: event.data.text() };

  if (Notification.permission === 'granted') {
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Messaging
// Listen to incoming messages from the client pages.
// This technique can be used in both directions.
// http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Received Message: ' + event.data);
  event.ports[0].postMessage(`[Service Worker] Heard ${event.data}`);
  if (Notification.permission === 'granted') {
    self.registration.showNotification('Message from client page:', { body: event.data, data: { from: 'messaging' } });
  }
});

// Notifications
// Need to ask for permission in the main app.js
// Then use the registration's showNotification to show a notification
// based on some event
// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
if (Notification.permission == 'granted') {
  // self.registration.showNotification('Hello world!');
}

// handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  console.log('[Service Worker] event data:', event.notification.data);

  event.notification.close();
});

// Advanced Tools:
// Workbox - https://developers.google.com/web/tools/workbox/
// idb - https://github.com/jakearchibald/idb
