// ✅ IMPORTS FIREBASE DEPUIS TES FICHIERS LOCAUX
import { auth, db } from './firebase-config.js';
import { saveReservation } from './firebase-reservation.js';
import { Timestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const steps = document.querySelectorAll(".form-step");
    const nextBtn = document.getElementById("nextBtn");
    const progress = document.getElementById("progressIndicator");
    const registerForm = document.getElementById("register-form");

    let currentStep = 0;
    const formData = {};

    function collectData(index) {
        const currentForm = steps[index];
        if (!currentForm) return;

        const inputs = currentForm.querySelectorAll("input, select, textarea");
        const data = {};
        inputs.forEach(input => {
            if (input.name) {
                data[input.name] = input.value;
            }
        });
        formData[`step${index + 1}`] = data;
        console.log(`✅ Données enregistrées pour l'étape ${index + 1}:`, data);
    }

    function showStep(index) {
        steps.forEach((step, i) => {
            step.classList.toggle("active", i === index);
        });
        const pourcentage = ((index + 1) / steps.length) * 100;
        progress.style.height = `${pourcentage}%`;
    }

    async function envoyerReservation(data) {
        try {
            // Conversion des dates en Timestamp Firebase
            const reservationData = {
                clientNom: data.clientNom,
                clientEmail: data.clientEmail,
                clientPhone: data.clientPhone,
                dateDepart: Timestamp.fromDate(new Date(data.dateDepart)),
                dateRetour: Timestamp.fromDate(new Date(data.dateRetour)),
                heureVol: data.heureVol,
                pack: data.pack
            };

            const id = await saveReservation(reservationData);
            console.log(`✅ Réservation enregistrée avec l'ID : ${id}`);
            alert("✅ Réservation bien prise en compte !");
        } catch (err) {
            console.error("❌ Erreur lors de l'enregistrement de la réservation :", err);
            alert("❌ Échec de la réservation. Merci de réessayer.");
        }
    }

    nextBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        // Collecte les données de l'étape en cours
        collectData(currentStep);

        if (currentStep < steps.length - 1) {
            currentStep++;
            showStep(currentStep);
        } else {
            // Étape finale : on fusionne les données pour traitement
            const step1 = formData.step1 || {};
            const step2 = formData.step2 || {};
            const fullData = { ...step1, ...step2 };

            // 1. Soumission du formulaire d'inscription (auth.js gère la création utilisateur)
            if (registerForm) {
                registerForm.requestSubmit(); // auth.js s'occupe de Firebase Auth + Firestore
            }

            // 2. Enregistrement de la réservation dans Firestore
            await envoyerReservation(fullData);
        }
    });

    showStep(currentStep);
});
// js/index.js
const offres = document.querySelectorAll('.offre');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.3 });

offres.forEach(offre => observer.observe(offre));
// Active le scroll et fait défiler doucement vers le formulaire
document.querySelector('.hero-btn').addEventListener('click', (e) => {
  e.preventDefault(); // empêche le comportement instantané

  // Active le scroll
  document.body.style.overflow = 'auto';

  // Scroll fluide vers la section formulaire
  document.querySelector('#form-step-1').scrollIntoView({
    behavior: 'smooth'
  });
});
// Désactive le scroll au chargement
document.body.style.overflow = 'hidden';

// Quand on clique sur "Réserver maintenant"
document.addEventListener('DOMContentLoaded', () => {
  const bouton = document.querySelector('.hero-btn');
  if (bouton) {
    bouton.addEventListener('click', (e) => {
      e.preventDefault();

      // Masquer la section hero
      const hero = document.getElementById('hero');
      hero.style.display = 'none';

      // Réactiver le scroll
      document.body.style.overflow = 'auto';

      // Faire défiler vers le formulaire
      document.querySelector('#form-step-1')?.scrollIntoView({
        behavior: 'smooth'
      });
    });
  }
});
const etapes = [
  {
    titre: "Étape 1 : Créez votre compte",
    texte: "Inscrivez-vous avec votre nom, téléphone et email pour accéder à nos services de réservation personnalisés."
  },
  {
    titre: "Étape 2 : Connectez-vous",
    texte: "Une fois inscrit, connectez-vous à votre espace client sécurisé."
  },
  {
    titre: "Étape 3 : Réservez votre place",
    texte: "Sélectionnez vos dates, votre pack (Standard, Confort, VIP) et complétez le formulaire de réservation."
  },
  {
    titre: "Étape 4 : Le jour J",
    texte: "Rendez-vous à l’adresse indiquée à l'heure convenue. Notre voiturier prendra en charge votre véhicule en toute sécurité."
  },
  {
    titre: "Étape 5 : Profitez de votre voyage",
    texte: "Nous gardons votre voiture dans un parking sécurisé jusqu’à votre retour. Bon voyage !"
  }
];

let indexEtape = 0;

const titreEtape = document.getElementById("etape-titre");
const texteEtape = document.getElementById("etape-texte");
const boutonPrec = document.getElementById("btn-prec");
const boutonSuiv = document.getElementById("btn-suiv");
const boutonReserver = document.getElementById("btn-reserver-final");

function afficherEtape(index) {
  const etape = etapes[index];
  titreEtape.textContent = etape.titre;
  texteEtape.textContent = etape.texte;

  boutonPrec.disabled = index === 0;
  boutonSuiv.disabled = index === etapes.length - 1;

  boutonReserver.style.display = index === etapes.length - 1 ? "inline-block" : "none";
}

boutonPrec.addEventListener("click", () => {
  if (indexEtape > 0) {
    indexEtape--;
    afficherEtape(indexEtape);
  }
});

boutonSuiv.addEventListener("click", () => {
  if (indexEtape < etapes.length - 1) {
    indexEtape++;
    afficherEtape(indexEtape);
  }
});

boutonReserver.addEventListener("click", () => {
  document.getElementById("guide-utilisation").style.display = "none";
  document.getElementById("hero").style.display = "none";
  document.querySelector("main").scrollIntoView({ behavior: "smooth" });
});

document.querySelector(".hero-btn").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("hero").style.display = "none";
  document.getElementById("guide-utilisation").style.display = "flex";
  afficherEtape(0);
});


const packContainer = document.getElementById('pack-container');

// Dupliquer le contenu pour boucle continue
packContainer.innerHTML += packContainer.innerHTML;
