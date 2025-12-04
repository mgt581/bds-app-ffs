/* ============================================================
   GLOBAL ELEMENTS
============================================================ */
const uploadInput = document.getElementById("uploadInput");
const previewImg = document.getElementById("previewImage");
const beforeAfter = document.querySelector(".before-after");
const bgPanel = document.getElementById("bgPanel");
const workCanvas = document.getElementById("workCanvas");
const ctx = workCanvas.getContext("2d");

let originalImage = null;
let editedImage = null;
let model = null; // U2Net model

/* ============================================================
   AUTH & PAYWALL
============================================================ */

// Stripe checkout links
const DAY_PASS = "https://buy.stripe.com/fZu5kFfCn6SGanrcpX6J20h";
const MONTHLY  = "https://buy.stripe.com/28E4gB0Ht5OCcvzdu16J20g";
const YEARLY   = "https://buy.stripe.com/4gMcN7duf0uidzDfC96J20f";

// Firestore: your DB
const FIREBASE_USER_DB = 
  "https://firestore.googleapis.com/v1/projects/bdsapp/databases/(default)/documents/users";

let userIsPro = false;
let userId = null;

/* Fake check (replace with real after Firestore pages ready) */
async function checkSubscriptionStatus() {
    document.body.classList.remove("pro-user");

    // If not PRO → show watermark + paywall banner
    if (!userIsPro) {
        continueAsFree();
    } else {
        document.body.classList.add("pro-user");
    }
}

function continueAsFree() {
    const wm = document.createElement("div");
    wm.className = "wm";
    wm.innerText = "AI Photo Studio";
    document.querySelector(".preview-box").appendChild(wm);
}

/* ============================================================
   UPLOAD IMAGE
============================================================ */
function triggerUpload() {
    uploadInput.click();
}

uploadInput.addEventListener("change", handleUpload);

function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        previewImg.src = reader.result;
        
        previewImg.onload = () => {
            workCanvas.width = previewImg.width;
            workCanvas.height = previewImg.height;
            ctx.drawImage(previewImg, 0, 0);
            originalImage = ctx.getImageData(0, 0, workCanvas.width, workCanvas.height);
            editedImage = null;
        };
    };
    reader.readAsDataURL(file);
}

/* ============================================================
   ENHANCE
============================================================ */
function enhancePhoto() {
    if (!originalImage) return alert("Upload an image first.");

    ctx.filter = "contrast(120%) brightness(110%) saturate(115%)";
    ctx.drawImage(previewImg, 0, 0);
    ctx.filter = "none";

    editedImage = ctx.getImageData(0, 0, workCanvas.width, workCanvas.height);

    showBeforeAfter();
}

/* ============================================================
   LOAD MODEL FROM FIREBASE STORAGE
============================================================ */
async function loadU2NetModel() {
    if (!model) {
        model = await ort.InferenceSession.create(
            "https://firebasestorage.googleapis.com/v0/b/ai-photo-studio-24354.firebasestorage.app/o/u2net.onnx?alt=media"
        );
    }
    return model;
}

/* ============================================================
   REMOVE BACKGROUND
============================================================ */
async function removeBG() {
    if (!originalImage) return alert("Upload an image first.");

    const session = await loadU2NetModel();

    const tensor = preprocess(originalImage);
    const outputMap = await session.run({ input: tensor });
    const mask = outputMap.output.data;

    let output = ctx.getImageData(0, 0, workCanvas.width, workCanvas.height);
    for (let i = 0; i < mask.length; i++) {
        output.data[i * 4 + 3] = mask[i] * 255;
    }

    ctx.putImageData(output, 0, 0);
    editedImage = output;

    showBeforeAfter();
}

/* ============================================================
   PREPROCESS TO MODEL INPUT
============================================================ */
function preprocess(img) {
    const { data, width, height } = img;
    const floatData = new Float32Array(width * height * 3);

    for (let i = 0; i < width * height; i++) {
        floatData[i]                 = data[i * 4] / 255;
        floatData[i + width * height] = data[i * 4 + 1] / 255;
        floatData[i + width * height * 2] = data[i * 4 + 2] / 255;
    }

    return new ort.Tensor("float32", floatData, [1, 3, height, width]);
}

/* ============================================================
   BLUR BACKGROUND
============================================================ */
function blurBG() {
    if (!originalImage) return alert("Upload an image first.");

    // Simple blur filter
    ctx.filter = "blur(6px)";
    ctx.drawImage(previewImg, 0, 0);
    ctx.filter = "none";

    editedImage = ctx.getImageData(0, 0, workCanvas.width, workCanvas.height);

    showBeforeAfter();
}

/* ============================================================
   BACKGROUND PANEL
============================================================ */
function openBgPanel() {
    bgPanel.classList.add("open");
}
function closeBgPanel() {
    bgPanel.classList.remove("open");
}

/* Select solid colour or template */
document.querySelectorAll(".bg-option").forEach(bg => {
    bg.addEventListener("click", () => {
        if (!originalImage) return alert("Upload an image first.");

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, workCanvas.width, workCanvas.height);

        if (bg.style.backgroundImage) {
            const img = new Image();
            img.src = bg.style.backgroundImage.slice(5, -2);
            img.onload = () => {
                ctx.drawImage(img, 0, 0, workCanvas.width, workCanvas.height);
                ctx.drawImage(previewImg, 0, 0);
                editedImage = ctx.getImageData(0, 0, workCanvas.width, workCanvas.height);
                showBeforeAfter();
            };
        } else {
            ctx.fillStyle = bg.style.background;
            ctx.fillRect(0, 0, workCanvas.width, workCanvas.height);
            ctx.drawImage(previewImg, 0, 0);
            editedImage = ctx.getImageData(0, 0, workCanvas.width, workCanvas.height);
            showBeforeAfter();
        }
    });
});

/* ============================================================
   BEFORE / AFTER SLIDER
============================================================ */
function showBeforeAfter() {
    beforeAfter.classList.remove("hidden");

    beforeAfter.style.width = "50%";

    beforeAfter.onmousemove = (e) => {
        const rect = beforeAfter.parentElement.getBoundingClientRect();
        let x = e.clientX - rect.left;
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;
        beforeAfter.style.width = `${x}px`;
    };
}

/* ============================================================
   SAVE IMAGE
============================================================ */
function savePhoto() {
    if (!editedImage) return alert("Use a tool first.");

    const link = document.createElement("a");
    link.download = "edited.png";
    link.href = workCanvas.toDataURL("image/png");
    link.click();
}

/* ============================================================
   ACCOUNT BUTTON
============================================================ */
document.getElementById("accountBtn").addEventListener("click", () => {
    window.location.href = "/profile.html";
});

/* ============================================================
   INIT
============================================================ */
checkSubscriptionStatus();
