/* REMOVE BACKGROUND TOOL
   -----------------------------------------
   - Free users get WATERMARK
   - Pro users get clean result
   - Uses built-in AI segmentation (browser)
*/

import { auth, onAuthStateChanged } from "./firebase-app.js";

const uploadInput = document.getElementById("uploadInput");
const previewBox = document.getElementById("previewBox");
const previewImg = document.getElementById("previewImg");

let originalImage = null;
let finalImage = null;
let userPlan = "free";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  // Load plan from Firestore
  const snap = await fetch(`/get-plan?uid=${user.uid}`).then(r => r.json());
  userPlan = snap.plan || "free";
});

uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    originalImage = reader.result;
    previewImg.src = originalImage;
    previewBox.style.display = "block";
  };
  reader.readAsDataURL(file);
});

/* AI BACKGROUND REMOVAL (browser model) */
async function processImage() {
  if (!originalImage) return;

  const img = new Image();
  img.src = originalImage;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d");

  // Load MediaPipe segmentation model
  const segmenter = await selfieSegmentation.createSegmenter({
    model: "general"
  });

  const mask = await segmenter.segment(img);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Remove background
  for (let i = 0; i < pixels.length; i += 4) {
    const m = mask.data[i / 4];
    if (m < 0.4) pixels[i + 3] = 0; // Make background transparent
  }

  ctx.putImageData(imageData, 0, 0);

  // Apply watermark for free users
  if (userPlan !== "pro") {
    ctx.font = "80px Inter";
    ctx.fillStyle = "rgba(0,150,255,0.35)";
    ctx.rotate(-0.5);
    ctx.fillText("AI PHOTO STUDIO", 80, img.height / 2);
  }

  finalImage = canvas.toDataURL("image/png");
  previewImg.src = finalImage;
}

window.processImage = processImage;

function saveImage() {
  if (!finalImage) return;

  const a = document.createElement("a");
  a.href = finalImage;
  a.download = "removed-background.png";
  a.click();
}

window.saveImage = saveImage;
