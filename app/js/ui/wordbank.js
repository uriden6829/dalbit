// Word bank: the words she saved herself, with meanings, the sentence she found them in, and flashcards.
import { h, toast, confirmDialog } from '../lib/dom.js';
import { bankList, removeFromBank, editBank, dueCards, gradeCard } from '../lib/wordbank.js';
import { on } from '../lib/bus.js';
import { speakBtn, slowBtn, jijiSays, iconEl } from './common.js';
import { speak } from '../lib/speech.js';
import { shuffle } from '../lib/rand.js';

export const title = () => 'Word bank';

export function render({ params }, { onLeave }) {
  const root = h('div', { class: 'stack' });
  let filter = '';
  const off = on('bank', () => { if (params[0] !== 'cards') list(); });
  onLeave(off);

  function header() {
    return h('div', null, h('div', { class: 'eyebrow' }, '내 단어 · Word bank'), h('h1', null, 'Your word bank'));
  }
  function howTo() {
    return h('div', { class: 'card wb-how' },
      h('div', { class: 'row', style: { gap: '18px', alignItems: 'flex-start' } },
        h('div', null, h('b', null, 'Ctrl + click'), h('div', { class: 'small muted' }, 'any Korean word, anywhere in the app')),
        h('div', null, h('b', null, '＋ on Jiji’s corner'), h('div', { class: 'small muted' }, 'turns on the word picker: every click saves a word')),
        h('div', null, h('b', null, 'Hold Shift'), h('div', { class: 'small muted' }, 'to see what a word means before you save it'))));
  }

  function list() {
    const all = bankList();
    const due = dueCards().length;
    const q = filter.trim().toLowerCase();
    const shown = q ? all.filter((w) => w.ko.includes(q) || (w.en || '').toLowerCase().includes(q) || (w.surface || '').includes(q)) : all;
    root.replaceChildren(header(), howTo(),
      all.length ? h('div', { class: 'row', style: { justifyContent: 'space-between' } },
        h('input', { type: 'search', placeholder: 'Search your words…', value: filter, style: { flex: '1', minWidth: '180px' }, oninput: (e) => { filter = e.target.value; list(); setTimeout(() => root.querySelector('input[type=search]')?.focus(), 0); } }),
        h('a', { class: `btn ${due ? 'primary' : 'ghost'}`, href: '#/wordbank/cards' }, iconEl('refresh', 16), due ? `Practise ${due} card${due > 1 ? 's' : ''}` : 'Practise all')) : null,
      all.length ? h('div', { class: 'small muted' }, `${all.length} word${all.length > 1 ? 's' : ''} saved`) : jijiSays('Your word bank is empty. Ctrl+click any Korean word you want to keep — in a lesson, a story, anywhere — and it lands here with its meaning and the sentence you found it in.', { mood: 'smug' }),
      h('div', { class: 'wb-list' }, shown.map(card)));
  }

  function card(w) {
    const en = h('input', { class: 'wb-en-in', value: w.en || '', placeholder: 'Add a meaning…', onchange: (e) => { editBank(w.ko, { en: e.target.value.trim() }); toast('Saved'); } });
    return h('div', { class: 'card wb-card' },
      h('div', { class: 'row', style: { gap: '10px', alignItems: 'center' } },
        h('span', { class: 'ko wb-ko', 'data-ko': w.ko }, w.ko), speakBtn(w.ko), slowBtn(w.ko), h('span', { class: 'spacer', style: { flex: 1 } }),
        h('span', { class: 'small muted', title: 'Flashcard box' }, '●'.repeat((w.box || 0) + 1)),
        h('button', { class: 'btn ghost small icon-only', title: 'Remove', 'aria-label': `Remove ${w.ko}`, onclick: async () => { if (await confirmDialog(`Remove ${w.ko} from your word bank?`, { yes: 'Remove' })) removeFromBank(w.ko); } }, iconEl('x', 14))),
      en,
      w.surface && w.surface !== w.ko ? h('div', { class: 'small muted' }, 'Seen as ', h('span', { class: 'ko' }, w.surface), w.parts?.length ? ` (${w.parts.join(' + ')})` : '') : null,
      w.ctx && w.ctx !== w.ko && w.ctx !== w.surface ? h('div', { class: 'wb-ctx', 'data-ko': w.ctx, 'data-en': w.ctxEn || null },
        h('span', { class: 'ko' }, w.ctx), ' ', h('button', { class: 'linkish small', onclick: () => speak(w.ctx) }, 'hear'), w.ctxEn ? h('div', { class: 'small muted' }, w.ctxEn) : null) : null);
  }

  function cards() {
    const deck = shuffle(dueCards().length ? dueCards() : bankList().slice());
    let i = 0, right = 0;
    if (!deck.length) { location.hash = '#/wordbank'; return; }
    const stage = h('div', { class: 'stack' });
    root.replaceChildren(header(), stage);
    function show() {
      if (i >= deck.length) {
        stage.replaceChildren(jijiSays(`${right} of ${deck.length} remembered. The others come back first next time.`, { mood: 'happy' }),
          h('div', { class: 'row' }, h('a', { class: 'btn primary', href: '#/wordbank' }, 'Back to the word bank')));
        return;
      }
      const w = deck[i];
      const back = h('div', { class: 'stack hidden center' },
        h('div', { class: 'en-big' }, w.en || '(no meaning saved)'),
        w.ctx && w.ctx !== w.ko ? h('div', { class: 'ko small' }, w.ctx) : null,
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('button', { class: 'btn ghost', onclick: () => grade(false) }, 'Didn’t know'),
          h('button', { class: 'btn primary', onclick: () => grade(true) }, 'Knew it')));
      const flip = h('button', { class: 'btn primary', onclick: () => { back.classList.remove('hidden'); flip.remove(); } }, 'Show meaning');
      stage.replaceChildren(h('div', { class: 'small muted center' }, `${i + 1} / ${deck.length}`),
        h('div', { class: 'card intro-card stack center' }, h('div', { class: 'big-ko ko' }, w.ko),
          h('div', { class: 'row', style: { justifyContent: 'center' } }, speakBtn(w.ko, { big: true }), slowBtn(w.ko)), flip, back));
      speak(w.ko);
    }
    function grade(knew) { gradeCard(deck[i].ko, knew); if (knew) right++; i++; show(); }
    show();
  }

  if (params[0] === 'cards') cards(); else list();
  return root;
}
