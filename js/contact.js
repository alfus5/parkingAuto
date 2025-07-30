import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const form = document.getElementById('contact-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nom = form.nom.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  if (!nom || !email || !message) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  try {
    await addDoc(collection(db, "messages"), {
      nom,
      email,
      message,
      createdAt: serverTimestamp()
    });

    alert("📨 Merci pour votre message !");
    form.reset();
  } catch (err) {
    console.error("Erreur d'enregistrement :", err);
    alert("❌ Une erreur s’est produite. Merci de réessayer.");
  }
});
