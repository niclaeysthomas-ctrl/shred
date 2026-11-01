/* Les 7 modes de la gamme majeure — leur fonctionnement musical, pas des formes de doigts.
   `char` = intervalle(s) caractéristique(s) ; `vs` = le mode « voisin » de même famille
   avec lequel on le compare pour entendre la différence. */
export const MODE_INFO = {
  ionian: {
    name: 'Ionien', degree: 1, family: 'majeur', chord: 'maj7', chordTxt: 'maj7 (ou triade majeure)',
    char: ['7', '4'], vs: 'mixolydian',
    color: 'Lumineux, stable, « résolu ». C’est la gamme majeure telle quelle : tout tire vers la tonique.',
    why: 'La 7 majeure (à un demi-ton de la tonique) crée une attraction forte vers la tonique : c’est ce qui rend l’ionien si « conclusif ». La 4 est la note délicate : posée longtemps sur l’accord I, elle frotte avec la tierce.',
    targets: 'Tonique, tierce majeure et quinte pour les fins de phrase ; la 7 juste avant de retomber sur la tonique.',
    contexts: 'Ballades, pop, refrains qui s’ouvrent. « Wish You Were Here » tourne en G majeur.',
    progressions: [['1', 'maj', 1], ['4', 'maj', 1], ['5', 'maj', 1], ['1', 'maj', 1]],
    pentaLink: 'Penta majeure + la 4 et la 7.'
  },
  dorian: {
    name: 'Dorien', degree: 2, family: 'mineur', chord: 'm7', chordTxt: 'm7 (ou m6)',
    char: ['6'], vs: 'aeolian',
    color: 'Mineur mais pas triste : sombre et « cool », avec une lueur. Groove, mélancolie élégante.',
    why: 'C’est un mineur (♭3) avec une 6te MAJEURE. Cette 6te éclaircit le mineur : là où l’éolien (♭6) est dramatique, le dorien reste ouvert. Le IV de ce mode est un accord majeur (en A dorien : D majeur), et c’est l’enchaînement i → IV qui fait entendre le dorien.',
    targets: 'La 6 (F♯ en A dorien) sur l’accord i ; la tierce mineure pour l’assise ; sur l’accord IV, sa tierce (= la 6 du mode).',
    contexts: '« Breathe » de Pink Floyd (Em → A) est l’exemple type de vamp dorienne. Très présent dans le rock psyché, le funk, Santana.',
    progressions: [['1', 'm7', 2], ['4', 'dom7', 2]],
    pentaLink: 'Penta mineure + la 2 et la 6 majeure.'
  },
  phrygian: {
    name: 'Phrygien', degree: 3, family: 'mineur', chord: 'm7', chordTxt: 'm7 (couleur ♭9)',
    char: ['b2'], vs: 'aeolian',
    color: 'Sombre, oriental, menaçant. Le mode du metal et du flamenco.',
    why: 'La ♭2, à un demi-ton au-dessus de la tonique, crée une tension écrasante qui « retombe » sur la tonique. L’enchaînement i → ♭II (Em → F) suffit à faire entendre le phrygien. Sa cousine, le phrygien dominant (tierce majeure), est la sonorité orientale qu’on entend chez System of a Down.',
    targets: 'La ♭2 qui retombe sur la tonique ; la ♭3 et la 5 pour l’assise.',
    contexts: 'Riffs metal en E sur la corde à vide (E–F), thrash, sonorités orientales.',
    progressions: [['1', 'min', 1], ['b2', 'maj', 1]],
    pentaLink: 'Penta mineure + la ♭2 et la ♭6.'
  },
  lydian: {
    name: 'Lydien', degree: 4, family: 'majeur', chord: 'maj7', chordTxt: 'maj7(♯11)',
    char: ['#4'], vs: 'ionian',
    color: 'Majeur flottant, rêveur, en suspension. Le son « cinéma » et shoegaze.',
    why: 'C’est un majeur avec une 4te AUGMENTÉE (♯4). Elle supprime la seule note « gênante » de l’ionien et ajoute un parfum d’apesanteur. L’accord II est majeur (en F lydien : G majeur) : I → II en boucle = lydien immédiat.',
    targets: 'La ♯4 sur l’accord I (tenue, avec un bend ou du vibrato) ; la 7 majeure ; la tierce de l’accord II (= la ♯4).',
    contexts: 'Ambiances atmosphériques, shoegaze, musiques de film, Satriani et Vai.',
    progressions: [['1', 'maj7', 2], ['2', 'maj', 2]],
    pentaLink: 'Penta majeure + la ♯4 et la 7.'
  },
  mixolydian: {
    name: 'Mixolydien', degree: 5, family: 'majeur', chord: 'dom7', chordTxt: '7 (dominante)',
    char: ['b7'], vs: 'ionian',
    color: 'Majeur rock, terrien, bluesy. Le majeur « qui a du grain ».',
    why: 'C’est un majeur avec une ♭7. Cette ♭7 enlève l’attraction vers la tonique (plus de sensible) : la musique tourne sans vouloir conclure. L’accord ♭VII majeur (en D mixolydien : C) est sa signature rock : I → ♭VII → IV.',
    targets: 'La ♭7 sur l’accord I ; la tierce majeure (le mélange 3 / ♭3 est typique du blues-rock).',
    contexts: 'Le riff de « Sweet Child O’ Mine » tourne en D mixolydien (D → C → G). Classic rock, blues, Hendrix.',
    progressions: [['1', 'maj', 1], ['b7', 'maj', 1], ['4', 'maj', 1], ['1', 'maj', 1]],
    pentaLink: 'Penta majeure + la 4 et la ♭7.'
  },
  aeolian: {
    name: 'Éolien (mineur naturel)', degree: 6, family: 'mineur', chord: 'm7', chordTxt: 'm7',
    char: ['b6'], vs: 'dorian',
    color: 'Mineur classique : triste, dramatique, épique.',
    why: 'Le mineur naturel avec sa 6te MINEURE (♭6). Cette ♭6, un demi-ton au-dessus de la quinte, a un poids émotionnel fort : elle « pleure » vers la quinte. Le ♭VI et le ♭VII majeurs (en A : F et G) donnent les progressions épiques du rock.',
    targets: 'La ♭6 qui retombe sur la 5 ; la ♭3 ; la tonique.',
    contexts: 'Le couplet de « Comfortably Numb » (Bm → A → G → Em), rock alternatif, metal mélodique, la grande majorité des chansons « mineures ».',
    progressions: [['1', 'min', 1], ['b6', 'maj', 1], ['b3', 'maj', 1], ['b7', 'maj', 1]],
    pentaLink: 'Penta mineure + la 2 et la ♭6.'
  },
  locrian: {
    name: 'Locrien', degree: 7, family: 'diminué', chord: 'm7b5', chordTxt: 'm7♭5 (demi-diminué)',
    char: ['b5', 'b2'], vs: 'phrygian',
    color: 'Instable, inquiétant, sans repos. Presque jamais utilisé comme mode d’un morceau entier.',
    why: 'Sa quinte est diminuée (♭5) : la tonique elle-même est instable, son accord est demi-diminué. On le rencontre surtout sur l’accord IIø d’une tonalité mineure, ou dans des riffs metal très dissonants.',
    targets: 'La ♭5 et la ♭2 pour l’effet ; la ♭3 pour ne pas perdre l’auditeur.',
    contexts: 'Passages metal dissonants ; accord m7♭5 en jazz (II-V mineur).',
    progressions: [['1', 'm7b5', 1], ['b2', 'maj7', 1]],
    pentaLink: 'Penta mineure avec la quinte abaissée, + ♭2 et ♭6.'
  }
};
