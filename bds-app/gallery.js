/* --------------------------------------------------
   FIREBASE IMPORTS
-------------------------------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

/* --------------------------------------------------
   FIREBASE INIT
-------------------------------------------------- */
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
const db = getFirestore(app);
const storage = getStorage(app);

/* --------------------------------------------------
   DOM ELEMENTS
-------------------------------------------------- */
const albumGrid = document.getElementById("albumGrid");
const loadingText = document.getElementById("loadingText");
const modal = document.getElementById("albumModal");
const albumNameInput = document.getElementById("albumNameInput");
const createAlbumBtn = document.getElementById("createAlbumBtn");

let userPlan = "free";

/* --------------------------------------------------
   LOAD USER PLAN
-------------------------------------------------- */
async function loadUserPlan(uid) {
    const userDoc = await getDocs(collection(db, "users"));
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        const data = snap.data();
        userPlan = data.plan || "free";
    }
}

/* --------------------------------------------------
   LOAD ALBUMS
-------------------------------------------------- */
onAuthStateChanged(auth, async (user) => {
    if (!user) return location.href = "signin.html";

    await loadUserPlan(user.uid);

    if (userPlan === "free") {
        createAlbumBtn.style.display = "none"; // Pro only
    }

    loadAlbums(user.uid);
});

/* --------------------------------------------------
   LIST ALBUMS
-------------------------------------------------- */
async function loadAlbums(uid) {
    const col = collection(db, "users", uid, "albums");
    const snap = await getDocs(col);

    loadingText.remove();

    // Always show All Photos
    const allPhotosCard = document.createElement("div");
    allPhotosCard.classList.add("album-card");
    allPhotosCard.onclick = () => openAlbum("all");

    allPhotosCard.innerHTML = `
        <h3>All Photos</h3>
        <p>Every saved edit</p>
    `;
    albumGrid.appendChild(allPhotosCard);

    // User albums
    snap.forEach((album) => {
        const data = album.data();

        const card = document.createElement("div");
        card.classList.add("album-card");
        card.onclick = () => openAlbum(album.id);

        card.innerHTML = `
            <h3>${data.name}</h3>
            <p>${data.count || 0} photos</p>
        `;

        albumGrid.appendChild(card);
    });
}

/* --------------------------------------------------
   OPEN ALBUM
-------------------------------------------------- */
window.openAlbum = function (albumId) {
    location.href = `album.html?album=${albumId}`;
};

/* --------------------------------------------------
   ALBUM CREATION MODAL
-------------------------------------------------- */
window.openAlbumModal = function () {
    modal.classList.remove("hidden");
};

window.closeAlbumModal = function () {
    modal.classList.add("hidden");
    albumNameInput.value = "";
};

/* --------------------------------------------------
   CREATE ALBUM (PRO ONLY)
-------------------------------------------------- */
window.createAlbum = async function () {
    const user = auth.currentUser;
    if (!user) return;

    if (userPlan !== "pro") {
        alert("Album creation is a Pro feature.");
        return;
    }

    const name = albumNameInput.value.trim();
    if (!name) return alert("Enter album name");

    const albumId = Date.now().toString();

    await setDoc(doc(db, "users", user.uid, "albums", albumId), {
        name: name,
        created: Date.now(),
        count: 0
    });

    closeAlbumModal();
    location.reload();
};

/* --------------------------------------------------
   LOGOUT
-------------------------------------------------- */
window.logout = function () {
    signOut(auth).then(() => location.href = "signin.html");
};

/* BUTTON HANDLER */
createAlbumBtn.onclick = openAlbumModal;