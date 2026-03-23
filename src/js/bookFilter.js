// 1. Get grid of cards and make book index
const cards = Array.from(document.querySelectorAll(".book-card"));

const bookDataIndex = cards.map(el => ({
  el,
  ...el.dataset
}));

//I need to fix how I store data in my markdowns but this for now
const getNumber = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

const getString = (v) => (v ?? "").toString();

const sortStrategies = {
  title: (a, b) =>
    getString(a.title).localeCompare(getString(b.title)),

  averagescore: (a, b) =>
    getNumber(a.averagescore) - getNumber(b.averagescore),

  latestscore: (a, b) =>
    getNumber(a.score) - getNumber(b.score),

  series: (a, b) => {
    // PRIMARY: series name
    const seriesCompare =
      getString(a.series).localeCompare(getString(b.series));

    if (seriesCompare !== 0) return seriesCompare;

    // SECONDARY: series number
    const nA = getNumber(a.seriesNumber);
    const nB = getNumber(b.seriesNumber);

    if (nA != null && nB != null) {
      console.log(nA + "         " + nB + "    NOT Missing numbers");
      return nA - nB;
    }

    console.log("Missing numbers");

    // fallback if missing numbers
    return getString(a.title).localeCompare(getString(b.title));
  }
};

///////////////////////////////////////////////////////////////////////////

// 2. Establish filter config, this will create default state and save current filtering state
const filterConfig = {
  view: {
    element: "combineToggle",
    state: "view",
    default: "books",
    filter: (item, value) => {
      if (value === "books") return item.type === "book";
      if (value === "reads") return item.type === "read";
      if (value === "series") return item.type === "series";
      if (value === "authors") return item.type === "author";
      return true;
    }
  },

  search: {
    element: "booksSearchInput",
    state: "search",
    default: "",
    filter: (item, value) => {
      if (!value) return true;
      const text = `${item.title} ${item.author} ${item.series}`.toLowerCase();
      return text.includes(value.toLowerCase());
    }
  },

  author: {
    element: "authorFilter",
    state: "author",
    default: "",
    dataKey: "author",
    filter: (item, value) => !value || item.author === value
  },

  series: {
    element: "seriesFilter",
    state: "series",
    default: "",
    dataKey: "series",
    filter: (item, value) => !value || ( item.series === value || item.otherseries === value )
  },

  yearRead: {
    element: "yearReadFilter",
    state: "yearRead",
    default: "",
    dataKey: "yearread",
    filter: (item, value) => !value || item.yearread === value
  },

  minScore: {
    state: "minScore",
    type: "number",
    default: 0,
    filter: (item, value) => {
      if (!value) return true;
      const score = parseFloat(item.score || item.averagescore || 0);
      return score >= value;
    }
  },

  maxScore: {
    state: "maxScore",
    type: "number",
    default: 10,
    filter: (item, value) => {
      if (!value) return true;
      const score = parseFloat(item.score || item.averagescore || 0);
      return score <= value;
    }
  },

  sort: {
    element: "sortField",
    state: "sortField",
    default: "title"
  },

  dir: {
    element: "sortDirection",
    state: "sortDir",
    default: "asc"
  }
};

// Define state
const state = Object.fromEntries(
  Object.values(filterConfig).map(cfg => [cfg.state, cfg.default])
);

// Defaults:
//   view: "books",
//   search: "",
//   author: "",
//   series: "",
//   minScore: 0,
//   maxScore: 10,
//   sortField: "title",
//   sortDir: "asc" //Ascending
//   //Num of reads
//   //Series order / number
//   //Score change read to read
//   //time reading
//   //length (pages)
//   //year released

/////////////////////////////////////////////////////////////////////////////

//Populate dropdowns
const populateSelect = (data, key, selectEl) => {
  [...new Set(data.map(item => item[key]).filter(Boolean))]
    .sort()
    .forEach(value => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = value;
      selectEl.appendChild(opt);
    });
};

Object.values(filterConfig)
  .filter(cfg => cfg.dataKey)
  .forEach(cfg => {
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
    max: 10
  }
});

