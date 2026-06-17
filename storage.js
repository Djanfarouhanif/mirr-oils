// ============================================================
// STORAGE.JS — Mirr Oils
// Persistance JSON : localStorage + import/export data.json
// ============================================================

const STORAGE_KEY = 'mirroils_db';
const API_SAVE    = '/api/save';   // route serveur qui écrit data.json
let _serverWarned = false;         // évite de spammer le toast hors-ligne

/**
 * Envoie les données au serveur local pour qu'il les écrive dans data.json.
 * Fire-and-forget : si le serveur est absent, on garde la sauvegarde locale.
 * @param {Object} data
 */
async function persistToServer(data) {
  try {
    const res = await fetch(API_SAVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    _serverWarned = false;
    console.log('[Storage] data.json mis à jour côté serveur');
  } catch (e) {
    if (!_serverWarned) {
      console.warn('[Storage] Serveur injoignable — sauvegarde locale seulement :', e.message);
      if (typeof toast === 'function') toast('Serveur hors-ligne : data.json non mis à jour', 'error');
      _serverWarned = true;
    }
  }
}

/**
 * LECTURE : charge les données depuis localStorage.
 * Si vide, fetch data.json et l'enregistre comme base initiale.
 * @returns {Promise<Object>} données complètes de l'application
 */
async function storageLoad() {
  // Source de vérité = le fichier data.json servi par le serveur.
  // On le lit en priorité (avec anti-cache) pour refléter l'état réel du fichier.
  try {
    const res = await fetch('data.json?t=' + new Date().getTime());
    if (res.ok) {
      const data = await res.json();
      data.meta = data.meta || {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));   // cache local
      console.log('[Storage] Données chargées depuis data.json (serveur)');
      return data;
    }
  } catch (e) {
    console.warn('[Storage] Serveur injoignable, lecture du cache localStorage :', e.message);
  }

  // Fallback hors-ligne : dernier état connu en localStorage
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      console.log('[Storage] Données chargées depuis le cache localStorage');
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Storage] Cache localStorage corrompu');
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  throw new Error('Aucune donnée disponible (ni serveur, ni cache local)');
}

/**
 * Charge data.json depuis le serveur et l'enregistre dans localStorage.
 * @returns {Promise<Object>}
 */
async function storageFetchDefault() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('data.json introuvable');
    const data = await res.json();
    data.meta = data.meta || {};
    data.meta.lastSaved = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('[Storage] data.json chargé et enregistré dans localStorage');
    return data;
  } catch (e) {
    console.error('[Storage] Impossible de charger data.json :', e);
    throw e;
  }
}

/**
 * ÉCRITURE : sauvegarde l'objet complet dans localStorage.
 * Met à jour meta.lastSaved automatiquement.
 * @param {Object} data - objet DB complet
 */
function storageSave(data) {
  data.meta = data.meta || {};
  data.meta.lastSaved = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateSaveIndicator(data.meta.lastSaved);
    persistToServer(data);   // écrit aussi dans le fichier data.json
  } catch (e) {
    console.error('[Storage] Erreur sauvegarde localStorage :', e);
    if (typeof toast === 'function') toast('Erreur de sauvegarde !', 'error');
  }
}

/**
 * UPDATE partiel : modifie un champ précis et sauvegarde.
 * @param {string} collection - 'sales' | 'depenses' | 'clients' | 'produits' | 'objectifs' | 'categories'
 * @param {*} value - nouvelle valeur
 * @param {Object} data - référence à l'objet DB
 */
function storageUpdate(collection, value, data) {
  data[collection] = value;
  storageSave(data);
}

/**
 * UPDATE un enregistrement par id dans une collection.
 * @param {string} collection - nom de la collection
 * @param {number} id - id de l'enregistrement
 * @param {Object} updatedRecord - nouvelles valeurs (merge)
 * @param {Object} data - référence à l'objet DB
 * @returns {boolean} succès
 */
function storageUpdateById(collection, id, updatedRecord, data) {
  const idx = data[collection].findIndex(r => r.id === id);
  if (idx < 0) { console.warn(`[Storage] id=${id} introuvable dans ${collection}`); return false; }
  data[collection][idx] = { ...data[collection][idx], ...updatedRecord };
  storageSave(data);
  return true;
}

/**
 * AJOUT d'un enregistrement dans une collection.
 * Assigne automatiquement un id depuis data.nextId.
 * @param {string} collection - nom de la collection
 * @param {Object} record - enregistrement sans id
 * @param {Object} data - référence à l'objet DB
 * @returns {Object} enregistrement avec id assigné
 */
function storageAdd(collection, record, data) {
  const newRecord = { ...record, id: data.nextId++ };
  data[collection].unshift(newRecord);
  storageSave(data);
  return newRecord;
}

/**
 * SUPPRESSION d'un enregistrement par id.
 * @param {string} collection - nom de la collection
 * @param {number} id - id à supprimer
 * @param {Object} data - référence à l'objet DB
 * @returns {boolean} succès
 */
