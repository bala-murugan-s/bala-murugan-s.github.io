import { model } from './model.js';
import { drawWanChart } from './chart.js';
import { updateSidebar } from './ui.js';

function refreshFromModel(){
  // Vendor
  Array.from(document.querySelectorAll('input[name="vendor"]')).forEach(r=> r.checked = (r.value===model.vendor));
  // Site
  document.getElementById('siteName').value = model.site.name||'';
  document.getElementById('siteId').value = model.site.id||'';
  document.getElementById('siteType').value = model.site.type||'Branch Office';
  document.getElementById('timezone').value = model.site.timezone||'America/New_York';
  document.getElementById('expectedUsers').value = model.site.users||'1-25';
  document.getElementById('criticality').value = model.site.criticality||'High';
  document.getElementById('address').value = model.site.address||'';
  document.getElementById('email').value = model.site.email||'';
  // WAN
  const wanBody = document.querySelector('#wanTable tbody'); wanBody.innerHTML='';
  model.wan.forEach(w=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${w.circuit}"></td>
      <td><select><option ${w.type==='Internet'?'selected':''}>Internet</option><option ${w.type==='MPLS'?'selected':''}>MPLS</option><option ${w.type==='4G/LTE'?'selected':''}>4G/LTE</option><option ${w.type==='5G'?'selected':''}>5G</option></select></td>
      <td><input value="${w.isp}"></td>
      <td><input type="number" value="${w.down}"></td>
      <td><input type="number" value="${w.up}"></td>
      <td><input value="${w.ip}"></td>
      <td><select><option ${w.priority==='Primary'?'selected':''}>Primary</option><option ${w.priority==='Backup'?'selected':''}>Backup</option><option ${w.priority==='Tertiary'?'selected':''}>Tertiary</option></select></td>
      <td><div class="row-actions"><button class="secondary btnClone">⎘ Clone</button><button class="danger btnDel">🔒 Del</button></div></td>`;
    wanBody.appendChild(tr);
  });
  drawWanChart();
  // VLANs
  const lanBody = document.querySelector('#lanTable tbody'); lanBody.innerHTML='';
  model.vlans.forEach(v=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="number" value="${v.id}"></td>
      <td><input value="${v.name}"></td>
      <td><input value="${v.subnet}"></td>
      <td><input value="${v.gw}"></td>
      <td><select><option ${v.dhcp? 'selected':''}>Enabled</option><option ${!v.dhcp? 'selected':''}>Disabled</option></select></td>
      <td><select><option ${v.zone==='Trust'?'selected':''}>Trust</option><option ${v.zone==='Guest'?'selected':''}>Guest</option><option ${v.zone==='Voice'?'selected':''}>Voice</option><option ${v.zone==='Management'?'selected':''}>Management</option></select></td>
      <td><div class="row-actions"><button class="secondary btnClone">⎘ Clone</button><button class="danger btnDel">🔒 Del</button></div></td>`;
    lanBody.appendChild(tr);
  });
  // Policies checkboxes mapped
  Array.from(document.querySelectorAll('.appPolicy')).forEach(c=> c.checked = model.policies.app.includes(c.value));
  document.getElementById('qosVoip').value = model.policies.qos.voipKbps;
  document.getElementById('qosVideo').value = model.policies.qos.videoMbps;
  document.getElementById('qosBiz').value = model.policies.qos.bizPct;
  document.getElementById('diaEnable').checked = !!model.policies.dia.enabled;
  Array.from(document.querySelectorAll('.diaApp')).forEach(c=> c.checked = model.policies.dia.apps.includes(c.value));
  Array.from(document.querySelectorAll('.secFeature')).forEach(c=> c.checked = model.policies.security.includes(c.value));
  // Sites
  const siteBody = document.querySelector('#siteTable tbody'); siteBody.innerHTML='';
  model.sites.forEach(s=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${s.name}"></td>
      <td><input value="${s.id}"></td>
      <td><input type="number" value="${s.users}"></td>
      <td><select><option ${s.region==='US East'?'selected':''}>US East</option><option ${s.region==='US West'?'selected':''}>US West</option><option ${s.region==='US Central'?'selected':''}>US Central</option><option ${s.region==='EU'?'selected':''}>EU</option><option ${s.region==='APAC'?'selected':''}>APAC</option></select></td>
      <td><select><option ${s.status==='Ready'?'selected':''}>Ready</option><option ${s.status==='Warning'?'selected':''}>Warning</option></select></td>
      <td><div class="row-actions"><button class="secondary btnClone">⎘ Clone</button><button class="danger btnDel">🔒 Del</button></div></td>`;
    siteBody.appendChild(tr);
  });
  updateSidebar();
}

export function saveLocal(){ localStorage.setItem('sdwanWizard', JSON.stringify(model)); alert('Configuration saved locally.'); }
export function loadLocal(){ const raw = localStorage.getItem('sdwanWizard'); if(!raw){ alert('No saved configuration found.'); return; } const data = JSON.parse(raw); Object.assign(model, data); refreshFromModel(); alert('Configuration loaded from localStorage.'); }
export function clearAll(){ if(confirm('Clear form and local storage?')){ localStorage.removeItem('sdwanWizard'); location.reload(); } }
export function exportJSON(){ const blob = new Blob([JSON.stringify(model, null, 2)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sdwan-config.json'; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); }
export function importJSON(file){ if(!file) return; const reader = new FileReader(); reader.onload = e=>{ try{ const data = JSON.parse(e.target.result); Object.assign(model, data); refreshFromModel(); alert('Configuration imported from JSON.'); }catch(err){ alert('Invalid JSON file.'); } }; reader.readAsText(file); }
export function loadFromFile(file){ importJSON(file); }
