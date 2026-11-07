# Architecture et jalons

## Sens des dépendances attendu

```text
Interface Next.js → Cas d’usage → Domaine et contrats
Adaptateurs → Contrats et domaine
Configuration et utilitaires → Fonctions partagées
```

Les dépendances concrètes doivent être assemblées côté serveur dans un point de composition. Les interfaces ne doivent pas initialiser Stripe ou Drizzle directement. Les exemples transmis ne respectent pas encore entièrement cette séparation.

## Répartition des sources

| Jalon | Sources principales |
| --- | --- |
| 0 | constantes, Result, logger, Modulo 97, schéma SQL, CSS |
| 1 | types de séance, disponibilité, fuseaux, calendrier, port et adaptateur atomique |
| 2 | génération des CGV, validation, ports activité/notification, création de réservation |
| 3 | port et adaptateur de paiement, traitement webhook |
| 4 | moteur, port et cycle de vie des codes de report |
| 5 | validation binaire, ports et parcours virement/fermeture |
| 6 | jetons HMAC, rétention et widget React |

Chaque jalon dispose de son fichier Vitest reçu ; le jalon 1 comprend également un test de concurrence simulée. La description initiale annonçait parfois davantage de scénarios que les tests effectivement fournis.
