// ------------------------------------------------------------
// AI Photo Studio – Firebase App Core
// Authentication + Storage + Subscription System
// Anonymous, Email/Password, Google Sign-In Supported
// ------------------------------------------------------------

// Firebase v9 modular imports
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signInAnonymously,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

// ------------------------------------------------------------
// FIREBASE CONFIG (YOUR REAL CONFIG)
// ------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyMC6r6KkW9xkBA5rgVCz4SP57N2v2BMbKg",
    authDomain: "ai-photo-studio-24354.firebaseapp.com",
    projectId: "ai-photo-studio-24354",
    storageBucket: "ai-photo-studio-24354.firebasestorage.app",
    messagingSenderId: "411346648650",
    appId: "1:411346648650:web:aefd1b26027ed5e8fab0b3",
    measurementId: "G-8TXC63YKPD"
};

// ------------------------------------------------------------
// INIT APP
// ------------------------------------------------------------
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

// ------------------------------------------------------------
// FIRST TIME USER → SEND TO SUBSCRIPTION PAGE
// ------------------------------------------------------------
async function handleFirstTimeUser(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            createdAt: Date.now(),
            premium: false,
            trialStarted: Date.now(),
            trialEnds: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        });

        window.location.href = "/subscription.html";
        return;
    }

    // Existing user but check trial/premium
    const data = userSnap.data();

    if (data.premium === true) return;

    if (data.trialEnds < Date.now()) {
        window.location.href = "/subscription-expired.html";
        return;
    }
}

// ------------------------------------------------------------
// AUTH LISTENER – Redirects automatically
// ------------------------------------------------------------
onAuthStateChanged(auth, async (user) => {
    const currentPage = window.location.pathname;

    if (!user) {
        // If logged out and visiting protected page → redirect
        const protectedPages = [
            "/index.html",
            "/dashboard.html",
            "/editor-remove.html",
            "/editor-change.html",
            "/editor-person.html",
            "/editor-object.html",
            "/gallery.html",
            "/account.html"
        ];

        if (protectedPages.includes(currentPage)) {
            window.location.href = "/signin.html";
        }

        return;
    }

    // User logged in → subscription logic
    await handleFirstTimeUser(user);
});

// ------------------------------------------------------------
// AUTH FUNCTIONS
// ------------------------------------------------------------

// Email + Password Login
export async function loginEmail(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
}

// Create account
export async function signupEmail(email, password) {
    return await createUserWithEmailAndPassword(auth, email, password);
}

// Google Sign-In
export async function loginGoogle() {
    return await signInWithPopup(auth, googleProvider);
}

// Anonymous Sign-In
export async function loginAnonymous() {
    return await signInAnonymously(auth);
}

// Forgot Password
export async function sendReset(email) {
    return await sendPasswordResetEmail(auth, email);
}

// Logout
export async function logout() {
    return await signOut(auth);
}
