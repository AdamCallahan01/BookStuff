// ─── 1. Parse JSON data island ───────────────────────────────────────────────

const rawData = JSON.parse(document.getElementById("bookData").textContent);

const formatIcons = {
  audible: "🎧",
  book: "📖",
  online: "🌐",
  kindle: "📱",
};

// ─── 2. Build data index from JSON ───────────────────────────────────────────

const dataIndex = [...rawData.books, ...rawData.reads, ...rawData.series, ...rawData.authors].map((item) => {
  const score = parseFloat(item.score || item.averageScore || 0);
  const hasScore = item.hasScore !== false && item.hasScore !== "false";
  const hasSummary = item.hasSummary === true || item.hasSummary === "true";
  const hasReview = item.hasReview === true || item.hasReview === "true";
  const isOwned = item.bookOwned === true || item.bookOwned === "true";

  let timestamp = null;
  if (item.dateFinished) {
    const [month, day, year] = item.dateFinished.split("/").map(Number);
    timestamp = new Date(year, month - 1, day).getTime();
  }

  const yearRead = Number(item.yearRead) || 0;

  return {
    // Keep all original fields for rendering
    ...item,
    // Normalise keys to lowercase to match original data-* behaviour
    title: (item.title || item.name || "").toLowerCase(),
    author: (item.author || "").toLowerCase(),
    series: (item.series || "").toLowerCase(),
    otherseries: (item.otherSeries || "").toLowerCase(),
    genre: (item.genre || "").toLowerCase(),
    subgenre: (item.subgenre || "").toLowerCase(),
    publisher: (item.publisher || "").toLowerCase(),
    format: (item.format || "").toLowerCase(),
    avggoodreadsrating: item.avgGoodreadsRating || 0,
    numgoodreadsratings: item.numGoodreadsRatings || 0,
    yearpublished: item.yearPublished || 0,
    yearread: String(item.yearRead || ""),
    seriesnumber: Number(item.seriesNumber) || 0,
    // Computed fields
    _score: isNaN(score) ? 0 : score,
    _hasScore: hasScore,
    _hasSummary: hasSummary,
    _hasReview: hasReview,
    _isOwned: isOwned,
    _timestampSort: timestamp ?? (yearRead ? new Date(yearRead, 0, 1).getTime() : 0),
    // Keep numeric versions for sliders/sort
    pages: Number(item.pages) || 0,
    count: Number(item.count) || 0,
    seriesNumber: Number(item.seriesNumber) || 0,
    averagescore: Number(item.averageScore) || 0,
    latestscore: Number(item.latestScore) || 0,
    days: Number(item.days) || 0,
    // Build the DOM element lazily (cached after first render)
    _el: null,
  };
});

// ─── 3. Card rendering ───────────────────────────────────────────────────────

const coverMeta = JSON.parse(document.getElementById("coverMetaData").textContent);

function coverImg(slug, title, extraClass = "") {
  if (!slug) return "";

  const meta = coverMeta[slug] || { small: 200, large: 400 };
  const s = meta.small;
  const l = meta.large;

  return `<picture>
    <source type="image/avif" srcset="/files/covers/optimized/${slug}-${s}.avif ${s}w, /files/covers/optimized/${slug}-${l}.avif ${l}w" sizes="200px">
    <source type="image/webp" srcset="/files/covers/optimized/${slug}-${s}.webp ${s}w, /files/covers/optimized/${slug}-${l}.webp ${l}w" sizes="200px">
    <img
      src="/files/covers/optimized/${slug}-${s}.jpeg"
      alt="${title} cover"
      loading="lazy"
      decoding="async"
      class="book-cover${extraClass ? " " + extraClass : ""}"
    >
  </picture>`;
}

function mosaicHTML(covers, altPrefix) {
  const n = Math.min(covers.length, 4);
  if (n === 0) return "";

  if (n === 1) {
    return `<div class="mosaic mosaic-1">${coverImg(covers[0], altPrefix + " 1")}</div>`;
  }
  if (n === 2) {
    return `<div class="mosaic mosaic-2">
      ${coverImg(covers[0], altPrefix + " 1")}
      ${coverImg(covers[1], altPrefix + " 2")}
    </div>`;
  }
  if (n === 3) {
    return `<div class="mosaic mosaic-3">
      <div class="mosaic-left">${coverImg(covers[0], altPrefix + " 1")}</div>
      <div class="mosaic-right">
        ${coverImg(covers[1], altPrefix + " 2")}
        ${coverImg(covers[2], altPrefix + " 3")}
      </div>
    </div>`;
  }
  // n === 4
  return `<div class="mosaic mosaic-4">
    ${coverImg(covers[0], altPrefix + " 1")}
    ${coverImg(covers[1], altPrefix + " 2")}
    ${coverImg(covers[2], altPrefix + " 3")}
    ${coverImg(covers[3], altPrefix + " 4")}
  </div>`;
}

