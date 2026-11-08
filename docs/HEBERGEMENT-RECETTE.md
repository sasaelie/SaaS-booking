# Préparation Supabase et Vercel — 8 novembre 2026

## État réel

La PR 3 est fusionnée dans `main` au commit `27d6a187e51f2d973b0094f1fd5a2056e5024f80`. Le propriétaire demande désormais un environnement de test accessible, sans paiements réels, avant la mise en service commerciale. Le visuel validé est conservé ; aucun abonnement d’hébergement payant n’est activé. La nouvelle préparation est documentée dans [ENVIRONNEMENT-TEST.md](ENVIRONNEMENT-TEST.md).

- Supabase existant : `sasaelie's Project`, référence `itkvrcxpaxygsluqymwk`, région `eu-north-1` (Stockholm), PostgreSQL 17.
- Le schéma applicatif privé `booking` contient 23 tables, dont le registre `schema_migrations` avec les neuf migrations et leurs empreintes SHA-256 identiques au dépôt.
- Aucune donnée client ou organisation fictive insérée. Le schéma `public` ne contient aucune table applicative.
- Accès au schéma retiré à `PUBLIC`, `anon` et `authenticated`. RLS activée sur les 23 tables, sans politique publique : refus par défaut pour les rôles ordinaires. Le backend devra disposer d’un rôle SQL autorisé. Les contrôles de locataire restent appliqués par l’application.
- Projet Vercel créé : `saas-booking`, ID `prj_In1LrV1sbG1zr414U32NVkhreOU5`, espace `elis-projects-ddf0bd9d`. Next.js, Node 24 et région de fonctions demandée `arn1`. Aucun dépôt Git connecté, aucun déploiement.
- Paramètres Preview préparés : `DATABASE_SCHEMA=booking` et trois secrets indépendants pour HMAC, Better Auth et les tâches planifiées. Aucune valeur secrète dans Git ou dans ce document. Rien configuré en Production.
- **La connexion applicative Supabase n’est pas encore établie** : `DATABASE_URL` et l’URL HTTPS de recette restent à fournir dans Vercel au moment du déploiement. Le connecteur d’administration permet les migrations, mais ne fournit pas le mot de passe SQL de l’application.

## Connexion lors de la future mise en ligne

1. Choisir une formule Vercel autorisant cet usage commercial avant publication. Hobby est réservé à l’usage personnel non commercial ; ne pas lancer une mise à niveau payante automatiquement.
2. Dans Supabase, bouton **Connect**, sélectionner **Session pooler**, port **5432**, puis copier la chaîne de connexion correspondant réellement à ce projet. Préférer un rôle backend dédié ; ne jamais envoyer la chaîne avec mot de passe dans le chat.
3. Dans les paramètres sécurisés du projet Vercel, ajouter `DATABASE_URL` comme secret **Preview seulement**, avec TLS et vérification du certificat (`sslmode=verify-full`). Conserver `DATABASE_SCHEMA=booking`. Les clés publiques/API Supabase ne remplacent pas cette connexion PostgreSQL.
4. Conserver une base et des secrets distincts pour une future production. La base actuellement préparée sert à la recette ; ne pas y placer de vrais clients avant validation.
5. Relier le dépôt `sasaelie/SaaS-booking` lorsque la publication sera autorisée ; déployer le commit vérifié, sans fusionner implicitement la PR 3. Fixer l’URL de recette, ajouter `NEXT_PUBLIC_APP_URL`, puis vérifier inscription, accès et réservation.
6. Configurer Resend et un domaine d’expédition validé pour la vérification d’e-mail. Ne pas désactiver cette vérification pour contourner l’absence d’expéditeur.
7. Configurer stockage privé et exécution de `POST /api/jobs` avant d’activer les preuves bancaires et les notifications différées. Contrôler restauration et sauvegardes avant une exploitation réelle.

Le pooler transactionnel Supabase **6543 est refusé par le code** : la facturation actuelle utilise un verrou consultatif PostgreSQL de session. Le port 5432 conserve cette session. Le pool applicatif est limité à trois connexions par instance, avec délais de connexion et d’inactivité. Surveiller le cumul des connexions Vercel ; une coordination persistée sera nécessaire avant un passage au pooler transactionnel.

## Migrations reproductibles

Les fichiers `migrations/001` à `009` ne sont pas modifiés. Le script suivant exporte les étapes JSON à appliquer dans l’ordre, chacune en transaction, à une **nouvelle base Supabase vide** :

```bash
node --import tsx scripts/export-hosted-migrations.ts > /tmp/booking-migrations.json
```

Le bundle inclut le schéma privé, les migrations existantes et leur registre, puis le durcissement. Ne pas le rejouer sur la base déjà initialisée. Les futures migrations utilisent le registre et le contrôle des empreintes de `scripts/migrate.ts`, avec `DATABASE_SCHEMA=booking`. Réappliquer `deploy/supabase-harden.sql` après ajout de tables ; les nouvelles tables privées ne sont pas exposées par la Data API.

Les scripts de migration, de démonstration et d’attribution administrateur respectent ce schéma. Un compte administrateur plateforme ne sera attribué qu’à un compte vérifié choisi par le propriétaire.

## Vérification de la base hébergée

Contrôles SQL effectués : 23 tables, 23 avec RLS, neuf migrations, zéro table publique et zéro organisation. Accès au schéma refusé aux rôles `anon` et `authenticated`.

L’analyse de sécurité Supabase ne signale que les informations « RLS Enabled No Policy » sur les tables privées. C’est volontaire : aucune lecture depuis le navigateur n’est autorisée ; ne pas ajouter une politique publique pour faire disparaître cet indicateur. [Explication Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Validation locale : TypeScript et ESLint, 38 tests unitaires, compilation Next.js, 41 tests PostgreSQL dans le schéma habituel puis les mêmes 41 tests dans un schéma privé local, y compris le parcours Better Auth. `TEST_DATABASE_SCHEMA` permet ce second passage sur la seule base locale jetable autorisée.

Ne jamais exécuter les tests d’intégration destructifs sur Supabase. Ils exigent une base locale jetable `booking_test`. La connexion réelle depuis Vercel, TLS, envoi d’e-mails et callbacks restent à tester après autorisation de publication.

## Tests de paiement pendant les vérifications du compte

- Stripe : clés `sk_test_…`, Sandbox et comptes Connect de test ; aucun encaissement réel. Tester aussi la signature et les retours webhook sur l’URL HTTPS de recette.
- Mollie : clé `test_…` pour les appels par clé ; avec Mollie Connect/OAuth, utiliser explicitement `testmode=true` sur les opérations compatibles. Le Checkout de test permet de simuler succès et échec sans argent réel. L’accès à ces fonctions dépend de l’état et des permissions du compte ; le mode test ne débloque pas les paiements réels.
- Une clé API de test ne suffit pas à intégrer Mollie Connect ou les abonnements. Ces développements restent prévus dans `PLAN-PAIEMENTS-MOLLIE.md`, sans activation actuelle de Mollie ni de l’annuel.
- Les identifiants seront saisis dans les secrets de l’hébergement, jamais dans Git ou le chat.

Références : [Stripe](https://docs.stripe.com/connect/testing), [Mollie](https://docs.mollie.com/reference/testing), [connexion Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres), [Vercel Hobby](https://vercel.com/docs/plans/hobby).
