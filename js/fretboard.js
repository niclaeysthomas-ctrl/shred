/* ================================================================
   SHRED v2 — le manche interactif (SVG)
   Espacement des frettes réaliste (règle des 12e de racine de 2),
   corde de Mi aigu en haut comme sur une tablature.
   ================================================================ */
import { pcAt, midiAt, TUNING, PC_NAMES, ivRole, parseInterval } from './theory.js';
import { el, N, IV } from './ui.js';
import { pluck } from './audio.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

export class Fretboard {
  constructor({ frets = 15, onTap = null, sound = true, compact = false, startFret = 0 } = {}) {
    this.frets = frets; this.onTap = onTap; this.sound = sound; this.compact = compact; this.startFret = startFret;
    this.marks = new Map();
    this.root = el('div', 'fb-wrap' + (compact ? ' compact' : ''));
    this.scroller = el('div', 'fb-scroll');
    this.root.append(this.scroller);
    this.draw();
  }

  geom() {
    const n = this.frets, s0 = this.startFret;
    const openW = s0 === 0 ? 44 : 14, right = 14;
    const width = this.compact ? Math.max(380, 64 + (n - s0) * 46) : Math.max(760, 80 + (n - s0) * 62);
    const K = (width - openW - right) / (1 - Math.pow(2, -n / 12) - (1 - Math.pow(2, -s0 / 12)));
    const base = 1 - Math.pow(2, -s0 / 12);
    const xf = f => openW + K * ((1 - Math.pow(2, -f / 12)) - base);
    const sp = this.compact ? 24 : 30, top = 16;
    const ys = s => top + (5 - s) * sp;
    return { width, height: top + 5 * sp + 34, xf, ys, sp, openW, top };
  }

  noteX(f) { const g = this.g; if (f === 0) return g.openW - 22; return (g.xf(f - 1) + g.xf(f)) / 2; }

  draw() {
    const g = this.g = this.geom();
    const S = this.svg = svg('svg', { viewBox: `0 0 ${g.width} ${g.height}`, class: 'fb', role: 'img', 'aria-label': 'Manche de guitare' });
    S.style.minWidth = (this.compact ? Math.min(g.width, 520) : g.width * 0.82) + 'px';
    const s0 = this.startFret;
    // bois
    S.append(svg('rect', { x: g.xf(s0), y: g.ys(5) - 12, width: g.xf(this.frets) - g.xf(s0), height: g.ys(0) - g.ys(5) + 24, rx: 4, class: 'fb-wood' }));
    this.zoneLayer = svg('g'); S.append(this.zoneLayer);
    // repères
    const inlays = [3, 5, 7, 9, 15, 17, 19, 21];
    for (let f = Math.max(1, s0 + 1); f <= this.frets; f++) {
      const cx = (g.xf(f - 1) + g.xf(f)) / 2, mid = (g.ys(0) + g.ys(5)) / 2;
      if (inlays.includes(f)) S.append(svg('circle', { cx, cy: mid, r: 5, class: 'fb-inlay' }));
      if (f === 12 || f === 24) { S.append(svg('circle', { cx, cy: mid - g.sp, r: 5, class: 'fb-inlay' })); S.append(svg('circle', { cx, cy: mid + g.sp, r: 5, class: 'fb-inlay' })); }
    }
    // frettes
    for (let f = s0; f <= this.frets; f++) {
      const x = g.xf(f);
      S.append(svg('line', { x1: x, x2: x, y1: g.ys(5) - 12, y2: g.ys(0) + 12, class: f === 0 ? 'fb-nut' : 'fb-fret' }));
      if (f > 0) { const t = svg('text', { x: (g.xf(f - 1) + x) / 2, y: g.height - 8, class: 'fb-num' + ([3, 5, 7, 9, 12, 15, 17, 19, 21].includes(f) ? ' mk' : '') }); t.textContent = f; S.append(t); }
    }
    // cordes
    for (let s = 0; s < 6; s++) {
      S.append(svg('line', { x1: s0 === 0 ? g.openW - 34 : g.xf(s0), x2: g.xf(this.frets), y1: g.ys(s), y2: g.ys(s), class: 'fb-string', 'stroke-width': 0.9 + (5 - s) * 0.32 }));
    }
    // zones cliquables
    const hit = svg('g', { class: 'fb-hit' });
    for (let s = 0; s < 6; s++) for (let f = s0; f <= this.frets; f++) {
      const x0 = f === 0 ? g.openW - 40 : g.xf(f - 1), x1 = f === 0 ? g.openW - 2 : g.xf(f);
      const r = svg('rect', { x: x0, y: g.ys(s) - g.sp / 2, width: x1 - x0, height: g.sp, 'data-s': s, 'data-f': f });
      hit.append(r);
    }
    hit.addEventListener('click', e => {
      const r = e.target.closest('rect'); if (!r) return;
      const s = +r.dataset.s, f = +r.dataset.f;
      if (this.sound) { try { pluck(midiAt(s, f)); } catch (err) { console.warn(err); } }
      this.flash(s, f);
      this.onTap && this.onTap(s, f, { pc: pcAt(s, f), midi: midiAt(s, f), mark: this.marks.get(s + ':' + f) });
    });
    S.append(hit);
    this.markLayer = svg('g', { class: 'fb-marks' }); S.append(this.markLayer);
    this.scroller.innerHTML = ''; this.scroller.append(S);
    this.renderMarks();
  }

  setFrets(n) { this.frets = n; this.draw(); }

