# Plan de bataille — tableau de bord, contact et finitions

1. Remplacer les indicateurs inertes par des cartes entièrement cliquables : activité unique vers son détail, sinon liste ; réservations à venir vers leur filtre ; preuves et remboursements vers leur liste filtrée.
2. Calculer les réservations à venir avec les mêmes règles de places occupées que le calendrier, en excluant annulations, expirations, séances passées/annulées et données anonymisées. Distinguer l’historique dans un texte explicite.
3. Afficher un encart TEST dans le tableau de bord, avec nombre d’essais et accès à la liste isolée existante. Vérifier que la réservation signalée est bien conservée ; ne mélanger aucun test aux compteurs réels.
4. Ajouter le téléphone facultatif dans Réseaux et contact : normalisation du format belge/international, validation serveur, sauvegarde, relecture, suppression volontaire et lien d’appel dans les pages publiques. Le numéro est conservé dans la configuration JSON de contact existante de l’organisation ; aucune nouvelle table ni migration n’est nécessaire.
5. Reproduire le grand espace supérieur avec dégradé personnalisé, corriger la cause, compacter le début des pages participant. Tester sur mobile étroit, écran courant et bureau.
6. Vignettage : uniquement diminuer progressivement l’opacité du voile sombre au centre, sans couche blanche ajoutée. Préserver une lecture adaptée aux trois couleurs de texte.
7. Ajouter une ombre portée douce et discrète aux boutons et cadres cliquables ; uniformiser les liens sans soulignement, à peine agrandis, légèrement moins opaques et plus vifs, avec focus visible.
8. Vérifier validation et frontières des compteurs avec PostgreSQL, parcours utilisateur au navigateur, rendu et liens. Exécuter verify et build puis livrer la recette et le rapport. Aucune fusion automatique.
