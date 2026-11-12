# Accueil commercial : décisions et vérifications

L’objectif est de rendre le produit compréhensible dès le premier écran, puis de conduire vers les vrais parcours d’inscription et de choix de formule. Le code HTML transmis sert de référence d’intention, sans être recopié. Le design Crystal Ice Block déjà validé reste la référence visuelle.

## Parcours retenu

1. Identité du service, navigation courte, accès au compte selon la session réelle.
2. Promesse concrète : publier ses activités, partager un lien, recevoir des réservations sans compte participant.
3. Aperçu interactif explicitement fictif, adapté aux ateliers, soins et sports, sans créer de réservation.
4. Trois étapes pour comprendre le fonctionnement et trois bénéfices liés aux fonctions existantes.
5. Deux offres compactes entièrement cliquables, frais explicites, comparaison complète disponible séparément.
6. Exemple d’économie conditionnel : les frais bancaires du simulateur sont illustratifs, ceux du vrai tableau de bord restent rapprochés.
7. Questions fréquentes, dernier appel à l’action, pied de page avec de vraies pages légales, confidentialité, accessibilité et contact.

## Arbitrages marketing

- Pas de faux formulaire d’inscription, faux témoignage, compteur de clients inventé, promesse de durée non mesurée ou lien juridique `#`.
- Le prix public reste celui payé par le participant. Studio Pro supprime seulement la commission de plateforme.
- 260 € annuels représentent 88 € de moins que douze mensualités à 29 € ; « deux mois offerts » serait inexact.
- Le seuil de 37 réservations ne vaut que dans l’exemple d’un billet de 30 € et de 0,70 € de frais bancaires. Ce n’est pas une garantie générale.
- Les sessions connectées restent reconnues. Les cartes tarifaires conservent l’intention de formule à travers l’authentification.
- Kreno a été envisagé par l’utilisateur. La recherche a trouvé deux logiciels de réservation portant déjà ce nom ; voir [la recherche sur le nom](RECHERCHE-NOM-KRENO.md). L’utilisateur a ensuite choisi de conserver Studio Créatif 360 provisoirement. Aucun domaine ni nom d’organisation n’est remplacé automatiquement.
- Les rubriques légales sont toutes affichées, avec « À compléter » pour les données absentes. Les coordonnées valides apparaissent progressivement et les liens e-mail/téléphone ne sont actifs que lorsqu’ils sont renseignés.

## Référencement, accessibilité et performance

Le contenu commercial est rendu sur le serveur. Titres, description, URL canonique et partage social décrivent réellement le produit. Le sitemap ne contient que les pages commerciales autorisées. Les comptes, paiements, simulations et liens personnels ne sont pas indexables. La recette reste protégée et non indexable ; l’ouverture de l’indexation exige un domaine public et une identité professionnelle renseignés, puis une activation explicite.

L’accessibilité est un objectif de conception, pas une certification proclamée : structure de titres, lien d’évitement, labels, contrastes, clavier, focus visible, cibles confortables, rendu mobile et réduction des animations. La portée juridique de l’EAA dépend du service et de l’entreprise. Le SPF Économie mentionne des obligations depuis le 28 juin 2025 et un régime transitoire belge pour les microentreprises ; cela ne justifie pas de reporter les améliorations utiles.

La parallaxe n’est pas indispensable à la conversion et peut gêner certains visiteurs. Le défilement reste naturel. Pas de dépendance WebAssembly pour une page essentiellement textuelle : HTML, CSS et quelques interactions locales suffisent. Aucun script Tailwind ou bibliothèque d’icônes à charger depuis un CDN. Si des médias sont ajoutés, seules les images hors premier écran devront être chargées tardivement ; le contenu principal ne doit pas attendre un défilement.

## Sources primaires consultées le 12 novembre 2026

- Google Search Central, [guide de démarrage SEO](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) : contenu utile, exploration et absence de garantie d’indexation ou de première place.
- Google Search Central, [expérience de page](https://developers.google.com/search/docs/appearance/page-experience) : de bons scores ne garantissent pas un bon classement.
- web.dev, [optimiser le LCP](https://web.dev/articles/optimize-lcp) : affichage du contenu principal ; éviter le chargement différé de son image.
- web.dev, [WebAssembly et tâches intensives](https://web.dev/articles/webassembly-performance-patterns-for-web-apps) : intérêt pour des calculs lourds, absent ici.
- W3C WAI, [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/) et [préférence de réduction des mouvements](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html).
- SPF Économie, [accessibilité du commerce électronique](https://economie.fgov.be/fr/themes/entreprises/guidance/accessibilite/accessibilite-guidelines-pour-0).
- SPF Économie, [identification obligatoire des entreprises en ligne](https://economie.fgov.be/fr/themes/line/commerce-electronique/vente-par-internet/site-dentreprise-et-comptes) : identité, adresse, moyens de contact, BCE et TVA selon le cas.

## Validation prévue

Vérification TypeScript, ESLint et tests unitaires ; parcours réels invité/connecté et choix Pro ; liens et pages du pied de page ; clavier et rendu à 320, 390, 768 et 1440 px ; absence de débordement ; fonctionnement sans JavaScript du contenu et des liens essentiels ; non-indexation en recette, sitemap et métadonnées ; mesures locales de performance présentées comme indicatives, sans promesse de classement ni de conformité juridique automatique.

Avant une ouverture commerciale publique, l’identité de l’éditeur, les coordonnées professionnelles, le régime TVA, les conditions contractuelles et le domaine doivent être finalisés. La prévisualisation peut être vérifiée sans inventer ces informations et sans activer de paiement réel.
