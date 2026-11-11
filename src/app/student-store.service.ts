import { Injectable } from '@angular/core';
import { Student, StudentState } from './student';

const STORAGE_KEY = 'zodziu-praktika.students.v1';

@Injectable({ providedIn: 'root' })
export class StudentStore {
  load(): StudentState {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { version: 1, students: [], selectedStudentId: null };

    const value: unknown = JSON.parse(raw);
    if (!this.isState(value)) throw new Error('Invalid student data');
    return value;
  }

  add(state: StudentState, name: string): StudentState {
    const normalized = name.trim().replace(/\s+/g, ' ');
    if (!normalized) throw new Error('A name is required');
    const existing = state.students.find(student => student.name.toLocaleLowerCase('lt') === normalized.toLocaleLowerCase('lt'));
    if (existing) return this.select(state, existing.id);

    const student: Student = { id: this.createId(), name: normalized };
    return this.save({ version: 1, students: [...state.students, student], selectedStudentId: student.id });
  }

  select(state: StudentState, id: string): StudentState {
    if (!state.students.some(student => student.id === id)) throw new Error('Unknown student');
    return this.save({ ...state, selectedStudentId: id });
  }

  private save(state: StudentState): StudentState {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  private createId(): string {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private isState(value: unknown): value is StudentState {
    if (typeof value !== 'object' || value === null) return false;
    const state = value as Record<string, unknown>;
    if (state['version'] !== 1 || !Array.isArray(state['students'])) return false;
    const ids = new Set<string>();
    for (const entry of state['students']) {
      if (typeof entry !== 'object' || entry === null) return false;
      const student = entry as Record<string, unknown>;
      if (typeof student['id'] !== 'string' || !student['id'] || ids.has(student['id']) ||
          typeof student['name'] !== 'string' || !student['name'].trim()) return false;
      ids.add(student['id']);
    }
    return state['selectedStudentId'] === null ||
      (typeof state['selectedStudentId'] === 'string' && ids.has(state['selectedStudentId']));
  }
}
