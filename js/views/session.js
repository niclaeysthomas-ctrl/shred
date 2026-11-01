/* ================================================================
   LA SÉANCE DU JOUR — 15, 20 ou 30 minutes
   Les priorités tournent sur 3 jours (théorie / impro / technique) :
   on ne travaille pas tout, tous les jours. Le contenu s'adapte aux
   résultats : prochaine notion non validée, notions ratées en évaluation,
   niveau d'impro, tempos déjà atteints.
   Le chrono continue si tu ouvres une leçon ou l'Impro Studio.
   ================================================================ */
import { el, N, rich, seg, toast, fmtMin } from '../ui.js';
import { state, update, today, addPractice, recordTempo, setSessionLive, isValidated } from '../store.js';
import { TECHNIQUE, techById } from '../content/technique.js';
import { PROGRESSIONS } from '../content/progressions.js';
import { READY_NOTIONS, notionById } from '../content/lessons.js';
import { nextNotion, openLesson } from './path.js';
import { Metronome, pluck, click, ac } from '../audio.js';
import { runQuiz } from '../quiz.js';
import { openModal, closeModal } from '../ui.js';

const FOCI = ['theory', 'impro', 'tech'];
const FOCUS_NAME = { theory: 'Théorie & manche', impro: 'Improvisation', tech: 'Technique' };

function dayIndex() {
  const c = new Date(state().created || today()), d = new Date(today());
  return Math.max(0, Math.round((d - c) / 864e5));
}

/* Choix d'un exercice technique : on alterne, en privilégiant le moins travaillé récemment */
function pickTech(offset = 0) {
  const S = state();
  const practicedL1 = TECHNIQUE.filter(t => t.level === 1 && (S.tempos[t.id]?.history.length || 0) >= 3).length;
  const maxLevel = practicedL1 >= 2 ? 2 : 1;
  const pool = TECHNIQUE.filter(t => t.level <= maxLevel);
  const last = id => { const h = S.tempos[id]?.history; return h && h.length ? h[h.length - 1].d : '0000'; };
  const sorted = pool.slice().sort((a, b) => last(a.id).localeCompare(last(b.id)) || (a.id === 'pick-basics' ? -1 : 1));
  return sorted[offset % sorted.length];
}

export function buildPlan(len) {
  const S = state();
  const focus = FOCI[dayIndex() % 3];
  const review = READY_NOTIONS.filter(n => S.notions[n.id]?.review);
  const nxt = nextNotion();
  const theory = () => {
    if (review.length) return { type: 'theory', notion: review[0].id, title: 'À revoir : ' + review[0].title, detail: 'Ratée en évaluation. Relis, puis refais le quiz.' };
    if (nxt) return { type: 'theory', notion: nxt.notion.id, title: nxt.notion.title, detail: `Module ${nxt.module.n} · leçon puis quiz de validation.` };
    return { type: 'review', title: 'Révision mélangée', detail: 'Tout le parcours disponible est validé : quiz d’entretien.' };
  };
  const lvl = (S.improLevel || {}).targets || 1;
  const styleProgs = PROGRESSIONS.filter(p => p.level <= Math.max(1, lvl - 1) + 1);
  const prog = styleProgs[dayIndex() % styleProgs.length] || PROGRESSIONS[0];
  const modeNotion = nxt && nxt.module.id === 'm3' && notionById(nxt.notion.id).impro;
  const impro = () => modeNotion
    ? { type: 'impro', href: `#/impro?ex=modes&mode=${modeNotion.mode}`, title: `Impro modale : ${nxt.notion.title}`, detail: 'Faire entendre la note caractéristique sur la boucle.' }
    : { type: 'impro', href: `#/impro?ex=targets&prog=${prog.id}&level=${lvl}`, title: `Notes cibles · niveau ${lvl}`, detail: prog.name };
  const tech = k => { const t = pickTech(k); return { type: 'tech', tech: t.id, title: t.name, detail: t.goal }; };
  const validated = READY_NOTIONS.filter(n => isValidated(n.id));
  const reviewBlock = () => validated.length >= 2 ? { type: 'review', title: 'Révision express', detail: '5 questions sur des notions déjà validées (pour qu’elles tiennent).' } : tech(1);
  const rep = () => (dayIndex() % 2)
    ? { type: 'rep', href: 'classic.html#jukebox', title: 'Répertoire : un morceau du Juke-box', detail: 'Joue un morceau en entier, en visant les notes indiquées.' }
    : { type: 'rep', href: '#/labo/accords?view=harmo', title: 'Composition : une grille', detail: 'Construis une grille de 4 accords dans le Chord Lab, garde-la si elle te plaît.' };

  let blocks;
  if (len === 15) blocks = focus === 'theory' ? [[theory(), 8], [impro(), 7]] : focus === 'impro' ? [[tech(0), 5], [impro(), 10]] : [[tech(0), 8], [theory(), 7]];
  else if (len === 20) blocks = focus === 'theory' ? [[tech(0), 5], [theory(), 8], [impro(), 7]] : focus === 'impro' ? [[tech(0), 5], [impro(), 10], [rep(), 5]] : [[tech(0), 8], [theory(), 6], [impro(), 6]];
  else blocks = focus === 'tech' ? [[tech(0), 6], [tech(1), 5], [theory(), 7], [impro(), 7], [rep(), 5]] : [[tech(0), 5], [theory(), 7], [impro(), 8], [rep(), 5], [reviewBlock(), 5]];
  return { len, focus, d: today(), blocks: blocks.map(([b, m], i) => ({ ...b, id: 'b' + i, min: m })), done: [] };
}

