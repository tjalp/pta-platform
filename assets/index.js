// Globale variabelen
let isBewerker = false;
let selectedBewerkerOfBekijker = "";
let prevVak = "";
let selectedVak = "";
let selectedJaar = "";
let prevNiveau = "";
let selectedNiveau = "";
let isDynamicButtonClicked = false;
let isEersteKeer = true;

function toggleExplanation(selectElement) {
    var explanationDiv = selectElement.parentElement.querySelector('.explanationDiv');

    if (selectElement.value === 'anders') {
        explanationDiv.classList.add('visible');
    } else {
        explanationDiv.classList.remove('visible');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    isEersteKeer = true;
    start();
    genereerToetsen();
});

function start() {
    //fetchFromDatabase();
    isEersteKeer = true;
    isDynamicButtonClicked = false;
    console.log('start')
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
    vakkeuze();
}

function bewerken() {
    removeExistingModals();
    const modal = createModal('Inloggen', [
        { type: 'input', placeholder: 'Afkorting' },
        { type: 'input', placeholder: 'Wachtwoord', inputType: 'password' },
        { text: 'Terug', action: start },
        { text: 'Bevestigen', action: bevestigBewerken }
    ]);
    document.body.appendChild(modal);
}

function bevestigBewerken() {
    // Hier moet verificatie worden afgehandeld
    isBewerker = true;
    selectedBewerkerOfBekijker = "Bewerken";
    vakkeuze();
}

function initialiseerKeuzeModal(keuzeType, opties, bevestigingsActie, terugActie) {
    try {
        removeExistingModals();

        console.log(`Opening modal voor: ${keuzeType}`);
        createSearchModal(
            `Voor welk ${keuzeType.toLowerCase()} wilt u PTAs ${isBewerker ? 'bewerken' : 'bekijken'}?`,
            opties,
            (geselecteerdeOpties) => bevestigKeuze(keuzeType, geselecteerdeOpties),
            terugActie, // Terug actie
            false, // Meervoudige selectie niet toegestaan
            []
        );
    } catch (error) {
        console.error(`Fout bij het initialiseren van keuzeModal voor ${keuzeType}:`, error);
    }
}

function bevestigKeuze(keuzeType, geselecteerdeOpties) {
    try {
        const selected = geselecteerdeOpties.length > 0 ? geselecteerdeOpties[0] : null;
        if (!selected) {
            throw new Error(`Geen ${keuzeType.toLowerCase()} geselecteerd.`);
        }

        console.log(`Geselecteerde ${keuzeType.toLowerCase()}: ${selected}`);
        updateSelection(keuzeType, selected);

        // Ga naar de volgende keuze of maak dynamische knoppen aan
        if (isEersteKeer) {
            switch (keuzeType) {
                case 'Vak': jaarkeuze(); break;
                case 'Jaar': niveaukeuze(); break;
                case 'Niveau':
                    createDynamicButtons();
                    isEersteKeer = false; // Stop de initiële reeks
                    break;
            }
        }
    } catch (error) {
        console.error(`Fout bij bevestiging van ${keuzeType}:`, error);
    } finally {
        if (!isEersteKeer) {
            removeExistingModals();
        }
    }
}

function vakkeuze() {
    initialiseerKeuzeModal('Vak', vakkenOpties, (opties) => bevestigKeuze('Vak', opties), start);
}

function jaarkeuze() {
    initialiseerKeuzeModal('Jaar', jaarOpties, (opties) => bevestigKeuze('Jaar', opties), vakkeuze);
}

function niveaukeuze() {
    initialiseerKeuzeModal('Niveau', niveauOpties, (opties) => bevestigKeuze('Niveau', opties), jaarkeuze);
}

function updateSelection(keuzeType, selected) {
    switch (keuzeType) {
        case 'Vak': selectedVak = selected; break;
        case 'Niveau': selectedNiveau = selected; break;
        case 'Jaar': selectedJaar = selected; break;
        default: throw new Error(`Onbekend keuzeType: ${keuzeType}`);
    }
    updateDynamicButtonValue(keuzeType, selected);
}

function createButton(text, clickAction) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', clickAction);
    return button;
}

function createDynamicButtons() {
    const buttonContainer = document.getElementById('dynamicButtons');
    if (!buttonContainer) {
        console.error('Button container niet gevonden');
        return;
    }

    buttonContainer.innerHTML = ''; // Bestaande knoppen verwijderen

    // Definieer de knoppen met hun tekst en acties
    const buttons = [
        { text: selectedBewerkerOfBekijker, action: start },
        { text: selectedVak || 'Selecteer Vak', action: vakkeuze },
        { text: selectedNiveau || 'Selecteer Niveau', action: niveaukeuze },
        { text: selectedJaar || 'Selecteer Jaar', action: jaarkeuze },
    ];

    // Creëer en voeg elke knop toe aan de container
    buttons.forEach(({ text, action }) => {
        const button = createButton(text, action);
        buttonContainer.appendChild(button);
    });

    isDynamicButtonClicked = false; // Reset deze variabele
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
            contentHtml += `<div ${el.id}></div>`;
        }
        else {
            contentHtml += `<button onclick="${el.action.name}()">${el.text}</button>`;
        }
    });

    contentHtml += `</div></div>`;
    modal.innerHTML = contentHtml;
    return modal;
}

