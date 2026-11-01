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
];
export const techById = id => TECHNIQUE.find(t => t.id === id);
