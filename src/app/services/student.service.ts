import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface StudentRecord {
  student_id: string;
  student_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private readonly apiUrl = 'https://admission-api-production.up.railway.app/api/external/students';
  private readonly apiKey = '2m1EPICCa3dsMdn7NWY9ECDPdw5kuSfBJpxkcAkL1YaqY8dOQQ1E1rUUqAIxGr0L';
  private readonly headers = new HttpHeaders({
    'API-key': this.apiKey, Authorization: `Bearer ${this.apiKey}`
  });

  constructor(private http: HttpClient) {}

  getStudents(): Observable<StudentRecord[]> {
    return this.http.get<unknown>(this.apiUrl, { headers: this.headers }).pipe(
      map((response) => this.normalizeStudents(response))
    );
  }

  private normalizeStudents(response: unknown): StudentRecord[] {
    const items = this.getStudentItems(response);
  
    return items
      .map((item) => this.normalizeStudent(item))
      .filter((student) => Boolean(student.student_id || student.student_name));
  }

  private getStudentItems(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const record = response as Record<string, unknown>;
    const candidates = ['data', 'students', 'results', 'items'];

    for (const key of candidates) {
      const value = record[key];

      if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  }

  private normalizeStudent(value: unknown): StudentRecord {
    const record = this.asRecord(value);
    const studentId = this.pickText(record, ['student_id', 'studentId', 'student_number', 'studentNumber', 'student_no', 'id']);
    const name = this.pickText(record, ['student_name', 'full_name', 'fullName', 'name']) || this.buildName(record);
    return {
      student_id: studentId || name || 'Unknown Student',
      student_name: name || studentId || 'Unknown Student'
    };
  }

  private buildName(record: Record<string, unknown>): string {
    const firstName = this.pickText(record, ['first_name', 'firstName', 'firstname', 'given_name', 'givenName']);
    const middleName = this.pickText(record, ['middle_name', 'middleName', 'middlename']);
    const lastName = this.pickText(record, ['last_name', 'lastName', 'lastname', 'surname', 'family_name']);

    return [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private pickText(record: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = record[key];

      if (typeof value === 'string') {
        const text = value.trim();
        if (text) {
          return text;
        }
      }

      if (typeof value === 'number' || typeof value === 'bigint') {
        return String(value);
      }
    }

    return '';
  }
}
