// Récupère les paramètres de l'URL
const params = new URLSearchParams(window.location.search);
// Extrait la valeur du paramètre "montant"
const montant = params.get("montant");
console.log("Montant récupéré :", montant);
const montantFloat = parseFloat(montant);

paypal.Buttons({
    createOrder: function(data, actions) {
        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: montantFloat// prix dynamique ou valeur par défaut
                }
            }]
        });
    },
    onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
            alert('Paiement effectué par ' + details.payer.name.given_name);
            // Ici tu peux mettre à jour le statut dans ta base avec idReservation
            // ex: updateReservationStatus(idReservation, 'payé');
        });
    }
}).render('#paypal-button-container');
