# Changelog - Allu Creative Lab

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [0.2.0] - 2026-04-30
### Adicionado
- Sistema de exportação multiformato: PNG, JPG e PDF integrado.
- Biblioteca de Logos: Sidebar dedicada com ativos oficiais da marca Allu.
- Sistema de Modelos: Implementação inicial de templates editáveis (ex: Assinaturas de Email).
- Onboarding Flow: Interface guiada para escolha de rede social e formato.
- Controles de Alinhamento: Ferramentas rápidas para alinhar objetos ao canvas.
- Zoom Inteligente: Sistema de zoom adaptativo com exibição percentual.

### Corrigido
- Cross-Origin em Imagens: Correção do erro de "canvas tainted" que impedia exportação de fotos de produtos.
- Alinhamento em Canvas Responsivo: Normalização de coordenadas para garantir alinhamento preciso independente do zoom.
- Contraste da UI: Melhoria na visibilidade dos ícones e textos da interface dark mode.
- Exportação Local: Lógica ajustada para funcionar via protocolo `file://` sem necessidade de servidor.

### Melhorado
- Estética Premium: Refinamento dos efeitos de Glassmorphism e micro-animações.
- Performance do Canvas: Otimização da renderização de múltiplos objetos Fabric.js.
- Sidebar Dinâmica: Transições suaves e carregamento assíncrono de componentes de ferramentas.

## [0.1.0] - 2026-04-29
### Adicionado
- Definição das regras iniciais do projeto (`RULES.md`).
- Estruturação do plano de implementação inicial.
- Criação deste arquivo de log e do roadmap.
- Integração da paleta de cores (39 cores identificadas) e tipografia (Plus Jakarta Sans).
- Implementação da estrutura base (HTML/CSS) com estética premium e Glassmorphism.
- Configuração inicial do motor gráfico (Fabric.js) com suporte a múltiplos formatos de redes sociais.
- Ferramentas básicas de edição: Texto, Imagens e Paleta de Cores.
- Reformulação da UI: Formatos movidos exclusivamente para o Onboarding; Sidebar focada em ferramentas de criação (Textos, Produtos, Camadas, Background).

