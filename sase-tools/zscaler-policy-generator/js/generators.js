import { model } from './model.js';
export const files = {};
function esc(v){ return (v||'').replace(/"/g,'\\"'); }
function csv(s){ return (s||'').split(',').map(x=> x.trim()).filter(Boolean); }

// ZIA generators
function genZiaUrl(){
  const rules = model.rules.ziaUrl.map(r=> ({ name:r.name, action:r.action, url_categories:csv(r.url_categories), protocols:csv(r.protocols), request_methods:csv(r.methods), users:csv(r.users), order:r.order }));
  files['zia-url-filtering.json'] = JSON.stringify({ base_url:model.tenant.baseUrl, rules }, null, 2);
  files['zia-url-filtering-curl.sh'] = `#!/usr/bin/env bash\n# ZIA URL Filtering API (base varies per cloud)\nBASE=\"${model.tenant.baseUrl}\"\nCOOKIE=\"${model.tenant.apiToken}\"  # JSESSIONID cookie value\nfor RULE in $(jq -c '.rules[]' zia-url-filtering.json); do\n  curl -sS -X POST \"$BASE/urlFilteringRules\" \\n    -H 'Content-Type: application/json' \\n    -H 'Cookie: JSESSIONID='"$COOKIE" \\n    -d "$RULE"; echo;\ndone\n# Activate changes\ncurl -sS -X POST \"$BASE/status/activate\" -H 'Cookie: JSESSIONID='"$COOKIE"; echo\n`;
}
function genZiaFw(){
  const rules = model.rules.ziaFw.map(r=> ({ name:r.name, action:r.action, src_ips:csv(r.src_ips), dest_addresses:csv(r.dest_addresses), nw_services:csv(r.services), labels:csv(r.labels), order:r.order }));
  files['zia-firewall.json'] = JSON.stringify({ base_url:model.tenant.baseUrl, rules }, null, 2);
  files['zia-firewall-curl.sh'] = `#!/usr/bin/env bash\nBASE=\"${model.tenant.baseUrl}\"\nCOOKIE=\"${model.tenant.apiToken}\"\nfor RULE in $(jq -c '.rules[]' zia-firewall.json); do\n  curl -sS -X POST \"$BASE/firewallFilteringRules\" \\n    -H 'Content-Type: application/json' \\n    -H 'Cookie: JSESSIONID='"$COOKIE" \\n    -d "$RULE"; echo;\ndone\ncurl -sS -X POST \"$BASE/status/activate\" -H 'Cookie: JSESSIONID='"$COOKIE"; echo\n`;
}
function genZiaSsl(){
  const rules = model.rules.ziaSsl.map(r=> ({ name:r.name, entries:csv(r.entries), action:r.action, order:r.order }));
  files['zia-ssl-exceptions.json'] = JSON.stringify({ base_url:model.tenant.baseUrl, rules }, null, 2);
}
function genZiaDlp(){
  const rules = model.rules.ziaDlp.map(r=> ({ name:r.name, dictionaries:csv(r.dictionaries), action:r.action, subjects:csv(r.subjects), order:r.order }));
  files['zia-dlp-web.json'] = JSON.stringify({ base_url:model.tenant.baseUrl, rules }, null, 2);
}

// ZPA generators
function genZpaAccess(){
  const rules = model.rules.zpaAccess.map(r=> ({ name:r.name, action:r.action, app_segments:csv(r.app_segments), users:csv(r.users), conditions:r.conditions, order:r.order }));
  files['zpa-access-policy.json'] = JSON.stringify({ base_url:model.tenant.baseUrl, customerId:model.tenant.tenant, rules }, null, 2);
  files['zpa-access-curl.sh'] = `#!/usr/bin/env bash\nBASE=\"${model.tenant.baseUrl}\"\nTOKEN=\"${model.tenant.apiToken}\"\nCUSTOMER=\"${model.tenant.tenant}\"\n# Fetch policySetId for ACCESS_POLICY\nPOLICY_SET_ID=$(curl -sS -H "Authorization: Bearer $TOKEN" \"$BASE/mgmtconfig/v1/admin/customers/$CUSTOMER/policySet/policyType/ACCESS_POLICY\" | jq -r '.id')\nfor RULE in $(jq -c '.rules[]' zpa-access-policy.json); do\n  curl -sS -X POST \"$BASE/mgmtconfig/v1/admin/customers/$CUSTOMER/policySet/$POLICY_SET_ID/rules\" \\n    -H 'Authorization: Bearer '"$TOKEN" -H 'Content-Type: application/json' -d "$RULE"; echo;\ndone\n`;
}
function genZpaAppseg(){
  const segs = model.rules.zpaAppseg.map(r=> ({ name:r.name, domain_names:csv(r.domains), tcp_port_ranges:csv(r.tcp_ports), udp_port_ranges:csv(r.udp_ports), segment_group_id:r.segment_group, server_groups:csv(r.server_groups) }));
  files['zpa-app-segments.json'] = JSON.stringify({ base_url:model.tenant.baseUrl, customerId:model.tenant.tenant, segments: segs }, null, 2);
  files['zpa-appseg-curl.sh'] = `#!/usr/bin/env bash\nBASE=\"${model.tenant.baseUrl}\"\nTOKEN=\"${model.tenant.apiToken}\"\nCUSTOMER=\"${model.tenant.tenant}\"\nfor SEG in $(jq -c '.segments[]' zpa-app-segments.json); do\n  curl -sS -X POST \"$BASE/mgmtconfig/v1/admin/customers/$CUSTOMER/application\" \\n    -H 'Authorization: Bearer '"$TOKEN" -H 'Content-Type: application/json' -d "$SEG"; echo;\ndone\n`;
}

export function generateAll(){
  Object.keys(files).forEach(k=> delete files[k]);
  if(model.types.includes('zia-url')) genZiaUrl();
  if(model.types.includes('zia-firewall')) genZiaFw();
  if(model.types.includes('zia-ssl')) genZiaSsl();
  if(model.types.includes('zia-dlp')) genZiaDlp();
  if(model.types.includes('zpa-access')) genZpaAccess();
  if(model.types.includes('zpa-appseg')) genZpaAppseg();
  const tabbar=document.getElementById('tabbar'); tabbar.innerHTML='';
  Object.keys(files).forEach(fn=>{ const b=document.createElement('button'); b.className='tab'; b.textContent=fn; b.dataset.file=fn; tabbar.appendChild(b); });
  Array.from(document.querySelectorAll('.tab')).forEach(tab=> tab.addEventListener('click', ()=>{ Array.from(document.querySelectorAll('.tab')).forEach(t=> t.classList.toggle('active', t===tab)); document.getElementById('codeBox').textContent = files[tab.dataset.file] || '# (empty)'; }));
  const first=Object.keys(files)[0]; if(first){ const t=document.querySelector(`.tab[data-file="${first}"]`); t?.classList.add('active'); document.getElementById('codeBox').textContent = files[first]; }
  window.generatorApi = { files };
  alert('Zscaler payloads generated. Use "View Generated Files" to preview and download.');
}

export function copyAllPayloads(){ const all=Object.entries(files).map(([k,v])=> `## ${k}\n${v}`).join('\n\n'); navigator.clipboard.writeText(all).then(()=> alert('All payloads copied.')).catch(()=> alert('Clipboard copy failed.')); }
