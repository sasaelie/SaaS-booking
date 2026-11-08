# Environnement de test sans paiement réel

Branche `feat/staging-environment`, issue de `main` après fusion de la PR 3. L’objectif est de tester le vrai moteur, les comptes, les activités et la gestion des inscriptions sans attendre les prestataires de paiement. **L’application est maintenant déployée en Preview protégée** : voir [RECETTE-EN-LIGNE.md](RECETTE-EN-LIGNE.md) pour l’adresse, les vérifications et les limites restantes.

## Réalisé

- Configuration explicite `APP_ENVIRONMENT=staging` et `PAYMENTS_ENABLED=false`. Une configuration staging autorisant les paiements est rejetée.
- Bandeau de recette sur les pages ; Stripe et Mollie clairement désactivés, sans faux statut « connecté ».
- Blocage serveur des paiements Stripe, remboursements, OAuth et abonnements, même en présence accidentelle d’une clé réelle. Les paramètres ne proposent plus les boutons de connexion/facturation dans ce mode.
- Les activités sans paiement en ligne restent testables. L’administrateur peut accorder un accès offert, par le parcours existant et journalisé ; aucune activation automatique de privilèges.
- Compatibilité du client S3 avec les endpoints personnalisés utilisant des chemins de bucket, dont Supabase Storage.
- Contrôle `npm run check:storage` : création d’une image isolée sous `diagnostics/`, lecture signée, refus d’accès sans signature, suppression et vérification de disparition. Il est limité à la recette. Ce contrôle nécessite les vrais paramètres du bucket et n’a pas encore été validé sur le stockage hébergé.
- Variables Preview préparées dans Vercel pour désactiver les paiements. Aucune clé de paiement ajoutée.

Le mode recette ne simule pas un encaissement Stripe/Mollie. La simulation des prestataires dans les tests automatisés ne constitue pas une connexion à leurs environnements de test officiels.

Contrôles locaux réussis : TypeScript et ESLint, 41 tests unitaires, 41 tests PostgreSQL, compilation Next.js en mode staging et dix parcours Chromium. Le dernier contrôle vérifie le bandeau et l’absence de boutons de connexion Stripe et de souscription payante. Les tests unitaires vérifient aussi qu’aucun SDK Stripe ne démarre lorsque les paiements sont désactivés. Ces résultats ne certifient pas les connexions hébergées encore manquantes.

## Paramètres de connexion — saisir uniquement dans les paramètres sécurisés

