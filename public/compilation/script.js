(function () {
  "use strict";

  const gridEl = document.getElementById("grid");
  const totalCountEl = document.getElementById("totalCount");

  const totalEntries = COLLECTIONS.reduce((sum, c) => sum + c.count, 0);
  totalCountEl.textContent = `${COLLECTIONS.length} collections · ${totalEntries} cases and tests so far`;

  gridEl.innerHTML = "";
  COLLECTIONS.forEach((c) => {
    const a = document.createElement("a");
    a.className = "card";
    a.href = c.href;
    a.style.setProperty("--accent", c.color);
    a.innerHTML = `
      <span class="card-domain">${c.domain}</span>
      <h2>${c.title}</h2>
      <p class="card-count">${c.count} ${c.unit}</p>
      <p class="card-teaser">${c.teaser}</p>
      <span class="card-arrow" aria-hidden="true">&rarr;</span>
    `;
    gridEl.appendChild(a);
  });
})();
