/* NEBULA OS — animated particle constellation background + nebula noise canvas. */
import { state } from "./state.js";

export class Background {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.lineJoin = "round";
    this.parts = [];
    this.mouse = { x: -9999, y: -9999 };
    this.running = true;
    this.accent = { a: 53, b: 224, g: 255 };
    this.dpr = 1;
    this.fi = 0;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pointermove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    // seed
    for (let i = 0; i < 260; i++) this.parts.push(this.spawn(true));
    this.loop();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.floor(window.innerWidth * this.dpr);
    this.cv.height = Math.floor(window.innerHeight * this.dpr);
    this.cv.style.width = "100%";
    this.cv.style.height = "100%";
  }

  readAccent() {
    const cs = getComputedStyle(document.documentElement);
    const c1 = cs.getPropertyValue("--a1").trim();
    const c2 = cs.getPropertyValue("--a2").trim();
    const p = (c) => c.match(/[\da-f]{2}/gi).map((x) => parseInt(x, 16));
    let a = p(c1) || [53, 224, 255];
    let b = p(c2) || [138, 107, 255];
    if (!a) a = [53, 224, 255];
    if (!b) b = [138, 107, 255];
    this.aA = a;
    this.aB = b;
  }

  spawn(anywhere) {
    const W = this.cv.width;
    const H = this.cv.height;
    const r = Math.random();
    return {
      x: anywhere ? Math.random() * W : Math.random() * W,
      y: anywhere ? Math.random() * H : -20,
      vx: (Math.random() - 0.5) * 0.16,
      vy: 0.04 + Math.random() * 0.13,
      r: 0.7 + Math.random() * 1.9,
      tw: Math.random() * Math.PI * 2,
      hue: Math.random(), // mix weight between accent colors
      layer: Math.random() < 0.12 ? 2 : 1
    };
  }

  loop() {
    if (!this.running) return;
    this.frame();
    requestAnimationFrame(() => this.loop());
  }

  frame() {
    const ctx = this.ctx;
    const W = this.cv.width;
    const H = this.cv.height;
    ctx.clearRect(0, 0, W, H);

    const hide = getComputedStyle(document.body).getPropertyValue("--show-particles").trim() === "none";
    if (hide) { this.parts.length = 0; return; }

    if (this.fi++ % 12 === 0) this.readAccent();

    const target = state.get("density");
    const want = Math.round(46 + target * 1.6);
    while (this.parts.length < want) this.parts.push(this.spawn(true));
    const inten = (state.get("blobIntensity") ?? 55) / 100;

    const m = this.mouse;
    const mx = m.x * this.dpr;
    const my = m.y * this.dpr;
    const linkD = 150 * this.dpr;

    // update & draw
    const px = (c) => `${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])}`;
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.tw += 0.02;
      // gentle pull away / toward? mouse slight attraction for large
      // respawn off top handled below
      if (p.y > H + 30) {
        Object.assign(p, this.spawn(false));
        p.y = -20;
      }
      if (p.x > W + 30) p.x = -30;
      if (p.x < -30) p.x = W + 30;

      const col = p.hue < 0.5 ? this.aA : this.aB;
      const alpha = 0.35 + 0.35 * Math.sin(p.tw);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${px(col)},${alpha})`;
      ctx.shadowBlur = 0;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      // link to nearby
      for (let j = i + 1; j < this.parts.length; j++) {
        const q = this.parts[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < linkD * linkD) {
          const d = Math.sqrt(d2);
          const a = (1 - d / linkD) * 0.5 * (0.4 + inten);
          if (a > 0.02) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(150,140,255,${a})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      // glow near mouse
      const dmx = p.x - mx;
      const dmy = p.y - my;
      const md2 = dmx * dmx + dmy * dmy;
      const glowR = 240 * this.dpr;
      if (md2 < glowR * glowR) {
        const md = Math.sqrt(md2);
        const a = (1 - md / glowR) * 0.9;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${a * 0.8})`;
        ctx.arc(p.x, p.y, p.r * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // an ambient radial in the mouse zone handled by reticle overlay in CSS/HTML
  }
}
