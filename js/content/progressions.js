/* Progressions pour l'Improvisation Studio, écrites en degrés (transposables dans toutes les tonalités).
   [intervalle de la fondamentale depuis la tonique, type d'accord, nombre de mesures]
   « À la manière de » : on reprend l'idée harmonique, pas le morceau. */
export const PROGRESSIONS = [
  { id: 'floyd-dorian', name: 'Vamp dorien (façon « Breathe »)', style: 'floyd', key: 'E', scale: 'dorian', bpm: 66,
    chords: [['1', 'm7', 2], ['4', 'dom7', 2]], level: 1,
    tip: 'Deux accords, un mode. Sur le IV (A), fais entendre sa tierce C♯ : c’est la 6te dorienne.' },
  { id: 'floyd-numb', name: 'Mineur descendant (façon « Comfortably Numb »)', style: 'floyd', key: 'B', scale: 'aeolian', bpm: 64,
    chords: [['1', 'min', 2], ['b7', 'maj', 2], ['b6', 'maj', 2], ['4', 'min', 2]], level: 2,
    tip: 'Une phrase par accord, avec beaucoup d’espace. Termine sur la tierce de chaque accord.' },
  { id: 'floyd-wish', name: 'Majeur acoustique (façon « Wish You Were Here »)', style: 'floyd', key: 'G', scale: 'ionian', bpm: 72,
    chords: [['4', 'maj', 1], ['5', 'maj', 1], ['2', 'min', 1], ['1', 'maj', 1]], level: 2,
    tip: 'La penta majeure de G marche partout. Pour aller plus loin, vise la tierce de chaque accord.' },
  { id: 'blues12', name: 'Blues 12 mesures', style: 'blues', key: 'A', scale: 'blues', bpm: 88,
    chords: [['1', 'dom7', 4], ['4', 'dom7', 2], ['1', 'dom7', 2], ['5', 'dom7', 1], ['4', 'dom7', 1], ['1', 'dom7', 1], ['5', 'dom7', 1]], level: 2,
    tip: 'Penta mineure partout, mais vise la tierce MAJEURE de chaque accord (C♯ sur A7, F♯ sur D7, G♯ sur E7).' },
  { id: 'blues-minor', name: 'Blues mineur lent', style: 'blues', key: 'A', scale: 'aeolian', bpm: 70,
    chords: [['1', 'm7', 4], ['4', 'm7', 2], ['1', 'm7', 2], ['b6', 'dom7', 1], ['5', 'dom7', 1], ['1', 'm7', 2]], level: 3,
    tip: 'Sur E7 (le V), la tierce G♯ n’est pas dans la gamme mineure : c’est elle qu’il faut viser.' },
  { id: 'grunge-teen', name: 'Grunge en power chords (i iv ♭III ♭VI)', style: 'grunge', key: 'F', scale: 'minPenta', bpm: 116,
    chords: [['1', 'power', 1], ['4', 'power', 1], ['b3', 'power', 1], ['b6', 'power', 1]], level: 1,
    tip: 'Power chords = pas de tierce : penta mineure, et termine tes phrases sur la fondamentale de l’accord du moment.' },
  { id: 'grunge-drop', name: 'Grunge lourd (i ♭VII ♭VI ♭VII)', style: 'grunge', key: 'D', scale: 'aeolian', bpm: 100,
    chords: [['1', 'power', 1], ['b7', 'power', 1], ['b6', 'power', 1], ['b7', 'power', 1]], level: 1,
    tip: 'Mélodies simples, notes longues, bends. La ♭6 (B♭) sur le ♭VI est une cible forte.' },
  { id: 'alt-epic', name: 'Rock alternatif (i ♭VI ♭III ♭VII)', style: 'alt', key: 'A', scale: 'aeolian', bpm: 104,
    chords: [['1', 'min', 1], ['b6', 'maj', 1], ['b3', 'maj', 1], ['b7', 'maj', 1]], level: 2,
    tip: 'Le classique du rock moderne. Relie la tierce de chaque accord à celle du suivant.' },
  { id: 'mixo-rock', name: 'Rock mixolydien (I ♭VII IV)', style: 'alt', key: 'D', scale: 'mixolydian', bpm: 112,
    chords: [['1', 'maj', 1], ['b7', 'maj', 1], ['4', 'maj', 1], ['1', 'maj', 1]], level: 2,
    tip: 'Sur D, le C naturel (♭7) est la couleur mixolydienne. Sur C, c’est la fondamentale de l’accord.' },
  { id: 'metal-phryg', name: 'Metal phrygien (i ♭II)', style: 'metal', key: 'E', scale: 'phrygian', bpm: 120,
    chords: [['1', 'power', 2], ['b2', 'power', 1], ['1', 'power', 1]], level: 2,
    tip: 'Le F (♭2) qui retombe sur E est toute l’identité du phrygien.' },
  { id: 'metal-harm', name: 'Metal mineur harmonique (i ♭VI V)', style: 'metal', key: 'E', scale: 'harmMinor', bpm: 110,
    chords: [['1', 'power', 2], ['b6', 'power', 1], ['5', 'maj', 1]], level: 3,
    tip: 'Sur B majeur (V), le D♯ (7e de E mineur harmonique) tire vers E : sonorité néo-classique.' },
  { id: 'shoe-lydian', name: 'Shoegaze lydien (I II)', style: 'shoegaze', key: 'F', scale: 'lydian', bpm: 70,
    chords: [['1', 'maj7', 2], ['2', 'maj', 2]], level: 2,
    tip: 'Tiens le B (♯4) sur Fmaj7 avec beaucoup de vibrato : c’est la couleur lydienne.' },
  { id: 'deftones', name: 'Atmosphère sombre (i ♭VI, m(add9))', style: 'shoegaze', key: 'C♯', scale: 'aeolian', bpm: 76,
    chords: [['1', 'm9', 2], ['b6', 'maj7', 2]], level: 3,
    tip: 'Notes longues, intervalles larges. La 9 (D♯) sur l’accord i est une couleur à exploiter.' }
];

/* Progressions modales de l'exercice 4 : une par mode, le vamp qui le fait entendre */
export const MODAL_VAMPS = {
  ionian: [['1', 'maj7', 1], ['4', 'maj7', 1]],
  dorian: [['1', 'm7', 2], ['4', 'dom7', 2]],
  phrygian: [['1', 'min', 1], ['b2', 'maj', 1]],
  lydian: [['1', 'maj7', 2], ['2', 'maj', 2]],
  mixolydian: [['1', 'dom7', 1], ['b7', 'maj', 1]],
  aeolian: [['1', 'min', 1], ['b6', 'maj', 1], ['b7', 'maj', 1], ['1', 'min', 1]],
  locrian: [['1', 'm7b5', 1], ['b2', 'maj7', 1]]
};
