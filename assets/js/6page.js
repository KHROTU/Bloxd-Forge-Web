const container = document.getElementById("card-container");
const searchInput = document.querySelector(".search-bar");
const detailsView = document.getElementById("details-view");
const detailsContent = document.getElementById("details-content");

let allData = [];
let currentSearchFilter = "title";

async function fetchWikiData() {
  const url = "../data/wiki.json";
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

async function loadFiles() {
  const wikiData = await fetchWikiData();
  allData = wikiData;
  renderCards(allData);
}

function renderCards(data) {
  container.innerHTML = "";
  data.forEach((item) => createCard(item));
}

function createCard(data) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
        <div class="card-content">
            <h2>${data.title} <span class="tag">${data.tag}</span></h2>
            <p>${data.description}</p>
        </div>
    `;
  card.onclick = () => showDetails(data);
  container.appendChild(card);
}

function showDetails(data) {
  detailsView.classList.add("active");
  detailsContent.innerHTML = `
        <h1>${data.title}</h1>
        <h3>Description</h3>
        <p>${data.description}</p>
        <h3>Content</h3>
        <p class="line-break">${data.content}</p>
    `;
}

function goBack() {
  detailsView.classList.remove("active");
}

function toggleSearchFilter() {
  const menu = document.getElementById("searchFilterMenu");
  menu.classList.toggle("active");
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("searchFilterMenu");
  const filterBtn = document.querySelector(".search-filter-btn");

  if (!menu.contains(e.target) && !filterBtn.contains(e.target)) {
    menu.classList.remove("active");
  }
});

document.querySelectorAll(".filter-option").forEach((option) => {
  option.addEventListener("click", () => {
    currentSearchFilter = option.dataset.filter;
    document.querySelector(
      ".search-bar"
    ).placeholder = `Search in ${option.textContent.toLowerCase()}...`;
    toggleSearchFilter();
    document.querySelector(".search-bar").focus();
  });
});

searchInput.addEventListener("input", () => {
  const searchTerm = searchInput.value.toLowerCase();
  const filteredData = allData.filter((data) => {
    if (
      data.title.toLowerCase() ===
      "whoa there, adventurer! (or should I say, 'eternal scroller'?)"
    ) {
      return searchTerm === "";
    }
    switch (currentSearchFilter) {
      case "title":
        return data.title.toLowerCase().includes(searchTerm);
      case "tag":
        return data.tag.toLowerCase().includes(searchTerm);
      case "description":
        return data.description.toLowerCase().includes(searchTerm);
      default:
        return false;
    }
  });
  renderCards(filteredData);
});

function openIframe(url) {
  const modal = document.getElementById("iframeModal");
  const iframe = document.getElementById("modalIframe");
  iframe.src = url;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeIframe() {
  const modal = document.getElementById("iframeModal");
  const iframe = document.getElementById("modalIframe");
  iframe.src = "";
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
}

window.onclick = function (event) {
  const modal = document.getElementById("iframeModal");
  if (event.target == modal) {
    closeIframe();
  }
};

function toggleMoreCards() {
  const moreCards = document.getElementById("moreFeaturedCards");
  const btn = document.getElementById("toggleMoreBtn");
  if (moreCards.style.display === "none" || moreCards.style.display === "") {
    moreCards.style.display = "grid";
    btn.textContent = "Show Less Guides";
  } else {
    moreCards.style.display = "none";
    btn.textContent = "Show More";
  }
}

loadFiles();
