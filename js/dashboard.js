console.log("[dashboard] Script chargé");

import { guard } from './authGuard.js';
console.log('[dashboard] avant guard');
await guard('admin');
document.body.style.display = ""; // ← pour afficher le body après vérification
console.log('[dashboard] après guard – accès autorisé');

import { auth, db } from './firebase-config.js'; // ← si dashboard.js est dans js/


let myUID = ""; // on initialise ici

import {
  collection, getDocs, query,
  getDoc, doc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});


/* ─────────── Sélecteurs ─────────── */
const logoutBtn     = document.getElementById("logout-btn");
const searchInput   = document.getElementById("search-input");
const filterStatut  = document.getElementById("filter-statut");
const filterPack    = document.getElementById("filter-pack");

const tblAll   = document.querySelector("#table-reservations tbody");
const tblMine  = document.querySelector("#table-my tbody");
const tblFree  = document.querySelector("#table-free tbody");

const msgBox   = document.getElementById("admin-message");
const msgText  = document.getElementById("message-content");
const btnRead  = document.getElementById("dismiss-msg-btn");

let allRes   = [];   // Toutes les réservations
let nomMap   = {};   // uid → nom

function heureRDV(h) {
  const [hr, min] = h.split(":").map(Number);
  const rdv = new Date();
  rdv.setHours(hr - 2, min, 0); // -2h avant le vol
  return rdv.toTimeString().slice(0, 5);
}


/* ─────────── Sécurité d’accès ─────────── */

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  myUID = user.uid;

  const panel = document.getElementById("admin-panel");
  if (panel) panel.style.display = "block";

  // 🔁 AJOUT ICI
  const snap = await getDoc(doc(db, "users", myUID));
  const data = snap.data() ?? {};

  if (data.message) {
    msgText.textContent = data.message;
    msgBox.style.display = "block";
  } else {
    msgBox.style.display = "none";
  }

  await chargerReservations();
  console.log("[dashboard] Utilisateur détecté", user);

});


/* ─────────── Fonction principale ─────────── */
async function chargerReservations() {
  try {
    /* Étape 1 : créer la table uid → nom */
    const usersSnap = await getDocs(collection(db, "users"));
    nomMap = {};
    usersSnap.forEach(u => nomMap[u.id] = u.data().nom ?? "(sans nom)");

    /* Étape 2 : récupérer les réservations */
    const resSnap = await getDocs(query(collection(db, "reservations")));
    allRes = [];
    resSnap.forEach(d => allRes.push({ id: d.id, ...d.data() }));

    /* Étape 3 : stats globales + affichage */
    majStatsEtAffichage();
  } catch (err) {
    console.error("Erreur chargement réservations :", err);
  }
}


