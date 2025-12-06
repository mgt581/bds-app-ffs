let originalImage = null;
let chosenBackground = null;

document.getElementById("uploadInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    originalImage = reader.result;
    document.getElementById("preview-original").src = originalImage;
    document.getElementById("step-upload").classList.add("hidden");
    document.getElementById("step-bg-select").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

// User selects preset background
function pickPreset(bgPath) {
  chosenBackground = bgPath;
  applyBackground();
}

// User uploads custom background
document.getElementById("bgUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    chosenBackground = reader.result;
    applyBackground();
  };
  reader.readAsDataURL(file);
});

// Simulated background changer
async function applyBackground() {
  if (!originalImage || !chosenBackground) return;

  document.getElementById("processing").classList.remove("hidden");

  await new Promise(r => setTimeout(r, 1500));

  // In real version, send original + background to backend
  document.getElementById("resultImg").src = chosenBackground;

  document.getElementById("processing").classList.add("hidden");
  document.getElementById("step-bg-select").classList.add("hidden");
  document.getElementById("step-result").classList.remove("hidden");
}
