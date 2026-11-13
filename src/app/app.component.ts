import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { LearningData, QuizMinutes, QuizResult, WordList, emptyLearningData } from './learning-data';
import { LearningStore } from './learning-store.service';
import { parseCommaSeparatedPairs } from './pair-input';
import { QuizMistake, QuizSession } from './quiz-session';
import { resultPercent, resultRatio } from './result-scoring';
import { StudentState } from './student';
import { StudentStore } from './student-store.service';

type View = 'students' | 'lists' | 'new-list' | 'edit' | 'ready' | 'quiz' | 'results';

@Component({ selector: 'app-root', standalone: true, imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule], templateUrl: './app.component.html' })
export class AppComponent implements OnDestroy {
  @ViewChild('answerInput') private answerInput?: ElementRef<HTMLInputElement>;
  view: View = 'students';
  students: StudentState = { version: 1, students: [], selectedStudentId: null };
  data: LearningData = emptyLearningData();
  storageAvailable = false;
  error = '';
  notice = '';
  studentName = '';
  listName = '';
  languageA = 'Lietuvių';
  languageB = 'Anglų';
  bulkWordsA = '';
  bulkWordsB = '';
  addedPairsCount = 0;
  detailsExpanded = false;
  statisticsTab: 'all' | 'personal' | null = null;
  selectedMinutes: QuizMinutes = 5;
  readonly durationOptions: QuizMinutes[] = [1, 3, 5];
  answerText = '';
  listId: string | null = null;
  session: QuizSession | null = null;
  result: QuizResult | null = null;
  finishedMistakes: QuizMistake[] = [];
  remainingMs = 300000;
  feedbackKind: 'correct' | 'incorrect' | null = null;
  private clock: ReturnType<typeof setInterval> | null = null;
  private feedbackClock: ReturnType<typeof setTimeout> | null = null;
  private audioContext: AudioContext | null = null;
  private lastCountdownSecond = 4;

  constructor(private readonly studentStore: StudentStore, private readonly learningStore: LearningStore, private readonly changeDetector: ChangeDetectorRef) { this.reload(); }

  get student() { return this.students.students.find(item => item.id === this.students.selectedStudentId); }
  get lists(): WordList[] { return this.data.lists.filter(item => item.studentId === this.student?.id); }
  get list(): WordList | undefined { return this.data.lists.find(item => item.id === this.listId && item.studentId === this.student?.id); }
  get studentResults(): QuizResult[] { return this.data.results.filter(item => item.studentId === this.student?.id).reverse(); }
  get bestResults(): QuizResult[] {
    const best = new Map<string, QuizResult>();
    for (const result of this.studentResults) {
      if (result.correct < 10) continue;
      const key = JSON.stringify([result.listId, result.durationMinutes ?? null]);
      const current = best.get(key);
      if (!current || resultRatio(result, 'main') > resultRatio(current, 'main') ||
          (resultRatio(result, 'main') === resultRatio(current, 'main') && result.correct > current.correct)) {
        best.set(key, result);
      }
    }
    return [...best.values()];
  }
  get displayedResults(): QuizResult[] { return this.statisticsTab === 'all' ? this.studentResults : this.bestResults; }
  mainPercent(result: QuizResult): number { return resultPercent(result, 'main'); }
  personalPercent(result: QuizResult): number { return resultPercent(result, 'personal'); }
  listNameForResult(result: QuizResult): string { return this.data.lists.find(list => list.id === result.listId)?.name ?? 'Sąrašas'; }
  get remainingSeconds(): number { return Math.ceil(this.remainingMs / 1000); }
  get remainingClock(): string { return `${Math.floor(this.remainingSeconds / 60)}:${String(this.remainingSeconds % 60).padStart(2, '0')}`; }
  get questionWord(): string { return this.session?.question() ?? ''; }

  reload(): void {
    try {
      this.students = this.studentStore.load();
      this.data = this.learningStore.load();
      this.storageAvailable = true;
      this.error = '';
    } catch {
      this.storageAvailable = false;
      this.error = 'Nepavyko perskaityti vietinių duomenų. Patikrink naršyklės saugyklą ir bandyk dar kartą.';
    }
  }

