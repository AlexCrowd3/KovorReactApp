# 🏢 Kovor — Coworking Space Finder App

**Kovor** is a React Native (Expo) application that helps users discover coworking spaces and work-friendly locations nearby.  
It provides an intuitive, modern interface with smooth animations, dark mode design, and detailed information about each coworking space — including photos, prices, contact details, and links to Telegram or WhatsApp.

---

## 🚀 Features

- 🔍 **Find coworking spaces nearby** — browse spaces in your city or area  
- 🖼️ **Photo gallery modal** with auto-scrolling image carousel  
- 💬 **Contact integration** — open links to Telegram, WhatsApp, or call directly  
- 🌙 **Full dark mode** — optimized for OLED screens  
- 📱 **Adaptive design** — responsive layout for all Android and iOS devices  
- 🧭 **Themed system UI** — black status and navigation bars with light icons  
- ⚡ **Smooth performance** — gesture-based navigation and modals  

---

## 🧩 Tech Stack

| Layer | Technology |
|:------|:------------|
| **Framework** | React Native (Expo) |
| **Navigation** | React Navigation (Stack Navigator) |
| **Gesture Handling** | react-native-gesture-handler |
| **UI Enhancements** | react-native-modal, react-native-svg |
| **State Management** | React Context (ThemeContext) |
| **Styling** | StyleSheet + custom Typography styles |
| **Platform Integration** | Expo Navigation Bar & Status Bar APIs |

---

## 🏗️ Project Architecture

The project follows a **modular and context-driven architecture**, organized for scalability and readability.

```

Kovor/
│
├── App.js                  # Main entry point (navigation, theming, status bar setup)
├── app.json                # Expo configuration (status bar, navigation bar, theme)
│
├── assets/                 # App icons and static images
│
└── src/
├── context/
│   └── ThemeContext.js        # Global theme provider (dark mode)
│
├── screens/
│   ├── SplashScreen.js        # Initial loading screen
│   └── HomeScreen.js          # Main app screen with coworking list
│
├── components/
│   ├── CoworkingModal.js     
│   ├── CoworkingModal.js    
│   └── FilterModal.js 
│
└── styles/
    ├── themes.js     
    ├── Fonts.js
    └── Typography.js          # Shared typography and font settings

````

---

## ⚙️ Core Architecture Overview

**1. Theming System**  
All UI components are wrapped in a custom `ThemeProvider` that exposes `theme` via `ThemeContext`.  
It supports dark mode and provides dynamic colors for backgrounds, text, and interactive elements.

**2. Navigation Flow**  
The app uses a minimal stack-based navigation structure:
- `SplashScreen` → Initial app load  
- `HomeScreen` → Main coworking listing and search view  

Each screen has its own layout and uses shared styling logic.

**3. Coworking Modal (Details View)**  
Displays detailed information about a coworking space:
- Auto-scrolling photo gallery (`FlatList`)
- Scrollable content area for info, rating, contacts, and social buttons
- Swipe-down gesture to close modal (`PanResponder`)
- Fully adaptive and responsive

**4. System UI Integration**  
Through Expo configuration and runtime API:
- Status Bar and Navigation Bar both use a dark background (`#000000`)
- Icons and text use light colors for contrast
- Applies globally on Android and iOS for visual consistency

---

## 📲 Running the Project

### 1️⃣ Install dependencies
```bash
npm install
````

### 2️⃣ Start the development server

```bash
npx expo start
```

### 3️⃣ Run on device or simulator

* Press `a` to open Android emulator
* Press `i` to open iOS simulator
* Scan QR code in the Expo Go app to test on a real device

---

## 🧠 Future Improvements

* 📍 Add map view with coworking locations
* 🔎 Filter & search by amenities or price
* 🪄 Improved animation transitions