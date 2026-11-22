# Catalogue de cours intégré sur un site

Dans **Partager**, deux onglets distinguent les parcours : **Sur mes réseaux sociaux** fournit le lien autonome et, en Pro, le QR code ; **Sur mon site** guide l’installation du calendrier dans la page ou du bouton flottant pour tous les cours. Les options d’intégration et QR par activité restent accessibles dans une section repliable. Les deux parcours utilisent le même moteur, sans compte participant obligatoire. Les règles Pro et les protections de recette restent vérifiées côté serveur.

L’aide sur les espaces membres indique explicitement que le raccordement n’est pas disponible. Il n’existe actuellement aucun réglage permettant de rendre une réservation réservée aux membres. Une future intégration devra conserver les comptes sur le site organisateur, faire vérifier côté serveur une autorisation signée et temporaire liée à l’organisation, puis refuser l’accès sans preuve valable. Masquer un bouton ou conserver une URL secrète ne remplace pas cette vérification. Aucun compte membre, secret de raccordement ou mécanisme de facturation supplémentaire n’est créé dans cette étape.

Dans l’espace organisateur, **Partager → Sur votre site → Tous vos cours sur votre site** fournit un seul code à copier dans un bloc HTML autorisé par l’hébergeur. Il utilise l’adresse de l’application et le lien de l’organisation déjà enregistrés ; aucun identifiant d’activité n’est à renseigner.

```html
<a href="https://reservation.example/votre-atelier" data-booking-fallback target="_blank" rel="noopener noreferrer">Ouvrir la réservation dans une nouvelle fenêtre</a>
<script src="https://reservation.example/widget.js?v=4" data-organization="votre-atelier" data-mode="inline" defer></script>
```

Le visiteur voit le catalogue, choisit un cours puis un créneau et remplit les coordonnées dans la même page du site. Il peut revenir au catalogue depuis le formulaire. Les cours publiés sont relus lors du chargement du catalogue : publier ou archiver une activité ne demande pas de remplacer le code d’installation.

Après confirmation, **Gérer ma réservation** ouvre la gestion dans le même encart, sans nouvel onglet et sans passer par la connexion participant. **Retour à mon billet** conserve le code existant ; une annulation reste affichée comme annulée. **Terminer et revenir au site** ferme la fenêtre flottante ou ramène en haut du site sans effacer le billet. Le site hôte ne reçoit qu’un message de retour sans données personnelles ; il vérifie l’origine et la fenêtre émettrice. Aucun lien de retour externe fourni par l’utilisateur n’est suivi. Les liens autonomes et les QR codes conservent leur accès participant habituel.

Les anciennes installations ciblant une activité restent compatibles avec `data-activity`. Le mode flottant reste disponible. Le paramètre de version du nouveau code évite de reprendre un ancien script en cache qui exigeait obligatoirement une activité.

Le mode flottant utilise une hauteur stable adaptée à l’écran : le contenu défile dans le calendrier et le bouton de fermeture reste visible. Seul le mode dans la page adapte sa hauteur à tout le document. Les messages de retour restent filtrés par origine et fenêtre source dans les deux modes.

## Disponibilité et contrôle d’installation

Le calendrier envoie un message de disponibilité distinct de son redimensionnement. Le script hôte vérifie l’origine, la fenêtre émettrice, la version et le contenu du message. Un simple chargement de document, une redirection vers une connexion Vercel ou un message envoyé par une autre fenêtre ne suffit pas à confirmer que le calendrier fonctionne.

Au démarrage, l’encart affiche « Connexion au calendrier… ». Après six secondes, il signale l’attente et propose l’accès direct ; après quinze secondes sans réponse, il propose aussi **Réessayer**. Le rechargement reste une action volontaire avant la première connexion réussie : aucun délai ne recharge automatiquement un formulaire commencé. Une réponse du serveur indiquant un calendrier indisponible affiche cet état explicitement.

Le code v4 contient un lien public indépendant placé avant le script. Il reste utilisable si un bloqueur empêche le script lui-même de démarrer. Les anciennes installations restent compatibles lorsque leur script peut charger ; recopier une fois le code complet depuis **Partager → Sur mon site** ajoute cet accès indépendant. Le script ne peut pas contourner la politique de sécurité d’un site, un filtrage réseau ou la protection Vercel.

Dans **Vérifier l’intégration**, le premier contrôle vérifie uniquement la réponse du calendrier. Si l’adresse correspond à une recette privée, le résultat indique qu’il est limité à la session courante et ne prétend pas valider l’accès des visiteurs. Le contrôle **Sur mon site** ouvre la page publiée avec un paramètre de diagnostic public : la confirmation apparaît sur cette page seulement après une réponse valide du calendrier. L’adresse du site n’est pas enregistrée ; aucune requête serveur ne la visite et la fenêtre ouverte ne peut pas accéder au compte organisateur. Aucun résultat distant n’est enregistré automatiquement dans le compte.

