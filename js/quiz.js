/* ================================================================
   SHRED v2 — exercices vérifiés
   Chaque générateur fabrique des questions à partir du moteur théorique :
   jamais deux fois le même quiz, et la correction est calculée.
   Une notion n'est validée qu'avec ≥ 80 % de bonnes réponses.
   Types : 'choice' (une réponse), 'notes' (choisir les notes),
           'fret' (toucher la bonne case sur le manche).
   ================================================================ */
import * as T from './theory.js';
import { MODE_INFO } from './content/modes.js';
import { PROGRESSIONS } from './content/progressions.js';
import { el, N, IV, shuffle, pick, rich, toast } from './ui.js';
import { Fretboard, scaleMarks, labelFor } from './fretboard.js';
import { recordQuiz, recordGenStats } from './store.js';
import { pluck, playNotes, closeVoicing } from './audio.js';

const COMMON_TONICS = ['C', 'D', 'E', 'F', 'G', 'A', 'B♭', 'E♭', 'B', 'A♭', 'F♯', 'D♭'];
const EASY_TONICS = ['C', 'D', 'E', 'F', 'G', 'A', 'B♭'];
const names = arr => arr.map(n => N(n.name)).join(' – ');
const CF = s => String(s).replace(/^([A-G][♯♭𝄪𝄫]*)/, m => N(m));

/* Choix de 4 options dont la bonne, sans doublon */
function choices(correct, pool, n = 4, fmt = x => x) {
  const opts = [correct, ...shuffle(pool.filter(x => x !== correct))].slice(0, n);
  return shuffle(opts).map(v => ({ value: v, label: fmt(v) }));
}
const noteChoices = (correctName, n = 4) => {
  const cpc = T.pcOf(correctName);
  const pool = T.PC_NAMES.filter(x => T.pcOf(x) !== cpc);
  return shuffle([correctName, ...shuffle(pool).slice(0, n - 1)]).map(v => ({ value: v, label: N(v) }));
};

/* ---------------- générateurs ---------------- */
const G = {};

/* MODULE 1 */
G.intervals = () => pick([
  () => {
    const t = pick(EASY_TONICS), l = pick(['b2', '2', 'b3', '3', '4', '5', 'b6', '6', 'b7', '7']);
    const target = T.spell(t, l);
    return { type: 'choice', prompt: `Quel intervalle sépare ${N(t)} (en bas) de ${N(target)} (en haut) ?`,
      options: choices(l, ['b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'], 4, x => T.ivName(x)), answer: l,
      explain: `De ${N(t)} à ${N(target)} : ${T.parseInterval(l).semis} demi-tons = <b>${T.ivName(l)}</b> (${IV(l)}).`,
      audio: () => { const m = 48 + T.pcOf(t); playNotes([m, m + T.parseInterval(l).semis], { gap: 0.5 }); } };
  },
  () => {
    const t = pick(EASY_TONICS), l = pick(['3', 'b3', '5', '4', 'b7', '6', '2']);
    const target = T.spell(t, l);
    return { type: 'choice', prompt: `Quelle note est une <b>${T.ivName(l)}</b> au-dessus de ${N(t)} ?`,
      options: noteChoices(target), answer: target, sameP: true,
      explain: `${T.ivName(l)} = ${T.parseInterval(l).semis} demi-tons. ${N(t)} + ${T.parseInterval(l).semis} demi-tons = <b>${N(target)}</b>. (Et c’est bien la ${T.parseInterval(l).num}e lettre en partant de ${t[0]}.)` };
  },
  () => {
    const s = pick([0, 1, 2, 3]), f = pick([3, 5, 7, 8]), l = pick(['3', 'b3', '5', 'b7', '4']);
    const rootPc = T.pcAt(s, f), targetPc = (rootPc + T.parseInterval(l).semis) % 12;
    const ok = [];
    for (let ss = 0; ss < 6; ss++) for (let ff = Math.max(0, f - 4); ff <= f + 5; ff++) if (T.pcAt(ss, ff) === targetPc) ok.push(ss + ':' + ff);
    return { type: 'fret', prompt: `La note bleue est une fondamentale. Touche sa <b>${T.ivName(l)}</b> (${IV(l)}) quelque part près d’elle.`,
      given: [{ s, f, label: '1', role: 'root' }], answer: ok,
      explain: `La ${T.ivName(l)} est à ${T.parseInterval(l).semis} demi-tons. Retiens la forme : elle est la même partout sur le manche (sauf quand on passe la corde de Si, qui décale d’une case).`,
      reveal: ok.map(k => { const [a, b] = k.split(':').map(Number); return { s: a, f: b, label: IV(l), role: T.ivRole(l) }; }) };
  }
])();

