/* Pourquoi chaque accord sonne comme il sonne — et vers quoi l'enrichir */
export const CHORD_WHY = {
  maj: 'Tierce majeure (4 demi-tons) + quinte juste. Stable, lumineux : c’est l’accord « repos » par excellence.',
  min: 'Tierce mineure (3 demi-tons) + quinte juste. Une seule note diffère du majeur : la tierce, abaissée d’un demi-ton.',
  dim: 'Deux tierces mineures empilées : la quinte est diminuée (♭5). Le triton entre 1 et ♭5 le rend instable : il veut aller ailleurs.',
  aug: 'Deux tierces majeures empilées : la quinte est augmentée (♯5). Étrange, en suspens, souvent utilisé comme passage.',
  sus2: 'La tierce est remplacée par la 2 : ni majeur ni mineur. Ouvert, aérien, très présent dans le rock atmosphérique.',
  sus4: 'La tierce est remplacée par la 4 : tension douce qui « veut » retomber sur la tierce (sus4 → majeur).',
  power: 'Fondamentale + quinte, sans tierce : neutre. Avec de la saturation, la tierce créerait des frottements ; le power chord reste net.',
  add9: 'Triade majeure + la 9 (la 2 une octave plus haut). Plus riche que le majeur, sans la douceur jazz d’un maj7.',
  maj7: 'Triade majeure + septième majeure (un demi-ton sous l’octave). Doux, rêveur, un peu mélancolique.',
  m7: 'Triade mineure + septième mineure. Moins triste que le mineur seul, plus souple : l’accord du dorien et du groove.',
  dom7: 'Triade majeure + septième mineure. Sa 3 et sa ♭7 forment un triton : tension qui appelle une résolution (V7 → I), ou couleur blues.',
  m7b5: 'Triade diminuée + septième mineure. Sombre et instable : le IIø des tonalités mineures, l’accord du locrien.',
  dim7: 'Trois tierces mineures empilées : symétrique, il se répète toutes les 3 cases. Très tendu, utilisé comme passage.',
  mMaj7: 'Triade mineure + septième majeure. Sombre et dramatique (musiques de film, mineur harmonique).',
  maj7s5: 'Majeur 7 avec quinte augmentée : couleur flottante, issue du mineur mélodique.',
  m9: 'm7 + 9 : le mineur le plus doux et le plus riche. Son « néo-soul », Deftones, ambiances sombres et chaudes.',
  maj9: 'maj7 + 9 : très ouvert, lumineux, atmosphérique.',
  sus7: '7 avec la 4 à la place de la tierce : dominante adoucie, sans le triton. Très utilisée en rock et en modal.'
};
export const CHORD_NEXT = {
  maj: ['maj7', 'add9', 'sus2', 'sus4', 'dom7'], min: ['m7', 'm9', 'sus2'], dim: ['m7b5', 'dim7'], aug: ['maj7s5'],
  sus2: ['add9', 'maj'], sus4: ['sus7', 'maj'], power: ['maj', 'min'], add9: ['maj9'], maj7: ['maj9'], m7: ['m9'], dom7: ['sus7'],
  m7b5: ['dim7'], dim7: ['m7b5'], mMaj7: ['m7'], maj7s5: ['maj7'], m9: ['m7'], maj9: ['maj7'], sus7: ['dom7']
};
