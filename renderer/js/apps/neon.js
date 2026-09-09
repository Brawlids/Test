/* NEBULA OS — Neon visualizer. Synthesizes spectrum data (no real audio
 * dependency) and renders an animated light show: bars / wave / orbit. */
export class Visualizer {
  constructor(canvas, overlay) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d");
    this.overlay = overlay;
    this.playing = false;
    this.mode = "bars";
    this.gain = 0.9;
    this.color = "#35e0ff";
    this.color2 = "#8a6bff";
    this.bands = new Array(64).fill(0);
    this.peak = new Array(64).fill(0);
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.raf = null;
    this.t = Math.random() * 100;
    // fake music profile
    this.beat = 0;
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.floor(this.cv.clientWidth * dpr) || 300;
    this.cv.height = Math.floor(this.cv.clientHeight * dpr) || 200;
  }
  setMode(m) { this.mode = m; }
  setColor(c) { this.color = c; this.color2 = shade(c, 0.4); }
  setGain(g) { this.gain = g; }
  start() { this.play(); }
  play() { this.playing = true; this._loop(); }
  pause() { this.playing = false; cancelAnimationFrame(this.raf); }
  _loop() {
    if (!this.playing) return;
    this.t += 0.05;
    // synthesize data
    this._synth();
    const ctx = this.ctx;
    const W = this.cv.width, H = this.cv.height;
    ctx.clearRect(0, 0, W, H);
    if (this.mode === "bars") this._bars(ctx, W, H);
    else if (this.mode === "wave") this._wave(ctx, W, H);
    else this._orbit(ctx, W, H);
    this.raf = requestAnimationFrame(() => this._loop());
  }
  _synth() {
    const n = this.bands.length;
    const pulse = (Math.sin(this.t * 2) + 1) / 2;
    const kick = Math.pow(Math.sin(this.t * 4), 8) > 0.999 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const f = i / n;
      const shape = Math.pow(Math.sin(f * Math.PI), 1.4); // bell, more energy in mids
      const wobble = Math.sin(this.t * (3 + f * 6) + f * 9) * 0.5 + 0.5;
      const base = shape * (0.35 + wobble * 0.65);
      const spike = Math.random() * 0.5 * (0.4 + kick);
      let v = (base * 0.7 + spike * 0.3) * this.gain;
      v = Math.min(1, v + kick * 0.4 * Math.exp(-f * 4));
      this.bands[i] += (v - this.bands[i]) * 0.55;
      if (this.bands[i] > this.peak[i]) this.peak[i] = this.bands[i];
      else this.peak[i] *= 0.985;
    }
  }
  _bars(ctx, W, H) {
    const n = this.bands.length;
    const gap = 2;
    const bw = (W - gap * (n - 1)) / n;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, this.color2); grad.addColorStop(1, this.color);
    ctx.fillStyle = grad;
    const baseY = H;
    for (let i = 0; i < n; i++) {
      const h = this.bands[i] * (H - 20);
      const x = i * (bw + gap);
      // glow bar
      const g = ctx.createLinearGradient(0, baseY - h, 0, baseY);
      const cc = this.color; // todo fade
      ctx.shadowBlur = 14; ctx.shadowColor = this.color;
      roundRect(ctx, x + bw * 0.12, baseY - h, bw * 0.76, h, 4);
      ctx.fill();
      // peak cap
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x + bw * 0.2, baseY - this.peak[i] * (H - 20) - 3, bw * 0.6, 2);
      ctx.globalAlpha = 1;
    }
  }
  _wave(ctx, W, H) {
    ctx.strokeStyle = this.color;
    ctx.shadowBlur = 20; ctx.shadowColor = this.color;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    const mid = H / 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 3) {
      const f = x / W;
      const idx = Math.floor(f * (this.bands.length - 1));
      const v = this.bands[idx] || 0;
      const y = mid + Math.sin(x * 0.03 + this.t * 3) * 30 * v * 4 + (v - 0.4) * (H * 0.5);
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    // filled reflection
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    const g = ctx.createLinearGradient(0, mid - 40, 0, H);
    g.addColorStop(0, hexA(this.color, 0.3)); g.addColorStop(1, hexA(this.color, 0));
    ctx.fillStyle = g; ctx.shadowBlur = 0;
    ctx.fill();
    ctx.stroke();
  }
  _orbit(ctx, W, H) {
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2.6;
    const rings = 5;
    ctx.lineWidth = 1.5;
    for (let r = 0; r < rings; r++) {
      const rr = R * (0.5 + r * 0.13);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rr * 1.4, rr * 0.55, 0.2 + r * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = hexA(this.color, 0.12 + r * 0.02);
      ctx.stroke();
    }
    // orbiting particles sized by band amplitude
    const n = this.bands.length;
    for (let i = 0; i < n; i += 3) {
      const v = this.bands[i];
      const ang = this.t * (1 + v * 2) + i * 0.7;
      const rr = R * (0.6 + (this.bands[(i + 5) % n]) * 0.6);
      const px = cx + Math.cos(ang) * rr * 1.4 * Math.cos(0.2);
      const py = cy + Math.sin(ang) * rr * 0.6;
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 12; ctx.shadowColor = this.color;
      ctx.arc(px, py, 1.5 + v * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // core
    ctx.beginPath();
    ctx.fillStyle = this.color2;
    ctx.shadowBlur = 40; ctx.shadowColor = this.color;
    const k = (this.bands[20] || 0.3);
    ctx.arc(cx, cy, 8 + k * 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
function roundRect(ctx, x, y, w, h, r) {
  if (h <= 0) return;
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function shade(hex, amt) {
  const n = hex.replace("#", ""); let r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  const lum = 0.9;
  // produce a shifted color (toward partner) — simplify: lighten
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, v + (255 - v) * amt)).toString(16).padStart(2, "0")).join("");
}
function hexA(hex, a) {
  const n = hex.replace("#", "");
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
}
