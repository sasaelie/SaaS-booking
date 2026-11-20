# Cadres et photos — version A

Cette étape historique utilisait des contours lumineux, des cadres de 22 px, un relief doux et un en-tête flottant. Ce dernier a été remplacé après validation par un **en-tête opaque, pleine largeur et fixe au défilement, avec ombre**. Voir le [référentiel actuel](../NORMES-VISUELLES-2026-11-17.md) avant toute modification.

La fenêtre de démonstration, les bénéfices, les offres et les autres panneaux utilisent les mêmes règles de verre. La photo de chaque activité est protégée par un voile sombre progressif, sans tache claire. Les images changent avec les onglets et les exemples restent fictifs.

Les trois photos sont servies localement en WebP (environ 60 Ko chacune avant optimisation Next.js). Le navigateur ne contacte pas Unsplash pour afficher la page. L’image sélectionnée est chargée immédiatement ; les deux autres ne sont demandées qu’au changement d’onglet.

Sources des illustrations, sous [licence Unsplash](https://unsplash.com/license), consultées le 12 novembre 2026 :

- Céramique : https://images.unsplash.com/photo-1493106641515-6b5631de4bb9
- Massage : https://images.unsplash.com/photo-1544161515-4ab6ce6db874
- Course à pied : https://images.unsplash.com/photo-1552674605-db6ffd4facb5

L’extrait CSS transmis par l’utilisateur fait référence au filtre SVG `#btn-glass`, absent du code fourni. Cette version A ne l’ajoute pas encore. Après examen du premier rendu, une version B indépendante pourra tester l’effet ultra transparent et la réfraction périphérique, avec un repli compatible mobile et une vérification de la lisibilité. Les contours rectangulaires arrondis seront conservés ; `border-radius: 9999px` ne sera pas appliqué aux cadres.
