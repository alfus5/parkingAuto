import { db, auth } from './firebase-config.js';
import {
  collection, addDoc, getDocs, query, where, Timestamp
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

export async function saveReservation(data) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  const ref = await addDoc(collection(db, "reservations"), {
    ...data,
    uid: user.uid,                          // ← ici on enregistre qui a réservé
    statut: "acompte",
    createdAt: Timestamp.now()
  });
  return ref.id;
}


export async function getReservations(statut = null) {
  const col  = collection(db, "reservations");
  const snap = statut
    ? await getDocs(query(col, where("statut", "==", statut)))
    : await getDocs(col);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
