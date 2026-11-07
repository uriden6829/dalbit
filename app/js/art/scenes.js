// Webtoon backgrounds. Each scene(W, H, opts, uid) returns { bg, fg } SVG markup.
// `fg` is drawn in front of the characters (counters, tables) — characters placed in a scene's
// `behind` range get their lower half hidden by it. Signs use real Korean so the art is reading practice.

const KO = `font-family="Noto Sans KR, Malgun Gothic, sans-serif"`;
const KOS = `font-family="Gowun Batang, serif"`;
const lg = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`).join('')}</linearGradient>`;
const rg = (id, c, op = 0.6) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${op}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
const glow = (u, id, cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}${u})"/>`;
const stars = (W, H, n, seed = 7) => {
  let s = seed, out = '';
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) out += `<circle cx="${(rnd() * W).toFixed(1)}" cy="${(rnd() * H).toFixed(1)}" r="${(0.5 + rnd() * 0.9).toFixed(2)}" fill="#fff" opacity="${(0.35 + rnd() * 0.5).toFixed(2)}"/>`;
  return out;
};
const books = (x, y, w, h, seed) => {
  const cols = ['#8a5a5a', '#5a6b8a', '#7b8f6a', '#c9a457', '#6a4d74', '#a3836a', '#4f6d6a'];
  let s = seed, out = '', cx = x;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  while (cx < x + w - 4) {
    const bw = 4 + rnd() * 5, bh = h * (0.65 + rnd() * 0.35);
    out += `<rect x="${cx.toFixed(1)}" y="${(y + h - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${cols[Math.floor(rnd() * cols.length)]}" rx=".6"/>`;
    cx += bw + 0.8;
  }
  return out;
};

