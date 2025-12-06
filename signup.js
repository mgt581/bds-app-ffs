// FIREBASE SETUP
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signInAnonymously
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


// EMAIL + PASSWORD SIGNUP
window.emailSignup = function () {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();
    const confirm = document.getElementById("confirm").value.trim();

    if (!email || !pass || !confirm) 
        return alert("Fill in all fields");

    if (pass !== confirm)
        return alert("Passwords do not match");

    createUserWithEmailAndPassword(auth, email, pass)
        .then(() => window.location.href = "/index.html")
        .catch(err => alert(err.message));
};


// GOOGLE SIGNUP
window.googleSignup = function () {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then(() => window.location.href = "/index.html")
        .catch(err => alert(err.message));
};


// GUEST SIGNUP (ANONYMOUS)
window.guestSignup = function () {
    signInAnonymously(auth)
        .then(() => window.location.href = "/index.html")
        .catch(err => alert(err.message));
};
