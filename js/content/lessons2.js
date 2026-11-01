/* Modules 4 (suite), 5, 6, 7 du parcours */
const mk = o => ({ ready: true, ...o });

export const M4_REST = [
  mk({
    id: 'm4-phrasing', title: 'Le phrasé', short: 'Parler plutôt que réciter',
    simple: 'Une impro est une conversation : des phrases, des respirations, des silences. La plupart des guitaristes jouent trop de notes, trop longtemps, sans s’arrêter. Le phrasé, c’est décider <b>où</b> une phrase commence, <b>où</b> elle finit, et laisser de l’air entre les deux.',
    deep: `Quatre leviers, du plus simple au plus fin :
<ul><li><b>La longueur</b> : des phrases de 1 à 2 mesures, suivies d’autant de silence. Chante tes phrases : si tu manques d’air, elles sont trop longues.</li>
<li><b>Le placement</b> : commence parfois sur le temps 2 ou le « et » du 1. Une phrase qui démarre toujours sur le 1 sonne mécanique.</li>
<li><b>L’articulation</b> : bends, slides, vibrato, notes étouffées. Gilmour joue peu de notes mais chacune est « dite ».</li>
<li><b>La fin</b> : une phrase finit sur une [[note cible]] (module 4.1), tenue, avec vibrato.</li></ul>`,
    fb: { kind: 'scale', tonic: 'E', scale: 'minPenta', labels: 'iv' },
    fbNote: 'E penta mineure. L’exercice ne porte pas sur les notes mais sur le temps : peu de notes, bien placées.',
    practice: 'Règle des 4 notes : improvise 2 minutes avec au maximum 4 notes par phrase, puis 2 temps de silence obligatoire. Puis 2 minutes en commençant chaque phrase sur le temps 2.',
    musical: 'Dans l’Impro Studio, exercice « Appel et réponse » : la mesure de silence imposée t’apprend à respirer.',
    gens: ['motifId', 'targets'], impro: { exercise: 'call' }
  }),
  mk({
    id: 'm4-callresponse', title: 'Call and response', short: 'Une question, une réponse',
    simple: 'Une phrase pose une question (elle finit en suspens, sur une note instable ou en montant), la suivante y répond (elle conclut, sur la tonique ou en descendant). C’est la structure du blues, et le moyen le plus simple de donner un sens à une impro.',
    deep: `Une « question » finit souvent sur la 5, la 2 ou la ♭7 ; une « réponse » finit sur 1 ou 3. La réponse reprend souvent le rythme de la question en changeant la fin.
<br><br>Variantes : réponse identique (insistance), réponse transposée, réponse raccourcie, réponse contrastée (aigu ↔ grave). Le dialogue peut aussi se faire avec la voix : tu chantes, tu joues — c’est un excellent exercice pour un guitariste qui chante.`,
    fb: { kind: 'scale', tonic: 'A', scale: 'minPenta', labels: 'iv' },
    fbNote: 'Questions : finir sur 5 ou ♭7. Réponses : finir sur 1 (ou ♭3).',
    practice: 'Joue une question de 4 notes finissant sur la 5, puis la même phrase finissant sur la tonique. 10 paires, sans métronome, puis avec.',
    musical: 'Impro Studio → Appel et réponse, niveaux 1 à 4.',
    gens: ['motifId'], impro: { exercise: 'call' }
  }),
  mk({
    id: 'm4-motif', title: 'Développer un motif', short: 'Une idée, plusieurs vies',
    simple: 'Au lieu d’enchaîner des plans différents, prends une petite idée de 3-4 notes et transforme-la : répète-la, déplace-la dans la gamme, change son rythme, inverse son contour. L’auditeur reconnaît l’idée, et ton solo a une histoire.',
    deep: `Les transformations classiques :
<ul><li><b>Répétition</b> — l’ancrage. Une idée entendue deux fois devient « un thème ».</li><li><b>Séquence</b> — même forme, une note de la gamme plus haut ou plus bas.</li><li><b>Variation rythmique</b> — mêmes notes, autre placement.</li><li><b>Inversion du contour</b> — ce qui montait descend.</li><li><b>Fragmentation</b> — on ne garde que le début.</li><li><b>Extension</b> — on ajoute une fin.</li></ul>
Écoute le solo de « Comfortably Numb » : quelques idées, développées pendant des minutes.`,
    fb: { kind: 'scale', tonic: 'E', scale: 'minPenta', labels: 'note' },
    fbNote: 'Choisis 3 notes voisines dans cette zone : c’est ton motif.',
    practice: 'Un motif de 3 notes, 6 transformations dans l’ordre de la liste, une par mesure, au métronome lent.',
    musical: 'Impro Studio → Développer un motif : la boucle te demande une transformation toutes les 2 mesures.',
    gens: ['motifId'], impro: { exercise: 'motif' }
  }),
  mk({
    id: 'm4-passing', title: 'Les notes de passage', short: 'Relier les cibles',
    simple: 'Une note de passage relie deux notes importantes, souvent par demi-ton (note [[chromatique]]). Elle se joue en mouvement, sur un temps faible, et donne de la fluidité — et ce son « jazz » ou « blues » de la note qui glisse.',
    deep: `Les plus utiles en rock/blues : la ♭5 entre 4 et 5 (la blue note), la 7 entre ♭7 et 1, la 3 entre ♭3 et 4 (le fameux ♭3 → 3 du blues), la 6 entre 5 et ♭7.
<br><br>Règle : une note de passage n’est jamais une destination. Si tu t’arrêtes dessus, elle sonne fausse ; si tu passes dessus pour atterrir sur une note d’accord, elle sonne pro. On peut aussi « encercler » une cible : note au-dessus, note en dessous, puis la cible.`,
    fb: { kind: 'scale', tonic: 'A', scale: 'blues', labels: 'iv' },
    fbNote: 'A blues : la ♭5 est la note de passage intégrée à la gamme.',
    practice: 'Joue 5 → ♭5 → 4 et 4 → ♭5 → 5 en croches, puis ♭7 → 7 → 1 et ♭3 → 3 → 4. Toujours finir sur la note forte.',
    musical: 'Sur le blues 12 mesures de l’Impro Studio, place une note de passage par phrase, en finissant sur une cible.',
    gens: ['passing'], impro: { exercise: 'targets' }
  }),
  mk({
    id: 'm4-enriched', title: 'Pentatoniques enrichies', short: 'Ta boîte + la note qui dit le mode',
    simple: 'Tu connais tes boîtes de penta par cœur : ne les jette pas. Ajoute-leur une ou deux notes choisies et tu obtiens un mode, sans réapprendre de doigtés. C’est le pont entre ce que tu joues déjà et les modes du module 3.',
    deep: `<ul><li>Penta mineure + <b>6</b> (et 2) → dorien : sur m7 → IV7, ou pour éclaircir un mineur.</li><li>Penta mineure + <b>♭6</b> (et 2) → éolien : plus dramatique.</li><li>Penta mineure + <b>♭2</b> → phrygien : metal.</li><li>Penta majeure + <b>4</b> + <b>♭7</b> → mixolydien : rock, blues majeur.</li><li>Penta majeure + <b>♯4</b> + 7 → lydien : rêveur.</li></ul>
Méthode : ajoute UNE note à la fois et cherche ses emplacements dans ta boîte habituelle.`,
    fb: { kind: 'compare', tonic: 'A', a: 'dorian', b: 'minPenta', labels: 'iv' },
    fbNote: 'En jaune : les notes que le dorien ajoute à ta penta mineure (2 et 6).',
    practice: 'Dans ta boîte 1 de A penta mineure, ajoute la 6 (F♯) : trouve ses 2-3 emplacements, et joue des phrases qui passent par elle.',
    musical: 'Impro Studio → Modes, dorien sur A : uniquement ta boîte de penta + F♯.',
    gens: ['enrichedPenta'], impro: { exercise: 'modes', mode: 'dorian' }
  }),
  mk({
    id: 'm4-multichord', title: 'Improviser sur plusieurs accords', short: 'Une gamme, des cibles qui changent',
    simple: 'Sur une grille diatonique, une gamme suffit pour ne pas jouer faux — mais pour que la grille s’entende, les notes d’arrivée changent avec les accords. Et les notes communes à deux accords sont des ponts.',
    deep: `Trois niveaux :
<ol><li>Une gamme pour toute la grille (sécurité).</li><li>Des cibles différentes à chaque accord (module 4.1).</li><li>Quand un accord sort de la gamme (V7 dans un blues mineur, accord emprunté), on adapte la gamme sur cet accord seulement — souvent en changeant une seule note.</li></ol>
Astuce Gilmour : tenir une note commune pendant le changement d’accord — elle ne bouge pas, mais sa couleur change autour d’elle.`,
    fb: { kind: 'chord', root: 'G', type: 'maj', labels: 'note', scaleCtx: { tonic: 'E', scale: 'aeolian' } },
    fbNote: 'G dans E mineur : ses notes sont déjà dans la gamme ; ce sont elles qui deviennent les cibles quand G sonne.',
    practice: 'Choisis une grille de 4 accords. Pour chaque paire d’accords voisins, trouve une note commune et tiens-la pendant le changement.',
    musical: 'Impro Studio → Impro libre sur « Rock alternatif (i ♭VI ♭III ♭VII) », avec la mise en évidence des notes de l’accord activée.',
    gens: ['multiChord', 'targets'], impro: { exercise: 'free' }
  }),
  mk({
    id: 'm4-solo', title: 'Construire un solo', short: 'Début, développement, sommet, fin',
    simple: 'Un solo réussi a une forme : il commence simplement, développe une idée, monte vers un sommet (aigu, intensité), puis conclut. C’est ce qui sépare un solo mémorable d’une démonstration.',
    deep: `Plan classique sur 16 ou 24 mesures :
<ul><li><b>Exposition</b> : un motif simple, médium, beaucoup d’espace.</li><li><b>Développement</b> : variations du motif, phrases un peu plus longues, registre qui monte.</li><li><b>Sommet</b> : le plus aigu, bends larges, plus de densité (c’est là que le trémolo ou les phrases rapides ont du sens).</li><li><b>Conclusion</b> : retour au motif ou phrase descendante qui finit sur une cible forte.</li></ul>
La courbe d’intensité compte plus que les notes : demande-toi à chaque instant « est-ce que je monte, je redescends, ou je respire ? »`,
    fb: { kind: 'scale', tonic: 'B', scale: 'aeolian', labels: 'iv' },
    fbNote: 'B mineur sur tout le manche : le registre grave pour l’exposition, l’aigu (cases 12-15) pour le sommet.',
    practice: 'Écris (ou chante) le plan d’un solo de 16 mesures : 4 mesures par partie, avec le registre et l’intensité de chacune.',
    musical: 'Impro Studio → Impro libre sur « Mineur descendant » en 4 tours : 1 tour par partie du plan. Enregistre-toi et réécoute la courbe.',
    gens: ['multiChord', 'passing', 'motifId'], impro: { exercise: 'free' }
  })
];

