import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface ReceiptRecord {
  receipt_number: string;
  billing_id: string;
  student_id: string;
  student_name: string;
  fee_name: string;
  total_fee: number;
  total_amount: number;
  payment_method: string;
  status: string;
  balance: number;
  date: string;
}

export interface GeneratedReceiptRecord {
  payment_id?: number;
  receipt_number: string;
  billing_id: string;
  student_id: string;
  student_name: string;
  fee_name: string;
  total_amount: number;
  payment_method: string;
  status?: string | null;
  balance?: number | null;
  issued_at?: string | null;
  source?: 'api' | 'local';
}

export interface GeneratedReceiptsResponse {
  total_receipts: number;
  receipts: GeneratedReceiptRecord[];
}

export interface DeleteReceiptResponse {
  message: string;
}

export interface ReceiptLookupResponse {
  receipt_number: string;
  billing_id: string;
  student_id: string;
  student_name: string;
  fee_name: string;
  total_fee: number;
  amount_paid: number;
  payment_method: string;
  status: string;
  balance: number;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private apiUrl = 'https://cashierapi-production-22b7.up.railway.app/api';
  private readonly localReceiptsStorageKey = 'cashierweb.local-receipts';

  constructor(private http: HttpClient) {}

  generateReceiptByBillingId(billingId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/billing/${encodeURIComponent(billingId)}/receipt`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  getAllReceipts(): Observable<GeneratedReceiptsResponse> {
    return this.http.get<GeneratedReceiptsResponse>(`${this.apiUrl}/receipts`);
  }

  deleteReceipt(receiptNumber: string): Observable<DeleteReceiptResponse> {
    return this.http.delete<DeleteReceiptResponse>(
      `${this.apiUrl}/receipts/${encodeURIComponent(receiptNumber)}`
    );
  }

  getReceiptByNumber(receiptNumber: string): Observable<ReceiptLookupResponse> {
    return this.http.get<ReceiptLookupResponse>(
      `${this.apiUrl}/receipts/${encodeURIComponent(receiptNumber)}`
    );
  }

  saveLocalReceipt(receipt: ReceiptRecord): void {
    const receiptNumber = receipt.receipt_number?.trim();

    if (!receiptNumber) {
      return;
    }

    const entries = this.getLocalReceiptEntries();
    const nextEntry = {
      receipt: {
        ...receipt,
        receipt_number: receiptNumber
      },
      issued_at: this.resolveIsoDate(receipt.date) || new Date().toISOString()
    };

    const existingIndex = entries.findIndex((entry) => entry.receipt.receipt_number === receiptNumber);

    if (existingIndex >= 0) {
      entries[existingIndex] = nextEntry;
    } else {
      entries.unshift(nextEntry);
    }

    this.saveLocalReceiptEntries(entries.slice(0, 200));
  }

  mergeWithLocalReceipts(apiReceipts: GeneratedReceiptRecord[]): GeneratedReceiptRecord[] {
    const apiItems = (apiReceipts || []).map((item) => ({
      ...item,
      source: 'api' as const
    }));

    const apiReceiptNumbers = new Set(
      apiItems
        .map((item) => item.receipt_number?.trim())
        .filter((item): item is string => !!item)
    );

    const localItems = this.getLocalReceiptEntries()
      .filter((entry) => !apiReceiptNumbers.has(entry.receipt.receipt_number))
      .map((entry) => this.toGeneratedRecord(entry));

    return [...apiItems, ...localItems].sort((first, second) => {
      const firstTime = this.toTimestamp(first.issued_at);
      const secondTime = this.toTimestamp(second.issued_at);
      return secondTime - firstTime;
    });
  }

  getLocalReceiptByNumber(receiptNumber: string): ReceiptRecord | null {
    const normalized = receiptNumber.trim();

    if (!normalized) {
      return null;
    }

    const match = this.getLocalReceiptEntries().find((entry) => entry.receipt.receipt_number === normalized);
    return match?.receipt || null;
  }

  deleteLocalReceipt(receiptNumber: string): boolean {
    const normalized = receiptNumber.trim();

    if (!normalized) {
      return false;
    }

    const entries = this.getLocalReceiptEntries();
    const filtered = entries.filter((entry) => entry.receipt.receipt_number !== normalized);

    if (filtered.length === entries.length) {
      return false;
    }

    this.saveLocalReceiptEntries(filtered);
    return true;
  }

  createReceiptBlob(receipt: ReceiptRecord): Blob {
    return new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
  }

  getReceiptDownloadFileName(receiptNumber: string): string {
    return `OR-${receiptNumber}.json`;
  }

  async parseReceiptBlob(blob: Blob): Promise<ReceiptRecord | null> {
    try {
      const parsed = JSON.parse(await blob.text()) as Record<string, unknown>;
      const receiptNumber = String(parsed['receipt_number'] ?? '').trim();

      if (!receiptNumber) {
        return null;
      }

      return {
        receipt_number: receiptNumber,
        billing_id: String(parsed['billing_id'] ?? ''),
        student_id: String(parsed['student_id'] ?? ''),
        student_name: String(parsed['student_name'] ?? ''),
        fee_name: String(parsed['fee_name'] ?? ''),
        total_fee: Number(parsed['total_fee'] ?? 0),
        total_amount: Number(parsed['total_amount'] ?? parsed['amount_paid'] ?? 0),
        payment_method: String(parsed['payment_method'] ?? 'Cash'),
        status: String(parsed['status'] ?? 'Paid'),
        balance: Number(parsed['balance'] ?? 0),
        date: String(parsed['date'] ?? new Date().toISOString())
      };
    } catch {
      return null;
    }
  }

  openPrintableReceipt(receipt: ReceiptRecord): boolean {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      return false;
    }

    const safe = {
      receipt_number: this.escapeHtml(receipt.receipt_number || 'N/A'),
      billing_id: this.escapeHtml(receipt.billing_id || 'N/A'),
      student_id: this.escapeHtml(receipt.student_id || 'N/A'),
      student_name: this.escapeHtml(receipt.student_name || 'N/A'),
      fee_name: this.escapeHtml(receipt.fee_name || 'N/A'),
      payment_method: this.escapeHtml(receipt.payment_method || 'N/A'),
      status: this.escapeHtml(receipt.status || 'N/A'),
      date: this.escapeHtml(receipt.date || '')
    };

    const totalFee = this.formatAmount(receipt.total_fee);
    const totalAmount = this.formatAmount(receipt.total_amount);
    const balance = this.formatAmount(receipt.balance);

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt ${safe.receipt_number}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background: #f8fbff;
        color: #0f172a;
      }
      .receipt {
        max-width: 760px;
        margin: 0 auto;
        border: 1px solid #dbeafe;
        border-radius: 18px;
        background: #ffffff;
        padding: 22px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid #dbeafe;
        padding-bottom: 14px;
      }
      .eyebrow {
        margin: 0;
        font-size: 12px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #1d4ed8;
        font-weight: 700;
      }
      .title {
        margin: 6px 0 0;
        font-size: 28px;
        font-weight: 800;
      }
      .id {
        margin: 4px 0 0;
        font-size: 14px;
        color: #475569;
      }
      .badge {
        border: 1px solid #bfdbfe;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 700;
        color: #1d4ed8;
        background: #eff6ff;
        align-self: flex-start;
      }
      .grid {
        margin-top: 18px;
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px;
        background: #f8fafc;
      }
      .label {
        margin: 0;
        font-size: 11px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #64748b;
        font-weight: 700;
      }
      .value {
        margin: 7px 0 0;
        font-size: 17px;
        font-weight: 700;
        color: #0f172a;
        word-break: break-word;
      }
      @media (max-width: 700px) {
        body { padding: 14px; }
        .receipt { padding: 16px; }
        .title { font-size: 23px; }
        .grid { grid-template-columns: 1fr; }
      }
      @media print {
        body { background: #ffffff; padding: 0; }
        .receipt {
          border: none;
          border-radius: 0;
          padding: 0;
          max-width: 100%;
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <article class="receipt">
      <header class="header">
        <div>
          <p class="eyebrow">Official Receipt</p>
          <h1 class="title">${safe.receipt_number}</h1>
          <p class="id">Billing: ${safe.billing_id}</p>
        </div>
        <span class="badge">${safe.status}</span>
      </header>

      <section class="grid">
        <div class="card">
          <p class="label">Student</p>
          <p class="value">${safe.student_name}</p>
        </div>
        <div class="card">
          <p class="label">Student ID</p>
          <p class="value">${safe.student_id}</p>
        </div>
        <div class="card">
          <p class="label">Fee Name</p>
          <p class="value">${safe.fee_name}</p>
        </div>
        <div class="card">
          <p class="label">Payment Method</p>
          <p class="value">${safe.payment_method}</p>
        </div>
        <div class="card">
          <p class="label">Total Fee</p>
          <p class="value">${totalFee}</p>
        </div>
        <div class="card">
          <p class="label">Amount Paid</p>
          <p class="value">${totalAmount}</p>
        </div>
        <div class="card">
          <p class="label">Balance</p>
          <p class="value">${balance}</p>
        </div>
        <div class="card">
          <p class="label">Date</p>
          <p class="value">${safe.date}</p>
        </div>
      </section>
    </article>
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () {
          window.focus();
          window.print();
        }, 120);
      });
    </script>
  </body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    return true;
  }

  private getLocalReceiptEntries(): Array<{ receipt: ReceiptRecord; issued_at: string }> {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(this.localReceiptsStorageKey);

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((item) => this.toLocalReceiptEntry(item))
        .filter((item): item is { receipt: ReceiptRecord; issued_at: string } => !!item);
    } catch {
      return [];
    }
  }

  private saveLocalReceiptEntries(entries: Array<{ receipt: ReceiptRecord; issued_at: string }>) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.localReceiptsStorageKey, JSON.stringify(entries));
    } catch {
      // Keep receipt generation non-blocking when browser storage is unavailable.
    }
  }

  private toLocalReceiptEntry(value: unknown): { receipt: ReceiptRecord; issued_at: string } | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const record = value as Record<string, unknown>;
    const receiptRaw = record['receipt'];

    if (!receiptRaw || typeof receiptRaw !== 'object' || Array.isArray(receiptRaw)) {
      return null;
    }

    const receiptRecord = receiptRaw as Record<string, unknown>;
    const receiptNumber = String(receiptRecord['receipt_number'] ?? '').trim();

    if (!receiptNumber) {
      return null;
    }

    const receipt: ReceiptRecord = {
      receipt_number: receiptNumber,
      billing_id: String(receiptRecord['billing_id'] ?? ''),
      student_id: String(receiptRecord['student_id'] ?? ''),
      student_name: String(receiptRecord['student_name'] ?? ''),
      fee_name: String(receiptRecord['fee_name'] ?? ''),
      total_fee: Number(receiptRecord['total_fee'] ?? 0),
      total_amount: Number(receiptRecord['total_amount'] ?? 0),
      payment_method: String(receiptRecord['payment_method'] ?? 'Cash'),
      status: String(receiptRecord['status'] ?? 'Paid'),
      balance: Number(receiptRecord['balance'] ?? 0),
      date: String(receiptRecord['date'] ?? '')
    };

    const issuedAt = this.resolveIsoDate(record['issued_at']) || this.resolveIsoDate(receipt.date) || new Date().toISOString();

    return {
      receipt,
      issued_at: issuedAt
    };
  }

  private toGeneratedRecord(entry: { receipt: ReceiptRecord; issued_at: string }): GeneratedReceiptRecord {
    return {
      receipt_number: entry.receipt.receipt_number,
      billing_id: entry.receipt.billing_id,
      student_id: entry.receipt.student_id,
      student_name: entry.receipt.student_name,
      fee_name: entry.receipt.fee_name,
      total_amount: entry.receipt.total_amount,
      payment_method: entry.receipt.payment_method,
      status: entry.receipt.status,
      balance: entry.receipt.balance,
      issued_at: entry.issued_at,
      source: 'local'
    };
  }

  private resolveIsoDate(value: unknown): string | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  private toTimestamp(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private formatAmount(value: number): string {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount)
      ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
