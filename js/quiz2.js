/* ================================================================
   Générateurs supplémentaires : oreille, improvisation, composition.
   Ils s'ajoutent à GENERATORS (quiz.js). Tout est calculé.
   ================================================================ */
import * as T from './theory.js';
import { GENERATORS as G } from './quiz.js';
import { N, IV, shuffle, pick } from './ui.js';
import { playNotes, closeVoicing, pluck, ac } from './audio.js';
import { MODE_INFO } from './content/modes.js';

const names = arr => arr.map(n => N(n.name)).join(' – ');
const CF = s => String(s).replace(/^([A-G][♯♭𝄪𝄫]*)/, m => N(m));
const opts = (correct, pool, fmt = x => x, n = 4) => shuffle([correct, ...shuffle(pool.filter(x => x !== correct)).slice(0, n - 1)]).map(v => ({ value: v, label: fmt(v) }));
const noteOpts = c => { const pc = T.pcOf(c); return shuffle([c, ...shuffle(T.PC_NAMES.filter(x => T.pcOf(x) !== pc)).slice(0, 3)]).map(v => ({ value: v, label: N(v) })); };
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/* Jouer une cadence I–IV–V–I pour installer une tonalité */
function cadence(tonicPc, when = 0, minor = false) {
  const t0 = (when || ac().currentTime) + 0.05, root = 48 + tonicPc;
  const chords = minor ? [[0, 3, 7], [5, 8, 12], [7, 11, 14], [0, 3, 7]] : [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]];
  chords.forEach((c, i) => c.forEach((iv, k) => pluck(root + iv, { when: t0 + i * 0.65 + k * 0.02, vel: 0.35, dur: 0.9 })));
  return t0 + chords.length * 0.65;
}

/* ---------------- OREILLE ---------------- */
const EAR_IVS = { easy: [3, 4, 5, 7, 12], mid: [2, 3, 4, 5, 7, 9, 10, 12], all: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] };
const ivLabel = s => s === 12 ? 'octave' : T.SEMI_NAMES[s];
const REFS = { 1: '« Les Dents de la mer »', 2: 'début d’« Frère Jacques »', 3: '« Smoke on the Water » (2 premières notes)', 4: '« Oh When the Saints »', 5: '« Here Comes the Bride » (marche nuptiale)', 6: 'intro des « Simpsons »', 7: '« Star Wars » (thème, 2 premières notes)', 8: '« The Entertainer » (saut)', 9: '« My Way » (2 premières notes)', 10: '« Star Trek » (série originale)', 11: 'presque l’octave, très tendu', 12: '« Somewhere Over the Rainbow »' };

G.earIntervals = () => {
  const pool = pick([EAR_IVS.easy, EAR_IVS.mid, EAR_IVS.all]);
  const s = pick(pool), low = rnd(48, 62), mode = pick(['up', 'up', 'down', 'harm']);
  const play = () => mode === 'harm' ? playNotes([low, low + s], { gap: 0.01, dur: 2 }) : mode === 'down' ? playNotes([low + s, low], { gap: 0.6 }) : playNotes([low, low + s], { gap: 0.6 });
  return { type: 'choice', autoplay: true, audio: play, prompt: `Écoute : quel intervalle ? <span class="hint">(${mode === 'harm' ? 'les deux notes ensemble' : mode === 'down' ? 'descendant' : 'montant'})</span>`,
    options: opts(s, pool, ivLabel), answer: s,
    explain: `C’était une <b>${ivLabel(s)}</b> (${s} demi-tons). Repère mémoire : ${REFS[s]}. Sur le manche : ${s <= 4 ? `${s} case${s > 1 ? 's' : ''} plus loin sur la même corde` : s === 5 ? 'même case, corde suivante' : s === 7 ? 'corde suivante, 2 cases plus loin (la forme du power chord)' : s === 12 ? '2 cordes plus haut, 2 cases plus loin' : 'cherche-le sur une seule corde'}.` };
};

