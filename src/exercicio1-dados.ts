/**
 * Exercise 1 - commission calculation: data loading.
 *
 * Isolated from the business rules so that reading the file (and validating
 * it) can be replaced without touching the commission logic. The default path
 * is resolved from `__dirname`, which keeps the program working both through
 * `tsx` (running from `src/`) and after a build (running from `dist/`).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { VendasJson } from './exercicio1-tipos';

export const CAMINHO_PADRAO_VENDAS = path.join(__dirname, 'data', 'vendas.json');

/**
 * Reads and validates the sales file.
 *
 * Failing fast with a descriptive message beats letting a malformed record
 * reach the calculation, where it would surface as a confusing `NaN`.
 *
 * @throws {Error} when the file is missing, is not valid JSON, or a record has
 * an invalid `vendedor` / `valor`.
 */
export function carregarVendas(caminho: string = CAMINHO_PADRAO_VENDAS): VendasJson {
  if (!fs.existsSync(caminho)) {
    throw new Error(`Arquivo de vendas não encontrado: ${caminho}`);
  }

  let dados: VendasJson;
  try {
    // Windows editors often save UTF-8 with a BOM, which JSON.parse rejects.
    const conteudo = fs.readFileSync(caminho, 'utf-8').replace(/^﻿/, '');
    dados = JSON.parse(conteudo) as VendasJson;
  } catch (erro) {
    throw new Error(`JSON inválido em ${caminho}: ${(erro as Error).message}`);
  }

  if (!Array.isArray(dados.vendas)) {
    throw new Error(`Arquivo inválido: propriedade "vendas" ausente ou não é uma lista (${caminho}).`);
  }

  dados.vendas.forEach((venda, indice) => {
    if (typeof venda.vendedor !== 'string' || venda.vendedor.trim() === '') {
      throw new Error(`Venda inválida na posição ${indice}: campo "vendedor" ausente.`);
    }
    if (typeof venda.valor !== 'number' || !Number.isFinite(venda.valor)) {
      throw new Error(`Venda inválida na posição ${indice}: campo "valor" deve ser numérico.`);
    }
  });

  return dados;
}
