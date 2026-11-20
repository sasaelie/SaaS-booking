# Audit visuel, responsive, SEO et recherche par IA — 20 novembre 2026

Application auditée : SaaS de réservation, branche `feat/public-test-website`, base `5572627804c9b4db637f5cb5381cfec1e98436d0`, puis corrections locales décrites ci-dessous.
Le site vitrine indépendant `studio-creatif-360-site` ne fait pas partie de ce périmètre.

## Conclusion

La structure responsive tient sur les formats contrôlés : aucun débordement horizontal global dans le balayage initial. Des défauts localisés de lisibilité et de cohérence ont néanmoins été reproduits et corrigés.
Le référencement est préparé techniquement, mais volontairement fermé en TEST. Ce rapport ne prétend ni que le site est déjà indexé, ni qu’il sera cité par un moteur ou une IA.

## Couverture et preuves

- Inventaire : 46 routes de page, plus la page 404 ; 61 états représentatifs, dont les redirections, erreurs, états vides, réservation confirmée, annulation et simulation.
- 549 cas page/format : largeurs CSS de 320, 360, 390, 480, 600, 768, 1 024, 1 440 et 1 920 px ; hauteurs de 740 à 1 080 px, dont le paysage à 1 024 × 768.
- 297 contrôles supplémentaires sur neuf écrans aux 33 valeurs situées autour des seuils CSS ; neuf essais avec espacement du texte augmenté.
- Deux parcours tactiles émulés, à 360 et 390 px : semaine de sept jours, sélection d’une séance, continuation vers les coordonnées ; champs principaux à 16 px.
- 120 analyses Axe WCAG A/AA sur les états initiaux stables : aucune violation détectée. Des contrôles de contraste restent indéterminés sur le verre et les photos ; ce résultat n’est pas une certification d’accessibilité.
- Revue des captures de chaque état en mobile et sur ordinateur, puis inspection des écrans concernés par les anomalies.
- 575 captures initiales. [Galerie filtrable](/workspace/artifacts/audit-responsive-seo-2026-11-20/index.html), [mesures initiales](/workspace/artifacts/audit-responsive-seo-2026-11-20/manifest.json), [seuils CSS et tactile](/workspace/artifacts/audit-responsive-seo-2026-11-20/stress.json).
- Données et comptes fictifs sur PostgreSQL local `booking_test` ; aucune migration, modification de données réelles, ouverture de recette ou activation de paiement.

## Défauts reproduits et corrections

| Sujet | Constat avant correction | Correction ciblée |
| --- | --- | --- |
| Titres longs | Un nom valide de 76 caractères chevauchait le tarif dans l’éditeur à 320 px. | Taille du titre long adaptée à la largeur du cadre, dans l’éditeur et le rendu partagé. Les textes courts et les coordonnées de placement sont conservés. |
| Rétablissement des couleurs | Le bouton supprimait aussi le placement personnalisé du titre et du tarif. | Le placement est conservé ; le bouton distinct de rétablissement du placement garde son rôle. |
| Coordonnées d’entreprise | À 1 024 px, la combinaison barre latérale + formulaire + aperçu laissait des champs d’environ 140 px. | Les colonnes des champs se recomposent selon leur largeur disponible, avec une largeur cible de 240 px. |
| Page 404 | Message Next.js en anglais, sans chemin de retour explicite. | Page en français, surface en verre cohérente, retour à l’accueil ; statut HTTP 404 conservé. |
| Partage sur les réseaux | Aperçu et icône encore verts malgré la palette validée ; image non déclarée sur certaines pages publiques secondaires. | Palette violet/cyan/orange et image explicitement renseignée pour Open Graph et Twitter sur les pages publiques. |

Sources : [placement](../src/app/_ui/story-layout.css), [éditeur](../src/app/_portal/StoryLayoutEditor.tsx), [réinitialisation](../src/app/_portal/use-appearance.ts), [champs](../src/app/_portal/platform-settings/platform-settings.css), [404](../src/app/not-found.tsx), [métadonnées](../src/app/_marketing/public-metadata.ts), [aperçu social](../src/config/marketing-media.ts).

Les choix validés sont conservés : palette personnalisable, boutons à 8 px, surfaces légères, navigation hiérarchisée, en-tête public pleine largeur et collé en haut avec ombre, semaine incluant le week-end, lueurs et tarifs métier.
Un organisateur peut toujours déplacer volontairement ses textes au même endroit ; la correction des titres longs ne remplace pas son placement par une disposition imposée.

## SEO technique

