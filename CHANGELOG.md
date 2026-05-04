# Changelog - Allu Creative Lab

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [0.4.0] - 2026-05-04
### Adicionado
- **Construtor de Selos (Badges)**: Novo módulo completo para criação de selos personalizados (Oferta, % OFF, Entrega Rápida) com formas geométricas dinâmicas (Estrela, Explosão, Círculo).
- **Controles Avançados de Selos**: Ajustes em tempo real de espessura de ícone, altura de linha, espaçamento de fonte, sombras e bordas.
- **Sistema de Modelos (Templates)**: Nova aba de Modelos que permite salvar, carregar, atualizar, exportar e importar o estado completo do canvas (artes inteiras) para colaboração.
- **Preview em Tempo Real**: Mini-canvas integrado na sidebar de selos que reflete todas as alterações de design instantaneamente.

### Melhorado
- **Curadoria de Cores**: Restrição estrita das paletas de cores de fundo e texto para alinhar com o Key Visual (KV) da marca Allu.
- **UX de Propriedades**: Ocultação inteligente de propriedades irrelevantes (como borda/fundo de texto) para manter a interface limpa.
- **Navegação do Canvas**: Implementação de zoom-to-cursor (comportamento estilo Figma) para precisão milimétrica na edição.
- **Estrutura de Persistência**: Criação da infraestrutura de pastas para templates organizados por categoria (Instagram, Assinaturas, etc).

## [0.3.1] - 2026-05-04

### Adicionado
- **Sincronização em Tempo Real (API)**: Os preços e produtos agora são obtidos e sincronizados diretamente da API pública da Allugator toda vez que a aba de Produtos for exibida, garantindo que os dados estejam sempre 100% atualizados.

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

