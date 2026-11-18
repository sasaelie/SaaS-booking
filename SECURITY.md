# Sécurité et signalement

Ne publiez jamais un code participant, une clé de service, une session, une donnée client ou une charge d’exploitation sensible dans une issue publique.

Pour un signalement, utilisez les coordonnées effectivement publiées sur la page Contact de la plateforme ou le canal privé GitHub du dépôt lorsqu’il a été activé. Aucun e-mail fictif ne sert de contact de sécurité. Le signalement privé GitHub était désactivé lors du relevé du 18 novembre 2026 ; il reste à activer par un compte disposant des droits d’administration du dépôt.

Le rapport `docs/AUDIT-SECURITE-GLOBAL-2026-11-18.md` décrit la portée des contrôles, leurs preuves et leurs limites. Les essais offensifs restent sur une base locale isolée ; les contrôles de la recette sont non destructifs. N’utilisez pas les données ni les comptes réels pour exécuter les suites d’attaque.

`npm run verify`, `npm run test:integration`, `npm run test:e2e`, `npm run check:security` et, après compilation, `npm run check:runtime-traces` forment les contrôles de livraison. Un résultat d’audit du registre indisponible n’est pas assimilé à une absence de vulnérabilités.

Les éventuelles revues temporaires de dépendances sont individuelles et expirent ; elles ne signifient pas que le paquet a été corrigé. Un correctif fournisseur doit être repris dès sa disponibilité, avec les régressions et la vérification des artefacts de production. Les dépendances ne sont pas fusionnées automatiquement.

Les migrations publiées ne doivent pas être réécrites. Toute nouvelle migration doit être testée sur une base isolée, conserver la séparation des organisations et garder les tables privées sans droit direct pour les rôles API publics.

La surveillance de l’application, l’ordonnanceur, les sauvegardes restaurables, les comptes de service à privilèges minimaux et la MFA administrateur nécessitent leur propre vérification opérationnelle ; un contrôle de code ne les active pas implicitement.
