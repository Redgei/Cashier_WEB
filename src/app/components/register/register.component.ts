import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, CommonModule],
  template: `
    <section class="min-h-screen bg-white text-slate-900">
      @if (successNotice()) {
        <div class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="animate-[fadeout_2s_ease-in-out_forwards] rounded-2xl border border-blue-200 bg-white px-6 py-4 text-sm font-semibold text-blue-700 shadow-2xl shadow-blue-100">
            {{ successNotice() }}
          </div>
        </div>
      }

      <div class="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <div class="relative hidden justify-content overflow-hidden bg-slate-950 text-white lg:block">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.24),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_35%)]"></div>
          <div class="relative flex h-full flex-col justify-between p-10">
            <a routerLink="/" class="inline-flex w-fit items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <span class="text-lg font-black">C</span>
              </div>
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">SCHOOL CASHIER</p>
                <p class="text-sm text-slate-400">Register</p>
              </div>
            </a>

           <div class="relative flex h-full flex-col items-start justify-center gap-9 p-10">
              <p class="text-sm  uppercase tracking-[0.35em] text-blue-300">Cashier Registration</p>
              <h1 class="mt-5 text-5xl font-black leading-tight text-white">
                Register a new cashier account.
              </h1>
            
            </div>

          </div>
        </div>

        <div class="flex items-center justify-center px-6 py-10 sm:px-10">
          <div class="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-300 sm:p-8">
            <div class="mb-8">
              <a routerLink="/" class="text-sm font-medium text-blue-700 hover:text-blue-600">Back to landing page</a>
              <h2 class="mt-10 text-center text-3xl font-black text-slate-950">Register Cashier Account</h2>
            
            </div>

            <form class="grid gap-5 sm:grid-cols-2" (ngSubmit)="onSubmit()">
              <div class="sm:col-span-2">
                <label for="name" class="mb-2 block text-sm font-semibold text-slate-700">Fullname</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autocomplete="name"
                  required
                  [(ngModel)]="name"
                  (input)="clearError()"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="your fullname"
                />
              </div>

              <div class="sm:col-span-2">
                <label for="email" class="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  [(ngModel)]="email"
                  (input)="clearError()"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="cashier@example.com"
                />
              </div>

              <div class="sm:col-span-2">
                <label for="password" class="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  id="password"
                  name="password"
                  [type]="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  required
                  [(ngModel)]="password"
                  (input)="clearError()"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div class="sm:col-span-2 flex items-center justify-end rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                <button type="button" class="font-semibold text-blue-700 hover:text-blue-600" (click)="togglePasswordVisibility()">
                  {{ showPassword ? 'Hide password' : 'Show password' }}
                </button>
              </div>

              @if (formError()) {
                <div class="sm:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {{ formError() }}
                </div>
              }

              <div class="sm:col-span-2">
                <button
                  type="submit"
                  [disabled]="isSubmitting()"
                  class="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  @if (isSubmitting()) {
                    <span class="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                  }
                  Create Account
                </button>
              </div>
            </form>

            <div class="mt-8 rounded-3xl bg-slate-100 p-5">
              <p class="text-sm text-slate-600">
                Already registered?
                <a routerLink="/login" class="font-semibold text-blue-700 hover:text-blue-600">Go to login</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})

export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  showPassword = false;
  formError = signal<string | null>(null);
  isSubmitting = signal(false);
  successNotice = signal<string | null>(null);

  onSubmit() {
    if (!this.name || !this.email || !this.password) {
      this.formError.set('Please fill in all fields');
      return;
    }

    this.formError.set(null);
    this.isSubmitting.set(true);

    setTimeout(() => {
      this.name = '';
      this.email = '';
      this.password = '';
      this.successNotice.set('Registration form submitted (UI only).');
      this.isSubmitting.set(false);
      setTimeout(() => this.successNotice.set(null), 2000);
    }, 300);
  }

  clearError() {
    this.formError.set(null);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
