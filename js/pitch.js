/* ================================================================
   SHRED v2 — détection de hauteur au micro (vraie mesure, pas simulée)
   Méthode : autocorrélation normalisée (inspirée de YIN) sur des fenêtres
   de 2048 échantillons. Fiable pour UNE note tenue (bend, vibrato, accordage).
   Pas fiable pour des accords ou du jeu rapide : on ne l'utilise pas pour ça.
   ================================================================ */
import { ac } from './audio.js';
import { PC_NAMES } from './theory.js';

export const freqToMidi = f => 69 + 12 * Math.log2(f / 440);

export function detectPitch(buf, sr) {
  const n = buf.length;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.01) return null;                       // silence
  const minLag = Math.floor(sr / 1200), maxLag = Math.floor(sr / 70);
  const half = Math.min(n - maxLag, 1024);
  // différence cumulée normalisée (YIN, étapes 2-3)
  const d = new Float32Array(maxLag + 1);
  let run = 0;
  d[0] = 1;
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < half; i++) { const x = buf[i] - buf[i + lag]; sum += x * x; }
    run += sum;
    d[lag] = run ? sum * lag / run : 1;
  }
  let lag = -1;
  for (let t = minLag; t <= maxLag; t++) {
    if (d[t] < 0.15) { while (t + 1 <= maxLag && d[t + 1] < d[t]) t++; lag = t; break; }
  }
  if (lag < 0) return null;
  // interpolation parabolique
  const a = d[lag - 1] ?? d[lag], b = d[lag], c = d[lag + 1] ?? d[lag];
  const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
  const f = sr / (lag + (isFinite(shift) ? shift : 0));
  return { freq: f, midi: freqToMidi(f), clarity: 1 - b, rms };
}

export class PitchListener {
  async start(onPitch) {
    const c = ac();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    this.src = c.createMediaStreamSource(this.stream);
    this.an = c.createAnalyser(); this.an.fftSize = 4096;
    this.src.connect(this.an);
    this.buf = new Float32Array(this.an.fftSize);
    this.on = true;
    const loop = () => {
      if (!this.on) return;
      this.an.getFloatTimeDomainData(this.buf);
      onPitch(detectPitch(this.buf, c.sampleRate), c.currentTime);
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }
  stop() {
    this.on = false; cancelAnimationFrame(this.raf);
    try { this.src && this.src.disconnect(); } catch (e) {}
    this.stream && this.stream.getTracks().forEach(t => t.stop());
  }
}

export function midiLabel(m) {
  const r = Math.round(m);
  return PC_NAMES[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1);
}
