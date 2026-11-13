import { Direction, QuizAttempt, QuizMinutes, WordList, WordPair } from './learning-data';

export interface QuizCounts { correct: number; incorrect: number; skipped: number }
export interface QuizMistake { entered: string; expected: string }
const weights = [12, 8, 5, 3, 2, 1];

export function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('lt');
}

export function choosePair(pairs: WordPair[], streaks: ReadonlyMap<string, number>, previousId: string | null, random = Math.random): WordPair {
  if (!pairs.length) throw new Error('A quiz needs at least one word pair');
  const weighted = pairs.map(pair => weights[Math.min(streaks.get(pair.id) ?? pair.streak, 5)] * (pairs.length > 1 && pair.id === previousId ? 0.35 : 1));
  let draw = random() * weighted.reduce((total, weight) => total + weight, 0);
  for (let index = 0; index < pairs.length; index++) {
    draw -= weighted[index];
    if (draw < 0) return pairs[index];
  }
  return pairs[pairs.length - 1];
}

export class QuizSession {
  readonly streaks: Map<string, number>;
  readonly counts: QuizCounts = { correct: 0, incorrect: 0, skipped: 0 };
  readonly mistakes: QuizMistake[] = [];
  readonly attempts: QuizAttempt[] = [];
  readonly startedAt: number;
  current: WordPair;
  private previousId: string | null = null;

  constructor(readonly list: WordList, now = Date.now(), private readonly random = Math.random, readonly durationMinutes: QuizMinutes = 1) {
    this.streaks = new Map(list.pairs.map(pair => [pair.id, pair.streak]));
    this.startedAt = now;
    this.current = choosePair(list.pairs, this.streaks, null, random);
  }

  remaining(now = Date.now()): number {
    return Math.max(0, this.durationMinutes * 60000 - (now - this.startedAt));
  }

  question(pair = this.current): string { return this.list.direction === 'a-to-b' ? pair.a : pair.b; }
  expected(pair = this.current): string { return this.list.direction === 'a-to-b' ? pair.b : pair.a; }
  questionLanguage(): string { return this.list.direction === 'a-to-b' ? this.list.languageA : this.list.languageB; }
  answerLanguage(): string { return this.list.direction === 'a-to-b' ? this.list.languageB : this.list.languageA; }

  answer(value: string, now = Date.now()): boolean | null {
    if (this.remaining(now) === 0 || !value.trim()) return null;
    const correct = normalizeAnswer(value) === normalizeAnswer(this.expected());
    this.counts[correct ? 'correct' : 'incorrect']++;
    if (!correct) this.mistakes.unshift({ entered: value.trim(), expected: this.expected() });
    this.recordAttempt(correct ? 'correct' : 'incorrect');
    this.advance(correct);
    return correct;
  }

  skip(now = Date.now()): boolean {
    if (this.remaining(now) === 0) return false;
    this.counts.skipped++;
    this.mistakes.unshift({ entered: '', expected: this.expected() });
    this.recordAttempt('skipped');
    this.advance(false);
    return true;
  }

  private advance(correct: boolean): void {
    const previous = this.current;
    const streak = this.streaks.get(previous.id) ?? previous.streak;
    this.streaks.set(previous.id, correct ? streak + 1 : Math.max(0, streak - 1));
    this.previousId = previous.id;
    this.current = choosePair(this.list.pairs, this.streaks, this.previousId, this.random);
  }

  private recordAttempt(outcome: QuizAttempt['outcome']): void {
    this.attempts.push({
      outcome,
      index: (this.streaks.get(this.current.id) ?? this.current.streak) + 1,
      promptLength: Array.from(this.question().trim()).length,
      expectedLength: Array.from(this.expected().trim()).length
    });
  }
}
