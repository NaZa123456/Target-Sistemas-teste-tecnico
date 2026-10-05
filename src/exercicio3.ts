import { calcularJurosAtraso } from './exercicio3-juros';
import type { ResultadoJuros } from './exercicio3-juros';
import { hojeIso } from './relogio';
import { Prompt } from './utils/prompt';

export function mostrarResultado(resultado: ResultadoJuros): void {
  console.log('--- Resultado ---');
  console.log(`  Valor original ...........: R$ ${resultado.valorOriginal}`);
  console.log(`  Data de vencimento .......: ${resultado.dataVencimento}`);
  console.log(`  Data utilizada no cálculo: ${resultado.dataCalculo}`);
  console.log(`  Dias em atraso ...........: ${resultado.diasAtraso}`);
  console.log(`  Percentual aplicado ......: ${resultado.percentualAplicado}`);
  console.log(`  Valor dos juros ..........: R$ ${resultado.valorJuros}`);
  console.log(`  Valor total atualizado ...: R$ ${resultado.valorTotal}`);
}

async function main(): Promise<void> {
  const prompt = new Prompt();

  try {
    console.log('=== EXERCÍCIO 3 - JUROS POR ATRASO (2,5% ao dia) ===');

    const valor = (await prompt.perguntarTexto('Valor (ex: 100,00): ')).replace(',', '.');
    const vencimento = await prompt.perguntarTexto('Data de vencimento (yyyy-MM-dd): ');
    const referencia = await prompt.perguntarTexto('Data de referência (Enter = hoje, yyyy-MM-dd): ');

    console.log('');
    mostrarResultado(
      calcularJurosAtraso({
        valor,
        dataVencimento: vencimento,
        dataReferencia: referencia || hojeIso(),
      }),
    );
  } finally {
    prompt.close();
  }
}

if (require.main === module) {
  main().catch((erro) => {
    console.error(`Erro: ${(erro as Error).message}`);
    process.exitCode = 1;
  });
}
