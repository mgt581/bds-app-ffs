/* ============================================================
   FIREBASE INIT & AUTH
============================================================ */

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;
let isPro = false;

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "/signin.html";
        return;
    }

    currentUser = user;

    // Fetch pro status from Firestore
    const profileRef = db.collection("users")
        .doc(user.uid)
        .collection("profile")
        .doc("info");

    const snap = await profileRef.get();

    if (snap.exists && snap.data().pro === true) {
        isPro = true;
    } else {
        isPro = false;
    }
});


/* ============================================================
   CANVAS SETUP
============================================================ */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let uploadedImage = null;

// Mask canvas used for Magic Erase
let maskCanvas = document.createElement("canvas");
let maskCtx = maskCanvas.getContext("2d");

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");


/* ============================================================
   WATERMARK (FREE USERS ONLY)
============================================================ */

function applyWatermarkIfFree() {
    if (isPro) return; // Skip for PRO users

    const wmText = "AI Photo Studio • Free";

    const patternCanvas = document.createElement("canvas");
    const pctx = patternCanvas.getContext("2d");

    patternCanvas.width = 400;
    patternCanvas.height = 200;

    pctx.fillStyle = "rgba(255,255,255,0.10)";
    pctx.font = "24px Inter";
    pctx.translate(120, 50);
    pctx.rotate(-0.35); // tilt
    pctx.fillText(wmText, 0, 0);

    const pat = ctx.createPattern(patternCanvas, "repeat");

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
}


/* ============================================================
   UPLOAD + DRAG & DROP HANDLING
============================================================ */

dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", handleFile);

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("active");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("active");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("active");
    handleFile(e.dataTransfer);
});

function handleFile(source) {
    const file = source.files[0];
    if (!file) return;

    const img = new Image();

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        uploadedImage = img;

        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
    };

    img.src = URL.createObjectURL(file);
}


/* ============================================================
   HELPER: DATA URL → BLOB
============================================================ */

function dataURLtoBlob(dataURL) {
    const byteString = atob(dataURL.split(',')[1]);
    const mime = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mime });
}

 /* ============================================================
   REMOVE BACKGROUND (FREE AI API)
============================================================ */

async function runBackgroundRemoval() {
    if (!uploadedImage) return alert("Upload an image first!");

    const dataUrl = canvas.toDataURL("image/png");
    const blob = dataURLtoBlob(dataUrl);

    const formData = new FormData();
    formData.append("image_file", blob, "photo.png");

    const res = await fetch("https://clipdrop-api.co/remove-background/v1", {
        method: "POST",
        headers: {
            "x-api-key": window.AI_CONFIG.CLIPDROP_KEY // SAFE: loaded from aiKeys.js
        },
        body: formData
    });

    if (!res.ok) {
        console.log(await res.text());
        alert("Background removal failed.");
        return;
    }

    const cleanedBlob = await res.blob();
    const img = new Image();

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        applyWatermarkIfFree();
    };

    img.src = URL.createObjectURL(cleanedBlob);
}


/* ============================================================
   CHANGE BACKGROUND SECTION
============================================================ */

let selectedBackground = null;
let selectedSolidColor = null;

// When user uploads custom background
document.getElementById("bgInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    selectedBackground = URL.createObjectURL(file);
    selectedSolidColor = null; // clear solid colour mode
});

// When user selects a preset image
function selectPresetBackground(src) {
    selectedBackground = src;
    selectedSolidColor = null;
}

// When user chooses a solid background colour
function selectColorBackground(color) {
    selectedSolidColor = color;
    selectedBackground = null;
}


/* ============================================================
   APPLY BACKGROUND CHANGE
   (Solid Colour OR AI Composite)
============================================================ */

async function applyBackgroundChange() {
    if (!uploadedImage) return alert("Upload an image first!");

    /* ------------------------------------------------------------
       1️⃣ SOLID COLOUR BACKGROUND (Local only, no AI needed)
    ------------------------------------------------------------ */
    if (selectedSolidColor) {
        ctx.fillStyle = selectedSolidColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(uploadedImage, 0, 0);

        applyWatermarkIfFree();
        selectedSolidColor = null;
        return;
    }

    /* ------------------------------------------------------------
       2️⃣ MUST SELECT BACKGROUND IMAGE IF NOT USING SOLID COLOUR
    ------------------------------------------------------------ */
    if (!selectedBackground) {
        return alert("Select a background or colour first!");
    }

    /* ------------------------------------------------------------
       3️⃣ AI RE-BACKGROUND MODE
       - Foreground: current canvas
       - Background: selected image
    ------------------------------------------------------------ */

    const fgBlob = dataURLtoBlob(canvas.toDataURL("image/png"));
    const bgBlob = await (await fetch(selectedBackground)).blob();

    const formData = new FormData();
    formData.append("image_file", fgBlob, "foreground.png");
    formData.append("background", bgBlob, "background.png");

    const res = await fetch("https://clipdrop-api.co/rebackground/v1", {
        method: "POST",
        headers: {
            "x-api-key": window.AI_CONFIG.CLIPDROP_KEY
        },
        body: formData
    });

    if (!res.ok) {
        console.log(await res.text());
        alert("AI background change failed.");
        return;
    }

    const resultBlob = await res.blob();
    const img = new Image();

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        applyWatermarkIfFree();
    };

    img.src = URL.createObjectURL(resultBlob);
}

