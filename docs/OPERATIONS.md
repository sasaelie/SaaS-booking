# Opérations serveur

Les commandes `POST /api/admin` exigent un jeton signé par le fournisseur OIDC configuré, avec `role=admin` et `organization_id` égal à l’organisation demandée. Le fournisseur d’identité doit gérer lui-même comptes, sessions et attribution des droits.

Exemples de corps JSON (identifiants réels à renseigner) :

```json
{"action":"close","organizationId":"UUID","sessionId":"UUID","reason":"Indisponibilité","confirmCancelExistingBookings":false}
```

Le serveur renvoie `CONFIRMATION_REQUIRED`, le nombre de dossiers concernés et un `confirmationHash`. Renvoyer la commande avec `confirmCancelExistingBookings=true` et ce hash. Si les réservations ont changé, une nouvelle confirmation est demandée.

Autres actions :

- `pause` : organisation, activité, `startsAt`, `endsAt` ISO, raison et mêmes champs de confirmation. Les séances manuelles restent prioritaires sur les pauses.
- `review-bank` : organisation, réservation et décision `APPROVE`/`REJECT`.
- `view-proof` : organisation et réservation ; réponse contenant une URL privée temporaire.
- `cancel` : organisation, réservation et booléen `adminOverride` explicite.
- `external-benefit` : organisation et code ; réservé au service de cours en ligne agissant avec une identité organisateur vérifiée.
- `privacy` : organisation et réservation ; demande traitée par un administrateur après identification du demandeur.

Les remboursements bancaires manuels sont conservés dans `bookings.refund_status=MANUAL_PENDING`, avec `refund_deadline` et montant encaissé. Ils doivent être rapprochés du compte bancaire et marqués comme traités par l’organisateur. Les remboursements Stripe et les notifications sont des tâches persistées, pas un traitement synchrone garanti en cas de panne du prestataire.

## Tâches

Un ordonnanceur appelle `POST /api/jobs` avec `Authorization: Bearer <CRON_SECRET>`. Il traite l’anonymisation des dossiers impayés anciens puis un lot de tâches externes. Les tâches utilisent un verrou PostgreSQL et `SKIP LOCKED`. Une tâche échouée garde son état et devient réessayable après le délai configuré. Des exécutions répétées sont nécessaires pour vider une file importante.

Surveiller le nombre et l’ancienneté des tâches en attente, les tentatives, les remboursements manuels et les erreurs de configuration. Les logs masquent les entrées utilisateur et les messages bruts des prestataires.

## Exploitation des images

Les en-têtes sont filtrés puis une vraie image doit être décodée et réencodée par Sharp. Un simple en-tête JPEG/PNG ne suffit pas. Le bucket doit refuser tout accès public et se situer dans la région requise. Désactiver les versions conservées ou appliquer une politique de suppression qui purge aussi les versions, selon les garanties de votre stockage.

La suppression après décision bancaire est activée par défaut via `organizations.auto_delete_bank_proof`. Si l’organisateur désactive ce réglage, le justificatif reste privé et sa clé reste en base ; aucune tâche de purge liée à la décision n’est créée. Définir alors une durée de conservation adaptée. Les demandes d’effacement continuent de traiter les justificatifs concernés.
