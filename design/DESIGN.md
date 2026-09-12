---
version: alpha
name: IntegraSis
description: "Luxo sistemico — a disciplina de motion da Apple com a alma calma/editorial da constelacao familiar. Sálvia + terracota + creme, muito respiro, storytelling imersivo."
colors:
  primary: "#2E3B2E"
  marrom: "#2E3B2E"
  salvia: "#7A8B6F"
  salvia-deep: "#5C6B52"
  terracota: "#C67B5C"
  terracota-deep: "#A85F43"
  creme: "#F5F0E8"
  creme-deep: "#E9E2D5"
  ink: "#3A3A38"
  ink-muted: "#6B6B66"
  surface: "#FFFFFF"
  white: "#FFFFFF"
  focus: "oklch(0.55 0.08 240)"
typography:
  display-xl:
    fontFamily: "Cormorant Garamond"
    fontSize: 3.5rem
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  display-md:
    fontFamily: "Cormorant Garamond"
    fontSize: 2.5rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  eyebrow:
    fontFamily: "Inter"
    fontSize: 0.8rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
  body-lg:
    fontFamily: "Lora"
    fontSize: 1.25rem
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Lora"
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.7
  button:
    fontFamily: "Inter"
    fontSize: 0.95rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.02em"
  caption:
    fontFamily: "Inter"
    fontSize: 0.85rem
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.01em"
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  section: 96px
components:
  button-primary:
    backgroundColor: "{colors.marrom}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: 14px 28px
    typography: "{typography.button}"
  button-primary-hover:
    backgroundColor: "{colors.salvia-deep}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.marrom}"
    rounded: "{rounded.pill}"
    padding: 14px 28px
  button-secondary-hover:
    backgroundColor: "{colors.creme-deep}"
    textColor: "{colors.marrom}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 32px
  card-hover:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  nav-link:
    textColor: "{colors.marrom}"
    typography: "{typography.button}"
  link-inline:
    textColor: "{colors.terracota-deep}"
    typography: "{typography.body}"
---

# Identidade Visual & Playbook de Design — IntegraSis

> "Luxo sistémico." Disciplina de motion da Apple (scroll-trigger com propósito,
> nunca scroll-jacking) + linguagem calm/editorial que o público de constelação
> familiar espera: espaço, sálvia/creme/terracota, tipografia serifada emocional,
> ritmo lento e proposital.

## Visão Geral

IntegraSis é uma marca de constelação familiar e autoconhecimento sistémico,
fundada na cosmovisão sistémica e na ancestralidade Yorubá. A experiência de
website deve transmitir **calma, enraizamento e acolhimento** — nunca urgência
agressiva. O visitante (persona "Mariana", 35–50, wellness/espiritualidade)
mergulha numa narrativa que se desvela conforme rola, em vez de ser atropelado
por recursos. Cada seção é uma camada da jornada sistémica que se revela.

### Regra de ouro (aplica a TODA pasta futura)

**Toda página criada em qualquer subpasta do site (blog, organizacional, retiros,
eventos, ebook) herda automaticamente estes tokens e este playbook.** Nenhuma
nova seção, cor, fonte, espaçamento, raio ou movimento pode ser inventado fora
daqui. Se uma nova vertente precisar de algo que não existe aqui, primeiro
adiciona-se aqui (e revisa-se o impacto no resto), nunca se cria token avulso
na página.

## Cores

| Token | Valor | Papel |
|-------|-------|-------|
| Marrom (primary) | `#2E3B2E` | Título, texto forte, CTA primário, fundo premium |
| Sálvia | `#7A8B6F` | Equilíbrio, cura, natureza (acentos de fundo) |
| Sálvia deep | `#5C6B52` | Hover de CTA, sálvia em superfícies claras |
| Terracota | `#C67B5C` | **Acento quente único** (substitui o dourado — ver Ewó) |
| Terracota deep | `#A85F43` | Link inline, terracota legível sobre claro |
| Creme | `#F5F0E8` | Base, respiro, elegância |
| Creme deep | `#E9E2D5` | Superfície de hover, cards suaves |
| Tinta (ink) | `#3A3A38` | Texto de corpo |
| Tinta mutada | `#6B6B66` | Texto secundário/captions |
| Superfície | `#FFFFFF` | Cards, superfícies elevadas |
| Focus | oklch(0.55 0.08 240) | Anel de foco teclado (acessibilidade) |

**Regra 60-30-10:** ~60% creme/superfície + 30% marrom/sálvia + 10% terracota
(acento). Terracota é o ÚNICO acento cromático — reservado para interações e
momentos de destaque.

**EWÓ (proibição sagrada, não negociável):** é terminantemente **proibida a cor
dourada, ouro ou amarela** em qualquer peça visual. O terracota é o acento que
ocupa esse lugar de "calor", em respeito à ancestralidade. Nunca gerar, aplicar
ou validar qualquer imagem com pixels dourados/amarelos.

## Tipografia

- **Display (títulos e marca):** *Cormorant Garamond* — serifada emocional,
  elegante, transmite profundidade e ancestralidade. Usada em títulos de impacto.
- **Corpo (parágrafos/leitura longa):** *Lora* — serif humanista otimizada para
  tela, literária e acolhedora. Reduz fadiga em leitura sustentada e unifica a voz
  "livro" com o PDF/e-mail da marca. Definida por consenso de 10 especialistas.
- **UI (botões, navegação, labels, captions):** *Inter* — sans limpa para
  legibilidade de interface e clareza de ação.
