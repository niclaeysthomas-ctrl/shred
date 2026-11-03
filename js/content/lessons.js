/* ================================================================
   Le parcours : 7 modules, une notion = 7 temps
   1 simple · 2 en profondeur · 3 sur le manche · 4 exercice à la guitare
   5 exercice musical · 6 quiz vérifié (valide la notion) · 7 correction
   [[terme]] = mot du glossaire, cliquable.
   ================================================================ */
import { MODE_INFO } from './modes.js';
import { M4_REST, M5, M6, M7 } from './lessons2.js';
import { buildScale, MODE_IDS, CHORD_TYPES, spell } from '../theory.js';

const mk = o => ({ ready: true, ...o });

const M1 = [
  mk({
    id: 'm1-intervals', title: 'Les intervalles', short: 'La distance entre deux notes',
    simple: 'Un [[intervalle]] est une distance entre deux notes. Sur la guitare, c’est une forme : la tierce majeure est toujours « une corde plus haut, une case en arrière », où que tu sois. Apprendre les intervalles, c’est arrêter de penser en noms de notes et commencer à voir des distances.',
    deep: `On mesure les intervalles en [[demi-ton|demi-tons]] (1 case = 1 demi-ton). Les douze à connaître :
<ul><li><b>♭2</b> (1) · <b>2</b> (2) — les secondes : notes voisines.</li>
<li><b>♭3</b> (3) · <b>3</b> (4) — les [[tierce|tierces]] : elles décident mineur ou majeur.</li>
<li><b>4</b> (5) · <b>♭5</b> (6, le [[triton]]) · <b>5</b> (7) — quarte, triton, [[quinte]].</li>
<li><b>♭6</b> (8) · <b>6</b> (9) · <b>♭7</b> (10) · <b>7</b> (11) — sixtes et [[septième|septièmes]].</li></ul>
Le nom (« tierce ») compte les <i>lettres</i> : de C à E il y a 3 lettres (C D E), donc c’est une tierce ; 4 demi-tons, donc majeure. C’est pour ça que C–E et C–F♭ ne s’écrivent pas pareil, même s’ils sonnent pareil.
<br><br>Piège guitare : entre la corde de Sol et celle de Si, l’accordage est décalé d’un demi-ton. Toute forme qui traverse ces deux cordes se décale d’une case.`,
    fb: { kind: 'interval', tonic: 'A', ivs: ['1', 'b3', '3', '5', 'b7'], labels: 'iv' },
    fbNote: 'Autour du A de la case 5 : la ♭3 et la 3 (une case d’écart), la 5 (une corde plus haut, deux cases plus loin) et la ♭7.',
    practice: 'Choisis une note sur la corde de Mi grave. Joue sa quinte, sa tierce majeure, sa tierce mineure, sa ♭7, en disant à voix haute le nom de l’intervalle. Recommence avec une fondamentale sur la corde de La. 5 minutes, sans regarder l’écran.',
    musical: 'Improvise 2 minutes sur une seule corde en n’utilisant que la fondamentale, la ♭3 et la 5. Puis remplace la ♭3 par la 3 : écoute le passage du sombre au lumineux. Ce que tu entends, c’est un intervalle.',
    gens: ['intervals'], link: { label: 'Voir les intervalles sur tout le manche', href: '#/labo/manche?tonic=A&scale=ionian&labels=iv' }
  }),
  mk({
    id: 'm1-major', title: 'La gamme majeure', short: 'La référence de tout le reste',
    simple: 'La gamme majeure est la règle de mesure de toute la théorie : les modes, les accords, les chiffres (♭3, ♯4…) sont tous définis par rapport à elle. Elle se construit avec une formule de tons et demi-tons : <b>T T ½T T T T ½T</b>.',
    deep: `Partant de n’importe quelle [[tonique]], on avance : ton, ton, demi-ton, ton, ton, ton, demi-ton. On retombe sur la tonique à l’octave.
<br><br>Règle d’écriture : <b>une lettre par degré</b>. F majeur = F G A B♭ C D E, et non A♯ (sinon on aurait deux A et pas de B). C’est cette règle qui donne les bons noms dans toute l’app.
<br><br>Les notes sont numérotées : 1 2 3 4 5 6 7. Ces [[degré|degrés]] servent ensuite à décrire tout le reste : « la ♭3 » veut dire « le 3e degré de la gamme majeure, abaissé d’un demi-ton ».`,
    fb: { kind: 'scale', tonic: 'G', scale: 'ionian', labels: 'deg' },
    fbNote: 'G majeur avec les degrés. Remarque les demi-tons entre 3-4 et 7-1 : ce sont les seuls endroits où deux notes sont à une case d’écart sur la même corde.',
    practice: 'Joue G majeur sur une seule corde (la corde de Sol) en suivant la formule T T ½T T T T ½T, de la case 0 à 12. Puis C majeur sur la corde de La, à partir de la case 3. Tu construis la gamme au lieu de la réciter.',
    musical: 'Sur la corde de Si, invente une mélodie de 4 notes en G majeur qui finit sur G. Puis la même qui finit sur B (le 3) : elle sonne « suspendue ». Une gamme, c’est des notes de repos et des notes de mouvement.',
    gens: ['majorScale'], link: { label: 'Explorer les gammes majeures', href: '#/labo/gammes?tonic=G&scale=ionian' }
  }),
  mk({
    id: 'm1-fretboard', title: 'Les notes sur le manche', short: 'Situer n’importe quelle note',
    simple: 'Tu ne peux pas viser une note que tu ne sais pas situer. Connaître les notes des cordes de Mi et de La suffit pour démarrer : ce sont elles qui portent la fondamentale de presque tous les accords barrés et des positions de gammes.',
    deep: `Trois repères rendent le manche lisible :
<ul><li><b>Les notes naturelles</b> (sans altération) sont à 2 cases d’écart, sauf <b>E–F</b> et <b>B–C</b> qui sont collées (1 case).</li>
<li><b>L’octave</b> : 2 cordes plus haut, 2 cases plus loin (3 cases quand on traverse la corde de Si). Case 12 = la note à vide.</li>
<li><b>Les repères du manche</b> (cases 3, 5, 7, 9, 12) : sur la corde de Mi grave, ce sont G, A, B, C♯, E.</li></ul>
Les notes « noires » ont deux noms ([[enharmonie]]) : F♯ = G♭. On choisit selon la tonalité.`,
    fb: { kind: 'naturals' },
    fbNote: 'Toutes les notes naturelles. Les paires collées E–F et B–C sautent aux yeux sur chaque corde.',
    practice: 'Note du jour : choisis-en une (par ex. C) et trouve-la sur les 6 cordes, de la plus grave à la plus aiguë, en moins de 30 secondes. Change de note chaque jour.',
    musical: 'Joue une mélodie simple que tu connais (un riff, un thème) et nomme chaque note à voix haute en la jouant. Si tu bloques, c’est la case à travailler.',
    gens: ['fretNotes'], link: { label: 'Le manche interactif', href: '#/labo/manche?view=notes' }
  }),
  mk({
    id: 'm1-keys', title: 'Les tonalités', short: 'La maison d’un morceau',
    simple: 'Une [[tonalité]], c’est une tonique + une gamme : « E mineur », « G majeur ». Savoir la tonalité d’un morceau te dit immédiatement quelles notes jouer en impro, et quelle note sonnera comme un point final.',
    deep: `Chaque gamme majeure a un nombre fixe d’[[altération|altérations]] : G majeur a 1 dièse (F♯), D majeur 2 (F♯ C♯), F majeur 1 bémol (B♭)…
<br><br>Chaque tonalité majeure a un [[relatif]] mineur avec <b>exactement les mêmes notes</b> : il commence sur le 6e degré. C majeur ↔ A mineur ; G majeur ↔ E mineur. Sur le manche : le relatif mineur est 3 cases plus bas.
<br><br>Pour trouver la tonalité d’un morceau à l’oreille : quelle note (ou quel accord) donne l’impression que « c’est fini » ? C’est la tonique. Ensuite : majeur ou mineur ?`,
    fb: { kind: 'scale', tonic: 'E', scale: 'aeolian', labels: 'note', compareWith: 'G' },
    fbNote: 'E mineur : exactement les notes de G majeur, avec E comme maison.',
    practice: 'Pour 3 morceaux que tu joues (ou chantes), écris la tonalité. Vérifie-la en jouant la gamme dessus : aucune note ne doit « frotter » sur les accords.',
    musical: 'Joue G majeur, puis E mineur, avec les mêmes notes, sur une [[vamp]] différente (G puis Em). Même gamme, émotion opposée : c’est la tonique qui décide.',
    gens: ['keys'], link: { label: 'Gammes relatives dans l’explorateur', href: '#/labo/gammes?tonic=E&scale=aeolian' }
  }),
  mk({
    id: 'm1-degrees', title: 'Les degrés harmoniques', short: 'Penser en chiffres, pas en noms',
    simple: 'Les musiciens disent « I – IV – V » au lieu de « G – C – D ». Penser en [[degré|degrés]], c’est comprendre une grille une fois pour toutes, puis la jouer dans toutes les tonalités.',
    deep: `On numérote les notes de la gamme (1 à 7) et on écrit en <b>chiffres romains</b> les accords construits dessus : majuscule pour un accord majeur (IV), minuscule pour un mineur (ii), ° pour un diminué (vii°).
<br><br>En G majeur : I = G, ii = Am, iii = Bm, IV = C, V = D, vi = Em, vii° = F♯°. En A majeur, le même I – IV – V devient A – D – E.
<br><br>Un chiffre altéré (♭VII, ♭VI) signale un accord emprunté à une autre couleur : le ♭VII du rock (D – C – G en D) vient du mode mixolydien.`,
    fb: { kind: 'scale', tonic: 'C', scale: 'ionian', labels: 'deg' },
    fbNote: 'C majeur, en degrés. Les accords du module 2 seront construits sur chacun de ces chiffres.',
    practice: 'Joue I – vi – IV – V en G, puis en A, puis en D, sans écrire les accords : calcule-les à partir des degrés.',
    musical: 'Prends un morceau à 3-4 accords que tu connais et réécris-le en chiffres romains. Transpose-le ensuite dans une tonalité qui va mieux à ta voix.',
    gens: ['degrees'], link: { label: 'Harmoniser une gamme', href: '#/labo/accords?view=harmo&tonic=G&scale=ionian' }
  }),
  mk({
    id: 'm1-pentas', title: 'Pentatoniques majeure et mineure', short: 'Ce que tu connais déjà, compris',
    simple: 'Tu improvises déjà en [[pentatonique]]. L’objectif ici : savoir <b>quelles notes</b> tu joues (leurs degrés), pour ensuite ajouter les deux notes qui en font une gamme complète — et un mode.',
    deep: `<b>Penta mineure</b> = 1 ♭3 4 5 ♭7. <b>Penta majeure</b> = 1 2 3 5 6. Ce sont les mêmes 5 notes vues depuis deux toniques ([[relatif|relatives]]) : A penta mineure = C penta majeure.
<br><br>Elles n’ont aucun demi-ton : aucune note ne « frotte », c’est pour ça qu’elles marchent partout… et qu’elles finissent par sonner pareil. Les gammes à 7 notes ajoutent deux notes, et ce sont justement ces deux notes qui donnent la couleur :
<ul><li>penta mineure + 2 + ♭6 = éolien (mineur naturel)</li><li>penta mineure + 2 + 6 = dorien</li><li>penta majeure + 4 + 7 = ionien (majeur)</li><li>penta majeure + 4 + ♭7 = mixolydien</li></ul>
La gamme blues ajoute la ♭5 ([[chromatique|note de passage]]).`,
    fb: { kind: 'scale', tonic: 'A', scale: 'minPenta', labels: 'iv' },
    fbNote: 'A penta mineure en intervalles. Repère où tombent la ♭3 et la ♭7 dans tes boîtes habituelles : ce sont tes premières notes cibles.',
    practice: 'Dans ta boîte 1 de A penta mineure, joue uniquement les toniques, puis uniquement les ♭3, puis les 5, en les nommant. Tu connais la forme : il faut maintenant connaître le rôle de chaque note.',
    musical: 'Sur une boucle en A mineur, improvise en terminant chaque phrase sur la ♭3 (C). Puis sur une boucle en A majeur, termine sur la 3 (C♯) avec la penta majeure.',
    gens: ['pentas'], link: { label: 'Comparer penta et gamme complète', href: '#/labo/gammes?tonic=A&scale=minPenta&cmp=aeolian' }
  })
];

