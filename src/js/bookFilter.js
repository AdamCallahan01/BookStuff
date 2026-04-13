// 1. Get grid of cards and make data index
const grid = document.querySelector(".book-grid");
const cards = Array.from(grid.children);

// Remove all from DOM
grid.innerHTML = "";

const dataIndex = cards.map((el) => {
  const data = el.dataset;

  const score = parseFloat(data.score || data.averagescore || 0);
  const hasScore = data.hasscore === "true";
  const hasSummary = data.hassummary === "true";
  const hasReview = data.hasreview === "true";
  const isOwned = data.owned === "true";

  let timestamp = null;

  if (data.datefinished) {
    const [month, day, year] = data.datefinished.split("/").map(Number);
    timestamp = new Date(year, month - 1, day).getTime();
  }

  const year = Number(data.yearread) || 0;

  return {
    el,
    ...data,
    _score: isNaN(score) ? 0 : score,
    _hasScore: Boolean(hasScore),
    _hasSummary: Boolean(hasSummary),
    _hasReview: Boolean(hasReview),
    _isOwned: Boolean(isOwned),
    _timestampSort: timestamp ?? (year ? new Date(year, 0, 1).getTime() : 0),
  };
});

// const dataIndex = cards.map((el) => {
//   const d = el.dataset;

//   return {
//     el,

//     type: d.type,
//     slug: d.slug,

//     title: d.title || "",
//     author: d.author || "",
//     series: d.series || "",

//     yearRead: Number(d.yearread) || 0,
//     format: d.format || "",

//     _score: parseFloat(d.score || d.averagescore || 0) || 0,

//     hasScore: d.hasscore === "true",
//     hasSummary: d.hassummary === "true",
//     hasReview: d.hasreview === "true",
//     owned: d.owned === "true",
//   };
// });

///////////////////////////////////////////////////////////////////////////
// 2. Establish filter config, this will create default state and save current filtering state
// Defaults:
//   view: "books",
//   search: "",
//   searchTitle: "true",
//   searchAuthor: "true",
//   searchFalse: "true",
//   author: "",
//   series: "",
//   minScore: 0,
//   maxScore: 10,
//   sortField: "title",
//   sortDir: "asc" //Ascending
//   //Num of reads Sliders
//   //Series order / number
//   //Score change read to read, scoore variance between books in series
//   //time reading
//   //length (pages)
//   //year released

