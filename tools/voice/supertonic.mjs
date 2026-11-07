// Lean Supertonic 3 runner for Node (adapted from supertone-inc/supertonic nodejs/helper.js, MIT).
// Differences: typed arrays instead of nested JS arrays, seeded noise (same text -> same audio on rebuild),
// optional execution provider (cpu | dml).
import fs from 'node:fs';
import path from 'node:path';
import * as ort from 'onnxruntime-node';

const REPL = { '–': '-', '‑': '-', '—': '-', '_': ' ', '“': '"', '”': '"', '‘': "'", '’': "'", '´': "'", '`': "'", '[': ' ', ']': ' ', '|': ' ', '/': ' ', '#': ' ', '→': ' ', '←': ' ' };

export function preprocess(text, lang = 'ko') {
  text = text.normalize('NFKD');
  for (const [k, v] of Object.entries(REPL)) text = text.replaceAll(k, v);
  text = text.replace(/[♥☆♡©\\]/g, '');
  text = text.replace(/ ([,.!?;:'])/g, '$1');
  while (text.includes('""')) text = text.replace('""', '"');
  while (text.includes("''")) text = text.replace("''", "'");
  text = text.replace(/\s+/g, ' ').trim();
  if (!/[.!?;:,'"')\]}…。」』】〉》›»]$/.test(text)) text += '.';
  return `<${lang}>${text}</${lang}>`;
}

// mulberry32
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const hashStr = (s) => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

export async function loadTTS(dir, { ep = 'cpu', threads = 0 } = {}) {
  const onnx = path.join(dir, 'onnx');
  const cfg = JSON.parse(fs.readFileSync(path.join(onnx, 'tts.json'), 'utf8'));
  const indexer = JSON.parse(fs.readFileSync(path.join(onnx, 'unicode_indexer.json'), 'utf8'));
  const opts = { executionProviders: [ep], graphOptimizationLevel: 'all' };
  if (threads) opts.intraOpNumThreads = threads;
  const load = (n) => ort.InferenceSession.create(path.join(onnx, n), opts);
  const [dp, te, ve, voc] = await Promise.all(['duration_predictor.onnx', 'text_encoder.onnx', 'vector_estimator.onnx', 'vocoder.onnx'].map(load));
  const styles = {};
  const style = (name) => {
    if (styles[name]) return styles[name];
    const j = JSON.parse(fs.readFileSync(path.join(dir, 'voice_styles', `${name}.json`), 'utf8'));
    const t = (s) => new ort.Tensor('float32', Float32Array.from(s.data.flat(Infinity)), s.dims);
    return (styles[name] = { ttl: t(j.style_ttl), dp: t(j.style_dp), raw: j });
  };
  // A designed voice: weighted sum of preset style vectors. { ttl: { F5: 0.6, M1: 0.4 }, dp: { F3: 1 } } —
  // ttl carries the timbre, dp the rhythm (how long each sound lasts); dp defaults to the ttl weights.
  const blend = (weights, key) => {
    let out = null, dims = null;
    for (const [name, w] of Object.entries(weights)) {
      const s = style(name).raw[key];
      const v = s.data.flat(Infinity);
      if (!out) { out = new Float32Array(v.length); dims = s.dims; }
      for (let i = 0; i < v.length; i++) out[i] += w * v[i];
    }
    return new ort.Tensor('float32', out, dims);
  };
  const mixStyle = (r) => {
    const k = JSON.stringify(r);
    return (styles[k] ||= { ttl: blend(r.ttl, 'style_ttl'), dp: blend(r.dp || r.ttl, 'style_dp') });
  };
  const sr = cfg.ae.sample_rate, base = cfg.ae.base_chunk_size, ccf = cfg.ttl.chunk_compress_factor, ldim = cfg.ttl.latent_dim;

  // One chunk of text -> Float32Array wav. opts: voice, steps, speed, seed, lang
  async function synth(text, { voice = 'F1', steps = 8, speed = 1.05, seed = 1, lang = 'ko', durScale = null, bucket = false } = {}) {
    const st = typeof voice === 'string' ? style(voice) : mixStyle(voice);
    const p = preprocess(text, lang);
    const chars = Array.from(p);
    // GPU (DirectML) recompiles for every new input shape; padding lengths up to buckets lets it reuse them.
    const L = bucket ? Math.ceil(chars.length / 16) * 16 : chars.length;
    const ids = new BigInt64Array(L);
    chars.forEach((c, i) => { ids[i] = BigInt(indexer[c.charCodeAt(0)] ?? 0); });
    const idsT = new ort.Tensor('int64', ids, [1, L]);
    const tm = new Float32Array(L); tm.fill(1, 0, chars.length);
    const maskT = new ort.Tensor('float32', tm, [1, 1, L]);
    const d = await dp.run({ text_ids: idsT, style_dp: st.dp, text_mask: maskT });
    let dur = d.duration.data[0] / speed;
    if (durScale) dur *= durScale;
    const enc = await te.run({ text_ids: idsT, style_ttl: st.ttl, text_mask: maskT });
    const wavLen = Math.floor(dur * sr);
    const chunk = base * ccf;
    const Tr = Math.floor((wavLen + chunk - 1) / chunk);
    const T = bucket ? Math.ceil(Tr / 32) * 32 : Tr;
    const D = ldim * ccf;
    const r = rng(seed);
    const x = new Float32Array(D * T);
    for (let d = 0; d < D; d++) for (let t = 0; t < Tr; t++) { const u1 = Math.max(1e-10, r()), u2 = r(); x[d * T + t] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }
    const lm = new Float32Array(T); lm.fill(1, 0, Tr);
    const lmT = new ort.Tensor('float32', lm, [1, 1, T]);
    const tot = new ort.Tensor('float32', Float32Array.of(steps), [1]);
    let lat = x;
    for (let s = 0; s < steps; s++) {
      const o = await ve.run({ noisy_latent: new ort.Tensor('float32', lat, [1, D, T]), text_emb: enc.text_emb, style_ttl: st.ttl, text_mask: maskT, latent_mask: lmT, total_step: tot, current_step: new ort.Tensor('float32', Float32Array.of(s), [1]) });
      lat = Float32Array.from(o.denoised_latent.data);
    }
    const w = await voc.run({ latent: new ort.Tensor('float32', lat, [1, D, T]) });
    const wav = Float32Array.from(w.wav_tts.data).subarray(0, wavLen);
    return { wav, sr, dur };
  }
  return { synth, sr, style, mixStyle };
}

export function writeWav(file, wav, sr) {
  const b = Buffer.alloc(44 + wav.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + wav.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(wav.length * 2, 40);
  for (let i = 0; i < wav.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, wav[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(file, b);
}
