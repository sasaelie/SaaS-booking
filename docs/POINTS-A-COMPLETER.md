# Avant mise en service réelle

Les défauts de compilation, les injections fictives et les principaux défauts métier de l’audit initial ont fait l’objet des corrections et des régressions décrites dans `VERIFICATION.md`.

Restent à réaliser avec les comptes et paramètres réels de l’organisation :

1. Provisionner PostgreSQL et un bucket privé dans la région UE voulue ; appliquer les migrations sur une base neuve et préparer une reprise spécifique si une ancienne base existe.
2. Configurer les clés Stripe de test, les webhooks et, le cas échéant, les comptes Stripe Connect ; vérifier un paiement, une expiration et un remboursement avec ces comptes.
3. Valider le domaine Resend, configurer Better Auth pour les comptes web et l’ordonnanceur de tâches (OIDC est optionnel pour l’API externe) ; vérifier l’envoi réel et les droits d’accès.
4. Configurer sauvegardes, restauration, supervision et politiques de purge du stockage (versions et sauvegardes incluses).
5. Faire valider les CGV et les durées de conservation par rapport au statut réel de l’organisation et aux règles applicables. Aucune conformité juridique n’est certifiée par le code.

Ces points dépendent des services réels ; aucun faux adaptateur ou secret de production n’est intégré pour les simuler.
