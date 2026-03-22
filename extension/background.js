// ===============================
// Localhost Public URL
// Background Service Worker
// ===============================

// Cross-browser API support
const api = typeof browser !== "undefined" ? browser : chrome;

let detectedPorts = {};

// -------------------------------
// Check if URL is localhost
// -------------------------------
function isLocalhost(url) {
  try {
    const parsed = new URL(url);
    return ["localhost","127.0.0.1","0.0.0.0"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

// -------------------------------
// Extract port safely
// -------------------------------
function extractPort(url) {
  try {
    const parsed = new URL(url);
    return parsed.port || "80";
  } catch {
    return null;
  }
}

// -------------------------------
// Update badge state
// -------------------------------
function updateBadge() {
  const hasPorts = Object.keys(detectedPorts).length > 0;

  if (hasPorts) {
    api.action.setBadgeText({ text: "DEV" });
    api.action.setBadgeBackgroundColor({ color: "#16a34a" });
  } else {
    api.action.setBadgeText({ text: "" });
  }
}

// -------------------------------
// Monitor tab updates
// -------------------------------
api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url || changeInfo.status !== "complete") return;

  if (isLocalhost(tab.url)) {
    const port = extractPort(tab.url);
    if (port) {
      detectedPorts[port] = true;
      updateBadge();
    }
  }
});

// -------------------------------
// Recalculate ports when tab closes
// -------------------------------
api.tabs.onRemoved.addListener(() => {
  api.tabs.query({}, (tabs) => {
    detectedPorts = {};

    tabs.forEach((tab) => {
      if (tab.url && isLocalhost(tab.url)) {
        const port = extractPort(tab.url);
        if (port) detectedPorts[port] = true;
      }
    });

    updateBadge();
  });
});

// -------------------------------
// Message Listener
// -------------------------------
api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_PORTS") {
    sendResponse({ ports: Object.keys(detectedPorts) });
  }
});