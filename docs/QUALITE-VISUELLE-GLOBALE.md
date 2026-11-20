# Cohérence visuelle globale

Cette version étend le premier lot à **toutes les familles d’interfaces** de l’application. Le périmètre comprend les 38 modèles de page inventoriés, et non uniquement la page Réservations. Le propriétaire a explicitement demandé une livraison cohérente de l’ensemble, sans nouvelle étape d’approbation entre les lots.

## Identité conservée

Verre clair et lumineux, boutons de 8 px, palette personnalisable, typographies, photos d’activité, en-tête marketing opaque et pleine largeur, tarifs centrés, composition photo/calendrier décalée, bande des sept jours, vue mensuelle, éclairage des séances et lueur du jour actuel.

La démonstration conserve son fonctionnement automatique et ses transitions validées. Le billet conserve son code complet, le QR, la copie et le téléchargement du fichier préparé. Aucune logique métier ou autorisation d’accès n’est modifiée par cette mise en cohérence.

## Application aux interfaces

| Famille | Disposition et présentation appliquées |
| --- | --- |
| Accueil marketing | Une action d’inscription dominante, connexion secondaire, texte plus court, titre et réassurances plus compacts sur mobile, aperçu rapproché. Pictogrammes vectoriels de lecture/pause. |
| FAQ, contact, documents publics | Pied de page mobile à deux colonnes alignées, liens conservés, typographie et espacement communs. Aucune information légale inventée pour remplacer les mentions provisoires. |
| Inscription et connexion organisateur/participant | Cadre principal conservé, commandes de mot de passe intégrées au champ avec un relief plus discret, aides plus lisibles ; actions et focus préservés. |
| Catalogue et choix de séance | Identité, photos et actions conservées ; calendrier partagé cadré sur les heures utiles du jour consulté, option explicite pour afficher les 24 heures. |
| Coordonnées participant | Résumé activité/prix/date à la place du grand encart répété ; modification de séance sur une ligne avec cible tactile ; informations pratiques repliables ; un seul panneau de consignes au bon endroit. |
| Confirmation et gestion de réservation | Billet et opérations existants conservés ; pas de nouveau cadre autour du QR ou du code. Statuts de paiement, justificatifs, annulation et report vérifiés avec le reste du parcours. |
| Réservation intégrée et simulation | Même formulaire, calendrier, résumé et consignes que le parcours public ; le mode de test reste explicitement identifiable. |
| Navigation et pages organisateur | Barre mobile compacte, compte et déconnexion dans le menu, retours et clavier préservés ; rythme d’espacement commun aux pages, fiches et formulaires. |
| Tableau de bord | Compteurs regroupés dans un seul ensemble ; accès aux virements/remboursements conservés ; calendrier remonté avant les essais, qui restent accessibles. |
| Activités, séances, inscrits | Flèches non dupliquées, fiches d’inscrits allégées, sections de formulaire séparées par leur titre et l’espace plutôt qu’un cadre par sous-groupe. |
| Apparence, logo et photo | Réglages et aperçu côte à côte sur grand écran, empilés sur mobile ; sauvegarde rattachée aux réglages ; texte déplaçable sans panneau artificiel ; curseurs, clavier, formats et diode conservés. |
| Partage et abonnement | Partage regroupé dans une surface avec sections par tâche ; liens, exports et intégrations conservés. Abonnement et comparatif bénéficient du rythme commun des pages et formulaires. |
| Administration, opérations et historique | Navigation et formulaires communs ; opérations et historique regroupés en listes de lignes, sans une grande carte indépendante par entrée. |
| Retours et erreurs | Retour de paiement accompagné d’explications et d’accès au code participant ; erreurs publiques avec retour explicite vers l’accueil. Aucun encaissement affirmé sans confirmation serveur. |
| Chargement et états vides | Composants validés conservés et revérifiés avec les styles communs, sans ajouter d’animation ni de panneau décoratif. |

## Références et preuves

- [Comparatif global avant/après](/workspace/artifacts/quality-global-after/comparatif.html) : accueil, authentification, participant, tableau de bord, apparence, partage, administration et billet.
- [Galerie des états corrigés](/workspace/artifacts/quality-global-after/index.html).
- [Couverture des 38 modèles de page](COUVERTURE-QUALITE-GLOBALE.md) ; les variantes et les limites y sont distinguées.
- Dossier local `/workspace/artifacts/quality-global-after/` : `manifest.json`, `coverage.json`, `coverage.csv`, `accessibility.json`, captures ciblées de calendrier et de photo, contrôles complémentaires.

Les captures utilisent des données fictives locales. Les quantités d’opérations peuvent varier entre les séries ; les comparaisons portent sur la disposition, pas sur un pourcentage de gain de hauteur ou de conversion.

## Contrôles

La vérification porte sur le rendu à 320/390/768/1440 px selon les états, les libellés longs, les images, la navigation tactile/clavier, la conservation des coordonnées lors d’un retour au calendrier, les choix de séance et les parcours réels de gestion.

Le nouveau cadrage du planning est testé avec des séances de jour, une continuation après minuit et une fin exactement à minuit. L’option 24 heures laisse l’échelle complète accessible. Les tests existants couvrent les changements de mois/semaine, la sélection et les indicateurs lumineux.

Les contrôles ont notamment permis de corriger un titre présent en double dans une étape masquée, deux conflits de spécificité CSS et une commande de modification trop étroite. Les sélecteurs de test n’ont pas été rendus plus permissifs pour dissimuler ces défauts.

Les résultats finaux sont consignés dans `verification.json`, dans le dossier de preuves. L’exécution complète utilise le scénario Couture prévu par le dépôt, en plus des organisations fictives propres à chaque test.

- Compilation de production, TypeScript et ESLint réussis ; **158 tests unitaires réussis**.
- **148 parcours navigateur réussis**, sans échec ni scénario ignoré ; quatre parcours participant rejoués après le dernier ajustement de présentation, également réussis.
- **57 états capturés** pour les 38 modèles de page ; aucun débordement horizontal détecté aux largeurs contrôlées, ni erreur JavaScript dans les captures.
- Huit écrans sondés avec axe : aucune violation automatique rapportée ; le contraste reste à examiner manuellement sur les fonds translucides. Les groupes de l’aperçu ont désormais un rôle accessible explicite.
- Cas sans description, adresse ou information pratique : aucune rubrique vide affichée, un seul titre principal et coordonnées conservées après retour au calendrier.

## Limites précises

Les fonds translucides et les photos empêchent une conclusion automatique globale sur le contraste. Les contrôles axe et la revue des captures ne constituent pas une certification WCAG. Le rendu Safari sur téléphone réel et l’usage avec un lecteur d’écran réel ne sont pas déclarés vérifiés.

Les coordonnées légales et de contact publiques encore provisoires demandent les informations du propriétaire. Leur disposition est harmonisée, mais leur contenu n’est pas inventé. Aucun paiement ni e-mail réel n’est utilisé pour ces contrôles, et aucun déploiement distant n’est inclus dans cette phase.