function createCard(item) {
  // Cache the element so we don't recreate it on every render
  if (item._el) return item._el;

  const a = document.createElement("a");
  a.href = item.url;
  a.className = "card book-card";

  let imageHTML = "";
  let overlayHTML = "";
  let titleText = "";
  let subtitleText = "";

  if (item.type === "book") {
    imageHTML = item.coverSlug ? coverImg(item.coverSlug, item.title) : "";
    overlayHTML = `⭐ ${item._hasScore ? item.averagescore : "N/A"} | 📖 ${item.count || 0}`;
    titleText = item.title;
    subtitleText = item.author;
  } else if (item.type === "read") {
    imageHTML = item.coverSlug ? coverImg(item.coverSlug, item.title) : "";
    const icon = formatIcons[item.format] || "❓";
    overlayHTML = `⭐ ${item._hasScore ? item.averagescore : "N/A"} | 📅 ${item.dateFinished} | ${icon}`;
    titleText = item.title;
    subtitleText = item.author;
  } else if (item.type === "series") {
    imageHTML = mosaicHTML(item.covers || [], item.name);
    overlayHTML = `⭐ ${item.averagescore || "N/A"} | 📅 ${item.count}`;
    titleText = item.name;
    subtitleText = item.author;
  } else if (item.type === "author") {
    imageHTML = mosaicHTML(item.covers || [], item.name);
    overlayHTML = `⭐ ${item.averagescore || "N/A"} | 📅 ${item.count}`;
    titleText = item.name;
    subtitleText = "";
  }

  a.innerHTML = `
    ${imageHTML}
    <div class="overlay">${overlayHTML}</div>
    <h3 class="book-title">${titleText}</h3>
    ${subtitleText ? `<p class="book-author">${subtitleText}</p>` : ""}
  `;

  item._el = a;
  return a;
}

// ─── 4. Filter config (unchanged from original) ───────────────────────────────

