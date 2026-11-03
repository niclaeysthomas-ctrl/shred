/* ================================================================
   LE PARCOURS — 7 modules, chaque notion en 7 temps.
   Une notion n'est « maîtrisée » qu'après un quiz réussi (≥ 80 %).
   Un module se débloque quand 60 % du précédent est validé,
   ou en réussissant son test de positionnement.
   ================================================================ */
import * as T from '../theory.js';
import { el, N, IV, rich, openModal, closeModal, toast } from '../ui.js';
import { MODULES, notionById } from '../content/lessons.js';
import { Fretboard, scaleMarks, compareMarks, voicingMarks, legend, STD_LEGEND } from '../fretboard.js';
import { runQuiz, makeQuestions } from '../quiz.js';
import { state, update, notion, markSeen, isValidated, validateNotion } from '../store.js';
import { techById, parseTab } from '../content/technique.js';
import { playNotes, closeVoicing } from '../audio.js';

export function moduleProgress(m) {
  const ready = m.notions.filter(n => n.ready);
  const ok = ready.filter(n => isValidated(n.id)).length;
  return { ok, total: ready.length, pct: ready.length ? ok / ready.length : 0 };
}

/* Le module 5 (technique) se travaille en parallèle, dès le début */
const REQUIRES = { m1: null, m2: 'm1', m3: 'm2', m4: 'm3', m5: null, m6: 'm4', m7: null };
export const PARALLEL = new Set(['m5']);
export function isUnlocked(m) {
  const req = REQUIRES[m.id];
  if (!req) return true;
  if ((state().unlocked || []).includes(m.id)) return true;
  const prev = MODULES.find(x => x.id === req);
  return prev && isUnlocked(prev) && moduleProgress(prev).pct >= 0.6;
}
export const requiredOf = m => MODULES.find(x => x.id === REQUIRES[m.id]);

/* Notions techniques : validées par un tempo propre (déclaré) ou une mesure au micro */
export function checkTechNotions() {
  const S = state(), newly = [];
  MODULES.find(m => m.id === 'm5').notions.forEach(n => {
    if (!n.tech || isValidated(n.id)) return;
    const t = techById(n.tech), r = S.tempos[n.tech];
    let ok = false;
    if (n.measure) ok = (S.measures?.[n.tech] || []).some(x => x.ok);
    else if (t && t.start) ok = !!(r && r.clean >= passBpmOf(t));
    if (ok) { validateNotion(n.id, n.measure ? 'mesure' : 'tempo'); newly.push(n.title); }
  });
  return newly;
}
export const passBpmOf = t => t.start ? Math.round(t.start + (t.target - t.start) * 0.5) : 0;

export function currentModule() {
  return MODULES.find(m => !PARALLEL.has(m.id) && isUnlocked(m) && moduleProgress(m).pct < 1) || MODULES[0];
}

export function nextNotion({ module = null } = {}) {
  for (const m of MODULES) {
    if (!isUnlocked(m)) continue;
    if (module ? m.id !== module : PARALLEL.has(m.id)) continue;
    const n = m.notions.find(x => x.ready && !isValidated(x.id));
    if (n) return { module: m, notion: n };
  }
  return null;
}

