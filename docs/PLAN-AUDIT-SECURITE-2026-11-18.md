# Fiche entreprise, raccordements et audit général

Périmètre autorisé : ajouter des paramètres administrateur pour préparer les coordonnées d’entreprise et de contact, les prévisualiser puis les publier ; fournir un emplacement explicite pour préparer le raccordement Peppol. E-mail, téléphone, adresse et réseaux sociaux facultatifs. Ne pas publier les paramètres privés de facturation par simple sauvegarde et ne pas présenter un prestataire non raccordé comme opérationnel.

1. Inventorier les interfaces, routes API, autorisations, schémas, tâches et dépendances. Reprendre les audits antérieurs et vérifier les risques actuels à partir d’OWASP ASVS / recommandations Next.js et Supabase.
2. Implémenter une fiche publique avec brouillon distinct de la version publiée, contrôle administrateur, validation serveur, aperçu et publication explicite. Préserver les normes visuelles approuvées.
3. Ajouter une rubrique de raccordement Peppol indiquant précisément ce qui est configuré et ce qui dépend encore du choix / compte du prestataire. Aucun secret dans les données publiques, aucune transmission fictive.
4. Examiner la sécurité des sessions, l’isolation inter-organisations, les codes participant et reports, les mutations / CSRF, injections, téléversements, webhooks, exports, journaux, confidentialité, limitations et concurrence. Reproduire les défauts confirmés sur une base locale isolée et corriger avec des tests de régression.
5. Contrôler la base hébergée en lecture seule : RLS / privilèges, fonctions, contraintes, index et migrations. Les essais de charge et d’attaque restent locaux. Vérifier les protections de sauvegarde sans prétendre à une restauration jamais exécutée.
6. Améliorer la maintenance automatisée : CI, contrôle des dépendances, analyse statique, couverture et garde-fous de migration / sécurité ; documenter les opérations nécessitant encore un prestataire ou une décision d’exploitation.
7. Exécuter les suites unitaires, PostgreSQL et navigateur appropriées, la compilation et la revue UX / visuelle aux formats mobile / ordinateur. Livrer un rapport avec preuves, corrections, sévérité, limites et actions restantes ; publier la recette après vérification.

Les tests ne constituent pas une certification d’absence de toute faille. Aucune réservation réelle, aucun paiement ni message externe n’est créé par l’audit. Les coordonnées publiques ne sont pas inventées ni publiées à la place du propriétaire.
