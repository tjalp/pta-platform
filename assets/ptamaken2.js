// Globale variabelen
let isBewerker = false;
let selectedBewerkerOfBekijker = "";
let prevVak = "";
let selectedVak = "";
let selectedJaar = "";
let prevNiveau = "";
let selectedNiveau = "";
let isDynamicButtonClicked = false;

document.addEventListener('DOMContentLoaded', function () {
    start();
});

function start() {
    isDynamicButtonClicked = false;
    removeExistingModals();
    const modal = createModal('Wilt u PTAs bekijken of bewerken?', [
        { text: 'Bekijken', action: bekijken },
        { text: 'Bewerken', action: bewerken }
    ]);
    document.body.appendChild(modal);
}

function bekijken() {
    selectedBewerkerOfBekijker = "Bekijken";
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

function vakkeuze() {
    removeExistingModals();
    createSearchModal(
        'Voor welk vak wilt u PTAs bekijken?',
        vakkenOpties,
        bevestigVakkeuze,
        start,
        document.querySelector('button[name="Vak"]')
    )
}

function bevestigVakkeuze() {
    prevVak = selectedVak;
    selectedVak = huidigeSelectie;
    if (!isDynamicButtonClicked) {
        niveaukeuze();
        return;
    }

    setPercentages();
    laadPercentages();

    updateDynamicButtonValue('Vak', selectedVak);
}

function niveaukeuze() {
    removeExistingModals();
    createSearchModal(
        'Voor welk niveau wilt u PTAs bekijken?',
        niveauOpties,
        bevestigNiveaukeuze,
        vakkeuze,
        document.querySelector('button[name="Niveau"]')
    )
}

function bevestigNiveaukeuze() {
    prevNiveau = selectedNiveau;
    selectedNiveau = huidigeSelectie;

    if (!isDynamicButtonClicked) {
        jaarkeuze();
        return;
    }

    setPercentages();
    laadPercentages();

    updateDynamicButtonValue('Niveau', selectedNiveau);
}

function jaarkeuze() {
    removeExistingModals();
    createSearchModal(
        'Voor welk jaar wilt u PTAs bekijken?',
        jaarOpties,
        bevestigJaarkeuze,
        niveaukeuze,
        document.querySelector('button[name="Jaar"]')
    )
}

function bevestigJaarkeuze() {
    selectedJaar = huidigeSelectie;
    if (!isDynamicButtonClicked) {
        createDynamicButtons();
        laadAlles();
        return;
    }
    laadAlles();    
    updateDynamicButtonValue('Jaar', selectedJaar);
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
        } else {
            contentHtml += `<button onclick="${el.action.name}()">${el.text}</button>`;
        }
    });

    contentHtml += `</div></div>`;
    modal.innerHTML = contentHtml;
    return modal;
}

function createDynamicButtons() {
    removeExistingModals();
    const buttonContainer = document.getElementById('dynamicButtons');
    buttonContainer.innerHTML = `
        <button name="Rol" onclick="start()">${selectedBewerkerOfBekijker}</button>
        <button name="Vak" onclick="vakkeuze()">${selectedVak}</button>
        <button name="Niveau" onclick="niveaukeuze()">${selectedNiveau}</button>
        <button name="Jaar" onclick="jaarkeuze()">${selectedJaar}</button>
    `;
    buttonContainer.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => handleDynamicButtonClick(button.name));
    });

}

function updateDynamicButtonValue(buttonType, value) {
    isDynamicButtonClicked = false;

    // Gebruik de 'name' attribuut om de juiste knop te vinden
    const button = document.querySelector(`#dynamicButtons button[name="${buttonType}"]`);
    if (button) {
        button.textContent = `${value}`;
    }
    removeExistingModals();
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
}

function laadPercentages() {
    vwoVelden.style.display = selectedNiveau.includes('vwo') ? 'block' : 'none';
    havoVelden.style.display = selectedNiveau.includes('havo') ? 'block' : 'none';

    getPercentages();

    if (!isBewerker || !selectedJaar.includes(bewerkJaar) || opSlot) {
        [input4vwo, input5vwo, input6vwo, input4havo, input5havo].forEach(input => {
            input.disabled = true;
        });
        return;
    }

    input4vwo.disabled = selectedNiveau === '5 vwo' || selectedNiveau === '6 vwo';
    input5vwo.disabled = selectedNiveau === '6 vwo';
    input6vwo.disabled = true;

    input4havo.disabled = selectedNiveau === '5 havo';
    input5havo.disabled = true;
}


function toonFout(bericht) {
    foutDiv.textContent = bericht;
}

