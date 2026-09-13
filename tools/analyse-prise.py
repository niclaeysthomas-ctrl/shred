#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
analyse-prise.py — mesurer une prise enregistrée dans SHRED.

Ce que ça fait :  hauteur (justesse en cents), notes réellement chantées/jouées,
tessiture, placement rythmique contre un tempo donné, dérive, silences, saturation.
Ce que ça ne fait PAS : juger. Aucun chiffre ici ne dit si c'est beau.

    python3 tools/analyse-prise.py prise.m4a --bpm 90 --notes "E4 G4 A4 B4"

Conversion : afconvert (natif macOS) pour .m4a/.aac/.mp3/.caf.
Dépendance : numpy.
"""
import sys, os, wave, subprocess, tempfile, argparse, math
import numpy as np

NOMS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
FR   = {'C':'Do','C#':'Do#','D':'Ré','D#':'Ré#','E':'Mi','F':'Fa','F#':'Fa#',
        'G':'Sol','G#':'Sol#','A':'La','A#':'La#','B':'Si'}

def midi_nom(m):
    m = int(round(m)); n = NOMS[m % 12]
    return "%s%d" % (n, m // 12 - 1)

def nom_midi(s):
    s = s.strip().replace('♯','#').replace('♭','b')
    for fr, en in (('Do#','C#'),('Ré#','D#'),('Fa#','F#'),('Sol#','G#'),('La#','A#'),
                   ('Do','C'),('Ré','D'),('Re','D'),('Mi','E'),('Fa','F'),('Sol','G'),('La','A'),('Si','B')):
        if s.startswith(fr): s = en + s[len(fr):]; break
    i = 1
    while i < len(s) and s[i] in '#b': i += 1
    tete, oct_ = s[:i], s[i:]
    if tete.endswith('b'): pc = (NOMS.index(tete[:-1].upper()) - 1) % 12
    else: pc = NOMS.index(tete.upper())
    return pc + 12 * (int(oct_) + 1) if oct_ else pc + 60

def charger(path, sr_cible=22050):
    """-> (signal float32 mono normalisé, sr). Convertit si besoin via afconvert."""
    tmp = None
    if not path.lower().endswith('.wav'):
        tmp = tempfile.mktemp(suffix='.wav')
        r = subprocess.run(['afconvert','-f','WAVE','-d','LEI16@%d' % sr_cible,'-c','1',path,tmp],
                           capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(tmp):
            raise SystemExit("Conversion impossible (%s).\nafconvert ne lit pas ce format — "
                             "réenregistre depuis Safari/iPhone (.m4a) ou convertis le fichier en .wav.\n%s"
                             % (os.path.basename(path), (r.stderr or '').strip()[:300]))
        path = tmp
    with wave.open(path, 'rb') as w:
        sr, n, sw, ch = w.getframerate(), w.getnframes(), w.getsampwidth(), w.getnchannels()
        raw = w.readframes(n)
    if sw != 2: raise SystemExit("WAV non 16 bits : convertis-le d'abord.")
    x = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0
    if ch > 1: x = x.reshape(-1, ch).mean(axis=1)
    if tmp and os.path.exists(tmp): os.unlink(tmp)
    return x, sr

def nsdf_f0(frame, sr, fmin, fmax, seuil=0.70):
    """Hauteur d'une trame par NSDF (McLeod) : robuste aux harmoniques fortes."""
    N = len(frame); frame = frame - frame.mean()
    if np.sqrt((frame ** 2).mean()) < 1e-4: return 0.0, 0.0
    nfft = 1 << (2 * N - 1).bit_length()
    F = np.fft.rfft(frame, nfft)
    r = np.fft.irfft(F * np.conj(F))[:N]                 # autocorrélation
    p = np.cumsum(frame[::-1] ** 2)[::-1]                # énergies glissantes
    m = (p[0] + p) - np.concatenate(([0.0], np.cumsum(frame ** 2)[:-1]))
    with np.errstate(divide='ignore', invalid='ignore'):
        nsdf = np.where(m > 1e-9, 2.0 * r / m, 0.0)
    tmin, tmax = max(2, int(sr / fmax)), min(N - 2, int(sr / fmin))
    if tmax <= tmin + 2: return 0.0, 0.0
    seg = nsdf[tmin:tmax]
    pics = [i for i in range(1, len(seg) - 1) if seg[i] > seg[i-1] and seg[i] >= seg[i+1] and seg[i] > 0]
    if not pics: return 0.0, 0.0
    haut = max(seg[i] for i in pics)
    if haut < seuil: return 0.0, float(haut)
    i = next(p_ for p_ in pics if seg[p_] >= 0.9 * haut)  # 1er pic assez haut = la fondamentale
    a, b, c = seg[i-1], seg[i], seg[i+1]
    d = a - 2*b + c
    delta = 0.5 * (a - c) / d if abs(d) > 1e-12 else 0.0
    tau = (tmin + i + delta)
    return (sr / tau if tau > 0 else 0.0), float(b)

