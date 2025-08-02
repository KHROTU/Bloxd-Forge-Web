let allZipFiles = [];
let currentZipUrl = null;

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function extractPackNameFromUrl(url) {
  if (!url) return '';
  const match = url.match(/\/([^\/]+)\.zip$/i);
  return match ? match[1] : '';
}

async function fetchZipFiles() {
  try {
    let files;
    if (window.parent && window.parent.preloadedTpackFiles) {
      files = window.parent.preloadedTpackFiles;
    } else if (window.preloadedTpackFiles) {
      files = window.preloadedTpackFiles;
    } else {
      const response = await fetch(
        `https://api.github.com/repos/KHROTU/Bloxd-Forge-Web/contents/assets/tpacks?ref=main`, {
          priority: 'high'
        }
      );
      if (!response.ok) throw new Error("Failed to fetch files");
      files = await response.json();
    }
    allZipFiles = files.filter(
      file => file.type === "file" && file.name.endsWith(".zip")
    );
    loadAllZips();
  } catch (error) {
    console.error("Error fetching files:", error);
    document.getElementById("loading-spinner").style.display = "none";
  }
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function waitForCardsAndOpenTpack() {
  const tpack = getQueryParam('tpack');
  if (!tpack) return;
  let attempts = 0;
  while (document.querySelectorAll('.card').length === 0 && attempts < 60) {
    await new Promise(r => setTimeout(r, 250));
    attempts++;
  }
  const cards = Array.from(document.querySelectorAll('.card'));
  const target = cards.find(card => card.dataset.name === tpack.toLowerCase());
  if (target) {
    target.querySelector('img').click();
  }
}

async function loadAllZips() {
  if (allZipFiles.length === 0) {
    document.getElementById("loading-spinner").style.display = "none";
    return;
  }
  let loadedCount = 0;
  allZipFiles.forEach(async file => {
    const zipUrl = file.download_url;
    const zipName = file.name.replace(/\.zip$/i, "");
    const bannerUrl = await extractBanner(zipUrl);
    displayCard(zipName, zipUrl, bannerUrl);
    loadedCount++;
    if (loadedCount === allZipFiles.length) {
      document.getElementById("loading-spinner").style.display = "none";
    }
  });
}

async function extractBanner(zipUrl) {
  try {
    const response = await fetch(zipUrl, {
      mode: 'cors',
      priority: 'high'
    });
    if (!response.ok) throw new Error("Failed to fetch ZIP file");
    const blob = await response.blob();
    const zip = await JSZip.loadAsync(blob);
    for (const fileName of Object.keys(zip.files)) {
      if (fileName.toLowerCase().endsWith("banner.png")) {
        const bannerBlob = await zip.files[fileName].async("blob");
        return URL.createObjectURL(bannerBlob);
      }
    }
  } catch (error) {
    console.warn("No banner.png found in:", zipUrl);
  }
  return "https://dummyimage.com/220x220/ababab/000000&text=No+Banner";
}

async function extractDescription(zipUrl) {
  try {
    const response = await fetch(zipUrl, {
      mode: 'cors',
      priority: 'low'
    });
    if (!response.ok) throw new Error("Failed to fetch ZIP file");
    const blob = await response.blob();
    const zip = await JSZip.loadAsync(blob);
    const descFile = zip.files["desc.txt"];
    if (descFile) {
      return await descFile.async("string");
    }
  } catch (error) {
    console.warn("No desc.txt found in:", zipUrl);
  }
  return "No description available.";
}

function displayCard(name, url, bannerUrl) {
  const container = document.getElementById("cards-container");
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.name = name.toLowerCase();
  const img = document.createElement("img");
  img.src = bannerUrl;
  img.alt = `${name} Banner`;
  img.loading = container.children.length < 3 ? "eager" : "lazy";
  img.fetchpriority = container.children.length < 3 ? "high" : "auto";
  img.addEventListener("click", async () => {
    const descText = await extractDescription(url);
    openPopup(bannerUrl, descText, url, name);
  });
  const title = document.createElement("div");
  title.className = "card-title";
  title.innerHTML = `<a href="${url}" target="_blank">${name}</a>`;
  card.appendChild(img);
  card.appendChild(title);
  container.appendChild(card);
}

const debounceFilterCards = debounce(filterCards, 300);

function filterCards() {
  const query = document.getElementById("search-input").value.toLowerCase();
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    const name = card.dataset.name;
    card.style.display = name.includes(query) ? "block" : "none";
  });
}

