/* ================================================================
   PROGRÈS — uniquement des données réelles, avec leur source :
   « quiz » (vérifié), « tempo » (déclaré au métronome), « bilan » (auto-évaluation).
   ================================================================ */
import * as T from '../theory.js';
import { el, N, toast, openModal, closeModal, fmtMin, fmtDate, shuffle, seg } from '../ui.js';
import { state, update, save, days, weekMinutes, lastDays, streak, isValidated, flagReview, exportJSON, importJSON, resetV2, today } from '../store.js';
import { MODULES, READY_NOTIONS, notionById } from '../content/lessons.js';
import { TECHNIQUE } from '../content/technique.js';
import { MODE_INFO } from '../content/modes.js';
import { moduleProgress, openLesson } from './path.js';
import { runQuiz, GENERATORS } from '../quiz.js';
import { encodeProg } from './labo.js';

const GEN_NAMES = { intervals: 'Intervalles', majorScale: 'Gamme majeure', fretNotes: 'Notes sur le manche', keys: 'Tonalités', degrees: 'Degrés', pentas: 'Pentatoniques', triads: 'Triades', qualities: 'Qualités d’accords', sevenths: 'Accords de septième', harmonization: 'Harmonisation', functions: 'Fonctions', inversions: 'Renversements', voiceLeading: 'Voice leading', modeCompare: 'Comparer les modes', modesAll: 'Les 7 modes', targets: 'Notes cibles', earIntervals: 'Oreille : intervalles', earChords: 'Oreille : majeur/mineur', earTriads: 'Oreille : triades', earSevenths: 'Oreille : septièmes', earCompare: 'Oreille : comparer', earDegrees: 'Oreille : degrés', earMelody: 'Oreille : mélodies', earModes: 'Oreille : modes', earTranscribe: 'Oreille : transcription', passing: 'Notes de passage', enrichedPenta: 'Pentas enrichies', multiChord: 'Plusieurs accords', motifId: 'Motifs', borrowed: 'Accords empruntés', contrast: 'Contraste', melodyStrong: 'Mélodie', riffScale: 'Riffs', progBuild: 'Progressions' };
T.MODE_IDS.forEach(id => GEN_NAMES['mode_' + id] = 'Mode ' + MODE_INFO[id].name.toLowerCase());

/* Jauges de compétences (affichées aussi sur l'accueil) */
export function skillMeters() {
  const S = state();
  const wrap = el('div');
  const row = (label, pct, src, v) => wrap.append(el('div', 'meter-row', el('span', null, label, ' ', el('span', { class: 'tag', style: { fontSize: '10px' } }, src)), el('div', 'progress', el('i', { style: { width: Math.round(pct * 100) + '%' } })), el('span', 'v', v)));
  [['m1', 'Manche & bases'], ['m2', 'Harmonie'], ['m3', 'Modes'], ['m4', 'Impro (théorie)'], ['m6', 'Composition']].forEach(([id, label]) => { const m = MODULES.find(x => x.id === id), p = moduleProgress(m); row(label, p.pct, 'quiz', `${p.ok}/${p.total}`); });
  const imp = (S.impro || []).slice(-6);
  const lvl = (S.improLevel || {}).targets || 1;
  row('Impro (pratique)', imp.length ? imp.reduce((a, x) => a + x.self, 0) / imp.length / 4 : 0, 'bilan', imp.length ? `niv. ${lvl}` : '—');
  const prac = TECHNIQUE.filter(t => t.start && S.tempos[t.id]?.clean);
  const techPct = prac.length ? prac.reduce((a, t) => a + Math.min(1, Math.max(0, (S.tempos[t.id].clean - t.start) / (t.target - t.start))), 0) / prac.length : 0;
  row('Technique', techPct, 'tempo', prac.length ? `${prac.length} exos` : '—');
  const nps = TECHNIQUE.filter(t => t.cat === 'Gammes NPS' && t.level === 1);
  const npsOk = nps.filter(t => (S.tempos[t.id]?.clean || 0) >= t.start + (t.target - t.start) / 2).length;
  row('Gammes NPS', npsOk / nps.length, 'tempo', `${npsOk}/${nps.length} patterns`);
  return wrap;
}

