# AGENTS.md

Guia de contribuição para o Feridinha.com. Estas regras orientam novas
alterações e não exigem uma refatoração completa do código legado existente.

## Visão geral do repositório

Este é um monorepo com duas aplicações principais:

- `client/`: frontend Next.js com React, TypeScript, `styled-components`, CSS
  Modules, Tailwind utilities e `next-intl`.
- `api/`: backend TypeScript executado com Bun, incluindo controllers,
  services, validações, testes e integrações externas.

Alterações de interface devem ficar em `client/`. Regras de negócio, acesso a
dados, autenticação e integrações devem ficar em `api/`. Não mover lógica entre
as duas aplicações sem necessidade clara de contrato compartilhado.

## Convenções de código

- Use TypeScript estrito e preserve os tipos existentes.
- Prefira imports pelo alias `@/` no client.
- Use componentes funcionais React e mantenha a lógica de apresentação próxima
  do componente que a utiliza.
- Evite `any`, casts desnecessários e supressões de erro.
- Preserve os padrões de internacionalização existentes. Textos visíveis não
  devem ser adicionados diretamente ao JSX quando a tela já usa mensagens
  localizadas.
- Use nomes de componentes, funções e constantes em inglês, seguindo o padrão
  atual do código.
- Não introduza uma nova biblioteca para resolver algo que já é coberto pelas
  dependências atuais.

## Organização de estilos

### Styled-components

`styled-components` é a opção preferencial para estilos específicos de
componentes React. Exporte os elementos estilizados de um arquivo `styles.ts`
quando o componente possuir vários blocos, regras aninhadas, responsividade ou
animações.

Estrutura recomendada para componentes maiores:

```text
Component/
├── index.tsx
├── styles.ts
└── types.ts
```

Um componente pequeno pode manter um único styled component no próprio arquivo.
Separe para `styles.ts` quando houver mais de um bloco relevante, quando o
arquivo ultrapassar aproximadamente 80 linhas por causa de estilos ou quando
os estilos dificultarem a leitura da lógica React.

Use como referências de organização:

- `client/src/components/dashboard/styles.ts`
- `client/src/components/Navbar/styles.ts`
- `client/src/components/landing/UploadBox/styles.ts`

Evite misturar `styled-components`, CSS Modules e `style={{ ... }}` no mesmo
componente. A mistura só é aceitável quando houver uma razão específica, como
um valor realmente dinâmico, uma API de terceiro ou uma regra global/legada que
não possa ser encapsulada.

### Unidades

Use `rem` para espaçamentos, dimensões, tipografia, raios, offsets, sombras e
breakpoints. Isso mantém a interface consistente quando o tamanho base da
fonte muda.

```ts
const Card = styled.div`
    padding: 1rem;
    gap: 0.75rem;
    border-radius: var(--border-radius-m);
    font-size: 1rem;
`
```

Evite `px`, `em` e números mágicos em novos estilos. Exceções aceitáveis:

- linhas extremamente finas, quando `0.0625rem` não produzir resultado
  consistente;
- valores exigidos por uma API externa ou por um SVG;
- propriedades técnicas em que a unidade é definida pelo navegador, como
  certos `outline` ou `device-pixel-ratio` hacks.

Mesmo nas exceções, prefira uma variável ou um comentário curto explicando a
necessidade.

### Cores e tokens

Use variáveis CSS para todas as cores novas. Os tokens principais ficam em
`client/src/global.css`, incluindo `--base`, `--base-dark`, `--foreground`,
`--nav-highlight`, os tokens `--dracula-*` e os raios compartilhados.

Não adicione hexadecimais, `rgb()`, `rgba()` ou nomes de cores diretamente em
novos styled components. Se uma cor for reutilizável, adicione primeiro um
token semântico em `global.css`, por exemplo `--surface-muted` ou
`--focus-ring`, e use esse token nos componentes.

Prefira tokens semânticos para novas necessidades. Não crie variações quase
idênticas sem confirmar que um token existente não atende ao caso.

### Bordas e superfícies

A interface usa poucas bordas visíveis. Para separar áreas, priorize:

- contraste entre `background-color` e superfícies;
- espaçamento e hierarquia visual;
- sombras suaves;
- estados de hover e focus;
- mudanças sutis de opacidade.

Não adicione bordas decorativas a cards, botões ou containers por padrão. Use
borda somente quando ela melhorar claramente a affordance, acessibilidade ou
separação de conteúdo. Não use bordas como substituto de layout ou espaçamento.

Raios devem usar os tokens `--border-radius-*` sempre que possível. Novos
valores de raio recorrentes devem virar tokens em `global.css`.

### Estados e acessibilidade

- Todo controle interativo deve ter estado `:hover` quando aplicável.
- Use `:focus-visible` com contraste suficiente; não remova o outline sem
  fornecer uma alternativa visível.
- Estados `:active`, disabled e loading devem comunicar claramente a mudança
  de estado sem depender apenas de cor.
- Mantenha alvos de toque confortáveis e não esconda conteúdo em breakpoints
  menores.
- Preserve `cursor`, `aria-*`, semântica HTML e navegação por teclado existentes.
- Respeite movimento reduzido quando uma nova animação for introduzida.

### Responsividade

- Use os breakpoints existentes como referência antes de criar novos.
- Escreva breakpoints em `rem` para acompanhar a escala tipográfica.
- Prefira layouts flexíveis com `flex`, `grid`, `minmax`, `clamp` e limites de
  largura em vez de posições fixas.
- Teste telas pequenas, médias e largas sempre que alterar um layout.
- Não corrija overflow apenas escondendo conteúdo com `overflow: hidden` sem
  verificar a causa.

## Exceções e legado conhecido

O código atual ainda possui exceções que não precisam ser corrigidas em cada
alteração:

- cores hexadecimais e `rgb()` diretamente em alguns estilos;
- dimensões e breakpoints em `px`;
- tokens duplicados ou com nomes históricos em `global.css`;
- CSS Modules antigos nas áreas de landing page;
- alguns estilos inline necessários para valores dinâmicos ou transições.

Novas alterações devem seguir este guia. A migração do legado deve ser feita em
mudanças isoladas, com validação visual e funcional própria.

## Checklist para alterações visuais

Antes de finalizar uma alteração no client, confirme:

- [ ] O estilo está no local correto ou em um `styles.ts` separado.
- [ ] Novas medidas usam `rem`.
- [ ] Novas cores usam variáveis CSS.
- [ ] Não foram adicionadas bordas desnecessárias.
- [ ] Hover, focus-visible, active, disabled e loading foram considerados.
- [ ] A tela funciona em viewport pequena e grande.
- [ ] Textos continuam localizados quando necessário.
- [ ] A semântica e a navegação por teclado foram preservadas.
- [ ] Não há links, constantes ou tokens duplicados sem motivo.

## Validação

Execute os comandos a partir do diretório correspondente:

```bash
cd client
bun run lint
bun test
bun run build
```

Para alterações no backend, execute também os testes e comandos definidos em
`api/package.json`. Antes de concluir, faça uma busca por referências antigas,
imports quebrados e estilos literais introduzidos na mudança.
