// js/ui/auth.js
import { state } from '../state.js';
import * as storage from '../storage.js';

export function setupAuth() {
    const user = storage.getCurrentUser();
    if (!user) {
        showLoginModal();
    } else {
        state.currentUser = user;
    }
}

function showLoginModal() {
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,25,10,0.95);
        backdrop-filter:blur(10px);z-index:9999;display:flex;align-items:center;justify-content:center;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        width:100%;max-width:400px;background:var(--glass-bg);border:1px solid var(--glass-border);
        border-radius:24px;padding:32px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.5);
    `;

    modal.innerHTML = `
        <img src="https://allugator.com.br/static/media/logo-allu.7e67176a.svg" style="height:24px;margin-bottom:24px;filter:brightness(10);">
        <h2 style="font-size:1.4rem;color:white;margin-bottom:8px;font-weight:800;">Quem está acessando?</h2>
        <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:32px;">Selecione seu perfil para gerenciar seus modelos e catálogos.</p>
        
        <div id="auth-users-grid" style="display:grid;grid-template-columns:1fr;gap:12px;"></div>
    `;

    const grid = modal.querySelector('#auth-users-grid');
    storage.getUsers().forEach(u => {
        const btn = document.createElement('button');
        btn.style.cssText = `
            display:flex;align-items:center;gap:12px;padding:16px;border-radius:16px;
            background:rgba(255,255,255,0.03);border:1px solid var(--glass-border);
            color:white;cursor:pointer;transition:all .2s;text-align:left;
        `;
        btn.innerHTML = `
            <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid var(--accent-low);">
                ${u.avatar ? `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover;">` : `<i class="fa-solid fa-user" style="opacity:.3;"></i>`}
            </div>
            <div>
                <div style="font-size:.9rem;font-weight:700;">${u.name}</div>
                <div style="font-size:.7rem;opacity:.5;">Acesso Administrativo</div>
            </div>
        `;
        btn.onmouseenter = () => { btn.style.background = 'rgba(255,255,255,0.06)'; btn.style.borderColor = 'var(--accent)'; };
        btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.03)'; btn.style.borderColor = 'var(--glass-border)'; };
        
        btn.onclick = () => {
            storage.setCurrentUser(u.id);
            state.currentUser = u;
            overlay.remove();
            location.reload(); // Recarrega para aplicar o contexto
        };
        grid.appendChild(btn);
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
