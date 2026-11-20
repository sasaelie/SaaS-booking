# Audit visuel global — 17 novembre 2026

L’identité est cohérente et reconnaissable. La faiblesse principale est la **hiérarchie** : trop de commandes et de conteneurs reçoivent le même relief, tandis que les tâches utiles arrivent tard sur mobile. La qualité peut progresser en simplifiant la disposition, sans changer la marque ni retirer le verre.

## Périmètre et méthode

- Source examinée : `main`, commit `0f8a747aca88eedb748742d4c4ee15497200eb0f`, après la fusion validée. Application compilée en production, exécutée localement.
- Inventaire des 38 modèles de page ; captures de 56 états, notamment formulaires, menus et fiches ouverts, confirmation, gestion, virement et simulation. La [matrice de couverture](COUVERTURE-AUDIT-VISUEL-2026-11-17.md) distingue pages, variantes et limites.
- Largeurs principales : 390 et 1 440 px ; contrôles complémentaires du parcours de réservation à 320 px. Les captures tablette sont recensées séparément dans les preuves.
- Lecture des captures et du code, mesures de disposition, vérification de débordement, contrôle axe sur huit écrans. Comptes, réservations, contacts et images de test locaux ; aucun compte réel ni paiement réel utilisé.
- Référence de jugement : [normes validées](NORMES-VISUELLES-2026-11-17.md). Les propositions restent séparées des décisions existantes.

Il s’agit d’un audit heuristique, pas d’une étude auprès de clients, d’une mesure de conversion ou d’une certification d’accessibilité. Aucun pourcentage de gain ni score arbitraire n’est attribué.

## Éléments réussis à conserver

- Verre clair et boutons de 8 px ; couleurs et titres donnent déjà une identité propre.
- En-tête marketing opaque et pleine largeur ; tarifs marketing centrés sans superposition de cartes.
- Photos utiles, composition décalée photo/calendrier et démonstration liée au planning.
- Bande des sept jours commune, vue mensuelle continue, lueur d’aujourd’hui et sélection colorée avec coche.
- FAQ sobre, liens secondaires déjà discrets dans plusieurs parcours, formulaires d’authentification globalement lisibles.
- Billet simplifié depuis l’audit précédent : code complet, copie à proximité, QR lisible, téléchargement dominant et gestion secondaire.
- Formats d’image et diode de chargement conservés dans les réglages.

## Constats et priorités

P1 : gêne concrète dans le parcours ou rupture de continuité. P2 : amélioration de hiérarchie et de finition. Ces niveaux ne sont pas des statistiques. Aucun nouveau blocage de réservation n’a été établi par cet audit visuel.

### V01 — P1 — Le relief ne distingue pas suffisamment les rôles

Sur l’accueil, deux grandes actions concurrentes ; dans les formulaires, l’œil du mot de passe est un petit bouton surélevé dans le champ ; dans l’apparence, les poignées deviennent elles-mêmes des panneaux de verre. L’application répétée du même matériau attire l’attention sur des commandes secondaires.

**Orientation :** préserver le verre, commencer par la place et les dimensions des commandes ; comparer ensuite une variante utilitaire plus discrète, avant toute modification globale. [Connexion](/workspace/artifacts/visual-audit-2026-11-17/connexion-390-full.png) · [Aperçu d’apparence](/workspace/artifacts/visual-audit-2026-11-17/apparence-photo-chargee-390-full.png).

### V02 — P1 — La navigation organisateur prend trop de hauteur sur mobile

Le bandeau fermé consacre environ 200 px à la marque, au retour/menu et au compte/déconnexion. Avec le bandeau de test et l’avis d’accès offert, le titre métier commence vers 390 px sur les écrans examinés. Le problème se répète sur presque toutes les pages de gestion.

**Orientation :** conserver retour, titre courant et menu visibles ; regrouper le compte et la déconnexion dans les utilitaires accessibles du menu. Le bandeau de test reste visible en recette. [Navigation et réservations](/workspace/artifacts/visual-audit-2026-11-17/reservations-390-full.png).

### V03 — P1 — Le tableau de bord repousse les séances

Quatre cartes de compteurs, leurs explications et un panneau de tests précèdent les prochaines séances. Sur la fixture mobile, leur titre arrive autour de 1 100 px. Sur ordinateur, la largeur réduit cet effet, mais chaque compteur garde un cadre important, même à zéro.

