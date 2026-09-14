/* ============================================================
   GLOBO INTERACTIVO (pestaña "Inicio")
   ============================================================

   Usa la librería globe.gl (que por dentro usa Three.js/WebGL)
   para dibujar un planeta 3D que se puede rotar y hacer zoom,
   con:
   - Sombreado de noche en tiempo real (según la posición del sol)
   - Países en los que se puede hacer clic para ver información

   Este archivo es un módulo de JavaScript (fíjate en el
   type="module" del <script> en index.html), lo que nos permite
   usar "import" para traer librerías desde internet sin tener
   que instalar nada con npm.

   Librerías usadas (todas gratuitas, cargadas desde un CDN):
   - globe.gl          → dibuja el globo 3D (cargada en index.html)
   - three             → motor 3D que usa globe.gl por debajo
   - solar-calculator  → calcula dónde está el sol en un instante dado
============================================================ */

import { MeshLambertMaterial } from "https://esm.sh/three";
import * as solar from "https://esm.sh/solar-calculator";

// GeoJSON con los límites de todos los países (dataset público de Natural Earth,
// reutilizado desde los ejemplos oficiales de globe.gl)
const COUNTRIES_URL =
  "https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";

// -----------------------------------------------------------
// Utilidades
// -----------------------------------------------------------

