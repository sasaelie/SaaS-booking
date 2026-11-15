# Animation reliée aux chargements réels

Le calendrier fixe, le cadre de verre, l’ombre douce et les trois points lumineux reprennent l’essai validé. Le chargement est affiché pendant l’attente réelle ; aucun délai n’est ajouté à la disponibilité de la page et aucun pourcentage fictif n’est affiché.

## Navigation interne

`AppLink` conserve les propriétés et le comportement de Next.js Link. Un enfant sans DOM utilise `useLinkStatus` pour enregistrer une attente réelle dans `PageNavigationProvider`. Les navigations déjà prêtes ne montrent rien ; l’indicateur n’est monté qu’après 200 ms d’attente. Son entrée dure 240 ms et sa sortie 180 ms, à partir de son opacité réelle. Le mode de réduction des animations conserve le même délai d’apparition mais affiche une version fixe.

Chaque attente possède une fonction de libération idempotente. La fin, l’interruption ou le démontage du lien libère cette attente ; plusieurs navigations simultanées ne se remplacent pas avec un simple booléen. Une nouvelle navigation pendant la sortie reprend depuis l’opacité affichée. La sortie attend `Animation.finished`, y compris son annulation ou l’absence d’animation.

La zone en attente est marquée `aria-busy`. Le statut de chargement reste à l’extérieur de cette zone pour que son annonce ne soit pas retenue. La couche ne masque pas le menu organisateur ni l’en-tête commercial ; ses limites sont recalculées au défilement et au redimensionnement. Aucun focus n’est déplacé vers l’animation. Les liens externes, les téléchargements et les ancres conservent le comportement natif de Next.js.

## Attente de données côté serveur

Les fichiers `loading.tsx` des pages participants, de l’espace protégé, des simulations et des intégrations embarquées utilisent le même composant. Ils permettent notamment de servir le calendrier pendant l’attente du premier contenu dynamique. Lorsqu’une navigation est déjà en cours, la limite de chargement reprend son attente jusqu’à l’arrivée des données, afin de conserver un seul indicateur visible.

La racine commerciale garde son rendu serveur complet : une limite de streaming globale y aurait masqué le contenu aux visiteurs sans JavaScript. Les premiers chargements des documents commerciaux restent rendus côté serveur, tandis que leurs navigations interactives utilisent `useLinkStatus`. Les titres, métadonnées, liens légaux et choix d’abonnement restent lisibles sans JavaScript. L’indicateur ne prétend pas être visible avant la réception du premier HTML par le navigateur.

## Contrôles

Les contrôles navigateur ralentissent une vraie requête interne et, dans la seule base locale jetable `booking_test`, bloquent temporairement la lecture des activités dans une transaction annulée ensuite. Ils vérifient le premier chargement participant, la continuité pendant le streaming des données, la navigation entre pages commerciales, la conservation du menu organisateur, la disparition de l’indicateur quand la page est prête et l’absence de chargement pour une ancre.

Le test de l’essai visuel, la réduction des animations et les parcours sans JavaScript restent conservés. Aucun appel métier, paiement, compte ou donnée d’organisation hébergée n’est modifié par cette intégration.

Validation locale : TypeScript, ESLint, 126 tests unitaires, compilation optimisée Next.js et 23 parcours navigateur ciblés réussis, incluant le rendu commercial sans JavaScript, les métadonnées, le choix d’offre et l’historique des sessions. Les ralentissements sont imposés uniquement par les tests, sur le réseau ou la base locale jetable.