export function render(main, params) {
  main.append(el('div', 'page-head',
    el('div', null, el('div', 'eyebrow', 'Parcours'), el('h1', null, 'Ta formation, module par module'),
      el('p', null, 'Six mois pour poser les bases, puis un entretien continu. Chaque notion : une explication simple, la théorie, le manche, un exercice à la guitare, un exercice musical, et un quiz qui valide (ou non) la notion.'))));

  const legendRow = el('div', 'row hint', el('span', 'notion', el('span', 'st'), 'pas commencée'), el('span', 'notion', el('span', 'st seen'), 'étudiée'), el('span', 'notion', el('span', 'st ok', '✓'), 'validée (quiz, tempo ou mesure)'), el('span', 'notion', el('span', 'st rev', '!'), 'à revoir (raté en évaluation)'));
  legendRow.querySelectorAll('.notion').forEach(n => { n.style.width = 'auto'; n.style.padding = '4px 8px'; });
  main.append(legendRow);

  const cur = currentModule();
  MODULES.forEach(m => {
    const unlocked = isUnlocked(m), pr = moduleProgress(m);
    const box = el('div', 'module' + (unlocked ? '' : ' locked') + (m === cur || params.m === m.id ? ' open' : ''));
    const head = el('button', { class: 'module-head', onclick: () => box.classList.toggle('open') },
      el('div', 'module-num', unlocked ? String(m.n) : '🔒'),
      el('div', 't', el('b', null, m.title), el('small', null, `${m.when} · ${m.goal}`)),
      pr.total ? el('div', { style: { width: '110px' } }, el('div', 'progress' + (pr.pct === 1 ? ' ok' : ''), el('i', { style: { width: (pr.pct * 100) + '%' } })), el('small', { class: 'mono hint' }, `${pr.ok}/${pr.total} validées`)) : el('span', 'tag', 'à venir'));
    const body = el('div', 'module-body');
    if (!unlocked) {
      const prev = requiredOf(m);
      body.append(el('p', { class: 'hint', style: { padding: '8px 12px' } }, `Se débloque à 60 % du module ${prev.n} (${Math.round(moduleProgress(prev).pct * 100)} % pour l’instant).`));
      if (m.notions.some(n => n.ready)) body.append(el('div', { style: { padding: '0 12px 10px' } }, el('button', { class: 'btn ghost sm', onclick: () => placementTest(m) }, 'Je pense déjà savoir : test de positionnement')));
    }
    m.notions.forEach(n => {
      if (!n.ready) { body.append(el('div', 'notion soon', el('span', 'st'), el('div', null, el('b', null, n.title), el('small', null, 'Contenu prévu dans une prochaine version')))); return; }
      const s = notion(n.id);
      const cls = s.review ? 'rev' : s.validated ? 'ok' : s.seen ? 'seen' : '';
      const last = s.attempts.length ? s.attempts[s.attempts.length - 1] : null;
      body.append(el('button', { class: 'notion', onclick: () => unlocked ? openLesson(n.id) : toast('Module verrouillé : passe le test de positionnement ou termine le module précédent.') },
        el('span', 'st ' + cls, s.validated && !s.review ? '✓' : s.review ? '!' : ''),
        el('div', null, el('b', null, n.title), el('small', null, n.short + (last ? ` · dernier quiz ${Math.round(100 * last.score / last.total)} %` : ''))),
        el('span', { class: 'chev', style: { marginLeft: 'auto', color: 'var(--faint)' } }, '›')));
    });
    box.append(head, body);
    main.append(box);
  });

  if (params.n) {
    const id = params.n;
    history.replaceState(null, '', '#/parcours' + (params.m ? '?m=' + params.m : ''));
    setTimeout(() => openLesson(id), 50);
  }
}

function placementTest(m) {
  const gens = [...new Set(m.notions.filter(n => n.ready).flatMap(n => n.gens))];
  openModal(`Test de positionnement — module ${m.n}`, body => {
    body.append(el('p', 'lead', `15 questions sur tout le module ${m.n}. À 80 %, le module est débloqué. Les notions ne sont pas validées pour autant : chacune garde son propre quiz.`));
    runQuiz(body, { gens, n: 15, kind: 'placement-' + m.id, onDone: r => {
      if (r.score / r.total >= 0.8) {
        update(s => { s.unlocked = [...new Set([...(s.unlocked || []), m.id])]; });
        body.append(el('p', { class: 'callout', html: `<b>Module ${m.n} débloqué.</b>` }), el('button', { class: 'btn', onclick: () => { closeModal(); location.hash = '#/parcours?m=' + m.id; dispatchEvent(new HashChangeEvent('hashchange')); } }, 'Voir le module'));
      }
    } });
  });
}

/* ---------------- la leçon ---------------- */
const STEPS = [['simple', '1 · L’idée'], ['deep', '2 · En profondeur'], ['fb', '3 · Sur le manche'], ['practice', '4 · À la guitare'], ['musical', '5 · En musique'], ['quiz', '6 · Vérifier']];

