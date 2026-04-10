// 1. Get grid of cards and make book index
const cards = Array.from(document.querySelectorAll(".book-card"));

const bookDataIndex = cards.map((el) => {
  const data = el.dataset;

  const score = parseFloat(data.score || data.averagescore || 0);

  return {
    el,
    ...data,
    _score: isNaN(score) ? 0 : score,
  };
});

////////////////////////////////////////////////////////////////////////////////////////////
// Sort stuff

const getNumber = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

const getString = (v) => (v ?? "").toString();

const sortStrategies = {
  title: (a, b) => getString(a.title).localeCompare(getString(b.title)),

  averagescore: (a, b) => getNumber(a.averagescore) - getNumber(b.averagescore),

  latestscore: (a, b) => getNumber(a.score) - getNumber(b.score),

  series: (a, b) => {
    // PRIMARY: series name
    const seriesCompare = getString(a.series).localeCompare(
      getString(b.series),
    );

    if (seriesCompare !== 0) return seriesCompare;

    // SECONDARY: series number
    const nA = getNumber(a.seriesnumber);
    const nB = getNumber(b.seriesnumber);

    if (nA != null && nB != null) {
      return nA - nB;
    }

    // fallback if missing numbers
    return getString(a.title).localeCompare(getString(b.title));
  },
};

///////////////////////////////////////////////////////////////////////////

// 2. Establish filter config, this will create default state and save current filtering state
const filterConfig = {
  view: {
    element: "combineToggle",
    state: "view",
    default: "books",
    sidebar: null,
    filter: (item, value) => {
      //console.log("VIEW VALUE:", value);
      //console.log(item.type);
      if (value === "books") return item.type === "book";
      if (value === "reads") {
        //console.log(item.type);
        return true;
        if (item.type === "read") {
          return true;
          console.log(item.type);
          console.log("READS REACHED" + item.type === "read");
        } else {
          console.log(item.type);
        }
        return item.type === "read";
      }
      if (value === "series") return item.type === "series";
      if (value === "authors") return item.type === "author";
      return true;
    },
  },

  search: {
    element: "booksSearchInput",
    state: "search",
    default: "",
    sidebar: null,
    filter: (item, value) => {
      if (!value) return true;

      const search = value.toLowerCase();

      const fields = [];
      if (state.searchTitle) fields.push(item.title || "");
      if (state.searchAuthor) fields.push(item.author || "");
      if (state.searchSeries) fields.push(item.series || "");

      if (fields.length === 0) return false;

      const text = fields.join(" ").toLowerCase();
      return text.includes(search);
    },
  },

  searchTitle: {
    element: "booksSearchTitle",
    state: "searchTitle",
    type: "checkbox",
    default: true,
    sidebar: null,
  },

  searchAuthor: {
    element: "booksSearchAuthor",
    state: "searchAuthor",
    type: "checkbox",
    default: true,
    sidebar: null,
  },

  searchSeries: {
    element: "booksSearchSeries",
    state: "searchSeries",
    type: "checkbox",
    default: true,
    sidebar: null,
  },

  mustHaveScore: {
    element: "hasScoreToggle",
    state: "mustHaveScore",
    type: "checkbox",
    default: false,
    sidebar: ["books", "reads", "series", "authors"],
    filter: (item, value) => {
      if (value) return item.hasscore;
      return true;
    },
  },

  mustHaveSummary: {
    element: "hasSummaryToggle",
    state: "hasSummary",
    type: "checkbox",
    default: false,
    sidebar: ["books", "reads"],
    filter: (item, value) => {
      if (value) return item.hassummary;
      return true;
    },
  },

  mustHaveReview: {
    element: "hasReviewToggle",
    state: "hasReview",
    type: "checkbox",
    default: false,
    sidebar: ["reads"],
    filter: (item, value) => {
      if (value) return item.hasreview;
      return true;
    },
  },

  mustBeOwned: {
    element: "isOwnedToggle",
    state: "isOwned",
    type: "checkbox",
    default: "false",
    sidebar: ["books", "reads"],
    filter: (item, value) => {
      if (value) return item.owned;
      return true;
    },
  },

  author: {
    element: "authorFilter",
    state: "author",
    default: "",
    dataKey: "author",
    sidebar: null,
    filter: (item, value) => !value || item.author === value,
  },

  series: {
    element: "seriesFilter",
    state: "series",
    default: "",
    dataKey: "series",
    sidebar: null,
    filter: (item, value) =>
      !value || item.series === value || item.otherseries === value,
  },

  yearRead: {
    element: "yearReadFilter",
    state: "yearRead",
    default: "",
    dataKey: "yearread",
    sidebar: ["reads"],
    filter: (item, value) => !value || item.yearread === value,
  },

  format: {
    element: "formatFilter",
    state: "format",
    default: "",
    dataKey: "format",
    sidebar: ["reads"],
    filter: (item, value) => !value || item.format === value,
  },

  minScore: {
    state: "minScore",
    type: "number",
    default: 0,
    sidebar: ["reads", "books", "authors", "series"],
    filter: (item, value) => {
      if (Number.isNaN(value)) return true;
      return item._score >= value;
    },
  },

  maxScore: {
    state: "maxScore",
    type: "number",
    default: 10,
    sidebar: ["reads", "books", "authors", "series"],
    filter: (item, value) => {
      if (Number.isNaN(value)) return true;
      return item._score <= value;
    },
  },

  sort: {
    element: "sortField",
    state: "sortField",
    default: "title",
    sidebar: null,
  },

  dir: {
    element: "sortDirection",
    state: "sortDir",
    default: "asc",
    sidebar: null,
  },
};

