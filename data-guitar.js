// SHRED — données d'entraînement guitare (intermédiaire → expert)
// Les BPM s'entendent au métronome : la figure rythmique est précisée dans chaque consigne.
// Paliers : [Propre, Solide, Rapide, Expert]. bpm:null = exercice de justesse/contrôle (auto-évaluation 1-4).

const PALIERS=["Propre","Solide","Rapide","Expert"];

// Échauffement guidé — à faire AVANT toute séance rapide (tendinite = fin de partie)
const WARMUP=[
{s:60, name:"Mains ouvertes/fermées", txt:"Sans guitare : ouvre et ferme les poings lentement, puis secoue les mains. Étire chaque doigt vers l'arrière en douceur. Le sang doit arriver avant les cordes."},
{s:90, name:"Chromatique 1-2-3-4 lente", txt:"Métronome à 60, une corde après l'autre, doubles croches. Aucune vitesse : c'est un réveil articulaire, pas un exercice. Doigts qui restent posés."},
{s:60, name:"Étirements d'écart", txt:"Doigts 1 et 4 sur la même corde, écarte-les progressivement (case 5 à 9, puis 5 à 10...). Jamais dans la douleur — juste l'étirement. Les deux mains."},
{s:60, name:"Spider walk", txt:"1-3 puis 2-4 en alternance sur cordes adjacentes (araignée). Coordination des deux mains à froid, métronome à 70. Monte et descends le manche."},
{s:30, name:"Bends doux", txt:"Quelques bends d'un ton sur la corde G, sans forcer, pour réveiller poignet et tendons avant le vrai travail. Vérifie la justesse au passage."}
];

// Backing tracks — quoi chercher sur YouTube (pas de lien qui casse : des requêtes qui marchent toujours)
const BACKING=[
{key:"Am", label:"Am — le point de départ", search:"backing track A minor 70 bpm slow", tip:"Ta box 1 (case 5) sonne juste sans réfléchir. Idéal pour travailler bends et vibrato sans pression harmonique."},
{key:"Am blues", label:"Blues en La", search:"A blues backing track slow shuffle", tip:"Penta mineure de La sur la grille I-IV-V. Ajoute la blue note (case 6 corde A) une fois par phrase, jamais plus."},
{key:"Am-F-C-G", label:"La grille des target notes", search:"Am F C G backing track guitar", tip:"LE terrain des target notes : sur chaque accord, atterris sur une note de l'accord. Am→La, F→Fa/La/Do, C→Do/Mi/Sol, G→Sol/Si/Ré."},
{key:"Am éolien", label:"Éolien — drone de La", search:"A aeolian backing track OR A minor drone", tip:"Ton chantier actuel. Joue la penta, AJOUTE la 2 (Si) et la b6 (Fa), écoute la couleur que ces 2 notes apportent."},
{key:"E blues", label:"Blues en Mi (rapide)", search:"E blues backing track fast", tip:"Quand la penta de La est solide, transpose : box 1 en case 12. Le même vocabulaire, une nouvelle tonalité — c'est comme ça qu'on possède vraiment une gamme."},
{key:"Dorien", label:"Dorien — le pas d'après", search:"D dorian funk backing track", tip:"Éolien avec la 6 majeure. Sur ce backing, entends la différence (funky/jazzy vs sombre). Le solo d'Another Brick in the Wall vit ici."}
];

const TMODS=[
 {id:"pick", name:"Aller-retour", icon:"⚡", desc:"La main droite est le moteur. Précision d'abord, la vitesse est un sous-produit."},
 {id:"leg",  name:"Legato (hammer / pull)", icon:"🌊", desc:"Le son lié et la force des doigts faibles. Chaque note doit sonner AUSSI fort sans médiator."},
 {id:"bend", name:"Bends & vibrato", icon:"🎯", desc:"Ce qui sépare un guitariste d'un joueur de gammes. La justesse ne se négocie pas."},
 {id:"slide",name:"Slides & shifts", icon:"🛝", desc:"Sortir des boxes : le manche devient UN territoire, pas cinq cages."},
 {id:"ryth", name:"Rythmique & muting", icon:"🥁", desc:"90 % du temps de jeu réel. Palm mute, ghost notes, endurance du poignet."},
 {id:"sweep",name:"Sweep picking", icon:"🌀", desc:"Le geste emblématique du shred. Lent et parfait avant tout — un sweep sale ne s'entend que trop."},
 {id:"tap",  name:"Tapping", icon:"👆", desc:"Le legato à deux mains. Propreté = étouffer tout ce qui ne joue pas."}
];

