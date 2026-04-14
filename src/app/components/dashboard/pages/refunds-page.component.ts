import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProcessedRefundRecord,
  RefundPaymentRecord,
  RefundService
} from '../../../services/refund.service';
import { ReceiptService } from '../../../services/receipt.service';
import { PaymentRecord, PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-refunds-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="space-y-6">
      <div class="rounded-[2rem] border border-blue-100 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 p-8 text-white shadow-xl shadow-blue-200">
        <p class="text-sm uppercase tracking-[0.3em] text-blue-100">Refunds</p>
        <h1 class="mt-3 text-3xl font-black">Process payment refunds</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
          Process overpayment refunds using a billing ID.
        </p>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Refund Request</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">Search and refund one payment</h2>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-600">
              Accepted ID:
              <span class="font-semibold text-blue-700">Billing ID or receipt number</span>
            </div>
          </div>

          @if (successMessage()) {
            <div class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {{ successMessage() }}
            </div>
          }

          @if (errorMessage()) {
            <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {{ errorMessage() }}
            </div>
          }

          <form class="mt-6 space-y-5" (ngSubmit)="processRefund()">
            <div>
              <label for="refundLookup" class="mb-2 block text-sm font-semibold text-slate-700">
                Billing ID or Receipt Number
              </label>
              <input
                id="refundLookup"
                name="refundLookup"
                type="text"
                required
                [(ngModel)]="refundLookup"
                (input)="clearMessages()"
                class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="BILL-2026-001 or OR-AB12CD34"
              />
              <p class="mt-2 text-sm text-slate-500">
                Refunds can only be processed for overpaid billings. Fully settled or unpaid billings cannot be refunded.
              </p>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Current Input</p>
                <p class="mt-2 text-lg font-bold text-slate-950">{{ refundLookup || 'Waiting for refund ID' }}</p>
              </div>
              <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
                <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Last Status</p>
                <p class="mt-2 text-lg font-bold text-slate-950">{{ getDisplayStatus(refundResult()?.status) }}</p>
              </div>
              <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
                <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Refund Amount</p>
                <p class="mt-2 text-lg font-bold text-slate-950">{{ (refundAmount() ?? 0) | number:'1.2-2' }}</p>
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                [disabled]="isProcessing()"
                class="flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                @if (isProcessing()) {
                  <span class="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                }
                Process Refund
              </button>

              <button
                type="button"
                class="rounded-2xl border border-blue-200 bg-white px-6 py-3.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                (click)="resetRefundForm()"
              >
                Clear
              </button>
            </div>
          </form>
        </article>

        <article class="rounded-[1.75rem] border border-blue-100 bg-blue-50 p-6 shadow-sm shadow-blue-100">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Refund Candidates</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">Students with negative balance</h2>
            </div>
            <button
              type="button"
              class="rounded-2xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
              (click)="loadRefundCandidates()"
            >
              Refresh List
            </button>
          </div>

          <p class="mt-4 text-sm leading-6 text-slate-600">
            Click a student billing row to auto-fill the refund lookup field, then click Process Refund.
          </p>

          @if (refundCandidatesError()) {
            <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {{ refundCandidatesError() }}
            </div>
          }

          @if (isLoadingRefundCandidates()) {
            <div class="mt-6 rounded-2xl border border-blue-100 bg-white px-4 py-5 text-sm text-slate-600">
              Loading refund candidate students...
            </div>
          } @else if (refundCandidates().length) {
            <div class="mt-6 overflow-hidden rounded-[1.35rem] border border-blue-100 bg-white">
              <div class="grid grid-cols-[1fr_1.1fr_1fr_0.8fr_0.8fr] gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                <span>Student ID</span>
                <span>Student Name</span>
                <span>Billing ID</span>
                <span class="text-right">Balance</span>
                <span class="text-right">Action</span>
              </div>

              <div class="divide-y divide-blue-100">
                @for (candidate of refundCandidates(); track candidate.payment_id ?? candidate.billing_id ?? candidate.student_id) {
                  <button
                    type="button"
                    class="grid w-full grid-cols-1 gap-2 px-4 py-3 text-left transition hover:bg-blue-50 sm:grid-cols-[1fr_1.1fr_1fr_0.8fr_0.8fr] sm:items-center"
                    [disabled]="!candidate.billing_id"
                    (click)="selectRefundCandidate(candidate)"
                  >
                    <span class="text-xs font-semibold text-slate-900">{{ candidate.student_id }}</span>
                    <span class="text-xs font-medium text-slate-700">{{ candidate.student_name }}</span>
                    <span class="text-xs font-semibold text-slate-900">{{ candidate.billing_id || 'No billing ID' }}</span>
                    <span class="text-right text-xs font-semibold text-rose-600">
                      -{{ getNegativeBalanceAmount(candidate.balance) | number:'1.2-2' }}
                    </span>
                    <span class="flex justify-end">
                      <span class="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                        Use for Refund
                      </span>
                    </span>
                  </button>
                }
              </div>
            </div>
          } @else {
            <div class="mt-6 rounded-[1.5rem] border border-dashed border-blue-200 bg-white px-5 py-10 text-center">
              <p class="text-lg font-bold text-slate-950">No students with negative balance</p>
              <p class="mt-2 text-sm text-slate-600">
                Refund candidates appear here when a billing has overpayment.
              </p>
            </div>
          }
        </article>
      </div>

      @if (refundResult()) {
        <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Refund Result</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">{{ refundResult()?.billing_id || 'No billing ID' }}</h2>
              <p class="mt-2 text-sm text-slate-500">
                {{ refundResult()?.student_name }} - {{ refundResult()?.student_id }}
              </p>
            </div>
            <span class="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
              {{ getDisplayStatus(refundResult()?.status) }}
            </span>
          </div>

          <div class="mt-6 grid gap-4 lg:grid-cols-5">
            <div class="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 px-4 py-5 text-white">
              <p class="text-xs uppercase tracking-[0.2em] text-blue-100">Total Fee</p>
              <p class="mt-2 text-2xl font-black">{{ refundResult()?.total_fee | number:'1.2-2' }}</p>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-white px-4 py-5">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Refund Amount</p>
              <p class="mt-2 text-2xl font-black text-slate-950">{{ (refundAmount() ?? 0) | number:'1.2-2' }}</p>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-white px-4 py-5">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Amount Paid</p>
              <p class="mt-2 text-2xl font-black text-slate-950">{{ refundResult()?.total_amount | number:'1.2-2' }}</p>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-white px-4 py-5">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Balance After Refund</p>
              <p class="mt-2 text-2xl font-black text-slate-950">{{ refundResult()?.balance | number:'1.2-2' }}</p>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-white px-4 py-5">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Receipt Number</p>
              <p class="mt-2 text-lg font-bold text-slate-950">{{ refundResult()?.receipt_number || 'No receipt yet' }}</p>
            </div>
          </div>
        </article>
      }

      <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Processed Refunds</p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">All processed refunds</h2>
          </div>
          <button
            type="button"
            class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-white"
            (click)="loadProcessedRefunds()"
          >
            Refresh List
          </button>
        </div>

        @if (refundListError()) {
          <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ refundListError() }}
          </div>
        }

        @if (isLoadingRefunds()) {
          <div class="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-5 text-sm text-slate-600">
            Loading processed refunds...
          </div>
        } @else if (processedRefunds().length) {
          <div class="mt-6 grid gap-4 xl:grid-cols-2">
            @for (refund of processedRefunds(); track refund.payment_id ?? refund.billing_id ?? refund.student_id) {
              <article class="rounded-[1.5rem] border border-blue-100 bg-blue-50/60 p-5">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-blue-700">{{ refund.fee_name }}</p>
                    <h3 class="mt-2 text-xl font-black text-slate-950">{{ refund.student_name }}</h3>
                    <p class="mt-1 text-sm text-slate-500">{{ refund.student_id }}</p>
                  </div>

                  <div class="flex items-center gap-2 self-start">
                    <span class="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {{ getDisplayStatus(refund.status) }}
                    </span>
                    <button
                      type="button"
                      class="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      [disabled]="deletingBillingId() === refund.billing_id"
                      (click)="deleteProcessedRefund(refund)"
                    >
                      @if (deletingBillingId() === refund.billing_id) {
                        <span class="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600"></span>
                      } @else {
                        Delete
                      }
                    </button>
                  </div>
                </div>

                <div class="mt-5 grid gap-3 sm:grid-cols-2">
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Billing ID</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ refund.billing_id || 'No billing ID' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Refunded At</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">
                      {{ refund.refunded_at ? (refund.refunded_at | date:'MMMM d, y h:mm a') : 'No date' }}
                    </p>
                  </div>
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Total Fee</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ refund.total_fee | number:'1.2-2' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Amount Paid</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ refund.total_amount | number:'1.2-2' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Refund Amount</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ refund.refund_amount | number:'1.2-2' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Method</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ refund.payment_method }}</p>
                  </div>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="mt-6 rounded-[1.5rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-12 text-center shadow-sm shadow-blue-100">
            <p class="text-lg font-bold text-slate-950">No processed refunds yet</p>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              Process a refund above, then this section will list it and allow delete by billing ID.
            </p>
          </div>
        }
      </article>
    </section>
  `
})
export class RefundsPageComponent implements OnInit {
  refundLookup = '';
  readonly isProcessing = signal(false);
  readonly isLoadingRefunds = signal(false);
  readonly isLoadingRefundCandidates = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly refundListError = signal<string | null>(null);
  readonly refundCandidatesError = signal<string | null>(null);
  readonly deletingBillingId = signal<string | null>(null);
  readonly refundResult = signal<RefundPaymentRecord | null>(null);
  readonly refundAmount = signal<number | null>(null);
  readonly processedRefunds = signal<ProcessedRefundRecord[]>([]);
  readonly refundCandidates = signal<PaymentRecord[]>([]);

  constructor(
    private refundService: RefundService,
    private receiptService: ReceiptService,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {
    this.loadProcessedRefunds();
    this.loadRefundCandidates();
  }

  processRefund() {
    const identifier = this.refundLookup.trim();

    this.clearMessages();

    if (!identifier) {
      this.errorMessage.set('Please enter a billing ID or receipt number first.');
      return;
    }

    const confirmed = window.confirm(`Process refund for "${identifier}"?`);

    if (!confirmed) {
      return;
    }

    this.isProcessing.set(true);

    this.refundService.refundPayment(identifier).subscribe({
      next: (response) => {
        this.refundAmount.set(response.refund_amount ?? 0);
        this.refundResult.set(response.payment);
        const baseMessage = response.message || 'Refund processed successfully.';
        this.successMessage.set(baseMessage);
        this.loadProcessedRefunds();
        this.loadRefundCandidates();
        this.handleRefundReceiptGeneration(response.payment, baseMessage);
        this.isProcessing.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.getErrorMessage(error));
        this.isProcessing.set(false);
      }
    });
  }

  resetRefundForm() {
    this.refundLookup = '';
    this.clearMessages();
    this.refundAmount.set(null);
    this.refundResult.set(null);
  }

  clearMessages() {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  loadProcessedRefunds() {
    this.isLoadingRefunds.set(true);
    this.refundListError.set(null);

    this.refundService.getAllRefunds().subscribe({
      next: (response) => {
        this.processedRefunds.set(response.refunds || []);
        this.isLoadingRefunds.set(false);
      },
      error: (error) => {
        this.processedRefunds.set([]);
        this.refundListError.set(this.getErrorMessage(error));
        this.isLoadingRefunds.set(false);
      }
    });
  }

  loadRefundCandidates() {
    this.isLoadingRefundCandidates.set(true);
    this.refundCandidatesError.set(null);

    this.paymentService.getPayments().subscribe({
      next: (payments) => {
        const candidates = (payments || [])
          .filter((payment) => Number(payment.balance ?? 0) < 0)
          .filter((payment) => (payment.status || '').trim().toLowerCase() !== 'refunded')
          .sort((first, second) => Number(first.balance ?? 0) - Number(second.balance ?? 0));

        this.refundCandidates.set(candidates);
        this.isLoadingRefundCandidates.set(false);
      },
      error: (error) => {
        this.refundCandidates.set([]);
        this.refundCandidatesError.set(this.getErrorMessage(error));
        this.isLoadingRefundCandidates.set(false);
      }
    });
  }

  selectRefundCandidate(candidate: PaymentRecord) {
    const billingId = candidate.billing_id?.trim();

    if (!billingId) {
      this.errorMessage.set('Selected student billing has no billing ID.');
      return;
    }

    this.refundLookup = billingId;
    this.clearMessages();
  }

  deleteProcessedRefund(refund: ProcessedRefundRecord) {
    const billingId = refund.billing_id?.trim();

    if (!billingId) {
      this.refundListError.set('Billing ID is required to delete this refund record.');
      return;
    }

    const confirmed = window.confirm(`Delete refund record for billing "${billingId}"?`);

    if (!confirmed) {
      return;
    }

    this.refundListError.set(null);
    this.deletingBillingId.set(billingId);

    this.refundService.deleteRefund(billingId).subscribe({
      next: (response) => {
        this.processedRefunds.set(
          this.processedRefunds().filter((item) => item.billing_id !== billingId)
        );
        this.successMessage.set(response.message || 'Refund deleted successfully.');
        this.deletingBillingId.set(null);
        this.loadRefundCandidates();

        if (this.refundResult()?.billing_id === billingId) {
          this.refundResult.set(null);
          this.refundAmount.set(null);
        }
      },
      error: (error) => {
        this.refundListError.set(this.getErrorMessage(error));
        this.deletingBillingId.set(null);
      }
    });
  }

  getDisplayStatus(status?: string | null): string {
    if (!status) {
      return 'Waiting';
    }

    return status.trim().toLowerCase() === 'unpaid' ? 'Partial' : status;
  }

  getNegativeBalanceAmount(balance?: number | null): number {
    const numericBalance = Number(balance ?? 0);
    return numericBalance < 0 ? Math.abs(numericBalance) : 0;
  }

  private getErrorMessage(error: any): string {
    const validationErrors = error?.error?.errors;

    if (validationErrors && typeof validationErrors === 'object') {
      const firstFieldError = Object.values(validationErrors).flat()[0];
      if (typeof firstFieldError === 'string') {
        return firstFieldError;
      }
    }

    return error?.error?.message || 'Unable to process refund right now.';
  }

  private handleRefundReceiptGeneration(payment: RefundPaymentRecord | null, baseMessage: string) {
    const billingId = payment?.billing_id?.trim();

    if (!billingId) {
      this.successMessage.set(`${baseMessage} Refund saved, but no billing ID was available for receipt generation.`);
      return;
    }

    this.receiptService.generateReceiptByBillingId(billingId).subscribe({
      next: async (response) => {
        const blob = response.body;

        if (!blob) {
          this.successMessage.set(`${baseMessage} Refund saved, but receipt generation returned an empty file.`);
          return;
        }

        const receipt = await this.receiptService.parseReceiptBlob(blob);

        if (!receipt) {
          this.successMessage.set(`${baseMessage} Refund saved, but the printable receipt details could not be read.`);
          return;
        }

        const printTriggered = this.receiptService.openPrintableReceipt(receipt);
        const receiptNumber = receipt.receipt_number?.trim() || null;

        let message = receiptNumber
          ? `${baseMessage} Receipt ${receiptNumber} generated.`
          : `${baseMessage} Receipt generated.`;

        if (!printTriggered) {
          message += ' Allow pop-ups so print preview can open automatically.';
        }

        this.successMessage.set(message);
        this.loadProcessedRefunds();
      },
      error: (error) => {
        this.successMessage.set(
          `${baseMessage} Refund saved, but receipt auto-generation failed: ${this.getErrorMessage(error)}`
        );
      }
    });
  }

  private extractReceiptFileName(contentDisposition: string | null, billingId: string): string {
    const fileNameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);
    return fileNameMatch?.[1] || `receipt-${billingId}.json`;
  }

  private async extractReceiptNumber(blob: Blob): Promise<string | null> {
    try {
      const parsed = JSON.parse(await blob.text()) as { receipt_number?: string };
      return parsed?.receipt_number?.trim() || null;
    } catch {
      return null;
    }
  }

  private downloadBlob(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  private printBlob(blob: Blob): boolean {
    const objectUrl = URL.createObjectURL(blob);
    const printWindow = window.open(objectUrl, '_blank');

    if (!printWindow) {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
      return false;
    }

    let hasPrinted = false;

    const printOnce = () => {
      if (hasPrinted) {
        return;
      }

      hasPrinted = true;
      printWindow.focus();
      printWindow.print();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
    };

    printWindow.addEventListener('load', printOnce, { once: true });
    setTimeout(printOnce, 900);

    return true;
  }
}
