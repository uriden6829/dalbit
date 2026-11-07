// 지지 — the academy's black cat. Original design: gold eyes, plum hat, crescent-moon charm.
// jijiGroup() returns SVG markup in a 120x150 box (feet at y≈146) for reuse inside webtoon panels.

const FUR = '#1e1c27', FUR_HI = '#2d2a3a', HAT = '#3d2f57', HAT_HI = '#4d3d6b', BAND = '#d4b26a', EYE = '#f1d98a';

function eyes(mood) {
  const L = 47, R = 73, Y = 77;
  const open = (dx = 0, dy = 0, rx = 7.4, ry = 8.6, pr = [2.7, 6]) => [L, R].map((x) => `
    <ellipse cx="${x}" cy="${Y}" rx="${rx}" ry="${ry}" fill="${EYE}"/>
    <ellipse cx="${x + dx}" cy="${Y + dy}" rx="${pr[0]}" ry="${pr[1]}" fill="#14131b"/>
    <circle cx="${x + dx + 2.2}" cy="${Y + dy - 3.2}" r="1.6" fill="#fff" opacity=".9"/>`).join('');
  switch (mood) {
    case 'happy':
      return [L, R].map((x) => `<path d="M${x - 7} ${Y + 2} Q${x} ${Y - 7} ${x + 7} ${Y + 2}" stroke="${EYE}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`).join('');
    case 'sleepy':
      return [L, R].map((x) => `<path d="M${x - 6} ${Y + 1} Q${x} ${Y + 4} ${x + 6} ${Y + 1}" stroke="${EYE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`).join('');
    case 'surprised':
      return open(0, 0, 8.6, 9.6, [3.4, 3.8]);
    case 'think':
      return open(-2.2, -2.6);
    case 'sad':
      return open(0, 2.2) + [L, R].map((x, i) => `<path d="M${x - 8} ${Y - 9 + (i ? 3 : -1)} L${x + 8} ${Y - 9 + (i ? -1 : 3)} L${x + 8} ${Y - 14} L${x - 8} ${Y - 14} Z" fill="${FUR}"/>`).join('');
    case 'smug':
      return open(1.2, 1.5, 7.4, 8.6, [2.4, 5]) + [L, R].map((x) => `<rect x="${x - 9}" y="${Y - 11}" width="18" height="9" fill="${FUR}"/>`).join('');
    default:
      return open();
  }
}

export function jijiGroup(mood = 'idle', { animate = false } = {}) {
  return `
  <g class="jiji-art ${animate ? 'animate' : ''}">
    <ellipse cx="60" cy="146" rx="30" ry="3.5" fill="#000" opacity=".12"/>
    <path class="tail" d="M76 136 C100 138 108 116 100 100 C96 92 88 94 91 101" stroke="${FUR}" stroke-width="7.5" fill="none" stroke-linecap="round"/>
    <path d="M40 142 C35 120 43 99 60 97 C77 99 85 120 80 142 Q60 147 40 142 Z" fill="${FUR}"/>
    <path d="M52 108 Q60 104 68 108" stroke="${FUR_HI}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="51" cy="142" rx="6.5" ry="3.6" fill="${FUR_HI}"/>
    <ellipse cx="69" cy="142" rx="6.5" ry="3.6" fill="${FUR_HI}"/>
    <g class="head">
      <path d="M33 70 L28 40 L52 56 Z" fill="${FUR}"/>
      <path d="M87 70 L92 40 L68 56 Z" fill="${FUR}"/>
      <path d="M35 64 L32 47 L46 57 Z" fill="#4a3442"/>
      <path d="M85 64 L88 47 L74 57 Z" fill="#4a3442"/>
      <ellipse cx="60" cy="76" rx="31" ry="25" fill="${FUR}"/>
      <g class="eyes">${eyes(mood)}</g>
      <path d="M57.5 85.5 L62.5 85.5 L60 88.3 Z" fill="#c98f93"/>
      <path d="M60 88.3 Q57.5 92 54.5 90.3 M60 88.3 Q62.5 92 65.5 90.3" stroke="#6f6a7d" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M40 85 L22 82 M40 89 L23 92 M80 85 L98 82 M80 89 L97 92" stroke="#5d5a6c" stroke-width=".8" stroke-linecap="round"/>
      <g class="hat">
        <ellipse cx="60" cy="53" rx="28" ry="6.5" fill="${HAT}"/>
        <path d="M46 52 C49 38 54 24 63 13 C67 8 75 5 80 9 C73 11 71 19 70.5 29 C70 39 72 46 75 52 Z" fill="${HAT_HI}"/>
        <path d="M46.5 48 L74 48 L75 52.5 L45.6 52.5 Z" fill="${BAND}"/>
        <path d="M33 53.5 Q60 61 87 53.5" stroke="#2c2142" stroke-width="1.2" fill="none" opacity=".6"/>
      </g>
    </g>
    <path d="M43 98 Q60 106 77 98" stroke="#6d4f74" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M61.5 101.5 a4.3 4.3 0 1 0 0 7.6 a3.3 3.3 0 1 1 0 -7.6 Z" fill="${BAND}"/>
  </g>`;
}

export function jijiSVG(mood = 'idle', { size = 120, animate = true, label = '지지' } = {}) {
  return `<svg class="jiji" viewBox="0 0 120 150" width="${size}" height="${size * 1.25}" role="img" aria-label="${label}">${jijiGroup(mood, { animate })}</svg>`;
}
