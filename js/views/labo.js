/* ================================================================
   LE LABO : manche interactif · gammes & modes · Chord Lab
   L'état des sélecteurs est écrit dans l'adresse (#/labo/...?tonic=A&scale=dorian)
   pour que le parcours puisse ouvrir le labo sur le bon exemple.
   ================================================================ */
import * as T from '../theory.js';
import { el, N, IV, seg, select, toast, rich } from '../ui.js';
import { Fretboard, scaleMarks, compareMarks, voicingMarks, legend, STD_LEGEND, labelFor } from '../fretboard.js';
import { pluck, playNotes, arpeggio, voicingMidis, closeVoicing } from '../audio.js';
import { MODE_INFO } from '../content/modes.js';
import { PROGRESSIONS, MODAL_VAMPS } from '../content/progressions.js';
import { CHORD_WHY, CHORD_NEXT } from '../content/chords.js';
import { state, update } from '../store.js';

const SCALE_ORDER = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian', 'minPenta', 'majPenta', 'blues', 'harmMinor', 'phrygDom'];
const tonicOpts = () => T.TONICS.map(t => [t, N(t)]);
const scaleOpts = (ids = SCALE_ORDER) => ids.map(id => [id, T.SCALES[id].name]);
const CF = s => String(s).replace(/^([A-G][♯♭𝄪𝄫]*)/, m => N(m));

function setQuery(sub, params) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
  history.replaceState(null, '', '#/labo/' + sub + (q ? '?' + q : ''));
}

export function render(main, params, sub) {
  const tab = sub[0] || 'manche';
  main.append(el('div', 'page-head',
    el('div', null, el('div', 'eyebrow', 'Labo'), el('h1', null, { manche: 'Le manche', gammes: 'Gammes & modes', accords: 'Chord Lab' }[tab] || 'Labo')),
    seg([['manche', 'Manche'], ['gammes', 'Gammes & modes'], ['accords', 'Chord Lab']], tab, v => { location.hash = '#/labo/' + v; })));
  if (tab === 'gammes') return scalesView(main, params);
  if (tab === 'accords') return chordsView(main, params);
  return fretView(main, params);
}

/* Bandeau d'info quand on touche une case */
function infoBar() {
  const bar = el('div', 'fb-info', el('span', null, 'Touche une case pour entendre la note et voir son rôle.'));
  bar.show = (s, f, ctx) => {
    const pc = T.pcAt(s, f);
    const parts = [];
    let name = T.PC_NAMES[pc];
    if (ctx && ctx.notes) { const n = ctx.notes.find(x => x.pc === pc); if (n) name = n.name; }
    parts.push(el('b', null, N(name)));
    if (ctx && ctx.tonic) {
      const iv = ctx.notes && ctx.notes.find(x => x.pc === pc)?.iv || T.ivBetween(T.pcOf(ctx.tonic), pc);
      const inSet = ctx.notes ? ctx.notes.some(x => x.pc === pc) : true;
      parts.push(el('span', null, `${IV(iv)} — ${T.ivName(iv)} par rapport à ${N(ctx.tonic)}`));
      if (ctx.notes && !inSet) parts.push(el('span', 'tag bad', 'hors gamme'));
      if (ctx.char && ctx.char.includes(iv)) parts.push(el('span', 'tag acc', 'note caractéristique'));
    }
    parts.push(el('span', 'mono', `corde ${6 - s} · case ${f}`));
    bar.innerHTML = ''; bar.append(...parts);
  };
  return bar;
}

/* ================================================================
   MANCHE
   ================================================================ */
