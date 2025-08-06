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

let idEnCoursDeModification = null;
let annulerBtn = null;

window.payerAcompte = function (idReservation, acompte, total) {
  const popup = document.getElementById("popup-acompte");
  const montantSpan = document.getElementById("montant-acompte");
  const prixTotalSpan = document.getElementById("prix-total");
  const btnPayer = document.getElementById("btn-payer-acompte");
  const btnFermer = document.getElementById("btn-fermer-popup");
  const checkbox = document.getElementById("checkbox-conditions");

if (!popup || !montantSpan || !prixTotalSpan || !btnPayer || !btnFermer || !checkbox) {
    console.error("❌ Un élément du popup est manquant.");
    return;
  }

  // ✅ Mise à jour des montants
  montantSpan.textContent = acompte.toFixed(2);
  prixTotalSpan.textContent = total.toFixed(2);

  // ✅ Remplacer checkbox pour éviter le cumul d’event listeners
  const newCheckbox = checkbox.cloneNode(true);
  checkbox.replaceWith(newCheckbox);
  newCheckbox.checked = false;

  // ✅ Remplacer bouton Payer (évite double event)
  const newBtnPayer = btnPayer.cloneNode(true);
  btnPayer.replaceWith(newBtnPayer);
  newBtnPayer.disabled = true;

  newCheckbox.addEventListener("change", () => {
    newBtnPayer.disabled = !newCheckbox.checked;
  });

  newBtnPayer.addEventListener("click", () => {
    if (!newCheckbox.checked) return;
    const url = idReservation === "NOUVELLE"
      ? `paiement.html?montant=${acompte}&nouvelle=1`
      : `paiement.html?montant=${acompte}&id=${idReservation}`;
        window.location.href = url;
      });

  // ✅ Remplacer bouton Fermer (évite doublons aussi)
  const newBtnFermer = btnFermer.cloneNode(true);
  btnFermer.replaceWith(newBtnFermer);

  newBtnFermer.addEventListener("click", () => {
    popup.classList.add("hidden");
  });

  // ✅ Affiche proprement le popup
  popup.classList.remove("hidden");
};


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

