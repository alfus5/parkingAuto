//Vérification d'envoie des données du formulaire
function checkForm(event) {
    event.preventDefault();
    
    //Initialisation de variables à partir des données du formulaires
    var formNumber = document.getElementById('form-number').value;
    var formPerson = document.getElementById('form-person').value;
    var formMonth = document.getElementsByClassName('form-date')[0].value;
    var formYear = document.getElementsByClassName('form-date')[1].value;
    var formCVV = document.getElementById('form-CVV').value;

    if (formNumber === "" || formPerson === "" || formMonth === "" || formYear === "" || formCVV === "") {
        alert("Veuillez remplir tous les champs.");
    }
    else if(formNumber.length !== 16){
        alert("Numéro de carte incorrecte.");
    }
    else if(formCVV.length !== 3){
        alert("CVV incorrecte.");
    }
    else {
        //logique payment
    }
}

paypal.Buttons({
    createOrder: function(data, actions) {
    return actions.order.create({
        purchase_units: [{
        amount: {
            value: '10.00' // Prix en euros
        }
        }]
    });
    },
    onApprove: function(data, actions) {
    return actions.order.capture().then(function(details) {
        alert('Paiement effectué par ' + details.payer.name.given_name);
        // Tu peux ici rediriger, stocker la commande, etc.
    });
    }
}).render('#paypal-button-container');