function fretView(main, p) {
  const st = {
    view: p.view || 'scale', tonic: p.tonic || 'A', scale: p.scale || 'dorian', type: p.type || 'm7',
    cmp: p.cmp || 'aeolian', labels: p.labels || state().settings.labels || 'note', zone: p.zone != null ? +p.zone : -1,
    frets: +(p.frets || state().settings.frets || 15), naturals: p.nat === '1', hidden: p.hide === '1', emph: p.emph !== '0'
  };
  const panel = el('div', 'panel');
  const controls = el('div', 'controls');
  const info = infoBar();
  let ctx = null;
  const F = new Fretboard({ frets: st.frets, onTap: (s, f) => {
    info.show(s, f, ctx);
    if (st.view === 'notes' && st.hidden) F.addMark({ s, f, label: labelFor({ name: T.PC_NAMES[T.pcAt(s, f)], iv: T.ivBetween(T.pcOf(st.tonic), T.pcAt(s, f)) }, st.labels === 'none' ? 'note' : st.labels), role: 'none' });
  } });
  const below = el('div');
  panel.append(controls, F.root, info, below);
  main.append(panel);
  const explain = el('div');
  main.append(explain);

  function draw() {
    setQuery('manche', { view: st.view, tonic: st.tonic, scale: st.scale, type: st.type, cmp: st.cmp, labels: st.labels, zone: st.zone >= 0 ? st.zone : null, frets: st.frets !== 15 ? st.frets : null, nat: st.naturals ? 1 : null, hide: st.hidden ? 1 : null });
    controls.innerHTML = ''; below.innerHTML = ''; explain.innerHTML = '';
    controls.append(
      select([['notes', 'Notes du manche'], ['scale', 'Gamme / mode'], ['chord', 'Accord'], ['compare', 'Comparer deux gammes']], st.view, v => { st.view = v; st.zone = -1; draw(); }, 'Affichage'),
      select(tonicOpts(), st.tonic, v => { st.tonic = v; draw(); }, st.view === 'chord' ? 'Fondamentale' : 'Tonique'));
    if (st.view === 'scale' || st.view === 'compare') controls.append(select(scaleOpts(), st.scale, v => { st.scale = v; st.zone = -1; draw(); }, st.view === 'compare' ? 'Gamme A' : 'Gamme / mode'));
    if (st.view === 'compare') controls.append(select(scaleOpts(), st.cmp, v => { st.cmp = v; draw(); }, 'Gamme B'));
    if (st.view === 'chord') controls.append(select(T.CHORD_ORDER.map(id => [id, T.CHORD_TYPES[id].name + ' (' + (T.CHORD_TYPES[id].sym || 'maj') + ')']), st.type, v => { st.type = v; draw(); }, 'Accord'));
    controls.append(select([['note', 'Noms des notes'], ['iv', 'Intervalles'], ['deg', 'Degrés'], ['none', 'Rien (points)']], st.labels, v => { st.labels = v; update(s => s.settings.labels = v); draw(); }, 'Étiquettes'));

    let notes = null;
    if (st.view === 'scale' || st.view === 'compare') notes = T.buildScale(st.tonic, st.scale);
    if (st.view === 'chord') notes = T.buildChord(st.tonic, st.type);
    if (notes && st.view !== 'chord') {
      const zones = T.scaleZones(notes, st.frets);
      controls.append(select([[-1, 'Tout le manche'], ...zones.map((z, i) => [i, `Position ${i + 1} · cases ${z.from}–${z.to}`])], st.zone, v => { st.zone = +v; draw(); }, 'Zone'));
    }
    controls.append(select([[12, '12 cases'], [15, '15 cases'], [22, '22 cases']], st.frets, v => { st.frets = +v; update(s => s.settings.frets = +v); F.setFrets(+v); draw(); }, 'Longueur'));

    const zone = notes && st.view !== 'chord' && st.zone >= 0 ? T.scaleZones(notes, st.frets)[st.zone] : null;
    F.setZone(zone);
    ctx = { tonic: st.tonic, notes };

    if (st.view === 'notes') {
      const tpc = T.pcOf(st.tonic), marks = [];
      if (!st.hidden) for (let s = 0; s < 6; s++) for (let f = 0; f <= st.frets; f++) {
        const pc = T.pcAt(s, f), nm = T.PC_NAMES[pc];
        if (st.naturals && nm.length > 1) continue;
        const iv = T.ivBetween(tpc, pc);
        marks.push({ s, f, label: st.labels === 'iv' || st.labels === 'deg' ? IV(iv) : st.labels === 'none' ? '' : N(nm), role: st.labels === 'iv' || st.labels === 'deg' ? T.ivRole(iv) : (pc === tpc ? 'root' : 'none') });
      }
      F.setMarks(marks);
      below.append(el('div', 'row',
        seg([['0', 'Toutes les notes'], ['1', 'Naturelles']], st.naturals ? '1' : '0', v => { st.naturals = v === '1'; draw(); }),
        seg([['0', 'Affichées'], ['1', 'Cachées (touche pour révéler)']], st.hidden ? '1' : '0', v => { st.hidden = v === '1'; draw(); })),
        el('p', 'hint', st.labels === 'iv' ? `Intervalles calculés par rapport à ${N(st.tonic)}.` : 'Repères : E–F et B–C sont collées (1 case) ; toutes les autres notes naturelles sont à 2 cases. Case 12 = la note à vide.'));
    }

    if (st.view === 'scale') {
      const info2 = MODE_INFO[st.scale];
      ctx.char = info2 ? info2.char : [];
      F.setMarks(scaleMarks(notes, { labels: st.labels, frets: st.frets, zone, emphasize: st.emph ? ctx.char : [] }));
      below.append(legend(STD_LEGEND.filter(([r]) => notes.some(n => T.ivRole(n.iv) === r))));
      if (info2) below.append(el('label', 'row hint', Object.assign(el('input', { type: 'checkbox' }), { checked: st.emph, onchange: e => { st.emph = e.target.checked; draw(); } }), ' Entourer les notes caractéristiques (', info2.char.map(IV).join(', '), ')'));
      explain.append(scaleSummary(st.tonic, st.scale, true));
    }

    if (st.view === 'chord') {
      F.setMarks(scaleMarks(notes, { labels: st.labels === 'deg' ? 'iv' : st.labels, frets: st.frets }));
      below.append(legend(STD_LEGEND.filter(([r]) => notes.some(n => T.ivRole(n.iv) === r))));
      below.append(el('div', 'row', el('span', 'hint', `${CF(T.chordSymbol(st.tonic, st.type))} = ${notes.map(n => N(n.name)).join(' – ')}`), el('span', 'spacer'),
        el('button', { class: 'btn ghost sm', onclick: () => playNotes(closeVoicing(notes.map(n => n.pc), 48)) }, '▶ Écouter'),
        el('a', { class: 'btn ghost sm', href: `#/labo/accords?root=${encodeURIComponent(st.tonic)}&type=${st.type}` }, 'Doigtés et renversements →')));
    }

    if (st.view === 'compare') {
      const c = T.compareScales(st.tonic, st.scale, st.cmp);
      F.setMarks(compareMarks(c, { labels: st.labels === 'none' ? 'iv' : st.labels, frets: st.frets, zone }));
      below.append(legend([['root', 'Tonique'], ['common', 'Notes communes'], ['diffA', `Seulement dans ${T.SCALES[st.scale].name}`], ['diffB', `Seulement dans ${T.SCALES[st.cmp].name}`]]));
      explain.append(compareSummary(st.tonic, st.scale, st.cmp));
    }
  }
  draw();
}

