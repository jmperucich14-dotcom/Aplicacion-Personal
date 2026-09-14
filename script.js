/* ============================================================
   EXPLORADOR ESPACIAL DIARIO
   Proyecto de práctica: HTML + CSS + JavaScript puro (sin frameworks)
   ============================================================

   Funcionalidades:
   1) Pestañas (Foto del día / Marte / Lanzamientos / Favoritos)
   2) NASA APOD, con buscador por fecha
   3) Fotos de Marte, con filtro por rover y por cámara
   4) Próximos lanzamientos de SpaceX + cuenta regresiva en vivo
   5) Favoritos guardados en localStorage (persisten al recargar)

   Conceptos clave usados:
   - fetch() + async/await + try/catch
   - manipulación del DOM (createElement, innerHTML, classList)
   - localStorage (para guardar datos en el navegador del usuario)
   - setInterval (para la cuenta regresiva en vivo)
============================================================ */

// -----------------------------------------------------------
// CONFIGURACIÓN
// -----------------------------------------------------------
// DEMO_KEY funciona sin registrarte, pero tiene un límite bajo
// (30 pedidos por hora / 50 por día). Para uso real, saca tu propia
// key gratis en 30 segundos aquí: https://api.nasa.gov/
   const NASA_API_KEY = "5hcEbI4PQPlNmUCsaDsxjxBxnUREaybWDGBvNHbI";

// Cámaras disponibles por rover (la NASA no las llama igual en todos)
const ROVER_CAMERAS = {
  curiosity: [
    { value: "FHAZ", label: "Front Hazard Avoidance" },
    { value: "RHAZ", label: "Rear Hazard Avoidance" },
    { value: "MAST", label: "Mast Camera" },
    { value: "CHEMCAM", label: "Chemistry and Camera" },
    { value: "MAHLI", label: "Mars Hand Lens Imager" },
    { value: "MARDI", label: "Mars Descent Imager" },
    { value: "NAVCAM", label: "Navigation Camera" },
  ],
  opportunity: [
    { value: "FHAZ", label: "Front Hazard Avoidance" },
    { value: "RHAZ", label: "Rear Hazard Avoidance" },
    { value: "NAVCAM", label: "Navigation Camera" },
    { value: "PANCAM", label: "Panoramic Camera" },
    { value: "MINITES", label: "Mini-TES" },
  ],
  spirit: [
    { value: "FHAZ", label: "Front Hazard Avoidance" },
    { value: "RHAZ", label: "Rear Hazard Avoidance" },
    { value: "NAVCAM", label: "Navigation Camera" },
    { value: "PANCAM", label: "Panoramic Camera" },
    { value: "MINITES", label: "Mini-TES" },
  ],
  perseverance: [
    { value: "NAVCAM_LEFT", label: "Navigation Camera (izq.)" },
    { value: "NAVCAM_RIGHT", label: "Navigation Camera (der.)" },
    { value: "MCZ_LEFT", label: "Mastcam-Z (izq.)" },
    { value: "MCZ_RIGHT", label: "Mastcam-Z (der.)" },
    { value: "FRONT_HAZCAM_LEFT_A", label: "Front Hazcam (izq.)" },
    { value: "FRONT_HAZCAM_RIGHT_A", label: "Front Hazcam (der.)" },
    { value: "REAR_HAZCAM_LEFT", label: "Rear Hazcam (izq.)" },
    { value: "REAR_HAZCAM_RIGHT", label: "Rear Hazcam (der.)" },
  ],
};

// -----------------------------------------------------------
// FAVORITOS (localStorage)
// -----------------------------------------------------------
const FAVORITES_KEY = "explorador-espacial-favoritos";

function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("No se pudo leer localStorage:", err);
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("No se pudo guardar en localStorage:", err);
  }
}

function isFavorite(id) {
  return getFavorites().some((f) => f.id === id);
}

// item = { id, img, title, subtitle }
function toggleFavorite(item) {
  const list = getFavorites();
  const index = list.findIndex((f) => f.id === item.id);

  if (index >= 0) {
    list.splice(index, 1); // ya estaba: lo quitamos
  } else {
    list.push(item); // no estaba: lo agregamos
  }

  saveFavorites(list);
  return index < 0; // true si quedó marcado como favorito, false si se quitó
}

