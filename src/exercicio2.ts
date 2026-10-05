/**
 * Exercise 2 - stock control: console interface.
 *
 * This file owns only the interaction (reading input and printing output).
 * The stock rules live in `exercicio2-estoque.ts` and the JSON reading /
 * validation in `exercicio2-dados.ts`, so the business rules stay reusable
 * from another interface (e.g. an HTTP API) without any change.
 */

import { CAMINHO_PADRAO_ESTOQUE, carregarEstoque } from './exercicio2-dados';
import { ServicoEstoque } from './exercicio2-estoque';
import { ErroEstoque } from './exercicio2-tipos';
import type { TipoMovimentacao } from './exercicio2-tipos';
import { Prompt } from './utils/prompt';

const MENU_ESTOQUE = [
  '',
  'O que deseja fazer?',
  '  1) Registrar movimentação',
  '  2) Consultar estoque',
  '  3) Histórico de movimentações',
  '  0) Sair',
  'Opção: ',
].join('\n');

export function mostrarEstoque(servico: ServicoEstoque): void {
  console.log('--- Estoque atual ---');
  for (const produto of servico.listarEstoque()) {
    console.log(
      `  [${produto.codigoProduto}] ${produto.descricaoProduto.padEnd(30)} ${String(produto.estoque).padStart(6)} un.`,
    );
  }
}

export function mostrarHistorico(servico: ServicoEstoque): void {
  const historico = servico.listarMovimentacoes();

  console.log('--- Histórico de movimentações ---');
  if (historico.length === 0) {
    console.log('  Nenhuma movimentação registrada.');
    return;
  }

  for (const movimentacao of historico) {
    console.log(
      `  #${String(movimentacao.id).padStart(3)} | ${movimentacao.tipo.padEnd(7)} | prod ${movimentacao.codigoProduto} | ` +
        `${String(movimentacao.quantidade).padStart(5)} un. | saldo ${String(movimentacao.estoqueFinal).padStart(6)} | ` +
        `${movimentacao.descricaoMovimentacao} | ${movimentacao.dataHora}`,
    );
  }
}

/**
 * Runs the interactive stock session against an existing prompt.
 *
 * Accepting the prompt as a parameter (instead of creating its own) lets the
 * main menu reuse this exact flow, so both entry points behave identically
 * and the logic is not duplicated. Returns when the user chooses to exit.
 */
export async function executarExercicio2(prompt: Prompt): Promise<void> {
  const servico = new ServicoEstoque(carregarEstoque(CAMINHO_PADRAO_ESTOQUE));

  console.log('--- Estoque inicial ---');
  mostrarEstoque(servico);

  while (true) {
    const opcao = await prompt.perguntarTexto(MENU_ESTOQUE);
    if (opcao === '0') break;

    switch (opcao) {
      case '1': {
        const codigo = await prompt.perguntarNumero('Código do produto: ');
        const descricao = await prompt.perguntarTexto('Descrição da movimentação: ');
        const tipo = (await prompt.perguntarTexto('Tipo (ENTRADA/SAIDA): ')).toUpperCase() as TipoMovimentacao;
        const quantidade = await prompt.perguntarNumero('Quantidade: ');

        try {
          const movimentacao = servico.registrarMovimentacao({
            codigoProduto: codigo,
            descricaoMovimentacao: descricao,
            tipo,
            quantidade,
          });
          console.log(
            `\nMovimentação #${movimentacao.id} registrada. Estoque final do produto ${movimentacao.codigoProduto}: ${movimentacao.estoqueFinal} un.`,
          );
        } catch (erro) {
          // Domain errors are expected outcomes here, so they are reported to
          // the user instead of interrupting the session.
          if (erro instanceof ErroEstoque) console.error(`\nOperação recusada: ${erro.message}`);
          else throw erro;
        }
        break;
      }

      case '2': {
        const codigo = await prompt.perguntarNumero('Código do produto: ');
        try {
          const produto = servico.consultarEstoque(codigo);
          console.log(`\n${produto.descricaoProduto}: ${produto.estoque} un.`);
        } catch (erro) {
          if (erro instanceof ErroEstoque) console.error(`\nOperação recusada: ${erro.message}`);
          else throw erro;
        }
        break;
      }

      case '3':
        console.log('');
        mostrarHistorico(servico);
        break;

      default:
        console.log('\nOpção inválida.');
    }

    // The current stock is reprinted after every action so the user always
    // sees the effect of the operation, including refused ones.
    console.log('');
    mostrarEstoque(servico);
  }

  console.log('');
  mostrarHistorico(servico);
}

async function main(): Promise<void> {
  const prompt = new Prompt();

  try {
    console.log('=== EXERCÍCIO 2 - CONTROLE DE ESTOQUE ===');
    await executarExercicio2(prompt);
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
