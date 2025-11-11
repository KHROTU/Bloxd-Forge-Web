const start = document.getElementById("start");
const iframeContainer = document.getElementById("iframe-container");
const iframe = document.getElementById("iframe");
const menustart = document.getElementById("menu");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const closemenuButton = document.getElementById("close-menu");
const coordinateSaverToggle = document.getElementById(
  "coordinate-saver-toggle"
);
const coordinateSaver = document.getElementById("coordinate-saver");
const saveButton = document.getElementById("save-button");
const coordinatesList = document.getElementById("coordinates-list");
const darkOverlay = document.getElementById("dark-overlay");
const dragButton = document.getElementById("drag-button");
const featuredWorldName = document.getElementById("featured-world-name");
const draggableWindow = document.getElementById("draggable-window");
const draggableWindowHeader = document.getElementById(
  "draggable-window-header"
);
const draggableWindowClose = document.getElementById("draggable-window-close");
const draggableWindowIframe = document.getElementById(
  "draggable-window-iframe"
);
let offsetX, offsetY;

async function loadWorlds() {
  const response = await fetch("../data/worlds.json");
  const worlds = await response.json();
  const randomWorld = worlds[Math.floor(Math.random() * worlds.length)];
  featuredWorldName.textContent = decodeURIComponent(randomWorld.name);
  featuredWorldName.dataset.name = randomWorld.name;
  featuredWorldName.dataset.type = randomWorld.type;
}

function loadCoordinates() {
  const savedCoordinates =
    JSON.parse(localStorage.getItem("coordinates")) || [];
  savedCoordinates.forEach((coord) => {
    const li = document.createElement("li");
    li.textContent = `${coord.name}: (${coord.x}, ${coord.y}, ${coord.z})`;
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      deleteCoordinate(coord);
      li.remove();
    });
    li.appendChild(deleteButton);
    coordinatesList.appendChild(li);
  });
}

function saveCoordinate(x, y, z, name) {
  const coordinates = JSON.parse(localStorage.getItem("coordinates")) || [];
  coordinates.push({ x, y, z, name });
  localStorage.setItem("coordinates", JSON.stringify(coordinates));
}

function deleteCoordinate(coord) {
  const coordinates = JSON.parse(localStorage.getItem("coordinates")) || [];
  const filteredCoordinates = coordinates.filter(
    (c) =>
      !(
        c.x === coord.x &&
        c.y === coord.y &&
        c.z === coord.z &&
        c.name === coord.name
      )
  );
  localStorage.setItem("coordinates", JSON.stringify(filteredCoordinates));
}

function openmenu() {
  menustart.style.display = "flex";
}

closemenuButton.addEventListener("click", () => {
  menustart.style.display = "none";
});

darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  darkOverlay.style.display = document.body.classList.contains("dark-mode")
    ? "block"
    : "none";
});

coordinateSaverToggle.addEventListener("click", () => {
  coordinateSaver.style.display = "block";
});

document
  .getElementById("close-coordinate-saver")
  .addEventListener("click", () => {
    coordinateSaver.style.display = "none";
  });

saveButton.addEventListener("click", () => {
  const x = document.getElementById("x").value;
  const y = document.getElementById("y").value;
  const z = document.getElementById("z").value;
  const name = document.getElementById("name").value;

  if (x && y && z && name) {
    saveCoordinate(x, y, z, name);
    loadCoordinates();
  }
});

function openUrl(url) {
  start.style.display = "none";
  iframeContainer.style.display = "block";
  iframe.src = url;
}

document
  .getElementById("bloxd")
  .addEventListener("click", () => openUrl("https://bloxd.io"));
document
  .getElementById("bloxd-staging")
  .addEventListener("click", () => openUrl("https://staging.bloxd.io"));
document
  .getElementById("world-forge")
  .addEventListener("click", () =>
    window.open("https://bloxdforge.com/studio", "_blank")
  );
document.getElementById("bigbutton").addEventListener("click", () => {
  const name = featuredWorldName.dataset.name;
  const type = featuredWorldName.dataset.type;
  openUrl(`https://bloxd.io/?lobby=${name}&g=${type}`);
});

dragButton.addEventListener("click", () => {
  openmenu();
});

let isDragging = false;

dragButton.addEventListener("mousedown", (e) => {
  isDragging = false;
  offsetX = e.clientX - dragButton.offsetLeft;
  offsetY = e.clientY - dragButton.offsetTop;
  dragButton.style.transition = "none";
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
});

