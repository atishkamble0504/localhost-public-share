# 🚀 Localhost Public URL

### Share your local development server instantly with a public link

---

## 📌 Overview

**Localhost Public URL** is a Chrome Extension + Native Bridge system that allows you to expose your local development server (e.g., `localhost:3000`) to the internet using a secure public URL.

It automatically generates a shareable link and QR code — making it easy to test, demo, or share your project with anyone.


## 🎥 Demo Video

Watch how the extension works in real-time:

[![Watch Demo](https://img.youtube.com/vi/gW-BjU5cfbQ/0.jpg)](https://youtu.be/gW-BjU5cfbQ)

---

## ✨ Features

* 🌐 Instantly expose localhost to public URL
* 🔗 One-click sharing from Chrome extension
* 📱 QR code generation for mobile testing
* ⚡ Fast & lightweight native bridge
* 🔒 Secure connection using Cloudflare tunnel
* 🧩 Works with any local port

---

## 🏗️ Project Structure

```
localhost-public-share/
├── extension/        # Chrome Extension
├── local-bridge/     # Node.js Native Bridge
├── installer/        # Setup scripts (optional)
├── README.md
└── .gitignore
```

---

## ⚙️ How It Works

1. Chrome extension detects running localhost projects
2. Native bridge starts a secure tunnel (via Cloudflare)
3. Public URL is generated
4. QR code + share link is displayed

---

## 🧩 Chrome Extension Setup

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer Mode**
4. Click **Load unpacked**
5. Select the `extension/` folder

---

## 🖥️ Local Bridge Setup

Navigate to:

```
local-bridge/
```

Install dependencies:

```bash
npm install
```

Run the server:

```bash
node server.js
```

---

## 📦 QR Code Generation (QRCode.js)

This project uses a lightweight JavaScript library based on **QRCode.js** to generate QR codes for sharing URLs.

### Basic Usage

```html
<div id="qrcode"></div>

<script>
new QRCode(document.getElementById("qrcode"), "http://localhost:3000");
</script>
```

---

### With Options

```javascript
var qrcode = new QRCode(document.getElementById("qrcode"), {
  text: "http://localhost:3000",
  width: 128,
  height: 128,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H
});
```

---

### Methods

```javascript
qrcode.clear();
qrcode.makeCode("http://new-url.com");
```

---

## 📦 Installer (Optional)

Installer setup is available using `.iss` script for Windows deployment.

> ⚠️ Executable files are not included in this repository.
> They should be distributed via GitHub Releases.

---

## 🚀 Use Cases

* 📱 Test websites on mobile devices
* 👥 Share work with clients instantly
* 🧪 Debug across different networks
* 🎥 Demo projects quickly

---

## 🔒 Security Note

* No sensitive files (tokens, executables) are included in the repo
* Always keep `.env` and private keys excluded

---

## 📈 Future Improvements

* UI enhancements
* Multi-port detection
* Auto-start bridge service
* Cross-platform installer

---

## 📜 License

MIT License

---

## 👨‍💻 Author

**Atish Kamble**

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
