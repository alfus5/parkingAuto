import { auth, db } from './firebase-config.js';
import {
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

import {
  setDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

/* ─────────── Affichage du bouton de déconnexion ─────────── */
const logoutBtn = document.getElementById("logout-btn");

onAuthStateChanged(auth, (user) => {
  if (logoutBtn) logoutBtn.style.display = user ? "inline-block" : "none";
});

/* ─────────── Déconnexion ─────────── */
logoutBtn?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("✅ Déconnexion réussie.");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Erreur lors de la déconnexion :", err);
    alert("❌ Une erreur est survenue lors de la déconnexion.");
  }
});

/* ─────────── Inscription ─────────── */
const registerForm = document.getElementById("register-form");

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  const nom = document.getElementById("register-nom").value.trim();

  if (!email || !password || !nom) {
    alert("❗ Merci de remplir tous les champs.");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    await setDoc(doc(db, "users", uid), {
      email,
      nom,
      role: "client", // rôle par défaut
      createdAt: serverTimestamp()
    });

    alert("✅ Inscription réussie ! Veuillez vous connecter.");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Erreur inscription :", err);
    if (err.code === "auth/email-already-in-use") {
      alert("❌ Cet e-mail est déjà utilisé.");
    } else if (err.code === "auth/weak-password") {
      alert("❌ Le mot de passe doit contenir au moins 6 caractères.");
    } else if (err.code === "auth/invalid-email") {
      alert("❌ L'e-mail est invalide.");
    } else {
      alert("❌ Erreur inconnue : " + err.message);
    }
  }
});