const tech = (id, techId, title, short, simple, deep, practice, musical, extra = {}) => mk({
  id, title, short, simple, deep, practice, musical, tech: techId, fb: extra.fb || null, fbNote: extra.fbNote || '', ...extra
});

export const M5 = [
  tech('m5-alt', 'alt-1string', 'Alternate picking', 'La base du jeu au médiator',
    'L’[[alternate picking]] : bas-haut-bas-haut, strictement, quelles que soient les notes. C’est la technique qui rend le jeu au médiator régulier et rapide — et ta priorité, puisque tu joues surtout aux doigts.',
    'La vitesse vient de la <b>petitesse</b> du mouvement et de la <b>détente</b>, pas de la force. Le poignet bouge, l’avant-bras reste calme, le médiator dépasse peu. Le vrai obstacle n’est pas une corde seule mais le <b>changement de corde</b> (exercice suivant du Technique Lab). Méthode : métronome, +4 BPM seulement après 3 passages propres, −8 si ça bave.',
    'Technique Lab → « Alternate picking — une corde », puis « changement de corde ».',
    'Joue le riff d’un morceau que tu connais aux doigts, cette fois au médiator en alternate strict.',
    { fb: { kind: 'scale', tonic: 'A', scale: 'minPenta', labels: 'iv' }, fbNote: 'Ta boîte de penta : le terrain d’entraînement du changement de corde.' }),
  tech('m5-palm', 'palm-mute', 'Palm muting', 'Le son du grunge et du metal',
    'Le [[palm mute]] étouffe les cordes avec la tranche de la main droite près du chevalet : son sec, percussif, le « chug » de Deftones ou System of a Down.',
    'Tout est dans la position : trop vers le manche, la note meurt ; trop sur le chevalet, aucun effet. La pression doit rester constante pour que toutes les notes aient le même volume. Les accents (sans mute) font ressortir le rythme. Au médiator, coups vers le bas pour le metal, aller-retour pour le gallop.',
    'Technique Lab → « Palm mute — riff grunge/metal », puis « Gallop ».',
    'Joue une grille grunge de l’Impro Studio en power chords : couplet en palm mute, refrain sans.'),
  tech('m5-legato', 'hammer-pull', 'Legato : hammer-on et pull-off', 'Des notes liées, sans attaque',
    'Le legato enchaîne plusieurs notes avec une seule attaque : la main gauche les fait sonner (hammer-on en frappant, pull-off en tirant). Son fluide, plus doux que l’attaque au médiator.',
    'Le hammer-on se fait du bout du doigt, juste derrière la frette, avec un geste court et sec. Le pull-off n’est pas un simple lâcher : le doigt tire la corde vers le sol, comme un petit pincement. Objectif : la note liée aussi forte que la note attaquée. Ensuite, on enchaîne en triolets (exercice « Legato »).',
    'Technique Lab → « Hammer-on / pull-off isolés », puis « Legato ».',
    'Dans une phrase de penta, remplace chaque montée de 2 notes sur une corde par un hammer-on.'),
  tech('m5-bend', 'bends', 'Bending', 'Atteindre la note, exactement',
    'Un bend monte la hauteur d’une note en poussant la corde. Un bend faux est le défaut le plus audible d’un solo — et le plus beau son de la guitare quand il est juste.',
    'Méthode : joue d’abord la note cible (2 cases plus loin pour un bend d’un ton), écoute-la, puis bende jusqu’à la retrouver. Pousse avec 3 doigts, le poignet tourne. Le Technique Lab mesure ta justesse au micro en cents (100 cents = un demi-ton) : sous ±10 cents, c’est juste.',
    'Technique Lab → « Bends justes », avec la mesure au micro.',
    'Sur la vamp dorienne de l’Impro Studio, finis chaque phrase par un bend vers une note cible.',
    { measure: 'bend' }),
  tech('m5-vibrato', 'vibrato', 'Vibrato', 'La signature de ton son',
    'Le vibrato fait osciller la hauteur d’une note tenue. Gilmour, Slash : on les reconnaît à leur vibrato avant même la phrase.',
    'Deux paramètres : l’amplitude (de combien la note monte) et la vitesse. La régularité compte plus que tout. Un vibrato large et lent sonne « Gilmour » ; serré et rapide, « classique ». Le Technique Lab dessine la courbe de hauteur de ton vibrato au micro et mesure amplitude, vitesse et régularité.',
    'Technique Lab → « Vibrato régulier », avec la courbe au micro.',
    'Impro libre : chaque note tenue de plus d’un temps reçoit un vibrato calé sur le tempo.',
    { measure: 'vibrato' }),
  tech('m5-slides', 'slides', 'Slides', 'Voyager sur le manche',
    'Le slide fait glisser une note vers une autre sans réattaquer. C’est aussi le moyen de passer d’une position de gamme à la suivante sans saut.',
    'Pression constante pendant le glissé, arrivée pile sur la case. Slide vers le haut = élan ; vers le bas = détente. Slides d’entrée (depuis 2 cases en dessous, sans note de départ précise) : très expressifs.',
    'Technique Lab → « Slides et changements de position ».',
    'Improvise en reliant 2 boîtes de penta uniquement par des slides.'),
  tech('m5-tremolo', 'tremolo', 'Trémolo picking', 'Le mur de son shoegaze et metal',
    'Une note répétée très vite au médiator, sur une mélodie lente : le son des intros metal et des murs de guitare shoegaze.',
    'C’est de l’alternate picking minuscule et détendu. On commence en doubles croches au métronome pour ne pas se crisper, puis on « lâche » la mesure. L’avant-bras ne doit pas se raidir : si ça brûle, stop.',
    'Technique Lab → « Trémolo picking ».',
    'Sur la boucle shoegaze lydienne, joue une mélodie de 4 notes en trémolo.'),
  tech('m5-economy', 'economy', 'Economy picking', 'Moins de gestes pour la même musique',
    'L’economy picking enchaîne deux coups dans le même sens quand on change de corde dans la direction du médiator : un seul geste balayé.',
    'Utile pour les gammes à 3 notes par corde. On alterne sur une même corde, on balaie au changement. À travailler après un alternate solide : sinon le rythme devient irrégulier.',
    'Technique Lab → « Economy picking » (avancé).',
    'Joue une gamme majeure à 3 notes par corde en economy, puis en alternate : compare.'),
  tech('m5-tapping', 'tapping', 'Tapping', 'La main droite sur le manche',
    'Le tapping utilise un doigt de la main droite pour frapper une case, puis enchaîne en pull-off/hammer-on : arpèges larges et rapides.',
    'Étouffe les cordes graves avec la paume droite, sinon tout résonne. Le pull-off depuis la note tapée doit être net. Commence lentement, en triolets réguliers.',
    'Technique Lab → « Tapping » (avancé).',
    'Tape une note de l’accord en cours sur la vamp d’un exercice de l’Impro Studio.'),
  tech('m5-sweep', 'sweep', 'Sweep picking', 'L’arpège en un geste',
    'Le sweep fait « tomber » le médiator d’une corde à l’autre en un seul mouvement, pour des arpèges rapides. Technique avancée, utile en metal.',
    'Le secret est la main gauche : chaque note doit être étouffée quand la suivante sonne, sinon on entend un accord. Très lent au début, les notes bien séparées.',
    'Technique Lab → « Sweep picking (3 cordes) » (avancé).',
    'Sur la progression metal mineure harmonique, joue l’arpège de chaque accord en sweep lent.')
];