// Score slider listener
slider.noUiSlider.on("update", function(values) {
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
  Object.keys(filterConfig).forEach(key => {
    const { state: stateKey, default: defaultValue } = filterConfig[key];
    state[stateKey] = defaultValue;
  });

  setControlsFromState();

  render();
}

//set state based on UI changes
function setState(updates) {
  if( !empowerControls ) return;
  //console.log("Set State reached");
  Object.assign(state, updates);
  setControlsFromState();
  render();
};

// State should always be correct so match controls to current state
function setControlsFromState() {
  //console.log("set Controls From State");
  Object.values(filterConfig).forEach(cfg => {
    const el = document.getElementById(cfg.element);
    if (!el) return;

    if (el.type === "checkbox") {
      el.checked = state[cfg.state] === "books"; 
    } else if (el.type === "input") {

    } else {
      el.value = state[cfg.state];
    }
  });
};

// Connect our UI elements so they can change the state when user inputs
function bindUI() {
  //console.log("Bind UI reached");
  empowerControls = true;

  Object.values(filterConfig).forEach(cfg => {
    if (!cfg.element) return;

    const el = document.getElementById(cfg.element);

    const eventType =
      el.type === "text" ? "input" :
      el.type === "checkbox" ? "change" :
      "change";

    el.addEventListener(eventType, () => {
      let value;

      if (el.type === "checkbox") {
        value = el.checked ? "books" : "entries";
      } else if (cfg.type === "number") {
        value = Number(el.value);
      } else {
        value = el.value;
      }

      setState({ [cfg.state]: value });
    });
  });
  render();
};

/////////////////////////////////////////////////////////////////////////////
// 4. check if we have saved filters and initialize
var empowerControls = false;
setFiltersFromURL();
bindUI();

/////////////////////////////////////////////////////////////
// Filter and Sort Logic

// Exclude any items not matching current state, called by render()
function filterItems() {
  return bookDataIndex.filter(item =>
    Object.values(filterConfig).every(cfg =>
      !cfg.filter || cfg.filter(item, state[cfg.state])
    )
  );
};

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

      result =
        nA != null && nB != null
          ? nA - nB
          : A.localeCompare(B);
    }

    if (result !== 0) return result * dir;

    // global tiebreaker
    return getString(a.title).localeCompare(getString(b.title));
  });
};

// Calls filter and sort, then displays book cards
function render() {
  //console.log("render (method)");

  const grid = document.querySelector(".book-grid");

  const filtered = filterItems();
  console.log(filtered);
  const sorted = sortItems(filtered);

  bookDataIndex.forEach(item => item.el.style.display = "none");

  sorted.forEach(item => {
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
  const bookNumberLabel = document.getElementById("bookNumberLabel");
  const pageCountLabel = document.getElementById("pageCountLabel");
  const pageAverageLabel = document.getElementById("pageAverageLabel");
  const scoreAverageLabel = document.getElementById("scoreAverageLabel");

  let totalScore = 0;
  let pageCount = 0;

  for( i = 0; i < filtered.length; i++ )
  {
    totalScore += Number(filtered[i].averagescore);
    pageCount += Number(filtered[i].pages);
  }


  if( bookNumberLabel && filtered)
    bookNumberLabel.textContent = filtered.length;

  if( pageCountLabel && filtered)
    pageCountLabel.textContent = pageCount;

  if( pageAverageLabel && filtered)
    pageAverageLabel.textContent = pageCount / filtered.length;

  if( scoreAverageLabel && filtered)
    scoreAverageLabel.textContent = totalScore / filtered.length;

  updateTitle();
}

//Title of page
function updateTitle() {
  const series = document.getElementById("seriesFilter").value;
  const sort = document.getElementById("sortField").value;

  let title = "All Books";

  if (series) {
    title = `Series: ${series}`;
  } else if (sort === "averagescore") {
    title = "Books by Average Score";
  } else if (sort === "latestscore") {
    title = "Books by Latest Score";
  }

  document.getElementById("pageTitle").textContent = title;
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

    if (value == null || value === "" || value === config.default) {
      continue; // skip default / empty
    }

    params.set(param, value);
  }

  history.replaceState(null,"","?"+params.toString());
}

// Call when loading book page, check if we have a changed state and handle accordingly
function setFiltersFromURL()
{
  //console.log("Setting filters from URL");
  const params = new URLSearchParams(window.location.search);

  for (const [param, config] of Object.entries(filterConfig))
  {
    let value = params.get(param);

    if (value == null)
      value = config.default;

    if (value == null)
      continue;

    if (config.type === "number")
      value = Number(value);

    if (config.element)
      config.element.value = value;

    if (config.state)
      state[config.state] = value;
  } 

  // view toggle (custom logic)
  const view = params.get("view");
  if (view)
  {
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
