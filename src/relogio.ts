/**
 * Date/time abstraction shared by the exercises that need "now".
 *
 * Keeping the clock behind a function (instead of calling `new Date()` inline)
 * is what allows the interest and stock tests to be fully deterministic: the
 * caller injects a fixed clock, so no assertion ever depends on the machine's
 * current date.
 */

export type Clock = () => Date;

export const relogioSistema: Clock = () => new Date();

/** Returns the current local day as an ISO `yyyy-MM-dd` string. */
export function hojeIso(clock: Clock = relogioSistema): string {
  const agora = clock();
  const ano = String(agora.getFullYear());
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Parses `yyyy-MM-dd` into a Date set at the start of that local day.
 *
 * Building the date from its parts (instead of `new Date('yyyy-MM-dd')`, which
 * is parsed as UTC) keeps the calculation on the local calendar. Without this,
 * users in negative UTC offsets would see the due date shifted by one day.
 */
export function paraDataLocal(iso: string): Date {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!partes) {
    throw new Error(`Data inválida: "${iso}". Use o formato yyyy-MM-dd.`);
  }

  const [, ano, mes, dia] = partes;
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}
