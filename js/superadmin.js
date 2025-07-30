import { guard } from "./authGuard.js";
await guard("superadmin");

// … code superadmin.js …
import {  addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";


import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

import {
  getDoc, doc, collection, getDocs, updateDoc,
  query, where, writeBatch, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});



// 🔐 Sécurité d'accès Superadmin
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "login.html";

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const role = userDoc.exists() ? userDoc.data().role : null;

  if (role !== "superadmin") {
    await signOut(auth);
    alert("🚫 Accès réservé au Superadmin.");
    return location.href = "login.html";
  }

  document.getElementById("superadmin-panel").style.display = "block";
  document.getElementById("logout-btn").style.display = "inline-block";

  chargerUtilisateurs();
  chargerReservations();
  document.getElementById("search-input")?.addEventListener("input", chargerReservations);
  document.getElementById("filter-statut")?.addEventListener("change", chargerReservations);
  document.getElementById("filter-pack")?.addEventListener("change", chargerReservations);
  document.getElementById("global-filter")?.addEventListener("input", () => {
    chargerUtilisateurs();
    chargerReservations();
  });

});

// 📂 Liste des utilisateurs
async function chargerUtilisateurs() {
  const usersSnap = await getDocs(collection(db, "users"));
  const globalQuery = document.getElementById("global-filter")?.value?.toLowerCase() || "";

  const table = document.querySelector("#users-table tbody");
  table.innerHTML = "";

  usersSnap.forEach(docu => {
    const user = docu.data();
    const uid = docu.id;
    if (user.role === "superadmin") return;
    if (
      globalQuery &&
      !(
        (user.nom ?? "").toLowerCase().includes(globalQuery) ||
        (user.email ?? "").toLowerCase().includes(globalQuery) ||
        (user.telephone ?? "").toLowerCase().includes(globalQuery) ||
        (user.role ?? "").toLowerCase().includes(globalQuery)
      )
    ) return;


    const messageStatut = user.message
      ? (user.messageVu ? "✔️ Vu" : "📨 Non lu")
      : "—";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.nom ?? "(nom manquant)"}</td>
      <td><a href="mailto:${user.email}">${user.email}</a></td>
      <td><a href="tel:${user.telephone ?? ''}">${user.telephone ?? '(manquant)'}</a></td>
      <td>${user.role ?? "(rôle inconnu)"}</td>
      <td>${messageStatut}</td>
      <td>
        <button onclick="changerRole('${uid}', '${user.role}')">Changer rôle</button>
        <button onclick="envoyerMessage('${uid}', '${user.nom ?? 'cet utilisateur'}')">Message</button>
        <button onclick="supprimerUtilisateur('${uid}', '${user.nom ?? 'cet utilisateur'}')">🗑️ Supprimer</button>

        </td>
    `;
    table.appendChild(row);
  });
}

// 🎭 Changer le rôle
window.changerRole = async (uid, currentRole) => {
  const nouveauRole = currentRole === "admin" ? "client" : "admin";
  if (confirm(`Changer le rôle en "${nouveauRole}" ?`)) {
    await updateDoc(doc(db, "users", uid), { role: nouveauRole });
    alert("✅ Rôle mis à jour.");
    chargerUtilisateurs();
  }
};

// ✉️ Envoyer un message personnalisé
window.envoyerMessage = async (uid, nom) => {
  const message = prompt(`Message pour ${nom} :`);
  if (message) {
    await updateDoc(doc(db, "users", uid), {
      message: message,
      messageVu: false
    });
    alert("📨 Message envoyé !");
    chargerUtilisateurs();
  }
};

// ⏱️ Calcul RDV voiturier (2h avant vol)
function calculHeureRDV(heureVol) {
  if (!heureVol) return "";
  const [h, m] = heureVol.split(":").map(Number);
  const date = new Date();
  date.setHours(h - 2, m, 0);
  return date.toTimeString().slice(0, 5);
}

// 📋 Réservations
async function chargerReservations() {
  const resSnap = await getDocs(collection(db, "reservations"));
  const usersSnap = await getDocs(collection(db, "users"));

  const uidToName = {};
  usersSnap.forEach(doc => {
    const data = doc.data();
    uidToName[doc.id] = data.nom ?? "(nom inconnu)";
  });

  const table = document.querySelector("#reservations-table tbody");
  table.innerHTML = "";

  // ----- Compteurs stats -----
  let total = 0, paid = 0, canceled = 0, acompte = 0;
  let packStd = 0, packConf = 0, packVIP = 0;

  resSnap.forEach(docu => {
    const r = docu.data();
    // 🔎 Filtres dynamiques
    const searchQuery = document.getElementById("search-input")?.value?.toLowerCase() || "";
    const selectedStatut = document.getElementById("filter-statut")?.value || "";
    const selectedPack = document.getElementById("filter-pack")?.value || "";
    const globalQuery = document.getElementById("global-filter")?.value?.toLowerCase() || "";


    if (
      (selectedStatut && r.statut !== selectedStatut) ||
      (selectedPack && r.pack !== selectedPack) ||
      (searchQuery && !(
        r.clientNom?.toLowerCase().includes(searchQuery) ||
        r.clientEmail?.toLowerCase().includes(searchQuery)
      ))
    ) return;

    if (
      globalQuery && !(
        (r.clientNom ?? "").toLowerCase().includes(globalQuery) ||
        (r.clientEmail ?? "").toLowerCase().includes(globalQuery) ||
        (r.clientPhone ?? "").toLowerCase().includes(globalQuery) ||
        (r.lieu ?? "").toLowerCase().includes(globalQuery) ||
        (r.numVol ?? "").toLowerCase().includes(globalQuery) ||
        (r.statut ?? "").toLowerCase().includes(globalQuery) ||
        (r.pack ?? "").toLowerCase().includes(globalQuery) ||
        (r.dateDepart?.toDate().toLocaleDateString("fr-FR") ?? "").includes(globalQuery) ||
        (r.dateRetour?.toDate().toLocaleDateString("fr-FR") ?? "").includes(globalQuery)
      )
    ) return;


    total++;

    // Statut
    const statut = r.statut?.toLowerCase();
    if (statut === "payé") paid++;
    else if (statut === "annulé") canceled++;
    else acompte++;

    // Pack
    if (r.pack === "Standard") packStd++;
    else if (r.pack === "Confort") packConf++;
    else if (r.pack === "VIP") packVIP++;

    // Affectation
    const assigné = r.assignedTo ? (uidToName[r.assignedTo] ?? r.assignedTo) : "🆓 Non assignée";
    const rdvHeure = calculHeureRDV(r.heureVol);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.clientNom}</td>
      <td><a href="mailto:${r.clientEmail}">${r.clientEmail}</a></td>
      <td><a href="tel:${r.clientPhone ?? ''}">${r.clientPhone ?? "(manquant)"}</a></td>
      <td>${r.dateDepart?.toDate().toLocaleDateString("fr-FR") ?? ""}</td>
      <td>${r.heureVol ?? "(?)"}</td>
      <td>${rdvHeure}</td>
      <td>${r.dateRetour?.toDate().toLocaleDateString("fr-FR") ?? ""}</td>
      <td>${r.statut}</td>
      <td>${r.pack}</td>
      <td>—</td>
      <td>${assigné}</td>
    `;
    table.appendChild(row);
  });

  // ----- Affichage des stats -----
  document.getElementById("total-count").textContent   = total;
  document.getElementById("paid-count").textContent    = paid;
  document.getElementById("cancel-count").textContent  = canceled;
  document.getElementById("acompte-count").textContent = acompte;
  document.getElementById("pack-standard").textContent = packStd;
  document.getElementById("pack-confort").textContent  = packConf;
  document.getElementById("pack-vip").textContent      = packVIP;
}

