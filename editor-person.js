let personImage = null;

// UPLOAD IMAGE
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


// PROCESS REMOVE PERSON
async function removePerson() {
  if (!personImage) return;

  document.getElementById("processing").classList.remove("hidden");

  // Simulated AI process – replace with real API later
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // FINAL IMAGE (for now same until API added)
  const finalImage = personImage;

  // Save for output page to load
  localStorage.setItem("removePersonResult", finalImage);

  // Go to output page
  window.location.href = "editor-output-person.html";
}