G.earChords = () => {
  const r = rnd(0, 11), q = pick(['maj', 'min']), ch = T.buildChord(T.PC_NAMES[r], q);
  const v = closeVoicing(ch.map(n => n.pc), 48);
  return { type: 'choice', autoplay: true, audio: () => playNotes(v, { gap: 0.03 }), audio2: () => playNotes(v, { gap: 0.35 }), audio2Label: 'Arpégé',
    prompt: 'Majeur ou mineur ?', options: [{ value: 'maj', label: 'Majeur' }, { value: 'min', label: 'Mineur' }], answer: q,
    explain: `C’était ${CF(T.chordSymbol(T.PC_NAMES[r], q))} (${q === 'maj' ? 'majeur' : 'mineur'}) : ${names(ch)}. Écoute la note du milieu (la tierce) : ${q === 'maj' ? 'lumineuse, ouverte' : 'sombre, voilée'}. Astuce : arpège l’accord et chante la tierce.` };
};

G.earTriads = () => {
  const r = rnd(0, 11), q = pick(['maj', 'min', 'dim', 'aug', 'sus4', 'sus2']), ch = T.buildChord(T.PC_NAMES[r], q);
  const v = closeVoicing(ch.map(n => n.pc), 50);
  const desc = { maj: 'stable, lumineux', min: 'stable, sombre', dim: 'serré, inquiet, veut bouger', aug: 'flottant, « rêve »', sus4: 'suspendu, veut retomber sur la tierce', sus2: 'ouvert, ni majeur ni mineur' };
  return { type: 'choice', autoplay: true, audio: () => playNotes(v), audio2: () => playNotes(v, { gap: 0.35 }), audio2Label: 'Arpégé',
    prompt: 'Quelle triade ?', options: ['maj', 'min', 'dim', 'aug', 'sus4', 'sus2'].map(x => ({ value: x, label: T.CHORD_TYPES[x].name })), answer: q,
    explain: `C’était un accord <b>${T.CHORD_TYPES[q].name.toLowerCase()}</b> (${ch.map(n => IV(n.iv)).join(' ')}) : ${desc[q]}.` };
};

G.earSevenths = () => {
  const r = rnd(0, 11), q = pick(['maj7', 'm7', 'dom7', 'm7b5']), ch = T.buildChord(T.PC_NAMES[r], q);
  const v = closeVoicing(ch.map(n => n.pc), 48);
  const desc = { maj7: 'doux, rêveur (septième majeure, un demi-ton sous l’octave)', m7: 'mineur souple', dom7: 'majeur tendu, bluesy (le triton 3–♭7)', m7b5: 'sombre et instable' };
  return { type: 'choice', autoplay: true, audio: () => playNotes(v), audio2: () => playNotes(v, { gap: 0.3 }), audio2Label: 'Arpégé',
    prompt: 'Quel accord de septième ?', options: ['maj7', 'm7', 'dom7', 'm7b5'].map(x => ({ value: x, label: 'X' + T.CHORD_TYPES[x].sym })), answer: q,
    explain: `C’était un <b>${T.CHORD_TYPES[q].name}</b> : ${desc[q]}.` };
};

G.earCompare = () => {
  const r = rnd(0, 11), pair = pick([['maj', 'min'], ['min', 'maj'], ['maj', 'maj'], ['min', 'min'], ['maj7', 'dom7'], ['dom7', 'maj7'], ['sus4', 'maj']]);
  const a = T.buildChord(T.PC_NAMES[r], pair[0]), b = T.buildChord(T.PC_NAMES[r], pair[1]);
  const va = closeVoicing(a.map(n => n.pc), 48), vb = closeVoicing(b.map(n => n.pc), 48);
  const same = pair[0] === pair[1];
  const changed = a.filter(n => !b.some(m => m.pc === n.pc));
  return { type: 'choice', autoplay: true, audio: () => { const t = ac().currentTime; playNotes(va, { when: t + 0.05 }); playNotes(vb, { when: t + 1.6 }); },
    prompt: 'Deux accords sur la même fondamentale : sont-ils identiques ?', options: [{ value: 'same', label: 'Identiques' }, { value: 'diff', label: 'Différents' }], answer: same ? 'same' : 'diff',
    explain: same ? `Identiques : deux fois ${CF(T.chordSymbol(T.PC_NAMES[r], pair[0]))}.` : `Différents : ${CF(T.chordSymbol(T.PC_NAMES[r], pair[0]))} puis ${CF(T.chordSymbol(T.PC_NAMES[r], pair[1]))}. Note qui change : ${changed.map(n => N(n.name) + ' (' + IV(n.iv) + ')').join(', ')}.` };
};

