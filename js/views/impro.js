/* ================================================================
   IMPROVISATION STUDIO
   Backing tracks générées dans le navigateur + exercices guidés.
   Honnêteté : l'app N'ANALYSE PAS ce que tu joues. Elle te guide pendant,
   t'enregistre si tu veux, et c'est toi qui t'évalues en réécoutant.
   ================================================================ */
import * as T from '../theory.js';
import { el, N, IV, seg, select, toast, rich, pick, shuffle } from '../ui.js';
import { Fretboard, scaleMarks, legend, STD_LEGEND } from '../fretboard.js';
import { Backing, STYLES, pluck, canRecord, Recorder, ac } from '../audio.js';
import { PROGRESSIONS, MODAL_VAMPS } from '../content/progressions.js';
import { MODE_INFO } from '../content/modes.js';
import { state, update, today, addPractice, isSessionLive } from '../store.js';
import { decodeProg } from './labo.js';
import { PitchListener } from '../pitch.js';

function listenSummary(c) {
  const tot = c.notes.length, pct = k => Math.round(100 * c[k] / tot);
  const box = el('div', 'panel');
  box.append(el('h3', null, 'Analyse des notes tenues (mesurée)'),
    el('div', 'stats', el('div', 'stat', el('b', { style: { color: 'var(--ok)' } }, pct('cible') + ' %'), el('small', null, `sur la cible (${c.cible})`)),
      el('div', 'stat', el('b', { style: { color: 'var(--info)' } }, pct('accord') + ' %'), el('small', null, `autre note de l’accord (${c.accord})`)),
      el('div', 'stat', el('b', null, pct('gamme') + ' %'), el('small', null, `note de passage (${c.gamme})`)),
      el('div', 'stat', el('b', { style: { color: 'var(--bad)' } }, pct('hors') + ' %'), el('small', null, `hors gamme (${c.hors})`))),
    el('p', 'hint', `${tot} notes tenues plus d’un quart de seconde, comparées à l’accord qui sonnait à ce moment-là. Ce n’est PAS une analyse de ton jeu : les notes rapides, le rythme et le son ne sont pas mesurés. Une note de passage tenue est souvent le signe d’une phrase qui finit « à côté ».`));
  return box;
}

const CF = s => String(s).replace(/^([A-G][♯♭𝄪𝄫]*)/, m => N(m));
let backing = null, recorder = null, practiceStart = null, heldListener = null;

export function leave() { stopAll(); }
function stopAll() {
  if (backing) backing.stop();
  if (heldListener) { heldListener.stop(); heldListener = null; }
  if (recorder) { recorder.stop(); recorder = null; }
  flushPractice();
}
function flushPractice() { if (practiceStart) { if (!isSessionLive()) addPractice((Date.now() - practiceStart) / 1000); practiceStart = null; } }

const EXERCISES = [
  ['targets', '🎯 Notes cibles', 'Termine tes phrases sur une note de l’accord du moment.'],
  ['call', '💬 Appel et réponse', 'L’app joue une phrase, tu réponds.'],
  ['motif', '🧬 Développer un motif', 'Une idée, transformée sans perdre son identité.'],
  ['modes', '🎭 Modes', 'Une boucle modale, la note caractéristique à faire entendre.'],
  ['free', '🎸 Impro libre', 'Tu choisis tout, l’app accompagne.']
];

export function render(main, params) {
  const ex = EXERCISES.some(e => e[0] === params.ex) ? params.ex : null;
  main.append(el('div', 'page-head',
    el('div', null, el('div', 'eyebrow', 'Impro Studio'), el('h1', null, ex ? EXERCISES.find(e => e[0] === ex)[1] : 'Improviser, guidé'),
      el('p', null, 'Les accompagnements sont synthétisés en direct (batterie, basse, accords). L’app te guide pendant que tu joues, tu peux t’enregistrer et réécouter. Seule mesure réelle : dans « Notes cibles », une analyse facultative des notes que tu tiens (casque obligatoire). Le reste, c’est toi qui le juges.'))));
  if (!ex) {
    const g = el('div', 'grid-auto');
    EXERCISES.forEach(([id, t, d]) => {
      const lvl = (state().improLevel || {})[id];
      g.append(el('a', { class: 'card-link', href: '#/impro?ex=' + id }, el('div', null, el('b', null, t), el('small', null, d + (lvl ? ` · niveau ${lvl}` : ''))), el('span', 'chev', '›')));
    });
    main.append(g);
    main.append(historyPanel());
    return;
  }
  main.append(el('a', { class: 'btn ghost sm', href: '#/impro' }, '← Tous les exercices'), el('div', { style: { height: '12px' } }));
  ({ targets: targetsEx, call: callEx, motif: motifEx, modes: modesEx, free: freeEx })[ex](main, params);
}

