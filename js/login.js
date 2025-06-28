import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getDoc, setDoc, doc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

/* ========== INSCRIPTION ========== */
document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nom      = document.getElementById("signup-nom").value.trim();
  const phone    = document.getElementById("signup-phone").value.trim();
  const email    = document.getElementById("signup-email").value.trim().toLowerCase();
  const password = document.getElementById("signup-password").value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      nom,
      email,
      telephone: phone,
      role: "client",
      message: "",
      messageVu: true
    });

    alert("✅ Compte créé avec succès !");
    window.location.href = "backoffice.html";
  } catch (err) {
    console.error("❌ Erreur de création :", err);
    alert("❌ Erreur : " + err.message);
  }
});

/* ========== CONNEXION ========== */
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const pass  = document.getElementById("login-password").value.trim();

  try {
    const { user } = await signInWithEmailAndPassword(auth, email, pass);
    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.exists() ? snap.data().role : null;

    if (role === "superadmin") {
      window.location.href = "superadmin.html";
    } else if (role === "admin") {
      window.location.href = "backoffice.html";
    } else if (role === "client") {
      window.location.href = "accueil.html";
    } else {
      alert("❌ Rôle inconnu. Contactez un administrateur.");
    }
  } catch (err) {
    console.error("❌ Connexion impossible :", err);
    alert("❌ Connexion impossible : " + err.message);
  }
});