function onDrag(e) {
  isDragging = true;
  const left = e.clientX - offsetX;
  const top = e.clientY - offsetY;

  const maxX = window.innerWidth - dragButton.offsetWidth;
  const maxY = window.innerHeight - dragButton.offsetHeight;

  dragButton.style.left = `${Math.min(Math.max(0, left), maxX)}px`;
  dragButton.style.top = `${Math.min(Math.max(0, top), maxY)}px`;
}

function stopDrag() {
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
  dragButton.style.transition = "";
}

dragButton.addEventListener("click", (e) => {
  if (isDragging) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;
    return;
  }
  openmenu();
});

let scaleFactor = 1;

function applyResolutionScale(scale) {
  const iframe = document.getElementById("iframe");
  const iframeContainer = document.getElementById("iframe-container");
  iframe.style.transform = `scale(${scale})`;
  iframe.style.transformOrigin = "top left";
  iframeContainer.style.width = `${100 / scale}%`;
  iframeContainer.style.height = `${100 / scale}%`;
}

function openResolutionMenu() {
  const resolutionMenu = document.getElementById("resolution-menu");
  const resolutionInput = document.getElementById("resolution-scale");
  resolutionInput.value = "";
  resolutionMenu.style.display = "block";
}

function handleResolutionSubmission() {
  const resolutionInput = document.getElementById("resolution-scale");
  const scale = parseFloat(resolutionInput.value);

  if (!isNaN(scale) && scale > 0) {
    applyResolutionScale(scale);
    document.getElementById("resolution-menu").style.display = "none";
  } else {
    alert("Invalid resolution scale entered. Please enter a positive number.");
  }
}

document
  .getElementById("resolution-toggle")
  .addEventListener("click", openResolutionMenu);
document
  .getElementById("apply-resolution")
  .addEventListener("click", handleResolutionSubmission);
document
  .getElementById("close-resolution-menu")
  .addEventListener("click", () => {
    document.getElementById("resolution-menu").style.display = "none";
  });

const fpsPingToggle = document.getElementById("fps-ping-toggle");
const fpsPingDisplay = document.getElementById("fps-ping-display");
const fpsDisplay = document.getElementById("fps-display");
const pingDisplay = document.getElementById("ping-display");

let showFpsPing = false;
let lastFrameTime = performance.now();
let frameCount = 0;

function updateFPS() {
  const now = performance.now();
  frameCount++;
  if (now - lastFrameTime >= 1000) {
    const fps = frameCount;
    fpsDisplay.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastFrameTime = now;
  }
  if (showFpsPing) {
    requestAnimationFrame(updateFPS);
  }
}

function updatePing() {
  const img = new Image();
  const start = performance.now();

  img.onload = () => {
    const end = performance.now();
    const ping = Math.round(end - start);
    pingDisplay.textContent = `Ping: ${ping} ms`;
  };

  img.onerror = () => {
    pingDisplay.textContent = "Ping: Error";
  };

  img.src = "https://bloxd.io/favicon.ico?" + Math.random();

  if (showFpsPing) {
    setTimeout(updatePing, 1000);
  }
}

fpsPingToggle.addEventListener("click", () => {
  showFpsPing = !showFpsPing;
  fpsPingDisplay.style.display = showFpsPing ? "block" : "none";
  if (showFpsPing) {
    updateFPS();
    updatePing();
  }
});

const filtermenuToggle = document.getElementById("filter-menu-toggle");
const filtermenu = document.getElementById("filter-menu");
const filterSelect = document.getElementById("filter-select");
const applyFilterButton = document.getElementById("apply-filter");
const closeFiltermenuButton = document.getElementById("close-filter-menu");

filtermenuToggle.addEventListener("click", () => {
  filtermenu.style.display = "block";
});

closeFiltermenuButton.addEventListener("click", () => {
  filtermenu.style.display = "none";
});

applyFilterButton.addEventListener("click", () => {
  const selectedFilter = filterSelect.value;
  const iframe = document.getElementById("iframe");

  iframe.style.filter = "none";

  switch (selectedFilter) {
    case "grayscale":
      iframe.style.filter = "grayscale(100%)";
      break;
    case "sepia":
      iframe.style.filter = "sepia(100%)";
      break;
    case "saturate":
      iframe.style.filter = "saturate(130%)";
      break;
    case "contrast":
      iframe.style.filter = "contrast(130%)";
      break;
  }

  filtermenu.style.display = "none";
});

document.getElementById("close-iframe").addEventListener("click", function () {
  iframe.src = "about:blank";
  iframeContainer.style.display = "none";
  start.style.display = "grid";
  menustart.style.display = "none";
});

