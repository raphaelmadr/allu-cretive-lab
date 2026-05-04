# Changelog - Allu Creative Lab

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [0.3.1] - 2026-05-04
### Corrigido
- **Fidelidade de Preços**: Correção da divergência de preços das assinaturas de catálogo em relação ao site oficial da Allugator.
- **Personalização de Preços**: Adicionados inputs de texto na Sidebar (aba de Propriedades) que permitem a alteração dinâmica e em tempo real dos preços dos produtos nos modos Card e Tabela.

## [0.3.0] - 2026-04-30
### Adicionado
- **Automação de Sincronização (GitHub Actions)**: O catálogo de produtos agora é atualizado automaticamente a cada 1 hora via GitHub Actions, garantindo preços sempre atualizados sem intervenção manual.
- **Indicador de Status do Banco**: Novo componente na sidebar de produtos que mostra a data/hora da última sincronização e o status de conexão com o banco.
- **Scripts de Manutenção**: Implementação de `sync_products.py` otimizado para scraping massivo e bypass de proteções.
- **Sistema de Templates para Assinaturas**: Suporte inicial para modelos de assinatura de email dinâmicos.

### Melhorado
- **Fluxo de Dados**: Transição de sincronização local para pipeline em nuvem.
- **UX de Produtos**: Busca instantânea e feedback visual de produtos carregados.
- **Estrutura de Arquivos**: Organização melhorada de assets e scripts de sincronização.

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

