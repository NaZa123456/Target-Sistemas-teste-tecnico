/**
 * Thin input layer shared by every interactive screen.
 *
 * `readline.question` is avoided on purpose. When stdin is not a TTY (piped or
 * redirected input) it resolves a single question and the remaining lines are
 * dropped, which silently breaks scripted runs such as
 * `npx tsx src/exercicio2.ts < input.txt`.
 *
 * Instead, lines are consumed by a permanent `line` listener and queued, and
 * `perguntar` takes from that queue. The same code then works for a human at a
 * terminal and for an automated evaluation piping answers.
 */
import * as readline from 'node:readline';
import type { Interface } from 'node:readline';
import * as process from 'node:process';

export class Prompt {
  private readonly rl: Interface;
  /** Lines already read but not yet asked for. */
  private readonly linhas: string[] = [];
  /** Callbacks waiting for the next line to arrive. */
  private readonly esperas: Array<(linha: string) => void> = [];
  private encerrado = false;

  constructor(
    entrada: NodeJS.ReadableStream = process.stdin,
    private readonly saida: NodeJS.WritableStream = process.stdout,
  ) {
    this.rl = readline.createInterface({
      input: entrada,
      output: saida,
      // Echo only on a real terminal; piped input must not be echoed back.
      terminal: Boolean((entrada as NodeJS.ReadStream).isTTY),
    });

    this.rl.on('line', (linha) => {
      const resolver = this.esperas.shift();
      if (resolver) {
        resolver(linha);
      } else {
        this.linhas.push(linha);
      }
    });

    this.rl.on('close', () => {
      this.encerrado = true;
      // Release anyone still waiting, otherwise the process would hang forever
      // when the input ends before the expected number of answers.
      while (this.esperas.length > 0) {
        this.esperas.shift()?.('');
      }
    });
  }

  /** Writes the question and resolves with the next line (or '' if input ended). */
  async perguntar(texto: string): Promise<string> {
    this.saida.write(texto);

    const pronta = this.linhas.shift();
    if (pronta !== undefined) {
      return pronta;
    }

    if (this.encerrado) {
      return '';
    }

    return new Promise<string>((resolve) => {
      this.esperas.push(resolve);
    });
  }

  /** Asks a question and converts the answer to a number (NaN when invalid). */
  async perguntarNumero(texto: string): Promise<number> {
    return Number((await this.perguntar(texto)).trim());
  }

  /** Asks a question and returns the answer trimmed. */
  async perguntarTexto(texto: string): Promise<string> {
    return (await this.perguntar(texto)).trim();
  }

  close(): void {
    this.rl.close();
  }
}
