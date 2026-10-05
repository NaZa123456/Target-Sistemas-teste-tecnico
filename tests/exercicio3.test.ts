import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';

import { calcularJurosAtraso } from '../src/exercicio3-juros';
import { Prompt } from '../src/utils/prompt';
import type { Clock } from '../src/relogio';

const REFERENCIA = '2026-03-10';
const CLOCK_FIXO: Clock = () => new Date(2026, 2, 10, 15, 30);

describe('Exercício 3 - Juros por Atraso', () => {
  it('vencimento no futuro não gera juros', () => {
    const resultado = calcularJurosAtraso({
      valor: 100,
      dataVencimento: '2026-03-12',
      dataReferencia: REFERENCIA,
    });

    expect(resultado.diasAtraso).toBe(0);
    expect(resultado.valorJuros).toBe('0.00');
    expect(resultado.valorTotal).toBe('100.00');
  });

  it('vencimento hoje não gera dias de atraso', () => {
    const resultado = calcularJurosAtraso({
      valor: 100,
      dataVencimento: REFERENCIA,
      dataReferencia: REFERENCIA,
    });

    expect(resultado.diasAtraso).toBe(0);
    expect(resultado.valorJuros).toBe('0.00');
    expect(resultado.valorTotal).toBe('100.00');
  });

  it('1 dia de atraso aplica 2,5% uma vez', () => {
    const resultado = calcularJurosAtraso({
      valor: 100,
      dataVencimento: '2026-03-09',
      dataReferencia: REFERENCIA,
    });

    expect(resultado.diasAtraso).toBe(1);
    expect(resultado.valorJuros).toBe('2.50');
    expect(resultado.valorTotal).toBe('102.50');
  });

  it('vários dias de atraso são contados em dias corridos', () => {
    const resultado = calcularJurosAtraso({
      valor: 100,
      dataVencimento: '2026-03-08',
      dataReferencia: REFERENCIA,
    });

    expect(resultado.diasAtraso).toBe(2);
    expect(resultado.valorJuros).toBe('5.00');
    expect(resultado.valorTotal).toBe('105.00');
  });

  it('atraso longo acumula a partir do vencimento', () => {
    const resultado = calcularJurosAtraso({
      valor: 100,
      dataVencimento: '2026-02-08',
      dataReferencia: REFERENCIA,
    });

    expect(resultado.diasAtraso).toBe(30);
    expect(resultado.valorJuros).toBe('75.00');
    expect(resultado.valorTotal).toBe('175.00');
  });

  it('valor monetário com casas decimais', () => {
    const resultado = calcularJurosAtraso({
      valor: '1234.56',
      dataVencimento: '2026-03-08',
      dataReferencia: REFERENCIA,
    });

    expect(resultado.diasAtraso).toBe(2);
    expect(resultado.valorOriginal).toBe('1234.56');
    expect(resultado.valorJuros).toBe('61.73');
    expect(resultado.valorTotal).toBe('1296.29');
  });

  it('valor que terminaria em centavo periódico não sofre erro de float', () => {
    const resultado = calcularJurosAtraso({
      valor: '0.30',
      dataVencimento: '2026-03-09',
      dataReferencia: REFERENCIA,
    });

    expect(resultado.valorJuros).toBe('0.01');
    expect(resultado.valorTotal).toBe('0.31');
  });

  it('retorna todos os dados do cálculo', () => {
    const resultado = calcularJurosAtraso({
      valor: 100,
      dataVencimento: '2026-03-07',
      dataReferencia: REFERENCIA,
    });

    expect(resultado).toEqual({
      valorOriginal: '100.00',
      dataVencimento: '2026-03-07',
      dataCalculo: REFERENCIA,
      diasAtraso: 3,
      percentualAplicado: '2,5% ao dia',
      valorJuros: '7.50',
      valorTotal: '107.50',
    });
  });

  it('aceita o clock injetado quando a data de referência é omitida', () => {
    const resultado = calcularJurosAtraso(
      { valor: 100, dataVencimento: '2026-03-08' },
      () => new Date(2026, 2, 10, 15, 30),
    );

    expect(resultado.dataCalculo).toBe(REFERENCIA);
    expect(resultado.diasAtraso).toBe(2);
    expect(resultado.valorTotal).toBe('105.00');
  });

  it('atraso que atravessa a virada do mês', () => {
    const resultado = calcularJurosAtraso({
      valor: 200,
      dataVencimento: '2026-01-31',
      dataReferencia: REFERENCIA,
    });

    expect(resultado.diasAtraso).toBe(38);
    expect(resultado.valorJuros).toBe('190.00');
    expect(resultado.valorTotal).toBe('390.00');
  });
});

/**
 * Regressão do bug: a pergunta "Data de referência (Enter = hoje)" devolve uma
 * string **vazia** quando o usuário aperta ENTER, e a string vazia não pode ser
 * tratada como uma data.
 */
