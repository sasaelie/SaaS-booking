# Cahier des charges — Liberté et Studio Pro

Décisions du propriétaire consolidées le 11 novembre 2026, dont sa réponse « 30 jours ».
Ce document fixe la cible. L’état de réalisation et les vérifications sont détaillés dans LIVRAISON-LIBERTE-PRO.md.
Le Pass Événement et les anciennes propositions à commission plafonnée sont abandonnés.

## Offre par espace organisateur

| Règle | Liberté | Studio Pro |
| --- | --- | --- |
| Abonnement | 0 € | 29 €/mois ou 260 €/an |
| Commission globale | 3,5 % + 0,45 €, sans plafond | Commission de plateforme nulle |
| Paiement participant | Carte et Bancontact via Stripe | Stripe et virement direct Modulo 97 |
| Activités ouvertes aux nouvelles inscriptions | 2 | Illimitées |
| Séances par activité | Illimitées | Illimitées |
| Signature plateforme | Obligatoire | Retirable |
| Widget, QR affiche HD, export comptable complet | Réservés à Pro | Inclus |
| Codes de report vers des cours en ligne | Réservés à Pro | Inclus |

Liberté est la formule de départ. L'inscription au SaaS ne requiert pas de carte.
L'encaissement nécessite toutefois un compte marchand Stripe vérifié et habilité.
L'annuel est une périodicité de Pro, pas une troisième offre.
La suspension administrative reste prioritaire sur toute formule ou gratuité offerte.
La gestion des inscriptions existantes est distincte des droits de nouvelle vente.

## Prix public et paiements

Le participant paie le prix facial annoncé, sans frais ajoutés selon son moyen de paiement.
Exemple de référence : 3 000 centimes payés, 150 centimes de commission Liberté,
2 850 centimes attribués à l'association. Stripe est financé dans ces 150 centimes.
En Pro, les frais techniques réels restent dus ; ils sont expliqués à l'organisateur.
Un virement direct ne supporte pas de commission plateforme ; les frais du contrat bancaire
de l'association ne sont pas garantis nuls par le SaaS.

Les calculs utilisent des centimes entiers et un arrondi explicite, stable et versionné.
La réservation représente une seule place, conformément au modèle existant.
Les devis, reçus et commandes gardent le même prix et la même version tarifaire.
Une commission ne doit jamais être comptée une seconde fois lors d'un webhook rejoué.
Les réservations gratuites ou entièrement réglées par avoir n'entraînent pas un débit Stripe.
Règle appliquée pour les tests : assiette du paiement après avoir, arrondi au centime le plus proche
(demi-centime vers le haut), encaissement positif minimal de 50 centimes et zéro sans frais.

La commission est calibrée pour les paiements courants, sans garantie universelle de marge.
Les autres cartes, conversions, coûts Connect et litiges sont suivis séparément dans la
rentabilité. Aucun coût exceptionnel ne peut être ajouté silencieusement au participant.
La répartition contractuelle de ces risques doit précéder leur éventuelle facturation.
La TVA des commissions et les prix HT/TTC des abonnements restent à préciser avant facturation.

## Compteur d'économie nette

Fenêtre glissante : 30 jours, transactions attribuées à l'espace concerné uniquement.
Afficher séparément la commission globale Liberté et les frais Stripe réellement rapprochés.
La différence représente la part évitable avec Pro, avant autres charges et taxes.
Exemple : 150 centimes moins 70 centimes Stripe = 80 centimes évitables.
Il faut alors 37 réservations comparables pour dépasser 2 900 centimes d'abonnement mensuel.
Une transaction sans frais bancaires connus reste « en attente de rapprochement ».
Une valeur inconnue n'est jamais transformée en zéro ni remplacée par une estimation.
Le rapprochement Stripe n'est pas la preuve d'un versement déjà reçu sur le compte bancaire.
Les remboursements et ajustements corrigent le compteur et restent traçables.
La comparaison historique ne promet pas une économie identique sur les ventes futures.
La rentabilité plateforme inclut séparément Connect, litiges, TVA applicable et exploitation.
Les abonnements, le volume vendu pour les associations et la marge ne sont pas confondus.

## Expiration et continuité

Une résiliation conserve Pro jusqu'à son échéance payée ; elle n'efface aucune activité.
Au retour en Liberté, les nouveaux dossiers suivent Liberté ; les dossiers engagés conservent
leur instantané tarifaire et leur délai initial : virement 48 h, session carte 30 min.
L'échéance ne repart pas de zéro lors d'un changement de formule ou d'une nouvelle tentative.
Un paiement tardif reste soumis aux protections de place et de remboursement existantes.
Les virements engagés gardent leurs instructions ; leur validation reste accessible.
L'historique, les preuves conservées, les remboursements et codes restent gérables.
Les liens et obligations déjà accordés au participant ne sont pas invalidés par une rétrogradation.

