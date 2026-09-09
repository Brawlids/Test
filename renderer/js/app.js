/* NEBULA OS — shell orchestrator. */
import { state, AURA_PRESETS_META } from "./state.js";
import { Background } from "./background.js";
import { WM } from "./wm.js";
import { buildApps } from "./apps.js";
import { svg } from "./icons.js";

const $ = (s) => document.querySelector(s);

const sys = {
  _t0: Date.now(),
  kernel: () => "2.6.0-nebula",
  cpu: () => 18 + Math.random() * 26 + Math.sin(Date.now() / 1400) * 6,
  mem: () => 32 + Math.random() * 14,
  processes: () => Math.round(160 + Math.sin(Date.now() / 800) * 30 + Math.random() * 20)
};

const shell = {
  sys,
  toast(title, msg, icon) { pushToast(title, msg, icon); },
  wm: null,
  count: 0,
  relock() { relock(); },
  themeFlash() { /* could pulse */ }
};

function main() {
  state.restore();
  state.init();

  // sysbar window controls
  buildSysbar();

  // background
  const bg = new Background($("#bg"));
  shell.bg = bg;

  // apps & WM
  const apps = buildApps(shell);
  shell.apps = apps;
  const layer = $("#windows-layer");
  const wm = new WM(layer, {
    onOpen: (app, id, win) => refreshDock(apps),
    onClose: (id) => refreshDock(apps),
    onClosed: () => refreshDock(apps),
    onMinimize: () => refreshDock(apps),
    onFocus: () => refreshDock(apps)
  });
  shell.wm = wm;
  wm.count = () => wm.stack.filter((id) => wm._meta(id) && !wm.isMinimized(id)).length;

  // desktop icons & dock
  buildIcons(apps);
  buildDock(apps, wm);
  buildLaunchpad(apps, wm);

  // clock wiring (taskbar clock now exists)
  updateClock();

  // system tray interactions (just visual toasts)
  wireTray();

  // global pointer trail (reticle glow)
  wireReticle();

  // boot sequence
  runBoot();

  // opening demo apps after unlock via launchpad; plus first-run hint
}

/* ── sysbar (fake window controls + status) ── */
function buildSysbar() {
  const sysbar = $("#sysbar");
  sysbar.innerHTML = `
    <div class="sys-logo"><i></i>NEBULA<span style="color:var(--txt-faint)">·SHELL</span></div>
    <div class="sys-right">
      <div class="sys-meta" id="sysNet" style="display:none"></div>
      <div class="win-btns">
        <button class="wb-min" title="Minimize all">${svg("min")}</button>
        <button class="wb-max" title="Maximize" id="wbToggle">${svg("max")}</button>
        <button class="wb-close close" title="Power">${svg("power")}</button>
      </div>
    </div>`;
}

/* ── clock ── */
function updateClock() {
  const time = $("#lockTime"), date = $("#lockDate");
  const tbb = $(".tb-clock b"), tbd = $(".tb-clock span");
  const fmt = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fdate = (d) => d.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const step = () => {
    const now = new Date();
    time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    date.textContent = fdate(now).toUpperCase();
    if (tbb) { tbb.textContent = fmt(now); tbd.textContent = now.toLocaleDateString([], { month: "short", day: "numeric" }); }
  };
  step();
  setInterval(step, 1000);
}

/* ── desktop icons ── */
function buildIcons(apps) {
  const layer = $("#icons-layer");
  layer.innerHTML = "";
  const list = [
    ["pulse", svg("pulse"), "Pulse"],
    ["neon", svg("neon"), "Neon"],
    ["aurora", svg("aurora"), "Aurora"],
    ["vault", svg("vault"), "Vault"],
    ["drift", svg("drift"), "Drift"],
    ["terminal", svg("term"), "Terminal"]
  ];
  layer.innerHTML = "";
  list.forEach(([key, ico, label]) => {
    const b = el2("button", { class: "desk-icon", "data-app": key });
    b.innerHTML = `<span class="di-ico" style="color:${(apps[key].tint||"var(--a1)")}">${ico}</span><span class="di-lab">${label}</span>`;
    b.addEventListener("click", () => openOrFocus(apps, key));
    layer.appendChild(b);
  });
  layer.querySelectorAll(".desk-icon").forEach((b) => {
    b.addEventListener("mousedown", () => setSelected(b));
  });
}

