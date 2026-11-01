/* ================================================================
   COMPOSITION STUDIO
   Bibliothèque de morceaux : sections, grilles analysées, riffs, notes,
   structure, idées audio. Les grilles sont stockées en degrés : on peut
   changer la tonalité d'un morceau sans tout réécrire.
   Les enregistrements audio vont dans IndexedDB (trop lourds pour localStorage).
   ================================================================ */
import * as T from '../theory.js';
import { el, N, seg, select, toast, rich, fmtDate } from '../ui.js';
import { state, update, today } from '../store.js';
import { Backing, STYLES, canRecord, Recorder, ac, playNotes, closeVoicing } from '../audio.js';
import { MODE_INFO } from '../content/modes.js';
import { encodeProg } from './labo.js';

const CF = s => String(s).replace(/^([A-G][♯♭𝄪𝄫]*)/, m => N(m));
const uid = () => Math.random().toString(36).slice(2, 9);
const SECTION_NAMES = ['Intro', 'Couplet', 'Pré-refrain', 'Refrain', 'Pont', 'Solo', 'Outro'];
const HEPTA = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'harmMinor'];
let backing = null;
export function leave() { if (backing) backing.stop(); }

/* ---------------- IndexedDB pour l'audio ---------------- */
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('shred-audio', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('clips');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function putClip(id, blob) { const d = await db(); return new Promise((res, rej) => { const tx = d.transaction('clips', 'readwrite'); tx.objectStore('clips').put(blob, id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
async function getClip(id) { const d = await db(); return new Promise((res, rej) => { const q = d.transaction('clips').objectStore('clips').get(id); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
async function delClip(id) { const d = await db(); return new Promise(res => { const tx = d.transaction('clips', 'readwrite'); tx.objectStore('clips').delete(id); tx.oncomplete = res; }); }

const songs = () => state().songs || [];
function saveSong(song) { song.updated = today(); update(s => { s.songs = s.songs || []; const i = s.songs.findIndex(x => x.id === song.id); if (i >= 0) s.songs[i] = song; else s.songs.unshift(song); }); }

export function render(main, params) {
  if (params.id) { const s = songs().find(x => x.id === params.id); if (s) return editor(main, structuredClone(s)); }
  main.append(el('div', 'page-head', el('div', null, el('div', 'eyebrow', 'Composition Studio'), el('h1', null, 'Mes morceaux'),
    el('p', null, 'Garde tes idées, structure-les en morceaux, comprends pourquoi tes grilles fonctionnent et essaie des variantes.')),
    el('button', { class: 'btn', onclick: () => { const s = newSong(); saveSong(s); location.hash = '#/compo?id=' + s.id; } }, '+ Nouveau morceau')));
  const list = songs();
  if (!list.length) main.append(el('p', 'empty', 'Aucun morceau. Commence par « Nouveau morceau » — ou transforme une grille gardée depuis le Chord Lab.'));
  const g = el('div', 'grid-auto');
  list.forEach(s => {
    const real = s.sections.length ? T.realizeProgression(s.key, s.sections[0].chords) : [];
    g.append(el('a', { class: 'card-link', href: '#/compo?id=' + s.id }, el('span', 'ic', '♫'),
      el('div', null, el('b', null, s.name), el('small', null, `${N(s.key)} ${T.SCALES[s.scale].name.toLowerCase()} · ${s.sections.length} section(s) · ${(s.audio || []).length} idée(s) audio · ${fmtDate(s.updated)}`),
        el('small', { class: 'mono' }, real.map(c => c.symbol).join(' – '))), el('span', 'chev', '›')));
  });
  main.append(g);
  const old = state().compos || [];
  if (old.length) {
    main.append(el('h2', 'sec', 'Grilles gardées depuis le Chord Lab'));
    old.forEach((c, i) => main.append(el('div', 'card-link', el('span', 'ic', '▦'), el('div', null, el('b', null, c.name), el('small', null, T.realizeProgression(c.key, c.chords).map(r => r.symbol).join(' – '))),
      el('button', { class: 'btn sm', style: { marginLeft: 'auto' }, onclick: () => { const s = newSong(c.name, c.key, HEPTA.includes(c.scale) ? c.scale : 'ionian'); s.sections[0].chords = c.chords; saveSong(s); location.hash = '#/compo?id=' + s.id; } }, 'En faire un morceau'))));
  }
}

function newSong(name = 'Sans titre', key = 'E', scale = 'aeolian') {
  const sec = { id: uid(), name: 'Couplet', chords: [['1', 'min', 1], ['b6', 'maj', 1], ['b3', 'maj', 1], ['b7', 'maj', 1]], riff: '', notes: '' };
  return { id: uid(), name, key, scale, bpm: 90, style: 'alt', created: today(), updated: today(), sections: [sec], structure: [sec.id], notes: '', audio: [] };
}

/* ---------------- analyse d'une grille ---------------- */
function analyse(song, chords) {
  const real = T.realizeProgression(song.key, chords);
  const scale = T.buildScale(song.key, song.scale), pcs = new Set(scale.map(n => n.pc));
  const lines = [];
  const out = real.map(c => {
    const outside = c.notes.filter(n => !pcs.has(n.pc));
    let src = null;
    if (outside.length) for (const m of HEPTA.filter(x => x !== song.scale)) {
      const sp = new Set(T.buildScale(song.key, m).map(n => n.pc));
      if (c.notes.every(n => sp.has(n.pc))) { src = m; break; }
    }
    return { c, outside, src };
  });
  const tonal = song.scale === 'ionian' || song.scale === 'aeolian' || song.scale === 'harmMinor';
  const degOf = c => { const k = scale.findIndex(n => n.pc === c.notes[0].pc); return k >= 0 ? k + 1 : null; };
  const fnOf = c => tonal && degOf(c) && !out.find(o => o.c === c).outside.length ? T.harmonicFunction(song.scale, degOf(c)) : null;
  // récit
  if (real.length) {
    const first = real[0], last = real[real.length - 1];
    lines.push(first.notes[0].pc === T.pcOf(song.key) ? `La grille part de la tonique (${CF(first.symbol)}) : on sait tout de suite où est la maison.` : `La grille ne commence pas sur la tonique (${CF(first.symbol)}) : l’oreille cherche le centre, effet plus ouvert.`);
    const lf = fnOf(last);
    if (lf === 'D' || last.iv === 'b7') lines.push(`Elle finit sur ${CF(last.symbol)} (${last.roman}) : tension qui relance la boucle vers le début.`);
    else if (last.notes[0].pc === T.pcOf(song.key)) lines.push('Elle finit sur la tonique : la boucle se referme, sensation de repos.');
    else lines.push(`Elle finit sur ${CF(last.symbol)} (${last.roman}) : ni repos ni tension forte, la boucle « flotte ».`);
  }
  out.filter(o => o.outside.length).forEach(o => lines.push(`${CF(o.c.symbol)} (${o.c.roman}) contient ${o.outside.map(n => N(n.name)).join(', ')}, hors de ${N(song.key)} ${T.SCALES[song.scale].name.toLowerCase()}${o.src ? ` : c’est un emprunt à ${N(song.key)} ${T.SCALES[o.src].name.toLowerCase()}` : ' : accord chromatique'}. En impro, vise ${o.outside.map(n => N(n.name)).join(', ')} sur cet accord.`));
  const info = MODE_INFO[song.scale];
  if (info && !tonal) {
    const hasChar = real.some(c => c.notes.some(n => info.char.some(ch => T.pcOf(T.spell(song.key, ch)) === n.pc)));
    lines.push(hasChar ? `La note caractéristique du ${info.name.toLowerCase()} est présente dans la grille : le mode s’entend.` : `Aucun accord ne contient la note caractéristique du ${info.name.toLowerCase()} (${info.char.map(c => N(T.spell(song.key, c))).join(', ')}) : la grille peut sonner comme un mode voisin. Ajoute un accord qui la contient.`);
  }
  if (new Set(real.map(c => c.symbol)).size === 1) lines.push('Un seul accord : c’est un vamp, toute la couleur viendra de la mélodie.');
  return { real, out, fnOf, lines };
}

/* Variantes : accords de même fonction ou emprunts classiques */
function variants(song, chord) {
  const H = T.harmonize(song.key, song.scale);
  const deg = H.findIndex(h => h.notes[0].pc === T.pcOf(T.spell(song.key, chord[0])));
  const out = [];
  const add = (iv, type, why) => { if (!(iv === chord[0] && type === chord[1])) out.push({ iv, type, why }); };
  if (song.scale === 'ionian') {
    const subs = { 0: [[5, 'vi : même fonction tonique, plus mélancolique'], [2, 'iii : tonique, plus ambigu']], 3: [[1, 'ii : même fonction sous-dominante, plus doux']], 4: [[6, 'vii° : dominante, plus tendu']], 5: [[0, 'I : version lumineuse']], 1: [[3, 'IV : même fonction, plus affirmé']] };
    (subs[deg] || []).forEach(([d, why]) => add(H[d].rootIv, H[d].typeId, why));
    if (deg === 4) add('b7', 'maj', '♭VII : dominante « rock », moins scolaire');
    if (deg === 3) add('4', 'min', 'iv mineur emprunté : mélancolie');
  } else {
    if (deg >= 0) [2, 4].forEach(k => { const h = H[(deg + k) % 7]; add(h.rootIv, h.typeId, `accord voisin (${h.roman}) qui partage des notes`); });
  }
  const t = chord[1];
  if (['maj', 'min'].includes(t)) { add(chord[0], t === 'maj' ? 'maj7' : 'm7', 'septième : même accord, plus de profondeur'); add(chord[0], 'sus2', 'sus2 : plus ouvert, atmosphérique'); add(chord[0], 'power', 'power chord : neutre, pour la saturation'); }
  if (t === 'power') { add(chord[0], 'maj', 'version majeure'); add(chord[0], 'min', 'version mineure'); }
  return out.slice(0, 6);
}

/* ---------------- éditeur ---------------- */
function editor(main, song) {
  const persist = () => saveSong(song);
  main.append(el('a', { class: 'btn ghost sm', href: '#/compo' }, '← Mes morceaux'), el('div', { style: { height: '10px' } }));
  const head = el('div', 'panel');
  const nameIn = el('input', { value: song.name, style: { fontSize: '20px', fontWeight: 800, width: '100%' }, 'aria-label': 'Titre' });
  nameIn.addEventListener('change', () => { song.name = nameIn.value.trim() || 'Sans titre'; persist(); });
  const bpmIn = el('input', { type: 'number', min: 40, max: 220, value: song.bpm, style: { width: '90px' } });
  bpmIn.addEventListener('change', () => { song.bpm = Math.max(40, Math.min(220, +bpmIn.value || 90)); persist(); });
  head.append(nameIn, el('div', { class: 'controls', style: { marginTop: '12px' } },
    select(T.TONICS.map(t => [t, N(t)]), song.key, v => { song.key = v; persist(); draw(); }, 'Tonalité'),
    select(HEPTA.map(id => [id, T.SCALES[id].name]), song.scale, v => { song.scale = v; persist(); draw(); }, 'Gamme / mode'),
    el('label', 'field', el('span', null, 'Tempo'), bpmIn),
    select(Object.entries(STYLES).map(([k, s]) => [k, s.name]), song.style, v => { song.style = v; persist(); }, 'Style'),
    el('button', { class: 'btn danger sm', onclick: async () => { if (!confirm('Supprimer ce morceau et ses idées audio ?')) return; for (const a of song.audio || []) await delClip(a.id).catch(() => {}); update(s => s.songs = s.songs.filter(x => x.id !== song.id)); location.hash = '#/compo'; } }, 'Supprimer')));
  main.append(head);
  const body = el('div');
  main.append(body);

  function playChords(chords, loops = 2, btn) {
    if (backing && backing.playing) { backing.stop(); if (btn) btn.textContent = '▶ Écouter'; return; }
    try { ac(); } catch (e) { return toast(e.message, 'bad'); }
    backing = new Backing();
    backing.start({ progression: T.realizeProgression(song.key, chords), bpm: song.bpm, style: song.style, loops, countIn: false, onBeat: e => { if (e.type === 'end' && btn) btn.textContent = '▶ Écouter'; } });
    if (btn) btn.textContent = '■ Stop';
  }

  function draw() {
    body.innerHTML = '';
    const H = T.harmonize(song.key, song.scale);
    const borrowed = [];
    ['aeolian', 'mixolydian', 'dorian', 'ionian', 'harmMinor'].filter(m => m !== song.scale).forEach(m => T.harmonize(song.key, m).forEach(h => {
      if (!H.some(x => x.symbol === h.symbol) && !borrowed.some(b => b.symbol === h.symbol)) borrowed.push({ ...h, from: m });
    }));

    song.sections.forEach((sec, si) => {
      const p = el('div', 'panel');
      const nm = el('select', { 'aria-label': 'Nom de la section' }, ...[...new Set([...SECTION_NAMES, sec.name])].map(n => el('option', { value: n }, n)));
      nm.value = sec.name; nm.addEventListener('change', () => { sec.name = nm.value; persist(); draw(); });
      const play = el('button', { class: 'btn sm' }, '▶ Écouter');
      play.addEventListener('click', () => playChords(sec.chords, 2, play));
      p.append(el('div', 'panel-title', el('div', 'row', nm, el('span', 'hint', `${sec.chords.reduce((a, c) => a + (c[2] || 1), 0)} mesures`)),
        el('div', 'row', play,
          el('a', { class: 'btn ghost sm', href: `#/impro?ex=free&key=${encodeURIComponent(song.key)}&scale=${song.scale}&prog=${encodeProg(sec.chords)}&style=${song.style}` }, '♫ Improviser'),
          el('button', { class: 'icon-btn', title: 'Dupliquer', onclick: () => { const c = structuredClone(sec); c.id = uid(); c.name = sec.name; song.sections.splice(si + 1, 0, c); persist(); draw(); } }, '⧉'),
          el('button', { class: 'icon-btn', title: 'Supprimer la section', onclick: () => { if (song.sections.length === 1) return toast('Il faut au moins une section.'); song.sections.splice(si, 1); song.structure = song.structure.filter(x => x !== sec.id); persist(); draw(); } }, '✕'))));

      // grille
      const an = analyse(song, sec.chords);
      const strip = el('div', 'chord-strip');
      an.real.forEach((c, k) => {
        const o = an.out[k], fn = an.fnOf(c);
        const cell = el('div', { class: 'chord-cell', style: o.outside.length ? { borderColor: 'var(--info)' } : {} },
          el('b', { style: { cursor: 'pointer' }, onclick: () => playNotes(closeVoicing(c.notes.map(n => n.pc), 48)) }, CF(c.symbol)),
          el('small', null, c.roman), fn ? el('div', null, el('span', 'fn ' + fn, fn)) : o.outside.length ? el('div', null, el('span', 'tag', 'emprunt')) : null);
        const ctr = el('div', { class: 'row', style: { justifyContent: 'center', gap: '2px', marginTop: '4px' } });
        cell.append(ctr);
        const barsSel = el('select', { 'aria-label': 'Mesures', style: { padding: '2px 4px', fontSize: '12px' } }, ...[1, 2, 4].map(b => el('option', { value: b }, b + ' mes.')));
        barsSel.value = sec.chords[k][2] || 1; barsSel.addEventListener('change', () => { sec.chords[k][2] = +barsSel.value; persist(); draw(); });
        ctr.append(el('button', { class: 'icon-btn', title: 'Avancer', onclick: () => { if (k > 0) { [sec.chords[k - 1], sec.chords[k]] = [sec.chords[k], sec.chords[k - 1]]; persist(); draw(); } } }, '‹'), barsSel,
          el('button', { class: 'icon-btn', title: 'Variantes', onclick: () => { vbox.innerHTML = ''; showVariants(k); } }, '⇄'),
          el('button', { class: 'icon-btn', title: 'Retirer', onclick: () => { sec.chords.splice(k, 1); persist(); draw(); } }, '✕'));
        strip.append(cell);
      });
      if (!an.real.length) strip.append(el('p', 'hint', 'Ajoute des accords ci-dessous.'));
      p.append(strip);
      const vbox = el('div');
      const showVariants = k => {
        const vs = variants(song, sec.chords[k]);
        const real0 = T.realizeProgression(song.key, [sec.chords[k]])[0];
        vbox.append(el('div', 'callout', el('b', null, `Variantes pour ${CF(real0.symbol)} : `), ...vs.map(v => { const r = T.realizeProgression(song.key, [[v.iv, v.type, 1]])[0];
          return el('button', { class: 'btn ghost sm', style: { margin: '3px' }, title: v.why, onclick: () => { sec.chords[k] = [v.iv, v.type, sec.chords[k][2] || 1]; persist(); draw(); toast(`${CF(r.symbol)} — ${v.why}`); } }, CF(r.symbol)); }),
          el('p', { class: 'hint' }, vs.map(v => `${CF(T.realizeProgression(song.key, [[v.iv, v.type, 1]])[0].symbol)} : ${v.why}`).join(' · '))));
      };
      p.append(vbox);
      // ajout d'accords
      const add = (iv, type) => { sec.chords.push([iv, type, 1]); persist(); draw(); };
      p.append(el('p', 'hint', `Ajouter — accords de ${N(song.key)} ${T.SCALES[song.scale].name.toLowerCase()} :`),
        el('div', 'row', ...H.map(h => el('button', { class: 'btn ghost sm', onclick: () => add(h.rootIv, h.typeId) }, `${CF(h.symbol)} `, el('span', { class: 'mono', style: { color: 'var(--faint)', fontSize: '11px' } }, h.roman)))),
        el('details', null, el('summary', { class: 'hint', style: { cursor: 'pointer', margin: '8px 0' } }, 'Accords empruntés (autres modes sur la même tonique)'),
          el('div', 'row', ...borrowed.slice(0, 14).map(h => el('button', { class: 'btn ghost sm', title: 'emprunté à ' + T.SCALES[h.from].name, onclick: () => add(h.rootIv, h.typeId) }, `${CF(h.symbol)} `, el('span', { class: 'mono', style: { color: 'var(--faint)', fontSize: '11px' } }, h.roman))))));
      // analyse
      if (an.lines.length) p.append(el('div', { class: 'callout', html: '<b>Pourquoi ça marche :</b> ' + an.lines.join(' ') }));
      // riff & notes
      const riff = el('textarea', { class: 'mono', placeholder: 'Riff ou mélodie en tablature :\ne|--------\nB|--------\nG|--------\nD|-------\nA|-------\nE|-0-3-5--', style: { fontFamily: 'var(--mono)', minHeight: '120px' } });
      riff.value = sec.riff || ''; riff.addEventListener('change', () => { sec.riff = riff.value; persist(); });
      const notes = el('textarea', { placeholder: 'Notes : paroles, idées, ce que tu veux essayer…' });
      notes.value = sec.notes || ''; notes.addEventListener('change', () => { sec.notes = notes.value; persist(); });
      p.append(el('div', 'grid2', el('label', 'field', el('span', null, 'Riff / mélodie (tab)'), riff), el('label', 'field', el('span', null, 'Commentaires'), notes)));
      body.append(p);
    });
    body.append(el('button', { class: 'btn ghost', onclick: () => { const used = new Set(song.sections.map(s => s.name)); const name = SECTION_NAMES.find(n => !used.has(n)) || 'Pont'; const s = { id: uid(), name, chords: [], riff: '', notes: '' }; song.sections.push(s); song.structure.push(s.id); persist(); draw(); } }, '+ Ajouter une section'));

    // structure
    const sp = el('div', 'panel');
    sp.append(el('h3', null, 'Structure du morceau'));
    const order = el('div', 'chord-strip');
    song.structure = song.structure.filter(id => song.sections.some(s => s.id === id));
    song.structure.forEach((id, k) => { const s = song.sections.find(x => x.id === id);
      order.append(el('div', 'chord-cell', el('b', { style: { fontSize: '14px' } }, s.name), el('small', null, `${s.chords.reduce((a, c) => a + (c[2] || 1), 0)} mes.`),
        el('div', { class: 'row', style: { justifyContent: 'center', gap: '2px' } },
          el('button', { class: 'icon-btn', onclick: () => { if (k > 0) { [song.structure[k - 1], song.structure[k]] = [song.structure[k], song.structure[k - 1]]; persist(); draw(); } } }, '‹'),
          el('button', { class: 'icon-btn', onclick: () => { song.structure.splice(k, 1); persist(); draw(); } }, '✕')))); });
    sp.append(order, el('div', 'row', el('span', 'hint', 'Ajouter :'), ...song.sections.map(s => el('button', { class: 'btn ghost sm', onclick: () => { song.structure.push(s.id); persist(); draw(); } }, '+ ' + s.name))));
    const total = song.structure.reduce((a, id) => a + song.sections.find(s => s.id === id).chords.reduce((x, c) => x + (c[2] || 1), 0), 0);
    const playAll = el('button', { class: 'btn' }, '▶ Écouter tout le morceau');
    playAll.addEventListener('click', () => { const all = song.structure.flatMap(id => song.sections.find(s => s.id === id).chords); if (!all.length) return toast('Aucune grille à jouer.'); playChords(all, 1, playAll); });
    sp.append(el('p', 'hint', `${total} mesures · environ ${Math.round(total * 4 * 60 / song.bpm)} s à ${song.bpm} BPM.`), playAll);
    body.append(sp);

    // idées audio
    const ap = el('div', 'panel');
    ap.append(el('h3', null, 'Idées audio'));
    if (!canRecord()) ap.append(el('p', 'hint', 'L’enregistrement n’est pas disponible sur ce navigateur.'));
    else {
      let rec = null;
      const rb = el('button', { class: 'btn ghost' }, '● Enregistrer une idée');
      rb.addEventListener('click', async () => {
        if (rec) {
          const url = await rec.stop(); rec = null; rb.textContent = '● Enregistrer une idée'; rb.style.color = '';
          const blob = await fetch(url).then(r => r.blob());
          const id = 'clip-' + uid();
          try { await putClip(id, blob); } catch (e) { return toast('Impossible de sauvegarder l’audio sur cet appareil.', 'bad'); }
          const name = prompt('Nom de l’idée ?', 'Idée ' + ((song.audio || []).length + 1)) || 'Idée';
          song.audio = song.audio || []; song.audio.unshift({ id, name, d: today() }); persist(); draw();
          return;
        }
        try { rec = new Recorder(); await rec.start(); rb.textContent = '■ Arrêter et garder'; rb.style.color = 'var(--bad)'; }
        catch (e) { rec = null; toast('Micro refusé ou indisponible.', 'bad'); }
      });
      ap.append(rb, el('p', 'hint', 'Stockées dans ce navigateur (IndexedDB). Elles ne sont pas incluses dans l’export JSON : télécharge celles que tu veux garder.'));
    }
    (song.audio || []).forEach((a, i) => {
      const row = el('div', 'block', el('span', 'bi', '🎙'), el('div', { style: { flex: 1 } }, el('b', null, a.name), el('small', null, fmtDate(a.d))));
      getClip(a.id).then(b => { if (!b) { row.append(el('span', 'hint', 'audio introuvable')); return; } const u = URL.createObjectURL(b); row.append(el('audio', { controls: true, src: u, style: { maxWidth: '260px', marginTop: 0 } }), el('a', { class: 'icon-btn', href: u, download: `${song.name}-${a.name}.webm`, title: 'Télécharger' }, '⬇')); }).catch(() => row.append(el('span', 'hint', 'audio indisponible')));
      row.append(el('button', { class: 'icon-btn', title: 'Supprimer', onclick: async () => { if (!confirm('Supprimer cette idée audio ?')) return; await delClip(a.id).catch(() => {}); song.audio.splice(i, 1); persist(); draw(); } }, '✕'));
      ap.append(row);
    });
    body.append(ap);

    const np = el('div', 'panel');
    const gn = el('textarea', { placeholder: 'Notes générales sur le morceau : intention, références, paroles…', style: { minHeight: '90px' } });
    gn.value = song.notes || ''; gn.addEventListener('change', () => { song.notes = gn.value; persist(); });
    np.append(el('h3', null, 'Notes'), gn);
    body.append(np);
  }
  draw();
}