G.majorScale = () => pick([
  () => {
    const t = pick(COMMON_TONICS), sc = T.buildScale(t, 'ionian');
    return { type: 'notes', prompt: `Sélectionne les 7 notes de la gamme de <b>${N(t)} majeur</b>.`, answer: sc.map(n => n.pc),
      explain: `${N(t)} majeur = ${names(sc)}. Formule T T ½T T T T ½T, une lettre par degré.` };
  },
  () => {
    const t = pick(COMMON_TONICS), d = pick([2, 3, 4, 5, 6, 7]), sc = T.buildScale(t, 'ionian');
    return { type: 'choice', prompt: `Quel est le <b>${d}e degré</b> de ${N(t)} majeur ?`, options: noteChoices(sc[d - 1].name), answer: sc[d - 1].name, sameP: true,
      explain: `${N(t)} majeur : ${names(sc)}. Le ${d}e degré est <b>${N(sc[d - 1].name)}</b>.` };
  },
  () => {
    const pos = pick([1, 2, 3, 4, 5, 6, 7]);
    const pat = T.stepPattern('ionian');
    return { type: 'choice', prompt: `Dans la gamme majeure, quel écart y a-t-il entre le degré ${pos} et le degré ${pos === 7 ? 1 : pos + 1} ?`,
      options: [{ value: 'T', label: '1 ton (2 cases)' }, { value: '½T', label: '½ ton (1 case)' }, { value: '1½T', label: '1 ton ½ (3 cases)' }], answer: pat[pos - 1],
      explain: `La formule est T T ½T T T T ½T : les demi-tons sont entre 3-4 et 7-1. Le reste, ce sont des tons.` };
  }
])();

G.fretNotes = () => pick([
  () => {
    const s = pick([0, 1, 2, 3, 4, 5]), name = pick(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'F♯', 'B♭', 'E♭', 'C♯', 'A♭']);
    const pc = T.pcOf(name), ok = [];
    for (let f = 0; f <= 15; f++) if (T.pcAt(s, f) === pc) ok.push(s + ':' + f);
    return { type: 'fret', prompt: `Touche un <b>${N(name)}</b> sur la corde de <b>${T.STRING_NAMES[s]}</b>.`, answer: ok, onlyString: s,
      explain: `Sur cette corde, ${N(name)} est case ${ok.map(k => k.split(':')[1]).join(' et ')}. Repère : la case 12 redonne la note à vide.`,
      reveal: ok.map(k => { const f = +k.split(':')[1]; return { s, f, label: N(name), role: 'root' }; }) };
  },
  () => {
    const s = pick([0, 1, 2, 3, 4, 5]), f = pick([1, 2, 3, 5, 7, 8, 9, 10, 12]);
    const pc = T.pcAt(s, f), name = T.PC_NAMES[pc];
    return { type: 'choice', prompt: `Quelle note se trouve corde <b>${T.STRING_NAMES[s]}</b>, case <b>${f}</b> ?`, given: [{ s, f, label: '?', role: 'root' }],
      options: noteChoices(name), answer: name, sameP: true,
      explain: `${T.STRING_NAMES[s]} à vide = ${N(T.PC_NAMES[T.TUNING[s] % 12])}, + ${f} demi-tons = <b>${N(name)}</b>.` };
  }
])();

G.keys = () => pick([
  () => {
    const t = pick(['G', 'D', 'A', 'E', 'B', 'F', 'B♭', 'E♭', 'A♭', 'F♯']);
    const sc = T.buildScale(t, 'ionian'), sh = sc.filter(n => n.name.includes('♯')), fl = sc.filter(n => n.name.includes('♭'));
    const n = sh.length || fl.length, kind = sh.length ? 'dièse' : 'bémol';
    const opts = shuffle([...new Set([n, 1, 2, 3, 4, 5, 6].filter(x => x !== n))].slice(0, 3).concat(n)).map(v => ({ value: v, label: v + ' ' + kind + (v > 1 ? 's' : '') }));
    return { type: 'choice', prompt: `Combien d’altérations dans la tonalité de <b>${N(t)} majeur</b> ?`, options: opts, answer: n,
      explain: `${N(t)} majeur = ${names(sc)} → ${n} ${kind}${n > 1 ? 's' : ''} (${(sh.length ? sh : fl).map(x => N(x.name)).join(', ')}).` };
  },
  () => {
    const t = pick(['C', 'G', 'D', 'A', 'E', 'F', 'B♭', 'E♭']), rel = T.spell(t, '6');
    return { type: 'choice', prompt: `Quel est le <b>relatif mineur</b> de ${N(t)} majeur ?`, options: noteChoices(rel).map(o => ({ ...o, label: o.label + ' mineur' })), answer: rel, sameP: true,
      explain: `Le relatif mineur commence sur le 6e degré : ${N(rel)} mineur a exactement les mêmes notes que ${N(t)} majeur. Astuce manche : 3 cases en dessous.` };
  },
  () => {
    const m = pick(['A', 'E', 'B', 'D', 'G', 'C', 'F♯']), rel = T.spell(m, 'b3');
    return { type: 'choice', prompt: `Quel est le <b>relatif majeur</b> de ${N(m)} mineur ?`, options: noteChoices(rel).map(o => ({ ...o, label: o.label + ' majeur' })), answer: rel, sameP: true,
      explain: `Le relatif majeur est une tierce mineure au-dessus : ${N(m)} mineur ↔ ${N(rel)} majeur.` };
  }
])();

