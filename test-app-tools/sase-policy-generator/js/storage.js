import { model } from './model.js';
import { updateSidebar } from './ui.js';

function refresh(){
  // Vendor
  Array.from(document.querySelectorAll('input[name="vendor"]')).forEach(r=> r.checked = (r.value===model.vendor));
  // Tenant
  ['tenant','accountId','apiToken','authType','baseUrl','notes'].forEach(id=>{ const el=document.getElementById(id); el.value=model.tenant[id]||''; });
  updateSidebar();
}

export function saveLocal(){ localStorage.setItem('sasePolicyGen', JSON.stringify(model)); alert('Saved to localStorage.'); }
export function loadLocal(){ const raw=localStorage.getItem('sasePolicyGen'); if(!raw){ alert('No saved configuration'); return; } Object.assign(model, JSON.parse(raw)); refresh(); alert('Loaded from localStorage.'); }
export function clearAll(){ if(confirm('Clear form and local storage?')){ localStorage.removeItem('sasePolicyGen'); location.reload(); } }
export function exportJSON(){ const blob = new Blob([JSON.stringify(model, null, 2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='sase-policy-config.json'; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); }
export function importJSON(file){ if(!file) return; const reader=new FileReader(); reader.onload=e=>{ try{ const data=JSON.parse(e.target.result); Object.assign(model, data); refresh(); alert('Imported JSON configuration.'); }catch(err){ alert('Invalid JSON.'); } }; reader.readAsText(file); }
export function loadFromFile(file){ importJSON(file); }
