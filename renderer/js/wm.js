/* NEBULA OS — window manager: drag, resize, focus, minimize/max/close. */
import { svg } from "./icons.js";

let idSeq = 0;
export const windows = new Map(); // id -> win meta

export class WM {
  constructor(layerEl, callbacks) {
    this.layer = layerEl;
    this.cb = callbacks || {};
    this.stack = []; // z order of win ids
    this.focused = null;
    this.bindGlobal();
  }

  _meta(id) { return windows.get(id); }

  open(app, { x, y, w, h, minW, minH } = {}) {
    const win = document.createElement("section");
    win.className = "win";
    const id = "w" + ++idSeq;
    win.dataset.wid = id;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(w || 720, vw - 90);
    const height = Math.min(h || 500, vh - 130);
    const left = x ?? (vw - width) / 2 + (Math.random() * 60 - 30);
    const top = y ?? Math.max(46, (vh - height) / 2 - 10 + (Math.random() * 40 - 20));
    win.style.cssText = `left:${left}px;top:${top}px;width:${width}px;height:${height}px;`;
    win._meta = { id, app, minW: minW || 340, minH: minH || 220 };

    this.layer.appendChild(win);
    windows.set(id, win);
    this._buildChrome(win, app);
    this.cb.onOpen && this.cb.onOpen(app, id, win);

    requestAnimationFrame(() => win.classList.add("open"));
    this.focus(id);
    this.stack.push(id);
    return { id, el: win };
  }

  _buildChrome(win, app) {
    const { label, icon, tint } = app;
    const bar = document.createElement("div");
    bar.className = "win-title";
    bar.innerHTML = `
      <span class="sheen"></span>
      <span class="wt-ico" style="${tint ? `color:${tint}` : ""}">${icon || "◈"}</span>
      <span class="wt-name">${label}</span>
      <span class="wt-dots">
        <button class="wc-btn wc-min" title="Minimize">${svg("min")}</button>
        <button class="wc-btn wc-max" title="Maximize">${svg("max")}</button>
        <button class="wc-btn wc-close close" title="Close">${svg("x")}</button>
      </span>`;
    win.appendChild(bar);
    this._makeDraggable(win, bar);

    win.querySelector(".wc-min").addEventListener("click", (e) => { e.stopPropagation(); this.minimize(win); });
    win.querySelector(".wc-max").addEventListener("click", (e) => { e.stopPropagation(); this.toggleMax(win); });
    win.querySelector(".wc-close").addEventListener("click", (e) => { e.stopPropagation(); this.close(win); });

    // double click title to maximize
    bar.addEventListener("dblclick", (e) => {
      if (e.target.closest(".wc-btn")) return;
      this.toggleMax(win);
    });

    // resize handle
    const rz = document.createElement("div");
    rz.className = "win-resize";
    win.appendChild(rz);
    this._makeResizable(win, rz);

    // body
    const body = document.createElement("div");
    body.className = "win-body";
    win.appendChild(body);
    win._body = body;
    if (app.render) app.render(body, win);
    if (app.onBody) app.onBody(body, win);
  }

  setBody(win, htmlOrNode) {
    win._body.innerHTML = "";
    if (typeof htmlOrNode === "string") win._body.innerHTML = htmlOrNode;
    else win._body.appendChild(htmlOrNode);
  }

  /* drag */
  _makeDraggable(win, bar) {
    let sx, sy, ox, oy, moved = false;
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".wc-btn")) return;
      if (win.classList.contains("maximized")) return;
      const max = win.classList.contains("maximized");
      if (max) return;
      this.focus(win.dataset.wid);
      sx = e.clientX; sy = e.clientY;
      const r = win.getBoundingClientRect();
      ox = r.left; oy = r.top; moved = false;
      bar.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
        win.style.left = ox + dx + "px";
        win.style.top = Math.max(0, oy + dy) + "px";
      };
      const up = () => {
        bar.removeEventListener("pointermove", move);
        bar.removeEventListener("pointerup", up);
      };
      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", up);
    });
  }

  _makeResizable(win, handle) {
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.focus(win.dataset.wid);
      const sx = e.clientX, sy = e.clientY;
      const r = win.getBoundingClientRect();
      const ow = r.width, oh = r.height;
      handle.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const m = win._meta;
        const nw = Math.max(m.minW, ow + (ev.clientX - sx));
        const nh = Math.max(m.minH, oh + (ev.clientY - sy));
        win.style.width = nw + "px";
        win.style.height = nh + "px";
        win._appBodyResized && win._appBodyResized(nw, nh);
      };
      const up = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
    });
  }

  focus(id) {
    const win = windows.get(id);
    if (!win) return;
    const all = this.layer.querySelectorAll(".win");
    all.forEach((w) => w.classList.remove("focused"));
    win.classList.add("focused");
    this.focused = id;
    this.layer.classList.add("win-active");
    // bring to top
    win.style.zIndex = 50 + this.stack.length;
    this.stack = this.stack.filter((x) => x !== id);
    this.stack.push(id);
    this.cb.onFocus && this.cb.onFocus(id);
  }

  minimize(win) {
    win.classList.add("minimized");
    this.cb.onMinimize && this.cb.onMinimize(win.dataset.wid);
  }
  restore(win) {
    win.classList.remove("minimized");
    this.focus(win.dataset.wid);
  }
  toggleMax(win) {
    const layer = this.layer;
    if (win.classList.contains("maximized")) {
      win.classList.remove("maximized");
      win.style.width = win._prev.w + "px";
      win.style.height = win._prev.h + "px";
      win.style.left = win._prev.x + "px";
      win.style.top = win._prev.y + "px";
      win.style.inset = "";
    } else {
      win._prev = { x: win.style.left, y: win.style.top, w: win.style.width, h: win.style.height };
      win.classList.add("maximized");
      win.style.left = "0px"; win.style.top = "0px";
      win.style.width = "100%"; win.style.height = "100%";
      win.style.inset = "0";
    }
    this.focus(win.dataset.wid);
  }
  isMinimized(id) { const w = windows.get(id); return w && w.classList.contains("minimized"); }

  close(win) {
    win.classList.add("closing");
    this.cb.onClose && this.cb.onClose(win.dataset.wid);
    setTimeout(() => {
      win.remove();
      windows.delete(win.dataset.wid);
      this.stack = this.stack.filter((x) => x !== win.dataset.wid);
      this.cb.onClosed && this.cb.onClosed(win.dataset.wid);
      if (!this.layer.querySelector(".win")) this.layer.classList.remove("win-active");
    }, 200);
  }

  bindGlobal() {
    // click anywhere on layer focuses that window
    this.layer.addEventListener("pointerdown", (e) => {
      const win = e.target.closest(".win");
      if (win) this.focus(win.dataset.wid);
    });
    // Escape closes top window
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const top = this.stack[this.stack.length - 1];
        const w = windows.get(top);
        if (w) this.close(w);
      }
    });
  }
}
