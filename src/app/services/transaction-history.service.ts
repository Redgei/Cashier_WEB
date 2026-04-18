import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type TransactionEventType = 'created' | 'updated' | 'refund' | 'library_fine';

export interface TransactionHistoryRecord {
  transaction_id: number;
  payment_id?: number;
  billing_id: string | null;
  student_id: string;
  student_name: string;
  fee_name: string;
  payment_method: string;
  status?: string | null;
  balance?: number | null;
  total_fee: number;
  total_amount: number;
  refund_amount?: number | null;
  receipt_number?: string | null;
  event_type: TransactionEventType;
  created_at?: string;
  updated_at?: string;
  action_at?: string;
}

export interface TransactionHistoryWriteRecord {
  payment_id?: number;
  billing_id: string | null;
  student_id: string;
  student_name: string;
  fee_name: string;
  payment_method: string;
  status?: string | null;
  balance?: number | null;
  total_fee: number;
  total_amount: number;
  refund_amount?: number | null;
  receipt_number?: string | null;
  event_type: TransactionEventType;
  created_at?: string;
  updated_at?: string;
  action_at?: string;
}

export interface TransactionHistoryResponse {
  total_transactions: number;
  created_transactions: number;
  updated_transactions: number;
  refund_transactions: number;
  library_fine_transactions?: number;
  transactions: TransactionHistoryRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class TransactionHistoryService {
  private apiUrl = 'https://cashierapi-production-22b7.up.railway.app/api/history';
  private readonly localStorageKey = 'cashierweb.transaction-history.records';
  private localTransactionSequence = 0;

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<TransactionHistoryResponse> {
    return this.http.get<TransactionHistoryResponse>(`${this.apiUrl}/transactions`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((response) => this.mergeWithLocalTransactions(response))
    );
  }

  recordTransaction(record: TransactionHistoryWriteRecord): void {
    const storedRecord = this.toStoredRecord(record);
    const records = this.loadLocalTransactions();

    records.unshift(storedRecord);
    this.saveLocalTransactions(records);
  }

  private mergeWithLocalTransactions(response: TransactionHistoryResponse): TransactionHistoryResponse {
    const localTransactions = this.loadLocalTransactions();
    const transactions = [...(response.transactions || []), ...localTransactions];

    return {
      ...response,
      total_transactions: (response.total_transactions || 0) + localTransactions.length,
      created_transactions:
        (response.created_transactions || 0) + this.countEventType(localTransactions, 'created'),
      updated_transactions:
        (response.updated_transactions || 0) + this.countEventType(localTransactions, 'updated'),
      refund_transactions:
        (response.refund_transactions || 0) + this.countEventType(localTransactions, 'refund'),
      library_fine_transactions:
        (response.library_fine_transactions || 0) + this.countEventType(localTransactions, 'library_fine'),
      transactions
    };
  }

  private loadLocalTransactions(): TransactionHistoryRecord[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(this.localStorageKey);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((item): item is TransactionHistoryRecord => this.isTransactionRecord(item));
    } catch {
      return [];
    }
  }

  private saveLocalTransactions(records: TransactionHistoryRecord[]) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(records.slice(0, 100)));
    } catch {
      // Keep the transaction flow non-blocking if browser storage is unavailable.
    }
  }

  private toStoredRecord(record: TransactionHistoryWriteRecord): TransactionHistoryRecord {
    const timestamp = record.action_at || record.updated_at || record.created_at || new Date().toISOString();

    return {
      ...record,
      transaction_id: -(Date.now() * 100 + this.localTransactionSequence++),
      created_at: record.created_at || timestamp,
      updated_at: record.updated_at || timestamp,
      action_at: timestamp
    };
  }

  private countEventType(records: TransactionHistoryRecord[], eventType: TransactionEventType): number {
    return records.filter((record) => record.event_type === eventType).length;
  }

  private isTransactionRecord(value: unknown): value is TransactionHistoryRecord {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const record = value as Record<string, unknown>;

    return (
      typeof record['transaction_id'] === 'number' &&
      typeof record['billing_id'] === 'string' &&
      typeof record['student_id'] === 'string' &&
      typeof record['student_name'] === 'string' &&
      typeof record['fee_name'] === 'string' &&
      typeof record['payment_method'] === 'string' &&
      typeof record['total_fee'] === 'number' &&
      typeof record['total_amount'] === 'number' &&
      typeof record['event_type'] === 'string'
    );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getStoredToken();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const rawToken = localStorage.getItem('token')?.trim();

    if (!rawToken) {
      return null;
    }

    const normalizedToken = rawToken.replace(/^bearer\s+/i, '').trim();
    return normalizedToken || null;
  }
}
