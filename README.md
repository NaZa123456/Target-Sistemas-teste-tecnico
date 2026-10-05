# Desafio Técnico Target

Solução em TypeScript dos três exercícios propostos: **cálculo de comissão**, **controle de
estoque** e **juros por atraso**. Projeto independente, com interface de linha de comando (CLI),
regras de negócio isoladas da entrada/saída e testes automatizados.

---

## Requisitos

- **Node.js 18 ou superior** (desenvolvido e validado no Node 24)
- **npm** (incluído com o Node.js)

Não é necessário instalar nada globalmente: todas as dependências são locais ao projeto.

## Stack

| Ferramenta     | Versão | Motivo                                                        |
| -------------- | ------ | ------------------------------------------------------------- |
| TypeScript     | 5.9    | Tipagem estática nos testes e no código de produção.          |
| Node.js (CLI)  | 18+    | Interface simples, sem servidor nem banco de dados.           |
| `tsx`          | 4.x    | Executa TypeScript diretamente, sem etapa de build.           |
| `vitest`       | 5.x    | Testes unitários rápidos, com execução via `npm test`.        |
| `decimal.js`   | 10.x   | Cálculo monetário com precisão exata (ver "Decisões").        |

## Estrutura de pastas

```
desafio tecnico target/
├── src/
│   ├── cli.ts                     # Menu principal (ponto de entrada único)
│   ├── exercicio1.ts              # Exercício 1 - interface (entrada/saída)
│   ├── exercicio1-dados.ts        # Exercício 1 - leitura e validação do vendas.json
│   ├── exercicio1-comissao.ts     # Exercício 1 - regras de negócio
│   ├── exercicio2.ts              # Exercício 2 - interface
│   ├── exercicio2-dados.ts        # Exercício 2 - leitura e validação do estoque.json
│   ├── exercicio2-tipos.ts        # Exercício 2 - tipos e erro de domínio
│   ├── exercicio2-estoque.ts      # Exercício 2 - regras de negócio (ServicoEstoque)
│   ├── exercicio3.ts              # Exercício 3 - interface
│   ├── exercicio3-juros.ts        # Exercício 3 - regras de negócio
│   ├── relogio.ts                 # Data/hora injetável (Clock)
│   ├── types.ts                   # Tipos do exercício 1
│   ├── utils/
│   │   ├── money.ts               # Decimal + formatação BRL
│   │   └── prompt.ts              # Leitura de entrada (terminal ou pipe)
│   └── data/
│       ├── vendas.json            # Dados de entrada do exercício 1
│       └── estoque.json           # Estoque inicial do exercício 2
├── tests/
│   ├── exercicio1.test.ts         # 12 testes
│   ├── exercicio2.test.ts         # 14 testes
│   └── exercicio3.test.ts         # 10 testes
├── .gitignore
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.build.json
└── vitest.config.mts
```

O padrão de nomes é sempre o mesmo: `exercicioN-<tema>.ts` contém **apenas regras de negócio**,
sem `console` nem leitura de arquivos; `exercicioN.ts` e `exercicioN-dados.ts` cuidam da
**interface e da entrada de dados**.

## Instalação

```bash
cd "C:\Users\nazar\Desktop\desafio tecnico target"
npm install
```

## Como executar

Menu com os três exercícios:

```bash
npm start
```

Cada exercício também pode ser executado direto:

```bash
npm run ex1     # cálculo de comissão
npm run ex2     # controle de estoque (menu de movimentações)
npm run ex3     # juros por atraso
```

Os atalhos usam `tsx`. Para executar sem `npm`:

```bash
npx tsx src/cli.ts
npx tsx src/exercicio1.ts
npx tsx src/exercicio2.ts
npx tsx src/exercicio3.ts
```

## Como executar os testes

```bash
npm test           # execução única (usado na avaliação/CI)
npm run test:watch # modo watch durante o desenvolvimento
```

Verificação de tipos:

```bash
npm run typecheck  # tsc --noEmit
```

Build para produção (opcional, gera `dist/`):

```bash
npm run build && node dist/cli.js
```

---

## Exercício 1 — Cálculo de comissão

Lê `src/data/vendas.json` (nenhum dado está fixo no código) e calcula a comissão de **cada venda
individualmente**, agrupando o resultado por vendedor.

| Valor da venda            | Comissão |
| ------------------------- | -------- |
| abaixo de R$ 100,00       | 0%       |
| de R$ 100,00 até R$ 499,99| 1%       |
| a partir de R$ 500,00     | 5%       |

As fronteiras seguem exatamente o enunciado: `100,00` recebe 1% e `500,00` recebe 5%.

Resultado com os dados fornecidos:

| Vendedor         | Vendas | Comissão total |
| ---------------- | ------ | -------------- |
| Ana Lima         | 9      | R$ 404,99      |
| Carlos Oliveira  | 8      | R$ 379,38      |
| João Silva       | 10     | R$ 495,69      |
| Maria Souza      | 9      | R$ 465,96      |

```bash
npm run ex1
# Caminho do vendas.json (Enter para o padrão src/data/vendas.json):
```

## Exercício 2 — Controle de estoque

Carrega `src/data/estoque.json` e permite registrar movimentações de entrada e saída. Cada
movimentação possui `id`, `codigoProduto`, `descricaoMovimentacao`, `tipo`, `quantidade`,
`dataHora` e o `estoqueFinal` resultante.

Regras implementadas em `ServicoEstoque`:

- entrada soma, saída subtrai;
- estoque **nunca** fica negativo (uma saída que zeraria o estoque é aceita; abaixo de zero, não);
- quantidade deve ser **inteira e maior que zero**;
- produto precisa existir no cadastro;
- descrição da movimentação é obrigatória;
- o `id` é sequencial e único — pode ser informado manualmente, mas duplicado é recusado;
- histórico completo, com filtro opcional por produto.

