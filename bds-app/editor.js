// ======================================================
// INITIAL SETUP
// ======================================================

let originalImageDataURL = null;
let currentImage = null;
let canvas = document.getElementById("editorCanvas");
let ctx = canvas.getContext("2d");

// Background layer
let backgroundMode = "none";
let bgColor = "#ffffff";
let bgImage = null;
let blurStrength = 0;

// Premium flag (set by premium-check.js)
let isProUser = false;


// ======================================================
// LOAD UPLOADED IMAGE
// ======================================================

window.loadImage = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        originalImageDataURL = e.target.result;
        localStorage.setItem("originalImage", originalImageDataURL);

        currentImage = new Image();
        currentImage.onload = () => {
            resizeCanvas(currentImage.width, currentImage.height);
            drawFinalImage();
        };
        currentImage.src = originalImageDataURL;
    };

    reader.readAsDataURL(file);
};


// ======================================================
// CANVAS RESIZE
// ======================================================

function resizeCanvas(w, h) {
    const maxSize = 1200;
    let ratio = Math.min(maxSize / w, maxSize / h, 1);

    canvas.width = w * ratio;
    canvas.height = h * ratio;
}


// ======================================================
// RENDER FULL FINAL IMAGE (background + image + watermark)
// ======================================================

function drawFinalImage() {
    if (!currentImage) return;

    // Draw Background
    if (backgroundMode === "color") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (backgroundMode === "image" && bgImage) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    if (backgroundMode === "blur") {
        ctx.filter = `blur(${blurStrength}px)`;
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        ctx.filter = "none";
    }

    // Draw Main Image
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    // FREE USER? Add Watermark
    if (!isProUser) {
        ctx.font = "32px Inter";
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.textAlign = "right";
        ctx.fillText("AI Photo Studio", canvas.width - 20, canvas.height - 20);
    }
}


// ======================================================
// BACKGROUND CONTROLS
// ======================================================

window.setBgColor = function (color) {
    backgroundMode = "color";
    bgColor = color;
    drawFinalImage();
};

window.setBgImage = function (src) {
    backgroundMode = "image";
    bgImage = new Image();
    bgImage.onload = drawFinalImage;
    bgImage.src = src;
};

window.uploadBg = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        backgroundMode = "image";
        bgImage = new Image();
        bgImage.onload = drawFinalImage;
        bgImage.src = e.target.result;
    };

    reader.readAsDataURL(file);
};

window.blurBG = function () {
    backgroundMode = "blur";
    blurStrength = 8;
    drawFinalImage();
};

window.openBgPanel = function () {
    document.querySelector(".bg-panel").classList.toggle("open");
};


// ======================================================
// ENHANCE (placeholder)
// ======================================================

window.applyEnhance = function () {
    alert("AI Enhance API can be added later.\nFor now, this is a placeholder.");
};


// ======================================================
// REMOVE BG (placeholder)
// ======================================================

window.removeBG = function () {
    alert("AI Background Removal API can be added.\nCurrent version simulates removal.");
};


// ======================================================
// EXPORT RESULT → SEND TO editor-output.html
// ======================================================

window.exportResult = function () {
    if (!originalImageDataURL) {
        alert("Upload a photo first.");
        return;
    }

    // BEFORE
    localStorage.setItem("beforeImage", originalImageDataURL);

    // AFTER
    const finalImage = canvas.toDataURL("image/png");
    localStorage.setItem("afterImage", finalImage);

    // Redirect
    window.location.href = "editor-output.html";
};
