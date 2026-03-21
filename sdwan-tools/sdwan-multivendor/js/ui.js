import { model } from './model.js';
import { drawWanChart } from './chart.js';
import { validateStep } from './validation.js';

export function goToStep(step){
  model.currentStep = step;
  document.querySelector('#stepList li.active')?.classList.remove('active');
  document.querySelector(`#stepList li[data-step="${step}"]`).classList.add('active');
  Array.from(document.querySelectorAll('.panel')).forEach(p=>{
    p.classList.toggle('active', Number(p.id.replace('step-',''))===step);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if(step===7) renderSummary();
}
export function nextStep(){ goToStep(Math.min(7, model.currentStep+1)); }
export function prevStep(){ goToStep(Math.max(1, model.currentStep-1)); }

export function bindVendor(){
  const radios = document.querySelectorAll('input[name="vendor"]');
  radios.forEach(r=> r.addEventListener('change',()=>{ model.vendor = r.value; updateSidebar(); }));
}

export function bindSite(){
  const ids = ['siteName','siteId','siteType','timezone','expectedUsers','criticality','address','email'];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    ['input','change'].forEach(evt=> el.addEventListener(evt, syncSite));
  });
  function syncSite(){
    model.site = {
      name: document.getElementById('siteName').value.trim(),
      id: document.getElementById('siteId').value.trim(),
      type: document.getElementById('siteType').value,
      timezone: document.getElementById('timezone').value,
      users: document.getElementById('expectedUsers').value,
      criticality: document.getElementById('criticality').value,
      address: document.getElementById('address').value.trim(),
      email: document.getElementById('email').value.trim()
    };
    updateSidebar();
  }
}

export function bindWan(){
  const tbody = document.querySelector('#wanTable tbody');
  const addBtn = document.getElementById('btnAddWan');

  function addRow(row={ circuit:'', type:'Internet', isp:'', down:0, up:0, ip:'', priority:'Primary' }){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input placeholder="Circuit (e.g., DIA-ISP1)" value="${row.circuit}"></td>
      <td>
        <select>
          <option ${row.type==='Internet'?'selected':''}>Internet</option>
          <option ${row.type==='MPLS'?'selected':''}>MPLS</option>
          <option ${row.type==='4G/LTE'?'selected':''}>4G/LTE</option>
          <option ${row.type==='5G'?'selected':''}>5G</option>
        </select>
      </td>
      <td><input placeholder="ISP" value="${row.isp}"></td>
      <td><input type="number" min="0" value="${row.down}" placeholder="500"></td>
      <td><input type="number" min="0" value="${row.up}" placeholder="50"></td>
      <td><input placeholder="x.x.x.x" value="${row.ip}"></td>
      <td>
        <select>
          <option ${row.priority==='Primary'?'selected':''}>Primary</option>
          <option ${row.priority==='Backup'?'selected':''}>Backup</option>
          <option ${row.priority==='Tertiary'?'selected':''}>Tertiary</option>
        </select>
      </td>
      <td>
        <div class="row-actions">
          <button class="secondary btnClone">⎘ Clone</button>
          <button class="danger btnDel">🔒 Del</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
    tr.querySelector('.btnDel').addEventListener('click',()=>{ tr.remove(); collect(); });
    tr.querySelector('.btnClone').addEventListener('click',()=>{ const r = getRow(tr); addRow(r); });
    ['input','change'].forEach(evt=> tr.addEventListener(evt, collect));
  }
  function getRow(tr){
    const tds = tr.querySelectorAll('td');
    return {
      circuit: tds[0].querySelector('input').value.trim(),
      type: tds[1].querySelector('select').value,
      isp: tds[2].querySelector('input').value.trim(),
      down: Number(tds[3].querySelector('input').value||0),
      up: Number(tds[4].querySelector('input').value||0),
      ip: tds[5].querySelector('input').value.trim(),
      priority: tds[6].querySelector('select').value
    };
  }
  function collect(){
    model.wan = Array.from(tbody.querySelectorAll('tr')).map(getRow);
    drawWanChart();
    updateSidebar();
  }
  addBtn.addEventListener('click', ()=> addRow());
  // seed
  model.wan.forEach(addRow);
}

