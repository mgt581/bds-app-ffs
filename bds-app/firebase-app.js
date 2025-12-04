// firebase-app.js
// Central Firebase config for AI Photo Studio (aiphotostudioapp)

const firebaseConfig = {
  apiKey: "AIzaSyDsBDuaZ_rl7ro63Fv5gPh37EwSkfh-NqM",
  authDomain: "aiphotostudioapp.firebaseapp.com",
  projectId: "aiphotostudioapp",
  storageBucket: "aiphotostudioapp.appspot.com",
};

// Initialize Firebase (Compat required for your gallery + auth code)
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
