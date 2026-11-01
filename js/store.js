/* ================================================================
   SHRED v2 — stockage local (aucun compte, aucun serveur)
   - clé « shred3 » : tout ce qui est propre à la v2
   - clé « shred2 » : l'ancien Shred. On y lit ET on y écrit le temps
     de jeu (champ days) pour que les deux versions affichent le même
     chiffre. On ne touche à aucun autre champ de l'ancienne app.
   ================================================================ */

const KEY = 'shred3';
const LEGACY = 'shred2';

const DEFAULT = () => ({
  v: 1,
  created: today(),
  settings: { notes: 'anglo', sessionLen: 20, frets: 15, labels: 'note' },
  notions: {},          // id → { seen, attempts:[{d,score,total}], validated, review }
  quizLog: [],          // [{ d, notion, kind, score, total }]
  tempos: {},           // exId → { clean, history:[{d,bpm}] }
  impro: [],            // [{ d, exercise, level, style, key, self, note }]
  sessions: {},         // date → { len, plan:[...], done:[blockIds] }
  recent: [],           // dernières notions ouvertes
  assessments: [],      // [{ d, score, total, failed:[ids] }]
  goals: { short: '', long: '' },
  compos: [],           // idées enregistrées depuis le Chord Lab / l'impro
  unlocked: [],         // modules débloqués par test de positionnement
  improLevel: {}        // exercice → niveau actuel
});

export function today(d = new Date()) {
  const z = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
}

let S = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const base = DEFAULT();
    if (!raw) return base;
    const s = JSON.parse(raw);
    return { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}) }, goals: { ...base.goals, ...(s.goals || {}) } };
  } catch (e) {
    console.error('Lecture des données impossible', e);
    return DEFAULT();
  }
}

export function state() { return S; }

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
    listeners.forEach(fn => fn(S));
    return true;
  } catch (e) {
    console.error(e);
    window.dispatchEvent(new CustomEvent('shred:error', { detail: 'Sauvegarde impossible (stockage plein ou désactivé).' }));
    return false;
  }
}

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function update(fn) { fn(S); return save(); }

/* ---------------- temps de jeu (partagé avec l'ancien Shred) ---------------- */
function legacy() {
  try { return JSON.parse(localStorage.getItem(LEGACY) || '{}'); } catch (e) { return {}; }
}

export function days() { return legacy().days || {}; }

export function addPractice(sec) {
  if (!(sec > 0)) return;
  try {
    const L = legacy();
    L.days = L.days || {};
    const d = today();
    L.days[d] = L.days[d] || { sec: 0, tk: 0 };
    L.days[d].sec += Math.round(sec);
    localStorage.setItem(LEGACY, JSON.stringify(L));
    listeners.forEach(fn => fn(S));
  } catch (e) { console.error(e); }
}

export function minutesOn(d) { const r = days()[d]; return r ? Math.round(r.sec / 60) : 0; }

export function weekMinutes(weeksAgo = 0) {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // lundi = 0
  const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(now.getDate() - dow - 7 * weeksAgo);
  let total = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); total += minutesOn(today(d)); }
  return total;
}

export function lastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push({ d: today(d), min: minutesOn(today(d)) }); }
  return out;
}

export function streak() {
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (minutesOn(today(d)) > 0) n++; else if (i > 0) break;
  }
  return n;
}

/* ---------------- notions ---------------- */
export const PASS = 0.8;

export function notion(id) { return S.notions[id] || { seen: null, attempts: [], validated: null, review: false }; }

export function markSeen(id) {
  update(s => {
    const n = s.notions[id] || { seen: null, attempts: [], validated: null, review: false };
    n.seen = n.seen || today();
    s.notions[id] = n;
    s.recent = [id, ...s.recent.filter(x => x !== id)].slice(0, 8);
  });
}

export function recordQuiz(notionId, kind, score, total) {
  let passed = false;
  update(s => {
    s.quizLog.push({ d: today(), notion: notionId, kind, score, total });
    if (s.quizLog.length > 800) s.quizLog = s.quizLog.slice(-800);
    if (!notionId) return;
    const n = s.notions[notionId] || { seen: today(), attempts: [], validated: null, review: false };
    n.attempts.push({ d: today(), score, total });
    if (n.attempts.length > 30) n.attempts = n.attempts.slice(-30);
    if (total > 0 && score / total >= PASS) { passed = true; n.validated = n.validated || today(); n.review = false; }
    s.notions[notionId] = n;
  });
  return passed;
}

export function flagReview(ids) {
  update(s => ids.forEach(id => { const n = s.notions[id]; if (n) n.review = true; }));
}

export function isValidated(id) { const n = S.notions[id]; return !!(n && n.validated && !n.review); }

/* ---------------- tempos ---------------- */
export function recordTempo(exId, bpm) {
  update(s => {
    const t = s.tempos[exId] || { clean: 0, history: [] };
    t.history.push({ d: today(), bpm });
    if (t.history.length > 60) t.history = t.history.slice(-60);
    t.clean = Math.max(t.clean || 0, bpm);
    s.tempos[exId] = t;
  });
}

/* ---------------- sauvegarde manuelle ---------------- */
export function exportJSON() {
  return JSON.stringify({ app: 'shred', exported: new Date().toISOString(), shred3: S, shred2: legacy() }, null, 1);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== 'shred' || !data.shred3) throw new Error('Ce fichier n’est pas une sauvegarde Shred.');
  localStorage.setItem(KEY, JSON.stringify(data.shred3));
  if (data.shred2) localStorage.setItem(LEGACY, JSON.stringify(data.shred2));
  S = load();
  save();
}

export function resetV2() { S = DEFAULT(); save(); }

/* Une séance guidée est en cours : c'est elle qui compte le temps (évite le double comptage) */
let sessionLive = false;
export const setSessionLive = v => { sessionLive = v; };
export const isSessionLive = () => sessionLive;

/* Réussite par type de question (sert à repérer les difficultés persistantes) */
export function recordGenStats(results) {
  update(s => {
    s.genStats = s.genStats || {};
    results.forEach(r => {
      if (!r.gen) return;
      const g = s.genStats[r.gen] || { ok: 0, n: 0, recent: [] };
      g.n++; if (r.ok) g.ok++;
      g.recent = (g.recent || []).concat(r.ok ? 1 : 0).slice(-20);
      s.genStats[r.gen] = g;
    });
  });
}
