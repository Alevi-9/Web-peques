// scripts/fetch_studies.js
import fetch from "node-fetch";
import fs from "fs";

// Función para obtener estudios reales desde PubMed
async function getStudies() {
  const url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=child+development+screen+time&retmax=5&retmode=json";

  const res = await fetch(url);
  const data = await res.json();

  const ids = data.esearchresult.idlist;

  const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
  const detailsRes = await fetch(detailsUrl);
  const details = await detailsRes.json();

  const studies = ids.map(id => {
    const s = details.result[id];
    return {
      title: s.title,
      year: s.pubdate,
      link: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
    };
  });

  return studies;
}

// Generar HTML dinámico
function generateHTML(studies) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Actualidad Infantil: Estudios y Ciencia</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <nav>
    <div class="nav-inner">
      <div class="brand">Actualidad Infantil</div>
      <div class="nav-links">
        <a href="#estudios">Estudios</a>
        <a href="#ciencia">Ciencia</a>
        <a href="#salud">Salud</a>
        <a href="#educacion">Educación</a>
        <a href="#identificate">Identifícate</a>
        <a href="#foro">Foro</a>
      </div>
    </div>
  </nav>

  <header class="hero">
    <h1>Actualidad Infantil: Estudios y Ciencia</h1>
    <p>Actualizado automáticamente cada día a las 08:00.</p>
  </header>

  <section id="estudios" class="section">
    <h2>Estudios Recientes</h2>
    <div class="grid">
      ${studies.map(s => `
        <div class="card fade-in">
          <h3>${s.title}</h3>
          <p>Año: ${s.year}</p>
          <a href="${s.link}" target="_blank">Ver estudio →</a>
        </div>
      `).join("")}
    </div>
  </section>

  <footer>
    © 2026 · Actualidad Infantil · Actualizado automáticamente
  </footer>

</body>
</html>
`;
}

// Ejecutar
getStudies().then(studies => {
  const html = generateHTML(studies);
  fs.writeFileSync("index.html", html);
  console.log("HTML actualizado con estudios reales.");
});
