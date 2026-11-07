// Toon Lab (dev page, not part of the installed app): app/toonlab.html?view=cast|moods|figures|panel&ep=ep01&n=3
// Used with tools/toon.mjs to render and review webtoon art.
import { FOLK, bust, figure, flyer, MOOD_NAMES } from './folk.js';

const q = new URLSearchParams(location.search);
const view = q.get('view') || 'cast';
const lab = document.getElementById('lab');
const box = (inner, vb, w, h) => `<svg viewBox="${vb}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

async function main() {
  let html = '';
  if (view === 'cast') {
    html += '<h2>Cast</h2><div class="lab-grid">';
    for (const [k, c] of Object.entries(FOLK)) html += box(`<g transform="translate(110 120)">${bust(c, { mood: q.get('mood') || 'smile', turn: +(q.get('turn') || 0.25), hat: k === 'me' })}</g><text x="8" y="16" font-size="12">${k}</text>`, '0 0 220 280', 220, 280);
    html += '</div>';
  } else if (view === 'moods') {
    const c = FOLK[q.get('who') || 'me'];
    html += '<h2>Moods</h2><div class="lab-grid">';
    for (const m of MOOD_NAMES) html += box(`<g transform="translate(90 96) scale(.8)">${bust(c, { mood: m, turn: 0.2 })}</g><text x="6" y="14" font-size="12">${m}</text>`, '0 0 180 230', 180, 230);
    html += '</div>';
  } else if (view === 'figures') {
    html += '<h2>Figures</h2><div class="lab-grid">';
    for (const p of ['stand', 'walk', 'wave', 'hold', 'sit', 'run', 'point', 'think']) html += box(`<g transform="translate(110 300) scale(.4)">${figure(FOLK[q.get('who') || 'me'], { pose: p, mood: 'smile', hat: q.get('who') === 'me' || !q.get('who') })}</g><text x="6" y="14" font-size="12">${p}</text>`, '0 0 220 320', 220, 320);
    html += box(`<g transform="translate(300 160) scale(.6)">${flyer(FOLK.me)}</g>`, '0 0 460 320', 460, 320);
    html += '</div>';
  } else if (view === 'scenes') {
    const { panelSVG2 } = await import('./compose.js');
    const { VISTAS } = await import('./vista.js');
    html += '<h2>Scenes</h2><div class="lab-grid">';
    const shots = (q.get('shots') || 'wide').split(',');
    for (const sc of Object.keys(VISTAS)) for (const shot of shots) {
      const p = { shot, scene: sc, time: q.get('time') || undefined, cast: shot === 'establish' ? [] : shot === 'bust' || shot === 'close' ? [['me', { x: 0.3, mood: 'smile', turn: 0.3 }], ['minji', { x: 0.72, mood: 'talk', turn: -0.3 }]] : [['me', { x: 0.35, mood: 'smile', pose: 'stand', hat: true }], ['grandma', { x: 0.7, mood: 'gentle', pose: 'wave' }], ['jiji', { x: 0.15 }]] };
      html += `<div style="width:360px;background:#fff"><div style="font:11px sans-serif">${sc} · ${shot}</div>${panelSVG2(p, {})}</div>`;
    }
    html += '</div>';
  } else if (view === 'grid') {
    // Fixed grid for tools/toon.mjs pixel critique: 4 columns of 360 px, rows 340 px apart, panel top-left at (col*370, row*340).
    const { panelSVG2 } = await import('./compose.js');
    const { episodes } = await import('../../../content/index.js');
    const ep = episodes.get(q.get('ep') || 'ep01');
    document.body.style.cssText = 'margin:0;padding:0;background:#fff';
    html += ep.panels.map((p, i) => `<div style="position:absolute;left:${(i % 4) * 370}px;top:${Math.floor(i / 4) * 340}px;width:360px">${panelSVG2({ ...p, h: Math.min(p.h || 0, 0.9) || undefined }, {})}</div>`).join('');
  } else if (view === 'panel' || view === 'episode') {
    const { renderEpisodeLab } = await import('./compose.js');
    html += await renderEpisodeLab(q.get('ep') || 'ep01', q.get('n'));
  }
  lab.innerHTML = html;
  document.body.dataset.ready = '1';
}
main();
