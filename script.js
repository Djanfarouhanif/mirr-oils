// ============================================================
// UTILS
// ============================================================
const fmt  = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const fcfa = n => Math.round(n).toLocaleString('fr-FR') + ' FCFA';
const fmtD = iso => { if(!iso)return'--'; const p=iso.split('-'); return p[2]+'/'+p[1]; };
const ptL  = p => {
  // Libellé d'un type (client ou prix) — cherché dans les listes éditables, sinon repli
  const all=[...((window.DB&&DB.clientTypes)||[]),...((window.DB&&DB.priceTypes)||[])];
  const f=all.find(t=>t.key===p);
  if(f) return f.label;
  return ({client:'Client',mecanicien:'Mecanicien',grossiste:'Grossiste',coursier:'Coursier'}[p]||p);
};
const catBadge = c => {
  // Couleurs personnalisées du type (fond/bordure/texte) si définies, sinon classe par défaut
  const t=[...((window.DB&&DB.clientTypes)||[]),...((window.DB&&DB.priceTypes)||[])].find(x=>x.key===c);
  if(t && (t.bg||t.border||t.color)){
    return `<span class="badge" style="background:${t.bg||'transparent'};border:1px solid ${t.border||'transparent'};color:${t.color||'inherit'}">${ptL(c)}</span>`;
  }
  const m={client:'b-client',mecanicien:'b-meca',grossiste:'b-grossiste',coursier:'b-coursier'};
  return `<span class="badge ${m[c]||'b-default'}">${ptL(c)}</span>`;
};
const getP = (prod,type) => { if(!prod)return 0; return {client:prod.pc,mecanicien:prod.pm,grossiste:prod.pg}[type]||prod.pc||0; };
const hexRgba = (h,a) => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };

// Helper : synchronise DB.nextId vers _storageData puis sauvegarde
function _syncAndSave() {
  if (window._storageData) {
    window._storageData.sales      = DB.sales;
    window._storageData.depenses   = DB.depenses;
    window._storageData.clients    = DB.clients;
    window._storageData.produits   = DB.produits;
    window._storageData.mouvements = DB.mouvements;
    window._storageData.comptes    = DB.comptes;
    window._storageData.tresorerie = DB.tresorerie;
    window._storageData.clientTypes= DB.clientTypes;
    window._storageData.priceTypes = DB.priceTypes;
    window._storageData.objWeek    = DB.objWeek;
    window._storageData.objMonth   = DB.objMonth;
    window._storageData.nextId     = DB.nextId;
    window._storageData.objectifs = OBJ;
    window._storageData.entreprise = ENTREPRISE;
    window._storageData.password = APP_PWD;
    window._storageData.categories = [...CATEGORIES];
    storageSave(window._storageData);
  }

}

// ============================================================
// NAVIGATION
// ============================================================
const PAGE_KEY = 'mirroils_page';   // clé localStorage pour la page active
function navigate(page) {
  try { localStorage.setItem(PAGE_KEY, page); } catch(e) {}   // mémorise la page
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pe=document.getElementById('page-'+page);
  if(pe) pe.classList.add('active');
  const ne=document.querySelector(`.nav-item[data-page="${page}"]`);
  if(ne) ne.classList.add('active');
  const T={dashboard:'Tableau de bord',stats:'Statistiques',ventes:'Ventes',depenses:'Depenses',clients:'Repertoire clients',produits:'Catalogue produits',tresorerie:'Trésorerie',rapports:'Rapports',objectifs:'Objectifs',parametres:'Parametres'};
  document.getElementById('pageTitle').textContent = T[page]||page;
  if(page==='dashboard')  refreshDashboard();
  if(page==='stats')      refreshStats();
  if(page==='ventes')     { renderSales(); updateSaleStats(); }
  if(page==='depenses')   { renderDepenses(); updateDepStats(); }
  if(page==='clients')    { renderClients(); updateClientCounts(); }
  if(page==='produits')   renderProduits();
  if(page==='tresorerie') renderTresorerie();
  if(page==='rapports')   { populateReportSelectors(); loadWeekReport(); loadMonthReport(); }
  if(page==='objectifs' || page==='parametres') syncObjectifsUI();
  if(page==='parametres') syncEntrepriseUI();
}
document.querySelectorAll('.nav-item').forEach(i=>i.addEventListener('click',()=>navigate(i.dataset.page)));

// ============================================================
// SIDEBAR / THEME
// ============================================================
let sidebarOpen=true;
function toggleSidebar() {
  sidebarOpen=!sidebarOpen;
  document.getElementById('sidebar').classList.toggle('collapsed',!sidebarOpen);
  document.getElementById('sidebarIcon').className = sidebarOpen?'ti ti-layout-sidebar-left-collapse':'ti ti-layout-sidebar-right-collapse';
}
const THEME_KEY = 'mirroils_theme';   // clé localStorage pour le theme
const COLOR_KEY = 'mirroils_color';   // clé localStorage pour la couleur
function toggleTheme() { setTheme(document.body.dataset.theme==='dark'?'light':'dark'); }
function setTheme(t) {
  try { localStorage.setItem(THEME_KEY, t); } catch(e) {}   // memorise le theme
  document.body.dataset.theme=t;
  document.getElementById('themeSwitch').classList.toggle('on',t==='dark');
  const dk=document.getElementById('themeCardDark'), lk=document.getElementById('themeCardLight');
  if(dk) dk.style.border = t==='dark'?'2px solid var(--primary)':'1px solid var(--border)';
  if(lk) lk.style.border = t==='light'?'2px solid var(--primary)':'1px solid var(--border)';
  Object.values(chartInstances).forEach(c=>{try{c.destroy()}catch(e){}});
  chartInstances={};
  if(document.getElementById('page-stats').classList.contains('active')) refreshStats();
}
function setColor(el) {
  const c=el.dataset.c, cd=el.dataset.cd;
  try { localStorage.setItem(COLOR_KEY, JSON.stringify({c,cd})); } catch(e) {}   // memorise la couleur
  document.documentElement.style.setProperty('--primary',c);
  document.documentElement.style.setProperty('--primary-dark',cd||c);
  document.documentElement.style.setProperty('--primary-bg',hexRgba(c,.09));
  document.querySelectorAll('.color-swatch').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('customColorHex').value=c;
  document.getElementById('customColor').value=c;
  toast('Couleur appliquee','success');
}
function applyCustomColor() {
  const c=document.getElementById('customColor').value;
  try { localStorage.setItem(COLOR_KEY, JSON.stringify({c,cd:c})); } catch(e) {}   // memorise la couleur
  document.getElementById('customColorHex').value=c;
  document.documentElement.style.setProperty('--primary',c);
  document.documentElement.style.setProperty('--primary-dark',c);
  document.documentElement.style.setProperty('--primary-bg',hexRgba(c,.09));
  toast('Couleur appliquee','success');
}
document.getElementById('customColor').addEventListener('input',function(){document.getElementById('customColorHex').value=this.value});

// ============================================================
// MODALS
// ============================================================
function openModal(id) {
  const m=document.getElementById(id);
  if(!m) return;
  m.style.display='flex';
  setTimeout(()=>m.classList.add('open'),10);
  if(id==='modalVente' && !editingSaleId) {
    document.getElementById('vDate').value=new Date().toISOString().slice(0,10);
    ['vProd','vQty','vUnitPrice','vClientName','vNote'].forEach(x=>document.getElementById(x).value='');
    document.getElementById('vRemise').value='0';
    document.getElementById('vAmount').value='';
    document.getElementById('vPriceType').value='client';
    ['vTotalHint','vUnitHint','vPriceHint','vRemiseHint'].forEach(x=>document.getElementById(x).textContent='');
    const vc=document.getElementById('vCompte'); if(vc) vc.value=defaultCompteId();
    const vs=document.getElementById('vStatut'); if(vs) vs.value='paye';
  }
  if(id==='modalDepense' && !editingDepId) {
    document.getElementById('dDate').value=new Date().toISOString().slice(0,10);
    ['dCat','dDesig','dAmount','dNote'].forEach(x=>document.getElementById(x).value='');
    document.getElementById('dCat').value='';
    const dc=document.getElementById('dCompte'); if(dc) dc.value=defaultCompteId();
  }
  if(id==='modalProduit' && !editingProdId) {
    // Création : titre + champs vierges (sinon les valeurs d'une édition précédente persistent)
    const t=document.getElementById('prodModalTitle'); if(t) t.textContent='Nouveau produit';
    ['pName','pCond','pPM','pPG','pUnit','pAlerte'].forEach(x=>document.getElementById(x).value='');
    document.getElementById('pPC').value='';
    document.getElementById('pStock').value='0';
    clearProductPhoto();
  }
  if(id==='modalObjectif') {
    syncObjectifsUI();   // pré-remplit le formulaire avec les objectifs réels (data.json)
  }
}
function closeModal(id) {
  const m=document.getElementById(id);
  if(!m) return;
  m.classList.remove('open');
  setTimeout(()=>{m.style.display='none'},200);
  editingSaleId=null; editingDepId=null; editingProdId=null;
}
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));

// ============================================================
// TOASTS
// ============================================================
let toastN=0;
function toast(msg,type='info') {
  const icons={success:'ti-circle-check',error:'ti-circle-x',info:'ti-info-circle'};
  const id='t'+(++toastN);
  const el=document.createElement('div');
  el.className=`toast t-${type}`;el.id=id;
  el.innerHTML=`<i class="ti ${icons[type]||icons.info}"></i><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(()=>{const t=document.getElementById(id);if(t)t.remove()},3500);
}

// ============================================================
// DASHBOARD
// ============================================================
function getCurrentWeekRange() {
  const now=new Date(), day=now.getDay()||7;
  const mon=new Date(now); mon.setDate(now.getDate()-day+1);
  const fri=new Date(mon); fri.setDate(mon.getDate()+4);
  const toISO=d=>d.toISOString().slice(0,10);
  return{from:toISO(mon),to:toISO(fri),mon,fri};
}
let dashPriceType='client';
function setDashPriceType(type,el) {
  dashPriceType=type;
  document.querySelectorAll('[id^="dpill-"]').forEach(x=>x.classList.remove('active'));
  if(el) el.classList.add('active');
  renderProductBanner();
}
function getTodayISO() { return new Date().toISOString().slice(0,10); }
function refreshDashboard() {
  const today=getTodayISO();
  const dayNames=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const nowD=new Date();
  const el=document.getElementById('d-today-label');
  if(el) el.textContent=`${dayNames[nowD.getDay()]} ${fmtD(today)}`;
  const todaySales=window.DB.sales.filter(s=>s.date===today);
  const todayCA=todaySales.reduce((a,s)=>a+s.amount,0);
  const tcaEl=document.getElementById('d-today-ca');
  const ttxnEl=document.getElementById('d-today-txn');
  if(tcaEl) tcaEl.textContent=fcfa(todayCA);
  if(ttxnEl) ttxnEl.textContent=todaySales.length;
  const tbody=document.getElementById('todaySalesBody');
  const emptyEl=document.getElementById('todaySalesEmpty');
  if(tbody) {
    if(!todaySales.length) {
      tbody.innerHTML='';
      if(emptyEl) emptyEl.style.display='block';
    } else {
      if(emptyEl) emptyEl.style.display='none';
      tbody.innerHTML=todaySales.map(s=>{
        const sn=JSON.stringify(s.prod),scl=JSON.stringify(s.clientName),sd=JSON.stringify(fmtD(s.date));
        return`<tr>
          <td class="text-muted fs-11">—</td>
          <td>${s.prod.length>28?s.prod.slice(0,28)+'…':s.prod}</td>
          <td class="num">${s.qty}</td>
          <td>${catBadge(s.priceType)}</td>
          <td>${s.clientName!=='--'?s.clientName:'—'}</td>
          <td class="text-right num fw-600">${fcfa(s.amount)}</td>
          <td class="text-center" style="white-space:nowrap">
            <button class="btn btn-xs" onclick='showReceipt({prod:${sn},qty:${s.qty},priceType:"${s.priceType}",unitPrice:${s.unitPrice},remise:${s.remise||0},amount:${s.amount},clientName:${scl},date:${sd},compteId:${s.compteId||defaultCompteId()},statut:"${s.statut||'paye'}"})'><i class="ti ti-receipt"></i></button>
            <button class="btn btn-xs" onclick="editSale(${s.id})"><i class="ti ti-edit"></i></button>
            <button class="btn btn-xs btn-danger-outline" onclick="deleteSale(${s.id});refreshDashboard()"><i class="ti ti-trash"></i></button>
          </td>
        </tr>`;
      }).join('');
    }
  }
  renderProductBanner();
}
function renderProductBanner() {
  const b=document.getElementById('productBanner');
  if(!b) return;
  const pt=dashPriceType||'client';
  const priceKey={client:'pc',mecanicien:'pm',grossiste:'pg'}[pt]||'pc';
  b.innerHTML=window.DB.produits.filter(p=>p.name!=='Reglement client').map(p=>{
    const sc=p.stock===0?'dot-red':p.stock<=p.alerte?'dot-orange':'dot-green';
    const price=p[priceKey]||0;
    const icon=p.photo
      ? `<img src="${p.photo}" alt="" class="pc-icon" style="width:40px;height:40px;border-radius:8px;object-fit:cover">`
      : `<span class="pc-icon">&#128722;</span>`;
    return`<div class="product-card" style="cursor:pointer" onclick="showStockChart(${p.id})" title="Évolution du stock">
      <div class="pc-stock dot ${sc}"></div>
      ${icon}
      <div class="pc-name">${p.name}</div>
      <div class="pc-price">${fcfa(price)}</div>
      <div class="pc-cond">${p.cond}</div>
    </div>`;
  }).join('');
}

