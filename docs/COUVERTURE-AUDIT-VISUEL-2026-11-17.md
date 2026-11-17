# Couverture de l’audit visuel — 17 novembre 2026

38 modèles de page inventoriés. Cette matrice décrit les états effectivement ouverts, sans assimiler cette couverture à tous les scénarios possibles. Les captures sont locales, sur le commit `0f8a747`.

Toutes les familles ont des captures à 390 et 1 440 px. Le parcours de réservation possède aussi des captures à 320 px. Les contrôles tablette complémentaires sont listés dans `measurements.json` et la galerie.

| Modèle de page | États capturés | Limites et particularités |
| --- | --- | --- |
| `/app/[organizationId]/abonnement` | abonnement-offert, abonnement-liberte | Accès offert et Liberté ; aucun abonnement réellement facturé. |
| `/app/[organizationId]/activites/[activityId]` | activite-detail, activite-edition-ouverte | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/app/[organizationId]/activites/nouvelle` | nouvelle-activite | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/app/[organizationId]/activites` | activites | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/app/[organizationId]` | tableau-de-bord, menu-ouvert | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/app/[organizationId]/parametres` | apparence, apparence-medias-ouverts, apparence-photo-chargee | Photo chargée et diode visibles ; pas toutes les teintes ni erreurs de fichier. |
| `/app/[organizationId]/partager` | partager | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/app/[organizationId]/reglages` | reglages | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/app/[organizationId]/reservations` | reservations, reservation-organisateur-ouverte | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/app/[organizationId]/seances/[activityId]` | seance-detail | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/app/[organizationId]/tests` | tests-organisateur, tests-remplis | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/app/nouveau` | nouvel-espace | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/app` | mes-espaces, espaces-vides | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/plateforme/historique` | historique | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/plateforme/operations` | operations | Liste de tâches locales ; aucune relance d’envoi réelle. |
| `/plateforme` | administration, administration-refusee | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/[organization]/[activityId]` | reservation-jours, reservation-mois, reservation-coordonnees, reservation-confirmee | Parcours sans paiement en ligne ; autres modes non exhaustifs. |
| `/[organization]` | catalogue, introuvable | Deux activités fictives, plus organisation inexistante. |
| `/accessibilite` | accessibilite | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/apercu-chargement` | chargement | Aperçu du composant ; pas mesure des temps de navigation réels. |
| `/booking-result` | retour-paiement | Écran générique seul ; pas de retour réel de prestataire. |
| `/conditions` | conditions | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/confidentialite` | confidentialite | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/connexion` | connexion, connexion-participant | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/contact` | contact | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/embed/[organization]/[activityId]` | reservation-integree | Page dédiée ouverte directement ; pas intégration dans un site tiers. |
| `/faq` | faq | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/inscription` | inscription | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/manage` | gestion-sans-code, gestion-confirmee, gestion-annulation, gestion-virement, simulation-gestion | Confirmation, annulation dépliée et attente de virement ; pas toutes les règles de report. |
| `/mentions-legales` | mentions-legales | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/mot-de-passe-oublie` | mot-de-passe-oublie | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/nouveau-mot-de-passe` | nouveau-mot-de-passe | Formulaire sans jeton ; lien de réinitialisation valide et succès non exercés. |
| `/` | accueil | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/simulation/[organizationId]/activite/[activityId]` | simulation-activite, simulation-confirmee | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/simulation/[organizationId]/gestion` | simulation-gestion | Route exercée, redirection vers /manage ; écran partagé, pas second modèle distinct. |
| `/simulation/[organizationId]` | simulation-catalogue | État de référence ; erreurs, permissions et données longues non exhaustives. |
| `/simulation/[organizationId]/paiement/[bookingId]` | simulation-paiement | Route de paiement vérifiée après navigation ; aucune opération réelle. |
| `/simulation/[organizationId]/reservations` | simulation-liste | État de référence ; erreurs, permissions et données longues non exhaustives. |

## Preuves et limites communes

- Galerie locale : [ouvrir les captures](/workspace/artifacts/visual-audit-2026-11-17/index.html). Les QR et codes montrés appartiennent uniquement à des réservations fictives locales.
- `manifest.json` associe les états aux chemins, dimensions et captures ; `coverage.json` et `coverage.csv` donnent cet inventaire sous forme structurée.
- Les captures pleine page peuvent présenter des blancs de composition hors écran avec le verre. Utiliser les captures `calendrier-jour-visible.png`, `calendrier-mois-visible.png` et `calendrier-mois-viewport.png` pour juger la grille réellement affichée.
- Pas de contrôle exhaustif de tous les fonds personnalisés, états de chargement/erreur, rôles, fenêtres de réservation, données très longues et remboursements.
- Safari sur téléphone réel, lecteur d’écran, sélecteur natif de fichiers, sauvegarde native du billet, réception d’e-mail et prestataires de paiement externes hors périmètre.
- Le précédent audit du 16 novembre était limité à certains parcours. Ce document étend la couverture aux pages publiques, authentification, gestion, plateforme et simulation.

[Rapport et constats](AUDIT-VISUEL-GLOBAL-2026-11-17.md) · [Plan de qualité](PLAN-QUALITE-VISUELLE-2026-11-17.md)
