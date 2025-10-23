import { listen } from "@tauri-apps/api/event";
import { Store } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

const FONT_MANIFEST: Record<string, { variable?: string; static?: Record<number, string> }> = {
  "Lexend": {
    variable: "/fonts/Lexend/Lexend-VariableFont_wght.ttf",
    static: {
      100: "/fonts/Lexend/static/Lexend-Thin.ttf",
      200: "/fonts/Lexend/static/Lexend-ExtraLight.ttf",
      300: "/fonts/Lexend/static/Lexend-Light.ttf",
      400: "/fonts/Lexend/static/Lexend-Regular.ttf",
      500: "/fonts/Lexend/static/Lexend-Medium.ttf",
      600: "/fonts/Lexend/static/Lexend-SemiBold.ttf",
      700: "/fonts/Lexend/static/Lexend-Bold.ttf",
      800: "/fonts/Lexend/static/Lexend-ExtraBold.ttf",
      900: "/fonts/Lexend/static/Lexend-Black.ttf",
    },
  },
  "DM Sans": {
    variable: "/fonts/DM_Sans/DMSans-VariableFont_opsz,wght.ttf",
    static: {
      100: "/fonts/DM_Sans/static/DMSans-Thin.ttf",
      200: "/fonts/DM_Sans/static/DMSans-ExtraLight.ttf",
      300: "/fonts/DM_Sans/static/DMSans-Light.ttf",
      400: "/fonts/DM_Sans/static/DMSans-Regular.ttf",
      500: "/fonts/DM_Sans/static/DMSans-Medium.ttf",
      600: "/fonts/DM_Sans/static/DMSans-SemiBold.ttf",
      700: "/fonts/DM_Sans/static/DMSans-Bold.ttf",
      800: "/fonts/DM_Sans/static/DMSans-ExtraBold.ttf",
      900: "/fonts/DM_Sans/static/DMSans-Black.ttf",
    },
  },
  "Bricolage Grotesque": {
    variable: "/fonts/Bricolage_Grotesque/BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf",
    static: {
      200: "/fonts/Bricolage_Grotesque/static/BricolageGrotesque-ExtraLight.ttf",
      300: "/fonts/Bricolage_Grotesque/static/BricolageGrotesque-Light.ttf",
      400: "/fonts/Bricolage_Grotesque/static/BricolageGrotesque-Regular.ttf",
      500: "/fonts/Bricolage_Grotesque/static/BricolageGrotesque-Medium.ttf",
      600: "/fonts/Bricolage_Grotesque/static/BricolageGrotesque-SemiBold.ttf",
      700: "/fonts/Bricolage_Grotesque/static/BricolageGrotesque-Bold.ttf",
      800: "/fonts/Bricolage_Grotesque/static/BricolageGrotesque-ExtraBold.ttf",
    },
  },
  "Playfair Display": {
    static: {
      400: "/fonts/Playfair_Display/static/PlayfairDisplay-Regular.ttf",
      500: "/fonts/Playfair_Display/static/PlayfairDisplay-Medium.ttf",
      600: "/fonts/Playfair_Display/static/PlayfairDisplay-SemiBold.ttf",
      700: "/fonts/Playfair_Display/static/PlayfairDisplay-Bold.ttf",
      800: "/fonts/Playfair_Display/static/PlayfairDisplay-ExtraBold.ttf",
      900: "/fonts/Playfair_Display/static/PlayfairDisplay-Black.ttf",
    },
  },
  "Parkinsans": {
    variable: "/fonts/Parkinsans/Parkinsans-VariableFont_wght.ttf",
    static: {
      300: "/fonts/Parkinsans/static/Parkinsans-Light.ttf",
      400: "/fonts/Parkinsans/static/Parkinsans-Regular.ttf",
      500: "/fonts/Parkinsans/static/Parkinsans-Medium.ttf",
      600: "/fonts/Parkinsans/static/Parkinsans-SemiBold.ttf",
      700: "/fonts/Parkinsans/static/Parkinsans-Bold.ttf",
      800: "/fonts/Parkinsans/static/Parkinsans-ExtraBold.ttf",
    },
  },
};

function injectFontFaces(family: string) {
  const existing = document.getElementById("fontfaces") as HTMLStyleElement | null;
  if (existing) existing.remove();
  const entry = FONT_MANIFEST[family];
  if (!entry) return;
  const style = document.createElement("style");
  style.id = "fontfaces";
  let css = "";
  if (entry.variable) {
    css += `@font-face{font-family:'${family}';src:url('${entry.variable}') format('truetype');font-weight:100 900;font-style:normal;font-display:swap;}`;
  }
  if (entry.static) {
    const weights = Object.keys(entry.static).map(w => Number(w)).sort((a,b)=>a-b);
    for (const w of weights) {
      const url = entry.static[w]!;
      css += `@font-face{font-family:'${family}';src:url('${url}') format('truetype');font-weight:${w};font-style:normal;font-display:swap;}`;
    }
  }
  style.textContent = css;
  document.head.appendChild(style);
}
type Settings = {
  text: string;
  fontFamily: string;
  fontSize: number;
  letterSpacing: number;
  color: string;
  fontWeight: string;
  textAlign: "left" | "center" | "right";
  verticalAlign: "flex-start" | "center" | "flex-end";
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
  letterSpacing: 0,
  color: "#ffffff",
  fontWeight: "700",
  textAlign: "left",
  verticalAlign: "flex-start",
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
  textEl.style.letterSpacing = `${s.letterSpacing ?? DEFAULTS.letterSpacing}px`;
  textEl.style.color = s.color;
  textEl.style.fontWeight = s.fontWeight;
  textEl.style.textAlign = s.textAlign;
  // ensure font files are available
  if (s.fontFamily && s.fontFamily !== "system-ui") {
    injectFontFaces(s.fontFamily);
  }
  // apply drop shadow
  const rgba = hexToRgba(s.shadowColor || DEFAULTS.shadowColor, s.shadowOpacity ?? DEFAULTS.shadowOpacity);
  textEl.style.textShadow = `${s.shadowOffsetX ?? 0}px ${s.shadowOffsetY ?? 0}px ${s.shadowBlur ?? 0}px ${rgba}`;

  root.style.justifyContent = s.textAlign === "left" ? "flex-start" : s.textAlign === "right" ? "flex-end" : "center";
  root.style.alignItems = s.verticalAlign;
  root.style.padding = `0px`;
  // apply edge margin relative to alignment
  const left = s.textAlign === "left" ? s.padding : s.textAlign === "center" ? s.padding : 0;
  const right = s.textAlign === "right" ? s.padding : s.textAlign === "center" ? s.padding : 0;
  const top = s.verticalAlign === "flex-start" ? s.padding : s.verticalAlign === "center" ? s.padding : 0;
  const bottom = s.verticalAlign === "flex-end" ? s.padding : s.verticalAlign === "center" ? s.padding : 0;
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
