# 📸 Artifact Scanner

## Overview
**Artifact Scanner** is a modern Progressive Web Application (PWA) designed for archaeologists, hobbyists, and researchers to document, track, and manage archaeological finds. This application allows users to capture photos of artifacts, automatically tag them with high-precision GPS coordinates, and maintain a digital catalog of their discoveries directly from their mobile device or desktop.

Built with a focus on usability and offline capabilities, all data is stored locally on the device, ensuring privacy and accessibility even in remote locations.

## ✨ Key Features

- **📷 Smart Scanning**: seamlessly capture photos using the device camera or upload existing images from your gallery.
- **📍 GPS Geotagging**: Automatically records precise latitude, longitude, and accuracy data for every artifact scanned.
- **🗄️ Local Database**: A robust local storage system keeps your collection safe and accessible offline without needing an internet connection.
- **📝 Interactive Notes**: Add detailed observations, notes, or "chat" logs to each specific artifact to keep track of findings.
- **🗺️ Map Integration**: Visualize artifact locations with direct integration to Google Maps for easy navigation back to find sites.
- **📤 Data Export**: Export your entire collection and notes as a JSON file for backup or analysis in other tools.
- **📱 PWA Support**: Installable as a standalone application on mobile and desktop devices for a native app-like experience.
- **🔗 Sharing**: utilizing the Web Share API to easily share discovery details with colleagues or friends.

## 🛠️ Technology Stack

This project is built using modern web technologies, leveraging CDN-based libraries for a lightweight and setup-free experience:

- **Core**: HTML5, JavaScript (ES6+), CSS3
- **Framework**: [React 18](https://reactjs.org/) (via CDN)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (via CDN) for rapid, responsive UI development.
- **Icons**: [Lucide React](https://lucide.dev/) for beautiful, consistent iconography.
- **Compiler**: [Babel](https://babeljs.io/) (standalone) for in-browser JSX transformation.

### Web APIs Used
- **Geolocation API**: For acquiring high-accuracy GPS coordinates.
- **MediaDevices API**: For accessing the camera stream.
- **FileReader API**: For processing image uploads.
- **Web Share API**: For native sharing capabilities.
- **LocalStorage API**: For persistent client-side data storage.

## 🚀 Getting Started

Since this application uses CDN links for its dependencies, no complex build step (like `npm install`) is strictly required to run the development version.

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge).
- A local web server is **highly recommended** to ensure features like the Camera and Service Workers function correctly (as they often require HTTPS or `localhost`).

### Installation & Running

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd sigma-7-scanner-app
   ```

2. **Run with a Local Server**:
   You can use any static file server. For example, if you have Python installed:
   ```bash
   # Python 3
   python -m http.server 8000
   ```
   Or using Node.js `http-server`:
   ```bash
   npx http-server .
   ```

3. **Open the App**:
   Navigate to `http://localhost:8000` in your web browser.

## 📖 Usage Guide

1. **Scan Mode**:
   - Grant camera permissions when prompted.
   - Point your camera at an artifact and tap **"Capture Photo"**.
   - Alternatively, tap **"Upload Photo"** to select an image from your device.
   - The app will automatically attempt to fetch your GPS location.

2. **Collection View**:
   - Switch to the **"Collection"** tab to see a grid of all your saved artifacts.
   - Tap on any card to see more options like Chat, Map, Share, or Delete.

3. **Map & Details**:
   - Click **"Map"** on an artifact to view its precise location details and get a link to Google Maps.

4. **Exporting Data**:
   - In the Collection view, click the **"Export"** button to download a `.json` backup of your data.

## 📂 Project Structure

```
sigma-7-scanner-app/
├── 📄 index.html          # Main entry point, loads libraries and styles
├── 📄 app.js              # Main application logic (React components)
├── 📄 manifest.json       # PWA manifest configuration
├── 📄 service-worker.js   # Service worker for offline support (PWA)
└── 📄 README.md           # Project documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
