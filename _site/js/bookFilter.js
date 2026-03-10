// 1. Get grid of cards and make book index
// 2. establish filter state
// 3. get all control elements by id
// 4. check url and set filters and control elements accordingly
// 5. render correct book list

// 1
const cards = Array.from(document.querySelectorAll(".book-card"));

const bookDataIndex = cards.map(el => ({
  el,
  ...el.dataset
}));

/////////////////////////////////////////////////////////////////////

// 2
const state = {
  view: "books",
  search: "",
  author: "",
  minScore: 0,
  maxScore: 10,
  sortField: "title",
  sortDir: "asc" //Ascending
  //Num of reads
  //Series order
  //Score change read to read
  //time reading
  //length (pages)
  //year released
  //
};

////////////////////////////////////////////////////////////////

// 3
const combineToggle = document.getElementById("combineToggle");
const searchTextInput = document.getElementById("booksSearchInput");
const authorFilter = document.getElementById("authorFilter");
const sortField = document.getElementById("sortField");
const sortDirection = document.getElementById("sortDirection");
//Score slider
const slider = document.getElementById("scoreSlider");
const scoreLabel = document.getElementById("scoreLabel");

const resetButton = document.getElementById("filterResetButton");

const bookNumberLabel = document.getElementById("bookNumberLabel");
const pageCountLabel = document.getElementById("pageCountLabel");
const pageAverageLabel = document.getElementById("pageAverageLabel");
const scoreAverageLabel = document.getElementById("scoreAverageLabel");

///////////////////////////////////////////////////////////////////////////

const filterConfig = {
  view: {
    element: combineToggle,
    state: "view",
    default: "books"
  },

  search: {
    element: searchTextInput,
    state: "search",
    default: ""
  },

  author: {
    element: authorFilter,
    state: "author",
    default: ""
  },

  sort: {
    element: sortField,
    state: "sortField",
    default: "title"
  },

  dir: {
    element: sortDirection,
    state: "sortDir",
    default: "asc"
  },

  minScore: {
    state: "minScore",
    type: "number",
    default: 0
  },

  maxScore: {
    state: "maxScore",
    type: "number",
    default: 10
  }
};

/////////////////////////////////////////////////////////////////////////////

// Author filter
const authors = [...new Set(bookDataIndex.map(i => i.author))].sort();

authors.forEach(author=>{
  const opt = document.createElement("option");
  opt.value = author;
  opt.textContent = author;
  authorFilter.appendChild(opt);
});

// Score Slider
noUiSlider.create(slider, {
  start: [0, 10],
  connect: true,
  step: 1,
  range: {
    min: 0,
    max: 10
  }
});

// 4
//check if we have saved filters
setFiltersFromURL();

combineToggle.addEventListener("change", updateState);
authorFilter.addEventListener("change", updateState);
sortField.addEventListener("change", updateState);
sortDirection.addEventListener("change", updateState);

resetButton.addEventListener("click", resetFilters);

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
  updateState();
});

////////////////////////////////////////////////////////

// Set all filters and control to their defaults
function resetFilters() {
  // console.log("reset filter");

  // reset state
  state.view = "books",
  state.search = "",
  state.author = "",
  state.minScore = 0,
  state.maxScore = 10,
  state.sortField = "title",
  state.sortDir = "asc";

  // reset visual controls
  combineToggle.checked = true;
  searchTextInput.value = "";
  authorFilter.selectedIndex = 0;
  sortField.selectedIndex = 0;
  sortDirection.selectedIndex = 0;
  slider.noUiSlider.set([0, 10]);

  render();
}

//Check every field and set state accordingly
function updateState() {
  // console.log("updateState");

  const newView = combineToggle.checked ? "books" : "reads";

  const newSearch = searchTextInput.value.toLowerCase();

  const newAuthor = (authorFilter.value || "").toLowerCase();

  const newField = (sortField.value || "").toLowerCase();

  const newSortDir = (sortDirection.value || "") === "asc" ? "asc" : "desc";

  state.view = newView;
  state.search = newSearch;
  state.author = newAuthor;
// min max score updated in own method
  state.sortField = newField;
  state.sortDir = newSortDir;

  render();
}

// Exclude any items not matching current state
function filterItems() {
  //console.log("filterItems");

  return bookDataIndex.filter(item => {

    // Combined books vs reads
    if (state.view === "books" && item.type !== "book") return false;
    if (state.view === "reads" && item.type !== "read") return false;

    //Search, can be expanded to include more
    if (state.search) {
      const text = item.title + " " + item.author + item.series;
      if (!text.includes(state.search)) return false;
    }

    // Author filter
    if (state.author && item.author !== state.author) return false;

    // Score range
    if (state.minScore) {
      const score = parseFloat(item.score || item.averagescore || 0);
      if (score < state.minScore) return false;
    }
    if (state.maxScore) {
      const score = parseFloat(item.score || item.averagescore || 0);
      if (score > state.maxScore) return false;
    }

    return true;
  });

}

// sort items by field and direction
function sortItems(items) {
  //console.log("sortItems");

  const field = state.sortField;
  const dir = state.sortDir === "asc" ? 1: -1;

  return items.sort((a,b) => {

    let A = a[field] || "";
    let B = b[field] || "";

    const nA = parseFloat(A);
    const nB = parseFloat(B);

    let result;

    if (!isNaN(nA) && !isNaN(nB)) {
      result = nA - nB;
    } else {
      result = A.localeCompare(B);
    }

    if (result !== 0) return result * dir;

    return a.title.localeCompare(b.title);
  });

}

// Calls filter and sort, then displays book cards
function render() {
  //console.log("render (method)");

  const grid = document.querySelector(".book-grid");

  const filtered = filterItems();
  //console.log(filtered);
  const sorted = sortItems(filtered);

  bookDataIndex.forEach(item => item.el.style.display = "none");

  sorted.forEach(item => {
    item.el.style.display = "";
    grid.appendChild(item.el);
  });

  updateLabels(filtered);

  updateURL();
}

//Labels to show various stats
function updateLabels(filtered) {

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
}

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

  render();
}