  addStudent(): void {
    if (!this.studentName.trim() || !this.storageAvailable) return;
    try {
      this.students = this.studentStore.add(this.students, this.studentName);
      this.studentName = '';
      this.error = '';
      this.view = 'lists';
    } catch { this.saveError(); }
  }

  selectStudent(id: string): void {
    try { this.students = this.studentStore.select(this.students, id); this.error = ''; this.view = 'lists'; }
    catch { this.saveError(); }
  }

  showNewList(): void {
    this.listName = '';
    this.languageA = 'Lietuvių';
    this.languageB = 'Anglų';
    this.view = 'new-list';
    this.error = '';
  }

  createList(): void {
    if (!this.student) return;
    try {
      const created = this.learningStore.createList(this.data, this.student.id, this.listName, this.languageA, this.languageB);
      this.data = created.data;
      this.listId = created.list.id;
      this.addedPairsCount = 0;
      this.detailsExpanded = false;
      this.view = 'edit';
      this.error = '';
      this.notice = '';
    } catch { this.saveError(); }
  }

  openList(id: string): void { this.listId = id; this.error = ''; this.view = 'ready'; }

  editList(): void {
    if (!this.list) return;
    this.listName = this.list.name;
    this.languageA = this.list.languageA;
    this.languageB = this.list.languageB;
    this.bulkWordsA = '';
    this.bulkWordsB = '';
    this.addedPairsCount = 0;
    this.detailsExpanded = false;
    this.error = '';
    this.notice = '';
    this.view = 'edit';
  }

  saveListDetails(): void {
    if (!this.listId) return;
    try {
      this.data = this.learningStore.updateList(this.data, this.listId, { name: this.listName, languageA: this.languageA, languageB: this.languageB });
      this.notice = 'Sąrašas išsaugotas.';
      this.error = '';
      this.detailsExpanded = false;
    } catch { this.saveError(); }
  }

  toggleDetails(): void {
    if (!this.detailsExpanded && this.list) {
      this.listName = this.list.name;
      this.languageA = this.list.languageA;
      this.languageB = this.list.languageB;
    }
    this.detailsExpanded = !this.detailsExpanded;
    this.error = '';
  }

  addBulkPairs(): void {
    if (!this.listId) return;
    let entries;
    try { entries = parseCommaSeparatedPairs(this.bulkWordsA, this.bulkWordsB); }
    catch (error) { this.error = error instanceof Error ? error.message : 'Nepavyko perskaityti žodžių.'; return; }
    try {
      this.data = this.learningStore.addPairs(this.data, this.listId, entries);
      this.bulkWordsA = '';
      this.bulkWordsB = '';
      this.error = '';
      this.notice = '';
      this.addedPairsCount += entries.length;
    } catch { this.saveError(); }
  }

  deletePair(id: string): void {
    if (!this.listId) return;
    try { this.data = this.learningStore.deletePair(this.data, this.listId, id); this.error = ''; }
    catch { this.saveError(); }
  }

  swapDirection(): void {
    if (!this.list) return;
    try {
      this.data = this.learningStore.setDirection(this.data, this.list.id, this.list.direction === 'a-to-b' ? 'b-to-a' : 'a-to-b');
      this.error = '';
    } catch { this.saveError(); }
  }

  deleteList(): void {
    if (!this.listId || !window.confirm('Ištrinti sąrašą, visas jo poras ir rezultatus?')) return;
    try { this.data = this.learningStore.deleteList(this.data, this.listId); this.listId = null; this.error = ''; this.view = 'lists'; }
    catch { this.saveError(); }
  }

  startQuiz(): void {
    if (!this.list?.pairs.length) return;
    this.stopClock();
    this.prepareCountdownAudio();
    this.lastCountdownSecond = 4;
    this.session = new QuizSession(this.list, Date.now(), Math.random, this.selectedMinutes);
    this.remainingMs = this.selectedMinutes * 60000;
    this.answerText = '';
    this.result = null;
    this.finishedMistakes = [];
    this.error = '';
    this.view = 'quiz';
    this.changeDetector.detectChanges();
    this.focusAnswer();
    this.clock = setInterval(() => this.tick(), 100);
  }