/* Bloc d'explication réutilisé : notes + formule + couleur */
function noteChips(notes, { char = [], changed = new Set(), onClick } = {}) {
  const row = el('div', 'notes-row');
  notes.forEach(n => {
    const c = el('button', { class: `nchip r-${T.ivRole(n.iv)}${char.includes(n.iv) ? ' char' : ''}${changed.has(n.pc) ? ' changed' : ''}`, title: T.ivName(n.iv),
      onclick: () => { try { pluck(60 + ((n.pc - 0 + 12) % 12) + (n.pc < T.pcOf(notes[0].name) ? 12 : 0)); } catch (e) {} onClick && onClick(n); } },
      el('b', null, N(n.name)), el('small', null, IV(n.iv)));
    row.append(c);
  });
  return row;
}

function scaleSummary(tonic, scaleId, short = false) {
  const notes = T.buildScale(tonic, scaleId), info = MODE_INFO[scaleId];
  const box = el('div', 'panel');
  box.append(el('div', 'panel-title', el('h3', null, `${N(tonic)} ${T.SCALES[scaleId].name.toLowerCase()}`),
    el('button', { class: 'btn ghost sm', onclick: () => playScale(notes) }, '▶ Écouter la gamme')));
  box.append(noteChips(notes, { char: info ? info.char : [] }));
  const steps = T.stepPattern(scaleId);
  box.append(el('div', 'steps-row', ...steps.map(s => el('span', null, '→ ' + s))));
  if (info) box.append(el('p', { html: rich(`<b>Couleur :</b> ${info.color} <b>Note(s) caractéristique(s) :</b> ${info.char.map(IV).join(', ')}.`) }));
  if (short) box.append(el('a', { class: 'btn ghost sm', href: `#/labo/gammes?tonic=${encodeURIComponent(tonic)}&scale=${scaleId}${info ? '&cmp=' + info.vs : ''}` }, 'Analyse complète dans l’explorateur →'));
  const simpler = T.simplerTonic(tonic, scaleId);
  if (simpler) box.append(el('p', 'hint', `Orthographe plus simple : ${N(simpler)} ${T.SCALES[scaleId].name.toLowerCase()} (même son, moins d’altérations).`));
  return box;
}

function compareSummary(tonic, a, b) {
  const c = T.compareScales(tonic, a, b);
  const box = el('div', 'panel');
  box.append(el('h3', null, `${N(tonic)} ${T.SCALES[a].name.toLowerCase()} vs ${N(tonic)} ${T.SCALES[b].name.toLowerCase()}`));
  const chA = new Set(c.onlyA.map(n => n.pc)), chB = new Set(c.onlyB.map(n => n.pc));
  box.append(el('div', 'grid2',
    el('div', null, el('p', 'hint', T.SCALES[a].name), noteChips(c.A, { changed: chA })),
    el('div', null, el('p', 'hint', T.SCALES[b].name), noteChips(c.B, { changed: chB }))));
  const txt = !c.onlyA.length && !c.onlyB.length ? 'Ces deux gammes ont exactement les mêmes notes.'
    : `Ce qui change : ${c.onlyA.map(n => `<b>${N(n.name)}</b> (${IV(n.iv)})`).join(', ') || 'rien'} dans ${T.SCALES[a].name.toLowerCase()}, contre ${c.onlyB.map(n => `<b>${N(n.name)}</b> (${IV(n.iv)})`).join(', ') || 'rien'} dans ${T.SCALES[b].name.toLowerCase()}. ${c.common.length} notes sont communes. Pour entendre la différence, joue ces notes-là sur un accord de ${N(tonic)} tenu.`;
  box.append(el('p', { html: txt }));
  return box;
}

function playScale(notes) {
  const base = 52 + ((T.pcOf(notes[0].name) - 4 + 12) % 12);
  const midis = []; let last = base - 1;
  notes.concat([notes[0]]).forEach(n => { let m = base + ((n.pc - base) % 12 + 12) % 12; while (m <= last) m += 12; midis.push(m); last = m; });
  playNotes(midis, { gap: 0.28, vel: 0.5 });
}

/* ================================================================
   GAMMES & MODES (explorateur)
   ================================================================ */
