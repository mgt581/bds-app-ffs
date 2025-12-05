const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const canvasPanel = document.getElementById("canvasPanel");

let uploadedImage = null;

/* =======================
   DRAG & DROP UPLOAD
======================= */

dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", handleFile);

dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("active");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("active"));

dropZone.addEventListener("drop", e => {
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
        ctx.drawImage(img, 0, 0);
        uploadedImage = img;

        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
    };
    img.src = URL.createObjectURL(file);
}

/* =======================
   MAGIC ERASE MODE
======================= */

let eraseMode = false;
let erasing = false;

let maskCanvas = document.createElement("canvas");
let maskCtx = maskCanvas.getContext("2d");

function enableMagicErase() {
    eraseMode = true;

    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;

    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    canvasPanel.classList.add("magic-erase-active");
}

canvas.addEventListener("touchstart", startErasing);
canvas.addEventListener("touchmove", drawErase);
canvas.addEventListener("touchend", () => erasing = false);

function startErasing(e) {
    if (!eraseMode) return;
    erasing = true;
    drawErase(e);
}

function drawErase(e) {
    if (!eraseMode || !erasing) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

    // Draw on mask
    maskCtx.fillStyle = "white";
    maskCtx.beginPath();
    maskCtx.arc(x, y, 25, 0, Math.PI * 2);
    maskCtx.fill();

    // Preview stroke on canvas
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

/* =======================
   APPLY MAGIC ERASE (AI)
======================= */

async function runMagicErase() {
    if (!uploadedImage) return alert("Upload an image first!");

    const originalImage = canvas.toDataURL("image/png");
    const maskImage = maskCanvas.toDataURL("image/png");

    const res = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            "Authorization": "Token YOUR_REPLICATE_API_KEY",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            version: "8b04bf06fa9123...", // inpainting model ID
            input: {
                image: originalImage,
                mask: maskImage,
                prompt: "remove selected areas and reconstruct background naturally"
            }
        })
    });

    const json = await res.json();

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        eraseMode = false;
        canvasPanel.classList.remove("magic-erase-active");
    };

    img.src = json.output[0];
}

/* =======================
   OTHER TOOLS (STUBS)
======================= */

function applyBlur() {
    ctx.filter = "blur(4px)";
    ctx.drawImage(uploadedImage, 0, 0);
    ctx.filter = "none";
}

function applyEnhance() {
    ctx.filter = "brightness(1.15) contrast(1.15)";
    ctx.drawImage(uploadedImage, 0, 0);
    ctx.filter = "none";
}

function replaceBackground() {
    alert("Background replacement API connects here.");
}

function saveImage() {
    const a = document.createElement("a");
    a.download = "edited-photo.png";
    a.href = canvas.toDataURL();
    a.click();
}