// ============================================================
// STATISTIQUES
// ============================================================
function setPeriod(p,el) {
  statPeriod=p;
  document.querySelectorAll('.period-pill').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  const show=p==='custom';
  document.getElementById('customRangeFrom').style.display=show?'flex':'none';
  document.getElementById('customRangeTo').style.display=show?'flex':'none';
  refreshStats();
}
function getStatRange() {
  const now=new Date(),y=now.getFullYear(),m=now.getMonth();
  if(statPeriod==='week'){
    const d=new Date(now),day=d.getDay()||7;
    d.setDate(d.getDate()-day+1);
    const d2=new Date(d); d2.setDate(d2.getDate()+6);
    return{from:d.toISOString().slice(0,10),to:d2.toISOString().slice(0,10)};
  } else if(statPeriod==='month') {
    return{from:`${y}-${String(m+1).padStart(2,'0')}-01`,to:now.toISOString().slice(0,10)};
  } else if(statPeriod==='quarter') {
    const q=Math.floor(m/3);
    return{from:`${y}-${String(q*3+1).padStart(2,'0')}-01`,to:now.toISOString().slice(0,10)};
  } else if(statPeriod==='year') {
    return{from:`${y}-01-01`,to:now.toISOString().slice(0,10)};
  } else {
    return{from:document.getElementById('statFrom').value||'2026-01-01',to:document.getElementById('statTo').value||now.toISOString().slice(0,10)};
  }
}
function refreshStats() {
  const {from,to}=getStatRange();
  const pt=document.getElementById('statType')?.value||'';
  const pp=document.getElementById('statProd')?.value||'';
  const grp=document.getElementById('statGroup')?.value||'week';
  let sales=window.DB.sales.filter(s=>s.date>=from&&s.date<=to);
  if(pt) sales=sales.filter(s=>s.priceType===pt);
  if(pp) sales=sales.filter(s=>s.prod===pp);
  let deps=window.DB.depenses.filter(d=>d.date>=from&&d.date<=to);
  const ca=sales.reduce((a,s)=>a+s.amount,0);
  const dep=deps.reduce((a,d)=>a+d.amount,0);
  const txn=sales.length;
  document.getElementById('sk-ca').textContent=fmt(ca);
  document.getElementById('sk-dep').textContent=fmt(dep);
  document.getElementById('sk-net').textContent=fmt(ca-dep);
  document.getElementById('sk-txn').textContent=txn;
  document.getElementById('sk-avg').textContent=fmt(txn?Math.round(ca/txn):0);
  const groups={},depGroups={};
  sales.forEach(s=>{
    let k=grp==='day'?s.date:grp==='month'?s.date.slice(0,7):s.date.slice(0,7);
    if(grp==='week'){const d=new Date(s.date),day=d.getDay()||7;d.setDate(d.getDate()-day+1);k=d.toISOString().slice(0,10);}
    if(!groups[k])groups[k]={ca:0,txn:0};
    groups[k].ca+=s.amount;groups[k].txn++;
  });
  deps.forEach(d=>{
    let k=grp==='day'?d.date:d.date.slice(0,7);
    if(grp==='week'){const dt=new Date(d.date),day=dt.getDay()||7;dt.setDate(dt.getDate()-day+1);k=dt.toISOString().slice(0,10);}
    depGroups[k]=(depGroups[k]||0)+d.amount;
  });
  const keys=[...new Set([...Object.keys(groups),...Object.keys(depGroups)])].sort();
  const labels=keys.map(k=>grp==='month'?monthLbl(k):grp==='day'?fmtD(k):('S '+k.slice(5,7)+'/'+k.slice(8,10)));
  const caVals=keys.map(k=>groups[k]?groups[k].ca:0);
  const depVals=keys.map(k=>depGroups[k]||0);
  buildChart('chartEvolution','line',labels,[
    {label:'CA',data:caVals,borderColor:'#C0392B',backgroundColor:'rgba(192,57,43,.1)',tension:.4,fill:true},
    {label:'Depenses',data:depVals,borderColor:'#E67E22',backgroundColor:'rgba(230,126,34,.08)',tension:.4,fill:true}
  ]);
  const tmap={};
  sales.forEach(s=>{tmap[s.priceType]=(tmap[s.priceType]||0)+s.amount});
  const tk=Object.keys(tmap);
  buildChart('chartClientType','doughnut',tk.map(ptL),[{data:tk.map(k=>tmap[k]),backgroundColor:['#C0392B','#27AE60','#E67E22','#8E44AD','#2980B9']}]);
  const pmap={};
  sales.forEach(s=>{pmap[s.prod]=(pmap[s.prod]||0)+s.amount});
  const ps=Object.entries(pmap).sort((a,b)=>b[1]-a[1]).slice(0,6);
  buildChart('chartTopProd','bar',ps.map(p=>p[0].length>18?p[0].slice(0,18)+'...':p[0]),[{label:'CA',data:ps.map(p=>p[1]),backgroundColor:'rgba(192,57,43,.75)',borderColor:'#C0392B',borderWidth:1}]);
  const dmap={};
  deps.forEach(d=>{dmap[d.cat]=(dmap[d.cat]||0)+d.amount});
  const dk=Object.keys(dmap);
  buildChart('chartDep','doughnut',dk,[{data:dk.map(k=>dmap[k]),backgroundColor:['#E67E22','#2980B9','#8E44AD','#27AE60','#C0392B','#1ABC9C']}]);
  // Ventes par client (les ventes sans client nommé sont regroupées sous « Comptoir »)
  const cmap={};
  sales.forEach(s=>{const n=(s.clientName&&s.clientName!=='--')?s.clientName:'Comptoir';if(!cmap[n])cmap[n]={ca:0,txn:0};cmap[n].ca+=s.amount;cmap[n].txn++;});
  const clientArr=Object.entries(cmap).map(([n,v])=>({n,ca:v.ca,txn:v.txn})).sort((a,b)=>b.ca-a.ca);
  const topC=clientArr.slice(0,6);
  buildChart('chartTopClients','bar',topC.map(c=>c.n.length>16?c.n.slice(0,16)+'...':c.n),[{label:'CA',data:topC.map(c=>c.ca),backgroundColor:'rgba(41,128,185,.75)',borderColor:'#2980B9',borderWidth:1}]);
  const totC=ca||1;
  document.getElementById('clientStatsBody').innerHTML=clientArr.length
    ? clientArr.map(c=>`<tr><td><strong>${c.n}</strong></td><td class="text-right num">${fmt(c.ca)}</td><td class="text-center">${c.txn}</td><td class="text-right num">${fmt(Math.round(c.ca/c.txn))}</td><td><div style="display:flex;align-items:center;gap:6px"><div class="progress-bar" style="flex:1"><div class="progress-fill pf-green" style="width:${Math.round(c.ca/totC*100)}%"></div></div><span class="fs-11">${Math.round(c.ca/totC*100)}%</span></div></td></tr>`).join('')
    : '<tr><td colspan="5" class="text-center text-muted" style="padding:16px">Aucune vente sur cette periode</td></tr>';
  const totalCA=caVals.reduce((a,b)=>a+b,0)||1;
  document.getElementById('statsTableBody').innerHTML=keys.map(k=>{
    const gc=groups[k]?groups[k].ca:0;const gd=depGroups[k]||0;const gt=groups[k]?groups[k].txn:0;
    return`<tr><td><strong>${grp==='month'?monthLbl(k):grp==='day'?fmtD(k):('S '+k.slice(5,7)+'/'+k.slice(8,10))}</strong></td><td class="text-right num text-success">${fmt(gc)}</td><td class="text-right num text-danger">${fmt(gd)}</td><td class="text-right num ${gc-gd>=0?'text-success':'text-danger'}">${fmt(gc-gd)}</td><td><div style="display:flex;align-items:center;gap:6px"><div class="progress-bar" style="flex:1"><div class="progress-fill pf-green" style="width:${Math.round(gc/totalCA*100)}%"></div></div><span class="fs-11">${Math.round(gc/totalCA*100)}%</span></div></td><td class="text-center">${gt}</td><td class="text-right num">${fmt(gt?Math.round(gc/gt):0)}</td></tr>`;
  }).join('')||'<tr><td colspan="7" class="text-center text-muted" style="padding:24px">Aucune donnee pour cette periode</td></tr>';
}
function monthLbl(k){const M=['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec'];const p=k.split('-');return M[parseInt(p[1])-1]+' '+p[0];}
function buildChart(id,type,labels,datasets) {
  const canvas=document.getElementById(id);
  if(!canvas)return;
  if(chartInstances[id]){try{chartInstances[id].destroy()}catch(e){}}
  const dark=document.body.dataset.theme==='dark';
  const tc=dark?'#A8A8A8':'#555',gc=dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';
  chartInstances[id]=new Chart(canvas,{
    type,data:{labels,datasets},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:type!=='line'&&type!=='bar',labels:{color:tc,font:{size:11},boxWidth:12}},
        tooltip:{callbacks:{label:ctx=>' '+fmt(ctx.parsed.y||ctx.parsed||0)+' XOF'}}},
      scales:type==='line'||type==='bar'?{x:{ticks:{color:tc,font:{size:10},maxRotation:30},grid:{color:gc}},y:{ticks:{color:tc,font:{size:10},callback:v=>fmt(v)},grid:{color:gc}}}:{}}
  });
}

// ============================================================
// VENTES — CRUD avec persistance JSON
// ============================================================
function fillProductOptions() {
  const sel=document.getElementById('vProd');
  if(!sel)return;
  const cur=sel.value;
  sel.innerHTML='<option value="">-- Selectionner --</option>'+window.DB.produits.map(p=>`<option value="${p.name}">${p.name}</option>`).join('');
  if(cur)sel.value=cur;
  const sp=document.getElementById('statProd');
  if(sp){sp.innerHTML='<option value="">Tous</option>'+window.DB.produits.map(p=>`<option value="${p.name}">${p.name}</option>`).join('');}
}
function fillPrice() {
  const pn=document.getElementById('vProd').value;
  const pt=document.getElementById('vPriceType').value;
  const prod=window.DB.produits.find(p=>p.name===pn);
  if(prod) {
    const price=getP(prod,pt);
    document.getElementById('vUnitPrice').value=price||'';
    document.getElementById('vUnitHint').textContent=(prod.cond?'Unite: '+prod.cond+' — ':'')+'Stock dispo: '+(prod.stock||0);
    document.getElementById('vPriceHint').textContent=`C:${fmt(prod.pc)} | M:${fmt(prod.pm)} | G:${fmt(prod.pg)}`;
  } else {
    document.getElementById('vUnitHint').textContent='';
    document.getElementById('vPriceHint').textContent='';
  }
  calcSaleTotal();
}
function calcSaleTotal() {
  const qty=parseFloat(document.getElementById('vQty').value)||0;
  const unit=parseFloat(document.getElementById('vUnitPrice').value)||0;
  const rem=parseFloat(document.getElementById('vRemise').value)||0;
  const sub=qty*unit;
  const total=Math.max(0,sub-rem);
  if(qty&&unit) {
    document.getElementById('vAmount').value=total;
    document.getElementById('vTotalHint').textContent=`${qty} x ${fmt(unit)}${rem?' - '+fmt(rem)+' (remise)':''} = ${fmt(total)} XOF`;
    document.getElementById('vRemiseHint').textContent=rem?`Sous-total: ${fmt(sub)} XOF`:'';
  } else {
    document.getElementById('vTotalHint').textContent='';
  }
}

/**
 * Ajuste le stock d'un produit (par son nom) d'une quantité donnée.
 * delta négatif = sortie de stock (vente) ; positif = retour en stock.
 * Sans effet si le produit n'existe pas (ex. « Reglement client », « Autres »).
 * @param {string} prodName
 * @param {number} delta
 */
function adjustStock(prodName, delta) {
  const p = window.DB.produits.find(x => x.name === prodName);
  if (!p) return;
  p.stock = (p.stock || 0) + delta;
}

/** SAVE VENTE — CREATE ou UPDATE + persistance JSON */
function saveSale() {
  const date=document.getElementById('vDate').value;
  const prod=document.getElementById('vProd').value;
  const qty=parseFloat(document.getElementById('vQty').value)||0;
  const pt=document.getElementById('vPriceType').value;
  const unit=parseFloat(document.getElementById('vUnitPrice').value)||0;
  const rem=parseFloat(document.getElementById('vRemise').value)||0;
  const amt=parseFloat(document.getElementById('vAmount').value)||0;
  const cli=document.getElementById('vClientName').value||document.getElementById('vClient').value||'--';
  const note=document.getElementById('vNote').value;
  const compteId=parseInt(document.getElementById('vCompte').value)||defaultCompteId();   // moyen de paiement
  const statut=document.getElementById('vStatut').value||'paye';                          // payée / non payée
  if(!prod||!amt){toast('Produit et montant obligatoires','error');return false;}

  // Contrôle de stock : interdit de vendre plus que le stock disponible
  const prodObj=window.DB.produits.find(p=>p.name===prod);
  if(prodObj){
    let dispo=prodObj.stock||0;
    if(editingSaleId){
      const oldS=window.DB.sales.find(s=>s.id===editingSaleId);
      if(oldS && oldS.prod===prod) dispo+=oldS.qty;   // l'ancienne quantité est déjà déduite du stock
    }
    if(qty>dispo){
      toast(`Stock insuffisant : il reste ${dispo} en stock pour ${prod}`,'error');
      return false;
    }
  }

  if(editingSaleId) {
    // UPDATE
    const idx=window.DB.sales.findIndex(s=>s.id===editingSaleId);
    if(idx>=0) {
      const old=window.DB.sales[idx];
      adjustStock(old.prod, old.qty);   // on remet l'ancienne quantité en stock...
      adjustStock(prod, -qty);          // ...puis on retire la nouvelle (gère changement de produit/qté)
      window.DB.sales[idx]={...old,date,prod,qty,priceType:pt,unitPrice:unit,remise:rem,clientName:cli,amount:amt,note,compteId,statut};
    }
    _syncAndSave();
    toast('Vente modifiee et sauvegardee','success');
  } else {
    // CREATE
    adjustStock(prod, -qty);            // sortie de stock
    window.DB.sales.unshift({id:window.DB.nextId++,date,prod,qty,priceType:pt,unitPrice:unit,remise:rem,clientName:cli,amount:amt,note,compteId,statut});
    _syncAndSave();
    toast('Vente enregistree !','success');
  }
  editingSaleId=null; closeModal('modalVente'); renderSales(); updateSaleStats(); renderProduits(); refreshDashboard();
  return true;
}

function saveAndReceipt() {
  const prod=document.getElementById('vProd').value;
  const qty=parseFloat(document.getElementById('vQty').value)||0;
  const unit=parseFloat(document.getElementById('vUnitPrice').value)||0;
  const rem=parseFloat(document.getElementById('vRemise').value)||0;
  const amt=parseFloat(document.getElementById('vAmount').value)||0;
  const cli=document.getElementById('vClientName').value||document.getElementById('vClient').value||'--';
  const pt=document.getElementById('vPriceType').value;
  const date=document.getElementById('vDate').value;
  const compteId=parseInt(document.getElementById('vCompte').value)||defaultCompteId();
  const statut=document.getElementById('vStatut').value||'paye';
  // N'affiche le reçu que si la vente a bien été enregistrée (sinon : stock insuffisant, etc.)
  if(saveSale()) showReceipt({prod,qty,priceType:pt,unitPrice:unit,remise:rem,amount:amt,clientName:cli,date:fmtD(date),compteId,statut});
}

function showReceipt(s) {
  // En-tête entreprise (depuis la config ENTREPRISE)
  const E=window.ENTREPRISE||{};
  document.getElementById('rCompany').textContent=(E.nom||'Mirr Oils').toUpperCase();
  document.getElementById('rSlogan').textContent=E.slogan||'';
  document.getElementById('rAddr').textContent=E.adresse||'';
  document.getElementById('rTel').textContent=E.tel||'';

  document.getElementById('rNum').textContent='MO-'+new Date().getFullYear()+'-'+String(window.DB.nextId).padStart(4,'0');
  document.getElementById('rDate').textContent=s.date||'--';
  document.getElementById('rProd').textContent=s.prod||'--';
  document.getElementById('rQty').textContent=s.qty||'--';
  document.getElementById('rUnit').textContent=fmt(s.unitPrice||0)+' XOF';
  document.getElementById('rType').textContent=ptL(s.priceType);
  document.getElementById('rClient').textContent=s.clientName||'--';

  // Téléphone du client (recherché dans le répertoire par son nom)
  const cliObj=(s.clientName&&s.clientName!=='--')?window.DB.clients.find(c=>c.name===s.clientName):null;
  const phLine=document.getElementById('rClientPhoneLine');
  if(cliObj && cliObj.phone){phLine.style.display='flex';document.getElementById('rClientPhone').textContent=cliObj.phone;}
  else phLine.style.display='none';

  // Moyen de paiement
  document.getElementById('rMoyen').textContent = s.compteId ? compteName(s.compteId) : compteName(defaultCompteId());

  document.getElementById('rTotal').textContent=fmt(s.amount)+' XOF';
  const subtotal=(parseFloat(s.qty)||0)*(parseFloat(s.unitPrice)||0);
  const rl=document.getElementById('rRemiseLine'), rsl=document.getElementById('rSubtotalLine');
  if(s.remise&&s.remise>0){
    rsl.style.display='flex';
    document.getElementById('rSubtotal').textContent=fmt(subtotal)+' XOF';
    rl.style.display='flex';
    document.getElementById('rRemise').textContent='-'+fmt(s.remise)+' XOF';
  } else {
    rsl.style.display='none'; rl.style.display='none';
  }

  // Statut + reste à payer
  const paye=(s.statut||'paye')==='paye';
  const st=document.getElementById('rStatut');
  st.textContent=paye?'PAYÉE':'NON PAYÉE';
  st.style.color=paye?'#1E8449':'#c00';
  const resteLine=document.getElementById('rResteLine');
  if(!paye){resteLine.style.display='flex';document.getElementById('rReste').textContent=fmt(s.amount)+' XOF';}
  else resteLine.style.display='none';

  // Pied de page : merci + coordonnées
  const foot=['Merci pour votre confiance !'];
  const l2=[E.tel,E.email].filter(Boolean).join(' -- '); if(l2) foot.push(l2);
  const l3=[E.nif?'NIF: '+E.nif:'',E.rccm?'RCCM: '+E.rccm:''].filter(Boolean).join(' -- '); if(l3) foot.push(l3);
  document.getElementById('rFooter').innerHTML=foot.join('<br>');

  openModal('modalRecu');
}

