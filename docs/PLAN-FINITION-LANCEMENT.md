# Mémoire — « fais la finition »

Consigne utilisateur enregistrée le 19 novembre 2026 : lorsque l’utilisateur demande
« fais la finition », reprendre les points ci-dessous, les décomposer en tâches
concrètes et les traiter étape par étape, avec vérification après chaque modification.
La présente demande sert à conserver ce plan ; elle ne lance pas ces opérations.

## Principes à conserver

- Repartir de l’état réel du code, des branches, des déploiements et des services.
  Les éléments décrits ici devront être revérifiés au moment de la finition.
- Conserver le design et les fonctionnalités validés ; ne pas réécrire l’application
  pour changer d’environnement.
- Tester le parcours du futur produit commercial : un organisateur doit récupérer
  son intégration depuis son compte, sans intervention manuelle du développeur.
- Le tarif publié vient de l’activité de l’organisateur, jamais d’un montant fixé
  pour un exemple. Le mode de règlement choisi doit également être conservé.
- Les billets déjà émis conservent le tarif de leur réservation.
- Les tests simulent les effets externes sans remplacer les tarifs par zéro.
  Un paiement simulé réussi doit être présenté comme tel, sans débit réel.
- Distinguer les travaux effectués, les contrôles réussis et les points encore ouverts.
  Demander les informations ou décisions manquantes sans inventer leur valeur.

## 1. État des lieux et parcours organisateur complet

- Identifier les versions réellement déployées et les écarts avec la branche cible.
- Vérifier création d’activité, tarif, créneaux, publication et intégration copiée
  depuis le compte organisateur, sur une page indépendante de tout site particulier.
- Terminer et vérifier la remontée des réservations de TEST publiques dans l’espace
  organisateur : ce point restait ouvert au moment de l’enregistrement du plan.
- Vérifier aussi le parcours autonome depuis un lien partagé sur les réseaux sociaux.
- En intégration, conserver le participant dans le site et lui permettre d’y revenir.

## 2. Paiements réels

- Raccorder les comptes et paramètres du prestataire retenu pour la production.
- Sélectionner le prestataire réel par la configuration serveur ; conserver le
  simulateur uniquement dans les environnements de test.
- Vérifier les notifications serveur du prestataire, les confirmations, les doubles
  notifications, les échecs, les annulations, les remboursements et les montants.
- Ne pas déduire la réussite du paiement de la seule page de retour du navigateur.

## 3. E-mails et récupération du billet

- Raccorder le service d’envoi et authentifier le domaine d’expédition.
- Conserver la saisie des coordonnées avant le paiement et l’enregistrement de la
  réservation en attente ; envoyer le billet après confirmation serveur du paiement.
- Envoyer le billet et le lien personnel de gestion même si le participant ferme
  sa page après le paiement.
- Vérifier les échecs d’envoi et les nouvelles tentatives sans doublons incontrôlés.
- Vérifier ou finaliser « Renvoyer mon billet » à l’adresse utilisée pour réserver,
  sans rendre la réservation accessible à quelqu’un qui connaît seulement cette adresse.
- Ne pas ajouter de bloc de connexion participant au calendrier sans nouvelle demande.
  L’utilisateur a retenu l’e-mail comme moyen principal de retrouver son billet.

## 4. Base de production et données

- Préparer et vérifier la base de production, les migrations et les droits d’accès.
- Déterminer avec l’utilisateur quelles configurations doivent être reprises ; ne pas
  transformer les réservations fictives ou leurs paiements simulés en opérations réelles.
- Vérifier l’isolation des organisations et les accès par code/lien participant.
- Configurer les sauvegardes et vérifier la restauration et le retour arrière.

## 5. Domaine officiel et liens

- Raccorder le domaine choisi et vérifier HTTPS ainsi que les adresses autorisées.
- Vérifier les pages publiques, les liens de réservation, les intégrations, les
  e-mails et les destinations des QR codes sur ce domaine.
- Vérifier les conséquences pour les méthodes de connexion liées au domaine,
  notamment les clés d’accès biométriques administrateur.

## 6. Exploitation et protections

- Configurer les traitements automatiques nécessaires : envois, nouvelles tentatives,
  expirations, opérations de paiement et autres tâches réellement présentes dans le code.
- Vérifier leur exécution, la surveillance des erreurs et les protections d’accès.
- Conserver les secrets côté serveur et vérifier que la production utilise ses propres
  paramètres, sans les restrictions ou identifiants fictifs du TEST public.

## 7. Validation finale et ouverture

- Exécuter les contrôles requis par AGENTS.md et les tests adaptés à chaque changement.
- Vérifier les interfaces et le parcours complet sur mobile et ordinateur.
- Vérifier création, réservation, paiement, billet, e-mail, reconnexion par code,
  gestion, annulation/report et visibilité organisateur.
- Tester la fermeture de la page après paiement et la récupération du billet ;
  le participant ne doit pas devoir payer à nouveau.
- Préparer une vérification réelle contrôlée avec les paramètres et autorisations
  nécessaires avant une ouverture large ; un test simulé ne valide pas le prestataire réel.
- Fournir un compte rendu : réalisé, preuves de vérification, points bloquants et
  décisions restantes. Ne pas déclarer le lancement prêt si un parcours essentiel manque.
