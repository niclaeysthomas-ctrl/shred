/* Exercices techniques utilisés dans la séance du jour.
   Introduits par ordre de pertinence pour ton profil : le médiator d'abord,
   puis legato / bends / vibrato, palm mute pour tes styles. Tapping et sweep plus tard.
   tab : lignes de tablature (corde aiguë en haut) ; picks : sens du médiator. */
export const TECHNIQUE = [
  {
    id: 'pick-basics', name: 'Médiator : tenue et attaque', cat: 'Médiator', level: 1, minutes: 5, start: 60, target: 90, unit: 'croches',
    goal: 'Installer une tenue de médiator détendue et une attaque minimale.',
    how: 'Médiator pincé entre la pulpe du pouce et le côté de l’index, 2-3 mm qui dépassent. Le mouvement vient du poignet (comme secouer de l’eau), pas du coude. Attaque la corde avec la pointe, à plat ou légèrement incliné. Mouvement le plus petit possible.',
    tab: ['e|-----------------|', 'B|-----------------|', 'G|-----------------|', 'D|-----------------|', 'A|-----------------|', 'E|-0-0-0-0-0-0-0-0-|'],
    picks: '↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑',
    success: '1 minute sans à-coup ni changement de volume entre les ↓ et les ↑, épaule et mâchoire détendues.'
  },
  {
    id: 'alt-1string', name: 'Alternate picking — une corde', cat: 'Médiator', level: 1, minutes: 5, start: 60, target: 120, unit: 'doubles croches',
    goal: 'Synchroniser main droite et main gauche sur une corde.',
    how: '[[alternate picking|Aller-retour]] strict, 4 notes par clic. Commence chaque groupe de 4 par un coup vers le bas. Monte de 4 BPM seulement quand 3 passages d’affilée sont propres.',
    tab: ['e|-----------------|', 'B|-----------------|', 'G|-5-7-8-7-5-7-8-7-|', 'D|-----------------|', 'A|-----------------|', 'E|-----------------|'],
    picks: '↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑',
    success: 'Toutes les notes au même volume, pile sur le clic, sans tension. Si ça bave : redescends de 8 BPM.'
  },
  {
    id: 'alt-cross', name: 'Alternate picking — changement de corde', cat: 'Médiator', level: 2, minutes: 5, start: 60, target: 110, unit: 'doubles croches',
    goal: 'Changer de corde sans casser l’aller-retour (le vrai problème de vitesse).',
    how: 'Penta mineure de A, boîte 1, 2 notes par corde. Le changement de corde se fait parfois sur un ↑ (« inside picking »), parfois sur un ↓ (« outside »). Garde le poignet souple et le médiator près des cordes.',
    tab: ['e|---------------------5-8-|', 'B|-----------------5-8-----|', 'G|-------------5-7---------|', 'D|---------5-7-------------|', 'A|-----5-7-----------------|', 'E|-5-8---------------------|'],
    picks: '↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑',
    success: 'Montée et descente propres 3 fois de suite au tempo du jour.'
  },
  {
    id: 'palm-mute', name: 'Palm mute — riff grunge/metal', cat: 'Médiator', level: 1, minutes: 5, start: 80, target: 140, unit: 'croches',
    goal: 'Un [[palm mute]] régulier et des accents nets, en ↓ uniquement.',
    how: 'Tranche de la main droite posée sur les cordes juste devant le chevalet. Trop en avant = étouffé mort ; trop en arrière = pas d’effet. Coups vers le bas uniquement (c’est le son du metal). Les accents (>) se jouent sans mute.',
    tab: ['e|-----------------|', 'B|-----------------|', 'G|-----------------|', 'D|-------------2---|', 'A|-------------2---|', 'E|-0-0-0-0-0-0-0---|', '  PM-----------  >'],
    picks: '↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓',
    success: 'Volume constant sur les notes étouffées, accent qui ressort, avant-bras détendu au bout d’une minute.'
  },
  {
    id: 'tremolo', name: 'Trémolo picking', cat: 'Médiator', level: 2, minutes: 4, start: 70, target: 130, unit: 'doubles croches',
    goal: 'Un trémolo régulier pour les mélodies shoegaze et metal.',
    how: 'Aller-retour très rapide et très petit sur une note, en suivant une mélodie lente. Le mouvement vient du poignet, l’avant-bras ne se crispe pas. Commence en doubles croches au métronome avant de « lâcher » le tempo.',
    tab: ['e|-----------------|', 'B|-8-8-8-8-7-7-7-7-|', 'G|-----------------|', 'D|-----------------|', 'A|-----------------|', 'E|-----------------|'],
    picks: '↓↑↓↑ ↓↑↓↑',
    success: 'Doubles croches régulières, changement de note sans trou.'
  },
  {
    id: 'legato', name: 'Legato : hammer-on / pull-off', cat: 'Main gauche', level: 2, minutes: 5, start: 60, target: 100, unit: 'triolets',
    goal: 'Des notes liées aussi fortes que les notes attaquées.',
    how: 'Une seule attaque par corde. Hammer-on : le doigt « tombe » sur la case, au bout du doigt, juste derrière la frette. Pull-off : le doigt tire légèrement la corde vers le bas en la quittant (il la pince). Travaille sur la corde de Sol, puis de Si, puis sur la corde de La en position 7.',
    tab: ['e|-----------------|', 'B|-----------------|', 'G|-5h7p5-5h8p5-7h8p7|', 'D|-----------------|', 'A|-----------------|', 'E|-----------------|'],
    picks: '↓ (une attaque par groupe)',
    success: 'Les 3 notes de chaque triolet au même volume, en rythme.'
  },
  {
    id: 'bends', name: 'Bends justes', cat: 'Expression', level: 2, minutes: 4, start: null, target: null, unit: '',
    goal: 'Atteindre exactement la note visée (1/2 ton, 1 ton).',
    how: 'Joue d’abord la note cible (ex. case 9 corde de Sol = E), écoute-la, puis bende depuis la case 7 jusqu’à retrouver exactement ce son. Pousse avec 3 doigts (2 en renfort derrière), le poignet tourne comme une poignée de porte. Le bouton « Note cible » joue la référence.',
    tab: ['e|---------------------|', 'B|---------------------|', 'G|-9--7b9--7b9r7-------|', 'D|---------------------|', 'A|---------------------|', 'E|---------------------|'],
    refMidi: 64, picks: '',
    success: 'Sur 5 bends, la note est juste à l’oreille 5 fois (compare avec la référence, ou enregistre-toi).'
  },
  {
    id: 'vibrato', name: 'Vibrato régulier (à la Gilmour)', cat: 'Expression', level: 2, minutes: 4, start: 60, target: 80, unit: 'oscillations à la croche',
    goal: 'Un vibrato large, lent et régulier, calé sur le tempo.',
    how: 'Après un bend d’un ton tenu, fais osciller entre « un peu relâché » et « juste » : 2 oscillations par clic (croches). Le mouvement vient du poignet. La note du haut doit rester juste, c’est l’amplitude qui varie.',
    tab: ['e|-----------------|', 'B|-----------------|', 'G|-7b9~~~~~~~~-----|', 'D|-----------------|', 'A|-----------------|', 'E|-----------------|'],
    picks: '',
    success: 'Oscillations régulières et calées sur le clic pendant 8 temps, sans perte de justesse.'
  },
  {
    id: 'slides', name: 'Slides et changements de position', cat: 'Main gauche', level: 1, minutes: 4, start: 60, target: 90, unit: 'croches',
    goal: 'Relier les positions de gamme par des glissés.',
    how: 'Le doigt garde la pression en glissant (sinon la note meurt). Arrive pile sur la case, sans dépasser. Utilise-les pour passer d’une boîte de penta à la suivante.',
    tab: ['e|-----------------|', 'B|-----------------|', 'G|-5-7/9-7-9\\7-5---|', 'D|-----------------|', 'A|-----------------|', 'E|-----------------|'],
    picks: '↓ ↑ ↓ ↑',
    success: 'Arrivée juste et en rythme, note de destination aussi forte que celle de départ.'
  }
,
  {
    id: 'gallop', name: 'Gallop metal (palm mute)', cat: 'Médiator', level: 2, minutes: 4, start: 80, target: 150, unit: 'croches + doubles',
    goal: 'Le rythme « croche – deux doubles » du metal, palm mute serré.',
    how: 'Motif ↓ ↓↑ (une croche, deux doubles croches) sur la corde de Mi à vide, en [[palm mute]]. Le coup vers le haut doit être aussi fort que les coups vers le bas. Puis déplace le motif sur un power chord (case 0 → 3 → 5).',
    tab: ['e|------------------|', 'B|------------------|', 'G|------------------|', 'D|------------------|', 'A|------------------|', 'E|-0--0-0-0--0-0-0--0-0|', '  PM---------------'],
    picks: '↓ ↓ ↑', perBeat: 3,
    success: 'Gallop régulier sur 8 mesures, sans que le ↑ disparaisse.'
  },
  {
    id: 'economy', name: 'Economy picking', cat: 'Médiator', level: 3, minutes: 5, start: 60, target: 110, unit: 'triolets',
    goal: 'Changer de corde en « balayant » dans le sens du mouvement.',
    how: 'Quand on passe à la corde suivante dans le sens du coup de médiator, on enchaîne d’un seul geste (deux ↓ de suite en montant vers les aigus). Ailleurs, on alterne. Plus fluide que l’alternate strict pour les gammes à 3 notes par corde.',
    tab: ['e|-----------------|', 'B|-----------5-7-8-|', 'G|-----5-7-9-------|', 'D|-5-7-------------|', 'A|-----------------|', 'E|-----------------|'],
    picks: '↓ ↑ ↓ ↓ ↑ ↓ ↓ ↑', perBeat: 3,
    success: 'Les doubles ↓ sont liés en un seul geste, rythme régulier.'
  },
  {
    id: 'hammer-pull', name: 'Hammer-on / pull-off isolés', cat: 'Main gauche', level: 1, minutes: 4, start: 60, target: 100, unit: 'croches',
    goal: 'Des liaisons nettes avant de les enchaîner en legato.',
    how: 'Hammer-on : frappe la corde du bout du doigt, juste derrière la frette, sans réattaquer. Pull-off : tire légèrement la corde vers le sol en lâchant. Une attaque, deux notes, même volume.',
    tab: ['e|-----------------|', 'B|-----------------|', 'G|-5h7--5h7--7p5--7p5|', 'D|-----------------|', 'A|-----------------|', 'E|-----------------|'],
    picks: '↓ (une attaque par paire)',
    success: 'La note liée est aussi forte que la note attaquée.'
  },
  {
    id: 'tapping', name: 'Tapping (à la Van Halen / Slash live)', cat: 'Main gauche', level: 3, minutes: 4, start: 60, target: 120, unit: 'triolets',
    goal: 'Tapper avec l’index ou le majeur droit, enchaîner pull-off et hammer-on.',
    how: 'Tape la case 12 avec un doigt de la main droite, tire (pull-off) vers la case 5 tenue par la main gauche, puis hammer-on case 8. Étouffe les cordes graves avec la paume droite.',
    tab: ['e|-----------------|', 'B|-12p5h8-12p5h8---|', 'G|-----------------|', 'D|-----------------|', 'A|-----------------|', 'E|-----------------|'],
    picks: 'T = tap', perBeat: 3,
    success: 'Triolets réguliers sans bruit parasite sur les autres cordes.'
  },
  {
    id: 'sweep', name: 'Sweep picking (3 cordes)', cat: 'Médiator', level: 3, minutes: 4, start: 50, target: 100, unit: 'triolets',
    goal: 'Un arpège en un seul geste continu de médiator, notes séparées.',
    how: 'Le médiator « tombe » d’une corde à la suivante en un mouvement (↓↓↓ en descendant vers les aigus, ↑↑↑ en remontant). Chaque note doit être étouffée dès que la suivante sonne : main gauche qui relâche, sinon ça sonne comme un accord. Commence très lent.',
    tab: ['e|-------5-------|', 'B|-----5---5-----|', 'G|---6-------6---|', 'D|-7-----------7-|', 'A|---------------|', 'E|---------------|'],
    picks: '↓ ↓ ↓ ↓ ↑ ↑ ↑', perBeat: 3,
    success: 'Notes séparées (pas d’accord qui résonne) et régulières.'
  }
];
export const techById = id => TECHNIQUE.find(t => t.id === id);

