# Audit global du code — plan priorisé

Base : `c12bfe225006bd37c6f5808c4ec9e6099e4b7fa1`, le 12 novembre 2026.

## Ordre et critères

1. **Priorité 1 — argent et confidentialité** : identité serveur, droits propriétaire/gestionnaire/super-administrateur, portée des requêtes et fichiers, refus inter-organisations, jetons et origine des mutations ; prix figés, capacité concurrente, doublons, paiements tardifs, reports, remboursements, écritures comptables et conservation protégée.
2. **Priorité 2 — fonctionnement durable** : tâches différées, reprise après panne, notifications, expiration Pro, séparation TEST/réel, configuration sûre, migrations, dépendances et garde-fous des scripts.
3. **Priorité 3 — qualité et exploitation** : architecture, typage, requêtes répétitives, limites de volume, erreurs et journaux, cache des pages privées, navigation et interactions accessibles. Conserver le design validé.

Un défaut est classé selon son impact et accompagné d’une preuve. Les corrections des défauts confirmés précèdent les améliorations de confort. Aucun résultat automatique n’est assimilé à une certification juridique ou à un essai chez un prestataire réel.

## Méthode

- Inventorier les points d’entrée, leurs contrôles, les tables et les services critiques ; lire les anciennes réserves d’audit.
- Vérifier les dépendances et les frontières architecturales, puis reproduire les risques retenus avec des données synthétiques.
- Écrire des tests de régression avant les corrections, vérifier leur échec initial, corriger et rejouer les tests concernés.
- Terminer par les types, le lint, les tests unitaires, les transactions PostgreSQL, la compilation et les parcours navigateur complets.
- Documenter les défauts corrigés, les protections confirmées, les limites non vérifiées et les étapes nécessaires avant ouverture réelle.

## Protection des données et livraison

Base locale jetable pour tous les essais destructifs ou concurrents ; aucun paiement ni e-mail réel. Les données hébergées ne sont ni copiées ni modifiées pour l’audit. Pas de changement de formule, de droits administrateur ou d’ouverture commerciale. Les corrections sont livrées sur la branche de travail avec rapport et prévisualisation de recette ; la fusion reste distincte.
