/* NEBULA OS — application catalog + content builders. */
import { el } from "./dom.js";
import { svg } from "./icons.js";
import { state, AURA_PRESETS_META } from "./state.js";
import { Visualizer } from "./apps/neon.js";
import { Drift } from "./apps/drift.js";

export function buildApps(shell) {
  return {
    pulse: {
      label: "Pulse · System",
      icon: "◈", id: "pulse", tint: "var(--a1)",
      render(body) { buildPulse(body, shell); }
    },
    neon: {
      label: "Neon · Visualizer",
      icon: "▲", id: "neon", tint: "#ff4dd8",
      render(body) { buildNeon(body, shell); }
    },
    aurora: {
      label: "Aurora · Settings",
      icon: "❋", id: "aurora", tint: "#8a6bff",
      render(body, win) { buildSettings(body, shell, win); }
    },
    vault: {
      label: "Vault · Files",
      icon: "▣", id: "vault", tint: "#3dffb0",
      render(body) { buildVault(body, shell); }
    },
    drift: {
      label: "Drift · Ambient",
      icon: "〜", id: "drift", tint: "#ffd34d",
      render(body) { buildDrift(body, shell); }
    },
    terminal: {
      label: "Terminal",
      icon: "❯", id: "terminal", tint: "#39e6a0",
      render(body) { buildTerminal(body, shell); }
    },
    about: {
      label: "About NEBULA",
      icon: "◉", id: "about", tint: "#ffd34d",
      render(body) { buildAbout(body, shell); }
    }
  };
}

