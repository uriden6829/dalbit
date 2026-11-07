// Opus encoding without ffmpeg: headless Edge/Chrome's WebCodecs AudioEncoder makes the packets,
// this file wraps them in an Ogg container (RFC 7845). Node built-ins only.
//   const enc = await openEncoder(); const ogg = await enc.encode(float32Mono48k, { bitrate }); await enc.close();
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BROWSERS = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'];

// Runs in the page. Input: base64 float32 PCM at 48 kHz mono. Output: { packets: [base64], head: base64|null }.
const PAGE_ENCODE = `async (b64, bitrate) => {
  const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const pcm = new Float32Array(u8.buffer);
  const packets = []; let head = null;
  const enc = new AudioEncoder({
    output: (chunk, meta) => {
      const b = new Uint8Array(chunk.byteLength); chunk.copyTo(b); packets.push(b);
      if (meta && meta.decoderConfig && meta.decoderConfig.description && !head) head = new Uint8Array(meta.decoderConfig.description);
    },
    error: (e) => { throw e; },
  });
  enc.configure({ codec: 'opus', sampleRate: 48000, numberOfChannels: 1, bitrate, opus: { application: 'audio', complexity: 10, frameDuration: 20000 } });
  const step = 48000;
  for (let i = 0; i < pcm.length; i += step) {
    const part = pcm.subarray(i, Math.min(pcm.length, i + step));
    enc.encode(new AudioData({ format: 'f32', sampleRate: 48000, numberOfFrames: part.length, numberOfChannels: 1, timestamp: Math.round(i / 48), data: part }));
  }
  await enc.flush(); enc.close();
  const toB64 = (b) => { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
  return JSON.stringify({ packets: packets.map(toB64), head: head ? toB64(head) : null });
}`;

export async function openEncoder() {
  const exe = BROWSERS.find(existsSync);
  if (!exe) throw new Error('No Edge/Chrome found');
  const server = createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><title>enc</title>'); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const profile = mkdtempSync(join(tmpdir(), 'dalbit-opus-'));
  const dbg = 9800 + Math.floor(Math.random() * 150);
  const proc = spawn(exe, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, `--remote-debugging-port=${dbg}`, `http://localhost:${port}/`], { stdio: 'ignore' });
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(500);
    try { target = (await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json()).find((t) => t.type === 'page' && t.url.includes(`:${port}`)); } catch { /* not up yet */ }
  }
  if (!target) throw new Error('browser did not start');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const call = (method, params) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

  // The target shows up before the page has loaded; WebCodecs exists only once we're on the localhost page.
  const ready = async () => (await call('Runtime.evaluate', { expression: `typeof AudioEncoder === 'function' && isSecureContext`, returnByValue: true })).result?.result?.value;
  for (let i = 0; i < 40 && !(await ready()); i++) await sleep(250);
  if (!(await ready())) throw new Error('WebCodecs AudioEncoder not available in this browser');
  async function encode(pcm48, { bitrate = 32000 } = {}) {
    const b64 = Buffer.from(pcm48.buffer, pcm48.byteOffset, pcm48.byteLength).toString('base64');
    const m = await call('Runtime.evaluate', { expression: `(${PAGE_ENCODE})(${JSON.stringify(b64)}, ${bitrate})`, awaitPromise: true, returnByValue: true });
    if (m.result?.exceptionDetails || !m.result?.result?.value) throw new Error(`encode failed: ${JSON.stringify(m.result?.exceptionDetails || m).slice(0, 400)}`);
    const { packets, head } = JSON.parse(m.result.result.value);
    const preSkip = head ? Buffer.from(head, 'base64').readUInt16LE(10) : 312;
    return oggOpus(packets.map((p) => Buffer.from(p, 'base64')), pcm48.length, preSkip);
  }
  // Decode with the browser's own decoder (what her app will do) -> Float32Array at 48 kHz. Used for self-checks.
  async function decode(ogg) {
    const expr = `(async (b64) => { const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const ab = await new OfflineAudioContext(1, 48000, 48000).decodeAudioData(u8.buffer); const d = ab.getChannelData(0);
      const b = new Uint8Array(d.buffer.slice(0)); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
      return JSON.stringify({ sr: ab.sampleRate, pcm: btoa(s) }); })(${JSON.stringify(ogg.toString('base64'))})`;
    const m = await call('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (!m.result?.result?.value) throw new Error(`decode failed: ${JSON.stringify(m.result?.exceptionDetails || m).slice(0, 300)}`);
    const { sr, pcm } = JSON.parse(m.result.result.value);
    const b = Buffer.from(pcm, 'base64');
    return { sr, wav: new Float32Array(b.buffer, b.byteOffset, b.length / 4) };
  }
  async function close() {
    try { ws.close(); } catch { /* gone */ }
    proc.kill();
    server.close();
    await sleep(300);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* still locked */ }
  }
  return { encode, decode, close };
}

// ---- Ogg container (RFC 3533 pages, RFC 7845 Opus mapping) ----
const CRC = new Uint32Array(256).map((_, i) => { let r = i << 24; for (let k = 0; k < 8; k++) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1; return r >>> 0; });
function crc32(buf) { let c = 0; for (const b of buf) c = ((c << 8) ^ CRC[((c >>> 24) ^ b) & 0xff]) >>> 0; return c; }

function page(packets, { granule, serial, seq, bos = false, eos = false }) {
  const lacing = [];
  for (const p of packets) { let n = p.length; while (n >= 255) { lacing.push(255); n -= 255; } lacing.push(n); }
  const h = Buffer.alloc(27 + lacing.length);
  h.write('OggS', 0); h[4] = 0; h[5] = (bos ? 2 : 0) | (eos ? 4 : 0);
  h.writeBigInt64LE(BigInt(granule), 6); h.writeUInt32LE(serial, 14); h.writeUInt32LE(seq, 18); h.writeUInt32LE(0, 22);
  h[26] = lacing.length; Buffer.from(lacing).copy(h, 27);
  const out = Buffer.concat([h, ...packets]);
  out.writeUInt32LE(crc32(out), 22);
  return out;
}

export function oggOpus(packets, samples, preSkip = 312) {
  const serial = 0x44414c42; // "DALB"
  const head = Buffer.alloc(19);
  head.write('OpusHead', 0); head[8] = 1; head[9] = 1; head.writeUInt16LE(preSkip, 10); head.writeUInt32LE(48000, 12); head.writeInt16LE(0, 16); head[18] = 0;
  const vendor = Buffer.from('dalbit');
  const tags = Buffer.alloc(8 + 4 + vendor.length + 4);
  tags.write('OpusTags', 0); tags.writeUInt32LE(vendor.length, 8); vendor.copy(tags, 12); tags.writeUInt32LE(0, 12 + vendor.length);
  const pages = [page([head], { granule: 0, serial, seq: 0, bos: true }), page([tags], { granule: 0, serial, seq: 1 })];
  let seq = 2, gran = 0, cur = [], size = 0;
  const end = preSkip + samples;
  packets.forEach((p, i) => {
    cur.push(p); size += p.length; gran += 960;
    const last = i === packets.length - 1;
    if (last || cur.length >= 50 || size > 6000) {
      pages.push(page(cur, { granule: last ? end : Math.min(gran, end), serial, seq: seq++, eos: last }));
      cur = []; size = 0;
    }
  });
  return Buffer.concat(pages);
}