function editSale(id) {
  const s=window.DB.sales.find(x=>x.id===id); if(!s)return;
  editingSaleId=id; openModal('modalVente');
  setTimeout(()=>{
    document.getElementById('vDate').value=s.date;
    document.getElementById('vProd').value=s.prod;
    document.getElementById('vPriceType').value=s.priceType;
    document.getElementById('vQty').value=s.qty;
    document.getElementById('vUnitPrice').value=s.unitPrice;
    document.getElementById('vRemise').value=s.remise||0;
    document.getElementById('vAmount').value=s.amount;
    document.getElementById('vClientName').value=s.clientName!=='--'?s.clientName:'';
    document.getElementById('vNote').value=s.note;
    document.getElementById('vCompte').value=s.compteId||defaultCompteId();
    document.getElementById('vStatut').value=s.statut||'paye';
    calcSaleTotal();
  },60);
}

/** Marque une vente (facture) comme payée et met à jour la trésorerie. */
function markSalePaid(id) {
  const s=window.DB.sales.find(x=>x.id===id); if(!s)return;
  s.statut='paye';
  _syncAndSave();
  renderSales(); updateSaleStats(); refreshDashboard(); toast('Facture marquée payée','success');
}

/** DELETE VENTE + persistance JSON */
function deleteSale(id) {
  if(!confirm('Supprimer cette vente ?'))return;
  const s=window.DB.sales.find(x=>x.id===id);
  if(s) adjustStock(s.prod, s.qty);   // la vente est annulée → on restitue le stock
  window.DB.sales=window.DB.sales.filter(s=>s.id!==id);
  _syncAndSave();
  renderSales(); updateSaleStats(); renderProduits(); refreshDashboard(); toast('Vente supprimee','success');
}

function renderSales() {
  const fd=document.getElementById('fDate').value;
  const ft=document.getElementById('fType').value;
  const fs=(document.getElementById('fSearch').value||'').toLowerCase();
  const dates=[...new Set(window.DB.sales.map(s=>s.date))].sort().reverse();
  const fds=document.getElementById('fDate'), cv=fds.value;
  fds.innerHTML='<option value="">Toutes les dates</option>'+dates.map(d=>`<option value="${d}">${fmtD(d)}</option>`).join('');
  if(cv)fds.value=cv;
  let rows=window.DB.sales.filter(s=>(!fd||s.date===fd)&&(!ft||s.priceType===ft)&&(!fs||s.prod.toLowerCase().includes(fs)||s.clientName.toLowerCase().includes(fs)));
  const empty=document.getElementById('salesEmpty'), tbody=document.getElementById('salesBody');
  if(!rows.length){tbody.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  tbody.innerHTML=rows.map(s=>{
    const sn=JSON.stringify(s.prod),scl=JSON.stringify(s.clientName),sd=JSON.stringify(fmtD(s.date));
    const paye=(s.statut||'paye')==='paye';
    const statutCell=paye
      ? '<span class="badge b-success">Payée</span>'
      : `<span class="badge b-danger">Non payée</span> <button class="btn btn-xs" onclick="markSalePaid(${s.id})" title="Marquer comme payée"><i class="ti ti-check"></i></button>`;
    return`<tr><td>${fmtD(s.date)}</td><td>${s.prod}</td><td class="num">${s.qty}</td><td>${catBadge(s.priceType)}</td><td class="num ${s.remise>0?'text-warning':''}">${s.remise>0?'-'+fmt(s.remise):'--'}</td><td>${s.clientName!=='--'?s.clientName:'--'}</td><td class="text-right num fw-600">${fmt(s.amount)}</td><td style="white-space:nowrap">${statutCell}</td>
    <td class="text-center" style="white-space:nowrap">
      <button class="btn btn-xs" onclick='showReceipt({prod:${sn},qty:${s.qty},priceType:"${s.priceType}",unitPrice:${s.unitPrice},remise:${s.remise||0},amount:${s.amount},clientName:${scl},date:${sd},compteId:${s.compteId||defaultCompteId()},statut:"${s.statut||'paye'}"})'><i class="ti ti-receipt"></i></button>
      <button class="btn btn-xs" onclick="editSale(${s.id})"><i class="ti ti-edit"></i></button>
      <button class="btn btn-xs btn-danger-outline" onclick="deleteSale(${s.id})"><i class="ti ti-trash"></i></button>
    </td></tr>`;
  }).join('');
}
function updateSaleStats() {
  const ca=window.DB.sales.reduce((a,s)=>a+s.amount,0),cnt=window.DB.sales.length;
  document.getElementById('v-ca').textContent=fmt(ca);
  document.getElementById('v-count').textContent=cnt;
  document.getElementById('v-avg').textContent=cnt?fmt(Math.round(ca/cnt)):0;
}

// ============================================================
// DEPENSES — CRUD avec persistance JSON
// ============================================================
function populateDepCat() {
  const sel=document.getElementById('dCat');
  if(!sel)return;
  const cv=sel.value;
  sel.innerHTML='<option value="">-- Selectionner --</option>'+CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join('');
  if(cv)sel.value=cv;
  const fs=document.getElementById('fDepCat');
  if(fs) fs.innerHTML='<option value="">Toutes categories</option>'+CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join('');
}
function autoFillDesig() {
  const cat=document.getElementById('dCat').value;
  const desig=document.getElementById('dDesig');
  if(cat&&!desig.value) desig.value=cat;
}

/** SAVE DEPENSE — CREATE ou UPDATE + persistance JSON */
function saveDepense() {
  const date=document.getElementById('dDate').value;
  const cat=document.getElementById('dCat').value;
  const desig=document.getElementById('dDesig').value;
  const amt=parseFloat(document.getElementById('dAmount').value)||0;
  const note=document.getElementById('dNote').value;
  const compteId=parseInt(document.getElementById('dCompte').value)||defaultCompteId();   // compte débité
  if(!cat||!desig||!amt){toast('Categorie, designation et montant obligatoires','error');return;}

  if(editingDepId) {
    const idx=window.DB.depenses.findIndex(d=>d.id===editingDepId);
    if(idx>=0) window.DB.depenses[idx]={...window.DB.depenses[idx],date,cat,desig,amount:amt,note,compteId};
    _syncAndSave();
    toast('Depense modifiee et sauvegardee','success');
  } else {
    window.DB.depenses.unshift({id:window.DB.nextId++,date,cat,desig,amount:amt,note,compteId});
    _syncAndSave();
    toast('Depense enregistree !','success');
  }
  editingDepId=null; closeModal('modalDepense'); renderDepenses(); updateDepStats();
}

function editDepense(id) {
  const d=window.DB.depenses.find(x=>x.id===id); if(!d)return;
  editingDepId=id; openModal('modalDepense');
  setTimeout(()=>{
    document.getElementById('dDate').value=d.date;
    document.getElementById('dCat').value=d.cat;
    document.getElementById('dDesig').value=d.desig;
    document.getElementById('dAmount').value=d.amount;
    document.getElementById('dNote').value=d.note;
    document.getElementById('dCompte').value=d.compteId||defaultCompteId();
  },60);
}

/** DELETE DEPENSE + persistance JSON */
function deleteDepense(id) {
  if(!confirm('Supprimer ?'))return;
  window.DB.depenses=window.DB.depenses.filter(d=>d.id!==id);
  _syncAndSave();
  renderDepenses(); updateDepStats(); toast('Depense supprimee','success');
}

function renderDepenses() {
  const fd=document.getElementById('fDepDate').value, fc=document.getElementById('fDepCat').value;
  const dates=[...new Set(window.DB.depenses.map(d=>d.date))].sort().reverse();
  const fds=document.getElementById('fDepDate'), cv=fds.value;
  fds.innerHTML='<option value="">Toutes les dates</option>'+dates.map(d=>`<option value="${d}">${fmtD(d)}</option>`).join('');
  if(cv)fds.value=cv;
  let rows=window.DB.depenses.filter(d=>(!fd||d.date===fd)&&(!fc||d.cat===fc));
  const empty=document.getElementById('depEmpty'), tbody=document.getElementById('depBody');
  if(!rows.length){tbody.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  tbody.innerHTML=rows.map(d=>`<tr><td>${fmtD(d.date)}</td><td>${d.desig}</td><td><span class="badge b-default">${d.cat}</span></td><td>${compteName(d.compteId||defaultCompteId())}</td><td class="text-right num">${fmt(d.amount)}</td>
  <td class="text-center" style="white-space:nowrap"><button class="btn btn-xs" onclick="editDepense(${d.id})"><i class="ti ti-edit"></i></button><button class="btn btn-xs btn-danger-outline" onclick="deleteDepense(${d.id})"><i class="ti ti-trash"></i></button></td></tr>`).join('');
}
function updateDepStats() {
  const total=window.DB.depenses.reduce((a,d)=>a+d.amount,0),cnt=window.DB.depenses.length;
  document.getElementById('dep-total').textContent=fmt(total);
  document.getElementById('dep-count').textContent=cnt;
  document.getElementById('dep-reste').textContent=fmt(Math.max(0,OBJ.depMax-total));
}

// ============================================================
// CLIENTS — CRUD avec persistance JSON
// ============================================================
function fillClientDropdown() {
  const sel=document.getElementById('vClient');
  if(!sel)return;
  sel.innerHTML='<option value="">-- Aucun --</option>'+window.DB.clients.map(c=>`<option value="${c.name}">${c.name} (${ptL(c.cat)})</option>`).join('');
}

/** SAVE CLIENT + persistance JSON */
function saveClient() {
  const name=document.getElementById('cName').value;
  if(!name){toast('Nom obligatoire','error');return;}
  window.DB.clients.push({id:window.DB.nextId++,name,cat:document.getElementById('cCat').value,phone:document.getElementById('cPhone').value,email:document.getElementById('cEmail').value,addr:document.getElementById('cAddr').value,priceType:document.getElementById('cPriceType').value,solde:parseFloat(document.getElementById('cSolde').value)||0,note:document.getElementById('cNote').value});
  _syncAndSave();
  closeModal('modalClient'); renderClients(); updateClientCounts(); fillClientDropdown(); toast('Client ajoute !','success');
}

/** DELETE CLIENT + persistance JSON */
function deleteClient(id) {
  if(!confirm('Supprimer ?'))return;
  window.DB.clients=window.DB.clients.filter(c=>c.id!==id);
  _syncAndSave();
  renderClients(); updateClientCounts(); fillClientDropdown(); toast('Client supprime','success');
}

function filterClients(cat) {
  window.DB.clientFilter=cat; renderClientTabs(); renderClients();
}
/** Onglets clients (Tous + un par type de client) avec compteurs, rendus dynamiquement. */
function renderClientTabs() {
  const bar=document.getElementById('clientTabs'); if(!bar)return;
  const clients=window.DB.clients, cur=window.DB.clientFilter||'';
  let html=`<div class="tab-item ${cur===''?'active':''}" onclick="filterClients('')">Tous <span class="tag">${clients.length}</span></div>`;
  html+=(window.DB.clientTypes||[]).map(t=>{
    const n=clients.filter(c=>c.cat===t.key).length;
    return `<div class="tab-item ${cur===t.key?'active':''}" onclick="filterClients('${t.key}')">${t.label} <span class="tag">${n}</span></div>`;
  }).join('');
  bar.innerHTML=html;
}
function renderClients() {
  const fs=(document.getElementById('fClientSearch')?.value||'').toLowerCase();
  let rows=window.DB.clients.filter(c=>(!window.DB.clientFilter||c.cat===window.DB.clientFilter)&&(!fs||c.name.toLowerCase().includes(fs)||(c.phone||'').includes(fs)));
  document.getElementById('clientBody').innerHTML=rows.map(c=>`<tr><td><strong>${c.name}</strong></td><td>${catBadge(c.cat)}</td><td>${c.phone||'--'}</td><td>${c.email||'--'}</td><td>${c.addr||'--'}</td><td>${catBadge(c.priceType)}</td><td class="${c.solde>0?'text-danger fw-600':''} num">${c.solde>0?fmt(c.solde):'--'}</td>
  <td class="text-center" style="white-space:nowrap"><button class="btn btn-xs"><i class="ti ti-edit"></i></button><button class="btn btn-xs btn-danger-outline" onclick="deleteClient(${c.id})"><i class="ti ti-trash"></i></button></td></tr>`).join('');
}
function updateClientCounts() { renderClientTabs(); }

// ============================================================
// TYPES DE CLIENT & TYPES DE PRIX — catégories éditables (menu Client)
// ============================================================
/** Crée les types par défaut si les listes sont vides. */
function ensureDefaultTypes() {
  if(!window.DB.clientTypes || !window.DB.clientTypes.length){
    window.DB.clientTypes=[{key:'client',label:'Client'},{key:'mecanicien',label:'Mecanicien'},{key:'grossiste',label:'Grossiste'},{key:'coursier',label:'Coursier'}];
  }
  if(!window.DB.priceTypes || !window.DB.priceTypes.length){
    window.DB.priceTypes=[{key:'client',label:'Prix client'},{key:'mecanicien',label:'Prix mecanicien'},{key:'grossiste',label:'Prix grossiste'}];
  }
}
/** Transforme un libellé en clé technique (minuscules, sans accents/espaces). */
function slugify(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''); }

/** Remplit tous les <select> dépendant des types (catégorie client, type de prix, filtre stats). */
function fillTypeSelectors() {
  const setOpts=(id,arr)=>{const e=document.getElementById(id); if(!e)return; const cur=e.value; e.innerHTML=arr.map(t=>`<option value="${t.key}">${t.label}</option>`).join(''); if(cur&&arr.some(t=>t.key===cur))e.value=cur;};
  setOpts('cCat',      window.DB.clientTypes);
  setOpts('cPriceType',window.DB.priceTypes);
  setOpts('vPriceType',window.DB.priceTypes);
  const st=document.getElementById('statType');
  if(st){const cur=st.value; st.innerHTML='<option value="">Tous</option>'+window.DB.priceTypes.map(t=>`<option value="${t.key}">${t.label}</option>`).join(''); if(cur)st.value=cur;}
}

// ---- CRUD des types ----
function openTypesModal(){ renderTypesLists(); openModal('modalTypes'); }
function renderTypesLists(){
  const row=(kind,t)=>{
    const bg=t.bg||'#e5e7eb', bd=t.border||'#d1d5db', col=t.color||'#374151';
    return `<div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--border)">
      <div class="flex gap-8" style="align-items:center">
        <span class="badge" style="background:${bg};border:1px solid ${bd};color:${col}">${t.label}</span>
        <span class="fs-11 text-muted">(${t.key})</span>
        <input type="color" value="${bg}"  onchange="setTypeColor('${kind}','${t.key}','bg',this.value)"     title="Fond">
        <input type="color" value="${bd}"  onchange="setTypeColor('${kind}','${t.key}','border',this.value)" title="Bordure">
        <input type="color" value="${col}" onchange="setTypeColor('${kind}','${t.key}','color',this.value)"  title="Texte">
      </div>
      <div style="display:flex;gap:4px">
        <button class="btn btn-xs" onclick="renameType('${kind}','${t.key}')" title="Renommer"><i class="ti ti-edit"></i></button>
        <button class="btn btn-xs btn-danger-outline" onclick="deleteType('${kind}','${t.key}')" title="Supprimer"><i class="ti ti-trash"></i></button>
      </div>
    </div>`;
  };
  document.getElementById('clientTypesList').innerHTML=(window.DB.clientTypes||[]).map(t=>row('client',t)).join('')||'<div class="text-muted fs-12">Aucun</div>';
  document.getElementById('priceTypesList').innerHTML=(window.DB.priceTypes||[]).map(t=>row('price',t)).join('')||'<div class="text-muted fs-12">Aucun</div>';
}
function _typeList(kind){ return kind==='client'?window.DB.clientTypes:window.DB.priceTypes; }
/** Met à jour une couleur (bg/border/color) d'un type et rafraîchit les badges. */
function setTypeColor(kind,key,field,value){
  const t=_typeList(kind).find(x=>x.key===key); if(!t)return;
  t[field]=value;
  _syncAndSave(); renderTypesLists(); renderClients();
}
function addClientType(){ _addType('client','newClientType','newClientTypeBg','newClientTypeBorder','newClientTypeColor'); }
function addPriceType(){ _addType('price','newPriceType','newPriceTypeBg','newPriceTypeBorder','newPriceTypeColor'); }
function _addType(kind,inputId,bgId,borderId,colorId){
  const inp=document.getElementById(inputId), label=(inp.value||'').trim();
  if(!label){toast('Nom obligatoire','error');return;}
  const key=slugify(label);
  if(!key){toast('Nom invalide','error');return;}
  const list=_typeList(kind);
  if(list.some(t=>t.key===key)){toast('Ce type existe déjà','error');return;}
  const bg=document.getElementById(bgId).value, border=document.getElementById(borderId).value, color=document.getElementById(colorId).value;
  list.push({key,label,bg,border,color});
  inp.value='';
  _syncAndSave(); renderTypesLists(); fillTypeSelectors(); renderClientTabs();
  toast('Type ajouté !','success');
}
function renameType(kind,key){
  const t=_typeList(kind).find(x=>x.key===key); if(!t)return;
  const nl=prompt('Nouveau nom :',t.label); if(nl===null)return;
  const label=nl.trim(); if(!label){toast('Nom obligatoire','error');return;}
  t.label=label;
  _syncAndSave(); renderTypesLists(); fillTypeSelectors(); renderClientTabs(); renderClients();
  toast('Type renommé !','success');
}
function deleteType(kind,key){
  const list=_typeList(kind);
  const used = kind==='client'
    ? window.DB.clients.some(c=>c.cat===key)
    : (window.DB.clients.some(c=>c.priceType===key) || window.DB.sales.some(s=>s.priceType===key));
  if(used){toast('Impossible : ce type est utilisé par des clients/ventes','error');return;}
  if(list.length<=1){toast('Au moins un type est requis','error');return;}
  if(!confirm('Supprimer ce type ?'))return;
  const i=list.findIndex(t=>t.key===key); if(i>=0) list.splice(i,1);
  _syncAndSave(); renderTypesLists(); fillTypeSelectors(); renderClientTabs();
  toast('Type supprimé','success');
}

// ============================================================
// PRODUITS — CRUD avec persistance JSON
// ============================================================

// Image du produit en cours de saisie (data URL réduite)
let productPhotoData='';

/** Lit l'image choisie, la redimensionne (max 256px) et met à jour l'aperçu. */
function onProductPhotoSelected(e) {
  const file=e.target.files[0];
  if(!file)return;
  if(!file.type.startsWith('image/')){toast('Fichier image invalide','error');return;}
  const reader=new FileReader();
  reader.onload=ev=>{
    const img=new Image();
    img.onload=()=>{
      const max=256; let w=img.width, h=img.height;
      if(w>h && w>max){h=Math.round(h*max/w); w=max;}
      else if(h>max){w=Math.round(w*max/h); h=max;}
      const canvas=document.createElement('canvas');
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      productPhotoData=canvas.toDataURL('image/jpeg',0.85);   // léger, compatible localStorage/JSON
      updateProductPhotoPreview();
    };
    img.onerror=()=>toast('Image illisible','error');
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}
/** Met à jour l'aperçu image (image vs placeholder). */
function updateProductPhotoPreview() {
  const img=document.getElementById('pPhotoPreview');
  const ph=document.getElementById('pPhotoPlaceholder');
  const rm=document.getElementById('pPhotoRemove');
  if(!img)return;
  if(productPhotoData){img.src=productPhotoData;img.style.display='block';ph.style.display='none';rm.style.display='inline-flex';}
  else{img.src='';img.style.display='none';ph.style.display='flex';rm.style.display='none';}
}
/** Retire l'image en cours de saisie. */
function clearProductPhoto() {
  productPhotoData='';
  const input=document.getElementById('pPhotoInput'); if(input) input.value='';
  updateProductPhotoPreview();
}

/** SAVE PRODUIT — CREATE ou UPDATE + persistance JSON */
function saveProduit() {
  const name=document.getElementById('pName').value;
  const pc=parseFloat(document.getElementById('pPC').value)||0;
  if(!name||!pc){toast('Nom et prix client obligatoires','error');return;}
  const fields={
    name,
    cond:document.getElementById('pCond').value,
    pc,
    pm:parseFloat(document.getElementById('pPM').value)||0,
    pg:parseFloat(document.getElementById('pPG').value)||0,
    unit:document.getElementById('pUnit').value,
    stock:parseInt(document.getElementById('pStock').value)||0,
    alerte:parseInt(document.getElementById('pAlerte').value)||0,
    photo:productPhotoData||''
  };

  if(editingProdId) {
    // UPDATE
    const p=window.DB.produits.find(x=>x.id===editingProdId);
    if(p) {
      const oldName=p.name, oldStock=p.stock||0;
      Object.assign(p, fields);
      // Si le stock a été modifié à la main, on journalise un ajustement (pour garder l'historique cohérent)
      const delta=fields.stock-oldStock;
      if(delta!==0){
        window.DB.mouvements=window.DB.mouvements||[];
        window.DB.mouvements.unshift({id:window.DB.nextId++,prodId:p.id,prod:p.name,date:new Date().toISOString().slice(0,10),type:'ajustement',delta,note:'Modification fiche produit'});
      }
      // Si le nom a changé, on répercute sur les ventes et mouvements existants
      if(oldName!==fields.name){
        window.DB.sales.forEach(s=>{if(s.prod===oldName)s.prod=fields.name;});
        (window.DB.mouvements||[]).forEach(m=>{if(m.prod===oldName)m.prod=fields.name;});
      }
    }
    _syncAndSave();
    closeModal('modalProduit'); renderProduits(); fillProductOptions(); refreshDashboard(); toast('Produit modifié !','success');
  } else {
    // CREATE
    window.DB.produits.push({id:window.DB.nextId++,...fields});
    _syncAndSave();
    closeModal('modalProduit'); renderProduits(); fillProductOptions(); toast('Produit ajoute !','success');
  }
}

/** Ouvre le formulaire produit pré-rempli pour modification. */
function editProduit(id) {
  const p=window.DB.produits.find(x=>x.id===id);
  if(!p){toast('Produit introuvable','error');return;}
  editingProdId=id;
  const t=document.getElementById('prodModalTitle'); if(t) t.textContent='Modifier le produit';
  document.getElementById('pName').value=p.name||'';
  document.getElementById('pCond').value=p.cond||'';
  document.getElementById('pPC').value=p.pc||'';
  document.getElementById('pPM').value=p.pm||'';
  document.getElementById('pPG').value=p.pg||'';
  document.getElementById('pUnit').value=p.unit||'';
  document.getElementById('pStock').value=p.stock||0;
  document.getElementById('pAlerte').value=p.alerte||0;
  productPhotoData=p.photo||'';
  updateProductPhotoPreview();
  openModal('modalProduit');
}

/** DELETE PRODUIT + persistance JSON */
function deleteProduit(id) {
  if(!confirm('Supprimer ?'))return;
  window.DB.produits=window.DB.produits.filter(p=>p.id!==id);
  _syncAndSave();
  renderProduits(); fillProductOptions(); toast('Produit supprime','success');
}

function renderProduits() {
  document.getElementById('prodBody').innerHTML=window.DB.produits.map(p=>{
    const sb=p.stock===0?`<span class="dot dot-red" style="margin-right:4px"></span>Rupture`:p.stock<=p.alerte?`<span class="dot dot-orange" style="margin-right:4px"></span>Faible (${p.stock})`:`<span class="dot dot-green" style="margin-right:4px"></span>En stock (${p.stock})`;
    const av=p.photo
      ? `<img src="${p.photo}" alt="" style="width:34px;height:34px;border-radius:8px;object-fit:cover">`
      : `<span style="width:34px;height:34px;border-radius:8px;background:var(--bg3);display:inline-flex;align-items:center;justify-content:center;color:var(--text3)"><i class="ti ti-droplet"></i></span>`;
    return`<tr><td><span style="display:inline-flex;align-items:center;gap:8px">${av}<strong style="cursor:pointer;color:var(--primary)" onclick="showStockChart(${p.id})" title="Voir l'évolution du stock">${p.name}</strong></span></td><td>${p.cond||'--'}</td><td class="text-right num">${fmt(p.pc)}</td><td class="text-right num">${fmt(p.pm)}</td><td class="text-right num">${fmt(p.pg)}</td><td style="font-size:12px">${sb}</td><td class="text-center" style="white-space:nowrap"><button class="btn btn-xs" onclick="editProduit(${p.id})" title="Modifier le produit"><i class="ti ti-edit"></i></button><button class="btn btn-xs" onclick="showStockChart(${p.id})" title="Évolution du stock"><i class="ti ti-chart-line"></i></button><button class="btn btn-xs" onclick="openReassort(${p.id})" title="Réapprovisionner / ajuster le stock"><i class="ti ti-package"></i></button><button class="btn btn-xs btn-danger-outline" onclick="deleteProduit(${p.id})"><i class="ti ti-trash"></i></button></td></tr>`;
  }).join('');
}

let stockChartInstance=null;

/**
 * Construit la liste chronologique des mouvements de stock d'un produit :
 * ventes (sorties) + mouvements du registre (réassorts/pertes), triés par date.
 * @returns {{events:Array, initial:number, current:number, totalSold:number}}
 */
function buildStockHistory(p) {
  const sales = window.DB.sales.filter(s => s.prod === p.name);
  const moves = (window.DB.mouvements || []).filter(m => m.prodId === p.id || m.prod === p.name);
  const totalSold = sales.reduce((a, s) => a + (s.qty || 0), 0);
  const ledgerSum = moves.reduce((a, m) => a + (m.delta || 0), 0);
  const current = p.stock || 0;
  // Stock au tout début = actuel - (entrées/sorties du registre) + total vendu
  const initial = current - ledgerSum + totalSold;

  const events = [];
  const LBL = { reassort: 'Réassort', perte: 'Perte', ajustement: 'Ajustement' };
  sales.forEach(s => events.push({ date: s.date, delta: -(s.qty || 0), label: 'Vente', note: s.clientName && s.clientName !== '--' ? s.clientName : '' }));
  moves.forEach(m => events.push({ date: m.date, delta: m.delta || 0, label: LBL[m.type] || 'Mouvement', note: m.note || '' }));
  // tri par date ; à date égale, entrées (+) avant sorties (−)
  events.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (b.delta - a.delta));
  return { events, initial, current, totalSold };
}

/**
 * Affiche un pop-up : graphe + tableau de l'évolution du stock d'un produit.
 * Historique réel = ventes + mouvements enregistrés (réassorts, pertes).
 * @param {number} id id du produit
 */
function showStockChart(id) {
  const p=window.DB.produits.find(x=>x.id===id);
  if(!p){toast('Produit introuvable','error');return;}
  window._stockModalProdId=id;
  const {events,initial,current,totalSold}=buildStockHistory(p);

  // Courbe : point de départ puis cumul après chaque événement
  const labels=['Départ'], data=[initial];
  let running=initial;
  const rows=[];   // pour le tableau (avec stock après chaque mouvement)
  events.forEach(e=>{running+=e.delta; labels.push(fmtD(e.date)); data.push(running); rows.push({...e, after:running});});
  if(!events.length){labels.push('Actuel');data.push(current);}

  // Résumé chiffré
  document.getElementById('stockModalTitle').textContent='Évolution du stock — '+p.name;
  document.getElementById('stkCurrent').textContent=current;
  document.getElementById('stkInitial').textContent=initial;
  document.getElementById('stkSold').textContent=totalSold;
  document.getElementById('stkAlerte').textContent=p.alerte||0;

  // Tableau des mouvements (du plus récent au plus ancien)
  const body=document.getElementById('stockMovesBody');
  if(body){
    body.innerHTML = rows.length
      ? rows.slice().reverse().map(r=>{
          const cls=r.delta>=0?'text-success':'text-danger';
          const badge=r.label==='Vente'?'b-client':(r.delta>=0?'b-success':'b-danger');
          return `<tr><td>${fmtD(r.date)}</td><td><span class="badge ${badge}">${r.label}</span></td><td class="text-right num ${cls}">${r.delta>=0?'+':''}${r.delta}</td><td class="text-right num">${r.after}</td><td class="fs-11 text-muted">${r.note||''}</td></tr>`;
        }).join('')
      : '<tr><td colspan="5" class="text-center text-muted" style="padding:16px">Aucun mouvement</td></tr>';
  }

  openModal('modalStock');

  // Construit le graphe après ouverture (le canvas doit avoir une taille)
  setTimeout(()=>{
    const canvas=document.getElementById('chartStock');
    if(!canvas)return;
    if(stockChartInstance){try{stockChartInstance.destroy()}catch(e){}}
    const dark=document.body.dataset.theme==='dark';
    const tc=dark?'#A8A8A8':'#555', gc=dark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)';
    const unit=p.unit||'u.';
    stockChartInstance=new Chart(canvas,{
      type:'line',
      data:{labels,datasets:[
        {label:'Stock',data,borderColor:'#C0392B',backgroundColor:'rgba(192,57,43,.1)',tension:.3,fill:true,pointRadius:3,pointBackgroundColor:'#C0392B'},
        {label:'Seuil alerte',data:labels.map(()=>p.alerte||0),borderColor:'#E67E22',borderDash:[6,4],pointRadius:0,fill:false}
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:true,labels:{color:tc,font:{size:11},boxWidth:12}},
          tooltip:{callbacks:{label:ctx=>' '+ctx.dataset.label+': '+ctx.parsed.y+' '+unit}}},
        scales:{x:{ticks:{color:tc,font:{size:10},maxRotation:30},grid:{color:gc}},
          y:{beginAtZero:true,ticks:{color:tc,font:{size:10}},grid:{color:gc}}}}
    });
  },80);
}