/* ---------------- lecteur commun ---------------- */
function Player({ container, getConfig, onChord, onSchedule, onStop, onBeatExtra }) {
  const transport = el('div', 'transport');
  const playBtn = el('button', { class: 'play-btn', 'aria-label': 'Lecture' }, '▶');
  const beats = el('div', 'beats', ...[0, 1, 2, 3].map(() => el('i')));
  const status = el('div', { class: 'mono hint', style: { minWidth: '120px' } }, 'Prêt');
  const bpmLabel = el('b', 'mono');
  const bpmIn = el('input', { type: 'range', min: 50, max: 180, step: 2 });
  const loopsSel = el('select', { 'aria-label': 'Nombre de tours' }, ...[2, 4, 8, 16, 0].map(n => el('option', { value: n }, n ? n + ' tours' : 'en boucle')));
  loopsSel.value = 4;
  const recBtn = el('button', { class: 'btn ghost sm' }, '● S’enregistrer');
  const strip = el('div', 'chord-strip');
  const out = el('div');
  transport.append(playBtn, beats, status, el('div', 'bpm', el('span', 'hint', 'Tempo'), bpmIn, bpmLabel), loopsSel, canRecord() ? recBtn : el('span', 'hint', 'Enregistrement indisponible sur ce navigateur'));
  container.append(transport, strip, out);
  let recOn = false, prog = [];

  const syncBpm = () => { bpmLabel.textContent = bpmIn.value + ' BPM'; if (backing && backing.playing) backing.setTempo(+bpmIn.value); };
  bpmIn.addEventListener('input', syncBpm);

  const drawStrip = (p, now = -1) => {
    strip.innerHTML = '';
    p.forEach((c, i) => strip.append(el('div', 'chord-cell' + (i === now ? ' now' : i === (now + 1) % p.length && now >= 0 ? ' next' : ''), el('b', null, CF(c.symbol)), el('small', null, c.roman + (c.bars > 1 ? ' · ' + c.bars + ' mes.' : '')))));
  };

  const api = {
    setProgression(p, bpm) { prog = p; drawStrip(p); if (bpm) { bpmIn.value = bpm; syncBpm(); } },
    get bpm() { return +bpmIn.value; },
    playing: () => backing && backing.playing,
    stop
  };

  async function start() {
    const cfg = getConfig();
    if (!cfg || !cfg.progression.length) return;
    prog = cfg.progression; drawStrip(prog);
    try { ac(); } catch (e) { return toast(e.message, 'bad'); }
    if (recOn) {
      try { recorder = new Recorder(); await recorder.start(); }
      catch (e) { recorder = null; recOn = false; recBtn.textContent = '● S’enregistrer'; toast('Micro refusé ou indisponible : on continue sans enregistrer.', 'bad'); }
    }
    backing = new Backing();
    practiceStart = Date.now();
    playBtn.textContent = '■'; playBtn.classList.add('on');
    backing.start({
      progression: prog, bpm: +bpmIn.value, style: cfg.style, loops: +loopsSel.value || Infinity, onSchedule,
      onChord: (i, ch) => { drawStrip(prog, i); onChord && onChord(i, ch, prog); },
      onBeat: e => {
        if (e.type === 'count') { status.textContent = 'Décompte : ' + e.n; beats.querySelectorAll('i').forEach((b, k) => b.className = k === e.n - 1 ? 'on' + (k === 0 ? ' first' : '') : ''); }
        if (e.type === 'beat') { status.textContent = `Mesure ${e.bar + 1} · temps ${e.beat + 1}`; beats.querySelectorAll('i').forEach((b, k) => b.className = k === e.beat ? 'on' + (k === 0 ? ' first' : '') : ''); }
        if (e.type === 'end') finished();
        onBeatExtra && onBeatExtra(e);
      }
    });
  }

  async function stop() { if (backing) backing.stop(); finished(); }

  async function finished() {
    playBtn.textContent = '▶'; playBtn.classList.remove('on'); status.textContent = 'Arrêté';
    beats.querySelectorAll('i').forEach(b => b.className = '');
    drawStrip(prog);
    flushPractice();
    let url = null;
    if (recorder) { url = await recorder.stop(); recorder = null; }
    out.innerHTML = '';
    if (url) out.append(el('div', 'panel', el('h3', null, 'Ta prise'), el('p', 'hint', 'Réécoute-la avant de t’évaluer. Elle n’est pas sauvegardée : télécharge-la si tu veux la garder.'), el('audio', { controls: true, src: url }), el('a', { class: 'btn ghost sm', href: url, download: `impro-${today()}.webm` }, 'Télécharger')));
    onStop && onStop(out);
  }

  playBtn.addEventListener('click', () => (backing && backing.playing) ? stop() : start());
  recBtn.addEventListener('click', () => { if (backing && backing.playing) return toast('Active l’enregistrement avant de lancer la lecture.'); recOn = !recOn; recBtn.textContent = recOn ? '● Enregistrement activé' : '● S’enregistrer'; recBtn.style.color = recOn ? 'var(--bad)' : ''; });
  bpmIn.value = 80; syncBpm();
  return api;
}