| Vérification | Résultat |
| --- | --- |
| Contenu sans JavaScript | Les sept pages publiques renvoient leur texte et leurs métadonnées dans le HTML serveur. |
| Langue et mobile | `lang="fr"`, viewport responsive, contenu principal disponible en mobile. |
| Titres et descriptions | Distincts sur les sept pages publiques ; un H1 par page publique contrôlée. |
| Partage | Open Graph et Twitter ; image PNG 1 200 × 630, corrigée pour les pages secondaires. |
| TEST | Métadonnées et en-tête HTTP `noindex, nofollow`, `robots.txt` avec `Disallow: /`, sitemap vide : comportement voulu. |
| Publication future | Canonical, sitemap des sept pages et JSON-LD `WebSite` prévus lorsque domaine, identité et indicateur de publication sont validés. |
| Accès privés | Comptes, administration, simulation, billets et liens personnels exclus du périmètre indexable. |

[Relevé SEO serveur initial](/workspace/artifacts/audit-responsive-seo-2026-11-20/seo-technical.json).
L’URL de TEST publique affiche le catalogue d’un organisateur ; elle ne représente pas à elle seule le futur référencement de la vitrine commerciale.

## Points restant à traiter avant le lancement

| Priorité | Action | Critère de fin |
| --- | --- | --- |
| P1 | Unifier ou synchroniser l’identité publique entre les paramètres administrateur enregistrés en base et les variables `PUBLIC_*` utilisées par le contrôle d’indexation. | Publier les coordonnées dans l’administration ne laisse pas une identité différente dans les métadonnées et le contrôle de publication. Aucun champ fictif ajouté pour contourner la validation. |
| P1 | Raccorder le domaine définitif et ouvrir l’indexation uniquement sur la production commerciale prête. | Canonicals absolus, sitemap réel, robots et en-têtes cohérents ; la recette et les espaces privés restent exclus. |
| P1 | Valider les informations d’entreprise et les textes publics avant ouverture commerciale. | Contact, mentions et données structurées décrivent le même éditeur réel. |
| P2 | Décider si les pages publiques des organisateurs doivent être indexables, avec leur accord. | Choix explicite, canonicals stables et sitemap adapté ; billets, codes et intégrations restent privés. Actuellement seuls les sept chemins marketing sont éligibles. |
| P2 | Retourner une vraie absence de ressource pour une organisation inconnue. | Aujourd’hui ce chemin renvoie HTTP 200 avec `noindex`. Prévoir 404 avant une éventuelle indexation des catalogues. |
| P2 | Compléter la revue de contraste avec des photos claires et les couleurs personnalisées extrêmes. | Vérification manuelle des textes, du focus et des états sélectionnés sur les fonds réellement utilisés. |
| P2 | Valider sur de vrais Safari/iPhone et navigateur Mi, puis avec agrandissement du texte et technologies d’assistance. | Navigation, calendrier, formulaires, téléchargement du billet et intégration vérifiés sur ces appareils. |
| P2 | Consolider progressivement les anciennes feuilles CSS et les surcharges Liquid Glass. | Réduction des conflits de cascade avec captures avant/après ; aucune suppression massive des effets validés. |
| P2 | Faciliter le choix d’une organisation dans le formulaire de coût exceptionnel lorsque la liste grandit. | Recherche dans le sélecteur, accessible au clavier et au toucher ; pagination et filtres existants des listes conservés. |
| P2 | Examiner l’avertissement de traçage du fichier d’aperçu lors du build. | Dépendance limitée au gabarit nécessaire et contrôle des fichiers embarqués ; aucun élargissement de l’accès public. |
| P3 | Mesurer la performance sur le domaine réel puis suivre Search Console. | Core Web Vitals réels, sitemap soumis, erreurs d’exploration suivies. |

Le téléphone est actuellement exigé par le contrôle technique d’identité, bien que les coordonnées de contact soient facultatives dans l’administration. Il faut harmoniser ce choix produit ; ce rapport n’en fait pas une obligation légale.

## Référencement et IA

Les moteurs et assistants ont besoin de contenu public compréhensible, d’URL stables, de liens explorables et de données structurées fidèles au contenu visible. Les fondations existantes répondent à une partie de ces exigences ; le blocage TEST reste déterminant actuellement.

