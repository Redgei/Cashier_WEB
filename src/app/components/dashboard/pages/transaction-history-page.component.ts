import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TransactionHistoryRecord,
  TransactionHistoryResponse,
  TransactionHistoryService
} from '../../../services/transaction-history.service';

type TransactionFilter = 'all' | 'created' | 'updated' | 'refund' | 'library_fine';
type TransactionKind = Exclude<TransactionFilter, 'all'>;

interface TransactionEntry extends TransactionHistoryRecord {
  kind: TransactionKind;
}

@Component({
  selector: 'app-transaction-history-page',
  imports: [CommonModule],
  template: `
    <section class="space-y-6">
      <div class="rounded-[2rem] border border-blue-100 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 p-8 text-white shadow-xl shadow-blue-200">
        <p class="text-sm uppercase tracking-[0.3em] text-blue-100">Transactions</p>
        <h1 class="mt-3 text-3xl font-black">Transaction history</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
          Every payment creation, amount update, refund, and library fine payment is stored as its own transaction entry.
        </p>
      </div>

      <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Transaction Log</p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">Created, updated, refunded, and library fine records</h2>
          </div>
          <button
            type="button"
            class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-white"
            (click)="loadTransactions()"
          >
            Refresh List
          </button>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
            <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Total Transactions</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ totalTransactions }}</p>
          </div>
          <div class="rounded-2xl border border-blue-100 bg-white px-4 py-4">
            <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Created</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ createdTransactions }}</p>
          </div>
          <div class="rounded-2xl border border-blue-100 bg-white px-4 py-4">
            <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Updated</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ updatedTransactions }}</p>
          </div>
          <div class="rounded-2xl border border-blue-100 bg-white px-4 py-4">
            <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Refunds</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ refundTransactions }}</p>
          </div>
          <div class="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-4">
            <p class="text-xs uppercase tracking-[0.2em] text-cyan-700">Library Fines</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ libraryFineTransactions }}</p>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          @for (filter of filterOptions; track filter.value) {
            <button
              type="button"
              class="rounded-full px-4 py-2 text-sm font-semibold transition"
              [class.bg-blue-600]="activeFilter() === filter.value"
              [class.text-white]="activeFilter() === filter.value"
              [class.shadow-lg]="activeFilter() === filter.value"
              [class.shadow-blue-100]="activeFilter() === filter.value"
              [class.border]="activeFilter() !== filter.value"
              [class.border-blue-200]="activeFilter() !== filter.value"
              [class.bg-blue-50]="activeFilter() !== filter.value"
              [class.text-blue-700]="activeFilter() !== filter.value"
              (click)="setFilter(filter.value)"
            >
              {{ filter.label }}
            </button>
          }
        </div>

        @if (errorMessage()) {
          <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ errorMessage() }}
          </div>
        }

        @if (isLoading()) {
          <div class="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-5 text-sm text-slate-600">
            Loading transaction history...
          </div>
        } @else if (filteredTransactions.length) {
          <div class="mt-6 space-y-4">
            @for (transaction of filteredTransactions; track transaction.transaction_id) {
              <article class="rounded-[1.5rem] border border-blue-100 bg-blue-50/60 p-5">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p
                      class="text-xs uppercase tracking-[0.2em]"
                      [class.text-blue-700]="transaction.kind === 'created'"
                      [class.text-amber-700]="transaction.kind === 'updated'"
                      [class.text-emerald-700]="transaction.kind === 'refund'"
                      [class.text-cyan-700]="transaction.kind === 'library_fine'"
                    >
                      {{ getTransactionLabel(transaction.kind) }}
                    </p>
                    <h3 class="mt-2 text-xl font-black text-slate-950">{{ transaction.student_name }}</h3>
                    <p class="mt-1 text-sm text-slate-500">
                      {{ transaction.student_id }}
                    </p>
                  </div>

                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    [class.border]="true"
                    [class.border-blue-200]="transaction.kind === 'created'"
                    [class.bg-blue-50]="transaction.kind === 'created'"
                    [class.text-blue-700]="transaction.kind === 'created'"
                    [class.border-amber-200]="transaction.kind === 'updated'"
                    [class.bg-amber-50]="transaction.kind === 'updated'"
                    [class.text-amber-700]="transaction.kind === 'updated'"
                    [class.border-emerald-200]="transaction.kind === 'refund'"
                    [class.bg-emerald-50]="transaction.kind === 'refund'"
                    [class.text-emerald-700]="transaction.kind === 'refund'"
                    [class.border-cyan-200]="transaction.kind === 'library_fine'"
                    [class.bg-cyan-50]="transaction.kind === 'library_fine'"
                    [class.text-cyan-700]="transaction.kind === 'library_fine'"
                  >
                    {{ getTransactionBadgeLabel(transaction.kind) }}
                  </span>
                </div>

                <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Billing ID</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ transaction.billing_id || 'Not set' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Amount</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">
                      @if (transaction.kind === 'refund') {
                        Refund {{ (transaction.refund_amount ?? 0) | number:'1.2-2' }}
                      } @else {
                        {{ transaction.total_amount | number:'1.2-2' }}
                      }
                    </p>
                  </div>
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Created</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">
                      {{ transaction.created_at ? (transaction.created_at | date:'MMMM d, y h:mm a') : 'No date' }}
                    </p>
                  </div>
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Updated</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">
                      {{ transaction.updated_at ? (transaction.updated_at | date:'MMMM d, y h:mm a') : 'No date' }}
                    </p>
                  </div>
                </div>

                <div class="mt-4 grid gap-3 md:grid-cols-3">
                  <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Fee Name</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ transaction.fee_name }}</p>
                  </div>
                  <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Payment Method</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ transaction.payment_method }}</p>
                  </div>
                  <div class="rounded-2xl border border-blue-100 bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ transaction.status || 'Pending' }}</p>
                  </div>
                </div>

                @if (transaction.kind === 'updated') {
                  <div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Each save creates a separate updated transaction entry.
                  </div>
                } @else if (transaction.kind === 'refund') {
                  <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Refund transactions are sourced from refunded payments and show the overpaid amount.
                  </div>
                } @else if (transaction.kind === 'library_fine') {
                  <div class="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">
                    Library fine payments are recorded from the fines page and show as their own transaction category.
                  </div>
                }
              </article>
            }
          </div>
        } @else {
          <div class="mt-6 rounded-[1.5rem] border border-dashed border-blue-200 bg-blue-50 px-5 py-10 text-center">
            <p class="text-lg font-bold text-slate-950">No transactions found</p>
            <p class="mt-2 text-sm text-slate-600">
              Created payments, updated payment rows, refunds, and library fines will appear here once records exist.
            </p>
          </div>
        }
      </article>
    </section>
  `
})
export class TransactionHistoryPageComponent implements OnInit {
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly activeFilter = signal<TransactionFilter>('all');
  readonly summary = signal<TransactionHistoryResponse | null>(null);
  readonly transactions = signal<TransactionHistoryRecord[]>([]);