const TEXOS=[
// ============ ALLER-RETOUR ============
{id:"p1", mod:"pick", tier:1, name:"Chromatique 1-2-3-4",
tab:`e|-------------------------1-2-3-4-|
B|---------------------1-2-3-4-----|
G|-----------------1-2-3-4---------|
D|-------------1-2-3-4-------------|
A|---------1-2-3-4-----------------|
E|-1-2-3-4-------------------------|`,
consigne:"Doubles croches, aller-retour STRICT (bas-haut-bas-haut, même en changeant de corde). Un doigt par case, les doigts restent posés le plus longtemps possible. Monte puis descends, sans t'arrêter au sommet.",
bpm:[80,100,120,140],
crit:"Le palier est atteint quand 4 allers-retours complets passent sans note étouffée ni coup de médiator raté."},
{id:"p2", mod:"pick", tier:2, name:"Penta box 1 en doubles",
tab:`e|-------------------5-8-|
B|---------------5-8-----|
G|-----------5-7---------|
D|-------5-7-------------|
A|---5-7-----------------|
E|-5-8-------------------|`,
consigne:"Ta penta mineure de La, box 1, en doubles croches AR strict, montée-descente en boucle. Le piège : les changements de corde après un nombre impair de notes — le médiator doit garder son alternance quoi qu'il arrive.",
bpm:[70,92,112,132],
crit:"3 boucles complètes sans rupture d'alternance ni note bouffée."},
{id:"p3", mod:"pick", tier:3, name:"Saut de cordes (string skipping)",
tab:`e|-------------------------|
B|-------------------------|
G|---5-7---5-7---5-7---5-7-|
D|-------------------------|
A|-5-7---5-7---5-7---5-7---|
E|-------------------------|`,
consigne:"Motif en doubles croches qui saute la corde de Ré : le médiator doit survoler la corde muette sans la toucher. C'est l'exercice qui rend les cordes intérieures invisibles — la précision pure du poignet.",
bpm:[70,88,106,124],
crit:"Aucun frottement audible de la corde sautée sur 4 boucles."},
{id:"p4", mod:"pick", tier:4, name:"Éolien 3 notes par corde",
tab:`e|---------------------------12-13-15-|
B|------------------12-13-15----------|
G|------------12-14-------------------|
D|------12-14-------------------------|
A|-10-12------------------------------|
E|------------------------------------|  (La éolien, position 10)`,
consigne:"Ta gamme du moment en 3 notes par corde, sextolets (6 notes par temps), AR strict. C'est l'exercice signature du shred : la régularité du sextolet compte plus que la vitesse brute. Accentue légèrement la première note de chaque temps.",
bpm:[60,76,92,108],
crit:"Sextolets réguliers (pas de 'galop') vérifiés en enregistrant 2 mesures."},
// ============ LEGATO ============
{id:"l1", mod:"leg", tier:1, name:"Hammer / pull 5-7 par paires",
tab:`e|-5h7p5h7p5h7p5-|
B|-5h7p5h7p5h7p5-|
G|-5h7p5h7p5h7p5-|  × doigts 1-3
D|-5h7p5h7p5h7p5-|  puis 5-8 × doigts 1-4
A|-5h7p5h7p5h7p5-|
E|-5h7p5h7p5h7p5-|`,
consigne:"UNE attaque au médiator, puis tout en hammer/pull, doubles croches. Le pull-off n'est pas un relâchement : c'est un petit tirage vers le bas qui fait sonner la note. Le volume des notes liées doit égaler la note attaquée.",
bpm:[80,100,122,144],
crit:"Yeux fermés, impossible de distinguer notes attaquées et notes liées : même volume."},
{id:"l2", mod:"leg", tier:2, name:"Trilles d'endurance",
tab:`e|-5h7p5h7p5h7...--|  30 s doigts 1-3
B|-5h6p5h6p5h6...--|  30 s doigts 1-2
G|-5h8p5h8p5h8...--|  30 s doigts 1-4  ← le juge de paix
D|-----------------|  repos 20 s entre chaque`,
consigne:"Trille continue 30 secondes par combinaison de doigts, métronome en doubles croches pour caler la régularité. Le 1-4 est celui qui te dira la vérité sur ton auriculaire. Si la main brûle, c'est trop de pression : le pouce derrière le manche doit rester détendu.",
bpm:[80,100,120,140],
crit:"30 s complètes en 1-4 sans ralentissement audible sur la fin."},
{id:"l3", mod:"leg", tier:3, name:"Penta full legato",
tab:`e|--------------------5h8--|
B|----------------5h8------|
G|------------5h7----------|
D|--------5h7--------------|
A|----5h7------------------|
E|-5h8---------------------|  (1 attaque/corde, descente en pull)`,
consigne:"La box 1 entière avec UNE seule attaque par corde : hammer à la montée, pull à la descente. La difficulté est le premier hammer 'à froid' sur chaque nouvelle corde (hammer from nowhere) : frappe assez fort pour que la note naisse sans médiator.",
bpm:[70,90,110,130],
crit:"Montée-descente complète où la main droite ne sert qu'à étouffer les cordes inutiles."},
{id:"l4", mod:"leg", tier:4, name:"Rouleaux 3nps (la machine Satriani)",
tab:`e|-------------------------------12h13h15p13p12----|
B|----------------------12h13h15----------------15-|
G|-------------12h14h16-----------------------------|
D|----12h14h16---------------------------------------|
A|-...------------------------------------------------|`,
consigne:"L'éolien 3nps en legato intégral, sextolets : hammers à la montée, rouleaux montée-descente sur la corde aiguë, pulls à la descente. C'est LE geste du legato moderne. Main droite posée en étouffoir permanent sur les cordes graves.",
bpm:[60,76,92,108],
crit:"2 mesures enregistrées : aucun bruit parasite des cordes non jouées."},
// ============ BENDS & VIBRATO ============
{id:"b1", mod:"bend", tier:1, name:"Bends calibrés (l'accordeur ne ment pas)",
tab:`G|-9---7b(9)---9---7b(9)-|  bend 1 ton
B|-10--8b(10)--10--8b(10)-|  vise l'unisson
e|-10--8b(10)--...--------|`,
consigne:"Joue la note cible (case 9), puis bende la case 7 jusqu'à l'unisson EXACT. Trois doigts sur la corde (le bend vient de la rotation du poignet, pas des doigts). Vérifie chaque bend à l'oreille puis à l'accordeur. Fais pareil avec le demi-ton (6b7).",
bpm:null,
crit:"8 bends consécutifs qui atterrissent juste (±5 cents à l'accordeur) sur les 3 cordes aiguës."},
{id:"b2", mod:"bend", tier:2, name:"Vibrato métronomique",
tab:`B|-8~~~~~~~~ (vibrato calé : 1 oscillation/croche à 60,
             puis doubles à 60, puis croches à 80...)`,
consigne:"Le vibrato incontrôlé est un tremblement ; le vibrato contrôlé est une signature. Cale tes oscillations sur le métronome : lent et LARGE d'abord (presque un demi-ton), la vitesse ensuite. Travaille poignet (rotation) puis compare avec le vibrato de doigt.",
bpm:[60,72,84,100],
crit:"10 secondes de vibrato régulier et large, amplitude constante du début à la fin."},
{id:"b3", mod:"bend", tier:3, name:"La famille complète des bends",
tab:`B|-8b(10)r(8)--pre-bend:(10)r(8)--8b(9)b(10)-|
   bend-release   pré-bend descendu   bend en 2 paliers
e|-10b(12)+tenir 4 temps sans bouger---------|`,
consigne:"Enchaîne : bend-release propre, pré-bend (bende AVANT d'attaquer, puis descends — l'effet 'pleure'), bend en deux paliers (1/2 puis 1 ton), et le bend tenu 4 temps sans dériver. Chaque variante est un mot de vocabulaire ; le solo de Comfortably Numb les utilise tous.",
bpm:null,
crit:"La séquence complète, enregistrée, juste de bout en bout."},
{id:"b4", mod:"bend", tier:4, name:"Vibrato au sommet du bend (le graal)",
tab:`B|-8b(10)~~~~~ (bende 1 ton PUIS vibrate autour
               de la note cible, par relâchés contrôlés)`,
consigne:"Le geste qui fait la différence entre 'bien' et 'grand' : maintenir un bend à l'unisson ET le faire vibrer — le vibrato part de la note haute et oscille en dessous par micro-relâchés. C'est la signature de Gilmour et SRV. Lent, large, chantant.",
bpm:null,
crit:"5 secondes de bend vibré JUSTE (la note moyenne reste la cible), sur corde B et G."},
// ============ SLIDES & SHIFTS ============
{id:"s1", mod:"slide", tier:1, name:"Slides atterrissage précis",
tab:`G|-5/7--7\\5--5/9--9\\5--5/12--12\\5-|
   (départ attaqué, arrivée SANS réattaquer)`,
consigne:"Slide = une seule attaque, la pression constante fait chanter tout le trajet. Yeux fermés sur les derniers essais : la main doit CONNAÎTRE la distance. Croches au métronome, l'arrivée tombe PILE sur le temps.",
bpm:[80,100,124,144],
crit:"10 slides d'affilée qui atterrissent sur la bonne case, sans regarder le manche."},
{id:"s2", mod:"slide", tier:2, name:"Liaison box 1 → box 2",
tab:`e|--------------------5-8/10-8-5----|
B|-------------5-8/10------------...|
G|---------5-7----------------------|
D|-----5-7--------------------------|
A|-5-7------------------------------|`,
consigne:"Monte la box 1, glisse sur la corde B (8→10) pour entrer dans la box 2, redescends. C'est le premier pont entre tes cages : répète jusqu'à ce que la couture soit invisible. Puis fais le même travail entre box 2 et 3.",
bpm:[70,90,110,128],
crit:"La montée traverse les deux boxes sans micro-pause à la couture."},
{id:"s3", mod:"slide", tier:3, name:"L'éolien sur UNE corde",
tab:`B|-10-12-13/15-13-12-10-8/10-8-6-5-6-8/10...-|
   (La éolien sur la corde B, shifts glissés)`,
consigne:"Toute la gamme sur une seule corde, en glissant entre les positions. C'est l'exercice qui transforme la gamme verticale (boxes) en connaissance HORIZONTALE du manche — tu vois enfin où sont les notes, pas les formes.",
bpm:[66,84,102,120],
crit:"Monter/descendre 2 octaves sur la corde B sans regarder ni hésiter, puis pareil sur G."},
{id:"s4", mod:"slide", tier:4, name:"La cascade (slide + legato combinés)",
tab:`e|-15p12-------------------------|
B|-------15p13-13/15\\13----------|
G|-------------------14p12-12/14-|
D|-------------------------------| en boucle, descente diagonale`,
consigne:"Le lick 'cascade' : pulls et slides enchaînés en descente diagonale à travers les cordes et les positions. Zéro attaque sauf la première de chaque corde. C'est du vocabulaire de solo directement utilisable — quand il est propre, il impressionne plus qu'un sweep.",
bpm:[60,78,96,112],
crit:"4 boucles fluides, le slide ne casse jamais la pulsation."},
// ============ RYTHMIQUE & MUTING ============
{id:"r1", mod:"ryth", tier:1, name:"Palm mute profondeur contrôlée",
tab:`E|-0-0-0-0-0-0-0-0-|  PM total (percussif)
E|-0-0-0-0-0-0-0-0-|  PM moyen (grave qui ronfle)
E|-0-0-0-0-0-0-0-0-|  ouvert — alterne 1 mesure chaque`,
consigne:"Croches en downpicking (tout vers le bas), trois profondeurs de palm mute alternées : la paume roule sur le chevalet de quelques millimètres et le son change du tout au tout. Le contrôle de cette profondeur EST le son rythmique rock/métal.",
bpm:[90,120,150,180],
crit:"Les 3 profondeurs clairement distinctes, changement sans rater une croche."},
{id:"r2", mod:"ryth", tier:2, name:"Main droite continue + ghost notes (funk)",
tab:`e|--9--9--x-x-9--9--x-x-|
B|--9--9--x-x-9--9--x-x-|  x = ghost (cordes étouffées
G|--9--9--x-x-9--9--x-x-|      main gauche, la droite
   1-e-&-a-2-e-&-a...        gratte SANS s'arrêter)`,
consigne:"La main droite bat les doubles croches EN CONTINU comme un métronome, la main gauche presse (note) ou étouffe (ghost) pour sculpter le motif. C'est la technique funk/RHCP — et le secret de toute rythmique groovy.",
bpm:[70,88,104,120],
crit:"1 minute sans que la main droite ne s'arrête jamais, ghosts bien percussifs."},
{id:"r3", mod:"ryth", tier:3, name:"Gallop metal",
tab:`E|-0-0-0--0-0-0--0-0-0--0-0-0-|
    PM croche+2 doubles (ta-ka-ka)
    tout en downpicking d'abord, AR ensuite`,
consigne:"Le gallop (croche + deux doubles) est LE motif du métal classique. D'abord tout en aller simple (down) pour le son, ensuite en AR pour la vitesse. Le palm mute reste constant, seule la main gauche laisse parfois sonner un accord.",
bpm:[90,120,148,168],
crit:"16 mesures de gallop sans dérive de tempo (enregistre-toi par-dessus le métronome)."},
{id:"r4", mod:"ryth", tier:4, name:"Downpicking d'endurance (l'école Hetfield)",
tab:`E|-0-0-0-0-0-0-0-0-|  croches PM, TOUT vers le bas
   (riff type Master of Puppets : E-E-E...
    ajoute les accords F5/E5 quand le poignet tient)`,
consigne:"Croches palm mute exclusivement en downpicking, aussi longtemps que le poignet tient. Le secret n'est pas la force : c'est un poignet lâche qui rebondit. Master of Puppets est à 212 — chaque BPM gagné ici est gagné à la sueur.",
bpm:[120,150,180,205],
crit:"1 minute continue au palier visé sans crispation de l'avant-bras."},
// ============ SWEEP ============
{id:"w1", mod:"sweep", tier:2, name:"Mini-sweep 3 cordes",
tab:`e|---------12------|---------12------|
B|------13----13---|------12----12---|
G|--14-----------14|--12-----------12|
    Ré majeur (triade)   Sim (mineur)`,
consigne:"Le médiator TOMBE à travers les 3 cordes en un seul geste (comme un accord ralenti), puis remonte pareil. Une seule note sonne à la fois : chaque doigt se lève dès que la note suivante est jouée. Triolets au métronome, très lent — la propreté est tout.",
bpm:[60,80,100,120],
crit:"À vitesse lente, on entend 3 notes séparées, jamais un accord."},
{id:"w2", mod:"sweep", tier:3, name:"Sweep 5 cordes (Am)",
tab:`e|------------12-17-12------------|
B|---------13----------13---------|
G|------14----------------14------|
D|---14----------------------14---|
A|-12----------------------------12|`,
consigne:"L'arpège de Lam sur 5 cordes avec le petit rouleau au sommet (12-17-12 : barré roulé de l'index... non — 12 index, 17 auriculaire). Descente = le geste inverse exact. Le roulement de l'index sur les cases 14-14 (G-D) ne doit faire sonner qu'une note à la fois.",
bpm:[50,66,84,100],
crit:"Montée-descente enregistrée : zéro superposition de notes, zéro corde parasite."},
{id:"w3", mod:"sweep", tier:4, name:"Sweep + tap d'extension",
tab:`e|------------12-t20p12------------|
B|---------13-----------13---------|
G|------14-----------------14------|
D|---14-----------------------14---|
A|-12-------------------------------|`,
consigne:"Le même arpège, mais le sommet s'étend d'un tap (case 20) — le geste spectaculaire du shred néo-classique. Le tap s'insère DANS le flux du sweep sans casser le triolet. Réservé aux jours où le sweep 5 cordes est déjà propre.",
bpm:[50,64,80,96],
crit:"Le tap ne s'entend pas comme un événement : même volume, même flux."},
// ============ TAPPING ============
{id:"t1", mod:"tap", tier:2, name:"Tapping une corde (la base Van Halen)",
tab:`e|-t12p5h8-t12p5h8-t12p5h8-|
   (triolets : tap 12, pull vers 5, hammer 8)
   puis déplace : t12p7h10, t15p8h12...`,
consigne:"Le motif fondateur : tap (majeur ou index de la main droite), pull-off, hammer. Triolets réguliers. Le tap est une frappe SÈCHE qui rebondit — pas un appui. La tranche de la main droite étouffe les cordes graves en permanence.",
bpm:[80,104,128,152],
crit:"1 minute de triolets égaux : les 3 notes au même volume."},
{id:"t2", mod:"tap", tier:3, name:"Tapping arpèges multi-cordes",
tab:`e|-t12p8h10----------------|
B|----------t13p8h10-------|
G|-------------------t12p9h11|
   (accord... les triolets descendent les cordes)`,
consigne:"Le même geste, mais le tap saute de corde en corde pour arpéger un accord. Le défi : étouffer la corde qu'on quitte À L'INSTANT où on tape la suivante (main gauche ET tranche de la main droite coopèrent).",
bpm:[66,84,104,120],
crit:"Descente d'arpège sur 3 cordes sans aucune résonance parasite."},
{id:"t3", mod:"tap", tier:4, name:"Phrases tap-legato (l'école Satriani)",
tab:`B|-t15p10h12p10-t15p10h12p10-t17p12h14p12-|
   (motif à 4 notes, le tap se déplace,
    la main gauche coule en dessous)`,
consigne:"Ici le tapping devient un langage : motifs de 4 notes (tap + 3 notes legato), le tap se déplace sur la gamme éolienne pendant que la main gauche reste en position. C'est du Satriani/Vai — mélodique, pas gymnique. Compose tes propres variantes.",
bpm:[60,78,96,112],
crit:"Une phrase de 2 mesures inventée par toi, jouée en boucle, propre et musicale."}
];

