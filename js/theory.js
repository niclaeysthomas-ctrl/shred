/* ================================================================
   SHRED v2 — moteur théorique
   Tout est calculé, rien n'est écrit à la main : intervalles, gammes,
   modes, accords, harmonisation, positions sur le manche.
   L'orthographe des notes suit la règle « une lettre par degré » :
   F majeur = F G A B♭ C D E (et non A♯).
   Module pur, sans DOM : testé sous Node (tests/theory.test.js).
   ================================================================ */

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
export const LATIN = { C: 'Do', D: 'Ré', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };

/* Accordage standard, corde 0 = Mi grave … corde 5 = Mi aigu (MIDI) */
export const TUNING = [40, 45, 50, 55, 59, 64];
export const STRING_NAMES = ['Mi grave (6)', 'La (5)', 'Ré (4)', 'Sol (3)', 'Si (2)', 'Mi aigu (1)'];

/* Noms « par défaut » d'une hauteur hors contexte de gamme */
export const PC_NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

/* Toniques proposées dans les sélecteurs (les deux orthographes quand l'usage hésite) */
export const TONICS = ['C', 'C♯', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

const mod = (n, m) => ((n % m) + m) % m;

/* ---------------- notes ---------------- */
const ACC_SYM = { '-2': '𝄫', '-1': '♭', '0': '', '1': '♯', '2': '𝄪' };

export function noteName(letterIdx, acc) {
  return LETTERS[mod(letterIdx, 7)] + (ACC_SYM[String(acc)] ?? (acc > 0 ? '♯'.repeat(acc) : '♭'.repeat(-acc)));
}

export function parseNote(name) {
  const raw = String(name).trim();
  const s = raw[0] + raw.slice(1).replace(/#/g, '♯').replace(/b/g, '♭');
  const L = LETTERS.indexOf(s[0].toUpperCase());
  if (L < 0) throw new Error('Note inconnue : ' + name);
  let acc = 0;
  for (const ch of s.slice(1)) {
    if (ch === '♯') acc += 1; else if (ch === '♭') acc -= 1;
    else if (ch === '𝄪') acc += 2; else if (ch === '𝄫') acc -= 2;
  }
  return { letter: L, acc, pc: mod(LETTER_PC[L] + acc, 12) };
}

export const pcOf = name => parseNote(name).pc;

/* ---------------- intervalles ---------------- */
const BASE_SEMIS = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 8: 12, 9: 14, 10: 16, 11: 17, 12: 19, 13: 21 };

export function parseInterval(label) {
  const m = /^([b♭#♯]*)(\d+)$/.exec(String(label));
  if (!m) throw new Error('Intervalle inconnu : ' + label);
  let acc = 0;
  for (const ch of m[1]) acc += (ch === '#' || ch === '♯') ? 1 : -1;
  const num = +m[2];
  if (!(num in BASE_SEMIS)) throw new Error('Intervalle inconnu : ' + label);
  return { label, num, acc, semis: BASE_SEMIS[num] + acc, deg: mod(num - 1, 7) + 1 };
}

/* « b3 » → « ♭3 » pour l'affichage */
export const ivDisplay = label => String(label).replace(/bb/g, '𝄫').replace(/b/g, '♭').replace(/##/g, '𝄪').replace(/#/g, '♯');

export const IV_NAMES = {
  '1': 'fondamentale', 'b2': 'seconde mineure', '2': 'seconde majeure', '#2': 'seconde augmentée',
  'b3': 'tierce mineure', '3': 'tierce majeure', '4': 'quarte juste', '#4': 'quarte augmentée (triton)',
  'b5': 'quinte diminuée (triton)', '5': 'quinte juste', '#5': 'quinte augmentée', 'b6': 'sixte mineure',
  '6': 'sixte majeure', 'bb7': 'septième diminuée', 'b7': 'septième mineure', '7': 'septième majeure',
  'b9': 'neuvième mineure', '9': 'neuvième', '#9': 'neuvième augmentée', '11': 'onzième', '#11': 'onzième augmentée',
  'b13': 'treizième mineure', '13': 'treizième'
};
export const ivName = l => IV_NAMES[l] || l;

/* Rôle d'un intervalle → famille de couleur sur le manche */
export function ivRole(label) {
  const { deg } = parseInterval(label);
  return { 1: 'root', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh' }[deg];
}

/* Intervalle simple (un seul nom) pour un écart en demi-tons, hors contexte */
export const SEMI_TO_IV = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
export const SEMI_NAMES = ['unisson', 'seconde mineure', 'seconde majeure', 'tierce mineure', 'tierce majeure',
  'quarte juste', 'triton', 'quinte juste', 'sixte mineure', 'sixte majeure', 'septième mineure', 'septième majeure', 'octave'];

/* Épeler la note située à `label` au-dessus de `tonic` */
export function spell(tonic, label) {
  const t = parseNote(tonic), iv = parseInterval(label);
  const L = mod(t.letter + iv.num - 1, 7);
  const targetPc = mod(t.pc + iv.semis, 12);
  let acc = mod(targetPc - LETTER_PC[L], 12);
  if (acc > 6) acc -= 12;
  return noteName(L, acc);
}

export const accCount = name => Math.abs(parseNote(name).acc);

/* ---------------- gammes ---------------- */
export const SCALES = {
  ionian:     { name: 'Majeure (ionien)', iv: ['1', '2', '3', '4', '5', '6', '7'], mode: 0 },
  dorian:     { name: 'Dorien', iv: ['1', '2', 'b3', '4', '5', '6', 'b7'], mode: 1 },
  phrygian:   { name: 'Phrygien', iv: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], mode: 2 },
  lydian:     { name: 'Lydien', iv: ['1', '2', '3', '#4', '5', '6', '7'], mode: 3 },
  mixolydian: { name: 'Mixolydien', iv: ['1', '2', '3', '4', '5', '6', 'b7'], mode: 4 },
  aeolian:    { name: 'Mineure naturelle (éolien)', iv: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], mode: 5 },
  locrian:    { name: 'Locrien', iv: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], mode: 6 },
  minPenta:   { name: 'Pentatonique mineure', iv: ['1', 'b3', '4', '5', 'b7'] },
  majPenta:   { name: 'Pentatonique majeure', iv: ['1', '2', '3', '5', '6'] },
  blues:      { name: 'Gamme blues', iv: ['1', 'b3', '4', 'b5', '5', 'b7'] },
  harmMinor:  { name: 'Mineure harmonique', iv: ['1', '2', 'b3', '4', '5', 'b6', '7'] },
  phrygDom:   { name: 'Phrygien dominant', iv: ['1', 'b2', '3', '4', '5', 'b6', 'b7'] }
};
export const MODE_IDS = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];

export function buildScale(tonic, scaleId) {
  const sc = SCALES[scaleId];
  if (!sc) throw new Error('Gamme inconnue : ' + scaleId);
  return sc.iv.map(l => {
    const name = spell(tonic, l);
    return { iv: l, name, pc: pcOf(name), deg: parseInterval(l).deg };
  });
}

/* Écarts successifs (T, ½T, 1½T) — la « formule » en tons */
export function stepPattern(scaleId) {
  const s = SCALES[scaleId].iv.map(l => parseInterval(l).semis);
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const d = (i + 1 < s.length ? s[i + 1] : 12) - s[i];
    out.push(d === 1 ? '½T' : d === 2 ? 'T' : d === 3 ? '1½T' : d + '½T');
  }
  return out;
}

