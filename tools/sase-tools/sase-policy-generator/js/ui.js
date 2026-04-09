import { model } from './model.js';
import { drawRulesChart } from './chart.js';

export function goToStep(step){
  model.currentStep = step;
  document.querySelector('#stepList li.active')?.classList.remove('active');
  document.querySelector(`#stepList li[data-step="${step}"]`).classList.add('active');
  Array.from(document.querySelectorAll('.panel')).forEach(p=> p.classList.toggle('active', Number(p.id.replace('step-',''))===step));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if(step===5) renderSummary();
}
export function nextStep(){ goToStep(Math.min(5, model.currentStep+1)); }
export function prevStep(){ goToStep(Math.max(1, model.currentStep-1)); }

export function bindVendor(){
  const radios = document.querySelectorAll('input[name="vendor"]');
  radios.forEach(r=> r.addEventListener('change',()=>{ model.vendor = r.value; updateSidebar(); showTypesForVendor(); }));
}
function showTypesForVendor(){
  Array.from(document.querySelectorAll('.types')).forEach(f=> f.hidden=true);
  if(model.vendor==='zscaler-zia') document.getElementById('types-zia').hidden=false;
  if(model.vendor==='zscaler-zpa') document.getElementById('types-zpa').hidden=false;
  if(model.vendor==='prisma-access') document.getElementById('types-prisma').hidden=false;
  if(model.vendor==='umbrella') document.getElementById('types-umbrella').hidden=false;
  if(model.vendor==='cloudflare-one') document.getElementById('types-cloudflare').hidden=false;
  if(model.vendor==='netskope') document.getElementById('types-netskope').hidden=false;
}

export function bindTenant(){
  const ids=['tenant','accountId','apiToken','authType','baseUrl','notes'];
  ids.forEach(id=>{
    const el=document.getElementById(id);
    ['input','change'].forEach(evt=> el.addEventListener(evt,()=>{
      model.tenant[id]=el.value.trim(); updateSidebar();
    }));
  });
}

export function bindTypes(){
  const checks=document.querySelectorAll('.polType');
  checks.forEach(ch=> ch.addEventListener('change',()=>{
    model.types = Array.from(document.querySelectorAll('.polType')).filter(c=>c.checked).map(c=>c.value);
    updateSidebar(); showBuilders();
  }));
}

export function bindBuilders(){
  // ZIA URL
  document.getElementById('btnAddZiaUrl').addEventListener('click',()=> addRow('tblZiaUrl', getZiaUrlRow));
  // ZIA FW
  document.getElementById('btnAddZiaFw').addEventListener('click',()=> addRow('tblZiaFw', getZiaFwRow));
  // ZPA Access
  document.getElementById('btnAddZpaAccess').addEventListener('click',()=> addRow('tblZpaAccess', getZpaAccessRow));
  // ZPA Appseg
  document.getElementById('btnAddZpaAppseg').addEventListener('click',()=> addRow('tblZpaAppseg', getZpaAppsegRow));
  // Umbrella
  document.getElementById('btnAddUmbDest').addEventListener('click',()=> addRow('tblUmbDest', getUmbDestRow));
  document.getElementById('btnAddUmbWeb').addEventListener('click',()=> addRow('tblUmbWeb', getUmbWebRow));
  // Cloudflare
  document.getElementById('btnAddCfAccess').addEventListener('click',()=> addRow('tblCfAccess', getCfAccessRow));
  document.getElementById('btnAddCfGateway').addEventListener('click',()=> addRow('tblCfGateway', getCfGatewayRow));
  // Prisma
  document.getElementById('btnAddPrisma').addEventListener('click',()=> addRow('tblPrisma', getPrismaRow));
  // Netskope
  document.getElementById('btnAddNetskope').addEventListener('click',()=> addRow('tblNetskope', getNetskopeRow));
}

function addRow(tableId, rowFactory){
  const tbody=document.querySelector(`#${tableId} tbody`);
  const tr=document.createElement('tr');
  tr.innerHTML=rowFactory();
  tbody.appendChild(tr);
  tr.querySelector('.btnDel')?.addEventListener('click',()=>{ tr.remove(); collectAll(); });
  tr.querySelector('.btnClone')?.addEventListener('click',()=>{ const clone=tr.cloneNode(true); tbody.appendChild(clone); bindRow(clone, tableId); collectAll(); });
  bindRow(tr, tableId);
  collectAll();
}
function bindRow(tr, tableId){ ['input','change'].forEach(evt=> tr.addEventListener(evt, collectAll)); }

