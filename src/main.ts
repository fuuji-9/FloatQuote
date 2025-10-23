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
  position: "tl" | "tc" | "tr" | "cl" | "cc" | "cr" | "bl" | "bc" | "br";
  padding: number;
  display: "primary" | "secondary";
  shadowColor: string;
  shadowOpacity: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
};

const DEFAULTS: Settings = {
  text: "your text goes here",
  fontFamily: "system-ui",
  fontSize: 48,
  color: "#ffffff",
  fontWeight: "700",
  position: "tl",
  padding: 20,
  display: "primary",
  shadowColor: "#000000",
  shadowOpacity: 0.7,
  shadowOffsetX: 3,
  shadowOffsetY: 3,
  shadowBlur: 10,
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
  // map position to alignment
  const mapH = (p: Settings["position"]): "left"|"center"|"right" => (p.endsWith('l') ? 'left' : p.endsWith('c') ? 'center' : 'right');
  const mapV = (p: Settings["position"]): "flex-start"|"center"|"flex-end" => (p.startsWith('t') ? 'flex-start' : p.startsWith('c') ? 'center' : 'flex-end');
  const h = mapH(s.position || DEFAULTS.position);
  const v = mapV(s.position || DEFAULTS.position);
  textEl.style.textAlign = h;
  // apply drop shadow
  const rgba = hexToRgba(s.shadowColor || DEFAULTS.shadowColor, s.shadowOpacity ?? DEFAULTS.shadowOpacity);
  textEl.style.textShadow = `${s.shadowOffsetX ?? 0}px ${s.shadowOffsetY ?? 0}px ${s.shadowBlur ?? 0}px ${rgba}`;

  root.style.justifyContent = h === "left" ? "flex-start" : h === "right" ? "flex-end" : "center";
  root.style.alignItems = v;
  root.style.padding = `0px`;
  // apply edge margin relative to alignment
  const left = h === "left" ? s.padding : h === "center" ? s.padding : 0;
  const right = h === "right" ? s.padding : h === "center" ? s.padding : 0;
  const top = v === "flex-start" ? s.padding : v === "center" ? s.padding : 0;
  const bottom = v === "flex-end" ? s.padding : v === "center" ? s.padding : 0;
  textEl.style.margin = `${top}px ${right}px ${bottom}px ${left}px`;
  root.style.pointerEvents = "none";
  // Ensure native click-through is on
  invoke("set_click_through", { enabled: true }).catch(() => {});
  // Move to selected display
  invoke("set_overlay_display", { which: s.display }).catch(() => {});
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

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '').trim();
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const a = Math.min(Math.max(alpha, 0), 1);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