export function openLesson(id, { startStep = 0, onValidated } = {}) {
  const n = notionById(id);
  if (!n || !n.ready) return toast('Notion introuvable.');
  markSeen(id);
  openModal(n.title, body => {
    let step = startStep;
    const tabs = el('div', 'steps');
    const content = el('div');
    body.append(tabs, content);
    const draw = () => {
      tabs.innerHTML = '';
      STEPS.forEach(([k, label], i) => tabs.append(el('button', { class: (i === step ? 'on' : i < step ? 'done' : ''), onclick: () => { step = i; draw(); } }, label)));
      content.innerHTML = '';
      const k = STEPS[step][0];
      if (k === 'simple' || k === 'deep') content.append(el('div', { class: 'lesson-txt', html: rich(n[k]) }));
      if (k === 'fb' && !n.fb && n.tech) {
        const t = techById(n.tech);
        const F = new Fretboard({ frets: 15, compact: true });
        F.setMarks(parseTab(t.tab).map(e => ({ s: e.s, f: e.f, label: String(e.f), role: 'root' })));
        content.append(el('pre', 'tab', t.tab.join('\n')), el('p', 'mono', t.picks ? 'Médiator : ' + t.picks : ''), F.root, el('p', 'hint', 'Le Technique Lab anime ce mouvement note par note au métronome.'));
      } else if (k === 'fb') {
        content.append(lessonFretboard(n.fb), el('p', { class: 'callout', html: rich(n.fbNote || '') }));
        if (n.link) content.append(el('a', { class: 'btn ghost sm', href: n.link.href, onclick: () => closeModal() }, n.link.label + ' →'));
      }
      if (k === 'practice' && n.tech) content.append(el('a', { class: 'btn ghost sm', href: '#/technique?ex=' + n.tech, onclick: () => closeModal() }, 'Ouvrir l’exercice →'));
      if (k === 'practice') content.append(el('div', 'eyebrow', 'Exercice pratique · guitare en main'), el('div', { class: 'lesson-txt', html: rich(n.practice) }),
        el('p', 'hint', 'Cet exercice ne se corrige pas tout seul : l’app ne t’entend pas. C’est le quiz (étape 6) qui valide la notion.'));
      if (k === 'musical') {
        content.append(el('div', 'eyebrow', 'Exercice musical · utiliser la notion'), el('div', { class: 'lesson-txt', html: rich(n.musical) }));
        if (n.impro) {
          const href = n.impro.exercise === 'modes' ? `#/impro?ex=modes&mode=${n.impro.mode}` : '#/impro?ex=' + n.impro.exercise;
          content.append(el('a', { class: 'btn', href, onclick: () => closeModal() }, '♫ Ouvrir dans l’Impro Studio'));
        }
      }
      if (k === 'quiz' && n.tech) {
        const t = techById(n.tech), s = notion(id);
        content.append(el('p', 'lead', s.validated ? `Validée le ${s.validated}.` : 'Cette notion ne se valide pas par un quiz mais par la pratique :'),
          el('div', { class: 'callout', html: n.measure ? `<b>Mesure au micro</b> : ${n.measure === 'bend' ? 'un bend tenu à ±10 cents de la cible' : 'un vibrato d’au moins 30 cents d’amplitude et 70 % de régularité'}, mesuré dans le Technique Lab. C’est une vraie mesure de hauteur.` : `<b>Tempo propre</b> : ${passBpmOf(t)} BPM sur « ${t.name} », déclaré par toi après 3 passages propres au métronome. L’app ne t’entend pas : c’est un engagement envers toi-même.` }),
          el('p', { html: '<b>Critère de réussite de l’exercice :</b> ' + t.success }),
          el('a', { class: 'btn', href: '#/technique?ex=' + n.tech, onclick: () => closeModal() }, 'Ouvrir l’exercice dans le Technique Lab'));
      }
      if (k === 'quiz' && !n.tech) {
        const s = notion(id);
        content.append(el('p', 'lead', s.validated ? `Validée le ${s.validated}. Refaire le quiz ne peut pas te faire perdre la validation ; seule une évaluation ratée la remet « à revoir ».` : '10 questions générées à partir de la théorie. 80 % pour valider. Chaque erreur est expliquée.'));
        runQuiz(content, { gens: n.gens, n: 10, notionId: id, onDone: r => { if (r.passed) { toast('Notion validée ✓', 'ok'); onValidated && onValidated(); } } });
      }
      if (k !== 'quiz') {
        const nav = el('div', 'lesson-nav');
        nav.append(step > 0 ? el('button', { class: 'btn ghost', onclick: () => { step--; draw(); } }, '← Précédent') : el('span'));
        nav.append(el('button', { class: 'btn', onclick: () => { step++; draw(); body.parentElement.scrollTop = 0; body.closest('.modal-back').scrollTop = 0; } }, step === STEPS.length - 2 ? 'Passer au quiz →' : 'Suivant →'));
        content.append(nav);
      }
    };
    draw();
  }, { wide: true, onClose: () => { if (location.hash.startsWith('#/parcours')) dispatchEvent(new HashChangeEvent('hashchange')); } });
}

