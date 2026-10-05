import type { Decimal } from 'decimal.js';
import { brl, toDecimal } from './utils/money';
import { hojeIso, paraDataLocal, relogioSistema } from './relogio';
import type { Clock } from './relogio';

/** Percentual de juros aplicado por dia de atraso: 2,5% ao dia. */
export const JUROS_POR_DIA = '0.025';

export type ParametrosCalculo = {
  /** Valor original da operação. */
  valor: Decimal.Value;
  /** Data de vencimento no formato ISO yyyy-MM-dd. */
  dataVencimento: string;
  /**
   * Data de referência do cálculo (yyyy-MM-dd). Opcional: quando omitida **ou
   * vazia** — que é o que o ENTER da pergunta "Enter = hoje" devolve — usa a
   * data atual. Nos testes ela é sempre informada, para que o resultado não
   * dependa do relógio do sistema.
   */
  dataReferencia?: string;
};

export type ResultadoJuros = {
  valorOriginal: string;
  dataVencimento: string;
  dataCalculo: string;
  diasAtraso: number;
  percentualAplicado: string;
  valorJuros: string;
  valorTotal: string;
};

const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

/** Número decimal aceito na entrada, já com a vírgula normalizada para ponto. */
const NUMERO = /^-?\d+(?:\.\d+)?$/;

/**
 * Resolve a data de referência do cálculo.
 *
 * A pergunta da CLI diz "Enter = hoje". O ENTER puro devolve uma **string
 * vazia**, e não `undefined`, então um `??` não bastaria: a string vazia
 * escaparia para a validação da data e o cálculo quebraria. Por isso o campo é
 * normalizado (trim + checagem de conteúdo) antes de cair no relógio.
 */
function resolverDataCalculo(referenciaInformada: string | undefined, clock: Clock): string {
  const informada = referenciaInformada?.trim();
  return informada ? informada : hojeIso(clock);
}

/**
 * Converte o valor informado em Decimal.
 *
 * Sem esta checagem, uma entrada vazia ou não numérica chega ao `decimal.js` e
 * estoura um `DecimalError: Invalid argument`, expondo um detalhe técnico da
 * biblioteca em vez de uma mensagem utilizável.
 */
function lerValor(entrada: Decimal.Value): Decimal {
  const texto = typeof entrada === 'string' ? entrada.trim() : entrada;

  if (typeof texto !== 'string' && typeof texto !== 'number') {
    throw new Error(`Valor inválido: "${String(texto)}". Informe um número, ex: 100,00.`);
  }

  const normalizado = typeof texto === 'number' ? String(texto) : texto;
  if (!NUMERO.test(normalizado)) {
    throw new Error(`Valor inválido: "${normalizado}". Informe um número, ex: 100,00.`);
  }

  return toDecimal(normalizado);
}

/**
 * Calcula os juros de atraso de 2,5% ao dia, em dias corridos.
 *
 * Regras:
 *  - vencimento no futuro -> não há dias de atraso;
 *  - vencimento na data de referência -> não há dias de atraso;
 *  - vencimento passado -> dias corridos entre o vencimento e a data de referência.
 *
 * Os valores monetários usam Decimal, evitando erro de ponto flutuante.
 */
export function calcularJurosAtraso(
  parametros: ParametrosCalculo,
  clock: Clock = relogioSistema,
): ResultadoJuros {
  const valor = lerValor(parametros.valor);
  const dataCalculo = resolverDataCalculo(parametros.dataReferencia, clock);

  const vencimento = paraDataLocal(parametros.dataVencimento);
  const referencia = paraDataLocal(dataCalculo);

  const diasAtraso = Math.max(
    0,
    Math.round((referencia.getTime() - vencimento.getTime()) / MILISSEGUNDOS_POR_DIA),
  );

  const juros = valor.times(JUROS_POR_DIA).times(diasAtraso);

  return {
    valorOriginal: brl(valor),
    dataVencimento: parametros.dataVencimento,
    dataCalculo,
    diasAtraso,
    percentualAplicado: '2,5% ao dia',
    valorJuros: brl(juros),
    valorTotal: brl(valor.plus(juros)),
  };
}
