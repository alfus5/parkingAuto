import { saveReservation } from './firebase-reservation.js';
import { auth } from './firebase-config.js'; // 🔧 Important pour récupérer l'utilisateur

const form = document.getElementById("demo-res");

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // 🔧 Ajouter les infos utilisateur connectées
  const user = auth.currentUser;
  if (!user) {
    alert("Erreur : aucun utilisateur connecté.");
    return;
  }
  data.uid = user.uid;
  data.clientEmail = user.email;

  data.dateDepart = new Date(data.dateDepart);
  data.dateRetour = new Date(data.dateRetour);
  data.heureVol = formData.get("heureVol") || null;

  try {
    const id = await saveReservation(data);
    alert('✅ Réservation enregistrée !\nID : ' + id);
    form.reset();
  } catch (err) {
    alert('❌ Erreur : ' + err.message);
    console.error(err);
  }
});
