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
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// 🔁 Affiche/Masque le bloc modif
function toggleModif() {
  const bloc = document.getElementById("infos-utilisateur");
  bloc.style.display = bloc.style.display === "none" ? "block" : "none";
}
window.toggleModif = toggleModif;

// 🔓 Déconnexion
function logout() {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch(err => {
    alert("Erreur lors de la déconnexion : " + err.message);
  });
}
window.logout = logout;

// ❌ Suppression de compte
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

// 🔎 Affiche les infos utilisateur
async function afficherInfosUtilisateur(user) {
  try {
    const q = query(collection(db, "users"), where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      console.log("[DEBUG] Firestore data:", data);

      if (document.getElementById("client-nom"))
        document.getElementById("client-nom").textContent = data.nom ?? "(non défini)";
      if (document.getElementById("old-nom"))
        document.getElementById("old-nom").textContent = data.nom ?? "(non défini)";
      if (document.getElementById("modif-nom"))
        document.getElementById("modif-nom").value = data.nom ?? "";

      if (document.getElementById("old-email"))
        document.getElementById("old-email").textContent = user.email ?? "(non défini)";
      if (document.getElementById("modif-email")) {
        document.getElementById("modif-email").value = user.email ?? "";
        document.getElementById("modif-email").disabled = true;
      }

      if (document.getElementById("old-tel"))
        document.getElementById("old-tel").textContent = data.telephone ?? "(non défini)";
      if (document.getElementById("modif-tel"))
        document.getElementById("modif-tel").value = data.telephone ?? "";

      if (document.getElementById("role"))
        document.getElementById("role").textContent = data.role ?? "superadmin";
    } else {
      console.warn("Aucun utilisateur trouvé avec l’email :", user.email);
    }
  } catch (err) {
    console.error("Erreur infos utilisateur :", err);
  }
}

// 🧑 Affiche les utilisateurs par rôle
async function afficherUtilisateursParRole(role, tableId) {
  const tbody = document.getElementById(tableId);
  if (!tbody) return;

  tbody.innerHTML = "";
  const q = query(collection(db, "users"), where("role", "==", role));
  const snap = await getDocs(q);

  if (snap.empty) {
    tbody.innerHTML = `<tr><td colspan="3">Aucun ${role}.</td></tr>`;
    return;
  }

  snap.forEach(doc => {
    const d = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.nom ?? "(non défini)"}</td>
      <td>${d.email ?? "(non défini)"}</td>
      <td>${d.telephone ?? "(non défini)"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 💬 Affiche les messages envoyés
async function afficherMessagesEnvoyes(uid) {
  const tbody = document.getElementById("message-list");
  if (!tbody) return;

  tbody.innerHTML = "";
  const q = query(collection(db, "messages"), where("from", "==", uid));
  const snap = await getDocs(q);

  if (snap.empty) {
    tbody.innerHTML = `<tr><td colspan="3">Aucun message envoyé.</td></tr>`;
    return;
  }

  snap.forEach(doc => {
    const d = doc.data();
    const date = d.date?.toDate().toLocaleString("fr-FR") ?? "(inconnue)";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${date}</td>
      <td>${d.texte ?? "(vide)"}</td>
      <td>${d.to ?? "(non précisé)"}</td>
    `;
    tbody.appendChild(tr);
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

    const q = query(collection(db, "users"), where("email", "==", user.email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      await updateDoc(docRef, {
        nom: newName,
        telephone: newPhone
      });
    }

    alert("✅ Informations mises à jour !");
    toggleModif();
  } catch (err) {
    alert("Erreur : " + err.message);
  }
});

// 🚀 Initialisation de la page
window.addEventListener("DOMContentLoaded", () => {
  guard("superadmin").then(async () => {
    const bloc = document.getElementById("infos-utilisateur");
    if (bloc) bloc.style.display = "none";

    onAuthStateChanged(auth, async (user) => {
      if (!user) return window.location.href = "login.html";
      await afficherInfosUtilisateur(user);
      await afficherUtilisateursParRole("admin", "admin-list");
      await afficherUtilisateursParRole("client", "client-list");
      await afficherMessagesEnvoyes(user.uid);
    });
  });
});