function renderFavoritesTab() {
  const grid = document.getElementById("favorites-grid");
  const emptyMsg = document.getElementById("favorites-empty");
  const favorites = getFavorites();

  grid.innerHTML = "";

  if (favorites.length === 0) {
    emptyMsg.classList.remove("hidden");
    return;
  }
  emptyMsg.classList.add("hidden");

  favorites.forEach((fav) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${fav.img}" alt="${fav.title}" loading="lazy" />
      <div class="card-body">
        <p><strong>${fav.title}</strong></p>
        <p class="muted">${fav.subtitle || ""}</p>
      </div>
      <button class="fav-btn active" title="Quitar de favoritos">✕</button>
    `;
    card.querySelector(".fav-btn").addEventListener("click", () => {
      toggleFavorite(fav); // como ya existe, esto lo elimina
      renderFavoritesTab();
    });
    grid.appendChild(card);
  });
}

// -----------------------------------------------------------
// NAVEGACIÓN: menú desplegable
// -----------------------------------------------------------
const menuNav = document.querySelector(".menu-nav");
const menuToggle = document.getElementById("menu-toggle");
const menuList = document.getElementById("menu-list");
const menuCurrent = document.getElementById("menu-current");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

function closeMenu() {
  menuList.classList.add("hidden");
  menuNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function openMenu() {
  menuList.classList.remove("hidden");
  menuNav.classList.add("open");
  menuToggle.setAttribute("aria-expanded", "true");
}

menuToggle.addEventListener("click", () => {
  const isOpen = !menuList.classList.contains("hidden");
  isOpen ? closeMenu() : openMenu();
});

// Cierra el menú si haces clic afuera
document.addEventListener("click", (e) => {
  if (!menuNav.contains(e.target)) {
    closeMenu();
  }
});

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.tab;

    tabButtons.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(target).classList.add("active");
    menuCurrent.textContent = btn.textContent;
    closeMenu();

    if (target === "favorites") {
      renderFavoritesTab();
    }
  });
});

// -----------------------------------------------------------
// 1) FOTO ASTRONÓMICA DEL DÍA (NASA APOD)
// Docs: https://github.com/nasa/apod-api
// -----------------------------------------------------------
let currentApod = null; // guardamos el dato actual para poder guardarlo como favorito

async function loadApod(dateStr) {
  const loadingEl = document.getElementById("apod-loading");
  const errorEl = document.getElementById("apod-error");
  const contentEl = document.getElementById("apod-content");

  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  contentEl.classList.add("hidden");

  try {
    let url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;
    if (dateStr) {
      url += `&date=${dateStr}`;
    }

    const response = await fetch(url);

    if (response.status === 429) {
      throw new Error("límite de la DEMO_KEY compartida alcanzado (30/hora) — prueba en un rato o usa tu propia key");
    }
    if (!response.ok) {
      throw new Error(`error ${response.status} al consultar la API de la NASA`);
    }

    const data = await response.json();
    currentApod = data;

    if (data.media_type === "image") {
      document.getElementById("apod-img").src = data.hdurl || data.url;
    } else {
      document.getElementById("apod-img").src = data.thumbnail_url || data.url;
    }

    document.getElementById("apod-title").textContent = data.title;
    document.getElementById("apod-date-label").textContent = `Fecha: ${data.date}`;
    document.getElementById("apod-explanation").textContent = data.explanation;
    document.getElementById("apod-copyright").textContent = data.copyright
      ? `© ${data.copyright}`
      : "Dominio público / NASA";

    const favBtn = document.getElementById("apod-fav-btn");
    const favId = `apod-${data.date}`;
    favBtn.textContent = isFavorite(favId) ? "★" : "☆";
    favBtn.classList.toggle("active", isFavorite(favId));

    loadingEl.classList.add("hidden");
    contentEl.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    loadingEl.classList.add("hidden");
    errorEl.textContent = `No se pudo cargar la foto de esa fecha (${err.message}).`;
    errorEl.classList.remove("hidden");
  }
}

document.getElementById("apod-fav-btn").addEventListener("click", () => {
  if (!currentApod) return;

  const item = {
    id: `apod-${currentApod.date}`,
    img: currentApod.url,
    title: currentApod.title,
    subtitle: `Foto del día · ${currentApod.date}`,
  };

  const nowFavorite = toggleFavorite(item);
  const favBtn = document.getElementById("apod-fav-btn");
  favBtn.textContent = nowFavorite ? "★" : "☆";
  favBtn.classList.toggle("active", nowFavorite);
});

document.getElementById("apod-search").addEventListener("click", () => {
  const dateStr = document.getElementById("apod-date").value;
  if (dateStr) {
    loadApod(dateStr);
  }
});

document.getElementById("apod-today").addEventListener("click", () => {
  document.getElementById("apod-date").value = "";
  loadApod();
});

document.getElementById("apod-random").addEventListener("click", () => {
  // La NASA empezó a publicar la foto del día el 16 de junio de 1995
  const start = new Date("1995-06-16").getTime();
  const end = new Date().getTime();
  const randomDate = new Date(start + Math.random() * (end - start));
  const dateStr = randomDate.toISOString().split("T")[0]; // formato YYYY-MM-DD

  document.getElementById("apod-date").value = dateStr;
  loadApod(dateStr);
});

// -----------------------------------------------------------
// 2) FOTOS DE MARTE (NASA Mars Rover Photos)
// Docs: https://github.com/corincerami/mars-photo-api
// -----------------------------------------------------------
function populateCameraOptions() {
  const rover = document.getElementById("rover-select").value;
  const cameraSelect = document.getElementById("camera-select");
  const cameras = ROVER_CAMERAS[rover] || [];

  cameraSelect.innerHTML = '<option value="all">Todas</option>';
  cameras.forEach((cam) => {
    const opt = document.createElement("option");
    opt.value = cam.value;
    opt.textContent = cam.label;
    cameraSelect.appendChild(opt);
  });
}

function createMarsCard(photo) {
  const favId = `mars-${photo.id}`;
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <img src="${photo.img_src}" alt="Foto de ${photo.rover.name} en Marte" loading="lazy" />
    <div class="card-body">
      <p><strong>${photo.camera.full_name}</strong></p>
      <p class="muted">Fecha (terrestre): ${photo.earth_date}</p>
    </div>
    <button class="fav-btn ${isFavorite(favId) ? "active" : ""}" title="Guardar en favoritos">
      ${isFavorite(favId) ? "★" : "☆"}
    </button>
  `;

  card.querySelector(".fav-btn").addEventListener("click", (e) => {
    const item = {
      id: favId,
      img: photo.img_src,
      title: `${photo.rover.name} · ${photo.camera.full_name}`,
      subtitle: `Foto de Marte · ${photo.earth_date}`,
    };
    const nowFavorite = toggleFavorite(item);
    e.target.textContent = nowFavorite ? "★" : "☆";
    e.target.classList.toggle("active", nowFavorite);
  });

  return card;
}

async function loadMarsPhotos() {
  const rover = document.getElementById("rover-select").value;
  const camera = document.getElementById("camera-select").value;
  const loadingEl = document.getElementById("mars-loading");
  const errorEl = document.getElementById("mars-error");
  const gridEl = document.getElementById("mars-grid");
  const dateInfoEl = document.getElementById("mars-date-info");

  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  gridEl.innerHTML = "";
  dateInfoEl.textContent = "";

  try {
    // Primero pedimos las últimas fotos para saber qué fecha usar
    const latestUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${NASA_API_KEY}`;
    const latestResponse = await fetch(latestUrl);

    if (latestResponse.status === 429) {
      throw new Error("límite de la DEMO_KEY compartida alcanzado (30/hora)");
    }
    if (!latestResponse.ok) {
      throw new Error(`error ${latestResponse.status} al consultar fotos de Marte`);
    }

    const latestData = await latestResponse.json();
    let photos = latestData.latest_photos || [];

    if (photos.length === 0) {
      gridEl.innerHTML = `<p class="muted">Este rover no tiene fotos recientes disponibles.</p>`;
      loadingEl.classList.add("hidden");
      return;
    }

    const latestDate = photos[0].earth_date;
    dateInfoEl.textContent = `Mostrando fotos del ${latestDate} (última fecha con actividad registrada para este rover).`;

    // Si se eligió una cámara específica, pedimos las fotos de esa fecha filtradas por cámara
    if (camera !== "all") {
      const filteredUrl = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${latestDate}&camera=${camera}&api_key=${NASA_API_KEY}`;
      const filteredResponse = await fetch(filteredUrl);

      if (filteredResponse.status === 429) {
        throw new Error("límite de la DEMO_KEY compartida alcanzado (30/hora)");
      }
      if (!filteredResponse.ok) {
        throw new Error(`error ${filteredResponse.status} al filtrar por cámara`);
      }

      const filteredData = await filteredResponse.json();
      photos = filteredData.photos || [];

      if (photos.length === 0) {
        gridEl.innerHTML = `<p class="muted">Esa cámara no tomó fotos ese día. Prueba con otra cámara o revisa "Todas".</p>`;
        loadingEl.classList.add("hidden");
        return;
      }
    }

    photos.slice(0, 12).forEach((photo) => {
      gridEl.appendChild(createMarsCard(photo));
    });

    loadingEl.classList.add("hidden");
  } catch (err) {
    console.error(err);
    loadingEl.classList.add("hidden");
    errorEl.textContent = `No se pudieron cargar las fotos de este rover (${err.message}).`;
    errorEl.classList.remove("hidden");
  }
}