**Orientation :** un groupe de compteurs compact, les tâches financières à traiter visibles, puis les séances ; placer les essais après ou dans les utilitaires. Préserver tous les accès. [Mobile](/workspace/artifacts/visual-audit-2026-11-17/tableau-de-bord-390-full.png) · [Ordinateur](/workspace/artifacts/visual-audit-2026-11-17/tableau-de-bord-1440-top.png).

### V04 — P1 — L’étape « coordonnées » répète trop le contexte

Grand encart d’activité, étapes, informations pratiques et récapitulatif précèdent le premier champ, situé autour de 920 px à 390 px. « Modifier la séance » tient sur trois lignes dans une petite commande. Les consignes disposent de deux présentations dans la même page.

**Orientation :** récapitulatif compact activité/date/prix, modification sur une ligne dédiée si nécessaire, puis coordonnées. Mutualiser la présentation des consignes en maintenant leur accès au moment du consentement. [Preuve](/workspace/artifacts/visual-audit-2026-11-17/reservation-coordonnees-390-full.png).

### V05 — P1 — Le planning impose des heures vides avant les choix

Dans l’exemple proposant 14 h et 17 h, la vue journalière commence à 9 h. Cinq heures vides précèdent la première séance. Ce coût de défilement est particulièrement sensible dans un formulaire déjà long.

**Orientation :** tester un cadrage initial sur les heures utiles, avec accès explicite à toute la journée. Conserver l’échelle temporelle, les changements de jour, les cas nocturnes et les indicateurs validés. [Calendrier réellement visible](/workspace/artifacts/visual-audit-2026-11-17/calendrier-jour-visible.png) · [Mois](/workspace/artifacts/visual-audit-2026-11-17/calendrier-mois-viewport.png).

### V06 — P2 — Certains libellés et pictogrammes sont encombrés

Les cartes d’activité affichent par exemple « Gérer → › » : l’icône explicite s’ajoute au chevron CSS automatique des liens sans classe. Des actions côte à côte deviennent étroites sur mobile. Les glyphes texte de pause/lecture de la démo ont aussi un rendu dépendant de la police et de la plateforme.

**Orientation :** un seul indicateur directionnel par action, composants de lien explicites, largeur adaptée aux libellés et pictogrammes cohérents. [Activités](/workspace/artifacts/visual-audit-2026-11-17/activites-390-full.png). Cause repérée : `text-links.css`, `ActivityCards.tsx`, règles communes de boutons.

### V07 — P1 — L’aperçu d’apparence ne représente pas fidèlement le texte public

Le titre et le tarif déplaçables portent un fond, un contour et une ombre de bouton, absents du texte public. L’utilisateur peut confondre l’outil de placement avec le résultat publié. L’éditeur cumule aussi panneau principal, aperçu, scène et commandes.

**Orientation :** rendre le texte proche du résultat réel et identifier séparément sa poignée. Conserver le glissement, le clavier, les curseurs, le choix d’activité et les sauvegardes. Comparaison visuelle nécessaire avant changement du matériau utilitaire. [Preuve](/workspace/artifacts/visual-audit-2026-11-17/apparence-photo-chargee-390-full.png).

### V08 — P2 — Les formulaires et fiches manquent d’un rythme commun

Dans les réglages, deux sections successives se touchent presque. À l’inverse, une fiche de réservation ouverte contient deux nouveaux panneaux complets pour le billet et l’annulation. Création d’activité, partage et abonnement accumulent de longs groupes dont le poids visuel se ressemble.

**Orientation :** un groupe visuel par tâche, titres et espacements internes, séparateurs légers ; garder une séparation nette pour l’action d’annulation. Les champs et groupes sémantiques restent légitimes. [Réglages](/workspace/artifacts/visual-audit-2026-11-17/reglages-390-full.png) · [Fiche ouverte](/workspace/artifacts/visual-audit-2026-11-17/reservation-organisateur-ouverte-390-full.png).

### V09 — P1 — L’accueil montre son produit trop tard sur mobile

Le titre, le texte, deux boutons de même relief, trois réassurances et un lien précèdent l’aperçu interactif. Sur ordinateur, l’aperçu bénéficie d’une colonne dédiée ; sur mobile il descend sous le premier écran. La connexion est déjà accessible dans l’en-tête.

**Orientation :** une action dominante, connexion secondaire, texte plus court et aperçu utile rapproché. Ne pas ajouter la photo décorative en double qui avait été refusée ; conserver les prix et la composition photo/calendrier approuvés. [Mobile](/workspace/artifacts/visual-audit-2026-11-17/accueil-390-full.png) · [Ordinateur](/workspace/artifacts/visual-audit-2026-11-17/accueil-1440-top.png).