const filterConfig = {
  view: {
    element: "combineToggle",
    state: "view",
    default: "book",
    control: "primary",
    sidebar: null,
    filter: (item, value) => value === item.type,
  },

  search: {
    element: "booksSearchInput",
    state: "search",
    default: "",
    control: "text",
    sidebar: null,
    filter: (item, value) => {
      if (!value) return true;
      const search = value.toLowerCase();
      const fields = [];
      if (state.searchTitle) fields.push(item.title || "");
      if (state.searchAuthor) fields.push(item.author || "");
      if (state.searchSeries) fields.push(item.series || "");
      if (fields.length === 0) return false;
      return fields.join(" ").toLowerCase().includes(search);
    },
  },

  searchTitle: {
    element: "booksSearchTitle",
    state: "searchTitle",
    type: "checkbox",
    default: true,
    control: "checkbox",
    sidebar: null,
  },

  searchAuthor: {
    element: "booksSearchAuthor",
    state: "searchAuthor",
    type: "checkbox",
    default: true,
    control: "checkbox",
    sidebar: null,
  },

  searchSeries: {
    element: "booksSearchSeries",
    state: "searchSeries",
    type: "checkbox",
    default: true,
    control: "checkbox",
    sidebar: null,
  },

  mustHaveScore: {
    element: "hasScoreToggle",
    state: "mustHaveScore",
    type: "checkbox",
    default: false,
    control: "checkbox",
    sidebar: ["book", "read", "series", "author"],
    filter: (item, value) => (!value ? true : item._hasScore),
  },

  mustHaveSummary: {
    element: "hasSummaryToggle",
    state: "hasSummary",
    type: "checkbox",
    default: false,
    control: "checkbox",
    sidebar: ["book", "read"],
    filter: (item, value) => (!value ? true : item._hasSummary),
  },

  mustHaveReview: {
    element: "hasReviewToggle",
    state: "hasReview",
    type: "checkbox",
    default: false,
    control: "checkbox",
    sidebar: ["read"],
    filter: (item, value) => (!value ? true : item._hasReview),
  },

  mustBeOwned: {
    element: "isOwnedToggle",
    state: "isOwned",
    type: "checkbox",
    default: false,
    control: "checkbox",
    sidebar: ["book", "read"],
    filter: (item, value) => (!value ? true : item._isOwned),
  },

  author: {
    element: "authorFilter",
    state: "author",
    default: "",
    control: "select",
    dataKey: "author",
    sidebar: null,
    filter: (item, value) => !value || item.author === value,
  },

  series: {
    element: "seriesFilter",
    state: "series",
    default: "",
    control: "select",
    dataKey: ["series", "otherseries"],
    sidebar: null,
    filter: (item, value) => !value || item.series === value || item.otherseries === value,
  },

  genre: {
    element: "genreFilter",
    state: "genre",
    default: "",
    control: "select",
    dataKey: ["genre", "subgenre"],
    sidebar: null,
    filter: (item, value) => !value || item.genre === value || item.subgenre === value,
  },

  yearRead: {
    element: "yearReadFilter",
    state: "yearRead",
    default: "",
    control: "select",
    dataKey: "yearread",
    sidebar: ["read"],
    filter: (item, value) => !value || item.yearread === value,
  },

  format: {
    element: "formatFilter",
    state: "format",
    default: "",
    control: "select",
    dataKey: "format",
    sidebar: ["read"],
    filter: (item, value) => !value || item.format === value,
  },

  scoreRange: {
    element: "scoreSlider",
    label: "scoreLabel",
    control: "slider",
    stateMin: "minScore",
    stateMax: "maxScore",
    field: "score",
    defaultMin: 0,
    defaultMax: 10,
    sidebar: ["read", "book", "author", "series"],
    filter: (item, min, max) => item._score >= min && item._score <= max,
  },

  pageCount: {
    element: "pageSlider",
    label: "pageLabel",
    control: "slider",
    stateMin: "minPages",
    stateMax: "maxPages",
    field: "pages",
    defaultMin: 0,
    defaultMax: null,
    sidebar: ["book", "read", "series", "author"],
    filter: (item, min, max) => item.pages >= min && item.pages <= max,
  },

  itemCount: {
    element: "countSlider",
    label: "countLabel",
    control: "slider",
    stateMin: "minCount",
    stateMax: "maxCount",
    field: "count",
    defaultMin: 0,
    defaultMax: null,
    sidebar: ["book", "author", "series"],
    filter: (item, min, max) => item.count >= min && item.count <= max,
  },

  sort: {
    element: "sortField",
    state: "sortField",
    default: "title",
    control: "select",
    sidebar: null,
  },

  dir: {
    element: "sortDirection",
    state: "sortDir",
    default: "asc",
    control: "select",
    sidebar: null,
  },
};

const state = Object.fromEntries(Object.values(filterConfig).map((cfg) => [cfg.state, cfg.default]));

// ─── 5. Sort config (unchanged) ───────────────────────────────────────────────

const sortConfig = {
  title: { key: "title", type: "string", label: "Title", views: ["book", "read", "series", "author"] },
  author: { key: "author", type: "string", label: "Author", views: ["book", "read", "series", "author"] },
  score: { key: "_score", type: "number", label: "Score", views: ["read"] },
  averagescore: { key: "averagescore", type: "number", label: "Average Score", views: ["book", "series", "author"] },
  series: { key: "series", type: "series", label: "Series", views: ["book", "read"] },
  dateFinished: { key: "dateFinished", type: "date", label: "Date Finished", views: ["read"] },
  count: { key: "count", type: "number", label: "Count", views: ["book", "series", "author"] },
  pages: { key: "pages", type: "number", label: "Pages", views: ["book", "read", "series", "author"] },
  days: { key: "days", type: "number", label: "Days to read", views: ["read"] },
  yearPublished: { key: "yearpublished", type: "number", label: "Year Published", views: ["book", "read"] },
  goodreadsScore: {
    key: "avggoodreadsrating",
    type: "number",
    label: "Average Goodreads Rating",
    views: ["book", "read"],
  },
  goodreadsNumber: {
    key: "numgoodreadsratings",
    type: "number",
    label: "Number of Goodreads Ratings",
    views: ["book", "read"],
  },
};

function buildComparator({ key, type }) {
  if (type === "string") return (a, b) => (a[key] || "").localeCompare(b[key] || "");
  if (type === "series") {
    return (a, b) => {
      const s = (a.series || "").localeCompare(b.series || "");
      if (s !== 0) return s;
      return a.seriesNumber - b.seriesNumber;
    };
  }
  if (type === "date") return (a, b) => a._timestampSort - b._timestampSort;
  return (a, b) => (a[key] || 0) - (b[key] || 0);
}

