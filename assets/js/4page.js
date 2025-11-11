const state = {
  auctions: [],
  csrfToken: null,
  userId: null,
  apiBaseUrl: "https://khrotu.pythonanywhere.com",
};
const ui = {
  grid: document.getElementById("auctionsGrid"),
  createModal: document.getElementById("createModal"),
  viewModal: document.getElementById("viewModal"),
  viewModalContent: document.getElementById("viewModalContent"),
  searchInput: document.getElementById("searchInput"),
};
const getUserId = () => {
  let id = localStorage.getItem("userId");
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("userId", id);
  }
  return id;
};
const fetchCsrfToken = async () => {
  try {
    state.userId = getUserId();
    const response = await fetch(`${state.apiBaseUrl}/get-csrf-token`, {
      headers: { "X-User-ID": state.userId },
    });
    if (!response.ok) throw new Error("Could not authenticate session.");
    const data = await response.json();
    state.csrfToken = data.csrf_token;
  } catch (error) {
    console.error("CSRF Error:", error);
    alert(
      "Fatal Error: Could not establish a secure session. Please refresh the page."
    );
  }
};
const fetchAuctions = async () => {
  try {
    const response = await fetch(`${state.apiBaseUrl}/api/auctions`);
    if (!response.ok) throw new Error("Failed to load market data.");
    state.auctions = await response.json();
    renderAuctions(state.auctions);
  } catch (error) {
    ui.grid.innerHTML = `<div class="no-results">${error.message}</div>`;
  }
};
const renderAuctions = (auctionsToRender) => {
  ui.grid.innerHTML = "";
  if (auctionsToRender.length === 0) {
    ui.grid.innerHTML = '<div class="no-results">No auctions found.</div>';
    return;
  }
  auctionsToRender.forEach((auction, index) => {
    const card = document.createElement("div");
    card.className = "auction-card";
    card.dataset.index = index;
    let hash = 0;
    for (let i = 0; i < auction.item_name.length; i++) {
      hash = auction.item_name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 50%, 60%)`;
    card.innerHTML = `
            <div class="card-image" style="background-color: ${color}"></div>
            <div class="card-content">
                <h3 class="card-title">${auction.item_name}</h3>
                <p class="card-info">Lobby: ${auction.lobby_type} ${auction.lobby_number}</p>
                <p class="card-price">Start: ${auction.starting_price} Coins</p>
            </div>
        `;
    card.addEventListener("click", () => openViewModal(index));
    ui.grid.appendChild(card);
  });
};
const openViewModal = (index) => {
  const auction = state.auctions[index];
  const hasBids = Array.isArray(auction.bids) && auction.bids.length > 0;
  const currentBid = hasBids
    ? auction.bids[auction.bids.length - 1].amount
    : auction.starting_price;
  const minNextBid = parseFloat(currentBid) + 1;

  ui.viewModalContent.innerHTML = `
        <button class="modal-close" onclick="closeModal('viewModal')">×</button>
        <h2 class="modal-title">${auction.item_name}</h2>
        <div class="form-group">
            <p class="card-info"><strong>Lobby:</strong> ${auction.lobby_type} ${auction.lobby_number}</p>
            <p class="card-info"><strong>Sale Type:</strong> ${auction.sale_type}</p>
            <p class="card-info"><strong>Description:</strong> ${auction.description}</p>
            <hr style="border-color: #444; margin: 1rem 0;">
            <p class="card-price" style="font-size: 1.5rem">Current Bid: ${currentBid} Coins</p>
        </div>
        <form id="bidForm" data-auction-id="${index}">
            <div class="form-group">
                <label for="bidAmount" class="form-label">Your Bid (min. ${minNextBid})</label>
                <input type="number" id="bidAmount" class="form-input" placeholder="Enter amount" required min="${minNextBid}">
            </div>
            <div class="error-message" id="bidError"></div>
            <div class="modal-actions">
                <button type="submit" class="btn btn-submit">Place Bid</button>
            </div>
        </form>
    `;
  ui.viewModal.classList.add("active");
  document
    .getElementById("bidForm")
    .addEventListener("submit", handleBidSubmit);
};
const handleBidSubmit = async (event) => {
  event.preventDefault();
  const form = event.target;
  const auctionId = form.dataset.auctionId;
  const bidAmount = form.querySelector("#bidAmount").value;
  const errorDiv = form.querySelector("#bidError");
  if (!state.csrfToken) {
    errorDiv.textContent = "Session invalid. Please refresh.";
    errorDiv.style.display = "block";
    return;
  }
  try {
    const response = await fetch(
      `${state.apiBaseUrl}/api/auctions/${auctionId}/bid`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": state.userId,
          "X-CSRF-Token": state.csrfToken,
        },
        body: JSON.stringify({ bid_amount: bidAmount }),
      }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to place bid.");
    alert("Bid placed successfully!");
    closeModal("viewModal");
    await fetchAuctions();
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = "block";
  }
};
const handleCreateSubmit = async (event) => {
  event.preventDefault();
  const form = event.target;
  const errorDiv = form.querySelector("#createError");
  errorDiv.style.display = "none";
  if (!state.csrfToken) {
    errorDiv.textContent = "Session invalid. Please refresh.";
    errorDiv.style.display = "block";
    return;
  }
  const data = {
    item_name: document.getElementById("itemName").value,
    lobby_type: document.getElementById("lobbyType").value,
    lobby_number: document.getElementById("lobbyNumber").value,
    sale_type: document.getElementById("saleType").value,
    starting_price: document.getElementById("startingPrice").value,
    buyout_price: document.getElementById("buyoutPrice").value,
    description: document.getElementById("description").value,
  };
  try {
    const response = await fetch(`${state.apiBaseUrl}/api/auctions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": state.userId,
        "X-CSRF-Token": state.csrfToken,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to create auction.");
    closeModal("createModal");
    await fetchAuctions();
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = "block";
  }
};
const openModal = (id) => document.getElementById(id).classList.add("active");
const closeModal = (id) => {
  const modal = document.getElementById(id);
  modal.classList.remove("active");
  if (modal.querySelector("form")) modal.querySelector("form").reset();
  const errorDiv = modal.querySelector(".error-message");
  if (errorDiv) errorDiv.style.display = "none";
};
document.addEventListener("DOMContentLoaded", async () => {
  await fetchCsrfToken();
  await fetchAuctions();
});
ui.searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = state.auctions.filter((auction) =>
    auction.item_name.toLowerCase().includes(query)
  );
  renderAuctions(filtered);
});
document.getElementById("openCreateModalBtn").addEventListener("click", (e) => {
  e.preventDefault();
  openModal("createModal");
});
document
  .getElementById("closeCreateModalBtn")
  .addEventListener("click", () => closeModal("createModal"));
document
  .getElementById("createAuctionForm")
  .addEventListener("submit", handleCreateSubmit);
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});
