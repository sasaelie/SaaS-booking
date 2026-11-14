# Démonstration visuelle de la page de vente

La page conserve la typographie, les couleurs, les contours lumineux et les ombres du design approuvé. Les offres Liberté et Studio Pro sont présentées sans grand cadre, centrées autour d’une icône, du prix et du lien de choix. Le contour tarifaire décalé, la photo supplémentaire au-dessus de l’aperçu et son cartouche de prix, ainsi que le simulateur « Quand Pro devient-il intéressant ? » sont supprimés.

## Une démonstration liée

L’aperçu participant et le planning organisateur partagent le même état React, propre à chaque visite. Les exemples Ateliers, Soins et Sport définissent chacun une photo, un titre, un prix et deux séances avec date et horaires. La même définition alimente les deux vues : changer l’activité ou la séance change aussi la photo du planning, le jour mis en évidence et le créneau affiché.

Le bouton « Simuler cette réservation » fait apparaître la mention « Réservation simulée · 1 place » dans le planning. Le clic amène directement le planning dans la zone visible et lui transmet le focus avec une description du résultat. Une nouvelle sélection efface le résultat précédent. Les exemples sont signalés comme fictifs. La simulation utilise uniquement l’état du navigateur : aucune API d’inscription, réservation, paiement ou notification n’est appelée et aucune donnée n’est enregistrée.

Le scénario se déroule automatiquement dès que l’une des deux vues est visible : création par l’organisateur, publication, choix d’une séance par le client puis réception de la réservation simulée. Les horaires et le nombre de places restent cohérents entre les étapes. Seul le bouton Pause impose une reprise volontaire ; un toucher de lecture, un défilement ou le retour dans l’onglet n’impose plus d’appuyer sur Play. Le focus clavier sur une commande suspend temporairement le scénario. La réduction des animations supprime les effets CSS sans bloquer la progression des étapes.

Les technologies, les durées, les états et les règles de reprise sont détaillés dans `SCENARIO-AUTONOME.md`.

Les photos restent des WebP locaux, sans appel à Unsplash dans le navigateur ; leurs sources et licences figurent dans `CADRES-ET-PHOTOS.md`.

## Navigation et cartes

Les quatre cartes présentent les horaires organisateur, les codes de report, les virements structurés Studio Pro et le partage de la page. Elles s’ouvrent à la souris, au toucher ou avec Entrée/Espace, et se ferment avec Échap. Les explications se déploient dans leur propre cadre. Aucun nombre de clients, avis ou service inexistant n’est annoncé.

L’en-tête opaque reste de pleine largeur. La FAQ conserve sa page propre. Le pied de page aligné et les pages d’information restent accessibles. Les liens de choix des offres accompagnent l’inscription et la connexion. Les explications, l’économie annuelle, le comparateur et les notes sous ces liens sont retirés ; le pied de page les suit directement.

## Vérification

La vérification couvre TypeScript, ESLint, les tests unitaires et la construction Next.js. Les tests navigateur contrôlent le lien entre les trois exemples et le planning, l’apparition de la réservation simulée, le cycle automatique et sa reprise explicite, le clavier, la réduction des animations et l’arrêt hors écran. Les parcours existants vérifient les largeurs 320, 390, 768 et 1440 px, les offres centrées, les liens et les sessions. Axe vérifie les états visibles et les pages d’information ; il ne constitue pas à lui seul une certification de conformité.

Contrôles locaux : TypeScript, ESLint, 126 tests unitaires et construction optimisée validés ; les contrôles du scénario autonome et des nouvelles offres sont décrits dans `SCENARIO-AUTONOME.md`.

La prévisualisation reste en environnement de test, sans paiement réel ni indexation publique.
