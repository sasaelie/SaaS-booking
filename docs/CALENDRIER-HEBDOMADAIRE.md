# Calendrier hebdomadaire — 19 novembre 2026

Demande : proposer une semaine lisible sur téléphone, incluant samedi et dimanche,
puis ouvrir une journée pour consulter ses séances et les places restantes.

Le calendrier commun aux participants, intégrations et organisateurs conserve
ses trois vues : Semaine, Journée et Mois. La vue initiale Semaine n’est plus
transformée implicitement en Journée lorsque le conteneur est étroit.

- Sur mobile et dans une intégration étroite, une seule surface de verre présente
  les sept jours du lundi au dimanche, avec des séparations discrètes.
- Chaque jour affiche jusqu’à deux séances, leur horaire et leur disponibilité.
  Un compteur indique les séances supplémentaires ; ouvrir la journée les montre toutes.
- Les séances sont classées par horaire dans l’aperçu. Les jours sans séance restent accessibles.
- Ouvrir un autre jour efface l’ancien créneau participant pour éviter une réservation
  involontaire. Le participant choisit ensuite une séance dans les horaires détaillés.
- Le jour actuel conserve sa lueur, indépendamment du jour parcouru. Les repères
  des séances terminées ou annulées sont éteints ; les couleurs d’activité sont conservées.
- Sur un grand écran, les sept colonnes horaires existantes sont conservées.
  Leurs en-têtes permettent désormais d’ouvrir la journée au clic ou au clavier.
- Le réglage « Afficher les 24 heures » reste réservé aux vues avec un axe horaire.
- Le menu mobile permet de revenir à Semaine et conserve Journée et Mois.

La navigation et les résumés utilisent les mêmes données de séance que les vues
détaillées. Aucun changement des tarifs, des réservations, des paiements ou du schéma SQL.

Vérifications : TypeScript, ESLint, 235 tests unitaires, compilation de production et
26 parcours navigateur ciblant participants/organisateurs, week-end, clavier, places,
jours vides, séances nocturnes, lumières et régressions de réservation.
Captures et résultats navigateur : `/workspace/artifacts/weekly-planning-browser/`.
