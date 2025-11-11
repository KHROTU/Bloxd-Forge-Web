let allZipFiles = [];
let currentZipUrl = null;

const PINNED_PACKS = ["Blo3D", "Monochrome 8x", "SleekSlots"];

function isPinnedPack(packName) {
  return PINNED_PACKS.some((pinnedName) =>
    packName.toLowerCase().includes(pinnedName.toLowerCase())
  );
}

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function extractPackNameFromUrl(url) {
  if (!url) return "";
  const match = url.match(/\/([^\/]+)\.zip$/i);
  return match ? match[1] : "";
}

async function fetchZipFiles() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/KHROTU/Bloxd-Forge-Web/contents/assets/tpacks?ref=main`
    );
    if (!response.ok) throw new Error("Failed to fetch files from GitHub API");
    const files = await response.json();
    allZipFiles = files.filter(
      (file) => file.type === "file" && file.name.endsWith(".zip")
    );

    const tpack = getQueryParam("tpack");
    if (tpack) {
      const targetPack = allZipFiles.find(
        (file) =>
          file.name.toLowerCase().replace(/\.zip$/i, "") === tpack.toLowerCase()
      );

      if (targetPack) {
        const container = document.getElementById("cards-container");

        const cardReady = new Promise((resolve) => {
          const checkCard = setInterval(() => {
            const card = document.querySelector(
              `.card[data-name="${targetPack.name
                .toLowerCase()
                .replace(/\.zip$/i, "")}"]`
            );
            if (card && !card.classList.contains("loading")) {
              clearInterval(checkCard);
              resolve(card);
            }
          }, 100);
        });

        await processZipAndRenderCard(targetPack, container);

        const card = await cardReady;
        if (card) {
          setTimeout(() => {
            card.click();
          }, 100);
        }

        const otherPacks = allZipFiles.filter((pack) => pack !== targetPack);
        displayAllCards(otherPacks);
        return;
      }
    }

    displayAllCards(allZipFiles);
  } catch (error) {
    console.error("Error fetching files:", error);
    document.getElementById("loading-spinner").style.display = "none";
  }
}

function displayAllCards(files) {
  const container = document.getElementById("cards-container");
  if (container.children.length === 0) {
    document.getElementById("loading-spinner").style.display = "none";
  }
  files.forEach((file) => {
    processZipAndRenderCard(file, container).then((card) => {
      if (card) {
        sortAndPinPacks();
      }
    });
  });
}

