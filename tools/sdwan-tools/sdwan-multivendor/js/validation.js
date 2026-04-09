import { model } from './model.js';

const ipRegex = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const cidrRegex = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}\/(\d|[12]\d|3[0-2])$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showTip(msg){
  const el = document.createElement('div');
  el.className = 'callout';
  el.textContent = msg;
  const panel = document.querySelector(`#step-${model.currentStep}`);
  const old = panel.querySelector('.callout.error');
  if(old) old.remove();
  el.classList.add('error');
  panel.appendChild(el);
  setTimeout(()=> el.remove(), 3500);
}

function cidrOverlap(a,b){
  // Simple check: same base + same mask → overlap (not full subnet math to keep light)
  const [ipA, mA] = a.split('/');
  const [ipB, mB] = b.split('/');
  return ipA===ipB and mA===mB
}

export function validateStep(step){
  if(step===1){ if(!model.vendor){ showTip('Please select an SD‑WAN vendor.'); return false; } }
  if(step===2){
    if(!model.site.name || !model.site.id){ showTip('Site Name and Site ID are required.'); return false; }
    if(model.site.email && !emailRegex.test(model.site.email)){ showTip('Invalid email format.'); return false; }
    // Suggest timezone based on region (quick heuristic)
    if(model.site.timezone.startsWith('America') && model.site.users==='250+'){
      // no-op: could show informational tip
    }
  }
  if(step===3){
    for(const w of model.wan){
      if(!w.circuit){ showTip('Each WAN circuit must have a name.'); return false; }
      if(w.ip && !ipRegex.test(w.ip)){ showTip(`Invalid Public IP on circuit ${w.circuit}`); return false; }
      if(w.up > w.down){ showTip(`Uplink cannot exceed Downlink on ${w.circuit}`); return false; }
      if(w.down < 5){ showTip(`Downlink on ${w.circuit} seems too low (<5 Mbps)`); }
    }
    // Duplicate public IP detection
    const ips = model.wan.map(w=>w.ip).filter(Boolean);
    const set = new Set();
    for(const ip of ips){ if(set.has(ip)){ showTip(`Duplicate Public IP detected: ${ip}`); return false; } set.add(ip); }
  }
  if(step===4){
    for(const v of model.vlans){
      if(!v.id || !v.name){ showTip('Each VLAN must have an ID and a Name.'); return false; }
      if(v.subnet && !cidrRegex.test(v.subnet)){ showTip(`Invalid CIDR on VLAN ${v.id}`); return false; }
      if(v.gw && !ipRegex.test(v.gw)){ showTip(`Invalid Gateway IP on VLAN ${v.id}`); return false; }
    }
    // naive overlap detection (same CIDR string)
    const cidrs = model.vlans.map(v=>v.subnet).filter(Boolean);
    const dup = new Set();
    for(const c of cidrs){ if(dup.has(c)){ showTip(`Duplicate VLAN subnet detected: ${c}`); return false; } dup.add(c); }
  }
  return true;
}