/* Le manche d'exemple d'une notion */
export function lessonFretboard(fb) {
  const wrap = el('div');
  const F = new Fretboard({ frets: 15 });
  wrap.append(F.root);
  if (!fb) return wrap;
  if (fb.kind === 'interval') {
    const tpc = T.pcOf(fb.tonic), want = new Map(fb.ivs.map(l => [(tpc + T.parseInterval(l).semis) % 12, l]));
    const marks = [];
    for (let s = 0; s < 6; s++) for (let f = 2; f <= 9; f++) { const l = want.get(T.pcAt(s, f)); if (l) marks.push({ s, f, label: IV(l), role: T.ivRole(l), cls: (s === 0 && f === 5) ? 'emph' : '' }); }
    F.setMarks(marks); F.setZone({ from: 2, to: 9 });
    wrap.append(legend(STD_LEGEND.filter(([r]) => fb.ivs.some(l => T.ivRole(l) === r))));
  } else if (fb.kind === 'scale') {
    const notes = T.buildScale(fb.tonic, fb.scale);
    F.setMarks(scaleMarks(notes, { labels: fb.labels || 'note' }));
    wrap.append(legend(STD_LEGEND.filter(([r]) => notes.some(n => T.ivRole(n.iv) === r))));
    wrap.append(el('div', 'row', el('span', 'hint', `${N(fb.tonic)} ${T.SCALES[fb.scale].name.toLowerCase()} : ${notes.map(n => N(n.name)).join(' ')}`)));
  } else if (fb.kind === 'naturals') {
    const marks = [];
    for (let s = 0; s < 6; s++) for (let f = 0; f <= 15; f++) { const nm = T.PC_NAMES[T.pcAt(s, f)]; if (nm.length === 1) marks.push({ s, f, label: N(nm), role: nm === 'E' || nm === 'F' || nm === 'B' || nm === 'C' ? 'fourth' : 'none' }); }
    F.setMarks(marks);
    wrap.append(el('p', 'hint', 'En rose : E, F, B, C — les paires séparées d’un seul demi-ton.'));
  } else if (fb.kind === 'chord') {
    const notes = T.buildChord(fb.root, fb.type);
    let marks = scaleMarks(notes, { labels: fb.labels || 'iv' });
    if (fb.scaleCtx) {
      const sc = T.buildScale(fb.scaleCtx.tonic, fb.scaleCtx.scale), cp = new Set(notes.map(n => n.pc));
      marks = marks.concat(scaleMarks(sc, { labels: 'note' }).filter(m => !cp.has(T.pcAt(m.s, m.f))).map(m => ({ ...m, cls: 'ghost', role: 'none' })));
      wrap.append(el('p', 'hint', `En transparence : ${N(fb.scaleCtx.tonic)} ${T.SCALES[fb.scaleCtx.scale].name.toLowerCase()}.`));
    }
    if (fb.overlay) {
      const o = T.buildChord(fb.overlay.root, fb.overlay.type), cp = new Set(notes.map(n => n.pc));
      marks = scaleMarks(notes, { labels: 'note' }).map(m => o.some(x => x.pc === T.pcAt(m.s, m.f)) ? { ...m, role: 'common' } : { ...m, cls: 'emph' });
      marks = marks.concat(scaleMarks(o, { labels: 'note' }).filter(m => !cp.has(T.pcAt(m.s, m.f))).map(m => ({ ...m, cls: 'outline' })));
      wrap.append(legend([['common', 'Notes communes'], ['root', `Seulement dans ${N(fb.root)}${T.CHORD_TYPES[fb.type].sym}`]]),
        el('p', 'hint', `Cercles vides : la note propre à ${N(fb.overlay.root)}${T.CHORD_TYPES[fb.overlay.type].sym}.`));
    }
    F.setMarks(marks);
    if (!fb.overlay) wrap.append(legend(STD_LEGEND.filter(([r]) => notes.some(n => T.ivRole(n.iv) === r))));
    wrap.append(el('button', { class: 'btn ghost sm', onclick: () => playNotes(closeVoicing(notes.map(n => n.pc), 48)) }, `▶ Écouter ${N(fb.root)}${T.CHORD_TYPES[fb.type].sym}`));
  } else if (fb.kind === 'compareChords') {
    const a = T.buildChord(fb.root, fb.a), b = T.buildChord(fb.root, fb.b);
    const pa = new Set(a.map(n => n.pc)), pb = new Set(b.map(n => n.pc));
    const marks = [];
    for (let s = 0; s < 6; s++) for (let f = 0; f <= 15; f++) {
      const pc = T.pcAt(s, f);
      if (pa.has(pc) && pb.has(pc)) marks.push({ s, f, label: N(a.find(n => n.pc === pc).name), role: pc === a[0].pc ? 'root' : 'common' });
      else if (pa.has(pc)) marks.push({ s, f, label: N(a.find(n => n.pc === pc).name), role: 'diffA', cls: 'emph' });
      else if (pb.has(pc)) marks.push({ s, f, label: N(b.find(n => n.pc === pc).name), role: 'diffB', cls: 'outline' });
    }
    F.setMarks(marks);
    wrap.append(legend([['common', 'Communes'], ['diffA', `${N(fb.root)}${T.CHORD_TYPES[fb.a].sym}`], ['diffB', `${N(fb.root)}${T.CHORD_TYPES[fb.b].sym}`]]),
      el('div', 'row', el('button', { class: 'btn ghost sm', onclick: () => playNotes(closeVoicing(a.map(n => n.pc), 48)) }, '▶ ' + N(fb.root) + (T.CHORD_TYPES[fb.a].sym || '')), el('button', { class: 'btn ghost sm', onclick: () => playNotes(closeVoicing(b.map(n => n.pc), 48)) }, '▶ ' + N(fb.root) + T.CHORD_TYPES[fb.b].sym)));
  } else if (fb.kind === 'compare') {
    const c = T.compareScales(fb.tonic, fb.a, fb.b);
    F.setMarks(compareMarks(c, { labels: fb.labels || 'iv' }));
    wrap.append(legend([['root', 'Tonique'], ['common', 'Communes'], ['diffA', 'Seulement en ' + T.SCALES[fb.a].name.toLowerCase()], ['diffB', 'Seulement en ' + T.SCALES[fb.b].name.toLowerCase()]]),
      el('p', 'hint', `${N(fb.tonic)} ${T.SCALES[fb.a].name.toLowerCase()} : ${c.A.map(n => N(n.name) + ' (' + IV(n.iv) + ')').join(' ')}`));
  } else if (fb.kind === 'triads') {
    const shapes = T.triadShapes(fb.root, fb.type, T.STRING_SETS[fb.set || 0]);
    const marks = [];
    shapes.forEach(sh => sh.strings.forEach((s, i) => marks.push({ s, f: sh.frets[i], label: IV(sh.notes[i].iv), role: T.ivRole(sh.notes[i].iv) })));
    F.setMarks(marks);
    wrap.append(el('p', 'hint', shapes.map(sh => ['Fondamental', '1er renv.', '2e renv.'][sh.inversion] + ' : cases ' + sh.frets.join('-')).join(' · ')));
  }
  return wrap;
}
