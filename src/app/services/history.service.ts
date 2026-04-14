import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private apiUrl = 'http://127.0.0.1:8000/api/history';

  constructor(private http: HttpClient) {}

  getDeletedHistory(): Observable<DeletedHistoryResponse> {
    return this.http.get<DeletedHistoryResponse>(`${this.apiUrl}/deleted`);
  }
}