G.earDegrees = () => {
  const t = pick(['C', 'D', 'E', 'F', 'G', 'A']), sc = T.buildScale(t, 'ionian'), d = pick([1, 2, 3, 4, 5, 6, 7]);
  const tp = T.pcOf(t), m = 60 + ((sc[d - 1].pc - 60) % 12 + 12) % 12;
  return { type: 'choice', autoplay: true, audio: () => { const end = cadence(tp); pluck(m, { when: end + 0.3, vel: 0.6, dur: 2 }); }, audio2: () => pluck(m, { vel: 0.6, dur: 2 }), audio2Label: 'Note seule',
    prompt: 'Une cadence installe la tonalité, puis une note. Quel degré ?', options: [1, 2, 3, 4, 5, 6, 7].map(x => ({ value: x, label: String(x) })), answer: d,
    explain: `C’était le <b>${d}e degré</b> (${N(sc[d - 1].name)} en ${N(t)} majeur). ${{ 1: 'Repos total.', 2: 'Instable, veut descendre vers 1 ou monter vers 3.', 3: 'Stable et lumineux.', 4: 'Tire vers 3.', 5: 'Stable, ouvert, « en attente ».', 6: 'Doux, un peu mélancolique, tire vers 5.', 7: 'La sensible : elle veut absolument monter vers 1.' }[d]}` };
};

G.earMelody = () => {
  const t = pick(['C', 'G', 'D', 'A', 'E']), id = pick(['majPenta', 'minPenta', 'ionian']), sc = T.buildScale(t, id);
  const len = pick([3, 3, 4]);
  let k = rnd(0, sc.length - 1);
  const seq = [];
  for (let i = 0; i < len; i++) { seq.push(sc[(k + sc.length) % sc.length]); k += pick([-1, 1, 1, 2, -2]); }
  const base = 57 + ((T.pcOf(t) - 57) % 12 + 12) % 12;
  const midis = []; let last = null;
  seq.forEach(n => { let m = base + ((n.pc - base) % 12 + 12) % 12; if (last != null) { while (m - last > 6) m -= 12; while (last - m > 6) m += 12; } midis.push(m); last = m; });
  return { type: 'sequence', autoplay: true, audio: () => playNotes(midis, { gap: 0.55 }), audio2: () => pluck(base, { dur: 2 }), audio2Label: 'Tonique (' + N(t) + ')', base,
    prompt: `Reproduis la mélodie (${len} notes) dans l’ordre. Toutes ses notes sont dans la gamme : ${N(t)} ${T.SCALES[id].name.toLowerCase()}.`,
    choices: sc.map(n => n.pc), names: sc.map(n => n.name), answer: seq.map(n => n.pc),
    explain: `Mélodie : ${names(seq)} (${seq.map(n => IV(n.iv)).join(' ')}). Conseil : chante-la d’abord, trouve la première note sur la guitare, puis avance intervalle par intervalle.` };
};