/* Le module médiator : l'ordre recommandé pour passer des doigts au médiator */
export const PICK_PATH = ['pick-basics', 'alt-1string', 'palm-mute', 'alt-cross', 'gallop', 'tremolo', 'economy', 'sweep'];
export const perBeatOf = t => t.perBeat || (/doubles/.test(t.unit) ? 4 : /triolets/.test(t.unit) ? 3 : 2);

/* Lecture d'une tablature texte → suite d'événements { s, f, col } dans l'ordre de jeu */
export function parseTab(lines) {
  const strings = lines.filter(l => /^[eBGDAE]\|/.test(l)).slice(0, 6);
  if (strings.length !== 6) return [];
  const ev = [];
  strings.forEach((line, row) => {
    const s = 5 - row; // ligne 0 = mi aigu = corde 5
    const re = /\d+/g; let m;
    while ((m = re.exec(line))) ev.push({ s, f: +m[0], col: m.index });
  });
  return ev.sort((a, b) => a.col - b.col || a.s - b.s);
}

/* Mode « sans médiator » : exercices jouables aux doigts et conseils d'attaque */
export const needsPick = t => t.cat === 'Médiator';
const FINGER = {
  'legato': 'Aux doigts : une seule attaque (pouce ou index) par groupe de 3 notes, la main gauche fait sonner le reste. C’est même plus dur qu’au médiator : excellent pour la force des hammer-on.',
  'hammer-pull': 'Aux doigts : une attaque du pouce ou de l’index par paire, puis le hammer-on ou le pull-off doit sonner aussi fort que la note attaquée.',
  'bends': 'Aux doigts : attaque avec le pouce (côté chair), son plus rond. Les autres doigts de la main droite étouffent les cordes graves.',
  'vibrato': 'Aux doigts : attaque au pouce, puis pose les doigts libres de la main droite sur les cordes voisines pour qu’elles ne résonnent pas.',
  'slides': 'Aux doigts : alterne index et majeur (i‑m‑i‑m) comme un bassiste, pouce appuyé sur la corde de Mi grave. L’alternance prépare l’alternate picking.',
  'tapping': 'Aux doigts : tape avec le majeur de la main droite, l’index reste libre pour étouffer.',
};
export const fingerHint = t => FINGER[t.id] || 'Aux doigts : attaque avec le pouce, ou alterne index et majeur.';
