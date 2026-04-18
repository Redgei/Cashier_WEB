import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RefundPaymentRecord {
  payment_id?: number;
  billing_id: string | null;
  student_id: string;
  student_name: string;
  fee_name: string;
  total_fee: number;
  total_amount: number;
  payment_method: string;
  status?: string | null;
  balance?: number | null;
  receipt_number?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RefundResponse {
  message: string;
  refund_amount: number;
  payment: RefundPaymentRecord;
}

export interface ProcessedRefundRecord {
  payment_id?: number;
  billing_id: string | null;
  student_id: string;
  student_name: string;
  fee_name: string;
  total_fee: number;
  total_amount: number;
  refund_amount: number;
  payment_method: string;
  balance?: number | null;
  status?: string | null;
  receipt_number?: string | null;
  refunded_at?: string;
}

export interface ProcessedRefundsResponse {
  total_refunds: number;
  refunds: ProcessedRefundRecord[];
}

export interface DeleteRefundResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class RefundService {
  private apiUrl = 'https://cashierapi-production-22b7.up.railway.app/api';

  constructor(private http: HttpClient) {}

  refundPayment(identifier: string): Observable<RefundResponse> {
    return this.http.post<RefundResponse>(
      `${this.apiUrl}/payments/${encodeURIComponent(identifier)}/refund`,
      {},
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  getAllRefunds(): Observable<ProcessedRefundsResponse> {
    return this.http.get<ProcessedRefundsResponse>(`${this.apiUrl}/refunds`, {
      headers: this.getAuthHeaders()
    });
  }

  deleteRefund(billingId: string): Observable<DeleteRefundResponse> {
    return this.http.delete<DeleteRefundResponse>(
      `${this.apiUrl}/refunds/${encodeURIComponent(billingId)}`,
      {
        headers: this.getAuthHeaders()
      }
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
