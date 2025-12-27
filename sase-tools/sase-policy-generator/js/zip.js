export function downloadActiveFile(){
  const active=document.querySelector('.tab.active')?.dataset.file; if(!active) return; const text=window.generatorApi?.files?.[active]||''; const blob=new Blob([text],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=active; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove();
}

// Minimal ZIP store-only
function toUTF8Array(str){ const arr=[]; for(let i=0;i<str.length;i++){ let c=str.charCodeAt(i); if(c<0x80) arr.push(c); else if(c<0x800){ arr.push(0xc0|(c>>6), 0x80|(c&0x3f)); } else{ arr.push(0xe0|(c>>12), 0x80|((c>>6)&0x3f), 0x80|(c&0x3f)); } } return new Uint8Array(arr); }
function u16(n){ const a=new Uint8Array(2); new DataView(a.buffer).setUint16(0,n,true); return a; }
function u32(n){ const a=new Uint8Array(4); new DataView(a.buffer).setUint32(0,n,true); return a; }
function crc32(buf){ let table=crc32.table; if(!table){ table=crc32.table=new Uint32Array(256); for(let i=0;i<256;i++){ let c=i; for(let j=0;j<8;j++){ c=((c&1)?(0xedb88320^(c>>>1)):(c>>>1)); } table[i]=c>>>0; } } let crc=0xffffffff; for(let i=0;i<buf.length;i++){ crc=table[(crc^buf[i])&0xff]^(crc>>>8); } return (crc^0xffffffff)>>>0; }

export function downloadZip(files){
  const enc=new TextEncoder(); const chunks=[]; const entries=[]; let offset=0; const push=a=>{ chunks.push(a); offset+=a.length; };
  const names=Object.keys(files); names.forEach(name=>{ const data=enc.encode(files[name]||''); const fname=toUTF8Array(name); const crc=crc32(data); const size=data.length; push(new Uint8Array([0x50,0x4b,0x03,0x04])); push(u16(20)); push(u16(0)); push(u16(0)); push(u16(0)); push(u16(0)); push(u32(crc)); push(u32(size)); push(u32(size)); push(u16(fname.length)); push(u16(0)); push(fname); push(data); entries.push({nameBytes:fname, crc, size, offset:offset-(30+fname.length+size)}); });
  const centralOffset=offset; entries.forEach(e=>{ push(new Uint8Array([0x50,0x4b,0x01,0x02])); push(u16(20)); push(u16(20)); push(u16(0)); push(u16(0)); push(u16(0)); push(u16(0)); push(u32(e.crc)); push(u32(e.size)); push(u32(e.size)); push(u16(e.nameBytes.length)); push(u16(0)); push(u16(0)); push(u16(0)); push(u16(0)); push(u32(0)); push(u32(e.offset)); push(e.nameBytes); });
  const centralSize=offset-centralOffset; push(new Uint8Array([0x50,0x4b,0x05,0x06])); push(u16(0)); push(u16(0)); push(u16(entries.length)); push(u16(entries.length)); push(u32(centralSize)); push(u32(centralOffset)); push(u16(0));
  let total=0; chunks.forEach(c=> total+=c.length); const zip=new Uint8Array(total); let pos=0; chunks.forEach(c=>{ zip.set(c,pos); pos+=c.length; });
  const blob=new Blob([zip],{type:'application/zip'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='sase-policies.zip'; document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove();
}
