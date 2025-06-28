import { saveReservation } from './firebase-reservation.js';

const form = document.getElementById("demo-res");

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Convertir les dates en objets Date pour Firestore
  data.dateDepart = new Date(data.dateDepart);
  data.dateRetour = new Date(data.dateRetour);

  // Assurez-vous que l'heureVol est bien présente
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
