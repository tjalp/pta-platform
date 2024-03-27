function voegExtraVeldToe(containerId, type, waarde = '') {
    let container = document.getElementById(containerId);
    let fieldContainer = document.createElement('div');

    let input = document.createElement('input');
    input.setAttribute('type', type);
    input.value = waarde;

    // Voor nummervelden voegen we een specifieke klasse toe
    if (type === 'number') {
        input.setAttribute('class', 'adminveld');
    }

    let verwijderKnop = document.createElement('button');
    verwijderKnop.textContent = 'X'; // Gebruik 'X' voor de verwijderknop
    verwijderKnop.type = 'button';
    verwijderKnop.onclick = function () {
        fieldContainer.parentNode.removeChild(fieldContainer);
    };

    fieldContainer.appendChild(input);
    fieldContainer.appendChild(verwijderKnop);
    container.appendChild(fieldContainer);
}

function verwijderSpecifiekVeld(veldId) {
    let veldOmTeVerwijderen = document.getElementById(veldId);
    veldOmTeVerwijderen.parentNode.removeChild(veldOmTeVerwijderen);
}


/* SOORTEN TOETSEN */

function toetssoortenLaden(toetssen) {
    const locatie = document.getElementById('kloonbareVeld1');
    locatie.innerHTML = ''; // Leeg de container voor nieuwe invoer
    toetssen.forEach(toets => {
        voegExtraVeldToe('kloonbareVeld1', 'text', toets);
    });
}


function toetssoortenVersturen() {
    event.preventDefault();

    var tijdsmogelijkheden = [];
    var velden = document.querySelectorAll('#kloonbareVeld1 input');


    velden.forEach(function (veld) {
        tijdsmogelijkheden.push(veld.value);
    });
    fetch('/api/defaults/types', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tijdsmogelijkheden) // Verzend de array als JSON
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data sent successfully:', data);
        })
        .catch(error => {
            console.error('Error sending data:', error);
        });
}

function toetsSoortenOphalen() {
    fetch(`/api/defaults/types`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Netwerkrespons was niet ok');
            }
            return response.json();
        })
        .then(data => {
            let toetsSoorten = data;
            toetssoortenLaden(toetsSoorten)
        })
        .catch(error => {
            console.error('Fout bij het laden:', error);
        });
}

/* TIJDSMOGELIJKHEDEN */

function tijdsMogelijkhedenVersturen() {
    event.preventDefault();

    var tijdsmogelijkheden = [];
    var velden = document.querySelectorAll('#kloonbareVeld2 input');


    velden.forEach(function (veld) {
        tijdsmogelijkheden.push(parseInt(veld.value));
    });
    fetch('/api/defaults/durations', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tijdsmogelijkheden) // Verzend de array als JSON
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data sent successfully:', data);
        })
        .catch(error => {
            console.error('Error sending data:', error);
        });
}



function tijdsMogelijkhedenOphalen() {
    fetch(`/api/defaults/durations`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Netwerkrespons was niet ok');
            }
            return response.json();
        })
        .then(data => {
            let tijdsmogelijkheden = data;
            tijdsmogelijkhedenLaden(tijdsmogelijkheden)
        })
        .catch(error => {
            console.error('Fout bij het laden:', error);
        });
}

function tijdsmogelijkhedenLaden(tijden) {
    const locatie = document.getElementById('kloonbareVeld2');
    locatie.innerHTML = ''; // Maak de container leeg voor nieuwe invoer
    tijden.forEach(tijd => {
        voegExtraVeldToe('kloonbareVeld2', 'number', tijd);
    });
}

/* Hulpmiddelen */
function hulpmiddelenOpslaan() {
    event.preventDefault(); // Voorkom de standaardformulier verzending
    const form = document.querySelector('#hulpmiddelenform');
    const inputs = form.querySelectorAll('input[type="text"]'); // Zorg ervoor dat we alleen tekstvelden verzamelen
    let data = []; // Verander dit naar een array

    inputs.forEach((input) => {
        data.push(input.value);
    });

    fetch('/api/defaults/tools', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // Verzend de array als JSON
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data sent successfully:', data);
        })
        .catch(error => {
            console.error('Error sending data:', error);
        });
}

