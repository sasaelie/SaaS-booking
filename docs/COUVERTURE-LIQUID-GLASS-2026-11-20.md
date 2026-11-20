# Couverture visuelle Liquid Glass

46 routes recensées, 60 états représentatifs, 252 captures. Mobile 390 px et ordinateur 1440 px pour chaque état ; 320 et 768 px supplémentaires sur les étapes de réservation. Aucun débordement horizontal relevé dans ces captures. Données locales fictives uniquement.

30 contrôles Axe (15 écrans, deux largeurs) sans violation détectée après stabilisation de la démonstration. Les contrastes sur photos et surfaces transparentes restent partiellement à vérifier visuellement ; cela ne constitue pas une certification d’accessibilité.

Comparaison des contrôles sur sept écrans, en mobile et ordinateur : aucune destination ni commande supprimée. Menus, photos, personnalisation et fonctions vérifiés séparément par les tests navigateur.

| Route | États inspectés |
| --- | --- |
| `/` | accueil |
| `/[organization]` | introuvable, catalogue |
| `/[organization]/[activityId]` | reservation-jours, reservation-mois, reservation-coordonnees, reservation-confirmee |
| `/accessibilite` | accessibilite |
| `/apercu-chargement` | chargement |
| `/app` | mes-espaces, espaces-vides |
| `/app/[organizationId]` | tableau-de-bord |
| `/app/[organizationId]/abonnement` | abonnement-offert |
| `/app/[organizationId]/activites` | activites |
| `/app/[organizationId]/activites/[activityId]` | activite-detail |
| `/app/[organizationId]/activites/nouvelle` | nouvelle-activite |
| `/app/[organizationId]/parametres` | apparence |
| `/app/[organizationId]/partager` | partager |
| `/app/[organizationId]/reglages` | reglages |
| `/app/[organizationId]/reservations` | reservations |
| `/app/[organizationId]/seances/[activityId]` | seance-detail |
| `/app/[organizationId]/tests` | tests-organisateur, tests-remplis |
| `/app/nouveau` | nouvel-espace |
| `/booking-result` | retour-paiement |
| `/compte/securite` | securite-administration |
| `/conditions` | conditions |
| `/confidentialite` | confidentialite |
| `/connexion` | connexion, connexion-participant |
| `/contact` | contact |
| `/embed/[organization]` | catalogue-integre |
| `/embed/[organization]/[activityId]` | reservation-integree |
| `/embed/[organization]/preview` | apercu-prive-catalogue |
| `/embed/[organization]/preview/[activityId]` | apercu-prive-activite |
| `/faq` | faq |
| `/inscription` | inscription |
| `/manage` | gestion-sans-code, gestion-confirmee, gestion-annulation, gestion-virement, simulation-gestion |
| `/mentions-legales` | mentions-legales |
| `/mot-de-passe-oublie` | mot-de-passe-oublie |
| `/nouveau-mot-de-passe` | nouveau-mot-de-passe |
| `/plateforme` | administration, administration-refusee |
| `/plateforme/finances` | finances, factures, ajustements |
| `/plateforme/historique` | historique |
| `/plateforme/operations` | operations |
| `/plateforme/parametres` | parametres-plateforme |
| `/plateforme/parametres/peppol` | peppol |
| `/plateforme/utilisation` | utilisation |
| `/simulation/[organizationId]` | simulation-catalogue |
| `/simulation/[organizationId]/activite/[activityId]` | simulation-activite, simulation-confirmee |
| `/simulation/[organizationId]/gestion` | simulation-gestion (redirection vers /manage) |
| `/simulation/[organizationId]/paiement/[bookingId]` | simulation-paiement |
| `/simulation/[organizationId]/reservations` | simulation-liste |

Les écrans de retour de paiement et de réinitialisation du mot de passe sont ici montrés sans jeton valide. La simulation de gestion utilise volontairement la même page /manage. La route de sécurité est montrée avant activation d’une méthode. Les différents facteurs d’authentification n’ont pas été réimplémentés.

Preuves locales : `/workspace/artifacts/liquid-app-final/manifest.json`, `accessibility.json`, `control-preservation.json`, `browser-initial.json`, `browser-final.json` et `unit.json`. La galerie `index.html` ouvre les captures à leur taille réelle.