document
  .getElementById("draggable-window-toggle")
  .addEventListener("click", () => {
    draggableWindow.style.display = "block";
  });

draggableWindowClose.addEventListener("click", () => {
  draggableWindow.style.display = "none";
});

draggableWindowHeader.addEventListener("mousedown", (e) => {
  isDragging = false;
  offsetX = e.clientX - draggableWindow.offsetLeft;
  offsetY = e.clientY - draggableWindow.offsetTop;
  draggableWindow.style.transition = "none";
  document.addEventListener("mousemove", onDragWindow);
  document.addEventListener("mouseup", stopDragWindow);
});

function onDragWindow(e) {
  isDragging = true;
  const left = e.clientX - offsetX;
  const top = e.clientY - offsetY;

  draggableWindow.style.left = `${left}px`;
  draggableWindow.style.top = `${top}px`;
}

function stopDragWindow() {
  document.removeEventListener("mousemove", onDragWindow);
  document.removeEventListener("mouseup", stopDragWindow);
  draggableWindow.style.transition = "";
}

const menuCustomizeToggle = document.getElementById("menu-customize-toggle");

function createMenuCustomizationModal() {
  const modal = document.getElementById("menu-customize-modal");
  modal.innerHTML = `
    <div class="menu-customize-content">
      <h2>Customize Menu</h2>
      <div id="menu-customize-list"></div>
      <div class="menu-customize-modal-buttons">
        <button onclick="saveMenuCustomization()">Save Changes</button>
        <button onclick="closeMenuCustomizationModal()">Cancel</button>
      </div>
    </div>
  `;
}

function populateMenuCustomizationModal() {
  const menuList = document.getElementById("menu-customize-list");
  const sidebarLinks = document.querySelectorAll(".menu-option");
  menuList.innerHTML = "";

  sidebarLinks.forEach((link, index) => {
    const menuItem = document.createElement("div");
    menuItem.className = "menu-customize-item";
    menuItem.style.display = "flex";
    menuItem.style.alignItems = "center";
    menuItem.style.minWidth = "50px";

    const label = document.createElement("label");
    const description = link.querySelector(".description");
    label.textContent = description
      ? description.textContent
      : link.textContent.trim();
    label.style.flexGrow = "1";
    label.style.marginRight = "10px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !link.classList.contains("hidden-menu-item");
    checkbox.dataset.index = index;
    checkbox.style.flexShrink = "0";

    menuItem.appendChild(label);
    menuItem.appendChild(checkbox);
    menuList.appendChild(menuItem);
  });
}

function openMenuCustomizationModal() {
  const modal = document.getElementById("menu-customize-modal");
  modal.style.display = "flex";
  populateMenuCustomizationModal();
}