function getZiaUrlRow(){
  return `<td><input placeholder="Allow-Office365"></td>
          <td><select><option>ALLOW</option><option>BLOCK</option><option>CAUTION</option></select></td>
          <td><input placeholder="OFFICE365, ANY"></td>
          <td><input placeholder="ANY_RULE"></td>
          <td><input placeholder="GET,POST,CONNECT"></td>
          <td><input placeholder="Users/Groups IDs"></td>
          <td><input type="number" min="1" value="1"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function getZiaFwRow(){
  return `<td><input placeholder="Block-Malicious"></td>
          <td><select><option>ALLOW</option><option>BLOCK_DROP</option><option>BLOCK_RESET</option></select></td>
          <td><input placeholder="198.51.100.0/24"></td>
          <td><input placeholder="203.0.113.0/24, bad.example.com"></td>
          <td><input placeholder="HTTP,HTTPS"></td>
          <td><input placeholder="Users/Groups IDs"></td>
          <td><input type="number" min="1" value="1"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function getZpaAccessRow(){
  return `<td><input placeholder="Allow-Sales"></td>
          <td><select><option>ALLOW</option><option>DENY</option></select></td>
          <td><input placeholder="AppSeg IDs or Names"></td>
          <td><input placeholder="Users/Groups"></td>
          <td><input placeholder="Device posture, trusted networks"></td>
          <td><input type="number" min="1" value="1"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function getZpaAppsegRow(){
  return `<td><input placeholder="Intranet-Portal"></td>
          <td><input placeholder="portal.example.com, *.corp.local"></td>
          <td><input placeholder="443,8443"></td>
          <td><input placeholder=""> </td>
          <td><input placeholder="Segment Group ID"></td>
          <td><input placeholder="Server Group IDs"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function getUmbDestRow(){
  return `<td><input placeholder="Blocked-HighRisk"></td>
          <td><select><option>DOMAIN</option><option>IP</option></select></td>
          <td><input placeholder="bad.example.com, 203.0.113.15"></td>
          <td><input placeholder="Notes"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function getUmbWebRow(){
  return `<td><input placeholder="Block-Adult"></td>
          <td><input placeholder="Identity (group/site/network)"></td>
          <td><input placeholder="Security/Content categories"></td>
          <td><select><option>BLOCK</option><option>ALLOW</option></select></td>
          <td><input type="number" min="1" value="1"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function getCfAccessRow(){
  return `<td><input placeholder="Allow-Devs"></td>
          <td><select><option>allow</option><option>deny</option><option>bypass</option></select></td>
          <td><input placeholder="include rules (group/email)"></td>
          <td><input placeholder="exclude rules"></td>
          <td><input placeholder="require rules"></td>
          <td><input type="number" min="1" value="24"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function getCfGatewayRow(){
  return `<td><input placeholder="Block-Gambling"></td>
          <td><select><option>HTTP</option><option>DNS</option></select></td>
          <td><input placeholder="selector (domain/ip/category)"></td>
          <td><select><option>block</option><option>allow</option></select></td>
          <td><input placeholder="description"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function getPrismaRow(){
  return `<td><input placeholder="Allow-Internal"></td>
          <td><select><option>security</option><option>nat</option><option>app</option></select></td>
          <td><input placeholder="src zone/address"></td>
          <td><input placeholder="dst zone/address"></td>
          <td><input placeholder="app/services"></td>
          <td><select><option>allow</option><option>deny</option></select></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function getNetskopeRow(){
  return `<td><input placeholder="Box-External-Sharing"></td>
          <td><input placeholder="Box"></td>
          <td><input placeholder="Instance name"></td>
          <td><input placeholder="Content/Activity conditions"></td>
          <td><input placeholder="DLP profile"></td>
          <td><select><option>Alert</option><option>Quarantine</option><option>Delete</option></select></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}

function showBuilders(){
  const map = {
    'zia-url':'builder-zia-url','zia-firewall':'builder-zia-firewall','zpa-access':'builder-zpa-access','zpa-appseg':'builder-zpa-appseg',
    'umbrella-dest':'builder-umbrella-dest','umbrella-web':'builder-umbrella-web','cf-access':'builder-cf-access','cf-gateway':'builder-cf-gateway',
    'prisma-policy':'builder-prisma-policy','netskope-api':'builder-netskope-api'
  };
  Object.values(map).forEach(id=> document.getElementById(id).hidden=true);
  model.types.forEach(t=> document.getElementById(map[t]).hidden=false);
}

export function renderSummary(){
  const el = document.getElementById('summary');
  const count = Object.values(model.rules).reduce((n,arr)=> n + (arr?arr.length:0), 0);
  el.innerHTML = `<h3>Summary</h3>
    <ul>
      <li><strong>Vendor:</strong> ${model.vendor||'—'}</li>
      <li><strong>Tenant:</strong> ${model.tenant.tenant||'—'} · ${model.tenant.baseUrl||''}</li>
      <li><strong>Policy Types:</strong> ${model.types.join(', ')||'—'}</li>
      <li><strong>Total Rules:</strong> ${count}</li>
    </ul>`;
}

export function updateSidebar(){
  document.getElementById('sumVendor').textContent = model.vendor || '—';
  document.getElementById('sumTenant').textContent = model.tenant.tenant || '—';
  document.getElementById('sumPolicyTypes').textContent = model.types.join(', ') || '—';
  const count = Object.values(model.rules).reduce((n,arr)=> n + (arr?arr.length:0), 0);
  document.getElementById('sumRules').textContent = String(count);
}

export function initTabs(){ /* dynamic tabs set later when generating files */ }

export function toggleTheme(){
  const body = document.body; const isLight = body.classList.contains('theme-light');
  body.classList.toggle('theme-light', !isLight); body.classList.toggle('theme-dark', isLight);
  document.documentElement.classList.toggle('light', !isLight);
}

export function collectAll(){
  // Collect from each table into model.rules
  function collectTable(id, mapper){
    const rows = Array.from(document.querySelectorAll(`#${id} tbody tr`));
    return rows.map(tr=> mapper(Array.from(tr.querySelectorAll('td'))));
  }
  model.rules.ziaUrl = collectTable('tblZiaUrl', tds=>({
    name: v(tds,0), action: s(tds,1), url_categories: v(tds,2), protocols: v(tds,3), methods: v(tds,4), users: v(tds,5), order: num(tds,6)
  }));
  model.rules.ziaFw = collectTable('tblZiaFw', tds=>({
    name: v(tds,0), action: s(tds,1), src_ips: v(tds,2), dest_addresses: v(tds,3), services: v(tds,4), users: v(tds,5), order: num(tds,6)
  }));
  model.rules.zpaAccess = collectTable('tblZpaAccess', tds=>({
    name: v(tds,0), action: s(tds,1), app_segments: v(tds,2), users: v(tds,3), conditions: v(tds,4), order: num(tds,5)
  }));
  model.rules.zpaAppseg = collectTable('tblZpaAppseg', tds=>({
    name: v(tds,0), domains: v(tds,1), tcp_ports: v(tds,2), udp_ports: v(tds,3), segment_group: v(tds,4), server_groups: v(tds,5)
  }));
  model.rules.umbrellaDest = collectTable('tblUmbDest', tds=>({
    name: v(tds,0), type: s(tds,1), entries: v(tds,2), description: v(tds,3)
  }));
  model.rules.umbrellaWeb = collectTable('tblUmbWeb', tds=>({
    name: v(tds,0), identity: v(tds,1), categories: v(tds,2), action: s(tds,3), order: num(tds,4)
  }));
  model.rules.cfAccess = collectTable('tblCfAccess', tds=>({
    name: v(tds,0), decision: s(tds,1), include: v(tds,2), exclude: v(tds,3), require: v(tds,4), session_h: num(tds,5)
  }));
  model.rules.cfGateway = collectTable('tblCfGateway', tds=>({
    name: v(tds,0), type: s(tds,1), selector: v(tds,2), action: s(tds,3), description: v(tds,4)
  }));
  model.rules.prisma = collectTable('tblPrisma', tds=>({
    name: v(tds,0), type: s(tds,1), src: v(tds,2), dst: v(tds,3), appsvc: v(tds,4), action: s(tds,5)
  }));
  model.rules.netskope = collectTable('tblNetskope', tds=>({
    name: v(tds,0), app: v(tds,1), instance: v(tds,2), content: v(tds,3), dlp: v(tds,4), action: s(tds,5)
  }));
  updateSidebar(); drawRulesChart();
}
function v(tds,i){ const el=tds[i].querySelector('input'); return (el?el.value.trim():''); }
function s(tds,i){ const el=tds[i].querySelector('select'); return (el?el.value:''); }
function num(tds,i){ const el=tds[i].querySelector('input'); return Number(el?el.value:0); }

//export { collectAll };
