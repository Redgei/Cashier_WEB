import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="relative min-h-screen overflow-hidden bg-white text-slate-950">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.06),_transparent_28%)]"></div>
      <div class="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-blue-100/70 to-transparent"></div>

      <div class="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <span class="text-lg font-black">C</span>
            </div>
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">SCHOOL CASHIER </p>
              <p class="text-sm text-slate-600">Payment collection and processing</p>
            </div>
          </div>

          <div class="hidden items-center gap-3 sm:flex">
            <a
              routerLink="/login"
              class="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-900 transition hover:border-blue-500 hover:text-blue-600"
            >
              Login
            </a>
          </div>
        </header>

        <div class="grid flex-1 items-center gap-14 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
          <div class="max-w-3xl">
            <span class="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              Built for school cashier workflows
            </span>

            <h1 class="mt-8 text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
             Simplify payments for students using the convenient and safe School Cashier System.
            </h1>

            <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            For accepting student payments, Generate Official Receipts, Student Payment Installments tracking and Processing Refunds.
            </p>

            <div class="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                routerLink="/register"
                 >
             
              </a>
              <a
                routerLink="/login"
                 >
            
              </a>
            </div>

            <div class="mt-12 grid gap-4 sm:grid-cols-3">
              <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p class="text-sm font-semibold text-blue-700">Secure and Safety Access</p>
                <p class="mt-2 text-sm leading-6 text-slate-600">Manage cashier access with secure authentication.</p>
              </article>
              <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p class="text-sm font-semibold text-blue-700">New Cashier Registration</p>
                <p class="mt-2 text-sm leading-6 text-slate-600">New cashiers can register with name, email, and password in seconds.</p>
              </article>
              <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p class="text-sm font-semibold text-blue-700">Easy Navigating </p>
                <p class="mt-2 text-sm leading-6 text-slate-600">Intuitive interface designed for seamless navigation.</p>
              </article>
            </div>
          </div>

          <aside class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-blue-300/70">
            <div class="rounded-[1.5rem] bg-black-950 p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-slate-400"></p>
                  <h2 class="mt-1 text-2xl font-bold text-blue-500">Cashier Operations</h2>
                </div>
                
              </div>

              <div class="mt-8 space-y-4">
                <div class="rounded-2xl border border-blue-200 bg-white/5 p-4">
                  <p class="text-sm text-blue-400">Authentication</p>
                  <p class="mt-2 text-lg font-semibold text-black">cashier can register and login account </p>
                </div>
                <div class="rounded-2xl border border-blue-200 bg-white/5 p-4">
                  <p class="text-sm text-blue-400">Payments</p>
                  <p class="mt-2 text-lg font-semibold text-black">accept payments and generate official receipts </p>
                </div>
                <div class="rounded-2xl border border-blue-200 bg-white/5 p-4">
                  <p class="text-sm text-blue-400">Transactions</p>
                  <p class="mt-2 text-lg font-semibold text-black">track payment installments and manage all student payments</p>
                </div>
                 <div class="rounded-2xl border border-blue-200 bg-white/5 p-4">
                  <p class="text-sm text-blue-400">Refunds</p>
                  <p class="mt-2 text-lg font-semibold text-black">process refunds for student payments</p>
                </div>
              
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `
})
export class LandingComponent {}
