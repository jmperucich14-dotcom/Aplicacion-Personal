# 🚀 Explorador Espacial Diario

Proyecto de portafolio hecho con **HTML + CSS + JavaScript puro** (sin frameworks, sin backend). La página de Inicio tiene un globo 3D interactivo (con [globe.gl](https://globe.gl/)), y el resto de las secciones (accesibles desde el menú desplegable ☰) consumen APIs públicas gratuitas de la NASA, The Space Devs y CelesTrak:

- **NASA APOD** — foto/video astronómico del día, con buscador por fecha y "sorpréndeme".
- **NASA Mars Rover Photos** — últimas fotos de los rovers, filtrables por cámara.
- **NASA EPIC** — fotos reales y recientes de la Tierra completa (satélite DSCOVR).
- **NASA NeoWs** — asteroides que pasan cerca de la Tierra hoy, mostrados en un mapa del sistema solar.
- **Launch Library 2 (The Space Devs)** — lanzamientos de SpaceX próximos y pasados, con cuenta regresiva en vivo.
- **wheretheiss.at** — posición en tiempo real de la Estación Espacial Internacional (ISS), reflejada como un punto en el globo de Inicio.
- **CelesTrak + satellite.js** — datos orbitales reales (TLE) de varios satélites, con la posición calculada en el navegador usando el modelo SGP4.

## Funcionalidades

- ☰ **Menú desplegable**: toda la navegación vive en un único botón de menú (arriba a la derecha), para no saturar la pantalla con pestañas — útil ahora que son 8 secciones.
- 🌐 **Inicio**: globo terráqueo 3D interactivo, con atmósfera y un estilo más "de atlas" (países marcados con bordes finos en vez de bloques de color sólido). Gira solo, lo puedes arrastrar para rotarlo, hacer zoom con el scroll, y **hacer clic en cualquier país** para ver su nombre, población y bandera. Una franja oscura en tiempo real muestra qué parte del planeta está de noche ahora mismo.
- 🖼️ **Foto del día (APOD)**: elige cualquier fecha con el calendario, o usa "🎲 Sorpréndeme" para una fecha al azar desde 1995.
- 🔴 **Marte**: elige rover (Curiosity, Perseverance, Opportunity, Spirit) y filtra por cámara específica.
- 🌍 **Tierra**: imágenes reales de la Tierra completa tomadas hoy por el satélite DSCOVR.
- ☄️ **Asteroides**: elige cualquier día de los próximos 7, y ve un mapa esquemático del sistema solar interior (Sol, Mercurio, Venus, Tierra, Marte a escala relativa) con los asteroides de ese día dibujados alrededor de la Tierra — más cerca del punto azul significa que pasa más cerca en la realidad, y el tamaño del punto refleja el diámetro estimado (escala logarítmica, porque van desde metros hasta kilómetros). Debajo hay una tabla ordenable (clic en cualquier columna) con todos los datos; hacer clic en un punto o en una fila muestra nombre, fecha y hora exacta del acercamiento, tamaño, distancia y velocidad.
- 🛰️ **Satélites**: elige entre 5 satélites reales (ISS, Hubble, la estación espacial china Tiangong, un satélite meteorológico y uno geoestacionario) y sigue su posición en vivo sobre un mapa del mundo — calculada en tu propio navegador a partir de datos orbitales reales (TLE) de CelesTrak, con el mismo modelo matemático (SGP4) que usan las agencias espaciales.
- 🚀 **Lanzamientos**: toggle entre **Próximos** (con cuenta regresiva en vivo día:hora:min:seg) y **Pasados** (con resultado éxito/falló). Todas las horas se muestran explícitamente en horario de Chile (`America/Santiago`), sin importar la zona horaria de quien abra la página.
- ⭐ **Favoritos**: marca cualquier foto (del día, de Marte o de la Tierra) con el botón ☆ y queda guardada en tu navegador (`localStorage`), persiste aunque cierres o recargues la página. Se ven todas juntas en la pestaña "Favoritos".

## Cómo correrlo

No necesitas instalar nada, pero **desde que se agregó el globo interactivo, es mejor usar un servidor local** en vez de abrir el archivo directamente. Esto es porque el globo se carga como "módulo" de JavaScript, y por seguridad Chrome (y otros navegadores) bloquean los módulos cuando abres un archivo directo desde tu computador (`file://...`).

1. Descarga esta carpeta completa.
2. Abre una terminal dentro de la carpeta y corre uno de estos comandos:

   **En Mac/Linux:**
   ```bash
   python3 -m http.server 8000
   ```

   **En Windows (PowerShell o CMD):**
   ```
   python -m http.server 8000
   ```
   Si "python" no se reconoce, prueba `py -m http.server 8000`.

   Cualquiera de las dos formas anteriores es la más simple si tienes Python instalado. Si prefieres Node.js en vez de Python:
   ```
   npx serve .
   ```

   Luego abre `http://localhost:8000` en tu navegador (no `file://...`).

   > ⚠️ **Nota para Windows con `npx`**: si PowerShell muestra un error de `SecurityError` o "la ejecución de scripts está deshabilitada", es una restricción de seguridad de PowerShell, no un problema del proyecto. Soluciones (de más simple a más completa):
   > 1. Usa Python en su lugar (ver arriba) — es lo más fácil.
   > 2. O fuerza la versión `.cmd` de npx: `npx.cmd serve .`
   > 3. O autoriza scripts solo para esa ventana de PowerShell (no cambia tu sistema de forma permanente, se revierte al cerrarla): primero `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` y luego `npx serve .`
   >
   > Y al copiar comandos desde este README, copia solo el texto del comando — las comillas triple ` ``` ` de arriba y abajo son solo el marco del bloque de código, no se escriben en la terminal.

3. Si solo quieres ver las pestañas de Foto del día, Marte, Tierra, Asteroides o Lanzamientos (sin el globo de Inicio), sí puedes simplemente hacer doble clic en `index.html` — esas partes no usan módulos y funcionan igual.

El globo también necesita conexión a internet (carga la librería 3D y el mapa del mundo desde internet) y un navegador con WebGL habilitado, que es lo normal en cualquier navegador moderno (Chrome, Firefox, Edge, Safari).

## Sobre la API key de la NASA

El código usa `DEMO_KEY`, que funciona sin registro pero tiene un límite bajo (30 pedidos/hora, 50/día) y lo comparten todos los que usan `DEMO_KEY` en el mundo, así que puede fallar en horas pico. Las pestañas que más pedidos consumen son Marte (2 pedidos si filtras por cámara) y Asteroides (1 pedido). La pestaña Tierra usa la API de EPIC directamente y **no** consume tu cuota de `DEMO_KEY`; Lanzamientos tampoco (usa Launch Library 2, ver más abajo).

Para tu propia key gratis (toma 30 segundos, solo piden nombre y correo):

1. Ve a https://api.nasa.gov/
2. Llena el formulario, te llega la key al correo al instante.
3. En `script.js`, reemplaza:
   ```js
   const NASA_API_KEY = "DEMO_KEY";
   ```
   por:
   ```js
   const NASA_API_KEY = "TU_KEY_AQUI";
   ```

## Sobre la API de lanzamientos (y por qué cambiamos de proveedor)

La primera versión de este proyecto usaba la API pública de SpaceX (`api.spacexdata.com`). **Esa API dejó de funcionar en 2026** (el proyecto se archivó) — así que la pestaña de Lanzamientos ahora usa **[Launch Library 2](https://thespacedevs.com/llapi)**, mantenida por *The Space Devs*, que sigue activa y no requiere registro.

Es un buen ejemplo real de algo que te vas a encontrar seguido como desarrollador: **las APIs gratuitas de terceros a veces se caen o desaparecen**, sobre todo las mantenidas por voluntarios. Por eso conviene:
- Manejar bien los errores (`try/catch`), como ya hace este proyecto en cada pestaña.
- Saber leer el mensaje de error para diagnosticar si es tu código o el servicio externo.
- Tener en mente una alternativa si la API principal falla.

Launch Library 2 tiene un límite de **15 pedidos por hora sin registrarte** (compartido por IP, no es una key personal como la de la NASA). Si ves un error de "límite alcanzado", espera unos minutos.

## Estructura del proyecto

```
explorador-espacial/
├── index.html    → estructura de la página (menú desplegable + 8 secciones)
├── style.css     → estilos (tema oscuro espacial)
├── script.js     → lógica: menú, fetch a las APIs, favoritos, mapa y tabla de asteroides (SVG), lanzamientos, posición de la ISS para el globo
├── globe.js      → lógica del globo 3D interactivo (Inicio): rotación, países, sombra de noche
├── satellites.js → lógica de la pestaña "Satélites": TLE de CelesTrak + cálculo de órbita real (SGP4) con satellite.js
└── README.md     → este archivo
```

### Sobre el globo (`globe.js`)

Usa una librería llamada [globe.gl](https://globe.gl/) (basada en Three.js/WebGL), que se carga desde internet mediante un CDN — no necesitas instalar nada. El mapa de países viene de un dataset público (Natural Earth) y el sombreado de noche se calcula con la librería `solar-calculator`, ubicando en qué parte del planeta el sol no está iluminando en este momento.

Si en algún momento quieres profundizar en esto, la [documentación de globe.gl](https://github.com/vasturiano/globe.gl) tiene muchos más ejemplos (calor por país, rutas de vuelo, anillos de eventos, etc.) que se pueden agregar de la misma forma.

### Sobre los satélites (`satellites.js`)

Antes esta pestaña era una transmisión de video en vivo de YouTube, pero dependía de que NASA estuviera transmitiendo justo en ese momento bajo un canal específico — si no, YouTube mostraba un error feo en vez de un aviso. Se reemplazó por algo más robusto y más educativo: calcular la posición real de varios satélites nosotros mismos, en el navegador.

El proceso, resumido:

1. Cada satélite tiene un **número NORAD** (su identificador único en órbita, por ejemplo la ISS es el 25544).
2. Le pedimos a [CelesTrak](https://celestrak.org/) sus **TLE** ("Two-Line Elements"): dos líneas de números que describen matemáticamente su órbita en un instante dado. Es información pública que se actualiza todos los días.
3. Le pasamos ese TLE a la librería [satellite.js](https://github.com/shashwatak/satellite-js), que implementa el modelo **SGP4** — el mismo algoritmo estándar que usan agencias espaciales reales para predecir dónde va a estar un objeto en órbita.
4. Repetimos el cálculo cada 2 segundos (sin volver a pedirle nada a CelesTrak) para que el punto se mueva solo en el mapa.

El mapa es una imagen del planeta (la misma textura que usa el globo 3D) con un punto posicionado por CSS según la latitud/longitud calculada — una técnica simple y sin librerías de mapas.

⚠️ Si CelesTrak no responde o el navegador bloquea la consulta (por ejemplo, por una extensión de bloqueo de anuncios agresiva), la pestaña te lo va a decir explícitamente en vez de quedarse cargando para siempre.

---

## Cómo subirlo a GitHub

Hay dos formas. Si nunca has usado GitHub, empieza por la Opción A (sin usar la terminal).

> 💡 **Esto es lo que resuelve el problema de "tener que abrir la terminal cada vez"**: una vez que el proyecto esté en GitHub y actives GitHub Pages (ver más abajo), te queda una URL pública fija. Desde ese momento entras directo a esa URL desde cualquier navegador o dispositivo — nunca más necesitas correr `python -m http.server` ni pelear con PowerShell.

### Opción A: Subida directa desde el navegador (sin git)

1. Crea una cuenta en [github.com](https://github.com) si no tienes.
2. Arriba a la derecha, haz clic en el **+** → **New repository**.
3. Ponle un nombre, por ejemplo `explorador-espacial`. Déjalo en **Public**. No marques "Add a README" (ya tienes uno). Clic en **Create repository**.
4. En la página del repo recién creado, busca el link que dice **"uploading an existing file"**.
5. Arrastra los 6 archivos (`index.html`, `style.css`, `script.js`, `globe.js`, `satellites.js`, `README.md`) a esa zona.
6. Abajo escribe un mensaje como "Primera versión del proyecto" y clic en **Commit changes**.

### Opción B: Usando git desde la terminal (recomendado para practicar, así lo vas a usar en el resto de tu carrera)

1. Instala git si no lo tienes: https://git-scm.com/downloads
2. Crea el repo vacío en GitHub igual que en los pasos 1-3 de la Opción A (sin README).
3. Abre una terminal dentro de la carpeta `explorador-espacial` y corre:

   ```bash
   git init
   git add .
   git commit -m "Primera versión del proyecto"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/explorador-espacial.git
   git push -u origin main
   ```

   (Reemplaza `TU-USUARIO` por tu nombre de usuario de GitHub. La primera vez te va a pedir iniciar sesión.)

4. Para futuras actualizaciones, solo necesitas repetir:

   ```bash
   git add .
   git commit -m "Descripción de lo que cambiaste"
   git push
   ```

### Publicarlo como página web gratis (GitHub Pages)

Una vez que el código esté en GitHub (con cualquiera de las dos opciones):

1. En tu repo, ve a **Settings** (pestaña arriba).
2. En el menú de la izquierda, clic en **Pages**.
3. En "Branch", selecciona `main` y la carpeta `/ (root)`. Clic en **Save**.
4. Espera 1-2 minutos y recarga la página. Te va a aparecer una URL tipo:
   `https://tu-usuario.github.io/explorador-espacial/`
5. ¡Esa es tu página pública! Puedes ponerla en tu CV, LinkedIn o portafolio.

Cada vez que hagas `git push` con cambios nuevos, GitHub Pages se actualiza solo después de un par de minutos.

## Notas de esta versión

- **Los asteroides no se veían en el mapa**: el bug estaba en cómo se dibujaba el SVG (se armaba como texto HTML con `innerHTML`, y algunos navegadores no crean bien esos elementos así). Se reescribió usando `document.createElementNS`, la forma "correcta" de crear elementos SVG por JavaScript — más código, pero sin ese problema. Si el mapa alguna vez aparece sin ningún punto, ahora también te avisa con un texto ("No hay asteroides catalogados para hoy...") para que sepas si es que de verdad no hay datos ese día, o si el problema es otro (por ejemplo, el límite de la `DEMO_KEY`, que ahora también se detecta y avisa específicamente en todas las pestañas que usan la key de la NASA).
- **Menú a la derecha**: se movió el botón de navegación a la esquina superior derecha.
- **Se quitó la pestaña de video (Cámara ISS)**: dependía de que YouTube tuviera una transmisión activa justo en ese momento bajo un canal específico, y cuando no la tenía mostraba un error feo en vez de un aviso amigable. Se reemplazó por la pestaña **Satélites**, que calcula posiciones reales con datos orbitales (TLE + SGP4) en vez de depender de un video — ver la sección "Sobre los satélites" más arriba.
- **Asteroides ampliado**: ahora se pueden ver los próximos 7 días (no solo hoy), el tamaño de cada punto refleja el diámetro real del asteroide, y hay una tabla ordenable debajo del mapa con todos los datos (distancia, diámetro, velocidad, riesgo).

## Ideas para seguir practicando (si quieres seguir ampliándolo)

- Buscador de país por nombre en el globo (que centre la cámara ahí directamente).
- Agregar más satélites al selector de la pestaña Satélites (CelesTrak tiene miles, agrupados por categoría — por ejemplo el grupo `starlink` o `gnss`).
- Agregar Júpiter y Saturno al mapa del sistema solar (con otra escala, porque están mucho más lejos).
- Mostrar el "manifiesto" de misión de cada rover (total de fotos, sols activos, estado).
- Buscador libre en la librería de imágenes de la NASA (`images-api.nasa.gov`) por palabra clave.
- Exportar/importar tus favoritos como archivo `.json`, para no perderlos si cambias de navegador.
- Botón de compartir (WhatsApp/Twitter o copiar link) para una foto favorita.
- Migrar a React más adelante y comparar cómo se organiza el mismo proyecto con componentes.

## Créditos de datos

- [NASA Open APIs](https://api.nasa.gov/)
- [Launch Library 2 — The Space Devs](https://thespacedevs.com/llapi)
- [wheretheiss.at](https://wheretheiss.at/) (posición de la ISS para el globo de Inicio)
- [CelesTrak](https://celestrak.org/) (datos orbitales/TLE) y [satellite.js](https://github.com/shashwatak/satellite-js) (cálculo de órbitas con SGP4)
- [globe.gl](https://globe.gl/) (globo 3D) y [dataset de países de Natural Earth](https://github.com/vasturiano/globe.gl/blob/master/example/datasets/ne_110m_admin_0_countries.geojson)
