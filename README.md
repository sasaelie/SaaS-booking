# SaaS booking — Studio Créatif 360

Moteur de réservation Next.js App Router, TypeScript strict et PostgreSQL, organisé en domaine, ports, cas d’usage et adaptateurs.

## Installation

Node.js 22.12 ou plus récent (Node 24 recommandé).

```bash
npm ci
cp .env.example .env.local
```

Configurer PostgreSQL, l’URL de l’application et le secret de signature dans `.env.local`. Les scripts de base utilisent les variables du processus ; les commandes suivantes chargent explicitement ce fichier :

```bash
node --env-file=.env.local --import tsx scripts/migrate.ts
npm run verify
npm run build
npm run dev
```

Les migrations sont versionnées et protégées par checksum et verrou. Le schéma fourni auparavant n’avait ni connexion ni migration exécutable : ces migrations constituent le schéma initial de cette version. Pour une base déjà créée manuellement avec l’ancien schéma, préparer une migration de reprise dédiée sur sauvegarde ; ne pas appliquer les migrations initiales sur cette base.

## Démonstration locale

Sur une base de développement uniquement :

```bash
ALLOW_DEMO_SEED=true node --env-file=.env.local --import tsx scripts/seed.ts
```

Le script affiche le chemin de l’activité de démonstration. Cette activité confirme les réservations sans paiement en ligne et ne les marque pas comme encaissées. Un utilisateur choisit une séance, fournit ses coordonnées et accepte les conditions. Le lien de gestion permet l’annulation et le dépôt d’un justificatif selon le mode de paiement du dossier.

## Fonctions et garanties techniques

- Réservation sous transaction et verrou SQL, contrôle de capacité, d’organisation, de créneau et de conditions côté serveur.
- Idempotence liée à l’organisation et au contenu normalisé de la demande.
- Conditions archivées avec empreinte SHA-256 ; numéros d’urgence contenant réellement des chiffres.
- Dates locales invalides, inexistantes ou ambiguës refusées ; dates de fin de mois bornées.
- Report appliqué et place réservée ensemble ; consommation unique, complément Stripe et protection contre un ancien paiement après réutilisation du code.
- Checkout Stripe avec e-mail prérempli et clé d’idempotence stable ; signature réelle, montant, devise, compte et références vérifiés sur webhook.
- Confirmation sans paiement en ligne distincte d’un encaissement ; références Checkout/PaymentIntent et coordonnées de virement conservées en instantané.
- Fermeture et ajout de pause nécessitant une confirmation à jour ; annulations et obligations de remboursement persistées avant les effets externes.
- E-mails, remboursements et purges en file durable PostgreSQL avec reprises ; clés d’idempotence transmises aux prestataires.
- Justificatifs décodés/réencodés, limites de poids et de dimensions, bucket privé et URL temporaire pour administrateur.
- Liens de gestion HMAC à durée limitée, payload validé et version révocable. Le jeton est placé dans le fragment du lien pour éviter sa transmission dans l’URL HTTP.

Les règles automatiques imposent 200 lignes par fichier TypeScript, 40 lignes par fonction, l’absence de `any` et les frontières entre cœur et adaptateurs. La composition serveur se trouve dans `src/composition/` ; les points d’entrée App Router y obtiennent leurs cas d’usage sans importer les adaptateurs ou SDK directement.

## Paiements, administration et tâches

Les activités Stripe nécessitent les clés Stripe ; les activités par virement nécessitent les coordonnées bancaires de l’organisation et le stockage privé. Les services absents échouent explicitement, sans faux succès. Les e-mails requièrent Resend et un expéditeur validé.

Les opérations administratives passent par `POST /api/admin` avec un jeton OIDC fourni par votre fournisseur d’identité. `issuer`, `audience`, signature, rôle `admin` et claim `organization_id` sont contrôlés ; sans configuration, l’accès est refusé. Voir `docs/OPERATIONS.md` pour les commandes.

Planifier `POST /api/jobs` régulièrement avec un secret dédié. Les tâches sont réessayées après échec ; un prestataire indisponible laisse une tâche en attente. La purge après décision bancaire est activée par défaut et respecte le réglage de l’organisateur ; elle est tentée immédiatement puis réconciliée en base par la file. Surveiller les tâches différées et leur ancienneté.

## Vérifications

```bash
npm run verify
npm run build
TEST_DATABASE_URL=postgresql://postgres:booking_test_only@127.0.0.1:55432/booking_test npm run test:integration
```

Les tests d’intégration exigent une base locale jetable `booking_test` et refusent toute autre URL. Appliquer d’abord les migrations avec `DATABASE_URL` pointant vers cette base. Ils effacent ses données entre les scénarios. Les tests navigateur utilisent aussi uniquement des données de démonstration locales.

## Limites et configuration de production

Les tests automatisés ne remplacent pas une validation de paiement en environnement Stripe de test avec vos clés, ni le contrôle des permissions de votre bucket, des e-mails et de votre fournisseur d’identité. Aucun compte ou déploiement de production n’est créé par ce dépôt.

La région UE de la base, du stockage, des sauvegardes et des journaux est à configurer chez les hébergeurs. Utiliser un bucket privé sans conservation de versions incompatibles avec la purge des justificatifs. Configurer HTTPS, la confiance du proxy pour l’adresse client, les sauvegardes et la surveillance de la file.

Les clauses contractuelles et la politique de conservation constituent des paramètres métier à faire valider pour l’organisation. La conservation comptable de sept ans reste la valeur initialement demandée, calculée à partir de la fin de l’année du paiement ; elle ne représente pas une certification juridique de la durée applicable en Belgique. Vérifier les obligations actuelles avant traitement de données ou paiements réels.
