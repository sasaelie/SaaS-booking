# Affinage après validation de la version à cadres fixes

La version validée est fusionnée dans `main` par la PR 18, commit `b7b482bb8d32c3ee1ef02112673d3ad0deb4a485`. Les contrôles complets du commit validé ont réussi. Cet affinage est préparé dans la branche `codex/animations-ciblees`.

## Repérage avant correction

Les grandes surfaces sont déjà fixes et le fondu croisé des photos fonctionne. Les animations restantes sont encore appliquées à des groupes trop larges : le formulaire avec ses boutons à chaque étape, le calendrier entier lors d’un choix d’horaire, les places disponibles même sans changement de quantité et le nom du rôle même lorsqu’il reste Organisateur.

| Élément repéré | Réglage ciblé |
| --- | --- |
| Boutons et liste des horaires | Restent visibles pendant sélection et confirmation ; le groupe change seulement lorsqu’on passe de la préparation au formulaire ou à une nouvelle activité |
| Semaine et titre du calendrier | Restent visibles pendant sélection et confirmation |
| Date de séance | Fondu seulement si la nouvelle séance tombe un autre jour ; samedi vers samedi et mardi vers mardi restent fixes |
| Heure de séance | Fondu uniquement quand l’horaire change |
| Disponibilités | Seul le nombre qui change s’anime ; le point reste fixe et le libellé n’est animé que si son singulier ou son pluriel change |
| Rôle de l’acteur | Organisateur reste fixe lors de la publication ; le rôle s’anime seulement lors du passage Organisateur/Client |
| Largeur du rôle | Un espace réservé maintient le début de la légende au même endroit lorsque Organisateur devient Client |
| Hauteur du calendrier | Les marges des enfants restent à l’intérieur de la zone réservée ; la publication ne modifie plus la hauteur du cadre de deux pixels |
| Identité de l’activité | Seuls les initiales et le nom changent avec l’activité ; le cadenas et « Page de réservation » restent visibles |
| Carte de l’activité | Les textes et le prix évoluent avec l’activité ; « Prix affiché, prix payé » reste fixe |
| Confirmation | Le texte change selon l’étape ; l’icône change seulement au passage à une réservation confirmée ou à une nouvelle activité |
| Photos et cadres | Conservent le comportement validé : cadres fixes et photo suivante superposée à une base opaque pendant deux secondes |

## Mise en œuvre

`demo-transitions.ts` compare les valeurs affichées avant et après chaque étape, plutôt que de déclencher indistinctement tous les effets. Les mêmes transitions sont utilisées pour la sortie et pour l’entrée. Une valeur identique produit un état `idle` sans animation. Les grands groupes ne sont animés que lorsque leur contenu change de nature : fiche de préparation, puis interface de réservation.

La durée validée reste une seconde en sortie et une seconde en entrée. Les horaires sélectionnés et le jour actif utilisent des transitions de couleur, de bordure ou d’opacité ; ils ne changent pas de position. La réduction des animations conserve son fonctionnement et les commandes restent utilisables au clavier et au toucher.

Deux parcours navigateur supplémentaires contrôlent les informations qui restent visibles lors de la sélection et de la réservation, puis le cas sportif qui change réellement de jour. Ils vérifient aussi l’opacité des parents, afin qu’un groupe ne puisse pas masquer indirectement les éléments supposés fixes.

## Vérification

TypeScript, ESLint, 126 tests unitaires, compilation Next.js optimisée et 20 parcours navigateur ciblés passent. Les contrôles couvrent WCAG A/AA, clavier, toucher, pause, réduction des animations et quatre largeurs (320, 390, 768 et 1440 px). Une capture de cycle complet en Chromium à 390 et 1440 px montre une hauteur constante du calendrier, sans image manquante, erreur JavaScript ni débordement horizontal. Le CLS observé sur ces deux captures est nul ; il s’agit d’une mesure locale du scénario, pas d’une garantie sur tous les appareils.
