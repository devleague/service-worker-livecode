'use strict';

const registered = document.getElementById('registered');
const runtime = document.getElementById('runtime-cache');
const fetched = document.getElementById('fetched');

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

// Testing JSON data fetch against service worker's cache
setTimeout(() => {
  fetch('/api/data')
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      runtime.classList.remove('hidden');
      fetched.innerHTML = JSON.stringify(data);
    })
    .catch((err) => {
      console.log('failed to fetch');
    });
}, 1000);
