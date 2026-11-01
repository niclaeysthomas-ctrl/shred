// Vérification des calculs musicaux : node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../js/theory.js';

const names = arr => arr.map(n => n.name).join(' ');

test('orthographe des gammes majeures', () => {
  assert.equal(names(T.buildScale('C', 'ionian')), 'C D E F G A B');
  assert.equal(names(T.buildScale('F', 'ionian')), 'F G A B♭ C D E');
  assert.equal(names(T.buildScale('E♭', 'ionian')), 'E♭ F G A♭ B♭ C D');
  assert.equal(names(T.buildScale('F♯', 'ionian')), 'F♯ G♯ A♯ B C♯ D♯ E♯');
  assert.equal(names(T.buildScale('D♭', 'ionian')), 'D♭ E♭ F G♭ A♭ B♭ C');
});

test('modes — exemples du cahier des charges', () => {
  assert.equal(names(T.buildScale('A', 'dorian')), 'A B C D E F♯ G');
  assert.equal(names(T.buildScale('D', 'dorian')), 'D E F G A B C');
  assert.equal(names(T.buildScale('A', 'aeolian')), 'A B C D E F G');
  assert.equal(names(T.buildScale('E', 'phrygian')), 'E F G A B C D');
  assert.equal(names(T.buildScale('F', 'lydian')), 'F G A B C D E');
  assert.equal(names(T.buildScale('G', 'mixolydian')), 'G A B C D E F');
  assert.equal(names(T.buildScale('B', 'locrian')), 'B C D E F G A');
});

test('chaque mode a la même collection de notes que sa gamme parente', () => {
  for (const tonic of T.TONICS) for (const id of T.MODE_IDS) {
    const parent = T.parentMajor(tonic, id);
    const a = new Set(T.buildScale(tonic, id).map(n => n.pc));
    const b = new Set(T.buildScale(parent, 'ionian').map(n => n.pc));
    assert.deepEqual([...a].sort(), [...b].sort(), `${tonic} ${id} / parente ${parent}`);
  }
  assert.equal(T.parentMajor('A', 'dorian'), 'G');
  assert.equal(T.parentMajor('E', 'phrygian'), 'C');
  assert.equal(T.parentMajor('D', 'mixolydian'), 'G');
  assert.equal(T.parentMajor('F♯', 'aeolian'), 'A');
});

test('une lettre par degré dans toutes les gammes heptatoniques', () => {
  for (const tonic of T.TONICS) for (const id of [...T.MODE_IDS, 'harmMinor', 'phrygDom']) {
    const letters = T.buildScale(tonic, id).map(n => n.name[0]);
    assert.equal(new Set(letters).size, 7, `${tonic} ${id}: ${letters}`);
  }
});

test('demi-tons corrects pour toutes les gammes', () => {
  for (const tonic of T.TONICS) for (const [id, sc] of Object.entries(T.SCALES)) {
    const s = T.buildScale(tonic, id);
    const t = T.pcOf(tonic);
    s.forEach((n, i) => assert.equal((n.pc - t + 12) % 12, T.parseInterval(sc.iv[i]).semis % 12, `${tonic} ${id} ${n.iv}`));
  }
});

test('formules en tons', () => {
  assert.deepEqual(T.stepPattern('ionian'), ['T', 'T', '½T', 'T', 'T', 'T', '½T']);
  assert.deepEqual(T.stepPattern('dorian'), ['T', '½T', 'T', 'T', 'T', '½T', 'T']);
  assert.deepEqual(T.stepPattern('minPenta'), ['1½T', 'T', 'T', '1½T', 'T']);
});

test('comparaison A dorien / A éolien : seule la 6te change', () => {
  const c = T.compareScales('A', 'dorian', 'aeolian');
  assert.equal(names(c.onlyA), 'F♯');
  assert.equal(names(c.onlyB), 'F');
  assert.equal(c.common.length, 6);
});

test('accords', () => {
  assert.equal(names(T.buildChord('B♭', 'maj7')), 'B♭ D F A');
  assert.equal(names(T.buildChord('F♯', 'm7b5')), 'F♯ A C E');
  assert.equal(names(T.buildChord('E', 'dom7')), 'E G♯ B D');
  assert.equal(names(T.buildChord('C', 'aug')), 'C E G♯');
  assert.equal(names(T.buildChord('B', 'dim7')), 'B D F A♭');
  assert.equal(names(T.buildChord('A', 'm9')), 'A C E G B');
  assert.equal(names(T.buildChord('D', 'sus7')), 'D G A C');
  assert.equal(names(T.buildChord('G', 'add9')), 'G B D A');
});

