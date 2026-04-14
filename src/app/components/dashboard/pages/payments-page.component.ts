import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingRecord, PaymentRecord, PaymentService } from '../../../services/payment.service';
import { StudentRecord, StudentService } from '../../../services/student.service';
import { ReceiptService } from '../../../services/receipt.service';

@Component({
  selector: 'app-payments-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="space-y-5">
      <div class="rounded-[1.75rem] border border-blue-100 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 p-6 text-white shadow-xl shadow-blue-200">
        <p class="text-xs uppercase tracking-[0.3em] text-blue-100">Payments</p>
        <h1 class="mt-2 text-xl font-black">Accept payments</h1>
      </div>

      <div class="grid gap-5 xl:grid-cols-1">
        <article class="rounded-[1.5rem] border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">Payment Form</p>
              <h2 class="mt-2 text-xl font-black text-slate-950">Enter student payment details</h2>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-slate-600">
              Receipt number:
              <span class="font-semibold text-blue-700">Generated later when receipt is issued</span>
            </div>
          </div>

          @if (successMessage()) {
            <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              {{ successMessage() }}
            </div>
          }

          @if (errorMessage()) {
            <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {{ errorMessage() }}
            </div>
          }

          <div class="mt-5 rounded-[1.35rem] border border-blue-100 bg-blue-50/80 p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">Student List</p>
                <h3 class="mt-1 text-lg font-black text-slate-950">Click a student to fill the payment form</h3>
              </div>
              <button
                type="button"
                class="rounded-2xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                [disabled]="isLoadingStudents()"
                (click)="loadStudents()"
              >
                @if (isLoadingStudents()) {
                  <span class="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></span>
                }
                Refresh Students
              </button>
            </div>

            <div class="mt-4">
              <label for="studentSearch" class="mb-2 block text-xs font-semibold text-slate-700">Search Student</label>
              <input
                id="studentSearch"
                name="studentSearch"
                type="text"
                [(ngModel)]="studentSearch"
                class="w-full rounded-2xl border border-blue-100 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Search by student ID or name"
              />
            </div>

            @if (studentLoadError()) {
              <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {{ studentLoadError() }}
              </div>
            }

            <div class="mt-4 overflow-hidden rounded-[1.25rem] border border-blue-100 bg-white">
              <div class="hidden grid-cols-[1.2fr_1.8fr_auto] gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700 sm:grid">
                <span>Student ID</span>
                <span>Student Name</span>
                <span class="text-right">Action</span>
              </div>

              @if (isLoadingStudents()) {
                <div class="px-4 py-5 text-xs text-slate-600">Loading students...</div>
              } @else if (filteredStudents.length) {
                <div class="max-h-72 overflow-auto divide-y divide-blue-100">
                  @for (student of filteredStudents; track student.student_id) {
                    <button
                      type="button"
                      class="grid w-full grid-cols-1 gap-2 px-4 py-3 text-left transition hover:bg-blue-50 sm:grid-cols-[1.2fr_1.8fr_auto] sm:items-center"
                      [class.bg-blue-50]="selectedStudentId() === student.student_id"
                      (click)="selectStudent(student)"
                    >
                      <span class="text-xs font-semibold text-slate-900">{{ student.student_id }}</span>
                      <span class="text-xs font-medium text-slate-700">{{ student.student_name }}</span>
                      <span class="text-right text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                        {{ selectedStudentId() === student.student_id ? 'Selected' : 'Select' }}
                      </span>
                    </button>
                  }
                </div>
              } @else {
                <div class="px-4 py-5 text-xs text-slate-600">
                  No students found.
                </div>
              }
            </div>
          </div>

          <form class="mt-5 grid gap-4 sm:grid-cols-2" (ngSubmit)="submitPayment()">
            <div>
              <label for="billingId" class="mb-2 block text-xs font-semibold text-slate-700">Billing ID</label>
              <input
                id="billingId"
                name="billingId"
                type="text"
                required
                [(ngModel)]="form.billing_id"
                (input)="clearFeedback()"
                readonly
                class="w-full rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-slate-900 outline-none"
                placeholder="Select a student to generate billing ID"
              />
            </div>

            <div>
              <label for="studentId" class="mb-2 block text-xs font-semibold text-slate-700">Student ID</label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                required
                [(ngModel)]="form.student_id"
                (input)="clearFeedback()"
                class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="STU-20269"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="studentName" class="mb-2 block text-xs font-semibold text-slate-700">Student Name</label>
              <input
                id="studentName"
                name="studentName"
                type="text"
                required
                [(ngModel)]="form.student_name"
                (input)="clearFeedback()"
                class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="student name"
              />
            </div>

            <div>
              <label for="feeName" class="mb-2 block text-xs font-semibold text-slate-700">Fee Name</label>
              <input
                id="feeName"
                name="feeName"
                type="text"
                required
                [(ngModel)]="form.fee_name"
                (input)="clearFeedback()"
                class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Fee Name"
              />
            </div>

            <div>
              <label for="totalFee" class="mb-2 block text-xs font-semibold text-slate-700">Total Fee</label>
              <input
                id="totalFee"
                name="totalFee"
                type="number"
                min="0"
                step="0.01"
                required
                [(ngModel)]="form.total_fee"
                (input)="clearFeedback()"
                class="w-full rounded-2xl border border-blue-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="0.00"
              />
            </div>

            <div>
              <label for="receiptNumber" class="mb-2 block text-xs font-semibold text-slate-700">Receipt Number</label>
              <input
                id="receiptNumber"
                name="receiptNumber"
                type="text"
                [value]="receiptPreview"
                readonly
                class="w-full rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-slate-500 outline-none"
              />
            </div>

            <div class="sm:col-span-2 grid gap-3 lg:grid-cols-3">
              <div class="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Status Preview</p>
                <p class="mt-1.5 text-base font-bold text-slate-950">{{ statusPreview }}</p>
              </div>
              <div class="rounded-2xl border border-blue-100 bg-white px-3 py-2.5">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Balance Preview</p>
                <p class="mt-1.5 text-base font-bold text-slate-950">{{ balancePreview | number:'1.2-2' }}</p>
              </div>
            </div>

            @if (balancePreview < 0) {
              <div class="sm:col-span-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                Overpayment detected. Refund credit preview:
                <span class="font-semibold">{{ (-balancePreview) | number:'1.2-2' }}</span>
              </div>
            }

            <div class="sm:col-span-2 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="submit"
                [disabled]="isSubmitting()"
                class="flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                @if (isSubmitting()) {
                  <span class="mr-2.5 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                }
                Create Bill
              </button>

              <button
                type="button"
                class="rounded-2xl border border-blue-200 bg-white px-5 py-2.5 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                (click)="resetForm()"
              >
                Clear Form
              </button>
            </div>
          </form>
        </article>
      </div>

    </section>
  `
})
export class PaymentsPageComponent implements OnInit {
  readonly isSubmitting = signal(false);
  readonly isLoadingPayments = signal(false);
  readonly isLoadingBillings = signal(false);
  readonly isLoadingStudents = signal(false);
  readonly isSavingEdit = signal(false);
  readonly archivingBillingId = signal<string | null>(null);
  readonly editingBillingId = signal<string | null>(null);
  readonly selectedStudentId = signal<string | null>(null);
  readonly showEditAdditionalAmount = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly listSuccessMessage = signal<string | null>(null);
  readonly listErrorMessage = signal<string | null>(null);
  readonly recentPayments = signal<PaymentRecord[]>([]);
  readonly billings = signal<BillingRecord[]>([]);
  readonly studentLoadError = signal<string | null>(null);
  readonly students = signal<StudentRecord[]>([]);

  studentSearch = '';
  form = this.createInitialForm();
  editForm = this.createInitialEditForm();

  constructor(
    private paymentService: PaymentService,
    private studentService: StudentService,
    private receiptService: ReceiptService
  ) {}

  ngOnInit() {
    this.loadStudents();
    this.loadBillings();
  }

  get filteredStudents(): StudentRecord[] {
    const query = this.studentSearch.trim().toLowerCase();

    if (!query) {
      return this.students();
    }

    return this.students().filter((student) =>
      student.student_id.toLowerCase().includes(query) ||
      student.student_name.toLowerCase().includes(query)
    );
  }

  get totalFeeValue(): number {
    return Number(this.form.total_fee || 0);
  }

  get totalAmountValue(): number {
    return Number(this.form.total_amount || 0);
  }

  get balancePreview(): number {
    const balance = this.totalFeeValue - this.totalAmountValue;
    return balance;
  }

  private get computedStatusPreview(): string {
    return this.balancePreview <= 0 && this.totalFeeValue > 0 ? 'Paid' : 'Unpaid';
  }

  get statusPreview(): string {
    return this.getDisplayStatus(this.computedStatusPreview);
  }

  get receiptPreview(): string {
    return 'Generated after receipt processing';
  }

  loadStudents() {
    this.studentLoadError.set(null);
    this.isLoadingStudents.set(true);

    this.studentService.getStudents().subscribe({
      next: (students) => {
        this.students.set(this.sortStudents(students));
        this.isLoadingStudents.set(false);
      },
      error: (error) => {
        this.students.set([]);
        this.studentLoadError.set(this.getStudentErrorMessage(error));
        this.isLoadingStudents.set(false);
      }
    });
  }

  selectStudent(student: StudentRecord) {
    this.selectedStudentId.set(student.student_id);
    this.form.student_id = student.student_id;
    this.form.student_name = student.student_name;
    this.form.billing_id = this.generateBillingId(student);
    this.clearFeedback();
  }

  getEditBalancePreview(payment: PaymentRecord): number {
    const currentAmount = Number(this.editForm.total_amount || 0);
    const additionalAmount = Number(this.editForm.additional_amount || 0);
    const balance = Number(payment.total_fee || 0) - (currentAmount + additionalAmount);
    return balance;
  }

  getEditStatusPreview(payment: PaymentRecord): string {
    const status = this.getEditBalancePreview(payment) <= 0 && Number(payment.total_fee || 0) > 0 ? 'Paid' : 'Unpaid';
    return this.getDisplayStatus(status);
  }

  getDisplayStatus(status?: string | null): string {
    if (!status) {
      return 'Pending';
    }

    return status.trim().toLowerCase() === 'unpaid' ? 'Partial' : status;
  }

  editAmountExceeded(payment: PaymentRecord): boolean {
    return Number(this.editForm.total_amount || 0) > Number(payment.total_fee || 0) && Number(payment.total_fee || 0) > 0;
  }

  submitPayment() {
  this.clearFeedback();

  const billingId = this.form.billing_id?.trim() || this.generateBillingIdFromCurrentSelection();
  this.form.billing_id = billingId;

  // Validation: We allow balancePreview to be negative (overpayment)
  if (!billingId || !this.form.student_id || !this.form.student_name || !this.form.fee_name) {
    this.errorMessage.set('Please complete all required bill details.');
    return;
  }

  if (this.totalFeeValue <= 0) {
    this.errorMessage.set('Please enter a valid total fee.');
    return;
  }

  this.isSubmitting.set(true);

  this.paymentService.createBill({
    billing_id: billingId,
    student_id: this.form.student_id.trim(),
    student_name: this.form.student_name.trim(),
    fee_name: this.form.fee_name.trim(),
    total_fee: this.totalFeeValue,
    total_amount: this.totalAmountValue, // Ensure amount paid is sent
    payment_method: this.form.payment_method || 'Cash',
    status: this.computedStatusPreview,
    receipt_number: null
  }).subscribe({
    next: (response) => {
      this.successMessage.set(response.message || 'Bill created and processing receipt...');
      
      // 2. Trigger Auto-Receipt Generation
      this.autoGenerateAndDownloadReceipt(billingId);
      
      this.loadBillings();
      this.resetForm();
      this.isSubmitting.set(false);
    },
    error: (error) => {
      this.errorMessage.set(this.getErrorMessage(error));
      this.isSubmitting.set(false);
    }
  });
}

private autoGenerateAndDownloadReceipt(billingId: string) {
  this.receiptService.generateReceiptByBillingId(billingId).subscribe({
    next: (response) => {
      const blob = response.body;
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${billingId}.pdf`; // Adjust extension based on your API (PDF/JSON)
        a.click();
        window.URL.revokeObjectURL(url);
      }
    },
    error: (err) => console.error('Auto-receipt failed', err)
  });
}

  loadPayments() {
    this.loadBillings();
  }

  loadBillings() {
    this.clearListFeedback();
    this.isLoadingBillings.set(true);

    this.paymentService.getBillings().subscribe({
      next: (billings) => {
        this.billings.set(this.sortBillings(billings));
        this.isLoadingBillings.set(false);
      },
      error: (error) => {
        this.billings.set([]);
        this.listErrorMessage.set(this.getErrorMessage(error));
        this.isLoadingBillings.set(false);
      }
    });
  }

  resetForm() {
    this.form = this.createInitialForm();
    this.selectedStudentId.set(null);
  }

  clearFeedback() {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  clearListFeedback() {
    this.listSuccessMessage.set(null);
    this.listErrorMessage.set(null);
  }

  startEdit(payment: PaymentRecord) {
    if (!payment.billing_id) {
      this.listErrorMessage.set('This payment does not have a billing ID for editing.');
      return;
    }

    this.clearListFeedback();
    this.editingBillingId.set(payment.billing_id);
    this.showEditAdditionalAmount.set(false);
    this.editForm = {
      total_amount: Number(payment.total_amount || 0),
      additional_amount: null,
      payment_method: payment.payment_method || 'Cash'
    };
  }

  cancelEdit() {
    this.editingBillingId.set(null);
    this.isSavingEdit.set(false);
    this.showEditAdditionalAmount.set(false);
    this.editForm = this.createInitialEditForm();
  }

  saveEdit(payment: PaymentRecord) {
    if (!payment.billing_id) {
      this.listErrorMessage.set('Billing ID is required to update this payment.');
      return;
    }

    const totalAmount = Number(this.editForm.total_amount || 0) + Number(this.editForm.additional_amount || 0);
    const confirmed = window.confirm(
      `Update payment for billing ${payment.billing_id} to ${totalAmount.toFixed(2)}?`
    );

    if (!confirmed) {
      return;
    }

    this.clearListFeedback();
    this.isSavingEdit.set(true);

    this.paymentService.updateStudentBill(payment.student_id, payment.billing_id, {
      total_amount: totalAmount,
      payment_method: this.editForm.payment_method
    }).subscribe({
      next: (response) => {
        if (response.payment) {
          this.replacePayment(response.payment);
        } else {
          this.loadPayments();
        }

        this.listSuccessMessage.set(response.message || 'Payment updated successfully.');
        this.cancelEdit();
      },
      error: (error) => {
        this.listErrorMessage.set(this.getErrorMessage(error));
        this.isSavingEdit.set(false);
      }
    });
  }

  archivePayment(payment: PaymentRecord) {
    if (!payment.billing_id) {
      this.listErrorMessage.set('Billing ID is required to archive this payment.');
      return;
    }

    const confirmed = window.confirm(`Archive billing ${payment.billing_id} for ${payment.student_name}?`);

    if (!confirmed) {
      return;
    }

    this.clearListFeedback();
    this.archivingBillingId.set(payment.billing_id);

    this.paymentService.archivePayment(payment.student_id, payment.billing_id).subscribe({
      next: (response) => {
        this.recentPayments.set(
          this.recentPayments().filter((item) => item.billing_id !== payment.billing_id)
        );

        if (this.editingBillingId() === payment.billing_id) {
          this.cancelEdit();
        }

        this.listSuccessMessage.set(response.message || 'Payment archived successfully.');
        this.archivingBillingId.set(null);
      },
      error: (error) => {
        this.listErrorMessage.set(this.getErrorMessage(error));
        this.archivingBillingId.set(null);
      }
    });
  }

  private prependPayment(payment: PaymentRecord) {
    const updated = [payment, ...this.recentPayments()];
    this.recentPayments.set(this.sortPayments(updated));
  }

  private replacePayment(updatedPayment: PaymentRecord) {
    this.recentPayments.set(
      this.sortPayments(
        this.recentPayments().map((payment) =>
          payment.billing_id === updatedPayment.billing_id ? updatedPayment : payment
        )
      )
    );
  }

  private sortPayments(payments: PaymentRecord[]): PaymentRecord[] {
    return [...payments]
      .sort((first, second) => (second.payment_id || 0) - (first.payment_id || 0))
      .slice(0, 6);
  }

  private sortBillings(billings: BillingRecord[]): BillingRecord[] {
    return [...billings].sort((first, second) => (second.bill_id || 0) - (first.bill_id || 0));
  }

  private createInitialForm() {
    return {
      billing_id: '',
      student_id: '',
      student_name: '',
      fee_name: '',
      total_fee: null as number | null,
      total_amount: null as number | null,
      payment_method: null as string | null
    };
  }

  private createInitialEditForm() {
    return {
      total_amount: null as number | null,
      additional_amount: null as number | null,
      payment_method: 'Cash'
    };
  }

  toggleEditAdditionalAmount() {
    this.showEditAdditionalAmount.set(!this.showEditAdditionalAmount());
  }

  private generateBillingId(student: StudentRecord): string {
    const studentToken = student.student_id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'STU';
    const shortSuffix = String(Math.floor(Math.random() * 100)).padStart(2, '0');

    return `BILL-${studentToken}-${shortSuffix}`;
  }

  private generateBillingIdFromCurrentSelection(): string {
    const selectedStudent = this.students().find((student) => student.student_id === this.selectedStudentId());

    if (!selectedStudent) {
      return '';
    }

    return this.generateBillingId(selectedStudent);
  }

  private sortStudents(students: StudentRecord[]): StudentRecord[] {
    return [...students].sort((first, second) => first.student_name.localeCompare(second.student_name));
  }

  private storeLatestPayment(payment: PaymentRecord) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('cashierweb.latest-payment-context', JSON.stringify({
        billing_id: payment.billing_id,
        student_id: payment.student_id,
        student_name: payment.student_name,
        fee_name: payment.fee_name,
        total_fee: payment.total_fee,
        total_amount: payment.total_amount,
        payment_method: payment.payment_method,
        status: payment.status ?? null,
        balance: payment.balance ?? null,
        created_at: payment.created_at ?? null
      }));
    } catch {
      // Keep payment submission flowing even if browser storage is unavailable.
    }
  }

  private getStudentErrorMessage(error: any): string {
    const validationErrors = error?.error?.errors;

    if (validationErrors && typeof validationErrors === 'object') {
      const firstFieldError = Object.values(validationErrors).flat()[0];
      if (typeof firstFieldError === 'string') {
        return firstFieldError;
      }
    }

    return error?.error?.message || 'Unable to load students right now.';
  }

  private getErrorMessage(error: any): string {
    const validationErrors = error?.error?.errors;

    if (validationErrors && typeof validationErrors === 'object') {
      const firstFieldError = Object.values(validationErrors).flat()[0];
      if (typeof firstFieldError === 'string') {
        return firstFieldError;
      }
    }

    return error?.error?.message || 'Unable to save payment right now.';
  }
}