/* Gamme majeure « parente » d'un mode : la tonique du mode est le n-ième degré de cette gamme */
export function parentMajor(tonic, modeId) {
  const idx = SCALES[modeId].mode;
  if (idx == null) return null;
  const majorIv = SCALES.ionian.iv[idx];        // ex. dorien = 2ᵉ degré → la parente est une seconde majeure en dessous
  // On cherche la tonique P telle que spell(P, majorIv) == tonic
  const t = parseNote(tonic), iv = parseInterval(majorIv);
  const L = mod(t.letter - (iv.num - 1), 7);
  const pc = mod(t.pc - iv.semis, 12);
  let acc = mod(pc - LETTER_PC[L], 12); if (acc > 6) acc -= 12;
  return noteName(L, acc);
}

/* Différences entre deux gammes de même tonique */
export function compareScales(tonic, a, b) {
  const A = buildScale(tonic, a), B = buildScale(tonic, b);
  const pcsA = new Set(A.map(n => n.pc)), pcsB = new Set(B.map(n => n.pc));
  return {
    common: A.filter(n => pcsB.has(n.pc)),
    onlyA: A.filter(n => !pcsB.has(n.pc)),
    onlyB: B.filter(n => !pcsA.has(n.pc)),
    A, B
  };
}

/* Orthographe plus simple disponible ? (évite 𝄫 et 𝄪) */
export function simplerTonic(tonic, scaleId) {
  const cost = t => buildScale(t, scaleId).reduce((a, n) => a + accCount(n.name) + (accCount(n.name) > 1 ? 4 : 0), 0);
  const pc = pcOf(tonic), here = cost(tonic);
  let best = null;
  for (const t of TONICS) if (t !== tonic && pcOf(t) === pc) {
    const c = cost(t); if (c < here && (!best || c < best.c)) best = { t, c };
  }
  return best ? best.t : null;
}

