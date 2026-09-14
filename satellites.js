/* ============================================================
   PESTAÑA "SATÉLITES": posición en vivo con datos orbitales reales
   ============================================================

   A diferencia de wheretheiss.at (que solo sabe de la ISS y nos
   devuelve la posición ya calculada), acá hacemos el cálculo nosotros
   mismos, en el navegador, usando el mismo método que usan las
   agencias espaciales:

   1) Pedimos a CelesTrak los "elementos orbitales" (TLE) del satélite
      elegido — dos líneas de texto con números que describen su órbita.
   2) Le pasamos esas líneas a la librería satellite.js, que sabe
      aplicar el modelo SGP4 (el estándar para este tipo de cálculo)
      y nos devuelve dónde está el satélite en cualquier instante.
   3) Repetimos el cálculo cada 2 segundos (sin volver a pedirle nada
      a CelesTrak) para que el punto se mueva solo, en vivo.

   Este archivo es un módulo (type="module" en index.html), así que
   podemos usar "import" para traer la librería desde internet.
============================================================ */

import * as satellite from "https://esm.sh/satellite.js";

// Catálogo de satélites disponibles en el selector, con su número
// NORAD (el identificador único de cada objeto en órbita) y una nota
// educativa sobre cada uno.
const SATELLITES = {
  25544: {
    nombre: "Estación Espacial Internacional (ISS)",
    emoji: "🛰️",
    nota: "Órbita baja (~400 km), da la vuelta a la Tierra cada ~90 minutos — por eso se mueve rápido en el mapa.",
  },
  20580: {
    nombre: "Telescopio Espacial Hubble",
    emoji: "🔭",
    nota: "Orbita a ~535 km de altura, sobre la atmósfera, para observar el universo sin la distorsión del aire.",
  },
  48274: {
    nombre: "Estación Espacial China (Tiangong)",
    emoji: "🇨🇳",
    nota: "La otra estación espacial habitada en órbita baja, operada por la agencia espacial de China.",
  },
  43013: {
    nombre: "NOAA-20 (satélite meteorológico)",
    emoji: "🌦️",
    nota: "Órbita polar sincronizada con el sol: pasa por (casi) el mismo punto local cada día, monitoreando el clima global.",
  },
  41866: {
    nombre: "GOES-16 (satélite geoestacionario)",
    emoji: "🌎",
    nota: "A 35.786 km de altura, gira a la misma velocidad que la Tierra — por eso parece quedarse \"fijo\" sobre un mismo punto.",
  },
};

const selectEl = document.getElementById("sat-select");
const loadingEl = document.getElementById("sat-loading");
const errorEl = document.getElementById("sat-error");
const mapWrapEl = document.getElementById("sat-map-wrap");
const markerEl = document.getElementById("sat-marker");
const telemetryEl = document.getElementById("sat-telemetry");

let currentSatrec = null;
let currentId = null;
let updateTimer = null;

// -----------------------------------------------------------
// Descarga el TLE (2 líneas de datos orbitales) desde CelesTrak
// -----------------------------------------------------------
async function fetchTle(noradId) {
  const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=tle`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CelesTrak respondió con error ${response.status}`);
  }

  const text = (await response.text()).trim();
  const lines = text.split("\n").map((l) => l.trim());

  // El formato "3LE" trae: nombre, línea 1, línea 2
  if (lines.length < 3 || !lines[1].startsWith("1 ") || !lines[2].startsWith("2 ")) {
    throw new Error("CelesTrak no devolvió datos orbitales válidos para este satélite");
  }

  return { line1: lines[1], line2: lines[2] };
}

// -----------------------------------------------------------
// Calcula la posición actual a partir del TLE ya cargado y
// actualiza el mapa + el panel de telemetría
// -----------------------------------------------------------
function updatePosition() {
  if (!currentSatrec) return;

  const now = new Date();
  const positionAndVelocity = satellite.propagate(currentSatrec, now);
  const positionEci = positionAndVelocity.position;
  const velocityEci = positionAndVelocity.velocity;

  // Si el satélite ya "decayó" (se quemó en la atmósfera) o el TLE es muy
  // viejo, propagate() puede devolver un objeto sin posición válida.
  if (!positionEci || typeof positionEci === "boolean") {
    errorEl.textContent =
      "No se pudo calcular la posición (el modelo orbital de este satélite ya no es válido — puede que haya reentrado a la atmósfera).";
    errorEl.classList.remove("hidden");
    mapWrapEl.classList.add("hidden");
    telemetryEl.classList.add("hidden");
    clearInterval(updateTimer);
    return;
  }

  const gmst = satellite.gstime(now);
  const geodetic = satellite.eciToGeodetic(positionEci, gmst);

  const lat = satellite.degreesLat(geodetic.latitude);
  const lon = satellite.degreesLong(geodetic.longitude);
  const altKm = geodetic.height;

  const vel = velocityEci;
  const speedKmS = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
  const speedKmH = speedKmS * 3600;

  // Movemos el punto sobre el mapa: convertimos latitud/longitud a un
  // porcentaje dentro del rectángulo del mapa (que usa una imagen con
  // proyección "equirectangular", igual que la textura del globo 3D).
  markerEl.style.left = `${((lon + 180) / 360) * 100}%`;
  markerEl.style.top = `${((90 - lat) / 180) * 100}%`;

  const info = SATELLITES[currentId];
  telemetryEl.innerHTML = `
    <div class="info-icon">${info.emoji}</div>
    <div>
      <h3>${info.nombre}</h3>
      <p>📍 Latitud: ${lat.toFixed(2)}° · Longitud: ${lon.toFixed(2)}°</p>
      <p>📏 Altitud: ${Math.round(altKm).toLocaleString("es-CL")} km · 💨 Velocidad: ${Math.round(speedKmH).toLocaleString("es-CL")} km/h</p>
      <p class="muted">${info.nota}</p>
    </div>
  `;

  mapWrapEl.classList.remove("hidden");
  telemetryEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
}

// -----------------------------------------------------------
// Cambia de satélite: pide su TLE de nuevo y reinicia el cálculo
// -----------------------------------------------------------
async function loadSatellite(noradId) {
  currentId = noradId;
  currentSatrec = null;
  clearInterval(updateTimer);

  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  mapWrapEl.classList.add("hidden");
  telemetryEl.classList.add("hidden");

  try {
    const { line1, line2 } = await fetchTle(noradId);
    currentSatrec = satellite.twoline2satrec(line1, line2);

    loadingEl.classList.add("hidden");
    updatePosition();
    updateTimer = setInterval(updatePosition, 2000);
  } catch (err) {
    console.error(err);
    loadingEl.classList.add("hidden");
    errorEl.textContent = `No se pudo obtener la órbita de este satélite (${err.message}). Puede ser que tu navegador o red esté bloqueando la consulta a CelesTrak — inténtalo de nuevo en un rato.`;
    errorEl.classList.remove("hidden");
  }
}

selectEl?.addEventListener("change", () => loadSatellite(selectEl.value));

// Cargamos el primer satélite (ISS) apenas la página está lista
if (selectEl) {
  loadSatellite(selectEl.value);
}