/* ── dock ── */
function buildDock(apps, wm) {
  const tb = $("#taskbar");
  tb.innerHTML = "";

  const center = el2("div", { class: "tb-center" });
  // start button opens launchpad
  const start = el2("button", { class: "tb-btn", title: "Launchpad" });
  const startGlow = document.createElement("span");
  startGlow.className = "start-dot";
  start.appendChild(startGlow);
  start.appendChild(tip("Launchpad"));
  start.addEventListener("click", () => toggleLaunchpad(apps, wm));
  center.appendChild(start);
  center.appendChild(sep());

  // running/quick apps
  const dockApps = ["pulse", "neon", "aurora", "vault", "drift", "terminal", "about"];
  center.dataset.apps = "";
  dockApps.forEach((key) => center.appendChild(tbAppBtn(apps, key)));
  tb.appendChild(center);

  const right = el2("div", { class: "tb-right" });
  // tray icons
  const tray = ["wifi", "moon", "volume"];
  tray.forEach((g) => {
    const b = el2("button", { class: "tb-btn tray", html: svg(g) });
    b.title = g;
    right.appendChild(b);
  });
  right.appendChild(sep());
  const clock = el2("div", { class: "tb-clock", html: "<b>--:--</b><span>—</span>" });
  right.appendChild(clock);
  tb.appendChild(right);
}

function tbAppBtn(apps, key) {
  const app = apps[key];
  const b = el2("button", { class: "tb-btn", "data-app": key, title: app.label });
  b.innerHTML = `<span class="tb-ico glyph" style="color:${app.tint||"var(--a1)"}">${app.iconSvg || iconSvgFor(key)}</span>`;
  b.appendChild(tip(app.label));
  b.addEventListener("click", () => openOrFocus(apps, key));
  return b;
}
function iconSvgFor(key) { return svg(key); }
function tip(text) { const t = el2("div", { class: "tip" }); t.textContent = text; return t; }
function sep() { const d = document.createElement("div"); d.className = "tb-sep"; return d; }
function el2(tag, props = {}) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "html") n.innerHTML = v;
    else if (k === "class") n.className = v;
    else if (v !== undefined) n.setAttribute(k, v);
  }
  return n;
}

let lastOpenKey = null;
function openApp(apps, key) {
  const app = apps[key];
  const w = app.winId && shell.wm._meta(app.winId);
  // sizing
  const dims = {
    pulse: { w: 620, h: 520 }, neon: { w: 760, h: 560 }, aurora: { w: 720, h: 540 },
    vault: { w: 660, h: 520 }, drift: { w: 700, h: 500 }, terminal: { w: 640, h: 440 }, about: { w: 560, h: 620 }
  };
  const win = shell.wm.open(app, dims[key] || {});
  app.winId = win.id;
  app.winEl = win.el;
  pushToast(app.label, "opened", app.icon);
}

function openOrFocus(apps, key) {
  const app = apps[key];
  const meta = app.winId && shell.wm._meta(app.winId);
  if (meta && !meta.classList.contains("closing")) {
    if (meta.classList.contains("minimized")) shell.wm.restore(meta);
    else shell.wm.focus(app.winId);
  } else openApp(apps, key);
}

function refreshDock() {
  // update active indicators based on focus / count
}

function setSelected(btn) {
  document.querySelectorAll(".desk-icon").forEach((x) => x.classList.remove("selected"));
  btn.classList.add("selected");
}

