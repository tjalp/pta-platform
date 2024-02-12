// Globale variabelen
let selectedBewerkerOfBekijker = "";
let selectedVak = "";
let selectedJaar = "";
let selectedNiveau = "";
let isDynamicButtonClicked = false;

document.addEventListener('DOMContentLoaded', function() {
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
    if (isDynamicButtonClicked) {
        updateDynamicButtonValue('Vak', selectedVak);
        return;
    }
    niveaukeuze();
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
    selectedNiveau = document.getElementById('niveauSelect').value;
    console.log(isDynamicButtonClicked)
    if (isDynamicButtonClicked) {
        updateDynamicButtonValue('Niveau', selectedNiveau);
        return;
    }
    jaarkeuze();
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
    if (isDynamicButtonClicked) {
        updateDynamicButtonValue('Jaar', selectedJaar);
        return;
    }
    createDynamicButtons();
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
        <button name="Rol" onclick="start()">Rol: ${selectedBewerkerOfBekijker}</button>
        <button name="Vak" onclick="vakkeuze()">Vak: ${selectedVak}</button>
        <button name="Niveau" onclick="niveaukeuze()">Niveau: ${selectedNiveau}</button>
        <button name="Jaar" onclick="jaarkeuze()">Jaar: ${selectedJaar}</button>
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