/* Auto-évaluation après un exercice */
function selfEval(out, { exercise, level, style, key, question, onSaved }) {
  const box = el('div', 'panel hl');
  box.append(el('h3', null, 'Ton bilan (auto-évaluation)'), el('p', 'lead', question));
  const opts = [[1, 'Presque jamais'], [2, 'Moins de la moitié'], [3, 'La plupart du temps'], [4, 'Quasiment toujours']];
  let v = 0;
  const g = el('div', 'self-eval');
  opts.forEach(([n, l]) => g.append(el('button', { onclick: e => { v = n; g.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.target.classList.add('on'); } }, l)));
  const note = el('textarea', { placeholder: 'Une remarque pour la prochaine fois (facultatif) : ce qui a marché, ce qui coince…' });
  const save = el('button', { class: 'btn', onclick: () => {
    if (!v) return toast('Choisis une réponse.');
    let up = false;
    update(s => {
      s.impro.push({ d: today(), exercise, level, style, key, self: v, note: note.value.trim() });
      if (s.impro.length > 300) s.impro = s.impro.slice(-300);
      const recent = s.impro.filter(x => x.exercise === exercise && x.level === level).slice(-2);
      if (level && level < 5 && recent.length === 2 && recent.every(x => x.self >= 3)) { s.improLevel = s.improLevel || {}; s.improLevel[exercise] = level + 1; up = true; }
    });
    box.innerHTML = '';
    box.append(el('p', { html: up ? `<b>Niveau ${level + 1} débloqué.</b> Deux séances d’affilée réussies au niveau ${level} (selon ton évaluation).` : '<b>Enregistré.</b> Ton historique est dans Progrès. Deux bilans « la plupart du temps » ou mieux d’affilée font passer au niveau suivant.' }));
    onSaved && onSaved(up);
  } }, 'Enregistrer le bilan');
  box.append(g, note, save, el('p', 'hint', 'C’est déclaratif : l’app ne sait pas ce que tu as joué. Sois honnête avec toi-même, et réécoute ta prise si tu t’es enregistré.'));
  out.append(box);
}

function levelOf(ex) { return (state().improLevel || {})[ex] || 1; }

/* ================================================================
   1. NOTES CIBLES
   ================================================================ */
const TARGET_LEVELS = {
  1: { name: 'Fondamentales', txt: c => `Termine tes phrases sur <b>${N(c.notes[0].name)}</b>, la fondamentale de ${CF(c.symbol)}.`, ivs: c => [c.notes[0].iv] },
  2: { name: 'Toutes les notes de l’accord', txt: c => `Atterris sur une note de ${CF(c.symbol)} : <b>${c.notes.map(n => N(n.name)).join(' · ')}</b>.`, ivs: c => c.notes.map(n => n.iv) },
  3: { name: 'Tierces', txt: c => c.notes[1] && T.parseInterval(c.notes[1].iv).deg === 3 ? `Termine sur la <b>tierce</b> de ${CF(c.symbol)} : <b>${N(c.notes[1].name)}</b>.` : `${CF(c.symbol)} n’a pas de tierce : vise la fondamentale <b>${N(c.notes[0].name)}</b> ou la quinte.`, ivs: c => c.notes.filter(n => T.parseInterval(n.iv).deg === 3).map(n => n.iv).concat(c.notes.some(n => T.parseInterval(n.iv).deg === 3) ? [] : ['1']) },
  4: { name: 'Notes guides (3 et 7)', txt: (c, nx) => `Vise la 3 ou la 7 de ${CF(c.symbol)}, puis rejoins par le chemin le plus court celle de ${CF(nx.symbol)} (${nx.notes.filter(n => [3, 7].includes(T.parseInterval(n.iv).deg)).map(n => N(n.name)).join(' / ') || N(nx.notes[0].name)}).`, ivs: c => c.notes.filter(n => [3, 7].includes(T.parseInterval(n.iv).deg)).map(n => n.iv), next: true },
  5: { name: 'Notes guides, une seule position', txt: (c, nx) => `Même chose sans quitter la zone en surbrillance : 3 et 7 de ${CF(c.symbol)} → ${CF(nx.symbol)}. Anticipe le changement d’un temps.`, ivs: c => c.notes.filter(n => [3, 7].includes(T.parseInterval(n.iv).deg)).map(n => n.iv), next: true, zone: true }
};