/* ============================================================
   MAGIC ERASE (Finger Mask + AI Cleanup)
============================================================ */

let eraseMode = false;
let erasing = false;

function enableMagicErase() {
    eraseMode = true;

    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;

    // Start with a fully black mask
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    document.getElementById("canvasPanel").classList.add("magic-erase-active");
}

// Touch start
canvas.addEventListener("touchstart", startErasing);
canvas.addEventListener("mousedown", startErasing);

// Touch move
canvas.addEventListener("touchmove", drawErase);
canvas.addEventListener("mousemove", drawErase);

// Touch end
canvas.addEventListener("touchend", () => erasing = false);
canvas.addEventListener("mouseup", () => erasing = false);



function startErasing(e) {
    if (!eraseMode) return;
    erasing = true;
    drawErase(e);
}

function drawErase(e) {
    if (!eraseMode || !erasing) return;

    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;

    if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    // Draw white on the mask where user erases
    maskCtx.fillStyle = "white";
    maskCtx.beginPath();
    maskCtx.arc(x, y, 35, 0, Math.PI * 2);
    maskCtx.fill();

    // Visual feedback
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}


async function runMagicErase() {
    if (!eraseMode) return alert("Tap 'Start Erasing' first!");

    const imgBlob = dataURLtoBlob(canvas.toDataURL("image/png"));
    const maskBlob = dataURLtoBlob(maskCanvas.toDataURL("image/png"));

    const formData = new FormData();
    formData.append("image_file", imgBlob, "image.png");
    formData.append("mask_file", maskBlob, "mask.png");

    const res = await fetch("https://clipdrop-api.co/cleanup/v1", {
        method: "POST",
        headers: {
            "x-api-key": window.AI_CONFIG.CLIPDROP_KEY
        },
        body: formData
    });

    if (!res.ok) {
        console.log(await res.text());
        alert("Magic Erase failed.");
        return;
    }

    const cleaned = await res.blob();
    const img = new Image();

    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        applyWatermarkIfFree();

        eraseMode = false;
        erasing = false;

        document.getElementById("canvasPanel").classList.remove("magic-erase-active");
    };

    img.src = URL.createObjectURL(cleaned);
}


/* ============================================================
   BLUR TOOL
============================================================ */

function applyBlur() {
    if (!uploadedImage) return;

    ctx.filter = "blur(4px)";
    ctx.drawImage(uploadedImage, 0, 0);
    ctx.filter = "none";

    applyWatermarkIfFree();
}


/* ============================================================
   ENHANCE TOOL (Brightness & Contrast Boost)
============================================================ */

function applyEnhance() {
    if (!uploadedImage) return;

    ctx.filter = "brightness(1.15) contrast(1.2)";
    ctx.drawImage(uploadedImage, 0, 0);
    ctx.filter = "none";

    applyWatermarkIfFree();
} 

/* ============================================================
   SAVE IMAGE TO FIREBASE GALLERY
============================================================ */

async function saveFinalImage() {
    if (!currentUser) return alert("You must be signed in to save images.");

    // Apply watermark for FREE users before saving
    applyWatermarkIfFree();

    // Convert canvas to PNG data URL
    const dataUrl = canvas.toDataURL("image/png");

    // Create storage reference
    const fileRef = storage.ref(
        `users/${currentUser.uid}/gallery/${Date.now()}.png`
    );

    // Upload the image
    await fileRef.putString(dataUrl, "data_url");

    // Get downloadable URL
    const url = await fileRef.getDownloadURL();

    // Save metadata in Firestore
    await db.collection("users")
        .doc(currentUser.uid)
        .collection("gallery")
        .add({
            url,
            created: firebase.firestore.FieldValue.serverTimestamp(),
        });

    alert("Saved to your gallery!");
}


/* ============================================================
   NAVIGATION HELPERS
============================================================ */

function goTo(page) {
    window.location.href = `/${page}.html`;
}


/* ============================================================
   LOGOUT
============================================================ */

function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = "/signin.html";
        })
        .catch((err) => {
            console.error("Sign out error:", err);
        });
}


/* ============================================================
   END OF FILE — EDITOR.JS COMPLETE
============================================================ */
console.log("AI Photo Studio Editor Loaded Successfully");

