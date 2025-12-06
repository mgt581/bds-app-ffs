// FIREBASE SETUP
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    signInAnonymously,
    GoogleAuthProvider,
    signInWithPopup
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
const auth = getAuth(app);


// EMAIL LOGIN
window.emailLogin = function () {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) return alert("Enter email and password");

    signInWithEmailAndPassword(auth, email, password)
        .then(() => window.location.href = "/index.html")
        .catch(err => alert(err.message));
};


// GOOGLE LOGIN
window.googleLogin = function () {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then(() => window.location.href = "/index.html")
        .catch(err => alert(err.message));
};


// GUEST LOGIN (ANONYMOUS)
window.guestLogin = function () {
    signInAnonymously(auth)
        .then(() => window.location.href = "/index.html")
        .catch(err => alert(err.message));
};
