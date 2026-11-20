# Protection de l’administration : biométrie, application ou e-mail

Le compte existant est conservé. Le parcours fonctionne depuis un seul téléphone : connexion habituelle, rubrique **Sécurité de mon compte**, mot de passe actuel, puis confirmation du système sur l’appareil. Il n’y a aucun QR code applicatif à scanner.

## Utilisation

1. Ouvrir `/compte/securite` depuis le menu organisateur avec un compte administrateur de plateforme.
2. Donner un nom à l’appareil et confirmer son mot de passe.
3. Choisir **Continuer sur cet appareil**. Le navigateur ouvre son interface de création de clé. Face ID, empreinte ou code de verrouillage dépend du téléphone et de son gestionnaire de clés.
4. Enregistrer ou copier les dix codes de secours. Les conserver dans un endroit accessible même après perte du téléphone ; le fichier enregistré uniquement sur le téléphone perdu ne suffit pas.
5. Recopier un des codes pour confirmer leur conservation et activer explicitement la protection. Cette confirmation initiale ne consomme pas le code.

Avant la dernière étape, la protection reste en préparation. Annuler une fenêtre ou une préparation ne ferme pas le compte. Après activation, chaque nouvelle session doit vérifier une méthode configurée pour lire ou modifier les données de l’administration. Les espaces organisateur ordinaires et les réservations des participants conservent leur fonctionnement.

## Application d’authentification et e-mail sur le même téléphone

Les trois onglets restent visibles. L’absence de WebAuthn, notamment dans une configuration de Mi Browser qui ne propose pas cette API, ouvre par défaut **Application**. Elle ne bloque pas les codes. Une configuration du site ne peut pas ajouter une API biométrique absente du navigateur ; cette méthode reste disponible dans les navigateurs compatibles.

- **Application** : confirmer le mot de passe actuel, recopier la clé de configuration dans Google Authenticator, Microsoft Authenticator ou 2FAS sur le même téléphone (saisie manuelle, compte affiché, type temporel, six chiffres, trente secondes), puis confirmer un code généré par l’application. Aucun QR code n’est nécessaire.
- **E-mail** : confirmer le mot de passe actuel, demander un code à l’adresse **déjà vérifiée du compte**, puis saisir les six chiffres reçus. Le serveur ignore tout destinataire proposé par le navigateur. Le code expire après cinq minutes, ne fonctionne qu’une fois et est lié à cette session. Un autre onglet dans la même session peut le vérifier ; une autre connexion ne peut pas reprendre ce défi.
- Quelle que soit la première méthode choisie, conserver les dix codes de secours puis confirmer l’activation. Préparer une méthode ne suffit pas à imposer la protection.
- Lors d’une connexion ultérieure par mot de passe, choisir une méthode **déjà configurée**. Si le navigateur ne propose pas la biométrie et qu’aucun code n’a été configuré auparavant, utiliser un code de secours avant d’ajouter l’application ou l’e-mail. Un mot de passe seul ne permet pas d’ajouter une méthode sur un compte déjà protégé.
- L’e-mail est une option de compatibilité, moins résistante au phishing qu’une clé d’accès. Une boîte mail compromise peut aussi affecter la récupération du mot de passe. Préférer la clé d’accès ou une application séparée lorsque c’est possible, et protéger également la boîte mail.

L’envoi utilise le service Resend et `MAIL_FROM` existants. Le message indique l’acceptation de la demande, jamais une livraison garantie. Si le service n’est pas configuré ou refuse la demande, aucune méthode n’est activée. Il n’y a pas d’envoi automatique pendant la migration : chaque administrateur déclenche son propre essai.

## Vérification et récupération

