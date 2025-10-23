import { listen } from "@tauri-apps/api/event";
import { Store } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

type Settings = {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  fontWeight: string;
  textAlign: "left" | "center" | "right";
  verticalAlign: "flex-start" | "center" | "flex-end";
  padding: number;
  clickThrough: boolean;
};

const DEFAULTS: Settings = {
  text: "your text goes here",
  fontFamily: "system-ui",
  fontSize: 48,
  color: "#ffffff",
  fontWeight: "700",
  textAlign: "left",
  verticalAlign: "flex-start",
  padding: 20,
  clickThrough: false,
};

let store: Store;

function applySettings(s: Settings) {
  const root = document.getElementById("overlay-root") as HTMLElement | null;
  const textEl = document.getElementById("widget-text") as HTMLElement | null;
  if (!root || !textEl) return;

  textEl.textContent = s.text || DEFAULTS.text;
  textEl.style.fontFamily = s.fontFamily;
  textEl.style.fontSize = `${s.fontSize}px`;
  textEl.style.color = s.color;
  textEl.style.fontWeight = s.fontWeight;
  textEl.style.textAlign = s.textAlign;

  root.style.justifyContent = s.textAlign === "left" ? "flex-start" : s.textAlign === "right" ? "flex-end" : "center";
  root.style.alignItems = s.verticalAlign;
  root.style.padding = `${s.padding}px`;
  root.style.pointerEvents = s.clickThrough ? "none" : "auto";

  // Try to inform Rust about click-through for native hit testing
  invoke("set_click_through", { enabled: s.clickThrough }).catch(() => {});
}

async function loadSettings(): Promise<Settings> {
  const data = (await store.get<Partial<Settings>>("settings")) || {};
  return { ...DEFAULTS, ...data };
}

async function ensureSettingsWindow() {
  const label = "settings";
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    await existing.setFocus();
    return;
  }
  new WebviewWindow(label, {
    url: "/settings.html",
    title: "Settings",
    width: 520,
    height: 640,
    visible: true,
    resizable: true,
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  store = await Store.load(".widget-settings.json");
  const s = await loadSettings();
  applySettings(s);

  await listen<Settings>("settings-changed", (e) => {
    applySettings(e.payload);
    // persist also from overlay side to be safe
    store.set("settings", e.payload).then(() => store.save());
  });

  // If Rust tray emits this event, open settings window
  await listen("open-settings", () => {
    ensureSettingsWindow();
  });
});
