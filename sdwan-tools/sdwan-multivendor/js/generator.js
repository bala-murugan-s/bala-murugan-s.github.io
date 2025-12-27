import { model } from './model.js';

function yamlEsc(v){ if(typeof v==='string') return v.replace('"','\\"'); return v; }

export const files = {
  'main.yml':'',
  'site_config.yml':'',
  'wan_circuits.yml':'',
  'lan_vlans.yml':'',
  'policies.yml':'',
  'inventory.ini':''
};

function genMainYml(){
  return `---\n- name: SD-WAN multi-vendor orchestration\n  hosts: all\n  gather_facts: no\n  vars:\n    vendor: ${model.vendor || 'unknown'}\n  tasks:\n    - name: Include site configuration\n      include_tasks: site_config.yml\n    - name: Configure WAN circuits\n      include_tasks: wan_circuits.yml\n    - name: Configure LAN VLANs\n      include_tasks: lan_vlans.yml\n    - name: Apply policies\n      include_tasks: policies.yml\n`;
}
function genInventory(){
  const sites = model.sites && model.sites.length? model.sites : [{ name: model.site.name||'primary-site', id: model.site.id||'1000'}];
  const lines = ['[sdwan]'];
  sites.forEach(s=> lines.push(`${s.name.replace(/\s+/g,'_')}  site_id=${s.id}`));
  lines.push('', '[all:vars]', `vendor=${model.vendor||'unknown'}`);
  return lines.join('\n') + '\n';
}
function genSiteConfig(){
  const s = model.site;
  return `---\n- name: Site configuration\n  vars:\n    site_name: "${yamlEsc(s.name||'')}"\n    site_id: "${yamlEsc(s.id||'')}"\n    site_type: "${yamlEsc(s.type||'')}"\n    timezone: "${yamlEsc(s.timezone||'')}"\n    users: "${yamlEsc(s.users||'')}"\n    criticality: "${yamlEsc(s.criticality||'')}"\n    address: "${yamlEsc(s.address||'')}"\n    email: "${yamlEsc(s.email||'')}"\n  block:\n    - name: Render vendor-specific templates\n      debug:\n        msg: "Rendering templates for vendor: ${model.vendor || 'unknown'}"\n`;
}
function genWanCircuits(){
  const lines = ['---', '- name: WAN circuit configuration', '  vars:', '    circuits:'];
  model.wan.forEach(w=>{
    lines.push(`      - name: "${yamlEsc(w.circuit)}"`);
    lines.push(`        type: ${w.type}`);
    lines.push(`        isp: "${yamlEsc(w.isp)}"`);
    lines.push(`        down_mbps: ${w.down}`);
    lines.push(`        up_mbps: ${w.up}`);
    lines.push(`        public_ip: "${yamlEsc(w.ip)}"`);
    lines.push(`        priority: ${w.priority}`);
  });
  lines.push('  tasks:', '    - name: Show circuits', '      debug:', '        var: circuits');
  return lines.join('\n')+'\n';
}
function genLanVlans(){
  const lines = ['---', '- name: LAN / VLAN configuration', '  vars:', '    vlans:'];
  model.vlans.forEach(v=>{
    lines.push(`      - id: ${v.id}`);
    lines.push(`        name: "${yamlEsc(v.name)}"`);
    lines.push(`        subnet: "${yamlEsc(v.subnet)}"`);
    lines.push(`        gateway: "${yamlEsc(v.gw)}"`);
    lines.push(`        dhcp: ${v.dhcp}`);
    lines.push(`        zone: ${v.zone}`);
  });
  lines.push('  tasks:', '    - name: Show VLANs', '      debug:', '        var: vlans');
  return lines.join('\n')+'\n';
}
function genPolicies(){
  const p = model.policies;
  const lines = ['---', '- name: SD-WAN policy configuration', '  vars:'];
  lines.push('    app_routing:'); p.app.forEach(a=> lines.push(`      - "${yamlEsc(a)}"`));
  lines.push('    qos:', `      voip_kbps: ${p.qos.voipKbps}`, `      video_mbps: ${p.qos.videoMbps}`, `      biz_pct: ${p.qos.bizPct}`);
  lines.push('    dia:', `      enabled: ${!!p.dia.enabled}`, '      apps:'); p.dia.apps.forEach(a=> lines.push(`        - "${yamlEsc(a)}"`));
  lines.push('    security:'); p.security.forEach(s=> lines.push(`      - "${yamlEsc(s)}"`));
  lines.push('  tasks:', '    - name: Show policies', '      debug:', '        msg: "Policies applied."');
  return lines.join('\n')+'\n';
}

export function generateAll(){
  files['main.yml'] = genMainYml();
  files['inventory.ini'] = genInventory();
  files['site_config.yml'] = genSiteConfig();
  files['wan_circuits.yml'] = genWanCircuits();
  files['lan_vlans.yml'] = genLanVlans();
  files['policies.yml'] = genPolicies();
  window.generatorApi = { files }; // expose for tabs
  alert('Playbooks generated. Use "View Generated Code" to preview and download.');
}

export function copyAllYaml(){
  const all = ['# main.yml','', files['main.yml'],'','## site_config.yml','', files['site_config.yml'],'','## wan_circuits.yml','', files['wan_circuits.yml'],'','## lan_vlans.yml','', files['lan_vlans.yml'],'','## policies.yml','', files['policies.yml'],'','## inventory.ini','', files['inventory.ini']].join('\n');
  navigator.clipboard.writeText(all).then(()=> alert('All YAML & INI copied to clipboard.')).catch(()=> alert('Clipboard copy failed.'));
}
