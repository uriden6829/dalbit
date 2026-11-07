// Tiny DOM helpers. All text goes through textContent; only our own SVG markup may use `trustedHTML`.

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'trustedHTML') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected') el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  add(el, kids);
  return el;
}
function add(el, kids) {
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

// Parses our own (trusted, static) SVG strings into an element.
export function svg(markup, cls) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  const el = t.content.firstElementChild;
  if (cls) el.classList.add(...cls.split(' '));
  return el;
}

export const $ = (sel, root = document) => root.querySelector(sel);

export function toast(msg, { ms = 2600, kind = '' } = {}) {
  let host = $('#toasts');
  if (!host) { host = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(host); }
  const t = h('div', { class: `toast ${kind}` }, msg);
  host.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
}

// Returns a promise resolving to the clicked action's value (or null when dismissed).
export function modal({ title, body, actions = [{ label: 'OK', value: true, primary: true }], wide = false }) {
  return new Promise((resolve) => {
    const close = (v) => { wrap.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    const wrap = h('div', { class: 'modal-wrap', onclick: (e) => { if (e.target === wrap) close(null); } },
      h('div', { class: `modal ${wide ? 'wide' : ''}`, role: 'dialog', 'aria-modal': 'true' },
        title ? h('h2', { class: 'modal-title' }, title) : null,
        h('div', { class: 'modal-body' }, body),
        h('div', { class: 'modal-actions' }, actions.map((a) =>
          h('button', { class: `btn ${a.primary ? 'primary' : a.danger ? 'danger' : 'ghost'}`, onclick: () => close(a.value) }, a.label)))));
    document.addEventListener('keydown', onKey);
    document.body.append(wrap);
    wrap.querySelector('.btn.primary, .btn')?.focus();
  });
}

export const confirmDialog = (text, { yes = 'Yes', no = 'Cancel', danger = false } = {}) =>
  modal({ body: h('p', null, text), actions: [{ label: no, value: false }, { label: yes, value: true, primary: !danger, danger }] });

export function download(blob, filename) {
  const a = h('a', { href: URL.createObjectURL(blob), download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
