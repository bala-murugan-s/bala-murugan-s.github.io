import { model, setTheme } from './model.js';
import { showError, clearError } from './validation.js';
import * as conv from './converters.js';
import * as beau from './beautifiers.js';
import * as enc from './encoders.js';
import * as util from './utilities.js';
import * as hash from './hash.js';
//import * as gen from './generators.js';
import * as qrcode from './qrcode.js';
//import * as colors from './colors.js';
//import * as regex from './regex.js';
//import * as jsonpath from './jsonpath.js';
//import * as markdown from './markdown.js';
//import * as htmlentity from './htmlentity.js';
//import * as uuid from './uuid.js';


export function initUI() {
    setTheme(model.theme);
    renderToolCards(model.currentCategory);
    
    document.getElementById('themeToggle').onclick = () => setTheme(model.theme === 'light' ? 'dark' : 'light');
    document.querySelectorAll('.cat-btn').forEach(btn => btn.onclick = () => switchCategory(btn.dataset.category));
    document.getElementById('backBtn').onclick = backToTools;
    document.getElementById('sampleBtn').onclick = loadSample;
    document.getElementById('clearInputBtn').onclick = clearAll;
    document.getElementById('copyBtn').onclick = copyOutput;
    document.getElementById('downloadBtn').onclick = downloadOutput;
    document.getElementById('inputArea').oninput = debounce(processInput, 500);
}

function switchCategory(cat) {
    model.currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.category === cat));
    renderToolCards(cat);
}

function renderToolCards(cat) {
    const tools = model.tools[cat] || [];
    document.getElementById('toolCards').innerHTML = tools.map(t => 
        `<div class="tool-card" onclick="window.openTool('${t.id}')">
            <div class="icon">${t.icon}</div>
            <h3>${t.name}</h3>
            <p>${t.desc}</p>
        </div>`
    ).join('');
    document.getElementById('toolCards').classList.remove('hidden');
    document.getElementById('toolInterface').classList.add('hidden');
}

window.openTool = (id) => {
    model.currentTool = id;
    const tool = Object.values(model.tools).flat().find(t => t.id === id);
    document.getElementById('toolTitle').textContent = tool.name;
    document.getElementById('toolCards').classList.add('hidden');
    document.getElementById('toolInterface').classList.remove('hidden');
    clearAll();
};

function backToTools() {
    clearAll();
    renderToolCards(model.currentCategory);
}

function clearAll() {
    document.getElementById('inputArea').value = '';
    document.getElementById('outputArea').value = '';
    document.getElementById('qrCanvas').classList.add('hidden');
    document.getElementById('previewArea').classList.add('hidden');
    document.getElementById('outputArea').classList.remove('hidden');
    clearError();
}

function loadSample() {
    const samples = {
        'json-xml': '{"user":{"name":"John","age":30}}',
        'json-yaml': '{"name":"MyApp","version":"1.0.0"}',
        'json-csv': '[{"name":"Alice","age":25,"city":"NYC"},{"name":"Bob","age":30,"city":"LA"}]',
        'json-beautify': '{"compact":true,"data":[1,2,3]}',
        'xml-beautify': '<root><item>Test</item><item>Data</item></root>',
        'url-encode': 'https://example.com/search?q=hello world&lang=en',
        'base64-encode': 'Hello, World! This is a test message.',
        'html-entity': '<div class="test">Hello & goodbye</div>',
        'hash-generator': 'The quick brown fox jumps over the lazy dog',
        'text-diff': 'The quick brown fox\\njumps over the lazy dog',
        'regex-tester': 'test@example.com\\nuser@domain.org\\ninvalid-email',
        'json-path': '{"users":[{"name":"Alice","age":25},{"name":"Bob","age":30}]}',
        'jwt-decode': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'timestamp-convert': '1735394400',
        'uuid-generator': 'Click to generate UUIDs',
        'qr-generator': 'https://github.com',
        'color-convert': '#3b82f6',
        'markdown-preview': '# Hello World\\n\\nThis is **bold** and this is *italic*.\\n\\n- Item 1\\n- Item 2\\n\\n```javascript\\nconst x = 42;\\n```'
    };
    document.getElementById('inputArea').value = samples[model.currentTool] || '';
    processInput();
}

