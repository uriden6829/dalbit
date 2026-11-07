// Objective checks for generated Korean speech:
//  - intelligibility: Whisper large-v3-turbo transcribes the clip, CER vs the script (catches skips, repeats, mumbles)
//  - signal: peak, RMS loudness, leading/trailing silence, speaking rate (syllables/s), median F0 (voice casting)
// Whisper (transformers.js) loads only when transcribe() is first called, so the DSP helpers work without it.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export function readWav(file) {
  const b = fs.readFileSync(file);
  const sr = b.readUInt32LE(24);
  let off = 12;
  while (b.toString('ascii', off, off + 4) !== 'data') off += 8 + b.readUInt32LE(off + 4);
  const n = b.readUInt32LE(off + 4) / 2;
  const wav = new Float32Array(n);
  for (let i = 0; i < n; i++) wav[i] = b.readInt16LE(off + 8 + i * 2) / 32768;
  return { wav, sr };
}

// Windowed-sinc resampler (good enough for analysis and for encoding input).
export function resample(x, from, to) {
  if (from === to) return x;
  const ratio = to / from, n = Math.floor(x.length * ratio), y = new Float32Array(n);
  const fc = Math.min(1, ratio) * 0.95, W = 16;
  for (let i = 0; i < n; i++) {
    const t = i / ratio, c = Math.floor(t);
    let s = 0, ws = 0;
    for (let k = c - W + 1; k <= c + W; k++) {
      if (k < 0 || k >= x.length) continue;
      const d = t - k, a = Math.PI * d * fc;
      const sinc = d === 0 ? 1 : Math.sin(a) / a;
      const win = 0.5 + 0.5 * Math.cos((Math.PI * d) / W);
      const w = sinc * win * fc;
      s += x[k] * w; ws += w;
    }
    y[i] = ws ? s / ws * 1 : 0;
  }
  return y;
}

export function signalStats(wav, sr) {
  let peak = 0, sum = 0;
  for (const v of wav) { const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; }
  const frame = Math.round(sr * 0.02);
  const rmsF = [];
  for (let i = 0; i + frame <= wav.length; i += frame) { let s = 0; for (let j = 0; j < frame; j++) s += wav[i + j] ** 2; rmsF.push(Math.sqrt(s / frame)); }
  const thr = 0.01;
  const first = rmsF.findIndex((r) => r > thr), last = rmsF.length - 1 - [...rmsF].reverse().findIndex((r) => r > thr);
  const voiced = rmsF.filter((r) => r > thr);
  const activeRms = voiced.length ? Math.sqrt(voiced.reduce((a, r) => a + r * r, 0) / voiced.length) : 0;
  return { dur: wav.length / sr, peak, rms: Math.sqrt(sum / wav.length), activeDb: 20 * Math.log10(activeRms + 1e-9), lead: first * 0.02, tail: (rmsF.length - 1 - last) * 0.02, f0: medianF0(wav, sr) };
}

// Autocorrelation pitch per 40 ms frame, median of voiced frames.
export function medianF0(wav, sr) {
  const x = resample(wav, sr, 16000), fs16 = 16000, N = 640, out = [];
  for (let i = 0; i + N <= x.length; i += 320) {
    let e = 0; for (let j = 0; j < N; j++) e += x[i + j] ** 2;
    if (e / N < 1e-4) continue;
    let best = 0, lag = 0;
    for (let l = Math.floor(fs16 / 400); l <= Math.floor(fs16 / 70); l++) {
      let s = 0; for (let j = 0; j < N - l; j++) s += x[i + j] * x[i + j + l];
      s /= e; if (s > best) { best = s; lag = l; }
    }
    if (best > 0.5) out.push(fs16 / lag);
  }
  out.sort((a, b) => a - b);
  return out.length ? Math.round(out[out.length >> 1]) : 0;
}

let asr = null;
export async function transcribe(wav, sr) {
  if (!asr) {
    const { pipeline, env } = await import('@huggingface/transformers');
    env.cacheDir = fileURLToPath(new URL('./.models/hf/', import.meta.url));
    const device = process.platform === 'win32' ? 'dml' : 'cpu';
    asr = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-large-v3-turbo', { dtype: { encoder_model: device === 'cpu' ? 'q8' : 'fp16', decoder_model_merged: 'q4' }, device });
  }
  const r = await asr(resample(wav, sr, 16000), { language: 'korean', task: 'transcribe' });
  return r.text.trim();
}

const norm = (s) => s.replace(/[^가-힣0-9a-zA-Z]/g, '');
export function cer(ref, hyp) {
  const a = Array.from(norm(ref)), b = Array.from(norm(hyp));
  if (!a.length) return b.length ? 1 : 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length] / a.length;
}
export const syllables = (s) => (s.match(/[가-힣]/g) || []).length;