function hulpmiddelenOphalen() {
    fetch(`/api/defaults/tools`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Netwerkrespons was niet ok');
            }
            return response.json();
        })
        .then(data => {
            hulpmiddelen = data;
            hulpmiddelenLaden(hulpmiddelen)
        })
        .catch(error => {
            console.error('Fout bij het laden:', error);
        });
}

function hulpmiddelenLaden(hulpmiddelen) {
    const locatie = document.getElementById('kloonbareVeld3');
    locatie.innerHTML = ''; // Zorg ervoor dat de container leeg is voor nieuwe invoer
    hulpmiddelen.forEach((hulpmiddel, index) => {
      voegExtraVeldToe('kloonbareVeld3', 'text', hulpmiddel);
    });
  }
  

function dataVersturen(event) {
    event.preventDefault(); // Voorkomt dat het formulier echt wordt ingediend

    // Vind alle input velden binnen het formulier
    var inputs = document.querySelectorAll('#AanpassingenVoorDropdown input[type="text"]');
    var data = {};
    inputs.forEach(function (input, index) {
        data[input.name] = input.value; // Voeg de naam en waarde van elk veld toe aan het data object
    }); // Log de verzamelde data naar de console

    // Hier kan je de data versturen naar een server of iets anders doen met de data
}

function verwijderVeld(containerId) {
    var container = document.getElementById(containerId);
    if (container.children.length > 1) { // Controleert of er meer dan één veld is
        container.removeChild(container.lastChild);
    } else {
        alert('Er kunnen niet meer velden verwijderd worden.');
    }
}

function PaginaTerug() {
    window.location.href = 'options.html';
}

function voegExtraVakToe(containerId, aantalId) {
    var container = document.getElementById(containerId);
    var aantal = document.getElementById(aantalId).value
    for (i = 0; i < aantal; i++) {
        var newFieldNumber = container.children.length + 1;

        // Create a div to contain the label and input
        var fieldContainer = document.createElement('div');

        var label = document.createElement('label');
        label.setAttribute('for', containerId + '_field' + newFieldNumber);
        label.textContent = 'vak ' + newFieldNumber + ':';

        var input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('id', containerId + '_field' + newFieldNumber);
        input.setAttribute('name', containerId + '_field' + newFieldNumber);

        // Append label and input to the field container
        fieldContainer.appendChild(label);
        fieldContainer.appendChild(input);

        // Append the field container to the main container
        container.appendChild(fieldContainer);
    }
}

function vakkenPtaOpslaan() {
    event.preventDefault(); // Voorkom het standaard verzenden van het formulier

    // Leeg de form VerantwoordelijkeDocentenPta voordat je nieuwe velden toevoegt
    var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
    formDocentenPta.innerHTML = '';

    // Een lijst van alle vakken containers met hun respectievelijke niveaus en jaargangen
    var containers = [
        { id: 'vakkenVwo6', niveau: '6 Vwo' },
        { id: 'vakkenVwo5', niveau: '5 Vwo' },
        { id: 'vakkenVwo4', niveau: '4 Vwo' },
        { id: 'vakkenHavo5', niveau: '5 Havo' },
        { id: 'vakkenHavo4', niveau: '4 Havo' },
        { id: 'vakkenMavo4', niveau: '4 Mavo' },
        { id: 'vakkenMavo3', niveau: '3 Mavo' }
    ];

    // Loop door elke container en verwerk de vakken
    containers.forEach(function (container) {
        var vakkenInputs = document.querySelectorAll('#' + container.id + ' input[type="text"]');
        vakkenInputs.forEach(function (input, index) {
            var volledigeNaam = input.value + ' (' + container.niveau + ')'; // Combineer de vaknaam met het niveau en jaargang
            var label = document.createElement('label');
            label.setAttribute('for', 'docent_' + container.id + '_' + index);
            label.textContent = volledigeNaam + ':';

            var inputDocent = document.createElement('input');
            inputDocent.setAttribute('type', 'text');
            inputDocent.setAttribute('id', 'docent_' + container.id + '_' + index);
            inputDocent.setAttribute('name', 'docent_' + container.id + '_' + index);

            formDocentenPta.appendChild(label);
            formDocentenPta.appendChild(inputDocent);
            formDocentenPta.appendChild(document.createElement('br')); // Voeg een line break toe voor nette indeling
        });
    });
}

