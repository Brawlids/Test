/* NEBULA OS — central state + live theme engine. */
const AURA_PRESETS = {
  ion:   { a1: "#35e0ff", a2: "#8a6bff" },
  nova:  { a1: "#ff4dd8", a2: "#ff8a5c" },
  vibe:  { a1: "#8f7bff", a2: "#38e0ff" },
  ember: { a1: "#ffd34d", a2: "#ff5c7a" },
  mint:  { a1: "#3dffb0", a2: "#35a8ff" },
  toxic: { a1: "#b6ff45", a2: "#00e0c8" }
};

const DEFAULT = {
  aura: "ion",
  particles: true,
  grid: true,
  blobs: true,
  glow: true,
  blur: 26,
  blobIntensity: 55,
  density: 60
};

class State {
  constructor() {
    this.s = { ...DEFAULT };
    this.listeners = [];
  }
  init() {
    this.applyAura(this.s.aura);
    this.applyToken("--blur", this.s.blur + "px");
    this.rebind(this.s);
  }
  get(k) { return this.s[k]; }
  set(k, v) {
    this.s[k] = v;
    if (k === "aura") this.applyAura(v);
    else if (k === "blur") this.applyToken("--blur", v + "px");
    else if (k === "particles" || k === "grid" || k === "blobs") {
      document.body.style.setProperty(`--show-${k}`, v ? "block" : "none");
    }
    this.emit(k, v);
    this.persist();
  }
  rebind(partial) {
    const p = (n, v) => document.body.style.setProperty(`--show-${n}`, v ? "block" : "none");
    p("particles", partial.particles !== false);
    p("grid", partial.grid !== false);
    p("blobs", partial.blobs !== false);
    this.applyToken("--blur", partial.blur + "px");
    if (partial.glow === false) document.body.style.setProperty("--glow", "0");
    else document.body.style.removeProperty("--glow");
  }
  applyAura(name) {
    const p = AURA_PRESETS[name] || AURA_PRESETS.ion;
    const root = document.documentElement;
    root.style.setProperty("--a1", p.a1);
    root.style.setProperty("--a2", p.a2);
    root.style.setProperty("--accent", p.a1);
    this.s.aura = name;
  }
  applyToken(k, v) { document.documentElement.style.setProperty(k, v); }
  onChange(fn) { this.listeners.push(fn); return fn; }
  off(fn) { this.listeners = this.listeners.filter((l) => l !== fn); }
  emit(k, v) { this.listeners.forEach((fn) => { try { fn(k, v); } catch (_) {} }); }
  persist() {
    try { localStorage.setItem("nebula-os", JSON.stringify(this.s)); } catch (_) {}
  }
  restore() {
    try {
      const raw = localStorage.getItem("nebula-os");
      if (raw) { const d = { ...DEFAULT, ...JSON.parse(raw) }; Object.assign(this.s, d); }
    } catch (_) {}
  }
}

export const state = new State();
export const AURA_PRESETS_META = {
  ion:   { name: "ION",   one: "#35e0ff", two: "#8a6bff" },
  nova:  { name: "NOVA",  one: "#ff4dd8", two: "#ff8a5c" },
  vibe:  { name: "VIBE",  one: "#8f7bff", two: "#38e0ff" },
  ember: { name: "EMBER", one: "#ffd34d", two: "#ff5c7a" },
  mint:  { name: "MINT",  one: "#3dffb0", two: "#35a8ff" },
  toxic: { name: "TOXIC", one: "#b6ff45", two: "#00e0c8" }
};