function copyOutput() {
    const output = document.getElementById('outputArea').value;
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
        const btn = document.getElementById('copyBtn');
        const orig = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = orig, 2000);
    });
}

function downloadOutput() {
    const output = document.getElementById('outputArea').value;
    if (!output) return;
    const blob = new Blob([output], {type: 'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `output-${Date.now()}.txt`;
    a.click();
}

function processInput() {
    clearError();
    const input = document.getElementById('inputArea').value.trim();
    
    // Hide all output containers first
    document.getElementById('outputArea').classList.remove('hidden');
    document.getElementById('qrCanvas').classList.add('hidden');
    document.getElementById('previewArea').classList.add('hidden');
    
    if (!input && model.currentTool !== 'uuid-generator') {
        document.getElementById('outputArea').value = '';
        return;
    }
    
    try {
        let output = '';
        const t = model.currentTool;
        
        if (t === 'json-xml') {
            output = input.startsWith('<') ? conv.convertXMLtoJSON(input) : conv.convertJSONtoXML(input);
        } else if (t === 'json-yaml') {
            output = input.includes(':') && !input.startsWith('{') ? conv.convertYAMLtoJSON(input) : conv.convertJSONtoYAML(input);
        } else if (t === 'json-csv') {
            output = conv.convertJSONtoCSV(input);
        } else if (t === 'color-convert') {
            output = conv.convertColor(input);
        } else if (t === 'json-beautify') {
            output = beau.beautifyJSON(input);
        } else if (t === 'xml-beautify') {
            output = beau.beautifyXML(input);
        } else if (t === 'markdown-preview') {
            document.getElementById('outputArea').classList.add('hidden');
            document.getElementById('previewArea').classList.remove('hidden');
            document.getElementById('previewArea').innerHTML = beau.renderMarkdown(input);
            return;
        } else if (t === 'url-encode') {
            output = input.includes('%') ? enc.decodeURL(input) : enc.encodeURL(input);
        } else if (t === 'base64-encode') {
            output = /^[A-Za-z0-9+/=]+$/.test(input) && input.length % 4 === 0 ? enc.decodeBase64(input) : enc.encodeBase64(input);
        } else if (t === 'html-entity') {
            output = input.includes('&') && input.includes(';') ? enc.decodeHTMLEntity(input) : enc.encodeHTMLEntity(input);
        } else if (t === 'hash-generator') {
            output = enc.generateHashes(input);
        } else if (t === 'text-diff') {
            output = util.generateTextDiff(input);
        } else if (t === 'regex-tester') {
            output = util.testRegex(input);
        } else if (t === 'json-path') {
            output = util.evaluateJSONPath(input);
        } else if (t === 'jwt-decode') {
            output = util.decodeJWT(input);
        } else if (t === 'timestamp-convert') {
            output = util.convertTimestamp(input);
        } else if (t === 'uuid-generator') {
            output = gen.generateUUIDs(10);
        } else if (t === 'qr-generator') {
            document.getElementById('outputArea').classList.add('hidden');
            document.getElementById('qrCanvas').classList.remove('hidden');
            gen.generateQRCode(input, document.getElementById('qrCanvas'));
            output = 'QR Code generated above';
        }
        
        document.getElementById('outputArea').value = output;
    } catch (e) {
        showError(e.message);
    }
}

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

import { generateQRCodeEnhanced } from './qrcode.js';

export function initQRCodeUI() {
    const input = document.getElementById('qr-input');
    const canvas = document.getElementById('qr-canvas');
    const button = document.getElementById('qr-generate');
    const download = document.getElementById('qr-download');

    if (!input || !canvas || !button) {
        console.warn('QR UI elements not found');
        return;
    }

    button.addEventListener('click', () => {
        const text = input.value.trim();

        if (!text) {
            alert('Please enter text or a URL');
            return;
        }

        try {
            const dataUrl = generateQRCodeEnhanced(text, canvas, {
                size: 256,
                foreground: '#000000',
                background: '#ffffff'
            });

            // Enable download if button exists
            if (download) {
                download.href = dataUrl;
                download.download = 'qrcode.png';
                download.style.display = 'inline-block';
            }
        } catch (err) {
            alert(err.message);
        }
    });
}
