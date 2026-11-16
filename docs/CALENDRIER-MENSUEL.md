# Calendrier mensuel — 16 novembre 2026

Le calendrier partagé par les organisateurs et les participants propose désormais une vue « Mois ».

- Sur ordinateur : boutons « Semaine », « Journée » et « Mois ».
- Sur mobile : menu « Journée » ou « Mois » ; la semaine reste représentée par la bande de sept jours dans la vue détaillée.
- Les flèches parcourent les mois en respectant les bornes des séances disponibles.
- Une grille continue, du lundi au dimanche, conserve la surface de verre et les couleurs d’activité. Le jour actuel reste éclairé indépendamment du mois consulté.
- Sur ordinateur, chaque jour montre jusqu’à deux aperçus et le nombre total de séances ; sur mobile, il montre les repères de couleur et le nombre. Toutes les séances restent accessibles en ouvrant la journée.
- Cliquer une date ouvre ses horaires et place le focus clavier sur cette journée. Le participant choisit ensuite un créneau ; ouvrir une autre date efface l’ancien choix pour éviter une réservation involontaire.
- Les lumières des séances terminées ou annulées restent éteintes dans les aperçus mensuels.

Les données proviennent des séances et des fenêtres de réservation existantes. Le tableau de bord ne coupe plus arbitrairement le calendrier à cinquante séances. Les regroupements par date sont calculés une fois par changement de données pour éviter de reparcourir les dates et fuseaux à chaque cellule.

Vérifications de cette version : `npm run verify` réussi (156 tests unitaires), compilation de production réussie, cinq tests d’intégration ciblés et douze tests navigateur réussis. Couverture : années bissextiles, changement d’année, fin à minuit, séances à cheval sur deux mois, plus de cinquante séances, isolation des organisations, navigation clavier, écrans de 320/390/1440 px, passage mois/journée et régressions du billet et des vues existantes.

Captures locales sur données fictives : `/workspace/artifacts/planning-month/`. Version sur la branche `feat/booking-clarity-and-confirmation`, sans nouvelle fusion ou publication Vercel.
