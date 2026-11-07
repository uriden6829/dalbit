// Ask Jiji: questions, conversation practice, custom lessons and real-world reading — through her
// own API key (automatic) or her free Claude.ai account (copy & paste bridge).
import { h, toast, confirmDialog } from '../lib/dom.js';
import { getState, update, getApiKey, setApiKey } from '../lib/store.js';
import { askClaude, MODELS, DEFAULT_MODEL, testKey } from '../ai/claude.js';
import { chatSystem, packPrompt, webReadingPrompt, bridgePrompt, learnerTheta } from '../ai/prompts.js';
import { parseJSONLoose, validatePack, clean } from '../ai/safety.js';
import { registerPack, unregisterPack, chapters } from '../../content/index.js';
import { speak } from '../lib/speech.js';
import { jiji, jijiSays, iconEl } from './common.js';

export const title = () => 'Ask Jiji';

const TABS = [['ask', 'Ask'], ['talk', 'Talk'], ['lesson', 'New lesson'], ['web', 'Real Korean']];
const IDEAS = ['Ordering at a bakery', 'Dinner with my Korean in-laws', 'At the hair salon', 'Small talk with neighbours', 'Words from the K-drama I’m watching', 'Calling to book a table'];

export function render({ params }, { onLeave }) {
  const st = getState();
  let tab = params[0] || 'ask';
  const root = h('div', { class: 'stack' });
  let controller = null;
  onLeave(() => controller?.abort());

  function draw() {
    const mode = getState().ai.mode;
    root.replaceChildren(
      h('div', null, h('div', { class: 'eyebrow' }, '질문 · Ask Jiji'), h('h1', null, 'Jiji’s study corner')),
      mode === 'off' ? setup() : h('div', { class: 'stack' },
        h('div', { class: 'row' }, h('div', { class: 'seg' }, TABS.map(([k, l]) => h('button', { class: tab === k ? 'on' : '', onclick: () => { tab = k; draw(); } }, l))),
          h('span', { class: 'spacer' }), h('span', { class: 'small muted' }, mode === 'api' ? `Automatic · ${MODELS.find((m) => m.id === (getState().ai.model || DEFAULT_MODEL))?.label}` : 'Free Claude.ai · copy & paste'),
          h('a', { class: 'btn ghost small', href: '#/settings' }, 'Change')),
        tab === 'lesson' ? lessonTab(mode) : tab === 'web' ? webTab(mode) : chatTab(tab, mode)));
  }

  function setup() {
    const keyIn = h('input', { type: 'password', placeholder: 'sk-ant-…', autocomplete: 'off', value: getApiKey() });
    const model = h('select', null, MODELS.map((m) => h('option', { value: m.id, selected: (st.ai.model || DEFAULT_MODEL) === m.id }, `${m.label} — ${m.note}`)));
    const status = h('div', { class: 'small muted' });
    return h('div', { class: 'stack' },
      jijiSays('I can answer questions, chat with you in Korean, write new lessons and stories on any topic you ask for, and find real Korean to read. For that I borrow a little of Claude’s magic. Choose how:', { mood: 'think' }),
      h('div', { class: 'grid two' },
        h('div', { class: 'card stack' }, h('h3', null, 'Free: your Claude.ai account'),
          h('p', { class: 'small muted' }, 'Works with the free plan. I prepare the message, open Claude.ai, and for lessons you paste Claude’s answer back here. A few extra clicks, no cost.'),
          h('button', { class: 'btn primary', onclick: () => { update((s) => { s.ai.mode = 'bridge'; }); draw(); } }, 'Use Claude.ai')),
        h('div', { class: 'card stack' }, h('h3', null, 'Automatic: an API key'),
          h('p', { class: 'small muted' }, 'Everything happens right here. Needs a Claude API key from console.anthropic.com with a little prepaid credit (Claude.ai subscriptions don’t include API use). The key stays only in this browser and is never in backups.'),
          h('label', { class: 'field' }, h('span', null, 'API key'), keyIn),
          h('label', { class: 'field' }, h('span', null, 'Model'), model),
          h('button', { class: 'btn ghost', onclick: async () => {
            const k = keyIn.value.trim();
            if (!/^sk-ant-/.test(k)) { status.textContent = 'That doesn’t look like a Claude API key (they start with sk-ant-).'; return; }
            setApiKey(k); status.textContent = 'Testing…';
            try { await testKey(model.value); update((s) => { s.ai.mode = 'api'; s.ai.model = model.value; }); toast('Connected. 반가워요!'); draw(); }
            catch (e) { status.textContent = e.message; }
          } }, 'Save & test'), status)));
  }

  // ---- Chat (ask / talk) ----
  function chatTab(mode, aiMode) {
    const list = h('div', { class: 'chat' });
    const history = () => getState().chat.filter((m) => m.mode === mode);
    const drawList = () => {
      const msgs = history();
      list.replaceChildren(...(msgs.length ? msgs : [{ role: 'assistant', content: mode === 'talk' ? '안녕하세요! 오늘 뭐 했어요?\n(Hello! What did you do today?)' : 'Ask me anything about Korean — a word, a grammar point, how to say something, why a sentence sounds odd.' }])
        .map((m) => h('div', { class: `msg ${m.role === 'user' ? 'me' : m.error ? 'err' : 'jiji'}` }, m.content,
          m.role === 'assistant' && /[가-힣]/.test(m.content) ? h('div', null, h('button', { class: 'linkish small', onclick: () => speak(m.content.replace(/\([^)]*\)/g, '').replace(/[A-Za-z✎]+/g, ' ')) }, '▶ listen')) : null)));
      list.lastChild?.scrollIntoView({ block: 'end' });
    };
    const input = h('textarea', { placeholder: mode === 'talk' ? '한국어로 써 보세요… (or English if you’re stuck)' : 'Your question…', rows: 2 });
    const send = h('button', { class: 'btn primary', onclick: () => go() }, iconEl('send', 16), aiMode === 'api' ? 'Send' : 'Open in Claude');
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } });
    async function go() {
      const text = clean(input.value, 2000);
      if (!text) return;
      if (aiMode === 'bridge') { openBridge(bridgePrompt(mode, text)); input.value = ''; return; }
      input.value = ''; send.disabled = true;
      update((s) => { s.chat.push({ role: 'user', content: text, mode, at: Date.now() }); });
      drawList();
      list.append(h('div', { class: 'msg jiji muted' }, '…'));
      try {
        controller = new AbortController();
        const msgs = history().filter((m) => !m.error).slice(-16).map((m) => ({ role: m.role, content: m.content }));
        while (msgs.length && msgs[0].role !== 'user') msgs.shift();
        const r = await askClaude({ system: chatSystem(mode), messages: msgs, model: getState().ai.model || DEFAULT_MODEL, effort: 'low', maxTokens: 4000, signal: controller.signal });
        update((s) => { s.chat.push({ role: 'assistant', content: r.text, mode, at: Date.now() }); s.chat = s.chat.slice(-80); });
      } catch (e) {
        if (e.name === 'AbortError') return;
        update((s) => { s.chat.push({ role: 'assistant', content: e.message, mode, error: true, at: Date.now() }); });
      }
      send.disabled = false; drawList();
    }
    drawList();
    return h('div', { class: 'stack' },
      aiMode === 'bridge' ? h('p', { class: 'small muted' }, 'Free mode: I’ll open Claude.ai with your message and my tutoring notes already written in. (If the box is empty there, press Ctrl+V — it’s on your clipboard.)') : null,
      list, h('div', { class: 'composer' }, input, send),
      history().length ? h('button', { class: 'linkish small', onclick: async () => { if (await confirmDialog('Clear this conversation?')) { update((s) => { s.chat = s.chat.filter((m) => m.mode !== mode); }); draw(); } } }, 'Clear conversation') : null);
  }

  // ---- Make a lesson ----
  function lessonTab(aiMode) {
    const input = h('textarea', { placeholder: 'What would you like to learn? e.g. “Things to say when my mother-in-law cooks for me”', rows: 3 });
    const out = h('div', { class: 'stack' });
    return h('div', { class: 'stack' },
      jijiSays('Tell me a situation from your real life. I’ll write the words, phrases and a little story for it — then it appears in your Course under “Made for you”.', { mood: 'smug' }),
      h('div', { class: 'row' }, IDEAS.map((t) => h('button', { class: 'chip', onclick: () => { input.value = t; } }, t))),
      input,
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => generate(clean(input.value, 400), 'pack', out, aiMode) }, iconEl('wand', 16), aiMode === 'api' ? 'Make my lesson' : 'Prepare in Claude.ai')),
      out, packList());
  }

  function webTab(aiMode) {
    const input = h('input', { type: 'text', placeholder: 'Optional topic: autumn festivals, Jeju, a news story, a recipe…' });
    const out = h('div', { class: 'stack' });
    return h('div', { class: 'stack' },
      jijiSays('I’ll look at trusted Korean sites (news, tourism, encyclopedias), then write a fresh reading at your level about what I found. Anything I read out there is treated as information only — never as orders.', { mood: 'think' }),
      input,
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => generate(clean(input.value, 200), 'web', out, aiMode) }, iconEl('book', 16), aiMode === 'api' ? 'Find something to read' : 'Prepare in Claude.ai')),
      out, packList());
  }

  async function generate(request, kind, out, aiMode) {
    if (kind === 'pack' && !request) { toast('Write what you’d like to learn first.'); return; }
    const prompt = kind === 'pack' ? packPrompt(request) : webReadingPrompt(request);
    if (aiMode === 'bridge') {
      openBridge(prompt);
      const paste = h('textarea', { placeholder: 'Paste Claude’s whole answer here…', rows: 6 });
      out.replaceChildren(h('div', { class: 'card stack' },
        h('h3', null, 'Step 2: bring the answer back'),
        h('p', { class: 'small muted' }, 'When Claude has finished, copy its whole answer (the copy button under the reply) and paste it here. I’ll check it carefully before adding it.'),
        paste, h('button', { class: 'btn primary', onclick: () => save(paste.value, out) }, 'Add to my course')));
      return;
    }
    out.replaceChildren(h('div', { class: 'card row' }, jiji('think', 60), h('div', null, h('b', null, kind === 'web' ? 'Reading the news…' : 'Writing your lesson…'), h('div', { class: 'small muted' }, 'This takes about half a minute.'))));
    try {
      controller = new AbortController();
      const r = await askClaude({ system: 'You write Korean lessons as JSON exactly as asked.', messages: [{ role: 'user', content: prompt }], model: getState().ai.model || DEFAULT_MODEL, effort: 'medium', maxTokens: 16000, web: kind === 'web', signal: controller.signal });
      save(r.text, out);
    } catch (e) {
      if (e.name !== 'AbortError') out.replaceChildren(h('div', { class: 'msg err' }, e.message));
    }
  }

  function save(text, out) {
    try {
      const { pack, problems } = validatePack(parseJSONLoose(text), { level: learnerTheta() });
      update((s) => { s.packs[pack.id] = pack; });
      registerPack(pack);
      out.replaceChildren(h('div', { class: 'card stack' }, jiji('happy', 70), h('h3', null, `Added: ${pack.title.en}`),
        problems.length ? h('p', { class: 'small muted' }, `Note: ${problems.join('; ')}.`) : null,
        h('a', { class: 'btn primary', href: `#/chapter/${pack.id}` }, 'Open it')));
    } catch (e) {
      out.replaceChildren(h('div', { class: 'msg err' }, e.message));
    }
  }

  function packList() {
    const packs = Object.values(getState().packs).sort((a, b) => b.created - a.created);
    if (!packs.length) return null;
    return h('div', { class: 'stack' }, h('h3', null, 'Made for you'),
      ...packs.map((p) => h('div', { class: 'wordrow' }, h('a', { href: `#/chapter/${p.id}`, class: 'en' }, h('span', { class: 'ko' }, p.title.ko), ' · ', p.title.en),
        h('button', { class: 'btn ghost small', onclick: async () => {
          if (!(await confirmDialog(`Remove “${p.title.en}”? Words you learned from it stay in your spellbook until you restart the app.`, { yes: 'Remove', danger: true }))) return;
          update((s) => { delete s.packs[p.id]; });
          unregisterPack(p.id); draw();
        } }, 'Remove'))));
  }

  draw();
  return root;
}

// Opens Claude.ai in a new tab with the prompt filled in (and on the clipboard as a fallback).
export async function openBridge(prompt) {
  try { await navigator.clipboard.writeText(prompt); } catch { /* clipboard may be blocked */ }
  const url = `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
  window.open(url.length < 14000 ? url : 'https://claude.ai/new', '_blank', 'noopener');
  toast('Opened Claude.ai — the message is also on your clipboard');
}

export { chapters };
