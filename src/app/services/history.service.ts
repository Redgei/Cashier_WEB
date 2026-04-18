import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DeletedHistoryRecord {
  history_id: number;
  name: string;
  number: string | null;
  date: string | null;
}

export interface DeletedHistoryResponse {
  payments: DeletedHistoryRecord[];
  receipts: DeletedHistoryRecord[];
  refunds: DeletedHistoryRecord[];
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private apiUrl = 'https://cashierapi-production-22b7.up.railway.app/api/history';

  constructor(private http: HttpClient) {}

  getDeletedHistory(): Observable<DeletedHistoryResponse> {
    return this.http.get<DeletedHistoryResponse>(`${this.apiUrl}/deleted`, {
      headers: this.getAuthHeaders()
    });
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
