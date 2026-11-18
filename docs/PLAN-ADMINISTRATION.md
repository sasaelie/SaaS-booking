# Administration cohérente

Périmètre validé : listes compactes d'organisations et d'opérations avec pagination serveur, recherche, filtres et tri ; conservation du verre lumineux, des boutons de 8 px, du poussoir et des diodes existantes. Les compteurs sont regroupés dans une surface commune.

Navigation : Organisations, Finances, Utilisation, Opérations en attente, Historique. Finances accueille le journal, les rapprochements, les documents, les ajustements et le paramétrage de facturation. Les coûts exceptionnels quittent la liste des organisations.

Le propriétaire demande des statistiques globales uniquement, portant sur les personnes qui utilisent l'outil. Les données métier existantes permettent de mesurer comptes organisateurs, organisations actives, activités publiées et réservations. Ne pas présenter ces mesures comme un comptage de visiteurs anonymes ou d'installations téléphoniques.

Facturation validée : factures de la plateforme aux organisateurs, avec identité de l'émetteur et règles de TVA configurables. Les ventes des organisateurs aux participants ne doivent pas être facturées par la plateforme. Le propriétaire a confirmé : factures Stripe originales pour les abonnements, factures internes pour les frais/commissions, afin d'éviter les doublons. L'émission ne doit jamais inventer les coordonnées de l'entreprise ou une règle de TVA.

Vérification attendue : contrôles de code, tests des autorisations serveur et des données, volumes supérieurs à une page, conservation des filtres, export des montants et références, factures immuables/idempotentes, navigation clavier/tactile et captures aux largeurs 320/390/768/1440 px. Aucune opération financière réelle n'est utilisée pour les tests.

## Facturation belge et transmission

Entreprise établie en Belgique ; aucun logiciel comptable ni prestataire Peppol choisi à ce stade. La transmission électronique n’est pas implémentée. Les documents internes sont numérotés et archivés avec leur PDF, leur émetteur, leur destinataire et leur ventilation de TVA. Ils restent « À transmettre ». Pour les opérations belges concernées, un PDF ne remplace pas la facture électronique structurée. Ne pas présenter ce module comme une connexion Peppol déjà opérationnelle.

Référence officielle : https://efacture.belgium.be/fr/article/les-factures-electroniques-structurees-entre-entreprises-sont-obligatoires-depuis-2026

Les factures originales Stripe sont consultables lorsque les paiements sont activés et le document du bon client est disponible. Aucune nouvelle facture interne d’abonnement n’est créée. Les commissions sont facturées depuis les mouvements rapprochés ; les avoirs partent des remboursements de commission réellement enregistrés. Les émissions répétées renvoient le même document, les avoirs cumulés ne peuvent dépasser la facture et les documents émis sont immuables. Émettre un document ne crée aucun nouvel encaissement.

Le journal sépare les revenus de plateforme, les fonds des organisateurs et les reports non monétaires. L’export de gestion CSV/Excel fournit les montants signés, références et ventilations des documents internes disponibles ; il ne constitue pas un plan comptable ni une déclaration TVA. Le rapprochement affiche explicitement les frais non renseignés.

## Mise en route

Dans Administration → Finances → Facturation, renseigner les coordonnées réelles, la TVA applicable et le préfixe de numérotation. Pour préparer une facture, ouvrir Factures et avoirs → Préparer une facture, puis choisir la commission dans le journal. Les montants sont ceux déjà prélevés ; vérifier le destinataire et confirmer l’émission. L’avoir utilise automatiquement l’identité et la TVA de la facture d’origine.

Les statistiques Utilisation restent globales et excluent les simulations. La progression compte les organisations créées sur la période puis leurs premières activités/réservations avant sa fin. Une réservation autrefois confirmée reste un jalon d’adoption même si elle est annulée ensuite. Les compteurs et le graphique de confirmations affichent les réservations actuellement confirmées ; l’état des publications est l’état actuel.

## Vérification de livraison

`npm run verify` : TypeScript, ESLint et 168 tests unitaires réussis. 149 tests d’intégration réussis sur la base locale. Compilation Next.js réussie, police du PDF présente dans le manifeste de la fonction de facturation. Les 13 scénarios navigateur passent sur la version compilée, dont listes de 126 organisations et 120 opérations, téléchargements PDF/CSV/Excel, autorisations, idempotence, plafonnement des avoirs, immutabilité, états des boutons à la souris et au toucher. Captures et absence de débordement contrôlées aux largeurs 320/390/768/1440 px.

Migration 023 appliquée et vérifiée sur le schéma privé `booking` de recette : RLS active, aucune lecture directe accordée aux rôles `anon` ou `authenticated`, fonction d’immutabilité protégée, empreinte enregistrée identique au fichier. Aucun émetteur fictif ni document d’essai créé dans la base distante.
