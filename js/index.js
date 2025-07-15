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
