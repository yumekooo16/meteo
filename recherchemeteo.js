// Clé d’API WeatherAPI
const cleApi = "b569114b8d26441391864151252305";

// Récupération de l'élément input de recherche
const inputRecherche = document.getElementById("recherche");

// Variable globale pour stocker lat/lon sélectionnés
let coordsSelectionnees = null;

// Ajout d’un écouteur sur le formulaire pour empêcher le rechargement de page
document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();
  // Si on a des coordonnées sélectionnées, on les utilise, sinon on utilise le texte
  if (coordsSelectionnees) {
    getMeteo(coordsSelectionnees.lat, coordsSelectionnees.lon);
  } else {
    getMeteo();
  }
});

// Création dynamique de la liste de suggestions (autocomplete)
const suggestions = document.createElement("ul");
suggestions.id = "suggestions";
suggestions.className = "suggestions-list";
// Insertion après le champ de recherche
inputRecherche.parentNode.insertBefore(suggestions, inputRecherche.nextSibling);

// Déclenché à chaque frappe dans le champ de recherche
inputRecherche.addEventListener("input", async () => {
  const query = inputRecherche.value.trim();

  coordsSelectionnees = null; // Réinitialiser les coordonnées quand on tape

  if (query.length < 2) {
  suggestions.innerHTML = "";
  return;
}


  try {
    // Appel API pour suggestions de villes
    const res = await fetch(`https://api.weatherapi.com/v1/search.json?key=${cleApi}&q=${encodeURIComponent(query)}`);
    const villes = await res.json();

    suggestions.innerHTML = ""; // Réinitialisation

    villes.forEach(ville => {
      if (ville.country === "France") { // Filtrer uniquement les villes françaises
        const li = document.createElement("li");
        li.textContent = `${ville.name}, ${ville.region}`;
        li.className = "suggestion-item";

        // Stocke lat/lon dans dataset
        li.dataset.lat = ville.lat;
        li.dataset.lon = ville.lon;

        li.addEventListener("click", () => {
          inputRecherche.value = `${ville.name}, ${ville.region}`;
          suggestions.innerHTML = ""; // Cache les suggestions

          // Stocke lat/lon dans variable globale
          coordsSelectionnees = {
            lat: li.dataset.lat,
            lon: li.dataset.lon
          };

          getMeteo(coordsSelectionnees.lat, coordsSelectionnees.lon);
        });

        suggestions.appendChild(li);
      }
    });
  } catch (err) {
    console.error("Erreur lors de la recherche de ville :", err);
    suggestions.innerHTML = ""; // Réinitialise en cas d'erreur
  }
});

// Fonction principale de récupération météo
async function getMeteo(lat, lon) {
  let query;

  if (lat && lon) {
    query = `${lat},${lon}`; // Recherche précise par coordonnées
  } else {
    query = inputRecherche.value.trim();
  }

  if (!query) {
    document.getElementById("description-meteo").innerText = "Veuillez entrer une ville.";
    return;
  }

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${cleApi}&q=${encodeURIComponent(query)}&days=10&lang=fr`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) throw new Error(data.error?.message || "Erreur API");

    // Affiche les données dans le DOM
    afficherMeteoActuelle(data);
    afficherPrevisions(data.forecast.forecastday);
    afficherPrevisionsHoraires(data.forecast.forecastday[0].hour);
  } catch (err) {
    console.error(err);
    document.getElementById("description-meteo").innerText = "Erreur lors de la récupération des données.";
  }
}

// Affichage des infos météo actuelles
function afficherMeteoActuelle(data) {
  const { name } = data.location;
  const { temp_c, condition } = data.current;

  document.getElementById("nom-ville").innerText = name;
  document.getElementById("temperature").innerText = `${temp_c}°C`;
  document.getElementById("description-meteo").innerText = condition.text;
  document.getElementById("icone-meteo").src = "https:" + condition.icon;
  document.getElementById("icone-meteo").alt = condition.text;

  changerFond(condition.text); // Change le fond selon la météo
}

// Affiche les prévisions (mobile + desktop)
function afficherPrevisions(previsions) {
  // ----- Mobile
  const sectionMobile = document.querySelector(".plustard");
  sectionMobile.innerHTML = `
    <div>
      <p class="titre">
        <img src="./img/calendrier.svg" alt="calendrier" class="icone-calendrier">
        Prévisions sur 10 jours
      </p>
      <hr>
      ${previsions
        .map(jour => {
          const date = new Date(jour.date);
          const jourNom = date.toLocaleDateString("fr-FR", { weekday: 'short' });
          const { icon } = jour.day.condition;
          const { mintemp_c, maxtemp_c } = jour.day;

          return `
            <div class="jour">
              <p class="nom-jour">${jourNom}</p>
              <img src="https:${icon}" alt="icône" class="icone-nuage">
              <p class="temperature">${mintemp_c}° <span class="separateur">|</span> ${maxtemp_c}°</p>
            </div>
            <hr>
          `;
        })
        .join("")}
    </div>
  `;

  // ----- Desktop
  const sectionDesktop = document.querySelector(".plustard-desktop .cartes-container");
  sectionDesktop.innerHTML = previsions
    .slice(0, 5) // Seulement les 5 prochains jours
    .map(jour => {
      const date = new Date(jour.date);
      const jourNom = date.toLocaleDateString("fr-FR", { weekday: 'long' });
      const temp = Math.round(jour.day.avgtemp_c);
      const icon = jour.day.condition.icon;

      return `
        <div class="carte-jour">
          <p>${jourNom}</p>
          <img src="https:${icon}" alt="icône météo">
          <p>${temp}°</p>
        </div>
      `;
    })
    .join("");
}

// Affiche les prévisions des prochaines heures
function afficherPrevisionsHoraires(heures) {
  const container = document.querySelector(".heures-container");
  container.innerHTML = "";

  const maintenant = new Date();

  // Filtre les heures futures et limite à 5
  const prochainesHeures = heures
    .filter(h => new Date(h.time) > maintenant)
    .slice(0, 5);

  prochainesHeures.forEach(h => {
    const heure = new Date(h.time).getHours() + "h";
    container.innerHTML += 
      `<div class="heure-horaire">
        <p>${heure}</p>
        <img src="https:${h.condition.icon}" alt="icône météo">
        <p>${h.temp_c}°C</p>
      </div>`;
  });
}

// Change le fond de l’écran selon la météo
function changerFond(description) {
  const desc = description.toLowerCase();
  let fond;

  if (desc.includes("soleil") || desc.includes("ensoleillé")) {
    fond = 'url("./img/ensoleillé.avif")';
  } else if (desc.includes("nuage") || desc.includes("couvert")) {
    fond = 'url("./img/fond-nuageux.avif.avif")';
  }
  // Cas particulier : météo nocturne avec ciel clair
  if (desc.includes("clair")) {
    fond = 'url("./img/star-4773_256.gif")';
    document.querySelector('.hautdepage').style.color = 'white'; // Texte en blanc
  } else {
    document.querySelector('.hautdepage').style.color = 'black'; // Sinon en noir
  }
  // Cas particulier : pluie avec averse
  if (desc.includes("pluie")|| desc.includes("averse") || desc.includes("orages")) {
    fond = 'url("./img/fondpluie.png")';
    document.querySelector('.hautdepage').style.color = 'white'; // Texte en blanc
  } else {
    document.querySelector('.hautdepage').style.color = 'black'; // Sinon en noir
  }

  // Appliquer le fond à la page
  document.body.style.backgroundImage = fond;
}
