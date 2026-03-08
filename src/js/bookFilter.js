// const grid = document.getElementById("booksView");
// const sortField = document.getElementById("sortField");
// const sortDirection = document.getElementById("sortDirection");

// function sortBooks() {
//   const field = sortField.value.toLowerCase();
//   const direction = sortDirection.value;

//   //console.log(grid);

//   const books = Array.from(grid.querySelectorAll(".book-card"));

//   books.sort((a, b) => {
//     let valA = a.dataset[field];
//     let valB = b.dataset[field];

//     // numeric comparison if possible
//     const numA = parseFloat(valA);
//     const numB = parseFloat(valB);

//     if (!isNaN(numA) && !isNaN(numB)) {
//       return direction === "asc" ? numA - numB : numB - numA;
//     }

//     // string comparison
//     return direction === "asc"
//       ? valA.localeCompare(valB)
//       : valB.localeCompare(valA);
//   });

//   books.forEach(book => grid.appendChild(book));
// }

// sortField.addEventListener("change", sortBooks);
// sortDirection.addEventListener("change", sortBooks);

// // Reads vs Books
// const toggle = document.getElementById("combineToggle");
// const booksView = document.getElementById("booksView");
// const readsView = document.getElementById("readsView");

// toggle.addEventListener("change", () => {
//   if (toggle.checked) {
//     booksView.style.display = "";
//     readsView.style.display = "none";
//   } else {
//     booksView.style.display = "none";
//     readsView.style.display = "";
//   }
// });


//
//    TESTING
//

const cards = Array.from(document.querySelectorAll(".book-card"));

const bookDataIndex = cards.map(el => ({
  el,
  ...el.dataset
}));

const state = {
  view: "books",
  search: "",
  author: "",
  minScore: null,
  sortField: "title",
  sortDir: true //Ascending
  //Num of reads
  //Series order
  //Score change read to read
  //time reading
  //length (pages)
  //year released
  //
};


// Author filter
const authors = [...new Set(bookDataIndex.map(i => i.author))].sort();
const select = document.getElementById("authorFilter");

authors.forEach(author=>{
  const opt = document.createElement("option");
  opt.value = author;
  opt.textContent = author;
  select.appendChild(opt);
});

//console.log(cards);
//console.log(bookDataIndex);

const combineToggle = document.getElementById("combineToggle");
const searchTextInput = document.getElementById("booksSearchInput");
const authorFilter = document.getElementById("authorFilter");
const scoreFilter = document.getElementById("scoreFilter");
const sortField = document.getElementById("sortField");
const sortDirection = document.getElementById("sortDirection");

combineToggle.addEventListener("change", updateState);
authorFilter.addEventListener("change", updateState);
scoreFilter.addEventListener("change", updateState);
sortField.addEventListener("change", updateState);
sortDirection.addEventListener("change", updateState);

const resetButton = document.getElementById("filterResetButton");
resetButton.addEventListener("click", resetFilters);

function resetFilters() {
  //console.log("reset filter");

  state.view = "books",
  state.search = "",
  state.author = "",
  state.minScore = null,
  state.sortField = "title",
  state.sortDir = true

  combineToggle.checked = true;
  searchTextInput.value = "";
  authorFilter.selectedIndex = 0;
  //scoreFilter
  sortField.selectedIndex = 0;
  sortDirection.selectedIndex = 0;

  render();
}

//Check every field and set state accordingly
function updateState() {
  //console.log("updateState");

  const newView = combineToggle.checked ? "books" : "reads";

  const newSearch = searchTextInput.value.toLowerCase();

  const newAuthor = authorFilter.options[authorFilter.selectedIndex].value.toLowerCase();

//   newScore = scoreFilter.number();

  const newField = sortField.options[sortField.selectedIndex].value.toLowerCase();

  const newSortDir = sortDirection.options[sortDirection.selectedIndex].value === "asc" ? true : false;

  state.view = newView;
  state.search = newSearch;
  state.author = newAuthor;
//   state.minScore = newScore;
  state.sortField = newField;
  state.sortDir = newSortDir;

  render();
}

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

    return true;
  });

}

function sortItems(items) {
  //console.log("sortItems");

  const field = state.sortField;
  const dir = state.sortDir ? 1: -1;

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

}

function updateURL() {
  console.log("updateURL");

  const params = new URLSearchParams();

  if (state.author) params.set("author", state.author);
  if (state.minScore) params.set("score", state.minScore);
  params.set("sort", state.sortField);
  params.set("dir", state.sortDir);

  history.replaceState(null,"","?"+params.toString());
}