- Une vérification réussie autorise l’administration pendant huit heures au maximum dans cette session authentifiée. Une nouvelle session ne récupère pas cette autorisation.
- Ajouter ou retirer une méthode, renouveler les codes ou désactiver la protection exige une vérification de moins de cinq minutes et le mot de passe actuel.
- Un code de secours s’utilise après la connexion habituelle et fonctionne une seule fois, y compris en cas de demandes simultanées.
- La dernière méthode confirmée ne peut pas être retirée pendant que la protection est active. Ajouter et confirmer une autre méthode avant de la retirer, ou désactiver explicitement la protection.
- Renouveler les codes invalide les anciens codes et les vérifications des autres sessions. Retirer un appareil invalide aussi les vérifications des autres sessions.
- La déconnexion et la suppression d’une session invalident sa vérification par les clés étrangères de la base. Les sessions révoquées ne restent pas autorisées par un cookie mis en cache.
- En cas de perte de tous les appareils et de tous les codes, aucune route publique ne contourne cette protection. Il faut une procédure administrative hors application avec vérification de l’identité et des droits avant toute intervention.

## Adresses et appareils

La clé est liée au nom de domaine exact, issu de `NEXT_PUBLIC_APP_URL`. Utiliser l’adresse canonique de recette, pas une URL de déploiement différente. Le serveur vérifie exactement l’origine et le RP ID configurés ; aucun joker Vercel n’est accepté pour partager les clés.

Un changement de domaine, notamment le passage de la recette à la production, nécessite une clé pour la nouvelle adresse. Se connecter avec un code de secours, ajouter et vérifier le nouvel appareil sur cette adresse, puis retirer l’ancienne clé si nécessaire. Conserver l’ancien accès et les codes jusqu’à validation de cette transition.

Le site ne reçoit ni visage, ni empreinte, ni code de verrouillage du téléphone. Le téléphone ou son gestionnaire conserve la clé privée ; le serveur stocke une clé publique. La synchronisation éventuelle dépend du gestionnaire de clés de l’utilisateur. La compatibilité effective et l’interface native doivent être éprouvées sur le téléphone réel ; l’émulation Chromium ne certifie pas Face ID ou Samsung Internet sur un matériel physique.

## Implémentation et sécurité

`@simplewebauthn/server` 14.1.0 et `@simplewebauthn/browser` 14.0.0 effectuent les cérémonies WebAuthn. Les réponses ne sont pas acceptées sur la foi d’un booléen client. Les inscriptions demandent un authentificateur de plateforme, une clé résidente et une vérification de l’utilisateur obligatoire ; le serveur exige présence et vérification. Les assertions exigent aussi la vérification et une signature valide, avec contrôle du compteur lorsqu’il est disponible.

La migration 026 ajoute cinq tables privées : état, clés publiques, défis, sessions vérifiées et condensats de codes de secours. Elles ont la RLS activée et aucun droit PUBLIC, anon ou authenticated. Les FK lient chaque défi et chaque vérification au bon utilisateur **et** à sa session existante. Aucune donnée biométrique ou clé privée n’est stockée.

Les défis sont aléatoires, limités à cinq minutes, liés à l’utilisateur, la session et la cérémonie, et consommés après succès. Les opérations d’un même administrateur sont sérialisées en transaction. Les codes de secours contiennent chacun 128 bits aléatoires ; seuls leurs condensats SHA-256 liés à l’utilisateur sont conservés. Ils sont retournés une seule fois lors de leur génération.

Le contrôle est appliqué dans `requireOperator`, commun aux dépôts de données administratives : masquer un bouton ne constitue pas la protection. L’écran de sécurité possède un chemin indépendant permettant de vérifier ou récupérer sa propre session. Les entrées sont strictes, les corps bornés, l’origine contrôlée et les tentatives limitées avant le calcul des preuves de mot de passe. Les journaux et l’historique n’enregistrent pas les codes, les réponses cryptographiques ou le mot de passe.

La migration n’active la protection pour aucun compte existant. L’administrateur doit effectuer lui-même l’inscription, conserver ses codes puis confirmer.

## Conservation et limitation des codes