### V10 — P2 — Le pied de page et les contenus provisoires pèsent sur la finition

Le pied de page est correctement aligné, mais occupe une grande part des pages publiques courtes sur mobile. Contact et informations légales contiennent encore des mentions « À compléter » : c’est un contenu inachevé visible, pas un problème de couleur ou de carte.

**Orientation :** tester un regroupement mobile plus compact en gardant tous les liens ; faire renseigner les informations réelles par le propriétaire. Ne pas inventer de coordonnées, d’avis ou de chiffres d’usage. [Contact](/workspace/artifacts/visual-audit-2026-11-17/contact-390-full.png).

### V11 — P1 — Les retours et erreurs sont moins accompagnés

`/booking-result` présente un titre et un paragraphe isolés, sans navigation ni prochaine étape. L’organisation inexistante affiche une erreur générique et « Retour », sans expliquer clairement ce qui manque. Le formulaire de nouveau mot de passe est visible sans jeton ; le parcours avec lien valide n’a pas été exercé dans cet audit.

**Orientation :** état compréhensible, contexte et action sûre de sortie/reprise. Ne jamais présenter une réservation comme payée avant confirmation serveur. [Retour de paiement](/workspace/artifacts/visual-audit-2026-11-17/retour-paiement-390-full.png) · [Introuvable](/workspace/artifacts/visual-audit-2026-11-17/introuvable-390-full.png).

### V12 — P2 — La finition doit être vérifiée par état, pas par effet global

Des aides sont très petites ; l’ombre du texte des boutons peut diminuer sa netteté. Les vues plateforme réutilisent de grandes cartes pour des listes d’exploitation, au prix d’un long défilement. Les fonds personnalisables et les photos changent les conditions de lecture.

**Orientation :** échelle typographique commune, liste plus compacte lorsque l’information est répétitive, contrôles manuels du contraste sur couleurs et photos extrêmes. Garder les diodes et les libellés de statut. [Opérations](/workspace/artifacts/visual-audit-2026-11-17/operations-1440-full.png).

## Vérifications et limites

- Aucun débordement horizontal détecté dans les captures recensées. Cela ne garantit pas tous les textes, traductions ou appareils possibles.
- Axe : aucune violation automatique rapportée sur les huit écrans sondés ; **contraste non résolu automatiquement** sur chacun des huit en raison des fonds/compositions, et deux vérifications ARIA à revoir manuellement dans l’apparence. Ce résultat ne vaut pas conformité WCAG.
- `npm run verify` : TypeScript, ESLint et 156 tests unitaires réussis. Aucun code applicatif changé par l’audit.
- Certaines captures pleine page ne peignent pas correctement des zones de verre hors écran dans Chromium. Les captures du calendrier après défilement montrent bien la grille : ces blancs de capture ne sont pas classés comme un bug produit établi.
- Pas de test Safari sur téléphone réel, lecteur d’écran, fenêtre native de sauvegarde, réception d’e-mail ni paiement externe réel. Pas de conclusion sur ces sujets à partir des captures.

Preuves locales : `/workspace/artifacts/visual-audit-2026-11-17/` : galerie `index.html`, `manifest.json`, `accessibility.json`, `references.json` et captures. Les fichiers de preuve ne sont pas des données de production.

## Références consultées pour ce rapport

- [GOV.UK — boutons](https://design-system.service.gov.uk/components/button/) : limiter les actions dominantes concurrentes ; application à V01/V09, sans reprendre leur identité graphique.
- [GOV.UK — confirmation](https://design-system.service.gov.uk/patterns/confirmation-pages/) : preuve, suite du parcours et retour au résultat ; application à V11 et conservation du billet.
- [NN/G — conception visuelle](https://www.nngroup.com/articles/principles-visual-design/) : échelle, hiérarchie, équilibre, contraste, regroupements ; application à V02/V03/V08.
- [W3C — contraste du texte](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) : 4,5:1 pour le texte courant, 3:1 pour le grand texte selon la définition WCAG.
- [W3C — contraste non textuel](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) : 3:1 pour les indices visuels nécessaires concernés ; une lueur décorative ne prouve pas ce contraste.
- [W3C — cibles](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) : 24 × 24 CSS px au niveau AA avec exceptions. Une cible de 44 px est ici un objectif de confort, pas le minimum AA général.

Suite concrète : [plan de qualité par lots et critères de validation](PLAN-QUALITE-VISUELLE-2026-11-17.md).