function targetsEx(main, params) {
  const st = { prog: PROGRESSIONS.find(p => p.id === params.prog) ? params.prog : 'floyd-numb', key: params.key || null, level: +(params.level || levelOf('targets')) };
  const setup = el('div', 'panel');
  const play = el('div', 'panel');
  const box = el('div', 'target-box');
  const left = el('div'), right = el('div');
  const nowChord = el('div', 'now-chord', '—'), instr = el('div', 'instr', 'Lance la lecture : l’instruction change à chaque accord.');
  left.append(el('div', 'eyebrow', 'Accord en cours'), nowChord, el('div', { style: { height: '8px' } }), instr);
  const F = new Fretboard({ frets: 15 });
  right.append(F.root, legend([['root', 'Cible'], ['third', '3'], ['seventh', '7'], ['none', 'Gamme (passage)']]));
  box.append(left, right);
  main.append(setup, play);
  // écoute réelle des notes tenues (facultatif, casque requis)
  const listen = { on: false, cur: null, counts: null, run: null, live: el('div', 'hint') };
  const listenBox = el('label', 'row hint', Object.assign(el('input', { type: 'checkbox' }), { onchange: e => listen.on = e.target.checked }),
    ' 🎤 Analyser mes notes tenues au micro (casque obligatoire : sinon le micro entend aussi l’accompagnement)');
  left.append(el('div', { style: { height: '10px' } }), listenBox, listen.live);
  const classify = pc => {
    const c = listen.cur; if (!c) return null;
    const L = TARGET_LEVELS[st.level], ivs = L.ivs(c);
    if (c.notes.some(n => n.pc === pc && ivs.includes(n.iv))) return 'cible';
    if (c.notes.some(n => n.pc === pc)) return 'accord';
    if (scale().some(n => n.pc === pc)) return 'gamme';
    return 'hors';
  };
  async function startListen() {
    if (!listen.on || heldListener) return;
    listen.counts = { cible: 0, accord: 0, gamme: 0, hors: 0, notes: [] }; listen.run = null;
    try {
      heldListener = new PitchListener();
      await heldListener.start((p, t) => {
        const m = p && p.clarity > 0.85 ? p.midi : null;
        const r = listen.run;
        if (m == null) { listen.run = null; return; }
        if (r && Math.abs(m - r.mean) < 0.45) { r.n++; r.mean += (m - r.mean) / r.n; if (!r.counted && t - r.t0 >= 0.25) { r.counted = true; const pc = ((Math.round(r.mean) % 12) + 12) % 12, cat = classify(pc); if (cat) { listen.counts[cat]++; listen.counts.notes.push({ pc, cat, chord: listen.cur.symbol }); const col = { cible: 'var(--ok)', accord: 'var(--info)', gamme: 'var(--dim)', hors: 'var(--bad)' }[cat]; listen.live.innerHTML = `Dernière note tenue : <b style="color:${col}">${N(T.PC_NAMES[pc])}</b> (${cat === 'cible' ? 'sur la cible ✓' : cat === 'accord' ? 'note de l’accord' : cat === 'gamme' ? 'note de passage' : 'hors gamme'}) · ${listen.counts.cible} cible(s) / ${listen.counts.notes.length} notes tenues`; } } }
        else listen.run = { mean: m, n: 1, t0: t, counted: false };
      });
    } catch (e) { heldListener = null; toast('Micro refusé ou indisponible : analyse désactivée.', 'bad'); }
  }
  const player = Player({ container: play, getConfig: () => ({ progression: realized(), style: preset().style }),
    onChord: (i, c, p) => { listen.cur = c; showChord(i, p); startListen(); },
    onStop: out => { if (heldListener) { heldListener.stop(); heldListener = null; } if (listen.counts && listen.counts.notes.length) out.append(listenSummary(listen.counts)); listen.counts = null; selfEval(out, { exercise: 'targets', level: st.level, style: preset().style, key: key(), question: 'Sur l’ensemble des phrases, combien ont vraiment atterri sur la note visée, au moment du changement d’accord ?', onSaved: up => { if (up) { st.level++; drawSetup(); } } }); } });
  play.append(box);

  const preset = () => PROGRESSIONS.find(p => p.id === st.prog);
  const key = () => st.key || preset().key;
  const realized = () => T.realizeProgression(key(), preset().chords);
  const scale = () => T.buildScale(key(), preset().scale);

  function showChord(i, p) {
    const c = p[i], nx = p[(i + 1) % p.length], L = TARGET_LEVELS[st.level];
    nowChord.textContent = CF(c.symbol);
    instr.innerHTML = L.txt(c, nx);
    const ivs = L.ivs(c);
    const targetPcs = new Map(c.notes.filter(n => ivs.includes(n.iv)).map(n => [n.pc, n]));
    const nextPcs = L.next ? new Map(nx.notes.filter(n => [3, 7].includes(T.parseInterval(n.iv).deg)).map(n => [n.pc, n])) : new Map();
    const zones = T.scaleZones(scale());
    const zone = L.zone ? zones[0] : null;
    const marks = [];
    for (let s = 0; s < 6; s++) for (let f = 0; f <= 15; f++) {
      const pc = T.pcAt(s, f);
      const inZ = !zone || (f >= zone.from - 1 && f <= zone.to + 1);
      if (targetPcs.has(pc)) { const n = targetPcs.get(pc); const deg = T.parseInterval(n.iv).deg; marks.push({ s, f, label: IV(n.iv), role: deg === 3 ? 'third' : deg === 7 ? 'seventh' : 'root', cls: inZ ? 'emph' : 'ghost' }); }
      else if (nextPcs.has(pc)) marks.push({ s, f, label: IV(T.ivBetween(nx.notes[0].pc, pc)), role: 'third', cls: 'outline' + (inZ ? '' : ' ghost') });
      else if (scale().some(n => n.pc === pc)) marks.push({ s, f, label: '', role: 'none', cls: inZ ? 'soft' : 'ghost' });
      else if (c.notes.some(n => n.pc === pc)) marks.push({ s, f, label: IV(c.notes.find(n => n.pc === pc).iv), role: 'none', cls: inZ ? 'soft' : 'ghost' });
    }
    F.setMarks(marks); F.setZone(zone);
  }

  function drawSetup() {
    setup.innerHTML = '';
    const lvl = levelOf('targets');
    setup.append(el('div', 'controls',
      select(PROGRESSIONS.map(p => [p.id, `${p.name} · ${STYLES[p.style].name.split(' (')[0]}`]), st.prog, v => { st.prog = v; st.key = null; drawSetup(); }, 'Grille'),
      select(T.TONICS.map(t => [t, N(t)]), key(), v => { st.key = v; drawSetup(); }, 'Tonalité'),
      el('div', 'field', el('span', null, 'Niveau'), seg(Object.entries(TARGET_LEVELS).map(([n, l]) => [n, n + ' · ' + l.name]), st.level, v => { st.level = +v; drawSetup(); }))));
    setup.append(el('p', { class: 'hint', html: `Ton niveau actuel : <b>${lvl}</b>. Tu peux choisir un autre niveau librement. Gamme de passage : ${N(key())} ${T.SCALES[preset().scale].name.toLowerCase()}. ${rich(preset().tip)}` }));
    player.setProgression(realized(), preset().bpm);
    showChord(0, realized());
  }
  drawSetup();
}