/* ── launchpad ── */
function buildLaunchpad(apps, wm) {
  const lp = $("#launchpad");
  lp.innerHTML = `
    <div class="lp-head">
      <div class="lp-title"><i></i>Search &amp; Launch</div>
      <div class="lp-search">${svg("search")}<input id="lpSearch" placeholder="Type an app name…" spellcheck="false"/></div>
    </div>
    <div class="lp-grid"></div>
    <div class="lp-quick"></div>`;
  const grid = lp.querySelector(".lp-grid");
  const quick = lp.querySelector(".lp-quick");
  const defs = [
    ["pulse", svg("pulse"), "Pulse", "telemetry"],
    ["neon", svg("neon"), "Neon", "visualizer"],
    ["aurora", svg("aurora"), "Aurora", "settings"],
    ["vault", svg("vault"), "Vault", "files"],
    ["drift", svg("drift"), "Drift", "ambient"],
    ["terminal", svg("term"), "Terminal", "shell"],
    ["about", svg("about"), "About", "story"]
  ];
  const render = (query) => {
    grid.innerHTML = "";
    const q = (query || "").toLowerCase();
    defs.filter((d) => !q || d[1].toLowerCase().includes(q) || d[0].includes(q) || d[2].toLowerCase().includes(q))
      .forEach(([key, ico, label, sub]) => {
        const app = apps[key];
        const b = el2("button", { class: "lp-app" });
        b.innerHTML = `<span class="di-ico" style="color:${app.tint||"var(--a1)"}">${ico}</span><span class="lab">${label}</span><small>${sub}</small>`;
        b.addEventListener("click", () => { closeLaunchpad(); openOrFocus(apps, key); });
        grid.appendChild(b);
      });
  };
  lp.querySelector("#lpSearch").addEventListener("input", (e) => render(e.target.value));
  // quick actions row
  const quickDefs = [
    ["power", svg("power"), "Lock"], ["refresh", svg("refresh"), "Restart"], ["moon", svg("moon"), "Dusk"], ["shield", svg("shield"), "Privacy"]
  ];
  quickDefs.forEach(([k, ico, label]) => {
    const b = el2("button", { class: "lp-q" });
    b.innerHTML = `<i>${ico}</i><span>${label}</span>`;
    b.addEventListener("click", () => {
      closeLaunchpad();
      if (label === "Lock") relock();
      else if (label === "Restart") restartFX();
      else if (label === "Dusk") state.set("aura", state.get("aura") === "ember" ? "ion" : "ember");
      else pushToast("Privacy", "Nothing leaves this device. Ever.", "🛡");
    });
    quick.appendChild(b);
  });
  render("");
}

function toggleLaunchpad(apps, wm) {
  const lp = $("#launchpad");
  const on = lp.classList.toggle("on");
  if (on) lp.querySelector("#lpSearch").focus();
}
function closeLaunchpad() { $("#launchpad").classList.remove("on"); }

