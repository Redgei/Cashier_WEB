import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DeletedHistoryRecord,
  DeletedHistoryResponse,
  HistoryService
} from '../../../services/history.service';

type HistoryTab = 'payments' | 'receipts' | 'refunds';

@Component({
  selector: 'app-history-page',
  imports: [CommonModule],
  template: `
    <section class="space-y-6">
      <div class="rounded-[2rem] border border-blue-100 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 p-8 text-white shadow-xl shadow-blue-200">
        <p class="text-sm uppercase tracking-[0.3em] text-blue-100">History</p>
        <h1 class="mt-3 text-3xl font-black">Deleted transaction history</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
          Review the deleted payments, receipts, and refund transactions records.
        </p>
      </div>

      <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Deleted Records</p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">History by transaction type</h2>
          </div>
          <button
            type="button"
            class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-white"
            (click)="loadHistory()"
          >
            Refresh List
          </button>
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          @for (tab of tabs; track tab.value) {
            <button
              type="button"
               class="rounded-full px-4 py-2 text-sm font-semibold transition"
              [class.bg-blue-600]="activeTab() === tab.value"
              [class.text-white]="activeTab() === tab.value"
              [class.shadow-lg]="activeTab() === tab.value"
              [class.shadow-blue-100]="activeTab() === tab.value"
              [class.border]="activeTab() !== tab.value"
              [class.border-blue-200]="activeTab() !== tab.value"
              [class.bg-blue-50]="activeTab() !== tab.value"
              [class.text-blue-700]="activeTab() !== tab.value"
              (click)="setActiveTab(tab.value)"
            >
              {{ tab.label }}
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
            Loading deleted transaction history...
          </div>
        } @else {
          <div class="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-4">
            <div class="hidden rounded-2xl border border-blue-100 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 md:grid md:grid-cols-[1.3fr_1fr_1fr]">
              <span>Name</span>
              <span>Number</span>
              <span>Date</span>
            </div>

            <div class="mt-3 space-y-3">
              @if (activeRecords.length) {
                @for (record of activeRecords; track record.history_id) {
                  <article class="rounded-2xl border border-blue-100 bg-white px-5 py-4">
                    <div class="flex flex-col gap-3 md:grid md:grid-cols-[1.3fr_1fr_1fr] md:items-center">
                      <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-slate-400 md:hidden">Name</p>
                        <p class="text-sm font-semibold text-slate-950">{{ record.name }}</p>
                      </div>
                      <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-slate-400 md:hidden">Number</p>
                        <p class="text-sm font-semibold text-slate-700">{{ record.number || 'No number' }}</p>
                      </div>
                      <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-slate-400 md:hidden">Date</p>
                        <p class="text-sm font-semibold text-slate-700">
                          {{ record.date ? (record.date | date:'MMMM d, y h:mm a') : 'No date' }}
                        </p>
                      </div>
                    </div>
                  </article>
                }
              } @else {
                <div class="rounded-[1.5rem] border border-dashed border-blue-200 bg-white px-6 py-12 text-center">
                  <p class="text-lg font-bold text-slate-950">No deleted {{ activeTabLabel().toLowerCase() }} yet</p>
                  <p class="mt-2 text-sm leading-6 text-slate-600">
                    Deleted {{ activeTabLabel().toLowerCase() }} records will appear here once the system logs them.
                  </p>
                </div>
              }
            </div>
          </div>
        }
      </article>
    </section>
  `
})
export class HistoryPageComponent implements OnInit {
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly activeTab = signal<HistoryTab>('payments');
  readonly history = signal<DeletedHistoryResponse>({
    payments: [],
    receipts: [],
    refunds: [],
  });

  readonly tabs: Array<{ label: string; value: HistoryTab }> = [
    { label: 'Payments', value: 'payments' },
    { label: 'Receipt', value: 'receipts' },
    { label: 'Refunds', value: 'refunds' },
  ];

  constructor(private historyService: HistoryService) {}

  ngOnInit() {
    this.loadHistory();
  }

  get activeRecords(): DeletedHistoryRecord[] {
    return this.history()[this.activeTab()] || [];
  }

  activeTabLabel(): string {
    return this.tabs.find((tab) => tab.value === this.activeTab())?.label || 'History';
  }

  setActiveTab(tab: HistoryTab) {
    this.activeTab.set(tab);
  }

  loadHistory() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.historyService.getDeletedHistory().subscribe({
      next: (response) => {
        this.history.set({
          payments: response.payments || [],
          receipts: response.receipts || [],
          refunds: response.refunds || [],
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        this.history.set({
          payments: [],
          receipts: [],
          refunds: [],
        });
        this.errorMessage.set(this.getErrorMessage(error));
        this.isLoading.set(false);
      }
    });
  }

  private getErrorMessage(error: any): string {
    const validationErrors = error?.error?.errors;

    if (validationErrors && typeof validationErrors === 'object') {
      const firstFieldError = Object.values(validationErrors).flat()[0];
      if (typeof firstFieldError === 'string') {
        return firstFieldError;
      }
    }

    return error?.error?.message || 'Unable to load deleted transaction history right now.';
  }
}
