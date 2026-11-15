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
| Création | Organisateur | Le nom, l’horaire, la capacité et le tarif se remplissent dans une fiche de préparation | 2,4 s |
| Publication | Organisateur | Les séances sont proposées au client et apparaissent dans le calendrier | 1,8 s |
| Sélection | Client | Le second horaire est sélectionné ; le jour et l’heure du calendrier correspondent | 1,8 s |
| Confirmation | Organisateur | Le planning reçoit une réservation simulée d’une place et les disponibilités diminuent d’une place | 3,2 s |

La séquence passe ensuite à l’activité suivante : Ateliers, Soins, Sport, puis recommence. Les données restent explicitement fictives. Les capacités de démonstration sont cohérentes entre création et réservation : 5 vers 4 places disponibles, 1 vers 0, puis 4 vers 3.

Le code précédent arrêtait durablement le scénario dès un toucher ou un focus dans toute la zone. Ce comportement est retiré. Un toucher de lecture ou un défilement ne demande plus d’appuyer sur Reprendre. Seul le bouton Pause arrête volontairement le scénario jusqu’à une reprise explicite. Le focus clavier sur une commande suspend temporairement les changements, afin de préserver son utilisation ; quitter la commande autorise la reprise automatique.

## Tarifs de la page de vente

Les offres sont désormais deux compositions ouvertes et centrées, sans grands cadres : icône, nom, montant dominant, description courte, frais et lien de choix. Elles sont côte à côte sur ordinateur et empilées sur mobile. Les montants proviennent de `COMMERCIAL`, pas d’une copie manuelle des prix. La limite de deux activités en Liberté et les frais Stripe à la charge de l’organisateur en Pro restent visibles dans l’offre concernée.

Les liens conservent le choix Liberté ou Pro dans les parcours d’inscription et de connexion. Les explications, l’économie annuelle de 88 €, le comparateur et les notes placées sous les offres sont supprimés de la page de vente. Le pied de page conserve les informations et les liens légaux.

## Vérification locale

Les 28 scénarios navigateur ciblés sont validés. Ils parcourent les quatre états sur les trois activités sans aucun clic sur Play ni requête POST, vérifient les heures et les places restantes, confirment qu’un toucher du calendrier n’arrête pas la lecture et contrôlent sa reprise après un passage hors écran. Les pauses volontaires restent actives. Les liens des deux offres, le parcours de connexion et les contrôles d’accessibilité passent également.

TypeScript, ESLint, 126 tests unitaires et la construction optimisée Next.js sont également validés. Les écrans sont vérifiés à 320, 390, 768 et 1440 px ; la comparaison des formules et le choix annuel restent disponibles dans l’espace organisateur.

Lighthouse mobile local : performance 100/100, accessibilité 100/100, LCP 0,9 s, CLS 0. Ces mesures de laboratoire ne préjugent pas des résultats en conditions réelles.

Deux contrôles historiques du comparateur ont aussi été validés dans la page d’abonnement organisateur : ils vérifient les 27 catégories, la distinction des disponibilités et le style des liens. Ils ne cherchent plus le comparateur supprimé de la page de vente.

## Fondus synchronisés

Les changements automatiques suivent un fondu de sortie de 120 ms, puis un fondu d’entrée de 180 ms. Le contenu est remplacé après la sortie : l’aperçu participant, sa photo, les textes d’étape et la composition photo/planning utilisent le même état de transition. Les commandes de pause et de choix restent visibles. Les fondus font partie du temps d’affichage des étapes, dont le cycle complet dure environ neuf secondes.

Le bouton Pause ou une suspension de visibilité annule la transition en cours et rétablit la visibilité du contenu. La réduction des animations désactive les fondus CSS tout en conservant le déroulement automatique. Les champs de préparation apparaissent aussi en fondu court, avec un décalage de 60 ms entre champs, sans révélation saccadée des caractères.

La photo de l’activité suivante est préchargée à faible priorité via les mêmes URL optimisées Next.js et les mêmes dimensions que les images affichées. Deux tests dédiés contrôlent l’opacité de sortie et d’entrée des quatre zones synchronisées, le remplacement du contenu entre les deux, la pause pendant la sortie et la réduction des animations.

## Revue visuelle en temps réel

Une capture de cycles complets en Chromium, à 390 et 1440 px, a révélé un décalage que le contrôle des seules durées ne détectait pas : le changement de contenu pouvait arriver pendant que le navigateur affichait encore une partie du contenu sortant. Les départs effectifs des animations CSS peuvent être décalés par rapport aux minuteurs JavaScript.

La synchronisation attend désormais les promesses `Animation.finished` de toutes les zones animées. Le nouveau contenu apparaît après leur sortie complète, puis la prochaine étape attend aussi la fin de l’entrée. Une annulation, une pause, une navigation ou une suspension de visibilité neutralise les callbacks en attente. Sans animation CSS, notamment en mode de réduction des animations, les étapes passent directement à leur état stable.

Les tests figent volontairement les animations et vérifient que même un dépassement du délai théorique ne remplace pas le contenu ; ils terminent ensuite les animations réelles pour autoriser le changement. La mesure après correction montre une opacité nulle avant chaque remplacement observé sur les deux largeurs. Aucune image en retard ni erreur JavaScript n’a été détectée. Le déplacement de mise en page observé sur le cycle complet est négligeable (CLS environ 0,0006 sur mobile et 0,0002 sur ordinateur).

Avis visuel : la disparition de toute la composition à chaque petite étape reste plus marquée qu’une animation réservée aux informations qui changent. Garder la photo et le cadre stables entre les étapes, avec un fondu complet au changement d’activité, serait une amélioration de mise en scène distincte.
