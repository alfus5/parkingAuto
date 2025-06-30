// authGuard.js
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from
  'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';

export function guard(requiredRole = null) {
  console.log('[guard] appelée – rôle demandé =', requiredRole ?? '(aucun)');

  // Cache la page tant que l’on n’a pas validé l’accès

  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      console.log('[guard] onAuthStateChanged déclenché. user =', user);

      /* --- 1) PAS CONNECTÉ --- */
      if (!user) {
        console.log('[guard] Pas d’utilisateur -> redirection login.html');
        location.href = 'login.html';
        return reject('non connecté');
      }

      /* --- 2) PAS DE RÔLE DEMANDÉ --- */
      if (!requiredRole) {
        console.log('[guard] Aucun rôle requis, accès OK');
        document.body.style.display = '';
        return resolve();
      }

      /* --- 3) VÉRIFIE LE RÔLE --- */
      try {
        const { db } = await import('./firebase-config.js');
        const { getDoc, doc } = await import(
          'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js'
        );

        const snap = await getDoc(doc(db, 'users', user.uid));
        const role = snap.exists() ? snap.data().role : null;

        console.log(`[guard] rôle Firestore = "${role}" (attendu = "${requiredRole}")`);

        if (role !== requiredRole) {
          console.log('[guard] Rôle insuffisant -> logout + redirection login');
          const { signOut } = await import(
            'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js'
          );
          await signOut(auth);
          location.href = 'login.html';
          return reject('rôle insuffisant');
        }

        console.log('[guard] Rôle correct -> affichage page');
        document.body.style.display = '';
        resolve();
      } catch (err) {
        console.error('[guard] ERREUR durant la vérif du rôle', err);
        location.href = 'login.html';
        reject(err);
      }
    });
  });
}