export const M6 = [
  mk({
    id: 'm6-progressions', title: 'Construire une progression', short: 'Tension, repos, couleurs',
    simple: 'Une grille, c’est une histoire de départs et de retours. Avec les fonctions (module 2) et quelques accords empruntés, tu peux construire des grilles qui sonnent voulues, pas tirées au hasard.',
    deep: `Méthode :
<ol><li>Choisis un centre (tonique) et une couleur (majeur, mineur, mode).</li><li>Alterne les fonctions : repos (I, vi) → départ (IV, ii) → tension (V) → repos.</li><li>Ajoute <b>un</b> accord emprunté pour la couleur : ♭VII (rock), ♭VI (épique), iv mineur en majeur (mélancolie).</li><li>Teste la grille en boucle et improvise dessus : si tu t’ennuies en 4 tours, change un accord.</li></ol>`,
    fb: { kind: 'scale', tonic: 'D', scale: 'ionian', labels: 'deg' },
    fbNote: 'D majeur : les 7 degrés sont tes accords de base. Les emprunts viennent de D mineur ou de D mixolydien.',
    practice: 'Construis 3 grilles de 4 accords en D : une purement diatonique, une avec ♭VII, une avec iv mineur. Joue chacune 4 fois.',
    musical: 'Dans le Composition Studio, crée un morceau, construis une section avec ta meilleure grille, et lis l’analyse.',
    gens: ['progBuild', 'borrowed'], link: { label: 'Ouvrir le Composition Studio', href: '#/compo' }
  }),
  mk({
    id: 'm6-riffs', title: 'Composer un riff', short: 'Une idée courte qui revient',
    simple: 'Un riff est un motif court, rythmique, qu’on répète. Il vient presque toujours d’une gamme simple (penta, blues, phrygien) et vit surtout par son rythme.',
    deep: `Ingrédients d’un riff :
<ul><li>une <b>note pivot</b> (souvent la corde à vide ou la tonique) qui revient ;</li><li>un <b>rythme</b> reconnaissable (syncopes, silences, palm mute) ;</li><li>une <b>couleur</b> : ♭5 pour le blues/stoner, ♭2 pour le metal, ♭3 → 3 pour le rock ;</li><li>une <b>réponse</b> : la 2e moitié du riff varie la 1re (call and response, encore).</li></ul>
Tu composes à partir d’impros : enregistre-les et repère les 2 secondes qui reviennent — c’est souvent un riff.`,
    fb: { kind: 'scale', tonic: 'E', scale: 'blues', labels: 'iv' },
    fbNote: 'E blues sur les cordes graves : le terrain de jeu des riffs (corde à vide = pivot).',
    practice: 'Écris 3 riffs d’une mesure en E : un en penta, un avec la ♭5, un en phrygien (avec F). Note-les en tab dans le Composition Studio.',
    musical: 'Enregistre une idée audio de ton meilleur riff dans le Composition Studio.',
    gens: ['riffScale'], link: { label: 'Ouvrir le Composition Studio', href: '#/compo' }
  }),
  mk({
    id: 'm6-sections', title: 'Couplet et refrain', short: 'Deux parties qui se répondent',
    simple: 'Couplet et refrain doivent être différents mais apparentés. Le couplet raconte, le refrain s’ouvre : plus aigu, plus fort, plus lumineux ou plus dense.',
    deep: 'Leviers : centre harmonique (couplet sur i, refrain sur le relatif majeur), rythme (accords tenus → croches), dynamique (clean → saturé, le modèle Nirvana/Pixies), registre de la voix (le refrain monte), longueur des phrases. Un pré-refrain peut créer la tension (souvent sur IV ou V) juste avant.',
    fb: { kind: 'scale', tonic: 'A', scale: 'aeolian', labels: 'note' },
    fbNote: 'A mineur et C majeur : mêmes notes. Couplet centré sur Am, refrain centré sur C.',
    practice: 'Écris un couplet de 4 accords centré sur Am et un refrain centré sur C, avec les mêmes notes de gamme.',
    musical: 'Dans le Composition Studio, crée les sections Couplet et Refrain et écoute-les enchaînées.',
    gens: ['contrast'], link: { label: 'Ouvrir le Composition Studio', href: '#/compo' }
  }),
  mk({
    id: 'm6-contrast', title: 'Le contraste harmonique', short: 'Changer de couleur au bon moment',
    simple: 'Une chanson entière dans la même couleur fatigue l’oreille. Le contraste harmonique, c’est changer de couleur pour une section : passer en relatif, emprunter des accords, ou moduler.',
    deep: 'Les outils du plus doux au plus fort : 1) changer de centre dans la même gamme (relatif), 2) accords empruntés au mode homonyme (♭VI, ♭VII, iv), 3) passage d’un mode à un autre sur la même tonique (dorien au couplet, éolien au refrain : une seule note change), 4) modulation (on change de tonalité, souvent d’un ton plus haut pour le dernier refrain).',
    fb: { kind: 'compare', tonic: 'D', a: 'dorian', b: 'aeolian', labels: 'iv' },
    fbNote: 'Dorien → éolien sur D : une note change (la 6), et toute l’ambiance bascule.',
    practice: 'Prends une grille de couplet et réécris-la pour le refrain avec un accord emprunté.',
    musical: 'Compare deux sections dans le Composition Studio : l’analyse liste les accords hors gamme.',
    gens: ['contrast', 'borrowed'], link: { label: 'Ouvrir le Composition Studio', href: '#/compo' }
  }),
  mk({
    id: 'm6-melody', title: 'Créer une mélodie', short: 'Notes d’accord sur les temps forts',
    simple: 'Une mélodie qui « colle » aux accords place des notes de l’accord sur les temps forts et utilise les autres notes de la gamme pour circuler entre elles.',
    deep: 'Principes : contour (une mélodie a une direction, un point culminant), mouvement conjoint (petits intervalles) ponctué de quelques sauts, répétition de motifs, notes de l’accord sur les temps forts, tensions (appoggiatures) placées exprès. Pour un chanteur-guitariste : compose la mélodie à la voix sur la grille en boucle, puis vérifie sur la guitare quelles notes tu as chantées.',
    fb: { kind: 'chord', root: 'C', type: 'maj', labels: 'note', scaleCtx: { tonic: 'C', scale: 'ionian' } },
    fbNote: 'Sur C : les notes en couleur sont stables sur les temps forts, les autres circulent.',
    practice: 'Sur une grille de 4 accords, écris une note longue par mesure, toujours une note de l’accord (de préférence la tierce). Puis relie-les par des notes de passage.',
    musical: 'Chante une mélodie sur une grille en boucle (Impro Studio, impro libre), enregistre-toi.',
    gens: ['melodyStrong'], link: { label: 'Ouvrir le Composition Studio', href: '#/compo' }
  }),
  mk({
    id: 'm6-solowriting', title: 'Écrire un solo', short: 'Un solo composé, comme une mélodie',
    simple: 'Les grands solos (Gilmour, Slash) sont souvent composés : on les chante, on les retient. Écrire un solo, c’est appliquer ce que tu sais de l’impro, mais en choisissant chaque phrase.',
    deep: 'Méthode : improvise 5 fois sur la grille en t’enregistrant, garde les meilleures phrases, ordonne-les selon la forme exposition → développement → sommet → conclusion, puis relie-les. Le solo doit pouvoir se chanter.',
    fb: { kind: 'scale', tonic: 'B', scale: 'aeolian', labels: 'iv' },
    fbNote: 'B mineur sur tout le manche : choisis un registre par partie du solo.',
    practice: 'Écris en tab un solo de 8 mesures sur une grille de ton Composition Studio.',
    musical: 'Enregistre ce solo par-dessus la grille (bouton enregistrer de l’Impro Studio).',
    gens: ['melodyStrong', 'multiChord'], link: { label: 'Ouvrir le Composition Studio', href: '#/compo' }
  }),
  mk({
    id: 'm6-song', title: 'Composer un morceau complet', short: 'Assembler, structurer, finir',
    simple: 'Un morceau, c’est des sections (intro, couplet, refrain, pont, solo, outro) agencées pour garder l’attention. Le plus dur n’est pas de commencer : c’est de finir.',
    deep: 'Structure courante : Intro – Couplet – Refrain – Couplet – Refrain – Pont – Solo – Refrain – Outro. Le pont apporte la nouveauté (autre centre, autre rythme) juste quand l’auditeur s’habitue. Fixe-toi une contrainte (une gamme, un tempo, 3 minutes) et termine un morceau imparfait plutôt que dix débuts parfaits.',
    fb: { kind: 'scale', tonic: 'E', scale: 'aeolian', labels: 'deg' },
    fbNote: 'Une gamme, plusieurs centres possibles : de quoi faire couplet, refrain et pont.',
    practice: 'Dans le Composition Studio, crée un morceau avec au moins 4 sections, une grille par section et une structure complète.',
    musical: 'Joue le morceau en entier, enregistre une idée audio de chaque section.',
    gens: ['progBuild', 'contrast'], link: { label: 'Ouvrir le Composition Studio', href: '#/compo' }
  })
];

