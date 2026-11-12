# Cadres en verre, sortie de session et compréhension des offres

## Retour vers l’accueil

Règle validée par le propriétaire : la confirmation concerne seulement la sortie de
« Mes espaces » vers l’accueil. Les retours entre activités, réglages, séances et espaces
ne ferment pas la session.

Le lien Retour, sur téléphone comme sur ordinateur, ouvre « Quitter Mes espaces ? ».
« Rester connecté » annule la sortie. « Me déconnecter » appelle le véritable endpoint
de fermeture de session avant de revenir à l’accueil. Un échec réseau est affiché et ne
fait pas croire que la session a été fermée.

Le bouton Retour du navigateur est également testé. Pour les retours entre documents,
une indication technique de provenance est conservée dans le stockage de session de
l’onglet. Elle ne contient ni jeton, ni identifiant de compte, ni donnée de participant.
Après annulation d’un retour natif, l’application rouvre Mes espaces ; elle ne modifie
pas les états internes de l’historique du routeur. Les contrôles d’accès serveur restent
indépendants de cette indication de navigation.

La fenêtre utilise un dialogue natif, avec titre accessible, focus initial en haut,
fermeture par Échap et commandes explicites. Une session déjà expirée ne peut pas être
réactivée par l’annulation de la sortie.

## Cadres et liens

Les surfaces neutres ont un fond translucide, un flou modéré de 8 pixels et un contour
lumineux diagonal. Les champs et dialogues gardent un fond plus calme pour le texte.
Les photos et couleurs des encarts d’activité sont préservées. Sans prise en charge du
flou, le fond reste suffisamment rempli. Le cadre décoratif ne reçoit aucun clic.

Les liens textuels n’utilisent plus de soulignement : texte soutenu et petit chevron
décoratif pour les liens simples. Les retours gardent leur flèche directionnelle. Les
chevrons CSS n’ajoutent pas de caractères au nom accessible. Les liens textuels n’ont
ni fond de bouton, ni ombre ; le focus clavier reste visible. Les boutons de formulaire
et les cartes entièrement cliquables conservent leur rôle distinct.

## Offres et paiement

Le comparatif comporte 27 lignes dans quatre catégories : activités et calendrier (5),
participants/e-mails/reports (6), paiements/comptabilité (8), partage/apparence/continuité (8).
Chaque ligne donne une explication et la disponibilité en Liberté et en Studio Pro.

Le contenu est recoupé avec les règles existantes : limite de deux activités réservables,
virement et règlement payant sans encaissement en ligne réservés à Pro, QR PNG/PDF et
export complets protégés côté serveur, et échange externe de code réservé à Pro.
Les références d’implémentation sont notamment `commercial-access.ts`,
`payment-configuration.ts`, `share.use-case.ts`, `drizzle-financial.repository.ts` et
`drizzle-voucher.repository.ts`. Les e-mails nécessitent l’expéditeur et le traitement
planifié configurés ; aucun hébergement vidéo n’est promis.

En recette, le choix mensuel/annuel ouvre maintenant un récapitulatif consultable :
29 € pour un mois ou 260 € pour un an. Un espace offert affiche explicitement zéro dû.
Ce récapitulatif ne poste aucune commande d’abonnement, ne crée aucun paiement et ne
modifie pas l’accès actuel. Il explique quand le passage sur Stripe intervient en service.

La configuration Preview a été vérifiée en ne lisant que les métadonnées :
`PAYMENTS_ENABLED=false`, aucune clé Stripe ni identifiant de prix mensuel/annuel
configuré. Cette livraison ne les active pas. Lorsque le paiement est activé et
configuré en service, le formulaire existant envoie toujours la périodicité au serveur
et ouvre le paiement sécurisé Stripe ; la confirmation Stripe reste requise pour Pro.

## Vérifications

- TypeScript, ESLint, 91 tests unitaires et build Next.js réussis.
- 83 parcours Chromium complets réussis en 3,4 minutes, dont six nouveaux scénarios.
- Après le dernier ajustement d’ancrage du cadre mobile, les six nouveaux scénarios ont
  été rejoués sur la construction finale : tous réussis. Les captures correspondent à celle-ci.
- Sortie approuvée et annulée sur mobile/ordinateur, retour natif, échec de déconnexion,
  récapitulatifs mensuel/annuel sans commande financière et accès offert sans modification.
- Comparatif aux largeurs 320, 390, 768 et 1 440 pixels : pas de débordement horizontal.
  Vérification des liens sans soulignement/fond et du cadre sans interception de clics.
- Comptes, réservations et images fictifs sur la base locale isolée. Les paiements réels
  et les clics authentifiés sur Vercel ne sont pas certifiés par ces captures locales.

## Captures réelles

- [Mes espaces sur téléphone](cadres-et-parcours/espaces-mobile.png)
- [Confirmation de sortie](cadres-et-parcours/confirmation-sortie.png)
- [Récapitulatif mensuel de test](cadres-et-parcours/recapitulatif-mensuel.png)
- [Première catégorie du comparatif sur mobile](cadres-et-parcours/comparatif-mobile.png)
