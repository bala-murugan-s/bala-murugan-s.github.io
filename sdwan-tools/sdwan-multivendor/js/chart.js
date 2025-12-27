import { model } from './model.js';

export function drawWanChart(){
  const canvas = document.getElementById('wanChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width, canvas.height);
  const data = model.wan.map(w=>({label:w.circuit||w.type, down:w.down||0, up:w.up||0}));
  const max = Math.max(100, ...data.map(d=>Math.max(d.down,d.up)));
  const barW = Math.max(26, Math.floor((canvas.width-60)/(data.length||1)) - 14);
  // Axis
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '12px system-ui';
  ctx.fillText('Throughput per circuit (Mbps)', 12, 16);
  // Bars
  data.forEach((d,i)=>{
    const x = 30 + i*(barW+14);
    const hDown = Math.floor((canvas.height-60) * (d.down/max));
    const hUp = Math.floor((canvas.height-60) * (d.up/max));
    const yDown = canvas.height-30 - hDown;
    const yUp = canvas.height-30 - hUp;
    // downlink (blue)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x,yDown,barW,hDown);
    // uplink (emerald)
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x+barW/2,yUp,barW/2,hUp);
    // labels
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(String(d.down), x, yDown-4);
    ctx.fillText(String(d.up), x+barW/2, yUp-4);
    ctx.fillText(d.label.slice(0,14), x, canvas.height-12);
  });
  // legend
  ctx.fillStyle = '#2563eb'; ctx.fillRect(canvas.width-160, 8, 12, 12); ctx.fillStyle = '#cbd5e1'; ctx.fillText('Down', canvas.width-144, 18);
  ctx.fillStyle = '#10b981'; ctx.fillRect(canvas.width-96, 8, 12, 12); ctx.fillStyle = '#cbd5e1'; ctx.fillText('Up', canvas.width-80, 18);
}