let reassortProdId=null;
/** Ouvre le formulaire de mouvement de stock (réassort / perte) pour un produit. */
function openReassort(id) {
  const p=window.DB.produits.find(x=>x.id===id);
  if(!p){toast('Produit introuvable','error');return;}
  reassortProdId=id;
  document.getElementById('reassortProdName').textContent=p.name;
  document.getElementById('reassortCurrent').textContent=p.stock||0;
  document.getElementById('reassortType').value='reassort';
  document.getElementById('reassortQty').value='';
  document.getElementById('reassortDate').value=new Date().toISOString().slice(0,10);
  document.getElementById('reassortNote').value='';
  openModal('modalReassort');
}

/** Enregistre un mouvement de stock + persistance JSON. */
function saveReassort() {
  const p=window.DB.produits.find(x=>x.id===reassortProdId);
  if(!p){toast('Produit introuvable','error');return;}
  const type=document.getElementById('reassortType').value;
  const qty=parseFloat(document.getElementById('reassortQty').value)||0;
  const date=document.getElementById('reassortDate').value;
  const note=document.getElementById('reassortNote').value;
  if(qty<=0||!date){toast('Quantité (>0) et date obligatoires','error');return;}
  if(type==='perte' && qty>(p.stock||0)){toast(`Impossible : perte (${qty}) supérieure au stock (${p.stock||0})`,'error');return;}

  const delta=type==='reassort'?qty:-qty;
  p.stock=(p.stock||0)+delta;
  window.DB.mouvements=window.DB.mouvements||[];
  window.DB.mouvements.unshift({id:window.DB.nextId++,prodId:p.id,prod:p.name,date,type,delta,note});
  _syncAndSave();
  closeModal('modalReassort'); renderProduits(); refreshDashboard();
  // Si le pop-up du graphe est ouvert sur ce produit, on le rafraîchit
  if(window._stockModalProdId===p.id && document.getElementById('modalStock').classList.contains('open')) showStockChart(p.id);
  toast(type==='reassort'?'Stock réapprovisionné !':'Perte enregistrée','success');
}

