import { initModel, model } from './model.js';
import { bindVendor, bindTenant, bindTypes, bindBuilders, goToStep, nextStep, prevStep, renderSummary, updateSidebar, initTabs, toggleTheme } from './ui.js';
import { validateStep } from './validation.js';
import { generateAll, files, copyAllPayloads } from './generators.js';
import { saveLocal, loadLocal, clearAll, exportJSON, importJSON, loadFromFile } from './storage.js';
import { drawRulesChart } from './chart.js';
import { downloadActiveFile, downloadZip } from './zip.js';

// Init
initModel();
bindVendor();
bindTenant();
bindTypes();
bindBuilders();
initTabs();
renderSummary();
updateSidebar();

// Pager
document.getElementById('btnPrev').addEventListener('click',()=>{ if(validateStep(model.currentStep)) prevStep(); });
document.getElementById('btnNext').addEventListener('click',()=>{ if(validateStep(model.currentStep)) nextStep(); });
Array.from(document.querySelectorAll('#stepList li')).forEach(li=> li.addEventListener('click',()=>{ const s=Number(li.dataset.step); if(validateStep(model.currentStep)) goToStep(s); }));

// Actions
document.getElementById('btnGenerate').addEventListener('click',()=>{ generateAll(); renderSummary(); updateSidebar(); drawRulesChart(); });
document.getElementById('btnViewCode').addEventListener('click',()=>{ if(!Object.keys(files).length) generateAll(); document.getElementById('codeModal').showModal(); });
document.getElementById('btnDownloadActive').addEventListener('click',()=> downloadActiveFile());
document.getElementById('btnCopyAll').addEventListener('click',()=> copyAllPayloads());
document.getElementById('btnDownloadZip').addEventListener('click',()=> downloadZip(files));

// Theme
document.getElementById('btnTheme').addEventListener('click', toggleTheme);

// Storage
document.getElementById('btnSaveLS').addEventListener('click', ()=> saveLocal());
document.getElementById('btnLoadLS').addEventListener('click', ()=> loadLocal());
document.getElementById('btnClear').addEventListener('click', ()=> clearAll());
document.getElementById('btnExportJSON').addEventListener('click', ()=> exportJSON());
document.getElementById('fileImportJSON').addEventListener('change', (e)=> importJSON(e.target.files?.[0]));
document.getElementById('fileLoadJSON').addEventListener('change', (e)=> loadFromFile(e.target.files?.[0]));

// Close modal
document.getElementById('btnCloseModal').addEventListener('click', ()=> document.getElementById('codeModal').close());