/* ───────────────────────── PULSE (system monitor) ─────────────────── */
function buildPulse(body, shell) {
  body.className = "win-body app";
  const gaugeRow = el("div", { class: "gauges" });
  const stats = el("div", { class: "mon-stats" });

  const mk = (id) => el("div", { class: "gauge" });
  const cpuG = mk();
  const gpuG = mk();
  const memG = mk();
  const netG = mk();

  function arc(label, color) {
    const g = el("div", { class: "gauge" });
    const a = el("div", { class: "gauge-arc glow" });
    g.append(a, el("small", {}, label));
    return { g, a };
  }
  const c = arc("CPU", "--a1"), gc = arc("GPU", "#ff4dd8"), mc = arc("Memory", "--a2"), nc = arc("Network", "#3dffb0");
  gaugeRow.append(c.g, gc.g, mc.g, nc.g);

  function stat(ico, label) {
    const s = el("div", { class: "mon-stat" }, el("i", { html: ico }), el("div", {}, el("b", { class: "v", textContent: "—" }), el("span", {}, label)));
    return { s, v: s.querySelector(".v") };
  }
  const up = stat(svg("cpu"), "Uptime");
  const temp = stat("🌡", "Temp");
  const proc = stat(svg("chip"), "Processes");
  const ping = stat(svg("net"), "Latency");
  stats.append(up.s, temp.s, proc.s, ping.s);

  body.append(gaugeRow, stats);

  // sparkline canvas footer
  const sparkWrap = el("div", { class: "card" }, el("div", { class: "row spread" },
    el("div", {}, el("b", { style: "font-size:13px" }, "CPU history")),
    el("span", { class: "muted", style: "font-size:11px" }, "live · 60s")));
  const sc = el("canvas", { class: "spark" });
  sparkWrap.appendChild(sc);
  body.append(sparkWrap);
  sc.width = sc.clientWidth * 2;
  sc.height = sc.clientHeight * 2;
  const ctx = sc.getContext("2d");
  const buf = new Array(120).fill(12);

  let t0 = Date.now();
  const hist = { cpu: 12, gpu: 8, mem: 30, net: 5 };

  function tick() {
    const target = shell.sys.cpu();
    hist.cpu += (target - hist.cpu) * 0.4;
    hist.gpu += (shell.sys.cpu() * 0.7 + Math.random() * 8 - hist.gpu) * 0.4;
    hist.mem += (shell.sys.mem() - hist.mem) * 0.4;
    hist.net += (Math.random() * 26 - hist.net) * 0.4;
    setP(c.a, hist.cpu, (v) => Math.round(v) + "%");
    setP(gc.a, hist.gpu, (v) => Math.round(v) + "%");
    setP(mc.a, hist.mem, (v) => Math.round(v) + "%");
    setP(nc.a, hist.net, (v) => Math.round(v) + " Mb/s");
    buf.push(hist.cpu); buf.shift();
    drawSpark();
    const dt = Math.max(0, Date.now() - t0);
    up.v.textContent = fmtUptime(dt);
    temp.v.textContent = Math.round(42 + hist.cpu * 0.45) + "°C";
    proc.v.textContent = shell.sys.processes();
    ping.v.textContent = Math.round(4 + Math.random() * 8) + " ms";
    if (body.isConnected) requestAnimationFrame(tick);
  }
  function setP(a, v, fmt) {
    const n = Math.max(2, Math.min(100, v));
    a.style.setProperty("--p", n);
    a.dataset.val = fmt(n);
  }
  function drawSpark() {
    ctx.clearRect(0, 0, sc.width, sc.height);
    ctx.beginPath();
    const w = sc.width, h = sc.height;
    buf.forEach((v, i) => { const x = (i / (buf.length - 1)) * w; const y = h - (v / 100) * h; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(53,224,255,.5)"); grad.addColorStop(1, "rgba(53,224,255,0)");
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
  }
  tick();
}

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ───────────────────────── NEON (visualizer) ─────────────────────── */
function buildNeon(body, shell) {
  body.className = "win-body viz";
  body.innerHTML = "";
  const wrap = el("div", { class: "viz-canvas-wrap" });
  const cv = el("canvas", { id: "viz" });
  wrap.appendChild(cv);
  const overlay = el("div", { class: "viz-overlay" }, el("div", { class: "big" }, "tap play to ignite the spectrum"));
  wrap.appendChild(overlay);
  const controls = el("div", { class: "viz-controls card" });
  const play = el("button", { class: "play-btn", title: "Play / pause" }, "▶");
  controls.appendChild(play);

  const presets = [["ion", "#35e0ff"], ["nova", "#ff4dd8"], ["vibe", "#38e0ff"], ["ember", "#ffd34d"]];
  const segP = el("div", { class: "seg" });
  presets.forEach(([name, c]) => {
    const b = el("button", {}, name);
    b.dataset.c = c;
    b.addEventListener("click", () => { viz.setColor(c); segP.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); });
    segP.appendChild(b);
  });
  segP.querySelector("button").classList.add("on");

  controls.append(segP);
  const vis = el("div", { class: "seg" });
  ["bars", "wave", "orbit"].forEach((m, i) => {
    const b = el("button", {}, m);
    b.addEventListener("click", () => { viz.setMode(m); vis.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); });
    vis.appendChild(b);
    if (i === 0) b.classList.add("on");
  });
  controls.appendChild(vis);

  const volL = el("span", { class: "muted", style: "font-size:11px" }, "sensitivity");
  const vol = el("input", { type: "range", class: "slider", min: "0.2", max: "1.4", step: "0.05", value: "0.9", style: "width:120px" });
  vol.addEventListener("input", () => { viz.setGain(parseFloat(vol.value)); });
  controls.append(volL, vol);

  body.append(wrap, controls);

  const viz = new Visualizer(cv, overlay);
  viz.play();
  play.textContent = "❚❚";
  play.classList.add("playing");
  overlay.style.display = "none";
  play.addEventListener("click", () => {
    if (viz.playing) { viz.pause(); play.textContent = "▶"; play.classList.remove("playing"); overlay.style.display = ""; overlay.style.opacity = "1"; }
    else { viz.play(); play.textContent = "❚❚"; play.classList.add("playing"); overlay.style.display = "none"; }
  });
}

