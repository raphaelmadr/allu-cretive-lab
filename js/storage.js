// js/storage.js
// Gerencia o armazenamento persistente de designs e pastas.

const KEYS = {
    FOLDERS: 'allu_folders',
    DESIGNS: 'allu_designs'
};

function get(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
}
function set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

export function initStorage() {
    let folders = get(KEYS.FOLDERS);
    if (folders.length === 0) {
        folders = [
            { id: 'f1', name: 'Modelos Gerais', createdAt: new Date().toISOString() },
            { id: 'f2', name: 'Assinaturas', createdAt: new Date().toISOString() }
        ];
        set(KEYS.FOLDERS, folders);
    }
}

export function getFolders() {
    return get(KEYS.FOLDERS);
}

export function createFolder(name) {
    const folders = get(KEYS.FOLDERS);
    const newFolder = {
        id: 'f-' + Date.now(),
        name,
        createdAt: new Date().toISOString()
    };
    folders.push(newFolder);
    set(KEYS.FOLDERS, folders);
    return newFolder;
}

export function getDesigns(folderId = null) {
    const designs = get(KEYS.DESIGNS);
    return folderId ? designs.filter(d => d.folderId === folderId) : designs;
}

export function saveDesign(data) {
    const designs = get(KEYS.DESIGNS);
    const idx = designs.findIndex(d => d.id === data.id);
    
    const now = new Date().toISOString();
    if (idx > -1) {
        designs[idx] = { ...designs[idx], ...data, updatedAt: now };
    } else {
        designs.unshift({
            ...data,
            id: data.id || 'd-' + Date.now(),
            createdAt: now,
            updatedAt: now
        });
    }
    set(KEYS.DESIGNS, designs);
    return data.id || designs[0].id;
}

export function deleteDesign(id) {
    const designs = get(KEYS.DESIGNS).filter(d => d.id !== id);
    set(KEYS.DESIGNS, designs);
}

export function getDesignById(id) {
    return get(KEYS.DESIGNS).find(d => d.id === id);
}
