# État fonctionnel avant déploiement

Relevé du 8 novembre 2026. Aucun déploiement autorisé à ce stade ; Stripe et Mollie sont reportés par le propriétaire.

## Interfaces et connexions

| Interface | Connexion implémentée | Vérification et limite actuelle |
| --- | --- | --- |
| Inscription, connexion, récupération du mot de passe | Better Auth, sessions et PostgreSQL | Parcours local vérifié. Expéditeur réel à configurer pour les liens d’e-mail. |
| Organisation, activités et séances | API de gestion, cas d’usage et repositories Drizzle | Écritures PostgreSQL vérifiées ; droits et isolation testés. |
| Réservations des participants | Catalogue, disponibilités et réservation atomique | Parcours navigateur et SQL vérifiés localement, dont confirmation sans paiement en ligne. |
| Gestion des inscrits, annulations et pauses | Commandes serveur avec contrôle d’accès | Transactions et protections testées ; notifications dépendent des services externes. |
| Administration de la plateforme | Organisations, accès offert et suspension | Console branchée ; compte administrateur vérifié à attribuer avant exploitation. |
| Partage, widget, bouton et QR code | Pages publiques et routes dédiées | Intégration sur un autre site local et QR vérifiés. URL publique stable encore absente. |
| Personnalisation et preuves bancaires | Adaptateur de stockage privé | Décodeur et parcours testés avec stockage de test ; bucket réel non connecté. |
| Paiements et abonnement actuel | Parcours Stripe et webhooks implémentés | Tests automatisés uniquement ; aucun compte prestataire connecté. |
| Mollie et abonnement annuel | Plan d’intégration | Développement restant, aucune activation. |

Les interfaces partagent le même serveur et la même base **lorsque l’environnement est configuré**. La base Supabase de recette est initialisée, mais la connexion de l’application à celle-ci n’est pas encore renseignée. Aucun parcours complet hébergé n’a donc été validé.

## Ordre de grandeur

Environ **70 % de préparation du SaaS complet à une mise en service** : estimation de travail restante, pas une mesure du code ni une garantie. Les écrans et le moteur principal sont construits et testés localement. Les branchements réels, leur recette et les nouveaux parcours de paiement restent déterminants. Cette estimation ne signifie pas que 70 % des réservations fonctionneraient.

Une démonstration sans paiement en ligne est plus proche qu’un lancement commercial : connexion SQL, messagerie et hébergement suffisent à avancer sur son parcours principal, avec un accès offert attribué par l’administrateur. Les images et justificatifs nécessitent en plus le stockage privé. Ne pas ouvrir une billetterie réelle avant validation complète.

## Diagnostic reproductible

```bash
npm run check:deployment
```

Le script lit les variables du processus, affiche uniquement les noms des paramètres manquants, puis compare en lecture seule les migrations de la base avec les empreintes du dépôt. Il ne lance ni migration, ni paiement, ni envoi d’e-mail. Il ignore volontairement Stripe et Mollie pendant cette phase.

Pour charger un fichier de configuration local privé avec Node 24 :

```bash
node --env-file=.env.local --import tsx scripts/check-deployment.ts
```

Un code de sortie non nul indique une configuration manquante/invalide ou un contrôle SQL échoué. Un résultat positif confirme seulement la présence de configuration et le registre de migrations ; tester séparément les services réels, TLS, sauvegardes et tâches planifiées.

## Restant sans les paiements

1. Renseigner la connexion SQL sécurisée, puis vérifier l’application avec Supabase.
2. Configurer l’expéditeur d’e-mail et vérifier inscription, récupération et notifications réelles.
3. Configurer le stockage privé, sa purge et les tâches différées.
4. Préparer le compte administrateur du propriétaire, sauvegardes, restauration et supervision.
5. Après autorisation : héberger une recette, vérifier les parcours complets et les URL de partage. Aucune publication ni fusion de la branche sans confirmation.

Le détail des projets déjà préparés figure dans [HEBERGEMENT-RECETTE.md](HEBERGEMENT-RECETTE.md).
