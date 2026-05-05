// js/storage.js
// Gerencia o armazenamento persistente de designs, pastas e usuários (simulando um BD).

const KEYS = {
    USERS: 'allu_users',
    FOLDERS: 'allu_folders',
    DESIGNS: 'allu_designs'
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function get(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
}
function set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

// ── Users ─────────────────────────────────────────────────────────────────────
export function initStorage() {
    let users = get(KEYS.USERS);
    if (users.length === 0) {
        users = [
            { id: 'u1', name: 'Raphael Madureira', avatar: 'https://github.com/raphaelmadr.png' },
            { id: 'u2', name: 'Time Design Allu', avatar: '' },
            { id: 'u3', name: 'Visitante', avatar: '' }
        ];
        set(KEYS.USERS, users);
    }

    let folders = get(KEYS.FOLDERS);
    if (folders.length === 0) {
        folders = [
            { id: 'f1', userId: 'u1', name: 'Assinaturas Oficiais', createdAt: new Date().toISOString() },
            { id: 'f2', userId: 'u2', name: 'Catálogo de Produtos', createdAt: new Date().toISOString() },
            { id: 'f3', userId: 'u3', name: 'Rascunhos', createdAt: new Date().toISOString() }
        ];
        set(KEYS.FOLDERS, folders);
    }
}

export function getUsers() { return get(KEYS.USERS); }

export function getCurrentUser() { 
    const id = localStorage.getItem('allu_current_user_id');
    return getUsers().find(u => u.id === id) || null; 
}

export function setCurrentUser(id) {
    localStorage.setItem('allu_current_user_id', id);
}


// ── Folders ───────────────────────────────────────────────────────────────────
export function getFolders(userId = null) {
    const folders = get(KEYS.FOLDERS);
    return userId ? folders.filter(f => f.userId === userId) : folders;
}

export function createFolder(name, userId) {
    const folders = get(KEYS.FOLDERS);
    const newFolder = {
        id: 'f-' + Date.now(),
        name,
        userId,
        createdAt: new Date().toISOString()
    };
    folders.push(newFolder);
    set(KEYS.FOLDERS, folders);
    return newFolder;
}

// ── Designs ───────────────────────────────────────────────────────────────────
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