G.earModes = () => {
  const id = pick(['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian']), t = pick(['C', 'D', 'E', 'A']);
  const sc = T.buildScale(t, id), base = 52 + ((T.pcOf(t) - 52) % 12 + 12) % 12;
  const midis = sc.map(n => base + ((n.pc - base) % 12 + 12) % 12).sort((a, b) => a - b).concat([base + 12]);
  return { type: 'choice', autoplay: true, audio: () => { const tt = ac().currentTime; pluck(base - 12, { when: tt, dur: 5, vel: 0.4 }); playNotes(midis, { gap: 0.32, when: tt + 0.4 }); },
    prompt: `Une gamme sur ${N(t)} (bourdon grave). Quel mode ?`, options: ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian'].map(x => ({ value: x, label: MODE_INFO[x].name })), answer: id,
    explain: `C’était ${N(t)} ${MODE_INFO[id].name.toLowerCase()} : ${names(sc)}. Indices : d’abord la tierce (majeur ou mineur), puis la note caractéristique (${MODE_INFO[id].char.map(IV).join(', ')}).` };
};

G.earTranscribe = () => {
  // phrase de 4-5 notes en penta mineure, à transcrire : on donne la première note
  const t = pick(['A', 'E', 'D', 'G']), sc = T.buildScale(t, 'minPenta');
  const base = 57 + ((T.pcOf(t) - 57) % 12 + 12) % 12;
  const seq = [sc[0]]; let k = 0;
  for (let i = 0; i < pick([3, 4]); i++) { k = Math.max(-2, Math.min(5, k + pick([-1, 1, 1, 2, -2]))); seq.push(sc[((k % 5) + 5) % 5]); }
  const midis = []; let last = null;
  seq.forEach(n => { let m = base + ((n.pc - base) % 12 + 12) % 12; if (last != null) { while (m - last > 6) m -= 12; while (last - m > 6) m += 12; } midis.push(m); last = m; });
  return { type: 'sequence', autoplay: true, audio: () => playNotes(midis, { gap: 0.42 }), base, choices: sc.map(n => n.pc), names: sc.map(n => n.name),
    prompt: `Transcris cette phrase blues-rock (${seq.length} notes, ${N(t)} penta mineure). Elle commence sur ${N(t)}.`, answer: seq.map(n => n.pc),
    explain: `Phrase : ${names(seq)}. Méthode de transcription : 1) chante, 2) trouve la première note, 3) monte ou descend ? 4) de combien ? Avec la guitare en main, pas à pas.` };
};

/* ---------------- IMPROVISATION ---------------- */
G.passing = () => {
  const t = pick(['A', 'E', 'G', 'D']), sc = T.buildScale(t, 'minPenta');
  const pairs = [['4', '5', 'b5'], ['b7', '1', '7'], ['b3', '4', '3'], ['5', 'b7', '6']];
  const [a, b, mid] = pick(pairs);
  const na = T.spell(t, a), nb = T.spell(t, b), nm = T.spell(t, mid);
  return { type: 'choice', prompt: `En ${N(t)} penta mineure, pour relier chromatiquement ${N(na)} (${IV(a)}) et ${N(nb)} (${IV(b)}), quelle [[chromatique|note de passage]] utiliser ?`.replace(/\[\[[^|]+\|([^\]]+)\]\]/, '$1'),
    options: noteOpts(nm), answer: nm,
    explain: `${N(nm)} (${IV(mid)}) est entre les deux, à un demi-ton de chacune. Une note de passage se joue <b>en mouvement</b>, sur un temps faible : on ne s’arrête pas dessus.` };
};

G.enrichedPenta = () => {
  const t = pick(['A', 'E', 'D', 'G', 'B']), want = pick([['dorian', '6'], ['aeolian', 'b6'], ['dorian', '2'], ['mixolydian', '4'], ['phrygian', 'b2']]);
  const [id, l] = want;
  const target = T.spell(t, l);
  const ctx = { dorian: `sur une vamp ${N(t)}m7 → ${N(T.spell(t, '4'))}7 (dorien)`, aeolian: `sur ${N(t)}m → ${N(T.spell(t, 'b6'))} (éolien, sombre)`, mixolydian: `sur ${N(t)}7 (mixolydien, penta majeure)`, phrygian: `sur ${N(t)}m → ${N(T.spell(t, 'b2'))} (phrygien)` }[id];
  return { type: 'choice', prompt: `Tu joues la penta ${id === 'mixolydian' ? 'majeure' : 'mineure'} de ${N(t)} ${ctx}. Quelle note ajouter pour faire entendre la couleur ${MODE_INFO[id].name.toLowerCase()} ?`,
    options: noteOpts(target), answer: target,
    explain: `${N(target)} = la ${IV(l)} de ${N(t)}. ${MODE_INFO[id].pentaLink} C’est la « penta enrichie » : ta boîte habituelle + une ou deux notes qui disent le mode.` };
};

