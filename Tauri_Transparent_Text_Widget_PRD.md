
# 🧾 Product Requirements Document (PRD)

## Project: **Tauri Transparent Text Widget**

### Purpose
A minimal fullscreen overlay widget for Windows, displaying customizable motivational quotes or reminders on the desktop. The widget sits behind windows, is click-through (optional), and has a small system tray menu for control.

---

## 🔧 Tech Stack

| Component       | Stack/Tool             |
|----------------|------------------------|
| Frontend       | Svelte                 |
| Backend        | Rust via Tauri         |
| Desktop App    | Tauri v2               |
| Settings UI    | Svelte + system tray   |
| Build Tool     | Vite                   |
| Persistence    | Tauri `store` plugin   |
| OS Target      | Windows 11             |

---

## 📦 Features & Functionality

### 1. Transparent Fullscreen Overlay Window
- Displays user-defined text (quote, mantra, goal, etc.).
- Always-on, non-interactive overlay (click-through optional).
- Sits *behind* active windows, like wallpaper enhancement.
- Transparent background, CSS-controlled text box.
- CSS-driven layout (font, color, padding, alignment).

### 2. Live Settings Panel
Accessible from System Tray:
- **Font Family:** Choose from 4 default Google Fonts + optional toggle for system fonts.
- **Font Size, Color, Weight/Style**
- **Text Alignment:** Left, center, right.
- **Vertical Alignment:** Top, center, bottom.
- **Padding**: Numeric input for consistent spacing.
- **Live Preview**: Overlay updates live as settings are changed.
- **Persistence:** All settings are saved between sessions.

### 3. System Tray
- Appears in Windows system tray.
- Includes:
  - 🛠 `Settings`: Opens the settings window.
  - ❌ `Quit`: Cleanly closes the widget and exits Tauri.

### 4. Persistent Settings
- Uses `tauri-plugin-store` to persist all user preferences.
- Saved to local JSON file (e.g., `.widget-settings.json`).
- Loads on startup and restores previous display settings.

### 5. Auto-Start (optional / WIP)
- Optionally autostarts with Windows (using `tauri-plugin-autostart`).
- Can be toggled from settings window (WIP).

---

## 💥 Known Issues / Fix History

### ❌ Tauri v2 Migration
- Encountered multiple `tauri.conf.json` validation errors (resolved by switching to `Tauri.toml` instead).
- System Tray code migrated from Tauri v1 (invalid v2 imports like `SystemTray`, `TrayIconBuilder`, etc.).
- Replaced deprecated items with:
  - `tauri_plugin_shell`
  - `tauri_plugin_store`
  - `WindowBuilder` (2-arg only)
  - `AppHandle.tray_handle()`

---

## ✅ Acceptance Criteria

| Feature                             | Requirement                                             |
|------------------------------------|---------------------------------------------------------|
| Text display                       | Must render overlay with CSS-customized text           |
| Settings panel                     | Must update preview live and save changes              |
| System tray                        | Must have working "Settings" and "Quit" options        |
| Settings persistence               | Must reload last used settings on next launch          |
| Click-through behavior (optional)  | Configurable via code (future toggle option possible)  |

---

## 🧪 Testing Requirements

- Test on Windows 11 (primary target).
- Ensure overlay displays above wallpaper but behind all windows.
- Settings must reflect real-time changes.
- Overlay must respect alignment, font, and spacing settings.
- Restarting app must restore all prior user settings.

---

## 📁 Folder Structure (example)

```
tauri-text-widget/
├── src-tauri/
│   ├── main.rs
│   ├── Tauri.toml
│   └── icons/
├── src/
│   ├── settings.html
│   ├── App.svelte
│   ├── main.ts
├── public/
│   └── settings.html
├── package.json
└── vite.config.ts
```

---

## 🧠 AI Agent Prompt Suggestion

> You're helping me build a Windows desktop widget using Tauri v2 and Svelte. The app displays a fullscreen transparent overlay behind all windows, showing motivational text with customizable font, alignment, and padding. Users can open a settings window via a system tray menu to change the appearance in real-time. The settings are persisted between sessions using the `tauri-plugin-store`. Please follow the PRD below and help build the system tray logic, overlay window, settings interface, and ensure all settings persist correctly. Use Rust and Svelte best practices.

---