// ============ LE MANCHE (gammes, positions, liaisons) — auto-évaluation 1-4 ============
const SCALES=[
{id:"sc1", name:"Penta mineure : les 5 boxes", icon:"1️⃣",
diagram:`Box1(5)  Box2(8)  Box3(10)  Box4(12)  Box5(15)
e|-5-8-|  |-8-10-|  |-10-12-|  |-12-15-|  |-15-17-|
B|-5-8-|  |-8-10-|  |-10-13-|  |-13-15-|  |-15-17-|
G|-5-7-|  |-7-9--|  |-9-12--|  |-12-14-|  |-14-17-|
D|-5-7-|  |-7-10-|  |-10-12-|  |-12-14-|  |-14-17-|
A|-5-7-|  |-7-10-|  |-10-12-|  |-12-14-|  |-14-17-|
E|-5-8-|  |-8-10-|  |-10-12-|  |-12-15-|  |-15-17-|
        (La mineur penta — les boxes se chevauchent)`,
consigne:"Tu connais la box 1 — le but est que les 4 autres deviennent aussi automatiques. Une box par jour : monte-la, descends-la, improvise 2 minutes DEDANS uniquement, backing track en Am.",
mission:"Palier 4 = jouer les 5 boxes de mémoire, en annonçant leur numéro, sans erreur."},
{id:"sc2", name:"La diagonale (sortir des cages)", icon:"↗️",
diagram:`e|----------------------------5-8-10-12-15-|
B|--------------------5-8-10---------------|
G|--------------5-7-9-----------------------|
D|--------5-7-10-----------------------------|
A|--5-7-10------------------------------------|
E|-5-8------------------------------------------|
   (traversée diagonale : box1 → 2 → 3 → 4 → 5)`,
consigne:"La penta en diagonale : tu traverses les 5 boxes en une seule montée, par glissés sur chaque corde. C'est LA compétence qui donne l'impression que le manche n'a plus de frontières.",
mission:"Palier 4 = la traversée aller-retour, fluide, puis improvisation qui VOYAGE entre 3 boxes minimum."},
{id:"sc3", name:"La blue note partout", icon:"🎷",
diagram:`Box 1 avec blue note (b5) :
e|-5-8----|
B|-5-8----|
G|-5-7-8--|  ← blue note case 8
D|-5-6-7--|  ← blue note case 6
A|-5-6-7--|  ← blue note case 6
E|-5-8----|
(la b5 : note de PASSAGE, jamais de repos)`,
consigne:"Place la blue note dans chaque box (elle est toujours entre la 4 et la 5). Règle d'or : on GLISSE dessus, on ne s'y arrête jamais — c'est une épice, pas un plat. Improvise en blues de La en l'utilisant une fois par phrase, pas plus.",
mission:"Palier 4 = localiser la blue note instantanément dans les 5 boxes + l'utiliser avec goût sur un blues lent."},
{id:"sc4", name:"Éolien 3nps : les 2 shapes maîtres", icon:"🌒",
diagram:`Shape 1 (départ 5, corde E) : La éolien
e|-------------------------8-10-12-|
B|-------------------8-10-12-------|
G|-------------7-9-10---------------|
D|--------7-9-10---------------------|
A|---5-7-8----------------------------|
E|-5-7-8-------------------------------|
Éolien = ta penta + la 2 (si) et la b6 (fa)`,
consigne:"Ton chantier actuel. Retiens le lien : l'éolien N'EST PAS une nouvelle gamme — c'est ta penta avec 2 notes invitées (la seconde et la sixte mineure). Joue la penta, AJOUTE les 2 notes, entends ce qu'elles apportent (la b6 = la couleur triste espagnole).",
mission:"Palier 4 = les 2 shapes 3nps de mémoire + savoir montrer, dans le shape, où sont les 2 notes 'en plus' de la penta."},
{id:"sc5", name:"Éolien horizontal (1 corde + shifts)", icon:"➡️",
diagram:`B|-1-3-5-6-8-10-12-13-15-17-|  Si éolien de La ? non :
   La éolien sur corde B :
B|-1-3-5-6-8-10-12-13-15-|
   (A-B-C-D-E-F-G-A-B... cases 10-12-13-15 = octave 2)`,
consigne:"L'éolien sur UNE corde à la fois : tu vois enfin la gamme comme une suite d'intervalles (ton, demi-ton...) et plus comme un dessin. Chante le nom des notes en jouant. Fais les 6 cordes sur une semaine.",
mission:"Palier 4 = n'importe quelle corde, monter l'éolien en nommant les notes, sans hésiter."},
{id:"sc6", name:"Triades : le squelette des solos", icon:"🔺",
diagram:`Am (cordes 1-2-3) :    C (cordes 1-2-3) :
e|-5---8---12---|      e|-3---8---12--|
B|-5---10--13---|      B|-5---8---13--|
G|-5---9---14---|      G|-5---9---12--|
  3 positions          3 positions`,
consigne:"Les triades sur les 3 cordes aiguës, 3 renversements chacune. Les grands solistes ne pensent pas 'gamme', ils pensent 'accord du moment + notes autour'. Am et C d'abord (ta tonalité), puis Dm, Em, F, G.",
mission:"Palier 4 = trouver instantanément une triade de Am et de C près de n'importe quelle case."},
{id:"sc7", name:"Target notes : viser, pas arroser", icon:"🎯",
diagram:`Sur Am : vise LA-DO-MI (1-b3-5)
Sur F  : vise FA-LA-DO (recycle tes notes !)
Sur G  : vise SOL-SI-RÉ
→ la MÊME penta, mais tu atterris sur
  la note de L'ACCORD en cours`,
consigne:"Backing track Am-F-C-G (il y en a des milliers sur YouTube). Improvise en visant, sur CHAQUE changement d'accord, une note de l'accord en cours. C'est la différence entre 'jouer la gamme' et 'jouer la musique'. Commence lentement : une note visée par accord suffit.",
mission:"Palier 4 = sur la grille, tes phrases atterrissent sur une note de l'accord à chaque changement, sans y penser."},
{id:"sc8", name:"CAGED express", icon:"🗝️",
diagram:`Le MÊME accord de Do partout :
forme C (case 0), forme A (case 3),
forme G (case 5), forme E (case 8),
forme D (case 10) → puis ça reboucle.
Chaque forme d'accord = une box de gamme autour.`,
consigne:"Le système CAGED en pratique : joue Do majeur en 5 endroits du manche avec les 5 formes d'accords ouverts déplacées. Autour de chaque forme vit une position de gamme — c'est le pont entre tes accords (que tu connais) et le manche entier.",
mission:"Palier 4 = jouer n'importe quel accord majeur en 5 positions, en nommant la forme utilisée."}
];

