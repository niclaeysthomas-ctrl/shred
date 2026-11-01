/* SHRED v2 — petits outils d'interface partagés */
import { state } from './store.js';
import { LATIN, ivDisplay } from './theory.js';
import { GLOSSARY } from './content/glossary.js';

export function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (typeof attrs === 'string') e.className = attrs;
  else if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}

export const $ = (sel, root = document) => root.querySelector(sel);

/* Nom de note selon le réglage (A ou La) */
export function N(name) {
  if (!name) return '';
  if (state().settings.notes !== 'latin') return name;
  return (LATIN[name[0]] || name[0]) + name.slice(1);
}
export const IV = ivDisplay;

/* Texte de cours : [[terme]] → mot cliquable du glossaire ; {{A}} → note formatée */
export function rich(text) {
  return String(text)
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, k, label) => {
      const key = k.trim().toLowerCase();
      return GLOSSARY[key] ? `<button class="term" data-term="${key}">${label || k}</button>` : (label || k);
    })
    .replace(/\{\{([A-G][♯♭𝄪𝄫]*)\}\}/g, (_, n) => `<b class="nt">${N(n)}</b>`);
}

export function toast(msg, kind = '') {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast show ' + kind;
  clearTimeout(t._h); t._h = setTimeout(() => t.className = 'toast', 2600);
}

/* Fenêtre modale (cours, quiz, séances) */
let modalStack = [];
export function openModal(title, build, { wide = false, onClose } = {}) {
  const back = el('div', 'modal-back');
  const box = el('div', 'modal' + (wide ? ' wide' : ''));
  const head = el('div', 'modal-head', el('h2', null, title));
  const close = el('button', { class: 'icon-btn', 'aria-label': 'Fermer', onclick: () => closeModal() }, '✕');
  head.append(close);
  const body = el('div', 'modal-body');
  box.append(head, body); back.append(box);
  back.addEventListener('click', e => { if (e.target === back) closeModal(); });
  document.body.append(back);
  document.body.classList.add('noscroll');
  const entry = { back, onClose };
  modalStack.push(entry);
  try { build(body, entry); } catch (e) { console.error(e); body.append(el('p', 'err', 'Erreur : ' + e.message)); }
  requestAnimationFrame(() => back.classList.add('in'));
  return entry;
}
export function closeModal() {
  const m = modalStack.pop();
  if (!m) return;
  try { m.onClose && m.onClose(); } catch (e) { console.error(e); }
  m.back.remove();
  if (!modalStack.length) document.body.classList.remove('noscroll');
}
window.addEventListener('keydown', e => { if (e.key === 'Escape' && modalStack.length) closeModal(); });

/* Bulle de définition */
document.addEventListener('click', e => {
  const t = e.target.closest('.term');
  document.querySelectorAll('.term-pop').forEach(p => p.remove());
  if (!t) return;
  e.preventDefault();
  const [title, def] = GLOSSARY[t.dataset.term] || [];
  if (!title) return;
  const pop = el('div', 'term-pop', el('b', null, title), el('p', null, def));
  document.body.append(pop);
  const r = t.getBoundingClientRect();
  const w = Math.min(320, window.innerWidth - 24);
  pop.style.width = w + 'px';
  pop.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left)) + 'px';
  const below = r.bottom + 8 + pop.offsetHeight < window.innerHeight;
  pop.style.top = (below ? r.bottom + 8 : r.top - pop.offsetHeight - 8) + window.scrollY + 'px';
});

/* Sélecteur « pastilles » */
export function seg(options, value, onChange, cls = '') {
  const wrap = el('div', 'seg ' + cls);
  const draw = v => wrap.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
  options.forEach(([v, label]) => wrap.append(el('button', { 'data-v': String(v), onclick: () => { draw(v); onChange(v); } }, label)));
  draw(value);
  wrap.set = draw;
  return wrap;
}

export function select(options, value, onChange, label) {
  const s = el('select', { 'aria-label': label || '' });
  options.forEach(([v, l]) => s.append(el('option', { value: v }, l)));
  s.value = value;
  s.addEventListener('change', () => onChange(s.value));
  const wrap = el('label', 'field', label ? el('span', null, label) : null, s);
  wrap.select = s;
  return wrap;
}

export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const fmtMin = m => m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0');
export function fmtDate(d) { if (!d) return ''; const [y, m, j] = d.split('-'); return `${+j} ${['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][+m - 1]}`; }
