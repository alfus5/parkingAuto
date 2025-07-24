import { db } from './firebase-config.js';
export { afficherTableauReservations };

import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";


let idEnCoursDeModification = null; // Pour savoir si on modifie ou pas

function calculerPrix(pack, jours) {
  if (pack === "Standard") {
    if (jours === 1) return 35;
    if (jours <= 7) return 90;
    if (jours <= 14) return 102;
    if (jours <= 21) return 145.20;
    return 206.40;
  } else if (pack === "Confort" || pack === "Premium") {
    if (jours === 1) return 95;
    if (jours <= 7) return 150;
    if (jours <= 14) return 162;
    if (jours <= 21) return 205.20;
    return 266.40;
  } else if (pack === "VIP") {
    if (jours === 1) return 155;
    if (jours <= 7) return 210;
    if (jours <= 14) return 222;
    if (jours <= 21) return 265.20;
    return 326.40;
  }
  return 0;
}



function afficherTableauReservations(email) {
  console.log("✅ afficherTableauReservations lancé");

  const section = document.getElementById("mes-reservations");
  const tbody = document.getElementById("table-client");

  if (!tbody || !section) return;

  section.style.display = "block";

  const q = query(
    collection(db, "reservations"),
    where("clientEmail", "==", email)
  );

  onSnapshot(q, async (snap) => {
    if (!tbody) return;
    tbody.innerHTML = "";

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="8">Aucune réservation trouvée.</td></tr>`;
      return;
    }

    for (const docSnap of snap.docs) {
      const r = docSnap.data();

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDate(r.dateDepart)}</td>
        <td>${r.heureVol ?? "(non précisée)"}</td>
        <td>${r.heureVol ? heureRDV(r.heureVol) : "(inconnue)"}</td>
        <td>${r.numeroVol ?? "(non précisé)"}</td>
        <td>${formatDate(r.dateRetour)}</td>
        <td>${r.pack}</td>
        <td>${r.lieuRDV ?? "CDG"}</td>
        <td>
          ${r.statut?.toLowerCase() === "payé"
            ? "✅ Payé"
            : (() => {
              const d1 = r.dateDepart?.toDate?.();
              const d2 = r.dateRetour?.toDate?.();
              const jours = d1 && d2 ? Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) : 1;
              const prix = calculerPrix(r.pack, jours);
              return `
                  <div class="action-buttons">
                  <button class="btn-payer" onclick="payerReservation('${docSnap.id}', ${prix})">
                    💳 Payer – ${prix.toFixed(2)} €
                  </button> </td>
                <td>
                  <button class="btn-modif-res" data-id="${docSnap.id}">✏️Modifier</button>
                  <button class="btn-suppr-res" data-id="${docSnap.id}">🗑️Supprimer</button>
                </td>
              </div>
        `;
          })()
        }
</td>

      `;

      tbody.appendChild(tr);

      // Ajout des écouteurs sur les boutons
      const btnSupprimer = tr.querySelector(".btn-suppr-res");
      const btnModifier = tr.querySelector(".btn-modif-res");

      btnSupprimer.addEventListener("click", () => {
        supprimerReservation(docSnap.id); // ✅ fonction déjà définie plus bas
      });

      btnModifier.addEventListener("click", () => {
        modifierReservation(docSnap.id); // ✅ fonction déjà définie plus bas
      });

      // Bloc admin assigné
      if (r.assignedTo) {
        try {
          const adminRef = doc(db, "users", r.assignedTo);
          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists()) {
            const admin = adminSnap.data();

            const trAdmin = document.createElement("tr");
            trAdmin.className = "encart-admin";
            trAdmin.innerHTML = `
              <td colspan="9">
                <div class="admin-assign">
                  <h4>✅ Prise en charge par un agent</h4>
                  <p><strong>Nom :</strong> ${admin.nom ?? "Non défini"}</p>
                  <p><strong>Email :</strong> ${admin.email ?? "Non défini"}</p>
                  <p><strong>Téléphone :</strong> ${admin.telephone ?? "Non défini"}</p>
                </div>
              </td>
            `;
            tbody.appendChild(trAdmin);
          }
        } catch (err) {
          console.error("Erreur récupération admin assigné :", err);
        }
      } else {
        const trAttente = document.createElement("tr");
        trAttente.className = "encart-attente";
        trAttente.innerHTML = `
          <td colspan="9">
            <div class="attente-assign">
              ⏳ En attente de prise en charge par un voiturier...
            </div>
          </td>
        `;
        tbody.appendChild(trAttente);
      }
    }
  });
}