describe('Exercício 3 - Data de referência digitada pelo usuário', () => {
  it('data de referência vazia (ENTER puro) usa a data de hoje', () => {
    const resultado = calcularJurosAtraso(
      { valor: 100, dataVencimento: '2026-03-08', dataReferencia: '' },
      CLOCK_FIXO,
    );

    expect(resultado.dataCalculo).toBe(REFERENCIA);
    expect(resultado.diasAtraso).toBe(2);
    expect(resultado.valorJuros).toBe('5.00');
    expect(resultado.valorTotal).toBe('105.00');
  });

  it('data de referência só com espaços também usa a data de hoje', () => {
    const resultado = calcularJurosAtraso(
      { valor: 100, dataVencimento: '2026-03-08', dataReferencia: '   ' },
      CLOCK_FIXO,
    );

    expect(resultado.dataCalculo).toBe(REFERENCIA);
    expect(resultado.diasAtraso).toBe(2);
  });

  it('data de referência vazia não lança erro nenhum', () => {
    expect(() =>
      calcularJurosAtraso(
        { valor: 100, dataVencimento: '2026-03-08', dataReferencia: '' },
        CLOCK_FIXO,
      ),
    ).not.toThrow();
  });

  it('data de referência válida é usada como informada', () => {
    const resultado = calcularJurosAtraso(
      { valor: 100, dataVencimento: '2026-03-01', dataReferencia: '2026-03-11' },
      CLOCK_FIXO,
    );

    expect(resultado.dataCalculo).toBe('2026-03-11');
    expect(resultado.diasAtraso).toBe(10);
    expect(resultado.valorJuros).toBe('25.00');
    expect(resultado.valorTotal).toBe('125.00');
  });

  it('data de referência inválida gera erro claro, sem erro técnico', () => {
    expect(() =>
      calcularJurosAtraso(
        { valor: 100, dataVencimento: '2026-03-08', dataReferencia: '10/03/2026' },
        CLOCK_FIXO,
      ),
    ).toThrowError(/Data inválida: "10\/03\/2026"\. Use o formato yyyy-MM-dd\./);
  });

  it('nenhum erro técnico da biblioteca vaza para o usuário', () => {
    for (const dataReferencia of ['', '   ', '10/03/2026', '2026-13-40']) {
      try {
        calcularJurosAtraso(
          { valor: 100, dataVencimento: '2026-03-08', dataReferencia },
          CLOCK_FIXO,
        );
      } catch (erro) {
        expect((erro as Error).message).not.toMatch(/DecimalError|Invalid argument/);
        expect((erro as Error).name).not.toBe('DecimalError');
      }
    }
  });

  it('valor vazio ou não numérico gera erro claro em vez de DecimalError', () => {
    for (const valor of ['', '   ', 'abc', '1.000,00']) {
      expect(() =>
        calcularJurosAtraso(
          { valor, dataVencimento: '2026-03-08', dataReferencia: REFERENCIA },
          CLOCK_FIXO,
        ),
      ).toThrowError(/^Valor inválido: ".*"\. Informe um número, ex: 100,00\.$/);
    }
  });
});

/**
 * Reproduz o fluxo real da opção 3: as mesmas três perguntas alimentadas pelo
 * `Prompt`, com a linha da data de referência deixada em branco.
 */
describe('Exercício 3 - Perguntas interativas do cálculo', () => {
  async function fazerPerguntas(
    linhas: string[],
  ): Promise<{ valor: string; vencimento: string; referencia: string }> {
    const entrada = new PassThrough();
    const saida = new PassThrough();
    saida.resume();

    const prompt = new Prompt(
      entrada as unknown as NodeJS.ReadableStream,
      saida as unknown as NodeJS.WritableStream,
    );

    try {
      const pendencias = [
        prompt.perguntarTexto('Valor (ex: 100,00): '),
        prompt.perguntarTexto('Data de vencimento (yyyy-MM-dd): '),
        prompt.perguntarTexto('Data de referência (Enter = hoje, yyyy-MM-dd): '),
      ];

      for (const linha of linhas) {
        entrada.write(`${linha}\n`);
      }
      entrada.end();

      const [valor, vencimento, referencia] = await Promise.all(pendencias);
      return {
        valor: (valor as string).replace(',', '.'),
        vencimento: vencimento as string,
        referencia: referencia as string,
      };
    } finally {
      prompt.close();
    }
  }

  it('ENTER na data de referência devolve vazio e o cálculo usa hoje', async () => {
    const { valor, vencimento, referencia } = await fazerPerguntas([
      '100,00',
      '2026-03-08',
      '',
    ]);

    expect(referencia).toBe('');

    const resultado = calcularJurosAtraso(
      { valor, dataVencimento: vencimento, dataReferencia: referencia },
      CLOCK_FIXO,
    );

    expect(resultado.dataCalculo).toBe(REFERENCIA);
    expect(resultado.diasAtraso).toBe(2);
    expect(resultado.valorTotal).toBe('105.00');
  });

  it('data de referência válida digitada continua sendo usada', async () => {
    const { valor, vencimento, referencia } = await fazerPerguntas([
      '100,00',
      '2026-03-08',
      '2026-03-10',
    ]);

    const resultado = calcularJurosAtraso(
      { valor, dataVencimento: vencimento, dataReferencia: referencia },
      CLOCK_FIXO,
    );

    expect(resultado.dataCalculo).toBe(REFERENCIA);
    expect(resultado.diasAtraso).toBe(2);
    expect(resultado.valorTotal).toBe('105.00');
  });

  it('data de referência inválida digitada é recusada com mensagem clara', async () => {
    const { valor, vencimento, referencia } = await fazerPerguntas([
      '100,00',
      '2026-03-08',
      '10/03/2026',
    ]);

    expect(() =>
      calcularJurosAtraso(
        { valor, dataVencimento: vencimento, dataReferencia: referencia },
        CLOCK_FIXO,
      ),
    ).toThrowError(/Data inválida: "10\/03\/2026"\. Use o formato yyyy-MM-dd\./);
  });
});
