function voegExtraVeldToe(containerId) {
    var container = document.getElementById(containerId);
    var newFieldNumber = container.children.length + 1;

    // Create a div to contain the label and input
    var fieldContainer = document.createElement('div');

    var label = document.createElement('label');
    label.setAttribute('for', containerId + '_field' + newFieldNumber);
    label.textContent = 'Mogelijkheid ' + newFieldNumber + ':';

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

function dataVersturen(event){
    event.preventDefault(); // Voorkomt dat het formulier echt wordt ingediend
    
    // Vind alle input velden binnen het formulier
    var inputs = document.querySelectorAll('#AanpassingenVoorDropdown input[type="text"]');
    var data = {};
    inputs.forEach(function(input, index) {
        data[input.name] = input.value; // Voeg de naam en waarde van elk veld toe aan het data object
    });
    console.log(data); // Log de verzamelde data naar de console

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

function PaginaTerug(){
    window.location.href = 'options.html';
}

function voegExtraVakToe(containerId, aantalId) {
var container = document.getElementById(containerId);
var aantal = document.getElementById(aantalId).value
for(i = 0; i < aantal; i ++){
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

function vakkenPtaOpslaan(){
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
  containers.forEach(function(container) {
      var vakkenInputs = document.querySelectorAll('#' + container.id + ' input[type="text"]');
      vakkenInputs.forEach(function(input, index) {
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

function vakkenOphalen(){
    console.log("help ik wil opgehaald worden uit smallland")
    fetch(`/api/defaults/subjects`)
    .then(response => {
            if (!response.ok) {
                throw new Error('Netwerkrespons was niet ok');
            }
            return response.json();
    })
    .then(data =>{
        vakken = data;
        vakkenLaden()
    })
    .catch(error => {
            console.error('Fout bij het laden:', error);
        });
}

function vakkenLaden(){
    const formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
    const volledigeNaam = Array.from(vakken).sort((a, b) => a.name.localeCompare(b.name));
    console.log(vakken)
    for(i = 0; i < volledigeNaam.length; i ++){
        var str = vakken[i].level;
        var parts = str.split(/\s+/); // Splits de string op één of meer spaties
        var numberPart = parts[0];
        var textPart = parts[1];
        console.log(numberPart + textPart)  

        var label = document.createElement('label');
        label.textContent = volledigeNaam[i].name + " (" + volledigeNaam[i].level + ")" + ':';

        var icon = document.createElement('img')

        icon.setAttribute('src', '/prullenbak.png')
        icon.setAttribute('width', 25)
        icon.setAttribute('height', 25)
        icon.setAttribute('onclick', 'verwijderVak(' + volledigeNaam[i].name + + numberPart + textPart + ')')
        var inputDocent = document.createElement('input');
        inputDocent.setAttribute('type', 'text');
        inputDocent.setAttribute('niveau', textPart)
        inputDocent.setAttribute('jaarlaag', numberPart)
        inputDocent.setAttribute('maxlength', 3)
        inputDocent.setAttribute('vak', volledigeNaam[i].name)
        inputDocent.setAttribute('id', 'docent_' + i);
        inputDocent.setAttribute('name', 'docent_'+ i);
        inputDocent.setAttribute('value', volledigeNaam[i].responsible)

        var div = document.createElement('div');
        div.setAttribute('id', volledigeNaam[i].name + + numberPart + textPart)
        div.appendChild(label);
        div.appendChild(inputDocent);
        div.appendChild(icon)
        formDocentenPta.appendChild(div);
    }

}

function periodesOpslaan(event) {
    event.preventDefault(); // Prevent the default form submission

    // Gather data from the form
    var periodesData = {
        periode1: {
            start: document.getElementById("startPeriode1").value,
            eind: document.getElementById("eindPeriode1").value
        },
        periode2: {
            start: document.getElementById("startPeriode2").value,
            eind: document.getElementById("eindPeriode2").value
        },
        periode3: {
            start: document.getElementById("startPeriode3").value,
            eind: document.getElementById("eindPeriode3").value
        },
        periode4: {
            start: document.getElementById("startPeriode4").value,
            eind: document.getElementById("eindPeriode4").value
        }
    };

    // Send the data to your backend using fetch
    console.log(periodesData)

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

function hulpmiddelenOphalen(){
    fetch(`/api/defaults/tools`)
    .then(response => {
            if (!response.ok) {
                throw new Error('Netwerkrespons was niet ok');
            }
            return response.json();
    })
    .then(data =>{
        hulpmiddelen = data;
        hulpmiddelenLaden()
    })
    .catch(error => {
            console.error('Fout bij het laden:', error);
    });
}

function hulpmiddelenLaden(){
    const locatie  = document.getElementById('kloonbareVeld3')
    for(i = 0; i < hulpmiddelen.length; i ++){
        var label = document.createElement('label');
        label.setAttribute('for', '_field' + i);
        label.textContent = "Mogelijkheid " + (i+1) + ":";
        var input = document.createElement('input');           
        input.setAttribute('type', 'text'); 
        input.setAttribute('id', i); // Gecorrigeerd
        input.setAttribute('name', i); // Gecorrigeerd
        input.setAttribute('value', hulpmiddelen[i])
        var div = document.createElement('div');
        div.appendChild(label);
        div.appendChild(input);
        locatie.appendChild(div);
    }
}

function vakToevoegen(){
    event.preventDefault(); // Voorkom de standaardformulier verzending

    // Haal de vaknaam, niveau en jaarlaag op uit het formulier VakkenPtaSchool
    var vaknaam = document.getElementById('vaknaam').value;
    var niveau = document.getElementById('niveau').value;
    var jaarlaag = document.getElementById('jaarlaag').options[document.getElementById('jaarlaag').selectedIndex].text;
    if(niveau == "alle"){
      alert("geef bij alle altijd alle jaarlagen aan")
      return
    } 
    // Controleer of het vak al bestaat in het form VerantwoordelijkeDocentenPta
    var bestaandeVakken = document.querySelectorAll('#VerantwoordelijkeDocentenPta input[type="text"]');
    for (var i = 0; i < bestaandeVakken.length; i++) {
        console.log(bestaandeVakken[i])
        if (bestaandeVakken[i].getAttribute('vak') === vaknaam && bestaandeVakken[i].getAttribute('niveau') === niveau && bestaandeVakken[i].getAttribute('jaarlaag') === jaarlaag) {
            alert('Dit vak is al toegevoegd.');
            return; // Stop de functie als het vak al bestaat
        }
    }

    if(niveau == "Alle" && jaarlaag =="alle jaarlagen"){
        let niveaus = ["Mavo", "Havo", "Vwo"]
        for(let j = 0; j < niveaus.length; j ++){
            if(niveaus[j] == 'Vwo'){
            for(let i = 4; i < 7; i ++){
                var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
                var label = document.createElement('label');
                label.textContent = vaknaam + " ("  + i + ' '  + niveaus[j]+ "): ";
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
                inputDocent.setAttribute('vak', vaknaam);
                inputDocent.setAttribute('niveau', niveaus[j]);
                inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveaus[j] + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
                var div = document.createElement('div')
                div.appendChild(label);
                div.appendChild(icon);
                div.appendChild(inputDocent);
                if(bestaandeVakken.length > 0 ){
                    if (VakkenControleren(i, niveau[j], vaknaam, bestaandeVakken)) {
                        console.log('Dit vak is al toegevoegd.');
                    }else{
                        formDocentenPta.appendChild(div);
                    }
                }else{
                    formDocentenPta.appendChild(div);
                }
            }
    }else if(niveaus[j] == 'Havo'){
        for(let i = 4; i < 6; i ++){
            var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
            var label = document.createElement('label');
            label.textContent = vaknaam + " ("  + i + ' '  + niveaus[j]+ "): ";
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
            inputDocent.setAttribute('vak', vaknaam);
            inputDocent.setAttribute('niveau', niveaus[j]);
            inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveaus[j] + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
            var div = document.createElement('div')
            div.appendChild(label);
            div.appendChild(icon);
            div.appendChild(inputDocent);
            if(bestaandeVakken.length > 0 ){ 
                if (VakkenControleren(i, niveau[j], vaknaam, bestaandeVakken)) {
                    console.log('Dit vak is al toegevoegd.');
                }else{
                    formDocentenPta.appendChild(div);
                }
            }else{
                formDocentenPta.appendChild(div);
            }
        }
    }else if(niveaus[j] == 'Mavo'){
        for(let i = 3; i < 5; i ++){
            var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
            var label = document.createElement('label');
            label.textContent = vaknaam + " ("  + i + ' '  + niveaus[j]+ "): ";
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
            inputDocent.setAttribute('vak', vaknaam);
            inputDocent.setAttribute('niveau', niveaus[j]);
            inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveaus[j] + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
            var div = document.createElement('div')
            div.appendChild(label);
            div.appendChild(icon)
            div.appendChild(inputDocent);
            if(bestaandeVakken.length > 0 ){
                if (VakkenControleren(i, niveau[j], vaknaam, bestaandeVakken)) {
                    console.log('Dit vak is al toegevoegd.');
                }else{
                    formDocentenPta.appendChild(div);
                }
            }else{
                formDocentenPta.appendChild(div);
            }
        }
    }
    }
    return
    }
    if(niveau == "Mavo" && (jaarlaag == "5" || jaarlaag == "6")){
        alert("voer een geldig jaar in")
        return
    }
    if(niveau == "Havo" && (jaarlaag == "3" || jaarlaag == "6")){
        alert("voer een geldig jaar in")
        return
    }
    if(niveau == "Vwo" && jaarlaag == "3"){
        alert("voer een geldig jaar in")
        return
    }

    if(jaarlaag == "alle jaarlagen"){
      console.log("help")
        if(niveau == 'Vwo'){
            for(let i = 4; i < 7; i ++){
                console.log("help" + i + "3")
                var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
                var label = document.createElement('label');
                label.textContent = vaknaam + " ("  + i + ' '  + niveau+ "): ";
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
                inputDocent.setAttribute('id', vaknaam + '_' + niveau + '_' + jaarlaag);
                inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveau + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
                var div = document.createElement('div')
                div.setAttribute('id', vaknaam + '_' + niveau + '_' + i)
                div.appendChild(label);
                div.appendChild(inputDocent);
                div.appendChild(icon)
                if(bestaandeVakken.length > 0 ){
                    if (VakkenControleren(i, "Vwo", vaknaam, bestaandeVakken)) {
                        console.log('Dit vak is al toegevoegd.');
                    }else{
                        formDocentenPta.appendChild(div);
                    }
                }else{
                    formDocentenPta.appendChild(div);   
                }
            }
            return
        }else if(niveau == 'Havo'){
            for(let i = 4; i < 6; i ++){
                var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
                var label = document.createElement('label');
                label.textContent = vaknaam + " ("  + i + ' '  + niveau+ "): ";
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
                inputDocent.setAttribute('id', vaknaam + '_' + niveau + '_' + jaarlaag);
                inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveau + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
                var div = document.createElement('div')
                div.setAttribute('id', vaknaam + '_' + niveau + '_' + i)
                div.appendChild(label);
                div.appendChild(inputDocent);
                div.appendChild(icon)
                if(bestaandeVakken.length > 0 ){
                    if (VakkenControleren(i, "Havo", vaknaam, bestaandeVakken)) {
                        console.log('Dit vak is al toegevoegd.');
                    }else{
                        formDocentenPta.appendChild(div);
                    }
                }else{
                    formDocentenPta.appendChild(div);
                }
            }
            return
        }else if(niveau == 'Mavo'){
            for(let i = 3; i < 5; i ++){
                var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
                var label = document.createElement('label');
                label.textContent = vaknaam + " ("  + i + ' '  + niveau+ "): ";
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
                inputDocent.setAttribute('maxlength', 3)
                inputDocent.setAttribute('niveau', i);
                inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveau + '_' + i); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
                var div = document.createElement('div')
                div.setAttribute('id', vaknaam + '_' + niveau + '_' + i)
                div.appendChild(label);
                div.appendChild(inputDocent);
                div.appendChild(icon)
                if(bestaandeVakken.length > 0 ){
                    if (VakkenControleren(i, 'Mavo', vaknaam, bestaandeVakken)) {
                        console.log('Dit vak is al toegevoegd.');
                    }else{
                        formDocentenPta.appendChild(div);
                    }
                }else{
                    formDocentenPta.appendChild(div);
                }
            }
            return

        }
    }

    // Creëer nieuwe inputvelden voor de docent verantwoordelijk voor het nieuwe vak
    var formDocentenPta = document.getElementById('VerantwoordelijkeDocentenPta');
    var label = document.createElement('label');
    label.textContent = vaknaam + " ("  + jaarlaag + ' '  + niveau+ "): ";
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
    inputDocent.setAttribute('name', 'docent_' + vaknaam.replace(/\s+/g, '') + '_' + niveau + '_' + jaarlaag); // Maak een unieke naam gebaseerd op vaknaam, niveau en jaarlaag
    var div = document.createElement('div')
    div.appendChild(label);
    div.appendChild(inputDocent);
    div.appendChild(icon);
    formDocentenPta.appendChild(div);

}

function VakkenControleren(fi, fniveau, fvaknaam,  fbestaandeVakken){
    console.log(fi + fniveau + fvaknaam)
    console.log(fbestaandeVakken)
    for(i = 0; i < fbestaandeVakken.length; i ++){
        if(fbestaandeVakken[i].getAttribute('vak') == fvaknaam && fbestaandeVakken[i].getAttribute('niveau') == fniveau && fbestaandeVakken[i].getAttribute('jaarlaag') == fi){
            return true
        }else{
            return false
        }
    }
}

function hulpmiddelenOpslaan(){
    event.preventDefault(); // Voorkom de standaardformulier verzending
    const form = document.querySelector('#hulpmiddelenform');
    const inputs = form.querySelectorAll('input[type="text"]'); // Zorg ervoor dat we alleen tekstvelden verzamelen
    let data = []; // Verander dit naar een array

    inputs.forEach((input) => {
        data.push(input.value); 
    });

    console.log("Verzonden data:", data); // Controleer de data die wordt verzonden

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

function docentenPtaOpslaan(){
    var form = document.getElementById('VerantwoordelijkeDocentenPta');
    var veldenArray = [];
    var inputs = form.querySelectorAll('input[type="text"]'); 
    
    
    inputs.forEach(function(input) {
        var vak = input.getAttribute("vak");
        var niveau = input.getAttribute("niveau");
        var jaarlaag = input.getAttribute("jaarlaag");
        var veldObject = {
            name: vak,  
            responsible : input.value,
            level: jaarlaag + ' ' + niveau
        };
        veldenArray.push(veldObject);
    });

    console.log(veldenArray);

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
    })
    .catch(error => {
        console.error('Error sending data:', error);
    });
}

function verwijderVak(divId){
    console.log(divId)
    divId.remove()
}

vakkenOphalen()

hulpmiddelenOphalen()

