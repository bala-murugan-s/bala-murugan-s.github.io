import { model } from './model.js';
export function drawRulesChart(){
  const canvas=document.getElementById('rulesChart'); const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
  const groups=[
    {k:'ziaUrl',label:'ZIA URL'}, {k:'ziaFw',label:'ZIA FW'}, {k:'ziaSsl',label:'ZIA SSL'}, {k:'ziaDlp',label:'ZIA DLP'},
    {k:'zpaAccess',label:'ZPA Access'}, {k:'zpaAppseg',label:'ZPA AppSeg'}];
  const data=groups.map(g=> ({label:g.label, value:(model.rules[g.k]||[]).length}));
  const max=Math.max(5, ...data.map(d=>d.value)); const barW=Math.max(24, Math.floor((canvas.width-60)/(data.length||1))-14);
  ctx.fillStyle='#cbd5e1'; ctx.font='12px system-ui'; ctx.fillText('Rule counts per type', 12, 16);
  data.forEach((d,i)=>{ const x=30+i*(barW+14); const h=Math.floor((canvas.height-60)*(d.value/max)); const y=canvas.height-30-h; ctx.fillStyle='#2563eb'; ctx.fillRect(x,y,barW,h); ctx.fillStyle='#cbd5e1'; ctx.fillText(String(d.value), x, y-4); ctx.fillText(d.label, x, canvas.height-12); });
}
