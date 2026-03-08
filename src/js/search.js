let index;
let docs;

const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("searchResults");
const optionsBtn = document.getElementById("searchOptionsBtn");
const optionsDropdown = document.getElementById("searchOptionsDropdown");
const includeSummariesCheckbox = document.getElementById("includeSummaries");

// Debug
//console.log("search.js loaded");
//console.log(document.getElementById("searchInput"));
//console.log(document.getElementById("searchResults"));

/* ---------------------------
LOAD SEARCH DATA
--------------------------- */

fetch("/search-index.json")
  .then(r => r.json())
  .then(data => {

    docs = data;

    index = elasticlunr(function () {
      this.setRef("id");

      this.addField("title");
      this.addField("author");
      this.addField("series");
      this.addField("summary");
    });

    docs.forEach(doc => index.addDoc(doc));

    //console.log(docs[0]); 
    //console.log(index.search("harry-potter-and-the-sorcerer-s-stone-rowling")); 

  });

  
/* ---------------------------
INPUT LISTENER (debounced)
--------------------------- */

let debounceTimer;

searchInput.addEventListener("input", e => {
  //console.log("typing:", searchInput.value);

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    runSearch(e.target.value.trim());
  }, 100);

  // if (!searchInput) return;

  // const query = searchInput.value.trim();
  // console.log(query);

  // runSearch(query, { expand: true });

});

/* ---------------------------
SEARCH FUNCTION
--------------------------- */

function runSearch(query) {
  //console.log(query);

  if (!index) {
    console.log("No index");
    resultsContainer.innerHTML = "";
    return;
  }

  const includeSummaries = includeSummariesCheckbox.checked;

  const results = index.search(query, {

    fields: {
      title: { boost: 5 },
      author: { boost: 3 },
      series: { boost: 2 },
      summary: includeSummaries ? { boost: 1 } : { boost: 0 }
    },

    expand: true,
    bool: "OR"

  });

  //console.log(results);
  const matches = results.map(r => docs.find(d => d.id === r.ref));
  //console.log(matches.slice(0,10));

  renderResults(matches.slice(0, 10));

}



/* ---------------------------
RENDER RESULTS
--------------------------- */

function renderResults(results) {

  resultsContainer.innerHTML = "";

  if (results.length === 0) {
    resultsContainer.innerHTML = "<div class='search-empty'>No results</div>";
    console.log("Result length for search was 0");
    return;
  }

  results.forEach(book => {

    // debugging
    //console.log(book);
    //console.log(resultsContainer);
    const item = document.createElement("a");
    item.href = book.url;
    item.className = "search-result-item";

    item.innerHTML = `
      <img class="search-cover" src="/files/covers/${book.coverSlug}.jpg">

      <div class="search-text">
        <div class="search-title">${book.title}</div>
        <div class="search-meta">${book.author}${book.series ? " • " + book.series : ""}</div>
      </div>
    `;

    //console.log(item);

    resultsContainer.appendChild(item);

  });

  resultsContainer.classList.add("visible");

}


/* ---------------------------
OPTIONS DROPDOWN
--------------------------- */

optionsBtn.addEventListener("click", () => {
  optionsDropdown.classList.toggle("visible");
});


document.addEventListener("click", e => {

  if (!e.target.closest(".search-options-wrapper")) {
    optionsDropdown.classList.remove("visible");
  }

});

document.addEventListener("click", e => {

  if (!e.target.closest(".search-results-dropdown")) {
    resultsContainer.classList.remove("visible");
  }

});

searchInput.addEventListener("click", e => {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    runSearch(e.target.value.trim());
  }, 120);
});


/* ---------------------------
RESEARCH WHEN OPTION CHANGES
--------------------------- */

includeSummariesCheckbox.addEventListener("change", () => {
  runSearch(searchInput.value.trim());
});