/* ───────────────────────── AURORA (settings) ─────────────────────── */
function buildSettings(body, shell, win) {
  body.className = "win-body settings";
  body.innerHTML = "";

  const navSections = [
    ["appearance", "❋", "Appearance"],
    ["ambience", "✨", "Ambience"],
    ["system", "⚙", "System"]
  ];
  const nav = el("div", { class: "settings-nav" });
  navSections.forEach(([key, ic, label]) => {
    const b = el("button", { class: key === "appearance" ? "on" : "" },
      el("span", { class: "sn" }, ic), el("span", {}, label));
    b.dataset.key = key;
    nav.appendChild(b);
  });

  const content = el("div", { class: "settings-body" });

  // section builders
  function buildAppearance() {
    const s = el("div", { class: "card" }, el("h2", {}, "Aurora accent"), el("p", { class: "muted" }, "The whole system reacts instantly — no restart, no waiting."));
    const chips = el("div", { class: "chip-row", style: "margin-top:12px" });
    Object.entries(AURA_PRESETS_META).forEach(([key, m]) => {
      const sw = el("div", { class: "swatch" + (state.get("aura") === key ? " on" : ""), style: `background:linear-gradient(135deg,${m.one},${m.two})` });
      sw.title = m.name;
      sw.addEventListener("click", () => {
        state.set("aura", key);
        chips.querySelectorAll(".swatch").forEach((x) => x.classList.toggle("on", x === sw));
        toast("Theme", `${m.name} aura applied`, "✨");
      });
      chips.appendChild(sw);
    });
    s.appendChild(chips);
    return s;
  }

  function buildAmbience() {
    const wrap = el("div", { class: "card" });
    wrap.append(el("h2", {}, "Ambience engine"), el("p", { class: "muted", style: "margin-bottom:8px" }, "Every layer of the desktop, live."));

    const row1 = row("Constellation particles", "Starfield + constellation web behind everything", "particles", "swarm");
    const row2 = row("Perspective grid", "Floor grid under the canvas", "grid", "grid");
    const row3 = row("Nebula blobs", "Slow-breathing color field", "blobs", "blob");
    const row4 = row("Glass translucency", "Blur strength of panels & windows", "blur", "slider", { min: 8, max: 46, unit: "px" });
    const row5 = row("Bloom intensity", "Glow of particles & accents", "blobIntensity", "slider", { min: 20, max: 100 });
    const row6 = row("Particle density", "How busy the starfield is", "density", "slider", { min: 20, max: 100 });
    wrap.append(row1, row2, row3, row4, row5, row6);
    return wrap;
  }

  function row(label, desc, key, kind, opts = {}) {
    const r = el("div", { class: "setting-row", style: "padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)" });
    r.append(el("div", { class: "l" }, el("b", {}, label), el("p", {}, desc)));
    if (kind === "swarm" || kind === "grid" || kind === "blob") {
      const sw = el("div", { class: "switch" + (state.get(key) ? " on" : "") });
      sw.addEventListener("click", () => { state.set(key, !state.get(key)); sw.classList.toggle("on"); });
      r.appendChild(sw);
    } else if (kind === "slider") {
      const v = state.get(key);
      const sld = el("input", { type: "range", class: "slider", min: opts.min, max: opts.max, value: v, style: "max-width:190px" });
      const val = el("span", { class: "mono", style: "font-family:var(--mono);font-size:12px;width:56px;text-align:right;color:var(--txt-dim)" }, Math.round(v) + (opts.unit || ""));
      sld.addEventListener("input", () => { state.set(key, parseFloat(sld.value)); val.textContent = Math.round(sld.value) + (opts.unit || ""); });
      r.append(sld, val);
    }
    return r;
  }

  function buildSystem() {
    const wrap = el("div", { class: "card", style: "display:flex;flex-direction:column;gap:6px" },
      el("h2", {}, "System"), el("p", { class: "muted" }, "Power & recovery."));
    const sld = el("button", { class: "g-btn danger-btn row spread", style: "justify-content:space-between;width:100%" },
      el("span", {}, "Re-lock screen"), svg("shield"));
    sld.addEventListener("click", () => shell.relock());
    wrap.append(el("div", { style: "height:6px" }), sld);
    return wrap;
  }

  function activate(key) {
    content.innerHTML = "";
    if (key === "appearance") content.appendChild(buildAppearance());
    else if (key === "ambience") content.appendChild(buildAmbience());
    else content.appendChild(buildSystem());
    nav.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.key === key));
  }

  nav.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => activate(b.dataset.key)));

  body.append(nav, content);
  activate("appearance");
  win._appBodyResized = () => {};
  function toast(t, m, i) { shell.toast(t, m, i); }
}