test('harmonisation de C majeur', () => {
  assert.equal(T.harmonize('C', 'ionian').map(c => c.symbol).join(' '), 'C Dm Em F G Am B°');
  assert.equal(T.harmonize('C', 'ionian', true).map(c => c.symbol).join(' '), 'Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7♭5');
  assert.equal(T.harmonize('C', 'ionian').map(c => c.roman).join(' '), 'I ii iii IV V vi vii°');
});

test('harmonisation des modes et du mineur', () => {
  assert.equal(T.harmonize('A', 'aeolian').map(c => c.roman).join(' '), 'i ii° ♭III iv v ♭VI ♭VII');
  assert.equal(T.harmonize('A', 'aeolian').map(c => c.symbol).join(' '), 'Am B° C Dm Em F G');
  assert.equal(T.harmonize('D', 'dorian').map(c => c.roman).join(' '), 'i ii ♭III IV v vi° ♭VII');
  assert.equal(T.harmonize('A', 'harmMinor').map(c => c.symbol).join(' '), 'Am B° C+ Dm E F G♯°');
  for (const tonic of T.TONICS) for (const id of T.MODE_IDS)
    for (const ch of T.harmonize(tonic, id, true)) assert.ok(ch.typeId, `${tonic} ${id} ${ch.root}`);
});

test('renversements', () => {
  const inv = T.inversions('C', 'maj');
  assert.equal(inv.length, 3);
  assert.equal(inv[1].bass.name, 'E');
  assert.equal(inv[2].bass.name, 'G');
  assert.equal(T.inversions('G', 'dom7').length, 4);
});

test('voicings : le Do ouvert et le barré de La existent', () => {
  const c = T.chordVoicings('C', 'maj').map(v => v.frets.join(','));
  assert.ok(c.includes('-1,3,2,0,1,0'), 'C ouvert x32010 : ' + c.join(' | '));
  const a = T.chordVoicings('A', 'maj').map(v => v.frets.join(','));
  assert.ok(a.some(x => x === '5,7,7,6,5,5'), 'A barré case 5 : ' + a.join(' | '));
  // toutes les notes produites appartiennent à l'accord, et la basse est la fondamentale
  for (const [r, t] of [['E', 'm7'], ['B♭', 'maj7'], ['F♯', 'm7b5'], ['D', 'sus2'], ['G', 'dom7'], ['A', 'm9'], ['C', 'maj9']]) {
    const vs = T.chordVoicings(r, t);
    assert.ok(vs.length > 0, `aucun voicing pour ${r}${t}`);
    const pcs = new Set(T.buildChord(r, t).map(n => n.pc));
    for (const v of vs) {
      const s = v.frets.map((f, i) => f >= 0 ? T.pcAt(i, f) : null).filter(x => x !== null);
      assert.ok(s.every(p => pcs.has(p)), `${r}${t} ${v.frets}`);
      assert.equal(s[0], T.pcOf(r), `basse de ${r}${t} ${v.frets}`);
    }
  }
});

test('triades sur 3 cordes', () => {
  const sh = T.triadShapes('G', 'maj', [3, 4, 5]);
  assert.ok(sh.some(x => x.inversion === 0) && sh.some(x => x.inversion === 1) && sh.some(x => x.inversion === 2));
  // G en position fondamentale sur cordes 3-2-1 : 12-12-10 ? (G-B-D) → vérifions les hauteurs
  for (const x of sh) x.frets.forEach((f, i) => assert.equal(T.pcAt(x.strings[i], f), x.notes[i].pc));
});

test('zones de gamme : la penta de A démarre case 5', () => {
  const z = T.scaleZones(T.buildScale('A', 'minPenta'));
  assert.equal(z[0].from, 5);
  assert.equal(z.length, 5);
});

test('progressions transposées', () => {
  const p = T.realizeProgression('E', [['1', 'm7'], ['4', 'dom7']]);
  assert.equal(p.map(c => c.symbol).join(' '), 'Em7 A7');
  assert.equal(p.map(c => c.roman).join(' '), 'i7 IV7');
});

test('orthographe plus simple', () => {
  assert.equal(T.simplerTonic('G♭', 'locrian'), 'F♯');
  assert.equal(T.simplerTonic('C', 'ionian'), null);
});
