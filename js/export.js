// js/export.js
import { state } from './state.js';
import { carousel } from './carousel.js';
import { notifications } from './ui/notifications.js';


export function setupExport() {
    const btnDownload = document.getElementById('btn-download');
    const exportMenu = document.getElementById('export-menu');

    if (btnDownload && exportMenu) {
        btnDownload.onclick = (e) => {
            e.stopPropagation();
            exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
        };

        document.addEventListener('click', (e) => {
            const container = document.getElementById('export-dropdown-container');
            if (container && !container.contains(e.target)) {
                exportMenu.style.display = 'none';
            }
        });
    }

    document.querySelectorAll('.export-option').forEach(btn => {
        btn.onclick = () => {
            const canvas = state.getCanvas();
            if (!canvas) return;

            const format = btn.dataset.format;
            const btnMain = document.getElementById('btn-download');
            const originalContent = btnMain.innerHTML;
            
            // Esconder menu e guias
            const menu = document.getElementById('export-menu');
            if (menu) menu.style.display = 'none';
            const guides = document.querySelectorAll('.canvas-guide');
            guides.forEach(g => g.style.display = 'none');
            canvas.discardActiveObject();
            canvas.renderAll();

            btnMain.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando...';
            
            setTimeout(async () => {
                try {
                    // Verificação de segurança para o estado
                    if (!state || !state.canvases) {
                        console.error("Estado ou lista de canvases não encontrada:", state);
                        throw new Error("O sistema de exportação não foi inicializado corretamente.");
                    }

                    // Usar state.canvases para verificar múltiplas páginas
                    if (state.canvases.length > 1) {
                        const ok = await notifications.confirm(
                            'Exportar Carrossel', 
                            `Este projeto possui ${state.canvases.length} páginas. Deseja exportar todas individualmente?`,
                            'fa-images'
                        );
                        if (ok) {
                            await carousel.exportAll(format);
                            btnMain.innerHTML = originalContent;
                            guides.forEach(g => g.style.display = 'block');
                            return;
                        }
                    }


                    // Exportação normal (página atual)
                    if (format === 'pdf') {
                        const { jsPDF } = window.jspdf;
                        const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 1.0, multiplier: 2 });
                        const pdf = new jsPDF({
                            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                            unit: 'px',
                            format: [canvas.width, canvas.height]
                        });
                        pdf.addImage(dataURL, 'JPEG', 0, 0, canvas.width, canvas.height);
                        pdf.save('Allu_Creative_Lab_Design.pdf');
                    } else {
                        // Tentar gerar o DataURL
                        let dataURL;
                        try {
                            dataURL = canvas.toDataURL({
                                format: format === 'jpg' ? 'jpeg' : format,
                                quality: 0.9,
                                multiplier: 2 
                            });
                        } catch (canvasErr) {
                            console.warn("Erro ao gerar DataURL básico, tentando modo de segurança...", canvasErr);
                            // Se falhar (provavelmente por imagem externa sem CORS), 
                            // tentamos alertar o usuário especificamente sobre isso
                            throw new Error("SecurityError: Tainted canvas. Uma imagem externa impediu a exportação.");
                        }
                        
                        const link = document.createElement('a');
                        link.download = `Allu_Creative_Lab_Design.${format}`;
                        link.href = dataURL;
                        link.click();
                    }
                } catch (err) {
                    console.error("Erro ao exportar:", err);
                    
                    if (err.message.includes("SecurityError") || err.message.includes("Tainted")) {
                        notifications.alert(
                            "Erro de Segurança", 
                            "Não foi possível gerar a imagem devido a restrições de segurança com imagens externas. Tente remover o último produto adicionado ou recarregar a página.",
                            "fa-shield-halved"
                        );
                    } else {
                        notifications.alert(
                            "Erro na Exportação", 
                            "Ops! Ocorreu um erro ao tentar exportar seu design. Por favor, tente novamente.",
                            "fa-circle-xmark"
                        );
                    }
                } finally {
                    btnMain.innerHTML = originalContent;
                    guides.forEach(g => g.style.display = 'block');
                }
            }, 500);

        };
    });
}
