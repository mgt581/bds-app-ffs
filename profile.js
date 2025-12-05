/* FIREBASE AUTH */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
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

/* UI Elements */
const emailLabel = document.getElementById("userEmail");
const planStatus = document.getElementById("planStatus");
const planDetails = document.getElementById("planDetails");
const logoutBtn = document.getElementById("logoutBtn");
const upgradeBtn = document.getElementById("upgradeBtn");

/* CHECK USER LOGIN */
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "/signin.html";
        return;
    }

    emailLabel.innerText = user.email || "No email";

    // 🔥 Placeholder — replace with real Firestore premium check later
    planStatus.innerText = "Free Plan";
    planDetails.innerText = "Upgrade to unlock all tools";
});

/* LOG OUT */
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/signin.html";
});

/* UPGRADE BUTTON */
upgradeBtn.addEventListener("click", () => {
    window.location.href = "/pricing.html";
});
