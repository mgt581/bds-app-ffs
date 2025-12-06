let personImage = null;

document.getElementById("uploadInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    personImage = reader.result;
    document.getElementById("preview-area").src = personImage;
    document.getElementById("step-upload").classList.add("hidden");
    document.getElementById("step-edit").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

async function removePerson() {
  if (!personImage) return;

  document.getElementById("processing").classList.remove("hidden");

  await new Promise(r => setTimeout(r, 2000));

  // For now, return same image — replace with actual API
  document.getElementById("resultImg").src = personImage;

  document.getElementById("processing").classList.add("hidden");
  document.getElementById("step-result").classList.remove("hidden");
}