La réservation et la gestion intégrées utilisent l’accès personnel du billet et ne demandent pas de cookie de connexion participant ni de stockage local sur le site tiers. Le paiement sécurisé s’ouvre après un clic dans une nouvelle fenêtre sans accès à la fenêtre hôte. La fermeture de cette fenêtre ne confirme pas le paiement : seule la réponse du serveur actualise le statut et le billet. Une erreur temporaire de lecture du billet propose une nouvelle lecture, sans soumettre une seconde réservation.

## Règles conservées

- L’intégration du catalogue, comme celle d’une activité, reste une fonctionnalité Pro vérifiée côté serveur. Un accès offert actif suit la même règle.
- Les cours, horaires, places, prix et confirmations utilisent les services de réservation existants. Les consoles et les comptes restent interdits dans une iframe.
- La hauteur s’adapte au contenu complet de l’iframe, y compris le bandeau de recette, avec vérification de l’origine, de la fenêtre source, du type de message et des bornes.
- Le code d’installation contient uniquement des informations publiques. Les clés API, mots de passe et secrets de contournement Vercel n’y ont pas leur place.
- Le lien public de l’organisation reste destiné aux réseaux sociaux : Instagram ou les autres réseaux ouvrent la page mobile de réservation. Ils ne reçoivent pas le script HTML.

## Situation du premier essai Studio Créatif 360

Le site confirmé est le projet Vercel `studio-creatif-360`, dépôt `sasaelie/studio-creatif-360`, version publiée `a146837a2ad93754e52ad1e0b04781b8fcd26b94`. Sa route `/reservation` prépare actuellement une demande par e-mail. Le dépôt a été ouvert en copie isolée, sans modification de son code ou de sa publication.

L’espace applicatif correspondant est `studiocreatif360`, avec un accès offert actif et un cours publié, **Couture débutant**. Aucune activité, réservation, facturation ou donnée d’accès n’a été modifiée sur la recette pour cette préparation.

Le premier contrôle distant a confirmé un blocage réel de la protection globale Vercel : après un accès de test déjà autorisé, le chargement du script depuis un autre site est redirigé (302), sans iframe créée. Le cookie de cette session possède `SameSite=Lax`. Posséder un accès en navigation directe ne prouve donc pas que l’intégration fonctionnera dans un site tiers.

Le propriétaire a choisi un **aperçu privé**, accessible en recette à `/apercu-site`, également proposé dans **Partager → Sur votre site** pour cet espace. Une copie autonome de la page du site accueille le catalogue et son calendrier sur la même origine que la recette : la protection Vercel reste active sans dépendre d’un cookie tiers. Le site publié et sa page de demande par e-mail restent inchangés.

L’aperçu exige une session administrateur de plateforme, la propriété de l’espace `studiocreatif360`, son accès Pro et, si elle est activée, la seconde authentification vérifiée. Il est indisponible en production. Ses routes sont privées, sans cache ni indexation ; son calendrier ne peut être encadré que par la même origine. Aucun nouveau lien de contournement Vercel n’est nécessaire.

Le calendrier utilise exclusivement la simulation existante : synchronisation de la configuration des cours vers le schéma de test isolé, réservations TEST, aucun paiement réel, aucun e-mail envoyé et aucune place réelle occupée. Le billet TEST peut être enregistré. Ce parcours ne prouve pas le fonctionnement des paiements ou e-mails réels.

La copie est générée depuis la révision du site indiquée ci-dessus, avec images et polices intégrées. Pour la mettre à jour volontairement, vérifier et changer `WEBSITE_PREVIEW.SOURCE_REVISION`, démarrer la copie du site sur le port 3120, puis exécuter `node --import tsx scripts/create-website-preview.ts /chemin/vers/studio-creatif-360-site`. Le générateur refuse une révision différente et ne modifie pas le dépôt source. Le fichier HTML privé est inclus explicitement dans les traces de compilation Vercel.

## Contrôles à conserver

Les scénarios navigateur vérifient le parcours complet depuis une autre origine, la confirmation réellement persistée, le retour au catalogue, l’ajout et l’archivage de cours sans réinstallation, la copie du code, l’absence de secret, les droits Pro, le refus d’un cours d’une autre organisation, le redimensionnement complet et les largeurs 320, 390 et 1440 pixels. Les tests historiques d’intégration par activité et de navigation restent exécutés.

Les scénarios d’aperçu privé ajoutent le parcours TEST complet, la séparation entre réservations réelles et simulées, le téléchargement d’un véritable fichier PDF, le menu d’origine, les largeurs 320, 390, 768 et 1440 pixels, l’accessibilité des contenus principaux et le refus des visiteurs anonymes, des autres administrateurs, des propriétaires sans rôle de plateforme, des identifiants étrangers et des sessions sans seconde vérification requise.
