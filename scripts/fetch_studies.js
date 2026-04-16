const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const DATA_PATH = path.join(__dirname, "..", "data", "studies.json");
const OUTPUT_HTML = path.join(__dirname, "..", "index.html");

// ---------- Utilidades de fichero ----------

function loadStudies() {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error leyendo studies.json:", e);
    return [];
  }
}

function saveStudies(studies) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(studies, null, 2), "utf8");
}

// ---------- Clasificación por categorías ----------

function categorizeStudy(title) {
  const t = title.toLowerCase();

  if (t.match(/screen time|pantallas|digital media|smartphone|tablet|video game|social media/)) {
    return "Pantallas y tecnología";
  }
  if (t.match(/development|desarrollo|milestone|cognitive|motor skill|executive function/)) {
    return "Desarrollo infantil";
  }
  if (t.match(/anxiety|depression|salud mental|mental health|stress|behavior|conducta/)) {
    return "Salud mental y conducta";
  }
  if (t.match(/sleep|sueño|insomnia|circadian/)) {
    return "Sueño y descanso";
  }
  if (t.match(/diet|nutrition|nutrición|feeding|obesity|peso|alimentación/)) {
    return "Nutrición y alimentación";
  }
  if (t.match(/school|educación|learning|aprendizaje|academic/)) {
    return "Educación y aprendizaje";
  }
  if (t.match(/physical activity|actividad física|exercise|ejercicio|motor/)) {
    return "Actividad física y motricidad";
  }
  if (t.match(/language|lenguaje|communication|comunicación/)) {
    return "Lenguaje y comunicación";
  }
  if (t.match(/attachment|apego|bonding|vínculo/)) {
    return "Vínculo y apego";
  }
  if (t.match(/pregnancy|embarazo|perinatal|neonatal/)) {
    return "Embarazo y primera infancia";
  }
  if (t.match(/neurodevelopment|neurodesarrollo|autism|autismo|adhd/)) {
    return "Neurodesarrollo";
  }

  return "Otros";
}

// ---------- Traducción al español (título) ----------
// Usa un servicio público de ejemplo (LibreTranslate). Si falla, devuelve el original.

async function translateToSpanish(text) {
  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: "es",
        format: "text"
      })
    });

    if (!res.ok) {
      console.warn("Fallo en traducción, código:", res.status);
      return text;
    }

    const data = await res.json();
    return data.translatedText || text;
  } catch (e) {
    console.warn("Error traduciendo título:", e.message);
    return text;
  }
}

// ---------- Descarga de estudios desde PubMed ----------

async function fetchPubMedStudies() {
  const term = encodeURIComponent(
    "child OR children OR adolescent OR infancy OR development OR screen time OR mental health OR sleep OR nutrition"
  );

  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${term}&retmax=15&retmode=json`;

  const res = await fetch(searchUrl);
  const data = await res.json();

  const ids = data.esearchresult.idlist;
  if (!ids || ids.length === 0) return [];

  const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(
    ","
  )}&retmode=json`;

  const detailsRes = await fetch(detailsUrl);
  const details = await detailsRes.json();

  const studies = [];

  for (const id of ids) {
    const s = details.result[id];
    if (!s) continue;

    const title = s.title || "Título no disponible";
    const year = (s.pubdate || "").slice(0, 4) || "N/D";
    const lang = Array.isArray(s.lang) && s.lang.length > 0 ? s.lang[0] : "eng";

    studies.push({
      id,
      source: "PubMed",
      title,
      year,
      lang,
      link: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
    });
  }

  return studies;
}

// ---------- Generación de HTML ----------

