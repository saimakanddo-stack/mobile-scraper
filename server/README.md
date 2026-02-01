# 📡 Mobile Scraper Local Server

This is the backend proxy for the Mobile Scraper PWA. It bypasses CORS restrictions and serves the application to your mobile device.

## 🚀 Quick Start

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Start the Server**:

   ```bash
   npm start
   ```

## 📱 How to access from Mobile

To use the app on your phone while on the same Wi-Fi:

1. Open a terminal on your PC and type `ipconfig`.
2. Find the **IPv4 Address** (e.g., `192.168.0.105`).
3. On your phone, visit: `http://[YOUR_IP]:3000/index.html`

## ⚙️ How it works

The server performs two main tasks:

1. **Static Files**: Serves the `index.html`, `js/`, and `css/` files from the parent directory.
2. **CORS Proxy**: Provides an endpoint `/api/proxy` that fetches website content on behalf of the mobile app to bypass browser security blocks.
