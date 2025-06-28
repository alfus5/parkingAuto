import { db, auth } from './firebase-config.js';
import {
  collection, getDocs, query, where,
  getDoc, doc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const exportBtn = document.getElementById("export-csv");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.warn("❌ Aucun utilisateur connecté. Export désactivé.");
    exportBtn.disabled = true;
    return;
  }

  console.log("✅ Utilisateur connecté :", user.email, user.uid);

  exportBtn.addEventListener("click", async () => {
    let isAdmin = false;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      isAdmin = userDoc.exists() && userDoc.data().role === "admin";
    } catch (err) {
      console.error("❌ Erreur lors de la vérification du rôle :", err);
    }

    const q = isAdmin
      ? query(collection(db, "reservations"))
      : query(collection(db, "reservations"), where("uid", "==", user.uid));

    try {
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("Aucune réservation trouvée.");
        return;
      }

      const header = ["Nom","Email","Départ","Retour","Pack","Statut"];
      const csvRows = [header.join(";")];

      snap.forEach(docSnap => {
        const r = docSnap.data();
        csvRows.push([
          r.clientNom,
          r.clientEmail,
          r.dateDepart?.toDate().toISOString().split("T")[0] ?? "",
          r.dateRetour?.toDate().toISOString().split("T")[0] ?? "",
          r.pack,
          r.statut
        ].join(";"));
      });

      const csv = csvRows.join("\n");
      const blob = new Blob([csv], {type: "text/csv"});
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), {
        href: url,
        download: `reservations_${Date.now()}.csv`
      });
      a.click();
      URL.revokeObjectURL(url);
      alert("✅ CSV téléchargé !");
    } catch (err) {
      alert("❌ Erreur Firestore : " + err.message);
      console.error(err);
    }
  });
});

