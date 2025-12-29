export function showError(msg) {
    const el = document.getElementById('errorMsg');
    el.textContent = '❌ ' + msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

export function clearError() {
    document.getElementById('errorMsg').classList.add('hidden');
}