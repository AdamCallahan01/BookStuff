(function () {
  const PAGE_SIZE = 40;

  const list = document.getElementById("rank-list");
  const searchInput = document.getElementById("rank-search");
  const formatSelect = document.getElementById("rank-filter-format");
  const typeSelect = document.getElementById("rank-filter-type");
  const countEl = document.getElementById("rank-count");
  const emptyEl = document.getElementById("rank-empty");
  const sentinel = document.getElementById("rank-sentinel");
  const template = document.getElementById("rank-item-template");

  let allItems = [];
  let filtered = [];
  let rendered = 0;

  fetch(list.dataset.src)
    .then((res) => res.json())
    .then((data) => {
      allItems = data.map((item) => ({
        ...item,
        _search: [item.title, item.author, item.series].filter(Boolean).join(" ").toLowerCase(),
      }));
      populateFilters(allItems);
      applyFilters();
    })
    .catch((err) => {
      list.innerHTML = "<li>Could not load the inventory. Please try again later.</li>";
      console.error(err);
    });

  function populateFilters(items) {
    const formats = new Set();
    const types = new Set();
    items.forEach((i) => {
      if (i.format) formats.add(i.format);
      if (i.type) types.add(i.type);
    });
    [...formats].sort().forEach((f) => formatSelect.add(new Option(f, f)));
    [...types].sort().forEach((t) => typeSelect.add(new Option(t, t)));
  }

  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    const format = formatSelect.value;
    const type = typeSelect.value;

    filtered = allItems.filter((item) => {
      if (format && item.format !== format) return false;
      if (type && item.type !== type) return false;
      if (term && !item._search.includes(term)) return false;
      return true;
    });

    rendered = 0;
    list.textContent = "";
    countEl.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
    emptyEl.hidden = filtered.length !== 0;
    renderNextPage();
  }

  function renderNextPage() {
    const batch = filtered.slice(rendered, rendered + PAGE_SIZE);
    const frag = document.createDocumentFragment();

    batch.forEach((item) => {
      const node = template.content.cloneNode(true);

      const img = node.querySelector(".book-cover-list");
      if (item.coverSlug) {
        img.src = `/files/covers/${item.coverSlug}.jpg`;
        img.alt = `${item.title} cover`;
      } else {
        img.remove();
      }

      const titleEl = node.querySelector(".rank-title");
      if (item.url) {
        const a = document.createElement("a");
        a.href = item.url;
        a.textContent = item.title;
        titleEl.appendChild(a);
      } else {
        titleEl.textContent = item.title;
      }

      const metaParts = [item.series, item.seriesNumber ? `#${item.seriesNumber}` : null].filter(Boolean).join(" ");
      node.querySelector(".rank-meta").textContent = [metaParts, item.author].filter(Boolean).join(" — ");

      const extraParts = [item.format, item.type, item.pages ? `${item.pages} pages` : null].filter(Boolean);
      node.querySelector(".rank-extra").textContent = extraParts.join(" · ");

      frag.appendChild(node);
    });

    list.appendChild(frag);
    rendered += batch.length;
  }

  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 200);
  });
  formatSelect.addEventListener("change", applyFilters);
  typeSelect.addEventListener("change", applyFilters);

  new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && rendered < filtered.length) renderNextPage();
    },
    { rootMargin: "400px" },
  ).observe(sentinel);
})();
