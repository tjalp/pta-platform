fetch('/save', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: name,
    times: times,
  })
});

function verzendAanvraag() {
    // Verkrijg formuliergegevens
    var naam = document.getElementById('naam').value;
    var email = document.getElementById('email').value;

    // Creëer een XMLHttpRequest-object
    var xhr = new XMLHttpRequest();

    // Configureer het verzoek
    xhr.open('POST', 'jouw_backend_url', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    // Definieer de callbackfunctie die wordt aangeroepen bij het voltooien van het verzoek
    xhr.onload = function () {
        if (xhr.status === 200) {
            document.getElementById('resultaat').innerHTML = 'Aanvraag succesvol verzonden!';
        } else {
            document.getElementById('resultaat').innerHTML = 'Fout bij het verzenden van de aanvraag. Probeer het opnieuw.';
        }
    };

    // Converteer gegevens naar JSON-indeling en verstuur het verzoek
    var data = {
        naam: naam,
        email: email
    };
    xhr.send(JSON.stringify(data));
}