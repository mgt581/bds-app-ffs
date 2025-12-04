const uploadInput = document.getElementById("uploadInput");
const uploadArea = document.getElementById("uploadArea");
const comparisonBox = document.getElementById("comparisonBox");

const beforeImg = document.getElementById("beforeImg");
const afterImg = document.getElementById("afterImg");
const slider = document.getElementById("slider");

let isDragging = false;

function triggerUpload() {
  uploadInput.click();
}

uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    beforeImg.src = reader.result;
    afterImg.src = reader.result;

    uploadArea.classList.add("hidden");
    comparisonBox.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

/* SLIDER LOGIC */
slider.addEventListener("mousedown", () => (isDragging = true));
window.addEventListener("mouseup", () => (isDragging = false));

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const rect = beforeImg.getBoundingClientRect();
  let x = e.clientX - rect.left;

  x = Math.max(0, Math.min(x, rect.width));
  const percent = (x / rect.width) * 100;

  afterImg.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
  slider.style.left = percent + "%";
});

/* RESET */
function resetComparison() {
  uploadArea.classList.remove("hidden");
  comparisonBox.classList.add("hidden");
  uploadInput.value = "";
}

/* SAVE FINAL RESULT */
function saveImage() {
  const canvas = document.createElement("canvas");
  canvas.width = beforeImg.naturalWidth;
  canvas.height = beforeImg.naturalHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(afterImg, 0, 0);

  const link = document.createElement("a");
  link.download = "edited.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
