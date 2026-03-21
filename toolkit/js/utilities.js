export function decodeJWT(token) {
    const [h, p] = token.split('.');
    return JSON.stringify({
        header: JSON.parse(atob(h)),
        payload: JSON.parse(atob(p))
    }, null, 2);
}
export function convertTimestamp(input) {
    const num = parseInt(input);
    const date = isNaN(num) ? new Date(input) : new Date(num * 1000);
    return JSON.stringify({
        unix: Math.floor(date.getTime() / 1000),
        iso: date.toISOString(),
        human: date.toString()
    }, null, 2);
}
export function generateTextDiff(text) {
    const lines = text.split('\n');
    return `Lines: ${lines.length}\nChars: ${text.length}\nWords: ${text.split(/\s+/).length}\n\n${lines.map((l, i) => `${i + 1}: ${l}`).join('\n')}`;
}