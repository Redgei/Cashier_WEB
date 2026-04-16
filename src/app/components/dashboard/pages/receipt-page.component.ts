import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  GeneratedReceiptRecord,
  ReceiptLookupResponse,
  ReceiptRecord,
  ReceiptService
} from '../../../services/receipt.service';
import { BillingRecord, PaymentService } from '../../../services/payment.service';

interface RecentPaymentContext {
  billing_id: string;
  student_id: string;
  student_name: string;
  fee_name: string;
  total_fee: number;
  total_amount: number;
  payment_method: string;
  status?: string | null;
  balance?: number | null;
  created_at?: string | null;
}

@Component({
  selector: 'app-receipt-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="space-y-6">
      <div class="rounded-[2rem] border border-blue-100 bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 p-8 text-white shadow-xl shadow-blue-200">
        <p class="text-sm uppercase tracking-[0.3em] text-blue-100">Receipt</p>
        <h1 class="mt-3 text-3xl font-black">Official receipt</h1>
      </div>

    

      <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Generated Receipts</p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">Saved receipt numbers</h2>
          </div>
          <button
            type="button"
            class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-white"
            (click)="loadGeneratedReceipts()"
          >
            Refresh List
          </button>
        </div>

        @if (receiptListError()) {
          <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ receiptListError() }}
          </div>
        }

        @if (isLoadingReceipts()) {
          <div class="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-5 text-sm text-slate-600">
            Loading generated receipts...
          </div>
        } @else if (generatedReceipts().length) {
          <div class="mt-6 overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white">
            <div class="hidden grid-cols-4 gap-3 border-b border-blue-100 bg-blue-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 sm:grid">
              <span>Receipt Number</span>
              <span>Student Billing</span>
              <span>Student Name</span>
              <span>Student ID</span>
            </div>

            <div class="divide-y divide-blue-100">
              @for (generatedReceipt of generatedReceipts(); track generatedReceipt.payment_id ?? generatedReceipt.receipt_number) {
                <div class="grid grid-cols-1 gap-2 px-5 py-4 text-left sm:grid-cols-4 sm:items-center">
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:hidden">Receipt Number</p>
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-bold text-slate-950">{{ generatedReceipt.receipt_number }}</p>
                      <button
                        type="button"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        [disabled]="deletingReceiptNumber() === generatedReceipt.receipt_number"
                        [attr.aria-label]="'Delete receipt ' + generatedReceipt.receipt_number"
                        [title]="'Delete ' + generatedReceipt.receipt_number"
                        (click)="deleteGeneratedReceipt(generatedReceipt)"
                      >
                        @if (deletingReceiptNumber() === generatedReceipt.receipt_number) {
                          <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600"></span>
                        } @else {
                          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M3 6h18"></path>
                            <path d="M8 6V4h8v2"></path>
                            <path d="M19 6l-1 14H6L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                          </svg>
                        }
                      </button>
                    </div>
                  </div>

                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:hidden">Student Billing</p>
                    <p class="text-sm font-semibold text-slate-700">{{ generatedReceipt.billing_id }}</p>
                  </div>

                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:hidden">Student Name</p>
                    <p class="text-sm font-semibold text-slate-700">{{ generatedReceipt.student_name }}</p>
                  </div>

                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:hidden">Student ID</p>
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-semibold text-slate-700">{{ generatedReceipt.student_id }}</p>
                      <button
                        type="button"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        [disabled]="viewingReceiptNumber() === generatedReceipt.receipt_number"
                        [attr.aria-label]="'View receipt info ' + generatedReceipt.receipt_number"
                        [title]="'View receipt info ' + generatedReceipt.receipt_number"
                        (click)="viewGeneratedReceipt(generatedReceipt)"
                      >
                        @if (viewingReceiptNumber() === generatedReceipt.receipt_number) {
                          <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700"></span>
                        } @else {
                          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="mt-6 rounded-[1.5rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-12 text-center shadow-sm shadow-blue-100">
            <p class="text-lg font-bold text-slate-950">No generated receipts yet</p>
            <p class="mt-2 text-sm leading-6 text-slate-600">
            </p>
          </div>
        }
      </article>

      @if (receipt()) {
        <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Receipt Info</p>
              <h2 class="mt-2 text-xl font-black text-slate-950">{{ receipt()?.receipt_number }}</h2>
            </div>
            <span class="inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
              {{ getDisplayStatus(receipt()?.status) }}
            </span>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Student Billing</p>
              <p class="mt-1.5 text-sm font-semibold text-slate-900">{{ receipt()?.billing_id }}</p>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Student Name</p>
              <p class="mt-1.5 text-sm font-semibold text-slate-900">{{ receipt()?.student_name }}</p>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Student ID</p>
              <p class="mt-1.5 text-sm font-semibold text-slate-900">{{ receipt()?.student_id }}</p>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Fee Name</p>
              <p class="mt-1.5 text-sm font-semibold text-slate-900">{{ receipt()?.fee_name }}</p>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Payment Method</p>
              <p class="mt-1.5 text-sm font-semibold text-slate-900">{{ receipt()?.payment_method }}</p>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Date</p>
              <p class="mt-1.5 text-sm font-semibold text-slate-900">{{ receipt()?.date }}</p>
            </div>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-white">
              <p class="text-xs uppercase tracking-[0.2em] text-blue-100">Total Fee</p>
              <p class="mt-1.5 text-lg font-black">{{ receipt()?.total_fee | number:'1.2-2' }}</p>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Amount Paid</p>
              <p class="mt-1.5 text-lg font-black text-slate-950">{{ receipt()?.total_amount | number:'1.2-2' }}</p>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Balance</p>
              <p class="mt-1.5 text-lg font-black text-slate-950">{{ receipt()?.balance | number:'1.2-2' }}</p>
            </div>
          </div>
        </article>
      }
    </section>
  `
})
export class ReceiptPageComponent implements OnInit {
  billingId = '';
  readonly isGenerating = signal(false);
  readonly isLoadingReceipts = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly receiptListError = signal<string | null>(null);
  readonly deletingReceiptNumber = signal<string | null>(null);
  readonly viewingReceiptNumber = signal<string | null>(null);
  readonly receipt = signal<ReceiptRecord | null>(null);
  readonly fileName = signal<string | null>(null);
  readonly receiptBlob = signal<Blob | null>(null);
  readonly generatedReceipts = signal<GeneratedReceiptRecord[]>([]);
  readonly recentPaymentContext = signal<RecentPaymentContext | null>(null);

  constructor(
    private receiptService: ReceiptService,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {
    this.loadRecentPaymentContext();
    this.loadGeneratedReceipts();
  }

  getDisplayStatus(status?: string | null): string {
    if (!status) {
      return 'Pending';
    }

    return status.trim().toLowerCase() === 'unpaid' ? 'Partial' : status;
  }

  generateReceipt() {
    const billingId = this.billingId.trim();

    this.clearMessages();

    if (!billingId) {
      this.errorMessage.set('Please enter a billing ID first.');
      return;
    }

    this.isGenerating.set(true);

    this.receiptService.generateReceiptByBillingId(billingId).subscribe({
      next: async (response) => {
        const blob = response.body;

        if (!blob) {
          this.errorMessage.set('Receipt download did not return any file.');
          this.isGenerating.set(false);
          return;
        }

        const fileName = this.extractFileName(response.headers.get('content-disposition'), billingId);
        this.fileName.set(fileName);
        this.receiptBlob.set(blob);
        this.downloadBlob(blob, fileName);

        try {
          const receipt = JSON.parse(await blob.text()) as ReceiptRecord;
          this.receipt.set(receipt);
          this.successMessage.set(`Receipt ${receipt.receipt_number} generated and downloaded successfully.`);
        } catch {
          this.receipt.set(null);
          this.successMessage.set(`Receipt downloaded successfully as ${fileName}.`);
        }

        this.loadGeneratedReceipts();
        this.isGenerating.set(false);
      },
      error: async (error) => {
        this.errorMessage.set(await this.getErrorMessage(error));
        this.isGenerating.set(false);
      }
    });
  }

  downloadLatestReceipt() {
    const blob = this.receiptBlob();
    const fileName = this.fileName();

    if (!blob || !fileName) {
      return;
    }

    this.downloadBlob(blob, fileName);
  }

  resetReceipt() {
    this.billingId = '';
    this.clearMessages();
    this.receipt.set(null);
    this.fileName.set(null);
    this.receiptBlob.set(null);
    this.recentPaymentContext.set(null);
  }

  clearMessages() {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  loadGeneratedReceipts() {
    this.isLoadingReceipts.set(true);
    this.receiptListError.set(null);

    this.receiptService.getAllReceipts().subscribe({
      next: (response) => {
        this.generatedReceipts.set(this.receiptService.mergeWithLocalReceipts(response.receipts || []));
        this.isLoadingReceipts.set(false);
      },
      error: (error) => {
        this.generatedReceipts.set(this.receiptService.mergeWithLocalReceipts([]));
        this.receiptListError.set(this.getStandardErrorMessage(error, 'Unable to load generated receipts right now.'));
        this.isLoadingReceipts.set(false);
      }
    });
  }

  deleteGeneratedReceipt(generatedReceipt: GeneratedReceiptRecord) {
    const receiptNumber = generatedReceipt.receipt_number?.trim();

    if (!receiptNumber) {
      this.receiptListError.set('Receipt number is required to delete this record.');
      return;
    }

    if (generatedReceipt.source === 'local') {
      const removed = this.receiptService.deleteLocalReceipt(receiptNumber);

      if (!removed) {
        this.receiptListError.set('Unable to delete this local receipt right now.');
        return;
      }

      this.generatedReceipts.set(
        this.generatedReceipts().filter((item) => item.receipt_number !== receiptNumber)
      );
      this.successMessage.set('Receipt deleted successfully.');

      if (this.receipt()?.receipt_number === receiptNumber) {
        this.receipt.set(null);
        this.fileName.set(null);
        this.receiptBlob.set(null);
      }

      return;
    }

    const confirmed = window.confirm(`Delete receipt "${receiptNumber}"?`);

    if (!confirmed) {
      return;
    }

    this.receiptListError.set(null);
    this.deletingReceiptNumber.set(receiptNumber);

    this.receiptService.deleteReceipt(receiptNumber).subscribe({
      next: (response) => {
        this.receiptService.deleteLocalReceipt(receiptNumber);
        this.generatedReceipts.set(
          this.generatedReceipts().filter((item) => item.receipt_number !== receiptNumber)
        );
        this.successMessage.set(response.message || 'Receipt deleted successfully.');
        this.deletingReceiptNumber.set(null);

        if (this.receipt()?.receipt_number === receiptNumber) {
          this.receipt.set(null);
          this.fileName.set(null);
          this.receiptBlob.set(null);
        }
      },
      error: (error) => {
        this.receiptListError.set(this.getStandardErrorMessage(error, 'Unable to delete this receipt right now.'));
        this.deletingReceiptNumber.set(null);
      }
    });
  }

  viewGeneratedReceipt(generatedReceipt: GeneratedReceiptRecord) {
    const receiptNumber = generatedReceipt.receipt_number?.trim();

    if (!receiptNumber) {
      this.receiptListError.set('Receipt number is required to view this record.');
      return;
    }

    if (this.receipt()?.receipt_number === receiptNumber) {
      this.receipt.set(null);
      this.receiptListError.set(null);
      this.viewingReceiptNumber.set(null);
      return;
    }

    if (generatedReceipt.source === 'local') {
      const localReceipt = this.receiptService.getLocalReceiptByNumber(receiptNumber);

      if (!localReceipt) {
        this.receiptListError.set('Unable to load this local receipt right now.');
        return;
      }

      this.receiptListError.set(null);
      this.receipt.set(localReceipt);
      this.viewingReceiptNumber.set(null);
      return;
    }

    this.receiptListError.set(null);
    this.viewingReceiptNumber.set(receiptNumber);

    this.receiptService.getReceiptByNumber(receiptNumber).subscribe({
      next: (response) => {
        this.receipt.set(this.mapLookupToReceipt(response));
        this.viewingReceiptNumber.set(null);
      },
      error: async (error) => {
        const errorMessage = await this.getErrorMessage(error);
        const fallbackReceipt = this.buildFallbackReceipt(generatedReceipt);

        if (fallbackReceipt && this.isPaymentIncompleteError(errorMessage)) {
          this.receiptListError.set(null);
          this.receipt.set(fallbackReceipt);
          this.hydrateFallbackReceiptFromBilling(generatedReceipt);
        } else {
          this.receiptListError.set(errorMessage);
        }

        this.viewingReceiptNumber.set(null);
      }
    });
  }

  private downloadBlob(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  private loadRecentPaymentContext() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const raw = localStorage.getItem('cashierweb.latest-payment-context');

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as RecentPaymentContext;

      if (!parsed?.billing_id || !parsed?.student_id || !parsed?.student_name) {
        return;
      }

      this.recentPaymentContext.set(parsed);

      if (!this.billingId) {
        this.billingId = parsed.billing_id;
      }
    } catch {
      // Ignore malformed cached payment data and keep receipt generation working.
    }
  }

  private extractFileName(contentDisposition: string | null, billingId: string): string {
    const fileNameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);
    return fileNameMatch?.[1] || `receipt-${billingId}.json`;
  }

  private async getErrorMessage(error: any): Promise<string> {
    if (error?.error instanceof Blob) {
      try {
        const text = await error.error.text();
        const parsed = JSON.parse(text);
        return parsed?.message || 'Unable to generate receipt right now.';
      } catch {
        return 'Unable to generate receipt right now.';
      }
    }

    return error?.error?.message || 'Unable to generate receipt right now.';
  }

  private mapLookupToReceipt(response: ReceiptLookupResponse): ReceiptRecord {
    return {
      receipt_number: response.receipt_number,
      billing_id: response.billing_id,
      student_id: response.student_id,
      student_name: response.student_name,
      fee_name: response.fee_name,
      total_fee: Number(response.total_fee ?? 0),
      total_amount: Number(response.amount_paid ?? 0),
      payment_method: response.payment_method,
      status: response.status,
      balance: Number(response.balance ?? 0),
      date: response.date,
    };
  }

  private buildFallbackReceipt(generatedReceipt: GeneratedReceiptRecord): ReceiptRecord | null {
    const receiptNumber = generatedReceipt.receipt_number?.trim();
    const billingId = generatedReceipt.billing_id?.trim();

    if (!receiptNumber || !billingId) {
      return null;
    }

    const recentContext = this.recentPaymentContext();
    const contextMatchesBilling = recentContext?.billing_id === billingId;
    const generatedStatus = generatedReceipt.status?.trim() || '';
    const contextStatus = contextMatchesBilling ? recentContext?.status?.trim() || '' : '';
    const normalizedStatus = (generatedStatus || contextStatus).toLowerCase();
    const isPartialOrUnpaid = normalizedStatus === 'unpaid' || normalizedStatus === 'partial';
    const generatedAmount = this.toFiniteNumber(generatedReceipt.total_amount, 0);
    const generatedBalance = this.toFiniteNumber(generatedReceipt.balance, 0);
    const contextAmount = this.toFiniteNumber(contextMatchesBilling ? recentContext?.total_amount : null, 0);
    const contextBalance = this.toFiniteNumber(contextMatchesBilling ? recentContext?.balance : null, 0);
    const useContextAmount = contextMatchesBilling && isPartialOrUnpaid && generatedAmount <= 0 && contextAmount > 0;
    const useContextBalance = contextMatchesBilling && isPartialOrUnpaid && generatedBalance <= 0 && contextBalance > 0;
    const totalAmount = useContextAmount ? contextAmount : generatedAmount;
    const balance = useContextBalance ? contextBalance : generatedBalance;
    const contextTotalFee = this.toFiniteNumber(contextMatchesBilling ? recentContext?.total_fee : null, 0);
    const totalFeeCandidate = totalAmount + Math.max(0, balance);
    const totalFee = contextTotalFee > 0 ? contextTotalFee : totalFeeCandidate;
    const fallbackStatus = balance > 0 ? 'Unpaid' : 'Paid';
    const status = generatedStatus || contextStatus || fallbackStatus;

    return {
      receipt_number: receiptNumber,
      billing_id: billingId,
      student_id: generatedReceipt.student_id || (contextMatchesBilling ? recentContext?.student_id || '' : ''),
      student_name: generatedReceipt.student_name || (contextMatchesBilling ? recentContext?.student_name || '' : ''),
      fee_name: generatedReceipt.fee_name || (contextMatchesBilling ? recentContext?.fee_name || '' : ''),
      total_fee: totalFee,
      total_amount: totalAmount,
      payment_method: generatedReceipt.payment_method || (contextMatchesBilling ? recentContext?.payment_method || 'Cash' : 'Cash'),
      status,
      balance,
      date: generatedReceipt.issued_at || (contextMatchesBilling ? recentContext?.created_at || '' : '')
    };
  }

  private hydrateFallbackReceiptFromBilling(generatedReceipt: GeneratedReceiptRecord) {
    const billingId = generatedReceipt.billing_id?.trim();
    const receiptNumber = generatedReceipt.receipt_number?.trim();

    if (!billingId || !receiptNumber) {
      return;
    }

    this.paymentService.getBillingById(billingId).subscribe({
      next: (response) => {
        const billing = response?.billing;

        if (!billing) {
          return;
        }

        if (this.receipt()?.receipt_number !== receiptNumber) {
          return;
        }

        this.receipt.set(this.mapBillingToReceipt(generatedReceipt, billing));
      },
      error: () => {
        // Keep fallback details visible even when billing lookup is unavailable.
      }
    });
  }

  private mapBillingToReceipt(generatedReceipt: GeneratedReceiptRecord, billing: BillingRecord): ReceiptRecord {
    const receiptNumber = generatedReceipt.receipt_number?.trim() || this.receipt()?.receipt_number || '';
    const billingId = String(billing.billing_id ?? generatedReceipt.billing_id ?? '').trim();
    const totalFee = this.toFiniteNumber(billing.total_fee, this.receipt()?.total_fee ?? 0);
    const totalAmount = this.toFiniteNumber(billing.total_amount, this.receipt()?.total_amount ?? 0);
    const rawBalance = billing.balance;
    const fallbackBalance = Math.max(0, totalFee - totalAmount);
    const balance = this.toFiniteNumber(rawBalance, fallbackBalance);
    const fallbackStatus = balance > 0 ? 'Unpaid' : 'Paid';
    const status = String(billing.status ?? generatedReceipt.status ?? this.receipt()?.status ?? fallbackStatus);
    const fallbackDate = generatedReceipt.issued_at || this.receipt()?.date || '';
    const date = String(billing.updated_at ?? billing.created_at ?? fallbackDate);

    return {
      receipt_number: receiptNumber,
      billing_id: billingId,
      student_id: String(billing.student_id ?? generatedReceipt.student_id ?? this.receipt()?.student_id ?? ''),
      student_name: String(billing.student_name ?? generatedReceipt.student_name ?? this.receipt()?.student_name ?? ''),
      fee_name: String(billing.fee_name ?? generatedReceipt.fee_name ?? this.receipt()?.fee_name ?? ''),
      total_fee: totalFee,
      total_amount: totalAmount,
      payment_method: String(billing.payment_method ?? generatedReceipt.payment_method ?? this.receipt()?.payment_method ?? 'Cash'),
      status,
      balance,
      date
    };
  }

  private toFiniteNumber(value: number | null | undefined, fallback: number | null | undefined): number {
    const normalizedValue = Number(value);

    if (Number.isFinite(normalizedValue)) {
      return normalizedValue;
    }

    const normalizedFallback = Number(fallback);
    return Number.isFinite(normalizedFallback) ? normalizedFallback : 0;
  }

  private isPaymentIncompleteError(message: string): boolean {
    const normalized = message.trim().toLowerCase();
    return normalized.includes('payment not complete') || normalized.includes('receipt not available');
  }

  private getStandardErrorMessage(error: any, fallback: string): string {
    const validationErrors = error?.error?.errors;

    if (validationErrors && typeof validationErrors === 'object') {
      const firstFieldError = Object.values(validationErrors).flat()[0];
      if (typeof firstFieldError === 'string') {
        return firstFieldError;
      }
    }

    return error?.error?.message || fallback;
  }
}