/* ───────────────────────── VAULT (files) ─────────────────────── */
const VAULT_FS = {
  Home: {
    type: "dir",
    items: {
      "Projects": { type: "dir", items: {
        "nebula-os": { type: "dir", items: {
          "main.js": { type: "code", size: "3.2 KB" },
          "README.md": { type: "doc", size: "1.1 KB" },
          "design-system.css": { type: "css", size: "8.7 KB" }
        } },
        "concepts": { type: "dir", items: {
          "aurora-palette.json": { type: "json", size: "0.9 KB" },
          "notes.txt": { type: "txt", size: "0.4 KB" }
        } }
      } },
      "Pictures": { type: "dir", items: {
        "constellation.png": { type: "img", size: "2.4 MB" },
        "nebula-render-01.png": { type: "img", size: "5.1 MB" },
        "blue-hour.jpg": { type: "img", size: "3.0 MB" }
      } },
      "Music": { type: "dir", items: {
        "synthwave.aac": { type: "audio", size: "6.2 MB" },
        "midnight.ogg": { type: "audio", size: "4.8 MB" }
      } },
      "Documents": { type: "dir", items: {
        "manifesto.md": { type: "doc", size: "2.0 KB" },
        "budget-2077.xls": { type: "sheet", size: "44 KB" }
      } },
      "Trash": { type: "dir", items: {} }
    }
  }
};

const FILE_GLYPH = {
  dir: "📁", code: "🧩", doc: "📄", css: "🎨", json: "⚙", txt: "📝",
  img: "🖼", audio: "🎵", sheet: "📊"
};
const EXT = { txt: ".txt", code: ".js", doc: ".md", css: ".css", json: ".json", img: ".png", audio: ".aac", sheet: ".xls" };

function buildVault(body, shell) {
  body.className = "win-body vault";
  body.innerHTML = "";
  const nav = el("div", { class: "vault-nav" });
  const main = el("div", { class: "vault-main" });
  const crumbs = el("div", { class: "vault-crumb" });
  const files = el("div", { class: "files" });

  // sidebar storage bar
  const used = 72.4, total = 256;
  const storage = el("div", { class: "storage" },
    el("b", { style: "font-size:12px" }, "Storage"),
    el("div", { class: "bar" }, el("i", { style: `width:${used}%` })),
    el("small", {}, `${used.toFixed(1)} GB of ${total} GB used`));
  nav.append(storage);

  let selectedPath = null;

  function dirNode(path) {
    let cur = VAULT_FS;
    for (const seg of path) cur = cur.items[seg];
    return cur;
  }
  function openDir(path, push) {
    if (push) shell.toast("Vault", "Opening folder", "📁");
    files.innerHTML = "";
    crumbs.innerHTML = "";
    crumbs.append(el("b", { class: "c", dataset: "0" }, "◈ Home"));
    const segEls = [el("b", { class: "c", dataset: "0" }, "◈ Home")];
    // rebuild crumbs
    crumbs.innerHTML = "";
    path.forEach((seg, i) => {
      const sp = el("span", {}, " / ");
      const b = el("b", { class: "c", dataset: i + 1, textContent: seg });
      crumbs.append(sp, b);
    });
    crumbs.childNodes.forEach((n) => { if (n.classList && n.classList.contains("c")) n.addEventListener("click", () => openDir(path.slice(0, Number(n.dataset)), false)); });

    const node = dirNode(path);
    const entries = Object.entries(node.items);
    if (path.length) {
      const back = el("button", { class: "file", style: "cursor:pointer" }, el("i", { class: "fv", textContent: "🔙" }), el("span", {}, "… up"));
      back.addEventListener("click", () => openDir(path.slice(0, -1), false));
      files.appendChild(back);
    }
    entries.forEach(([name, item]) => {
      const f = el("div", { class: "file" });
      const glyph = item.type === "dir" ? "📁" : (FILE_GLYPH[item.type] || "📄");
      f.append(el("i", { class: "fv", textContent: glyph }), el("span", {}, name));
      f.addEventListener("click", () => {
        if (item.type === "dir") { openDir([...path, name], true); return; }
        selectedPath = [...path, name];
        files.querySelectorAll(".file").forEach((x) => x.classList.remove("selected"));
        f.classList.add("selected");
        const size = item.size || "";
        shell.toast("Vault", `${name} ${size ? "· " + size : ""}`, glyph);
      });
      files.appendChild(f);
    });
    if (!entries.length) files.append(el("div", { class: "muted", style: "padding:20px;grid-column:1/-1;text-align:center" }, "This folder is empty"));
  }
  openDir([], false);

  // quick nav buttons
  const quick = [["Projects", ["Home", "Projects"]], ["Pictures", ["Home", "Pictures"]], ["Music", ["Home", "Music"]], ["Documents", ["Home", "Documents"]]];
  const qg = el("div", {}, ...quick.map(([name, p]) => el("button", { class: name === "Projects" ? "on" : "" }, el("span", { class: "vn" }, "📁"), el("span", {}, name))));
  quick.forEach(([name, p], idx) => qg.children[idx].addEventListener("click", () => { nav.querySelectorAll("button").forEach((b) => b.classList.remove("on")); qg.children[idx].classList.add("on"); openDir(p, false); }));
  nav.prepend(qg);

  body.append(nav, main);
  main.append(crumbs, files);
}