G.multiChord = () => {
  const t = pick(['A', 'E', 'D', 'G', 'C']), id = pick(['ionian', 'aeolian']);
  const H = T.harmonize(t, id), pickC = shuffle([0, 3, 4, 5].map(i => H[i])).slice(0, 3);
  const pcs = pickC.map(c => new Set(c.notes.map(n => n.pc)));
  const sc = T.buildScale(t, id);
  return pick([
    () => ({ type: 'choice', prompt: `Grille : ${pickC.map(c => CF(c.symbol)).join(' → ')}. Quelle gamme unique fonctionne sur les trois accords ?`,
      options: opts(`${t}|${id}`, [`${t}|${id === 'ionian' ? 'aeolian' : 'ionian'}`, `${T.spell(t, '2')}|ionian`, `${T.spell(t, '5')}|${id}`], v => N(v.split('|')[0]) + ' ' + T.SCALES[v.split('|')[1]].name.toLowerCase()), answer: `${t}|${id}`,
      explain: `Les trois accords sont diatoniques à ${N(t)} ${T.SCALES[id].name.toLowerCase()} (${names(sc)}). Une seule gamme suffit — mais ce sont les notes d’accord qui feront « parler » chaque mesure.` }),
    () => {
      const [a, b] = pickC; const common = a.notes.filter(n => b.notes.some(m => m.pc === n.pc));
      if (!common.length) return G.passing();
      return { type: 'notes', prompt: `Quelle(s) note(s) peux-tu tenir sans bouger quand la grille passe de ${CF(a.symbol)} à ${CF(b.symbol)} ?`, answer: common.map(n => n.pc),
        explain: `Notes communes : ${names(common)}. Tenir une note commune pendant un changement d’accord, c’est un effet magnifique (Gilmour le fait tout le temps) : la note ne bouge pas, mais sa couleur change.` };
    }
  ])();
};

G.motifId = () => {
  const t = pick(['A', 'E', 'G']), sc = T.buildScale(t, 'minPenta'), start = rnd(0, 1);
  const m = [sc[start], sc[start + 1], sc[start + 2]];
  const kind = pick(['repeat', 'seq', 'inv', 'rhythm']);
  let m2, txt;
  if (kind === 'repeat') { m2 = m; txt = 'les mêmes notes, le même rythme'; }
  if (kind === 'seq') { m2 = [sc[start + 1], sc[start + 2], sc[(start + 3) % 5]]; txt = 'la même forme, décalée d’une note de la gamme'; }
  if (kind === 'inv') { m2 = [m[2], m[1], m[0]]; txt = 'les mêmes notes, contour inversé'; }
  if (kind === 'rhythm') { m2 = m; txt = 'les mêmes notes, autre rythme (la dernière allongée)'; }
  const base = 57 + ((T.pcOf(t) - 57) % 12 + 12) % 12;
  const mid = arr => { const out = []; let last = null; arr.forEach(n => { let x = base + ((n.pc - base) % 12 + 12) % 12; if (last != null) { while (x - last > 6) x -= 12; while (last - x > 6) x += 12; } out.push(x); last = x; }); return out; };
  const a = mid(m), b = mid(m2);
  const play = () => { const t0 = ac().currentTime + 0.05; a.forEach((x, i) => pluck(x, { when: t0 + i * 0.3, vel: 0.5, dur: 0.6 })); const t1 = t0 + 1.5; b.forEach((x, i) => pluck(x, { when: t1 + (kind === 'rhythm' ? [0, 0.15, 0.3][i] : i * 0.3), vel: 0.5, dur: i === 2 && kind === 'rhythm' ? 1.6 : 0.6 })); };
  const labels = { repeat: 'Répétition', seq: 'Séquence (transposition dans la gamme)', inv: 'Contour inversé', rhythm: 'Variation rythmique' };
  return { type: 'choice', autoplay: true, audio: play, prompt: `Un motif (${names(m)}), puis sa transformation. Laquelle ?`,
    options: Object.entries(labels).map(([v, l]) => ({ value: v, label: l })), answer: kind,
    explain: `C’était une <b>${labels[kind].toLowerCase()}</b> : ${txt}${kind !== 'repeat' && kind !== 'rhythm' ? ` (${names(m2)})` : ''}. Toutes ces transformations gardent l’identité du motif : c’est ce qui rend un solo cohérent.` };
};