function scalesView(main, p) {
  const st = { tonic: p.tonic || 'A', scale: p.scale || 'dorian', cmp: p.cmp || '', zone: p.zone != null ? +p.zone : -1, labels: p.labels || 'iv' };
  const top = el('div', 'panel');
  const controls = el('div', 'controls');
  const info = infoBar();
  const F = new Fretboard({ frets: 15, onTap: (s, f) => info.show(s, f, { tonic: st.tonic, notes: T.buildScale(st.tonic, st.scale), char: MODE_INFO[st.scale]?.char }) });
  const leg = el('div');
  top.append(controls, F.root, leg, info);
  const body = el('div');
  main.append(top, body);

  function draw() {
    setQuery('gammes', { tonic: st.tonic, scale: st.scale, cmp: st.cmp, zone: st.zone >= 0 ? st.zone : null, labels: st.labels !== 'iv' ? st.labels : null });
    const notes = T.buildScale(st.tonic, st.scale), info2 = MODE_INFO[st.scale];
    const zones = T.scaleZones(notes);
    if (st.zone >= zones.length) st.zone = -1;
    controls.innerHTML = '';
    controls.append(
      select(tonicOpts(), st.tonic, v => { st.tonic = v; draw(); }, 'Tonique'),
      select(scaleOpts(), st.scale, v => { st.scale = v; st.zone = -1; if (st.cmp === v) st.cmp = ''; draw(); }, 'Gamme / mode'),
      select([['', '— aucune —'], ...scaleOpts().filter(([id]) => id !== st.scale)], st.cmp, v => { st.cmp = v; draw(); }, 'Comparer avec'),
      select([[-1, 'Tout le manche'], ...zones.map((z, i) => [i, `Position ${i + 1} · cases ${z.from}–${z.to}`])], st.zone, v => { st.zone = +v; draw(); }, 'Position'),
      select([['iv', 'Intervalles'], ['note', 'Notes'], ['deg', 'Degrés']], st.labels, v => { st.labels = v; draw(); }, 'Étiquettes'));
    const zone = st.zone >= 0 ? zones[st.zone] : null;
    F.setZone(zone);
    leg.innerHTML = '';
    if (st.cmp) {
      F.setMarks(compareMarks(T.compareScales(st.tonic, st.scale, st.cmp), { labels: st.labels, zone }));
      leg.append(legend([['root', 'Tonique'], ['common', 'Communes'], ['diffA', 'Seulement dans ' + T.SCALES[st.scale].name], ['diffB', 'Seulement dans ' + T.SCALES[st.cmp].name]]));
    } else {
      F.setMarks(scaleMarks(notes, { labels: st.labels, zone, emphasize: info2 ? info2.char : [] }));
      leg.append(legend(STD_LEGEND.filter(([r]) => notes.some(n => T.ivRole(n.iv) === r))));
    }

    body.innerHTML = '';
    const g = el('div', 'grid2');
    // 1-4 : notes, intervalles, degrés, formule
    const a = el('div', 'panel');
    a.append(el('div', 'panel-title', el('h3', null, `${N(st.tonic)} ${T.SCALES[st.scale].name.toLowerCase()}`), el('button', { class: 'btn ghost sm', onclick: () => playScale(notes) }, '▶ Écouter')));
    a.append(el('p', 'hint', '1 · Notes et intervalles depuis la tonique'), noteChips(notes, { char: info2 ? info2.char : [] }));
    a.append(el('p', 'hint', '2 · Écart entre chaque note'), el('div', 'steps-row', ...T.stepPattern(st.scale).map(s => el('span', null, '→ ' + s))));
    a.append(el('p', 'hint', '3 · Degrés'), el('p', 'mono', notes.map(n => `${T.parseInterval(n.iv).deg}:${N(n.name)}`).join('  ')));
    a.append(el('p', 'hint', '4 · Formule'), el('p', 'mono', notes.map(n => IV(n.iv)).join(' '), '   (', T.stepPattern(st.scale).join(' '), ')'));
    const simpler = T.simplerTonic(st.tonic, st.scale);
    if (simpler) a.append(el('p', 'hint', `Orthographe plus simple : ${N(simpler)}.`));
    g.append(a);

    // 6 · pourquoi / notes caractéristiques
    const b = el('div', 'panel');
    if (info2) {
      const parent = T.parentMajor(st.tonic, st.scale);
      const vs = T.compareScales(st.tonic, st.scale, info2.vs);
      b.append(el('h3', null, `Pourquoi c’est du ${info2.name.toLowerCase()}`));
      b.append(el('div', { class: 'lesson-txt', html: rich(
        `<p>${N(st.tonic)} ${info2.name.toLowerCase()} utilise <b>les notes de ${N(parent)} majeur</b> (c’est son ${info2.degree}e degré), mais avec ${N(st.tonic)} comme [[tonique]]. Ce n’est pas une position : c’est la note sur laquelle la musique se repose qui change tout.</p>` +
        `<p><b>Par rapport à ${N(st.tonic)} ${MODE_INFO[info2.vs].name.toLowerCase()}</b> : ${vs.onlyA.map(n => `<b class="nt">${N(n.name)}</b> (${IV(n.iv)})`).join(', ')} au lieu de ${vs.onlyB.map(n => `${N(n.name)} (${IV(n.iv)})`).join(', ')}. ${vs.common.length} notes communes.</p>` +
        `<p><b>Couleur</b> : ${info2.color}</p><p>${info2.why}</p><p><b>À cibler</b> : ${info2.targets}</p><p><b>Où l’entendre</b> : ${info2.contexts}</p>`) }));
      if (!st.cmp) b.append(el('button', { class: 'btn ghost sm', onclick: () => { st.cmp = info2.vs; draw(); } }, `Voir la différence avec ${MODE_INFO[info2.vs].name.toLowerCase()} sur le manche`));
    } else {
      const txt = {
        minPenta: 'Cinq notes, aucun demi-ton : rien ne frotte, d’où son efficacité… et sa limite. Ajoute la 2 et la ♭6 → éolien, la 2 et la 6 → dorien.',
        majPenta: 'La penta mineure de son relatif (6e degré). Ajoute la 4 et la 7 → majeur, la 4 et la ♭7 → mixolydien.',
        blues: 'Penta mineure + ♭5 (blue note). La ♭5 est une note de passage : glisse-la vers la 4 ou la 5, ne t’arrête pas dessus.',
        harmMinor: 'Mineur naturel avec la 7 MAJEURE : elle rend le V majeur (E en A mineur) et crée l’écart de 1½ ton entre ♭6 et 7 : sonorité orientale, néo-classique, metal.',
        phrygDom: '5e mode de la mineure harmonique : phrygien avec tierce majeure. LA sonorité orientale du metal (System of a Down, flamenco).'
      }[st.scale];
      b.append(el('h3', null, 'Ce qui la caractérise'), el('p', { html: rich(txt || '') }));
    }
    g.append(b);
    body.append(g);

    // compare details
    if (st.cmp) body.append(compareSummary(st.tonic, st.scale, st.cmp));

    // 5 · accords compatibles
    const c = el('div', 'panel');
    c.append(el('h3', null, '5 · Accords compatibles'));
    if (notes.length === 7) {
      const H3 = T.harmonize(st.tonic, st.scale), H7 = T.harmonize(st.tonic, st.scale, true);
      const tbl = el('table', 'tbl');
      tbl.append(el('tr', null, el('th', null, 'Degré'), el('th', null, 'Triade'), el('th', null, 'Septième'), el('th', null, 'Notes'), el('th', null, '')));
      H3.forEach((h, i) => {
        const ch = info2 && h.notes.some(n => info2.char.includes(n.iv)) && i > 0;
        tbl.append(el('tr', { class: 'click', onclick: () => playNotes(closeVoicing(H7[i].notes.map(n => n.pc), 48)) },
          el('td', 'mono', h.roman), el('td', null, el('b', null, CF(h.symbol))), el('td', null, CF(H7[i].symbol)), el('td', 'mono', H7[i].notes.map(n => N(n.name)).join(' ')),
          el('td', null, i === 0 ? el('span', 'tag acc', 'maison') : ch ? el('span', 'tag', 'contient la couleur') : '')));
      });
      c.append(el('div', 'tbl-wrap', tbl), el('p', 'hint', 'Touche une ligne pour l’écouter. « Contient la couleur » = l’accord contient la note caractéristique du mode : c’est lui qui, enchaîné avec l’accord maison, fait entendre le mode.'),
        el('a', { class: 'btn ghost sm', href: `#/labo/accords?view=harmo&tonic=${encodeURIComponent(st.tonic)}&scale=${st.scale}` }, 'Fonctions et voicings dans le Chord Lab →'));
    } else {
      const pcs = new Set(notes.map(n => n.pc)), found = [];
      notes.forEach(n => ['maj', 'min', 'power', 'sus2', 'sus4', 'm7', 'dom7', 'maj7', 'add9', 'm9', 'sus7'].forEach(t => {
        const ch = T.buildChord(n.name, t); if (ch.every(x => pcs.has(x.pc))) found.push(T.chordSymbol(n.name, t));
      }));
      c.append(el('p', null, 'Accords dont toutes les notes appartiennent à la gamme :'), el('p', { class: 'mono', html: found.map(CF).join(' · ') }),
        el('p', 'hint', 'En pratique, la penta mineure sonne aussi sur des accords qui contiennent d’autres notes (c’est tout le blues : penta mineure sur des accords majeurs de 7). Calculé, pas recopié.'));
    }
    body.append(c);

    // 7 · progressions
    const d = el('div', 'panel');
    d.append(el('h3', null, '7 · Progressions pour l’entendre'));
    const list = [];
    if (MODAL_VAMPS[st.scale]) list.push({ name: `Vamp ${MODE_INFO[st.scale].name.toLowerCase()}`, chords: MODAL_VAMPS[st.scale], href: `#/impro?ex=modes&mode=${st.scale}&key=${encodeURIComponent(st.tonic)}` });
    if (info2) list.push({ name: 'Progression typique', chords: info2.progressions, href: `#/impro?ex=free&key=${encodeURIComponent(st.tonic)}&scale=${st.scale}&prog=${encodeProg(info2.progressions)}` });
    PROGRESSIONS.filter(pr => pr.scale === st.scale).forEach(pr => list.push({ name: pr.name, chords: pr.chords, href: `#/impro?ex=free&key=${encodeURIComponent(st.tonic)}&scale=${st.scale}&prog=${encodeProg(pr.chords)}&style=${pr.style}` }));
    const seen = new Set();
    for (let i = list.length - 1; i >= 0; i--) { const k = encodeProg(list[i].chords); if (seen.has(k)) list.splice(i, 1); else seen.add(k); }
    if (!list.length) d.append(el('p', 'hint', 'Cette gamme se joue surtout sur des grilles mineures (blues, rock). Voir l’Impro Studio.'));
    list.forEach(it => {
      const real = T.realizeProgression(st.tonic, it.chords);
      d.append(el('div', 'card-link', el('span', 'ic', '♫'),
        el('div', null, el('b', null, it.name), el('small', { html: real.map(r => `${CF(r.symbol)} <span class="mono" style="color:var(--faint)">${r.roman}</span>`).join(' → ') })),
        el('a', { class: 'btn sm', href: it.href, style: { marginLeft: 'auto' } }, 'Improviser dessus')));
    });
    body.append(d);
  }
  draw();
}