/* ================================================================
   2. APPEL ET RÉPONSE
   ================================================================ */
function makePhrase(scaleNotes, chord, len) {
  // phrase de `len` notes dans une octave, finissant sur une note de l'accord, rythme en croches
  const pool = scaleNotes.map(n => n.pc);
  const rhythms = [[0, 1, 2, 4], [0, 2, 3, 4, 6], [1, 2, 3, 4], [0, 1.5, 2, 3], [0, 0.5, 1, 2, 3], [2, 2.5, 3, 4]];
  const r = pick(rhythms.filter(x => x.length === len) .concat(rhythms)).slice(0, len);
  let idx = Math.floor(Math.random() * pool.length);
  const out = [];
  for (let i = 0; i < r.length; i++) {
    if (i === r.length - 1) { const ct = chord.notes.map(n => n.pc); let best = ct[0], bd = 99; ct.forEach(pc => { const k = pool.indexOf(pc); if (k >= 0 && Math.abs(k - idx) < bd) { bd = Math.abs(k - idx); best = pc; } }); out.push({ pc: best, t: r[i], long: true }); break; }
    out.push({ pc: pool[(idx + pool.length) % pool.length], t: r[i] });
    idx += pick([-2, -1, -1, 1, 1, 2]);
  }
  return out;
}

function callEx(main, params) {
  const st = { key: params.key || 'A', scale: 'minPenta', style: 'floyd', level: +(params.level || levelOf('call')) };
  const LEVELS = {
    1: ['Répète la phrase à l’identique', 'Reproduis exactement ce que tu entends (aide : les notes sont affichées).'],
    2: ['Même rythme, autres notes', 'Garde le rythme de l’appel, change les notes.'],
    3: ['Même début, autre fin', 'Commence comme l’appel, mais termine sur une autre note de l’accord.'],
    4: ['Réponse libre et contrastée', 'Réponds sans aide visuelle : si l’appel monte, descends ; s’il est dense, laisse de l’espace.']
  };
  const setup = el('div', 'panel'), play = el('div', 'panel');
  const phase = el('div', 'count-in', '—'), instr = el('div', 'instr');
  const F = new Fretboard({ frets: 15 });
  main.append(setup, play);
  let phraseNotes = [];
  const prog = () => T.realizeProgression(st.key, st.scale === 'minPenta' ? [['1', 'm7', 2], ['4', 'm7', 2]] : MODAL_VAMPS.dorian);
  const player = Player({ container: play, getConfig: () => ({ progression: prog(), style: st.style }),
    onSchedule: (t, info) => {
      // 2 mesures : mesure paire = appel (la machine joue), impaire = réponse (toi)
      if (info.beat !== 0) return;
      const sc = T.buildScale(st.key, st.scale);
      if (info.globalBar % 2 === 0) {
        const ph = makePhrase(sc, info.chord, st.level >= 3 ? 5 : 4);
        phraseNotes = ph;
        const base = 57 + ((T.pcOf(st.key) - 9 + 12) % 12);
        ph.forEach(n => { let m = base + ((n.pc - base) % 12 + 12) % 12; pluck(m, { when: t + n.t * info.beatLen / 2, vel: 0.55, dur: n.long ? 1.6 : 0.7 }); });
      }
    },
    onBeatExtra: e => { if (e.type === 'beat' && e.beat === 0) showPhase(e.globalBar % 2 === 0); },
    onChord: () => {},
    onStop: out => selfEval(out, { exercise: 'call', level: st.level, style: st.style, key: st.key, question: `Niveau ${st.level} (« ${LEVELS[st.level][0]} ») : combien de tes réponses respectaient la consigne ?`, onSaved: up => { if (up) { st.level++; drawSetup(); } } }) });
  play.append(el('div', 'target-box', el('div', null, phase, instr), el('div', null, F.root)));

  function showPhase(isCall) {
    phase.textContent = isCall ? 'APPEL' : 'À TOI';
    phase.style.color = isCall ? 'var(--info)' : 'var(--acc)';
    if (isCall) instr.innerHTML = 'Écoute.'; else instr.innerHTML = `<b>${LEVELS[st.level][0]}</b> — ${LEVELS[st.level][1]}`;
    if (!isCall && st.level <= 2) {
      const sc = T.buildScale(st.key, st.scale), z = T.scaleZones(sc)[0];
      const seq = phraseNotes.map(n => n.pc);
      F.setMarks(scaleMarks(sc, { labels: 'note', zone: z }).map(m => seq.includes(T.pcAt(m.s, m.f)) && m.f >= z.from && m.f <= z.to ? { ...m, cls: 'emph', label: (seq.indexOf(T.pcAt(m.s, m.f)) + 1) + '' } : { ...m, cls: m.cls + ' soft' }));
      F.setZone(z);
    } else if (isCall) { const sc = T.buildScale(st.key, st.scale); F.setMarks(scaleMarks(sc, { labels: 'iv', zone: T.scaleZones(sc)[0] })); F.setZone(T.scaleZones(sc)[0]); }
    else F.clear();
  }
  function drawSetup() {
    setup.innerHTML = '';
    setup.append(el('div', 'controls',
      select(T.TONICS.map(t => [t, N(t)]), st.key, v => { st.key = v; drawSetup(); }, 'Tonalité'),
      select([['minPenta', 'Penta mineure (boucle i – iv)'], ['dorian', 'Dorien (boucle i7 – IV7)']], st.scale, v => { st.scale = v; drawSetup(); }, 'Couleur'),
      select(Object.entries(STYLES).map(([k, s]) => [k, s.name]), st.style, v => { st.style = v; }, 'Style'),
      el('div', 'field', el('span', null, 'Niveau'), seg(Object.entries(LEVELS).map(([n, l]) => [n, n + ' · ' + l[0]]), st.level, v => { st.level = +v; drawSetup(); }))));
    setup.append(el('p', { class: 'hint', html: rich('Une mesure d’appel (la machine joue une courte phrase), une mesure de réponse (à toi). L’appel est généré au hasard dans la gamme et finit toujours sur une note de l’accord. Le dialogue est la base du [[motif|phrasé]] : une phrase, une réponse, du silence.') }));
    player.setProgression(prog(), 76);
    instr.innerHTML = 'Lance la lecture.';
  }
  drawSetup();
}

