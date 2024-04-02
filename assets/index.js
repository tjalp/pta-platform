// Globale variabelen
let isBewerker = false;
let heeftBewerkingsRechten = false;
let selectedBewerkerOfBekijker = "";
let selectedVak = null;
let selectedJaar = null;
let selectedNiveau = null;
let isDynamicButtonClicked = false;
let isEersteKeer = true;
let vwoWegingen = {}, havoWegingen = {}, mavoWegingen = {}; // TODO lelijk

function toggleExplanation(selectElement) {
    var explanationDiv = selectElement.parentElement.querySelector('.explanationDiv');

    if (selectElement.value === 'anders') {
        explanationDiv.classList.add('visible');
    } else {
        explanationDiv.classList.remove('visible');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initialiseerTemplate();
    isEersteKeer = true;
    start();
    genereerToetsen();
});

function updateJaarOpties(nieuwJaarOpties, bewerkJaar, opSlot) {
    return nieuwJaarOpties.map(jaar => {
        if (opSlot || jaar !== bewerkJaar || !isBewerker) {
            return `🔒 ${jaar}`;
        } else {
            return jaar;
        }
    });
}

function start() {
    if (!isEersteKeer && heeftBewerkingsRechten && !wiltWisselen()) {
        return; 
    }
    isEersteKeer = true;
    isDynamicButtonClicked = false;
    removeExistingModals();
    const modal = createModal('Wilt u PTAs bekijken of bewerken?', [
        { text: 'Bekijken', action: bekijken },
        { text: 'Bewerken', action: bewerken }
    ]);
    document.body.appendChild(modal);
    toonTabInhoud('wegingenContent');
    setEditRights()
}

function bekijken() {
    selectedBewerkerOfBekijker = "Bekijken";
    isBewerker = false;
    OptiesUitDatabase()
    vakkeuze();
}

function bewerken() {
    removeExistingModals();
    const modal = createModal('Inloggen', [
        { type: 'div', id: 'modalMessage' },
        { type: 'input', placeholder: 'Afkorting' },
        { type: 'input', placeholder: 'Wachtwoord', inputType: 'password' },
        { text: 'Terug', action: start },
        { text: 'Bevestigen', action: bevestigBewerken }
    ]);
    document.body.appendChild(modal);
}

let afkorting;
function bevestigBewerken() {
    let elements = document.querySelector('.modal').querySelectorAll('input');
    afkorting = elements[0].value.toUpperCase();
    let wachtwoord = elements[1].value;
    let messageField = document.getElementById('modalMessage');

    fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ abbreviation: afkorting, password: wachtwoord })
    })
        .then(response => {
            if (!response.ok) {
                // Zorg dat we de error message correct afhandelen binnen de promise chain
                return response.json().then(data => {
                    messageField.textContent = data.error;
                    throw new Error('Authenticatie mislukt');
                });
            }
            return response.json();
        })
        .then(data => {
            isBewerker = true;
            selectedBewerkerOfBekijker = "Bewerken";
            // Zorg ervoor dat vakkeuze wordt aangeroepen na OptiesUitDatabase
            return OptiesUitDatabase(afkorting); // We wachten tot deze promise is voltooid
        })
        .then(() => {
            vakkeuze(); // Nu veilig om aan te roepen
        })
        .catch(error => {
            console.error('Fout bij inloggen:', error);
        });
}


function initialiseerKeuzeModal(keuzeType, opties, bevestigingsActie, terugActie, selectOptie = []) {
    try {
        removeExistingModals();

        console.log(`Opening modal voor: ${keuzeType} met ${selectOptie}`);
        createSearchModal(
            `Voor welk ${keuzeType.toLowerCase()} wilt u PTAs ${isBewerker ? 'bewerken' : 'bekijken'}?`,
            opties,
            (geselecteerdeOpties) => bevestigKeuze(keuzeType, geselecteerdeOpties),
            terugActie, // Terug actie
            false, // Meervoudige selectie niet toegestaan
            selectOptie
        );
    } catch (error) {
        console.error(`Fout bij het initialiseren van keuzeModal voor ${keuzeType}:`, error);
    }
}

function bevestigKeuze(keuzeType, geselecteerdeOpties) {
    try {
        let selected = geselecteerdeOpties.length > 0 ? geselecteerdeOpties[0] : null;
        if (!selected) {
            throw new Error(`Geen ${keuzeType.toLowerCase()} geselecteerd.`);
        }

        console.log(`Geselecteerde ${keuzeType.toLowerCase()}: ${selected}`);
        updateSelection(keuzeType, selected);

        // Ga naar de volgende keuze of maak dynamische knoppen aan
        isEersteKeer = true; // TODO voor nu altijd door alle forms, want soms bestaat niveau niet bij vak
        if (isEersteKeer) {
            switch (keuzeType) {
                case 'Vak': niveaukeuze(); break;
                case 'Niveau': jaarkeuze(); break;
                case 'Jaar':
                    if (selectedJaar === bewerkJaar) {
                        // TODO mooier maken
                        alert('Kopie van vorig jaar of laatste PTA-versie is geladen. Deze kan je nu (verder) bewerken.')
                        laadPta()
                    }
                    createDynamicButtons();
                    isEersteKeer = false; // Stop de initiële reeks
                    break;
            }
        }
    } catch (error) {
        console.error(`Fout bij bevestiging van ${keuzeType}:`, error);
    } finally {
        if (!isEersteKeer) { // Ook geladen nadat jaar is aangeroepen
            laadPta().then(() => {
                laadPercentages();
                removeExistingModals();
            });
        }
    }
}

function vakZoeken(vak, afkorting) {
    return fetch(`/api/defaults/subjects`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Netwerkrespons was niet ok');
            }
            return response.json();
        })
        .then(data => {
            // Filter de data op basis van de meegegeven afkorting als deze is opgegeven
            if (afkorting) {
                data = data.filter(item => item.responsible.includes(afkorting));
            }
            // Zoek niveau-opties op basis van de gefilterde data en het opgegeven vak
            let niveauOpties = zoekenNiveau(data, vak);
            // Initialiseer de keuzemodal met de gevonden niveau-opties
            initialiseerKeuzeModal('Niveau', niveauOpties, (opties) => bevestigKeuze('Niveau', opties), vakkeuze, selectedNiveau ? [selectedNiveau] : []);
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


function zoekenNiveau(vakkenlijst, vak) {
    // Filter de vakkenlijst op basis van de gegeven vaknaam
    const gefilterdeVakken = vakkenlijst.filter(vakkenItem => vakkenItem.name === vak);

    // Gebruik de sorteerVakken functie om de gefilterde lijst te sorteren
    const gesorteerdeVakken = sorteerVakken(gefilterdeVakken);

    // Map de gesorteerde vakken naar hun niveaus, zorg ervoor dat de niveaus in hoofdletters zijn
    const niveauOpties = gesorteerdeVakken.map(vakkenItem => vakkenItem.level.toUpperCase());

    return niveauOpties;
}

function wiltWisselen() {
    return(confirm('Niet opgeslagen data zal verloren gaan. Weet u zeker dat u wilt wisselen van PTA?'));
}

function promptVoorWisselen(keuzeFunctie) {
    if (!isEersteKeer && heeftBewerkingsRechten && !wiltWisselen()) {
        return;
    }
    keuzeFunctie();
}

function vakkeuze() {
    promptVoorWisselen(() => {
        isEersteKeer = true;
        initialiseerKeuzeModal('Vak', vakkenOpties, (opties) => bevestigKeuze('Vak', opties), start, selectedVak ? [selectedVak] : []);
    });
}

function niveaukeuze() {
    promptVoorWisselen(() => {
        vakZoeken(selectedVak, afkorting);
    });
}

function jaarkeuze() {
    promptVoorWisselen(() => {
        nieuwJaarOpties = updateJaarOpties(jaarOpties, bewerkJaar, opSlot);
        initialiseerKeuzeModal('Jaar', nieuwJaarOpties, (opties) => bevestigKeuze('Jaar', opties), niveaukeuze, selectedJaar ? [selectedJaar] : []);
    });
}


function updateSelection(keuzeType, selected) {
    switch (keuzeType) {
        case 'Vak': selectedVak = selected;
            break;
        case 'Niveau': selectedNiveau = selected; break;
        case 'Jaar': selectedJaar = selected; break;
        default: throw new Error(`Onbekend keuzeType: ${keuzeType}`);
    }
    updateDynamicButtonValue(keuzeType, selected);
}

function updateDynamicButtonValue(buttonType, value) {
    isDynamicButtonClicked = false;
    // Gebruik de 'name' attribuut om de juiste knop te vinden
    const button = document.querySelector(`#dynamicButtons button[name="${buttonType}"]`);
    if (button) {
        button.textContent = value;
    }
}


function createButton(text, clickAction, name) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', clickAction);
    if (name) {
        button.setAttribute('name', name); // Voeg het 'name' attribuut toe
    }
    return button;
}


function createDynamicButtons() {
    const buttonContainer = document.getElementById('dynamicButtons');
    if (!buttonContainer) {
        console.error('Button container niet gevonden');
        return;
    }

    buttonContainer.innerHTML = ''; // Bestaande knoppen verwijderen

    const buttons = [
        { text: selectedBewerkerOfBekijker, action: start, name: 'BewerkerOfBekijker' },
        { text: selectedVak || 'Selecteer Vak', action: vakkeuze, name: 'Vak' },
        { text: selectedNiveau || 'Selecteer Niveau', action: niveaukeuze, name: 'Niveau' },
        { text: selectedJaar || 'Selecteer Jaar', action: jaarkeuze, name: 'Jaar' },
        { text: '💾', action: opslaan, name: 'Opslaan' },
    ];

    // Creëer en voeg elke knop toe aan de container
    buttons.forEach(({ text, action, name }) => {
        const button = createButton(text, action, name);
        buttonContainer.appendChild(button);
    });
}



function createModal(title, elements) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.style.display = 'block';

    let contentHtml = `<div class="modal-content"><div class="modal-page"><h2>${title}</h2>`;

    elements.forEach(el => {
        if (el.type === 'select') {
            contentHtml += `<select id="${el.id}">${el.options.map(option => `<option value="${option}">${option}</option>`)}</select>`;
        } else if (el.type === 'input') {
            contentHtml += `<input type="${el.inputType || 'text'}" placeholder="${el.placeholder}">`;
        } else if (el.type === 'div') {
            contentHtml += `<div id="${el.id}"></div>`;
        }
        else {
            contentHtml += `<button onclick="${el.action.name}()">${el.text}</button>`;
        }
    });

    contentHtml += `</div></div>`;
    modal.innerHTML = contentHtml;
    return modal;
}

