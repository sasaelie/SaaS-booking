# Essai visuel du chargement

La page `/apercu-chargement` permet d’examiner le calendrier dans son cadre de verre, son ombre douce et les trois points qui s’illuminent. « Terminer le chargement » déclenche la sortie puis l’apparition d’un contenu de démonstration. « Revoir l’animation » recommence l’essai. La hauteur de la zone reste réservée entre les deux états.

Cette page n’est servie qu’avec `APP_ENVIRONMENT=staging`, renvoie une page introuvable dans les autres environnements et interdit l’indexation. Elle n’est pas ajoutée à la navigation commerciale ni au sitemap. Le visuel est désormais validé et relié aux navigations réelles ; l’essai reste disponible pour examiner et rejouer l’animation.

Le composant réutilisable `PageLoadingIndicator` utilise les couleurs, les cadres, l’icône et les ombres existants. Son entrée attend 200 ms puis dure 240 ms ; les points suivent un cycle de 1800 ms. La sortie de 180 ms part de l’opacité réellement affichée, afin d’éviter un flash lorsqu’on termine très vite. La fin de la sortie attend `Animation.finished` et fonctionne aussi lorsqu’aucune animation n’existe. Les résolutions obsolètes sont annulées au démontage. Le mode de réduction des animations garde un calendrier fixe et affiche immédiatement le contenu demandé.

L’essai ne crée aucun compte, événement, réservation, paiement ou message. Ses commandes ne font évoluer que l’état local du navigateur. Les contrôles clavier sont natifs, les pictogrammes sont décoratifs et les états disposent d’un statut accessible sans masquer ses annonces sous un ancêtre `aria-busy`.

Les tests vérifient la fin et la relance, l’absence de requête POST, le clavier, la réduction des animations, les largeurs 320/390/1440, les contrôles automatiques WCAG A/AA et le cas d’une fin avant l’apparition du calendrier.

Vérification locale : TypeScript, ESLint, 126 tests unitaires, compilation Next.js optimisée et sept parcours navigateur ciblés réussis. L’essai est examiné à 320, 390 et 1440 px ; les contrôles automatiques WCAG A/AA ne détectent pas de violation sur la vue testée. Le parcours commercial existant reste validé.