function afficherTableauReservations(email) {
  console.log("✅ afficherTableauReservations lancé");

  const section = document.getElementById("mes-reservations");
  const tbody = document.getElementById("table-client");
  if (!tbody || !section) return;

  section.style.display = "block";

  const q = query(collection(db, "reservations"), where("clientEmail", "==", email));

  onSnapshot(q, async (snap) => {
    tbody.innerHTML = "";

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="9">Aucune réservation trouvée.</td></tr>`;
      return;
    }

    for (const docSnap of snap.docs) {
      const r = docSnap.data();
      const id = docSnap.id;
      const statut = r.statut?.toLowerCase() ?? "";
      const d1 = r.dateDepart?.toDate?.();
      const d2 = r.dateRetour?.toDate?.();
      const jours = d1 && d2 ? Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) : 1;
      const prix = calculerPrix(r.pack, jours);


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
          ${statut === "payé"
          ? "✅ Payé"
          : `<button class="btn-payer" onclick="payerReservation('${docSnap.id}', ${prix})">
          💳 Payer – ${prix.toFixed(2)} € </button>`
        }
        </td>
        <td>
          ${statut !== "payé"
          ? `
              <button class="btn-modif-res" data-id="${id}">✏️Modifier</button>
              <button class="btn-suppr-res" data-id="${id}">🗑️Supprimer</button>
              `
          : ""
        }
        </td>
      `;

      tbody.appendChild(tr);

      // ✅ Ajout des écouteurs
      const btnPayer = tr.querySelector(".btn-payer");
      // ✅ N’ajoute l'écouteur que si le bouton n'a pas d'attribut 'onclick'
      if (!btnPayer.hasAttribute("onclick")) {
        btnPayer.addEventListener("click", () => {
          const acompte = prix * 0.5;
          payerAcompte(id, acompte);
        });
      }


      const btnSupprimer = tr.querySelector(".btn-suppr-res");
      btnSupprimer?.addEventListener("click", () => {
        supprimerReservation(id);
      });

      const btnModifier = tr.querySelector(".btn-modif-res");
      btnModifier?.addEventListener("click", () => {
        modifierReservation(id);
      });

      // ✅ Bloc admin inchangé
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
  const url = `paiement.html?id=${id}&montant=${montant}`;
  window.location.href = url;
};

window.modifierReservation = function (id) {
  idEnCoursDeModification = id;
  const docRef = doc(db, "reservations", id);
  getDoc(docRef).then((snap) => {
    if (!snap.exists()) return alert("Réservation introuvable.");
    const r = snap.data();

    document.querySelector("[name='clientNom']").value = r.clientNom ?? "";
    document.querySelector("[name='clientEmail']").value = r.clientEmail ?? "";
    document.querySelector("[name='clientPhone']").value = r.clientPhone ?? "";
    document.querySelector("[name='dateDepart']").value = r.dateDepart?.toDate().toISOString().split('T')[0] ?? "";
    document.querySelector("[name='heureVol']").value = r.heureVol ?? "";
    document.querySelector("[name='dateRetour']").value = r.dateRetour?.toDate().toISOString().split('T')[0] ?? "";
    document.querySelector("[name='numeroVol']").value = r.numeroVol ?? "";
    document.querySelector("[name='lieuRDV']").value = r.lieuRDV ?? "";
    document.querySelector("[name='pack']").value = r.pack ?? "Standard";

    const bouton = document.querySelector("#demo-res button[type='submit']");
    bouton.textContent = "💾 Enregistrer les modifications";
    bouton.classList.add("modif-mode");

    annulerBtn.classList.remove("hidden");

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

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("demo-res");
  annulerBtn = document.getElementById("annuler-modif");
  const popup = document.getElementById("popup-acompte");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const dateDep = new Date(form.dateDepart.value);
      const dateRet = new Date(form.dateRetour.value);
      if (dateRet <= dateDep) {
        alert("❌ La date de retour doit être postérieure à la date de départ.");
        return;
      }

      const jours = Math.max(1, Math.ceil((dateRet - dateDep) / (1000 * 60 * 60 * 24)));
      const pack = form.pack.value;
      const prix = calculerPrix(pack, jours);
      const acompte = Math.round(prix * 0.5 * 100) / 100;

      const data = {
        clientNom: form.clientNom.value,
        clientEmail: form.clientEmail.value,
        clientPhone: form.clientPhone.value,
        dateDepart: dateDep,
        heureVol: form.heureVol.value,
        dateRetour: dateRet,
        numeroVol: form.numeroVol.value,
        lieuRDV: form.lieuRDV.value,
        pack,
        prix,
        acompte,
        statut: "en attente"
      };

      try {
        let reservationId;
        if (idEnCoursDeModification) {
          await updateDoc(doc(db, "reservations", idEnCoursDeModification), data);
          reservationId = idEnCoursDeModification;
          alert("✅ Réservation modifiée.");
          idEnCoursDeModification = null;
        } else {
          // suppression des lignes suivantes (⚠️ ne surtout pas enregistrer ici)
          // const docRef = await addDoc(collection(db, "reservations"), data);
          // reservationId = docRef.id;

          form.reset();
          form.clientEmail.disabled = false;

          const confirmation = document.getElementById("confirmation");
          confirmation.textContent = "✅ Redirection vers paiement en cours...";
          setTimeout(() => (confirmation.textContent = ""), 4000);

          const bouton = form.querySelector("button[type='submit']");
          bouton.textContent = "Réserver";
          bouton.classList.remove("modif-mode");

          // ✅ Stockage temporaire
          sessionStorage.setItem("reservationEnCours", JSON.stringify(data));

          // ✅ Redirection vers popup acompte
          payerAcompte("NOUVELLE", acompte, prix);

     
        }

        form.reset();
        form.clientEmail.disabled = false;
        const confirmation = document.getElementById("confirmation");
        confirmation.textContent = "✅ Réservation enregistrée avec succès.";
        setTimeout(() => (confirmation.textContent = ""), 4000);

        const bouton = form.querySelector("button[type='submit']");
        bouton.textContent = "Réserver";
        bouton.classList.remove("modif-mode");
              } catch (err) {
                console.error(err);
                alert("❌ Erreur lors de l'enregistrement.");
              }
            });
          }

  if (annulerBtn && form) {
    annulerBtn.addEventListener("click", () => {
      idEnCoursDeModification = null;
      form.reset();
      form.clientEmail.disabled = false;
      annulerBtn.classList.add("hidden");

      const bouton = form.querySelector("button[type='submit']");
      bouton.textContent = "Réserver";
      bouton.classList.remove("modif-mode");
    });
  }

  if (popup) popup.classList.add("hidden");
});