function removeExistingModals() {
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }
    const existingSearchModal = document.querySelector('.searchModal');
    if (existingSearchModal) {
        existingSearchModal.remove();
    }
}

/*
CODE VOOR PERCENTAGES
*/
const vwoVelden = document.getElementById('vwoVelden');
const havoVelden = document.getElementById('havoVelden');
const mavoVelden = document.getElementById('mavoVelden');
const input4vwo = document.getElementById('percentage4vwo');
const input5vwo = document.getElementById('percentage5vwo');
const input6vwo = document.getElementById('percentage6vwo');
const input4havo = document.getElementById('percentage4havo');
const input5havo = document.getElementById('percentage5havo');
const input3mavo = document.getElementById('percentage3mavo');
const input4mavo = document.getElementById('percentage4mavo');
const foutDiv = document.getElementById('errorPercentages');

function laadAlles() {
    laadPercentages();
}

function laadPercentages() {
    vwoVelden.style.display = selectedNiveau.includes('VWO') ? 'block' : 'none';
    havoVelden.style.display = selectedNiveau.includes('HAVO') ? 'block' : 'none';
    mavoVelden.style.display = selectedNiveau.includes('MAVO') ? 'block' : 'none';


    getPercentages();

    setEditRights();
}


function toonFout(bericht) {
    foutDiv.textContent = bericht;
}

function wisFout() {
    foutDiv.textContent = '';
}

function berekenPercentage() {
    if (selectedNiveau.includes('VWO')) {
        let weging4vwo = parseInt(input4vwo.value) || 0;
        let weging5vwo = parseInt(input5vwo.value) || 0;

        if (weging4vwo + weging5vwo > 100) {
            toonFout("De totale weging mag niet meer dan 100% zijn.");
            input6vwo.value = '';
        }
        else {
            wisFout();
            let weging6vwo = 100 - weging4vwo - weging5vwo;
            input6vwo.value = weging6vwo >= 0 ? weging6vwo : '';
        }
    }
    else if (selectedNiveau.includes('HAVO')) {
        let weging4havo = parseInt(input4havo.value) || 0;

        if (weging4havo <= 100) {
            let weging5havo = 100 - weging4havo;
            input5havo.value = weging5havo >= 0 ? weging5havo : '';
        }
    }
    else if (selectedNiveau.includes('MAVO')) {
        let weging3mavo = parseInt(input3mavo.value) || 0;

        if (weging3mavo <= 100) {
            let weging4mavo = 100 - weging3mavo;
            input4mavo.value = weging4mavo >= 0 ? weging4mavo : '';
        }
    }
}

function valideerInvoer(event) {
    let invoer = event.target.value;
    let gefilterdeInvoer = invoer.replace(/[^0-9]/g, '');

    let waarde = parseInt(gefilterdeInvoer);
    event.target.value = waarde > 100 ? 100 : (waarde < 0 || isNaN(waarde) ? 0 : waarde);

    berekenPercentage();
}

input4vwo.addEventListener('input', valideerInvoer);
input5vwo.addEventListener('input', valideerInvoer);
input4havo.addEventListener('input', valideerInvoer);
input3mavo.addEventListener('input', valideerInvoer);


/*
NIEUW MODAL SYSTEEM
*/

let huidigeSelectie = null;

function createSearchModal(title, searchOptions, bevestigActie, terugActie = null, meervoudigeSelectie = false, geselecteerdeOpties = []) {
    const modal = createModalStructure(title, searchOptions, geselecteerdeOpties, meervoudigeSelectie);
    setupInitialSelection(searchOptions, geselecteerdeOpties, meervoudigeSelectie);
    populateOptionsList(modal.ul, searchOptions, geselecteerdeOpties, meervoudigeSelectie);
    addButtons(modal.buttonContainer, bevestigActie, terugActie, geselecteerdeOpties);
    setupModal(modal.container, modal.searchInput, searchOptions, geselecteerdeOpties, meervoudigeSelectie);
}


function setupInitialSelection(searchOptions, geselecteerdeOpties, meervoudigeSelectie) {
    if (geselecteerdeOpties.length === 0) {
        if (meervoudigeSelectie) {
            // Bij meervoudige selectie, begin met een lege selectie of specifieke logica indien nodig
        } else {
            // Bij enkelvoudige selectie, selecteer standaard de eerste optie
            geselecteerdeOpties.push(searchOptions[0]);
        }
    }
}

function createModalStructure(title, searchOptions, geselecteerdeOpties, meervoudigeSelectie) {
    let modal = document.createElement('div');
    modal.className = 'searchModal';

    let modalContent = document.createElement('div');
    modalContent.className = 'searchModal-content';
    modal.appendChild(modalContent);

    let modalTitle = document.createElement('h2');
    modalTitle.textContent = title;
    modalContent.appendChild(modalTitle);

    // Definieer ul eerst, zodat het bestaat wanneer je createSearchInput aanroept
    let ul = document.createElement('ul');

    // Nu ul bestaat, kan je createSearchInput veilig aanroepen en de ul als parameter meegeven
    let searchInput = createSearchInput(ul, searchOptions, geselecteerdeOpties, meervoudigeSelectie);
    modalContent.appendChild(searchInput); // Voeg eerst de zoekbalk toe aan modalContent

    modalContent.appendChild(ul); // Voeg daarna ul toe aan modalContent

    let buttonContainer = createButtonContainer();
    modalContent.appendChild(buttonContainer);

    return { container: modal, searchInput, ul, buttonContainer };
}



function createSearchInput(ul, searchOptions, geselecteerdeOpties, meervoudigeSelectie) {
    let searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = meervoudigeSelectie ? 'Zoek of voeg een hulpmiddel toe...' : 'Zoeken...';
    searchInput.onkeyup = () => filterOptions(ul, searchOptions, searchInput.value, geselecteerdeOpties, meervoudigeSelectie);
    return searchInput;
}


function filterOptions(ul, searchOptions, searchTerm, geselecteerdeOpties, meervoudigeSelectie) {
    ul.innerHTML = ''; // Maak de lijst leeg voor nieuwe resultaten

    const filteredOptions = searchOptions.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredOptions.length === 0 && meervoudigeSelectie) {
        // Toon de optie om toe te voegen alleen bij meervoudige selectie
        const li = document.createElement('li');
        li.innerHTML = `'<strong>${searchTerm}</strong>' niet gevonden. Klik om toe te voegen.`;
        li.addEventListener('click', () => voegNieuwHulpmiddelToe(searchTerm, ul, searchOptions, geselecteerdeOpties, meervoudigeSelectie));
        ul.appendChild(li);
    } else {
        filteredOptions.forEach(option => {
            const li = document.createElement('li');
            li.textContent = option;
            li.addEventListener('click', () => selectOption(li, geselecteerdeOpties, meervoudigeSelectie));
            ul.appendChild(li);
            if (geselecteerdeOpties.includes(option)) {
                li.classList.add('selected');
            }
        });
    }
}

