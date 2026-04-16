import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingRecord, PaymentRecord, PaymentService } from '../../../services/payment.service';
import { ReceiptService } from '../../../services/receipt.service';

type BillFilter = 'all' | 'paid' | 'unpaid';

interface StudentBillingSummary {
  student_id: string;
  student_name: string;
  totalBills: number;
  paidBills: number;
  unpaidBills: number;
  totalBalance: number;
}

@Component({
  selector: 'app-student-bills-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="space-y-6">
      <div class="rounded-[2rem] border border-blue-100 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 p-8 text-white shadow-xl shadow-blue-200">
        <p class="text-sm uppercase tracking-[0.3em] text-blue-100">Student Bills</p>
        <h1 class="mt-3 text-3xl font-black">Student billing records</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-blue-50">
          View students with their bills.
        </p>
      </div>

      <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Billings</p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">Latest billing records</h2>
          </div>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div class="min-w-0 sm:w-72">
              <label for="billingLookupTop" class="mb-2 block text-sm font-semibold text-slate-700">Search Billing</label>
              <input
                id="billingLookupTop"
                name="billingLookupTop"
                type="text"
                [(ngModel)]="billingLookupId"
                class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="BILL-0009-85 or student name"
              />
            </div>
            <button
              type="button"
              class="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              [disabled]="isLookingUpBilling()"
              (click)="lookupBilling()"
            >
              @if (isLookingUpBilling()) {
                Searching...
              } @else {
                Search Billing
              }
            </button>
            <button
              type="button"
              class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-white"
              (click)="refreshBillings()"
            >
              Refresh Billings
            </button>
          </div>
        </div>

        @if (billingsError()) {
          <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ billingsError() }}
          </div>
        }

        @if (billingsMessage()) {
          <div class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {{ billingsMessage() }}
          </div>
        }

        @if (selectedBillingToPay) {
          <div class="mt-5 rounded-[1.5rem] border border-blue-100 bg-blue-50/70 px-5 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Record Payment</p>
                <h3 class="mt-2 text-xl font-black text-slate-950">
                  {{ selectedBillingToPay.billing_id }}
                </h3>
                <p class="mt-1 text-sm text-slate-600">
                  {{ selectedBillingToPay.student_name || 'No student name' }} - {{ selectedBillingToPay.fee_name || 'No fee name' }}
                </p>
                <p class="mt-2 text-sm text-slate-500">
                  Current balance:
                  <span class="font-semibold text-slate-900">
                    {{ (selectedBillingToPay.balance ?? selectedBillingToPay.total_fee ?? 0) | number:'1.2-2' }}
                  </span>
                </p>
              </div>

              <div class="grid gap-3 sm:min-w-[18rem]">
                <label for="paymentAmount" class="text-sm font-semibold text-slate-700">Amount</label>
                <input
                  id="paymentAmount"
                  name="paymentAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  [(ngModel)]="paymentAmount"
                  class="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter amount to pay"
                />
              </div>

              <div class="flex flex-wrap gap-3">
                <button
                  type="button"
                  class="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                  (click)="closePaymentForm()"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  [disabled]="isSubmittingBillPayment"
                  (click)="submitPayment()"
                >
                  @if (isSubmittingBillPayment) {
                    Submitting...
                  } @else {
                    Submit Payment
                  }
                </button>
              </div>
            </div>
          </div>
        }

        @if (isLoadingCreatedBillings()) {
          <div class="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-5 text-sm text-slate-600">
            Loading billing records...
          </div>
        } @else if (displayedBillings.length) {
          <div class="mt-5 overflow-hidden rounded-[1.35rem] border border-blue-100 bg-white">
            <div class="grid grid-cols-[1.15fr_1fr_1.15fr_1.05fr_0.8fr_0.7fr] gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
              <span>Billing ID</span>
              <span>Student ID</span>
              <span>Student Name</span>
              <span>Fee Name</span>
              <span class="text-right">Total Fee</span>
              <span class="text-right">Action</span>
            </div>

            <div class="divide-y divide-blue-100">
              @for (billing of displayedBillings; track billing.bill_id ?? billing.billing_id) {
                <div class="grid grid-cols-1 gap-2 px-4 py-3 text-left transition sm:grid-cols-[1.15fr_1fr_1.15fr_1.05fr_0.8fr_0.7fr] sm:items-center">
                  <span class="text-xs font-semibold text-slate-900">{{ billing.billing_id || 'Not set' }}</span>
                  <span class="text-xs font-medium text-slate-700">{{ billing.student_id || 'Not set' }}</span>
                  <span class="text-xs font-medium text-slate-700">{{ billing.student_name || 'Not set' }}</span>
                  <span class="text-xs font-semibold text-slate-900">{{ billing.fee_name || 'Not set' }}</span>
                  <span class="text-right text-xs font-semibold text-slate-900">{{ (billing.total_fee ?? 0) | number:'1.2-2' }}</span>
                  <div class="flex justify-end">
                    <button
                      type="button"
                      class="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700 transition hover:border-blue-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      [disabled]="(selectedBillingToPay?.billing_id === billing.billing_id && isSubmittingBillPayment) || isBillPaid(billing) || !(billing.total_fee ?? 0)"
                      (click)="payNow(billing)"
                    >
                      @if (selectedBillingToPay?.billing_id === billing.billing_id && isSubmittingBillPayment) {
                        <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 align-middle"></span>
                      } @else if (isBillPaid(billing)) {
                        Paid
                      } @else {
                        Pay Now
                      }
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="mt-5 rounded-[1.35rem] border border-dashed border-blue-200 bg-blue-50 px-4 py-8 text-center">
            <p class="text-base font-bold text-slate-950">No billings found</p>
            <p class="mt-2 text-sm text-slate-600">Created billings will appear here from <code>/api/billings</code>.</p>
          </div>
        }
      </article>

      <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Students</p>
              <h2 class="mt-2 text-2xl font-black text-slate-950">All students and their bill and payments</h2>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-600">
              Total students:
              <span class="font-semibold text-blue-700">{{ filteredStudents.length }}</span>
            </div>
          </div>

          <div class="mt-6">
            <label for="studentSearch" class="mb-2 block text-sm font-semibold text-slate-700">Search Student</label>
            <input
              id="studentSearch"
              name="studentSearch"
              type="text"
              [(ngModel)]="studentSearch"
              class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              placeholder="Search by student ID or student name"
            />
          </div>

          @if (studentLoadError()) {
            <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {{ studentLoadError() }}
            </div>
          }

          <div class="mt-6 space-y-3">
            @if (isLoadingStudents()) {
              <div class="rounded-2xl border border-blue-100 bg-blue-500 px-4 py-5 text-sm text-slate-600">
                Loading student billing records...
              </div>
            } @else if (filteredStudents.length) {
              @for (student of filteredStudents; track student.student_id) {
                <button
                  type="button"
                  class="w-full rounded-[1.4rem] border p-4 text-left transition"
                  [class.border-blue-200]="selectedStudentId() === student.student_id"
                  [class.bg-blue-100]="selectedStudentId() === student.student_id"
                  [class.text-blue-900]="selectedStudentId() === student.student_id"
                  [class.shadow-lg]="selectedStudentId() === student.student_id"
                  [class.shadow-blue-100]="selectedStudentId() === student.student_id"
                  [class.border-blue-100]="selectedStudentId() !== student.student_id"
                  [class.bg-blue-50]="selectedStudentId() !== student.student_id"
                  [class.text-slate-900]="selectedStudentId() !== student.student_id"
                  (click)="selectStudent(student.student_id)"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p
                        class="text-xs uppercase tracking-[0.2em]"
                        [class.text-blue-700]="selectedStudentId() === student.student_id"
                        [class.text-blue-700]="selectedStudentId() !== student.student_id"
                      >
                        {{ student.student_id }}
                      </p>
                      <h3 class="mt-2 text-lg font-black">
                        {{ student.student_name }}
                      </h3>
                    </div>

                    <span
                      class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                      [class.bg-white]="selectedStudentId() === student.student_id"
                      [class.text-blue-700]="selectedStudentId() === student.student_id"
                      [class.bg-white/70]="selectedStudentId() !== student.student_id"
                      [class.text-blue-700]="selectedStudentId() !== student.student_id"
                    >
                      {{ student.totalBills }} bills
                    </span>
                  </div>

                </button>
              }
            } @else {
              <div class="rounded-[1.5rem] border border-dashed border-blue-200 bg-blue-50 px-5 py-10 text-center">
                <p class="text-lg font-bold text-slate-950">No students found</p>
                <p class="mt-2 text-sm text-slate-600">Try another student name or ID to continue searching.</p>
              </div>
            }
          </div>
        </article>

        <div class="space-y-6">
          <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Student Bills</p>
                <h2 class="mt-2 text-2xl font-black text-slate-950">
                  {{ selectedStudent?.student_name || 'Select a student' }}
                </h2>
                <p class="mt-2 text-sm text-slate-500">
                  {{ selectedStudent?.student_id || 'Choose a student from the list to load bills' }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
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
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Loaded Bills</p>
                <p class="mt-2 whitespace-nowrap text-sm font-bold leading-none tracking-tight text-slate-950">
                  {{ displayedBills.length }}
                </p>
              </div>
              <div class="rounded-2xl border border-blue-100 bg-white px-4 py-4">
                <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Paid</p>
                <p class="mt-2 whitespace-nowrap text-sm font-bold leading-none tracking-tight text-slate-950">
                  {{ selectedStudent?.paidBills || 0 }}
                </p>
              </div>
              <div class="rounded-2xl border border-blue-100 bg-white px-4 py-4">
                <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Partial</p>
                <p class="mt-2 whitespace-nowrap text-sm font-bold leading-none tracking-tight text-slate-950">
                  {{ selectedStudent?.unpaidBills || 0 }}
                </p>
              </div>
              <div class="rounded-2xl border border-blue-100 bg-white px-4 py-4">
                <p class="text-xs uppercase tracking-[0.2em] text-blue-700">Total Balance</p>
                <p class="mt-2 whitespace-nowrap text-sm font-bold leading-none tracking-tight text-slate-950">
                  {{ (selectedStudent?.totalBalance || 0) | number:'1.2-2' }}
                </p>
              </div>
            </div>

            <div class="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <label for="billSearch" class="mb-2 block text-sm font-semibold text-slate-700">Search Bills</label>
                <input
                  id="billSearch"
                  name="billSearch"
                  type="text"
                  [(ngModel)]="billSearch"
                  class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Search by billing ID, fee name, or method"
                />
              </div>
              <div>
                <label for="billingLookup" class="mb-2 block text-sm font-semibold text-slate-700">Billing ID Lookup</label>
                <div class="flex gap-3">
                  <input
                    id="billingLookup"
                    name="billingLookup"
                    type="text"
                    [(ngModel)]="billingLookupId"
                    class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="BILL-202"
                  />
                  <button
                    type="button"
                    [disabled]="isLookingUpBilling()"
                    class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    (click)="lookupBilling()"
                  >
                    Lookup
                  </button>
                </div>
              </div>
            </div>

            @if (billsMessage()) {
              <div class="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                {{ billsMessage() }}
              </div>
            }

            @if (billsError()) {
              <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {{ billsError() }}
              </div>
            }

            <div class="mt-6 space-y-4">
              @if (isLoadingBills()) {
                <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-5 text-sm text-slate-600">
                  Loading student bills...
                </div>
              } @else if (displayedBills.length) {
                @for (bill of displayedBills; track bill.payment_id ?? bill.billing_id ?? bill.student_id) {
                  <article class="rounded-[1.5rem] border border-blue-100 bg-blue-50/60 p-5">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-blue-700">{{ bill.fee_name }}</p>
                        <h3 class="mt-2 text-xl font-black text-slate-950">{{ bill.billing_id || 'No billing ID' }}</h3>
                        <p class="mt-1 text-sm text-slate-500">{{ bill.payment_method || 'Not set' }} - {{ bill.created_at ? (bill.created_at | date:'MMMM d, y') : 'No date' }}</p>
                      </div>
                      <div class="flex items-center gap-2 self-start">
                        <span
                          class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                          [class.border]="true"
                          [class.border-emerald-200]="isBillPaid(bill)"
                          [class.bg-emerald-50]="isBillPaid(bill)"
                          [class.text-emerald-700]="isBillPaid(bill)"
                          [class.border-amber-200]="!isBillPaid(bill)"
                          [class.bg-amber-50]="!isBillPaid(bill)"
                          [class.text-amber-700]="!isBillPaid(bill)"
                        >
                          {{ getDisplayStatus(bill.status) }}
                        </span>
                        <button
                          type="button"
                          class="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          [disabled]="archivingBillingId() === (bill.billing_id || '')"
                          [attr.aria-label]="'Delete bill ' + (bill.billing_id || '')"
                          [title]="'Delete ' + (bill.billing_id || '')"
                          (click)="deleteBill(bill)"
                        >
                          @if (archivingBillingId() === (bill.billing_id || '')) {
                            Deleting...
                          } @else {
                            Delete
                          }
                        </button>
                      </div>
                    </div>

                    <div class="mt-5 grid gap-3 md:grid-cols-4">
                      <div class="rounded-2xl bg-white px-4 py-3">
                        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Total Fee</p>
                        <p class="mt-2 text-sm font-semibold text-slate-900">{{ bill.total_fee | number:'1.2-2' }}</p>
                      </div>
                      <div class="rounded-2xl bg-white px-4 py-3">
                        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Amount Paid</p>
                        <p class="mt-2 text-sm font-semibold text-slate-900">{{ bill.total_amount !== null && bill.total_amount !== undefined ? (bill.total_amount | number:'1.2-2') : 'Not set' }}</p>
                      </div>
                      <div class="rounded-2xl bg-white px-4 py-3">
                        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Balance</p>
                        <p class="mt-2 text-sm font-semibold text-slate-900">{{ (bill.balance ?? 0) | number:'1.2-2' }}</p>
                      </div>
                      <div class="rounded-2xl bg-white px-4 py-3">
                        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Receipt</p>
                        <p class="mt-2 text-sm font-semibold text-slate-900">{{ bill.receipt_number || 'Not issued yet' }}</p>
                      </div>
                    </div>
                  </article>
                }
              } @else {
                <div class="rounded-[1.5rem] border border-dashed border-blue-200 bg-blue-50 px-5 py-10 text-center">
                  <p class="text-lg font-bold text-slate-950">No bills to show</p>
                  <p class="mt-2 text-sm text-slate-600">Choose a student and filter to view matching billing records.</p>
                </div>
              }
            </div>
          </article>

          <article class="rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-sm shadow-blue-100">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Billing Lookup</p>
                <h2 class="mt-2 text-2xl font-black text-slate-950">Specific billing result</h2>
              </div>
              @if (isLookingUpBilling()) {
                <span class="text-sm font-medium text-blue-700">Searching...</span>
              }
            </div>

            @if (billingLookupError()) {
              <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {{ billingLookupError() }}
              </div>
            }

            @if (billingLookup()) {
              <div class="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50/70 p-5">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-blue-700">{{ billingLookup()?.student_id }}</p>
                    <h3 class="mt-2 text-xl font-black text-slate-950">{{ billingLookup()?.billing_id }}</h3>
                    <p class="mt-1 text-sm text-slate-500">{{ billingLookup()?.student_name }}</p>
                  </div>
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    [class.border]="true"
                    [class.border-emerald-200]="isBillPaid(billingLookup())"
                    [class.bg-emerald-50]="isBillPaid(billingLookup())"
                    [class.text-emerald-700]="isBillPaid(billingLookup())"
                    [class.border-amber-200]="!isBillPaid(billingLookup())"
                    [class.bg-amber-50]="!isBillPaid(billingLookup())"
                    [class.text-amber-700]="!isBillPaid(billingLookup())"
                  >
                    {{ getDisplayStatus(billingLookup()?.status) }}
                  </span>
                </div>

                <div class="mt-5 grid gap-3 md:grid-cols-4">
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Fee Name</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ billingLookup()?.fee_name }}</p>
                  </div>
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Total Fee</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ billingLookup()?.total_fee | number:'1.2-2' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Amount Paid</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ billingLookup()?.total_amount !== null && billingLookup()?.total_amount !== undefined ? (billingLookup()?.total_amount | number:'1.2-2') : 'Not set' }}</p>
                  </div>
                  <div class="rounded-2xl bg-white px-4 py-3">
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Balance</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ (billingLookup()?.balance ?? 0) | number:'1.2-2' }}</p>
                  </div>
                </div>
              </div>
            } @else {
              <div class="mt-6 rounded-[1.5rem] border border-dashed border-blue-200 bg-blue-50 px-5 py-10 text-center">
                <p class="text-lg font-bold text-slate-950">No billing selected</p>
                <p class="mt-2 text-sm text-slate-600">Search a billing ID to load one specific billing record here.</p>
              </div>
            }
          </article>
        </div>
      </div>
    </section>
  `
})
export class StudentBillsPageComponent implements OnInit {
  readonly isLoadingStudents = signal(false);
  readonly isLoadingCreatedBillings = signal(false);
  readonly isLoadingBills = signal(false);
  readonly isLookingUpBilling = signal(false);
  readonly archivingBillingId = signal<string | null>(null);
  readonly selectedStudentId = signal<string | null>(null);
  readonly activeFilter = signal<BillFilter>('all');
  readonly studentLoadError = signal<string | null>(null);
  readonly billingsError = signal<string | null>(null);
  readonly billingsMessage = signal<string | null>(null);
  readonly billsError = signal<string | null>(null);
  readonly billsMessage = signal<string | null>(null);
  readonly billingLookupError = signal<string | null>(null);
  readonly studentSummaries = signal<StudentBillingSummary[]>([]);
  readonly studentBills = signal<PaymentRecord[]>([]);
  readonly createdBillings = signal<BillingRecord[]>([]);
  readonly billingLookup = signal<BillingRecord | null>(null);
  selectedBillingToPay: BillingRecord | null = null;
  paymentAmount = '';
  isSubmittingBillPayment = false;

  readonly filterOptions: Array<{ label: string; value: BillFilter }> = [
    { label: 'All Bills', value: 'all' },
    { label: 'Paid', value: 'paid' },
    { label: 'Partial', value: 'unpaid' }
  ];

  studentSearch = '';
  billSearch = '';
  billingLookupId = '';
  billingSearchQuery = '';

  constructor(
    private paymentService: PaymentService,
    private receiptService: ReceiptService
  ) {}

  ngOnInit() {
    this.loadStudents();
    this.loadBillings();
  }

  get filteredStudents(): StudentBillingSummary[] {
    const query = this.studentSearch.trim().toLowerCase();

    if (!query) {
      return this.studentSummaries();
    }

    return this.studentSummaries().filter((student) =>
      student.student_id.toLowerCase().includes(query) ||
      student.student_name.toLowerCase().includes(query)
    );
  }

  get selectedStudent(): StudentBillingSummary | null {
    return this.studentSummaries().find((student) => student.student_id === this.selectedStudentId()) || null;
  }

  get displayedBills(): PaymentRecord[] {
    const query = this.billSearch.trim().toLowerCase();

    if (!query) {
      return this.studentBills();
    }

    return this.studentBills().filter((bill) =>
      (bill.billing_id || '').toLowerCase().includes(query) ||
      bill.fee_name.toLowerCase().includes(query) ||
      (bill.payment_method || '').toLowerCase().includes(query)
    );
  }

  get displayedBillings(): BillingRecord[] {
    const lookup = this.billingLookup();
    const query = this.billingSearchQuery.trim().toLowerCase();

    if (lookup) {
      return [lookup];
    }

    if (!query) {
      return this.createdBillings();
    }

    return this.filterCreatedBillings(query);
  }

  loadStudents() {
    this.isLoadingStudents.set(true);
    this.studentLoadError.set(null);

    this.paymentService.getPayments().subscribe({
      next: (payments) => {
        const summaries = this.buildStudentSummaries(payments);
        this.studentSummaries.set(summaries);
        this.isLoadingStudents.set(false);

        if (summaries.length) {
          const selected = this.selectedStudentId();
          const targetStudentId = selected && summaries.some((student) => student.student_id === selected)
            ? selected
            : summaries[0].student_id;
          this.selectStudent(targetStudentId);
        } else {
          this.selectedStudentId.set(null);
          this.studentBills.set([]);
        }
      },
      error: (error) => {
        this.studentLoadError.set(this.getErrorMessage(error, 'Unable to load student billing records.'));
        this.isLoadingStudents.set(false);
      }
    });
  }

  loadBillings() {
    this.isLoadingCreatedBillings.set(true);
    this.billingsError.set(null);
    this.billingsMessage.set(null);
    this.billingLookup.set(null);

    this.paymentService.getBillings().subscribe({
      next: (billings) => {
        this.createdBillings.set(this.sortBillings(billings));
        this.isLoadingCreatedBillings.set(false);
      },
      error: (error) => {
        this.createdBillings.set([]);
        this.billingsError.set(this.getErrorMessage(error, 'Unable to load created billings.'));
        this.isLoadingCreatedBillings.set(false);
      }
    });
  }

  refreshBillings() {
    this.billingLookupId = '';
    this.billingSearchQuery = '';
    this.billingLookup.set(null);
    this.closePaymentForm();
    this.loadBillings();
  }

  payNow(billing: BillingRecord) {
    const billingId = billing.billing_id?.trim();

    if (!billingId) {
      this.billingsError.set('Billing ID is required to open payment details.');
      return;
    }

    this.billingsError.set(null);
    this.billingsMessage.set(null);
    this.selectedBillingToPay = billing;
    this.paymentAmount = '';
  }

  closePaymentForm() {
    this.selectedBillingToPay = null;
    this.paymentAmount = '';
    this.isSubmittingBillPayment = false;
  }

  submitPayment() {
    const billing = this.selectedBillingToPay;

    if (!billing) {
      return;
    }

    const billingId = billing.billing_id?.trim();
    const amount = Number(this.paymentAmount);

    if (!billingId) {
      this.billingsError.set('Billing ID is required to process payment.');
      return;
    }

    if (!(amount > 0)) {
      this.billingsError.set('Please enter a valid payment amount.');
      return;
    }

    const confirmed = window.confirm(`Submit payment of ${amount.toFixed(2)} for ${billingId}?`);

    if (!confirmed) {
      return;
    }

    this.billingsError.set(null);
    this.billingsMessage.set(null);
    this.isSubmittingBillPayment = true;

    this.paymentService.payBilling(billingId, amount).subscribe({
      next: (response) => {
        this.isSubmittingBillPayment = false;
        this.closePaymentForm();
        const baseMessage = response.message || 'Payment recorded successfully.';
        this.billingsMessage.set(baseMessage);

        this.storeLatestPaymentContext(response.payment, response.bill);
        this.generateReceiptAfterPayment(billingId, baseMessage);

        this.loadBillings();
        this.loadStudents();

        const closedBilling = (response.bill?.status || '').trim().toLowerCase() === 'paid';

        if (closedBilling) {
          this.billingLookupId = '';
          this.billingLookup.set(null);
        } else if (this.billingLookupId.trim()) {
          this.lookupBilling();
        }
      },
      error: (error) => {
        this.billingsError.set(this.getErrorMessage(error, 'Unable to record payment.'));
        this.isSubmittingBillPayment = false;
      }
    });
  }

  selectStudent(studentId: string) {
    this.selectedStudentId.set(studentId);
    this.billSearch = '';
    this.loadBillsForSelectedStudent(this.activeFilter());
  }

  setFilter(filter: BillFilter) {
    this.activeFilter.set(filter);
    this.loadBillsForSelectedStudent(filter);
  }

  lookupBilling() {
    const lookupValue = this.billingLookupId.trim();

    this.billingLookupError.set(null);
    this.billingLookup.set(null);
    this.billingSearchQuery = '';
    this.billingsMessage.set(null);

    if (!lookupValue) {
      this.billingLookupError.set('Please enter a billing ID or student name to search.');
      return;
    }

    const localMatches = this.filterCreatedBillings(lookupValue);

    if (localMatches.length) {
      this.billingSearchQuery = lookupValue;
      this.billingsMessage.set(
        `${localMatches.length} billing record${localMatches.length === 1 ? '' : 's'} found.`
      );
      return;
    }

    this.isLookingUpBilling.set(true);

    this.paymentService.getBillingById(lookupValue).subscribe({
      next: (response) => {
        this.billingLookup.set(response.billing);
        this.isLookingUpBilling.set(false);
      },
      error: (error) => {
        this.billingLookupError.set(this.getErrorMessage(error, 'Unable to load that billing record.'));
        this.isLookingUpBilling.set(false);
      }
    });
  }

  isBillPaid(bill: BillingRecord | null): boolean {
    if (!bill) {
      return false;
    }

    return Number(bill.balance ?? 0) <= 0;
  }

  getDisplayStatus(status?: string | null): string {
    if (!status) {
      return 'Pending';
    }

    return status.trim().toLowerCase() === 'unpaid' ? 'Partial' : status;
  }

  deleteBill(bill: PaymentRecord) {
    const billingId = bill.billing_id?.trim();
    const studentId = bill.student_id?.trim();

    if (!billingId || !studentId) {
      this.billsError.set('Billing ID and student ID are required to delete this bill.');
      return;
    }

    const confirmed = window.confirm(`Delete billing ${billingId} for ${bill.student_name}?`);

    if (!confirmed) {
      return;
    }

    this.billsError.set(null);
    this.billsMessage.set(null);
    this.archivingBillingId.set(billingId);

    this.paymentService.archivePayment(studentId, billingId).subscribe({
      next: (response) => {
        this.studentBills.set(this.studentBills().filter((item) => item.billing_id !== billingId));
        this.billsMessage.set(response.message || 'Bill deleted successfully.');
        this.archivingBillingId.set(null);

        if (this.billingLookup()?.billing_id === billingId) {
          this.billingLookupId = '';
          this.billingLookup.set(null);
        }

        this.loadStudents();
      },
      error: (error) => {
        this.billsError.set(this.getErrorMessage(error, 'Unable to delete this bill.'));
        this.archivingBillingId.set(null);
      }
    });
  }

  private loadBillsForSelectedStudent(filter: BillFilter) {
    const studentId = this.selectedStudentId();

    if (!studentId) {
      this.studentBills.set([]);
      return;
    }

    this.isLoadingBills.set(true);
    this.billsError.set(null);
    this.billsMessage.set(null);

    const request =
      filter === 'paid'
        ? this.paymentService.getPaidBillsByStudent(studentId)
        : filter === 'unpaid'
          ? this.paymentService.getUnpaidBillsByStudent(studentId)
          : this.paymentService.getBillsByStudent(studentId);

    request.subscribe({
      next: (response) => {
        this.studentBills.set(this.sortBills(response.payments));
        this.isLoadingBills.set(false);
        this.billsMessage.set(this.getBillsMessage(filter, response.payments.length, studentId));
      },
      error: (error) => {
        const message = error?.error?.message;

        if (message && (
          message.includes('No paid billings') ||
          message.includes('No unpaid billings') ||
          message.includes('No billing records')
        )) {
          this.studentBills.set([]);
          this.billsMessage.set(this.getDisplayMessage(message));
          this.isLoadingBills.set(false);
          return;
        }

        this.billsError.set(this.getErrorMessage(error, 'Unable to load student bills.'));
        this.studentBills.set([]);
        this.isLoadingBills.set(false);
      }
    });
  }

  private buildStudentSummaries(payments: PaymentRecord[]): StudentBillingSummary[] {
    const grouped = new Map<string, StudentBillingSummary>();

    for (const payment of payments) {
      const existing = grouped.get(payment.student_id);
      const isPaid = Number(payment.balance ?? 0) <= 0;
      const balance = Number(payment.balance ?? 0);

      if (existing) {
        existing.totalBills += 1;
        existing.paidBills += isPaid ? 1 : 0;
        existing.unpaidBills += isPaid ? 0 : 1;
        existing.totalBalance += balance;
        continue;
      }

      grouped.set(payment.student_id, {
        student_id: payment.student_id,
        student_name: payment.student_name,
        totalBills: 1,
        paidBills: isPaid ? 1 : 0,
        unpaidBills: isPaid ? 0 : 1,
        totalBalance: balance
      });
    }

    return [...grouped.values()].sort((first, second) => first.student_name.localeCompare(second.student_name));
  }

  private sortBills(payments: PaymentRecord[]): PaymentRecord[] {
    return [...payments].sort((first, second) => (second.payment_id || 0) - (first.payment_id || 0));
  }

  private sortBillings(billings: BillingRecord[]): BillingRecord[] {
    return [...billings].sort((first, second) => (second.bill_id || 0) - (first.bill_id || 0));
  }

  private filterCreatedBillings(query: string): BillingRecord[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return this.createdBillings();
    }

    return this.createdBillings().filter((billing) =>
      (billing.billing_id || '').toLowerCase().includes(normalizedQuery) ||
      (billing.student_name || '').toLowerCase().includes(normalizedQuery) ||
      (billing.student_id || '').toLowerCase().includes(normalizedQuery) ||
      (billing.fee_name || '').toLowerCase().includes(normalizedQuery)
    );
  }

  private storeLatestPaymentContext(payment?: PaymentRecord, bill?: BillingRecord) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const billingId = String(payment?.billing_id ?? bill?.billing_id ?? '').trim();
    const studentId = String(payment?.student_id ?? bill?.student_id ?? '').trim();
    const studentName = String(payment?.student_name ?? bill?.student_name ?? '').trim();

    if (!billingId || !studentId || !studentName) {
      return;
    }

    try {
      localStorage.setItem('cashierweb.latest-payment-context', JSON.stringify({
        billing_id: billingId,
        student_id: studentId,
        student_name: studentName,
        fee_name: String(payment?.fee_name ?? bill?.fee_name ?? ''),
        total_fee: this.toNumberOrNull(payment?.total_fee, bill?.total_fee),
        total_amount: this.toNumberOrNull(payment?.total_amount, bill?.total_amount),
        payment_method: String(payment?.payment_method ?? bill?.payment_method ?? 'Cash'),
        status: String(payment?.status ?? bill?.status ?? ''),
        balance: this.toNumberOrNull(payment?.balance, bill?.balance),
        created_at: String(payment?.created_at ?? bill?.updated_at ?? bill?.created_at ?? '')
      }));
    } catch {
      // Keep payment submission flowing even when local storage is unavailable.
    }
  }

  private toNumberOrNull(primary: unknown, fallback: unknown): number | null {
    if (primary === null || primary === undefined) {
      const fallbackNumber = Number(fallback);
      return Number.isFinite(fallbackNumber) ? fallbackNumber : null;
    }

    if (typeof primary === 'string' && !primary.trim()) {
      const fallbackNumber = Number(fallback);
      return Number.isFinite(fallbackNumber) ? fallbackNumber : null;
    }

    const primaryNumber = Number(primary);

    if (Number.isFinite(primaryNumber)) {
      return primaryNumber;
    }

    const fallbackNumber = Number(fallback);
    return Number.isFinite(fallbackNumber) ? fallbackNumber : null;
  }

  private generateReceiptAfterPayment(billingId: string, baseMessage: string) {
    this.receiptService.generateReceiptByBillingId(billingId).subscribe({
      next: async (response) => {
        const blob = response.body;

        if (!blob) {
          this.billingsMessage.set(`${baseMessage} Payment saved, but receipt generation returned an empty file.`);
          return;
        }

        const receipt = await this.receiptService.parseReceiptBlob(blob);

        if (!receipt) {
          this.billingsMessage.set(`${baseMessage} Payment saved, but the printable receipt details could not be read.`);
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

        this.billingsMessage.set(message);
      },
      error: (error) => {
        this.billingsMessage.set(
          `${baseMessage} Payment saved, but receipt auto-generation failed: ${this.getErrorMessage(error, 'Unable to generate receipt right now.')}`
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

  private getBillsMessage(filter: BillFilter, count: number, studentId: string): string {
    if (filter === 'paid') {
      return `${count} paid bill${count === 1 ? '' : 's'} loaded for ${studentId}.`;
    }

    if (filter === 'unpaid') {
      return `${count} partial bill${count === 1 ? '' : 's'} loaded for ${studentId}.`;
    }

    return `${count} total bill${count === 1 ? '' : 's'} loaded for ${studentId}.`;
  }

  private getDisplayMessage(message: string): string {
    return message
      .replace(/\bUnpaid\b/g, 'Partial')
      .replace(/\bunpaid\b/g, 'partial');
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
