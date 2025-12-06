let magicImage = null;

document.getElementById("uploadInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    magicImage = reader.result;
    document.getElementById("editorCanvasImg").src = magicImage;
    document.getElementById("step-upload").classList.add("hidden");
    document.getElementById("step-editor").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

// Canvas erase simulation
const canvas = document.getElementById("magicCanvas");
const ctx = canvas.getContext("2d");
let drawing = false;

canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  ctx.clearRect(e.offsetX - 20, e.offsetY - 20, 40, 40); // Erase square
});

function finalizeErase() {
  document.getElementById("resultImg").src = canvas.toDataURL("image/png");
  document.getElementById("step-editor").classList.add("hidden");
  document.getElementById("step-result").classList.remove("hidden");
}
