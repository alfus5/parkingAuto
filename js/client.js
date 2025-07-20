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

function calculerPrix(dateDepart, dateRetour, pack) {
  const MS_PAR_JOUR = 1000 * 60 * 60 * 24;

  const jours = Math.ceil((dateRetour - dateDepart) / MS_PAR_JOUR);
  if (jours <= 0) return 0;

  const paliers = [
    { jours: 1, standard: 35, confort: 95, vip: 155 },
    { jours: 7, standard: 90, confort: 150, vip: 210 },
    { jours: 14, standard: 102, confort: 162, vip: 222 },
    { jours: 21, standard: 145.20, confort: 205.20, vip: 265.20 },
    { jours: 28, standard: 206.40, confort: 266.40, vip: 326.40 },
  ];

  // Trouver le palier inférieur ou égal
  let palier = paliers[0];
  for (let i = paliers.length - 1; i >= 0; i--) {
    if (jours >= paliers[i].jours) {
      palier = paliers[i];
      break;
    }
  }

  const prixTotal = {
    Standard: palier.standard,
    Confort: palier.confort,
    VIP: palier.vip
  }[pack];

  // Si pile au palier, on retourne le prix directement
  if (jours === palier.jours) return prixTotal;

  // Sinon, calcul pro-rata journalier à partir du palier
  const prixParJour = {
    Standard: palier.standard / palier.jours,
    Confort: palier.confort / palier.jours,
    VIP: palier.vip / palier.jours
  }[pack];

  const prixFinal = prixTotal + (jours - palier.jours) * prixParJour;
  return Math.round(prixFinal * 100) / 100; // arrondi à 2 décimales
}

guard().then(initPage);  // aucun rôle spécifique requis

const section = document.getElementById("mes-reservations");
const tbody = document.querySelector("#table-client tbody");

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

export async function initPage() {
  const section = document.getElementById("mes-reservations");
  const tbody = document.querySelector("#table-client tbody");

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    if (section) section.style.display = "block";

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

        const prix = calculerPrix(r.dateDepart, r.dateRetour, r.pack);

        tr.innerHTML = `
          <td>${formatDate(r.dateDepart)}</td>
          <td>${r.heureVol ?? "(non précisé)"}</td>
          <td>${r.heureVol ? heureRDV(r.heureVol) : "(inconnu)"}</td>
          <td>${formatDate(r.dateRetour)}</td>
          <td>${r.pack}</td>
          <td>
            ${r.statut === "acompte" ? 
              `<button onclick="alert('Paiement demandé pour la réservation du ${formatDate(r.dateDepart)}.');" class="payer-btn" data-id="${doc.id}" data-prix="${prix.toFixed(2)}">Payer ${prix.toFixed(2)} €</button>` 
              : r.statut}
          </td>
        `;
        tbody.appendChild(tr);

        tbody.querySelectorAll('.payer-btn').forEach(button => {
          button.addEventListener('click', e => {
            const idReservation = e.target.dataset.id;
            const prix = e.target.dataset.prix;
            // redirection avec id et prix en query params
            window.location.href = `paiement.html?id=${idReservation}&prix=${prix}`;
          });
        });
      });
    });
  });
}



snap.forEach(doc => {
  const r = doc.data();
  const tr = document.createElement("tr");

  // Crée la cellule de statut
  const tdStatut = document.createElement("td");
  if (r.statut === "acompte") {
    const btn = document.createElement("button");
    btn.textContent = "💳 Payer";
    btn.className = "payer-btn";
    btn.onclick = () => {
      // TODO: Ajoute ici l'action de paiement
      alert(`Paiement demandé pour la réservation du ${formatDate(r.dateDepart)}.`);
    };
    tdStatut.appendChild(btn);
  } else {
    tdStatut.textContent = r.statut;
  }

  // Assemble la ligne
  tr.innerHTML = `
    <td>${formatDate(r.dateDepart)}</td>
    <td>${r.heureVol ?? "(non précisé)"}</td>
    <td>${r.heureVol ? heureRDV(r.heureVol) : "(inconnu)"}</td>
    <td>${formatDate(r.dateRetour)}</td>
    <td>${r.pack}</td>
  `;
  tr.appendChild(tdStatut); // Ajoute la cellule statut (avec ou sans bouton)

  tbody.appendChild(tr);
});

btn.onclick = () => {
  // Redirige vers la page de paiement ou appelle une fonction de traitement
  window.location.href = `paiement.html?id=${doc.id}`;
};



window.calculerPrix = calculerPrix;