import { QuizAttempt, QuizResult } from './learning-data';

export type ResultFormula = 'main' | 'personal';

export function attemptWeight(attempt: QuizAttempt, formula: ResultFormula): number {
  const lengthBonus = attempt.expectedLength > 20 ? 1 : attempt.expectedLength >= 10 ? 0.5 : 0;
  return (formula === 'personal' ? 1 / Math.min(attempt.index, 6) : 1) + lengthBonus;
}

export function resultRatio(result: QuizResult, formula: ResultFormula): number {
  const attempts = result.attempts;
  const total = attempts.reduce((sum, attempt) => sum + attemptWeight(attempt, formula), 0);
  if (!total) return 0;
  const correct = attempts.reduce((sum, attempt) => sum + (attempt.outcome === 'correct' ? attemptWeight(attempt, formula) : 0), 0);
  return correct / total;
}

export function resultPercent(result: QuizResult, formula: ResultFormula): number {
  return Math.round(resultRatio(result, formula) * 100);
}
