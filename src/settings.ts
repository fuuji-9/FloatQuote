import { emit } from "@tauri-apps/api/event";
import { Store } from "@tauri-apps/plugin-store";

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
  clickThrough: true,
};

let store: Store;

function applyPreview(s: Settings) {
  const el = document.getElementById("preview-text") as HTMLElement | null;
  if (!el) return;
  el.textContent = s.text || DEFAULTS.text;
  el.style.fontFamily = s.fontFamily;
  el.style.fontSize = `${s.fontSize}px`;
  el.style.color = s.color;
  el.style.fontWeight = s.fontWeight;
  el.style.textAlign = s.textAlign;
  const container = el.parentElement as HTMLElement | null;
  if (container) {
    container.style.display = "flex";
    container.style.justifyContent = s.textAlign === "left" ? "flex-start" : s.textAlign === "right" ? "flex-end" : "center";
    container.style.alignItems = s.verticalAlign;
    container.style.padding = `${s.padding}px`;
  }
}

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
  const clickThrough = bindInput<HTMLInputElement>("clickThrough").checked;
  return { text, fontFamily, fontSize, color, fontWeight, textAlign, verticalAlign, padding, clickThrough };
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
  bindInput<HTMLInputElement>("clickThrough").checked = s.clickThrough;
}

async function applyAndBroadcast() {
  const settings = toSettings();
  applyPreview(settings);
  await saveSettings(settings);
  await emit("settings-changed", settings);
}

window.addEventListener("DOMContentLoaded", async () => {
  store = await Store.load(".widget-settings.json");
  const s = await loadSettings();
  fillForm(s);
  applyPreview(s);

  [
    "text",
    "fontFamily",
    "fontSize",
    "color",
    "fontWeight",
    "textAlign",
    "verticalAlign",
    "padding",
    "clickThrough",
  ].forEach((id) => bindInput<HTMLElement>(id).addEventListener("input", applyAndBroadcast));

  bindInput<HTMLButtonElement>("close").addEventListener("click", () => window.close());
  bindInput<HTMLButtonElement>("reset").addEventListener("click", async () => {
    fillForm(DEFAULTS);
    await applyAndBroadcast();
  });
});
