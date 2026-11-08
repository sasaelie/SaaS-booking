# Environnement de test sans paiement réel

Branche `feat/staging-environment`, issue de `main` après fusion de la PR 3. L’objectif est de tester le vrai moteur, les comptes, les activités et la gestion des inscriptions sans attendre les prestataires de paiement.

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

## Connexions manquantes — saisir uniquement dans les paramètres sécurisés

[Paramètres Vercel du projet](https://vercel.com/elis-projects-ddf0bd9d/saas-booking/settings/environment-variables). Choisir **Preview**, jamais Production pour cette recette.

| Paramètre | Provenance |
| --- | --- |
| `DATABASE_URL` | Supabase → Connect → Session pooler, port 5432, mot de passe et TLS avec vérification complète. Les clés publiques Supabase ne remplacent pas cette URL. |
| `NEXT_PUBLIC_APP_URL` | Adresse HTTPS stable de la recette, fixée avec l’hébergement. |
| `RESEND_API_KEY`, `MAIL_FROM` | Compte Resend et adresse d’envoi autorisée. Pour tester avec plusieurs destinataires, vérifier le domaine d’expédition. |
| `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET` | Supabase Storage → configuration S3, bucket **privé** dédié à la recette. Copier les valeurs du projet. |
| `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` | Identifiants S3 serveur dédiés à ce stockage de recette. |

`DATABASE_SCHEMA=booking`, les secrets HMAC, Better Auth et de tâches, et les deux réglages staging/paiements sont déjà préparés en Preview. Ne pas copier les secrets dans Git, les captures ou le chat. Les connecteurs d’administration disponibles n’ont pas fourni les identifiants SQL, S3 ou Resend ; le raccordement applicatif reste donc incomplet.

L’e-mail de vérification reste obligatoire. Aucun lien de validation, mot de passe ou faux compte privilégié n’est exposé pour contourner la messagerie manquante.

## Hébergement

Le propriétaire demande maintenant une recette accessible pour tester, puis une mise en service payante plus tard. Le projet Vercel séparé existe, mais aucun déploiement n’a été créé : il manque les connexions ci-dessus.

La [règle officielle Vercel](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage) réserve Hobby à l’usage personnel non commercial et définit l’usage commercial par la finalité de gain financier du déploiement. Elle n’accorde pas d’exception explicite au test privé d’un futur SaaS commercial. Confirmer l’éligibilité de cet usage auprès de Vercel ou choisir une offre adaptée avant publication. Aucune souscription payante n’est activée automatiquement.

## Vérification avant ouverture de la recette

1. `npm run check:deployment` : présence des paramètres et empreintes des migrations, sans écriture SQL.
2. `npm run check:storage` : vérifier les permissions et la suppression du vrai stockage de recette. Le script retire son fichier en fin de contrôle ; en cas d’échec de suppression, vérifier le préfixe `diagnostics/`.
3. Inscription avec réception d’un vrai e-mail, validation et connexion, puis récupération du mot de passe. Attribuer ensuite le rôle plateforme au compte vérifié du propriétaire choisi explicitement.
4. Créer une organisation de test, accorder l’accès offert, publier une activité sans paiement et réserver une place ; vérifier confirmation, annulation et accès organisateur.
5. Configurer l’ordonnanceur pour appeler `POST /api/jobs` avec son secret, puis vérifier la livraison et les reprises des tâches. La présence de `CRON_SECRET` ne signifie pas qu’un ordonnanceur tourne.
6. Vérifier logo, arrière-plan et justificatif bancaire avec la vraie purge ; contrôle de l’iframe et du QR depuis un autre site.

Les tests destructifs restent réservés à la base locale `booking_test`, jamais à Supabase. Les preuves de recette hébergée seront consignées une fois ces parcours exécutés ; elles ne sont pas remplacées par les résultats locaux.
