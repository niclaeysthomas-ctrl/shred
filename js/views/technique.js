/* ================================================================
   TECHNIQUE LAB
   Chaque exercice : objectif, explication, mouvement animé au métronome,
   difficulté, durée, tempo de départ, objectif, critère de réussite.
   Bends et vibrato : mesure RÉELLE de la hauteur au micro (une note tenue).
   ================================================================ */
import * as T from '../theory.js';
import { el, N, rich, seg, toast, fmtDate, plain } from '../ui.js';
import { TECHNIQUE, techById, PICK_PATH, parseTab, perBeatOf } from '../content/technique.js';
import { Fretboard } from '../fretboard.js';
import { Metronome, pluck, ac, click } from '../audio.js';
import { state, recordTempo, today, addPractice, isSessionLive, recordMeasure } from '../store.js';
import { PitchListener, midiLabel } from '../pitch.js';
import { checkTechNotions, passBpmOf } from './path.js';
const passBpm = passBpmOf;

let metro = null, listener = null, t0 = null;
export function leave() { if (metro) metro.stop(); if (listener) listener.stop(); listener = null; flush(); }
function flush() { if (t0) { if (!isSessionLive()) addPractice((Date.now() - t0) / 1000); t0 = null; } }

const LEVEL = { 1: 'Fondation', 2: 'Intermédiaire', 3: 'Avancé' };

export function render(main, params) {
  const ex = params.ex && techById(params.ex);
  main.append(el('div', 'page-head', el('div', null, el('div', 'eyebrow', 'Technique Lab'), el('h1', null, ex ? ex.name : 'Technique'),
    el('p', null, ex ? plain(ex.goal) : 'La propreté avant la vitesse. On n’augmente le tempo que quand 3 passages d’affilée sont propres. Les techniques avancées se débloquent quand les bases sont travaillées.'))));
  if (ex) return detail(main, ex);

  const S = state();
  // module médiator
  const pm = el('div', 'panel hl');
  pm.append(el('div', 'panel-title', el('h3', null, '🎸 Module médiator : des doigts au médiator'), el('span', 'tag acc', 'priorité')),
    el('p', 'lead', 'Tu joues surtout aux doigts : voici l’ordre recommandé. Chaque étape a un tempo « validé » à atteindre proprement avant de passer à la suivante (c’est toi qui déclares le tempo propre).'));
  const steps = el('div', 'block-list');
  PICK_PATH.forEach((id, i) => {
    const t = techById(id), r = S.tempos[id], pass = passBpm(t), ok = r && r.clean >= pass;
    steps.append(el('a', { class: 'block' + (ok ? ' done' : ''), href: '#/technique?ex=' + id, style: { textDecoration: 'none', color: 'inherit' } },
      el('span', 'bi', ok ? '✓' : String(i + 1)), el('div', null, el('b', 'bt', t.name), el('small', null, `Validé à ${pass} BPM propre · record : ${r && r.clean ? r.clean : '—'}`)), el('span', 'bm', LEVEL[t.level])));
  });
  pm.append(steps);
  main.append(pm);

  const unlocked3 = TECHNIQUE.filter(t => t.level === 2 && (S.tempos[t.id]?.history.length || 0) >= 3).length >= 2;
  const cats = [...new Set(TECHNIQUE.map(t => t.cat))];
  cats.forEach(c => {
    main.append(el('h2', 'sec', c));
    const g = el('div', 'grid-auto');
    TECHNIQUE.filter(t => t.cat === c).forEach(t => {
      const r = S.tempos[t.id], locked = t.level === 3 && !unlocked3;
      g.append(el('a', { class: 'card-link', href: locked ? null : '#/technique?ex=' + t.id, style: locked ? { opacity: .5 } : {}, onclick: locked ? () => toast('Avancé : se débloque après 3 séances sur au moins 2 exercices intermédiaires.') : null },
        el('div', null, el('b', null, t.name), el('small', null, `${LEVEL[t.level]} · ${t.minutes} min · ${t.start ? `${t.start} → ${t.target} BPM` : 'justesse'}${r && r.clean ? ` · record ${r.clean}` : ''}${locked ? ' · 🔒' : ''}`)), el('span', 'chev', '›')));
    });
    main.append(g);
  });
}

