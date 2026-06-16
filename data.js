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

// Base de données en mémoire — peuplée par storage.js
// `var` (et non `let`) est ESSENTIEL : storage.js remplit `window.DB`, et
// avec `var` la variable globale DB et window.DB sont le MÊME objet. Avec
// `let`, DB resterait vide et la sauvegarde écraserait les données.
var DB = {
  sales:        [],
  depenses:     [],
  clients:      [],
  produits:     [],
  nextId:       200,
  clientFilter: ''
};

// Variables d'état UI
let editingSaleId  = null;
let editingDepId   = null;
let statPeriod     = 'week';
let chartInstances = {};

// ============================================================
// DONNÉES STATIQUES : rapports hebdomadaires pré-calculés
// ============================================================
const WEEK_DATA = {
  'S2-2026-06': {
    label: 'S2 -- 08/06 au 12/06/2026', ca: 3739000, dep: 65000, net: 3674000, jours: 5, objCA: 4000000,
    days: [
      {d:'Lun 08/06', ca:391600, dep:35000},
      {d:'Mar 09/06', ca:316500, dep:0},
      {d:'Mer 10/06', ca:2970000, dep:0},
      {d:'Jeu 11/06', ca:50900, dep:0},
      {d:'Ven 12/06', ca:10000, dep:30000}
    ],
    depenses: [
      {d:'08/06', des:'Carburant voiture', amt:33000},
      {d:'08/06', des:'Lavage voiture', amt:2000},
      {d:'12/06', des:'Electricite AICED', amt:30000}
    ],
    prodSynth: [
      {n:'XDEO SAE 50 Fut 200L', qte:8, ca:2960000},
      {n:'Reglements clients', qte:2, ca:190000},
      {n:'T-cross 4T (12x1L)', qte:7, ca:128400},
      {n:'XDEO SAE 50 Seau 20L', qte:2, ca:97000},
      {n:'XDEO SAE 50 (4x5L)', qte:3, ca:79200},
      {n:'10W40 (4x4L)', qte:5, ca:82400},
      {n:'5W30 (4x5L)', qte:3, ca:64000},
      {n:'Vrac T-cross', qte:16, ca:42500},
      {n:'Autres', qte:5, ca:95500}
    ]
  },
  'S1-2026-06': {
    label: 'S1 -- 02/06 au 06/06/2026', ca: 2850000, dep: 48000, net: 2802000, jours: 5, objCA: 3000000,
    days: [
      {d:'Lun 02/06', ca:520000, dep:25000},
      {d:'Mar 03/06', ca:340000, dep:0},
      {d:'Mer 04/06', ca:890000, dep:0},
      {d:'Jeu 05/06', ca:750000, dep:0},
      {d:'Ven 06/06', ca:350000, dep:23000}
    ],
    depenses: [
      {d:'02/06', des:'Carburant livraison', amt:25000},
      {d:'06/06', des:'Electricite', amt:20000},
      {d:'06/06', des:'Lavage', amt:3000}
    ]
  },
  'S4-2026-05': {
    label: 'S4 -- 26/05 au 30/05/2026', ca: 2420000, dep: 55000, net: 2365000, jours: 5, objCA: 3000000,
    days: [
      {d:'Lun 26/05', ca:580000, dep:28000},
      {d:'Mar 27/05', ca:410000, dep:0},
      {d:'Mer 28/05', ca:720000, dep:0},
      {d:'Jeu 29/05', ca:510000, dep:12000},
      {d:'Ven 30/05', ca:200000, dep:15000}
    ],
    depenses: [
      {d:'26/05', des:'Carburant', amt:28000},
      {d:'29/05', des:'Electricite', amt:12000},
      {d:'30/05', des:'Fournitures', amt:15000}
    ]
  },
  'S3-2026-05': {
    label: 'S3 -- 19/05 au 23/05/2026', ca: 1980000, dep: 42000, net: 1938000, jours: 5, objCA: 3000000,
    days: [
      {d:'Lun 19/05', ca:390000, dep:20000},
      {d:'Mar 20/05', ca:280000, dep:0},
      {d:'Mer 21/05', ca:890000, dep:0},
      {d:'Jeu 22/05', ca:320000, dep:12000},
      {d:'Ven 23/05', ca:100000, dep:10000}
    ],
    depenses: [
      {d:'19/05', des:'Carburant', amt:20000},
      {d:'22/05', des:'Electricite', amt:12000},
      {d:'23/05', des:'Lavage', amt:10000}
    ]
  },
  'S2-2026-05': {
    label: 'S2 -- 12/05 au 16/05/2026', ca: 3120000, dep: 60000, net: 3060000, jours: 5, objCA: 3000000,
    days: [
      {d:'Lun 12/05', ca:680000, dep:32000},
      {d:'Mar 13/05', ca:440000, dep:0},
      {d:'Mer 14/05', ca:1200000, dep:0},
      {d:'Jeu 15/05', ca:580000, dep:15000},
      {d:'Ven 16/05', ca:220000, dep:13000}
    ],
    depenses: [
      {d:'12/05', des:'Carburant', amt:32000},
      {d:'15/05', des:'Electricite', amt:15000},
      {d:'16/05', des:'Divers', amt:13000}
    ]
  },
  'S1-2026-05': {
    label: 'S1 -- 05/05 au 09/05/2026', ca: 2280000, dep: 38000, net: 2242000, jours: 5, objCA: 3000000,
    days: [
      {d:'Lun 05/05', ca:480000, dep:18000},
      {d:'Mar 06/05', ca:350000, dep:0},
      {d:'Mer 07/05', ca:820000, dep:0},
      {d:'Jeu 08/05', ca:430000, dep:10000},
      {d:'Ven 09/05', ca:200000, dep:10000}
    ],
    depenses: [
      {d:'05/05', des:'Carburant', amt:18000},
      {d:'08/05', des:'Electricite', amt:10000},
      {d:'09/05', des:'Lavage', amt:10000}
    ]
  }
};

