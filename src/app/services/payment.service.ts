import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentRecord {
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

export interface BillingRecord {
  bill_id?: number;
  billing_id: string | null;
  student_id: string | null;
  student_name: string | null;
  fee_name?: string | null;
  total_fee?: number | null;
  total_amount: number | null;
  payment_method?: string | null;
  status?: string | null;
  balance?: number | null;
  receipt_number?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePaymentPayload {
  billing_id: string;
  student_id: string;
  student_name: string;
  fee_name: string;
  total_fee: number;
  total_amount?: number | null;
  payment_method?: string | null;
  status?: string;
  balance?: number;
  receipt_number?: string | null;
}

export interface CreatePaymentResponse {
  message: string;
  payment?: PaymentRecord;
  bill?: BillingRecord;
}

export interface UpdateStudentBillPayload {
  total_amount?: number;
  payment_method?: string;
}

export interface PaymentMutationResponse {
  message: string;
  payment?: PaymentRecord;
}

export interface StudentPaymentsResponse {
  student_id: string;
  total_records?: number;
  total_paid?: number;
  total_unpaid?: number;
  payments: PaymentRecord[];
}

export interface BillingLookupResponse {
  billing: BillingRecord;
}

export interface RecordBillPaymentPayload {
  billing_id: string;
  amount: number;
}

export interface RecordBillPaymentResponse {
  message: string;
  payment?: PaymentRecord;
  bill?: BillingRecord;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'https://cashierapi-production-22b7.up.railway.app/api/payments';
  private billsApiUrl = 'https://cashierapi-production-22b7.up.railway.app/api/bills';
  private billingsApiUrl = 'https://cashierapi-production-22b7.up.railway.app/api/billings';

  constructor(private http: HttpClient) {}

  getPayments(): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  createPayment(payload: CreatePaymentPayload): Observable<CreatePaymentResponse> {
    return this.http.post<CreatePaymentResponse>(this.apiUrl, payload, {
      headers: this.getAuthHeaders()
    });
  }

  createBill(payload: CreatePaymentPayload): Observable<CreatePaymentResponse> {
    return this.http.post<CreatePaymentResponse>(this.billsApiUrl, payload, {
      headers: this.getAuthHeaders()
    });
  }

  getBillings(): Observable<BillingRecord[]> {
    return this.http.get<BillingRecord[]>(this.billingsApiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  payBilling(billingId: string, amount: number): Observable<RecordBillPaymentResponse> {
    return this.http.post<RecordBillPaymentResponse>(
      `${this.billingsApiUrl}/${encodeURIComponent(billingId)}/pay`,
      { amount },
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  recordBillPayment(payload: RecordBillPaymentPayload): Observable<RecordBillPaymentResponse> {
    return this.payBilling(payload.billing_id, payload.amount);
  }

  updateStudentBill(studentId: string, billingId: string, payload: UpdateStudentBillPayload): Observable<PaymentMutationResponse> {
    return this.http.put<PaymentMutationResponse>(
      `${this.apiUrl}/student/${encodeURIComponent(studentId)}/billing/${encodeURIComponent(billingId)}`,
      payload,
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  archivePayment(studentId: string, billingId: string): Observable<PaymentMutationResponse> {
    return this.http.delete<PaymentMutationResponse>(
      `${this.apiUrl}/student/${encodeURIComponent(studentId)}/billing/${encodeURIComponent(billingId)}`,
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  getBillsByStudent(studentId: string): Observable<StudentPaymentsResponse> {
    return this.http.get<StudentPaymentsResponse>(
      `${this.apiUrl}/student/${encodeURIComponent(studentId)}`,
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  getPaidBillsByStudent(studentId: string): Observable<StudentPaymentsResponse> {
    return this.http.get<StudentPaymentsResponse>(
      `${this.apiUrl}/student/${encodeURIComponent(studentId)}/paid`,
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  getUnpaidBillsByStudent(studentId: string): Observable<StudentPaymentsResponse> {
    return this.http.get<StudentPaymentsResponse>(
      `${this.apiUrl}/student/${encodeURIComponent(studentId)}/unpaid`,
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  getBillingById(billingId: string): Observable<BillingLookupResponse> {
    return this.http.get<BillingLookupResponse>(
      `http://127.0.0.1:8000/api/billings/${encodeURIComponent(billingId)}`,
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
