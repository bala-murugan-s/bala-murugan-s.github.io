import { model } from './model.js';
import { collectAll } from './ui.js';

const ipRegex = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const cidrRegex = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}\/(\d|[12]\d|3[0-2])$/;
function tip(msg){ const el=document.createElement('div'); el.className='callout'; el.textContent=msg; const panel=document.querySelector(`#step-${model.currentStep}`); panel.appendChild(el); setTimeout(()=> el.remove(), 3000); }

export function validateStep(step){
  if(step===1){ if(!model.product){ tip('Select ZIA or ZPA'); return false; } }
  if(step===2){ if(!model.tenant.baseUrl || !model.tenant.apiToken){ tip('Enter Cloud Base URL and API token/cookie'); return false; } }
  if(step===3){ if(!model.types.length){ tip('Choose at least one policy type'); return false; } }
  if(step===4){ collectAll(); const total=Object.values(model.rules).reduce((n,a)=> n+(a?a.length:0), 0); if(total<1){ tip('Add at least one rule'); return false; }
    model.rules.ziaFw.forEach(r=> r.src_ips.split(',').forEach(ip=>{ ip=ip.trim(); if(ip && !(ipRegex.test(ip)||cidrRegex.test(ip))) tip(`Check ZIA Firewall Src IP/CIDR: ${ip}`); }));
    model.rules.ziaUrl.forEach(r=>{ if(!r.name) tip('ZIA URL rule requires a name'); });
    model.rules.zpaAppseg.forEach(s=>{ if(!s.name || !s.domains) tip('ZPA App Segment requires name and domains'); });
  }
  return true;
}