export function encodeProg(chords) { return chords.map(c => [c[0], c[1], c[2] || 1].join(':')).join(','); }
export function decodeProg(s) {
  try { return s.split(',').map(x => { const [iv, t, b] = x.split(':'); T.parseInterval(iv); if (!T.CHORD_TYPES[t]) throw 0; return [iv, t, +b || 1]; }); }
  catch (e) { return null; }
}

/* ================================================================
   CHORD LAB
   ================================================================ */
function chordDiagram(v, label) {
  const ns = 'http://www.w3.org/2000/svg';
  const S = (t, a) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const fretted = v.frets.filter(f => f > 0);
  const lo = fretted.length ? Math.min(...fretted) : 1;
  const start = Math.max(...v.frets) <= 4 ? 1 : lo;
  const W = 100, H = 118, x0 = 18, dx = 14, y0 = 20, dy = 18;
  const s = S('svg', { viewBox: `0 0 ${W} ${H}` });
  for (let i = 0; i < 6; i++) s.append(S('line', { x1: x0 + i * dx, x2: x0 + i * dx, y1: y0, y2: y0 + 5 * dy, class: 'cd-line' }));
  for (let j = 0; j <= 5; j++) s.append(S('line', { x1: x0, x2: x0 + 5 * dx, y1: y0 + j * dy, y2: y0 + j * dy, class: j === 0 && start === 1 ? 'cd-nut' : 'cd-line' }));
  if (start > 1) { const t = S('text', { x: 8, y: y0 + dy * 0.65, class: 'cd-txt' }); t.textContent = start; s.append(t); }
  v.frets.forEach((f, i) => {
    const x = x0 + i * dx;
    if (f < 0) { const t = S('text', { x, y: 13, class: 'cd-txt' }); t.textContent = '×'; s.append(t); return; }
    if (f === 0) { s.append(S('circle', { cx: x, cy: 10, r: 4, fill: 'none', stroke: 'var(--dim)', 'stroke-width': 1.3 })); return; }
    const y = y0 + (f - start + 0.5) * dy;
    const role = T.ivRole(v.ivs[i]);
    s.append(S('circle', { cx: x, cy: y, r: 6, fill: `var(--c-${role})` }));
  });
  v.ivs.forEach((iv, i) => { if (!iv) return; const t = S('text', { x: x0 + i * dx, y: H - 2, class: 'cd-txt' }); t.textContent = IV(iv); s.append(t); });
  return el('div', 'voicing', s, el('small', null, label || ''));
}

