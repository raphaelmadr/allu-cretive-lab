# Changelog - Allu Creative Lab

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [0.10.0] - 2026-07-28
### Adicionado
- **Modo IA (`js/tools/aiMode.js`)**: nova aba na barra lateral com um chat que gera imagens fotográficas/ilustrativas alinhadas à marca allu. via IA, com histórico de mensagens e suporte a refinamento ("mais clean", "menos elementos" etc.) — a saída final entra no canvas como uma imagem 100% editável (selecionável, redimensionável, com Crop), igual a qualquer outro objeto do editor.
- **Base de Conhecimento de Marca (`BRAND_KNOWLEDGE.js`)**: documento único com seções identificadas por ID (`DS-CORES-01`, `DS-MOOD-01`, `DS-FOTO-01` etc.) injetado no prompt do orquestrador — a IA é obrigada a citar quais seções consultou (`meta.consulted_docs`) antes de propor uma imagem.
- **Prompt Mestre do allu Image AI (`IA_PROMPTS.js` → `IMAGE_AI_MASTER_PROMPT`)**: fluxo obrigatório de 6 etapas (entender → consultar base → sintetizar → construir JSON estruturado → validar → entregar), com missão explícita de produzir criativos elegantes, versáteis e otimizados para clique/conversão — não apenas peças "corretas" na marca.
- **Endpoint orquestrador (`api/generate-prompt.js`)**: monta o prompt mestre + base de conhecimento + histórico da conversa, valida o schema da resposta (incluindo IDs de `consulted_docs` contra a base real) e reenvia automaticamente uma vez com instrução de correção caso a IA retorne algo incompleto.
- **Endpoint de geração de imagem (`api/generate-image.js`)**: integração com Gemini (`gemini-2.5-flash-image`, "Nano Banana") reaproveitando as chaves `GEMINI_API_KEY`/`_2`/`_3` já configuradas (mesmo key-pooling do texto) — DALL-E 3 vira fallback opcional, só usado se `OPENAI_API_KEY` estiver configurada. Proporção da imagem calculada a partir das dimensões reais do canvas ativo (não de um enum livre da IA).

## [0.9.0] - 2026-07-28
### Adicionado
- **Motor de Animações de Entrada (`js/animationEngine.js`)**: novo sistema que anima qualquer objeto do canvas (imagem, texto, selo, forma ou grupo) do estado inicial até a posição/escala/ângulo já definidos pelo usuário, que passam a ser o estado final da animação. 10 presets disponíveis: Fade In, Deslizar (Esquerda/Direita/Cima/Baixo), Zoom In/Out, Pop, Girar e Nenhuma.
- **Controles de Animação (`js/tools/animations.js`)**: grade de seleção de preset com sliders de Duração (200–3000ms) e Atraso (0–3000ms), compartilhada entre o painel de Propriedades e a barra de ferramentas flutuante (novo botão "Animar").
- **Botão "Prévia"**: reproduz a linha do tempo de animações do canva ativo em tempo real diretamente na barra superior, com aviso caso nenhum objeto tenha animação definida.
- **Exportação Animada em GIF e MP4 (`js/exportAnimated.js`)**: novas opções no dropdown de Exportar que renderizam a timeline quadro a quadro (frames determinísticos) e codificam o resultado como GIF ou MP4.
- **Persistência de Animações**: a propriedade `animationData` de cada objeto agora é incluída na serialização de projetos (.allu), no histórico de undo/redo, na duplicação de objetos e nos Modelos salvos, garantindo que as animações configuradas sobrevivam a save/load, duplicar e desfazer/refazer.

