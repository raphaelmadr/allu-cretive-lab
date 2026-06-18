# DEV.md — Allu Creative Lab
> Documento de contexto e instruções de desenvolvimento. Atualizar a cada sessão.

---

## 1. VISÃO DO PRODUTO

Ferramenta interna de geração de criativos de performance em escala. O usuário cola a demanda do Notion no **Smart Paste**, clica em **Montar 4 Formatos** e recebe 4 anúncios prontos (Feed, Stories, Google H, Google V) — fiéis à identidade visual da allu., editáveis na plataforma.

**Princípio central:** todos os elementos gerados devem ser **totalmente editáveis** pelo usuário dentro da própria plataforma (mover, redimensionar, trocar texto, trocar cor, trocar produto). Nada pode ser "locked" ou apenas visual.

---

## 2. STACK

- **Frontend:** Vanilla HTML + CSS + JavaScript (sem framework)
- **Engine de canvas:** Fabric.js
- **Backend:** Vercel Serverless Functions (Node.js)
- **IA:** Google Gemini (cascade de modelos) com fallback OpenAI GPT-4o
- **Deploy:** Vercel — qualquer push no main vai para produção em `https://allu-creative-lab.vercel.app/`
- **Versionamento:** GitHub — commits no main deployam automaticamente

---

## 3. ARQUITETURA DO FLUXO PRINCIPAL

```
[Smart Paste] → /api/parse-copy (IA: extrai hook/body/cta/productName)
                        ↓
              buildBrandLayout(creative, formatConfig)
              [DETERMINÍSTICO — sem IA]
                        ↓
              renderAILayout(canvas, layout, formatConfig, creative)
              [Fabric.js: fundo + logo + textos + produto + selos]
                        ↓
              4 canvases editáveis (Feed / Stories / Google H / Google V)
```

**Decisão arquitetural:** A geração de layout NÃO usa IA. Usa o motor determinístico `buildBrandLayout()` baseado no Repertório Visual da allu. A IA só interpreta copy bruta → estrutura (hook/body/cta).

---

## 4. REPERTÓRIO VISUAL DA ALLU (REGRAS DO MOTOR)

### Logomarca
- Sempre `allu.` lowercase com ponto final
- Posição: topo centralizado, ~6% da altura do canvas
- Cor: preto em fundos claros (`Primario-2.svg`), branco em fundos escuros (`Primario.svg`)
- Detecção de tema: usar luminância da cor1 do background (não comparação exata de hex)

### Paleta
| Uso | Valor |
|---|---|
| Background padrão | `#F5F5F7` |
| Background dark (iPhone moderno) | Gradiente `#1D1D1F` → `#2C2C2C` |
| Texto claro | `#1D1D1F` |
| Texto escuro | `#FFFFFF` |
| Texto body/apoio | `#828392` |
| Destaque (highlight) | `#27AE60` |
| Selos identidade | `#1D1D1F` bg / `#FFFFFF` text |

### Tipografia
- Família única: `Plus Jakarta Sans`
- Hook: `fontWeight: 800`, `fontSizeRatio` calibrado por tamanho do texto e formato
- Body: `fontWeight: 400`, `fontSizeRatio` fixo por formato
- CTA: `fontWeight: 800`, pill automático com seta →

### Tamanhos de fonte por formato (pixel target)
| Formato | Hook alvo | Body alvo |
|---|---|---|
| Feed 1080x1080 | ~50px | ~22px |
| Stories 1080x1920 | ~68px | ~26px |
| Google H 1200x628 | ~54px | ~28px |
| Google V 1200x1500 | ~50px | ~22px |

`fontSizeRatio = targetPx / H`

### Escala de fonte por comprimento do hook
| Chars (sem \*\*) | Multiplicador |
|---|---|
| ≤ 35 | 1.20 |
| ≤ 55 | 1.05 |
| ≤ 80 | 1.00 |
| ≤ 110 | 0.85 |
| > 110 | 0.70 |

### Escala do produto por tipo
| Tipo de produto | scalePercent |
|---|---|
| Smartwatch / wearable | 0.62 |
| Fone / caixa de som | 0.60 |
| Smartphone (default) | 0.72 |
| Tablet | 0.76 |
| Drone | 0.65 |
| Notebook / laptop | 0.82 |
| TV / monitor | 0.80 |