function chordsView(main, p) {
  const view = p.view || 'build';
  const tabs = seg([['build', 'Construire un accord'], ['harmo', 'Harmoniser une gamme']], view, v => { location.hash = '#/labo/accords?view=' + v; });
  main.append(el('div', 'row', tabs), el('div', { style: { height: '12px' } }));
  if (view === 'harmo') return harmoView(main, p);
  buildView(main, p);
}

function buildView(main, p) {
  const st = { root: p.root || 'A', type: T.CHORD_TYPES[p.type] ? p.type : 'm7', bass: p.bass || '1', set: +(p.set || 0), voicing: -1, triadInv: -1 };
  const wrap = el('div');
  main.append(wrap);
  const F = new Fretboard({ frets: 15 });

  function draw() {
    setQuery('accords', { view: 'build', root: st.root, type: st.type, bass: st.bass !== '1' ? st.bass : null, set: st.set || null });
    wrap.innerHTML = '';
    const notes = T.buildChord(st.root, st.type), sym = T.chordSymbol(st.root, st.type);
    const top = el('div', 'panel');
    const typeBtns = el('div', 'seg');
    T.CHORD_ORDER.forEach(id => typeBtns.append(el('button', { class: id === st.type ? 'on' : '', onclick: () => { st.type = id; st.bass = '1'; st.voicing = -1; draw(); } }, T.CHORD_TYPES[id].sym || 'maj')));
    top.append(el('div', 'controls', select(tonicOpts(), st.root, v => { st.root = v; st.voicing = -1; draw(); }, 'Fondamentale'), el('div', 'field', el('span', null, 'Qualité'), typeBtns)));

    const head = el('div', 'grid2');
    const left = el('div');
    left.append(el('div', 'eyebrow', T.CHORD_TYPES[st.type].name), el('div', { class: 'now-chord' }, CF(sym)));
    left.append(noteChips(notes));
    left.append(el('p', 'mono hint', 'Formule : ' + notes.map(n => IV(n.iv)).join(' – ') + '  ·  ' + notes.slice(1).map(n => `${IV(n.iv)} = ${T.parseInterval(n.iv).semis} demi-tons`).join(', ')));
    left.append(el('div', 'row', el('button', { class: 'btn sm', onclick: () => playNotes(closeVoicing(notes.map(n => n.pc), 48)) }, '▶ Plaqué'), el('button', { class: 'btn ghost sm', onclick: () => arpeggio(closeVoicing(notes.map(n => n.pc), 48)) }, '▶ Arpégé')));
    const right = el('div');
    right.append(el('p', { html: rich(CHORD_WHY[st.type] || '') }));
    const nxt = CHORD_NEXT[st.type] || [];
    if (nxt.length) right.append(el('p', 'hint', 'Enrichir / transformer :'), el('div', 'row', ...nxt.map(t => el('button', { class: 'btn ghost sm', onclick: () => { st.type = t; st.bass = '1'; draw(); } }, CF(T.chordSymbol(st.root, t))))));
    head.append(left, right);
    top.append(head);
    wrap.append(top);

    // manche : toutes les notes
    const fbp = el('div', 'panel');
    const fbTitle = el('h3', null, 'Toutes les notes de l’accord sur le manche');
    fbp.append(el('div', 'panel-title', fbTitle, el('button', { class: 'btn ghost sm', onclick: () => { st.voicing = -1; st.triadInv = -1; showAll(); } }, 'Tout afficher')), F.root, legend(STD_LEGEND.filter(([r]) => notes.some(n => T.ivRole(n.iv) === r))));
    wrap.append(fbp);
    const showAll = () => { fbTitle.textContent = 'Toutes les notes de l’accord sur le manche'; F.setMarks(scaleMarks(notes, { labels: 'iv' })); };
    showAll();

    // voicings
    const vp = el('div', 'panel');
    const invs = T.inversions(st.root, st.type);
    vp.append(el('div', 'panel-title', el('h3', null, 'Doigtés (calculés)'),
      seg(invs.map(iv => [iv.bass.iv, iv.name + ' (' + N(iv.bass.name) + ' basse)']), st.bass, v => { st.bass = v; draw(); })));
    const vs = T.chordVoicings(st.root, st.type, { bassIv: st.bass });
    if (!vs.length) vp.append(el('p', 'empty', 'Aucun doigté jouable trouvé avec cette basse dans 4 cases (essaie les triades ci-dessous).'));
    const grid = el('div', 'voicings');
    vs.forEach((v, i) => {
      const lo = Math.min(...v.frets.filter(f => f > 0).concat([99]));
      const d = chordDiagram(v, v.frets.map(f => f < 0 ? 'x' : f).join(' ') + (lo < 99 && lo > 0 ? '' : ''));
      d.addEventListener('click', () => {
        grid.querySelectorAll('.voicing').forEach(x => x.classList.remove('on')); d.classList.add('on');
        F.setMarks(voicingMarks(v.frets, v.ivs, notes, 'iv'));
        fbTitle.textContent = 'Doigté : ' + v.frets.map(f => f < 0 ? 'x' : f).join('-');
        playNotes(voicingMidis(v.frets));
      });
      grid.append(d);
    });
    vp.append(grid, el('p', 'hint', 'Doigtés générés par le moteur : cordes voisines, 4 cases maximum, 4 doigts (barré compris), la bonne note à la basse. Pour les accords de 4 sons et plus, la quinte peut être omise. Touche un diagramme pour l’entendre et le voir sur le manche.'));
    wrap.append(vp);

    // triades
    if (['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'].includes(st.type) || notes.length >= 3) {
      const tp = el('div', 'panel');
      const triType = ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'].includes(st.type) ? st.type : (['min', 'm7', 'm9', 'mMaj7'].includes(st.type) ? 'min' : ['dim', 'm7b5', 'dim7'].includes(st.type) ? 'dim' : st.type === 'aug' || st.type === 'maj7s5' ? 'aug' : st.type === 'sus7' ? 'sus4' : 'maj');
      tp.append(el('div', 'panel-title', el('h3', null, `Triades et renversements de ${CF(T.chordSymbol(st.root, triType))}`),
        seg(T.STRING_SETS.map((s, i) => [i, T.STRING_SET_NAMES[i]]), st.set, v => { st.set = +v; draw(); })));
      if (triType !== st.type) tp.append(el('p', 'hint', `Le cœur de ${CF(sym)} est la triade ${CF(T.chordSymbol(st.root, triType))} : c’est elle qu’on place sur 3 cordes.`));
      const shapes = T.triadShapes(st.root, triType, T.STRING_SETS[st.set]);
      const names = ['État fondamental', '1er renversement', '2e renversement'];
      const tri = T.buildChord(st.root, triType);
      const list = el('div', 'row');
      shapes.forEach(sh => {
        const b = el('button', { class: 'btn ghost sm', onclick: () => {
          const fr = [-1, -1, -1, -1, -1, -1], ivs = [null, null, null, null, null, null];
          sh.strings.forEach((s, i) => { fr[s] = sh.frets[i]; ivs[s] = sh.notes[i].iv; });
          F.setMarks(voicingMarks(fr, ivs, tri, 'iv'));
          fbTitle.textContent = `${names[sh.inversion]} · cases ${sh.frets.join('-')}`;
          playNotes(sh.strings.map((s, i) => T.midiAt(s, sh.frets[i])));
          fbp.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } }, `${names[sh.inversion]} — cases ${sh.frets.join('-')} (basse ${N(sh.notes[0].name)})`);
        list.append(b);
      });
      const showAllTriads = el('button', { class: 'btn sm', onclick: () => {
        const marks = [];
        shapes.forEach(sh => sh.strings.forEach((s, i) => marks.push({ s, f: sh.frets[i], label: IV(sh.notes[i].iv), role: T.ivRole(sh.notes[i].iv) })));
        F.setMarks(marks); fbTitle.textContent = 'Toutes les triades sur ' + T.STRING_SET_NAMES[st.set].toLowerCase();
        fbp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } }, 'Les voir toutes sur le manche');
      tp.append(showAllTriads, el('div', { style: { height: '10px' } }), list,
        el('p', { class: 'hint', html: rich('Les trois états se suivent en montant le manche. Chaque forme contient les 3 notes, une seule fois : c’est la façon la plus légère et la plus mobile de jouer un accord, et la base du [[voice leading]].') }));
      wrap.append(tp);
    }
  }
  draw();
}