async function processZipAndRenderCard(file, container) {
  const zipName = file.name.replace(/\.zip$/i, "");
  const zipUrl = file.download_url;

  const existingCard = document.querySelector(
    `.card[data-name="${zipName.toLowerCase()}"]`
  );
  if (existingCard) {
    if (existingCard.classList.contains("loading")) {
      return existingCard;
    }
    return null;
  }

  const card = document.createElement("div");
  card.className = "card loading";
  card.dataset.name = zipName.toLowerCase();
  card.dataset.url = zipUrl;
  if (isPinnedPack(zipName)) {
    card.dataset.pinned = "true";
  }

  const img = document.createElement("img");
  img.alt = `${zipName} Banner`;
  img.loading = "lazy";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = zipName;

  const loadingOverlay = document.createElement("div");
  loadingOverlay.className = "loading-overlay";
  loadingOverlay.innerHTML = `
        <p class="loading-percentage">0%</p>
        <p class="loading-details">Connecting...</p>
        <p class="loading-filename"></p>
    `;

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(loadingOverlay);
  container.appendChild(card);
  sortAndPinPacks();

  const percentageEl = card.querySelector(".loading-percentage");
  const detailsEl = card.querySelector(".loading-details");
  const filenameEl = card.querySelector(".loading-filename");

  let blob;
  let totalSize;

  try {
    const response = await fetch(zipUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const contentLength = response.headers.get("Content-Length");

    if (contentLength && response.body) {
      totalSize = parseInt(contentLength, 10);
      const totalMb = (totalSize / 1024 / 1024).toFixed(2);
      let loaded = 0;

      detailsEl.textContent = "Downloading...";
      filenameEl.textContent = `0.00MB / ${totalMb}MB`;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        const percent = Math.min(100, Math.round((loaded / totalSize) * 100));
        const loadedMb = (loaded / 1024 / 1024).toFixed(2);

        percentageEl.textContent = `${percent}%`;
        filenameEl.textContent = `${loadedMb}MB / ${totalMb}MB`;
      }
      blob = new Blob(chunks);
    } else {
      detailsEl.textContent = "Downloading...";
      filenameEl.textContent = file.name;
      blob = await response.blob();
      totalSize = blob.size;
    }

    const totalMb = (totalSize / 1024 / 1024).toFixed(2);
    detailsEl.textContent = "Unzipping...";
    filenameEl.textContent = `0.00MB / ${totalMb}MB`;

    const zip = await JSZip.loadAsync(blob, {
      update: (metadata) => {
        const percent = metadata.percent.toFixed(0);
        const progressMb = (
          (totalSize * metadata.percent) /
          100 /
          1024 /
          1024
        ).toFixed(2);

        percentageEl.textContent = `${percent}%`;
        detailsEl.textContent = metadata.currentFile || "Reading zip...";
        filenameEl.textContent = `${progressMb}MB / ${totalMb}MB`;
      },
    });

    detailsEl.textContent = "Extracting assets...";
    filenameEl.textContent = "";

    let bannerUrl = "../images/ph.png";
    const bannerFile = Object.keys(zip.files).find((fileName) =>
      fileName.toLowerCase().endsWith("banner.png")
    );
    if (bannerFile) {
      const bannerBlob = await zip.files[bannerFile].async("blob");
      bannerUrl = URL.createObjectURL(bannerBlob);
    }

    const descFile = zip.files["desc.txt"];
    const description = descFile
      ? await descFile.async("string")
      : "I may be an artist, but I can't write descriptions.";

    img.src = bannerUrl;

    const finishLoading = () => {
      card.classList.remove("loading");
      loadingOverlay.style.opacity = "0";
      setTimeout(() => loadingOverlay.remove(), 500);
    };

    img.onload = finishLoading;
    img.onerror = () => {
      img.src = "../images/ph.png";
      finishLoading();
    };

    if (isPinnedPack(zipName)) {
      card.dataset.pinned = "true";
      const pinIcon = document.createElement("i");
      pinIcon.className = "fas fa-thumbtack pin-icon";
      card.appendChild(pinIcon);
    }

    card.addEventListener("click", () => {
      openPopup(bannerUrl, description, zipUrl, zipName);
    });
  } catch (error) {
    console.error(`Failed to process zip ${zipName}:`, error);
    if (detailsEl) {
      detailsEl.textContent = "Error loading pack";
      percentageEl.textContent = "⚠️";
      filenameEl.textContent = "";
    }
  }
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function waitForCardsAndOpenTpack() {
  const tpack = getQueryParam("tpack");
  if (!tpack) return;

  const targetCard = document.querySelector(
    `.card[data-name="${tpack.toLowerCase()}"]`
  );
  if (targetCard && !targetCard.classList.contains("loading")) {
    targetCard.click();
    return;
  }

  const targetPack = allZipFiles.find(
    (file) =>
      file.name.toLowerCase().replace(/\.zip$/i, "") === tpack.toLowerCase()
  );

  if (targetPack) {
    const container = document.getElementById("cards-container");
    const card = await processZipAndRenderCard(targetPack, container);
    if (card) {
      card.click();
    }
  } else {
    console.warn(`Pack "${tpack}" not found`);
  }
}

function sortAndPinPacks() {
  const container = document.getElementById("cards-container");
  const cards = Array.from(container.querySelectorAll(".card"));
  const pinnedCards = cards.filter((card) => card.dataset.pinned === "true");
  const otherCards = cards.filter((card) => card.dataset.pinned !== "true");

  otherCards.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));

  container.innerHTML = "";
  pinnedCards.forEach((card) => container.appendChild(card));
  otherCards.forEach((card) => container.appendChild(card));
}

function filterCards() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    const name = card.dataset.name;
    card.style.display = name.includes(query) ? "flex" : "none";
  });
}

document
  .getElementById("search-input")
  .addEventListener("input", debounce(filterCards, 300));

async function initiateDownload(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = url.split("/").pop() || "texture-pack.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch (error) {
    console.error("Download error:", error);
    return false;
  }
}