document.getElementById("rover-select").addEventListener("change", () => {
  populateCameraOptions();
  loadMarsPhotos();
});
document.getElementById("camera-select").addEventListener("change", loadMarsPhotos);
document.getElementById("mars-reload").addEventListener("click", loadMarsPhotos);

// -----------------------------------------------------------
// 3) LA TIERRA EN VIVO (NASA EPIC - satélite DSCOVR)
// Docs: https://epic.gsfc.nasa.gov/about/api
// Esta API es gratuita y no necesita api_key.
// -----------------------------------------------------------
async function loadEarthPhotos() {
  const loadingEl = document.getElementById("earth-loading");
  const errorEl = document.getElementById("earth-error");
  const gridEl = document.getElementById("earth-grid");

  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  gridEl.innerHTML = "";

  try {
    const response = await fetch("https://epic.gsfc.nasa.gov/api/natural");

    if (!response.ok) {
      throw new Error(`Error ${response.status} al consultar EPIC`);
    }

    const images = await response.json();

    if (!images || images.length === 0) {
      gridEl.innerHTML = `<p class="muted">No hay imágenes disponibles en este momento.</p>`;
      loadingEl.classList.add("hidden");
      return;
    }

    images.slice(0, 8).forEach((item) => {
      // El campo "date" viene como "2024-05-30 00:31:45", necesitamos año/mes/día
      const [datePart] = item.date.split(" ");
      const [year, month, day] = datePart.split("-");
      const imgUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${item.image}.png`;
      const favId = `earth-${item.identifier}`;

      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <img src="${imgUrl}" alt="Foto de la Tierra tomada el ${item.date}" loading="lazy" />
        <div class="card-body">
          <p><strong>Tierra completa</strong></p>
          <p class="muted">${item.date} UTC</p>
        </div>
        <button class="fav-btn ${isFavorite(favId) ? "active" : ""}" title="Guardar en favoritos">
          ${isFavorite(favId) ? "★" : "☆"}
        </button>
      `;

      card.querySelector(".fav-btn").addEventListener("click", (e) => {
        const favItem = {
          id: favId,
          img: imgUrl,
          title: "Tierra completa (EPIC)",
          subtitle: `Foto satelital · ${item.date} UTC`,
        };
        const nowFavorite = toggleFavorite(favItem);
        e.target.textContent = nowFavorite ? "★" : "☆";
        e.target.classList.toggle("active", nowFavorite);
      });

      gridEl.appendChild(card);
    });

    loadingEl.classList.add("hidden");
  } catch (err) {
    console.error(err);
    loadingEl.classList.add("hidden");
    errorEl.textContent = "No se pudieron cargar las fotos de la Tierra. Intenta más tarde.";
    errorEl.classList.remove("hidden");
  }
}

