import { model } from './model.js';

export const files = {};

function esc(v){ return (v||'').replace(/"/g,'\\"'); }
function csvToArr(s){ return (s||'').split(',').map(x=> x.trim()).filter(Boolean); }

function genZiaUrl(){
  const payload = model.rules.ziaUrl.map(r=> ({
    name: r.name, action: r.action, url_categories: csvToArr(r.url_categories), protocols: csvToArr(r.protocols), request_methods: csvToArr(r.methods), users: csvToArr(r.users), order: r.order
  }));
  files['zia-url-filtering.json'] = JSON.stringify({ tenant:model.tenant, rules: payload }, null, 2);
  files['zia-url-filtering-curl.sh'] = `#!/usr/bin/env bash\n# ZIA URL Filtering (example; adapt endpoint paths)\nBASE=\"${model.tenant.baseUrl}\"\nTOKEN=\"${model.tenant.apiToken}\"\ncat zia-url-filtering.json | jq -c '.rules[]' | while read -r RULE; do\n  curl -sS -X POST \"$BASE/urlFilteringRules\" \\n    -H 'Authorization: Bearer '"$TOKEN" \\n    -H 'Content-Type: application/json' \\n    -d "$RULE";\n  echo;\ndone\n`;
}
function genZiaFw(){
  const payload = model.rules.ziaFw.map(r=> ({
    name:r.name, action:r.action, src_ips:csvToArr(r.src_ips), dest_addresses:csvToArr(r.dest_addresses), nw_services:csvToArr(r.services), users:csvToArr(r.users), order:r.order
  }));
  files['zia-firewall.json'] = JSON.stringify({ tenant:model.tenant, rules: payload }, null, 2);
  files['zia-firewall-curl.sh'] = `#!/usr/bin/env bash\nBASE=\"${model.tenant.baseUrl}\"\nTOKEN=\"${model.tenant.apiToken}\"\ncat zia-firewall.json | jq -c '.rules[]' | while read -r RULE; do\n  curl -sS -X POST \"$BASE/firewallFilteringRules\" \\n    -H 'Authorization: Bearer '"$TOKEN" \\n    -H 'Content-Type: application/json' \\n    -d "$RULE";\n  echo;\ndone\n`;
}
function genZpaAccess(){
  const payload = model.rules.zpaAccess.map(r=> ({
    name:r.name, action:r.action, app_segments:csvToArr(r.app_segments), users:csvToArr(r.users), conditions:r.conditions, order:r.order
  }));
  files['zpa-access-policy.json'] = JSON.stringify({ tenant:model.tenant, rules: payload }, null, 2);
  files['zpa-access-curl.sh'] = `#!/usr/bin/env bash\nBASE=\"${model.tenant.baseUrl}\"\nTOKEN=\"${model.tenant.apiToken}\"\n# NOTE: ZPA requires policySetId and customerId; adapt endpoints per tenant\ncat zpa-access-policy.json | jq -c '.rules[]' | while read -r RULE; do\n  curl -sS -X POST \"$BASE/mgmtconfig/v1/admin/customers/$CUSTOMER/policySet/rules\" \\n    -H 'Authorization: Bearer '"$TOKEN" \\n    -H 'Content-Type: application/json' \\n    -d "$RULE";\n  echo;\ndone\n`;
}
function genZpaAppSeg(){
  const payload = model.rules.zpaAppseg.map(r=> ({ name:r.name, domain_names:csvToArr(r.domains), tcp_port_ranges:csvToArr(r.tcp_ports), udp_port_ranges:csvToArr(r.udp_ports), segment_group_id:r.segment_group, server_groups:csvToArr(r.server_groups) }));
  files['zpa-app-segments.json'] = JSON.stringify({ tenant:model.tenant, segments: payload }, null, 2);
  files['zpa-appseg-curl.sh'] = `#!/usr/bin/env bash\nBASE=\"${model.tenant.baseUrl}\"\nTOKEN=\"${model.tenant.apiToken}\"\ncat zpa-app-segments.json | jq -c '.segments[]' | while read -r SEG; do\n  curl -sS -X POST \"$BASE/mgmtconfig/v1/admin/customers/$CUSTOMER/application\" \\n    -H 'Authorization: Bearer '"$TOKEN" -H 'Content-Type: application/json' -d "$SEG"; echo;\ndone\n`;
}
function genUmbrella(){
  const dests = model.rules.umbrellaDest.map(r=> ({ name:r.name, type:r.type, entries:csvToArr(r.entries), description:r.description }));
  const web = model.rules.umbrellaWeb.map(r=> ({ name:r.name, identity:r.identity, categories:csvToArr(r.categories), action:r.action, order:r.order }));
  files['umbrella-destination-lists.json'] = JSON.stringify({ tenant:model.tenant, lists:dests }, null, 2);
  files['umbrella-web-policy.json'] = JSON.stringify({ tenant:model.tenant, rules:web }, null, 2);
}
function genCloudflare(){
  const access = model.rules.cfAccess.map(r=> ({ name:r.name, decision:r.decision, include:r.include, exclude:r.exclude, require:r.require, session_duration:`${r.session_h}h` }));
  const gateway = model.rules.cfGateway.map(r=> ({ name:r.name, type:r.type, selector:r.selector, action:r.action, description:r.description }));
  files['cloudflare-access-policies.json'] = JSON.stringify({ account_id:model.tenant.accountId, base_url:model.tenant.baseUrl, rules:access }, null, 2);
  files['cloudflare-gateway-policies.json'] = JSON.stringify({ account_id:model.tenant.accountId, base_url:model.tenant.baseUrl, rules:gateway }, null, 2);
}
function genPrisma(){
  const payload = model.rules.prisma.map(r=> ({ name:r.name, type:r.type, source:r.src, destination:r.dst, app_service:r.appsvc, action:r.action }));
  files['prisma-access-policy.json'] = JSON.stringify({ base_url:model.tenant.baseUrl, rules:payload }, null, 2);
}
function genNetskope(){
  const payload = model.rules.netskope.map(r=> ({ name:r.name, app:r.app, instance:r.instance, conditions:r.content, dlp_profile:r.dlp, action:r.action }));
  files['netskope-api-dp.json'] = JSON.stringify({ tenant:model.tenant, policies:payload }, null, 2);
}

export function generateAll(){
  // Clear files map
  Object.keys(files).forEach(k=> delete files[k]);
  if(model.types.includes('zia-url')) genZiaUrl();
  if(model.types.includes('zia-firewall')) genZiaFw();
  if(model.types.includes('zpa-access')) genZpaAccess();
  if(model.types.includes('zpa-appseg')) genZpaAppSeg();
  if(model.types.includes('umbrella-dest') || model.types.includes('umbrella-web')) genUmbrella();
  if(model.types.includes('cf-access') || model.types.includes('cf-gateway')) genCloudflare();
  if(model.types.includes('prisma-policy')) genPrisma();
  if(model.types.includes('netskope-api')) genNetskope();
  // Build tabs
  const tabbar=document.getElementById('tabbar'); tabbar.innerHTML='';
  Object.keys(files).forEach(fn=>{ const b=document.createElement('button'); b.className='tab'; b.textContent=fn; b.dataset.file=fn; tabbar.appendChild(b); });
  Array.from(document.querySelectorAll('.tab')).forEach(tab=> tab.addEventListener('click', ()=>{ Array.from(document.querySelectorAll('.tab')).forEach(t=> t.classList.toggle('active', t===tab)); document.getElementById('codeBox').textContent = files[tab.dataset.file] || '# (empty)'; }));
  const first=Object.keys(files)[0]; if(first){ const firstTab=document.querySelector(`.tab[data-file="${first}"]`); firstTab?.classList.add('active'); document.getElementById('codeBox').textContent = files[first]; }
  window.generatorApi = { files };
  alert('Payloads generated. Use "View Generated Files" to preview and download.');
}

export function copyAllPayloads(){
  const all = Object.entries(files).map(([k,v])=> `## ${k}\n${v}`).join('\n\n');
  navigator.clipboard.writeText(all).then(()=> alert('All payloads copied to clipboard.')).catch(()=> alert('Clipboard copy failed.'));
}