G.degrees = () => pick([
  () => {
    const t = pick(EASY_TONICS), sc = T.buildScale(t, 'ionian'), d = pick([2, 3, 4, 5, 6, 7]);
    return { type: 'choice', prompt: `Dans ${N(t)} majeur, quel degré est la note <b>${N(sc[d - 1].name)}</b> ?`,
      options: choices(d, [1, 2, 3, 4, 5, 6, 7], 4, x => x + 'e degré'), answer: d,
      explain: `${names(sc)} : ${N(sc[d - 1].name)} est le ${d}e.` };
  },
  () => {
    const t = pick(EASY_TONICS), H = T.harmonize(t, 'ionian'), c = pick(H.slice(1));
    return { type: 'choice', prompt: `Dans ${N(t)} majeur, quel accord porte le chiffre <b>${c.roman}</b> ?`,
      options: choices(c.symbol, H.map(h => h.symbol), 4, CF), answer: c.symbol,
      explain: `On construit un accord sur chaque degré : ${H.map(h => h.roman + ' = ' + h.symbol).join(', ')}.` };
  }
])();

G.pentas = () => pick([
  () => {
    const t = pick(EASY_TONICS.concat(['E♭', 'F♯'])), id = pick(['minPenta', 'majPenta']), sc = T.buildScale(t, id);
    return { type: 'notes', prompt: `Sélectionne les 5 notes de <b>${N(t)} ${T.SCALES[id].name.toLowerCase()}</b>.`, answer: sc.map(n => n.pc),
      explain: `${N(t)} ${T.SCALES[id].name.toLowerCase()} = ${names(sc)} (${sc.map(n => IV(n.iv)).join(' ')}).` };
  },
  () => {
    const t = pick(['C', 'G', 'D', 'F', 'A']), rel = T.spell(t, '6');
    return { type: 'choice', prompt: `La penta majeure de ${N(t)} contient les mêmes notes que la penta mineure de…`, options: noteChoices(rel), answer: rel, sameP: true,
      explain: `Comme pour les gammes : relatif mineur = 6e degré. ${N(t)} penta majeure = ${N(rel)} penta mineure (même forme, autre tonique).` };
  },
  () => ({ type: 'choice', prompt: 'Quelles deux notes faut-il ajouter à la penta mineure pour obtenir la gamme mineure naturelle (éolien) ?',
    options: [{ value: 'a', label: 'La 2 et la ♭6' }, { value: 'b', label: 'La 2 et la 6' }, { value: 'c', label: 'La ♭2 et la ♭6' }, { value: 'd', label: 'La ♭5 et la 7' }], answer: 'a',
    explain: 'Penta mineure 1 ♭3 4 5 ♭7 + 2 et ♭6 = éolien. (Avec la 6 majeure à la place, c’est le dorien.)' }),
  () => ({ type: 'choice', prompt: 'Quelle note la gamme blues ajoute-t-elle à la penta mineure ?',
    options: [{ value: 'b5', label: 'La ♭5 (blue note)' }, { value: '2', label: 'La 2' }, { value: '6', label: 'La 6' }, { value: '7', label: 'La 7' }], answer: 'b5',
    explain: 'Blues = 1 ♭3 4 ♭5 5 ♭7. La ♭5 est une note de passage, à faire glisser vers la 4 ou la 5.' })
])();

/* MODULE 2 */
G.triads = () => pick([
  () => {
    const r = pick(COMMON_TONICS), q = pick(['maj', 'min', 'dim']), ch = T.buildChord(r, q);
    return { type: 'notes', prompt: `Sélectionne les notes de <b>${N(r)}${T.CHORD_TYPES[q].sym}</b> (${T.CHORD_TYPES[q].name.toLowerCase()}).`, answer: ch.map(n => n.pc),
      explain: `${N(r)}${T.CHORD_TYPES[q].sym} = ${names(ch)} (${ch.map(n => IV(n.iv)).join(' ')}).`, audio: () => playNotes(closeVoicing(ch.map(n => n.pc), 52)) };
  },
  () => {
    const r = pick(COMMON_TONICS), q = pick(['maj', 'min', 'dim', 'aug']), ch = T.buildChord(r, q);
    return { type: 'choice', prompt: `Quelle triade forment les notes <b>${names(ch)}</b> ?`,
      options: ['maj', 'min', 'dim', 'aug'].map(v => ({ value: v, label: N(r) + T.CHORD_TYPES[v].sym + ' (' + T.CHORD_TYPES[v].name.toLowerCase() + ')' })), answer: q,
      explain: `De ${N(r)} : ${ch.slice(1).map(n => IV(n.iv) + ' (' + T.ivName(n.iv) + ')').join(', ')} → ${T.CHORD_TYPES[q].name.toLowerCase()}.`, audio: () => playNotes(closeVoicing(ch.map(n => n.pc), 52)) };
  }
])();

