# 📱 Mobile Tools - Web Scraper

A Progressive Web App (PWA) for web scraping, optimized for mobile devices.

## ✨ Features

- 📱 **Mobile-First Design** - Optimized for smartphones and tablets
- 🔄 **Offline Support** - Works without internet connection (PWA)
- 📲 **Installable** - Add to home screen like a native app
- 🌙 **Dark/Light Theme** - Automatic theme switching
- 👆 **Touch-Optimized** - Large tap targets and gesture support
- 🔔 **Notifications** - Get notified when scraping completes
- 📤 **Share API** - Share results easily
- 💾 **Local Storage** - All data stored locally on your device

## 🚀 Quick Start

### Option 1: Direct Access (No Installation)

1. Open `index.html` in your mobile browser
2. Start scraping immediately!

### Option 2: Install as PWA (Recommended)

1. Open the app in Chrome/Safari on your phone
2. Tap the menu button (☰) in the header
3. Follow the install prompt
4. App will be added to your home screen

### Option 3: With CORS Proxy (For Full Functionality)

1. Navigate to the `server` folder
2. Run: `node proxy.js`
3. Server will start on `http://localhost:3000`
4. Open `http://localhost:3000/index.html` on your phone

## 📖 How to Use

### Page Range Mode

1. Select **"📄 Page Range"** tab
2. Enter the website URL
3. Set start and end page numbers
4. Choose scraping direction
5. Tap the **▶️ FAB button** to start

### Custom Links Mode

1. Select **"🔗 Custom Links"** tab
2. Paste movie URLs (one per line)
3. Tap the **▶️ FAB button** to start

### Import Existing JSON

1. Expand **"📥 Import Existing JSON"** section
2. Enter JSON URL
3. Choose merge position (append/prepend)
4. Scraping will merge with existing data

### Export Results

1. Expand **"📊 Results & Export"** section
2. Choose export option:
   - **📊 View Full JSON** - See all data
   - **✨ View New Only** - See only new scraped items
   - **📋 Copy Full JSON** - Copy to clipboard
   - **📄 Copy Content Only** - Copy without formatting
   - **💾 Save JSON File** - Download as file
   - **📤 Share** - Use native share (mobile only)

## 🎨 UI Components

- **FAB (Floating Action Button)** - Start/Stop scraping
- **Bottom Navigation** - Switch between views
- **Collapsible Sections** - Save screen space
- **Toast Notifications** - Real-time feedback
- **Progress Bar** - Visual scraping progress
- **Status Panel** - Live statistics

## 🔧 Technical Details

### PWA Features

- Service Worker for offline caching
- Web App Manifest for installation
- Background sync for failed requests
- Push notifications for completion alerts

### Browser Compatibility

- ✅ Chrome Mobile (latest 2 versions)
- ✅ Safari iOS (latest 2 versions)
- ✅ Samsung Internet
- ✅ Firefox Mobile
- ✅ Desktop browsers (backward compatible)

### Storage

- **IndexedDB** - For large scraped datasets
- **localStorage** - For settings and preferences
- **Service Worker Cache** - For offline assets

## 📁 Project Structure

```
Mobile Tools/
├── index.html              # Main app
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline support
├── css/
│   ├── themes.css         # Theme variables
│   └── mobile.css         # Mobile styles
├── js/
│   ├── app.js             # App controller
│   ├── scraper.js         # Scraping engine (Phase 2)
│   ├── storage.js         # Data management (Phase 2)
│   ├── ui.js              # UI interactions (Phase 2)
│   └── notifications.js   # Push notifications (Phase 2)
├── assets/
│   └── icons/             # PWA icons
├── server/
│   └── proxy.js           # CORS proxy (optional)
└── README.md              # This file
```

## 🔐 Privacy & Security

- ✅ All data stored locally on your device
- ✅ No tracking or analytics
- ✅ No cloud sync (unless you enable it)
- ✅ HTTPS only connections
- ✅ No third-party dependencies

## 🐛 Troubleshooting

### App won't install

- Make sure you're using HTTPS or localhost
- Check if browser supports PWA
- Clear browser cache and try again

### Scraping not working

- Check if CORS proxy is running
- Verify website URL is correct
- Check internet connection

### Notifications not showing

- Grant notification permission when prompted
- Check device notification settings
- Ensure app is not in battery saver mode

### Data not saving

- Check browser storage quota
- Clear old data if storage is full
- Ensure cookies/storage is enabled

## 📝 Development Status

### ✅ Phase 1: Foundation (Complete)

- Directory structure
- PWA manifest and icons
- Mobile-first HTML/CSS
- Service worker
- Basic UI functionality

### 🚧 Phase 2: Core Features (In Progress)

- Scraping engine adaptation
- Data storage (IndexedDB)
- Full UI interactions
- Touch gestures

### ⏳ Phase 3: PWA Features (Planned)

- Background sync
- Push notifications
- Offline scraping queue

### ⏳ Phase 4: Polish (Planned)

- Performance optimization
- Cross-device testing
- Bug fixes

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

Free to use for personal projects.

---

**Version:** 1.0.0 (Phase 1)  
**Last Updated:** February 1, 2026  
**Status:** ✅ Foundation Complete, 🚧 Core Features In Progress

Made with ❤️ for mobile users
