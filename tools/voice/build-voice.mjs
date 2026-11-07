// Renders the studio voice clips in app/voice/ (Supertonic 3 → trim/level → Ogg Opus) and writes the manifest
// app/voice/index.json that speech.js reads. Only new or changed lines are rendered; clips no line uses are deleted.
//
//   cd tools/voice && npm install        (once: onnxruntime-node + transformers.js — the only npm deps in the repo)
//   node tools/voice/build-voice.mjs [--check] [--limit N]
//     --check   transcribe every new clip with Whisper and retake (new seed) any clip it can't read back
//
// The model (≈400 MB) downloads once into tools/voice/.models/ (git-ignored). Needs Edge or Chrome for Opus.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCorpus } from './corpus.mjs';
import { loadTTS, hashStr } from './supertonic.mjs';
import { post } from './post.mjs';
import { resample, transcribe, cer } from './measure.mjs';
import { openEncoder } from './opus.mjs';
import { readable } from './korean-numbers.mjs';
import { phrases } from './phrases.mjs';
import { pronounce } from '../../app/js/lib/hangul.js';
import { VOICES, SLOW, STUDIO_VERSION, clipName } from '../../app/js/lib/voicecast.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '../../app');
const OUT = path.join(APP, 'voice');
const CLIPS = path.join(OUT, 'clips');
const MODEL = path.join(HERE, '.models', 'supertonic-3');
const MODEL_URL = 'https://huggingface.co/Supertone/supertonic-3/resolve/3cadd1ee6394adea1bd021217a0e650ede09a323';
const MODEL_FILES = ['onnx/tts.json', 'onnx/unicode_indexer.json', 'onnx/duration_predictor.onnx', 'onnx/text_encoder.onnx', 'onnx/vector_estimator.onnx', 'onnx/vocoder.onnx', 'LICENSE',
  ...Object.keys(VOICES).map((v) => `voice_styles/${v}.json`)];

// Engine settings chosen in the build iterations (task-69 NOTES.md). Changing any of them: bump STUDIO_VERSION.
const STEPS = 8; // denoising steps: 16 measured no clearer than 8
const BITRATE = 32000;
const MAX_CHARS = 120; // Supertonic reads Korean best in pieces up to ~120 characters
const SLOW_PHRASE = 7; // slow clips: phrases of about this many syllables
const SLOW_GAP = 0.4, SLOW_GAP_END = 0.6; // seconds of pause between phrases / after a sentence
const RETAKES = 3; // --check: up to this many takes (new seed) while Whisper can't read the clip back
const RETAKE_CER = 0.1; // pronunciation error rate that triggers a retake
const BAD_CER = 0.25; // reported as unclear

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
// --shard 0/2 and --shard 1/2 in two terminals render half each (TTS on CPU and Whisper on GPU overlap).
// --ep dml renders on the GPU (DirectML; inputs padded to fixed sizes so it can reuse compiled shapes).
const EP = args.includes('--ep') ? args[args.indexOf('--ep') + 1] : 'cpu';
const [SHARD, SHARDS] = args.includes('--shard') ? args[args.indexOf('--shard') + 1].split('/').map(Number) : [0, 1];

async function ensureModel() {
  for (const f of MODEL_FILES) {
    const p = path.join(MODEL, f);
    if (fs.existsSync(p)) continue;
    fs.mkdirSync(path.dirname(p), { recursive: true });
    console.log('downloading', f);
    const r = await fetch(`${MODEL_URL}/${f}`);
    if (!r.ok) throw new Error(`model download failed: ${f} ${r.status}`);
    fs.writeFileSync(`${p}.part`, Buffer.from(await r.arrayBuffer()));
    fs.renameSync(`${p}.part`, p);
  }
}

const pieces = (t) => {
  if (t.length <= MAX_CHARS) return [t];
  const out = [];
  for (const s of t.split(/(?<=[.!?。…])\s+/)) {
    if (out.length && (out.at(-1) + ' ' + s).length <= MAX_CHARS) out[out.length - 1] += ' ' + s; else out.push(s);
  }
  return out;
};

const join = (parts) => {
  const out = new Float32Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};
const silence = (sr, s) => new Float32Array(Math.round(sr * s));

// Normal: whole sentences (best phrasing). Slow: the way a teacher speaks slowly — short phrases, each a little
// slower, with pauses between them. (Slowing a whole sentence makes this model repeat or drop words: Build 3.)
async function render(tts, { text, voice, slow }, seed) {
  const parts = [];
  if (!slow) {
    for (const [k, p] of pieces(readable(text)).entries()) {
      if (k) parts.push(silence(tts.sr, 0.3));
      parts.push(post((await tts.synth(p, { voice, steps: STEPS, speed: VOICES[voice].speed, seed, bucket: EP !== 'cpu' })).wav, tts.sr));
    }
    return parts.length === 1 ? parts[0] : join(parts);
  }
  const ph = phrases(readable(text), SLOW_PHRASE);
  for (const [k, p] of ph.entries()) {
    const q = await tts.synth(p.text, { voice, steps: STEPS, speed: VOICES[voice].speed * SLOW, seed: seed + k, bucket: EP !== 'cpu' });
    // Each phrase levelled on its own; the clip keeps the same edge padding as normal clips (60 ms / 140 ms).
    parts.push(post(q.wav, tts.sr, { lead: k ? 0.03 : 0.06, tail: k < ph.length - 1 ? 0.06 : 0.14 }));
    if (k < ph.length - 1) parts.push(silence(tts.sr, p.end ? SLOW_GAP_END : SLOW_GAP));
  }
  return join(parts);
}

