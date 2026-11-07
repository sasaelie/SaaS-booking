# Vérifications de la livraison

## Périmètre

Livraison demandée : structuration et mise en ZIP des sources reçues, sans intégration GitHub.
Les versions définitives remplacent les variantes initiales ; les variantes restent dans `docs/references/` hors compilation.
Les sauts de ligne, l’indentation et certains commentaires ont été harmonisés. Aucun adaptateur manquant n’a été inventé et aucune correction métier n’est revendiquée.

## Contrôle applicatif tenté

Commande : `npm run verify`.
Résultat : arrêt au premier contrôle `tsc --noEmit` avec `sh: 1: tsc: not found` (code 127).
Les dépendances du projet ne sont pas installées. ESLint et Vitest n’ont donc pas été exécutés par cette commande.
Aucun succès de compilation, de tests, de construction ou de conformité juridique n’est affirmé.
Les défauts déjà visibles dans les sources sont conservés et listés dans `POINTS-A-COMPLETER.md`.

## Contrôles d’archive

La création du ZIP vérifie la liste des fichiers, les imports locaux relatifs, la validité JSON des configurations et l’intégrité CRC du ZIP.
Un manifeste SHA-256 permet de vérifier chaque fichier après extraction.
L’archive n’inclut pas `node_modules`, cache, dépôt `.git`, fichier `.env.local` ou secret réel.

Le formateur Prettier 3.6.2 a analysé et mis en forme les 39 fichiers sources et les trois configurations (package.json, tsconfig.json, eslint.config.mjs). Cette analyse syntaxique n’équivaut pas à une compilation TypeScript.

Contrôles terminés : JSON valides, aucun import relatif local sans cible, huit fichiers de tests présents, contrôle CRC et comparaison SHA-256 de tous les fichiers extraits du ZIP réussis.
