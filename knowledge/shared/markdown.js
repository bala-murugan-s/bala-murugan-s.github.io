function markdownToHTML(md) {
    return md
        .replace(/^### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^## (.*$)/gim, '<h3>$1</h3>')
        .replace(/^# (.*$)/gim, '<h2>$1</h2>')
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/\n$/gim, '<br>');
}