export const SCENES = {
  street(W, H, o, u) {
    const night = (o.time || 'night') === 'night', dusk = o.time === 'dusk';
    const g = H - 24;
    const sky = night ? [['0', '#1b1e44'], ['1', '#3b3b70']] : dusk ? [['0', '#e8b9a2'], ['1', '#f3dcc0']] : [['0', '#cfe0ea'], ['1', '#f1e9dc']];
    const f1 = night ? '#3a3557' : '#e4d6c3', f2 = night ? '#433a52' : '#d6c4ad', win = night ? '#f2d38a' : '#bcd0d8';
    return {
      bg: `<defs>${lg('sky' + u, sky)}${rg('lamp' + u, '#f6dc94', 0.55)}${rg('moon' + u, '#f6e7b8', 0.35)}</defs>
      <rect width="${W}" height="${H}" fill="url(#sky${u})"/>
      ${night ? stars(W, H * 0.4, 18) + glow(u, 'moon', 300, 42, 46) + `<circle cx="300" cy="42" r="15" fill="#f3e4b4"/>` : ''}
      <path d="M0 ${H * 0.34} h40 v-18 h30 v26 h46 v-34 h36 v40 h52 v-22 h40 v30 h50 v-26 h66 V${g} H0 Z" fill="${night ? '#2a2b55' : '#cfc4b6'}" opacity=".9"/>
      <rect x="8" y="${H * 0.3}" width="160" height="${g - H * 0.3}" fill="${f1}"/>
      <rect x="192" y="${H * 0.26}" width="160" height="${g - H * 0.26}" fill="${f2}"/>
      <rect x="22" y="${H * 0.3 + 10}" width="132" height="24" rx="3" fill="#2a2738"/>
      <text x="88" y="${H * 0.3 + 27}" ${KOS} font-size="15" fill="#f3e6c4" text-anchor="middle">카페</text>
      <rect x="206" y="${H * 0.26 + 10}" width="132" height="24" rx="3" fill="#5b3f4f"/>
      <text x="272" y="${H * 0.26 + 27}" ${KOS} font-size="15" fill="#f3e6c4" text-anchor="middle">책방</text>
      <rect x="24" y="${H * 0.3 + 46}" width="78" height="${g - H * 0.3 - 46}" fill="${win}" opacity="${night ? 0.85 : 0.7}"/>
      <path d="M24 ${H * 0.3 + 46} h78" stroke="${night ? '#c9a457' : '#9aa9b0'}" stroke-width="3"/>
      <rect x="112" y="${H * 0.3 + 46}" width="42" height="${g - H * 0.3 - 46}" fill="${night ? '#5a4a3a' : '#a3836a'}"/>
      <rect x="208" y="${H * 0.26 + 46}" width="60" height="${g - H * 0.26 - 46}" fill="${night ? '#f0c977' : '#c7d6da'}" opacity=".8"/>
      ${books(212, H * 0.26 + 52, 52, 18, 3)}
      <rect x="282" y="${H * 0.26 + 46}" width="52" height="${g - H * 0.26 - 46}" rx="2" fill="${night ? '#2c2440' : '#8b6b5a'}"/>
      ${night ? `<rect x="290" y="${H * 0.26 + 54}" width="36" height="${g - H * 0.26 - 54}" fill="#f6dc94" opacity=".55"/>` : ''}
      <rect x="0" y="${g}" width="${W}" height="${H - g}" fill="${night ? '#2b2a46' : '#cbbfae'}"/>
      <path d="M0 ${g + 3} H${W}" stroke="${night ? '#3d3c5c' : '#b5a996'}" stroke-width="2"/>
      <rect x="179" y="${H * 0.18}" width="3" height="${g - H * 0.18}" fill="${night ? '#1c1b30' : '#6c6a73'}"/>
      <path d="M172 ${H * 0.18} h17 l-3 9 h-11 z" fill="${night ? '#1c1b30' : '#6c6a73'}"/>
      ${night ? glow(u, 'lamp', 180, H * 0.18 + 10, 48) : ''}`,
      fg: '',
    };
  },

  academy(W, H, o, u) {
    const g = H - 20, ax = 120, aw = 120, top = 26, bot = g - 54;
    return {
      bg: `<defs>${lg('wall' + u, [['0', '#2b2c5a'], ['1', '#1d1e3f']])}${lg('win' + u, [['0', '#3c4180'], ['1', '#262a55']])}${rg('candle' + u, '#f6d68a', 0.6)}${rg('mn' + u, '#f6e7b8', 0.45)}</defs>
      <rect width="${W}" height="${H}" fill="url(#wall${u})"/>
      <path d="M${ax} ${bot} V${top + 50} A${aw / 2} ${aw / 2} 0 0 1 ${ax + aw} ${top + 50} V${bot} Z" fill="url(#win${u})"/>
      ${stars(aw, 80, 10, 11).replace(/cx="([\d.]+)"/g, (_, x) => `cx="${(+x + ax).toFixed(1)}"`).replace(/cy="([\d.]+)"/g, (_, y) => `cy="${(+y + top + 10).toFixed(1)}"`)}
      ${glow(u, 'mn', 204, top + 44, 34)}<circle cx="204" cy="${top + 44}" r="13" fill="#f3e4b4"/>
      <path d="M${ax + aw / 2} ${top} V${bot} M${ax} ${top + 80} H${ax + aw}" stroke="#191a35" stroke-width="3"/>
      <path d="M${ax} ${bot} V${top + 50} A${aw / 2} ${aw / 2} 0 0 1 ${ax + aw} ${top + 50} V${bot}" stroke="#46406a" stroke-width="5" fill="none"/>
      <rect x="${ax - 6}" y="${bot}" width="${aw + 12}" height="7" fill="#46406a"/>
      <path d="M${ax + 10} ${bot + 7} L${ax - 40} ${g + 20} H${ax + aw + 40} L${ax + aw - 10} ${bot + 7} Z" fill="#f3e3b0" opacity=".06"/>
      <rect x="8" y="22" width="88" height="${g - 22}" fill="#33283f"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="12" y="${30 + i * ((g - 40) / 4)}" width="80" height="2.5" fill="#241c2e"/>${books(14, 30 + i * ((g - 40) / 4) - 22 + ((g - 40) / 4), 76, 20, 5 + i)}`).join('')}
      <rect x="264" y="22" width="88" height="${g - 22}" fill="#33283f"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="268" y="${30 + i * ((g - 40) / 4)}" width="80" height="2.5" fill="#241c2e"/>${books(270, 30 + i * ((g - 40) / 4) - 22 + ((g - 40) / 4), 76, 20, 17 + i)}`).join('')}
      <rect x="155" y="8" width="50" height="16" rx="2" fill="#3a3157"/><text x="180" y="20" ${KOS} font-size="10" fill="#d4b26a" text-anchor="middle">달빛</text>
      <rect x="0" y="${g}" width="${W}" height="${H - g}" fill="#2a2140"/>
      <ellipse cx="180" cy="${g + 10}" rx="120" ry="7" fill="#4a3555" opacity=".6"/>
      <ellipse cx="112" cy="${bot - 1}" rx="16" ry="3.5" fill="#5a4060"/><rect x="110" y="${bot - 1}" width="4" height="${g - bot + 1}" fill="#4a3452"/><path d="M104 ${g} h16" stroke="#4a3452" stroke-width="3"/>${glow(u, 'candle', 112, bot - 6, 30)}<rect x="109" y="${bot - 14}" width="6" height="12" rx="1" fill="#efe4cc"/><path d="M112 ${bot - 22} q3 4 0 7 q-3 -3 0 -7" fill="#f6c86a"/>`,
      fg: '',
    };
  },

  cafe(W, H, o, u) {
    const g = H - 20, ct = g - 62;
    return {
      bg: `<defs>${lg('w' + u, [['0', '#f3e7d3'], ['1', '#e8d6bb']])}${rg('l' + u, '#f8dc96', 0.5)}</defs>
      <rect width="${W}" height="${H}" fill="url(#w${u})"/>
      <rect x="0" y="${g - 70}" width="${W}" height="70" fill="#c9a07a"/>
      ${Array.from({ length: 18 }, (_, i) => `<path d="M${i * 20 + 10} ${g - 70} V${g}" stroke="#b88d66" stroke-width="1.2"/>`).join('')}
      <rect x="204" y="22" width="140" height="96" rx="6" fill="#34343c"/>
      <text x="274" y="40" ${KOS} font-size="12" fill="#e2c27a" text-anchor="middle">메뉴</text>
      ${[['아메리카노', '4,500'], ['카페라떼', '5,000'], ['녹차', '4,500'], ['케이크', '6,000']].map(([n, p], i) => `<text x="216" y="${58 + i * 15}" ${KO} font-size="10" fill="#f1ead8">${n}</text><text x="332" y="${58 + i * 15}" ${KO} font-size="10" fill="#f1ead8" text-anchor="end">${p}</text>`).join('')}
      <path d="M20 70 H150" stroke="#9c7a5a" stroke-width="3"/>
      ${[30, 52, 74, 96, 118].map((x, i) => `<path d="M${x} 70 v-12 h14 v12 z" fill="${['#f4efe6', '#c98b6b', '#f4efe6', '#7f9a83', '#f4efe6'][i]}"/>`).join('')}
      ${[70, 150].map((x) => `<path d="M${x} 0 V24" stroke="#2f2e48" stroke-width="1.2"/><path d="M${x - 12} 34 a12 10 0 0 1 24 0 z" fill="#2f2e48"/>${glow(u, 'l', x, 40, 34)}`).join('')}
      <ellipse cx="30" cy="${g - 86}" rx="10" ry="22" fill="#7f9a83"/><ellipse cx="44" cy="${g - 92}" rx="9" ry="20" fill="#6d8a72"/><rect x="24" y="${g - 74}" width="26" height="22" rx="3" fill="#d8c8b0"/>
      <rect x="0" y="${g}" width="${W}" height="${H - g}" fill="#b59575"/>
      <rect x="240" y="${ct - 30}" width="46" height="30" rx="4" fill="#b9bcc4"/><rect x="246" y="${ct - 24}" width="34" height="8" rx="2" fill="#3a3d4a"/>`,
      fg: `<rect x="168" y="${ct}" width="${W - 168}" height="${H - ct}" fill="#b98a63"/>
      <rect x="164" y="${ct - 6}" width="${W - 160}" height="8" rx="2" fill="#8a6447"/>
      ${[200, 250, 300].map((x) => `<path d="M${x} ${ct + 6} V${H}" stroke="#a87b56" stroke-width="1.5"/>`).join('')}`,
      behind: [0.55, 1], lift: 26,
    };
  },

  store(W, H, o, u) {
    const g = H - 20, ct = g - 58;
    const prod = ['#e9b8a8', '#a9c8d8', '#f1d79a', '#b9d3b0', '#d9b8d8', '#f4efe6'];
    let shelves = '';
    for (let r = 0; r < 4; r++) {
      const y = 34 + r * 34;
      shelves += `<rect x="10" y="${y + 22}" width="150" height="4" fill="#c4cccb"/>`;
      for (let i = 0; i < 9; i++) shelves += `<rect x="${14 + i * 16}" y="${y + 6 + ((i * 7 + r * 3) % 6)}" width="12" height="${16 - ((i * 7 + r * 3) % 6)}" rx="1.5" fill="${prod[(i + r * 2) % prod.length]}"/>`;
    }
    return {
      bg: `<defs>${lg('w' + u, [['0', '#f2f4f2'], ['1', '#e3e8e6']])}</defs>
      <rect width="${W}" height="${H}" fill="url(#w${u})"/>
      <rect x="0" y="0" width="${W}" height="18" fill="#4f8a8b"/><text x="180" y="13.5" ${KO} font-size="10" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="2">편의점</text>
      ${shelves}
      <rect x="250" y="28" width="100" height="${ct - 40}" rx="3" fill="#c9d6dc"/>
      ${[0, 1].map((c) => `<rect x="${256 + c * 47}" y="34" width="41" height="${ct - 52}" fill="#e8f2f6" opacity=".8"/>${[0, 1, 2].map((r) => `<path d="M${256 + c * 47} ${60 + r * 30} h41" stroke="#b8c8cf"/>${[0, 1, 2, 3].map((b) => `<rect x="${260 + c * 47 + b * 9}" y="${42 + r * 30}" width="6" height="16" rx="2.5" fill="${prod[(b + r + c) % prod.length]}"/>`).join('')}`).join('')}`).join('')}
      <rect x="176" y="40" width="54" height="44" rx="3" fill="#fff"/><text x="203" y="62" ${KO} font-size="16" font-weight="700" fill="#d0564b" text-anchor="middle">1+1</text><text x="203" y="77" ${KO} font-size="8" fill="#555" text-anchor="middle">행사 상품</text>
      <rect x="0" y="${g}" width="${W}" height="${H - g}" fill="#d9dedd"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 45} ${g} V${H}" stroke="#c6cccb"/>`).join('')}`,
      fg: `<rect x="176" y="${ct}" width="${W - 176}" height="${H - ct}" fill="#d8dcdc"/><rect x="172" y="${ct - 6}" width="${W - 168}" height="8" rx="2" fill="#b6bcbc"/>
      <rect x="290" y="${ct - 26}" width="44" height="20" rx="3" fill="#3a3d4a"/><rect x="296" y="${ct - 22}" width="32" height="9" rx="1" fill="#7fd1a0" opacity=".85"/>`,
      behind: [0.55, 1], lift: 22,
    };
  },

  subway(W, H, o, u) {
    const g = H - 18;
    return {
      bg: `<defs>${lg('w' + u, [['0', '#dfe6e1'], ['1', '#cfd8d2']])}${lg('t' + u, [['0', '#2a3142'], ['1', '#3a4256']])}</defs>
      <rect width="${W}" height="${H}" fill="url(#w${u})"/>
      <rect x="0" y="0" width="${W}" height="14" fill="#bfc8c2"/>
      <rect x="14" y="20" width="${W - 28}" height="18" rx="3" fill="#f8f7f2"/>
      <path d="M30 29 H330" stroke="#3aa35b" stroke-width="3"/>
      ${[['시청', 50], ['을지로입구', 140], ['동대문', 230], ['성수', 310]].map(([n, x]) => `<circle cx="${x}" cy="29" r="3.6" fill="#fff" stroke="#3aa35b" stroke-width="2"/>`).join('')}
      ${[['시청', 50], ['을지로입구', 140], ['동대문', 230], ['성수', 310]].map(([n, x]) => `<text x="${x + 6}" y="26" ${KO} font-size="6" fill="#333">${n}</text>`).join('')}
      ${[24, 136, 248].map((x) => `<rect x="${x}" y="48" width="88" height="${H * 0.36}" rx="8" fill="url(#t${u})"/><path d="M${x + 12} ${56} l30 ${H * 0.28}" stroke="#fff" stroke-opacity=".08" stroke-width="10"/>`).join('')}
      ${Array.from({ length: 8 }, (_, i) => `<path d="M${30 + i * 44} 14 V30" stroke="#9aa39e"/><path d="M${24 + i * 44} 30 h12 l-6 9 z" fill="none" stroke="#7c8681" stroke-width="2"/>`).join('')}
      <rect x="0" y="${g - 56}" width="${W}" height="22" rx="4" fill="#5f8aa6"/>
      <rect x="0" y="${g - 36}" width="${W}" height="14" fill="#527a95"/>
      <rect x="0" y="${g}" width="${W}" height="${H - g}" fill="#b8b4a8"/>`,
      fg: '',
    };
  },

  taxi(W, H, o, u) {
    return {
      bg: `<defs>${lg('n' + u, [['0', '#262a52'], ['1', '#3d3768']])}</defs>
      <rect width="${W}" height="${H}" fill="#1e2033"/>
      <path d="M30 26 Q180 4 330 26 L346 ${H * 0.55} H14 Z" fill="url(#n${u})"/>
      ${[[60, 0.4, '#f6d68a'], [92, 0.5, '#9fc3e8'], [140, 0.45, '#f6d68a'], [210, 0.38, '#f29a8a'], [262, 0.5, '#f6d68a'], [300, 0.42, '#9fc3e8']].map(([x, y, c]) => `<circle cx="${x}" cy="${H * y}" r="${5 + (x % 4)}" fill="${c}" opacity=".55"/>`).join('')}
      <path d="M14 ${H * 0.55} H346 V${H} H14 Z" fill="#3a3549"/>
      <rect x="40" y="${H * 0.5}" width="280" height="${H * 0.5}" rx="22" fill="#4a4458"/>`,
      fg: `<rect x="0" y="${H - 34}" width="${W}" height="34" fill="#2c2838"/>
      <rect x="252" y="${H - 30}" width="80" height="22" rx="4" fill="#15151f"/><text x="292" y="${H - 14}" ${KO} font-size="12" fill="#7fd1a0" text-anchor="middle">4,800원</text>`,
      behind: [0, 1],
    };
  },

  restaurant(W, H, o, u) {
    const g = H - 16, tt = g - 46;
    return {
      bg: `<defs>${lg('w' + u, [['0', '#f1e3cb'], ['1', '#e7d3b4']])}${rg('l' + u, '#f8dc96', 0.45)}</defs>
      <rect width="${W}" height="${H}" fill="url(#w${u})"/>
      <rect x="20" y="20" width="320" height="40" rx="4" fill="#7a5a3e"/>
      ${[['김치찌개', '8,000'], ['된장찌개', '8,000'], ['비빔밥', '9,000'], ['불고기', '13,000']].map(([n, p], i) => `<rect x="${28 + i * 79}" y="25" width="73" height="30" rx="2" fill="#f8f1e2"/><text x="${64.5 + i * 79}" y="38" ${KO} font-size="9.5" font-weight="700" fill="#3a2e24" text-anchor="middle">${n}</text><text x="${64.5 + i * 79}" y="50" ${KO} font-size="8.5" fill="#8a5a3e" text-anchor="middle">${p}</text>`).join('')}
      ${glow(u, 'l', 180, 70, 90)}
      <rect x="0" y="${g - 80}" width="${W}" height="80" fill="#c4a07a"/>
      ${Array.from({ length: 24 }, (_, i) => `<path d="M${i * 15 + 7} ${g - 80} V${g}" stroke="#b28d68" stroke-width="1"/>`).join('')}
      <rect x="0" y="${g}" width="${W}" height="${H - g}" fill="#8f6f55"/>`,
      fg: `<rect x="30" y="${tt}" width="300" height="${H - tt}" fill="#a07650"/><rect x="24" y="${tt - 7}" width="312" height="10" rx="3" fill="#7d5a3c"/>
      <ellipse cx="180" cy="${tt - 10}" rx="34" ry="9" fill="#3a3335"/><ellipse cx="180" cy="${tt - 13}" rx="29" ry="6" fill="#c4553f"/>
      <path d="M170 ${tt - 26} q-5 -8 0 -14 M182 ${tt - 28} q-5 -8 0 -14 M194 ${tt - 26} q-5 -8 0 -14" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      ${[[96, '#e86f52'], [122, '#8fb069'], [238, '#e2b65a'], [264, '#8fb069']].map(([x, c]) => `<ellipse cx="${x}" cy="${tt - 6}" rx="11" ry="4" fill="#f4efe6"/><ellipse cx="${x}" cy="${tt - 7.5}" rx="7" ry="2.4" fill="${c}"/>`).join('')}
      <ellipse cx="60" cy="${tt - 7}" rx="12" ry="5" fill="#f4efe6"/><ellipse cx="300" cy="${tt - 7}" rx="12" ry="5" fill="#f4efe6"/>`,
      behind: [0, 1],
    };
  },

  home(W, H, o, u) {
    const g = H - 16, tt = g - 36;
    return {
      bg: `<defs>${lg('w' + u, [['0', '#f2e8d8'], ['1', '#e9dcc6']])}${rg('l' + u, '#f8dc96', 0.5)}</defs>
      <rect width="${W}" height="${H}" fill="url(#w${u})"/>
      <rect x="22" y="26" width="76" height="76" rx="3" fill="#2b2e5a"/><circle cx="76" cy="48" r="9" fill="#f3e4b4"/>
      <path d="M60 26 V102 M22 64 H98" stroke="#d9c7aa" stroke-width="4"/><rect x="22" y="26" width="76" height="76" rx="3" fill="none" stroke="#c7b08c" stroke-width="5"/>
      <rect x="250" y="34" width="48" height="36" rx="2" fill="#d8c3a0"/><rect x="255" y="39" width="38" height="26" fill="#a9b9a0"/>
      <path d="M180 0 V30" stroke="#5a4a3a"/><path d="M164 40 a16 12 0 0 1 32 0 z" fill="#efe1c4"/>${glow(u, 'l', 180, 44, 80)}
      <rect x="290" y="${g - 70}" width="60" height="70" fill="#a8825f"/><path d="M290 ${g - 35} H350 M320 ${g - 70} V${g}" stroke="#8f6b4c" stroke-width="2"/>
      <rect x="0" y="${g}" width="${W}" height="${H - g}" fill="#c8a37b"/>`,
      fg: `<rect x="44" y="${tt + 8}" width="272" height="${H - tt}" fill="#7a5236"/><rect x="44" y="${tt + 8}" width="272" height="5" fill="#6a4630"/>
      <rect x="150" y="${tt + 8}" width="60" height="${H - tt}" fill="#6a4d74" opacity=".55"/><rect x="36" y="${tt}" width="288" height="12" rx="4" fill="#8a5f3e"/>
      ${[[90, '#f4efe6', '#e6d9b8'], [140, '#f4efe6', '#d9a066'], [220, '#f4efe6', '#9fb87a'], [270, '#f4efe6', '#f4efe6']].map(([x, a, b]) => `<ellipse cx="${x}" cy="${tt - 2}" rx="15" ry="5" fill="${a}"/><ellipse cx="${x}" cy="${tt - 4}" rx="10" ry="3" fill="${b}"/>`).join('')}
      <g>${[[170, '#f0e4ec'], [180, '#e2efdc'], [190, '#f3ecd6'], [175, '#e8dcef'], [186, '#f0e4ec']].map(([x, c], i) => `<path d="M${x - 5} ${tt - 4 - (i > 2 ? 4 : 0)} a5 4 0 0 1 10 0 z" fill="${c}" stroke="#d8ccc0" stroke-width=".5"/>`).join('')}</g>`,
      behind: [0, 1],
    };
  },

  market(W, H, o, u) {
    const g = H - 16, st = g - 50;
    return {
      bg: `<defs>${lg('s' + u, [['0', '#dce9ee'], ['1', '#f3ece0']])}</defs>
      <rect width="${W}" height="${H}" fill="url(#s${u})"/>
      <path d="M0 ${H * 0.45} h50 v-30 h40 v20 h60 v-40 h50 v30 h70 v-24 h90 V${g} H0 Z" fill="#d8cdbd"/>
      <rect x="140" y="56" width="${W - 140}" height="${st - 56}" fill="#ecdcc4"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${130 + i * 26}" y="22" width="13" height="32" fill="#c96b5c"/><rect x="${143 + i * 26}" y="22" width="13" height="32" fill="#f4e9d6"/>`).join('')}
      <path d="M130 54 ${Array.from({ length: 18 }, (_, i) => `q6.5 8 13 0`).join(' ')}" fill="#c96b5c" stroke="#c96b5c"/>
      <rect x="0" y="${g}" width="${W}" height="${H - g}" fill="#c7bba8"/>`,
      fg: `<rect x="150" y="${st}" width="${W - 150}" height="${H - st}" fill="#9a7a58"/>
      ${[[190, '#d84a4a', 4], [255, '#c9302c', 5.5], [318, '#e0b04a', 5]].map(([x, c, r]) => `<rect x="${x - 26}" y="${st - 16}" width="52" height="18" rx="2" fill="#c9a77a"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${x - 20 + (i % 5) * 10}" cy="${st - 18 - Math.floor(i / 5) * 6}" r="${r}" fill="${c}"/>`).join('')}`).join('')}
      <rect x="164" y="${st + 10}" width="58" height="22" rx="1" fill="#efe2c8" transform="rotate(-3 193 ${st + 21})"/><text x="193" y="${st + 25}" ${KO} font-size="9" font-weight="700" fill="#3a2e24" text-anchor="middle" transform="rotate(-3 193 ${st + 21})">딸기 5,000원</text>
      <rect x="228" y="${st + 12}" width="62" height="22" rx="1" fill="#efe2c8" transform="rotate(2 259 ${st + 23})"/><text x="259" y="${st + 27}" ${KO} font-size="9" font-weight="700" fill="#3a2e24" text-anchor="middle" transform="rotate(2 259 ${st + 23})">사과 3개 4,000원</text>`,
      behind: [0.5, 1], lift: 18,
    };
  },

  river(W, H, o, u) {
    const rain = !!o.rain, g = H - 18, wy = H * 0.5;
    const sky = rain ? [['0', '#8d97a6'], ['1', '#c3c8cf']] : o.time === 'dusk' ? [['0', '#f0b9a0'], ['1', '#f6dfc4']] : [['0', '#b9d2e4'], ['1', '#f2e5d0']];
    return {
      bg: `<defs>${lg('s' + u, sky)}${lg('r' + u, [['0', rain ? '#7a8a9a' : '#86a9c4'], ['1', rain ? '#9aa7b3' : '#b4cde0']])}${lg('gr' + u, [['0', rain ? '#8aa182' : '#a3c493'], ['1', rain ? '#768f70' : '#88b07d']])}</defs>
      <rect width="${W}" height="${H}" fill="url(#s${u})"/>
      <path d="M0 ${wy} q60 -26 120 -10 q40 -18 90 -6 q70 -24 150 4 V${wy} Z" fill="${rain ? '#7f8a96' : '#a7b8c6'}" opacity=".7"/>
      <path d="M232 ${wy - 22} q20 -14 44 0 Z" fill="${rain ? '#7f8a96' : '#9aaebf'}"/><rect x="252" y="${wy - 58}" width="3" height="40" fill="${rain ? '#6c7682' : '#8da0b2'}"/><circle cx="253.5" cy="${wy - 60}" r="4" fill="${rain ? '#6c7682' : '#8da0b2'}"/>
      ${[20, 60, 96, 150, 190, 300, 330].map((x, i) => `<rect x="${x}" y="${wy - 14 - (i % 3) * 7}" width="${14 + (i % 2) * 8}" height="${14 + (i % 3) * 7}" fill="${rain ? '#77828e' : '#9fb1c1'}"/>`).join('')}
      <rect x="0" y="${wy}" width="${W}" height="${H * 0.2}" fill="url(#r${u})"/>
      <path d="M0 ${wy + 6} H${W}" stroke="#8a97a6" stroke-width="3"/>
      ${[30, 90, 150, 210, 270, 330].map((x) => `<path d="M${x - 26} ${wy + 6} q26 16 52 0" stroke="#8a97a6" stroke-width="2" fill="none"/>`).join('')}
      ${[60, 160, 260].map((x) => `<path d="M${x} ${wy + 26} h30" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>`).join('')}
      <rect x="0" y="${wy + H * 0.2}" width="${W}" height="${H - wy - H * 0.2}" fill="url(#gr${u})"/>
      ${rain ? Array.from({ length: 46 }, (_, i) => `<path d="M${(i * 37) % W} ${(i * 53) % H} l-5 13" stroke="#e8eef4" stroke-opacity=".55" stroke-width="1"/>`).join('') : ''}`,
      fg: `<path d="M20 ${H} L52 ${g - 14} H170 L190 ${H} Z" fill="#f2e6d0"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${52 + i * 26} ${g - 14} L${30 + i * 36} ${H}" stroke="#d98a7e" stroke-width="5" opacity=".7"/>`).join('')}
      <rect x="120" y="${g - 22}" width="34" height="18" rx="2" fill="#f3d7a0"/><text x="137" y="${g - 10}" ${KO} font-size="7" fill="#8a4a2a" text-anchor="middle" font-weight="700">치킨</text>`,
    };
  },

  pharmacy(W, H, o, u) {
    const g = H - 18, ct = g - 56;
    return {
      bg: `<defs>${lg('w' + u, [['0', '#eaf2ee'], ['1', '#dce8e2']])}</defs>
      <rect width="${W}" height="${H}" fill="url(#w${u})"/>
      <rect x="22" y="18" width="64" height="26" rx="4" fill="#3f8a63"/><text x="54" y="36" ${KO} font-size="13" font-weight="700" fill="#fff" text-anchor="middle">약국</text>
      <rect x="100" y="22" width="18" height="18" rx="2" fill="#3f8a63"/><path d="M109 25 V37 M103 31 H115" stroke="#fff" stroke-width="3.5"/>
      ${[0, 1, 2].map((r) => `<rect x="170" y="${30 + r * 34}" width="180" height="3" fill="#c1d1c8"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${174 + i * 17}" y="${12 + r * 34 + (i % 3) * 2}" width="13" height="${18 - (i % 3) * 2}" rx="1" fill="${['#ffffff', '#a9c8d8', '#f1d79a', '#ffffff', '#b9d3b0'][(i + r) % 5]}" stroke="#d2ddd6" stroke-width=".5"/>`).join('')}`).join('')}
      <rect x="0" y="${g}" width="${W}" height="${H - g}" fill="#cfd9d3"/>`,
      fg: `<rect x="176" y="${ct}" width="${W - 176}" height="${H - ct}" fill="#f6f6f2"/><rect x="172" y="${ct - 6}" width="${W - 168}" height="8" rx="2" fill="#d2dad5"/>
      <rect x="230" y="${ct - 14}" width="20" height="10" rx="1.5" fill="#ffffff" stroke="#c9d3cd"/><rect x="254" y="${ct - 12}" width="14" height="8" rx="1.5" fill="#a9c8d8"/>`,
      behind: [0.55, 1], lift: 22,
    };
  },

  room(W, H, o, u) {
    const g = H - 16;
    return {
      bg: `<defs>${lg('w' + u, [['0', '#3a3466'], ['1', '#2a2a52']])}${rg('l' + u, '#f6d68a', 0.55)}</defs>
      <rect width="${W}" height="${H}" fill="url(#w${u})"/>
      <rect x="140" y="24" width="80" height="70" rx="40" fill="#1f2347"/>${stars(70, 50, 8, 23).replace(/cx="([\d.]+)"/g, (_, x) => `cx="${(+x + 145).toFixed(1)}"`).replace(/cy="([\d.]+)"/g, (_, y) => `cy="${(+y + 32).toFixed(1)}"`)}
      <circle cx="196" cy="48" r="9" fill="#f3e4b4"/><rect x="140" y="24" width="80" height="70" rx="40" fill="none" stroke="#5a4e7a" stroke-width="4"/>
      <rect x="250" y="${g - 52}" width="100" height="8" fill="#7a5a48"/><rect x="258" y="${g - 44}" width="6" height="44" fill="#6a4c3c"/><rect x="336" y="${g - 44}" width="6" height="44" fill="#6a4c3c"/>
      ${glow(u, 'l', 318, g - 76, 46)}<path d="M308 ${g - 52} h20 l-4 -8 h-12 z" fill="#3a3157"/><path d="M318 ${g - 60} v-16" stroke="#3a3157" stroke-width="2"/><path d="M308 ${g - 76} h20 l-5 -10 h-10 z" fill="#efe1c4"/>
      ${books(262, g - 70, 34, 18, 31)}
      <rect x="0" y="${g - 40}" width="110" height="40" rx="6" fill="#c9b8d6"/><rect x="0" y="${g - 50}" width="40" height="16" rx="6" fill="#efe7f2"/>
      <rect x="0" y="${g}" width="${W}" height="${H - g}" fill="#3a2e4a"/>`,
      fg: '',
    };
  },

  plain(W, H, o, u) {
    const tones = { warm: ['#f6e7d2', '#ecd2c0'], night: ['#2b2d5c', '#1b1d3e'], cool: ['#e0e9ef', '#cad6e2'], rose: ['#f4dfde', '#e6c6cf'] };
    const [a, b] = tones[o.tone || 'warm'];
    const lines = o.fx === 'lines' ? Array.from({ length: 28 }, (_, i) => { const t = (i / 28) * Math.PI * 2; return `<path d="M${180 + Math.cos(t) * 70} ${H / 2 + Math.sin(t) * 60} L${180 + Math.cos(t) * 260} ${H / 2 + Math.sin(t) * 220}" stroke="${o.tone === 'night' ? '#fff' : '#3a3446'}" stroke-opacity=".12" stroke-width="${1 + (i % 3)}"/>`; }).join('') : '';
    return {
      bg: `<defs><radialGradient id="p${u}" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#p${u})"/>${lines}${o.tone === 'night' ? stars(W, H, 22, 41) : ''}`,
      fg: '',
    };
  },
};

export const SCENE_NAMES = Object.keys(SCENES);
