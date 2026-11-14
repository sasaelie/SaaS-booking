# Mise en scène visuelle de la page de vente

La branche précédente a été fusionnée dans `main` avant cette évolution. Cette version conserve la typographie, les couleurs, les contours lumineux et les ombres du design approuvé.

Les trois exemples Ateliers, Soins et Sport montrent une photo locale en arrière-plan, décalée par rapport à la fenêtre de réservation. La même image est réutilisée dans l’activité ; les dimensions de chargement sont partagées pour réutiliser le cache. Le cartouche Liberté met en avant le prix réel de 0 € par mois et les frais de 3,5 % + 0,45 € par réservation payée, avec un lien vers les formules. Aucun avis ni nombre de clients n’est inventé.

La section « Comment ça marche » présente une photo de céramique devant un cadre lumineux et un aperçu de planning au premier plan. Le planning porte explicitement la mention « données fictives ». Les quatre cartes présentent les horaires organisateur, les codes de report, les virements structurés Studio Pro et le partage de la page. Elles remplacent les anciens trois paragraphes de fonctionnement ; elles ne rétablissent pas le bloc de bénéfices supprimé.

Une carte s’ouvre au survol de souris, au premier toucher ou avec Entrée/Espace. Échap permet de la refermer. Le départ du pointeur ne masque pas une explication dont le bouton garde le focus clavier. Le contenu se déploie dans son propre cadre et déplace les suivants ; il ne les recouvre pas. L’état est annoncé par `aria-expanded`, avec une relation `aria-controls`. Le mode de réduction des animations est respecté.

Les cartes tarifaires restent entièrement cliquables, sans commande imbriquée. Leurs prix sont agrandis et un cadre décalé leur donne du relief. Leurs montants et conditions proviennent du composant commercial existant. Les liens conservent la formule choisie lors de l’inscription et de la connexion.

L’en-tête reste opaque, collé en haut et de pleine largeur. La FAQ conserve sa page propre. Le pied de page aligné et les pages d’information restent accessibles. Le dernier appel à l’inscription et les questions déroulantes supprimés ne reviennent pas.

Les photos et leurs licences sont documentées dans `CADRES-ET-PHOTOS.md`. Aucun nouveau service, script tiers, paiement ou stockage n’est ajouté. Les aperçus n’enregistrent aucune réservation.

## Contrôles

- TypeScript, ESLint et 126 tests unitaires : validés.
- Construction Next.js optimisée : validée.
- 21 tests navigateur ciblés : validés, dont 4 nouveaux tests des cartes, du toucher, du clavier et des visuels.
- Vérification des largeurs 320, 390, 768 et 1440 px, des images des trois exemples, de la visibilité de l’inscription et des offres compactes.
- Axe WCAG A/AA sur les exemples, les cartes ouvertes et les pages d’information : aucune violation détectée. Ce contrôle automatisé ne constitue pas à lui seul une certification de conformité.
- Lighthouse mobile, exécuté seul sur la construction locale : performance 100/100, accessibilité 100/100, LCP 1,1 s, CLS 0. Ces mesures de laboratoire ne préjugent pas des résultats en production.
- Réduction des animations, navigation essentielle sans JavaScript, maintien des sessions et absence de réservation créée par la démonstration : validés.

La prévisualisation reste en environnement de test, sans paiement réel ni indexation publique. La mise en production et les informations légales à compléter demeurent une étape distincte.
