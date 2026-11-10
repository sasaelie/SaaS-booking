# Audit des parcours, actions et présentation

Plan suivi : [PLAN-AUDIT-PARCOURS.md](PLAN-AUDIT-PARCOURS.md).
Branche : `fix/journey-design-audit`, issue de `main` après la PR 10.

## Problèmes reproduits et corrections

| Observation avant correction | Résultat obtenu |
|---|---|
| Lien invalide dans « Réseaux et contact » replié : le clic sur Enregistrer ne révèle pas le problème. | Les sections contenant les champs invalides s’ouvrent ; le premier champ reçoit le focus. Le format HTTPS est expliqué et contrôlé côté navigateur comme côté serveur. Après correction du lien, l’enregistrement réussit. |
| Annulation d’une réservation avec complément impayé : un ancien code est libéré mais « Accorder un code de report » reste proposé. | Le serveur calcule l’éligibilité avec la même règle métier que l’attribution transactionnelle. Cette action n’apparaît plus ; un code déjà attribué reste consultable. Les réservations payées éligibles conservent leur action. |
| Depuis un lien direct, le descriptif n’est pas disponible et les longues consignes arrivent avant le titre et le prix. | Le descriptif est transmis explicitement à la page publique. Le titre et le prix précèdent les informations ; deux sections dépliables donnent accès au descriptif et aux consignes. L’adresse publique ou le message d’adresse différée reste visible. |
| Liens de gestion d’activité hauts de 22,5 px ; cartes statiques se soulevant comme des liens au survol. | Actions regroupées, visuellement délimitées, cibles tactiles de 44 px minimum. Le survol animé est réservé aux cartes qui sont réellement des liens. |
| Confirmation et refus du virement séparés de 0 px. | Espacement de 16 px entre les formulaires, contrôlé dans le parcours réel d’envoi et de validation d’un justificatif. |

Aucun changement de prix, de droits d’accès ou de règles de remboursement. Aucune migration.
Le calcul d’éligibilité ne remplace jamais les contrôles transactionnels au moment du clic.
Les métadonnées internes utilisées pour ce calcul ne sont pas renvoyées dans la liste de gestion.

## Recette fonctionnelle

Les parcours utilisent des comptes et organisations fictifs dans PostgreSQL local ; le navigateur
exécute l’application compilée en mode staging. Les scénarios de mutation ne touchent aucun client.

- **Organisateur :** connexion, création d’espace et publication d’activité, états vides,
  réglages et réseaux, aperçu et personnalisation séparée des interfaces, partage et QR,
  filtres, fiche d’inscrit, consultation du justificatif privé, validation du virement,
  attribution d’un avoir, consultation après rechargement et utilisation avec un reliquat.
- **Participant :** arrivée par lien direct, lecture des informations et conditions, calendrier,
  navigation clavier et modification de séance avec conservation des coordonnées, inscription,
  lien de gestion, dépôt du justificatif, annulation et récupération après erreur réseau.
- **Dernière place :** un autre participant prend réellement la place après l’ouverture du
  formulaire. Le serveur refuse la réservation devenue impossible ; le choix d’une autre séance
  conserve les coordonnées et ne crée qu’une réservation. Ce comportement existait et a été vérifié.
- **Droits et confidentialité :** accès administration masqué et refusé aux organisateurs,
  isolation entre organisations, mutations d’origine étrangère refusées, pièces privées et
  adresse différée absente du HTML public, tâches planifiées non accessibles sans authentification.
- **Présentation :** revue de captures mobiles et ordinateur, écrans de gestion à 320/390/1440 px,
  parcours public et informations à 320/390/1280 px, contrôles de débordement, retours depuis
  l’aperçu, cohérence des liens et des boutons. Il ne s’agit pas d’une certification d’accessibilité.

## Preuves visuelles

| Écran | Avant | Après |
|---|---|---|
| Gestion des activités | [Capture](audit-parcours/organisateur-avant.png) | [Capture](audit-parcours/organisateur-apres.png) |
| Page participant et longues consignes | [Capture](audit-parcours/participant-avant.png) | [Capture](audit-parcours/participant-apres.png) |

Les autres captures et traces de la suite sont dans `test-results/`, exclu de Git.

## Résultats automatisés

Résultat final local : **172 tests réussis** : 63 unitaires, 75 PostgreSQL et 34 parcours Chromium.
TypeScript strict, ESLint et compilation Next.js staging réussis. Aucun test ignoré ou instable.
Les quatre nouvelles reproductions échouaient avant correction ; le contrôle d’espacement
échouait également avec un écart mesuré de zéro pixel.

Les rapports détaillés se trouvent dans `qa-results/` ; `npm run test:summary` refuse une suite
manquante, un échec, un test ignoré ou instable. La vérification GitHub est exécutée séparément.

## Suite après ce rapport

1. Relire la proposition de correction, puis fusionner et déployer lorsqu’ils seront demandés.
2. Rejouer une recette courte sur Vercel après déploiement : connexion, aperçu, inscription,
   justificatif et consultation de l’inscrit avec des données de test identifiées.
3. Tester séparément les véritables prestataires : Stripe/Mollie et webhooks, domaine et livraison
   Resend, ordonnanceur hébergé des rappels. Ces dépendances ne sont pas certifiées par cet audit.

Les paiements sont désactivés dans l’environnement testé. Les traitements de messages sont testés
en base et avec doublures de transport ; aucun envoi réel ni encaissement n’a été déclenché.
Aucun déploiement ou changement de configuration hébergée n’est inclus dans cette branche.
