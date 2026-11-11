export interface Student {
  id: string;
  name: string;
}

export interface StudentState {
  version: 1;
  students: Student[];
  selectedStudentId: string | null;
}
