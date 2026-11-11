export interface PairInput { a: string; b: string }

export function parseCommaSeparatedPairs(first: string, second: string): PairInput[] {
  const a = first.split(',').map(word => word.trim());
  const b = second.split(',').map(word => word.trim());
  if (!first.trim() || !second.trim()) throw new Error('Įrašyk žodžius abiem kalbomis.');
  if (a.some(word => !word) || b.some(word => !word)) throw new Error('Tarp kablelių negali būti tuščių žodžių.');
  if (a.length !== b.length) throw new Error('Abiejose kalbose turi būti vienodas žodžių skaičius.');
  if (a.some(word => word.length > 100) || b.some(word => word.length > 100)) throw new Error('Vienas žodis gali būti iki 100 simbolių.');
  if (a.length > 100) throw new Error('Vienu kartu galima pridėti iki 100 porų.');
  return a.map((word, index) => ({ a: word, b: b[index] }));
}
