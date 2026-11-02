/* AUJOURD'HUI — savoir en 5 secondes quoi travailler */
import { el, N, rich, openModal, closeModal, toast, fmtMin, fmtDate } from '../ui.js';
import { state, update, weekMinutes, lastDays, streak, minutesOn, today, addPractice, isValidated } from '../store.js';
import { MODULES, READY_NOTIONS, notionById } from '../content/lessons.js';
import { currentModule, moduleProgress, nextNotion, openLesson } from './path.js';
import { buildPlan, noPickToggle } from './session.js';
import { skillMeters } from './progress.js';

const ICON = { tech: '✋', theory: '◈', impro: '♫', rep: '🎵', review: '↻', ear: '◍' };

export function render(main) {
  const S = state();
  const okN = READY_NOTIONS.filter(n => isValidated(n.id)).length;
  const cur = currentModule(), pr = moduleProgress(cur), nxt = nextNotion();
  const levelName = okN < 6 ? 'Intermédiaire — consolidation des bases' : okN < 13 ? 'Intermédiaire — harmonie' : okN < 21 ? 'Intermédiaire avancé — modes' : 'Avancé — improvisation et création';
  const hour = new Date().getHours();

  main.append(el('div', 'page-head',
    el('div', null, el('div', 'eyebrow', new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })),
      el('h1', null, hour < 12 ? 'Bonjour.' : hour < 18 ? 'Bon après-midi.' : 'Bonsoir.'),
      el('p', null, `${levelName} · ${okN}/${READY_NOTIONS.length} notions validées par quiz.`))));

  const g = el('div', 'grid2');

  // séance du jour
  const plan = S.sessions[today()] || buildPlan(S.settings.sessionLen || 20);
  const sess = el('div', 'panel hl');
  const done = plan.done ? plan.done.length : 0;
  sess.append(el('div', 'panel-title', el('h3', null, 'Ta séance du jour'), el('span', 'tag acc', `${plan.len} min · ${done}/${plan.blocks.length}`)));
  plan.blocks.forEach(b => sess.append(el('div', { class: 'block' + ((plan.done || []).includes(b.id) ? ' done' : ''), style: { marginBottom: '6px', padding: '9px 12px' } },
    el('span', 'bi', ICON[b.type]), el('div', null, el('b', 'bt', b.title), el('small', null, b.detail)), el('span', 'bm', b.min + ' min'))));
  sess.append(el('div', 'row', el('a', { class: 'btn', href: '#/seance' }, done ? 'Continuer la séance' : '▶ Commencer'),
    el('button', { class: 'btn ghost', onclick: freeTimer }, '⏱ Séance libre'),
    el('a', { class: 'btn ghost', href: '#/impro?ex=free' }, '♫ Jammer'), noPickToggle()));
  g.append(sess);

  // module en cours
  const mod = el('div', 'panel');
  mod.append(el('div', 'eyebrow', `Module ${cur.n} · ${cur.when}`), el('h3', null, cur.title), el('p', 'lead', cur.goal),
    el('div', 'progress', el('i', { style: { width: (pr.pct * 100) + '%' } })), el('p', 'mono hint', `${pr.ok}/${pr.total} notions validées`));
  if (nxt) mod.append(el('div', { class: 'card-link', style: { marginTop: '10px', cursor: 'pointer' }, onclick: () => openLesson(nxt.notion.id) },
    el('span', 'ic', '◈'), el('div', null, el('b', null, 'Prochaine notion : ' + nxt.notion.title), el('small', null, nxt.notion.short)), el('span', 'chev', '›')));
  mod.append(el('a', { class: 'btn ghost sm', href: '#/parcours', style: { marginTop: '10px' } }, 'Tout le parcours'));
  g.append(mod);
  main.append(g);

  const g2 = el('div', 'grid2');
  // temps de pratique
  const tp = el('div', 'panel');
  const w = weekMinutes(), wp = weekMinutes(1), days = lastDays(14);
  const max = Math.max(20, ...days.map(d => d.min));
  tp.append(el('div', 'panel-title', el('h3', null, 'Ta semaine'), el('span', 'mono hint', `série : ${streak()} j`)));
  tp.append(el('div', 'stats',
    el('div', 'stat', el('b', null, fmtMin(minutesOn(today()))), el('small', null, 'aujourd’hui')),
    el('div', 'stat', el('b', null, fmtMin(w)), el('small', null, 'cette semaine' + (wp ? ` (${w - wp >= 0 ? '+' : ''}${w - wp} vs sem. dern.)` : ''))),
    el('div', 'stat', el('b', null, lastDays(7).filter(d => d.min > 0).length + '/7'), el('small', null, 'jours joués'))));
  tp.append(el('div', 'bars', ...days.map((d, i) => el('i', { class: (d.min ? 'on' : '') + (i === days.length - 1 ? ' today' : ''), style: { height: Math.max(2, 100 * d.min / max) + '%' }, title: `${fmtDate(d.d)} : ${d.min} min` }))),
    el('p', 'hint', '14 derniers jours. Temps partagé avec l’ancien Shred.'));
  g2.append(tp);

  // compétences
  const sk = el('div', 'panel');
  sk.append(el('div', 'panel-title', el('h3', null, 'Tes compétences'), el('a', { class: 'btn ghost sm', href: '#/progres' }, 'Détail')));
  sk.append(skillMeters());
  g2.append(sk);
  main.append(g2);

  const g3 = el('div', 'grid2');
  // objectifs
  const ob = el('div', 'panel');
  ob.append(el('h3', null, 'Tes objectifs'));
  const mkField = (k, label, ph) => {
    const t = el('textarea', { placeholder: ph, rows: 2 }); t.value = S.goals[k] || '';
    t.addEventListener('change', () => { update(s => s.goals[k] = t.value.trim()); toast('Objectif enregistré.', 'ok'); });
    return el('label', 'field', el('span', null, label), t);
  };
  ob.append(mkField('short', 'Ce mois-ci', 'Ex. : valider le module 1 et tenir l’alternate picking propre à 90 BPM'),
    el('div', { style: { height: '8px' } }), mkField('long', 'Dans un an', 'Ex. : improviser un solo à la Gilmour sur une grille que je n’ai jamais vue'));
  g3.append(ob);

  // récemment étudié
  const rc = el('div', 'panel');
  rc.append(el('h3', null, 'Dernières notions étudiées'));
  const recent = (S.recent || []).map(notionById).filter(Boolean);
  if (!recent.length) rc.append(el('p', 'empty', 'Rien encore. Commence par la séance du jour ou par le module 1.'));
  recent.slice(0, 5).forEach(n => {
    const s = S.notions[n.id] || {};
    rc.append(el('button', { class: 'card-link', style: { marginBottom: '6px' }, onclick: () => openLesson(n.id) }, el('span', 'ic', s.validated && !s.review ? '✓' : '◈'),
      el('div', null, el('b', null, n.title), el('small', null, s.validated && !s.review ? `Validée le ${fmtDate(s.validated)}` : s.review ? 'À revoir' : 'Pas encore validée')), el('span', 'chev', '›')));
  });
  g3.append(rc);
  main.append(g3);

  main.append(el('div', 'panel', el('div', 'row', el('div', null, el('h3', null, 'Les outils'), el('p', 'hint', 'Ouverts à tout moment, sans passer par le parcours.')), el('span', 'spacer'),
    el('a', { class: 'btn ghost sm', href: '#/labo/manche' }, 'Manche'), el('a', { class: 'btn ghost sm', href: '#/labo/gammes' }, 'Gammes & modes'),
    el('a', { class: 'btn ghost sm', href: '#/labo/accords' }, 'Chord Lab'), el('a', { class: 'btn ghost sm', href: '#/impro' }, 'Impro Studio'),
    el('a', { class: 'btn ghost sm', href: 'classic.html' }, 'Shred classique (Juke-box, répertoire, studio)'))));
}

/* Séance libre : un simple chrono qui compte ton temps de jeu */
function freeTimer() {
  let start = null, acc = 0, h = null;
  openModal('Séance libre', body => {
    const t = el('div', 'timer', '0:00');
    const upd = () => { const s = Math.round(acc + (start ? (Date.now() - start) / 1000 : 0)); t.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const go = el('button', { class: 'btn', onclick: () => { if (start) { acc += (Date.now() - start) / 1000; start = null; go.textContent = '▶ Reprendre'; } else { start = Date.now(); go.textContent = '❚❚ Pause'; } } }, '▶ Démarrer');
    const end = el('button', { class: 'btn ghost', onclick: () => closeModal() }, 'Terminer et enregistrer');
    body.append(el('p', 'lead', 'Joue ce que tu veux : le temps s’ajoute à ta semaine quand tu fermes.'), t, el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px' } }, go, end));
    h = setInterval(upd, 500);
  }, { onClose: () => { clearInterval(h); const s = acc + (start ? (Date.now() - start) / 1000 : 0); if (s > 5) { addPractice(s); toast(`${Math.round(s / 60)} min ajoutées.`, 'ok'); } if (location.hash === '' || location.hash === '#/') dispatchEvent(new HashChangeEvent('hashchange')); } });
}
