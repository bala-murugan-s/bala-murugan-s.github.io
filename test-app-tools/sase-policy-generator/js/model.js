export const model = {
  currentStep: 1,
  vendor: null,
  tenant: { tenant:'', accountId:'', apiToken:'', authType:'Bearer', baseUrl:'', notes:'' },
  types: [],
  rules: {
    ziaUrl: [], ziaFw: [], zpaAccess: [], zpaAppseg: [],
    umbrellaDest: [], umbrellaWeb: [], cfAccess: [], cfGateway: [], prisma: [], netskope: []
  }
};

export function initModel(){ /* defaults */ }
