
function allesOpslaan() {
    if (!checkInput()) {
        return false;
    }


    return true;
}

function checkInput() {
    const weging4vwo = parseInt(input4vwo.value) || 0;
    const weging5vwo = parseInt(input5vwo.value) || 0;
    const weging6vwo = parseInt(input6vwo.value) || 0;

    const totaleWeging = weging4vwo + weging5vwo + weging6vwo;

    if (totaleWeging !== 100) {
        showError("De som van de wegingen moet precies 100% zijn. Huidige totaal: " + totaleWeging + "%");
        return false; // Stop de functie en voorkom verdere acties
    }
    
    return true; // Alles is goed, de functie kan doorgaan
}

// Om de modal te tonen
var modal = document.getElementById("testModal");
var btn = document.getElementById("addTestButton");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
    modal.style.display = "block";
}

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Functie om de modal te sluiten
function closeModal() {
    var modal = document.getElementById('testModal');
    modal.style.display = 'none';
    resetModal();
}

// Functie om de modal te resetten
function resetModal() {
    // Reset naar pagina 1
    goToPage(1);

    // Reset alle velden
    document.getElementById('modal_date').value = '';
    document.getElementById('weeknummer').textContent = '';
    // Voeg hier meer velden toe die gereset moeten worden
}

// Update de opslaan-knop om de modal te sluiten
document.getElementById('saveButton').onclick = function() {
    cloneForm('toetsTemplate');
    closeModal();
};


function goToPage(pageNumber) {
    var pages = document.getElementsByClassName('modal-page');
    for (var i = 0; i < pages.length; i++) {
        pages[i].style.display = 'none'; // Verberg alle pagina's
    }
    document.getElementById('modalPage' + pageNumber).style.display = 'block'; // Toon de gewenste pagina
}

function calculateWeekNumber() {
    var dateInput = document.getElementById('modal_date').value;
    var weekNumSpan = document.getElementById('weeknummer');
    var errorSpan = document.getElementById('errorWeek');

    if (!dateInput) {
        weekNumSpan.textContent = '';
        errorSpan.textContent = '';
        return;
    }

    var date = new Date(dateInput);
    if (isNaN(date)) {
        errorSpan.textContent = 'Ongeldige datum.';
        weekNumSpan.textContent = '';
        return;
    } else {
        errorSpan.textContent = '';
    }

    var weekNumber = getWeekNumber(date);
    weekNumSpan.textContent = weekNumber;
}

// Functie om het weeknummer te berekenen
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return weekNo;
}

function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto'; // Reset de hoogte
    textarea.style.height = textarea.scrollHeight + 'px'; // Stel de nieuwe hoogte in
}

function toggleExplanation(selectElement) {
    var explanationDiv = selectElement.parentElement.querySelector('.explanationDiv');

    if (selectElement.value === 'anders') {
        explanationDiv.classList.add('visible');
    } else {
        explanationDiv.classList.remove('visible');
    }
}

let tools = [];

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.toolsSelect').forEach(select => {
        select.addEventListener('click', function() {
            updateToolsSelect(select);
        });
    });
});

function updateToolsSelect(select) {
    // Verwijder bestaande hulpmiddelen
    Array.from(select.options).forEach(option => {
        if (option.value !== 'add-new') {
            option.remove();
        }
    });

    // Voeg hulpmiddelen uit de array toe als opties
    tools.forEach(tool => {
        const option = new Option(tool, tool);
        select.add(option, 0);
    });
}

function addNewTool() {
    const toolName = document.getElementById('newToolName').value.trim();
    if (toolName) {
        tools.push(toolName);

        // Werk alle select elementen bij
        document.querySelectorAll('.toolsSelect').forEach(select => {
            const option = new Option(toolName, toolName);
            select.add(option, select.options.length - 1);
        });

        // Voeg het nieuwe hulpmiddel toe aan de juiste <ul>
        if (currentSelect) {
            const ul = currentSelect.parentNode.querySelector('.selectedTools');
            const li = document.createElement('li');
            li.textContent = toolName;
            ul.appendChild(li);
        }

        document.getElementById('newToolName').value = '';
        closeModalTools();
    }
}

function closeModalTools() {
    document.getElementById('addToolModal').style.display = 'none';
    document.querySelector('.modal-overlay').style.display = 'none';
    currentSelect = null; // Reset currentSelect
}

document.addEventListener('change', function(event) {
    if (event.target.classList.contains('toolsSelect')) {
        const selectedTool = event.target.value;

        // Open de modal als 'Voeg hulpmiddel toe' wordt geselecteerd
        if (selectedTool === 'add-new') {
            currentSelect = event.target; // Sla de huidige select op
            document.getElementById('addToolModal').style.display = 'block';
            document.querySelector('.modal-overlay').style.display = 'block';
            event.target.value = ''; // Reset de select naar de standaard optie
        } else if (selectedTool) {
            // Voeg het geselecteerde hulpmiddel toe aan de lijst als het nog niet aanwezig is
            const ul = event.target.parentNode.querySelector('.selectedTools');
            if (!toolAlreadyInList(ul, selectedTool)) {
                const li = document.createElement('li');
                li.textContent = selectedTool;
                ul.appendChild(li);
            }
            event.target.value = ''; // Reset de select na het toevoegen
        }
    }
});

function toolAlreadyInList(ul, toolName) {
    return Array.from(ul.children).some(li => li.textContent === toolName);
}



function updateToolsSelects() {
    let selects = document.querySelectorAll('.toolsSelect');
    selects.forEach(select => {
        // Onthoud de huidige geselecteerde waarde
        let currentTool = select.value;

        // Maak de select leeg
        select.innerHTML = '';

        // Voeg de 'Selecteer een optie' optie toe
        let defaultOption = document.createElement('option');
        defaultOption.textContent = 'Selecteer een optie';
        defaultOption.setAttribute('hidden', '');
        defaultOption.setAttribute('disabled', '');
        defaultOption.setAttribute('selected', '');
        defaultOption.value = '';
        select.appendChild(defaultOption);

        // Voeg de hulpmiddelen uit de tools array toe als opties
        tools.forEach(tool => {
            let option = document.createElement('option');
            option.value = tool;
            option.textContent = tool;
            select.appendChild(option);
        });

        // Voeg de 'Voeg hulpmiddel toe' optie toe
        let addOption = document.createElement('option');
        addOption.value = 'add-new';
        addOption.textContent = 'Voeg hulpmiddel toe';
        select.appendChild(addOption);

        // Herstel de eerder geselecteerde waarde, indien mogelijk
        select.value = currentTool;
    });
}