// Define state
const state = Object.fromEntries(
  Object.values(filterConfig).map((cfg) => [cfg.state, cfg.default]),
);

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
    populateSelect(bookDataIndex, cfg.dataKey, el);
  });

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
  //console.log("Slider updated");
  const min = Math.round(values[0]);
  const max = Math.round(values[1]);

  if (min === 0 && max === 10) {
    scoreLabel.textContent = "Any Score";
  } else {
    scoreLabel.textContent = `${min} – ${max}`;
  }

  state.minScore = min;
  state.maxScore = max;
  setState();
});

////////////////////////////////////////////////////////

// Set all filters and control to their defaults
function resetFilters() {
  //console.log("reset filter");
  // Reset state to defaults
  Object.keys(filterConfig).forEach((key) => {
    const { state: stateKey, default: defaultValue } = filterConfig[key];
    state[stateKey] = defaultValue;
  });

  setControlsFromState();

  render();
}

//set state based on UI changes
function setState(updates) {
  if (!empowerControls) return;
  //console.log("Set State reached");
  const cur = state["view"];
  Object.assign(state, updates);

  if (state["view"] !== cur) {
    resetSidebar();
  }

  setControlsFromState();
  render();
}

// State should always be correct so match controls to current state
function setControlsFromState() {
  //console.log("set Controls From State");
  Object.values(filterConfig).forEach((cfg) => {
    const el = document.getElementById(cfg.element);
    if (!el) return;

    if (el.type === "checkbox") {
      el.checked = state[cfg.state] === true;
    } else if (el.type === "number") {
    } else {
      el.value = state[cfg.state];
    }
  });
}

// Connect our UI elements so they can change the state when user inputs
function bindUI() {
  //console.log("Bind UI reached");
  //Hide books until we have filtered by URL
  if (!empowerControls) {
    const grid = document.getElementById("booksView");
    grid.classList.add("show");
  }
  empowerControls = true;

  Object.values(filterConfig).forEach((cfg) => {
    if (!cfg.element) return;

    const el = elementMap[cfg.element];

    const eventType =
      el.type === "text"
        ? "input"
        : el.type === "checkbox"
          ? "change"
          : "change";

    // UI Event Listeners
    el.addEventListener(eventType, () => {
      let value;

      if (el.type === "checkbox") {
        value = el.checked ? true : false;
      } else if (cfg.type === "number") {
        value = Number(el.value);
      } else {
        value = el.value;
      }

      setState({ [cfg.state]: value });
    });
  });

  resetSidebar();
  render();
}

/////////////////////////////////////////////////////////////////////////////
// Sidebar
function resetSidebar() {
  resetSidebarState();
  updateSidebarVisibility(state.view);
  setControlsFromState();
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

/////////////////////////////////////////////////////////////////////////////
// 4. check if we have saved filters and initialize
var empowerControls = false;
setFiltersFromURL();
bindUI();

/////////////////////////////////////////////////////////////
// Filter and Sort Logic

function getActiveFilters() {
  const filters = [];

  for (const cfg of Object.values(filterConfig)) {
    if (!cfg.filter) continue;

    const value = state[cfg.state];

    filters.push((item) => cfg.filter(item, value));
  }

  return filters;
}

// Exclude any items not matching current state, called by render()
function filterItems() {
  return bookDataIndex.filter((item) =>
    Object.values(filterConfig).every(
      (cfg) => !cfg.filter || cfg.filter(item, state[cfg.state]),
    ),
  );
}

// sort items by field and direction, called by render()
function sortItems(items) {
  const field = state.sortField;
  const dir = state.sortDir === "asc" ? 1 : -1;

  const comparator = sortStrategies[field];

  return items.sort((a, b) => {
    let result;

    if (comparator) {
      result = comparator(a, b);
    } else {
      // fallback generic behavior
      const A = getString(a[field]);
      const B = getString(b[field]);

      const nA = getNumber(A);
      const nB = getNumber(B);

      result = nA != null && nB != null ? nA - nB : A.localeCompare(B);
    }

    if (result !== 0) return result * dir;

    // global tiebreaker
    return getString(a.title).localeCompare(getString(b.title));
  });
}

// Calls filter and sort, then displays book cards
function render() {
  //console.log("render (method)");

  const grid = document.querySelector(".book-grid");

  const activeFilters = getActiveFilters();
  const filtered = bookDataIndex.filter((item) =>
    activeFilters.every((fn) => fn(item)),
  );
  console.log(filtered);
  const sorted = sortItems(filtered);

  bookDataIndex.forEach((item) => (item.el.style.display = "none"));

  sorted.forEach((item) => {
    item.el.style.display = "";
    grid.appendChild(item.el);
  });

  updateLabels(filtered);

  updateURL();
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
      value != "books"
    ) {
      continue; // skip default / empty
    }

    params.set(param, value);
  }

  history.replaceState(null, "", "?" + params.toString());
}

// Call when loading book page, check if we have a changed state and handle accordingly
function setFiltersFromURL() {
  //console.log("Setting filters from URL");
  const params = new URLSearchParams(window.location.search);

  for (const [param, config] of Object.entries(filterConfig)) {
    let value = params.get(param);

    if (value == null) value = config.default;

    if (value == null) continue;

    if (config.type === "number") value = Number(value);

    if (config.element) config.element.value = value;

    if (config.state) state[config.state] = value;
  }

  // view toggle (custom logic)
  const view = params.get("view");
  if (view) {
    state.view = view;
    combineToggle.checked = view === "books";
  }

  // slider (range control)
  const minScore = state.minScore ?? 0;
  const maxScore = state.maxScore ?? 10;
  slider.noUiSlider.set([minScore, maxScore]);

  //render();
  setState(state);
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
