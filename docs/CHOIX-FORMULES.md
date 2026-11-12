# Cartes et choix de formule

Mise à jour : le comparatif a été détaillé en 27 fonctionnalités et le paiement de test dispose
d’un récapitulatif consultable, sans encaissement. [Détail actuel](CADRES-ET-PARCOURS.md).

Les offres Liberté et Studio Pro utilisent une carte entière comme lien. Aucun bouton,
autre lien ni contrôle de formulaire n’est imbriqué dans ces cartes. Le comparatif détaillé
se déplie séparément, sans navigation. Les prix, frais et limites essentiels restent visibles.

Sur un écran de 390 pixels, les cartes sont passées de 488 et 532 pixels de haut à environ
225 et 254 pixels : une réduction de 54 % et 52 %. La hauteur suit le contenu et la largeur ;
aucun texte n’est coupé pour tenir dans une hauteur imposée.

## Parcours

| Action | Résultat |
| --- | --- |
| Choisir une carte sur l’accueil, sans connexion | Inscription avec le choix conservé ; lien vers la connexion existante |
| Passer de l’inscription à la connexion ou à la récupération de mot de passe | Le choix reste présent dans les liens et le retour de vérification/récupération |
| Se connecter sans espace possédé | Créer un espace, avec le choix conservé |
| Se connecter avec un seul espace possédé | Ouvrir « Ma formule » pour cet espace |
| Posséder plusieurs espaces | Choisir l’espace concerné ou en créer un nouveau |
| Créer un espace après avoir choisi Studio Pro | Ouvrir le récapitulatif et le choix mensuel/annuel ; l’espace reste en Liberté tant que Pro n’est pas confirmé |
| Cliquer une carte dans « Ma formule » | Ouvrir le détail du choix, sans débit ni modification de l’abonnement |

Seules les préférences `liberte` et `pro` sont acceptées. Les destinations sont construites
par l’application ; une URL ou un tableau transmis comme préférence est ignoré. Les listes
d’espaces et leurs rôles viennent de la session authentifiée. Le propriétaire conserve seul
les droits de souscription ; les contrôles serveur existants restent en vigueur.

## Souscription

Liberté reste la formule initiale, sans carte bancaire. Studio Pro propose 29 € chaque mois
ou 260 € en une fois pour un an. Le choix de la carte et celui de la périodicité n’activent
aucun droit Pro : le formulaire distinct prépare ensuite le paiement sécurisé. L’activation
effective conserve la confirmation serveur Stripe existante.

Sur la version de test, les périodicités peuvent être parcourues, mais la poursuite vers le
paiement est explicitement désactivée. Un appel direct à la commande de souscription est
également refusé par le serveur de test. Aucun nouveau prix Stripe, compte marchand,
abonnement, migration ou paiement réel n’est créé par cette livraison.

Un espace avec accès offert conserve cet accès. Le retour d’un abonnement payant vers
Liberté ouvre la confirmation de résiliation du renouvellement existante ; il ne provoque
aucune interruption immédiate de la période déjà payée.

## Vérifications

- TypeScript strict, ESLint, 89 tests unitaires et construction Next.js réussis.
- Recette navigateur complète : 73 parcours réussis en 2,9 minutes, incluant la navigation,
  les réservations, les justificatifs, l’administration et les cinq nouveaux parcours de choix.
- Les cinq scénarios ciblés ont été rejoués sur le build final après les derniers ajustements
  d’espacement et l’explication propre aux accès offerts : tous réussis.
- Cinq nouveaux parcours Chromium : cartes compactes/clavier, comparaison séparée,
  connexion et création réelle d’espace, choix entre plusieurs espaces possédés,
  transmission d’un retour de vérification interne et rejet des préférences forgées.
- Contrôles aux largeurs 320, 390, 768 et 1 440 pixels : pas de débordement horizontal,
  cartes accessibles et absence de commandes imbriquées.
- L’inscription du scénario de retour e-mail est interceptée pour examiner son URL de
  vérification, sans envoyer d’e-mail. La connexion et la création de l’espace utilisent
  les vraies routes et la base locale fictive. Aucun clic connecté hébergé ni paiement
  Stripe réel n’est certifié par ces essais locaux.

## Captures

Captures Chromium, comptes fictifs locaux :

- [Accueil avant](formules/avant.png)
- [Accueil compact sur mobile](formules/apres-mobile.png)
- [Accueil sur ordinateur](formules/apres-ordinateur.png)
- [Choix de périodicité dans Ma formule](formules/choix-pro-mobile.png)
