# Finaliser la page commerciale

La prévisualisation conserve le nom **Studio Créatif 360**, conformément au choix de l’utilisateur après vérification de Kreno. Le nom de la plateforme et sa signature sont centralisés dans `src/config/platform-brand.ts` ; les noms des organisations et leurs liens sont indépendants.

## Coordonnées à compléter progressivement

Les pages Mentions légales et Contact affichent les rubriques avant même de connaître les coordonnées. Une valeur manquante est indiquée « À compléter ». Aucun lien vide, numéro inventé ou e-mail personnel déduit du compte n’est publié.

Les informations professionnelles validées peuvent être renseignées dans la configuration du service :

| Information | Configuration |
| --- | --- |
| Nom ou raison sociale de l’éditeur | `PUBLIC_LEGAL_NAME` |
| Adresse professionnelle complète, avec pays | `PUBLIC_LEGAL_ADDRESS` |
| Numéro d’entreprise BCE | `PUBLIC_BUSINESS_NUMBER` |
| Numéro TVA, si applicable | `PUBLIC_VAT_NUMBER` |
| Régime TVA et présentation des prix | `PUBLIC_TAX_STATUS` |
| E-mail professionnel autorisé à être public | `PUBLIC_CONTACT_EMAIL` |
| Téléphone professionnel autorisé à être public | `PUBLIC_CONTACT_PHONE` |

Chaque champ valide s’affiche indépendamment. Un e-mail devient un lien de contact ; un téléphone valide devient un lien d’appel. L’absence ou l’invalidité d’un autre champ ne masque pas une coordonnée déjà correcte. Une actualisation de la configuration hébergée nécessite le déploiement correspondant.

Ces emplacements rendent la maquette vérifiable ; ils ne remplacent pas l’identification légale nécessaire à un lancement commercial. Les textes précisent encore les informations et engagements à finaliser : traitement des données, prestataires, facturation, régime TVA et conditions contractuelles.

## Domaine et référencement public

`NEXT_PUBLIC_APP_URL` reste l’adresse technique de l’application. `PUBLIC_SITE_URL` désigne le domaine public confirmé de la page commerciale ; aucun domaine d’exemple n’est présenté comme acquis.

L’indexation est désactivée par défaut. La recette conserve `noindex`, un fichier robots qui interdit l’exploration et un sitemap vide. Les pages de compte, liens personnels et simulations ne font pas partie du sitemap public.

Après finalisation des informations et préparation d’un environnement de production adapté, `SEARCH_INDEXING_ENABLED=true` permet l’indexation des pages commerciales sur le domaine confirmé. Cette option est ignorée en recette et en déploiement de prévisualisation. Les coordonnées d’identification requises doivent aussi être complètes. Ce contrôle ne certifie pas, à lui seul, la conformité des textes.

L’ouverture publique devra ensuite être vérifiée sur son vrai domaine : accès anonyme, URL canonique, image de partage, robots, sitemap et formulaires réels. Le domaine pourra être ajouté à Google Search Console puis le sitemap soumis par son propriétaire. L’indexation et le classement dépendent de Google ; leur obtention n’est pas garantie par un déploiement.

## Recherche et contrôle du nom

Voir [la recherche sur Kreno](../RECHERCHE-NOM-KRENO.md) et [les décisions marketing et sources](../PLAN-ACCUEIL-COMMERCIAL.md). Aucun achat de domaine, activation de paiement réel ou changement des données d’organisations n’est réalisé pour cette prévisualisation.
