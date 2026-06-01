// 1. Get grid of cards and make data index
const grid = document.querySelector(".book-grid");
const cards = Array.from(grid.children);

// Remove all from DOM
grid.innerHTML = "";

const dataIndex = cards.map((el) => {
  const data = el.dataset;

  const score = parseFloat(data.score || data.averagescore || 0);
  const hasScore = data.hasscore !== "false";
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
    series: data.series || "",
    seriesNumber: Number(data.seriesnumber) || 0,
    pages: Number(data.pages) || 0,
    count: Number(data.count) || 0,
  };
});

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
//   Num of reads Sliders
//   Series order / number
//   length (pages)
//   year released
// Sorting:
//   sortField: "title",
//   sortDir: "asc" //Ascending

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
    defaultMax: null, // filled dynamically
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
  dateFinished: {
    key: "dateFinished",
    type: "date",
    label: "Date Finished",
    views: ["read"],
  },
  count: {
    key: "count",
    type: "number",
    label: "Count",
    views: ["book", "series", "author"],
  },
  pages: {
    key: "pages",
    type: "number",
    label: "Pages",
    views: ["book", "read", "series", "author"],
  },
  days: {
    key: "days",
    type: "number",
    label: "Days to read",
    views: ["read"],
  },
  yearPublished: {
    key: "yearpublished",
    type: "number",
    label: "Year Published",
    views: ["book", "read"],
  },
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
  if (type === "string") {
    return (a, b) => a[key].localeCompare(b[key]);
  } else if (type === "series") {
    return (a, b) => {
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
  const labelID = filterConfig[key].label;

  if (labelID) {
    elementMap[labelID] = document.getElementById(labelID);
  }

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
//Sliders
const boundsByView = {
  book: computeBoundsForView("book"),
  read: computeBoundsForView("read"),
  series: computeBoundsForView("series"),
  author: computeBoundsForView("author"),
};

const bounds = boundsByView[state.view];

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
    if (cfg.control === "slider") {
      const slider = elementMap[cfg.element];
      if (!slider) continue;

      let min = cfg.defaultMin;
      let max = cfg.defaultMax;

      slider.noUiSlider.updateOptions({
        range: { min, max },
      });
      slider.noUiSlider.set([min, max]);

      const label = elementMap[cfg.label];
      label.textContent = `${cfg.defaultMin} – ${cfg.defaultMax}`;
    }
  }
}

function initializeSliderConfig(bounds) {
  for (const cfg of Object.values(filterConfig)) {
    if (cfg.control === "slider") {
      const b = bounds[cfg.field];

      cfg.defaultMin = b.min;
      cfg.defaultMax = b.max;

      state[cfg.stateMin] = b.min;
      state[cfg.stateMax] = b.max;
    }
  }
}

////////////////////////////////////////////////////////
// View change
// This is our primary filter control so it has more calls than most
function handleViewChange() {
  //console.log("View Changed");
  const bounds = boundsByView[state.view];
  initializeSliderConfig(bounds);
  updateSliderRange();

  resetSidebar();
  updateSortOptions();
  updateStateAndRender();
}

/////////////////////////////////////////////////////////////////////
// Set all filters and control to their defaults
function resetFilters() {
  //console.log("reset filter");
  // Object.values(filterConfig).forEach((cfg) => {
  //   if (cfg.control === "slider") {
  //     state[cfg.stateMin] = cfg.defaultMin;
  //     state[cfg.stateMax] = cfg.defaultMax;
  //   } else if (cfg.state) {
  //     state[cfg.state] = cfg.default;
  //   }
  // });
  Object.values(filterConfig).forEach((cfg) => {
    state[cfg.state] = cfg.default;
  });
  handleViewChange();
}

