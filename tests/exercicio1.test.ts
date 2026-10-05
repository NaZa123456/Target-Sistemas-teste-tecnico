import { describe, expect, it } from 'vitest';

import { calcularComissaoPorVenda, calcularComissoesPorVendedor } from '../src/exercicio1-comissao';
import { carregarVendas } from '../src/exercicio1-dados';
import type { Venda } from '../src/exercicio1-tipos';

describe('Exercício 1 - regras de comissão por venda', () => {
  it('valor menor que 100 recebe 0%', () => {
    const resultado = calcularComissaoPorVenda(99.99);

    expect(resultado.percentual).toBe(0);
    expect(resultado.comissao).toBe('0.00');
  });

  it('exatamente 100 recebe 1%', () => {
    const resultado = calcularComissaoPorVenda(100);

    expect(resultado.percentual).toBe(1);
    expect(resultado.comissao).toBe('1.00');
  });

  it('valor entre 100 e 499.99 recebe 1%', () => {
    const inicio = calcularComissaoPorVenda(100.01);
    const meio = calcularComissaoPorVenda(250.3);
    const fim = calcularComissaoPorVenda(499.99);

    expect(inicio).toEqual({ percentual: 1, comissao: '1.00' });
    expect(meio).toEqual({ percentual: 1, comissao: '2.50' });
    expect(fim).toEqual({ percentual: 1, comissao: '5.00' });
  });

  it('exatamente 500 recebe 5%', () => {
    const resultado = calcularComissaoPorVenda(500);

    expect(resultado.percentual).toBe(5);
    expect(resultado.comissao).toBe('25.00');
  });

  it('valor acima de 500 recebe 5%', () => {
    const resultado = calcularComissaoPorVenda(1200.5);

    expect(resultado.percentual).toBe(5);
    expect(resultado.comissao).toBe('60.03');
  });

  it('não sofre erro de ponto flutuante em valores periódicos', () => {
    // 1110.10 * 5% = 55.505. A multiplicação ingênua em float retorna 55.50;
    // com Decimal (arredondamento half-up) o resultado correto é 55.51.
    expect(calcularComissaoPorVenda(1110.1).comissao).toBe('55.51');

    expect(calcularComissaoPorVenda(100).comissao).toBe('1.00');
    expect(calcularComissaoPorVenda(0.3).comissao).toBe('0.00');
    expect(calcularComissaoPorVenda(999.99).comissao).toBe('50.00');
  });
});

describe('Exercício 1 - agrupamento por vendedor', () => {
  it('soma as comissões individuais agrupadas por vendedor', () => {
    const vendas: Venda[] = [
      { vendedor: 'João Silva', valor: 100 }, // 1.00
      { vendedor: 'João Silva', valor: 500 }, // 25.00
      { vendedor: 'Maria Souza', valor: 90.75 }, // 0.00
      { vendedor: 'Maria Souza', valor: 1000 }, // 50.00
      { vendedor: 'Maria Souza', valor: 250.3 }, // 2.50
    ];

    const totais = calcularComissoesPorVendedor(vendas);

    expect(totais).toHaveLength(2);

    const joao = totais.find((total) => total.vendedor === 'João Silva');
    const maria = totais.find((total) => total.vendedor === 'Maria Souza');

    expect(joao).toEqual({ vendedor: 'João Silva', totalComissao: '26.00', quantidadeVendas: 2 });
    expect(maria).toEqual({ vendedor: 'Maria Souza', totalComissao: '52.50', quantidadeVendas: 3 });
  });

  it('ordena os totais alfabeticamente pelo nome do vendedor', () => {
    const vendas: Venda[] = [
      { vendedor: 'Carlos Oliveira', valor: 1000 },
      { vendedor: 'Ana Lima', valor: 1000 },
      { vendedor: 'Maria Souza', valor: 1000 },
    ];

    const totais = calcularComissoesPorVendedor(vendas);

    expect(totais.map((total) => total.vendedor)).toEqual(['Ana Lima', 'Carlos Oliveira', 'Maria Souza']);
  });

  it('devolve lista vazia quando não há vendas', () => {
    expect(calcularComissoesPorVendedor([])).toEqual([]);
  });

  it('calcula a comissão por venda e não sobre o total do vendedor', () => {
    // Soma das vendas = 1000. Se fosse 5% do total daria 50.00.
    // Por venda: 1.00 (100) + 25.00 (500) + 4.00 (400) = 30.00
    const vendas: Venda[] = [
      { vendedor: 'João Silva', valor: 100 },
      { vendedor: 'João Silva', valor: 500 },
      { vendedor: 'João Silva', valor: 400 },
    ];

    const [total] = calcularComissoesPorVendedor(vendas);

    expect(total?.totalComissao).toBe('30.00');
  });
});

describe('Exercício 1 - leitura do vendas.json', () => {
  it('lê as 36 vendas do arquivo de dados', () => {
    const { vendas } = carregarVendas();

    expect(vendas).toHaveLength(36);
    expect(new Set(vendas.map((venda) => venda.vendedor)).size).toBe(4);
  });

  it('reproduz os totais esperados do arquivo de dados', () => {
    const { vendas } = carregarVendas();
    const totais = calcularComissoesPorVendedor(vendas);

    const esperado: Record<string, string> = {
      'João Silva': '495.69',
      'Maria Souza': '465.96',
      'Carlos Oliveira': '379.38',
      'Ana Lima': '404.99',
    };

    expect(totais).toHaveLength(4);

    for (const [vendedor, total] of Object.entries(esperado)) {
      expect(totais.find((item) => item.vendedor === vendedor)?.totalComissao).toBe(total);
    }
  });
});
