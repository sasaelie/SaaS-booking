# Plan de qualité visuelle — 17 novembre 2026

Objectif : retrouver une interface aérée et une hiérarchie claire, en conservant le verre lumineux, les boutons de 8 px, les couleurs et les calendriers validés. Ce plan découle des [constats V01 à V12](AUDIT-VISUEL-GLOBAL-2026-11-17.md) ; il ne constitue pas une correction déjà appliquée.

## Ordre de travail proposé

| Lot | Périmètre et résultat | Constats | Critère pour terminer le lot |
| --- | --- | --- | --- |
| 0 — Référence commune | Réconcilier documentation et jetons ; inventorier action principale, secondaire, utilitaire et navigation. Référentiel de boutons, panneaux et états avec exemples réels. | V01, V12 | Aucune réintroduction des boutons mats/16 px ou de l’en-tête translucide ; décisions et propositions explicitement séparées. |
| 1 — Disposition commune | Navigation mobile plus courte ; compte dans le menu ; suppression des doubles flèches ; espaces réguliers entre sections ; libellés non comprimés. Pilotes : réservations et réglages. | V01, V02, V06, V08 | Retour, titre et menu restent visibles ; déconnexion accessible ; une seule flèche ; pas de libellé en trois lignes ; captures avant/après à 320/390/768/1440 px. |
| 2 — Réservation participant | Contexte compact à l’étape coordonnées, action de modification lisible, conditions mutualisées, cadrage utile du planning. Accompagner retours et erreurs. | V04, V05, V11 | Premier champ rapproché du début ; date/prix toujours visibles ; modification sans perdre la saisie ; choix et conditions accessibles ; aucun faux statut de paiement. |
| 3 — Gestion organisateur | Compteurs regroupés, calendrier remonté, essais secondaires mais accessibles ; fiche d’inscrit et formulaires structurés par tâche. | V03, V08 | Séances et tâches financières identifiables rapidement ; essais, inscrits, annulation et exports toujours accessibles. |
| 4 — Apparence fidèle | Aperçu proche de la page publiée ; poignée de déplacement distincte du texte ; sauvegarde associée aux réglages concernés ; import photo/logo plus lisible. | V01, V07 | Comparaison aperçu/public sur la même activité ; placement conservé après sauvegarde ; glissement et clavier opérationnels ; formats et diode exacts conservés. |
| 5 — Accueil et pages publiques | Une action dominante, aperçu rapproché sur mobile, pied de page plus compact ; informations provisoires renseignées par le propriétaire. | V09, V10 | Produit compris avant un long défilement ; aucune photo dupliquée ; prix, FAQ dédiée, en-tête opaque et montage photo/calendrier conservés. |
| 6 — Finition transversale | Lisibilité, pictogrammes, états, vues plateforme, contrastes sur plusieurs fonds, réduction des animations et contrôles sur appareil réel. | V06, V12 | Contrôles documentés par état ; aucun masquage de statut ; parcours clavier et Safari mobile réellement vérifiés avant de les déclarer validés. |

Les lots 1 et 2 apportent le bénéfice le plus direct. Le lot 0 évite de repartir vers d’anciennes règles contradictoires. Les retours/erreurs du lot 2 peuvent être traités indépendamment de la refonte du planning.

## Dispositions à prototyper

### Réservations et navigation mobile

1. Barre compacte : retour, titre courant, menu.
2. Titre métier et description courte ; filtre par activité suffisamment large pour être compris.
3. Liste des inscrits ; ouvrir une fiche donne les coordonnées, le billet et les opérations dans un même ensemble.
4. Annulation séparée par un titre et un espace clair, sans multiplier les panneaux imbriqués.
5. Dans le menu : compte, déconnexion et utilitaires ; les actions ne disparaissent pas.

### Coordonnées du participant

1. Marque et retour discrets.
2. Résumé activité, date, horaire, prix ; « Modifier la séance » sur une ligne exploitable.
3. Coordonnées ; code de report repliable ; choix facultatifs clairement distingués.
4. Conditions accessibles au niveau du consentement ; montant final et confirmation.
5. Le billet de confirmation déjà simplifié conserve sa hiérarchie. Ne pas le refaire sans problème observé.

### Tableau de bord

