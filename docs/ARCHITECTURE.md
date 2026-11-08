# Architecture

`src/core/domain/` contient les règles de calcul et de décision. Les contrats de persistance et de services sont dans `src/core/ports/`. Les cas d’usage valident les entrées et orchestrent les ports, avec des retours `Result`. Les adaptateurs implémentent les frontières PostgreSQL, Stripe, stockage, authentification et e-mails.

`src/composition/` est le point de composition serveur : il instancie les adaptateurs et les injecte dans les cas d’usage. L’interface importe ce point d’entrée typé pour appeler les cas d’usage et n’importe aucun SDK ou adaptateur directement. Le cœur n’importe jamais la composition.

## Transactions

Les écritures de réservation sont sérialisées par activité pour coordonner modèle, pauses, prix et fermeture. Une clé d’idempotence est verrouillée avant la lecture du dossier existant. Les ressources sont prises dans un ordre stable : activité, voucher, séance, réservation. L’état est recontrôlé après les verrous.

Retourner un `Result` en erreur ne suffit pas à annuler une transaction Drizzle. La frontière SQL convertit les échecs en signal de rollback interne, puis les restitue comme `Result` normalisé et journalisé.

La file `outbox_jobs` est écrite dans la même transaction que l’état métier. Les effets externes sont exécutés ensuite avec une clé stable et des reprises. Les accusés externes ne peuvent pas être inclus dans une transaction PostgreSQL ; les reprises doivent rester idempotentes. La rétention des clés chez les prestataires et les longues indisponibilités doivent être supervisées.

Les migrations SQL contiennent les contraintes d’intégrité, les références composites par organisation et les restrictions de suppression. Le schéma Drizzle est découpé par responsabilité ; les migrations versionnées constituent la définition SQL appliquée.