/* ---------------- COMPOSITION ---------------- */
G.borrowed = () => {
  const t = pick(['C', 'G', 'D', 'A', 'E']);
  const H = T.harmonize(t, 'ionian');
  const borrowed = pick([['b7', 'maj', 'emprunté au mixolydien (ou au mineur) : le ♭VII du rock'], ['b6', 'maj', 'emprunté au mineur homonyme : couleur épique, sombre'], ['4', 'min', 'iv mineur, emprunté au mineur : mélancolie (« Creep » de Radiohead tourne autour de ce changement)'], ['b3', 'maj', 'emprunté au mineur : ♭III, très rock']]);
  const [iv, q, why] = borrowed;
  const bc = T.realizeProgression(t, [[iv, q, 1]])[0];
  const prog = shuffle([H[0], H[3], H[4], H[5]]).slice(0, 3);
  prog.splice(rnd(1, 3), 0, { symbol: bc.symbol });
  return { type: 'choice', prompt: `En ${N(t)} majeur, grille : ${prog.map(c => CF(c.symbol)).join(' → ')}. Quel accord n’est pas [[diatonique|dans la gamme]] ?`.replace(/\[\[[^|]+\|([^\]]+)\]\]/, '$1'),
    options: prog.map(c => ({ value: c.symbol, label: CF(c.symbol) })).filter((o, i, a) => a.findIndex(x => x.value === o.value) === i), answer: bc.symbol,
    explain: `${CF(bc.symbol)} (${bc.roman}) contient ${bc.notes.filter(n => !T.buildScale(t, 'ionian').some(m => m.pc === n.pc)).map(n => N(n.name)).join(', ')}, hors de ${N(t)} majeur. C’est un accord ${why}. Les emprunts sont l’outil n°1 pour colorer une grille simple.` };
};

G.contrast = () => {
  const t = pick(['A', 'E', 'D', 'B']), rel = T.spell(t, 'b3');
  return pick([
    () => ({ type: 'choice', prompt: `Couplet en ${N(t)} mineur (sombre, retenu). Pour un refrain qui « s’ouvre » sans changer de gamme, sur quel accord le centrer ?`,
      options: noteOpts(rel).map(o => ({ ...o, label: o.label + ' majeur' })), answer: rel,
      explain: `${N(rel)} majeur est le relatif majeur de ${N(t)} mineur : mêmes notes, mais centre lumineux. Couplet mineur → refrain sur le relatif majeur : le contraste le plus utilisé du rock (Nirvana l’utilise souvent avec des dynamiques calme/fort).` }),
    () => ({ type: 'choice', prompt: 'Quel moyen NE crée PAS de contraste entre couplet et refrain ?', options: shuffle([['a', 'Changer de dynamique (calme → saturé)'], ['b', 'Passer du centre mineur au relatif majeur'], ['c', 'Changer le rythme d’accompagnement'], ['d', 'Garder exactement la même grille, le même rythme et le même son']]).map(([v, l]) => ({ value: v, label: l })), answer: 'd',
      explain: 'Contraste = changer au moins une dimension : harmonie (centre, accords empruntés), rythme, dynamique, registre (mélodie plus aiguë au refrain), densité. Le modèle « couplet calme / refrain explosif » du grunge joue surtout sur la dynamique.' })
  ])();
};