/* ───────────────────────── DRIFT (ambient sandbox) ─────────────────── */
function buildDrift(body, shell) {
  body.className = "win-body app";
  body.innerHTML = "";
  const wrap = el("div", { class: "drift-wrap" });
  const cv = el("canvas", { id: "drift" });
  wrap.appendChild(cv);
  const drift = new Drift(cv);

  const ui = el("div", { class: "drift-ui" });
  const segM = el("div", { class: "seg" });
  const segP = el("div", { class: "seg" });
  const segG = el("div", { class: "seg" });
  const M = { drift: "Drift", field: "Waves", spheres: "Orbits" };
  Object.keys(M).forEach((m) => { const b = el("button", {}, M[m]); b.addEventListener("click", () => { drift.setMode(m); segM.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }); segM.appendChild(b); if (m === "drift") b.classList.add("on"); });
  ["2", "3"].forEach((g) => { const b = el("button", {}, g); b.addEventListener("click", () => { drift.setSpeed(parseFloat(g)); segG.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); }); segG.appendChild(b); });
  const onOff = el("div", { class: "switch on" });
  onOff.addEventListener("click", () => { onOff.classList.toggle("on"); drift.paused = !onOff.classList.contains("on"); });
  ui.append(segM, segP, segG, el("span", { class: "muted", style: "font-size:11px" }, "motion"), onOff);
  segP.style.display = "none";
  wrap.appendChild(ui);
  body.append(wrap);
}