/* ── toasts ── */
function pushToast(title, msg, icon) {
  const wrap = $("#toasts");
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<i>${icon || "◈"}</i><div><b>${title}</b><p>${msg}</p></div><button class="toast-x">✕</button>`;
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add("in"));
  t.querySelector(".toast-x").addEventListener("click", () => dismiss(t));
  setTimeout(() => dismiss(t), 4200);
}
function dismiss(t) {
  if (!t.parentNode) return;
  t.classList.remove("in");
  setTimeout(() => t.remove(), 500);
}

/* ── boot / lock / desktop reveal ── */
let booted = false;
function runBoot() {
  // show boot, then progress then unlock affordance
  setTimeout(() => {
    $("#boot").classList.add("away");
    setTimeout(() => { $("#boot").style.display = "none"; }, 950);
    // reveal lockscreen
  }, 2400);
  // lockscreen always ready behind boot; user unlocks with button
}

let unlocked = false;
function setupUnlock() {
  const lock = $("#lockscreen");
  const btn = $("#lockUnlock");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (unlocked) return;
    unlock();
  });
  lock.addEventListener("click", (e) => { if (e.target === lock || e.target.closest(".lock-time,.lock-date")) unlock(); });
  $("#desktop").addEventListener("click", () => {});
}
function unlock() {
  if (unlocked) return;
  unlocked = true;
  const lock = $("#lockscreen");
  const desk = $("#desktop");
  lock.classList.add("unlocking");
  // show desktop behind
  requestAnimationFrame(() => desk.classList.add("on", "reveal"));
  setTimeout(() => { $('#taskbar').classList.add('on'); }, 60);
  setTimeout(() => lock.classList.add("away"), 40);
  setTimeout(() => { lock.style.display = "none"; lock.classList.remove("unlocking"); }, 900);
  // hint toast after desktop
  setTimeout(() => pushToast("Welcome", "NEBULA OS online. Try opening Aurora to change the mood.", "✦"), 1500);
  // auto-open a demo app so the user is instantly wowed
  setTimeout(() => { autoDemo(); }, 1200);
}
function relock() {
  if (!unlocked) return;
  unlocked = false;
  const lock = $("#lockscreen");
  const desk = $("#desktop");
  lock.style.display = "flex";
  lock.classList.remove("away");
  requestAnimationFrame(() => {
    desk.classList.remove("on", "reveal");
    $('#taskbar').classList.remove('on');
  });
  pushToast("Session", "Screen locked", "🔒");
}
let demoDone = false;
function autoDemo() {
  if (demoDone) return;
  demoDone = true;
  const apps = currentApps();
  // open settings first so user sees live theme control
  setTimeout(() => openApp(apps, "about"), 300);
  setTimeout(() => openApp(apps, "pulse"), 900);
  setTimeout(() => { animateRainbow(); }, 2600);
}
function currentApps() {
  return shell.apps;
}
function animateRainbow() {
  const keys = Object.keys(AURA_PRESETS_META);
  let i = 0;
  const iv = setInterval(() => {
    state.set("aura", keys[i % keys.length]);
    i++;
    if (i > keys.length * 2) { clearInterval(iv); state.set("aura", "ion"); }
  }, 700);
}

function restartFX() {
  const d = document.createElement("div");
  d.style.cssText = "position:fixed;inset:0;background:var(--bg);z-index:999;display:grid;place-items:center;font-size:18px;color:var(--txt-faint);opacity:0;transition:.4s";
  d.innerHTML = "◈ reboot";
  document.body.appendChild(d);
  requestAnimationFrame(() => (d.style.opacity = 1));
  setTimeout(() => {
    d.remove();
    location.reload();
  }, 900);
}

/* ── tray / misc wiring ── */
function wireTray() {
  document.querySelectorAll(".tb-btn.tray").forEach((b) => {
    b.addEventListener("click", () => pushToast("Quick toggle", `${b.title} tapped (simulated)`, "·"));
  });
  // sysbar buttons
  const wbMin = document.querySelector(".wb-min");
  const wbClose = document.querySelector(".wb-close");
  if (wbMin) wbMin.addEventListener("click", () => minimizeAll());
  if (wbClose) wbClose.addEventListener("click", () => relock());
}
function minimizeAll() {
  document.querySelectorAll(".win").forEach((w) => w.classList.add("minimized"));
  pushToast("Shell", "All windows minimized", "▁");
}

function wireReticle() {
  const ret = $("#hud-reticle");
  let last = 0;
  window.addEventListener("pointermove", (e) => {
    ret.classList.add("on");
    ret.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
  }, { passive: true });
  window.addEventListener("pointerleave", () => ret.classList.remove("on"));
}

/* live theme side-effect: retint particle/accent drawing handled in background via readAccent each frame */

// global pointerdown to deselect icons / close launchpad
window.addEventListener("pointerdown", (e) => {
  if (!e.target.closest("#launchpad") && !e.target.closest("[data-app]") && !e.target.closest("#taskbar") && !e.target.closest(".win")) {
    // deselect icon handled by css pointer none
    document.querySelectorAll(".desk-icon.selected").forEach((x) => x.classList.remove("selected"));
  }
  // close launchpad if clicking outside
  if (!e.target.closest("#launchpad") && !e.target.closest("#taskbar")) closeLaunchpad();
});

// keyboard: Escape toggles launchpad
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLaunchpad();
});

function launch() {
  // prep boot & lock visuals
  setupUnlock();
  main();
}

// re-bind dynamic icons cache references
window.addEventListener("DOMContentLoaded", launch);