1. Titre et création d’activité.
2. Un ensemble de compteurs compact ; les virements/remboursements non nuls gardent une visibilité forte.
3. Prochaines séances et commandes du planning.
4. Accès aux essais et informations secondaires ensuite, ou depuis les utilitaires.

### Apparence

1. Choix organisateur/participant, puis réglages du groupe en cours.
2. Aperçu fidèle à proximité : à côté sur grand écran, immédiatement après le réglage sur mobile.
3. Poignées et commandes de précision identifiables comme outils d’édition.
4. Action de sauvegarde et statut rattachés au groupe ; import photo/logo dans une section dédiée.

## Règles d’exécution

- Produire des avant/après pour toutes les familles. Après le pilote Réservations, le propriétaire a demandé l’application de l’ensemble du plan en une livraison globale ; ne pas ajouter de nouvelle attente d’approbation entre ces groupes de travail.
- Comparer les variantes utilitaires discrètes au verre actuel ; ne pas imposer une suppression du verre à tous les boutons.
- Préférer des composants et variantes explicites à une règle CSS qui transforme tous les liens ou tous les boutons selon leur position dans le DOM.
- Garder les données, la sécurité et la logique métier hors des modifications purement visuelles ; préserver les états de paiement, de report, d’annulation et de capacité.
- Aucun bandeau fixe supplémentaire sans démontrer qu’il ne masque ni champ, ni clavier, ni action ; une sauvegarde mieux placée n’implique pas forcément une barre flottante.
- Ne pas remplacer tous les cadres par des séparateurs : conserver les groupes qui servent une tâche, les champs et les cellules de calendrier.

## Validation visuelle et fonctionnelle

| Axe | Vérification attendue |
| --- | --- |
| Adaptation | 320/390/768/1440 px, textes longs, organisation sans photo puis avec photo, pas de défilement horizontal de page. |
| Hiérarchie | Une action dominante par étape ; secondaires identifiables ; tâche courante accessible plus tôt sur mobile, mesurée sur la même fixture. |
| Calendrier | Aujourd’hui distinct du jour choisi ; même sélection au survol/clavier ; terminé éteint ; séance complète non éteinte à tort ; journée/mois/semaine et créneaux nocturnes conservés. |
| Formulaires | Labels, erreurs, états de sauvegarde, focus, conservation des données après retour ; aucune perte des champs nom/prix/placement. |
| Billet | Code complet copiable, QR lisible, téléchargement du billet préparé, retour à la gestion, distinction paiement attendu/encaissé. |
| Images | Chargement, succès, erreur, retrait ; diode verte seulement après succès ; formats autorisés visibles. |
| Lecture | Contraste du texte et des états vérifié sur fonds clairs, teintes personnalisées et photos difficiles ; ne pas se fier uniquement à axe. |
| Interaction | Tactile, clavier, zoom, réduction des animations ; vérifier le comportement sur Safari mobile réel. |
| Ingénierie | Contrôles du projet, tests ciblés sur les comportements affectés et captures comparables ; pas de batterie de tests répétée sans changement le justifiant. |

L’amélioration sera évaluée par des comparaisons concrètes : hauteur avant la tâche, lisibilité des libellés, quantité de conteneurs imbriqués utiles et accomplissement des parcours. Une réduction arbitraire du nombre de cartes ou une promesse de conversion ne remplace pas ces vérifications.

## Dépendances et état actuel

Le propriétaire doit fournir les informations publiques encore provisoires. Un appareil Safari réel reste nécessaire pour valider son rendu. L’envoi et la réception des e-mails demandent leur propre test opérationnel ; ils ne sont pas prouvés par un audit visuel.

À la fin de cette phase : rapport, référentiel, matrice de couverture et captures disponibles ; **aucune modification de l’interface ni déploiement effectué**. Les variantes et lots ci-dessus restent à mettre en œuvre après revue du plan.

Après le [premier pilote](QUALITE-VISUELLE-LOT-1.md), la demande a été étendue explicitement à toutes les interfaces. L’ensemble des groupes du plan est maintenant repris dans la [mise en cohérence globale](QUALITE-VISUELLE-GLOBALE.md), avec sa propre couverture et ses preuves. Les seules réserves indiquées concernent les informations publiques réelles et les vérifications nécessitant un appareil ou un usage non disponible dans l’environnement local.
