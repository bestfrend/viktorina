import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LearningData, QuizResult, WordList, emptyLearningData } from './learning-data';
import { LearningStore } from './learning-store.service';
import { QuizSession } from './quiz-session';
import { StudentState } from './student';
import { StudentStore } from './student-store.service';

type View = 'students' | 'lists' | 'new-list' | 'edit' | 'ready' | 'quiz' | 'results';

@Component({ selector: 'app-root', standalone: true, imports: [CommonModule, FormsModule, ButtonModule, InputTextModule], templateUrl: './app.component.html' })
export class AppComponent implements OnDestroy {
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
  wordA = '';
  wordB = '';
  answerText = '';
  listId: string | null = null;
  session: QuizSession | null = null;
  result: QuizResult | null = null;
  remainingMs = 60000;
  feedbackWord = '';
  feedbackKind: 'correct' | 'incorrect' | null = null;
  private clock: ReturnType<typeof setInterval> | null = null;
  private feedbackClock: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly studentStore: StudentStore, private readonly learningStore: LearningStore) { this.reload(); }

  get student() { return this.students.students.find(item => item.id === this.students.selectedStudentId); }
  get lists(): WordList[] { return this.data.lists.filter(item => item.studentId === this.student?.id); }
  get list(): WordList | undefined { return this.data.lists.find(item => item.id === this.listId && item.studentId === this.student?.id); }
  get previousResults(): QuizResult[] { return this.data.results.filter(item => item.studentId === this.student?.id).slice(-5).reverse(); }
  get remainingSeconds(): number { return Math.ceil(this.remainingMs / 1000); }
  get questionWord(): string { return this.feedbackKind ? this.feedbackWord : this.session?.question() ?? ''; }

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
      this.view = 'edit';
      this.error = '';
    } catch { this.saveError(); }
  }

  openList(id: string): void { this.listId = id; this.error = ''; this.view = 'ready'; }

  editList(): void {
    if (!this.list) return;
    this.listName = this.list.name;
    this.languageA = this.list.languageA;
    this.languageB = this.list.languageB;
    this.wordA = '';
    this.wordB = '';
    this.error = '';
    this.view = 'edit';
  }

  saveListDetails(): void {
    if (!this.listId) return;
    try {
      this.data = this.learningStore.updateList(this.data, this.listId, { name: this.listName, languageA: this.languageA, languageB: this.languageB });
      this.notice = 'Sąrašas išsaugotas.';
      this.error = '';
    } catch { this.saveError(); }
  }

  addPair(): void {
    if (!this.listId || !this.wordA.trim() || !this.wordB.trim()) return;
    try {
      this.data = this.learningStore.addPair(this.data, this.listId, this.wordA, this.wordB);
      this.wordA = '';
      this.wordB = '';
      this.error = '';
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
    this.session = new QuizSession(this.list);
    this.remainingMs = 60000;
    this.answerText = '';
    this.result = null;
    this.error = '';
    this.view = 'quiz';
    this.clock = setInterval(() => this.tick(), 100);
  }

  answer(): void {
    if (!this.session || this.feedbackKind) return;
    if (this.session.remaining() === 0) { this.finishQuiz(); return; }
    const question = this.session.question();
    const correct = this.session.answer(this.answerText);
    if (correct === null) return;
    this.answerText = '';
    this.feedbackWord = question;
    this.feedbackKind = correct ? 'correct' : 'incorrect';
    this.feedbackClock = setTimeout(() => { this.feedbackKind = null; this.feedbackClock = null; }, 550);
  }

  skip(): void {
    if (!this.session || this.feedbackKind) return;
    if (this.session.remaining() === 0) { this.finishQuiz(); return; }
    this.session.skip();
    this.answerText = '';
  }

  leaveQuiz(destination: 'lists' | 'edit'): void {
    this.stopClock();
    this.session = null;
    this.answerText = '';
    this.feedbackKind = null;
    this.view = destination === 'edit' ? 'ready' : 'lists';
    if (destination === 'edit') this.editList();
  }

  retrySave(): void {
    if (this.session && this.remainingMs === 0) this.finishQuiz();
  }

  ngOnDestroy(): void { this.stopClock(); }

  private tick(): void {
    if (!this.session) return;
    this.remainingMs = this.session.remaining();
    if (this.remainingMs === 0) this.finishQuiz();
  }

  private finishQuiz(): void {
    const session = this.session;
    if (!session || !this.student) return;
    this.stopClock();
    this.remainingMs = 0;
    try {
      const completed = this.learningStore.completeRound(this.data, session.list.id, this.student.id, session.streaks, session.counts);
      this.data = completed.data;
      this.result = completed.result;
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