G.qualities = () => pick([
  () => {
    const q = pick(['maj', 'min', 'dim', 'aug']);
    const txt = { maj: 'tierce majeure + quinte juste', min: 'tierce mineure + quinte juste', dim: 'tierce mineure + quinte diminuée', aug: 'tierce majeure + quinte augmentée' };
    return { type: 'choice', prompt: `Quelle est la construction d’un accord <b>${T.CHORD_TYPES[q].name.toLowerCase()}</b> ?`,
      options: shuffle(Object.keys(txt)).map(k => ({ value: k, label: txt[k] })), answer: q,
      explain: 'Majeur 1-3-5, mineur 1-♭3-5, diminué 1-♭3-♭5, augmenté 1-3-♯5. La tierce donne majeur/mineur, la quinte stabilise ou déstabilise.' };
  },
  () => {
    const r = pick(EASY_TONICS), q = pick(['maj', 'min']), other = q === 'maj' ? 'min' : 'maj';
    const a = T.buildChord(r, q), b = T.buildChord(r, other);
    return { type: 'choice', prompt: `Pour passer de ${N(r)}${T.CHORD_TYPES[q].sym} à ${N(r)}${T.CHORD_TYPES[other].sym}, quelle note change ?`,
      options: noteChoices(a[1].name), answer: a[1].name, sameP: true,
      explain: `Seule la tierce bouge : ${N(a[1].name)} → ${N(b[1].name)}. Fondamentale et quinte restent.` };
  }
])();

G.sevenths = () => pick([
  () => {
    const r = pick(COMMON_TONICS), q = pick(['maj7', 'm7', 'dom7', 'm7b5']), ch = T.buildChord(r, q);
    return { type: 'notes', prompt: `Sélectionne les 4 notes de <b>${N(r)}${T.CHORD_TYPES[q].sym}</b>.`, answer: ch.map(n => n.pc),
      explain: `${N(r)}${T.CHORD_TYPES[q].sym} = ${names(ch)} (${ch.map(n => IV(n.iv)).join(' ')}).`, audio: () => playNotes(closeVoicing(ch.map(n => n.pc), 48)) };
  },
  () => {
    const r = pick(EASY_TONICS), q = pick(['maj7', 'm7', 'dom7', 'm7b5']), ch = T.buildChord(r, q);
    return { type: 'choice', prompt: `Quel accord forment <b>${names(ch)}</b> ?`,
      options: ['maj7', 'm7', 'dom7', 'm7b5'].map(v => ({ value: v, label: N(r) + T.CHORD_TYPES[v].sym })), answer: q,
      explain: `Triade ${['maj7', 'dom7'].includes(q) ? 'majeure' : q === 'm7' ? 'mineure' : 'diminuée'} + ${IV(ch[3].iv)} (${T.ivName(ch[3].iv)}) → ${T.CHORD_TYPES[q].name}.` };
  }
])();

G.harmonization = () => pick([
  () => {
    const t = pick(COMMON_TONICS), H = T.harmonize(t, 'ionian', pick([false, true])), c = pick(H);
    return { type: 'choice', prompt: `Dans ${N(t)} majeur, quel accord est construit sur le <b>${c.degree}e degré</b> ?`,
      options: choices(c.symbol, H.map(h => h.symbol), 4, CF), answer: c.symbol,
      explain: `On empile des tierces avec les seules notes de la gamme : ${c.notes.map(n => N(n.name)).join(' – ')} → <b>${c.symbol}</b> (${c.roman}).` };
  },
  () => {
    const d = pick([1, 2, 3, 4, 5, 6, 7]);
    const q = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'][d - 1];
    return { type: 'choice', prompt: `Dans n’importe quelle gamme majeure, quelle est la qualité de l’accord du <b>${d}e degré</b> ?`,
      options: [{ value: 'maj', label: 'Majeur' }, { value: 'min', label: 'Mineur' }, { value: 'dim', label: 'Diminué' }], answer: q,
      explain: 'Le schéma est toujours le même : I majeur, ii mineur, iii mineur, IV majeur, V majeur, vi mineur, vii° diminué.' };
  },
  () => {
    const t = pick(EASY_TONICS), H = T.harmonize(t, 'ionian', true);
    return { type: 'choice', prompt: `Dans ${N(t)} majeur, quel est le seul accord de <b>septième de dominante</b> (X7) ?`, options: choices(H[4].symbol, H.map(h => h.symbol), 4, CF), answer: H[4].symbol,
      explain: `C’est l’accord du Ve degré : ${H[4].symbol}. Sa 3 et sa ♭7 forment un triton qui « veut » se résoudre sur ${H[0].symbol}.` };
  }
])();

