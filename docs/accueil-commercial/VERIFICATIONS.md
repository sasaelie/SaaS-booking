# Vérification de l’accueil commercial

Le parcours vérifié conduit de la présentation du produit vers les vrais formulaires de compte, puis vers le choix d’offre et l’espace correspondant. L’aperçu d’activité et le calcul d’économie sont des démonstrations identifiées, sans écriture de réservation ni appel de paiement.

## Contrôles locaux

| Contrôle | Résultat |
| --- | --- |
| TypeScript et ESLint, `npm run verify` | Réussis |
| Tests unitaires | 126 réussis |
| Tests PostgreSQL d’intégration | 132 réussis |
| Construction optimisée Next.js | Réussie |
| Parcours navigateur ciblés après corrections | 20 réussis |
| Formats vérifiés | 320, 390, 768 et 1440 px |
| Navigation sans JavaScript | Contenu, comparaison native, offres et pages légales accessibles |
| Accessibilité automatisée | Aucune violation détectée sur les contrôles WCAG A/AA sélectionnés, y compris 2.1 A et 2.2 AA |
| Identification encore incomplète | Rubriques visibles ; aucun lien e-mail ou téléphone vide |

Les contrôles navigateur ciblés couvrent la nouvelle page, les exemples, le calcul net illustratif, les pages légales, les métadonnées et l’image PNG de partage, les offres compactes entièrement cliquables, le maintien du choix Pro à travers la connexion, les retours, la déconnexion et l’isolation du contenu de session entre navigateurs. L’alignement des deux actions d’entrée est également vérifié aux quatre formats.

Le contrôle d’accessibilité couvre les trois exemples, la comparaison dépliée, les pages du pied de page, le lien d’évitement et un agrandissement du texte à 200 %. Le contrôle automatique ne remplace pas les essais avec différentes technologies d’assistance et ne constitue pas une certification EAA.

La CI de la pull request reconstruit le commit publié et rejoue l’ensemble des tests, au-delà des vingt parcours ciblés. Son résultat et ses artefacts constituent la référence pour la version exacte de la branche.

## Mesure de performance locale

Lighthouse mobile, sur construction optimisée locale : performance **98/100**, accessibilité **100/100**, bonnes pratiques **100/100**, LCP environ **1,1 s**, temps total de blocage **140 ms**, décalage cumulé de mise en page **0**. Ce relevé de laboratoire ne mesure ni les connexions des futurs visiteurs ni la charge réelle d’un domaine de production.

Le score SEO de recette est **63/100**, du fait de la non-indexation volontaire : balise `noindex`, en-tête `X-Robots-Tag` et fichier robots fermé. Les autres contrôles SEO pondérés du relevé réussissent. Cette protection ne doit pas être retirée pour améliorer artificiellement un score de test. L’indexation publique et les mesures terrain devront être vérifiées sur le domaine définitif.

## Données et déploiement

Les essais utilisent des comptes et activités fictifs dans PostgreSQL local. Aucun paiement réel, envoi de message à un tiers ou achat de domaine n’est effectué. Un contrôle en lecture seule dans la base hébergée a confirmé zéro conflit entre les nouvelles adresses publiques et les liens d’organisations existants. Les nouveaux noms de pages sont ensuite refusés à la création d’un lien d’organisation.

L’environnement de prévisualisation garde les paiements désactivés, la protection d’accès Vercel et la non-indexation. Les règles et écritures financières, les organisations, les réservations existantes et les données de participants ne sont pas migrées par cette livraison.

Voir [les décisions et sources](../PLAN-ACCUEIL-COMMERCIAL.md), [la recherche de nom](../RECHERCHE-NOM-KRENO.md) et [la préparation de la publication](MISE-EN-LIGNE.md).