function updateDynamicButtonValue(buttonType, value) {
    isDynamicButtonClicked = false;

    // Gebruik de 'name' attribuut om de juiste knop te vinden
    const button = document.querySelector(`#dynamicButtons button[name="${buttonType}"]`);
    if (button) {
        button.textContent = value;
    }
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

function handleDynamicButtonClick(buttonType) {
    // Zet de variabele op true zodra er op een knop wordt geklikt
    isDynamicButtonClicked = true;
    // Afhandelen van de knopklik gebaseerd op het type
    switch (buttonType) {
        case 'Rol':
            start();
            break;
        case 'Vak':
            vakkeuze();
            break;
        case 'Niveau':
            niveaukeuze();
            break;
        case 'Jaar':
            jaarkeuze();
            break;
        default:
            break;
    }
}


/*
CODE VOOR PERCENTAGES
*/
const vwoVelden = document.getElementById('vwoVelden');
const havoVelden = document.getElementById('havoVelden');
const input4vwo = document.getElementById('percentage4vwo');
const input5vwo = document.getElementById('percentage5vwo');
const input6vwo = document.getElementById('percentage6vwo');
const input4havo = document.getElementById('percentage4havo');
const input5havo = document.getElementById('percentage5havo');
const foutDiv = document.getElementById('errorPercentages');

function laadAlles() {
    laadPercentages();

    // fetch(`/api/pta/search?name=${selectedVak}&level=${selectedNiveau}`)
    //     .then(response => response.json())
    //     .then(data => {
    //         ptaData = data[0];
    //     })
    //     .catch(error => console.error(error));
}

function laadPercentages() {
    vwoVelden.style.display = selectedNiveau.toLowerCase().includes('vwo') ? 'block' : 'none';
    havoVelden.style.display = selectedNiveau.toLowerCase().includes('havo') ? 'block' : 'none';


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
    if (selectedNiveau.toLowerCase().includes('vwo')) {
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
    else if (selectedNiveau.toLowerCase().includes('havo')) {
        let weging4havo = parseInt(input4havo.value) || 0;

        if (weging4havo <= 100) {
            let weging5havo = 100 - weging4havo;
            input5havo.value = weging5havo >= 0 ? weging5havo : '';
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
    searchInput.placeholder = 'Zoeken...';
    searchInput.onkeyup = () => filterOptions(ul, searchOptions, searchInput.value, geselecteerdeOpties, meervoudigeSelectie);
    return searchInput;
}


function filterOptions(ul, searchOptions, searchTerm, geselecteerdeOpties, meervoudigeSelectie) {
    ul.innerHTML = ''; // Maak de lijst leeg voor nieuwe resultaten

    const filteredOptions = searchOptions.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredOptions.forEach(option => {
        let li = document.createElement('li');
        li.textContent = option;
        li.onclick = () => selectOption(li, geselecteerdeOpties, meervoudigeSelectie, ul, searchOptions);
        ul.appendChild(li);

        if (geselecteerdeOpties.includes(option)) {
            li.classList.add('selected');
        }
    });
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

// Ophalen uit DB
let vwoWegingen = { '4 vwo': 0, '5 vwo': 10, '6 vwo': 90 };
let havoWegingen = { '4 havo': 50, '5 havo': 50 };
let oefenOpties = ['Optie 1', 'Optie 2', 'Optie 3'];
let vakkenOpties = ['Aardrijkskunde', 'Informatica', 'Wiskunde A'];
let niveauOpties = ['4 HAVO', '5 HAVO', '4 VWO', '5 VWO', '6 VWO'];
let jaarOpties = ['2024/2025', '2023/2024', '2022/2023', '2021/2022'];
let bewerkJaar = '2025' // De te bewerken jaar
let opSlot = false; // Als Admin op slot gooit

function fetchFromDatabase() {
    fetch('/api/defaults/subjects')
        .then(response => response.json())
        .then(data => {
            vakkenOpties = data.map(subject => subject.name);
        })
        .catch(error => console.error(error));
}

let ptaData = {
    "id": "d15690",
    "name": "Duits",
    "level": "6 VWO",
    "cohort": "2021 - 2024",
    "responsible": "LNM",
    "tools": [
        "pen (blauw of zwart), potlood, geodriehoek/lineaal",
        "woordenboek Duits-Nederlands",
        "woordenboek Nederlands-Duits",
        "steekwoordenlijst"
    ],
    "tests": [
        {
            "id": 601,
            "year_and_period": "6.1",
            "week": "SE 1",
            "subdomain": "E",
            "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque felis velit, tristique at odio luctus, dignissim facilisis nisi. Sed fermentum blandit varius. Suspendisse scelerisque ex eget dui sollicitudin consequat.",
            "type": "schriftelijk",
            'type_else': null,
            "result_type": "cijfer",
            "time": 100,
            "time_else": null,
            "resitable": true,
            "weight_pod": 0,
            "weight_pta": 2,
            "tools": [
                0,
                1,
                2
            ]
        },
        {
            "id": 602,
            "year_and_period": "6.2",
            "week": "SE 2",
            "subdomain": "C",
            "description": "Spreek- en gespreksvaardigheid dialoog over 10 stellingen",
            "type": "mondeling",
            'type_else': null,
            "result_type": "cijfer",
            "time": 'anders',
            "time_else": '???',
            "resitable": true,
            "weight_pod": 0,
            "weight_pta": 2,
            "tools": [
                0
            ]
        },
        {
            "id": 603,
            "year_and_period": "6.3",
            "week": "4",
            "subdomain": "D",
            "description": "Literatuur/film vergelijking",
            "type": "anders",
            'type_else': 'Literatuur/ film vergelijking',
            "result_type": "o/v/g",
            "time": 0,
            "time_else": 'Project',
            "resitable": true,
            "weight_pod": 0,
            "weight_pta": 0,
            "tools": [

            ]
        },
        {
            "id": 604,
            "year_and_period": "6.3",
            "week": "4",
            "subdomain": "B",
            "description": "Cito kijk-en luistertoets 23 januari",
            "type": "digitaal",
            'type_else': null,
            "result_type": "cijfer",
            "time": 50,
            "time_else": null,
            "resitable": true,
            "weight_pod": 0,
            "weight_pta": 2,
            "tools": [
                0
            ]
        },
        {
            "id": 605,
            "year_and_period": "6.3",
            "week": "SE 3",
            "subdomain": "CD",
            "description": "Examenidiom en kennis van land en volk",
            "type": "schriftelijk",
            'type_else': null,
            "result_type": "cijfer",
            "time": 100,
            "time_else": null,
            "resitable": true,
            "weight_pod": 0,
            "weight_pta": 2,
            "tools": [
                0
            ]
        }
    ]
}


function getPercentages() {
    if (selectedNiveau.toLowerCase().includes('vwo')) {
        input4vwo.value = vwoWegingen['4 vwo'];
        input5vwo.value = vwoWegingen['5 vwo'];
        input6vwo.value = vwoWegingen['6 vwo'];
    } else if (selectedNiveau.toLowerCase().includes('havo')) {
        input4havo.value = havoWegingen['4 havo'];
        input5havo.value = havoWegingen['5 havo'];
    }
    berekenPercentage();
}

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
    if (prevNiveau.toLowerCase().includes('vwo')) {
        vwoWegingen = {
            '4 vwo': input4vwo.value,
            '5 vwo': input5vwo.value,
            '6 vwo': input6vwo.value
        };
        console.log('vwo-wegingen:', vwoWegingen);
    } else if (prevNiveau.toLowerCase().includes('havo')) {
        havoWegingen = {
            '4 havo': input4havo.value,
            '5 havo': input5havo.value
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
    leesPtaData();
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

    // Initialiseer vaste tabs
    initialiseerVasteTabs();

    // Maak dynamische tabs voor elke toets in ptaData
    ptaData.tests.forEach(test => {
        maakTab(test.id.toString(), test.id.toString(), tabsContainer, contentContainer);
    });

    // Activeer standaard de 'Wegingen' tab
    toonTabInhoud('wegingenContent');
}

function genereerOverzichtInhoud() {
    let contentPane = document.getElementById("overzichtContent");
    contentPane.textContent = "Inhoud voor Overzicht";
    // Voeg specifieke logica toe voor het genereren van inhoud voor 'Overzicht'
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
        pod: toets.weight_pod,
        pta: toets.weight_pta,
        hulpmiddelen: toets.tools.map(toolIndex => ptaData.tools[toolIndex]).join(", ")
    };
}


function laadToetsInhoud(toetsNummer) {
    try {
        const tabContent = document.getElementById('toets' + toetsNummer);
        if (tabContent && !tabContent.dataset.isLoaded) {
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

function setEditRights() {
    const invulVelden = document.querySelectorAll('.tabContent input, .tabContent select, .tabContent textarea');
    if (!isBewerker || !selectedJaar.includes(bewerkJaar) || opSlot) {
        invulVelden.forEach(veld => {
            veld.disabled = true;
        });
        const buttons = document.querySelectorAll('.tabContent button');
        buttons.forEach(button => {
            button.disabled = true;
        });
        const iconen = document.querySelectorAll('.icon');
        iconen.forEach(icoon => {
            icoon.style.display = 'none';
        });
        return;
    }
    invulVelden.forEach(veld => {
        veld.disabled = false;
    });
    const buttons = document.querySelectorAll('.tabContent button');
    buttons.forEach(button => {
        button.disabled = false;
    });
    const iconen = document.querySelectorAll('.icon');
    iconen.forEach(icoon => {
        icoon.style.display = 'inline-block';
    });
    input4vwo.disabled = selectedNiveau === '5 vwo' || selectedNiveau === '6 vwo';
    input5vwo.disabled = selectedNiveau === '6 vwo';
    input6vwo.disabled = true;

    input4havo.disabled = selectedNiveau === '5 havo';
    input5havo.disabled = true;

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

    updateWeekSelectie(clone, toetsData.week);

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
    } else {
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
        if (window.confirm(`Weet u zeker dat u tab ${tabNummer} wilt verwijderen?`)) {
            verwijderTab(tabId, tabsContainer, contentContainer);
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
        toonTabInhoud('toets' + tabId);
        laadToetsInhoud(tabId);
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

    let naburigeTab = tabOmTeVerwijderen.nextElementSibling || tabOmTeVerwijderen.previousElementSibling;

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

    if (naburigeTab && naburigeTab.classList.contains('tab')) {
        naburigeTab.click();
    }
}

let totaalTabsToegevoegd = ptaData.tests.length; // Houd het totaal aantal toegevoegde tabs bij

function voegNieuweTabToe() {
    let tabsContainer = document.querySelector('.tabs');
    if (!tabsContainer) {
        console.error("Tabs container niet gevonden");
        return;
    }

    totaalTabsToegevoegd++; // Verhoog het totaal aantal toegevoegde tabs
    let nieuweTabId = 600 + totaalTabsToegevoegd;

    // Bepaal het nummer voor de zichtbare tekst
    let bestaandeTabsAantal = tabsContainer.querySelectorAll('.tab:not(.tab-toevoegen-knop)').length - 2;
    let nieuweTabNummer = 601 + bestaandeTabsAantal;

    maakTab(nieuweTabId.toString(), nieuweTabNummer, tabsContainer, document.querySelector('.tabContent'));
}

document.getElementById('voegTabToe').onclick = voegNieuweTabToe;


function updateWeekSelectie(clone, weekWaarde) {
    const weekSelect = clone.querySelector('.weekSelect');
    const weekInputField = clone.querySelector('.pickWeek .week');
    const jaarPeriodeSpan = clone.querySelector('.jaarPeriode');

    if (!weekSelect || !weekInputField || !jaarPeriodeSpan) {
        console.error("Weekselect, week inputfield of jaarPeriode span niet gevonden in de clone");
        return;
    }

    // Toon of verberg pickWeek en werk jaarPeriode bij
    toggleWeekInputEnBijwerkenJaarPeriode(weekSelect, weekInputField, jaarPeriodeSpan, weekWaarde);
}

function toggleWeekInputEnBijwerkenJaarPeriode(weekSelect, weekInputField, jaarPeriodeSpan, weekWaarde) {
    if (weekWaarde.startsWith('SE')) {
        weekInputField.parentElement.style.display = 'none';
        jaarPeriodeSpan.textContent = '6.' + weekWaarde.split(' ')[1];
        setSelectValue(weekSelect, weekWaarde);
    } else {
        weekInputField.parentElement.style.display = 'block';
        weekInputField.value = weekWaarde; // Reset de week input
        setSelectValue(weekSelect, 'week');
        jaarPeriodeSpan.textContent = berekenJaarPeriode(weekWaarde);
    }

    weekInputField.oninput = () => {
        let weekNummer = parseInt(weekInputField.value);
        weekNummer = isNaN(weekNummer) ? 0 : Math.min(weekNummer, 52);
        weekInputField.value = weekNummer;
        jaarPeriodeSpan.textContent = berekenJaarPeriode(weekNummer);
    };
}

function berekenJaarPeriode(weekNummer) {
    weekNummer = Math.max(1, Math.min(weekNummer, 52));
    const periode = Math.ceil(weekNummer / (52 / 4));
    return '6.' + periode;
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
    let voorbewerkteTools = [];
    tools.forEach(tool => {
        if (tool.includes(',')) {
            // Split de items op basis van komma en voeg ze apart toe
            voorbewerkteTools.push(...tool.split(',').map(t => t.trim()));
        } else {
            voorbewerkteTools.push(tool);
        }
    });
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