### Posicionamento por formato
**Feed & Google V (canvas padrão):**
- Hook: `{x:0.5, y:0.14}`, center
- Body: `{x:0.5, y:0.30}`, center
- CTA: `{x:0.5, y:0.42}`, center
- Produto: `{x:0.5, y:0.95}`, origin top
- Badge: `{x:0.77, y:0.65}`

**Stories:**
- Hook: `{x:0.5, y:0.10}`
- Body: `{x:0.5, y:0.26}`
- CTA: `{x:0.5, y:0.36}`
- Produto: `{x:0.5, y:0.95}`, scale * 0.92
- Badge: `{x:0.77, y:0.62}`

**Google H (layout split — texto esquerda, produto direita):**
- Hook: `{x:0.22, y:0.18}`, left-aligned
- Body: `{x:0.22, y:0.58}`, left-aligned
- CTA: `{x:0.22, y:0.75}`, left-aligned
- Produto: `{x:0.72, y:0.50}`, center-center (não usa flowY)
- Badge: `{x:0.87, y:0.62}`
- Texto width: 38% de W (não 80%)

### Selos
- **Circular "novidade na allu.":** circular, preto, branco — posição `{x:0.77, y:0.65}`
- **Cupom SOCIAL5:** pill retangular preto — posição canto inf. direito do canvas
- `b.position.y` DEVE ser respeitado pelo renderer (fix aplicado)

### Detecção de background dark
- iPhone 15, 16, 17, ... → gradiente escuro
- Usar regex: `/iphone\s*(1[5-9]|[2-9]\d)/`
- Para todos os outros produtos: `#F5F5F7` sólido

---

## 5. FUNÇÕES DO MOTOR (em `js/tools/demandas.js`)

### `isColorDark(hex)` — determina se cor é escura por luminância
```js
function isColorDark(hex) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return false;
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}
```

### `fuzzyMatchProduct(productName, products)` — match fuzzy por palavras
```js
function fuzzyMatchProduct(productName, products) {
    if (!productName || !products?.length) return null;
    const query = productName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const words = query.split(/\s+/).filter(w => w.length > 2);
    let best = null, bestScore = 0;
    for (const p of products) {
        const name = (p.name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        const score = words.reduce((acc, w) => acc + (name.includes(w) ? 1 : 0), 0);
        if (score > bestScore) { bestScore = score; best = p; }
    }
    return bestScore >= 1 ? best : null;
}
```

### `buildBrandLayout(creative, formatConfig)` — motor principal
Gera o JSON de layout baseado nas regras do Repertório Visual.
Sem chamada de IA — 100% determinístico.

---

## 6. BUGS IDENTIFICADOS E FIXES NECESSÁRIOS

### Bug 1: Logo detecta dark theme por hex exato (FIXED)
**Arquivo:** `js/tools/demandas.js` → `renderAILayout()`
**Fix:** Usar `isColorDark()` baseado em luminância

### Bug 2: Match de produto muito rígido (FIXED)
**Arquivo:** `js/tools/demandas.js` → `renderAILayout()`
**Fix:** Usar `fuzzyMatchProduct()` com tokenização

### Bug 3: Badge ignora `b.position.y` (FIXED)
**Arquivo:** `js/tools/demandas.js` → `renderAILayout()`, seção badges
**Fix:** Usar `b.position.y ? H * b.position.y : productTopY + 50`

### Bug 4: Formato horizontal (Google H) não tem layout split (FIXED)
**Arquivo:** `js/tools/demandas.js` → `renderAILayout()`
**Fix:** Detectar `W > H`, posicionar produto em `{x:0.72, center-center}` e limitar text width a 38% de W

### Bug 5: Motor de layout dependia de IA (FIXED)
**Arquivo:** `js/tools/demandas.js` → `generateFourFormats()`
**Fix:** Remover KB lookup + API call, usar `buildBrandLayout()` por formato

---

## 7. EDITABILIDADE — REQUISITO CRÍTICO

**Todos os elementos gerados devem ser editáveis no canvas:**

| Elemento | Como garantir editabilidade |
|---|---|
| Textos (hook/body/cta) | Usar `fabric.Textbox` (já implementado) — permite edição duplo-clique |
| Produto (imagem) | `fabric.Image` com `selectable: true` (verificar se está ativo) |
| Logo | `fabric.Image` com `selectable: true` |
| Badges/Selos | `fabric.Group` com `selectable: true` |
| Background | Propriedade do canvas — editável via painel de Background da sidebar |

