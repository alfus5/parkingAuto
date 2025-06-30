// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBgHX6LntH4HxjJEoHtkT7SfPJNvU2212A",
  authDomain: "parkingvoiturier-e5d1d.firebaseapp.com",
  projectId: "parkingvoiturier-e5d1d",
  storageBucket: "parkingvoiturier-e5d1d.appspot.com",
  messagingSenderId: "1018195310135",
  appId: "1:1018195310135:web:3cd9e527ece3e2ad1ab1b2",
};

// Initialisation
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Export
export { auth, db };

