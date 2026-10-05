import { CAMINHO_PADRAO_VENDAS, carregarVendas } from './exercicio1-dados';
import { calcularComissoesPorVenda, calcularComissoesPorVendedor } from './exercicio1-comissao';
import { Prompt } from './utils/prompt';

export function executarExercicio1(caminho: string = CAMINHO_PADRAO_VENDAS): void {
  const { vendas } = carregarVendas(caminho);
  const totais = calcularComissoesPorVendedor(vendas);
  const porVenda = calcularComissoesPorVenda(vendas);

  console.log('=== EXERCÍCIO 1 - CÁLCULO DE COMISSÃO ===');
  console.log(`Arquivo lido   : ${caminho}`);
  console.log(`Total de vendas: ${vendas.length}`);
  console.log('');

  console.log('--- Comissão total por vendedor ---');
  for (const total of totais) {
    console.log(`  ${total.vendedor}`);
    console.log(`    Vendas ............: ${total.quantidadeVendas}`);
    console.log(`    Comissão total ....: R$ ${total.totalComissao}`);
  }
  console.log('');

  console.log('--- Detalhamento por venda ---');
  for (const item of porVenda) {
    console.log(
      `  ${item.vendedor.padEnd(16)} R$ ${item.valorVenda.padStart(8)}  ->  ${String(item.percentual).padStart(2)}%  ->  R$ ${item.comissao}`,
    );
  }
}

async function main(): Promise<void> {
  const prompt = new Prompt();
  try {
    const caminho = await prompt.perguntarTexto(
      'Caminho do vendas.json (Enter para o padrão src/data/vendas.json): ',
    );
    executarExercicio1(caminho || CAMINHO_PADRAO_VENDAS);
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
