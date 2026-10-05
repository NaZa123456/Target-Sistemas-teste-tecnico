/**
 * Main menu - single entry point that exposes the three exercises.
 *
 * The menu only routes the choice; the actual flows live in `exercicio1.ts`,
 * `exercicio2.ts` and `exercicio3.ts`, which are also runnable on their own.
 * A single `Prompt` instance is shared so the same session keeps its input
 * stream while navigating between exercises.
 */

import { executarExercicio1 } from './exercicio1';
import { executarExercicio2 } from './exercicio2';
import { mostrarResultado } from './exercicio3';
import { calcularJurosAtraso } from './exercicio3-juros';
import { hojeIso } from './relogio';
import { Prompt } from './utils/prompt';

const MENU = [
  '=== DESAFIO TÉCNICO TARGET ===',
  '',
  '  1) Exercício 1 - Cálculo de comissão',
  '  2) Exercício 2 - Controle de estoque',
  '  3) Exercício 3 - Juros por atraso (2,5% ao dia)',
  '  0) Sair',
  '',
].join('\n');

/**
 * Asks for a single late-payment calculation.
 *
 * The reference date is optional on purpose: when the user leaves it empty the
 * current date is used, which is the normal (non-test) behaviour.
 */
async function executarJurosInterativo(prompt: Prompt): Promise<void> {
  console.log('');
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
}

async function main(): Promise<void> {
  const prompt = new Prompt();

  try {
    while (true) {
      console.log(MENU);
      const opcao = await prompt.perguntarTexto('Escolha uma opção: ');
      console.log('');

      switch (opcao) {
        case '1':
          executarExercicio1();
          break;
        case '2':
          await executarExercicio2(prompt);
          break;
        case '3':
          await executarJurosInterativo(prompt);
          break;
        case '0':
          console.log('Até logo!');
          return;
        default:
          console.log('Opção inválida.');
      }
    }
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