function todayPlan(len) {
  const S = state();
  let p = S.sessions[today()];
  if (!p || (len && p.len !== len && !p.done.length)) {
    p = buildPlan(len || S.settings.sessionLen || 20);
    update(s => { s.sessions[today()] = p; const keys = Object.keys(s.sessions).sort(); if (keys.length > 120) keys.slice(0, keys.length - 120).forEach(k => delete s.sessions[k]); });
  }
  return p;
}

/* ---------------- chrono global (survit à la navigation) ---------------- */
const RUN = { on: false, block: null, start: 0, acc: 0, paused: false, pill: null, tick: null };
const elapsed = () => RUN.acc + (RUN.paused || !RUN.on ? 0 : (Date.now() - RUN.start) / 1000);

function startBlock(id) {
  if (RUN.on && RUN.block !== id) commitTime();
  RUN.on = true; RUN.block = id; RUN.start = Date.now(); RUN.acc = 0; RUN.paused = false; RUN.alerted = false;
  setSessionLive(true);
  ensureTick();
}
function commitTime() { const e = elapsed(); if (e > 3) addPractice(e); RUN.acc = 0; RUN.start = Date.now(); }
function stopRun() { if (RUN.on) commitTime(); RUN.on = false; RUN.block = null; setSessionLive(false); clearInterval(RUN.tick); RUN.tick = null; renderPill(); }
function ensureTick() {
  clearInterval(RUN.tick);
  RUN.tick = setInterval(() => {
    const p = state().sessions[today()]; const b = p && p.blocks.find(x => x.id === RUN.block);
    if (b && !RUN.alerted && elapsed() >= b.min * 60) { RUN.alerted = true; chime(); toast(`⏱ ${b.min} min écoulées : bloc « ${b.title} » terminé si tu veux.`, 'ok'); }
    renderPill();
    const t = document.getElementById('sess-timer'); if (t) t.update();
  }, 500);
}
function chime() { try { const t = ac().currentTime; [76, 79, 84].forEach((m, i) => pluck(m, { when: t + i * 0.15, vel: 0.5 })); } catch (e) {} }
const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

