import { auth, db } from './firebase-config.js';
import {
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const logoutBtn = document.getElementById("logout-btn");
const registerForm = document.getElementById("register-form");

/* Affiche ou masque le bouton selon la session */
onAuthStateChanged(auth, (user) => {
  if (logoutBtn) logoutBtn.style.display = user ? "inline-block" : "none";
});

/* Déconnexion */
logoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("✅ Déconnexion réussie.");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Erreur signOut :", err);
  }
});

/* Inscription avec création du profil utilisateur */
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const nom = document.getElementById("register-nom").value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    await setDoc(doc(db, "users", uid), {
      email,
      nom,
      role: "client",
      createdAt: new Date()
    });

    alert("✅ Inscription réussie ! Connectez-vous.");
    window.location.href = "login.html";
  } catch (err) {
    alert("❌ Erreur : " + err.message);
  }
});
