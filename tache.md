# Tache
<!-- stocker l'etas de la page dans localStorage -->
<!-- ajouter la section Stock puis les récuperer dynamiquement -->
<!-- gere côté raport dynamiquement -->
<!-- Corriger le format des chiffres sur le pdf -->
<!-- Gestion des produits, ajouter les images de chaque produit -->

<!-- Ajouter les statistiques de vente effectuer par client -->
<!-- FAIT : page Statistiques → "Top clients (CA)" + tableau "Ventes par client" (CA, nb ventes, ticket moyen, % CA) -->



<!-- Enregistrement d'une vente, ajouter le champ de moyen de paiement, un autre champ qui implique si la facture est payé ou pas -->
<!-- FAIT : champ "Moyen de paiement" (vCompte) + "Statut facture" payée/non payée (vStatut). Une vente non payée n'entre pas en trésorerie ; bouton "marquer payée" dans la liste. -->


<!-- Enregistrement d'une dépense, ajouter le champ de moyen de décaissement -->
<!-- FAIT : champ "Payé depuis" (id=dCompte) dans le formulaire Dépense -->


<!-- Ajouter un module de Trésorerie qui va gérer le montant en caisse, sur Tmoney, sur flooz, en banque, générer les mouvement de trésorerie. pouvoir créer, modifier et supprimer un moyen de trésorerie. la trésorerie qui enregistre automatiquement les entrées et sortie d'argent -->


<!-- Définir un mot de passe qui est nécessaire pour pouvoir accéder à la plateforme, pour faire une modification ou suppression on demande le mot de passe. ce mot de passe est configurable depuis le menu paramètre -->
<!-- FAIT : (1) Accès : écran de verrouillage au chargement, app non chargée tant que non authentifié, session 1h (localStorage mirroils_auth), mdp défaut 1234 stocké UNIQUEMENT dans data.json. (2) Configurable dans Paramètres → "Mot de passe d'accès" + "Verrouiller maintenant". (3) Modif/suppression : modal de confirmation par mot de passe (jeton usage-unique) en tête de 15 actions (delete/edit ventes, dépenses, clients, produits, comptes, mouvements, types, catégories, markSalePaid, réassort). -->


<!-- Possibilité ajouter, modifier et supprimer les type de client depuis MENU client -->
<!-- Possibilité ajouter, modifier et supprimer les type de prix depuis MENU client -->
<!-- FAIT : menu Client → bouton "Gérer les types" (modal) : CRUD types de client + types de prix. Onglets/compteurs et listes déroulantes dynamiques. Suppression bloquée si type utilisé. -->


<!-- Possibilité de définir les objectifs individuellement pour chaque semaine et chaque mois mais par défaut ça prend l'objectif définit par défaut de façon globale -->
<!-- FAIT : page Objectifs → tables "Suivi semaine/mois" avec Obj. CA éditable par ligne. Surcharge stockée (objWeek/objMonth) ; vide ou = global => repli sur objectif global. Reports utilisent ces valeurs. -->


<!-- Dans les options de paramètre ajouter le logo et le nom à afficher -->

<!-- Possibilité de faire des exports en excel -->
<!-- export format json import format json -->

<!-- Réinitialiser toutes les donner (mots de passe supper admin 7009) -->
<!-- FAIT : Paramètres → Données → bouton "Réinitialiser" (confirmation par mot de passe). Vide ventes/dépenses/clients/produits/mouvements/trésorerie + objectifs spécifiques, remet les soldes initiaux à 0. Conserve la structure data.json et la config (comptes, types, catégories, objectifs globaux, entreprise, mot de passe). NB : utilise le mot de passe d'accès, pas le 7009 (à préciser si voulu). -->
<!-- Gestion de stock -->
