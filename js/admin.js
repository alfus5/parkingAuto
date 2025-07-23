import { guard } from './authGuard.js';
import { auth, db } from './firebase-config.js';

import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  signOut,
  deleteUser
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

import {
  query,
  collection,
  where,
  getDocs,
  onSnapshot,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

function heureRDV(h) {
  if (!h) return "(inconnue)";
  const [hr, min] = h.split(":").map(Number);
  const rdv = new Date();
  rdv.setHours(hr - 3, min, 0);
  return rdv.toTimeString().slice(0, 5);
}

function formatDate(firestoreDate) {
  try {
    return firestoreDate.toDate().toLocaleDateString("fr-FR");
  } catch {
    return "(non défini)";
  }
}

function toggleModif() {
  const bloc = document.getElementById("infos-utilisateur");
  bloc.style.display = bloc.style.display === "none" ? "block" : "none";
}
window.toggleModif = toggleModif;

function logout() {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch(err => {
    alert("Erreur lors de la déconnexion : " + err.message);
  });
}
window.logout = logout;

function deleteAccount() {
  const confirmDelete = confirm("⚠️ Êtes-vous sûr de vouloir supprimer votre compte ?");
  if (confirmDelete) {
    const user = auth.currentUser;
    deleteUser(user)
      .then(() => {
        alert("Votre compte a été supprimé.");
        window.location.href = "index.html";
      })
      .catch(err => alert("Erreur : " + err.message));
  }
}
window.deleteAccount = deleteAccount;

async function afficherInfosUtilisateur(user) {
  try {
    const q = query(collection(db, "users"), where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();

      document.getElementById("old-nom").textContent = data.nom ?? "(non défini)";
      document.getElementById("old-email").textContent = data.email ?? "(non défini)";
      document.getElementById("modif-email").value = data.email ?? "";
      document.getElementById("modif-email").disabled = true; // désactiver édition
      document.getElementById("old-tel").textContent = data.telephone ?? "(non défini)";
      document.getElementById("role").textContent = data.role ?? "(non défini)";

    }
  } catch (err) {
    console.error("Erreur infos utilisateur :", err);
  }
}

async function afficherReservations(user) {
  const tbody = document.getElementById("table-client");

  const q = query(collection(db, "reservations"), where("assignedTo", "==", user.uid));

  onSnapshot(q, (snap) => {
    tbody.innerHTML = "";
    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="8">Aucune réservation.</td></tr>`;
      return;
    }

    snap.forEach(doc => {
      const r = doc.data();
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${formatDate(r.dateDepart)}</td>
        <td>${r.heureVol ?? "(non précisée)"}</td>
        <td>${r.heureVol ? heureRDV(r.heureVol) : "(inconnue)"}</td>
        <td>${r.numeroVol ?? "(non précisé)"}</td>
        <td>${formatDate(r.dateRetour)}</td>
        <td>${r.pack}</td>
        <td>${r.lieuRDV ?? "CDG"}</td>
        <td>${r.statut}</td>
      `;

      tbody.appendChild(tr);
    });
  });
}

async function initPage() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = "login.html";
    await afficherInfosUtilisateur(user);
    await afficherReservations(user);
  });
}

// 🔧 Formulaire de modification
const form = document.getElementById("modif-form");
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;

  const newName = document.getElementById("modif-nom").value;
  const newPhone = document.getElementById("modif-tel").value;
  const newPassword = document.getElementById("modif-mdp").value;

  try {
    if (newName && newName !== user.displayName) {
      await updateProfile(user, { displayName: newName });
    }

    if (newPassword) {
      await updatePassword(user, newPassword);
    }

    // Mettre à jour Firestore (pas l'email)
    const q = query(collection(db, "users"), where("email", "==", user.email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        telephone: newPhone,
        nom: newName
      });
    }

    alert("✅ Informations mises à jour !");
    toggleModif();
  } catch (err) {
    alert("Erreur : " + err.message);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  guard("admin").then(initPage);
});
