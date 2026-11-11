# Accueil, connexion et retour du navigateur

## Cause

Revenir en arrière ne fermait pas la session de l’organisateur. L’accueil affichait toutefois
les actions d’un visiteur à tout le monde. Les pages de connexion/inscription ne redirigeaient
les personnes déjà connectées que lorsqu’une préférence de formule était présente.
Le clic sur une offre retrouvait donc la session existante, alors que l’accueil suggérait
encore de se connecter. La carte ne créait pas une nouvelle connexion.

## Correction

- L’accueil est rendu pour la requête courante : une session vérifiée affiche le nom,
  « Ouvrir mes espaces » et « Se déconnecter ». Un visiteur garde les actions d’inscription
  et de connexion. Les cartes de formule restent accessibles dans les deux états.
- La présence d’un cookie sert seulement à éviter une lecture inutile pour un visiteur.
  Son existence ne prouve jamais la connexion : la session réelle et l’adresse e-mail
  confirmée restent vérifiées côté serveur avant de personnaliser la page.
- Les pages ordinaires de connexion et d’inscription redirigent aussi vers l’espace quand
  la session est valide, avec conservation d’une éventuelle préférence de formule.
- L’accueil, les entrées de compte et les pages privées portent une directive de cache
  privé sans stockage. Les retours dans l’historique et les restaurations de page relisent
  l’état serveur ; le retour de focus sur l’accueil ou une entrée de compte le réactualise.
- La connexion et la déconnexion remplacent l’entrée courante de l’historique. Les anciens
  documents privés éventuellement rejoints par Retour restent soumis au contrôle serveur.
- Les formulaires publics des participants sont exclus de cette synchronisation de session.
  La durée de connexion, les rôles, les droits Pro et les règles de paiement sont conservés.

## Vérifications locales

TypeScript strict, ESLint, 91 tests unitaires et construction Next.js réussis.
Quatre nouveaux scénarios Chromium ont réussi avec des comptes et une base fictifs :

1. Retour réel du navigateur après connexion : accueil personnalisé, absence des actions
   d’inscription/connexion et redirection des entrées ordinaires de compte.
2. Déconnexion depuis l’accueil, puis retour réel vers une page privée : session invalidée
   et formulaire de connexion affiché.
3. Expiration réelle dans la base, puis événement de restauration de page simulé : accueil
   visiteur et refus d’accès à l’espace. Ce test simule l’événement de restauration ; il ne
   certifie pas le comportement de tous les caches de tous les navigateurs.
4. Deux contextes de navigateur séparés : absence de partage du contenu personnalisé,
   vérification de `no-store`, puis refus d’un cookie de session falsifié.

Les vérifications serveur existantes restent obligatoires pour chaque action privée.
Aucune migration, modification des dossiers hébergés, ouverture des paiements réels ou
suppression globale des sessions n’est effectuée par cette correction.

## Captures

Captures réelles sur téléphone avec des données fictives locales :

- [Accueil visiteur](session-accueil/visiteur-mobile.png)
- [Accueil connecté](session-accueil/connecte-mobile.png)
