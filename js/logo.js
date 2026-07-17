// this file was mainly coded by claude. 


// ---- CONFIG: edit these to match your repo ----
const GITHUB_OWNER  = "fedi41";
const GITHUB_REPO   = "logos";
const GITHUB_BRANCH = "main";
const FOLDER_PATH   = "logos";
// -------------------------------------------------

const SWITCH_INTERVAL_MS = 3000; // how long each logo stays on screen

// ---- Bandwidth control ----
// Raw PNGs from GitHub can easily be several MB each, and repeatedly cycling
// through many of them on mobile data adds up fast. To avoid that, images are
// routed through a free resizing/compression proxy (images.weserv.nl) instead
// of being loaded at full original size.
const USE_IMAGE_PROXY = true;
const PROXY_MAX_WIDTH = 500;   // resize to this width (px) — tune to your display size
const PROXY_QUALITY   = 75;    // 1-100, lower = smaller file
// -------------------------------------------------

const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${FOLDER_PATH}/`;
const API_URL  = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FOLDER_PATH}?ref=${GITHUB_BRANCH}`;
 
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".avif"];


let IMAGE_LIST = [];   // filled in automatically from the repo folder
let currentIndex = 0;
let logoImg = null;
let intervalId = null;

function buildImageUrl(filename) {
  const rawUrl = RAW_BASE + encodeURIComponent(filename);
  if (!USE_IMAGE_PROXY) return rawUrl;

  // images.weserv.nl fetches the source image and returns a resized,
  // recompressed version — the browser never downloads the original bytes.
  const source = encodeURIComponent(rawUrl.replace(/^https?:\/\//, ""));
  return `https://images.weserv.nl/?url=${source}&w=${PROXY_MAX_WIDTH}&q=${PROXY_QUALITY}&output=webp`;
}

async function fetchImageList() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  const files = await res.json();
 
  const imageFiles = files
    .filter(file =>
      file.type === "file" &&
      IMAGE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
    )
    .map(file => file.name);
 
  return shuffleArray(imageFiles);
}
 
// Fisher-Yates shuffle — returns a new array in random order
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

 


async function renderGallery(containerId = "gallery") {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`No element with id "${containerId}" found.`);
    return;
  }

  try {
    IMAGE_LIST = await fetchImageList();
  } catch (err) {
    console.error("Failed to load image list:", err);
    return;
  }

  if (IMAGE_LIST.length === 0) {
    console.warn("No .png files found in the folder.");
    return;
  }

  // Single <img> element that we just keep swapping the src on
  logoImg = document.createElement("img");
  logoImg.src = buildImageUrl(IMAGE_LIST[currentIndex]);
  logoImg.alt = IMAGE_LIST[currentIndex];
  container.appendChild(logoImg);

  intervalId = setInterval(showNextLogo, SWITCH_INTERVAL_MS);

  // Pause the cycle when the tab isn't visible, so it doesn't keep
  // burning data in the background on mobile.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopSwitching();
    } else if (!intervalId) {
      intervalId = setInterval(showNextLogo, SWITCH_INTERVAL_MS);
    }
  });
}

function showNextLogo() {
  currentIndex = (currentIndex + 1) % IMAGE_LIST.length;
  logoImg.src = buildImageUrl(IMAGE_LIST[currentIndex]);
  logoImg.alt = IMAGE_LIST[currentIndex];
}

function stopSwitching() {
  clearInterval(intervalId);
  intervalId = null;
}

// Run once the DOM is ready
document.addEventListener("DOMContentLoaded", () => renderGallery("logo-container"));