/* ================================================================
   3. DÉVELOPPER UN MOTIF
   ================================================================ */
const TRANSFORMS = [
  ['Joue le motif tel quel', 'Installe l’idée. Rythme précis.'],
  ['Répète-le à l’identique', 'La répétition est ce qui rend une idée mémorable.'],
  ['Transpose-le sur la note suivante de la gamme', 'Même forme, une marche plus haut (séquence).'],
  ['Change seulement le rythme', 'Mêmes notes, autre placement : allonge la dernière, décale le début.'],
  ['Ajoute une note à la fin', 'Prolonge l’idée vers une note de l’accord.'],
  ['Retourne le contour', 'Ce qui montait descend.'],
  ['Joue-le avec un bend ou un slide', 'Même notes, autre articulation (à la Gilmour).'],
  ['Raccourcis-le à ses 2 premières notes', 'Fragmentation : un morceau de l’idée suffit.'],
  ['Rejoue l’original pour conclure', 'Le retour donne la sensation de forme.']
];

function motifEx(main, params) {
  const st = { key: params.key || 'E', scale: 'minPenta', style: 'floyd', bars: 2, motif: null, step: -1 };
  const setup = el('div', 'panel'), play = el('div', 'panel');
  const F = new Fretboard({ frets: 15 });
  const stepBox = el('div', 'instr', 'Lance la lecture : une nouvelle transformation toutes les 2 mesures.');
  const list = el('ol', 'hint');
  main.append(setup, play);
  const progr = () => T.realizeProgression(st.key, [['1', 'm7', 2], ['b6', 'maj7', 2]]);
  const player = Player({ container: play, getConfig: () => ({ progression: progr(), style: st.style }),
    onSchedule: (t, info) => { if (info.beat === 0 && info.globalBar % st.bars === 0) { const k = Math.floor(info.globalBar / st.bars); setTimeout(() => showStep(k), Math.max(0, (t - ac().currentTime) * 1000)); } },
    onStop: out => selfEval(out, { exercise: 'motif', level: 1, style: st.style, key: st.key, question: 'Ton motif est-il resté reconnaissable à travers les transformations ?' }) });
  play.append(el('div', 'target-box', el('div', null, el('div', 'eyebrow', 'Transformation en cours'), stepBox, list), el('div', null, F.root, el('button', { class: 'btn ghost sm', onclick: () => playMotif() }, '▶ Écouter le motif'))));

  function newMotif() {
    const sc = T.buildScale(st.key, st.scale), z = T.scaleZones(sc)[0];
    const cands = [];
    for (let s = 1; s < 5; s++) for (let f = z.from; f <= z.to; f++) if (sc.some(n => n.pc === T.pcAt(s, f))) cands.push({ s, f });
    const start = Math.floor(Math.random() * Math.max(1, cands.length - 4));
    const m = [cands[start], cands[start + 1], cands[start + pick([2, 3])], cands[start + pick([0, 1])]].filter(Boolean);
    st.motif = m.slice(0, pick([3, 4]));
    showMotif();
  }
  function showMotif() {
    const sc = T.buildScale(st.key, st.scale), z = T.scaleZones(sc)[0];
    const marks = scaleMarks(sc, { labels: 'none', zone: z }).map(x => ({ ...x, cls: x.cls + ' soft' }));
    st.motif.forEach((p, i) => marks.push({ s: p.s, f: p.f, label: String(i + 1), role: 'root', cls: 'emph' }));
    F.setMarks(marks); F.setZone(z);
  }
  function playMotif() { const t0 = ac().currentTime + 0.05; st.motif.forEach((p, i) => pluck(T.midiAt(p.s, p.f), { when: t0 + i * 0.3, vel: 0.55, dur: i === st.motif.length - 1 ? 1.4 : 0.6 })); }
  function showStep(k) {
    const i = Math.min(k, TRANSFORMS.length - 1);
    stepBox.innerHTML = `<b>${i + 1}. ${TRANSFORMS[i][0]}</b><br><span class="hint">${TRANSFORMS[i][1]}</span>`;
    list.querySelectorAll('li').forEach((li, j) => li.style.color = j === i ? 'var(--acc)' : '');
  }
  function drawSetup() {
    setup.innerHTML = '';
    setup.append(el('div', 'controls',
      select(T.TONICS.map(t => [t, N(t)]), st.key, v => { st.key = v; newMotif(); }, 'Tonalité'),
      select([['minPenta', 'Penta mineure'], ['aeolian', 'Mineur naturel'], ['dorian', 'Dorien']], st.scale, v => { st.scale = v; newMotif(); }, 'Gamme'),
      select([[1, '1 mesure par étape'], [2, '2 mesures par étape'], [4, '4 mesures par étape']], st.bars, v => { st.bars = +v; }, 'Rythme des étapes'),
      el('button', { class: 'btn ghost', onclick: newMotif }, '🎲 Nouveau motif')));
    setup.append(el('p', { class: 'hint', html: rich('Un [[motif]] de 3-4 notes est proposé (numéros sur le manche) — tu peux aussi inventer le tien. Pendant la boucle, l’app te demande une transformation à la fois. L’objectif : qu’on reconnaisse toujours l’idée de départ. C’est ce qui sépare un solo construit d’une suite de plans.') }));
    list.innerHTML = ''; TRANSFORMS.forEach(t => list.append(el('li', null, t[0])));
    player.setProgression(progr(), 70);
  }
  drawSetup(); newMotif();
}

