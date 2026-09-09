# ◈ NEBULA OS

**An "operating system from the future" — a cinematic, glassmorphism desktop
experience that lives entirely in the browser canvas and runs as a real
Windows desktop app.**

There is no login. There is an *experience*: a boot sequence, a lock screen,
a living particle constellation desktop, draggable glass windows, a system
monitor with glowing gauges, a music-visualizer app, a fake file manager, an
ambient-physics sandbox, a working little terminal, and a settings app that
re-paints the entire universe live. Every color change re-tints the starfield,
the aurora blobs and every window accent *in real time*.

> NEBULA OS is not meant to be useful. It is meant to be **felt**.

---

## ✨ What's inside

| App         | What it does |
|-------------|--------------|
| **Boot → Lock → Desktop** | Animated boot mark + progress → big glass clock lock screen → press the ring to unlock |
| **Pulse**   | Live "system monitor": CPU / GPU / Memory / Network arc gauges + sparkline + telemetry, all animating |
| **Neon**    | Synthesized spectrum visualizer — bars / wave / orbit modes, switch colors, sensitivity |
| **Aurora**  | Settings — pick an **aura** (6 color presets) and the whole OS repaints instantly; toggle particles/grid/blobs, glass blur, particle density, bloom |
| **Vault**   | A fake navigable file manager with sidebar storage bar and breadcrumbs |
| **Drift**   | Ambient physics sandbox — drifting constellation, waves, or orbiting bodies |
| **Terminal**| Working mini-shell — try `help`, `theme nova`, `status`, `matrix`… |
| **About**   | The manifesto + a live reacting orb |

**Desktop tricks**
- Double-click any title bar → maximize / restore.
- Drag from the bottom-right corner → resize.
- Drag any window by its title bar.
- `Escape` closes the focused window.
- Click the bottom **start orb** → Launchpad (search works).
- Change theme in **Aurora → Appearance** and watch everything follow.

---

## ▶ Run it now (browser preview)

```bash
npm run preview          # serves http://127.0.0.1:5173 (or node server.js)
```
Open the printed URL. Everything is client-side — no build step.

---

## 🪟 Build the real Windows app

```bash
npm install              # downloads Electron (~big, one-time)
npm start                # run in a real frameless desktop window
npm run dist             # → dist/ NEBULA-OS-1.0.0-portable.exe  (portable)
npm run dist:install     # → NSIS installer .exe
```

The Electron main process (`main.js`) boots a tiny private web server on
`127.0.0.1` and opens the renderer in a **frameless, borderless window**, so
the taskbar, window controls and everything else are the app's own UI — like a
true OS shell. `npm run dist` works on Linux/macOS too, but build **on
Windows** to get the `.exe` (electron-builder cross-target notes apply).

---

## 🧱 Project layout

```
main.js                     Electron main process (frameless window + private server)
server.js                   tiny static server (used by Electron + browser preview)
package.json                scripts + electron-builder config
renderer/
  index.html                single-page shell: boot / lock / desktop
  css/
    base.css                tokens, aurora gradient vars, background FX
    shell.css               boot, lock, taskbar/dock, launchpad, toasts, sysbar
    windows.css             glass windows, drag/resize chrome
    apps.css                each app's visual language
  js/
    state.js                central state + live theme engine (aura presets)
    background.js           canvas constellation + constellation-web + cursor glow
    wm.js                   window manager (open/drag/focus/min/max/close/resize)
    icons.js                crisp inline SVG icon set
    apps.js                 app catalog + builders
    apps/neon.js            spectrum visualizer engine
    apps/drift.js           ambient physics engine
  assets/icon.png           Windows/exe icon
```

**Design system highlights**
- Aura-driven CSS custom properties (`--a1`, `--a2`) so the entire theme is
  data, not hardcoded colors.
- Layered depth: nebula blobs → perspective grid → particle canvas →
  frosted-glass windows.
- Micro-motion everywhere: boot rings, idle bobbing accents, magnetic hover
  easing, ripple reveal on windows, sheen on glass.

---

## 📄 License
MIT — this is a design experiment, play with it however you like.
