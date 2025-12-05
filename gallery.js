/* ============================================================
   FIREBASE INIT
============================================================ */

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;

/* ============================================================
   AUTH CHECK
============================================================ */

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "/signin.html";
        return;
    }

    currentUser = user;
    loadGallery();
});


/* ============================================================
   LOAD GALLERY IMAGES
============================================================ */

async function loadGallery() {
    const grid = document.getElementById("galleryGrid");
    grid.innerHTML = `<p style="opacity:0.7">Loading your photos…</p>`;

    const snap = await db.collection("users")
        .doc(currentUser.uid)
        .collection("gallery")
        .orderBy("created", "desc")
        .get();

    if (snap.empty) {
        grid.innerHTML = `<p style="opacity:0.7">Your gallery is empty. Save an image from the editor.</p>`;
        return;
    }

    grid.innerHTML = "";

    snap.forEach((doc) => {
        const data = doc.data();
        const id = doc.id;
        const url = data.url;

        const item = document.createElement("div");
        item.classList.add("gallery-item");

        item.innerHTML = `
            <img src="${url}" onclick="openViewer('${url}')">

            <div class="item-actions">
                <button class="action-btn" onclick="openViewer('${url}')">👁</button>
                <button class="action-btn" onclick="deleteImage('${id}', '${url}')">🗑</button>
            </div>
        `;

        grid.appendChild(item);
    });
}


/* ============================================================
   FULLSCREEN VIEWER
============================================================ */

function openViewer(url) {
    const viewer = document.getElementById("fullscreenViewer");

    if (!viewer) {
        // Create viewer if missing
        createFullscreenViewer();
    }

    document.getElementById("viewerImg").src = url;
    document.getElementById("fullscreenViewer").style.display = "flex";
}

function closeViewer() {
    document.getElementById("fullscreenViewer").style.display = "none";
}

// Create viewer structure on the fly if not in DOM
function createFullscreenViewer() {
    const div = document.createElement("div");
    div.id = "fullscreenViewer";
    div.innerHTML = `
        <span id="closeViewer" onclick="closeViewer()">✕</span>
        <img id="viewerImg" src="">
    `;
    document.body.appendChild(div);
}


/* ============================================================
   DELETE IMAGE
============================================================ */

async function deleteImage(id, imageUrl) {
    const confirmDelete = confirm("Delete this image permanently?");
    if (!confirmDelete) return;

    // 1. Remove from Storage
    const fileRef = storage.refFromURL(imageUrl);
    await fileRef.delete();

    // 2. Remove Firestore entry
    await db.collection("users")
        .doc(currentUser.uid)
        .collection("gallery")
        .doc(id)
        .delete();

    // 3. Reload gallery
    loadGallery();
}


/* ============================================================
   NAVIGATION + LOGOUT
============================================================ */

function goTo(page) {
    window.location.href = `/${page}.html`;
}

function logout() {
    auth.signOut()
        .then(() => window.location.href = "/signin.html");
}