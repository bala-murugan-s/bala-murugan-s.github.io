function sanitize(v) {
  return v.replace(/[^\w.-]/g, '');
}

function buildSplunkQuery({ index, src, dest }) {
  let q = [];
  if (index) q.push(`index=${sanitize(index)}`);
  if (src) q.push(`src_ip=${sanitize(src)}`);
  if (dest) q.push(`dest_ip=${sanitize(dest)}`);
  return q.join(' ') + ' | sort -_time';
}

export { buildSplunkQuery };