L'organisateur choisit les deux activités restant réservables.
Sans choix, prendre les deux dont la prochaine séance réservable est la plus proche.
Prévoir un départage stable et une règle pour les activités sans séance à venir.
Les autres activités deviennent consultables sans création de nouvelle réservation.
Vérifier la limite de publication dans la transaction SQL, y compris deux publications concurrentes.
Les nouvelles réservations ne proposent pas de virement en Liberté.
La suspension conserve son comportement propre ; elle n'est pas transformée en Liberté.

## Journal financier

Conserver par transaction et organisation : prix public, commission globale et TVA éventuelle,
frais Stripe réels, net dû à l'association, montants effectivement transférés puis versés,
devise, formule/périodicité/version tarifaire figées, dates, références et état du rapprochement.
Rattacher réservation, PaymentIntent, Charge, balance_transaction, transfert et versement,
ou la communication structurée et la référence du paiement bancaire validé.
Identifier explicitement le compte Stripe qui porte chaque objet.
Un net dû ou un transfert Stripe n'est pas présenté comme un versement bancaire effectué.

Créer des écritures de remboursement et d'ajustement ; ne pas écraser l'historique initial.
Un code de report est un avoir : son émission, son utilisation et son reliquat sont suivis
séparément d'un remboursement monétaire. Ne pas compter son utilisation comme un nouvel encaissement.
Les événements externes ont des contraintes d'unicité et des références composites par organisation.
Un rapprochement répété ne peut dupliquer ni frais, ni écritures, ni montant d'économie.
Un export encore incomplet indique ses écritures en attente ; il ne prétend pas être définitif.

## Conservation différenciée

Pièces comptables et fiscales concernées : dix ans, avec un point de départ adapté à la pièce.
Les mentions légalement nécessaires d'une facture restent conservées et leur accès est restreint.
Un identifiant interne seul ne remplace pas nécessairement une facture complète.
Un identifiant encore relié à une personne est pseudonymisé, pas forcément anonymisé.

Coordonnées opérationnelles et justificatifs non comptables : suppression ou anonymisation
30 jours après la fin des opérations liées au dossier, selon le choix explicite du propriétaire.
Déclenchement après événement terminé et clôture des paiements, remboursements, litiges et
codes liés, utilisés, soldés ou expirés. Un dossier encore actif n'est pas purgé sur sa seule ancienneté.
Une obligation légale ou un litige justifie une conservation ciblée, documentée et réexaminable.
La nature comptable d'un justificatif doit être déterminée avant sa suppression.

La purge couvre tables, fichiers privés, charges utiles des tâches, copies et journaux concernés.
Définir aussi le vieillissement des sauvegardes et la réapplication des suppressions à la restauration.
La procédure possède une simulation, des lots bornés, des reprises idempotentes et une trace
minimale non sensible. Aucune nouvelle purge destructive n'est activée par ce document.

## Isolation et droits

Séparer les accès super-administrateur, organisateur, réservation publique et annulation signée.
Les espaces publics ne deviennent pas des rôles authentifiés donnant accès aux dossiers privés.
Toutes les ressources métier portent l'organisation et les liens SQL conservent cette appartenance.
Les droits Pro sont vérifiés sur le serveur à chaque action et à chaque utilisation du widget.
Masquer un bouton, protéger le téléchargement du code d'intégration ou cacher une URL ne suffit pas.
Les codes de report et liens d'annulation gardent leur portée, leurs conditions et leur expiration.
L'administration distingue revenus plateforme et fonds des associations.

## Migration des comptes de test

Les abonnements actuels à 19,99 € sont des fixtures selon le propriétaire ; conserver leurs
références et leurs réservations comme cas de migration, sans simuler une vraie facturation.
Un accès offert ou une grâce deviennent des droits Pro explicites, datés et auditables si temporaires.
Tout ancien identifiant Stripe reste identifié comme historique, jamais réutilisé pour facturer 29 €.
Tester les comptes inactifs, actifs, résiliés, offerts et suspendus avant bascule.
Ne pas migrer les ventes historiques comme si des commissions avaient été réellement encaissées.

## Sources et portée

- [Stripe : frais réels et disponibilité asynchrone](https://docs.stripe.com/expand/use-cases).
- [Stripe Connect : responsabilités et tarification](https://stripe.com/fr-be/connect/pricing).
- [SPF Finances : conservation comptable](https://finances.belgium.be/fr/entreprises/impot_des_societes/comptabilite).
- [CEPD : droits et exceptions à l'effacement](https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_fr).

Ces décisions ne certifient pas à elles seules la conformité juridique, fiscale ou contractuelle.
Le développement, les tests Sandbox et la publication restent des étapes distinctes.