window.majStatut = async (resId, nouveauStatut) => {
  if (!confirm(`Confirmer le changement de statut en "${nouveauStatut}" ?`)) return;
  try {
    await updateDoc(doc(db, "reservations", resId), {
      statut: nouveauStatut
    });
    alert("✅ Statut mis à jour !");
    chargerReservations(); // recharge le tableau
  } catch (err) {
    alert("❌ Erreur : " + err.message);
    console.error(err);
  }
};
// 🗑️ Supprimer utilisateur + ses réservations
window.supprimerUtilisateur = async (uid, nom) => {
  if (!confirm(`Supprimer ${nom} et TOUTES ses réservations ?`)) return;

  try {
    // 1) supprimer les réservations liées
    const q = query(collection(db, "reservations"), where("uid", "==", uid));
    const snap = await getDocs(q);

    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(doc(db, "reservations", d.id)));
    await batch.commit();

    // 2) supprimer le document utilisateur
    await deleteDoc(doc(db, "users", uid));

    alert("✅ Compte & réservations supprimés.");
    chargerUtilisateurs();
    chargerReservations();



  } catch (err) {
    console.error(err);
    alert("❌ Erreur : " + err.message);
  }
};



// 🔧 superadmin.js – affichage des messages

async function chargerMessages() {
  const snap = await getDocs(collection(db, "messages"));
  const tbody = document.querySelector("#messages-table tbody");
  tbody.innerHTML = "";

  snap.forEach(docu => {
    const d = docu.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${d.nom}</td>
      <td><a href="mailto:${d.email}">${d.email}</a></td>
      <td>${d.message}</td>
      <td>${d.createdAt?.toDate().toLocaleString("fr-FR") ?? "—"}</td>
      <td>
        ${d.lu ? '✔️ Lu' : '📨 Non lu'} 
        <button onclick="toggleLu('${docu.id}', ${d.lu})">Marquer ${d.lu ? 'non lu' : 'lu'}</button>
      </td>
          `;
    tbody.appendChild(row);
  });
}
window.toggleLu = async (id, actuel) => {
  const ref = doc(db, "messages", id);
  await updateDoc(ref, { lu: !actuel });
  chargerMessages();
};

// Appeler cette fonction après chargement superadmin
chargerMessages();