/* ================================================================
   4. MODES
   ================================================================ */
function modesEx(main, params) {
  const st = { mode: MODAL_VAMPS[params.mode] ? params.mode : 'dorian', key: params.key || 'A', style: params.style || 'floyd' };
  const setup = el('div', 'panel'), play = el('div', 'panel');
  const F = new Fretboard({ frets: 15 });
  const instr = el('div', 'instr'), why = el('div', 'lesson-txt');
  main.append(setup, play);
  const prog = () => T.realizeProgression(st.key, MODAL_VAMPS[st.mode]);
  const player = Player({ container: play, getConfig: () => ({ progression: prog(), style: st.style }),
    onChord: (i, c) => {
      const info = MODE_INFO[st.mode], sc = T.buildScale(st.key, st.mode);
      const chars = sc.filter(n => info.char.includes(n.iv));
      const inChord = chars.filter(n => c.notes.some(x => x.pc === n.pc));
      instr.innerHTML = i === 0 ? `Sur <b>${CF(c.symbol)}</b> (accord maison) : fais entendre ${chars.map(n => `<b>${N(n.name)}</b> (${IV(n.iv)})`).join(' et ')} — tiens-la, ajoute du vibrato.`
        : `Sur <b>${CF(c.symbol)}</b> : ${inChord.length ? `${inChord.map(n => N(n.name)).join(', ')} est une note de l’accord — atterris dessus.` : `garde la couleur et prépare le retour sur ${N(st.key)}.`}`;
    },
    onStop: out => selfEval(out, { exercise: 'modes', level: 1, style: st.style, key: st.key + ' ' + st.mode, question: `As-tu réussi à faire entendre la couleur ${MODE_INFO[st.mode].name.toLowerCase()} (et pas juste « du mineur » ou « du majeur ») ?` }) });
  play.append(el('div', 'target-box', el('div', null, el('div', 'eyebrow', 'Consigne'), instr, why), el('div', null, F.root, legend([['root', 'Tonique'], ['third', 'Tierce'], ['fifth', 'Quinte']]), el('p', 'hint', 'Contour blanc : note caractéristique.'))));

  function drawSetup() {
    setup.innerHTML = '';
    setup.append(el('div', 'controls',
      select(T.MODE_IDS.map(id => [id, MODE_INFO[id].name]), st.mode, v => { st.mode = v; drawSetup(); }, 'Mode'),
      select(T.TONICS.map(t => [t, N(t)]), st.key, v => { st.key = v; drawSetup(); }, 'Tonique'),
      select(Object.entries(STYLES).map(([k, s]) => [k, s.name]), st.style, v => { st.style = v; }, 'Style')));
    const info = MODE_INFO[st.mode], sc = T.buildScale(st.key, st.mode);
    F.setMarks(scaleMarks(sc, { labels: 'iv', emphasize: info.char }));
    why.innerHTML = rich(`<p class="hint">${N(st.key)} ${info.name.toLowerCase()} = ${sc.map(n => N(n.name)).join(' ')} · gamme parente : ${N(T.parentMajor(st.key, st.mode))} majeur. ${info.why}</p>`);
    instr.innerHTML = `Lance la boucle. La note à faire entendre : <b>${sc.filter(n => info.char.includes(n.iv)).map(n => N(n.name) + ' (' + IV(n.iv) + ')').join(', ')}</b>.`;
    setup.append(el('a', { class: 'btn ghost sm', href: `#/parcours?n=m3-${st.mode}` }, 'Revoir la leçon ' + info.name.toLowerCase()));
    player.setProgression(prog(), 72);
  }
  drawSetup();
}

