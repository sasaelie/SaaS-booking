# Référentiel visuel — 17 novembre 2026

Ce document rassemble les décisions validées dans la conversation, utilisées pour l’[audit global](AUDIT-VISUEL-GLOBAL-2026-11-17.md). Une proposition de l’audit ne devient pas automatiquement une nouvelle règle.

## Décisions à préserver

| Élément | Référence retenue |
| --- | --- |
| Identité | Vert sapin, sauge, ivoire, dégradé personnalisable, typographie et photos d’activité. Conserver les différences utiles entre marketing, organisateur et participant. |
| Boutons | Matière de verre claire, reflet et ombre portée, coins de **8 px**. Éviter l’assombrissement ajouté qui avait été refusé. Conserver les états de focus, de pression et d’indisponibilité. |
| Composition | Réduire les cadres inutiles et les superpositions décoratives qui encombrent. L’espacement et les titres peuvent séparer des informations sans ajouter une carte. |
| Exceptions de composition | Le montage marketing photo + calendrier en décalé a été apprécié : ne pas supprimer toutes les superpositions. Le QR garde un fond adapté à sa lecture. |
| En-tête marketing | **Opaque, pleine largeur, fixe au défilement, avec ombre** ; le contenu glisse dessous. Cette décision remplace l’ancienne proposition d’en-tête flottant translucide. |
| Tarifs marketing | Grands prix centrés, présentation aérée inspirée de la référence fournie. Pas de doubles cadres décalés. Ne pas réintroduire les explications et appels à l’action supprimés. |
| FAQ | Accès à une page dédiée, sans réintroduire une longue FAQ dans l’accueil. |
| Démonstration | Déroulement automatique, activité et calendrier liés. Surfaces stables ; seuls les détails nécessaires changent. Transition existante : sortie 1 s + entrée 1 s, soit 2 s au total. |
| Choix d’une séance | Toute la sélection s’éclaire avec la couleur de l’activité, accompagnée d’une coche. Garder une distinction perceptible au clavier et au survol. |
| Événements | Les événements à venir restent éclairés ; les événements terminés/annulés s’éteignent. Une séance complète n’est pas une séance terminée. |
| Aujourd’hui | Lueur de couleur discrète pour le jour actuel, indépendante du jour consulté ou sélectionné. |
| Navigation des jours | Sept jours sur une seule bande commune, sans sept petits blocs surélevés ni passage sur deux lignes. |
| Vues du planning | Journée et mois sur mobile ; semaine disponible lorsque l’espace le permet. Vue mensuelle continue à sept colonnes et accès aux horaires du jour choisi. |
| Cohérence des calendriers | Même langage visuel côté participant et organisateur, avec des actions adaptées à chaque rôle. |
| Images importées | Témoin vert après enregistrement et chargement effectifs ; formats PNG/JPEG/WebP et limite de taille visibles. |
| Texte de présentation | Préserver le choix d’activité, la modification du nom/prix dans l’activité et le placement du titre/prix par glissement ou au clavier. |
| Billet | Code entièrement accessible, copie, QR, enregistrement du PDF préparé et gestion de réservation. Ne pas réintroduire un champ de code tronqué. |
| Chargement | Conserver le retour visuel validé pendant la navigation, avec prise en compte de la réduction des animations. |

Le rayon de 8 px vise les **boutons**. Il n’impose pas de donner ce rayon à tous les panneaux, photos, champs ou badges. Une bordure de champ, un groupe sémantique de formulaire ou une case du calendrier n’est pas automatiquement un cadre inutile.

## Propositions à comparer, pas encore validées

- Donner moins de place aux utilitaires : œil du mot de passe, poignées de placement, compte et déconnexion. Comparer une variante de verre plus discrète avant de généraliser une exception.
- Distinguer l’action principale des actions secondaires par leur place, leur largeur et leur typographie, en gardant la matière validée.
- Regrouper les compteurs, réduire la répétition du contexte entre les étapes et rapprocher le calendrier des tâches courantes.
- Établir une échelle commune d’espacement et de texte. Proposition de départ : pas de 8/12/16/24/32 px, texte courant 15–16 px, aides généralement au moins 12 px ; ce ne sont pas des normes antérieurement approuvées.
- Affiner l’ombre du texte si elle dégrade la netteté, avec comparaison visuelle ; le reflet du verre doit rester reconnaissable.

## Documents historiques à réconcilier

`INTERFACE.md` décrit encore des boutons mats de 16 px et un ancien choix d’horaires. `accueil-commercial/CADRES-ET-PHOTOS.md` décrit un en-tête translucide flottant. Ces passages ne doivent pas servir à annuler les validations suivantes.

À la date de l’audit, le jeton historique `--button-radius: 16px` coexistait avec `--glass-button-radius: 8px`. Les boutons examinés utilisaient effectivement 8 px. Le premier lot relie désormais le jeton historique au rayon du verre et corrige les descriptions obsolètes dans les deux documents cités ci-dessus.
