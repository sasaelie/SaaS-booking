# Rappel de formule : affichage selon la page

Le cadre « Formule Liberté » explique l’accès actif et offre un raccourci vers « Ma formule » depuis les autres pages de gestion. Sur cette destination, il répétait les informations des cartes et proposait un lien vers la page déjà ouverte.

Le rappel informatif est désormais retiré de « Ma formule », y compris après une navigation interne. Il reste présent sur les autres pages. Une suspension conserve son avertissement visible, même sur la page de formule. Les états détaillés et les informations de paiement de cette page restent affichés.

La visibilité suit le segment de navigation Next.js sans effet différé ni copie des données privées de l’organisation dans un nouveau composant client. Les contrôles serveur et les règles commerciales sont inchangés. Aucune migration n’est nécessaire.

Validation locale : types et lint conformes, 117 tests unitaires réussis, compilation réussie et quatre scénarios commerciaux navigateur réussis. Le scénario Liberté vérifie le raccourci depuis le tableau de bord, l’absence du rappel sur la destination et le maintien d’une alerte après suspension. La CI complète du commit à fusionner figure dans la demande de fusion.

[Capture mobile avec données fictives](formule-sans-doublon/mobile.png).