const M2 = [
  mk({
    id: 'm2-triads', title: 'Construire les triades', short: 'Empiler des tierces',
    simple: 'Un [[accord]] se construit en empilant des [[tierce|tierces]] : on prend une note sur deux de la gamme. 1 – 3 – 5 = une [[triade]]. C’est tout le secret des accords.',
    deep: `Dans C majeur, à partir de C : C (1), on saute D, E (3), on saute F, G (5) → C E G.
<br><br>Les tierces peuvent être majeures (4 demi-tons) ou mineures (3). Leur combinaison donne la qualité :
<ul><li>majeure + mineure = <b>triade majeure</b> (1 3 5)</li><li>mineure + majeure = <b>triade mineure</b> (1 ♭3 5)</li><li>mineure + mineure = <b>diminuée</b> (1 ♭3 ♭5)</li><li>majeure + majeure = <b>augmentée</b> (1 3 ♯5)</li></ul>
Sur la guitare, un accord ouvert ou barré contient ces 3 notes répétées à plusieurs octaves. La triade « pure », sur 3 cordes, est plus légère et se place partout.`,
    fb: { kind: 'chord', root: 'C', type: 'maj', labels: 'iv' },
    fbNote: 'Toutes les notes de C majeur sur le manche. Chaque forme d’accord que tu connais est une façon d’en attraper trois ou plus.',
    practice: 'Joue ton barré de A (forme de E, case 5) et nomme chaque note de grave à aigu avec son intervalle : 1 5 1 3 5 1. Fais pareil avec Am : où est passée la tierce ?',
    musical: 'Joue une grille (G – Em – C – D) uniquement avec des triades sur les cordes 3-2-1. Le son devient clair, aérien : c’est le son des guitares rythmiques modernes.',
    gens: ['triads'], link: { label: 'Triades dans le Chord Lab', href: '#/labo/accords?root=C&type=maj&view=triads' }
  }),
  mk({
    id: 'm2-qualities', title: 'Majeur, mineur, diminué', short: 'Ce qui fait la couleur',
    simple: 'Majeur et mineur ne diffèrent que d’une note : la tierce. Diminué abaisse en plus la quinte. Sentir ces trois couleurs, c’est la base de toute l’oreille harmonique.',
    deep: `La [[quinte]] juste (7 demi-tons) est stable et neutre ; la tierce donne l’émotion. C → Cm : seul E devient E♭.
<br><br>L’accord <b>diminué</b> (1 ♭3 ♭5) contient un [[triton]] entre sa fondamentale et sa quinte : il est instable, il « veut » aller ailleurs. On l’utilise comme passage, rarement comme repos.
<br><br>Le <b>power chord</b> (1 5) n’a pas de tierce : il n’est ni majeur ni mineur. C’est pour ça que le grunge peut enchaîner des power chords sans se soucier de la gamme… et que c’est la mélodie (ou la voix) qui décide de la couleur.`,
    fb: { kind: 'compareChords', root: 'A', a: 'maj', b: 'min' },
    fbNote: 'A majeur contre A mineur : une seule note change sur tout le manche.',
    practice: 'Barré de A majeur → A mineur → retour, en ne bougeant qu’un doigt. Fais-le sur les deux formes (case 5 corde de Mi, case 0/12 corde de La).',
    musical: 'Sur un power chord de E tenu, chante ou joue G (♭3) puis G♯ (3). Le même accord devient mineur puis majeur : c’est la mélodie qui colore un power chord.',
    gens: ['qualities', 'triads'], link: { label: 'Comparer dans le Chord Lab', href: '#/labo/accords?root=A&type=min' }
  }),
  mk({
    id: 'm2-sevenths', title: 'Les accords de septième', short: 'Une tierce de plus',
    simple: 'En empilant une tierce de plus (1 3 5 7), on obtient un accord à 4 sons. La [[septième]] ajoute de la profondeur (maj7, m7) ou de la tension (7).',
    deep: `Quatre accords de septième sortent de la gamme majeure :
<ul><li><b>maj7</b> (1 3 5 7) : majeur, rêveur, doux. Cmaj7 = C E G B.</li>
<li><b>m7</b> (1 ♭3 5 ♭7) : mineur, souple, moins triste. Am7 = A C E G.</li>
<li><b>7</b> (1 3 5 ♭7) : « dominante ». Majeur avec une ♭7 : bluesy, tendu. G7 = G B D F.</li>
<li><b>m7♭5</b> (1 ♭3 ♭5 ♭7) : demi-diminué, sombre et instable. Bm7♭5 = B D F A.</li></ul>
Attention aux noms : « 7 » tout seul = septième MINEURE ajoutée à un accord majeur. « maj7 » = septième majeure.`,
    fb: { kind: 'chord', root: 'G', type: 'dom7', labels: 'iv' },
    fbNote: 'G7 : la 3 (B) et la ♭7 (F) forment un triton — la source de la tension de la dominante.',
    practice: 'Joue Amaj7, Am7, A7 l’un après l’autre (le Chord Lab te donne des doigtés) et nomme la note qui change à chaque fois.',
    musical: 'Joue un blues en A uniquement avec des accords de 7 (A7, D7, E7). Puis remplace A7 par Am7 : écoute le blues devenir mineur.',
    gens: ['sevenths'], link: { label: 'Ouvrir le Chord Lab', href: '#/labo/accords?root=G&type=dom7' }
  }),
  mk({
    id: 'm2-harmonization', title: 'Harmoniser la gamme majeure', short: 'Les 7 accords d’une tonalité',
    simple: 'Si on construit un accord sur chaque note de la gamme, en n’utilisant que les notes de cette gamme, on obtient les 7 accords [[diatonique|diatoniques]] de la tonalité. C’est la boîte à outils de presque toutes les chansons.',
    deep: `En empilant des tierces dans C majeur : C E G (C), D F A (Dm), E G B (Em), F A C (F), G B D (G), A C E (Am), B D F (B°).
<br><br>Le schéma ne change jamais : <b>I ii iii IV V vi vii°</b> (et en septièmes : Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7).
<br><br>Pourquoi ces qualités ? Parce que les demi-tons de la gamme (3-4 et 7-1) tombent à des endroits différents dans chaque empilement. Sur D : D–F fait 3 demi-tons (tierce mineure) car il contient le demi-ton E–F. Sur B : B–D mineure et D–F mineure → diminué.`,
    fb: { kind: 'scale', tonic: 'C', scale: 'ionian', labels: 'deg' },
    fbNote: 'Chaque accord est fait de notes de cette gamme. L’onglet « Harmoniser » du Chord Lab les construit pour n’importe quelle tonalité.',
    practice: 'Dans G majeur, joue les 7 accords dans l’ordre (G Am Bm C D Em F♯°) en disant leur chiffre. Puis dans D, puis dans A.',
    musical: 'Compose une grille de 4 accords pris dans G majeur, joue-la en boucle, et improvise dessus avec la gamme de G majeur : tout est « dans la gamme ».',
    gens: ['harmonization'], link: { label: 'Harmoniser dans le Chord Lab', href: '#/labo/accords?view=harmo&tonic=C&scale=ionian' }
  }),
  mk({
    id: 'm2-functions', title: 'Les fonctions harmoniques', short: 'Repos, départ, tension',
    simple: 'Chaque accord joue un rôle : la Tonique est la maison, la Sous-dominante s’en éloigne, la Dominante crée une [[tension]] qui veut revenir à la maison. Ce va-et-vient, c’est ce qui fait avancer une chanson.',
    deep: `<ul><li><b>Tonique (T)</b> : I, et ses substituts iii et vi (ils partagent 2 notes avec I).</li>
<li><b>Sous-dominante (SD)</b> : IV et ii. On quitte la maison sans urgence.</li>
<li><b>Dominante (D)</b> : V (et vii°). Il contient la sensible (7e degré, à un demi-ton de la tonique) : l’oreille attend le retour sur I.</li></ul>
La [[cadence]] V → I est le « point final ». IV → I est plus doux (« amen »). En rock, le ♭VII → I remplace souvent le V → I : la résolution est moins scolaire, plus terrienne.
<br><br>Pour l’impro : sur la dominante, tu peux créer de la tension ; à l’arrivée sur I, résous sur une note stable (1, 3, 5).`,
    fb: { kind: 'chord', root: 'D', type: 'dom7', labels: 'iv', scaleCtx: { tonic: 'G', scale: 'ionian' } },
    fbNote: 'D7, dominante de G : son F♯ (3) veut monter vers G, son C (♭7) veut descendre vers B.',
    practice: 'Joue I – IV – V – I dans 3 tonalités. Puis arrête-toi sur le V et écoute le manque : c’est la fonction de dominante.',
    musical: 'Écris une grille de 8 mesures avec une fin de phrase sur V (« virgule ») à la 4e mesure et sur I (« point ») à la 8e.',
    gens: ['functions'], link: { label: 'Les fonctions dans le Chord Lab', href: '#/labo/accords?view=harmo&tonic=G&scale=ionian' }
  }),
  mk({
    id: 'm2-inversions', title: 'Les renversements', short: 'Changer la basse',
    simple: 'Un [[renversement]] garde les mêmes notes mais en met une autre à la basse. C/E = accord de C avec E en bas. Ça change la sensation sans changer l’accord, et ça permet des lignes de basse qui descendent ou montent doucement.',
    deep: `<ul><li><b>État fondamental</b> : la fondamentale en bas (C E G).</li><li><b>1er renversement</b> : la tierce en bas (E G C) → noté C/E. Plus léger, moins « posé ».</li><li><b>2e renversement</b> : la quinte en bas (G C E) → C/G. Instable, souvent de passage.</li><li>Un accord de septième a un <b>3e renversement</b> (septième en bas) : G7/F.</li></ul>
Sur la guitare, les triades sur 3 cordes voisines existent dans les 3 états, à 3 endroits du manche : c’est le moyen le plus simple de jouer un accord partout.`,
    fb: { kind: 'triads', root: 'G', type: 'maj', set: 0 },
    fbNote: 'G majeur en triades sur les cordes aiguës : les 3 renversements se suivent en montant le manche.',
    practice: 'Joue les 3 renversements de G sur les cordes 3-2-1 en montant, puis de C, puis de D. Dis à chaque fois quelle note est en bas.',
    musical: 'Joue C – G/B – Am – G : la basse descend C – B – A – G. Ligne de basse descendante classique (on l’entend dans énormément de ballades rock).',
    gens: ['inversions'], link: { label: 'Renversements dans le Chord Lab', href: '#/labo/accords?root=G&type=maj&view=triads' }
  }),
  mk({
    id: 'm2-voiceleading', title: 'Le voice leading', short: 'Enchaîner sans sauter',
    simple: 'Le [[voice leading]] consiste à passer d’un accord au suivant en bougeant le moins possible : on garde les notes communes, on déplace les autres d’une ou deux cases. Les enchaînements deviennent fluides et ta main reste au même endroit du manche.',
    deep: `Deux accords voisins dans une tonalité partagent souvent des notes : C (C E G) et Am (A C E) ont C et E en commun. Pour passer de l’un à l’autre, seul G descend vers A.
<br><br>La règle d’or vient de la dominante : dans G7 → C, la 3 de G7 (B) monte d’un demi-ton vers C, et sa ♭7 (F) descend d’un demi-ton vers E. Ces [[notes guides]] (3 et 7) dessinent une ligne mélodique cachée dans les accords.
<br><br>En impro, suivre ces notes guides d’un accord à l’autre, c’est jouer « les changements » au lieu de jouer une gamme par-dessus.`,
    fb: { kind: 'chord', root: 'A', type: 'min', labels: 'note', overlay: { root: 'C', type: 'maj' } },
    fbNote: 'Am et C : les notes communes (C, E) restent en place ; seule une note bouge.',
    practice: 'Joue G – Em – C – D en triades sur les cordes 3-2-1 en restant entre les cases 3 et 8. Cherche à chaque changement le chemin le plus court.',
    musical: 'Sur G7 → Cmaj7 en boucle, joue uniquement B → C puis F → E, en rythme. Tu entends la résolution sans jouer d’accord.',
    gens: ['voiceLeading'], link: { label: 'Triades et voicings', href: '#/labo/accords?root=C&type=maj&view=triads' }
  })
];

