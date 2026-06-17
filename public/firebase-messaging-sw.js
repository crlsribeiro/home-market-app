importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAlcIVw0u-IaPDil1WF1t6inXnE3zrj0kU",
  authDomain: "home-market-3d9da.firebaseapp.com",
  projectId: "home-market-3d9da",
  storageBucket: "home-market-3d9da.firebasestorage.app",
  messagingSenderId: "121839046609",
  appId: "1:121839046609:web:60cd8cd464fbc9b17d1af0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icon.svg',
  });
});
