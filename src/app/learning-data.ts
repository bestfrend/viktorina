export type Direction = 'a-to-b' | 'b-to-a';

export interface WordPair {
  id: string;
  a: string;
  b: string;
  streak: number;
}

export interface WordList {
  id: string;
  studentId: string;
  name: string;
  languageA: string;
  languageB: string;
  direction: Direction;
  pairs: WordPair[];
}

export interface QuizResult {
  id: string;
  studentId: string;
  listId: string;
  finishedAt: string;
  correct: number;
  incorrect: number;
  skipped: number;
}

export interface LearningData {
  version: 1;
  lists: WordList[];
  results: QuizResult[];
}

export const emptyLearningData = (): LearningData => ({ version: 1, lists: [], results: [] });

export function makeId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