G.functions = () => pick([
  () => {
    const d = pick([1, 2, 3, 4, 5, 6, 7]), f = T.harmonicFunction('ionian', d);
    const H = T.harmonize('C', 'ionian');
    return { type: 'choice', prompt: `En majeur, quelle est la fonction de l’accord <b>${H[d - 1].roman}</b> ?`,
      options: Object.entries(T.FUNCTION_NAMES).map(([v, l]) => ({ value: v, label: l })), answer: f,
      explain: 'Tonique : I, iii, vi (ils partagent des notes avec I). Sous-dominante : ii, IV. Dominante : V, vii° (ils contiennent la sensible et le triton).' };
  },
  () => {
    const t = pick(EASY_TONICS), H = T.harmonize(t, 'ionian');
    return { type: 'choice', prompt: `En ${N(t)} majeur, quel accord crée le plus de tension avant de revenir sur ${H[0].symbol} ?`, options: choices(H[4].symbol, [H[1].symbol, H[3].symbol, H[5].symbol, H[2].symbol], 4, CF), answer: H[4].symbol,
      explain: `Le V (${H[4].symbol}) contient la 7e degré de la gamme (sensible, à un demi-ton de la tonique) : il appelle le retour sur I.` };
  }
])();

G.inversions = () => pick([
  () => {
    const r = pick(EASY_TONICS), q = pick(['maj', 'min']), inv = T.inversions(r, q), k = pick([0, 1, 2]);
    const sym = N(r) + T.CHORD_TYPES[q].sym + (k ? '/' + N(inv[k].bass.name) : '');
    return { type: 'choice', prompt: `L’accord <b>${sym}</b> est en…`, options: inv.map((x, i) => ({ value: i, label: x.name })), answer: k,
      explain: `${N(r)}${T.CHORD_TYPES[q].sym} = ${names(T.buildChord(r, q))}. Basse = fondamentale → état fondamental ; basse = tierce → 1er renversement ; basse = quinte → 2e renversement.` };
  },
  () => {
    const r = pick(EASY_TONICS), q = pick(['maj', 'min', 'dom7']), inv = T.inversions(r, q), k = pick(q === 'dom7' ? [1, 2, 3] : [1, 2]);
    return { type: 'choice', prompt: `Quelle note est à la basse du <b>${inv[k].name}</b> de ${N(r)}${T.CHORD_TYPES[q].sym} ?`, options: noteChoices(inv[k].bass.name), answer: inv[k].bass.name, sameP: true,
      explain: `Ordre des notes : ${inv[k].order.map(n => N(n.name)).join(' – ')}. La basse est ${N(inv[k].bass.name)} (${IV(inv[k].bass.iv)}).` };
  }
])();

G.voiceLeading = () => pick([
  () => {
    const t = pick(EASY_TONICS), H = T.harmonize(t, 'ionian');
    const pairs = [[0, 3], [0, 5], [1, 4], [4, 0], [5, 3], [1, 3], [2, 0]];
    const [a, b] = pick(pairs), A = H[a], B = H[b];
    const common = A.notes.filter(n => B.notes.some(m => m.pc === n.pc));
    const ans = common.map(n => n.pc);
    return { type: 'notes', prompt: `Quelles notes ${A.symbol} et ${B.symbol} ont-ils <b>en commun</b> ?`, answer: ans,
      explain: `${A.symbol} = ${names(A.notes)} ; ${B.symbol} = ${names(B.notes)}. Notes communes : ${names(common)}. En voice leading, on les garde (même doigt, même case) et on bouge seulement le reste.` };
  },
  () => {
    const t = pick(EASY_TONICS), H = T.harmonize(t, 'ionian', true), V = H[4], I = H[0];
    const third = V.notes[1], target = I.notes[0];
    return { type: 'choice', prompt: `Dans ${V.symbol} → ${I.symbol}, vers quelle note la tierce de ${V.symbol} (${N(third.name)}) se résout-elle le plus naturellement ?`,
      options: noteChoices(target.name), answer: target.name, sameP: true,
      explain: `${N(third.name)} est la sensible : elle monte d’un demi-ton vers ${N(target.name)}, la tonique. Et la ♭7 de ${V.symbol} (${N(V.notes[3].name)}) descend d’un demi-ton vers la tierce de ${I.symbol} (${N(I.notes[1].name)}).` };
  }
])();

