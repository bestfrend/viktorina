import assert from 'node:assert/strict';
import path from 'node:path';
import { build } from 'esbuild';

async function loadTypeScript(relative) {
  const result = await build({
    entryPoints: [path.resolve(relative)], bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: [{ name: 'angular-stub', setup(plugin) {
      plugin.onResolve({ filter: /^@angular\/core$/ }, () => ({ path: 'angular-core', namespace: 'test' }));
      plugin.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const Injectable = () => target => target;', loader: 'js' }));
    } }]
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

const { QuizSession, normalizeAnswer, choosePair } = await loadTypeScript('src/app/quiz-session.ts');
const { LearningStore } = await loadTypeScript('src/app/learning-store.service.ts');
const { attemptWeight, resultPercent } = await loadTypeScript('src/app/result-scoring.ts');
const { parseCommaSeparatedPairs } = await loadTypeScript('src/app/pair-input.ts');

assert.equal(normalizeAnswer('  ŽĄsis  '), 'zasis');
assert.equal(normalizeAnswer('KATĖ'), 'kate');
const list = { id: 'l1', studentId: 's1', name: 'Testas', languageA: 'Lietuvių', languageB: 'Anglų', direction: 'a-to-b', pairs: [{ id: 'p1', a: 'katė', b: 'cat', streak: 7 }] };
const session = new QuizSession(list, 1000, () => 0);
assert.equal(session.question(), 'katė');
assert.equal(session.remaining(61000), 0);
assert.equal(new QuizSession(list, 1000, () => 0, 3).remaining(61000), 120000);
assert.equal(new QuizSession(list, 1000, () => 0, 3).remaining(181000), 0);
assert.equal(new QuizSession(list, 1000, () => 0, 5).remaining(301000), 0);
assert.equal(session.answer('cat', 61000), null);
assert.equal(session.answer('wrong', 2000), false);
assert.equal(session.streaks.get('p1'), 6);
assert.equal(session.answer(' CAT ', 3000), true);
assert.equal(session.streaks.get('p1'), 7);
assert.equal(session.skip(4000), true);
assert.equal(session.streaks.get('p1'), 6);
assert.deepEqual(session.counts, { correct: 1, incorrect: 1, skipped: 1 });
assert.deepEqual(session.attempts.map(({ outcome, index, expectedLength }) => ({ outcome, index, expectedLength })), [
  { outcome: 'incorrect', index: 8, expectedLength: 3 },
  { outcome: 'correct', index: 7, expectedLength: 3 },
  { outcome: 'skipped', index: 8, expectedLength: 3 }
]);
assert.equal(attemptWeight({ outcome: 'correct', index: 9, promptLength: 1, expectedLength: 9 }, 'personal'), 1 / 6);
assert.equal(attemptWeight({ outcome: 'correct', index: 1, promptLength: 1, expectedLength: 10 }, 'main'), 1.5);
assert.equal(attemptWeight({ outcome: 'correct', index: 1, promptLength: 1, expectedLength: 20 }, 'main'), 1.5);
assert.equal(attemptWeight({ outcome: 'correct', index: 1, promptLength: 1, expectedLength: 21 }, 'main'), 2);
assert.equal(resultPercent({ attempts: [
  { outcome: 'correct', index: 1, promptLength: 1, expectedLength: 21 },
  { outcome: 'incorrect', index: 2, promptLength: 1, expectedLength: 10 },
  { outcome: 'skipped', index: 7, promptLength: 1, expectedLength: 9 }
] }, 'main'), 44);
assert.equal(resultPercent({ attempts: [
  { outcome: 'correct', index: 1, promptLength: 1, expectedLength: 21 },
  { outcome: 'incorrect', index: 2, promptLength: 1, expectedLength: 10 },
  { outcome: 'skipped', index: 7, promptLength: 1, expectedLength: 9 }
] }, 'personal'), 63);
assert.deepEqual(session.mistakes, [
  { entered: '', expected: 'cat' },
  { entered: 'wrong', expected: 'cat' }
]);
assert.equal(list.pairs[0].streak, 7, 'An unfinished round must not mutate saved pairs');
assert.equal(choosePair([{ id: 'a', streak: 0 }, { id: 'b', streak: 5 }], new Map([['a', 0], ['b', 5]]), 'a', () => 0.99).id, 'b');
assert.deepEqual(parseCommaSeparatedPairs('katė, namas', 'cat, house'), [{ a: 'katė', b: 'cat' }, { a: 'namas', b: 'house' }]);
assert.deepEqual(parseCommaSeparatedPairs('katė', 'cat'), [{ a: 'katė', b: 'cat' }]);
assert.throws(() => parseCommaSeparatedPairs('katė, namas', 'cat'), /vienodas žodžių skaičius/);
assert.throws(() => parseCommaSeparatedPairs('katė,', 'cat, house'), /tuščių žodžių/);

let stored = null;
let rejectWrites = false;
let writeCount = 0;
globalThis.localStorage = {
  getItem: () => stored,
  setItem: (_key, value) => { if (rejectWrites) throw new Error('quota'); writeCount++; stored = value; }
};
const store = new LearningStore();
let data = store.load();
const created = store.createList(data, 's1', 'Gyvūnai', 'Lietuvių', 'Anglų');
data = store.addPair(created.data, created.list.id, 'katė', 'cat');
assert.equal(store.load().lists[0].pairs.length, 1);
const beforeBatch = writeCount;
data = store.addPairs(data, created.list.id, parseCommaSeparatedPairs('šuo, obuolys', 'dog, apple'));
assert.equal(writeCount, beforeBatch + 1, 'A batch of pairs must be persisted in one write');
assert.equal(store.load().lists[0].pairs.length, 3);
assert.throws(() => store.createList(data, 's1', 'Kitas', 'Lietuvių', 'lietuvių'), /Languages must differ/);
const pairId = data.lists[0].pairs[0].id;
const savedAttempts = [
  { outcome: 'correct', index: 1, promptLength: 4, expectedLength: 3 },
  { outcome: 'incorrect', index: 2, promptLength: 4, expectedLength: 3 },
  { outcome: 'skipped', index: 1, promptLength: 4, expectedLength: 3 }
];
const done = store.completeRound(data, created.list.id, 's1', new Map([[pairId, 3]]), { correct: 1, incorrect: 1, skipped: 1 }, 3, savedAttempts);
assert.equal(done.data.lists[0].pairs[0].streak, 3);
assert.equal(store.load().results[0].correct, 1);
assert.equal(store.load().results[0].durationMinutes, 3);
assert.equal(store.load().results[0].mistakes, undefined, 'The quick-check list stays in the active round');
const oldResult = { ...done.result };
delete oldResult.attempts;
store.save({ ...done.data, results: [oldResult] });
assert.equal(store.load().results.length, 0, 'Old results without per-attempt data are removed');
assert.equal(store.load().lists.length, 1, 'Removing old results preserves lists and pairs');
store.save(done.data);
assert.equal(store.load().lists.filter(item => item.studentId === 's2').length, 0);
rejectWrites = true;
assert.throws(() => store.completeRound(done.data, created.list.id, 's1', new Map([[pairId, 4]]), { correct: 1, incorrect: 0, skipped: 0 }, 5, savedAttempts.slice(0, 1)), /quota/);
assert.equal(store.load().results.length, 1, 'Failed storage write must not claim a completed round');
console.log('Quiz timing, scoring, streaks, weighted choice and atomic local persistence passed');
