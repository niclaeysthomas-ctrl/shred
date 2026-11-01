/* EAR TRAINING — sons générés dans le navigateur (corde pincée synthétique), correction détaillée */
import { el, openModal } from '../ui.js';
import { state, isValidated } from '../store.js';
import { runQuiz } from '../quiz.js';
import '../quiz2.js';
import { openLesson } from './path.js';
import { MODULES } from '../content/lessons.js';

const EX = [
  ['earIntervals', 'Intervalles', 'Montants, descendants, simultanés. Avec un morceau repère pour chacun.', 'm7-intervals'],
  ['earChords', 'Majeur ou mineur', 'La première chose à entendre.', 'm7-chords'],
  ['earTriads', 'Les triades', 'Majeur, mineur, diminué, augmenté, sus2, sus4.', 'm7-chords'],
  ['earSevenths', 'Accords de septième', 'maj7, m7, 7, m7♭5.', 'm7-chords'],
  ['earCompare', 'Comparer deux accords', 'Identiques ou différents ? Et quelle note change.', 'm7-chords'],
  ['earDegrees', 'Les degrés', 'Une cadence installe la tonalité, puis une note : quel degré ?', 'm7-degrees'],
  ['earMelody', 'Mélodie à reproduire', '3-4 notes à retrouver dans l’ordre.', 'm7-melody'],
  ['earModes', 'Reconnaître un mode', 'Une gamme sur un bourdon : laquelle ?', 'm7-transcribe'],
  ['earTranscribe', 'Transcription', 'Une phrase blues-rock à relever.', 'm7-transcribe']
];

export function render(main) {
  main.append(el('div', 'page-head', el('div', null, el('div', 'eyebrow', 'Oreille'), el('h1', null, 'Ear Training'),
    el('p', null, 'Des séries courtes (10 questions), souvent : 5 minutes par jour valent mieux qu’une heure par semaine. Les sons sont synthétisés (corde pincée) : monte le volume, ou mieux, un casque.'))));
  const S = state();
  const g = el('div', 'grid-auto');
  EX.forEach(([gen, title, desc]) => {
    const st = (S.genStats || {})[gen];
    const pct = st && st.recent && st.recent.length ? Math.round(100 * st.recent.reduce((a, b) => a + b, 0) / st.recent.length) : null;
    g.append(el('button', { class: 'card-link', onclick: () => openModal(title, body => runQuiz(body, { gens: [gen], n: 10, kind: 'ear' }), { onClose: () => dispatchEvent(new HashChangeEvent('hashchange')) }) },
      el('div', null, el('b', null, title), el('small', null, desc + (pct != null ? ` · réussite récente ${pct} %` : ''))), el('span', 'chev', '›')));
  });
  main.append(g);

  const m7 = MODULES.find(m => m.id === 'm7');
  const v = el('div', 'panel');
  v.append(el('h3', null, 'Valider les notions du module 7'), el('p', 'hint', 'L’entraînement ci-dessus ne valide rien : c’est de la pratique. Pour valider une notion, passe son quiz (questions mélangées, 80 %).'));
  m7.notions.forEach(n => v.append(el('button', { class: 'notion', onclick: () => openLesson(n.id) }, el('span', 'st ' + (isValidated(n.id) ? 'ok' : S.notions[n.id]?.seen ? 'seen' : ''), isValidated(n.id) ? '✓' : ''), el('div', null, el('b', null, n.title), el('small', null, n.short)))));
  main.append(v);
}
