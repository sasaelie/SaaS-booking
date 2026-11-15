# Scénario autonome : organisateur et client

La demande est une démonstration qui se déroule seule dès qu’elle est visible, sans appuyer sur Play. Elle illustre la création d’une activité par un organisateur, sa publication, le choix d’une séance par un client et la réservation reçue dans le planning.

## Technologies réellement utilisées

- React et TypeScript, déjà installés dans l’application : un réducteur décrit les quatre états et un contexte partage la même activité et la même séance entre l’aperçu et le calendrier.
- `setTimeout` du navigateur : déclenche l’étape suivante à partir d’une durée définie dans `src/config/marketing-demo.ts`. Le minuteur est nettoyé lors d’un changement d’étape ou du démontage.
- `IntersectionObserver` : suspend les minuteurs si les deux vues quittent l’écran ; leur retour les relance automatiquement.
- `visibilitychange` : suspend la lecture quand l’onglet est masqué et la reprend à son retour.
- CSS : révèle progressivement les valeurs des champs de création. La préférence de réduction des animations désactive cet effet ; les étapes continuent automatiquement et disposent d’un bouton Pause.

Aucune bibliothèque d’animation, vidéo préenregistrée, intelligence artificielle, automatisation de vrai compte ou API de réservation n’est nécessaire à cette démonstration. Elle ne modifie que l’état React dans le navigateur. Aucun événement, paiement, message ou participant réel n’est créé.

## Séquence

| Étape | Acteur représenté | Ce qui est visible | Durée |
| --- | --- | --- | --- |
| Création | Organisateur | Le nom, l’horaire, la capacité et le tarif se remplissent dans une fiche de préparation | 4,1 s |
| Publication | Organisateur | Les séances sont proposées au client et apparaissent dans le calendrier | 3,5 s |
| Sélection | Client | Le second horaire est sélectionné ; le jour et l’heure du calendrier correspondent | 3,5 s |
| Confirmation | Organisateur | Le planning reçoit une réservation simulée d’une place et les disponibilités diminuent d’une place | 4,9 s |

La séquence passe ensuite à l’activité suivante : Ateliers, Soins, Sport, puis recommence. Les données restent explicitement fictives. Les capacités de démonstration sont cohérentes entre création et réservation : 5 vers 4 places disponibles, 1 vers 0, puis 4 vers 3.

Le code précédent arrêtait durablement le scénario dès un toucher ou un focus dans toute la zone. Ce comportement est retiré. Un toucher de lecture ou un défilement ne demande plus d’appuyer sur Reprendre. Seul le bouton Pause arrête volontairement le scénario jusqu’à une reprise explicite. Le focus clavier sur une commande suspend temporairement les changements, afin de préserver son utilisation ; quitter la commande autorise la reprise automatique.

## Tarifs de la page de vente

Les offres sont désormais deux compositions ouvertes et centrées, sans grands cadres : icône, nom, montant dominant, description courte, frais et lien de choix. Elles sont côte à côte sur ordinateur et empilées sur mobile. Les montants proviennent de `COMMERCIAL`, pas d’une copie manuelle des prix. La limite de deux activités en Liberté et les frais Stripe à la charge de l’organisateur en Pro restent visibles dans l’offre concernée.

Les liens conservent le choix Liberté ou Pro dans les parcours d’inscription et de connexion. Les explications, l’économie annuelle de 88 €, le comparateur et les notes placées sous les offres sont supprimés de la page de vente. Le pied de page conserve les informations et les liens légaux.

## Vérification locale

La revue initiale a validé 28 scénarios navigateur ciblés. Ils parcourent les quatre états sur les trois activités sans aucun clic sur Play ni requête POST, vérifient les heures et les places restantes, confirment qu’un toucher du calendrier n’arrête pas la lecture et contrôlent sa reprise après un passage hors écran. Les pauses volontaires restent actives. Les liens des deux offres, le parcours de connexion et les contrôles d’accessibilité passent également.

TypeScript, ESLint, 126 tests unitaires et la construction optimisée Next.js sont également validés. Les écrans sont vérifiés à 320, 390, 768 et 1440 px ; la comparaison des formules et le choix annuel restent disponibles dans l’espace organisateur.

Lighthouse mobile local : performance 100/100, accessibilité 100/100, LCP 0,9 s, CLS 0. Ces mesures de laboratoire ne préjugent pas des résultats en conditions réelles.

Deux contrôles historiques du comparateur ont aussi été validés dans la page d’abonnement organisateur : ils vérifient les 27 catégories, la distinction des disponibilités et le style des liens. Ils ne cherchent plus le comparateur supprimé de la page de vente.

## Transitions sans disparition globale

Les cadres, leurs ombres, les photos, le titre du calendrier et son mois restent visibles à toutes les étapes. Le nom de l’organisation et la présentation de l’activité restent fixes pendant son scénario. Les horaires, les places et les messages d’étape sont les seules zones qui suivent le fondu de sortie de 1 seconde puis d’entrée de 1 seconde. Le cycle complet dure environ 16 secondes, avec les mêmes temps de lecture stable entre les transitions.

Lors du passage à une autre activité, `DemoPhoto` superpose la photo suivante sur la photo actuelle. La nouvelle photo apparaît progressivement pendant 2 secondes au-dessus d’une base toujours opaque. Les deux éléments et leur animation sont conservés lors du changement de phase React ; il n’y a ni fond vide entre les photos ni redémarrage du fondu à mi-parcours. Seules les légendes de l’activité utilisent alors aussi une sortie et une entrée.

Le bouton Pause ou une suspension de visibilité annule la transition et rétablit un état stable. La réduction des animations désactive les fondus sans arrêter le déroulement automatique. Les photos gardent leurs variantes optimisées Next.js ; celle de l’activité suivante est préchargée à faible priorité. Deux photos seulement sont montées pendant un changement, contre une au repos. Les images décoratives et les anciennes couches ne sont pas annoncées aux lecteurs d’écran.

## Synchronisation et vérification

La progression attend les promesses `Animation.finished` des informations animées. La fin de l’entrée attend également la fin du fondu croisé des photos. Une pause, une navigation, un changement manuel ou une suspension neutralise les callbacks devenus obsolètes. Sans animation CSS, notamment avec la réduction des animations, les étapes passent directement à leur état stable.

Les tests figent les animations, font dépasser le délai théorique et vérifient que le contenu attend leur fin réelle. Un scénario supplémentaire traverse les quatre étapes et contrôle l’opacité effective des cadres, du titre et des photos, y compris celle de leurs parents. Il vérifie aussi qu’une photo de base reste opaque lorsque la photo suivante est à mi-fondu, puis qu’une seule photo reste montée à la fin.

Vérification de cette version : TypeScript, ESLint, 126 tests unitaires, construction optimisée Next.js et 18 parcours navigateur ciblés réussis. Les captures de cycles complets à 390 et 1440 px montrent les surfaces fixes et le fondu croisé, sans erreur JavaScript, image manquante ni débordement horizontal. Les contrôles automatiques WCAG A/AA et les parcours clavier et tactiles passent également.
