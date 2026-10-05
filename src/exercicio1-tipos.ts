/**
 * Exercise 1 - commission calculation: business rules.
 *
 * Pure functions with no I/O, so the rules can be tested without any file or
 * console. Monetary values are handled as Decimal throughout: a naive float
 * multiplication would visibly break this exercise (see the rounding test in
 * `tests/exercicio1.test.ts`).
 */

/** A single sale, exactly as it appears in `vendas.json`. */
export type Venda = {
  vendedor: string;
  valor: number;
};

/** Shape of the `vendas.json` file. */
export type VendasJson = {
  vendas: Venda[];
};

/** Commission of one individual sale. */
export type ComissaoPorVenda = {
  vendedor: string;
  valorVenda: string;
  percentual: number;
  comissao: string;
};

/** Commission total of a seller, aggregated over all of their sales. */
export type TotalPorVendedor = {
  vendedor: string;
  totalComissao: string;
  quantidadeVendas: number;
};
