import { initModel, model } from './model.js';
import { bindVendor, bindSite, bindWan, bindLan, bindPolicies, bindSites, renderSummary, goToStep, nextStep, prevStep, initTabs, toggleTheme, updateSidebar } from './ui.js';
import { validateStep } from './validation.js';
import { generateAll, files, copyAllYaml } from './generator.js';
import { saveLocal, loadLocal, clearAll, exportJSON, importJSON, loadFromFile } from './storage.js';
import { downloadActiveFile, downloadZip } from './zip.js';
import { drawWanChart } from './chart.js';

// Init
initModel();
bindVendor();
bindSite();
bindWan();
bindLan();
bindPolicies();
bindSites();
initTabs();
renderSummary();
updateSidebar();

// Pager
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
btnPrev.addEventListener('click',()=>{ if(validateStep(model.currentStep)) prevStep(); });
btnNext.addEventListener('click',()=>{ if(validateStep(model.currentStep)) nextStep(); });

// Step pills
Array.from(document.querySelectorAll('#stepList li')).forEach(li=>{
  li.addEventListener('click',()=>{ const s=Number(li.dataset.step); if(validateStep(model.currentStep)) goToStep(s); });
});

// Actions
const btnGenerate = document.getElementById('btnGenerate');
const btnViewCode = document.getElementById('btnViewCode');
const btnDownloadActive = document.getElementById('btnDownloadActive');
const btnCopyAll = document.getElementById('btnCopyAll');
const btnDownloadZip = document.getElementById('btnDownloadZip');
const codeModal = document.getElementById('codeModal');

btnGenerate.addEventListener('click',()=>{ generateAll(); renderSummary(); updateSidebar(); drawWanChart(); });
btnViewCode.addEventListener('click',()=>{ if(!files['main.yml']) generateAll(); codeModal.showModal(); });
btnDownloadActive.addEventListener('click',()=> downloadActiveFile());
btnCopyAll.addEventListener('click',()=> copyAllYaml());
btnDownloadZip.addEventListener('click',()=> downloadZip(files));

// Theme toggle
const btnTheme = document.getElementById('btnTheme');
btnTheme.addEventListener('click', toggleTheme);

// Storage / Import/Export
const btnSaveLS = document.getElementById('btnSaveLS');
const btnLoadLS = document.getElementById('btnLoadLS');
const btnClear = document.getElementById('btnClear');
const btnExportJSON = document.getElementById('btnExportJSON');
const fileImportJSON = document.getElementById('fileImportJSON');
const fileLoadJSON = document.getElementById('fileLoadJSON');

btnSaveLS.addEventListener('click', ()=> saveLocal());
btnLoadLS.addEventListener('click', ()=> loadLocal());
btnClear.addEventListener('click', ()=> clearAll());
btnExportJSON.addEventListener('click', ()=> exportJSON());
fileImportJSON.addEventListener('change', (e)=> importJSON(e.target.files?.[0]));
fileLoadJSON.addEventListener('change', (e)=> loadFromFile(e.target.files?.[0]));

// Close modal
const btnCloseModal = document.getElementById('btnCloseModal');
btnCloseModal.addEventListener('click', ()=> codeModal.close());