## [0.8.0] - 2026-07-28
### Corrigido
- **Ferramenta de Crop (Recorte de Imagem)**: reescrita da matemática de recorte para usar a matriz de transformação completa do Fabric.js (`calcTransformMatrix`/`invertTransform`/`transformPoint`) em vez de subtração direta de `left/top`. Isso corrige o recorte de imagens rotacionadas e com escala não-uniforme, que antes gerava um `clipPath` deslocado/distorcido.
- **Corrupção do modo de recorte pela troca automática de aba (`js/carousel.js`)**: o listener `onSelection` (ligado a `mouse:down`/`selection:created/updated`) forçava a aba "Propriedades" de volta ao estado genérico assim que o retângulo de recorte era clicado, destruindo o painel "Modo de Recorte Ativo". Corrigido com a mesma trava `state.cropModeActive` usada nos atalhos globais.
- **Barra de ferramentas flutuante sobre o retângulo de recorte**: o retângulo interativo (`crop-rect`) era tratado como uma forma comum pela barra flutuante, expondo botões de Preenchimento/Borda/Duplicar/Excluir que corrompiam o modo de recorte se clicados. A barra agora ignora esse objeto.
### Adicionado
- **Recorte não-destrutivo com estado preservado**: reabrir o recorte em uma imagem já cortada agora posiciona o quadro exatamente sobre a região mantida (em vez de resetar para a imagem inteira), e preserva o arredondamento de cantos (Cantos) aplicado anteriormente.
- **Botão "Remover Recorte"**: novo botão no painel de Propriedades para imagens já cortadas, que remove o recorte (mantendo o arredondamento, se houver) sem precisar desfazer todo o histórico.
- **Clamp aos limites da imagem**: o quadro de recorte não pode mais ser arrastado/redimensionado para fora da imagem original.
- **Atalhos de teclado no modo de recorte**: `Enter` confirma, `Esc` cancela.
- **Undo em passo único**: toda a operação de recorte (abrir, ajustar, confirmar/cancelar) agora gera exatamente uma entrada no histórico de undo/redo, em vez de várias entradas intermediárias.
- **Bloqueio de interações concorrentes**: durante o modo de recorte, os demais objetos do canvas ficam travados e os atalhos globais (Delete, Ctrl+Z/Y, Ctrl+C/V) ficam inertes, evitando estados corrompidos.

## [0.7.0] - 2026-05-26
### Adicionado
- **Duplicação de Canva (Página)**: Novo botão compacto de duplicar página no rodapé da plataforma, clonando instantaneamente o canva atual com todos os seus elementos e metadados.
- **Substituição Dinâmica de Produtos**: Dropdown "Substituir Produto" na barra lateral de propriedades, permitindo trocar o produto selecionado mantendo a posição, escala e ângulo originais.
- **Centralização Automática e Destaque de Canva**: Ajuste dinâmico de padding no wrapper para centralizar perfeitamente a página em edição e aplicação de opacidade de `0.2` nas páginas inativas para foco visual.
- **Comportamento de Zoom Inteligente**: Zoom via scroll (Cmd/Ctrl) que acompanha precisamente a posição do mouse (mouse track), e zoom via botões da barra superior/atalhos que centraliza no documento ativo.
- **Barra de Ferramentas Flutuante (Estilo Canva)**: Barra horizontal de contexto sobre o objeto ativo para atalhos de formatação rápidos.
- **Importação de Arquivos .allu**: Drag & drop ou seleção manual de arquivos de projeto na tela inicial de onboarding.

## [0.6.0] - 2026-05-05
### Adicionado
- **Sincronização de Propriedades em Tempo Real**: Novo sistema de vinculação bidirecional entre a sidebar de propriedades e o canvas, permitindo feedback instantâneo ao alterar cores, fontes, tamanhos e outros atributos.
- **Workflow de Ícones Dinâmicos**: Refinamento completo da edição de ícones Lucide, com controles granulares de espessura de traço (`stroke-width`), cores e tamanhos aplicados diretamente no estágio.
- **Integração de Ativos (Assets Sidebar)**: Nova organização centralizada na sidebar para facilitar o fluxo de trabalho com imagens, logos da marca e ícones.

### Melhorado
- **Integridade de Projetos (.allu)**: Otimização do motor de serialização para garantir que projetos salvos e restaurados mantenham 100% de fidelidade estrutural, dimensional e estética.
- **UX de Propriedades**: Agrupamento lógico de controles na sidebar (Tipografia, Aparência, Layout) para uma edição mais intuitiva.

## [0.5.0] - 2026-05-05
### Adicionado
- **Notificações Branded**: Substituição de alertas nativos do navegador por popups modernos e personalizados integrados à identidade visual da Allu.
- **Workflow Multi-Páginas (Exportação)**: Estabilização do processo de exportação em lote para carrosséis e apresentações.
- **Resiliência de Imagens**: Sistema de fallback automático para imagens de produtos (404/403), garantindo que a exportação nunca falhe por ativos ausentes.

### Corrigido
- **Estabilidade no Vercel**: Correção de erros de CORS e protocolos de segurança que impediam o carregamento de ativos externos em ambientes de produção.
- **Runtime de Exportação**: Resolução de erros de execução durante a geração sequencial de múltiplas páginas.
- **Alinhamento de Marca**: Ajuste fino das proporções e alinhamento do logo Allu na sidebar para conformidade total com o KV.

### Melhorado
- **CORS Policy**: Implementação de políticas de acesso cross-origin robustas para ativos de terceiros.
- **UX de Exportação**: Feedback visual aprimorado durante o processamento de grandes volumes de páginas.

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