function getAvailableSortOptions() {
  return Object.entries(sortConfig).filter(([_, cfg]) => !cfg.views || cfg.views.includes(state.view));
}

const defaultSortByView = {
  book: "title",
  read: "dateFinished",
  author: "author",
  series: "title",
};

// ─── 6. Element map ───────────────────────────────────────────────────────────

const elementMap = {};

for (const key in filterConfig) {
  const elId = filterConfig[key].element;
  const labelID = filterConfig[key].label;
  if (labelID) elementMap[labelID] = document.getElementById(labelID);
  if (elId) {
    elementMap[elId] = document.getElementById(elId);
    elementMap[elId + "Parent"] = document.getElementById(elId + "Parent");
  }
}

elementMap["bookNumberLabel"] = document.getElementById("bookNumberLabel");
elementMap["pageCountLabel"] = document.getElementById("pageCountLabel");
elementMap["pageAverageLabel"] = document.getElementById("pageAverageLabel");
elementMap["scoreAverageLabel"] = document.getElementById("scoreAverageLabel");
elementMap["pageTitle"] = document.getElementById("pageTitle");

// ─── 7. Populate dropdowns ────────────────────────────────────────────────────

const populateSelect = (data, keys, selectEl) => {
  const values = (Array.isArray(keys) ? keys : [keys]).flatMap((key) => data.map((item) => item[key])).filter(Boolean);
  [...new Set(values)].sort().forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    selectEl.appendChild(opt);
  });
};

Object.values(filterConfig)
  .filter((cfg) => cfg.dataKey)
  .forEach((cfg) => {
    const el = document.getElementById(cfg.element);
    if (el) populateSelect(dataIndex, cfg.dataKey, el);
  });

// ─── 8. Sliders ───────────────────────────────────────────────────────────────

const boundsByView = {
  book: computeBoundsForView("book"),
  read: computeBoundsForView("read"),
  series: computeBoundsForView("series"),
  author: computeBoundsForView("author"),
};

function computeBoundsForView(view) {
  const items = dataIndex.filter((item) => item.type === view);
  let maxPages = 0;
  let maxCount = 0;
  for (const item of items) {
    maxPages = Math.max(maxPages, item.pages || 0);
    maxCount = Math.max(maxCount, item.count || 0);
  }
  return {
    score: { min: 0, max: 10 },
    pages: { min: 0, max: maxPages },
    count: { min: 0, max: maxCount },
  };
}

function updateSliderRange() {
  for (const cfg of Object.values(filterConfig)) {
    if (cfg.control !== "slider") continue;
    const slider = elementMap[cfg.element];
    if (!slider) continue;
    slider.noUiSlider.updateOptions({ range: { min: cfg.defaultMin, max: cfg.defaultMax } });
    slider.noUiSlider.set([cfg.defaultMin, cfg.defaultMax]);
    const label = elementMap[cfg.label];
    if (label) label.textContent = `${cfg.defaultMin} – ${cfg.defaultMax}`;
  }
}

function initializeSliderConfig(bounds) {
  for (const cfg of Object.values(filterConfig)) {
    if (cfg.control !== "slider") continue;
    const b = bounds[cfg.field];
    cfg.defaultMin = b.min;
    cfg.defaultMax = b.max;
    state[cfg.stateMin] = b.min;
    state[cfg.stateMax] = b.max;
  }
}

// ─── 9. View / sidebar / sort ─────────────────────────────────────────────────

function handleViewChange() {
  const bounds = boundsByView[state.view];
  initializeSliderConfig(bounds);
  updateSliderRange();
  resetSidebar();
  updateSortOptions();
  updateStateAndRender();
}

function resetFilters() {
  Object.values(filterConfig).forEach((cfg) => {
    state[cfg.state] = cfg.default;
  });
  handleViewChange();
}

function setControlsFromState() {
  for (const cfg of Object.values(filterConfig)) {
    const { element, state: stateKey, control } = cfg;
    if (!element) continue;
    const el = elementMap[element];
    if (!el) continue;
    const value = state[stateKey];

    switch (control) {
      case "text":
      case "select":
      case "primary":
        if (el.value !== value) el.value = value;
        break;
      case "checkbox":
        if (el.checked !== value) el.checked = value;
        break;
      case "number":
        if (Number(el.value) !== value) el.value = value;
        break;
      case "slider": {
        const slider = el.noUiSlider;
        if (!slider) break;
        const current = slider.get().map((v) => Math.round(v));
        if (current[0] !== state[cfg.stateMin] || current[1] !== state[cfg.stateMax]) {
          slider.set([state[cfg.stateMin], state[cfg.stateMax]]);
          const label = elementMap[cfg.label];
          if (label) label.textContent = `${state[cfg.stateMin]} – ${state[cfg.stateMax]}`;
        }
        break;
      }
    }
  }
}