  answer(): void {
    if (!this.session) return;
    if (this.session.remaining() === 0) { this.finishQuiz(); return; }
    const correct = this.session.answer(this.answerText);
    if (correct === null) return;
    this.answerText = '';
    this.showFeedback(correct ? 'correct' : 'incorrect');
  }

  onAnswerEnter(event: Event): void {
    if ((event as KeyboardEvent).isComposing) return;
    event.preventDefault();
    if (this.answerText.trim()) this.answer();
    else this.skip();
  }

  skip(): void {
    if (!this.session) return;
    if (this.session.remaining() === 0) { this.finishQuiz(); return; }
    if (!this.session.skip()) return;
    this.answerText = '';
    this.showFeedback('incorrect');
  }

  leaveQuiz(): void {
    this.stopClock();
    this.session = null;
    this.answerText = '';
    this.feedbackKind = null;
    this.view = 'lists';
  }

  retrySave(): void {
    if (this.session && this.remainingMs === 0) this.finishQuiz();
  }

  ngOnDestroy(): void {
    this.stopClock();
    if (this.audioContext) void this.audioContext.close();
  }

  private tick(): void {
    if (!this.session) return;
    this.remainingMs = this.session.remaining();
    if (this.remainingMs === 0) this.finishQuiz();
    else this.playCountdownBeep(this.remainingSeconds);
    this.changeDetector.detectChanges();
  }

  private prepareCountdownAudio(): void {
    try {
      this.audioContext ??= new window.AudioContext();
      if (this.audioContext.state === 'suspended') void this.audioContext.resume().catch(() => {});
    } catch { this.audioContext = null; }
  }

  private playCountdownBeep(second: number): void {
    if (second !== 0 && second !== 10 && (second < 1 || second > 3)) return;
    if (second === this.lastCountdownSecond) return;
    this.lastCountdownSecond = second;
    const audio = this.audioContext;
    if (!audio || audio.state !== 'running') return;
    const oscillator = audio.createOscillator();
    const volume = audio.createGain();
    const now = audio.currentTime;
    const duration = second === 0 ? 0.5 : 0.16;
    oscillator.type = 'sine';
    oscillator.frequency.value = second === 0 ? 330 : second === 10 ? 440 : 660;
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(0.04, now + 0.015);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(volume);
    volume.connect(audio.destination);
    oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }

  private focusAnswer(): void {
    this.answerInput?.nativeElement.focus();
  }

  private showFeedback(kind: 'correct' | 'incorrect'): void {
    if (this.feedbackClock) clearTimeout(this.feedbackClock);
    this.feedbackKind = kind;
    this.focusAnswer();
    this.feedbackClock = setTimeout(() => {
      this.feedbackKind = null;
      this.feedbackClock = null;
      this.changeDetector.detectChanges();
    }, 300);
  }

  private finishQuiz(): void {
    const session = this.session;
    if (!session || !this.student) return;
    this.playCountdownBeep(0);
    this.stopClock();
    this.remainingMs = 0;
    try {
      const completed = this.learningStore.completeRound(this.data, session.list.id, this.student.id, session.streaks, session.counts, session.durationMinutes, session.attempts);
      this.data = completed.data;
      this.result = completed.result;
      this.finishedMistakes = [...session.mistakes];
      this.session = null;
      this.feedbackKind = null;
      this.view = 'results';
      this.error = '';
    } catch {
      this.error = 'Raundas baigėsi, bet rezultato nepavyko išsaugoti. Patikrink naršyklės saugyklą.';
      this.view = 'quiz';
    }
  }

  private stopClock(): void {
    if (this.clock) clearInterval(this.clock);
    if (this.feedbackClock) clearTimeout(this.feedbackClock);
    this.clock = null;
    this.feedbackClock = null;
  }

  private saveError(): void { this.error = 'Nepavyko išsaugoti duomenų. Patikrink naršyklės saugyklą ir bandyk dar kartą.'; }
}
