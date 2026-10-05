import { Decimal } from 'decimal.js';

/**
 * Configuração global do Decimal para os cálculos monetários:
 * - 28 dígitos significativos (padrão do decimal.js);
 * - arredondamento half-up, o mais próximo do esperado em financeiro;
 * - sem notação científica na saída.
 */
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 29,
});

export function toDecimal(valor: Decimal.Value): Decimal {
  return new Decimal(valor);
}

/** Formata um valor monetário com exatamente 2 casas decimais. */
export function brl(valor: Decimal.Value): string {
  return new Decimal(valor).toFixed(2);
}
