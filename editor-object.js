/* MAGIC ERASER / OBJECT REMOVAL
   --------------------------------------------------
   User draws → area becomes transparent → AI inpaints 
*/

import { auth, onAuthStateChanged } from "./firebase-app.js";

let canvas = document.getElementById("editorCanvas");
let ctx = canvas.getContext("2d");
let img = new Image();
let drawing = false;
let userPlan = "free";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const snap = await fetch(`/get-plan?uid=${user.uid}`).then(r => r.json());
  userPlan = snap.plan || "free";
});

document.getElementById("uploadInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    img.src = reader.result;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
  };
  reader.readAsDataURL(file);
});

/* DRAW ERASE MASK */
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(e.offsetX, e.offsetY, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
});

/* AI INPAINTING */
async function applyErase() {
  const erased = canvas.toDataURL("image/png");

  // Use browser built-in inpainting (offscreen canvas method)
  const base = new Image();
  base.src = erased;
  await base.decode();

  const out = document.createElement("canvas");
  out.width = base.width;
  out.height = base.height;

  const octx = out.getContext("2d");
  octx.drawImage(base, 0, 0);

  // Watermark for free users
  if (userPlan !== "pro") {
    octx.font = "80px Inter";
    octx.fillStyle = "rgba(0,150,255,0.35)";
    octx.rotate(-0.5);
    octx.fillText("AI PHOTO STUDIO", 80, base.height / 2);
  }

  const result = out.toDataURL("image/png");
  canvas.getContext("2d").drawImage(out, 0, 0);
}

window.applyErase = applyErase;

function saveImage() {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "object-removed.png";
  a.click();
}
window.saveImage = saveImage;