/* MODULE 3 — modes */
function modeGen(id) {
  const info = MODE_INFO[id];
  return () => pick([
    () => {
      const t = pick(COMMON_TONICS.slice(0, 8)), sc = T.buildScale(t, id);
      return { type: 'notes', prompt: `Sélectionne les notes de <b>${N(t)} ${info.name.toLowerCase()}</b>.`, answer: sc.map(n => n.pc),
        explain: `${N(t)} ${info.name.toLowerCase()} = ${names(sc)}. C’est le ${info.degree}e mode de ${N(T.parentMajor(t, id))} majeur.` };
    },
    () => {
      const t = pick(COMMON_TONICS.slice(0, 8)), c = info.char[0], target = T.spell(t, c);
      return { type: 'choice', prompt: `Quelle est la <b>note caractéristique</b> de ${N(t)} ${info.name.toLowerCase()} ?`, options: noteChoices(target), answer: target, sameP: true,
        explain: `La couleur ${info.name.toLowerCase()} vient de la ${IV(c)} : ${N(target)}. ${info.why.split('.')[0]}.` };
    },
    () => {
      const t = pick(COMMON_TONICS.slice(0, 8)), p = T.parentMajor(t, id);
      return { type: 'choice', prompt: `${N(t)} ${info.name.toLowerCase()} utilise les mêmes notes que quelle gamme majeure ?`, options: noteChoices(p).map(o => ({ ...o, label: o.label + ' majeur' })), answer: p, sameP: true,
        explain: `${info.name} = ${info.degree}e mode. ${N(t)} est le ${info.degree}e degré de ${N(p)} majeur.` };
    },
    () => ({ type: 'choice', prompt: `Quel accord est associé au mode <b>${info.name.toLowerCase()}</b> ?`,
      options: shuffle(['maj7', 'm7', 'dom7', 'm7b5']).map(v => ({ value: v, label: 'X' + T.CHORD_TYPES[v].sym })), answer: info.chord === 'maj7' ? 'maj7' : info.chord,
      explain: `On harmonise le ${info.degree}e degré de la gamme majeure : ${info.chordTxt}.` }),
    () => {
      const t = pick(['A', 'E', 'D', 'G', 'C']), info2 = MODE_INFO[info.vs];
      const cmp = T.compareScales(t, id, info.vs);
      const ans = cmp.onlyA[0]?.name;
      if (!ans) return G.modeCompare();
      return { type: 'choice', prompt: `Quelle note de ${N(t)} ${info.name.toLowerCase()} n’est PAS dans ${N(t)} ${info2.name.toLowerCase()} ?`, options: noteChoices(ans), answer: ans, sameP: true,
        explain: `${N(t)} ${info.name.toLowerCase()} : ${names(cmp.A)}. ${N(t)} ${info2.name.toLowerCase()} : ${names(cmp.B)}. Différence : ${cmp.onlyA.map(n => N(n.name) + ' (' + IV(n.iv) + ')').join(', ')} au lieu de ${cmp.onlyB.map(n => N(n.name) + ' (' + IV(n.iv) + ')').join(', ')}.` };
    },
    () => {
      const t = pick(['A', 'E', 'D', 'G']), sc = T.buildScale(t, id), c = info.char[0], target = sc.find(n => n.iv === c);
      const zones = T.scaleZones(sc), z = zones[0];
      const ok = [];
      for (let s = 0; s < 6; s++) for (let f = Math.max(0, z.from - 1); f <= z.to + 1; f++) if (T.pcAt(s, f) === target.pc) ok.push(s + ':' + f);
      return { type: 'fret', prompt: `Voici ${N(t)} ${info.name.toLowerCase()} (zone en surbrillance). Touche une de ses <b>notes caractéristiques</b> (${IV(c)}) dans cette zone.`,
        given: scaleMarks(sc, { labels: 'iv', zone: z }).filter(m => m.iv !== c).map(m => ({ ...m, cls: m.cls + ' soft' })), zone: z, answer: ok,
        explain: `La ${IV(c)} de ${N(t)} est ${N(target.name)}. C’est elle qu’on fait entendre, posée sur l’accord ${N(t)}${T.CHORD_TYPES[info.chord].sym}.`,
        reveal: ok.map(k => { const [s, f] = k.split(':').map(Number); return { s, f, label: IV(c), role: 'emphx' }; }) };
    }
  ])();
}
for (const id of T.MODE_IDS) G['mode_' + id] = modeGen(id);

G.modeCompare = () => {
  const t = pick(['A', 'D', 'E', 'G', 'C']), [a, b] = pick([['dorian', 'aeolian'], ['ionian', 'lydian'], ['ionian', 'mixolydian'], ['phrygian', 'aeolian'], ['dorian', 'mixolydian']]);
  const cmp = T.compareScales(t, a, b);
  return { type: 'notes', prompt: `Sélectionne la ou les notes de ${N(t)} ${MODE_INFO[a].name.toLowerCase()} qui <b>n’existent pas</b> dans ${N(t)} ${MODE_INFO[b].name.toLowerCase()}.`,
    answer: cmp.onlyA.map(n => n.pc), explain: `${MODE_INFO[a].name} : ${names(cmp.A)}. ${MODE_INFO[b].name} : ${names(cmp.B)}. Ce qui change : ${names(cmp.onlyA)}.` };
};
G.modesAll = () => pick(T.MODE_IDS.map(id => G['mode_' + id]).concat([G.modeCompare]))();