function docentenOphalen() {
    fetch('/api/user/all')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            docentenLaden(data);
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
}

function wachtwoordGenereren(lengte) {
    const karakters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let wachtwoord = '';
    for (let i = 0; i < lengte; i++) {
      wachtwoord += karakters.charAt(Math.floor(Math.random() * karakters.length));
    }
    return wachtwoord;
  }
  
  function docentenLaden(data) {
    console.log(data)
    const container = document.getElementById('docentenVeldenContainer');
    container.innerHTML = ''; // Verwijdert bestaande docentenvelden indien nodig
  
    data.forEach((docent, index) => {
      const div = document.createElement('div');
      div.setAttribute('id', `docent_${docent.abbreviation}_${index}`);
  
      const label = document.createElement('label');
      label.setAttribute('for', `wachtwoord_${docent.abbreviation}`);
      label.textContent = `${docent.abbreviation}:`;
  
      const input = document.createElement('input');
      input.type = 'text';
      input.id = `wachtwoord_${docent.abbreviation}`;
      input.placeholder = 'Wachtwoord';
      input.value = wachtwoordGenereren(8); // Genereert een wachtwoord
  
      const verwijderKnop = document.createElement('button');
      verwijderKnop.textContent = 'X';
      verwijderKnop.type = 'button';
      verwijderKnop.onclick = () => div.remove(); // Verwijdert het specifieke veld
  
      div.appendChild(label);
      div.appendChild(input);
      div.appendChild(verwijderKnop);
  
      container.appendChild(div);
    });
  }

  function voegDocentToe() { 
    const container = document.getElementById('docentenVeldenContainer');
    const div = document.createElement('div');
    div.setAttribute('id', `docent_nieuw_${container.children.length}`);
  
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Afkorting docent';
    input.value = ''; // Laat de gebruiker de afkorting invullen
  
    const wachtwoordInput = document.createElement('input');
    wachtwoordInput.type = 'text';
    wachtwoordInput.placeholder = 'Wachtwoord';
    wachtwoordInput.value = wachtwoordGenereren(8); // Genereert een wachtwoord
  
    const verwijderKnop = document.createElement('button');
    verwijderKnop.textContent = 'X';
    verwijderKnop.type = 'button';
    verwijderKnop.onclick = () => div.remove();
  
    div.appendChild(input);
    div.appendChild(wachtwoordInput);
    div.appendChild(verwijderKnop);
  
    container.appendChild(div);
  }
  
  
