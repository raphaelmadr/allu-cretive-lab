# Regras do Projeto - Allu Creative Lab

Este documento define as diretrizes fundamentais para o desenvolvimento da plataforma Allu Creative Lab.

## 1. Comunicação e Documentação
- Toda a comunicação, planos de implementação, comentários de código e documentação devem ser em **Português (Brasil)**.
- O plano de implementação deve ser aprovado antes de qualquer mudança significativa.

## 2. Princípios de Design
- **Estética Premium**: O design deve ser moderno, utilizando Glassmorphism, modo escuro e micro-animações.
- **Consistência de Marca**: A ferramenta deve facilitar a manutenção da identidade visual da Allu por não-designers.
- **Experiência do Usuário (UX)**: Funcionamento fluido e intuitivo, semelhante ao Canva.

## 3. Desenvolvimento Técnico
- **Stack**: Vanilla HTML, CSS e JavaScript.
- **Engine de Canvas**: Uso do Fabric.js.
- **Navegação**: Formatos selecionados apenas no Onboarding inicial. Sidebar dedicada à edição, produtos e camadas.
- **Sincronização**: Integração de dados de produtos do site oficial.

## 4. Manutenção e Rastreabilidade
- Consultar estas regras sempre que iniciar uma nova tarefa.
- Todas as atualizações devem ser registradas no `CHANGELOG.md`.
- O progresso futuro deve ser planejado no `ROADMAP.md`.

## 5. Especificações de Design (Allu Design System)

### Cores (Paleta de 36+ cores)
As seguintes cores devem estar disponíveis na paleta da ferramenta:
`#0F190A`, `#161617`, `#1E8549`, `#267AB3`, `#27AE60`, `#2E2F39`, `#304D3C`, `#3498DB`, `#4BD184`, `#565661`, `#5C2D71`, `#6F707E`, `#828392`, `#892E73`, `#8D44AD`, `#9BD3F9`, `#A0EDC0`, `#A8A9B8`, `#A9AC39`, `#C01A21`, `#C59023`, `#C5C5C5`, `#C9621C`, `#D85AB9`, `#DDAFF1`, `#DFDFD4`, `#E4E773`, `#E6E6E6`, `#EFEFEF`, `#F3F5A4`, `#F45258`, `#F4B2E4`, `#F4F4EF`, `#F78639`, `#F7F7F9`, `#FFAAAD`, `#FFC49C`, `#FFC857`, `#FFE3AA`.

### Tipografia
- **Fonte Principal**: `Plus Jakarta Sans` (Google Fonts).
- **Hierarquia de Tamanhos**:
    - `h1`: 76px
    - `h2`: 66px
    - `h3`: 46px
    - `h4`: 36px
    - `h5`: 26px
    - `Parágrafo`: 16px
- **Pesos Disponíveis**: Light (300), Regular (400), Medium (500), Bold (700).
- Deve ser usada em todos os elementos de texto por padrão para manter a consistência.

### Margens de Segurança
- **Geral**: Margem mínima de 5% em todos os formatos.
- **Stories (Instagram/WhatsApp)**: Margem superior e inferior de 250px para evitar obstrução por elementos da interface do aplicativo (perfil, barra de resposta).
- **Feed**: Margem de 10% para garantir legibilidade em diferentes dispositivos.