export function bindLan(){
  const tbody = document.querySelector('#lanTable tbody');
  const addBtn = document.getElementById('btnAddVlan');

  function addRow(row={ id:0, name:'', subnet:'', gw:'', dhcp:true, zone:'Trust' }){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="number" min="1" max="4094" value="${row.id}" placeholder="10"></td>
      <td><input value="${row.name}" placeholder="Users"></td>
      <td><input value="${row.subnet}" placeholder="10.10.10.0/24"></td>
      <td><input value="${row.gw}" placeholder="10.10.10.1"></td>
      <td>
        <select>
          <option ${row.dhcp? 'selected':''}>Enabled</option>
          <option ${!row.dhcp? 'selected':''}>Disabled</option>
        </select>
      </td>
      <td>
        <select>
          <option ${row.zone==='Trust'?'selected':''}>Trust</option>
          <option ${row.zone==='Guest'?'selected':''}>Guest</option>
          <option ${row.zone==='Voice'?'selected':''}>Voice</option>
          <option ${row.zone==='Management'?'selected':''}>Management</option>
        </select>
      </td>
      <td>
        <div class="row-actions">
          <button class="secondary btnClone">⎘ Clone</button>
          <button class="danger btnDel">🔒 Del</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
    tr.querySelector('.btnDel').addEventListener('click',()=>{ tr.remove(); collect(); });
    tr.querySelector('.btnClone').addEventListener('click',()=>{ const r = getRow(tr); addRow(r); });
    ['input','change'].forEach(evt=> tr.addEventListener(evt, collect));
  }
  function getRow(tr){
    const tds = tr.querySelectorAll('td');
    return {
      id: Number(tds[0].querySelector('input').value||0),
      name: tds[1].querySelector('input').value.trim(),
      subnet: tds[2].querySelector('input').value.trim(),
      gw: tds[3].querySelector('input').value.trim(),
      dhcp: tds[4].querySelector('select').value==='Enabled',
      zone: tds[5].querySelector('select').value
    };
  }
  function collect(){
    model.vlans = Array.from(tbody.querySelectorAll('tr')).map(getRow);
    updateSidebar();
  }
  addBtn.addEventListener('click', ()=> addRow());
  // seed
  model.vlans.forEach(addRow);
}

export function bindPolicies(){
  const appChecks = document.querySelectorAll('.appPolicy');
  appChecks.forEach(ch=> ch.addEventListener('change',()=>{
    model.policies.app = Array.from(appChecks).filter(c=>c.checked).map(c=>c.value);
    updateSidebar();
  }));
  document.getElementById('qosVoip').addEventListener('input', e=> { model.policies.qos.voipKbps = Number(e.target.value||0); updateSidebar(); });
  document.getElementById('qosVideo').addEventListener('input', e=> { model.policies.qos.videoMbps = Number(e.target.value||0); updateSidebar(); });
  document.getElementById('qosBiz').addEventListener('input', e=> { model.policies.qos.bizPct = Number(e.target.value||0); updateSidebar(); });
  const diaEnable = document.getElementById('diaEnable');
  const diaApps = document.querySelectorAll('.diaApp');
  diaEnable.addEventListener('change', ()=> { model.policies.dia.enabled = diaEnable.checked; updateSidebar(); });
  diaApps.forEach(ch=> ch.addEventListener('change',()=>{ model.policies.dia.apps = Array.from(diaApps).filter(c=>c.checked).map(c=>c.value); updateSidebar(); }));
  const secFeatures = document.querySelectorAll('.secFeature');
  secFeatures.forEach(ch=> ch.addEventListener('change',()=>{ model.policies.security = Array.from(secFeatures).filter(c=>c.checked).map(c=>c.value); updateSidebar(); }));
}