function voegNieuwHulpmiddelToe(searchTerm, ul, searchOptions, geselecteerdeOpties, meervoudigeSelectie) {
    if (!searchOptions.includes(searchTerm)) {
        searchOptions.push(searchTerm); // Voeg toe aan de algemene lijst
        ptaData.tools.push(searchTerm); // Voor de consistentie, afhankelijk van hoe ptaData.tools wordt gebruikt
    }
    if (!geselecteerdeOpties.includes(searchTerm)) {
        geselecteerdeOpties.push(searchTerm); // Voeg toe aan geselecteerde opties
    }
    // Update de lijst en selectie visueel
    filterOptions(ul, searchOptions, '', geselecteerdeOpties, meervoudigeSelectie);
}


function createButtonContainer() {
    let buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'row-reverse';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.paddingTop = '10px';
    return buttonContainer;
}

function addButtons(buttonContainer, bevestigActie, terugActie, geselecteerdeOpties) {
    // Knoppen toevoegen logica, nu met de aangepaste bevestigActie die geselecteerdeOpties als parameter heeft
    let bevestigButton = document.createElement('button');
    bevestigButton.textContent = 'Bevestigen';
    bevestigButton.onclick = () => bevestigActie(geselecteerdeOpties);
    buttonContainer.appendChild(bevestigButton);
    if (terugActie) {
        let terugButton = document.createElement('button');
        terugButton.textContent = 'Terug';
        terugButton.onclick = terugActie;
        buttonContainer.appendChild(terugButton);
    }

}

function populateOptionsList(ul, searchOptions, geselecteerdeOpties, meervoudigeSelectie) {
    if (!meervoudigeSelectie && !searchOptions.includes(geselecteerdeOpties[0])) {
        geselecteerdeOpties.length = 0;
        geselecteerdeOpties.push(searchOptions[0]);
    }

    searchOptions.forEach(option => {
        let li = document.createElement('li');
        li.textContent = option;
        li.onclick = () => selectOption(li, geselecteerdeOpties, meervoudigeSelectie);
        ul.appendChild(li);

        if (geselecteerdeOpties.includes(option)) {
            li.classList.add('selected');
        }
    });
}


function selectOption(li, geselecteerdeOpties, meervoudigeSelectie) {
    const optionText = li.textContent;
    if (meervoudigeSelectie) {
        const index = geselecteerdeOpties.indexOf(optionText);
        if (index > -1) {
            geselecteerdeOpties.splice(index, 1);
            li.classList.remove('selected');
        } else {
            geselecteerdeOpties.push(optionText);
            li.classList.add('selected');
        }
    } else {
        if (geselecteerdeOpties[0] !== optionText) {
            document.querySelectorAll('.searchModal-content ul li').forEach(el => el.classList.remove('selected'));
            geselecteerdeOpties.splice(0, geselecteerdeOpties.length, optionText); // Vervang de inhoud met de nieuwe selectie
            li.classList.add('selected');
        }
    }
}

function setupModal(modal, searchInput) {
    document.body.appendChild(modal);
    searchInput.focus();
    searchInput.select();
}


/*
GET & SET FUNCTIES VOOR DATABASE
*/