function bindControls() {
  const bounds = boundsByView[state.view];
  initializeSliderConfig(bounds);

  const grid = document.getElementById("booksView");
  grid.classList.add("show");

  // Reset button
  document.getElementById("filterResetButton")?.addEventListener("click", resetFilters);

  for (const cfg of Object.values(filterConfig)) {
    const { element, state: stateKey, control } = cfg;
    if (!element) continue;
    const el = document.getElementById(element);
    if (!el) continue;

    switch (control) {
      case "primary":
        el.addEventListener("change", () => {
          state[stateKey] = el.value;
          handleViewChange();
        });
        break;
      case "text":
        el.addEventListener("input", () => {
          state[stateKey] = el.value;
          updateStateAndRender();
        });
        break;
      case "checkbox":
        el.addEventListener("change", () => {
          state[stateKey] = el.checked;
          updateStateAndRender();
        });
        break;
      case "select":
        el.addEventListener("change", () => {
          state[stateKey] = el.value;
          updateStateAndRender();
        });
        break;
      case "number":
        el.addEventListener("input", () => {
          state[stateKey] = Number(el.value);
          updateStateAndRender();
        });
        break;
      case "slider": {
        const slider = document.getElementById(cfg.element);
        const label = elementMap[cfg.label];
        if (label) label.textContent = `${cfg.defaultMin} – ${cfg.defaultMax}`;

        noUiSlider.create(slider, {
          start: [state[cfg.stateMin], state[cfg.stateMax]],
          connect: true,
          step: 1,
          range: { min: cfg.defaultMin, max: cfg.defaultMax },
        });

        let updateMethod = cfg.field === "pages" ? "change" : "update";

        slider.noUiSlider.on(updateMethod, (values) => {
          const min = Math.round(values[0]);
          const max = Math.round(values[1]);
          if (state[cfg.stateMin] !== min || state[cfg.stateMax] !== max) {
            state[cfg.stateMin] = min;
            state[cfg.stateMax] = max;
            if (label) label.textContent = `${min} – ${max}`;
            updateStateAndRender();
          }
        });
        break;
      }
    }
  }
}

// ─── 10. Sidebar ──────────────────────────────────────────────────────────────

function resetSidebar() {
  resetSidebarState();
  updateSidebarVisibility(state.view);
}

function resetSidebarState() {
  for (const key in filterConfig) {
    const {
      state: stateKey,
      control: stateControl,
      stateMax,
      stateMin,
      defaultMax,
      defaultMin,
      default: defaultValue,
      sidebar,
    } = filterConfig[key];
    if (sidebar) {
      if (stateControl === "slider") {
        state[stateMax] = defaultMax;
        state[stateMin] = defaultMin;
      }
      state[stateKey] = defaultValue;
    }
  }
}

function updateSidebarVisibility(view) {
  for (const key in filterConfig) {
    const { sidebar, element } = filterConfig[key];
    if (!sidebar || !element) continue;
    let el = elementMap[`${element}Parent`];
    if (!el) el = elementMap[element];
    if (!el) continue;
    el.classList.toggle("hidden", !sidebar.includes(view));
  }
}

// ─── 11. Sort UI ──────────────────────────────────────────────────────────────

function updateSortOptions() {
  const select = elementMap["sortField"];
  if (!select) return;

  const options = getAvailableSortOptions();
  select.innerHTML = "";
  options.forEach(([key, cfg]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = cfg.label;
    select.appendChild(opt);
  });

  if (
    !sortConfig[state.sortField] ||
    (sortConfig[state.sortField].views && !sortConfig[state.sortField].views.includes(state.view))
  ) {
    state.sortField = defaultSortByView[state.view] || options[0][0];
  }

  select.value = state.sortField;
}

// ─── 12. Filter and render ────────────────────────────────────────────────────

