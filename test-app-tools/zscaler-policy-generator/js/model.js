export const model = {
  currentStep: 1,
  product: null, // 'zia' | 'zpa'
  tenant: { baseUrl:'', tenant:'', authType:'ZIA Session Cookie (JSESSIONID)', apiToken:'', notes:'' },
  types: [],
  rules: { ziaUrl:[], ziaFw:[], ziaSsl:[], ziaDlp:[], zpaAccess:[], zpaAppseg:[] }
};
export function initModel(){ /* no seeds */ }
