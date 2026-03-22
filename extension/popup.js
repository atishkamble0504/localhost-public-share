// ===============================
// Localhost Public URL
// Professional Timer Version (Stable)
// ===============================

const api = typeof browser !== "undefined" ? browser : chrome;

const BRIDGE_URL = "http://127.0.0.1:54321";
const DOWNLOAD_URL =
  "https://github.com/atishkamble0504/localhost-public-share/releases/download/v1.0/LocalhostPublicShareSetup.exe";

let content = null;
let countdownInterval = null;
let currentExpiry = null;


// ===============================
// Bridge Retry Check
// ===============================
async function checkBridge(retries = 3) {
  try {

    const token = await getToken();

    const res = await fetch(`${BRIDGE_URL}/status`, {
      headers: { "x-bridge-token": token }
    });

    if (!res.ok) throw new Error();

    return await res.json();

  } catch {

    if (retries > 0) {
      await new Promise(r => setTimeout(r, 800));
      return checkBridge(retries - 1);
    }

    throw new Error("Bridge unreachable");
  }
}


// ===============================
// Token Handling
// ===============================
async function getToken(forceRefresh = false) {

  if (!forceRefresh) {
    const saved = localStorage.getItem("bridgeToken");
    if (saved) return saved;
  }

  const res = await fetch(`${BRIDGE_URL}/token`);
  const data = await res.json();

  localStorage.setItem("bridgeToken", data.token);

  return data.token;
}


// ===============================
// QR Code Generator
// ===============================
function generateQR(url) {

  const qrContainer = document.createElement("div");
  qrContainer.classList.add("qr-container");

  const qrCanvas = document.createElement("div");
  qrContainer.appendChild(qrCanvas);

  if (typeof QRCode !== "undefined") {
    new QRCode(qrCanvas, {
      text: url,
      width: 150,
      height: 150
    });
  }

  return qrContainer;

}


// ===============================
// Initialize Popup
// ===============================
async function initialize() {

  content.innerHTML =
    `<div class="card"><p>Checking bridge status...</p></div>`;

  try {

    const data = await checkBridge();

    if (data.running) {

      const saved = await api.storage.local.get("activeTunnel");

      let expiry = data.expiryTimestamp;

      if (!expiry && saved.activeTunnel) {
        expiry = saved.activeTunnel.expiryTimestamp;
      }

      showActive(data.publicUrl, expiry);

    } else {

      loadPorts();

    }

  } catch {

    showEnableScreen();

  }

}


// ===============================
// Enable Screen
// ===============================
function showEnableScreen() {

  clearInterval(countdownInterval);

  content.innerHTML = `
    <div class="card">
      <h3>Local Sharing Not Enabled</h3>
      <p>Please install and run the Localhost Bridge application.</p>
      <button type="button" class="share-btn" id="enable">
        Download Companion App
      </button>
    </div>
  `;

  document.getElementById("enable").addEventListener("click", () => {
    api.tabs.create({ url: DOWNLOAD_URL });
  });

}


