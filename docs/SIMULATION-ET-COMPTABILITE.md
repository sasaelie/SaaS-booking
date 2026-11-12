# Simulation participant et lisibilité — rapport

## Changements livrés

- Le centre des encarts avec photo s’éclaircit par un dégradé radial progressif. Le traitement s’adapte aux textes blancs, noirs et vert sapin ; les bords conservent la photo.
- Les réseaux utilisent des symboles cohérents et reconnaissables (WhatsApp, Facebook, Instagram, TikTok, YouTube et site), dans un petit cadre de verre. La flèche parasite a été retirée ; les liens gardent leurs noms accessibles.
- Les conditions proposent des consignes et une politique de départ avec exemple de report. Depuis le contenu ouvert, le propriétaire retrouve « Modifier les consignes et les règles de report » : le formulaire concerné et les paramètres structurés s’ouvrent directement. Le visiteur ne voit pas cet accès. Le texte accepté reste enregistré avec son empreinte sur chaque réservation.
- Le comparatif distingue explicitement inclus, absent, limité et conditionnel : vert clair, vert très pâle et nuances intermédiaires. Les limites restent écrites, sans dépendre de la couleur seule.
- Le bouton d’apparence ouvre une simulation authentifiée. Les anciennes adresses `?from=appearance` sont réorientées vers elle pour l’organisateur concerné ; elles refusent l’accès sans autorisation, sans retomber sur une réservation réelle.
- Le téléchargement principal est un classeur Excel : Synthèse, Réservations, Journal, Mode d’emploi. Organisation, date, périmètre, devise, références et libellés sont préparés même sans opération. Les formules ont des résultats zéro enregistrés ; les valeurs bancaires inconnues restent signalées. Le CSV historique reste disponible via l’API pour compatibilité.

## Mode d’emploi

1. Ouvrir **Mes espaces → votre espace → Apparence et réglages → Tester le parcours participant**.
2. Choisir une activité, une séance et des coordonnées de test, puis valider. Selon le paiement configuré, poursuivre le paiement de test ou le lancer depuis la liste.
3. Simuler un refus ou une réussite. Une réservation gratuite n’a pas de paiement à simuler.
4. Consulter **Mes réservations de test**, également accessible dans le menu organisateur : TEST, état orange/vert, détails, gestion, codes de report et suppression.
5. Une annulation éligible génère un code de report TEST réutilisable dans cet espace de simulation. Aucun message n’est envoyé à l’adresse saisie.
6. Supprimer les essais manuellement. La suppression retire le test de la liste, libère sa place de test, anonymise ses coordonnées et invalide son lien ; les traces techniques isolées sont conservées pour ne pas casser les dépendances entre avoirs de test.
7. Dans **Ma formule**, télécharger le classeur comptable. Les simulations n’y apparaissent jamais.

## Garanties vérifiées

Le moteur de réservation, les règles de capacité, le consentement, l’annulation et les reports sont réutilisés avec des tables différentes. Le schéma privé de simulation contient uniquement une copie de la configuration nécessaire et les essais créés volontairement : aucun dossier participant, compte, mot de passe ou session d’authentification n’y est copié.

Chaque entrée serveur vérifie l’appartenance à l’organisation réelle. Les jetons utilisent un secret dérivé distinct ; les codes sont cherchés exclusivement dans le schéma choisi. Aucun client Stripe ou Resend et aucun exécuteur de tâches externes ne sont branchés à ce parcours. Le paiement par virement est simulé par sa validation de paiement ; aucun justificatif bancaire réel n’est demandé dans la simulation.

Le schéma ne se replie jamais sur les tables publiques si une table manque. Tous ses liens entre tables restent internes. Les comptes anonymes et les autres organisations sont refusés. Les réservations, places, tâches et écritures réelles restent inchangées pendant les essais.

## Vérifications

- `npm run verify` : types et lint conformes, **97 tests unitaires réussis**.
- PostgreSQL local : **115 tests d’intégration réussis**, dont isolation, capacité séparée, paiements simultanés sans doublon, refus de jetons/codes croisés, suppression et absence de repli vers le réel.
- **88 scénarios navigateur distincts validés** : suite complète (87 réussites, une ancienne attente CSV remplacée par XLSX), puis les 9 scénarios concernés exécutés avec succès sur la compilation finale. Ils couvrent notamment : paiement hors ligne et carte simulés, refus/réussite, annulation, code, suppression, refus anonyme/inter-organisation, conditions modifiables et export vide.
- Compilation Next.js réussie. Audit des dépendances de production : **0 vulnérabilité signalée** après correction de la dépendance UUID de l’outil Excel.
- Vérification Supabase après migration 019 : **16 tables isolées**, RLS sur chacune, **0 droit exposé** aux rôles PUBLIC/anon/authenticated, **0 référence étrangère vers les tables réelles**, aucun essai créé sur la base hébergée pendant la migration.

## Aperçus et fichier de démonstration

- [Catalogue avec centre éclairci](simulation-et-comptabilite/catalogue-photo-mobile.png)
- [Réseaux sociaux](simulation-et-comptabilite/reseaux-mobile.png)
- [Réservation de test réussie](simulation-et-comptabilite/test-reussi-mobile.png)
- [Exemple Excel vide](simulation-et-comptabilite/comptabilite-vide.xlsx)

L’analyse de sécurité Supabase ne signale que l’information « RLS activé sans politique » : comportement attendu pour ces schémas privés sans accès API, réservés au serveur. [Description de ce contrôle](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Points à conserver pour la maintenance

Les futures migrations qui modifient les tables métier doivent faire évoluer leur structure dans le schéma de simulation. Les essais restent isolés et supprimables manuellement ; ils ne remplacent pas une vérification des véritables comptes de paiement et de messagerie avant une ouverture commerciale.

Les montants historiques ou en attente de rapprochement ne sont pas transformés en frais estimés. Les totaux bancaires incomplets sont identifiés comme partiels ; le journal ne double pas les remboursements déjà comptés dans la synthèse.

Les règles proposées sont un point de départ personnalisable : l’exception au droit de rétractation est formulée pour les activités de loisirs à date déterminée, sans l’étendre automatiquement à tout service. Les délais de report sont toujours pilotés par leurs champs dédiés.