const filterConfig = {
  view: {
    element: "combineToggle",
    state: "view",
    default: "book",
    control: "primary",
    sidebar: null,
    filter: (item, value) => {
      return value === item.type;
    },
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
    filter: (item, value) => {
      if (value) return item._hasScore;
      return true;
    },
  },

  mustHaveSummary: {
    element: "hasSummaryToggle",
    state: "hasSummary",
    type: "checkbox",
    default: false,
    control: "checkbox",
    sidebar: ["book", "read"],
    filter: (item, value) => {
      if (value) return item._hasSummary;
      return true;
    },
  },

  mustHaveReview: {
    element: "hasReviewToggle",
    state: "hasReview",
    type: "checkbox",
    default: false,
    control: "checkbox",
    sidebar: ["read"],
    filter: (item, value) => {
      if (value) return item._hasReview;
      return true;
    },
  },

  mustBeOwned: {
    element: "isOwnedToggle",
    state: "isOwned",
    type: "checkbox",
    default: false,
    control: "checkbox",
    sidebar: ["book", "read"],
    filter: (item, value) => {
      if (value) return item._isOwned;
      return true;
    },
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
    dataKey: "series",
    sidebar: null,
    filter: (item, value) =>
      !value || item.series === value || item.otherseries === value,
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

  minScore: {
    state: "minScore",
    type: "number",
    default: 0,
    control: "sliderMin",
    sidebar: ["read", "book", "author", "series"],
    filter: (item, value) => {
      if (Number.isNaN(value)) return true;
      return item._score >= value;
    },
  },

  maxScore: {
    state: "maxScore",
    type: "number",
    default: 10,
    control: "sliderMax",
    sidebar: ["read", "book", "author", "series"],
    filter: (item, value) => {
      if (Number.isNaN(value)) return true;
      return item._score <= value;
    },
  },

  scoreRange: {
    element: "scoreSlider",
    control: "slider",
    stateMin: "minScore",
    stateMax: "maxScore",
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

// Define state
const state = Object.fromEntries(
  Object.values(filterConfig).map((cfg) => [cfg.state, cfg.default]),
);

////////////////////////////////////////////////////////////////////////////////
// Sort config

const sortConfig = {
  title: {
    key: "title",
    type: "string",
    label: "Title",
    views: ["book", "read", "series", "author"],
  },
  author: {
    key: "author",
    type: "string",
    label: "Author",
    views: ["book", "read", "series", "author"],
  },
  score: {
    key: "_score",
    type: "number",
    label: "Score",
    views: ["read"],
  },
  averagescore: {
    key: "averagescore",
    type: "number",
    label: "Average Score",
    views: ["book", "series", "author"],
  },
  series: {
    key: "series",
    type: "series",
    label: "Series",
    views: ["book", "read"],
  },
  series: {
    key: "dateFinished",
    type: "date",
    label: "Date Finished",
    views: ["read"],
  },
};

function buildComparator({ key, type }) {
  if (type === "string") {
    return (a, b) => a[key].localeCompare(b[key]);
  } else if (type === "series") {
    (a, b) => {
      const s = a.series.localeCompare(b.series);
      if (s !== 0) return s;
      return a.seriesNumber - b.seriesNumber;
    };
  } else if (type === "date") {
    return (a, b) => a._timestampSort - b._timestampSort;
  }
  return (a, b) => a[key] - b[key];
}

function getAvailableSortOptions() {
  const view = state.view;

  return Object.entries(sortConfig).filter(
    ([_, cfg]) => !cfg.views || cfg.views.includes(view),
  );
}

const defaultSortByView = {
  books: "title",
  reads: "dateFinished",
  authors: "author",
  series: "title",
};

/////////////////////////////////////////////////////////////////////////

const elementMap = {};

// Fill Element Map
for (const key in filterConfig) {
  const elId = filterConfig[key].element;

  if (elId) {
    elementMap[elId] = document.getElementById(elId);
    elementMap[elId + "Parent"] = document.getElementById(elId + "Parent");
  }

  elementMap["bookNumberLabel"] = document.getElementById("bookNumberLabel");
  elementMap["pageCountLabel"] = document.getElementById("pageCountLabel");
  elementMap["pageAverageLabel"] = document.getElementById("pageAverageLabel");
  elementMap["scoreAverageLabel"] =
    document.getElementById("scoreAverageLabel");
  elementMap["pageTitle"] = document.getElementById("pageTitle");
}

/////////////////////////////////////////////////////////////////////////////

//Populate dropdowns
const populateSelect = (data, key, selectEl) => {
  [...new Set(data.map((item) => item[key]).filter(Boolean))]
    .sort()
    .forEach((value) => {
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
    populateSelect(dataIndex, cfg.dataKey, el);
  });

////////////////////////////////////////////////////////////////////////////////

//Score slider
const slider = document.getElementById("scoreSlider");
const scoreLabel = document.getElementById("scoreLabel");
noUiSlider.create(slider, {
  start: [0, 10],
  connect: true,
  step: 1,
  range: {
    min: 0,
    max: 10,
  },
});

// Score slider listener
slider.noUiSlider.on("update", function (values) {
  const min = Math.round(values[0]);
  const max = Math.round(values[1]);

  // Update label
  scoreLabel.textContent =
    min === 0 && max === 10 ? "Any Score" : `${min} – ${max}`;

  // Only trigger if value actually changed (important)
  if (state.minScore !== min || state.maxScore !== max) {
    state.minScore = min;
    state.maxScore = max;

    updateStateAndRender();
  }
});

////////////////////////////////////////////////////////

// Set all filters and control to their defaults
function resetFilters() {
  //console.log("reset filter");
  Object.keys(filterConfig).forEach((key) => {
    const { state: stateKey, default: defaultValue } = filterConfig[key];
    state[stateKey] = defaultValue;
  });

  setControlsFromState();
  render();
}

// State should always be correct so match controls to current state
function setControlsFromState() {
  //console.log("Set controls from state");
  for (const cfg of Object.values(filterConfig)) {
    const { element, state: stateKey, control } = cfg;

    if (!element) continue;

    const el = document.getElementById(element);
    if (!el) continue;

    const value = state[stateKey];

    switch (control) {
      case "text":
      case "select":
        if (el.value !== value) el.value = value;
        break;

      case "checkbox":
        if (el.checked !== value) el.checked = value;
        break;

      case "number":
        if (Number(el.value) !== value) el.value = value;
        break;

      case "slider":
        const slider = el.noUiSlider;
        if (!slider) break;

        const current = slider.get().map((v) => Math.round(v));

        if (
          current[0] !== state[cfg.stateMin] ||
          current[1] !== state[cfg.stateMax]
        ) {
          slider.set([state[cfg.stateMin], state[cfg.stateMax]]);
        }
        break;
    }
  }
}

// Connect our UI elements so they can change the state when user inputs
function bindControls() {
  //console.log("binding controls");

  //Hide all cards until we finish loading
  const grid = document.getElementById("booksView");
  grid.classList.add("show");

  for (const cfg of Object.values(filterConfig)) {
    const { element, state: stateKey, control } = cfg;

    // Skip non-DOM controls (handled separately)
    if (!element) continue;

    const el = document.getElementById(element);
    if (!el) continue;

    switch (control) {
      case "primary":
        el.addEventListener("change", () => {
          state[stateKey] = el.value;
          resetSidebar();
          updateSortOptions();
          updateStateAndRender();
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

      case "slider":
        const slider = document.getElementById(cfg.element);

        slider.noUiSlider.on("change", (values) => {
          const min = Math.round(values[0]);
          const max = Math.round(values[1]);

          if (state[cfg.stateMin] !== min || state[cfg.stateMax] !== max) {
            state[cfg.stateMin] = min;
            state[cfg.stateMax] = max;

            updateStateAndRender();
          }
        });
        break;
    }
  }
}

/////////////////////////////////////////////////////////////////////////////
// Sidebar
function resetSidebar() {
  //console.log("resetSidebar");
  resetSidebarState();
  updateSidebarVisibility(state.view);
}

function resetSidebarState() {
  for (const key in filterConfig) {
    const {
      state: stateKey,
      default: defaultValue,
      sidebar,
    } = filterConfig[key];
    if (sidebar) {
      state[stateKey] = defaultValue;
    }
  }
}

function updateSidebarVisibility(view) {
  for (const key in filterConfig) {
    const { sidebar, element } = filterConfig[key];
    if (!sidebar || !element) continue;

    const el = elementMap[`${element}Parent`];
    if (!el) continue;

    const isVisible = !sidebar || sidebar.includes(view);

    el.classList.toggle("hidden", !isVisible);
  }
}

//////////////////////////////////////////////////////////////
// Sort UI
function updateSortOptions() {
  const select = elementMap["sortField"];
  if (!select) return;

  const options = getAvailableSortOptions();

  // Clear existing
  select.innerHTML = "";

  options.forEach(([key, cfg]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = cfg.label;
    select.appendChild(opt);
  });

  // Ensure current selection is valid
  if (
    !sortConfig[state.sortField] ||
    (sortConfig[state.sortField].views &&
      !sortConfig[state.sortField].views.includes(state.view))
  ) {
    state.sortField = defaultSortByView[state.view] || options[0][0];
  }

  select.value = state.sortField;
}

/////////////////////////////////////////////////////////////
// Filter and Sort Logic

// Exclude any items not matching current state, called by render()
function getActiveFilters() {
  return Object.values(filterConfig)
    .filter((cfg) => cfg.filter)
    .map((cfg) => {
      const value = state[cfg.state];
      return (item) => cfg.filter(item, value);
    });
}

// sort items by field and direction, called by render()
function sortItems(items) {
  const { sortField, sortDir } = state;

  const comparator = buildComparator(sortConfig[sortField]);

  if (!comparator) return items;

  const sorted = [...items].sort(comparator);

  return sortDir === "desc" ? sorted.reverse() : sorted;
}

// Calls filter and sort, then displays book cards
function render() {
  const grid = document.querySelector(".book-grid");

  const activeFilters = getActiveFilters();

  const filtered = dataIndex.filter((item) =>
    activeFilters.every((fn) => fn(item)),
  );

  const sorted = sortItems(filtered);
  const MAX_RENDER = 3000;

  const visible = sorted.slice(0, MAX_RENDER);
  //console.log(visible);

  // Clear DOM
  grid.innerHTML = "";

  const fragment = document.createDocumentFragment();

  visible.forEach((item) => {
    fragment.appendChild(item.el);
  });

  grid.appendChild(fragment);

  updateLabels(filtered);
}

//////////////////////////////////////////////////////////////////////////////
// Display Labels

//Labels to show various stats
function updateLabels(filtered) {
  const bookNumberLabel = elementMap["bookNumberLabel"];
  const pageCountLabel = elementMap["pageCountLabel"];
  const pageAverageLabel = elementMap["pageAverageLabel"];
  const scoreAverageLabel = elementMap["scoreAverageLabel"];

  let totalScore = 0;
  let pageCount = 0;

  for (i = 0; i < filtered.length; i++) {
    totalScore += Number(filtered[i].averagescore);
    pageCount += Number(filtered[i].pages);
  }

  if (bookNumberLabel && filtered)
    bookNumberLabel.textContent = filtered.length;

  if (pageCountLabel && filtered) pageCountLabel.textContent = pageCount;

  if (pageAverageLabel && filtered)
    pageAverageLabel.textContent = (pageCount / filtered.length).toFixed(2);

  if (scoreAverageLabel && filtered)
    scoreAverageLabel.textContent = (totalScore / filtered.length).toFixed(2);

  updateTitle();
}

//Title of page
function updateTitle() {
  const series = elementMap["seriesFilter"].value;
  const sort = elementMap["sortField"].value;

  let title = "All Books";

  if (series) {
    title = `Series: ${series}`;
  } else if (sort === "averagescore") {
    title = "Books by Average Score";
  } else if (sort === "latestscore") {
    title = "Books by Latest Score";
  }

  elementMap["pageTitle"].textContent = title;
}

////////////////////////////////////////////////////////////////////////////////////
//URL logic

// updates url with any filter and search fields
function updateURL() {
  //console.log("updateURL");
  const params = new URLSearchParams();

  // Loop through config for other filters
  for (const [param, config] of Object.entries(filterConfig)) {
    let value = state[config.state];

    if (
      (value == null || value === "" || value === config.default) &&
      value != "book"
    ) {
      continue; // skip default / empty
    }

    params.set(param, value);
  }

  history.replaceState(null, "", "?" + params.toString());
}

// Call when loading book page, check if we have a changed state and handle accordingly
function setFiltersFromURL() {
  //console.log("Loading filters from URL");
  const params = new URLSearchParams(window.location.search);

  for (const [param, config] of Object.entries(filterConfig)) {
    let value = params.get(param);

    // Use default if not present
    if (value == null) {
      value = config.default;
    }

    // Normalize types BEFORE assignment
    if (config.type === "number") {
      value = Number(value);
    }

    if (config.control === "checkbox") {
      value = value === "true" || value === true;
    }

    // Single assignment only
    if (config.state) {
      state[config.state] = value;
    }
  }

  updateStateAndRender();
}

///////////////////////////////////////////////////////////////////

// Scroll to top button
const btn = document.getElementById("scrollTopBtn");

window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    btn.classList.add("show");
  } else {
    btn.classList.remove("show");
  }
});

btn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

/////////////////////////////////////////////////////////////////////////////
// 4. check if we have saved filters and initialize
setFiltersFromURL();
updateSortOptions();
bindControls();

console.log(dataIndex);

function updateStateAndRender() {
  //console.log("update State and Render");
  setControlsFromState();
  render();
  updateURL();
}
