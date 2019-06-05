'use strict';

const registered = document.getElementById('registered');

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