def suivi_hauteur(x, sr, fmin, fmax, taille=2048, saut=256):
    t, f0, cl, rms = [], [], [], []
    for s in range(0, len(x) - taille, saut):
        tr = x[s:s+taille]
        f, c = nsdf_f0(tr, sr, fmin, fmax)
        t.append(s / sr); f0.append(f); cl.append(c)
        rms.append(float(np.sqrt((tr ** 2).mean())))
    return map(np.array, (t, f0, cl, rms))

def grouper(t, f0, cl, rms, seuil_cl, porte, min_ms=70):
    """Trames -> notes tenues (médiane de hauteur, durée, écart en cents)."""
    notes, cur = [], None
    for i in range(len(t)):
        bon = f0[i] > 0 and cl[i] >= seuil_cl and rms[i] >= porte
        m = 69 + 12 * math.log2(f0[i] / 440.0) if bon else None
        if bon and cur and abs(m - cur['m'][-1]) < 0.8:
            cur['m'].append(m); cur['fin'] = t[i]
        else:
            if cur and (cur['fin'] - cur['debut']) * 1000 >= min_ms: notes.append(cur)
            cur = {'debut': t[i], 'fin': t[i], 'm': [m]} if bon else None
    if cur and (cur['fin'] - cur['debut']) * 1000 >= min_ms: notes.append(cur)
    for n in notes:
        med = float(np.median(n['m']))
        n['midi'] = med
        n['cents'] = (med - round(med)) * 100
        n['stab'] = float(np.std(n['m']) * 100)     # écart-type en cents = stabilité
        n['duree'] = n['fin'] - n['debut']
    return notes

def attaques(x, sr, saut=256, taille=1024):
    """Onsets par flux spectral (demi-onde redressé)."""
    S = []
    for s in range(0, len(x) - taille, saut):
        S.append(np.abs(np.fft.rfft(x[s:s+taille] * np.hanning(taille))))
    S = np.array(S)
    if len(S) < 3: return np.array([])
    flux = np.maximum(0, np.diff(S, axis=0)).sum(axis=1)
    flux = flux / (flux.max() + 1e-9)
    seuil = np.convolve(flux, np.ones(21)/21, mode='same') * 1.35 + 0.06
    on = [i for i in range(1, len(flux)-1)
          if flux[i] > seuil[i] and flux[i] >= flux[i-1] and flux[i] > flux[i+1]]
    out, dernier = [], -1
    for i in on:                                  # 60 ms de garde
        t = (i + 1) * saut / sr
        if t - dernier > 0.06: out.append(t); dernier = t
    return np.array(out)

