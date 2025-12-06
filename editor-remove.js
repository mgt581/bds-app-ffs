// REMOVE BACKGROUND TOOL
// Loads image → sends to API → returns cutout → applies watermark if Free plan

let uploadedImage = null;

document.getElementById("uploadInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    uploadedImage = reader.result;
    document.getElementById("preview-area").src = uploadedImage;
    document.getElementById("step-upload").classList.add("hidden");
    document.getElementById("step-edit").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

// Fake processing (replace with real API later)
async function processRemoveBG() {
  if (!uploadedImage) return;

  document.getElementById("processing").classList.remove("hidden");

  // Simulated 2s processing
  await new Promise(r => setTimeout(r, 2000));

  // Output = same image for now (replace with API output)
  const result = uploadedImage;

  document.getElementById("resultImg").src = result;
  document.getElementById("processing").classList.add("hidden");
  document.getElementById("step-result").classList.remove("hidden");
}

// Save image (includes watermark for free users)
async function saveFinalImage() {
  const img = document.getElementById("resultImg");

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, 0, 0);

  // Apply watermark if user is free tier
  let isPro = localStorage.getItem("plan") === "pro";
  if (!isPro) {
    ctx.font = `${canvas.width / 20}px Arial`;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "right";
    ctx.fillText("AI Photo Studio", canvas.width - 20, canvas.height - 40);
  }

  const link = document.createElement("a");
  link.download = "removed-bg.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