window.payerReservation = function (id, montant) {
  // Redirection vers la page paiement avec ID et montant
  const url = `paiement.html?id=${id}&montant=${montant}`;
  window.location.href = url;
};

// Utilitaires :
function formatDate(d) {
  try {
    return d.toDate().toLocaleDateString("fr-FR");
  } catch {
    return new Date(d).toLocaleDateString("fr-FR");
  }
}

function heureRDV(h) {
  if (!h) return "(inconnue)";
  const [hr, min] = h.split(":").map(Number);
  const rdv = new Date();
  rdv.setHours(hr - 3, min, 0);
  return rdv.toTimeString().slice(0, 5);
}

window.modifierReservation = function (id) {
  idEnCoursDeModification = id;

  const docRef = doc(db, "reservations", id);
  getDoc(docRef).then((snap) => {
    if (!snap.exists()) return alert("Réservation introuvable.");
    const r = snap.data();

    // Pré-remplissage du formulaire
    document.querySelector("[name='clientNom']").value = r.clientNom ?? "";
    document.querySelector("[name='clientEmail']").value = r.clientEmail ?? "";
    document.querySelector("[name='clientPhone']").value = r.clientPhone ?? "";
    document.querySelector("[name='dateDepart']").value = r.dateDepart?.toDate().toISOString().split('T')[0] ?? "";
    document.querySelector("[name='heureVol']").value = r.heureVol ?? "";
    document.querySelector("[name='dateRetour']").value = r.dateRetour?.toDate().toISOString().split('T')[0] ?? "";
    document.querySelector("[name='numeroVol']").value = r.numeroVol ?? "";
    document.querySelector("[name='lieuRDV']").value = r.lieuRDV ?? "";
    document.querySelector("[name='pack']").value = r.pack ?? "Standard";

    // Changer le bouton
    const bouton = document.querySelector("#demo-res button[type='submit']");
    bouton.textContent = "💾 Enregistrer les modifications";
    bouton.classList.add("modif-mode");

    // Montrer le bouton "Annuler"
    annulerBtn.classList.remove("hidden");

    // Scroll au formulaire
    document.getElementById("demo-res").scrollIntoView({ behavior: "smooth" });
  });
};


window.supprimerReservation = async function (id) {
  if (!confirm("❗ Supprimer cette réservation ?")) return;
  try {
    await deleteDoc(doc(db, "reservations", id));
    alert("✅ Réservation supprimée.");
  } catch (err) {
    alert("❌ Erreur : " + err.message);
    console.error(err);
  }
};

// Gestion du formulaire
document.getElementById("demo-res").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  const data = {
    clientNom: form.clientNom.value,
    clientEmail: form.clientEmail.value,
    clientPhone: form.clientPhone.value,
    dateDepart: new Date(form.dateDepart.value),
    heureVol: form.heureVol.value,
    dateRetour: new Date(form.dateRetour.value),
    numeroVol: form.numeroVol.value,
    lieuRDV: form.lieuRDV.value,
    pack: form.pack.value,
    statut: "en attente"
  };

  try {
    if (idEnCoursDeModification) {
      // 🔁 Mise à jour
      await updateDoc(doc(db, "reservations", idEnCoursDeModification), data);
      alert("✅ Réservation modifiée.");
      idEnCoursDeModification = null;
    } else {
      // 🆕 Nouvelle réservation
      await addDoc(collection(db, "reservations"), data);
      alert("✅ Réservation enregistrée.");
    }

    form.reset();
    form.clientEmail.disabled = false;
    const confirmation = document.getElementById("confirmation");
    confirmation.textContent = idEnCoursDeModification
      ? "✅ Réservation modifiée avec succès."
      : "✅ Réservation enregistrée avec succès.";

    setTimeout(() => (confirmation.textContent = ""), 4000);

    const bouton = form.querySelector("button[type='submit']");
    bouton.textContent = "Réserver";
    bouton.classList.remove("modif-mode");

  } catch (err) {
    console.error(err);
    alert("❌ Erreur lors de l'enregistrement.");
  }
});

const annulerBtn = document.getElementById("annuler-modif");
annulerBtn.addEventListener("click", () => {
  const form = document.getElementById("demo-res"); // ✅ Ajouter ça
  idEnCoursDeModification = null;
  form.reset();
  form.clientEmail.disabled = false;
  annulerBtn.classList.add("hidden");

  const bouton = form.querySelector("button[type='submit']");
  bouton.textContent = "Réserver";
  bouton.classList.remove("modif-mode");
});

