# Playbook de Design — IntegraSis

> **"Luxo sistémico."** Disciplina de motion da Apple (scroll-trigger com
> propósito, nunca scroll-jacking) + linguagem calma/editorial do público de
> constelação familiar: espaço, sálvia/creme/terracota, tipografia serifada
> emocional, ritmo lento e proposital.

## Como usar (regra de ouro)

**Toda página criada em QUALQUER subpasta do site** (`/blog/`, `/retiros/`,
`/eventos/`, `/constelacao-organizacional/`, `/ebook/`) **obrigatoriamente:**
1. Importa `/assets/css/design-system.css`
2. Inclui `/assets/js/motion.js` no fim do `<body>`
3. Usa apenas os tokens e componentes definidos aqui (nunca criar token avulso)
4. Aplica a classe `.reveal` (+ `.reveal-delay-N`) para entradas suaves

**Nunca** inventar cor, fonte, espaçamento, raio ou movimento fora deste
playbook. Se uma nova vertente precisar de algo novo, **primeiro** adiciona-se ao
`DESIGN.md` (e revisa-se o impacto no resto), nunca só na página.

## Arquivos

| Arquivo | Papel |
|---------|-------|
| `DESIGN.md` | Os tokens centrais (fonte única) — o contrato normativo |
| `../public/assets/css/design-system.css` | Tokens + componentes em CSS (toda página importa) |
| `../public/assets/js/motion.js` | Scroll-trigger (IntersectionObserver, acessível) |
| `../public/index.html` | Referência de implementação (home no estilo) |

## Verificação

O `DESIGN.md` é validado com o CLI do Google:
```bash
npx -y @google/design.md lint DESIGN.md
```

## Mandamentos (resumo)

1. **Ewó:** jamais dourado/ouro/amarelo em qualquer pixel. Terracota é o único
   acento cromático (interações/destaques).
2. **Motion:** scroll-trigger (nunca scroll-jacking), uma revelação por vez,
   lento (600–900ms), GPU-friendly, `prefers-reduced-motion` respeitado.
3. **Respiro:** muito espaço em branco (compreensão +20%).
4. **Tipografia:** Cormorant Garamond (títulos) + Lora (corpo) + Inter (UI).
5. **CTA quieto:** discreto, nunca "COMPRE AGORA!". 1 botão primário por sessão.
6. **Responsividade:** 3 breakpoints (900 / 620 / 360) — testar no celular.
