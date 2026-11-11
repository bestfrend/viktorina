import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { StudentState } from './student';
import { StudentStore } from './student-store.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  state: StudentState = { version: 1, students: [], selectedStudentId: null };
  name = '';
  error = '';
  storageAvailable = false;

  constructor(private readonly store: StudentStore) {
    this.reload();
  }

  get selectedName(): string | undefined {
    return this.state.students.find(student => student.id === this.state.selectedStudentId)?.name;
  }

  reload(): void {
    try {
      this.state = this.store.load();
      this.storageAvailable = true;
      this.error = '';
    } catch {
      this.storageAvailable = false;
      this.error = 'Nepavyko perskaityti vietinės saugyklos. Patikrink naršyklės saugyklos nustatymus ir bandyk dar kartą.';
    }
  }

  add(): void {
    if (!this.name.trim() || !this.storageAvailable) return;
    try {
      this.state = this.store.add(this.state, this.name);
      this.name = '';
      this.error = '';
    } catch {
      this.error = 'Nepavyko išsaugoti vardo. Patikrink naršyklės saugyklą ir bandyk dar kartą.';
    }
  }

  select(id: string): void {
    if (!this.storageAvailable) return;
    try {
      this.state = this.store.select(this.state, id);
      this.error = '';
    } catch {
      this.error = 'Nepavyko išsaugoti pasirinkimo. Patikrink naršyklės saugyklą ir bandyk dar kartą.';
    }
  }
}
