/* ================================================================
   SHRED v2 — audio (Web Audio API, tout est synthétisé dans le navigateur)
   - pluck() : corde pincée (algorithme de Karplus-Strong)
   - backing tracks : batterie + basse + accords, programmés à l'avance
     sur l'horloge audio (pas de dérive)
   - métronome
   - enregistrement micro (MediaRecorder) pour se réécouter.
     AUCUNE analyse de ce que tu joues : on enregistre, tu juges.
   ================================================================ */
import { midiToFreq, TUNING } from './theory.js';

let ctx = null, master = null, comp = null;

export function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) throw new Error('Ce navigateur ne gère pas l’audio Web.');
    ctx = new C();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    master = ctx.createGain(); master.gain.value = 0.85;
    master.connect(comp); comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export const now = () => ac().currentTime;

const ksCache = new Map();
function ksBuffer(midi, dur, bright) {
  const c = ac(), key = midi + ':' + dur + ':' + bright;
  if (ksCache.has(key)) return ksCache.get(key);
  const sr = c.sampleRate, f = midiToFreq(midi);
  const N = Math.max(2, Math.round(sr / f)), len = Math.floor(sr * dur);
  const buf = c.createBuffer(1, len, sr), d = buf.getChannelData(0), y = new Float32Array(len);
  for (let i = 0; i < N; i++) y[i] = Math.random() * 2 - 1;
  const damp = 0.996 - (1 - bright) * 0.004;
  for (let i = N; i < len; i++) y[i] = damp * 0.5 * (y[i - N] + y[i - N + 1]);
  for (let i = 0; i < len; i++) d[i] = y[i] * Math.min(1, i / 160) * (1 - i / len);
  if (ksCache.size > 300) ksCache.clear();
  ksCache.set(key, buf);
  return buf;
}

export function pluck(midi, { when = 0, dur = 1.4, vel = 0.5, dest = null, bright = 1 } = {}) {
  const c = ac();
  const src = c.createBufferSource(); src.buffer = ksBuffer(midi, dur, bright);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(c.sampleRate / 2, midiToFreq(midi) * 6 + 1500 * bright);
  const g = c.createGain(); g.gain.value = vel;
  src.connect(lp); lp.connect(g); g.connect(dest || master);
  src.start(when || c.currentTime);
  return src;
}

export function playNotes(midis, { gap = 0.035, vel = 0.42, when = 0, dur = 1.8 } = {}) {
  const t0 = when || now() + 0.02;
  midis.forEach((m, i) => pluck(m, { when: t0 + i * gap, vel, dur }));
}

/* Accord arpégé (une note après l'autre) */
export function arpeggio(midis, { step = 0.32 } = {}) { playNotes(midis, { gap: step, vel: 0.5, dur: 1.6 }); }

/* Voicing (frets par corde, -1 = étouffée) → MIDI */
export const voicingMidis = frets => frets.map((f, s) => f >= 0 ? TUNING[s] + f : null).filter(m => m !== null);

/* Pour jouer un accord « en position fermée » à partir de ses classes de hauteur */
export function closeVoicing(pcs, low = 48) {
  const out = []; let last = low - 1;
  pcs.forEach(pc => { let m = low + ((pc - low) % 12 + 12) % 12; while (m <= last) m += 12; out.push(m); last = m; });
  return out;
}

/* ---------------- instruments de la backing track ---------------- */
let noiseBuf = null;
function noise() {
  const c = ac();
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  return noiseBuf;
}