function opslaan() {
    toonTabInhoud('overzichtContent');
    genereerOverzichtInhoud();

    if (setLegeVelden()) {
        alert('Er zijn nog lege velden. Vul deze in voordat u opslaat.');
        return;
    }

    if (!isGesorteerd(ptaData.tests)) {
        document.getElementById('tabOverzicht').style.border = '1px solid red';
        document.getElementById('sorteerKnop').style.border = '2px solid red';
        alert('De toetsen zijn niet correct gesorteerd. Sorteer deze voordat u opslaat.');
        return;
    }

    const bevestiging = confirm('Zeker weten dat u wilt opslaan?');
    if (!bevestiging) {
        return;
    }

    fetch(`/api/pta/${ptaData.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(ptaData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.text();
        })
        .then(text => {
            if (text) {
                ptaData = JSON.parse(text);
                console.log('Data succesvol opgeslagen', ptaData);
                alert('De gegevens zijn succesvol opgeslagen.');
            } else {
                alert('Gegevens zijn opgeslagen.');
            }
        })
        .catch(error => {
            console.error('Fout bij opslaan:', error);
            alert('Er is een fout opgetreden bij het opslaan. Zie console voor details.');
        });
}

// Ophalen uit DB
let opSlot = false; // Als Admin op slot gooit
let bewerkJaar = '2024/2025' // De te bewerken jaar
let jaarOpties = ['2024/2025', '2023/2024'];

function fetchFromDatabase() {
    fetch('/api/defaults/subjects')
        .then(response => response.json())
        .then(data => {
            vakkenOpties = data.map(subject => subject.name);
        })
        .catch(error => console.error(error));
}

let ptaData = {};
// let ptaData = {
//     "id": "65fc5b40905c19cf1422e971",
//     "name": "Duits",
//     "level": "6 VWO",
//     "cohort": "2021 - 2024",
//     "responsible": "LNM",
//     "tools": [
//         "pen (blauw of zwart), potlood, geodriehoek/lineaal",
//         "woordenboek Duits-Nederlands",
//         "woordenboek Nederlands-Duits",
//         "steekwoordenlijst"
//     ],
//     "tests": [
//         {
//             "id": 601,
//             "year_and_period": "6.1",
//             "week": "SE 1",
//             "subdomain": "E",
//             "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque felis velit, tristique at odio luctus, dignissim facilisis nisi. Sed fermentum blandit varius. Suspendisse scelerisque ex eget dui sollicitudin consequat.",
//             "type": "schriftelijk",
//             'type_else': null,
//             "result_type": "cijfer",
//             "time": 100,
//             "time_else": null,
//             "resitable": true,
//             "pod_weight": 3,
//             "pta_weight": 2,
//             "tools": [
//                 0,
//                 1,
//                 2
//             ]
//         },
//         {
//             "id": 602,
//             "year_and_period": "6.2",
//             "week": "SE 2",
//             "subdomain": "C",
//             "description": "Spreek- en gespreksvaardigheid dialoog over 10 stellingen",
//             "type": "mondeling",
//             'type_else': null,
//             "result_type": "cijfer",
//             "time": 0,
//             "time_else": '???',
//             "resitable": true,
//             "pod_weight": 5,
//             "pta_weight": 2,
//             "tools": [
//                 0
//             ]
//         },
//         {
//             "id": 603,
//             "year_and_period": "6.3",
//             "week": "4",
//             "subdomain": "D",
//             "description": "Literatuur/film vergelijking",
//             "type": "anders",
//             'type_else': 'Literatuur/ film vergelijking',
//             "result_type": "o/v/g",
//             "time": 0,
//             "time_else": 'Project',
//             "resitable": true,
//             "pod_weight": 9,
//             "pta_weight": 0,
//             "tools": [

//             ]
//         },
//         {
//             "id": 604,
//             "year_and_period": "6.3",
//             "week": "4",
//             "subdomain": "B",
//             "description": "Cito kijk-en luistertoets 23 januari",
//             "type": "digitaal",
//             'type_else': null,
//             "result_type": "cijfer",
//             "time": 50,
//             "time_else": null,
//             "resitable": true,
//             "pod_weight": 10,
//             "pta_weight": 2,
//             "tools": [
//                 0
//             ]
//         },
//         {
//             "id": 605,
//             "year_and_period": "6.3",
//             "week": "SE 3",
//             "subdomain": "CD",
//             "description": "Examenidiom en kennis van land en volk",
//             "type": "schriftelijk",
//             'type_else': null,
//             "result_type": "cijfer",
//             "time": 100,
//             "time_else": null,
//             "resitable": true,
//             "pod_weight": 1,
//             "pta_weight": 2,
//             "tools": [
//                 0
//             ]
//         }
//     ]
// }

function getPercentages() {
    input4vwo.value = vwoWegingen?.['4 VWO'] || 0;
    input5vwo.value = vwoWegingen?.['5 VWO'] || 0;
    input6vwo.value = vwoWegingen?.['6 VWO'] || 0;

    input4havo.value = havoWegingen?.['4 HAVO'] || 0;
    input5havo.value = havoWegingen?.['5 HAVO'] || 0;

    input3mavo.value = mavoWegingen?.['3 MAVO'] || 0;
    input4mavo.value = mavoWegingen?.['4 MAVO'] || 0;

    berekenPercentage();
}


// TODO
function setPercentages() {
    if (!isBewerker) {
        console.log('Gebruiker is geen bewerker')
        return;
    }
    if (!isDynamicButtonClicked) {
        console.log('Gebruiker voor het eerst in het menu');
        return;
    }
    if (prevNiveau === selectedNiveau) {
        console.log('Geen nieuw niveau geselecteerd');
        return;
    }

    console.log('Opslaan naar de database:');
    if (prevNiveau.toLowerCase().includes('VWO')) {
        vwoWegingen = {
            '4 VWO': input4vwo.value,
            '5 VWO': input5vwo.value,
            '6 VWO': input6vwo.value
        };
        console.log('vwo-wegingen:', vwoWegingen);
    } else if (prevNiveau.toLowerCase().includes('HAVO')) {
        havoWegingen = {
            '4 HAVO': input4havo.value,
            '5 HAVO': input5havo.value
        };
        console.log('havo-wegingen:', havoWegingen);
    }
}

/*
TOETSEN GENEREREN
*/

function leesPtaData() {
    fetch('/api/pta/all')
        .then(response => response.json())
        .then(data => ptaData = data[3])
        .catch(error => console.error(error));
    toetsNummers = ptaData.tests.map(test => test.id.toString());
}

function genereerToetsen() {
    //leesPtaData();
    maakTabs(ptaData);
}

function initialiseerVasteTabs() {
    let wegingenTab = document.getElementById('tabWegingen');
    let overzichtTab = document.getElementById('tabOverzicht');

    if (wegingenTab) {
        wegingenTab.onclick = () => toonTabInhoud('wegingenContent');
    }
    if (overzichtTab) {
        overzichtTab.onclick = () => {
            toonTabInhoud('overzichtContent');
            genereerOverzichtInhoud();
        };
    }
}


function maakTabs(ptaData) {
    let tabsContainer = document.querySelector('.tabs');
    let contentContainer = document.querySelector('.tabContent');

    // Verwijder alle toegevoegde tabs, behalve de vaste tabs
    document.querySelectorAll('.tab:not(#tabWegingen):not(#tabOverzicht)').forEach(tab => {
        tab.remove();
    });

    // Verwijder corresponderende contentPanes voor verwijderde tabs
    document.querySelectorAll('.contentPane').forEach(contentPane => {
        if (!['wegingenContent', 'overzichtContent'].includes(contentPane.id)) {
            contentPane.remove();
        }
    });

    initialiseerVasteTabs();

    // Maak dynamische tabs voor elke toets in ptaData
    ptaData.tests.forEach(test => {
        maakTab(test.id.toString(), test.id.toString(), tabsContainer, contentContainer);
    });

    toonTabInhoud('wegingenContent');
}


function vulOverzichtTabel() {
    let tabelBody = document.querySelector('.overzichtTabel tbody');
    tabelBody.innerHTML = '';

    ptaData.tests.forEach(test => {
        let rij = tabelBody.insertRow();

        let beschrijving = test.description || '';
        let eerste25Karakters = beschrijving.slice(0, 25) + (beschrijving.length > 25 ? "..." : "");

        [test.id, test.week, '', test.pod_weight, test.pta_weight].forEach((text, index) => {
            let cell = rij.insertCell();
            if (index === 2) {
                let span = document.createElement('span');
                span.textContent = eerste25Karakters;
                span.className = 'beschrijving-preview';
                span.style.cursor = 'pointer';
                cell.appendChild(span);

                span.isUitgeklapt = false;

                span.onclick = () => {
                    if (!span.isUitgeklapt) {
                        span.textContent = beschrijving;
                        span.isUitgeklapt = true;
                    } else {
                        span.textContent = eerste25Karakters;
                        span.isUitgeklapt = false;
                    }
                };
            } else {
                cell.textContent = text;
            }
        });
    });
    updateGewogenGemiddelden();
}


function updateGewogenGemiddelden() {
    const tabelBody = document.querySelector('.overzichtTabel tbody');
    const rijen = tabelBody.querySelectorAll('tr');

    let totaalPOD = 0;
    let totaalPTA = 0;

    // Eerst de totalen berekenen
    rijen.forEach(rij => {
        const pod = parseInt(rij.cells[3].textContent, 10);
        const pta = parseInt(rij.cells[4].textContent, 10);

        totaalPOD += pod;
        totaalPTA += pta;
    });

    // Vervolgens het gewogen gemiddelde berekenen en toevoegen
    rijen.forEach(rij => {
        const pod = parseInt(rij.cells[3].textContent, 10);
        const pta = parseInt(rij.cells[4].textContent, 10);

        const podPercentage = totaalPOD ? (pod / totaalPOD * 100).toFixed(0) : 0;
        const ptaPercentage = totaalPTA ? (pta / totaalPTA * 100).toFixed(0) : 0;

        rij.cells[3].innerHTML = `${pod}<br>(${podPercentage}%)`;
        rij.cells[4].innerHTML = `${pta}<br>(${ptaPercentage}%)`;
    });
}



function genereerOverzichtInhoud() {
    refreshData();
    let contentPane = document.getElementById("overzichtContent");
    contentPane.innerHTML = '';

    let tabel = document.createElement('table');
    tabel.setAttribute('class', 'overzichtTabel');

    let thead = tabel.createTHead();
    let headerRow = thead.insertRow();
    let isAllesUitgeklapt = false;

    ['#', 'Week', '🔽 Beschrijving', 'POD', 'PTA'].forEach((text, index) => {
        let th = document.createElement('th');
        if (index === 2) {
            let span = document.createElement('span');
            span.innerHTML = text;
            span.style.cursor = 'pointer';
            // Initialiseer de data-uitgeklapt attribuut als false
            span.setAttribute('data-uitgeklapt', 'false');
            span.onclick = () => toggleAlleBeschrijvingen(span, tabel);
            th.appendChild(span);
        } else {
            th.textContent = text;
        }
        headerRow.appendChild(th);
    });
    tabel.createTBody();
    contentPane.appendChild(tabel);

    let sorteerKnop = document.createElement('button');
    sorteerKnop.id = 'sorteerKnop';
    sorteerKnop.textContent = 'Sorteer Toetsen';

    // Bepaal de status van heeftBewerkingsRechten
    heeftBewerkingsRechten = isBewerker && selectedJaar.includes(bewerkJaar) && !opSlot;

    // Zet de disabled status van de knop op basis van heeftBewerkingsRechten
    sorteerKnop.disabled = !heeftBewerkingsRechten;

    sorteerKnop.addEventListener('click', sorteerTabs);
    contentPane.appendChild(sorteerKnop);


    vulOverzichtTabel(); // Zorg dat deze functie wordt aangeroepen na het opzetten van de tabel
}

function toggleAlleBeschrijvingen(headerSpan, tabel) {
    // Gebruik een attribuut van het span-element om de uitklapstaat bij te houden
    let isUitgeklapt = headerSpan.getAttribute('data-uitgeklapt') === 'true';

    // Update de staat en het innerHTML van de headerSpan op basis van de huidige staat
    isUitgeklapt = !isUitgeklapt;
    headerSpan.setAttribute('data-uitgeklapt', isUitgeklapt);
    headerSpan.innerHTML = `${isUitgeklapt ? '🔼' : '🔽'}Beschrijving`;

    // Selecteer alle beschrijving spans in de tbody om hun inhoud te toggelen
    let tbody = tabel.querySelector('tbody');
    let beschrijvingSpans = tbody.querySelectorAll('.beschrijving-preview');

    beschrijvingSpans.forEach(span => {
        // Controleer of de huidige staat van de beschrijving overeenkomt met de gewenste staat
        if (isUitgeklapt !== span.isUitgeklapt) {
            span.click();
        }
    });
}



function toonTabInhoud(tabId) {
    document.querySelectorAll('.contentPane').forEach(pane => pane.style.display = 'none');
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    let contentPane = document.getElementById(tabId);
    if (contentPane) {
        contentPane.style.display = 'block';
    }

    let activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

function getPtaData(toetsNummer) {
    const toets = ptaData.tests.find(test => test.id === parseInt(toetsNummer));

    if (!toets) {
        console.error(`Toets met nummer ${toetsNummer} niet gevonden.`);
        return {
            id: toetsNummer,
            jaarPeriode: "",
            week: "",
            subdomain: "",
            description: "",
            afnamevorm: "",
            afnamevormAnders: "",
            beoordeling: "",
            tijd: "",
            tijdAnders: "",
            herkansbaar: "",
            pod: "",
            pta: "",
            hulpmiddelen: ""
        };
    }

    return {
        id: toets.id,
        jaarPeriode: toets.year_and_period,
        week: toets.week,
        subdomain: toets.subdomain,
        description: toets.description,
        afnamevorm: toets.type,
        afnamevormAnders: toets.type_else,
        beoordeling: toets.result_type,
        tijd: toets.time,
        tijdAnders: toets.time_else,
        herkansbaar: toets.resitable ? "Ja" : "Nee",
        pod: toets.pod_weight,
        pta: toets.pta_weight,
        hulpmiddelen: toets.tools.map(toolIndex => ptaData.tools[toolIndex]).join(", ")
    };
}


function laadToetsInhoud(toetsNummer, force = false) {
    try {
        const tabContent = document.getElementById('toets' + toetsNummer);
        if (force) {
            vulToetsInhoud(getPtaData(toetsNummer));
        }
        else if (tabContent && !tabContent.dataset.isLoaded) {
            vulToetsInhoud(getPtaData(toetsNummer));
            tabContent.dataset.isLoaded = 'true';
        } else if (!tabContent) {
            console.log(`TabContent met ID 'toets${toetsNummer}' niet gevonden.`);
        }
        adjustTextareaHeights(tabContent);
    } catch (error) {
        console.error("Fout in laadToetsInhoud: ", error);
    }
}

function setDisabledState(elements, disabled) {
    elements.forEach(element => {
        element.disabled = disabled;
    });
}

function setDisplayStyle(elements, displayStyle) {
    elements.forEach(element => {
        element.style.display = displayStyle;
    });
}

function setEditRights() {
    heeftBewerkingsRechten = isBewerker && selectedJaar.includes(bewerkJaar) && !opSlot;
    const invulVelden = document.querySelectorAll('.tabContent input, .tabContent select, .tabContent textarea');
    const buttons = document.querySelectorAll('.tabContent button');
    const iconen = document.querySelectorAll('.icon');
    const verwijderbareItems = document.querySelectorAll('.tabContent li');

    setDisabledState(invulVelden, !heeftBewerkingsRechten);
    setDisabledState(buttons, !heeftBewerkingsRechten);
    setDisplayStyle(iconen, heeftBewerkingsRechten ? 'inline-block' : 'none');

    verwijderbareItems.forEach(item => {
        item.style.pointerEvents = heeftBewerkingsRechten ? 'auto' : 'none';
    });

    // Speciale regels voor bepaalde inputs
    if (heeftBewerkingsRechten) {
        input4vwo.disabled = selectedNiveau === '5 VWO' || selectedNiveau === '6 VWO';
        input5vwo.disabled = selectedNiveau === '6 VWO';
        input4havo.disabled = selectedNiveau === '5 HAVO';
        input3mavo.disabled = selectedNiveau === '4 MAVO';
    }

    // Deze velden zijn altijd disabled
    input6vwo.disabled = true;
    input5havo.disabled = true;
    input4mavo.disabled = true;
}

function vulToetsInhoud(toetsData) {
    try {
        const template = document.getElementById('toetsTemplate');
        if (!template) {
            console.error("Template 'toetsTemplate' niet gevonden.");
            return;
        }

        const clone = template.content.cloneNode(true);
        vulVelden(clone, toetsData);
        toonAfnamevormAnders(clone, toetsData);
        toonTijdAnders(clone, toetsData);
        voegCloneToeAanTabContent(clone, toetsData.id);
    } catch (error) {
        console.error("Fout in vulToetsInhoud: ", error);
    }
}

function adjustTextareaHeights(element) {
    const textareas = element.querySelectorAll('textarea');
    textareas.forEach(adjustTextareaHeight);
    textareas.forEach(adjustTextareaHeight); // dit moet blijkbaar twee keer.. 
}


function adjustTextareaHeight(textarea) {
    //textarea.style.height = 'auto';
    let height = textarea.scrollHeight >= 0 && textarea.scrollHeight <= 45 ? 30 : textarea.scrollHeight
    textarea.style.height = (height) + 'px';
}

window.addEventListener('resize', () => {
    document.querySelectorAll('textarea').forEach(adjustTextareaHeight);
});

function vulVelden(clone, toetsData) {
    const velden = {
        '.toetsNummer': toetsData.id,
        '.jaarPeriode': toetsData.jaarPeriode,
        '.subdomein': toetsData.subdomain,
        '.stofomschrijving': toetsData.description,
        '.beoordeling': toetsData.beoordeling,
        '.pod': toetsData.pod,
        '.pta': toetsData.pta,
        '.hulpmiddelen': toetsData.hulpmiddelen ? toetsData.hulpmiddelen : "Geen"
    };

    for (let selector in velden) {
        const element = clone.querySelector(selector);
        if (element) {
            if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                element.value = velden[selector];
            } else {
                element.textContent = velden[selector];
            }
        }
    }
    updateWeekSelectie(clone, toetsData.week, toetsData.jaarPeriode);

    // Hulpmiddelen
    const hulpmiddelenList = clone.querySelector('.hulpmiddelen');
    if (hulpmiddelenList) {
        vulHulpmiddelenList(hulpmiddelenList, toetsData.hulpmiddelen);
    }

    // Afnamevorm
    const afnamevormSelect = clone.querySelector('.afnamevormSelect');
    if (afnamevormSelect) {
        setSelectValue(afnamevormSelect, toetsData.afnamevorm);
    }

    // Beoordeling
    const beoordelingSelect = clone.querySelector('.beoordelingSelect');
    if (beoordelingSelect) {
        setSelectValue(beoordelingSelect, toetsData.beoordeling);
    }

    // Herkansbaar
    const herkansbaarSelect = clone.querySelector('.herkansbaarSelect');
    if (herkansbaarSelect) {
        setSelectValue(herkansbaarSelect, toetsData.herkansbaar);
    }

    // Tijd
    const tijdSelect = clone.querySelector('.tijdSelect');
    if (tijdSelect) {
        setSelectValue(tijdSelect, toetsData.tijd.toString());
    }
}

function toonAfnamevormAnders(clone, toetsData) {
    const afnamevormSelect = clone.querySelector('.afnamevormSelect');
    const afnamevormAndersTextarea = clone.querySelector('.afnamevormAnders');

    if (!afnamevormSelect || !afnamevormAndersTextarea) {
        console.error("Elementen voor afnamevorm select en/of anders textarea niet gevonden.");
        return;
    }

    // Stel de waarde van afnamevormSelect in
    if (toetsData.afnamevorm) {
        afnamevormSelect.value = toetsData.afnamevorm;
        toggleExplanation(afnamevormSelect);
    }

    // Stel de waarde van afnamevormAndersTextarea in indien afnamevorm 'anders' is
    if (toetsData.afnamevorm === 'anders') {
        afnamevormAndersTextarea.value = toetsData.afnamevormAnders || "";
    }
}

function toonTijdAnders(clone, toetsData) {
    const tijdSelect = clone.querySelector('.tijdSelect');
    const tijdAndersTextarea = clone.querySelector('.tijdAnders');

    if (!tijdSelect || !tijdAndersTextarea) {
        console.error("Elementen voor afnamevorm select en/of anders textarea niet gevonden.");
        return;
    }

    // Stel de waarde van afnamevormSelect in
    if (toetsData.tijd) {
        tijdSelect.value = toetsData.tijd;
        toggleExplanation(tijdSelect);
    }

    // Stel de waarde van afnamevormAndersTextarea in indien afnamevorm 'anders' is
    if (toetsData.tijd === 'anders') {
        tijdAndersTextarea.value = toetsData.tijdAnders || "";
    }
}

function voegCloneToeAanTabContent(clone, toetsNummer) {
    const tabContent = document.getElementById('toets' + toetsNummer);
    if (!tabContent) {
        console.error(`TabContent met ID 'toets${toetsNummer}' niet gevonden.`);
        return;
    }

    tabContent.innerHTML = '';
    tabContent.appendChild(clone);

}

function setSelectValue(selectElement, value) {
    const optionToSelect = Array.from(selectElement.options).find(option => option.value === value);
    if (optionToSelect) {
        selectElement.value = value;
    } else if (!heeftBewerkingsRechten) {
        // Als de gebruiker bewerkingsrechten heeft, voeg de waarde toe als nieuwe optie
        const nieuweOptie = new Option(value, value);
        selectElement.add(nieuweOptie);
        selectElement.value = value;
    } else {
        // Als de waarde niet bestaat en de gebruiker geen bewerkingsrechten heeft, log een fout
        console.error(`Waarde '${value}' komt niet overeen met een beschikbare optie in de select.`);
    }
}


function vulHulpmiddelenList(ulElement, hulpmiddelen) {
    if (!hulpmiddelen || hulpmiddelen.length === 0) {
        ulElement.textContent = "Geen";
        return;
    }

    ulElement.innerHTML = '';
    // Controleer of hulpmiddelen een string is en splits indien nodig
    const hulpmiddelenArray = Array.isArray(hulpmiddelen) ? hulpmiddelen : hulpmiddelen.split(', ');
    hulpmiddelenArray.forEach(hulpmiddel => {
        const li = document.createElement('li');
        li.textContent = hulpmiddel.trim();
        li.addEventListener('click', () => verwijderHulpmiddel(li));
        ulElement.appendChild(li);
    });
}


function verwijderHulpmiddel(liElement) {
    liElement.remove();
}


function maakTab(tabId, tabNummer, tabsContainer, contentContainer) {
    // Maak de tab
    let tab = document.createElement('div');
    tab.className = 'tab';
    tab.id = 'tab' + tabId;
    tab.dataset.tab = 'toets' + tabId;
    tab.textContent = tabNummer;

    // Prullenbak icoon toevoegen
    let deleteIcon = document.createElement('span');
    deleteIcon.classList.add('icon', 'delete-icon');
    deleteIcon.textContent = 'X';
    deleteIcon.onclick = (e) => {
        e.stopPropagation();
        // Haal de huidige tab ID dynamisch op
        const huidigeTabId = tab.id.substring(3);
        if (window.confirm(`Weet u zeker dat u tab ${tabNummer} wilt verwijderen?`)) {
            verwijderTab(huidigeTabId, tabsContainer, contentContainer);
        }
    };

    tab.appendChild(deleteIcon);

    // Inhoudspaneel maken
    let contentPane = document.createElement('div');
    contentPane.id = 'toets' + tabId;
    contentPane.className = 'contentPane';
    contentPane.style.display = 'none';
    contentContainer.appendChild(contentPane);

    // Tab klik event
    tab.onclick = () => {
        // Haal de huidige tab ID dynamisch op
        const huidigeTabId = tab.dataset.tab.substring(5);
        toonTabInhoud('toets' + huidigeTabId);
        laadToetsInhoud(huidigeTabId);
        setEditRights();
    };

    let tabToevoegenKnop = document.getElementById('voegTabToe');
    tabsContainer.insertBefore(tab, tabToevoegenKnop);

}

function verwijderTab(tabNummer, tabsContainer) {
    let tabOmTeVerwijderen = document.getElementById(`tab${tabNummer}`);
    if (!tabOmTeVerwijderen) {
        console.error(`Tab met ID tab${tabNummer} niet gevonden`);
        return;
    }

    // Eerst proberen de volgende sibling te krijgen, tenzij het de toevoegen-knop is
    let naburigeTab = tabOmTeVerwijderen.nextElementSibling;
    if (!naburigeTab || naburigeTab.id === 'voegTabToe') {
        naburigeTab = tabOmTeVerwijderen.previousElementSibling;
    }

    tabsContainer.removeChild(tabOmTeVerwijderen);
    console.log(`Tab tab${tabNummer} succesvol verwijderd`);

    // Pas de zichtbare nummering van de volgende tabs aan
    let dynamischeTabs = tabsContainer.querySelectorAll('.tab:not(.tab-toevoegen-knop):not(#tabWegingen):not(#tabOverzicht)');
    let huidigTabNummer = parseInt(tabOmTeVerwijderen.textContent);
    dynamischeTabs.forEach(tab => {
        let tabNummer = parseInt(tab.textContent);
        if (tabNummer > huidigTabNummer) {
            tab.firstChild.nodeValue = `${tabNummer - 1} `;
        }
    });

    // Activeren van de naburige tab indien beschikbaar
    if (naburigeTab && naburigeTab.classList.contains('tab')) {
        naburigeTab.click();
    }
}


function voegNieuweTabToe() {
    let tabsContainer = document.querySelector('.tabs');
    let contentContainer = document.querySelector('.tabContent');

    if (!tabsContainer || !contentContainer) {
        console.error("Tabs container of content container niet gevonden");
        return;
    }

    // Bepaal het nieuwe ID gebaseerd op het hoogste bestaande ID in ptaData.tests plus één
    let hoogsteId = ptaData.tests.reduce((acc, test) => Math.max(acc, test.id), 0);
    let nieuweTabId = hoogsteId + 1;

    // Vind het huidige laatste textContentNummer van de bestaande tabs en voeg 1 toe voor het nieuwe tabNummer
    let laatsteTabNummer = Array.from(document.querySelectorAll('.tabs .tab'))
        .map(tab => parseInt(tab.textContent.match(/\d+/) ? tab.textContent.match(/\d+/)[0] : 0))
        .filter(nummer => !isNaN(nummer))
        .reduce((max, huidigNummer) => Math.max(max, huidigNummer), 0);
    let nieuweTabNummer = laatsteTabNummer + 1;

    // Voeg een nieuwe test toe aan ptaData.tests
    ptaData.tests.push({
        id: nieuweTabId,
        year_and_period: "",
        week: "",
        subdomain: "",
        description: "",
        type: "",
        type_else: null,
        result_type: "",
        time: 0,
        time_else: null,
        resitable: null,
        pod_weight: 0,
        pta_weight: 0,
        tools: []
    });

    maakTab(nieuweTabId.toString(), nieuweTabNummer.toString(), tabsContainer, contentContainer);
    laadToetsInhoud(nieuweTabId);
    toonTabInhoud(`toets${nieuweTabId}`);
}


document.getElementById('voegTabToe').onclick = voegNieuweTabToe;


function updateWeekSelectie(clone, weekWaarde, jaarPeriode) {
    const weekSelect = clone.querySelector('.weekSelect');
    const weekInputField = clone.querySelector('.pickWeek .week');
    const jaarPeriodeSpan = clone.querySelector('.jaarPeriode');

    if (!weekSelect || !weekInputField || !jaarPeriodeSpan) {
        console.error("Weekselect, week inputfield of jaarPeriode span niet gevonden in de clone");
        return;
    }

    // Toon of verberg pickWeek en werk jaarPeriode bij
    toggleWeekInputEnBijwerkenJaarPeriode(weekSelect, weekInputField, jaarPeriodeSpan, weekWaarde, jaarPeriode);
}
function toggleWeekInputEnBijwerkenJaarPeriode(weekSelect, weekInputField, jaarPeriodeSpan, weekWaarde, jaarPeriode) {
    // Normalizeer de weekWaarde om consistent te zijn met of zonder spatie
    const genormaliseerdeWeekWaarde = weekWaarde.replace(/SE(\d)/, 'SE $1');

    if (genormaliseerdeWeekWaarde.startsWith('SE')) {
        weekInputField.parentElement.style.display = 'none';
        jaarPeriodeSpan.textContent = `${parseInt(selectedNiveau.split(' ')[0])}.${weekWaarde.split(' ')[1]}`
        setSelectValue(weekSelect, genormaliseerdeWeekWaarde);
    } else {
        weekInputField.parentElement.style.display = 'block';
        weekInputField.value = heeftBewerkingsRechten && weekWaarde.length > 2? '' : weekWaarde; 
        setSelectValue(weekSelect, 'week');
        jaarPeriodeSpan.textContent = heeftBewerkingsRechten ? berekenJaarPeriode(weekWaarde) : jaarPeriode;
    }

    weekInputField.oninput = () => {
        let weekNummer = parseInt(weekInputField.value);
        weekNummer = isNaN(weekNummer) ? 0 : Math.min(weekNummer, 53);
        weekInputField.value = weekNummer;
        jaarPeriodeSpan.textContent = berekenJaarPeriode(weekNummer);
    };
}


function berekenJaarPeriode(weekNummer) {
    let periode = parseInt(selectedNiveau.split(' ')[0])
    // Omzetten van weeknummer naar een getal indien het een string is
    weekNummer = parseInt(weekNummer, 10);

    // Normaliseer weeknummers volgens de schoolkalender
    let genormaliseerdWeekNummer = weekNummer >= 33 ? weekNummer - 32 : weekNummer + 20;

    // Omzetten van SE-weken naar de genormaliseerde schoolkalender
    const genormaliseerdeSEWeekNummers = Object.keys(defaultPeriods).reduce((acc, key) => {
        const value = defaultPeriods[key];
        acc[key] = value >= 33 ? value - 32 : value + 20;
        return acc;
    }, {});

    // Bepaal de periode gebaseerd op het genormaliseerd weeknummer
    if (genormaliseerdWeekNummer < genormaliseerdeSEWeekNummers['SE 1']) {
        return `${periode}.1`;
    } else if (genormaliseerdWeekNummer < genormaliseerdeSEWeekNummers['SE 2']) {
        return `${periode}.2`;
    } else if (genormaliseerdWeekNummer < genormaliseerdeSEWeekNummers['SE 3']) {
        return `${periode}.3`;
    } else if (genormaliseerdWeekNummer < genormaliseerdeSEWeekNummers['SE 4']) {
        return `${periode}.4`;
    } else { // Na SE 4 tot week 32
        return `${periode}.4`;
    }
}



function togglePickWeek(selectElement) {
    var pickWeekDiv = selectElement.nextElementSibling;
    var jaarPeriodeSpan = selectElement.closest('.jaarEnWeek').querySelector('.jaarPeriode');
    var weekInputField = pickWeekDiv.querySelector('.week');

    if (!pickWeekDiv || !jaarPeriodeSpan || !weekInputField) {
        console.error("JaarPeriode span, pickWeek div of week inputfield niet gevonden");
        return;
    }
    let weekWaarde = selectElement.value == 'week' ? "" : selectElement.value
    toggleWeekInputEnBijwerkenJaarPeriode(selectElement, weekInputField, jaarPeriodeSpan, weekWaarde);
}

function voorbewerkTools(tools) {
    // Maak een nieuwe Set om unieke waarden te garanderen
    let uniekeToolsSet = new Set();

    // Voeg eerst de defaultTools toe aan de set
    if (defaultTools && Array.isArray(defaultTools)) {
        defaultTools.forEach(tool => uniekeToolsSet.add(tool));
    }

    // Verwerk en voeg de meegegeven tools toe
    tools.forEach(tool => {
        if (tool.includes(',')) {
            // Split de items op basis van komma, trim ze, en voeg ze toe aan de set
            tool.split(',').forEach(t => uniekeToolsSet.add(t.trim()));
        } else {
            uniekeToolsSet.add(tool);
        }
    });

    // Converteer de set terug naar een array
    let voorbewerkteTools = Array.from(uniekeToolsSet);
    return voorbewerkteTools;
}

function openToolModal() {
    removeExistingModals();
    const actieveTabId = document.querySelector('.tab.active').getAttribute('data-tab');
    const hulpmiddelenList = document.getElementById(actieveTabId).querySelector('.hulpmiddelen');
    const geselecteerdeHulpmiddelen = hulpmiddelenList ? Array.from(hulpmiddelenList.querySelectorAll('li')).map(li => li.textContent) : [];

    // Correcte verwerking van geselecteerde hulpmiddelen
    const voorbewerkteTools = voorbewerkTools(ptaData.tools);

    createSearchModal(
        `Kies Hulpmiddelen`,
        voorbewerkteTools,
        () => bevestigTools(geselecteerdeHulpmiddelen, actieveTabId),
        undefined,
        true,
        geselecteerdeHulpmiddelen
    );
}

function bevestigTools(nieuweHulpmiddelen, actieveTabId) {
    const hulpmiddelenList = document.getElementById(actieveTabId).querySelector('.hulpmiddelen');
    // Roep vulHulpmiddelenList aan met de nieuwe hulpmiddelen
    vulHulpmiddelenList(hulpmiddelenList, nieuweHulpmiddelen);
    removeExistingModals(); // Sluit de modal
}

function valideerNumberInput(e) {
    let invoer = e.target.value;
    // Verwijder alles behalve numerieke waarden
    let gefilterdeInvoer = invoer.replace(/[^0-9]/g, '');

    // Zet de gefilterde invoer om naar een integer, of 0 als het resultaat NaN is
    let waarde = parseInt(gefilterdeInvoer, 10) || 0;
    // Stel de waarde van het input veld in
    e.target.value = waarde > 100 ? 100 : waarde;
}

let nieuwePtaData;
function refreshData() {
    nieuwePtaData = { ...ptaData, tests: [] };
    getNieuwePtaData();
    updateNieuwePtaData();
    verversTabsIds()
    ptaData = { ...nieuwePtaData };
    ptaData.tests.forEach(test => {
        laadToetsInhoud(test.id, true);
    });
    resetPercentages();
}

function resetPercentages() {
    // Controleer of ptaData.weights bestaat en heeft elementen; zo niet, gebruik een lege array
    const weights = ptaData.weights || [];
    
    vwoWegingen = {
        '4 VWO': weights[0] || 0,
        '5 VWO': weights[1] || 0,
        '6 VWO': weights[2] || 0
    };
    havoWegingen = {
        '4 HAVO': weights[0] || 0,
        '5 HAVO': weights[1] || 0
    };
    mavoWegingen = {
        '3 MAVO': weights[0] || 0,
        '4 MAVO': weights[1] || 0
    };

    laadPercentages();
}

function getNieuwePtaData() {
    const tabs = document.querySelectorAll('.tabs .tab:not(:nth-child(1)):not(:nth-child(2))');
    tabs.forEach(tab => {
        const idNummer = parseInt(tab.id.substring(3), 10);
        const textContentMatch = tab.textContent.match(/\d+/);
        const textContentNummer = textContentMatch ? parseInt(textContentMatch[0], 10) : null;
        if (textContentNummer === null) return;

        const origineleTest = ptaData.tests.find(test => test.id === idNummer);
        if (origineleTest) {
            const aangepasteTest = { ...origineleTest, id: textContentNummer };
            nieuwePtaData.tests.push(aangepasteTest);
        } else {
            nieuwePtaData.tests.push({
                id: textContentNummer,
                year_and_period: "",
                week: "",
                subdomain: "",
                description: "",
                type: "",
                type_else: null,
                result_type: "",
                time: 0,
                time_else: null,
                resitable: null,
                pod_weight: 0,
                pta_weight: 0,
                tools: []
            });
        }
    });

    // Sorteer de tests in nieuwePtaData op basis van ID om ze in de juiste volgorde te hebben
    nieuwePtaData.tests.sort((a, b) => a.id - b.id);
}


function updateNieuwePtaData() {
    const tabs = document.querySelectorAll('.tabs .tab:not(:nth-child(1)):not(:nth-child(2))');
    tabs.forEach(tab => {
        const idNummer = parseInt(tab.id.substring(3), 10); // Gebruikt voor het ophalen van de tab-content
        const textContentMatch = tab.textContent.match(/\d+/);
        const textContentNummer = textContentMatch ? parseInt(textContentMatch[0], 10) : null; // Gebruikt voor het updaten van tests in nieuwePtaData
        if (textContentNummer === null) return;

        const tabContent = document.getElementById('toets' + idNummer);
        if (tabContent && tabContent.dataset.isLoaded === 'true') {
            // Vind de corresponderende test in nieuwePtaData op basis van textContentNummer en update deze
            const testIndex = nieuwePtaData.tests.findIndex(test => test.id === textContentNummer);
            if (testIndex !== -1) {
                const contentPane = document.getElementById('toets' + idNummer);
                const testData = getPtaDataFromTab(contentPane);

                // Nu testData toewijzen aan de juiste test in nieuwePtaData
                Object.assign(nieuwePtaData.tests[testIndex], testData);
            }

        }
    });

    // Overweeg hier ook de logica voor het bijwerken van eventuele lege nieuwe tests
}

function verversTabsIds() {
    // Verzamel alle tabs behalve de eerste twee
    const tabs = document.querySelectorAll('.tabs .tab:not(:nth-child(1)):not(:nth-child(2))');

    tabs.forEach(tab => {
        const textContentMatch = tab.textContent.match(/\d+/);
        const textContentNummer = textContentMatch ? textContentMatch[0] : null;
        if (!textContentNummer) return;

        // Update de id en data-tab attributen van de tab
        tab.id = `tab${textContentNummer}`;
        tab.setAttribute('data-tab', `toets${textContentNummer}`);

        // Vind de overeenkomende content div op basis van de originele id en update deze
        const tabContent = document.querySelector(`.contentPane[id="${tab.getAttribute('data-tab')}"]`);
        if (tabContent) {
            tabContent.id = `toets${textContentNummer}`;
        }
    });
}

function getPtaDataFromTab(contentPane) {
    const data = {
        week: contentPane.querySelector('.weekSelect').value === 'week'
            ? contentPane.querySelector('.inputField.week').value
            : contentPane.querySelector('.weekSelect').value,
        year_and_period: contentPane.querySelector('.jaarPeriode').textContent,
        subdomain: contentPane.querySelector('.subdomein').value,
        description: contentPane.querySelector('.stofomschrijving').value,
        type: contentPane.querySelector('.afnamevormSelect').value,
        type_else: contentPane.querySelector('.afnamevormSelect').value === 'anders'
            ? contentPane.querySelector('.afnamevormAnders').value
            : null,
        time: parseInt(contentPane.querySelector('.tijdSelect').value, 10),
        time_else: contentPane.querySelector('.tijdSelect').value === 'anders'
            ? contentPane.querySelector('.tijdAnders').value
            : null,
        result_type: contentPane.querySelector('.beoordelingSelect').value,
        pod_weight: parseInt(contentPane.querySelector('.pod').value, 10),
        pta_weight: parseInt(contentPane.querySelector('.pta').value, 10),
        resitable: contentPane.querySelector('.herkansbaarSelect').value === 'Ja',
        tools: Array.from(contentPane.querySelectorAll('.hulpmiddelen li')).map(li => {
            return ptaData.tools.indexOf(li.textContent.trim());
        }).filter(index => index !== -1)
    };
    return data;
}

function weekNaarUniformNummer(week) {
    // Check of de week een SE-week is en converteer deze naar het juiste weeknummer
    const weekNummer = defaultPeriods[week] || parseInt(week, 10);
    // Behandel weken als doorgaand vanaf week 33 tot week 32 van het volgende jaar
    return weekNummer >= 33 ? weekNummer - 33 : weekNummer + 20;
}

function herindexeerTestIDs() {
    let startnummer = parseInt(selectedNiveau.split(' ')[0]) * 100 + 1
    ptaData.tests.forEach((test, index) => {
        test.id = startnummer + index; // Begin bij 601 en ga verder
    });
}

function sorteerTabs() {
    console.log('sorteren')
    ptaData.tests.sort((a, b) => {
        const weekNummerA = weekNaarUniformNummer(a.week);
        const weekNummerB = weekNaarUniformNummer(b.week);

        return weekNummerA - weekNummerB;
    });
    herindexeerTestIDs();
    ptaData.tests.forEach(test => {
        laadToetsInhoud(test.id, true);
    });
    vulOverzichtTabel();
}

function setLegeVelden() {
    let algemeneLegeVeldenGevonden = false;

    // Reset alle markeringen
    document.querySelectorAll('.tab').forEach(tab => {
        tab.style.border = '';
    });

    document.querySelectorAll('.contentPane input, .contentPane select').forEach(element => {
        element.style.border = '';
    });

    ptaData.tests.forEach(test => {
        let legeVeldenGevondenVoorDezeTest = false;
        const tab = document.getElementById('tab' + test.id);
        const contentPane = document.getElementById('toets' + test.id);

        // Definieer de velden om te controleren
        const veldenTeControleren = [
            { sleutel: 'week', selectie: contentPane.querySelector('.weekSelect').value === 'week' ? '.inputField.week' : '.weekSelect' },
            { sleutel: 'subdomain', selectie: '.subdomein' },
            { sleutel: 'description', selectie: '.stofomschrijving' },
            { sleutel: 'type', selectie: '.afnamevormSelect', anders: '.afnamevormAnders' },
            { sleutel: 'time', selectie: '.tijdSelect', anders: '.tijdAnders' },
            { sleutel: 'result_type', selectie: '.beoordelingSelect' },
            { sleutel: 'resitable', selectie: '.herkansbaarSelect' }
        ];

        veldenTeControleren.forEach(veld => {
            const element = contentPane.querySelector(veld.selectie);
            const waarde = element ? element.value : null;
            const elementAnders = veld.anders ? contentPane.querySelector(veld.anders) : null;
            const waardeAnders = elementAnders ? elementAnders.value : null;

            if ((veld.sleutel === 'type' || veld.sleutel === 'time') && waarde === 'anders' && (!waardeAnders || waardeAnders.trim() === '')) {
                if (elementAnders) {
                    elementAnders.style.borderColor = 'red';
                    legeVeldenGevondenVoorDezeTest = true;
                }
            } else if (!waarde || waarde.trim() === '') {
                if (element) {
                    element.style.border = '1px solid red';
                    legeVeldenGevondenVoorDezeTest = true;
                }
            }
        });

        if (legeVeldenGevondenVoorDezeTest) {
            tab.style.border = '1px solid red';
            algemeneLegeVeldenGevonden = true;
        }
    });

    return algemeneLegeVeldenGevonden;
}

function isGesorteerd(tests) {
    for (let i = 0; i < tests.length - 1; i++) {
        if (weekNaarUniformNummer(tests[i].week) > weekNaarUniformNummer(tests[i + 1].week)) {
            return false; // Vroegtijdige return als een test later komt dan de volgende
        }
    }
    return true; // Alle tests zijn correct gesorteerd
}


function OptiesUitDatabase(afkorting = "") {
    return fetch(`/api/defaults/subjects`) // Let op: we retourneren de promise hier direct
        .then(response => {
            if (!response.ok) {
                throw new Error('Netwerkrespons was niet ok');
            }
            return response.json();
        })
        .then(data => {
            if (afkorting) {
                data = data.filter(vak => vak.responsible.includes(afkorting));
            }
            vakkenJuistzetten(data);
        });
}


function vakkenJuistzetten(fdata) {
    vakkenOpties = []
    for (let i = 0; i < fdata.length; i++) {
        if (!chekkenOfHetzelfde(fdata[i].name, vakkenOpties)) {
            vakkenOpties.push(fdata[i].name)
        }
    }
}

function chekkenOfHetzelfde(a, b) {
    for (let i = 0; i < b.length; i++) {
        if (a === b[i]) {
            return true
        }
    }
    return false
}

async function laadPta() {
    try {
        const response = await fetch(`/api/pta/search?name=${encodeURIComponent(selectedVak)}&level=${encodeURIComponent(selectedNiveau)}`);

        // Speciale behandeling voor als de bron niet gevonden wordt (404)
        if (response.status === 404) {
            ptaData = creëerLegePta(selectedVak, selectedNiveau);
        } else if (!response.ok) {
            throw new Error(`Netwerkrespons was niet ok, status: ${response.status}`);
        } else {
            const data = await response.json();
            
            // Controleer of we resultaten hebben, zo niet, creëer een lege PTA
            ptaData = data.length > 0 ? data[0] : creëerLegePta(selectedVak, selectedNiveau);
        }

        // Voer de rest van de verwerking uit
        genereerToetsen();
        refreshData();
    } catch (error) {
        console.error('Fout bij het laden van PTA:', error);
    }
}

  
function selecteerRecentstePta(fptas) {
    const recentstePta = fptas.reduce((recentste, huidig) => {
        const recentsteJaar = recentste.cohort.split(' - ')[1];
        const huidigJaar = huidig.cohort.split(' - ')[1];
        return recentsteJaar > huidigJaar ? recentste : huidig;
    });
    ptaData = recentstePta
}


function initialiseerTemplate() {
    setToetsSoorten();
    setDurations();
    setDefaultTools();
    setPeriods();
}

function setToetsSoorten() {
    getToetssoorten().then(toetssoorten => {
        if (!toetssoorten) return;
        // Transformeer de toetssoorten naar het benodigde formaat
        const verwerkteToetssoorten = toetssoorten.map(toetssoort => ({
            text: toetssoort, // Behoud de originele tekst voor de weergave
            value: toetssoort.toLowerCase() // Zet de waarde om naar kleine letters
        }));
        setDropdownTemplate(verwerkteToetssoorten, 'afnamevormSelect');
    }).catch(error => {
        console.error('Fout bij het laden van toetssoorten:', error);
    });
}


function getToetssoorten() {
    return fetch(`/api/defaults/types`)
        .then(response => {
            if (!response.ok) throw new Error('Netwerkrespons was niet ok');
            return response.json();
        });
}

function setDurations() {
    getDurations().then(durations => {
        if (!durations) return;
        const verwerkteDurations = durations.map(duration => {
            return typeof duration === 'number' ?
                { text: `${duration} min.`, value: duration } :
                duration; // Houd 'Anders' of andere strings ongewijzigd
        });
        // Voeg 'Anders' toe, indien niet al aanwezig
        if (!verwerkteDurations.some(item => item === 'Anders' || (item.text && item.text === 'Anders'))) {
            verwerkteDurations.push('Anders');
        }
        setDropdownTemplate(verwerkteDurations, 'tijdSelect');
    }).catch(error => {
        console.error('Fout bij het laden van durations:', error);
    });
}


function getDurations() {
    return fetch(`/api/defaults/durations`)
        .then(response => {
            if (!response.ok) throw new Error('Netwerkrespons was niet ok');
            return response.json();
        });
}

let defaultTools;
function setDefaultTools() {
    getDefaultTools().then(tools => {
        defaultTools = tools;
    }).catch(error => {
        console.error('Fout bij het ophalen van de default tools:', error);
    });
}

function getDefaultTools() {
    return fetch(`/api/defaults/tools`)
        .then(response => {
            if (!response.ok) throw new Error('Netwerkrespons was niet ok');
            return response.json();
        });
}

let defaultPeriods = {
    'SE 1': 41,
    'SE 2': 51,
    'SE 3': 10,
    'SE 4': 26
};
function setPeriods() {
    getPeriods().then(periods => {
        if (!periods || periods.length < 4) return; // Controleer of we minstens 4 perioden hebben

        // Update de defaultPeriods met de end_week waarden van de opgehaalde perioden
        defaultPeriods['SE 1'] = periods[0].end_week;
        defaultPeriods['SE 2'] = periods[1].end_week;
        defaultPeriods['SE 3'] = periods[2].end_week;
        defaultPeriods['SE 4'] = periods[3].end_week;
    }).catch(error => {
        console.error('Fout bij het ophalen van de perioden:', error);
    });
}


function getPeriods() {
    return fetch(`/api/defaults/periods`)
        .then(response => {
            if (!response.ok) throw new Error('Netwerkrespons was niet ok');
            return response.json();
        });
}

function setDropdownTemplate(data, element) {
    let template = document.getElementById('toetsTemplate');
    let selectElement = template.content.querySelector(`.${element}`);
    if (!selectElement) {
        console.error('Select element niet gevonden in template');
        return;
    }

    selectElement.innerHTML = ''; // Verwijder bestaande opties
    data.forEach(item => {
        let optie = document.createElement('option');
        // Check of het item een object is voor custom tekst en waarde
        if (typeof item === 'object' && item.text !== undefined && item.value !== undefined) {
            optie.textContent = item.text;
            optie.value = item.value;
        } else {
            optie.value = item.toString();
            optie.textContent = item.toString();
        }
        selectElement.appendChild(optie);
    });
}

// TODO verbeteren dat alle informatie goed wordt gezet
function creëerLegePta(vak, niveau) {
    // Vertaal het niveau naar het juiste ID-formaat voor de test
    const basisId = niveau.replace(/\D/g, ''); // Verwijder niet-digit karakters
    const testId = parseInt(basisId + '01', 10); // Voeg '01' toe en converteer naar een getal
    console.log(testId)
    return {
        id: "",
        name: vak,
        level: niveau,
        cohort: "",
        responsible: "",
        tools: [
            "pen (blauw of zwart), potlood, geodriehoek/lineaal",
            "woordenboek",
            "rekenmachine (niet grafisch)",
            "geen"
        ],
        tests: [{
            id: testId,
            year_and_period: "",
            week: "",
            subdomain: "",
            description: "",
            type: "",
            type_else: null,
            result_type: "",
            time: 0,
            time_else: null,
            resitable: null,
            pod_weight: 0,
            pta_weight: 0,
            tools: []
        }]
    };
}

  