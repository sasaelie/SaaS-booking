# Protection de l’administration avec une clé d’accès

Le compte existant est conservé. Le parcours fonctionne depuis un seul téléphone : connexion habituelle, rubrique **Sécurité de mon compte**, mot de passe actuel, puis confirmation du système sur l’appareil. Il n’y a aucun QR code applicatif à scanner.

## Utilisation

1. Ouvrir `/compte/securite` depuis le menu organisateur avec un compte administrateur de plateforme.
2. Donner un nom à l’appareil et confirmer son mot de passe.
3. Choisir **Continuer sur cet appareil**. Le navigateur ouvre son interface de création de clé. Face ID, empreinte ou code de verrouillage dépend du téléphone et de son gestionnaire de clés.
4. Enregistrer ou copier les dix codes de secours. Les conserver dans un endroit accessible même après perte du téléphone ; le fichier enregistré uniquement sur le téléphone perdu ne suffit pas.
5. Recopier un des codes pour confirmer leur conservation et activer explicitement la protection. Cette confirmation initiale ne consomme pas le code.

Avant la dernière étape, la protection reste en préparation. Annuler une fenêtre ou une préparation ne ferme pas le compte. Après activation, chaque nouvelle session doit vérifier l’appareil pour lire ou modifier les données de l’administration. Les espaces organisateur ordinaires et les réservations des participants conservent leur fonctionnement.

## Vérification et récupération

- Une vérification réussie autorise l’administration pendant huit heures au maximum dans cette session authentifiée. Une nouvelle session ne récupère pas cette autorisation.
- Ajouter ou retirer un appareil, renouveler les codes ou désactiver la protection exige une vérification de moins de cinq minutes et le mot de passe actuel.
- Un code de secours s’utilise après la connexion habituelle et fonctionne une seule fois, y compris en cas de demandes simultanées.
- Le dernier appareil ne peut pas être retiré pendant que la protection est active. Ajouter un autre appareil avant de le retirer, ou désactiver explicitement la protection.
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

## Vérification

Les tests unitaires couvrent la validation, les options WebAuthn obligatoires et le refus avant mutation. Les essais PostgreSQL couvrent les sessions croisées, la concurrence d’utilisation d’un code, les défis expirés et rejoués, la vérification récente et la révocation.

Les essais Chromium emploient un authentificateur virtuel CTAP2 avec vérification de l’utilisateur : véritable inscription cryptographique, assertion, connexion ultérieure, export bloqué puis autorisé, récupération dans un navigateur neuf, codes enregistrés, origine falsifiée et charge rejouée refusées. Les identités et bases sont locales et fictives. La recette distante est vérifiée sans enrôler le compte réel.

Sources : [SimpleWebAuthn serveur](https://simplewebauthn.dev/docs/packages/server), [SimpleWebAuthn navigateur](https://simplewebauthn.dev/docs/packages/browser).
