document.addEventListener("DOMContentLoaded", () => {
  let allBuilds = [];
  let filteredBuilds = [];
  let currentPage = 1;
  const BUILDS_PER_PAGE = 15;

  const searchInput = document.getElementById("search");
  const cardsContainer = document.getElementById("cards");
  const paginationContainer = document.getElementById("pagination");
  const paginationButtons = document.getElementById("pagination-buttons");
  const paginationStatus = document.getElementById("pagination-status");
  const statusContainer = document.getElementById("status-container");

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const showStatus = (content) => {
    statusContainer.innerHTML = content;
    statusContainer.style.display = "flex";
    cardsContainer.style.display = "none";
    paginationContainer.style.display = "none";
  };

  const hideStatus = () => {
    statusContainer.innerHTML = "";
    statusContainer.style.display = "none";
    cardsContainer.style.display = "grid";
    paginationContainer.style.display = "flex";
  };

  const renderCards = () => {
    hideStatus();
    cardsContainer.innerHTML = "";

    if (filteredBuilds.length === 0) {
      showStatus("<div>No builds found. Try a different search.</div>");
      return;
    }

    const start = (currentPage - 1) * BUILDS_PER_PAGE;
    const end = start + BUILDS_PER_PAGE;
    const paginatedBuilds = filteredBuilds.slice(start, end);

    const fragment = document.createDocumentFragment();
    paginatedBuilds.forEach(({ url, img, name, author, tags }) => {
      if (!url || !img || !name || !author) return;

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-image-container">
          <img src="${img}" alt="${name}" loading="lazy" onerror="this.parentElement.style.display='none'">
        </div>
        <div class="card-content">
          <div class="name">${name}</div>
          <div class="author">By ${author}</div>
          <div class="tags">${tags || ""}</div>
          <a href="${url}" class="btn-download" download target="_blank" rel="noopener noreferrer">
            <i class="fa-solid fa-download"></i> Download
          </a>
        </div>
      `;
      fragment.appendChild(card);
    });
    cardsContainer.appendChild(fragment);
  };

  const createPageButton = (page, text, disabled = false, active = false) => {
    const btn = document.createElement("button");
    btn.className = "page-btn";
    btn.textContent = text || page;
    btn.disabled = disabled;
    if (active) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentPage = page;
      renderCards();
      renderPagination();
      window.scrollTo(0, 0);
    });
    return btn;
  };

  const renderPagination = () => {
    paginationButtons.innerHTML = "";
    const totalBuilds = filteredBuilds.length;
    const totalPages = Math.ceil(totalBuilds / BUILDS_PER_PAGE);

    const startItem = (currentPage - 1) * BUILDS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * BUILDS_PER_PAGE, totalBuilds);
    if (totalBuilds > 0) {
      paginationStatus.textContent = `Showing ${startItem}-${endItem} of ${totalBuilds} builds`;
    } else {
      paginationStatus.textContent = "";
    }

    if (totalPages <= 1) {
      paginationContainer.style.display = "none";
      return;
    }
    paginationContainer.style.display = "flex";

    paginationButtons.appendChild(
      createPageButton(currentPage - 1, "‹ Prev", currentPage === 1)
    );

    const pageWindow = 1;
    let pages = [];

    pages.push(createPageButton(1));

    if (currentPage > pageWindow + 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "page-ellipsis";
      ellipsis.textContent = "...";
      pages.push(ellipsis);
    }

    for (
      let i = Math.max(2, currentPage - pageWindow);
      i <= Math.min(totalPages - 1, currentPage + pageWindow);
      i++
    ) {
      pages.push(createPageButton(i));
    }

    if (currentPage < totalPages - pageWindow - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "page-ellipsis";
      ellipsis.textContent = "...";
      pages.push(ellipsis);
    }

    if (totalPages > 1) {
      pages.push(createPageButton(totalPages));
    }

    const uniquePages = [
      ...new Map(pages.map((item) => [item.textContent, item])).values(),
    ];
    uniquePages.forEach((p) => {
      if (p.textContent == currentPage) p.classList.add("active");
      paginationButtons.appendChild(p);
    });

    paginationButtons.appendChild(
      createPageButton(currentPage + 1, "Next ›", currentPage === totalPages)
    );
  };

  const handleSearch = debounce((event) => {
    const query = event.target.value.toLowerCase().trim();
    filteredBuilds = allBuilds.filter((build) => {
      const searchText = `${build.name} ${build.author} ${
        build.tags || ""
      }`.toLowerCase();
      return searchText.includes(query);
    });
    currentPage = 1;
    renderCards();
    renderPagination();
  }, 300);

  const init = () => {
    showStatus('<div class="spinner"></div>');
    Papa.parse("../data/builds.csv", {
      download: true,
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV Parsing Errors:", results.errors);
        }

        allBuilds = results.data
          .slice(1)
          .map((row) => {
            const data = row.filter((field) => field && field.trim() !== "");
            if (data.length < 4) return null;

            return {
              url: data[0],
              img: data[1],
              name: data[2],
              author: data[3],
              tags: data[4] || "",
            };
          })
          .filter(Boolean);

        filteredBuilds = [...allBuilds];

        if (allBuilds.length === 0) {
          showStatus(
            "<div>Could not find any builds. The data file might be empty or invalid.</div>"
          );
          return;
        }

        renderCards();
        renderPagination();
        searchInput.addEventListener("input", handleSearch);
      },
      error: (err) => {
        console.error("Failed to fetch or parse builds.csv:", err);
        showStatus(
          '<div><i class="fa-solid fa-triangle-exclamation"></i> Failed to load builds. Please check the file path and format.</div>'
        );
      },
    });
  };

  init();
});