  readonly filterOptions: Array<{ label: string; value: TransactionFilter }> = [
    { label: 'All', value: 'all' },
    { label: 'Created', value: 'created' },
    { label: 'Updated', value: 'updated' },
    { label: 'Refunds', value: 'refund' },
    { label: 'Library Fines', value: 'library_fine' }
  ];

  constructor(private transactionHistoryService: TransactionHistoryService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  get totalTransactions(): number {
    return this.summary()?.total_transactions ?? this.transactions().length;
  }

  get createdTransactions(): number {
    return this.summary()?.created_transactions ?? this.transactions().filter((record) => this.isCreated(record)).length;
  }

  get updatedTransactions(): number {
    return this.summary()?.updated_transactions ?? this.transactions().filter((record) => this.isUpdated(record)).length;
  }

  get refundTransactions(): number {
    return this.summary()?.refund_transactions ?? this.transactions().filter((record) => this.isRefund(record)).length;
  }

  get libraryFineTransactions(): number {
    return this.summary()?.library_fine_transactions ?? this.transactions().filter((record) => this.isLibraryFine(record)).length;
  }

  get filteredTransactions(): TransactionEntry[] {
    return this.transactions()
      .map((record) => this.toTransactionEntry(record))
      .filter((entry) => this.activeFilter() === 'all' || entry.kind === this.activeFilter())
      .sort((first, second) => this.getEntryTime(second) - this.getEntryTime(first));
  }

  loadTransactions() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.transactionHistoryService.getTransactions().subscribe({
      next: (response) => {
        this.summary.set(response);
        this.transactions.set(response.transactions || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.summary.set(null);
        this.transactions.set([]);
        this.errorMessage.set(this.getErrorMessage(error, 'Unable to load transaction history.'));
        this.isLoading.set(false);
      }
    });
  }

  setFilter(filter: TransactionFilter) {
    this.activeFilter.set(filter);
  }

  getTransactionLabel(kind: TransactionKind): string {
    if (kind === 'refund') {
      return 'Refund transaction';
    }

    if (kind === 'library_fine') {
      return 'Library fine payment';
    }

    if (kind === 'updated') {
      return 'Payment updated';
    }

    return 'Payment created';
  }

  getTransactionBadgeLabel(kind: TransactionKind): string {
    if (kind === 'library_fine') {
      return 'Library Fines';
    }

    if (kind === 'refund') {
      return 'Refunds';
    }

    return kind.charAt(0).toUpperCase() + kind.slice(1);
  }

  private toTransactionEntry(record: TransactionHistoryRecord): TransactionEntry {
    return {
      ...record,
      kind: record.event_type,
      refund_amount: record.refund_amount ?? null
    };
  }

  private isCreated(record: TransactionHistoryRecord): boolean {
    return record.event_type === 'created';
  }

  private isUpdated(record: TransactionHistoryRecord): boolean {
    return record.event_type === 'updated';
  }

  private isRefund(record: TransactionHistoryRecord): boolean {
    return record.event_type === 'refund';
  }

  private isLibraryFine(record: TransactionHistoryRecord): boolean {
    return record.event_type === 'library_fine';
  }

  private getEntryTime(entry: TransactionEntry): number {
    const source = entry.action_at || entry.updated_at || entry.created_at || '';
    const parsed = new Date(source).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private getErrorMessage(error: any, fallback: string): string {
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
