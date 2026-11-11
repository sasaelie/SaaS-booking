# Navigation, retours et alignements — 11 novembre 2026

Travail ajouté à la branche `codex/audit-actions-links`, dans la continuité de la PR 14.
Les essais utilisent Chromium et la base locale fictive, sans modification des comptes hébergés.
Le style ivoire, verre et vert sapin est conservé.

## Constats et corrections

1. Le retour mobile d'une fiche ou de la création d'activité menait au tableau de bord ; aucun
   retour équivalent n'était présenté en haut de ces pages sur ordinateur. Les deux interfaces
   disposent maintenant du même parent logique. Le retour de « Mes espaces » ne pointe plus sur
   la page elle-même : il mène à l'accueil.
2. Les formulaires « Coût exceptionnel » et « Report pour un cours en ligne » utilisaient des
   champs natifs distincts du reste de l'application. Mesures initiales : sélecteur de 19 pixels,
   montant de 28,5 pixels, angles droits et largeur partielle. Ils utilisent désormais les composants
   partagés, avec labels associés explicitement, largeur de colonne et hauteur minimale de 48 pixels.
3. Des cartes de gestion d'activité et d'administration se touchaient. Les sections disposent
   d'espacements réguliers ; les doubles marges inutiles sont retirées. « Voir les inscrits » est
   intégré au bloc récapitulatif de l'activité. L'action d'en-tête conserve sa largeur lisible.
4. Les actions compactes, textuelles et le retrait d'un créneau avaient des cibles plus petites.
   Les boutons concernés et le retour mobile disposent d'une cible d'au moins 44 pixels.
   Les retours en double sont masqués sur mobile quand le même retour est déjà présent en tête.
5. Le menu peut être fermé avec Échap ; le focus revient sur son bouton. Un lien activé au clavier
   ferme le menu après navigation. Les titres courants restent des informations non cliquables.

## Règles de retour

| Écran | Destination du retour |
| --- | --- |
| Mes espaces | Accueil |
| Créer un espace | Mes espaces |
| Tableau de bord d'un espace | Mes espaces |
| Liste des activités, réservations, partage, apparence, réglages, abonnement | Tableau de bord de l'espace |
| Fiche d'activité et nouvelle activité | Liste des activités du même espace |
| Détails d'une séance | Tableau de bord du même espace |
| Administration, vue d'ensemble | Mes espaces |
| Administration, opérations et historique sur mobile | Vue d'ensemble de l'administration |

Les destinations sont explicites et déterminées par la page et l'espace autorisé, sans dépendre
uniquement de l'historique du navigateur. Elles restent utiles après une arrivée par lien direct.
L'historique Précédent du navigateur est également testé après le retour depuis une activité.
Les parcours participant et le retour vers Apparence conservent leurs règles d'accès existantes ;
les visiteurs ne reçoivent aucun lien d'administration privé.

## Vérifications

- Nouveaux scénarios : retours hiérarchiques, historique, destinations non circulaires,
  clavier et focus, administration mobile, alignement des formulaires, séparation des cartes,
  titres longs et cohérence des boutons d'entrée.
- Mesures à 320, 390, 768 et 1 440 pixels : absence de débordement horizontal, labels et champs
  alignés, champs de 48 pixels minimum, cibles concernées de 44 pixels minimum et cartes espacées.
- Les parcours existants de navigation organisateur, participant et gestion des réservations
  sont rejoués pour vérifier les conséquences des changements communs.
- Les composants React utilisent les labels partagés et leurs identifiants de champ ; le composant
  de retour ne reçoit que les identifiants d'espaces, sans nouvelle lecture réseau.

| Contrôle exécuté sur cette version | Résultat |
| --- | --- |
| TypeScript strict et ESLint | Réussis |
| Tests unitaires | 86 réussis |
| Build Next.js | Réussi |
| Recette Chromium complète | 68 parcours réussis en 2,5 minutes |
| Nouveaux scénarios de navigation et de présentation | 7 réussis |

Les captures finales ont été inspectées sur téléphone et ordinateur. Les contrôles géométriques
passent aux quatre largeurs. Les tests SQL de l'audit précédent ne sont pas recomptés comme une
nouvelle exécution ici : ce complément ne modifie ni les règles métier ni les écritures de données.

## Captures réelles du navigateur

| Écran | Avant | Après |
| --- | --- | --- |
| Coûts — téléphone | [Avant](navigation-alignements/avant-couts-mobile.png) | [Après](navigation-alignements/apres-couts-mobile.png) |
| Activité — ordinateur | [Avant](navigation-alignements/avant-activite-ordinateur.png) | [Après](navigation-alignements/apres-activite-ordinateur.png) |
| Abonnement — téléphone | [Avant](navigation-alignements/avant-abonnement-mobile.png) | [Après](navigation-alignements/apres-abonnement-mobile.png) |

Autres aperçus : [activité sur téléphone](navigation-alignements/apres-activite-mobile.png),
[formulaire de coût sur ordinateur](navigation-alignements/apres-couts-ordinateur.png).
Les personnes, espaces et données visibles sont fictifs ; les captures viennent de sessions locales.

## Limites

Les clics connectés dans Vercel ne sont pas certifiés par ces captures locales : sa protection et
l'absence de session applicative du propriétaire dans le navigateur de l'agent restent distinctes.
Les paiements réels ne sont pas activés. Aucune nouvelle fusion ou publication Vercel n'est effectuée
par cet audit. Le rapport des actions précédentes reste disponible dans
[AUDIT-BOUTONS-LIENS.md](AUDIT-BOUTONS-LIENS.md).
