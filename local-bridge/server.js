const express = require("express");
const cors = require("cors");
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 54321;

// ===============================
// SESSION STATE
// ===============================
let tunnelProcess = null;
let currentUrl = null;
let expiryTimestamp = null;

// ===============================
// 🔐 TOKEN GENERATION
// ===============================
const tokenPath = path.join(__dirname, "bridge-token.txt");

let SECRET;

if (!fs.existsSync(tokenPath)) {
  SECRET = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(tokenPath, SECRET);
  console.log("Generated secure bridge token.");
} else {
  SECRET = fs.readFileSync(tokenPath, "utf8").trim();
}

// ===============================
// 🔐 AUTH MIDDLEWARE (FIXED)
// ===============================
app.use((req, res, next) => {
  const publicRoutes = ["/token", "/version", "/status"];

  // Allow public routes
  if (publicRoutes.some(route => req.originalUrl.startsWith(route))) {
    return next();
  }

  const clientToken = req.headers["x-bridge-token"];

  if (!clientToken || clientToken !== SECRET) {
    console.log("Blocked request:", req.originalUrl);
    return res.status(403).json({ error: "Unauthorized" });
  }

  next();
});

// ===============================
// 📦 UTILITY
// ===============================
const getCloudflaredPath = () => {
  const exePath = path.join(path.dirname(process.execPath), "cloudflared.exe");

  if (!fs.existsSync(exePath)) {
    console.error("cloudflared.exe not found.");
    process.exit(1);
  }

  return exePath;
};

function stopTunnel() {
  if (tunnelProcess) {
    tunnelProcess.kill();
    tunnelProcess = null;
    currentUrl = null;
    expiryTimestamp = null;
    console.log("Tunnel stopped");
  }
}

// ===============================
// ⏳ EXPIRY CHECKER (Editable Timer System)
// ===============================
setInterval(() => {
  if (tunnelProcess && expiryTimestamp) {
    if (Date.now() >= expiryTimestamp) {
      console.log("Session expired");
      stopTunnel();
    }
  }
}, 5000);

// ===============================
// 🚀 ROUTES
// ===============================
app.get("/token", (req, res) => {
  res.json({ token: SECRET });
});

app.get("/version", (req, res) => {
  res.json({ version: "2.0.0" });
});

app.get("/status", (req, res) => {
  res.json({
    running: !!tunnelProcess,
    publicUrl: currentUrl,
    expiryTimestamp
  });
});

// ===============================
// START TUNNEL (POST)
// ===============================
app.post("/start", (req, res) => {
  const { port, duration } = req.body;

  if (!port) {
    return res.status(400).json({ error: "Port required" });
  }

  if (tunnelProcess) {
    return res.json({
      running: true,
      publicUrl: currentUrl,
      expiryTimestamp
    });
  }

  const sessionDuration =
    duration && duration > 0 ? duration : 30;

  console.log("Starting tunnel for port:", port);

  const cloudflaredPath = getCloudflaredPath();

  tunnelProcess = spawn(cloudflaredPath, [
    "tunnel",
    "--url",
    `http://127.0.0.1:${port}`
  ]);

  let responded = false;

  const handleOutput = (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[-a-zA-Z0-9\.]+\.trycloudflare\.com/);

    if (match && !responded) {
      responded = true;
      currentUrl = match[0];

      expiryTimestamp =
        Date.now() + sessionDuration * 60 * 1000;

      res.json({
        running: true,
        publicUrl: currentUrl,
        expiryTimestamp
      });
    }
  };

  tunnelProcess.stdout.on("data", handleOutput);
  tunnelProcess.stderr.on("data", handleOutput);

  tunnelProcess.on("error", stopTunnel);
  tunnelProcess.on("close", stopTunnel);
});

// ===============================
// UPDATE TIMER (Editable)
// ===============================
app.post("/update-timer", (req, res) => {
  if (!tunnelProcess) {
    return res.status(400).json({ error: "No active session" });
  }

  const { duration } = req.body;

  if (!duration || duration <= 0) {
    return res.status(400).json({ error: "Invalid duration" });
  }

expiryTimestamp =
  Date.now() + duration * 60 * 1000;

  console.log("Timer updated. New expiry:", expiryTimestamp);

  res.json({
    success: true,
    expiryTimestamp
  });
});

app.get("/stop", (req, res) => {
  stopTunnel();
  res.json({ stopped: true });
});

// ===============================
// 🗑 UNINSTALL ROUTE (UNCHANGED)
// ===============================
app.get("/uninstall", (req, res) => {
  console.log("Enterprise uninstall initiated");

  const installDir = process.cwd();
  const nssmPath = path.join(installDir, "nssm.exe");
  const uninstallExe = path.join(installDir, "unins000.exe");

  if (!fs.existsSync(uninstallExe)) {
    return res.status(500).json({ error: "Uninstaller not found" });
  }

  res.json({ message: "Uninstall started" });

  setTimeout(() => {
    try {
      exec(`"${nssmPath}" stop LocalhostBridge`, () => {
        exec(`"${nssmPath}" remove LocalhostBridge confirm`, () => {
          exec(`"${uninstallExe}" /VERYSILENT`);
          process.exit(0);
        });
      });
    } catch (err) {
      console.error("Uninstall error:", err);
      process.exit(1);
    }
  }, 1000);
});

// ===============================
app.listen(PORT, () => {
  console.log(`Secure bridge running on http://127.0.0.1:${PORT}`);
});