// js/ui/notifications.js
// Sistema de notificações e modais premium (Alert, Confirm, Prompt, Toast)

export const notifications = {
    /**
     * Mostra um toast rápido no canto inferior
     */
    toast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(100px);
            background: ${type === 'success' ? 'var(--accent)' : 'rgba(255,68,68,0.9)'};
            color: white; padding: 12px 24px; border-radius: 50px; font-size: .85rem; font-weight: 700;
            z-index: 10000; box-shadow: 0 10px 30px rgba(0,0,0,0.3); transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
            display: flex; align-items: center; gap: 10px; pointer-events: none;
        `;
        const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        document.body.appendChild(toast);

        // Animação de entrada
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Saída
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    },

    /**
     * Alerta Premium (Modal)
     */
    alert(title, message, icon = 'fa-circle-info') {
        return new Promise(resolve => {
            this._createModal({
                title, message, icon,
                buttons: [{ label: 'Entendido', type: 'primary', action: () => resolve(true) }]
            });
        });
    },

    /**
     * Confirmação Premium (Modal)
     */
    confirm(title, message, icon = 'fa-circle-question') {
        return new Promise(resolve => {
            this._createModal({
                title, message, icon,
                buttons: [
                    { label: 'Cancelar', type: 'secondary', action: () => resolve(false) },
                    { label: 'Confirmar', type: 'danger', action: () => resolve(true) }
                ]
            });
        });
    },

    /**
     * Prompt Premium (Modal com Input)
     */
    prompt(title, message, defaultValue = '', placeholder = 'Digite aqui...') {
        return new Promise(resolve => {
            const content = document.createElement('div');
            content.innerHTML = `
                <p style="font-size:.85rem; color:var(--text-secondary); margin-bottom:16px; line-height:1.5;">${message}</p>
                <input type="text" id="modal-prompt-input" value="${defaultValue}" placeholder="${placeholder}" 
                    style="width:100%; padding:14px; border-radius:12px; border:1px solid var(--glass-border); background:rgba(255,255,255,0.05); color:white; font-size:1rem; outline:none; font-family:inherit;">
            `;
            
            const modal = this._createModal({
                title, icon: 'fa-pen-to-square',
                customBody: content,
                buttons: [
                    { label: 'Cancelar', type: 'secondary', action: () => resolve(null) },
                    { label: 'Salvar', type: 'primary', action: () => {
                        const val = document.getElementById('modal-prompt-input').value;
                        resolve(val);
                    }}
                ]
            });

            // Focus input
            setTimeout(() => {
                const input = document.getElementById('modal-prompt-input');
                if (input) {
                    input.focus();
                    input.select();
                    input.onkeydown = (e) => {
                        if (e.key === 'Enter') modal.querySelector('.btn-modal-primary').click();
                    };
                }
            }, 100);
        });
    },

    /**
     * Interno: Cria a estrutura do modal
     */
    _createModal({ title, message, icon, buttons, customBody }) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,25,10,0.8);
            backdrop-filter:blur(8px); z-index:11000; display:flex; align-items:center; justify-content:center;
            opacity:0; transition:opacity 0.3s ease;
        `;

        const modal = document.createElement('div');
        modal.className = 'animate-fade';
        modal.style.cssText = `
            width:100%; max-width:400px; background:var(--allu-161617); border:1px solid var(--glass-border);
            border-radius:24px; padding:32px; text-align:center; box-shadow:0 30px 60px rgba(0,0,0,0.5);
            transform:scale(0.9); transition:transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        `;

        const iconHTML = icon ? `<div style="width:60px; height:60px; border-radius:50%; background:rgba(39,174,96,0.1); color:var(--accent); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:1.8rem;"><i class="fa-solid ${icon}"></i></div>` : '';
        
        modal.innerHTML = `
            ${iconHTML}
            <h3 style="font-size:1.3rem; font-weight:800; color:white; margin-bottom:12px;">${title}</h3>
            ${message ? `<p style="font-size:.9rem; color:var(--text-secondary); margin-bottom:24px; line-height:1.6;">${message}</p>` : ''}
            <div id="modal-body-container"></div>
            <div style="display:flex; gap:12px; margin-top:12px;"></div>
        `;

        if (customBody) modal.querySelector('#modal-body-container').appendChild(customBody);

        const btnContainer = modal.querySelectorAll('div')[modal.querySelectorAll('div').length - 1];
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.textContent = b.label;
            btn.className = `btn-modal-${b.type}`;
            btn.style.cssText = `
                flex:1; padding:14px; border-radius:12px; border:none; cursor:pointer; font-family:inherit;
                font-weight:800; font-size:.85rem; transition:all .2s;
            `;
            
            if (b.type === 'primary') {
                btn.style.background = 'var(--accent)';
                btn.style.color = 'white';
            } else if (b.type === 'secondary') {
                btn.style.background = 'rgba(255,255,255,0.05)';
                btn.style.color = 'var(--text-secondary)';
                btn.style.border = '1px solid var(--glass-border)';
            } else if (b.type === 'danger') {
                btn.style.background = '#ff4444';
                btn.style.color = 'white';
            }

            btn.onmouseenter = () => btn.style.filter = 'brightness(1.1)';
            btn.onmouseleave = () => btn.style.filter = 'none';
            btn.onclick = () => {
                b.action();
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.9)';
                setTimeout(() => overlay.remove(), 300);
            };
            btnContainer.appendChild(btn);
        });

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });

        return modal;
    }
};
