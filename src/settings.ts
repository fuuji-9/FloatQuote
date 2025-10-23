import { emit } from "@tauri-apps/api/event";
import { Store } from "@tauri-apps/plugin-store";

// Font manifest: available families and sources
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

function populateFamilies() {
  const sel = document.getElementById("fontFamily") as HTMLSelectElement | null;
  if (!sel) return;
  sel.innerHTML = "";
  const families = ["system-ui", ...Object.keys(FONT_MANIFEST)];
  for (const f of families) {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f === "system-ui" ? "System UI" : f;
    sel.appendChild(opt);
  }
}

function populateWeights(family: string, current?: string) {
  const sel = document.getElementById("fontWeight") as HTMLSelectElement | null;
  if (!sel) return;
  sel.innerHTML = "";
  const entry = FONT_MANIFEST[family];
  let weights: number[] = [];
  if (family === "system-ui") {
    weights = [300,400,500,600,700];
  } else if (entry?.variable) {
    weights = [100,200,300,400,500,600,700,800,900];
  } else if (entry?.static) {
    weights = Object.keys(entry.static).map(n=>Number(n)).sort((a,b)=>a-b);
  }
  if (weights.length === 0) weights = [400,700];
  for (const w of weights) {
    const opt = document.createElement("option");
    opt.value = String(w);
    opt.textContent = ({100:"Thin",200:"ExtraLight",300:"Light",400:"Regular",500:"Medium",600:"SemiBold",700:"Bold",800:"ExtraBold",900:"Black"} as any)[w] || String(w);
    sel.appendChild(opt);
  }
  if (current && weights.includes(Number(current))) sel.value = current;
}

type Settings = {
  text: string;
  fontFamily: string;
  fontSize: number;
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

// removed local preview; live updates broadcast to the overlay

async function loadSettings(): Promise<Settings> {
  const data = (await store.get<Partial<Settings>>("settings")) || {};
  return { ...DEFAULTS, ...data };
}

async function saveSettings(s: Settings) {
  await store.set("settings", s);
  await store.save();
}

function bindInput<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

function toSettings(): Settings {
  const text = (bindInput<HTMLInputElement>("text").value || DEFAULTS.text).toString();
  const fontFamily = bindInput<HTMLSelectElement>("fontFamily").value;
  const fontSize = Number(bindInput<HTMLInputElement>("fontSize").value) || DEFAULTS.fontSize;
  const color = bindInput<HTMLInputElement>("color").value || DEFAULTS.color;
  const fontWeight = bindInput<HTMLSelectElement>("fontWeight").value;
  const textAlign = bindInput<HTMLSelectElement>("textAlign").value as Settings["textAlign"];
  const verticalAlign = bindInput<HTMLSelectElement>("verticalAlign").value as Settings["verticalAlign"];
  const padding = Number(bindInput<HTMLInputElement>("padding").value) || DEFAULTS.padding;
  const display = bindInput<HTMLSelectElement>("display").value as Settings["display"];
  const shadowColor = bindInput<HTMLInputElement>("shadowColor").value || DEFAULTS.shadowColor;
  const shadowOpacity = Number(bindInput<HTMLInputElement>("shadowOpacity").value || DEFAULTS.shadowOpacity);
  const shadowOffsetX = Number(bindInput<HTMLInputElement>("shadowOffsetX").value || DEFAULTS.shadowOffsetX);
  const shadowOffsetY = Number(bindInput<HTMLInputElement>("shadowOffsetY").value || DEFAULTS.shadowOffsetY);
  const shadowBlur = Number(bindInput<HTMLInputElement>("shadowBlur").value || DEFAULTS.shadowBlur);
  return { text, fontFamily, fontSize, color, fontWeight, textAlign, verticalAlign, padding, display, shadowColor, shadowOpacity, shadowOffsetX, shadowOffsetY, shadowBlur };
}

function fillForm(s: Settings) {
  bindInput<HTMLInputElement>("text").value = s.text;
  bindInput<HTMLSelectElement>("fontFamily").value = s.fontFamily;
  bindInput<HTMLInputElement>("fontSize").value = String(s.fontSize);
  bindInput<HTMLInputElement>("color").value = s.color;
  bindInput<HTMLSelectElement>("fontWeight").value = s.fontWeight;
  bindInput<HTMLSelectElement>("textAlign").value = s.textAlign;
  bindInput<HTMLSelectElement>("verticalAlign").value = s.verticalAlign;
  bindInput<HTMLInputElement>("padding").value = String(s.padding);
  bindInput<HTMLSelectElement>("display").value = s.display;
  bindInput<HTMLInputElement>("shadowColor").value = s.shadowColor;
  bindInput<HTMLInputElement>("shadowOpacity").value = String(s.shadowOpacity);
  bindInput<HTMLInputElement>("shadowOffsetX").value = String(s.shadowOffsetX);
  bindInput<HTMLInputElement>("shadowOffsetY").value = String(s.shadowOffsetY);
  bindInput<HTMLInputElement>("shadowBlur").value = String(s.shadowBlur);
}

async function applyAndBroadcast() {
  const settings = toSettings();
  await saveSettings(settings);
  await emit("settings-changed", settings);
}

window.addEventListener("DOMContentLoaded", async () => {
  store = await Store.load(".widget-settings.json");
  const s = await loadSettings();
  // populate families and weights before filling form
  populateFamilies();
  injectFontFaces(s.fontFamily);
  populateWeights(s.fontFamily, s.fontWeight);
  fillForm(s);

  [
    "text",
    "fontFamily",
    "fontSize",
    "color",
    "fontWeight",
    "textAlign",
    "verticalAlign",
    "padding",
    "display",
    "shadowColor",
    "shadowOpacity",
    "shadowOffsetX",
    "shadowOffsetY",
    "shadowBlur",
  ].forEach((id) => bindInput<HTMLElement>(id).addEventListener("input", applyAndBroadcast));

  // update weights and load faces on family change
  (document.getElementById("fontFamily") as HTMLSelectElement | null)?.addEventListener("change", (e) => {
    const fam = (e.target as HTMLSelectElement).value;
    injectFontFaces(fam);
    populateWeights(fam);
  });

  // no position grid; H/V selects already covered by input listeners

  bindInput<HTMLButtonElement>("close").addEventListener("click", () => window.close());
  bindInput<HTMLButtonElement>("reset").addEventListener("click", async () => {
    fillForm(DEFAULTS);
    await applyAndBroadcast();
  });
});
