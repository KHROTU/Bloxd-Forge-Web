async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function checkPassword() {
  const input = document.getElementById("password-input").value;
  const hash = await sha256(input);
  const validHash =
    "6caf7c13171dbb0598cd9b52dbb77e0d75f049c78c7d08ccd20307e95c021991";
  const keyHashB =
    "77af778b51abd4a3c51c5ddd97204a9c3ae614ebccb75a606c3b6865aed6744e";

  if (hash === validHash) {
    localStorage.setItem("isLoggedIn", "true");
    document.getElementById("password-popup").style.display = "none";
    document.getElementById("workspace").style.display = "block";
  } else if (hash === keyHashB) {
    localStorage.setItem("specialFeature1", "true");
    addSpecialItem("cat", "fas fa-cat", "Cat", "../images/cat.gif");
  } else {
    alert("Incorrect password. Please try again.");
  }
}

function addSpecialItem(id, iconClass, title, url) {
  const sidebar = document.getElementById("sidebar");
  const button = document.createElement("div");
  button.className = "icon-button";
  button.innerHTML = `<i class="${iconClass}"></i>`;
  button.onclick = () => openWindow(title, url, button);

  const header = document.getElementById("sidebar-header");
  sidebar.insertBefore(button, header);
}

function startTrial() {
  const trialDuration = 20 * 60 * 1000;
  const startTime = Date.now();
  localStorage.setItem("trialStartTime", startTime.toString());
  document.getElementById("password-popup").style.display = "none";
  document.getElementById("workspace").style.display = "block";
  document.getElementById("timer").style.display = "block";
  updateTimer();
}