// -----------------------------------------------------------
// 4) ASTEROIDES CERCANOS HOY (NASA NeoWs)
// Docs: https://api.nasa.gov/ (sección Asteroids NeoWs)
// -----------------------------------------------------------
async function loadAsteroids() {
  const loadingEl = document.getElementById("asteroids-loading");
  const errorEl = document.getElementById("asteroids-error");

  try {
    // yyyy-mm-dd de hoy
    const today = new Date().toISOString().split("T")[0];
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY}`;

    const response = await fetch(url);

    if (response.status === 429) {
      throw new Error("límite de la DEMO_KEY compartida alcanzado (30/hora) — prueba en un rato o usa tu propia key");
    }
    if (!response.ok) {
      throw new Error(`error ${response.status} al consultar NeoWs`);
    }

    const data = await response.json();
    let asteroids = data.near_earth_objects[today] || [];

    // Ordenamos por distancia (los más cercanos primero) y limitamos la cantidad
    // para que el mapa no se sature de puntos
    asteroids.sort(
      (a, b) =>
        parseFloat(a.close_approach_data[0].miss_distance.kilometers) -
        parseFloat(b.close_approach_data[0].miss_distance.kilometers)
    );
    asteroids = asteroids.slice(0, 16);

    buildSolarMap(asteroids);

    loadingEl.classList.add("hidden");
  } catch (err) {
    console.error(err);
    loadingEl.classList.add("hidden");
    errorEl.textContent = `No se pudieron cargar los asteroides de hoy (${err.message}).`;
    errorEl.classList.remove("hidden");
  }
}

// -----------------------------------------------------------
// Dibuja el mapa esquemático del sistema solar interior + asteroides
// (todo en SVG, sin librerías externas)
//
// Importante: los elementos SVG creados dinámicamente se arman con
// document.createElementNS (no con innerHTML). Esto es más código, pero
// evita un problema clásico: si construyes SVG como texto y lo metes con
// innerHTML, algunos navegadores no lo interpretan con el "namespace"
// correcto y los elementos simplemente no aparecen en pantalla.
// -----------------------------------------------------------
const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function buildSolarMap(asteroids) {
  const svg = document.getElementById("solar-map");
  svg.innerHTML = ""; // limpiamos el dibujo anterior antes de redibujar

  const cx = 250;
  const cy = 230;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const posAt = (r, deg) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });

  // Radios de órbita a escala relativa real (en Unidades Astronómicas x 130px/UA).
  // Los ángulos son solo para que no queden todos en línea recta (no representan
  // la posición real de los planetas hoy).
  const orbits = [
    { name: "Mercurio", r: 51, angle: -60, size: 3.5, color: "#9aa2c0" },
    { name: "Venus", r: 94, angle: 200, size: 5, color: "#c9a86a" },
    { name: "Tierra", r: 130, angle: 0, size: 6.5, color: "#37c9ff" },
    { name: "Marte", r: 198, angle: 140, size: 4.5, color: "#e07856" },
  ];

  // --- <defs>: degradado del Sol + filtro de brillo ---
  const defs = svgEl("defs");

  const gradient = svgEl("radialGradient", { id: "sunGradient", cx: "50%", cy: "50%", r: "50%" });
  gradient.appendChild(svgEl("stop", { offset: "0%", "stop-color": "#fff6d0" }));
  gradient.appendChild(svgEl("stop", { offset: "55%", "stop-color": "#ffcf4d" }));
  gradient.appendChild(svgEl("stop", { offset: "100%", "stop-color": "#ff8c00" }));
  defs.appendChild(gradient);

  const filter = svgEl("filter", { id: "glow", x: "-120%", y: "-120%", width: "340%", height: "340%" });
  filter.appendChild(svgEl("feGaussianBlur", { stdDeviation: "4", result: "blur" }));
  const merge = svgEl("feMerge");
  merge.appendChild(svgEl("feMergeNode", { in: "blur" }));
  merge.appendChild(svgEl("feMergeNode", { in: "SourceGraphic" }));
  filter.appendChild(merge);
  defs.appendChild(filter);

  svg.appendChild(defs);

  // --- Órbitas y planetas ---
  orbits.forEach((p) => {
    const isEarth = p.name === "Tierra";
    const pos = posAt(p.r, p.angle);

    svg.appendChild(svgEl("circle", { class: `orbit ${isEarth ? "orbit-earth" : ""}`, cx, cy, r: p.r }));
    svg.appendChild(
      svgEl("circle", { cx: pos.x.toFixed(1), cy: pos.y.toFixed(1), r: p.size, fill: p.color })
    );

    const label = svgEl("text", {
      class: "planet-label",
      x: (pos.x + 9).toFixed(1),
      y: (pos.y - 8).toFixed(1),
    });
    label.textContent = p.name;
    svg.appendChild(label);
  });

  // --- El Sol, al centro ---
  svg.appendChild(svgEl("circle", { cx, cy, r: 16, fill: "url(#sunGradient)", filter: "url(#glow)" }));
  const sunLabel = svgEl("text", { class: "planet-label", x: cx - 10, y: cy + 32 });
  sunLabel.textContent = "Sol";
  svg.appendChild(sunLabel);

  // --- Asteroides, agrupados alrededor de la posición de la Tierra:
  // más cerca del punto azul = más cerca de la Tierra en la realidad hoy. ---
  const earthPos = posAt(130, 0);
  const minLog = Math.log10(7000);
  const maxLog = Math.log10(20000000);

  asteroids.forEach((ast, i) => {
    const approach = ast.close_approach_data[0];
    const distanceKm = parseFloat(approach.miss_distance.kilometers);
    const diamMaxKm = ast.estimated_diameter.kilometers.estimated_diameter_max;

    let t = (Math.log10(Math.max(distanceKm, 7000)) - minLog) / (maxLog - minLog);
    t = Math.min(1, Math.max(0, t));
    const localR = 22 + t * 55; // distancia visual al punto de la Tierra

    const angleDeg = (360 / Math.max(asteroids.length, 1)) * i;
    const pos = {
      x: earthPos.x + localR * Math.cos(toRad(angleDeg)),
      y: earthPos.y + localR * Math.sin(toRad(angleDeg)),
    };

    const sizePx = Math.min(9, Math.max(3, diamMaxKm * 2 + 3));
    const color = ast.is_potentially_hazardous_asteroid ? "#ff6b6b" : "#37c9ff";

    const circle = svgEl("circle", {
      class: "asteroid-dot",
      "data-index": i,
      cx: pos.x.toFixed(1),
      cy: pos.y.toFixed(1),
      r: sizePx.toFixed(1),
      fill: color,
      stroke: "rgba(255,255,255,0.6)",
      "stroke-width": "1",
    });

    const title = svgEl("title");
    title.textContent = ast.name;
    circle.appendChild(title);
    circle.addEventListener("click", () => showAsteroidInfo(ast));

    svg.appendChild(circle);
  });

  // Si no hay asteroides (o la API no devolvió nada), lo decimos explícitamente
  // en vez de dejar el mapa "vacío" sin explicación.
  if (asteroids.length === 0) {
    const msg = svgEl("text", {
      x: cx,
      y: cy + 100,
      "text-anchor": "middle",
      fill: "#9aa2c0",
      "font-size": "13",
    });
    msg.textContent = "No hay asteroides catalogados para hoy en el registro de la NASA.";
    svg.appendChild(msg);
  }
}

function showAsteroidInfo(ast) {
  const infoPanel = document.getElementById("asteroid-info");
  const approach = ast.close_approach_data[0];
  const diamMin = ast.estimated_diameter.kilometers.estimated_diameter_min.toFixed(2);
  const diamMax = ast.estimated_diameter.kilometers.estimated_diameter_max.toFixed(2);
  const distanceKm = Math.round(parseFloat(approach.miss_distance.kilometers)).toLocaleString("es-CL");
  const speedKmH = Math.round(parseFloat(approach.relative_velocity.kilometers_per_hour)).toLocaleString("es-CL");

  infoPanel.innerHTML = `
    <div class="info-icon">☄️</div>
    <div>
      <h3>${ast.name}
        ${
          ast.is_potentially_hazardous_asteroid
            ? '<span class="launch-badge failure">Potencialmente peligroso</span>'
            : '<span class="launch-badge success">Sin riesgo</span>'
        }
      </h3>
      <p>📏 Diámetro estimado: ${diamMin} - ${diamMax} km</p>
      <p>📍 Distancia mínima hoy: ${distanceKm} km</p>
      <p>💨 Velocidad relativa: ${speedKmH} km/h</p>
    </div>
  `;
  infoPanel.classList.remove("hidden");
}

// -----------------------------------------------------------
// 5) LANZAMIENTOS DE SPACEX: próximos y pasados + cuenta regresiva
// Docs: https://ll.thespacedevs.com/docs/ (Launch Library 2, por The Space Devs)
//
// Nota: la API original de SpaceX (api.spacexdata.com) dejó de funcionar
// en 2026, así que usamos Launch Library 2, que cubre lanzamientos de
// SpaceX (y de otras empresas) con datos actualizados. Es gratis pero
// tiene un límite bajo sin registrarse: 15 pedidos por hora.
// -----------------------------------------------------------
let countdownIntervalId = null;

function startCountdown(missionName, targetDateUtc) {
  const box = document.getElementById("countdown-box");
  const targetDate = new Date(targetDateUtc);

  document.getElementById("countdown-mission").textContent = missionName;
  box.classList.remove("hidden");

  if (countdownIntervalId) {
    clearInterval(countdownIntervalId); // evita duplicar el temporizador
  }

  function tick() {
    const now = new Date();
    let diff = targetDate - now;

    if (diff <= 0) {
      document.getElementById("cd-days").textContent = "00";
      document.getElementById("cd-hours").textContent = "00";
      document.getElementById("cd-mins").textContent = "00";
      document.getElementById("cd-secs").textContent = "00";
      clearInterval(countdownIntervalId);
      return;
    }

    const pad = (n) => String(n).padStart(2, "0");

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);
    const secs = Math.floor(diff / 1000);

    document.getElementById("cd-days").textContent = pad(days);
    document.getElementById("cd-hours").textContent = pad(hours);
    document.getElementById("cd-mins").textContent = pad(mins);
    document.getElementById("cd-secs").textContent = pad(secs);
  }

  tick(); // primer render inmediato
  countdownIntervalId = setInterval(tick, 1000);
}

// Formatea una fecha UTC al horario de Chile de forma explícita,
// sin depender de en qué zona horaria esté el navegador de quien mire la página.
function formatFechaChile(fechaUtc) {
  return new Date(fechaUtc).toLocaleString("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Santiago",
  });
}

async function loadLaunches(type = "upcoming") {
  const loadingEl = document.getElementById("launches-loading");
  const errorEl = document.getElementById("launches-error");
  const listEl = document.getElementById("launches-list");
  const countdownBox = document.getElementById("countdown-box");

  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  listEl.innerHTML = "";

  // "upcoming" y "previous" son los nombres que usa Launch Library 2
  // (lo que antes llamábamos "pasados" acá se llama "previous" en su API)
  const endpoint =
    type === "past"
      ? "https://ll.thespacedevs.com/2.2.0/launch/previous/?lsp__name=SpaceX&limit=10"
      : "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?lsp__name=SpaceX&limit=10";

  try {
    const response = await fetch(endpoint);

    if (response.status === 429) {
      throw new Error("Límite de pedidos por hora alcanzado (15/hora sin registrarse)");
    }
    if (!response.ok) {
      throw new Error(`Error ${response.status} al consultar lanzamientos`);
    }

    const data = await response.json();
    const launches = data.results || [];

    // Próximos: del más cercano al más lejano. Pasados: del más reciente hacia atrás.
    const sorted = [...launches]
      .filter((l) => l.net)
      .sort((a, b) => (type === "past" ? new Date(b.net) - new Date(a.net) : new Date(a.net) - new Date(b.net)));

    if (type === "upcoming" && sorted.length > 0) {
      countdownBox.classList.remove("hidden");
      startCountdown(sorted[0].name, sorted[0].net);
    } else {
      countdownBox.classList.add("hidden");
      if (countdownIntervalId) clearInterval(countdownIntervalId);
    }

    if (sorted.length === 0) {
      listEl.innerHTML = `<p class="muted">No hay lanzamientos ${type === "past" ? "recientes" : "próximos"} registrados por ahora.</p>`;
    }

    sorted.forEach((launch) => {
      const fecha = formatFechaChile(launch.net);
      const patchUrl = launch.image || "https://via.placeholder.com/60x60/141826/9aa2c0?text=%F0%9F%9A%80";
      const rocketName = launch.rocket?.configuration?.name;
      const statusName = launch.status?.name || "";

      let badge = "";
      if (type === "past") {
        const exito = statusName.toLowerCase().includes("success");
        const fallo = statusName.toLowerCase().includes("fail");
        badge = exito
          ? '<span class="launch-badge success">Éxito</span>'
          : fallo
          ? '<span class="launch-badge failure">Falló</span>'
          : statusName
          ? `<span class="launch-badge">${statusName}</span>`
          : "";
      } else if (statusName) {
        badge = `<span class="launch-badge">${statusName}</span>`;
      }

      const descripcion = launch.mission?.description || "";

      const item = document.createElement("li");
      item.className = "launch-item";
      item.innerHTML = `
        <img src="${patchUrl}" alt="Insignia de la misión ${launch.name}" />
        <div>
          <h3>${launch.name} ${badge}</h3>
          <p>📅 ${fecha} (hora de Chile)${rocketName ? ` · 🚀 ${rocketName}` : ""}</p>
          ${descripcion ? `<p>${descripcion.slice(0, 150)}${descripcion.length > 150 ? "..." : ""}</p>` : ""}
        </div>
      `;
      listEl.appendChild(item);
    });

    loadingEl.classList.add("hidden");
  } catch (err) {
    console.error(err);
    loadingEl.classList.add("hidden");
    errorEl.textContent = `No se pudieron cargar los lanzamientos (${err.message}). Intenta de nuevo en un rato.`;
    errorEl.classList.remove("hidden");
  }
}

document.getElementById("launches-upcoming-btn").addEventListener("click", (e) => {
  document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
  e.target.classList.add("active");
  loadLaunches("upcoming");
});

document.getElementById("launches-past-btn").addEventListener("click", (e) => {
  document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
  e.target.classList.add("active");
  loadLaunches("past");
});

// -----------------------------------------------------------
// 6) POSICIÓN EN VIVO DE LA ISS
// API: https://wheretheiss.at (gratis, sin api key)
//
// Esta función no solo actualiza el texto de la pestaña "Cámara ISS":
// también avisa al globo 3D (globe.js) de la nueva posición con un
// "evento personalizado" (CustomEvent). Así, globe.js puede dibujar un
// puntito que se mueve sobre el globo sin que los dos archivos tengan
// que conocerse directamente entre sí.
// -----------------------------------------------------------
async function updateIssPosition() {
  const telemetryEl = document.getElementById("iss-telemetry");
  if (!telemetryEl) return;

  try {
    const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544");

    if (!response.ok) {
      throw new Error(`error ${response.status}`);
    }

    const data = await response.json();

    const lat = data.latitude.toFixed(2);
    const lng = data.longitude.toFixed(2);
    const alt = Math.round(data.altitude);
    const vel = Math.round(data.velocity);
    const deDia = data.visibility === "daylight";

    telemetryEl.innerHTML = `
      <p>📍 Latitud: ${lat}° · Longitud: ${lng}°</p>
      <p>📏 Altitud: ${alt.toLocaleString("es-CL")} km · 💨 Velocidad: ${vel.toLocaleString("es-CL")} km/h</p>
      <p>${deDia ? "☀️ Iluminada por el sol" : "🌑 Sobre el lado nocturno de la Tierra"}</p>
    `;

    // Avisamos al globo 3D (ver globe.js) para que mueva el punto de la ISS
    window.dispatchEvent(
      new CustomEvent("iss-update", { detail: { lat: data.latitude, lng: data.longitude } })
    );
  } catch (err) {
    console.error(err);
    telemetryEl.innerHTML = `<p class="muted">No se pudo obtener la posición de la ISS (${err.message}).</p>`;
  }
}

// -----------------------------------------------------------
// INICIO: cargamos todo cuando la página termina de cargar
// -----------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  populateCameraOptions();
  loadApod();
  loadMarsPhotos();
  loadEarthPhotos();
  loadAsteroids();
  loadLaunches("upcoming");

  updateIssPosition();
  setInterval(updateIssPosition, 10000); // cada 10 segundos
});