La migration 027 ajoute deux tables privées avec RLS et révocation des droits PUBLIC, anon et authenticated. Elle ne modifie ni le mot de passe ni les facteurs des comptes existants et n’active aucune protection automatiquement.

La clé TOTP contient 160 bits aléatoires et est chiffrée de façon authentifiée avec `BETTER_AUTH_SECRET`, en liant le contenu à l’utilisateur. Le serveur utilise `@better-auth/utils` et les primitives cryptographiques Better Auth existantes. La clé de configuration n’est affichée qu’à la préparation et disparaît de l’interface après confirmation. Une rotation du secret serveur exige une procédure de migration/récupération des clés TOTP ; ne pas le remplacer sans préparation.

La validation accepte la période courante et une période de trente secondes de part et d’autre. La dernière période consommée est enregistrée en base sous verrou utilisateur, ce qui refuse le rejeu et deux validations concurrentes. Un code déjà utilisé doit être renouvelé dans l’application.

Pour l’e-mail, seul un HMAC lié à l’utilisateur, la session, l’adresse, le type de défi et un nonce aléatoire est conservé. Le code n’apparaît ni dans le sujet, ni dans les réponses API, ni dans les journaux. Les demandes d’envoi sont limitées à trois par heure et par utilisateur, avec soixante secondes entre deux envois. Les demandes refusées par le délai peuvent consommer le quota de demandes ; elles n’envoient pas de mail supplémentaire.

Six échecs de code bloquent les deux méthodes par code pendant quinze minutes. Les compteurs sont validés en transaction même quand le résultat métier est un refus. Les clés d’accès et les codes de secours restent disponibles. Les défis expirés et les facteurs retirés ne redonnent pas accès ; désactiver explicitement la protection supprime les facteurs, défis, codes de secours et autorisations de session.

Les essais locaux utilisent un transport de mail fictif uniquement si les trois garde-fous sont présents : environnement de recette et indicateur de tests, base `booking_test` sur `127.0.0.1`, URL locale. Les messages fictifs restent dans la table privée de vérifications de la base locale, accessibles seulement aux fixtures de test. Cette option ne s’active pas sur une recette hébergée ou en production ; aucune route de lecture des codes n’est exposée.

## Vérification

Les tests unitaires couvrent la validation, les options WebAuthn obligatoires et le refus avant mutation. Les essais PostgreSQL couvrent les sessions croisées, la concurrence d’utilisation d’un code, les défis expirés et rejoués, la vérification récente et la révocation.

Les essais Chromium emploient un authentificateur virtuel CTAP2 avec vérification de l’utilisateur : véritable inscription cryptographique, assertion, connexion ultérieure, export bloqué puis autorisé, récupération dans un navigateur neuf, codes enregistrés, origine falsifiée et charge rejouée refusées. Les identités et bases sont locales et fictives. La recette distante est vérifiée sans enrôler le compte réel.

Les essais WebAuthn utilisent `localhost` comme nom de domaine local, y compris dans GitHub Actions ; une adresse IP de boucle locale n’est pas un RP ID de domaine pour ces cérémonies. La connexion PostgreSQL de test conserve son adresse `127.0.0.1` et sa base isolée.

Sources : [SimpleWebAuthn serveur](https://simplewebauthn.dev/docs/packages/server), [SimpleWebAuthn navigateur](https://simplewebauthn.dev/docs/packages/browser).

Les essais complémentaires vérifient l’absence d’API biométrique dans Chromium, les trois onglets au clavier, la configuration TOTP manuelle, la connexion ultérieure par TOTP et e-mail, le délai et le quota des envois, les sessions liées, le refus des destinataires falsifiés et l’impossibilité d’ajouter une méthode avec le seul mot de passe à un compte protégé. Les vues 320, 390 et 1440 pixels sont contrôlées pour le débordement ; Axe contrôle les erreurs sérieuses et critiques. Ces essais ne certifient pas un appareil Xiaomi physique ni la délivrabilité dans une boîte mail réelle.