function loadMenuCustomization() {
  const sidebarLinks = document.querySelectorAll(".menu-option");
  const hiddenMenuItems = JSON.parse(
    localStorage.getItem("hiddenMenuItems") || "[]"
  );

  sidebarLinks.forEach((link) => {
    const menuText =
      link.querySelector("span")?.textContent ||
      link.querySelector(".description")?.textContent ||
      link.textContent.trim();

    if (hiddenMenuItems.includes(menuText)) {
      link.classList.add("hidden-menu-item");
      link.style.display = "none";
    }
  });

  const style = document.createElement("style");
  style.textContent = `
    .menu-option.hidden-menu-item {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

function saveMenuCustomization() {
  const checkboxes = document.querySelectorAll(
    '#menu-customize-list input[type="checkbox"]'
  );
  const sidebarLinks = document.querySelectorAll(".menu-option");
  const customizeButton = document.getElementById("menu-customize-toggle");

  const hiddenMenuItems = [];

  checkboxes.forEach((checkbox, index) => {
    const link = sidebarLinks[index];
    if (link === customizeButton) {
      checkbox.checked = true;
      return;
    }

    const menuText =
      link.querySelector("span")?.textContent ||
      link.querySelector(".description")?.textContent ||
      link.textContent.trim();

    if (!checkbox.checked) {
      link.classList.add("hidden-menu-item");
      link.style.display = "none";
      hiddenMenuItems.push(menuText);
    } else {
      link.classList.remove("hidden-menu-item");
      link.style.display = "";
    }
  });

  localStorage.setItem("hiddenMenuItems", JSON.stringify(hiddenMenuItems));
  closeMenuCustomizationModal();
}

function closeMenuCustomizationModal() {
  const modal = document.getElementById("menu-customize-modal");
  modal.style.display = "none";
}

function openMenuCustomizationModal() {
  const modal = document.getElementById("menu-customize-modal");
  populateMenuCustomizationModal();
  modal.style.display = "flex";
}

menuCustomizeToggle.addEventListener("click", openMenuCustomizationModal);

loadCoordinates();
loadWorlds();
loadMenuCustomization();

const NewModToggle = document.getElementById("new-mod");

function createNewModModal() {
  const modal = document.getElementById("new-mod-modal");
  modal.innerHTML = `
    <div class="new-mod-content">
      <h2>New Mod</h2>
      <div id="new-mod-list"></div>
      <div class="new-mod-modal-buttons">
        <button onclick="CreateNewMod()">Create</button>
        <button onclick="closeMenuCustomizationModal()">Cancel</button>
      </div>
    </div>
  `;
}

function closeNewModModal() {
  const modal = document.getElementById("new-mod-modal");
  modal.style.display = "none";
}

function openNenModModal() {
  const modal = document.getElementById("new-mod-modal");
  modal.style.display = "flex";
}

NewModToggle.addEventListener("click", openNenModModal);

function UploadHTML() {
  const modal = document.getElementById("UploadHTMLModal");
  modal.style.display = "flex";
}

function closeCHTMLModal() {
  const modal = document.getElementById("UploadHTMLModal");
  modal.style.display = "none";
}

window.onload = function () {
  loadMods();
};

function CreateNewMod() {
  const modName = document.getElementById("NewModName").value;
  const modIcon = document.getElementById("NewModIcon").value;
  const customHtml = document.getElementById("customHtml").value;
  if (!modName || !modIcon || !customHtml) {
    alert("Please provide Mod Name, Mod Icon, and Custom HTML!");
    return;
  }
  const newMod = {
    name: modName,
    icon: modIcon,
    html: customHtml,
  };
  const mods = JSON.parse(localStorage.getItem("mods")) || [];
  mods.push(newMod);
  localStorage.setItem("mods", JSON.stringify(mods));
  addModToUI(newMod);
  document.getElementById("NewModName").value = "";
  document.getElementById("NewModIcon").value = "";
  document.getElementById("customHtml").value = "";
}

function loadMods() {
  const mods = JSON.parse(localStorage.getItem("mods")) || [];
  mods.forEach((mod) => {
    addModToUI(mod);
  });
}

function addModToUI(mod) {
  const newModDiv = document.createElement("div");
  newModDiv.classList.add("menu-option");
  const iconElement = document.createElement("i");
  iconElement.classList.add("fas", mod.icon);
  const modNameElement = document.createElement("div");
  modNameElement.textContent = mod.name;
  const descriptionElement = document.createElement("span");
  descriptionElement.classList.add("description");
  descriptionElement.textContent = "Custom Mod";
  newModDiv.appendChild(iconElement);
  newModDiv.appendChild(modNameElement);
  newModDiv.appendChild(descriptionElement);
  newModDiv.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    console.log("Right-click detected");
    const contextMenu = document.createElement("div");
    contextMenu.className = "context-menu";
    contextMenu.style.position = "absolute";
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.zIndex = "10002";
    contextMenu.style.backgroundColor = "#444";
    contextMenu.style.color = "#fff";
    contextMenu.style.borderRadius = "10px";
    contextMenu.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.5)";
    contextMenu.innerHTML = `
          <div class='context-menu-item' id='remove-mod'>Remove Mod</div>
      `;
    document.body.appendChild(contextMenu);
    console.log("Context menu created");
    contextMenu.querySelector("#remove-mod").addEventListener("click", () => {
      console.log("Remove Mod clicked");
      const modToRemove = newModDiv;
      const mods = JSON.parse(localStorage.getItem("mods")) || [];
      const updatedMods = mods.filter((m) => m.name !== mod.name);
      localStorage.setItem("mods", JSON.stringify(updatedMods));
      modToRemove.remove();
      document.body.removeChild(contextMenu);
    });
    document.addEventListener("click", (event) => {
      if (!contextMenu.contains(event.target)) {
        document.body.removeChild(contextMenu);
      }
    });
  });

  newModDiv.addEventListener("click", function () {
    openModWindow(mod.name, mod.html);
  });

  document.getElementById("menu-grid").appendChild(newModDiv);
}

function openModWindow(modName, customHtml) {
  const modWindow = document.createElement("div");
  modWindow.className = "draggable-window";
  modWindow.style.position = "fixed";
  modWindow.style.top = "50px";
  modWindow.style.left = "50px";
  modWindow.style.backgroundColor = "#2c2c2c";
  modWindow.style.color = "#fff";
  modWindow.style.borderRadius = "10px";
  modWindow.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.5)";
  modWindow.style.width = "400px";
  modWindow.style.height = "500px";
  modWindow.style.zIndex = "10001";
  modWindow.innerHTML = `
      <div class="draggable-header" style="background-color: #3c3c3c; padding: 15px; display: flex; justify-content: space-between; align-items: center; cursor: move; border-top-left-radius: 10px; border-top-right-radius: 10px; user-select: none; -webkit-user-select: none;">
          <span style="font-weight: bold;">${modName}</span>
          <button class="draggable-close" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
      </div>
      <iframe class="draggable-iframe" style="width: 100%; height: calc(100% - 50px); border: none; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;" srcdoc="${escapeHtml(
        customHtml
      )}"></iframe>
  `;
  modWindow.querySelector(".draggable-close").addEventListener("click", () => {
    modWindow.remove();
  });
  document.body.appendChild(modWindow);
  makeDraggable(modWindow);
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function makeDraggable(element) {
  const header = element.querySelector(".draggable-header");
  let offsetX = 0,
    offsetY = 0,
    isDragging = false;
  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    element.style.left = `${e.clientX - offsetX}px`;
    element.style.top = `${e.clientY - offsetY}px`;
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

const recordmenuToggle = document.getElementById("record-menu-toggle");
const recordMenu = document.getElementById("record-menu");

if (recordmenuToggle && recordMenu) {
  recordmenuToggle.addEventListener("click", () => {
    recordMenu.style.display =
      recordMenu.style.display === "block" ? "none" : "block";
  });
  function closeRecordMenu() {
    recordMenu.style.display = "none";
  }
  const closeRecordMenuBtn = document.getElementById("close-record-menu");
  if (closeRecordMenuBtn) {
    closeRecordMenuBtn.addEventListener("click", closeRecordMenu);
  }
}

let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];

async function startStream() {
  try {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "monitor",
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });
    const recordingBtn = document.getElementById("recordingbt");
    if (recordingBtn) {
      recordingBtn.disabled = false;
    }
    mediaStream.getVideoTracks()[0].onended = () => {
      stopRecording();
    };
  } catch (err) {
    console.error("Error capturing media:", err);
    alert(
      "Failed to start screen sharing. Please ensure permissions are granted."
    );
  }
}

function startRecording() {
  if (!mediaStream) {
    console.error("No media stream available");
    return;
  }
  if (typeof mediaStream.active !== "undefined" && !mediaStream.active) {
    alert(
      "The screen share has ended or is inactive. Please start screen sharing again."
    );
    console.error("MediaStream is inactive");
    return;
  }
  try {
    const mimeTypes = [
      "video/mp4",
      "video/webm;codecs=H264",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    let mimeType = "";
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }
    if (!mimeType) {
      throw new Error("No supported MIME type found for recording");
    }
    const options = { mimeType };
    mediaRecorder = new MediaRecorder(mediaStream, options);
    recordedChunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    mediaRecorder.onstop = () => {
      saveRecording(mimeType);
      cleanup();
    };
    mediaRecorder.onerror = (event) => {
      console.error("Recorder error:", event.error);
    };
    mediaRecorder.start(1000);
    updateUI(true);
  } catch (err) {
    console.error("Error starting recording:", err);
    alert("Recording failed to start: " + err.message);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }
}

function saveRecording(mimeType) {
  if (recordedChunks.length === 0) return;
  try {
    const fileExtension = mimeType.includes("mp4") ? "mp4" : "webm";
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `recorded_video_${Date.now()}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.error("Error saving recording:", err);
    alert("Failed to save recording: " + err.message);
  }
}

function cleanup() {
  recordedChunks = [];
  mediaStream = null;
  mediaRecorder = null;
  updateUI(false);
}

function updateUI(isRecording) {
  const recordingBtn = document.getElementById("recordingbt");
  const recordingIndicator = document.getElementById("recordingIndicator");

  if (recordingBtn && recordingIndicator) {
    recordingBtn.textContent = isRecording
      ? "Stop Recording"
      : "Start Recording";
    recordingBtn.style.backgroundColor = isRecording ? "red" : "#ff8c00";
    recordingIndicator.style.display = isRecording ? "block" : "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const streamingBtn = document.getElementById("streamingbt");
  const recordingBtn = document.getElementById("recordingbt");
  if (streamingBtn) {
    streamingBtn.addEventListener("click", startStream);
  }
  if (recordingBtn) {
    recordingBtn.addEventListener("click", () => {
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        startRecording();
      } else if (mediaRecorder.state === "recording") {
        stopRecording();
      }
    });
  }
});