function harmoView(main, p) {
  const HEPTA = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian', 'harmMinor', 'phrygDom'];
  const st = { tonic: p.tonic || 'C', scale: HEPTA.includes(p.scale) ? p.scale : 'ionian', sev: p.sev === '1', sel: 0, grid: [] };
  const wrap = el('div');
  main.append(wrap);
  const F = new Fretboard({ frets: 15 });

  function draw() {
    setQuery('accords', { view: 'harmo', tonic: st.tonic, scale: st.scale, sev: st.sev ? 1 : null });
    wrap.innerHTML = '';
    const H = T.harmonize(st.tonic, st.scale, st.sev);
    const scale = T.buildScale(st.tonic, st.scale);
    const top = el('div', 'panel');
    top.append(el('div', 'controls',
      select(tonicOpts(), st.tonic, v => { st.tonic = v; st.grid = []; draw(); }, 'Tonique'),
      select(scaleOpts(HEPTA), st.scale, v => { st.scale = v; st.grid = []; draw(); }, 'Gamme'),
      seg([['0', 'Triades'], ['1', 'Septièmes']], st.sev ? '1' : '0', v => { st.sev = v === '1'; draw(); })));
    top.append(el('p', { class: 'lead', html: rich(`On empile des [[tierce|tierces]] sur chaque degré de ${N(st.tonic)} ${T.SCALES[st.scale].name.toLowerCase()} (${scale.map(n => N(n.name)).join(' ')}), en n’utilisant que ces notes. La qualité de chaque accord dépend de l’endroit où tombent les demi-tons de la gamme.`) }));
    const tbl = el('table', 'tbl');
    const tonal = T.harmonicFunction(st.scale, 1) != null;
    tbl.append(el('tr', null, el('th', null, 'Degré'), el('th', null, 'Accord'), el('th', null, 'Notes'), el('th', null, 'Pourquoi cette qualité'), el('th', null, tonal ? 'Fonction' : 'Rôle'), el('th', null, '')));
    const info = MODE_INFO[st.scale];
    H.forEach((h, i) => {
      const why = h.semis.map((s, k) => `${['3ce', '5te', '7e'][k]} ${s} ½t`).join(' · ');
      const fn = T.harmonicFunction(st.scale, h.degree);
      let role = '';
      if (!tonal) {
        if (i === 0) role = el('span', 'tag acc', 'maison');
        else if (info && h.notes.some(n => info.char.includes(n.iv))) role = el('span', 'tag', 'porte la couleur');
        else if (h.typeId === 'dim' || h.typeId === 'm7b5') role = el('span', 'tag bad', 'tire vers la gamme parente');
      }
      const row = el('tr', { class: 'click' + (i === st.sel ? ' sel' : ''), onclick: () => { st.sel = i; draw(); playNotes(closeVoicing(h.notes.map(n => n.pc), 48)); } },
        el('td', 'mono', h.roman), el('td', null, el('b', null, CF(h.symbol))), el('td', 'mono', h.notes.map(n => N(n.name)).join(' ')),
        el('td', 'mono hint', why + ' → ' + (T.CHORD_TYPES[h.typeId]?.name.toLowerCase() || '?')),
        el('td', null, fn ? el('span', 'fn ' + fn, fn) : role),
        el('td', null, el('button', { class: 'btn ghost sm', onclick: e => { e.stopPropagation(); st.grid.push(i); draw(); } }, '+ grille')));
      tbl.append(row);
    });
    top.append(el('div', 'tbl-wrap', tbl));
    if (tonal) top.append(el('p', { class: 'hint', html: Object.entries(T.FUNCTION_NAMES).map(([k, v]) => `<span class="fn ${k}">${k}</span> ${v}`).join(' &nbsp; ') }));
    else top.append(el('p', { class: 'hint', html: rich('En modal, on ne parle pas de fonctions tonales : on garde l’accord « maison » au centre, et on lui oppose l’accord qui contient la [[note caractéristique]].') }));
    wrap.append(top);

    // accord sélectionné sur le manche
    const h = H[st.sel];
    const fbp = el('div', 'panel');
    fbp.append(el('div', 'panel-title', el('h3', null, `${CF(h.symbol)} (${h.roman}) dans la gamme`), el('a', { class: 'btn ghost sm', href: `#/labo/accords?root=${encodeURIComponent(h.root)}&type=${h.typeId}` }, 'Doigtés →')));
    const chordIv = k => k === 0 ? '1' : k === 1 ? (h.semis[0] === 3 ? 'b3' : '3') : k === 2 ? ({ 6: 'b5', 7: '5', 8: '#5' }[h.semis[1]]) : ({ 9: 'bb7', 10: 'b7', 11: '7' }[h.semis[2]]);
    const marks = scaleMarks(scale, { labels: 'note' }).map(m => {
      const k = h.notes.findIndex(n => n.pc === T.pcAt(m.s, m.f));
      if (k < 0) return { ...m, cls: 'ghost', role: 'none' };
      return { ...m, label: IV(chordIv(k)), role: ['root', 'third', 'fifth', 'seventh'][k], cls: '' };
    });
    F.setMarks(marks);
    fbp.append(F.root, el('p', 'hint', 'En couleur : les notes de l’accord (intervalles depuis sa fondamentale). En transparence : le reste de la gamme — les notes de passage autour des cibles.'));
    wrap.append(fbp);

    // grille
    const gp = el('div', 'panel');
    gp.append(el('h3', null, 'Ma grille'));
    if (!st.grid.length) gp.append(el('p', 'hint', 'Ajoute des accords avec « + grille » pour construire une progression, l’écouter, l’enregistrer ou improviser dessus.'));
    else {
      const chords = st.grid.map(i => H[i]);
      gp.append(el('div', 'chord-strip', ...chords.map((c, k) => el('div', 'chord-cell', el('b', null, CF(c.symbol)), el('small', null, c.roman), el('button', { class: 'icon-btn', 'aria-label': 'Retirer', onclick: () => { st.grid.splice(k, 1); draw(); } }, '✕')))));
      const prog = chords.map(c => [c.rootIv, c.typeId, 1]);
      gp.append(el('div', 'row',
        el('a', { class: 'btn', href: `#/impro?ex=free&key=${encodeURIComponent(st.tonic)}&scale=${st.scale}&prog=${encodeProg(prog)}` }, '♫ Improviser sur cette grille'),
        el('button', { class: 'btn ghost', onclick: () => {
          const name = prompt('Nom de cette idée ?', chords.map(c => c.symbol).join(' – '));
          if (name == null) return;
          update(s => s.compos.unshift({ d: new Date().toISOString().slice(0, 10), name, key: st.tonic, scale: st.scale, chords: prog }));
          toast('Grille enregistrée dans tes idées (page Progrès).', 'ok');
        } }, '💾 Garder cette idée'),
        el('button', { class: 'btn ghost', onclick: () => { st.grid = []; draw(); } }, 'Vider')));
    }
    wrap.append(gp);
  }
  draw();
}