function openPopup(imageUrl, descText, downloadUrl, packName = null) {
  const popup = document.getElementById("popup");
  const popupImage = document.getElementById("popup-image");
  const popupText = document.getElementById("popup-text");
  const downloadButton = document.getElementById("download-btn");
  const previewButton = document.getElementById("preview-btn");
  const reviewsButton = document.getElementById("reviews-btn");
  const shareButton = document.getElementById("share-btn");

  popupImage.src = imageUrl;
  popupText.textContent = descText;
  currentZipUrl = downloadUrl;
  popup.dataset.packName = packName || extractPackNameFromUrl(downloadUrl);

  downloadButton.onclick = async () => {
    downloadButton.disabled = true;
    downloadButton.textContent = "Downloading...";
    const success = await initiateDownload(downloadUrl);
    if (!success) {
      alert("Download failed. Please check the console for errors.");
    }
    downloadButton.disabled = false;
    downloadButton.innerHTML =
      '<i class="fas fa-download"></i> Download Texture Pack';
  };

  previewButton.onclick = () => openPreview(currentZipUrl);
  reviewsButton.onclick = () => openReviews(currentZipUrl);

  shareButton.onclick = () => {
    const packNameForUrl = popup.dataset.packName;
    const shareUrl = `${window.location.origin}${
      window.location.pathname
    }?tpack=${encodeURIComponent(packNameForUrl)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      shareButton.innerHTML = "Copied!";
      setTimeout(() => {
        shareButton.innerHTML = '<i class="fas fa-share"></i> Share';
      }, 1200);
    });
  };
  popup.style.display = "flex";
}

document.getElementById("popup").addEventListener("click", (event) => {
  if (event.target === document.getElementById("popup")) {
    document.getElementById("popup").style.display = "none";
    document.getElementById("popup-image").src = "";
    document.getElementById("popup-text").textContent = "";
    currentZipUrl = null;
  }
});

let scene, camera, renderer, controls;
let onWindowResizePreview = null;

async function openPreview(zipUrl) {
  const previewWindow = document.getElementById("preview-window");
  previewWindow.style.display = "flex";
  const canvas = document.getElementById("preview-canvas");
  const parentElement = canvas.parentElement;
  let width = parentElement.clientWidth || 1;
  let height = parentElement.clientHeight || 1;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(10, 10, 10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setSize(width, height, false);

  onWindowResizePreview = () => {
    if (!renderer || !camera || !parentElement) return;
    const newWidth = parentElement.clientWidth || 1;
    const newHeight = parentElement.clientHeight || 1;
    if (newWidth > 0 && newHeight > 0) {
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight, false);
    }
  };
  window.addEventListener("resize", onWindowResizePreview);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;

  const textureLoader = new THREE.TextureLoader();
  const zip = await JSZip.loadAsync(
    await fetch(zipUrl).then((response) => response.blob())
  );
  const textures = {};

  const textureFiles = Object.keys(zip.files).filter((file) =>
    file.includes("textures/")
  );
  for (const file of textureFiles) {
    const fileName = file.split("/").pop();
    const textureBlob = await zip.files[file].async("blob");
    const textureUrl = URL.createObjectURL(textureBlob);
    const texture = textureLoader.load(textureUrl, () => {
      URL.revokeObjectURL(textureUrl);
    });
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    textures[fileName] = texture;
  }

  const defaultTextures = {
    "stone.png": "/assets/tpacks/default/stone.png",
    "dirt.png": "/assets/tpacks/default/dirt.png",
    "grass_top.png": "/assets/tpacks/default/grass_top.png",
    "log_maple.png": "/assets/tpacks/default/log_maple.png",
    "leaves_maple.png": "/assets/tpacks/default/leaves_maple.png",
    "oxeye_daisy.png": "/assets/tpacks/default/oxeye_daisy.png",
    "cornflower.png": "/assets/tpacks/default/cornflower.png",
    "chest_front.png": "/assets/tpacks/default/chest_front.png",
    "chest_side.png": "/assets/tpacks/default/chest_side.png",
    "chest_top.png": "/assets/tpacks/default/chest_top.png",
  };

  for (const [fileName, defaultUrl] of Object.entries(defaultTextures)) {
    if (!textures[fileName]) {
      const texture = textureLoader.load(defaultUrl);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      textures[fileName] = texture;
    }
  }

  const stoneTexture = textures["stone.png"];
  const dirtTexture = textures["dirt.png"];
  const grassTexture = textures["grass_top.png"];
  const logTexture = textures["log_maple.png"];
  const leavesTexture = textures["leaves_maple.png"];

  const stoneGeometry = new THREE.BoxGeometry(1, 1, 1);
  const stoneMaterial = new THREE.MeshBasicMaterial({ map: stoneTexture });
  const stoneLayer = new THREE.Group();
  const islandShape = [
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 0],
    [1, 1, 1, 0, 0, 0],
    [1, 1, 1, 0, 0, 0],
  ];
  for (let x = 0; x < 6; x++)
    for (let z = 0; z < 6; z++)
      if (islandShape[z][x])
        for (let y = 0; y < 3; y++) {
          const stoneCube = new THREE.Mesh(stoneGeometry, stoneMaterial);
          stoneCube.position.set(x - 3, y, z - 3);
          stoneLayer.add(stoneCube);
        }

  const dirtLayer = new THREE.Group();
  const dirtMaterial = new THREE.MeshBasicMaterial({ map: dirtTexture });
  for (let x = 0; x < 6; x++)
    for (let z = 0; z < 6; z++)
      if (islandShape[z][x]) {
        const dirtCube = new THREE.Mesh(stoneGeometry, dirtMaterial);
        dirtCube.position.set(x - 3, 3, z - 3);
        dirtLayer.add(dirtCube);
      }

  const grassLayer = new THREE.Group();
  const grassMaterial = new THREE.MeshBasicMaterial({ map: grassTexture });
  for (let x = 0; x < 6; x++)
    for (let z = 0; z < 6; z++)
      if (islandShape[z][x]) {
        const grassCube = new THREE.Mesh(stoneGeometry, grassMaterial);
        grassCube.position.set(x - 3, 4, z - 3);
        grassLayer.add(grassCube);
      }

  const treeTrunk = new THREE.Group();
  const logMaterial = new THREE.MeshBasicMaterial({ map: logTexture });
  for (let y = 0; y < 3; y++) {
    const trunkBlock = new THREE.Mesh(stoneGeometry, logMaterial);
    trunkBlock.position.set(-2, y + 5, -2);
    treeTrunk.add(trunkBlock);
  }

  const treeLeaves = new THREE.Group();
  const leavesMaterial = new THREE.MeshBasicMaterial({ map: leavesTexture });
  for (let x = 0; x < 5; x++)
    for (let z = 0; z < 5; z++) {
      const leafBlock = new THREE.Mesh(stoneGeometry, leavesMaterial);
      leafBlock.position.set(x - 4, 7, z - 4);
      treeLeaves.add(leafBlock);
    }
  const layer2Pattern = [
    [0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
  ];
  for (let x = 0; x < 5; x++)
    for (let z = 0; z < 5; z++)
      if (layer2Pattern[z][x]) {
        const leafBlock = new THREE.Mesh(stoneGeometry, leavesMaterial);
        leafBlock.position.set(x - 4, 8, z - 4);
        treeLeaves.add(leafBlock);
      }
  for (let x = 1; x < 4; x++)
    for (let z = 1; z < 4; z++) {
      const leafBlock = new THREE.Mesh(stoneGeometry, leavesMaterial);
      leafBlock.position.set(x - 4, 9, z - 4);
      treeLeaves.add(leafBlock);
    }
  const layer4Pattern = [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ];
  for (let x = 0; x < 3; x++)
    for (let z = 0; z < 5; z++)
      if (layer4Pattern[x][z]) {
        const leafBlock = new THREE.Mesh(stoneGeometry, leavesMaterial);
        leafBlock.position.set(z - 4, 10, x - 3);
        treeLeaves.add(leafBlock);
      }

  scene.add(stoneLayer, dirtLayer, grassLayer, treeTrunk, treeLeaves);

  requestIdleCallback(async () => {
    const oxeyeDaisyTexture = textures["oxeye_daisy.png"],
      cornflowerTexture = textures["cornflower.png"];
    const chestFrontTexture = textures["chest_front.png"],
      chestSideTexture = textures["chest_side.png"],
      chestTopTexture = textures["chest_top.png"];

    const flowerGeometry = new THREE.PlaneGeometry(1, 1);
    const oxeyeDaisyMaterial = new THREE.MeshBasicMaterial({
      map: oxeyeDaisyTexture,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });
    const cornflowerMaterial = new THREE.MeshBasicMaterial({
      map: cornflowerTexture,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });

    const oxeyeDaisy1 = new THREE.Mesh(flowerGeometry, oxeyeDaisyMaterial);
    oxeyeDaisy1.position.set(-3, 5, 1);
    oxeyeDaisy1.rotation.y = Math.PI / 4;
    const oxeyeDaisy2 = new THREE.Mesh(flowerGeometry, oxeyeDaisyMaterial);
    oxeyeDaisy2.position.set(-3, 5, 1);
    oxeyeDaisy2.rotation.y = -Math.PI / 4;
    const cornflower1 = new THREE.Mesh(flowerGeometry, cornflowerMaterial);
    cornflower1.position.set(-1, 5, -1);
    cornflower1.rotation.y = Math.PI / 4;
    const cornflower2 = new THREE.Mesh(flowerGeometry, cornflowerMaterial);
    cornflower2.position.set(-1, 5, -1);
    cornflower2.rotation.y = -Math.PI / 4;
    scene.add(oxeyeDaisy1, oxeyeDaisy2, cornflower1, cornflower2);

    const chestGeometry = new THREE.BoxGeometry(1, 1, 1);
    const chestMaterials = [
      new THREE.MeshBasicMaterial({ map: chestSideTexture }),
      new THREE.MeshBasicMaterial({ map: chestSideTexture }),
      new THREE.MeshBasicMaterial({ map: chestTopTexture }),
      new THREE.MeshBasicMaterial({ map: chestTopTexture }),
      new THREE.MeshBasicMaterial({ map: chestSideTexture }),
      new THREE.MeshBasicMaterial({ map: chestFrontTexture }),
    ];
    const chest = new THREE.Mesh(chestGeometry, chestMaterials);
    chest.position.set(2, 5, -2);
    chest.rotation.y = Math.PI / 2;
    scene.add(chest);

    const loadSkyboxTextures = async (zip) => {
      const skyTextureLoader = new THREE.TextureLoader(),
        extensions = [".jpg", ".png"],
        baseFaces = ["px", "nx", "py", "ny", "pz", "nz"],
        skyboxTextures = [];
      try {
        for (const face of baseFaces) {
          let file = null;
          for (const ext of extensions) {
            const filePath = Object.keys(zip.files).find(
              (p) =>
                p.toLowerCase().includes("/skyboxes/") &&
                p.toLowerCase().includes(face.toLowerCase() + ext)
            );
            if (filePath) {
              file = zip.files[filePath];
              break;
            }
          }
          if (file) {
            const blob = await file.async("blob"),
              url = URL.createObjectURL(blob);
            skyboxTextures.push(
              skyTextureLoader.load(url, () => URL.revokeObjectURL(url))
            );
          } else skyboxTextures.push(null);
        }
        if (skyboxTextures.filter((t) => t !== null).length === 6) {
          const geo = new THREE.BoxGeometry(1000, 1000, 1000),
            mats = skyboxTextures.map(
              (tex) =>
                new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })
            );
          scene.add(new THREE.Mesh(geo, mats));
        } else throw new Error("Incomplete skybox textures");
      } catch (e) {
        const geo = new THREE.SphereGeometry(500, 32, 32),
          mat = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            side: THREE.BackSide,
          });
        scene.add(new THREE.Mesh(geo, mat));
      }
    };
    await loadSkyboxTextures(zip);
  });

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);

  function animate() {
    if (!renderer) return;
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

function closePreview() {
  const previewWindow = document.getElementById("preview-window");
  previewWindow.style.display = "none";

  if (onWindowResizePreview) {
    window.removeEventListener("resize", onWindowResizePreview);
    onWindowResizePreview = null;
  }

  if (scene) {
    scene.traverse((object) => {
      if (object.isMesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => {
            mat?.map?.dispose();
            mat?.dispose();
          });
        } else {
          object.material?.map?.dispose();
          object.material?.dispose();
        }
      }
    });
    scene.clear();
    scene = null;
  }

  if (renderer) {
    renderer.dispose();
    renderer = null;
  }

  if (controls) {
    controls.dispose();
    controls = null;
  }
}

document.getElementById("add-button").addEventListener("click", () => {
  const popupMenu = document.getElementById("popup-menu");
  const backdrop = document.createElement("div");
  backdrop.className = "popup-menu-backdrop";
  document.body.appendChild(backdrop);
  backdrop.style.display = "block";
  popupMenu.style.display = "block";
  backdrop.addEventListener("click", () => {
    popupMenu.style.display = "none";
    backdrop.remove();
  });
});

function openReviews(packIdentifier) {
  document.getElementById("reviews-window").style.display = "block";
  const safeIdentifier =
    "tpack_" + packIdentifier.replace(/[^a-zA-Z0-9_-]/g, "_");
  window.disqus_config = function () {
    this.page.url =
      "https://bloxdforge.com/tpack/" +
      encodeURIComponent(extractPackNameFromUrl(packIdentifier));
    this.page.identifier = safeIdentifier;
  };
  if (typeof DISQUS !== "undefined") {
    DISQUS.reset({ reload: true, config: window.disqus_config });
  }
}

function closeReviews() {
  document.getElementById("reviews-window").style.display = "none";
  const disqusThread = document.getElementById("disqus_thread");
  if (disqusThread) disqusThread.innerHTML = "";
}

(function () {
  var disqus_config = function () {
    this.page.url = "https://bloxdforge.com";
    this.page.identifier = "bloxdforge";
  };
  var d = document,
    s = d.createElement("script");
  s.src = "https://bloxdforge.disqus.com/embed.js";
  s.defer = true;
  s.setAttribute("data-timestamp", +new Date());
  (d.head || d.body).appendChild(s);
})();

document.addEventListener("DOMContentLoaded", () => {
  fetchZipFiles();
});