// Convierte un código ISO de 2 letras (ej: "CL") en el emoji de su bandera.
// Trick: los emojis de banderas están hechos de 2 "letras regionales"
// especiales que van justo después de las letras normales en Unicode.
function isoToFlagEmoji(iso2) {
  if (!iso2 || iso2.length !== 2 || iso2 === "-9") return "🏳️";
  const codePoints = [...iso2.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Calcula la posición del sol (punto subsolar: dónde el sol está justo
// arriba, al mediodía solar) para un instante "dt".
// Misma fórmula que usa el ejemplo oficial "solar-terminator" de globe.gl.
function sunPosAt(dt) {
  const day = new Date(+dt).setUTCHours(0, 0, 0, 0);
  const t = solar.century(dt);
  const longitude = ((day - dt) / 864e5) * 360 - 180;
  return [longitude - solar.equationOfTime(t) / 4, solar.declination(t)];
}

function getGlobeHeight() {
  return window.innerWidth < 600 ? 380 : 520;
}

// -----------------------------------------------------------
// Referencias al HTML
// -----------------------------------------------------------
const container = document.getElementById("globe-viz");
const infoPanel = document.getElementById("country-info");
const clockEl = document.getElementById("globe-clock");
const resetBtn = document.getElementById("globe-reset");

if (container && window.Globe) {
  let selectedCountry = null;

  const DEFAULT_VIEW = { lat: -33.45, lng: -70.65, altitude: 2.2 }; // Santiago de Chile

  // -----------------------------------------------------------
  // Creamos el globo
  // -----------------------------------------------------------
  // Colores pensados para que se vea como un atlas: bordes finos y claros,
  // relleno casi transparente (se ve el mapa real de fondo), y un resaltado
  // sutil al pasar el mouse o seleccionar un país (nada de colores "de videojuego").
  const FILL_DEFAULT = "rgba(255, 255, 255, 0.02)";
  const FILL_HOVER = "rgba(255, 255, 255, 0.13)";
  const FILL_SELECTED = "rgba(124, 92, 255, 0.55)";

  const globe = new Globe(container)
    .globeImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg")
    .bumpImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png")
    .backgroundImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png")
    .showAtmosphere(true)
    .atmosphereColor("#5db3ff")
    .atmosphereAltitude(0.2)
    .width(container.clientWidth)
    .height(getGlobeHeight())
    .lineHoverPrecision(0)
    .polygonAltitude((d) => (d === selectedCountry ? 0.015 : 0.002))
    .polygonCapColor((d) => (d === selectedCountry ? FILL_SELECTED : FILL_DEFAULT))
    .polygonSideColor(() => "rgba(40, 40, 60, 0.15)")
    .polygonStrokeColor(() => "rgba(255, 255, 255, 0.55)")
    .polygonLabel(({ properties: d }) => `<b>${d.ADMIN}</b>`)
    .onPolygonHover((hoverD) =>
      globe
        .polygonAltitude((d) => (d === hoverD || d === selectedCountry ? 0.015 : 0.002))
        .polygonCapColor((d) => {
          if (d === selectedCountry) return FILL_SELECTED;
          if (d === hoverD) return FILL_HOVER;
          return FILL_DEFAULT;
        })
    )
    .onPolygonClick((polygon, event, { lat, lng }) => selectCountry(polygon, lat, lng))
    .polygonsTransitionDuration(200);

  globe.pointOfView(DEFAULT_VIEW, 0);

  // Rotación automática, como un globo terráqueo real: gira solo,
  // y si lo arrastras, sigue girando después desde donde lo soltaste.
  globe.controls().autoRotate = true;
  globe.controls().autoRotateSpeed = 0.3;
  globe.controls().enableZoom = true;
  globe.controls().enableDamping = true;
  globe.controls().dampingFactor = 0.08;
  globe.controls().minDistance = 120;
  globe.controls().maxDistance = 700;

  // -----------------------------------------------------------
  // Punto de la Estación Espacial Internacional (ISS) en vivo
  // La posición real la calcula script.js (pestaña "Cámara ISS") y nos
  // avisa mandando un evento "iss-update" — así este archivo no necesita
  // saber nada de esa API, solo escuchar el evento.
  // -----------------------------------------------------------
  globe
    .pointsData([])
    .pointLat("lat")
    .pointLng("lng")
    .pointColor(() => "#ffcf4d")
    .pointAltitude(0.015)
    .pointRadius(0.45)
    .pointLabel(() => "🛰️ Estación Espacial Internacional (ISS)")
    .pointsMerge(false);

  window.addEventListener("iss-update", (e) => {
    globe.pointsData([{ lat: e.detail.lat, lng: e.detail.lng }]);
  });

  // -----------------------------------------------------------
  // Cargamos los países y los mostramos como capa de polígonos
  // -----------------------------------------------------------
  fetch(COUNTRIES_URL)
    .then((res) => res.json())
    .then((countries) => {
      // Excluimos la Antártica (no tiene un solo "país" y distorsiona el mapa)
      const paises = countries.features.filter((d) => d.properties.ISO_A2 !== "AQ");
      globe.polygonsData(paises);
    })
    .catch((err) => {
      console.error("No se pudieron cargar los países:", err);
    });

  // -----------------------------------------------------------
  // Selección de país (clic)
  // -----------------------------------------------------------
  function selectCountry(polygon, lat, lng) {
    selectedCountry = polygon;
    globe
      .polygonAltitude((d) => (d === polygon ? 0.015 : 0.002))
      .polygonCapColor((d) => (d === polygon ? FILL_SELECTED : FILL_DEFAULT));

    if (!polygon) {
      infoPanel.classList.add("hidden");
      return;
    }

    const d = polygon.properties;
    const flag = isoToFlagEmoji(d.ISO_A2);

    // Hora solar aproximada en esa longitud (no es el huso horario oficial del país,
    // es solo una estimación basada en dónde está el sol respecto a esa longitud).
    const now = new Date();
    const nowUtcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    const solarHour = (nowUtcHours + lng / 15 + 24) % 24;
    const hh = String(Math.floor(solarHour)).padStart(2, "0");
    const mm = String(Math.round((solarHour % 1) * 60)).padStart(2, "0");

    infoPanel.innerHTML = `
      <div class="country-flag">${flag}</div>
      <div>
        <h3>${d.ADMIN}</h3>
        <p class="muted">${d.SUBREGION || d.CONTINENT}</p>
        <p>👥 Población estimada: ${Number(d.POP_EST).toLocaleString("es-CL")}</p>
        <p>🕒 Hora solar aproximada: ${hh}:${mm}
          <span class="muted">(según longitud, no es el huso horario oficial)</span>
        </p>
      </div>
    `;
    infoPanel.classList.remove("hidden");

    // Centramos la cámara suavemente sobre el país elegido
    globe.pointOfView({ lat, lng, altitude: 1.6 }, 1000);
  }

  resetBtn?.addEventListener("click", () => {
    selectCountry(null);
    globe.pointOfView(DEFAULT_VIEW, 1000);
  });

  // -----------------------------------------------------------
  // Sombreado de noche en tiempo real
  // -----------------------------------------------------------
  // Truco: un "tile" (mosaico) de 180° x 180° centrado en un punto de la esfera
  // cubre exactamente la mitad del globo (un hemisferio) alrededor de ese punto.
  // Si lo centramos en el punto opuesto al sol (el punto "antisolar"), ese
  // mosaico cubre justo el lado de noche del planeta.
  function updateNightShading() {
    const dt = Date.now();
    const [sunLng, sunLat] = sunPosAt(dt);
    const nightPoint = { lat: -sunLat, lng: sunLng + 180 };

    globe
      .tilesData([nightPoint])
      .tileLng((p) => p.lng)
      .tileLat((p) => p.lat)
      .tileAltitude(0.005)
      .tileWidth(180)
      .tileHeight(180)
      .tileUseGlobeProjection(false)
      .tileMaterial(() => new MeshLambertMaterial({ color: "#060814", opacity: 0.55, transparent: true }))
      .tilesTransitionDuration(0);

    if (clockEl) {
      const horaUtc = new Date(dt).toUTCString().slice(17, 22);
      clockEl.textContent = `🕐 Hora UTC actual: ${horaUtc} — la franja oscura es la noche en este momento`;
    }
  }

  updateNightShading();
  setInterval(updateNightShading, 60 * 1000); // se actualiza cada minuto

  // -----------------------------------------------------------
  // Responsive: reajustamos el tamaño si cambia el ancho de la ventana
  // -----------------------------------------------------------
  window.addEventListener("resize", () => {
    globe.width(container.clientWidth).height(getGlobeHeight());
  });
} else {
  console.error("No se pudo inicializar el globo (¿no cargó la librería globe.gl?).");
}
