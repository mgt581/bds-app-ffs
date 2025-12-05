const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let uploadedImage = null;

/* ============== DRAG & DROP ============== */
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

/* Load image into canvas */
function handleFile(source) {
    const file = source.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        uploadedImage = img;
    };
    img.src = URL.createObjectURL(file);
}

/* ============== REAL API CALL STUBS READY ============== */

/* Background Removal → replace placeholder with real API */
async function runBackgroundRemoval() {
    if (!uploadedImage) return alert("Upload an image first!");

    const base64 = canvas.toDataURL("image/png");

    // Example using remove.bg
    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": "YOUR_API_KEY" },
        body: base64
    });

    const blob = await res.blob();
    const img = await createImageBitmap(blob);

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
}

/* Blur Effect */
function applyBlur() {
    if (!uploadedImage) return;
    ctx.filter = "blur(4px)";
    ctx.drawImage(uploadedImage, 0, 0);
    ctx.filter = "none";
}

/* Enhance Effect */
function applyEnhance() {
    if (!uploadedImage) return;
    ctx.filter = "brightness(1.15) contrast(1.15)";
    ctx.drawImage(uploadedImage, 0, 0);
    ctx.filter = "none";
}

/* Replace Background Stub */
function replaceBackground() {
    alert("Background replacement API connects here.");
}

/* Save canvas */
function saveImage() {
    const link = document.createElement("a");
    link.download = "edited-photo.png";
    link.href = canvas.toDataURL();
    link.click();
}
