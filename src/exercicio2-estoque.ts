import type { Clock } from './relogio';
import { relogioSistema } from './relogio';
import { ErroEstoque } from './exercicio2-tipos';
import type { DadosMovimentacao, Movimentacao, Produto, TipoMovimentacao } from './exercicio2-tipos';

const TIPOS_VALIDOS: TipoMovimentacao[] = ['ENTRADA', 'SAIDA'];

/**
 * Exercise 2 - stock control: business rules.
 *
 * Holds every stock invariant and nothing else: no console output, no file
 * reading and no prompt handling. That separation is what allows the rules to
 * be unit tested and reused by any interface.
 *
 * Rules enforced by `registrarMovimentacao`:
 *  - the quantity must be an integer greater than zero;
 *  - the product must exist in the catalogue;
 *  - ENTRADA increases the stock and SAIDA decreases it;
 *  - the stock is never allowed to go negative (a SAIDA that lands exactly on
 *    zero is accepted, anything below zero is refused);
 *  - every movement gets a unique identifier.
 */
export class ServicoEstoque {
  private readonly produtos = new Map<number, Produto>();
  private readonly historico: Movimentacao[] = [];
  /** Next auto-generated identifier; always greater than any id already used. */
  private proximoId = 1;

  constructor(produtosIniciais: Produto[] = [], private readonly clock: Clock = relogioSistema) {
    this.carregar(produtosIniciais);
  }

  /** Loads (or reloads) the initial stock, clearing the movement history. */
  carregar(produtos: Produto[]): void {
    this.produtos.clear();
    this.historico.length = 0;
    this.proximoId = 1;

    for (const produto of produtos) {
      this.validarProdutoInicial(produto);
      this.produtos.set(produto.codigoProduto, { ...produto });
    }
  }

  /**
   * Validates a product from the initial stock file before it is registered.
   *
   * Rejecting bad seed data early keeps the service invariants true from the
   * very first operation, instead of failing later on an arithmetic edge case.
   */
  private validarProdutoInicial(produto: Produto): void {
    if (!Number.isInteger(produto.codigoProduto)) {
      throw new ErroEstoque(`Código de produto inválido: ${String(produto.codigoProduto)}.`);
    }
    if (!Number.isInteger(produto.estoque) || produto.estoque < 0) {
      throw new ErroEstoque(`Estoque inválido para o produto ${produto.codigoProduto}: ${produto.estoque}.`);
    }
    if (this.produtos.has(produto.codigoProduto)) {
      throw new ErroEstoque(`Código de produto duplicado no cadastro: ${produto.codigoProduto}.`);
    }
  }

  /** Lists every product with its current stock level. */
  listarEstoque(): Produto[] {
    return [...this.produtos.values()].map((produto) => ({ ...produto }));
  }

  /** Returns the current stock of a single product. */
  consultarEstoque(codigoProduto: number): Produto {
    const produto = this.produtos.get(codigoProduto);
    if (!produto) {
      throw new ErroEstoque(`Produto inexistente: ${codigoProduto}.`);
    }
    return { ...produto };
  }

  /**
   * Registers an ENTRADA or SAIDA movement and returns it along with the
   * resulting stock level.
   *
   * The identifier is generated automatically. A caller may still supply one
   * explicitly, but a value already used is refused, and the auto-generated
   * counter is always kept above the highest id seen so a manual id can never
   * be reused later.
   *
   * @throws {ErroEstoque} when any business rule is violated. The movement is
   * not recorded and the stock is left untouched in that case.
   */
  registrarMovimentacao(dados: DadosMovimentacao): Movimentacao {
    const produto = this.produtos.get(dados.codigoProduto);
    if (!produto) {
      throw new ErroEstoque(`Produto inexistente: ${dados.codigoProduto}.`);
    }

    if (!TIPOS_VALIDOS.includes(dados.tipo)) {
      throw new ErroEstoque(`Tipo de movimentação inválido: ${String(dados.tipo)}. Use ENTRADA ou SAIDA.`);
    }

    if (!Number.isInteger(dados.quantidade) || dados.quantidade <= 0) {
      throw new ErroEstoque(
        `Quantidade inválida: ${String(dados.quantidade)}. Deve ser um inteiro maior que zero.`,
      );
    }

    const descricao = dados.descricaoMovimentacao?.trim();
    if (!descricao) {
      throw new ErroEstoque('Descrição da movimentação é obrigatória.');
    }

    const id = dados.id ?? this.proximoId;
    if (this.historico.some((movimento) => movimento.id === id)) {
      throw new ErroEstoque(`Identificador de movimentação já utilizado: ${id}.`);
    }

    const estoqueFinal =
      dados.tipo === 'ENTRADA' ? produto.estoque + dados.quantidade : produto.estoque - dados.quantidade;

    // Zero is a valid stock level; only a negative result is refused.
    if (estoqueFinal < 0) {
      throw new ErroEstoque(
        `Estoque insuficiente para o produto ${dados.codigoProduto}: disponível ${produto.estoque}, solicitado ${dados.quantidade}.`,
      );
    }

    // All validations passed: from here the operation is applied atomically.
    produto.estoque = estoqueFinal;
    this.proximoId = Math.max(this.proximoId, id) + 1;

    const movimento: Movimentacao = {
      id,
      codigoProduto: dados.codigoProduto,
      descricaoMovimentacao: descricao,
      tipo: dados.tipo,
      quantidade: dados.quantidade,
      dataHora: (dados.dataHora ?? this.clock()).toISOString(),
      estoqueFinal,
    };
    this.historico.push(movimento);

    return { ...movimento };
  }

  /**
   * Returns the movement history, optionally filtered by product.
   *
   * Copies are returned so callers cannot mutate the internal state.
   */
  listarMovimentacoes(codigoProduto?: number): Movimentacao[] {
    const lista =
      codigoProduto === undefined
        ? this.historico
        : this.historico.filter((movimento) => movimento.codigoProduto === codigoProduto);

    return lista.map((movimento) => ({ ...movimento }));
  }
}
