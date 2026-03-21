export const model = {
    currentCategory: 'converters',
    currentTool: null,
    theme: localStorage.getItem('theme') || 'light',
    tools: {
        converters: [
            { id: 'json-xml', name: 'JSON ⇄ XML', icon: '🔄', desc: 'Convert JSON/XML bidirectionally' },
            { id: 'json-yaml', name: 'JSON ⇄ YAML', icon: '🔄', desc: 'Convert JSON/YAML bidirectionally' },
            { id: 'json-csv', name: 'JSON → CSV', icon: '📊', desc: 'Convert JSON arrays to CSV' },
            { id: 'color-convert', name: 'Color Converter', icon: '🎨', desc: 'Convert HEX ↔ RGB ↔ HSL' }
        ],
        beautifiers: [
            { id: 'json-beautify', name: 'JSON Beautifier', icon: '✨', desc: 'Format and prettify JSON' },
            { id: 'xml-beautify', name: 'XML Beautifier', icon: '✨', desc: 'Format and prettify XML' },
            { id: 'markdown-preview', name: 'Markdown Preview', icon: '📝', desc: 'Preview Markdown as HTML' }
        ],
        encoders: [
            { id: 'url-encode', name: 'URL Encode/Decode', icon: '🔐', desc: 'Encode or decode URLs' },
            { id: 'base64-encode', name: 'Base64 Encode/Decode', icon: '🔐', desc: 'Encode or decode Base64' },
            { id: 'html-entity', name: 'HTML Entity Encode/Decode', icon: '🔣', desc: 'Encode/decode HTML entities' },
            { id: 'hash-generator', name: 'Hash Generator', icon: '🔒', desc: 'Generate MD5, SHA-1, SHA-256 hashes' }
        ],
        texttools: [
            { id: 'text-diff', name: 'Text Diff', icon: '⚖️', desc: 'Compare and analyze text' },
            { id: 'regex-tester', name: 'Regex Tester', icon: '🔍', desc: 'Test regular expressions' },
            { id: 'json-path', name: 'JSON Path Evaluator', icon: '🗺️', desc: 'Query JSON with JSONPath' }
        ],
        utilities: [
            { id: 'jwt-decode', name: 'JWT Decoder', icon: '🎫', desc: 'Decode and inspect JWT tokens' },
            { id: 'timestamp-convert', name: 'Timestamp Converter', icon: '⏰', desc: 'Convert Unix/ISO timestamps' }
        ],
        generators: [
            { id: 'uuid-generator', name: 'UUID Generator', icon: '🆔', desc: 'Generate UUIDs (v4)' },
            { id: 'qr-generator', name: 'QR Code Generator', icon: '📱', desc: 'Generate QR codes from text' }
        ]
    }
};

export function setTheme(theme) {
    model.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
}