function updateTimer() {
  const startTime = parseInt(localStorage.getItem("trialStartTime"));
  const trialDuration = 20 * 60 * 1000;
  const currentTime = Date.now();
  const timeLeft = trialDuration - (currentTime - startTime);

  if (timeLeft <= 0) {
    endTrial();
    return;
  }

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  document.getElementById(
    "timer"
  ).textContent = `Trial Time Left: ${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;

  requestAnimationFrame(updateTimer);
}

function endTrial() {
  localStorage.removeItem("trialStartTime");
  document.getElementById("password-popup").style.display = "flex";
  document.getElementById("workspace").style.display = "none";
  document.getElementById("timer").style.display = "none";
}

let zIndexCounter = 1;
function openWindow(title, url, iconElement) {
  const workspace = document.getElementById("workspace");
  const windowDiv = document.createElement("div");
  windowDiv.className = "window";

  const iconRect = iconElement.getBoundingClientRect();
  const workspaceRect = workspace.getBoundingClientRect();

  windowDiv.style.top = `${iconRect.top - workspaceRect.top}px`;
  windowDiv.style.left = `${iconRect.left - workspaceRect.left}px`;
  windowDiv.style.width = "400px";
  windowDiv.style.height = "300px";
  windowDiv.style.zIndex = zIndexCounter++;

  const header = document.createElement("div");
  header.className = "window-header";
  header.textContent = title;

  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.textContent = "✖";
  closeButton.onclick = () => closeWindow(windowDiv, iconElement);

  header.appendChild(closeButton);
  const iframe = document.createElement("iframe");
  iframe.src = url;
  windowDiv.appendChild(header);
  windowDiv.appendChild(iframe);

  workspace.appendChild(windowDiv);

  setTimeout(() => {
    windowDiv.style.top = "50px";
    windowDiv.style.left = "50px";
    windowDiv.classList.add("open");
  }, 0);

  header.onmousedown = function (e) {
    e.preventDefault();
    let offsetX = e.clientX - windowDiv.offsetLeft;
    let offsetY = e.clientY - windowDiv.offsetTop;
    let isDragging = true;

    function moveAt(mouseEvent) {
      if (isDragging) {
        const workspaceRect = workspace.getBoundingClientRect();
        windowDiv.style.transition = "none";
        const newLeft = Math.max(
          0,
          Math.min(
            workspaceRect.width - windowDiv.offsetWidth,
            mouseEvent.clientX - offsetX
          )
        );
        const newTop = Math.max(
          0,
          Math.min(
            workspaceRect.height - windowDiv.offsetHeight,
            mouseEvent.clientY - offsetY
          )
        );
        windowDiv.style.left = `${newLeft}px`;
        windowDiv.style.top = `${newTop}px`;
      }
    }

    document.addEventListener("mousemove", moveAt);
    document.onmouseup = () => {
      isDragging = false;
      document.removeEventListener("mousemove", moveAt);
      document.onmouseup = null;
      windowDiv.style.transition = "";
    };
  };

  windowDiv.onmousedown = () => (windowDiv.style.zIndex = zIndexCounter++);
}

function closeWindow(windowDiv, iconElement) {
  const iconRect = iconElement.getBoundingClientRect();
  const workspaceRect = workspace.getBoundingClientRect();

  windowDiv.classList.add("closing");
  windowDiv.classList.remove("open");

  windowDiv.style.top = `${iconRect.top - workspaceRect.top}px`;
  windowDiv.style.left = `${iconRect.left - workspaceRect.left}px`;

  setTimeout(() => {
    if (workspace.contains(windowDiv)) {
      workspace.removeChild(windowDiv);
    }
  }, 300);
}

const sidebar = document.getElementById("sidebar");
const dragHandle = document.getElementById("sidebar-drag-handle");
const toggleBtn = document.getElementById("sidebar-toggle-btn");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("retracted");
  localStorage.setItem(
    "sidebarRetracted",
    sidebar.classList.contains("retracted")
  );
});

let isDragging = false;
let dragOffsetX, dragOffsetY;

dragHandle.addEventListener("mousedown", (e) => {
  isDragging = true;
  dragOffsetX = e.clientX - sidebar.offsetLeft;
  dragOffsetY = e.clientY - sidebar.offsetTop;

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
});

function onDrag(e) {
  if (!isDragging) return;
  let newLeft = e.clientX - dragOffsetX;
  let newTop = e.clientY - dragOffsetY;

  const maxLeft = window.innerWidth - sidebar.offsetWidth;
  const maxTop = window.innerHeight - sidebar.offsetHeight;

  newLeft = Math.max(0, Math.min(newLeft, maxLeft));
  newTop = Math.max(0, Math.min(newTop, maxTop));

  sidebar.style.left = `${newLeft}px`;
  sidebar.style.top = `${newTop}px`;
}

function stopDrag() {
  isDragging = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);

  localStorage.setItem(
    "sidebarPosition",
    JSON.stringify({ top: sidebar.style.top, left: sidebar.style.left })
  );
}

window.addEventListener("DOMContentLoaded", () => {
  const isRetracted = localStorage.getItem("sidebarRetracted") === "true";
  if (isRetracted) {
    sidebar.classList.add("retracted");
  }

  const savedPosition = JSON.parse(localStorage.getItem("sidebarPosition"));
  if (savedPosition) {
    sidebar.style.top = savedPosition.top;
    sidebar.style.left = savedPosition.left;
  }

  const trialStartTime = localStorage.getItem("trialStartTime");
  if (trialStartTime) {
    const currentTime = Date.now();
    const timeElapsed = currentTime - parseInt(trialStartTime);
    if (timeElapsed < 20 * 60 * 1000) {
      document.getElementById("password-popup").style.display = "none";
      document.getElementById("workspace").style.display = "block";
      document.getElementById("timer").style.display = "block";
      updateTimer();
    } else {
      localStorage.removeItem("trialStartTime");
    }
  } else if (localStorage.getItem("isLoggedIn") === "true") {
    document.getElementById("password-popup").style.display = "none";
    document.getElementById("workspace").style.display = "block";
  }

  if (localStorage.getItem("specialFeature1") === "true") {
    addSpecialItem("cat", "fas fa-cat", "Cat", "../images/cat.gif");
  }
});
