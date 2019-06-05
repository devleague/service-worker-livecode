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

// Push Notification

let isSubscribed = false;
const applicationServerPublicKey =
  'BK70L0dYWTJDzLDRWsUGhiayCA30kxP-ODVL-TNQrZFkRVzmHGYrDEo1H0WcvW-DrSL6PW1CLJEu5rBQMcTzxT4';

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function initializeUI() {
  pushButton.addEventListener('click', function() {
    pushButton.disabled = true;
    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  });

  // Set the initial subscription value
  return navigator.serviceWorker.ready.then((reg) => {
    reg.pushManager.getSubscription().then(function(subscription) {
      console.log('Push Notification Subscription: ', subscription);
      isSubscribed = !(subscription === null);

      if (isSubscribed) {
        console.log('User IS subscribed.');
      } else {
        console.log('User is NOT subscribed.');
      }

      updateBtn();
    });
  });
}

function updateBtn() {
  if (Notification.permission === 'denied') {
    pushButton.textContent = 'Push Messaging Blocked.';
    pushButton.disabled = true;
    updateSubscriptionOnServer(null);
    return;
  }

  if (isSubscribed) {
    pushButton.textContent = 'Disable Push Messaging';
  } else {
    pushButton.textContent = 'Enable Push Messaging';
  }

  pushButton.disabled = false;
}

function subscribeUser() {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);

  return navigator.serviceWorker.ready.then((reg) => {
    reg.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      })
      .then(function(subscription) {
        console.log('User is subscribed.');

        updateSubscriptionOnServer(subscription);

        isSubscribed = true;

        updateBtn();
      })
      .catch(function(err) {
        console.log('Failed to subscribe the user: ', err);
        updateBtn();
      });
  });
}

function updateSubscriptionOnServer(subscription) {
  const subscriptionJson = document.querySelector('.js-subscription-json');
  const subscriptionDetails = document.querySelector('.js-subscription-details');

  // In production:
  // this subscription should be sent back to the server so that it can be used
  // to send messages to this specific browser. Rather than displaying the
  // contents of the subscription on the html page.
  if (subscription) {
    subscriptionJson.textContent = JSON.stringify(subscription);
    subscriptionDetails.classList.remove('is-invisible');
  } else {
    subscriptionDetails.classList.add('is-invisible');
  }
}

function unsubscribeUser() {
  return navigator.serviceWorker.ready.then((reg) => {
    reg.pushManager
      .getSubscription()
      .then(function(subscription) {
        if (subscription) {
          return subscription.unsubscribe();
        }
      })
      .catch(function(error) {
        console.log('Error unsubscribing', error);
      })
      .then(function() {
        updateSubscriptionOnServer(null);

        console.log('User is unsubscribed.');
        isSubscribed = false;

        updateBtn();
      });
  });
}

initializeUI();