// ============ THÉORIE EXPRESS (fiches courtes + 2 questions) ============
const THEORY=[
// ============ LE SYSTÈME DU MANCHE — les fondations (à faire dans l'ordre) ============
{id:"f1", fond:true, title:"Il n'y a que 12 notes. Point.",
content:[
"Avant toute chose : la musique occidentale n'a que <b>12 notes</b>. Pas 50, pas 200. Douze. Puis ça recommence, plus aigu. Les voici, en boucle : <b>A · A# · B · C · C# · D · D# · E · F · F# · G · G#</b> → et on revient à A. (En français : La · La# · Si · Do · Do# · Ré · Ré# · Mi · Fa · Fa# · Sol · Sol#.)",
"Sur la guitare, <b>une case = un demi-ton = la note suivante</b> dans cette liste. C'est tout. Case 0 (corde à vide) = E, case 1 = F, case 2 = F#, case 3 = G… Tu avances d'une case, tu avances d'une note dans le cycle. Le manche n'est pas un mystère : c'est cette liste de 12 notes, répétée sur 6 cordes.",
"Pourquoi tu ne le \"vois\" pas encore : parce que personne ne te l'a dit comme ça, et parce qu'il reste UNE irrégularité — celle de la fiche suivante. Une fois les deux sues, le manche devient calculable."],
q:[
{q:"Sur une corde, avancer d'une case, c'est avancer de :",opts:["Un ton","Un demi-ton (la note suivante des 12)","Une octave","Ça dépend de la corde"],a:1,exp:"Une case = un demi-ton = un cran dans le cycle des 12 notes. Universel, sur toutes les cordes, sur toute guitare."},
{q:"Combien de notes différentes existe-t-il, avant que ça recommence ?",opts:["7","12","6","24"],a:1,exp:"12. Les 7 lettres (A à G) plus les 5 dièses. Ensuite, le cycle repart à l'octave — c'est pour ça que ta 12e case sonne comme ta corde à vide."}]},
{id:"f2", fond:true, title:"Les deux marches sans dièse — LA clé",
content:[
"Voici l'irrégularité qui bloque tout le monde, et qui n'est jamais expliquée. Entre presque toutes les notes voisines, il y a un dièse : A→A#→B. Mais il existe <b>deux exceptions</b>, deux endroits où les notes se touchent directement :",
"<b>E → F</b> &nbsp;et&nbsp; <b>B → C</b>. &nbsp;Pas de E#. Pas de B#. Ces deux paires sont séparées d'<b>une seule case</b>, alors que toutes les autres notes naturelles sont séparées de <b>deux cases</b> (un ton).",
"Traduction concrète sur ton manche : sur la corde de Mi grave (E), la case 1 est <b>F</b> — juste à côté. Mais de F à G, il faut <b>deux</b> cases (case 3). C'est cette alternance ton/demi-ton qui donne au manche son irrégularité apparente. Sache-la, et tu peux calculer n'importe quelle note sans l'avoir mémorisée.",
"Moyen mnémotechnique : les deux marches basses de l'escalier sont <b>E-F</b> et <b>B-C</b>. Répète-le jusqu'à ce que ça sorte tout seul. C'est la fiche la plus rentable de toute l'app."],
q:[
{q:"Quelles paires de notes n'ont PAS de dièse entre elles ?",opts:["A-B et C-D","E-F et B-C","G-A et D-E","Aucune"],a:1,exp:"E→F et B→C sont à un demi-ton (une case). Toutes les autres notes naturelles voisines sont à un ton (deux cases). C'est la seule irrégularité du système."},
{q:"Sur la corde de Mi grave, la case 1 est donc :",opts:["E#","F","F#","G"],a:1,exp:"E + un demi-ton = F (pas de E#). C'est pour ça que le Fa est si près de la corde à vide — et pourquoi l'accord de Fa barré est en case 1."}]},
{id:"f3", fond:true, title:"Pourquoi E-A-D-G-B-E (et l'anomalie du Si)",
content:[
"Ton accordage n'est pas arbitraire. De la corde grave vers l'aigu : <b>E · A · D · G · B · E</b>. Regarde l'écart entre chaque corde : E→A = 5 cases. A→D = 5 cases. D→G = 5 cases. Toutes des <b>quartes</b>. La logique est régulière…",
"…sauf <b>G → B</b>, qui ne fait que <b>4 cases</b> (une tierce majeure). Puis B→E repasse à 5 cases. Cette unique anomalie a été choisie par les luthiers pour que les accords tombent sous la main — un compromis vieux de plusieurs siècles.",
"<b>Conséquence que tu dois graver</b> : toute forme (accord, gamme, octave, intervalle) qui <b>traverse la corde Si</b> se décale d'<b>une case vers le haut</b>. C'est l'explication de 90 % des fausses notes des guitaristes autodidactes en position haute. Ce n'est pas toi qui es mauvais : c'est le système qui a un défaut, et personne ne te l'a signalé."],
q:[
{q:"L'accordage standard est fait de quartes, sauf entre :",opts:["E et A","D et G","G et B","B et E"],a:2,exp:"G→B est une tierce majeure (4 cases) au lieu d'une quarte (5 cases). Unique exception, et source de tous les décalages de formes."},
{q:"Une forme d'accord ou d'octave qui traverse la corde Si doit être :",opts:["Décalée d'une case","Jouée à l'identique","Décalée de deux cases","Abandonnée"],a:0,exp:"Décalage d'une case (vers l'aigu) dès que la forme franchit le Si. Le savoir, c'est arrêter de jouer faux en haut du manche."}]},
{id:"f4", fond:true, title:"La 12e case : le manche se répète",
content:[
"12 notes dans le cycle → <b>12 cases et tout recommence</b>. La case 12 de n'importe quelle corde donne <b>la même note que la corde à vide</b>, une octave plus haut. C'est pour ça que le repère de la 12e case est un double point : c'est le milieu, le miroir.",
"La bonne nouvelle qui devrait te soulager : <b>tu n'as que 12 cases à connaître.</b> La case 13 = la case 1. La case 15 = la case 3. La case 17 = la case 5. Tu ne mémorises pas un manche de 22 cases : tu en mémorises 12, et tu ajoutes 12 pour l'autre moitié.",
"Réflexe à installer : au-delà de la case 12, <b>soustrais 12</b> et tu retombes sur du terrain connu."],
q:[
{q:"La case 12 d'une corde donne :",opts:["Une note nouvelle","La même note que la corde à vide, une octave plus haut","La quinte","Ça dépend de la corde"],a:1,exp:"12 cases = 12 demi-tons = une octave. Le manche est un cycle qui se referme à la 12e case — d'où son double repère."},
{q:"La note en case 15 de la corde de La est la même qu'en case :",opts:["5","3","7","12"],a:1,exp:"15 − 12 = 3. Au-delà de la 12e case, soustrais 12 : tu ne connais jamais que 12 cases par corde."}]},
{id:"f5", fond:true, title:"Les deux cordes-mères : Mi grave et La",
content:[
"Tu n'as pas besoin de mémoriser les 6 cordes. <b>Deux suffisent</b> — parce que ce sont elles qui portent la fondamentale de presque tous tes accords et power chords.",
"<b>Corde de Mi grave (6e)</b> : F=1 · G=3 · A=5 · B=7 · C=8 · D=10 · E=12. &nbsp;(Repère les deux marches : F est collé à E, et C est collé à B → 7 puis 8.)",
"<b>Corde de La (5e)</b> : B=2 · C=3 · D=5 · E=7 · F=8 · G=10 · A=12. &nbsp;(Mêmes marches : B→C = 2 puis 3, E→F = 7 puis 8.)",
"Voilà ce que ça t'offre <b>immédiatement</b> : un accord barré en forme de Mi, tu le nommes par sa case sur la corde de Mi grave (case 5 = Am si forme mineure, A si forme majeure). En forme de La, tu le nommes par la corde de La. <b>Tu ne joues plus « la forme case 8 » : tu joues Do.</b> C'est exactement la compréhension musicale que tu cherches."],
q:[
{q:"Sur la corde de Mi grave, le Do (C) se trouve en case :",opts:["7","8","10","5"],a:1,exp:"B=7, et B→C est une marche sans dièse → C=8. C'est la case du fameux barré de Do en forme de Mi."},
{q:"Pourquoi connaître les cordes de Mi grave et de La suffit-il pour commencer ?",opts:["Parce qu'elles sont plus faciles","Parce qu'elles portent la fondamentale des accords barrés et des power chords — elles nomment l'accord","Parce qu'elles sont plus graves","Ce n'est pas suffisant"],a:1,exp:"La fondamentale = le nom de l'accord. Elle est presque toujours sur la 6e ou la 5e corde. Ces deux cordes te donnent le NOM de tout ce que tu joues."}]},
{id:"f6", fond:true, title:"La forme d'octave : trouver n'importe quelle note",
content:[
"Dernière brique, et le manche entier s'ouvre. Tu connais tes deux cordes-mères. Comment atteindre les 4 autres ? Avec la <b>forme d'octave</b> : <b>+2 cordes, +2 cases</b>.",
"Depuis la corde de <b>Mi grave</b>, case X → la même note (une octave plus haut) sur la corde de <b>Ré</b>, case X+2. Depuis la corde de <b>La</b>, case X → la même note sur la corde de <b>Sol</b>, case X+2. Exemple : G est en case 3 sur le Mi grave → donc aussi en case 5 sur la corde de Ré. Toujours vrai.",
"<b>L'exception, tu la connais déjà</b> (fiche 3) : dès que la forme touche la corde Si, ajoute une case. Depuis la corde de <b>Ré</b>, case X → corde de <b>Si</b>, case <b>X+3</b>. Depuis la corde de <b>Sol</b>, case X → corde de <b>Mi aigu</b>, case X+3.",
"Résultat : deux cordes mémorisées + une forme géométrique = <b>tu localises n'importe quelle note, n'importe où</b>, par le calcul, sans avoir rien appris par cœur d'autre. C'est ça, le système."],
q:[
{q:"La forme d'octave standard (hors corde Si) est :",opts:["+2 cordes, +2 cases","+1 corde, +2 cases","+2 cordes, même case","+3 cordes, +3 cases"],a:0,exp:"Deux cordes plus haut, deux cases plus loin. Le Sol en case 3 du Mi grave se retrouve en case 5 de la corde de Ré. Partout, toujours."},
{q:"Depuis la corde de Ré, l'octave sur la corde de Si demande :",opts:["+2 cases","+3 cases (l'anomalie du Si)","+1 case","Même case"],a:1,exp:"La forme traverse la corde Si → on ajoute une case : +3 au lieu de +2. Toujours la même anomalie G→B, qui explique tout."}]},

// ============ Théorie express (la suite) ============
{id:"th1", title:"Les intervalles ont une FORME sur le manche",
content:[
"Oublie le solfège une seconde : sur la guitare, chaque intervalle est un DESSIN. L'octave ? Deux cordes plus haut, deux cases plus loin. La quinte ? Une corde plus haut, deux cases plus loin. La tierce mineure ? Même corde, 3 cases. Ces formes sont IDENTIQUES partout sur le manche (sauf en traversant la corde Si, où tout se décale d'une case — la fameuse anomalie de l'accordage).",
"Pourquoi c'est la fiche n°1 : tout le reste (gammes, accords, arpèges) n'est que des combinaisons de ces formes. Quand tu entends un intervalle dans ta tête et que ta main connaît sa forme, tu joues ce que tu entends — c'est la définition de l'expertise."],
q:[
{q:"Sur le manche, la quinte au-dessus d'une note (hors corde Si), c'est :", opts:["Même corde, 7 cases plus loin OU une corde plus haut, 2 cases plus loin","Toujours 5 cases plus loin","Deux cordes plus haut, même case","Impossible à systématiser"], a:0, exp:"Les deux formes sont vraies (7 cases sur la même corde = la même note que corde+1, +2 cases). C'est la forme du power chord — tu la connais déjà avec les doigts."},
{q:"Pourquoi les formes se décalent-elles en traversant la corde Si ?", opts:["À cause de la tension des cordes","Parce que l'intervalle G→B est une tierce majeure alors que toutes les autres cordes sont accordées en quartes","C'est une convention des luthiers","Elles ne se décalent pas"], a:1, exp:"E-A-D-G = quartes. G→B = tierce majeure (une case de moins). D'où le décalage d'une case de toute forme qui traverse la corde Si. Le savoir évite 90 % des fausses notes en position haute."}]},
{id:"th2", title:"Pourquoi la penta n'a que 5 notes (et pourquoi ça marche)",
content:[
"La gamme mineure complète a 7 notes. La penta en enlève 2 — précisément les deux qui créent des frottements (la seconde et la sixte mineure, à un demi-ton des notes voisines de l'accord). Résultat : il ne reste que des notes 'sûres', à distance confortable les unes des autres. C'est pour ça que la penta sonne toujours bien : elle est incassable par construction.",
"La conséquence stratégique pour toi : la penta est ta maison, l'éolien est la maison avec deux pièces en plus. Les deux notes ajoutées sont plus risquées (elles veulent se RÉSOUDRE sur une voisine) mais ce sont elles qui apportent l'émotion. D'abord la sécurité, ensuite la couleur — c'est exactement ton parcours actuel."],
q:[
{q:"Quelles notes l'éolien ajoute-t-il à ta penta mineure ?", opts:["La quarte et la septième","La seconde (2) et la sixte mineure (b6)","La blue note et l'octave","La tierce majeure et la quinte"], a:1, exp:"Penta min : 1-b3-4-5-b7. Éolien : 1-2-b3-4-5-b6-b7. Les invitées sont la 2 et la b6 — des notes 'tendues' qui veulent se résoudre, d'où leur pouvoir expressif."},
{q:"Pourquoi la penta 'sonne toujours juste' ?", opts:["Parce qu'elle est plus facile à jouer","Parce qu'on a retiré les notes à un demi-ton des notes de l'accord — celles qui frottent","Parce qu'elle est plus ancienne","Parce qu'elle n'a que des notes graves"], a:1, exp:"Les demi-tons contre une note d'accord créent la dissonance. La penta les a évacués : chaque note est au minimum à un ton de ses voisines dangereuses. Gamme 'sans épines'."}]},
{id:"th3", title:"Relatives : Am et C sont la même famille",
content:[
"La mineur et Do majeur utilisent EXACTEMENT les mêmes notes — seule la note 'maison' change. Concrètement sur ton manche : ta penta mineure de La (box 1, case 5) EST la penta majeure de Do. Tu sais déjà jouer en majeur, tu ne le savais juste pas.",
"L'astuce de terrain : sur un morceau joyeux en Do, joue ta box 1 de Lam mais fais ATTERRIR tes phrases sur Do (corde A case 15, corde E case 8, corde B case 13...) au lieu de La. Même doigts, autre couleur. C'est le tour de magie le plus rentable de la guitare — deux vocabulaires pour le prix d'un."],
q:[
{q:"Ta penta mineure de La contient les mêmes notes que :", opts:["La penta majeure de Do","La penta majeure de La","La gamme de Mi majeur","Aucune autre gamme"], a:0, exp:"A-C-D-E-G lu depuis C : C-D-E-G-A = penta majeure de Do. La relative majeure est toujours une tierce mineure AU-DESSUS de ta tonique mineure (La + 3 cases = Do)."},
{q:"Comment fait-on 'sonner majeur' avec une forme de penta mineure ?", opts:["En jouant plus fort","En faisant atterrir les phrases sur la tonique majeure (Do) au lieu de La","En évitant la corde de Mi","C'est impossible"], a:1, exp:"La couleur vient de la note de repos. Mêmes notes, autre gravité : phrase qui se pose sur Do = ambiance majeure ; sur La = mineure. Le manche ne change pas, l'intention si."}]},
{id:"th4", title:"Le blues : 3 accords et un mensonge magnifique",
content:[
"Le blues 12 mesures : I-I-I-I / IV-IV-I-I / V-IV-I-V, tous joués en accords de SEPTIÈME (A7, D7, E7 en La). Théoriquement, jouer une gamme MINEURE sur des accords MAJEURS devrait être faux. C'est le mensonge fondateur du blues : la tierce mineure de ta penta frotte contre la tierce majeure des accords — et ce frottement EST le son du blues.",
"Le niveau au-dessus : les bluesmen 'courbent' ce mensonge — micro-bend sur la tierce mineure pour la rapprocher de la majeure (le quart de ton du blues), mélange penta mineure/majeure selon l'accord. Écoute B.B. King : presque uniquement ça. Le blues est le laboratoire parfait de tout ce que tu travailles : bends, vibrato, target notes, phrasé."],
q:[
{q:"Sur un blues en La, jouer la penta MINEURE de La sur A7 (accord majeur) :", opts:["Est une erreur d'harmonie à éviter","Crée le frottement b3/3 qui définit littéralement le son blues","Ne fonctionne que si on évite la tierce","N'est possible qu'en jazz"], a:1, exp:"Le clash tierce mineure (gamme) contre tierce majeure (accord) est LA signature blues. On l'adoucit en bendant légèrement la b3 vers la 3 — le fameux quart de ton."},
{q:"La grille de blues 12 mesures en La utilise quels accords ?", opts:["Am, Dm, Em","A7, D7, E7 (I, IV, V en septièmes)","A, C, G","A7 uniquement"], a:1, exp:"I-IV-V : La(7), Ré(7), Mi(7). Les septièmes partout — même la tonique est 'instable', c'est ce qui donne au blues son mouvement perpétuel."}]},
{id:"th5", title:"Le phrasé : tu parles, tu ne récites pas",
content:[
"Une gamme montée-descendue, c'est l'alphabet récité. Une phrase, c'est : une IDÉE courte (3-6 notes), une RESPIRATION (le silence est une note), une RÉPONSE (la même idée, variée). Question-réponse, comme une conversation. Les plus grands solos (Gilmour, B.B. King) ont moins de notes que tes exercices — mais chaque note a une intention : un bend, un vibrato, un placement rythmique.",
"Exercice mental à chaque impro : limite-toi à UNE corde et 4 cases pendant 2 minutes. Privé de gammes, tu es obligé de faire de la musique avec le rythme, les bends et les silences. C'est inconfortable — c'est le but. Le vocabulaire technique que tu construis dans SHRED ne vaut que s'il finit dans des phrases."],
q:[
{q:"La structure de base d'un phrasé musical est :", opts:["Monter la gamme puis la descendre","Question (idée courte) — silence — réponse (idée variée)","Jouer le plus de notes possible","Suivre exactement le rythme de la batterie"], a:1, exp:"Le phrasé est une conversation. L'auditeur retient les phrases qui respirent et se répondent — pas les avalanches. Compte les notes d'un chorus de B.B. King un jour : c'est édifiant."},
{q:"Pourquoi s'imposer '1 corde, 4 cases' en impro ?", opts:["Pour reposer la main gauche","Pour forcer la musicalité (rythme, bends, silences) quand les gammes ne sont plus disponibles","Parce que c'est plus rapide","Pour économiser les cordes"], a:1, exp:"La contrainte tue le pilote automatique. Sans autoroute de gamme à dérouler, il ne reste que la musique. Miles Davis : « Ce ne sont pas les notes que tu joues, ce sont celles que tu ne joues pas. »"}]},
{id:"th6", title:"La suite du voyage : dorien et mixolydien",
content:[
"Ton éolien est le premier des modes — voici les deux prochains, pour savoir où tu vas. Le DORIEN : ton éolien avec la sixte MAJEURE au lieu de la b6. Une seule note change et le sombre devient funky/jazzy (Santana — Oye Como Va, le solo d'Another Brick in the Wall est dorien). Le MIXOLYDIEN : une gamme majeure avec la septième mineure — LE son rock'n'roll et blues-rock sur accords de 7 (AC/DC, les Stones).",
"La méthode qui marche (celle que tu utilises déjà) : ne jamais apprendre un mode comme une gamme neuve, mais comme UNE NOTE qui change par rapport à ce que tu connais. Éolien → dorien = la b6 monte d'un demi-ton. C'est tout. L'oreille d'abord : joue les deux en boucle sur un drone de La jusqu'à ENTENDRE la différence — la théorie suivra."],
q:[
{q:"Le mode dorien, par rapport à ton éolien, change quoi ?", opts:["La tierce devient majeure","La sixte mineure (b6) devient sixte majeure (6)","La septième disparaît","Tout est différent"], a:1, exp:"Une seule note : b6→6. Ce demi-ton transforme la mélancolie éolienne en groove dorien (Santana, funk). Apprendre les modes = apprendre des différences, jamais des gammes entières."},
{q:"Le mixolydien est le son naturel de quel contexte ?", opts:["Les ballades tristes","Les accords de septième et le blues-rock (AC/DC, Stones)","La musique classique uniquement","Les morceaux en mineur"], a:1, exp:"Mixolydien = majeur avec b7 = exactement les notes d'un accord 7 étendu. Sur A7, le La mixolydien est 'la maison'. C'est le pont entre ton blues et la gamme majeure."}]}
];

