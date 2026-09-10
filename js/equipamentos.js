document.addEventListener("click", e => {
  const b = e.target.closest(".filter-btn[data-filter]");

  if (!b) return;

  document
    .querySelectorAll("#page-equipment .filter-btn")
    .forEach(x => x.classList.remove("active"));

  b.classList.add("active");

  const filtro = b.dataset.filter;

  document
    .querySelectorAll("#equipment-list .equipment-card")
    .forEach(card => {
      if (filtro === "Todos" || card.dataset.category === filtro) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
});