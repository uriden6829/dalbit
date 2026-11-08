// SVG -> PNG through headless Edge over the DevTools protocol (one browser for many renders; Node built-ins only).
//   const r = await openRenderer(); const png = await r.png(svg, w, h); await r.sheet(items, {cols}); await r.close();
// The page is the app's own toonlab.html (served by tools/serve.mjs) so the app fonts load exactly as in the app.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BROWSERS = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'];

export async function openRenderer({ url = `http://localhost:${process.env.PORT || 5173}/toonlab.html?view=none` } = {}) {
  const exe = BROWSERS.find(existsSync);
  const profile = mkdtempSync(join(tmpdir(), 'artlab-'));
  const dbg = 9300 + Math.floor(Math.random() * 400);
  const proc = spawn(exe, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${profile}`, `--remote-debugging-port=${dbg}`, url], { stdio: 'ignore' });
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(400);
    try { target = (await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json()).find((t) => t.type === 'page'); } catch { /* not up */ }
  }
  if (!target) throw new Error('browser did not start');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const call = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => {
    const m = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (m.result?.exceptionDetails) throw new Error(m.result.exceptionDetails.exception?.description || 'eval failed');
    return m.result?.result?.value;
  };
  for (let i = 0; i < 50; i++) { if (await evaluate(`document.readyState === 'complete'`)) break; await sleep(200); }
  await evaluate(`document.fonts.ready.then(() => 1)`);

  async function shoot(html, w, h, scale = 1) {
    await call('Emulation.setDeviceMetricsOverride', { width: Math.ceil(w), height: Math.ceil(h), deviceScaleFactor: 1, mobile: false });
    await evaluate(`(() => { document.body.style.cssText = 'margin:0;padding:0;background:#fff'; document.body.innerHTML = ${JSON.stringify(html)}; return 1; })()`);
    await evaluate(`document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).then(() => 1)`);
    const m = await call('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale } });
    return Buffer.from(m.result.data, 'base64');
  }

  return {
    evaluate,
    // svg: full <svg> markup (sized to fill the box) or inner markup + viewBox
    async png(svg, w, h, { scale = 1, bg = '#fff', viewBox } = {}) {
      const doc = viewBox ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${svg}</svg>` : svg;
      return shoot(`<div style="width:${w}px;height:${h}px;background:${bg};overflow:hidden"><style>#stage>svg{width:100%;height:100%;display:block}</style><div id="stage" style="width:100%;height:100%">${doc}</div></div>`, w, h, scale);
    },
    // Contact sheet for looking: items [{ svg, label, viewBox? }], each cell w x h, labels underneath; optional grid overlay.
    async sheet(items, { cols = 4, w = 300, h = 300, bg = '#fff', grid = false, title = '' } = {}) {
      const rows = Math.ceil(items.length / cols), lh = 18, th = title ? 26 : 0;
      // Each engine numbers its own ids; two engines (A/B) in one document would collide, so namespace per cell.
      const ns = (svg, k) => svg.replace(/\bid="([^"]+)"/g, `id="c${k}_$1"`).replace(/url\(#([^)]+)\)/g, `url(#c${k}_$1)`).replace(/href="#([^"]+)"/g, `href="#c${k}_$1"`);
      let k = 0;
      const cell = (it0) => {
        const it = { ...it0, svg: ns(it0.svg, ++k) };
        const inner = it.viewBox ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${it.viewBox}" width="${w}" height="${h}">${it.svg}</svg>` : it.svg;
        const g = grid ? `<svg style="position:absolute;left:0;top:0" width="${w}" height="${h}">${Array.from({ length: 9 }, (_, i) => `<path d="M${(w * (i + 1)) / 10} 0V${h}M0 ${(h * (i + 1)) / 10}H${w}" stroke="#f0f" stroke-opacity=".25" stroke-width="1"/>`).join('')}</svg>` : '';
        return `<div style="width:${w}px"><div style="position:relative;width:${w}px;height:${h}px;background:${it.bg || bg};overflow:hidden" class="c">${inner}${g}</div><div style="font:12px/18px sans-serif;height:${lh}px;overflow:hidden;white-space:nowrap">${it.label || ''}</div></div>`;
      };
      const W = cols * (w + 8) + 8, H = th + rows * (h + lh + 8) + 8;
      const html = `<style>.c>svg{width:100%;height:100%;display:block}</style><div style="padding:8px;background:#ddd;width:${W - 16}px">${title ? `<div style="font:bold 15px sans-serif;height:${th}px">${title}</div>` : ''}<div style="display:grid;grid-template-columns:repeat(${cols},${w}px);gap:8px">${items.map(cell).join('')}</div></div>`;
      return shoot(html, W, H);
    },
    async close() { try { await call('Browser.close'); } catch { /* gone */ } ws.close(); setTimeout(() => { try { proc.kill(); } catch { /* gone */ } }, 500); },
  };
}

export function save(buf, path) { writeFileSync(path, buf); return path; }
