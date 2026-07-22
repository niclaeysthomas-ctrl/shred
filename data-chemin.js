/* ============================================================
   SHRED — LE CHEMIN : une seule échelle, une étape par jour.
   Chaque étape a un CRITÈRE OBJECTIF vérifié par l'app.
   Les anciens systèmes (records, paliers, fiches, Boussole)
   deviennent des CAPTEURS de cette échelle — plus des échelles rivales.
   ============================================================ */
const CHAPITRES=[
 {id:1, t:"Le manche cesse d'être un mystère", d:"Tu ne peux pas viser une note que tu ne sais pas situer."},
 {id:2, t:"La main droite se discipline",       d:"La propreté avant la vitesse. Toujours."},
 {id:3, t:"La carte : intervalles et positions", d:"Arrêter de réciter des formes, commencer à voir des distances."},
 {id:4, t:"L'oreille rattrape les yeux",        d:"Ce que tu ne peux pas entendre, tu ne peux pas l'improviser."},
 {id:5, t:"Les modes deviennent des couleurs",  d:"Une note caractéristique, pas sept gammes à réciter."},
 {id:6, t:"Le répertoire",                      d:"Un morceau fini vaut dix exercices commencés."},
 {id:7, t:"Improviser en visant",               d:"Le but de tout ce qui précède."}
];

/* helpers de garde-fou, tolérants à un état vide */
const _g=k=>((S.game||{})[k])||0;
const _fiche=id=>S.fiches&&S.fiches[id]!==undefined;
const _pal=id=>(S.pal&&S.pal[id])||0;
const _bpm=id=>{ const a=(S.bpm&&S.bpm[id])||[]; return a.length?Math.max(...a.map(x=>x.v)):0; };
const _bous=id=>((S.bous&&S.bous[id])||{best:0}).best||0;
const _man=n=>!!(S.chemin&&S.chemin.done&&S.chemin.done[n]);

