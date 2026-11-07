import { resample } from './measure.mjs';

// Pitch and vocal-tract size together, by resampling (+ = higher and smaller, like a child; − = bigger, darker).
// Also shortens/lengthens the clip by the same factor: render at speed / 2^(st/12) to keep the pace.
export const shiftFactor = (st) => 2 ** (st / 12);
export const shift = (wav, sr, st) => (st ? resample(wav, sr, sr / shiftFactor(st)) : wav);

// Clip finishing: trim the model's ~0.6 s padding, short fades (no clicks), even loudness across voices.
// opts: { lead: s, tail: s, db: target active RMS dBFS, peak: max peak }
export function post(wav, sr, { lead = 0.06, tail = 0.14, db = -20, peak = 0.89 } = {}) {
  const frame = Math.round(sr * 0.01);
  const rms = [];
  for (let i = 0; i + frame <= wav.length; i += frame) { let s = 0; for (let j = 0; j < frame; j++) s += wav[i + j] ** 2; rms.push(Math.sqrt(s / frame)); }
  const top = Math.max(...rms);
  const thr = Math.max(0.004, top * 0.03);
  let a = rms.findIndex((r) => r > thr);
  let b = rms.length - 1 - [...rms].reverse().findIndex((r) => r > thr);
  if (a < 0) return wav;
  const start = Math.max(0, a * frame - Math.round(lead * sr));
  const end = Math.min(wav.length, (b + 1) * frame + Math.round(tail * sr));
  const y = Float32Array.from(wav.subarray(start, end));
  const fi = Math.round(0.008 * sr), fo = Math.round(0.04 * sr);
  for (let i = 0; i < fi && i < y.length; i++) y[i] *= i / fi;
  for (let i = 0; i < fo && i < y.length; i++) y[y.length - 1 - i] *= i / fo;
  // Loudness: RMS over frames that carry speech.
  const act = rms.slice(a, b + 1).filter((r) => r > thr);
  const cur = Math.sqrt(act.reduce((s, r) => s + r * r, 0) / (act.length || 1));
  let g = 10 ** (db / 20) / (cur || 1);
  let pk = 0; for (const v of y) pk = Math.max(pk, Math.abs(v));
  if (pk * g > peak) g = peak / pk;
  for (let i = 0; i < y.length; i++) y[i] *= g;
  return y;
}
