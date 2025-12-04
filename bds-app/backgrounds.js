function triggerUpload() {
  document.getElementById("bgUpload").click();
}

document.getElementById("bgUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    sendBackgroundToEditor(reader.result);
  };
  reader.readAsDataURL(file);
});

function selectBG(value) {
  sendBackgroundToEditor(value);
}

function selectPremium() {
  alert("This background requires PRO 🔒\nUpgrade on the Pricing page!");
}

function sendBackgroundToEditor(value) {
  localStorage.setItem("selectedBackground", value);
  window.location.href = "/index.html"; // back to editor
}
