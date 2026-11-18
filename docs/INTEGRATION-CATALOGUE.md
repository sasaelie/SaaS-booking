# Catalogue de cours intégré sur un site

Dans l’espace organisateur, **Partager → Sur votre site → Tous vos cours sur votre site** fournit un seul code à copier dans un bloc HTML autorisé par l’hébergeur. Il utilise l’adresse de l’application et le lien de l’organisation déjà enregistrés ; aucun identifiant d’activité n’est à renseigner.

```html
<script src="https://reservation.example/widget.js?v=1" data-organization="votre-atelier" data-mode="inline" defer></script>
```

Le visiteur voit le catalogue, choisit un cours puis un créneau et remplit les coordonnées dans la même page du site. Il peut revenir au catalogue depuis le formulaire. Les cours publiés sont relus lors du chargement du catalogue : publier ou archiver une activité ne demande pas de remplacer le code d’installation.

Les anciennes installations ciblant une activité restent compatibles avec `data-activity`. Le mode flottant reste disponible. Le paramètre de version du nouveau code évite de reprendre un ancien script en cache qui exigeait obligatoirement une activité.

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

La préparation du catalogue est testée localement. Le choix entre un aperçu privé non publié et une réservation accessible aux visiteurs reste à clarifier avec le propriétaire, qui avait demandé de conserver un accès réservé à lui. Les protections Vercel ont été conservées ; aucun nouveau lien de contournement n’a été créé pour résoudre ce blocage.

## Contrôles à conserver

Les scénarios navigateur vérifient le parcours complet depuis une autre origine, la confirmation réellement persistée, le retour au catalogue, l’ajout et l’archivage de cours sans réinstallation, la copie du code, l’absence de secret, les droits Pro, le refus d’un cours d’une autre organisation, le redimensionnement complet et les largeurs 320, 390 et 1440 pixels. Les tests historiques d’intégration par activité et de navigation restent exécutés.