// ===============================
// Active Tunnel UI
// ===============================
function showActive(url, expiryTimestamp) {

  clearInterval(countdownInterval);

  currentExpiry = expiryTimestamp;

  content.innerHTML = `
    <div class="card">
      <h3>Public URL Active</h3>

      <div class="url-box">${url}</div>

      <button type="button" class="copy-btn" id="copy">Copy URL</button>
      <button type="button" class="stop-btn" id="stop">Stop Sharing</button>

      <div class="timer-section">
        <label class="timer-label">Session Duration</label>

        <select id="durationSelect">
          <option value="30">30 Minutes</option>
          <option value="60">1 Hour</option>
          <option value="360">6 Hours</option>
          <option value="1440">24 Hours</option>
          <option value="custom">Custom</option>
        </select>

        <input type="number" id="customDuration"
          class="hidden-input"
          placeholder="Enter minutes"
          min="1" />

        <button type="button" class="save-btn" id="saveTimer">Save</button>

        <div id="timer" class="timer-box"></div>
      </div>
    </div>
  `;

  content.appendChild(generateQR(url));


  document.getElementById("copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(url); } catch {}
  });


  document.getElementById("stop").addEventListener("click", async () => {

    const token = await getToken();

    await fetch(`${BRIDGE_URL}/stop`, {
      headers: { "x-bridge-token": token }
    });

    clearInterval(countdownInterval);

    await api.storage.local.remove("activeTunnel");

    initialize();

  });


  const durationSelect = document.getElementById("durationSelect");
  const customInput = document.getElementById("customDuration");


  durationSelect.addEventListener("change", () => {
    if (durationSelect.value === "custom") {
  customInput.classList.remove("hidden-input");
} else {
  customInput.classList.add("hidden-input");
}
  });


  document.getElementById("saveTimer").addEventListener("click", async () => {

    let duration;

    if (durationSelect.value === "custom") {
      duration = parseInt(customInput.value);
    } else {
      duration = parseInt(durationSelect.value);
    }

    duration = Number(duration);

    if (!duration || duration <= 0) {
      alert("Enter valid duration");
      return;
    }

    const token = await getToken();

    const res = await fetch(`${BRIDGE_URL}/update-timer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bridge-token": token
      },
      body: JSON.stringify({ duration })
    });

  if (!res.ok) {
  const text = await res.text();
  console.error("Timer update failed:", res.status, text);
  alert("Timer update failed: " + text);
  return;
}

    const data = await res.json();

if (data.expiryTimestamp) {

  await api.storage.local.set({
    activeTunnel: {
      url,
      expiryTimestamp: data.expiryTimestamp
    }
  });

  // reload UI with new timer
  initialize();

}

  });


  if (expiryTimestamp) {

    api.storage.local.set({
      activeTunnel: { url, expiryTimestamp }
    });

    startCountdown(expiryTimestamp);

  }

}


// ===============================
// Countdown Timer
// ===============================
function startCountdown(expiryTimestamp) {

  const timerEl = document.getElementById("timer");

  clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {

    const remaining = expiryTimestamp - Date.now();

    if (remaining <= 0) {
      timerEl.innerText = "Session expired";
      clearInterval(countdownInterval);
      return;
    }

    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    timerEl.innerText =
      `Expires in: ${hours}h ${minutes.toString().padStart(2,"0")}m ${seconds.toString().padStart(2,"0")}s`;

  }, 1000);

}


// ===============================
// Start Tunnel
// ===============================
async function startTunnel(port) {

  content.innerHTML =
    `<div class="card"><p>Creating public URL...</p></div>`;

  try {

    let token = await getToken();
    const duration = 30;

    // First attempt
    let res = await fetch(`${BRIDGE_URL}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bridge-token": token
      },
      body: JSON.stringify({
        port: Number(port),
        duration: Number(duration)
      })
    });

    // If unauthorized, refresh token and retry
    if (res.status === 403) {

      console.warn("Token expired, refreshing...");

      token = await getToken(true);

      res = await fetch(`${BRIDGE_URL}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bridge-token": token
        },
        body: JSON.stringify({
          port: Number(port),
          duration: Number(duration)
        })
      });

    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();

    if (data.running) {

      let expiry = data.expiryTimestamp;

      if (!expiry) {
        expiry = Date.now() + duration * 60 * 1000;
      }

      await api.storage.local.set({
        activeTunnel: {
          url: data.publicUrl,
          expiryTimestamp: expiry
        }
      });

      showActive(data.publicUrl, expiry);

    } else {

      loadPorts();

    }

  } catch (err) {

    console.error("Tunnel start failed:", err);

    content.innerHTML = `
      <div class="card">
        <h3>Failed to create tunnel</h3>
        <p>${err.message}</p>
      </div>
    `;

  }

}


// ===============================
// Load Available Local Ports
// ===============================
function loadPorts() {

  api.runtime.sendMessage({ type: "GET_PORTS" }, (response) => {

    if (api.runtime.lastError) {

      console.error("Runtime error:", api.runtime.lastError);

      content.innerHTML =
        `<div class="card"><p>Error detecting ports.</p></div>`;
      return;

    }

    if (!response || !response.ports || response.ports.length === 0) {

      content.innerHTML =
        `<div class="card"><p>No localhost projects detected.</p></div>`;
      return;

    }

    content.innerHTML =
      `<div class="card"><h3>Detected Projects</h3><div id="ports"></div></div>`;

    const portsContainer = document.getElementById("ports");

    response.ports.forEach((port) => {

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "share-btn mt-8";

      btn.innerText = `Share localhost:${port}`;

      btn.addEventListener("click", () => {
        startTunnel(port);
      });

      portsContainer.appendChild(btn);

    });

  });

}


// ===============================
// Initialize
// ===============================
document.addEventListener("DOMContentLoaded", async () => {

  content = document.getElementById("content");

  await initialize();

});