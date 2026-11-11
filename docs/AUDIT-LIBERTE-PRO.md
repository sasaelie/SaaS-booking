# Audit de l'existant — migration Liberté / Pro

Lecture du dépôt le 11 novembre 2026, base `af3fbe247525d41640f412bcb4dcabc37eb557b2`.
Périmètre : code et tests versionnés, sans lecture des données hébergées ni appel Stripe marchand.
L'environnement ne déclare aucun secret Stripe dans sa configuration observée.
Ce constat ne prouve pas l'absence de configuration dans Vercel ou ailleurs.

## Écarts confirmés

| Domaine | Existant observé | Travail nécessaire |
| --- | --- | --- |
| Offre | `src/config/saas.ts` : 1 999 centimes, mensuel | Prix Pro mensuel/annuel, Liberté et version des règles |
| Droits | `src/core/domain/subscription-access.ts` : décision binaire | Droits par capacité, suspension, grâce et instant de validité |
| Inscription | `src/adapters/db/portal/organizations.ts` : accès inactif initial | Liberté par défaut, sans créditer un faux abonnement |
| Publication | `src/adapters/db/portal/activity-management.ts` | Limite atomique de deux activités ouvertes, distincte des brouillons |
| Catalogue | `src/adapters/db/drizzle-public-catalog.repository.ts` | État consultation/réservable cohérent avec la formule |
| Réservation | `src/adapters/db/activity-reader.ts` : accès commercial global | Droit précis, paiement effectif et instantané conservé |
| Carte | `src/adapters/payments/stripe-checkout.ts` : `['card']` | Bancontact explicite et scénario de succès différé |
| Frais | Aucun rapprochement `balance_transaction` trouvé dans `src/` | Port de lecture des frais, journal SQL et reprises |
| Répartition | Paiements directs sur compte connecté dans l'adaptateur actuel | Choisir le flux Connect qui garantit le net annoncé |
| Abonnement | `src/adapters/payments/saas/checkout.ts` : un prix configuré | Deux périodicités, validation canonique, transition historique |
| Virement | Configuration de l'IBAN et Modulo 97 existants | Droit Pro pour les nouveaux dossiers, reprise des anciens |
| Widget | `src/app/embed/[organization]/[activityId]/page.tsx` | Contrôle de droit serveur à l'affichage, pas seulement au partage |
| QR | `src/adapters/share/qr-code.adapter.ts` : PNG de 1 200 pixels | Définir le livrable affiche HD ; PDF non implémenté |
| Finances admin | Console organisations et journaux | Revenus, commissions et fonds tiers séparés, sans faux totaux |
| Conservation | `src/config/constants.ts` : sept ans / non-payés douze mois | Dix ans comptables et cycle opérationnel de trente jours |
| Effacement | `src/adapters/db/drizzle-gdpr.repository.ts` | Contrôle des opérations actives et classification des pièces |

## Risques à traiter avant bascule

### Répartition Connect

Le code actuel crée Checkout dans le contexte du compte marchand (`stripeAccount`).
Ajouter simplement 150 centimes de frais de plateforme à un paiement direct de 3 000 centimes
ne garantit pas 2 850 centimes à l'association : si elle supporte aussi les frais Stripe,
ceux-ci sont déduits en plus. Le flux de collecte, l'identité du vendeur et le payeur des frais
doivent donc être explicitement validés avant implémentation, avec 3 000 / 150 / 70 / 2 850 / 80
comme exemple de rapprochement attendu, et non comme simple résultat de simulateur.

Vérifier séparément Liberté et Pro, puis remboursements partiels et frais non restitués.
Conserver le compte porteur de chaque paiement pour lire le bon événement et les bons frais.
Ne pas activer l'encaissement pour toutes les associations sur le compte de la plateforme
comme raccourci : cela changerait les responsabilités du modèle marchand.

### Frais connus après le paiement

Stripe peut confirmer le paiement avant de fournir la `balance_transaction`.
La réservation est confirmée sans attendre l'export financier ; le rapprochement est repris
en arrière-plan. Aucun frais fictif de zéro ni tarif théorique ne remplit la colonne réelle.
Un rapprochement manquant doit produire un état visible, une reprise et une alerte bornée.

### Conservation et droits du participant

La tâche actuelle sélectionne notamment des non-payés par date de création et statut.
Cette ancienneté ne prouve ni la fin d'un événement, ni la clôture d'un litige ou d'un avoir.
La nouvelle purge doit vérifier ces conditions au moment de l'écriture et de la suppression du fichier.
Préserver les mentions nécessaires des pièces fiscales dans un stockage restreint distinct.
Une chaîne d'identifiants ré-identifiable ne devient pas anonyme par son seul changement de nom.

### Limites et périodes

La limite de deux publications doit être sérialisée par organisation, pas par seule activité.
Une sélection des deux activités sur chaque requête peut fluctuer : rendre la décision stable,
persistée/auditable, avec départage explicite et possibilité de choix organisateur.
Le paiement d'un dossier déjà engagé doit reposer sur ses propres échéance et règle figées.
Les réservations historiques sans nouvelle ventilation restent marquées historiques ; aucun
revenu fictif ne doit être inventé pour obtenir un compteur initial complet.

## Protections existantes à conserver

- Réservations : verrous, idempotence et contraintes par organisation.
- Instantanés : prix, compte marchand, IBAN et conditions conservés sur le dossier.
- Paiements : contrôle des montants et événements, reprise et protection contre les collisions.
- Webhooks abonnement : signature, déduplication et état canonique Stripe.
- Fichiers privés : contrôle de portée et liens temporaires.
- Annulation : jeton signé et conditions de report rattachées à la réservation.
- File transactionnelle : effets externes séparés des transactions SQL.

Les tests de paiement, de portée et de confidentialité existants sont des points de départ.
Ils ne démontrent pas encore le bon fonctionnement du nouveau modèle ni un paiement Sandbox réel.

## Vérifications de cette étape

`npm run verify` exécuté le 11 novembre 2026 : TypeScript strict et ESLint réussis,
19 fichiers de tests unitaires, 77 tests réussis. `git diff --check` sans erreur.
Il s'agit de la base existante, pas d'une validation de la matrice Liberté / Pro.
Ni tests SQL, ni navigateur, ni Stripe Sandbox ne sont annoncés comme exécutés pour cette cible.

## Livrables de cette étape

1. [Cahier des charges consolidé](CAHIER-CHARGES-LIBERTE-PRO.md).
2. [Plan de migration et matrice de recette](PLAN-MIGRATION-LIBERTE-PRO.md).
3. Cet audit des écarts du dépôt, distinct d'un rapport de conformité ou de tests de la cible.

Aucun fichier applicatif, schéma, tarif Stripe, compte hébergé ou donnée participant n'est modifié
par cette étape documentaire. Aucune fusion, publication ou activation de paiement n'est effectuée.