await ensureModel();
const reqs = buildCorpus();
fs.mkdirSync(CLIPS, { recursive: true });
// --retry-unclear: re-roll only the clips the last --check reported unclear, with more seeds; a new take
// replaces the old clip only if Whisper reads it better.
const RETRY = args.includes('--retry-unclear');
const reportFiles = () => fs.readdirSync(path.join(HERE, '.models')).filter((f) => /^check-report-\d+\.json$/.test(f)).map((f) => path.join(HERE, '.models', f));
const unclear = RETRY ? reportFiles().flatMap((f) => JSON.parse(fs.readFileSync(f, 'utf8'))).filter((x) => x.cer > BAD_CER) : [];
const isUnclear = (r) => unclear.some((u) => u.text === r.text && u.voice === r.voice && u.slow === r.slow);
const todo = RETRY ? reqs.filter(isUnclear)
  : reqs.filter((r) => !fs.existsSync(path.join(CLIPS, `${clipName(r.voice, r.slow, r.text)}.ogg`))).filter((r, i) => i % SHARDS === SHARD).slice(0, LIMIT);
console.log(`${reqs.length} clips in the course, ${todo.length} to ${RETRY ? 're-roll' : 'render'}`);

// Lower of spelling and pronunciation error: 갇/갓 are both [갇] (pronunciation says equal), while 마법 학교 /
// 마법학교 only differ by a space (spelling says equal; pronunciation rules treat the space differently).
const score = (text, hyp) => Math.min(cer(readable(text), readable(hyp)), cer(pronounce(readable(text)), pronounce(readable(hyp))));

if (todo.length) {
  const tts = await loadTTS(MODEL, { ep: EP, threads: EP === 'cpu' ? 6 : 0 });
  const enc = await openEncoder();
  const report = [];
  const t0 = Date.now();
  try {
    for (const [i, r] of todo.entries()) {
      let best = null;
      // Worth checking: 2+ syllables (Whisper can't judge lone syllables) and not a normal-speed long line
      // (those measured ~1 % CER for every voice).
      const syl = (r.text.match(/[가-힣]/g) || []).length;
      const check = (CHECK || RETRY) && syl >= 2 && (r.slow || syl <= 12);
      const takes = RETRY ? [3, 4, 5, 6, 7, 8] : check ? [0, 1, 2].slice(0, RETAKES) : [0];
      for (const take of takes) {
        const wav = await render(tts, r, hashStr(r.text) + take * 7919);
        const s = check ? score(r.text, await transcribe(wav, tts.sr)) : 0;
        if (!best || s < best.score) best = { wav, score: s, take };
        if (s <= RETAKE_CER) break;
      }
      const file = path.join(CLIPS, `${clipName(r.voice, r.slow, r.text)}.ogg`);
      if (RETRY && fs.existsSync(file)) {
        const { decode } = enc;
        const old = await decode(fs.readFileSync(file));
        const was = score(r.text, await transcribe(old.wav, old.sr));
        if (was <= best.score) { report.push({ ...r, cer: +was.toFixed(3), take: 'kept' }); continue; }
      }
      fs.writeFileSync(file, await enc.encode(resample(best.wav, tts.sr, 48000), { bitrate: BITRATE }));
      if (check) report.push({ ...r, cer: +best.score.toFixed(3), take: best.take });
      if (i % 50 === 49) console.log(`${i + 1}/${todo.length}  ${((Date.now() - t0) / (i + 1)).toFixed(0)} ms/clip`);
    }
  } finally {
    await enc.close();
  }
  if (CHECK || RETRY) {
    const bad = report.filter((x) => x.cer > BAD_CER);
    fs.writeFileSync(path.join(HERE, '.models', RETRY ? 'retry-report.json' : `check-report-${SHARD}.json`), JSON.stringify(report, null, 1));
    console.log(`check: ${report.length} clips, ${bad.length} still unclear`, bad.slice(0, 40).map((b) => `${b.voice}${b.slow ? 's' : ''} ${b.text} (${b.cer})`));
  }
}

// Manifest: text -> voices that have a clip ("F1 F1s M2": s = slow). Delete clips nothing points to.
const lines = {};
const keep = new Set();
for (const r of reqs) {
  const name = clipName(r.voice, r.slow, r.text);
  if (!fs.existsSync(path.join(CLIPS, `${name}.ogg`))) continue;
  keep.add(`${name}.ogg`);
  (lines[r.text] ||= []).push(r.voice + (r.slow ? 's' : ''));
}
let removed = 0;
for (const f of fs.readdirSync(CLIPS)) if (!keep.has(f)) { fs.unlinkSync(path.join(CLIPS, f)); removed++; }
const manifest = { v: STUDIO_VERSION, engine: 'Supertonic 3 (Supertone, OpenRAIL-M)', lines: Object.fromEntries(Object.entries(lines).map(([t, v]) => [t, v.join(' ')])) };
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(manifest) + '\n');
const bytes = [...keep].reduce((s, f) => s + fs.statSync(path.join(CLIPS, f)).size, 0);
console.log(`manifest: ${Object.keys(lines).length} lines, ${keep.size} clips, ${(bytes / 1048576).toFixed(1)} MB, removed ${removed} old clips`);