export { passBpmOf as passBpm } from './path.js';

function detail(main, t) {
  main.append(el('a', { class: 'btn ghost sm', href: '#/technique' }, '← Tous les exercices'), el('div', { style: { height: '12px' } }));
  const S = state(), rec = S.tempos[t.id];
  const g = el('div', 'grid2');
  const info = el('div', 'panel');
  const row = (k, v) => el('div', { class: 'row', style: { padding: '5px 0', borderBottom: '1px solid var(--line)' } }, el('span', 'hint', k), el('span', 'spacer'), el('b', null, v));
  info.append(el('h3', null, 'La fiche'),
    row('Difficulté', '●'.repeat(t.level) + '○'.repeat(3 - t.level) + ' ' + LEVEL[t.level]), row('Durée recommandée', t.minutes + ' min'),
    row('Tempo de départ', t.start ? t.start + ' BPM (' + t.unit + ')' : '— (justesse)'), row('Objectif', t.target ? t.target + ' BPM' : 'note juste à l’oreille / au micro'),
    row('Palier validé', t.start ? passBpm(t) + ' BPM propre' : '—'), row('Ton record propre', rec && rec.clean ? rec.clean + ' BPM' : '—'),
    el('p', { class: 'lesson-txt', style: { marginTop: '10px' }, html: rich('<b>Explication.</b> ' + t.how) }),
    el('p', { html: '<b>Critère de réussite.</b> ' + t.success }));
  g.append(info);

  // visuel animé
  const vis = el('div', 'panel');
  const ev = parseTab(t.tab);
  const cols = [...new Set(ev.map(e => e.col))];
  const stepsArr = cols.map(c => ev.filter(e => e.col === c));
  const picks = (t.picks || '').split(/\s+/).filter(x => /[↓↑T]/.test(x));
  const lo = Math.max(0, Math.min(...ev.map(e => e.f)) - 1), hi = Math.max(...ev.map(e => e.f)) + 2;
  const F = new Fretboard({ frets: Math.max(12, Math.min(17, hi)), compact: true, sound: true });
  const arrow = el('div', { class: 'now-chord', style: { minWidth: '60px', textAlign: 'center' } }, '·');
  const tab = el('pre', 'tab');
  const drawTab = colIdx => {
    tab.innerHTML = '';
    t.tab.forEach(line => {
      if (colIdx == null) { tab.append(line + '\n'); return; }
      const c = cols[colIdx]; const m = /\d+/.exec(line.slice(c));
      if (m && m.index === 0) { tab.append(line.slice(0, c)); tab.append(el('b', { style: { color: 'var(--acc)', background: 'rgba(255,181,71,.18)' } }, m[0])); tab.append(line.slice(c + m[0].length) + '\n'); }
      else tab.append(line + '\n');
    });
  };
  const showStep = k => {
    const marks = ev.map(e => ({ s: e.s, f: e.f, label: String(e.f), role: 'none', cls: 'soft' }));
    if (k != null) stepsArr[k].forEach(e => marks.push({ s: e.s, f: e.f, label: String(e.f), role: 'root', cls: 'emph' }));
    F.setMarks(marks); drawTab(k);
    arrow.textContent = k == null ? '·' : (picks.length ? picks[k % picks.length] : '•');
  };
  showStep(null);
  vis.append(el('h3', null, 'Le mouvement'), el('div', 'row', arrow, el('div', { style: { flex: 1, minWidth: 0 } }, tab)), F.root,
    el('p', 'hint', `Au métronome, la note à jouer s’allume et la flèche indique le sens du médiator (${perBeatOf(t)} notes par clic). Coche « entendre l’exemple » pour que l’app joue les notes avec toi.`));
  g.append(vis);
  main.append(g);

  // métronome
  const mp = el('div', 'panel hl');
  let bpm = rec && rec.clean ? Math.min(t.target || 999, rec.clean) : (t.start || 60);
  const label = el('b', null, bpm);
  let demo = false, step = 0;
  const setB = v => { bpm = Math.max(30, Math.min(240, v)); label.textContent = bpm; if (metro && metro.on) restart(); };
  const go = el('button', { class: 'btn' }, '▶ Métronome');
  const restart = () => { start(); };
  function start() {
    metro = metro || new Metronome();
    const per = perBeatOf(t);
    metro.stop(); step = 0;
    // le métronome bat à bpm × notes par temps pour animer chaque note ; seul 1 clic sur `per` est audible via accent
    metro.start(bpm, n => {
      const k = step % stepsArr.length; showStep(k);
      if (demo) stepsArr[k].forEach(e => pluck(T.midiAt(e.s, e.f), { vel: 0.35, dur: 0.5 }));
      step++;
    }, 4, per);
    t0 = t0 || Date.now();
    go.textContent = '■ Stop';
  }
  go.addEventListener('click', () => { if (metro && metro.on) { metro.stop(); go.textContent = '▶ Métronome'; showStep(null); flush(); } else { try { ac(); start(); } catch (e) { toast(e.message, 'bad'); } } });
  if (t.start) {
    const nextTxt = el('p', 'hint');
    const upd = () => { const r = state().tempos[t.id]; nextTxt.innerHTML = r && r.clean ? `Prochain palier conseillé : <b>${Math.min(t.target, r.clean + 4)} BPM</b> (record + 4), seulement si 3 passages d’affilée sont propres. Sinon, redescends de 8.` : `Commence à ${t.start} BPM.`; };
    upd();
    mp.append(el('h3', null, 'Métronome'), el('div', 'bpm', el('button', { class: 'btn ghost sm', onclick: () => setB(bpm - 4) }, '−4'), label, el('button', { class: 'btn ghost sm', onclick: () => setB(bpm + 4) }, '+4'), el('span', 'hint', 'BPM · ' + t.unit), go),
      el('label', 'row hint', Object.assign(el('input', { type: 'checkbox' }), { onchange: e => demo = e.target.checked }), ' Entendre l’exemple'),
      nextTxt,
      el('div', 'row', el('button', { class: 'btn ghost', onclick: () => { recordTempo(t.id, bpm); const v = checkTechNotions(); toast(`${bpm} BPM propre enregistré.` + (v.length ? ' Notion validée : ' + v.join(', ') : ''), 'ok'); upd(); drawHist(); } }, `✓ 3 passages propres à ${''}ce tempo`)));
  } else {
    mp.append(el('h3', null, 'Pratique'), el('div', 'row', go, el('label', 'row hint', Object.assign(el('input', { type: 'checkbox' }), { onchange: e => demo = e.target.checked }), ' Entendre l’exemple')),
      el('button', { class: 'btn ghost', style: { marginTop: '10px' }, onclick: () => { recordTempo(t.id, 0); const v = checkTechNotions(); toast('Séance notée.' + (v.length ? ' Notion validée : ' + v.join(', ') : ''), 'ok'); drawHist(); } }, '✓ Séance faite (critère atteint)'));
  }
  main.append(mp);

  if (t.id === 'bends' || t.id === 'vibrato') main.append(pitchPanel(t));

  // historique
  const hp = el('div', 'panel');
  const drawHist = () => {
    hp.innerHTML = '';
    hp.append(el('h3', null, 'Ton historique'));
    const r = state().tempos[t.id];
    if (!r || !r.history.length) { hp.append(el('p', 'empty', 'Rien encore. Enregistre un tempo propre pour suivre ta progression.')); return; }
    if (t.start) {
      const h = r.history.slice(-30), mx = Math.max(t.target, ...h.map(x => x.bpm)), mn = Math.min(t.start, ...h.map(x => x.bpm)) - 5;
      hp.append(el('div', 'bars', ...h.map(x => el('i', { class: 'on', title: `${fmtDate(x.d)} : ${x.bpm} BPM`, style: { height: Math.max(4, 100 * (x.bpm - mn) / (mx - mn)) + '%' } }))),
        el('p', 'hint', `${h.length} enregistrement(s). Départ ${t.start}, record ${r.clean}, objectif ${t.target} BPM.`));
    } else hp.append(el('p', null, `${r.history.length} séance(s), dernière le ${fmtDate(r.history[r.history.length - 1].d)}.`));
  };
  drawHist();
  main.append(hp);
}