// ============ RÉPERTOIRE IMPÉRATIF (les morceaux-examens) ============
const RTIERS=[
 {n:1, name:"Fondations du lead", need:3, desc:"Des solos cultes et accessibles : la penta appliquée en conditions réelles."},
 {n:2, name:"Le cap du soliste", need:3, desc:"Morceaux complets, phrasé expressif, premières vraies difficultés techniques."},
 {n:3, name:"L'école du phrasé", need:3, desc:"Les rites de passage. Ici, la justesse des bends et le goût comptent plus que la vitesse."},
 {n:4, name:"La porte de l'expert", need:2, desc:"Les monuments. En valider deux, c'est ne plus être un intermédiaire — point."}
];
const PIECES=[
// TIER 1
{id:"pc1", tier:1, title:"Another Brick in the Wall (Pt. 2) — solo", artist:"Pink Floyd",
why:"LE solo d'école de la penta : box 1 quasi pure (en Ré mineur... dorien, mais tes doigts s'en fichent), bends contrôlés, phrasé chirurgical de Gilmour. Si un seul solo devait certifier ta box 1, c'est lui.",
focus:["Penta appliquée","Bends justes","Phrasé"],
checks:["Le solo en entier, au tempo, sans pause","Chaque bend atteint sa cible (vérifié à l'oreille sur l'enregistrement)","Les silences respectés — Gilmour respire, toi aussi"]},
{id:"pc2", tier:1, title:"Come As You Are — riff + solo", artist:"Nirvana",
why:"Le riff (corde à vide + chromatismes) éduque la précision main droite en son clair, et le solo est une leçon de simplicité : suivre la mélodie du chant. Un morceau = deux compétences.",
focus:["Précision picking","Solo mélodique"],
checks:["Riff en boucle 2 min sans accroc, avec le chorus 'aquatique' ou pas","Solo au tempo, bends du motif principal justes","Enchaîner riff → solo → riff sans rupture"]},
{id:"pc3", tier:1, title:"Californication — riff + solo", artist:"Red Hot Chili Peppers",
why:"L'arpège du riff travaille l'indépendance des doigts main droite (ou le picking propre), et le solo de Frusciante est du pur vocabulaire penta box 1/2 avec des doubles stops. Groove obligatoire.",
focus:["Arpèges clean","Double stops","Groove"],
checks:["Riff au tempo avec le groove (enregistre-toi sur l'original)","Solo complet, doubles stops propres","Le slide final du solo atterrit juste"]},
{id:"pc4", tier:1, title:"Zombie — rythmique + lead", artist:"The Cranberries",
why:"Quatre accords, mais l'exigence est ailleurs : la dynamique (couplet doux / refrain mur du son) et les petites mélodies lead par-dessus. Un morceau pour apprendre à ÉCOUTER sa propre intensité.",
focus:["Dynamique","Distorsion contrôlée"],
checks:["La rythmique avec le contraste couplet/refrain marqué","Les motifs lead par-dessus la grille, en rythme","Jouable en chantant (ou fredonnant) la mélodie"]},
// TIER 2
{id:"pc5", tier:2, title:"Nothing Else Matters — complet", artist:"Metallica",
why:"Le morceau-école des arpèges aux doigts, avec la montée en intensité jusqu'au solo. Sa validation prouve : indépendance des doigts, propreté en clair, ET premier vrai solo construit.",
focus:["Fingerpicking","Arpèges","Solo construit"],
checks:["Intro et couplets aux doigts, sans accroc, au tempo","L'interlude 'harmoniques' propre","Le solo principal en entier (les bends hauts justes)"]},
{id:"pc6", tier:2, title:"Wish You Were Here — complet", artist:"Pink Floyd",
why:"L'intro est un examen de hammer/pull en acoustique (tes exos legato en conditions réelles), et la partie chantée teste la rythmique qui respire. Le morceau que tout le monde demande — le jouer PARFAITEMENT te distingue.",
focus:["Legato acoustique","Rythmique fine"],
checks:["L'intro complète avec les licks entre les accords, fluide","La rythmique du couplet stable en chantant","Les hammer/pull au volume des notes grattées"]},
{id:"pc7", tier:2, title:"Sultans of Swing — solo 1", artist:"Dire Straits",
why:"Knopfler joue aux doigts, mais au médiator c'est un monstre d'aller-retour et de triades — exactement tes chantiers. Les arpèges roulés du solo sont le pont vers le picking expert.",
focus:["Picking rapide","Triades","Endurance"],
checks:["Solo 1 au tempo original (ou 90 % assumé)","Les triplets roulés de la fin réguliers","Zéro note étouffée sur les arpèges"]},
{id:"pc8", tier:2, title:"Alive — solo", artist:"Pearl Jam",
why:"Mike McCready y fait du Hendrix : penta étirée, bends expressifs, wah. Un solo LONG — l'endurance émotionnelle : tenir une intensité pendant 1 min 30 sans se répéter.",
focus:["Bends expressifs","Construction longue"],
checks:["Le solo en entier avec sa montée en intensité","Les bends unisson (double stop bendé) justes","Improviser 30 s 'à la manière de' pour prouver le vocabulaire"]},
// TIER 3
{id:"pc9", tier:3, title:"Stairway to Heaven — solo", artist:"Led Zeppelin",
why:"Le rite de passage absolu. Penta + éolien mélangés (ton chantier exact), des plans devenus le dictionnaire du rock, une construction parfaite en 3 actes. Le valider, c'est parler couramment le Page.",
focus:["Penta+éolien mixés","Vitesse contrôlée","Construction"],
checks:["Le solo complet au tempo, y compris les triplets finaux","La partie éolienne située consciemment (tu sais QUAND tu quittes la penta)","Enregistré et réécouté : bends justes, timing en place"]},
{id:"pc10", tier:3, title:"Comfortably Numb — solo 1", artist:"Pink Floyd",
why:"L'examen mondial de la justesse : bends d'un ton et demi, pré-bends, vibrato au sommet — tout ton module Bends & Vibrato en 4 minutes de musique. Peu de notes ; aucune ne pardonne.",
focus:["Bends complexes","Vibrato","Son"],
checks:["Chaque bend à la hauteur exacte (l'enregistrement juge)","Le vibrato au sommet des bends tenus","Le solo entier avec MOINS de notes que l'envie n'en réclame"]},
{id:"pc11", tier:3, title:"Still Got the Blues — thème + solo", artist:"Gary Moore",
why:"LE morceau-école de l'éolien — ta gamme du moment dans son habitat naturel. Vibrato large, bends vocaux, et la grille qui tourne (Am-Dm-G-C-F...) est un cours de target notes appliquées.",
focus:["Éolien appliqué","Target notes","Vibrato large"],
checks:["Le thème principal note pour note, vibrato compris","Le premier solo au tempo","Improviser un chorus sur la grille en visant les accords"]},
{id:"pc12", tier:3, title:"Hotel California — solo final", artist:"Eagles",
why:"Le duo final : triades arpégées le long du manche (ton exo sc6 en gloire), bends harmonisés, et la discipline de jouer UNE voix d'un ensemble. Se joue à deux — ou seul sur backing track.",
focus:["Triades sur le manche","Arpèges","Précision"],
checks:["Les deux voix apprises (au moins la lead entière)","La montée finale d'arpèges propre, au tempo","Les positions de triades nommées pendant que tu joues (preuve CAGED)"]},
// TIER 4
{id:"pc13", tier:4, title:"Sweet Child O' Mine — complet", artist:"Guns N' Roses",
why:"L'intro est l'étalon du picking précis en sauts de cordes, et le solo de Slash enchaîne legato, bends, wah et le fameux passage rapide final en éolien/harmonique. Un marathon technique ET musical.",
focus:["String skipping","Legato rapide","Solo marathon"],
checks:["L'intro au tempo, cristalline, 4 boucles sans faute","Le solo complet, y compris la section rapide finale","Le breakdown 'Where do we go' avec la wah (ou simulée) en rythme"]},
{id:"pc14", tier:4, title:"Little Wing", artist:"Jimi Hendrix",
why:"Le sommet du rythme-lead : accords, doubles stops, hammer-ons mélodiques fondus en UNE seule partie. Il n'y a pas de 'rythmique' et de 'solo' — c'est le niveau où la guitare devient un piano. L'Everest du goût.",
focus:["Rythme-lead fusionné","Double stops","Toucher"],
checks:["L'intro note pour note, avec les nuances de volume","Le morceau en boucle en variant les ornements (pas du par-cœur figé)","Un couplet improvisé DANS le style, convaincant à la réécoute"]},
{id:"pc15", tier:4, title:"Texas Flood — solo", artist:"Stevie Ray Vaughan",
why:"Le blues lent qui broie les imposteurs : bends d'une justesse féroce sur cordes lourdes, vibrato énorme, intensité sans repos. Si Comfortably Numb est l'examen de justesse, Texas Flood est l'examen de PUISSANCE.",
focus:["Bends puissants","Vibrato SRV","Intensité blues"],
checks:["Un chorus complet note pour note","Le vibrato 'large et lent' tenu sans crispation","Deux chorus improvisés dans le style, enregistrés et assumés"]},
{id:"pc16", tier:4, title:"Master of Puppets — rythmique complète", artist:"Metallica",
why:"L'option 'main droite' de la porte expert : 8 minutes de downpicking à 212 BPM, la référence mondiale de l'endurance rythmique. Ton exo r4 poussé à sa conclusion logique.",
focus:["Downpicking 212","Endurance","Précision métal"],
checks:["L'intro et le riff principal à 212 en downpicking strict","Le morceau entier à 90 % du tempo minimum","La section mélodique centrale (arpèges) propre"]}
];
