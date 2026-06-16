
// ============================================================
// CONFIG & DATA STORE
// ============================================================
const CATEGORIES = ['Carburant vehicule','Lavage vehicule','Electricite / charges','Fournitures bureau','Maintenance','Autre'];
const OBJ = {caM:12000000, caH:3000000, depMax:250000};

let DB = {
  sales:[
    {id:1,date:'2026-06-08',prod:'Coolant 33% (4x4L)',qty:1,priceType:'client',unitPrice:23000,remise:0,clientName:'--',amount:23000,note:''},
    {id:2,date:'2026-06-08',prod:'5W30 (4x5L)',qty:2,priceType:'client',unitPrice:21000,remise:0,clientName:'--',amount:42000,note:''},
    {id:3,date:'2026-06-08',prod:'10W40 (4x4L)',qty:2,priceType:'client',unitPrice:13200,remise:0,clientName:'--',amount:26400,note:''},
    {id:4,date:'2026-06-08',prod:'T-cross 4T (12x1L)',qty:5,priceType:'client',unitPrice:13800,remise:0,clientName:'--',amount:69000,note:''},
    {id:5,date:'2026-06-08',prod:'XDEO SAE 15W40 (4x5L)',qty:1,priceType:'client',unitPrice:12500,remise:0,clientName:'--',amount:12500,note:''},
    {id:6,date:'2026-06-08',prod:'XDEO SAE 50 (4x5L)',qty:3,priceType:'client',unitPrice:26400,remise:0,clientName:'--',amount:79200,note:''},
    {id:7,date:'2026-06-08',prod:'XDEO SAE 50 Seau 20L',qty:2,priceType:'grossiste',unitPrice:48500,remise:0,clientName:'GDM Sarl',amount:97000,note:''},
    {id:8,date:'2026-06-08',prod:'Vrac T-cross (par litre)',qty:5,priceType:'client',unitPrice:2500,remise:0,clientName:'--',amount:12500,note:''},
    {id:9,date:'2026-06-08',prod:'Reglement client',qty:1,priceType:'client',unitPrice:30000,remise:0,clientName:'GDM Sarl',amount:30000,note:'Reglement partiel'},
    {id:10,date:'2026-06-09',prod:'15W40 Alma Super (4x5L)',qty:3,priceType:'client',unitPrice:15000,remise:0,clientName:'--',amount:45000,note:''},
    {id:11,date:'2026-06-09',prod:'Brake Fluid DOT III 500mL',qty:1,priceType:'client',unitPrice:2500,remise:0,clientName:'--',amount:2500,note:''},
    {id:12,date:'2026-06-09',prod:'XDEO SAE 20W50 (4x5L)',qty:1,priceType:'client',unitPrice:12500,remise:0,clientName:'--',amount:12500,note:''},
    {id:13,date:'2026-06-09',prod:'10W40 (4x4L)',qty:4,priceType:'client',unitPrice:14000,remise:0,clientName:'--',amount:56000,note:''},
    {id:14,date:'2026-06-09',prod:'T-cross 4T (12x1L)',qty:2,priceType:'client',unitPrice:16500,remise:0,clientName:'--',amount:33000,note:''},
    {id:15,date:'2026-06-09',prod:'Vrac T-cross (par litre)',qty:3,priceType:'client',unitPrice:2500,remise:0,clientName:'--',amount:7500,note:''},
    {id:16,date:'2026-06-09',prod:'Reglement client',qty:1,priceType:'client',unitPrice:160000,remise:0,clientName:'GDM Sarl',amount:160000,note:''},
    {id:17,date:'2026-06-10',prod:'XDEO SAE 50 Fut 200L',qty:8,priceType:'grossiste',unitPrice:370000,remise:0,clientName:'GDM Sarl',amount:2960000,note:'Commande importante'},
    {id:18,date:'2026-06-10',prod:'Vrac T-cross (par litre)',qty:4,priceType:'client',unitPrice:2500,remise:0,clientName:'--',amount:10000,note:''},
    {id:19,date:'2026-06-11',prod:'5W30 (4x5L)',qty:1,priceType:'client',unitPrice:22000,remise:0,clientName:'--',amount:22000,note:''},
    {id:20,date:'2026-06-11',prod:'T-cross 4T (12x1L)',qty:1,priceType:'client',unitPrice:26400,remise:0,clientName:'--',amount:26400,note:''},
    {id:21,date:'2026-06-12',prod:'Vrac T-cross (par litre)',qty:4,priceType:'client',unitPrice:2500,remise:0,clientName:'--',amount:10000,note:''},
    {id:22,date:'2026-06-02',prod:'T-cross 4T (12x1L)',qty:5,priceType:'client',unitPrice:26400,remise:4000,clientName:'--',amount:128000,note:''},
    {id:23,date:'2026-06-02',prod:'XDEO SAE 50 (4x5L)',qty:3,priceType:'client',unitPrice:22000,remise:0,clientName:'--',amount:66000,note:''},
    {id:24,date:'2026-06-03',prod:'5W30 (4x5L)',qty:4,priceType:'client',unitPrice:22000,remise:0,clientName:'--',amount:88000,note:''},
    {id:25,date:'2026-06-04',prod:'XDEO SAE 50 Seau 20L',qty:4,priceType:'grossiste',unitPrice:43000,remise:0,clientName:'GDM Sarl',amount:172000,note:''},
    {id:26,date:'2026-06-05',prod:'10W40 (4x4L)',qty:4,priceType:'client',unitPrice:14000,remise:0,clientName:'--',amount:56000,note:''},
    {id:27,date:'2026-06-16',prod:'T-cross 4T (12x1L)',qty:4,priceType:'client',unitPrice:26400,remise:3000,clientName:'--',amount:102720,note:''},
    {id:28,date:'2026-06-17',prod:'5W30 (4x5L)',qty:2,priceType:'client',unitPrice:22000,remise:0,clientName:'--',amount:44000,note:''},
    {id:29,date:'2026-06-18',prod:'XDEO SAE 50 (4x5L)',qty:2,priceType:'client',unitPrice:22000,remise:4400,clientName:'--',amount:39600,note:''},
    {id:30,date:'2026-06-23',prod:'XDEO SAE 50 Fut 200L',qty:1,priceType:'grossiste',unitPrice:370000,remise:0,clientName:'GDM Sarl',amount:370000,note:''},
    {id:31,date:'2026-06-24',prod:'T-cross 4T (12x1L)',qty:5,priceType:'client',unitPrice:26400,remise:3600,clientName:'--',amount:128400,note:''},
    {id:32,date:'2026-06-25',prod:'XDEO SAE 50 Seau 20L',qty:2,priceType:'client',unitPrice:48500,remise:0,clientName:'--',amount:97000,note:''},
  ],
  depenses:[
    {id:1,date:'2026-06-08',cat:'Carburant vehicule',desig:'Carburant voiture',amount:33000,note:''},
    {id:2,date:'2026-06-08',cat:'Lavage vehicule',desig:'Lavage voiture',amount:2000,note:''},
    {id:3,date:'2026-06-12',cat:'Electricite / charges',desig:'Achat electricite AICED',amount:30000,note:''},
    {id:4,date:'2026-06-02',cat:'Carburant vehicule',desig:'Carburant livraison',amount:25000,note:''},
    {id:5,date:'2026-06-05',cat:'Electricite / charges',desig:'Facture electricite',amount:20000,note:''},
    {id:6,date:'2026-06-05',cat:'Lavage vehicule',desig:'Lavage',amount:3000,note:''},
    {id:7,date:'2026-06-16',cat:'Carburant vehicule',desig:'Carburant',amount:20000,note:''},
    {id:8,date:'2026-06-18',cat:'Electricite / charges',desig:'Electricite',amount:12000,note:''},
    {id:9,date:'2026-06-20',cat:'Lavage vehicule',desig:'Lavage voiture',amount:2000,note:''},
    {id:10,date:'2026-06-20',cat:'Fournitures bureau',desig:'Ramettes papier',amount:8000,note:''},
    {id:11,date:'2026-06-23',cat:'Carburant vehicule',desig:'Carburant',amount:30000,note:''},
    {id:12,date:'2026-06-25',cat:'Electricite / charges',desig:'Electricite',amount:22000,note:''},
    {id:13,date:'2026-06-27',cat:'Lavage vehicule',desig:'Lavage',amount:3000,note:''},
  ],
  clients:[
    {id:1,name:'GDM Sarl',cat:'grossiste',phone:'+228 90 00 11 22',email:'contact@gdm.tg',addr:'Lome, Agbalepedogan',priceType:'grossiste',solde:190000,note:'Grossiste principal'},
    {id:2,name:'Essi Kofi',cat:'client',phone:'+228 91 23 45 67',email:'',addr:'Lome, Hedzranawoe',priceType:'client',solde:0,note:''},
    {id:3,name:'Garage Auto Pro',cat:'mecanicien',phone:'+228 99 87 65 43',email:'',addr:'Lome, Adidogome',priceType:'mecanicien',solde:0,note:'Garage partenaire'},
    {id:4,name:'Dosseh Rene',cat:'coursier',phone:'+228 92 11 33 55',email:'',addr:'Lome, Be',priceType:'client',solde:0,note:'Coursier livraison'},
  ],
  produits:[
    {id:1,name:'XDEO SAE 50 Fut 200L',cond:'Fut 200L',pc:370000,pm:355000,pg:340000,unit:'fut',stock:12,alerte:2},
    {id:2,name:'T-cross 4T (12x1L)',cond:'Carton 12x1L',pc:26400,pm:25000,pg:23500,unit:'carton',stock:20,alerte:5},
    {id:3,name:'XDEO SAE 50 Seau 20L',cond:'Seau 20L',pc:48500,pm:46000,pg:43000,unit:'seau',stock:15,alerte:3},
    {id:4,name:'5W30 (4x5L)',cond:'Carton 4x5L',pc:22000,pm:21000,pg:19500,unit:'carton',stock:3,alerte:5},
    {id:5,name:'10W40 (4x4L)',cond:'Carton 4x4L',pc:14000,pm:13200,pg:12000,unit:'carton',stock:8,alerte:5},
    {id:6,name:'Vrac T-cross (par litre)',cond:'Litre',pc:2500,pm:2300,pg:2000,unit:'litre',stock:50,alerte:10},
    {id:7,name:'Coolant 33% (4x4L)',cond:'Carton 4x4L',pc:23000,pm:21500,pg:20000,unit:'carton',stock:7,alerte:3},
    {id:8,name:'Brake Fluid DOT III 500mL',cond:'Bouteille 500mL',pc:2500,pm:2200,pg:1800,unit:'bouteille',stock:0,alerte:5},
    {id:9,name:'XDEO SAE 15W40 (4x5L)',cond:'Carton 4x5L',pc:12500,pm:11800,pg:10500,unit:'carton',stock:10,alerte:3},
    {id:10,name:'XDEO SAE 20W50 (4x5L)',cond:'Carton 4x5L',pc:22000,pm:21000,pg:19000,unit:'carton',stock:6,alerte:3},
    {id:11,name:'15W40 Alma Super (4x5L)',cond:'Carton 4x5L',pc:15000,pm:14000,pg:12500,unit:'carton',stock:9,alerte:3},
    {id:12,name:'Turbo CH-4 SAE 15W40 (6x5L)',cond:'Carton 6x5L',pc:20000,pm:19000,pg:17500,unit:'carton',stock:5,alerte:3},
    {id:13,name:'Reglement client',cond:'--',pc:0,pm:0,pg:0,unit:'--',stock:999,alerte:0},
  ],
  nextId:200, clientFilter:''
};