/* Justesse des bends / régularité du vibrato, mesurées au micro */
function pitchPanel(t) {
  const box = el('div', 'panel');
  const isBend = t.id === 'bends';
  let target = 64;
  const big = el('div', { class: 'now-chord', style: { textAlign: 'center' } }, '—');
  const cents = el('div', { class: 'mono', style: { textAlign: 'center', fontSize: '18px' } }, '');
  const W = 600, H = 120;
  const cv = el('canvas', { width: W, height: H, style: { width: '100%', height: '120px', background: 'var(--bg2)', borderRadius: '9px', border: '1px solid var(--line)' } });
  const ctx2 = cv.getContext('2d');
  const hist = [], histT = [];
  const stats = el('p', 'hint');
  const btn = el('button', { class: 'btn' }, '🎤 Écouter au micro');
  box.append(el('h3', null, isBend ? 'Justesse du bend — mesurée' : 'Régularité du vibrato — mesurée'),
    el('p', 'lead', isBend ? 'Tiens ton bend : l’app mesure la hauteur réelle au micro et l’écart avec la cible, en cents (100 cents = 1 demi-ton). Joue une seule note à la fois, ampli peu saturé ou guitare débranchée près du micro.'
      : 'Tiens une note avec vibrato : la courbe montre la hauteur dans le temps. Un bon vibrato = des vagues régulières, de même amplitude. Une seule note, son clair de préférence.'));
  if (isBend) {
    const sel = el('select', null, ...[[64, 'Cible E4 (bend 1 ton depuis D, case 7 corde de Sol)'], [66, 'Cible F♯4 (bend 1 ton depuis E, case 9 corde de Sol)'], [63, 'Cible D♯4 (bend ½ ton depuis D, case 7 corde de Sol)'], [71, 'Cible B4 (bend 1 ton depuis A, case 10 corde de Si)'], [69, 'Cible A4 (bend 1 ton depuis G, case 8 corde de Si)']].map(([v, l]) => el('option', { value: v }, l)));
    sel.addEventListener('change', () => target = +sel.value);
    box.append(el('div', 'row', el('label', 'field', el('span', null, 'Cible'), sel), el('button', { class: 'btn ghost sm', onclick: () => pluck(target, { dur: 2.4, vel: 0.6 }) }, '🔊 Entendre la cible')));
  }
  box.append(el('div', 'row', btn), big, cents, cv, stats,
    el('p', 'hint', 'Ce que ça mesure : la hauteur d’une note tenue. Ce que ça ne mesure pas : le son, l’attaque, le jeu rapide ou les accords.'));

  const draw = () => {
    ctx2.clearRect(0, 0, W, H);
    ctx2.strokeStyle = '#343a46'; ctx2.beginPath(); ctx2.moveTo(0, H / 2); ctx2.lineTo(W, H / 2); ctx2.stroke();
    ctx2.fillStyle = '#5c6473'; ctx2.font = '11px monospace'; ctx2.fillText(isBend ? 'cible' : 'moyenne', 4, H / 2 - 4); ctx2.fillText('+50 c', 4, 12); ctx2.fillText('−50 c', 4, H - 4);
    const pts = hist.slice(-W / 2);
    const ref = isBend ? target : (pts.length ? pts.reduce((a, b) => a + (b ?? 0), 0) / pts.filter(x => x != null).length || 0 : 0);
    ctx2.strokeStyle = '#ffb547'; ctx2.lineWidth = 2; ctx2.beginPath(); let started = false;
    pts.forEach((m, i) => { if (m == null) { started = false; return; } const y = H / 2 - (m - ref) * 100 / 50 * (H / 2); const x = i * 2; if (!started) { ctx2.moveTo(x, y); started = true; } else ctx2.lineTo(x, y); });
    ctx2.stroke();
  };

  btn.addEventListener('click', async () => {
    if (listener) { listener.stop(); listener = null; btn.textContent = '🎤 Écouter au micro'; summarize(); return; }
    try {
      listener = new PitchListener(); hist.length = 0; histT.length = 0;
      await listener.start((p, tt) => {
        hist.push(p && p.clarity > 0.8 ? p.midi : null); histT.push(tt);
        if (hist.length > 1200) { hist.shift(); histT.shift(); }
        if (p && p.clarity > 0.8) {
          big.textContent = N(midiLabel(p.midi).replace(/\d+$/, '')) + midiLabel(p.midi).match(/-?\d+$/)[0];
          if (isBend) { const c = Math.round((p.midi - target) * 100); cents.textContent = (c > 0 ? '+' : '') + c + ' cents ' + (Math.abs(c) <= 10 ? '✓ juste' : c < 0 ? '↑ pousse encore' : '↓ trop haut'); cents.style.color = Math.abs(c) <= 10 ? 'var(--ok)' : Math.abs(c) <= 25 ? 'var(--mid)' : 'var(--bad)'; }
          else cents.textContent = '';
        }
        draw();
      });
      btn.textContent = '■ Arrêter et analyser';
    } catch (e) { listener = null; toast('Micro refusé ou indisponible.', 'bad'); }
  });

  function summarize() {
    const v = hist.filter(x => x != null);
    if (v.length < 30) { stats.textContent = 'Pas assez de son détecté pour analyser (note trop courte ou trop faible).'; return; }
    if (isBend) {
      const last = v.slice(-Math.min(v.length, 40));
      const avg = last.reduce((a, b) => a + b, 0) / last.length;
      const c = Math.round((avg - target) * 100);
      recordMeasure('bends', c, Math.abs(c) <= 10);
      const v2 = checkTechNotions(); if (v2.length) toast('Notion validée : ' + v2.join(', '), 'ok');
      stats.innerHTML = `Fin de la note tenue : écart moyen <b>${c > 0 ? '+' : ''}${c} cents</b> avec la cible. ${Math.abs(c) <= 10 ? 'Juste.' : Math.abs(c) <= 25 ? 'Presque : à l’oreille, c’est perceptible.' : c < 0 ? 'Bend trop court : pousse plus loin.' : 'Bend trop haut : relâche un peu.'}`;
    } else {
      // amplitude et régularité : détection des extrêmes locaux
      const sm = v.map((x, i) => (v[i - 1] ?? x) / 4 + x / 2 + (v[i + 1] ?? x) / 4);
      const ext = [];
      for (let i = 1; i < sm.length - 1; i++) if ((sm[i] > sm[i - 1] && sm[i] >= sm[i + 1]) || (sm[i] < sm[i - 1] && sm[i] <= sm[i + 1])) { if (!ext.length || Math.abs(sm[i] - sm[ext[ext.length - 1]]) > 0.08) ext.push(i); }
      if (ext.length < 4) { stats.textContent = 'Pas d’oscillation nette détectée : vibrato trop faible ou trop irrégulier.'; return; }
      const amps = [], periods = [];
      for (let i = 1; i < ext.length; i++) { amps.push(Math.abs(sm[ext[i]] - sm[ext[i - 1]]) * 100); periods.push(ext[i] - ext[i - 1]); }
      const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
      const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
      const valid = histT.filter((_, i) => hist[i] != null); const fps = valid.length > 1 ? (valid.length - 1) / (valid[valid.length - 1] - valid[0] || 1) : 60;
      const rate = fps / (2 * mean(periods));
      const reg = Math.max(0, Math.round(100 - 100 * sd(periods) / mean(periods)));
      recordMeasure('vibrato', { amp: Math.round(mean(amps)), rate: +rate.toFixed(1), reg }, reg >= 70 && mean(amps) >= 30);
      const v3 = checkTechNotions(); if (v3.length) toast('Notion validée : ' + v3.join(', '), 'ok');
      stats.innerHTML = `Amplitude moyenne <b>${Math.round(mean(amps))} cents</b> (±${Math.round(sd(amps))}) · vitesse <b>${rate.toFixed(1)} oscillations/s</b> · régularité du rythme : <b>${Math.max(0, Math.round(100 - 100 * sd(periods) / mean(periods)))} %</b>. Un vibrato « à la Gilmour » est large (50 à 100 cents) et lent (4-5/s) ; la régularité compte plus que la vitesse.`;
    }
  }
  return box;
}
