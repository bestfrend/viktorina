import { Injectable } from '@angular/core';
import { Direction, LearningData, QuizMinutes, QuizResult, WordList, WordPair, emptyLearningData, makeId } from './learning-data';
import { PairInput } from './pair-input';

const STORAGE_KEY = 'zodziu-praktika.learning.v1';
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

@Injectable({ providedIn: 'root' })
export class LearningStore {
  load(): LearningData {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return emptyLearningData();
    const parsed: unknown = JSON.parse(raw);
    if (!this.isData(parsed)) throw new Error('Invalid learning data');
    return parsed;
  }

  save(data: LearningData): LearningData {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    if (localStorage.getItem(STORAGE_KEY) !== serialized) throw new Error('Learning data could not be verified');
    return data;
  }

  createList(data: LearningData, studentId: string, name: string, languageA: string, languageB: string): { data: LearningData; list: WordList } {
    const list: WordList = {
      id: makeId(), studentId, name: name.trim(), languageA: languageA.trim(), languageB: languageB.trim(),
      direction: 'a-to-b', pairs: []
    };
    if (![list.name, list.languageA, list.languageB].every(nonempty)) throw new Error('Missing list details');
    if (list.languageA.toLocaleLowerCase('lt') === list.languageB.toLocaleLowerCase('lt')) throw new Error('Languages must differ');
    return { data: this.save({ ...data, lists: [...data.lists, list] }), list };
  }

  updateList(data: LearningData, id: string, changes: Pick<WordList, 'name' | 'languageA' | 'languageB'>): LearningData {
    const name = changes.name.trim();
    const languageA = changes.languageA.trim();
    const languageB = changes.languageB.trim();
    if (![name, languageA, languageB].every(nonempty)) throw new Error('Missing list details');
    if (languageA.toLocaleLowerCase('lt') === languageB.toLocaleLowerCase('lt')) throw new Error('Languages must differ');
    return this.replaceList(data, id, list => ({ ...list, name, languageA, languageB }));
  }

  deleteList(data: LearningData, id: string): LearningData {
    if (!data.lists.some(list => list.id === id)) throw new Error('Unknown list');
    return this.save({ ...data, lists: data.lists.filter(list => list.id !== id), results: data.results.filter(result => result.listId !== id) });
  }

  addPair(data: LearningData, id: string, a: string, b: string): LearningData {
    return this.addPairs(data, id, [{ a, b }]);
  }

  addPairs(data: LearningData, id: string, entries: PairInput[]): LearningData {
    if (!entries.length || entries.length > 100 || entries.some(entry => !entry.a.trim() || !entry.b.trim() || entry.a.trim().length > 100 || entry.b.trim().length > 100)) {
      throw new Error('Invalid word pairs');
    }
    const pairs: WordPair[] = entries.map(entry => ({ id: makeId(), a: entry.a.trim(), b: entry.b.trim(), streak: 0 }));
    return this.replaceList(data, id, list => ({ ...list, pairs: [...list.pairs, ...pairs] }));
  }

  deletePair(data: LearningData, listId: string, pairId: string): LearningData {
    return this.replaceList(data, listId, list => {
      if (!list.pairs.some(pair => pair.id === pairId)) throw new Error('Unknown pair');
      return { ...list, pairs: list.pairs.filter(pair => pair.id !== pairId) };
    });
  }

  setDirection(data: LearningData, id: string, direction: Direction): LearningData {
    return this.replaceList(data, id, list => ({ ...list, direction }));
  }

  completeRound(data: LearningData, listId: string, studentId: string, streaks: ReadonlyMap<string, number>, counts: Pick<QuizResult, 'correct' | 'incorrect' | 'skipped'>, durationMinutes: QuizMinutes): { data: LearningData; result: QuizResult } {
    const list = data.lists.find(item => item.id === listId && item.studentId === studentId);
    if (!list) throw new Error('Unknown list');
    const result: QuizResult = { id: makeId(), listId, studentId, finishedAt: new Date().toISOString(), durationMinutes, ...counts };
    const lists = data.lists.map(item => item.id === listId ? {
      ...item, pairs: item.pairs.map(pair => ({ ...pair, streak: streaks.get(pair.id) ?? pair.streak }))
    } : item);
    return { data: this.save({ version: 1, lists, results: [...data.results, result] }), result };
  }

  private replaceList(data: LearningData, id: string, change: (list: WordList) => WordList): LearningData {
    if (!data.lists.some(list => list.id === id)) throw new Error('Unknown list');
    return this.save({ ...data, lists: data.lists.map(list => list.id === id ? change(list) : list) });
  }

  private isData(value: unknown): value is LearningData {
    if (!value || typeof value !== 'object') return false;
    const data = value as Record<string, unknown>;
    if (data['version'] !== 1 || !Array.isArray(data['lists']) || !Array.isArray(data['results'])) return false;
    const listIds = new Set<string>();
    for (const item of data['lists']) {
      if (!item || typeof item !== 'object') return false;
      const list = item as Record<string, unknown>;
      if (![list['id'], list['studentId'], list['name'], list['languageA'], list['languageB']].every(nonempty) ||
          !['a-to-b', 'b-to-a'].includes(String(list['direction'])) || !Array.isArray(list['pairs']) || listIds.has(list['id'] as string)) return false;
      listIds.add(list['id'] as string);
      const pairIds = new Set<string>();
      for (const entry of list['pairs']) {
        if (!entry || typeof entry !== 'object') return false;
        const pair = entry as Record<string, unknown>;
        if (![pair['id'], pair['a'], pair['b']].every(nonempty) || !count(pair['streak']) || pairIds.has(pair['id'] as string)) return false;
        pairIds.add(pair['id'] as string);
      }
    }
    return data['results'].every(entry => {
      if (!entry || typeof entry !== 'object') return false;
      const result = entry as Record<string, unknown>;
      return [result['id'], result['studentId'], result['listId'], result['finishedAt']].every(nonempty) &&
        (result['durationMinutes'] === undefined || [1, 3, 5].includes(result['durationMinutes'] as number)) &&
        [result['correct'], result['incorrect'], result['skipped']].every(count);
    });
  }
}
