import { model } from './model.js';
import { collectAll } from './ui.js';

const ipRegex = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const cidrRegex = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}\/(\d|[12]\d|3[0-2])$/;

function callout(msg){ const panel=document.querySelector(`#step-${model.currentStep}`); const el=document.createElement('div'); el.className='callout'; el.textContent=msg; panel.appendChild(el); setTimeout(()=> el.remove(), 3000); }

export function validateStep(step){
  if(step===1){ if(!model.vendor){ callout('Select a vendor'); return false; } }
  if(step===2){ if(!model.tenant.baseUrl || !model.tenant.apiToken){ callout('Enter Base URL and API token/key'); return false; } }
  if(step===3){ if(!model.types.length){ callout('Choose at least one policy type'); return false; } }
  if(step===4){ collectAll(); const total = Object.values(model.rules).reduce((n,a)=> n+(a?a.length:0), 0); if(total<1){ callout('Add at least one rule'); return false; }
    // Light sanity checks for common fields
    model.rules.ziaFw.forEach(r=>{ r.src_ips.split(',').forEach(ip=>{ ip=ip.trim(); if(ip && !(ipRegex.test(ip)||cidrRegex.test(ip))) callout(`Check Src IP/CIDR: ${ip}`); }); });
    model.rules.ziaUrl.forEach(r=>{ if(!r.name) callout('ZIA URL rule requires a name'); });
  }
  return true;
}
