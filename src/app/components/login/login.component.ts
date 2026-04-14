import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, CommonModule],
  template: `
    <section class="min-h-screen bg-white text-slate-950">
      <div class="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <div class="relative hidden overflow-hidden bg-slate-950 text-white lg:block">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_30%)]"></div>
          <div class="relative flex h-full flex-col justify-between p-10">
            <a routerLink="/" class="inline-flex w-fit items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <span class="text-lg font-black">C</span>
              </div>
              <div>
              <p class="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">SCHOOL CASHIER</p>
                <p class="text-sm text-slate-400">Login</p>
              </div>
            </a>

          <div class="relative flex h-full flex-col items-start justify-center gap-12 p-10">
              <p class="text-sm uppercase tracking-[0.35em] text-blue-300">Cashier Login</p>
              <h1 class="mt-5 text-5xl font-black leading-tight text-white">
                Welcome back, Login your account.
              </h1>
             
            </div>

           
          </div>
        </div>

        <div class="flex items-center justify-center px-6 py-10 sm:px-10">
          <div class="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-950/30 sm:p-8">
            <div class="mb-8">
              <a routerLink="/" class="text-sm font-medium text-sky-700 hover:text-sky-600">Back to landing page</a>
              <h2 class="text-3xl mt-9 text-center font-black text-slate-950">LOGIN</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">
               
              </p>
            </div>

            <form class="space-y-5" (ngSubmit)="onSubmit()">
              <div>
                <label for="email" class="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  [(ngModel)]="email"
                  (input)="clearError()"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder="cashier@example.com"
                />
              </div>

              <div>
                <div class="mb-2 flex items-center justify-between">
                  <label for="password" class="block text-sm font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    class="text-xs font-semibold text-sky-700 hover:text-sky-600"
                    (click)="togglePasswordVisibility()"
                  >
                    {{ showPassword ? 'Hide' : 'Show' }}
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  [type]="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  [(ngModel)]="password"
                  (input)="clearError()"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder="Enter your password"
                />
              </div>

              @if (authService.error()) {
                <div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {{ authService.error() }}
                </div>
              }

              <button
                type="submit"
                [disabled]="authService.isLoading()"
                class="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                @if (authService.isLoading()) {
                  <span class="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                }
               login
              </button>
            </form>

            <div class="mt-8 rounded-3xl bg-slate-100 p-5">
              <p class="text-sm text-slate-600">
                No cashier account yet?
                <a routerLink="/register" class="font-semibold text-sky-700 hover:text-sky-600">Create one here</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;

  constructor(public authService: AuthService) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.authService.error.set('Please fill in all fields');
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      error: () => {
        // Error handling is done in the service
      }
    });
  }

  clearError() {
    this.authService.clearError();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
