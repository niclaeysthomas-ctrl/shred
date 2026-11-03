/* SHRED v2 — routeur (adresses en #/… pour pouvoir lier les modules entre eux) */
import { el, toast, closeModal } from './ui.js';
import * as home from './views/home.js';
import * as path from './views/path.js';
import * as labo from './views/labo.js';
import * as impro from './views/impro.js';
import * as session from './views/session.js';
import * as progress from './views/progress.js';
import * as technique from './views/technique.js';
import * as compo from './views/compo.js';
import './quiz2.js';

const plus = { render(main) {
  main.append(el('div', 'page-head', el('div', null, el('div', 'eyebrow', 'Plus'), el('h1', null, 'Tous les outils'))));
  [['#/seance', '⏱', 'Séance du jour', '15, 20 ou 30 minutes guidées'], ['#/technique', '✋', 'Technique Lab', 'Gammes NPS, médiator, legato, bends mesurés au micro'], ['#/compo', '✎', 'Composition Studio', 'Tes morceaux, grilles analysées, idées audio'], ['#/labo/gammes', '◎', 'Gammes & modes', 'Explorer et comparer'], ['#/labo/accords', '▦', 'Chord Lab', 'Accords, doigtés, harmonisation'],
   ['#/progres', '▲', 'Progrès', 'Ce que tu sais vraiment faire, réglages, sauvegarde'], ['classic.html#jukebox', '🎧', 'Juke-box', 'Des vrais morceaux, la grille en boucle, la note à viser'], ['classic.html#repertoire', '🎼', 'Répertoire de solos', '15 solos gradués, étape par étape'], ['classic.html', '↺', 'Shred classique', 'L’ancienne app complète']]
    .forEach(([h, i, t, d]) => main.append(el('a', { class: 'card-link', href: h, style: { marginBottom: '8px' } }, el('span', 'ic', i), el('div', null, el('b', null, t), el('small', null, d)), el('span', 'chev', '›'))));
} };

const ROUTES = { '': home, 'parcours': path, 'labo': labo, 'impro': impro, 'seance': session, 'progres': progress, 'technique': technique, 'oreille': { render(main) { location.replace('#/technique'); } }, 'compo': compo, 'plus': plus };
let current = null;

function parse() {
  const h = location.hash.replace(/^#\/?/, '');
  const [p, q = ''] = h.split('?');
  const parts = p.split('/').filter(Boolean);
  return { parts, params: Object.fromEntries(new URLSearchParams(q)) };
}

function render() {
  const { parts, params } = parse();
  const view = ROUTES[parts[0] || ''] || home;
  const main = document.getElementById('main');
  try { current && current.leave && current.leave(); } catch (e) { console.error(e); }
  document.querySelectorAll('.modal-back').forEach(() => closeModal());
  main.innerHTML = '';
  current = view;
  try { view.render(main, params, parts.slice(1)); }
  catch (e) {
    console.error(e);
    main.append(el('div', 'panel', el('h3', null, 'Cet écran a rencontré une erreur'), el('p', 'err', e.message), el('a', { class: 'btn ghost', href: '#/' }, 'Retour à l’accueil')));
  }
  const key = parts.length ? parts.slice(0, 2).join('/') : 'home';
  document.querySelectorAll('[data-r]').forEach(a => {
    const r = a.dataset.r;
    a.classList.toggle('on', r === key || (r === 'labo' && parts[0] === 'labo') || (r === 'plus' && ['plus', 'technique', 'oreille', 'compo', 'progres', 'seance'].includes(parts[0])) || (r === 'home' && !parts.length));
  });
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
window.addEventListener('shred:error', e => toast(e.detail, 'bad'));
window.addEventListener('error', e => { console.error(e.error || e.message); });
window.addEventListener('unhandledrejection', e => { console.error(e.reason); toast('Erreur : ' + (e.reason && e.reason.message || e.reason), 'bad'); });
render();

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
