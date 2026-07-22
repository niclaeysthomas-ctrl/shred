/* ============================================================
   SHRED — LA BOUSSOLE : du débutant à l'expert sur le manche
   Intervalles → positions → modes → accords → improvisation ciblée.
   Données pures (aucune dépendance : les helpers vivent dans index.html)
   ============================================================ */

/* Les 7 modes. `deg` = degré de la gamme majeure parente.
   `col` = index (0-6) de la note qui DONNE la couleur du mode. */
const GMODES=[
 {id:"ion", n:"Ionien",     deg:1, p:[0,2,4,5,7,9,11], col:null, colTxt:"—",
  form:"1 2 3 4 5 6 7", acc:"maj7",
  desc:"La gamme majeure elle-même. Repos, lumière, rien qui tire."},
 {id:"dor", n:"Dorien",     deg:2, p:[0,2,3,5,7,9,10], col:5, colTxt:"la 6ᵉ MAJEURE",
  form:"1 2 ♭3 4 5 6 ♭7", acc:"m7",
  desc:"Mineur, mais avec une 6ᵉ majeure : un mineur qui ne se plaint pas. Santana, le jazz modal, la pop anglaise."},
 {id:"phr", n:"Phrygien",   deg:3, p:[0,1,3,5,7,8,10], col:1, colTxt:"la ♭2",
  form:"1 ♭2 ♭3 4 5 ♭6 ♭7", acc:"m7",
  desc:"Le demi-ton dès la 2ᵉ note : couleur espagnole immédiate, flamenco, metal."},
 {id:"lyd", n:"Lydien",     deg:4, p:[0,2,4,6,7,9,11], col:3, colTxt:"la 4ᵗᵉ AUGMENTÉE",
  form:"1 2 3 ♯4 5 6 7", acc:"maj7",
  desc:"Majeur avec un ♯4 : ça flotte, ça ne se pose pas. Le son des musiques de film."},
 {id:"mix", n:"Mixolydien", deg:5, p:[0,2,4,5,7,9,10], col:6, colTxt:"la 7ᵉ MINEURE",
  form:"1 2 3 4 5 6 ♭7", acc:"7",
  desc:"Majeur avec une ♭7 : tout le rock et le blues vivent là-dedans."},
 {id:"eol", n:"Éolien",     deg:6, p:[0,2,3,5,7,8,10], col:5, colTxt:"la 6ᵉ MINEURE",
  form:"1 2 ♭3 4 5 ♭6 ♭7", acc:"m7",
  desc:"Le mineur naturel. La 6ᵉ mineure est la note qui pleure."},
 {id:"loc", n:"Locrien",    deg:7, p:[0,1,3,5,6,8,10], col:4, colTxt:"la 5ᵗᵉ DIMINUÉE",
  form:"1 ♭2 ♭3 4 ♭5 ♭6 ♭7", acc:"m7♭5",
  desc:"Sa quinte est fausse : instable, inhabitable. On le traverse, on n'y reste pas."}
];

/* Quel mode sur quel accord — le point le plus utile de tous. */
const CHORD_MODE=[
 {ch:"maj7", modes:["ion","lyd"], why:"Accord de repos. Ionien = classique. Lydien (♯4) = plus ouvert, plus moderne."},
 {ch:"m7",   modes:["dor"],       why:"Le réflexe n°1. Dm7 contient D-F-A-C, et le dorien les habille avec la 6ᵉ majeure."},
 {ch:"7",    modes:["mix"],       why:"La ♭7 de l'accord EST la ♭7 du mode. Rock, blues, dominante."},
 {ch:"m7♭5", modes:["loc"],       why:"La quinte diminuée de l'accord se retrouve dans le mode. Accord de passage."},
 {ch:"m6",   modes:["dor"],       why:"La 6ᵉ majeure de l'accord réclame le dorien, pas l'éolien."},
 {ch:"mMaj7",modes:["melmin"],    why:"Cas particulier : mineure mélodique (7ᵉ majeure sur un accord mineur)."}
];