def rapport(chemin, bpm=None, notes_attendues=None, source='voix'):
    x, sr = charger(chemin)
    duree = len(x) / sr
    fmin, fmax = (70, 1100) if source == 'voix' else (75, 1400)
    t, f0, cl, rms = suivi_hauteur(x, sr, fmin, fmax)
    crete = float(np.abs(x).max())
    actif = rms > max(0.012, float(np.percentile(rms, 60)) * 0.25)
    porte = max(0.012, float(np.percentile(rms, 60)) * 0.25)
    notes = grouper(t, f0, cl, rms, 0.75, porte)

    L = []
    add = L.append
    add("# Analyse de la prise — %s" % os.path.basename(chemin))
    add("")
    add("Durée %.1f s · %d Hz · crête %.2f%s · son présent sur %d %% du temps"
        % (duree, sr, crete, "  ⚠️ SATURÉ" if crete > 0.985 else "", 100 * actif.mean()))
    add("")
    if not notes:
        add("**Aucune hauteur stable détectée.** Trop de bruit, trop loin du micro, ou rien de tenu.")
        return "\n".join(L)

    ec = np.array([n['cents'] for n in notes])
    dur = np.array([n['duree'] for n in notes])
    mids = np.array([n['midi'] for n in notes])
    stab = np.array([n['stab'] for n in notes])
    dans25 = 100 * np.mean(np.abs(ec) <= 25)
    dans50 = 100 * np.mean(np.abs(ec) <= 50)

    add("## Justesse")
    add("")
    add("- **%d notes tenues** (≥70 ms), durée médiane %.2f s" % (len(notes), float(np.median(dur))))
    add("- Écart médian au tempérament : **%+.0f cents** (|médian| %.0f)" % (float(np.median(ec)), float(np.median(np.abs(ec)))))
    add("- **%.0f %% des notes à ±25 cents** (inaudible pour l'oreille), %.0f %% à ±50 cents (un quart de ton)" % (dans25, dans50))
    add("- Stabilité dans la note : %.0f cents d'écart-type médian %s"
        % (float(np.median(stab)), "(tenu très droit)" if np.median(stab) < 18 else "(ça bouge — vibrato ou hésitation)"))
    biais = float(np.median(ec))
    if abs(biais) >= 12:
        add("- ⚠️ Biais d'ensemble **%+.0f cents** : tout est %s. Si c'est la guitare, elle est désaccordée ; "
            "si c'est la voix, tu chantes %s par rapport à la référence." % (biais, "trop haut" if biais > 0 else "trop bas",
            "au-dessus" if biais > 0 else "en dessous"))
    add("- Tessiture utilisée : **%s → %s** (%.0f demi-tons)" % (midi_nom(mids.min()), midi_nom(mids.max()), mids.max() - mids.min()))
    add("")
    add("## Les notes, dans l'ordre")
    add("")
    add("```")
    for i, n in enumerate(notes[:60]):
        add("%5.2fs  %-5s %+5.0f c  %4.0f ms  %s"
            % (n['debut'], midi_nom(n['midi']), n['cents'], n['duree'] * 1000,
               "●" * min(12, max(1, int(n['duree'] / 0.12)))))
    if len(notes) > 60: add("… %d notes de plus" % (len(notes) - 60))
    add("```")

    if notes_attendues:
        att = [nom_midi(s) for s in notes_attendues]
        add("")
        add("## Contre la mélodie écrite")
        add("")
        joues = [int(round(n['midi'])) for n in notes]
        # alignement simple : on compare la SUITE des hauteurs (classes de notes)
        justes = sum(1 for a, b in zip(att, joues) if (a - b) % 12 == 0)
        octave = sum(1 for a, b in zip(att, joues) if (a - b) % 12 == 0 and a != b)
        add("- Attendu : %s" % " ".join(midi_nom(m) for m in att))
        add("- Entendu : %s" % " ".join(midi_nom(m) for m in joues[:len(att) + 4]))
        add("- **%d/%d notes justes** (à l'octave près) — dont %d chantées à une autre octave."
            % (justes, len(att), octave))
        for i, (a, b) in enumerate(zip(att, joues)):
            if (a - b) % 12 != 0:
                add("  - note %d : attendu **%s**, entendu **%s** (%+d demi-tons)" % (i + 1, midi_nom(a), midi_nom(b), b - a))

    ons = attaques(x, sr)
    add("")
    add("## Rythme")
    add("")
    if len(ons) < 4:
        add("- Trop peu d'attaques détectées (%d) pour mesurer le placement." % len(ons))
    else:
        ioi = np.diff(ons)
        add("- **%d attaques**, intervalle médian %.0f ms" % (len(ons), 1000 * float(np.median(ioi))))
        beat = 60.0 / bpm if bpm else float(np.median(ioi[(ioi > 0.2) & (ioi < 1.5)])) if len(ioi[(ioi > 0.2) & (ioi < 1.5)]) else None
        if beat:
            if not bpm:
                add("- Tempo estimé (aucun BPM fourni) : **%.0f BPM**" % (60.0 / beat))
            else:
                phases = np.linspace(0, beat, 240, endpoint=False)
                cout = [np.mean(np.abs(((ons - p + beat / 2) % beat) - beat / 2)) for p in phases]
                p0 = phases[int(np.argmin(cout))]
                dev = ((ons - p0 + beat / 2) % beat) - beat / 2
                add("- Contre une grille fixe à **%d BPM** : écart médian **%.0f ms**, moyen %.0f ms (|max| %.0f ms)"
                    % (bpm, 1000 * float(np.median(np.abs(dev))), 1000 * float(np.abs(dev).mean()), 1000 * float(np.abs(dev).max())))
                avance = 100 * np.mean(dev < -0.012)
                retard = 100 * np.mean(dev > 0.012)
                add("- %.0f %% des attaques **en avance**, %.0f %% **en retard**, %.0f %% dans les ±12 ms"
                    % (avance, retard, 100 - avance - retard))
            # Tempo RÉEL et dérive : on quantifie chaque intervalle en temps, puis on
            # régresse le tempo local. (Comparer à une grille fixe ne peut pas dire le
            # sens de la dérive : l'écart s'enroule dès qu'il dépasse un demi-temps.)
            k = np.maximum(1, np.round(ioi / beat))
            garde = np.abs(ioi / beat - k) < 0.35
            if garde.sum() >= 4:
                tm = ons[:-1][garde]
                loc = (60.0 * k / ioi)[garde]
                a, b = np.polyfit(tm, loc, 1)
                d0, d1 = b + a * tm[0], b + a * tm[-1]
                sens = "tu accélères" if d1 - d0 > 3 else ("tu ralentis" if d1 - d0 < -3 else "tempo tenu")
                add("- Tempo réellement joué : médiane **%.0f BPM** — de %.0f à %.0f BPM sur la prise (**%s**)"
                    % (float(np.median(loc)), d0, d1, sens))
                add("- Régularité : écart-type du tempo local **%.1f BPM**%s"
                    % (float(np.std(loc)), " (très stable)" if np.std(loc) < 3 else ""))
    add("")
    add("_Aucun de ces chiffres ne dit si c'est bien. Ils disent ce qui s'est passé._")
    return "\n".join(L)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description="Mesurer une prise SHRED (hauteur, justesse, rythme).")
    ap.add_argument('fichier')
    ap.add_argument('--bpm', type=float, default=None, help="tempo écrit de la chanson")
    ap.add_argument('--notes', default=None, help='mélodie attendue, ex. "E4 G4 A4 B4"')
    ap.add_argument('--source', choices=['voix','guitare'], default='voix')
    a = ap.parse_args()
    print(rapport(a.fichier, a.bpm, a.notes.split() if a.notes else None, a.source))
