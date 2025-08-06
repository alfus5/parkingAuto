import { db } from './firebase-config.js';
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

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

function afficherRecap(resa, montant, messagePaiement) {
  const recap = document.getElementById("recap-reservation");
  const ul = document.getElementById("recap-details");
  recap.style.display = "block";

  ul.innerHTML = `
    <li><strong>Date de départ :</strong> ${resa.dateDepart}</li>
    <li><strong>Date de retour :</strong> ${resa.dateRetour}</li>
    <li><strong>Pack choisi :</strong> ${resa.pack}</li>
    <li><strong>Lieu de RDV :</strong> ${resa.lieuRDV ?? "Non défini"}</li>
    <li><strong>Montant total :</strong> ${montant.toFixed(2)} €</li>
    <li><strong>Statut :</strong> ${resa.statut ?? "En attente"}</li>
    ${resa.adminNom ? `<li><strong>Pris en charge par :</strong> ${resa.adminNom}</li>` : ''}
    ${resa.adminEmail ? `<li><strong>Email du voiturier :</strong> ${resa.adminEmail}</li>` : ''}
    ${resa.adminTel ? `<li><strong>Téléphone du voiturier :</strong> ${resa.adminTel}</li>` : ''}
    <li style="margin-top: 1em; font-weight: bold;">${messagePaiement}</li>
  `;
}

window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const isNouvelle = params.get("nouvelle") === "1";

  let reservationData = null;
  let idReservation = params.get("id");

  if (isNouvelle) {
    reservationData = JSON.parse(sessionStorage.getItem("reservationEnCours"));
  } else if (!idReservation) {
    return alert("ID de réservation manquant.");
  }

  let data;
  if (isNouvelle) {
    data = reservationData;
  } else {
    const docRef = doc(db, "reservations", idReservation);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return alert("Réservation introuvable.");
    data = snap.data();
  }

  const d1 = data.dateDepart?.toDate?.() ?? new Date(data.dateDepart);
  const d2 = data.dateRetour?.toDate?.() ?? new Date(data.dateRetour);
  const jours = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  const prix = calculerPrix(data.pack, jours);
  const acompte = (prix * 0.5).toFixed(2);

  let montantAPayer;
  let messagePaiement;

  if ("resteAPayer" in data) {
    montantAPayer = data.resteAPayer;
    messagePaiement = `💳 Vous vous apprêtez à payer le reste dû : ${montantAPayer.toFixed(2)} €`;
  } else if (data.statut === "en attente" || isNouvelle) {
    montantAPayer = parseFloat(acompte);
    messagePaiement = `💳 Vous vous apprêtez à payer l’acompte de ${acompte} €`;
  } else {
    montantAPayer = prix;
    messagePaiement = `💳 Ancienne réservation : paiement complet demandé (${montantAPayer.toFixed(2)} €)`;
  }

  const resa = {
    dateDepart: d1.toLocaleDateString("fr-FR"),
    dateRetour: d2.toLocaleDateString("fr-FR"),
    pack: data.pack,
    lieuRDV: data.lieuRDV,
    statut: data.statut,
    adminNom: "",
    adminEmail: "",
    adminTel: ""
  };

  if (data.assignedTo) {
    try {
      const adminRef = doc(db, "users", data.assignedTo);
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) {
        const admin = adminSnap.data();
        resa.adminNom = admin.nom ?? "Inconnu";
        resa.adminEmail = admin.email ?? "Non défini";
        resa.adminTel = admin.telephone ?? "Non défini";
      }
    } catch (err) {
      console.error("Erreur récupération admin :", err);
    }
  }

  afficherRecap(resa, prix, messagePaiement);

  document.querySelector("main").style.display = "none";

  document.getElementById("btn-modifier").onclick = () => {
    window.location.href = `accueil.html?modif=${idReservation}`;
  };

  document.getElementById("btn-annuler").onclick = () => {
    if (confirm("Souhaitez-vous vraiment annuler votre réservation ?")) {
      window.location.href = "accueil.html";
    }
  };

  document.getElementById("btn-confirmer").onclick = () => {
    document.getElementById("recap-reservation").style.display = "none";
    const paiementSection = document.getElementById("paiement-section");
    paiementSection.style.display = "block";
    paiementSection.scrollIntoView({ behavior: "smooth" });

    const main = document.querySelector('main');
    const paragraph = main.querySelector('p');
    const infoPrix = document.createElement('p');
    infoPrix.textContent = messagePaiement;
    infoPrix.style.fontWeight = "bold";
    infoPrix.style.fontSize = "1.1rem";
    paragraph.insertAdjacentElement('afterend', infoPrix);

    paypal.Buttons({
      createOrder: function (data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: montantAPayer.toFixed(2)
            }
          }]
        });
      },
      onApprove: function (data, actions) {
        return actions.order.capture().then(async function (details) {
          alert(`✅ Paiement effectué par ${details.payer.name.given_name}`);
          if (isNouvelle) {
            reservationData.statut = "acompte";
            const docRef = await addDoc(collection(db, "reservations"), reservationData);
            const id = docRef.id;
            alert("✅ Acompte payé, réservation enregistrée !");
            window.location.href = `accueil.html?modif=${id}`;
          } else {
            await updateDoc(doc(db, "reservations", idReservation), {
              statut: "payé",
              resteAPayer: 0
            });
            alert("✅ Paiement finalisé !");
            window.location.href = "accueil.html";
          }
        });
      }
    }).render('#paypal-button-container');
  };
});
