'use strict';

// Installing and registering service worker
// The register method can be called multiple times with no issues
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // a service worker at domain root can fetch all requests coming from that domain
    navigator.serviceWorker.register('/sw.js').then(
      function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        registered.classList.remove('hidden');
      },
      function(err) {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      },
    );
  });
}

// Background Sync

let counter = 1;
const bgSyncButton = document.getElementById('bg-sync');

bgSyncButton.addEventListener('click', (e) => {
  e.preventDefault();

  // get value from input field
  const { value } = document.getElementById('bg-input');

  // open a connection to the indexedDB Database called bgSync
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
      dbRequest.onsuccess = (event) => {
        return resolve(event.target.result);
      };

      dbRequest.onerror = (event) => {
        return reject(event.target.errorCode);
      };
    })
      // insert value into idb
      .then((db) => {
        return new Promise((resolve, reject) => {
          const key = 'bg-input-key' + counter++;
          const tx = db.transaction('bgSyncStore', 'readwrite');
          const store = tx.objectStore('bgSyncStore');

          const httpRequest = {
            key,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            url: '/api/newData',
            body: JSON.stringify({ data: value }),
          };
          const request = store.add(httpRequest, key);

          request.onsuccess = () => {
            return resolve(db);
          };

          request.onerror = (event) => {
            return reject(event.target.errorCode);
          };
        });
      })
      // Optional: check if value exists in idb
      .then((db) => {
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
      .then((contents) => {
        console.log(`Inserted value ${contents[0].body} into IndexedDB`);
      })
      // send event to service worker to trigger a background sync
      .then(() => {
        return navigator.serviceWorker.ready.then((reg) => {
          return reg.sync.register('syncData');
        });
      })
      .catch(console.log)
  );
});