/* ================================================================
   5. LIBRE
   ================================================================ */
function freeEx(main, params) {
  const custom = params.prog ? decodeProg(params.prog) : null;
  const st = { key: params.key || 'E', scale: T.SCALES[params.scale] ? params.scale : 'aeolian', style: STYLES[params.style] ? params.style : 'floyd', preset: custom ? 'custom' : 'floyd-numb', custom, live: true };
  const setup = el('div', 'panel'), play = el('div', 'panel');
  const F = new Fretboard({ frets: 15 });
  main.append(setup, play);
  const chords = () => st.preset === 'custom' ? st.custom : PROGRESSIONS.find(p => p.id === st.preset).chords;
  const prog = () => T.realizeProgression(st.key, chords());
  const scale = () => T.buildScale(st.key, st.scale);
  const paint = c => {
    const marks = scaleMarks(scale(), { labels: 'iv' });
    if (c && st.live) { const pcs = new Set(c.notes.map(n => n.pc)); marks.forEach(m => { if (!pcs.has(T.pcAt(m.s, m.f))) m.cls += ' soft'; else m.cls += ' emph'; }); }
    F.setMarks(marks);
  };
  const player = Player({ container: play, getConfig: () => ({ progression: prog(), style: st.style }), onChord: (i, c) => paint(c),
    onStop: out => { paint(null); selfEval(out, { exercise: 'free', level: 0, style: st.style, key: st.key + ' ' + st.scale, question: 'Globalement, ton impro racontait-elle quelque chose (début, développement, fin) plutôt qu’une suite de plans ?' }); } });
  play.append(F.root, el('label', 'row hint', Object.assign(el('input', { type: 'checkbox' }), { checked: true, onchange: e => { st.live = e.target.checked; } }), ' Mettre en évidence les notes de l’accord en cours pendant la lecture'));

  function drawSetup() {
    setup.innerHTML = '';
    const presets = [...(st.custom ? [['custom', 'Ma grille (' + T.realizeProgression(st.key, st.custom).map(c => c.symbol).join(' – ') + ')']] : []), ...PROGRESSIONS.map(p => [p.id, p.name])];
    setup.append(el('div', 'controls',
      select(T.TONICS.map(t => [t, N(t)]), st.key, v => { st.key = v; drawSetup(); }, 'Tonalité'),
      select(presets, st.preset, v => { st.preset = v; if (v !== 'custom') { const p = PROGRESSIONS.find(x => x.id === v); st.scale = p.scale; st.style = p.style; } drawSetup(); }, 'Progression'),
      select(Object.keys(T.SCALES).map(id => [id, T.SCALES[id].name]), st.scale, v => { st.scale = v; drawSetup(); }, 'Gamme / mode'),
      select(Object.entries(STYLES).map(([k, s]) => [k, s.name]), st.style, v => { st.style = v; }, 'Style')));
    const p = PROGRESSIONS.find(x => x.id === st.preset);
    const sc = new Set(scale().map(n => n.pc));
    const outside = prog().flatMap(c => c.notes.filter(n => !sc.has(n.pc)).map(n => `${N(n.name)} dans ${CF(c.symbol)}`));
    setup.append(el('p', { class: 'hint', html: (p ? rich(p.tip) + ' ' : '') + (outside.length ? `Attention : ${[...new Set(outside)].join(', ')} ${outside.length > 1 ? 'ne sont' : 'n’est'} pas dans la gamme choisie — c’est une cible intéressante, ou un signe qu’une autre gamme colle mieux.` : 'Toutes les notes des accords sont dans la gamme choisie.') }),
      el('p', 'hint', 'Pour construire ta propre grille : Chord Lab → Harmoniser → « + grille » → « Improviser sur cette grille ».'));
    player.setProgression(prog(), p ? p.bpm : 80);
    paint(null);
  }
  drawSetup();
}

/* ---------------- historique ---------------- */
function historyPanel() {
  const box = el('div', 'panel');
  box.append(el('h3', null, 'Tes derniers bilans'));
  const list = (state().impro || []).slice(-8).reverse();
  if (!list.length) { box.append(el('p', 'empty', 'Aucun bilan pour l’instant. Ils apparaissent ici après chaque exercice.')); return box; }
  const tbl = el('table', 'tbl');
  tbl.append(el('tr', null, el('th', null, 'Date'), el('th', null, 'Exercice'), el('th', null, 'Niveau'), el('th', null, 'Bilan'), el('th', null, 'Note')));
  const lab = ['', 'presque jamais', '< moitié', 'la plupart', 'quasi toujours'];
  list.forEach(x => tbl.append(el('tr', null, el('td', 'mono', x.d), el('td', null, (EXERCISES.find(e => e[0] === x.exercise) || [, x.exercise])[1]), el('td', 'mono', x.level || '—'), el('td', null, lab[x.self]), el('td', 'hint', x.note || ''))));
  box.append(el('div', 'tbl-wrap', tbl));
  return box;
}
