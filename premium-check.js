import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCM6r66kW9xkBA5rgVcz4sP57N2v2BMbkg",
    authDomain: "ai-photo-studio-24354.firebaseapp.com",
    projectId: "ai-photo-studio-24354",
    storageBucket: "ai-photo-studio-24354.firebasestorage.app",
    messagingSenderId: "411346648650",
    appId: "1:411346648650:web:aefd1b26027ed5e8fab0b3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Make editor.js see this
window.isProUser = false;

onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        window.isProUser = false;
        return;
    }

    const data = snap.data();

    // If no expiry stored, assume PRO until system upgraded
    if (!data.premiumExpires) {
        window.isProUser = data.premium === true;
        return;
    }

    const expiry = data.premiumExpires.toDate();
    const now = new Date();

    if (expiry < now) {
        window.isProUser = false;
        window.location.href = "subscription-expired.html";
        return;
    }

    // VALID PRO
    window.isProUser = true;
});