  /* marks : [{ s, f, label, role, cls }] */
  setMarks(list) { this.marks = new Map(list.map(m => [m.s + ':' + m.f, m])); this.renderMarks(); }
  addMark(m) { this.marks.set(m.s + ':' + m.f, m); this.renderMarks(); }
  removeMark(s, f) { this.marks.delete(s + ':' + f); this.renderMarks(); }
  clear() { this.marks.clear(); this.renderMarks(); this.setZone(null); }

  renderMarks() {
    const g = this.g; this.markLayer.innerHTML = '';
    const r = this.compact ? 10 : 12.5;
    for (const m of this.marks.values()) {
      if (m.f < this.startFret && m.f !== 0) continue;
      if (m.f > this.frets) continue;
      const x = this.noteX(m.f), y = g.ys(m.s);
      const grp = svg('g', { class: `mk r-${m.role || 'none'} ${m.cls || ''}` });
      grp.append(svg('circle', { cx: x, cy: y, r }));
      if (m.label != null && m.label !== '') {
        const t = svg('text', { x, y: y + 0.5 }); t.textContent = m.label;
        if (String(m.label).length > 2) t.setAttribute('class', 'small');
        grp.append(t);
      }
      this.markLayer.append(grp);
    }
  }

  setZone(z) {
    this.zoneLayer.innerHTML = '';
    if (!z) return;
    const g = this.g;
    const x0 = z.from === 0 ? g.openW - 40 : g.xf(Math.max(this.startFret, z.from - 1));
    const x1 = g.xf(Math.min(this.frets, z.to));
    this.zoneLayer.append(svg('rect', { x: x0, y: g.ys(5) - 15, width: x1 - x0, height: g.ys(0) - g.ys(5) + 30, rx: 6, class: 'fb-zone' }));
    // fait défiler jusqu'à la zone sur mobile
    const sc = this.scroller, ratio = sc.scrollWidth / g.width;
    if (sc.scrollWidth > sc.clientWidth) sc.scrollTo({ left: Math.max(0, x0 * ratio - 30), behavior: 'smooth' });
  }

  flash(s, f) {
    const g = this.g, c = svg('circle', { cx: this.noteX(f), cy: g.ys(s), r: 14, class: 'fb-flash' });
    this.markLayer.append(c); setTimeout(() => c.remove(), 350);
  }
}

/* ---------------- fabricants de repères ---------------- */
/* notes : [{ iv, name, pc }] — labels : 'note' | 'iv' | 'deg' | 'none' */
export function labelFor(n, labels) {
  if (labels === 'none') return '';
  if (labels === 'iv') return IV(n.iv);
  if (labels === 'deg') return String(parseInterval(n.iv).deg);
  return N(n.name);
}

export function scaleMarks(notes, { labels = 'note', frets = 15, zone = null, emphasize = [], dimOthers = false } = {}) {
  const byPc = new Map(notes.map(n => [n.pc, n]));
  const out = [];
  for (let s = 0; s < 6; s++) for (let f = 0; f <= frets; f++) {
    const n = byPc.get(pcAt(s, f)); if (!n) continue;
    const inZone = !zone || (f >= zone.from && f <= zone.to) || (zone.from <= 1 && f === 0);
    const emph = emphasize.includes(n.iv);
    out.push({ s, f, label: labelFor(n, labels), role: ivRole(n.iv), iv: n.iv, name: n.name,
      cls: [!inZone ? 'ghost' : '', emph ? 'emph' : '', dimOthers && !emph && n.iv !== '1' ? 'soft' : ''].join(' ') });
  }
  return out;
}

/* Comparaison : notes communes en neutre, notes qui changent mises en évidence */
export function compareMarks(cmp, { labels = 'iv', frets = 15, zone = null } = {}) {
  const out = [];
  const onlyB = new Map(cmp.onlyB.map(n => [n.pc, n]));
  const onlyA = new Map(cmp.onlyA.map(n => [n.pc, n]));
  const common = new Map(cmp.common.map(n => [n.pc, n]));
  for (let s = 0; s < 6; s++) for (let f = 0; f <= frets; f++) {
    const pc = pcAt(s, f);
    const inZone = !zone || (f >= zone.from && f <= zone.to);
    const g = inZone ? '' : ' ghost';
    if (onlyA.has(pc)) { const n = onlyA.get(pc); out.push({ s, f, label: labelFor(n, labels), role: 'diffA', cls: 'emph' + g }); }
    else if (onlyB.has(pc)) { const n = onlyB.get(pc); out.push({ s, f, label: labelFor(n, labels), role: 'diffB', cls: 'outline' + g }); }
    else if (common.has(pc)) { const n = common.get(pc); out.push({ s, f, label: labelFor(n, labels), role: n.iv === '1' ? 'root' : 'common', cls: g }); }
  }
  return out;
}

/* Notes de l'accord sur tout le manche */
export function chordMarks(notes, opts = {}) { return scaleMarks(notes, opts); }

/* Un voicing précis (frets par corde) */
export function voicingMarks(frets, ivs, notes, labels = 'iv') {
  const byIv = new Map(notes.map(n => [n.iv, n]));
  return frets.map((f, s) => f >= 0 ? { s, f, label: labelFor(byIv.get(ivs[s]) || { iv: ivs[s], name: '' }, labels), role: ivRole(ivs[s]) } : null).filter(Boolean);
}

export const defaultName = pc => N(PC_NAMES[pc]);
export { TUNING };

/* Légende des couleurs */
export function legend(items) {
  const L = el('div', 'legend');
  for (const [role, txt] of items) L.append(el('span', null, el('i', 'sw r-' + role), txt));
  return L;
}
export const STD_LEGEND = [['root', 'Tonique (1)'], ['third', 'Tierce'], ['fifth', 'Quinte'], ['seventh', 'Septième'], ['second', '2 / 9'], ['fourth', '4 / 11'], ['sixth', '6 / 13']];