/* Module 3 : une notion par mode, générée à partir des données des modes */
const M3 = MODE_IDS.map(id => {
  const m = MODE_INFO[id];
  const ex = { ionian: 'C', dorian: 'D', phrygian: 'E', lydian: 'F', mixolydian: 'G', aeolian: 'A', locrian: 'B' }[id];
  const sc = buildScale(ex, id);
  const charNotes = m.char.map(c => sc.find(n => n.iv === c)).filter(Boolean);
  return mk({
    id: 'm3-' + id, title: m.name, short: m.color.split('.')[0],
    simple: `${m.color} Construction : <b>${sc.map(n => n.iv.replace('b', '♭').replace('#', '♯')).join(' ')}</b>. C’est le ${m.degree}e [[mode]] de la gamme majeure : ${ex} ${m.name.toLowerCase()} utilise les notes de C majeur, mais avec ${ex} comme [[tonique]].`,
    deep: `${m.why}
<br><br><b>[[note caractéristique|Note(s) caractéristique(s)]]</b> : ${m.char.map(c => c.replace('b', '♭').replace('#', '♯')).join(' et ')} (en ${ex} : ${charNotes.map(n => '{{' + n.name + '}}').join(', ')}).
<br><b>Accord associé</b> : ${m.chordTxt} (${ex}${CHORD_TYPES[m.chord].sym}).
<br><b>Comparé à son voisin</b> (${MODE_INFO[m.vs].name.toLowerCase()}) : regarde l’onglet « Comparer » sur le manche.
<br><b>Notes à cibler</b> : ${m.targets}
<br><b>Contextes</b> : ${m.contexts}
<br><b>Depuis tes pentas</b> : ${m.pentaLink}
<br><br>Un mode n’est pas une « position » : ${ex} ${m.name.toLowerCase()} et C majeur ont les mêmes doigtés, mais ils ne sonnent comme ${m.name.toLowerCase()} que si l’accompagnement fait entendre ${ex} comme la maison (un accord de ${ex}${CHORD_TYPES[m.chord].sym} tenu, une basse sur ${ex}).`,
    fb: { kind: 'compare', tonic: 'A', a: id, b: m.vs, labels: 'iv' },
    fbNote: `A ${m.name.toLowerCase()} comparé à A ${MODE_INFO[m.vs].name.toLowerCase()} : les notes mises en évidence sont celles qui changent la couleur.`,
    practice: `Sur la corde de La, joue A ${m.name.toLowerCase()} de la tonique à l’octave (une seule corde = tu vois les intervalles). Puis dans une zone de 5 cases. Arrête-toi longuement sur la ${m.char[0].replace('b', '♭').replace('#', '♯')}.`,
    musical: `Lance l’exercice « Modes » de l’Impro Studio sur ${m.name.toLowerCase()} : la boucle d’accords fait entendre le mode, à toi de faire sonner la note caractéristique.`,
    gens: ['mode_' + id], link: { label: `${m.name} dans l’explorateur`, href: `#/labo/gammes?tonic=A&scale=${id}&cmp=${m.vs}` },
    impro: { exercise: 'modes', mode: id }
  });
});
M3.push(mk({
  id: 'm3-review', title: 'Les 7 modes ensemble', short: 'Les reconnaître et les comparer',
  simple: 'Les 7 modes rangés du plus lumineux au plus sombre : <b>lydien → ionien → mixolydien → dorien → éolien → phrygien → locrien</b>. À chaque pas, une seule note descend d’un demi-ton.',
  deep: `Sur la même tonique (A), en partant du lydien : on abaisse la ♯4 → ionien ; puis la 7 → mixolydien ; puis la 3 → dorien ; puis la 6 → éolien ; puis la 2 → phrygien ; puis la 5 → locrien.
<br><br>Retenir cette échelle donne la note caractéristique de chaque mode : c’est la note qui le sépare de son voisin plus sombre.
<br><br>Deux familles : majeurs (lydien, ionien, mixolydien : tierce majeure) et mineurs (dorien, éolien, phrygien : ♭3). Le locrien est à part (♭5).`,
  fb: { kind: 'compare', tonic: 'A', a: 'dorian', b: 'mixolydian', labels: 'iv' },
  fbNote: 'Dorien contre mixolydien : une seule note change (la tierce). Ils ont la même gamme parente que l’éolien… à un mode près.',
  practice: 'Sur une note tenue de A (corde à vide), joue les 7 modes de A l’un après l’autre, du plus lumineux au plus sombre.',
  musical: 'Dans l’Impro Studio, enchaîne l’exercice « Modes » sur dorien puis éolien sur la même tonique : écoute la différence d’une seule note.',
  gens: ['modesAll'], link: { label: 'Comparer deux modes', href: '#/labo/gammes?tonic=A&scale=dorian&cmp=aeolian' }
}));