/* ---------------- accords ---------------- */
export const CHORD_TYPES = {
  maj:   { sym: '',      name: 'Majeur',             iv: ['1', '3', '5'] },
  min:   { sym: 'm',     name: 'Mineur',             iv: ['1', 'b3', '5'] },
  dim:   { sym: '°',     name: 'Diminué',            iv: ['1', 'b3', 'b5'] },
  aug:   { sym: '+',     name: 'Augmenté',           iv: ['1', '3', '#5'] },
  sus2:  { sym: 'sus2',  name: 'Sus2',               iv: ['1', '2', '5'] },
  sus4:  { sym: 'sus4',  name: 'Sus4',               iv: ['1', '4', '5'] },
  power: { sym: '5',     name: 'Power chord',        iv: ['1', '5'] },
  add9:  { sym: 'add9',  name: 'Add9',               iv: ['1', '3', '5', '9'] },
  maj7:  { sym: 'maj7',  name: 'Majeur 7',           iv: ['1', '3', '5', '7'] },
  m7:    { sym: 'm7',    name: 'Mineur 7',           iv: ['1', 'b3', '5', 'b7'] },
  dom7:  { sym: '7',     name: 'Septième de dominante', iv: ['1', '3', '5', 'b7'] },
  m7b5:  { sym: 'm7♭5',  name: 'Demi-diminué (m7♭5)', iv: ['1', 'b3', 'b5', 'b7'] },
  dim7:  { sym: '°7',    name: 'Diminué 7',          iv: ['1', 'b3', 'b5', 'bb7'] },
  mMaj7: { sym: 'm(maj7)', name: 'Mineur majeur 7',  iv: ['1', 'b3', '5', '7'] },
  maj7s5:{ sym: 'maj7♯5', name: 'Majeur 7 quinte augmentée', iv: ['1', '3', '#5', '7'] },
  m9:    { sym: 'm9',    name: 'Mineur 9',           iv: ['1', 'b3', '5', 'b7', '9'] },
  maj9:  { sym: 'maj9',  name: 'Majeur 9',           iv: ['1', '3', '5', '7', '9'] },
  sus7:  { sym: '7sus4', name: '7sus4',              iv: ['1', '4', '5', 'b7'] }
};
/* Ordre d'affichage dans le Chord Lab (les 13 du cahier des charges, puis les utiles) */
export const CHORD_ORDER = ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', 'add9', 'maj7', 'm7', 'dom7', 'm9', 'maj9', 'sus7', 'power', 'm7b5', 'dim7'];