[Paramètres Vercel du projet](https://vercel.com/elis-projects-ddf0bd9d/saas-booking/settings/environment-variables). Choisir **Preview**, jamais Production pour cette recette.

| Paramètre | Provenance |
| --- | --- |
| `DATABASE_URL` | Supabase → Connect → Session pooler, port 5432, mot de passe et TLS avec vérification complète. Les clés publiques Supabase ne remplacent pas cette URL. |
| `NEXT_PUBLIC_APP_URL` | Adresse HTTPS stable de la recette, fixée avec l’hébergement. |
| `RESEND_API_KEY`, `MAIL_FROM` | Compte Resend et adresse d’envoi autorisée. Pour tester avec plusieurs destinataires, vérifier le domaine d’expédition. |
| `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET` | Supabase Storage → configuration S3, bucket **privé** dédié à la recette. Copier les valeurs du projet. |
| `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` | Identifiants S3 serveur dédiés à ce stockage de recette. |

`DATABASE_SCHEMA=booking`, les secrets HMAC, Better Auth et de tâches, et les deux réglages staging/paiements sont déjà préparés en Preview. Ne pas copier les secrets dans Git, les captures ou le chat.

Mise à jour : `DATABASE_URL` a été renseignée par le propriétaire comme Secret Preview. Un diagnostic Vercel a réussi une connexion TLS avec vérification du certificat et du nom d’hôte et a lu les neuf migrations de `booking.schema_migrations`. Le déploiement de diagnostic `dpl_CG3V3D67KmrZSDvcSohP9AiTgcSB` est READY en Preview ; il contient uniquement une page de diagnostic, **pas l’application complète**. Aucune écriture SQL n’a été réalisée par ce contrôle.

Le certificat public officiel Supabase Root 2021 CA est configuré via `DATABASE_SSL_CA` en Preview. Source : https://supabase-downloads.s3.amazonaws.com/prod/ssl/prod-ca-2021.crt ; empreinte SHA-256 : `807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA`. L’application et les scripts appliquent désormais TLS strict aux hôtes Supabase ; un `sslmode=disable` présent dans l’URL ne peut pas désactiver cette vérification. Le certificat est public ; il ne contient pas de mot de passe.

Le compte Resend connecté ne comporte encore aucun domaine ni clé applicative au moment du contrôle. Les identifiants S3, l’expéditeur et l’ordonnanceur restent à préparer ; les parcours complets hébergés ne sont pas encore validés.

L’e-mail de vérification reste obligatoire. Aucun lien de validation, mot de passe ou faux compte privilégié n’est exposé pour contourner la messagerie manquante.

## Hébergement

Le propriétaire demande maintenant une recette accessible pour tester, puis une mise en service payante plus tard. Le projet Vercel séparé existe avec une Preview de diagnostic SQL ; la recette complète de l’application attend les raccordements restants ci-dessus.

La [règle officielle Vercel](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage) réserve Hobby à l’usage personnel non commercial et définit l’usage commercial par la finalité de gain financier du déploiement. Elle n’accorde pas d’exception explicite au test privé d’un futur SaaS commercial. Confirmer l’éligibilité de cet usage auprès de Vercel ou choisir une offre adaptée avant publication. Aucune souscription payante n’est activée automatiquement.

## Vérification avant ouverture de la recette

1. `npm run check:deployment` : présence des paramètres et empreintes des migrations, sans écriture SQL.
2. `npm run check:storage` : vérifier les permissions et la suppression du vrai stockage de recette. Le script retire son fichier en fin de contrôle ; en cas d’échec de suppression, vérifier le préfixe `diagnostics/`.
3. Inscription avec réception d’un vrai e-mail, validation et connexion, puis récupération du mot de passe. Attribuer ensuite le rôle plateforme au compte vérifié du propriétaire choisi explicitement.
4. Créer une organisation de test, accorder l’accès offert, publier une activité sans paiement et réserver une place ; vérifier confirmation, annulation et accès organisateur.
5. Configurer l’ordonnanceur pour appeler `POST /api/jobs` avec son secret, puis vérifier la livraison et les reprises des tâches. La présence de `CRON_SECRET` ne signifie pas qu’un ordonnanceur tourne.
6. Vérifier logo, arrière-plan et justificatif bancaire avec la vraie purge ; contrôle de l’iframe et du QR depuis un autre site.

Les tests destructifs restent réservés à la base locale `booking_test`, jamais à Supabase. Les preuves de recette hébergée seront consignées une fois ces parcours exécutés ; elles ne sont pas remplacées par les résultats locaux.

## Justificatifs et personnalisation — novembre 2026

La recette utilise maintenant `STORAGE_BACKEND=postgres` : vrais fichiers privés dans le schéma `booking`, migration 010, limite de 5 MiB par image et quota global de 50 MiB. Ce backend est refusé hors staging. La production conserve l’adaptateur S3 ; `check:storage` reste le diagnostic S3. Le parcours PostgreSQL est vérifié par les tests d’intégration et navigateur.

Un participant utilise « Gérer ma réservation », choisit une image puis l’envoie. L’organisateur ouvre **Activités → Voir les inscrits → nom du participant → Consulter le justificatif**. La fiche contient les coordonnées, la séance, le statut et les actions de gestion. Le filtre par activité reste actif pendant la pagination. Le fichier est accessible par un lien signé de cinq minutes ; lorsque la suppression automatique est activée (valeur par défaut), confirmer ou refuser le virement supprime le fichier. Une capture seule ne constitue pas une confirmation bancaire : l’organisateur vérifie son compte avant de confirmer.

Les pages participant ont un fond mauve clair distinct du vert sauge de gestion, en conservant le verre et les textes foncés. La page de gestion comporte un retour à l’activité. **Apparence et réglages** regroupe les thèmes existants, le logo et l’image d’ambiance ; les images utilisent aussi le stockage privé de recette. Les couleurs d’organisation personnalisées restent prioritaires sur les pages publiques.

Le nom court demandé à la création d’un espace compose l’adresse publique de l’organisation (`/coucouture` par exemple). Il ne s’agit pas d’une adresse postale ni d’un achat de domaine.

Sécurité Supabase après migration 010 : RLS activée sur `private_files`, aucun droit pour `PUBLIC`, `anon` ou `authenticated`. Le diagnostic Supabase signale uniquement l’information « RLS Enabled No Policy », attendue pour un schéma privé réservé au serveur (accès client refusé par défaut) : https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy.

## Apparence indépendante et navigation

La migration 011 ajoute deux teintes optionnelles par organisation. Les réglages préexistants restent applicables tant qu’aucune teinte personnalisée n’est enregistrée. Seul le propriétaire peut enregistrer les couleurs ; les bornes 0–359 sont vérifiées par Zod et PostgreSQL.

**Apparence** (`/parametres`) contient le sélecteur Organisateur/Participants, le curseur accessible au clavier, un aperçu immédiat, l’enregistrement explicite et le retour aux couleurs par défaut. La base ivoire et la couleur du texte restent imposées. Le logo et la photo sont dans une section repliable. Les teintes sont appliquées à la console, au catalogue, aux pages d’activité et à la gestion de réservation.

**Réglages** (`/reglages`) regroupe l’identité, l’IBAN, les règles de suppression et les connexions de paiement. Le menu mobile affiche Retour, un titre non interactif et Menu. Les liens de navigation partagent un traitement uniforme et la page active possède un repère distinct ; les actions conservent les boutons de verre.
