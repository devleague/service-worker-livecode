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

// Notification Permission Request
Notification.requestPermission(function(status) {
  console.log('Notification permission status:', status);
});

// Messages
// Send message to service worker
const msgInput = document.getElementById('msg-input');
const msgButton = document.getElementById('msg-button');
const msgResponse = document.getElementById('msg-response');

msgButton.addEventListener('click', (event) => {
  const { value } = msgInput;

  send_message_to_sw(value).then((response) => {
    msgResponse.innerHTML = response;
  });
});

function send_message_to_sw(msg) {
  return new Promise(function(resolve, reject) {
    // Create a Message Channel
    var msg_chan = new MessageChannel();

    // Handler for recieving message reply from service worker
    msg_chan.port1.onmessage = function(event) {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };

    // Send message to service worker along with port for reply
    navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
  });
}
