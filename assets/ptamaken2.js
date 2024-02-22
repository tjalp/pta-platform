// Globale variabelen
let selectedBewerkerOfBekijker = "";
let selectedVak = "";
let selectedJaar = "";
let selectedNiveau = "";
let isDynamicButtonClicked = false;

document.addEventListener('DOMContentLoaded', function () {
    start();
});

function start() {
    isDynamicButtonClicked = false;
    removeExistingModal();
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
    removeExistingModal();
    const modal = createModal('Inloggen', [
        { type: 'input', placeholder: 'Afkorting' },
        { type: 'input', placeholder: 'Wachtwoord', inputType: 'password' },
        { text: 'Terug', action: start },
        { text: 'Bevestigen', action: bevestigBewerken }
    ]);
    document.body.appendChild(modal);
}

function bevestigBewerken() {
    selectedBewerkerOfBekijker = "Bewerken";
    vakkeuze();
}

function vakkeuze() {
    removeExistingModal();
    const modal = createModal('Voor welk vak wilt u PTAs bekijken?', [
        { type: 'select', options: ['Informatica', 'Aardrijkskunde'], id: 'subjectSelect' },
        { text: 'Bevestigen', action: bevestigVakkeuze },
        { text: 'Terug', action: start }
    ]);
    document.body.appendChild(modal);
}

function bevestigVakkeuze() {
    selectedVak = document.getElementById('subjectSelect').value;
    if (!isDynamicButtonClicked) {
        niveaukeuze();
        return;
    }
    updateDynamicButtonValue('Vak', selectedVak);
}

function niveaukeuze() {
    removeExistingModal();
    const modal = createModal('Voor welk niveau wilt u PTAs bekijken?', [
        { type: 'select', options: ['4 havo', '5 havo', '4 vwo', '5 vwo', '6 vwo'], id: 'niveauSelect' },
        { text: 'Bevestigen', action: bevestigNiveaukeuze },
        { text: 'Terug', action: vakkeuze }
    ]);
    document.body.appendChild(modal);
}

function bevestigNiveaukeuze() {
    setPercentages();
    selectedNiveau = document.getElementById('niveauSelect').value;
    laadPercentages();

    if (!isDynamicButtonClicked) {
        jaarkeuze();
        return;
    }

    updateDynamicButtonValue('Niveau', selectedNiveau);
}



function jaarkeuze() {
    removeExistingModal();
    const modal = createModal('Voor welk jaar wilt u PTAs bekijken?', [
        { type: 'select', options: ['2021/2022', '2022/2023'], id: 'yearSelect' },
        { text: 'Bevestigen', action: bevestigJaarkeuze },
        { text: 'Terug', action: niveaukeuze }
    ]);
    document.body.appendChild(modal);
}

function bevestigJaarkeuze() {
    selectedJaar = document.getElementById('yearSelect').value;
    if (!isDynamicButtonClicked) {
        createDynamicButtons();
        return;
    }
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
    removeExistingModal();
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
        button.textContent = `${buttonType}: ${value}`;
    }
    removeExistingModal();
}


function removeExistingModal() {
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }
}

function handleDynamicButtonClick(buttonType) {
    // Zet de variabele op true zodra er op een knop wordt geklikt
    isDynamicButtonClicked = true;
    // Afhandelen van de knopklik gebaseerd op het type
    switch (buttonType) {
        case 'Rol':
            createModal1();
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

function laadPercentages() {
    vwoVelden.style.display = selectedNiveau.includes('vwo') ? 'block' : 'none';
    havoVelden.style.display = selectedNiveau.includes('havo') ? 'block' : 'none';

    input4vwo.disabled = selectedNiveau === '5 vwo' || selectedNiveau === '6 vwo';
    input5vwo.disabled = selectedNiveau === '6 vwo';
    input6vwo.disabled = true;

    input4havo.disabled = selectedNiveau === '5 havo';
    input5havo.disabled = true;
    getPercentages();
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
let vwoWegingen = { '4 vwo': 30, '5 vwo': 40, '6 vwo': 30 }; // Ophalen uit DB
let havoWegingen = { '4 havo': 50, '5 havo': 50 }; // Ophalen uit DB

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
  if (!isDynamicButtonClicked) {
    console.log('Gebruiker voor het eerst in het menu');
    return;
  }
  if (selectedNiveau === document.getElementById('niveauSelect').value) {
    console.log('Geen nieuw niveau geselecteerd');
    return;
  }

  console.log('Opslaan naar de database:');
  if (selectedNiveau.includes('vwo')) {
    vwoWegingen = {
      '4 vwo': input4vwo.value,
      '5 vwo': input5vwo.value,
      '6 vwo': input6vwo.value
    };
    console.log('vwo-wegingen:', vwoWegingen);
  } else if (selectedNiveau.includes('havo')) {
    havoWegingen = {
      '4 havo': input4havo.value,
      '5 havo': input5havo.value
    };
    console.log('havo-wegingen:', havoWegingen);
  }
}
