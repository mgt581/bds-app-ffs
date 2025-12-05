const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "/signin.html";
        return;
    }

    loadGallery(user.uid);
});

async function loadGallery(uid) {
    const grid = document.getElementBy