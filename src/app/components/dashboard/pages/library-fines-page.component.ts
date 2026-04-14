import { CommonModule } from '@angular/common';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FineStatus,
  LibraryFineRecord,
  LibraryFinesService
} from '../../../services/library-fines.service';
import {
  TransactionHistoryService,
  TransactionHistoryWriteRecord
} from '../../../services/transaction-history.service';
import { ReceiptRecord, ReceiptService } from '../../../services/receipt.service';

type FineFilter = 'all' | 'paid' | 'partial' | 'outstanding';

@Component({
  selector: 'app-library-fines-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="space-y-6">
      <div class="rounded-[2rem] border border-blue-100 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 p-8 text-white shadow-xl shadow-blue-200">
        <h1 class="mt-3 text-3xl font-black"> Student Library Fines</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
          Library fines payments.
        </p>
      </div>
      <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article id="payment-entry" class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Payment Entry</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">Save a fine payment</h2>
            </div>
          </div>

          @if (paymentSuccessMessage()) {
            <div class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {{ paymentSuccessMessage() }}
            </div>
          }

          @if (paymentErrorMessage()) {
            <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {{ paymentErrorMessage() }}
            </div>
          }

          <form class="mt-6 grid gap-4 sm:grid-cols-2" (ngSubmit)="savePayment()">
            <div>
              <label for="paymentFineId" class="mb-2 block text-sm font-semibold text-slate-700">Fine ID</label>
              <input
                id="paymentFineId"
                name="paymentFineId"
                type="number"
                min="1"
                step="1"
                required
                [(ngModel)]="paymentForm.fine_id"
                (input)="clearPaymentFeedback()"
                class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="1"
              />
            </div>

            <div>
              <label for="paymentAmount" class="mb-2 block text-sm font-semibold text-slate-700">Amount</label>
              <input
                id="paymentAmount"
                name="paymentAmount"
                type="number"
                min="0"
                step="0.01"
                required
                [(ngModel)]="paymentForm.amount"
                (input)="clearPaymentFeedback()"
                class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="500.00"
              />
            </div>

            <div class="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                [disabled]="isSubmittingPayment()"
                class="flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                @if (isSubmittingPayment()) {
                  <span class="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                }
                Save Payment
              </button>
            </div>
          </form>
        </article>

        <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Live Fines</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">Fines list</h2>
            </div>
         
          </div>

          @if (isLoadingFines()) {
            <div class="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-5 text-sm text-slate-600">
              Loading library fines from the API...
            </div>
          } @else if (apiFines().length) {
            <div class="mt-6 overflow-hidden rounded-[1.5rem] border border-blue-100 bg-blue-50/50">
              <div class="hidden border-b border-blue-100 bg-white px-5 py-3 md:grid md:grid-cols-[0.9fr_1.2fr_1fr_0.9fr_1.3fr] md:items-center md:gap-4">
                <span class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Fine ID</span>
                <span class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Student</span>
                <span class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Balance</span>
                <span class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Paid</span>
                <span class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Last Paid</span>
              </div>

              <div class="divide-y divide-blue-100">
                @for (fine of apiFines(); track fine.fine_id) {
                  <article class="px-5 py-4">
                    <div class="grid gap-4 md:grid-cols-[0.9fr_1.2fr_1fr_0.9fr_1.3fr] md:items-center">
                      <div class="flex items-start gap-3">
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-white text-[10px] font-black text-blue-700">
                          {{ fine.fine_id }}
                        </div>
                        <div class="md:hidden">
                          <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400">Fine ID</p>
                          <p class="mt-1 text-sm font-bold text-slate-950">{{ fine.fine_id }}</p>
                        </div>
                      </div>

                      <div>
                        <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400 md:hidden">Student</p>
                        <p class="text-sm font-semibold text-slate-900">{{ fine.student_name }}</p>
                        <p class="text-xs text-slate-500">{{ fine.student_id }}</p>
                      </div>

                      <div>
                        <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400 md:hidden">Balance</p>
                        <p class="text-sm font-semibold text-slate-900">{{ fine.remaining_balance | number:'1.2-2' }}</p>
                      </div>

                      <div>
                        <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400 md:hidden">Paid</p>
                        <span
                          class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                          [class.border-emerald-200]="fine.is_fully_paid"
                          [class.bg-emerald-50]="fine.is_fully_paid"
                          [class.text-emerald-700]="fine.is_fully_paid"
                          [class.border-amber-200]="!fine.is_fully_paid"
                          [class.bg-amber-50]="!fine.is_fully_paid"
                          [class.text-amber-700]="!fine.is_fully_paid"
                        >
                          {{ fine.is_fully_paid ? 'Yes' : 'No' }}
                        </span>
                      </div>

                      <div>
                        <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400 md:hidden">Last Paid</p>
                        <p class="text-sm font-semibold text-slate-700">
                          {{ fine.last_paid_at ? (fine.last_paid_at | date:'MMMM d, y h:mm a') : 'No payment yet' }}
                        </p>
                      </div>
                    </div>
                  </article>
                }
              </div>
            </div>
          } @else {
            <div class="mt-6 rounded-[1.5rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-12 text-center shadow-sm shadow-blue-100">
              <p class="text-lg font-bold text-slate-950">No API fines to show</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                The fines returned by the API will appear here once records are available.
              </p>
            </div>
          }
        </article>
      </div>

      <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Ledger</p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">Recent library fines</h2>
          </div>

          <div class="flex flex-col gap-3 sm:min-w-[22rem] sm:flex-row">
            <input
              id="searchFines"
              name="searchFines"
              type="text"
              [(ngModel)]="searchQuery"
              class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Search by student, book, or fine ID"
            />
            <button
              type="button"
              class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-white"
              (click)="searchQuery = ''"
            >
              Clear
            </button>
            <button
              type="button"
              class="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              [disabled]="isLoadingFines()"
              (click)="loadLibraryFines()"
            >
              @if (isLoadingFines()) {
                <span class="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></span>
              }
              Refresh
            </button>
          </div>
        </div>

        @if (ledgerErrorMessage()) {
          <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ ledgerErrorMessage() }}
          </div>
        }

        @if (ledgerSuccessMessage()) {
          <div class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {{ ledgerSuccessMessage() }}
          </div>
        }

        @if (isLoadingFines()) {
          <div class="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-5 text-sm text-slate-600">
            Loading library fines from the API...
          </div>
        }

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

        @if (displayedFines.length) {
          <div class="mt-6 overflow-hidden rounded-[1.5rem] border border-blue-100 bg-blue-50/50">
            <div class="hidden border-b border-blue-100 bg-white px-5 py-3 md:grid md:grid-cols-[0.9fr_1fr_0.9fr_1.3fr_auto] md:items-center md:gap-4">
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Fine ID</span>
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Balance</span>
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Is Fully Paid</span>
              <span class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Updated at</span>
              <span class="text-right text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Action</span>
            </div>

            <div class="divide-y divide-blue-100">
            @for (fine of displayedFines; track fine.fine_id) {
              <article class="px-5 py-4">
                <div class="grid gap-4 md:grid-cols-[0.9fr_1fr_0.9fr_1.3fr_auto] md:items-center">
                  <div class="flex items-start gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-white text-[10px] font-black text-blue-700">
                      {{ fine.fine_id }}
                    </div>
                    <div class="md:hidden">
                      <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400">Fine ID</p>
                      <p class="mt-1 text-sm font-bold text-slate-950">{{ fine.fine_id }}</p>
                    </div>
                  </div>

                  <div>
                    <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400 md:hidden">Balance</p>
                    <p class="text-sm font-semibold text-slate-900">{{ fine.remaining_balance | number:'1.2-2' }}</p>
                  </div>

                  <div>
                    <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400 md:hidden">Is Fully Paid</p>
                    <span
                      class="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                      [class.border-emerald-200]="fine.is_fully_paid"
                      [class.bg-emerald-50]="fine.is_fully_paid"
                      [class.text-emerald-700]="fine.is_fully_paid"
                      [class.border-amber-200]="!fine.is_fully_paid"
                      [class.bg-amber-50]="!fine.is_fully_paid"
                      [class.text-amber-700]="!fine.is_fully_paid"
                    >
                      {{ fine.is_fully_paid ? 'Yes' : 'No' }}
                    </span>
                  </div>

                  <div>
                    <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400 md:hidden">Updated at</p>
                    <p class="text-sm font-semibold text-slate-700">
                      {{ fine.last_paid_at ? (fine.last_paid_at | date:'MMMM d, y h:mm a') : 'No payment yet' }}
                    </p>
                  </div>

                  <div class="flex md:justify-end">
                    @if (canCollectPayment(fine)) {
                      <button
                        type="button"
                        class="inline-flex items-center rounded-full border border-blue-200 bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                        (click)="prefillPaymentFromFine(fine)"
                      >
                        Use for Payment
                      </button>
                    } @else if (fine.is_fully_paid) {
                      <span class="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                        Fully Paid
                      </span>
                    } @else {
                      <span class="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500">
                        Local Record
                      </span>
                    }
                  </div>
                </div>
              </article>
            }
            </div>
          </div>
        } @else {
          <div class="mt-6 rounded-[1.5rem] border border-dashed border-blue-200 bg-blue-50 px-6 py-12 text-center shadow-sm shadow-blue-100">
            <p class="text-lg font-bold text-slate-950">No library fines to show</p>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              Add the first fine above or adjust the search and status filters to review matching records.
            </p>
          </div>
        }
      </article>
    </section>
  `
})
export class LibraryFinesPageComponent implements OnInit, OnDestroy {
  private readonly liveFinesRefreshIntervalMs = 10000;

  readonly paymentMethods = ['Cash', 'GCash', 'Bank Transfer', 'Card'];

  readonly filterOptions: Array<{ label: string; value: FineFilter }> = [
    { label: 'All', value: 'all' },
    { label: 'Paid', value: 'paid' },
    { label: 'Partial', value: 'partial' },
    { label: 'Outstanding', value: 'outstanding' }
  ];

  readonly apiFines = signal<LibraryFineRecord[]>([]);
  readonly localFines = signal<LibraryFineRecord[]>([]);
  readonly recentFines = computed(() => this.sortFines([...this.localFines(), ...this.apiFines()]));
  readonly activeFilter = signal<FineFilter>('all');
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly paymentSuccessMessage = signal<string | null>(null);
  readonly paymentErrorMessage = signal<string | null>(null);
  readonly ledgerSuccessMessage = signal<string | null>(null);
  readonly ledgerErrorMessage = signal<string | null>(null);
  readonly isLoadingFines = signal(false);
  readonly isSubmittingPayment = signal(false);

  searchQuery = '';
  form = this.createInitialForm();
  paymentForm = this.createInitialPaymentForm();

  private fineSequence = 1;
  private liveFinesRefreshHandle: ReturnType<typeof setInterval> | null = null;
  private liveFinesRefreshInFlight = false;

  constructor(
    private libraryFinesService: LibraryFinesService,
    private transactionHistoryService: TransactionHistoryService,
    private receiptService: ReceiptService
  ) {}

  ngOnInit() {
    this.loadLibraryFines();
    this.startLiveFinesAutoRefresh();
  }

  ngOnDestroy() {
    this.stopLiveFinesAutoRefresh();
  }

  get nextFineId(): string {
    return `LF-${new Date().getFullYear()}-${String(this.fineSequence).padStart(3, '0')}`;
  }

  get overdueDaysValue(): number {
    return Number(this.form.overdue_days || 0);
  }

  get fineRateValue(): number {
    return Number(this.form.fine_rate || 0);
  }

  get amountPaidValue(): number {
    return Number(this.form.amount_paid || 0);
  }

  get fineAmountPreview(): number {
    return Math.max(0, this.overdueDaysValue) * Math.max(0, this.fineRateValue);
  }

  get balancePreview(): number {
    return this.fineAmountPreview - Math.max(0, this.amountPaidValue);
  }

  get statusPreview(): FineStatus {
    if (this.amountPaidValue <= 0) {
      return 'Outstanding';
    }

    return this.balancePreview <= 0 ? 'Paid' : 'Partial';
  }

  get displayedFines(): LibraryFineRecord[] {
    const query = this.searchQuery.trim().toLowerCase();

    return [...this.recentFines()]
      .filter((fine) => this.activeFilter() === 'all' || fine.status.toLowerCase() === this.activeFilter())
      .filter((fine) => {
        if (!query) {
          return true;
        }

        return [
          fine.fine_id,
          fine.student_id,
          fine.student_name,
          fine.year_level,
          fine.book_title,
          fine.payment_method,
          fine.notes || ''
        ].some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((first, second) => new Date(second.recorded_at).getTime() - new Date(first.recorded_at).getTime());
  }

  totalAssessedAmount(): number {
    return this.recentFines().reduce((sum, fine) => sum + fine.fine_amount, 0);
  }

  totalCollectedAmount(): number {
    return this.recentFines().reduce((sum, fine) => sum + fine.amount_paid, 0);
  }

  totalOutstandingAmount(): number {
    return this.recentFines().reduce((sum, fine) => sum + Math.max(0, fine.balance), 0);
  }

  setFilter(filter: FineFilter) {
    this.activeFilter.set(filter);
  }

  clearFeedback() {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  clearForm() {
    this.form = this.createInitialForm();
    this.clearFeedback();
  }

  saveFine() {
    this.clearFeedback();

    const studentId = this.form.student_id.trim();
    const studentName = this.form.student_name.trim();
    const yearLevel = this.form.year_level.trim();
    const bookTitle = this.form.book_title.trim();
    const dueDate = this.form.due_date;
    const notes = this.form.notes.trim();
    const overdueDays = Math.floor(Number(this.form.overdue_days || 0));
    const fineRate = Number(this.form.fine_rate || 0);
    const amountPaid = Number(this.form.amount_paid || 0);
    const fineAmount = this.fineAmountPreview;

    if (!studentId || !studentName || !yearLevel || !bookTitle || !dueDate) {
      this.errorMessage.set('Please complete the required fine details before saving.');
      return;
    }

    if (!Number.isFinite(overdueDays) || overdueDays <= 0) {
      this.errorMessage.set('Please enter a valid overdue day count.');
      return;
    }

    if (!Number.isFinite(fineRate) || fineRate <= 0) {
      this.errorMessage.set('Please enter a valid fine rate per day.');
      return;
    }

    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
      this.errorMessage.set('Please enter a valid amount paid.');
      return;
    }

    if (amountPaid > fineAmount) {
      this.errorMessage.set('Amount paid cannot exceed the assessed fine.');
      return;
    }

    const fineId = this.nextFineId;

    const record: LibraryFineRecord = {
      fine_id: fineId,
      student_id: studentId,
      student_name: studentName,
      year_level: yearLevel,
      book_title: bookTitle,
      due_date: dueDate,
      overdue_days: overdueDays,
      fine_rate: fineRate,
      fine_amount: fineAmount,
      amount_paid: amountPaid,
      balance: fineAmount - amountPaid,
      remaining_balance: fineAmount - amountPaid,
      payment_method: this.form.payment_method,
      status: amountPaid <= 0 ? 'Outstanding' : amountPaid >= fineAmount ? 'Paid' : 'Partial',
      notes: notes || null,
      recorded_at: new Date().toISOString(),
      last_paid_at: null,
      is_fully_paid: amountPaid >= fineAmount && fineAmount > 0,
      source: 'local'
    };

    this.localFines.set([record, ...this.localFines()]);
    this.fineSequence += 1;
    this.successMessage.set(`Library fine ${fineId} saved for ${studentName}.`);
    this.form = this.createInitialForm();
  }

  clearPaymentFeedback() {
    this.paymentSuccessMessage.set(null);
    this.paymentErrorMessage.set(null);
  }

  prefillPaymentFromFine(fine: LibraryFineRecord) {
    const fineId = this.getNumericFineId(fine.fine_id);

    if (fineId === null) {
      this.paymentErrorMessage.set('This fine does not have a valid numeric fine ID.');
      return;
    }

    this.paymentForm = {
      fine_id: String(fineId),
      amount: Number(fine.balance > 0 ? fine.balance : 0)
    };

    this.clearPaymentFeedback();
    document.getElementById('payment-entry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  loadLibraryFines(options?: { preserveMessages?: boolean }) {
    if (!options?.preserveMessages) {
      this.ledgerSuccessMessage.set(null);
      this.ledgerErrorMessage.set(null);
    } else {
      this.ledgerErrorMessage.set(null);
    }

    this.isLoadingFines.set(true);

    this.libraryFinesService.getFines().subscribe({
      next: (fines) => {
        this.apiFines.set(this.sortFines(fines));
        this.isLoadingFines.set(false);
      },
      error: (error) => {
        this.apiFines.set([]);
        this.ledgerErrorMessage.set(this.getErrorMessage(error, 'Unable to load library fines right now.'));
        this.isLoadingFines.set(false);
      }
    });
  }

  savePayment() {
    this.clearPaymentFeedback();
    this.ledgerSuccessMessage.set(null);
    this.ledgerErrorMessage.set(null);

    const fineId = this.getNumericFineId(this.paymentForm.fine_id);
    const amount = Number(this.paymentForm.amount || 0);

    if (fineId === null) {
      this.paymentErrorMessage.set('Please enter a valid fine ID.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      this.paymentErrorMessage.set('Please enter a valid payment amount.');
      return;
    }

    const matchingFine = this.findFineById(fineId);

    if (matchingFine && amount > matchingFine.balance) {
      this.paymentErrorMessage.set('Payment amount cannot exceed the remaining balance.');
      return;
    }

    const confirmed = window.confirm(`Save payment of ${amount.toFixed(2)} for fine ${fineId}?`);

    if (!confirmed) {
      return;
    }

    this.isSubmittingPayment.set(true);

    this.libraryFinesService.payFine({ fine_id: fineId, amount }).subscribe({
      next: (response) => {
        this.isSubmittingPayment.set(false);
        const baseMessage = response.message || 'Payment successful.';
        this.paymentSuccessMessage.set(baseMessage);
        this.recordLibraryFineTransaction(matchingFine, fineId, amount, response.data);
        this.handleLibraryFineReceiptAfterPayment(matchingFine, fineId, amount, response.data, baseMessage);
        this.paymentForm = this.createInitialPaymentForm();
        this.loadLibraryFines({ preserveMessages: true });
      },
      error: (error) => {
        this.isSubmittingPayment.set(false);
        this.paymentErrorMessage.set(this.getErrorMessage(error, 'Unable to save payment right now.'));
      }
    });
  }

  canCollectPayment(fine: LibraryFineRecord): boolean {
    return this.getNumericFineId(fine.fine_id) !== null && fine.balance > 0 && fine.source === 'api';
  }

  private startLiveFinesAutoRefresh() {
    if (this.liveFinesRefreshHandle !== null) {
      return;
    }

    this.liveFinesRefreshHandle = setInterval(() => {
      this.refreshLiveFinesSilently();
    }, this.liveFinesRefreshIntervalMs);
  }

  private stopLiveFinesAutoRefresh() {
    if (this.liveFinesRefreshHandle === null) {
      return;
    }

    clearInterval(this.liveFinesRefreshHandle);
    this.liveFinesRefreshHandle = null;
  }

  private refreshLiveFinesSilently() {
    if (this.liveFinesRefreshInFlight || this.isLoadingFines()) {
      return;
    }

    this.liveFinesRefreshInFlight = true;

    this.libraryFinesService.getFines().subscribe({
      next: (fines) => {
        this.apiFines.set(this.sortFines(fines));
        this.liveFinesRefreshInFlight = false;
      },
      error: () => {
        this.liveFinesRefreshInFlight = false;
      }
    });
  }

  private recordLibraryFineTransaction(
    fine: LibraryFineRecord | null,
    fineId: number,
    amount: number,
    result: {
      remaining_balance: number;
      is_fully_paid: boolean;
      last_paid_at: string | null;
    }
  ) {
    const timestamp = result.last_paid_at || new Date().toISOString();
    const totalFee = fine?.fine_amount ?? amount + Math.max(0, result.remaining_balance);
    const record: TransactionHistoryWriteRecord = {
      payment_id: fineId,
      billing_id: `LF-${fineId}`,
      student_id: fine?.student_id?.trim() || 'Unknown',
      student_name: fine?.student_name?.trim() || 'Library Fine Payment',
      fee_name: 'Library Fines',
      payment_method: fine?.payment_method || 'Cash',
      status: result.is_fully_paid ? 'Paid' : result.remaining_balance > 0 ? 'Partial' : 'Paid',
      balance: result.remaining_balance,
      total_fee: totalFee,
      total_amount: amount,
      refund_amount: null,
      receipt_number: null,
      event_type: 'library_fine',
      created_at: timestamp,
      updated_at: timestamp,
      action_at: timestamp
    };

    this.transactionHistoryService.recordTransaction(record);
  }

  private handleLibraryFineReceiptAfterPayment(
    fine: LibraryFineRecord | null,
    fineId: number,
    amount: number,
    result: {
      remaining_balance: number;
      is_fully_paid: boolean;
      last_paid_at: string | null;
    },
    baseMessage: string
  ) {
    const receipt = this.createLibraryFineReceiptRecord(fine, fineId, amount, result);
    this.receiptService.saveLocalReceipt(receipt);

    const printTriggered = this.receiptService.openPrintableReceipt(receipt);

    let message = `${baseMessage} Receipt ${receipt.receipt_number} generated.`;
    if (!printTriggered) {
      message += ' Allow pop-ups so print preview can open automatically.';
    }

    this.paymentSuccessMessage.set(message);
  }

  private createLibraryFineReceiptRecord(
    fine: LibraryFineRecord | null,
    fineId: number,
    amount: number,
    result: {
      remaining_balance: number;
      is_fully_paid: boolean;
      last_paid_at: string | null;
    }
  ): ReceiptRecord {
    const totalFee = fine?.fine_amount ?? amount + Math.max(0, result.remaining_balance);
    const previousAmountPaid = fine?.amount_paid ?? Math.max(0, totalFee - Math.max(0, fine?.remaining_balance ?? totalFee));
    const totalAmount = previousAmountPaid + amount;

    return {
      receipt_number: this.generateLibraryFineReceiptNumber(fineId),
      billing_id: `LF-${fineId}`,
      student_id: fine?.student_id?.trim() || `LIB-FINE-${fineId}`,
      student_name: fine?.student_name?.trim() || `Library Fine #${fineId}`,
      fee_name: 'Library Fines',
      total_fee: Number(totalFee),
      total_amount: Number(totalAmount),
      payment_method: fine?.payment_method || 'Cash',
      status: result.is_fully_paid ? 'Paid' : result.remaining_balance > 0 ? 'Partial' : 'Paid',
      balance: Number(result.remaining_balance),
      date: result.last_paid_at || new Date().toISOString()
    };
  }

  private generateLibraryFineReceiptNumber(fineId: number): string {
    const timeToken = Date.now().toString(36).toUpperCase();
    return `RCPT-LF-${fineId}-${timeToken}`;
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

  getStatusClasses(status: FineStatus): string {
    if (status === 'Paid') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }

    if (status === 'Partial') {
      return 'border-amber-200 bg-amber-50 text-amber-700';
    }

    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  private sortFines(fines: LibraryFineRecord[]): LibraryFineRecord[] {
    return [...fines].sort((first, second) => this.getFineSortTime(second) - this.getFineSortTime(first));
  }

  private getFineSortTime(fine: LibraryFineRecord): number {
    const candidates = [fine.recorded_at, fine.last_paid_at, fine.due_date];

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      const parsed = new Date(candidate).getTime();

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    const fineId = this.getNumericFineId(fine.fine_id);
    return fineId ?? 0;
  }

  private findFineById(fineId: number): LibraryFineRecord | null {
    return this.recentFines().find((fine) => this.getNumericFineId(fine.fine_id) === fineId) || null;
  }

  private getNumericFineId(value: number | string): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    const parsed = Number(String(value).trim());
    return Number.isFinite(parsed) ? parsed : null;
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

  private createInitialForm() {
    return {
      student_id: '',
      student_name: '',
      year_level: '',
      book_title: '',
      due_date: '',
      overdue_days: 1,
      fine_rate: 5,
      amount_paid: 0,
      payment_method: 'Cash',
      notes: ''
    };
  }

  private createInitialPaymentForm() {
    return {
      fine_id: '',
      amount: null as number | null
    };
  }
}