- **Eyebrow (labels de seção):** Inter 600, 0.8rem, uppercase, tracking largo —
  sinaliza o "capítulo" de cada seção narrativa.

Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Lora:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

Hierarquia de escala (display grande → captions), com line-heights apertados em
títulos (1.05–1.1) e confortáveis em corpo (1.65–1.7 em Lora). O contraste
serif-elegante (títulos) + serif-literário (corpo) + sans (UI) é o que "veste" a
marca como um livro integral.

## Layout & Espaço

- Largura máxima de conteúdo: **~1140px** (container central).
- **Respiro abundante** — sessões com `spacing.section` (96px) de espaçamento
  vertical. Espaço em branco não é vazio: é o silêncio entre os "movimentos".
- Base de espaçamento: 4px; escala xs→xxl (4, 8, 16, 24, 40, 64) + section (96).
- Sessões alternam superfícies para criar ritmo (creme ↔ branco ↔ marrom),
  mas o padrão de "luxo quieto" pede **mais claro do que escuro**, com o marrom
  reservado para momentos de imersão pontuais.

## Movimento (Motion Posture — o coração da experiência)

Princípio: **"Bom motion é invisível — sente-se, não vê-se."** O movimento tem
um propósito narrativo (revelar, direcionar, reforçar); o que não serve à
história fica parado.

1. **Scroll-trigger, NUNCA scroll-jacking.** Elementos entram ao alcançar o
   viewport (IntersectionObserver / CSS view-timeline). O usuário controla o
   ritmo; nunca travar a roda nem controlar a rolagem.
2. **Divulgação progressiva como metáfora sistémica.** Cada seção revela uma
   camada da jornada (como uma constelação se desvela). Isso usa progressão +
   antecipação de recompensa + memória espacial para prender a leitura.
3. **Ritmo lento e contínuo.** Fades suaves (~600–900ms), deslocamento sutil
   (`transform`/`opacity`, GPU-friendly), easing suave (`cubic-bezier(0.22, 1, 0.36, 1)`).
4. **Uma revelação por vez** (ou coréia com hierarquia clara) — nunca múltiplos
   elementos competindo (respeita carga cognitiva).
5. **Acessibilidade:** sempre `prefers-reduced-motion: reduce` — serve o site
   estático e legível (sem sequência). Parallax limitado a 20% do viewport.
6. **Performance:** usar CSS transforms/opacity + IntersectionObserver; evitar
   scroll listeners por pixel; testar em celular médio (INP < 200ms).

## Formas & Elevação

- Raios: sm 6px / md 10px / lg 16px / pill 999px. Botões primários e secundários
  são **pill** (raio total) — o gesto de "luxo quieto". Cards são lg (16px).
- **Sombras raras e suaves.** A elevação vem do contraste de superfície, não de
  caixas de sombra. Usar uma sombra difusa `0 8px 30px rgba(46,59,46,0.08)` no
  máximo, para cards elevados.
- **Bordas** usadas com discrição (ex: botão secundário outline); não bordar
  cards por padrão.

## Componentes

### Botão primário (`button-primary`)
Fundo marrom `#2E3B2E`, texto branco, pill, padding 14px 28px, Inter 500 0.95rem.
Hover: sálvia deep. É a ação de maior destaque de uma sessão (no máximo 1 por
sessão). **Quieto, não grita.**

### Botão secundário (`button-secondary`)
Transparente, outline 1.5px marrom, texto marrom, pill. Hover: creme deep.
Usado para ações complementares ("Conhecer o livro" + "Ler os conteúdos" lado
a lado — primário + secundário).

### Card (`card`)
Superfície branca, raio 16px, padding 32px, espaço generoso. Hover: creme.
Títulos do card em Cormorant, corpo em Lora. **Sem borda** (limpo), sombra
sutil só em elevação real.

### Navegação (`nav-link`)
Texto marrom, Inter 500. Hover: suave, sublinhado sutil ou terracota. Header
flutuante translúcido com `backdrop-filter` sutil (eco do "glass" premium), não
opaco.

### Link inline (`link-inline`)
Terracota deep `#A85F43` com sublinhado sutil no hover. Único link colorido da
marca → sempre terracota.

## Do's

- Use Cormorant Garamond para títulos, Lora para o corpo e Inter para UI.
- Respeite o Ewó: nunca uma cor dourada/ouro/amarela em nenhum pixel.
- Motion com propósito e lento; scroll-trigger (não scroll-jacking).
- Respeite `prefers-reduced-motion`; paralaxe ≤20% do viewport.
- Use muito espaço em branco (respiro = silêncio entre movimentos).
- Terracota como ÚNICO acento cromático (interações/destaques).
- Herde estes tokens em toda subpasta futura.

## Don'ts

- **NÃO** usar dourado, ouro ou amarelo (viola o Ewó e a identidade).
- **NÃO** scroll-jacking / travar a rolagem / animar a posição de scroll.
- **NÃO** múltiplos elementos animando ao mesmo tempo (ruído cognitivo).
- **NÃO** sombras pesadas, gradients agressivos, glassmorphism desnecessário.
- **NÃO** CTA gritando "COMPRE AGORA!" — tom calmo, acolhedor, discreto.
- **NÃO** inventar cores/fontes/espacos fora deste playbook em nenhuma pasta.
- **NÃO** deixar motion em dispositivos com `prefers-reduced-motion` ativo.
