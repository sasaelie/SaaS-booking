# Qualité visuelle — premier lot

Après validation de l’audit du 17 novembre 2026, ce pilote simplifie les dispositions communes de l’espace organisateur. Il conserve le verre lumineux, le rayon de 8 px des boutons, les couleurs et les statuts métier.

## Changements

- Navigation mobile : une barre retour/titre/menu de 70 px ; identité, compte et déconnexion accessibles dans le menu. Sur ordinateur, la colonne latérale conserve ces accès visibles.
- Menu : fermeture après navigation, y compris par le lien de marque ; Échap ferme le menu et rend le focus à sa commande. L’ordre des éléments dans le document suit l’ordre visuel mobile.
- Réservations : filtre d’activité sur toute la largeur mobile ; recherche sur une ligne dédiée ; état et bouton de filtrage regroupés. Sur grand écran, les quatre commandes sont alignées.
- Fiche d’inscrit : un cadre principal, puis des sections sans sous-cartes pour le billet, les reports et les opérations de virement. L’annulation reste séparée par son titre, son espacement, son séparateur et son indicateur rouge.
- Ouverture de fiche : chevron associé au libellé existant, orienté selon l’état ouvert/fermé ; informations longues autorisées à revenir à la ligne.
- Activités : suppression de la double flèche sur « Gérer », sans retirer le style de verre des actions.
- Réglages : espacement régulier entre l’identité de l’organisation et les moyens de paiement.
- Référentiel : jeton historique de rayon relié au rayon du verre ; descriptions anciennes de boutons mats et d’en-tête flottant clarifiées.

Les contrats, autorisations, requêtes, conditions de report, réservations, paiements et annulations ne sont pas modifiés. Les sections visuelles continuent d’appeler les mêmes composants et opérations.

## Preuves visuelles

[Comparatif avant/après](/workspace/artifacts/visual-pilot-reservations/avant-apres.html), sur les mêmes réservations fictives que l’audit.

| Largeur | Hauteur de l’en-tête après correction | Largeur du filtre d’activité | Débordement horizontal |
| --- | --- | --- | --- |
| 320 px | 70 px | 288 px | Aucun observé |
| 390 px | 70 px | 358 px | Aucun observé |
| 768 px | Colonne latérale | 516 px | Aucun observé |
| 1 440 px | Colonne latérale | 404 px | Aucun observé |

À 390 px, l’ancien en-tête occupait environ 200 px. Les champs de filtre plus larges prennent une ligne supplémentaire, mais la liste commence malgré tout plus tôt. La fiche dépliée gagne aussi de la place en supprimant les enveloppes intérieures.

Captures : [fiche mobile](/workspace/artifacts/visual-pilot-reservations/reservations-390-open.png), [ordinateur](/workspace/artifacts/visual-pilot-reservations/reservations-1440-open.png), [menu](/workspace/artifacts/visual-pilot-reservations/menu-390.png), [réglages](/workspace/artifacts/visual-pilot-reservations/reglages-390.png). Mesures et erreurs navigateur : `checks.json`, dans le même dossier ; aucune erreur JavaScript relevée pendant ces captures.

## Vérification

- Compilation de production et `npm run verify` : TypeScript, ESLint et 156 tests unitaires.
- Dix parcours navigateur ciblés : recherche et filtres de paiement, destinations du menu, retours à quatre largeurs, historique, navigation clavier, fermeture du menu, déconnexion avec invalidation de session, consultation/validation d’un justificatif de virement et récupération du code participant.
- Le scénario du compte mobile vérifie aussi le retour par la marque puis la déconnexion depuis le menu. Les captures visuelles ne remplacent pas ce contrôle d’interaction.
- Une ambiguïté de nom accessible entre le lien de marque et le lien Réservations a été repérée par les tests puis corrigée, sans masquer le problème dans les sélecteurs de test.

Pas de validation Safari sur appareil réel ni de conclusion de conformité globale du contraste. Aucun déploiement ou changement de base distante n’est effectué dans ce lot.

## Suite du plan

Ce pilote couvre la référence commune et les premiers ajustements de disposition. Il ne termine pas les lots du parcours participant, du tableau de bord, de l’éditeur d’apparence ou de l’accueil marketing. Le [plan global](PLAN-QUALITE-VISUELLE-2026-11-17.md) reste la référence pour ces étapes.
