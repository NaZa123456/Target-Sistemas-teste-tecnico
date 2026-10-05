import * as fs from 'node:fs';
import * as path from 'node:path';

import type { EstoqueJson, Produto } from './exercicio2-tipos';

export const CAMINHO_PADRAO_ESTOQUE = path.join(__dirname, 'data', 'estoque.json');

/** Lê e valida o arquivo de estoque inicial. */
export function carregarEstoque(caminho: string = CAMINHO_PADRAO_ESTOQUE): Produto[] {
  if (!fs.existsSync(caminho)) {
    throw new Error(`Arquivo de estoque não encontrado: ${caminho}`);
  }

  let dados: EstoqueJson;
  try {
    // Remove o BOM que editores Windows costumam gravar em arquivos UTF-8.
    const conteudo = fs.readFileSync(caminho, 'utf-8').replace(/^﻿/, '');
    dados = JSON.parse(conteudo) as EstoqueJson;
  } catch (erro) {
    throw new Error(`JSON inválido em ${caminho}: ${(erro as Error).message}`);
  }

  if (!Array.isArray(dados.estoque)) {
    throw new Error(`Arquivo inválido: propriedade "estoque" ausente ou não é uma lista (${caminho}).`);
  }

  return dados.estoque;
}
