// app.js
// Lógica de búsqueda y filtrado en cliente

function normalize(text) {
  return (text || "").toString().toLowerCase();
}

function applyFilters() {
  const search = normalize(document.getElementById("search-input").value);
  const category = document.getElementById("filter-category").value;
  const year = document.getElementById("filter-year").value;

  const cards = document.querySelectorAll(".study-card");
  const rows = document.querySelectorAll("#archive-table tbody tr");

  function match(el) {
    const elCategory = el.getAttribute("data-category") || "";
    const elYear = el.getAttribute("data-year") || "";
    const elTitle = el.getAttribute("data-title") || "";

    if (category && elCategory !== category) return false;
    if (year && elYear !== year) return false;
    if (search && !elTitle.includes(search)) return false;

    return true;
  }

  cards.forEach(card => {
    card.style.display = match(card) ? "" : "none";
  });

  rows.forEach(row => {
    row.style.display = match(row) ? "" : "none";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const filterCategory = document.getElementById("filter-category");
  const filterYear = document.getElementById("filter-year");

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (filterCategory) filterCategory.addEventListener("change", applyFilters);
  if (filterYear) filterYear.addEventListener("change", applyFilters);
});
