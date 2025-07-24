// Fonction pour récupérer les paramètres dans l'URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Récupération de l'id et du prix passés en query params
const idReservation = getQueryParam('id');
const prix = getQueryParam('prix');

// Affiche le prix à payer dans la page (avant le bouton)
if (prix) {
    const main = document.querySelector('main');
    const paragraph = main.querySelector('p'); // récupère le <p> existant
    const infoPrix = document.createElement('p');
    infoPrix.textContent = `Montant à payer : ${prix} €`;
    paragraph.insertAdjacentElement('afterend', infoPrix); // insère après le <p>
}

paypal.Buttons({
    createOrder: function(data, actions) {
        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: prix// prix dynamique ou valeur par défaut
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
