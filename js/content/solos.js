/* Répertoire de solos (le contenu détaillé vit dans l'ancien Shred, classic.html).
   Ici : l'ordre conseillé et les étapes, pour construire la séance du jour. */
export const SOLOS = [
  ['s_caya', 'Come As You Are', 'Nirvana'], ['s_slts', 'Smells Like Teen Spirit', 'Nirvana'], ['s_stone', 'Like a Stone', 'Audioslave'],
  ['s_change', 'Change (In the House of Flies)', 'Deftones'], ['s_thrill', 'The Thrill Is Gone', 'B.B. King'], ['s_brick', 'Another Brick in the Wall pt.2', 'Pink Floyd'],
  ['s_black', 'Back in Black', 'AC/DC'], ['s_stair', 'Stairway to Heaven', 'Led Zeppelin'], ['s_joe', 'Hey Joe', 'Jimi Hendrix'],
  ['s_sultans', 'Sultans of Swing', 'Dire Straits'], ['s_numb', 'Comfortably Numb (2ᵉ solo)', 'Pink Floyd'], ['s_hotel', 'Hotel California (l’outro)', 'Eagles'],
  ['s_nem', 'Nothing Else Matters', 'Metallica'], ['s_scom', 'Sweet Child o’ Mine (solo final)', 'Guns N’ Roses'], ['s_voodoo', 'Voodoo Child (Slight Return)', 'Jimi Hendrix']
].map(([id, t, a]) => ({ id, t, a }));

export const SOLO_STEPS = [
  ['ecoute', 'Écouter', 'Écoute le passage 3 fois sans guitare. Tu dois pouvoir chanter la première phrase avant de la jouer.'],
  ['carte', 'Décortiquer', 'Repère la tonalité et la position, puis joue une phrase de 2 à 4 mesures très lentement. Essaie de la retrouver d’abord à l’écoute, puis vérifie avec la tablature.'],
  ['lent', 'Au ralenti', 'Phrase par phrase au métronome, à un tempo où c’est propre. Trois fois sans faute, puis +5 BPM.'],
  ['tempo', 'Au tempo', 'Le solo entier au tempo, avec le morceau, trois fois de suite.'],
  ['prise', 'Enregistré', 'Enregistre-toi 45 s et réécoute. Ensuite, réutilise une phrase du solo dans une impro sur une backing track.']
].map(([k, n, d]) => ({ k, n, d }));

/* état du solo en cours, lu dans les données de l'ancien Shred (clé shred2) */
export function soloStatus() {
  let L = {};
  try { L = JSON.parse(localStorage.getItem('shred2') || '{}'); } catch (e) { }
  const rep = L.rep || {};
  const count = id => SOLO_STEPS.filter(s => rep[id]?.steps?.[s.k]).length;
  const cur = L.solo ? SOLOS.find(s => s.id === L.solo) : null;
  if (cur && count(cur.id) < SOLO_STEPS.length) { const n = count(cur.id); return { solo: cur, n, step: SOLO_STEPS[n] }; }
  const next = SOLOS.find(s => count(s.id) < SOLO_STEPS.length);
  return { solo: null, finished: cur, suggest: next || SOLOS[0] };
}