export function bindSites(){
  const tbody = document.querySelector('#siteTable tbody');
  const addBtn = document.getElementById('btnAddSite');
  function addRow(row={ name:'', id:'', users:0, region:'US East', status:'Ready' }){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${row.name}" placeholder="Branch‑NYC‑01"></td>
      <td><input value="${row.id}" placeholder="1001"></td>
      <td><input type="number" min="1" value="${row.users}"></td>
      <td>
        <select>
          <option ${row.region==='US East'?'selected':''}>US East</option>
          <option ${row.region==='US West'?'selected':''}>US West</option>
          <option ${row.region==='US Central'?'selected':''}>US Central</option>
          <option ${row.region==='EU'?'selected':''}>EU</option>
          <option ${row.region==='APAC'?'selected':''}>APAC</option>
        </select>
      </td>
      <td>
        <select>
          <option ${row.status==='Ready'?'selected':''}>Ready</option>
          <option ${row.status==='Warning'?'selected':''}>Warning</option>
        </select>
      </td>
      <td>
        <div class="row-actions">
          <button class="secondary btnClone">⎘ Clone</button>
          <button class="danger btnDel">🔒 Del</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
    tr.querySelector('.btnDel').addEventListener('click',()=>{ tr.remove(); collect(); });
    tr.querySelector('.btnClone').addEventListener('click',()=>{ const r = getRow(tr); addRow(r); });
    ['input','change'].forEach(evt=> tr.addEventListener(evt, collect));
  }
  function getRow(tr){
    const tds = tr.querySelectorAll('td');
    return {
      name: tds[0].querySelector('input').value.trim(),
      id: tds[1].querySelector('input').value.trim(),
      users: Number(tds[2].querySelector('input').value||0),
      region: tds[3].querySelector('select').value,
      status: tds[4].querySelector('select').value
    };
  }
  function collect(){
    model.sites = Array.from(tbody.querySelectorAll('tr')).map(getRow);
    updateSidebar();
  }
  addBtn.addEventListener('click', ()=> addRow());
  // seed
  model.sites.forEach(addRow);
}

export function renderSummary(){
  const el = document.getElementById('summary');
  el.innerHTML = `<h3>Configuration Summary</h3>
    <ul>
      <li><strong>Vendor:</strong> ${model.vendor || 'Not selected'}</li>
      <li><strong>Primary Site:</strong> ${model.site.name || '(name missing)'} · ID ${model.site.id || '(id missing)'} · ${model.site.type}</li>
      <li><strong>Timezone/Users:</strong> ${model.site.timezone} · ${model.site.users}</li>
      <li><strong>WAN Circuits:</strong> ${model.wan.length}</li>
      <li><strong>VLANs:</strong> ${model.vlans.length}</li>
      <li><strong>Policies:</strong> App=${model.policies.app.length}, DIA=${model.policies.dia.enabled?'On':'Off'}, Sec=${model.policies.security.join(', ')||'None'}</li>
      <li><strong>Additional Sites:</strong> ${model.sites.length}</li>
    </ul>`;
}

export function updateSidebar(){
  document.getElementById('sumVendor').textContent = model.vendor || '—';
  document.getElementById('sumSite').textContent = `${model.site.name || '—'} (ID ${model.site.id || '—'})`;
  document.getElementById('sumWan').textContent = String(model.wan.length);
  document.getElementById('sumLan').textContent = String(model.vlans.length);
  document.getElementById('sumPolicies').textContent = `${model.policies.app.length} apps · DIA ${model.policies.dia.enabled?'On':'Off'} · Sec ${model.policies.security.length}`;
  document.getElementById('sumSites').textContent = String(model.sites.length);
}

export function initTabs(){
  Array.from(document.querySelectorAll('.tab')).forEach(tab=> tab.addEventListener('click', ()=>{
    Array.from(document.querySelectorAll('.tab')).forEach(t=> t.classList.toggle('active', t===tab));
    const { files } = window.generatorApi;
    document.getElementById('codeBox').textContent = files[tab.dataset.file] || '# (empty)';
  }));
}

export function toggleTheme(){
  const body = document.body;
  const isLight = body.classList.contains('theme-light');
  body.classList.toggle('theme-light', !isLight);
  body.classList.toggle('theme-dark', isLight);
  document.documentElement.classList.toggle('light', !isLight);
}