const M4 = [
  mk({
    id: 'm4-targets', title: 'Cibler les notes des accords', short: 'Faire entendre les changements',
    simple: 'Au lieu de jouer « la gamme » sur toute la grille, tu choisis à l’avance une [[note cible]] dans chaque accord — sa tierce surtout — et tu fais atterrir tes phrases dessus. C’est ce qui fait qu’un solo raconte la grille.',
    deep: `Hiérarchie des cibles sur un accord : <b>3</b> (définit la couleur) &gt; <b>7</b> (la profondeur) &gt; <b>1</b> et <b>5</b> (stables mais neutres).
<br><br>Méthode en 4 étapes, celle de l’exercice « Notes cibles » de l’Impro Studio :
<ol><li>Finir chaque phrase sur la fondamentale de l’accord du moment.</li><li>Finir sur n’importe quelle note de l’accord.</li><li>Finir sur la tierce.</li><li>Relier la tierce (ou la 7) d’un accord à celle du suivant ([[notes guides]]).</li></ol>
Astuce : la meilleure cible d’un changement d’accord est souvent la note la plus proche de celle où tu es déjà.`,
    fb: { kind: 'chord', root: 'D', type: 'dom7', labels: 'iv', scaleCtx: { tonic: 'A', scale: 'minPenta' } },
    fbNote: 'D7 dans un blues en A : sa tierce F♯ n’est pas dans la penta mineure de A. C’est justement la cible qui fait « entendre » le changement.',
    practice: 'Dans une seule position, trouve la tierce de chacun des accords de ta grille. Joue-les en rythme, une par mesure, avant d’improviser autour.',
    musical: 'Lance l’exercice « Notes cibles » de l’Impro Studio, niveau 1 puis 2.',
    gens: ['targets'], impro: { exercise: 'targets' }
  }),
  ...M4_REST
];
const soon = (prefix, titles) => titles.map((t, i) => ({ id: prefix + i, title: t, ready: false }));