function renderPill() {
  if (!RUN.pill) { RUN.pill = el('a', { href: '#/seance', style: { position: 'fixed', right: '14px', bottom: '84px', zIndex: 60, background: 'var(--panel2)', border: '1px solid var(--acc)', color: 'var(--txt)', borderRadius: '20px', padding: '7px 13px', fontFamily: 'var(--mono)', fontSize: '13px', textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.4)' } }); document.body.append(RUN.pill); }
  const onSessionPage = location.hash.startsWith('#/seance');
  RUN.pill.style.display = RUN.on && !onSessionPage ? 'block' : 'none';
  if (RUN.on) { const p = state().sessions[today()]; const b = p && p.blocks.find(x => x.id === RUN.block); RUN.pill.textContent = `⏱ ${mmss(elapsed())}${b ? ' / ' + b.min + ':00' : ''} · séance ${RUN.paused ? '(pause)' : ''}`; }
}
window.addEventListener('hashchange', () => setTimeout(renderPill, 0));
window.addEventListener('beforeunload', () => { if (RUN.on) commitTime(); });

/* ---------------- écran ---------------- */
const ICON = { tech: '✋', theory: '◈', impro: '♫', rep: '🎵', review: '↻' };

export function render(main, params) {
  const S = state();
  const plan = todayPlan(params.len ? +params.len : null);
  main.append(el('div', 'page-head',
    el('div', null, el('div', 'eyebrow', 'Séance du jour · priorité ' + FOCUS_NAME[plan.focus].toLowerCase()), el('h1', null, `${plan.len} minutes`),
      el('p', null, 'Les priorités tournent sur trois jours : théorie, impro, technique. Les contenus suivent tes résultats.')),
    seg([[15, '15 min'], [20, '20 min'], [30, '30 min']], plan.len, v => {
      if (plan.done.length && !confirm('Des blocs sont déjà faits. Regénérer la séance ?')) return;
      update(s => { s.settings.sessionLen = +v; delete s.sessions[today()]; });
      stopRun(); location.hash = '#/seance?len=' + v; dispatchEvent(new HashChangeEvent('hashchange'));
    })));

  const doneN = plan.done.length;
  const list = el('div', 'block-list');
  const runner = el('div');
  const grid = el('div', 'split');
  grid.append(el('div', null, el('div', 'panel', el('div', 'panel-title', el('h3', null, 'Programme'), el('span', 'mono hint', `${doneN}/${plan.blocks.length}`)), list,
    el('p', 'hint', 'Touche un bloc pour le lancer. Tu peux en sauter un.'))), runner);
  main.append(grid);

  const drawList = () => {
    list.innerHTML = '';
    plan.blocks.forEach(b => {
      const done = plan.done.includes(b.id), now = RUN.block === b.id;
      list.append(el('button', { class: 'block' + (done ? ' done' : '') + (now ? ' now' : ''), style: { textAlign: 'left', width: '100%' }, onclick: () => { if (!RUN.on || RUN.block !== b.id) startBlock(b.id); drawRunner(b); drawList(); } },
        el('span', 'bi', done ? '✓' : ICON[b.type]), el('div', null, el('b', 'bt', b.title), el('small', null, b.detail)), el('span', 'bm', b.min + ' min')));
    });
  };

  const markDone = b => {
    update(s => { const p = s.sessions[today()]; if (!p.done.includes(b.id)) p.done.push(b.id); });
    plan.done = state().sessions[today()].done;
    const nxt = plan.blocks.find(x => !plan.done.includes(x.id));
    if (nxt) { startBlock(nxt.id); drawRunner(nxt); }
    else { stopRun(); drawEnd(); }
    drawList();
  };

  function drawEnd() {
    runner.innerHTML = '';
    runner.append(el('div', 'panel hl', el('h3', null, 'Séance terminée'), el('p', 'lead', 'Le temps est ajouté à ta semaine. Demain, la priorité change.'),
      el('a', { class: 'btn', href: '#/' }, 'Retour à l’accueil'), ' ', el('a', { class: 'btn ghost', href: '#/progres' }, 'Voir mes progrès')));
  }

  function drawRunner(b) {
    runner.innerHTML = '';
    const box = el('div', 'panel hl');
    const timer = el('div', { class: 'timer', id: 'sess-timer' });
    timer.update = () => { const e = elapsed(); const left = b.min * 60 - e; timer.textContent = left >= 0 ? mmss(left) : '+' + mmss(-left); timer.classList.toggle('over', left < 0); };
    timer.update();
    const pause = el('button', { class: 'btn ghost sm', onclick: () => { if (RUN.paused) { RUN.paused = false; RUN.start = Date.now(); pause.textContent = '❚❚ Pause'; } else { RUN.acc = elapsed(); RUN.paused = true; pause.textContent = '▶ Reprendre'; } } }, RUN.paused ? '▶ Reprendre' : '❚❚ Pause');
    box.append(el('div', 'eyebrow', `${ICON[b.type]} ${{ tech: 'Technique', theory: 'Théorie & manche', impro: 'Improvisation', rep: 'Répertoire / composition', review: 'Révision' }[b.type]}`),
      el('h3', null, b.title), timer,
      el('div', { class: 'row', style: { justifyContent: 'center', margin: '10px 0' } }, pause,
        el('button', { class: 'btn sm', onclick: () => markDone(b) }, '✓ Bloc terminé'),
        el('button', { class: 'btn ghost sm', onclick: () => { update(s => { const p = s.sessions[today()]; p.done.push(b.id); }); plan.done = state().sessions[today()].done; const n = plan.blocks.find(x => !plan.done.includes(x.id)); if (n) { startBlock(n.id); drawRunner(n); } else { stopRun(); drawEnd(); } drawList(); } }, 'Passer')));
    box.append(blockContent(b));
    runner.append(box);
  }

  drawList();
  const cur = RUN.on && plan.blocks.find(x => x.id === RUN.block);
  if (cur) drawRunner(cur);
  else if (plan.done.length === plan.blocks.length) drawEnd();
  else runner.append(el('div', 'panel', el('h3', null, 'Prêt ?'), el('p', 'lead', `Priorité du jour : ${FOCUS_NAME[plan.focus]}. ${plan.blocks.length} blocs, ${plan.len} minutes. Le chrono démarre au premier bloc et continue même si tu ouvres une leçon ou l’Impro Studio.`),
    el('button', { class: 'btn block', onclick: () => { const b = plan.blocks.find(x => !plan.done.includes(x.id)); startBlock(b.id); drawRunner(b); drawList(); } }, '▶ Démarrer la séance')));
}

export function leave() { const t = document.getElementById('sess-timer'); if (t) t.update = () => {}; if (metro) metro.stop(); }

let metro = null;
function blockContent(b) {
  const c = el('div');
  if (b.type === 'tech') {
    const t = techById(b.tech), rec = state().tempos[t.id];
    c.append(el('p', { html: rich('<b>Objectif :</b> ' + t.goal) }), el('p', { class: 'lesson-txt', html: rich(t.how) }), el('pre', 'tab', t.tab.join('\n')));
    if (t.picks) c.append(el('p', 'mono', 'Médiator : ' + t.picks));
    c.append(el('p', { html: `<b>Critère de réussite :</b> ${t.success}` }));
    if (t.start) {
      let bpm = rec && rec.clean ? Math.min(t.target, rec.clean) : t.start;
      const label = el('b', null, bpm);
      const dot = el('span', { style: { width: '14px', height: '14px', borderRadius: '50%', background: 'var(--line2)', display: 'inline-block' } });
      const setB = v => { bpm = Math.max(40, Math.min(220, v)); label.textContent = bpm; if (metro && metro.on) metro.setBpm(bpm); };
      const go = el('button', { class: 'btn sm', onclick: () => {
        if (metro && metro.on) { metro.stop(); go.textContent = '▶ Métronome'; return; }
        metro = metro || new Metronome(); metro.start(bpm, n => { dot.style.background = n === 0 ? 'var(--bad)' : 'var(--acc)'; setTimeout(() => dot.style.background = 'var(--line2)', 90); }); go.textContent = '■ Stop';
      } }, '▶ Métronome');
      c.append(el('div', 'panel', el('div', 'bpm', el('button', { class: 'btn ghost sm', onclick: () => setB(bpm - 4) }, '−4'), label, el('button', { class: 'btn ghost sm', onclick: () => setB(bpm + 4) }, '+4'), el('span', 'hint', 'BPM · ' + t.unit), dot, go),
        el('p', 'hint', `Départ ${t.start} → objectif ${t.target} BPM. Record propre : ${rec && rec.clean ? rec.clean + ' BPM' : 'aucun'}. On n’augmente que si 3 passages d’affilée sont propres.`),
        el('button', { class: 'btn ghost sm', onclick: () => { recordTempo(t.id, bpm); toast(`${bpm} BPM propre enregistré pour « ${t.name} ».`, 'ok'); } }, '✓ Propre à ce tempo : l’enregistrer')));
    } else {
      c.append(el('button', { class: 'btn ghost sm', onclick: () => { const tt = ac().currentTime; pluck(t.refMidi, { when: tt, dur: 2.2, vel: 0.6 }); } }, '🔊 Note cible (E, corde de Sol case 9)'),
        el('button', { class: 'btn ghost sm', onclick: () => { recordTempo(t.id, 0); toast('Séance notée.', 'ok'); } }, '✓ Fait'));
    }
  }
  if (b.type === 'theory') {
    const n = notionById(b.notion);
    c.append(el('p', 'lead', n.short + '. La leçon s’ouvre par-dessus : le chrono continue.'),
      el('button', { class: 'btn', onclick: () => openLesson(n.id) }, 'Ouvrir la leçon'), ' ',
      el('button', { class: 'btn ghost', onclick: () => openLesson(n.id, { startStep: 5 }) }, 'Aller direct au quiz'));
  }
  if (b.type === 'impro' || b.type === 'rep') {
    c.append(el('p', 'lead', b.detail), el('a', { class: 'btn', href: b.href }, b.type === 'impro' ? '♫ Ouvrir l’exercice' : 'Ouvrir'),
      el('p', 'hint', b.href.startsWith('classic') ? 'Ouvre l’ancien Shred (ton Juke-box est là-bas). Le chrono s’arrête si tu quittes cette page : reviens marquer le bloc terminé.' : 'Le chrono continue (pastille en bas à droite). Reviens ici pour passer au bloc suivant.'));
  }
  if (b.type === 'review') {
    const ids = READY_NOTIONS.filter(n => isValidated(n.id));
    const gens = [...new Set(ids.flatMap(n => n.gens))];
    c.append(el('p', 'lead', 'Questions tirées des notions que tu as déjà validées.'),
      el('button', { class: 'btn', onclick: () => openModal('Révision express', body => runQuiz(body, { gens: gens.length ? gens : ['intervals', 'majorScale'], n: 5, kind: 'review' })) }, 'Lancer la révision'));
  }
  return c;
}
