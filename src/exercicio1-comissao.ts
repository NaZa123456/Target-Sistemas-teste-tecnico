import type { Decimal } from 'decimal.js';
import { brl, toDecimal } from './utils/money';
import type { ComissaoPorVenda, TotalPorVendedor, Venda } from './exercicio1-tipos';

/**
 * Regras de comissão por venda. O percentual é definido pela faixa do valor:
 *
 *   valor <  R$ 100,00            -> 0%
 *   valor >= R$ 100,00 e < 500,00 -> 1%
 *   valor >= R$ 500,00            -> 5%
 *
 * A comissão é sempre calculada por venda (nunca sobre o total do vendedor).
 * Todos os valores monetários usam Decimal, evitando erro de ponto flutuante.
 */
export function calcularComissaoPorVenda(valor: Decimal.Value): { percentual: number; comissao: string } {
  const v: Decimal = toDecimal(valor);

  if (v.lt(100)) {
    return { percentual: 0, comissao: brl(0) };
  }

  if (v.lt(500)) {
    return { percentual: 1, comissao: brl(v.times('0.01')) };
  }

  return { percentual: 5, comissao: brl(v.times('0.05')) };
}

/** Comissão de cada venda, preservando a ordem de leitura do JSON. */
export function calcularComissoesPorVenda(vendas: Venda[]): ComissaoPorVenda[] {
  return vendas.map((venda) => {
    const { percentual, comissao } = calcularComissaoPorVenda(venda.valor);
    return {
      vendedor: venda.vendedor,
      valorVenda: brl(venda.valor),
      percentual,
      comissao,
    };
  });
}

/** Agrupa as vendas por vendedor e soma as comissões individuais. */
export function calcularComissoesPorVendedor(vendas: Venda[]): TotalPorVendedor[] {
  const totais = new Map<string, { total: Decimal; quantidade: number }>();

  for (const venda of vendas) {
    const { comissao } = calcularComissaoPorVenda(venda.valor);
    const atual = totais.get(venda.vendedor) ?? { total: toDecimal(0), quantidade: 0 };

    totais.set(venda.vendedor, {
      total: atual.total.plus(comissao),
      quantidade: atual.quantidade + 1,
    });
  }

  return [...totais.entries()]
    .map(([vendedor, dados]) => ({
      vendedor,
      totalComissao: brl(dados.total),
      quantidadeVendas: dados.quantidade,
    }))
    .sort((a, b) => a.vendedor.localeCompare(b.vendedor, 'pt-BR'));
}