/* ─────────── Calcul stats + affichage ─────────── */
function majStatsEtAffichage() {
  /* Compteurs */
  let total = 0, paid = 0, canceled = 0, acompte = 0;
  let packStd = 0, packConf = 0, packVIP = 0;

  /* Remise à zéro des tableaux */
  tblAll.innerHTML  = "";
  tblMine.innerHTML = "";
  tblFree.innerHTML = "";

  /* Filtres saisie */
  const q  = searchInput?.value.toLowerCase()  ?? "";
  const st = filterStatut?.value.toLowerCase() ?? "";
  const pk = filterPack?.value.toLowerCase()   ?? "";

  allRes.forEach(r => {
    total++;
    const statut = r.statut?.toLowerCase();
    const pack   = r.pack;

    if (statut === "payé") paid++;        else if (statut === "annulé") canceled++;
    else acompte++;

    if (pack === "Standard") packStd++;   else if (pack === "Confort") packConf++;
    else if (pack === "VIP") packVIP++;

    /* Filtrage recherche + sélecteurs */
    const visible =
      (r.clientNom?.toLowerCase().includes(q) ||
       r.clientEmail?.toLowerCase().includes(q)) &&
      (st === "" || statut === st) &&
      (pk === "" || pack?.toLowerCase() === pk);

    if (!visible) return;

    /* Nom de l'admin assigné (ou texte) */
    const assignedNom = r.assignedTo
      ? (r.assignedTo === myUID ? "✅ Moi" : (nomMap[r.assignedTo] ?? "(?)"))
      : "🆓 Non assignée";

    /* Ligne HTML générique */
    const rowHTML = `
      <td>${r.clientNom}</td>
      <td><a href="mailto:${r.clientEmail}">${r.clientEmail}</a></td>
      <td><a href="tel:${r.clientPhone ?? ''}">${r.clientPhone ?? '(numéro manquant)'}</a></td>
      <td>${r.dateDepart?.toDate().toLocaleDateString('fr-FR') ?? ''}</td>
      <td>${r.heureVol ?? '(heure vol manquante)'}</td>
      <td>${r.heureVol ? heureRDV(r.heureVol) : '(rdv inconnu)'}</td>
      <td>${r.numeroVol ?? '(vol inconnu)'}</td>
      <td>${r.lieuRDV ?? 'Aéroport CDG'}</td>
      <td>${r.dateRetour?.toDate().toLocaleDateString('fr-FR') ?? ''}</td>
      <td class="statut">${r.statut}</td>
      <td>${r.pack}</td>
      <td>${!r.assignedTo
            ? `<button class="btn-assign" data-id="${r.id}">Prendre</button>`
            : assignedNom}
      </td>`;


    /* Ajout dans le bon tableau */
    const tr = document.createElement("tr");
    tr.innerHTML = rowHTML;

    tblAll.appendChild(tr);
    if (!r.assignedTo)            tblFree.appendChild(tr.cloneNode(true));
    if (r.assignedTo === myUID)   tblMine.appendChild(tr.cloneNode(true));
  });

  /* Stats */
  document.getElementById("total-count").textContent   = total;
  document.getElementById("paid-count").textContent    = paid;
  document.getElementById("cancel-count").textContent  = canceled;
  document.getElementById("acompte-count").textContent = acompte;
  document.getElementById("pack-standard").textContent = packStd;
  document.getElementById("pack-confort").textContent  = packConf;
  document.getElementById("pack-vip").textContent      = packVIP;
}

/* ─────────── Prendre en charge ─────────── */
tblAll.addEventListener("click", onAssign);
tblFree.addEventListener("click", onAssign);
function onAssign(e) {
  if (!e.target.classList.contains("btn-assign")) return;
  const id = e.target.dataset.id;

  updateDoc(doc(db, "reservations", id), {
    assignedTo: myUID,
    assignedAt: serverTimestamp()
  })
    .then(() => {
      alert("Réservation prise en charge ✔️");
      chargerReservations();
    })
    .catch(err => alert("❌ Erreur : " + err.message));
}

/* ─────────── Filtres dynamiques ─────────── */
[searchInput, filterStatut, filterPack].forEach(el =>
  el?.addEventListener("input", majStatsEtAffichage)
);

/* ─────────── Déconnexion ─────────── */
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  location.href = "login.html";
});
/* ─────────── Export CSV ─────────── */
document.getElementById("export-csv")?.addEventListener("click", () => {
  if (!allRes || allRes.length === 0) {
    return alert("Aucune réservation à exporter.");
  }

  const lignes = [
    ["Nom", "Email", "Téléphone", "Date départ", "Heure vol", "RDV voiturier", "Numéro vol", "Lieu RDV", "Date retour", "Statut", "Pack", "Pris en charge par"]
  ];


  allRes.forEach(r => {
    const rdv = r.heureVol ? heureRDV(r.heureVol) : "";
    const assigné = r.assignedTo ? (nomMap[r.assignedTo] ?? "(inconnu)") : "Non assignée";

    lignes.push([
      r.clientNom ?? "",
      r.clientEmail ?? "",
      r.clientPhone ?? "",
      r.dateDepart?.toDate().toLocaleDateString("fr-FR") ?? "",
      r.heureVol ?? "",
      r.heureVol ? heureRDV(r.heureVol) : "",
      r.numeroVol ?? "",
      r.lieuRDV ?? "Aéroport CDG",
      r.dateRetour?.toDate().toLocaleDateString("fr-FR") ?? "",
      r.statut ?? "",
      r.pack ?? "",
      assigné
]);

  });

  const contenu = lignes.map(row => row.map(v => `"${v}"`).join(";")).join("\n");
  const blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "reservations.csv";
  a.click();
});
btnRead?.addEventListener("click", async () => {
  await updateDoc(doc(db, "users", myUID), { message: "" });
  msgBox.style.display = "none";
});
