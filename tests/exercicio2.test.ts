import { beforeEach, describe, expect, it } from 'vitest';

import { carregarEstoque } from '../src/exercicio2-dados';
import { ServicoEstoque } from '../src/exercicio2-estoque';
import { ErroEstoque } from '../src/exercicio2-tipos';
import type { Produto } from '../src/exercicio2-tipos';

const PRODUTOS: Produto[] = [
  { codigoProduto: 101, descricaoProduto: 'Caneta Azul', estoque: 150 },
  { codigoProduto: 102, descricaoProduto: 'Caderno Universitário', estoque: 75 },
];

/** Relógio fixo: garante que os testes não dependam do relógio do sistema. */
const DATA_FIXA = new Date('2026-03-10T12:00:00.000Z');

describe('Exercício 2 - Controle de Estoque', () => {
  let servico: ServicoEstoque;

  beforeEach(() => {
    servico = new ServicoEstoque(PRODUTOS, () => DATA_FIXA);
  });

  it('1. Entrada válida aumenta o estoque', () => {
    const movimentacao = servico.registrarMovimentacao({
      codigoProduto: 101,
      descricaoMovimentacao: 'Recebimento de compra',
      tipo: 'ENTRADA',
      quantidade: 50,
    });

    expect(movimentacao.estoqueFinal).toBe(200);
    expect(servico.consultarEstoque(101).estoque).toBe(200);
  });

  it('2. Saída válida diminui o estoque', () => {
    const movimentacao = servico.registrarMovimentacao({
      codigoProduto: 101,
      descricaoMovimentacao: 'Venda para cliente',
      tipo: 'SAIDA',
      quantidade: 30,
    });

    expect(movimentacao.estoqueFinal).toBe(120);
    expect(servico.consultarEstoque(101).estoque).toBe(120);
  });

  it('3. Saída que deixaria estoque negativo é recusada', () => {
    expect(() =>
      servico.registrarMovimentacao({
        codigoProduto: 102,
        descricaoMovimentacao: 'Venda maior que o estoque',
        tipo: 'SAIDA',
        quantidade: 76,
      }),
    ).toThrow(ErroEstoque);

    // O estoque permanece intacto após a recusa.
    expect(servico.consultarEstoque(102).estoque).toBe(75);
    expect(servico.listarMovimentacoes()).toHaveLength(0);
  });

  it('3b. Saída que zera o estoque é permitida', () => {
    const movimentacao = servico.registrarMovimentacao({
      codigoProduto: 102,
      descricaoMovimentacao: 'Venda de todo o estoque',
      tipo: 'SAIDA',
      quantidade: 75,
    });

    expect(movimentacao.estoqueFinal).toBe(0);
  });

  it('4. Produto inexistente é recusado', () => {
    expect(() =>
      servico.registrarMovimentacao({
        codigoProduto: 999,
        descricaoMovimentacao: 'Operação inválida',
        tipo: 'ENTRADA',
        quantidade: 1,
      }),
    ).toThrow(/Produto inexistente: 999/);

    expect(() => servico.consultarEstoque(999)).toThrow(/Produto inexistente: 999/);
  });

  it('5. Quantidade inválida é recusada', () => {
    const quantidades: Array<[string, number]> = [
      ['zero', 0],
      ['negativa', -5],
      ['decimal', 1.5],
      ['NaN', Number.NaN],
    ];

    for (const [, quantidade] of quantidades) {
      expect(() =>
        servico.registrarMovimentacao({
          codigoProduto: 101,
          descricaoMovimentacao: 'Quantidade inválida',
          tipo: 'ENTRADA',
          quantidade,
        }),
      ).toThrow(ErroEstoque);
    }
  });

  it('5b. Descrição obrigatória e tipo inválido são recusados', () => {
    expect(() =>
      servico.registrarMovimentacao({
        codigoProduto: 101,
        descricaoMovimentacao: '   ',
        tipo: 'ENTRADA',
        quantidade: 1,
      }),
    ).toThrow(/Descrição da movimentação é obrigatória/);

    expect(() =>
      servico.registrarMovimentacao({
        codigoProduto: 101,
        descricaoMovimentacao: 'Tipo inválido',
        tipo: 'TRANSFERENCIA' as never,
        quantidade: 1,
      }),
    ).toThrow(/Tipo de movimentação inválido/);
  });

  it('6. Identificador de movimentação é único e sequencial', () => {
    const primeiro = servico.registrarMovimentacao({
      codigoProduto: 101,
      descricaoMovimentacao: 'Primeira',
      tipo: 'ENTRADA',
      quantidade: 1,
    });
    const segundo = servico.registrarMovimentacao({
      codigoProduto: 101,
      descricaoMovimentacao: 'Segunda',
      tipo: 'SAIDA',
      quantidade: 1,
    });

    expect(primeiro.id).toBe(1);
    expect(segundo.id).toBe(2);
    expect(primeiro.id).not.toBe(segundo.id);
  });

  it('6b. Identificador informado manualmente é validado contra duplicidade', () => {
    servico.registrarMovimentacao({
      id: 10,
      codigoProduto: 101,
      descricaoMovimentacao: 'Com id manual',
      tipo: 'ENTRADA',
      quantidade: 1,
    });

    const proximo = servico.registrarMovimentacao({
      codigoProduto: 101,
      descricaoMovimentacao: 'Sequencial após id manual',
      tipo: 'ENTRADA',
      quantidade: 1,
    });
    expect(proximo.id).toBe(11);

    expect(() =>
      servico.registrarMovimentacao({
        id: 10,
        codigoProduto: 101,
        descricaoMovimentacao: 'Duplicada',
        tipo: 'ENTRADA',
        quantidade: 1,
      }),
    ).toThrow(/Identificador de movimentação já utilizado: 10/);
  });

  it('6c. Identificador automático nunca reaproveita um id manual já usado', () => {
    // The counter must always move past any explicit id, otherwise an
    // auto-generated movement would later collide with the manual one.
    servico.registrarMovimentacao({
      id: 10,
      codigoProduto: 101,
      descricaoMovimentacao: 'Com id manual 10',
      tipo: 'ENTRADA',
      quantidade: 1,
    });

    const following = [
      servico.registrarMovimentacao({
        codigoProduto: 101,
        descricaoMovimentacao: 'Automática 1',
        tipo: 'ENTRADA',
        quantidade: 1,
      }),
      servico.registrarMovimentacao({
        codigoProduto: 101,
        descricaoMovimentacao: 'Automática 2',
        tipo: 'ENTRADA',
        quantidade: 1,
      }),
    ];

    expect(following.map((movimento) => movimento.id)).toEqual([11, 12]);

    const ids = servico.listarMovimentacoes().map((movimento) => movimento.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('7. Atualização correta do estoque após várias movimentações', () => {
    servico.registrarMovimentacao({
      codigoProduto: 101,
      descricaoMovimentacao: 'Entrada 100',
      tipo: 'ENTRADA',
      quantidade: 100,
    });
    servico.registrarMovimentacao({
      codigoProduto: 101,
      descricaoMovimentacao: 'Saída 30',
      tipo: 'SAIDA',
      quantidade: 30,
    });

    expect(servico.consultarEstoque(101).estoque).toBe(220);
    // Produto não movimentado permanece inalterado.
    expect(servico.consultarEstoque(102).estoque).toBe(75);
  });

  it('8. Histórico registra todos os campos exigidos', () => {
    servico.registrarMovimentacao({
      codigoProduto: 101,
      descricaoMovimentacao: 'Recebimento',
      tipo: 'ENTRADA',
      quantidade: 10,
    });
    servico.registrarMovimentacao({
      codigoProduto: 102,
      descricaoMovimentacao: 'Venda',
      tipo: 'SAIDA',
      quantidade: 5,
    });

    const historico = servico.listarMovimentacoes();

    expect(historico).toHaveLength(2);
    expect(historico[0]).toEqual({
      id: 1,
      codigoProduto: 101,
      descricaoMovimentacao: 'Recebimento',
      tipo: 'ENTRADA',
      quantidade: 10,
      dataHora: '2026-03-10T12:00:00.000Z',
      estoqueFinal: 160,
    });

    // Filtro do histórico por produto.
    expect(servico.listarMovimentacoes(102)).toHaveLength(1);
    expect(servico.listarMovimentacoes(101)).toHaveLength(1);
  });

  it('consulta de estoque lista todos os produtos', () => {
    expect(servico.listarEstoque()).toEqual(PRODUTOS);
  });

  it('rejeita cadastro inicial inválido', () => {
    expect(() => new ServicoEstoque([{ codigoProduto: 1, descricaoProduto: 'X', estoque: -1 }])).toThrow(
      /Estoque inválido/,
    );

    expect(() =>
      new ServicoEstoque([
        { codigoProduto: 1, descricaoProduto: 'X', estoque: 1 },
        { codigoProduto: 1, descricaoProduto: 'Y', estoque: 1 },
      ]),
    ).toThrow(/duplicado/);
  });
});

describe('Exercício 2 - leitura do estoque.json', () => {
  it('lê os 5 produtos do arquivo de dados', () => {
    const produtos = carregarEstoque();

    expect(produtos).toHaveLength(5);
    expect(produtos[0]).toEqual({ codigoProduto: 101, descricaoProduto: 'Caneta Azul', estoque: 150 });
    expect(produtos[4]).toEqual({
      codigoProduto: 105,
      descricaoProduto: 'Marcador de Texto Amarelo',
      estoque: 90,
    });
  });
});