function getActiveFilters() {
  const filters = [];
  for (const cfg of Object.values(filterConfig)) {
    if (!cfg.filter) continue;
    if (cfg.control === "slider") {
      const min = state[cfg.stateMin];
      const max = state[cfg.stateMax];
      filters.push((item) => cfg.filter(item, min, max));
    } else {
      const value = state[cfg.state];
      filters.push((item) => cfg.filter(item, value));
    }
  }
  return filters;
}

function sortItems(items) {
  const { sortField, sortDir } = state;
  const comparator = buildComparator(sortConfig[sortField]);
  if (!comparator) return items;
  const sorted = [...items].sort(comparator);
  return sortDir === "desc" ? sorted.reverse() : sorted;
}

function render() {
  const grid = document.querySelector(".book-grid");
  const activeFilters = getActiveFilters();
  const filtered = dataIndex.filter((item) => activeFilters.every((fn) => fn(item)));
  const sorted = sortItems(filtered);
  const visible = sorted.slice(0, 3000);

  grid.innerHTML = "";
  const fragment = document.createDocumentFragment();
  visible.forEach((item) => fragment.appendChild(createCard(item)));
  grid.appendChild(fragment);

  updateLabels(filtered);
}

// ─── 13. Labels ───────────────────────────────────────────────────────────────

function updateLabels(filtered) {
  let totalScore = 0;
  let pageCount = 0;
  for (const item of filtered) {
    totalScore += Number(item.averagescore) || 0;
    pageCount += Number(item.pages) || 0;
  }

  if (elementMap["bookNumberLabel"]) elementMap["bookNumberLabel"].textContent = filtered.length;
  if (elementMap["pageCountLabel"]) elementMap["pageCountLabel"].textContent = pageCount;
  if (elementMap["pageAverageLabel"])
    elementMap["pageAverageLabel"].textContent = filtered.length ? (pageCount / filtered.length).toFixed(2) : "0";
  if (elementMap["scoreAverageLabel"])
    elementMap["scoreAverageLabel"].textContent = filtered.length ? (totalScore / filtered.length).toFixed(2) : "0";

  updateTitle();
}

function updateTitle() {
  const series = elementMap["seriesFilter"]?.value;
  const sort = elementMap["sortField"]?.value;
  let title = "All Books";
  if (series) title = `Series: ${series}`;
  else if (sort === "averagescore") title = "Books by Average Score";
  else if (sort === "latestscore") title = "Books by Latest Score";
  if (elementMap["pageTitle"]) elementMap["pageTitle"].textContent = title;
}

// ─── 14. URL logic (unchanged) ────────────────────────────────────────────────

function updateURL() {
  const params = new URLSearchParams();
  for (const [param, cfg] of Object.entries(filterConfig)) {
    if (cfg.control === "slider") {
      const min = state[cfg.stateMin];
      const max = state[cfg.stateMax];
      if (min !== cfg.defaultMin) params.set(`${param}Min`, min);
      if (max !== cfg.defaultMax) params.set(`${param}Max`, max);
      continue;
    }
    const value = state[cfg.state];
    if (value === null || value === "" || value === cfg.default) continue;
    params.set(param, value);
  }
  history.replaceState(null, "", "?" + params.toString());
}

function setFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  for (const [param, cfg] of Object.entries(filterConfig)) {
    if (cfg.control === "slider") {
      const min = params.get(`${param}Min`);
      const max = params.get(`${param}Max`);
      state[cfg.stateMin] = min !== null ? Number(min) : cfg.defaultMin;
      state[cfg.stateMax] = max !== null ? Number(max) : cfg.defaultMax;
      continue;
    }
    let value = params.get(param);
    if (value == null) value = cfg.default;
    if (cfg.type === "number") value = Number(value);
    if (cfg.control === "checkbox") value = value === "true" || value === true;
    state[cfg.state] = value;
    if (cfg.control === "primary") handleViewChange();
  }
}

// ─── 15. Misc UI ──────────────────────────────────────────────────────────────

const btn = document.getElementById("scrollTopBtn");
window.addEventListener("scroll", () => btn.classList.toggle("show", window.scrollY > 200));
btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const toggle = document.querySelector(".mobile-filter-toggle");
const filters = document.querySelector(".filter-group");
toggle.addEventListener("click", () => {
  const open = filters.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open);
});

// ─── 16. Initialize ───────────────────────────────────────────────────────────

function updateStateAndRender() {
  setControlsFromState();
  render();
  updateURL();
}

function initialize() {
  updateSortOptions();
  updateSidebarVisibility(state.view);
  bindControls();
  setFiltersFromURL();
  updateStateAndRender();
}

initialize();