/* ============================================================
   LE PARCOURS — 8 paliers, débutant → expert
   drill : {type, ...} interprété par les moteurs de index.html
   ============================================================ */
const BOUSSOLE=[
{id:"c1", lvl:"Débutant", icon:"📏", title:"Les intervalles dans la main",
 why:"Avant les positions, avant les modes. Un mode n'est qu'une combinaison d'intervalles — si tu ne les reconnais pas physiquement, tout le reste est du par-cœur.",
 brief:`<p>Un intervalle, c'est <b>une distance</b>, et sur la guitare une distance est une <b>forme de main</b> — toujours la même, partout sur le manche. C'est l'avantage énorme de cet instrument sur le piano.</p>
<p>Les formes à avoir dans les doigts, depuis une tonique :</p>
<ul>
<li><b>Quinte</b> : une corde plus bas (vers l'aigu), <b>+2 cases</b>. La forme du power chord — tu la connais déjà.</li>
<li><b>Octave</b> : deux cordes plus bas, +2 cases (ou +3 si tu franchis la corde de Sol).</li>
<li><b>Tierce majeure</b> : une corde plus bas, <b>−1 case</b>. <b>Tierce mineure</b> : une corde plus bas, <b>−2 cases</b>.</li>
<li><b>Quarte</b> : la même case sur la corde d'à côté (sauf Sol→Si).</li>
<li><b>♭7</b> : deux cordes plus bas, même case. <b>6ᵉ</b> : deux cordes plus bas, +2 cases.</li>
</ul>
<div class="warn">Le piège de la corde de Si : entre Sol et Si, tout se décale d'<b>une case</b>. Ce n'est pas une exception à mémoriser, c'est l'accordage de la guitare. Vérifie toujours tes formes quand elles traversent cette corde.</div>
<p>L'exercice te donne une tonique et te demande un intervalle. Ne compte pas les cases une par une : <b>vise la forme</b>, puis vérifie.</p>`,
 drill:{type:"interval", n:8}},

{id:"c2", lvl:"Débutant", icon:"📍", title:"Position 1 : où sont les toniques",
 why:"Une position ne sert à rien si tu ne sais pas où elle est ancrée. La tonique est ta maison : sans elle, tu joues des notes justes qui ne racontent rien.",
 brief:`<p>Voici la <b>position 1</b> de la gamme majeure : cinq cases, six cordes, sept notes qui se répètent. Ton unique travail ici : <b>voir les toniques</b> à l'intérieur.</p>
<p>Il y en a généralement <b>deux ou trois</b> dans la position. Ce sont tes points d'ancrage : les notes sur lesquelles une phrase peut se poser et sonner « finie ».</p>
<div class="tip">Méthode : joue la position de haut en bas, et <b>dis « TONIQUE » à voix haute</b> chaque fois que tu en touches une. En trois jours, tu les verras sans y penser.</div>
<div class="warn">Ne passe pas au palier suivant en récitant. Le critère, c'est : tu les allumes <b>sans hésiter</b>, dans n'importe quelle tonalité.</div>`,
 drill:{type:"degree", deg:0, pos:0, n:5}},

{id:"c3", lvl:"Intermédiaire", icon:"🎯", title:"Tierces et quintes dans la position",
 why:"C'est LE palier qui sépare celui qui « fait des gammes » de celui qui joue de la musique. La tierce dit majeur ou mineur. La quinte stabilise. Ce sont tes cibles.",
 brief:`<p>Dans n'importe quelle position, trois notes comptent plus que les autres :</p>
<ul>
<li><b>La tonique (1)</b> — la maison.</li>
<li><b>La tierce (3)</b> — <b>elle seule</b> décide de la couleur : majeure ou mineure. C'est la note la plus expressive du manche.</li>
<li><b>La quinte (5)</b> — neutre et solide, elle sonne juste partout.</li>
</ul>
<p>Un solo qui atterrit sur ces notes sonne « voulu ». Un solo qui atterrit ailleurs sonne « perdu ». Voilà toute la différence, et elle ne tient pas à la vitesse.</p>
<div class="tip">Au vrai jeu : improvise deux minutes dans la position en t'imposant de <b>finir chaque phrase sur une tierce</b>. Puis recommence en finissant sur une quinte. Tu entendras la différence de caractère immédiatement.</div>`,
 drill:{type:"degree", degs:[2,4], n:6}},

{id:"c4", lvl:"Intermédiaire", icon:"🗺", title:"Les 5 positions",
 why:"Cinq positions couvrent tout le manche. Tant que tu n'en connais qu'une, tu es enfermé dans cinq cases — et tu joues toujours le même solo.",
 brief:`<p>La gamme majeure se découpe en <b>5 positions</b> qui se chevauchent et pavent le manche entier. Elles démarrent respectivement sur les degrés <b>1, 2, 3, 5 et 6</b> de la gamme, sur la corde de Mi grave — exactement les mêmes ancrages que les 5 boxes de la pentatonique que tu connais déjà.</p>
<div class="tip">Ce n'est pas cinq choses à apprendre : c'est <b>une seule gamme</b> vue par cinq fenêtres. Les notes aux bords sont partagées — c'est par là qu'on passera de l'une à l'autre au palier 7.</div>
<p>L'exercice tire une position au hasard et te demande ses toniques. Une position par jour suffit ; le but est la reconnaissance, pas la performance.</p>
<div class="warn">Erreur classique : apprendre les 5 formes sans jamais les relier. Une position mémorisée mais isolée ne sert à rien en improvisation.</div>`,
 drill:{type:"degree", deg:0, anyPos:true, n:6}},

{id:"c5", lvl:"Avancé", icon:"🎨", title:"Les modes : la note qui raconte",
 why:"Un mode ne se joue pas en montant et descendant la gamme. Il se joue en insistant sur UNE note — celle qui le distingue de tous les autres.",
 brief:`<p>Point capital : un mode n'est <b>pas une nouvelle gamme</b>. C'est la même gamme majeure, entendue depuis une autre note. Ré dorien, ce sont les notes de Do majeur — mais Ré est la maison.</p>
<p>Ce qui fait la couleur, c'est <b>une seule note caractéristique</b> :</p>
<ul>
<li><b>Dorien</b> → la <b>6ᵉ majeure</b>. En Ré dorien : le <b>Si</b>.</li>
<li><b>Phrygien</b> → la <b>♭2</b>. En Mi phrygien : le <b>Fa</b>. Le demi-ton, c'est toute la couleur espagnole.</li>
<li><b>Lydien</b> → la <b>♯4</b>. En Fa lydien : le <b>Si</b>. Ça flotte.</li>
<li><b>Mixolydien</b> → la <b>♭7</b>. En Sol mixolydien : le <b>Fa</b>.</li>
</ul>
<div class="warn">Si tu joues un mode sans jamais toucher sa note caractéristique, <b>personne ne l'entend</b> : tu joues la gamme majeure parente. C'est l'erreur n°1 de tous ceux qui « connaissent leurs modes ».</div>
<p>L'exercice affiche la position de la gamme parente et te demande d'allumer la note qui colore le mode.</p>`,
 drill:{type:"color", n:7}},

{id:"c6", lvl:"Avancé", icon:"🔗", title:"Accord → mode",
 why:"C'est le point le plus utile de tout le module. En situation réelle, tu ne choisis pas un mode parce qu'il te plaît : tu le déduis de l'accord qui sonne.",
 brief:`<p>Le mode se choisit <b>en fonction de l'accord</b>. La logique est simple : le mode doit contenir les notes de l'accord.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;margin:10px 0">
<tr><th style="text-align:left;padding:6px 4px;border-bottom:1px solid #333">Accord</th><th style="text-align:left;padding:6px 4px;border-bottom:1px solid #333">Mode</th></tr>
<tr><td style="padding:5px 4px">maj7</td><td style="padding:5px 4px">Ionien, ou <b>Lydien</b> pour ouvrir</td></tr>
<tr><td style="padding:5px 4px">m7</td><td style="padding:5px 4px"><b>Dorien</b></td></tr>
<tr><td style="padding:5px 4px">7 (dominante)</td><td style="padding:5px 4px"><b>Mixolydien</b></td></tr>
<tr><td style="padding:5px 4px">m7♭5</td><td style="padding:5px 4px"><b>Locrien</b></td></tr>
<tr><td style="padding:5px 4px">mMaj7</td><td style="padding:5px 4px">Mineure mélodique</td></tr>
</table>
<p>Exemple à retenir : sur <b>Dm7</b> (D-F-A-C), tu joues <b>Ré dorien</b> — les quatre notes de l'accord sont dedans, et la 6ᵉ majeure (Si) ajoute la couleur.</p>
<div class="tip">Rock et jazz ne s'en servent pas pareil. En <b>rock</b>, on reste longtemps sur un même accord : tu as le temps d'installer la couleur d'un mode. En <b>jazz</b>, les accords défilent : tu changes de mode à chaque mesure, et ce sont les tierces et septièmes qui te guident.</div>`,
 drill:{type:"chordmode", n:8}},

{id:"c7", lvl:"Avancé", icon:"↔️", title:"Relier les positions",
 why:"Un bon improvisateur ne pense pas « position 3 ». Il pense « je vais vers la sixte ». Les positions ne sont qu'une carte — ce qui compte, c'est la destination.",
 brief:`<p>Tant que tu penses en boîtes, tu joues des boîtes : on entend que tu changes de position. L'objectif de ce palier est de <b>penser en notes cibles</b>, pas en formes.</p>
<p>La méthode : choisis une note (la tierce, la sixte, la ♭7…) et trouve-la <b>partout</b> sur le manche. Elle existe à 3 ou 4 endroits dans les 12 premières cases. Ces points deviennent tes portes de passage d'une position à l'autre.</p>
<div class="tip">Exercice au vrai jeu : joue une phrase qui commence en position 1 et se termine sur la <b>même note cible</b>, mais en position 3. Tu viens de relier deux boîtes — et ça s'entend comme de la musique, pas comme un déplacement.</div>
<p>L'exercice te donne une note cible et te demande de la trouver à <b>trois endroits différents</b>.</p>`,
 drill:{type:"connect", n:5}},

{id:"c8", lvl:"Expert", icon:"🎸", title:"Improviser en visant",
 why:"Tout ce qui précède ne vaut que s'il sort en jouant. Ici on ne clique plus : on branche le backing et on applique.",
 brief:`<p>Le protocole, à faire avec la <b>Jam Station</b> de l'app (grilles jouées, 12 tonalités, hors-ligne). Une contrainte à la fois — c'est la contrainte qui fabrique l'oreille, pas la liberté.</p>
<ul>
<li><b>1. La note seule.</b> Sur un vamp, joue <b>uniquement</b> la note caractéristique du mode, en rondes. Écoute comme elle frotte et se pose. Deux minutes. Austère, et indispensable.</li>
<li><b>2. Trois notes.</b> Tonique, tierce, note caractéristique. Rien d'autre. Fais-en de la musique — phrases courtes, silences.</li>
<li><b>3. Atterrissages.</b> Improvise librement dans une position, mais <b>termine chaque phrase</b> sur une note cible (1, 3 ou la note du mode).</li>
<li><b>4. Deux positions.</b> Même chose, mais chaque phrase change de position. Utilise les notes partagées comme portes.</li>
<li><b>5. Le test.</b> Enregistre 2 minutes au téléphone. Réécoute : <b>entend-on le mode</b> ? Si ça sonne « gamme majeure », c'est que tu n'as pas assez insisté sur la note caractéristique.</li>
</ul>
<div class="warn">Le vrai critère d'expertise n'est pas la vitesse : c'est qu'un auditeur puisse <b>chanter ce que tu viens de jouer</b>. Si personne ne peut le chanter, tu as joué des notes, pas une phrase.</div>`,
 drill:{type:"practice", jam:"dor"}}
];
