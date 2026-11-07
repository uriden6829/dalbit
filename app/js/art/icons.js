// Line icons (24x24, stroke = currentColor) and the moon-phase mastery mark.

const P = {
  home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
  book: 'M5 4h9a4 4 0 0 1 4 4v12H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10',
  story: 'M4 5h7v14H4zM13 5h7v6h-7zM13 13h7v6h-7z',
  spell: 'M6 3h10l3 3v15H6zM9 9h7M9 13h7M9 17h4',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  chat: 'M4 5h16v11H9l-5 4z',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  play: 'M8 5l11 7-11 7z',
  sound: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  slow: 'M4 9h4l5-4v14l-5-4H4zM17 12h4',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6L6 18',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.6 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  sparkle: 'M12 3v6M12 15v6M3 12h6M15 12h6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  hint: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  flag: 'M5 21V4h11l-2 4 2 4H5',
  send: 'M4 12l16-8-6 16-2-7z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4.2-4.2',
  wand: 'M4 20L15 9M14 4v2M19 9h2M17.5 5.5l1.5-1.5M12 7l5 5',
};

export function icon(name, size = 20) {
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[name] || P.star}"/></svg>`;
}

// Mastery 0..4 as a moon: new moon (outline) → crescent → half → gibbous → full.
export function moon(level = 0, size = 18, title = '') {
  const r = 8, c = 10;
  const lit = 'var(--moon-lit)', dark = 'var(--moon-dark)';
  let shape = '';
  if (level >= 4) shape = `<circle cx="${c}" cy="${c}" r="${r}" fill="${lit}"/>`;
  else if (level > 0) {
    const k = [0, 0.55, 0, -0.6][level];   // terminator ellipse radius factor
    const rx = Math.abs(k) * r;
    const sweep = level === 3 ? 1 : 0;
    shape = level === 2
      ? `<path d="M${c} ${c - r} A${r} ${r} 0 0 1 ${c} ${c + r} Z" fill="${lit}"/>`
      : `<path d="M${c} ${c - r} A${r} ${r} 0 0 1 ${c} ${c + r} A${rx} ${r} 0 0 ${sweep} ${c} ${c - r} Z" fill="${lit}"/>`;
  }
  return `<svg class="moon" viewBox="0 0 20 20" width="${size}" height="${size}" aria-hidden="${title ? 'false' : 'true'}">${title ? `<title>${title}</title>` : ''}<circle cx="${c}" cy="${c}" r="${r}" fill="${dark}" stroke="var(--moon-ring)" stroke-width="1"/>${shape}</svg>`;
}
export const MASTERY_LABEL = ['New', 'Learning', 'Young', 'Growing', 'Mastered'];