export function buildChord(root, typeId) {
  const t = CHORD_TYPES[typeId];
  if (!t) throw new Error('Accord inconnu : ' + typeId);
  return t.iv.map(l => { const name = spell(root, l); return { iv: l, name, pc: pcOf(name) }; });
}
export const chordSymbol = (root, typeId) => root + CHORD_TYPES[typeId].sym;

/* Renversements : on fait tourner l'ordre des notes (la basse change) */
export function inversions(root, typeId) {
  const notes = buildChord(root, typeId).filter(n => parseInterval(n.iv).num < 8); // pas de 9 en basse
  const names = ['État fondamental', '1er renversement', '2e renversement', '3e renversement'];
  return notes.map((_, k) => ({ name: names[k], bass: notes[k], order: notes.slice(k).concat(notes.slice(0, k)) }));
}

/* Reconnaître la qualité à partir des demi-tons au-dessus de la fondamentale */
const QUAL_BY_SEMIS = {
  '4,7': 'maj', '3,7': 'min', '3,6': 'dim', '4,8': 'aug',
  '4,7,11': 'maj7', '4,7,10': 'dom7', '3,7,10': 'm7', '3,6,10': 'm7b5', '3,6,9': 'dim7', '3,7,11': 'mMaj7', '4,8,11': 'maj7s5'
};

/* ---------------- harmonisation ---------------- */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export function romanFor(degLabel, typeId) {
  const iv = parseInterval(degLabel);
  const accTxt = iv.acc < 0 ? '♭'.repeat(-iv.acc) : '♯'.repeat(iv.acc);
  let r = ROMAN[iv.deg - 1];
  const lower = ['min', 'dim', 'm7', 'm7b5', 'dim7', 'mMaj7', 'm9'].includes(typeId);
  if (lower) r = r.toLowerCase();
  const suffix = { dim: '°', aug: '+', maj7: 'maj7', m7: '7', dom7: '7', m7b5: 'ø7', dim7: '°7', mMaj7: '(maj7)', maj7s5: '+maj7' }[typeId] || '';
  return accTxt + r + suffix;
}

/* Construit les accords diatoniques (triades ou septièmes) d'une gamme de 7 notes, en empilant des tierces */
export function harmonize(tonic, scaleId, sevenths = false) {
  const sc = buildScale(tonic, scaleId);
  if (sc.length !== 7) throw new Error('L’harmonisation par tierces demande une gamme de 7 notes');
  return sc.map((n, i) => {
    const idx = sevenths ? [0, 2, 4, 6] : [0, 2, 4];
    const stack = idx.map(k => sc[(i + k) % 7]);
    const semis = stack.slice(1).map(x => mod(x.pc - n.pc, 12));
    const typeId = QUAL_BY_SEMIS[semis.join(',')] || null;
    return {
      degree: i + 1, root: n.name, rootIv: n.iv, typeId,
      symbol: typeId ? chordSymbol(n.name, typeId) : n.name + '?',
      roman: typeId ? romanFor(n.iv, typeId) : '?',
      notes: stack, semis
    };
  });
}

/* Fonction harmonique (tonale) — n'a de sens qu'en majeur / mineur */
export function harmonicFunction(scaleId, degree) {
  if (scaleId === 'ionian') return ({ 1: 'T', 2: 'SD', 3: 'T', 4: 'SD', 5: 'D', 6: 'T', 7: 'D' })[degree];
  if (scaleId === 'aeolian' || scaleId === 'harmMinor') return ({ 1: 'T', 2: 'SD', 3: 'T', 4: 'SD', 5: 'D', 6: 'SD', 7: 'D' })[degree];
  return null;
}
export const FUNCTION_NAMES = { T: 'Tonique (repos)', SD: 'Sous-dominante (départ, préparation)', D: 'Dominante (tension → retour)' };