/* ───────────────────────── TERMINAL ────────────────────────────── */
function buildTerminal(body, shell) {
  const cmds = {
    help: () => ["Available:", "  help          show this list", "  about         what is NEBULA", "  theme <name>  switch aura (ion, nova, vibe, ember, mint, toxic)", "  status        system snapshot", "  time          current time", "  matrix        red pill / blue pill", "  clear         clear the screen"],
    about: () => ["NEBULA OS — an interface experiment crafted to feel alive.", "Every pixel, particle and pane exists to provoke a reaction.", "Built with CSS, canvas & a healthy obsession with light."],
    status: () => [`▶ shell    : NEBULA ${shell.sys.kernel()}`, `▶ windows  : ${shell.wm.count()}`, `▶ engine   : glowing`, `▶ mood     : ${["buoyant", "electric", "weightless", "synthetic"][Math.floor(Math.random() * 4)]}`],
    time: () => [new Date().toLocaleString()],
    theme: (a) => { const t = a[0]; if (t && AURA_PRESETS_META[t]) { state.set("aura", t); return [`→ aura switched to ${t.toUpperCase()}`]; } return ["usage: theme <ion|nova|vibe|ember|mint|toxic>"]; },
    matrix: () => { matrixMode = !matrixMode; state.set("aura", matrixMode ? "toxic" : "ion"); return ["you took the red pill.", "the desktop believes… whatever you tell it to."]; },
    clear: () => null
  };
  body.className = "win-body term";
  body.innerHTML = "";
  const out = el("div", { class: "term-out" });
  const inp = el("input", { spellcheck: false, autocomplete: "off" });
  const row = el("div", { class: "term-in" }, el("span", { class: "prompt" }, "nebula@os:~$ "), inp);
  let matrixMode = false;
  const banner = [
    "",
    "   ███╗   ██╗███████╗██████╗ ██╗   ██╗██╗      █████╗ ",
    "   ████╗  ██║██╔════╝██╔══██╗██║   ██║██║     ██╔══██╗",
    "   ██╔██╗ ██║█████╗  ██████╔╝██║   ██║██║     ███████║",
    "   ██║╚██╗██║██╔══╝  ██╔══██╗██║   ██║██║     ██╔══██║",
    "   ██║ ╚████║███████╗██████╔╝╚██████╔╝███████╗██║  ██║",
    "   ╚═╝  ╚═══╝╚══════╝╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝",
    "",
    "   type 'help' to explore.  tip: try 'matrix'.",
    ""
  ].join("\n");
  out.append(el("div", { class: "dim", html: banner }));

  const hist = []; let hi = 0;

  function print(html) { out.append(el("div", { html })); out.scrollTop = out.scrollHeight; }
  function printLine(txt, cls = "") { out.append(el("div", { class: cls, textContent: txt })); out.scrollTop = out.scrollHeight; }

  function exec(raw) {
    const line = raw.trim();
    print(`<span class="cm">nebula@os</span>:<span class="dim">~$</span> ${escapeHtml(line)}`);
    if (!line) return;
    hist.push(line); hi = hist.length;
    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    if (cmd === "clear") { out.innerHTML = ""; return; }
    const fn = cmds[cmd];
    let res = fn ? (fn(parts.slice(1)) || []) : [`command not found: ${cmd}. try 'help'.`];
    res.forEach((r) => printLine(r, "dim"));
  }

  inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { exec(inp.value); inp.value = ""; }
    else if (e.key === "ArrowUp") { if (hi > 0) { hi--; inp.value = hist[hi] || ""; } }
    else if (e.key === "ArrowDown") { if (hi < hist.length - 1) { hi++; inp.value = hist[hi] || ""; } else { hi = hist.length; inp.value = ""; } }
  });

  body.append(out, row);
  inp.focus();
  const hint = el("div", { class: "term-hint" }, "• type help •");
  // row already has prompt + input
}
function escapeHtml(s) { return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

/* ───────────────────────── ABOUT ───────────────────────────────── */
function buildAbout(body, shell) {
  body.className = "win-body app";
  body.innerHTML = "";
  const hero = el("div", { class: "about-hero" },
    el("div", { class: "orb-wrap" }, el("div", { class: "orb" }), el("div", { class: "core" })),
    el("h1", {}, "NEBULA"),
    el("p", {}, "A conceptual desktop operating system rendered purely in the browser — a study in glass, motion and synthetic light. It is not meant to be useful. It is meant to be felt."));

  const feat = (i, t, p) => el("div", { class: "feat" }, el("i", { html: i }), el("div", {}, el("b", {}, t), el("p", {}, p)));
  const cards = el("div", { class: "about-cards" },
    feat(svg("neon"), "Reactive engine", "Particles, grids and windows breathe with your cursor and your color choice."),
    feat(svg("aurora"), "Live theming", "Change an aura and watch the entire universe repaint in under a heartbeat."),
    feat(svg("pulse"), "Living telemetry", "System gauges that glow, spark and drift in real time."),
    feat(svg("drift"), "Ambient physics", "A sandbox canvas with drifting particles, waves and orbiting bodies."));

  const kbd = el("div", { class: "card" },
    el("b", { style: "font-size:13px" }, "Try this"),
    el("div", { class: "kbd-row", style: "margin-top:10px" },
      el("kbd", {}, "double-click a title bar"), el("kbd", {}, "Escape closes"),
      el("kbd", {}, "resize from bottom-right corner")));

  const heroBtn = el("button", { class: "g-btn accent glow", style: "align-self:center" }, svg("spark"), "Made you look — didn't it?");
  heroBtn.addEventListener("click", () => shell.toast("NEBULA", "And that was only the surface.", "✨"));

  body.append(hero, cards, kbd, el("div", { style: "height:4px" }), heroBtn);
  const orb = hero.querySelector(".orb");
  document.addEventListener("pointermove", (e) => {
    const r = hero.querySelector(".orb-wrap").getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / 30, dy = (e.clientY - cy) / 30;
    orb.style.transform = `rotateX(${-dy}deg) rotateY(${dx}deg)`;
  }, { passive: true });
}
