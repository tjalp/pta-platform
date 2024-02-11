
const input4vwo = document.getElementById('percentage4vwo');
const input5vwo = document.getElementById('percentage5vwo');
const input6vwo = document.getElementById('percentage6vwo');
const errorDiv = document.getElementById('errorPercentages');


function showError(message) {
    errorDiv.textContent = message;
}

function clearError() {
    errorDiv.textContent = '';
}

function calculate6VWOPercentage() {
    const weging4vwo = parseInt(input4vwo.value) || 0;
    const weging5vwo = parseInt(input5vwo.value) || 0;
    if (weging4vwo + weging5vwo > 100) {
        showError("De totale weging mag niet meer dan 100% zijn.");
        return;
    } else {
        clearError();
    }

    const weging6vwo = 100 - weging4vwo - weging5vwo;
    input6vwo.value = weging6vwo >= 0 ? weging6vwo : '';
}

function validatePercentageInput(event) {
    const value = parseInt(event.target.value);
    if (value > 100) {
        event.target.value = 100;
    }
}

input4vwo.addEventListener('input', function(event) {
    validatePercentageInput(event);
    calculate6VWOPercentage();
});

input5vwo.addEventListener('input', function(event) {
    validatePercentageInput(event);
    calculate6VWOPercentage();
});

[input4vwo, input5vwo, input6vwo].forEach(input => {
    input.addEventListener('focus', function(event) {
        event.target.value = '';
    });
});

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
    var textarea = explanationDiv.querySelector('.autoExpandTextarea');

    if (selectElement.value === 'anders') {
        explanationDiv.style.visibility = 'visible';
        explanationDiv.style.maxHeight = 'none'; // Verwijder de beperking van de max-height
        adjustTextareaHeight(textarea); // Pas de hoogte van de textarea aan
    } else {
        explanationDiv.style.visibility = 'hidden';
        explanationDiv.style.maxHeight = '0'; // Stel max-height in op 0
    }
}
