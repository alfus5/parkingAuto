
import { guard } from './authGuard.js';
import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  signOut,
  deleteUser,
  updateEmail   

} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";


import {
  query,
  collection,
  where,
  getDocs,
  onSnapshot,
  getDoc,       
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";



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

const section = document.getElementById("mes-reservations");
const tbody = document.getElementById("table-client");

function heureRDV(h) {
  if (!h) return "(inconnue)";
  const [hr, min] = h.split(":").map(Number);
  const rdv = new Date();
  rdv.setHours(hr - 3, min, 0); // RDV = 3h avant
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
  const tbody = document.getElementById("table-client");

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    if (section) section.style.display = "block";

    await afficherInfosUtilisateur(user);

    const q = query(
      collection(db, "reservations"),
      where("clientEmail", "==", user.email)
    );

    onSnapshot(q, (snap) => {
      if (!tbody) return;
      tbody.innerHTML = "";

      if (snap.empty) { 
        tbody.innerHTML = `<tr><td colspan="8">Aucune réservation trouvée.</td></tr>`;
        return;
      }

      snap.forEach(doc => {
        const r = doc.data();
        const tr = document.createElement("tr");

        const tdStatut = document.createElement("td");
        if (r.statut === "acompte") {
          const btn = document.createElement("button");
          btn.textContent = "💳 Payer";
          btn.className = "payer-btn";
          btn.onclick = () => {
            window.location.href = `paiement.html?id=${doc.id}`;
          };
          tdStatut.appendChild(btn);
        } else {
          tdStatut.textContent = r.statut;
        }

        tr.innerHTML = `
          <td>${formatDate(r.dateDepart)}</td>
          <td>${r.heureVol ?? "(non précisée)"}</td>
          <td>${r.heureVol ? heureRDV(r.heureVol) : "(inconnue)"}</td>
          <td>${r.numeroVol ?? "(non précisé)"}</td>
          <td>${formatDate(r.dateRetour)}</td>
          <td>${r.pack}</td>
          <td>${r.lieuRDV ?? "Aéroport Charles de Gaulle"}</td>
        `;

        tr.appendChild(tdStatut);
        tbody.appendChild(tr);
      });
    });
  });

}


// Affiche/Masque le bloc de modification
function toggleModif() {
  const bloc = document.getElementById("infos-utilisateur");
  bloc.style.display = bloc.style.display === "none" ? "block" : "none";
}
window.toggleModif = toggleModif;

async function afficherInfosUtilisateur(user) {
  try {
    const q = query(collection(db, "users"), where("email", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();

    if (document.getElementById("old-nom"))
      document.getElementById("old-nom").textContent = data.nom ?? "(non défini)";
    if (document.getElementById("old-email"))
      document.getElementById("old-email").textContent = data.email ?? "(non défini)";
    if (document.getElementById("modif-email"))
      document.getElementById("modif-email").value = data.email ?? "";
    if (document.getElementById("old-tel"))
      document.getElementById("old-tel").textContent = data.telephone ?? "(non défini)";
    if (document.getElementById("mdp-actuel"))
      document.getElementById("mdp-actuel").textContent = "********";
    if (document.getElementById("role"))
    document.getElementById("role").textContent = data.role ?? "(non défini)";


    } else {
      console.warn("Aucune donnée utilisateur trouvée dans Firestore.");
    }

  } catch (err) {
    console.error("Erreur lors du chargement des infos utilisateur :", err);
  }
}


function logout() {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch(err => {
    alert("Erreur lors de la déconnexion : " + err.message);
  });
}

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

const form = document.getElementById("modif-form");

form?.addEventListener("submit", async e => {
  e.preventDefault();
  const user = auth.currentUser;

  const newName = document.getElementById("modif-nom").value;
  const newPhone = document.getElementById("modif-tel").value;
  const newEmail = document.getElementById("modif-email").value; // ← nouveau champ email
  const newPassword = document.getElementById("modif-mdp").value;

  try {
    if (newName && newName !== user.displayName) {
      await updateProfile(user, { displayName: newName });
    }

    const ancienEmail = user.email; // on garde l'ancien email AVANT de le modifier

    if (newEmail && newEmail !== user.email) {
      await updateEmail(user, newEmail); // ← mise à jour auth
    }

    if (newPassword) {
      await updatePassword(user, newPassword);
    }

    const q = query(collection(db, "users"), where("email", "==", ancienEmail));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, {
        telephone: newPhone,
        nom: newName,
        email: newEmail
      });
    }

    alert("✅ Informations mises à jour !");
    toggleModif();
  } catch (err) {
    alert("Erreur : " + err.message);
  }
});

window.calculerPrix = calculerPrix;

// 👉 rendre les fonctions accessibles dans le HTML
window.toggleModif = toggleModif;
window.logout = logout;
window.deleteAccount = deleteAccount; 

window.addEventListener("DOMContentLoaded", () => {
  guard().then(initPage);
});