export function render(main) {
  const S = state();
  main.append(el('div', 'page-head', el('div', null, el('div', 'eyebrow', 'Progrès'), el('h1', null, 'Ce que tu sais vraiment faire'),
    el('p', null, 'Une notion n’est comptée comme maîtrisée qu’après un quiz réussi, et elle revient dans les évaluations. Ouvrir un cours ne compte pas.'))));

  // évaluation périodique
  const lastA = (S.assessments || []).slice(-1)[0];
  const validated = READY_NOTIONS.filter(n => isValidated(n.id) || S.notions[n.id]?.review);
  const daysSince = lastA ? Math.round((new Date(today()) - new Date(lastA.d)) / 864e5) : null;
  const due = validated.length >= 2 && (daysSince == null || daysSince >= 7);
  const ev = el('div', 'panel' + (due ? ' hl' : ''));
  ev.append(el('div', 'panel-title', el('h3', null, 'Évaluation périodique'), lastA ? el('span', 'mono hint', `dernière : ${fmtDate(lastA.d)} · ${Math.round(100 * lastA.score / lastA.total)} %`) : el('span')),
    el('p', 'lead', validated.length < 2 ? 'Disponible dès que tu as validé 2 notions. Elle mélange des questions sur tout ce que tu as validé, et remet « à revoir » ce qui ne tient plus.'
      : due ? 'Recommandée maintenant (une fois par semaine). 12 questions sur tes notions validées.' : `Prochaine recommandée dans ${7 - daysSince} jour(s). Tu peux la faire quand tu veux.`));
  if (validated.length >= 2) ev.append(el('button', { class: 'btn', onclick: () => assessment(validated) }, 'Lancer l’évaluation'));
  main.append(ev);

  const g = el('div', 'grid2');
  // temps
  const tp = el('div', 'panel');
  const all = Object.values(days()).reduce((a, d) => a + (d.sec || 0), 0) / 60;
  const d28 = lastDays(28), max = Math.max(20, ...d28.map(d => d.min));
  tp.append(el('h3', null, 'Temps de pratique'), el('div', 'stats',
    el('div', 'stat', el('b', null, fmtMin(Math.round(all))), el('small', null, 'au total')),
    el('div', 'stat', el('b', null, fmtMin(weekMinutes())), el('small', null, 'cette semaine')),
    el('div', 'stat', el('b', null, fmtMin(Math.round(d28.reduce((a, d) => a + d.min, 0) / 4))), el('small', null, 'moyenne / semaine (4 sem.)')),
    el('div', 'stat', el('b', null, streak() + ' j'), el('small', null, 'série'))),
    el('div', 'bars', ...d28.map(d => el('i', { class: d.min ? 'on' : '', style: { height: Math.max(2, 100 * d.min / max) + '%' }, title: `${fmtDate(d.d)} : ${d.min} min` }))),
    el('p', 'hint', '28 derniers jours.'));
  g.append(tp);
  const sk = el('div', 'panel'); sk.append(el('h3', null, 'Compétences'), skillMeters()); g.append(sk);
  main.append(g);

  // notions
  const np = el('div', 'panel');
  np.append(el('h3', null, 'Notions'));
  const tbl = el('table', 'tbl');
  tbl.append(el('tr', null, el('th', null, 'Notion'), el('th', null, 'État'), el('th', null, 'Quiz'), el('th', null, 'Dernier score')));
  MODULES.forEach(m => m.notions.filter(n => n.ready).forEach(n => {
    const s = S.notions[n.id];
    const st = !s ? el('span', 'tag', 'pas vue') : s.review ? el('span', 'tag bad', 'à revoir') : s.validated ? el('span', 'tag ok', 'validée ' + fmtDate(s.validated)) : el('span', 'tag acc', 'étudiée');
    const last = s && s.attempts.length ? s.attempts[s.attempts.length - 1] : null;
    tbl.append(el('tr', { class: 'click', onclick: () => openLesson(n.id) }, el('td', null, el('span', 'mono hint', `M${m.n} `), n.title), el('td', null, st), el('td', 'mono', s ? s.attempts.length : 0), el('td', 'mono', last ? Math.round(100 * last.score / last.total) + ' %' : '—')));
  }));
  np.append(el('div', 'tbl-wrap', tbl));
  main.append(np);

  const g2 = el('div', 'grid2');
  // difficultés persistantes
  const dp = el('div', 'panel');
  dp.append(el('h3', null, 'Difficultés persistantes'));
  const weak = Object.entries(S.genStats || {}).filter(([, v]) => v.n >= 4).map(([k, v]) => ({ k, pct: (v.recent || []).reduce((a, b) => a + b, 0) / Math.max(1, (v.recent || []).length), n: v.n })).filter(x => x.pct < 0.75).sort((a, b) => a.pct - b.pct);
  const stuck = READY_NOTIONS.filter(n => { const s = S.notions[n.id]; return s && !s.validated && s.attempts.length >= 2; });
  if (!weak.length && !stuck.length) dp.append(el('p', 'empty', 'Rien de signalé. Cette liste se remplit avec tes erreurs réelles (au moins 4 questions d’un même type).'));
  weak.forEach(w => dp.append(el('div', 'meter-row', el('span', null, GEN_NAMES[w.k] || w.k), el('div', 'progress', el('i', { style: { width: Math.round(w.pct * 100) + '%', background: 'var(--bad)' } })), el('span', 'v', Math.round(w.pct * 100) + ' %'))));
  if (weak.length) dp.append(el('p', 'hint', 'Taux de réussite sur les 20 dernières questions de chaque type.'));
  stuck.forEach(n => dp.append(el('button', { class: 'card-link', style: { marginTop: '6px' }, onclick: () => openLesson(n.id) }, el('span', 'ic', '!'), el('div', null, el('b', null, n.title), el('small', null, `${S.notions[n.id].attempts.length} quiz sans validation`)), el('span', 'chev', '›'))));
  g2.append(dp);

  // tempos
  const tt = el('div', 'panel');
  tt.append(el('h3', null, 'Tempos atteints proprement'));
  const tbl2 = el('table', 'tbl');
  tbl2.append(el('tr', null, el('th', null, 'Exercice'), el('th', null, 'Départ'), el('th', null, 'Record'), el('th', null, 'Objectif'), el('th', null, '')));
  let any = false;
  TECHNIQUE.forEach(t => {
    const r = S.tempos[t.id]; if (!r) return; any = true;
    tbl2.append(el('tr', null, el('td', null, t.name), el('td', 'mono', t.start || '—'), el('td', 'mono', t.start ? (r.clean || '—') : `${r.history.length}×`), el('td', 'mono', t.target || '—'),
      el('td', { style: { width: '90px' } }, t.start ? el('div', 'progress', el('i', { style: { width: Math.round(100 * Math.min(1, Math.max(0, (r.clean - t.start) / (t.target - t.start)))) + '%' } })) : '')));
  });
  tt.append(any ? el('div', 'tbl-wrap', tbl2) : el('p', 'empty', 'Aucun tempo enregistré. Dans la séance, le bouton « Propre à ce tempo » note ton record.'));
  g2.append(tt);
  main.append(g2);

  const g3 = el('div', 'grid2');
  // gammes connues
  const gk = el('div', 'panel');
  gk.append(el('h3', null, 'Gammes'));
  const sc = [['m1-major', 'Gamme majeure (ionien)'], ['m1-pentas', 'Pentatoniques majeure et mineure'], ...T.MODE_IDS.filter(id => id !== 'ionian').map(id => ['m3-' + id, MODE_INFO[id].name])];
  sc.forEach(([id, label]) => gk.append(el('div', { class: 'row', style: { padding: '4px 0' } }, el('span', null, label), el('span', 'spacer'), isValidated(id) ? el('span', 'tag ok', 'validée') : S.notions[id]?.review ? el('span', 'tag bad', 'à revoir') : el('span', 'tag', 'pas encore'))));
  gk.append(el('p', 'hint', 'Validée = quiz de la notion réussi (construction, note caractéristique, gamme parente, repérage sur le manche).'));
  g3.append(gk);
  // accords
  const ck = el('div', 'panel');
  ck.append(el('h3', null, 'Accords'));
  [['triads', 'Triades majeures / mineures / diminuées'], ['sevenths', 'Accords de septième'], ['harmonization', 'Harmonisation'], ['inversions', 'Renversements'], ['voiceLeading', 'Voice leading']].forEach(([k, label]) => {
    const v = (S.genStats || {})[k];
    const pct = v ? (v.recent || []).reduce((a, b) => a + b, 0) / Math.max(1, (v.recent || []).length) : null;
    ck.append(el('div', 'meter-row', el('span', null, label), el('div', 'progress', el('i', { style: { width: (pct == null ? 0 : Math.round(pct * 100)) + '%' } })), el('span', 'v', pct == null ? '—' : Math.round(pct * 100) + ' %')));
  });
  ck.append(el('p', 'hint', 'Réussite aux questions de chaque type (20 dernières). Jouer les accords, c’est l’autre moitié : l’app ne peut pas l’entendre.'));
  g3.append(ck);
  main.append(g3);

  // impro
  const ip = el('div', 'panel');
  ip.append(el('h3', null, 'Improvisation (bilans)'));
  const imp = (S.impro || []).slice().reverse();
  if (!imp.length) ip.append(el('p', 'empty', 'Aucun bilan. Après chaque exercice de l’Impro Studio, tu t’évalues : c’est déclaratif, mais ça montre une tendance.'));
  else {
    const byEx = {};
    imp.forEach(x => { (byEx[x.exercise] = byEx[x.exercise] || []).push(x); });
    Object.entries(byEx).forEach(([k, arr]) => ip.append(el('div', 'meter-row', el('span', null, { targets: 'Notes cibles', call: 'Appel / réponse', motif: 'Motifs', modes: 'Modes', free: 'Libre' }[k] || k),
      el('div', { class: 'bars', style: { height: '24px', marginTop: 0 } }, ...arr.slice(0, 12).reverse().map(x => el('i', { class: 'on', style: { height: (x.self * 25) + '%' } }))), el('span', 'v', arr.length + '×'))));
    ip.append(el('p', 'hint', `Niveau actuel en notes cibles : ${(S.improLevel || {}).targets || 1} / 5.`));
  }
  main.append(ip);

  // idées
  const id = el('div', 'panel');
  id.append(el('h3', null, 'Mes idées (grilles gardées)'));
  if (!(S.compos || []).length) id.append(el('p', 'empty', 'Dans le Chord Lab → Harmoniser, construis une grille et « Garde cette idée ».'));
  (S.compos || []).forEach((c, i) => {
    const real = T.realizeProgression(c.key, c.chords);
    id.append(el('div', 'card-link', el('span', 'ic', '♫'), el('div', null, el('b', null, c.name), el('small', null, `${N(c.key)} ${T.SCALES[c.scale]?.name.toLowerCase() || ''} · ${real.map(r => r.symbol).join(' – ')} · ${fmtDate(c.d)}`)),
      el('a', { class: 'btn sm', href: `#/impro?ex=free&key=${encodeURIComponent(c.key)}&scale=${c.scale}&prog=${encodeProg(c.chords)}`, style: { marginLeft: 'auto' } }, 'Jouer'),
      el('button', { class: 'icon-btn', 'aria-label': 'Supprimer', onclick: () => { if (confirm('Supprimer cette idée ?')) { update(s => s.compos.splice(i, 1)); dispatchEvent(new HashChangeEvent('hashchange')); } } }, '✕')));
  });
  main.append(id);

  // réglages
  const rg = el('div', 'panel');
  rg.append(el('h3', null, 'Réglages et sauvegarde'));
  rg.append(el('div', 'row', el('span', null, 'Noms des notes :'), seg([['anglo', 'A B C (anglo-saxon)'], ['latin', 'La Si Do']], S.settings.notes, v => { update(s => s.settings.notes = v); toast('Réglage enregistré.', 'ok'); })));
  const file = el('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
  file.addEventListener('change', async () => {
    const f = file.files[0]; if (!f) return;
    try { importJSON(await f.text()); toast('Sauvegarde restaurée.', 'ok'); dispatchEvent(new HashChangeEvent('hashchange')); }
    catch (e) { toast(e.message, 'bad'); }
  });
  rg.append(el('div', { class: 'row', style: { marginTop: '12px' } },
    el('button', { class: 'btn ghost sm', onclick: () => { const b = new Blob([exportJSON()], { type: 'application/json' }); const a = el('a', { href: URL.createObjectURL(b), download: `shred-sauvegarde-${today()}.json` }); document.body.append(a); a.click(); a.remove(); } }, '⬇ Exporter mes données'),
    el('button', { class: 'btn ghost sm', onclick: () => file.click() }, '⬆ Restaurer une sauvegarde'), file,
    el('button', { class: 'btn danger sm', onclick: () => { if (confirm('Effacer toutes les données de Shred v2 (notions, quiz, bilans) ? Le temps de jeu et l’ancien Shred ne sont pas touchés.')) { resetV2(); toast('Données v2 effacées.'); dispatchEvent(new HashChangeEvent('hashchange')); } } }, 'Réinitialiser la v2')),
    el('p', 'hint', 'Tes données restent dans ce navigateur (localStorage). Exporte-les de temps en temps : vider le cache du navigateur les efface.'));
  main.append(rg);
}

/* L'évaluation : 2 questions par notion validée (12 max), ce qui ne tient plus repasse « à revoir » */
function assessment(notions) {
  const pickN = shuffle(notions).slice(0, 6);
  const qs = [];
  pickN.forEach(n => { for (let i = 0; i < 2; i++) { const gen = n.gens[i % n.gens.length]; const q = GENERATORS[gen](); q.gen = gen; q.notion = n.id; qs.push(q); } });
  openModal('Évaluation périodique', body => {
    body.append(el('p', 'lead', `${qs.length} questions sur : ${pickN.map(n => n.title).join(', ')}.`));
    runQuiz(body, { questions: shuffle(qs), kind: 'assessment', onDone: r => {
      const per = {};
      r.results.forEach(x => { per[x.notion] = per[x.notion] || { ok: 0, n: 0 }; per[x.notion].n++; if (x.ok) per[x.notion].ok++; });
      const failed = Object.entries(per).filter(([, v]) => v.ok === 0).map(([k]) => k);
      const repaired = Object.entries(per).filter(([, v]) => v.ok === v.n).map(([k]) => k);
      if (failed.length) flagReview(failed);
      update(s => {
        repaired.forEach(k => { if (s.notions[k] && s.notions[k].review) s.notions[k].review = false; });
        s.assessments = (s.assessments || []).concat({ d: today(), score: r.score, total: r.total, failed });
      });
      body.append(el('div', { class: 'callout', html: failed.length ? `À revoir : <b>${failed.map(k => notionById(k).title).join(', ')}</b> (aucune bonne réponse sur ces notions). Elles reviennent en priorité dans ta séance du jour.` : 'Tout tient. Rien n’est remis « à revoir ».' }));
    } });
  }, { onClose: () => dispatchEvent(new HashChangeEvent('hashchange')) });
}
