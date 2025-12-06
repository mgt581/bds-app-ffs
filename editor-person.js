/* REMOVE PERSON TOOL
   -----------------------------------------
   Mark → erase → AI patch fill
*/

import { auth, onAuthStateChanged } from "./firebase-app.js";

const uploadInput = document.getElementById("uploadInput");
const previewImg = document.getElementById("previewImg");
const previewBox = document.getElementById("previewBox");

let imgData = null;
let resultImg = null;
let userPlan = "free";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const snap = await fetch(`/get-plan?uid=${user.uid}`).then(r => r.json());
  userPlan = snap.plan || "free";
});

uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    imgData = reader.result;
    previewImg.src = imgData;
    previewBox.style.display = "block";
  };
  reader.readAsDataURL(file);
});

/* REMOVE PEOPLE USING SEGMENTATION */
async function processPerson() {
  const img = new Image();
  img.src = imgData;
  await img.decode();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.width;
  canvas.height = img.height;

  // Load AI segmentation model
  const seg = await selfieSegmentation.createSegmenter({
    model: "landscape"
  });

  const mask = await seg.segment(img);

  ctx.drawImage(img, 0, 0);

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const p = pixels.data;

  // Remove detected people (mask > 0.5)
  for (let i = 0; i < p.length; i += 4) {
    if (mask.data[i / 4] > 0.6) p[i + 3] = 0; // erase person
  }

  ctx.putImageData(pixels, 0, 0);

  // Free plan watermark
  if (userPlan !== "pro") {
    ctx.font = "80px Inter";
    ctx.fillStyle = "rgba(0,150,255,0.35)";
    ctx.rotate(-0.5);
    ctx.fillText("AI PHOTO STUDIO", 80, img.height / 2);
  }

  resultImg = canvas.toDataURL("image/png");
  previewImg.src = resultImg;
}

window.processPerson = processPerson;

function saveImage() {
  const a = document.createElement("a");
  a.href = resultImg;
  a.download = "person-removed.png";
  a.click();
}
window.saveImage = saveImage;
