// Split a line into speakable phrases for slow reading: at punctuation first, then into groups of words
// of about maxSyl syllables. Non-final phrases end with a comma so the voice keeps a rising/continuing tone.
const syl = (s) => (s.match(/[가-힣]/g) || []).length;
export function phrases(text, maxSyl = 8) {
  const out = [];
  for (const clause of text.split(/(?<=[,.!?…:])\s+/).filter(Boolean)) {
    const words = clause.split(/\s+/).filter(Boolean);
    const groups = [];
    let cur = [];
    // Never start a phrase with a bound noun or auxiliary (할 | 수 있어요, 하는 | 것이, 먹고 | 싶어요).
    const BOUND = /^(수|것|거|때|줄|데|적|뿐|만큼|대로|듯|중|있|없|싶|주|보|하|되|않|못)/;
    words.forEach((w, i) => {
      cur.push(w);
      const next = words[i + 1];
      if (syl(cur.join('')) >= maxSyl && next && !BOUND.test(next)) { groups.push(cur); cur = []; }
    });
    if (cur.length) { if (groups.length && syl(cur.join('')) <= 2) groups[groups.length - 1].push(...cur); else groups.push(cur); }
    groups.forEach((g, i) => {
      const last = i === groups.length - 1;
      let t = g.join(' ');
      const end = last && /[.!?…]$/.test(t);
      if (!last && !/[,.!?…:]$/.test(t)) t += ',';
      out.push({ text: t, end });
    });
  }
  return out;
}