const CHEMIN=[
/* ---------- CH.1 : le manche ---------- */
{n:1,ch:1,t:"Les 12 notes",do:"Lis la fiche et passe son quiz. C'est le socle : une case = un demi-ton, point.",crit:"Fiche « 12 notes » validée",go:"openFiche('f1')",gate:()=>_fiche('f1')},
{n:2,ch:1,t:"Les deux marches sans dièse",do:"La seule irrégularité du manche. Une fois sue, tout devient calculable.",crit:"Fiche validée",go:"openFiche('f2')",gate:()=>_fiche('f2')},
{n:3,ch:1,t:"Premier passage au jeu",do:"Le manche en 60 s. Ne cherche pas le record : cherche à ne plus hésiter.",crit:"12 notes trouvées en 60 s",go:"openGame()",gate:()=>_g('best')>=12},
{n:4,ch:1,t:"Les repères visuels",do:"Les cases 3, 5, 7, 9, 12 sont tes points d'ancrage. Lis la fiche.",crit:"Fiche validée",go:"openFiche('f3')",gate:()=>_fiche('f3')},
{n:5,ch:1,t:"Les octaves",do:"Une note trouvée = la même note partout. C'est le raccourci le plus rentable du manche.",crit:"Record octaves ≥ 8",go:"openOct()",gate:()=>_g('octBest')>=8},
{n:6,ch:1,t:"Le manche à 20",do:"Reviens au jeu. Objectif : 20 notes en 60 s. Tes zones aveugles sortent toutes seules.",crit:"20 notes en 60 s",go:"openGame()",gate:()=>_g('best')>=20},
{n:7,ch:1,t:"La carte de tes trous",do:"Regarde tes notes rouges et joue-les au hasard sur ta guitare, 5 minutes.",crit:"25 notes en 60 s",go:"openGame()",gate:()=>_g('best')>=25},

/* ---------- CH.2 : la main droite ---------- */
{n:8,ch:2,t:"Accorde, toujours",do:"Avant chaque séance. Une guitare fausse t'apprend de fausses références d'oreille.",crit:"Accordeur utilisé une fois",go:"openTuner()",gate:()=>_g('tuneBest')>0||_man(8),manual:true},
{n:9,ch:2,t:"Chromatique — propre",do:"Aller-retour STRICT. Les doigts restent posés. Métronome obligatoire.",crit:"Chromatique loguée à 80 BPM",go:"openExo('p1')",gate:()=>_bpm('p1')>=80},
{n:10,ch:2,t:"Chromatique — solide",do:"Même exercice, +20 BPM. Si ça bave, redescends : la propreté prime.",crit:"Chromatique à 100 BPM",go:"openExo('p1')",gate:()=>_bpm('p1')>=100},
{n:11,ch:2,t:"Le legato entre",do:"Hammer/pull par paires. Le son doit être ÉGAL entre note frappée et note liée.",crit:"Legato logué à 80 BPM",go:"openExo('l1')",gate:()=>_bpm('l1')>=80},
{n:12,ch:2,t:"Le palm mute",do:"La main droite qui ne s'arrête jamais. Profondeur de mute contrôlée.",crit:"Palm mute à 90 BPM",go:"openExo('r1')",gate:()=>_bpm('r1')>=90},
{n:13,ch:2,t:"Chromatique — rapide",do:"120 BPM. C'est le seuil où la technique devient utilisable en musique.",crit:"Chromatique à 120 BPM",go:"openExo('p1')",gate:()=>_bpm('p1')>=120},
{n:14,ch:2,t:"La penta en doubles",do:"Box 1 en doubles croches. Le pont entre exercice et vrai jeu.",crit:"Penta doubles à 70 BPM",go:"openExo('p2')",gate:()=>_bpm('p2')>=70},

/* ---------- CH.3 : la carte ---------- */
{n:15,ch:3,t:"Les intervalles dans la main",do:"Boussole, palier 1. Un intervalle est une FORME, pas un calcul.",crit:"Palier 1 de la Boussole ≥ 80 %",go:"boussoleBrief('c1')",gate:()=>_bous('c1')>=80},
{n:16,ch:3,t:"D'où vient la gamme majeure",do:"La formule 2-2-1-2-2-2-1. Lis la fiche, elle explique tout le reste.",crit:"Fiche validée",go:"openFiche('f7')",gate:()=>_fiche('f7')},
{n:17,ch:3,t:"Les toniques dans la position",do:"Boussole, palier 2. Sans tonique, tu joues des notes justes qui ne racontent rien.",crit:"Palier 2 ≥ 80 %",go:"boussoleBrief('c2')",gate:()=>_bous('c2')>=80},
{n:18,ch:3,t:"Tierces et quintes",do:"Boussole, palier 3. Ce sont tes cibles — le palier qui change tout.",crit:"Palier 3 ≥ 80 %",go:"boussoleBrief('c3')",gate:()=>_bous('c3')>=80},
{n:19,ch:3,t:"Les 5 boxes de la penta",do:"Une box par jour, improvise DEDANS deux minutes sur un backing.",crit:"Palier « Rapide » sur les 5 boxes",go:"openScale('sc1')",gate:()=>_pal('sc1')>=3},
{n:20,ch:3,t:"Les 5 positions majeures",do:"Boussole, palier 4. Les mêmes ancrages que tes boxes penta.",crit:"Palier 4 ≥ 80 %",go:"boussoleBrief('c4')",gate:()=>_bous('c4')>=80},
{n:21,ch:3,t:"Sortir des cages",do:"La diagonale : traverser le manche au lieu de rester enfermé dans une boîte.",crit:"Palier « Solide » sur la diagonale",go:"openScale('sc2')",gate:()=>_pal('sc2')>=2},

/* ---------- CH.4 : l'oreille ---------- */
{n:22,ch:4,t:"Poser un intervalle",do:"Salle Intervalles : 10 questions, sans chrono. Vise la forme.",crit:"Record intervalles ≥ 7/10",go:"openIntervals()",gate:()=>_g('intBest')>=7},
{n:23,ch:4,t:"Entendre un intervalle",do:"Salle Oreille. Utilise les chansons-repères, c'est fait pour.",crit:"Record oreille ≥ 6",go:"openEar()",gate:()=>_g('earBest')>=6},
{n:24,ch:4,t:"Entendre une couleur d'accord",do:"Majeur, mineur, 7e. La tierce décide de tout.",crit:"Record accords ≥ 6",go:"openEar()",gate:()=>_g('earChBest')>=6},
{n:25,ch:4,t:"L'app t'écoute vraiment",do:"« À la vraie guitare » : le micro juge, pas toi. C'est le test le plus honnête de l'app.",crit:"Record live ≥ 6/10",go:"openLive()",gate:()=>_g('liveBest')>=6},
{n:26,ch:4,t:"L'oreille au niveau des doigts",do:"Reviens aux intervalles. 9/10 : à ce stade tu ne devines plus.",crit:"Record intervalles ≥ 9/10",go:"openIntervals()",gate:()=>_g('intBest')>=9},

/* ---------- CH.5 : les modes ---------- */
{n:27,ch:5,t:"Harmoniser la gamme",do:"D'où viennent les accords d'une tonalité. C'est ce qui rend les modes évidents.",crit:"Fiche validée",go:"openFiche('f8')",gate:()=>_fiche('f8')},
{n:28,ch:5,t:"La note qui raconte",do:"Boussole, palier 5. Un mode sans sa note caractéristique ne s'entend pas.",crit:"Palier 5 ≥ 80 %",go:"boussoleBrief('c5')",gate:()=>_bous('c5')>=80},
{n:29,ch:5,t:"Accord → mode",do:"Boussole, palier 6. Le point le plus utile : tu déduis le mode de l'accord.",crit:"Palier 6 ≥ 80 %",go:"boussoleBrief('c6')",gate:()=>_bous('c6')>=80},
{n:30,ch:5,t:"Penser en degrés",do:"Arrêter de nommer des notes, nommer des fonctions. La fiche qui fait basculer.",crit:"Fiche validée",go:"openFiche('f10')",gate:()=>_fiche('f10')},
{n:31,ch:5,t:"Relier les positions",do:"Boussole, palier 7. « Je vais vers la sixte », pas « position 3 ».",crit:"Palier 7 ≥ 80 %",go:"boussoleBrief('c7')",gate:()=>_bous('c7')>=80},
{n:32,ch:5,t:"Le vamp dorien",do:"Jam Station, grille dorienne. Deux minutes sur la 6ᵉ majeure SEULE, puis libre.",crit:"Séance faite (sur l'honneur)",go:"openJamList()",gate:()=>_man(32),manual:true},

/* ---------- CH.6 : le répertoire ---------- */
{n:33,ch:6,t:"Ton premier solo complet",do:"Choisis un morceau du palier 1 et travaille-le jusqu'au bout. Pas 8 mesures : en entier.",crit:"Morceau validé (sur l'honneur)",go:"nav('rep')",gate:()=>_man(33),manual:true},
{n:34,ch:6,t:"Les bends justes",do:"Un bend faux ruine un solo entier. L'accordeur ne ment pas : contrôle-les.",crit:"Bends logués à 60 BPM",go:"openExo('b1')",gate:()=>_bpm('b1')>=60},
{n:35,ch:6,t:"Le solo au tempo",do:"Le même morceau, au tempo du disque, sans pause, enregistré.",crit:"Validé (sur l'honneur)",go:"nav('rep')",gate:()=>_man(35),manual:true},
{n:36,ch:6,t:"Liaison box 1 → box 2",do:"Les slides qui font que ça ne s'entend plus quand tu changes de position.",crit:"Liaison à 70 BPM",go:"openExo('s2')",gate:()=>_bpm('s2')>=70},
{n:37,ch:6,t:"Un deuxième morceau",do:"Un morceau d'un autre style que le premier. La polyvalence se construit tôt.",crit:"Validé (sur l'honneur)",go:"nav('rep')",gate:()=>_man(37),manual:true},

/* ---------- CH.7 : improviser ---------- */
{n:38,ch:7,t:"Une note, deux minutes",do:"Sur un vamp : UNIQUEMENT la note caractéristique du mode, en rondes. Austère et indispensable.",crit:"Fait (sur l'honneur)",go:"openJamList()",gate:()=>_man(38),manual:true},
{n:39,ch:7,t:"Trois notes",do:"Tonique, tierce, note caractéristique. Rien d'autre. Fais-en de la musique.",crit:"Fait (sur l'honneur)",go:"openJamList()",gate:()=>_man(39),manual:true},
{n:40,ch:7,t:"Atterrir",do:"Improvise librement, mais termine CHAQUE phrase sur une note cible.",crit:"Fait (sur l'honneur)",go:"openJamList()",gate:()=>_man(40),manual:true},
{n:41,ch:7,t:"Le protocole complet",do:"Boussole, palier 8 : les cinq contraintes, dans l'ordre, sur un backing.",crit:"Palier 8 fait",go:"boussoleBrief('c8')",gate:()=>_bous('c8')>=80},
{n:42,ch:7,t:"Le test du chant",do:"Enregistre 2 min. Réécoute. Peux-tu CHANTER ce que tu viens de jouer ? Sinon, tu as joué des notes, pas des phrases.",crit:"Enregistrement réécouté (sur l'honneur)",go:"openJamList()",gate:()=>_man(42),manual:true}
];
