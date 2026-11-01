# Shred — mon professeur personnel de guitare

Application web (aucun serveur, aucun compte) : https://niclaeysthomas-ctrl.github.io/shred/

## Ce qu'elle contient
- **Aujourd'hui** : séance du jour, module en cours, temps de pratique, compétences, objectifs.
- **Séance du jour** : 15, 20 ou 30 minutes ; les priorités tournent sur 3 jours (théorie, impro, technique).
- **Parcours** : 7 modules (manche, harmonie, modes, impro, technique, composition, oreille). Une notion n'est validée
  que par un quiz réussi (≥ 80 %), un tempo propre déclaré, ou une mesure au micro.
- **Labo** : manche interactif, explorateur de gammes et modes (avec comparaison), Chord Lab (doigtés calculés, triades,
  renversements, harmonisation).
- **Impro Studio** : backing tracks synthétisées (Web Audio), notes cibles, appel/réponse, motifs, modes, impro libre.
- **Technique Lab** : tablature animée au métronome, module médiator, justesse des bends et vibrato mesurés au micro.
- **Ear Training**, **Composition Studio**, **Progrès** (évaluation périodique, export/import).
- **Shred classique** (`classic.html`) : l'ancienne version, toujours disponible (Juke-box, répertoire, studio).

## Honnêteté sur l'audio
L'app ne reconnaît pas ce que tu joues en général. Les seules mesures réelles sont la hauteur d'une note **tenue**
(bends, vibrato, notes tenues dans l'exercice « Notes cibles », casque requis). Le reste est auto-évalué et affiché comme tel.

## Technique
HTML/CSS/JavaScript natifs en modules ES, sans dépendance ni étape de build. Données dans `localStorage`
(clés `shred3` et `shred2` pour le temps de jeu partagé avec l'ancienne version), audio enregistré dans IndexedDB.

Vérifier les calculs musicaux : `node --test tests/*.test.js`
