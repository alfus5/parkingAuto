import { guard } from './authGuard.js';
import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  query, collection, where, getDocs
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { onSnapshot } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// ...


guard().then(initPage);  // aucun rôle spécifique requis

const section = document.getElementById("mes-reservations");
const tbody   = document.querySelector("#table-client tbody");

function heureRDV(h) {
  if (!h) return "(inconnue)";
  const [hr, min] = h.split(":").map(Number);
  const rdv = new Date();
  rdv.setHours(hr - 2, min, 0); // RDV = 2h avant
  return rdv.toTimeString().slice(0, 5);
}

function formatDate(firestoreDate) {
  try {
    return firestoreDate.toDate().toLocaleDateString("fr-FR");
  } catch {
    return "(non défini)";
  }
}

async function initPage() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    section.style.display = "block";

    const q = query(
      collection(db, "reservations"),
      where("clientEmail", "==", user.email)
    );

    onSnapshot(q, (snap) => {
    tbody.innerHTML = "";

    if (snap.empty) {
        tbody.innerHTML = `<tr><td colspan="6">Aucune réservation trouvée.</td></tr>`;
        return;
    }

    snap.forEach(doc => {
        const r = doc.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${formatDate(r.dateDepart)}</td>
        <td>${r.heureVol ?? "(non précisé)"}</td>
        <td>${r.heureVol ? heureRDV(r.heureVol) : "(inconnu)"}</td>
        <td>${formatDate(r.dateRetour)}</td>
        <td>${r.pack}</td>
        <td>${r.statut}</td>
        `;
        tbody.appendChild(tr);
    });
    });

    tbody.innerHTML = "";

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="6">Aucune réservation trouvée.</td></tr>`;
      return;
    }

    snap.forEach(doc => {
      const r = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDate(r.dateDepart)}</td>
        <td>${r.heureVol ?? "(non précisé)"}</td>
        <td>${r.heureVol ? heureRDV(r.heureVol) : "(inconnu)"}</td>
        <td>${formatDate(r.dateRetour)}</td>
        <td>${r.pack}</td>
        <td>${r.statut}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}
