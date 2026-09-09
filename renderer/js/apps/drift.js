/* NEBULA OS — Drift: an ambient physics canvas. */
export class Drift {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d");
    this.mode = "drift";
    this.paused = false;
    this.t = 0;
    this.parts = [];
    this.accent = "#ffd34d";
    this.accent2 = "#ff5c7a";
    this.resize();
    for (let i = 0; i < 90; i++) this.parts.push(this.makePart());
    window.addEventListener("resize", () => this.resize());
    this.raf = null;
    this.loop();
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.floor(this.cv.clientWidth * dpr) || 400;
    this.cv.height = Math.floor(this.cv.clientHeight * dpr) || 300;
  }
  makePart() {
    const W = this.cv.width, H = this.cv.height;
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: 1 + Math.random() * 3, hue: Math.random(),
      ph: Math.random() * Math.PI * 2
    };
  }
  setMode(m) { this.mode = m; }
  setSpeed(s) { this.sp = s; }
  loop() {
    this.t += 0.016;
    if (!this.paused) {
      const W = this.cv.width, H = this.cv.height;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, W, H);
      if (this.mode === "drift") this.drawDrift(ctx, W, H);
      else if (this.mode === "field") this.drawField(ctx, W, H);
      else this.drawSpheres(ctx, W, H);
    }
    this.raf = requestAnimationFrame(() => this.loop());
  }
  cA(a) { return `hsla(45,100%,${65 + a * 10}%,`; }
  drawDrift(ctx, W, H) {
    const acc1 = getComputedStyle(document.documentElement).getPropertyValue("--a1").trim();
    const acc2 = getComputedStyle(document.documentElement).getPropertyValue("--a2").trim();
    // connecting web
    const web = ctx.createLinearGradient(0, 0, W, H);
    for (const p of this.parts) {
      p.x += p.vx; p.y += p.vy; p.ph += 0.02;
      if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
    }
    const link = 130;
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      ctx.beginPath();
      ctx.fillStyle = p.hue < 0.5 ? hexA(acc1, 0.5) : hexA(acc2, 0.5);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      for (let j = i + 1; j < this.parts.length; j++) {
        const q = this.parts[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < link * link) {
          ctx.strokeStyle = hexA(acc1, (1 - Math.sqrt(d2) / link) * 0.35);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    }
  }
  drawField(ctx, W, H) {
    // layered waves
    const acc1 = getComputedStyle(document.documentElement).getPropertyValue("--a1").trim();
    const acc2 = getComputedStyle(document.documentElement).getPropertyValue("--a2").trim();
    const cs = [acc1, acc2];
    for (let l = 0; l < 5; l++) {
      const baseY = H * (0.25 + l * 0.13);
      const amp = 18 + l * 6;
      const freq = 0.004 + l * 0.0012;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) {
        const y = baseY + Math.sin(x * freq + this.t * (1.2 + l * 0.3)) * amp * Math.sin(this.t * 0.5 + l) + Math.sin(x * freq * 3 + this.t) * amp * 0.3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.closePath();
      ctx.fillStyle = hexA(cs[l % 2], 0.07 + (4 - l) * 0.02);
      ctx.fill();
    }
  }
  drawSpheres(ctx, W, H) {
    const cx = W / 2, cy = H / 2;
    const acc1 = getComputedStyle(document.documentElement).getPropertyValue("--a1").trim();
    const acc2 = getComputedStyle(document.documentElement).getPropertyValue("--a2").trim();
    const orbiters = 8;
    for (let i = 0; i < orbiters; i++) {
      const rr = Math.min(W, H) * 0.3 * (1 + i * 0.09);
      const sp = 0.4 + (i % 3) * 0.35;
      const a = this.t * sp + (i * Math.PI * 2) / orbiters;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a * 1.3) * rr * 0.5;
      ctx.beginPath();
      const cc = i % 2 ? acc1 : acc2;
      ctx.fillStyle = cc;
      ctx.shadowBlur = 22; ctx.shadowColor = cc;
      ctx.arc(px, py, 5 + (i % 3) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.35);
    g.addColorStop(0, "rgba(255,211,77,.9)"); g.addColorStop(1, "rgba(255,92,122,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.35, 0, Math.PI * 2); ctx.fill();
  }
}
function hexA(hex, a) {
  const n = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(n)) return `rgba(255,255,255,${a})`;
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
}