// ============================================================
// RAPPORTS — calculés dynamiquement depuis les vraies données (DB)
// Remplace les anciens objets statiques WEEK_DATA / MONTH_DATA.
//   • clé semaine  = date du lundi au format 'YYYY-MM-DD'
//   • clé mois     = 'YYYY-MM'
// ============================================================
const JNAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// -- Helpers dates (sans décalage de fuseau) ----------------
function _dateOf(iso) { return new Date(iso + 'T00:00:00'); }
function _isoLocal(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function _addDays(d, n) { const r = new Date(d); r.setDate(d.getDate() + n); return r; }
function _mondayOf(iso) { const d = _dateOf(iso); const day = d.getDay() || 7; return _addDays(d, 1 - day); }
// Numéro de la semaine (S1, S2…) dans le mois du lundi donné
function _weekNumInMonth(monday) {
  const first = new Date(monday.getFullYear(), monday.getMonth(), 1);
  const fd = first.getDay() || 7;
  const firstMonday = _addDays(first, (8 - fd) % 7);   // 1er lundi du mois
  return Math.round((monday - firstMonday) / (7 * 86400000)) + 1;
}

// -- Liste des semaines (lundis) ayant des données ----------
function _weeksWithData() {
  const set = new Set();
  DB.sales.forEach(s => set.add(_isoLocal(_mondayOf(s.date))));
  DB.depenses.forEach(d => set.add(_isoLocal(_mondayOf(d.date))));
  return [...set].sort().reverse();
}
// -- Liste des mois ayant des données -----------------------
function _monthsWithData() {
  const set = new Set();
  DB.sales.forEach(s => set.add(s.date.slice(0, 7)));
  DB.depenses.forEach(d => set.add(d.date.slice(0, 7)));
  return [...set].sort().reverse();
}

/**
 * Construit un rapport hebdomadaire (Lun–Ven) depuis les vraies ventes/dépenses.
 * @param {string} mondayISO date du lundi 'YYYY-MM-DD'
 * @returns {Object|null} même structure que l'ancien WEEK_DATA[key]
 */
// Objectif CA d'une semaine/mois : valeur spécifique si définie, sinon objectif global.
function getWeekObjectif(mondayISO){ const v=(window.DB.objWeek||{})[mondayISO]; return (v!=null&&v!=='')?v:OBJ.caH; }
function getMonthObjectif(monthKey){ const v=(window.DB.objMonth||{})[monthKey]; return (v!=null&&v!=='')?v:OBJ.caM; }
function hasWeekObjectif(mondayISO){ return (window.DB.objWeek||{})[mondayISO]!=null; }
function hasMonthObjectif(monthKey){ return (window.DB.objMonth||{})[monthKey]!=null; }
/** Définit/efface l'objectif spécifique d'une semaine (vide ou = global => repli global). */
function setWeekObjectif(mondayISO,val){
  const n=parseFloat(val)||0;
  if(!n || n===OBJ.caH){ delete window.DB.objWeek[mondayISO]; } else { window.DB.objWeek[mondayISO]=n; }
  _syncAndSave(); renderObjectifsSuivi();
  if(document.getElementById('page-rapports').classList.contains('active')) loadWeekReport();
}
/** Définit/efface l'objectif spécifique d'un mois (vide ou = global => repli global). */
function setMonthObjectif(monthKey,val){
  const n=parseFloat(val)||0;
  if(!n || n===OBJ.caM){ delete window.DB.objMonth[monthKey]; } else { window.DB.objMonth[monthKey]=n; }
  _syncAndSave(); renderObjectifsMois();
  if(document.getElementById('page-rapports').classList.contains('active')) loadMonthReport();
}

function computeWeekData(mondayISO) {
  if (!mondayISO) return null;
  const monday = _dateOf(mondayISO);
  const fridayISO = _isoLocal(_addDays(monday, 4));   // libellé : semaine de travail Lun–Ven
  const sundayISO = _isoLocal(_addDays(monday, 6));   // fenêtre réelle Lun–Dim (capte les dépenses du week-end)
  const year = monday.getFullYear();

  // Lignes par jour : Lun→Ven toujours affichés ; Sam/Dim seulement s'ils ont de l'activité
  const days = [];
  for (let i = 0; i < 7; i++) {
    const dayISO = _isoLocal(_addDays(monday, i));
    const ca  = DB.sales.filter(s => s.date === dayISO).reduce((a, s) => a + s.amount, 0);
    const dep = DB.depenses.filter(d => d.date === dayISO).reduce((a, d) => a + d.amount, 0);
    if (i < 5 || ca > 0 || dep > 0) {
      days.push({ d: JNAMES[_dateOf(dayISO).getDay()] + ' ' + fmtD(dayISO), ca, dep });
    }
  }

  const weekSales = DB.sales.filter(s => s.date >= mondayISO && s.date <= sundayISO);
  const weekDeps  = DB.depenses.filter(d => d.date >= mondayISO && d.date <= sundayISO);
  const ca  = weekSales.reduce((a, s) => a + s.amount, 0);
  const dep = weekDeps.reduce((a, d) => a + d.amount, 0);
  const jours = new Set(weekSales.map(s => s.date)).size;

  // Synthèse par produit
  const pmap = {};
  weekSales.forEach(s => {
    if (!pmap[s.prod]) pmap[s.prod] = { n: s.prod, qte: 0, ca: 0 };
    pmap[s.prod].qte += (s.qty || 0);
    pmap[s.prod].ca  += s.amount;
  });
  const prodSynth = Object.values(pmap).sort((a, b) => b.ca - a.ca);

  const depenses = weekDeps
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ d: fmtD(d.date), des: d.desig, amt: d.amount }));

  return {
    label: 'S' + _weekNumInMonth(monday) + ' — ' + fmtD(mondayISO) + ' au ' + fmtD(fridayISO) + '/' + year,
    ca, dep, net: ca - dep, jours, objCA: getWeekObjectif(mondayISO),
    days, depenses, prodSynth
  };
}

/**
 * Construit un rapport mensuel (mois calendaire) depuis les vraies données.
 * @param {string} monthKey 'YYYY-MM'
 * @returns {Object|null} même structure que l'ancien MONTH_DATA[key]
 */
function computeMonthData(monthKey) {
  if (!monthKey) return null;
  const mSales = DB.sales.filter(s => s.date.slice(0, 7) === monthKey);
  const mDeps  = DB.depenses.filter(d => d.date.slice(0, 7) === monthKey);
  const ca  = mSales.reduce((a, s) => a + s.amount, 0);
  const dep = mDeps.reduce((a, d) => a + d.amount, 0);

  // Découpage en semaines ouvrées (Lun–Ven) limitées au mois
  const weeks = [];
  if (mSales.length || mDeps.length) {
    const first = new Date(parseInt(monthKey.slice(0, 4)), parseInt(monthKey.slice(5, 7)) - 1, 1);
    const last  = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    let monday = _mondayOf(_isoLocal(first));
    let idx = 0;
    while (monday <= last) {
      const inMonth = [];
      for (let i = 0; i < 7; i++) {   // semaine complète Lun–Dim, limitée au mois
        const dayISO = _isoLocal(_addDays(monday, i));
        if (dayISO.slice(0, 7) === monthKey) inMonth.push(dayISO);
      }
      if (inMonth.length) {
        const wca  = mSales.filter(s => inMonth.includes(s.date)).reduce((a, s) => a + s.amount, 0);
        const wdep = mDeps.filter(d => inMonth.includes(d.date)).reduce((a, d) => a + d.amount, 0);
        if (wca || wdep) {   // ignore les semaines sans aucune activité
          idx++;
          weeks.push({
            s: 'S' + idx,
            p: fmtD(inMonth[0]) + '-' + fmtD(inMonth[inMonth.length - 1]),
            ca: wca, dep: wdep, net: wca - wdep
          });
        }
      }
      monday = _addDays(monday, 7);
    }
  }

  // Top produits
  const pmap = {};
  mSales.forEach(s => { pmap[s.prod] = (pmap[s.prod] || 0) + s.amount; });
  const topProds = Object.entries(pmap).map(([n, ca]) => ({ n, ca })).sort((a, b) => b.ca - a.ca).slice(0, 5);

  // Dépenses par catégorie
  const cmap = {};
  mDeps.forEach(d => { cmap[d.cat] = (cmap[d.cat] || 0) + d.amount; });
  const depByCat = Object.entries(cmap).map(([cat, amt]) => ({ cat, amt })).sort((a, b) => b.amt - a.amt);

  const M = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
  return {
    label: M[parseInt(monthKey.slice(5, 7)) - 1] + ' ' + monthKey.slice(0, 4),
    ca, dep, net: ca - dep, objCA: getMonthObjectif(monthKey),
    weeks, topProds, depByCat
  };
}

/**
 * Remplit les listes déroulantes des rapports selon les données réelles.
 * Conserve la sélection courante si elle existe encore.
 */
function populateReportSelectors() {
  const wSel = document.getElementById('repWeekSel');
  if (wSel) {
    const cur = wSel.value;
    const weeks = _weeksWithData();
    wSel.innerHTML = weeks.length
      ? weeks.map(mon => { const d = computeWeekData(mon); return `<option value="${mon}">${d.label}</option>`; }).join('')
      : '<option value="">Aucune donnée</option>';
    if (cur && weeks.includes(cur)) wSel.value = cur;
  }
  const mSel = document.getElementById('repMonthSel');
  if (mSel) {
    const cur = mSel.value;
    const months = _monthsWithData();
    const ML = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
    mSel.innerHTML = months.length
      ? months.map(mk => `<option value="${mk}">${ML[parseInt(mk.slice(5, 7)) - 1]} ${mk.slice(0, 4)}</option>`).join('')
      : '<option value="">Aucune donnée</option>';
    if (cur && months.includes(cur)) mSel.value = cur;
  }
}