export const M7 = [
  mk({ id: 'm7-intervals', title: 'Reconnaître les intervalles', short: 'L’oreille des distances',
    simple: 'Reconnaître un intervalle à l’oreille, c’est la base pour retrouver une mélodie sur le manche. On s’aide de morceaux connus qui commencent par cet intervalle.',
    deep: 'Commence par les intervalles très différents (tierce, quinte, octave), puis ajoute les autres. Écoute-les montants, descendants, puis joués ensemble. Chante-les : la voix est l’outil d’entraînement le plus rapide.',
    fb: { kind: 'interval', tonic: 'A', ivs: ['1', 'b3', '3', '4', '5'], labels: 'iv' }, fbNote: 'Chaque intervalle entendu a une forme sur le manche.',
    practice: 'Joue une note, chante une quinte au-dessus, vérifie sur la guitare. Puis une tierce majeure, une quarte.', musical: 'Ear Training → Intervalles, plusieurs séries courtes plutôt qu’une longue.',
    gens: ['earIntervals'], link: { label: 'Ouvrir l’Ear Training', href: '#/oreille' } }),
  mk({ id: 'm7-chords', title: 'Reconnaître les accords', short: 'Majeur, mineur, et le reste',
    simple: 'Majeur ou mineur, c’est la première chose à entendre. Ensuite : diminué, augmenté, sus, puis les septièmes.',
    deep: 'Écoute la tierce : chante l’accord arpégé et arrête-toi sur la 2e note. Les accords sus sonnent « en attente », le diminué serré, l’augmenté flottant. Pour les septièmes : maj7 = doux avec un frottement, 7 = tendu/bluesy, m7 = mineur souple.',
    fb: { kind: 'compareChords', root: 'A', a: 'maj', b: 'min' }, fbNote: 'Une seule note change entre majeur et mineur : c’est elle que l’oreille doit apprendre.',
    practice: 'Joue des accords au hasard les yeux fermés (ou demande à quelqu’un) et dis majeur/mineur.', musical: 'Ear Training → Accords majeurs/mineurs, Triades, Septièmes, Comparer.',
    gens: ['earChords', 'earTriads', 'earSevenths', 'earCompare'], link: { label: 'Ouvrir l’Ear Training', href: '#/oreille' } }),
  mk({ id: 'm7-melody', title: 'Reproduire une mélodie', short: 'Du son au manche',
    simple: 'Entendre une mélodie et la retrouver sur la guitare : c’est ce qui te permettra de relever des solos et de jouer ce que tu as dans la tête.',
    deep: 'Méthode : 1) chante, 2) trouve la première note (par essais), 3) pour chaque note suivante : monte ou descend ? de peu ou de beaucoup ? 4) vérifie. Les mélodies tournent presque toujours dans une gamme connue : sers-t’en pour éliminer des candidats.',
    fb: { kind: 'scale', tonic: 'G', scale: 'majPenta', labels: 'note' }, fbNote: 'Les mélodies de l’exercice restent dans une gamme connue, comme celle-ci.',
    practice: 'Choisis une mélodie que tu chantes souvent et retrouve-la sur la guitare, sans tab.', musical: 'Ear Training → Mélodie à reproduire.',
    gens: ['earMelody'], link: { label: 'Ouvrir l’Ear Training', href: '#/oreille' } }),
  mk({ id: 'm7-degrees', title: 'Identifier les degrés', short: 'Entendre une note par rapport à la tonique',
    simple: 'Chaque degré a une sensation propre par rapport à la tonique : le 1 repose, le 7 veut monter, le 5 attend. Entendre les degrés, c’est savoir où tu es dans la tonalité sans réfléchir.',
    deep: 'L’exercice installe la tonalité par une cadence I–IV–V–I, puis joue une note. Associe chaque degré à une sensation, et chante la descente vers la tonique : depuis le 6, tu chantes 6-5-4-3-2-1 ; le nombre de notes chantées donne le degré.',
    fb: { kind: 'scale', tonic: 'C', scale: 'ionian', labels: 'deg' }, fbNote: 'C majeur en degrés : la sensation de chaque chiffre est ce que l’oreille apprend.',
    practice: 'Joue un accord de G, puis une note au hasard de G majeur, et chante jusqu’à G pour trouver son degré.', musical: 'Ear Training → Degrés.',
    gens: ['earDegrees'], link: { label: 'Ouvrir l’Ear Training', href: '#/oreille' } }),
  mk({ id: 'm7-transcribe', title: 'Transcrire une phrase', short: 'Relever un plan à l’oreille',
    simple: 'Transcrire, c’est écrire ce que tu entends. Commence par des phrases courtes en penta : c’est comme ça que Gilmour, Slash et tous les autodidactes ont appris.',
    deep: 'Combine tout : la tonalité (quelle penta ?), la première note, le contour, les intervalles. Ralentis : les plans rapides sont des plans lents joués vite. Pour reconnaître le mode d’un morceau, écoute la tierce puis la note caractéristique.',
    fb: { kind: 'scale', tonic: 'A', scale: 'minPenta', labels: 'iv' }, fbNote: 'Les phrases à transcrire restent dans cette penta.',
    practice: 'Choisis un solo de Gilmour que tu aimes et relève les 4 premières notes à l’oreille, sans tab.', musical: 'Ear Training → Transcription et Modes.',
    gens: ['earTranscribe', 'earModes'], link: { label: 'Ouvrir l’Ear Training', href: '#/oreille' } })
];