export const MODULES = [
  { id: 'm1', n: 1, title: 'Les fondamentaux et le manche', when: 'Mois 1', goal: 'Voir des distances, plus des formes.', notions: M1 },
  { id: 'm2', n: 2, title: 'Harmonie et accords', when: 'Mois 2', goal: 'Comprendre d’où viennent les accords et pourquoi ils s’enchaînent.', notions: M2 },
  { id: 'm3', n: 3, title: 'Les modes', when: 'Mois 3', goal: 'Sept couleurs, une même gamme : savoir laquelle faire sonner, et comment.', notions: M3 },
  { id: 'm4', n: 4, title: 'Improvisation', when: 'Mois 4', goal: 'Suivre les accords, développer une idée, construire un solo.', notions: M4 },
  { id: 'm5', n: 5, title: 'Technique', when: 'Mois 5 (et en continu)', goal: 'Propreté avant vitesse, médiator en priorité.', notions: M5 },
  { id: 'm6', n: 6, title: 'Composition et créativité', when: 'Mois 6', goal: 'Passer de l’impro au morceau.', notions: M6 }
];

export const ALL_NOTIONS = MODULES.flatMap(m => m.notions.map(n => ({ ...n, module: m.id })));
export const notionById = id => ALL_NOTIONS.find(n => n.id === id);
export const READY_NOTIONS = ALL_NOTIONS.filter(n => n.ready);
export const exampleSpell = spell;
