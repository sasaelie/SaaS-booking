# Livraison — Liberté / Studio Pro

Implémentation en branche de travail, 11 novembre 2026. Aucun paiement réel, aucune fusion
ni migration de la base hébergée n'ont été effectués pendant le développement.

## Fonctionnement livré dans le code

- Deux offres par espace : Liberté par défaut et Pro mensuel 29 € / annuel 260 €.
- Prix facial participant conservé ; commission Liberté de 3,5 % + 0,45 €, sans plafond.
- Calcul en centimes, arrondi au plus proche avec demi-centime arrondi vers le haut.
- Assiette : montant effectivement payé après avoir ; aucun frais sur une réservation à zéro.
- Les encaissements positifs pris en charge par le calcul respectent le minimum de 50 centimes.
- Instantanés de formule, règle, commission et circuit de paiement dans la réservation.
- Liberté : deux activités ouvertes ; la publication concurrente est sérialisée par organisation.
- Une activité terminée ne monopolise pas une place pour une nouvelle publication.
- Pro expiré : choix manuel conservé, sinon sélection stable des prochaines séances.
- Anciennes réservations et échéances conservées ; les virements engagés restent validables.
- Les avoirs couvrant intégralement une réservation restent utilisables sans passerelle prête.
- Pro : contrôle serveur des virements nouveaux, export, QR affiche, widget et reports en ligne.
- Signature plateforme en Liberté ; retrait en Pro, y compris sur la page de réservation.
- QR vectoriel PDF pour l'impression ; téléchargement PNG conservé pour compatibilité.
- Compteur glissant : frais Stripe réels rapprochés et montants en attente séparés.
- Export CSV complet des écritures enregistrées, sous instantané SQL cohérent.
- Finances administrateur : abonnements, commissions, coûts et volume tiers distingués.
- Coûts exceptionnels réels : saisie réservée au super-administrateur, référence dédupliquée.
- Conservation opérationnelle trente jours après clôture ; archives fiscales distinctes dix ans.
- Simulation de purge disponible, suppression automatique désactivée par défaut.

## Paiements et comptabilité

Liberté utilise des paiements Connect avec destination : pour 3 000 centimes, la plateforme
retient 150 centimes et l'association est créditée de 2 850 centimes. Stripe est financé sur
la part de la plateforme. Le compte connecté reste indiqué comme marchand de règlement.
Pro utilise les paiements directs : aucune commission plateforme et frais Stripe à l'organisateur.
Bancontact est explicitement proposé avec la carte dans Checkout.

Les frais sont lus sur les objets Stripe du compte porteur, sans reconstituer un taux théorique.
Si `balance_transaction` manque, le rapprochement est différé ; aucune valeur zéro n'est inventée.
Paiement, rapprochement, remboursement et frais ont des références et contraintes de déduplication.
Les identifiants de remboursement Stripe sont communs au traitement interne et aux webhooks,
pour ne pas compter deux fois un même mouvement.
Un état de remboursement plus ancien ne peut écraser un rapprochement plus récent.
Le net restant et la commission restituée sont exportés après les remboursements partiels et complets ;
les frais Stripe conservés peuvent laisser un solde Pro négatif, sans le masquer.
Les litiges sont relus dans leur état canonique chez Stripe pour protéger la conservation des dossiers.

Les références de transfert et de versement sont distinctes. Un versement bancaire automatique
est associé après événement Stripe et lecture de ses mouvements ; un versement manuel non
allouable n'est pas présenté comme une preuve de versement de chaque réservation.
Les factures d'abonnement payées et leurs remboursements monétaires sont journalisés séparément
des ventes des associations. La TVA non configurée reste inconnue, pas présumée nulle.

## Données et migration

Migrations additives 015 à 018 : droits, sélection d'activités, instantanés, journal financier,
archives protégées, coûts, tâches de rapprochement et reprise historique.
Les quatorze migrations antérieures restent inchangées et protégées par leurs empreintes.
La reprise marque les ventes anciennes `HISTORICAL`, sans frais bancaires inventés.
Les accès offerts et les abonnements actifs historiques gardent leurs droits jusqu'à échéance.
Les anciens prix Stripe ne sont pas utilisés pour un nouveau Checkout Pro.

Les nouvelles tables financières ont RLS activé et aucun accès public/anon/authenticated accordé.
L'application SQL privée applique ses autorisations et sa portée d'organisation à chaque action.
Les sauvegardes externes ne sont pas effacées par une suppression de ligne PostgreSQL ; leur
conservation et leur restauration suivent le guide d'exploitation.

## Validation et limites

| Contrôle local | Résultat |
| --- | --- |
| `npm run verify` : TypeScript, ESLint et tests unitaires | 86 tests réussis |
| PostgreSQL isolé : droits, concurrence, comptabilité, migration et conservation | 108 tests réussis |
| Build Next.js | Réussi |
| Chromium : organisateur, participant, administration, mobile et ordinateur | 45 parcours réussis |
| Migrations 001–018 rejouées avec le migrateur | Sans duplication ; empreintes historiques inchangées |

Les contrôles SQL couvrent notamment les six familles de refus du cahier des charges.
La limite des deux activités résiste aux créations concurrentes. Le retrait d'un accès Pro offert
recalcule les activités ouvertes, et les virements engagés avant expiration restent validables.
Les remboursements partiels, complets, rejoués et reçus en retard ne doublent aucune écriture.
Les captures ont été relues : prix, actions et compteurs lisibles, sans débordement mobile.

Les tests utilisent des utilisateurs et comptes marchands fictifs. Les tests du SDK Stripe utilisent des transports et objets de test ;
ils ne prouvent pas qu'un compte Stripe distant est configuré ou capable de recevoir les fonds.

La recette Sandbox externe reste à exécuter avec une configuration de test du propriétaire.
Aucune clé Stripe n'est déclarée dans l'environnement observé ; cela ne préjuge pas de Vercel.
Les profils tarifaires particuliers, comptes Connect, versements et coûts contractuels doivent
être rapprochés en Sandbox puis dans une recette d'exploitation avant ouverture réelle.

La TVA, les mentions de facturation, les conditions contractuelles des risques et la politique
de sauvegarde doivent être configurées et validées pour l'entité exploitante réelle.
L'implémentation ne certifie pas à elle seule une conformité juridique ou comptable.

## Documents associés

- [Cahier des charges](CAHIER-CHARGES-LIBERTE-PRO.md).
- [Audit préalable](AUDIT-LIBERTE-PRO.md).
- [Plan et matrice de tests](PLAN-MIGRATION-LIBERTE-PRO.md).
- [Exploitation, configuration et migration](EXPLOITATION-LIBERTE-PRO.md).

## Aperçus de la recette locale

- [Offres et compteur — téléphone](previews/commercial/liberte-mobile.png).
- [Espace Pro — ordinateur](previews/commercial/pro-desktop.png).

Ces captures montrent une organisation fictive ; elles ne représentent pas une migration de Vercel.
