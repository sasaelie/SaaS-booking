# Plan de bataille — simulation et lisibilité

## Périmètre validé

1. Éclaircir progressivement le centre des cartes, conserver la photo et le contraste des trois couleurs de texte.
2. Réseaux sociaux : symboles reconnaissables, alignés et cohérents, petit cadre de verre sans flèche superflue.
3. Conditions : texte de départ clair, exemples, paramètres de report cohérents ; accès Modifier réservé aux membres autorisés.
4. Comparatif : vert clair pour inclus, vert pâle pour absent ; conditions et limites écrites explicitement.
5. Tests participant persistants dans un stockage distinct : mêmes activités et moteur de réservation, capacité séparée, paiement simulé, aucun e-mail ni effet financier réel. Liste TEST, état et suppression manuelle.
6. Export Excel : synthèse, libellés, formules, totaux nuls si vide, frais inconnus explicitement en attente. CSV conservé pour compatibilité.

## Isolation

- Autorisation organisation réelle vérifiée à chaque accès serveur à la simulation.
- Schéma PostgreSQL privé distinct ; copie de configuration uniquement, jamais des participants, réservations, mots de passe ou sessions d’authentification.
- Même moteur métier, repositories branchés exclusivement sur le schéma de simulation. Aucun repli vers les tables publiques.
- Secret de lien de gestion distinct, codes et écritures confinés ; aucun client Stripe/Resend ni traitement de jobs externes dans la simulation.
- Anciennes URL d’aperçu depuis les apparences réorientées vers la simulation après contrôle d’accès.

## Vérification

- Validation, typecheck, lint et tests unitaires.
- Intégration SQL : refus anonyme et inter-organisation, réservations/capacités réelles inchangées, double paiement sans duplication, code et jeton de test rejetés en réel, suppression et solde de report.
- Navigateur : catalogue → séance → coordonnées → simulation de paiement refusé/réussi → gestion/annulation → retour studio → suppression ; conditions éditables seulement par l’organisateur.
- Export vide et avec transactions rapprochées/en attente/remboursements ; formules et absence de doubles totaux.
- Revue mobile et bureau : cartes, réseaux, comparatif, alignements et contrastes.

## Livraison

Prévisualisation de recette, rapport des vérifications et lien. Fusion ultérieure sur demande. Les migrations futures modifiant les tables métier doivent également faire évoluer leur structure dans le schéma de simulation.