// State should always be correct so match controls to current state
function setControlsFromState() {
  //console.log("Set controls from state");
  for (const cfg of Object.values(filterConfig)) {
    const { element, state: stateKey, control } = cfg;

    if (!element) continue;

    //const el = document.getElementById(element);
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

      case "slider":
        const slider = el.noUiSlider;
        if (!slider) break;

        const current = slider.get().map((v) => Math.round(v));
        if (
          current[0] !== state[cfg.stateMin] ||
          current[1] !== state[cfg.stateMax]
        ) {
          slider.set([state[cfg.stateMin], state[cfg.stateMax]]);
          // Update label
          const label = elementMap[cfg.label];
          label.textContent = `${state[cfg.stateMin]} – ${state[cfg.stateMax]}`;
        }
        break;
    }
  }
}

// Connect our UI elements so they can change the state when user inputs
function bindControls() {
  //console.log("binding controls");
  const bounds = boundsByView[state.view];
  initializeSliderConfig(bounds);

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

      case "slider":
        const slider = document.getElementById(cfg.element);

        // Update label
        const label = elementMap[cfg.label];
        label.textContent = `${cfg.defaultMin} – ${cfg.defaultMax}`;

        noUiSlider.create(slider, {
          start: [state[cfg.stateMin], state[cfg.stateMax]],
          connect: true,
          step: 1,
          range: {
            min: cfg.defaultMin,
            max: cfg.defaultMax,
          },
        });

        // "update" applies while draggin, "change" is when released
        // Due to the number of pages, we need to have it be on change instead of update
        let updateMethod = "update";
        if (cfg.field === "pages") updateMethod = "change";

        slider.noUiSlider.on(updateMethod, (values) => {
          const min = Math.round(values[0]);
          const max = Math.round(values[1]);

          // Only trigger if value actually changed
          if (state[cfg.stateMin] !== min || state[cfg.stateMax] !== max) {
            state[cfg.stateMin] = min;
            state[cfg.stateMax] = max;

            // Update label
            const label = elementMap[cfg.label];
            label.textContent = `${min} – ${max}`;

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
      control: stateControl,
      stateMax: stateMax,
      stateMin: stateMin,
      defaultMax: defaultMax,
      defaultMin: defaultMin,
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
    const { sidebar, element, label } = filterConfig[key];
    if (!sidebar || !element) continue;

    let el = elementMap[`${element}Parent`];
    if (!el) el = elementMap[`${element}`];
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

  for (const [param, cfg] of Object.entries(filterConfig)) {
    if (cfg.control === "slider") {
      const min = state[cfg.stateMin];
      const max = state[cfg.stateMax];

      if (min !== cfg.defaultMin) {
        params.set(`${param}Min`, min);
      }

      if (max !== cfg.defaultMax) {
        params.set(`${param}Max`, max);
      }

      continue;
    }

    const value = state[cfg.state];

    if (value === null || value === "" || value === cfg.default) {
      continue;
    }

    params.set(param, value);
  }

  history.replaceState(null, "", "?" + params.toString());
}

// Call when loading book page, check if we have a changed state and handle accordingly
function setFiltersFromURL() {
  //console.log("set filter from URL");
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

    if (value == null) {
      value = cfg.default;
    }

    if (cfg.type === "number") {
      value = Number(value);
    }

    if (cfg.control === "checkbox") {
      value = value === "true" || value === true;
    }

    state[cfg.state] = value;
    if (cfg.control === "primary") {
      handleViewChange();
    }
  }
}

///////////////////////////////////////////////////////////////////
//Various buttons
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

const toggle = document.querySelector(".mobile-filter-toggle");
const filters = document.querySelector(".filter-group");

toggle.addEventListener("click", () => {
  const open = filters.classList.toggle("is-open");

  toggle.setAttribute("aria-expanded", open);
});

/////////////////////////////////////////////////////////////////////////////
// 4. check if we have saved filters and initialize
function initialize() {
  //console.log("Initializing");
  updateSortOptions();
  updateSidebarVisibility(state.view);
  bindControls();
  setFiltersFromURL();
  updateStateAndRender();
}
//console.log(dataIndex);

function updateStateAndRender() {
  //console.log("update State and Render");
  setControlsFromState();
  render();
  updateURL();
}

initialize();
