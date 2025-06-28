import { initializeApp }  from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics }   from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBgHX6LntH4HxjJEoHtkT7SfPJNvU2212A",
  authDomain: "parkingvoiturier-e5d1d.firebaseapp.com",
  projectId: "parkingvoiturier-e5d1d",
  storageBucket: "parkingvoiturier-e5d1d.appspot.com",
  messagingSenderId: "1018195310135",
  appId: "1:1018195310135:web:3cd9e527ece3e2ad1ab1b2",
  measurementId: "G-6XF50Q5HRQ"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

export const auth = getAuth(app);
export const db   = getFirestore(app);
window.auth = auth;
window.db = db;
