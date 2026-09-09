/* NEBULA OS — crisp inline SVG glyph set (monochrome, currentColor). */
const S = (p, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;

const GLYPHS = {
  nebula: S('<path d="M12 3a6 6 0 0 1 6 6c0 2-1 3.5-2.4 4.7C14.2 14.9 13 15 12 15s-2.2-.1-3.6-1.3C7 12.5 6 11 6 9a6 6 0 0 1 6-6z"/><circle cx="12" cy="12" r="2.4"/>'),
  pulse: S('<path d="M3 12h4l2-6 4 12 2-6h6"/>'),
  neon: S('<path d="M5 12v0M9 8v8M13 5v14M17 8v8M21 12v0"/>', 'stroke-width="2.2"'),
  aurora: S('<path d="M12 3l1.7 4.6L18.3 9.3l-4.6 1.7L12 15.6l-1.7-4.6L5.7 9.3l4.6-1.7L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>'),
  vault: S('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>'),
  drift: S('<path d="M3 8c3 0 3 3 6 3s3-3 6-3 3 3 6 3"/><path d="M3 14c3 0 3 3 6 3s3-3 6-3 3 3 6 3"/>'),
  term: S('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9l3 3-3 3M12 15h5"/>'),
  about: S('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".1" fill="currentColor"/>'),
  plus: S('<path d="M12 5v14M5 12h14"/>'),
  search: S('<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>'),
  power: S('<path d="M12 3v9"/><path d="M6.2 6.5a8 8 0 1 0 11.6 0"/>'),
  wifi: S('<path d="M2.5 9a15 15 0 0 1 19 0"/><path d="M5.5 12.5a10 10 0 0 1 13 0"/><path d="M8.5 16a5.5 5.5 0 0 1 7 0"/><circle cx="12" cy="19.2" r=".4" fill="currentColor"/>'),
  moon: S('<path d="M20 13A8 8 0 1 1 11 4a6.5 6.5 0 0 0 9 9z"/>'),
  moonO: S('<circle cx="21" cy="5" r="2"/><path d="M9 12a5 5 0 0 1 7-4.5"/>'),
  bluetooth: S('<path d="M7 7l10 10-5 4V3l5 4L7 17"/>'),
  volume: S('<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M17.5 6.5a7 7 0 0 1 0 11"/>'),
  mic: S('<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>'),
  cpu: S('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>'),
  chip: S('<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>'),
  gpu: S('<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 12h3M16 12h1"/>'),
  net: S('<circle cx="12" cy="12" r="2"/><path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10M9.5 9.5a3.5 3.5 0 0 0 0 5M14.5 9.5a3.5 3.5 0 0 1 0 5"/>'),
  palette: S('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-.8 1.6-1.9-.4-1 .6-1.8 1.6-1.6 1.4.3 2.5-.5 3-1.4.4-.8 1-1.4 1.7-1.7C21 14 22 13 22 12a9 9 0 0 0-10-9z"/><circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="10" r="1.1" fill="currentColor" stroke="none"/>'),
  shield: S('<path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/>'),
  zap: S('<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>'),
  save: S('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7V3M8 21v-7h8v7"/>'),
  refresh: S('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 3v4h-4"/>'),
  x: S('<path d="M6 6l12 12M18 6L6 18"/>'),
  min: S('<path d="M6 12h12"/>'),
  max: S('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
  restore: S('<rect x="4" y="8" width="12" height="12" rx="2"/><path d="M8 4h10a2 2 0 0 1 2 2v10"/>'),
  smile: S('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/>'),
  spark: S('<path d="M12 3l1.7 4.6L18.3 9.3l-4.6 1.7L12 15.6l-1.7-4.6L5.7 9.3l4.6-1.7L12 3z"/>'),
  globe: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>')
};

export function svg(name, cls = "") {
  return (GLYPHS[name] || GLYPHS.nebula).replace("<svg ", `<svg class="${cls}" `);
}
export function glyphMark(name, cls = "") {
  // a gradient-tinted tile icon
  return svg(name, cls);
}
export { GLYPHS };
