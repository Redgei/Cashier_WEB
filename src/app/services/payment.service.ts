import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private apiUrl = 'http://127.0.0.1:8000/api/payments';
  private billsApiUrl = 'http://127.0.0.1:8000/api/bills';
  private billingsApiUrl = 'http://127.0.0.1:8000/api/billings';
  

  constructor(private http: HttpClient) {}

  getPayments(): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(this.apiUrl);
  }

  createPayment(payload: CreatePaymentPayload): Observable<CreatePaymentResponse> {
    return this.http.post<CreatePaymentResponse>(this.apiUrl, payload);
  }

  createBill(payload: CreatePaymentPayload): Observable<CreatePaymentResponse> {
    return this.http.post<CreatePaymentResponse>(this.billsApiUrl, payload);
  }

  getBillings(): Observable<BillingRecord[]> {
    return this.http.get<BillingRecord[]>(this.billingsApiUrl);
  }

  payBilling(billingId: string, amount: number): Observable<RecordBillPaymentResponse> {
    return this.http.post<RecordBillPaymentResponse>(
      `${this.billingsApiUrl}/${encodeURIComponent(billingId)}/pay`,
      { amount }
    );
  }

  recordBillPayment(payload: RecordBillPaymentPayload): Observable<RecordBillPaymentResponse> {
    return this.payBilling(payload.billing_id, payload.amount);
  }

  updateStudentBill(studentId: string, billingId: string, payload: UpdateStudentBillPayload): Observable<PaymentMutationResponse> {
    return this.http.put<PaymentMutationResponse>(
      `${this.apiUrl}/student/${encodeURIComponent(studentId)}/billing/${encodeURIComponent(billingId)}`,
      payload
    );
  }

  archivePayment(studentId: string, billingId: string): Observable<PaymentMutationResponse> {
    return this.http.delete<PaymentMutationResponse>(
      `${this.apiUrl}/student/${encodeURIComponent(studentId)}/billing/${encodeURIComponent(billingId)}`
    );
  }

  getBillsByStudent(studentId: string): Observable<StudentPaymentsResponse> {
    return this.http.get<StudentPaymentsResponse>(
      `${this.apiUrl}/student/${encodeURIComponent(studentId)}`
    );
  }

  getPaidBillsByStudent(studentId: string): Observable<StudentPaymentsResponse> {
    return this.http.get<StudentPaymentsResponse>(
      `${this.apiUrl}/student/${encodeURIComponent(studentId)}/paid`
    );
  }

  getUnpaidBillsByStudent(studentId: string): Observable<StudentPaymentsResponse> {
    return this.http.get<StudentPaymentsResponse>(
      `${this.apiUrl}/student/${encodeURIComponent(studentId)}/unpaid`
    );
  }

  getBillingById(billingId: string): Observable<BillingLookupResponse> {
    return this.http.get<BillingLookupResponse>(
      `http://127.0.0.1:8000/api/billings/${encodeURIComponent(billingId)}`
    );
  }
}
