import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type FineSource = 'api' | 'local';
export type FineStatus = 'Paid' | 'Partial' | 'Outstanding';

export interface LibraryFineRecord {
  fine_id: number | string;
  student_id: string;
  student_name: string;
  year_level: string;
  book_title: string;
  due_date: string;
  overdue_days: number;
  fine_rate: number;
  fine_amount: number;
  amount_paid: number;
  balance: number;
  remaining_balance: number;
  payment_method: string;
  status: FineStatus;
  notes: string | null;
  recorded_at: string;
  last_paid_at: string | null;
  is_fully_paid: boolean;
  source: FineSource;
}

export interface LibraryFinePaymentPayload {
  fine_id: number;
  amount: number;
}

export interface LibraryFinePaymentResponse {
  message: string;
  data: {
    fine_id: number;
    remaining_balance: number;
    is_fully_paid: boolean;
    last_paid_at: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LibraryFinesService {
  private readonly apiUrl = 'https://libraryapi-production-1a40.up.railway.app/api/library/fines';
private readonly API_KEY = 'dHVuQw4w4RJIDUEHsRcloflxx4o2pb6mXgYTQbJnAHJuh75QWQzkwi5UuqJc';


  constructor(private http: HttpClient) {}

  getFines(): Observable<LibraryFineRecord[]> {
   return this.http.get<unknown>(this.apiUrl, {
  headers: {
    'X-API-KEY': this.API_KEY
  }
}).pipe(
  map((response) => this.normalizeFineList(response))
);

  }

  payFine(payload: LibraryFinePaymentPayload): Observable<LibraryFinePaymentResponse> {
    return this.http.post<LibraryFinePaymentResponse>(`${this.apiUrl}/pay`, payload, {
      headers: {
        'X-API-KEY': this.API_KEY
      }
    });
  }

  private normalizeFineList(response: unknown): LibraryFineRecord[] {
    return this.extractFineArray(response).map((item) => this.normalizeFine(item));
  }

  private extractFineArray(response: unknown): unknown[] {
    const queue: unknown[] = [response];
    const visited = new Set<object>();

    while (queue.length) {
      const current = queue.shift();

      if (!current || typeof current !== 'object') {
        continue;
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      if (Array.isArray(current)) {
        return current;
      }

      const candidate = current as Record<string, unknown>;
      queue.push(
        candidate['data'],
        candidate['fines'],
        candidate['library_fines'],
        candidate['items'],
        candidate['results']
      );
    }

    return [];
  }

  private normalizeFine(raw: unknown): LibraryFineRecord {
    const record = this.asRecord(raw);
    const student = this.asRecord(record['student']);
    const amount = this.toNumber(record['amount'], this.toNumber(record['fine_amount']));
    const rawIsFullyPaid = this.toBoolean(record['is_fully_paid']);
    const fineAmount = this.toNumber(record['fine_amount'], amount);
    const balance = this.toNumber(
      record['remaining_balance'],
      this.toNumber(record['balance'], rawIsFullyPaid ? 0 : amount)
    );
    const isFullyPaid = this.toBoolean(record['is_fully_paid'], balance <= 0) || balance <= 0;
    const amountPaid = this.toNumber(
      record['amount_paid'],
      isFullyPaid ? fineAmount : Math.max(0, fineAmount - balance)
    );
    const status = this.normalizeStatus(record['status'], amountPaid, balance, isFullyPaid);

    return {
      fine_id: this.normalizeFineId(record['fine_id']),
      student_id: this.toText(record['student_id'], this.toText(student['student_id'])),
      student_name: this.toText(record['student_name'], this.toText(student['full_name'])),
      year_level: this.toText(record['year_level'], this.toText(student['department'])),
      book_title: this.toText(record['book_title'] ?? record['title']),
      due_date: this.toText(record['due_date']),
      overdue_days: Math.max(0, this.toInteger(record['overdue_days'])),
      fine_rate: this.toNumber(record['fine_rate']),
      fine_amount: fineAmount,
      amount_paid: amountPaid,
      balance,
      remaining_balance: balance,
      payment_method: this.toText(record['payment_method'], 'Cash'),
      status,
      notes: this.toNullableText(record['notes']),
      recorded_at: this.toText(
        record['recorded_at'] ?? record['created_at'] ?? record['last_paid_at'] ?? record['due_date']
      ),
      last_paid_at: this.toNullableText(record['last_paid_at']),
      is_fully_paid: isFullyPaid,
      source: 'api'
    };
  }

  private normalizeFineId(value: unknown): number | string {
    const text = this.toText(value);

    if (!text) {
      return '';
    }

    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : text;
  }

  private normalizeStatus(
    rawStatus: unknown,
    amountPaid: number,
    balance: number,
    isFullyPaid: boolean
  ): FineStatus {
    const normalized = this.toText(rawStatus).toLowerCase();

    if (isFullyPaid || balance <= 0) {
      return 'Paid';
    }

    if (normalized === 'paid' || normalized === 'fully paid' || normalized === 'settled') {
      return 'Paid';
    }

    if (normalized === 'partial' || normalized === 'partially paid') {
      return 'Partial';
    }

    if (normalized === 'unpaid' || normalized === 'outstanding' || normalized === 'not paid') {
      return 'Outstanding';
    }

    if (amountPaid > 0) {
      return 'Partial';
    }

    return 'Outstanding';
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private toText(value: unknown, fallback = ''): string {
    if (value === null || value === undefined) {
      return fallback;
    }

    const text = String(value).trim();
    return text || fallback;
  }

  private toNullableText(value: unknown): string | null {
    const text = this.toText(value);
    return text || null;
  }

  private toNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private toInteger(value: unknown, fallback = 0): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.trunc(parsed);
  }

  private toBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        return true;
      }

      if (normalized === 'false' || normalized === '0') {
        return false;
      }
    }

    return fallback;
  }
}