async function initiateDownload(url) {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/octet-stream'
      },
      priority: 'high'
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = url.split('/').pop() || 'texture-pack.zip';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    return true;
  } catch (error) {
    console.error('Download error:', error);
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
  // Store pack name for sharing
  popup.dataset.packName = packName || extractPackNameFromUrl(downloadUrl);

  downloadButton.onclick = async () => {
    let errorNotification = document.getElementById('download-error-notification');
    if (!errorNotification) {
      errorNotification = document.createElement('div');
      errorNotification.id = 'download-error-notification';
      errorNotification.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #ff4d4d;
                    color: white;
                    padding: 15px;
                    border-radius: 10px;
                    z-index: 100;
                    max-width: 300px;
                    text-align: center;
                    display: none;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                `;
      document.body.appendChild(errorNotification);
    }

    function showErrorNotification(message) {
      errorNotification.textContent = message;
      errorNotification.style.display = 'block';
      setTimeout(() => {
        errorNotification.style.display = 'none';
      }, 5000);
    }

    downloadButton.disabled = true;
    downloadButton.style.opacity = '0.5';
    downloadButton.textContent = 'Downloading...';

    const downloadTimeout = setTimeout(() => {
      showErrorNotification('Download timed out. Please try again.');
      downloadButton.disabled = false;
      downloadButton.style.opacity = '1';
      downloadButton.textContent = 'Download Texture Pack';
    }, 30000);

    try {
      if (!downloadUrl || !downloadUrl.startsWith('http')) {
        throw new Error('Invalid download URL');
      }

      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      const success = await initiateDownload(downloadUrl);
      clearTimeout(downloadTimeout);

      if (!success) {
        throw new Error('Download failed');
      }

    } catch (error) {
      showErrorNotification(`Download failed: ${error.message}`);
    } finally {
      downloadButton.disabled = false;
      downloadButton.style.opacity = '1';
      downloadButton.textContent = 'Download Texture Pack';
    }
  };

  previewButton.onclick = () => {
    openPreview(currentZipUrl);
  };

  reviewsButton.onclick = () => {
    openReviews(currentZipUrl);
  };

  shareButton.onclick = () => {
    const packName = popup.dataset.packName;
    const shareUrl = `${window.location.origin}${window.location.pathname}?tpack=${encodeURIComponent(packName)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      shareButton.textContent = 'Copied!';
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
    antialias: true
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
  window.addEventListener('resize', onWindowResizePreview);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;

  const textureLoader = new THREE.TextureLoader();
  const zip = await JSZip.loadAsync(await fetch(zipUrl, {
    priority: 'high'
  }).then(response => response.blob()));
  const textures = {};

  const criticalTextures = ["stone.png", "dirt.png", "grass_top.png", "log_maple.png", "leaves_maple.png"];
  const textureFiles = Object.keys(zip.files).filter(file => file.includes("textures/"));
  for (const file of textureFiles) {
    const fileName = file.split('/').pop();
    const priority = criticalTextures.includes(fileName) ? 'high' : 'low';
    const textureBlob = await zip.files[file].async("blob");
    const textureUrl = URL.createObjectURL(textureBlob);
    const texture = textureLoader.load(textureUrl, () => {
      URL.revokeObjectURL(textureUrl);
    }, undefined, undefined, {
      priority
    });
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    textures[fileName] = texture;
  }

  // fallback for missing textures
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
      const priority = criticalTextures.includes(fileName) ? 'high' : 'low';
      const texture = textureLoader.load(defaultUrl, undefined, undefined, undefined, {
        priority
      });
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

  // island
  const stoneGeometry = new THREE.BoxGeometry(1, 1, 1);
  const stoneMaterial = new THREE.MeshBasicMaterial({
    map: stoneTexture
  });
  const stoneLayer = new THREE.Group();

  const islandShape = [
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 0],
    [1, 1, 1, 0, 0, 0],
    [1, 1, 1, 0, 0, 0]
  ];

  for (let x = 0; x < 6; x++) {
    for (let z = 0; z < 6; z++) {
      if (islandShape[z][x]) {
        for (let y = 0; y < 3; y++) {
          const stoneCube = new THREE.Mesh(stoneGeometry, stoneMaterial);
          stoneCube.position.set(x - 3, y, z - 3);
          stoneLayer.add(stoneCube);
        }
      }
    }
  }

  const dirtLayer = new THREE.Group();
  const dirtMaterial = new THREE.MeshBasicMaterial({
    map: dirtTexture
  });

  for (let x = 0; x < 6; x++) {
    for (let z = 0; z < 6; z++) {
      if (islandShape[z][x]) {
        const dirtCube = new THREE.Mesh(stoneGeometry, dirtMaterial);
        dirtCube.position.set(x - 3, 3, z - 3);
        dirtLayer.add(dirtCube);
      }
    }
  }

  const grassLayer = new THREE.Group();
  const grassMaterial = new THREE.MeshBasicMaterial({
    map: grassTexture
  });

  for (let x = 0; x < 6; x++) {
    for (let z = 0; z < 6; z++) {
      if (islandShape[z][x]) {
        const grassCube = new THREE.Mesh(stoneGeometry, grassMaterial);
        grassCube.position.set(x - 3, 4, z - 3);
        grassLayer.add(grassCube);
      }
    }
  }

  // tree
  const treeTrunk = new THREE.Group();
  const logMaterial = new THREE.MeshBasicMaterial({
    map: logTexture
  });
  for (let y = 0; y < 3; y++) {
    const trunkBlock = new THREE.Mesh(stoneGeometry, logMaterial);
    trunkBlock.position.set(-2, y + 5, -2);
    treeTrunk.add(trunkBlock);
  }

  const treeLeaves = new THREE.Group();
  const leavesMaterial = new THREE.MeshBasicMaterial({
    map: leavesTexture
  });

  for (let x = 0; x < 5; x++) {
    for (let z = 0; z < 5; z++) {
      const leafBlock = new THREE.Mesh(stoneGeometry, leavesMaterial);
      leafBlock.position.set(x - 4, 7, z - 4);
      treeLeaves.add(leafBlock);
    }
  }

  const layer2Pattern = [
    [0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1]
  ];
  for (let x = 0; x < 5; x++) {
    for (let z = 0; z < 5; z++) {
      if (layer2Pattern[z][x]) {
        const leafBlock = new THREE.Mesh(stoneGeometry, leavesMaterial);
        leafBlock.position.set(x - 4, 8, z - 4);
        treeLeaves.add(leafBlock);
      }
    }
  }

  for (let x = 1; x < 4; x++) {
    for (let z = 1; z < 4; z++) {
      const leafBlock = new THREE.Mesh(stoneGeometry, leavesMaterial);
      leafBlock.position.set(x - 4, 9, z - 4);
      treeLeaves.add(leafBlock);
    }
  }

  const layer4Pattern = [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0]
  ];
  for (let x = 0; x < 3; x++) {
    for (let z = 0; z < 5; z++) {
      if (layer4Pattern[x][z]) {
        const leafBlock = new THREE.Mesh(stoneGeometry, leavesMaterial);
        leafBlock.position.set(z - 4, 10, x - 3);
        treeLeaves.add(leafBlock);
      }
    }
  }

  scene.add(stoneLayer);
  scene.add(dirtLayer);
  scene.add(grassLayer);
  scene.add(treeTrunk);
  scene.add(treeLeaves);

  requestIdleCallback(async () => {
    const oxeyeDaisyTexture = textures["oxeye_daisy.png"];
    const cornflowerTexture = textures["cornflower.png"];
    const chestFrontTexture = textures["chest_front.png"];
    const chestSideTexture = textures["chest_side.png"];
    const chestTopTexture = textures["chest_top.png"];

    // flowers
    const flowerGeometry = new THREE.PlaneGeometry(1, 1);
    const oxeyeDaisyMaterial = new THREE.MeshBasicMaterial({
      map: oxeyeDaisyTexture,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide
    });
    const cornflowerMaterial = new THREE.MeshBasicMaterial({
      map: cornflowerTexture,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide
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

    scene.add(oxeyeDaisy1);
    scene.add(oxeyeDaisy2);
    scene.add(cornflower1);
    scene.add(cornflower2);

    // chest
    const chestGeometry = new THREE.BoxGeometry(1, 1, 1);
    const chestMaterials = [
      new THREE.MeshBasicMaterial({
        map: chestSideTexture
      }),
      new THREE.MeshBasicMaterial({
        map: chestSideTexture
      }),
      new THREE.MeshBasicMaterial({
        map: chestTopTexture
      }),
      new THREE.MeshBasicMaterial({
        map: chestTopTexture
      }),
      new THREE.MeshBasicMaterial({
        map: chestSideTexture
      }),
      new THREE.MeshBasicMaterial({
        map: chestFrontTexture
      })
    ];
    const chest = new THREE.Mesh(chestGeometry, chestMaterials);
    chest.position.set(2, 5, -2);
    chest.rotation.y = Math.PI / 2;
    scene.add(chest);

    // skybox
    const loadSkyboxTextures = async (zip) => {
      const skyTextureLoader = new THREE.TextureLoader();
      const extensions = ['.jpg', '.png'];
      const baseFaces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
      const skyboxTextures = [];

      try {
        for (const face of baseFaces) {
          let file = null;
          for (const ext of extensions) {
            const filePath = Object.keys(zip.files).find(
              path => path.toLowerCase().includes('/skyboxes/') &&
              path.toLowerCase().includes(face.toLowerCase() + ext)
            );
            if (filePath) {
              file = zip.files[filePath];
              break;
            }
          }
          if (file) {
            const textureBlob = await file.async("blob");
            const textureUrl = URL.createObjectURL(textureBlob);
            skyboxTextures.push(skyTextureLoader.load(textureUrl, () => {
              URL.revokeObjectURL(textureUrl);
            }, undefined, undefined, {
              priority: 'low'
            }));
          } else {
            skyboxTextures.push(null);
          }
        }

        if (skyboxTextures.filter(t => t !== null).length === 6) {
          const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
          const skyboxMaterials = skyboxTextures.map(texture =>
            new THREE.MeshBasicMaterial({
              map: texture,
              side: THREE.BackSide
            })
          );
          const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
          scene.add(skybox);
        } else {
          throw new Error("Incomplete skybox textures");
        }
      } catch (error) {
        const skyboxGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyboxMaterial = new THREE.MeshBasicMaterial({
          color: 0x87CEEB,
          side: THREE.BackSide
        });
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        scene.add(skybox);
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
    window.removeEventListener('resize', onWindowResizePreview);
    onWindowResizePreview = null;
  }

  if (scene) {
    scene.traverse(object => {
      if (object.isMesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => {
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
  const backdrop = document.createElement('div');
  backdrop.className = 'popup-menu-backdrop';
  document.body.appendChild(backdrop);

  backdrop.style.display = "block";
  popupMenu.style.display = "block";

  backdrop.addEventListener("click", () => {
    popupMenu.style.display = "none";
    backdrop.remove();
  });
});

function openReviews(packIdentifier) {
  document.getElementById('reviews-window').style.display = 'block';

  window.disqus_config = function() {
    this.page.url = 'https://bloxdforge.com/tpack/' + packIdentifier.replace(/\.zip$/i, "");
    this.page.identifier = 'tpack_' + packIdentifier.replace(/\.zip$/i, "");
  };

  if (typeof DISQUS !== 'undefined') {
    DISQUS.reset({
      reload: true,
      config: window.disqus_config
    });
  }
}

function closeReviews() {
  document.getElementById("reviews-window").style.display = "none";
  const disqusThread = document.getElementById("disqus_thread");
  disqusThread.innerHTML = "";
}

fetchZipFiles().then(waitForCardsAndOpenTpack);