import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  query, collection, where, getDocs
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const section = document.getElementById("mes-reservations");
const tbody   = document.querySelector("#table-client tbody");

function heureRDV(h) {
  if (!h) return "(inconnue)";
  const [hr, min] = h.split(":").map(Number);
  const rdv = new Date();
  rdv.setHours(hr - 2, min, 0); // RDV = 2h avant
  return rdv.toTimeString().slice(0, 5);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  section.style.display = "block";

  const q = query(collection(db, "reservations"), where("uid", "==", user.uid));
  const snap = await getDocs(q);

  tbody.innerHTML = ""; // vide le tableau avant d'ajouter

  snap.forEach(d => {
    const r = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${r.dateDepart?.toDate().toLocaleDateString("fr-FR")}</td>
        <td>${r.heureVol ?? "(non précisé)"}</td>
        <td>${r.heureVol ? heureRDV(r.heureVol) : "(inconnu)"}</td>
        <td>${r.dateRetour?.toDate().toLocaleDateString("fr-FR")}</td>
        <td>${r.pack}</td>
        <td>${r.statut}</td>
    `;
    tbody.appendChild(tr);
  });
});
