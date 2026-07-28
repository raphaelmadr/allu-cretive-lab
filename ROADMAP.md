# Roadmap - Allu Creative Lab

Visão geral das próximas etapas de desenvolvimento.

## Fase 1: Fundação e Interface
- [x] Implementar estrutura básica (HTML/CSS) com estética premium.
- [x] Configurar engine do Canvas (Fabric.js).
- [x] Criar sistema de presets de formatos (Instagram, WhatsApp, etc).
- [x] Implementar Onboarding guiado para usuários (Rede > Formato > Canvas).
- [x] Melhorar sistema de Zoom Adaptativo (Fit-to-screen).

## Fase 2: Ferramentas de Edição
- [x] Implementar edição de texto (fontes, cores, tamanhos).
- [x] Implementar upload e redimensionamento de imagens.
- [x] Criar paleta de cores da marca integrada.
- [x] Sistema de alinhamento e guias de segurança.

## Fase 3: Sincronização de Dados
- [x] Desenvolver o botão "Atualizar" para buscar dados de produtos (Scraper).
- [x] Integrar fotos, nomes e preços dos produtos diretamente no editor.
- [x] Criar biblioteca de logos da marca.

## Fase 4: Exportação e Polimento
- [x] Finalizar sistema de download multiformato (PNG/JPG/PDF).
- [x] Otimizações de performance e micro-animações.
- [x] Implementação de sistema de templates básicos.
- [x] Sistema de Notificações Customizadas (Branded Popups).
- [x] Resiliência de ativos e fallback de imagens na exportação.

## Fase 5: Expansão e UX Avançada
- [x] Implementar sistema de "Desfazer/Refazer" (Undo/Redo).
- [x] Adicionar mais modelos de posts e apresentações (Carousel Mode).
- [x] Melhorar gerenciamento de camadas (Visibility & Lock).
- [x] Implementar ferramenta de corte (Crop) para imagens.
- [x] Suporte a salvamento de rascunhos localmente (Auto-save / Models).
- [x] Reestruturação de Onboarding com integração de Templates.
- [x] Implementação de Sistema de Formas Geométricas e Selos (Badges).

## Fase 6: Automação e Ecossistema
- [x] Implementar automação de preços via GitHub Actions (Sincronização Horária).
- [x] Criar dashboard de status de sincronização no editor.
- [x] Sistema de Templates colaborativos (Modelos Salvos).
- [x] Sincronização em tempo real entre Sidebar de Propriedades e Canvas.
- [x] Refinamento do Workflow de Ícones (Lucide) com edição dinâmica.
- [x] Otimização da persistência de projetos (.allu) com integridade total.
- [ ] Persistência em Servidor para Templates (Node.js/API integration).
- [x] Suporte a animações básicas e exportação de GIFs/Vídeos.
- [ ] Modo de apresentação de slides integrado.

## Fase 7: Inteligência e Conectividade (Próximos Passos)
- [x] Modo IA: geração de imagens fotográficas/ilustrativas guiada pela marca (chat + base de conhecimento + DALL-E 3), com saída editável direto no canvas.
- [ ] Integração com APIs de bancos de imagens (Pexels/Unsplash) para assets rápidos.
- [ ] Assistente de IA para geração de títulos e copies curtas para posts.
- [ ] Sistema de exportação direta para redes sociais via API.
- [ ] Ferramenta de corte (Crop) inteligente para imagens de produtos.
- [ ] Histórico de versões de arquivos na nuvem.
- [ ] Modo IA v2: base de conhecimento com busca semântica real (RAG/embeddings) sobre a base editorial completa, hoje coberta apenas por um documento único curado manualmente.