- Google indique que ses fonctionnalités IA utilisent les exigences SEO habituelles. Il n’existe pas de balise ou de fichier spécial garantissant une citation ; `llms.txt` n’est pas une exigence de Google Search.
- Pour ChatGPT Search, `OAI-SearchBot` concerne la recherche ; `GPTBot` concerne l’entraînement. Ces choix sont distincts et peuvent être configurés séparément au lancement.
- Ajouter ensuite une description structurée de l’entreprise et du logiciel uniquement à partir d’informations réelles publiées. Ne pas inventer avis, notes, prix ou identité pour enrichir le JSON-LD.
- Aucun score externe Is Agentic n’est annoncé : noter la recette privée ou son catalogue TEST ne mesurerait pas la future visibilité commerciale. L’aptitude à être utilisée par un agent n’est pas un classement dans les résultats IA.

Sources officielles : [Google — fonctionnalités IA](https://developers.google.com/search/docs/appearance/ai-features), [Google — optimisation pour la recherche IA](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [OpenAI — robots de recherche et d’entraînement](https://developers.openai.com/api/docs/bots), [Google — indexation mobile](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing), [W3C — reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

## Performance : limites des mesures

Trois mesures de laboratoire locales sur le build initial de production, Chromium à 390 × 844, CPU ralenti ×4, latence 150 ms, téléchargement 1,6 Mbit/s : LCP observé de 0,96 à 1,14 s et CLS de 0 pour accueil, connexion et réservation.
Des tâches JavaScript de 237 à 343 ms ont été observées : garder la réduction du travail initial comme axe d’amélioration.
Il s’agit d’un passage par page, sans mesure INP fiable et sans données visiteurs. Aucun score Lighthouse, PageSpeed, CrUX ou classement SEO n’est inventé.
[Mesures et conditions exactes](/workspace/artifacts/audit-responsive-seo-2026-11-20/performance-lab.json).

## Inventaire des 46 routes

| Famille | Routes |
| --- | --- |
| Vitrine : 7 | `/`, `/faq`, `/contact`, `/mentions-legales`, `/confidentialite`, `/conditions`, `/accessibilite` |
| Accès : 4 | `/inscription`, `/connexion` (organisateur et participant), `/mot-de-passe-oublie`, `/nouveau-mot-de-passe` |
| Participant et service : 5 | `/[organization]`, `/[organization]/[activityId]`, `/manage`, `/booking-result`, `/apercu-chargement` |
| Intégration : 4 | `/embed/[organization]`, `/embed/[organization]/[activityId]`, `/embed/[organization]/preview`, `/embed/[organization]/preview/[activityId]` |
| Espaces : 2 | `/app`, `/app/nouveau` |
| Organisation : 11 | `/app/[organizationId]`, puis `/abonnement`, `/activites`, `/activites/nouvelle`, `/activites/[activityId]`, `/parametres`, `/partager`, `/reglages`, `/reservations`, `/seances/[activityId]`, `/tests` |
| Administration et sécurité : 8 | `/plateforme`, `/plateforme/operations`, `/plateforme/historique`, `/plateforme/finances` et ses vues, `/plateforme/utilisation`, `/plateforme/parametres`, `/plateforme/parametres/peppol`, `/compte/securite` |
| Simulation : 5 | `/simulation/[organizationId]`, puis `/activite/[activityId]`, `/reservations`, `/paiement/[bookingId]`, `/gestion` (redirection) |

La page 404 est contrôlée en plus. Les points d’entrée API et les documents téléchargés ne sont pas des pages de cette matrice visuelle.

## Vérification des corrections

TypeScript, ESLint et les 235 tests unitaires passent. Les cinq scénarios navigateur ciblés passent, dont le contrôle de conservation du placement après réinitialisation et rechargement. Le build de production réussit ; le contrôle des 84 manifestes de dépendances n’identifie aucune dépendance de développement interdite.
Treize états ciblés après correction, à neuf largeurs, donnent 117 cas sans débordement horizontal global et 26 analyses Axe sans violation détectée. Les panneaux médias, contacts, modification d’activité, partage sur site, coût exceptionnel, menu et méthodes de sécurité font partie de ce complément.
Le nom long ne chevauche plus le tarif aux cinq largeurs reprises ; le champ entreprise à 1 024 px passe de 140 à 307 px. Les sept pages publiques exposent une image de partage PNG accessible, tout en restant en `noindex`.
Les relevés et captures après correction sont dans [la contre-vérification](/workspace/artifacts/audit-responsive-seo-2026-11-20/contre-verification/manifest.json).
Le rapport distingue la campagne initiale complète des contrôles ciblés après correction. Les éventuelles limites restantes sont listées ci-dessus.
Ces changements sont locaux à la branche de travail ; aucun déploiement Vercel ni ouverture du référencement n’a été effectué pour cet audit.