G.melodyStrong = () => {
  const t = pick(['C', 'G', 'D', 'A']), H = T.harmonize(t, 'ionian'), c = pick([H[0], H[3], H[4], H[5]]);
  const sc = T.buildScale(t, 'ionian'), tones = c.notes.map(n => n.pc), others = sc.filter(n => !tones.includes(n.pc));
  const good = pick(c.notes), bad = pick(others);
  return { type: 'choice', prompt: `Mélodie sur ${CF(c.symbol)}. Quelle note est la plus stable sur le premier temps (temps fort) ?`, options: shuffle([good.name, bad.name, ...shuffle(others.filter(n => n !== bad)).slice(0, 2).map(n => n.name)]).map(v => ({ value: v, label: N(v) })), answer: good.name,
    explain: `${N(good.name)} appartient à ${CF(c.symbol)} (${names(c.notes)}). Règle de base des mélodies : notes de l’accord sur les temps forts, notes de passage entre les deux. Une note hors accord sur un temps fort crée une tension voulue (appoggiature) — à utiliser exprès.` };
};

G.riffScale = () => {
  const t = pick(['E', 'A', 'D']), id = pick(['minPenta', 'blues', 'phrygian', 'aeolian', 'dorian']);
  const sc = T.buildScale(t, id), shown = id === 'minPenta' || id === 'blues' ? sc : sc.filter(n => n.iv !== '4');
  return { type: 'choice', prompt: `Un riff utilise les notes ${names(shown)}, avec ${N(t)} comme note pivot. De quelle gamme vient-il ?`,
    options: opts(id, ['minPenta', 'blues', 'phrygian', 'aeolian', 'dorian'], v => N(t) + ' ' + T.SCALES[v].name.toLowerCase()), answer: id,
    explain: `${N(t)} ${T.SCALES[id].name.toLowerCase()} : ${names(sc)}. ${{ minPenta: 'Le réservoir de riffs n°1 (Nirvana, GNR).', blues: 'La ♭5 donne le grain blues/stoner.', phrygian: 'La ♭2 : le son metal (E–F).', aeolian: 'La ♭6 : riffs sombres et épiques.', dorian: 'La 6 majeure : riffs plus « funky » ou psychés.' }[id]}` };
};

G.progBuild = () => {
  const t = pick(['G', 'D', 'A', 'E', 'C']), H = T.harmonize(t, 'ionian');
  return pick([
    () => ({ type: 'choice', prompt: `Tu veux finir une grille en ${N(t)} majeur par une vraie résolution. Quel accord placer juste avant ${CF(H[0].symbol)} ?`, options: opts(H[4].symbol, [H[1].symbol, H[2].symbol, H[5].symbol], CF), answer: H[4].symbol,
      explain: `${CF(H[4].symbol)} (V) → ${CF(H[0].symbol)} (I) : cadence parfaite. Pour une fin plus douce, IV → I (${CF(H[3].symbol)} → ${CF(H[0].symbol)}). Pour une fin rock, ♭VII → I.` }),
    () => ({ type: 'choice', prompt: `Quelle grille en ${N(t)} majeur alterne vraiment tension et repos ?`, options: shuffle([['a', `${CF(H[0].symbol)} – ${CF(H[3].symbol)} – ${CF(H[4].symbol)} – ${CF(H[0].symbol)}`], ['b', `${CF(H[0].symbol)} – ${CF(H[2].symbol)} – ${CF(H[0].symbol)} – ${CF(H[2].symbol)}`], ['c', `${CF(H[5].symbol)} – ${CF(H[0].symbol)} – ${CF(H[5].symbol)} – ${CF(H[0].symbol)}`]]).map(([v, l]) => ({ value: v, label: l })), answer: 'a',
      explain: 'I (repos) → IV (départ) → V (tension) → I (retour) : les trois fonctions dans l’ordre. Les deux autres grilles restent dans la fonction tonique (I, iii, vi partagent des notes) : agréable, mais statique.' })
  ])();
};
