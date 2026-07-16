// ---- CONFIG: edit these to match your repo ----
const GITHUB_OWNER  = "fedi41-prog";
const GITHUB_REPO   = "logos";
const GITHUB_BRANCH = "main";
const FOLDER_PATH   = "logos";
// -------------------------------------------------

const SWITCH_INTERVAL_MS = 600; // how long each logo stays on screen

const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${FOLDER_PATH}/`;
const API_URL  = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FOLDER_PATH}?ref=${GITHUB_BRANCH}`;

let IMAGE_LIST = [];   // filled in automatically from the repo folder
let currentIndex = 0;
let logoImg = null;
let intervalId = null;

async function fetchImageList() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  const files = await res.json();

  return files
    .filter(file => file.type === "file" && (file.name.toLowerCase().endsWith(".png") | file.name.toLowerCase().endsWith(".jpg")))
    .map(file => file.name);
}

async function renderLogoGallery(containerId = "logo") {
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
  logoImg.src = RAW_BASE + encodeURIComponent(IMAGE_LIST[currentIndex]);
  logoImg.alt = IMAGE_LIST[currentIndex];
  container.appendChild(logoImg);

  intervalId = setInterval(showNextLogo, SWITCH_INTERVAL_MS);
}

function showNextLogo() {
  currentIndex = (currentIndex + 1) % IMAGE_LIST.length;
  logoImg.src = RAW_BASE + encodeURIComponent(IMAGE_LIST[currentIndex]);
  logoImg.alt = IMAGE_LIST[currentIndex];
}

function stopSwitching() {
  clearInterval(intervalId);
}

// Run once the DOM is ready
document.addEventListener("DOMContentLoaded", () => renderLogoGallery("logo-container"));