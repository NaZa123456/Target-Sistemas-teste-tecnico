export type TipoMovimentacao = 'ENTRADA' | 'SAIDA';

export type Produto = {
  codigoProduto: number;
  descricaoProduto: string;
  estoque: number;
};

export type EstoqueJson = {
  estoque: Produto[];
};

export type DadosMovimentacao = {
  id?: number;
  codigoProduto: number;
  descricaoMovimentacao: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  dataHora?: Date;
};

export type Movimentacao = {
  id: number;
  codigoProduto: number;
  descricaoMovimentacao: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  dataHora: string;
  estoqueFinal: number;
};

/** Erro de regra de negócio do depósito. */
export class ErroEstoque extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroEstoque';
  }
}