/* ---------------- manche ---------------- */
export const midiAt = (s, f) => TUNING[s] + f;
export const pcAt = (s, f) => mod(TUNING[s] + f, 12);

/* Toutes les cases (corde, case) d'un ensemble de hauteurs */
export function positionsOf(pcs, maxFret = 15) {
  const set = new Set(pcs), out = [];
  for (let s = 0; s < 6; s++) for (let f = 0; f <= maxFret; f++) if (set.has(pcAt(s, f))) out.push({ s, f, pc: pcAt(s, f) });
  return out;
}

/* Zones de jeu d'une gamme : une zone par note de la gamme sur la corde de Mi grave,
   largeur 4 cases (penta) ou 5 cases (gamme de 7 notes). */
export function scaleZones(scaleNotes, maxFret = 15) {
  const width = scaleNotes.length <= 6 ? 4 : 5;
  const pcs = new Set(scaleNotes.map(n => n.pc));
  const zones = [];
  for (let f = 1; f <= 12; f++) if (pcs.has(pcAt(0, f))) {
    const note = scaleNotes.find(n => n.pc === pcAt(0, f));
    zones.push({ from: f, to: Math.min(maxFret, f + width - 1), startIv: note.iv, startName: note.name });
  }
  // On ordonne à partir de la zone qui démarre sur la tonique
  const k = zones.findIndex(z => z.startIv === '1');
  return k > 0 ? zones.slice(k).concat(zones.slice(0, k)) : zones;
}

/* ---------------- voicings d'accords jouables ---------------- */
export function chordVoicings(root, typeId, { bassIv = '1', maxFret = 15, limit = 10 } = {}) {
  const notes = buildChord(root, typeId);
  const pcToIv = new Map(notes.map(n => [n.pc, n.iv]));
  const bassPc = notes.find(n => n.iv === bassIv)?.pc ?? notes[0].pc;
  const optional = notes.length >= 4 ? new Set(notes.filter(n => n.iv === '5').map(n => n.pc)) : new Set();
  const essential = notes.filter(n => !optional.has(n.pc)).map(n => n.pc);
  const found = new Map();

  for (let start = 1; start <= maxFret - 3; start++) {
    const allowOpen = start <= 4;
    const opts = [];
    for (let s = 0; s < 6; s++) {
      const o = [-1];
      if (allowOpen && pcToIv.has(pcAt(s, 0))) o.push(0);
      for (let f = start; f <= start + 3; f++) if (pcToIv.has(pcAt(s, f))) o.push(f);
      opts.push(o);
    }
    const cur = new Array(6);
    const rec = s => {
      if (s === 6) { evaluate(cur.slice()); return; }
      for (const f of opts[s]) { cur[s] = f; rec(s + 1); }
    };
    rec(0);
  }

  function evaluate(fr) {
    const sounded = fr.map((f, s) => f >= 0 ? s : -1).filter(s => s >= 0);
    if (sounded.length < Math.min(3, notes.length) || sounded.length < 3 && notes.length > 2) return;
    const lo = sounded[0], hi = sounded[sounded.length - 1];
    if (hi - lo + 1 !== sounded.length) return;                 // cordes contiguës
    if (pcAt(lo, fr[lo]) !== bassPc) return;                     // la bonne basse
    const pcs = new Set(sounded.map(s => pcAt(s, fr[s])));
    if (!essential.every(p => pcs.has(p))) return;               // toutes les notes essentielles
    const fretted = sounded.filter(s => fr[s] > 0).map(s => fr[s]);
    const hasOpen = sounded.some(s => fr[s] === 0);
    if (fretted.length) {
      const mn = Math.min(...fretted), mx = Math.max(...fretted);
      if (mx - mn > 3) return;
      let fingers;
      if (hasOpen) fingers = fretted.length;
      else {
        const atMin = sounded.filter(s => fr[s] === mn);
        const barreOk = atMin.length > 1 && sounded.filter(s => s >= atMin[0]).every(s => fr[s] >= mn);
        fingers = fretted.filter(f => f !== mn).length + (barreOk ? 1 : atMin.length);
      }
      if (fingers > 4) return;
    }
    const key = fr.join(',');
    const minF = fretted.length ? Math.min(...fretted) : 0;
    const top = pcAt(hi, fr[hi]);
    const score = sounded.length * 10 - (fretted.length ? Math.max(...fretted) - minF : 0) * 2 - minF * 0.15
      + (pcs.size === notes.length ? 6 : 0) + (top === notes[0].pc ? 1 : 0);
    found.set(key, {
      frets: fr, score, minFret: minF,
      ivs: fr.map((f, s) => f >= 0 ? pcToIv.get(pcAt(s, f)) : null)
    });
  }

  // Le meilleur voicing par région du manche
  const byRegion = new Map();
  for (const v of found.values()) {
    const region = v.frets.every(f => f <= 0) ? 0 : Math.round(v.minFret / 2.5);
    const cur = byRegion.get(region);
    if (!cur || v.score > cur.score) byRegion.set(region, v);
  }
  return [...byRegion.values()].sort((a, b) => a.minFret - b.minFret).slice(0, limit);
}

