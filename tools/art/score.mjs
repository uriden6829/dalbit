// Automatic critics for code-drawn art. Relative signals (compare A vs B of the same subject), not absolute grades:
//   aes    LAION "improved aesthetic predictor" (sac+logos+ava1-l14-linearMSE: linear MLP on CLIP ViT-L/14 image
//          embeddings), roughly 1-10. The metric IntroSVG (CVPR 2026) reports for text-to-SVG.
//   clipT  CLIPScore: cosine(image, text) for the intended description — does it read as what it should be?
//   iqa    CLIP-IQA style: P(positive prompt) over antonym pairs, averaged (0-1). Noisy; least weight.
//   embed  normalised image embedding (same character looks alike across shots; different characters differ).
// Checked in task 70: every deliberate damage (jitter, no line art, no shading) lowers aes and clipT.
// Downloads once into tools/art/.models/ (git-ignored): Xenova/clip-vit-large-patch14 (ONNX) + the 3.7 MB head.
import { AutoProcessor, AutoTokenizer, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage, env } from '@huggingface/transformers';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const here = import.meta.dirname;
env.cacheDir = join(here, '.models');
const MODEL = 'Xenova/clip-vit-large-patch14';
const HEAD_URL = 'https://raw.githubusercontent.com/christophschuhmann/improved-aesthetic-predictor/main/sac+logos+ava1-l14-linearMSE.pth';
const HEAD_FILE = join(here, '.models', 'aesthetic', 'sac+logos+ava1-l14-linearMSE.pth');

export const IQA_PAIRS = [
  ['a beautiful illustration', 'an ugly illustration'],
  ['professional artwork', 'amateur artwork'],
  ['charming, appealing character art', 'stiff, awkward character art'],
  ['a well-drawn picture', 'a badly drawn picture'],
];

// The .pth is a zip of raw float32 tensors (stored, not compressed): read entries from the central directory.
// Order checked against archive/data.pkl: data/0..9 = layers.0/2/4/6/7 weight, bias ([out, in] row-major).
async function loadHead() {
  if (!existsSync(HEAD_FILE)) {
    mkdirSync(join(here, '.models', 'aesthetic'), { recursive: true });
    const res = await fetch(HEAD_URL);
    if (!res.ok) throw new Error(`aesthetic head download failed: ${res.status}`);
    writeFileSync(HEAD_FILE, Buffer.from(await res.arrayBuffer()));
  }
  const b = readFileSync(HEAD_FILE);
  const eocd = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const files = new Map();
  for (let p = b.readUInt32LE(eocd + 16), n = b.readUInt16LE(eocd + 10); n > 0; n--) {
    const size = b.readUInt32LE(p + 20), nl = b.readUInt16LE(p + 28), name = b.toString('utf8', p + 46, p + 46 + nl), off = b.readUInt32LE(p + 42);
    if (b.readUInt16LE(p + 10) !== 0) throw new Error('compressed entry in aesthetic head');
    const start = off + 30 + b.readUInt16LE(off + 26) + b.readUInt16LE(off + 28);
    files.set(name.replace(/^[^/]+\//, ''), b.subarray(start, start + size));
    p += 46 + nl + b.readUInt16LE(p + 30) + b.readUInt16LE(p + 32);
  }
  const f = (i) => { const s = Buffer.from(files.get(`data/${i}`)); return new Float32Array(s.buffer, s.byteOffset, s.length / 4); };
  return [[768, 1024], [1024, 128], [128, 64], [64, 16], [16, 1]].map(([inp, out], k) => ({ inp, out, w: f(k * 2), b: f(k * 2 + 1) }));
}
function runHead(layers, x) {
  let v = x;
  for (const { inp, out, w, b } of layers) {
    const y = new Float32Array(out);
    for (let o = 0; o < out; o++) { let s = b[o]; const row = o * inp; for (let i = 0; i < inp; i++) s += w[row + i] * v[i]; y[o] = s; }
    v = y;
  }
  return v[0];
}
const norm = (a) => { let s = 0; for (const x of a) s += x * x; s = Math.sqrt(s) || 1; return Float32Array.from(a, (x) => x / s); };
export const cos = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

export async function openScorer({ device = 'cpu' } = {}) {
  const [processor, tokenizer, vision, text, head] = await Promise.all([
    AutoProcessor.from_pretrained(MODEL),
    AutoTokenizer.from_pretrained(MODEL),
    CLIPVisionModelWithProjection.from_pretrained(MODEL, { dtype: 'fp32', device }),
    CLIPTextModelWithProjection.from_pretrained(MODEL, { dtype: 'fp32', device }),
    loadHead(),
  ]);
  const textCache = new Map();
  async function textEmb(s) {
    if (!textCache.has(s)) { const { text_embeds } = await text(tokenizer([s], { padding: true, truncation: true })); textCache.set(s, norm(text_embeds.data)); }
    return textCache.get(s);
  }
  async function imageEmb(png) {
    const img = await RawImage.fromBlob(new Blob([png]));
    const { image_embeds } = await vision(await processor(img.rgb()));
    return norm(image_embeds.data);
  }
  return {
    imageEmb, textEmb,
    async score(png, { prompt } = {}) {
      const e = await imageEmb(png);
      let iqa = 0;
      for (const [p, n] of IQA_PAIRS) iqa += 1 / (1 + Math.exp((cos(e, await textEmb(n)) - cos(e, await textEmb(p))) * 100));
      return { aes: runHead(head, e), iqa: iqa / IQA_PAIRS.length, clipT: prompt ? cos(e, await textEmb(prompt)) : null, embed: e };
    },
  };
}
