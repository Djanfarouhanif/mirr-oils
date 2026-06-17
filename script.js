// ============================================================
// UTILS
// ============================================================
const fmt  = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const fcfa = n => Math.round(n).toLocaleString('fr-FR') + ' FCFA';
const fmtD = iso => { if(!iso)return'--'; const p=iso.split('-'); return p[2]+'/'+p[1]; };
const ptL  = p => ({client:'Client',mecanicien:'Mecanicien',grossiste:'Grossiste',coursier:'Coursier'}[p]||p);
const catBadge = c => { const m={client:'b-client',mecanicien:'b-meca',grossiste:'b-grossiste',coursier:'b-coursier'}; return `<span class="badge ${m[c]||'b-default'}">${ptL(c)}</span>`; };
const getP = (prod,type) => { if(!prod)return 0; return {client:prod.pc,mecanicien:prod.pm,grossiste:prod.pg}[type]||prod.pc||0; };
const hexRgba = (h,a) => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };

// Helper : synchronise DB.nextId vers _storageData puis sauvegarde
function _syncAndSave() {
  if (window._storageData) {
    window._storageData.sales     = DB.sales;
    window._storageData.depenses  = DB.depenses;
    window._storageData.clients   = DB.clients;
    window._storageData.produits  = DB.produits;
    window._storageData.nextId    = DB.nextId;
    window._storageData.objectifs = OBJ;
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
  const T={dashboard:'Tableau de bord',stats:'Statistiques',ventes:'Ventes',depenses:'Depenses',clients:'Repertoire clients',produits:'Catalogue produits',rapports:'Rapports',objectifs:'Objectifs',parametres:'Parametres'};
  document.getElementById('pageTitle').textContent = T[page]||page;
  if(page==='dashboard')  refreshDashboard();
  if(page==='stats')      refreshStats();
  if(page==='ventes')     { renderSales(); updateSaleStats(); }
  if(page==='depenses')   { renderDepenses(); updateDepStats(); }
  if(page==='clients')    { renderClients(); updateClientCounts(); }
  if(page==='produits')   renderProduits();
  if(page==='rapports')   { loadWeekReport(); loadMonthReport(); }
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
  }
  if(id==='modalDepense' && !editingDepId) {
    document.getElementById('dDate').value=new Date().toISOString().slice(0,10);
    ['dCat','dDesig','dAmount','dNote'].forEach(x=>document.getElementById(x).value='');
    document.getElementById('dCat').value='';
  }
}
function closeModal(id) {
  const m=document.getElementById(id);
  if(!m) return;
  m.classList.remove('open');
  setTimeout(()=>{m.style.display='none'},200);
  editingSaleId=null; editingDepId=null;
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
            <button class="btn btn-xs" onclick='showReceipt({prod:${sn},qty:${s.qty},priceType:"${s.priceType}",unitPrice:${s.unitPrice},remise:${s.remise||0},amount:${s.amount},clientName:${scl},date:${sd}})'><i class="ti ti-receipt"></i></button>
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
    return`<div class="product-card" onclick="navigate('produits')">
      <div class="pc-stock dot ${sc}"></div>
      <span class="pc-icon">&#128722;</span>
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
    document.getElementById('vUnitHint').textContent=prod.cond?'Unite: '+prod.cond:'';
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
  if(!prod||!amt){toast('Produit et montant obligatoires','error');return;}

  if(editingSaleId) {
    // UPDATE
    const idx=window.DB.sales.findIndex(s=>s.id===editingSaleId);
    if(idx>=0) window.DB.sales[idx]={...window.DB.sales[idx],date,prod,qty,priceType:pt,unitPrice:unit,remise:rem,clientName:cli,amount:amt,note};
    _syncAndSave();
    toast('Vente modifiee et sauvegardee','success');
  } else {
    // CREATE
    window.DB.sales.unshift({id:window.DB.nextId++,date,prod,qty,priceType:pt,unitPrice:unit,remise:rem,clientName:cli,amount:amt,note});
    _syncAndSave();
    toast('Vente enregistree !','success');
  }
  editingSaleId=null; closeModal('modalVente'); renderSales(); updateSaleStats();
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
  saveSale();
  showReceipt({prod,qty,priceType:pt,unitPrice:unit,remise:rem,amount:amt,clientName:cli,date:fmtD(date)});
}

function showReceipt(s) {
  document.getElementById('rNum').textContent='MO-'+new Date().getFullYear()+'-'+String(window.DB.nextId).padStart(4,'0');
  document.getElementById('rDate').textContent=s.date||'--';
  document.getElementById('rProd').textContent=s.prod||'--';
  document.getElementById('rQty').textContent=s.qty||'--';
  document.getElementById('rUnit').textContent=fmt(s.unitPrice||0)+' XOF';
  document.getElementById('rType').textContent=ptL(s.priceType);
  document.getElementById('rClient').textContent=s.clientName||'--';
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
    calcSaleTotal();
  },60);
}

/** DELETE VENTE + persistance JSON */
function deleteSale(id) {
  if(!confirm('Supprimer cette vente ?'))return;
  window.DB.sales=window.DB.sales.filter(s=>s.id!==id);
  _syncAndSave();
  renderSales(); updateSaleStats(); toast('Vente supprimee','success');
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
    return`<tr><td>${fmtD(s.date)}</td><td>${s.prod}</td><td class="num">${s.qty}</td><td>${catBadge(s.priceType)}</td><td class="num ${s.remise>0?'text-warning':''}">${s.remise>0?'-'+fmt(s.remise):'--'}</td><td>${s.clientName!=='--'?s.clientName:'--'}</td><td class="text-right num fw-600">${fmt(s.amount)}</td>
    <td class="text-center" style="white-space:nowrap">
      <button class="btn btn-xs" onclick='showReceipt({prod:${sn},qty:${s.qty},priceType:"${s.priceType}",unitPrice:${s.unitPrice},remise:${s.remise||0},amount:${s.amount},clientName:${scl},date:${sd}})'><i class="ti ti-receipt"></i></button>
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
  if(!cat||!desig||!amt){toast('Categorie, designation et montant obligatoires','error');return;}

  if(editingDepId) {
    const idx=window.DB.depenses.findIndex(d=>d.id===editingDepId);
    if(idx>=0) window.DB.depenses[idx]={...window.DB.depenses[idx],date,cat,desig,amount:amt,note};
    _syncAndSave();
    toast('Depense modifiee et sauvegardee','success');
  } else {
    window.DB.depenses.unshift({id:window.DB.nextId++,date,cat,desig,amount:amt,note});
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
  tbody.innerHTML=rows.map(d=>`<tr><td>${fmtD(d.date)}</td><td>${d.desig}</td><td><span class="badge b-default">${d.cat}</span></td><td class="text-right num">${fmt(d.amount)}</td>
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

function filterClients(cat,el) {
  document.querySelectorAll('#page-clients .tab-item').forEach(t=>t.classList.remove('active'));
  el.classList.add('active'); window.DB.clientFilter=cat; renderClients();
}
function renderClients() {
  const fs=(document.getElementById('fClientSearch')?.value||'').toLowerCase();
  let rows=window.DB.clients.filter(c=>(!window.DB.clientFilter||c.cat===window.DB.clientFilter)&&(!fs||c.name.toLowerCase().includes(fs)||(c.phone||'').includes(fs)));
  document.getElementById('clientBody').innerHTML=rows.map(c=>`<tr><td><strong>${c.name}</strong></td><td>${catBadge(c.cat)}</td><td>${c.phone||'--'}</td><td>${c.email||'--'}</td><td>${c.addr||'--'}</td><td>${catBadge(c.priceType)}</td><td class="${c.solde>0?'text-danger fw-600':''} num">${c.solde>0?fmt(c.solde):'--'}</td>
  <td class="text-center" style="white-space:nowrap"><button class="btn btn-xs"><i class="ti ti-edit"></i></button><button class="btn btn-xs btn-danger-outline" onclick="deleteClient(${c.id})"><i class="ti ti-trash"></i></button></td></tr>`).join('');
}
function updateClientCounts() {
  const c=window.DB.clients;
  document.getElementById('cntAll').textContent=c.length;
  document.getElementById('cntClient').textContent=c.filter(x=>x.cat==='client').length;
  document.getElementById('cntMeca').textContent=c.filter(x=>x.cat==='mecanicien').length;
  document.getElementById('cntGros').textContent=c.filter(x=>x.cat==='grossiste').length;
  document.getElementById('cntCour').textContent=c.filter(x=>x.cat==='coursier').length;
}

// ============================================================
// PRODUITS — CRUD avec persistance JSON
// ============================================================

/** SAVE PRODUIT + persistance JSON */
function saveProduit() {
  const name=document.getElementById('pName').value;
  const pc=parseFloat(document.getElementById('pPC').value)||0;
  if(!name||!pc){toast('Nom et prix client obligatoires','error');return;}
  window.DB.produits.push({id:window.DB.nextId++,name,cond:document.getElementById('pCond').value,pc,pm:parseFloat(document.getElementById('pPM').value)||0,pg:parseFloat(document.getElementById('pPG').value)||0,unit:document.getElementById('pUnit').value,stock:parseInt(document.getElementById('pStock').value)||0,alerte:parseInt(document.getElementById('pAlerte').value)||0});
  _syncAndSave();
  closeModal('modalProduit'); renderProduits(); fillProductOptions(); toast('Produit ajoute !','success');
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
    return`<tr><td><strong>${p.name}</strong></td><td>${p.cond||'--'}</td><td class="text-right num">${fmt(p.pc)}</td><td class="text-right num">${fmt(p.pm)}</td><td class="text-right num">${fmt(p.pg)}</td><td style="font-size:12px">${sb}</td><td class="text-center" style="white-space:nowrap"><button class="btn btn-xs"><i class="ti ti-edit"></i></button><button class="btn btn-xs btn-danger-outline" onclick="deleteProduit(${p.id})"><i class="ti ti-trash"></i></button></td></tr>`;
  }).join('');
}

// ============================================================
// RAPPORTS (inchangés — données statiques WEEK_DATA/MONTH_DATA)
// ============================================================
function switchReport(type,el) {
  document.querySelectorAll('#page-rapports .tab-item').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('rep-hebdo').style.display=type==='hebdo'?'block':'none';
  document.getElementById('rep-mensuel').style.display=type==='mensuel'?'block':'none';
}
function loadWeekReport() {
  const key=document.getElementById('repWeekSel').value;
  const d=WEEK_DATA[key];
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
  const d=MONTH_DATA[key];
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
  const d=isH?WEEK_DATA[key]:MONTH_DATA[key];
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
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:[80,160]});
  const num=document.getElementById('rNum').textContent, prod=document.getElementById('rProd').textContent;
  const qty=document.getElementById('rQty').textContent, unit=document.getElementById('rUnit').textContent;
  const type=document.getElementById('rType').textContent, client=document.getElementById('rClient').textContent;
  const total=document.getElementById('rTotal').textContent, date=document.getElementById('rDate').textContent;
  let y=8;
  doc.setFillColor(192,57,43); doc.rect(0,0,80,16,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(12); doc.setFont(undefined,'bold');
  doc.text('MIRR OILS',40,8,{align:'center'});
  doc.setFontSize(7); doc.setFont(undefined,'normal');
  doc.text('Distribution Huiles Moteur & Lubrifiants',40,13,{align:'center'});
  y=22; doc.setTextColor(50,50,50); doc.setFontSize(7);
  doc.text('N° '+num,10,y); doc.text('Date: '+date,70,y,{align:'right'}); y+=5;
  doc.setDrawColor(200); doc.line(10,y,70,y); y+=4;
  [['Produit:',prod.length>22?prod.slice(0,22)+'...':prod],['Quantite:',String(qty)],['Prix unitaire:',unit],['Type:',type],['Client:',client]].forEach(([l,v])=>{
    doc.setFont(undefined,'bold'); doc.text(l,10,y);
    doc.setFont(undefined,'normal'); doc.text(v,70,y,{align:'right'}); y+=5;
  });
  y+=2; doc.line(10,y,70,y); y+=4;
  doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.setTextColor(192,57,43);
  doc.text('TOTAL: '+total,40,y,{align:'center'}); y+=8;
  doc.setFontSize(7); doc.setTextColor(140,140,140); doc.setFont(undefined,'normal');
  doc.text('Merci pour votre confiance !',40,y,{align:'center'}); y+=4;
  doc.text('Mirr Oils -- +228 00 00 00 00',40,y,{align:'center'});
  doc.save('Recu_'+num+'.pdf');
  toast('Recu PDF telecharge !','success');
}

// ============================================================
// OBJECTIFS & PARAMETRES — avec persistance JSON
// ============================================================
function saveObjectifs() {
  OBJ.caM=parseFloat(document.getElementById('oCAM').value)||12000000;
  OBJ.caH=parseFloat(document.getElementById('oCAH').value)||3000000;
  OBJ.depMax=parseFloat(document.getElementById('oDep').value)||250000;
  document.getElementById('obj-ca-m').textContent=fmt(OBJ.caM);
  document.getElementById('obj-ca-h').textContent=fmt(OBJ.caH);
  document.getElementById('obj-dep').textContent=fmt(OBJ.depMax);
  _syncAndSave();
  closeModal('modalObjectif'); toast('Objectifs mis a jour !','success');
}
function switchParam(p,el) {
  document.querySelectorAll('#page-parametres .tab-item').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  ['general','apparence','categories'].forEach(id=>{const e=document.getElementById('param-'+id);if(e)e.style.display=(id===p)?'block':'none';});
}
function saveSettings() {
  const n=document.getElementById('sName').value||'Mirr Oils';
  document.getElementById('appName').textContent=n;
  document.getElementById('logoMark').textContent=n.charAt(0).toUpperCase();
  document.title=n+' -- Gestion Commerciale';
  OBJ.caM=parseFloat(document.getElementById('sObjCAM').value)||OBJ.caM;
  OBJ.caH=parseFloat(document.getElementById('sObjCAH').value)||OBJ.caH;
  OBJ.depMax=parseFloat(document.getElementById('sObjDep').value)||OBJ.depMax;
  _syncAndSave();
  toast('Parametres sauvegardes !','success');
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

  fillProductOptions();
  fillClientDropdown();
  populateDepCat();
  renderCatList();
  renderSales(); updateSaleStats();
  renderDepenses(); updateDepStats();
  renderClients(); updateClientCounts();
  renderProduits();
  refreshDashboard();
  loadWeekReport();
  loadMonthReport();

  // Restaure la dernière page consultée (ou dashboard par défaut)
  let savedPage = 'dashboard';
  try { savedPage = localStorage.getItem(PAGE_KEY) || 'dashboard'; } catch(e) {}
  if (!document.getElementById('page-' + savedPage)) savedPage = 'dashboard';
  navigate(savedPage);
}
