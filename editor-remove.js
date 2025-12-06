let removeBgImage = null;

document.getElementById("uploadInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    removeBgImage = reader.result;

    document.getElementById("preview-area").src = removeBgImage;
    document.getElementById("step-upload").classList.add("hidden");
    document.getElementById("step-edit").classList.remove("hidden");
  };

  reader.readAsDataURL(file);
});

async function removeBackground() {
  if (!removeBgImage) return;

  document.getElementById("processing").classList.remove("hidden");

  await new Promise((res) => setTimeout(res, 2000));

  // For now same image – replace with API later
  const finalImage = removeBgImage;

  localStorage.setItem("removeBgResult", finalImage);

  window.location.href = "editor-output-remove.html";
}