**Features necessárias para garantir editabilidade completa:**
1. Sidebar deve mostrar propriedades do objeto selecionado (texto, imagem, grupo)
2. Trocar imagem de produto via clique no objeto selecionado
3. Trocar badge/selo (editar texto dentro do grupo)
4. Trocar background via painel existente

**Regra:** `selectable: true` e `evented: true` em TODOS os objetos gerados pelo `renderAILayout`.

---

## 8. FORMATO DO SMART PASTE (Notion)

```
## IMG_allu-ads_[produto]_[angulo]_[formato]_perene_h1_v01_#001

Nome do arquivo final = IMG_allu-ads_[produto]_[angulo]_[formato]_perene_h1_v01_#001.png

### Copy aprovada

[Hook linha 1]
[Hook linha 2]
[Nome do produto + preço]
[CTA]
```

O `/api/parse-copy` extrai `hook`, `body`, `cta`, `productName` desse bloco via IA.

---

## 9. ARQUIVOS PRINCIPAIS

| Arquivo | Responsabilidade |
|---|---|
| `js/tools/demandas.js` | Motor de layout + renderização (ARQUIVO CENTRAL) |
| `js/tools/products.js` | Catálogo de produtos + sync API |
| `js/tools/badges.js` | Editor de selos na sidebar |
| `js/tools/text.js` | Editor de tipografia na sidebar |
| `js/tools/background.js` | Editor de background na sidebar |
| `js/tools/properties.js` | Painel de propriedades do objeto selecionado |
| `js/ui/sidebar.js` | Sidebar principal + tab switching |
| `js/ui/floatingToolbar.js` | Toolbar contextual ao selecionar objeto |
| `js/export.js` | Download multi-formato |
| `api/parse-copy.js` | Parse de copy via IA |
| `api/ai-orchestrator.js` | Cascata Gemini → OpenAI |
| `IA_PROMPTS.js` | Todos os prompts de IA |
| `assets/products.json` | Catálogo local (159 produtos) |
| `assets/design_system.json` | Knowledge base (11 entradas — baixo impacto) |
| `assets/logos/Primario.svg` | Logo branco (fundo escuro) |
| `assets/logos/Primario-2.svg` | Logo preto (fundo claro) |

---

## 10. PRÓXIMAS IMPLEMENTAÇÕES PENDENTES

### P0 — Motor determinístico de layout
- [x] Funções helper: `isColorDark`, `fuzzyMatchProduct`, `detectProductScale`, `buildBrandLayout`
- [x] Remover dependência de IA para geração de layout
- [x] Fix logo detection por luminância
- [x] Fix product matching fuzzy
- [x] Fix badge position usando `b.position.y`
- [x] Layout split para Google H

### P1 — Editabilidade completa
- [ ] Verificar `selectable: true` em todos os objetos do `renderAILayout`
- [ ] Floating toolbar mostra opções corretas ao selecionar texto gerado
- [ ] Floating toolbar mostra "Trocar Produto" ao selecionar imagem de produto
- [ ] Double-click em badge → edita texto do grupo

### P2 — Qualidade dos criativos
- [ ] Melhorar `parse-copy.js`: prompt com os 6 arquétipos da allu para formatação melhor do hook
- [ ] Suporte a múltiplas linhas no hook com formatação markdown `**negrito**`
- [ ] Adicionar variação de rotação do produto (-8° a +8°) configurável

### P3 — UX do Smart Paste
- [ ] Preview inline antes de "Montar 4 Formatos"
- [ ] Validação de campos obrigatórios (hook não pode ser vazio)
- [ ] Indicador de qual produto foi detectado + imagem thumbnail

---

## 11. VARIÁVEIS DE AMBIENTE (Vercel)

| Variável | Uso |
|---|---|
| `GEMINI_API_KEY` | Chave primária Google Gemini |
| `GEMINI_API_KEY_2` | Chave secundária (pool) |
| `GEMINI_API_KEY_3` | Chave terciária (pool) |
| `OPENAI_API_KEY` | Fallback final (GPT-4o) |

---

## 12. CONVENÇÃO DE NOMENCLATURA DOS ARQUIVOS

`[TIPO]_allu-ads_[produto]_[angulo-copy]_[formato-template]_[periodicidade]_[versao]_[#numero]`

Exemplos:
- `IMG_allu-ads_iphone17_compra-vs-assinar_banner-offer_perene_h1_v01_#001`
- `CRS_allu-ads_samsung_aparelho-antigo_carrossel-apelativo_perene_h1_v01_#001`

Prefixos: `IMG` = imagem estática, `CRS` = carrossel, `VID` = vídeo
