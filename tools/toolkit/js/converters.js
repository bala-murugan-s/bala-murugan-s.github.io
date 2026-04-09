export function convertJSONtoXML(json) {
    const obj = JSON.parse(json);
    return objToXML(obj, 'root');
}
function objToXML(obj, name) {
    let xml = `<${name}>`;
    for (const [k, v] of Object.entries(obj)) {
        if (Array.isArray(v)) v.forEach(i => xml += objToXML(i, k));
        else if (typeof v === 'object' && v) xml += objToXML(v, k);
        else xml += `<${k}>${v}</${k}>`;
    }
    return xml + `</${name}>`;
}
export function convertXMLtoJSON(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
    return JSON.stringify(xmlToObj(doc.documentElement), null, 2);
}
function xmlToObj(node) {
    const obj = {};
    for (const child of node.childNodes) {
        if (child.nodeType === 1) {
            const val = xmlToObj(child);
            obj[child.nodeName] = obj[child.nodeName] ? [].concat(obj[child.nodeName], val) : val;
        } else if (child.nodeType === 3 && child.nodeValue.trim()) {
            return child.nodeValue.trim();
        }
    }
    return Object.keys(obj).length ? obj : node.textContent;
}
export function convertJSONtoYAML(json) {
    const obj = JSON.parse(json);
    return objToYAML(obj, 0);
}
function objToYAML(obj, indent) {
    const sp = '  '.repeat(indent);
    let yaml = '';
    if (Array.isArray(obj)) {
        obj.forEach(item => yaml += `${sp}- ${typeof item === 'object' ? '\n' + objToYAML(item, indent + 1) : item}\n`);
    } else if (typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
            yaml += `${sp}${k}: ${typeof v === 'object' ? '\n' + objToYAML(v, indent + 1) : v}\n`;
        }
    }
    return yaml;
}
export function convertYAMLtoJSON(yaml) {
    const lines = yaml.split('\n').filter(l => l.trim());
    const obj = {};
    let current = obj;
    lines.forEach(line => {
        const match = line.match(/^(\s*)(\w+):\s*(.*)$/);
        if (match) {
            const key = match[2], val = match[3];
            current[key] = val || {};
        }
    });
    return JSON.stringify(obj, null, 2);
}
export function parseYAMLValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (!isNaN(value) && value !== '') return Number(value);
    return value;
}
export function convertJSONtoCSV(json) {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) throw new Error('Must be array');
    const headers = Object.keys(arr[0]);
    const rows = arr.map(row => headers.map(h => row[h]).join(','));
    return [headers.join(','), ...rows].join('\n');
}
export function convertColor(input) {
    if (!input || typeof input !== 'string') {
        return 'Invalid color format';
    }

    input = input.trim().toLowerCase();

    try {
        // HEX
        if (input.startsWith('#')) {
            const { r, g, b, a } = parseHex(input);
            return formatOutput({ r, g, b, a });
        }

        // RGB / RGBA
        if (input.startsWith('rgb')) {
            const { r, g, b, a } = parseRgb(input);
            return formatOutput({ r, g, b, a });
        }

        // HSL / HSLA
        if (input.startsWith('hsl')) {
            const { h, s, l, a } = parseHsl(input);
            const { r, g, b } = hslToRgb(h, s, l);
            return formatOutput({ r, g, b, a });
        }

        return 'Invalid color format';
    } catch {
        return 'Invalid color format';
    }
}

/* ─────────────── FORMATTERS ─────────────── */

function formatOutput({ r, g, b, a = 1 }) {
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);

    return [
        `HEX: ${hex}`,
        `RGB: rgb(${r}, ${g}, ${b})`,
        `RGBA: rgba(${r}, ${g}, ${b}, ${a})`,
        `HSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
        `HSLA: hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`
    ].join('\n');
}

/* ─────────────── PARSERS ─────────────── */

function parseHex(hex) {
    hex = hex.replace('#', '');

    if (![3, 6].includes(hex.length)) {
        throw new Error();
    }

    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }

    const num = parseInt(hex, 16);

    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
        a: 1
    };
}

function parseRgb(input) {
    const values = input.match(/[\d.]+/g)?.map(Number);

    if (!values || values.length < 3) {
        throw new Error();
    }

    return {
        r: clamp(values[0]),
        g: clamp(values[1]),
        b: clamp(values[2]),
        a: values[3] ?? 1
    };
}

function parseHsl(input) {
    const values = input.match(/[\d.]+/g)?.map(Number);

    if (!values || values.length < 3) {
        throw new Error();
    }

    return {
        h: values[0] % 360,
        s: clamp(values[1], 0, 100),
        l: clamp(values[2], 0, 100),
        a: values[3] ?? 1
    };
}

/* ─────────────── CONVERTERS ─────────────── */

function rgbToHex(r, g, b) {
    return (
        '#' +
        [r, g, b]
            .map(v => v.toString(16).padStart(2, '0'))
            .join('')
    );
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h *= 60;
    }

    return {
        h: Math.round(h),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

/* ─────────────── UTIL ─────────────── */

function clamp(value, min = 0, max = 255) {
    return Math.min(max, Math.max(min, Math.round(value)));
}

function resolveNamedColor(name) {
    const el = document.createElement('div');
    el.style.color = name;
    document.body.appendChild(el);

    const computed = getComputedStyle(el).color;
    document.body.removeChild(el);

    if (!computed || !computed.startsWith('rgb')) {
        throw new Error('Invalid color name');
    }

    const values = computed.match(/\d+/g).map(Number);
    return { r: values[0], g: values[1], b: values[2], a: 1 };
}
