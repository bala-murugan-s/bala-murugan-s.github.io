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

export function bindProduct(){
  const radios = document.querySelectorAll('input[name="product"]');
  radios.forEach(r=> r.addEventListener('change',()=>{ model.product = r.value; updateSidebar(); showTypes(); }));
}
function showTypes(){
  document.getElementById('types-zia').hidden = model.product!=='zia';
  document.getElementById('types-zpa').hidden = model.product!=='zpa';
}
export function bindTenant(){
  ['baseUrl','tenant','authType','apiToken','notes'].forEach(id=>{
    const el=document.getElementById(id);
    ['input','change'].forEach(evt=> el.addEventListener(evt,()=>{ model.tenant[id]=el.value.trim(); updateSidebar(); }));
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
  document.getElementById('btnAddZiaUrl').addEventListener('click',()=> addRow('tblZiaUrl', rowZiaUrl));
  document.getElementById('btnAddZiaFw').addEventListener('click',()=> addRow('tblZiaFw', rowZiaFw));
  document.getElementById('btnAddZiaSsl').addEventListener('click',()=> addRow('tblZiaSsl', rowZiaSsl));
  document.getElementById('btnAddZiaDlp').addEventListener('click',()=> addRow('tblZiaDlp', rowZiaDlp));
  document.getElementById('btnAddZpaAccess').addEventListener('click',()=> addRow('tblZpaAccess', rowZpaAccess));
  document.getElementById('btnAddZpaAppseg').addEventListener('click',()=> addRow('tblZpaAppseg', rowZpaAppseg));
}
function addRow(tableId, rowFactory){
  const tbody=document.querySelector(`#${tableId} tbody`);
  const tr=document.createElement('tr'); tr.innerHTML=rowFactory(); tbody.appendChild(tr);
  tr.querySelector('.btnDel')?.addEventListener('click',()=>{ tr.remove(); collectAll(); });
  tr.querySelector('.btnClone')?.addEventListener('click',()=>{ const clone=tr.cloneNode(true); tbody.appendChild(clone); bindRow(clone); collectAll(); });
  bindRow(tr); collectAll();
}
function bindRow(tr){ ['input','change'].forEach(evt=> tr.addEventListener(evt, collectAll)); }

function rowZiaUrl(){
  return `<td><input placeholder="Allow-Office365"></td>
          <td><select><option>ALLOW</option><option>BLOCK</option><option>CAUTION</option></select></td>
          <td><input placeholder="OFFICE365, ANY"></td>
          <td><input placeholder="ANY_RULE"></td>
          <td><input placeholder="GET,POST,CONNECT"></td>
          <td><input placeholder="Users/Groups IDs"></td>
          <td><input type="number" min="1" value="1"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function rowZiaFw(){
  return `<td><input placeholder="Block-Malicious"></td>
          <td><select><option>ALLOW</option><option>BLOCK_DROP</option><option>BLOCK_RESET</option></select></td>
          <td><input placeholder="198.51.100.0/24"></td>
          <td><input placeholder="203.0.113.0/24, bad.example.com"></td>
          <td><input placeholder="HTTP,HTTPS"></td>
          <td><input placeholder="Labels or Groups"></td>
          <td><input type="number" min="1" value="1"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function rowZiaSsl(){
  return `<td><input placeholder="Bypass-Banking"></td>
          <td><input placeholder="bank.example.com, 203.0.113.20"></td>
          <td><select><option>BYPASS_SSL_INSPECTION</option><option>INSPECT</option></select></td>
          <td><input type="number" min="1" value="1"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function rowZiaDlp(){
  return `<td><input placeholder="Block-PII-Upload"></td>
          <td><input placeholder="PII, PCI"></td>
          <td><select><option>BLOCK</option><option>QUARANTINE</option><option>ALLOW_WITH_ALERT</option></select></td>
          <td><input placeholder="Groups/Users"></td>
          <td><input type="number" min="1" value="1"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function rowZpaAccess(){
  return `<td><input placeholder="Allow-Sales"></td>
          <td><select><option>ALLOW</option><option>DENY</option></select></td>
          <td><input placeholder="AppSeg IDs or Names"></td>
          <td><input placeholder="Users/Groups"></td>
          <td><input placeholder="Device posture, trusted networks"></td>
          <td><input type="number" min="1" value="1"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}
function rowZpaAppseg(){
  return `<td><input placeholder="Intranet-Portal"></td>
          <td><input placeholder="portal.example.com, *.corp.local"></td>
          <td><input placeholder="443,8443"></td>
          <td><input placeholder=""> </td>
          <td><input placeholder="Segment Group ID"></td>
          <td><input placeholder="Server Group IDs"></td>
          <td><div class='row-actions'><button class='secondary btnClone'>⎘ Clone</button><button class='danger btnDel'>🔒 Del</button></div></td>`;
}

function showBuilders(){
  const map = {
    'zia-url':'builder-zia-url','zia-firewall':'builder-zia-firewall','zia-ssl':'builder-zia-ssl','zia-dlp':'builder-zia-dlp',
    'zpa-access':'builder-zpa-access','zpa-appseg':'builder-zpa-appseg'
  };
  Object.values(map).forEach(id=> document.getElementById(id).hidden=true);
  model.types.forEach(t=> document.getElementById(map[t]).hidden=false);
}

export function renderSummary(){
  const el=document.getElementById('summary');
  const count=Object.values(model.rules).reduce((n,arr)=> n+(arr?arr.length:0),0);
  el.innerHTML = `<h3>Summary</h3>
    <ul>
      <li><strong>Product:</strong> ${model.product||'—'}</li>
      <li><strong>Cloud:</strong> ${model.tenant.baseUrl||'—'}</li>
      <li><strong>Tenant/Org:</strong> ${model.tenant.tenant||'—'}</li>
      <li><strong>Policy Types:</strong> ${model.types.join(', ')||'—'}</li>
      <li><strong>Total Rules:</strong> ${count}</li>
    </ul>`;
}

export function updateSidebar(){
  document.getElementById('sumCloud').textContent = model.tenant.baseUrl || '—';
  document.getElementById('sumTenant').textContent = model.tenant.tenant || '—';
  document.getElementById('sumProduct').textContent = model.product || '—';
  const count=Object.values(model.rules).reduce((n,arr)=> n+(arr?arr.length:0),0);
  document.getElementById('sumRules').textContent = String(count);
}

export function initTabs(){ /* dynamic after generate */ }
export function toggleTheme(){ const b=document.body; const isLight=b.classList.contains('theme-light'); b.classList.toggle('theme-light', !isLight); b.classList.toggle('theme-dark', isLight); document.documentElement.classList.toggle('light', !isLight); }

export function collectAll(){
  function collect(id, mapper){ return Array.from(document.querySelectorAll(`#${id} tbody tr`)).map(tr=> mapper(Array.from(tr.querySelectorAll('td')))); }
  model.rules.ziaUrl = collect('tblZiaUrl', tds=> ({ name:v(tds,0), action:s(tds,1), url_categories:v(tds,2), protocols:v(tds,3), methods:v(tds,4), users:v(tds,5), order:num(tds,6) }));
  model.rules.ziaFw  = collect('tblZiaFw',  tds=> ({ name:v(tds,0), action:s(tds,1), src_ips:v(tds,2), dest_addresses:v(tds,3), services:v(tds,4), labels:v(tds,5), order:num(tds,6) }));
  model.rules.ziaSsl = collect('tblZiaSsl', tds=> ({ name:v(tds,0), entries:v(tds,1), action:s(tds,2), order:num(tds,3) }));
  model.rules.ziaDlp = collect('tblZiaDlp', tds=> ({ name:v(tds,0), dictionaries:v(tds,1), action:s(tds,2), subjects:v(tds,3), order:num(tds,4) }));
  model.rules.zpaAccess = collect('tblZpaAccess', tds=> ({ name:v(tds,0), action:s(tds,1), app_segments:v(tds,2), users:v(tds,3), conditions:v(tds,4), order:num(tds,5) }));
  model.rules.zpaAppseg = collect('tblZpaAppseg', tds=> ({ name:v(tds,0), domains:v(tds,1), tcp_ports:v(tds,2), udp_ports:v(tds,3), segment_group:v(tds,4), server_groups:v(tds,5) }));
}
function v(tds,i){ const el=tds[i].querySelector('input'); return (el?el.value.trim():''); }
function s(tds,i){ const el=tds[i].querySelector('select'); return (el?el.value:''); }
function num(tds,i){ const el=tds[i].querySelector('input'); return Number(el?el.value:0); }