function kick(t, dest, vel = 1) {
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.9 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.4);
}
function snare(t, dest, vel = 1) {
  const c = ac(), n = c.createBufferSource(); n.buffer = noise();
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
  const g = c.createGain(); g.gain.setValueAtTime(0.42 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  n.connect(hp); hp.connect(g); g.connect(dest); n.start(t); n.stop(t + 0.22);
  const o = c.createOscillator(), og = c.createGain(); o.frequency.value = 190;
  og.gain.setValueAtTime(0.25 * vel, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(og); og.connect(dest); o.start(t); o.stop(t + 0.12);
}
function hat(t, dest, vel = 1, open = false) {
  const c = ac(), n = c.createBufferSource(); n.buffer = noise();
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
  const g = c.createGain(); const d = open ? 0.25 : 0.05;
  g.gain.setValueAtTime(0.16 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  n.connect(hp); hp.connect(g); g.connect(dest); n.start(t); n.stop(t + d + 0.02);
}
function bass(midi, t, len, dest, vel = 1) {
  const c = ac(), o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth'; o.frequency.value = midiToFreq(midi);
  lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 2;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32 * vel, t + 0.01);
  g.gain.setTargetAtTime(0.18 * vel, t + 0.05, 0.12); g.gain.setTargetAtTime(0, t + len * 0.92, 0.03);
  o.connect(lp); lp.connect(g); g.connect(dest); o.start(t); o.stop(t + len + 0.2);
}
function pad(midis, t, len, dest, vel = 1) {
  const c = ac(), g = c.createGain(), lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 1300;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07 * vel, t + 0.35);
  g.gain.setValueAtTime(0.07 * vel, t + Math.max(0.36, len - 0.3)); g.gain.linearRampToValueAtTime(0, t + len + 0.25);
  lp.connect(g); g.connect(dest);
  midis.forEach(m => [-6, 6].forEach(det => {
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiToFreq(m); o.detune.value = det;
    o.connect(lp); o.start(t); o.stop(t + len + 0.3);
  }));
}
let curveCache = null;
function distCurve() {
  if (curveCache) return curveCache;
  const n = 1024, k = 40; curveCache = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; curveCache[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
  return curveCache;
}
function powerChord(rootMidi, t, len, dest, vel = 1, muted = false) {
  const c = ac(), sh = c.createWaveShaper(); sh.curve = distCurve();
  const pre = c.createGain(); pre.gain.value = 0.5;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = muted ? 900 : 2600;
  const g = c.createGain(); const L = muted ? Math.min(len, 0.16) : len;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11 * vel, t + 0.008);
  g.gain.setTargetAtTime(0.0001, t + L * 0.85, muted ? 0.02 : 0.06);
  pre.connect(sh); sh.connect(lp); lp.connect(g); g.connect(dest);
  [rootMidi, rootMidi + 7, rootMidi + 12].forEach((m, i) => [-5, 5].forEach(det => {
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiToFreq(m); o.detune.value = det + i;
    o.connect(pre); o.start(t); o.stop(t + L + 0.3);
  }));
}
function strum(midis, t, dest, vel = 0.4, down = true) {
  const arr = down ? midis : midis.slice().reverse();
  arr.forEach((m, i) => pluck(m, { when: t + i * 0.012, vel, dur: 1.6, dest, bright: 0.8 }));
}
export function click(t, accent, dest) {
  const c = ac(), o = c.createOscillator(), g = c.createGain();
  o.frequency.value = accent ? 1600 : 1000;
  g.gain.setValueAtTime(accent ? 0.5 : 0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + 0.06);
}

/* ---------------- styles de backing track ---------------- */
/* Chaque style : swing, motif de batterie (par croche sur 8), traitement des accords */
export const STYLES = {
  floyd:   { name: 'Atmosphérique (à la Pink Floyd)', swing: 0, kit: { k: [0, 5], s: [2, 6], h: [0, 2, 4, 6] }, chords: 'pad+arp', bassPattern: [0, 4] },
  blues:   { name: 'Blues shuffle', swing: 0.33, kit: { k: [0, 4], s: [2, 6], h: [0, 1, 2, 3, 4, 5, 6, 7] }, chords: 'strum', bassPattern: [0, 2, 4, 6], walk: true },
  grunge:  { name: 'Grunge (power chords)', swing: 0, kit: { k: [0, 3, 4], s: [2, 6], h: [0, 1, 2, 3, 4, 5, 6, 7] }, chords: 'power', bassPattern: [0, 1, 2, 3, 4, 5, 6, 7] },
  alt:     { name: 'Rock alternatif', swing: 0, kit: { k: [0, 3, 5], s: [2, 6], h: [0, 1, 2, 3, 4, 5, 6, 7] }, chords: 'strum8', bassPattern: [0, 2, 3, 4, 6] },
  metal:   { name: 'Metal (palm mute)', swing: 0, kit: { k: [0, 1, 3, 4, 5, 7], s: [2, 6], h: [0, 2, 4, 6] }, chords: 'chug', bassPattern: [0, 1, 2, 3, 4, 5, 6, 7] },
  shoegaze:{ name: 'Shoegaze / ambient', swing: 0, kit: { k: [0], s: [4], h: [0, 2, 4, 6] }, chords: 'pad', bassPattern: [0] }
};

/* ---------------- moteur de backing track ---------------- */
/* progression : [{ notes:[{pc}], root, bars, symbol }] — rappels onChord(index, chord, barInChord) */
export class Backing {
  constructor() { this.playing = false; this.timer = null; this.events = []; this.muted = { drums: false, bass: false, chords: false }; }

  start({ progression, bpm = 80, style = 'floyd', countIn = true, onBeat, onChord, onSchedule, loops = Infinity }) {
    const c = ac();
    this.stop();
    this.prog = progression; this.bpm = bpm; this.style = STYLES[style] || STYLES.floyd;
    this.onBeat = onBeat; this.onChord = onChord; this.onSchedule = onSchedule; this.loopsLeft = loops; this.globalBar = 0;
    this.out = c.createGain(); this.out.gain.value = 1; this.out.connect(master);
    this.beat = 60 / bpm;
    this.next = c.currentTime + 0.12;
    this.step = countIn ? -4 : 0;              // en noires ; négatif = décompte
    this.chordIdx = 0; this.barInChord = 0; this.beatInBar = 0;
    this.playing = true;
    this.timer = setInterval(() => this.schedule(), 25);
    this.raf = requestAnimationFrame(() => this.tick());
  }

  stop() {
    this.playing = false;
    clearInterval(this.timer); this.timer = null;
    cancelAnimationFrame(this.raf);
    if (this.out) { const o = this.out; try { o.gain.setTargetAtTime(0, ac().currentTime, 0.03); } catch (e) {} setTimeout(() => o.disconnect(), 400); this.out = null; }
    this.events = [];
  }

  setTempo(bpm) { this.bpm = bpm; this.beat = 60 / bpm; }

  schedule() {
    const c = ac();
    while (this.playing && this.next < c.currentTime + 0.15) {
      this.playBeat(this.next);
      this.next += this.beat;
    }
  }

  playBeat(t) {
    const dest = this.out;
    if (this.step < 0) {                       // décompte : 4 clics
      click(t, this.step === -4, dest);
      this.events.push({ t, type: 'count', n: this.step + 5 });
      this.step++;
      return;
    }
    const ch = this.prog[this.chordIdx];
    const st = this.style, b = this.beatInBar;
    const eighth = this.beat / 2, sw = st.swing ? eighth * st.swing : 0;
    const at = i => t + (i % 2 ? eighth + sw : 0); // croche i dans ce temps (0 ou 1)
    const rootBass = 28 + ((ch.notes[0].pc - 4 + 12) % 12) + 12;   // basse entre E1 et D#2 + octave
    const first = b === 0 && this.barInChord === 0;

    if (first) this.events.push({ t, type: 'chord', idx: this.chordIdx, chord: ch });
    if (this.onSchedule) { try { this.onSchedule(t, { beat: b, idx: this.chordIdx, bar: this.barInChord, globalBar: this.globalBar, beatLen: this.beat, chord: ch }); } catch (e) { console.error(e); } }
    this.events.push({ t, type: 'beat', beat: b, idx: this.chordIdx, bar: this.barInChord, globalBar: this.globalBar });

    for (let i = 0; i < 2; i++) {
      const e = b * 2 + i, tt = at(i);
      if (!this.muted.drums) {
        if (st.kit.k.includes(e)) kick(tt, dest);
        if (st.kit.s.includes(e)) snare(tt, dest);
        if (st.kit.h.includes(e)) hat(tt, dest, i ? 0.7 : 1);
      }
      if (!this.muted.bass && st.bassPattern.includes(e)) {
        let m = rootBass;
        if (st.walk) { const third = ch.notes[1] ? (ch.notes[1].pc - ch.notes[0].pc + 12) % 12 : 4; m = rootBass + [0, third === 3 ? 3 : 4, 7, 9][b]; }
        bass(m, tt, eighth * (st.bassPattern.length <= 2 ? 3.6 : 0.9), dest);
      }
    }

    if (!this.muted.chords) {
      const pcs = ch.notes.map(n => n.pc);
      const voice = closeVoicing(pcs, 52);
      const barLen = this.beat * 4;
      if (st.chords === 'pad' || st.chords === 'pad+arp') {
        if (b === 0) pad(closeVoicing(pcs, 55), t, barLen, dest);
        if (st.chords === 'pad+arp') { const seq = closeVoicing(pcs, 60); pluck(seq[(b * 2) % seq.length], { when: t, vel: 0.22, dest, dur: 1.5 }); pluck(seq[(b * 2 + 1) % seq.length], { when: t + eighth, vel: 0.16, dest, dur: 1.5 }); }
      } else if (st.chords === 'strum') {
        if (b === 0 || b === 2) strum(voice, t, dest, 0.3); if (b === 1 || b === 3) strum(voice.slice(1), t + eighth + sw, dest, 0.2, false);
      } else if (st.chords === 'strum8') {
        strum(voice, t, dest, 0.26); strum(voice, t + eighth, dest, 0.18, false);
      } else if (st.chords === 'power') {
        if (b === 0 || b === 2) powerChord(rootBass + 12, t, this.beat * 2, dest);
      } else if (st.chords === 'chug') {
        powerChord(rootBass + 12, t, eighth, dest, 0.9, true); powerChord(rootBass + 12, t + eighth, eighth, dest, 0.8, true);
      }
    }

    // avance
    this.beatInBar++;
    if (this.beatInBar === 4) {
      this.beatInBar = 0; this.barInChord++; this.globalBar++;
      if (this.barInChord >= (ch.bars || 1)) {
        this.barInChord = 0; this.chordIdx++;
        if (this.chordIdx >= this.prog.length) {
          this.chordIdx = 0;
          this.loopsLeft--;
          this.events.push({ t: t + this.beat, type: 'loop' });
          if (this.loopsLeft <= 0) { this.events.push({ t: t + this.beat, type: 'end' }); this.playing = false; clearInterval(this.timer); }
        }
      }
    }
  }

  /* Les rappels UI arrivent pile au moment où le son sort */
  tick() {
    const t = ac().currentTime;
    while (this.events.length && this.events[0].t <= t) {
      const e = this.events.shift();
      if (e.type === 'chord' && this.onChord) this.onChord(e.idx, e.chord);
      if (this.onBeat) this.onBeat(e);
      if (e.type === 'end') { this.stop(); return; }
    }
    if (this.playing || this.events.length) this.raf = requestAnimationFrame(() => this.tick());
  }
}

/* ---------------- métronome ---------------- */
export class Metronome {
  constructor() { this.on = false; }
  start(bpm, onBeat, beatsPerBar = 4) {
    const c = ac(); this.stop();
    this.bpm = bpm; this.on = true; this.n = 0; this.next = c.currentTime + 0.08; this.bpb = beatsPerBar; this.onBeat = onBeat; this.q = [];
    this.timer = setInterval(() => {
      while (this.next < ac().currentTime + 0.12) {
        click(this.next, this.n % this.bpb === 0);
        this.q.push({ t: this.next, n: this.n % this.bpb });
        this.n++; this.next += 60 / this.bpm;
      }
    }, 25);
    const loop = () => { if (!this.on) return; const t = ac().currentTime; while (this.q.length && this.q[0].t <= t) { const e = this.q.shift(); this.onBeat && this.onBeat(e.n); } this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  setBpm(b) { this.bpm = b; }
  stop() { this.on = false; clearInterval(this.timer); cancelAnimationFrame(this.raf); }
}

/* ---------------- enregistrement ---------------- */
export const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

export class Recorder {
  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', ''];
    const mime = types.find(m => !m || (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)));
    this.mr = mime ? new MediaRecorder(this.stream, { mimeType: mime }) : new MediaRecorder(this.stream);
    this.chunks = [];
    this.mr.ondataavailable = e => e.data.size && this.chunks.push(e.data);
    this.mr.start();
  }
  stop() {
    return new Promise(res => {
      if (!this.mr) return res(null);
      this.mr.onstop = () => {
        this.stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(this.chunks, { type: this.mr.mimeType || 'audio/webm' });
        res(URL.createObjectURL(blob));
      };
      this.mr.stop();
    });
  }
}