function storageDelete(collection, id, data) {
  const before = data[collection].length;
  data[collection] = data[collection].filter(r => r.id !== id);
  const deleted = data[collection].length < before;
  if (deleted) storageSave(data);
  return deleted;
}

/**
 * EXPORT : télécharge les données actuelles en tant que data.json.
 * @param {Object} data - objet DB complet
 */
function storageExportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json';
  a.click();
  URL.revokeObjectURL(url);
  if (typeof toast === 'function') toast('data.json exporté !', 'success');
}

/**
 * IMPORT : charge un data.json depuis un fichier sélectionné par l'utilisateur.
 * Remplace les données dans localStorage et recharge l'app.
 */
function storageImportJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Validation minimale
      if (!parsed.sales || !parsed.depenses || !parsed.produits) {
        throw new Error('Fichier JSON invalide : collections manquantes');
      }
      parsed.meta = parsed.meta || {};
      parsed.meta.lastSaved = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      await persistToServer(parsed);   // écrit le fichier importé dans data.json
      if (typeof toast === 'function') toast('Import réussi ! Rechargement...', 'success');
      setTimeout(() => location.reload(), 1200);
    } catch (err) {
      console.error('[Storage] Import échoué :', err);
      if (typeof toast === 'function') toast('Fichier JSON invalide', 'error');
    }
  };
  input.click();
}

/**
 * RESET : supprime localStorage et recharge depuis data.json.
 */
async function storageReset() {
  if (!confirm('Réinitialiser toutes les données depuis data.json ? Cette action est irréversible.')) return;
  localStorage.removeItem(STORAGE_KEY);
  await storageFetchDefault();
  if (typeof toast === 'function') toast('Données réinitialisées !', 'success');
  setTimeout(() => location.reload(), 1000);
}

/**
 * Affiche la date de dernière sauvegarde dans l'indicateur UI (si présent).
 * @param {string} isoDate
 */
function updateSaveIndicator(isoDate) {
  const el = document.getElementById('lastSavedLabel');
  if (!el) return;
  const d = new Date(isoDate);
  el.textContent = 'Sauvegardé à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ============================================================
// INIT ASYNCHRONE — remplace l'init synchrone de data.js
// Charge les données et lance l'application
// ============================================================
async function initStorage() {
  try {
    const data = await storageLoad();

    // Injection dans les variables globales attendues par script.js
    window.DB = {
      sales:      data.sales      || [],
      depenses:   data.depenses   || [],
      clients:    data.clients    || [],
      produits:   data.produits   || [],
      mouvements: data.mouvements || [],
      comptes:    data.comptes     || [],
      tresorerie: data.tresorerie  || [],
      clientTypes:data.clientTypes || [],
      priceTypes: data.priceTypes  || [],
      objWeek:    data.objWeek     || {},
      objMonth:   data.objMonth    || {},
      nextId:     data.nextId      || 200,
      clientFilter: ''
    };

    // Objectifs : on part des défauts (data.js) et on applique ceux de data.json.
    // Une clé absente de data.json garde donc une valeur de repli valide.
    window.OBJ = Object.assign({}, window.OBJ, data.objectifs || {});

    // Coordonnées entreprise (même logique de fusion défauts + data.json)
    window.ENTREPRISE = Object.assign({}, window.ENTREPRISE, data.entreprise || {});

    // Mot de passe d'accès : data.json fait foi ; on met en cache dans localStorage
    window.APP_PWD = data.password || window.APP_PWD || '1234';
    try { localStorage.setItem('mirroils_pwd', window.APP_PWD); } catch (e) {}

    // Catégories de dépenses
    if (data.categories && data.categories.length) {
      // Vide et repopule le tableau global CATEGORIES
      window.CATEGORIES = window.CATEGORIES || [];
      window.CATEGORIES.length = 0;
      data.categories.forEach(c => window.CATEGORIES.push(c));
    }

    // Proxy pour synchroniser DB → storage automatiquement
    // (optionnel — les fonctions storageAdd/Update/Delete font l'essentiel)
    window._storageData = data; // référence complète pour export

    console.log('[Storage] DB initialisée :', {
      ventes: DB.sales.length,
      depenses: DB.depenses.length,
      clients: DB.clients.length,
      produits: DB.produits.length
    });

    // Lance l'init principale de script.js
    if (typeof appInit === 'function') {
      appInit();
    }

  } catch (e) {
    console.error('[Storage] Initialisation échouée :', e);
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;color:#c0392b">
        <h2>⚠ Impossible de charger les données</h2>
        <p>Vérifiez que <strong>data.json</strong> est accessible depuis le serveur.</p>
        <p style="font-size:12px;color:#999">${e.message}</p>
      </div>`;
  }
}

// L'app ne se charge/initialise QUE si l'utilisateur est authentifié (session < 1h).
// Sinon on attend le déverrouillage : tryUnlock() appellera window.startApp().
window.startApp = function () {
  if (window._appStarted) return;
  window._appStarted = true;
  initStorage();
};
(function () {
  try {
    const a = localStorage.getItem('mirroils_auth');
    if (a && (Date.now() - parseInt(a, 10)) < 3600000) window.startApp();
  } catch (e) {}
})();
