export function beautifyJSON(json) {
    return JSON.stringify(JSON.parse(json), null, 2);
}
export function beautifyXML(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
    return formatXML(doc.documentElement, 0);
}
function formatXML(node, indent) {
    const sp = '  '.repeat(indent);
    let result = `${sp}<${node.nodeName}>\n`;
    for (const child of node.childNodes) {
        if (child.nodeType === 1) result += formatXML(child, indent + 1);
        else if (child.nodeType === 3 && child.nodeValue.trim()) result += `${sp}  ${child.nodeValue.trim()}\n`;
    }
    return result + `${sp}</${node.nodeName}>\n`;
}