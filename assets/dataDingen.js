// De hoofdstructuur

let dataStruct = {
    percentage: null,
    hulpmiddelen: [],
    toetsen: [],
    uitlegAnders: [] // Nieuwe array voor de 'Uitleg bij Anders' data
};

function allesOpslaan() {
    // Verzamel Percentage
    dataStruct.percentage = document.getElementById('percentage').value;

    // Verzamel Hulpmiddelen
    let hulpmiddelenContainer = document.getElementById('toolsFieldsContainer');
    dataStruct.hulpmiddelen = Array.from(hulpmiddelenContainer.querySelectorAll('input'))
                                    .map(input => input.value);

    // Verzamel Toetsen Data
    dataStruct.toetsen = Array.from(document.querySelectorAll('form[id^="toetsen"], form[class^="clonedForm"]'))
                              .map(form => {
                                  let toetsData = {};
                                  new FormData(form).forEach((value, key) => {
                                      toetsData[key] = value;
                                  });
                                  return toetsData;
                              });

    // Verzamel Uitleg bij Anders Data
    let uitlegContainer = document.getElementById('explanationFieldsContainer');
    dataStruct.uitlegAnders = Array.from(uitlegContainer.querySelectorAll('input'))
                                   .map(input => input.value);

    console.log(dataStruct); // Voor testdoeleinden

    fetch('/totaalPta' ,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataStruct)
    })
    .then(response => response.json())
    .then(data => alert('Data succesvol verstuurd!'))
    .catch((error) => {
        console.error('Fout bij het versturen van de aanvraag:', error);
    });

    dataStruct = {
        percentage: null,
        hulpmiddelen: [],
        toetsen: [],
        uitlegAnders: [] // Nieuwe array voor de 'Uitleg bij Anders' data
    };
}

// Roep verzamelData aan op een geschikt moment, bijvoorbeeld bij het indienen van een formulier

function dataOphalenVoorPDF(){
    console.log('ophalen')
    fetch('/api/data')
    .then(response => response.json())
    .then(data => {
        console.log('Data ontvangen:', data); // Log het object direct
        // Verwerk en toon de data in je frontend
    })
    .catch(error => console.error('Fout bij het ophalen van data:', error));

    PDFMaken(data)
}

function PDFMaken(PDFdata){
    
}