let editingSaleId=null, editingDepId=null, statPeriod='week';
let chartInstances={};

// WEEK_DATA & MONTH_DATA for static reports
const WEEK_DATA={
  'S2-2026-06':{label:'S2 -- 08/06 au 12/06/2026',ca:3739000,dep:65000,net:3674000,jours:5,objCA:4000000,
    days:[{d:'Lun 08/06',ca:391600,dep:35000},{d:'Mar 09/06',ca:316500,dep:0},{d:'Mer 10/06',ca:2970000,dep:0},{d:'Jeu 11/06',ca:50900,dep:0},{d:'Ven 12/06',ca:10000,dep:30000}],
    depenses:[{d:'08/06',des:'Carburant voiture',amt:33000},{d:'08/06',des:'Lavage voiture',amt:2000},{d:'12/06',des:'Electricite AICED',amt:30000}],
    prodSynth:[{n:'XDEO SAE 50 Fut 200L',qte:8,ca:2960000},{n:'Reglements clients',qte:2,ca:190000},{n:'T-cross 4T (12x1L)',qte:7,ca:128400},{n:'XDEO SAE 50 Seau 20L',qte:2,ca:97000},{n:'XDEO SAE 50 (4x5L)',qte:3,ca:79200},{n:'10W40 (4x4L)',qte:5,ca:82400},{n:'5W30 (4x5L)',qte:3,ca:64000},{n:'Vrac T-cross',qte:16,ca:42500},{n:'Autres',qte:5,ca:95500}]},
  'S1-2026-06':{label:'S1 -- 02/06 au 06/06/2026',ca:2850000,dep:48000,net:2802000,jours:5,objCA:3000000,
    days:[{d:'Lun 02/06',ca:520000,dep:25000},{d:'Mar 03/06',ca:340000,dep:0},{d:'Mer 04/06',ca:890000,dep:0},{d:'Jeu 05/06',ca:750000,dep:0},{d:'Ven 06/06',ca:350000,dep:23000}],
    depenses:[{d:'02/06',des:'Carburant livraison',amt:25000},{d:'06/06',des:'Electricite',amt:20000},{d:'06/06',des:'Lavage',amt:3000}]},
  'S4-2026-05':{label:'S4 -- 26/05 au 30/05/2026',ca:2420000,dep:55000,net:2365000,jours:5,objCA:3000000,
    days:[{d:'Lun 26/05',ca:580000,dep:28000},{d:'Mar 27/05',ca:410000,dep:0},{d:'Mer 28/05',ca:720000,dep:0},{d:'Jeu 29/05',ca:510000,dep:12000},{d:'Ven 30/05',ca:200000,dep:15000}],
    depenses:[{d:'26/05',des:'Carburant',amt:28000},{d:'29/05',des:'Electricite',amt:12000},{d:'30/05',des:'Fournitures',amt:15000}]},
  'S3-2026-05':{label:'S3 -- 19/05 au 23/05/2026',ca:1980000,dep:42000,net:1938000,jours:5,objCA:3000000,
    days:[{d:'Lun 19/05',ca:390000,dep:20000},{d:'Mar 20/05',ca:280000,dep:0},{d:'Mer 21/05',ca:890000,dep:0},{d:'Jeu 22/05',ca:320000,dep:12000},{d:'Ven 23/05',ca:100000,dep:10000}],
    depenses:[{d:'19/05',des:'Carburant',amt:20000},{d:'22/05',des:'Electricite',amt:12000},{d:'23/05',des:'Lavage',amt:10000}]},
  'S2-2026-05':{label:'S2 -- 12/05 au 16/05/2026',ca:3120000,dep:60000,net:3060000,jours:5,objCA:3000000,
    days:[{d:'Lun 12/05',ca:680000,dep:32000},{d:'Mar 13/05',ca:440000,dep:0},{d:'Mer 14/05',ca:1200000,dep:0},{d:'Jeu 15/05',ca:580000,dep:15000},{d:'Ven 16/05',ca:220000,dep:13000}],
    depenses:[{d:'12/05',des:'Carburant',amt:32000},{d:'15/05',des:'Electricite',amt:15000},{d:'16/05',des:'Divers',amt:13000}]},
  'S1-2026-05':{label:'S1 -- 05/05 au 09/05/2026',ca:2280000,dep:38000,net:2242000,jours:5,objCA:3000000,
    days:[{d:'Lun 05/05',ca:480000,dep:18000},{d:'Mar 06/05',ca:350000,dep:0},{d:'Mer 07/05',ca:820000,dep:0},{d:'Jeu 08/05',ca:430000,dep:10000},{d:'Ven 09/05',ca:200000,dep:10000}],
    depenses:[{d:'05/05',des:'Carburant',amt:18000},{d:'08/05',des:'Electricite',amt:10000},{d:'09/05',des:'Lavage',amt:10000}]}
};