function docentenAccountsOpslaan() {
    event.preventDefault(); // Prevent the default form submission

    // Gather data from the form
    var docentenData = [];
    var inputs = document.querySelectorAll('#DocentenAccounts input[type="text"]');
    inputs.forEach(function (input) {
        fetch(`/api/user/${input.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: input.id, password: input.value })
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }).then(data => {
            console.log('Data received:', data);
        }).catch(error => {
            console.error('Error sending data:', error);
        })
        docentenData.push({
            id: input.id,
            abbreviation: input.value
        });
    });
}

function vakkenOphalen() {
    fetch(`/api/defaults/subjects`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Netwerkrespons was niet ok');
            }
            return response.json();
        })
        .then(data => {
            vakken = data;
            vakkenLaden()
        })
        .catch(error => {
            console.error('Fout bij het laden:', error);
        });
}

function sorteerVakken(vakken) {
    const niveauGewicht = { 'mavo': 1, 'havo': 2, 'vwo': 3 };
    
    return vakken.sort((a, b) => {
      if (a.name === b.name) {
        const niveauA = niveauGewicht[a.level.split(' ')[1].toLowerCase()];
        const niveauB = niveauGewicht[b.level.split(' ')[1].toLowerCase()];
        const jaarlaagA = parseInt(a.level.split(' ')[0]);
        const jaarlaagB = parseInt(b.level.split(' ')[0]);
  
        if (niveauA === niveauB) {
          return jaarlaagA - jaarlaagB; // Sorteer op jaarlaag als het niveau hetzelfde is
        } 
        return niveauA - niveauB; // Sorteer op niveau als de vaknaam hetzelfde is
      }
      return a.name.localeCompare(b.name); // Standaard sortering op vaknaam
    });
  }

function vakkenLaden() {
    const formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
    const gesorteerdeVakken = sorteerVakken(vakken); // Gebruik de aangepaste sorteerfunctie

    gesorteerdeVakken.forEach((vak, index) => {
        const div = document.createElement('div');
        div.setAttribute('id', `vak_${index}`);

        const label = document.createElement('label');
        label.textContent = `${vak.name} (${vak.level}):`;

        const inputDocent = document.createElement('input');
        inputDocent.type = 'text';
        inputDocent.setAttribute('niveau', vak.level.split(/\s+/)[1]);
        inputDocent.setAttribute('jaarlaag', vak.level.split(/\s+/)[0]);
        inputDocent.maxLength = 3;
        inputDocent.setAttribute('vak', vak.name);
        inputDocent.id = `docent_${index}`;
        inputDocent.placeholder = 'Afkorting docent';
        inputDocent.name = `docent_${index}`;
        inputDocent.value = vak.responsible;

        const verwijderKnop = document.createElement('button');
        verwijderKnop.textContent = 'X'; // Of gebruik een afbeelding met prullenbak icoon
        verwijderKnop.onclick = () => verwijderSpecifiekVeld(div.id);
        verwijderKnop.type = 'button';

        div.appendChild(label);
        div.appendChild(inputDocent);
        div.appendChild(verwijderKnop);

        formDocentenPta.appendChild(div);
    });
}

function periodesOpslaan(event) {
    event.preventDefault(); // Prevent the default form submission

    // Gather data from the form
    var periodesData = [
        {
            start_week: parseInt(document.getElementById("startPeriode1").value),
            end_week: parseInt(document.getElementById("eindPeriode1").value)
        },
        {
            start_week: parseInt(document.getElementById("eindPeriode1").value) + 1,
            end_week: parseInt(document.getElementById("eindPeriode2").value)
        },
        {
            start_week: parseInt(document.getElementById("eindPeriode2").value) + 1,
            end_week: parseInt(document.getElementById("eindPeriode3").value)
        },
        {
            start_week: parseInt(document.getElementById("eindPeriode3").value) + 1,
            end_week: parseInt(document.getElementById("eindPeriode4").value)
        }
    ];

    // Send the data to your backend using fetch

    fetch('/api/defaults/periodes', {
        method: 'PUT', // Or 'PUT', 'PATCH', etc. depending on your backend
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(periodesData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle the response from your backend if needed
            console.log('Data sent successfully:', data);
        })
        .catch(error => {
            console.error('Error sending data:', error);
        });
}


function vakToevoegen() {
    event.preventDefault(); // Voorkom de standaardformulier verzending

    // Haal de vaknaam, niveau en jaarlaag op uit het formulier VakkenPtaSchool
    var vaknaam = document.getElementById('vaknaam').value;
    var niveau = document.getElementById('niveau').value;
    var jaarlaag = document.getElementById('jaarlaag').options[document.getElementById('jaarlaag').selectedIndex].text;
    if (niveau == "alle") {
        alert("geef bij alle altijd alle jaarlagen aan")
        return
    }
    var bestaandeVakken = document.querySelectorAll('#VerantwoordelijkeDocentenPta input[type="text"]');
    for (var i = 0; i < bestaandeVakken.length; i++) {
        if (bestaandeVakken[i].getAttribute('vak') === vaknaam && bestaandeVakken[i].getAttribute('niveau') === niveau && bestaandeVakken[i].getAttribute('jaarlaag') === jaarlaag) {
            alert('Dit vak is al toegevoegd.');
            return;
        }
    }

    if (niveau == "Alle" && jaarlaag == "alle jaarlagen") {
        let niveaus = ["Mavo", "Havo", "Vwo"]
        for (let j = 0; j < niveaus.length; j++) {
            if (niveaus[j] == 'Vwo') {
                for (let i = 4; i < 7; i++) {
                    var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
                    var label = document.createElement('label');
                    label.textContent = vaknaam + " (" + i + ' ' + niveaus[j] + "): ";
                    label.setAttribute('for', vaknaam + '_' + niveaus[j] + '_' + i)
                    var icon = document.createElement('img')
                    icon.setAttribute('src', '/prullenbak.png')
                    icon.setAttribute('width', 25)
                    icon.setAttribute('height', 25)
                    icon.setAttribute('onclick', 'verwijderVak(' + vaknaam + '_' + niveau + '_' + i + ')')
                    var inputDocent = document.createElement('input');
                    inputDocent.setAttribute('type', 'text');
                    inputDocent.setAttribute('id', vaknaam + '_' + niveaus[j] + '_' + i);
                    inputDocent.setAttribute('jaarlaag', i);
                    inputDocent.setAttribute('maxlength', 3)
                    inputDocent.setAttribute('placeholder', 'afkorting docent')
                    inputDocent.setAttribute('vak', vaknaam);
                    inputDocent.setAttribute('niveau', niveaus[j]);
                    inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveaus[j] + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
                    var div = document.createElement('div')
                    div.appendChild(label);
                    div.appendChild(icon);
                    div.appendChild(inputDocent);
                    if (bestaandeVakken.length > 0) {
                        if (VakkenControleren(i, niveau[j], vaknaam, bestaandeVakken)) {
                            alert('Dit vak is al toegevoegd.');
                        } else {
                            formDocentenPta.appendChild(div);
                        }
                    } else {
                        formDocentenPta.appendChild(div);
                    }
                }
            } else if (niveaus[j] == 'Havo') {
                for (let i = 4; i < 6; i++) {
                    var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
                    var label = document.createElement('label');
                    label.textContent = vaknaam + " (" + i + ' ' + niveaus[j] + "): ";
                    label.setAttribute('for', vaknaam + '_' + niveaus[j] + '_' + i)
                    var icon = document.createElement('img')
                    icon.setAttribute('src', '/prullenbak.png')
                    icon.setAttribute('width', 25)
                    icon.setAttribute('height', 25)
                    icon.setAttribute('onclick', 'verwijderVak(' + vaknaam + '_' + niveau + '_' + i + ')')
                    var inputDocent = document.createElement('input');
                    inputDocent.setAttribute('type', 'text');
                    inputDocent.setAttribute('id', vaknaam + '_' + niveaus[j] + '_' + i);
                    inputDocent.setAttribute('jaarlaag', i);
                    inputDocent.setAttribute('maxlength', 3)
                    inputDocent.setAttribute('placeholder', 'afkorting docent')
                    inputDocent.setAttribute('vak', vaknaam);
                    inputDocent.setAttribute('niveau', niveaus[j]);
                    inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveaus[j] + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
                    var div = document.createElement('div')
                    div.appendChild(label);
                    div.appendChild(icon);
                    div.appendChild(inputDocent);
                    if (bestaandeVakken.length > 0) {
                        if (VakkenControleren(i, niveau[j], vaknaam, bestaandeVakken)) {
                            alert('Dit vak is al toegevoegd.');
                        } else {
                            formDocentenPta.appendChild(div);
                        }
                    } else {
                        formDocentenPta.appendChild(div);
                    }
                }
            } else if (niveaus[j] == 'Mavo') {
                for (let i = 3; i < 5; i++) {
                    var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
                    var label = document.createElement('label');
                    label.textContent = vaknaam + " (" + i + ' ' + niveaus[j] + "): ";
                    label.setAttribute('for', vaknaam + '_' + niveaus[j] + '_' + i)
                    var icon = document.createElement('img')
                    icon.setAttribute('src', '/prullenbak.png')
                    icon.setAttribute('width', 25)
                    icon.setAttribute('height', 25)
                    icon.setAttribute('onclick', 'verwijderVak(' + vaknaam + '_' + niveau + '_' + i + ')')
                    var inputDocent = document.createElement('input');
                    inputDocent.setAttribute('type', 'text');
                    inputDocent.setAttribute('id', vaknaam + '_' + niveaus[j] + '_' + i);
                    inputDocent.setAttribute('jaarlaag', i);
                    inputDocent.setAttribute('maxlength', 3)
                    inputDocent.setAttribute('placeholder', 'afkorting docent')
                    inputDocent.setAttribute('vak', vaknaam);
                    inputDocent.setAttribute('niveau', niveaus[j]);
                    inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveaus[j] + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
                    var div = document.createElement('div')
                    div.appendChild(label);
                    div.appendChild(icon)
                    div.appendChild(inputDocent);
                    if (bestaandeVakken.length > 0) {
                        if (VakkenControleren(i, niveau[j], vaknaam, bestaandeVakken)) {
                            alert('Dit vak is al toegevoegd.');
                        } else {
                            formDocentenPta.appendChild(div);
                        }
                    } else {
                        formDocentenPta.appendChild(div);
                    }
                }
            }
        }
        return
    }
    if (niveau == "Mavo" && (jaarlaag == "5" || jaarlaag == "6")) {
        alert("voer een geldig jaar in")
        return
    }
    if (niveau == "Havo" && (jaarlaag == "3" || jaarlaag == "6")) {
        alert("voer een geldig jaar in")
        return
    }
    if (niveau == "Vwo" && jaarlaag == "3") {
        alert("voer een geldig jaar in")
        return
    }

    if (jaarlaag == "alle jaarlagen") {
        if (niveau == 'Vwo') {
            for (let i = 4; i < 7; i++) {
                var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
                var label = document.createElement('label');
                label.textContent = vaknaam + " (" + i + ' ' + niveau + "): ";
                label.setAttribute('for', vaknaam + '_' + niveau + '_' + i)
                var inputDocent = document.createElement('input');
                var icon = document.createElement('img')
                icon.setAttribute('src', '/prullenbak.png')
                icon.setAttribute('width', 25)
                icon.setAttribute('height', 25)
                icon.setAttribute('onclick', 'verwijderVak(' + vaknaam + '_' + niveau + '_' + i + ')')
                var inputDocent = document.createElement('input');
                inputDocent.setAttribute('type', 'text');
                inputDocent.setAttribute('maxlength', 3)
                inputDocent.setAttribute('vak', vaknaam);
                inputDocent.setAttribute('placeholder', 'afkorting docent')
                inputDocent.setAttribute('id', vaknaam + '_' + niveau + '_' + jaarlaag);
                inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveau + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
                var div = document.createElement('div')
                div.setAttribute('id', vaknaam + '_' + niveau + '_' + i)
                div.appendChild(label);
                div.appendChild(inputDocent);
                div.appendChild(icon)
                if (bestaandeVakken.length > 0) {
                    if (VakkenControleren(i, "Vwo", vaknaam, bestaandeVakken)) {
                        alert('Dit vak is al toegevoegd.');
                    } else {
                        formDocentenPta.appendChild(div);
                    }
                } else {
                    formDocentenPta.appendChild(div);
                }
            }
            return
        } else if (niveau == 'Havo') {
            for (let i = 4; i < 6; i++) {
                var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
                var label = document.createElement('label');
                label.textContent = vaknaam + " (" + i + ' ' + niveau + "): ";
                label.setAttribute('for', vaknaam + '_' + niveau + '_' + i)
                var icon = document.createElement('img')
                icon.setAttribute('src', '/prullenbak.png')
                icon.setAttribute('width', 25)
                icon.setAttribute('height', 25)
                icon.setAttribute('onclick', 'verwijderVak(' + vaknaam + '_' + niveau + '_' + i + ')')
                var inputDocent = document.createElement('input');
                inputDocent.setAttribute('type', 'text');
                inputDocent.setAttribute('maxlength', 3)
                inputDocent.setAttribute('vak', vaknaam);
                inputDocent.setAttribute('placeholder', 'afkorting docent')
                inputDocent.setAttribute('id', vaknaam + '_' + niveau + '_' + jaarlaag);
                inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveau + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
                var div = document.createElement('div')
                div.setAttribute('id', vaknaam + '_' + niveau + '_' + i)
                div.appendChild(label);
                div.appendChild(inputDocent);
                div.appendChild(icon)
                if (bestaandeVakken.length > 0) {
                    if (VakkenControleren(i, "Havo", vaknaam, bestaandeVakken)) {
                        alert('Dit vak is al toegevoegd.');
                    } else {
                        formDocentenPta.appendChild(div);
                    }
                } else {
                    formDocentenPta.appendChild(div);
                }
            }
            return
        } else if (niveau == 'Mavo') {
            for (let i = 3; i < 5; i++) {
                var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
                var label = document.createElement('label');
                label.textContent = vaknaam + " (" + i + ' ' + niveau + "): ";
                label.setAttribute('for', vaknaam + '_' + niveau + '_' + i)
                var icon = document.createElement('img')
                icon.setAttribute('src', '/prullenbak.png')
                icon.setAttribute('width', 25)
                icon.setAttribute('height', 25)
                icon.setAttribute('onclick', 'verwijderVak(' + vaknaam + '_' + niveau + '_' + i + ')')
                var inputDocent = document.createElement('input');
                inputDocent.setAttribute('type', 'text');
                inputDocent.setAttribute('id', vaknaam + '_' + niveau + '_' + jaarlaag);
                inputDocent.setAttribute('jaarlaag', jaarlaag);
                inputDocent.setAttribute('vak', vaknaam);
                inputDocent.setAttribute('placeholder', 'afkorting docent')
                inputDocent.setAttribute('maxlength', 3)
                inputDocent.setAttribute('niveau', i);
                inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveau + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
                var div = document.createElement('div')
                div.setAttribute('id', vaknaam + '_' + niveau + '_' + i)
                div.appendChild(label);
                div.appendChild(inputDocent);
                div.appendChild(icon)
                if (bestaandeVakken.length > 0) {
                    if (VakkenControleren(i, 'Mavo', vaknaam, bestaandeVakken)) {
                        alert('Dit vak is al toegevoegd.');
                    } else {
                        formDocentenPta.appendChild(div);
                    }
                } else {
                    formDocentenPta.appendChild(div);
                }
            }
            return

        }
    }

    // Creëer nieuwe inputvelden voor de docent verantwoordelijk voor het nieuwe vak
    var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
    var label = document.createElement('label');
    label.textContent = vaknaam + " (" + jaarlaag + ' ' + niveau + "): ";
    label.setAttribute('for', vaknaam + '_' + niveau + '_' + jaarlaag)
    var icon = document.createElement('img')
    icon.setAttribute('src', '/prullenbak.png')
    icon.setAttribute('width', 25)
    icon.setAttribute('height', 25)
    icon.setAttribute('onclick', 'verwijderVak(' + vaknaam + '_' + niveau + '_' + i + ')')
    var inputDocent = document.createElement('input');
    inputDocent.setAttribute('type', 'text');
    inputDocent.setAttribute('id', vaknaam + '_' + niveau + '_' + jaarlaag);
    inputDocent.setAttribute('jaarlaag', jaarlaag);
    inputDocent.setAttribute('vak', vaknaam);
    inputDocent.setAttribute('maxlength', 3)
    inputDocent.setAttribute('niveau', niveau);
    inputDocent.setAttribute('placeholder', 'afkorting docent')
    inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveau + '_' + jaarlaag); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
    var div = document.createElement('div')
    div.appendChild(label);
    div.appendChild(inputDocent);
    div.appendChild(icon);
    formDocentenPta.appendChild(div);

}

function VakkenControleren(fi, fniveau, fvaknaam, fbestaandeVakken) {
    for (i = 0; i < fbestaandeVakken.length; i++) {
        if (fbestaandeVakken[i].getAttribute('vak') == fvaknaam && fbestaandeVakken[i].getAttribute('niveau') == fniveau && fbestaandeVakken[i].getAttribute('jaarlaag') == fi) {
            return true
        } else {
            return false
        }
    }
}

function docentenPtaOpslaan(e) {
    e.preventDefault();
    var form = document.getElementById('VerantwoordelijkeDocentenPta');
    var veldenArray = [];
    var inputs = form.querySelectorAll('input[type="text"]');
    var docentenArray = [];
  
    inputs.forEach(function(input) {
      var vak = input.getAttribute("vak");
      var niveau = input.getAttribute("niveau");
      var jaarlaag = input.getAttribute("jaarlaag");
      if (!docentenArray.includes(input.value)) {
        docentenArray.push(input.value);
      }
      var veldObject = {
        name: vak,
        responsible: input.value,
        level: jaarlaag + ' ' + niveau
      };
      veldenArray.push(veldObject);
    });
  
    // Opmerking: Implementeer wachtwoordveldenMaken(docentenArray) indien nodig
  
    fetch('/api/defaults/subjects', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(veldenArray) // Verzend de array als JSON
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Data sent successfully:', data);
        // Eventuele extra acties na succesvolle update
      })
      .catch(error => {
        console.error('Error sending data:', error);
      });
  }

function verwijderVak(divId) {
    divId.remove()
}



function periodesophalen() {
    fetch(`/api/defaults/periods`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Netwerkrespons was niet ok');
            }
            return response.json();
        })
        .then(data => {
            let periods = data;
            periodesLaden(periods)
        })
        .catch(error => {
            console.error('Fout bij het laden:', error);
        });
}

function periodesLaden(periodes) {
    document.getElementById('startPeriode1').value = periodes[0].start_week
    document.getElementById('eindPeriode1').value = periodes[0].end_week
    document.getElementById('eindPeriode2').value = periodes[1].end_week
    document.getElementById('eindPeriode3').value = periodes[2].end_week
    document.getElementById('eindPeriode4').value = periodes[3].end_week
}


vakkenOphalen()
docentenOphalen()
hulpmiddelenOphalen()
toetsSoortenOphalen()
tijdsMogelijkhedenOphalen()
periodesophalen()

async function overwriteSubjectsDatabaseHandlingDuplicates() {
    try {
      const responsePTA = await fetch('/api/pta/all');
      if (!responsePTA.ok) {
        throw new Error(`Network response was not ok, status: ${responsePTA.status}`);
      }
      const ptaData = await responsePTA.json();
  
      // Een nieuwe Map om duplicaten te voorkomen, met een combinatie van name en level als key
      const subjectsMap = new Map();
  
      ptaData.forEach(pta => {
        const key = `${pta.name}-${pta.level}`;
        if (!subjectsMap.has(key)) {
          subjectsMap.set(key, {
            name: pta.name,
            level: pta.level,
            responsible: pta.responsible
          });
        }
      });
  
      // Transformeer de map terug naar een array
      const transformedSubjects = Array.from(subjectsMap.values());
  
      // Verstuur de gefilterde en getransformeerde lijst naar de subjects database
      const updateResponse = await fetch('/api/defaults/subjects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transformedSubjects)
      });
      if (!updateResponse.ok) {
        throw new Error(`Network response was not ok, status: ${updateResponse.status}`);
      }
      const updatedData = await updateResponse.json();
      console.log('Subjects database successfully overwritten with PTA data, duplicates handled:', updatedData);
    } catch (error) {
      console.error('Error overwriting subjects database with duplicate handling:', error);
    }
  }
  