function generateHTML(studies) {
  const sorted = [...studies].sort((a, b) => (b.year || "").localeCompare(a.year || ""));

  const recent = sorted.slice(0, 10);

  const categories = {};
  for (const s of sorted) {
    const cat = s.category || "Otros";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(s);
  }

  const categorySections = Object.keys(categories)
    .sort()
    .map(cat => {
      const cards = categories[cat]
        .map(
          s => `
        <article class="card study-card"
                 data-category="${cat}"
                 data-year="${s.year}"
                 data-title="${(s.title_es || s.title).toLowerCase()}">
          <h3>${s.title_es || s.title}</h3>
          ${
            s.lang === "eng"
              ? `<p class="original-title">Título original (inglés): ${s.title}</p>`
              : ""
          }
          <p class="meta">
            <span>${s.year}</span> · <span>${s.source}</span> · <span>${cat}</span>
          </p>
          <a href="${s.link}" target="_blank" rel="noopener">Ver estudio completo →</a>
        </article>
      `
        )
        .join("");

      return `
      <section class="section">
        <h2>${cat}</h2>
        <div class="grid">
          ${cards}
        </div>
      </section>
    `;
    })
    .join("");

  const archiveRows = sorted
    .map(
      s => `
      <tr data-category="${s.category}"
          data-year="${s.year}"
          data-title="${(s.title_es || s.title).toLowerCase()}">
        <td>${s.title_es || s.title}</td>
        <td>${s.year}</td>
        <td>${s.category}</td>
        <td>${s.source}</td>
        <td><a href="${s.link}" target="_blank" rel="noopener">Ver →</a></td>
      </tr>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Actualidad Infantil: Estudios y Ciencia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header class="hero">
    <div class="hero-content">
      <h1>Actualidad Infantil: Estudios y Ciencia</h1>
      <p>Resumen diario de estudios científicos sobre infancia, desarrollo, pantallas, salud mental, sueño, nutrición y más.</p>
      <p class="hero-note">Actualizado automáticamente cada día a las 08:00 (hora España).</p>
    </div>
  </header>

  <main>
    <section class="section">
      <h2>Estudios recientes</h2>
      <div class="grid">
        ${recent
          .map(
            s => `
          <article class="card study-card"
                   data-category="${s.category}"
                   data-year="${s.year}"
                   data-title="${(s.title_es || s.title).toLowerCase()}">
            <h3>${s.title_es || s.title}</h3>
            ${
              s.lang === "eng"
                ? `<p class="original-title">Título original (inglés): ${s.title}</p>`
                : ""
            }
            <p class="meta">
              <span>${s.year}</span> · <span>${s.source}</span> · <span>${s.category}</span>
            </p>
            <a href="${s.link}" target="_blank" rel="noopener">Ver estudio completo →</a>
          </article>
        `
          )
          .join("")}
      </div>
    </section>

    <section class="section section-filters">
      <h2>Buscar y filtrar estudios</h2>
      <div class="filters">
        <input type="text" id="search-input" placeholder="Buscar por título, palabra clave..." />
        <select id="filter-category">
          <option value="">Todas las categorías</option>
          ${Object.keys(categories)
            .sort()
            .map(cat => `<option value="${cat}">${cat}</option>`)
            .join("")}
        </select>
        <select id="filter-year">
          <option value="">Todos los años</option>
          ${Array.from(new Set(sorted.map(s => s.year)))
            .filter(y => y && y !== "N/D")
            .sort((a, b) => b.localeCompare(a))
            .map(y => `<option value="${y}">${y}</option>`)
            .join("")}
        </select>
      </div>
    </section>

    <section class="section">
      <h2>Estudios por temática</h2>
      ${categorySections}
    </section>

    <section class="section">
      <h2>Archivo completo de estudios</h2>
      <div class="table-wrapper">
        <table id="archive-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Año</th>
              <th>Categoría</th>
              <th>Fuente</th>
              <th>Enlace</th>
            </tr>
          </thead>
          <tbody>
            ${archiveRows}
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <footer class="footer">
    <p>Actualidad Infantil · Generado automáticamente a partir de fuentes científicas (principalmente PubMed).</p>
    <p>Los títulos en inglés se muestran con traducción automática aproximada al español.</p>
  </footer>

  <script src="app.js"></script>
</body>
</html>`;
}

// ---------- Flujo principal ----------

async function main() {
  console.log("Cargando historial de estudios...");
  const existing = loadStudies();
  const byId = new Map(existing.map(s => [s.id, s]));

  console.log("Descargando nuevos estudios desde PubMed...");
  const newStudies = await fetchPubMedStudies();

  for (const s of newStudies) {
    if (byId.has(s.id)) continue;

    const category = categorizeStudy(s.title);
    let title_es = s.title;

    if (s.lang === "eng") {
      console.log(`Traduciendo título: ${s.title}`);
      title_es = await translateToSpanish(s.title);
    }

    const fullStudy = {
      ...s,
      category,
      title_es
    };

    byId.set(s.id, fullStudy);
  }

  const allStudies = Array.from(byId.values());
  saveStudies(allStudies);

  console.log(`Total de estudios en historial: ${allStudies.length}`);

  const html = generateHTML(allStudies);
  fs.writeFileSync(OUTPUT_HTML, html, "utf8");

  console.log("index.html generado correctamente con secciones, filtros y traducciones.");
}

main().catch(err => {
  console.error("Error en fetch_studies.js:", err);
  process.exit(1);
});
