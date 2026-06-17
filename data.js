// ============================================================
// DATA.JS — Mirr Oils
// Ce fichier ne contient plus les données dynamiques (ventes,
// dépenses, clients, produits). Elles sont chargées depuis
// data.json via storage.js (localStorage).
//
// Ce fichier garde :
//   • Les structures de rapport statiques (WEEK_DATA, MONTH_DATA)
//   • Les déclarations de variables globales (initialisées vides)
//   • La déclaration de CATEGORIES (peuplée par storage.js)
// ============================================================

// Catégories de dépenses — peuplées dynamiquement par storage.js
// Ne pas modifier ici : les valeurs initiales viennent de data.json
// IMPORTANT : déclaré avec `var` pour que CATEGORIES === window.CATEGORIES
// (storage.js remplit window.CATEGORIES). Avec `const`/`let` ce seraient
// deux variables distinctes et les catégories n'apparaîtraient pas.
var CATEGORIES = [];

// Objectifs — peuplés par storage.js depuis data.json
// `var` pour que OBJ === window.OBJ (voir CATEGORIES ci-dessus)
var OBJ = { caM: 12000000, caH: 3000000, depMax: 250000 };

// Coordonnées de l'entreprise (affichées sur les reçus / PDF, éditables en Paramètres)
var ENTREPRISE = {
  nom:    'Mirr Oils',
  slogan: 'Distribution Huiles Moteur & Lubrifiants',
  tel:    '+228 00 00 00 00',
  email:  'contact@mirroils.tg',
  adresse:'Lome, Togo',
  nif:    '',
  rccm:   ''
};

// Base de données en mémoire — peuplée par storage.js
// `var` (et non `let`) est ESSENTIEL : storage.js remplit `window.DB`, et
// avec `var` la variable globale DB et window.DB sont le MÊME objet. Avec
// `let`, DB resterait vide et la sauvegarde écraserait les données.
var DB = {
  sales:        [],
  depenses:     [],
  clients:      [],
  produits:     [],
  mouvements:   [],   // historique des mouvements de stock (réassorts, pertes)
  comptes:      [],   // moyens de trésorerie (caisse, Tmoney, Flooz, banque…)
  tresorerie:   [],   // mouvements de trésorerie MANUELS (dépôts, transferts, ajustements)
  clientTypes:  [],   // catégories de client (client, mécanicien, grossiste…) — éditables
  priceTypes:   [],   // catégories de prix (client, mécanicien, grossiste…) — éditables
  nextId:       200,
  clientFilter: ''
};

// Variables d'état UI
let editingSaleId  = null;
let editingDepId   = null;
let editingProdId  = null;
let statPeriod     = 'week';
let chartInstances = {};

// ============================================================
// RAPPORTS DYNAMIQUES
// Les anciens objets statiques WEEK_DATA / MONTH_DATA ont ete
// supprimes. Les rapports hebdomadaires et mensuels sont desormais
// calcules a la volee a partir des vraies ventes/depenses (DB)
// par computeWeekData() / computeMonthData() dans script.js.
// ============================================================
