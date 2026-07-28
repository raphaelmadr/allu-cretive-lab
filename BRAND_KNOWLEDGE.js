// BRAND_KNOWLEDGE.js
// Base de conhecimento de marca v1 do "Modo IA" — documento único injetado
// integralmente no prompt do orquestrador (js/tools/aiMode.js -> api/generate-prompt.js).
// Cada seção tem um ID estável (DS-XXX-NN) que a IA deve citar em meta.consulted_docs.
// api/generate-prompt.js extrai a lista de IDs válidos direto daqui via regex — ao
// adicionar/renomear uma seção, a validação de consulted_docs acompanha automaticamente.
// Curado a partir de RULES.md, DEV.md (Repertório Visual) e da memória de sessão
// "Repertório Visual allu." (engenharia reversa de 322 criativos reais).

export const BRAND_KNOWLEDGE_DOC = `
## DS-MISSAO-01 — Missão deste módulo
Este módulo não existe para gerar "imagens corretas dentro da marca" — existe para
gerar CRIATIVOS DE PERFORMANCE: peças elegantes, versáteis, que maximizem a chance
do anúncio ser clicado e converter. Fidelidade à marca é o piso, não o teto. Dentro
dela, busque sempre a composição mais impactante para o objetivo do anúncio.

## DS-CORES-01 — Cores e paleta
O uso de cor é EXTREMAMENTE ABERTO. Não existe uma paleta fechada de hex obrigatórios
para a cena fotográfica. O único critério é: (1) coerência interna da composição —
paleta, luz e estilo não podem se contradizer; (2) os elementos escolhidos fazem
sentido com o tom de voz da marca e os materiais de referência abaixo. Cor em si
NUNCA é motivo de reprovação — só incoerência, contraste ruim ou falta de legibilidade
(quando aplicável) são.
Referências opcionais (não restritivas, só inspiração de ponto de partida):
- Paleta do editor allu. (usada em textos/formas do Creative Lab): fundo padrão
  #F5F5F7, fundo dark premium em gradiente #1D1D1F → #2C2C2C, destaque #27AE60.
- Paleta observada em criativos reais publicados: fundo branco #FFFFFF / creme
  #F5F0E8, destaque em verde-neon vibrante usado com moderação (1 elemento, nunca
  em bloco), selos em preto #000000.

## DS-MOOD-01 — Mood / essência da marca
A allu. comunica como um amigo esperto que dá uma sacada que ninguém mais deu. Tom
simultaneamente provocador e cúmplice. Nunca grita promoção — questiona o
comportamento atual do usuário e posiciona a assinatura como decisão óbvia.
Sentimento dominante da cena: "você merece isso, e é mais barato do que você pensa."
A allu. é uma marca de assinatura de eletrônicos: tom acessível, direto,
aspiracional sem ser elitista — "ter o produto novo sem pagar caro à vista". Cenas
devem comunicar praticidade e presença do produto no dia a dia real do usuário, não
em pedestais/vitrines de estúdio genéricas.

## DS-TIPO-01 — Tipografia (não se aplica dentro da imagem gerada)
A fonte oficial da marca é Plus Jakarta Sans, mas a saída deste módulo é uma foto/
ilustração, não um layout de texto. Texto embutido em imagem gerada por IA
tipicamente sai ilegível ou deturpado. Por isso: NUNCA incluir texto, tipografia,
números de preço ou CTAs dentro da cena — o generation_prompt deve sempre instruir
explicitamente "no text, no typography overlaid on the scene". Textos, preços e CTAs
reais são adicionados depois, como elementos Fabric.js editáveis no canvas.

## DS-LOGO-01 — Uso de logo
Nunca gerar o logotipo "allu." (ou de qualquer marca) dentro da imagem de IA — geradores
de imagem não reproduzem logotipos com fidelidade suficiente. O logo é sempre aplicado
depois, como elemento Fabric.js separado e editável, pela ferramenta "Logos" já
existente no editor. brand_constraints.logo_usage deve sempre refletir isso, salvo
instrução explícita em contrário do usuário.

## DS-FOTO-01 — Direção de fotografia e tratamento de produto
- Tom geral: premium, editorial, limpo — não genérico de banco de imagens (stock).
- Evitar clichês: mãos segurando celular isoladas em fundo branco puro, sorrisos
  forçados de banco de imagem, iluminação de estúdio "flat" sem atmosfera.
- Preferir luz natural ou cenográfica com direção clara, composição com profundidade
  de campo, ambientes reais (casa, rua, escritório, uso cotidiano) condizentes com o
  produto — não pedestais/vitrines isoladas.
- Quando o produto aparecer: forma e proporções fiéis ao item real, leve perspectiva
  (nunca totalmente flat/frontal), sem inventar marcas/logos de terceiros na tela do
  device.
- Quando houver presença humana: persona recorrente de marca é um influencer jovem,
  expressivo, em reação emocional genuína — só incluir pessoa se o pedido do usuário
  pedir ou sugerir isso explicitamente.

## DS-DONT-01 — Do's and Don'ts
- NÃO incluir texto, preços, badges, selos ou CTAs dentro da imagem gerada (isso é
  adicionado depois no canvas via Fabric.js).
- NÃO incluir logotipos de nenhuma marca (allu. ou terceiros).
- NÃO gerar pessoas com rostos deturpados, mãos malformadas ou anatomia incorreta —
  preferir enquadramentos que não dependam de anatomia perfeita quando o pedido não
  especificar um modelo humano em destaque.
- SEMPRE priorizar realismo fotográfico, salvo pedido explícito do usuário por
  ilustração, 3D ou outro estilo.

## DS-FORMATO-01 — Canais e proporções
- Instagram/Facebook Feed (1080x1080) → aspect_ratio "1:1"
- Instagram/Facebook Stories, Reels (1080x1920) → aspect_ratio "9:16"
- Google Display Horizontal (1200x628) → aspect_ratio "16:9"
- Google Display Vertical (1200x1500) → aspect_ratio "1:1" (proporção mais próxima)
Nota: o tamanho real enviado ao gerador de imagem é calculado no backend a partir das
dimensões reais do canvas ativo, não deste texto — este mapeamento serve só para o
generation_prompt refletir a orientação/composição correta da cena.
`;
