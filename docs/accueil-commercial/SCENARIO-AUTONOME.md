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
| Création | Organisateur | Le nom, l’horaire, la capacité et le tarif se remplissent dans une fiche de préparation | 2,8 s |
| Publication | Organisateur | Les séances sont proposées au client et apparaissent dans le calendrier | 2,2 s |
| Sélection | Client | Le second horaire est sélectionné ; le jour et l’heure du calendrier correspondent | 2,2 s |
| Confirmation | Organisateur | Le planning reçoit une réservation simulée d’une place et les disponibilités diminuent d’une place | 4 s |

La séquence passe ensuite à l’activité suivante : Ateliers, Soins, Sport, puis recommence. Les données restent explicitement fictives. Les capacités de démonstration sont cohérentes entre création et réservation : 5 vers 4 places disponibles, 1 vers 0, puis 4 vers 3.

Le code précédent arrêtait durablement le scénario dès un toucher ou un focus dans toute la zone. Ce comportement est retiré. Un toucher de lecture ou un défilement ne demande plus d’appuyer sur Reprendre. Seul le bouton Pause arrête volontairement le scénario jusqu’à une reprise explicite. Le focus clavier sur une commande suspend temporairement les changements, afin de préserver son utilisation ; quitter la commande autorise la reprise automatique.

## Tarifs de la page de vente

Les offres sont désormais deux compositions ouvertes et centrées, sans grands cadres : icône, nom, montant dominant, description courte, frais et lien de choix. Elles sont côte à côte sur ordinateur et empilées sur mobile. Les montants proviennent de `COMMERCIAL`, pas d’une copie manuelle des prix. La limite de deux activités en Liberté et les frais Stripe à la charge de l’organisateur en Pro restent visibles dans l’offre concernée.

Les liens conservent le choix Liberté ou Pro dans les parcours d’inscription et de connexion. Les explications, l’économie annuelle de 88 €, le comparateur et les notes placées sous les offres sont supprimés de la page de vente. Le pied de page conserve les informations et les liens légaux.

## Vérification locale

Les 26 scénarios navigateur ciblés sont validés. Ils parcourent les quatre états sur les trois activités sans aucun clic sur Play ni requête POST, vérifient les heures et les places restantes, confirment qu’un toucher du calendrier n’arrête pas la lecture et contrôlent sa reprise après un passage hors écran. Les pauses volontaires restent actives. Les liens des deux offres, le parcours de connexion et les contrôles d’accessibilité passent également.

TypeScript, ESLint, 126 tests unitaires et la construction optimisée Next.js sont également validés. Les écrans sont vérifiés à 320, 390, 768 et 1440 px ; la comparaison des formules et le choix annuel restent disponibles dans l’espace organisateur.

Lighthouse mobile local : performance 96/100, accessibilité 100/100, LCP 0,9 s, CLS 0. Ces mesures de laboratoire ne préjugent pas des résultats en conditions réelles.

Deux contrôles historiques du comparateur ont aussi été validés dans la page d’abonnement organisateur : ils vérifient les 27 catégories, la distinction des disponibilités et le style des liens. Ils ne cherchent plus le comparateur supprimé de la page de vente.
