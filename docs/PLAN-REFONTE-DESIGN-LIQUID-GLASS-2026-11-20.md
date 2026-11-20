# Refonte visuelle Liquid Glass — 20 novembre 2026

## Périmètre validé

Appliquer la présentation du prototype fourni ([CodeFronts, Liquid Glass Sidebar Navigation](https://codefronts.com/design-styles/css-liquid-glass-effects/liquid-glass-sidebar-navigation/)) à toutes les interfaces : site public, connexion, réservation, billet, intégration, simulation, espace organisateur et administration. Palette violet, cyan et orange par défaut ; les couleurs enregistrées par les organisateurs restent prioritaires. Aucun changement des droits, liens, paiements, réservations, données personnelles ou règles métier.

## Principes

- Une surface de verre principale par groupe cohérent, séparateurs légers à l'intérieur.
- Navigation plate, repère coloré pour la page active ; pas de bouton en relief pour chaque lien.
- Hiérarchie des actions : action principale visible, actions secondaires discrètes et accessibles au clavier.
- Rayons de 22 px pour les grandes surfaces et de 8 px pour les boutons.
- Typographie système, contraste lisible, espaces réguliers, vues mobile et ordinateur.
- Conservation des diodes sémantiques, couleurs des événements, sélection lumineuse et calendrier semaine/jour/mois avec week-end.
- Palette du prototype réellement visible dans l'aperçu et restaurable ; personnalisation existante inchangée.

## Réalisation et vérification

Le socle commun est centralisé dans les jetons et les styles partagés ; les adaptations de disposition sont regroupées par famille d'écran. Les contrôles à vérifier incluent les liens/actions conservés, les formulaires, les menus mobiles, la personnalisation, le billet et le parcours intégré. Une matrice de captures et les résultats effectifs des contrôles seront ajoutés après exécution. La présence de 46 fichiers de page ne signifie pas que tous les états métier auront été testés.

## Changements réalisés

- Matière et palette centralisées dans les jetons ; anciennes variables conservées comme alias de compatibilité.
- Dispositions communes dans cinq fichiers ciblés : structure, actions, espace de travail, pages publiques et sections repliables.
- Navigation organisateur plate, page active violette ; onglets et choix de réglage plus discrets.
- Réglages regroupés sur une surface ; sections repliables séparées par une ligne, sans carte en relief pour chaque commande.
- Apparence : commandes sous l'aperçu, médias dans le même groupe, couleurs personnalisées conservées. Une valeur nulle restaure réellement les trois couleurs du prototype.
- Même palette par défaut pour les participants ; photos, texte blanc/noir/vert sapin et positionnement personnalisés conservés.
- En-tête et pied de page publics en verre ; typographie système et boutons de 8 px. Les liens secondaires restent sans soulignement et sans relief.
- Pression discrète des commandes, sélection lumineuse des événements et diodes métier conservées ; mouvement réduit et contraste renforcé pris en compte.
- Aucun changement de schéma, de migration, d'API, de couche métier, de paiement ou de service de messagerie.

## Contrôles

- `npm run verify` : TypeScript, ESLint et 235 tests unitaires réussis.
- `npm run build` : compilation de production réussie.
- 74 scénarios navigateur distincts couvrant navigation, apparence, réservations, calendrier, intégration, billets/PDF, administration, facturation et publication. Sept ont été réexécutés après le dernier ajustement de contraste et la mise à jour des attentes de couleur de l'ancienne interface ; ils passent tous. Quatre tests de réservation ont ensuite été réexécutés après l’allègement du bloc d’informations pratiques.
- Les attentes de palette du test photo ont été adaptées : texte de l'interface violet sombre, texte du bouton blanc sur violet ; les trois tons de légende et l'isolation de la photo restent vérifiés.
- Les essais de pression utilisent désormais 0,98 et les champs acceptent le rayon de la nouvelle présentation ; les assertions sur les destinations, les dimensions tactiles, le clavier et les opérations restent actives.

## Limites de la vérification

Les captures utilisent des données locales fictives et des états représentatifs. Elles ne prouvent pas la livraison réelle des e-mails, un paiement réel, la conformité de toute photo importée, ni tous les états possibles de chaque rôle. La finition de lancement reste celle du plan dédié. Les contrôles de contraste des surfaces transparentes et des photos comportent aussi des vérifications visuelles ; un scan automatique ne suffit pas à lui seul.

La matrice des 46 routes et les limites des contrôles figurent dans [la couverture détaillée](COUVERTURE-LIQUID-GLASS-2026-11-20.md).
