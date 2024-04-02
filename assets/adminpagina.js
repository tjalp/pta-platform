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
            toonFeedback('feedbackToetsen', 'Soorten toetsen succesvol opgeslagen.', true);
        })
        .catch(error => {
            console.error('Error sending data:', error);
            toonFeedback('feedbackToetsen', error.message, false);
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
            toonFeedback('feedbackTijden', 'Periodes succesvol opgeslagen.', true);
        })
        .catch(error => {
            console.error('Error sending data:', error);
            toonFeedback('feedbackTijden', error.message, false);
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
            tijdsmogelijkhedenLaden(data)
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
            toonFeedback('feedbackHulpmiddelen', 'Hulpmiddelen succesvol opgeslagen.', true);
        })
        .catch(error => {
            console.error('Error sending data:', error);
            toonFeedback('feedbackHulpmiddelen', error.message, false);
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

function genereerWachtwoord() {
    const wachtwoordInput = document.getElementById('wachtwoordInput');
    wachtwoordInput.value = wachtwoordGenereren(8);
}

function wachtwoordGenereren(lengte) {
    const karakters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let wachtwoord = '';
    for (let i = 0; i < lengte; i++) {
        wachtwoord += karakters.charAt(Math.floor(Math.random() * karakters.length));
    }
    return wachtwoord;
}


function ophalenGebruikers() {
    return fetch('/api/user/all').then(response => response.json());
}

function gebruikerAanmaken(afkorting, wachtwoord) {
    return fetch('/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abbreviation: afkorting, password: wachtwoord })
    });
}

function gebruikerBijwerken(id, wachtwoord) {
    return fetch(`/api/user/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: wachtwoord })
    });
}

let feedbackTimeout;

function toonFeedback(element, bericht, isSucces = true) {
    const feedbackElement = document.getElementById(element);
    feedbackElement.textContent = bericht;
    feedbackElement.className = isSucces ? 'feedback success' : 'feedback error';

    if (feedbackTimeout) {
        clearTimeout(feedbackTimeout);
    }
    feedbackTimeout = setTimeout(() => {
        feedbackElement.textContent = '';
        feedbackElement.className = 'feedback';
        feedbackTimeout = null;
    }, 5000);
}


function docentenAccountsOpslaan(event) {
    event.preventDefault();

    const afkorting = document.getElementById('afkortingInput').value;
    const wachtwoord = document.getElementById('wachtwoordInput').value;

    ophalenGebruikers().then(users => {
        const gebruiker = users.find(user => user.abbreviation === afkorting);
        if (!gebruiker) {
            const bevestiging = confirm(`De afkorting ${afkorting} bestaat niet. Nieuwe gebruiker aanmaken?`);
            if (bevestiging) {
                gebruikerAanmaken(afkorting, wachtwoord)
                    .then(handleResponse)
                    .catch(error => toonFeedback('feedbackDocenten', error.message, false));
            } else {
                toonFeedback('feedbackDocenten', 'Nieuwe gebruiker aanmaken geannuleerd.', false);
            }
        } else {
            gebruikerBijwerken(gebruiker.id, wachtwoord)
                .then(handleResponse)
                .catch(error => toonFeedback('feedbackDocenten', error.message, false));
        }
    }).catch(error => toonFeedback('feedbackDocenten', error.message, false));
}

function handleResponse(response) {
    if (!response.ok) {
        throw new Error('Fout bij het bijwerken/aanmaken van de gebruiker.');
    }
    return response.text().then(text => text ? JSON.parse(text) : {}).then(data => {
        toonFeedback('feedbackDocenten', 'Wachtwoord succesvol opgeslagen.');
        console.log('Data received:', data);
    });
}

function uploadFiles(event) {
    event.preventDefault();

    const form = document.getElementById('importform');
    const formData = new FormData(form);
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.textContent;
    button.disabled = true;
    button.textContent = 'Bezig met uploaden...';

    fetch('/api/pta/upload', {
        method: 'POST',
        body: formData
    }).then(response => {
        if (!response.ok) {
            throw new Error('Serverfout bij het uploaden van bestanden.');
        }
        return response.json();
    }).then(data => {
        console.log('Bestanden succesvol geüpload:', data);
        toonFeedback('feedbackImport', 'Bestanden succesvol geüpload.', true);
    }).catch(error => {
        console.error('Fout bij het uploaden van bestanden:', error);
        toonFeedback('feedbackImport', error.message, false);
    }).finally(() => {
        button.disabled = false;
        button.textContent = buttonText;
    })
}

document.getElementById("importform").addEventListener("submit", event => {
    uploadFiles(event);
});

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
        inputDocent.required = true;

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
    event.preventDefault();

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

    fetch('/api/defaults/periods', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(periodesData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Serverfout bij het opslaan van periodes.');
            }
            return response.text();
        })
        .then(text => {
            const data = text ? JSON.parse(text) : {};
            console.log('Periodes succesvol opgeslagen:', data);
            toonFeedback('feedbackPeriodes', 'Periodes succesvol opgeslagen.', true);
        })
        .catch(error => {
            console.error('Fout bij het opslaan van periodes:', error);
            toonFeedback('feedbackPeriodes', error.message, false);
        });
}


function vakToevoegen(event) {
    event.preventDefault();
    const vaknaam = document.getElementById('vaknaam').value;
    const niveauSelectie = document.getElementById('niveau').value;
    const jaarlaagSelectie = document.getElementById('jaarlaag').value;

    const niveaus = niveauSelectie === "Alle" ? ["MAVO", "HAVO", "VWO"] : [niveauSelectie];
    const jaarlagen = jaarlaagSelectie === "Alle" ? ["3", "4", "5", "6"] : [jaarlaagSelectie];

    // Filter ongeldige combinaties uit
    const geldigeCombinaties = niveaus.flatMap(niveau => jaarlagen.map(jaarlaag => {
        if (niveau === "MAVO" && jaarlaag === "6") return null;
        if (niveau === "HAVO" && (jaarlaag === "3" || jaarlaag === "6")) return null;
        if (niveau === "VWO" && jaarlaag === "3") return null;
        return { niveau, jaarlaag };
    })).filter(combinatie => combinatie !== null);

    geldigeCombinaties.forEach(({ niveau, jaarlaag }) => {
        voegVakVeldToe(vaknaam, niveau, jaarlaag);
    });
}

function voegVakVeldToe(vaknaam, niveau, jaarlaag) {
    const formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');

    // Controleer of het vak al bestaat
    if (document.querySelector(`input[vak="${vaknaam}"][niveau="${niveau}"][jaarlaag="${jaarlaag}"]`)) {
        alert('Dit vak is al toegevoegd voor de geselecteerde niveau en jaarlaag combinatie.');
        return;
    }

    const div = document.createElement('div');
    div.className = 'vak-item';

    const label = document.createElement('label');
    label.textContent = `${vaknaam} (${jaarlaag} ${niveau}):`;

    const inputDocent = document.createElement('input');
    inputDocent.type = 'text';
    inputDocent.setAttribute('vak', vaknaam);
    inputDocent.setAttribute('niveau', niveau);
    inputDocent.setAttribute('jaarlaag', jaarlaag);
    inputDocent.placeholder = 'Afkorting docent';
    inputDocent.required = true;

    const verwijderKnop = document.createElement('button');
    verwijderKnop.textContent = 'X';
    verwijderKnop.type = 'button';
    verwijderKnop.onclick = () => div.remove();

    div.appendChild(label);
    div.appendChild(inputDocent);
    div.appendChild(verwijderKnop);

    const header = formDocentenPta.querySelector('.pta-header');

    formDocentenPta.insertBefore(div, header.nextSibling);


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

    inputs.forEach(function (input) {
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
            toonFeedback('feedbackVerantwoordelijken', 'Verantwoordelijken succesvol opgeslagen.', true);
        })
        .catch(error => {
            console.error('Error sending data:', error);
            toonFeedback('feedbackVerantwoordelijken', error.message, false);
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

//overwriteSubjectsDatabaseHandlingDuplicates();

let opSlot = true;

fetch('/api/config')
    .then(response => response.json())
    .then(data => {
        setOpSlot(data.locked, false);
    })
    .catch(error => console.error('Fout bij het laden:', error));

function toggleOpSlot() {
  setOpSlot(!opSlot);
}

function setOpSlot(slot, update = true) {
    const knop = document.getElementById('toggleOpSlot');
    opSlot = slot;
    knop.textContent = !opSlot ? '🔓' : '🔒';
    document.getElementById('slotTekst').textContent = !opSlot? 'PTAs zijn open voor:' : 'PTAs zijn gesloten voor:';

    if (!update) return
    fetch('/api/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "locked": opSlot }),
    })
        .then(response => response.json())
        .then(data => console.log('Succesvol bijgewerkt:', data))
        .catch(error => console.error('Fout bij het bijwerken:', error));
}

let bewerkJaar = 2024; // TODO lezen uit DB

function setBewerkJaar() {
    const bewerkJaarInput = document.getElementById('bewerkJaar');
    bewerkJaar = parseInt(bewerkJaarInput.value, 10);
    const volgendJaarSpan = document.getElementById('volgendJaar');
    volgendJaarSpan.textContent = `/ ${bewerkJaar + 1}`;

    // TODO DB updaten voor bewerkjaar 
  }