function wisFout() {
    foutDiv.textContent = '';
}

function berekenPercentage() {
    if (selectedNiveau.includes('vwo')) {
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
    else if (selectedNiveau.includes('havo')) {
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
GET & SET FUNCTIES VOOR DATABASE
*/

// Ophalen uit DB
let vwoWegingen = { '4 vwo': 30, '5 vwo': 40, '6 vwo': 30 };
let havoWegingen = { '4 havo': 50, '5 havo': 50 }; 
let oefenOpties = ['Optie 1', 'Optie 2', 'Optie 3'];
let vakkenOpties = ['Aardrijkskunde', 'Informatica', 'Wiskunde A'];
let niveauOpties = ['4 havo', '5 havo', '4 vwo', '5 vwo', '6 vwo'];
let jaarOpties = ['2021/2022', '2022/2023', '2023/2024', '2024/2025'];
let bewerkJaar = '2025' // De te bewerken jaar
let opSlot = false; // Als Admin op slot gooit

function getPercentages() {
    if (selectedNiveau.includes('vwo')) {
        input4vwo.value = vwoWegingen['4 vwo'];
        input5vwo.value = vwoWegingen['5 vwo'];
        input6vwo.value = vwoWegingen['6 vwo'];
    } else if (selectedNiveau.includes('havo')) {
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
    if (prevNiveau.includes('vwo')) {
        vwoWegingen = {
            '4 vwo': input4vwo.value,
            '5 vwo': input5vwo.value,
            '6 vwo': input6vwo.value
        };
        console.log('vwo-wegingen:', vwoWegingen);
    } else if (prevNiveau.includes('havo')) {
        havoWegingen = {
            '4 havo': input4havo.value,
            '5 havo': input5havo.value
        };
        console.log('havo-wegingen:', havoWegingen);
    }
}

/*
NIEUW MODAL SYSTEEM
*/

let huidigeSelectie = null;
function createSearchModal(title, searchOptions, bevestigActie, terugActie = null, optie = null) {
    if (optie) {
        huidigeSelectie = optie.textContent;
    }
    else {
        huidigeSelectie = searchOptions[0];
    }
    // Modal container
    let modal = document.createElement('div');
    modal.className = 'searchModal';

    // Modal content
    let modalContent = document.createElement('div');
    modalContent.className = 'searchModal-content';

    // Titel
    let modalTitle = document.createElement('h2');
    modalTitle.textContent = title;
    modalContent.appendChild(modalTitle);

    // Zoekbalk
    let searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Zoeken...';
    searchInput.onkeyup = () => filterOptions(searchInput.value);
    modalContent.appendChild(searchInput);

    // Lijst met opties
    let ul = document.createElement('ul');
    searchOptions.forEach((option, index) => {
        let li = document.createElement('li');
        li.textContent = option;
        li.onclick = () => selectOption(li);
        ul.appendChild(li);

        // Standaard de eerste optie selecteren
        if (option === huidigeSelectie) {
            li.classList.add('selected');
        }
    });
    modalContent.appendChild(ul);

    // Container voor de knoppen
    let buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'row-reverse';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.paddingTop = '10px';

    // Bevestig knop
    let bevestigButton = document.createElement('button');
    bevestigButton.textContent = 'Bevestigen';
    bevestigButton.onclick = bevestigActie;
    buttonContainer.appendChild(bevestigButton);

    // Terug knop (indien nodig)
    if (terugActie) {
        let terugButton = document.createElement('button');
        terugButton.textContent = 'Terug';
        terugButton.onclick = terugActie;
        buttonContainer.appendChild(terugButton);
    }

    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);

    // Functie voor het filteren van opties
    function filterOptions(searchTerm) {
        ul.innerHTML = '';
        searchOptions.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()))
            .forEach(option => {
                let li = document.createElement('li');
                li.textContent = option;
                li.onclick = () => selectOption(li);
                ul.appendChild(li);

                // Markeer de huidige selectie als geselecteerd
                if (huidigeSelectie === option) {
                    li.classList.add('selected');
                }
            });
    }

    function selectOption(li) {
        huidigeSelectie = li.textContent;
        // Verwijder 'selected' klasse van alle 'li' elementen
        document.querySelectorAll('.searchModal-content ul li').forEach(el => {
            el.classList.remove('selected');
        });

        // Voeg 'selected' klasse toe aan het geklikte 'li' element
        li.classList.add('selected');

        console.log("Geselecteerde optie:", li.textContent);
        // Verdere acties voor de geselecteerde optie
    }

    document.body.appendChild(modal);
    searchInput.focus();
    searchInput.select();
}