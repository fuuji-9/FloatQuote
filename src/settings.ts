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

  // no position grid; H/V selects already covered by input listeners

  bindInput<HTMLButtonElement>("close").addEventListener("click", () => window.close());
  bindInput<HTMLButtonElement>("reset").addEventListener("click", async () => {
    fillForm(DEFAULTS);
    await applyAndBroadcast();
  });
});
