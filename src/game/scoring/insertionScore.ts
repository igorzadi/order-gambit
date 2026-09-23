/** Score is awarded once, when an insertion succeeds. */
export function calculateInsertionScore(errors: number): number {
  if (!Number.isInteger(errors) || errors < 0) {
    throw new RangeError('A quantidade de erros deve ser um inteiro não negativo.')
  }
  return errors === 0 ? 100 : errors === 1 ? 75 : 50
}