const MONTH_DATA = {
  '2026-06': {
    label: 'Juin 2026', ca: 10399000, dep: 210000, net: 10189000, objCA: 12000000,
    weeks: [
      {s:'S1', p:'02-06/06', ca:2850000, dep:48000, net:2802000},
      {s:'S2', p:'08-12/06', ca:3739000, dep:65000, net:3674000},
      {s:'S3', p:'16-20/06', ca:1620000, dep:42000, net:1578000},
      {s:'S4', p:'23-27/06', ca:2190000, dep:55000, net:2135000}
    ],
    topProds: [
      {n:'XDEO SAE 50 Fut 200L', ca:3330000},
      {n:'T-cross 4T (12x1L)', ca:487920},
      {n:'XDEO SAE 50 Seau 20L', ca:339500},
      {n:'XDEO SAE 50 (4x5L)', ca:277200},
      {n:'10W40 (4x4L)', ca:276800}
    ],
    depByCat: [
      {cat:'Carburant vehicule', amt:108000},
      {cat:'Electricite / charges', amt:92000},
      {cat:'Lavage vehicule', amt:10000}
    ]
  },
  '2026-05': {
    label: 'Mai 2026', ca: 9800000, dep: 195000, net: 9605000, objCA: 12000000,
    weeks: [
      {s:'S1', p:'05-09/05', ca:2280000, dep:38000, net:2242000},
      {s:'S2', p:'12-16/05', ca:3120000, dep:60000, net:3060000},
      {s:'S3', p:'19-23/05', ca:1980000, dep:42000, net:1938000},
      {s:'S4', p:'26-30/05', ca:2420000, dep:55000, net:2365000}
    ],
    topProds: [
      {n:'XDEO SAE 50 Fut 200L', ca:2960000},
      {n:'T-cross 4T (12x1L)', ca:460000},
      {n:'XDEO SAE 50 Seau 20L', ca:310000},
      {n:'5W30 (4x5L)', ca:240000},
      {n:'10W40 (4x4L)', ca:260000}
    ],
    depByCat: [
      {cat:'Carburant vehicule', amt:98000},
      {cat:'Electricite / charges', amt:79000},
      {cat:'Lavage vehicule', amt:18000}
    ]
  },
  '2026-04': {
    label: 'Avril 2026', ca: 8750000, dep: 180000, net: 8570000, objCA: 12000000,
    weeks: [
      {s:'S1', p:'07-11/04', ca:2100000, dep:42000, net:2058000},
      {s:'S2', p:'14-18/04', ca:2850000, dep:50000, net:2800000},
      {s:'S3', p:'22-25/04', ca:1800000, dep:38000, net:1762000},
      {s:'S4', p:'28-30/04', ca:2000000, dep:50000, net:1950000}
    ],
    topProds: [
      {n:'XDEO SAE 50 Fut 200L', ca:2600000},
      {n:'T-cross 4T (12x1L)', ca:425000},
      {n:'XDEO SAE 50 Seau 20L', ca:290000},
      {n:'5W30 (4x5L)', ca:220000},
      {n:'10W40 (4x4L)', ca:230000}
    ],
    depByCat: [
      {cat:'Carburant vehicule', amt:90000},
      {cat:'Electricite / charges', amt:72000},
      {cat:'Lavage vehicule', amt:18000}
    ]
  },
  '2026-03': {
    label: 'Mars 2026', ca: 9200000, dep: 200000, net: 9000000, objCA: 12000000,
    weeks: [
      {s:'S1', p:'03-07/03', ca:2200000, dep:48000, net:2152000},
      {s:'S2', p:'10-14/03', ca:3000000, dep:55000, net:2945000},
      {s:'S3', p:'17-21/03', ca:2100000, dep:45000, net:2055000},
      {s:'S4', p:'24-28/03', ca:1900000, dep:52000, net:1848000}
    ],
    topProds: [
      {n:'XDEO SAE 50 Fut 200L', ca:2800000},
      {n:'T-cross 4T (12x1L)', ca:450000},
      {n:'XDEO SAE 50 Seau 20L', ca:320000},
      {n:'5W30 (4x5L)', ca:250000},
      {n:'10W40 (4x4L)', ca:270000}
    ],
    depByCat: [
      {cat:'Carburant vehicule', amt:102000},
      {cat:'Electricite / charges', amt:80000},
      {cat:'Lavage vehicule', amt:18000}
    ]
  },
  '2026-02': {
    label: 'Fevrier 2026', ca: 7800000, dep: 165000, net: 7635000, objCA: 12000000,
    weeks: [
      {s:'S1', p:'02-06/02', ca:1900000, dep:40000, net:1860000},
      {s:'S2', p:'09-13/02', ca:2500000, dep:48000, net:2452000},
      {s:'S3', p:'16-20/02', ca:1800000, dep:38000, net:1762000},
      {s:'S4', p:'23-27/02', ca:1600000, dep:39000, net:1561000}
    ],
    topProds: [
      {n:'XDEO SAE 50 Fut 200L', ca:2200000},
      {n:'T-cross 4T (12x1L)', ca:400000},
      {n:'XDEO SAE 50 Seau 20L', ca:280000},
      {n:'5W30 (4x5L)', ca:200000},
      {n:'10W40 (4x4L)', ca:220000}
    ],
    depByCat: [
      {cat:'Carburant vehicule', amt:82000},
      {cat:'Electricite / charges', amt:68000},
      {cat:'Lavage vehicule', amt:15000}
    ]
  },
  '2026-01': {
    label: 'Janvier 2026', ca: 8100000, dep: 172000, net: 7928000, objCA: 12000000,
    weeks: [
      {s:'S1', p:'05-09/01', ca:2000000, dep:43000, net:1957000},
      {s:'S2', p:'12-16/01', ca:2600000, dep:50000, net:2550000},
      {s:'S3', p:'19-23/01', ca:1900000, dep:40000, net:1860000},
      {s:'S4', p:'26-30/01', ca:1600000, dep:39000, net:1561000}
    ],
    topProds: [
      {n:'XDEO SAE 50 Fut 200L', ca:2400000},
      {n:'T-cross 4T (12x1L)', ca:420000},
      {n:'XDEO SAE 50 Seau 20L', ca:300000},
      {n:'5W30 (4x5L)', ca:210000},
      {n:'10W40 (4x4L)', ca:240000}
    ],
    depByCat: [
      {cat:'Carburant vehicule', amt:88000},
      {cat:'Electricite / charges', amt:70000},
      {cat:'Lavage vehicule', amt:14000}
    ]
  }
};
