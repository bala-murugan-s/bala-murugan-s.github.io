export function escapeHtml(text = '') {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export async function copyText(text, button) {
  await navigator.clipboard.writeText(text);
  button.textContent = 'Copied ✔';
  setTimeout(() => button.textContent = 'Copy', 1500);
}

export function formatTable(rows = []) {
  if (!rows.length) return 'No sample output';

  const keys = Object.keys(rows[0]);
  const widths = {};

  keys.forEach(k => {
    widths[k] = Math.max(
      k.length,
      ...rows.map(r => String(r[k] ?? '').length)
    );
  });

  let output =
    keys.map(k => k.padEnd(widths[k])).join(' | ') + '\n' +
    keys.map(k => '-'.repeat(widths[k])).join('-|-') + '\n';

  rows.forEach(r => {
    output += keys.map(k => String(r[k] ?? '').padEnd(widths[k])).join(' | ') + '\n';
  });

  return output;
}
