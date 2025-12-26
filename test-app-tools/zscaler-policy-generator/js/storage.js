import { model } from './model.js';
import { updateSidebar } from './ui.js';
function refresh(){ ['baseUrl','tenant','authType','apiToken','notes'].forEach(id=>{ const el=document.getElementById(id); el.value=model.tenant[id]||''; }); updateSidebar(); }
export function saveLocal(){ localStorage.setItem('zscalerPolicyGen', JSON.stringify(model)); alert('Saved to localStorage.'); }
export function loadLocal(){ const raw=localStorage.getItem('zscalerPolicyGen'); if(!raw){ alert('No saved configuration'); return; } Object.assign(model, JSON.parse(raw)); refresh(); alert('Loaded from localStorage.'); }
export function clearAll(){ if(confirm('Clear form and local storage?')){ localStorage.removeItem('zscalerPolicyGen'); location.reload(); } }
export function exportJSON(){ const blob = new Blob([JSON.stringify(model, null, 2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='zscaler-policy-config.json'; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove(); }
export function importJSON(file){ if(!file) return; const reader=new FileReader(); reader.onload=e=>{ try{ const data=JSON.parse(e.target.result); Object.assign(model, data); refresh(); alert('Imported JSON configuration.'); }catch(err){ alert('Invalid JSON.'); } }; reader.readAsText(file); }
export function loadFromFile(file){ importJSON(file); }