const MONTH_DATA={
  '2026-06':{label:'Juin 2026',ca:10399000,dep:210000,net:10189000,objCA:12000000,
    weeks:[{s:'S1',p:'02-06/06',ca:2850000,dep:48000,net:2802000},{s:'S2',p:'08-12/06',ca:3739000,dep:65000,net:3674000},{s:'S3',p:'16-20/06',ca:1620000,dep:42000,net:1578000},{s:'S4',p:'23-27/06',ca:2190000,dep:55000,net:2135000}],
    topProds:[{n:'XDEO SAE 50 Fut 200L',ca:3330000},{n:'T-cross 4T (12x1L)',ca:487920},{n:'XDEO SAE 50 Seau 20L',ca:339500},{n:'XDEO SAE 50 (4x5L)',ca:277200},{n:'10W40 (4x4L)',ca:276800}],
    depByCat:[{cat:'Carburant vehicule',amt:108000},{cat:'Electricite / charges',amt:92000},{cat:'Lavage vehicule',amt:10000}]},
  '2026-05':{label:'Mai 2026',ca:9800000,dep:195000,net:9605000,objCA:12000000,
    weeks:[{s:'S1',p:'05-09/05',ca:2280000,dep:38000,net:2242000},{s:'S2',p:'12-16/05',ca:3120000,dep:60000,net:3060000},{s:'S3',p:'19-23/05',ca:1980000,dep:42000,net:1938000},{s:'S4',p:'26-30/05',ca:2420000,dep:55000,net:2365000}],
    topProds:[{n:'XDEO SAE 50 Fut 200L',ca:2960000},{n:'T-cross 4T (12x1L)',ca:460000},{n:'XDEO SAE 50 Seau 20L',ca:310000},{n:'5W30 (4x5L)',ca:240000},{n:'10W40 (4x4L)',ca:260000}],
    depByCat:[{cat:'Carburant vehicule',amt:98000},{cat:'Electricite / charges',amt:79000},{cat:'Lavage vehicule',amt:18000}]},
  '2026-04':{label:'Avril 2026',ca:8750000,dep:180000,net:8570000,objCA:12000000,
    weeks:[{s:'S1',p:'07-11/04',ca:2100000,dep:42000,net:2058000},{s:'S2',p:'14-18/04',ca:2850000,dep:50000,net:2800000},{s:'S3',p:'22-25/04',ca:1800000,dep:38000,net:1762000},{s:'S4',p:'28-30/04',ca:2000000,dep:50000,net:1950000}],
    topProds:[{n:'XDEO SAE 50 Fut 200L',ca:2600000},{n:'T-cross 4T (12x1L)',ca:425000},{n:'XDEO SAE 50 Seau 20L',ca:290000},{n:'5W30 (4x5L)',ca:220000},{n:'10W40 (4x4L)',ca:230000}],
    depByCat:[{cat:'Carburant vehicule',amt:90000},{cat:'Electricite / charges',amt:72000},{cat:'Lavage vehicule',amt:18000}]},
  '2026-03':{label:'Mars 2026',ca:9200000,dep:200000,net:9000000,objCA:12000000,
    weeks:[{s:'S1',p:'03-07/03',ca:2200000,dep:48000,net:2152000},{s:'S2',p:'10-14/03',ca:3000000,dep:55000,net:2945000},{s:'S3',p:'17-21/03',ca:2100000,dep:45000,net:2055000},{s:'S4',p:'24-28/03',ca:1900000,dep:52000,net:1848000}],
    topProds:[{n:'XDEO SAE 50 Fut 200L',ca:2800000},{n:'T-cross 4T (12x1L)',ca:450000},{n:'XDEO SAE 50 Seau 20L',ca:320000},{n:'5W30 (4x5L)',ca:250000},{n:'10W40 (4x4L)',ca:270000}],
    depByCat:[{cat:'Carburant vehicule',amt:102000},{cat:'Electricite / charges',amt:80000},{cat:'Lavage vehicule',amt:18000}]},
  '2026-02':{label:'Fevrier 2026',ca:7800000,dep:165000,net:7635000,objCA:12000000,
    weeks:[{s:'S1',p:'02-06/02',ca:1900000,dep:40000,net:1860000},{s:'S2',p:'09-13/02',ca:2500000,dep:48000,net:2452000},{s:'S3',p:'16-20/02',ca:1800000,dep:38000,net:1762000},{s:'S4',p:'23-27/02',ca:1600000,dep:39000,net:1561000}],
    topProds:[{n:'XDEO SAE 50 Fut 200L',ca:2200000},{n:'T-cross 4T (12x1L)',ca:400000},{n:'XDEO SAE 50 Seau 20L',ca:280000},{n:'5W30 (4x5L)',ca:200000},{n:'10W40 (4x4L)',ca:220000}],
    depByCat:[{cat:'Carburant vehicule',amt:82000},{cat:'Electricite / charges',amt:68000},{cat:'Lavage vehicule',amt:15000}]},
  '2026-01':{label:'Janvier 2026',ca:8100000,dep:172000,net:7928000,objCA:12000000,
    weeks:[{s:'S1',p:'05-09/01',ca:2000000,dep:43000,net:1957000},{s:'S2',p:'12-16/01',ca:2600000,dep:50000,net:2550000},{s:'S3',p:'19-23/01',ca:1900000,dep:40000,net:1860000},{s:'S4',p:'26-30/01',ca:1600000,dep:39000,net:1561000}],
    topProds:[{n:'XDEO SAE 50 Fut 200L',ca:2400000},{n:'T-cross 4T (12x1L)',ca:420000},{n:'XDEO SAE 50 Seau 20L',ca:300000},{n:'5W30 (4x5L)',ca:210000},{n:'10W40 (4x4L)',ca:240000}],
    depByCat:[{cat:'Carburant vehicule',amt:88000},{cat:'Electricite / charges',amt:70000},{cat:'Lavage vehicule',amt:14000}]}
};

