// Firebase Auth Setup

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCM6r66kW9xkBA5rgVcz4sP57N2v2BMbkg",
  authDomain: "ai-photo-studio-24354.firebaseapp.com",
  projectId: "ai-photo-studio-24354",
  storageBucket: "ai-photo-studio-24354.firebasestorage.app",
  messagingSenderId: "411346648650",
  appId: "1:411346648650:web:aefd1b26027ed5e8fab0b3",
  measurementId: "G-8TXC63YKPD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Export helpers
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