function switchReport(type,el) {
  document.querySelectorAll('#page-rapports .tab-item').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('rep-hebdo').style.display=type==='hebdo'?'block':'none';
  document.getElementById('rep-mensuel').style.display=type==='mensuel'?'block':'none';
}
function loadWeekReport() {
  const key=document.getElementById('repWeekSel').value;
  const d=computeWeekData(key);
  if(!d){document.getElementById('weekReportContent').innerHTML='<p class="text-muted">Rapport non disponible</p>';return;}
  const pct=Math.round(d.ca/d.objCA*100);
  const depObjW=100000, depPct=Math.round(d.dep/depObjW*100);
  const totalCA=d.ca||1;
  const prodSynth=d.prodSynth||[];
  const prodRows=prodSynth.map((p,i)=>`
    <tr><td>${i+1}</td><td><strong>${p.n}</strong></td><td class="text-right num">${p.qte}</td><td class="text-right num">${fcfa(p.ca)}</td>
    <td class="text-right"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--bg4);border-radius:3px;overflow:hidden"><div style="height:100%;border-radius:3px;background:var(--primary);width:${Math.round(p.ca/totalCA*100)}%"></div></div><span class="fs-11">${Math.round(p.ca/totalCA*100)}%</span></div></td></tr>`).join('');
  document.getElementById('weekReportContent').innerHTML=`
  <div class="card mb-16"><div class="card-header"><div><div class="card-title"><i class="ti ti-file-analytics"></i> ${d.label}</div><div class="card-subtitle">Mirr Oils — Distribution Huiles Moteur &amp; Lubrifiants</div></div></div>
  <div class="g4" style="margin-bottom:0">
    <div class="metric m-green"><div class="metric-label">CA hebdomadaire</div><div class="metric-value">${fmt(d.ca)}</div><div class="metric-sub">FCFA</div></div>
    <div class="metric m-red"><div class="metric-label">Dépenses</div><div class="metric-value">${fmt(d.dep)}</div><div class="metric-sub">FCFA</div></div>
    <div class="metric m-blue"><div class="metric-label">Résultat net</div><div class="metric-value">${fmt(d.net)}</div><div class="metric-sub">FCFA</div></div>
    <div class="metric m-orange"><div class="metric-label">Jours actifs</div><div class="metric-value">${d.jours}/5</div><div class="metric-sub">Obj : ${fmt(d.objCA)} FCFA</div></div>
  </div></div>
  <div class="g2 mb-16">
    <div class="card"><div class="card-header"><div class="card-title"><i class="ti ti-calendar-week"></i> Récapitulatif par jour</div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Date</th><th class="text-right">CA (FCFA)</th><th>% CA</th><th class="text-right">Dépenses</th><th class="text-right">Solde net</th></tr></thead>
    <tbody>${d.days.map(x=>`<tr><td>${x.d}</td><td class="text-right num fw-600">${fmt(x.ca)}</td><td class="fs-11 text-muted">${Math.round(x.ca/totalCA*100)} %</td><td class="text-right num ${x.dep>0?'text-danger':''}">${x.dep>0?fmt(x.dep):'—'}</td><td class="text-right num ${x.ca-x.dep>=0?'text-success':'text-danger'}">${fmt(x.ca-x.dep)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td class="fw-600">TOTAL</td><td class="text-right num fw-600">${fmt(d.ca)}</td><td>100 %</td><td class="text-right num text-danger fw-600">${fmt(d.dep)}</td><td class="text-right num text-success fw-600">${fmt(d.net)}</td></tr></tfoot></table></div></div>
    <div class="card"><div class="card-header"><div class="card-title"><i class="ti ti-wallet"></i> Dépenses de la semaine</div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Désignation</th><th class="text-right">Montant (FCFA)</th></tr></thead>
    <tbody>${d.depenses.map(x=>`<tr><td>${x.d}</td><td>${x.des}</td><td class="text-right num">${fmt(x.amt)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="2">CA total</td><td class="text-right num text-success">${fmt(d.ca)}</td></tr><tr><td colspan="2" class="text-danger">Total dépenses</td><td class="text-right num text-danger">${fmt(d.dep)}</td></tr><tr><td colspan="2" class="fw-600">Résultat net</td><td class="text-right num text-success fw-600">${fmt(d.net)}</td></tr></tfoot></table></div></div>
  </div>
  ${prodRows?`<div class="card mb-16"><div class="card-header"><div class="card-title"><i class="ti ti-chart-bar"></i> Synthèse des ventes par produit</div></div>
  <div class="tbl-wrap"><table><thead><tr><th>#</th><th>Produit</th><th class="text-right">Qté</th><th class="text-right">CA (FCFA)</th><th>% CA semaine</th></tr></thead>
  <tbody>${prodRows}</tbody><tfoot><tr><td colspan="3" class="fw-600">TOTAL</td><td class="text-right num fw-600">${fmt(d.ca)}</td><td>100 %</td></tr></tfoot></table></div></div>`:''}
  <div class="card"><div class="card-header"><div class="card-title"><i class="ti ti-target"></i> Suivi des objectifs</div></div>
  <div class="tbl-wrap"><table><thead><tr><th>Indicateur</th><th class="text-right">Objectif</th><th class="text-right">Réalisé</th><th class="text-right">Écart</th><th class="text-right">Taux</th><th>Statut</th></tr></thead>
  <tbody>
    <tr><td>CA Hebdomadaire</td><td class="text-right num">${fmt(d.objCA)}</td><td class="text-right num">${fmt(d.ca)}</td><td class="text-right num ${d.ca>=d.objCA?'text-success':'text-danger'}">${d.ca>=d.objCA?'+':''}${fmt(d.ca-d.objCA)}</td><td class="text-right"><span class="badge ${pct>=100?'b-success':pct>=80?'b-warning':'b-danger'}">${pct} %</span></td><td>${pct>=100?'<span class="badge b-success">Objectif atteint</span>':pct>=80?'<span class="badge b-warning">Proche</span>':'<span class="badge b-danger">Non atteint</span>'}</td></tr>
    <tr><td>Résultat Net</td><td class="text-right num">${fmt(Math.round(d.objCA*0.875))}</td><td class="text-right num">${fmt(d.net)}</td><td class="text-right num ${d.net>=d.objCA*0.875?'text-success':'text-danger'}">${d.net>=d.objCA*0.875?'+':''}${fmt(d.net-Math.round(d.objCA*0.875))}</td><td class="text-right"><span class="badge ${d.net>=d.objCA*0.875?'b-success':'b-warning'}">${Math.round(d.net/(d.objCA*0.875)*100)} %</span></td><td>${d.net>=d.objCA*0.875?'<span class="badge b-success">Atteint</span>':'<span class="badge b-warning">À améliorer</span>'}</td></tr>
    <tr><td>Maîtrise dépenses (max ${fmt(depObjW)} FCFA)</td><td class="text-right num">${fmt(depObjW)}</td><td class="text-right num">${fmt(d.dep)}</td><td class="text-right num text-success">-${fmt(depObjW-d.dep)}</td><td class="text-right"><span class="badge ${depPct<=100?'b-success':'b-danger'}">${depPct} %</span></td><td>${depPct<=100?'<span class="badge b-success">Budget respecté</span>':'<span class="badge b-danger">Dépassé</span>'}</td></tr>
  </tbody></table></div></div>`;
}
function loadMonthReport() {
  const key=document.getElementById('repMonthSel').value;
  const d=computeMonthData(key);
  if(!d){document.getElementById('monthReportContent').innerHTML='<p class="text-muted">Rapport non disponible</p>';return;}
  const pct=Math.round(d.ca/d.objCA*100), depObj=250000, depPct=Math.round(d.dep/depObj*100);
  const netObj=Math.round(d.objCA*0.98), netPct=Math.round(d.net/netObj*100), totalCA=d.ca||1;
  document.getElementById('monthReportContent').innerHTML=`
  <div class="card mb-16"><div class="card-header"><div><div class="card-title"><i class="ti ti-file-analytics"></i> Rapport mensuel — ${d.label}</div><div class="card-subtitle">Mirr Oils — Distribution Huiles Moteur &amp; Lubrifiants</div></div></div>
  <div class="g4" style="margin-bottom:0">
    <div class="metric m-green"><div class="metric-label">CA mensuel</div><div class="metric-value">${fmt(d.ca)}</div><div class="metric-sub">FCFA</div></div>
    <div class="metric m-red"><div class="metric-label">Dépenses</div><div class="metric-value">${fmt(d.dep)}</div><div class="metric-sub">FCFA</div></div>
    <div class="metric m-blue"><div class="metric-label">Résultat net</div><div class="metric-value">${fmt(d.net)}</div><div class="metric-sub">FCFA</div></div>
    <div class="metric m-orange"><div class="metric-label">Objectif atteint</div><div class="metric-value">${pct} %</div><div class="metric-sub">Obj : ${fmt(d.objCA)} FCFA</div></div>
  </div></div>
  <div class="card mb-16"><div class="card-header"><div class="card-title"><i class="ti ti-calendar-week"></i> Récapitulatif par semaine</div></div>
  <div class="tbl-wrap"><table><thead><tr><th>Semaine</th><th class="text-right">CA (FCFA)</th><th class="text-right">Dépenses</th><th class="text-right">Résultat net</th><th>% CA mois</th><th>Statut</th></tr></thead>
  <tbody>${d.weeks.map(w=>{const sp=Math.round(w.ca/totalCA*100),ok=w.ca>=(d.objCA/4);return`<tr><td>${w.s} — ${w.p}</td><td class="text-right num ${ok?'fw-600':''}">${fmt(w.ca)}</td><td class="text-right num text-danger">${fmt(w.dep)}</td><td class="text-right num">${fmt(w.net)}</td><td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--bg4);border-radius:3px;overflow:hidden"><div style="height:100%;border-radius:3px;background:var(--primary);width:${sp}%"></div></div><span class="fs-11">${sp} %</span></div></td><td>${ok?'<span class="badge b-success">Objectif atteint</span>':'<span class="badge b-warning">Sous objectif</span>'}</td></tr>`}).join('')}</tbody>
  <tfoot><tr><td class="fw-600">TOTAL MOIS</td><td class="text-right num fw-600">${fmt(d.ca)}</td><td class="text-right num text-danger fw-600">${fmt(d.dep)}</td><td class="text-right num text-success fw-600">${fmt(d.net)}</td><td>100 %</td><td><span class="tag">Obj : ${fmt(d.objCA)} FCFA</span></td></tr></tfoot></table></div></div>
  <div class="card mb-16"><div class="card-header"><div class="card-title"><i class="ti ti-wallet"></i> Dépenses par catégorie</div></div>
  <div class="tbl-wrap"><table><thead><tr><th>Catégorie</th><th class="text-right">Montant (FCFA)</th><th>% Dépenses</th></tr></thead>
  <tbody>${d.depByCat.map(x=>`<tr><td>${x.cat}</td><td class="text-right num">${fmt(x.amt)}</td><td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--bg4);border-radius:3px;overflow:hidden"><div style="height:100%;border-radius:3px;background:var(--warning);width:${Math.round(x.amt/d.dep*100)}%"></div></div><span class="fs-11">${Math.round(x.amt/d.dep*100)} %</span></div></td></tr>`).join('')}</tbody>
  <tfoot><tr><td class="fw-600">TOTAL</td><td class="text-right num text-danger fw-600">${fmt(d.dep)}</td><td></td></tr></tfoot></table></div></div>
  <div class="card mb-16"><div class="card-header"><div class="card-title"><i class="ti ti-chart-bar"></i> Synthèse des ventes par produit (Top 5)</div></div>
  <div class="tbl-wrap"><table><thead><tr><th>#</th><th>Produit</th><th class="text-right">CA (FCFA)</th><th>% CA mensuel</th></tr></thead>
  <tbody>${d.topProds.map((p,i)=>`<tr><td>${i+1}</td><td><strong>${p.n}</strong></td><td class="text-right num">${fmt(p.ca)}</td><td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--bg4);border-radius:3px;overflow:hidden"><div style="height:100%;border-radius:3px;background:var(--primary);width:${Math.round(p.ca/totalCA*100)}%"></div></div><span class="fs-11">${Math.round(p.ca/totalCA*100)} %</span></div></td></tr>`).join('')}</tbody>
  <tfoot><tr><td colspan="2" class="fw-600">TOTAL (top 5)</td><td class="text-right num fw-600">${fmt(d.topProds.reduce((a,p)=>a+p.ca,0))}</td><td class="fs-11 text-muted">${Math.round(d.topProds.reduce((a,p)=>a+p.ca,0)/totalCA*100)} % du CA</td></tr></tfoot></table></div></div>
  <div class="card"><div class="card-header"><div class="card-title"><i class="ti ti-target"></i> Suivi des objectifs</div></div>
  <div class="tbl-wrap"><table><thead><tr><th>Indicateur</th><th class="text-right">Objectif</th><th class="text-right">Réalisé</th><th class="text-right">Écart</th><th class="text-right">Taux</th><th>Statut</th></tr></thead>
  <tbody>
    <tr><td>CA Mensuel</td><td class="text-right num">${fmt(d.objCA)}</td><td class="text-right num">${fmt(d.ca)}</td><td class="text-right num ${d.ca>=d.objCA?'text-success':'text-danger'}">${d.ca>=d.objCA?'+':''}${fmt(d.ca-d.objCA)}</td><td class="text-right"><span class="badge ${pct>=100?'b-success':pct>=80?'b-warning':'b-danger'}">${pct} %</span></td><td>${pct>=100?'<span class="badge b-success">Objectif atteint</span>':pct>=80?'<span class="badge b-warning">Proche</span>':'<span class="badge b-danger">Non atteint</span>'}</td></tr>
    <tr><td>Résultat Net (obj. ${fmt(netObj)} FCFA)</td><td class="text-right num">${fmt(netObj)}</td><td class="text-right num">${fmt(d.net)}</td><td class="text-right num ${d.net>=netObj?'text-success':'text-danger'}">${d.net>=netObj?'+':''}${fmt(d.net-netObj)}</td><td class="text-right"><span class="badge ${netPct>=100?'b-success':netPct>=80?'b-warning':'b-danger'}">${netPct} %</span></td><td>${netPct>=100?'<span class="badge b-success">Atteint</span>':netPct>=80?'<span class="badge b-warning">Proche</span>':'<span class="badge b-danger">Non atteint</span>'}</td></tr>
    <tr><td>Budget dépenses (max ${fmt(depObj)} FCFA)</td><td class="text-right num">${fmt(depObj)}</td><td class="text-right num">${fmt(d.dep)}</td><td class="text-right num ${d.dep<=depObj?'text-success':'text-danger'}">${d.dep<=depObj?'-':'+'}${fmt(Math.abs(d.dep-depObj))}</td><td class="text-right"><span class="badge ${depPct<=100?'b-success':'b-danger'}">${depPct} %</span></td><td>${depPct<=100?'<span class="badge b-success">Budget respecté</span>':'<span class="badge b-danger">Budget dépassé</span>'}</td></tr>
  </tbody></table></div></div>`;
}

// ============================================================
// PDF (inchangé)
// ============================================================
function generatePDF(type) {
  const {jsPDF}=window.jspdf;
  const isH=type==='hebdo';
  const key=isH?document.getElementById('repWeekSel').value:document.getElementById('repMonthSel').value;
  const d=isH?computeWeekData(key):computeMonthData(key);
  if(!d){toast('Aucun rapport sélectionné','error');return;}
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=210,M=14,CW=W-M*2; let y=M;
  doc.setFillColor(192,57,43); doc.rect(0,0,W,30,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(20); doc.setFont(undefined,'bold'); doc.text('MIRR OILS',M,13);
  doc.setFontSize(8); doc.setFont(undefined,'normal');
  doc.text('Distribution Huiles Moteur & Lubrifiants — Lomé, Togo',M,20);
  doc.setFontSize(12); doc.setFont(undefined,'bold');
  doc.text(isH?'RAPPORT HEBDOMADAIRE':'RAPPORT MENSUEL',W-M,13,{align:'right'});
  doc.setFontSize(8); doc.setFont(undefined,'normal');
  doc.text(d.label||'',W-M,20,{align:'right'});
  doc.setFontSize(7); doc.setTextColor(255,200,200);
  doc.text('Généré le '+new Date().toLocaleDateString('fr-FR'),W-M,26,{align:'right'});
  y=38;
  doc.setTextColor(50,50,50);
  const kpis=isH?[{l:'CA Hebdomadaire',v:fmt(d.ca)+' FCFA'},{l:'Dépenses',v:fmt(d.dep)+' FCFA'},{l:'Résultat net',v:fmt(d.net)+' FCFA'},{l:'Jours actifs',v:d.jours+'/5'}]:[{l:'CA Mensuel',v:fmt(d.ca)+' FCFA'},{l:'Dépenses',v:fmt(d.dep)+' FCFA'},{l:'Résultat net',v:fmt(d.net)+' FCFA'},{l:'Obj. atteint',v:Math.round(d.ca/d.objCA*100)+'%'}];
  const kw=CW/4;
  kpis.forEach((k,i)=>{
    const x=M+i*kw;
    doc.setFillColor(248,248,248); doc.roundedRect(x,y,kw-2,18,2,2,'F');
    doc.setDrawColor(230,230,230); doc.roundedRect(x,y,kw-2,18,2,2,'S');
    doc.setFontSize(7); doc.setTextColor(130,130,130); doc.text(k.l,x+(kw-2)/2,y+6,{align:'center'});
    doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.setTextColor(40,40,40); doc.text(k.v,x+(kw-2)/2,y+14,{align:'center'});
    doc.setFont(undefined,'normal');
  });
  y+=24;
  function section(title){if(y>240){doc.addPage();y=M;}doc.setFontSize(10);doc.setFont(undefined,'bold');doc.setTextColor(192,57,43);doc.text(title,M,y);y+=6;}
  function tbl(hdr,rows,cw,footer){
    if(y>250){doc.addPage();y=M;}
    const rh=6.5;
    doc.setFillColor(50,50,50); doc.rect(M,y,CW,rh,'F');
    doc.setFontSize(7); doc.setFont(undefined,'bold'); doc.setTextColor(255,255,255);
    let x=M+2; hdr.forEach((h,i)=>{doc.text(h,x,y+4.5);x+=cw[i];}); y+=rh;
    rows.forEach((r,ri)=>{
      if(y>270){doc.addPage();y=M;}
      doc.setFillColor(ri%2===0?255:249,ri%2===0?255:249,ri%2===0?255:249);
      doc.rect(M,y,CW,rh,'F');
      doc.setFont(undefined,'normal'); doc.setFontSize(7.5); doc.setTextColor(40,40,40);
      x=M+2; r.forEach((c,ci)=>{const s=String(c||'');doc.text(s.length>40?s.slice(0,40)+'...':s,x,y+4.5);x+=cw[ci];}); y+=rh;
    });
    if(footer){
      doc.setFillColor(235,235,235); doc.rect(M,y,CW,rh,'F');
      doc.setFont(undefined,'bold'); doc.setFontSize(7.5); doc.setTextColor(40,40,40);
      x=M+2; footer.forEach((c,ci)=>{doc.text(String(c||''),x,y+4.5);x+=cw[ci];}); y+=rh;
    }
    doc.setDrawColor(210,210,210); doc.rect(M,y-rh*(rows.length+(footer?1:0)+1),CW,rh*(rows.length+(footer?1:0)+1),'S');
    y+=5;
  }
  if(isH){
    section('1. Récapitulatif des ventes par jour');
    tbl(['Date','CA (FCFA)','% CA','Dépenses (FCFA)','Solde net (FCFA)'],d.days.map(x=>[x.d,fmt(x.ca),Math.round(x.ca/d.ca*100)+'%',x.dep>0?fmt(x.dep):'—',fmt(x.ca-x.dep)]),[38,34,16,40,40],['TOTAL',fmt(d.ca),'100%',fmt(d.dep),fmt(d.net)]);
    section('2. Dépenses de la semaine');
    tbl(['Date','Désignation','Montant (FCFA)'],d.depenses.map(x=>[x.d,x.des,fmt(x.amt)]),[25,115,40],['','TOTAL',fmt(d.dep)]);
    if(d.prodSynth&&d.prodSynth.length){section('3. Synthèse des ventes par produit');tbl(['#','Produit','Qté','CA (FCFA)','% CA'],d.prodSynth.map((p,i)=>[String(i+1),p.n,String(p.qte),fmt(p.ca),Math.round(p.ca/d.ca*100)+'%']),[8,90,14,42,20],['','TOTAL','',fmt(d.ca),'100%']);}
    section(d.prodSynth&&d.prodSynth.length?'4. Suivi des objectifs':'3. Suivi des objectifs');
    const pct=Math.round(d.ca/d.objCA*100);
    tbl(['Indicateur','Objectif (FCFA)','Réalisé (FCFA)','Écart (FCFA)','Taux','Statut'],[['CA Hebdomadaire',fmt(d.objCA),fmt(d.ca),(d.ca>=d.objCA?'+':'')+fmt(d.ca-d.objCA),pct+'%',pct>=100?'Atteint':pct>=80?'Proche':'Non atteint'],['Résultat Net',fmt(Math.round(d.objCA*0.875)),fmt(d.net),'',Math.round(d.net/(d.objCA*0.875)*100)+'%',d.net>=d.objCA*0.875?'Atteint':'À améliorer'],['Dépenses (max)','100 000',fmt(d.dep),'-'+fmt(100000-d.dep),Math.round(d.dep/100000*100)+'%',d.dep<=100000?'Respecté':'Dépassé']],[45,28,28,28,14,33],null);
  } else {
    section('1. Récapitulatif par semaine');
    tbl(['Semaine','CA (FCFA)','Dépenses','Résultat net','% CA','Statut'],d.weeks.map(w=>[w.s+' — '+w.p,fmt(w.ca),fmt(w.dep),fmt(w.net),Math.round(w.ca/d.ca*100)+'%',w.ca>=(d.objCA/4)?'OK':'Sous obj.']),[45,30,26,28,14,33],['TOTAL',fmt(d.ca),fmt(d.dep),fmt(d.net),'100%','']);
    section('2. Dépenses par catégorie');
    tbl(['Catégorie','Montant (FCFA)','% Dépenses'],d.depByCat.map(x=>[x.cat,fmt(x.amt),Math.round(x.amt/d.dep*100)+'%']),[100,50,30],['TOTAL',fmt(d.dep),'100%']);
    section('3. Synthèse des ventes par produit (Top 5)');
    tbl(['Rang','Produit','CA (FCFA)','% CA mensuel'],d.topProds.map((p,i)=>[String(i+1)+'.',p.n.length>38?p.n.slice(0,38)+'...':p.n,fmt(p.ca),Math.round(p.ca/d.ca*100)+'%']),[10,105,40,25],['','TOTAL top 5',fmt(d.topProds.reduce((a,p)=>a+p.ca,0)),Math.round(d.topProds.reduce((a,p)=>a+p.ca,0)/d.ca*100)+'%']);
    section('4. Suivi des objectifs');
    const pct2=Math.round(d.ca/d.objCA*100),netObj=Math.round(d.objCA*0.98),netPct=Math.round(d.net/netObj*100),depPct=Math.round(d.dep/250000*100);
    tbl(['Indicateur','Objectif','Réalisé','Écart','Taux','Statut'],[['CA Mensuel',fmt(d.objCA)+' FCFA',fmt(d.ca)+' FCFA',(d.ca>=d.objCA?'+':'')+fmt(d.ca-d.objCA),pct2+'%',pct2>=100?'Atteint':pct2>=80?'Proche':'Non atteint'],['Résultat Net',fmt(netObj)+' FCFA',fmt(d.net)+' FCFA',(d.net>=netObj?'+':'')+fmt(d.net-netObj),netPct+'%',netPct>=100?'Atteint':netPct>=80?'Proche':'Non atteint'],['Dépenses (max)','250 000 FCFA',fmt(d.dep)+' FCFA',(d.dep<=250000?'-':'+')+fmt(Math.abs(d.dep-250000)),depPct+'%',depPct<=100?'Budget OK':'Dépassé']],[42,32,28,26,12,36],null);
  }
  const pages=doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFillColor(245,245,245);doc.rect(0,287,W,10,'F');doc.setFontSize(6.5);doc.setTextColor(150,150,150);doc.text('Mirr Oils — Distribution Huiles Moteur & Lubrifiants — Lomé, Togo',M,293);doc.text(`Page ${i}/${pages}`,W-M,293,{align:'right'});}
  doc.save((isH?'Mirr_Oils_Hebdo_':'Mirr_Oils_Mensuel_')+key+'.pdf');
  toast('PDF généré et téléchargé !','success');
}

function generateReceiptPDF() {
  const {jsPDF}=window.jspdf;
  const E=window.ENTREPRISE||{};
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:[80,170]});
  const num=document.getElementById('rNum').textContent, prod=document.getElementById('rProd').textContent;
  const qty=document.getElementById('rQty').textContent, unit=document.getElementById('rUnit').textContent;
  const type=document.getElementById('rType').textContent, client=document.getElementById('rClient').textContent;
  const total=document.getElementById('rTotal').textContent, date=document.getElementById('rDate').textContent;
  const moyen=document.getElementById('rMoyen').textContent;
  const statut=document.getElementById('rStatut').textContent;
  const resteVisible=document.getElementById('rResteLine').style.display!=='none';
  const reste=document.getElementById('rReste').textContent;
  const cliPhoneVisible=document.getElementById('rClientPhoneLine').style.display!=='none';
  const cliPhone=document.getElementById('rClientPhone').textContent;
  let y=8;
  doc.setFillColor(192,57,43); doc.rect(0,0,80,18,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(12); doc.setFont(undefined,'bold');
  doc.text((E.nom||'Mirr Oils').toUpperCase(),40,8,{align:'center'});
  doc.setFontSize(6.5); doc.setFont(undefined,'normal');
  if(E.slogan) doc.text(E.slogan,40,12,{align:'center'});
  doc.text([E.adresse,E.tel].filter(Boolean).join(' — '),40,15.5,{align:'center'});
  y=24; doc.setTextColor(50,50,50); doc.setFontSize(7);
  doc.text('N° '+num,10,y); doc.text('Date: '+date,70,y,{align:'right'}); y+=5;
  doc.setDrawColor(200); doc.line(10,y,70,y); y+=4;
  const rows=[['Produit:',prod.length>22?prod.slice(0,22)+'...':prod],['Quantite:',String(qty)],['Prix unitaire:',unit],['Type:',type],['Client:',client]];
  if(cliPhoneVisible) rows.push(['Tel. client:',cliPhone]);
  rows.push(['Moyen paiement:',moyen]);
  rows.forEach(([l,v])=>{
    doc.setFont(undefined,'bold'); doc.text(l,10,y);
    doc.setFont(undefined,'normal'); doc.text(v,70,y,{align:'right'}); y+=5;
  });
  y+=2; doc.line(10,y,70,y); y+=4;
  doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.setTextColor(192,57,43);
  doc.text('TOTAL: '+total,40,y,{align:'center'}); y+=6;
  // Statut + reste
  doc.setFontSize(8);
  doc.setTextColor(statut.indexOf('NON')>=0?192:30, statut.indexOf('NON')>=0?0:132, statut.indexOf('NON')>=0?0:73);
  doc.text('Statut: '+statut,40,y,{align:'center'}); y+=5;
  if(resteVisible){ doc.setTextColor(192,0,0); doc.text('Reste a payer: '+reste,40,y,{align:'center'}); y+=5; }
  y+=2;
  doc.setFontSize(7); doc.setTextColor(140,140,140); doc.setFont(undefined,'normal');
  doc.text('Merci pour votre confiance !',40,y,{align:'center'}); y+=4;
  const f2=[E.tel,E.email].filter(Boolean).join(' -- '); if(f2){doc.text(f2,40,y,{align:'center'}); y+=4;}
  const f3=[E.nif?'NIF: '+E.nif:'',E.rccm?'RCCM: '+E.rccm:''].filter(Boolean).join(' -- '); if(f3){doc.text(f3,40,y,{align:'center'}); y+=4;}
  doc.save('Recu_'+num+'.pdf');
  toast('Recu PDF telecharge !','success');
}

// ============================================================
// TRÉSORERIE — comptes + mouvements (auto depuis ventes/dépenses)
// Soldes DÉRIVÉS : solde = soldeInitial + ventes(entrées) - dépenses(sorties)
//                  + mouvements manuels (dépôts, transferts, ajustements)
// ============================================================
const COMPTE_TYPES = { caisse:'Caisse', tmoney:'Tmoney', flooz:'Flooz', banque:'Banque', autre:'Autre' };
const COMPTE_ICON  = { caisse:'ti-cash', tmoney:'ti-device-mobile', flooz:'ti-device-mobile', banque:'ti-building-bank', autre:'ti-wallet' };
let editingCompteId=null;

/** Crée les comptes par défaut (Caisse, Tmoney, Flooz, Banque) si aucun n'existe. */
function ensureDefaultComptes() {
  if(window.DB.comptes && window.DB.comptes.length) return;
  window.DB.comptes=[
    {id:window.DB.nextId++,name:'Caisse',type:'caisse',soldeInitial:0,note:''},
    {id:window.DB.nextId++,name:'Tmoney',type:'tmoney',soldeInitial:0,note:''},
    {id:window.DB.nextId++,name:'Flooz', type:'flooz', soldeInitial:0,note:''},
    {id:window.DB.nextId++,name:'Banque',type:'banque',soldeInitial:0,note:''}
  ];
  _syncAndSave();
}
/** Id du compte par défaut (le premier, en général la Caisse). */
function defaultCompteId() {
  return (window.DB.comptes && window.DB.comptes[0]) ? window.DB.comptes[0].id : null;
}
function compteName(id){const c=window.DB.comptes.find(x=>x.id===id);return c?c.name:'—';}

/** Solde courant d'un compte = initial + entrées - sorties (ventes, dépenses, manuels, transferts). */
function getCompteSolde(compteId) {
  const c=window.DB.comptes.find(x=>x.id===compteId);
  if(!c) return 0;
  let s=c.soldeInitial||0;
  const def=defaultCompteId();
  window.DB.sales.forEach(v=>{ if((v.compteId||def)===compteId && (v.statut||'paye')==='paye') s+=v.amount; });   // encaissements ventes PAYÉES
  window.DB.depenses.forEach(d=>{ if((d.compteId||def)===compteId) s-=d.amount; });      // décaissements dépenses
  (window.DB.tresorerie||[]).forEach(m=>{
    if(m.sens==='entree'  && m.compteId===compteId) s+=m.amount;
    else if(m.sens==='sortie' && m.compteId===compteId) s-=m.amount;
    else if(m.sens==='transfert'){ if(m.compteId===compteId) s-=m.amount; if(m.toCompteId===compteId) s+=m.amount; }
  });
  return s;
}

/** Liste unifiée des mouvements (ventes + dépenses + manuels), triée par date décroissante. */
function buildTresoMouvements() {
  const def=defaultCompteId();
  const list=[];
  window.DB.sales.forEach(v=>{ if((v.statut||'paye')!=='paye') return;   // seules les ventes payées entrent en trésorerie
    list.push({date:v.date,compteId:v.compteId||def,sens:'entree',amount:v.amount,motif:'Vente — '+v.prod,source:'Vente',srcType:'vente',refId:v.id}); });
  window.DB.depenses.forEach(d=>list.push({date:d.date,compteId:d.compteId||def,sens:'sortie',amount:d.amount,motif:d.desig||d.cat,source:'Dépense',srcType:'depense',refId:d.id}));
  (window.DB.tresorerie||[]).forEach(m=>{
    if(m.sens==='transfert'){
      list.push({date:m.date,compteId:m.compteId,sens:'sortie',amount:m.amount,motif:(m.motif||'Transfert')+' → '+compteName(m.toCompteId),source:'Transfert',srcType:'manuel',refId:m.id});
      list.push({date:m.date,compteId:m.toCompteId,sens:'entree',amount:m.amount,motif:(m.motif||'Transfert')+' ← '+compteName(m.compteId),source:'Transfert',srcType:'manuel',refId:m.id});
    } else {
      list.push({date:m.date,compteId:m.compteId,sens:m.sens,amount:m.amount,motif:m.motif||(m.sens==='entree'?'Entrée':'Sortie'),source:'Manuel',srcType:'manuel',refId:m.id});
    }
  });
  list.sort((a,b)=> a.date<b.date?1 : a.date>b.date?-1 : 0);
  return list;
}

/** Remplit tous les <select> de comptes (ventes, dépenses, filtres, transferts). */
function fillCompteSelectors() {
  const opts=window.DB.comptes.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  ['vCompte','dCompte','mvCompte','mvTo'].forEach(id=>{const e=document.getElementById(id); if(e){const cur=e.value; e.innerHTML=opts; if(cur)e.value=cur;}});
  const f=document.getElementById('fTresoCompte');
  if(f){const cur=f.value; f.innerHTML='<option value="">Tous les comptes</option>'+opts; if(cur)f.value=cur;}
}

/** Page Trésorerie : KPIs + cartes comptes + tableau des mouvements. */
function renderTresorerie() {
  ensureDefaultComptes();
  fillCompteSelectors();
  const total=window.DB.comptes.reduce((a,c)=>a+getCompteSolde(c.id),0);
  const totIn=window.DB.sales.filter(v=>(v.statut||'paye')==='paye').reduce((a,v)=>a+v.amount,0)+(window.DB.tresorerie||[]).filter(m=>m.sens==='entree').reduce((a,m)=>a+m.amount,0);
  const totOut=window.DB.depenses.reduce((a,d)=>a+d.amount,0)+(window.DB.tresorerie||[]).filter(m=>m.sens==='sortie').reduce((a,m)=>a+m.amount,0);
  document.getElementById('treso-total').textContent=fmt(total);
  document.getElementById('treso-in').textContent=fmt(totIn);
  document.getElementById('treso-out').textContent=fmt(totOut);
  document.getElementById('treso-count').textContent=window.DB.comptes.length;

  const cards=document.getElementById('comptesCards');
  if(cards){
    cards.innerHTML=window.DB.comptes.map(c=>{
      const solde=getCompteSolde(c.id);
      const icon=COMPTE_ICON[c.type]||'ti-wallet';
      return `<div class="metric" style="position:relative">
        <div class="metric-label"><i class="ti ${icon}"></i> ${c.name} <span class="badge b-default" style="margin-left:4px">${COMPTE_TYPES[c.type]||c.type}</span></div>
        <div class="metric-value ${solde<0?'text-danger':''}">${fmt(solde)}</div>
        <div class="metric-sub">XOF</div>
        <div style="position:absolute;top:8px;right:8px;display:flex;gap:4px">
          <button class="btn btn-xs" onclick="editCompte(${c.id})" title="Modifier"><i class="ti ti-edit"></i></button>
          <button class="btn btn-xs btn-danger-outline" onclick="deleteCompte(${c.id})" title="Supprimer"><i class="ti ti-trash"></i></button>
        </div>
      </div>`;
    }).join('');
  }

  const fc=document.getElementById('fTresoCompte').value;
  const fsens=document.getElementById('fTresoSens').value;
  const ffrom=document.getElementById('fTresoFrom').value;
  const fto=document.getElementById('fTresoTo').value;
  let rows=buildTresoMouvements();
  if(fc) rows=rows.filter(r=>String(r.compteId)===fc);
  if(fsens) rows=rows.filter(r=>r.sens===fsens);
  if(ffrom) rows=rows.filter(r=>r.date>=ffrom);
  if(fto) rows=rows.filter(r=>r.date<=fto);
  const body=document.getElementById('tresoBody'), empty=document.getElementById('tresoEmpty');
  if(!rows.length){body.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  body.innerHTML=rows.map(r=>{
    const sensBadge=r.sens==='entree'?'<span class="badge b-success">Entrée</span>':'<span class="badge b-danger">Sortie</span>';
    const cls=r.sens==='entree'?'text-success':'text-danger';
    const sign=r.sens==='entree'?'+':'-';
    const del=r.srcType==='manuel'?`<button class="btn btn-xs" onclick="editMouvement(${r.refId})" title="Modifier"><i class="ti ti-edit"></i></button><button class="btn btn-xs btn-danger-outline" onclick="deleteMouvement(${r.refId})" title="Supprimer"><i class="ti ti-trash"></i></button>`:'<span class="text-muted fs-11">auto</span>';
    return `<tr><td>${fmtD(r.date)}</td><td>${compteName(r.compteId)}</td><td>${sensBadge}</td><td>${r.motif}</td><td><span class="badge b-default">${r.source}</span></td><td class="text-right num ${cls} fw-600">${sign}${fmt(r.amount)}</td><td class="text-center">${del}</td></tr>`;
  }).join('');
}

/** Efface la plage de dates du filtre des mouvements. */
function resetTresoDates(){
  document.getElementById('fTresoFrom').value='';
  document.getElementById('fTresoTo').value='';
  renderTresorerie();
}

// ---- CRUD moyens de trésorerie ----
function openCompte(){
  editingCompteId=null;
  document.getElementById('compteModalTitle').textContent='Nouveau moyen de trésorerie';
  document.getElementById('coName').value='';
  document.getElementById('coType').value='caisse';
  document.getElementById('coSolde').value='0';
  document.getElementById('coNote').value='';
  openModal('modalCompte');
}
function editCompte(id){
  const c=window.DB.comptes.find(x=>x.id===id); if(!c){toast('Compte introuvable','error');return;}
  editingCompteId=id;
  document.getElementById('compteModalTitle').textContent='Modifier le moyen';
  document.getElementById('coName').value=c.name;
  document.getElementById('coType').value=c.type;
  document.getElementById('coSolde').value=c.soldeInitial||0;
  document.getElementById('coNote').value=c.note||'';
  openModal('modalCompte');
}
function saveCompte(){
  const name=document.getElementById('coName').value.trim();
  if(!name){toast('Nom obligatoire','error');return;}
  const fields={name,type:document.getElementById('coType').value,soldeInitial:parseFloat(document.getElementById('coSolde').value)||0,note:document.getElementById('coNote').value};
  if(editingCompteId){
    const c=window.DB.comptes.find(x=>x.id===editingCompteId); if(c) Object.assign(c,fields);
    toast('Moyen modifié !','success');
  } else {
    window.DB.comptes.push({id:window.DB.nextId++,...fields});
    toast('Moyen ajouté !','success');
  }
  _syncAndSave();
  closeModal('modalCompte'); fillCompteSelectors(); renderTresorerie();
}
function deleteCompte(id){
  const def=defaultCompteId();
  const used=window.DB.sales.some(v=>(v.compteId||def)===id)||window.DB.depenses.some(d=>(d.compteId||def)===id)||(window.DB.tresorerie||[]).some(m=>m.compteId===id||m.toCompteId===id);
  if(used){toast('Impossible : ce moyen est utilisé par des ventes / dépenses / mouvements','error');return;}
  if(window.DB.comptes.length<=1){toast('Au moins un moyen de trésorerie est requis','error');return;}
  if(!confirm('Supprimer ce moyen de trésorerie ?'))return;
  window.DB.comptes=window.DB.comptes.filter(c=>c.id!==id);
  _syncAndSave(); fillCompteSelectors(); renderTresorerie(); toast('Moyen supprimé','success');
}

// ---- Mouvements manuels (dépôt, retrait, transfert) ----
let editingMouvementId=null;

function onMvSensChange(){
  const sens=document.getElementById('mvSens').value;
  const toWrap=document.getElementById('mvToWrap');
  const lbl=document.getElementById('mvCompteLbl');
  if(sens==='transfert'){toWrap.style.display='block';lbl.innerHTML='Compte source <span class="req">*</span>';}
  else{toWrap.style.display='none';lbl.innerHTML='Compte <span class="req">*</span>';}
}
function openMouvement(){
  if(!window.DB.comptes.length){toast('Créez d\'abord un moyen de trésorerie','error');return;}
  editingMouvementId=null;
  document.getElementById('mvModalTitle').textContent='Nouveau mouvement';
  fillCompteSelectors();
  document.getElementById('mvSens').value='entree';
  document.getElementById('mvDate').value=new Date().toISOString().slice(0,10);
  document.getElementById('mvAmount').value='';
  document.getElementById('mvMotif').value='';
  onMvSensChange();
  openModal('modalMouvement');
}
/** Ouvre le formulaire pré-rempli pour modifier un mouvement MANUEL existant. */
function editMouvement(id){
  const m=(window.DB.tresorerie||[]).find(x=>x.id===id);
  if(!m){toast('Mouvement introuvable','error');return;}
  editingMouvementId=id;
  document.getElementById('mvModalTitle').textContent='Modifier le mouvement';
  fillCompteSelectors();
  document.getElementById('mvSens').value=m.sens;
  document.getElementById('mvDate').value=m.date;
  document.getElementById('mvAmount').value=m.amount;
  document.getElementById('mvMotif').value=m.motif||'';
  document.getElementById('mvCompte').value=m.compteId;
  onMvSensChange();
  if(m.sens==='transfert') document.getElementById('mvTo').value=m.toCompteId;
  openModal('modalMouvement');
}
function saveMouvement(){
  const sens=document.getElementById('mvSens').value;
  const date=document.getElementById('mvDate').value;
  const amount=parseFloat(document.getElementById('mvAmount').value)||0;
  const motif=document.getElementById('mvMotif').value;
  const compteId=parseInt(document.getElementById('mvCompte').value);
  if(amount<=0||!date){toast('Montant (>0) et date obligatoires','error');return;}
  let rec={date,sens,compteId,amount,motif};
  if(sens==='transfert'){
    const toCompteId=parseInt(document.getElementById('mvTo').value);
    if(toCompteId===compteId){toast('Choisissez deux comptes différents','error');return;}
    rec.toCompteId=toCompteId;
  }
  if(editingMouvementId){
    const m=window.DB.tresorerie.find(x=>x.id===editingMouvementId);
    if(m){ delete m.toCompteId; Object.assign(m, rec); }   // delete d'abord (cas transfert -> entrée/sortie)
    toast('Mouvement modifié !','success');
  } else {
    window.DB.tresorerie.unshift({id:window.DB.nextId++,...rec});
    toast('Mouvement enregistré !','success');
  }
  editingMouvementId=null;
  _syncAndSave(); closeModal('modalMouvement'); renderTresorerie();
}
function deleteMouvement(id){
  if(!confirm('Supprimer ce mouvement ?'))return;
  window.DB.tresorerie=window.DB.tresorerie.filter(m=>m.id!==id);
  _syncAndSave(); renderTresorerie(); toast('Mouvement supprimé','success');
}

// ============================================================
// OBJECTIFS & PARAMETRES — avec persistance JSON
// ============================================================
/**
 * Synchronise tout l'UI des objectifs depuis OBJ (chargé depuis data.json).
 * Met à jour l'affichage (page Objectifs) ET les champs des formulaires
 * (modal Objectifs + Paramètres) — plus aucune valeur codée en dur.
 */
function syncObjectifsUI() {
  const setT=(id,v)=>{const e=document.getElementById(id); if(e) e.textContent=fmt(v);};
  setT('obj-ca-m',OBJ.caM); setT('obj-ca-h',OBJ.caH); setT('obj-dep',OBJ.depMax);
  const setV=(id,v)=>{const e=document.getElementById(id); if(e) e.value=v;};
  setV('oCAM',OBJ.caM); setV('oCAH',OBJ.caH); setV('oDep',OBJ.depMax);
  setV('sObjCAM',OBJ.caM); setV('sObjCAH',OBJ.caH); setV('sObjDep',OBJ.depMax);
  renderObjectifsSuivi();
  renderObjectifsMois();
}

/** Suivi semaine par semaine : objectif (spécifique ou global) éditable vs CA réel. */
function renderObjectifsSuivi() {
  const body=document.getElementById('objSuiviBody');
  if(!body)return;
  const weeks=_weeksWithData();   // lundis ayant des données (récent → ancien)
  if(!weeks.length){body.innerHTML='<tr><td colspan="5" class="text-center text-muted" style="padding:16px">Aucune donnée</td></tr>';return;}
  body.innerHTML=weeks.slice().reverse().map(mon=>{   // ordre chronologique
    const d=computeWeekData(mon);
    const obj=d.objCA||0;
    const ca=d.ca, ecart=ca-obj, taux=obj?Math.round(ca/obj*100):0;
    const badge=taux>=100?'b-success':taux>=80?'b-warning':'b-danger';
    const ec=ecart>=0?'text-success':'text-danger';
    const perso=hasWeekObjectif(mon);
    const lbl=d.label.split(' — ')[0]+' - '+fmtD(mon);
    const objCell=`<input type="number" value="${obj}" onchange="setWeekObjectif('${mon}',this.value)" style="width:120px;text-align:right" title="${perso?'Objectif spécifique':'Objectif global par défaut'}">${perso?' <span class="badge b-warning" style="font-size:9px">perso</span>':''}`;
    return `<tr><td>${lbl}</td><td class="text-right">${objCell}</td><td class="text-right num ${ca>=obj?'fw-600':''}">${fmt(ca)}</td><td class="text-right num ${ec}">${ecart>=0?'+':''}${fmt(ecart)}</td><td class="text-right"><span class="badge ${badge}">${taux}%</span></td></tr>`;
  }).join('');
}

/** Suivi mois par mois : objectif (spécifique ou global) éditable vs CA réel. */
function renderObjectifsMois() {
  const body=document.getElementById('objMoisBody');
  if(!body)return;
  const months=_monthsWithData();   // mois ayant des données (récent → ancien)
  if(!months.length){body.innerHTML='<tr><td colspan="5" class="text-center text-muted" style="padding:16px">Aucune donnée</td></tr>';return;}
  body.innerHTML=months.slice().reverse().map(mk=>{   // ordre chronologique
    const d=computeMonthData(mk);
    const obj=d.objCA||0;
    const ca=d.ca, ecart=ca-obj, taux=obj?Math.round(ca/obj*100):0;
    const badge=taux>=100?'b-success':taux>=80?'b-warning':'b-danger';
    const ec=ecart>=0?'text-success':'text-danger';
    const perso=hasMonthObjectif(mk);
    const objCell=`<input type="number" value="${obj}" onchange="setMonthObjectif('${mk}',this.value)" style="width:130px;text-align:right" title="${perso?'Objectif spécifique':'Objectif global par défaut'}">${perso?' <span class="badge b-warning" style="font-size:9px">perso</span>':''}`;
    return `<tr><td>${d.label}</td><td class="text-right">${objCell}</td><td class="text-right num ${ca>=obj?'fw-600':''}">${fmt(ca)}</td><td class="text-right num ${ec}">${ecart>=0?'+':''}${fmt(ecart)}</td><td class="text-right"><span class="badge ${badge}">${taux}%</span></td></tr>`;
  }).join('');
}

function saveObjectifs() {
  OBJ.caM=parseFloat(document.getElementById('oCAM').value)||OBJ.caM;
  OBJ.caH=parseFloat(document.getElementById('oCAH').value)||OBJ.caH;
  OBJ.depMax=parseFloat(document.getElementById('oDep').value)||OBJ.depMax;
  syncObjectifsUI();
  _syncAndSave();
  closeModal('modalObjectif'); toast('Objectifs mis a jour !','success');
}
function switchParam(p,el) {
  document.querySelectorAll('#page-parametres .tab-item').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  ['general','apparence','categories'].forEach(id=>{const e=document.getElementById('param-'+id);if(e)e.style.display=(id===p)?'block':'none';});
}
function saveSettings() {
  // Coordonnées entreprise
  const v=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  ENTREPRISE.nom    = v('sName')||'Mirr Oils';
  ENTREPRISE.slogan = v('sSlogan');
  ENTREPRISE.tel    = v('sTel');
  ENTREPRISE.email  = v('sEmail');
  ENTREPRISE.adresse= v('sAdresse');
  ENTREPRISE.nif    = v('sNif');
  ENTREPRISE.rccm   = v('sRccm');
  applyEntreprise();
  // Objectifs
  OBJ.caM=parseFloat(document.getElementById('sObjCAM').value)||OBJ.caM;
  OBJ.caH=parseFloat(document.getElementById('sObjCAH').value)||OBJ.caH;
  OBJ.depMax=parseFloat(document.getElementById('sObjDep').value)||OBJ.depMax;
  syncObjectifsUI();
  _syncAndSave();
  toast('Parametres sauvegardes !','success');
}

/** Applique le nom de l'entreprise à l'interface (logo, titre). */
function applyEntreprise() {
  const n=ENTREPRISE.nom||'Mirr Oils';
  const an=document.getElementById('appName'); if(an) an.textContent=n;
  const lm=document.getElementById('logoMark'); if(lm) lm.textContent=n.charAt(0).toUpperCase();
  document.title=n+' -- Gestion Commerciale';
}

/** Pré-remplit les champs Paramètres entreprise depuis ENTREPRISE. */
function syncEntrepriseUI() {
  const set=(id,val)=>{const e=document.getElementById(id); if(e) e.value=val||'';};
  set('sName',ENTREPRISE.nom); set('sSlogan',ENTREPRISE.slogan); set('sTel',ENTREPRISE.tel);
  set('sEmail',ENTREPRISE.email); set('sAdresse',ENTREPRISE.adresse); set('sNif',ENTREPRISE.nif); set('sRccm',ENTREPRISE.rccm);
  applyEntreprise();
}
function addCategoryPrompt() {
  const n=prompt('Nom de la nouvelle categorie :');
  if(n&&n.trim()&&!CATEGORIES.includes(n.trim())){
    CATEGORIES.push(n.trim());
    _syncAndSave();
    renderCatList(); populateDepCat(); toast('Categorie ajoutee !','success');
  }
}
function removeCategory(name) {
  const idx=CATEGORIES.indexOf(name);
  if(idx>=0){
    CATEGORIES.splice(idx,1);
    _syncAndSave();
    renderCatList(); populateDepCat(); toast('Supprimee','success');
  }
}
function renderCatList() {
  const el=document.getElementById('catListParam'); if(!el)return;
  el.innerHTML=CATEGORIES.map(c=>`<div class="flex-between" style="padding:12px 0;border-bottom:1px solid var(--border)"><div class="flex gap-8"><i class="ti ti-tag" style="color:var(--primary)"></i><span>${c}</span></div><button class="btn btn-xs btn-danger-outline" onclick="removeCategory('${c}')"><i class="ti ti-trash"></i></button></div>`).join('');
}

// ============================================================
// INIT PRINCIPALE — appelée par storage.js après chargement
// ============================================================
function appInit() {
  // Restaure l'apparence memorisee (theme + couleur)
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) setTheme(savedTheme);
    const rawColor = localStorage.getItem(COLOR_KEY);
    if (rawColor) {
      const {c,cd} = JSON.parse(rawColor);
      document.documentElement.style.setProperty('--primary',c);
      document.documentElement.style.setProperty('--primary-dark',cd||c);
      document.documentElement.style.setProperty('--primary-bg',hexRgba(c,.09));
      const hex=document.getElementById('customColorHex'), inp=document.getElementById('customColor');
      if(hex) hex.value=c;
      if(inp) inp.value=c;
      document.querySelectorAll('.color-swatch').forEach(s=>s.classList.toggle('selected', s.dataset.c===c));
    }
  } catch(e) {}

  ensureDefaultTypes();
  fillTypeSelectors();
  renderClientTabs();
  ensureDefaultComptes();
  fillCompteSelectors();
  fillProductOptions();
  fillClientDropdown();
  populateDepCat();
  renderCatList();
  renderSales(); updateSaleStats();
  renderDepenses(); updateDepStats();
  renderClients(); updateClientCounts();
  renderProduits();
  refreshDashboard();
  syncObjectifsUI();
  syncEntrepriseUI();
  loadWeekReport();
  loadMonthReport();

  // Restaure la dernière page consultée (ou dashboard par défaut)
  let savedPage = 'dashboard';
  try { savedPage = localStorage.getItem(PAGE_KEY) || 'dashboard'; } catch(e) {}
  if (!document.getElementById('page-' + savedPage)) savedPage = 'dashboard';
  navigate(savedPage);

  // Retire le style de boot temporaire (navigate a pose les vraies classes .active)
  const bootStyle = document.getElementById('_bootPage');
  if (bootStyle) bootStyle.remove();

  // Écrit le mot de passe dans data.json s'il n'y est pas encore (une seule fois)
  if (window._storageData && window._storageData.password == null) _syncAndSave();
}

// ============================================================
// VERROUILLAGE — mot de passe d'accès (défaut 1234), session 1h en localStorage
// ============================================================
const AUTH_KEY='mirroils_auth';   // horodatage de la dernière connexion (session, OK en localStorage)
const AUTH_TTL=3600000;           // durée de session : 1 heure (ms)

// Mot de passe : UNIQUEMENT depuis data.json (APP_PWD) — jamais en localStorage.
function getStoredPwd(){ return (typeof APP_PWD!=='undefined' && APP_PWD) ? APP_PWD : '1234'; }

function _showApp(){ const s=document.getElementById('_appLockStyle'); if(s) s.remove(); }
function _hideApp(){ if(!document.getElementById('_appLockStyle')){ const s=document.createElement('style'); s.id='_appLockStyle'; s.textContent='.app{display:none!important}'; document.head.appendChild(s);} }

/** Tente de déverrouiller avec le mot de passe saisi (lu depuis data.json). */
async function tryUnlock(){
  const inp=document.getElementById('lockPwd');
  const pwd=inp?inp.value:'';
  // Si l'app est déjà chargée, APP_PWD vient de data.json ; sinon on lit data.json directement.
  let real;
  if(window._appStarted && typeof APP_PWD!=='undefined' && APP_PWD) real=APP_PWD;
  else real = window.fetchAccessPassword ? await window.fetchAccessPassword() : '1234';
  if(pwd===real){
    try{ localStorage.setItem(AUTH_KEY,String(Date.now())); }catch(e){}
    const lh=document.getElementById('_lockHide'); if(lh) lh.remove();
    _showApp();                                        // révèle l'application
    const ls=document.getElementById('lockScreen'); if(ls) ls.style.display='none';
    const err=document.getElementById('lockError'); if(err) err.style.display='none';
    if(inp) inp.value='';
    if(window.startApp) window.startApp();             // charge/initialise l'app (1re fois)
  } else {
    const err=document.getElementById('lockError'); if(err) err.style.display='block';
    if(inp){ inp.value=''; inp.focus(); }
  }
}
/** Reverrouille immédiatement (efface la session et masque l'application). */
function lockNow(){
  try{ localStorage.removeItem(AUTH_KEY); }catch(e){}
  const lh=document.getElementById('_lockHide'); if(lh) lh.remove();
  _hideApp();                                          // masque l'application
  const ls=document.getElementById('lockScreen');
  if(ls){ ls.style.display='flex'; const i=document.getElementById('lockPwd'); if(i){ i.value=''; i.focus(); } }
}
/** Vérifie l'expiration de la session : reverrouille si > 1h. */
function checkAuthExpiry(){
  try{ const a=localStorage.getItem(AUTH_KEY); if(!a || (Date.now()-parseInt(a,10))>=AUTH_TTL) lockNow(); }catch(e){}
}
setInterval(checkAuthExpiry, 60000);   // contrôle chaque minute

/** Change le mot de passe d'accès depuis les Paramètres. */
function changePassword(){
  const cur=document.getElementById('pwdCurrent').value;
  const nw =document.getElementById('pwdNew').value;
  const cf =document.getElementById('pwdConfirm').value;
  if(cur!==getStoredPwd()){ toast('Mot de passe actuel incorrect','error'); return; }
  if(!nw || nw.length<4){ toast('Nouveau mot de passe trop court (min. 4)','error'); return; }
  if(nw!==cf){ toast('La confirmation ne correspond pas','error'); return; }
  APP_PWD=nw;                                  // source de vérité (en mémoire)
  _syncAndSave();                              // persiste dans data.json (jamais localStorage)
  ['pwdCurrent','pwdNew','pwdConfirm'].forEach(id=>{const e=document.getElementById(id); if(e)e.value='';});
  toast('Mot de passe modifié !','success');
}

// Au chargement : focus le champ mot de passe si l'écran de verrouillage est visible
(function(){
  const ls=document.getElementById('lockScreen');
  if(ls && getComputedStyle(ls).display!=='none'){
    const i=document.getElementById('lockPwd'); if(i) i.focus();
  }
})();
