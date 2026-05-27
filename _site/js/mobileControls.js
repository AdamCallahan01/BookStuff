/* ---------------------------
Mobile formatting
--------------------------- */

const mobileSearchToggle = document.getElementById("mobileSearchToggle");

const searchShell = document.getElementById("searchShell");

mobileSearchToggle?.addEventListener("click", () => {
  searchShell.classList.toggle("visible");
  document.body.classList.toggle("mobile-search-open");
  document.body.classList.remove("mobile-nav-open");

  mobileNavPanel.classList.remove("visible");
});

const mobileNavToggle = document.getElementById("mobileNavToggle");

const mobileNavPanel = document.getElementById("mobileNavPanel");

mobileNavToggle?.addEventListener("click", () => {
  mobileNavPanel.classList.toggle("visible");
  document.body.classList.toggle("mobile-nav-open");
  document.body.classList.remove("mobile-search-open");

  searchShell.classList.remove("visible");
});

/* ---------------------------
Mobile homepage buttons
--------------------------- */

const leftSidebar = document.querySelector(".sidebar-left");

const rightSidebar = document.querySelector(".sidebar-right");

const backdrop = document.getElementById("sidebarBackdrop");

document.getElementById("leftSidebarToggle")?.addEventListener("click", () => {
  leftSidebar.classList.add("visible");
  rightSidebar.classList.remove("visible");
  backdrop.classList.add("visible");
});

document.getElementById("rightSidebarToggle")?.addEventListener("click", () => {
  rightSidebar.classList.add("visible");
  leftSidebar.classList.remove("visible");
  backdrop.classList.add("visible");
});

backdrop?.addEventListener("click", closeSidebars);

function closeSidebars() {
  leftSidebar.classList.remove("visible");
  if (rightSidebar) {
    rightSidebar.classList.remove("visible");
  }

  backdrop.classList.remove("visible");
}

/* ---------------------------
Mobile books page buttons
--------------------------- */

const leftFilterSidebar = document.querySelector(".sidebar-left");

document
  .getElementById("leftSidebarFilterToggle")
  ?.addEventListener("click", () => {
    leftFilterSidebar.classList.add("visible");
    backdrop.classList.add("visible");
  });