/* MODULE 4 — cibles */
G.targets = () => {
  const prog = pick(PROGRESSIONS.filter(p => p.chords.some(c => c[1] !== 'power')));
  const chords = T.realizeProgression(prog.key, prog.chords).filter(c => c.typeId !== 'power');
  const c = pick(chords);
  return pick([
    () => ({ type: 'choice', prompt: `Grille « ${prog.name} » en ${N(prog.key)}. Sur l’accord <b>${CF(c.symbol)}</b>, quelle est la meilleure note cible (sa tierce) ?`,
      options: noteChoices(c.notes[1].name), answer: c.notes[1].name, sameP: true,
      explain: `${CF(c.symbol)} = ${names(c.notes)}. Sa tierce ${N(c.notes[1].name)} (${IV(c.notes[1].iv)}) dit à l’oreille « majeur » ou « mineur » : c’est la cible la plus parlante.` }),
    () => ({ type: 'notes', prompt: `Sélectionne toutes les notes de l’accord <b>${CF(c.symbol)}</b> : ce sont tes atterrissages sûrs pendant qu’il sonne.`,
      answer: c.notes.map(n => n.pc), explain: `${CF(c.symbol)} = ${names(c.notes)} (${c.notes.map(n => IV(n.iv)).join(' ')}).` })
  ])();
};

/* Mélanges pour l'évaluation */
export const GENERATORS = G;
export function makeQuestions(genIds, n = 10) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const gid = genIds[i % genIds.length];
    const q = G[gid](); q.gen = gid; out.push(q);
  }
  return shuffle(out);
}

/* ================================================================
   Lecteur de quiz (interface)
   ================================================================ */
