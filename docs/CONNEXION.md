# Connexion et récupération du mot de passe

Les champs de connexion, d’inscription et de nouveau mot de passe proposent une icône œil. Chaque champ reste masqué au chargement. Son bouton affiche ou masque uniquement ce champ, conserve la saisie et ne soumet pas le formulaire. Il est utilisable au clavier, possède un nom accessible et indique son état avec `aria-pressed`.

Sur `/connexion`, **Mot de passe oublié ?** apparaît sous le mot de passe, avant le bouton de connexion. Sur `/mot-de-passe-oublie`, saisir l’e-mail du compte puis demander le lien. Le message reste identique pour une adresse inconnue : il ne révèle pas les comptes existants.

Le lien reçu permet de choisir et de confirmer un nouveau mot de passe sur `/nouveau-mot-de-passe`. Better Auth contrôle le jeton et invalide les anciennes sessions après une réinitialisation réussie. Un lien absent exige une nouvelle demande ; le mot de passe doit comporter au moins 12 caractères. Ces mécanismes existaient déjà avant l’ajout du bouton œil.

La livraison des liens nécessite la configuration Resend serveur et un expéditeur autorisé. Le mode de test Resend reste soumis à ses restrictions de destinataires ; ces changements d’interface ne valident pas un domaine d’envoi.

Validation : tests PostgreSQL du changement de mot de passe, du refus de l’ancien mot de passe et de la révocation des sessions ; tests Chromium de l’œil sur les trois formulaires, de l’indépendance des deux champs, du clavier, de la conservation de saisie, du parcours de demande sur adresse fictive inconnue et du message pour un lien absent. Aucun e-mail réel n’est envoyé par ces tests.