```bash
npm run ex2
# 1) Registrar movimentação   2) Consultar estoque
# 3) Histórico de movimentações   0) Sair
```

## Exercício 3 — Juros por atraso

Calcula juros de **2,5% ao dia** em dias corridos e devolve valor original, vencimento, data
usada no cálculo, dias de atraso, percentual, valor dos juros e total atualizado.

- vencimento no futuro → 0 dias de atraso;
- vencimento no dia da referência → 0 dias de atraso;
- vencido → dias corridos entre vencimento e data de referência.

O cálculo **não depende do relógio do sistema**: a data de referência pode ser informada
(`dataReferencia`) e o serviço de estoque recebe um `Clock` injetável. Na execução normal, sem
informar nada, usa a data de hoje.

```bash
npm run ex3
# Valor (ex: 100,00): 100,00
# Data de vencimento (yyyy-MM-dd): 2026-03-08
# Data de referência (Enter = hoje, yyyy-MM-dd): 2026-03-10
#
#   Dias em atraso ...........: 2
#   Valor dos juros ..........: R$ 5.00
#   Valor total atualizado ...: R$ 105.00
```

---

## Decisões técnicas

**Precisão monetária (`decimal.js`).** Valores monetários nunca são calculados com `number`
 ingênuo. Um exemplo real encontrado durante os testes: `1110,10 × 5% = 55,505`; a multiplicação
em `float` produz `55,50`, enquanto `Decimal` com `ROUND_HALF_UP` produz o correto `55,51`.
Esse caso está coberto por teste. Arredondamento escolhido: *half-up*, o mais próximo do padrão
financeiro brasileiro.

**CLI em vez de web.** Os três enunciados pedem cálculos e validações, não telas. Uma CLI é mais
simples de executar, não exige servidor e mantém o foco nas regras de negócio. O `Prompt`
(`src/utils/prompt.ts`) funciona em terminal interativo **e** com entrada redirecionada
(`npx tsx src/exercicio2.ts < entrada.txt`), o que facilita demonstrações automatizadas.

**Data de referência explícita (exercício 3).** O enunciado pede que os testes não dependam do
relógio. Isso foi resolvido com um parâmetro `dataReferencia` e, para o exercício 2, com um
`Clock` injetado no construtor de `ServicoEstoque`. Nenhum teste depende de "hoje".

**Erros de domínio.** O exercício 2 lança `ErroEstoque` com mensagens em português; a CLI apenas
traduz isso para o usuário. As regras de negócio não conhecem `console` nem `readline`, o que
permite reutilizá-las em uma API ou em testes sem terminal.

**Validação na entrada de dados.** Os JSONs são validados ao carregar (estrutura, tipos,
BOM). Valores monetários aceitam `number` ou `string` decimal (`'1234.56'`), evitando
`parseFloat` sobre entrada já convertida.

## Regras de negócio implementadas

| Exercício | Regra |
| --------- | ----- |
| 1 | Comissão por venda: `< 100` → 0%; `[100, 500)` → 1%; `>= 500` → 5% |
| 1 | Total por vendedor = soma das comissões individuais (nunca 5% do total) |
| 2 | `ENTRADA` soma, `SAIDA` subtrai |
| 2 | Estoque não pode ficar negativo |
| 2 | Quantidade deve ser inteira e `> 0` |
| 2 | Produto deve existir; descrição é obrigatória |
| 2 | `id` de movimentação único |
| 3 | Juros de 2,5% ao dia em dias corridos |
| 3 | Sem dias de atraso quando o vencimento é hoje ou futuro |

## Testes

36 testes automatizados (12 + 14 + 10), todos passando:

- **Exercício 1 (12)** — abaixo de 100; exatamente 100; entre 100 e 499,99; exatamente 500;
  acima de 500; ausência de erro de ponto flutuante; agrupamento e soma por vendedor; ordenação
  alfabética; lista vazia; comissão calculada por venda (e não sobre o total); leitura do JSON;
  totais esperados do arquivo de dados.
- **Exercício 2 (14)** — entrada válida; saída válida; saída que deixaria estoque negativo;
  saída que zera o estoque; produto inexistente; quantidade inválida (zero, negativa, decimal,
  `NaN`); descrição obrigatória; tipo inválido; `id` único e sequencial; `id` manual com
  duplicidade; atualização correta do estoque; registro do histórico; filtro do histórico por
  produto; consulta de estoque; cadastro inicial inválido; leitura do JSON.
- **Exercício 3 (10)** — vencimento no futuro; vencimento hoje; 1 dia de atraso; vários dias;
  atraso longo (30 dias); valor com casas decimais; centavo periódico sem erro de float; atraso
  atravessando a virada do mês; retorno de todos os campos; data de referência via `Clock`.

## Limitações e decisões assumidas

- O estoque é mantido **em memória**: a cada execução o programa recarrega `estoque.json`. Não
  há persistência das movimentações, que não foi solicitada.
- Quantidades de estoque e de movimentação são **inteiras**, conforme a validação do enunciado.
- As datas são manipjadas como `yyyy-MM-dd` em horário local, evitando deslocamento de fuso. A
  diferença em dias é um inteiro exato, sem horas ou frações.
- Juros compostos não foram implementados: o enunciado descreve 2,5% ao dia sobre o valor original
  (juros simples).
- A saída do CLI usa acentuação completa em UTF-8. Em terminais Windows legados (code page
  anterior a UTF-8) os acentos podem aparecer quebrados; o código não é afetado.
- Não há interface web nem banco de dados, por não agregarem valor a estes enunciados.
