let originalImage = null;
let chosenBackground = null;

document.getElementById("uploadInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    originalImage = reader.result;

    document.getElementById("preview-area").src = originalImage;
    document.getElementById("step-upload").classList.add("hidden");
    document.getElementById("step-backgrounds").classList.remove("hidden");
  };

  reader.readAsDataURL(file);
});

// When user selects a preset background
function chooseBackground(bg) {
  chosenBackground = bg;
  applyBackgroundChange();
}

// Upload custom background
document.getElementById("bgUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    chosenBackground = reader.result;
    applyBackgroundChange();
  };

  reader.readAsDataURL(file);
});

async function applyBackgroundChange() {
  if (!originalImage || !chosenBackground) return;

  document.getElementById("processing").classList.remove("hidden");

  await new Promise((res) => setTimeout(res, 2000));

  // For now simulate same image – API will replace
  const finalImage = originalImage;

  localStorage.setItem("changeBgResult", finalImage);

  window.location.href = "editor-output-change.html";
}
