// js/export.js
import { state } from './state.js';
import { carousel } from './carousel.js';

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
                    if (carousel.active && carousel.pages.length > 1) {
                        if (confirm(`Este é um carrossel com ${carousel.pages.length} páginas. Deseja exportar todas?`)) {
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
                        const dataURL = canvas.toDataURL({
                            format: format === 'jpg' ? 'jpeg' : format,
                            quality: 0.9,
                            multiplier: 2 
                        });
                        
                        const link = document.createElement('a');
                        link.download = `Allu_Creative_Lab_Design.${format}`;
                        link.href = dataURL;
                        link.click();
                    }
                } catch (err) {
                    console.error("Erro ao exportar:", err);
                    alert("Ocorreu um erro ao exportar. Tente rodar o projeto em um servidor local se o erro persistir.");
                } finally {
                    btnMain.innerHTML = originalContent;
                    guides.forEach(g => g.style.display = 'block');
                }
            }, 500);
        };
    });
}