export function runQuiz(container, { gens, n = 10, notionId = null, kind = 'quiz', title = '', onDone, questions }) {
  const qs = questions || makeQuestions(gens, n);
  let i = 0, score = 0;
  const results = [];
  const wrap = el('div', 'quiz');
  container.append(wrap);
  next();

  function next() {
    wrap.innerHTML = '';
    if (i >= qs.length) return finish();
    const q = qs[i];
    const head = el('div', 'quiz-head', el('span', 'q-count', `Question ${i + 1} / ${qs.length}`), el('span', 'q-score', `${score} bonne${score > 1 ? 's' : ''}`));
    const bar = el('div', 'progress', el('i', { style: { width: (100 * i / qs.length) + '%' } }));
    wrap.append(head, bar, el('p', { class: 'q-prompt', html: q.prompt }));
    if (q.audio) {
      wrap.append(el('div', 'row', el('button', { class: 'btn ghost sm', onclick: () => { try { q.audio(); } catch (e) { console.error(e); } } }, '🔊 ' + (q.autoplay ? 'Réécouter' : 'Écouter')),
        q.audio2 ? el('button', { class: 'btn ghost sm', onclick: () => q.audio2() }, '🔊 ' + (q.audio2Label || 'Référence')) : null));
      if (q.autoplay) setTimeout(() => { try { q.audio(); } catch (e) { console.error(e); } }, 250);
    }
    const fb = el('div', 'q-feedback');
    let answered = false;
    const done = (ok, given) => {
      if (answered) return; answered = true;
      if (ok) score++;
      results.push({ gen: q.gen, notion: q.notion, ok });
      fb.className = 'q-feedback ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = `<b>${ok ? '✓ Juste.' : '✗ Pas tout à fait.'}</b> ${q.explain || ''}`;
      const nb = el('button', { class: 'btn', onclick: () => { i++; next(); } }, i + 1 < qs.length ? 'Question suivante →' : 'Voir le résultat');
      fb.append(nb);
      setTimeout(() => nb.focus(), 30);
    };

    if (q.type === 'choice') {
      if (q.given) { const F = new Fretboard({ frets: 15, compact: true }); F.setMarks(q.given); wrap.append(F.root); }
      const grid = el('div', 'q-opts');
      q.options.forEach(o => {
        const b = el('button', { class: 'opt', onclick: () => {
          if (answered) return;
          const ok = q.sameP ? T.pcOf(String(o.value)) === T.pcOf(String(q.answer)) && String(o.value) === String(q.answer) : String(o.value) === String(q.answer);
          grid.querySelectorAll('.opt').forEach(x => { if (String(x.dataset.v) === String(q.answer)) x.classList.add('right'); });
          if (!ok) b.classList.add('wrong');
          done(ok);
        } }, o.label);
        b.dataset.v = o.value;
        grid.append(b);
      });
      wrap.append(grid);
    } else if (q.type === 'notes') {
      const sel = new Set();
      const grid = el('div', 'q-notes');
      T.PC_NAMES.forEach((nm, pc) => {
        const b = el('button', { class: 'note-btn', onclick: () => { if (answered) return; sel.has(pc) ? sel.delete(pc) : sel.add(pc); b.classList.toggle('on'); try { pluck(60 + pc, { vel: 0.35 }); } catch (e) {} } },
          pc === 1 ? N('C♯') + '/' + N('D♭') : pc === 3 ? N('D♯') + '/' + N('E♭') : pc === 6 ? N('F♯') + '/' + N('G♭') : pc === 8 ? N('G♯') + '/' + N('A♭') : pc === 10 ? N('A♯') + '/' + N('B♭') : N(nm));
        b.dataset.pc = pc; grid.append(b);
      });
      const val = el('button', { class: 'btn', onclick: () => {
        if (answered) return;
        const want = new Set(q.answer);
        const ok = want.size === sel.size && [...want].every(p => sel.has(p));
        grid.querySelectorAll('.note-btn').forEach(b => { const pc = +b.dataset.pc; if (want.has(pc)) b.classList.add(sel.has(pc) ? 'right' : 'missed'); else if (sel.has(pc)) b.classList.add('wrong'); });
        val.remove(); done(ok);
      } }, 'Valider');
      wrap.append(grid, el('p', 'hint', 'Les touches noires ont deux noms (enharmonie) : choisis le son, la correction te donne le bon nom.'), val);
    } else if (q.type === 'sequence') {
      // reproduire une suite de notes dans l'ordre (oreille)
      const picked = [];
      const shown = el('div', 'notes-row');
      const grid = el('div', 'q-notes');
      const nameOf = pc => N((q.names && q.choices && q.names[q.choices.indexOf(pc)]) || T.PC_NAMES[pc]);
      const drawPicked = () => { shown.innerHTML = ''; picked.forEach(pc => shown.append(el('span', 'nchip', el('b', null, nameOf(pc))))); for (let k = picked.length; k < q.answer.length; k++) shown.append(el('span', 'nchip', el('b', null, '?'))); };
      (q.choices || T.PC_NAMES.map((_, i) => i)).forEach(pc => grid.append(el('button', { class: 'note-btn', onclick: () => { if (answered || picked.length >= q.answer.length) return; picked.push(pc); try { pluck((q.base || 60) + ((pc - (q.base || 60)) % 12 + 12) % 12, { vel: 0.4 }); } catch (e) {} drawPicked(); } }, nameOf(pc))));
      const undo = el('button', { class: 'btn ghost sm', onclick: () => { if (!answered) { picked.pop(); drawPicked(); } } }, '↶ Effacer la dernière');
      const val = el('button', { class: 'btn', onclick: () => {
        if (answered) return;
        if (picked.length < q.answer.length) return toast(`Il faut ${q.answer.length} notes.`);
        const ok = picked.every((pc, k) => pc === q.answer[k]);
        val.remove(); done(ok);
      } }, 'Valider');
      drawPicked();
      wrap.append(shown, grid, el('div', 'row', undo), val);
    } else if (q.type === 'fret') {
      const F = new Fretboard({ frets: 15, compact: false, onTap: (s, f) => {
        if (answered) return;
        if (q.onlyString != null && s !== q.onlyString) { fb.className = 'q-feedback'; fb.textContent = 'Reste sur la corde demandée.'; return; }
        const ok = q.answer.includes(s + ':' + f);
        F.addMark({ s, f, label: ok ? '✓' : '✗', role: ok ? 'ok' : 'bad' });
        if (q.reveal) setTimeout(() => F.setMarks([...(q.given || []), ...q.reveal, { s, f, label: ok ? '✓' : '✗', role: ok ? 'ok' : 'bad' }]), ok ? 250 : 600);
        done(ok);
      } });
      F.setMarks(q.given || []);
      if (q.zone) F.setZone(q.zone);
      wrap.append(F.root);
    }
    wrap.append(fb);
  }

  function finish() {
    const passed = recordQuiz(notionId, kind, score, qs.length);
    recordGenStats(results);
    const pct = Math.round(100 * score / qs.length);
    const box = el('div', 'quiz-end');
    box.append(el('div', 'big-score ' + (pct >= 80 ? 'ok' : pct >= 50 ? 'mid' : 'bad'), pct + ' %'),
      el('p', null, `${score} / ${qs.length} bonnes réponses.`));
    if (notionId) box.append(el('p', { class: 'lead', html: passed ? '<b>Notion validée.</b> Elle compte maintenant dans tes progrès — et elle reviendra dans les évaluations pour vérifier qu’elle tient.' : 'Il faut 80 % pour valider la notion. Relis la partie « en profondeur », puis réessaie : les questions changent à chaque fois.' }));
    const again = el('button', { class: 'btn ghost', onclick: () => { container.innerHTML = ''; runQuiz(container, { gens, n, notionId, kind, title, onDone }); } }, '↻ Nouveau quiz');
    box.append(again);
    wrap.append(box);
    onDone && onDone({ score, total: qs.length, passed, results });
  }
}
