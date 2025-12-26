export const model = {
  currentStep: 1,
  vendor: null,
  site: { name:'', id:'', type:'Branch Office', timezone:'America/New_York', users:'1-25', criticality:'High', address:'', email:'' },
  wan: [],
  vlans: [],
  policies: { app: [], qos:{voipKbps:128, videoMbps:2, bizPct:50}, dia:{enabled:false, apps:[]}, security:[] },
  sites: []
};

export function initModel(){
  // seed defaults
  model.wan = [
    { circuit:'DIA-ISP1', type:'Internet', isp:'Comcast', down:500, up:50, ip:'', priority:'Primary' },
    { circuit:'MPLS-CarrierX', type:'MPLS', isp:'CarrierX', down:200, up:200, ip:'', priority:'Backup' }
  ];
  model.vlans = [
    { id:10, name:'Users', subnet:'10.10.10.0/24', gw:'10.10.10.1', dhcp:true, zone:'Trust' },
    { id:20, name:'Voice', subnet:'10.10.20.0/24', gw:'10.10.20.1', dhcp:false, zone:'Voice' }
  ];
  model.sites = [
    { name:'Branch-NYC-01', id:'1001', users:50, region:'US East', status:'Ready' }
  ];
}