/* Triades serrées sur 3 cordes voisines, dans les 3 états (fondamental, 1er, 2e renversement) */
export function triadShapes(root, typeId, strings) {
  const notes = buildChord(root, typeId).slice(0, 3);
  if (notes.length < 3) return [];
  const out = [];
  for (let k = 0; k < 3; k++) {
    const order = notes.slice(k).concat(notes.slice(0, k));
    for (let f0 = 0; f0 <= 14; f0++) {
      if (pcAt(strings[0], f0) !== order[0].pc) continue;
      const pick = (s, pc, near) => {
        let best = null;
        for (let f = Math.max(0, near - 4); f <= Math.min(17, near + 4); f++)
          if (pcAt(s, f) === pc && (best === null || Math.abs(f - near) < Math.abs(best - near))) best = f;
        return best;
      };
      const f1 = pick(strings[1], order[1].pc, f0);
      if (f1 === null) continue;
      const f2 = pick(strings[2], order[2].pc, f1);
      if (f2 === null) continue;
      const fr = [f0, f1, f2];
      // voicing serré : chaque note plus aiguë que la précédente, dans l'octave
      const m = fr.map((f, i) => midiAt(strings[i], f));
      if (!(m[0] < m[1] && m[1] < m[2] && m[2] - m[0] < 12)) continue;
      if (Math.max(...fr) - Math.min(...fr) > 4) continue;
      out.push({ inversion: k, strings, frets: fr, notes: order });
    }
  }
  return out;
}
export const STRING_SETS = [[3, 4, 5], [2, 3, 4], [1, 2, 3], [0, 1, 2]];
export const STRING_SET_NAMES = ['Cordes 3-2-1 (aiguës)', 'Cordes 4-3-2', 'Cordes 5-4-3', 'Cordes 6-5-4 (graves)'];

/* ---------------- progressions (en degrés, transposables) ---------------- */
/* Chaque accord : [intervalle de la fondamentale depuis la tonique, type, mesures] */
export function realizeProgression(tonic, chords) {
  return chords.map(([iv, typeId, bars = 1]) => {
    const root = spell(tonic, iv);
    return { root, typeId, bars, iv, symbol: chordSymbol(root, typeId), roman: romanFor(iv, typeId), notes: buildChord(root, typeId) };
  });
}

/* ---------------- divers ---------------- */
export const midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);
export function ivBetween(pcLow, pcHigh) { return SEMI_TO_IV[mod(pcHigh - pcLow, 12)]; }
